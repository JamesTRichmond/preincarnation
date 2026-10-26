/** Campaign fiction for PREINCARNATION. Not a record of Addison County history. */

export const PACK_ID = "grok-70-buried-history";

export const FICTION_NOTE =
  "Campaign fiction. Addison County is only the setting. The Marble Vein, Glass Ferry, Wick Quarry, Marrow Notch, and these finds are not county history.";

export const ERAS = ["pre-absence", "the-fourteen", "return"] as const;

export type EraId = (typeof ERAS)[number];

export type SiteKind =
  | "workshop"
  | "household"
  | "vanished-crossing"
  | "former-orchard"
  | "quarry";

export type Binding = "excavate" | "recover";

export type InteractionKind = "practical" | "supernatural";

export type ResponseKind = "character" | "institution";

export type UseRule =
  | "idempotent"
  | "lineage-toggle"
  | "matches-3"
  | "bell-once"
  | "per-era"
  | "ease-dent"
  | "ephemeral-mark"
  | "initial-persist";

export interface HistoryObject {
  id: string;
  name: string;
  siteKind: SiteKind;
  site: string;
  binding: Binding;
  discovery: {
    author: string;
    finder: string;
    circumstance: string;
    authored: string;
  };
  physical: {
    material: string;
    dimensions: string;
    mass: string;
    condition: string;
    marks: string;
  };
  evidence: {
    evidenceId: string;
    howRead: string;
    readable: string;
  };
  interaction: {
    kind: InteractionKind;
    verb: string;
    needsRestore: boolean;
    outcomeKey: string;
    useRule: UseRule;
    outcome: string;
    /** Shown after a successful restore when the use reads differently. */
    outcomeIfRestored?: string;
  };
  restoration: null | {
    applies: boolean;
    method: string;
    result: string;
  };
  /** Prior physical state copied into the register before a use may change it. */
  priorPhysical?: string;
  response: {
    who: string;
    kind: ResponseKind;
    text: string;
  };
  persistence: {
    eras: readonly EraId[];
    holds: string;
    shift: string;
    presentation: Record<EraId, string>;
  };
}

export interface DiscoveryScene {
  id: string;
  index: number;
  title: string;
  place: string;
  siteKind: SiteKind;
  prose: string;
  objectIds: readonly string[];
}

export interface ObjRuntime {
  id: string;
  phase: "in-situ" | "in-hand";
  inspected: boolean;
  registered: boolean;
  restored: boolean;
  usedCount: number;
  lineage: "pell" | "voss" | null;
  matchesLeft: number | null;
  bellUsed: boolean;
  dentEased: boolean;
  initialed: boolean;
  usedEras: EraId[];
  ephemeralMark: string | null;
  lastDetail: string;
}

export interface EvidenceRecord {
  evidenceId: string;
  objectId: string;
  readable: string;
  registeredOnEra: EraId;
  snapshotOf: "inscription" | "prior-physical";
  locked: true;
}

export interface LogEntry {
  at: number;
  action: string;
  objectId: string | null;
  ok: boolean;
  code: string;
  detail: string;
}

export interface PackState {
  era: EraId;
  objects: Record<string, ObjRuntime>;
  /** Append-only. No handler removes or rewrites a record. */
  evidence: EvidenceRecord[];
  log: LogEntry[];
  seq: number;
}

export type PackAction =
  | { action: Binding; id: string }
  | { action: "inspect" | "register" | "restore" | "use"; id: string }
  | { action: "destroy" | "discard" | "burn" | "wipe"; id: string }
  | { action: "eraseWorkingMark"; id: string }
  | { action: "setEra"; era: EraId; id?: string };

export interface ActionResult {
  ok: boolean;
  code: string;
  detail: string;
}
