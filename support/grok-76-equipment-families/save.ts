import { ITEM_BY_ID } from "./catalog.ts";
import type { BodyId, EquipSlot, Loadout, Presence } from "./types.ts";
import { BODIES, EQUIP_SLOTS } from "./types.ts";

export const FAMILY_SAVE_KEY = "preincarnation.family-loot.v1";
export const FAMILY_SAVE_VERSION = 1;

type SaveBlob = {
  version: number;
  loadout: Loadout;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function serializeLoadout(loadout: Loadout): string {
  const blob: SaveBlob = {
    version: FAMILY_SAVE_VERSION,
    loadout: {
      version: 1,
      body: loadout.body,
      instances: loadout.instances.map((instance) => ({
        instanceId: instance.instanceId,
        defId: instance.defId,
        presence: instance.presence,
        ...(instance.slot ? { slot: instance.slot } : {}),
      })),
    },
  };
  return JSON.stringify(blob);
}

export function hydrateLoadout(raw: string): { ok: true; loadout: Loadout } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Save is not readable." };
  }
  if (!isRecord(parsed)) return { ok: false, error: "Save is not an object." };
  if (parsed.version !== FAMILY_SAVE_VERSION) return { ok: false, error: "Save version is not this ledger." };
  const loadout = parsed.loadout;
  if (!isRecord(loadout)) return { ok: false, error: "Save has no loadout." };
  if (loadout.version !== 1) return { ok: false, error: "Loadout version is not 1." };
  if (!BODIES.includes(loadout.body as BodyId)) return { ok: false, error: "Unknown body." };
  if (!Array.isArray(loadout.instances)) return { ok: false, error: "Instances are missing." };

  const instances: Loadout["instances"] = [];
  const seen = new Set<string>();
  for (const entry of loadout.instances) {
    if (!isRecord(entry)) return { ok: false, error: "An instance is not an object." };
    const instanceId = entry.instanceId;
    const defId = entry.defId;
    const presence = entry.presence;
    if (typeof instanceId !== "string" || typeof defId !== "string") return { ok: false, error: "Instance ids are missing." };
    if (seen.has(instanceId)) return { ok: false, error: `Duplicate instance id ${instanceId}.` };
    seen.add(instanceId);
    const def = ITEM_BY_ID.get(defId);
    if (!def) return { ok: false, error: `Unknown piece ${defId}.` };
    if (presence !== "equipped" && presence !== "carried" && presence !== "used") {
      return { ok: false, error: "Presence is invalid." };
    }
    if (presence === "equipped") {
      const slot = entry.slot;
      if (!EQUIP_SLOTS.includes(slot as EquipSlot)) return { ok: false, error: "Equipped piece has a bad slot." };
      if (def.slot === "pack" || def.slot !== slot) return { ok: false, error: `${def.name} cannot be saved in ${String(slot)}.` };
      instances.push({ instanceId, defId, presence: presence as Presence, slot: slot as EquipSlot });
    } else if (entry.slot !== undefined) {
      return { ok: false, error: "A pack piece was saved with a slot." };
    } else {
      instances.push({ instanceId, defId, presence });
    }
  }

  return { ok: true, loadout: { version: 1, body: loadout.body as BodyId, instances } };
}
