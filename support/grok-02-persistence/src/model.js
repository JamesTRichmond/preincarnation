/**
 * Reference model for the PREINCARNATION persistence contract.
 * This is NOT the game. Passing tests here do not mean the game passes.
 * See ../save-contract.md.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const tables = JSON.parse(readFileSync(join(root, "fixtures/tables/world.json"), "utf8"));

export const CONTRACT_ID = tables.contract;
export const FORM_ORDER = tables.forms;
export const ENDINGS = tables.endings;
export const FOREIGN_KEYS = new Set(["skillNodes", "skillTree", "party", "accountId", "account", "seed"]);

const dungeonById = new Map(tables.dungeons.map((d) => [d.id, d]));
const rewardById = new Map(tables.rewards.map((r) => [r.id, r]));
const keyById = new Map(tables.keys.map((k) => [k.id, k]));
const warpById = new Map(tables.warps.map((w) => [w.id, w]));
const bossIds = new Set(tables.dungeons.filter((d) => d.boss).map((d) => d.id));

export function playableMaps() {
  return new Set([
    tables.spawn.map,
    ...tables.dungeons.map((d) => d.id),
    ...tables.warps.map((w) => w.id),
    "afterlife",
  ]);
}

const PLAYABLE = playableMaps();

export function contentYear(year) {
  return year >= tables.contentFreezeYear ? tables.contentFreezeYear : year;
}

export function expectedNpcs(year) {
  const row = structuredClone(tables.succession[String(contentYear(year))]);
  if (!row) throw new Error(`no succession row for ${year}`);
  if (year >= tables.mayorSealYear) row.mayor = structuredClone(tables.mayorSeal);
  return row;
}

export function derivedForms(person) {
  const have = new Set(["walker"]);
  if (person.deaths + person.releases >= 1) have.add("otter");
  if (person.mayorSpoken) have.add("heron");
  if (person.crowns >= 2) have.add("crown");
  return FORM_ORDER.filter((f) => have.has(f));
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

export function canonicalString(value) {
  return JSON.stringify(canonicalize(value));
}

export function checksum(value) {
  return createHash("sha256").update(canonicalString(value)).digest("hex");
}

export function deepEqual(a, b) {
  return canonicalString(a) === canonicalString(b);
}

export function fail(error, detail) {
  return detail === undefined ? { ok: false, error } : { ok: false, error, detail };
}

function ok(state, extra = {}) {
  return { ok: true, state, ...extra };
}

export function countStat(state, stat) {
  let n = 0;
  for (const id of state.world?.rewardsClaimed ?? []) {
    const spec = rewardById.get(id);
    if (spec?.stat === stat) n += 1;
  }
  return n;
}

export function makeNewGame() {
  const dungeons = {};
  for (const dungeon of tables.dungeons) {
    dungeons[dungeon.id] = { discovered: false, cleared: false, bossDefeated: false };
  }
  const keys = {};
  for (const key of tables.keys) keys[key.id] = { state: "home", home: key.home };
  return {
    schemaVersion: 3,
    person: {
      id: "ellis-perch",
      name: "Ellis Perch",
      deaths: 0,
      releases: 0,
      year: 0,
      crowns: 0,
      crownRites: [],
      formsUnlocked: ["walker"],
      heart: 0,
      stride: 0,
      edge: 0,
      endingsSeen: [],
      campaignComplete: false,
      mayorSpoken: false,
      appliedDeathTokens: [],
    },
    body: {
      form: "walker",
      hp: tables.baseHp,
      hpMax: tables.baseHp,
      map: tables.spawn.map,
      x: tables.spawn.x,
      y: tables.spawn.y,
      facing: tables.spawn.facing,
      inCombat: false,
      tempBuffs: [],
    },
    life: {
      lifeId: 1,
      startedYear: 0,
      dialogueSeenThisLife: [],
      carriedKeys: [],
      pendingReward: null,
      transition: null,
      pendingEnding: null,
    },
    world: {
      year: 0,
      npcs: expectedNpcs(0),
      dungeons,
      quests: {
        "lantern-debt": { step: "unstarted" },
        "mill-gear": { step: "unstarted" },
      },
      keys,
      rewardsClaimed: [],
      warpsUnlocked: ["green-shrine"],
      ending: null,
      postCompletion: false,
    },
    meta: { phase: "play", writeGeneration: 0 },
  };
}

function isInt(value) {
  return typeof value === "number" && Number.isInteger(value);
}

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function ensureCrownWarp(state) {
  if (!state.world.warpsUnlocked.includes("green-shrine")) {
    state.world.warpsUnlocked.unshift("green-shrine");
  }
  if (state.person.crowns >= 2 && !state.world.warpsUnlocked.includes("crown-shrine")) {
    state.world.warpsUnlocked.push("crown-shrine");
  }
}

function syncHpMax(state) {
  state.body.hpMax = tables.baseHp + tables.hpPerHeart * state.person.heart;
}

export function stripForeign(value, stripped, path = "") {
  if (Array.isArray(value)) return value.map((item, index) => stripForeign(item, stripped, `${path}[${index}]`));
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      const here = path ? `${path}.${key}` : key;
      if (FOREIGN_KEYS.has(key)) {
        stripped.push(here);
        continue;
      }
      out[key] = stripForeign(value[key], stripped, here);
    }
    return out;
  }
  return value;
}

function warpAllowed(state, id) {
  const spec = warpById.get(id);
  if (!spec) return false;
  if (spec.requires === "always") return true;
  if (spec.requires === "crowns") return state.person.crowns >= 2;
  const dungeon = state.world.dungeons[spec.dungeon];
  if (!dungeon) return false;
  if (spec.requires === "boss") return dungeon.bossDefeated === true;
  if (spec.requires === "clear") return dungeon.cleared === true;
  return false;
}

export function validateV3(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return fail("corrupt", "state");
  if (state.schemaVersion !== 3) return fail("missing-field", "schemaVersion");
  const person = state.person;
  const body = state.body;
  const life = state.life;
  const world = state.world;
  const meta = state.meta;
  if (!person || !body || !life || !world || !meta) return fail("missing-field", "layer");

  const requiredPerson = ["id", "name", "deaths", "releases", "year", "crowns", "crownRites", "formsUnlocked", "heart", "stride", "edge", "endingsSeen", "campaignComplete", "mayorSpoken", "appliedDeathTokens"];
  for (const key of requiredPerson) if (!hasOwn(person, key)) return fail("missing-field", `person.${key}`);
  if (person.id !== "ellis-perch" || person.name !== "Ellis Perch") return fail("missing-field", "person.id");
  for (const key of ["deaths", "releases", "year", "crowns", "heart", "stride", "edge"]) {
    if (!isInt(person[key])) return fail("bad-type", `person.${key}`);
  }
  if (!isInt(person.year) || person.year < 0 || person.year % tables.yearStep !== 0) return fail("bad-year", "person.year");
  if (person.deaths < 0 || person.releases < 0) return fail("bad-range", "deaths");
  if ((person.deaths + person.releases) * tables.yearStep !== person.year) return fail("year-equation", "person.year");
  if (!isInt(world.year) || world.year !== person.year) return fail("year-equation", "world.year");
  for (const stat of ["heart", "stride", "edge"]) {
    if (person[stat] < 0 || person[stat] > tables.statCap) return fail("bad-range", stat);
  }
  if (person.crowns < 0 || person.crowns > 2) return fail("bad-range", "crowns");
  if (!Array.isArray(person.crownRites) || !Array.isArray(person.formsUnlocked) || !Array.isArray(person.endingsSeen) || !Array.isArray(person.appliedDeathTokens)) {
    return fail("bad-type", "person.arrays");
  }
  if (new Set(person.crownRites).size !== person.crownRites.length) return fail("bad-type", "crownRites");
  for (const rite of person.crownRites) if (!tables.crownRites.includes(rite)) return fail("bad-rite", rite);
  if (person.crowns !== person.crownRites.length) return fail("form-illegal", "crowns");
  if (typeof person.campaignComplete !== "boolean" || typeof person.mayorSpoken !== "boolean") return fail("bad-type", "person.flags");
  if (new Set(person.appliedDeathTokens).size !== person.appliedDeathTokens.length) return fail("bad-token", "duplicate");
  if (person.appliedDeathTokens.length > tables.deathTokenCap) return fail("bad-token", "cap");
  for (const token of person.appliedDeathTokens) if (typeof token !== "string" || token.length === 0) return fail("bad-type", "token");

  const forms = derivedForms(person);
  if (!deepEqual(person.formsUnlocked, forms)) return fail("form-illegal", "formsUnlocked");

  if (!Array.isArray(world.rewardsClaimed)) return fail("bad-type", "rewardsClaimed");
  if (new Set(world.rewardsClaimed).size !== world.rewardsClaimed.length) return fail("bad-reward", "duplicate");
  for (const id of world.rewardsClaimed) if (!rewardById.has(id)) return fail("bad-reward", id);
  for (const stat of ["heart", "stride", "edge"]) {
    const expected = Math.min(tables.statCap, countStat(state, stat));
    if (person[stat] !== expected) return fail("stat-divergence", stat);
  }

  if (!world.dungeons || typeof world.dungeons !== "object") return fail("missing-field", "dungeons");
  const dungeonIds = Object.keys(world.dungeons);
  if (dungeonIds.length !== tables.dungeons.length) return fail("bad-dungeon", "count");
  for (const dungeon of tables.dungeons) {
    const row = world.dungeons[dungeon.id];
    if (!row) return fail("bad-dungeon", dungeon.id);
    for (const flag of ["discovered", "cleared", "bossDefeated"]) {
      if (typeof row[flag] !== "boolean") return fail("bad-type", `${dungeon.id}.${flag}`);
    }
    if (row.cleared && !row.discovered) return fail("bad-dungeon", `${dungeon.id}.discovered`);
    if (dungeon.boss) {
      if (row.bossDefeated && !row.cleared) return fail("bad-dungeon", `${dungeon.id}.cleared`);
    } else if (row.bossDefeated) return fail("bad-dungeon", `${dungeon.id}.boss`);
  }

  if (!world.keys) return fail("missing-field", "keys");
  if (Object.keys(world.keys).length !== tables.keys.length) return fail("bad-type", "keys");
  if (!Array.isArray(life.carriedKeys)) return fail("bad-type", "carriedKeys");
  if (new Set(life.carriedKeys).size !== life.carriedKeys.length) return fail("bad-type", "carriedKeys");
  for (const key of tables.keys) {
    const row = world.keys[key.id];
    if (!row) return fail("missing-field", key.id);
    if (row.home !== key.home) return fail("bad-type", `${key.id}.home`);
    if (!["home", "carried", "socketed"].includes(row.state)) return fail("bad-type", `${key.id}.state`);
    const carried = life.carriedKeys.includes(key.id);
    if ((row.state === "carried") !== carried) return fail("bad-type", `${key.id}.partition`);
  }

  if (!world.quests) return fail("missing-field", "quests");
  for (const [questId, steps] of Object.entries(tables.quests)) {
    const step = world.quests[questId]?.step;
    if (!steps.includes(step)) return fail("bad-step", questId);
  }
  const mill = world.quests["mill-gear"].step;
  if (person.year >= tables.contentFreezeYear && (mill === "asked" || mill === "gear-cut")) return fail("stale-quest", "mill-gear");
  if (person.year < tables.contentFreezeYear && mill === "archived-incomplete") return fail("stale-quest", "mill-gear");

  if (!deepEqual(world.npcs, expectedNpcs(person.year))) return fail("stale-npc");

  if (!Array.isArray(world.warpsUnlocked)) return fail("bad-type", "warpsUnlocked");
  if (new Set(world.warpsUnlocked).size !== world.warpsUnlocked.length) return fail("stale-warp", "duplicate");
  if (!world.warpsUnlocked.includes("green-shrine")) return fail("stale-warp", "green-shrine");
  for (const id of world.warpsUnlocked) {
    if (!warpById.has(id)) return fail("stale-warp", id);
    if (!warpAllowed(state, id)) return fail("stale-warp", id);
  }
  const crownWarp = world.warpsUnlocked.includes("crown-shrine");
  if (crownWarp !== person.crowns >= 2) return fail("stale-warp", "crown-shrine");

  if (!Array.isArray(person.endingsSeen)) return fail("bad-type", "endingsSeen");
  if (new Set(person.endingsSeen).size !== person.endingsSeen.length) return fail("bad-ending", "duplicate");
  for (const ending of person.endingsSeen) if (!ENDINGS.includes(ending)) return fail("bad-ending", ending);
  if (person.campaignComplete !== person.endingsSeen.length > 0) return fail("campaign-integrity", "campaignComplete");
  if (world.postCompletion !== person.campaignComplete) return fail("campaign-integrity", "postCompletion");
  if (world.ending === null) {
    if (person.endingsSeen.length !== 0) return fail("campaign-integrity", "ending");
  } else if (!ENDINGS.includes(world.ending) || !person.endingsSeen.includes(world.ending)) {
    return fail("bad-ending", world.ending);
  }

  if (!["play", "afterlife", "quest-transition", "boss-reward", "ending-cinematic"].includes(meta.phase)) {
    return fail("bad-phase", meta.phase);
  }
  if (!isInt(meta.writeGeneration) || meta.writeGeneration < 0) return fail("bad-type", "writeGeneration");
  if (!isInt(life.lifeId) || life.lifeId < 1) return fail("bad-type", "lifeId");
  if (!isInt(life.startedYear)) return fail("bad-type", "startedYear");
  const returns = person.deaths + person.releases;
  if (meta.phase === "afterlife") {
    if (life.lifeId !== returns) return fail("year-equation", "lifeId");
    if (life.startedYear !== person.year - tables.yearStep) return fail("year-equation", "startedYear");
  } else {
    if (life.lifeId !== returns + 1) return fail("year-equation", "lifeId");
    if (life.startedYear !== person.year) return fail("year-equation", "startedYear");
  }

  if (!isInt(body.hp) || !isInt(body.hpMax) || !isInt(body.x) || !isInt(body.y)) return fail("bad-type", "body");
  if (body.hpMax !== tables.baseHp + tables.hpPerHeart * person.heart) return fail("bad-hp", "hpMax");
  if (typeof body.inCombat !== "boolean") return fail("bad-type", "inCombat");
  if (!Array.isArray(body.tempBuffs)) return fail("bad-type", "tempBuffs");
  if (!["n", "e", "s", "w"].includes(body.facing)) return fail("bad-type", "facing");
  if (typeof body.map !== "string" || !PLAYABLE.has(body.map)) return fail("bad-map", body.map);
  if (!Array.isArray(life.dialogueSeenThisLife)) return fail("bad-type", "dialogue");

  if (meta.phase === "afterlife") {
    if (body.form !== null) return fail("form-illegal", "afterlife-form");
    if (body.hp !== 0 || body.map !== "afterlife" || body.inCombat !== false) return fail("bad-hp", "afterlife");
    if (life.carriedKeys.length !== 0 || life.pendingReward !== null || life.transition !== null || life.pendingEnding !== null) {
      return fail("bad-phase", "afterlife-local");
    }
    if (body.tempBuffs.length !== 0) return fail("bad-phase", "afterlife-buff");
  } else {
    if (typeof body.form !== "string" || !person.formsUnlocked.includes(body.form)) return fail("form-illegal", "body.form");
    if (body.hp < 1 || body.hp > body.hpMax) return fail("bad-hp", "hp");
    if (body.map === "afterlife") return fail("bad-map", "afterlife");
    if (meta.phase !== "play" && body.inCombat) return fail("bad-phase", "inCombat");
  }

  if (meta.phase === "quest-transition") {
    const transition = life.transition;
    if (!transition || life.pendingReward !== null || life.pendingEnding !== null) return fail("bad-phase", "transition");
    const steps = tables.quests[transition.quest];
    if (!steps) return fail("bad-step", transition.quest);
    const fromIndex = steps.indexOf(transition.from);
    if (fromIndex < 0 || steps[fromIndex + 1] !== transition.to) return fail("bad-step", "edge");
    if (world.quests[transition.quest].step !== transition.from) return fail("bad-step", "uncommitted");
    if (transition.to === "archived-incomplete") return fail("bad-step", "archive-edge");
  } else if (life.transition !== null) return fail("bad-phase", "transition");

  if (meta.phase === "boss-reward") {
    const pending = life.pendingReward;
    if (!pending || life.transition !== null || life.pendingEnding !== null) return fail("bad-phase", "reward");
    const spec = rewardById.get(pending.id);
    if (!spec || spec.stat !== pending.stat || spec.dungeon !== pending.dungeonId || spec.requires !== "boss") {
      return fail("bad-reward", "pending");
    }
    if (world.rewardsClaimed.includes(pending.id)) return fail("bad-reward", "already");
    if (!world.dungeons[spec.dungeon]?.bossDefeated) return fail("bad-reward", "boss");
  } else if (life.pendingReward !== null) return fail("bad-phase", "reward");

  if (meta.phase === "ending-cinematic") {
    if (!ENDINGS.includes(life.pendingEnding)) return fail("bad-ending", "pending");
  } else if (life.pendingEnding !== null) return fail("bad-phase", "ending");

  return { ok: true };
}

function applyCosmeticDefaults(state, report) {
  if (state.body && state.body.tempBuffs == null) {
    state.body.tempBuffs = [];
    report.defaultsApplied.push("body.tempBuffs");
  }
  if (state.life && state.life.dialogueSeenThisLife == null) {
    state.life.dialogueSeenThisLife = [];
    report.defaultsApplied.push("life.dialogueSeenThisLife");
  }
  if (state.life && state.life.pendingReward === undefined) state.life.pendingReward = null;
  if (state.life && state.life.transition === undefined) state.life.transition = null;
  if (state.life && state.life.pendingEnding === undefined) state.life.pendingEnding = null;
}

export function acceptState(input, side = {}) {
  const stripped = [...(side.stripped ?? [])];
  const state = stripForeign(structuredClone(input), stripped);
  const defaultsApplied = [...(side.defaultsApplied ?? [])];
  applyCosmeticDefaults(state, { defaultsApplied });
  const verdict = validateV3(state);
  if (!verdict.ok) return verdict;
  return {
    ok: true,
    state,
    stripped,
    defaultsApplied,
    ignoredFlags: side.ignoredFlags ?? [],
    ignoredFields: side.ignoredFields ?? [],
    assumptions: side.assumptions ?? [],
    migratedFrom: side.migratedFrom ?? 3,
  };
}

function migrateV1(raw) {
  const stripped = [];
  const cleaned = stripForeign(structuredClone(raw), stripped);
  if (!hasOwn(cleaned, "year")) return fail("missing-field", "year");
  if (!isInt(cleaned.year)) return fail("bad-type", "year");
  if (cleaned.year < 0 || cleaned.year % tables.yearStep !== 0) return fail("bad-year", "year");
  const state = makeNewGame();
  const deaths = cleaned.year / tables.yearStep;
  state.person.deaths = deaths;
  state.person.releases = 0;
  state.person.year = cleaned.year;
  state.world.year = cleaned.year;
  state.person.formsUnlocked = derivedForms(state.person);
  const form = cleaned.form ?? "walker";
  if (!FORM_ORDER.includes(form)) return fail("form-illegal", form);
  if (!state.person.formsUnlocked.includes(form)) return fail("form-illegal", form);
  state.body.form = form;
  syncHpMax(state);
  if (cleaned.hp == null) state.body.hp = state.body.hpMax;
  else if (!isInt(cleaned.hp) || cleaned.hp < 1 || cleaned.hp > state.body.hpMax) return fail("bad-range", "hp");
  else state.body.hp = cleaned.hp;
  if (cleaned.map != null) {
    if (typeof cleaned.map !== "string" || !PLAYABLE.has(cleaned.map) || cleaned.map === "afterlife") return fail("bad-map", cleaned.map);
    state.body.map = cleaned.map;
  }
  if (cleaned.x != null) {
    if (!isInt(cleaned.x)) return fail("bad-type", "x");
    state.body.x = cleaned.x;
  }
  if (cleaned.y != null) {
    if (!isInt(cleaned.y)) return fail("bad-type", "y");
    state.body.y = cleaned.y;
  }
  const ignoredFlags = [];
  const flags = cleaned.flags ?? [];
  if (!Array.isArray(flags)) return fail("bad-type", "flags");
  for (const flag of flags) {
    if (typeof flag !== "string") return fail("bad-type", "flags");
    const cleared = flag.startsWith("cleared:");
    const boss = flag.startsWith("boss:");
    if (!cleared && !boss) {
      ignoredFlags.push(flag);
      continue;
    }
    const id = flag.slice(flag.indexOf(":") + 1);
    if (!dungeonById.has(id)) return fail("bad-dungeon", id);
    if (boss && !bossIds.has(id)) return fail("bad-dungeon", id);
    state.world.dungeons[id].discovered = true;
    state.world.dungeons[id].cleared = true;
    if (bossIds.has(id) && (boss || cleared)) state.world.dungeons[id].bossDefeated = true;
  }
  state.world.npcs = expectedNpcs(state.person.year);
  state.life.lifeId = deaths + 1;
  state.life.startedYear = cleaned.year;
  state.meta.phase = "play";
  state.meta.writeGeneration = 0;
  ensureCrownWarp(state);
  return {
    ok: true,
    state,
    migratedFrom: 1,
    ignoredFlags,
    stripped,
    assumptions: [
      "v1-all-year-advances-counted-as-deaths",
      "v1-releases-unknown-and-set-to-zero",
      "v1-unknown-flags-ignored",
      "v1-forms-derived-from-year",
      "v1-no-ending-field-so-campaign-incomplete",
    ],
  };
}

function migrateV2(raw) {
  const stripped = [];
  const cleaned = stripForeign(raw, stripped);
  if (!hasOwn(cleaned, "year")) return fail("missing-field", "year");
  if (!isInt(cleaned.year)) return fail("bad-type", "year");
  if (cleaned.year < 0 || cleaned.year % tables.yearStep !== 0) return fail("bad-year", "year");
  const hasDeaths = hasOwn(cleaned, "deaths") && cleaned.deaths != null;
  const hasReleases = hasOwn(cleaned, "releases") && cleaned.releases != null;
  if (hasDeaths !== hasReleases) return fail("missing-field", "deaths/releases");
  let deaths;
  let releases;
  if (!hasDeaths) {
    deaths = cleaned.year / tables.yearStep;
    releases = 0;
  } else {
    if (!isInt(cleaned.deaths) || !isInt(cleaned.releases)) return fail("bad-type", "deaths");
    if (cleaned.deaths < 0 || cleaned.releases < 0) return fail("bad-range", "deaths");
    if ((cleaned.deaths + cleaned.releases) * tables.yearStep !== cleaned.year) return fail("year-equation");
    deaths = cleaned.deaths;
    releases = cleaned.releases;
  }
  const state = makeNewGame();
  state.person.deaths = deaths;
  state.person.releases = releases;
  state.person.year = cleaned.year;
  state.world.year = cleaned.year;
  for (const stat of ["heart", "stride", "edge"]) {
    if (!hasOwn(cleaned, stat) || cleaned[stat] == null) state.person[stat] = 0;
    else if (!isInt(cleaned[stat])) return fail("bad-type", stat);
    else if (cleaned[stat] < 0 || cleaned[stat] > tables.statCap) return fail("bad-range", stat);
    else state.person[stat] = cleaned[stat];
  }
  if (cleaned.mayorSpoken == null) state.person.mayorSpoken = false;
  else if (typeof cleaned.mayorSpoken !== "boolean") return fail("bad-type", "mayorSpoken");
  else state.person.mayorSpoken = cleaned.mayorSpoken;
  if (cleaned.crowns == null) state.person.crowns = 0;
  else if (!isInt(cleaned.crowns) || cleaned.crowns < 0 || cleaned.crowns > 2) return fail("bad-range", "crowns");
  else state.person.crowns = cleaned.crowns;
  if (cleaned.crownRites == null) {
    if (state.person.crowns !== 0) return fail("missing-field", "crownRites");
    state.person.crownRites = [];
  } else if (!Array.isArray(cleaned.crownRites)) return fail("bad-type", "crownRites");
  else state.person.crownRites = [...cleaned.crownRites];
  if (cleaned.rewardsClaimed == null) state.world.rewardsClaimed = [];
  else if (!Array.isArray(cleaned.rewardsClaimed)) return fail("bad-type", "rewardsClaimed");
  else state.world.rewardsClaimed = [...cleaned.rewardsClaimed];
  state.person.formsUnlocked = derivedForms(state.person);
  if (cleaned.forms != null && !deepEqual(cleaned.forms, state.person.formsUnlocked)) return fail("form-illegal", "forms");
  const form = cleaned.form ?? "walker";
  if (!state.person.formsUnlocked.includes(form)) return fail("form-illegal", form);
  state.body.form = form;
  syncHpMax(state);
  if (cleaned.hp == null) state.body.hp = state.body.hpMax;
  else if (!isInt(cleaned.hp) || cleaned.hp < 1 || cleaned.hp > state.body.hpMax) return fail("bad-range", "hp");
  else state.body.hp = cleaned.hp;
  if (cleaned.map != null) {
    if (typeof cleaned.map !== "string" || !PLAYABLE.has(cleaned.map) || cleaned.map === "afterlife") return fail("bad-map", cleaned.map);
    state.body.map = cleaned.map;
  }
  const cleared = cleaned.dungeonsCleared ?? [];
  if (!Array.isArray(cleared)) return fail("bad-type", "dungeonsCleared");
  for (const id of cleared) {
    if (!dungeonById.has(id)) return fail("bad-dungeon", String(id));
    state.world.dungeons[id].discovered = true;
    state.world.dungeons[id].cleared = true;
    if (bossIds.has(id)) state.world.dungeons[id].bossDefeated = true;
  }
  if (cleaned.ending != null) {
    if (!ENDINGS.includes(cleaned.ending)) return fail("bad-ending", cleaned.ending);
    state.person.endingsSeen = [cleaned.ending];
    state.person.campaignComplete = true;
    state.world.postCompletion = true;
    state.world.ending = cleaned.ending;
  }
  if (cleaned.quests != null) {
    if (typeof cleaned.quests !== "object" || Array.isArray(cleaned.quests)) return fail("bad-type", "quests");
    for (const [questId, step] of Object.entries(cleaned.quests)) {
      if (!tables.quests[questId]) return fail("bad-step", questId);
      if (typeof step !== "string") return fail("bad-type", questId);
      state.world.quests[questId].step = step;
    }
  }
  state.world.npcs = expectedNpcs(state.person.year);
  state.life.lifeId = deaths + releases + 1;
  state.life.startedYear = cleaned.year;
  state.meta.phase = "play";
  state.meta.writeGeneration = 0;
  ensureCrownWarp(state);
  const ignoredFields = [];
  if (hasOwn(raw, "npcs")) ignoredFields.push("npcs");
  return {
    ok: true,
    state,
    migratedFrom: 2,
    ignoredFields,
    stripped,
    assumptions: [
      "v2-npc-field-recomputed-not-trusted",
      "v2-ending-prereqs-not-relitigated",
      "v2-missing-stats-default-0",
      "v2-stat-must-match-reward-count-after-migrate",
      "v2-forms-must-equal-derived-set-when-present",
    ],
  };
}

export function tryDecode(text) {
  if (typeof text !== "string" || text.length === 0) return fail("corrupt", "empty");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail("corrupt", "json");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("corrupt", "shape");
  if (parsed.v === 1) {
    const migrated = migrateV1(parsed);
    if (!migrated.ok) return migrated;
    return acceptState(migrated.state, migrated);
  }
  if (parsed.v === 2) {
    const migrated = migrateV2(parsed);
    if (!migrated.ok) return migrated;
    return acceptState(migrated.state, migrated);
  }
  if (parsed.schemaVersion === 3 && parsed.state && typeof parsed.state === "object") {
    if (typeof parsed.checksum !== "string") return fail("checksum", "missing");
    if (checksum(parsed.state) !== parsed.checksum) return fail("checksum");
    if (!parsed.state.meta || parsed.generation !== parsed.state.meta.writeGeneration) return fail("stale-generation");
    return acceptState(parsed.state, { migratedFrom: 3 });
  }
  return fail("corrupt", "unknown-shape");
}

export function serialize(state) {
  const stateCopy = structuredClone(state);
  return JSON.stringify({
    schemaVersion: 3,
    generation: stateCopy.meta.writeGeneration,
    checksum: checksum(stateCopy),
    state: stateCopy,
  });
}

function advanceLife(state, kind, token) {
  if (typeof token !== "string" || token.length === 0) return fail("token-required");
  if (state.person.appliedDeathTokens.includes(token)) return ok(state, { idempotent: true });
  if (state.meta.phase === "afterlife") return fail("already-afterlife");
  const allowed = new Set(["play", "boss-reward", "quest-transition", "ending-cinematic"]);
  if (!allowed.has(state.meta.phase)) return fail("bad-phase", state.meta.phase);
  const next = structuredClone(state);
  next.life.pendingReward = null;
  next.life.transition = null;
  next.life.pendingEnding = null;
  next.life.dialogueSeenThisLife = [];
  for (const key of Object.values(next.world.keys)) {
    if (key.state === "carried") key.state = "home";
  }
  next.life.carriedKeys = [];
  next.body.tempBuffs = [];
  next.body.inCombat = false;
  next.body.hp = 0;
  next.body.form = null;
  next.body.map = "afterlife";
  next.body.x = 0;
  next.body.y = 0;
  next.body.facing = "s";
  if (kind === "death") next.person.deaths += 1;
  else next.person.releases += 1;
  next.person.year += tables.yearStep;
  next.world.year = next.person.year;
  next.person.appliedDeathTokens.push(token);
  if (next.person.appliedDeathTokens.length > tables.deathTokenCap) next.person.appliedDeathTokens.shift();
  next.world.npcs = expectedNpcs(next.person.year);
  const mill = next.world.quests["mill-gear"].step;
  if (next.person.year >= tables.contentFreezeYear && (mill === "asked" || mill === "gear-cut")) {
    next.world.quests["mill-gear"].step = "archived-incomplete";
  }
  next.person.formsUnlocked = derivedForms(next.person);
  ensureCrownWarp(next);
  next.meta.phase = "afterlife";
  return ok(next);
}

function chooseForm(state, form) {
  if (state.meta.phase !== "afterlife") return fail("not-afterlife");
  if (!state.person.formsUnlocked.includes(form)) return fail("form-locked", form);
  const next = structuredClone(state);
  syncHpMax(next);
  next.body.form = form;
  next.body.hp = next.body.hpMax;
  next.body.map = tables.spawn.map;
  next.body.x = tables.spawn.x;
  next.body.y = tables.spawn.y;
  next.body.facing = tables.spawn.facing;
  next.body.inCombat = false;
  next.body.tempBuffs = [];
  next.life.lifeId += 1;
  next.life.startedYear = next.person.year;
  next.life.dialogueSeenThisLife = [];
  next.life.carriedKeys = [];
  next.life.pendingReward = null;
  next.life.transition = null;
  next.life.pendingEnding = null;
  next.meta.phase = "play";
  return ok(next);
}

function requirePlay(state) {
  if (state.meta.phase !== "play") return fail("bad-phase", state.meta.phase);
  return null;
}

function grant(state, rewardId) {
  const spec = rewardById.get(rewardId);
  if (!spec) return fail("reward-unavailable", rewardId);
  if (state.world.rewardsClaimed.includes(rewardId)) return fail("reward-unavailable", rewardId);
  const next = structuredClone(state);
  next.world.rewardsClaimed.push(rewardId);
  next.person[spec.stat] = Math.min(tables.statCap, next.person[spec.stat] + 1);
  syncHpMax(next);
  return ok(next);
}

function endingPrereq(state, ending) {
  if (!ENDINGS.includes(ending)) return false;
  if (ending === "ledger") return tables.dungeons.every((dungeon) => state.world.dungeons[dungeon.id].cleared);
  if (ending === "crown") return state.person.crowns === 2 && state.body.map === "crown-shrine";
  if (ending === "archive") {
    const npcs = state.world.npcs;
    return state.person.year >= tables.contentFreezeYear
      && npcs.maeve.archived.includes("Maeve")
      && npcs.cal.archived.includes("Cal")
      && npcs.millwright.office === "closed";
  }
  if (ending === "remain") return state.person.year >= tables.contentFreezeYear;
  return false;
}

function recordEnding(state, ending) {
  const next = structuredClone(state);
  if (!next.person.endingsSeen.includes(ending)) next.person.endingsSeen.push(ending);
  next.person.campaignComplete = true;
  next.world.postCompletion = true;
  next.world.ending = ending;
  next.life.pendingEnding = null;
  next.meta.phase = "play";
  return ok(next);
}

function dispatch(session, action) {
  const state = session.live;
  switch (action.op) {
    case "move": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      if (!isInt(action.x) || !isInt(action.y)) return fail("bad-type", "x");
      const next = structuredClone(state);
      next.body.x = action.x;
      next.body.y = action.y;
      if (action.facing) {
        if (!["n", "e", "s", "w"].includes(action.facing)) return fail("bad-type", "facing");
        next.body.facing = action.facing;
      }
      if (action.map) {
        if (!PLAYABLE.has(action.map) || action.map === "afterlife") return fail("bad-map", action.map);
        next.body.map = action.map;
      }
      return ok(next);
    }
    case "combat-death":
      return advanceLife(state, "death", action.token);
    case "shrine-release": {
      if (state.meta.phase !== "play") return fail("release-not-deliberate", state.meta.phase);
      if (action.atShrine === false) return fail("not-at-shrine");
      return advanceLife(state, "release", action.token);
    }
    case "choose-form":
      return chooseForm(state, action.form);
    case "talk-mayor": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      const next = structuredClone(state);
      next.person.mayorSpoken = true;
      next.person.formsUnlocked = derivedForms(next.person);
      return ok(next);
    }
    case "complete-crown": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      if (!tables.crownRites.includes(action.riteId)) return fail("bad-rite", action.riteId);
      if (state.person.crownRites.includes(action.riteId)) return fail("rite-done", action.riteId);
      const next = structuredClone(state);
      next.person.crownRites.push(action.riteId);
      next.person.crowns = next.person.crownRites.length;
      next.person.formsUnlocked = derivedForms(next.person);
      ensureCrownWarp(next);
      return ok(next);
    }
    case "begin-transition": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      const steps = tables.quests[action.quest];
      if (!steps) return fail("bad-step", action.quest);
      const current = state.world.quests[action.quest].step;
      if (steps[steps.indexOf(current) + 1] !== action.to) return fail("bad-step", action.to);
      if (action.to === "archived-incomplete") return fail("bad-step", action.to);
      if (action.quest === "mill-gear" && current === "unstarted" && state.world.npcs.millwright.office === "closed") {
        return fail("office-closed");
      }
      const next = structuredClone(state);
      next.life.transition = { quest: action.quest, from: current, to: action.to };
      next.meta.phase = "quest-transition";
      return ok(next);
    }
    case "commit-quest": {
      if (state.meta.phase !== "quest-transition" || !state.life.transition) return fail("bad-phase");
      const next = structuredClone(state);
      next.world.quests[next.life.transition.quest].step = next.life.transition.to;
      next.life.transition = null;
      next.meta.phase = "play";
      return ok(next);
    }
    case "boss-defeat": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      if (!bossIds.has(action.dungeonId)) return fail("not-a-boss", action.dungeonId);
      if (state.world.dungeons[action.dungeonId].bossDefeated) return ok(state, { idempotent: true });
      const next = structuredClone(state);
      next.world.dungeons[action.dungeonId].discovered = true;
      next.world.dungeons[action.dungeonId].cleared = true;
      next.world.dungeons[action.dungeonId].bossDefeated = true;
      return ok(next);
    }
    case "clear-dungeon": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      if (!dungeonById.has(action.dungeonId)) return fail("bad-dungeon", action.dungeonId);
      if (bossIds.has(action.dungeonId)) return fail("needs-boss", action.dungeonId);
      if (state.world.dungeons[action.dungeonId].cleared) return ok(state, { idempotent: true });
      const next = structuredClone(state);
      next.world.dungeons[action.dungeonId].discovered = true;
      next.world.dungeons[action.dungeonId].cleared = true;
      return ok(next);
    }
    case "begin-reward": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      const spec = rewardById.get(action.rewardId);
      if (!spec || spec.requires !== "boss") return fail("reward-unavailable", action.rewardId);
      if (state.world.rewardsClaimed.includes(action.rewardId)) return fail("reward-unavailable", action.rewardId);
      if (!state.world.dungeons[spec.dungeon].bossDefeated) return fail("reward-unavailable", "boss");
      const next = structuredClone(state);
      next.life.pendingReward = { id: spec.id, stat: spec.stat, dungeonId: spec.dungeon };
      next.meta.phase = "boss-reward";
      return ok(next);
    }
    case "claim-reward": {
      if (state.meta.phase !== "boss-reward" || !state.life.pendingReward) return fail("bad-phase");
      const pending = state.life.pendingReward;
      const next = structuredClone(state);
      next.life.pendingReward = null;
      next.meta.phase = "play";
      const granted = grant(next, pending.id);
      if (!granted.ok) return granted;
      return granted;
    }
    case "claim-chest": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      const spec = rewardById.get(action.rewardId);
      if (!spec || spec.requires !== "clear") return fail("reward-unavailable", action.rewardId);
      if (!state.world.dungeons[spec.dungeon].cleared) return fail("reward-unavailable", "clear");
      return grant(state, action.rewardId);
    }
    case "pickup-key": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      if (!keyById.has(action.keyId)) return fail("bad-type", action.keyId);
      if (state.world.keys[action.keyId].state !== "home") return fail("bad-phase", "key");
      const next = structuredClone(state);
      next.world.keys[action.keyId].state = "carried";
      next.life.carriedKeys.push(action.keyId);
      return ok(next);
    }
    case "socket-key": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      if (state.world.keys[action.keyId]?.state !== "carried") return fail("bad-phase", "key");
      const next = structuredClone(state);
      next.world.keys[action.keyId].state = "socketed";
      next.life.carriedKeys = next.life.carriedKeys.filter((id) => id !== action.keyId);
      return ok(next);
    }
    case "unlock-warp": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      if (!warpById.has(action.warpId)) return fail("stale-warp", action.warpId);
      if (!warpAllowed(state, action.warpId)) return fail("warp-locked", action.warpId);
      if (state.world.warpsUnlocked.includes(action.warpId)) return ok(state, { idempotent: true });
      const next = structuredClone(state);
      next.world.warpsUnlocked.push(action.warpId);
      return ok(next);
    }
    case "warp": {
      if (state.meta.phase !== "play") return fail("bad-phase", state.meta.phase);
      if (!state.world.warpsUnlocked.includes(action.warpId)) return fail("warp-locked", action.warpId);
      const spec = warpById.get(action.warpId);
      const next = structuredClone(state);
      next.body.map = spec.id;
      next.body.x = spec.x;
      next.body.y = spec.y;
      return ok(next);
    }
    case "begin-ending": {
      const blocked = requirePlay(state);
      if (blocked) return blocked;
      if (!endingPrereq(state, action.endingId)) return fail("prereq", action.endingId);
      const next = structuredClone(state);
      next.life.pendingEnding = action.endingId;
      next.meta.phase = "ending-cinematic";
      return ok(next);
    }
    case "commit-ending": {
      let ending = action.endingId;
      if (state.meta.phase === "ending-cinematic") {
        if (ending && ending !== state.life.pendingEnding) return fail("bad-ending", ending);
        ending = state.life.pendingEnding;
      } else if (state.meta.phase !== "play") return fail("bad-phase", state.meta.phase);
      if (!endingPrereq(state, ending)) return fail("prereq", ending);
      return recordEnding(state, ending);
    }
    case "bundle": {
      const scratch = createSession(state);
      for (const step of action.steps) {
        const result = applyAction(scratch, step);
        if (!result.ok) return result;
      }
      return ok(scratch.live);
    }
    case "checkpoint":
      session.checkpoints[action.name] = structuredClone(state);
      return { ok: true, commit: false, state };
    case "load-checkpoint": {
      const snap = session.checkpoints[action.name];
      if (!snap) return fail("no-checkpoint", action.name);
      return ok(structuredClone(snap));
    }
    case "save": {
      const slotName = action.slot || session.active;
      const next = structuredClone(state);
      next.meta.writeGeneration += 1;
      const text = serialize(next);
      const slot = session.slots[slotName];
      slot.backup = slot.primary;
      slot.primary = text;
      if (slot.backup == null) slot.backup = slot.primary;
      return ok(next);
    }
    case "load": {
      const slot = session.slots[action.slot || session.active];
      const primary = tryDecode(slot.primary);
      if (primary.ok) return { ...primary, recoveredFrom: null };
      const backup = tryDecode(slot.backup);
      if (backup.ok) return { ...backup, recoveredFrom: "backup", primaryError: primary.error };
      const bothTorn = primary.error === "corrupt" && backup.error === "corrupt";
      return { ok: false, error: bothTorn ? "corrupt" : primary.error, detail: primary.detail, state: null, primaryError: primary.error, backupError: backup.error };
    }
    case "load-inline":
    case "load-file":
      return fail("bad-phase", "use-runner");
    case "mutate-saved": {
      const slot = session.slots[session.active];
      const targets = action.targets || [action.target || "primary"];
      for (const target of targets) {
        if (action.copyFrom) {
          slot[target] = slot[action.copyFrom];
          continue;
        }
        if (action.rawText != null) {
          slot[target] = action.rawText;
          continue;
        }
        if (action.truncate != null && !action.delete && !action.sets && !action.envelopeSets && !action.rechecksum && !action.badChecksum) {
          slot[target] = String(slot[target] ?? "").slice(0, action.truncate);
          continue;
        }
        const env = JSON.parse(slot[target]);
        if (action.delete) deletePath(env.state, action.delete);
        for (const set of action.sets || []) setPath(env.state, set.path, set.value);
        if (action.envelopeSets) Object.assign(env, action.envelopeSets);
        if (action.rechecksum) env.checksum = checksum(env.state);
        if (action.badChecksum) env.checksum = "0".repeat(64);
        const text = JSON.stringify(env);
        slot[target] = action.truncate != null ? text.slice(0, action.truncate) : text;
      }
      return { ok: true, commit: false, state };
    }
    case "replace-primary-raw":
      session.slots[session.active].primary = JSON.stringify(action.value);
      return { ok: true, commit: false, state };
    default:
      return fail("bad-phase", action.op);
  }
}

function deletePath(obj, path) {
  const parts = path.split(".");
  let cursor = obj;
  for (let index = 0; index < parts.length - 1; index += 1) {
    cursor = cursor[parts[index]];
    if (cursor == null) return;
  }
  delete cursor[parts.at(-1)];
}

function setPath(obj, path, value) {
  const parts = path.split(".");
  let cursor = obj;
  for (let index = 0; index < parts.length - 1; index += 1) {
    if (cursor[parts[index]] == null || typeof cursor[parts[index]] !== "object") cursor[parts[index]] = {};
    cursor = cursor[parts[index]];
  }
  cursor[parts.at(-1)] = value;
}

export function createSession(state) {
  return {
    live: structuredClone(state),
    start: structuredClone(state),
    active: "A",
    slots: {
      A: { primary: null, backup: null },
      B: { primary: null, backup: null },
    },
    checkpoints: {},
  };
}

export function applyAction(session, action) {
  const result = dispatch(session, action);
  if (!result.ok) return result;
  if (result.commit === false) return result;
  const verdict = validateV3(result.state);
  if (!verdict.ok) {
    throw new Error(`${action.op} produced invalid state: ${verdict.error} ${verdict.detail ?? ""}`);
  }
  session.live = result.state;
  return result;
}

export function mergePatch(target, patch) {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return structuredClone(patch);
  const out = structuredClone(target);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete out[key];
    else if (value && typeof value === "object" && !Array.isArray(value) && out[key] && typeof out[key] === "object" && !Array.isArray(out[key])) {
      out[key] = mergePatch(out[key], value);
    } else out[key] = structuredClone(value);
  }
  return out;
}

export function clearedCount(state) {
  return Object.values(state.world.dungeons).filter((dungeon) => dungeon.cleared).length;
}
