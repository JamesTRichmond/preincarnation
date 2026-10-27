/**
 * Design validator for the DG05–DG08 pack.
 * It checks references, scripts, key accounting, puzzle graphs, and
 * strand rules. It does not simulate combat frames or render tiles.
 * A clean report is not engine playtesting.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const BANNED = [/TODO/i, /\bTBD\b/, /placeholder/i, /fill this in/i, /the builder fills/i, /to be written/i];
const TOOLS = new Set([
  "lamp", "hammer", "sugarLine", "blockRod", "creekFins", "cape", "bow", "shovel", "boots", "net", "glassWarp", "powderKeg",
]);

function isWalkable(ch, fins) {
  if (ch === "#" || ch === undefined) return false;
  if (ch === "W") return !!fins;
  return true;
}

function resolveChar(ch, level) {
  if (level == null) return ch;
  if (ch === "=") return level === 0 ? "." : level === 1 ? "~" : "W";
  if (ch === "~") return level === 0 ? "." : level === 1 ? "~" : "W";
  return ch;
}

function resolveRows(rows, level) {
  if (level == null) return rows;
  return rows.map((row) => row.split("").map((ch) => resolveChar(ch, level)).join(""));
}

function component(rows, start, fins) {
  const h = rows.length;
  const w = rows[0].length;
  const seen = new Set();
  const ch0 = rows[start.y]?.[start.x];
  if (!isWalkable(ch0, fins)) return seen;
  const q = [[start.x, start.y]];
  seen.add(`${start.x},${start.y}`);
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || ny >= h || nx >= w) continue;
      if (!isWalkable(rows[ny][nx], fins)) continue;
      const k = `${nx},${ny}`;
      if (seen.has(k)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

function hasToolNeed(node, tools) {
  return (node.requiresTools || []).every((t) => tools.has(t));
}

function flagOk(node, flags) {
  return (node.requiresFlags || []).every((f) => flags.has(f));
}

function keyOk(node, keys) {
  return (node.requiresKeys || []).every((k) => keys.has(k));
}

function levelOk(node, level) {
  if (!node.openAtLevels || level == null) return true;
  return node.openAtLevels.includes(level);
}

export function validatePack(pack, opts = {}) {
  const minRooms = opts.minRooms ?? 15;
  const errors = [];
  const warnings = [];
  const err = (code, message, where) => errors.push({ code, message, where: where || null });
  const stats = { dungeons: [], puzzles: 0, rooms: 0 };

  if (!pack?.dungeons?.length) err("SCHEMA", "pack has no dungeons");
  const bannedHit = scanBanned(pack);
  for (const hit of bannedHit) err("BANNED_TEXT", `banned authoring text "${hit.match}"`, hit.where);

  const integration = pack.integrationEvents || [];
  if (!opts.skipIntegration) checkIntegration(pack, integration, err);

  for (const d of pack.dungeons || []) validateDungeon(d, pack, { minRooms, err, warnings, stats });

  return { ok: errors.length === 0, errors, warnings, stats };
}

function scanBanned(value, where = "pack", hits = []) {
  if (typeof value === "string") {
    for (const re of BANNED) {
      const m = value.match(re);
      if (m) hits.push({ match: m[0], where });
    }
    return hits;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => scanBanned(v, `${where}[${i}]`, hits));
    return hits;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "fsm" || k === "layers" || k === "layersByLevel") continue;
      scanBanned(v, `${where}.${k}`, hits);
    }
  }
  return hits;
}

function checkIntegration(pack, events, err) {
  const ev = events.find((e) => e.id === "integration.secondCrown");
  if (!ev) {
    err("INTEGRATION", "missing integration.secondCrown");
    return;
  }
  if (ev.notAnExistingRuntimeApi !== true || ev.doNotCallAsExistingApi !== true) {
    err("INTEGRATION", "second crown must be marked as a proposal, not an existing API");
  }
  if (ev.payload?.grantsEmbryonicGod !== false || ev.eligibilityRuleProposed?.grantsNow !== false) {
    err("INTEGRATION", "second crown must not grant Embryonic God");
  }
  if (ev.crown1?.definedInThisPack !== false) {
    err("INTEGRATION", "crown 1 must stay outside this pack");
  }
  const dg08 = (pack.dungeons || []).find((d) => d.id === "dg08");
  if (!dg08) return;
  const flags = new Set();
  const evidence = new Set((dg08.evidence || []).map((e) => e.id));
  for (const room of dg08.rooms || []) {
    for (const i of room.interactions || []) for (const f of i.setsFlags || []) flags.add(f);
  }
  for (const f of ev.when?.flags || []) {
    if (!flags.has(f)) err("INTEGRATION", `event flag ${f} is not set by a DG08 interaction`, f);
  }
  for (const id of ev.when?.evidence || []) {
    if (!evidence.has(id)) err("INTEGRATION", `event evidence ${id} missing`, id);
  }
}

function validateDungeon(d, pack, ctx) {
  const { err, warnings, stats, minRooms } = ctx;
  const where = d.id || "?";
  const rooms = d.rooms || [];
  stats.rooms += rooms.length;
  stats.puzzles += (d.puzzles || []).length;
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const dungeonStat = {
    id: d.id,
    name: d.name,
    rooms: rooms.length,
    optionalRooms: rooms.filter((r) => r.optional).map((r) => r.id),
    finsOnlyRooms: rooms.filter((r) => r.requiresOptionalTool).map((r) => r.id),
  };

  if (!d.id || !d.name || !d.entranceRoom || !d.goalFlag) err("SCHEMA", "dungeon missing id, name, entrance, or goal", where);
  if (rooms.length < minRooms) err("SCHEMA", `${where} has ${rooms.length} rooms, need ${minRooms}`, where);
  if (!roomById.has(d.entranceRoom)) err("MISSING_REF", "entrance room missing", d.entranceRoom);

  const ids = new Set();
  for (const r of rooms) {
    if (ids.has(r.id)) err("SCHEMA", `duplicate room ${r.id}`);
    ids.add(r.id);
    if (!r.summary || r.summary.length < 80) err("SCHEMA", "summary too thin", r.id);
    if (!Array.isArray(r.solutionTrace) || r.solutionTrace.length < 1) err("SCHEMA", "missing solution trace", r.id);
    const floor = r.layers?.floor || r.floor;
    if (!floor?.length) err("SCHEMA", "missing floor layer", r.id);
    else checkRoomTiles(d, r, floor, err);
    for (const ex of r.exits || []) {
      if (ex.external || String(ex.to || "").startsWith("overworld.")) {
        if (!ex.external) err("MISSING_REF", "overworld exit not marked external", `${r.id}:${ex.id}`);
        continue;
      }
      if (!roomById.has(ex.to)) err("MISSING_REF", `exit ${ex.id} → ${ex.to} missing`, r.id);
      for (const t of ex.requiresTools || []) if (!TOOLS.has(t)) err("SCHEMA", `unknown tool ${t}`, `${r.id}:${ex.id}`);
    }
    const seenI = new Set();
    for (const inter of r.interactions || []) {
      if (seenI.has(inter.id)) err("SCHEMA", `duplicate interaction ${inter.id}`, r.id);
      seenI.add(inter.id);
      if (typeof inter.x !== "number" || typeof inter.y !== "number") err("SCHEMA", "interaction missing tile", `${r.id}:${inter.id}`);
      for (const t of inter.requiresTools || []) if (!TOOLS.has(t)) err("SCHEMA", `unknown tool ${t}`, `${r.id}:${inter.id}`);
    }
  }

  checkKeys(d, roomById, err);
  checkPuzzles(d, roomById, err);
  checkEvidence(d, roomById, err);
  checkClues(d, err);
  checkAssertions(d, err);
  checkBestiary(d, err);
  checkBoss(d, err);

  const requiredTools = new Set(d.requiredTools || []);
  const optionalTools = new Set([...(d.requiredTools || []), ...(d.optionalTools || [])]);
  for (const t of [...requiredTools, ...optionalTools]) {
    if (!TOOLS.has(t)) err("SCHEMA", `dungeon tool ${t} is not in the catalog`, d.id);
  }
  if (d.id === "dg06" && requiredTools.has("creekFins")) err("FINS_REQUIRED", "DG06 lists creek fins as required", d.id);

  const main = simulate(d, d.routes?.main, {
    tools: requiredTools,
    flags: d.entry?.assumedGrantedFlags || [],
    keys: [],
    room: d.entranceRoom,
  }, err, "main");
  if (main && !main.flags.has(d.goalFlag)) err("SCRIPT", "main script did not set the goal flag", d.id);
  const requiredEvidence = (d.evidence || []).filter((e) => e.required).map((e) => e.id);
  if (main) {
    for (const id of requiredEvidence) {
      if (!main.evidence.has(id)) err("SCRIPT", `main script never finds required evidence ${id}`, d.id);
    }
    dungeonStat.mainSteps = main.steps;
  }

  const shortcut = d.routes?.shortcut;
  if (!shortcut?.script?.length) err("SHORTCUT", "missing shortcut script", d.id);
  else {
    const sim = simulate(d, shortcut.script, {
      tools: requiredTools,
      flags: [...(d.entry?.assumedGrantedFlags || []), ...(shortcut.assumeFlags || [])],
      keys: shortcut.assumeKeys || [],
      room: shortcut.startRoom || d.entranceRoom,
    }, err, "shortcut");
    if (sim && !sim.flags.has(d.goalFlag)) err("SHORTCUT", "shortcut did not reach the goal", d.id);
    if (sim && main && sim.steps >= main.steps) {
      err("SHORTCUT", `shortcut (${sim.steps}) is not shorter than main (${main.steps})`, d.id);
    }
    dungeonStat.shortcutSteps = sim?.steps ?? null;
  }

  for (const branch of d.routes?.optionalBranches || []) {
    const tools = new Set(requiredTools);
    for (const t of branch.requiresTools || []) tools.add(t);
    const sim = simulate(d, branch.script, {
      tools,
      flags: [...(d.entry?.assumedGrantedFlags || []), ...(branch.assumeFlags || [])],
      keys: branch.assumeKeys || [],
      room: branch.startRoom || d.entranceRoom,
    }, err, `branch:${branch.id}`);
    if (sim) {
      for (const id of branch.rooms || []) {
        if (!sim.visited.has(id)) err("SCRIPT", `branch ${branch.id} never enters ${id}`, d.id);
      }
    }
  }

  if (d.routes?.finsShortcut) {
    const fs = d.routes.finsShortcut;
    const tools = new Set(optionalTools);
    for (const t of fs.requiresTools || []) tools.add(t);
    tools.add("creekFins");
    const sim = simulate(d, fs.script, {
      tools,
      flags: [...(d.entry?.assumedGrantedFlags || []), ...(fs.assumeFlags || [])],
      keys: fs.assumeKeys || [],
      room: fs.startRoom || d.entranceRoom,
    }, err, "fins-shortcut");
    if (sim && !sim.flags.has(d.goalFlag)) err("SCRIPT", "fins shortcut did not reach the goal", d.id);
  }

  const graphRequired = searchGraph(d, requiredTools, err, "required");
  const graphOptional = searchGraph(d, optionalTools, err, "optional");
  const graphNoOptionalRooms = searchGraph(d, requiredTools, err, "no-optional-rooms", { skipOptionalRooms: true });

  if (graphRequired) {
    if (!graphRequired.goal) err("UNREACHABLE", "goal not reachable with required tools", d.id);
    for (const r of rooms) {
      const reached = graphRequired.rooms.has(r.id);
      if (r.requiresOptionalTool) {
        if (reached) warnings.push({ code: "REACH", message: `${r.id} was reached without its optional tool` });
        continue;
      }
      if (!reached) err("UNREACHABLE", "room not reachable with required tools", r.id);
    }
    if (graphRequired.strands.length) {
      const sample = graphRequired.strands.slice(0, 3).join(" || ");
      err("STRAND", `${graphRequired.strands.length} states cannot return to the entrance. Sample: ${sample}`, d.id);
    }
    if (!graphRequired.keyProofs.ok) {
      for (const msg of graphRequired.keyProofs.errors) err("KEY_ACCOUNTING", msg, d.id);
    }
  }
  if (graphOptional) {
    for (const r of rooms) {
      if (!graphOptional.rooms.has(r.id)) err("UNREACHABLE", "room not reachable even with optional tools", r.id);
    }
    if (graphOptional.strands.length) {
      err("STRAND", `${graphOptional.strands.length} optional-tool states cannot return to the entrance`, d.id);
    }
  }
  if (graphNoOptionalRooms && !graphNoOptionalRooms.goal) {
    err("UNREACHABLE", "boss requires an optional room", d.id);
  }

  if (main) {
    for (const step of d.routes.main) {
      if (step.do === "exit") {
        const ex = findExitOnPath(d, main.exitLog, step.id);
        if (ex?.needFins && d.id === "dg06") err("FINS_REQUIRED", `main route uses fin exit ${step.id}`, d.id);
      }
    }
  }

  dungeonStat.reachableRequired = graphRequired ? graphRequired.rooms.size : 0;
  dungeonStat.statesRequired = graphRequired ? graphRequired.states : 0;
  stats.dungeons.push(dungeonStat);
}

function findExitOnPath(d, exitLog, id) {
  return (exitLog || []).find((e) => e.id === id);
}

function checkRoomTiles(d, room, floor, err) {
  const h = floor.length;
  const w = floor[0].length;
  if (floor.some((row) => row.length !== w)) err("SCHEMA", "ragged floor", room.id);
  const levels = d.levels || [null];
  const points = [];
  if (room.spawn) points.push({ ...room.spawn, kind: "spawn", id: "spawn" });
  for (const ex of room.exits || []) points.push({ x: ex.x, y: ex.y, kind: "exit", id: ex.id, exit: ex });
  for (const inter of room.interactions || []) points.push({ x: inter.x, y: inter.y, kind: "interact", id: inter.id, inter });
  for (const enc of room.encounters || []) {
    if (enc.tiles?.length !== enc.count) err("SCHEMA", "encounter count mismatch", `${room.id}:${enc.enemy}`);
    for (const [x, y] of enc.tiles || []) points.push({ x, y, kind: "encounter", id: enc.enemy });
  }
  for (const p of points) {
    if (p.y < 0 || p.x < 0 || p.y >= h || p.x >= w) err("SCHEMA", `${p.kind} ${p.id} out of bounds`, room.id);
    else if (floor[p.y][p.x] === "#") err("SCHEMA", `${p.kind} ${p.id} sits on a wall`, room.id);
  }

  for (const level of levels) {
    const rows = resolveRows(floor, level);
    const noFinsExits = (room.exits || []).filter((ex) => levelOk(ex, level) && !ex.needFins);
    if (noFinsExits.length) {
      const comp = component(rows, noFinsExits[0], false);
      for (const ex of noFinsExits) {
        if (!comp.has(`${ex.x},${ex.y}`)) {
          err("STRAND", `exit ${ex.id} is not connected without fins at level ${level}`, room.id);
        }
      }
      for (const inter of room.interactions || []) {
        const needsFins = (inter.requiresTools || []).includes("creekFins") || inter.optional;
        if (inter.optional) continue;
        if ((inter.requiresTools || []).includes("creekFins")) continue;
        if (!comp.has(`${inter.x},${inter.y}`)) {
          err("STRAND", `interaction ${inter.id} not reachable without fins at level ${level}`, room.id);
        }
        void needsFins;
      }
      if (room.spawn && level === (d.initialLevel ?? null) && !comp.has(`${room.spawn.x},${room.spawn.y}`)) {
        err("STRAND", "spawn is off the walk", room.id);
      }
    }
    if ([...rows.join("")].includes("W")) {
      const shores = rows.some((row) => [...row].some((ch) => ch !== "#" && ch !== "W"));
      if (!shores) err("FINS_REQUIRED", `no shore at level ${level}`, room.id);
    }
  }

  if (room.safePath?.length) {
    const rows = floor;
    for (let i = 0; i < room.safePath.length; i++) {
      const [x, y] = room.safePath[i];
      const ch = rows[y]?.[x];
      if (ch === "#" || ch === "!" || ch === undefined) err("SCHEMA", `safe path tile ${x},${y} is '${ch}'`, room.id);
      if (i > 0) {
        const [px, py] = room.safePath[i - 1];
        if (Math.abs(px - x) + Math.abs(py - y) !== 1) err("SCHEMA", "safe path is not orthogonal", room.id);
      }
    }
  }

  if ((d.waterControlRooms || []).includes(room.id)) {
    for (const level of d.levels || [null]) {
      const rows = resolveRows(floor, level);
      if (rows.some((row) => row.includes("W"))) err("FINS_REQUIRED", `water control room goes deep at level ${level}`, room.id);
    }
  }
}

function checkKeys(d, roomById, err) {
  const keys = d.keys || [];
  const locks = d.locks || [];
  const keyById = new Map(keys.map((k) => [k.id, k]));
  if (new Set(keys.map((k) => k.id)).size !== keys.length) err("KEY_ACCOUNTING", "duplicate key id", d.id);
  for (const key of keys) {
    if (!key.opens || key.opens.length !== 1) err("KEY_ACCOUNTING", `${key.id} must open exactly one lock`, d.id);
    const lock = locks.find((l) => l.id === key.opens[0]);
    if (!lock) err("KEY_ACCOUNTING", `${key.id} opens missing lock ${key.opens?.[0]}`, d.id);
    else if (lock.keyId !== key.id) err("KEY_ACCOUNTING", `${lock.id} key mismatch`, d.id);
    if ((key.kind === "optional") !== !!lock?.optional) {
      err("KEY_ACCOUNTING", `${key.id} optional flag does not match its lock`, d.id);
    }
    const srcRoom = roomById.get(key.source?.room);
    const src = srcRoom?.interactions?.find((i) => i.id === key.source?.interaction);
    if (!src) err("KEY_ACCOUNTING", `${key.id} source interaction missing`, d.id);
    else if (!(src.givesKeys || []).includes(key.id)) err("KEY_ACCOUNTING", `${key.id} source does not grant it`, d.id);
  }
  for (const lock of locks) {
    if (!keyById.has(lock.keyId)) err("KEY_ACCOUNTING", `lock ${lock.id} has no key`, d.id);
    if (lock.exit) {
      const room = roomById.get(lock.room);
      const ex = room?.exits?.find((e) => e.id === lock.exit);
      if (!ex) err("KEY_ACCOUNTING", `lock ${lock.id} exit ${lock.exit} missing`, d.id);
      else if (!(ex.requiresKeys || []).includes(lock.keyId)) {
        err("KEY_ACCOUNTING", `exit ${lock.exit} does not require ${lock.keyId}`, d.id);
      }
    }
    if (lock.interaction) {
      const room = roomById.get(lock.room);
      const inter = room?.interactions?.find((i) => i.id === lock.interaction);
      if (!inter) err("KEY_ACCOUNTING", `lock interaction missing`, lock.id);
      else if (!(inter.requiresKeys || []).includes(lock.keyId)) err("KEY_ACCOUNTING", `interaction does not require key`, lock.id);
    }
  }
}

function checkPuzzles(d, roomById, err) {
  for (const p of d.puzzles || []) {
    if (!roomById.has(p.room)) err("MISSING_REF", `puzzle room missing`, p.id);
    if (!p.fsm) err("DEAD_END", "puzzle has no fsm", p.id);
    else checkFsm(p.fsm, p.id, err);
    if (p.solutionDisplayed !== true) err("TEXT_GUESS", "puzzle solution is not marked displayed", p.id);
    if (p.noFreeText !== true) err("TEXT_GUESS", "puzzle missing noFreeText", p.id);
    if (["freeText", "password", "riddle", "spoken-word"].includes(p.type)) err("TEXT_GUESS", `forbidden puzzle type ${p.type}`, p.id);
    if (p.type === "testimony") {
      if (JSON.stringify(p.exemplar) !== JSON.stringify(p.carvedDuplicate)) {
        err("TESTIMONY", "carved duplicate differs from exemplar", p.id);
      }
      const room = roomById.get(p.room);
      const bell = room?.interactions?.find((i) => /bell/i.test(i.id) || /bell/i.test(i.verb || ""));
      if (!bell) err("TESTIMONY", "no bell in testimony room", p.id);
      if (bell?.consumesKeys?.length) err("TESTIMONY", "bell consumes keys", p.id);
      if (!p.fsm?.readableRail) err("TESTIMONY", "rail not marked readable", p.id);
    }
    if (p.type === "railBlock") checkRail(d, p, roomById.get(p.room), err);
    if (d.id === "dg05" && p.noFreeText !== true) err("TEXT_GUESS", "library puzzle can require a guess", p.id);
  }
}

function checkFsm(fsm, id, err) {
  const states = fsm.states || {};
  const edges = fsm.edges || [];
  if (!states[fsm.initial]) err("DEAD_END", "fsm missing initial", id);
  if (!states[fsm.terminal]?.terminal && !states[fsm.terminal]) err("DEAD_END", "fsm missing terminal", id);
  const adj = new Map();
  for (const e of edges) {
    if (!states[e.from] || !states[e.to]) {
      err("DEAD_END", `dangling edge ${e.from} -${e.on}-> ${e.to}`, id);
      continue;
    }
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push(e);
  }
  let cur = fsm.initial;
  for (const step of fsm.solution || []) {
    const nxt = (adj.get(cur) || []).find((e) => e.on === step);
    if (!nxt) {
      err("DEAD_END", `solution step ${step} illegal from ${cur}`, id);
      return;
    }
    cur = nxt.to;
  }
  if (cur !== fsm.terminal) err("DEAD_END", `solution ends at ${cur}`, id);
  for (const s of Object.keys(states)) {
    if (!canReach(s, fsm.terminal, adj)) err("DEAD_END", `${s} cannot reach ${fsm.terminal}`, id);
    if (!canReachPred(s, adj, (n) => states[n].safe)) err("DEAD_END", `${s} has no safe recovery`, id);
  }
}

function canReach(start, goal, adj) {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const c = q.shift();
    if (c === goal) return true;
    for (const e of adj.get(c) || []) if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); }
  }
  return false;
}
function canReachPred(start, adj, pred) {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const c = q.shift();
    if (pred(c)) return true;
    for (const e of adj.get(c) || []) if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); }
  }
  return false;
}

function checkRail(d, puzzle, room, err) {
  if (!room) return;
  const forbidden = new Set(puzzle.forbiddenTiles || puzzle.fsm?.forbiddenTiles || []);
  for (const ex of room.exits || []) {
    const t = `${ex.x},${ex.y}`;
    if (!forbidden.has(t)) err("BLOCK_SOFTLOCK", `exit ${ex.id} tile ${t} is not in forbiddenTiles`, puzzle.id);
  }
  const crank = puzzle.crankTile || puzzle.fsm?.crankTile;
  if (!crank) err("BLOCK_SOFTLOCK", "rail puzzle has no crank tile", puzzle.id);
  else if (!forbidden.has(crank)) err("BLOCK_SOFTLOCK", "crank tile is not protected from blocks", puzzle.id);
  const floor = room.layers?.floor || room.floor;
  for (const block of puzzle.blocks || []) {
    for (const [name, tile] of Object.entries(block.positions || {})) {
      const [x, y] = tile;
      const ch = floor?.[y]?.[x];
      if (ch === "#" || ch === undefined) err("BLOCK_SOFTLOCK", `block ${block.id}:${name} on '${ch}'`, puzzle.id);
      if (forbidden.has(`${x},${y}`) && `${x},${y}` !== crank) {
        /* occupying a forbidden tile is already fatal in authoring; still report */
        err("BLOCK_SOFTLOCK", `block ${block.id}:${name} occupies ${x},${y}`, puzzle.id);
      }
    }
  }
  if (!puzzle.fsm?.resetFromAny) err("BLOCK_SOFTLOCK", "rail puzzle cannot reset from every state", puzzle.id);
}

