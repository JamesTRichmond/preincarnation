#!/usr/bin/env node
/**
 * Validator for the PREINCARNATION optional-story pack.
 * Run from anywhere:
 *   node support/grok-08-narrative/tools/validate.mjs
 *   node support/grok-08-narrative/tools/validate.mjs --self-test
 *
 * Exits 0 on pass. Does not call any game runtime. It simulates the
 * proposed dialogue/flag seams declared in INTEGRATION_MAP.json.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");

const PLACEHOLDER =
  /\b(TODO|TBD|PLACEHOLDER|lorem ipsum|\[insert\]|FIXME|as an ai|quest giver|adventurer|waveform)\b/i;
const COMPASS = /compass|waypoint|quest marker|map pin|\bHUD\b|minimap/i;
const FETCH = /bring me the|fetch the|collect \d+|quest item|go and get/i;
const API_LEAK = /GameAPI|game\.runtime|\bengine\.|axios\.|localStorage|fetch\s*\(|\bwindow\.(document|location|navigator|addEventListener)\b/;

const REWARD_KINDS = new Set(["knowledge", "access", "stance", "record", "token"]);
const STATUSES = new Set(["completed", "interrupted", "failed"]);

export function validatePack(pack) {
  const errors = [];
  const err = (code, message, where) => errors.push({ code, message, where: where || "" });

  const eras = pack.eras || [];
  const eraById = new Map(eras.map((e) => [e.id, e]));
  const people = pack.people || [];
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const locations = pack.locations || [];
  const locById = new Map(locations.map((l) => [l.id, l]));
  const lineages = new Set((pack.lineages || []).map((l) => l.id));
  const creatures = new Set((pack.creatures || []).map((c) => c.id));
  const speakerSet = new Set((pack.speakers || []).map((s) => s.id));
  const flags = pack.flags || {};
  const flagSet = new Set(Object.keys(flags));
  const mutex = pack.mutexGroups || [];
  const creation = pack.characterCreation || { backgrounds: [], bonds: [], ideals: [], flaws: [] };
  const bg = new Set(creation.backgrounds.map((x) => x.id));
  const bonds = new Set(creation.bonds.map((x) => x.id));
  const ideals = new Set(creation.ideals.map((x) => x.id));
  const flaws = new Set(creation.flaws.map((x) => x.id));
  const towns = new Set(pack.towns || []);
  const quests = pack.quests || [];
  const questById = new Map(quests.map((q) => [q.id, q]));

  if (eras.length !== 6) err("ERA_COUNT", `expected 6 eras, found ${eras.length}`);
  const expectedYears = [1952, 1966, 1980, 1994, 2008, 2022];
  eras.forEach((e, i) => {
    if (e.year !== expectedYears[i]) {
      err("ERA_CLOCK", `${e.id} year ${e.year} does not match the locked clock ${expectedYears[i]}`, e.id);
    }
  });

  if (!pack.integration?.status?.includes("PROPOSED_CONTRACT_NOT_AN_EXISTING_RUNTIME")) {
    err("INTEGRATION", "integration map must declare PROPOSED_CONTRACT_NOT_AN_EXISTING_RUNTIME");
  }
  const integText = JSON.stringify(pack.integration || {});
  if (!/not an existing runtime/i.test(integText) && !/NOT_AN_EXISTING_RUNTIME/.test(integText)) {
    err("INTEGRATION", "integration map must say it is not an existing runtime");
  }

  for (const loc of locations) {
    if (loc.county !== "Addison" || loc.state !== "VT") {
      err("LOCATION_COUNTY", `${loc.id} is outside Addison County, Vermont`, loc.id);
    }
    if (!towns.has(loc.town)) err("LOCATION_TOWN", `${loc.id} town ${loc.town} is not an Addison town`, loc.id);
  }

  if (people.length < 60) err("PEOPLE_COUNT", `need at least 60 named people, found ${people.length}`);
  const seenNames = new Map();
  let deadBeforeEnd = 0;
  let bornAfterStart = 0;
  let spanAll = 0;
  let livingBodies = 0;
  for (const p of people) {
    if (seenNames.has(p.id)) err("DUP_ID", `duplicate person ${p.id}`);
    seenNames.set(p.id, true);
    if (!lineages.has(p.lineageId)) err("MISSING_REFERENCE", `${p.id} lineage ${p.lineageId} missing`, p.id);
    for (const field of ["name", "role", "voice", "relationshipToEllis"]) {
      if (!p[field] || String(p[field]).length < 8) {
        err("PERSON_FIELD", `${p.id} missing substantial ${field}`, p.id);
      }
    }
    if (!p.presence) err("PERSON_FIELD", `${p.id} missing presence`, p.id);
    if (!["living", "memory", "body", "displaced"].includes(p.presence)) {
      err("PERSON_FIELD", `${p.id} bad presence`, p.id);
    }
    if (!Array.isArray(p.lines) || p.lines.length < 1) {
      err("PERSON_DIALOGUE", `${p.id} has no dialogue lines`, p.id);
    } else {
      for (const line of p.lines) {
        if (!line.text || line.text.length < 30) err("PERSON_DIALOGUE", `${p.id} line too thin`, p.id);
        if (PLACEHOLDER.test(line.text || "")) err("PLACEHOLDER", `${p.id} placeholder line`, p.id);
      }
    }
    if (p.presence === "memory" && !(p.deathYear < 1952)) {
      err("AGE_LOGIC", `${p.id} memory presence must be dead before 1952`, p.id);
    }
    if (p.presence === "displaced" && !p.splitYear) {
      err("AGE_LOGIC", `${p.id} displaced person needs splitYear`, p.id);
    }
    if (p.presence === "living" || p.presence === "body") {
      livingBodies += 1;
      if (typeof p.birthYear !== "number") err("AGE_LOGIC", `${p.id} needs birthYear`, p.id);
      const erasPresent = eras.filter((e) => alive(p, e, {}));
      if (Array.isArray(p.erasPresent)) {
        const got = [...p.erasPresent].sort().join(",");
        const expect = erasPresent.map((e) => e.id).sort().join(",");
        if (got !== expect) {
          err("AGE_LOGIC", `${p.id} erasPresent ${got} != computed ${expect}`, p.id);
        }
      }
      if (erasPresent.length === 6) spanAll += 1;
      if (p.birthYear > 1952) bornAfterStart += 1;
      const death = p.deathYear;
      if (death != null && death < 2022) deadBeforeEnd += 1;
    }
    scanStrings(p, p.id, err);
  }
  if (deadBeforeEnd < 25) err("TURNOVER", `only ${deadBeforeEnd} people die before 2022; the county must turn over`);
  if (bornAfterStart < 8) err("TURNOVER", `only ${bornAfterStart} living/body people are born after 1952`);
  if (livingBodies && spanAll / livingBodies > 0.4) {
    err("TURNOVER", `${spanAll}/${livingBodies} living people span all six eras`);
  }

  if (pack.enforceSecondLife !== false) {
    for (const id of ["p.maeve_harrow", "p.cal_voss", "p.ansel_demerritt"]) {
      const p = peopleById.get(id);
      if (!p?.secondLife) err("SECOND_LIFE", `${id} missing secondLife record`, id);
      const e1 = (p?.lines || []).filter((l) => l.era === "E1");
      if (e1.length < 2) err("SECOND_LIFE", `${id} needs at least two distinct E1 lines`, id);
    }
  }

  const requiredTitles = [
    "The Bridge That Was Promised",
    "The Orchard Inheritance",
    "The Choir of Unsent Letters",
    "The Last Creemee Stand",
    "The Quarry Workers' Names",
    "The Animal That Remembers",
    "The Flood Book",
    "The Quiet Household",
  ];
  if (quests.length !== 64) err("QUEST_COUNT", `expected exactly 64 quests, found ${quests.length}`);
  const chains = quests.filter((q) => q.kind === "chain");
  const standalones = quests.filter((q) => q.kind === "standalone");
  if (chains.length !== 8) err("QUEST_COUNT", `expected 8 chains, found ${chains.length}`);
  if (standalones.length !== 56) err("QUEST_COUNT", `expected 56 standalones, found ${standalones.length}`);
  const titles = new Set(chains.map((c) => c.title));
  for (const t of requiredTitles) {
    if (!titles.has(t)) err("CHAIN_TITLE", `missing chain title: ${t}`);
  }

  const longTexts = new Map();
  const units = [];

  for (const q of quests) {
    if (questById.get(q.id) !== q) err("DUP_ID", `duplicate quest ${q.id}`);
    if (q.kind === "standalone") {
      checkUnitShell(q, q.id, err, { locById, eraById, peopleById, creatures, flagSet });
      units.push(unitFrom(q, null));
      checkGraphBundle(q, q.id, err, {
        peopleById,
        speakerSet,
        eraById,
        flagSet,
        mutex,
        bg,
        bonds,
        ideals,
        flaws,
        longTexts,
        flags,
      });
    } else if (q.kind === "chain") {
      if (!q.summary || q.summary.length < 20) err("QUEST_FIELD", `${q.id} chain summary thin`, q.id);
      if (!q.endingImplications || q.endingImplications.length < 20) {
        err("QUEST_FIELD", `${q.id} chain ending implications thin`, q.id);
      }
      const stages = q.chainStages || [];
      if (stages.length < 4) err("CHAIN_STAGES", `${q.id} has ${stages.length} stages`, q.id);
      const stageIds = new Set();
      for (const s of stages) {
        if (stageIds.has(s.id)) err("DUP_ID", `duplicate stage ${s.id}`, q.id);
        stageIds.add(s.id);
        checkUnitShell(s, `${q.id}/${s.id}`, err, { locById, eraById, peopleById, creatures, flagSet });
        checkGraphBundle(s, `${q.id}/${s.id}`, err, {
          peopleById,
          speakerSet,
          eraById,
          flagSet,
          mutex,
          bg,
          bonds,
          ideals,
          flaws,
          longTexts,
          flags,
        });
        units.push(unitFrom(s, q.id));
      }
      // reachability via nextStageIds
      const byStage = new Map(stages.map((s) => [s.id, s]));
      if (!stages.length) continue;
      const seen = new Set();
      const queue = [stages[0].id];
      let guard = 0;
      while (queue.length && guard < 100) {
        guard += 1;
        const id = queue.shift();
        if (seen.has(id)) continue;
        seen.add(id);
        const s = byStage.get(id);
        if (!s) {
          err("MISSING_REFERENCE", `next stage ${id} missing`, q.id);
          continue;
        }
        for (const n of s.nextStageIds || []) {
          const nxt = byStage.get(n);
          if (!nxt) err("MISSING_REFERENCE", `${id} next ${n} missing`, q.id);
          else {
            const a = Math.min(...s.eraEligibility.map((e) => eraById.get(e)?.year ?? 9999));
            const b = Math.min(...nxt.eraEligibility.map((e) => eraById.get(e)?.year ?? 9999));
            if (b < a) err("CONTRADICTORY_PREREQUISITES", `${n} starts before ${id}`, q.id);
            queue.push(n);
          }
        }
      }
      for (const s of stages) {
        if (!seen.has(s.id)) err("UNREACHABLE_STAGE", `${s.id} is not reachable from ${stages[0].id} via nextStageIds`, q.id);
      }
      const forkCount = stages.filter((s) => s.secondLifeFork).length;
      if (q.secondLifeNpc && forkCount < 1) {
        err("SECOND_LIFE", `${q.id} marked secondLifeNpc but no stage has secondLifeFork`, q.id);
      }
    } else {
      err("QUEST_KIND", `${q.id} kind ${q.kind}`, q.id);
    }
    scanStrings(q, q.id, err);
  }

  // Second-life structural requirement
  const forks = [];
  for (const q of quests) {
    if (q.secondLifeFork) forks.push([q.id, q.secondLifeFork, q]);
    for (const s of q.chainStages || []) if (s.secondLifeFork) forks.push([`${q.id}/${s.id}`, s.secondLifeFork, s]);
  }
  if (pack.enforceSecondLife !== false) {
    for (const npc of ["p.maeve_harrow", "p.cal_voss", "p.ansel_demerritt"]) {
      const hit = forks.filter(([, f]) => f.npcId === npc && f.era === "E1");
      if (!hit.length) err("SECOND_LIFE", `no E1 secondLifeFork for ${npc}`, npc);
      for (const [where, fork, host] of hit) {
        checkFork(fork, host, where, err);
      }
    }
  }

  // Prerequisite contradictions + reachability
  const outputs = new Map();
  for (const u of units) {
    for (const f of u.outputs) {
      if (!outputs.has(f)) outputs.set(f, []);
      outputs.get(f).push(u);
    }
  }
  for (const f of Object.keys(pack.initialFlags || {})) {
    if (pack.initialFlags[f] === true) {
      if (!outputs.has(f)) outputs.set(f, []);
      outputs.get(f).push({ id: "initial", eras: ["E0"], outputs: [f] });
    }
  }
  for (const e of eras) {
    const f = `flags.era.${e.id}`;
    if (!outputs.has(f)) outputs.set(f, []);
    outputs.get(f).push({ id: "era", eras: [e.id], outputs: [f] });
  }

  for (const u of units) {
    const c = contradictPrereq(u.host.prerequisites || { all: [], any: [], none: [] }, u, {
      mutex,
      eraById,
      flagSet,
      questById,
    });
    for (const msg of c) err("CONTRADICTORY_PREREQUISITES", msg, u.id);
  }

  const available = new Set(Object.entries(pack.initialFlags || {}).filter(([, v]) => v === true).map(([k]) => k));
  const reached = new Set();
  let guard = 0;
  let changed = true;
  while (changed && guard < 500) {
    guard += 1;
    changed = false;
    for (const u of units) {
      if (reached.has(u.id)) continue;
      // era flags for this unit's own eligibility are live when it can run
      const live = new Set(available);
      for (const e of u.eras) live.add(`flags.era.${e}`);
      if (satisfiable(u.host.prerequisites || { all: [], any: [], none: [] }, live, pack.initialFlags || {})) {
        reached.add(u.id);
        for (const f of u.outputs) if (!available.has(f)) available.add(f);
        changed = true;
      }
    }
  }
  for (const u of units) {
    if (!reached.has(u.id)) {
      err("UNREACHABLE_STAGE", `${u.id} prerequisites can never be satisfied`, u.id);
    }
  }

  // forced none-of against initial
  for (const u of units) {
    for (const cond of u.host.prerequisites?.none || []) {
      if (cond.flag && cond.eq === true && pack.initialFlags?.[cond.flag] === true) {
        err("CONTRADICTORY_PREREQUISITES", `${u.id} forbids initial flag ${cond.flag}`, u.id);
      }
    }
  }

  const stats = {
    quests: quests.length,
    chains: chains.length,
    standalones: standalones.length,
    stages: chains.reduce((n, c) => n + (c.chainStages?.length || 0), 0),
    people: people.length,
    locations: locations.length,
    flags: flagSet.size,
    errors: errors.length,
    dialogueNodes: countNodes(quests),
  };
  return { errors, stats };
}

function countNodes(quests) {
  let n = 0;
  const walk = (g) => {
    if (g?.nodes) n += Object.keys(g.nodes).length;
  };
  for (const q of quests) {
    walk(q.dialogue);
    for (const a of q.ifNpcDead || []) walk(a.dialogue);
    for (const s of q.chainStages || []) {
      walk(s.dialogue);
      for (const a of s.ifNpcDead || []) walk(a.dialogue);
    }
  }
  return n;
}

function unitFrom(host, parentId) {
  const outputs = new Set();
  collectSets(host.dialogue, outputs);
  for (const a of host.ifNpcDead || []) collectSets(a.dialogue, outputs);
  for (const [k, v] of Object.entries(host.deathTransition?.setsOnDeath || {})) {
    if (v === true) outputs.add(k);
  }
  return {
    id: parentId ? `${parentId}/${host.id}` : host.id,
    eras: host.eraEligibility || [],
    outputs: [...outputs],
    host,
  };
}

function collectSets(graph, into) {
  if (!graph?.nodes) return;
  for (const node of Object.values(graph.nodes)) {
    for (const [k, v] of Object.entries(node.end?.setsFlags || {})) if (v === true) into.add(k);
    for (const c of node.choices || []) {
      for (const [k, v] of Object.entries(c.setsFlags || {})) if (v === true) into.add(k);
    }
  }
}

function checkUnitShell(host, where, err, ctx) {
  if (!host.id || !host.title) err("QUEST_FIELD", `${where} missing id/title`, where);
  if (!host.locationId || !ctx.locById.has(host.locationId)) {
    err("MISSING_REFERENCE", `${where} location ${host.locationId}`, where);
  }
  if (!Array.isArray(host.eraEligibility) || host.eraEligibility.length < 1) {
    err("QUEST_FIELD", `${where} eraEligibility empty`, where);
  } else {
    for (const e of host.eraEligibility) {
      if (!ctx.eraById.has(e)) err("MISSING_REFERENCE", `${where} era ${e}`, where);
    }
  }
  if (!Array.isArray(host.characterIds) || host.characterIds.length < 1) {
    err("QUEST_FIELD", `${where} needs characters`, where);
  }
  for (const id of host.characterIds || []) {
    if (!ctx.peopleById.has(id)) err("MISSING_REFERENCE", `${where} person ${id}`, where);
  }
  for (const id of host.creatureIds || []) {
    if (!ctx.creatures.has(id)) err("MISSING_REFERENCE", `${where} creature ${id}`, where);
  }
  if (!host.discovery || host.discovery.length < 40) err("QUEST_FIELD", `${where} discovery too thin`, where);
  if (COMPASS.test(host.discovery || "")) err("COMPASS", `${where} discovery uses a compass/marker`, where);
  if (FETCH.test(host.discovery || "")) err("FETCH", `${where} discovery is a fetch errand`, where);
  if (!host.summary || host.summary.length < 40) err("QUEST_FIELD", `${where} summary too thin`, where);
  if (!host.endingImplications || host.endingImplications.length < 40) {
    err("QUEST_FIELD", `${where} ending implications too thin`, where);
  }
  if (!Array.isArray(host.steps) || host.steps.length < 2) err("QUEST_FIELD", `${where} needs >= 2 playable steps`, where);
  for (const s of host.steps || []) {
    if (!s.playerAction || s.playerAction.length < 20) err("QUEST_FIELD", `${where} thin step`, where);
    if (FETCH.test(s.playerAction || "")) err("FETCH", `${where} step reads as a fetch`, where);
    if (COMPASS.test(s.playerAction || "")) err("COMPASS", `${where} step uses a marker`, where);
  }
  const pr = host.prerequisites || { all: [], any: [], none: [] };
  for (const list of [pr.all, pr.any, pr.none]) {
    for (const cond of list || []) {
      if (cond.flag && !ctx.flagSet.has(cond.flag)) {
        err("MISSING_REFERENCE", `${where} prereq flag ${cond.flag}`, where);
      }
      if (cond.quest && !cond._skip) {
        /* quest existence checked later if field used */
      }
    }
  }
  if (!Array.isArray(host.rewards) || host.rewards.length < 1) err("QUEST_FIELD", `${where} needs rewards`, where);
  for (const r of host.rewards || []) {
    if (!REWARD_KINDS.has(r.kind)) err("QUEST_FIELD", `${where} bad reward kind ${r.kind}`, where);
    if (!r.id || !r.detail || r.detail.length < 20) err("QUEST_FIELD", `${where} thin reward`, where);
  }
  const d = host.deathTransition;
  if (!d) err("QUEST_FIELD", `${where} missing deathTransition`, where);
  else {
    for (const k of ["ifEllisDiesMidQuest", "onEraAdvanceIfUnresolved", "onEraAdvanceIfResolved"]) {
      if (!d[k] || d[k].length < 40) err("QUEST_FIELD", `${where} deathTransition.${k} too thin`, where);
    }
    if (!Array.isArray(d.flagsCarriedOnDeath) || !Array.isArray(d.flagsLostOnDeath)) {
      err("QUEST_FIELD", `${where} death flags must be arrays`, where);
    }
  }
  if (!Array.isArray(host.ifNpcDead) || host.ifNpcDead.length < 1) {
    err("NPC_DEATH", `${where} needs an alternate resolution if an NPC dies`, where);
  }
  const covered = new Set((host.ifNpcDead || []).map((x) => x.npcId));
  for (const id of host.characterIds || []) {
    if (!covered.has(id)) err("NPC_DEATH", `${where} no alternate if ${id} dies`, where);
  }
  if (!Array.isArray(host.validationCases) || host.validationCases.length < 2) {
    err("VALIDATION_CASE", `${where} needs >= 2 validation cases`, where);
  }
  if (!Array.isArray(host.branches) || host.branches.length < 2) {
    err("BRANCH", `${where} needs >= 2 branches`, where);
  }
}

