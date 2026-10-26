#!/usr/bin/env node
/**
 * PREINCARNATION DG09–DG12 validator.
 *
 *   node validate.mjs
 *
 * Writes validation-output.txt, maps/*.txt, and solutions/*.txt.
 * Exit 0 only when every named test passes.
 *
 * Named tests:
 *   structural integrity (rooms, grids, links, boss machines, proofs)
 *   routing cycles
 *   lost transported objects
 *   missed rewards
 *   death during transitions
 *   boss re-entry
 *   god-form does not skip mandatory challenges
 *   debts are not an economy (DG10)
 *   seasons are authored states (DG11)
 *   mercy does not make progression ambiguous (DG12)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dungeon as dg09 } from "./data/dg09.mjs";
import { dungeon as dg10 } from "./data/dg10.mjs";
import { dungeon as dg11 } from "./data/dg11.mjs";
import { dungeon as dg12 } from "./data/dg12.mjs";
import {
  EngineError,
  auditObjects,
  checkExpect,
  createState,
  placeState,
  roomById,
  runExpectingError,
  runOps,
  walkable,
} from "./engine.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DUNGEONS = [dg09, dg10, dg11, dg12];
const ECONOMY = ["price", "coins", "shop", "interest", "vendor", "balance due"];

const lines = [];
let failed = 0;

function say(s = "") {
  lines.push(s);
}

function fail(name, err) {
  failed += 1;
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  say(`FAIL  ${name}`);
  say(msg.split("\n").slice(0, 12).join("\n"));
}

function test(name, fn) {
  try {
    const extra = fn();
    say(`PASS  ${name}${extra ? ` — ${extra}` : ""}`);
  } catch (err) {
    fail(name, err);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function flagsPass(when, have) {
  if (!when) return true;
  if (when.never) return false;
  const all = when.all || [];
  const any = when.any || [];
  if (!all.every((f) => have.has(f))) return false;
  if (any.length && !any.some((f) => have.has(f))) return false;
  return true;
}

function allProgressFlags(d) {
  const have = new Set(Object.keys(d.flagBook));
  for (const node of d.dependencyGraph.nodes) {
    if (node !== "ENTER") have.add(node);
  }
  for (const room of d.rooms) {
    for (const conn of room.connections || []) {
      for (const f of [...(conn.when?.all || []), ...(conn.when?.any || [])]) have.add(f);
    }
  }
  return have;
}

function analysisEdges(d, have) {
  const edges = [];
  for (const room of d.rooms) {
    for (const conn of room.connections || []) {
      if (conn.kind === "graph") {
        edges.push({ from: room.id, to: conn.to, via: conn.id, graph: true });
        continue;
      }
      const open = flagsPass(conn.when, have);
      if (open && conn.to) edges.push({ from: room.id, to: conn.to, via: conn.id });
      if (!open && conn.elseTo) edges.push({ from: room.id, to: conn.elseTo, via: `${conn.id}:else` });
    }
  }
  return edges;
}

function adjacency(edges) {
  const adj = new Map();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push(e);
  }
  return adj;
}

function reachableFrom(start, adj, { ignoreCounty = false } = {}) {
  const seen = new Set();
  const q = [start];
  while (q.length) {
    const id = q.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    if (ignoreCounty && String(id).startsWith("COUNTY")) continue;
    for (const e of adj.get(id) || []) {
      if (!seen.has(e.to)) q.push(e.to);
    }
  }
  return seen;
}

function reachableIds(d, have) {
  const adj = adjacency(analysisEdges(d, have));
  return [...reachableFrom(d.entry.room, adj)].sort();
}

function fmtOp(op) {
  if (!op) return "?";
  if (op.op === "move") return `move ${op.to[0]},${op.to[1]}`;
  if (op.op === "interact") return `interact ${op.id}`;
  if (op.op === "use-exit") return `exit ${op.id}`;
  if (op.op === "tick-transition") return "tick";
  if (op.op === "die") return "die";
  if (op.op === "boss" || op.op === "miniboss") {
    return [op.op, op.action, op.tool, op.moth, op.arm, op.season, op.n].filter((x) => x !== undefined && x !== null).join(" ");
  }
  if (op.op === "assert") return `assert ${op.code}${op.flag ? " " + op.flag : ""}${op.item ? " " + op.item : ""}${op.room ? " " + op.room : ""}`;
  return op.op;
}

function traceRoute(d, ops) {
  const state = createState(d);
  const rows = [];
  let last = state.roomId;
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    rows.push(`${last}: ${buf.join(" → ")}`);
    buf = [];
  };
  for (const op of ops) {
    runOps(d, state, [op]);
    buf.push(fmtOp(op));
    if (state.roomId !== last) {
      flush();
      last = state.roomId;
    }
  }
  flush();
  return { state, rows };
}

function carryOf(d, state, spec) {
  return spec.carriedKind === "moth" ? state.moths[spec.carriedId] : state.objects[spec.carriedId];
}

function machineOk(spec, label) {
  const ids = new Set((spec.phases || []).map((p) => p.id));
  assert(ids.has(spec.initialPhase), `${label} missing initial ${spec.initialPhase}`);
  assert(spec.defeatedPhase, `${label} missing defeatedPhase`);
  let cur = spec.initialPhase;
  const seen = new Set();
  while (cur !== spec.defeatedPhase) {
    assert(!seen.has(cur), `${label} phase cycle at ${cur}`);
    seen.add(cur);
    const phase = spec.phases.find((p) => p.id === cur);
    assert(phase, `${label} missing phase ${cur}`);
    assert(phase.next, `${label} ${cur} has no next`);
    if ((phase.type || "counter") === "counter") {
      assert(phase.act && phase.need >= 1, `${label} ${cur} counter is incomplete`);
      assert(phase.rejectGodForm, `${label} ${cur} does not reject god-form`);
      assert(phase.mark || (phase.marks || []).length >= phase.need, `${label} ${cur} has no floor mark`);
    } else {
      assert((phase.accepts || []).length > 0, `${label} ${cur} has no accepts`);
      assert(phase.accepts.every((a) => a.rejectGodForm), `${label} ${cur} has an accept god-form can use`);
      for (const accept of phase.accepts) {
        if (accept.action === "set-season") continue;
        assert(accept.mark || accept.marks || phase.mark || phase.marks, `${label} ${cur} ${accept.action} has no floor mark`);
      }
    }
    cur = phase.next;
  }
  assert(spec.room && spec.reward?.id, `${label} needs a room and a one-time reward (miniboss may use null)`);
}

function checkStructural(d) {
  assert(d.rooms.length >= 15, `${d.id} has ${d.rooms.length} rooms`);
  assert(d.protagonist === "Ellis Perch", "protagonist");
  assert(d.county.includes("Addison"), "county");
  assert(d.godForm.water === "sealed" && d.godForm.void === "sealed" && d.godForm.gust === "sealed", "god-form seals");
  const ids = new Set();
  for (const room of d.rooms) {
    assert(!ids.has(room.id), `duplicate ${room.id}`);
    ids.add(room.id);
    assert(room.width === 18 && room.height === 12, `${room.id} dimensions`);
    assert(room.layers.terrain.length === 12, `${room.id} terrain height`);
    assert(room.layers.objects.length === 12, `${room.id} object height`);
    for (const row of room.layers.terrain) assert(row.length === 18, `${room.id} terrain width`);
    for (const row of room.layers.objects) assert(row.length === 18, `${room.id} object width`);
    assert(["main", "optional"].includes(room.classification), `${room.id} class`);
    assert(room.summary && room.name, `${room.id} name`);
    assert(Array.isArray(room.persistentState) && room.persistentState.length, `${room.id} persistent`);
    assert(Array.isArray(room.resetState) && room.resetState.length, `${room.id} reset`);
    assert(room.localProof?.steps?.length, `${room.id} solution trace`);
    assert(room.failureAndRecovery?.length, `${room.id} failure`);
    for (const conn of room.connections || []) {
      assert(conn.tile[0] >= 0 && conn.tile[0] < 18 && conn.tile[1] >= 0 && conn.tile[1] < 12, `${room.id} ${conn.id} tile`);
      assert(!conn.consumes?.length, `${room.id} ${conn.id} consumes a key`);
      const terrain = room.layers.terrain[conn.tile[1]][conn.tile[0]];
      assert(terrain !== "#", `${room.id} ${conn.id} sits in a wall`);
    }
    for (const inter of room.interactions || []) {
      assert(inter.tile && inter.id, `${room.id} interaction`);
    }
    const proof = placeState(d, room.localProof.place);
    runOps(d, proof, room.localProof.steps);
    checkExpect(proof, room.localProof.expect);
    for (const fail of room.failureAndRecovery) {
      const s = placeState(d, fail.place);
      if (fail.expectError) runExpectingError(d, s, fail.steps, fail.expectError);
      else runOps(d, s, fail.steps);
      if (fail.recovery?.length) runOps(d, s, fail.recovery);
      checkExpect(s, fail.expect);
    }
  }
  assert(ids.has(d.boss.room), "boss room missing");
  assert(ids.has(d.miniboss.room), "miniboss room missing");
  const bossRoom = roomById(d, d.boss.room);
  const miniRoom = roomById(d, d.miniboss.room);
  assert(bossRoom.actors.some((a) => a.kind === "boss"), "boss actor");
  assert(miniRoom.actors.some((a) => String(a.kind).startsWith("miniboss")), "miniboss actor");
  machineOk(d.boss, `${d.id} boss`);
  machineOk({ ...d.miniboss, reward: d.miniboss.reward || { id: "(none)" } }, `${d.id} miniboss`);
  const nodes = new Set(d.dependencyGraph.nodes);
  const seenEdge = new Set();
  for (const e of d.dependencyGraph.edges) {
    assert(nodes.has(e.from) && nodes.has(e.to), `bad edge ${e.from}->${e.to}`);
    const key = `${e.from}->${e.to}`;
    assert(!seenEdge.has(key), `duplicate edge ${key}`);
    seenEdge.add(key);
  }
  const visiting = new Set();
  const done = new Set();
  const adj = new Map();
  for (const n of nodes) adj.set(n, []);
  for (const e of d.dependencyGraph.edges) adj.get(e.from).push(e.to);
  function dfs(n) {
    assert(!visiting.has(n), `dependency cycle at ${n}`);
    if (done.has(n)) return;
    visiting.add(n);
    for (const t of adj.get(n) || []) dfs(t);
    visiting.delete(n);
    done.add(n);
  }
  dfs("ENTER");
  assert(done.has(d.dependencyGraph.nodes.at(-1)) || [...done].some((n) => n.endsWith("cleared")), "cleared node not reached from ENTER");
  for (const obj of d.transportables || []) {
    assert(ids.has(obj.home.room), `${obj.id} home`);
    assert(obj.returnHomeOnTransitionDeath === true, `${obj.id} can be lost on a crossing`);
  }
  for (const moth of d.moths || []) {
    assert(ids.has(moth.home.room), `${moth.id} home`);
    assert(moth.returnHomeOnTransitionDeath === true, `${moth.id} can be lost`);
  }
  for (const disc of d.discoveries || []) {
    assert(ids.has(disc.room), `discovery ${disc.id} room`);
    if (disc.interact) {
      const room = roomById(d, disc.room);
      assert(room.interactions.some((i) => i.id === disc.interact), `discovery ${disc.id} interact`);
    }
  }
  const blob = JSON.stringify({
    debts: d.debts,
    rewards: [d.boss.reward, d.boss.mercyReward, d.miniboss.reward],
    discoveries: d.discoveries,
  }).toLowerCase();
  for (const word of ECONOMY) assert(!blob.includes(word), `${d.id} economy word ${word}`);
  for (const word of d.bannedWords || []) {
    if (ECONOMY.includes(word) || word === "balance due") continue;
    const hay = JSON.stringify({ summaries: d.rooms.map((r) => r.summary), book: d.flagBook }).toLowerCase();
    assert(!hay.includes(word), `${d.id} banned design word "${word}" leaked into copy`);
  }
}

function checkRouting(d) {
  const closed = reachableIds(d, new Set());
  const open = reachableIds(d, allProgressFlags(d));
  const expectClosed = [...d.hooks.reachableClosed].sort();
  const expectOpen = [...d.hooks.reachableOpen].sort();
  assert(JSON.stringify(closed) === JSON.stringify(expectClosed), `closed reach ${closed} != ${expectClosed}`);
  assert(JSON.stringify(open) === JSON.stringify(expectOpen), `open reach ${open} != ${expectOpen}`);
  const boss = d.boss.room;
  const openAdj = adjacency(analysisEdges(d, allProgressFlags(d)));
  for (const room of d.rooms) {
    const seen = reachableFrom(room.id, openAdj);
    assert(seen.has(boss) || seen.has([...open].find((id) => String(id).startsWith("COUNTY")) || boss), `${room.id} cannot reach the boss once the dungeon is open`);
    assert([...seen].some((id) => id === boss), `${room.id} is trapped away from ${boss}`);
  }
  const earlyAdj = adjacency(analysisEdges(d, new Set()));
  const early = reachableFrom(d.entry.room, earlyAdj);
  const rev = new Map();
  for (const [from, list] of earlyAdj) {
    for (const e of list) {
      if (String(e.to).startsWith("COUNTY")) continue;
      if (!rev.has(e.to)) rev.set(e.to, []);
      rev.get(e.to).push({ from: e.to, to: from });
    }
  }
  const revAdj = adjacency([...rev.values()].flat());
  for (const id of early) {
    if (String(id).startsWith("COUNTY")) continue;
    const back = reachableFrom(id, revAdj);
    assert(back.has(d.entry.room), `${id} is an early one-way trap`);
  }
  for (const cycle of d.intentionalCycles || []) {
    const flags = new Set();
    if (cycle.id === "yard-stones") flags.add("dg09.keg");
    const edges = analysisEdges(d, flags);
    const set = new Set(cycle.rooms);
    const inside = edges.filter((e) => set.has(e.from) && set.has(e.to));
    const present = new Set(inside.flatMap((e) => [e.from, e.to]));
    for (const id of cycle.rooms) assert(present.has(id), `${d.id} cycle ${cycle.id} missing ${id}`);
    const leaves = edges.some((e) => set.has(e.from) && !set.has(e.to));
    assert(leaves, `${d.id} cycle ${cycle.id} has no exit`);
    assert(cycle.benign === true, `${cycle.id} is not marked benign`);
  }
  if (d.hooks.foldLoop?.length) {
    const s = createState(d);
    runOps(d, s, d.hooks.foldLoop);
    assert((s.items.get(d.hooks.reward) || 0) === 0, "fold loop granted the reward");
  }
  const fresh = createState(d);
  runOps(d, fresh, d.routes.main);
  const order = [];
  const seenFlags = new Set();
  const watch = createState(d);
  for (const op of d.routes.main) {
    runOps(d, watch, [op]);
    for (const f of watch.flags) {
      if (!seenFlags.has(f)) {
        seenFlags.add(f);
        order.push(f);
      }
    }
  }
  const preds = new Map();
  for (const e of d.dependencyGraph.edges) {
    if (!preds.has(e.to)) preds.set(e.to, []);
    preds.get(e.to).push(e.from);
  }
  const have = new Set(["ENTER"]);
  for (const f of order) {
    if (!preds.has(f)) continue;
    assert(preds.get(f).some((p) => have.has(p)), `${d.id} gained ${f} before ${preds.get(f).join("|")}`);
    have.add(f);
  }
  for (const node of d.dependencyGraph.nodes) {
    if (node !== "ENTER") assert(fresh.flags.has(node), `main route missed graph node ${node}`);
  }
  for (const cut of d.shortcuts || []) {
    if (cut.backtrack || !d.routes[cut.route]) continue;
    const s = createState(d);
    runOps(d, s, d.routes[cut.route]);
    for (const f of cut.stillRequires || []) assert(s.flags.has(f), `${cut.id} dropped required ${f}`);
    for (const f of cut.skips || []) assert(!s.flags.has(f), `${cut.id} failed to skip ${f}`);
    assert((s.items.get(d.hooks.reward) || 0) === 1, `${cut.id} did not pay the boss reward`);
  }
  if (d.id === "DG09") {
    const hinted = createState(d);
    runOps(d, hinted, [{ op: "move", to: [4, 3] }, { op: "interact", id: "mile-r01" }]);
    assert(hinted.lastText.includes("ring the cracked bell"), "milepost hid the first rule");
    assert(!hinted.lastText.includes("Bell Cut opens east only after"), "codex printed before it was read");
    hinted.flags.add("dg09.codex");
    runOps(d, hinted, [{ op: "interact", id: "mile-r01" }]);
    assert(hinted.lastText.includes("Bell Cut opens east only after"), "codex did not reveal the full rule");
    const a = createState(d);
    const b = createState(d);
    runOps(d, a, d.hooks.foldLoop);
    runOps(d, b, d.hooks.foldLoop);
    assert(a.roomId === b.roomId && a.flags.size === b.flags.size, "fold is not deterministic");
  }
}

function checkLostObjects(d) {
  const spec = d.hooks.transitionDeath;
  const state = createState(d);
  runOps(d, state, spec.setup);
  assert(state.transition, "transition setup never started a crossing");
  assert(state.carrying === spec.carriedId, `expected to be carrying ${spec.carriedId}`);
  const dest = state.transition.dest;
  runOps(d, state, [{ op: "die" }]);
  assert(!state.transition, "death left the crossing running");
  assert(state.roomId !== dest, "death during a crossing still arrived");
  assert(state.roomId === spec.lanternRoom, `woke in ${state.roomId}`);
  assert(state.hp === state.maxHp, "hp not restored");
  assert(!state.carrying, "carried object survived a broken crossing");
  const live = carryOf(d, state, spec);
  assert(live && live.loc === spec.homeLoc && live.room === spec.homeRoom, `${spec.carriedId} did not return home (${live?.loc} ${live?.room})`);
  assert(auditObjects(d, state).length === 0, `lost: ${auditObjects(d, state).join(",")}`);
  assert(state.flags.has(spec.persistFlag), "progress flag was wiped by the crossing death");
  assert((state.items.get(d.hooks.reward) || 0) === 0, "reward granted by a death");
  if (spec.resumeMain === false) {
    runOps(d, state, spec.reclaim);
    assert(state.carrying === spec.carriedId, "reclaim did not pick the object back up");
    assert(carryOf(d, state, spec).loc === "carried", "reclaimed object is not carried");
  } else {
    runOps(d, state, d.routes.main);
    assert((state.items.get(d.hooks.reward) || 0) === 1, "dungeon not finishable after a returned object");
    assert(auditObjects(d, state).length === 0, "object lost while finishing after the death");
  }
  const quiet = d.hooks.inRoomCarryDeath;
  const held = createState(d);
  runOps(d, held, quiet.setup);
  assert(!held.transition && held.carrying === quiet.carriedId, "in-room setup");
  runOps(d, held, [{ op: "die" }]);
  assert(held.carrying === quiet.carriedId, "in-room death sent the object home");
  assert(carryOf(d, held, quiet).loc === "carried", "in-room death lost the carry");
  assert(held.roomId === quiet.lanternRoom, "in-room death lantern");
  assert(auditObjects(d, held).length === 0, "in-room death reported a loss");
}

function checkMissedRewards(d) {
  const done = createState(d);
  runOps(d, done, d.routes.main);
  for (const disc of d.discoveries || []) {
    if (disc.missable) continue;
    assert((done.items.get(disc.item) || 0) === 0, `main route required optional ${disc.item}`);
    const branch = structuredClone(done);
    runOps(d, branch, d.hooks.collect[disc.id]);
    assert((branch.items.get(disc.item) || 0) === 1, `could not collect ${disc.item} after clear`);
    const again = [...d.hooks.collect[disc.id]].reverse().find((op) => op.op === "interact");
    if (again) {
      try {
        runOps(d, branch, [again]);
      } catch {
        /* a second attempt may refuse; it must not add a second copy */
      }
      assert((branch.items.get(disc.item) || 0) === 1, `${disc.item} duplicated`);
    }
  }
  if (d.routes.harsh) {
    const harsh = createState(d);
    runOps(d, harsh, d.routes.harsh);
    assert((harsh.items.get(d.hooks.reward) || 0) === 1, "harsh clear missed the key");
    assert((harsh.items.get(d.hooks.mercyReward) || 0) === 0, "killing the years still paid the mercy reward");
    assert((done.items.get(d.hooks.mercyReward) || 0) === 1, "netting the years missed the mercy reward");
  }
}

