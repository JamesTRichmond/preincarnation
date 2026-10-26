import type { RelicId } from "./ids.ts";
import type { RelicInstance, World } from "./types.ts";

export interface VeinSave {
  version: 1;
  instances: RelicInstance[];
  placed: World["placed"];
  veinBank: RelicInstance[];
  sources: World["sources"];
  flags: World["flags"];
  lineage: World["lineage"];
}

export function capturePersistence(world: World): VeinSave {
  return {
    version: 1,
    instances: structuredClone(world.inventory),
    placed: structuredClone(world.placed),
    veinBank: structuredClone(world.veinBank),
    sources: structuredClone(world.sources),
    flags: structuredClone(world.flags),
    lineage: structuredClone(world.lineage),
  };
}

export function applyPersistence(world: World, save: VeinSave): World {
  const seen = new Set<RelicId>();
  const claim = (id: RelicId) => {
    if (seen.has(id)) {
      throw new Error(`Save refused: duplicate instance of ${id}`);
    }
    seen.add(id);
  };
  for (const item of save.instances) claim(item.relicId);
  for (const place of save.placed) claim(place.instance.relicId);
  for (const item of save.veinBank) claim(item.relicId);

  const next = structuredClone(world);
  next.inventory = structuredClone(save.instances);
  next.placed = structuredClone(save.placed);
  next.veinBank = structuredClone(save.veinBank);
  next.sources = structuredClone(save.sources);
  next.flags = { ...next.flags, ...structuredClone(save.flags) };
  next.lineage = structuredClone(save.lineage);
  next.log.push("The vein returned what it had banked.");
  return next;
}
