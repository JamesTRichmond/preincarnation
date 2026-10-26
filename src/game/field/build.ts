import type { EncounterAction, EncounterStep, SketchMark, StepChoice } from "./types.ts";

export function ok(id: string, label: string, action: EncounterAction): StepChoice {
  return { id, label, action, outcome: "succeed" };
}

export function no(
  id: string,
  label: string,
  action: EncounterAction,
  missText: string,
): StepChoice {
  return { id, label, action, outcome: "miss", missText };
}

export function choose(id: string, instruction: string, choices: StepChoice[]): EncounterStep {
  return { kind: "choice", id, instruction, choices };
}

export function sketch(instruction: string, wrongText: string): EncounterStep {
  return {
    kind: "sketch",
    id: "sketch",
    instruction,
    wrongText,
  };
}

export function plate(rows: Array<[string, string, boolean]>): SketchMark[] {
  return rows.map(([id, label, correct]) => ({ id, label, correct }));
}
