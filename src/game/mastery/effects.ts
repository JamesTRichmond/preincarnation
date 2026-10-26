import type { ActionFlags, ActionProfile, ArenaWorld, EffectId, ResourceId, ResourceMap } from "./types.ts";

/**
 * Approved effects.
 * Numbers are taken from src/game/engine.ts and src/game/rules.ts at PACK_SHA.
 * This module does not patch those files.
 *
 * Unresolved on purpose:
 * - No function, relic, or LIMBO_UPGRADES key is named Quarry, Creek, Sugar, Ash, Lantern, or Hollow.
 * - upgrades.wraithBond, sight, echo, and soloverseKey are not combat actions here.
 *   wraithBond / sight have definitions in content.ts and no read in engine.ts.
 *   echo and soloverseKey are crown gates (rules.ts), not tool verbs.
 */

export const HOLD_SECONDS = 0.5;

export const EFFECT_SOURCE: Record<EffectId, string> = {
  "action.slash": "engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy",
  "action.spin": "engine.ts fireSpin; radius 28; charge >= 0.45; spinDamage in rules.ts",
  "action.dig": "engine.ts dig; grave within 20; erodeGrave before recovery; shovel must be ySlot",
  "action.hook": "engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)",
  "action.dash": "engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler",
  "action.swim": "engine.ts moveActor isSolid(..., relics includes flippers); relic flippers verb Swim",
  "action.lantern": "engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)",
  "action.smash": "engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot",
  "action.net": "engine.ts swingNet; crows within 22 only",
  "action.mirror": "engine.ts warpHome; mirror ySlot",
  "action.cape": "engine.ts cape; move 28; invuln 0.45; mp - 1",
  "action.cane": "engine.ts cane; mp >= 1 then mp - 1; places a pot block",
  "action.bow": "engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)",
  "action.bomb": "engine.ts bombPressed; spends 1 bomb; radius 22; damage 2; cracked tile sets quarryOpen. Shop can grant bombs without a new relic check at fire time.",
  "action.cut": "engine.ts cutGrass; bush or pot within 22; called from the slash",
  "action.sip": "engine.ts sip; empties one bottle; syrup or deluxe heals 4 hp; creemee or deluxe fills mp",
};

/** Existing effects this pack deliberately does not bind. They stay unmodified. */
export const INTENTIONALLY_UNBOUND: EffectId[] = ["action.spin", "action.net", "action.mirror", "action.cane"];

export const UNRESOLVED_DISCIPLINE_ABILITIES: Record<string, string> = {
  quarry: "No ability id in src/game at this SHA. Label only. Objects bind to hammer, bombs, shovel, smash, bomb, dig.",
  creek: "No ability id. Objects bind to flippers, hookshot, boots dash.",
  sugar: "No ability id. Objects bind to hookshot (the Sugar-line) and to sip / slash / cut.",
  ash: "No ability id. Objects bind to the ash bow relic and to slash burn, which already exists on hitEnemy.",
  lantern: "No ability id. The oil lamp relic id is lantern. Objects bind to that toggle and its quarry light radii. They do not grant the relic.",
  hollow: "No ability id. Maeve Holloway is an NPC, not an ability. Objects bind to cape and to the existing dash gate. They do not read upgrades.wraithBond.",
};

export function emptyResources(): ResourceMap {
  return { mp: 0, arrows: 0, bombs: 0, hp: 0, karma: 0, bottle: 0 };
}

export function emptyFlags(): ActionFlags {
  return { lanternOn: false, quarryOpen: false, excavated: false, eroded: false, tileOpened: false };
}

/** rules.ts slashDamage, copied so this pack does not import src/game. */
export function slashDamage(world: ArenaWorld): number {
  const tropo = world.tropoverse ? 1.2 : 1;
  const flaw = world.flawId === "the_blade" ? 1.15 : 1;
  return (world.weaponDmg + world.incarnationDamage - 1) * (1 + world.edge * 0.18) * tropo * flaw;
}

/** rules.ts spinDamage. */
export function spinDamage(world: ArenaWorld): number {
  return 2.2 + world.incarnationDamage + world.edge * 0.3;
}

export function dashAllowed(world: ArenaWorld): boolean {
  return world.shadowStep || world.incarnation === "smuggler" || world.relics.includes("boots");
}

