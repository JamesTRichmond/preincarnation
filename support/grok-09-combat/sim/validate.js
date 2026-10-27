import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ENCOUNTER_COUNTS, encounters, COMPOSITION_RULES } from "../data/encounters.js";
import { enemies } from "../data/enemies.js";
import { minibosses } from "../data/minibosses.js";
import { getProfile, PROFILES } from "../reference/profiles.js";
import { UNIT_SOURCE, REFERENCE_UNITS as U } from "../reference/units.js";
import { applyHit, scaleGodDamage } from "./combat.js";
import { createMachine, graphSignature } from "./fsm.js";
import { knockback, parseArena, tileAt } from "./geometry.js";
import {
  onEllisDeath,
  remnantVisible,
  resolveOutcome,
  roomReset,
  freshWorld,
} from "./persistence.js";
import {
  overlappingTellIssues,
  simulateBossFight,
  simulateEncounter,
  simulateTrial,
} from "./simulate.js";

const STANDARD = getProfile("standard");
const ASSISTED = getProfile("assisted");

function problemsFor(expect, result) {
  const problems = [];
  if (!expect) return problems;
  if (expect.maxDamage != null && result.damageTaken > expect.maxDamage) {
    problems.push(`dmg ${result.damageTaken}`);
  }
  if (expect.minDamage != null && result.damageTaken < expect.minDamage) {
    problems.push(`dmg ${result.damageTaken}`);
  }
  if (expect.minHits != null && result.hitsLanded < expect.minHits)
    problems.push(`hits ${result.hitsLanded}`);
  if (
    expect.flag &&
    !result.flags?.[expect.flag] &&
    !(expect.flag === "spared" && (result.spared === true || result.spared?.length))
  ) {
    problems.push(`flag ${expect.flag}`);
  }
  if (expect.hitBy && !(result.hitBy || []).includes(expect.hitBy))
    problems.push(`hitBy ${(result.hitBy || []).join(",")}`);
  if (expect.overlap != null && (result.overlap || []).length > expect.overlap) {
    problems.push(`overlap ${result.overlap.length}`);
  }
  if (expect.protectorHp != null && result.protectorHp !== expect.protectorHp) {
    problems.push(`protector ${result.protectorHp}`);
  }
  if (expect.spared) {
    for (const id of expect.spared) {
      if (!(result.spared || []).includes(id)) problems.push(`not spared ${id}`);
    }
  }
  if (expect.killed && (result.killed || []).length)
    problems.push(`killed ${result.killed.join(",")}`);
  return problems;
}

function trialBundle(roster, profile, ids) {
  const failures = [];
  let ok = 0;
  for (const enemy of roster) {
    for (const trial of enemy.trials) {
      if (ids && !ids.includes(trial.id)) continue;
      const result = simulateTrial(enemy, trial, profile);
      const problems = problemsFor(trial.expect, result);
      if (problems.length) failures.push({ id: enemy.id, trial: trial.id, problems });
      else ok += 1;
    }
  }
  return { ok, fail: failures.length, failures };
}

function bossBundle(profile) {
  const failures = [];
  const rows = [];
  for (const boss of minibosses) {
    const fair = simulateBossFight(
      boss,
      {
        mode: "route",
        form: "officer",
        start: boss.fairStart,
        checkpoints: boss.checkpoints,
        tool: boss.gate === "tool" ? boss.tool : null,
        frames: boss.earliest + 40,
      },
      profile,
    );
    const fool = simulateBossFight(
      boss,
      { mode: "foolish", form: "officer", start: boss.foolStart, frames: 180 },
      STANDARD,
    );
    const godFrames = boss.gate === "endure" ? boss.earliest - 1 : boss.earliest + 120;
    const god = simulateBossFight(
      boss,
      { mode: "greedy_spin", form: "god", start: boss.bossAt, frames: godFrames },
      STANDARD,
    );
    const problems = [];
    if (fair.damageTaken !== 0) problems.push(`fair dmg ${fair.damageTaken}`);
    if (!fair.resolved || fair.resolvedAt < boss.earliest)
      problems.push(`fair unresolved @${fair.resolvedAt}`);
    if (profile.id === "standard") {
      if (fool.damageTaken < 1 || fool.resolved) problems.push(`fool ${fool.damageTaken}`);
      if (god.resolved || god.hp !== boss.hp || god.banked < boss.hp) {
        problems.push(`god hp ${god.hp} bank ${god.banked} resolved ${god.resolved}`);
      }
    }
    if (problems.length) failures.push({ id: boss.id, problems });
    rows.push({
      id: boss.id,
      gate: boss.gate,
      earliest: boss.earliest,
      fair_damage: fair.damageTaken,
      resolved_at: fair.resolvedAt,
      god_banked: god.banked,
      god_hp: god.hp,
      god_resolved: god.resolved,
    });
  }
  return { ok: minibosses.length - failures.length, fail: failures.length, failures, rows };
}

