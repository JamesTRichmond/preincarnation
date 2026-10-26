import { CATALOG } from "./catalog.ts";
import { applyInventoryDeltas, dispatch } from "./logic.ts";
import type { Action, Catalog, DispatchResult, InventoryDelta, InventorySnapshot, TrackingContext } from "./types.ts";

/**
 * Host port. The inventory session implements this. Component tracking only
 * reads a snapshot and proposes deltas — it does not keep a second bag.
 */
export interface HostInventoryPort {
  read(): InventorySnapshot;
  apply(deltas: InventoryDelta[]): void;
}

export function createMemoryPort(initial: InventorySnapshot): HostInventoryPort & {
  snapshot(): InventorySnapshot;
} {
  let inventory = structuredClone(initial);
  return {
    read: () => structuredClone(inventory),
    apply(deltas) {
      inventory = applyInventoryDeltas(inventory, deltas);
    },
    snapshot: () => structuredClone(inventory),
  };
}

export type HostSession = {
  catalog: Catalog;
  port: HostInventoryPort;
  context: () => TrackingContext;
  dispatch: (action: Action) => DispatchResult;
};

/** Bind a ledger to a host port. Fixture sessions pass integration: "fixture-pending". */
export function bindSession(
  port: HostInventoryPort,
  ledgerContext: TrackingContext,
  catalog: Catalog = CATALOG,
): HostSession {
  let ctx: TrackingContext = { ...structuredClone(ledgerContext), inventory: port.read() };
  return {
    catalog,
    port,
    context: () => structuredClone(ctx),
    dispatch(action) {
      const live: TrackingContext = { ...ctx, inventory: port.read() };
      const result = dispatch(catalog, live, action);
      if (result.deltas.length) port.apply(result.deltas);
      ctx = { ...result.ctx, inventory: port.read() };
      return { ...result, ctx };
    },
  };
}
