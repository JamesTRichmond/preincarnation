/** Rules-lab types. Not a live PREINCARNATION combat API. */

export const TOOL_IDS = [
  "shovel",
  "sugar",
  "boots",
  "fins",
  "lamp",
  "hammer",
  "net",
  "glass",
  "cape",
  "rod",
  "bow",
  "keg",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export const FORM_IDS = ["wanderer", "smuggler", "officer", "god"] as const;
export type FormId = (typeof FORM_IDS)[number];

export type Medium = "ground" | "water" | "void" | "pit";
export type ProjClass = "organic" | "mineral" | "bullet" | "void" | "slam" | "debris";
export type HitKind = "organic" | "physical" | "void" | "execute" | "fall";

export interface Resources {
  sugar: number;
  oil: number;
  ash: number;
  shards: number;
  pins: number;
  kegs: number;
  netTension: number;
  capeFolds: number;
  darkCharge: number;
}

export interface Anchor {
  id: string;
  x: number;
  /** Real mass. Sluices and bridges read this. */
  weight: number;
  /** God-in-void transfers touch only this. */
  nominal: number;
  kind: "piling" | "pin" | "post" | "shovel" | "officer" | "rod";
  real: boolean;
  inVoid: boolean;
}

export interface Projectile {
  id: string;
  cls: ProjClass;
  x: number;
  vx: number;
  alive: boolean;
  caught: boolean;
}

export interface Foe {
  id: string;
  x: number;
  hp: number;
  maxHp: number;
  boss: boolean;
  anchored: boolean;
  unmoored: boolean;
  grounded: boolean;
  armored: boolean;
  rootedUntil: number;
  alive: boolean;
}

export interface Insect {
  id: string;
  x: number;
  sweet: boolean;
  alive: boolean;
  caught: boolean;
  lantern: boolean;
}

export interface Keg {
  id: string;
  x: number;
  lit: boolean;
  wet: boolean;
  fuseAt: number;
  shapedAnchor: string | null;
  buried: boolean;
}

export interface RewardLoc {
  where: "world" | "inventory" | "buried" | "pile";
  x: number;
  civilian: boolean;
  pileId?: string;
}

export interface Pile {
  id: string;
  x: number;
  rewardIds: string[];
  kegs: number;
}

export interface Pane {
  x: number;
  hp: number;
  roomId: string;
  extraShard: boolean;
  hiddenFromPlayer: boolean;
  hiddenFromPatrol: boolean;
  alive: boolean;
}

export interface Channel {
  kind: "hem" | "leap" | "brand" | "place-keg";
  toX: number;
  completesAt: number;
  targetId?: string;
  payload?: string;
}

export interface Seam {
  id: string;
  x: number;
  progress: number;
  seated: boolean;
}

export interface RunState {
  roomId: string;
  time: number;
  form: FormId;
  embryo: boolean;
  x: number;
  lastFree: number;
  medium: Medium;
  facing: 1 | -1;
  vx: number;
  hp: number;
  maxHp: number;
  poise: number;
  waterSpeed: number;
  breath: number;
  resources: Resources;
  equipped: ToolId[];
  shovelPlanted: boolean;
  shovelAnchorX: number;
  rodPlanted: boolean;
  rodAnchorX: number;
  rodCracked: boolean;
  lampLit: boolean;
  carryingKeg: boolean;
  carriedKegWet: boolean;
  caught: { id: string; cls: ProjClass } | null;
  duskHeld: { id: string; kind: "projectile" | "specimen" } | null;
  specimen: { id: string; alive: boolean } | null;
  channel: Channel | null;
  pane: Pane | null;
  safeThreshold: number | null;
  lineCast: boolean;
  candy: { x0: number; x1: number; alive: boolean } | null;
  fracture: { x0: number; x1: number; alive: boolean; onWater: boolean } | null;
  lockbar: { x0: number; x1: number; stoneAnchored: boolean } | null;
  rootsUntil: number;
  rootX: number | null;
  soilLoosened: boolean;
  stakes: number[];
  fence: boolean;
  seams: Seam[];
  anchors: Anchor[];
  weightMemory: { anchorId: string; weight: number } | null;
  projectiles: Projectile[];
  foes: Foe[];
  insects: Insect[];
  kegs: Keg[];
  buriedKegs: Keg[];
  blasts: { id: string; x: number; inSoil: boolean; salvaged: boolean; shaped: boolean; opened: boolean }[];
  rewards: Record<string, RewardLoc>;
  pickedAfterPane: string[];
  piles: Record<string, Pile>;
  granted: string[];
  revealedLocks: string[];
  guestMark: boolean;
  sluiceOpen: boolean;
  wallOpen: boolean;
  wallScarred: boolean;
  resin: boolean;
  alert: number;
  netTornRoom: boolean;
  snare: { x: number; until: number; holding: string | null } | null;
  divedUntil: number;
  cachesMarked: boolean;
  marks: string[];
  voidMemory: boolean;
  godVoidHemUsed: boolean;
  witnessBlind: boolean;
  specimenTrickUsed: boolean;
  deathCount: number;
  interruptCount: number;
  collisionRecoveries: number;
  pinBloom: boolean;
  trench: boolean;
  debrisDeflected: boolean;
  wind: boolean;
  mirror: { x: number; alive: boolean } | null;
  bankSurface: "ground" | "stone";
  /** When true, pilings are removed so pin/officer tests own the anchors. */
  stripPilings: boolean;
  log: string[];
  /** Lab station clears. Not a gameplay reward. */
  labCleared: string[];
  notes: string[];
}

export type Intent =
  | { type: "equip"; tools: ToolId[] }
  | { type: "set-form"; form: FormId }
  | { type: "set-embryo"; on: boolean }
  | { type: "move"; dir: -1 | 1; dt: number }
  | { type: "root" }
  | { type: "release-shovel" }
  | { type: "bury-reward"; id: string }
  | { type: "bury-keg" }
  | { type: "unearth"; id: string }
  | { type: "scoop" }
  | { type: "lay-sugar" }
  | { type: "crystallize"; heat: "lamp" | "shard" }
  | { type: "dust" }
  | { type: "leap"; toX: number }
  | { type: "stall" }
  | { type: "echo-land" }
  | { type: "current-cut" }
  | { type: "eddy" }
  | { type: "undertow" }
  | { type: "light-lamp" }
  | { type: "snuff" }
  | { type: "witness"; lockId: string }
  | { type: "brand"; targetId: string }
  | { type: "pin"; seamId: string }
  | { type: "bell" }
  | { type: "weight-tap"; anchorId: string }
  | { type: "spawn-projectile"; id: string; cls: ProjClass; x: number; vx?: number }
  | { type: "catch"; projectileId: string }
  | { type: "return-shot"; targetId: string }
  | { type: "specimen"; insectId: string }
  | { type: "release-specimen" }
  | { type: "snare" }
  | { type: "plant-pane"; extraShard?: boolean }
  | { type: "hit"; amount: number; kind: HitKind }
  | { type: "mirror"; x: number }
  | { type: "fracture"; onWater?: boolean }
  | { type: "hem"; toX: number }
  | { type: "fold"; targetId: string }
  | { type: "dusk-carry" }
  | { type: "transfer"; fromId: string; toId: string; amount: number }
  | { type: "brace" }
  | { type: "retrieve-rod" }
  | { type: "lockbar"; toAnchor: string }
  | { type: "ash-shot"; targetId: string }
  | { type: "cinder"; targetId: string }
  | { type: "grave-arc" }
  | { type: "place-keg"; atX?: number }
  | { type: "light-fuse"; kegId: string; how: "brand" | "cinder" }
  | { type: "shape-keg"; kegId: string; anchorId: string }
  | { type: "salvage"; blastId: string }
  | { type: "dry-keg"; kegId: string }
  | { type: "pickup"; id: string }
  | { type: "grant"; id: string; x?: number; civilian?: boolean }
  | { type: "enter-void" }
  | { type: "advance"; dt: number }
  | { type: "die"; kind?: HitKind }
  | { type: "recover-pile"; pileId: string }
  | { type: "pass-gate" }
  | { type: "set-wind"; on: boolean }
  | { type: "kill-specimen-with-hammer" }
  | { type: "crack-rod" };

export interface Result {
  ok: boolean;
  code: string;
  detail: string;
}

export interface TransformationRecord {
  id: string;
  tool: ToolId;
  name: string;
  activation: string;
  resource: string;
  effect: string;
  tradeoff: string;
  puzzleRestrictions: string[];
  formInteraction: Record<FormId, string>;
  cannotReplace: string[];
  bossLimits: string[];
  /** True when the creek room can perform this by hand. */
  labDemonstrated: boolean;
  /** True when a contract drives the engine, not a prose claim. */
  engineDemonstrated: boolean;
  testCases: string[];
}

export interface MutationRecord {
  id: string;
  form: FormId;
  name: string;
  effect: string;
  tradeoff: string;
  engineDemonstrated: boolean;
  testCases: string[];
}

export interface TechniqueRecord {
  id: string;
  name: string;
  tools: ToolId[];
  forms: FormId[] | "any";
  effect: string;
  notCoveredByEitherAlone: string;
  engineDemonstrated: boolean;
  testCases: string[];
}
