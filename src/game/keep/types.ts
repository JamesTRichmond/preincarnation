/**
 * Inventory-intent types for PREINCARNATION.
 * This module states policy only. It never moves, sells, or destroys stock.
 * Protection comes from explicit metadata, instance directives, category
 * rules, and project lines — never from a guessed future story.
 */

export const CATEGORIES = [
  "food",
  "bait",
  "material",
  "gear",
  "heirloom",
  "gift",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type EraScope = "any" | "current" | "prior";

export type Selector = {
  category?: Category;
  tag?: string;
  itemId?: string;
  discovered?: boolean;
  unique?: boolean;
  namedGift?: boolean;
  era?: EraScope;
};

export type ProtectedMeta = {
  locked: boolean;
  /** Quoted back in every decision. Required when locked. */
  reason: string;
  author: "player" | "gift-record" | "curator";
};

export type Stack = {
  id: string;
  itemId: string;
  name: string;
  category: Category;
  tags: string[];
  quantity: number;
  eraId: string;
  acquiredAt: number;
  /** Shared by pieces of a split. Does not copy instance rules. */
  lineageId?: string;
  unique?: boolean;
  discovered?: boolean;
  gift?: { from: string; name: string } | null;
  protectedMeta?: ProtectedMeta | null;
};

export type InstanceDirective = {
  id: string;
  stackId: string;
  mode: "protect" | "exempt";
  /** Protect up to this many units. Omit to protect the whole stack. */
  quantity?: number;
  reason: string;
  enabled: boolean;
};

export type CategoryRule = {
  id: string;
  name: string;
  enabled: boolean;
  /** Lower rank claims first when two different floors pin stacks. */
  rank: number;
  presetId?: string;
  selector: Selector;
  /** "all" protects every eligible unit. A numeric 0 does not release stock. */
  keep: number | "all";
  grouping: "pool" | "each-item";
};

export type RecipeLine = {
  itemId: string;
  quantity: number;
  substitutes: Array<{ itemId: string; ratio: number }>;
};

export type ProjectStatus = "active" | "paused" | "cancelled";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  /** Lower number claims first. Ties break by id, ascending. */
  priority: number;
  recipeRevision: number;
  previousRevision?: number;
  previousLines?: RecipeLine[];
  lines: RecipeLine[];
  presetId?: string;
};

export type PolicyInput = {
  eraId: string;
  eraIndex: number;
  stacks: Stack[];
  instanceDirectives: InstanceDirective[];
  categoryRules: CategoryRule[];
  projects: Project[];
  offerSurplusForSale: boolean;
  /** If set, the evaluator records a refusal. It still does not dispose. */
  requestedAutoDispose?: boolean;
};

export type ReasonLayer =
  | "metadata"
  | "instance"
  | "category"
  | "project"
  | "surplus"
  | "era";

export type Reason = {
  layer: ReasonLayer;
  code: string;
  text: string;
  ruleId?: string;
  projectId?: string;
  /** Units this reason claims. Notes may be 0 and do not affect totals. */
  qty: number;
};

export type Reservation = {
  projectId: string;
  projectName: string;
  quantity: number;
  via: "primary" | "substitute";
  forItemId: string;
};

export type StackDisposition = {
  stackId: string;
  itemId: string;
  name: string;
  category: Category;
  tags: string[];
  eraId: string;
  unique: boolean;
  discovered: boolean;
  giftName?: string;
  locked: boolean;
  lineageId?: string;
  quantity: number;
  protected: number;
  reserved: number;
  available: number;
  /** Available units listed for a person to review. Never auto-removed. */
  surplus: number;
  /** Surplus proposed to a sale batch. Zero unless offers are enabled. */
  saleOffer: number;
  reservedBy: Reservation[];
  reasons: Reason[];
  matchedRules: Array<{ id: string; name: string }>;
  exempt: boolean;
};

export type BlockNote = {
  layer: "metadata" | "instance" | "category" | "project" | "stock" | "status";
  text: string;
  quantity: number;
  ruleId?: string;
  projectId?: string;
};

export type ProjectLineResult = {
  itemId: string;
  needed: number;
  fromPrimary: number;
  fromSubstitute: Array<{
    itemId: string;
    quantity: number;
    coversPrimary: number;
    ratio: number;
  }>;
  shortfall: number;
  notes: string[];
  blockedBy: BlockNote[];
};

export type ProjectAllocation = {
  projectId: string;
  name: string;
  status: ProjectStatus;
  priority: number;
  claimOrder: number | null;
  recipeRevision: number;
  recipeNote?: string;
  lines: ProjectLineResult[];
};

