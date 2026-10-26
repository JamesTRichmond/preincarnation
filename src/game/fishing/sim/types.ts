export type Opening = "burst" | "weight" | "shake" | "dive";
export type FightStateName = "surge" | "steady" | "shake" | "jump" | "cover" | "sulk" | "tired";
export type Glyph = "tick" | "dip" | "walk" | "surge" | "still";
export type Motion = "dead" | "drift" | "retrieve" | "either";
export type HourPeriod = "dawn" | "day" | "dusk" | "night";
export type PlaceKind = "real-water" | "authored-spot-on-real-water" | "fictional-composite";
export type Phase =
  | "title"
  | "waters"
  | "read"
  | "aiming"
  | "charging"
  | "flight"
  | "present"
  | "bite"
  | "fight"
  | "landed"
  | "resolved";

export interface BiteBeat {
  glyph: Glyph;
  ms: number;
  commit?: boolean;
}

export interface FishProfile {
  id: string;
  commonName: string;
  latin: string;
  presence: "verified-basin";
  presenceNote: string;
  behavior: "fictionalized";
  behaviorNote: string;
  habitat: string[];
  light: HourPeriod[];
  motion: Motion;
  scent: number;
  flash: number;
  shy: number;
  earlySpook: boolean;
  opening: Opening;
  pull: number;
  burst: number;
  stamina: number;
  headshake: number;
  cover: number;
  jump: number;
  sulk: number;
  spitSlack: number;
  bite: BiteBeat[];
  learn: [string, string, string, string];
  meal: string;
  portions: number;
  lengthCm: [number, number];
  color: string;
  regard: string;
}

export interface Gear {
  id: string;
  name: string;
  summary: string;
  castRange: number;
  stealth: number;
  flash: number;
  scent: number;
  motion: Motion;
  ceiling: number;
  landSpeed: number;
  accuracy: number;
}

export interface Spot {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  sweet: boolean;
  barren?: boolean;
  tags: string[];
  tell: string;
  read: string;
  coverSide: -1 | 0 | 1;
}

export interface WaterConditions {
  current: "still" | "slow" | "pocket" | "fast";
  clarity: "gin" | "stained" | "murk";
  cover: "open" | "wood" | "weed" | "rock" | "shade" | "mud";
  depth: "skinny" | "wade" | "deep";
  wind: "calm" | "breeze" | "chop";
}

export interface Location {
  id: string;
  name: string;
  water: string;
  town: string;
  group: "river" | "marsh" | "lake" | "still";
  placeKind: PlaceKind;
  placeNote: string;
  blurb: string;
  challenge: string;
  hour: number;
  outfit: string;
  conditions: WaterConditions;
  speciesIds: string[];
  spots: Spot[];
}

export interface CastState {
  phase: "idle" | "charging" | "flight" | "settled" | "cancelled";
  power: number;
  flight: number;
  reason: "player" | "focus" | "short" | null;
  landX: number;
  landY: number;
  short: boolean;
}

export interface BiteRuntime {
  speciesId: string;
  beats: BiteBeat[];
  index: number;
  intoMs: number;
  outcome: "pending" | "hooked" | "miss" | "early";
  earlySpook: boolean;
}

export interface FightBeat {
  state: FightStateName;
  dur: number;
}

export type FightOutcome = "fighting" | "landed" | "snap" | "spit" | "cover";

export interface FightRuntime {
  speciesId: string;
  catchId: string;
  script: FightBeat[];
  index: number;
  stateTime: number;
  elapsed: number;
  lineOut: number;
  tension: number;
  overSeconds: number;
  spit: number;
  coverDanger: number;
  jumps: number;
  peakTension: number;
  rod: number;
  outcome: FightOutcome;
  coverSide: -1 | 0 | 1;
}

export interface CatchInstance {
  id: string;
  speciesId: string;
  locationId: string;
  spotId: string;
  gearId: string;
  lengthCm: number;
  meal: string;
  portions: number;
  status: "pending" | "kept" | "released" | "lost";
}

export interface JournalEntry {
  speciesId: string;
  times: number;
  kept: number;
  released: number;
  lost: number;
  stage: number;
  locationIds: string[];
  gearIds: string[];
  bestLengthCm: number;
}

export type FishingReward =
  | { kind: "food"; catchId: string; speciesId: string; meal: string; portions: number }
  | { kind: "regard"; catchId: string; speciesId: string; tag: "gentle-hands"; line: string }
  | { kind: "journal"; catchId: string; speciesId: string; stage: number };

export interface FishingSave {
  journal: Record<string, JournalEntry>;
  creel: CatchInstance[];
  resolvedIds: string[];
  rewardQueue: FishingReward[];
  drainedIds: string[];
  reads: string[];
  stats: { kept: number; released: number; lost: number };
}

export interface PresentState {
  interest: number;
  speciesId: string | null;
  elapsed: number;
  hint: string;
  missedSpot: boolean;
}

export interface Session {
  version: 1;
  seed: number;
  rng: number;
  phase: Phase;
  paused: boolean;
  pauseReason: "focus" | null;
  hour: number;
  locationId: string;
  spotId: string | null;
  gearId: string;
  wideTiming: boolean;
  reducedMotion: boolean;
  aimX: number;
  aimY: number;
  anglerX: number;
  giveLatched: boolean;
  cast: CastState;
  present: PresentState;
  bite: BiteRuntime | null;
  fight: FightRuntime | null;
  pending: CatchInstance | null;
  line: string;
  save: FishingSave;
  acc: number;
  seq: number;
  castsLanded: number;
  dirty: boolean;
  /** After a cancelled cast, ignore a still-held button until it is released. */
  suppressCast: boolean;
}

export interface Actions {
  ax: number;
  ay: number;
  castHeld: boolean;
  hookHeld: boolean;
  pressureHeld: boolean;
  giveToggle: boolean;
  cancel: boolean;
  confirm: boolean;
}

export interface TensionInput {
  tension: number;
  fishForce: number;
  pressure: number;
  giveLine: boolean;
  ceiling: number;
  dt: number;
  overSeconds: number;
  grace: number;
}

export type TensionFlag =
  | "nan-reset"
  | "clamped-high"
  | "clamped-low"
  | "slack-priority"
  | "force-clamped"
  | "dt-clamped"
  | "bad-ceiling"
  | "pressure-clamped";

export interface TensionResult {
  tension: number;
  appliedPressure: number;
  fishForce: number;
  snapped: boolean;
  overSeconds: number;
  flags: TensionFlag[];
}
