import assert from "node:assert/strict";
import test from "node:test";
import { ENCOUNTERS, REPRESENTATIVE_IDS } from "./tracking/encounters.ts";
import { COVER } from "./tracking/habitat.ts";
import { PROFILE_LIST, PROFILES } from "./tracking/profiles.ts";
import {
  IDLE_ACTIONS,
  POINTS,
  animalPosition,
  assessThreat,
  createSession,
  dist,
  footing,
  huntBlockers,
  laidSigns,
  nearestPocket,
  nonlethalCeiling,
  pointFrom,
  readSign,
  readWind,
  resolveChoice,
  restToNextAfternoon,
  shotReach,
  sit,
  tick,
} from "./tracking/sim.ts";

const HABITATS = ["woods", "orchard", "marsh", "field", "water"];

test("twelve profiles and eighteen circuits cover every habitat", () => {
  assert.equal(PROFILE_LIST.length, 12);
  assert.equal(ENCOUNTERS.length, 18);
  assert.deepEqual([...new Set(ENCOUNTERS.map((e) => e.habitat))].sort(), [...HABITATS].sort());
  for (const id of REPRESENTATIVE_IDS) {
    assert.ok(ENCOUNTERS.some((e) => e.id === id));
  }
  for (const enc of ENCOUNTERS) {
    assert.ok(PROFILES[enc.profileId], enc.id);
    assert.ok(enc.route.length >= 2, enc.id);
    assert.ok(enc.escape.length >= 2, enc.id);
    assert.ok(enc.signs.length >= 2, enc.id);
    assert.ok(enc.resettleMinutes >= 45, enc.id);
    assert.equal("trailGlow" in enc, false);
    for (let i = 1; i < enc.route.length; i++) {
      assert.ok(enc.route[i].atMinute >= enc.route[i - 1].atMinute, enc.id);
    }
    for (const s of enc.signs) {
      assert.equal(/glow|waypoint|coordinate/i.test(s.hint), false, s.id);
    }
  }
});

test("grouse page is the verified ruffed bird, not endangered spruce", () => {
  const g = PROFILES.grouse;
  assert.equal(g.ecologyLabel, "verified");
  assert.match(g.ecology, /Spruce grouse/);
  assert.match(g.ecology, /Essex/);
  assert.match(g.ecology, /Addison/);
  assert.ok(g.sources.some((s) => s.url?.includes("vtfishandwildlife.com")));
  assert.equal(g.quarry, true);
});

test("a sign names direction and age, never a plotted animal", () => {
  const session = createSession();
  const ev = tick(session, 0.016, { ...IDLE_ACTIONS, read: true });
  const text = ev.map((e) => e.text).join(" ");
  assert.match(text, /Red fox/i);
  assert.match(text, /northeast/i);
  assert.match(text, /recent|fresh|hours|cold/i);
  assert.equal("x" in ev[0], false);
  assert.equal(/glow/i.test(text), false);
  const deer = ENCOUNTERS.find((e) => e.id === "deer-hemlock-apple")!;
  const future = deer.signs.find((s) => s.id === "deer-track-woods")!;
  session.player.x = future.x;
  session.player.y = future.y;
  const early = readSign(session, deer.id, future.id);
  assert.match(early.text, /not been laid|ahead of the animal/i);
});

test("deer scent is the pocket wind, not a global weather flag", () => {
  const enc = ENCOUNTERS.find((e) => e.id === "deer-hemlock-apple")!;
  const profile = PROFILES.deer;
  const animal = { x: 2320, y: 1040 };
  const up = pointFrom(animal, enc.wind.fromDeg, 90);
  const down = pointFrom(animal, (enc.wind.fromDeg + 180) % 360, 90);
  const upT = assessThreat(enc, profile, animal, up, "still");
  const downT = assessThreat(enc, profile, animal, down, "still");
  assert.ok(upT.scent > 0.34, `upwind scent ${upT.scent}`);
  assert.equal(upT.primary, "scent");
  assert.ok(downT.scent < 0.05, `downwind scent ${downT.scent}`);
  assert.ok(downT.total < 0.2, `downwind total ${downT.total}`);

  const other = ENCOUNTERS.find((e) => e.id === "deer-alfalfa-edge")!;
  assert.notEqual(other.wind.fromDeg, enc.wind.fromDeg);
});