function checkGraphBundle(host, where, err, ctx) {
  const branchIds = new Set((host.branches || []).map((b) => b.id));
  checkGraph(host.dialogue, `${where}/main`, host, err, ctx, branchIds, false);
  for (const alt of host.ifNpcDead || []) {
    if (!alt.surrogateId || !ctx.peopleById.has(alt.surrogateId)) {
      err("MISSING_REFERENCE", `${where} surrogate ${alt.surrogateId}`, where);
    }
    if (!alt.resolution || alt.resolution.length < 30) err("NPC_DEATH", `${where} alt resolution thin`, where);
    if (!alt.dialogue) err("UNFINISHED_DIALOGUE", `${where} alt dialogue missing`, where);
    checkGraph(alt.dialogue, `${where}/alt:${alt.npcId}`, host, err, ctx, branchIds, true);
    // surrogate should be able to speak: present in some eligible era
    const surrogate = ctx.peopleById.get(alt.surrogateId);
    if (surrogate && host.eraEligibility?.length) {
      const any = host.eraEligibility.some((id) => alive(surrogate, ctx.eraById.get(id), {}));
      if (!any) err("NPC_DEATH", `${where} surrogate ${alt.surrogateId} is dead in every eligible era`, where);
    }
  }
  // main speakers vs default calendar
  if (host.dialogue && host.eraEligibility) {
    for (const eraId of host.eraEligibility) {
      const era = ctx.eraById.get(eraId);
      for (const node of Object.values(host.dialogue.nodes || {})) {
        const sp = node.speakerId;
        if (!sp || ctx.speakerSet.has(sp)) continue;
        const p = ctx.peopleById.get(sp);
        if (!p) continue;
        if (p.presence === "memory" || p.presence === "displaced") continue;
        if (!alive(p, era, {})) {
          err(
            "NPC_DEATH",
            `${where} main dialogue lets ${sp} speak in ${eraId} but they are not alive under the default calendar. Move them to a quote or an earlier era.`,
            where,
          );
        }
      }
    }
  }
  runCases(host, where, err, ctx);
}

