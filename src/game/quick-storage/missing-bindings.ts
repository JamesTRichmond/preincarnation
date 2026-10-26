import type { ContainerAccess, ContainerKind, ItemLot, StorageContainer } from "./types.ts";

/**
 * What the live PREINCARNATION inventory must provide.
 * None of these exist in this workspace — ReferenceStorageAdapter stands in.
 */
export interface LiveStoragePort {
  readPack(actorId: string): Promise<ItemLot[]>;
  commitPack(actorId: string, lots: ItemLot[]): Promise<void>;
  readContainers(actorId: string): Promise<StorageContainer[]>;
  commitContainer(actorId: string, container: StorageContainer): Promise<void>;
  readAccess(
    actorId: string,
    containerId: string,
  ): Promise<ContainerAccess & { kind: ContainerKind; name: string }>;
}

export interface MissingBinding {
  id: string;
  need: string;
}

export const MISSING_BINDINGS: MissingBinding[] = [
  {
    id: "actor-pack",
    need: "The fourteen-year pack: stack lots, unique instances, favorite marks, and equipped slots.",
  },
  {
    id: "item-registry",
    need: "Usable-item definitions — names, tags, and max stacks — from the Vermont item ecosystem.",
  },
  {
    id: "visit-graph",
    need: "Which physical containers this life has opened. Unvisited storage must stay unreachable.",
  },
  {
    id: "ownership",
    need: "Owned containers versus a neighbor's. Routing must not write storage you do not own.",
  },
  {
    id: "proximity",
    need: "A nearby query for physical storage. Remote buildings are not implicit destinations.",
  },
  {
    id: "shared-material",
    need: "Established shared stores, such as the town grain ark, and whether this actor may use them.",
  },
  {
    id: "equipment",
    need: "The equipped-item query so worn gear is never swept into a chest.",
  },
  {
    id: "save-snapshot",
    need: "The campaign save slot. The reference adapter persists only in this browser.",
  },
];
