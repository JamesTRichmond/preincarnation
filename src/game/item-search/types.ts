/** Local types for the unified inventory search. No network calls. */

export type LocaleCode = "en" | "fr";

export type RecordKind = "owned" | "recipe" | "journal" | "fixture";

export type Custody = "carried" | "stored" | "displayed" | "equipped" | "reserved";

export type Exposure = "open" | "indoor";

export type Slot = "hand" | "y" | "passive" | "stack" | "memory";

export type ActionId =
  | "equip"
  | "unequip"
  | "carry"
  | "store"
  | "display"
  | "reserve"
  | "release"
  | "read"
  | "inspect";

export type SortKey = "relevance" | "name" | "location" | "quantity" | "project";

export type FixtureMode = "hide" | "only" | "include";

export type Filters = {
  custody: Custody | "any";
  kind: RecordKind | "any";
  equipped: "any" | "yes" | "no";
  reserved: "any" | "yes" | "no";
  access: "any" | "open" | "barred";
  fixtures: FixtureMode;
  project: string | "any";
};

export type Place = {
  placeId: string;
  /** Exact place Ellis can already name. Never a secret coordinate. */
  label: string;
  container: string;
  accessible: boolean;
};

export type WorldInstance = {
  instanceId: string;
  catalogId: string;
  name: string;
  renamedFrom?: string;
  quantity: number;
  kind: RecordKind;
  custody: Custody | null;
  equipped: boolean;
  reservedFor: string | null;
  location: Place;
  exposure: Exposure;
  /** Returned to the hand after a death, instead of left where it fell. */
  bonded?: boolean;
  /** Survives fourteen open winters. Mundane steel does not. */
  magic?: boolean;
  /** Wakes with you. The short iron is the one the game already keeps. */
  persists?: boolean;
  /** Extra parts on this instance (an affix, a replaced haft). */
  components?: string[];
  /** Extra effect tags on this instance. */
  effects?: string[];
  effectNote?: string;
  confirmedYear: number;
  synthetic?: boolean;
  /** Dropped even if a caller stuffed it into the owned list. */
  discovered?: boolean;
  notes?: string;
};

/** Loot Ellis has not found. The adapter must never index it. */
export type HiddenLoot = {
  secretId: string;
  catalogId: string;
  name: string;
  placeHint: string;
  discovered: false;
};

export type KnownWorld = {
  revision: number;
  year: number;
  /** Winters since the life this snapshot woke from. 14 on a death-return. */
  yearsAway: number;
  locale: LocaleCode;
  cycle: number;
  bearer: string;
  instances: WorldInstance[];
  undiscovered: HiddenLoot[];
};

export type CatalogEntry = {
  id: string;
  canonicalName: string;
  names: Partial<Record<LocaleCode, string>> & { en: string };
  kind: RecordKind;
  slot: Slot;
  components: string[];
  effects: string[];
  effectText: string;
  tools: string[];
  provenance: string;
  projects: { id: string; name: string; relevance: string }[];
  stackable: boolean;
  /** True only for definitions taken from the game's authored lists. */
  authored: boolean;
};

export type Project = { id: string; name: string };

export type LedgerRecord = {
  instanceId: string;
  catalogId: string;
  synthetic: boolean;
  kind: RecordKind;
  slot: Slot;
  name: string;
  canonicalName: string;
  renamedFrom?: string;
  localeNames: Partial<Record<LocaleCode, string>>;
  quantity: number;
  components: string[];
  effects: string[];
  effectText: string;
  tools: string[];
  provenance: string;
  locationLabel: string;
  container: string;
  placeId: string;
  accessible: boolean;
  custody: Custody | null;
  equipped: boolean;
  reservedFor: string | null;
  reservedLabel: string | null;
  projects: { id: string; name: string; relevance: string }[];
  yearConfirmed: number;
  notes?: string;
  tokens: string[];
};

export type SearchHit = {
  record: LedgerRecord;
  score: number;
  locationIsCurrent: boolean;
  matched: string[];
};

export type StaleClaim = {
  instanceId: string;
  name: string;
  claimedLocation: string;
  matched: string[];
};

export type SearchResponse = {
  stale: boolean;
  staleReason?: string;
  tookMs: number;
  total: number;
  hits: SearchHit[];
  /** Old index locations. Never presented as where the thing is now. */
  staleClaims: StaleClaim[];
};

export type SavedSearch = {
  id: string;
  name: string;
  query: string;
  filters: Filters;
  sort: SortKey;
};

export type ViewState = {
  query: string;
  filters: Filters;
  sort: SortKey;
  selectedId: string | null;
  scrollTop: number;
  saved: SavedSearch[];
};

export type Action = {
  id: ActionId;
  label: string;
  enabled: boolean;
  reason?: string;
};

export const DEFAULT_FILTERS: Filters = {
  custody: "any",
  kind: "any",
  equipped: "any",
  reserved: "any",
  access: "any",
  fixtures: "hide",
  project: "any",
};

export const DEFAULT_VIEW: ViewState = {
  query: "",
  filters: DEFAULT_FILTERS,
  sort: "relevance",
  selectedId: null,
  scrollTop: 0,
  saved: [],
};
