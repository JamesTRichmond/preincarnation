import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultSave } from "./save.ts";
import {
  applyUpgrade,
  bodyStats,
  bondKeepsake,
  cycleLedger,
  devilThreshold,
  fillDialogueText,
  grantBondKeepsake,
  groundKeptLine,
  isIncarnationUnlocked,
  ownedUpgradeNames,
  relicsForGrave,
  resolveDeath,
  sheetDamageMul,
  sheetSpeedMul,
  skillAwardForDeath,
  slashDamage,
  soloverseReady,
  spendSkillPoint,
  spinDamage,
  wintersPassed,
} from "./rules.ts";
import type { Grave } from "./items.ts";
import type { SaveData } from "./types.ts";

function copy(): SaveData {
  return structuredClone(defaultSave());
}

describe("bodyStats — cycle does not fatten the ribcage", () => {
  it("wanderer starts at 3 HP / 8 MP", () => {
    const s = bodyStats("wanderer", 0);
    assert.equal(s.maxHp, 3);
    assert.equal(s.maxMp, 8);
    assert.equal(s.damage, 1);
  });

  it("Spare Heart is the only extra chamber", () => {
    const s = bodyStats("wanderer", 3);
    assert.equal(s.maxHp, 6);
    assert.equal(s.maxMp, 11);
  });

  it("officer skin is heavier without a cycle term", () => {
    assert.equal(bodyStats("officer", 0).maxHp, 5);
    assert.equal(bodyStats("officer", 2).maxHp, 7);
  });
});

describe("slash / spin — no silent cycle damage", () => {
  it("starter iron on a wanderer is 1", () => {
    assert.equal(
      slashDamage({
        weaponDmg: 1,
        incarnationDamage: 1,
        edge: 0,
        tropoverse: false,
        flawId: "cannot_rest",
      }),
      1,
    );
  });

  it("Keen Edge multiplies, tropoverse and the blade stack", () => {
    const base = slashDamage({
      weaponDmg: 1,
      incarnationDamage: 1,
      edge: 1,
      tropoverse: false,
      flawId: "pride",
    });
    assert.equal(base, 1.18);
    const tropo = slashDamage({
      weaponDmg: 1,
      incarnationDamage: 1,
      edge: 1,
      tropoverse: true,
      flawId: "pride",
    });
    assert.equal(tropo, 1.18 * 1.2);
    const blade = slashDamage({
      weaponDmg: 1,
      incarnationDamage: 1,
      edge: 0,
      tropoverse: false,
      flawId: "the_blade",
    });
    assert.equal(blade, 1.15);
  });

  it("spin ignores cycle", () => {
    assert.equal(spinDamage(1, 0), 3.2);
    assert.equal(spinDamage(1, 2), 3.2 + 0.6);
  });
});

describe("skill award", () => {
  it("pays 2, plus 1 while Finish-it and the quarry still sleeps", () => {
    assert.equal(skillAwardForDeath("the_job", []), 3);
    assert.equal(skillAwardForDeath("the_job", ["quarry"]), 2);
    assert.equal(skillAwardForDeath("mercy", []), 2);
  });
});

describe("wintersPassed", () => {
  it("is fourteen to eighteen", () => {
    assert.equal(wintersPassed(() => 0), 14);
    assert.equal(wintersPassed(() => 0.99), 18);
  });
});

describe("Maeve's lantern keepsake", () => {
  it("only Maeve's bond carries the lamp", () => {
    assert.equal(bondKeepsake("maeve"), "lantern");
    assert.equal(bondKeepsake("perch"), null);
    assert.deepEqual(relicsForGrave(["sword", "lantern", "shovel"], "maeve"), ["shovel"]);
    assert.deepEqual(relicsForGrave(["sword", "lantern", "shovel"], "perch"), ["lantern", "shovel"]);
  });

  it("does not hand the lamp on the first life", () => {
    const s = copy();
    s.character.bondId = "maeve";
    s.cycle = 0;
    grantBondKeepsake(s);
    assert.equal(s.flags.relics.includes("lantern"), false);
    assert.equal(s.flags.ySlot, null);
  });

  it("puts the lamp in the off-hand after a death", () => {
    const s = copy();
    s.character.bondId = "maeve";
    s.cycle = 1;
    grantBondKeepsake(s);
    assert.ok(s.flags.relics.includes("lantern"));
    assert.equal(s.flags.ySlot, "lantern");
    assert.equal(s.flags.lanternOn, true);
  });

  it("is idempotent if the lamp is already owned", () => {
    const s = copy();
    s.character.bondId = "maeve";
    s.cycle = 2;
    s.flags.relics = ["sword", "lantern", "shovel"];
    s.flags.ySlot = "shovel";
    grantBondKeepsake(s);
    assert.deepEqual(s.flags.relics, ["sword", "lantern", "shovel"]);
    assert.equal(s.flags.ySlot, "lantern");
  });

  it("leaves other bonds alone", () => {
    const s = copy();
    s.character.bondId = "perch";
    s.cycle = 1;
    grantBondKeepsake(s);
    assert.equal(s.flags.relics.includes("lantern"), false);
    assert.equal(s.flags.ySlot, null);
  });
});

