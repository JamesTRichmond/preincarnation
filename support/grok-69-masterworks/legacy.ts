/**
 * Frozen view of PREINCARNATION equipment at c737e42.
 * The pack does not edit src/game. Names are the duplicate catalog.
 * slashDamage is mirrored from src/game/rules.ts — same arithmetic, no import.
 */

export const LEGACY_WEAPON_NAMES = [
  "Short iron",
  "Farm knife",
  "Mill blade",
  "Longsword",
  "Otter saber",
  "Green-ridge blade",
  "Boot knife",
  "Smuggler's dirk",
  "Tap-handle shiv",
  "Splitting maul",
  "Gooseneck axe",
  "Cordwood fury",
  "Blacksmith's peen",
  "Rail mallet",
  "Town-hall gavel",
  "Hay fork",
  "Pike",
  "Lake spear",
  "Bread Loaf staff",
  "Registrar's rod",
  "Frost-cabin oak",
  ".30-06 hunting rifle",
  "Kitchen-door Winchester",
  "Camp .270",
  "12-gauge",
  "Barn coach gun",
  "Turkey gun",
  "Ash bow",
  "Sugarbush longbow",
  "Sap tap",
  "Syrup ladle",
  "Sugar-stick",
  "Pond hockey stick",
  "Otter-rink slapper",
] as const;

export const LEGACY_AFFIX_NAMES = [
  "Keen",
  "Swift",
  "Long",
  "Twinned",
  "Blessed",
  "Ember",
  "Hoarfrost",
  "Sugared",
  "Kind",
  "of Hunger",
  "Lead-foot",
  "Hollow-point",
  "Echoing",
] as const;

export const LEGACY_RELICS = [
  { id: "sword", name: "Short iron", verb: "Slash / hold spin" },
  { id: "shovel", name: "Grave shovel", verb: "Dig" },
  { id: "hookshot", name: "Sugar-line", verb: "Zip" },
  { id: "boots", name: "Gap boots", verb: "Dash" },
  { id: "flippers", name: "Creek fins", verb: "Swim" },
  { id: "lantern", name: "Oil lamp", verb: "Light" },
  { id: "hammer", name: "Marble hammer", verb: "Smash" },
  { id: "net", name: "Bug net", verb: "Catch" },
  { id: "mirror", name: "Homestead glass", verb: "Return" },
  { id: "cape", name: "Shadow cape", verb: "Phase" },
  { id: "cane", name: "Somaria rod", verb: "Block" },
  { id: "bow", name: "Ash bow", verb: "Draw" },
  { id: "ipod", name: "Strange device", verb: "Play" },
  { id: "bombs", name: "Powder kegs", verb: "Set" },
] as const;

export const LEGACY_UPGRADES = [
  "Spare Heart",
  "Edge",
  "Stride",
  "Sight",
  "Shadow Step",
  "Wraith Bond",
  "Echo",
  "Soloverse Key",
] as const;

export const LEGACY_ARCHETYPES = [
  "iron",
  "sword",
  "dagger",
  "axe",
  "hammer",
  "spear",
  "staff",
  "rifle",
  "shotgun",
  "bow",
  "maple",
  "hockey",
] as const;

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PHRASES = [
  ...LEGACY_WEAPON_NAMES,
  ...LEGACY_AFFIX_NAMES,
  ...LEGACY_RELICS.map((r) => r.name),
  ...LEGACY_UPGRADES,
].map(normalizeName);

/** Whole-phrase collision: legacy tokens appear contiguously in the candidate. */
export function semanticDuplicate(name: string): string | null {
  const n = normalizeName(name);
  const tokens = n.split(" ").filter(Boolean);
  for (const p of PHRASES) {
    if (!p) continue;
    if (n === p) return p;
    const pt = p.split(" ").filter(Boolean);
    for (let i = 0; i + pt.length <= tokens.length; i++) {
      if (pt.every((w, k) => tokens[i + k] === w)) return p;
    }
  }
  return null;
}

/** Mirror of rules.slashDamage at c737e42. Do not "improve" this. */
export function legacySlashDamage(opts: {
  weaponDmg: number;
  incarnationDamage: number;
  edge: number;
  tropoverse: boolean;
  flawId: string;
}): number {
  const tropo = opts.tropoverse ? 1.2 : 1;
  const flaw = opts.flawId === "the_blade" ? 1.15 : 1;
  return (opts.weaponDmg + opts.incarnationDamage - 1) * (1 + opts.edge * 0.18) * tropo * flaw;
}

/**
 * Mirror of items.erodeGrave's weapon filter: magic pieces stay,
 * mundane steel thins out. Masterworks are recorded magic so old graves keep them.
 * There is no repair step in that filter and none is added here.
 */
export function legacyKeepsWeapon(magic: boolean, years: number, rand: () => number): boolean {
  if (magic) return true;
  if (years >= 12) return rand() < 0.22;
  if (years >= 6) return rand() < 0.55;
  return rand() < 0.8;
}
