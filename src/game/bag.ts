import type { BottleKind } from "./types.ts";
import type { Affix, Weapon, WeaponKind } from "./weapons.ts";

/** A weapon the mound remembers. Old graves omit the numbers and still load. */
export type GraveWeapon = {
  id: string;
  name: string;
  magic: boolean;
  kind: string;
  dmg?: number;
  speed?: number;
  reach?: number;
  combo?: number;
  projectile?: boolean;
  ammo?: number;
  affixes?: Affix[];
  flavor?: string;
};

const KINDS = new Set<WeaponKind>(["blade", "heavy", "pole", "staff", "rifle", "bow", "odd"]);

/** What weather can keep of a weapon that is not the starter iron. */
export function graveSnapshot(w: Weapon): GraveWeapon {
  return {
    id: w.id,
    name: w.name,
    magic: w.affixes.some((a) => a.magic),
    kind: w.kind,
    dmg: w.dmg,
    speed: w.speed,
    reach: w.reach,
    combo: w.combo,
    projectile: w.projectile,
    ammo: w.ammo,
    affixes: w.affixes.map((a) => ({ ...a })),
    flavor: w.flavor,
  };
}

/**
 * A grave that still names its numbers comes back as that weapon.
 * A grave from an older life names only the steel; the caller rerolls.
 */
export function weaponFromGrave(g: GraveWeapon): Weapon | null {
  if (typeof g.dmg !== "number" || !Number.isFinite(g.dmg)) return null;
  if (!Array.isArray(g.affixes)) return null;
  const kind: WeaponKind = KINDS.has(g.kind as WeaponKind) ? (g.kind as WeaponKind) : "odd";
  return {
    id: g.id,
    name: g.name,
    kind,
    dmg: g.dmg,
    speed: typeof g.speed === "number" ? g.speed : 0.28,
    reach: typeof g.reach === "number" ? g.reach : 14,
    combo: typeof g.combo === "number" ? g.combo : 1,
    projectile: g.projectile === true,
    ammo: g.ammo,
    affixes: g.affixes.map((a) => ({ ...a })),
    flavor: g.flavor ?? "",
  };
}

/**
 * Hurt hands reach for syrup. A dry well reaches for a creemee.
 * Otherwise the first bottle that is not empty, which is how V always drank.
 */
export function sipIndex(bottles: readonly BottleKind[], hp: number, maxHp: number, mp: number, maxMp: number): number {
  const hurt = hp < maxHp - 0.05;
  const dry = mp < maxMp - 0.05;
  if (hurt) {
    const syrup = bottles.findIndex((b) => b === "syrup" || b === "deluxe");
    if (syrup >= 0) return syrup;
  }
  if (dry) {
    const sweet = bottles.findIndex((b) => b === "creemee" || b === "deluxe");
    if (sweet >= 0) return sweet;
  }
  return bottles.findIndex((b) => b !== "empty");
}
