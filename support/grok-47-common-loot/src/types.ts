/** Ordinary-object records for PREINCARNATION. IDs loot.common.001–240 only. */

export const PLACES = [
  "workshop",
  "kitchen",
  "farm",
  "school",
  "boat",
  "quarry",
  "inn",
  "orchard",
  "abandoned",
] as const;
export type Place = (typeof PLACES)[number];

export const STACKS = ["unique", "batch", "pair", "counted"] as const;
export type StackBehavior = (typeof STACKS)[number];

export const CONSENTS = [
  "found-abandonment",
  "open-stock",
  "household-loan",
  "personal-relic",
  "marked-estate",
  "town-tool",
  "inn-property",
] as const;
export type Consent = (typeof CONSENTS)[number];

/** Enforced by the engine. Unknown ids are validation errors. */
export const RULE_IDS = [
  "sound-enough-to-keep",
  "no-dismantle",
  "no-trade",
  "relic-consent",
  "no-food-use",
  "scour-before-food",
  "inn-property",
  "estate-papers",
  "do-not-burn",
  "borrowed-return",
  "no-animal-snare",
  "no-person-as-target",
  "only-float",
  "no-wipe-tab",
  "spark-ban",
  "leave-a-reserve",
] as const;
export type RuleId = (typeof RULE_IDS)[number];

export const HANDLER_IDS = [
  "handler.noise-lure",
  "handler.light-fit",
  "handler.cord-mend",
  "handler.tether",
  "handler.time-interval",
  "handler.keepsake",
  "handler.contain",
  "handler.pour",
  "handler.store-dry",
  "handler.preserve",
  "handler.specimen",
  "handler.cook",
  "handler.heat-work",
  "handler.cut",
  "handler.fasten",
  "handler.release",
  "handler.bore",
  "handler.hold",
  "handler.strike",
  "handler.press",
  "handler.abrade",
  "handler.mark",
  "handler.measure",
  "handler.true-work",
  "handler.seal",
  "handler.clean",
  "handler.fuel",
  "handler.carry",
  "handler.animal",
  "handler.plant",
  "handler.water-move",
  "handler.boat",
  "handler.stone",
  "handler.teach",
  "handler.record",
  "handler.navigate",
  "handler.signal",
  "handler.wrap",
  "handler.cloth",
  "handler.filter",
  "handler.agitate",
  "handler.probe",
  "handler.lock",
  "handler.hang",
  "handler.support",
  "handler.template",
  "handler.play",
  "handler.protect",
  "handler.trap",
  "handler.repair-fit",
  "handler.smoke",
  "handler.mix",
  "handler.pack",
] as const;
export type HandlerId = (typeof HANDLER_IDS)[number];

export type Params = Record<string, string | number | boolean>;

export type UseDef = {
  id: string;
  handler: HandlerId;
  label: string;
  /** What physically happens. The handler adds the mechanical clause. */
  line: string;
  params: Params;
  minCondition?: number;
  /** Instance must carry this runtime/catalog tag. */
  targetTag?: string;
  targetItemId?: string;
  needsConfirm?: boolean;
};

export type SalvageYield = {
  yield: string;
  qty: number;
  note: string;
};

export type RestoreSpec =
  | { possible: false; why: string }
  | {
      possible: true;
      /** Catalog id that must be on the bench, if any. */
      needsItem?: string;
      needsFixture?: string;
      cap: number;
      line: string;
      /** Applied when the service succeeds. Scouring a tin, for example. */
      addsTag?: string;
    };

export type Ownership = {
  consent: Consent;
  holder: string;
  mark: string | null;
  claim: string;
};