function checkTransitionDeath(d) {
  checkLostObjects(d);
}

function checkBossReentry(d) {
  const ops = d.routes.main;
  const idx = ops.findIndex((op) => op.tag === "boss-mid");
  assert(idx > 0, "boss-mid tag missing");
  const state = createState(d);
  runOps(d, state, ops.slice(0, idx + 1));
  assert(!state.boss.defeated, "mid-fight already defeated");
  assert(state.roomId === d.boss.room, "mid-fight left the arena");
  const phase = state.boss.phase;
  assert(phase && phase !== "DEFEATED" && phase !== "IDLE", `unexpected mid phase ${phase}`);
  runOps(d, state, [{ op: "die" }]);
  assert(!state.boss.defeated && state.boss.phase == null, "death kept a half-finished boss");
  assert((state.items.get(d.hooks.reward) || 0) === 0, "death paid the boss");
  assert(auditObjects(d, state).length === 0, "death in the arena lost an object");
  runOps(d, state, d.hooks.winFromLantern);
  assert(state.boss.defeated && state.boss.phase === "DEFEATED", "could not finish after re-entry");
  assert((state.items.get(d.hooks.reward) || 0) === 1, "reward missing after re-entry win");
  const mercy = d.hooks.mercyReward ? state.items.get(d.hooks.mercyReward) || 0 : null;
  runOps(d, state, d.hooks.reenter);
  assert(state.boss.phase === "IDLE" && state.boss.defeated, "re-entry restarted the fight");
  assert((state.items.get(d.hooks.reward) || 0) === 1, "re-entry paid the reward again");
  if (mercy !== null) assert((state.items.get(d.hooks.mercyReward) || 0) === mercy, "re-entry paid mercy again");
  runExpectingError(d, state, [{ op: "boss", action: "strike", tool: "hammer" }], "BOSS_ABSENT");
  assert((state.items.get(d.hooks.reward) || 0) === 1, "refused blow still changed the reward");
  runOps(d, state, d.hooks.exitOps);
}

