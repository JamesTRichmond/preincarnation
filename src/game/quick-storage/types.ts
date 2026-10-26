/** Reference storage contracts for PREINCARNATION quick deposit.
 *  The live inventory is not bound in this workspace. See missing-bindings.ts.
 */

export type ContainerKind = "physical" | "shared-material" | "pack";

export type ItemKind = "stack" | "unique";

export interface ItemMeta {
  [key: string]: string | number | boolean | null;
}

/** A stack lot or a unique instance. Unique lots are never merged or split. */
export interface ItemLot {
  id: string;
  definitionId: string;
  name: string;
  kind: ItemKind;
  quantity: number;
  maxStack: number;
  ownerId: string;
  favorite: boolean;
  equipped: boolean;
  tags: string[];
  meta: ItemMeta;
}

export interface ContainerAccess {
  nearby: boolean;
  visited: boolean;
  owned: boolean;
  /** Established shared-material membership. Ignored for physical containers. */
  sharedEstablished: boolean;
  deleted: boolean;
}

export interface StorageContainer {
  id: string;
  name: string;
  kind: ContainerKind;
  access: ContainerAccess;
  slotCapacity: number;
  /** Empty slots automation must not fill. Manual placement may use them. */
  reservedSlots: number;
  note: string;
  lots: ItemLot[];
}

export interface StorageCategory {
  id: string;
  name: string;
  definitionIds: string[];
  tags: string[];
}

export interface RoutingRule {
  id: string;
  name: string;
  /** Lower order runs first. Ties break by id. */
  order: number;
  enabled: boolean;
  /** Required unless matchAny is set. A missing category matches nothing. */
  categoryId: string | null;
  matchAny: boolean;
  /** Tried in listed order. Later rules run only if these cannot take the goods. */
  destinationIds: string[];
  excludeDestinationIds: string[];
  /** Quick-stack: only containers that already hold this definition. */
  onlyWherePresent: boolean;
}

export interface DestinationExclusion {
  id: string;
  destinationId: string;
  definitionId?: string;
  tag?: string;
}

export interface PackReserve {
  definitionId: string;
  keepInPack: number;
}

export interface StorageProfile {
  categories: StorageCategory[];
  rules: RoutingRule[];
  exclusions: DestinationExclusion[];
  reserves: PackReserve[];
}

export interface StorageWorld {
  actorId: string;
  packId: string;
  containers: StorageContainer[];
  profile: StorageProfile;
  /** Deposit request ids already committed. A repeat does not move goods again. */
  appliedRequestIds: string[];
  /** Monotonic source for split-stack ids. */
  nextLotSeq: number;
}

export type StayReason =
  | "favorite"
  | "equipped"
  | "reserved-supply"
  | "no-matching-rule"
  | "destination-full"
  | "no-automation-slot"
  | "destination-excluded"
  | "destination-deleted"
  | "destination-missing"
  | "not-visited"
  | "not-owned"
  | "not-nearby"
  | "shared-not-established"
  | "interrupted";

export interface MoveLine {
  type: "moved";
  text: string;
  sourceLotId: string;
  destLotId: string;
  definitionId: string;
  name: string;
  quantity: number;
  fromId: string;
  toId: string;
  toName: string;
  ruleId: string | null;
  ruleName: string | null;
  split: boolean;
}

export interface StayLine {
  type: "stayed";
  text: string;
  lotId: string;
  definitionId: string;
  name: string;
  quantity: number;
  reason: StayReason;
}

export interface DepositReceipt {
  requestId: string;
  repeated: boolean;
  interrupted: boolean;
  lines: Array<MoveLine | StayLine>;
  movedQuantity: number;
  stayedQuantity: number;
  quantityBefore: number;
  quantityAfter: number;
  ownershipUnchanged: boolean;
}

export interface DepositRequest {
  requestId: string;
  /** Stop before this many committed placements. Omit to finish. */
  interruptAfterMoves?: number | null;
  /**
   * Test and session hook. Runs on the working copy immediately before a
   * placement is committed. May mark a container deleted.
   */
  beforeMove?: (
    world: StorageWorld,
    info: { destinationId: string; definitionId: string; moveIndex: number },
  ) => void;
}

export interface ManualPlaceRequest {
  lotId: string;
  quantity: number;
  fromId: string;
  toId: string;
}

export interface ManualResult {
  ok: boolean;
  world: StorageWorld;
  detail: string;
}

export interface SaveEnvelope {
  schema: 1;
  world: StorageWorld;
}
