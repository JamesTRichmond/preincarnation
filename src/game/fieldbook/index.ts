export { CATALOG, INTEGRATION_NOTE, RELIC_SNAPSHOT } from "./catalog.ts";
export { createDemoContext, demoInventory, demoLedger } from "./demo.ts";
export { bindSession, createMemoryPort } from "./adapter.ts";
export type { HostInventoryPort, HostSession } from "./adapter.ts";
export {
  analyze,
  componentView,
  countNoun,
  deltasTouchProtected,
  dispatch,
  hydrate,
  inspectVisible,
  ownedQty,
  serialize,
} from "./logic.ts";
export type { SaveBlob } from "./logic.ts";
export type {
  Action,
  Analysis,
  Catalog,
  ComponentView,
  DispatchResult,
  Inspection,
  InventoryDelta,
  InventorySnapshot,
  LedgerState,
  ProjectView,
  TrackingContext,
} from "./types.ts";
