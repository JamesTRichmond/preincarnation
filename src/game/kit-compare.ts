import { RELIC_BY_ID, type RelicId } from "./items.ts";
import { slashDamage } from "./rules.ts";
import { starterWeapon, weaponMoveMod, type Weapon } from "./weapons.ts";

/** Same inputs the yard uses for a slash. Not a score. */
export type StrikeContext = {
  incarnationDamage: number;
  edge: number;
  tropoverse: boolean;
  flawId: string;
};

export type KitRead = {
  handName: string;
  nextName: string | null;
  lead: string;
  strikeHand: string;
  strikeNext: string | null;
  reachHand: string;
  reachNext: string | null;
  walkHand: string;
  walkNext: string | null;
  sheetHand: string;
  sheetNext: string | null;
  clausesHand: string[];
  clausesNext: string[];
  flavorHand: string;
  flavorNext: string | null;
  yLine: string;
  swap: string;
  missing: string | null;
};

export const SWAP_LINE =
  "Next weapon only changes which blade is equipped. Life, mana, and the swing timer stay. A slash sets that timer to a tenth of a second. The speed written on the steel is not that clock.";

export const EMPTY_KIT: KitRead = {
  handName: "Short iron",
  nextName: null,
  lead: "One weapon in hand. Nothing to subtract.",
  strikeHand: "1",
  strikeNext: null,
  reachHand: "14 px",
  reachNext: null,
  walkHand: "0",
  walkNext: null,
  sheetHand: sheetLine(starterWeapon()),
  sheetNext: null,
  clausesHand: ["No extra clause. The cut is the cut."],
  clausesNext: [],
  flavorHand: starterWeapon().flavor,
  flavorNext: null,
  yLine: "No off-hand tool. Q changes weapons. Space still swings.",
  swap: SWAP_LINE,
  missing:
    "Nothing else in the bag. Death leaves other steel on a grave and puts the short iron back in your hand. The shovel and the winters decide what is still there.",
};

/**
 * The only value a weapon change may write. Life, mana, and the swing timer
 * are not arguments, so a caller cannot refill them here.
 */
export function wearNextId(inventory: readonly { id: string }[], equippedId: string): string {
  const next = wearNextWeapon(inventory, equippedId);
  return next ? next.id : equippedId;
}

/** The blade at the next bag slot. Life, mana, and the swing timer are not arguments. */
export function wearNextWeapon<T extends { id: string }>(inventory: readonly T[], equippedId: string): T | null {
  if (inventory.length === 0) return null;
  const i = inventory.findIndex((w) => w.id === equippedId);
  return inventory[(i + 1) % inventory.length];
}

export function readKit(
  inventory: readonly Weapon[],
  equippedId: string,
  strike: StrikeContext,
  ySlot: RelicId | null,
): KitRead {
  const found = inventory.find((w) => w.id === equippedId);
  const missingNamed = !found && inventory.length > 0;
  const hand = found ?? inventory[0] ?? starterWeapon();
  const next = inventory.length > 1 ? wearNextWeapon(inventory, hand.id) : null;
  const sameBlade = !next || next.id === hand.id;

  const lead = sameBlade
    ? "One weapon in hand. Nothing to subtract."
    : `Next minus in hand: reach ${signed(next.reach - hand.reach)} px, walk ${signed(weaponMoveMod(next) - weaponMoveMod(hand))}. Strikes are listed, not ranked. Sheet speed and the combo mark are not the swing timer.`;

  let missing: string | null = null;
  if (inventory.length === 0) {
    missing = "The bag is empty. The short iron stands in until a grave gives something back.";
  } else if (missingNamed) {
    missing = "The equipped blade is not in the bag. The first one is in hand.";
  } else if (sameBlade) {
    missing =
      "Nothing else in the bag. Death leaves other steel on a grave and puts the short iron back in your hand. The shovel and the winters decide what is still there.";
  }

  return {
    handName: hand.name,
    nextName: sameBlade ? null : next.name,
    lead,
    strikeHand: fmt(strikeOf(hand, strike)),
    strikeNext: sameBlade ? null : fmt(strikeOf(next, strike)),
    reachHand: hand.reach + " px",
    reachNext: sameBlade ? null : next.reach + " px",
    walkHand: walkLine(hand),
    walkNext: sameBlade ? null : walkLine(next),
    sheetHand: sheetLine(hand),
    sheetNext: sameBlade ? null : sheetLine(next),
    clausesHand: clauses(hand),
    clausesNext: sameBlade ? [] : clauses(next),
    flavorHand: hand.flavor,
    flavorNext: sameBlade ? null : next.flavor,
    yLine: offHandLine(ySlot, inventory.length > 1),
    swap: SWAP_LINE,
    missing,
  };
}