function checkEvidence(d, roomById, err) {
  const grants = new Map();
  for (const room of d.rooms) {
    for (const inter of room.interactions || []) {
      for (const id of inter.givesEvidence || []) {
        if (!grants.has(id)) grants.set(id, []);
        grants.get(id).push(`${room.id}:${inter.id}`);
      }
    }
  }
  for (const ev of d.evidence || []) {
    if (!roomById.has(ev.room)) err("MISSING_REF", "evidence room missing", ev.id);
    if (!grants.has(ev.id)) err("MISSING_REF", "evidence is never granted by an interaction", ev.id);
  }
  const known = new Set((d.collectibles || []).map((c) => c.id));
  for (const room of d.rooms) {
    for (const inter of room.interactions || []) {
      for (const id of inter.givesCollectibles || []) {
        if (!known.has(id)) err("MISSING_REF", `collectible ${id} is not catalogued`, room.id);
      }
    }
  }
}

function checkClues(d, err) {
  const puzzles = new Map((d.puzzles || []).map((p) => [p.id, p]));
  for (const clue of d.clues || []) {
    const p = puzzles.get(clue.puzzle);
    if (!p) err("MISSING_REF", "clue puzzle missing", clue.id);
    if (!d.rooms.some((r) => r.id === clue.room)) err("MISSING_REF", "clue room missing", clue.id);
    if (clue.matchesRoomSafePath) {
      const room = d.rooms.find((r) => r.id === clue.room);
      if (!room?.safePath?.length) err("CLUE", "clue claims a safe path the room lacks", clue.id);
    }
  }
  for (const p of d.puzzles || []) {
    if (!p.major) continue;
    const clues = (d.clues || []).filter((c) => c.puzzle === p.id && c.fair && c.environmental && c.major);
    if (clues.length < 2) err("CLUE", "major puzzle has fewer than two fair environmental clues", p.id);
    if (!clues.some((c) => c.room === p.room)) {
      err("CLUE", "major puzzle has no fair clue inside its own room", p.id);
    }
  }
}

