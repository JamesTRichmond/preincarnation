/**
 * Reference-model runner for the PREINCARNATION persistence pack.
 * Results describe this model only. They are not evidence the game passes.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { probeGameSave, inspectLiveSave } from "./adapter.js";
import { KNOWN_INVARIANTS, checkInvariant } from "./invariants.js";
import {
  applyAction,
  clearedCount,
  createSession,
  deepEqual,
  makeNewGame,
  mergePatch,
  tryDecode,
  validateV3,
} from "./model.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_THEMES = [
  "ordinary-save-load",
  "death",
  "shrine-release",
  "form-unlock",
  "quest-succession",
  "boss-key-reward",
  "warp-ending",
  "interrupted-write",
  "missing-field",
  "corrupt-value",
  "older-version",
  "duplicate-death",
  "death-during-boss-reward",
  "save-in-afterlife",
  "quest-transition-save",
  "ending-then-death",
  "repeated-returns-after-70",
];
const REQUIRED_CATEGORIES = ["ordinary", "death-release", "forms", "quest-npc", "boss-key-reward", "warp-ending", "integrity", "migration"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function getPath(obj, path) {
  let cursor = obj;
  for (const part of path.split(".")) {
    if (cursor == null) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function same(actual, expected) {
  return deepEqual(actual, expected);
}

function checkMatch(state, match, label, problems) {
  if (!match) return;
  for (const [path, expected] of Object.entries(match)) {
    const actual = getPath(state, path);
    if (!same(actual, expected)) problems.push(`${label}${path}: expected ${JSON.stringify(expected)} actual ${JSON.stringify(actual)}`);
  }
}

function checkIncludes(state, includes, label, problems) {
  if (!includes) return;
  for (const [path, needed] of Object.entries(includes)) {
    const actual = getPath(state, path);
    if (!Array.isArray(actual)) {
      problems.push(`${label}${path}: not an array`);
      continue;
    }
    for (const item of needed) {
      if (!actual.some((candidate) => same(candidate, item))) problems.push(`${label}${path} missing ${JSON.stringify(item)}`);
    }
  }
}

function assertCaseShape(entry) {
  for (const key of ["id", "title", "starting", "why", "systems", "layers", "invariants", "expect", "category", "themes"]) {
    if (entry[key] == null) throw new Error(`${entry.id || "?"} missing ${key}`);
  }
  if (typeof entry.why !== "string" || entry.why.length < 20) throw new Error(`${entry.id} why too short`);
  if (!Array.isArray(entry.systems) || entry.systems.length === 0) throw new Error(`${entry.id} systems`);
  if (!Array.isArray(entry.actions) && entry.raw == null && !entry.loadFile) throw new Error(`${entry.id} has no actions or raw`);
  for (const id of entry.invariants) if (!KNOWN_INVARIANTS.includes(id)) throw new Error(`${entry.id} unknown invariant ${id}`);
  const failing = entry.expect.ok === false;
  if (failing && !entry.invariants.includes("no-synthetic-state")) throw new Error(`${entry.id} failure must list no-synthetic-state`);
  if (!failing && !entry.invariants.includes("core")) throw new Error(`${entry.id} success must list core`);
}

function runActions(session, actions) {
  let last = { ok: true, state: session.live };
  for (const action of actions) {
    const before = structuredClone(session.live);
    let result;
    try {
      result = applyAction(session, action);
    } catch (error) {
      return { ok: false, error: "exception", detail: String(error?.stack || error), state: null, crashed: true };
    }
    if (!result.ok) {
      if (!deepEqual(session.live, before)) {
        return { ok: false, error: "mutated-on-failure", detail: result.error, state: null };
      }
      return result;
    }
    last = result;
  }
  return last;
}

function evaluate(entry, session, result) {
  const problems = [];
  const expect = entry.expect;
  if (Boolean(result.ok) !== Boolean(expect.ok)) problems.push(`ok: expected ${expect.ok} actual ${result.ok} error=${result.error || ""} detail=${result.detail || ""}`);
  if (expect.error != null && result.error !== expect.error) problems.push(`error: expected ${expect.error} actual ${result.error}`);
  if (expect.stateIsNull && result.state != null) problems.push("result.state was not null");
  if (Object.prototype.hasOwnProperty.call(expect, "recoveredFrom") && (result.recoveredFrom ?? null) !== expect.recoveredFrom) {
    problems.push(`recoveredFrom: expected ${expect.recoveredFrom} actual ${result.recoveredFrom}`);
  }
  if (expect.primaryError && result.primaryError !== expect.primaryError) problems.push(`primaryError: expected ${expect.primaryError} actual ${result.primaryError}`);
  if (expect.idempotent && result.idempotent !== true) problems.push("expected idempotent");
  if (expect.migratedFrom != null && result.migratedFrom !== expect.migratedFrom) problems.push(`migratedFrom: expected ${expect.migratedFrom} actual ${result.migratedFrom}`);
  if (expect.defaultsApplied) {
    const actual = [...(result.defaultsApplied || [])].sort();
    const wanted = [...expect.defaultsApplied].sort();
    if (!same(actual, wanted)) problems.push(`defaultsApplied: expected ${JSON.stringify(wanted)} actual ${JSON.stringify(actual)}`);
  }
  if (expect.ignoredFlags && !same(result.ignoredFlags || [], expect.ignoredFlags)) problems.push(`ignoredFlags: ${JSON.stringify(result.ignoredFlags)}`);
  if (expect.ignoredFields && !same(result.ignoredFields || [], expect.ignoredFields)) problems.push(`ignoredFields: ${JSON.stringify(result.ignoredFields)}`);
  if (expect.assumptionsInclude) {
    for (const item of expect.assumptionsInclude) {
      if (!(result.assumptions || []).includes(item)) problems.push(`missing assumption ${item}`);
    }
  }
  if (expect.strippedInclude) {
    for (const item of expect.strippedInclude) {
      if (!(result.stripped || []).includes(item)) problems.push(`stripped missing ${item} (have ${JSON.stringify(result.stripped || [])})`);
    }
  }
  if (result.ok) {
    checkMatch(session.live, expect.match, "", problems);
    checkIncludes(session.live, expect.includes, "", problems);
    if (expect.clearedCount != null && clearedCount(session.live) !== expect.clearedCount) {
      problems.push(`clearedCount: expected ${expect.clearedCount} actual ${clearedCount(session.live)}`);
    }
    if (expect.absent) {
      for (const path of expect.absent) {
        if (getPath(session.live, path) !== undefined) problems.push(`expected absent ${path}`);
      }
    }
    if (expect.equalsCheckpoint && !deepEqual(session.live, session.checkpoints[expect.equalsCheckpoint])) {
      problems.push(`live != checkpoint ${expect.equalsCheckpoint}`);
    }
    for (const id of entry.invariants) {
      const problem = checkInvariant(id, session.live, session);
      if (problem) problems.push(`invariant ${id}: ${problem}`);
    }
  }
  if (expect.liveMatch) checkMatch(session.live, expect.liveMatch, "live ", problems);
  if (expect.liveIncludes) checkIncludes(session.live, expect.liveIncludes, "live ", problems);
  if (expect.checkpointMatch) {
    for (const [name, match] of Object.entries(expect.checkpointMatch)) {
      const snap = session.checkpoints[name];
      if (!snap) problems.push(`missing checkpoint ${name}`);
      else checkMatch(snap, match, `checkpoint ${name} `, problems);
    }
  }
  if (expect.backupMatch) {
    const decoded = tryDecode(session.slots[session.active].backup);
    if (!decoded.ok) problems.push(`backup did not decode: ${decoded.error}`);
    else checkMatch(decoded.state, expect.backupMatch, "backup ", problems);
  }
  if (expect.slots) {
    for (const [name, spec] of Object.entries(expect.slots)) {
      const decoded = tryDecode(session.slots[name].primary);
      if (!decoded.ok) problems.push(`slot ${name} did not decode: ${decoded.error} ${decoded.detail || ""}`);
      else checkMatch(decoded.state, spec.match, `slot ${name} `, problems);
    }
  }
  return problems;
}

function runGameplay(entry) {
  const loaded = readJson(join(root, "fixtures/bases", `${entry.base}.json`));
  const start = entry.patch ? mergePatch(loaded, entry.patch) : loaded;
  const verdict = validateV3(start);
  if (!verdict.ok) return { problems: [`invalid start ${verdict.error} ${verdict.detail || ""}`] };
  const session = createSession(start);
  const result = runActions(session, entry.actions);
  return { problems: evaluate(entry, session, result) };
}

function runMigration(entry) {
  const text = entry.loadFile
    ? readFileSync(join(root, "fixtures/raw", entry.loadFile), "utf8")
    : JSON.stringify(entry.raw);
  const session = createSession(makeNewGame());
  const before = structuredClone(session.live);
  session.slots.A.primary = text;
  session.slots.A.backup = null;
  const result = applyAction(session, { op: "load" });
  const problems = [];
  if (!result.ok && !deepEqual(session.live, before)) problems.push("failed migration mutated live");
  problems.push(...evaluate(entry, session, result));
  return { problems };
}

function coverage(entries) {
  const problems = [];
  if (entries.length < 72) problems.push(`only ${entries.length} cases`);
  const cross = entries.filter((entry) => entry.systems.length >= 3);
  if (cross.length < 12) problems.push(`only ${cross.length} cross-system cases`);
  const themes = new Set(entries.flatMap((entry) => entry.themes));
  for (const theme of REQUIRED_THEMES) if (!themes.has(theme)) problems.push(`missing theme ${theme}`);
  const categories = new Set(entries.map((entry) => entry.category));
  for (const category of REQUIRED_CATEGORIES) if (!categories.has(category)) problems.push(`missing category ${category}`);
  const ids = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id)) problems.push(`duplicate id ${entry.id}`);
    ids.add(entry.id);
  }
  return { problems, cross: cross.length, themes: [...themes].sort() };
}

export async function runPack(repoRoot) {
  const gameplay = readJson(join(root, "fixtures/cases.json"));
  const migration = readJson(join(root, "migration-cases.json"));
  const entries = [...gameplay.cases, ...migration.cases];
  for (const entry of entries) assertCaseShape(entry);

  const probe = await probeGameSave(repoRoot);
  const liveSave = await inspectLiveSave(repoRoot);
  const failures = [];
  let passed = 0;
  for (const entry of entries) {
    const outcome = entry.raw || entry.loadFile ? runMigration(entry) : runGameplay(entry);
    if (outcome.problems.length === 0) passed += 1;
    else failures.push({ id: entry.id, problems: outcome.problems });
  }
  const cover = coverage(entries);
  const engine = probe.found ? "game-module" : "reference-model";
  return {
    engine,
    gameModule: probe,
    liveSave,
    contract: gameplay.contract,
    cases: entries.length,
    passed,
    failed: failures.length,
    crossSystem: cover.cross,
    coverageProblems: cover.problems,
    themes: cover.themes,
    failures,
    note: "reference-model results are not game results. liveSave.observations are separate calls into src/game and are not the 95 cases.",
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const repoRoot = join(root, "..", "..");
  const summary = await runPack(repoRoot);
  mkdirSync(join(root, "out"), { recursive: true });
  writeFileSync(join(root, "out/last-run.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`MODE ${summary.engine}`);
  console.log(`GAME_MODULE ${summary.gameModule.found ? summary.gameModule.path : summary.gameModule.reason}`);
  console.log(`LIVE ${summary.liveSave.imported ? summary.liveSave.reason : summary.liveSave.reason}`);
  console.log(`CASES ${summary.cases} passed ${summary.passed} failed ${summary.failed} cross ${summary.crossSystem}`);
  if (summary.coverageProblems.length) console.log(`COVERAGE ${summary.coverageProblems.join("; ")}`);
  for (const failure of summary.failures) {
    console.log(`FAIL ${failure.id}`);
    for (const problem of failure.problems) console.log(`  ${problem}`);
  }
  if (summary.failed === 0 && summary.coverageProblems.length === 0 && summary.engine === "reference-model") {
    console.log("PASS reference-model");
  } else process.exitCode = 1;
}

