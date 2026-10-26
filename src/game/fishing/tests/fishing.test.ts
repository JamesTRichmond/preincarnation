import assert from "node:assert/strict";
import { test } from "node:test";
import { CREEL_LIMIT, GEAR, GEAR_BY_ID } from "../data/gear.ts";
import { LOCATIONS, LOCATIONS_BY_ID } from "../data/locations.ts";
import { SPECIES, SPECIES_BY_ID } from "../data/species.ts";
import { createBite, stepBite } from "../sim/bite.ts";
import { castLanding } from "../sim/cast.ts";
import { drainRewards, resolveCatch } from "../sim/catch.ts";
import { simulateFight } from "../sim/fight.ts";
import { rankSpecies } from "../sim/fit.ts";
import { EMPTY_ACTIONS, axisFromCodes } from "../sim/input.ts";
import { loadSession, memoryStorage, parseSession, writeSave } from "../sim/save.ts";
import {
  applyFocusLoss,
  beginTownHole,
  createSession,
  debugHook,
  debugLand,
  keepFish,
  releaseFish,
  stepSession,
  swapFish,
} from "../sim/session.ts";
import { TENSION_ABS_MAX, stepTension } from "../sim/tension.ts";
import type { BiteRuntime, FishProfile } from "../sim/types.ts";
import { FISHING_CONTRACT } from "../index.ts";

const baseTension = {
  tension: 0.2,
  fishForce: 0.4,
  pressure: 0.5,
  giveLine: false,
  ceiling: 0.8,
  dt: 1 / 60,
  overSeconds: 0,
  grace: 0.2,
};

test("impossible tension stays finite and slack wins", () => {
  const nan = stepTension({ ...baseTension, tension: Number.NaN });
  assert.equal(nan.flags.includes("nan-reset"), true);
  assert.ok(Number.isFinite(nan.tension));
  assert.ok(nan.tension >= 0 && nan.tension <= TENSION_ABS_MAX);

  const high = stepTension({ ...baseTension, tension: 999, fishForce: 1, pressure: 1 });
  assert.ok(high.tension <= TENSION_ABS_MAX);
  assert.equal(high.flags.includes("clamped-high"), true);

  const low = stepTension({ ...baseTension, tension: -8 });
  assert.ok(low.tension >= 0);
  assert.equal(low.flags.includes("clamped-low"), true);

  const infForce = stepTension({ ...baseTension, fishForce: Number.POSITIVE_INFINITY, pressure: 1 });
  assert.ok(Number.isFinite(infForce.tension));
  assert.ok(infForce.fishForce <= 1);

  const slack = stepTension({ ...baseTension, giveLine: true, pressure: 1, fishForce: 0.9, ceiling: 0.4 });
  assert.ok(slack.appliedPressure <= 0.12);
  assert.equal(slack.flags.includes("slack-priority"), true);

  const badDt = stepTension({ ...baseTension, dt: -2 });
  assert.ok(Number.isFinite(badDt.tension));
  assert.equal(badDt.flags.includes("dt-clamped"), true);

  const badCeiling = stepTension({ ...baseTension, ceiling: 0, fishForce: 1, pressure: 1, grace: 0 });
  assert.equal(badCeiling.snapped, false);
  assert.equal(badCeiling.flags.includes("bad-ceiling"), true);

  const snap = stepTension({
    ...baseTension,
    tension: 0.95,
    fishForce: 1,
    pressure: 1,
    ceiling: 0.4,
    grace: 0,
    dt: 0.05,
  });
  assert.equal(snap.snapped, true);
  assert.ok(snap.tension <= TENSION_ABS_MAX);
});

test("a fight has one outcome, never snap and land together", () => {
  for (const species of SPECIES) {
    for (const policy of ["horse", "smart"] as const) {
      const trace = simulateFight(species.id, "spinning-spoon", policy, 7);
      assert.equal(["fighting", "landed", "snap", "spit", "cover"].includes(trace.outcome), true);
      assert.equal(trace.outcome === "landed" && trace.peakTension > 0.95 + 0.02, false);
    }
  }
  const pike = simulateFight("northern-pike", "spinning-spoon", "horse", 3);
  assert.equal(pike.outcome, "snap");
  const seed = simulateFight("pumpkinseed", "willow-worm", "horse", 3);
  assert.equal(seed.outcome, "landed");
  const brownWillow = simulateFight("brown-trout", "willow-worm", "horse", 4);
  assert.equal(brownWillow.outcome, "snap");
  const brownSpoon = simulateFight("brown-trout", "spinning-spoon", "horse", 4);
  assert.equal(brownSpoon.outcome, "landed");
  const brownSmart = simulateFight("brown-trout", "willow-worm", "smart", 4);
  assert.equal(brownSmart.outcome, "landed");
});

