import { familyById, itemById } from "./catalog.ts";
import type { BodyId, EquipSlot, Instance, Loadout } from "./types.ts";
import { fid } from "./types.ts";

function equipped(n: number, slot: EquipSlot): Instance {
  const defId = fid(n);
  return { instanceId: `${defId}#1`, defId, presence: "equipped", slot };
}
function carried(n: number): Instance {
  const defId = fid(n);
  return { instanceId: `${defId}#1`, defId, presence: "carried" };
}

function loadout(body: BodyId, instances: Instance[]): Loadout {
  return { version: 1, body, instances };
}

function instanceFor(defId: string): Instance {
  const def = itemById(defId);
  if (def.countsWhen === "equipped") {
    return { instanceId: `${defId}#1`, defId, presence: "equipped", slot: def.slot as EquipSlot };
  }
  if (def.countsWhen === "used") return { instanceId: `${defId}#1`, defId, presence: "used" };
  return { instanceId: `${defId}#1`, defId, presence: "carried" };
}

export function fullFamilyLoadout(familyId: string, body: BodyId = "wanderer"): Loadout {
  const family = familyById(familyId);
  return loadout(body, family.pieceIds.map(instanceFor));
}

export function partialFamilyLoadout(familyId: string, count: number, body: BodyId = "wanderer"): Loadout {
  const full = fullFamilyLoadout(familyId, body);
  return { ...full, instances: full.instances.slice(0, count) };
}

export const SHOWCASE = ["floodkeepers", "quarry-night", "orchard-guardians", "unnamed-witnesses"] as const;

/** Pike, carbide lamp, oilskin, gauge. Flood and quarry, neither complete. */
export function creekLamp(): Loadout {
  return loadout("wanderer", [equipped(1, "hand"), equipped(7, "y"), equipped(3, "worn"), carried(4)]);
}

/** Dirk, statement glass, quiet soles, second pocket. Two families, neither complete. */
export function firstLie(): Loadout {
  return loadout("smuggler", [equipped(71, "hand"), equipped(17, "y"), equipped(73, "worn"), carried(74)]);
}

/** Ice saw, bail bucket, shearling, grafting twine. */
export function coldBucket(): Loadout {
  return loadout("wanderer", [equipped(51, "hand"), equipped(2, "y"), equipped(53, "worn"), carried(14)]);
}

export type Preset = {
  id: string;
  name: string;
  note: string;
  loadout: Loadout;
};

export function presets(): Preset[] {
  return [
    {
      id: "flood",
      name: "Floodkeepers, complete",
      note: "Stillwater. Hard to soak, slower, and the swing has a ceiling.",
      loadout: fullFamilyLoadout("floodkeepers"),
    },
    {
      id: "quarry",
      name: "Quarry night, complete",
      note: "Black shift. The lamp is free. Water is not.",
      loadout: fullFamilyLoadout("quarry-night"),
    },
    {
      id: "orchard",
      name: "Orchard guardians, complete",
      note: "Closed orchard. Beasts suffer. Nothing knits.",
      loadout: fullFamilyLoadout("orchard-guardians"),
    },
    {
      id: "witnesses",
      name: "Unnamed witnesses, complete",
      note: "The record. Blows come back. Your own damage is capped.",
      loadout: fullFamilyLoadout("unnamed-witnesses"),
    },
    {
      id: "creek-lamp",
      name: "Mixed: creek lamp",
      note: "Pike, carbide lamp, oilskin, gauge. No full bargain.",
      loadout: creekLamp(),
    },
    {
      id: "first-lie",
      name: "Mixed: first cut",
      note: "Dirk, statement glass, quiet soles, second pocket.",
      loadout: firstLie(),
    },
    {
      id: "cold-bucket",
      name: "Mixed: cold bucket",
      note: "Ice saw, bail bucket, shearling, grafting twine.",
      loadout: coldBucket(),
    },
  ];
}
