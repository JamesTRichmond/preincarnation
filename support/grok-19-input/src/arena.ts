import type { FrameInput } from "./types.ts";

/** Screen space: +x right, +y down. North from the input frame decreases y. */
export type ArenaState = {
  x: number;
  y: number;
  slash: number;
  spinning: boolean;
  lantern: boolean;
  pulse: number;
  offer: boolean;
  note: string;
};

export const ARENA_SPEED = 40;

export function initialArena(): ArenaState {
  return {
    x: 50,
    y: 62,
    slash: 0,
    spinning: false,
    lantern: false,
    pulse: 0,
    offer: false,
    note: "",
  };
}

/**
 * Moves a debug marker from input intents. No damage, knockback, or shrine reward.
 */
export function stepArena(
  state: ArenaState,
  frame: Pick<FrameInput, "moveX" | "moveY" | "edges" | "shrine">,
  dtMs: number,
  shrineAt: { x: number; y: number } = { x: 50, y: 28 },
): ArenaState {
  const dt = Math.max(0, dtMs) / 1000;
  const next: ArenaState = {
    ...state,
    x: clamp(state.x + frame.moveX * ARENA_SPEED * dt, 6, 94),
    y: clamp(state.y - frame.moveY * ARENA_SPEED * dt, 8, 92),
    slash: Math.max(0, state.slash - dtMs),
    pulse: Math.max(0, state.pulse - dtMs),
    note: state.note,
  };
  next.offer = Math.hypot(next.x - shrineAt.x, next.y - shrineAt.y) < 16;
  for (const edge of frame.edges) {
    if (edge.type === "bladeTap") {
      next.slash = 180;
      next.note = "Blade tap";
    } else if (edge.type === "bladeSpin" && edge.phase === "start") {
      next.spinning = true;
      next.note = "Blade spin";
    } else if (edge.type === "bladeSpin" && edge.phase === "end") {
      next.spinning = false;
    } else if (edge.type === "offhand" && (edge.phase === "start" || edge.phase === "toggleOn")) {
      next.lantern = true;
      next.note = "Off-hand";
    } else if (edge.type === "offhand" && (edge.phase === "end" || edge.phase === "toggleOff")) {
      next.lantern = false;
    } else if (edge.type === "interact") {
      next.note = next.offer ? "Offer" : "Nothing here";
    } else if (edge.type === "shrineRelease") {
      next.pulse = 900;
      next.note = "Shrine release";
    } else if (edge.type === "pause") {
      next.note = "Pause";
    }
  }
  if (frame.shrine.phase === "charging") next.note = "Holding shrine";
  return next;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
