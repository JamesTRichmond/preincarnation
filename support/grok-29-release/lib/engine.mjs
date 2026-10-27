import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const SOURCE = {
  repo: "https://github.com/JamesTRichmond/preincarnation.git",
  commit: "c737e42eb188148291438dfb8a5993d6ce2b77fa",
  commitDate: "2026-09-11T20:48:09Z",
  subject: "PREINCARNATION: Vermont reincarnation RPG",
};

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
/** support/grok-29-release/lib → repository root */
export const REPO_ROOT = join(LIB_DIR, "..", "..", "..");

export function defaultEngineRoot() {
  if (process.env.PREINCARNATION_ENGINE) return process.env.PREINCARNATION_ENGINE;
  const candidates = [REPO_ROOT, "/tmp/preincarnation"];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "src/game/save.ts"))) return candidate;
  }
  throw new Error("PREINCARNATION engine checkout not found. Set PREINCARNATION_ENGINE.");
}

export async function loadEngine(root = defaultEngineRoot()) {
  const saveHref = pathToFileURL(join(root, "src/game/save.ts")).href;
  const typesHref = pathToFileURL(join(root, "src/game/types.ts")).href;
  const save = await import(saveHref);
  const types = await import(typesHref);
  if (types.SAVE_KEY !== "preincarnation.save.v1") {
    throw new Error(`unexpected SAVE_KEY ${types.SAVE_KEY}`);
  }
  if (types.SAVE_VERSION !== 9) {
    throw new Error(`unexpected SAVE_VERSION ${types.SAVE_VERSION}`);
  }
  return {
    root,
    migrate: save.migrate,
    defaultSave: save.defaultSave,
    loadSave: save.loadSave,
    writeSave: save.writeSave,
    clearSave: save.clearSave,
    SAVE_KEY: types.SAVE_KEY,
    SAVE_VERSION: types.SAVE_VERSION,
  };
}

export function workspaceTypeScript(engineRoot = defaultEngineRoot()) {
  const require = createRequire(join(engineRoot, "package.json"));
  return require("typescript");
}
