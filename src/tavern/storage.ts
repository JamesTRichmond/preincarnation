import type { Gesture, InstrumentId } from "./types.ts";

export const TAVERN_SAVE_KEY = "preincarnation.tavern-music.v1";
export const TAVERN_BACKUP_KEY = "preincarnation.tavern-music.v1.backup";

export const SAVE_VERSION = 1;

export type Slot = {
  gesture: Gesture;
  /** Home-relative signature id, currently the gesture itself. */
  phrase: Gesture;
} | null;

export type Composition = {
  id: string;
  title: string;
  instrument: InstrumentId;
  /** Home tonic midi. */
  home: number;
  bpm: number;
  slots: Slot[];
  createdAt: string;
};

export type Settings = {
  windowMs: number | null;
  offsetMs: number;
  calibrationStale: boolean;
  muted: boolean;
  instrument: InstrumentId;
  seenTip: boolean;
};

export type SaveFile = {
  version: number;
  settings: Settings;
  compositions: Composition[];
};

export type Kv = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
};

export const DEFAULT_SETTINGS: Settings = {
  windowMs: null,
  offsetMs: 0,
  calibrationStale: false,
  muted: false,
  instrument: "fiddle",
  seenTip: false,
};

export function emptySave(): SaveFile {
  return { version: SAVE_VERSION, settings: { ...DEFAULT_SETTINGS }, compositions: [] };
}

const GESTURES: Gesture[] = ["lift", "settle", "stamp", "hold"];
const INSTRUMENTS: InstrumentId[] = ["fiddle", "guitar", "spoons"];

function isGesture(value: unknown): value is Gesture {
  return typeof value === "string" && GESTURES.includes(value as Gesture);
}

function isInstrument(value: unknown): value is InstrumentId {
  return typeof value === "string" && INSTRUMENTS.includes(value as InstrumentId);
}

function sanitizeComposition(raw: unknown): Composition | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<Composition>;
  if (typeof row.id !== "string" || typeof row.title !== "string") return null;
  if (!isInstrument(row.instrument)) return null;
  if (typeof row.home !== "number" || typeof row.bpm !== "number") return null;
  if (!Array.isArray(row.slots)) return null;
  const slots: Slot[] = row.slots.slice(0, 8).map((slot) => {
    if (!slot || typeof slot !== "object") return null;
    const phrase = (slot as { phrase?: unknown }).phrase;
    const gesture = (slot as { gesture?: unknown }).gesture;
    if (!isGesture(phrase) || !isGesture(gesture)) return null;
    return { phrase, gesture };
  });
  while (slots.length < 8) slots.push(null);
  return {
    id: row.id,
    title: row.title.slice(0, 80) || "Untitled tune",
    instrument: row.instrument,
    home: row.home,
    bpm: Math.min(180, Math.max(48, row.bpm)),
    slots,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date(0).toISOString(),
  };
}

export function migrate(raw: unknown): SaveFile {
  const base = emptySave();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Partial<SaveFile> & { gold?: unknown };
  let version = typeof row.version === "number" ? row.version : 0;
  let settings = { ...DEFAULT_SETTINGS };
  if (row.settings && typeof row.settings === "object") {
    const s = row.settings as Partial<Settings>;
    settings = {
      ...settings,
      windowMs: typeof s.windowMs === "number" ? Math.min(360, Math.max(60, s.windowMs)) : null,
      offsetMs: typeof s.offsetMs === "number" && Number.isFinite(s.offsetMs) ? s.offsetMs : 0,
      calibrationStale: Boolean(s.calibrationStale),
      muted: Boolean(s.muted),
      instrument: isInstrument(s.instrument) ? s.instrument : "fiddle",
      seenTip: Boolean(s.seenTip),
    };
  }
  const compositions = Array.isArray(row.compositions)
    ? row.compositions.map(sanitizeComposition).filter((c): c is Composition => c != null)
    : [];
  if (version < 1) version = 1;
  if (version > SAVE_VERSION) version = SAVE_VERSION;
  return { version, settings, compositions };
}

export type LoadReport = {
  save: SaveFile;
  recoveredFrom: "main" | "backup" | "empty";
  warning: string | null;
};

export function loadSave(kv: Kv): LoadReport {
  const mainRaw = safeGet(kv, TAVERN_SAVE_KEY);
  const backupRaw = safeGet(kv, TAVERN_BACKUP_KEY);
  const main = tryParse(mainRaw);
  if (main.ok) {
    return { save: migrate(main.value), recoveredFrom: "main", warning: null };
  }
  const backup = tryParse(backupRaw);
  if (backup.ok) {
    return {
      save: migrate(backup.value),
      recoveredFrom: "backup",
      warning: "The latest tune book was unreadable. The previous one was restored.",
    };
  }
  return {
    save: emptySave(),
    recoveredFrom: "empty",
    warning: mainRaw || backupRaw ? "Saved tunes could not be read. Starting with an empty book." : null,
  };
}

export type WriteReport = { ok: boolean; warning: string | null };

export function writeSave(kv: Kv, save: SaveFile): WriteReport {
  const payload: SaveFile = { ...save, version: SAVE_VERSION };
  const text = JSON.stringify(payload);
  try {
    const previous = safeGet(kv, TAVERN_SAVE_KEY);
    if (previous && tryParse(previous).ok) {
      kv.setItem(TAVERN_BACKUP_KEY, previous);
    }
    kv.setItem(TAVERN_SAVE_KEY, text);
    return { ok: true, warning: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "storage failed";
    return { ok: false, warning: `Could not keep this on the shelf (${message}). It is still in the room for now.` };
  }
}

export function memoryKv(initial?: Record<string, string>): Kv & { dump: () => Record<string, string> } {
  const data = { ...initial };
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key]! : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
    dump: () => ({ ...data }),
  };
}

export function browserKv(): Kv | null {
  if (typeof localStorage === "undefined") return null;
  return {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      localStorage.setItem(key, value);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  };
}

function safeGet(kv: Kv, key: string): string | null {
  try {
    return kv.getItem(key);
  } catch {
    return null;
  }
}

function tryParse(text: string | null): { ok: true; value: unknown } | { ok: false } {
  if (!text) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}
