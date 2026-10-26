import type { RelicId } from "./ids.ts";

export type Coverage = "vignette" | "executable";

export type RestorationState = "intact" | "dormant" | "fractured" | "mending" | "spent";

export type OnDeath =
  | "remains"
  | "drops-fractured"
  | "returns-home"
  | "banks-in-vein"
  | "lost-if-fractured";

export type PersistScope = "scene" | "campaign" | "vein";

export interface RelicRecord {
  id: RelicId;
  name: string;
  /** vignette = playable scene in the demo. executable = handler runs. Never lore-only. */
  coverage: Coverage;
  summary: string;
  discovery: {
    sceneId: string;
    place: string;
    staging: string;
    trigger: string;
  };
  provenance: {
    /** The unrealized life the Marble Vein kept inside the object. */
    veinLife: string;
    chain: string[];
    /** Physical vein-mark. Authored, not rolled. */
    stamp: string;
  };
  appearance: string;
  power: string;
  tradeoff: string;
  restoration: {
    needed: boolean;
    steps: string[];
    /** Dust and generic mending cannot finish the job. */
    lineageRequired: boolean;
  };
  lineage: { person: string; response: string }[];
  ellis: string;
  persistence: {
    scope: PersistScope;
    onDeath: OnDeath;
    saveKey: string;
  };
  uniqueness: {
    sourceId: string;
    onDuplicate: "vein-refuses";
  };
  /** Quest ids this relic is forbidden to complete, fail, or rewrite. */
  protectedQuestIds: string[];
  exclusiveGroup: string | null;
  handler: string;
  params: Record<string, unknown>;
  integration: {
    systems: string[];
    slots: string[];
    mustNot: string[];
  };
}

export interface RelicInstance {
  instanceId: string;
  relicId: RelicId;
  sourceId: string;
  state: RestorationState;
  bound: Record<string, string | number | boolean>;
}

export interface Actor {
  id: "ellis";
  name: "Ellis Voss";
  hp: number;
  hpMax: number;
  alive: boolean;
  cannotSayOwnName: boolean;
  handsMirrored: boolean;
  foreignHunger: boolean;
  mourningVisible: boolean;
  outOfYear: number | null;
  fatigue: number;
  recognized: number;
  veinDebt: boolean;
  lost: boolean;
  clumsy: boolean;
  ageShown: number;
  weaponsBlocked: boolean;
  ateOwnRationsBlocked: boolean;
  truthfulWithMaeve: boolean;
  official: boolean;
}

export type DoorKind =
  | "remembered-homestead"
  | "mundane-lock"
  | "campaign-gate"
  | "drawer"
  | "hesitation"
  | "burned-memory"
  | "county-line";

export interface Door {
  id: string;
  kind: DoorKind;
  homesteadId: string;
  label: string;
  locked: boolean;
  witnessed: number;
  refused: boolean;
  braced: boolean;
}

export type BoundaryClass = "survey-mark" | "campaign-gate" | "quest-lock" | "region-border";

export interface Boundary {
  id: string;
  class: BoundaryClass;
  label: string;
  notch: number;
  originNotch: number;
  readable: boolean;
  frozen: boolean;
  marked: boolean;
  protected: boolean;
}

export interface SpatialPair {
  id: string;
  label: string;
  approved: boolean;
  context: "puzzle" | "combat" | "quest";
  a: number;
  b: number;
  swapped: boolean;
  temporary: boolean;
}

export interface Opportunity {
  id: string;
  tag: string;
  siteId: string;
  description: string;
  available: boolean;
  sealedIn: string;
  lost: boolean;
  localTicks: number;
  pendingLoss: boolean;
}

export interface SoundNode {
  id: string;
  label: string;
  layer0: string;
  under: string;
  underProtected: boolean;
  revealed: boolean;
  hoarse: boolean;
  silenced: boolean;
}

