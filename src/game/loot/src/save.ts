import { LootError } from "./errors.ts";
import type { LootState, ResolvedContent } from "./types.ts";

export const SAVE_VERSION = 1;
export const DEMO_SAVE_KEY = "preincarnation-loot-core-demo-v1";
export const DEMO_BACKUP_KEY = "preincarnation-loot-core-demo-v1-backup";

export interface LootSave {
  version: typeof SAVE_VERSION;
  packId: string;
  state: LootState;
}

export interface SavePort {
  load(): string | null;
  store(serialized: string): void;
  loadBackup?: () => string | null;
  storeBackup?: (serialized: string) => void;
}

/** In-memory port for tests and for sessions with storage disabled. */
export function memoryPort(): SavePort {
  let current: string | null = null;
  let backup: string | null = null;
  return {
    load: () => current,
    store: (serialized) => {
      current = serialized;
    },
    loadBackup: () => backup,
    storeBackup: (serialized) => {
      backup = serialized;
    },
  };
}

export function browserPort(key = DEMO_SAVE_KEY, backupKey = DEMO_BACKUP_KEY): SavePort {
  return {
    load: () => readKey(key),
    store: (serialized) => writeKey(key, serialized),
    loadBackup: () => readKey(backupKey),
    storeBackup: (serialized) => writeKey(backupKey, serialized),
  };
}

export function exportSave(state: LootState, packId: string): string {
  const save: LootSave = { version: SAVE_VERSION, packId, state };
  return JSON.stringify(save);
}

export function writeSave(port: SavePort, state: LootState, packId: string): string {
  const serialized = exportSave(state, packId);
  const previous = port.load();
  if (previous && port.storeBackup) port.storeBackup(previous);
  port.store(serialized);
  return serialized;
}

/**
 * Version 1 is the only shape this core reads.
 * Later sessions add a step here and keep old ledgers loadable.
 */
export function migrateRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") {
    throw new LootError("save", "The ledger file is not an object.");
  }
  const version = (raw as { version?: unknown }).version;
  if (version !== SAVE_VERSION) {
    throw new LootError("save", `Unsupported ledger version (${String(version)}). This core reads version ${SAVE_VERSION}.`);
  }
  return raw;
}

export function importSave(serialized: string, content: ResolvedContent): LootState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new LootError("save", "The ledger file is not valid JSON.");
  }
  const migrated = migrateRaw(parsed) as Partial<LootSave>;
  if (!migrated.state || typeof migrated.state !== "object") {
    throw new LootError("save", "The ledger has no state.");
  }
  if (migrated.packId && migrated.packId !== content.packId) {
    throw new LootError(
      "save",
      `This ledger belongs to ${migrated.packId}. The loaded pack is ${content.packId}.`,
    );
  }
  const state = migrated.state;
  if (state.version !== 1) throw new LootError("save", "State version is not 1.");
  const ids = new Set(Object.keys(state.instances ?? {}));
  for (const id of ids) {
    const inst = state.instances[id];
    if (!inst || inst.id !== id) throw new LootError("save", `Instance ${id} is malformed.`);
    if (!content.definitions.has(inst.definitionId)) {
      throw new LootError("save", `Instance ${id} cites unknown definition ${inst.definitionId}.`);
    }
    if (!state.owners?.[id]) throw new LootError("save", `Instance ${id} has no owner.`);
    if (inst.quantity < 1) throw new LootError("save", `Instance ${id} has an empty quantity.`);
  }
  for (const [slot, id] of Object.entries(state.equipment ?? {})) {
    if (id && !ids.has(id)) throw new LootError("save", `Equipment ${slot} points at a missing piece.`);
  }
  for (const [slot, id] of Object.entries(state.placements ?? {})) {
    if (!ids.has(id)) throw new LootError("save", `Display ${slot} points at a missing piece.`);
  }
  return state;
}

function readKey(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key: string, value: string) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    /* Quota or private mode: the in-memory ledger still works for this sitting. */
  }
}
