import { emptyMemory, normalizeMemory } from "../memory/room.ts";
import { initialRivalMap } from "../rivals/progress.ts";
import {
  ERA_IDS,
  FESTIVAL_IDS,
  RIVAL_IDS,
  type EraId,
  type FestivalId,
  type RivalId,
  type RivalState,
  type SaveData,
  type InProgress,
} from "../types.ts";

export const SAVE_VERSION = 1 as const;
export const SAVE_KEY = "preincarnation-community-play-v1";
export const BACKUP_KEY = "preincarnation-community-play-v1-backup";

export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export function recordKey(eraId: EraId, festivalId: FestivalId): string {
  return `${eraId}:${festivalId}`;
}

export function createInitialSave(): SaveData {
  return {
    version: SAVE_VERSION,
    eraId: "first-turning",
    townWeek: 0,
    attended: {},
    declined: [],
    rivals: initialRivalMap(),
    grants: [],
    storyFlags: [],
    memory: emptyMemory(),
    inProgress: null,
    lettersRead: [],
  };
}

function isEra(value: unknown): value is EraId {
  return typeof value === "string" && (ERA_IDS as readonly string[]).includes(value);
}

function isFestival(value: unknown): value is FestivalId {
  return typeof value === "string" && (FESTIVAL_IDS as readonly string[]).includes(value);
}

function sanitizeRivals(value: unknown): Record<RivalId, RivalState> {
  const base = initialRivalMap();
  if (!value || typeof value !== "object") return base;
  const source = value as Record<string, Partial<RivalState>>;
  for (const id of RIVAL_IDS) {
    const row = source[id];
    if (!row || typeof row !== "object") continue;
    const bond = typeof row.bond === "number" && Number.isFinite(row.bond) ? row.bond : 0;
    const flags = Array.isArray(row.flags) ? row.flags.filter((flag) => typeof flag === "string") : [];
    const lastLine = typeof row.lastLine === "string" ? row.lastLine : "";
    base[id] = { bond, flags, lastLine };
  }
  return base;
}

function sanitizeProgress(value: unknown): InProgress | null {
  if (!value || typeof value !== "object") return null;
  const progress = value as Partial<InProgress>;
  if (!isFestival(progress.festivalId) || !isEra(progress.eraId)) return null;
  if (progress.phase !== "intro" && progress.phase !== "activity" && progress.phase !== "closing") return null;
  if (typeof progress.activityIndex !== "number") return null;
  if (!Array.isArray(progress.results)) return null;
  const checkpoint = progress.checkpoint;
  if (!checkpoint || typeof checkpoint !== "object") return null;
  return {
    festivalId: progress.festivalId,
    eraId: progress.eraId,
    phase: progress.phase,
    activityIndex: progress.activityIndex,
    results: progress.results as InProgress["results"],
    checkpoint: {
      rivals: sanitizeRivals(checkpoint.rivals),
      storyFlags: Array.isArray(checkpoint.storyFlags)
        ? checkpoint.storyFlags.filter((flag) => typeof flag === "string")
        : [],
    },
  };
}

export function deserialize(raw: string | null): SaveData {
  if (!raw) return createInitialSave();
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || typeof parsed !== "object") return createInitialSave();
    if (parsed.version !== SAVE_VERSION) return createInitialSave();
    if (!isEra(parsed.eraId)) return createInitialSave();
    const townWeek =
      typeof parsed.townWeek === "number" && parsed.townWeek >= 0 && parsed.townWeek <= 23
        ? Math.floor(parsed.townWeek)
        : 0;
    const attended: SaveData["attended"] = {};
    if (parsed.attended && typeof parsed.attended === "object") {
      for (const [key, value] of Object.entries(parsed.attended)) {
        if (!value || typeof value !== "object") continue;
        if (!isFestival(value.festivalId) || !isEra(value.eraId)) continue;
        if (value.tone !== "warm" && value.tone !== "mixed" && value.tone !== "sour") continue;
        attended[key] = {
          festivalId: value.festivalId,
          eraId: value.eraId,
          tone: value.tone,
          prizeIds: Array.isArray(value.prizeIds) ? value.prizeIds.filter((id) => typeof id === "string") : [],
          results: Array.isArray(value.results) ? value.results : [],
        };
      }
    }
    const declined = Array.isArray(parsed.declined)
      ? parsed.declined.filter((key) => typeof key === "string")
      : [];
    const grants = Array.isArray(parsed.grants)
      ? parsed.grants.filter(
          (grant) =>
            grant &&
            typeof grant.rewardId === "string" &&
            isEra(grant.eraId) &&
            isFestival(grant.festivalId) &&
            (grant.tone === "warm" || grant.tone === "mixed" || grant.tone === "sour"),
        )
      : [];
    const base = createInitialSave();
    return {
      ...base,
      eraId: parsed.eraId,
      townWeek,
      attended,
      declined,
      rivals: sanitizeRivals(parsed.rivals),
      grants,
      storyFlags: Array.isArray(parsed.storyFlags)
        ? parsed.storyFlags.filter((flag) => typeof flag === "string")
        : [],
      memory: normalizeMemory(parsed.memory),
      inProgress: sanitizeProgress(parsed.inProgress),
      lettersRead: Array.isArray(parsed.lettersRead)
        ? parsed.lettersRead.filter((id) => typeof id === "string")
        : [],
    };
  } catch {
    return createInitialSave();
  }
}

export function serialize(save: SaveData): string {
  return JSON.stringify(save);
}

export function loadSave(storage: StorageLike): SaveData {
  try {
    return deserialize(storage.getItem(SAVE_KEY));
  } catch {
    return createInitialSave();
  }
}

export function persistSave(storage: StorageLike, save: SaveData): void {
  try {
    const next = serialize(save);
    const previous = storage.getItem(SAVE_KEY);
    if (previous && previous !== next) storage.setItem(BACKUP_KEY, previous);
    storage.setItem(SAVE_KEY, next);
  } catch {
    // Private mode and quota failures keep the in-memory record.
  }
}
