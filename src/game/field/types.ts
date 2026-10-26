export const ERAS = [
  "mudlight",
  "green-crown",
  "amber-gate",
  "vein-night",
  "locked-snow",
] as const;
export type EraId = (typeof ERAS)[number];

export const BEATS = ["dawn", "morning", "noon", "dusk", "true-dark"] as const;
export type BeatId = (typeof BEATS)[number];

export const WEATHERS = ["clear", "after-rain", "mist"] as const;
export type WeatherId = (typeof WEATHERS)[number];

export const PACES = ["creep", "ordinary", "hurry"] as const;
export type Pace = (typeof PACES)[number];

export const LIGHTS = ["off", "warm", "dim", "pulse"] as const;
export type LightMode = (typeof LIGHTS)[number];

export const SOUNDS = ["quiet", "clap", "whistle", "drum", "match-tick"] as const;
export type SoundMode = (typeof SOUNDS)[number];

export const PREPS = [
  "turn-log",
  "turn-stone",
  "palm-water",
  "sugar-cloth",
  "sap-smear",
  "infirmary-scrap",
] as const;
export type PrepId = (typeof PREPS)[number];

export const TOOLS = ["net", "hands", "cup", "eyes"] as const;
export type ToolId = (typeof TOOLS)[number];

export const TIMINGS = ["on-tell", "early", "from-side", "hold"] as const;
export type Timing = (typeof TIMINGS)[number];

export const HABITATS = [
  "lantern-meadow",
  "dead-creek",
  "snake-mountain",
  "champlain-shore",
  "infirmary-lane",
  "lincoln-gap",
] as const;
export type HabitatId = (typeof HABITATS)[number];

export const STATIONS = [
  "milkweed",
  "goldenrod",
  "creek",
  "wall",
  "log",
  "turtlehead",
  "spring",
  "lantern",
] as const;
export type StationId = (typeof STATIONS)[number];

export type Tier = "ordinary" | "unusual" | "vein";
export type NameRank = "species" | "genus" | "family";
export type RewardChannel = "notebook" | "cooking" | "infirmary" | "character" | "specimen";

export interface RewardDef {
  id: string;
  label: string;
  channel: RewardChannel;
  on: "release" | "keep";
  once: boolean;
}

export interface SketchMark {
  id: string;
  label: string;
  correct: boolean;
}

export type EncounterAction =
  | { type: "pace"; pace: Pace }
  | { type: "light"; light: LightMode }
  | { type: "sound"; sound: SoundMode }
  | { type: "prep"; prep: PrepId }
  | { type: "tool"; tool: ToolId; timing: Timing }
  | { type: "still" }
  | { type: "marks"; markIds: string[] };

export interface StepChoice {
  id: string;
  label: string;
  action: EncounterAction;
  outcome: "succeed" | "miss";
  missText?: string;
}

export type EncounterStep =
  | { kind: "choice"; id: string; instruction: string; choices: StepChoice[] }
  | { kind: "sketch"; id: string; instruction: string; wrongText: string };

export interface ConditionClause {
  eras?: EraId[];
  beats?: BeatId[];
  weathers?: WeatherId[];
  stations?: StationId[];
  lights?: LightMode[];
  sounds?: SoundMode[];
  preps?: PrepId[];
}

export interface CreatureLink {
  channel: "cooking" | "infirmary" | "character";
  who?: string;
  text: string;
}

export interface Creature {
  id: string;
  commonName: string;
  scientificName: string;
  nameRank: NameRank;
  tier: Tier;
  fictional: boolean;
  naturalHistory: string;
  habitatId: HabitatId;
  station: StationId | null;
  siteLabel: string;
  behavior: string;
  discoveryClue: string;
  hints: [string, string, string];
  presence: { anyOf: ConditionClause[] };
  approachSummary: string;
  steps: EncounterStep[];
  sketchMarks: SketchMark[];
  notebookEntry: string;
  releaseLabel: string;
  keepLabel: string;
  canKeep: boolean;
  keepRefusal?: string;
  releaseText: string;
  keepText: string;
  rewards: RewardDef[];
  links: CreatureLink[];
  signature: string;
  plate?: string;
}

export interface WorldState {
  habitatId: HabitatId;
  era: EraId;
  beat: BeatId;
  weather: WeatherId;
  station: StationId | null;
  pace: Pace;
  light: LightMode;
  sound: SoundMode;
  preps: PrepId[];
}

export interface CreatureRecord {
  timesSeen: number;
  timesMissed: number;
  timesReleased: number;
  timesKept: number;
  hintTier: 0 | 1 | 2 | 3;
  rewardsGranted: string[];
  confirmedMarks: string[];
  lastNote: string;
  fledEpoch: number | null;
  fledBeat: BeatId | null;
}

export interface ActiveEncounter {
  creatureId: string;
  stepIndex: number;
  sketchStrikes: number;
  log: string[];
}

export interface JournalLine {
  id: string;
  creatureId: string;
  text: string;
  channel: RewardChannel | "field";
}

export interface OutingSave {
  version: number;
  epoch: number;
  world: WorldState;
  visited: StationId[];
  records: Record<string, CreatureRecord>;
  journal: JournalLine[];
  active: ActiveEncounter | null;
}

export type Presence =
  | { status: "present" }
  | { status: "fled"; reason: string }
  | { status: "unavailable-habitat"; habitatId: HabitatId; reason: string }
  | { status: "absent"; reason: string };

export type ActionKind =
  | "advance"
  | "sketch-retry"
  | "ready"
  | "miss"
  | "ignored"
  | "blocked"
  | "done";

export interface ActionResult {
  save: OutingSave;
  kind: ActionKind;
  message: string;
  /** Reward labels granted by this call, if any. */
  granted?: string[];
}
