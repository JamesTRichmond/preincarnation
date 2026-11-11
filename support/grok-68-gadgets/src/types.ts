/** PREINCARNATION gadget pack — types. IDs loot.expansion.gadget.001–080. */

export type Family = "clockwork" | "optical" | "sonic" | "fitting" | "field";
export type Verb = "use" | "craft" | "trade" | "display";
export type Store = "pocket" | "belt" | "pack" | "shelf" | "hand" | "tin";

export type EnemyKind =
  | "narrow"
  | "wide"
  | "glare"
  | "scent"
  | "rhythm"
  | "phototactic"
  | "flock"
  | "keen-ear"
  | "burrow";

export type LampKind =
  | "barn-kerosene"
  | "brass-pocket"
  | "church-vigil"
  | "electric-porch"
  | "forge"
  | "hearth";

export type LampMode =
  | "steady-pool"
  | "spectrum-stripe"
  | "baffled-warm"
  | "hooded"
  | "diffused-stripe";

export const APPROVED_LAMPS: LampKind[] = ["barn-kerosene", "brass-pocket", "church-vigil"];

export type Enemy = {
  id: string;
  kind: EnemyKind;
  alert: "idle" | "distracted" | "frozen" | "drawn" | "startled" | "masked" | "balked";
  rangeYd: number;
  timer: number;
  /** Corridor foes lose half the bird's attention if no bearing was set. */
  needsBearing?: boolean;
};

export type Lamp = {
  id: string;
  kind: LampKind;
  lit: boolean;
  mode: LampMode;
  moths: boolean;
};

export type Compartment = {
  id: string;
  hertz: number;
  revealed: boolean;
  unlatched: boolean;
  soft: boolean;
};

export type Balance = {
  id: string;
  currentOz: number;
  targetOz: number;
  tolerance: number;
  overhead: boolean;
  hanger: boolean;
  held: boolean;
  released: boolean;
};

export type Puzzle = {
  id: string;
  solved: boolean;
  expects: string;
  progress: number;
  detail: string;
};

export type KitItem = {
  uid: string;
  lootId: string;
  condition: number;
  stored: Store;
  winds: number;
  mods: string[];
  recorded: string | null;
  plays: number;
  massOz: number;
  sealed: boolean;
};

export type Weather = {
  wind: "calm" | "breeze" | "fresh";
  wet: boolean;
  dawn: boolean;
  day: boolean;
  overcast: boolean;
  rainComing: boolean;
  pressure: "steady" | "falling";
  tempF: number;
};

export type World = {
  scene: string;
  weather: Weather;
  hour: number;
  quarter: number;
  enemies: Enemy[];
  lamps: Lamp[];
  compartments: Compartment[];
  balances: Balance[];
  puzzles: Record<string, Puzzle>;
  sounds: { id: string; label: string }[];
  hiddenSounds: { id: string; label: string }[];
  identifiedSound: string | null;
  merchant: {
    markedOz: number;
    actualOz: number;
    shortFlagged: boolean;
    ledgerRead: boolean;
    credit: number;
  };
  documents: Record<string, { text: string; revealed: boolean }>;
  places: Record<string, Record<string, string | number | boolean>>;
  notes: string[];
  readings: { tool: string; value: string }[];
  materials: Record<string, number>;
  flags: Record<string, string | number | boolean>;
  shelf: string[];
  log: string[];
  kit: KitItem[];
};

export type Args = Record<string, string | number | boolean>;

export type OpName =
  | "distractNarrow"
  | "cadenceLock"
  | "measureDrift"
  | "holdLatch"
  | "slowChime"
  | "rateCheck"
  | "liftSash"
  | "copyTemplate"
  | "chimeHour"
  | "setAlarm"
  | "tally"
  | "reconcileTally"
  | "letOff"
  | "fitSector"
  | "countTurns"
  | "showSchedule"
  | "diffSchedule"
  | "advancePawl"
  | "holdRatchet"
  | "ferryNote"
  | "walkDistance"
  | "muteStrike"
  | "knockTest"
  | "evenSash"
  | "doorTrip"
  | "showBentPin"
  | "weekdaySpan"
  | "indexJournal"
  | "maintainingWind"
  | "loanExtraWind"
  | "retuneLamp"
  | "magnify"
  | "sunEmber"
  | "cutGlare"
  | "varnishStrain"
  | "traceSkyline"
  | "alignPost"
  | "hoodLamp"
  | "contactPrint"
  | "readGreen"
  | "ripeness"
  | "colinear"
  | "birdBearing"
  | "readFlame"
  | "assayGlass"
  | "rangeFind"
  | "straightedge"
  | "stereoDiff"
  | "rumorTrade"
  | "seeSmoke"
  | "jarLift"
  | "dewTrace"
  | "edgeGlance"
  | "sunAlt"
  | "shadowSeason"
  | "sundial"
  | "punchMap"
  | "readHallmark"
  | "aidFineRestore"
  | "measureAngle"
  | "yieldRouge"
  | "revealCompartment"
  | "identifySound"
  | "recordSound"
  | "playRecording"
  | "givePitch"
  | "measureGapInches"
  | "hailFerry"
  | "startleFlock"
  | "freezeRhythm"
  | "beatLock"
  | "loosePane"
  | "liftPane"
  | "sounding"
  | "bottomSample"
  | "muteBell"
  | "emitSound"
  | "drawFlock"
  | "gooseCadence"
  | "calibrateResonator"
  | "crackTest"
  | "rainTell"
  | "storePattern"
  | "maskFootfalls"
  | "pitchGate"
  | "nearSpeech"
  | "directedHail"
  | "echoRange"
  | "softWallHint"
  | "signalFriend"
  | "singleNoteAlert"
  | "freezeBurrow"
  | "harvestCord"
  | "shiftBalance"
  | "verifyMerchant"
  | "repairPulley"
  | "gaugeCord"
  | "dogShutter"
  | "dogDoor"
  | "silenceCreak"
  | "unlatchRevealed"
  | "windTarget"
  | "riskyDrive"
  | "markPegs"
  | "checkStraight"
  | "turnbuckle"
  | "pinClevis"
  | "hingePinStandIn"
  | "stopCellarWet"
  | "crimpCord"
  | "swingClear"
  | "clampAid"
  | "boreWood"
  | "listeningHole"
  | "fitCatch"
  | "sealTin"
  | "hideKeyhole"
  | "weakGlance"
  | "chainDoor"
  | "attachHanger"
  | "exposeLightWeight"
  | "clerkRead"
  | "feltClock"
  | "padResonator"
  | "chainMeasure"
  | "balkFlock"
  | "drawRay"
  | "ruleSketch"
  | "soilCore"
  | "moistureHint"
  | "readSlope"
  | "bobStandIn"
  | "bearing"
  | "magneticFetch"
  | "confirmPressure"
  | "sacrificeGlass"
  | "tempBand"
  | "heatCheck"
  | "boilElevation"
  | "enableRecast"
  | "treeGirth"
  | "clampGlue"
  | "ringCount"
  | "siphonOil"
  | "declareLevel"
  | "halfGlance"
  | "jotNote"
  | "graphiteMark"
  | "probeSack"
  | "notchDepth"
  | "sugarRead"
  | "diffusePrism"
  | "flagPin"
  | "splint"
  | "changedPlace"
  | "armAutoLog";

