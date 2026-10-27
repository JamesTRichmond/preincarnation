import assert from "node:assert/strict";
import { test } from "node:test";
import { ACTIVITIES, ROLE_ACTIVITIES, samplePose } from "../src/activities.ts";
import { HUBS } from "../src/hubs.ts";
import { cellKey } from "../src/nav.ts";
import { QUEST_FIXTURES } from "../src/quests.ts";
import type { EraHolder, HubDef } from "../src/types.ts";
import {
  RECOVER_AFTER,
  addEphemeral,
  createHubWorld,
  createWorld,
  loadWorld,
  requestTalk,
  saveWorld,
  setActiveOverrides,
  stateHash,
  step,
  validateHub,
} from "../src/world.ts";

const holder = (
  roleId: string,
  actorId: string | null,
  memory: EraHolder["memory"] = "unmet",
): EraHolder => ({
  eraId: "return.1",
  roleId,
  actorId,
  spokenName: roleId,
  seatLabel: actorId ? "seat" : "no successor in the cast",
  memory,
  provisional: true,
});

test("three plates connect every post to the fallback", () => {
  for (const hub of Object.values(HUBS)) {
    const errors = validateHub(hub, ACTIVITIES);
    assert.deepEqual(errors, [], errors.join("\n"));
  }
});

test("at least twelve role activities actually move", () => {
  assert.ok(ROLE_ACTIVITIES.length >= 12);
  const ids = new Set(ROLE_ACTIVITIES.map((a) => a.id));
  assert.equal(ids.size, ROLE_ACTIVITIES.length);
  for (const activity of ROLE_ACTIVITIES) {
    assert.ok(activity.events.length >= 1, activity.id);
    const a = samplePose(activity, 0);
    const b = samplePose(activity, Math.floor(activity.loopTicks / 2));
    const moved = a.arm !== b.arm || a.reach !== b.reach || a.prop !== b.prop || a.bob !== b.bob;
    assert.ok(moved, `${activity.id} pose is static`);
  }
});

test("no authored beat is a long wait", () => {
  for (const hub of Object.values(HUBS)) {
    for (const routine of hub.routines) {
      for (const beat of routine.steps) assert.ok(beat.ticks <= 24);
    }
  }
});

test("same seedless inputs stay identical", () => {
  const a = createHubWorld("hub.middlebury", "return.3");
  const b = createHubWorld("hub.middlebury", "return.3");
  for (let i = 0; i < 80; i++) {
    step(a);
    step(b);
  }
  assert.equal(stateHash(a), stateHash(b));
  assert.ok(a.log.some((e) => e.kind === "activity"));
});

test("era substitution changes the seat, not the routine", () => {
  const early = createHubWorld("hub.intervale", "return.1");
  const later = createHubWorld("hub.intervale", "return.4");
  const a = early.actors.find((x) => x.roleId === "role.orchard");
  const b = later.actors.find((x) => x.roleId === "role.orchard");
  assert.ok(a && b);
  assert.notEqual(a.actorId, b.actorId);
  assert.equal(a.actorId, "role.orchard#1");
  assert.equal(b.actorId, "role.orchard#4");
  assert.notEqual(a.memory, b.memory);
  assert.equal(a.routineId, b.routineId);
  const routine = HUBS["hub.intervale"].routines.find((r) => r.id === a.routineId)!;
  assert.deepEqual(
    routine.steps.map((s) => s.stationId),
    ["iv.tree", "iv.bin"],
  );
  assert.equal(b.memory, "a name the predecessor kept");
});

test("missing successor becomes a shuttered post", () => {
  const world = createHubWorld("hub.otter", "return.6");
  const rejection = world.rejected.find((r) => r.reason === "missing-successor");
  assert.ok(rejection);
  assert.equal(rejection.roleId, "role.sailmaker");
  const vacant = world.actors.find((a) => a.roleId === "role.sailmaker");
  assert.ok(vacant);
  assert.equal(vacant.mode, "vacant");
  const home = world.hub.stations.find((s) => s.id === "ot.bench")!;
  for (let i = 0; i < 30; i++) step(world);
  assert.equal(vacant.x, home.x);
  assert.equal(vacant.y, home.y);
  assert.equal(vacant.mode, "vacant");
  const talk = requestTalk(world, vacant.actorId, true);
  assert.equal(talk.waitTicks, 0);
  assert.equal(talk.vacant, true);
  assert.match(talk.line, /empty/i);
  assert.equal(world.actors.filter((a) => a.mode !== "vacant").length, 4);
});

