/**
 * PREINCARNATION item-inheritance save contract.
 *
 * Identity is never one field. These stay distinct on every instance:
 *   definition id, unique instance id, world source, ownership,
 *   player storage, placed/displayed state, restoration history, era identity.
 *
 * Save versions
 *   0 — flat `{ id, name, qty? }[]` inventory. Sibling keys (gold, chapter, …)
 *       are preserved, not dropped.
 *   1 — proto-instances (`instanceId?`, `defId`, `slot?`, `owner?`).
 *   2 — this contract (`contract: "preincarnation.item-inheritance"`).
 *
 * A malformed save throws. It is never coerced into an empty world.
 * Calendar time does not tax condition or quantity. Only authored events do.
 * A return is not a corpse run: carried, stored, and displayed property stays
 * with the player unless a committed transaction or an authored site policy
 * says otherwise. Interrupted transactions abort.
 */

export const SAVE_CONTRACT = "preincarnation.item-inheritance" as const;
export const SAVE_VERSION = 2 as const;
export const PLAYER_ID = "player:ellis" as const;
export const ERA_SPAN_YEARS = 14;
export const PRINCIPAL_ERA_STARTS = [0, 14, 28, 42, 56, 70] as const;

export const RENEWAL_RULES = {
  uniqueOnce:
    "A unique, heirloom, or quest source key is consumed permanently. Death, sale, dismantle, donation, or restoration does not mint it again.",
  heirloomLineage:
    "An heirloom lineage is one instance id. Repair, inheritance, recognition, and historical marking append history. They do not fork a second object.",
  renewableNode:
    "A node: source may yield a new common instance once each calendar era. The yield has a new instance id, an empty story, and no restoration history. It cannot merge into an heirloom or a historically marked object.",
  commonBatch:
    "A common: source is one ordinary batch. It may be stacked, sold, or dismantled. It is not an heirloom, and that key cannot be claimed twice — including after a death.",
  noDeterioration:
    "Years do not change condition, quantity, or ownership. Food, cards, and tools are not aged out. Only an authored restoration, transfer, or consequence writes history.",
  noCorpse:
    "A return does not drop property onto a corpse and does not erase it. Uncommitted sales, donations, and dismantles abort. A vanished building returns player property to storage unless that site's authored policy is a cache.",
} as const;

export type ItemKind =
  | "equipment"
  | "material"
  | "relic"
  | "card"
  | "food"
  | "inherited"
  | "tool"
  | "instrument";

export type RenewalPolicy =
  | "unique-once"
  | "renewable-common"
  | "heirloom-lineage"
  | "quest-once";

export type SourceKind =
  | "authored-spawn"
  | "renewable-node"
  | "craft"
  | "gift"
  | "quest-reward"
  | "inheritance"
  | "cache"
  | "purchase"
  | "found"
  | "legacy-import";

export type OwnerKind = "player" | "npc" | "institution" | "unowned" | "historical";

export type TitleKind =
  | "personal"
  | "stewardship"
  | "donated"
  | "sold"
  | "quest-bound"
  | "abandoned"
  | "historical-record";

export type CustodyLocation = "carried" | "stored" | "displayed" | "none";

export type PlacementKind =
  | "none"
  | "worn"
  | "displayed"
  | "placed-in-world"
  | "installed";

export type SiteStatus = "standing" | "vanished" | "ruined" | "rebuilt";

export type SiteLossPolicy = "recover-to-storage" | "displace-to-cache";

export type Condition =
  | "sound"
  | "worn"
  | "broken"
  | "restored"
  | "relic-status"
  | "historical"
  | "consumed";

export type InstanceStatus = "active" | "closed" | "consumed";

export type StoryArchetype =
  | "donated-tool-successor"
  | "restored-instrument-inherited"
  | "cache-exposed-by-land"
  | "family-object-recognized"
  | "ordinary-becomes-historical";

export type HistoryAction =
  | "note"
  | "restore"
  | "repair"
  | "recognize"
  | "relocate"
  | "transfer"
  | "historical-mark"
  | "consume"
  | "commit"
  | "abort";

export interface ItemDefinition {
  defId: string;
  name: string;
  kind: ItemKind;
  stackable: boolean;
  /** Default policy for ordinary claims of this definition. */
  renewalPolicy: RenewalPolicy;
  /**
   * Source keys that mint an heirloom lineage of an otherwise ordinary def.
   * A node yield of the same def is a different instance and is never historical.
   */
  lineageKeys?: string[];
  canonicalSourceKey?: string;
  dismantleable?: boolean;
  dismantleYield?: { defId: string; qty: number }[];
  renewal?: {
    cadence: "each-era";
    maxPerEra: number;
    family: "common";
    note: string;
  };
}

export interface WorldSource {
  sourceKind: SourceKind;
  sourceKey: string;
  eraBorn: number;
  yearBorn: number;
  renewalPolicy: RenewalPolicy;
  /** True for rows lifted from a pre-v2 save. Not a live gathering node. */
  imported?: boolean;
}

export interface Ownership {
  ownerKind: OwnerKind;
  ownerId: string;
  title: TitleKind;
  sinceYear: number;
}

export interface PlayerStorage {
  location: CustodyLocation;
  containerId: string | null;
}

export interface Placement {
  kind: PlacementKind;
  siteId: string | null;
  siteEra: number | null;
}

export interface RestorationEvent {
  atYear: number;
  byId: string;
  action: HistoryAction;
  note: string;
  conditionBefore: Condition;
  conditionAfter: Condition;
}

export interface EraIdentity {
  /** Calendar era the object's story is anchored to (not the life index). */
  boundEra: number;
  originLife: number;
  recognizedInEras: number[];
  historical: boolean;
}

