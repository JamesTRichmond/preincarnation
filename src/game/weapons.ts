export type WeaponKind = "blade" | "heavy" | "pole" | "staff" | "rifle" | "bow" | "odd";

export type Affix = {
  id: string;
  name: string;
  cursed: boolean;
  magic: boolean;
  dmg?: number;
  speed?: number;
  reach?: number;
  combo?: number;
  drain?: number;
  lifesteal?: number;
  burn?: number;
  slow?: number;
  stoned?: number;
  karmaOnKill?: number;
  move?: number;
};

export type Weapon = {
  id: string;
  name: string;
  kind: WeaponKind;
  dmg: number;
  speed: number;
  reach: number;
  combo: number;
  projectile: boolean;
  ammo?: number;
  affixes: Affix[];
  flavor: string;
};

const AFFIXES: Affix[] = [
  { id: "keen", name: "Keen", cursed: false, magic: false, dmg: 0.45 },
  { id: "swift", name: "Swift", cursed: false, magic: false, speed: -0.04, combo: 1 },
  { id: "long", name: "Long", cursed: false, magic: false, reach: 6 },
  { id: "twin", name: "Twinned", cursed: false, magic: true, combo: 1 },
  { id: "blessed", name: "Blessed", cursed: false, magic: true, karmaOnKill: 2, dmg: 0.2 },
  { id: "ember", name: "Ember", cursed: false, magic: true, burn: 0.6 },
  { id: "frost", name: "Hoarfrost", cursed: false, magic: true, slow: 0.45 },
  { id: "sticky", name: "Sugared", cursed: false, magic: false, slow: 0.55, dmg: 0.15 },
  { id: "kind", name: "Kind", cursed: false, magic: true, stoned: 2.2, move: -0.08 },
  { id: "hunger", name: "of Hunger", cursed: true, magic: true, dmg: 1.1, drain: 0.35 },
  { id: "lead", name: "Lead-foot", cursed: true, magic: false, dmg: 1.4, move: -0.22, speed: 0.06 },
  { id: "hollow", name: "Hollow-point", cursed: false, magic: false, dmg: 0.8 },
  { id: "echo", name: "Echoing", cursed: false, magic: true, combo: 1, karmaOnKill: 1 },
];

type Archetype = {
  kind: WeaponKind;
  names: string[];
  dmg: number;
  speed: number;
  reach: number;
  combo: number;
  projectile: boolean;
  flavor: string;
};

const ARCH: Record<string, Archetype> = {
  iron: { kind: "blade", names: ["Short iron", "Farm knife", "Mill blade"], dmg: 1, speed: 0.16, reach: 14, combo: 2, projectile: false, flavor: "Honest steel from a kitchen drawer." },
  sword: { kind: "blade", names: ["Longsword", "Otter saber", "Green-ridge blade"], dmg: 1.35, speed: 0.18, reach: 16, combo: 2, projectile: false, flavor: "A knight's idea of Vermont." },
  dagger: { kind: "blade", names: ["Boot knife", "Smuggler's dirk", "Tap-handle shiv"], dmg: 0.85, speed: 0.1, reach: 11, combo: 3, projectile: false, flavor: "Three cuts before they blink." },
  axe: { kind: "heavy", names: ["Splitting maul", "Gooseneck axe", "Cordwood fury"], dmg: 1.8, speed: 0.26, reach: 15, combo: 1, projectile: false, flavor: "It prefers maple, but will settle." },
  hammer: { kind: "heavy", names: ["Blacksmith's peen", "Rail mallet", "Town-hall gavel"], dmg: 1.6, speed: 0.24, reach: 13, combo: 2, projectile: false, flavor: "Civic and unkind." },
  spear: { kind: "pole", names: ["Hay fork", "Pike", "Lake spear"], dmg: 1.2, speed: 0.2, reach: 20, combo: 2, projectile: false, flavor: "Keep the bear at fork's length." },
  staff: { kind: "staff", names: ["Bread Loaf staff", "Registrar's rod", "Frost-cabin oak"], dmg: 1.1, speed: 0.2, reach: 16, combo: 2, projectile: false, flavor: "College timber, quietly magical." },
  rifle: { kind: "rifle", names: [".30-06 hunting rifle", "Kitchen-door Winchester", "Camp .270"], dmg: 2.2, speed: 0.34, reach: 48, combo: 1, projectile: true, flavor: "Most houses in the county keep one behind the door." },
  shotgun: { kind: "rifle", names: ["12-gauge", "Barn coach gun", "Turkey gun"], dmg: 2.6, speed: 0.4, reach: 28, combo: 1, projectile: true, flavor: "Wide pattern. Poor manners." },
  bow: { kind: "bow", names: ["Ash bow", "Sugarbush longbow"], dmg: 1.3, speed: 0.22, reach: 36, combo: 1, projectile: true, flavor: "Quiet as a deer yard." },
  maple: { kind: "odd", names: ["Sap tap", "Syrup ladle", "Sugar-stick"], dmg: 0.9, speed: 0.14, reach: 13, combo: 2, projectile: false, flavor: "Sticky, sweet, surprisingly stern." },
  hockey: { kind: "odd", names: ["Pond hockey stick", "Otter-rink slapper"], dmg: 1.25, speed: 0.16, reach: 18, combo: 2, projectile: false, flavor: "Wrist shot from the frozen creek." },
};

