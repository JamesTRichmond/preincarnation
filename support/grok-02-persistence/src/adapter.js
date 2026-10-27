/**
 * Integration adapter. Looks for a game save module and does not invent one.
 * The reference model is used only when this probe reports found:false.
 *
 * A bindable module must be a JS file that default-exports or exports `saveApi`
 * with `contract === "grok-02-persistence-contract-1"` and:
 *   loadBlob(text) -> { ok, state, error, recoveredFrom? }
 *   applyAction(state, action) -> { ok, state, error }
 *   serialize(state) -> string
 * Those names are the pack's contract, not a claim that the game already uses them.
 *
 * The shipped game's src/game/save.ts is inspected separately. It is not bound.
 */
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { CONTRACT_ID } from "./model.js";

export const CANDIDATE_PATHS = [
  "src/game/save.js",
  "src/game/persistence.js",
  "src/game/save/index.js",
  "src/preincarnation/save.js",
  "src/preincarnation/persistence.js",
  "src/save/index.js",
  "src/save.js",
  "game/save.js",
];

function contractApi(mod) {
  const api = mod?.saveApi || mod?.default;
  if (!api || typeof api !== "object") return { api: null, reason: "no-save-api" };
  if (api.contract !== CONTRACT_ID) return { api, reason: "contract-mismatch", detail: String(api.contract) };
  for (const name of ["loadBlob", "applyAction", "serialize"]) {
    if (typeof api[name] !== "function") return { api, reason: "missing-function", detail: name };
  }
  return { api, reason: null };
}

export async function probeGameSave(repoRoot) {
  const override = process.env.PREINCARNATION_SAVE_MODULE;
  const paths = override ? [{ abs: override, rel: override }] : CANDIDATE_PATHS.map((rel) => ({ abs: join(repoRoot, rel), rel }));
  const tried = [];
  for (const { abs, rel } of paths) {
    tried.push(rel);
    if (!existsSync(abs)) continue;
    let mod;
    try {
      mod = await import(pathToFileURL(abs).href);
    } catch (error) {
      return { found: false, tried, path: rel, reason: "import-error", detail: String(error?.message || error) };
    }
    const bound = contractApi(mod);
    if (bound.reason) return { found: false, tried, path: rel, reason: bound.reason, detail: bound.detail };
    return { found: true, tried, path: rel };
  }
  return { found: false, tried, reason: "no-module" };
}

function memoryStorage() {
  const mem = new Map();
  return {
    mem,
    storage: {
      get length() {
        return mem.size;
      },
      clear() {
        mem.clear();
      },
      getItem(key) {
        return mem.has(key) ? mem.get(key) : null;
      },
      key(index) {
        return [...mem.keys()][index] ?? null;
      },
      removeItem(key) {
        mem.delete(key);
      },
      setItem(key, value) {
        mem.set(key, value);
      },
    },
  };
}