test("turkey is a sight animal; cover hides it; scent does not", () => {
  const enc = ENCOUNTERS.find((e) => e.id === "turkey-oak-scratch")!;
  const profile = PROFILES.turkey;
  const openAnimal = { x: 1400, y: 980 };
  const walker = { x: 1400, y: 1080 };
  const seen = assessThreat(enc, profile, openAnimal, walker, "walk");
  assert.ok(seen.sight > 0.34, `sight ${seen.sight}`);
  assert.ok(seen.scent < 0.1, `scent ${seen.scent}`);
  const tree = COVER.find((c) => c.x > 2100);
  assert.ok(tree);
  const hidden = assessThreat(enc, profile, { x: tree.x, y: tree.y }, { x: tree.x + tree.r + 40, y: tree.y }, "walk");
  assert.equal(hidden.sight, 0);
});

test("grouse flush is leaves and hearing, not scent", () => {
  const enc = ENCOUNTERS.find((e) => e.id === "grouse-drum-line")!;
  const profile = PROFILES.grouse;
  const animal = { x: 2300, y: 400 };
  const loud = assessThreat(enc, profile, animal, { x: 2360, y: 400 }, "walk");
  const quiet = assessThreat(enc, profile, animal, { x: 2360, y: 400 }, "still");
  assert.ok(loud.sound > 0.34, `sound ${loud.sound}`);
  assert.equal(loud.primary, "sound");
  assert.ok(quiet.sound < 0.2, `quiet ${quiet.sound}`);
  assert.ok(loud.scent < 0.1);
});

test("flight is a path, then a long resettle, then a walk back — not a respawn", () => {
  const session = createSession();
  const enc = ENCOUNTERS.find((e) => e.id === "deer-hemlock-apple")!;
  const rt = session.animals[enc.id];
  const pos = animalPosition(enc, rt, session.minute);
  assert.ok(pos);
  const up = pointFrom(pos, enc.wind.fromDeg, 34);
  session.player.x = up.x;
  session.player.y = up.y;
  const ev = tick(session, 0.05, { ...IDLE_ACTIONS, stance: "rush" });
  assert.equal(rt.state, "flight");
  assert.ok(rt.flightT > 0 && rt.flightT < 0.2);
  assert.match(ev.map((e) => e.text).join(" "), /wind/i);
  const mid = animalPosition(enc, rt, session.minute)!;
  assert.ok(dist(mid, enc.escape[enc.escape.length - 1]) > 40);

  let left = 6;
  while (left > 0) {
    const dt = Math.min(0.05, left);
    tick(session, dt, { ...IDLE_ACTIONS, stance: "still" });
    left -= dt;
  }
  assert.equal(rt.state, "loafing");
  const before = session.minute;
  session.minute = before + enc.resettleMinutes - 5;
  session.player.x = 40;
  session.player.y = 40;
  tick(session, 0.05, IDLE_ACTIONS);
  assert.equal(rt.state, "loafing");
  session.minute = before + enc.resettleMinutes + 2;
  tick(session, 0.05, IDLE_ACTIONS);
  assert.equal(rt.state, "returning");
  left = enc.returnSeconds + 0.2;
  while (left > 0) {
    const dt = Math.min(0.05, left);
    tick(session, dt, IDLE_ACTIONS);
    left -= dt;
  }
  assert.equal(rt.state, "on-route");
  const back = animalPosition(enc, rt, session.minute)!;
  assert.ok(dist(back, enc.route[0]) < 24, `back at ${back.x},${back.y}`);
});