function checkAssertions(d, err) {
  const asserted = new Set(d.designAssertions || []);
  if (d.id === "dg05" && !asserted.has("noFreeText")) err("TEXT_GUESS", "library missing noFreeText assertion", d.id);
  if (d.id === "dg06") {
    if (!asserted.has("noRequiredFins")) err("FINS_REQUIRED", "reservoir missing assertion", d.id);
    for (const room of d.rooms) {
      for (const ex of room.exits || []) {
        if (ex.needFins && !ex.optional) err("FINS_REQUIRED", `exit ${ex.id} needs fins and is not optional`, room.id);
      }
    }
  }
  if (d.id === "dg07" && !asserted.has("blockSoftlock")) err("BLOCK_SOFTLOCK", "hayloft missing assertion", d.id);
  if (d.id === "dg08") {
    if (!asserted.has("testimonyRecoverable")) err("TESTIMONY", "court missing assertion", d.id);
    if (!d.testimonyPolicy?.railVisible || !d.testimonyPolicy?.bellPreservesKeys) {
      err("TESTIMONY", "testimony policy incomplete", d.id);
    }
  }
}

function checkBestiary(d, err) {
  const enemies = new Set((d.enemies || []).map((e) => e.id));
  for (const e of d.enemies || []) {
    if (e.movement !== "cardinal") err("SCHEMA", "enemy is not four-direction", e.id);
  }
  for (const room of d.rooms) {
    for (const enc of room.encounters || []) {
      if (!enemies.has(enc.enemy)) err("MISSING_REF", "encounter enemy missing", `${room.id}:${enc.enemy}`);
    }
  }
}