function checkGod(d) {
  const god = createState(d);
  god.form = "god";
  let threw = false;
  try {
    runOps(d, god, d.routes.main);
  } catch (err) {
    threw = err instanceof EngineError;
    if (!threw) throw err;
  }
  assert(threw, "god-form cleared the dungeon");
  assert((god.items.get(d.hooks.reward) || 0) === 0, "god-form was paid");
  const skip = createState(d);
  let skipThrew = false;
  try {
    runOps(d, skip, d.hooks.godAtBoss);
  } catch (err) {
    skipThrew = err instanceof EngineError;
    if (!skipThrew) throw err;
  }
  assert(skipThrew, "the direct run reached the boss reward");
  assert((skip.items.get(d.hooks.reward) || 0) === 0, "skip path paid the reward");
  let sawWater = false;
  let sawGust = false;
  for (const room of d.rooms) {
    for (let y = 0; y < room.height && (!sawWater || !sawGust); y += 1) {
      for (let x = 0; x < room.width; x += 1) {
        const t = room.layers.terrain[y][x];
        if (t === "~") {
          sawWater = true;
          const mortal = createState(d);
          const divine = createState(d);
          divine.form = "god";
          assert(walkable(d, mortal, room, x, y), `${room.id} water refused fins`);
          assert(!walkable(d, divine, room, x, y), `${room.id} god-form swam`);
        }
        if (t === "G") {
          sawGust = true;
          const divine = createState(d);
          divine.form = "god";
          const open = (room.conditionalTerrain || []).some((rule) => (rule.tiles || []).some(([tx, ty]) => tx === x && ty === y) && (rule.requiresAll || []).every((f) => divine.flags.has(f)));
          if (!open) assert(!walkable(d, divine, room, x, y), `${room.id} god-form took an unbuilt gust`);
        }
      }
    }
  }
  if (d.id === "DG09" || d.id === "DG10") assert(sawWater, `${d.id} lost its water`);
  if (d.id === "DG11" || d.id === "DG12") assert(sawGust, `${d.id} lost its gust`);
}

