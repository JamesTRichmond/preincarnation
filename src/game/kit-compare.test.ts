import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readKit, wearNextId, type StrikeContext } from "./kit-compare.ts";
import { starterWeapon, type Weapon } from "./weapons.ts";

const strike: StrikeContext = {
  incarnationDamage: 1,
  edge: 0,
  tropoverse: false,
  flawId: "cannot_rest",
};

function blade(partial: Partial<Weapon> & Pick<Weapon, "id" | "name">): Weapon {
  return {
    kind: "blade",
    dmg: 1,
    speed: 0.16,
    reach: 14,
    combo: 2,
    projectile: false,
    affixes: [],
    flavor: "Test steel.",
    ...partial,
  };
}

describe("wearNextId — a swap is only an id", () => {
  it("steps to the next blade and wraps", () => {
    const bag = [{ id: "a" }, { id: "b" }, { id: "c" }];
    assert.equal(wearNextId(bag, "a"), "b");
    assert.equal(wearNextId(bag, "c"), "a");
  });

  it("a missing equipped id resolves the way the yard does, to the first blade", () => {
    assert.equal(wearNextId([{ id: "a" }, { id: "b" }], "gone"), "a");
  });

  it("does not take life, mana, or the swing timer as arguments", () => {
    const state = {
      inventory: [{ id: "a" }, { id: "b" }],
      equippedId: "a",
      hp: 1.5,
      mp: 3,
      attackT: 0.1,
    };
    const next = wearNextId(state.inventory, state.equippedId);
    const after = { ...state, equippedId: next };
    assert.equal(after.equippedId, "b");
    assert.equal(after.hp, 1.5);
    assert.equal(after.mp, 3);
    assert.equal(after.attackT, 0.1);
    assert.equal(state.equippedId, "a");
  });

  it("an empty bag leaves the equipped id alone", () => {
    assert.equal(wearNextId([], "starter-iron"), "starter-iron");
  });
});

describe("readKit — the sheet is not a damage ranking", () => {
  const iron = starterWeapon();
  const hunger = blade({
    id: "hunger-axe",
    name: "Splitting maul of Hunger",
    kind: "heavy",
    dmg: 2.9,
    speed: 0.26,
    reach: 15,
    combo: 1,
    flavor: "It takes as much as it gives.",
    affixes: [{ id: "hunger", name: "of Hunger", cursed: true, magic: true, dmg: 1.1, drain: 0.35 }],
  });
  const leadfoot = blade({
    id: "lead",
    name: "Lead-foot peen",
    kind: "heavy",
    dmg: 3,
    speed: 0.3,
    reach: 13,
    combo: 2,
    affixes: [{ id: "lead", name: "Lead-foot", cursed: true, magic: false, dmg: 1.4, move: -0.22, speed: 0.06 }],
  });

  it("lists both strikes and refuses a damage arrow", () => {
    const kit = readKit([iron, hunger], iron.id, strike, null);
    assert.equal(kit.strikeHand, "1");
    assert.equal(kit.strikeNext, "2.9");
    assert.match(kit.lead, /not ranked/);
    assert.match(kit.lead, /not the swing timer/);
    assert.equal(kit.swap.includes("tenth of a second"), true);
    const dumped = JSON.stringify(kit).toLowerCase();
    assert.equal(dumped.includes("dps"), false);
    assert.equal(dumped.includes("better"), false);
    assert.equal(dumped.includes("worse"), false);
    assert.equal(dumped.includes("↑"), false);
    assert.equal(dumped.includes("↓"), false);
  });

  it("keeps hunger and a curse out of the strike number", () => {
    const kit = readKit([iron, hunger], iron.id, strike, "lantern");
    assert.match(kit.clausesNext.join(" "), /Hunger takes 0.35/);
    assert.match(kit.clausesNext.join(" "), /Cursed/);
    assert.equal(kit.strikeNext, "2.9");
    assert.match(kit.yLine, /Oil lamp/);
    assert.match(kit.yLine, /Q cycles tools/);
  });

  it("traces walk and names sheet speed as not the attack clock", () => {
    const kit = readKit([iron, leadfoot], iron.id, strike, null);
    assert.match(kit.lead, /reach -1 px/);
    assert.match(kit.lead, /walk -0.22/);
    assert.match(kit.walkNext ?? "", /traced/);
    assert.match(kit.sheetNext ?? "", /neither is the attack clock/);
    assert.match(kit.sheetHand, /speed 0.16/);
  });

  it("explains an empty second slot without inventing a second body", () => {
    const kit = readKit([iron], iron.id, strike, "shovel");
    assert.equal(kit.nextName, null);
    assert.match(kit.missing ?? "", /short iron/);
    assert.match(kit.missing ?? "", /grave/);
    assert.match(kit.yLine, /Grave shovel/);
  });

  it("says when the equipped id is not in the bag", () => {
    const kit = readKit([iron, hunger], "missing", strike, null);
    assert.equal(kit.handName, iron.name);
    assert.match(kit.missing ?? "", /not in the bag/);
  });

  it("a staff shot names the mana cost and does not treat it as damage", () => {
    const staff = blade({
      id: "rod",
      name: "Registrar's rod",
      kind: "staff",
      projectile: true,
      dmg: 1.1,
      flavor: "It hums.",
    });
    const kit = readKit([iron, staff], iron.id, strike, null);
    assert.match(kit.clausesNext.join(" "), /1 mana/);
    assert.equal(kit.strikeNext, "1.1");
  });
});