function checkBoss(d, err) {
  for (const actor of [d.boss, d.miniboss]) {
    if (!actor?.fsm) {
      err("BOSS_FSM", "missing fsm", actor?.id || d.id);
      continue;
    }
    checkFsm(actor.fsm, actor.id, err);
    if (actor.room && !d.rooms.some((r) => r.id === actor.room)) err("MISSING_REF", "boss room missing", actor.id);
  }
  if (d.boss?.name && d.miniboss?.name && d.boss.name === d.miniboss.name) {
    err("BOSS_FSM", "miniboss is not distinct", d.id);
  }
  if (d.id === "dg06" && d.boss?.finsRequired !== false) err("FINS_REQUIRED", "surveyor fight requires fins", d.id);
  if (d.id === "dg08") {
    const edges = d.boss?.fsm?.edges || [];
    if (!edges.some((e) => e.preview === "chalk" || e.on === "chalk-shows-copy")) {
      err("TESTIMONY", "witness lunge is not previewed", d.id);
    }
    if (!edges.some((e) => e.preservesHits)) err("TESTIMONY", "bell does not preserve boss hits", d.id);
    if (d.boss?.grantsEmbryonicGod !== false) err("INTEGRATION", "boss grants Embryonic God directly", d.id);
  }
}

function simulate(d, script, start, err, label) {
  if (!script) return null;
  const roomById = new Map(d.rooms.map((r) => [r.id, r]));
  const state = {
    room: start.room,
    level: d.initialLevel ?? null,
    flags: new Set(start.flags || []),
    keys: new Set(start.keys || []),
    evidence: new Set(),
    visited: new Set([start.room]),
    exitLog: [],
  };
  const tools = start.tools;
  let steps = 0;
  for (const step of script) {
    const room = roomById.get(state.room);
    if (!room) {
      err("SCRIPT", `${label} is in missing room ${state.room}`, d.id);
      return null;
    }
    if (step.do === "exit") {
      const ex = (room.exits || []).find((e) => e.id === step.id);
      if (!ex) {
        err("SCRIPT", `${label} exit ${step.id} not in ${state.room}`, d.id);
        return null;
      }
      if (!flagOk(ex, state.flags) || !keyOk(ex, state.keys) || !hasToolNeed(ex, tools) || !levelOk(ex, state.level)) {
        err("SCRIPT", `${label} cannot take ${step.id} from ${state.room} (flags/keys/tools/level)`, d.id);
        return null;
      }
      if (ex.needFins && !tools.has("creekFins")) {
        err("SCRIPT", `${label} takes fin exit ${step.id} without fins`, d.id);
        return null;
      }
      for (const f of ex.setsFlags || []) state.flags.add(f);
      state.exitLog.push(ex);
      if (!ex.external) {
        state.room = ex.to;
        state.visited.add(ex.to);
      }
      steps++;
    } else if (step.do === "interact") {
      const inter = (room.interactions || []).find((i) => i.id === step.id);
      if (!inter) {
        err("SCRIPT", `${label} interaction ${step.id} not in ${state.room}`, d.id);
        return null;
      }
      if (!flagOk(inter, state.flags) || !keyOk(inter, state.keys) || !hasToolNeed(inter, tools)) {
        err("SCRIPT", `${label} cannot use ${step.id} in ${state.room}`, d.id);
        return null;
      }
      for (const f of inter.setsFlags || []) state.flags.add(f);
      for (const k of inter.givesKeys || []) state.keys.add(k);
      for (const ev of inter.givesEvidence || []) state.evidence.add(ev);
      if (typeof inter.setsLevel === "number") state.level = inter.setsLevel;
      steps++;
    } else {
      err("SCRIPT", `${label} unknown action`, d.id);
      return null;
    }
  }
  return { ...state, steps };
}

