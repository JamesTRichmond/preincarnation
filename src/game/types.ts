import type { Weapon } from "./weapons.ts";
import type { Grave, LifePath, RelicId } from "./items.ts";
import type { DeckMeta } from "./ipod.ts";

export type Dir = 0 | 1 | 2 | 3;
export type IncarnationId = "wanderer" | "smuggler" | "officer" | "embryo";
export type Mode = "title" | "create" | "intro" | "play" | "dialogue" | "pause" | "limbo" | "ending" | "codex" | "ipod";
export type MapId =
  | "addison"
  | "middlebury"
  | "vergennes"
  | "bristol"
  | "ferrisburgh"
  | "salisbury"
  | "rutland"
  | "quarry"
  | "montpelier"
  | "whiteriver"
  | "chittenden"
  | "windsor"
  | "burlington"
  | "shelburne"
  | "essex"
  | "winooski"
  | "woodstock"
  | "springfieldvt"
  | "norwich"
  | "soloverse"
  | "farmstead"
  | "int_farm"
  | "int_inn"
  | "int_cape"
  | "int_sugar"
  | "int_college"
  | "int_capitol"
  | "int_home"
  | "int_barn"
  | "int_shop"
  | "int_creemee"
  | "int_cave";

export type EnemyKind = "crow" | "wraith" | "sentinel" | "bear" | "bobcat" | "fisher" | "resident";

export type BottleKind = "empty" | "syrup" | "creemee" | "deluxe";

export type AfterlifeHost = "god" | "devil";

export type CharacterSheet = {
  name: string;
  backgroundId: string;
  bondId: string;
  idealId: string;
  flawId: string;
  skillPoints: number;
  created: boolean;
};

export const DEFAULT_CHARACTER: CharacterSheet = {
  name: "Ellis Perch",
  backgroundId: "farmhand",
  bondId: "maeve",
  idealId: "the_job",
  flawId: "cannot_rest",
  skillPoints: 3,
  created: false,
};

export type Fate = "spare" | "condemn" | "release" | "bind" | "crown" | null;

export type Upgrades = {
  vitality: number;
  edge: number;
  stride: number;
  sight: number;
  shadowStep: number;
  wraithBond: number;
  echo: number;
  soloverseKey: boolean;
};

export type Flags = {
  farmerHelped: boolean;
  millFate: Fate;
  elderFate: Fate;
  sentinelFate: Fate;
  quarryOpen: boolean;
  sheepFound: boolean;
  bombs: number;
  chests: string[];
  bushes: string[];
  talked: string[];
  tutorialDone: boolean;
  townsCleared: string[];
  caches: string[];
  hippieMet: boolean;
  syrupStash: boolean;
  residentFate: Fate;
  homeX: number;
  homeY: number;
  geoTown: MapId | null;
  geoLat: number | null;
  geoLng: number | null;
  tropoverse: boolean;
  riflesTaken: string[];
  bottles: BottleKind[];
  returnMap: MapId | null;
  returnX: number;
  returnY: number;
  relics: RelicId[];
  ySlot: RelicId | null;
  arrows: number;
  keys: number;
  year: number;
  lifePath: LifePath;
  graves: Grave[];
  plots: { x: number; y: number; stage: number; id: string; mapId?: string; year?: number }[];
  lanternOn: boolean;
  ipodReady: boolean;
  homeMap: MapId | null;
  homeTileX: number;
  homeTileY: number;
  spectrumFate: Fate;
  deck: DeckMeta;
  afterlifeHost: AfterlifeHost | null;
  lastDeed: string;
  returnedFromDeath: boolean;
};

export type SaveData = {
  version: number;
  cycle: number;
  karma: number;
  crowns: number;
  incarnation: IncarnationId;
  upgrades: Upgrades;
  flags: Flags;
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  mapId: MapId;
  x: number;
  y: number;
  inventory: Weapon[];
  equippedId: string;
  character: CharacterSheet;
};

export type Choice = {
  label: string;
  karma?: number;
  crowns?: number;
  flag?: Partial<Flags>;
  next?: string | "end";
  note?: string;
};

export type DialogueNode = {
  id: string;
  speaker: string;
  text: string;
  entropy?: number;
  choices?: Choice[];
};

export type CycleLedger = {
  thisLife: string;
  youKeep: string;
  theGround: string;
};

export const EMPTY_LEDGER: CycleLedger = { thisLife: "", youKeep: "", theGround: "" };

export type UiSnapshot = {
  mode: Mode;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  karma: number;
  crowns: number;
  cycle: number;
  incarnation: IncarnationId;
  bombs: number;
  objective: string;
  interactHint: string | null;
  dialogue: DialogueNode | null;
  shake: boolean;
  reducedMotion: boolean;
  message: string | null;
  flags: Flags;
  upgrades: Upgrades;
  endingBeat: number;
  muted: boolean;
  showHelp: boolean;
  townName: string;
  weatherName: string;
  tempF: number | null;
  weaponName: string;
  weaponTags: string;
  geoLine: string | null;
  bottles: BottleKind[];
  tropoverse: boolean;
  year: number;
  clock: string;
  yName: string;
  arrows: number;
  keys: number;
  zoom: number;
  lifePath: LifePath;
  night: boolean;
  charge: number;
  showControls: boolean;
  spectrumReady: boolean;
  deckTitle: string | null;
  deckPlaying: boolean;
  deckHasTrack: boolean;
  deckPosition: number;
  deckDuration: number;
  character: CharacterSheet;
  afterlifeHost: AfterlifeHost | null;
  introBeat: number;
  job: string;
  lastDeed: string;
  cycleLedger: CycleLedger;
};

export const SAVE_KEY = "preincarnation.save.v1";
export const SAVE_VERSION = 8;

export const DEFAULT_UPGRADES: Upgrades = {
  vitality: 0,
  edge: 0,
  stride: 0,
  sight: 0,
  shadowStep: 0,
  wraithBond: 0,
  echo: 0,
  soloverseKey: false,
};

export const DEFAULT_FLAGS: Flags = {
  farmerHelped: false,
  millFate: null,
  elderFate: null,
  sentinelFate: null,
  quarryOpen: false,
  sheepFound: false,
  bombs: 0,
  chests: [],
  bushes: [],
  talked: [],
  tutorialDone: false,
  townsCleared: [],
  caches: [],
  hippieMet: false,
  syrupStash: false,
  residentFate: null,
  homeX: 0.5,
  homeY: 0.5,
  geoTown: null,
  geoLat: null,
  geoLng: null,
  tropoverse: false,
  riflesTaken: [],
  bottles: ["empty", "empty"],
  returnMap: null,
  returnX: 0,
  returnY: 0,
  relics: ["sword"],
  ySlot: null,
  arrows: 0,
  keys: 0,
  year: 2026,
  lifePath: "adventurer",
  graves: [],
  plots: [],
  lanternOn: false,
  ipodReady: false,
  homeMap: "middlebury",
  homeTileX: 0,
  homeTileY: 0,
  spectrumFate: null,
  deck: { tracks: [], nowPlayingId: null, position: 0 },
  afterlifeHost: null,
  lastDeed: "",
  returnedFromDeath: false,
};
