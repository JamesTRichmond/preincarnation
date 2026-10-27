/**
 * Player-data tools for PREINCARNATION.
 * The blob shape, key, and migrate() come from the engine. This module does not reimplement them.
 * It refuses to overwrite storage until a restorable snapshot exists, and it does not swallow quota errors
 * the way engine writeSave() does.
 */

export const EXPORT_KIND = "preincarnation-player-export";
export const EXPORT_VERSION = 1;
export const RESCUE_KEY = "preincarnation.release.rescue";
export const UI_KEY = "preincarnation.ui.controls";

export function serializeAccepted(migrated, saveVersion) {
  return JSON.stringify({ ...migrated, version: saveVersion });
}

export function snapshotStorage(storage) {
  const data = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !key.startsWith("preincarnation.")) continue;
    data[key] = storage.getItem(key);
  }
  return data;
}

export function restoreStorage(storage, data) {
  const current = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith("preincarnation.")) current.push(key);
  }
  for (const key of current) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) storage.removeItem(key);
  }
  for (const [key, value] of Object.entries(data)) {
    if (value == null) storage.removeItem(key);
    else storage.setItem(key, value);
  }
}

function bytesToBase64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  const slice = 0x8000;
  for (let i = 0; i < u8.length; i += slice) {
    let part = "";
    const end = Math.min(i + slice, u8.length);
    for (let j = i; j < end; j++) part += String.fromCharCode(u8[j]);
    binary += part;
  }
  if (typeof btoa === "function") return btoa(binary);
  return Buffer.from(binary, "binary").toString("base64");
}

