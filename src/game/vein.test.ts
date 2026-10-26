import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { relicId } from "../../support/grok-49-relics/src/ids.ts";
import { cycleLedger, grantBondKeepsake, resolveDeath } from "./rules.ts";
import { defaultSave } from "./save.ts";
import type { SaveData, VeinHeldState } from "./types.ts";
import { MAEVE_SPARE_KEY, takeVeinRelic } from "./vein.ts";

function copy(): SaveData {
  return structuredClone(defaultSave());
}

function hold(save: SaveData, n: number, state: VeinHeldState = "intact") {
  const id = relicId(n);
  const took = takeVeinRelic(save, id);
  assert.equal(took.ok, true, id);
  const item = save.flags.veinHeld.find((held) => held.id === id);
  assert.ok(item);
  item!.state = state;
  return id;
}

describe("takeVeinRelic", () => {
  it("refuses a second copy and a source that was already consumed", () => {
    const s = copy();
    assert.deepEqual(takeVeinRelic(s, MAEVE_SPARE_KEY), { ok: true });
    assert.deepEqual(takeVeinRelic(s, MAEVE_SPARE_KEY), { ok: false, reason: "duplicate" });
    assert.equal(s.flags.veinHeld.length, 1);
    s.flags.veinHeld = [];
    assert.deepEqual(takeVeinRelic(s, MAEVE_SPARE_KEY), { ok: false, reason: "consumed" });
    assert.equal(s.flags.veinHeld.length, 0);
    assert.deepEqual(s.flags.veinSources, ["source.maeve-spare-key"]);
  });

  it("refuses tool names and ids outside 001–096", () => {
    const s = copy();
    assert.deepEqual(takeVeinRelic(s, "sword"), { ok: false, reason: "unknown" });
    assert.deepEqual(takeVeinRelic(s, "loot.relic.097"), { ok: false, reason: "unknown" });
    assert.deepEqual(takeVeinRelic(s, "loot.relic.000"), { ok: false, reason: "unknown" });
    assert.deepEqual(s.flags.veinHeld, []);
    assert.deepEqual(s.flags.veinSources, []);
    assert.deepEqual(s.flags.relics, ["sword"]);
  });
});

describe("Maeve's spare key on the walk back", () => {
  it("does not hand the key or the lamp on the first life", () => {
    const s = copy();
    s.character.bondId = "maeve";
    s.cycle = 0;
    grantBondKeepsake(s);
    assert.equal(s.flags.relics.includes("lantern"), false);
    assert.equal(s.flags.ySlot, null);
    assert.deepEqual(s.flags.veinHeld, []);
    assert.deepEqual(s.flags.veinSources, []);
  });

  it("grants the key once beside the lamp and leaves the off-hand on the lamp", () => {
    const s = copy();
    s.character.bondId = "maeve";
    s.cycle = 1;
    grantBondKeepsake(s);
    grantBondKeepsake(s);
    assert.ok(s.flags.relics.includes("lantern"));
    assert.equal(s.flags.relics.filter((id) => id === "lantern").length, 1);
    assert.equal(s.flags.ySlot, "lantern");
    assert.equal(s.flags.lanternOn, true);
    assert.deepEqual(
      s.flags.veinHeld.map((item) => item.id),
      [MAEVE_SPARE_KEY],
    );
    assert.equal(s.flags.veinHeld[0].state, "intact");
    assert.deepEqual(s.flags.veinSources, ["source.maeve-spare-key"]);
    assert.equal(s.flags.relics.some((id) => id.startsWith("loot.")), false);
  });

  it("leaves other bonds without the key", () => {
    const s = copy();
    s.character.bondId = "perch";
    s.cycle = 1;
    grantBondKeepsake(s);
    assert.equal(s.flags.relics.includes("lantern"), false);
    assert.deepEqual(s.flags.veinHeld, []);
  });
});

describe("vein objects through death", () => {
  it("keeps, fractures, or loses by the authored rule and does not bury them", () => {
    const s = copy();
    const key = hold(s, 1);
    const rule = hold(s, 2);
    const jar = hold(s, 3, "fractured");
    const coat = hold(s, 4);
    const cup = hold(s, 12);
    s.flags.relics = ["sword", "shovel", "lantern"];
    s.character.bondId = "maeve";
    resolveDeath(s, { mapId: "middlebury", x: 4, y: 4 }, 14);
    const byId = Object.fromEntries(s.flags.veinHeld.map((item) => [item.id, item.state]));
    assert.equal(byId[key], "intact");
    assert.equal(byId[rule], "fractured");
    assert.equal(byId[jar], undefined);
    assert.equal(byId[coat], "intact");
    assert.equal(byId[cup], "intact");
    assert.ok(s.flags.veinSources.includes("source.jar-last-june"));
    const grave = s.flags.graves.at(-1);
    assert.ok(grave);
    assert.ok(grave.relics.includes("shovel"));
    assert.equal(grave.relics.includes("lantern"), false);
    assert.equal(
      (grave.relics as string[]).some((id) => id.startsWith("loot.relic")),
      false,
    );
    assert.ok(s.flags.relics.includes("lantern"));
  });

  it("keeps an intact fleeting relic and a spent drop, and loses a spent fleeting relic", () => {
    const kept = copy();
    const jar = hold(kept, 3, "mending");
    const rule = hold(kept, 2, "spent");
    resolveDeath(kept, { mapId: "quarry", x: 0, y: 0 }, 14);
    const byId = Object.fromEntries(kept.flags.veinHeld.map((item) => [item.id, item.state]));
    assert.equal(byId[jar], "mending");
    assert.equal(byId[rule], "spent");

    const lost = copy();
    const spentJar = hold(lost, 3, "spent");
    resolveDeath(lost, { mapId: "quarry", x: 0, y: 0 }, 14);
    assert.equal(
      lost.flags.veinHeld.some((item) => item.id === spentJar),
      false,
    );
    assert.ok(lost.flags.veinSources.includes("source.jar-last-june"));
  });
});

describe("limbo names what the vein kept", () => {
  it("promises Maeve's key with the lamp, then names other carried objects once", () => {
    const s = copy();
    s.character.bondId = "maeve";
    s.character.idealId = "the_job";
    s.upgrades.vitality = 1;
    resolveDeath(s, { mapId: "middlebury", x: 10, y: 10 }, 14);
    const first = cycleLedger(s);
    assert.match(first.youKeep, /Same hands/);
    assert.match(first.youKeep, /Oil lamp stays with you/);
    assert.match(first.youKeep, /Maeve's Spare Key stays with you/);
    assert.match(first.youKeep, /Spare Heart 1/);
    assert.equal(first.youKeep.includes("The vein keeps"), false);

    grantBondKeepsake(s);
    hold(s, 2);
    resolveDeath(s, { mapId: "middlebury", x: 10, y: 10 }, 14);
    const second = cycleLedger(s);
    assert.equal((second.youKeep.match(/Maeve's Spare Key/g) ?? []).length, 1);
    assert.match(second.youKeep, /The vein keeps The Unruler \(fractured\)/);
    assert.match(second.youKeep, /Oil lamp stays with you/);
  });

  it("does not promise the key to another bond", () => {
    const s = copy();
    s.character.bondId = "perch";
    s.cycle = 2;
    assert.equal(cycleLedger(s).youKeep.includes("Spare Key"), false);
  });
});
