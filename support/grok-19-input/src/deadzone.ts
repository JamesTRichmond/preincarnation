/** Radial deadzone with re-normalization so a full tilt still reaches magnitude 1. */
export function radialDeadzone(
  x: number,
  y: number,
  deadzone: number,
): { x: number; y: number } {
  const mag = Math.hypot(x, y);
  if (!Number.isFinite(mag) || mag < deadzone || mag === 0) return { x: 0, y: 0 };
  const span = Math.max(1e-6, 1 - deadzone);
  const scale = Math.min(1, (mag - deadzone) / span) / mag;
  return { x: x * scale, y: y * scale };
}

export type Digital = { x: -1 | 0 | 1; y: -1 | 0 | 1 };

/**
 * Digitalize a stick. `y` is the raw axis (negative = physical up = north).
 * Cardinal mode keeps only the dominant axis so a four-direction game
 * does not drift into diagonals from a tilted stick.
 */
export function digitalStick(
  rawX: number,
  rawY: number,
  deadzone: number,
  plane: "cardinal" | "eight",
): Digital {
  const mag = Math.hypot(rawX, rawY);
  if (!Number.isFinite(mag) || mag < deadzone) return { x: 0, y: 0 };
  const sx = rawX === 0 ? 0 : rawX > 0 ? 1 : -1;
  const sy = rawY === 0 ? 0 : rawY > 0 ? 1 : -1;
  if (plane === "eight") {
    return {
      x: Math.abs(rawX) >= deadzone ? (sx as -1 | 1) : 0,
      y: Math.abs(rawY) >= deadzone ? (sy as -1 | 1) : 0,
    };
  }
  if (Math.abs(rawX) >= Math.abs(rawY)) return { x: sx as -1 | 1, y: 0 };
  return { x: 0, y: sy as -1 | 1 };
}

/** Combine per-source votes. Any disagreement on a sign cancels that axis. */
export function mergeAxis(votes: Array<-1 | 0 | 1>): -1 | 0 | 1 {
  let pos = false;
  let neg = false;
  for (const vote of votes) {
    if (vote > 0) pos = true;
    if (vote < 0) neg = true;
  }
  if (pos && neg) return 0;
  if (pos) return 1;
  if (neg) return -1;
  return 0;
}