export interface QuestBinding {
  questId: string;
  state: "bound" | "released";
}

export interface PendingTxn {
  txnId: string;
  kind: "sell" | "donate" | "dismantle" | "quest-handoff";
  startedYear: number;
  counterpartyId: string;
  siteId?: string | null;
  snapshot: {
    ownership: Ownership;
    storage: PlayerStorage;
    placement: Placement;
    status: InstanceStatus;
    condition: Condition;
    questBinding: QuestBinding | null;
  };
}

export interface ItemInstance {
  instanceId: string;
  defId: string;
  qty: number;
  worldSource: WorldSource;
  ownership: Ownership;
  storage: PlayerStorage;
  placement: Placement;
  condition: Condition;
  status: InstanceStatus;
  restoration: RestorationEvent[];
  era: EraIdentity;
  storyId: string | null;
  questBinding: QuestBinding | null;
  pendingTxn: PendingTxn | null;
  /** Unknown fields from older rows, kept so a load cannot strip them. */
  extensions?: Record<string, unknown>;
}

export interface SiteRecord {
  siteId: string;
  name: string;
  status: SiteStatus;
  eraBuilt: number;
  vanishedYear: number | null;
  lossPolicy: SiteLossPolicy;
}

export interface NpcRecord {
  npcId: string;
  name: string;
  lineageId: string;
  generation: number;
  alive: boolean;
  successorId: string | null;
  diedYear: number | null;
}

export interface ConsumedSource {
  sourceKey: string;
  consumedYear: number;
  instanceId: string;
  policy: RenewalPolicy;
}

export interface RenewalLedgerEntry {
  sourceKey: string;
  eraIndex: number;
  lifeIndex: number;
  year: number;
  instanceId: string;
}

export interface LifeRecord {
  lifeIndex: number;
  bornYear: number;
  deathYear: number | null;
  returnYear: number | null;
}

export interface WorldState {
  calendarYear: number;
  life: LifeRecord;
  lives: LifeRecord[];
  nextSerial: number;
  instances: Record<string, ItemInstance>;
  consumedSources: ConsumedSource[];
  renewalLedger: RenewalLedgerEntry[];
  sites: Record<string, SiteRecord>;
  npcs: Record<string, NpcRecord>;
}

export interface ItemSaveV2 {
  version: typeof SAVE_VERSION;
  contract: typeof SAVE_CONTRACT;
  world: WorldState;
  /** Top-level keys that are not part of the item contract. Never discarded. */
  preserved?: Record<string, unknown>;
}

export interface ReturnReport {
  deathYear: number;
  returnYear: number;
  fromLife: number;
  toLife: number;
  eraIndex: number;
  principalEra: boolean;
  corpseRecoveryRequired: false;
  /** Always empty. Property is not deleted on a return. */
  erasedInstanceIds: string[];
  aborted: { instanceId: string; txnId: string; kind: PendingTxn["kind"] }[];
  keptPlayerInstanceIds: string[];
  successionTransfers: { instanceId: string; fromId: string; toId: string }[];
  siteRecoveries: { instanceId: string; siteId: string; policy: SiteLossPolicy }[];
  notes: string[];
}

export interface MigrationReport {
  fromVersion: 0 | 1 | 2;
  toVersion: 2;
  instanceIds: string[];
  notes: string[];
  preservedKeys: string[];
}

export type StoryOp =
  | {
      op: "ensure-npc";
      npcId: string;
      name: string;
      lineageId: string;
      generation: number;
      successorId: string | null;
    }
  | {
      op: "ensure-site";
      siteId: string;
      name: string;
      lossPolicy?: SiteLossPolicy;
    }
  | {
      op: "claim";
      instanceId: string;
      defId: string;
      sourceKey: string;
      sourceKind: SourceKind;
      qty?: number;
      condition?: Condition;
      custody?: CustodyLocation;
      containerId?: string | null;
      siteId?: string | null;
      storyId?: string | null;
    }
  | {
      op: "donate";
      instanceId: string;
      toId: string;
      siteId?: string | null;
    }
  | { op: "npc-dies"; npcId: string }
  | { op: "resolve-succession" }
  | { op: "successor-note"; instanceId: string; byId: string; note: string }
  | { op: "restore"; instanceId: string; byId: string; note: string }
  | {
      op: "inherit";
      instanceId: string;
      heirId: string;
      heirKind?: OwnerKind;
      note: string;
      siteId?: string | null;
    }
  | {
      op: "expose-cache";
      instanceId: string;
      defId: string;
      sourceKey: string;
      siteId: string;
    }
  | {
      op: "claim-again";
      defId: string;
      sourceKey: string;
      sourceKind: SourceKind;
    }
  | { op: "recognize"; instanceId: string; byId: string; note: string }
  | { op: "historical-mark"; instanceId: string; byId: string; note: string }
  | { op: "take-up"; instanceId: string }
  | {
      op: "renewable-claim";
      instanceId: string;
      defId: string;
      sourceKey: string;
      qty?: number;
    };

export interface StoryBeat {
  atYear: number;
  expectDenied?: boolean;
  action: StoryOp;
}

export interface ItemStory {
  storyId: string;
  number: number;
  title: string;
  archetype: StoryArchetype;
  summary: string;
  defId: string;
  instanceId: string;
  sourceKey: string;
  finalOwnerId: string;
  beats: StoryBeat[];
}

export interface StorySimulation {
  story: ItemStory;
  world: WorldState;
  denied: { atYear: number; code: string; message: string }[];
  final: ItemInstance | null;
}

export type PrimaryDisposition =
  | "carried"
  | "stored"
  | "displayed"
  | "donated"
  | "sold"
  | "dismantled"
  | "quest-bound"
  | "in-world"
  | "closed";