function withStorage(fn) {
  const previous = globalThis.localStorage;
  const { mem, storage } = memoryStorage();
  globalThis.localStorage = storage;
  try {
    return fn(mem);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
}

/**
 * Read the shipped save without binding it. Observations are whatever the
 * functions returned on this run. They are not the 95 reference cases.
 */
export async function inspectLiveSave(repoRoot) {
  const path = join(repoRoot, "src/game/save.ts");
  const typesPath = join(repoRoot, "src/game/types.ts");
  const rulesPath = join(repoRoot, "src/game/rules.ts");
  if (!existsSync(path)) return { present: false, path: "src/game/save.ts", imported: false, bound: false, reason: "absent" };
  let saveMod;
  let typesMod;
  let rulesMod;
  try {
    saveMod = await import(pathToFileURL(path).href);
    typesMod = await import(pathToFileURL(typesPath).href);
    rulesMod = await import(pathToFileURL(rulesPath).href);
  } catch (error) {
    return {
      present: true,
      path: "src/game/save.ts",
      imported: false,
      bound: false,
      reason: "import-error",
      detail: String(error?.message || error),
    };
  }
  const bound = contractApi(saveMod);
  const names = ["defaultSave", "migrate", "loadSave", "writeSave", "clearSave"].filter(
    (name) => typeof saveMod[name] === "function",
  );
  const observations = withStorage((mem) => {
    const fresh = saveMod.defaultSave();
    const key = typesMod.SAVE_KEY;
    const out = {
      saveVersion: typesMod.SAVE_VERSION,
      saveKey: key,
      defaultName: fresh.character.name,
      defaultCycle: fresh.cycle,
      defaultYear: fresh.flags.year,
      defaultMap: fresh.mapId,
      defaultIncarnation: fresh.incarnation,
      hasChecksumField: Object.prototype.hasOwnProperty.call(fresh, "checksum"),
    };
    fresh.character.name = "Ira Fenn";
    fresh.character.created = true;
    fresh.cycle = 2;
    saveMod.writeSave(fresh);
    saveMod.writeSave(fresh);
    const round = saveMod.loadSave();
    out.roundTripName = round.character.name;
    out.roundTripCycle = round.cycle;
    out.backupWritten = mem.has(key + ".bak");
    mem.set(key, "{not json");
    const fromBak = saveMod.loadSave();
    out.corruptFallsToBackupName = fromBak.character.name;
    out.corruptFallsToBackupCycle = fromBak.cycle;
    mem.delete(key);
    mem.delete(key + ".bak");
    mem.set(key, "{not json");
    const garbage = saveMod.loadSave();
    out.garbageWithoutBackupName = garbage.character.name;
    out.garbageWithoutBackupCycle = garbage.cycle;
    const ira = saveMod.defaultSave();
    ira.character.name = "Ira Fenn";
    ira.character.created = true;
    ira.cycle = 6;
    saveMod.writeSave(ira);
    saveMod.writeSave(ira);
    saveMod.clearSave();
    const forgotten = saveMod.loadSave();
    out.forgetName = forgotten.character.name;
    out.forgetCycle = forgotten.cycle;
    out.forgetLeavesBackup = mem.has(key + ".bak");
    const stood = {
      version: 7,
      cycle: 2,
      mapId: "middlebury",
      x: 40,
      y: 40,
      character: { name: "Ira Fenn", created: true },
      flags: { talked: ["elder"] },
    };
    mem.set(key, JSON.stringify(stood));
    const migrated = saveMod.loadSave();
    out.v7MigratedVersion = migrated.version;
    out.v7MigratedName = migrated.character.name;
    out.v7Talked = migrated.flags.talked[0] ?? null;
    const dead = rulesMod.resolveDeath(saveMod.defaultSave(), { mapId: "middlebury", x: 10, y: 12 });
    const cycleAfterOne = dead.cycle;
    const yearAfterOne = dead.flags.year;
    out.oneDeathCycle = cycleAfterOne;
    out.oneDeathYear = yearAfterOne;
    out.oneDeathReturned = dead.flags.returnedFromDeath;
    out.oneDeathHost = dead.flags.afterlifeHost;
    out.oneDeathInventory = dead.inventory.map((item) => item.id);
    out.winters = rulesMod.wintersPassed();
    const again = rulesMod.resolveDeath(dead, { mapId: "bristol", x: 4, y: 4 });
    out.secondDeathCycle = again.cycle;
    out.secondDeathYear = again.flags.year;
    out.deathIsIdempotent = again.cycle === cycleAfterOne;
    const kept = rulesMod.grantBondKeepsake(again);
    out.maeveLanternAfterReturn = kept.flags.relics.includes("lantern");
    return out;
  });
  return {
    present: true,
    path: "src/game/save.ts",
    imported: true,
    bound: bound.reason == null,
    reason: bound.reason ?? "bound",
    detail:
      "src/game/save.ts does not export grok-02-persistence-contract-1. It stores SaveData in localStorage. The 95 cases stay on the reference model.",
    exports: names,
    observations,
  };
}
