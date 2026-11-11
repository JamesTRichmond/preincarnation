import type { ReactNode } from "react";

export type Facing = "n" | "e" | "s" | "w";
export type TextPace = "slow" | "steady" | "fast";
export type TouchMode = "auto" | "always" | "never";
export type HintStyle = "auto" | "keys" | "buttons";
export type InputDevice = "keyboard" | "gamepad" | "touch";
export type SlotIntent = "new" | "continue";
export type JournalFilter = "all" | "inked" | "loose";

export type ScreenId =
  | "title"
  | "slots"
  | "loading"
  | "error"
  | "character"
  | "field"
  | "pause"
  | "settings"
  | "inventory"
  | "quick"
  | "bottles"
  | "upgrades"
  | "journal"
  | "entry"
  | "map"
  | "place"
  | "history"
  | "credits"
  | "ending"
  | "epitaph";

export interface ToolDef {
  id: string;
  name: string;
  icon: string;
  blurb: string;
}

export interface BottleDef {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  /** Hearts restored per sip. Zero means the bottle is used, not drunk for health. */
  heal: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  icon: string;
  blurb: string;
}

export interface PlaceDef {
  id: string;
  name: string;
  memory: string;
}

export interface EraDef {
  id: string;
  name: string;
  blurb: string;
}

export interface EndingDef {
  id: string;
  name: string;
  epitaph: string;
}

export interface EvidenceDef {
  id: string;
  title: string;
  placeId: string;
  body: string;
}

export interface KeyDef {
  id: string;
  name: string;
  icon: string;
  /** What lock this key is cut for. Identification, not an instruction. */
  answers: string;
  lockId: string;
}

export interface CharacterDef {
  name: string;
  epithet: string;
  background: string;
  bondName: string;
  bondTitle: string;
  bond: string;
  ideal: string;
  flaw: string;
}

export interface GameCatalog {
  title: string;
  county: string;
  tools: ToolDef[];
  bottles: BottleDef[];
  upgrades: UpgradeDef[];
  places: PlaceDef[];
  eras: EraDef[];
  endings: EndingDef[];
  evidence: EvidenceDef[];
  keys: KeyDef[];
  character: CharacterDef;
}

export interface BottleCarry {
  id: string;
  kindId: string;
  sips: number;
}

export interface LifeChapter {
  returnIndex: number;
  eraId: string;
  years: number;
  /** How the chapter closed, in prose. The living chapter is not an instruction. */
  closed: string;
  living: boolean;
}

/** Engine-owned life. The interface reads this and returns it with intentional edits only. */
export interface GameplaySnapshot {
  lifeName: string;
  returnIndex: number;
  eraId: string;
  placeId: string;
  position: { x: number; y: number };
  facing: Facing;
  hearts: { current: number; max: number };
  ownedToolIds: string[];
  activeToolId: string | null;
  quickSlots: Array<string | null>;
  bottles: BottleCarry[];
  upgradeIds: string[];
  discoveredPlaceIds: string[];
  evidence: Array<{ id: string; inked: boolean }>;
  keyIds: string[];
  openedLockIds: string[];
  history: LifeChapter[];
  playSeconds: number;
  completion: null | { endingId: string };
  flags: Record<string, boolean>;
}

export interface SaveSlot {
  id: string;
  occupied: boolean;
  damaged: boolean;
  snapshot: GameplaySnapshot | null;
}

export interface Settings {
  music: number;
  sfx: number;
  screenShake: boolean;
  textPace: TextPace;
  reduceMotion: boolean;
  touch: TouchMode;
  hints: HintStyle;
}

export interface LoadRequest {
  slotId: string;
  repair: boolean;
  nonce: number;
}

export interface PersistRequest {
  slotId: string;
  snapshot: GameplaySnapshot;
}

export type ModalState =
  | { kind: "overwrite"; slotId: string }
  | { kind: "quit" }
  | { kind: "use-bottle"; bottleId: string }
  | null;

export interface RetentionReport {
  positionHeld: boolean;
  timeHeld: boolean;
  eraHeld: boolean;
  facingHeld: boolean;
  placeHeld: boolean;
  discoveriesHeld: boolean;
}

/**
 * What the interface needs from the game. Fixtures implement this in memory.
 * The integration owner supplies the engine implementation and passes it to InterfaceApp.
 */
export interface InterfaceBindings {
  source: "engine" | "dev-fixture";
  /** Shown in the frame when this is not live engine data. */
  sourceLabel: string;
  catalog: GameCatalog;
  /** When false, field movement is forwarded and the snapshot position is left alone. */
  simulateField: boolean;
  readSlots(): SaveSlot[];
  /**
   * Resolve a page. When `repair` is true, a torn page may become readable.
   * Reject with an Error message the player can read.
   */
  loadSlot(slotId: string, repair: boolean): Promise<GameplaySnapshot>;
  /** Start a blank life on a page. Omit only if the engine forbids new games. */
  createLife?(): Promise<GameplaySnapshot>;
  saveSlot(slotId: string, snapshot: GameplaySnapshot): Promise<void>;
  readSettings(): Settings;
  writeSettings(settings: Settings): Promise<void>;
  onFieldIntent?(intent: Intent): void;
  /** Replace the field stand-in. Omit it and the labeled stand-in is used. */
  renderField?(snapshot: GameplaySnapshot): ReactNode;
}

export type Dir = "up" | "down" | "left" | "right";

export type Intent =
  | { type: "move"; dir: Dir }
  | { type: "confirm" }
  | { type: "cancel" }
  | { type: "pause" }
  | { type: "shortcut"; id: "inventory" | "map" | "journal" }
  | { type: "quick-cycle"; delta: -1 | 1 }
  | { type: "quick-slot"; index: number };

export interface FocusItem {
  id: string;
  row: number;
  col: number;
  disabled?: boolean;
  scrollable?: boolean;
  scrollKey?: string;
  scrollMax?: number;
  kind?: "button" | "slider" | "toggle" | "choice";
}
