/** Trade ledger types for PREINCARNATION merchants.
 * One currency only: the mark. Other sessions should import CURRENCY
 * rather than invent a parallel coin. */

export const CURRENCY = {
  id: "mark",
  singular: "mark",
  plural: "marks",
  /** Spoken as "on the book." The unit does not change across eras. */
  speech: "on the book",
} as const;

export const ERAS = [
  {
    id: "1774",
    year: "1774",
    title: "Shore settlement",
    blurb: "The landing, the flats, and a new forge lane.",
  },
  {
    id: "1828",
    year: "1828",
    title: "Sheep and marble",
    blurb: "The inn kitchen, the meetinghouse, the general store.",
  },
  {
    id: "1891",
    year: "1891",
    title: "Cream and mills",
    blurb: "The creamery, the dispensary, stone dust on the road.",
  },
  {
    id: "1934",
    year: "1934",
    title: "The thin years",
    blurb: "The Grange trades work for food. Prices stay posted.",
  },
  {
    id: "1976",
    year: "1976",
    title: "Bicentennial",
    blurb: "A press, a repair bench, the old names still on the stalls.",
  },
  {
    id: "2026",
    year: "2026",
    title: "The living county",
    blurb: "Same book, same marks. The heirs are at the tables.",
  },
] as const;

export type EraId = (typeof ERAS)[number]["id"];

export type Condition = "sound" | "worn" | "cracked" | "restored";

export type Significance = "common" | "useful" | "named" | "essential";

export type Fairness = "generous" | "fair" | "steep" | "protected";

export interface ItemDef {
  id: string;
  name: string;
  tags: string[];
  /** County value before condition. Always shown. Never a hidden price. */
  baseValue: number;
  significance: Significance;
  unique?: boolean;
  stackable: boolean;
  about: string;
}

export interface ItemInstance {
  instanceId: string;
  itemId: string;
  qty: number;
  condition: Condition;
  boughtFor?: number;
  boughtFrom?: string;
  transformed?: boolean;
  inscription?: string;
}

export interface BuyInterest {
  id: string;
  itemId?: string;
  tag?: string;
  condition?: Condition;
  /** Of known value. Authored inside 0.4–2.2. */
  multiplier: number;
  /** Shown whenever this rate is the one that applies. */
  reason: string;
  /** Plain list of what this rate is for. */
  demandLabel: string;
  seasonLimit?: number;
  /** Purchase leaves the market. Required for sentimental and recognition premiums. */
  keepsake?: boolean;
}

export interface Need {
  itemId: string;
  qty: number;
  alternatives?: string[];
  /** Posted name of the swap, when alternatives exist. */
  altLabel?: string;
  condition?: Condition;
  /** Keep the piece and change it, instead of taking it. */
  become?: { itemId?: string; condition?: Condition };
  /** Must be in the pack, untouched. */
  hold?: boolean;
}

export interface BarterOffer {
  id: string;
  name: string;
  detail: string;
  inputs: Need[];
  outputs: { itemId: string; qty: number; condition: Condition }[];
  seasonLimit?: number;
}

export interface ServiceOffer {
  id: string;
  name: string;
  detail: string;
  marks: number;
  inputs: Need[];
  outputs?: { itemId: string; qty: number; condition: Condition; inscription?: boolean }[];
  seasonLimit?: number;
  meal?: boolean;
  shoreCraft?: boolean;
  dryFeet?: boolean;
  recital?: boolean;
  dressing?: boolean;
  journal: string;
  /** Whitelist. Required when any output has inscription. */
  lines?: string[];
}

export interface StockDef {
  itemId: string;
  condition: Condition;
  qty: number;
  /** 1–1.4 of known value. The margin is posted. */
  markup: number;
  target: number;
  step: number;
}

export interface Face {
  fromEra: EraId;
  name: string;
  role: string;
  greet: string;
  seeing: string;
  refuse: string;
}

export interface StallDef {
  id: string;
  place: string;
  open: { from: EraId; until: EraId };
  faces: Face[];
  purse: number;
  purseCap: number;
  /** Marks added to an open stall when a season turns. Modest on purpose. */
  income: number;
  replenish: string;
  interests: BuyInterest[];
  defaultBuy: { multiplier: number; reason: string };
  barters: BarterOffer[];
  services: ServiceOffer[];
  stock: StockDef[];
}

export interface Lot {
  lotId: string;
  itemId: string;
  condition: Condition;
  qty: number;
  markup: number;
  target: number;
  step: number;
  floorPrice?: number;
  /** Bought from the player. Never reprinted by replenishment. */
  acquired?: boolean;
}

export interface StallState {
  id: string;
  purse: number;
  stock: Lot[];
  vault: ItemInstance[];
}

export interface JournalEntry {
  id: string;
  era: EraId;
  text: string;
}

export interface MarketState {
  v: 1;
  eraIndex: number;
  season: number;
  purse: number;
  pack: ItemInstance[];
  meals: number;
  shoreCraft: boolean;
  dryFeet: boolean;
  recitals: number;
  dressings: number;
  broadsides: number;
  stalls: StallState[];
  nextId: number;
  journal: JournalEntry[];
  seasonUses: Record<string, number>;
}

export interface Pick {
  instanceId: string;
  qty: number;
}

export type Intent =
  | { kind: "buy"; stallId: string; lotId: string; qty: number }
  | { kind: "sell"; stallId: string; instanceId: string; qty: number }
  | { kind: "barter"; stallId: string; offerId: string; picks: Pick[] }
  | { kind: "service"; stallId: string; serviceId: string; picks: Pick[]; line?: string }
  | { kind: "eat"; instanceId: string }
  | { kind: "season" }
  | { kind: "generation" };

export interface OfferView {
  stallId: string;
  stallName: string;
  open: boolean;
  offer: number;
  known: number;
  fairness: Fairness;
  reason: string;
  blocked?: string;
  keepsake: boolean;
}

export interface Quote {
  ok: boolean;
  title: string;
  reason: string;
  detail: string;
  known: number | null;
  /** Positive when the player pays, negative when the player is paid. */
  playerDelta: number;
  fairness: Fairness | null;
  warnings: string[];
  opportunity?: number;
}
