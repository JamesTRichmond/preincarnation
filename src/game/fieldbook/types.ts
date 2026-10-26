/** Ports the inventory and crafting sessions own. This module never stores a second bag. */

export type Provenance = "catalog" | "fixture";

export type ProjectKind = "recipe" | "restoration" | "cooking" | "equipment";

export type SourceKind = "vendor" | "gather" | "body" | "gift" | "salvage";

export type Visibility = "carried" | "visible" | "stored";

export type ComponentDef = {
  id: string;
  name: string;
  singular: string;
  plural: string;
  provenance: Provenance;
  /** Magic or soulbound stock stays through a death. Heirlooms are objects, not this flag. */
  persistsOnDeath: boolean;
};

export type YieldLine = {
  componentId: string;
  quantity: number;
};

export type Substitute = {
  componentId: string;
  quantity: number;
};

export type Requirement = {
  componentId: string;
  quantity: number;
  substitutes?: Substitute[];
};

export type ProjectDef = {
  id: string;
  name: string;
  kind: ProjectKind;
  requirements: Requirement[];
  provenance: Provenance;
  /** Set when the project restores a relic from src/game/items.ts. */
  relicId?: string;
  note: string;
};

export type ObjectDef = {
  id: string;
  name: string;
  contains: YieldLine[];
  unique: boolean;
  protected: boolean;
  provenance: Provenance;
  relicId?: string;
  /** Where a catalog name was copied from, when it is not a relic id. */
  catalogNote?: string;
};

export type SourceDef = {
  id: string;
  componentId: string;
  label: string;
  kind: SourceKind;
  discovered: boolean;
};

export type HiddenCache = {
  id: string;
  label: string;
  discovered: false;
  contains: YieldLine[];
};

export type RelicSnapshot = {
  id: string;
  name: string;
  desc: string;
};

export type Catalog = {
  integrationNote: string;
  relics: RelicSnapshot[];
  components: ComponentDef[];
  objects: ObjectDef[];
  projects: ProjectDef[];
  sources: SourceDef[];
  hiddenCaches: HiddenCache[];
};

export type LooseStack = {
  componentId: string;
  quantity: number;
};

export type ObjectInstance = {
  instanceId: string;
  objectId: string;
  visibility: Visibility;
  locationLabel: string;
};

/** Read model from the host inventory. Contained components are not loose stock. */
export type InventorySnapshot = {
  loose: LooseStack[];
  objects: ObjectInstance[];
};

export type LineProgress = {
  componentId: string;
  consumed: number;
  reserved: number;
};

export type ProjectTrack = {
  projectId: string;
  tagged: boolean;
  /** Lower claims shared stock first. */
  priority: number;
  status: "active" | "cancelled";
  progress: Record<string, LineProgress>;
  requirementsOverride?: Requirement[];
};

export type LedgerState = {
  version: 1;
  integration: "fixture-pending" | "live";
  projects: ProjectTrack[];
  materialTags: Record<string, boolean>;
  /** Quantity the player wants left untouched after reservations and crafting. */
  desiredReserve: Record<string, number>;
};

export type TrackingContext = {
  ledger: LedgerState;
  inventory: InventorySnapshot;
  runtimeSources: SourceDef[];
};

export type InventoryDelta =
  | { op: "add-loose"; componentId: string; quantity: number; reason: string }
  | { op: "remove-loose"; componentId: string; quantity: number; reason: string }
  | { op: "remove-object"; instanceId: string; reason: string };

export type Action =
  | { type: "tag-project"; projectId: string; tagged: boolean }
  | { type: "tag-material"; componentId: string; tagged: boolean }
  | { type: "set-desire"; componentId: string; quantity: number }
  | { type: "set-reservation"; projectId: string; componentId: string; quantity: number }
  | { type: "craft-partial"; projectId: string; componentId: string; quantity: number; eatReserve?: boolean }
  | { type: "finish-covered"; projectId: string }
  | { type: "cancel-project"; projectId: string }
  | { type: "donate"; componentId: string; quantity: number; from: string }
  | { type: "death"; place: string }
  | { type: "salvage"; instanceId: string }
  | { type: "change-recipe"; projectId: string; requirements: Requirement[] };

export type DispatchResult = {
  ctx: TrackingContext;
  deltas: InventoryDelta[];
  messages: string[];
  refusal?: string;
};

export type GoalStatus = "cancelled" | "fulfilled" | "open";

export type AllocationLine = {
  projectId: string;
  projectName: string;
  requirementIndex: number;
  componentId: string;
  required: number;
  consumed: number;
  reserved: number;
  remaining: number;
  coveredByPool: number;
  short: number;
  viaSubstitute: boolean;
  tagged: boolean;
};

export type NeededBy = {
  projectId: string;
  projectName: string;
  kind: ProjectKind;
  tagged: boolean;
  status: GoalStatus;
  required: number;
  consumed: number;
  reserved: number;
  remaining: number;
  covered: number;
  short: number;
  role: "chosen" | "substitute" | "primary-not-chosen";
  provenance: Provenance;
};

export type ContainedIn = {
  instanceId: string;
  objectId: string;
  objectName: string;
  quantity: number;
  protected: boolean;
  unique: boolean;
  visibility: Visibility;
  locationLabel: string;
  provenance: Provenance;
};

export type ComponentView = {
  id: string;
  name: string;
  singular: string;
  plural: string;
  provenance: Provenance;
  owned: number;
  reserved: number;
  desiredReserve: number;
  safelyAvailable: number;
  tagged: boolean;
  contained: ContainedIn[];
  knownSources: { id: string; label: string; kind: SourceKind }[];
  neededBy: NeededBy[];
};

export type ProjectView = {
  id: string;
  name: string;
  kind: ProjectKind;
  provenance: Provenance;
  relicId?: string;
  relicName?: string;
  note: string;
  tagged: boolean;
  priority: number;
  status: GoalStatus;
  lines: AllocationLine[];
};

export type Analysis = {
  integration: LedgerState["integration"];
  integrationNote: string;
  components: ComponentView[];
  projects: ProjectView[];
  lines: AllocationLine[];
  visibleObjects: {
    instanceId: string;
    name: string;
    visibility: Visibility;
    locationLabel: string;
    protected: boolean;
    unique: boolean;
    provenance: Provenance;
  }[];
};

export type Inspection = {
  shown: boolean;
  instanceId?: string;
  title?: string;
  sentences: string[];
  protected: boolean;
};
