import type { Container, ItemStack, Protection, World } from "./types.ts";

export function makeStack(partial: ItemStack): ItemStack {
  return partial;
}

export function bulk(partial: {
  instanceId: string;
  itemId: string;
  qty: number;
  ownerId?: string;
  protection?: Protection;
}): ItemStack {
  return {
    instanceId: partial.instanceId,
    itemId: partial.itemId,
    qty: partial.qty,
    ownerId: partial.ownerId ?? "mara",
    protection: partial.protection ?? { kind: "none" },
    provenance: { kind: "bulk" },
  };
}

export function makeContainer(partial: Container): Container {
  return partial;
}

export function makeWorld(
  containers: Container[],
  crafterId = "mara",
  revision = 1,
): World {
  return { revision, crafterId, containers };
}

/**
 * Opening state for the workbench demo. Instance ids are stable so the
 * preview can point at a real pile.
 */
export function createDemoWorld(): World {
  const belt: Container = {
    id: "belt",
    name: "Belt",
    kind: "carried",
    ownerId: "mara",
    accessGrants: [],
    depositGrants: [],
    available: true,
    capacitySlots: 10,
    stacks: [
      bulk({ instanceId: "belt-water", itemId: "component.water", qty: 2 }),
      bulk({ instanceId: "belt-onion", itemId: "component.onion", qty: 1 }),
      bulk({ instanceId: "belt-salt-sea", itemId: "component.salt.sea", qty: 1 }),
      bulk({ instanceId: "belt-oil", itemId: "component.oil", qty: 1 }),
      bulk({
        instanceId: "belt-salt-rock-fav",
        itemId: "component.salt.rock",
        qty: 4,
        protection: { kind: "favorite" },
      }),
      {
        instanceId: "belt-knife",
        itemId: "unique.knife.family",
        qty: 1,
        ownerId: "mara",
        protection: { kind: "none" },
        provenance: { kind: "unique", displayName: "Mara's road knife" },
        condition: "damaged",
      },
      bulk({ instanceId: "belt-pot", itemId: "tool.pot", qty: 1 }),
      bulk({ instanceId: "belt-kit", itemId: "tool.kit.restore", qty: 1 }),
      bulk({ instanceId: "belt-lantern", itemId: "item.lantern.field", qty: 1 }),
    ],
  };

  const pantry: Container = {
    id: "pantry",
    name: "Camp pantry",
    kind: "approved",
    ownerId: "mara",
    accessGrants: [],
    depositGrants: [],
    available: true,
    capacitySlots: 16,
    stacks: [
      bulk({ instanceId: "pantry-onion", itemId: "component.onion", qty: 3 }),
      bulk({
        instanceId: "pantry-onion-quest",
        itemId: "component.onion",
        qty: 3,
        protection: { kind: "quest", questId: "quest.supper-for-the-watch" },
      }),
      bulk({ instanceId: "pantry-root", itemId: "component.root", qty: 6 }),
      bulk({ instanceId: "pantry-salt-rock", itemId: "component.salt.rock", qty: 2 }),
      bulk({ instanceId: "pantry-water", itemId: "component.water", qty: 4 }),
      bulk({ instanceId: "pantry-leather", itemId: "component.leather.strip", qty: 3 }),
      bulk({ instanceId: "pantry-buckle", itemId: "component.buckle", qty: 2 }),
      bulk({ instanceId: "pantry-grit", itemId: "component.whetstone.grit", qty: 2 }),
      bulk({ instanceId: "pantry-bone", itemId: "component.bone", qty: 2 }),
    ],
  };

  const wagon: Container = {
    id: "wagon",
    name: "Shared wagon",
    kind: "approved",
    ownerId: "company",
    accessGrants: ["mara"],
    depositGrants: ["mara"],
    available: true,
    capacitySlots: 8,
    stacks: [
      bulk({
        instanceId: "wagon-water-shared",
        itemId: "component.water",
        qty: 1,
        ownerId: "shared",
      }),
      bulk({
        instanceId: "wagon-onion-jonah",
        itemId: "component.onion",
        qty: 9,
        ownerId: "jonah",
      }),
      bulk({ instanceId: "wagon-coil", itemId: "salvage.coil.burnt", qty: 2 }),
      bulk({ instanceId: "wagon-scrap", itemId: "component.copper.scrap", qty: 4 }),
      bulk({ instanceId: "wagon-fiber", itemId: "component.fiber", qty: 6, ownerId: "shared" }),
    ],
  };

  const jonah: Container = {
    id: "jonah-pack",
    name: "Jonah's pack",
    kind: "foreign",
    ownerId: "jonah",
    accessGrants: [],
    depositGrants: [],
    available: true,
    capacitySlots: 8,
    stacks: [
      bulk({
        instanceId: "jonah-root",
        itemId: "component.root",
        qty: 12,
        ownerId: "jonah",
      }),
      bulk({
        instanceId: "jonah-salt",
        itemId: "component.salt.sea",
        qty: 8,
        ownerId: "jonah",
      }),
      bulk({
        instanceId: "jonah-onion",
        itemId: "component.onion",
        qty: 8,
        ownerId: "jonah",
      }),
    ],
  };

  const strongroom: Container = {
    id: "strongroom",
    name: "Chapel strongroom",
    kind: "locked",
    ownerId: "mara",
    accessGrants: [],
    depositGrants: [],
    available: false,
    capacitySlots: 6,
    stacks: [bulk({ instanceId: "strongroom-salt", itemId: "component.salt.sea", qty: 20 })],
  };

  const river: Container = {
    id: "river-cache",
    name: "River cache",
    kind: "out-of-range",
    ownerId: "mara",
    accessGrants: [],
    depositGrants: [],
    available: false,
    capacitySlots: 4,
    stacks: [bulk({ instanceId: "river-root", itemId: "component.root", qty: 10 })],
  };

  const tarp: Container = {
    id: "tarp-cart",
    name: "Cart under the tarp",
    kind: "unloaded",
    ownerId: "mara",
    accessGrants: [],
    depositGrants: [],
    available: false,
    capacitySlots: 6,
    stacks: [
      bulk({ instanceId: "tarp-leather", itemId: "component.leather.strip", qty: 10 }),
    ],
  };

  const reliquary: Container = {
    id: "reliquary",
    name: "Reliquary",
    kind: "approved",
    ownerId: "mara",
    accessGrants: [],
    depositGrants: [],
    available: true,
    capacitySlots: 8,
    stacks: [
      {
        instanceId: "reliquary-ladle",
        itemId: "unique.ladle.grandmother",
        qty: 1,
        ownerId: "mara",
        protection: { kind: "none" },
        provenance: {
          kind: "unique",
          displayName: "Grandmother's ladle",
          containedComponents: [{ itemId: "component.copper.scrap", qty: 3 }],
        },
      },
      {
        instanceId: "reliquary-ring",
        itemId: "unique.ring.wedding",
        qty: 1,
        ownerId: "mara",
        protection: { kind: "none" },
        provenance: { kind: "unique", displayName: "Wedding ring" },
      },
      bulk({ instanceId: "reliquary-scrap", itemId: "component.copper.scrap", qty: 1 }),
      bulk({
        instanceId: "reliquary-oil-reserved",
        itemId: "component.oil",
        qty: 2,
        protection: { kind: "reserved", reservationId: "job.supper" },
      }),
      bulk({
        instanceId: "reliquary-bone-quest",
        itemId: "component.bone",
        qty: 1,
        protection: { kind: "quest", questId: "quest.ossuary" },
      }),
    ],
  };

  return makeWorld([belt, pantry, wagon, jonah, strongroom, river, tarp, reliquary]);
}

export const DEMO_CANDIDATES = ["belt", "pantry", "wagon", "reliquary"];

export function cloneWorld(world: World): World {
  return structuredClone(world);
}

export function findStack(world: World, instanceId: string): ItemStack | undefined {
  for (const container of world.containers) {
    const stack = container.stacks.find((entry) => entry.instanceId === instanceId);
    if (stack) return stack;
  }
  return undefined;
}

export function stackQty(world: World, instanceId: string): number {
  return findStack(world, instanceId)?.qty ?? 0;
}