test("duplicate actor id keeps one post", () => {
  const hub = HUBS["hub.middlebury"];
  const world = createWorld({
    hub,
    eraId: "return.1",
    holders: [holder("role.miller", "same-hands"), holder("role.cooper", "same-hands")],
    activities: ACTIVITIES,
    bindings: hub.bindings.filter((b) => b.roleId === "role.miller" || b.roleId === "role.cooper"),
  });
  const dupes = world.rejected.filter((r) => r.reason === "duplicate-actor");
  assert.equal(dupes.length, 1);
  assert.equal(world.actors.filter((a) => a.actorId === "same-hands").length, 1);
  assert.equal(world.actors.length, 1);
  for (let i = 0; i < 10; i++) step(world);
  assert.equal(world.actors.length, 1);
});

test("quest conflict keeps the higher priority and still answers", () => {
  const world = createHubWorld("hub.middlebury", "return.2", [
    "fixture.freshet.race",
    "fixture.ledger.green",
  ]);
  const suppressed = world.suppressed.find((s) => s.overrideId === "fixture.ledger.green");
  assert.ok(suppressed);
  assert.equal(suppressed.reason, "lower-priority");
  assert.equal(suppressed.winnerId, "fixture.freshet.race");
  const miller = world.actors.find((a) => a.roleId === "role.miller")!;
  assert.equal(miller.overrideId, "fixture.freshet.race");
  const race = world.hub.stations.find((s) => s.id === "mb.race")!;
  for (let i = 0; i < 30 && (miller.x !== race.x || miller.y !== race.y); i++) step(world);
  assert.equal(miller.x, race.x);
  assert.equal(miller.y, race.y);
  assert.equal(miller.mode, "hold");
  assert.equal(miller.activityId, "sound-the-race");
  const talk = requestTalk(world, miller.actorId, true);
  assert.equal(talk.ok, true);
  assert.equal(talk.waitTicks, 0);
  const loser = QUEST_FIXTURES.find((q) => q.id === "fixture.ledger.green")!;
  assert.equal(loser.blocksTalk, true);
  assert.equal(miller.available, true);
});

test("polite talk can be deferred a few ticks; essential talk cannot", () => {
  const world = createHubWorld("hub.intervale", "return.3");
  const dairy = world.actors.find((a) => a.roleId === "role.dairy")!;
  const loft = world.hub.stations.find((s) => s.id === "iv.loft")!;
  dairy.x = loft.x;
  dairy.y = loft.y;
  dairy.mode = "work";
  dairy.stepIndex = 1;
  dairy.stepTick = 2;
  dairy.talking = false;
  const polite = requestTalk(world, dairy.actorId, false);
  assert.equal(polite.ok, false);
  assert.ok(polite.waitTicks > 0);
  assert.ok(polite.waitTicks <= 8);
  const essential = requestTalk(world, dairy.actorId, true);
  assert.equal(essential.ok, true);
  assert.equal(essential.waitTicks, 0);
  assert.match(essential.line, /Dairy hand/);
});

test("a blocked lane is walked around and never entered", () => {
  const world = createHubWorld("hub.middlebury", "return.1");
  const cooper = world.actors.find((a) => a.roleId === "role.cooper")!;
  // North edge of the cooper's walk to the rack. An east route along y=6 remains.
  addEphemeral(world, {
    id: "wagon",
    cells: [
      { x: 5, y: 7 },
      { x: 6, y: 7 },
      { x: 7, y: 7 },
      { x: 8, y: 7 },
      { x: 9, y: 7 },
    ],
  });
  const banned = new Set(["5,7", "6,7", "7,7", "8,7", "9,7"]);
  const rack = world.hub.stations.find((s) => s.id === "mb.staves")!;
  let reached = false;
  for (let i = 0; i < 40; i++) {
    step(world);
    for (const actor of world.actors) {
      assert.equal(banned.has(cellKey(actor)), false, `${actor.roleId} entered the wagon`);
      assert.equal(world.walk[actor.y]?.[actor.x], true);
    }
    if (cooper.x === rack.x && cooper.y === rack.y) reached = true;
  }
  assert.equal(reached, true);
  assert.equal(cooper.stranded, false);
});