function checkGraph(graph, where, host, err, ctx, branchIds, isAlt) {
  if (!graph?.start || !graph.nodes?.[graph.start]) {
    err("UNFINISHED_DIALOGUE", `${where} missing start node`, where);
    return;
  }
  const nodes = graph.nodes;
  for (const [id, node] of Object.entries(nodes)) {
    if (!node.speakerId) err("UNFINISHED_DIALOGUE", `${where} ${id} no speaker`, where);
    else if (!ctx.speakerSet.has(node.speakerId) && !ctx.peopleById.has(node.speakerId)) {
      err("MISSING_REFERENCE", `${where} speaker ${node.speakerId}`, where);
    }
    if (!node.text || String(node.text).trim().length < 40) {
      err("UNFINISHED_DIALOGUE", `${where} ${id} text under 40 characters`, where);
    }
    if (PLACEHOLDER.test(node.text || "")) err("PLACEHOLDER", `${where} ${id}`, where);
    rememberLong(ctx.longTexts, node.text, `${where}:${id}`, err);
    for (const v of node.textVariants || []) {
      if (!v.text || v.text.length < 40) err("UNFINISHED_DIALOGUE", `${where} ${id} variant thin`, where);
      checkCharacterWhen(v.when || {}, where, err, ctx);
      rememberLong(ctx.longTexts, v.text, `${where}:${id}:var`, err);
    }
    const modes = [node.choices?.length ? "choices" : null, node.next ? "next" : null, node.end ? "end" : null].filter(Boolean);
    if (modes.length !== 1) {
      err("UNFINISHED_DIALOGUE", `${where} ${id} must have exactly one of choices, next, or end`, where);
    }
    if (node.next && !nodes[node.next]) err("UNFINISHED_DIALOGUE", `${where} ${id} next ${node.next} missing`, where);
    if (node.end) {
      if (!node.end.branchId || !branchIds.has(node.end.branchId)) {
        err("BRANCH", `${where} ${id} end branch ${node.end.branchId} not declared`, where);
      }
      if (!STATUSES.has(node.end.status)) err("BRANCH", `${where} ${id} bad status`, where);
      checkSets(node.end.setsFlags, where, id, err, ctx);
    }
    for (const c of node.choices || []) {
      if (!c.id || !c.text || c.text.length < 8) err("UNFINISHED_DIALOGUE", `${where} ${id} choice ${c.id} thin`, where);
      if (!c.next || !nodes[c.next]) err("UNFINISHED_DIALOGUE", `${where} choice ${c.id} next missing`, where);
      if (PLACEHOLDER.test(c.text || "")) err("PLACEHOLDER", `${where} choice ${c.id}`, where);
      checkSets(c.setsFlags, where, id, err, ctx);
      if (c.requires) checkRequiresShape(c.requires, where, err, ctx);
    }
    if (node.choices?.length && !node.partition) {
      const unguarded = node.choices.some((c) => !c.requires || emptyReq(c.requires));
      if (!unguarded) {
        err("UNFINISHED_DIALOGUE", `${where} ${id} choices are all gated and the node is not a declared partition`, where);
      }
    }
    if (node.partition) checkPartition(node, where, id, err);
  }
  // structural: every node can reach an end, ignoring requires
  for (const id of Object.keys(nodes)) {
    if (!canReachEnd(nodes, id, new Set())) {
      err("UNFINISHED_DIALOGUE", `${where} ${id} cannot reach an ending`, where);
    }
  }
  // reachability from start
  const reachable = new Set();
  const stack = [graph.start];
  while (stack.length) {
    const id = stack.pop();
    if (!id || reachable.has(id) || !nodes[id]) continue;
    reachable.add(id);
    const node = nodes[id];
    if (node.next) stack.push(node.next);
    for (const c of node.choices || []) stack.push(c.next);
  }
  for (const id of Object.keys(nodes)) {
    if (!reachable.has(id)) err("UNFINISHED_DIALOGUE", `${where} ${id} is not reachable from start`, where);
  }
  if (!isAlt) {
    const ends = Object.values(nodes).filter((n) => n.end).map((n) => n.end.branchId);
    if (new Set(ends).size < 2) err("BRANCH", `${where} main graph needs two endings`, where);
  }
}

