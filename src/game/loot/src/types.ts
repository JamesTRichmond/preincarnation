/** Loot-core contracts. Other sessions supply production catalogs; they do not fork these types. */

import type { LootErrorBody } from "./errors.ts";

export const CATEGORIES = [
  "ordinary",
  "equipment",
  "relic",
  "ingredient",
  "card",
  "dish",
  "trophy",
  "document",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_PREFIX: Record<Category, string> = {
  ordinary: "ord",
  equipment: "eq",
  relic: "rel",
  ingredient: "ing",
  card: "card",
  dish: "dish",
  trophy: "trp",
  document: "doc",
};

/** Slots this core knows how to wear. Mastery reads them; it does not own them. */
export const EQUIP_SLOTS = [
  "main-hand",
  "head",
  "back",
  "feet",
  "light",
  "tool",
  "trinket",
] as const;

export type EquipSlot = (typeof EQUIP_SLOTS)[number];

export const HANDLERS = [
  "equip",
  "consume",
  "read",
  "present",
  "place",
  "restore-target",
  "restore-material",
  "modify-kit",
  "modify-target",
  "dismantle",
  "craft-material",
  "craft-output",
  "craft-tool",
  "rig",
  "consult",
  "gift",
  "unlock",
  "catalog-note",
  "ford",
] as const;

export type HandlerName = (typeof HANDLERS)[number];

export const EXTERNAL_SYSTEMS = [
  "cooking",
  "cards",
  "fishing",
  "hunting",
  "mastery",
] as const;

export type ExternalSystem = (typeof EXTERNAL_SYSTEMS)[number];

export type Protection = "none" | "quest" | "essential";

export type ConditionKind = "none" | "durable" | "perishable";

export interface Effect {
  satiety?: number;
  warmth?: number;
  light?: number;
  calm?: number;
}

export interface HandoffSpec {
  system: ExternalSystem;
  key: string;
  value: string | number | boolean;
  note: string;
}

export interface Reading {
  title: string;
  /** Paragraphs shown by the read action. Empty copy is rejected. */
  body: string[];
}

export interface MapMarker {
  id: string;
  name: string;
  /** 0–100, sketch space, not a geographic projection. */
  x: number;
  y: number;
  note: string;
}

export interface ItemUse {
  handler: HandlerName;
  label: string;
  /** What the action actually does. A sale-price hint is not accepted here. */
  detail: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: Category;
  summary: string;
  /** Pounds per unit. */
  weight: number;
  /** Coppers at full condition, before the stall's category rules. Not a purpose. */
  value: number;
  stackLimit: number;
  tags: string[];
  protection: Protection;
  condition: ConditionKind;
  equipSlot?: EquipSlot;
  /** Applied by derived stats while worn and in decent condition. Not combat resolution. */
  equippedEffect?: Effect;
  carryBonus?: number;
  consumeEffect?: Effect;
  reading?: Reading;
  mapMarkers?: MapMarker[];
  evidenceId?: string;
  unlockFlag?: string;
  unlockNote?: string;
  /** Quest protection can be lifted only after this flag is set, and only by an explicit release. */
  releaseWhenFlag?: string;
  consult?: {
    title: string;
    body: string;
    repeat: boolean;
    requiresPlaced?: boolean;
    flag?: string;
  };
  catalogNote?: { title: string; body: string };
  ford?: { flag: string; note: string };
  placeTags?: string[];
  dismantle?: { definitionId: string; quantity: number }[];
  rig?: HandoffSpec;
  externalRef?: { system: ExternalSystem; id: string };
  uses: ItemUse[];
}

export interface Recipe {
  id: string;
  name: string;
  /** Bench only. Factories are out of scope and rejected. */
  station: "bench";
  inputs: { definitionId: string; quantity: number }[];
  toolDefinitionId?: string;
  toolWear?: number;
  output: { definitionId: string; quantity: number; condition?: number | null };
  note: string;
}

export interface Restoration {
  id: string;
  name: string;
  targetDefinitionId: string;
  inputs: { definitionId: string; quantity: number }[];
  toolDefinitionId?: string;
  toolWear?: number;
  restoreAmount: number;
  note: string;
}

export interface ModificationSpec {
  id: string;
  name: string;
  targetTags: string[];
  kit: { definitionId: string; quantity: number };
  conditionDelta: number;
  edgeDelta?: number;
  /** Tag mastery can read. This core does not turn it into damage. */
  masteryTag: string;
  note: string;
}

export interface CharacterBeat {
  id: string;
  definitionId: string;
  via: "present" | "gift";
  requiresFlags?: string[];
  requiresRead?: boolean;
  consumes: boolean;
  disposition: number;
  setFlags?: string[];
  evidence?: boolean;
  handoff?: HandoffSpec;
  journalTitle: string;
  lines: string[];
}

export interface CharacterDef {
  id: string;
  name: string;
  role: string;
  place: string;
  beats: CharacterBeat[];
}

export interface DisplaySlot {
  id: string;
  name: string;
  place: string;
  accepts: string[];
}

export interface TraderDef {
  id: string;
  name: string;
  place: string;
  purse: number;
  buys: Category[];
  refusesNote: string;
  stock: { definitionId: string; quantity: number; condition?: number | null }[];
}

export interface BudgetReport {
  counts: Record<Category, number>;
  budget: {
    ordinary: number;
    equipment: number;
    relic: number;
    ingredient: number;
    card: number;
    dish: number;
    trophy: number;
    document: number;
  };
  total: number;
  totalBudget: number;
  over: Category[];
}

export interface ResolvedContent {
  packId: string;
  mode: "demo" | "production";
  label: string;
  definitions: ReadonlyMap<string, ItemDefinition>;
  recipes: ReadonlyMap<string, Recipe>;
  restorations: ReadonlyMap<string, Restoration>;
  modifications: ReadonlyMap<string, ModificationSpec>;
  characters: ReadonlyMap<string, CharacterDef>;
  slots: ReadonlyMap<string, DisplaySlot>;
  trader: TraderDef;
  budget: BudgetReport;
  list: readonly ItemDefinition[];
}

export interface ContentPack {
  id: string;
  mode: "demo" | "production";
  label: string;
  definitions: ItemDefinition[];
  recipes: Recipe[];
  restorations: Restoration[];
  modifications: ModificationSpec[];
  characters: CharacterDef[];
  slots: DisplaySlot[];
  trader: TraderDef;
}

export type SourceKind =
  | "seed"
  | "craft"
  | "dismantle"
  | "trade"
  | "gift"
  | "salvage"
  | "split"
  | "acquire";

export interface SourceRecord {
  kind: SourceKind;
  clock: number;
  note: string;
  fromIds: string[];
}

export interface ItemFlags {
  read?: boolean;
  fieldReady?: boolean;
}

export interface ItemInstance {
  id: string;
  definitionId: string;
  quantity: number;
  /** Null when the definition has no condition. */
  condition: number | null;
  mods: string[];
  /** Null inherits the definition. "none" is an explicit release. */
  protection: Protection | null;
  /** Sum of modification edge notes. Preview only. */
  modEdge: number;
  flags: ItemFlags;
  source: SourceRecord;
}

export type Owner =
  | { kind: "carry" }
  | { kind: "stash" }
  | { kind: "bench" }
  | { kind: "equipped"; slot: EquipSlot }
  | { kind: "display"; slotId: string }
  | { kind: "trader" };

export interface JournalEntry {
  id: string;
  clock: number;
  kind: "read" | "evidence" | "note" | "consult" | "death";
  title: string;
  body: string;
}

export interface EvidenceEntry {
  id: string;
  clock: number;
  evidenceId: string;
  definitionId: string;
  instanceId: string;
  characterId: string;
  summary: string;
}

export interface HandoffRecord {
  id: string;
  clock: number;
  system: ExternalSystem;
  key: string;
  value: string | number | boolean;
  definitionId: string;
  instanceId: string;
  note: string;
}

export interface DeathRecord {
  id: string;
  clock: number;
  cause: string;
  /** Instance ids owned by Ellis immediately after the death. Must match the ids from before. */
  instanceIds: string[];
  pieceCount: number;
}

export interface LogLine {
  clock: number;
  message: string;
}

export interface ActorState {
  name: string;
  satiety: number;
  warmth: number;
  /** Banked light from a fire or a burned torch. Separate from a worn lantern. */
  light: number;
  calm: number;
  disposition: Record<string, number>;
}

export type Scalar = string | number | boolean;

export interface LootState {
  version: 1;
  clock: number;
  idCounter: number;
  purse: number;
  traderPurse: number;
  instances: Record<string, ItemInstance>;
  owners: Record<string, Owner>;
  equipment: Partial<Record<EquipSlot, string>>;
  placements: Record<string, string>;
  journal: JournalEntry[];
  evidence: EvidenceEntry[];
  handoffs: HandoffRecord[];
  markers: MapMarker[];
  flags: Record<string, Scalar>;
  deaths: DeathRecord[];
  log: LogLine[];
  actor: ActorState;
}

export type BagKind = "carry" | "stash" | "bench";

export type LootAction =
  | {
      type: "acquire";
      definitionId: string;
      quantity: number;
      condition?: number | null;
      owner: BagKind | "trader";
      sourceKind: SourceKind;
      sourceNote: string;
      fromIds?: string[];
    }
  | { type: "transfer"; instanceId: string; to: BagKind; quantity?: number }
  | { type: "split"; instanceId: string; quantity: number }
  | { type: "equip"; instanceId: string }
  | { type: "unequip"; slot: EquipSlot }
  | { type: "consume"; instanceId: string }
  | { type: "read"; instanceId: string }
  | { type: "present"; instanceId: string; characterId: string }
  | { type: "gift"; instanceId: string; characterId: string }
  | { type: "place"; instanceId: string; slotId: string }
  | { type: "retrieve"; slotId: string }
  | { type: "restore"; restorationId: string; targetInstanceId: string }
  | { type: "modify"; modificationId: string; targetInstanceId: string }
  | { type: "dismantle"; instanceId: string }
  | { type: "salvage"; instanceId: string }
  | { type: "craft"; recipeId: string }
  | { type: "rig"; instanceId: string }
  | { type: "consult"; instanceId: string }
  | { type: "unlock"; instanceId: string }
  | { type: "catalog-note"; instanceId: string }
  | { type: "ford"; instanceId: string }
  | {
      type: "trade";
      give: { instanceId: string; quantity: number }[];
      take: { instanceId: string; quantity: number }[];
      purse: number;
    }
  | { type: "discard"; instanceId: string; quantity?: number }
  | { type: "releaseQuest"; instanceId: string }
  | { type: "noteDeath"; cause: string }
  | { type: "passEvening" };

export interface StepOk {
  ok: true;
  state: LootState;
  message: string;
}

export interface StepFail {
  ok: false;
  state: LootState;
  error: LootErrorBody;
}

export type StepResult = StepOk | StepFail;
