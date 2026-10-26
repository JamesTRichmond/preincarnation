/** Shared types for the batch-action safety layer. */

export const SCHEMA = 1 as const;

export type Locale = "en" | "fr";

export type ActionKind = "move" | "sell" | "dismantle" | "donate" | "discard" | "restore";

export type ExtendedAction = ActionKind | "buyback";

export type ItemKind = "stack" | "named" | "gear" | "reservation" | "evidence";

export type Category =
  | "materials"
  | "named"
  | "gear"
  | "provisions"
  | "evidence"
  | "reservations";

export type ContainerId =
  | "pack"
  | "stash"
  | "equipped"
  | "project-lantern"
  | "quest-satchel"
  | "vendor"
  | "void";

export type EquipSlot = "body" | "tool";

export type UndoPolicy = "reversible-if-clean" | "buyback-only" | "never";

export interface ProvenanceEvent {
  at: number;
  kind: string;
  detailKey: string;
  params: Record<string, string | number>;
}

export interface Provenance {
  originKey: string;
  originParams: Record<string, string | number>;
  serial: string | null;
  chain: ProvenanceEvent[];
}

export interface Instance {
  id: string;
  defId: string;
  quantity: number;
  containerId: ContainerId | null;
  equipSlot: EquipSlot | null;
  provenance: Provenance;
  reservationId: string | null;
  questId: string | null;
  parentId: string | null;
  lotJournalId: string | null;
  archived: boolean;
}

export interface Seal {
  id: string;
  journalId: string;
  chapterKey: string;
  instanceIds: string[];
  reputation: number;
}

export interface JournalLine {
  instanceId: string;
  defId: string;
  serial: string | null;
  quantity: number;
  from: ContainerId | null;
  to: ContainerId | null;
  equipSlotBefore: EquipSlot | null;
  equipSlotAfter: EquipSlot | null;
  created: boolean;
  parentId: string | null;
}

export interface OutputGrant {
  instanceId: string;
  defId: string;
  quantity: number;
  containerId: ContainerId;
}

export interface Fingerprint {
  role: "placed" | "output" | "archived-source";
  instanceId: string;
  containerId: ContainerId | null;
  quantity: number;
  archived: boolean;
  equipSlot: EquipSlot | null;
  serial: string | null;
  provenanceLength: number;
}

/** How to put mass back without creating a new identity. */
export interface Restoration {
  instanceId: string;
  addQuantity: number;
  unarchive: boolean;
  containerId: ContainerId | null;
  equipSlot: EquipSlot | null;
}

export interface JournalEntry {
  id: string;
  tick: number;
  action: ExtendedAction;
  token: string;
  reversalOf: string | null;
  buybackOf: string | null;
  revisionBefore: number;
  revisionAfter: number;
  lines: JournalLine[];
  outputs: OutputGrant[];
  currencyDelta: { gold: number; reputation: number };
  sealId: string | null;
  summaryKey: string;
  summaryParams: Record<string, string | number>;
  undoPolicy: UndoPolicy;
  fingerprints: Fingerprint[];
  restorations: Restoration[];
  reversedBy: string | null;
}

export interface Note {
  tick: number;
  key: string;
  params: Record<string, string | number>;
}

export type RejectReason =
  | "empty-selection"
  | "duplicate-line"
  | "unknown-instance"
  | "quantity-invalid"
  | "quantity-not-partial"
  | "insufficient-quantity"
  | "excluded"
  | "inventory-changed"
  | "wrong-destination"
  | "destination-full"
  | "slot-taken"
  | "phrase-mismatch"
  | "hold-too-short"
  | "wrong-action"
  | "shared-confirm-rejected"
  | "cancel-is-never-confirm"
  | "already-in-flight"
  | "missing-confirm"
  | "token-required"
  | "no-such-entry"
  | "not-buyback"
  | "buyback-unavailable";

export type UndoReason =
  | "available"
  | "sell-requires-buyback"
  | "buyback-available"
  | "buyback-currency-short"
  | "buyback-vendor-released"
  | "external-seal"
  | "outputs-consumed"
  | "outputs-moved"
  | "dependency-changed"
  | "void-released"
  | "destination-diverged"
  | "origin-full"
  | "slot-taken"
  | "already-reversed"
  | "identity-mismatch"
  | "no-such-entry"
  | "action-not-reversible";

export type ExclusionCode =
  | "equipped"
  | "reserved"
  | "evidence"
  | "vendor-held"
  | "archived"
  | "not-in-hold"
  | "no-recipe"
  | "immovable"
  | "wrong-container"
  | "zero-quantity";

export interface Receipt {
  status: "applied" | "duplicate" | "rejected" | "pending" | "aborted";
  token: string;
  action: ExtendedAction | null;
  journalId: string | null;
  reason: RejectReason | UndoReason | null;
  summaryKey: string;
  summaryParams: Record<string, string | number>;
}

export type ConfirmInput =
  | { channel: "key"; chord: string; holdMs?: number }
  | { channel: "controller"; button: string; holdMs?: number }
  | { channel: "touch"; gesture: string; holdMs?: number }
  | { channel: "pointer"; controlId: string; holdMs?: number };

export interface LineRequest {
  instanceId: string;
  quantity: number;
}

export interface ActionRequest {
  action: ActionKind;
  lines: LineRequest[];
  destinationId?: ContainerId;
  token: string;
  locale: Locale;
  expectedRevision: number;
  phrase?: string;
  confirm?: ConfirmInput;
}

export interface BuybackRequest {
  journalId: string;
  token: string;
  locale: Locale;
  expectedRevision: number;
  confirm?: ConfirmInput;
}

export interface UndoRequest {
  journalId: string;
  token: string;
  locale: Locale;
}

export interface World {
  schema: typeof SCHEMA;
  revision: number;
  tick: number;
  nextId: number;
  instances: Record<string, Instance>;
  currency: { gold: number; reputation: number };
  seals: Seal[];
  journal: JournalEntry[];
  receipts: Record<string, Receipt>;
  inflight: Record<string, { request: ActionRequest | BuybackRequest; kind: "action" | "buyback" }>;
  capacity: Record<ContainerId, number>;
  notes: Note[];
}

export interface Exclusion {
  instanceId: string;
  code: ExclusionCode;
  defId: string;
}

export interface PreviewLine {
  instanceId: string;
  defId: string;
  serial: string | null;
  quantity: number;
  from: ContainerId | null;
  to: ContainerId | null;
  originKey: string;
}

export interface PreviewOutput {
  defId: string;
  quantity: number;
}

export interface Preview {
  ok: boolean;
  action: ActionKind;
  lines: PreviewLine[];
  exclusions: Exclusion[];
  outputs: PreviewOutput[];
  currencyDelta: { gold: number; reputation: number };
  undoPolicy: UndoPolicy;
  outlookKey: string;
  summaryKey: string;
  summaryParams: Record<string, string | number>;
  errors: Array<RejectReason | ExclusionCode>;
  revision: number;
  destinationId: ContainerId | null;
}

export interface UndoVerdict {
  available: boolean;
  reason: UndoReason;
  detailKey: string;
  params: Record<string, string | number>;
  buyback?: UndoVerdict;
}

export interface Execution {
  world: World;
  receipt: Receipt;
  verdict?: UndoVerdict;
}
