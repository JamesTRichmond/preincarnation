import type { ItemLot, StorageContainer, StorageWorld } from "./types.ts";

export function lotSignature(lot: ItemLot): string {
  const meta = Object.keys(lot.meta)
    .sort()
    .map((key) => `${key}:${String(lot.meta[key])}`)
    .join(",");
  return [lot.ownerId, lot.kind, lot.definitionId, meta].join("|");
}

export function signatureMap(world: StorageWorld): Map<string, number> {
  const map = new Map<string, number>();
  for (const container of world.containers) {
    for (const lot of container.lots) {
      const key = lotSignature(lot);
      map.set(key, (map.get(key) ?? 0) + lot.quantity);
    }
  }
  return map;
}

export function totalQuantity(world: StorageWorld): number {
  let total = 0;
  for (const container of world.containers) {
    for (const lot of container.lots) total += lot.quantity;
  }
  return total;
}

export function uniqueIds(world: StorageWorld): string[] {
  const ids: string[] = [];
  for (const container of world.containers) {
    for (const lot of container.lots) {
      if (lot.kind === "unique") ids.push(lot.id);
    }
  }
  ids.sort();
  return ids;
}

export function ownerQuantity(world: StorageWorld): Map<string, number> {
  const map = new Map<string, number>();
  for (const container of world.containers) {
    for (const lot of container.lots) {
      map.set(lot.ownerId, (map.get(lot.ownerId) ?? 0) + lot.quantity);
    }
  }
  return map;
}

export function findContainer(world: StorageWorld, id: string): StorageContainer | undefined {
  return world.containers.find((container) => container.id === id);
}

export function packOf(world: StorageWorld): StorageContainer {
  const pack = findContainer(world, world.packId);
  if (!pack || pack.kind !== "pack") {
    throw new Error(`Pack ${world.packId} is missing.`);
  }
  return pack;
}

export function quantityOf(
  world: StorageWorld,
  containerId: string,
  definitionId: string,
  ownerId?: string,
): number {
  const container = findContainer(world, containerId);
  if (!container) return 0;
  return container.lots.reduce((sum, lot) => {
    if (lot.definitionId !== definitionId) return sum;
    if (ownerId && lot.ownerId !== ownerId) return sum;
    return sum + lot.quantity;
  }, 0);
}

export function containerOfLot(world: StorageWorld, lotId: string): StorageContainer | undefined {
  return world.containers.find((container) => container.lots.some((lot) => lot.id === lotId));
}

function sameMap(left: Map<string, number>, right: Map<string, number>): boolean {
  if (left.size !== right.size) return false;
  for (const [key, value] of left) {
    if (right.get(key) !== value) return false;
  }
  return true;
}

export function conservationError(before: StorageWorld, after: StorageWorld): string | null {
  if (!sameMap(signatureMap(before), signatureMap(after))) {
    return "Item counts changed.";
  }
  if (!sameMap(ownerQuantity(before), ownerQuantity(after))) {
    return "Ownership changed.";
  }
  const beforeIds = uniqueIds(before);
  const afterIds = uniqueIds(after);
  if (beforeIds.join("\0") !== afterIds.join("\0")) {
    return "A unique instance was lost or duplicated.";
  }
  return null;
}

export function assertConserved(before: StorageWorld, after: StorageWorld): void {
  const error = conservationError(before, after);
  if (error) throw new Error(error);
  assertShape(after);
}

export function assertShape(world: StorageWorld): void {
  const ids = new Set<string>();
  const containerIds = new Set<string>();
  for (const container of world.containers) {
    if (containerIds.has(container.id)) throw new Error(`Duplicate container ${container.id}.`);
    containerIds.add(container.id);
    if (container.lots.length > container.slotCapacity) {
      throw new Error(`${container.name} is over its slot capacity.`);
    }
    for (const lot of container.lots) {
      if (ids.has(lot.id)) throw new Error(`Duplicate lot ${lot.id}.`);
      ids.add(lot.id);
      if (!Number.isInteger(lot.quantity) || lot.quantity < 1) {
        throw new Error(`Bad quantity on ${lot.id}.`);
      }
      if (!Number.isInteger(lot.maxStack) || lot.maxStack < 1 || lot.quantity > lot.maxStack) {
        throw new Error(`Stack overflow on ${lot.id}.`);
      }
      if (lot.kind === "unique" && (lot.quantity !== 1 || lot.maxStack !== 1)) {
        throw new Error(`Unique instance ${lot.id} was split or stacked.`);
      }
    }
  }
  if (!containerIds.has(world.packId)) throw new Error("Pack container is missing.");
}

export function validateWorld(world: StorageWorld): void {
  if (!world || typeof world !== "object") throw new Error("Save is empty.");
  if (!Array.isArray(world.containers) || !world.profile) throw new Error("Save is missing storage.");
  if (!Number.isInteger(world.nextLotSeq) || world.nextLotSeq < 0) {
    throw new Error("Save has a bad id sequence.");
  }
  assertShape(world);
}
