import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { erodeGrave, RELIC_BY_ID, type Grave } from "./items.ts";

function grave(partial: Partial<Grave> = {}): Grave {
  return {
    id: "grave-0-middlebury",
    mapId: "middlebury",
    x: 10,
    y: 10,
    year: 2026,
    weapons: [
      { id: "farm-axe", name: "Farm axe", magic: false, kind: "heavy" },
      { id: "blessed", name: "Blessed iron", magic: true, kind: "blade" },
    ],
    relics: ["shovel", "lantern", "hammer"],
    arrows: 10,
    bombs: 3,
    excavated: false,
    ...partial,
  };
}

describe("erodeGrave", () => {
  it("keeps magic steel and named relics through fourteen winters", () => {
    const g = erodeGrave(grave(), 2040, () => 0.99);
    assert.deepEqual(
      g.weapons.map((w) => w.id),
      ["blessed"],
    );
    assert.deepEqual(g.relics, ["shovel", "lantern", "hammer"]);
    assert.equal(g.arrows, 0);
    assert.equal(g.bombs, 0);
  });

  it("mundane steel can survive a short winter if the roll is kind", () => {
    const g = erodeGrave(grave(), 2028, () => 0);
    assert.ok(g.weapons.some((w) => w.id === "farm-axe"));
    const gone = erodeGrave(grave(), 2028, () => 0.99);
    assert.equal(
      gone.weapons.some((w) => w.id === "farm-axe"),
      false,
    );
  });

  it("emptied mounds keep no mundane steel", () => {
    const g = erodeGrave(grave({ excavated: true }), 2027, () => 0);
    assert.deepEqual(
      g.weapons.map((w) => w.id),
      ["blessed"],
    );
  });

  it("shovel and starter iron leave after twenty winters; named relics stay", () => {
    const g = erodeGrave(grave({ relics: ["sword", "shovel", "lantern"] }), 2047, () => 0);
    assert.deepEqual(g.relics, ["lantern"]);
  });

  it("arrows thin, then vanish", () => {
    const early = erodeGrave(grave({ arrows: 10 }), 2030, () => 0);
    assert.equal(early.arrows, 4);
    const late = erodeGrave(grave({ arrows: 10 }), 2035, () => 0);
    assert.equal(late.arrows, 0);
  });
});

describe("RELIC_BY_ID", () => {
  it("marks the lamp as a Y-slot verb", () => {
    assert.equal(RELIC_BY_ID.lantern.slot, "Y");
    assert.equal(RELIC_BY_ID.lantern.name, "Oil lamp");
    assert.equal(RELIC_BY_ID.boots.slot, "passive");
  });
});
