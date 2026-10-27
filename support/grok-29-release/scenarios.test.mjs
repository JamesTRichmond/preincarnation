import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runBootGuard } from "./lib/boot-guard.mjs";
import {
  applyVercelOutputHeaders,
  auditAssetReferences,
  cacheHeaderRoutes,
  isKnownShellRegistration,
  mergeVercelOutputHeaders,
  rewriteAssetUrls,
  rewriteTreeAssetUrls,
} from "./lib/cache-policy.mjs";
import { loadEngine } from "./lib/engine.mjs";
import {
  acknowledgeInterruption,
  beginLaunch,
  completeLaunch,
  freshJournal,
  rollback,
  stageUpdate,
} from "./lib/launch.mjs";
import { memoryDeck, memoryStorage } from "./lib/memory-storage.mjs";
import { exportEnvelope, importEnvelope, RESCUE_KEY } from "./lib/player-data.mjs";
import { emitSaveContract } from "./lib/emit-save-contract.mjs";
import { pathToFileURL } from "node:url";
import { checkUpdate } from "./lib/update-check.mjs";

const engine = await loadEngine();
const KEY = engine.SAVE_KEY;

const v7 = {
  version: 7,
  cycle: 2,
  karma: 4,
  crowns: 0,
  incarnation: "wanderer",
  upgrades: { vitality: 1 },
  flags: { relics: ["sword", "shovel"], talked: ["elder"] },
  maxHp: 8,
  hp: 8,
  mapId: "middlebury",
  x: 40,
  y: 40,
  inventory: [],
  equippedId: "",
  character: { name: "Ira Fenn", created: true, bondId: "maeve" },
};

function lifeFile(save) {
  return JSON.stringify({
    kind: "preincarnation-player-export",
    exportVersion: 1,
    savedAt: "2026-09-11T20:48:09Z",
    sourceBuild: "test",
    storage: { [KEY]: JSON.stringify(save) },
    deck: { db: "preincarnation.deck.v1", store: "files", version: 1, records: [] },
  });
}

test("fresh install leaves storage empty and a new life readable", async () => {
  const storage = memoryStorage();
  const journal = freshJournal("web-save8");
  assert.equal(storage.getItem(KEY), null);
  assert.equal(runBootGuard(storage, 8).action, "fresh");
  const started = beginLaunch(journal);
  assert.equal(started.code, "starting");
  assert.equal(completeLaunch(journal).code, "ready");
  assert.deepEqual(storage.dump(), {});
  globalThis.localStorage = storage;
  const loaded = engine.loadSave();
  assert.equal(loaded.version, engine.SAVE_VERSION);
  assert.equal(loaded.character.name, "Ellis Perch");
  assert.equal(loaded.cycle, 0);
  assert.equal(storage.getItem(KEY), null);
});

test("previous-version update migrates v7 through the engine and keeps a raw backup", async () => {
  const storage = memoryStorage({ [KEY]: JSON.stringify(v7) });
  const packages = {
    "web-save7": { saveMax: 7 },
    "web-save8": { saveMax: 8 },
  };
  const journal = freshJournal("web-save7");
  const staged = stageUpdate(journal, storage, KEY, "web-save8");
  assert.equal(staged.backedUp, true);
  assert.equal(JSON.parse(storage.getItem(KEY + ".premigration")).version, 7);
  assert.equal(JSON.parse(storage.getItem(KEY + ".premigration")).character.name, "Ira Fenn");
  const guard = runBootGuard(storage, 8);
  assert.equal(guard.action, "snapshot-premigration");
  const migrated = engine.migrate(JSON.parse(storage.getItem(KEY)));
  storage.setItem(KEY + ".bak", storage.getItem(KEY));
  storage.setItem(KEY, JSON.stringify({ ...migrated, version: engine.SAVE_VERSION }));
  const live = JSON.parse(storage.getItem(KEY));
  assert.equal(live.version, engine.SAVE_VERSION);
  assert.equal(live.character.name, "Ira Fenn");
  assert.equal(live.character.bondId, "maeve");
  assert.equal(live.flags.lastDeed, "");
  assert.equal(live.flags.returnedFromDeath, false);
  assert.equal(live.upgrades.vitality, 1);
  assert.equal(live.upgrades.edge, 0);
  assert.equal(packages["web-save8"].saveMax, 8);
});