function searchGraph(d, tools, err, label, opts = {}) {
  const roomById = new Map(d.rooms.map((r) => [r.id, r]));
  const start = {
    room: d.entranceRoom,
    level: d.initialLevel ?? null,
    flags: new Set(d.entry?.assumedGrantedFlags || []),
    keys: new Set(),
  };
  const keyOf = (s) => `${s.room}|${s.level ?? ""}|${[...s.flags].sort().join(",")}|${[...s.keys].sort().join(",")}`;
  const visited = new Set();
  const rooms = new Set();
  const edges = [];
  const q = [start];
  visited.add(keyOf(start));
  rooms.add(start.room);
  let guard = 0;
  while (q.length) {
    if (++guard > 250000) {
      err("STRAND", `${label} search exceeded 250000 states`, d.id);
      break;
    }
    const s = q.shift();
    const room = roomById.get(s.room);
    if (!room) continue;
    const moves = [];
    for (const ex of room.exits || []) {
      if (ex.external) continue;
      if (opts.skipOptionalRooms && roomById.get(ex.to)?.optional) continue;
      if (!flagOk(ex, s.flags) || !keyOk(ex, s.keys) || !hasToolNeed(ex, tools) || !levelOk(ex, s.level)) continue;
      if (ex.needFins && !tools.has("creekFins")) continue;
      const n = { room: ex.to, level: s.level, flags: new Set(s.flags), keys: new Set(s.keys) };
      for (const f of ex.setsFlags || []) n.flags.add(f);
      moves.push(n);
    }
    for (const inter of room.interactions || []) {
      if (!flagOk(inter, s.flags) || !keyOk(inter, s.keys) || !hasToolNeed(inter, tools)) continue;
      if ((inter.requiresTools || []).includes("creekFins") && !tools.has("creekFins")) continue;
      const n = { room: s.room, level: s.level, flags: new Set(s.flags), keys: new Set(s.keys) };
      let changed = false;
      for (const f of inter.setsFlags || []) if (!n.flags.has(f)) { n.flags.add(f); changed = true; }
      for (const k of inter.givesKeys || []) if (!n.keys.has(k)) { n.keys.add(k); changed = true; }
      if (typeof inter.setsLevel === "number" && inter.setsLevel !== s.level) { n.level = inter.setsLevel; changed = true; }
      if (changed) moves.push(n);
    }
    for (const n of moves) {
      const k = keyOf(n);
      edges.push([keyOf(s), k]);
      if (visited.has(k)) continue;
      visited.add(k);
      rooms.add(n.room);
      q.push(n);
    }
  }

  const entranceKeys = [...visited].filter((k) => k.startsWith(`${d.entranceRoom}|`));
  const rev = new Map();
  for (const [a, b] of edges) {
    if (!rev.has(b)) rev.set(b, []);
    rev.get(b).push(a);
  }
  const canReturn = new Set(entranceKeys);
  const rq = [...entranceKeys];
  while (rq.length) {
    const c = rq.shift();
    for (const p of rev.get(c) || []) {
      if (canReturn.has(p)) continue;
      canReturn.add(p);
      rq.push(p);
    }
  }
  const strands = [];
  for (const k of visited) if (!canReturn.has(k)) strands.push(k);

  const goal = [...visited].some((k) => k.split("|")[2].split(",").includes(d.goalFlag));
  const keyProofs = proveKeys(d, tools, roomById, err);
  return { rooms, states: visited.size, goal, strands, keyProofs };
}