describe("resolveDeath", () => {
  it("banks skill, ages the year, and quotes God when karma is clean", () => {
    const s = copy();
    s.character.idealId = "the_job";
    s.character.flawId = "cannot_rest";
    s.character.skillPoints = 1;
    s.karma = 2;
    s.flags.lastDeed = "You spoke with Maeve on the Green";
    s.flags.arrows = 8;
    s.flags.bombs = 2;
    s.flags.relics = ["sword", "shovel", "lantern"];
    s.inventory = [
      s.inventory[0],
      {
        id: "farm-axe",
        name: "Farm axe",
        kind: "heavy",
        dmg: 2,
        speed: 0.2,
        reach: 14,
        combo: 1,
        projectile: false,
        affixes: [],
        flavor: "",
      },
    ];
    const next = resolveDeath(s, { mapId: "middlebury", x: 100, y: 80 }, 14);
    assert.equal(next.cycle, 1);
    assert.equal(next.flags.year, 2040);
    assert.equal(next.character.skillPoints, 4);
    assert.equal(next.flags.afterlifeHost, "god");
    assert.equal(next.flags.returnedFromDeath, true);
    assert.equal(next.inventory.length, 1);
    assert.equal(next.inventory[0].id, "starter-iron");
    assert.equal(next.flags.arrows, 0);
    assert.equal(next.flags.bombs, 0);
    const grave = next.flags.graves[0];
    assert.equal(grave.mapId, "middlebury");
    assert.deepEqual(
      grave.weapons.map((w) => w.name),
      ["Farm axe"],
    );
    assert.ok(grave.relics.includes("shovel"));
    assert.equal(grave.relics.includes("lantern"), false);
    assert.ok(next.flags.relics.includes("lantern"));
  });

  it("sends dirty hands to the Other Voice", () => {
    const s = copy();
    s.karma = -1;
    s.character.flawId = "cannot_rest";
    resolveDeath(s, { mapId: "quarry", x: 0, y: 0 }, 14);
    assert.equal(s.flags.afterlifeHost, "devil");
  });

  it("the_other_voice needs karma below 3 to meet the Devil", () => {
    const s = copy();
    s.character.flawId = "the_other_voice";
    s.karma = 2;
    resolveDeath(s, { mapId: "quarry", x: 0, y: 0 }, 14);
    assert.equal(s.flags.afterlifeHost, "devil");
    const t = copy();
    t.character.flawId = "the_other_voice";
    t.karma = 3;
    resolveDeath(t, { mapId: "quarry", x: 0, y: 0 }, 14);
    assert.equal(t.flags.afterlifeHost, "god");
  });

  it("drops the extra Finish-it point once the quarry is cleared", () => {
    const s = copy();
    s.character.idealId = "the_job";
    s.flags.townsCleared = ["quarry"];
    s.character.skillPoints = 0;
    resolveDeath(s, { mapId: "middlebury", x: 0, y: 0 }, 14);
    assert.equal(s.character.skillPoints, 2);
  });
});

