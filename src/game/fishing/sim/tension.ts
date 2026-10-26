import type { TensionFlag, TensionInput, TensionResult } from "./types.ts";

/** Hard ceiling for any tension value. Nothing in the fight may exceed this. */
export const TENSION_ABS_MAX = 1.25;
export const GIVE_CAP = 0.12;
export const HOLD_PRESSURE = 0.78;
export const SNAP_GRACE = 0.2;

/**
 * Slack wins over pressure. Tension is finite and inside [0, TENSION_ABS_MAX].
 * A bad ceiling cannot produce a snap, and a single frame cannot be both a
 * broken line and a landed fish — landing is decided only after this returns.
 */
export function stepTension(input: TensionInput): TensionResult {
  const flags: TensionFlag[] = [];
  let tension = input.tension;
  if (!Number.isFinite(tension)) {
    tension = 0;
    flags.push("nan-reset");
  } else if (tension > TENSION_ABS_MAX) {
    tension = TENSION_ABS_MAX;
    flags.push("clamped-high");
  } else if (tension < 0) {
    tension = 0;
    flags.push("clamped-low");
  }

  let fishForce = input.fishForce;
  if (!Number.isFinite(fishForce)) {
    fishForce = 0;
    flags.push("force-clamped");
  } else if (fishForce < 0 || fishForce > 1) {
    fishForce = Math.min(1, Math.max(0, fishForce));
    flags.push("force-clamped");
  }

  let pressure = input.pressure;
  if (!Number.isFinite(pressure)) {
    pressure = 0;
    flags.push("pressure-clamped");
  } else if (pressure < 0 || pressure > 1) {
    pressure = Math.min(1, Math.max(0, pressure));
    flags.push("pressure-clamped");
  }

  let dt = input.dt;
  if (!Number.isFinite(dt) || dt < 0 || dt > 0.1) {
    dt = Math.min(0.1, Math.max(0, Number.isFinite(dt) ? dt : 0));
    flags.push("dt-clamped");
  }

  const ceiling = input.ceiling;
  if (!Number.isFinite(ceiling) || ceiling <= 0) {
    flags.push("bad-ceiling");
    return {
      tension: Math.min(TENSION_ABS_MAX, Math.max(0, tension)),
      appliedPressure: 0,
      fishForce,
      snapped: false,
      overSeconds: 0,
      flags,
    };
  }

  let applied = pressure;
  if (input.giveLine) {
    if (applied > GIVE_CAP) applied = GIVE_CAP;
    flags.push("slack-priority");
  }

  const overPressed = fishForce > 0.5 && applied > 0.5;
  let target = overPressed
    ? fishForce * (0.75 + applied * 0.7)
    : fishForce * (0.28 + applied * 0.45);
  if (!Number.isFinite(target)) target = 0;
  if (target > TENSION_ABS_MAX) {
    target = TENSION_ABS_MAX;
    flags.push("clamped-high");
  }
  if (target < 0) target = 0;

  let next = dt === 0 ? tension : tension + (target - tension) * Math.min(1, dt * 8);
  if (!Number.isFinite(next)) {
    next = 0;
    flags.push("nan-reset");
  }
  if (next > TENSION_ABS_MAX) {
    next = TENSION_ABS_MAX;
    flags.push("clamped-high");
  }
  if (next < 0) {
    next = 0;
    flags.push("clamped-low");
  }

  let overSeconds = input.overSeconds;
  if (!Number.isFinite(overSeconds) || overSeconds < 0) overSeconds = 0;
  const grace = Number.isFinite(input.grace) && input.grace > 0 ? input.grace : 0;
  let snapped = false;
  if (next > ceiling) {
    overSeconds += dt;
    if (overSeconds >= grace) snapped = true;
  } else {
    overSeconds = 0;
  }

  return { tension: next, appliedPressure: applied, fishForce, snapped, overSeconds, flags };
}