function checkPartition(node, where, id, err) {
  const flags = node.partition.flags || [];
  if (!flags.length) {
    err("UNFINISHED_DIALOGUE", `${where} ${id} partition has no flags`, where);
    return;
  }
  const states = node.partition.mode === "oneOrNone" ? statesOneOrNone(flags) : statesExactlyOne(flags);
  const signatures = [];
  for (const state of states) {
    const open = node.choices.filter((c) => reqOk(c.requires, state, { character: null, ignoreCharacter: true }));
    if (!open.length) {
      err("UNFINISHED_DIALOGUE", `${where} ${id} partition state ${JSON.stringify(state)} has no choice`, where);
    }
    signatures.push(open.map((c) => c.next).sort().join("|"));
  }
  if (new Set(signatures).size < states.length) {
    err("SECOND_LIFE", `${where} ${id} partition states do not lead to different scenes`, where);
  }
}

function statesExactlyOne(flags) {
  return flags.map((f) => {
    const s = {};
    for (const x of flags) s[x] = x === f;
    return s;
  });
}
function statesOneOrNone(flags) {
  const none = {};
  for (const f of flags) none[f] = false;
  return [none, ...statesExactlyOne(flags)];
}

function canReachEnd(nodes, id, stack) {
  if (stack.has(id)) return false;
  const node = nodes[id];
  if (!node) return false;
  if (node.end) return true;
  stack.add(id);
  if (node.next) {
    const ok = canReachEnd(nodes, node.next, stack);
    stack.delete(id);
    return ok;
  }
  const ok = (node.choices || []).some((c) => canReachEnd(nodes, c.next, stack));
  stack.delete(id);
  return ok;
}

function checkSets(sets, where, id, err, ctx) {
  if (!sets) return;
  for (const k of Object.keys(sets)) {
    if (!ctx.flagSet.has(k)) err("MISSING_REFERENCE", `${where} sets unknown flag ${k}`, where);
  }
  for (const group of ctx.mutex) {
    const trues = group.filter((f) => sets[f] === true);
    if (trues.length > 1) err("CONTRADICTORY_PREREQUISITES", `${where} ${id} sets mutex flags together: ${trues.join(", ")}`, where);
  }
}

function checkRequiresShape(req, where, err, ctx) {
  if (req.character) checkCharacterWhen(req.character, where, err, ctx);
  for (const list of [req.all, req.any, req.none]) {
    for (const cond of list || []) {
      if (cond.flag && !ctx.flagSet.has(cond.flag)) err("MISSING_REFERENCE", `${where} requires ${cond.flag}`, where);
    }
  }
}

function checkCharacterWhen(when, where, err, ctx) {
  if (when.background && !ctx.bg.has(when.background)) err("MISSING_REFERENCE", `${where} background ${when.background}`, where);
  if (when.bond && !ctx.bonds.has(when.bond)) err("MISSING_REFERENCE", `${where} bond ${when.bond}`, where);
  if (when.ideal && !ctx.ideals.has(when.ideal)) err("MISSING_REFERENCE", `${where} ideal ${when.ideal}`, where);
  if (when.flaw && !ctx.flaws.has(when.flaw)) err("MISSING_REFERENCE", `${where} flaw ${when.flaw}`, where);
  if (Array.isArray(when.flags)) {
    for (const f of when.flags) {
      if (!ctx.flagSet?.has(f)) err("MISSING_REFERENCE", `${where} variant flag ${f}`, where);
    }
  }
}

