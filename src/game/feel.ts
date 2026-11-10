import type { Dir } from "./types";

/** Axis kept while an analog stick sits inside the diagonal band. */
export type AxisMem = "x" | "y" | null;

/** A press during hitstop is kept this long once time starts again. */
export const ATTACK_BUFFER_S = 0.12;

/** Freeze never lasts longer than this, reduced motion included. */
export const HITSTOP_CAP_S = 0.12;

/**
 * Analog facing. Both axes still move the body — this only picks the
 * sprite direction. Inside the diagonal band the previous axis stays,
 * so a noisy stick does not flip the camera lookahead every frame.
 * An equal split with no memory keeps the vertical facing the keyboard
 * already used.
 */
export function resolveFacing(
  mx: number,
  my: number,
  prev: Dir,
  mem: AxisMem,
  dominance = 1.25,
): { dir: Dir; mem: AxisMem } {
  const ax = Math.abs(mx);
  const ay = Math.abs(my);
  if (ax === 0 && ay === 0) return { dir: prev, mem: null };

  let axis: "x" | "y";
  if (ax === 0) axis = "y";
  else if (ay === 0) axis = "x";
  else {
    const ratio = Math.max(ax, ay) / Math.min(ax, ay);
    if (ratio >= dominance) axis = ax >= ay ? "x" : "y";
    else if (mem) axis = mem;
    else axis = ax > ay ? "x" : "y";
  }

  const dir: Dir = axis === "x" ? (mx < 0 ? 1 : 2) : my < 0 ? 3 : 0;
  return { dir, mem: axis };
}

/**
 * Step, then if the forward cell is only a lip (≤ `lip` px of overlap on
 * the free axis) slide off it. A taller block still stops the body.
 * Falls back to a half step, matching the old mover when nothing slips.
 */
export function lipStep(
  x: number,
  y: number,
  dx: number,
  dy: number,
  blocked: (x: number, y: number) => boolean,
  lip = 4,
): { x: number; y: number; slipped: boolean } {
  let slipped = false;
  let nx = x;
  let ny = y;

  if (dx) {
    if (!blocked(x + dx, y)) nx = x + dx;
    else {
      const slip = slipPerp(x, y, dx, 0, blocked, lip);
      if (slip) {
        nx = slip.x;
        ny = slip.y;
        slipped = true;
      } else if (!blocked(x + dx * 0.5, y)) nx = x + dx * 0.5;
    }
  }

  if (dy) {
    if (!blocked(nx, ny + dy)) ny += dy;
    else {
      const slip = slipPerp(nx, ny, 0, dy, blocked, lip);
      if (slip) {
        nx = slip.x;
        ny = slip.y;
        slipped = true;
      } else if (!blocked(nx, ny + dy * 0.5)) ny += dy * 0.5;
    }
  }

  return { x: nx, y: ny, slipped };
}

function slipPerp(
  x: number,
  y: number,
  dx: number,
  dy: number,
  blocked: (x: number, y: number) => boolean,
  lip: number,
): { x: number; y: number } | null {
  const alongX = dx !== 0;
  for (let k = 1; k <= lip; k++) {
    for (const sign of [1, -1]) {
      const tx = alongX ? x + dx : x + sign * k;
      const ty = alongX ? y + sign * k : y + dy;
      if (!blocked(tx, ty)) return { x: tx, y: ty };
    }
  }
  return null;
}

/** Camera ignores motion inside the deadzone, then eases toward the rest. */
export function stepCamera(
  camX: number,
  camY: number,
  focusX: number,
  focusY: number,
  dt: number,
  opts: { deadX: number; deadY: number; stiffness: number },
): { x: number; y: number } {
  const aim = (cam: number, focus: number, dead: number) => {
    const delta = focus - cam;
    if (Math.abs(delta) <= dead) return cam;
    return focus - Math.sign(delta) * dead;
  };
  const tx = aim(camX, focusX, opts.deadX);
  const ty = aim(camY, focusY, opts.deadY);
  const k = 1 - Math.exp(-opts.stiffness * dt);
  return { x: camX + (tx - camX) * k, y: camY + (ty - camY) * k };
}

/** Shorter freeze when reduced motion is on. The hit is still there. */
export function scaleHitstop(seconds: number, reduced: boolean): number {
  const scaled = reduced ? seconds * 0.4 : seconds;
  return Math.min(HITSTOP_CAP_S, Math.max(0, scaled));
}

/** Remember a blade press that arrived while the world was frozen. */
export function noteAttackDuringHitstop(queued: boolean, pressed: boolean, hitstop: number): boolean {
  if (hitstop > 0 && pressed) return true;
  return queued;
}

/** When the freeze ends, turn that press into a buffer the sim can spend. */
export function releaseAttackBuffer(
  queued: boolean,
  hitstop: number,
  buffer: number,
): { queued: boolean; buffer: number } {
  if (hitstop <= 0 && queued) return { queued: false, buffer: Math.max(buffer, ATTACK_BUFFER_S) };
  return { queued, buffer };
}
