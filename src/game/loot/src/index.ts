/** Public loot-core API. UI and other sessions import from here. */

export { LootError } from "./errors.ts";
export type { LootErrorBody } from "./errors.ts";

export {
  CATEGORIES,
  CATEGORY_PREFIX,
  EQUIP_SLOTS,
  EXTERNAL_SYSTEMS,
  HANDLERS,
} from "./types.ts";
export type {
  ActorState,
  BagKind,
  BudgetReport,
  Category,
  CharacterBeat,
  CharacterDef,
  ConditionKind,
  ContentPack,
  DeathRecord,
  DisplaySlot,
  Effect,
  EquipSlot,
  EvidenceEntry,
  ExternalSystem,
  HandlerName,
  HandoffRecord,
  HandoffSpec,
  ItemDefinition,
  ItemFlags,
  ItemInstance,
  ItemUse,
  JournalEntry,
  LogLine,
  LootAction,
  LootState,
  MapMarker,
  ModificationSpec,
  Owner,
  Protection,
  Reading,
  Recipe,
  ResolvedContent,
  Restoration,
  Scalar,
  SourceKind,
  SourceRecord,
  StepFail,
  StepOk,
  StepResult,
  TraderDef,
} from "./types.ts";

export {
  CATALOG_BUDGET,
  CATALOG_TOTAL,
  DEMO_ITEM_ID,
  PRODUCTION_ITEM_ID,
  assertNoIdOverlap,
  categoryPrefixOf,
  classifyItemId,
} from "./ids.ts";

export { budgetOf, validateContent } from "./validate.ts";
export { resolveContent } from "./content.ts";

export {
  BASE_CARRY,
  carryLimit,
  carryWeight,
  categoryLabel,
  countOwned,
  derivedPreview,
  emptyState,
  findByDefinition,
  itemsIn,
  pieceCount,
  playerPieceIds,
  protectionOf,
  unitValue,
} from "./state.ts";
export type { DerivedPreview } from "./state.ts";

export { grantItem, step, surviveDeath } from "./dispatch.ts";
export type { Grant } from "./dispatch.ts";

export { listActions, listBench, listBuy, listSell } from "./actions.ts";
export type { AvailableAction, BenchOffer } from "./actions.ts";

export {
  DEMO_BACKUP_KEY,
  DEMO_SAVE_KEY,
  SAVE_VERSION,
  browserPort,
  exportSave,
  importSave,
  memoryPort,
  migrateRaw,
  writeSave,
} from "./save.ts";
export type { LootSave, SavePort } from "./save.ts";