describe("cycle ledger", () => {
  it("names this life, what you keep, and what hit the dirt", () => {
    const s = copy();
    s.character.bondId = "maeve";
    s.character.idealId = "the_job";
    s.upgrades.vitality = 1;
    s.flags.lastDeed = "You spoke with Maeve on the Green";
    resolveDeath(s, { mapId: "middlebury", x: 10, y: 10 }, 14);
    grantBondKeepsake(s);
    const led = cycleLedger(s);
    assert.match(led.thisLife, /You spoke with Maeve on the Green/);
    assert.match(led.thisLife, /3 skill/);
    assert.match(led.youKeep, /Same hands/);
    assert.match(led.youKeep, /Oil lamp stays with you/);
    assert.match(led.youKeep, /Spare Heart 1/);
    assert.match(led.theGround, /mound|Bring the shovel|dirt/i);
  });

  it("lists dropped steel on the ground line", () => {
    const grave: Grave = {
      id: "g",
      mapId: "middlebury",
      x: 1,
      y: 1,
      year: 2026,
      weapons: [{ id: "a", name: "Farm axe", magic: false, kind: "heavy" }],
      relics: ["shovel"],
      arrows: 8,
      bombs: 2,
      excavated: false,
    };
    assert.equal(groundKeptLine(grave), "Farm axe, 8 arrows, 2 kegs. Bring the shovel.");
    assert.match(groundKeptLine(undefined), /Nothing else hit the dirt/);
  });
});

describe("spendSkillPoint", () => {
  it("refuses a dry purse and a maxed pip", () => {
    const s = copy();
    s.character.skillPoints = 0;
    assert.equal(spendSkillPoint(s, "vitality"), null);
    const t = copy();
    t.character.skillPoints = 1;
    t.upgrades.sight = 1;
    assert.equal(spendSkillPoint(t, "sight"), null);
  });

  it("buys Spare Heart without mutating the original", () => {
    const s = copy();
    s.character.skillPoints = 2;
    const next = spendSkillPoint(s, "vitality");
    assert.ok(next);
    assert.equal(next.upgrades.vitality, 1);
    assert.equal(next.character.skillPoints, 1);
    assert.equal(s.upgrades.vitality, 0);
    assert.equal(s.character.skillPoints, 2);
  });

  it("will not sell a crown upgrade for skill", () => {
    const s = copy();
    s.character.skillPoints = 4;
    assert.equal(spendSkillPoint(s, "soloverseKey"), null);
    assert.equal(spendSkillPoint(s, "echo"), null);
  });
});

describe("misc rules", () => {
  it("fills dialogue tokens", () => {
    assert.equal(fillDialogueText("{name}. {year}. c{cycle}.", "Ira", 2040, 1), "Ira. 2040. c1.");
  });

  it("flaw knobs", () => {
    assert.equal(devilThreshold("the_other_voice"), 3);
    assert.equal(devilThreshold("pride"), 0);
    assert.equal(sheetDamageMul("the_blade"), 1.15);
    assert.equal(sheetSpeedMul("cannot_rest"), 1.1);
  });

  it("incarnation unlocks stay on the old keys", () => {
    const flags = copy().flags;
    assert.equal(isIncarnationUnlocked("wanderer", 0, flags, 0), true);
    assert.equal(isIncarnationUnlocked("smuggler", 0, flags, 0), false);
    assert.equal(isIncarnationUnlocked("smuggler", 1, flags, 0), true);
    assert.equal(isIncarnationUnlocked("officer", 1, flags, 0), false);
    flags.talked = ["mayor"];
    assert.equal(isIncarnationUnlocked("officer", 1, flags, 0), true);
    assert.equal(isIncarnationUnlocked("embryo", 2, flags, 0), true);
  });

  it("soloverse opens after three deaths with a key, an embryo, or three crowns", () => {
    const s = copy();
    s.cycle = 3;
    assert.equal(soloverseReady(s), false);
    s.upgrades.soloverseKey = true;
    assert.equal(soloverseReady(s), true);
  });

  it("ownedUpgradeNames skips zeros and crowns", () => {
    const s = copy();
    s.upgrades.vitality = 2;
    s.upgrades.echo = 1;
    assert.deepEqual(ownedUpgradeNames(s.upgrades), ["Spare Heart 2"]);
  });

  it("karma shop still spends karma, not skill", () => {
    const s = copy();
    s.karma = 20;
    const next = applyUpgrade(s, "vitality");
    assert.ok(next);
    assert.equal(next.karma, 12);
    assert.equal(next.upgrades.vitality, 1);
    assert.equal(s.karma, 20);
  });
});