export type Conflict = {
  kind: "rules" | "projects" | "metadata-vs-exempt" | "disposal";
  text: string;
  ruleIds?: string[];
  projectIds?: string[];
  itemId?: string;
  resolution: string;
};

export type EraEffect = {
  ruleId: string;
  name: string;
  text: string;
  releasedQuantity: number;
};

export type RuleGap = {
  ruleId: string;
  name: string;
  wanted: number;
  eligible: number;
  protected: number;
  text: string;
};

export type SurplusLine = {
  stackId: string;
  itemId: string;
  name: string;
  quantity: number;
  suggested: "review" | "sale-offer";
};

export type Evaluation = {
  eraId: string;
  dispositions: StackDisposition[];
  projects: ProjectAllocation[];
  conflicts: Conflict[];
  eraEffects: EraEffect[];
  ruleGaps: RuleGap[];
  surplusReview: {
    autoDispose: false;
    lines: SurplusLine[];
  };
  totals: {
    quantity: number;
    protected: number;
    reserved: number;
    available: number;
  };
  precedence: readonly string[];
};

export type CatalogItem = {
  sku: string;
  name: string;
  category: Category;
  tags: string[];
};

export type ReferenceAttrs = {
  name?: string;
  category?: string;
  tags?: string[];
  discovered?: boolean;
  unique?: boolean;
  giftFrom?: string;
  giftName?: string;
  lock?: boolean;
  lockReason?: string;
  lockAuthor?: "player" | "gift-record" | "curator";
  lineageId?: string;
};

/** Shape storage can hand us. We do not write it back as a transaction. */
export type ReferenceStack = {
  stackId: string;
  sku: string;
  qty: number;
  eraId?: string;
  acquiredAt?: number;
  attrs?: ReferenceAttrs;
};

export type ReferenceProject = {
  projectId: string;
  name: string;
  status: ProjectStatus;
  priority: number;
  recipeRevision: number;
  previousRevision?: number;
  previousLines?: RecipeLine[];
  lines: RecipeLine[];
  presetId?: string;
};

export type ReferenceRule =
  | {
      id: string;
      enabled?: boolean;
      preset: string;
      params?: { keep?: number; sessions?: number; era?: EraScope };
    }
  | {
      id: string;
      enabled?: boolean;
      name?: string;
      selector: Selector;
      keep: number | "all";
      grouping: "pool" | "each-item";
      rank?: number;
    }
  | {
      id: string;
      enabled?: boolean;
      stackId: string;
      mode: "protect" | "exempt";
      quantity?: number;
      reason: string;
    };

export type ReferenceSnapshot = {
  eraId: string;
  eraIndex: number;
  stacks: ReferenceStack[];
  projects: ReferenceProject[];
  rules: ReferenceRule[];
  offerSurplusForSale?: boolean;
  requestedAutoDispose?: boolean;
};

export type StorageDirectives = {
  eraId: string;
  autoDispose: false;
  stacks: Array<{
    stackId: string;
    sku: string;
    quantity: number;
    protected: number;
    reserved: number;
    available: number;
    surplus: number;
    saleOffer: number;
    reasons: string[];
  }>;
  reservations: Array<{
    projectId: string;
    sku: string;
    quantity: number;
    via: "primary" | "substitute";
    coversSku: string;
  }>;
  shortfalls: Array<{
    projectId: string;
    sku: string;
    shortfall: number;
    notes: string[];
  }>;
  /** Proposals for a sale batch. Not a disposal order. */
  saleOffers: Array<{ stackId: string; sku: string; quantity: number }>;
  conflicts: string[];
  eraEffects: string[];
  warnings: string[];
};

/**
 * Read top to bottom. Each layer may only claim units the layers above
 * left free, except that category floors COUNT units already protected
 * and will not let a project eat the remainder of the floor.
 */
export const PRECEDENCE = [
  "1. Lock metadata on a stack protects its whole quantity. The ledger never writes this itself. An exempt directive cannot erase it.",
  "2. Instance directives name a stack id. Protect and exempt apply only to that id — a split child is a new id and is not covered. If protect and exempt both target the same id, protect wins and the clash is recorded.",
  "3. Category rules then hold a floor. Units already locked or instance-protected count toward it. Rules that share a selector and disagree are both kept on the books; the stricter floor is what stock satisfies, and a keep of zero is never a release.",
  "4. Active projects reserve what is still free, lower priority number first, then id. Paused and cancelled projects reserve nothing. A substitute is used only when that line names it and the primary is short. The current recipe revision is the only one that holds stock.",
  "5. The remainder is available. It can be listed for surplus review and, if you allow it, offered for sale. This module never disposes of it.",
] as const;
