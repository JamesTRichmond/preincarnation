import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fight, fightScore } from "./arena.ts";
import type { ScenarioId } from "./arena.ts";
import { FAMILIES, ITEMS, familyById } from "./catalog.ts";
import {
  coldBucket,
  creekLamp,
  firstLie,
  fullFamilyLoadout,
  partialFamilyLoadout,
} from "./presets.ts";
import {
  applyModifiers,
  changeBody,
  compareResolutions,
  emptyLoadout,
  grantPiece,
  removeInstance,
  resolve,
  tryEquip,
} from "./resolve.ts";
import { hydrateLoadout, serializeLoadout } from "./save.ts";
import { baseStats, fid } from "./types.ts";
import type { Loadout, ResolvedMod } from "./types.ts";

function better(label: string, left: Loadout, right: Loadout, scenario: ScenarioId): void {
  const a = fight(resolve(left).stats, scenario);
  const b = fight(resolve(right).stats, scenario);
  const sa = fightScore(a);
  const sb = fightScore(b);
  assert.ok(
    sa > sb,
    `${label} @ ${scenario}: ${sa.toFixed(1)} win ${a.win} hp ${a.hpLeft.toFixed(1)} r${a.rounds} vs ${sb.toFixed(1)} win ${b.win} hp ${b.hpLeft.toFixed(1)} r${b.rounds}`,
  );
}

describe("catalog", () => {
  it("is eighty pieces in sixteen families of five", () => {
    assert.equal(ITEMS.length, 80);
    assert.equal(FAMILIES.length, 16);
    const ids = ITEMS.map((item) => item.id);
    assert.deepEqual(ids, Array.from({ length: 80 }, (_, index) => fid(index + 1)));
    for (const family of FAMILIES) {
      assert.equal(family.pieceIds.length, 5);
      const equipped = family.pieceIds
        .map((id) => ITEMS.find((item) => item.id === id)!)
        .filter((item) => item.countsWhen === "equipped");
      assert.ok(equipped.length <= 3, family.id);
      assert.equal(new Set(equipped.map((item) => item.slot)).size, equipped.length);
      assert.ok(family.sidegrade.mods.some((mod) => mod.tone === "gift"));
      assert.ok(family.sidegrade.mods.some((mod) => mod.tone === "cost"));
    }
  });

  it("does not spoil the bargain in the discovery", () => {
    for (const family of FAMILIES) {
      const banned = family.sidegrade.name.toLowerCase();
      for (const id of family.pieceIds) {
        const item = ITEMS.find((entry) => entry.id === id)!;
        const text = `${item.discovery.place} ${item.discovery.notice} ${item.discovery.take}`.toLowerCase();
        assert.equal(text.includes(banned), false, item.name);
        assert.equal(/quest marker|waypoint|map pin|gps/.test(text), false, item.name);
        assert.ok(item.discovery.place.length > 3);
        assert.ok(item.solo.length > 8);
      }
    }
  });

  it("makes every full bargain a sidegrade, not a strict upgrade", () => {
    for (const family of FAMILIES) {
      const four = resolve(partialFamilyLoadout(family.id, 4));
      const full = resolve(fullFamilyLoadout(family.id));
      assert.equal(full.sidegrades.includes(family.sidegrade.name), true, family.id);
      assert.equal(four.sidegrades.length, 0);
      const up = (Object.keys(full.stats) as (keyof typeof full.stats)[]).some(
        (key) => full.stats[key] > four.stats[key] + 1e-9,
      );
      const down = (Object.keys(full.stats) as (keyof typeof full.stats)[]).some(
        (key) => full.stats[key] < four.stats[key] - 1e-9,
      );
      assert.ok(up && down, `${family.id} up ${up} down ${down}`);
    }
  });
});

