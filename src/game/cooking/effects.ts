import { EFFECT_DURATION_HARD_CAP, SALVAGE_DURATION, STACKING_TABLE } from "./constants.ts";
import type { ActiveEffect, EffectSpec } from "./types.ts";

export function clampDuration(minutes: number): number {
  if (!Number.isFinite(minutes)) return 1;
  return Math.max(1, Math.min(EFFECT_DURATION_HARD_CAP, Math.round(minutes)));
}

export const SALVAGE_EFFECT_ID = "hearth-scraps";

export function salvageEffect(fiction: string): EffectSpec {
  return {
    id: SALVAGE_EFFECT_ID,
    slot: "table",
    name: "Warm hands",
    fiction,
    magnitude: 1,
    durationMinutes: SALVAGE_DURATION,
    notFor: "A failed pot's scrap. Not a cure, not a fight, and not a Vein plate.",
    stacking: STACKING_TABLE,
  };
}

export type EffectApplyResult = "applied" | "refreshed" | "replaced";

/**
 * Pure stacking rule for integrators and tests.
 * Eating in play does not call this to extend a live plate — see eatDish.
 * Same effect: duration resets to this plate's length. It is never added.
 * Magnitude stays 1. A different effect in the same seat replaces; it does not combine.
 */
export function resolveEffectApplication(
  current: ActiveEffect[],
  incoming: EffectSpec,
  now: number,
  sourceDish: string,
): { effects: ActiveEffect[]; result: EffectApplyResult; note: string } {
  const duration = clampDuration(incoming.durationMinutes);
  const living = current.filter((effect) => effect.expiresAt > now);
  const existing = living.find((effect) => effect.slot === incoming.slot);
  const others = living.filter((effect) => effect.slot !== incoming.slot);
  const startedAt = existing && existing.effectId === incoming.id ? existing.startedAt : now;
  const made: ActiveEffect = {
    effectId: incoming.id,
    slot: incoming.slot,
    name: incoming.name,
    fiction: incoming.fiction,
    magnitude: 1,
    startedAt,
    expiresAt: now + duration,
    sourceDish,
    notFor: incoming.notFor,
  };
  if (existing && existing.effectId === incoming.id) {
    return {
      effects: [...others, made],
      result: "refreshed",
      note: "The clock resets to this plate's length. It is not added. Strength stays at one.",
    };
  }
  if (existing) {
    return {
      effects: [...others, made],
      result: "replaced",
      note: `${existing.name} leaves. ${incoming.name} takes the seat. They do not combine.`,
    };
  }
  return {
    effects: [...others, made],
    result: "applied",
    note: "The seat was empty.",
  };
}