function encounterBundle(profile) {
  const index = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy]));
  const failures = [];
  for (const encounter of encounters) {
    const result = simulateEncounter(encounter, index, profile);
    const problems = problemsFor(encounter.expect, result);
    if (problems.length) failures.push({ id: encounter.id, problems });
  }
  return { ok: encounters.length - failures.length, fail: failures.length, failures };
}

function schemaProblems() {
  const problems = [];
  if (enemies.length !== 40) problems.push(`enemies ${enemies.length}`);
  if (minibosses.length !== 24) problems.push(`minibosses ${minibosses.length}`);
  if (encounters.length < 32) problems.push(`encounters ${encounters.length}`);
  const ids = new Set();
  const graphs = new Map();
  const families = new Set(U.families);
  for (const enemy of enemies) {
    if (ids.has(enemy.id)) problems.push(`dup ${enemy.id}`);
    ids.add(enemy.id);
    if (!families.has(enemy.family)) problems.push(`family ${enemy.id}`);
    for (const key of U.tools) if (!enemy.tools[key]) problems.push(`tool ${enemy.id} ${key}`);
    for (const key of U.forms) if (!enemy.forms[key]) problems.push(`form ${enemy.id} ${key}`);
    for (const field of ["silhouette", "states", "detection", "terrain", "mercy", "lifecycle"]) {
      if (!enemy[field]) problems.push(`missing ${field} ${enemy.id}`);
    }
    if (!enemy.lifecycle?.on_death || !enemy.lifecycle?.on_spare) problems.push(`life ${enemy.id}`);
    const machine = createMachine({ states: enemy.states, initial: enemy.detection.initial });
    if (!machine) problems.push(`machine ${enemy.id}`);
    const sig = graphSignature({ initial: enemy.detection.initial, states: enemy.states });
    if (graphs.has(sig)) problems.push(`graph ${enemy.id} == ${graphs.get(sig)}`);
    graphs.set(sig, enemy.id);
    for (const state of enemy.states) {
      if (state.kind === "telegraph" && state.frames < 16)
        problems.push(`tell ${enemy.id} ${state.id}`);
    }
    for (const state of enemy.states.filter((state) => state.kind === "active")) {
      const fromTell = enemy.states.some(
        (other) => other.kind === "telegraph" && other.on_done === state.id,
      );
      if (!fromTell) problems.push(`active orphan ${enemy.id} ${state.id}`);
    }
  }
  const arenas = new Set();
  for (const boss of minibosses) {
    if (boss.not_a_dungeon_boss !== true) problems.push(`dungeon flag ${boss.id}`);
    if (boss.god_may_shorten !== false) problems.push(`god shorten ${boss.id}`);
    if (arenas.has(boss.arena)) problems.push(`arena ${boss.id}`);
    arenas.add(boss.arena);
    createMachine({ states: boss.states, initial: boss.detection.initial });
    const sig = graphSignature({ initial: boss.detection.initial, states: boss.states });
    if (graphs.has(sig)) problems.push(`boss graph ${boss.id}`);
    graphs.set(sig, boss.id);
    if (!boss.arena_concept || !boss.encounter_script?.length) problems.push(`script ${boss.id}`);
    for (const key of U.tools) if (!boss.tools[key]) problems.push(`boss tool ${boss.id}`);
  }
  const encounterIds = new Set();
  for (const encounter of encounters) {
    if (encounterIds.has(encounter.id)) problems.push(`dup room ${encounter.id}`);
    encounterIds.add(encounter.id);
    for (const member of encounter.members) {
      if (!ids.has(member.enemy)) problems.push(`missing member ${encounter.id} ${member.enemy}`);
    }
  }
  const assistedKeeps = PROFILES.assisted.does_not_remove;
  for (const key of [
    "enemies",
    "minibosses",
    "mercies",
    "fourteen_year_deaths",
    "forfeits_for_killing_memory",
  ]) {
    if (!assistedKeeps.includes(key)) problems.push(`assisted drops ${key}`);
  }
  return problems;
}

