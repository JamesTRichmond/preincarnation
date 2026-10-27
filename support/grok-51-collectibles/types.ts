/** Fourteen Winters collectible ledger — shared types. One ruleset, no fork. */

export type Affinity = "hearth" | "trail" | "chapel" | "river" | "night" | "generation";

/** Affinities a deck may declare. Generation cards count toward whichever is chosen. */
export type Bond = Exclude<Affinity, "generation">;

export type CardType = "kin" | "place" | "memory" | "weather" | "heirloom";

export type Rarity = "common" | "uncommon" | "rare";

export type SlotKind = "mantel" | "wall" | "table" | "shelf" | "floor";

export type Effect =
  | { op: "draw"; n: number }
  | { op: "mend"; n: number }
  | { op: "ease"; n: number }
  | { op: "stores"; n: number }
  | { op: "well"; n: number }
  | { op: "search"; n: number }
  | { op: "shield" }
  | { op: "tax"; n: number }
  | { op: "bond"; n: number }
  | { op: "recall" };

export interface CardDef {
  id: string;
  name: string;
  affinity: Affinity;
  type: CardType;
  rarity: Rarity;
  cost: number;
  kindling: number;
  effects: Effect[];
  /** Winter the card was first understood. */
  year: number;
  /** What the family thought it meant that winter. */
  then: string;
  /** A different understanding at least fourteen years later. */
  later?: { year: number; text: string };
}

export interface DecorationDef {
  id: string;
  name: string;
  kind: SlotKind;
  /** Every kind of room slot this object can physically occupy. */
  fits: SlotKind[];
  material: string;
  mark: string;
  year: number;
  then: string;
  later: { year: number; text: string };
  look: string;
  /** Inscription or wear visible only when the object is turned to 180°. */
  verso: string;
  /** If set, the object is not in the house until that hunt's cache is opened. */
  foundIn?: string;
}

export interface RoomSlot {
  id: string;
  kind: SlotKind;
  label: string;
}

export interface Discovery {
  id: string;
  sourceId: string;
  speaker: string;
  text: string;
  kind: "response" | "finding" | "verdict" | "cache";
}

export interface DocumentDef {
  id: string;
  kind: "map" | "letter" | "evidence";
  title: string;
  /** Quest papers cannot be discarded. Always true for this catalog. */
  protected: true;
  year: number;
  from: string;
  to: string;
  body: string;
  later: { year: number; text: string };
  /** Hunt id, or investigation id. Every paper belongs to one real thread. */
  huntId?: string;
  investigationId?: string;
  /** Spoken when a letter or map is read. */
  response?: { speaker: string; text: string };
  /** Entered on the investigation when evidence is read. */
  finding?: string;
  /** Documents placed in hand when this paper is read. */
  grants?: string[];
  /** A further paper that can be taken from a real shelf after this one is read. */
  followUp?: { id: string; label: string };
}

export interface InvestigationDef {
  id: string;
  title: string;
  question: string;
  /** Evidence ids that must all be read before a verdict. */
  evidence: string[];
  verdict: { speaker: string; text: string };
}

export interface HuntNode {
  id: string;
  name: string;
  look: string;
  /** Said if you search here and it is not the cache. Never names a pin. */
  refusal: string;
  neighbors: string[];
}

export interface TreasureMapDef {
  docId: string;
  /** Node ids from the hunt start through the cache, along open paths. */
  path: string[];
}

export interface HuntDef {
  id: string;
  title: string;
  start: string;
  cache: string;
  cacheLook: string;
  /** Spoken once, the winter you actually open it. */
  cacheVoice: { speaker: string; text: string };
  maps: [TreasureMapDef, TreasureMapDef];
  /** Granted once. Decorations already owned become recorded duplicates. */
  grants: string[];
  nodes: HuntNode[];
}

export interface PlacedObject {
  decorationId: string;
  rotation: number;
}

export interface ZoneCard {
  instance: string;
  cardId: string;
  attachedTo?: string;
}

export type KeepingPhase = "play" | "search" | "won" | "lost";

export interface PendingSearch {
  /** Options are card ids, in deck order, not yet removed. */
  options: string[];
}

export interface Keeping {
  seed: number;
  winter: number;
  hearths: number;
  shield: boolean;
  stores: number;
  burden: number;
  bonusStoke: number;
  phase: KeepingPhase;
  deck: string[];
  hand: string[];
  kin: ZoneCard[];
  places: ZoneCard[];
  heirlooms: ZoneCard[];
  weather: ZoneCard | null;
  kept: string[];
  playedMemories: string[];
  pending: PendingSearch | null;
  log: string[];
  seq: number;
}

export interface DeckList {
  id: string;
  name: string;
  bond: Bond;
  cards: string[];
}

export interface Excursion {
  huntId: string;
  mapId: string;
  nodeId: string;
  visited: string[];
}

/** Versioned plain-data save. No functions, no class instances. */
export interface Save {
  version: number;
  cards: Record<string, number>;
  /** Times a unique decoration was found again. It is not placed twice. */
  duplicates: Record<string, number>;
  decorations: string[];
  placed: Record<string, PlacedObject | null>;
  documents: string[];
  read: string[];
  /** Object ids whose later reading has opened. */
  understandings: string[];
  /** Card ids that have been played in a keeping. */
  playedCards: string[];
  discoveries: Discovery[];
  completed: string[];
  decks: DeckList[];
  activeDeckId: string;
  excursion: Excursion | null;
  huntsFound: string[];
  keeping: Keeping | null;
  /** Increments so each practice keeping shuffles differently. */
  rng: number;
  lastNotice: string;
}
