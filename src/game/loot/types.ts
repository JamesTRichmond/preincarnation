export const CATEGORIES = [
  "object",
  "equipment",
  "relic",
  "provision",
  "card",
  "food",
  "decoration",
  "evidence",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SLOTS = ["hands", "feet", "head", "body", "tool", "pack"] as const;
export type Slot = (typeof SLOTS)[number];

export type StatName = "satiation" | "warmth" | "health" | "light" | "clue" | "guard" | "memory";

export type EffectName = "grip" | "trail" | "night" | "cold" | "chapel" | "carry" | "memory";

export type Source =
  | { kind: "site"; siteId: string }
  | { kind: "merchant" }
  | { kind: "recipe"; recipeId: string }
  | { kind: "cache"; cacheId: string }
  | { kind: "cook"; recipeId: string; rawId: string };

export type UseSpec =
  | { op: "repair"; amount: number; slot: Slot }
  | { op: "salvage"; yields: Record<string, number> }
  | { op: "bind"; cacheId: string }
  | { op: "light"; turns: number }
  | { op: "store" }
  | { op: "unlock"; lockId: string }
  | { op: "annotate" }
  | { op: "survey"; siteId: string }
  | { op: "press" }
  | { op: "cut" }
  | { op: "bandage"; amount: number }
  | { op: "signal"; siteId: string }
  | { op: "wedge"; stuckId: string }
  | { op: "consume"; stat: StatName; amount: number }
  | { op: "stoke"; turns: number }
  | { op: "eat"; amount: number }
  | { op: "cook" }
  | { op: "compost"; mat: string; qty: number }
  | { op: "equip" }
  | { op: "place" }
  | { op: "unplace" }
  | { op: "display" }
  | { op: "restore" }
  | { op: "attest" }
  | { op: "deck-add" }
  | { op: "deck-play" }
  | { op: "read" }
  | { op: "present" };

export interface ItemDef {
  id: string;
  name: string;
  category: Category;
  pack: string;
  blurb: string;
  value: number;
  tags: string[];
  uses: UseSpec[];
  source: Source;
  refs: string[];
  slot?: Slot;
  effectStat?: EffectName;
  effectAmt?: number;
  broken?: boolean;
  cooksTo?: string;
  cookedFrom?: string;
  placeSlot?: string;
  suit?: string;
  rank?: number;
  edition?: number;
  playStat?: StatName;
  playAmt?: number;
  cacheId?: string;
  letterRole?: "primary" | "corroborating";
  small?: boolean;
}

export interface Recipe {
  id: string;
  outputDefId: string;
  inputs: Record<string, number>;
  kind: "craft" | "cook";
}

export interface CacheDef {
  id: string;
  siteId: string;
  rewardDefId: string;
  primaryLetterId: string;
  corroboratingLetterId: string;
}

export interface Catalog {
  version: string;
  items: ItemDef[];
  byId: Map<string, ItemDef>;
  recipes: Recipe[];
  recipeById: Map<string, Recipe>;
  recipeByOutput: Map<string, Recipe>;
  caches: CacheDef[];
  cacheById: Map<string, CacheDef>;
  cacheByReward: Map<string, CacheDef>;
  merchantDefIds: string[];
  idsByCategory: Record<Category, string[]>;
}

export type Custody =
  | "ground"
  | "inventory"
  | "merchant"
  | "contained"
  | "equipped"
  | "placed"
  | "displayed"
  | "deck"
  | "discard"
  | "corpse"
  | "veil"
  | "estate"
  | "destroyed";

export interface Instance {
  iid: string;
  defId: string;
  ownerLife: number;
  custody: Custody;
  siteId?: string;
  containerIid?: string;
  slot?: string;
  condition: number;
  inspected: boolean;
  read: boolean;
  notes: number;
  preserved: boolean;
  spoiled: boolean;
  restored: boolean;
  attested: boolean;
  broken: boolean;
  history: string[];
  origin: string;
}

export interface CacheState {
  presented: boolean;
  corroborated: boolean;
  looted: boolean;
  sealed: boolean;
  rewardIid?: string;
}

export interface LedgerEntry {
  seq: number;
  life: number;
  year: number;
  op: "create" | "destroy" | "move" | "seed";
  iid?: string;
  defId?: string;
  from?: string;
  to?: string;
  reason: string;
  valueDelta: number;
}

export interface TraceEvent {
  menu: string;
  action: string;
  ok: boolean;
  itemId?: string;
}

export interface Stats {
  satiation: number;
  warmth: number;
  health: number;
  light: number;
  clue: number;
  guard: number;
  memory: number;
}

export interface Effects {
  grip: number;
  trail: number;
  night: number;
  cold: number;
  chapel: number;
  carry: number;
  memory: number;
}

export interface World {
  year: number;
  life: number;
  age: number;
  alive: boolean;
  place: string;
  playerScrip: number;
  merchantScrip: number;
  fireTurns: number;
  inspectFirst: boolean;
  stats: Stats;
  effects: Effects;
  materials: Record<string, number>;
  instances: Record<string, Instance>;
  seq: number;
  knowledge: string[];
  caches: Record<string, CacheState>;
  locks: Record<string, boolean>;
  stuck: Record<string, boolean>;
  sites: Record<string, { surveyed: boolean; signaled: boolean }>;
  ledger: LedgerEntry[];
  log: string[];
  trace: TraceEvent[];
  valueSeeded: number;
  deathPlace?: string;
  deathYear?: number;
  deathLife?: number;
}

export type Action = {
  menu?: string;
} & (
  | { type: "travel"; siteId: string }
  | { type: "pickup"; iid: string }
  | { type: "inspect"; iid: string }
  | { type: "use"; iid: string; which: 0 | 1 }
  | { type: "equip"; iid: string }
  | { type: "unequip"; slot: Slot }
  | { type: "craft"; recipeId: string }
  | { type: "place"; iid: string }
  | { type: "unplace"; iid: string }
  | { type: "display"; iid: string }
  | { type: "restore"; iid: string }
  | { type: "attest"; iid: string }
  | { type: "deck-add"; iid: string }
  | { type: "deck-play"; iid: string }
  | { type: "read"; iid: string }
  | { type: "present"; iid: string }
  | { type: "search"; cacheId: string }
  | { type: "barter"; offerIid: string; stockIid: string }
  | { type: "buy"; iid: string }
  | { type: "die" }
  | { type: "return" }
  | { type: "claim"; iid: string }
);

export interface Failure {
  itemId: string;
  check: string;
  detail: string;
  fix: string;
}