test("twelve behaviors and eighteen waters are played, not just listed", () => {
  assert.equal(FISHING_CONTRACT.dataOnlyIds.length, 0);
  assert.equal(SPECIES.length, 12);
  assert.equal(LOCATIONS.length, 18);
  assert.equal(GEAR.length, 5);
  const bites = new Set(SPECIES.map((species) => JSON.stringify(species.bite)));
  const fights = new Set(
    SPECIES.map((species) =>
      [species.opening, species.pull, species.jump, species.cover, species.sulk, species.stamina].join("|"),
    ),
  );
  assert.equal(bites.size, 12);
  assert.equal(fights.size, 12);
  for (const species of SPECIES) {
    const trace = simulateFight(species.id, species.motion === "dead" ? "handline-dough" : "spinning-spoon", "smart", 11);
    assert.equal(trace.outcome, "landed", `${species.id} smart policy ended ${trace.outcome}`);
    const missed = playBite(species, true, "none");
    const patient = playBite(species, true, "patient");
    assert.equal(missed, "miss", species.id);
    assert.equal(patient, "hooked", species.id);
  }
  for (const loc of LOCATIONS) {
    const spot = loc.spots.find((item) => item.sweet);
    const gear = GEAR_BY_ID[loc.outfit];
    assert.ok(spot);
    assert.ok(gear);
    assert.equal(loc.spots.filter((item) => item.sweet).length, 1);
    for (const id of loc.speciesIds) assert.ok(SPECIES_BY_ID[id], id);
    const ranked = rankSpecies(loc, spot!, gear!, loc.hour);
    assert.ok((ranked[0]?.score ?? 0) >= 0.35, `${loc.id} ${JSON.stringify(ranked.slice(0, 3))}`);
  }
});

test("three waters and four fish do not behave alike", () => {
  const brook = top("new-haven-pocket", "brook-wet");
  const pickerel = top("dead-creek-weeds", "spinning-spoon");
  const pout = top("lemon-fair-dusk", "handline-dough");
  assert.equal(brook, "brook-trout");
  assert.equal(pickerel, "chain-pickerel");
  assert.equal(pout, "brown-bullhead");
  assert.equal(new Set([brook, pickerel, pout]).size, 3);

  const pocket = LOCATIONS_BY_ID["new-haven-pocket"]!;
  const spot = pocket.spots.find((item) => item.sweet)!;
  const wet = rankSpecies(pocket, spot, GEAR_BY_ID["brook-wet"]!, pocket.hour)[0]!;
  const spoon = rankSpecies(pocket, spot, GEAR_BY_ID["spinning-spoon"]!, pocket.hour).find((row) => row.id === "brook-trout");
  assert.ok(wet.id === "brook-trout");
  assert.ok((spoon?.score ?? 0) + 0.3 < wet.score);

  const traces = ["brook-trout", "brown-bullhead", "northern-pike", "pumpkinseed"].map((id) =>
    simulateFight(id, "spinning-spoon", "smart", 5),
  );
  const signatures = traces.map((trace) => `${trace.jumps}:${trace.states}`);
  assert.equal(new Set(signatures).size, 4);
  assert.ok(traces[1]!.jumps === 0);
  assert.ok(traces[0]!.states !== traces[2]!.states);
});

test("cancelling a cast leaves no lure and no catch", () => {
  const session = createSession(8);
  beginTownHole(session);
  stepSession(session, 0.4, { ...EMPTY_ACTIONS, castHeld: true });
  assert.equal(session.phase, "charging");
  assert.ok(session.cast.power > 0.2);
  stepSession(session, 0.05, { ...EMPTY_ACTIONS, castHeld: true, cancel: true });
  assert.equal(session.phase, "aiming");
  assert.equal(session.cast.power, 0);
  assert.equal(session.cast.phase, "idle");
  assert.equal(session.castsLanded, 0);
  assert.equal(session.pending, null);

  stepSession(session, 0.05, EMPTY_ACTIONS);
  stepSession(session, 0.05, { ...EMPTY_ACTIONS, castHeld: true });
  stepSession(session, 0.05, { ...EMPTY_ACTIONS, castHeld: false });
  assert.equal(session.phase, "aiming");
  assert.equal(session.cast.reason, "short");
  assert.equal(session.castsLanded, 0);

  stepSession(session, 1.2, { ...EMPTY_ACTIONS, castHeld: true });
  stepSession(session, 0.05, { ...EMPTY_ACTIONS, castHeld: false });
  assert.equal(session.phase, "flight");
  stepSession(session, 0.05, { ...EMPTY_ACTIONS, cancel: true });
  assert.equal(session.phase, "aiming");
  assert.equal(session.castsLanded, 0);
});

