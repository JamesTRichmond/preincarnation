/** Provisions loot for PREINCARNATION. IDs loot.provision.001–120 only. */

export const ID_PREFIX = "loot.provision.";
export const DISH_PREFIX = "cook.dish.";

export const SEASONS = ["sugaring", "spring", "summer", "autumn", "deer", "ice"] as const;
export type Season = (typeof SEASONS)[number];

export const BINS = ["pouch", "creel", "cellar", "tin"] as const;
export type Bin = (typeof BINS)[number];

export type Kind = "ingredient" | "bait" | "field" | "hazard";
export type Rarity = "common" | "seasonal" | "uncommon" | "rare";
export type Method = "gather" | "fish" | "hunt" | "farm" | "buy" | "quarry" | "camp";
export type EraBehavior = "stable" | "spreads" | "scarcens" | "after-death";
export type NaturalHistory = "verified" | "fictionalized";
export type Rig = "current" | "still" | "champlain";

export type EffectKind =
  | "warmth"
  | "quiet"
  | "stride"
  | "sight"
  | "courtesy"
  | "focus"
  | "calm"
  | "memory"
  | "light"
  | "listen";

/** Gameplay only. Never a weapon bonus. Hunger is not a kind. */
export type EffectSpec = {
  id: string;
  name: string;
  kind: EffectKind;
  magnitude: number;
  cap: number;
  falloff: number;
  exclusive: boolean;
  distinctive?: string;
  /** The plate may be real while the gift is not. */
  fictional: boolean;
};

export type FieldOp =
  | "cure"
  | "smoke"
  | "snare"
  | "pack"
  | "lash"
  | "study"
  | "listen"
  | "steep"
  | "spoon"
  | "light"
  | "staunch"
  | "seal"
  | "tin-slots"
  | "dress"
  | "mend"
  | "creel-slot"
  | "nibble"
  | "pinch"
  | "biscuit";

export type FieldIntent = {
  op: FieldOp;
  intent: string;
  consumes: boolean;
  label: string;
  note: string;
  effect?: EffectSpec;
};

export type Substitution = {
  /** This provision may stand in for `forId`. Never the reverse unless listed there too. */
  forId: string;
  quality: number;
};

export type BaitUse = {
  rigs: Rig[];
  /** Fish provision ids this bait can take. */
  species: string[];
};

export type StorageBehavior = {
  bin: Bin;
  stackMax: number;
  /** Always false. Routine play is not a rot clock. */
  spoils: false;
  note: string;
};

export type Provision = {
  id: string;
  n: number;
  name: string;
  kind: Kind;
  rarity: Rarity;
  method: Method;
  place: string;
  mapId: string;
  x: number;
  y: number;
  seasons: Season[];
  baseYield: number;
  availability: string;
  look: string;
  tell: string;
  misreadAs: string | null;
  storage: StorageBehavior;
  bait: BaitUse | null;
  field: FieldIntent[];
  substitutions: Substitution[];
  fieldEffect: EffectSpec | null;
  trade: number;
  era: EraBehavior;
  eraNote: string;
  naturalHistory: NaturalHistory;
  reference: string;
  safeRaw: boolean;
  demo: boolean;
  meat: boolean;
  fish: boolean;
};

export type Need = {
  provisionId: string;
  qty: number;
  cured?: boolean;
  allowSubstitution: boolean;
};

export type Dish = {
  id: string;
  n: number;
  name: string;
  needs: Need[];
  effects: EffectSpec[];
  naturalHistory: NaturalHistory;
  reference: string;
  blurb: string;
  /** Shown on the camp stove. The other plates stay in the book. */
  stove: boolean;
};

export type SourceNode = {
  id: string;
  provisionId: string;
  mapId: string;
  place: string;
  x: number;
  y: number;
  seasons: Season[];
  baseYield: number;
  hiddenUntil?: "cacheGlow";
};

export type Water = {
  id: string;
  name: string;
  mapId: string;
  place: string;
  rig: Rig;
  species: string[];
};

export type Stack = {
  provisionId: string;
  qty: number;
  cured?: boolean;
};

export type ActiveEffect = {
  id: string;
  name: string;
  kind: EffectKind;
  magnitude: number;
  stacks: number;
  cap: number;
  exclusive: boolean;
  distinctive?: string;
  fictional: boolean;
};

export type GraveCache = {
  year: number;
  place: string;
  pouch: Stack[];
  creel: Stack[];
};

export type KitFlags = {
  palate: boolean;
  veinEar: boolean;
  cacheGlow: boolean;
  oldOrchard: boolean;
  soloverse: boolean;
  studiedJack: boolean;
  lineDressed: boolean;
  lashedBobber: boolean;
  mended: boolean;
  creelWidened: boolean;
};

export type KitState = {
  version: 1;
  year: number;
  season: Season;
  life: number;
  bins: Record<Bin, Stack[]>;
  tinSlots: number;
  creelSlots: number;
  effects: ActiveEffect[];
  flags: KitFlags;
  graves: GraveCache[];
  taken: Record<string, number>;
  baitId: string | null;
  waterId: string;
  focusPlace: string;
  barter: number;
  lastReading: string[];
  log: string[];
};

export type FailReason =
  | "missing-recipe"
  | "missing-effect"
  | "missing-ingredient"
  | "substitution-cycle"
  | "not-food"
  | "at-cap"
  | "exclusive"
  | "full"
  | "season"
  | "empty"
  | "unavailable"
  | "unsafe-raw"
  | "no-target"
  | "bad-season"
  | "no-tackle"
  | "no-bait"
  | "refused"
  | "bad-save";

export type StepResult = {
  ok: boolean;
  state: KitState;
  reason?: FailReason;
  note: string;
  consumed?: { provisionId: string; qty: number }[];
  produced?: { provisionId: string; qty: number }[];
};