test("a sealed path recovers to the fallback instead of stalling", () => {
  const corridor: HubDef = {
    id: "hub.middlebury",
    plate: "fixture",
    place: "corridor",
    unboundNote: "test only",
    ground: "town",
    w: 8,
    h: 5,
    structures: [],
    waters: [],
    piers: [],
    blocked: [
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 5, y: 1 },
    ],
    stations: [
      { id: "c.start", x: 1, y: 1, name: "start", public: true },
      { id: "c.goal", x: 6, y: 1, name: "goal", public: true },
      { id: "c.fall", x: 1, y: 3, name: "fallback", public: true },
    ],
    fallbackId: "c.fall",
    yards: [],
    greens: [],
    fields: [],
    orchards: [],
    routines: [
      {
        id: "r.clerk",
        roleId: "role.clerk",
        steps: [
          { stationId: "c.start", activityId: "weigh-grain", ticks: 1 },
          { stationId: "c.goal", activityId: "weigh-grain", ticks: 8 },
        ],
      },
    ],
    bindings: [
      { bindingId: "b.clerk", roleId: "role.clerk", routineId: "r.clerk", homeStationId: "c.start" },
    ],
  };
  const world = createWorld({
    hub: corridor,
    eraId: "return.1",
    holders: [holder("role.clerk", "role.clerk#1")],
    activities: ACTIVITIES,
  });
  // A full wall on column x=3. The goal is on the far side; the fallback is not.
  addEphemeral(world, {
    id: "seal",
    cells: [
      { x: 3, y: 0 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
    ],
  });
  const actor = world.actors[0]!;
  const seen: string[] = [];
  for (let i = 0; i < RECOVER_AFTER + 3; i++) {
    step(world);
    seen.push(cellKey(actor));
    for (const cell of corridor.blocked) assert.notEqual(cellKey(actor), cellKey(cell));
    for (const cell of world.ephemeral[0]!.cells) assert.notEqual(cellKey(actor), cellKey(cell));
  }
  assert.equal(actor.stranded, true);
  assert.equal(actor.x, 1);
  assert.equal(actor.y, 3);
  assert.equal(actor.activityId, "mind-the-post");
  assert.ok(world.log.some((e) => e.kind === "recovery"));
  assert.ok(seen.length < 20);
});

test("loading during a routine continues identically", () => {
  const live = createHubWorld("hub.otter", "return.5");
  for (let i = 0; i < 17; i++) step(live);
  const blob = saveWorld(live);
  const restored = loadWorld(blob);
  assert.equal(stateHash(live), stateHash(restored));
  const ferry = restored.actors.find((a) => a.roleId === "role.ferry")!;
  assert.ok(ferry.stepTick > 0 || ferry.mode === "walk" || ferry.stepIndex > 0);
  for (let i = 0; i < 40; i++) {
    step(live);
    step(restored);
    assert.equal(stateHash(live), stateHash(restored));
  }
});

test("a missing station on load or mid-walk falls back", () => {
  const world = createHubWorld("hub.middlebury", "return.1");
  const smith = world.actors.find((a) => a.roleId === "role.smith")!;
  smith.goalStationId = "mb.nowhere";
  smith.mode = "walk";
  smith.path = [];
  smith.blockedTicks = 0;
  step(world);
  const green = world.hub.stations.find((s) => s.id === "mb.green")!;
  assert.equal(smith.stranded, true);
  assert.equal(smith.x, green.x);
  assert.equal(smith.y, green.y);
  assert.ok(world.log.some((e) => e.kind === "recovery"));
});

test("clearing a blocker lets a stranded worker resume the same post", () => {
  const world = createHubWorld("hub.middlebury", "return.1");
  const printer = world.actors.find((a) => a.roleId === "role.printer")!;
  printer.stranded = true;
  printer.x = 11;
  printer.y = 8;
  printer.activityId = "mind-the-post";
  printer.mode = "work";
  step(world);
  const type = world.hub.stations.find((s) => s.id === "mb.type")!;
  let back = false;
  for (let i = 0; i < 20; i++) {
    step(world);
    if (printer.x === type.x && printer.y === type.y && printer.activityId === "set-type") back = true;
  }
  assert.equal(back, true);
  assert.equal(printer.stranded, false);
});

test("turning quests off resumes the routine", () => {
  const world = createHubWorld("hub.middlebury", "return.3", ["fixture.delivery.hold"]);
  const cooper = world.actors.find((a) => a.roleId === "role.cooper")!;
  assert.equal(cooper.overrideId, "fixture.delivery.hold");
  for (let i = 0; i < 5; i++) step(world);
  assert.equal(cooper.stepIndex, 0);
  setActiveOverrides(world, []);
  assert.equal(cooper.overrideId, null);
  const before = cooper.stepIndex;
  let advanced = false;
  for (let i = 0; i < 40; i++) {
    step(world);
    if (cooper.stepIndex !== before) advanced = true;
  }
  assert.equal(advanced, true);
});
