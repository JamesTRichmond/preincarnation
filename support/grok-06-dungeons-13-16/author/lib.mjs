/**
 * Engine-neutral helpers for the DG13–DG16 packet.
 * Layouts, puzzles, and ending text are authored literals.
 * This module only carves specified walls, evaluates conditions,
 * and classifies persistence. It does not invent rooms.
 */

export const BOUNDS = { w: 18, h: 11 };

export function ex(id, facing, x, y, to, lx, ly, requires = []) {
  return {
    id,
    facing,
    tile: { x, y },
    landing: { room: to, x: lx, y: ly },
    requires: [...requires],
    kind: "door",
  };
}

export const N = (to, requires = []) => ex("north", "north", 9, 0, to, 9, 9, requires);
export const S = (to, requires = []) => ex("south", "south", 9, 10, to, 9, 1, requires);
export const E = (to, requires = []) => ex("east", "east", 17, 5, to, 1, 5, requires);
export const W = (to, requires = []) => ex("west", "west", 0, 5, to, 16, 5, requires);

export function obj(id, name, x, y, kind, extra = {}) {
  return {
    id,
    name,
    kind,
    pos: { x, y },
    blocksMovement: extra.blocksMovement ?? false,
    tool: extra.tool ?? null,
    inscription: extra.inscription ?? null,
    text: extra.text ?? null,
    textByDecision: extra.textByDecision ?? null,
    note: extra.note ?? null,
  };
}

export function actor(id, name, x, y, kind, lines, extra = {}) {
  return {
    id,
    name,
    kind,
    pos: { x, y },
    solid: extra.solid ?? true,
    joinsParty: false,
    dialogue: lines.map((text, i) => ({ id: `${id}.line${i + 1}`, text })),
    onDeathReset: extra.onDeathReset ?? "return-to-start",
    start: { x, y },
  };
}

export function step(partial) {
  return {
    action: partial.action,
    note: partial.note,
    target: partial.target ?? null,
    tool: partial.tool ?? null,
    exit: partial.exit ?? null,
    event: partial.event ?? null,
    line: partial.line ?? null,
    script: partial.script ?? null,
    machine: partial.machine ?? null,
    requires: partial.requires ?? [],
    requiresAbsent: partial.requiresAbsent ?? [],
    sets: partial.sets ?? [],
    clears: partial.clears ?? [],
    value: partial.value ?? true,
  };
}

export function room(spec) {
  if (!spec.id || !spec.dungeon || !spec.name) {
    throw new Error("room missing id/dungeon/name");
  }
  return {
    bounds: spec.bounds ?? { ...BOUNDS },
    tileset: spec.tileset ?? "addison-interior",
    environment: spec.environment ?? null,
    checkpoint: Boolean(spec.checkpoint),
    walls: spec.walls ?? [],
    tiles: spec.tiles ?? [],
    alternates: spec.alternates ?? [],
    orderPuzzle: spec.orderPuzzle ?? null,
    death: spec.death ?? { hazards: [] },
    actors: spec.actors ?? [],
    objects: spec.objects ?? [],
    exits: spec.exits ?? [],
    solution: spec.solution,
    persistenceNote: spec.persistenceNote ?? null,
    purpose: spec.purpose,
    layoutNote: spec.layoutNote,
    ...spec,
  };
}

const WALK = new Set([".", "D", "~", "V", "=", ",", ":", "+"]);
const STAND = new Set([".", "D", "=", ",", ":", "+"]);

