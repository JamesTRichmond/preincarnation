export {
  BODIES,
  BODY_LABEL,
  DISCIPLINES,
  DISCIPLINE_LABEL,
  EQUIP_SLOTS,
  FAMILY_SIZE,
  MOD_PHASES,
  SLOT_BUDGET,
  SLOT_LABEL,
  STAT_KEYS,
  baseStats,
  emptyStats,
  fid,
} from "./types.ts";
export type {
  BodyId,
  CountsWhen,
  Discipline,
  Discovery,
  EquipSlot,
  FamilyDef,
  Instance,
  ItemDef,
  Loadout,
  ModDraft,
  Presence,
  Resolution,
  ResolvedMod,
  Stat,
  Stats,
} from "./types.ts";

export { FAMILIES, FAMILY_BY_ID, ITEMS, ITEM_BY_ID, familyById, itemById } from "./catalog.ts";
export {
  applyModifiers,
  changeBody,
  compareResolutions,
  emptyLoadout,
  grantPiece,
  removeInstance,
  resolve,
  tryEquip,
} from "./resolve.ts";
export type { StepResult } from "./resolve.ts";
export { SCENARIOS, SCENARIO_IDS, fight, fightScore } from "./arena.ts";
export type { FightResult, ScenarioId, TraceRow } from "./arena.ts";
export { FAMILY_SAVE_KEY, FAMILY_SAVE_VERSION, hydrateLoadout, serializeLoadout } from "./save.ts";
export {
  SHOWCASE,
  coldBucket,
  creekLamp,
  firstLie,
  fullFamilyLoadout,
  partialFamilyLoadout,
  presets,
} from "./presets.ts";