function rememberLong(map, text, where, err) {
  const norm = String(text || "").replace(/\s+/g, " ").trim();
  if (norm.length < 80) return;
  if (map.has(norm)) err("DUPLICATE_DIALOGUE", `${where} repeats text from ${map.get(norm)}`, where);
  else map.set(norm, where);
}

function emptyReq(req) {
  const c = req.character && Object.keys(req.character).length;
  return !c && !(req.all || []).length && !(req.any || []).length && !(req.none || []).length;
}

function checkFork(fork, host, where, err) {
  if (!fork.variants || fork.variants.length < 3) {
    err("SECOND_LIFE", `${where} second life needs 3 variants`, where);
    return;
  }
  const nodes = host.dialogue?.nodes || {};
  const forkNode = nodes[fork.nodeId];
  if (!forkNode?.partition) err("SECOND_LIFE", `${where} fork node ${fork.nodeId} missing partition`, where);
  for (const v of fork.variants) {
    if (!nodes[v.entry]) err("SECOND_LIFE", `${where} missing entry ${v.entry}`, where);
    const count = subtreeSize(nodes, v.entry, new Set(fork.variants.map((x) => x.entry)));
    if (count < 4) err("SECOND_LIFE", `${where} variant ${v.id} subtree has ${count} nodes (need >= 4)`, where);
    if (!nodes[v.entry]?.text || nodes[v.entry].text.length < 80) {
      err("SECOND_LIFE", `${where} variant ${v.id} entry text is not substantial`, where);
    }
  }
  const texts = fork.variants.map((v) => nodes[v.entry]?.text || "");
  if (new Set(texts).size < texts.length) err("SECOND_LIFE", `${where} variant openings repeat`, where);
}

function subtreeSize(nodes, id, entries, seen = new Set()) {
  if (!id || seen.has(id) || !nodes[id]) return 0;
  // crossing into a different variant entry doesn't count
  if (seen.size > 0 && entries.has(id)) return 0;
  seen.add(id);
  let n = 1;
  const node = nodes[id];
  if (node.next) n += subtreeSize(nodes, node.next, entries, seen);
  for (const c of node.choices || []) n += subtreeSize(nodes, c.next, entries, seen);
  return n;
}

function runCases(host, where, err, ctx) {
  for (const c of host.validationCases || []) {
    if (!c.id || !c.expect?.end) {
      err("VALIDATION_CASE", `${where} case missing id or expect.end`, where);
      continue;
    }
    if (!ctx.eraById.has(c.era)) err("VALIDATION_CASE", `${where} case ${c.id} bad era`, where);
    checkCharacterWhen(c.character || {}, where, err, ctx);
    const useAlt = c.graph === "alternate";
    let graph = host.dialogue;
    if (useAlt) {
      const alt = (host.ifNpcDead || []).find((a) => a.npcId === c.useAlternateFor) || host.ifNpcDead?.[0];
      graph = alt?.dialogue;
    }
    if (!graph) {
      err("VALIDATION_CASE", `${where} case ${c.id} has no graph`, where);
      continue;
    }
    const ends = explore(graph, c.flags || {}, c.character || {}, ctx.mutex);
    if (ends.some((e) => e.stuck)) {
      err("UNFINISHED_DIALOGUE", `${where} case ${c.id} gets stuck at ${ends.find((e) => e.stuck).nodeId}`, where);
    }
    const hit = ends.filter((e) => e.branchId === c.expect.end);
    if (!hit.length) {
      err(
        "VALIDATION_CASE",
        `${where} case ${c.id} never reaches ${c.expect.end}; reached ${ends.map((e) => e.branchId || e.nodeId).join(",")}`,
        where,
      );
      continue;
    }
    if (c.expect.flags) {
      const ok = hit.some((e) => Object.entries(c.expect.flags).every(([k, v]) => e.flags[k] === v));
      if (!ok) err("VALIDATION_CASE", `${where} case ${c.id} flags mismatch for ${c.expect.end}`, where);
    }
    if (c.expect.not) {
      for (const banned of c.expect.not) {
        if (ends.some((e) => e.branchId === banned)) {
          err("VALIDATION_CASE", `${where} case ${c.id} unexpectedly reaches ${banned}`, where);
        }
      }
    }
  }
}

function explore(graph, flags0, character, mutex) {
  const ends = [];
  const seen = new Set();
  function rec(nodeId, flags, stack) {
    if (!nodeId || stack.includes(nodeId)) return;
    const key = nodeId + "|" + JSON.stringify(flags);
    if (seen.has(key)) return;
    seen.add(key);
    const node = graph.nodes[nodeId];
    if (!node) {
      ends.push({ stuck: true, nodeId });
      return;
    }
    if (node.end) {
      ends.push({ branchId: node.end.branchId, nodeId, flags: applyFlags(flags, node.end.setsFlags, mutex) });
      return;
    }
    if (node.next) {
      rec(node.next, flags, stack.concat(nodeId));
      return;
    }
    const choices = (node.choices || []).filter((c) => reqOk(c.requires, flags, { character, ignoreCharacter: false }));
    if (!choices.length) {
      ends.push({ stuck: true, nodeId });
      return;
    }
    for (const c of choices) rec(c.next, applyFlags(flags, c.setsFlags, mutex), stack.concat(nodeId));
  }
  rec(graph.start, { ...flags0 }, []);
  return ends;
}

function applyFlags(flags, sets, mutex) {
  const next = { ...flags };
  if (!sets) return next;
  const trues = [];
  for (const [k, v] of Object.entries(sets)) {
    next[k] = v;
    if (v === true) trues.push(k);
  }
  for (const group of mutex || []) {
    const hit = trues.filter((f) => group.includes(f));
    if (hit.length === 1) {
      for (const f of group) if (f !== hit[0]) next[f] = false;
    }
  }
  return next;
}

function reqOk(req, flags, ctx) {
  if (!req) return true;
  if (!ctx.ignoreCharacter && req.character) {
    for (const [k, v] of Object.entries(req.character)) {
      if (!ctx.character || ctx.character[k] !== v) return false;
    }
  }
  for (const cond of req.all || []) if (!condOk(cond, flags)) return false;
  if ((req.any || []).length && !(req.any || []).some((cond) => condOk(cond, flags))) return false;
  for (const cond of req.none || []) if (condOk(cond, flags)) return false;
  return true;
}

function condOk(cond, flags) {
  if (cond.flag) return flags[cond.flag] === cond.eq;
  return false;
}

function satisfiable(pr, live, initial) {
  const all = pr.all || [];
  const any = pr.any || [];
  const none = pr.none || [];
  for (const cond of all) {
    if (cond.flag && cond.eq === true && !live.has(cond.flag)) return false;
    if (cond.flag && cond.eq === false && (live.has(cond.flag) && initial[cond.flag] === true)) return false;
  }
  if (any.length) {
    const ok = any.some((cond) => {
      if (cond.flag && cond.eq === true) return live.has(cond.flag);
      if (cond.flag && cond.eq === false) return !initial[cond.flag];
      return false;
    });
    if (!ok) return false;
  }
  for (const cond of none) {
    if (cond.flag && cond.eq === true && initial[cond.flag] === true) return false;
  }
  return true;
}

