import type { Card, CardType, Effect, Timing } from "./types.ts";

export const WEIGHTS = {
  gain: { heat: 1, ration: 1, ink: 1.25 },
  draw: 1.4,
  shelter: 1.6,
  kindle: 2.1,
  inscribe: 1.7,
  playMusic: 1.55,
  revealRecipe: 1.9,
  mend: 1.15,
  scout: 1.25,
  store: 0.8,
  cost: { heat: 1.2, ration: 1, ink: 1.35 },
  kindleTax: 0.75,
  anyTax: 0.45,
} as const;

export const RATIO_MIN = 0.9;
export const RATIO_MAX = 1.4;
export const VALUE_MIN = 2.5;
export const VALUE_MAX = 7.2;

export const TIMING_ALLOWED: Record<CardType, Timing[]> = {
  provision: ["dawn"],
  craft: ["day"],
  tool: ["dawn", "day"],
  lesson: ["day", "any"],
  omen: ["dusk"],
};

export function effectValue(effect: Effect): number {
  switch (effect.op) {
    case "gain":
      return (
        (effect.heat ?? 0) * WEIGHTS.gain.heat +
        (effect.ration ?? 0) * WEIGHTS.gain.ration +
        (effect.ink ?? 0) * WEIGHTS.gain.ink
      );
    case "draw":
      return effect.n * WEIGHTS.draw;
    case "shelter":
      return effect.n * WEIGHTS.shelter;
    case "kindle":
      return WEIGHTS.kindle;
    case "inscribe":
      return WEIGHTS.inscribe;
    case "playMusic":
      return WEIGHTS.playMusic;
    case "revealRecipe":
      return WEIGHTS.revealRecipe;
    case "mend":
      return effect.n * WEIGHTS.mend;
    case "scout":
      return WEIGHTS.scout;
    case "store":
      return effect.n * WEIGHTS.store;
    default:
      return 0;
  }
}

export function assess(card: Card): { value: number; cost: number; ratio: number } {
  const value = round2(card.effects.reduce((sum, e) => sum + effectValue(e), 0));
  let cost =
    card.cost.heat * WEIGHTS.cost.heat +
    card.cost.ration * WEIGHTS.cost.ration +
    card.cost.ink * WEIGHTS.cost.ink;
  if (card.effects.some((e) => e.op === "kindle")) cost += WEIGHTS.kindleTax;
  if (card.timing === "any") cost += WEIGHTS.anyTax;
  cost = round2(cost);
  const ratio = cost <= 0 ? Infinity : round3(value / cost);
  return { value, cost, ratio };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
