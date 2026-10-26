import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATALOG,
  applyPreset,
  createSession,
  equip,
  migrate,
  runBeat,
  unequip,
} from "../../support/grok-48-equipment/src/index.ts";

describe("kit yard beside the life", () => {
  it("holds one hundred twenty pieces and no second copy of a name", () => {
    assert.equal(CATALOG.length, 120);
    assert.equal(new Set(CATALOG.map((item) => item.id)).size, 120);
  });

  it("wears the faultline saber and puts it away", () => {
    const worn = equip(createSession(), "loot.equipment.001");
    assert.equal(worn.ok, true);
    assert.equal(worn.session.slots.mainHand, "loot.equipment.001");
    const away = unequip(worn.session, "loot.equipment.001");
    assert.equal(away.ok, true);
    assert.equal(away.session.slots.mainHand, undefined);
  });

  it("does not let the keybell turn a locked door", () => {
    const session = applyPreset([56]);
    const beat = runBeat(session, { kind: "door" });
    assert.equal(beat.facts.doorOpen, false);
    assert.equal(beat.facts.doorReason, "missing-key");
  });

  it("loads a flat id list once and keeps unknown names in lost and found", () => {
    const session = migrate({
      ids: ["loot.equipment.001", "loot.equipment.001", "not-a-piece"],
    });
    const worn = session.slots.mainHand === "loot.equipment.001" ? 1 : 0;
    const packed = session.inventory.filter((id) => id === "loot.equipment.001").length;
    assert.equal(worn + packed, 1);
    assert.equal(session.inventory.includes("loot.equipment.001") && worn === 1, false);
    assert.deepEqual(session.lostAndFound, ["not-a-piece"]);
    assert.equal(session.v, 2);
  });
});