function contradictPrereq(pr, unit, ctx) {
  const msgs = [];
  const all = pr.all || [];
  const none = pr.none || [];
  const seen = new Map();
  for (const cond of all) {
    if (!cond.flag) continue;
    const prev = seen.get(cond.flag);
    if (prev !== undefined && prev !== cond.eq) msgs.push(`${unit.id} requires ${cond.flag} both ${prev} and ${cond.eq}`);
    seen.set(cond.flag, cond.eq);
    if (cond.eq === true && none.some((n) => n.flag === cond.flag && n.eq === true)) {
      msgs.push(`${unit.id} requires ${cond.flag} true and forbids it`);
    }
    if (String(cond.flag).startsWith("flags.era.")) {
      const era = cond.flag.replace("flags.era.", "");
      if (cond.eq === true && unit.eras?.length && !unit.eras.includes(era)) {
        msgs.push(`${unit.id} requires ${era} but is not eligible then`);
      }
    }
  }
  for (const group of ctx.mutex) {
    const trues = all.filter((c) => c.flag && c.eq === true && group.includes(c.flag));
    if (trues.length > 1) msgs.push(`${unit.id} requires mutually exclusive flags ${trues.map((t) => t.flag).join(" & ")}`);
  }
  for (const cond of [...all, ...none, ...(pr.any || [])]) {
    if (cond.flag && ctx.flagSet && !ctx.flagSet.has(cond.flag)) {
      /* reported elsewhere */
    }
  }
  return msgs;
}

function alive(person, era, flags) {
  if (!person || !era) return false;
  if (person.presence === "memory" || person.presence === "displaced") return false;
  if (person.birthYear > era.year) return false;
  let death = person.deathYear ?? null;
  for (const o of person.deathOverrides || []) {
    if (flags[o.ifFlag] === true) death = o.deathYear;
  }
  if (death == null) return true;
  return death >= era.year;
}

function scanStrings(obj, where, err) {
  const stack = [obj];
  const seen = new Set();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    if (Array.isArray(cur)) {
      for (const x of cur) stack.push(x);
      continue;
    }
    for (const v of Object.values(cur)) {
      if (typeof v === "string") {
        if (PLACEHOLDER.test(v)) err("PLACEHOLDER", `${where} contains placeholder text`, where);
        if (API_LEAK.test(v)) err("FAKE_API", `${where} invents a runtime API`, where);
      } else if (v && typeof v === "object") stack.push(v);
    }
  }
}