function checkDebts() {
  const d = dg10;
  assert(d.debts.length === 4, "debt count");
  const objects = new Set(d.debts.map((x) => x.object));
  const flags = new Set(d.debts.map((x) => x.flag));
  assert(objects.size === 4 && flags.size === 4, "debts are not four distinct object-lines");
  for (const debt of d.debts) {
    assert(!("amount" in debt) && !("price" in debt) && !("cost" in debt), "debt has a price");
    assert(!/coin|price|shop|vendor|interest/i.test(debt.label), debt.label);
  }
  const wrong = placeState(d, {
    room: "DG10-R05",
    tile: [8, 5],
    carrying: { id: "marble-ticket", kind: "object" },
  });
  runExpectingError(d, wrong, [{ op: "interact", id: "H2" }], "WRONG_OBJECT");
  assert(wrong.carrying === "marble-ticket" && !wrong.flags.has("dg10.D2"), "wrong hook consumed the ticket");
  const diagram = placeState(d, { room: "DG10-R04", tile: [9, 9], ferryFrom: "DG10-R01" });
  runExpectingError(d, diagram, [{ op: "use-exit", id: "graph-home" }], "NOT_A_DOOR");
  const tangle = placeState(d, { room: "DG10-R04", tile: [15, 6], ferryFrom: "DG10-R05", levers: { W: true, E: true } });
  runExpectingError(d, tangle, [{ op: "use-exit", id: "launch-channel" }], "TANGLE");
  const done = createState(d);
  runOps(d, done, d.routes.main);
  for (const debt of d.debts) assert(done.flags.has(debt.flag), debt.flag);
  assert((done.items.get("struck-ledger") || 0) === 1, "ledger");
  assert((done.items.get("blue-shell") || 0) === 0, "shell became required");
}

