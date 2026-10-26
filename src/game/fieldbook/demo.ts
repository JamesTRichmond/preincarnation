import { CATALOG } from "./catalog.ts";
import type { InventorySnapshot, LedgerState, TrackingContext } from "./types.ts";

const INITIAL_TAGS: Record<string, number> = {
  "restore-fishing-net": 0,
  "restore-hookshot": 1,
  "cook-creemee": 2,
  "restore-mirror": 3,
};

export function demoInventory(): InventorySnapshot {
  return {
    loose: [
      { componentId: "copper-fitting", quantity: 3 },
      { componentId: "twine", quantity: 4 },
      { componentId: "flax-twine", quantity: 2 },
      { componentId: "iron-rivet", quantity: 5 },
      { componentId: "leather-lace", quantity: 1 },
      { componentId: "lamp-oil", quantity: 1 },
      { componentId: "beeswax", quantity: 3 },
      { componentId: "linen-scrap", quantity: 4 },
      { componentId: "oak-dowel", quantity: 1 },
      { componentId: "marble-chip", quantity: 1 },
      { componentId: "fish-hook", quantity: 1 },
      { componentId: "cream", quantity: 2 },
      { componentId: "maple-sugar", quantity: 2 },
      { componentId: "maple-sap", quantity: 3 },
      { componentId: "apple", quantity: 5 },
      { componentId: "salt", quantity: 2 },
      { componentId: "trout", quantity: 1 },
      { componentId: "wool-batting", quantity: 2 },
      { componentId: "bog-iron", quantity: 1 },
    ],
    objects: [
      {
        instanceId: "inst-june-net",
        objectId: "fishing-net-spare",
        visibility: "visible",
        locationLabel: "June Cabot's sugarhouse bench",
      },
      {
        instanceId: "inst-maeve-glass",
        objectId: "maeve-lantern-glass",
        visibility: "carried",
        locationLabel: "Wrapped in your coat",
      },
      {
        instanceId: "inst-mirror",
        objectId: "homestead-mirror",
        visibility: "carried",
        locationLabel: "The shrine remembers it",
      },
      {
        instanceId: "inst-rifle",
        objectId: "grandfather-3006",
        visibility: "carried",
        locationLabel: "Sling on your back",
      },
      {
        instanceId: "inst-quilt",
        objectId: "rokeby-quilt",
        visibility: "stored",
        locationLabel: "Rokeby parlor",
      },
      {
        instanceId: "inst-spool",
        objectId: "sugar-line-spool",
        visibility: "visible",
        locationLabel: "By the shrine stone",
      },
      {
        instanceId: "inst-bucket",
        objectId: "cal-sap-bucket",
        visibility: "visible",
        locationLabel: "Cal Perch's dooryard",
      },
    ],
  };
}

export function demoLedger(): LedgerState {
  return {
    version: 1,
    integration: "fixture-pending",
    materialTags: { "copper-fitting": true },
    desiredReserve: { "copper-fitting": 1, twine: 1 },
    projects: CATALOG.projects.map((project) => ({
      projectId: project.id,
      tagged: Object.prototype.hasOwnProperty.call(INITIAL_TAGS, project.id),
      priority: INITIAL_TAGS[project.id] ?? 100,
      status: "active" as const,
      progress: {},
    })),
  };
}

export function createDemoContext(): TrackingContext {
  return {
    ledger: demoLedger(),
    inventory: demoInventory(),
    runtimeSources: [],
  };
}

/** An old life that never had a book. Do not invent June's net into it. */
export function emptyFieldbook(): TrackingContext {
  return {
    ledger: {
      version: 1,
      integration: "fixture-pending",
      projects: [],
      materialTags: {},
      desiredReserve: {},
    },
    inventory: { loose: [], objects: [] },
    runtimeSources: [],
  };
}
