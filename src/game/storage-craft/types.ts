/**
 * Storage-aware crafting types.
 *
 * These extend the shapes a single existing crafting economy already uses
 * (station, recipe inputs, one output). They do not define a second economy.
 */

export type StationId = "cooking" | "restoration" | "salvage" | "modification";

export type ProvenanceKind = "bulk" | "unique";

/** What an existing recipe is willing to consume. Unique is opt-in. */
export type InputProvenance = "bulk" | "unique";

export interface CatalogItem {
  id: string;
  name: string;
  stackLimit: number;
}

export interface ExistingRecipeInput {
  itemId: string;
  qty: number;
  /** Substitutes already declared by the existing recipe. Never inferred. */
  substitutes?: string[];
  /**
   * Existing recipe opts in to preparing this input from another recipe
   * in the same transaction. The adapter does not invent this flag.
   */
  allowNestedPrep?: boolean;
  /** Default bulk. Unique inputs are the piece itself, not a component inside it. */
  provenance?: InputProvenance;
}

export interface ExistingRecipe {
  id: string;
  station: StationId;
  name: string;
  /** Every recipe in this workspace is a reference fixture. */
  fixture: true;
  fixtureLabel: string;
  inputs: ExistingRecipeInput[];
  output: { itemId: string; qty: number };
  /** Present in reach, never consumed. */
  toolItemId?: string;
  /** Restoration puts the consumed unique instance back, repaired. */
  restoresUniqueInput?: boolean;
}

export type Protection =
  | { kind: "none" }
  | { kind: "favorite" }
  | { kind: "reserved"; reservationId: string }
  | { kind: "quest"; questId: string };

export interface ContainedComponent {
  itemId: string;
  qty: number;
}

export interface ItemProvenance {
  kind: ProvenanceKind;
  /** Set on named pieces. Bulk stacks omit it. */
  displayName?: string;
  /**
   * Ordinary components a unique piece happens to contain.
   * Those components are not available to recipes.
   */
  containedComponents?: ContainedComponent[];
}

export type ItemCondition = "damaged" | "restored";

export interface ItemStack {
  instanceId: string;
  itemId: string;
  qty: number;
  ownerId: string;
  protection: Protection;
  provenance: ItemProvenance;
  condition?: ItemCondition;
}

export type ContainerKind =
  | "carried"
  | "approved"
  | "foreign"
  | "locked"
  | "out-of-range"
  | "unloaded";

export interface Container {
  id: string;
  name: string;
  kind: ContainerKind;
  ownerId: string;
  /** Crafters allowed to draw. Owner (and shared owner) may draw without a grant. */
  accessGrants: string[];
  /** Crafters allowed to deposit outputs. */
  depositGrants: string[];
  available: boolean;
  capacitySlots: number;
  stacks: ItemStack[];
}

export interface World {
  revision: number;
  crafterId: string;
  containers: Container[];
}

export type CraftErrorCode =
  | "UNKNOWN_RECIPE"
  | "WRONG_STATION"
  | "INVALID_QUANTITY"
  | "INSUFFICIENT"
  | "PROTECTED"
  | "PROTECTED_PROVENANCE"
  | "NO_ACCESS"
  | "UNAVAILABLE_CONTAINER"
  | "FULL_OUTPUT"
  | "STALE_QUANTITY"
  | "CANCELLED"
  | "CONCURRENT_PRESS"
  | "INTERRUPTED_SAVE"
  | "CYCLIC_RECIPE"
  | "MISSING_TOOL"
  | "INVALID_SUBSTITUTE"
  | "NO_OUTPUT_DESTINATION";

export interface CraftIssue {
  code: CraftErrorCode;
  message: string;
  itemId?: string;
  containerId?: string;
  instanceId?: string;
}

export type BlockReason =
  | "favorite"
  | "reserved"
  | "quest"
  | "ownership"
  | "heirloom"
  | "unavailable"
  | "no-access"
  | "wrong-provenance";

export interface SourceLine {
  containerId: string;
  containerName: string;
  instanceId: string;
  itemId: string;
  qty: number;
  provenance: ProvenanceKind;
  displayName?: string;
}

export interface BlockedLine {
  containerId: string;
  containerName: string;
  instanceId: string;
  itemId: string;
  qty: number;
  displayName?: string;
  reason: BlockReason;
}

export interface PreviewSlot {
  slotKey: string;
  recipeId: string;
  slotIndex: number;
  depth: number;
  requiredItemId: string;
  chosenItemId: string;
  qtyNeeded: number;
  qtyFromStorage: number;
  qtyFromNested: number;
  shortfall: number;
  sources: SourceLine[];
  blocked: BlockedLine[];
  substitutes: string[];
  nestedRecipeId?: string;
  voided: boolean;
}

export interface Draw {
  slotKey: string;
  containerId: string;
  instanceId: string;
  itemId: string;
  qty: number;
  ownerId: string;
  provenance: ProvenanceKind;
}

export interface BulkDeposit {
  kind: "bulk";
  containerId: string;
  itemId: string;
  qty: number;
  ownerId: string;
}

export interface RestoreDeposit {
  kind: "restore";
  containerId: string;
  stack: ItemStack;
}

export type Deposit = BulkDeposit | RestoreDeposit;

export interface SlotChoice {
  recipeId: string;
  slotIndex: number;
  itemId: string;
  preferInstanceIds?: string[];
}

export interface CraftRequest {
  crafterId: string;
  recipeId: string;
  quantity: number;
  /**
   * Containers the player actually opened. Empty means the belt only.
   * Approved chests are never scanned unless listed here.
   */
  candidateContainerIds?: string[];
  outputContainerId?: string;
  station?: StationId;
  choices?: SlotChoice[];
  /** When true, recipe inputs that opt in may be prepared inline. */
  nested?: boolean;
  /** Preview fingerprint. Mismatch rejects without replanning. */
  expectedToken?: string;
  expectedRevision?: number;
  idempotencyKey?: string;
}

export interface CraftPreview {
  ok: boolean;
  recipeId: string;
  recipeName: string;
  station: StationId | null;
  quantity: number;
  fixture: boolean;
  fixtureLabel: string | null;
  slots: PreviewSlot[];
  draws: Draw[];
  deposits: Deposit[];
  output: {
    itemId: string | null;
    qty: number;
    containerId: string | null;
    containerName: string | null;
  };
  errors: CraftIssue[];
  stalenessToken: string;
  nestedRecipeIds: string[];
}

export interface CraftReceipt {
  id: string;
  recipeId: string;
  quantity: number;
  revision: number;
  draws: Draw[];
  deposits: Deposit[];
  outputContainerId: string | null;
}

export interface CraftCommit {
  ok: boolean;
  replayed: boolean;
  world: World;
  preview: CraftPreview;
  error: CraftIssue | null;
  receipt: CraftReceipt | null;
}

export interface SaveSignal {
  readonly cancelled: boolean;
}

export interface SavePort {
  /**
   * Publish `next` atomically. Throwing means the previous snapshot
   * is still the published one.
   */
  persist(next: World, signal: SaveSignal): void;
}
