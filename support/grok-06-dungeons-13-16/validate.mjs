/**
 * Graph, condition, ending-conflict, and death-recovery checks
 * for the DG13–DG16 packet. Reads the JSON in content/ and systems/.
 *
 *   node support/grok-06-dungeons-13-16/validate.mjs
 *   node support/grok-06-dungeons-13-16/validate.mjs --check
 *
 * --check runs the same assertions and does not rewrite graph.json
 * or VALIDATION_RESULTS.json. npm test uses that path.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TOOL_IDS,
  applyDeath,
  assertRoomGeometry,
  baseState,
  bossEntryNode,
  checkpointFor,
  cloneState,
  endingEligibility,
  evalCond,
  hasFlag,
  reachable,
  runFsm,
  solveMain,
  tileAt,
  STAND,
} from "./author/lib.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const results = [];

function check(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: err.stack || String(err) });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function load(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

const dg13 = load("content/dg13.json");
const dg14 = load("content/dg14.json");
const dg15 = load("content/dg15.json");
const dg16 = load("content/dg16.json");
const epilogue = load("content/epilogue.json");
const endingsDoc = load("content/endings.json");
const eligibility = load("systems/eligibility.json");
const bosses = load("systems/bosses.json");
const climax = load("systems/climax.json");
const witnesses = load("systems/witnesses.json");
const toolsDoc = load("content/tools.json");

const dungeonRooms = [...dg13.rooms, ...dg14.rooms, ...dg15.rooms, ...dg16.rooms];
const byId = Object.fromEntries(dungeonRooms.map((r) => [r.id, r]));
byId[epilogue.id] = epilogue;

const PROFILES = {
  prepared: { farm: "prepared", mill: "prepared", crossing: "prepared", family: "reunited" },
  neglected: { farm: "neglected", mill: "neglected", crossing: "neglected", family: "scattered" },
  opposed: { farm: "opposed", mill: "opposed", crossing: "opposed", family: "estranged" },
  unknown: { farm: "unknown", mill: "unknown", crossing: "unknown", family: "unknown" },
};

function fresh(decisions) {
  const state = baseState(decisions);
  state.machines = bosses;
  state.eligibility = eligibility;
  return state;
}

function playGraph(decisions) {
  return reachable(dungeonRooms, fresh(decisions));
}

const preparedGraph = playGraph(PROFILES.prepared);

check("room counts", () => {
  assert(dg13.rooms.length >= 15, `DG13 ${dg13.rooms.length}`);
  assert(dg14.rooms.length >= 15, `DG14 ${dg14.rooms.length}`);
  assert(dg15.rooms.length >= 15, `DG15 ${dg15.rooms.length}`);
  const env = { fiction: 0, fact: 0, history: 0, imagination: 0 };
  for (const room of dg16.rooms) if (room.environment) env[room.environment] += 1;
  for (const [k, n] of Object.entries(env)) assert(n >= 8, `${k} ${n}`);
  assert(dungeonRooms.length >= 77, `total ${dungeonRooms.length}`);
});

check("geometry, traces, no softlocks in main solutions", () => {
  const problems = [];
  for (const room of [...dungeonRooms, epilogue]) {
    try {
      assertRoomGeometry(room);
    } catch (err) {
      problems.push(err.message);
    }
    if (!room.solutionTrace || room.solutionTrace.length === 0) problems.push(`${room.id} trace`);
    if (!room.persistence?.survivesDeath || !room.persistence?.resetsOnDeath) problems.push(`${room.id} persistence`);
    if (!Array.isArray(room.actors) || !Array.isArray(room.objects)) problems.push(`${room.id} actors/objects`);
    if (room.objects.length === 0) problems.push(`${room.id} needs an object`);
    if (room.id !== epilogue.id) {
      if (room.solution.when.op !== "always") problems.push(`${room.id} main when must be always`);
      if (room.actors.length === 0) problems.push(`${room.id} needs an actor`);
    }
    for (const exit of room.exits) {
      const dest = byId[exit.landing.room];
      if (!dest) {
        problems.push(`${room.id} exit ${exit.id} missing ${exit.landing.room}`);
        continue;
      }
      const tile = tileAt(dest.layout.rows, exit.landing.x, exit.landing.y);
      if (!STAND.has(tile)) {
        problems.push(`${room.id} -> ${dest.id} landing ${exit.landing.x},${exit.landing.y} is '${tile}'`);
      }
    }
  }
  assert(problems.length === 0, problems.join("\n"));
});

check("prepared graph reaches every dungeon room and not the porch", () => {
  for (const room of dungeonRooms) {
    assert(preparedGraph.seen.has(room.id), `unreachable ${room.id}`);
  }
  assert(!preparedGraph.seen.has(epilogue.id), "porch must not be reachable before credits");
  assert(!hasFlag(preparedGraph.state, "campaign.ending"), "walking the dungeons must not commit an ending");
  for (const flag of eligibility.witnessFlags) {
    assert(hasFlag(preparedGraph.state, flag), `witness missing after clear: ${flag}`);
  }
  for (const flag of eligibility.reachedFlags) {
    assert(hasFlag(preparedGraph.state, flag), `reached missing: ${flag}`);
  }
});

for (const [name, decisions] of Object.entries(PROFILES)) {
  check(`graph clears on decision profile ${name}`, () => {
    const graph = name === "prepared" ? preparedGraph : playGraph(decisions);
    assert(graph.seen.size === dungeonRooms.length, `${name} saw ${graph.seen.size}`);
    const elig = endingEligibility(graph.state, eligibility);
    assert(elig.keep && elig.close, `${name} keep/close`);
    assert(elig.refuse === true, `${name} refuse should be true because witnesses are on the critical path`);
    if (name === "prepared") assert(elig.distribute === true, "distribute");
    else assert(elig.distribute === false, `${name} must not distribute`);
  });
}

check("witness doors require the witness flag", () => {
  for (const w of witnesses.witnesses) {
    const room = byId[w.room];
    const exit = room.exits.find((e) => e.id === w.exit);
    assert(exit, `${w.room} missing exit ${w.exit}`);
    assert(exit.requires.includes(w.flag), `${w.room} ${w.exit} does not require ${w.flag}`);
    const produced = room.solution.steps.some((s) => (s.sets || []).some((item) => (item.flag || item) === w.flag));
    assert(produced, `${w.room} main solution does not set ${w.flag}`);
  }
});

check("alternates that match the prepared entry state also solve", () => {
  for (const room of dungeonRooms) {
    for (const alt of room.alternates || []) {
      const state = fresh(PROFILES.prepared);
      state.flags = { ...preparedGraph.entryFlags[room.id] };
      state.machines = bosses;
      state.eligibility = eligibility;
      if (!evalCond(alt.when, state)) continue;
      const fake = { ...room, solution: { id: alt.id, when: { op: "always" }, steps: alt.steps } };
      solveMain(fake, state);
    }
  }
});

check("prepared ferry casting chains into imagination", () => {
  const r11 = byId["DG15.R11"];
  const alt = r11.alternates.find((a) => a.id === "take-casting");
  const state = fresh(PROFILES.prepared);
  state.flags = { ...preparedGraph.entryFlags[r11.id] };
  solveMain({ ...r11, solution: { when: { op: "always" }, steps: alt.steps } }, state);
  assert(state.flags["item.preparedFerryCasting"] === true, "casting");
  const i5 = byId["DG16.I5"];
  const ferry = i5.alternates.find((a) => a.id === "set-casting");
  const st2 = fresh(PROFILES.prepared);
  st2.flags = { ...preparedGraph.entryFlags[i5.id], "item.preparedFerryCasting": true };
  assert(evalCond(ferry.when, st2), "ferry when");
  solveMain({ ...i5, solution: { when: { op: "always" }, steps: ferry.steps } }, st2);
  assert(st2.flags["inst.crossing.imaginedFerrySet"] === true, "ferry set");
});

check("all twelve tool roles appear in a solution, boss script, or ending", () => {
  const used = new Set();
  const eat = (tool) => {
    if (tool) used.add(tool);
  };
  for (const room of dungeonRooms) {
    for (const sol of [room.solution, ...(room.alternates || [])]) {
      for (const s of sol.steps || []) {
        eat(s.tool);
        for (const ev of s.script || []) eat(ev.tool);
      }
    }
  }
  const eventTools = {
    "stamp-seal": "office-seal",
    "latch-chain": "field-chain",
    "place-needle": "marble-needle",
    "ring-bell": "county-bell",
    "hang-coat": "borrowed-coat",
    "enter-embryonic": "sounding-lead",
  };
  for (const ending of endingsDoc.endings) {
    for (const ev of ending.selection) eat(eventTools[ev.event]);
  }
  for (const id of TOOL_IDS) assert(used.has(id), `tool not used: ${id}`);
  assert(toolsDoc.tools.length === 12, "tool doc count");
  assert(toolsDoc.tools.every((t) => t.runtimeToolId === null), "runtime ids must stay pending");
});

check("decision echoes are complete and distinct", () => {
  const expect = {
    farm: ["prepared", "neglected", "opposed", "unknown"],
    mill: ["prepared", "neglected", "opposed", "unknown"],
    crossing: ["prepared", "neglected", "opposed", "unknown"],
    family: ["reunited", "scattered", "estranged", "unknown"],
  };
  let echoes = 0;
  for (const room of dungeonRooms) {
    for (const o of room.objects) {
      if (!o.textByDecision) continue;
      echoes += 1;
      const keys = expect[o.textByDecision.domain];
      assert(keys, `${room.id} ${o.id} bad domain`);
      const vals = keys.map((k) => o.textByDecision[k]);
      assert(vals.every((v) => typeof v === "string" && v.length > 20), `${room.id} ${o.id} short echo`);
      assert(new Set(vals).size === vals.length, `${room.id} ${o.id} duplicate echo`);
    }
  }
  for (const domain of Object.keys(expect)) {
    assert(
      dungeonRooms.some((r) => r.objects.some((o) => o.textByDecision?.domain === domain)),
      `no echo for ${domain}`,
    );
  }
  assert(echoes >= 8, `only ${echoes} echoes`);
});

check("forbidden structures", () => {
  const banned = new Set(["questMarker", "minimap", "procgen", "procedural", "craftRecipe", "partyMember", "gold", "waypoint"]);
  const badWords = /\b(zeus|odin|cthulhu|champ|yggdrasil)\b/i;
  const walk = (value, path) => {
    if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        assert(!banned.has(k), `banned key ${k} at ${path}`);
        if (k === "joinsParty") assert(v === false, `party member at ${path}`);
        walk(v, `${path}.${k}`);
      }
    } else if (typeof value === "string") {
      assert(!badWords.test(value), `second mythology token in ${path}: ${value}`);
    }
  };
  walk({ dg13, dg14, dg15, dg16, endings: endingsDoc }, "packet");
});

function runOrder(puzzle, events) {
  let i = 0;
  let strikes = 0;
  const flags = {};
  for (const e of events) {
    if (e === puzzle.sequence[i]) {
      i += 1;
      if (i === puzzle.sequence.length) flags[puzzle.completeFlag] = true;
    } else if (puzzle.resetOnMismatch) {
      i = 0;
      strikes += 1;
      if (puzzle.deathAt > 0 && strikes >= puzzle.deathAt) return { dead: true, strikes, flags };
    }
  }
  return { dead: false, strikes, flags };
}

check("ordered puzzles accept the posted order and reject a repeat", () => {
  const puzzles = dungeonRooms.filter((r) => r.orderPuzzle).map((r) => r.orderPuzzle);
  assert(puzzles.length >= 3, "expected ordered puzzles");
  for (const puzzle of puzzles) {
    const good = runOrder(puzzle, puzzle.sequence);
    assert(good.flags[puzzle.completeFlag] === true, `${puzzle.id} good`);
    const bad = runOrder(puzzle, [puzzle.sequence[0], puzzle.sequence[0]]);
    assert(!bad.flags[puzzle.completeFlag], `${puzzle.id} bad set the flag`);
    if (puzzle.deathAt > 0) {
      const killed = runOrder(puzzle, Array.from({ length: puzzle.deathAt }, () => "nope"));
      assert(killed.dead, `${puzzle.id} should die`);
    }
  }
});

function scriptOf(machineId, roomId, altId) {
  const room = byId[roomId];
  const sol = altId ? room.alternates.find((a) => a.id === altId) : room.solution;
  const bossStep = sol.steps.find((s) => s.action === "boss");
  return bossStep.script;
}

check("boss machines reach their success terminals", () => {
  for (const [roomId, machineId] of [
    ["DG13.R15", "boss.empty-mayor"],
    ["DG14.R16", "boss.other-shore"],
    ["DG15.R16", "boss.surveyor-of-ellis"],
  ]) {
    const state = fresh(PROFILES.prepared);
    const result = runFsm(bosses[machineId], scriptOf(machineId, roomId), state);
    assert(result.ok, `${machineId} ${result.reason} @ ${result.node}`);
  }
  const mayorAlt = fresh(PROFILES.prepared);
  const alt = runFsm(bosses["boss.empty-mayor"], scriptOf(null, "DG13.R15", "stamp-vacant"), mayorAlt);
  assert(alt.ok && mayorAlt.flags["dg13.mayorSealedVacant"] === true, "seal adjourn");
  const hard = fresh(PROFILES.prepared);
  const hardResult = runFsm(
    bosses["boss.surveyor-of-ellis"],
    scriptOf(null, "DG15.R16", "stamp-then-plumb"),
    hard,
  );
  assert(hardResult.ok, `hard seal ${hardResult.reason}`);
});

check("boss failure scripts die in a named way", () => {
  const mayor = fresh(PROFILES.prepared);
  const m = runFsm(
    bosses["boss.empty-mayor"],
    [
      { event: "leave-dais" },
      { event: "ring", door: 2 },
      { event: "ring", door: 2 },
      { event: "ring", door: 2 },
    ],
    mayor,
  );
  assert(m.node === "STATE_DEATH" && m.success === false, `mayor ${m.node} ${m.reason}`);
  const lake = fresh(PROFILES.prepared);
  const l = runFsm(
    bosses["boss.other-shore"],
    [{ event: "step-false-shore" }, { event: "step-false-shore" }, { event: "step-false-shore" }],
    lake,
  );
  assert(l.node === "STATE_DEATH", `lake ${l.node}`);
  const survey = fresh(PROFILES.prepared);
  const s = runFsm(
    bosses["boss.surveyor-of-ellis"],
    [
      { event: "step-off" },
      { event: "touch-copy" },
      { event: "touch-copy" },
      { event: "touch-copy" },
    ],
    survey,
  );
  assert(s.node === "STATE_DEATH", `survey ${s.node}`);
});

check("boss re-entry uses the last completed phase", () => {
  const flags = {
    "dg13.boss.vacantDone": true,
    "dg13.boss.progress.rollIndex": 2,
    "strike.dg13.boss": 2,
  };
  assert(bossEntryNode(bosses["boss.empty-mayor"], flags) === "PHASE_ROLLCALL", "mayor entry");
  const died = applyDeath(fresh(PROFILES.prepared), {
    checkpoint: { room: "DG13.R14", x: 9, y: 9 },
    embryonic: false,
    anchor: null,
  });
  const st = died.state;
  st.flags["dg13.boss.vacantDone"] = true;
  st.flags["dg13.boss.progress.rollIndex"] = 2;
  st.flags["strike.dg13.boss"] = 2;
  const again = applyDeath(st, { checkpoint: { room: "DG13.R14", x: 9, y: 9 } });
  assert(again.state.flags["dg13.boss.vacantDone"] === true, "phase persists");
  assert(again.state.flags["dg13.boss.progress.rollIndex"] === undefined, "index resets");
  assert(again.state.flags["strike.dg13.boss"] === undefined, "strike resets");
  assert(bossEntryNode(bosses["boss.empty-mayor"], again.state.flags) === "PHASE_ROLLCALL", "reentry");
});

function withReached(decisions, mutate) {
  const state = fresh(decisions);
  for (const f of eligibility.reachedFlags) state.flags[f] = true;
  for (const f of eligibility.witnessFlags) state.flags[f] = true;
  if (mutate) mutate(state);
  return state;
}

function playClimax(state, events) {
  return runFsm(climax, events, state, "CHAMBER");
}

const keepEvents = endingsDoc.endings.find((e) => e.id === "keep").selection.map(({ event, line }) => ({ event, line }));
const closeEvents = endingsDoc.endings.find((e) => e.id === "close").selection.map(({ event, line }) => ({ event, line }));
const distEvents = endingsDoc.endings
  .find((e) => e.id === "distribute")
  .selection.map(({ event, line, which }) => ({ event, line, which }));
const refuseEvents = endingsDoc.endings.find((e) => e.id === "refuse").selection.map(({ event }) => ({ event }));

check("all four endings eligible together, and commits are exclusive", () => {
  const state = withReached(PROFILES.prepared);
  const elig = endingEligibility(state, eligibility);
  assert(elig.keep && elig.close && elig.distribute && elig.refuse, JSON.stringify(elig));
  const keep = cloneState(state);
  const result = playClimax(keep, keepEvents);
  assert(result.ok === false && result.node === "PLAYING", `keep stopped at ${result.node} ${result.reason}`);
  assert(keep.flags["campaign.ending"] === "keep", "keep committed");
  assert(keep.flags["world.seamOpen"] === true && keep.flags["world.holder"] === "ellis", "keep rules");
  const second = playClimax(keep, closeEvents);
  assert(second.ok === false && second.reason === "ending-locked", second.reason);
});

check("close, distribute, and refuse each commit alone", () => {
  const close = withReached(PROFILES.prepared);
  const c = playClimax(close, closeEvents);
  assert(c.node === "PLAYING" && close.flags["campaign.ending"] === "close", c.reason);
  assert(close.flags["world.seamOpen"] === false && close.flags["world.deathIsFinal"] === true, "close rules");
  const dist = withReached(PROFILES.prepared);
  const d = playClimax(dist, distEvents);
  assert(d.node === "PLAYING" && dist.flags["campaign.ending"] === "distribute", `${d.reason} @ ${d.node}`);
  assert(dist.flags["world.holder"] === "institutions", "dist rules");
  const refuse = withReached(PROFILES.prepared);
  const r = playClimax(refuse, refuseEvents);
  assert(r.node === "PLAYING" && refuse.flags["campaign.ending"] === "refuse", `${r.reason} @ ${r.node}`);
  assert(refuse.flags["world.administered"] === false && refuse.flags["world.seamOpen"] === true, "refuse rules");
  assert(refuse.flags["world.fourteenYear"] === false, "refuse stops the clock");
});

check("contradictions fail before a commit", () => {
  const sealed = withReached(PROFILES.prepared);
  const seal = playClimax(sealed, [{ event: "stamp-seal" }, { event: "write-line", line: "keep" }]);
  assert(seal.reason === "conflict.keep-and-seal", seal.reason);
  assert(!hasFlag(sealed, "campaign.ending"), "no commit");
  const confirm = playClimax(sealed, [{ event: "confirm-keep" }]);
  assert(confirm.reason === "conflict.keep-and-seal", confirm.reason);
  const neglected = withReached(PROFILES.neglected);
  const sock = playClimax(neglected, [{ event: "fill-socket", which: "farm" }]);
  assert(sock.reason === "institution-unprepared", sock.reason);
  const noSock = playClimax(withReached(PROFILES.prepared), [{ event: "confirm-distribute" }]);
  assert(noSock.reason === "sockets-incomplete", noSock.reason);
  const cheated = withReached(PROFILES.neglected);
  cheated.flags["socket.farm"] = true;
  cheated.flags["socket.mill"] = true;
  cheated.flags["socket.crossing"] = true;
  cheated.flags["socket.family"] = true;
  const cheat = playClimax(cheated, [
    { event: "ring-bell" },
    { event: "write-line", line: "distribute" },
    { event: "place-needle" },
    { event: "confirm-distribute" },
  ]);
  assert(cheat.reason === "distribute-ineligible", cheat.reason);
  const missing = withReached(PROFILES.prepared, (s) => {
    delete s.flags["disc.erased.foundryClock"];
  });
  const jam = playClimax(missing, [{ event: "jam-nail" }]);
  assert(jam.reason === "refuse-ineligible", jam.reason);
  const noJam = playClimax(withReached(PROFILES.prepared), [{ event: "cross-lintel" }]);
  assert(noJam.reason === "hinge-not-jammed", noJam.reason);
  const junk = withReached(PROFILES.prepared, (s) => {
    for (const f of eligibility.witnessFlags) delete s.flags[f];
    for (let i = 0; i < 40; i++) s.flags[`pickup.${i}`] = true;
  });
  assert(endingEligibility(junk, eligibility).refuse === false, "junk must not refuse");
  assert(endingEligibility(junk, eligibility).keep === true, "junk can still keep");
});

check("each single missing institution or witness blocks only its ending", () => {
  for (const domain of ["farm", "mill", "crossing", "family"]) {
    const state = withReached(PROFILES.prepared);
    state.decisions[domain] = domain === "family" ? "scattered" : "neglected";
    const elig = endingEligibility(state, eligibility);
    assert(elig.distribute === false, domain);
    assert(elig.keep && elig.close && elig.refuse, domain);
  }
  for (const flag of eligibility.witnessFlags) {
    const state = withReached(PROFILES.prepared);
    delete state.flags[flag];
    const elig = endingEligibility(state, eligibility);
    assert(elig.refuse === false, flag);
    assert(elig.keep && elig.close && elig.distribute, flag);
  }
  const early = fresh(PROFILES.prepared);
  const elig = endingEligibility(early, eligibility);
  assert(!elig.keep && !elig.close && !elig.distribute && !elig.refuse, "heart not reached");
});

check("ending sequences play through vignettes, credits, and the terminal save", () => {
  for (const ending of endingsDoc.endings) {
    const state = withReached(PROFILES.prepared);
    const events = [
      ...ending.selection.map(({ event, line, which }) => ({ event, line, which })),
      ...Array.from({ length: 8 }, () => ({ event: "advance-vignette" })),
      { event: "begin-credits" },
      { event: "finish-credits" },
    ];
    const result = playClimax(state, events);
    assert(result.ok && result.node === "TERMINAL", `${ending.id} ${result.reason} @ ${result.node}`);
    assert(state.flags["campaign.ending"] === ending.id, ending.id);
    assert(state.flags["meta.terminal"] === true, "terminal");
    assert(state.flags["meta.deathEnabled"] === false, "death off");
    assert(state.flags["meta.lecternLocked"] === true, "lectern");
    assert(state.flags["meta.dungeonReentry"] === "museum", "museum");
    assert(state.flags["meta.bossesRespawn"] === false, "bosses");
    assert(state.spawn.room === "EPILOGUE.PORCH", "porch");
    assert(state.flags["vignette.index"] === 8, "vignettes");
    const early = withReached(PROFILES.prepared);
    const tooSoon = playClimax(early, [
      ...ending.selection.map(({ event, line, which }) => ({ event, line, which })),
      { event: "begin-credits" },
    ]);
    assert(tooSoon.reason === "vignettes-unfinished", `${ending.id} ${tooSoon.reason}`);
  }
});

check("vignette matrix covers four decisions and eight scenes", () => {
  const domains = ["farm", "mill", "crossing", "family"];
  const keys = {
    farm: ["prepared", "neglected", "opposed", "unknown"],
    mill: ["prepared", "neglected", "opposed", "unknown"],
    crossing: ["prepared", "neglected", "opposed", "unknown"],
    family: ["reunited", "scattered", "estranged", "unknown"],
  };
  const finals = new Set();
  for (const ending of endingsDoc.endings) {
    assert(ending.vignettes.length >= 6, ending.id);
    assert(ending.vignettes.length === 8, `${ending.id} expected 8`);
    for (const domain of domains) {
      const v = ending.vignettes.find((item) => item.domain === domain);
      assert(v, `${ending.id} missing ${domain}`);
      const vals = keys[domain].map((k) => v.observe[k]);
      assert(vals.every((t) => typeof t === "string" && t.length > 30), `${ending.id} ${domain} text`);
      assert(new Set(vals).size === 4, `${ending.id} ${domain} not distinct`);
      assert(v.action && v.action.input && v.action.result, `${ending.id} ${domain} action`);
    }
    for (const v of ending.vignettes) {
      assert(v.spawn && v.title, v.id);
      if (!v.domain) assert(typeof v.observe === "string" && v.observe.length > 30, v.id);
    }
    assert(ending.credits.beats.length >= 4, ending.id);
    finals.add(ending.credits.beats.at(-1).text);
    assert(ending.postCompletion.loadSpawn.room === "EPILOGUE.PORCH", ending.id);
    assert(ending.postCompletion.newGame === "separate-slot-only", ending.id);
  }
  assert(finals.size === 4, "credit cards must differ");
});

check("death in an environment returns to that environment checkpoint", () => {
  const state = fresh(PROFILES.prepared);
  state.flags = { ...preparedGraph.entryFlags["DG16.F5"] };
  state.visitOrder = preparedGraph.state.visitOrder.slice();
  const beforeYear = state.flags["meta.year"];
  const beforeBody = state.flags["body.id"];
  const cp = checkpointFor(byId, state.visitOrder, "DG16.F5");
  assert(cp.room === "DG16.F1", `checkpoint ${cp.room}`);
  const died = applyDeath(state, { checkpoint: cp, embryonic: false, anchor: null });
  assert(died.ok, died.reason);
  assert(died.state.flags["meta.year"] === beforeYear + 14, "year");
  assert(died.state.flags["body.id"] !== beforeBody, "body");
  assert(died.state.spawn.room === "DG16.F1", "spawn");
  assert(died.state.flags["dg16.fiction.complete"] !== true, "must not complete fiction");
  assert(died.state.flags["disc.quiet.windowUnderIce"] === true, "earlier witness remains");
  assert(died.state.flags["dg16.fact.complete"] !== true, "other env untouched");
  assert(died.state.flags["meta.embryonic"] === false, "form cleared");
});

check("embryonic death with and without an anchor", () => {
  const anchored = fresh(PROFILES.prepared);
  anchored.flags["meta.embryonic"] = true;
  const a = applyDeath(anchored, {
    embryonic: true,
    anchor: "DG14.R04:bank-peg",
    checkpoint: { room: "DG14.R01", x: 9, y: 9 },
  });
  assert(a.state.flags["meta.embryonic"] === false, "form off");
  assert(a.state.flags["anchor.previousCoat.1"] === "DG14.R04:bank-peg", "coat left");
  assert(a.state.spawn.room === "DG14.R01", "checkpoint not the void");
  const loose = fresh(PROFILES.prepared);
  loose.flags["meta.embryonic"] = true;
  const b = applyDeath(loose, { embryonic: true, anchor: null, checkpoint: { room: "DG16.I1", x: 9, y: 9 } });
  assert(b.state.flags["anchor.previousCoat.1"] === undefined, "no coat invented");
  assert(b.state.spawn.room === "DG16.I1", "region checkpoint");
});

check("death in the seam before commit keeps sockets and drops the lectern line", () => {
  const state = withReached(PROFILES.prepared);
  playClimax(state, [
    { event: "fill-socket", which: "farm" },
    { event: "fill-socket", which: "mill" },
    { event: "fill-socket", which: "crossing" },
    { event: "fill-socket", which: "family" },
    { event: "ring-bell" },
    { event: "write-line", line: "distribute" },
    { event: "hang-coat" },
  ]);
  assert(state.flags["staged.line"] === "distribute", "line staged");
  assert(state.flags["staged.coatOnSeamPeg"] === "current", "coat");
  const died = applyDeath(state, {
    checkpoint: { room: "DG16.SEAM", x: 9, y: 8 },
    duringVignette: false,
  });
  assert(!hasFlag(died.state, "campaign.ending"), "no ending");
  assert(died.state.flags["staged.line"] === undefined, "line cleared");
  assert(died.state.flags["socket.farm"] === true && died.state.flags["staged.bell"] === true, "physical prep remains");
  assert(died.state.flags["staged.coatOnSeamPeg"] === "previous", "coat became previous");
  assert(died.state.flags["meta.year"] === 1884 + 14, "year");
  const retry = playClimax(died.state, [
    { event: "retrieve-coat" },
    { event: "write-line", line: "distribute" },
    { event: "place-needle" },
    { event: "confirm-distribute" },
  ]);
  assert(retry.node === "PLAYING", `${retry.reason}`);
});

check("previous coat cannot confirm keep until the current coat is hung", () => {
  const state = withReached(PROFILES.prepared);
  state.flags["staged.coatOnSeamPeg"] = "previous";
  state.flags["staged.line"] = "keep";
  state.flags["staged.needleAtCrack"] = true;
  const blocked = playClimax(state, [{ event: "confirm-keep" }]);
  assert(blocked.reason === "peg-holds-a-previous-body", blocked.reason);
  const fixed = playClimax(state, [{ event: "hang-coat" }, { event: "confirm-keep" }]);
  assert(fixed.node === "PLAYING", fixed.reason);
});

check("death after commit resumes the vignette and does not change the ending", () => {
  const state = withReached(PROFILES.prepared);
  playClimax(state, [...keepEvents, { event: "advance-vignette" }, { event: "advance-vignette" }]);
  assert(state.flags["vignette.index"] === 2, "index");
  const died = applyDeath(state, {
    duringVignette: true,
    checkpoint: { room: "DG16.SEAM", x: 9, y: 8 },
  });
  assert(died.state.flags["campaign.ending"] === "keep", "ending sticks");
  assert(died.state.flags["vignette.index"] === 2, "same vignette");
  assert(died.state.spawn.room === "DG16.SEAM", "back to seam");
  assert(died.state.flags["meta.year"] === 1884 + 14, "year still moves before credits");
  const done = cloneState(died.state);
  const rest = Array.from({ length: 6 }, () => ({ event: "advance-vignette" }));
  const fin = runFsm(climax, [...rest, { event: "begin-credits" }, { event: "finish-credits" }], done, "PLAYING");
  assert(fin.ok, fin.reason);
  const year = done.flags["meta.year"];
  const after = applyDeath(done, { checkpoint: { room: "EPILOGUE.PORCH", x: 9, y: 7 } });
  assert(after.ok === false && after.reason === "death-disabled-terminal", after.reason);
  assert(after.state.flags["meta.year"] === year, "year frozen");
  assert(after.state.flags["campaign.ending"] === "keep", "ending frozen");
});

check("two deaths do not skip a checkpoint or invent a witness", () => {
  const state = fresh(PROFILES.unknown);
  state.flags = { ...preparedGraph.entryFlags["DG13.R03"] };
  const discs = Object.keys(state.flags).filter((k) => k.startsWith("disc."));
  const cp = { room: "DG13.R01", x: 9, y: 9 };
  const once = applyDeath(state, { checkpoint: cp });
  const twice = applyDeath(once.state, { checkpoint: cp });
  assert(twice.state.flags["meta.deathCount"] === 2, "count");
  assert(twice.state.flags["meta.year"] === 1884 + 28, "years");
  assert(twice.state.spawn.room === "DG13.R01", "still the road");
  const after = Object.keys(twice.state.flags).filter((k) => k.startsWith("disc."));
  assert(after.length === discs.length, "no new witness");
});

check("early dungeon death does not dump you into the vein", () => {
  const cp = checkpointFor(byId, preparedGraph.state.visitOrder, "DG13.R08");
  assert(cp.room === "DG13.R01", cp.room);
  const late = checkpointFor(byId, preparedGraph.state.visitOrder, "DG13.R15");
  assert(late.room === "DG13.R14", late.room);
  const env = checkpointFor(byId, preparedGraph.state.visitOrder, "DG16.H6");
  assert(env.room === "DG16.H1", env.room);
  const seam = checkpointFor(byId, preparedGraph.state.visitOrder, "DG16.SEAM");
  assert(seam.room === "DG16.SEAM", seam.room);
});

const failed = results.filter((r) => !r.ok);
const summary = {
  passed: results.length - failed.length,
  failed: failed.length,
  rooms: dungeonRooms.length,
  byDungeon: {
    DG13: dg13.rooms.length,
    DG14: dg14.rooms.length,
    DG15: dg15.rooms.length,
    DG16: dg16.rooms.length,
  },
  environments: {
    fiction: dg16.rooms.filter((r) => r.environment === "fiction").length,
    fact: dg16.rooms.filter((r) => r.environment === "fact").length,
    history: dg16.rooms.filter((r) => r.environment === "history").length,
    imagination: dg16.rooms.filter((r) => r.environment === "imagination").length,
  },
  endings: endingsDoc.endings.map((e) => e.id),
  graphEdges: preparedGraph.edges.length,
  results,
};

const checkOnly = process.argv.includes("--check");
if (!checkOnly) {
  writeFileSync(join(root, "content", "graph.json"), JSON.stringify({ edges: preparedGraph.edges, reached: [...preparedGraph.seen] }, null, 2) + "\n");
  writeFileSync(join(root, "VALIDATION_RESULTS.json"), JSON.stringify(summary, null, 2) + "\n");
}

for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}`);
  if (!r.ok) console.log(r.error);
}
console.log(`\n${summary.passed} passed, ${summary.failed} failed, ${summary.rooms} rooms`);
process.exit(failed.length === 0 ? 0 : 1);
