import type { ActionCue, FilterAction } from "./types.ts";

/**
 * Every action has a word and a shape. Color is never the only cue.
 */
export const ACTION_CUES: Record<FilterAction, ActionCue> = {
  emphasize: {
    action: "emphasize",
    short: "MARK",
    label: "Marked",
    shape: "diamond",
    pattern: "double",
    summary: "Marked. Diamond mark and the word MARK. Highest prominence.",
    reliesOnColor: false,
  },
  show: {
    action: "show",
    short: "SHOW",
    label: "Shown",
    shape: "square",
    pattern: "solid",
    summary: "Shown normally. Square mark and the word SHOW.",
    reliesOnColor: false,
  },
  collapse: {
    action: "collapse",
    short: "STACK",
    label: "Stacked",
    shape: "layers",
    pattern: "stacked",
    summary: "Duplicate labels share one stack. Layered mark, the word STACK, and a written count.",
    reliesOnColor: false,
  },
  reduce: {
    action: "reduce",
    short: "DIM",
    label: "Quieter",
    shape: "dashed-circle",
    pattern: "dashed",
    summary: "Quieter. Dashed outline, circle mark, and the word DIM. Still on the ground.",
    reliesOnColor: false,
  },
  hide: {
    action: "hide",
    short: "HIDE",
    label: "Hidden",
    shape: "minus",
    pattern: "withdrawn",
    summary: "Hidden from the clearing only. Minus mark and the word HIDE. The object stays in the world.",
    reliesOnColor: false,
  },
};

export function actionVerb(action: FilterAction): string {
  switch (action) {
    case "emphasize":
      return "mark";
    case "show":
      return "show normally";
    case "collapse":
      return "stack";
    case "reduce":
      return "quiet";
    case "hide":
      return "hide";
  }
}

export const RESTRICTIVE_ACTIONS: ReadonlySet<FilterAction> = new Set([
  "collapse",
  "reduce",
  "hide",
]);