function stunLock() {
  const machine = createMachine({
    initial: "idle",
    states: [
      { id: "idle", kind: "idle", frames: null },
      { id: "hyperarmor", kind: "hyperarmor", frames: 24, on_done: "idle" },
      { id: "dead", kind: "dead", frames: null },
    ],
  });
  const enemy = {
    id: "poise_dummy",
    kind: "enemy",
    alive: true,
    hp: 30,
    hitstun: 0,
    hyperarmor: 0,
    poise: 0,
    consecutiveStunHits: 0,
    machine,
    flags: {},
    def: { family: "quarry", lifecycle: { on_death: {} } },
  };
  const world = { tick: 0, profile: STANDARD, events: [] };
  const first = applyHit(enemy, 3, { attack: "tap", id: "ellis", hitstun: 8 }, world);
  const second = applyHit(enemy, 3, { attack: "tap", id: "ellis", hitstun: 8 }, world);
  const third = applyHit(enemy, 3, { attack: "tap", id: "ellis", hitstun: 8 }, world);
  applyHit(enemy, 3, { attack: "tap", id: "ellis", hitstun: 8 }, world);
  const ok =
    first.damage === 3 &&
    second.hyperarmor === true &&
    third.glanced === true &&
    enemy.hitstun === 0 &&
    enemy.alive &&
    enemy.hp > 0;
  return { ok, hp: enemy.hp, hitstun: enemy.hitstun, glanced: third.glanced };
}

function projectileCap() {
  const shot = {
    kind: "projectile",
    damage: 1,
    speed: 2,
    lifetime: 90,
    shape: { ox: 12, along: 8, across: 8 },
  };
  const def = {
    id: "cap_probe",
    name: "Cap Probe",
    family: "surveyor",
    silhouette: { footprint_px: [16, 16], read: "probe", palette: "brass", animations: [] },
    stats: { hp: 9, knockback_px: 0, weight: "probe", speed: 0, contact_damage: 0 },
    detection: { sight_px: 10, arc_deg: 360, initial: "idle", aggro: "never" },
    return_state: "idle",
    attacks: { shot },
    states: [
      { id: "idle", kind: "idle", frames: 4, on_done: "shot_tell" },
      {
        id: "shot_tell",
        kind: "telegraph",
        frames: 16,
        attack: "shot",
        keep_facing: true,
        on_done: "shot_active",
      },
      { id: "shot_active", kind: "active", frames: 2, attack: "shot", on_done: "idle" },
      { id: "hyperarmor", kind: "hyperarmor", frames: 24, on_done: "idle" },
      { id: "dead", kind: "dead", frames: null },
      { id: "spared", kind: "spared", frames: null },
    ],
    defeat: { windows: [] },
    mercy: { available: false },
    tools: {},
    forms: {},
    terrain: { forced_plunge: false },
    lifecycle: { on_death: {}, on_spare: {} },
    spawn: { enemy: { x: 40, y: 88 }, ellis: { x: 40, y: 160 }, facing: "E" },
    facing: "E",
  };
  const run = (profile) =>
    simulateTrial(
      def,
      { id: "cap", mode: "foolish", form: "officer", frames: 360, start: { x: 40, y: 160 } },
      profile,
    );
  const standard = run(STANDARD);
  const assisted = run(ASSISTED);
  return {
    ok:
      standard.maxProjectiles <= 3 &&
      standard.fizzles > 0 &&
      assisted.maxProjectiles <= 2 &&
      assisted.fizzles > 0,
    standard: { max: standard.maxProjectiles, fizzles: standard.fizzles },
    assisted: { max: assisted.maxProjectiles, fizzles: assisted.fizzles },
  };
}