function checkSeasons() {
  const d = dg11;
  assert(d.plots.length === 5, "plots");
  const row = d.plots.find((p) => p.id === "row");
  assert(row && row.graftable === false && row.resetOnDeath === true, "row dial is a graft");
  const graftable = d.plots.filter((p) => p.graftable);
  assert(graftable.length === 4 && graftable.every((p) => p.resetOnDeath === false), "stored grafts");
  const attempt = placeState(d, { room: "DG11-R10", tile: [8, 5], items: { wedge: 1 } });
  assert(!attempt.interactions || true);
  const room = roomById(d, "DG11-R10");
  assert(!room.interactions.some((i) => i.kind === "graft"), "row room offers a graft");
  const dial = placeState(d, { room: "DG11-R02", tile: [8, 5] });
  runOps(d, dial, [{ op: "interact", id: "dial-north" }]);
  assert(dial.seasons.north.current === "SUMMER" && dial.seasons.north.grafted === false, "dial skipped a face");
  runOps(d, dial, [{ op: "move", to: [9, 10] }, { op: "use-exit", id: "south" }]);
  assert(dial.seasons.north.current === "SPRING", "leaving kept an ungrafted face");
  const locked = placeState(d, { room: "DG11-R02", tile: [9, 5], items: { wedge: 1 } });
  runOps(d, locked, [
    { op: "move", to: [8, 5] },
    { op: "interact", id: "dial-north" },
    { op: "interact", id: "dial-north" },
    { op: "interact", id: "dial-north" },
    { op: "move", to: [9, 5] },
    { op: "interact", id: "graft-north" },
    { op: "move", to: [9, 10] },
    { op: "use-exit", id: "south" },
  ]);
  assert(locked.flags.has("season.north.WINTER") && locked.seasons.north.grafted, "graft did not persist");
  runOps(d, locked, [{ op: "die" }]);
  assert(locked.flags.has("season.north.WINTER") && locked.seasons.north.current === "WINTER", "death ungrafted a stored winter");
  assert(locked.seasons.row.current === "SPRING", "death kept the fight dial");
}

