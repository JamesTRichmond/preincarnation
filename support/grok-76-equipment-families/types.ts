/** Equipment-family types. Slot budget matches PREINCARNATION: hand, Y, worn. */

export const BODIES = ["wanderer", "smuggler", "officer", "embryo"] as const;
export type BodyId = (typeof BODIES)[number];

/** The six limbo disciplines. Pieces lean. They do not spend or require ranks. */
export const DISCIPLINES = ["edge", "stride", "sight", "shadow", "bond", "vitality"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const EQUIP_SLOTS = ["hand", "y", "worn"] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

export const SLOT_BUDGET = EQUIP_SLOTS.length;
export const FAMILY_SIZE = 5;

export type PieceSlot = EquipSlot | "pack";
export type CountsWhen = "equipped" | "carried" | "used";
export type Presence = "equipped" | "carried" | "used";

export const STAT_KEYS = [
  "maxHp",
  "atk",
  "haste",
  "guard",
  "light",
  "oilDrain",
  "oilCap",
  "warmth",
  "wetOut",
  "soakVuln",
  "beastOut",
  "burst",
  "opening",
  "sustain",
  "maxMp",
  "mpRegen",
  "reflect",
  "dmgCap",
  "namedOnly",
  "frostOut",
  "burnVuln",
  "chipOut",
  "hearingOut",
] as const;
export type Stat = (typeof STAT_KEYS)[number];
export type Stats = Record<Stat, number>;

export const MOD_PHASES = ["piece", "pair", "count", "sidegrade"] as const;
export type ModPhase = (typeof MOD_PHASES)[number];

export const MOD_MODES = ["add", "mul", "capMax", "capMin"] as const;
export type ModMode = (typeof MOD_MODES)[number];

export type ModTone = "gift" | "cost" | "plain";

export type ModDraft = {
  stat: Stat;
  mode: ModMode;
  value: number;
  tone: ModTone;
};

export type ResolvedMod = ModDraft & {
  phase: ModPhase;
  source: string;
};

export type Discovery = {
  place: string;
  notice: string;
  take: string;
};

export type ItemDef = {
  id: string;
  familyId: string;
  name: string;
  slot: PieceSlot;
  countsWhen: CountsWhen;
  bodies: BodyId[];
  discipline: Discipline;
  solo: string;
  discovery: Discovery;
  mods: ModDraft[];
};

export type FamilyPair = {
  id: string;
  name: string;
  note: string;
  pieceIds: [string, string];
  mods: ModDraft[];
};

export type FamilyCount = {
  at: 2 | 3;
  name: string;
  note: string;
  mods: ModDraft[];
};

export type FamilySidegrade = {
  name: string;
  gives: string;
  costs: string;
  mods: ModDraft[];
};

export type FamilyDef = {
  id: string;
  name: string;
  identity: string;
  pieceIds: string[];
  pair: FamilyPair;
  counts: FamilyCount[];
  sidegrade: FamilySidegrade;
};

export type Instance = {
  instanceId: string;
  defId: string;
  presence: Presence;
  slot?: EquipSlot;
};

export type Loadout = {
  version: 1;
  body: BodyId;
  instances: Instance[];
};

export type Rejected = { instanceId: string; defId: string; reason: string };

export type FamilyRecognition = {
  id: string;
  name: string;
  count: number;
  pieceIds: string[];
};

export type Resolution = {
  body: BodyId;
  families: FamilyRecognition[];
  pairs: string[];
  counts: string[];
  sidegrades: string[];
  recognizedIds: string[];
  heldIds: string[];
  duplicates: string[];
  rejected: Rejected[];
  modifiers: ResolvedMod[];
  stats: Stats;
  leans: Record<Discipline, number>;
  lines: string[];
};

export const BODY_LABEL: Record<BodyId, string> = {
  wanderer: "Wanderer",
  smuggler: "Smuggler",
  officer: "Officer",
  embryo: "Embryo",
};

export const SLOT_LABEL: Record<EquipSlot, string> = {
  hand: "Hand",
  y: "Y",
  worn: "Worn",
};

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  edge: "Edge",
  stride: "Stride",
  sight: "Sight",
  shadow: "Shadow",
  bond: "Bond",
  vitality: "Vitality",
};

export function emptyStats(): Stats {
  const stats = {} as Stats;
  for (const key of STAT_KEYS) stats[key] = 0;
  return stats;
}

export function baseStats(body: BodyId): Stats {
  const stats = emptyStats();
  stats.maxHp = 40;
  stats.atk = 6;
  stats.haste = 1;
  stats.oilCap = 6;
  stats.warmth = 4;
  stats.maxMp = 8;
  stats.mpRegen = 0.2;
  stats.dmgCap = 999;
  if (body === "smuggler") {
    stats.maxHp = 32;
    stats.atk = 7;
    stats.haste = 1.12;
    stats.burst = 0.2;
    stats.warmth = 2;
    stats.maxMp = 6;
  } else if (body === "officer") {
    stats.maxHp = 46;
    stats.atk = 6;
    stats.guard = 0.06;
    stats.warmth = 3;
    stats.haste = 0.96;
  } else if (body === "embryo") {
    stats.maxHp = 28;
    stats.atk = 5;
    stats.haste = 1.04;
    stats.maxMp = 14;
    stats.mpRegen = 0.45;
    stats.reflect = 1;
    stats.warmth = 2;
  }
  return stats;
}

export function fid(n: number): string {
  return `loot.expansion.family.${String(n).padStart(3, "0")}`;
}