export type ProtectionRule = {
  id: RuleId;
  /** Used by sound-enough-to-keep. */
  threshold?: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  appearance: string;
  source: {
    place: Place;
    site: string;
    found: string;
  };
  stack: StackBehavior;
  /** Spawn quantity for batch / counted / pair. Unique is always 1. */
  stackQty: number;
  condition: {
    /** 0–100. Bands: ruined <20, worn <40, serviceable <65, sound <85, restored. */
    default: number;
    wearsFrom: string;
  };
  value: {
    /** In-kind exchange a neighbor might actually make. Not a shop price. */
    barterInKind: string;
    /** Ordinal only, for sorting offers. Never currency. */
    worthRank: 1 | 2 | 3 | 4 | 5;
    currency: null;
  };
  uses: UseDef[];
  /** Filled when recipes are bound. */
  recipeRefs: string[];
  actionRefs: string[];
  salvage: SalvageYield[];
  ownership: Ownership;
  era: {
    first: string;
    return: string;
    /** Condition cannot be serviced above this on the return. */
    returnCap?: number;
  };
  protection: {
    rules: ProtectionRule[];
    plain: string;
  };
  restore: RestoreSpec;
  tags: string[];
};

export type ItemInput = Omit<
  CatalogItem,
  "id" | "uses" | "recipeRefs" | "actionRefs" | "value" | "source" | "condition"
> & {
  n: number;
  appearance: string;
  place: Place;
  site: string;
  found: string;
  wears: string;
  condition: number;
  barter: string;
  rank: 1 | 2 | 3 | 4 | 5;
  uses: Omit<UseDef, "id">[];
  salvage: SalvageYield[];
};

export type Weather = "calm" | "wind" | "wet" | "frost" | "fog";
export type Era = "first" | "return";

export type Instance = {
  instanceId: string;
  itemId: string;
  condition: number;
  qty: number;
  contents: string | null;
  tags: string[];
  location: "bench" | "display" | "traded" | "consumed" | "neighbor";
  fixture?: string;
};

export type HandlerResult = {
  ok: boolean;
  messages: string[];
  /** Ports the real game would have to provide. Always listed, even on success. */
  missingPorts: string[];
  via: "workshop-stand-in";
  conditionDelta?: number;
  qtyDelta?: number;
  contents?: string | null;
  addTags?: string[];
  removeTags?: string[];
  targetId?: string;
  targetConditionDelta?: number;
  targetQtyDelta?: number;
  targetAddTags?: string[];
  targetContents?: string | null;
  spawn?: { itemId: string; qty: number; condition: number; tags?: string[] }[];
  flags?: string[];
  consumeInstance?: boolean;
};

export type RecipeEffect = {
  /** Catalog id of the bench object that is changed and not consumed. */
  subjectId?: string;
  /** Used when subjectId is absent or not on the bench. */
  subjectTag?: string;
  setCondition?: number;
  conditionDelta?: number;
  addTags?: string[];
  worldFlag?: string;
  /** Return-era fuel is stale. Odd hours sputter. */
  staleFuel?: boolean;
};

export type Recipe = {
  id: string;
  title: string;
  verb: "modify" | "restore" | "craft";
  station: "single-bench";
  /** Must be 1. Factory crews are out of scope. */
  workers: 1;
  /** Must be 1. No production batching. */
  batch: 1;
  minutes: number;
  inputs: { itemId: string; qty: number; consume: boolean; role: string }[];
  tools: string[];
  fixture?: string;
  handler: string;
  summary: string;
  effect: RecipeEffect;
};

export type PortStatus = "missing";

export type PortSpec = {
  id: string;
  status: PortStatus;
  why: string;
  methods: string[];
  standIn: string;
};

export const BANDS = ["ruined", "worn", "serviceable", "sound", "restored"] as const;
export type Band = (typeof BANDS)[number];

export function bandOf(condition: number): Band {
  if (condition < 20) return "ruined";
  if (condition < 40) return "worn";
  if (condition < 65) return "serviceable";
  if (condition < 85) return "sound";
  return "restored";
}

export type WorkshopState = {
  era: Era;
  weather: Weather;
  hour: number;
  seq: number;
  fixtures: string[];
  instances: Instance[];
  flags: string[];
  log: { t: string; text: string }[];
  provisions: string[];
};

export type ValidationIssue = { level: "error" | "warn"; message: string };

export type ValidationReport = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  counts: { items: number; uses: number; recipes: number; handlers: number; materials: number };
  missingExternal: PortSpec[];
  blockedSalvage: { id: string; name: string; why: string }[];
  purposeCollisions: string[];
};
