import assert from "node:assert/strict";
import { validatePack } from "./validate.mjs";

function floor() {
  return ["...", "...", "..."];
}

function fsm(id) {
  return {
    id,
    room: "t.r02",
    name: id,
    fsm: {
      initial: "a",
      terminal: "b",
      states: {
        a: { safe: true, terminal: false },
        b: { safe: true, terminal: true },
      },
      edges: [{ from: "a", on: "go", to: "b" }],
      solution: ["go"],
    },
  };
}

function base(mutate) {
  const pack = {
    meta: { designValidationIsNotEnginePlaytesting: true },
    integrationEvents: [],
    dungeons: [
      {
        id: "t",
        name: "Fixture",
        entranceRoom: "t.r01",
        goalFlag: "goal",
        requiredTools: [],
        optionalTools: [],
        entry: { assumedGrantedFlags: [] },
        designAssertions: [],
        enemies: [],
        keys: [],
        locks: [],
        clues: [],
        evidence: [],
        collectibles: [],
        puzzles: [],
        routes: {
          main: [
            { do: "exit", id: "on" },
            { do: "interact", id: "win" },
          ],
          optionalBranches: [],
          shortcut: {
            startRoom: "t.r02",
            assumeFlags: [],
            assumeKeys: [],
            script: [{ do: "interact", id: "win" }],
          },
        },
        boss: fsm("boss"),
        miniboss: fsm("mini"),
        rooms: [
          {
            id: "t.r01",
            name: "One",
            summary: "Fixture room one is a real room in the test pack, with a south-to-north step and nothing hidden.",
            solutionTrace: ["Go on."],
            optional: false,
            layers: { floor: floor() },
            exits: [{ id: "on", x: 1, y: 0, to: "t.r02", dir: "N", external: false, needFins: false, requiresFlags: [], requiresKeys: [], requiresTools: [] }],
            interactions: [],
            encounters: [],
          },
          {
            id: "t.r02",
            name: "Two",
            summary: "Fixture room two holds the goal interaction and the way back, so the graph can return to the entrance.",
            solutionTrace: ["Win."],
            optional: false,
            layers: { floor: floor() },
            exits: [{ id: "back", x: 1, y: 2, to: "t.r01", dir: "S", external: false, needFins: false, requiresFlags: [], requiresKeys: [], requiresTools: [] }],
            interactions: [{ id: "win", x: 1, y: 1, verb: "win", setsFlags: ["goal"], givesKeys: [], givesEvidence: [], requiresFlags: [], requiresKeys: [], requiresTools: [] }],
            encounters: [],
          },
        ],
      },
    ],
  };
  mutate?.(pack);
  return pack;
}

function codes(pack) {
  return new Set(validatePack(pack, { minRooms: 2, skipIntegration: true }).errors.map((e) => e.code));
}

const good = validatePack(base(), { minRooms: 2, skipIntegration: true });
assert.equal(good.ok, true, JSON.stringify(good.errors, null, 2));

const missing = codes(base((p) => {
  p.dungeons[0].rooms[0].exits[0].to = "t.nope";
}));
assert.ok(missing.has("MISSING_REF"), [...missing].join(","));

const unreachable = codes(base((p) => {
  p.dungeons[0].rooms.push({
    id: "t.r03",
    name: "Lost",
    summary: "A room with no entrance at all, used to prove the reachability check fails closed.",
    solutionTrace: ["Cannot."],
    optional: false,
    layers: { floor: floor() },
    exits: [],
    interactions: [],
    encounters: [],
  });
}));
assert.ok(unreachable.has("UNREACHABLE"), [...unreachable].join(","));

const dead = codes(base((p) => {
  p.dungeons[0].puzzles.push({
    id: "t.puz",
    room: "t.r02",
    type: "explicit",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    fsm: {
      initial: "a",
      terminal: "b",
      states: {
        a: { safe: true },
        b: { safe: true, terminal: true },
        trap: { safe: false },
      },
      edges: [
        { from: "a", on: "go", to: "b" },
        { from: "a", on: "bad", to: "trap" },
      ],
      solution: ["go"],
    },
  });
}));
assert.ok(dead.has("DEAD_END"), [...dead].join(","));

const keys = codes(base((p) => {
  const d = p.dungeons[0];
  d.keys.push({
    id: "t.key",
    kind: "small",
    opens: ["t.lock"],
    source: { room: "t.r02", interaction: "win" },
  });
  d.locks.push({ id: "t.lock", keyId: "t.key", optional: false, room: "t.r02", exit: "back" });
  d.rooms[1].exits[0].requiresKeys = ["t.key"];
  // win grants the goal but not the key, and the only way onward requires the key
}));
assert.ok(keys.has("KEY_ACCOUNTING"), [...keys].join(","));

console.log(JSON.stringify({
  selfTest: "passed",
  cases: ["clean-pack", "missing-reference", "unreachable-room", "puzzle-dead-end", "key-accounting"],
}, null, 2));