function loadJson(name) {
  const p = join(dataDir, name);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

function loadPackFromDisk() {
  const quests = loadJson("quests.json");
  return {
    eras: loadJson("eras.json"),
    towns: loadJson("towns.json"),
    locations: loadJson("locations.json"),
    creatures: loadJson("creatures.json"),
    characterCreation: loadJson("character_creation.json"),
    speakers: loadJson("speakers.json"),
    lineages: loadJson("lineages.json"),
    people: loadJson("people.json"),
    flags: loadJson("flags.json"),
    mutexGroups: loadJson("mutex_groups.json"),
    initialFlags: loadJson("initial_flags.json"),
    quests,
    integration: loadJson("integration_map.json"),
  };
}

function selfTest() {
  const failures = [];
  const check = (name, errors, code) => {
    if (!errors.some((e) => e.code === code)) failures.push(`${name} did not report ${code} (got ${errors.map((e) => e.code).join(",")})`);
  };
  const base = miniGood();
  const good = validatePack(base);
  if (good.errors.length) failures.push(`good fixture failed: ${good.errors.map((e) => e.code + " " + e.message).join(" | ")}`);

  const missing = miniGood();
  missing.quests[0].chainStages[0].characterIds = ["p.nope"];
  check("missing", validatePack(missing).errors, "MISSING_REFERENCE");

  const unreach = miniGood();
  unreach.quests[0].chainStages[1].prerequisites = {
    all: [{ flag: "flags.never.set", eq: true }],
    any: [],
    none: [],
  };
  // flag must exist to isolate UNREACHABLE from MISSING
  unreach.flags["flags.never.set"] = "nobody writes this";
  check("unreach", validatePack(unreach).errors, "UNREACHABLE_STAGE");

  const contra = miniGood();
  contra.quests[0].chainStages[0].prerequisites = {
    all: [
      { flag: "flags.era.E0", eq: true },
      { flag: "flags.era.E0", eq: false },
    ],
    any: [],
    none: [],
  };
  check("contra", validatePack(contra).errors, "CONTRADICTORY_PREREQUISITES");

  const unfinished = miniGood();
  unfinished.quests[0].chainStages[0].dialogue.nodes.n_end_a.next = "n_missing";
  delete unfinished.quests[0].chainStages[0].dialogue.nodes.n_end_a.end;
  check("unfinished", validatePack(unfinished).errors, "UNFINISHED_DIALOGUE");

  if (failures.length) {
    console.error("SELF-TEST FAILED");
    for (const f of failures) console.error(" - " + f);
    process.exit(1);
  }
  console.log("self-test ok");
}

function nodeEnd(speakerId, text, branchId, sets) {
  return { speakerId, text, end: { branchId, status: "completed", setsFlags: sets || {} } };
}
function nodeSay(speakerId, text, choices) {
  return { speakerId, text, choices };
}

function miniGood() {
  const era = { id: "E0", year: 1952, label: "t" };
  const person = (id, birth, death, presence = "living") => ({
    id,
    name: `Test Person ${id}`,
    lineageId: "lin.a",
    role: "Role of this test person",
    birthYear: birth,
    deathYear: death,
    presence,
    voice: "A voice long enough to count.",
    relationshipToEllis: "A relationship long enough.",
    lines: [{ era: "E0", text: "This is a spoken line long enough to be real dialogue." }],
    erasPresent: death != null && death < 1952 ? [] : ["E0"],
    secondLife: id === "p.maeve_harrow" || id === "p.cal_voss" || id === "p.ansel_demerritt" ? { fromEra: "E1" } : undefined,
  });
  // Self-test only checks the four failure modes against a tiny pack.
  // People-count and quest-count gates are relaxed by stuffing the pack to the thresholds
  // with valid inert records, so the targeted code is what fails.
  const people = [];
  for (let i = 0; i < 60; i += 1) {
    const id = i === 0 ? "p.sur" : `p.filler_${i}`;
    people.push(person(id, 1900, 1960));
  }
  people.push(person("p.maeve_harrow", 1924, 1991));
  people.push(person("p.cal_voss", 1931, 2004));
  people.push(person("p.ansel_demerritt", 1910, 1978));
  // two E1 lines
  for (const id of ["p.maeve_harrow", "p.cal_voss", "p.ansel_demerritt"]) {
    const p = people.find((x) => x.id === id);
    p.lines.push({ era: "E1", text: "Second life line one, long enough to be dialogue here." });
    p.lines.push({ era: "E1", text: "Second life line two, different and long enough indeed." });
    p.erasPresent = ["E0"];
  }
  const textA = "The pier powders under the thumb if you press the chalked tick and wait.";
  const textB = "Then we jacket it this season and the hay can be angry without being dead.";
  const textC = "We keep the season and we do not pretend the concrete is a mood.";
  const stage = {
    id: "st.t0",
    title: "Stage",
    locationId: "loc.a",
    eraEligibility: ["E0"],
    characterIds: ["p.sur"],
    summary: "A summary long enough to explain the stake of this miniature stage.",
    discovery: "You see the chalk on the pier because you walked the abutment, not because a marker called.",
    prerequisites: { all: [{ flag: "flags.era.E0", eq: true }], any: [], none: [] },
    steps: [
      { id: "s1", playerAction: "Stand on the Vermont abutment and read the tick." },
      { id: "s2", playerAction: "Say whether the tick becomes testimony." },
    ],
    dialogue: {
      start: "n0",
      nodes: {
        n0: nodeSay("p.sur", textA, [
          { id: "c1", text: "Jacket the pier.", next: "n_end_a", setsFlags: { "flags.demo.a": true } },
          { id: "c2", text: "Keep the season.", next: "n_end_b", setsFlags: { "flags.demo.b": true } },
        ]),
        n_end_a: nodeEnd("p.sur", textB, "br.a", { "flags.demo.a": true }),
        n_end_b: nodeEnd("p.sur", textC, "br.b", { "flags.demo.b": true }),
      },
    },
    branches: [
      { id: "br.a", summary: "Jacket." },
      { id: "br.b", summary: "Season." },
      { id: "br.a2", summary: "Alt jacket." },
      { id: "br.b2", summary: "Alt season." },
    ],
    rewards: [{ kind: "knowledge", id: "reward.demo", detail: "The tick was real and somebody said so." }],
    deathTransition: {
      ifEllisDiesMidQuest: "The tick stays unread in the crack and the next body inherits dust.",
      flagsCarriedOnDeath: [],
      flagsLostOnDeath: [],
      onEraAdvanceIfUnresolved: "No testimony was given. The pier remains a rumor.",
      onEraAdvanceIfResolved: "The resolved choice remains in the log and is not forgotten at the era boundary.",
      setsOnDeath: {},
    },
    ifNpcDead: [
      {
        npcId: "p.sur",
        surrogateId: "p.filler_1",
        resolution: "The surrogate reads the same crack and the choice is meaner.",
        dialogue: {
          start: "n0",
          nodes: {
            n0: nodeSay("p.filler_1", "The man who saw it is dead, so I will not romanticize the chalk.", [
              { id: "c1", text: "Record it anyway.", next: "n_end_a" },
              { id: "c2", text: "Let the rain have it.", next: "n_end_b" },
            ]),
            n_end_a: nodeEnd("p.filler_1", "Then the record outlives him, which he may not have wanted.", "br.a2", {}),
            n_end_b: nodeEnd("p.filler_1", "Then the rain is the only witness and the rain is busy.", "br.b2", {}),
          },
        },
      },
    ],
    endingImplications: "A miniature ending implication that is long enough for the shell.",
    validationCases: [
      {
        id: "case.a",
        era: "E0",
        flags: { "flags.era.E0": true },
        character: { background: "crossing", bond: "unbound", ideal: "the_record_holds", flaw: "signs_unread" },
        graph: "main",
        expect: { end: "br.a", flags: { "flags.demo.a": true } },
      },
      {
        id: "case.b",
        era: "E0",
        flags: { "flags.era.E0": true },
        character: { background: "crossing", bond: "unbound", ideal: "the_living_first", flaw: "spares_a_kind_lie" },
        graph: "main",
        expect: { end: "br.b", flags: { "flags.demo.b": true } },
      },
    ],
    nextStageIds: ["st.t1"],
  };
  const stage2 = JSON.parse(JSON.stringify(stage));
  stage2.id = "st.t1";
  stage2.nextStageIds = ["st.t2"];
  stage2.dialogue.nodes.n0.text = "Fourteen years later the jacket is a scar you can still find with a thumb.";
  stage2.dialogue.nodes.n_end_a.text = "You tell the new body what the scar cost in fares and in brothers.";
  stage2.dialogue.nodes.n_end_b.text = "You let the scar be weather and the landing stays a landing.";
  stage2.prerequisites = { all: [{ flag: "flags.demo.a", eq: true }], any: [], none: [] };
  const stage3 = JSON.parse(JSON.stringify(stage));
  stage3.id = "st.t2";
  stage3.nextStageIds = ["st.t3"];
  stage3.dialogue.nodes.n0.text = "The plaque draft has a contractor and a blank where a painter should be.";
  stage3.dialogue.nodes.n_end_a.text = "You put the painter back and the ceremony gets quieter.";
  stage3.dialogue.nodes.n_end_b.text = "You leave the blank and the stone stays polite.";
  stage3.prerequisites = { all: [{ flag: "flags.era.E0", eq: true }], any: [], none: [] };
  const stage4 = JSON.parse(JSON.stringify(stage));
  stage4.id = "st.t3";
  stage4.nextStageIds = [];
  stage4.dialogue.nodes.n0.text = "The new span lands on the same Vermont ground and the sentence is still a choice.";
  stage4.dialogue.nodes.n_end_a.text = "You read the true plaque aloud and the log gains one dull honest line.";
  stage4.dialogue.nodes.n_end_b.text = "You leave the new bridge to its traffic and do not anoint it.";
  stage4.prerequisites = { all: [{ flag: "flags.era.E0", eq: true }], any: [], none: [] };

  // Pad to 64 quests: 1 chain of 4 stages + 56 standalones would be the real pack.
  // For the self-test, quest-count is checked, so include 63 additional minimal valid standalones.
  const quests = [
    {
      id: "q.chain.demo",
      title: "The Bridge That Was Promised",
      kind: "chain",
      locationId: "loc.a",
      eraEligibility: ["E0"],
      summary: "Demo chain used only by the validator self-test.",
      endingImplications: "Demo implications long enough to pass a shell check if applied.",
      chainStages: [stage, stage2, stage3, stage4],
    },
  ];
  // The self-test pack must satisfy global counts OR we only assert targeted codes.
  // Global counts will fail on this mini pack. selfTest() ignores extra codes when
  // checking that a bad fixture CONTAINS a code. The good fixture must be fully clean.
  // Building 64 fully clean quests inline is heavy; instead the good-fixture path
  // below sets a flag consumed by validatePack... we did not add a relax flag.
  // So make the good fixture complete enough.
  return completeMini(people, quests[0], era);
}

function completeMini(people, chain, era) {
  // Rebuild chain titles and 56 standalones quickly with unique texts.
  const titles = [
    "The Bridge That Was Promised",
    "The Orchard Inheritance",
    "The Choir of Unsent Letters",
    "The Last Creemee Stand",
    "The Quarry Workers' Names",
    "The Animal That Remembers",
    "The Flood Book",
    "The Quiet Household",
  ];
  const chains = titles.map((title, idx) => {
    const c = JSON.parse(JSON.stringify(chain));
    c.id = `q.chain.self_${idx}`;
    c.title = title;
    c.chainStages.forEach((s, si) => {
      s.id = `st.self_${idx}_${si}`;
      s.nextStageIds = si < 3 ? [`st.self_${idx}_${si + 1}`] : [];
      // unique-ish text
      for (const [nid, node] of Object.entries(s.dialogue.nodes)) {
        node.text = `${title} stage ${si} node ${nid} speaks a concrete Addison fact number ${idx}-${si}-${nid} about water, names, and work.`;
      }
      s.ifNpcDead[0].dialogue.nodes.n0.text = `${title} alternate ${si} the surrogate speaks because the principal is gone and the choice remains concrete ${idx}.`;
      s.ifNpcDead[0].dialogue.nodes.n_end_a.text = `${title} alternate end A ${si} records the harder kindness without a fetch.`;
      s.ifNpcDead[0].dialogue.nodes.n_end_b.text = `${title} alternate end B ${si} lets the rain keep what the living would not say.`;
      if (si > 0) {
        s.prerequisites = { all: [{ flag: "flags.era.E0", eq: true }], any: [], none: [] };
      }
    });
    // link flags so stage 2 of first chain in the original isn't required
    return c;
  });
  const standalones = [];
  for (let i = 0; i < 56; i += 1) {
    const id = `q.self_${i}`;
    standalones.push({
      id,
      title: `Self standalone ${i}`,
      kind: "standalone",
      locationId: "loc.a",
      eraEligibility: ["E0"],
      characterIds: ["p.sur"],
      summary: `Standalone ${i} is a real choice about a record and a living person in Addison County.`,
      discovery: `You notice problem ${i} because the room is wrong, not because anyone sent you.`,
      prerequisites: { all: [{ flag: "flags.era.E0", eq: true }], any: [], none: [] },
      steps: [
        { id: `${id}.s1`, playerAction: `Look at the specific object ${i} before anyone asks.` },
        { id: `${id}.s2`, playerAction: `Choose what the object ${i} becomes in the record.` },
      ],
      dialogue: {
        start: "n0",
        nodes: {
          n0: nodeSay("p.sur", `Object ${i} is on the table and it contradicts the kind story people prefer in town.`, [
            { id: "c1", text: `Keep the contradiction ${i}.`, next: "n_end_a" },
            { id: "c2", text: `Neaten the contradiction ${i}.`, next: "n_end_b" },
          ]),
          n_end_a: nodeEnd("p.sur", `You keep contradiction ${i} where the next reader will have to slow down.`, "br.a", {}),
          n_end_b: nodeEnd("p.sur", `You neaten contradiction ${i} and the room gets easier and worse.`, "br.b", {}),
        },
      },
      branches: [
        { id: "br.a", summary: "keep" },
        { id: "br.b", summary: "neaten" },
        { id: "br.a2", summary: "alt keep" },
        { id: "br.b2", summary: "alt neaten" },
      ],
      rewards: [{ kind: "record", id: `reward.self.${i}`, detail: `The record now shows choice ${i} in plain words.` }],
      deathTransition: {
        ifEllisDiesMidQuest: `If Ellis dies mid-choice ${i}, the object stays where it was and the next body is not briefed.`,
        flagsCarriedOnDeath: [],
        flagsLostOnDeath: [],
        onEraAdvanceIfUnresolved: `Unresolved ${i} becomes a rumor with no authority.`,
        onEraAdvanceIfResolved: `Resolved ${i} remains a line someone can find.`,
        setsOnDeath: {},
      },
      ifNpcDead: [
        {
          npcId: "p.sur",
          surrogateId: "p.filler_1",
          resolution: `If the speaker is dead, filler finishes choice ${i} more coldly.`,
          dialogue: {
            start: "n0",
            nodes: {
              n0: nodeSay("p.filler_1", `The first speaker is dead so choice ${i} is mine and I am less romantic.`, [
                { id: "c1", text: "Keep it.", next: "n_end_a" },
                { id: "c2", text: "Neaten it.", next: "n_end_b" },
              ]),
              n_end_a: nodeEnd("p.filler_1", `Kept, without the dead person's warmth, choice ${i}.`, "br.a2", {}),
              n_end_b: nodeEnd("p.filler_1", `Neatened, and the dead person is not here to object to ${i}.`, "br.b2", {}),
            },
          },
        },
      ],
      endingImplications: `Choice ${i} tilts the final account slightly toward record or toward ease.`,
      validationCases: [
        {
          id: `case.${id}.a`,
          era: "E0",
          flags: { "flags.era.E0": true },
          character: { background: "intervale", bond: "unbound", ideal: "the_record_holds", flaw: "signs_unread" },
          graph: "main",
          expect: { end: "br.a" },
        },
        {
          id: `case.${id}.b`,
          era: "E0",
          flags: { "flags.era.E0": true },
          character: { background: "intervale", bond: "unbound", ideal: "the_living_first", flaw: "spares_a_kind_lie" },
          graph: "main",
          expect: { end: "br.b" },
        },
      ],
    });
  }
  // Turnover: many fillers die 1960, several born after — fillers are born 1900 die 1960.
  // bornAfterStart may be 0. Add births.
  people.forEach((p, idx) => {
    if (idx > 40 && idx < 55) {
      p.birthYear = 1960;
      p.deathYear = null;
      p.erasPresent = []; // will fail age logic if we check — year 1960 is after E0 1952, before E1 1966 so present E1-E5
      // Don't pre-set wrong erasPresent. Remove erasPresent to skip check... validator checks only if array.
      delete p.erasPresent;
    }
  });
  // spanAll: people born 1900 death 1960 are only E0 (death 1960 >= 1952, not >= 1966). Good.
  // maeve etc erasPresent set to E0 only but computed might include more eras.
  // maeve birth 1924 death 1991: E0, E1, E2. I set erasPresent ["E0"]. That will AGE_LOGIC fail.
  for (const id of ["p.maeve_harrow", "p.cal_voss", "p.ansel_demerritt"]) {
    const p = people.find((x) => x.id === id);
    delete p.erasPresent;
  }
  const flags = {
    "flags.era.E0": "era",
    "flags.era.E1": "era",
    "flags.era.E2": "era",
    "flags.era.E3": "era",
    "flags.era.E4": "era",
    "flags.era.E5": "era",
    "flags.demo.a": "demo",
    "flags.demo.b": "demo",
    "flags.wound.echo": "initial",
  };
  return {
    eras: [
      era,
      { id: "E1", year: 1966, label: "t" },
      { id: "E2", year: 1980, label: "t" },
      { id: "E3", year: 1994, label: "t" },
      { id: "E4", year: 2008, label: "t" },
      { id: "E5", year: 2022, label: "t" },
    ],
    towns: ["Addison"],
    locations: [{ id: "loc.a", town: "Addison", county: "Addison", state: "VT", name: "A", detail: "d" }],
    creatures: [],
    characterCreation: {
      backgrounds: [{ id: "intervale" }, { id: "crossing" }, { id: "mill_race" }, { id: "quarry_cut" }, { id: "survey_desk" }, { id: "roadside" }],
      bonds: [{ id: "unbound" }, { id: "harrow_homestead" }, { id: "voss_crossing" }, { id: "demerritt_wheel" }, { id: "waite_house" }, { id: "pellegrin_cut" }, { id: "lamb_stand" }],
      ideals: [{ id: "the_record_holds" }, { id: "the_living_first" }, { id: "names_aloud" }, { id: "water_has_its_level" }],
      flaws: [{ id: "spares_a_kind_lie" }, { id: "signs_unread" }, { id: "keeps_a_second_copy" }, { id: "cannot_leave_a_gate" }],
    },
    speakers: [
      { id: "speaker.ellis" },
      { id: "speaker.narration" },
      { id: "speaker.voice" },
      { id: "speaker.other_voice" },
    ],
    lineages: [{ id: "lin.a" }],
    people,
    flags,
    mutexGroups: [],
    initialFlags: { "flags.wound.echo": true },
    quests: [...chains, ...standalones],
    integration: {
      status: "PROPOSED_CONTRACT_NOT_AN_EXISTING_RUNTIME",
      warning: "This is not an existing runtime API.",
    },
    enforceSecondLife: false,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (process.argv.includes("--self-test")) {
    selfTest();
  }
  const pack = loadPackFromDisk();
  if (!pack.quests) {
    if (process.argv.includes("--self-test")) process.exit(0);
    console.error("No data/quests.json. Run tools/build.mjs first.");
    process.exit(1);
  }
  const { errors, stats } = validatePack(pack);
  console.log(JSON.stringify(stats, null, 2));
  if (errors.length) {
    for (const e of errors.slice(0, 80)) {
      console.error(`${e.code}\t${e.where}\t${e.message}`);
    }
    if (errors.length > 80) console.error(`... ${errors.length - 80} more`);
    process.exit(1);
  }
  console.log("valid");
}