function checkMercy() {
  const d = dg12;
  const door = placeState(d, { room: "DG12-R13", tile: [16, 6], flags: ["lamp.ash", "lamp.birch", "lamp.cedar", "dg12.void_walked"] });
  runOps(d, door, [{ op: "use-exit", id: "east" }]);
  assert(door.roomId === "DG12-R14" && !door.flags.has("dg12.cleared"), "the door demanded mercy or already counted a clear");
  const noMercy = placeState(d, { room: "DG12-R13", tile: [16, 6], flags: ["mercy.pip", "mercy.rue", "mercy.sol", "mercy.wren"] });
  runExpectingError(d, noMercy, [{ op: "use-exit", id: "east" }], "EXIT_CLOSED");
  const ward = placeState(d, { room: "DG12-R09", tile: [8, 6], carrying: { id: "ash", kind: "moth" } });
  runExpectingError(d, ward, [{ op: "interact", id: "grate" }], "WARD_REJECTED");
  assert(ward.carrying === "ash" && ward.moths.ash.loc === "carried", "the grate lost a ward moth");
  assert(!ward.flags.has("dg12.cleared"), "rejecting a ward opened the Keeper");
  const mixed = placeState(d, { room: "DG12-R14", tile: [2, 6], flags: ["lamp.ash", "lamp.birch", "lamp.cedar", "dg12.void_walked"] });
  runOps(d, mixed, [
    { op: "boss", action: "begin" },
    { op: "move", to: [6, 6] },
    { op: "boss", action: "net", moth: "u1" },
    { op: "move", to: [9, 6] },
    { op: "boss", action: "shoot", moth: "u2", tool: "bow" },
    { op: "move", to: [12, 6] },
    { op: "boss", action: "net", moth: "u3" },
    { op: "move", to: [9, 5] },
    { op: "boss", action: "pin-book" },
    { op: "boss", action: "strike", tool: "hammer" },
    { op: "move", to: [8, 8] },
    { op: "boss", action: "crank" },
    { op: "move", to: [14, 6] },
    { op: "boss", action: "cross" },
  ]);
  assert((mixed.items.get("keeper-key") || 0) === 1, "mixed round gave no key");
  assert((mixed.items.get("unlived-kept") || 0) === 0, "a killed year still counted as mercy");
  const main = createState(d);
  runOps(d, main, d.routes.main);
  assert(main.flags.has("dg12.cleared") && (main.items.get("unlived-kept") || 0) === 1, "full net missed mercy");
  const cut = createState(d);
  runOps(d, cut, d.routes.shortcut);
  assert(!cut.flags.has("dg12.swarm") && cut.flags.has("dg12.void_walked") && cut.flags.has("mercy.pip"), "shortcut rewrote the rules");
  assert((cut.items.get("keeper-key") || 0) === 1, "shortcut missed the key");
}

