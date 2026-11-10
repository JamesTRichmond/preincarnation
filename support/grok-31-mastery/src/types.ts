/** Reference mastery types for PREINCARNATION.
 * Inspected against JamesTRichmond/preincarnation@c737e42 (SaveData v8).
 * This module does not import src/game and does not mutate that save.
 */

export const MODULE_KIND = "reference" as const;

export const INSPECTED_GAME_SAVE_VERSION = 8;

export const MODULE_NOTE =
  "Reference module. The action runtime is not in this workspace. Ability rows marked unwritten are reserved ids, not hidden powers.";

export const DISCIPLINES = ["quarry", "creek", "sugar", "ash", "lantern", "hollow"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_COPY: Record<Discipline, { name: string; line: string }> = {
  quarry: { name: "Quarry", line: "Impact, fault lines, weight and force." },
  creek: { name: "Creek", line: "Movement, redirection, and flowing counters." },
  sugar: { name: "Sugar", line: "Tethers, connected targets, and held tension." },
  ash: { name: "Ash", line: "Ranged pressure, marked shots, and delayed reactions." },
  lantern: { name: "Lantern", line: "Perception, witnessed acts, and revealed weakness." },
  hollow: { name: "Hollow", line: "Afterimages, absence, and unrealized movement." },
};

/** Existing verbs. Inscriptions ride these. They are not new buttons. */
export const HOST_VERBS = [
  "slash",
  "spin",
  "walk",
  "dash",
  "swim",
  "tool:shovel",
  "tool:hookshot",
  "tool:boots",
  "tool:flippers",
  "tool:lantern",
  "tool:hammer",
  "tool:net",
  "tool:mirror",
  "tool:cape",
  "tool:cane",
  "tool:bow",
  "tool:bombs",
] as const;
export type HostVerb = (typeof HOST_VERBS)[number];

export const TOOL_IDS = [
  "shovel",
  "hookshot",
  "boots",
  "flippers",
  "lantern",
  "hammer",
  "net",
  "mirror",
  "cape",
  "cane",
  "bow",
  "bombs",
] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export const ERAS = ["era-1", "era-2", "era-3", "era-4", "era-5", "era-6"] as const;
export type EraId = (typeof ERAS)[number];

export const DUNGEON_IDS = Array.from({ length: 16 }, (_, i) => `dungeon-${String(i + 1).padStart(2, "0")}`);

export const EXPECTED_COUNTS = {
  inscription: 72,
  tool: 36,
  form: 32,
  cross: 24,
} as const;

/** Initial tuning. Not permission to add combat buttons. */
export const TUNING = {
  maxSockets: 6,
  maxTools: 2,
  maxForms: 3,
  maxVows: 1,
  maxCapstones: 1,
  /** Campaign discoveries/choices required before a shrine Release counts as a life. */
  minMeaningfulForRelease: 2,
  maxRepeatPaysPerSource: 2,
  /** All repeatable encounter payouts, forever, across every life. */
  repeatCampaignCap: 6,
  repeatDecay: 0.5,
} as const;

export type RecordKind = "inscription" | "tool" | "form" | "cross";
export type RecordRole = "standard" | "vow" | "capstone";
export type RecordStatus = "authored" | "reserved";

export type Modifier = {
  key: string;
  op: "add" | "mul" | "flag";
  value: number | boolean;
};

export type MasteryRecord = {
  id: string;
  kind: RecordKind;
  status: RecordStatus;
  name: string | null;
  summary: string | null;
  disciplines: Discipline[];
  tier: 1 | 2 | 3 | 4;
  role: RecordRole;
  hosts: HostVerb[];
  toolId: ToolId | null;
  cost: number;
  requires: string[];
  requiresSources: string[];
  requiresEras: EraId[];
  requiresDungeons: string[];
  excludes: string[];
  tags: string[];
  channel: string | null;
  bound: boolean;
  modifiers: Modifier[];
};

export type RecordOverlay = {
  id: string;
  name: string;
  summary: string;
  cost: number;
  channel: string;
  hosts?: HostVerb[];
  tier?: 1 | 2 | 3 | 4;
  role?: RecordRole;
  requires?: string[];
  requiresSources?: string[];
  requiresEras?: EraId[];
  requiresDungeons?: string[];
  excludes?: string[];
  tags?: string[];
  modifiers?: Modifier[];
  bound?: boolean;
};

export type SourceKind = "discovery" | "encounter" | "choice";
export type SourceRepeat = "campaign" | "life";

export type WitnessSource = {
  id: string;
  kind: SourceKind;
  repeat: SourceRepeat;
  amount: number;
  label: string;
  note: string;
};

export type DeathCause = "combat" | "hazard" | "scripted" | "release";

export type JournalEvent =
  | { t: "grant"; sourceId: string; lifeId: string; amount: number; via: "bank" | "escrow" }
  | {
      t: "death";
      lifeId: string;
      cycle: number;
      cause: DeathCause;
      deathSiteKey: string;
      hollow: boolean;
      paid: number;
      paidSources: string[];
    }
  | { t: "return"; nextLifeId: string; lifeSerial: number }
  | { t: "purchase"; id: string; cost: number }
  | { t: "respec"; refunded: { id: string; amount: number }[] }
  | { t: "refund"; id: string; amount: number }
  | { t: "open-era"; era: EraId }
  | { t: "open-dungeon"; dungeon: string }
  | { t: "grant-bound"; id: string };

export type Loadout = {
  sockets: string[];
  tools: string[];
  forms: string[];
  vow: string | null;
  capstone: string | null;
};

export type Owned = { costPaid: number; bound: boolean };

export type GameMirror = {
  name: string;
  year: number;
  lastDeed: string;
  incarnation: "wanderer" | "smuggler" | "officer" | "embryo";
  skillPoints: number;
  karma: number;
  host: "god" | "devil" | null;
  saveVersion: number;
};

export type MasteryState = {
  version: 1;
  phase: "living" | "afterlife";
  cycle: number;
  lifeId: string;
  lifeSerial: number;
  witnessBank: number;
  suicideStreak: number;
  repeatPaid: Record<string, { pays: number; total: number }>;
  escrow: { sourceId: string; amount: number }[];
  claimedCampaign: string[];
  claimedThisLife: string[];
  meaningfulActs: number;
  owned: Record<string, Owned>;
  loadout: Loadout;
  eraOpened: EraId[];
  dungeonsOpened: string[];
  lastDeathSite: string | null;
  lastDeathCause: DeathCause | null;
  respecsThisVisit: number;
  journal: JournalEvent[];
  game: GameMirror;
};

export type Intent =
  | { t: "grant"; sourceId: string }
  | { t: "death"; cause: DeathCause; deathSiteKey: string; cycle: number }
  | { t: "return" }
  | { t: "purchase"; id: string }
  | { t: "respec" }
  | { t: "refund"; id: string }
  | { t: "open-era"; era: EraId }
  | { t: "open-dungeon"; dungeon: string }
  | { t: "grant-bound"; id: string };

export type Result<T> = { ok: true; value: T } | { ok: false; code: string; error: string };

export const emptyLoadout = (): Loadout => ({
  sockets: [],
  tools: [],
  forms: [],
  vow: null,
  capstone: null,
});

export function fail(code: string, error: string): Result<never> {
  return { ok: false, code, error };
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}