export function carve(spec) {
  const { w, h } = spec.bounds;
  if (!w || !h) throw new Error(`${spec.id} missing bounds`);
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => "."));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) grid[y][x] = "#";
    }
  }
  for (const wall of spec.walls || []) {
    for (let y = wall.y; y < wall.y + wall.h; y++) {
      for (let x = wall.x; x < wall.x + wall.w; x++) {
        if (y < 0 || x < 0 || y >= h || x >= w) {
          throw new Error(`${spec.id} wall out of bounds ${x},${y}`);
        }
        grid[y][x] = "#";
      }
    }
  }
  for (const t of spec.tiles || []) {
    if (t.y < 0 || t.x < 0 || t.y >= h || t.x >= w) {
      throw new Error(`${spec.id} tile out of bounds`);
    }
    if (grid[t.y][t.x] === "#") {
      throw new Error(`${spec.id} special tile on wall at ${t.x},${t.y}`);
    }
    grid[t.y][t.x] = t.tile;
  }
  for (const exit of spec.exits || []) {
    const { x, y } = exit.tile;
    if (y < 0 || x < 0 || y >= h || x >= w) throw new Error(`${spec.id} exit OOB ${exit.id}`);
    grid[y][x] = "D";
  }
  const rows = grid.map((r) => r.join(""));
  if (rows.some((r) => r.length !== w)) throw new Error(`${spec.id} ragged row`);
  return rows;
}

export function tileAt(rows, x, y) {
  if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) return null;
  return rows[y][x];
}

export function isEphemeral(flag) {
  if (typeof flag !== "string") return false;
  if (flag.startsWith("strike.")) return true;
  if (flag.startsWith("hazard.")) return true;
  if (flag.startsWith("staged.line")) return true;
  if (flag.includes(".progress.")) return true;
  if (flag === "meta.embryonic") return true;
  return false;
}

export function evalCond(cond, state, event = null) {
  if (!cond || cond.op === "always") return true;
  switch (cond.op) {
    case "flag": {
      const v = state.flags[cond.flag];
      if (Object.prototype.hasOwnProperty.call(cond, "eq")) return v === cond.eq;
      return v !== undefined && v !== false && v !== null;
    }
    case "absent":
      return state.flags[cond.flag] === undefined || state.flags[cond.flag] === false;
    case "not":
      return !evalCond(cond.cond, state, event);
    case "and":
      return cond.conds.every((c) => evalCond(c, state, event));
    case "or":
      return cond.conds.some((c) => evalCond(c, state, event));
    case "tool":
      return state.flags[`tool.${cond.tool}`] === true;
    case "decision":
      return cond.in.includes(state.decisions[cond.decision]);
    case "eventArg":
      return event != null && event[cond.arg] === cond.eq;
    case "gte":
      return (state.flags[cond.flag] || 0) >= cond.value;
    case "endingEligible":
      if (!state.eligibility) throw new Error("endingEligible without eligibility on state");
      return endingEligibility(state, state.eligibility)[cond.ending] === true;
    case "eventInstitution": {
      if (!state.eligibility || !event) return false;
      const domain = event[cond.arg];
      const allowed = state.eligibility.institutions[domain];
      return Array.isArray(allowed) && allowed.includes(state.decisions[domain]);
    }
    default:
      throw new Error(`unknown cond op ${cond.op}`);
  }
}

export function hasFlag(state, flag) {
  const v = state.flags[flag];
  return v !== undefined && v !== false && v !== null;
}

export function cloneState(state) {
  return {
    flags: { ...state.flags },
    decisions: { ...state.decisions },
    spawn: state.spawn ? { ...state.spawn } : null,
    vignetteIndex: state.vignetteIndex ?? 0,
    visitOrder: [...(state.visitOrder || [])],
    machines: state.machines || null,
    eligibility: state.eligibility || null,
  };
}

export function applySets(state, sets = [], value = true, event = null) {
  for (const item of sets) {
    if (typeof item === "string") {
      state.flags[item] = value;
      continue;
    }
    let flag = item.flag;
    if (item.flagFromArg) flag = `${item.prefix || ""}${event[item.flagFromArg]}`;
    if (item.op === "add") {
      state.flags[flag] = (state.flags[flag] || 0) + (item.amount ?? 1);
      continue;
    }
    if (item.valueFromArg) {
      state.flags[flag] = event[item.valueFromArg];
      continue;
    }
    state.flags[flag] = Object.prototype.hasOwnProperty.call(item, "value") ? item.value : true;
  }
}