function strikeOf(w: Weapon, strike: StrikeContext): number {
  return slashDamage({
    weaponDmg: w.dmg,
    incarnationDamage: strike.incarnationDamage,
    edge: strike.edge,
    tropoverse: strike.tropoverse,
    flawId: strike.flawId,
  });
}

function clauses(w: Weapon): string[] {
  const out: string[] = [];
  if (w.projectile && w.kind === "staff") {
    out.push("A shot, and it spends 1 mana or it does not fire. A swap does not refill mana.");
  } else if (w.projectile && w.kind === "rifle") {
    out.push("A shot. When the weapon is empty it draws on the arrow pouch.");
  } else if (w.projectile) {
    out.push("A shot, not a cut.");
  }
  if (w.ammo != null) out.push(w.ammo + " rounds sit on this weapon.");
  const burn = sum(w, "burn");
  const slow = sum(w, "slow");
  const stoned = sum(w, "stoned");
  const drain = sum(w, "drain");
  const steal = sum(w, "lifesteal");
  const karma = sum(w, "karmaOnKill");
  if (burn) out.push("Burn " + fmt(burn) + " on a hit. Kept out of the strike number.");
  if (slow) out.push("Slow " + fmt(slow) + " on a hit. Kept out of the strike number.");
  if (stoned) out.push("Stone " + fmt(stoned) + " on a hit. Kept out of the strike number.");
  if (drain) out.push("Hunger takes " + fmt(drain) + " life on a melee swing. A swap does not give it back.");
  if (steal) out.push("A hit returns " + fmt(steal) + " life. A swap does not.");
  if (karma) out.push("A kill adds " + fmt(karma) + " karma beyond the deed. Not part of the strike.");
  if (w.affixes.some((a) => a.cursed)) out.push("Cursed. The clause is the cost, not a bigger number.");
  if (out.length === 0) out.push("No extra clause. The cut is the cut.");
  return out;
}

function sum(w: Weapon, key: "burn" | "slow" | "stoned" | "drain" | "lifesteal" | "karmaOnKill"): number {
  return w.affixes.reduce((s, a) => s + (a[key] ?? 0), 0);
}

function sheetLine(w: Weapon): string {
  return "speed " + fmt(w.speed) + " on the steel · combo mark " + w.combo + "x · neither is the attack clock";
}

function walkLine(w: Weapon): string {
  const m = weaponMoveMod(w);
  return fmt(m) + (m === 0 ? " (no walk affix)" : " (walk affix, traced)");
}

function offHandLine(ySlot: RelicId | null, bagHasAnother: boolean): string {
  const relic = ySlot ? RELIC_BY_ID[ySlot] : undefined;
  if (!relic) {
    return bagHasAnother
      ? "No off-hand tool. Q changes weapons. Space still swings."
      : "No off-hand tool. Space still swings.";
  }
  if (relic.slot === "Y") {
    return "Off-hand: " + relic.name + " — " + relic.verb + ". Space still swings the weapon. Q cycles tools while one is carried, not the bag.";
  }
  return relic.name + " is passive. Q changes weapons. Space still swings.";
}

function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r);
}

function signed(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (r > 0) return "+" + r;
  return String(r);
}
