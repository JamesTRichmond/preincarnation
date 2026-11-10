/** Shared types for PREINCARNATION traversal challenges. Sim-only; no DOM. */

export const TILE = 16;
export const DT = 1 / 60;
export const PW = 10;
export const PH = 16;
export const REPLAY_VERSION = 1 as const;

export type Tier = "early" | "mixed" | "route" | "mastery";

export type Kit = {
  sugar: boolean;
  boots: boolean;
  fins: boolean;
  cape: boolean;
  rod: boolean;
  voidStep: boolean;
};

export type AccessId = "standard" | "assist";

/** Physics modifiers. Assist is stored apart from ranked medals and never gates the campaign. */
export type AccessProfile = {
  id: AccessId;
  coyote: number;
  jumpBuffer: number;
  /** Multiplier on falling gravity. Assist is slightly gentler. */
  fallScale: number;
  glideGravity: number;
  glideMaxFall: number;
  voidMeterScale: number;
  /** Extra pixels around checkpoint / finish volumes. */
  checkpointPad: number;
};

export type HeldInput = {
  /** -1 is left (A / ←), +1 is right (D / →). */
  x: -1 | 0 | 1;
  /** -1 is up, +1 is down. Swim and drop-through. */
  y: -1 | 0 | 1;
  jump: boolean;
  sugar: boolean;
  glide: boolean;
  rod: boolean;
  voidStep: boolean;
  drop: boolean;
};

export type Cell =
  | "air"
  | "solid"
  | "oneway"
  | "spike"
  | "water"
  | "void"
  | "veil"
  | "anchor"
  | "membrane"
  | "socket"
  | "start"
  | "finish"
  | "check"
  | "stamp"
  | "gate";

export type Current = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

export type RouteStamp = "p" | "q" | "t";

export type PointHint =
  | "jump"
  | "short"
  | "boots"
  | "sugar"
  | "glide"
  | "swim"
  | "void"
  | "rod"
  | "drop"
  | "wait";

export type PilotPoint = { tx: number; ty: number; hint?: PointHint };

export type PilotRoute = {
  id: string;
  label: string;
  /** Tile targets, in order. The pilot drives real physics toward these. */
  points: PilotPoint[];
};

export type Course = {
  id: string;
  title: string;
  tier: Tier;
  /** One sentence: the movement problem this course is for. Unique across the catalog. */
  problem: string;
  blurb: string;
  /** Flavor line granted on a clear. Cosmetic; not a campaign flag. */
  fieldNote: string;
  kit: Kit;
  revision: number;
  featured: boolean;
  width: number;
  height: number;
  cells: Cell[];
  current: Array<Current | null>;
  /** Required checkpoint ids, in the only legal order. */
  checks: string[];
  checkAt: Array<string | null>;
  stampAt: Array<RouteStamp | null>;
  routes: PilotRoute[];
};

export type Body = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
};

export type RodBlock = { tx: number; ty: number; life: number };

export type DeathReason = "spike" | "void" | "veil" | "drown" | "pit";

export type InvalidReason =
  | "teleport"
  | "checkpoint-order"
  | "unfinished"
  | "qa-unranked"
  | "position-mismatch"
  | "revision"
  | "course"
  | "access"
  | "forged-finish";

export function emptyInput(): HeldInput {
  return {
    x: 0,
    y: 0,
    jump: false,
    sugar: false,
    glide: false,
    rod: false,
    voidStep: false,
    drop: false,
  };
}

export function kitNone(): Kit {
  return {
    sugar: false,
    boots: false,
    fins: false,
    cape: false,
    rod: false,
    voidStep: false,
  };
}

export const STANDARD_ACCESS: AccessProfile = {
  id: "standard",
  coyote: 0.1,
  jumpBuffer: 0.12,
  fallScale: 1,
  glideGravity: 280,
  glideMaxFall: 40,
  voidMeterScale: 1,
  checkpointPad: 0,
};

export const ASSIST_ACCESS: AccessProfile = {
  id: "assist",
  coyote: 0.16,
  jumpBuffer: 0.18,
  fallScale: 0.82,
  glideGravity: 200,
  glideMaxFall: 32,
  voidMeterScale: 1.65,
  checkpointPad: 6,
};

export function accessById(id: AccessId): AccessProfile {
  return id === "assist" ? ASSIST_ACCESS : STANDARD_ACCESS;
}