export function applyClears(state, clears = []) {
  for (const f of clears) delete state.flags[f];
}

export function baseState(decisions) {
  const flags = {
    "meta.enteredFinalQuarter": true,
    "body.coatEquipped": true,
    "meta.year": 1884,
    "meta.deathCount": 0,
    "body.id": "ellis-body-0",
  };
  for (const tool of TOOL_IDS) flags[`tool.${tool}`] = true;
  return {
    flags,
    decisions: { ...decisions },
    spawn: { room: "DG13.R01", x: 9, y: 9 },
    vignetteIndex: 0,
    visitOrder: [],
  };
}

export const TOOL_IDS = [
  "field-chain",
  "range-rod",
  "transit-glass",
  "plumb-bob",
  "office-lamp",
  "field-knife",
  "field-book",
  "county-bell",
  "office-seal",
  "marble-needle",
  "sounding-lead",
  "borrowed-coat",
];

export function institutionsReady(state, eligibility) {
  for (const [domain, allowed] of Object.entries(eligibility.institutions)) {
    if (!allowed.includes(state.decisions[domain])) return false;
  }
  return true;
}

export function witnessesReady(state, eligibility) {
  return eligibility.witnessFlags.every((f) => hasFlag(state, f));
}

export function reachedReady(state, eligibility) {
  return eligibility.reachedFlags.every((f) => hasFlag(state, f));
}

export function endingEligibility(state, eligibility) {
  const reached = reachedReady(state, eligibility);
  const witnesses = witnessesReady(state, eligibility);
  const institutions = institutionsReady(state, eligibility);
  const locked = hasFlag(state, "campaign.ending");
  const out = {};
  for (const [id, rule] of Object.entries(eligibility.endings)) {
    let ok = !locked;
    if (rule.requiresReached) ok = ok && reached;
    if (rule.requiresWitnesses) ok = ok && witnesses;
    if (rule.requiresInstitutions) ok = ok && institutions;
    out[id] = ok;
  }
  return out;
}

export function traceFor(spec) {
  const lines = [];
  let n = 1;
  for (const s of spec.solution.steps) {
    lines.push(formatStep(n, s));
    n += 1;
    if (s.action === "boss" && Array.isArray(s.script)) {
      for (const ev of s.script) {
        lines.push(
          `  ${n - 1}.${ev.event}: ${ev.note || ""} tool=${ev.tool || "none"}`,
        );
      }
    }
  }
  lines.push(
    `${n}. Room clear is recorded as cleared.${spec.id}. Death does not erase it.`,
  );
  return lines;
}

function formatStep(n, s) {
  const bits = [
    `${n}. ${s.note}`,
    `action=${s.action}`,
    s.target ? `target=${s.target}` : null,
    s.exit ? `exit=${s.exit}` : null,
    s.tool ? `tool=${s.tool}` : "tool=none",
    `requires=${s.requires.length ? s.requires.join(" & ") : "none"}`,
    s.requiresAbsent?.length ? `absent=${s.requiresAbsent.join(" & ")}` : null,
    `sets=${s.sets.length ? s.sets.join(" & ") : "none"}`,
  ].filter(Boolean);
  return bits.join(" | ");
}