function proveKeys(d, tools, roomById, err) {
  const errors = [];
  for (const key of d.keys || []) {
    const blocked = new Set();
    for (const room of d.rooms) {
      for (const ex of room.exits || []) if ((ex.requiresKeys || []).includes(key.id)) blocked.add(`${room.id}:${ex.id}`);
    }
    const reached = reachableInteractions(d, tools, roomById, blocked);
    const src = `${key.source.room}:${key.source.interaction}`;
    if (!reached.has(src)) errors.push(`${key.id} is not reachable without using its own lock (${src})`);
  }
  void err;
  return { ok: errors.length === 0, errors };
}

function reachableInteractions(d, tools, roomById, blockedExits) {
  const start = {
    room: d.entranceRoom,
    level: d.initialLevel ?? null,
    flags: new Set(d.entry?.assumedGrantedFlags || []),
    keys: new Set(),
  };
  const keyOf = (s) => `${s.room}|${s.level ?? ""}|${[...s.flags].sort().join(",")}|${[...s.keys].sort().join(",")}`;
  const seen = new Set([keyOf(start)]);
  const grants = new Set();
  const q = [start];
  while (q.length) {
    const s = q.shift();
    const room = roomById.get(s.room);
    if (!room) continue;
    for (const inter of room.interactions || []) {
      if (!flagOk(inter, s.flags) || !keyOk(inter, s.keys) || !hasToolNeed(inter, tools)) continue;
      grants.add(`${room.id}:${inter.id}`);
      const n = { room: s.room, level: s.level, flags: new Set(s.flags), keys: new Set(s.keys) };
      let changed = false;
      for (const f of inter.setsFlags || []) if (!n.flags.has(f)) { n.flags.add(f); changed = true; }
      for (const k of inter.givesKeys || []) if (!n.keys.has(k)) { n.keys.add(k); changed = true; }
      if (typeof inter.setsLevel === "number" && inter.setsLevel !== s.level) { n.level = inter.setsLevel; changed = true; }
      if (changed) {
        const id = keyOf(n);
        if (!seen.has(id)) { seen.add(id); q.push(n); }
      }
    }
    for (const ex of room.exits || []) {
      if (ex.external) continue;
      if (blockedExits.has(`${room.id}:${ex.id}`)) continue;
      if (!flagOk(ex, s.flags) || !keyOk(ex, s.keys) || !hasToolNeed(ex, tools) || !levelOk(ex, s.level)) continue;
      if (ex.needFins && !tools.has("creekFins")) continue;
      const n = { room: ex.to, level: s.level, flags: new Set(s.flags), keys: new Set(s.keys) };
      for (const f of ex.setsFlags || []) n.flags.add(f);
      const id = keyOf(n);
      if (!seen.has(id)) { seen.add(id); q.push(n); }
    }
  }
  return grants;
}