describe("identity", () => {
  it("tracks partials, the pair, and removal", () => {
    let step = emptyLoadout();
    step = grantPiece(step, fid(1)).loadout;
    step = grantPiece(step, fid(2)).loadout;
    const resolved = resolve(step);
    assert.equal(resolved.families[0]?.count, 2);
    assert.ok(resolved.pairs.includes("Push the water"));
    assert.equal(resolved.sidegrades.length, 0);
    const full = fullFamilyLoadout("floodkeepers");
    assert.deepEqual(resolve(full).sidegrades, ["Stillwater"]);
    const removed = removeInstance(full, `${fid(3)}#1`);
    assert.equal(removed.ok, true);
    assert.ok(removed.feedback.some((line) => line.includes("Stillwater ends")));
    assert.equal(resolve(removed.loadout).sidegrades.length, 0);
    assert.equal(resolve(removed.loadout).families[0]?.count, 4);
  });

  it("does not double-count a duplicated instance", () => {
    const once = fullFamilyLoadout("floodkeepers");
    const twice = grantPiece(once, fid(1));
    assert.equal(twice.ok, true);
    assert.ok(twice.feedback.some((line) => /does not count/i.test(line)));
    assert.deepEqual(resolve(once).stats, resolve(twice.loadout).stats);
    assert.ok(resolve(twice.loadout).duplicates.length >= 1);
    const manual: Loadout = {
      version: 1,
      body: "wanderer",
      instances: [
        { instanceId: "a", defId: fid(1), presence: "equipped", slot: "hand" },
        { instanceId: "b", defId: fid(1), presence: "equipped", slot: "hand" },
      ],
    };
    const resolved = resolve(manual);
    assert.equal(resolved.recognizedIds.filter((id) => id === fid(1)).length, 1);
    assert.equal(resolved.families[0]?.count, 1);
  });

  it("rejects invalid slots without changing the body", () => {
    const start = emptyLoadout();
    const packed = grantPiece(start, fid(4)).loadout;
    const wrong = tryEquip(packed, `${fid(4)}#1`, "hand");
    assert.equal(wrong.ok, false);
    assert.deepEqual(wrong.loadout, packed);
    assert.ok(wrong.feedback.some((line) => /invalid slot/i.test(line)));
    const pike = grantPiece(start, fid(1)).loadout;
    const badSlot = tryEquip(pike, `${fid(1)}#1`, "y");
    assert.equal(badSlot.ok, false);
    assert.deepEqual(badSlot.loadout, pike);
    const filled = tryEquip(
      {
        version: 1,
        body: "wanderer",
        instances: [
          { instanceId: "hand", defId: fid(1), presence: "equipped", slot: "hand" },
          { instanceId: "other", defId: fid(6), presence: "carried" },
        ],
      },
      "other",
      "hand",
    );
    assert.equal(filled.ok, false);
    assert.equal(filled.loadout.instances[1]?.presence, "carried");
  });

  it("drops illegal pieces on a form change and says what ended", () => {
    const officerGlass = grantPiece(emptyLoadout("officer"), fid(17)).loadout;
    assert.equal(resolve(officerGlass).recognizedIds.includes(fid(17)), true);
    const embryo = changeBody(officerGlass, "embryo");
    assert.equal(embryo.ok, true);
    assert.equal(embryo.loadout.instances[0]?.presence, "carried");
    assert.equal(resolve(embryo.loadout).recognizedIds.includes(fid(17)), false);
    assert.ok(embryo.feedback.some((line) => /does not count/i.test(line)));
    const dirk = tryEquip(
      { version: 1, body: "officer", instances: [{ instanceId: "d", defId: fid(71), presence: "carried" }] },
      "d",
      "hand",
    );
    assert.equal(dirk.ok, false);
    const worn = grantPiece(emptyLoadout("smuggler"), fid(71)).loadout;
    const officer = changeBody(worn, "officer");
    assert.equal(officer.loadout.instances[0]?.presence, "carried");
    assert.ok(compareResolutions(resolve(worn), resolve(officer.loadout)).some((line) => line.includes("→")));
  });
});

describe("modifier order", () => {
  it("adds, then multiplies, then caps, and sidegrades come last", () => {
    const base = baseStats("wanderer");
    const mods: ResolvedMod[] = [
      { phase: "piece", mode: "add", stat: "atk", value: 10, tone: "plain", source: "piece/0/a" },
      { phase: "piece", mode: "mul", stat: "atk", value: 2, tone: "plain", source: "piece/1/b" },
      { phase: "sidegrade", mode: "add", stat: "atk", value: 3, tone: "gift", source: "side/z" },
      { phase: "sidegrade", mode: "capMax", stat: "atk", value: 25, tone: "cost", source: "side/z" },
    ];
    const stats = applyModifiers(base, mods);
    assert.equal(stats.atk, 25);
    const flood = resolve(fullFamilyLoadout("floodkeepers"));
    const phases = flood.modifiers.map((mod) => mod.phase);
    const order = ["piece", "pair", "count", "sidegrade"];
    let last = 0;
    for (const phase of phases) {
      const index = order.indexOf(phase);
      assert.ok(index >= last);
      last = index;
    }
    const pieceSources = flood.modifiers.filter((mod) => mod.phase === "piece").map((mod) => mod.source);
    const sorted = [...pieceSources].sort((a, b) => (a < b ? -1 : 1));
    assert.deepEqual(pieceSources, sorted);
    assert.ok(pieceSources[0]?.startsWith("piece/0/"));
    assert.ok(pieceSources.some((source) => source.startsWith("piece/4/")));
  });
});

