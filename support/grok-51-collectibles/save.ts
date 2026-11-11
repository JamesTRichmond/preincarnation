import { initialSave } from "./archive.ts";
import type { Save } from "./types.ts";

export const SAVE_VERSION = 1;
export const SAVE_KEY = "fourteen-winters-keeping-room-v1";
export const BACKUP_KEY = "fourteen-winters-keeping-room-v1-backup";

export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function persist(save: Save, store: Store): void {
  try {
    const previous = store.getItem(SAVE_KEY);
    if (previous) store.setItem(BACKUP_KEY, previous);
    store.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* Quota or private mode: the desk stays in memory for this visit. */
  }
}

export function load(store: Store): Save {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (!raw) return initialSave();
    return hydrate(raw);
  } catch {
    return initialSave();
  }
}

export function hydrate(raw: string): Save {
  try {
    return migrate(JSON.parse(raw) as unknown);
  } catch {
    return initialSave();
  }
}

/** v0 was an unversioned card map. v1 is the keeping-room ledger. */
export function migrate(raw: unknown): Save {
  if (!raw || typeof raw !== "object") return initialSave();
  const record = raw as Partial<Save> & { version?: number };
  if (record.version === undefined && record.cards && typeof record.cards === "object") {
    return normalize({ ...record, version: SAVE_VERSION });
  }
  if (record.version === 1) return normalize(record);
  return initialSave();
}

function normalize(input: Partial<Save>): Save {
  const base = initialSave();
  return {
    ...base,
    ...input,
    version: SAVE_VERSION,
    cards: { ...base.cards, ...(input.cards ?? {}) },
    duplicates: { ...(input.duplicates ?? {}) },
    decorations: input.decorations ?? base.decorations,
    placed: { ...base.placed, ...(input.placed ?? {}) },
    documents: input.documents ?? base.documents,
    read: input.read ?? [],
    understandings: input.understandings ?? base.understandings,
    playedCards: input.playedCards ?? [],
    discoveries: input.discoveries ?? [],
    completed: input.completed ?? [],
    decks: input.decks && input.decks.length > 0 ? input.decks : base.decks,
    activeDeckId: input.activeDeckId || base.activeDeckId,
    excursion: input.excursion ?? null,
    huntsFound: input.huntsFound ?? [],
    keeping: input.keeping ?? null,
    rng: typeof input.rng === "number" ? input.rng : base.rng,
    lastNotice: input.lastNotice ?? "",
  };
}

export function memoryStore(seed?: string): Store & { dump(): Record<string, string> } {
  const data = new Map<string, string>();
  if (seed) data.set(SAVE_KEY, seed);
  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    dump() {
      return Object.fromEntries(data);
    },
  };
}