test("watching and sketching beat a clean kill, and a kill does not come back", () => {
  for (const profile of PROFILE_LIST) {
    assert.ok(nonlethalCeiling(profile) > POINTS.hunt, profile.id);
    assert.ok(nonlethalCeiling(profile) >= POINTS.observe);
  }
  const session = createSession();
  const fox = ENCOUNTERS.find((e) => e.id === "fox-meadow-pounce")!;
  const fr = session.animals[fox.id];
  fr.identified = true;
  fr.discovered = true;
  fr.windowHold = 8;
  const pose = animalPosition(fox, fr, session.minute)!;
  session.player.x = pose.x;
  session.player.y = pose.y + 40;
  session.player.stance = "still";
  const watched = resolveChoice(session, fox.id, "sketch");
  assert.ok((watched.points ?? 0) >= POINTS.observe + POINTS.sketch - 0.1);
  assert.equal(fr.state, "on-route");
  assert.equal(fr.awarded.hunt, false);

  const deer = ENCOUNTERS.find((e) => e.id === "deer-alfalfa-edge")!;
  session.minute = 1000;
  const dr = session.animals[deer.id];
  dr.identified = true;
  const dpos = animalPosition(deer, dr, session.minute)!;
  session.player.x = dpos.x;
  session.player.y = dpos.y + 70;
  session.player.stance = "still";
  assert.equal(huntBlockers(session, deer), null);
  const before = session.points;
  const killed = resolveChoice(session, deer.id, "hunt");
  assert.equal(killed.points, POINTS.hunt);
  assert.ok((watched.points ?? 0) > (killed.points ?? 0));
  assert.equal(dr.state, "absent");
  assert.equal(session.points, before + POINTS.hunt);
  const again = resolveChoice(session, deer.id, "observe");
  assert.match(again.text, /gone/i);
  restToNextAfternoon(session);
  assert.equal(session.animals[deer.id].state, "absent");
  assert.equal(session.animals[fox.id].state, "on-route");
  const pointsAfterRest = session.points;
  session.player.x = animalPosition(fox, session.animals[fox.id], session.minute)!.x;
  session.player.y = animalPosition(fox, session.animals[fox.id], session.minute)!.y + 30;
  session.player.stance = "still";
  resolveChoice(session, fox.id, "observe");
  assert.equal(session.points, pointsAfterRest);
});

test("a bobcat is not a legal shot in this October pocket", () => {
  const session = createSession();
  const enc = ENCOUNTERS.find((e) => e.id === "bobcat-ledge")!;
  const rt = session.animals[enc.id];
  rt.identified = true;
  const pos = animalPosition(enc, rt, session.minute)!;
  session.player.x = pos.x + 40;
  session.player.y = pos.y;
  session.player.stance = "still";
  const why = huntBlockers(session, enc);
  assert.match(why ?? "", /No shot|January|closed/i);
  const ev = resolveChoice(session, enc.id, "hunt");
  assert.equal(ev.points, POINTS.stain);
  assert.ok(session.points < 0);
  assert.equal(rt.state, "flight");
});

test("a botched stalk does not pay, and a shot is local", () => {
  const session = createSession();
  session.minute = 1000;
  const deer = ENCOUNTERS.find((e) => e.id === "deer-alfalfa-edge")!;
  const rt = session.animals[deer.id];
  rt.identified = true;
  const pos = animalPosition(deer, rt, session.minute)!;
  session.player.x = pos.x;
  session.player.y = pos.y + 60;
  session.player.stance = "rush";
  const ev = resolveChoice(session, deer.id, "hunt");
  assert.equal(ev.points, undefined);
  assert.match(ev.text, /moving/i);
  assert.equal(rt.state, "on-route");
  assert.equal(session.shots, 0);

  session.player.stance = "still";
  const fox = ENCOUNTERS.find((e) => e.id === "fox-meadow-pounce")!;
  const otter = ENCOUNTERS.find((e) => e.id === "otter-slide-creek")!;
  const foxPos = animalPosition(fox, session.animals[fox.id], session.minute)!;
  const foxReach = shotReach(fox, PROFILES.fox, dist(session.player, foxPos));
  const otterPos = animalPosition(otter, session.animals[otter.id], session.minute);
  const otterReach = otterPos ? shotReach(otter, PROFILES.otter, dist(session.player, otterPos)) : "none";
  assert.equal(shotReach(fox, PROFILES.fox, 200), "flight");
  assert.equal(shotReach(fox, PROFILES.fox, 700), "wary");
  assert.equal(shotReach(otter, PROFILES.otter, 800), "none");
  resolveChoice(session, deer.id, "hunt");
  if (foxReach === "flight") assert.equal(session.animals[fox.id].state, "flight");
  else if (foxReach === "wary") assert.equal(session.animals[fox.id].state, "wary");
  else assert.equal(session.animals[fox.id].state, "on-route");
  assert.match(session.log.map((l) => l.text).join(" "), /shot/i);
  if (otterReach === "none") assert.equal(session.animals[otter.id].state, "on-route");
});