function base64ToBytes(value) {
  if (typeof value !== "string" || value.length === 0 || value.length % 4 === 1) {
    throw new Error("damaged-base64");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error("damaged-base64");
  const binary = typeof atob === "function" ? atob(value) : Buffer.from(value, "base64").toString("binary");
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function exportEnvelope(storage, deck, meta) {
  const storageSnap = snapshotStorage(storage);
  const records = [];
  if (deck) {
    const entries = await deck.entries();
    for (const entry of entries) {
      records.push({
        key: String(entry.key),
        mediaType: entry.mediaType || "application/octet-stream",
        base64: bytesToBase64(entry.bytes),
      });
    }
  }
  return {
    kind: EXPORT_KIND,
    exportVersion: EXPORT_VERSION,
    savedAt: meta.savedAt,
    sourceBuild: meta.sourceBuild,
    saveContract: {
      key: meta.saveKey,
      version: meta.saveVersion,
      deckDatabase: "preincarnation.deck.v1",
      deckStore: "files",
    },
    storage: storageSnap,
    deck: {
      db: "preincarnation.deck.v1",
      store: "files",
      version: 1,
      records,
    },
  };
}

function fail(code, extra = {}) {
  return { ok: false, code, written: false, ...extra };
}

async function snapshotDeck(deck) {
  if (!deck) return [];
  const entries = await deck.entries();
  return entries.map((entry) => ({
    key: entry.key,
    mediaType: entry.mediaType,
    bytes: entry.bytes,
  }));
}

async function restoreDeck(deck, entries) {
  if (!deck) return;
  await deck.replace(entries);
}

export async function importEnvelope(rawText, { storage, deck, engine }) {
  let before;
  let beforeDeck;
  try {
    before = snapshotStorage(storage);
    beforeDeck = await snapshotDeck(deck);
  } catch (err) {
    return fail("storage-unavailable", { error: String(err && err.name || err) });
  }

  let envelope;
  try {
    envelope = JSON.parse(rawText);
  } catch {
    return fail("damaged");
  }
  if (!envelope || envelope.kind !== EXPORT_KIND || envelope.exportVersion !== EXPORT_VERSION) {
    return fail("damaged");
  }
  const raw = envelope.storage?.[engine.SAVE_KEY];
  if (typeof raw !== "string" || raw.trim() === "") return fail("damaged");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail("damaged");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("damaged");
  const version = typeof parsed.version === "number" ? parsed.version : 1;
  if (!Number.isFinite(version)) return fail("damaged");
  if (version > engine.SAVE_VERSION) {
    return fail("incompatible", {
      saveVersion: version,
      supportedMax: engine.SAVE_VERSION,
    });
  }

  let decodedDeck = null;
  if (envelope.deck) {
    if (envelope.deck.db !== "preincarnation.deck.v1" || envelope.deck.store !== "files") {
      return fail("damaged");
    }
    try {
      decodedDeck = (envelope.deck.records || []).map((record) => {
        if (!record || typeof record.key !== "string" || !record.key) throw new Error("damaged-deck");
        return {
          key: record.key,
          mediaType: typeof record.mediaType === "string" ? record.mediaType : "application/octet-stream",
          bytes: base64ToBytes(record.base64),
        };
      });
    } catch {
      return fail("damaged");
    }
  }

  let migrated;
  try {
    migrated = engine.migrate(parsed);
  } catch {
    return fail("damaged");
  }
  const canonical = serializeAccepted(migrated, engine.SAVE_VERSION);
  const current = before[engine.SAVE_KEY] ?? null;
  let sameSave = false;
  if (current != null) {
    try {
      const currentParsed = JSON.parse(current);
      const currentVersion = typeof currentParsed.version === "number" ? currentParsed.version : 1;
      if (currentVersion <= engine.SAVE_VERSION) {
        sameSave = serializeAccepted(engine.migrate(currentParsed), engine.SAVE_VERSION) === canonical;
      }
    } catch {
      sameSave = false;
    }
  }
  const deckSame =
    !decodedDeck ||
    stableDeck(decodedDeck) === stableDeck(beforeDeck);
  if (sameSave && deckSame) {
    return { ok: true, code: "duplicate", written: false, saveVersion: version };
  }

  try {
    const rescue = JSON.stringify({
      reason: "pre-import",
      storage: before,
      deck: beforeDeck.map((entry) => ({
        key: entry.key,
        mediaType: entry.mediaType,
        base64: bytesToBase64(entry.bytes),
      })),
    });
    storage.setItem(RESCUE_KEY, rescue);
    if (!sameSave) {
      const previous = before[engine.SAVE_KEY];
      const previousBak = before[engine.SAVE_KEY + ".bak"];
      if (previous) {
        storage.setItem(engine.SAVE_KEY + ".bak", previous);
      } else if (previousBak != null) {
        storage.setItem(engine.SAVE_KEY + ".bak", previousBak);
      }
      storage.setItem(engine.SAVE_KEY, canonical);
    }
    if (decodedDeck && deck && !deckSame) await deck.replace(decodedDeck);
  } catch (err) {
    try {
      restoreStorage(storage, before);
      await restoreDeck(deck, beforeDeck);
    } catch (restoreErr) {
      return fail("storage-unavailable", {
        error: String(err && err.name || err),
        restoreError: String(restoreErr && restoreErr.name || restoreErr),
      });
    }
    return fail("storage-unavailable", { error: String(err && err.name || err) });
  }

  return {
    ok: true,
    code: "imported",
    written: true,
    fromVersion: version,
    toVersion: engine.SAVE_VERSION,
  };
}

function stableDeck(entries) {
  return JSON.stringify(
    [...entries]
      .map((entry) => ({
        key: entry.key,
        mediaType: entry.mediaType || "",
        base64: entry.bytes ? bytesToBase64(entry.bytes) : entry.base64 || "",
      }))
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)),
  );
}

export function inspectRawSave(raw, engine) {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, code: "empty" };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, code: "damaged" };
  }
  const version = parsed && typeof parsed.version === "number" ? parsed.version : 1;
  if (version > engine.SAVE_VERSION) {
    return { ok: false, code: "incompatible", saveVersion: version, supportedMax: engine.SAVE_VERSION };
  }
  try {
    const migrated = engine.migrate(parsed);
    return {
      ok: true,
      code: "readable",
      fromVersion: version,
      toVersion: engine.SAVE_VERSION,
      name: migrated.character?.name ?? null,
      cycle: migrated.cycle ?? null,
      mapId: migrated.mapId ?? null,
    };
  } catch {
    return { ok: false, code: "damaged" };
  }
}
