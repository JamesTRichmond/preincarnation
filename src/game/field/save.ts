import {
  blankRecord,
  freshSave,
  hasCreature,
  SAVE_VERSION,
} from "./engine.ts";
import type { BeatId, CreatureRecord, OutingSave, StationId } from "./types.ts";
import { BEATS, ERAS, HABITATS, LIGHTS, PACES, SOUNDS, STATIONS, WEATHERS } from "./types.ts";
import { freshWorld } from "./world.ts";

export const SAVE_KEY = "preincarnation-lantern-meadow-v1";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isEra(value: unknown): value is OutingSave["world"]["era"] {
  return typeof value === "string" && (ERAS as readonly string[]).includes(value);
}
function isBeat(value: unknown): value is BeatId {
  return typeof value === "string" && (BEATS as readonly string[]).includes(value);
}
function isWeather(value: unknown): value is OutingSave["world"]["weather"] {
  return typeof value === "string" && (WEATHERS as readonly string[]).includes(value);
}
function isHabitat(value: unknown): value is OutingSave["world"]["habitatId"] {
  return typeof value === "string" && (HABITATS as readonly string[]).includes(value);
}
function isStation(value: unknown): value is StationId {
  return typeof value === "string" && (STATIONS as readonly string[]).includes(value);
}
function isPace(value: unknown): value is OutingSave["world"]["pace"] {
  return typeof value === "string" && (PACES as readonly string[]).includes(value);
}
function isLight(value: unknown): value is OutingSave["world"]["light"] {
  return typeof value === "string" && (LIGHTS as readonly string[]).includes(value);
}
function isSound(value: unknown): value is OutingSave["world"]["sound"] {
  return typeof value === "string" && (SOUNDS as readonly string[]).includes(value);
}

function asRecord(value: unknown): CreatureRecord {
  const base = blankRecord();
  if (!value || typeof value !== "object") return base;
  const raw = value as Partial<CreatureRecord>;
  const tier = raw.hintTier;
  const hintTier: CreatureRecord["hintTier"] =
    tier === 0 || tier === 1 || tier === 2 || tier === 3 ? tier : 0;
  return {
    timesSeen: numberOr(raw.timesSeen, 0),
    timesMissed: numberOr(raw.timesMissed, 0),
    timesReleased: numberOr(raw.timesReleased, 0),
    timesKept: numberOr(raw.timesKept, 0),
    hintTier,
    rewardsGranted: stringList(raw.rewardsGranted),
    confirmedMarks: stringList(raw.confirmedMarks),
    lastNote: typeof raw.lastNote === "string" ? raw.lastNote : "",
    fledEpoch: typeof raw.fledEpoch === "number" ? raw.fledEpoch : null,
    fledBeat: isBeat(raw.fledBeat) ? raw.fledBeat : null,
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalize(raw: unknown): OutingSave {
  const fresh = freshSave();
  if (!raw || typeof raw !== "object") return fresh;
  const data = raw as Partial<OutingSave> & { seen?: unknown };
  if (data.version === 0) {
    const seen = stringList(data.seen);
    const save = freshSave();
    for (const id of seen) {
      if (!hasCreature(id)) continue;
      save.records[id] = {
        ...blankRecord(),
        timesSeen: 1,
        timesReleased: 1,
        hintTier: 3,
        lastNote: "Carried over from an older notebook.",
      };
    }
    return save;
  }
  if (data.version !== SAVE_VERSION) return fresh;
  const worldRaw = (data.world ?? {}) as Partial<OutingSave["world"]>;
  const baseWorld = freshWorld();
  const world = {
    habitatId: isHabitat(worldRaw.habitatId) ? worldRaw.habitatId : baseWorld.habitatId,
    era: isEra(worldRaw.era) ? worldRaw.era : baseWorld.era,
    beat: isBeat(worldRaw.beat) ? worldRaw.beat : baseWorld.beat,
    weather: isWeather(worldRaw.weather) ? worldRaw.weather : baseWorld.weather,
    station: isStation(worldRaw.station) ? worldRaw.station : null,
    pace: isPace(worldRaw.pace) ? worldRaw.pace : baseWorld.pace,
    light: isLight(worldRaw.light) ? worldRaw.light : baseWorld.light,
    sound: isSound(worldRaw.sound) ? worldRaw.sound : baseWorld.sound,
    preps: stringList(worldRaw.preps).filter((prep): prep is OutingSave["world"]["preps"][number] =>
      ["turn-log", "turn-stone", "palm-water", "sugar-cloth", "sap-smear", "infirmary-scrap"].includes(prep),
    ),
  };
  const records: OutingSave["records"] = {};
  if (data.records && typeof data.records === "object") {
    for (const [id, value] of Object.entries(data.records)) {
      if (!hasCreature(id)) continue;
      records[id] = asRecord(value);
    }
  }
  const activeRaw = data.active;
  let active: OutingSave["active"] = null;
  if (activeRaw && typeof activeRaw === "object" && hasCreature((activeRaw as { creatureId?: string }).creatureId ?? "")) {
    const activeData = activeRaw as OutingSave["active"];
    if (activeData) {
      active = {
        creatureId: activeData.creatureId,
        stepIndex: numberOr(activeData.stepIndex, 0),
        sketchStrikes: numberOr(activeData.sketchStrikes, 0),
        log: stringList(activeData.log),
      };
    }
  }
  const journal = Array.isArray(data.journal)
    ? data.journal.filter(
        (line): line is OutingSave["journal"][number] =>
          !!line &&
          typeof line === "object" &&
          typeof (line as { text?: unknown }).text === "string" &&
          typeof (line as { id?: unknown }).id === "string" &&
          typeof (line as { creatureId?: unknown }).creatureId === "string",
      )
    : [];
  return {
    version: SAVE_VERSION,
    epoch: numberOr(data.epoch, 1),
    world,
    visited: stringList(data.visited).filter(isStation),
    records,
    journal,
    active,
  };
}

export function serialize(save: OutingSave): string {
  return JSON.stringify(save);
}

export function hydrate(raw: string | null): OutingSave {
  if (!raw) return freshSave();
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return freshSave();
  }
}

export function writeSave(store: KeyValueStore, key: string, save: OutingSave): void {
  const payload = serialize(save);
  const previous = store.getItem(key);
  if (previous) store.setItem(`${key}.bak`, previous);
  store.setItem(key, payload);
}

export function readSave(store: KeyValueStore, key: string): OutingSave {
  const primary = store.getItem(key);
  if (primary) {
    try {
      return normalize(JSON.parse(primary));
    } catch {
      /* fall through to backup */
    }
  }
  const backup = store.getItem(`${key}.bak`);
  if (!backup) return freshSave();
  try {
    return normalize(JSON.parse(backup));
  } catch {
    return freshSave();
  }
}