test("a box only pays if you set it ahead and leave", () => {
  const session = createSession();
  const enc = ENCOUNTERS.find((e) => e.id === "cottontail-brush-row")!;
  const rt = session.animals[enc.id];
  rt.identified = true;
  const future = enc.route[2];
  session.player.x = future.x;
  session.player.y = future.y;
  const placed = resolveChoice(session, enc.id, "capture");
  assert.match(placed.text, /Box set/i);
  assert.ok(rt.trap);
  session.player.x = future.x;
  session.player.y = future.y + 40;
  session.minute = future.atMinute;
  tick(session, 0.05, { ...IDLE_ACTIONS, stance: "still" });
  assert.equal(rt.awarded.capture, false);

  const clean = createSession();
  const crt = clean.animals[enc.id];
  crt.identified = true;
  crt.trap = { x: future.x, y: future.y };
  clean.player.x = future.x;
  clean.player.y = future.y + 400;
  clean.player.stance = "still";
  clean.minute = future.atMinute;
  tick(clean, 0.05, IDLE_ACTIONS);
  assert.equal(crt.awarded.capture, true);
  assert.equal(crt.state, "on-route");
  assert.ok(clean.points >= POINTS.capture);
});

test("wind is per pocket and does not locate the animal", () => {
  const session = createSession();
  session.player.x = 1240;
  session.player.y = 1040;
  const fox = readWind(session);
  assert.match(fox.text, /north/i);
  assert.match(fox.text, /does not tell you where/i);
  session.player.x = 360;
  session.player.y = 1040;
  const otter = readWind(session);
  assert.match(otter.text, /east/i);
  assert.notEqual(fox.text, otter.text);
  session.player.x = 20;
  session.player.y = 20;
  const none = readWind(session);
  assert.match(none.text, /between pockets/i);
  assert.equal(nearestPocket(20, 20), null);
  assert.equal(/fox|deer|otter/i.test(none.text), false);
});

test("sitting moves the clock and the deer, not the player, and does not pop a new animal", () => {
  const session = createSession();
  const deer = ENCOUNTERS.find((e) => e.id === "deer-hemlock-apple")!;
  const before = animalPosition(deer, session.animals[deer.id], session.minute)!;
  const px = session.player.x;
  const startSigns = laidSigns(deer, session.animals[deer.id], session.minute).length;
  sit(session, 50);
  assert.equal(session.player.x, px);
  assert.ok(session.minute > 16 * 60 + 10 + 40);
  const after = animalPosition(deer, session.animals[deer.id], session.minute)!;
  assert.ok(dist(before, after) > 30, "deer should have left the bed");
  const laterSigns = laidSigns(deer, session.animals[deer.id], session.minute).length;
  assert.ok(laterSigns >= startSigns);
  assert.notEqual(session.animals[deer.id].state, "absent");
});

test("a field note keeps the bearing, and footing never names the animal", () => {
  const session = createSession();
  const ev = readSign(session, "fox-meadow-pounce", "fox-m-track");
  assert.ok(ev.page);
  assert.equal(ev.page?.bearing, 40);
  assert.match(ev.page?.who ?? "", /fox/i);
  assert.equal("x" in (ev.page ?? {}), false);
  const boot = footing(session);
  assert.equal(boot.noiseWord, "quiet");
  assert.equal(boot.windFrom, null);
  assert.equal(/fox|deer|otter/i.test(JSON.stringify(boot)), false);
  readWind(session);
  const known = footing(session);
  assert.equal(known.windFrom, "north");
  assert.equal(known.scentTravels, "south");
  assert.equal(/fox|deer|otter/i.test(JSON.stringify(known)), false);
});
