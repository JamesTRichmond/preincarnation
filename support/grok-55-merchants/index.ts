/** PREINCARNATION trade module.
 * Currency is the mark (`CURRENCY`). Do not add another coin.
 * World item catalogs stay elsewhere; this folder owns stall prices,
 * quotes, commits, succession, and replenishment. */

export { CURRENCY, ERAS } from "./types.ts";
export type {
  Condition,
  EraId,
  Fairness,
  Intent,
  ItemInstance,
  MarketState,
  OfferView,
  Quote,
} from "./types.ts";
export { ITEMS, item, knownValue, SIGNIFICANCE_LABEL, CONDITION_LABEL } from "./catalog.ts";
export { STALLS, stallDef } from "./stalls.ts";
export {
  authoringProblems,
  autoPicks,
  commit,
  compareOffers,
  countItem,
  createInitialState,
  faceFor,
  fairnessOfAsk,
  fairnessOfSale,
  isOpen,
  postedAsk,
  quote,
  totalMarks,
  unitSale,
} from "./engine.ts";
export { flipSeries, runSimulations } from "./simulate.ts";
export type { SimCheck } from "./simulate.ts";
