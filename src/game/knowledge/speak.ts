import type { Effect } from "./types.ts";

export function describeEffects(effects: Effect[], nameOf: (id: string) => string): string {
  return effects
    .map((effect) => {
      switch (effect.op) {
        case "gain": {
          const bits: string[] = [];
          if (effect.heat) bits.push(`${effect.heat} heat`);
          if (effect.ration) bits.push(`${effect.ration} ration`);
          if (effect.ink) bits.push(`${effect.ink} ink`);
          return `Gain ${bits.join(", ")}.`;
        }
        case "draw":
          return `Draw ${effect.n}.`;
        case "shelter":
          return `Shelter ${effect.n}.`;
        case "kindle":
          return "Kindle: spend 1 more ration to gain 2 heat.";
        case "inscribe":
          return `Inscribe ${nameOf(effect.manualId)}.`;
        case "playMusic":
          return `Play ${nameOf(effect.pieceId)}.`;
        case "revealRecipe":
          return `Reveal ${nameOf(effect.recipeId)}.`;
        case "mend":
          return `Mend ${effect.n}.`;
        case "scout":
          return `Scout ${nameOf(effect.puzzleId)} and take a sugar-line hint.`;
        case "store":
          return `Store ${effect.n} in the cellar.`;
        default:
          return "";
      }
    })
    .join(" ");
}