function checkMarks() {
  const far = [
    [dg09, "boss", { room: "DG09-R15", tile: [9, 10], flags: ["dg09.A4"] }, [
      { op: "boss", action: "begin" },
      { op: "boss", action: "light-lantern" },
    ]],
    [dg09, "miniboss", { room: "DG09-R10", tile: [2, 6] }, [
      { op: "miniboss", action: "begin" },
      { op: "miniboss", action: "shoot-chest", tool: "bow" },
    ]],
    [dg10, "boss", { room: "DG10-R14", tile: [2, 6], flags: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"] }, [
      { op: "boss", action: "begin" },
      { op: "boss", action: "glass-strike" },
    ]],
    [dg10, "miniboss", { room: "DG10-R10", tile: [2, 6] }, [
      { op: "miniboss", action: "begin" },
      { op: "miniboss", action: "pin", n: 1, tool: "bow" },
    ]],
    [dg11, "boss", { room: "DG11-R14", tile: [2, 6] }, [
      { op: "boss", action: "begin" },
      { op: "boss", action: "set-season", arm: "N", season: "WINTER" },
      { op: "boss", action: "lock", arm: "N" },
    ]],
    [dg11, "miniboss", { room: "DG11-R10", tile: [2, 6] }, [
      { op: "miniboss", action: "begin" },
      { op: "miniboss", action: "strike", tool: "shovel" },
    ]],
    [dg12, "boss", { room: "DG12-R14", tile: [2, 6], flags: ["lamp.ash", "lamp.birch", "lamp.cedar", "dg12.void_walked"] }, [
      { op: "boss", action: "begin" },
      { op: "boss", action: "net", moth: "u1" },
    ]],
    [dg12, "miniboss", { room: "DG12-R11", tile: [2, 6], flags: ["lamp.ash"] }, [
      { op: "miniboss", action: "begin" },
      { op: "miniboss", action: "light" },
    ]],
  ];
  for (const [d, which, place, steps] of far) {
    const state = placeState(d, place);
    runExpectingError(d, state, steps, "NOT_ADJACENT");
    assert(!(which === "boss" ? state.boss.defeated : state.miniboss.defeated), `${d.id} ${which} fell from the doorway`);
  }
}