const CACHE_ARCH: Record<string, string[]> = {
  farmhouse: ["rifle", "shotgun", "axe", "iron"],
  barn: ["rifle", "axe", "hammer", "maple"],
  woods: ["bow", "rifle", "spear", "axe"],
  downtown: ["sword", "dagger", "hockey", "iron"],
  college: ["staff", "dagger", "bow"],
  sugarhouse: ["maple", "axe", "hammer"],
  capitol: ["sword", "hammer", "staff"],
  rail: ["hammer", "iron", "hockey"],
  harbor: ["spear", "bow", "rifle"],
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, list: T[]): T {
  return list[Math.floor(r() * list.length) % list.length];
}

export function starterWeapon(): Weapon {
  return {
    id: "starter-iron",
    name: "Short iron",
    kind: "blade",
    dmg: 1,
    speed: 0.16,
    reach: 14,
    combo: 2,
    projectile: false,
    affixes: [],
    flavor: "A farmhand's blade. Two cuts in one breath.",
  };
}

export function rollWeapon(cacheId: string, cacheKind: string, cycle: number): Weapon {
  const r = rng(hash(cacheId + ":" + cycle));
  const pool = CACHE_ARCH[cacheKind] ?? CACHE_ARCH.downtown;
  const arch = ARCH[pick(r, pool)];
  const name = pick(r, arch.names);
  const affixes: Affix[] = [];
  if (r() < 0.72) affixes.push(pick(r, AFFIXES.filter((a) => !a.cursed)));
  if (r() < 0.28) affixes.push(pick(r, AFFIXES));
  if (r() < 0.12) affixes.push(pick(r, AFFIXES.filter((a) => a.cursed)));
  if (arch.kind === "odd" && cacheKind === "dispensary") affixes.push(AFFIXES.find((a) => a.id === "kind")!);
  if (arch.kind === "odd" && cacheKind === "sugarhouse") affixes.push(AFFIXES.find((a) => a.id === "sticky")!);

  let dmg = arch.dmg;
  let speed = arch.speed;
  let reach = arch.reach;
  let combo = arch.combo;
  for (const a of affixes) {
    dmg += a.dmg ?? 0;
    speed += a.speed ?? 0;
    reach += a.reach ?? 0;
    combo += a.combo ?? 0;
  }
  combo = Math.max(1, Math.min(4, Math.round(combo)));
  speed = Math.max(0.08, speed);

  const cursed = affixes.some((a) => a.cursed);
  const magic = affixes.some((a) => a.magic);
  const prefix = affixes[0] && !affixes[0].name.startsWith("of") ? affixes[0].name + " " : "";
  const suffix = affixes.find((a) => a.name.startsWith("of"))?.name ?? "";
  const display = (prefix + name + (suffix ? " " + suffix : "")).trim();

  return {
    id: cacheId,
    name: display,
    kind: arch.kind,
    dmg,
    speed,
    reach,
    combo,
    projectile: arch.projectile,
    ammo: arch.projectile ? 12 + Math.floor(r() * 12) : undefined,
    affixes,
    flavor: cursed
      ? arch.flavor + " It takes as much as it gives."
      : magic
        ? arch.flavor + " It hums like a powerline in fog."
        : arch.flavor,
  };
}

export function summarizeWeapon(w: Weapon) {
  const tags = w.affixes.map((a) => a.name);
  if (w.projectile) tags.unshift("ranged");
  tags.unshift(w.combo + "x");
  return tags.slice(0, 4).join(" · ");
}

export function weaponMoveMod(w: Weapon) {
  return w.affixes.reduce((s, a) => s + (a.move ?? 0), 0);
}