function hazardKnockback() {
  const arena = parseArena(`
#######
#.....#
#..E..#
#..~..#
#.....#
#######
`);
  const actor = { x: 56, y: 40, footprint: { w: 12, h: 12 } };
  knockback(actor, "S", 48, arena);
  const tile = tileAt(arena, actor.x, actor.y);
  return { ok: tile?.kind !== "water" && actor.y < 48, y: actor.y, kind: tile?.kind || null };
}

function persistence() {
  const world = freshWorld(1812);
  const living = {
    id: "crab",
    alive: true,
    spared: false,
    hp: 2,
    maxHp: 6,
    initial: "dormant",
    lifecycle: enemies[0].lifecycle,
  };
  const reset = roomReset(living);
  const spared = {
    alive: true,
    spared: true,
    resolved: false,
    lifecycle: {
      on_death: { persist: "this_life", remnant: "dead" },
      on_spare: { persist: "fourteen_years", remnant: "kept", drop: "scrap", flag: "kept" },
    },
  };
  resolveOutcome(world, spared);
  const killed = {
    alive: false,
    spared: false,
    lifecycle: {
      on_death: { persist: "this_life", remnant: "grave", forfeit: "memory_lost" },
      on_spare: { persist: "fourteen_years", remnant: "no" },
    },
  };
  resolveOutcome(world, killed);
  const before = world.remnants.map((remnant) => remnantVisible(remnant, world));
  onEllisDeath(world);
  const afterDeath = world.remnants.map((remnant) => remnantVisible(remnant, world));
  onEllisDeath(world);
  const later = world.remnants.map((remnant) => remnantVisible(remnant, world));
  const ok =
    reset.reset === true &&
    reset.hp === 6 &&
    reset.state === "dormant" &&
    world.year === 1840 &&
    world.life === 3 &&
    world.flags.memory_lost === true &&
    world.flags.kept === true &&
    before[0] === true &&
    before[1] === true &&
    afterDeath[0] === true &&
    afterDeath[1] === false &&
    later[0] === false;
  return { ok, year: world.year, life: world.life, before, afterDeath, later };
}

function godScale() {
  const memory = scaleGodDamage(4, "god", "memory");
  const chip = scaleGodDamage(1, "god", "unrealized");
  const officer = scaleGodDamage(4, "officer", "memory");
  const quarry = scaleGodDamage(6, "god", "quarry");
  return {
    ok: memory === 2 && chip === 1 && officer === 4 && quarry === 6,
    memory,
    chip,
    officer,
    quarry,
  };
}

function tellOverlap() {
  const close = overlappingTellIssues(
    [
      { t: 10, source: "a", attack: "left" },
      { t: 16, source: "b", attack: "right" },
    ],
    10,
  );
  const spaced = overlappingTellIssues(
    [
      { t: 10, source: "a", attack: "left" },
      { t: 24, source: "b", attack: "right" },
    ],
    10,
  );
  const same = overlappingTellIssues(
    [
      { t: 10, source: "a", attack: "left" },
      { t: 12, source: "a", attack: "left_2" },
    ],
    10,
  );
  return { ok: close.length === 1 && spaced.length === 0 && same.length === 0 };
}

