/** Reference-fixture types for the conservation bench. Not a live catalog binding. */

export type StatId =
  | "light"
  | "weather"
  | "quiet"
  | "reach"
  | "hold"
  | "release"
  | "edge"
  | "durability"
  | "weight"
  | "insight";

export const STAT_IDS: StatId[] = [
  "light",
  "weather",
  "quiet",
  "reach",
  "hold",
  "release",
  "edge",
  "durability",
  "weight",
  "insight",
];

/** Weight is easier when lower. Every other stat is better when higher. */
export const STAT_BETTER: Record<StatId, "high" | "low"> = {
  light: "high",
  weather: "high",
  quiet: "high",
  reach: "high",
  hold: "high",
  release: "high",
  edge: "high",
  durability: "high",
  weight: "low",
  insight: "high",
};

export const STAT_LABEL: Record<StatId, string> = {
  light: "Light",
  weather: "Weather",
  quiet: "Quiet",
  reach: "Reach",
  hold: "Hold",
  release: "Release",
  edge: "Edge",
  durability: "Durability",
  weight: "Weight",
  insight: "Insight",
};

export type ItemKind = "material" | "supply" | "part" | "gear" | "tool" | "heirloom" | "quest";

export type OpKind = "inspect" | "restore" | "dismantle" | "combine" | "modify" | "maintain";

export type ConsumeMode = "all" | "wear" | "tool" | "none";

export interface CatalogEntry {
  id: string;
  fixture: true;
  intendedCatalog: string;
  name: string;
  kind: ItemKind;
  /** Recoverable matter. Appraisal equals mass. Never zero. */
  mass: number;
  tags: string[];
  blurb: string;
  /** Losing the last one would trap the bench. */
  critical?: boolean;
  quest?: boolean;
}

export interface InputSpec {
  catalogId: string;
  qty: number;
  consume: ConsumeMode;
  minCondition?: number;
  role: "primary" | "material" | "tool";
}

export interface Substitution {
  forCatalogId: string;
  withCatalogId: string;
  /** Substitute units required per 1 written unit. */
  qtyMultiplier: number;
  /** Shift applied to new-item condition, or to a retained condition gain. */
  qualityDelta: number;
  note: string;
  incompatibleChoices?: string[];
}

export interface OutputSpec {
  catalogId: string;
  qty: number;
  identity: "new" | "retain-primary";
  condition?: number;
  conditionDelta?: number;
}

export interface ModifyChoice {
  id: string;
  name: string;
  summary: string;
  stats: Partial<Record<StatId, number>>;
  /** One sitting per axis. Sibling choices share an axis so they cannot stack. */
  axis: string;
  extraInputs?: InputSpec[];
}

export interface Recipe {
  id: string;
  kind: OpKind;
  name: string;
  summary: string;
  inputs: InputSpec[];
  outputs: OutputSpec[];
  choices?: ModifyChoice[];
  substitutions: Substitution[];
  cost: { minutes: number; focus: number; toolWear: number };
  feedback: { success: string; partial?: string; fail: string };
  failure: { onLowCondition: "refuse" | "partial"; recovery: string };
  /** Appended as history. Heirloom work must set this. */
  historyLine?: string;
  batchable: boolean;
  tags: string[];
}

export interface HistoryEvent {
  cycle: number;
  text: string;
  opId?: string;
}

export interface Provenance {
  origin: "found" | "crafted" | "restored" | "heirloom" | "quest" | "gift";
  bearer?: string;
  cycle: number;
  notes: string[];
  parentInstanceIds: string[];
  /** Stable across restore and modify. Never regenerated. */
  identityKey: string;
}

export interface AppliedMod {
  choiceId: string;
  recipeId: string;
  axis: string;
  stats: Partial<Record<StatId, number>>;
  name: string;
}

export interface ItemInstance {
  instanceId: string;
  catalogId: string;
  qty: number;
  condition: number;
  provenance: Provenance;
  mods: AppliedMod[];
  history: HistoryEvent[];
  favorite: boolean;
  locked: boolean;
}

export interface JournalEntry {
  id: string;
  recipeId: string;
  title: string;
  detail: string;
}

export interface BenchSnapshot {
  items: ItemInstance[];
  focus: number;
  seq: number;
  journal: JournalEntry[];
  label: string;
}

export interface BenchState {
  items: ItemInstance[];
  focus: number;
  focusMax: number;
  cycle: number;
  journal: JournalEntry[];
  undo: BenchSnapshot[];
  favoriteRecipes: string[];
  seq: number;
}

export interface WorkRequest {
  recipeId: string;
  primaryInstanceId?: string;
  /** Written catalog id → substitute catalog id. */
  substitutes?: Record<string, string>;
  choiceId?: string;
  /** Repeat count for one stack. Integers ≥ 1. */
  count?: number;
}

export interface ResolvedInput {
  catalogId: string;
  qty: number;
  consume: ConsumeMode;
  substituted: boolean;
  note?: string;
  instanceId?: string;
}

export interface WorkPreview {
  ok: boolean;
  recipeId: string;
  title: string;
  count: number;
  inputs: ResolvedInput[];
  outputs: { catalogId: string; qty: number; identity: string; name: string }[];
  identityNote: string;
  provenanceNote: string;
  cost: { minutes: number; focus: number; toolWear: number };
  choice?: { id: string; name: string; summary: string };
  feedback: string;
  failures: string[];
  recovery?: string;
  warnings: string[];
}

export interface PerformResult {
  state: BenchState;
  preview: WorkPreview;
  ok: boolean;
}

export function isStackableKind(kind: ItemKind): boolean {
  return kind === "material" || kind === "supply" || kind === "part";
}

export function statIsWorse(stat: StatId, delta: number): boolean {
  if (delta === 0) return false;
  return STAT_BETTER[stat] === "high" ? delta < 0 : delta > 0;
}

export function statIsBetter(stat: StatId, delta: number): boolean {
  if (delta === 0) return false;
  return !statIsWorse(stat, delta);
}