test("rollback to a supported version restores the pre-migration life and refuses a bare v8", () => {
  const packages = {
    "web-save7": { saveMax: 7 },
    "web-save8": { saveMax: 8 },
  };
  const storage = memoryStorage({
    [KEY]: JSON.stringify({ ...v7, version: 8, character: { name: "Ira Fenn", created: true } }),
    [KEY + ".premigration"]: JSON.stringify(v7),
  });
  const journal = { active: "web-save8", previous: "web-save7", launch: "ready", interrupted: 0 };
  const rolled = rollback(journal, storage, KEY, packages);
  assert.equal(rolled.code, "rolled-back");
  assert.equal(journal.active, "web-save7");
  assert.equal(JSON.parse(storage.getItem(KEY)).version, 7);
  assert.equal(JSON.parse(storage.getItem(KEY + ".forward")).version, 8);

  const bare = memoryStorage({ [KEY]: JSON.stringify({ version: 8 }) });
  const journal2 = { active: "web-save8", previous: "web-save7", launch: "ready", interrupted: 0 };
  const refused = rollback(journal2, bare, KEY, packages);
  assert.equal(refused.code, "incompatible-rollback");
  assert.equal(JSON.parse(bare.getItem(KEY)).version, 8);
  assert.equal(journal2.active, "web-save8");
});

test("interrupted launch does not touch the save", () => {
  const storage = memoryStorage({ [KEY]: JSON.stringify(v7), [KEY + ".bak"]: "{\"version\":6}" });
  const before = storage.dump();
  const journal = freshJournal("web-save8");
  beginLaunch(journal);
  const again = beginLaunch(journal);
  assert.equal(again.code, "interrupted");
  assert.deepEqual(storage.dump(), before);
  assert.equal(acknowledgeInterruption(journal).code, "acknowledged");
  assert.deepEqual(storage.dump(), before);
  assert.equal(beginLaunch(journal).code, "starting");
});

test("damaged import, future save, and duplicate import", async () => {
  const storage = memoryStorage({
    [KEY]: JSON.stringify(v7),
    [KEY + ".bak"]: JSON.stringify({ version: 4, character: { name: "Kept" } }),
  });
  const deck = memoryDeck([{ key: "file-a", mediaType: "audio/mpeg", bytes: [1, 2, 3, 255] }]);
  const before = storage.dump();
  const beforeDeck = deck.snapshot();

  const damaged = await importEnvelope("{not json", { storage, deck, engine });
  assert.equal(damaged.code, "damaged");
  assert.deepEqual(storage.dump(), before);

  const badKind = await importEnvelope(JSON.stringify({ kind: "other", exportVersion: 1 }), {
    storage,
    deck,
    engine,
  });
  assert.equal(badKind.code, "damaged");

  const future = await importEnvelope(lifeFile({ ...v7, version: engine.SAVE_VERSION + 1 }), { storage, deck, engine });
  assert.equal(future.code, "incompatible");
  assert.equal(future.supportedMax, engine.SAVE_VERSION);
  assert.deepEqual(storage.dump(), before);
  assert.deepEqual(deck.snapshot(), beforeDeck);

  const badDeck = JSON.parse(lifeFile(v7));
  badDeck.deck.records = [{ key: "x", mediaType: "audio/mpeg", base64: "****" }];
  const damagedDeck = await importEnvelope(JSON.stringify(badDeck), { storage, deck, engine });
  assert.equal(damagedDeck.code, "damaged");
  assert.deepEqual(storage.dump(), before);

  const first = await importEnvelope(lifeFile({ ...v7, cycle: 3 }), { storage, deck, engine });
  assert.equal(first.code, "imported");
  assert.equal(JSON.parse(storage.getItem(KEY)).version, engine.SAVE_VERSION);
  assert.equal(JSON.parse(storage.getItem(KEY)).cycle, 3);
  assert.equal(JSON.parse(storage.getItem(KEY)).character.name, "Ira Fenn");
  assert.equal(JSON.parse(storage.getItem(KEY + ".bak")).version, 7);
  assert.ok(storage.getItem(RESCUE_KEY));

  const after = storage.dump();
  const second = await importEnvelope(lifeFile({ ...v7, cycle: 3 }), { storage, deck, engine });
  assert.equal(second.code, "duplicate");
  assert.equal(second.written, false);
  assert.deepEqual(storage.dump(), after);
});