export function runValidation() {
  const schema = schemaProblems();
  const enemyTrials = trialBundle(enemies, STANDARD);
  const assistedFair = trialBundle(enemies, ASSISTED, ["fair", "halt"]);
  const bosses = bossBundle(STANDARD);
  const assistedBossFair = bossBundle(ASSISTED);
  const rooms = encounterBundle(STANDARD);
  const laws = {
    stun_lock: stunLock(),
    projectile_cap: projectileCap(),
    knockback_stops_at_hazard: hazardKnockback(),
    overlapping_tells: tellOverlap(),
    god_damage_scale: godScale(),
    persistence: persistence(),
  };
  const lawFailures = Object.entries(laws)
    .filter(([, value]) => !value.ok)
    .map(([name]) => name);
  const failures = [
    ...schema.map((problem) => ({ suite: "schema", problem })),
    ...enemyTrials.failures.map((failure) => ({ suite: "enemy", ...failure })),
    ...assistedFair.failures.map((failure) => ({ suite: "assisted_fair", ...failure })),
    ...bosses.failures.map((failure) => ({ suite: "miniboss", ...failure })),
    ...assistedBossFair.failures.map((failure) => ({ suite: "assisted_boss", ...failure })),
    ...rooms.failures.map((failure) => ({ suite: "encounter", ...failure })),
    ...lawFailures.map((name) => ({ suite: "law", problem: name })),
  ];
  return {
    label: "MODEL_RESULTS_NOT_ENGINE_PLAYTESTS",
    unit_source: UNIT_SOURCE,
    movement_assumptions: U.movement_assumptions,
    composition_rules: COMPOSITION_RULES,
    counts: {
      enemies: enemies.length,
      minibosses: minibosses.length,
      encounters: encounters.length,
      encounter_kinds: ENCOUNTER_COUNTS,
      enemy_trials: enemyTrials.ok + enemyTrials.fail,
    },
    enemy_trials: { ok: enemyTrials.ok, fail: enemyTrials.fail },
    assisted_fair_trials: { ok: assistedFair.ok, fail: assistedFair.fail },
    minibosses: { ok: bosses.ok, fail: bosses.fail, rows: bosses.rows },
    assisted_miniboss_fair: { ok: assistedBossFair.ok, fail: assistedBossFair.fail },
    encounters: { ok: rooms.ok, fail: rooms.fail },
    laws,
    schema_problems: schema,
    failures,
  };
}

export function writeReport(report, dir) {
  mkdirSync(dir, { recursive: true });
  const jsonPath = join(dir, "model-results.json");
  const mdPath = join(dir, "model-results.md");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  const lines = [
    "# Model results (not engine playtests)",
    "",
    `Label: \`${report.label}\`. Unit source: \`${report.unit_source}\`.`,
    "These numbers come from the reference-contract simulator in this folder. They are not measured playtests.",
    "",
    `| Pack | Count |`,
    `|---|---|`,
    `| Ordinary enemies | ${report.counts.enemies} |`,
    `| Minibosses | ${report.counts.minibosses} |`,
    `| Encounters | ${report.counts.encounters} |`,
    `| Enemy trials passed | ${report.enemy_trials.ok} / ${report.counts.enemy_trials} |`,
    `| Assisted fair trials | ${report.assisted_fair_trials.ok} failed ${report.assisted_fair_trials.fail} |`,
    `| Miniboss rites | ${report.minibosses.ok} failed ${report.minibosses.fail} |`,
    `| Encounters | ${report.encounters.ok} failed ${report.encounters.fail} |`,
    "",
    "## Laws",
    "",
    ...Object.entries(report.laws).map(
      ([name, value]) => `- ${name}: ${value.ok ? "pass" : "FAIL"}`,
    ),
    "",
    report.failures.length
      ? `## Failures\n\n${report.failures.map((f) => `- ${JSON.stringify(f)}`).join("\n")}`
      : "No failures in this model run.",
    "",
  ];
  writeFileSync(mdPath, lines.join("\n"));
  return { jsonPath, mdPath };
}

const here = dirname(fileURLToPath(import.meta.url));
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const report = runValidation();
  const paths = writeReport(report, join(here, "..", "results"));
  console.log(report.label);
  console.log(
    `enemies ${report.enemy_trials.ok}/${report.counts.enemy_trials} assistedFair ${report.assisted_fair_trials.ok} bosses ${report.minibosses.ok} rooms ${report.encounters.ok} laws ${Object.values(report.laws).filter((v) => v.ok).length}`,
  );
  if (report.failures.length) {
    console.log(JSON.stringify(report.failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log(paths.jsonPath);
    console.log(paths.mdPath);
  }
}
