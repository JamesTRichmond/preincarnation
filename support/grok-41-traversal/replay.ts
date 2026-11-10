import type { AccessId, HeldInput, InvalidReason } from "./types.ts";
import type { Sim } from "./physics.ts";
import { REPLAY_VERSION } from "./types.ts";

/**
 * Replay format v1.
 *
 * A replay is a local recording of one attempt: the held input each live
 * frame, plus the position the simulator produced. It is not a network
 * opponent. Ghosts are drawn from `frames` (or from a resim of `input`)
 * and never enter the collision world.
 *
 * Time is `liveFrames * dt`. Countdown, pause, focus-loss, and device-switch
 * gaps are not frames. Death respawns are frames with the respawn flag;
 * they do not by themselves finish a run.
 */
export type ReplayFrame = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  input: HeldInput;
  /** bit0 grounded, bit1 sugar, bit2 water, bit3 veil, bit4 respawn */
  flags: number;
};

export type Replay = {
  version: typeof REPLAY_VERSION;
  courseId: string;
  revision: number;
  access: AccessId;
  dt: number;
  frames: ReplayFrame[];
  liveFrames: number;
  deaths: number;
  checks: string[];
  stamps: string[];
  finished: boolean;
  invalid: InvalidReason | null;
};

export function captureFrame(sim: Sim, input: HeldInput, respawned: boolean): ReplayFrame {
  let flags = 0;
  if (sim.grounded) flags |= 1;
  if (sim.sugar) flags |= 2;
  if (sim.inWater) flags |= 4;
  if (sim.veilActive) flags |= 8;
  if (respawned) flags |= 16;
  return {
    x: sim.body.x,
    y: sim.body.y,
    vx: sim.body.vx,
    vy: sim.body.vy,
    input: { ...input },
    flags,
  };
}

/** Visual sample only. Does not accept a simulation or a world. */
export function sampleGhost(replay: Replay, frameIndex: number): { x: number; y: number } | null {
  if (replay.frames.length === 0) return null;
  const i = Math.max(0, Math.min(replay.frames.length - 1, frameIndex));
  const f = replay.frames[i];
  if (!f) return null;
  return { x: f.x, y: f.y };
}

export function packInput(input: HeldInput): number {
  const x = input.x + 1;
  const y = input.y + 1;
  let n = x | (y << 2);
  if (input.jump) n |= 1 << 4;
  if (input.sugar) n |= 1 << 5;
  if (input.glide) n |= 1 << 6;
  if (input.rod) n |= 1 << 7;
  if (input.voidStep) n |= 1 << 8;
  if (input.drop) n |= 1 << 9;
  return n;
}