export interface Table {
  id: string;
  label: string;
  guest: string;
  memory: string;
  clue: string;
  seated: boolean;
  crumb: boolean;
}

export interface Birthday {
  id: string;
  who: string;
  gift: string;
  spent: boolean;
  protected: boolean;
}

export interface YearWindow {
  id: string;
  label: string;
  approvedYears: number[];
  protectedYears: number[];
  openYear: number | null;
}

export interface Grave {
  id: string;
  name: string;
  unspoken: boolean;
  answer: string;
  protected: boolean;
  asked: boolean;
}

export interface PathNode {
  id: string;
  label: string;
  mirrorSafe: boolean;
  facing: "left" | "right";
}

export interface JournalEntry {
  id: string;
  text: string;
  protected: boolean;
  forgotten: boolean;
}

export type QuestStatus = "active" | "waiting" | "complete" | "failed";

export interface Quest {
  id: string;
  protected: boolean;
  status: QuestStatus;
  note: string;
}

export interface Person {
  id: string;
  name: string;
  present: boolean;
  closed: boolean;
  resentment: number;
  protectedAccuser: boolean;
  petty: string;
}

export interface Timer {
  id: string;
  label: string;
  protected: boolean;
  paused: boolean;
  remaining: number;
}

export interface WorldObject {
  id: string;
  label: string;
  protected: boolean;
  uncertain: boolean;
}

export interface Link {
  id: string;
  from: string;
  to: string;
  cut: boolean;
}

export interface Document {
  id: string;
  label: string;
  protected: boolean;
  stamped: boolean;
  ruined: boolean;
}

export interface Water {
  id: string;
  label: string;
  campaign: boolean;
}

export interface Climb {
  id: string;
  label: string;
  revealedHolds: number;
  blinded: boolean;
}

export interface Cache {
  id: string;
  label: string;
  found: boolean;
}

export interface Inscription {
  id: string;
  text: string;
  revealed: boolean;
}

export interface Sentence {
  id: string;
  speaker: string;
  text: string;
  alternate: string;
  protected: boolean;
  revised: boolean;
}

export interface DeathRecord {
  cause: string;
  prevented: boolean;
  by: string;
  scripted: boolean;
  protected: boolean;
}

export interface SourceState {
  relicId: RelicId;
  available: boolean;
  consumed: boolean;
}

export interface Placed {
  where: string;
  instance: RelicInstance;
}

export interface World {
  tick: number;
  region: string;
  sceneId: string;
  actor: Actor;
  inventory: RelicInstance[];
  placed: Placed[];
  veinBank: RelicInstance[];
  sources: Record<string, SourceState>;
  doors: Door[];
  boundaries: Boundary[];
  spatial: SpatialPair[];
  opportunities: Opportunity[];
  sounds: SoundNode[];
  tables: Table[];
  birthdays: Birthday[];
  windows: YearWindow[];
  graves: Grave[];
  paths: PathNode[];
  journal: JournalEntry[];
  quests: Quest[];
  people: Person[];
  timers: Timer[];
  objects: WorldObject[];
  links: Link[];
  documents: Document[];
  waters: Water[];
  climbs: Climb[];
  caches: Cache[];
  inscriptions: Inscription[];
  sentences: Sentence[];
  flags: Record<string, string | number | boolean>;
  lineage: { person: string; response: string }[];
  log: string[];
  death: DeathRecord | null;
  locks: { group: string; ownerId: RelicId; untilTick: number }[];
}

export interface Intent {
  relicId: RelicId;
  kind: string;
  targetId?: string;
  extra?: Record<string, string | number | boolean>;
}

export interface EffectResult {
  ok: boolean;
  code: string;
  detail: string;
  world: World;
}

export interface Blow {
  amount: number;
  source: string;
  scripted: boolean;
  protected: boolean;
  /** Authored near-death band. Coat and handkerchief ignore anything outside it. */
  bounded: boolean;
}