test("import keeps an existing backup when the slot is empty", async () => {
  const bak = JSON.stringify({ version: 6, character: { name: "Kept" } });
  const storage = memoryStorage({ [KEY + ".bak"]: bak });
  const deck = memoryDeck();
  const result = await importEnvelope(lifeFile(v7), { storage, deck, engine });
  assert.equal(result.code, "imported");
  assert.equal(storage.getItem(KEY + ".bak"), bak);
  assert.equal(JSON.parse(storage.getItem(KEY)).version, engine.SAVE_VERSION);
});

test("unavailable storage rolls back the import", async () => {
  const storage = memoryStorage({ [KEY]: JSON.stringify(v7) });
  const deck = memoryDeck();
  storage.failOnNthSet(3);
  const before = storage.dump();
  const result = await importEnvelope(lifeFile({ ...v7, cycle: 5 }), { storage, deck, engine });
  assert.equal(result.code, "storage-unavailable");
  assert.equal(storage.getItem(KEY), before[KEY]);
  assert.equal(storage.getItem(KEY + ".bak"), null);
  assert.equal(storage.getItem(RESCUE_KEY), null);
});

test("boot guard quarantines a future life and snapshots an older one", () => {
  const future = memoryStorage({ [KEY]: JSON.stringify({ version: 9, character: { name: "Later" } }), [KEY + ".bak"]: JSON.stringify(v7) });
  const report = runBootGuard(future, 8);
  assert.equal(report.action, "quarantine-future");
  assert.equal(JSON.parse(future.getItem(KEY + ".future")).version, 9);
  assert.equal(JSON.parse(future.getItem(KEY)).version, 7);
  assert.equal(future.getItem("preincarnation.release.blocked"), "future-save");

  const older = memoryStorage({ [KEY]: JSON.stringify(v7) });
  assert.equal(runBootGuard(older, 8).action, "snapshot-premigration");
  assert.equal(JSON.parse(older.getItem(KEY + ".premigration")).character.name, "Ira Fenn");
  assert.equal(runBootGuard(older, 8).action, "snapshot-premigration");
  assert.equal(JSON.parse(older.getItem(KEY)).version, 7);

  const blocked = memoryStorage();
  blocked.failOn("get");
  const unavailable = runBootGuard(blocked, 8);
  assert.equal(unavailable.storage, "unavailable");
  assert.equal(unavailable.action, "untouched");
});

test("engine v1 coordinates are migrated and a garbage blob does not throw", () => {
  const raw = { version: 1, x: 32, y: 64, character: { name: "Old Road" } };
  const migrated = engine.migrate(raw);
  assert.equal(migrated.version, engine.SAVE_VERSION);
  assert.equal(migrated.x, 16);
  assert.equal(migrated.y, 32);
  assert.equal(migrated.character.name, "Old Road");
  assert.equal(migrated.inventory[0].id, "starter-iron");
  globalThis.localStorage = memoryStorage({ [KEY]: "{not json" });
  assert.equal(engine.loadSave().cycle, 0);
});

test("export round-trips the strange-device bytes", async () => {
  const storage = memoryStorage({ [KEY]: JSON.stringify(engine.defaultSave()) });
  const deck = memoryDeck([{ key: "file-a", mediaType: "audio/mpeg", bytes: [0, 1, 255, 10] }]);
  const envelope = await exportEnvelope(storage, deck, {
    savedAt: "2026-09-11T20:48:09Z",
    sourceBuild: "web-save8",
    saveKey: KEY,
    saveVersion: 8,
  });
  const other = memoryStorage();
  const otherDeck = memoryDeck();
  const result = await importEnvelope(JSON.stringify(envelope), { storage: other, deck: otherDeck, engine });
  assert.equal(result.code, "imported");
  assert.deepEqual(otherDeck.snapshot()[0].bytes, [0, 1, 255, 10]);
  assert.equal(JSON.parse(other.getItem(KEY)).character.name, "Ellis Perch");
});

