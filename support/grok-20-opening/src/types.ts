/** Opening-hour types. Plain data only — save snapshots must stay JSON-safe. */

export const SAVE_VERSION = 1 as const;

export type Era = "arrival" | "altered";
export type Dir = "n" | "s" | "e" | "w";
export type MapId =
  | "road"
  | "lane"
  | "house"
  | "inn"
  | "yard"
  | "vein"
  | "river"
  | "shore";

export type ItemId = "blade" | "parcel" | "hammer" | "salve";

export const FLAGS = [
  "rootCut",
  "delivered",
  "twineCut",
  "waxOpen",
  "patternRead",
  "threatened",
  "explicitSave",
  "sawImpression",
  "stoodImpression",
  "scrapRead",
  "released",
  "healedByRest",
  "rested",
  "salveUsed",
  "drank",
  "bandaged",
  "heardClaim",
  "heardAlteredYear",
  "readMilepost",
  "readMilepostAltered",
  "readRuts",
  "readRutsAltered",
  "lookedHands",
  "lookedCoat",
  "sawWindowAltered",
  "sawTableAltered",
  "readLedger",
  "readStranger",
  "readOldNotch",
  "observedCoat",
  "observedScar",
  "observedRoot",
  "observedOpenVein",
  "observedWrist",
  "leftEdge",
  "showedPattern",
  "shirtTorn",
  "everBled",
  "hammerTaken",
  "cutSomething",
  "drewBlade",
  "usedHammer",
  "usedCloth",
  "feltVein",
  "feltYard",
  "fitAltered",
  "readProphecy",
  "nicheSeen",
  "slabSafe",
] as const;

export type Flag = (typeof FLAGS)[number];
export type Flags = Record<Flag, boolean>;

export type HammerSite = "none" | "yard" | "vein";

export interface Seam {
  veinOpen: boolean;
  veinScar: boolean;
  yardOpen: boolean;
  yardScar: boolean;
  veinDent: boolean;
  yardDent: boolean;
}

export interface Talk {
  id: string;
  /** Index of the line currently on the air. */
  index: number;
}

/** Gameplay fields only. Notches are stored beside this, never inside it. */
export interface Persist {
  version: typeof SAVE_VERSION;
  map: MapId;
  x: number;
  y: number;
  facing: Dir;
  era: Era;
  vitality: number;
  bleed: boolean;
  dust: boolean;
  clothes: "travel" | "impression";
  scarWrist: boolean;
  inventory: ItemId[];
  equipped: ItemId | null;
  flags: Flags;
  talk: Talk | null;
  talkProgress: Record<string, number>;
  steps: number;
  dirsUsed: Dir[];
  verbLog: string[];
  hints: string[];
  seen: string[];
  clearedBriar: string[];
  seam: Seam;
  dead: boolean;
  deaths: number;
  lastCause: string | null;
  lastPlace: MapId | null;
  tick: number;
  idle: number;
  hammerSite: HammerSite;
  visited: MapId[];
}

export type NotchReason = "ledger" | "stone" | "rest" | "hide" | "release";

export interface Notch {
  version: typeof SAVE_VERSION;
  reason: NotchReason;
  place: string;
  map: MapId;
  x: number;
  y: number;
  tick: number;
  snapshot: Persist;
}

export interface State extends Persist {
  explicitNotch: Notch | null;
  sessionNotch: Notch | null;
  /** Frozen pre-release notch. Death does not reload it. */
  agedNotch: Notch | null;
  /** One line after a long break. Not a recap of the errand. */
  continuity: string | null;
}

export interface Verb {
  id: string;
  label: string;
  group: "place" | "hand";
}

export interface Speech {
  convo: string;
  index: number;
  speaker: string;
  text: string;
}

export type Command =
  | { type: "move"; dir: Dir }
  | { type: "verb"; id: string }
  | { type: "advance" }
  | { type: "leave-talk" }
  | { type: "wait"; seconds: number }
  | { type: "resume-break" }
  | { type: "ack-continuity" }
  | { type: "hide" };

export interface Result {
  state: State;
  captions: string[];
  speech: Speech | null;
  events: string[];
  verbs: Verb[];
}

export interface Line {
  speaker: string;
  text: string;
  mark?: "claim" | "altered-year";
}

export interface Convo {
  id: string;
  lines: Line[];
}

export const LESSON_IDS = [
  "movement",
  "context",
  "blade",
  "tool",
  "heal",
  "rest",
  "save",
  "hammer",
  "death",
  "permanence",
  "recognition",
] as const;

export type LessonId = (typeof LESSON_IDS)[number];
export type LessonStatus = "unmet" | "practiced" | "understood";

export interface LessonReport {
  id: LessonId;
  status: LessonStatus;
  /** Where the hammer rule was actually struck open, if anywhere. */
  hammerSite?: HammerSite;
  dungeonWitnessed?: boolean;
}