export function expandRoom(spec) {
  const rows = carve(spec);
  const produces = new Set();
  for (const s of spec.solution.steps) {
    for (const f of s.sets || []) produces.add(typeof f === "string" ? f : f.flag);
  }
  for (const alt of spec.alternates || []) {
    for (const s of alt.steps || []) {
      for (const f of s.sets || []) produces.add(typeof f === "string" ? f : f.flag);
    }
  }
  produces.add(`cleared.${spec.id}`);
  produces.add(`visited.${spec.id}`);
  const survivesDeath = [];
  const resetsOnDeath = [`strike.${spec.region}`, `hazard.${spec.id}`, "meta.embryonic"];
  for (const f of produces) {
    if (isEphemeral(f)) resetsOnDeath.push(f);
    else survivesDeath.push(f);
  }
  const transitions = [];
  for (const s of spec.solution.steps) {
    if (s.action === "traverse") {
      const exit = spec.exits.find((e) => e.id === s.exit);
      transitions.push({
        id: `tr.${spec.id}.${s.exit}`,
        kind: "exit",
        when: { op: "and", conds: (s.requires || []).map((f) => ({ op: "flag", flag: f })) },
        exit: s.exit,
        to: exit ? exit.landing : null,
      });
    } else {
      transitions.push({
        id: `tr.${spec.id}.${s.action}.${s.target || s.event || nKey(transitions.length)}`,
        kind: s.action,
        target: s.target,
        tool: s.tool,
        sets: s.sets,
        requires: s.requires,
        requiresAbsent: s.requiresAbsent,
      });
    }
  }
  return {
    id: spec.id,
    dungeon: spec.dungeon,
    name: spec.name,
    environment: spec.environment,
    region: spec.region,
    checkpoint: spec.checkpoint,
    purpose: spec.purpose,
    layoutNote: spec.layoutNote,
    bounds: { ...spec.bounds, unit: "tile" },
    tileset: spec.tileset,
    legend: {
      "#": "wall",
      ".": "floor",
      D: "door",
      "~": "water",
      V: "void",
      "=": "ice",
      ",": "snow",
      ":": "bridge",
      "+": "marked-station",
    },
    layout: { rows },
    exits: spec.exits,
    actors: spec.actors,
    objects: spec.objects,
    transitions,
    persistence: {
      visitedFlag: `visited.${spec.id}`,
      survivesDeath,
      resetsOnDeath: [...new Set(resetsOnDeath)],
      checkpoint: spec.checkpoint,
      region: spec.region,
      onLeave: [`visited.${spec.id}`],
      note:
        spec.persistenceNote ||
        "Puzzle results and discoveries remain after a death. Strike counts, embryonic form, and in-progress boss indices do not. Actor positions return to their starts.",
    },
    solution: {
      id: "main",
      when: spec.solution.when ?? { op: "always" },
      steps: spec.solution.steps,
    },
    alternates: spec.alternates,
    solutionTrace: traceFor(spec),
    death: spec.death,
    orderPuzzle: spec.orderPuzzle,
    produces: [...produces],
  };
}

function nKey(n) {
  return String(n);
}

export function assertRoomGeometry(room) {
  const rows = room.layout.rows;
  const { w, h } = room.bounds;
  if (rows.length !== h) throw new Error(`${room.id} height ${rows.length} != ${h}`);
  rows.forEach((r, i) => {
    if (r.length !== w) throw new Error(`${room.id} row ${i} width ${r.length}`);
  });
  for (const exit of room.exits) {
    const t = tileAt(rows, exit.tile.x, exit.tile.y);
    if (t !== "D") {
      throw new Error(`${room.id} exit ${exit.id} at ${exit.tile.x},${exit.tile.y} is '${t}' not D`);
    }
  }
  for (const o of room.objects) {
    const t = tileAt(rows, o.pos.x, o.pos.y);
    if (!STAND.has(t)) {
      throw new Error(`${room.id} object ${o.id} on non-stand tile '${t}' at ${o.pos.x},${o.pos.y}`);
    }
  }
  for (const a of room.actors) {
    const t = tileAt(rows, a.pos.x, a.pos.y);
    if (!STAND.has(t)) {
      throw new Error(`${room.id} actor ${a.id} on non-stand tile '${t}' at ${a.pos.x},${a.pos.y}`);
    }
  }
  for (const hazard of room.death?.hazards || []) {
    if (!room.objects.some((o) => o.id === hazard.tell)) {
      throw new Error(`${room.id} hazard ${hazard.id} missing tell ${hazard.tell}`);
    }
    for (const tile of hazard.tiles || []) {
      const t = tileAt(rows, tile.x, tile.y);
      if (!WALK.has(t) && t !== "~" && t !== "V") {
        throw new Error(`${room.id} hazard tile ${tile.x},${tile.y} is wall`);
      }
    }
  }
}

