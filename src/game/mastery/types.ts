/** Mastery-object pack. Citations point at JamesTRichmond/preincarnation @ c737e42. */

export const PACK_SHA = "c737e42eb188148291438dfb8a5993d6ce2b77fa";

/** Closed copy of src/game/items.ts RelicId. Not an extension. */
export const RELIC_IDS = [
  "shovel",
  "hookshot",
  "boots",
  "flippers",
  "lantern",
  "hammer",
  "net",
  "mirror",
  "cape",
  "cane",
  "bow",
  "ipod",
  "sword",
  "bombs",
] as const;

export type RelicId = (typeof RELIC_IDS)[number];

export const DISCIPLINES = ["quarry", "creek", "sugar", "ash", "lantern", "hollow"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const OBJECT_KINDS = ["modifier", "inscribed", "fitting", "implement"] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number];

/** Effects that exist as engine branches or relic verbs at PACK_SHA. */
export const EFFECT_IDS = [
  "action.slash",
  "action.spin",
  "action.dig",
  "action.hook",
  "action.dash",
  "action.swim",
  "action.lantern",
  "action.smash",
  "action.net",
  "action.mirror",
  "action.cape",
  "action.cane",
  "action.bow",
  "action.bomb",
  "action.cut",
  "action.sip",
] as const;

export type EffectId = (typeof EFFECT_IDS)[number];

export const RESOURCE_IDS = ["mp", "arrows", "bombs", "hp", "karma", "bottle"] as const;
export type ResourceId = (typeof RESOURCE_IDS)[number];

export type Channel =
  | "radius"
  | "reach"
  | "windup"
  | "cooldown"
  | "duration"
  | "distance"
  | "damageMul"
  | "speedMul"
  | "chargeThreshold"
  | "chargeRate"
  | "pattern"
  | "lightShape"
  | "targetFilter"
  | "statusBurn"
  | "statusSlow"
  | "selfSlow"
  | "knockback"
  | "iFrames"
  | "heal"
  | "lightOuter"
  | "lightInner"
  | "lightRear"
  | "surveyRadius";

export type Op = {
  effect: EffectId;
  channel: Channel;
  mode: "add" | "mul" | "set";
  value: number | string;
};

export type When = {
  mapId?: "quarry" | "middlebury" | "addison" | "other";
  minHp?: number;
  inWater?: boolean;
};

export type Cost = { id: ResourceId; amount: number };

export type MasteryObject = {
  id: string;
  name: string;
  discipline: Discipline;
  kind: ObjectKind;
  /** Always null. No discipline ability id exists at PACK_SHA. */
  disciplineAbilityId: null;
  bindingStatus: "existing-effect-only";
  compatibleEffects: EffectId[];
  ops: Op[];
  elseOps: Op[];
  when: When | null;
  tradeoff: string;
  changedBehavior: string;
  equipRestrictions: string;
  useRestrictions: string;
  removal: string;
  discovery: string;
  provenance: string;
  save: {
    onDeath: "drops-to-grave";
    erosion: "mundane" | "magic-kept";
    note: string;
  };
  exclusivityGroup: string | null;
  anchor: "weapon" | "y-relic" | "passive";
  requires: {
    ySlot?: RelicId;
    anyRelic?: RelicId[];
    dashGate?: boolean;
    flippers?: boolean;
    bottle?: boolean;
  };
  extraCost: Cost | null;
  /** Test hook only. Catalog objects leave this empty so they cannot refund a spent resource. */
  grants: Cost[];
  selfHarmIfInside: number;
  clause: string;
};

export type ResourceMap = Record<ResourceId, number>;

export type ActionFlags = {
  lanternOn: boolean;
  quarryOpen: boolean;
  excavated: boolean;
  eroded: boolean;
  tileOpened: boolean;
};

export type ActionProfile = {
  effectId: EffectId;
  blocked: boolean;
  blockReason: string | null;
  fizzle: boolean;
  radius: number;
  reach: number;
  windup: number;
  cooldown: number;
  duration: number;
  distance: number;
  damage: number;
  damageMul: number;
  speed: number;
  speedMul: number;
  chargeThreshold: number;
  chargeRate: number;
  power: number;
  pattern: string;
  lightShape: string;
  targetFilter: string;
  targetCount: number;
  statusBurn: number;
  statusSlow: number;
  selfSlow: number;
  knockback: number;
  iFrames: number;
  heal: number;
  lightOuter: number;
  lightInner: number;
  lightRear: number;
  surveyRadius: number;
  coverage: number;
  /** Harm applied when the action resolves, not when it is pressed. Removal avoids it. */
  resolveHarm: number;
  spent: ResourceMap;
  grants: ResourceMap;
  flags: ActionFlags;
};

export type ArenaWorld = {
  relics: RelicId[];
  ySlot: RelicId | null;
  incarnation: "wanderer" | "smuggler" | "officer" | "embryo";
  shadowStep: boolean;
  mp: number;
  maxMp: number;
  arrows: number;
  bombs: number;
  hp: number;
  maxHp: number;
  karma: number;
  bottles: ("empty" | "syrup" | "creemee" | "deluxe")[];
  hasGrave: boolean;
  graveExcavated: boolean;
  hasCracked: boolean;
  inWater: boolean;
  mapId: "quarry" | "middlebury" | "addison" | "other";
  weaponDmg: number;
  weaponReach: number;
  edge: number;
  flawId: string;
  tropoverse: boolean;
  incarnationDamage: number;
  insideBlast: boolean;
  /** Existing weapon affix burn (weapons.ts ember is 0.6). Shares the burn stack. */
  priorBurn: number;
  lanternOn: boolean;
  quarryOpen: boolean;
  excavated: boolean;
  tileOpened: boolean;
};

export type ResolveFailure = {
  ok: false;
  reason: string;
  code: "incompatible" | "loop" | "cap";
};

export type ResolveSuccess = {
  ok: true;
  profile: ActionProfile;
  activeIds: string[];
};

export type ResolveResult = ResolveSuccess | ResolveFailure;

export type PendingAction = {
  phase: "winding";
  effectId: EffectId;
  items: MasteryObject[];
  /** World before press costs. Re-resolution uses this so a spent bomb does not look unaffordable. */
  preWorld: ArenaWorld;
  /** World after press costs, including a fitting's extra cost. */
  world: ArenaWorld;
  pressSpent: ResourceMap;
  windup: number;
};

export type BeginResult =
  | { phase: "resolved"; result: ResolveResult; world: ArenaWorld }
  | { phase: "winding"; pending: PendingAction; preview: ResolveSuccess };
