/**
 * Contract for the 96px character pack in support/grok-13-character-animation.
 * The world still draws the 16px sheets in public/game. This file does not
 * move blade damage off the instant it lands in fireSlash.
 */

export const PACK_CELL_PX = 96;
export const SNES_CELL_PX = 16;

/** Engine Dir 0..3. Pack sheets use the same row order when they have four rows. */
export const DIRECTION_ROWS = ["down", "left", "right", "up"] as const;

export const PACK_FORM_ID = {
  wanderer: "mortal-wanderer",
  smuggler: "otter-creek-smuggler",
  officer: "rutland-officer",
  embryo: "embryonic-god",
} as const;

export const REQUIRED_ACTIONS = [
  "idle",
  "walk",
  "attack",
  "charge",
  "hurt",
  "interact",
  "death",
  "reincarnate",
  "tool",
  "spin",
] as const;

/**
 * How long engine.ts holds attackT. These are poses and a movement slow,
 * not the moment damage is applied.
 */
export const RUNTIME_ATTACK_LOCK_SEC = {
  slash: 0.1,
  spin: 0.18,
  bow: 0.16,
  hook: 0.2,
  hammer: 0.2,
  digEmpty: 0.2,
  dig: 0.25,
  net: 0.16,
} as const;

export const RUNTIME_BLADE_DAMAGE = {
  when: "immediate",
  where: "fireSlash, before startCombo assigns attackT",
} as const;

export function proposedHitSec(fps: number, hitFrame: number): number {
  if (!(fps > 0)) throw new Error("fps must be positive");
  if (hitFrame < 0) throw new Error("hit frame must be >= 0");
  return hitFrame / fps;
}

/** The strike drawing starts before the visual lock ends. Damage is still at t=0. */
export function strikePoseStartsDuringLock(fps: number, hitFrame: number, lockSec: number): boolean {
  return proposedHitSec(fps, hitFrame) < lockSec;
}

export type TimingFlag = {
  form: string;
  action: "attack" | "spin";
  proposedHitSec: number;
  lockSec: number;
  poseStartsDuringLock: boolean;
  note: string;
};

export function attackTimingFlag(form: string, fps: number, hitFrame: number): TimingFlag {
  const lockSec = RUNTIME_ATTACK_LOCK_SEC.slash;
  const hit = proposedHitSec(fps, hitFrame);
  const during = hit < lockSec;
  const note = during
    ? `Hit frame ${hitFrame} starts at ${hit.toFixed(3)}s, inside the ${lockSec}s slash lock. Blade damage already happened at t=0. Do not retime the slash onto this frame.`
    : `Hit frame ${hitFrame} starts at ${hit.toFixed(3)}s, at or after the ${lockSec}s slash lock. A basic slash never shows it. Damage stays at t=0.`;
  return {
    form,
    action: "attack",
    proposedHitSec: hit,
    lockSec,
    poseStartsDuringLock: during,
    note,
  };
}

export function spinTimingFlag(form: string, fps: number, frameCount: number): TimingFlag {
  const lockSec = RUNTIME_ATTACK_LOCK_SEC.spin;
  const length = frameCount / fps;
  const during = 0 < lockSec;
  const note = `Spin sheet is ${length.toFixed(3)}s. fireSpin damages once at t=0 and holds attackT for ${lockSec}s. The sheet's later hit frames are not extra hits.`;
  return {
    form,
    action: "spin",
    proposedHitSec: 0,
    lockSec,
    poseStartsDuringLock: during,
    note,
  };
}
