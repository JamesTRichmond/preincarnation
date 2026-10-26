export { BINDING_REPORT } from "./bindings.ts";
export { catalog, catalogById, recipes } from "./book.ts";
export { validateConservation, type ConservationReport, type Violation, type ViolationCode } from "./conservation.ts";
export {
  applyOnce,
  everyRequests,
  isRunnable,
  maxCount,
  perform,
  performMany,
  preview,
  rest,
  runnableRecipes,
  salvageRequests,
  toggleFavoriteItem,
  toggleFavoriteRecipe,
  toggleLock,
  totalMass,
  undo,
  type PerformResult,
} from "./engine.ts";
export { createInitialBench } from "./seed.ts";
export {
  STAT_BETTER,
  STAT_IDS,
  STAT_LABEL,
  isStackableKind,
  statIsBetter,
  statIsWorse,
  type AppliedMod,
  type BenchState,
  type CatalogEntry,
  type ItemInstance,
  type ModifyChoice,
  type Recipe,
  type StatId,
  type WorkPreview,
  type WorkRequest,
} from "./types.ts";

import { BINDING_REPORT } from "./bindings.ts";
import { catalog, recipes } from "./book.ts";
import { validateConservation } from "./conservation.ts";

export const CONSERVATION = validateConservation(recipes, catalog);

export const BENCH_FACTS = {
  binding: BINDING_REPORT.status,
  fixtures: catalog.length,
  operations: recipes.length,
  conservationOk: CONSERVATION.ok,
  violations: CONSERVATION.violations.length,
};