function blank(effectId: EffectId): ActionProfile {
  return {
    effectId,
    blocked: false,
    blockReason: null,
    fizzle: false,
    radius: 0,
    reach: 0,
    windup: 0,
    cooldown: 0,
    duration: 0,
    distance: 0,
    damage: 0,
    damageMul: 1,
    speed: 0,
    speedMul: 1,
    chargeThreshold: 0,
    chargeRate: 0,
    power: 0,
    pattern: "none",
    lightShape: "none",
    targetFilter: "none",
    targetCount: 0,
    statusBurn: 0,
    statusSlow: 0,
    selfSlow: 0,
    knockback: 0,
    iFrames: 0,
    heal: 0,
    lightOuter: 0,
    lightInner: 0,
    lightRear: 0,
    surveyRadius: 0,
    coverage: 1,
    resolveHarm: 0,
    spent: emptyResources(),
    grants: emptyResources(),
    flags: emptyFlags(),
  };
}

function block(effectId: EffectId, reason: string): ActionProfile {
  const profile = blank(effectId);
  profile.blocked = true;
  profile.blockReason = reason;
  return profile;
}

export function baseProfile(effectId: EffectId, world: ArenaWorld): ActionProfile {
  switch (effectId) {
    case "action.slash": {
      const profile = blank(effectId);
      profile.damage = slashDamage(world);
      profile.reach = world.weaponReach + 6;
      profile.radius = profile.reach;
      profile.cooldown = 0.1;
      profile.knockback = 10;
      profile.statusBurn = 0;
      profile.pattern = "forward-cut";
      profile.coverage = 1;
      return profile;
    }
    case "action.spin": {
      const profile = blank(effectId);
      profile.damage = spinDamage(world);
      profile.radius = 28;
      profile.cooldown = 0.18;
      profile.chargeThreshold = 0.45;
      profile.chargeRate = 1;
      profile.pattern = "circle";
      profile.knockback = 10;
      return profile;
    }
    case "action.dig": {
      if (world.ySlot !== "shovel" || !world.relics.includes("shovel")) {
        return block(effectId, "Grave shovel is not in the off-hand.");
      }
      const profile = blank(effectId);
      profile.radius = 20;
      profile.pattern = "point";
      profile.fizzle = !world.hasGrave || world.graveExcavated;
      profile.coverage = profile.fizzle ? 0 : 1;
      if (!profile.fizzle) {
        profile.flags.excavated = true;
        profile.flags.eroded = true;
      }
      return profile;
    }
    case "action.hook": {
      if (world.ySlot !== "hookshot" || !world.relics.includes("hookshot")) {
        return block(effectId, "Sugar-line is not in the off-hand.");
      }
      const profile = blank(effectId);
      profile.speed = 220;
      profile.duration = 0.45;
      profile.distance = 220 * 0.45;
      profile.cooldown = 0.2;
      profile.pattern = "line";
      profile.targetFilter = "post-pot-beast";
      profile.targetCount = 3;
      return profile;
    }
    case "action.dash": {
      if (!dashAllowed(world)) {
        return block(effectId, "Dash gate is closed. Need Gap boots, Shadow Step, or the smuggler skin.");
      }
      const profile = blank(effectId);
      profile.distance = 26;
      profile.cooldown = world.relics.includes("boots") ? 0.28 : 0.55;
      profile.pattern = "line";
      profile.iFrames = 0;
      return profile;
    }
    case "action.swim": {
      if (!world.relics.includes("flippers") || !world.inWater) {
        return block(effectId, "Creek fins are required, and you are not in the water.");
      }
      const profile = blank(effectId);
      profile.speed = 76;
      profile.distance = 16;
      profile.pattern = "water-step";
      return profile;
    }
    case "action.lantern": {
      if (world.ySlot !== "lantern" || !world.relics.includes("lantern")) {
        return block(effectId, "Oil lamp is not owned and readied. The quarry stays dark.");
      }
      const profile = blank(effectId);
      profile.lightShape = "radial";
      profile.pattern = "radial";
      profile.lightInner = 28;
      profile.lightOuter = 96;
      profile.flags.lanternOn = true;
      return profile;
    }
    case "action.smash": {
      if (world.ySlot !== "hammer" || !world.relics.includes("hammer")) {
        return block(effectId, "Marble hammer is not in the off-hand.");
      }
      const profile = blank(effectId);
      profile.pattern = "plus";
      profile.coverage = 5;
      profile.radius = 16;
      profile.cooldown = 0.2;
      profile.damage = slashDamage(world);
      profile.reach = world.weaponReach + 6;
      profile.knockback = 10;
      if (world.hasCracked) profile.flags.tileOpened = true;
      return profile;
    }
    case "action.net": {
      if (world.ySlot !== "net" || !world.relics.includes("net")) {
        return block(effectId, "Bug net is not in the off-hand.");
      }
      const profile = blank(effectId);
      profile.radius = 22;
      profile.cooldown = 0.16;
      profile.targetFilter = "crow";
      profile.targetCount = 1;
      return profile;
    }
    case "action.mirror": {
      if (world.ySlot !== "mirror" || !world.relics.includes("mirror")) {
        return block(effectId, "Homestead glass is not in the off-hand.");
      }
      const profile = blank(effectId);
      profile.pattern = "warp-home";
      profile.distance = 1;
      return profile;
    }
    case "action.cape": {
      if (world.ySlot !== "cape" || !world.relics.includes("cape")) {
        return block(effectId, "Shadow cape is not in the off-hand.");
      }
      if (world.mp < 1) return block(effectId, "Phase wants 1 mp.");
      const profile = blank(effectId);
      profile.distance = 28;
      profile.iFrames = 0.45;
      profile.pattern = "forward-phase";
      profile.spent.mp = 1;
      return profile;
    }
    case "action.cane": {
      if (world.ySlot !== "cane" || !world.relics.includes("cane")) {
        return block(effectId, "Somaria rod is not in the off-hand.");
      }
      if (world.mp < 1) return block(effectId, "Block wants 1 mp.");
      const profile = blank(effectId);
      profile.pattern = "block";
      profile.coverage = 1;
      profile.spent.mp = 1;
      return profile;
    }
    case "action.bow": {
      if (world.ySlot !== "bow" || !world.relics.includes("bow")) {
        return block(effectId, "Ash bow is not in the off-hand.");
      }
      if (world.arrows < 1) return block(effectId, "No arrows.");
      const profile = blank(effectId);
      profile.chargeRate = 1.6;
      profile.chargeThreshold = 0.12;
      profile.cooldown = 0.16;
      profile.duration = 0.7;
      profile.pattern = "shot";
      profile.coverage = 1;
      profile.radius = 10;
      profile.knockback = 10;
      profile.power = Math.min(1, profile.chargeRate * HOLD_SECONDS);
      profile.speed = 160 + profile.power * 140;
      profile.damage = 1.3 * (0.7 + profile.power) * (1 + world.edge * 0.1);
      if (profile.power < profile.chargeThreshold) {
        profile.fizzle = true;
        profile.blockReason = "Draw did not reach the release threshold.";
        profile.spent.arrows = 0;
        profile.damage = 0;
      } else {
        profile.spent.arrows = 1;
      }
      return profile;
    }
    case "action.bomb": {
      if (world.bombs < 1) return block(effectId, "No powder kegs.");
      const profile = blank(effectId);
      profile.radius = 22;
      profile.damage = 2;
      profile.pattern = "single";
      profile.coverage = 1;
      profile.spent.bombs = 1;
      if (world.hasCracked) {
        profile.flags.tileOpened = true;
        profile.flags.quarryOpen = true;
      }
      return profile;
    }
    case "action.cut": {
      const profile = blank(effectId);
      profile.radius = 22;
      profile.cooldown = 0.1;
      profile.pattern = "forward-cut";
      return profile;
    }
    case "action.sip": {
      const bottle = world.bottles.find((entry) => entry !== "empty");
      if (!bottle) return block(effectId, "No bottles.");
      const profile = blank(effectId);
      profile.pattern = "drink";
      profile.spent.bottle = 1;
      profile.targetFilter = bottle;
      if (bottle === "syrup" || bottle === "deluxe") {
        profile.heal = 4;
        profile.grants.hp = 4;
      }
      if (bottle === "creemee" || bottle === "deluxe") {
        profile.grants.mp = Math.max(0, world.maxMp - world.mp);
      }
      return profile;
    }
    default:
      return block(effectId, "Unknown effect.");
  }
}

export const PRESS_RESOURCES: Partial<Record<EffectId, ResourceId[]>> = {
  "action.bomb": ["bombs"],
  "action.cape": ["mp"],
  "action.cane": ["mp"],
  "action.sip": ["bottle"],
};

