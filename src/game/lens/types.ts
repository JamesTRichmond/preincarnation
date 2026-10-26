/**
 * Ground-loot presentation types for PREINCARNATION.
 * Filtering never removes an object and never approves pickup, sale, or salvage.
 * Storage routing is intentionally not modeled here.
 */

export const FILTER_FORMAT = "preincarnation.loot-filter" as const;
export const FILTER_VERSION = 1 as const;
export const FILTER_STORAGE_KEY = "preincarnation.ground-lens.v1" as const;

export const KNOWN_CATEGORIES = [
  "weapon",
  "ward",
  "provision",
  "material",
  "relic",
  "tool",
  "writing",
  "currency",
  "curiosity",
] as const;

export const KNOWN_USES = ["unidentified", "known", "no-current-use"] as const;
export const COLLECTION_STATUSES = ["undiscovered", "seen", "partial", "complete"] as const;
export const MASTERY_COMPAT = ["fits", "unrelated", "conflicts"] as const;
export const OWNERSHIPS = ["unowned", "player", "party", "world", "quest-bound"] as const;
export const FILTER_ACTIONS = ["emphasize", "show", "collapse", "reduce", "hide"] as const;
export const PROJECT_RELATIONS = ["current", "not-current", "untagged"] as const;

export type KnownCategory = (typeof KNOWN_CATEGORIES)[number];
export type KnownUse = (typeof KNOWN_USES)[number];
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];
export type MasteryCompatibility = (typeof MASTERY_COMPAT)[number];
export type Ownership = (typeof OWNERSHIPS)[number];
export type FilterAction = (typeof FILTER_ACTIONS)[number];
export type ProjectRelation = (typeof PROJECT_RELATIONS)[number];

export type CategoryCondition =
  | { kind: "known" }
  | { kind: "unknown" }
  | { kind: "in"; values: string[] }
  | { kind: "notIn"; values: string[] };

export interface QuantityCondition {
  min?: number;
  max?: number;
}

/** Ordered rule. Conditions that are present are combined with AND. */
export interface FilterRule {
  id: string;
  name: string;
  enabled: boolean;
  action: FilterAction;
  note?: string;
  category?: CategoryCondition;
  knownUse?: KnownUse[];
  projectRelation?: ProjectRelation;
  collectionStatus?: CollectionStatus[];
  mastery?: MasteryCompatibility[];
  ownership?: Ownership[];
  quantity?: QuantityCondition;
}

export interface FilterDocument {
  format: typeof FILTER_FORMAT;
  version: typeof FILTER_VERSION;
  id: string;
  name: string;
  showEverything: boolean;
  rules: FilterRule[];
}

/**
 * One ground object as the presentation layer sees it.
 * `source` is the reference fixture until world spawn is bound.
 */
export interface GroundItem {
  id: string;
  name: string;
  category: string;
  knownUse: KnownUse;
  projectTags: readonly string[];
  collectionStatus: CollectionStatus;
  mastery: MasteryCompatibility;
  quantity: number;
  ownership: Ownership;
  essentialQuest: boolean;
  firstDiscovery: boolean;
  protected: boolean;
  stackKey: string;
  source: string;
  /** Fixture flavor. The engine does not read this field. */
  detail: string;
}

/** Player context the filter is allowed to read. Mastery result is already on each item. */
export interface FilterContext {
  currentProject: string | null;
  currentProjectLabel: string;
}

export type PreservationCause =
  | "essential quest item"
  | "explicitly protected item"
  | "first-time discovery";

export interface ActionCue {
  action: FilterAction;
  short: string;
  label: string;
  shape: "diamond" | "square" | "layers" | "dashed-circle" | "minus";
  pattern: "double" | "solid" | "stacked" | "dashed" | "withdrawn";
  summary: string;
  reliesOnColor: false;
}

export interface ShadowedRule {
  id: string;
  name: string;
  action: FilterAction;
  priority: number;
}

export interface DeferredHide {
  id: string;
  name: string;
  why: string;
}

export interface FilterDecision {
  itemId: string;
  action: FilterAction;
  matchedRuleId: string | null;
  matchedRuleName: string | null;
  priority: number | null;
  shadowed: readonly ShadowedRule[];
  reason: string;
  howToChange: string;
  preserved: boolean;
  preservationCauses: readonly PreservationCause[];
  preservationApplied: boolean;
  showEverything: boolean;
  deferredHides: readonly DeferredHide[];
  effect: "presentation";
  authorizes: {
    pickup: false;
    sale: false;
    salvage: false;
    destroy: false;
  };
  cue: ActionCue;
}

export interface PresentedSingle {
  kind: "single";
  key: string;
  items: readonly [GroundItem];
  decision: FilterDecision;
}

export interface PresentedStack {
  kind: "collapsed";
  key: string;
  items: readonly GroundItem[];
  decisions: readonly FilterDecision[];
  decision: FilterDecision;
  label: string;
  pileCount: number;
  quantityTotal: number;
}

export type PresentedEntry = PresentedSingle | PresentedStack;

export interface RuleProblem {
  id: string;
  name: string;
  problem: string;
}

export interface FilterResult {
  decisions: FilterDecision[];
  ground: PresentedEntry[];
  hidden: PresentedEntry[];
  ruleProblems: RuleProblem[];
  /** Same objects, same order, as the input. Nothing is dropped. */
  retained: readonly GroundItem[];
}

export interface RuntimeBinding {
  id: string;
  label: string;
  status: "unbound" | "refused";
  detail: string;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type ImportResult =
  | { ok: true; document: FilterDocument; warnings: RuleProblem[] }
  | { ok: false; errors: string[] };
