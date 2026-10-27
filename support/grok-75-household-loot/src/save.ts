import { CATALOG } from "./catalog.ts";
import { assessRoom, createInitialSave, type RoomProblem } from "./room.ts";
import {
  emptyState,
  instanceIdFor,
  ROOM_ID,
  SAVE_KEY,
  SAVE_VERSION,
  type FoodPortion,
  type RoomSave,
} from "./types.ts";
import { PANTRY } from "./room.ts";

export interface MemoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function serialize(save: RoomSave): string {
  return JSON.stringify(save);
}

export function deserialize(raw: string): RoomSave {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The saved room could not be read.");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("The saved room was empty.");
  const incoming = parsed as Partial<RoomSave>;
  const version = typeof incoming.version === "number" ? incoming.version : 0;
  if (version > SAVE_VERSION) throw new Error("The saved room is from a newer pack.");
  const base = createInitialSave();
  const merged: RoomSave = {
    ...base,
    ...incoming,
    version: SAVE_VERSION,
    roomId: ROOM_ID,
    pantry: Array.isArray(incoming.pantry) ? incoming.pantry : base.pantry,
    tokens: Array.isArray(incoming.tokens) ? incoming.tokens : [],
    notes: Array.isArray(incoming.notes) ? incoming.notes.slice(-20) : [],
    instances: Array.isArray(incoming.instances) ? incoming.instances : base.instances,
  };
  return repairSave(merged).save;
}

export function repairSave(save: RoomSave): {
  save: RoomSave;
  notes: string[];
  problems: RoomProblem[];
} {
  const draft = structuredClone(save);
  const notes: string[] = [];
  const seen = new Set<string>();
  draft.instances = draft.instances.filter((inst) => {
    if (seen.has(inst.instanceId)) {
      notes.push(`A duplicate of ${inst.instanceId} was dropped.`);
      return false;
    }
    seen.add(inst.instanceId);
    return true;
  });
  const present = new Set(draft.instances.map((inst) => inst.catalogId));
  for (const item of CATALOG) {
    if (present.has(item.id)) continue;
    draft.instances.push({
      instanceId: instanceIdFor(item.id),
      catalogId: item.id,
      roomId: ROOM_ID,
      anchorId: null,
      rotation: 0,
      supportInstanceId: null,
      containerInstanceId: null,
      packed: true,
      displaySlot: null,
      state: emptyState(item.frozenHour ?? null),
    });
    notes.push(`${item.name} was restored to the loft.`);
  }
  const known = new Set(CATALOG.map((item) => item.id));
  draft.instances = draft.instances.filter((inst) => known.has(inst.catalogId));
  const slotOwner = new Set<string>();
  for (const inst of draft.instances) {
    if (inst.displaySlot && slotOwner.has(inst.displaySlot)) {
      notes.push(`${inst.catalogId} left a crowded display slot.`);
      inst.displaySlot = null;
      inst.packed = true;
      inst.anchorId = null;
    } else if (inst.displaySlot) slotOwner.add(inst.displaySlot);
    if ((inst.packed || inst.containerInstanceId || inst.displaySlot) && inst.anchorId) {
      notes.push("A second showing was cleared so the object would appear once.");
      inst.anchorId = null;
      inst.supportInstanceId = null;
    }
    const item = CATALOG.find((entry) => entry.id === inst.catalogId);
    if (item && inst.state.lit && !item.eras.includes(draft.era)) inst.state.lit = false;
    inst.state.heldInstanceIds = inst.state.heldInstanceIds.filter((id) =>
      draft.instances.some((other) => other.instanceId === id),
    );
  }
  for (const food of draft.pantry) food.portions = Math.max(0, food.portions | 0);
  const knownFood = new Set(PANTRY.map((food) => food.id));
  for (const template of PANTRY) {
    if (!draft.pantry.some((food) => food.id === template.id)) {
      draft.pantry.push({ ...template, portions: 0 });
    }
  }
  draft.pantry = draft.pantry.filter((food: FoodPortion) => knownFood.has(food.id));
  draft.roomId = ROOM_ID;
  draft.version = SAVE_VERSION;
  return { save: draft, notes, problems: assessRoom(draft) };
}

export function loadSave(storage: MemoryStorage | null): RoomSave {
  if (!storage) return createInitialSave();
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return createInitialSave();
    return deserialize(raw);
  } catch {
    return createInitialSave();
  }
}

export function persistSave(
  storage: MemoryStorage,
  save: RoomSave,
): { ok: boolean; message?: string } {
  try {
    storage.setItem(SAVE_KEY, serialize(save));
    return { ok: true };
  } catch {
    return { ok: false, message: "This room could not be saved in the browser." };
  }
}
