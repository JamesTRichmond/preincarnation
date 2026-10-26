import { clamp } from "./num.ts";
import type { CastState } from "./types.ts";

export const MIN_CAST_POWER = 0.14;
export const CHARGE_SECONDS = 1.05;
export const FLIGHT_SECONDS = 0.45;
export const FLIGHT_CANCEL_LIMIT = 0.35;

export function idleCast(): CastState {
  return { phase: "idle", power: 0, flight: 0, reason: null, landX: 0.5, landY: 0.5, short: false };
}

export function startCharge(cast: CastState): void {
  if (cast.phase === "flight") return;
  cast.phase = "charging";
  cast.power = 0;
  cast.flight = 0;
  cast.reason = null;
  cast.short = false;
}

export function tickCharge(cast: CastState, dt: number): void {
  if (cast.phase !== "charging") return;
  cast.power = Math.min(1, cast.power + dt / CHARGE_SECONDS);
}

export function cancelCast(cast: CastState, reason: "player" | "focus" | "short"): void {
  cast.phase = "idle";
  cast.power = 0;
  cast.flight = 0;
  cast.reason = reason;
  cast.short = false;
}

export function releaseCast(cast: CastState): "flight" | "short" {
  if (cast.phase !== "charging") return "short";
  if (cast.power < MIN_CAST_POWER) {
    cancelCast(cast, "short");
    return "short";
  }
  cast.phase = "flight";
  cast.flight = 0;
  cast.reason = null;
  return "flight";
}

export function tryCancelFlight(cast: CastState, reason: "player" | "focus"): boolean {
  if (cast.phase !== "flight") return false;
  if (cast.flight > FLIGHT_CANCEL_LIMIT) return false;
  cancelCast(cast, reason);
  return true;
}

export interface Landing {
  x: number;
  y: number;
  short: boolean;
  reach: number;
  distance: number;
}

/** A full hold reaches `castRange * 1.35` from the angler. A short hold falls short. */
export function castLanding(
  anglerX: number,
  aimX: number,
  aimY: number,
  power: number,
  castRange: number,
): Landing {
  const ay = 0.86;
  const dx = aimX - anglerX;
  const dy = aimY - ay;
  const distance = Math.hypot(dx, dy) || 0.001;
  const reach = Math.max(0.06, clamp(power, 0, 1) * castRange * 1.35);
  const t = Math.min(1, reach / distance);
  return {
    x: anglerX + dx * t,
    y: ay + dy * t,
    short: t < 0.92,
    reach,
    distance,
  };
}
