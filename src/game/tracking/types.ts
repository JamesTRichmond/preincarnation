/** Shared types for the Otter Creek tracking pocket. Not a county runtime map. */

export type HabitatKind = "woods" | "orchard" | "marsh" | "field" | "water";

export type Stance = "still" | "creep" | "walk" | "rush";

export type SignKind =
  | "track"
  | "bed"
  | "browse"
  | "scat"
  | "scratch"
  | "feather"
  | "slide"
  | "spraint"
  | "mound"
  | "form"
  | "droppings"
  | "drag";

export type AnimalState =
  | "on-route"
  | "wary"
  | "alert"
  | "flight"
  | "loafing"
  | "returning"
  | "absent";

export type Sense = "scent" | "sound" | "sight" | "shot";

export type EcologyLabel = "verified" | "simplified" | "fictionalized-gameplay";

export type Point = { x: number; y: number };

export type Circle = Point & { r: number };

export type OutcomeKind = "observe" | "sketch" | "capture" | "hunt";

export type Profile = {
  id: string;
  common: string;
  latin: string;
  habitats: HabitatKind[];
  /** 0–1, how much that channel matters. Not a weather model. */
  scent: number;
  hearing: number;
  sight: number;
  scentRadius: number;
  hearRadius: number;
  seeRadius: number;
  /** Gameplay flag only — not a Vermont regulation. */
  quarry: boolean;
  capture: "none" | "box-trap";
  seasonNote: string;
  ecologyLabel: EcologyLabel;
  ecology: string;
  sources: { name: string; url?: string }[];
  /** What the authored circuit is doing, in order. */
  activities: string[];
  watchTitle: string;
  watchDetail: string;
  sketchTitle: string;
  captureTitle?: string;
  captureDetail?: string;
  huntTitle?: string;
  huntDetail?: string;
};

export type Waypoint = Point & { atMinute: number; activity: string };

export type Sign = {
  id: string;
  x: number;
  y: number;
  /** Absolute minute the mark is laid on day 0. May be before the animal emerges. */
  atMinute: number;
  kind: SignKind;
  /** Travel direction, degrees, 0 = north. A property of the mark, not a path. */
  bearing: number;
  identifies: boolean;
  hint: string;
};

export type Encounter = {
  id: string;
  title: string;
  habitat: HabitatKind;
  profileId: string;
  blurb: string;
  wind: { fromDeg: number; strength: number };
  visibility: number;
  /** 0–1. Local mask (creek, rustling reeds). Not regional weather. */
  soundFloor: number;
  pocket: Circle;
  route: Waypoint[];
  escape: Point[];
  signs: Sign[];
  resettleMinutes: number;
  flightSeconds: number;
  returnSeconds: number;
  observeRange: number;
  huntRange: number;
  closeRange: number;
};

export type Awarded = {
  observe: boolean;
  sketch: boolean;
  capture: boolean;
  hunt: boolean;
};

export type AnimalRuntime = {
  state: AnimalState;
  alert: number;
  flightT: number;
  returnT: number;
  routeOrigin: number;
  spookedAt: number | null;
  identified: boolean;
  signsRead: string[];
  madeAt: Record<string, number>;
  trap: Point | null;
  windowHold: number;
  glassHold: number;
  awarded: Awarded;
  discovered: boolean;
};

export type LogEntry = {
  minute: number;
  text: string;
  sense: Sense | "read" | "wind" | "book";
  encounterId?: string;
};

export type Session = {
  version: 1;
  day: number;
  minute: number;
  player: Point & { stance: Stance };
  animals: Record<string, AnimalRuntime>;
  /** Encounter id → game minute the thread was last read. */
  windReadAt: Record<string, number>;
  log: LogEntry[];
  points: number;
  shots: number;
  notes: string[];
};

export type Threat = {
  scent: number;
  sound: number;
  sight: number;
  total: number;
  primary: Sense | null;
  text: string;
};

export type ChoiceId = "observe" | "sketch" | "capture" | "hunt" | "trap";

export type TickEvent = {
  type: "feedback" | "resolve" | "identify";
  text: string;
  sense?: Sense | "read" | "wind" | "book";
  encounterId?: string;
  points?: number;
  /** What you wrote down. A property of the mark, never a coordinate. */
  page?: FieldPage;
};

export type FieldPage = {
  kind: string;
  who: string;
  age: string;
  bearing: number;
  hint: string;
};

export const POINTS = {
  observe: 12,
  sketch: 8,
  capture: 10,
  hunt: 4,
  stain: -6,
} as const;

/** Development art. The canvas is flat color and canopy masses, not a finished illustration pass. */
export const ART = {
  status: "development" as const,
  note: "Ground, canopy, and animal silhouettes are development art. They are not finished sprites, tiles, or a painted map.",
};
