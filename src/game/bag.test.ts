import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { graveSnapshot, sipIndex, weaponFromGrave, type GraveWeapon } from "./bag.ts";
import type { Weapon } from "./weapons.ts";

const axe: Weapon = {
  id: "gooseneck",
  name: "Swift Gooseneck axe of Hunger",
  kind: "heavy",
  dmg: 2.9,
  speed: 0.24,
  reach: 14,
  combo: 2,
  projectile: false,
  affixes: [
    { id: "swift", name: "Swift", cursed: false, magic: false, speed: -0.04, combo: 1 },
    { id: "hunger", name: "of Hunger", cursed: true, magic: true, dmg: 1.1, drain: 0.35 },
  ],
  flavor: "It wants a meal.",
};

describe("graveSnapshot", () => {
  it("keeps the numbers a dig would otherwise reroll", () => {
    const snap = graveSnapshot(axe);
    assert.equal(snap.magic, true);
    assert.equal(snap.dmg, 2.9);
    const back = weaponFromGrave(snap);
    assert.ok(back);
    assert.equal(back.dmg, 2.9);
    assert.equal(back.affixes[1].id, "hunger");
    assert.equal(back.name, axe.name);
  });

  it("refuses a grave that only remembered the name", () => {
    const old: GraveWeapon = { id: "farm-axe", name: "Farm axe", magic: false, kind: "heavy" };
    assert.equal(weaponFromGrave(old), null);
  });
});

describe("sipIndex", () => {
  it("drinks syrup when the blood is low, even if a creemee is first", () => {
    assert.equal(sipIndex(["creemee", "syrup"], 2.65, 3, 8, 8), 1);
  });

  it("drinks a creemee when only mana is low", () => {
    assert.equal(sipIndex(["syrup", "creemee"], 3, 3, 1, 8), 1);
  });

  it("drinks the first bottle when neither well is low", () => {
    assert.equal(sipIndex(["creemee", "syrup"], 3, 3, 8, 8), 0);
  });

  it("returns -1 when both bottles are empty", () => {
    assert.equal(sipIndex(["empty", "empty"], 1, 3, 0, 8), -1);
  });
});
