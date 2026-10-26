import { CATALOG_BY_ID, PROJECT_BY_ID } from "./catalog.ts";
import { placeById } from "./places.ts";
import type { Action, ActionId, KnownWorld, LedgerRecord, WorldInstance } from "./types.ts";

export function availableActions(record: LedgerRecord): Action[] {
  if (record.synthetic || record.kind === "fixture") {
    return [{ id: "inspect", label: "Inspect fixture", enabled: true, reason: "Performance fixture. Not an authored item." }];
  }
  if (record.kind === "recipe") {
    return [
      { id: "read", label: "Read recipe", enabled: true },
      { id: "equip", label: "Equip", enabled: false, reason: "A recipe is not a thing you carry." },
      { id: "carry", label: "Take", enabled: false, reason: "A recipe is not a thing you carry." },
    ];
  }
  if (record.kind === "journal") {
    return [
      { id: "read", label: "Read entry", enabled: true },
      { id: "equip", label: "Equip", enabled: false, reason: "A journal entry is not gear." },
      { id: "carry", label: "Take", enabled: false, reason: "A journal entry is not gear." },
    ];
  }
  if (!record.accessible) {
    return [
      { id: "carry", label: "Take", enabled: false, reason: "That storage is barred." },
      { id: "equip", label: "Equip", enabled: false, reason: "That storage is barred." },
      { id: "store", label: "Store", enabled: false, reason: "That storage is barred." },
    ];
  }

  const reserved = record.reservedFor
    ? `Reserved for ${record.reservedLabel ?? record.reservedFor}. Release it first.`
    : undefined;
  const actions: Action[] = [];
  if (record.equipped) actions.push({ id: "unequip", label: "Unequip", enabled: true });
  else if (record.slot !== "stack" && record.slot !== "memory") {
    actions.push({ id: "equip", label: "Equip", enabled: !reserved, reason: reserved });
  }
  if (record.custody !== "carried") actions.push({ id: "carry", label: "Carry", enabled: !reserved, reason: reserved });
  if (record.placeId !== "cellar") actions.push({ id: "store", label: "Store in cellar", enabled: true });
  if (record.placeId !== "mantel") actions.push({ id: "display", label: "Put on the mantel", enabled: true });
  if (record.reservedFor) actions.push({ id: "release", label: "Release reservation", enabled: true });
  else actions.push({ id: "reserve", label: "Reserve for the Vein", enabled: true });
  return actions;
}

function bump(world: KnownWorld, instances: WorldInstance[]): KnownWorld {
  return { ...world, revision: world.revision + 1, instances };
}

function replace(world: KnownWorld, instanceId: string, next: (instance: WorldInstance) => WorldInstance): KnownWorld {
  let found = false;
  const instances = world.instances.map((instance) => {
    if (instance.instanceId !== instanceId) return instance;
    found = true;
    return next(instance);
  });
  if (!found) return world;
  return bump(world, instances);
}

export function renameInstance(world: KnownWorld, instanceId: string, name: string): KnownWorld {
  const trimmed = name.trim();
  if (!trimmed) return world;
  return replace(world, instanceId, (instance) => ({
    ...instance,
    renamedFrom: instance.renamedFrom ?? instance.name,
    name: trimmed,
  }));
}

export function moveInstance(world: KnownWorld, instanceId: string, placeId: string): KnownWorld {
  const place = placeById(placeId);
  const barred = world.yearsAway >= 14 && place.barsAfterReturn === true;
  return replace(world, instanceId, (instance) => ({
    ...instance,
    custody: place.custody,
    equipped: place.custody === "equipped",
    exposure: place.exposure,
    location: {
      placeId: place.placeId,
      label: place.label,
      container: place.container,
      accessible: barred ? false : place.accessible,
    },
  }));
}

export function applyAction(world: KnownWorld, instanceId: string, action: ActionId, arg?: string): KnownWorld {
  const instance = world.instances.find((item) => item.instanceId === instanceId);
  if (!instance || instance.discovered === false || instance.synthetic || instance.kind === "fixture") return world;
  if (instance.kind === "recipe" || instance.kind === "journal") return world;
  if (!instance.location.accessible && action !== "read" && action !== "inspect") return world;

  if (action === "reserve") {
    const project = arg && PROJECT_BY_ID[arg] ? arg : "marble-vein";
    return replace(world, instanceId, (item) => ({ ...item, reservedFor: project }));
  }
  if (action === "release") {
    return replace(world, instanceId, (item) => ({ ...item, reservedFor: null }));
  }
  if (action === "carry") return moveInstance(world, instanceId, "pack");
  if (action === "store") return moveInstance(world, instanceId, "cellar");
  if (action === "display") return moveInstance(world, instanceId, "mantel");
  if (action === "unequip") return moveInstance(world, instanceId, "pack");
  if (action === "equip") {
    if (instance.reservedFor) return world;
    const catalog = CATALOG_BY_ID[instance.catalogId];
    const slot = catalog?.slot ?? "hand";
    if (slot === "stack" || slot === "memory") return world;
    const moved = moveInstance(world, instanceId, "in-hand");
    return {
      ...moved,
      instances: moved.instances.map((item) => {
        if (item.instanceId === instanceId) return { ...item, equipped: true, custody: "equipped" };
        if (slot === "passive") return item;
        const other = CATALOG_BY_ID[item.catalogId];
        if (item.equipped && other?.slot === slot) {
          const pack = placeById("pack");
          return {
            ...item,
            equipped: false,
            custody: "carried" as const,
            location: {
              placeId: pack.placeId,
              label: pack.label,
              container: pack.container,
              accessible: true,
            },
          };
        }
        return item;
      }),
    };
  }
  return world;
}