export function solveMain(room, state) {
  if (!evalCond(room.solution.when, state)) {
    throw new Error(`${room.id} main solution when-clause failed`);
  }
  const deferred = [];
  for (const s of room.solution.steps) {
    if (s.action === "traverse") {
      deferred.push(s);
      continue;
    }
    applyStep(room, s, state);
  }
  state.flags[`cleared.${room.id}`] = true;
  state.flags[`visited.${room.id}`] = true;
  state.visitOrder.push(room.id);
  for (const s of deferred) applyStep(room, s, state);
}

function applyStep(room, s, state) {
  for (const req of s.requires || []) {
    if (!hasFlag(state, req)) {
      throw new Error(`${room.id} step '${s.note}' missing required flag ${req}`);
    }
  }
  for (const req of s.requiresAbsent || []) {
    if (hasFlag(state, req)) {
      throw new Error(`${room.id} step '${s.note}' requires absent ${req}`);
    }
  }
  if (s.tool && state.flags[`tool.${s.tool}`] !== true) {
    throw new Error(`${room.id} step missing tool ${s.tool}`);
  }
  if (s.target) {
    const known =
      room.objects.some((o) => o.id === s.target) ||
      room.actors.some((a) => a.id === s.target);
    if (!known) throw new Error(`${room.id} step target ${s.target} not in room`);
  }
  if (s.action === "traverse") {
    const exit = room.exits.find((e) => e.id === s.exit);
    if (!exit) throw new Error(`${room.id} traverse missing exit ${s.exit}`);
    for (const req of exit.requires || []) {
      if (!hasFlag(state, req)) {
        throw new Error(`${room.id} exit ${s.exit} missing ${req}`);
      }
    }
  } else if (s.action === "boss") {
    if (!s.machine) throw new Error(`${room.id} boss step missing machine`);
    const machine = state.machines?.[s.machine];
    if (!machine) throw new Error(`${room.id} unknown machine ${s.machine}`);
    const start = bossEntryNode(machine, state.flags);
    const result = runFsm(machine, s.script || [], state, start);
    if (!result.ok) {
      throw new Error(
        `${room.id} boss ${s.machine} failed: ${result.reason} (node ${result.node})`,
      );
    }
  }
  applySets(state, s.sets || [], s.value);
  applyClears(state, s.clears || []);
}

export function reachable(rooms, state0) {
  const byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
  const state = cloneState(state0);
  const seen = new Set();
  const edges = [];
  const edgeKeys = new Set();
  const entryFlags = {};
  const queue = ["DG13.R01"];
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    const room = byId[id];
    if (!room) throw new Error(`missing room ${id}`);
    entryFlags[id] = { ...state.flags };
    solveMain(room, state);
    seen.add(id);
    let opened = true;
    while (opened) {
      opened = false;
      for (const sid of seen) {
        for (const exit of byId[sid].exits) {
          const dest = exit.landing.room;
          const key = `${sid}|${exit.id}|${dest}`;
          const open = (exit.requires || []).every((f) => hasFlag(state, f));
          if (!open) continue;
          if (!edgeKeys.has(key)) {
            edgeKeys.add(key);
            edges.push({ from: sid, exit: exit.id, to: dest, requires: exit.requires });
          }
          if (!seen.has(dest) && !queue.includes(dest)) {
            queue.push(dest);
            opened = true;
          }
        }
      }
    }
  }
  return { seen, state, edges, byId, entryFlags };
}

