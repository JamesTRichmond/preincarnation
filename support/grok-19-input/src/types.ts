/** Action ids the rest of PREINCARNATION may read. No combat numbers live here. */
export const ACTIONS = [
  "moveNorth",
  "moveSouth",
  "moveEast",
  "moveWest",
  "blade",
  "offhand",
  "interact",
  "pause",
  "shrineRelease",
] as const;

export type ActionId = (typeof ACTIONS)[number];

export const TOUCH_CONTROLS = [
  "stick",
  "blade",
  "offhand",
  "interact",
  "pause",
  "shrine",
] as const;

export type TouchControlId = (typeof TOUCH_CONTROLS)[number];

export type KeyBinding = { kind: "key"; code: string };
export type PadButtonBinding = { kind: "padButton"; button: number };
export type PadAxisBinding = { kind: "padAxis"; axis: number; sign: -1 | 1 };
export type PadChordBinding = { kind: "padChord"; buttons: number[] };
export type TouchBinding = { kind: "touch"; control: TouchControlId };

export type Binding =
  | KeyBinding
  | PadButtonBinding
  | PadAxisBinding
  | PadChordBinding
  | TouchBinding;

export type BindingTable = Record<ActionId, Binding[]>;

export type OffhandMode = "hold" | "toggle";
export type MovementPlane = "cardinal" | "eight";
export type ConflictPolicy = "swap" | "reject";

export type PromptDevice =
  | "keyboard"
  | "touch"
  | "xbox"
  | "playstation"
  | "genericPad";

export type Intent =
  | { type: "bladeTap" }
  | { type: "bladeSpin"; phase: "start" | "end" }
  | { type: "offhand"; phase: "start" | "end" | "toggleOn" | "toggleOff" }
  | { type: "interact" }
  | { type: "pause" }
  | { type: "shrineRelease" }
  | { type: "deviceLost"; index: number }
  | { type: "bindingsReset" }
  | { type: "openSettings" };

export type DiscreteIntent = "bladeTap" | "interact" | "pause" | "shrineRelease";

export type RebindResult =
  | { ok: true; swappedWith?: ActionId }
  | {
      ok: false;
      reason: "reserved" | "pause-required" | "invalid" | "conflict";
      conflictWith?: ActionId;
    };

export type SafeInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type Viewport = {
  width: number;
  height: number;
  safe: SafeInsets;
};

export type TouchSettings = {
  handedness: "right" | "left";
  scale: number;
  opacity: number;
  /** Null uses the handedness defaults. Centers are 0..1 inside the safe rect. */
  positions: Record<TouchControlId, { x: number; y: number }> | null;
};

export type PlacedControl = {
  id: TouchControlId;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PadButtonSnap = { pressed: boolean; value: number };

export type PadSnap = {
  index: number;
  id: string;
  mapping: string;
  connected: boolean;
  buttons: PadButtonSnap[];
  axes: number[];
};

export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type GesturePhase = "idle" | "pending" | "spinning";

export type ShrinePhase = "idle" | "charging" | "cancelled" | "completed";

export type FrameInput = {
  /** +1 is east (screen right). Opposite directions cancel to 0. */
  moveX: -1 | 0 | 1;
  /** +1 is north (screen up). */
  moveY: -1 | 0 | 1;
  held: Record<ActionId, boolean>;
  edges: Intent[];
  bladePhase: GesturePhase;
  shrine: { phase: ShrinePhase; progress: number };
  offhandLatched: boolean;
  offhandMode: OffhandMode;
  activeDevice: PromptDevice;
  menuOpen: boolean;
  gameplaySuppressed: boolean;
  gamepad: {
    support: "api-present" | "api-missing";
    connection: "none" | "connected" | "lost";
    mapping: string | null;
    nonstandard: boolean;
    index: number | null;
    id: string | null;
  };
  capture: { action: ActionId; slot: number; chord: boolean } | null;
  pendingBinding: Binding | null;
  pendingConflict: ActionId | null;
  warnings: string[];
  prompts: Record<ActionId, string>;
};
