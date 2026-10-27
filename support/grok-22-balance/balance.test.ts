import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  actorsFromPlacement as portActors,
  fight as portFight,
  hurtMath,
  PLACEMENTS,
  type Build,
} from "./model/second-pass.ts";
import { actorsFromPlacement as simActors, fight as simFight } from "./model/sim.mjs";

const root = dirname(fileURLToPath(import.meta.url));

type Placement = {
  id: string;
  kind: string;
  x?: number;
  y?: number;
  prop?: string;
  group?: { id: string; kind: string; x: number; y: number }[];
};

const pools = ["ordinary", "minibosses", "major", "groups"] as const;

function find(id: string): Placement {
  for (const key of pools) {
    const hit = (PLACEMENTS[key] as Placement[]).find((p) => p.id === id);
    if (hit) return hit;
  }
  throw new Error(id);
}

function pack(
  id: string,
  cycle: number,
  vitality: number,
  edge: number,
  stride: number,
  boots: boolean,
  shadowStep: boolean,
  wraithBond: boolean,
  tropoverse: boolean,
): Build {
  return {
    id,
    cycle,
    form: "wanderer",
    vitality,
    edge,
    stride,
    flaw: "cannot_rest",
    boots,
    shadowStep,
    wraithBond,
    tropoverse,
    bottles: id === "early" ? [] : ["syrup"],
    bombs: 0,
  };
}

const early = pack("early", 0, 0, 0, 0, false, false, false, false);
const middle = pack("middle", 2, 1, 1, 1, true, false, false, false);
const late = pack("late", 5, 3, 3, 3, true, true, true, false);
const sphere = { ...late, id: "late-sphere", tropoverse: true };

const builds: Record<string, Build> = { early, middle, late, sphere };

/** Damage / ttk from output/tables.md. The first pass. Not a playtest. */
const PUBLISHED: [string, keyof typeof builds, number, number][] = [
  ["mb-crow", "middle", 0, 0.733],
  ["mb-bob", "middle", 0, 1.167],
  ["mb-fisher", "middle", 0, 1.1],
  ["vg-wraith", "middle", 0, 1.217],
  ["solo-wraiths", "middle", 0, 4.667],
  ["br-fisher-bear", "middle", 0, 4.067],
  ["br-bear", "middle", 0, 2.2],
  ["quarry-sentinel-first", "early", 0, 2.817],
  ["quarry-sentinel-return", "middle", 0, 2.983],
  ["quarry-sentinel-late", "late", 0, 2.867],
  ["soloverse-sentinel", "sphere", 0, 3.1],
];

function both(id: string, build: Build) {
  const placement = find(id);
  const opts = {
    actors: portActors(placement),
    build,
    policy: { kind: "standard" as const },
    seconds: 30,
  };
  const port = portFight(opts);
  const sim = simFight({ ...opts, actors: simActors(placement) });
  return { port, sim };
}

describe("spacing, the first pass", () => {
  for (const [id, buildId, damage, ttk] of PUBLISHED) {
    it(`${id} ${buildId} is ${damage} in ${ttk}s on both models`, () => {
      const { port, sim } = both(id, builds[buildId]);
      assert.equal(sim.won, true);
      assert.equal(sim.damageTaken, damage);
      assert.equal(sim.ttk, ttk);
      assert.equal(port.won, sim.won);
      assert.equal(port.damageTaken, sim.damageTaken);
      assert.equal(port.ttk, sim.ttk);
      assert.equal(port.contacts, sim.contacts);
    });
  }
});

describe("planted and late, the second pass", () => {
  function situation(
    id: string,
    build: Build,
    kind: "still" | "late" | "standard",
    knockback?: number,
  ) {
    return portFight({
      actors: portActors(find(id)),
      build,
      policy: { kind, lagFrames: 12 },
      seconds: 14,
      playerStart: kind === "standard" ? null : { x: 22, y: 0 },
      patch: knockback == null ? {} : { knockback },
    });
  }

  it("a planter kills the bear and the first sentinel without a bite", () => {
    const bear = situation("br-bear", middle, "still");
    const sentinel = situation("quarry-sentinel-first", early, "still");
    assert.equal(bear.won, true);
    assert.equal(bear.damageTaken, 0);
    assert.equal(bear.ttk, 2.35);
    assert.equal(sentinel.won, true);
    assert.equal(sentinel.damageTaken, 0);
    assert.equal(sentinel.contacts, 0);
  });

  it("late hands die to the bear and the sentinel", () => {
    const bear = situation("br-bear", middle, "late");
    const sentinel = situation("quarry-sentinel-first", early, "late");
    assert.equal(bear.won, false);
    assert.ok(bear.playerHp <= 0);
    assert.equal(bear.damageTaken, 4.5);
    assert.equal(sentinel.won, false);
    assert.ok(sentinel.playerHp <= 0);
    assert.equal(sentinel.damageTaken, 3);
  });

  it("bobcat and fisher catch a planter; the crow does not", () => {
    const bob = situation("mb-bob", middle, "still");
    const fisher = situation("mb-fisher", middle, "still");
    const crow = situation("mb-crow", middle, "still");
    assert.ok(bob.playerHp <= 0);
    assert.ok(fisher.playerHp <= 0);
    assert.equal(crow.won, true);
    assert.equal(crow.damageTaken, 0);
    assert.equal(crow.ttk, 0.267);
  });

  it("a shove of 4 is a study: spacing still takes nothing, a planter loses the bear", () => {
    const space = situation("br-bear", middle, "standard", 4);
    const planted = situation("br-bear", middle, "still", 4);
    const fisher = situation("mb-fisher", middle, "standard", 4);
    assert.equal(space.damageTaken, 0);
    assert.equal(space.won, true);
    assert.equal(space.ttk, 2.2);
    assert.ok(planted.playerHp <= 0);
    assert.equal(fisher.damageTaken, 0);
    assert.ok(fisher.minDist < 13);
    assert.ok(fisher.minDist > 12);
  });
});

describe("the shove ledger", () => {
  it("anything at or under 45.5px/s cannot walk a 10px shove back in 0.22s", () => {
    for (const kind of ["sentinel", "bear", "wraith", "crow"] as const) {
      const row = hurtMath(kind);
      assert.equal(row.animalWins, false);
      assert.ok(row.regain <= 10);
    }
    assert.equal(hurtMath("bobcat").animalWins, true);
    assert.equal(hurtMath("fisher").animalWins, true);
    assert.equal(hurtMath("bear").threshold, 45.455);
  });
});

describe("the patch does not buff the county", () => {
  it("combat tuning is empty and recovery does not change numbers", () => {
    const tuning = JSON.parse(readFileSync(join(root, "patch/tuning.json"), "utf8")) as {
      combat: Record<string, unknown>;
      recovery: { restoreSyrup: boolean; bowQuiver: number };
    };
    const rules = JSON.parse(readFileSync(join(root, "patch/recovery-rules.json"), "utf8")) as {
      changesNumbers: boolean;
      mustNotDo: string[];
    };
    assert.deepEqual(tuning.combat, {});
    assert.equal(tuning.recovery.restoreSyrup, false);
    assert.equal(tuning.recovery.bowQuiver, 0);
    assert.equal(rules.changesNumbers, false);
    assert.ok(rules.mustNotDo.some((line) => line.includes("maxHp")));
  });
});