function writeGraphs(pack) {
  const dir = join(ROOT, "graphs");
  mkdirSync(dir, { recursive: true });
  const campaign = {
    nodes: [...pack.dungeons.map((d) => d.id), "integration.secondCrown"],
    edges: [
      { from: "dg05", to: "dg06", when: "dg05.boss", kind: "proposed" },
      { from: "dg06", to: "dg07", when: "dg06.boss", kind: "proposed" },
      { from: "dg07", to: "dg08", when: "dg07.boss", kind: "proposed" },
      { from: "dg08", to: "integration.secondCrown", when: "dg08.boss+dg08.record+evidence", kind: "proposed-event" },
    ],
  };
  writeFileSync(join(dir, "campaign.graph.json"), JSON.stringify(campaign, null, 2));
  for (const d of pack.dungeons) {
    const nodes = d.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      optional: !!r.optional,
      requiresOptionalTool: r.requiresOptionalTool || null,
    }));
    const edges = [];
    for (const r of d.rooms) {
      for (const ex of r.exits || []) {
        if (ex.external) continue;
        edges.push({
          from: r.id,
          to: ex.to,
          id: ex.id,
          dir: ex.dir,
          requiresFlags: ex.requiresFlags || [],
          requiresKeys: ex.requiresKeys || [],
          requiresTools: ex.requiresTools || [],
          needFins: !!ex.needFins,
          openAtLevels: ex.openAtLevels,
          shortcut: !!ex.shortcut,
          optional: !!ex.optional,
        });
      }
    }
    const flags = [];
    for (const r of d.rooms) {
      for (const inter of r.interactions || []) {
        for (const f of inter.setsFlags || []) flags.push({ flag: f, setIn: r.id, by: inter.id });
      }
    }
    writeFileSync(join(dir, `${d.id}.graph.json`), JSON.stringify({ dungeon: d.id, nodes, edges, flags }, null, 2));
    const lines = ["flowchart TD"];
    for (const n of nodes) lines.push(`  ${n.id.replaceAll(".", "_")}["${n.name.replaceAll('"', "'")}"]`);
    for (const e of edges) {
      const needs = [...e.requiresFlags, ...e.requiresKeys, ...(e.needFins ? ["fins"] : [])].join(" ");
      const label = needs ? `${e.dir || ""} ${needs}` : e.dir || "";
      lines.push(`  ${e.from.replaceAll(".", "_")} -->|${label}| ${e.to.replaceAll(".", "_")}`);
    }
    writeFileSync(join(dir, `${d.id}.mmd`), lines.join("\n") + "\n");
  }
}

function main() {
  const pack = JSON.parse(readFileSync(join(ROOT, "content", "pack.json"), "utf8"));
  const result = validatePack(pack);
  writeGraphs(pack);
  const report = {
    ok: result.ok,
    designValidation: true,
    enginePlaytesting: false,
    note: "This report is a static check of the content graph. It is not a playtest of combat, animation, or rendering.",
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    errors: result.errors,
    warnings: result.warnings,
    stats: result.stats,
  };
  writeFileSync(join(ROOT, "validation-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: report.ok, errors: report.errorCount, warnings: report.warningCount, stats: report.stats }, null, 2));
  if (!report.ok) {
    for (const e of report.errors.slice(0, 80)) console.log(`${e.code}\t${e.where || ""}\t${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("validate.mjs")) main();
