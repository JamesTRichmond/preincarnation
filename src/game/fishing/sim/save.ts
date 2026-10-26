import { CREEL_LIMIT } from "../data/gear.ts";
import { clamp } from "./num.ts";
import { TENSION_ABS_MAX } from "./tension.ts";
import type { Phase, Session } from "./types.ts";

export const SAVE_VERSION = 1;
export const STORAGE_KEY = "preincarnation.fishing.v1";
export const BACKUP_KEY = "preincarnation.fishing.v1.bak";

const PHASES = new Set<Phase>([
  "title",
  "waters",
  "read",
  "aiming",
  "charging",
  "flight",
  "present",
  "bite",
  "fight",
  "landed",
  "resolved",
]);

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function exportSession(session: Session): string {
  return JSON.stringify({ version: SAVE_VERSION, session });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Repairs duplicate creel rows and impossible tension. Returns null if the blob is not a v1 trip. */
export function sanitizeSession(value: unknown): Session | null {
  const root = asRecord(value);
  if (!root || root.version !== SAVE_VERSION) return null;
  const session = asRecord(root.session) as Session | null;
  if (!session || !PHASES.has(session.phase)) return null;
  const save = asRecord(session.save);
  if (!save || !Array.isArray(save.creel) || !Array.isArray(save.resolvedIds) || !Array.isArray(save.rewardQueue)) {
    return null;
  }
  const seen = new Set<string>();
  const creel = [];
  for (const item of save.creel) {
    const row = asRecord(item);
    if (!row || typeof row.id !== "string" || seen.has(row.id)) continue;
    seen.add(row.id);
    creel.push(item);
    if (creel.length >= CREEL_LIMIT) break;
  }
  save.creel = creel;
  save.resolvedIds = [...new Set(save.resolvedIds.filter((id) => typeof id === "string"))];
  if (!save.journal || typeof save.journal !== "object") save.journal = {};
  if (!Array.isArray(save.drainedIds)) save.drainedIds = [];
  if (!Array.isArray(save.reads)) save.reads = [];
  if (!save.stats || typeof save.stats !== "object") save.stats = { kept: 0, released: 0, lost: 0 };
  if (session.fight && typeof session.fight === "object") {
    session.fight.tension = clamp(session.fight.tension, 0, TENSION_ABS_MAX);
    session.fight.lineOut = clamp(session.fight.lineOut, 0, 1);
    session.fight.spit = clamp(session.fight.spit, 0, 2);
  }
  session.version = 1;
  return session;
}

export function parseSession(raw: string): { ok: true; session: Session } | { ok: false; reason: string } {
  try {
    const session = sanitizeSession(JSON.parse(raw) as unknown);
    if (!session) return { ok: false, reason: "invalid" };
    return { ok: true, session };
  } catch {
    return { ok: false, reason: "corrupt" };
  }
}

export function writeSave(storage: StorageLike, session: Session): { ok: boolean } {
  try {
    const prev = storage.getItem(STORAGE_KEY);
    if (prev) storage.setItem(BACKUP_KEY, prev);
    storage.setItem(STORAGE_KEY, exportSession(session));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function loadSession(
  storage: StorageLike,
  fresh: () => Session,
): { session: Session; source: "main" | "backup" | "fresh"; reason?: string } {
  const main = storage.getItem(STORAGE_KEY);
  if (main) {
    const parsed = parseSession(main);
    if (parsed.ok) return { session: parsed.session, source: "main" };
  }
  const backup = storage.getItem(BACKUP_KEY);
  if (backup) {
    const parsed = parseSession(backup);
    if (parsed.ok) return { session: parsed.session, source: "backup", reason: "main-unreadable" };
  }
  return { session: fresh(), source: "fresh", reason: main ? "corrupt" : "empty" };
}

export function memoryStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    dump() {
      return { ...data };
    },
  };
}