export type Op = {
  op: OpName;
  id?: string;
  id2?: string;
  n?: number;
  n2?: number;
  s?: string;
  s2?: string;
  mode?: LampMode;
  kind?: EnemyKind;
};

export type Expect = {
  sel:
    | "enemy"
    | "lamp"
    | "comp"
    | "balance"
    | "puzzle"
    | "place"
    | "flag"
    | "doc"
    | "mat"
    | "self"
    | "kit"
    | "sound"
    | "merchant"
    | "shelf"
    | "reading";
  id?: string;
  field?: string;
  eq: string | number | boolean;
};

export type UseDef = {
  id: "a" | "b";
  verb: Verb;
  title: string;
  /** Exact effect, in play terms. */
  summary: string;
  demoArgs?: Args;
  ops: Op[];
  expect: Expect[];
};

export type ServiceDef = {
  need?: Record<string, number>;
  to?: number;
  note: string;
  requireFlag?: string;
  yield?: Record<string, number>;
};

export type Binding = {
  id: string;
  kind: string;
  note: string;
};

export type Patch = {
  scene?: string;
  weather?: Partial<Weather>;
  hour?: number;
  quarter?: number;
  enemies?: Enemy[];
  lamps?: Lamp[];
  compartments?: Compartment[];
  balances?: Balance[];
  puzzles?: Record<string, Puzzle>;
  sounds?: { id: string; label: string }[];
  hiddenSounds?: { id: string; label: string }[];
  identifiedSound?: string | null;
  merchant?: Partial<World["merchant"]>;
  documents?: World["documents"];
  places?: World["places"];
  notes?: string[];
  materials?: Record<string, number>;
  flags?: Record<string, string | number | boolean>;
  kitExtra?: (Partial<KitItem> & { lootId: string })[];
  omitLoot?: string[];
  self?: Partial<KitItem>;
  shelf?: string[];
};

export type LimitProbe = {
  use: "a" | "b";
  patch?: Patch;
  args?: Args;
  code: string;
  /** Run the success action once, then again, expecting code. */
  repeat?: boolean;
  note: string;
  /** Checked against the returned world when a failure commits. */
  expect?: Expect[];
};

export type Gadget = {
  id: string;
  n: number;
  name: string;
  family: Family;
  hands: 1 | 2;
  weightOz: number;
  bulk: "pocket" | "belt" | "pack";
  provenance: { maker: string; place: string; year: number; note: string };
  discovery: { site: string; when: string; condition: string; clue: string };
  storage: {
    preferred: Store;
    dampSensitive: boolean;
    crushSensitive: boolean;
    iron: boolean;
    /** Always false — these curios do not stack. */
    stack: false;
    canTin: boolean;
    display: string;
    note: string;
  };
  limits: string[];
  wear: number;
  uses: [UseDef, UseDef];
  restore?: ServiceDef;
  salvage?: ServiceDef;
  bindings: Binding[];
  bench: boolean;
  scenes: string[];
  tradeCredit: number;
  tradeRefuse?: string;
  fixture: Patch;
  limit: LimitProbe;
  extraLimits?: LimitProbe[];
};

export type ActionResult = {
  ok: boolean;
  code: string;
  proofs: string[];
  notes: string[];
  world: World;
};

export class ActionFail extends Error {
  code: string;
  /** Keep the mutated world even though the action failed (a wrong goose call still spooks the flock). */
  commit: boolean;
  constructor(code: string, note: string, commit = false) {
    super(note);
    this.code = code;
    this.commit = commit;
    this.name = "ActionFail";
  }
}
