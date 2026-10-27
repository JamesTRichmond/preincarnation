/**
 * Fourteen Winters — collectible ledger.
 * Other rooms (homestead, notebook, quests) should import this module
 * rather than copy cards, trophies, or papers.
 * There is one card law, in ./cards.ts and ./rules.ts. Do not fork it.
 */
export { CARDS, COPY_LIMIT, copyLimit, countsAsBond, getCard, mustCard } from "./cards.ts";
export { legalDeckIncluding, surplus } from "./deck.ts";
export { DECORATIONS, ROOM_SLOTS, getDecoration, mustDecoration, rotationsFor } from "./decorations.ts";
export { DOCUMENTS, INVESTIGATIONS, STARTER_DOCUMENTS, getDocument, getInvestigation } from "./documents.ts";
export { HUNTS, getHunt, namesInOrder, pathWalks, reachableFromStart } from "./hunts.ts";
export { KEEPING_LAW, assessDeck, rulesOf } from "./rules.ts";
export {
  chooseSearch,
  effectiveBurden,
  playCard,
  resolveWinter,
  startKeeping,
  stokeOf,
  strongestLegal,
} from "./keeping.ts";
export { initialSave, laterOpen, placedIds, reduce, registerDecoration, registerDocument } from "./archive.ts";
export type { Action } from "./archive.ts";
export { SAVE_KEY, hydrate, load, migrate, persist } from "./save.ts";
export { catalogOk, census, proveReachable, validateCatalog } from "./validate.ts";
export type {
  Bond,
  CardDef,
  DecorationDef,
  Discovery,
  DocumentDef,
  HuntDef,
  Save,
} from "./types.ts";