export function runFsm(machine, script, state, startNode = null) {
  let node = startNode || machine.initial;
  enterState(machine, node, state);
  for (const ev of script) {
    const st = machine.states[node];
    if (!st) return { ok: false, success: false, reason: `missing state ${node}`, node, event: ev.event };
    const tr = (st.transitions || []).find(
      (t) => t.event === ev.event && evalCond(t.guard, state, ev),
    );
    if (!tr) {
      return { ok: false, success: false, reason: `no transition from ${node} on ${ev.event}`, node, event: ev.event };
    }
    if (tr.reject) {
      return { ok: false, success: false, reason: tr.reject, node, event: ev.event };
    }
    applySets(state, tr.set || [], true, ev);
    applyClears(state, tr.clear || []);
    if (tr.spawn) state.spawn = { ...tr.spawn };
    if (tr.to && tr.to !== node) {
      node = tr.to;
      enterState(machine, node, state);
    } else if (tr.to) {
      node = tr.to;
    }
  }
  const st = machine.states[node];
  const terminal = Boolean(st?.terminal);
  const success = Boolean(st?.success);
  return {
    ok: terminal && success,
    success,
    terminal,
    reason: terminal ? (success ? null : st.failureReason || "failure-terminal") : "not-terminal",
    node,
  };
}

function enterState(machine, node, state) {
  const st = machine.states[node];
  if (!st) return;
  applySets(state, st.onEnter || []);
}

export function bossEntryNode(machine, flags) {
  for (const rule of machine.entryOrder || []) {
    if (rule.always) return rule.state;
    if (flags[rule.ifFlag] !== undefined && flags[rule.ifFlag] !== false) return rule.state;
  }
  return machine.initial;
}

export function applyDeath(state, ctx) {
  const next = cloneState(state);
  if (next.flags["meta.terminal"] === true || next.flags["meta.deathEnabled"] === false) {
    return { ok: false, reason: "death-disabled-terminal", state: cloneState(state) };
  }
  next.flags["meta.year"] = (next.flags["meta.year"] || 0) + 14;
  next.flags["meta.deathCount"] = (next.flags["meta.deathCount"] || 0) + 1;
  next.flags["body.id"] = `ellis-body-${next.flags["meta.deathCount"]}`;
  if (next.flags["staged.coatOnSeamPeg"] === "current") {
    next.flags["staged.coatOnSeamPeg"] = "previous";
    next.flags["body.coatEquipped"] = true;
    next.flags[`anchor.previousCoat.${next.flags["meta.deathCount"]}`] = ctx.anchor || ctx.checkpoint?.room || true;
  } else if (ctx.embryonic && ctx.anchor) {
    next.flags["body.coatEquipped"] = true;
    next.flags[`anchor.previousCoat.${next.flags["meta.deathCount"]}`] = ctx.anchor;
  } else {
    next.flags["body.coatEquipped"] = true;
  }
  for (const key of Object.keys(next.flags)) {
    if (isEphemeral(key)) delete next.flags[key];
  }
  next.flags["meta.embryonic"] = false;
  delete next.flags["staged.line"];
  next.spawn = { ...ctx.checkpoint };
  if (hasFlag(next, "campaign.ending") && ctx.duringVignette) {
    next.vignetteIndex = state.vignetteIndex;
    next.spawn = { room: "DG16.SEAM", x: 9, y: 8 };
  }
  next.flags["body.coatEquipped"] = next.flags["body.coatEquipped"] !== false;
  return { ok: true, reason: null, state: next };
}

export function checkpointFor(roomsById, visitOrder, currentRoomId) {
  const region = roomsById[currentRoomId].region;
  const idx = visitOrder.lastIndexOf(currentRoomId);
  const prior = idx === -1 ? visitOrder : visitOrder.slice(0, idx + 1);
  const hits = prior.filter((id) => roomsById[id]?.region === region && roomsById[id].checkpoint);
  const id = hits.length ? hits[hits.length - 1] : currentRoomId;
  const room = roomsById[id];
  return { room: id, x: 9, y: 9, region: room.region };
}

export { WALK, STAND };
