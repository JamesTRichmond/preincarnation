import { CONTAINERS } from "./catalog.ts";
import { SCHEMA, type ContainerId, type Instance, type Provenance, type World } from "./types.ts";

export const SEED = {
  rivet: "inst-rivet",
  oil: "inst-oil",
  biscuit: "inst-biscuit",
  resin: "inst-resin",
  lens: "inst-lens",
  wax: "inst-wax",
  coat: "inst-coat",
  whistle: "inst-whistle",
  gears: "inst-gears",
  fresnel: "inst-fresnel",
  waybill: "inst-waybill",
  mud: "inst-mud",
  seals: "inst-seals",
} as const;

function prov(originKey: string, serial: string | null): Provenance {
  return { originKey, originParams: {}, serial, chain: [] };
}

function piece(partial: Omit<Instance, "parentId" | "lotJournalId" | "archived"> & { parentId?: string | null }): Instance {
  return {
    parentId: null,
    lotJournalId: null,
    archived: false,
    ...partial,
  };
}

export function cloneWorld(world: World): World {
  return structuredClone(world);
}

export function createWorld(): World {
  const capacity = {
    pack: 8,
    stash: 8,
    equipped: 2,
    "project-lantern": 4,
    "quest-satchel": 6,
    vendor: 8,
    void: 8,
  } satisfies World["capacity"];

  const instances: Record<string, Instance> = {
    [SEED.rivet]: piece({
      id: SEED.rivet,
      defId: "rivet",
      quantity: 40,
      containerId: "pack",
      equipSlot: null,
      provenance: prov("origin.quarry", null),
      reservationId: null,
      questId: null,
    }),
    [SEED.oil]: piece({
      id: SEED.oil,
      defId: "oil",
      quantity: 12,
      containerId: "pack",
      equipSlot: null,
      provenance: prov("origin.stores", null),
      reservationId: null,
      questId: null,
    }),
    [SEED.biscuit]: piece({
      id: SEED.biscuit,
      defId: "biscuit",
      quantity: 8,
      containerId: "stash",
      equipSlot: null,
      provenance: prov("origin.stores", null),
      reservationId: null,
      questId: null,
    }),
    [SEED.resin]: piece({
      id: SEED.resin,
      defId: "resin",
      quantity: 6,
      containerId: "stash",
      equipSlot: null,
      provenance: prov("origin.quarry", null),
      reservationId: null,
      questId: null,
    }),
    [SEED.lens]: piece({
      id: SEED.lens,
      defId: "lens",
      quantity: 1,
      containerId: "pack",
      equipSlot: null,
      provenance: prov("origin.mara", "MR-014"),
      reservationId: null,
      questId: null,
    }),
    [SEED.wax]: piece({
      id: SEED.wax,
      defId: "wax",
      quantity: 1,
      containerId: "stash",
      equipSlot: null,
      provenance: prov("origin.quarter", "QM-7"),
      reservationId: null,
      questId: null,
    }),
    [SEED.coat]: piece({
      id: SEED.coat,
      defId: "coat",
      quantity: 1,
      containerId: "equipped",
      equipSlot: "body",
      provenance: prov("origin.issued", "WC-2"),
      reservationId: null,
      questId: null,
    }),
    [SEED.whistle]: piece({
      id: SEED.whistle,
      defId: "whistle",
      quantity: 1,
      containerId: "equipped",
      equipSlot: "tool",
      provenance: prov("origin.whistle", "SW-9"),
      reservationId: null,
      questId: null,
    }),
    [SEED.gears]: piece({
      id: SEED.gears,
      defId: "gears",
      quantity: 6,
      containerId: "project-lantern",
      equipSlot: null,
      provenance: prov("origin.project", null),
      reservationId: "lantern",
      questId: null,
    }),
    [SEED.fresnel]: piece({
      id: SEED.fresnel,
      defId: "fresnel",
      quantity: 1,
      containerId: "project-lantern",
      equipSlot: null,
      provenance: prov("origin.project", "FB-1"),
      reservationId: "lantern",
      questId: null,
    }),
    [SEED.waybill]: piece({
      id: SEED.waybill,
      defId: "waybill",
      quantity: 1,
      containerId: "quest-satchel",
      equipSlot: null,
      provenance: prov("origin.courier", "WB-3"),
      reservationId: null,
      questId: "courier",
    }),
    [SEED.mud]: piece({
      id: SEED.mud,
      defId: "mud",
      quantity: 1,
      containerId: "quest-satchel",
      equipSlot: null,
      provenance: prov("origin.courier", "MS-4"),
      reservationId: null,
      questId: "courier",
    }),
    [SEED.seals]: piece({
      id: SEED.seals,
      defId: "seals",
      quantity: 3,
      containerId: "quest-satchel",
      equipSlot: null,
      provenance: prov("origin.courier", null),
      reservationId: null,
      questId: "courier",
    }),
  };

  return {
    schema: SCHEMA,
    revision: 1,
    tick: 0,
    nextId: 100,
    instances,
    currency: { gold: 40, reputation: 0 },
    seals: [],
    journal: [],
    receipts: {},
    inflight: {},
    capacity,
    notes: [],
  };
}

export function instancesIn(world: World, containerId: ContainerId): Instance[] {
  return Object.values(world.instances)
    .filter((inst) => !inst.archived && inst.containerId === containerId)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function activeQuantity(world: World, defId: string): number {
  return Object.values(world.instances)
    .filter((inst) => !inst.archived && inst.defId === defId)
    .reduce((sum, inst) => sum + inst.quantity, 0);
}

export function occupancy(world: World): Record<ContainerId, number> {
  const counts = Object.fromEntries(CONTAINERS.map((id) => [id, 0])) as Record<ContainerId, number>;
  for (const inst of Object.values(world.instances)) {
    if (!inst.archived && inst.containerId) counts[inst.containerId] += 1;
  }
  return counts;
}

/** Test and field helper. Adds unrelated bin tags and bumps the revision. */
export function spawnFillers(world: World, containerId: ContainerId, count: number): World {
  const next = cloneWorld(world);
  for (let i = 0; i < count; i += 1) {
    const id = `inst-${next.nextId}`;
    next.nextId += 1;
    next.instances[id] = piece({
      id,
      defId: "tag",
      quantity: 1,
      containerId,
      equipSlot: null,
      provenance: prov("origin.stores", null),
      reservationId: null,
      questId: null,
    });
  }
  next.revision += 1;
  next.tick += 1;
  return next;
}

/** Places another body-slot coat directly, for the occupied-slot undo case. */
export function spawnBodyGear(world: World, serial: string): World {
  const next = cloneWorld(world);
  const id = `inst-${next.nextId}`;
  next.nextId += 1;
  next.instances[id] = piece({
    id,
    defId: "coat",
    quantity: 1,
    containerId: "equipped",
    equipSlot: "body",
    provenance: prov("origin.issued", serial),
    reservationId: null,
    questId: null,
  });
  next.revision += 1;
  next.tick += 1;
  return next;
}
