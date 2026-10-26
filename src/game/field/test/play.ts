import {
  applyDisposition,
  applyEncounterAction,
  beginEncounter,
  correctMarkIds,
  getCreature,
} from "../index.ts";
import type { ActionResult, OutingSave } from "../types.ts";

export function finishEncounter(
  save: OutingSave,
  id: string,
  disposition: "release" | "keep",
): ActionResult {
  let current = beginEncounter(save, id);
  if (current.kind === "blocked") {
    throw new Error(`begin ${id}: ${current.message}`);
  }
  const creature = getCreature(id);
  for (const step of creature.steps) {
    if (step.kind === "sketch") {
      current = applyEncounterAction(current.save, {
        type: "marks",
        markIds: correctMarkIds(creature),
      });
    } else {
      const choice = step.choices.find((item) => item.outcome === "succeed");
      if (!choice) throw new Error(`${id} step ${step.id} has no success`);
      current = applyEncounterAction(current.save, choice.action);
    }
    if (current.kind === "miss" || current.kind === "blocked") {
      throw new Error(`${id}: ${current.message}`);
    }
  }
  const done = applyDisposition(current.save, disposition);
  if (done.kind !== "done") throw new Error(`${id} disposition: ${done.message}`);
  return done;
}