test("emitted browser save contract matches the engine migrate", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pre-save-"));
  emitSaveContract(engine.root, dir);
  const emitted = await import(pathToFileURL(join(dir, "save.js")).href);
  const types = await import(pathToFileURL(join(dir, "types.js")).href);
  assert.equal(types.SAVE_KEY, engine.SAVE_KEY);
  assert.equal(types.SAVE_VERSION, engine.SAVE_VERSION);
  const viaEngine = engine.migrate(v7);
  const viaBrowser = emitted.migrate(v7);
  assert.equal(viaBrowser.character.name, viaEngine.character.name);
  assert.equal(viaBrowser.version, viaEngine.version);
  assert.equal(viaBrowser.flags.lastDeed, viaEngine.flags.lastDeed);
  assert.equal(JSON.stringify(viaBrowser), JSON.stringify(viaEngine));
});

test("update check stays quiet offline and does not claim currency", () => {
  const offline = checkUpdate({ localBuildId: "a", localSaveMax: 8, remote: null, offline: true });
  assert.equal(offline.status, "offline");
  assert.equal(offline.action, "keep-local");
  const current = checkUpdate({
    localBuildId: "a",
    localSaveMax: 8,
    offline: false,
    remote: { buildId: "a", save: { version: 8 } },
  });
  assert.equal(current.status, "current");
  const next = checkUpdate({
    localBuildId: "a",
    localSaveMax: 8,
    offline: false,
    remote: { buildId: "b", save: { version: 8 } },
  });
  assert.equal(next.status, "update-available");
  assert.equal(next.action, "export-then-update");
});

test("asset rewrite is idempotent and headers refuse a mixed generation", () => {
  const buildId = "web-c737e42-save8";
  const source = 'const sheets={wanderer:"/game/wanderer-walk/snes.png?v=3",bear:"/game/bear-walk/snes.png"};';
  const once = rewriteAssetUrls(source, buildId);
  const twice = rewriteAssetUrls(once, buildId);
  assert.equal(once, twice);
  assert.match(once, /\/game\/wanderer-walk\/snes\.png\?b=web-c737e42-save8/);
  assert.match(once, /\/game\/bear-walk\/snes\.png\?b=web-c737e42-save8/);
  assert.doesNotMatch(once, /\?v=3/);

  const dir = mkdtempSync(join(tmpdir(), "pre-cache-"));
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "client.js"), source);
  writeFileSync(join(dir, ".vercel-config.json"), JSON.stringify({ version: 3, routes: [{ handle: "filesystem" }] }));
  const rewritten = rewriteTreeAssetUrls(dir, buildId);
  assert.equal(rewritten.files, 1);
  const audit = auditAssetReferences(dir, buildId);
  assert.deepEqual(audit.stale, []);
  assert.deepEqual(audit.workers, []);
  const merged = mergeVercelOutputHeaders(JSON.parse(readFileSync(join(dir, ".vercel-config.json"), "utf8")), buildId);
  assert.equal(merged.routes[0].src, "/release-manifest.json");
  assert.match(merged.routes[0].headers["cache-control"], /no-store/);
  assert.equal(merged.routes.at(-1).handle, "filesystem");
  writeFileSync(join(dir, "config.json"), JSON.stringify({ version: 3, routes: [{ handle: "filesystem" }] }));
  applyVercelOutputHeaders(join(dir, "config.json"), buildId);
  const headers = cacheHeaderRoutes(buildId);
  assert.ok(headers.some((route) => route.src === "/assets/(.*)"));
  const staleDir = mkdtempSync(join(tmpdir(), "pre-stale-"));
  writeFileSync(join(staleDir, "old.js"), 'x="/game/crow/snes.png"');
  const stale = auditAssetReferences(staleDir, buildId);
  assert.equal(stale.stale.length, 1);
});

test("only the shell worker registration is a known service worker", () => {
  assert.equal(isKnownShellRegistration('navigator.serviceWorker.register("/sw.js")'), true);
  assert.equal(isKnownShellRegistration('navigator.serviceWorker.register("/other.js")'), false);
  assert.equal(isKnownShellRegistration("caches.open('x')"), false);
});
