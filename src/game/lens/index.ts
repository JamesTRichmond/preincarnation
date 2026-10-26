/**
 * PREINCARNATION ground-loot filter.
 * Presentation only: never removes an object and never approves pickup, sale, or salvage.
 * The life save is untouched. The chosen document lives at FILTER_STORAGE_KEY.
 */

export {
  FILTER_ACTIONS,
  FILTER_FORMAT,
  FILTER_STORAGE_KEY,
  FILTER_VERSION,
  KNOWN_CATEGORIES,
  KNOWN_USES,
  COLLECTION_STATUSES,
  MASTERY_COMPAT,
  OWNERSHIPS,
  PROJECT_RELATIONS,
} from "./types.ts";
export type {
  ActionCue,
  CategoryCondition,
  CollectionStatus,
  FilterAction,
  FilterContext,
  FilterDecision,
  FilterDocument,
  FilterResult,
  FilterRule,
  GroundItem,
  ImportResult,
  KeyValueStore,
  KnownUse,
  MasteryCompatibility,
  Ownership,
  PresentedEntry,
  PreservationCause,
  ProjectRelation,
  QuantityCondition,
  RuleProblem,
  RuntimeBinding,
  ShadowedRule,
} from "./types.ts";

export { ACTION_CUES, actionVerb } from "./cues.ts";
export { FIXTURE_NOTICE, UNIMPLEMENTED_RUNTIME_BINDINGS } from "./bindings.ts";
export {
  causePhrase,
  categoryLabel,
  collectionLabel,
  hideIneligibleWhy,
  inspectDocument,
  isKnownCategory,
  masteryLabel,
  ownershipLabel,
  preservationCauses,
  ruleMatches,
  ruleProblem,
  summarizeRule,
  useLabel,
} from "./inspect.ts";
export { accountedIds, evaluateLoot } from "./engine.ts";
export {
  SAMPLE_HOSTILE_IMPORT,
  copyDocument,
  createRuleId,
  exportFilterDocument,
  importFilterDocument,
  loadFilterDocument,
  parseFilterDocument,
  saveFilterDocument,
} from "./document.ts";
export {
  EVERYTHING_PRESET,
  PRESETS,
  PROJECT_PRESET,
  QUIET_PRESET,
  TRAIL_PRESET,
} from "./presets.ts";
export type { FilterPreset } from "./presets.ts";
export { FIXTURE_CONTEXT, FIXTURE_ITEMS, FIXTURE_MASTERY_LABEL, fixtureItem } from "./fixture.ts";
