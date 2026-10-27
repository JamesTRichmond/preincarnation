/** Shared contracts for the world-life module. No life-sim stats. */

export type EraId =
  | "return.1"
  | "return.2"
  | "return.3"
  | "return.4"
  | "return.5"
  | "return.6";

export type HubId = "hub.middlebury" | "hub.intervale" | "hub.otter";

export type Dir = "n" | "e" | "s" | "w";

export type Mode = "work" | "walk" | "hold" | "vacant";

/** How the person at a post remembers Ellis. Authored per seat, not simulated. */
export type MemoryOfEllis =
  | "unmet"
  | "the child at the edge of the work"
  | "the one who left before the freshet"
  | "a name the predecessor kept"
  | "the returned, fourteen years thinner"
  | "only the book remembers";

export interface Cell {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Structure {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "mill" | "shop" | "smith" | "shed" | "house" | "barn" | "hull" | "well" | "tree";
  label: string;
}

export interface Station {
  id: string;
  x: number;
  y: number;
  name: string;
  /** Private posts can defer a polite interruption. Essential talk never waits. */
  public: boolean;
}

export interface ActivityEvent {
  tick: number;
  id: string;
  text: string;
}

export type PoseDriver = "strike" | "press" | "lift" | "loop" | "turn" | "shift";

export interface ActivityDef {
  id: string;
  label: string;
  /** Role the activity belongs to. Recovery idle uses "post". */
  roleId: string;
  driver: PoseDriver;
  tool: string;
  loopTicks: number;
  events: ActivityEvent[];
}

export interface Pose {
  arm: number;
  reach: number;
  prop: number;
  bob: number;
  tool: string;
}

export interface RoutineStep {
  stationId: string;
  activityId: string;
  /** Sim ticks at the post. Capped so a beat is never a long real-time wait. */
  ticks: number;
}

export interface RoutineDef {
  id: string;
  roleId: string;
  steps: RoutineStep[];
}

export interface ActorBinding {
  bindingId: string;
  roleId: string;
  routineId: string;
  homeStationId: string;
}

export interface EraDef {
  id: EraId;
  ordinal: number;
  /** Provisional plate title. Narrative pack renames these. */
  plate: string;
  yearsFromAnchor: number;
  provisional: true;
}

/**
 * One occupied seat for a role in one return.
 * actorId null means the successor was not supplied — vacant post, not a crash.
 */
export interface EraHolder {
  eraId: EraId;
  roleId: string;
  actorId: string | null;
  spokenName: string;
  seatLabel: string;
  memory: MemoryOfEllis;
  provisional: true;
}

export type OverrideMode = "hold" | "relocate" | "suspend";

export interface QuestOverride {
  id: string;
  questId: string;
  stage: string;
  roleId: string;
  priority: number;
  mode: OverrideMode;
  stationId?: string;
  activityId?: string;
  /** Non-essential talk yields. Essential talk still resolves immediately. */
  blocksTalk: boolean;
  /** fixture = not from the narrative quest pack. */
  source: "fixture" | "pack";
}

export interface ActorState {
  actorId: string;
  bindingId: string;
  roleId: string;
  spokenName: string;
  seatLabel: string;
  memory: MemoryOfEllis;
  provisional: true;
  x: number;
  y: number;
  facing: Dir;
  path: Cell[];
  mode: Mode;
  routineId: string;
  stepIndex: number;
  stepTick: number;
  activityId: string;
  activityTick: number;
  goalStationId: string;
  arriveMode: "work" | "hold";
  blockedTicks: number;
  stranded: boolean;
  overrideId: string | null;
  talking: boolean;
  available: boolean;
  availability: string;
}

export interface Rejection {
  bindingId: string;
  roleId: string;
  reason: "missing-successor" | "duplicate-actor" | "missing-routine";
  actorId?: string;
  keptBindingId?: string;
}

export interface Suppression {
  overrideId: string;
  questId: string;
  roleId: string;
  reason: "lower-priority" | "no-occupant";
  winnerId?: string;
}

export interface WorldEvent {
  tick: number;
  actorId: string;
  kind: "activity" | "recovery" | "override" | "vacant" | "talk";
  text: string;
}

export interface EphemeralBlock {
  id: string;
  cells: Cell[];
}

export interface HubDef {
  id: HubId;
  plate: string;
  place: string;
  /** What this plate is not claiming about the plot. */
  unboundNote: string;
  ground: "town" | "farm" | "water";
  w: number;
  h: number;
  structures: Structure[];
  waters: Rect[];
  /** Walkable holes punched after water, e.g. a pier. */
  piers: Rect[];
  /** Extra blocked cells (fence posts, carts authored as permanent). */
  blocked: Cell[];
  stations: Station[];
  fallbackId: string;
  bindings: ActorBinding[];
  routines: RoutineDef[];
  yards: Rect[];
  greens: Rect[];
  fields: Rect[];
  orchards: Rect[];
}

export interface World {
  version: 1;
  hubId: HubId;
  eraId: EraId;
  tick: number;
  w: number;
  h: number;
  walk: boolean[][];
  actors: ActorState[];
  rejected: Rejection[];
  overrides: QuestOverride[];
  suppressed: Suppression[];
  ephemeral: EphemeralBlock[];
  log: WorldEvent[];
  hub: HubDef;
  activities: Record<string, ActivityDef>;
}

export interface SaveBlob {
  version: 1;
  hubId: HubId;
  eraId: EraId;
  tick: number;
  actors: ActorState[];
  rejected: Rejection[];
  overrides: QuestOverride[];
  suppressed: Suppression[];
  ephemeral: EphemeralBlock[];
  log: WorldEvent[];
}

export interface TalkResult {
  ok: boolean;
  /** Always 0 for essential talk. Non-essential private posts report a short remainder. */
  waitTicks: number;
  vacant: boolean;
  line: string;
  reason: string;
}

export interface Catalog {
  hubs: Record<HubId, HubDef>;
  activities: Record<string, ActivityDef>;
  holders: EraHolder[];
  fixtures: QuestOverride[];
}
