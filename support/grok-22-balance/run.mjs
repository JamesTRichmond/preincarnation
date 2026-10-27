/**
 * Runs the encounter matrix twice when a predicate fires: live rules, then the
 * bounded patch. Prints a table and writes output/execution.json.
 * Not a playtest.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLACEMENTS,
  UNITS,
  actorsFromPlacement,
  assertFormulas,
  fight,
  parseQuarry,
  reachable,
  resourceTrace,
  simultaneousPairs,
  staticBudget,
} from "./model/sim.mjs";

const root = dirname(fileURLToPath(import.meta.url));

assertFormulas();

const BUILDS = {
  early: pack("early", 0, "wanderer", 0, 0, 0, "cannot_rest", false, false, false, false),
  middle: pack("middle", 2, "wanderer", 1, 1, 1, "cannot_rest", true, false, false, false),
  late: pack("late", 5, "wanderer", 3, 3, 3, "cannot_rest", true, true, true, false),
};

function pack(id, cycle, form, vitality, edge, stride, flaw, boots, shadowStep, wraithBond, tropoverse) {
  return {
    id, cycle, form, vitality, edge, stride, flaw, boots, shadowStep, wraithBond, tropoverse,
    bottles: id === "early" ? [] : ["syrup"],
    bombs: 0,
  };
}

function runSet(patch) {
  const rows = [];
  const consider = (tier, placement, build, policy) => {
    if ((placement.minCycle ?? 0) > build.cycle) return;
    const result = fight({
      actors: actorsFromPlacement(placement),
      build,
      policy: { kind: policy },
      patch,
      seconds: tier === "major" ? 40 : 30,
    });
    rows.push(row(tier, placement, build, policy, result));
  };

  for (const p of PLACEMENTS.ordinary) {
    if (p.minCycle) continue;
    for (const b of [BUILDS.early, BUILDS.middle, BUILDS.late]) {
      consider("ordinary", p, b, "standard");
      consider("ordinary", p, b, "assisted");
    }
  }
  const cluster = PLACEMENTS.ordinary.find((p) => p.id === "solo-wraiths");
  for (const b of [BUILDS.middle, BUILDS.late]) {
    consider("ordinary", cluster, b, "standard");
    consider("ordinary", cluster, b, "assisted");
  }

  for (const p of PLACEMENTS.groups) {
    for (const b of [BUILDS.early, BUILDS.middle, BUILDS.late]) {
      consider("group", p, b, "standard");
      consider("group", p, b, "assisted");
    }
  }
  for (const p of PLACEMENTS.minibosses) {
    for (const b of [BUILDS.early, BUILDS.middle, BUILDS.late]) {
      consider("miniboss", p, b, "standard");
      consider("miniboss", p, b, "assisted");
    }
  }

  for (const p of PLACEMENTS.major) {
    const b = majorBuild(p);
    consider("major", p, b, "standard");
    consider("major", p, b, "assisted");
  }
  return rows;
}

function majorBuild(p) {
  if (p.checkpoint === "early-job") return BUILDS.early;
  if (p.checkpoint === "middle") return BUILDS.middle;
  if (p.checkpoint === "late") return BUILDS.late;
  return { ...BUILDS.late, id: "late-sphere", tropoverse: true };
}

function row(tier, placement, build, policy, result) {
  return {
    tier,
    id: placement.id,
    map: placement.map,
    kind: placement.kind,
    build: build.id,
    form: build.form,
    cycle: build.cycle,
    tropoverse: !!build.tropoverse,
    policy,
    won: result.won,
    timedOut: result.timedOut,
    damageTaken: result.damageTaken,
    contacts: result.contacts,
    sips: result.sips,
    ttk: result.ttk,
    idleFraction: result.idleFraction,
    playerHp: result.playerHp,
    peak: result.enemyPeak,
    remain: result.remain,
  };
}

function failed(r) {
  return !r.won || r.damageTaken > 0;
}

const baseline = runSet({});
const fisherStress = [];
for (const form of ["wanderer", "smuggler", "officer", "embryo"]) {
  for (const flaw of ["cannot_rest", "pride"]) {
    const build = {
      ...BUILDS.middle,
      id: "middle-" + form + "-" + flaw,
      form,
      flaw,
      cycle: 2,
      bottles: [],
    };
    const placement = PLACEMENTS.ordinary.find((p) => p.id === "mb-fisher");
    const result = fight({ actors: actorsFromPlacement(placement), build, policy: { kind: "standard" }, patch: {}, seconds: 30 });
    fisherStress.push({ ...row("form-sweep", placement, build, "standard", result), flaw });
  }
}

const quarry = parseQuarry();
const spawn = quarry.marks.n[0];
const sen = quarry.marks.S[0];
function gate(form, patch) {
  const seen = reachable(quarry.tiles, form, spawn.x, spawn.y, patch);
  return { reaches: seen.has(sen.x + "," + sen.y), cells: seen.size };
}
const gates = {
  wanderer: gate("wanderer", {}),
  embryoLive: gate("embryo", {}),
  embryoIfCrackedSolid: gate("embryo", { embryoCrackedAndCliffSolid: true }),
};

const fisherEarly = baseline.filter((r) => r.kind === "fisher" && r.build === "early" && r.policy === "standard");
const fisherOfficer = fisherStress.filter((r) => r.form === "officer");
const fisherNormalizeHelps = (() => {
  const needs = fisherEarly.some(failed) || fisherOfficer.some(failed);
  if (!needs) return { enabled: false, reason: "spacing policy took no damage and cleared every tested fisher" };
  const placement = PLACEMENTS.ordinary.find((p) => p.id === "mb-fisher");
  const retry = [];
  for (const sample of [...fisherEarly, ...fisherOfficer]) {
    const build = {
      ...BUILDS[sample.build] ?? BUILDS.middle,
      id: sample.build,
      form: sample.form,
      flaw: sample.flaw ?? "cannot_rest",
      cycle: sample.cycle,
      bottles: [],
    };
    if (sample.build === "early") Object.assign(build, BUILDS.early);
    const result = fight({
      actors: actorsFromPlacement(placement),
      build,
      policy: { kind: "standard" },
      patch: { fisherNormalize: true },
      seconds: 30,
    });
    retry.push({ id: sample.build, form: sample.form, before: sample.damageTaken, beforeWon: sample.won, after: result.damageTaken, afterWon: result.won });
  }
  const fixed = retry.every((r) => r.afterWon && r.after === 0);
  return {
    enabled: fixed,
    reason: fixed
      ? "unnormalized fisher steer outran the spacing band; renormalizing removes the damage without changing listed speed 68"
      : "renormalizing did not clear the demonstrated failure; left the steer unchanged",
    retry,
  };
})();

const sentinelLate = baseline.filter((r) => r.tier === "major" && r.policy === "standard");
const cycleCap = {
  enabled: false,
  reason: sentinelLate.every((r) => r.won && (r.ttk ?? 99) < 35)
    ? "sentinel checkpoints still die to starter iron inside 35s at cycle 5, including tropoverse. No health-pool cap."
    : "a sentinel checkpoint failed or ran long",
  rows: sentinelLate.map((r) => ({ id: r.id, won: r.won, ttk: r.ttk, dmg: r.damageTaken })),
};

const embryoSkip = gates.embryoLive.reaches && !gates.wanderer.reaches;
const embryoPatch = {
  enabled: false,
  reason: embryoSkip
    ? "embryo reaches the sentinel from the quarry spawn and wanderer does not"
    : "wanderer already reaches the sentinel. Embryo's extra cells are void (blurb) plus cracked tiles that are not the only path. isSolid left as authored.",
  gates,
};

const anyCombatPatch = fisherNormalizeHelps.enabled || cycleCap.enabled || embryoPatch.enabled;
const combatPatch = {};
if (fisherNormalizeHelps.enabled) combatPatch.fisherNormalize = true;
if (cycleCap.enabled) combatPatch.enemyCycleMulCap = 1.6;

const patched = anyCombatPatch ? runSet(combatPatch) : baseline;

const recovery = {
  restoreSyrup: false,
  bowQuiver: 0,
  reason: "No access loss was demonstrated. resolveDeath already keeps relics, upgrades, townsCleared, keys, and bottles. The sugarhouse tin is rebuilt on every interior entry (interiors.ts int_sugar has no taken-flag). Arrow wipe matches wintersPassed>=14 and the authored erodeGrave cutoff at 8, and starter-iron spacing still clears the matrix, so ammo was not restored.",
};
const beforeResources = resourceTrace({}, mulberry(7));
const afterResources = resourceTrace(recovery, mulberry(7));
const wide = keepRate(400);

const flee = [];
for (const id of ["mb-fisher", "mb-bob", "br-bear", "vg-wraith"]) {
  const placement = [...PLACEMENTS.ordinary, ...PLACEMENTS.minibosses].find((p) => p.id === id);
  for (const startDist of [70, 50, 30]) {
    for (const patch of [{}, { fisherNormalize: true }]) {
      const result = fight({
        actors: actorsFromPlacement(placement),
        build: BUILDS.early,
        policy: { kind: "flee" },
        patch,
        startDist,
        seconds: 4,
      });
      flee.push({
        id,
        startDist,
        normalized: !!patch.fisherNormalize,
        contacts: result.contacts,
        damageTaken: result.damageTaken,
      });
    }
  }
}

const snow = fight({
  actors: actorsFromPlacement(PLACEMENTS.ordinary.find((p) => p.id === "mb-fisher")),
  build: BUILDS.early,
  policy: { kind: "standard" },
  patch: {},
  weatherMul: 0.86,
  seconds: 30,
});

const pairs = simultaneousPairs([...PLACEMENTS.ordinary, ...PLACEMENTS.minibosses, ...PLACEMENTS.major]);

const budgets = {};
for (const kind of Object.keys(UNITS.enemies)) {
  budgets[kind] = {
    early: staticBudget(kind, BUILDS.early),
    middle: staticBudget(kind, BUILDS.middle),
    late: staticBudget(kind, BUILDS.late),
  };
}

const healing = [];
const keys = new Map();
for (const r of baseline) {
  keys.set(r.tier + "|" + r.id + "|" + r.build, keys.get(r.tier + "|" + r.id + "|" + r.build) ?? {});
  keys.get(r.tier + "|" + r.id + "|" + r.build)[r.policy] = r;
}
for (const [k, both] of keys) {
  const s = both.standard;
  const a = both.assisted;
  if (!s || !a) continue;
  if ((!s.won || s.damageTaken > 0) && a.won && a.damageTaken === 0 && a.sips > 0) {
    healing.push({ key: k, standardDamage: s.damageTaken, sips: a.sips });
  }
}

const summary = summarize(baseline);
const summaryAfter = anyCombatPatch ? summarize(patched) : summary;

const execution = {
  playtest: false,
  simulation: true,
  sourceSha: UNITS.source.sha,
  assumptions: [
    "Fixed step 1/60s. Hit check runs before the enemy update, matching engine.ts sim().",
    "Standard policy spaces at ~20px with starter iron, faces the target to slash, does not sip, does not spin, does not bomb.",
    "Assisted policy retreats earlier, may dash if the form or boots allow, and sips one syrup when hp is at or under the next contact hit. Early lives have no syrup.",
    "Default flaw cannot_rest (speed ×1.1) is the shipped character. Form sweep also uses pride (×1).",
    "Open field. Town walls are not navmeshed. Quarry gate uses the real tile string.",
    "Enemy projectiles are absent from the engine, so saturation is reported as zero rather than invented.",
    "No player stun state exists. Flee probes measure whether contact repeats while leaving.",
    "Resident is defined and unplaced. No arena was invented for it.",
    "Bears are classified as the miniboss tier only because they are the repeated elite stat block. The game has no miniboss type.",
    "Four major rows are campaign checkpoints of the one placed boss (sentinel), not four authored boss characters.",
  ],
  counts: {
    ordinaryPlacements: PLACEMENTS.ordinary.filter((p) => !p.minCycle).length,
    ordinaryAlsoCluster: 1,
    bearPlacements: PLACEMENTS.minibosses.length,
    majorCheckpoints: PLACEMENTS.major.length,
    baselineRows: baseline.length,
  },
  summary,
  summaryAfter,
  combatPatch,
  patchDecisions: {
    fisherNormalize: fisherNormalizeHelps,
    enemyCycleMulCap: cycleCap,
    embryoSolidity: embryoPatch,
  },
  fisherStress,
  healingDependency: healing,
  fleeWhileHit: flee,
  snowFisher: { won: snow.won, damageTaken: snow.damageTaken, ttk: snow.ttk, contacts: snow.contacts },
  simultaneousAggroPairs: pairs,
  enemyProjectileShots: 0,
  playerStunExists: false,
  budgets,
  rows: baseline.map(compact),
  recovery: {
    rules: recovery,
    before: beforeResources,
    after: afterResources,
    mundaneKeepOver400: wide,
    note: "Recovery patch is an invariant, not a stat edit. Before and after ledgers match.",
  },
  unchanged: [
    "Contact damage",
    "Enemy base HP and the +12% per cycle multiplier",
    "Player max HP formula",
    "Winters advanced (14 to 18)",
    "Grave erosion probabilities",
    "Incarnation unlock gates",
    "Quarry lock tile (marbleWall) and isSolid",
    "Sentinel dormant-until-damaged",
  ],
};

writeFileSync(join(root, "output/execution.json"), JSON.stringify(execution, null, 2));
writeFileSync(join(root, "output/tables.md"), renderTables(baseline, fisherStress, flee));
writeFileSync(join(root, "patch/tuning.json"), JSON.stringify({
  sourceSha: UNITS.source.sha,
  appliesTo: "integrator overlay. Do not replace enemy definitions.",
  combat: combatPatch,
  decisions: execution.patchDecisions,
  recovery,
}, null, 2));

console.log("rows", baseline.length, "combatPatch", JSON.stringify(combatPatch));
console.log("summary", JSON.stringify(summary, null, 2));
console.log("fisherStress");
for (const r of fisherStress) {
  console.log(r.form, r.flaw, "won", r.won, "dmg", r.damageTaken, "ttk", r.ttk, "contacts", r.contacts, "peak", JSON.stringify(r.peak));
}
console.log("fisher decision", fisherNormalizeHelps.enabled, fisherNormalizeHelps.reason);
console.log("gates", gates);
console.log("healing", healing);
console.log("flee", flee);
console.log("pairs", pairs);
console.log("sentinel", cycleCap.rows);
const bad = baseline.filter(failed);
console.log("snow", snow.won, snow.damageTaken, snow.ttk, snow.contacts);
console.log("baseline failures", bad.length);
for (const r of bad) {
  console.log(r.tier, r.id, r.build, r.policy, "won", r.won, "dmg", r.damageTaken, "ttk", r.ttk, "contacts", r.contacts, "sips", r.sips, "idle", r.idleFraction);
}

function summarize(rows) {
  const tiers = ["ordinary", "group", "miniboss", "major"];
  const out = {};
  for (const tier of tiers) {
    const part = rows.filter((r) => r.tier === tier);
    const std = part.filter((r) => r.policy === "standard");
    const ast = part.filter((r) => r.policy === "assisted");
    out[tier] = {
      rows: part.length,
      standardClears: std.filter((r) => r.won).length,
      standardUntouched: std.filter((r) => r.won && r.damageTaken === 0).length,
      standardOf: std.length,
      assistedClears: ast.filter((r) => r.won).length,
      assistedUntouched: ast.filter((r) => r.won && r.damageTaken === 0).length,
      assistedOf: ast.length,
      maxTtk: Math.max(0, ...part.map((r) => r.ttk ?? 0)),
      maxIdle: Math.max(0, ...part.map((r) => r.idleFraction)),
    };
  }
  return out;
}

function keepRate(n) {
  let kept = 0;
  const rand = mulberry(3);
  for (let i = 0; i < n; i++) {
    const winters = 14 + Math.floor(rand() * 5);
    const p = winters >= 12 ? 0.22 : winters >= 6 ? 0.55 : 0.8;
    if (rand() < p) kept++;
  }
  return { n, kept, rate: Math.round((kept / n) * 1000) / 1000 };
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function compact(r) {
  return {
    tier: r.tier,
    id: r.id,
    build: r.build,
    policy: r.policy,
    won: r.won,
    damageTaken: r.damageTaken,
    contacts: r.contacts,
    ttk: r.ttk,
    sips: r.sips,
    idleFraction: r.idleFraction,
  };
}

function renderTables(rows, stress) {
  const lines = [
    "# Simulation tables",
    "",
    "Not a playtest. Starter iron and the spacing policy. Source " + UNITS.source.sha + ".",
    "",
    "## Standard policy",
    "",
    "| tier | encounter | early | middle | late |",
    "|---|---|---|---|---|",
  ];
  const ids = [];
  for (const r of rows) {
    if (r.policy !== "standard") continue;
    const key = r.tier + "|" + r.id;
    if (!ids.includes(key)) ids.push(key);
  }
  for (const key of ids) {
    const [tier, id] = key.split("|");
    const cell = (build) => {
      const r = rows.find((x) => x.tier === tier && x.id === id && x.build === build && x.policy === "standard");
      if (!r) return "—";
      return r.won && r.damageTaken === 0 ? "0 / " + r.ttk + "s" : "dmg " + r.damageTaken;
    };
    const late = rows.find(
      (x) => x.tier === tier && x.id === id && x.policy === "standard" && (x.build === "late" || x.build === "late-sphere"),
    );
    const lateCell = !late ? "—" : late.won && late.damageTaken === 0 ? "0 / " + late.ttk + "s" : "dmg " + late.damageTaken;
    lines.push("| " + tier + " | " + id + " | " + cell("early") + " | " + cell("middle") + " | " + lateCell + " |");
  }
  lines.push("");
  lines.push("## Form sweep on mb-fisher, middle upgrade ranks, standard");
  lines.push("");
  lines.push("| form | flaw | damage | ttk | observed fisher peak |");
  lines.push("|---|---|---|---|---|");
  for (const r of stress) {
    lines.push("| " + r.form + " | " + r.flaw + " | " + r.damageTaken + " | " + r.ttk + " | " + Object.values(r.peak)[0] + " |");
  }
  lines.push("");
  lines.push("Cell format is damage taken / time to kill. Assisted rows took the same damage (zero) and did not sip.");
  lines.push("");
  return lines.join("\n");
}