describe("save", () => {
  it("roundtrips and refuses a bad slot or a duplicate id", () => {
    const full = fullFamilyLoadout("quarry-night");
    const dup = grantPiece(full, fid(6)).loadout;
    const raw = serializeLoadout(dup);
    const back = hydrateLoadout(raw);
    assert.equal(back.ok, true);
    if (back.ok) assert.deepEqual(resolve(back.loadout).stats, resolve(dup).stats);
    assert.equal(hydrateLoadout(JSON.stringify({ version: 99, loadout: full })).ok, false);
    const forged = JSON.parse(raw) as { loadout: { instances: { instanceId: string }[] } };
    forged.loadout.instances.push({ ...forged.loadout.instances[0] });
    assert.equal(hydrateLoadout(JSON.stringify(forged)).ok, false);
    const packInHand = {
      version: 1,
      loadout: {
        version: 1,
        body: "wanderer",
        instances: [{ instanceId: "x", defId: fid(4), presence: "equipped", slot: "hand" }],
      },
    };
    assert.equal(hydrateLoadout(JSON.stringify(packInHand)).ok, false);
  });
});

describe("damage and resource loops", () => {
  it("keeps oil, breath, and healing inside their caps", () => {
    const lamp = resolve(partialFamilyLoadout("quarry-night", 3));
    assert.ok(lamp.stats.oilDrain > 0);
    const long = fight(lamp.stats, "quarry-dark", { enemyHp: 5000, enemyAtk: 0, maxRounds: 24 });
    assert.ok(long.rounds <= 24);
    assert.ok(long.trace.some((row) => row.oil === 0 && row.lit === false));
    const oils = long.trace.map((row) => row.oil);
    assert.ok(oils[0]! < lamp.stats.oilCap);
    assert.equal(oils[oils.length - 1], 0);
    for (const row of long.trace) {
      assert.ok(row.oil >= 0 && row.oil <= lamp.stats.oilCap + 1e-6);
      assert.ok(row.mp >= -1e-6 && row.mp <= lamp.stats.maxMp + 1e-6);
      assert.ok(row.hp <= lamp.stats.maxHp + 1e-6);
    }
    const free = resolve(fullFamilyLoadout("quarry-night"));
    assert.equal(free.stats.oilDrain, 0);
    const still = fight(free.stats, "quarry-dark", { enemyHp: 5000, maxRounds: 12 });
    assert.ok(still.trace.every((row) => row.oil === free.stats.oilCap && row.lit));
    const bucket = resolve(partialFamilyLoadout("floodkeepers", 2));
    const loop = fight(bucket.stats, "creek-flood", { enemyHp: 5000, enemyAtk: 0, maxRounds: 24 });
    assert.ok(loop.healed <= loop.mpSpent * 2 + 1e-6);
    assert.ok(loop.mpSpent > 0);
    assert.ok(loop.trace.every((row) => row.hp <= bucket.stats.maxHp + 1e-6));
    assert.ok(loop.mpLeft <= bucket.stats.maxMp + 1e-6);
  });
});

describe("showcase bargains do not eclipse mixed builds", () => {
  it("gives quarry, witnesses, orchard, and flood a home and a loss", () => {
    better("quarry home", fullFamilyLoadout("quarry-night"), creekLamp(), "quarry-dark");
    better("creek lamp in the flood", creekLamp(), fullFamilyLoadout("quarry-night"), "creek-flood");
    better("record home", fullFamilyLoadout("unnamed-witnesses"), firstLie(), "hearing");
    better("first cut in the taproom", firstLie(), fullFamilyLoadout("unnamed-witnesses"), "taproom-brawl");
    better("orchard home", fullFamilyLoadout("orchard-guardians"), coldBucket(), "orchard-beast");
    better("cold bucket in the long cold", coldBucket(), fullFamilyLoadout("orchard-guardians"), "long-cold");
    better(
      "stillwater is worse in a brawl than the pike and bucket alone",
      partialFamilyLoadout("floodkeepers", 3),
      fullFamilyLoadout("floodkeepers"),
      "taproom-brawl",
    );
    better(
      "stillwater is better in the flood than three pieces",
      fullFamilyLoadout("floodkeepers"),
      partialFamilyLoadout("floodkeepers", 3),
      "creek-flood",
    );
    const quarry = familyById("quarry-night");
    assert.equal(quarry.pieceIds.length, 5);
  });
});
