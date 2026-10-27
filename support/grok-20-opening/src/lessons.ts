import { LESSON_IDS, type LessonId, type LessonReport, type LessonStatus, type State } from "./types.ts";

function rank(practiced: boolean, understood: boolean): LessonStatus {
  if (understood) return "understood";
  if (practiced) return "practiced";
  return "unmet";
}

/**
 * Lessons are derived from what the player has done. None of them is a gate.
 * Missing one never locks the next, in either year of the county.
 */
export function lessonsOf(state: State): LessonReport[] {
  const f = state.flags;
  const contextUnderstood = state.verbLog.some((id) => id !== "draw-blade" && id !== "lower" && id !== "equip-hammer");
  const toolPracticed = f.hammerTaken || f.usedHammer || f.salveUsed || f.usedCloth;
  const toolUnderstood = f.usedHammer || f.salveUsed || f.usedCloth;
  const heal = f.salveUsed || f.drank || f.bandaged || f.healedByRest;
  const hammerPracticed =
    f.feltVein || f.feltYard || f.usedHammer || state.seam.veinScar || state.seam.yardScar || state.seam.veinDent || state.seam.yardDent;
  const hammerUnderstood = state.seam.veinOpen || state.seam.yardOpen;
  const perm =
    f.observedCoat ||
    f.observedScar ||
    f.observedRoot ||
    f.observedOpenVein ||
    f.observedWrist ||
    f.readOldNotch ||
    (f.delivered && f.sawTableAltered);
  const recog = f.readRutsAltered || f.readMilepostAltered || f.heardAlteredYear || f.readStranger || f.fitAltered || f.sawWindowAltered;

  const status: Record<LessonId, LessonStatus> = {
    movement: rank(state.steps >= 1, state.steps >= 4 && new Set(state.dirsUsed).size >= 2),
    context: rank(state.verbLog.length > 0, contextUnderstood),
    blade: rank(f.drewBlade || f.cutSomething, f.cutSomething),
    tool: rank(toolPracticed, toolUnderstood),
    heal: rank(heal, heal),
    rest: rank(f.rested, f.rested),
    save: rank(f.explicitSave, f.explicitSave),
    hammer: rank(hammerPracticed, hammerUnderstood),
    death: rank(state.deaths > 0 || state.dead, f.released),
    permanence: rank(f.released, f.released && perm),
    recognition: rank(f.released, recog),
  };

  return LESSON_IDS.map((id) => {
    const row: LessonReport = { id, status: status[id] };
    if (id === "hammer") {
      row.hammerSite = state.hammerSite;
      row.dungeonWitnessed = state.seam.veinOpen;
    }
    return row;
  });
}

export function lesson(state: State, id: LessonId): LessonStatus {
  return lessonsOf(state).find((row) => row.id === id)?.status ?? "unmet";
}

export function allUnderstood(state: State): boolean {
  return lessonsOf(state).every((row) => row.status === "understood");
}
