export type Suit = "ember" | "frost" | "sap" | "gall" | "bone";
export type CardType = "provision" | "craft" | "omen" | "lesson" | "tool";
export type Timing = "dawn" | "day" | "dusk" | "any";
export type Phase = "dawn" | "day" | "dusk";
export type InstrumentId = "bone-flute" | "lyre" | "frame-drum" | "bowed-box" | "bell-branch";
export type ActionKind = "recipe" | "instrument" | "notebook" | "sugarline" | "camp";
export type PlateMotif =
  | "lamp"
  | "ink"
  | "steam"
  | "boil"
  | "print"
  | "flute"
  | "braid"
  | "wash"
  | "dip"
  | "rub"
  | "peel"
  | "smoke"
  | "drum"
  | "salt"
  | "coal"
  | "press"
  | "notch"
  | "peg"
  | "knot"
  | "wrap";

export type Effect =
  | { op: "gain"; heat?: number; ration?: number; ink?: number }
  | { op: "draw"; n: 1 | 2 }
  | { op: "shelter"; n: 1 | 2 | 3 }
  | { op: "kindle" }
  | { op: "inscribe"; manualId: string }
  | { op: "playMusic"; pieceId: string }
  | { op: "revealRecipe"; recipeId: string }
  | { op: "mend"; n: 1 | 2 | 3 }
  | { op: "scout"; puzzleId: string }
  | { op: "store"; n: 1 | 2 };

export type Card = {
  id: string;
  name: string;
  suit: Suit;
  type: CardType;
  timing: Timing;
  /** Informational: which of the fourteen winters the practice was learned. */
  winterLearned: number;
  cost: { heat: number; ration: number; ink: number };
  effects: Effect[];
  flavor: string;
};

export type Piece = {
  id: string;
  title: string;
  instrument: InstrumentId;
  tempoBpm: number;
  beatsPerBar: 3 | 4;
  scaleName: string;
  /** Semitone offsets from the root. Ignored for frame-drum. */
  scale: number[];
  rootMidi: number;
  /** Tokens: `degree:beats[:vel]`, chords `0+2:1`, rest `.:1`, bar `|`. */
  spec: string;
  note: string;
};

export type Board = {
  id: string;
  title: string;
  blurb: string;
  rows: string[];
  solution: Array<[number, number]>;
  trap: Array<[number, number]>;
  bindsMusicId: string;
};

export type ItemStack = { id: string; n: number };

export type Camp = {
  pantry: Record<string, number>;
  tuningCents: Partial<Record<InstrumentId, number>>;
  drumDamp: boolean;
  notebook: string[];
  hintCharges: number;
  frostWard: number;
  shelterToken: number;
  bankedHeat: number;
  mendBonus: number;
  rationBonus: number;
  inkPages: number;
};

export type SupportedAction = {
  id: string;
  kind: ActionKind;
  name: string;
  station: string;
  inputs: ItemStack[];
  /** Items that must be present but are not consumed. */
  tools: string[];
  outputs: ItemStack[];
  /** Phrase that must appear in the manual, naming the real result. */
  resultPhrase: string;
  perform: (camp: Camp) => Camp;
};

export type Manual = {
  id: string;
  title: string;
  motif: PlateMotif;
  actionId: string;
  /** Authored working method. Ingredient names are required in the full text. */
  procedure: string;
  caution: string;
};

export type ScheduledNote = {
  midi: number;
  startSec: number;
  endSec: number;
  vel: number;
  instrument: InstrumentId;
};

export type MatchState = {
  winters: number;
  winter: number;
  phase: Phase;
  outcome: "playing" | "survived" | "lost";
  lossReason?: string;
  hearth: number;
  heat: number;
  ration: number;
  ink: number;
  cellar: number;
  mend: number;
  shelter: number;
  hintCharges: number;
  frostWard: number;
  frostPeek: number | null;
  shelterToken: number;
  hand: string[];
  deck: string[];
  discard: string[];
  unlocked: string[];
  log: string[];
};

export type Discovery = {
  version: 1;
  found: string[];
  read: string[];
  solved: string[];
  performed: string[];
  heard: string[];
  unlocked: string[];
  camp: Camp;
};

export type HostHooks = {
  fourteenWinters?: { addCards: (cards: Card[]) => void };
  instruments?: { addPieces: (pieces: Piece[]) => void };
  sugarLine?: { addBoards: (boards: Board[]) => void };
  recipes?: { addActions: (actions: SupportedAction[]) => void };
  notebook?: { addManuals: (manuals: Manual[]) => void };
};
