import { MASTERY_OBJECTS, objectById } from "./catalog.ts";
import type { MasteryObject } from "./types.ts";

/**
 * Save rules for the pack.
 * They mirror rules.ts resolveDeath and items.ts erodeGrave.
 * They are not called by src/game/save.ts — that file is outside this pack.
 * Skill points, crowns, karma upgrades, and Maeve's lantern keepsake are not this pack's to move.
 */

export type GraveObject = {
  id: string;
  magic: boolean;
  year: number;
};

export type PackSave = {
  version: 1;
  carried: string[];
  bound: string[];
  grave: GraveObject[];
};

export function freshPack(ids: string[] = MASTERY_OBJECTS.map((item) => item.id)): PackSave {
  return { version: 1, carried: [...ids], bound: [], grave: [] };
}

export function bindObject(save: PackSave, id: string): { ok: true; save: PackSave } | { ok: false; reason: string } {
  const item = objectById(id);
  if (!item) return { ok: false, reason: "Unknown object." };
  if (!save.carried.includes(id)) return { ok: false, reason: "It is not in the pack." };
  if (save.bound.includes(id)) return { ok: false, reason: "Already bound." };
  if (save.bound.length >= 2) return { ok: false, reason: "Two bindings already. No new slot." };
  const other = save.bound.map((boundId) => objectById(boundId)).filter((entry): entry is MasteryObject => !!entry);
  if (item.exclusivityGroup && other.some((entry) => entry.exclusivityGroup === item.exclusivityGroup)) {
    return { ok: false, reason: `Exclusive with another ${item.exclusivityGroup}.` };
  }
  return { ok: true, save: { ...save, bound: [...save.bound, id] } };
}

export function unbindObject(save: PackSave, id: string): PackSave {
  return { ...save, bound: save.bound.filter((boundId) => boundId !== id) };
}

export function dropOnDeath(save: PackSave, year: number): PackSave {
  const grave = [
    ...save.grave,
    ...save.carried.map((id) => ({
      id,
      magic: objectById(id)?.save.erosion === "magic-kept",
      year,
    })),
  ];
  return { version: 1, carried: [], bound: [], grave };
}

/** items.ts erodeGrave, mundane branch. Magic is kept. Excavated mounds lose mundane goods. */
export function erosionKeeps(magic: boolean, years: number, excavated: boolean, rand: () => number): boolean {
  if (magic) return true;
  if (excavated) return false;
  if (years >= 12) return rand() < 0.22;
  if (years >= 6) return rand() < 0.55;
  return rand() < 0.8;
}

export function erodeGrave(grave: GraveObject[], nowYear: number, excavated: boolean, rand: () => number): GraveObject[] {
  return grave.filter((entry) => erosionKeeps(entry.magic, Math.max(0, nowYear - entry.year), excavated, rand));
}

export function excavate(
  save: PackSave,
  hasShovel: boolean,
  nowYear: number,
  rand: () => number,
): { ok: true; save: PackSave; recovered: string[] } | { ok: false; reason: string } {
  if (!hasShovel) return { ok: false, reason: "The grave shovel is still the gate." };
  const kept = erodeGrave(save.grave, nowYear, false, rand);
  return {
    ok: true,
    recovered: kept.map((entry) => entry.id),
    save: { ...save, carried: [...save.carried, ...kept.map((entry) => entry.id)], grave: [] },
  };
}