test("losing focus pauses the fight and cancels a half cast", () => {
  const charging = createSession(9);
  beginTownHole(charging);
  stepSession(charging, 0.5, { ...EMPTY_ACTIONS, castHeld: true });
  assert.equal(charging.phase, "charging");
  applyFocusLoss(charging);
  assert.equal(charging.paused, true);
  assert.equal(charging.phase, "aiming");
  assert.equal(charging.cast.power, 0);
  assert.equal(charging.cast.reason, "focus");
  const power = charging.cast.power;
  stepSession(charging, 0.5, { ...EMPTY_ACTIONS, castHeld: true, pressureHeld: true });
  assert.equal(charging.cast.power, power);
  assert.equal(charging.paused, true);

  const fighting = createSession(10);
  beginTownHole(fighting);
  debugHook(fighting, "northern-pike");
  const tension = fighting.fight?.tension ?? -1;
  applyFocusLoss(fighting);
  stepSession(fighting, 1, { ...EMPTY_ACTIONS, pressureHeld: true });
  assert.equal(fighting.paused, true);
  assert.equal(fighting.fight?.tension, tension);
  assert.equal(fighting.phase, "fight");
});

test("repeated catches do not duplicate food, journal, or rewards", () => {
  const session = createSession(12);
  beginTownHole(session);
  debugLand(session, "pumpkinseed");
  const first = keepFish(session);
  assert.equal(first.ok, true);
  const again = keepFish(session);
  assert.equal(again.ok, false);
  if (!again.ok) assert.equal(again.reason, "duplicate");
  assert.equal(session.save.creel.length, 1);
  assert.equal(session.save.stats.kept, 1);
  const food = session.save.rewardQueue.filter((reward) => reward.kind === "food");
  assert.equal(food.length, 1);
  if (food[0]?.kind === "food") assert.equal(food[0].portions, 1);
  const drained = drainRewards(session.save);
  session.save = drained.save;
  assert.equal(drained.rewards.filter((reward) => reward.kind === "food").length, 1);
  const second = drainRewards(session.save);
  assert.equal(second.rewards.length, 0);

  const duped = {
    ...session.save,
    rewardQueue: [...session.save.rewardQueue, ...drained.rewards, ...drained.rewards],
  };
  const once = drainRewards(duped);
  const keys = once.rewards.map((reward) => `${reward.kind}:${reward.catchId}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("a full creel refuses a fifth keep and accepts a swap", () => {
  const session = createSession(13);
  beginTownHole(session);
  for (let i = 0; i < CREEL_LIMIT; i++) {
    debugLand(session, i % 2 === 0 ? "yellow-perch" : "fallfish");
    const kept = keepFish(session);
    assert.equal(kept.ok, true, `keep ${i}`);
  }
  assert.equal(session.save.creel.length, 4);
  debugLand(session, "pumpkinseed");
  const blocked = keepFish(session);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.reason, "creel-full");
  assert.equal(session.save.creel.length, 4);
  assert.equal(session.save.resolvedIds.includes(session.pending?.id ?? ""), false);
  const released = releaseFish(session);
  assert.equal(released.ok, true);
  assert.equal(session.save.creel.length, 4);

  debugLand(session, "pumpkinseed");
  const discard = session.save.creel[0]!.id;
  const swapped = swapFish(session, discard);
  assert.equal(swapped.ok, true);
  assert.equal(session.save.creel.length, 4);
  assert.equal(session.save.creel.some((item) => item.id === discard), false);
  assert.equal(session.save.creel.some((item) => item.speciesId === "pumpkinseed"), true);
  const portions = session.save.rewardQueue
    .filter((reward) => reward.kind === "food")
    .reduce((sum, reward) => sum + (reward.kind === "food" ? reward.portions : 0), 0);
  assert.equal(portions, 4);
});

test("save and load mid-fight keeps the fish and does not double the creel", () => {
  const session = createSession(21);
  beginTownHole(session);
  debugHook(session, "walleye");
  stepSession(session, 0.4, { ...EMPTY_ACTIONS, pressureHeld: true });
  assert.equal(session.phase, "fight");
  const tension = session.fight?.tension;
  const index = session.fight?.index;
  const storage = memoryStorage();
  assert.equal(writeSave(storage, session).ok, true);
  const loaded = loadSession(storage, () => createSession(1));
  assert.equal(loaded.source, "main");
  assert.equal(loaded.session.phase, "fight");
  assert.equal(loaded.session.fight?.speciesId, "walleye");
  assert.equal(loaded.session.fight?.index, index);
  assert.equal(loaded.session.fight?.tension, tension);
  assert.equal(loaded.session.fight?.catchId, session.fight?.catchId);
  stepSession(loaded.session, 0.2, EMPTY_ACTIONS);
  assert.equal(loaded.session.phase, "fight");
  assert.equal(loaded.session.save.creel.length, 0);

  loaded.session.fight!.outcome = "landed";
  loaded.session.phase = "landed";
  assert.equal(keepFish(loaded.session).ok, true);
  writeSave(storage, loaded.session);
  writeSave(storage, loaded.session);
  const again = loadSession(storage, () => createSession(1));
  assert.equal(again.session.save.creel.length, 1);
  const before = again.session.save.creel.length;
  const replay = resolveCatch(again.session.save, again.session.save.creel[0]!, "keep");
  assert.equal(replay.ok, false);
  if (!replay.ok) assert.equal(replay.reason, "duplicate");
  assert.equal(before, 1);

  storage.setItem("preincarnation.fishing.v1", "{");
  const recovered = loadSession(storage, () => createSession(4));
  assert.equal(recovered.source, "backup");
  assert.equal(recovered.session.save.creel.length, 1);

  const broken = parseSession("nope");
  assert.equal(broken.ok, false);

  const duped = structuredClone(again.session);
  duped.save.creel = [...duped.save.creel, { ...duped.save.creel[0]! }];
  const raw = JSON.stringify({ version: 1, session: duped });
  const repaired = parseSession(raw);
  assert.equal(repaired.ok, true);
  if (repaired.ok) {
    const ids = repaired.session.save.creel.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(repaired.session.save.creel.length <= CREEL_LIMIT);
  }
});

test("A aims left along the bank and a short rod cannot reach the bay", () => {
  assert.equal(axisFromCodes(["KeyA"]).ax, -1);
  assert.equal(axisFromCodes(["KeyD"]).ax, 1);
  assert.equal(axisFromCodes(["ArrowLeft"]).ax, -1);
  const session = createSession(2);
  beginTownHole(session);
  const start = session.aimX;
  stepSession(session, 0.35, { ...EMPTY_ACTIONS, ...axisFromCodes(["KeyA"]) });
  assert.ok(session.aimX < start);

  const near = castLanding(0.36, 0.36, 0.58, 1, GEAR_BY_ID["willow-worm"]!.castRange);
  assert.equal(near.short, false);
  const bay = castLanding(0.46, 0.46, 0.36, 1, GEAR_BY_ID["willow-worm"]!.castRange);
  const spoon = castLanding(0.46, 0.46, 0.36, 1, GEAR_BY_ID["spinning-spoon"]!.castRange);
  assert.equal(bay.short, true);
  assert.equal(spoon.short, false);
});

function top(locationId: string, gearId: string): string {
  const loc = LOCATIONS_BY_ID[locationId]!;
  const spot = loc.spots.find((item) => item.sweet)!;
  return rankSpecies(loc, spot, GEAR_BY_ID[gearId]!, loc.hour)[0]?.id ?? "";
}

function playBite(species: FishProfile, wide: boolean, mode: "hold-all" | "patient" | "none"): BiteRuntime["outcome"] {
  let bite = createBite(species, wide);
  let guard = 0;
  while (bite.outcome === "pending" && guard < 800) {
    const beat = bite.beats[bite.index];
    const hook = mode === "hold-all" ? true : mode === "patient" ? Boolean(beat?.commit) : false;
    bite = stepBite(bite, 0.05, hook);
    guard += 1;
  }
  return bite.outcome;
}