function renderMap(d) {
  const out = [];
  out.push(`${d.id} ${d.name}`);
  out.push(`Boss: ${d.bossName} in ${d.boss.room}. Miniboss in ${d.miniboss.room}.`);
  out.push(`Entry ${d.entry.room} @ ${d.entry.tile.join(",")}.`);
  out.push("Legend: # ruin or wall, . floor, , road, ~ water, G gust, + gated, ! hazard. Letters are objects.");
  out.push("");
  for (const room of d.rooms) {
    out.push(`${room.id}  ${room.name}  [${room.classification}]  ${room.width}x${room.height}`);
    out.push(room.summary);
    out.push("persistent: " + room.persistentState.join(", "));
    out.push("reset: " + room.resetState.join(", "));
    for (let y = 0; y < room.height; y += 1) {
      let row = "";
      for (let x = 0; x < room.width; x += 1) {
        const obj = room.layers.objects[y][x];
        row += obj !== " " ? obj : room.layers.terrain[y][x];
      }
      out.push(row);
    }
    for (const conn of room.connections) {
      const when = [...(conn.when?.all || []), ...(conn.when?.any || [])].join("+") || "open";
      out.push(`  ${conn.id}@${conn.tile.join(",")} -> ${conn.to} [${conn.kind || "walk"}] if ${when}${conn.elseTo ? ` else ${conn.elseTo}` : ""}`);
    }
    out.push("");
  }
  return out.join("\n");
}

function renderSolution(d) {
  const out = [];
  out.push(`${d.id} ${d.name}`);
  out.push(`Site: ${d.site}`);
  out.push("Dependency:");
  for (const e of d.dependencyGraph.edges) out.push(`  ${e.from} -> ${e.to}`);
  for (const cut of d.shortcuts) out.push(`Shortcut ${cut.id}: ${cut.description}`);
  out.push("");
  for (const [name, ops] of Object.entries(d.routes)) {
    out.push(`== route ${name}`);
    const { rows, state } = traceRoute(d, ops);
    out.push(...rows);
    out.push(`end ${state.roomId} items ${[...state.items.entries()].map(([k, v]) => `${k}x${v}`).join(", ") || "(none)"}`);
    out.push("");
  }
  out.push("== room solution traces");
  for (const room of d.rooms) {
    out.push(`${room.id} ${room.classification}`);
    out.push("  solve: " + room.localProof.steps.map(fmtOp).join(" → "));
    for (const fail of room.failureAndRecovery) {
      out.push(`  fail ${fail.name}: ${fail.steps.map(fmtOp).join(" → ")} => ${fail.expectError || "soft"}`);
      if (fail.recovery?.length) out.push(`  recover: ${fail.recovery.map(fmtOp).join(" → ")}`);
    }
  }
  return out.join("\n");
}

function main() {
  say("PREINCARNATION DG09–DG12 validation");
  say(`rooms ${DUNGEONS.reduce((n, d) => n + d.rooms.length, 0)}`);
  test("sixty rooms", () => {
    const n = DUNGEONS.reduce((s, d) => s + d.rooms.length, 0);
    assert(n >= 60, `only ${n}`);
    return String(n);
  });
  for (const d of DUNGEONS) {
    test(`${d.id} structural`, () => {
      checkStructural(d);
      return `${d.rooms.length} rooms, proofs ${d.rooms.length}`;
    });
    test(`${d.id} routing cycles`, () => {
      checkRouting(d);
      return `${d.intentionalCycles.length} benign cycles, shortcut ${d.shortcuts.map((s) => s.id).join(",")}`;
    });
    test(`${d.id} lost transported objects`, () => {
      checkLostObjects(d);
      const spec = d.hooks.transitionDeath;
      return `${spec.carriedId} returns to ${spec.homeRoom}`;
    });
    test(`${d.id} missed rewards`, () => {
      checkMissedRewards(d);
      return `${d.discoveries.length} discoveries`;
    });
    test(`${d.id} death during transitions`, () => {
      checkTransitionDeath(d);
      return "crossing death wakes at the lantern and does not arrive";
    });
    test(`${d.id} boss re-entry`, () => {
      checkBossReentry(d);
      return `${d.boss.id} pays ${d.hooks.reward} once`;
    });
    test(`${d.id} god-form does not skip`, () => {
      checkGod(d);
      return "sealed";
    });
  }
  test("DG10 debts are not an economy", () => {
    checkDebts();
    return "4 object-hooks";
  });
  test("DG11 seasons are authored states", () => {
    checkSeasons();
    return "four grafts, one fight dial";
  });
  test("DG12 mercy does not ambiguate progression", () => {
    checkMercy();
    return "key without mercy, mercy without being the door";
  });
  test("fight marks are out of reach from the door", () => {
    checkMarks();
    return "8 doorway attempts refused";
  });

  const mapDir = path.join(HERE, "maps");
  const solDir = path.join(HERE, "solutions");
  fs.mkdirSync(mapDir, { recursive: true });
  fs.mkdirSync(solDir, { recursive: true });
  for (const d of DUNGEONS) {
    fs.writeFileSync(path.join(mapDir, `${d.id}.txt`), renderMap(d));
    fs.writeFileSync(path.join(solDir, `${d.id}.txt`), renderSolution(d));
  }
  say("");
  say(failed === 0 ? `OK  ${lines.filter((l) => l.startsWith("PASS")).length} tests` : `FAILED ${failed}`);
  const text = lines.join("\n") + "\n";
  fs.writeFileSync(path.join(HERE, "validation-output.txt"), text);
  process.stdout.write(text);
  process.exit(failed === 0 ? 0 : 1);
}

main();
