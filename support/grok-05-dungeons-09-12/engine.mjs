/**
 * Engine-neutral dungeon simulator for PREINCARNATION DG09–DG12.
 * Deterministic. No randomness, no economy, no weather clock.
 * God-form never inherits fins, cape, or mortal hands.
 */
export class EngineError extends Error {
  constructor(code, message, detail = null) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function roomById(dungeon, id) {
  const room = dungeon.rooms.find((r) => r.id === id);
  if (!room) throw new EngineError("NO_ROOM", `Unknown room ${id}`);
  return room;
}

function hasTool(state, tool) {
  return state.tools.has(tool);
}

function flagsOk(state, when) {
  if (!when) return true;
  if (when.never) return false;
  const all = when.all || [];
  const any = when.any || [];
  if (!all.every((f) => state.flags.has(f))) return false;
  if (any.length && !any.some((f) => state.flags.has(f))) return false;
  return true;
}

function conditionalOpen(room, state, x, y) {
  const rules = room.conditionalTerrain || [];
  return rules.some((rule) => {
    const hit = (rule.tiles || []).some(([tx, ty]) => tx === x && ty === y);
    if (!hit) return false;
    return flagsOk(state, { all: rule.requiresAll || [], any: rule.requiresAny || [] });
  });
}

export function walkable(dungeon, state, room, x, y) {
  if (x < 0 || y < 0 || y >= room.height || x >= room.width) return false;
  const t = room.layers.terrain[y][x];
  if (t === "#" ) return false;
  if (t === "." || t === "," || t === "=" || t === "^" || t === "S") return true;
  if (t === "+" || t === "V") return conditionalOpen(room, state, x, y);
  if (t === "G") {
    if (conditionalOpen(room, state, x, y)) return true;
    return state.form === "mortal" && hasTool(state, "cape");
  }
  if (t === "~") return state.form === "mortal" && hasTool(state, "fins");
  if (t === "!") return true;
  return false;
}

export const tracedTiles = new Map();
let traceOn = false;

export function enableTrace(on) {
  traceOn = !!on;
  if (traceOn) tracedTiles.clear();
}

function rememberTile(roomId, x, y) {
  if (!traceOn || roomId == null || String(roomId).startsWith("COUNTY")) return;
  if (!tracedTiles.has(roomId)) tracedTiles.set(roomId, new Set());
  tracedTiles.get(roomId).add(`${x},${y}`);
}

function inBounds(room, x, y) {
  return x >= 0 && y >= 0 && x < room.width && y < room.height;
}

function pathTiles(dungeon, state, room, from, to) {
  const [sx, sy] = from;
  const [gx, gy] = to;
  if (!inBounds(room, gx, gy) || !walkable(dungeon, state, room, gx, gy)) return null;
  if (sx === gx && sy === gy) return [[sx, sy]];
  const q = [[sx, sy]];
  const seen = new Set([`${sx},${sy}`]);
  const parent = new Map();
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key)) continue;
      if (!walkable(dungeon, state, room, nx, ny)) continue;
      seen.add(key);
      parent.set(key, [x, y]);
      if (nx === gx && ny === gy) {
        const path = [[gx, gy]];
        let cur = [gx, gy];
        while (cur[0] !== sx || cur[1] !== sy) {
          cur = parent.get(`${cur[0]},${cur[1]}`);
          path.push(cur);
        }
        return path;
      }
      q.push([nx, ny]);
    }
  }
  return null;
}

export function pathExists(dungeon, state, room, from, to) {
  return !!pathTiles(dungeon, state, room, from, to);
}

function adjacent(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1;
}

function ensureForm(inter, state) {
  if (inter.requiresForm && state.form !== inter.requiresForm) {
    throw new EngineError("FORM_REQUIRED", inter.failText?.form || "Mortal form required.");
  }
}

function ensureTools(inter, state) {
  for (const tool of inter.requiresTools || []) {
    if (!hasTool(state, tool)) {
      throw new EngineError("TOOL_REQUIRED", inter.failText?.tool || `Need ${tool}.`, { tool });
    }
  }
}

function ensureFlags(inter, state) {
  for (const f of inter.requiresFlags || []) {
    if (!state.flags.has(f)) {
      throw new EngineError("FLAG_MISSING", inter.failText?.flags || `Missing ${f}.`, { flag: f });
    }
  }
}

function grantItem(state, id, count = 1) {
  const unique = id !== "wedge";
  const have = state.items.get(id) || 0;
  if (unique && have >= 1) return false;
  state.items.set(id, have + count);
  return true;
}

function setFlags(state, flags) {
  for (const f of flags || []) state.flags.add(f);
}

export function createState(dungeon, overrides = {}) {
  const entryRoom = roomById(dungeon, dungeon.entry.room);
  const state = {
    dungeonId: dungeon.id,
    roomId: dungeon.entry.room,
    x: dungeon.entry.tile[0],
    y: dungeon.entry.tile[1],
    form: "mortal",
    hp: dungeon.maxHp ?? 6,
    maxHp: dungeon.maxHp ?? 6,
    tools: new Set(overrides.tools || dungeon.startingTools),
    flags: new Set(overrides.flags || []),
    items: new Map(),
    carrying: null,
    carryKind: null,
    objects: {},
    moths: {},
    seasons: {},
    levers: {},
    seq: {},
    transition: null,
    ferryFrom: null,
    boss: { phase: null, progress: 0, defeated: false, arms: {}, mercy: { netted: [], killed: [] } },
    miniboss: { phase: null, progress: 0, defeated: false, arms: {}, mercy: { netted: [], killed: [] } },
    lastLantern: {
      room: entryRoom.setsLantern ? entryRoom.id : dungeon.entry.room,
      tile: entryRoom.lanternTile || dungeon.entry.tile,
    },
    lastText: "",
    visited: [dungeon.entry.room],
    log: [],
    pins: 0,
  };
  for (const obj of dungeon.transportables || []) {
    state.objects[obj.id] = {
      id: obj.id,
      loc: "home",
      room: obj.home.room,
      tile: [...obj.home.tile],
    };
  }
  for (const moth of dungeon.moths || []) {
    state.moths[moth.id] = {
      id: moth.id,
      loc: "perch",
      room: moth.home.room,
      tile: [...moth.home.tile],
    };
  }
  for (const plot of dungeon.plots || []) {
    state.seasons[plot.id] = { current: "SPRING", grafted: false };
  }
  for (const lever of dungeon.ferry?.levers || []) state.levers[lever] = false;
  if (overrides.items) {
    for (const [k, v] of Object.entries(overrides.items)) state.items.set(k, v);
  }
  return state;
}

export function placeState(dungeon, place = {}) {
  const state = createState(dungeon, {
    tools: place.tools || dungeon.startingTools,
    flags: place.flags || [],
    items: place.items || {},
  });
  state.roomId = place.room;
  state.x = place.tile[0];
  state.y = place.tile[1];
  state.form = place.form || "mortal";
  if (place.seasons) {
    for (const [id, val] of Object.entries(place.seasons)) {
      state.seasons[id] = { current: val.current, grafted: !!val.grafted };
      if (val.grafted) state.flags.add(`season.${id}.${val.current}`);
    }
  }
  if (place.carrying) {
    state.carrying = place.carrying.id;
    state.carryKind = place.carrying.kind;
    if (place.carrying.kind === "object") {
      const o = state.objects[place.carrying.id];
      o.loc = "carried";
    }
    if (place.carrying.kind === "moth") {
      state.moths[place.carrying.id].loc = "carried";
    }
  }
  if (place.bossDefeated) {
    state.boss.defeated = true;
    state.boss.phase = "IDLE";
  }
  if (place.minibossDefeated) {
    state.miniboss.defeated = true;
    state.miniboss.phase = "IDLE";
  }
  if (place.levers) {
    for (const [k, v] of Object.entries(place.levers)) state.levers[k] = v;
  }
  if (place.ferryFrom) state.ferryFrom = place.ferryFrom;
  return state;
}

function currentRoom(dungeon, state) {
  return roomById(dungeon, state.roomId);
}

function findInteraction(room, id) {
  const inter = (room.interactions || []).find((i) => i.id === id);
  if (!inter) throw new EngineError("NO_INTERACT", `No interaction ${id} in ${room.id}`);
  return inter;
}

function findPuzzle(room, id) {
  return (room.puzzles || []).find((p) => p.id === id);
}

function composeMilepost(dungeon, state, inter) {
  const bits = [];
  if (inter.alwaysText) bits.push(inter.alwaysText);
  const codex = dungeon.codexFlag && state.flags.has(dungeon.codexFlag) && inter.codexAware;
  for (const f of inter.revealsFlags || []) {
    const meta = dungeon.flagBook[f];
    if (!meta) throw new EngineError("NO_FLAG_BOOK", `Flag ${f} missing from flagBook`);
    if (codex) bits.push(meta.fullRule);
    else bits.push(state.flags.has(f) ? meta.doneText : meta.hint);
  }
  return bits.join(" ");
}

function objectDef(dungeon, id) {
  const obj = (dungeon.transportables || []).find((o) => o.id === id);
  if (!obj) throw new EngineError("NO_OBJECT", `No transportable ${id}`);
  return obj;
}

function mothDef(dungeon, id) {
  const moth = (dungeon.moths || []).find((m) => m.id === id);
  if (!moth) throw new EngineError("NO_MOTH", `No moth ${id}`);
  return moth;
}

function plotDef(dungeon, id) {
  const plot = (dungeon.plots || []).find((p) => p.id === id);
  if (!plot) throw new EngineError("NO_PLOT", `No plot ${id}`);
  return plot;
}

function seasonIndex(name) {
  const order = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "BLACK_SNOW"];
  const i = order.indexOf(name);
  if (i < 0) throw new EngineError("BAD_SEASON", name);
  return i;
}

function nextSeason(name) {
  const order = ["SPRING", "SUMMER", "AUTUMN", "WINTER", "BLACK_SNOW"];
  return order[(seasonIndex(name) + 1) % order.length];
}

function applyStepFlags(dungeon, state) {
  const room = currentRoom(dungeon, state);
  for (const step of room.stepFlags || []) {
    if (step.tile[0] !== state.x || step.tile[1] !== state.y) continue;
    if (step.requiresForm && state.form !== step.requiresForm) continue;
    if (!flagsOk(state, { all: step.requiresFlags || [] })) continue;
    setFlags(state, step.sets || []);
  }
}

function applyHazard(dungeon, state) {
  const room = currentRoom(dungeon, state);
  const t = room.layers.terrain[state.y][state.x];
  if (t !== "!") return;
  const safeAt = room.hazardSafeWhen;
  if (safeAt && flagsOk(state, safeAt)) return;
  state.hp -= 1;
  state.lastText = room.hazardText || "The stored cold bites.";
  if (state.hp <= 0) {
    state.hp = 0;
    die(dungeon, state, "hazard");
  }
}

function resetUngraftedOnLeave(dungeon, state, leavingRoomId) {
  for (const plot of dungeon.plots || []) {
    if (plot.room !== leavingRoomId) continue;
    const s = state.seasons[plot.id];
    if (!s.grafted) s.current = "SPRING";
  }
}

function resetFightIfFleeing(state, leavingRoomId, fight, roomId) {
  if (leavingRoomId === roomId && !fight.defeated) {
    fight.phase = null;
    fight.progress = 0;
    fight.arms = {};
    fight.mercy = { netted: [], killed: [] };
    state.pins = 0;
  }
}

function noteVisit(state, roomId) {
  if (!state.visited.includes(roomId)) state.visited.push(roomId);
}

function updateLantern(dungeon, state, room) {
  if (room.setsLantern) {
    state.lastLantern = { room: room.id, tile: room.lanternTile || [state.x, state.y] };
  }
}

function arrive(dungeon, state, roomId, tile, fromRoomId) {
  if (String(roomId).startsWith("COUNTY")) {
    resetUngraftedOnLeave(dungeon, state, fromRoomId);
    state.roomId = roomId;
    state.x = 0;
    state.y = 0;
    state.transition = null;
    noteVisit(state, roomId);
    return;
  }
  const room = roomById(dungeon, roomId);
  resetUngraftedOnLeave(dungeon, state, fromRoomId);
  resetFightIfFleeing(state, fromRoomId, state.boss, dungeon.boss.room);
  resetFightIfFleeing(state, fromRoomId, state.miniboss, dungeon.miniboss.room);
  state.roomId = roomId;
  state.x = tile[0];
  state.y = tile[1];
  state.transition = null;
  noteVisit(state, roomId);
  updateLantern(dungeon, state, room);
  applyStepFlags(dungeon, state);
  applyHazard(dungeon, state);
}

function sendHomeCarried(dungeon, state) {
  if (!state.carrying) return;
  if (state.carryKind === "object") {
    const def = objectDef(dungeon, state.carrying);
    if (def.returnHomeOnTransitionDeath) {
      const o = state.objects[state.carrying];
      o.loc = "home";
      o.room = def.home.room;
      o.tile = [...def.home.tile];
      state.carrying = null;
      state.carryKind = null;
    }
  } else if (state.carryKind === "moth") {
    const def = mothDef(dungeon, state.carrying);
    if (def.returnHomeOnTransitionDeath) {
      const m = state.moths[state.carrying];
      m.loc = "perch";
      m.room = def.home.room;
      m.tile = [...def.home.tile];
      state.carrying = null;
      state.carryKind = null;
    }
  }
}

function resetFights(state) {
  if (!state.boss.defeated) {
    state.boss.phase = null;
    state.boss.progress = 0;
    state.boss.arms = {};
    state.boss.mercy = { netted: [], killed: [] };
  }
  if (!state.miniboss.defeated) {
    state.miniboss.phase = null;
    state.miniboss.progress = 0;
    state.miniboss.arms = {};
    state.miniboss.mercy = { netted: [], killed: [] };
    state.pins = 0;
  }
}

export function die(dungeon, state, reason = "die") {
  const during = !!state.transition;
  if (during) sendHomeCarried(dungeon, state);
  const forced = during ? state.transition.deathLantern : null;
  const lantern = forced || state.lastLantern;
  state.transition = null;
  state.ferryFrom = null;
  state.hp = state.maxHp;
  resetFights(state);
  if ((dungeon.plots || []).some((p) => p.resetOnDeath)) {
    for (const plot of dungeon.plots) {
      if (!plot.resetOnDeath) continue;
      const s = state.seasons[plot.id];
      if (!s.grafted) s.current = "SPRING";
    }
  }
  state.roomId = lantern.room;
  state.x = lantern.tile[0];
  state.y = lantern.tile[1];
  state.lastText = during
    ? "The crossing breaks. Ellis wakes at the last lantern. What was carried home is on its cradle, not gone."
    : "Ellis wakes at the last lantern.";
  state.log.push({ op: "die", reason, room: state.roomId, duringTransition: during });
  noteVisit(state, state.roomId);
}

function beginTransition(dungeon, state, spec) {
  state.transition = {
    id: spec.id,
    step: 0,
    max: spec.steps,
    dest: spec.dest,
    arrival: spec.arrival,
    from: state.roomId,
    deathLantern: spec.deathLantern,
  };
  state.lastText = spec.text || "Crossing.";
}

function doMove(dungeon, state, to) {
  const room = currentRoom(dungeon, state);
  if (state.transition) throw new EngineError("IN_TRANSITION", "Cannot wander mid-crossing.");
  if (!Array.isArray(to) || to.length !== 2) throw new EngineError("BAD_OP", "move.to must be [x,y]");
  if (!inBounds(room, to[0], to[1])) throw new EngineError("OUT_OF_BOUNDS", `${to} outside ${room.id}`);
  const tiles = pathTiles(dungeon, state, room, [state.x, state.y], to);
  if (!tiles) {
    throw new EngineError("NO_PATH", `No mortal-legal path to ${to[0]},${to[1]} in ${room.id}.`, {
      from: [state.x, state.y],
      to,
      terrain: room.layers.terrain[to[1]]?.[to[0]],
    });
  }
  for (const [px, py] of tiles) rememberTile(room.id, px, py);
  state.x = to[0];
  state.y = to[1];
  applyStepFlags(dungeon, state);
  applyHazard(dungeon, state);
}

function doInteract(dungeon, state, id) {
  if (state.transition) throw new EngineError("IN_TRANSITION", "Cannot act mid-crossing.");
  const room = currentRoom(dungeon, state);
  const inter = findInteraction(room, id);
  if (!adjacent([state.x, state.y], inter.tile)) {
    throw new EngineError("NOT_ADJACENT", `${id} is not in reach.`, { tile: inter.tile });
  }
  const kind = inter.kind || "flag";
  if (kind === "milepost") {
    state.lastText = composeMilepost(dungeon, state, inter);
    return;
  }
  ensureForm(inter, state);
  ensureTools(inter, state);
  ensureFlags(inter, state);

  if (kind === "flag" || kind === "grant") {
    if (inter.once && (inter.sets || []).every((f) => state.flags.has(f)) && (inter.sets || []).length) {
      state.lastText = inter.failText?.already || "Already done.";
      return;
    }
    if (kind === "grant") {
      if (inter.sets?.some((f) => state.flags.has(f))) {
        state.lastText = inter.failText?.already || "Already taken.";
        return;
      }
      grantItem(state, inter.item, inter.count || 1);
    }
    if (inter.grantItem) grantItem(state, inter.grantItem, 1);
    setFlags(state, inter.sets);
    state.lastText = inter.successText || "Done.";
    return;
  }

  if (kind === "sequence") {
    const puzzle = findPuzzle(room, inter.sequence);
    if (!puzzle) throw new EngineError("NO_PUZZLE", inter.sequence);
    if ((puzzle.sets || []).every((f) => state.flags.has(f))) {
      state.lastText = inter.failText?.already || "The stones already agreed.";
      return;
    }
    const idx = state.seq[puzzle.id] || 0;
    const expected = puzzle.steps[idx];
    if (inter.id === expected) {
      const next = idx + 1;
      state.seq[puzzle.id] = next;
      if (next >= puzzle.steps.length) {
        setFlags(state, puzzle.sets);
        if (puzzle.grantItem) grantItem(state, puzzle.grantItem, 1);
      }
      state.lastText = inter.successText || "The step holds.";
      return;
    }
    state.seq[puzzle.id] = 0;
    state.lastText = puzzle.failText || "Wrong order.";
    if (inter.id === puzzle.steps[0]) {
      state.seq[puzzle.id] = 1;
      state.lastText = `${puzzle.failText} The first step is taken again.`;
    }
    return;
  }

  if (kind === "lever") {
    state.levers[inter.lever] = !state.levers[inter.lever];
    const on = Object.entries(state.levers)
      .filter(([, v]) => v)
      .map(([k]) => k);
    state.lastText = on.length
      ? `Channel ${on.join("")} is drawn on the loft diagram.`
      : "All channels sit at the default: Hook Hall.";
    return;
  }

  if (kind === "pickup") {
    const obj = state.objects[inter.object];
    const def = objectDef(dungeon, inter.object);
    if (!obj || (obj.loc !== "home" && obj.loc !== "dropped")) {
      throw new EngineError("NOT_THERE", `${inter.object} is not waiting here.`);
    }
    if (obj.room !== room.id) throw new EngineError("NOT_THERE", `${inter.object} is in ${obj.room}.`);
    if (state.carrying) throw new EngineError("HANDS_FULL", "Already carrying something. Hook it, install it, or finish the carry.");
    obj.loc = "carried";
    state.carrying = obj.id;
    state.carryKind = "object";
    state.lastText = inter.successText || `Carrying ${def.id}.`;
    return;
  }

  if (kind === "hook") {
    if (state.carryKind !== "object" || state.carrying !== inter.object) {
      throw new EngineError(
        "WRONG_OBJECT",
        inter.failText?.wrong || "That hook wants its own debt, and nothing else is currency.",
      );
    }
    const obj = state.objects[inter.object];
    obj.loc = "hooked";
    obj.room = room.id;
    obj.tile = [...inter.tile];
    state.carrying = null;
    state.carryKind = null;
    if (inter.grantItem) grantItem(state, inter.grantItem, 1);
    setFlags(state, inter.sets);
    state.lastText = inter.successText || "The line on the ledger is struck by the object itself.";
    return;
  }

  if (kind === "dial") {
    const plot = plotDef(dungeon, inter.plot);
    const season = state.seasons[plot.id];
    if (season.grafted) throw new EngineError("ALREADY_GRAFTED", "The graft holds. Prune it at the bench to turn again.");
    season.current = nextSeason(season.current);
    state.lastText = `${plot.id} shows ${season.current}.`;
    return;
  }

  if (kind === "graft") {
    const plot = plotDef(dungeon, inter.plot);
    if (!plot.graftable) throw new EngineError("NOT_GRAFTABLE", "This dial is a fight-state, not a stored winter.");
    const season = state.seasons[plot.id];
    if (season.grafted) throw new EngineError("ALREADY_GRAFTED", "Already grafted.");
    const wedges = state.items.get("wedge") || 0;
    if (wedges < 1) throw new EngineError("NO_WEDGE", "No graft wedge in hand.");
    state.items.set("wedge", wedges - 1);
    season.grafted = true;
    const flag = `season.${plot.id}.${season.current}`;
    state.flags.add(flag);
    setFlags(state, inter.sets || []);
    state.lastText = inter.successText || `${plot.id} locked as ${season.current}.`;
    return;
  }

  if (kind === "prune") {
    const plot = plotDef(dungeon, inter.plot);
    const season = state.seasons[plot.id];
    if (!season.grafted) {
      state.lastText = "Nothing grafted there.";
      return;
    }
    state.flags.delete(`season.${plot.id}.${season.current}`);
    season.grafted = false;
    season.current = "SPRING";
    grantItem(state, "wedge", 1);
    state.lastText = `${plot.id} is pruned back to SPRING. The wedge returns.`;
    return;
  }

  if (kind === "catch") {
    const moth = state.moths[inter.moth];
    const def = mothDef(dungeon, inter.moth);
    if (!moth || moth.loc !== "perch" || moth.room !== room.id) {
      throw new EngineError("NOT_THERE", `${inter.moth} is not on the perch.`);
    }
    if (state.carrying) throw new EngineError("HANDS_FULL", "The net already holds a moth.");
    moth.loc = "carried";
    state.carrying = moth.id;
    state.carryKind = "moth";
    state.lastText = inter.successText || `${def.id} rests in the net.`;
    return;
  }

  if (kind === "install") {
    if (state.carryKind !== "moth" || !state.carrying) {
      throw new EngineError("LAMP_REJECTED", "The lamp stays dark. The net is empty.");
    }
    const def = mothDef(dungeon, state.carrying);
    if (def.kind !== "ward" || state.carrying !== inter.expectsMoth) {
      state.lastText = "The lamp spits the moth back into the net. Ward lamps take only their named ward moth.";
      throw new EngineError("LAMP_REJECTED", state.lastText);
    }
    const moth = state.moths[state.carrying];
    moth.loc = "lamp";
    moth.room = room.id;
    moth.tile = [...inter.tile];
    state.carrying = null;
    state.carryKind = null;
    setFlags(state, inter.sets);
    state.lastText = inter.successText || "The lamp takes the ward moth and stays lit.";
    return;
  }

  if (kind === "release") {
    if (state.carryKind !== "moth" || !state.carrying) {
      throw new EngineError("NOT_THERE", "No moth in the net.");
    }
    const def = mothDef(dungeon, state.carrying);
    if (def.kind !== "injured") {
      state.lastText = "The grate rejects the ward moth. It remains in the net. The ward is not healed here.";
      throw new EngineError("WARD_REJECTED", state.lastText);
    }
    const moth = state.moths[state.carrying];
    moth.loc = "released";
    moth.room = room.id;
    state.flags.add(`mercy.${def.id}`);
    state.carrying = null;
    state.carryKind = null;
    state.lastText = inter.successText || `${def.id} is released. Mercy is recorded. The Keeper's door does not move.`;
    return;
  }

  if (kind === "fire") {
    if (state.carryKind !== "object" || state.carrying !== inter.object) {
      throw new EngineError("WRONG_OBJECT", "The kiln wants the black-snow clod.");
    }
    const obj = state.objects[state.carrying];
    obj.loc = "fired";
    obj.room = room.id;
    state.carrying = null;
    state.carryKind = null;
    if (inter.grantItem) grantItem(state, inter.grantItem, 1);
    setFlags(state, inter.sets);
    state.lastText = inter.successText || "The clod is fired. It is not lost; it is the lens.";
    return;
  }

  throw new EngineError("BAD_KIND", `Unknown interaction kind ${kind}`);
}

function ferryDest(dungeon, state, which) {
  const ferry = dungeon.ferry;
  if (!ferry) throw new EngineError("NO_FERRY", "This dungeon has no ferry.");
  if (which === "home") {
    if (state.ferryFrom === ferry.homeDock) {
      throw new EngineError("USELESS", "The home plank leads back to the dock Ellis just left.");
    }
    return ferry.homeDock;
  }
  const on = ferry.levers.filter((id) => state.levers[id]);
  if (on.length > 1) {
    throw new EngineError("TANGLE", "One channel. The ledger hates a tangle. Clear the extra levers.");
  }
  const key = on.join("");
  const dest = ferry.table[key];
  if (!dest) throw new EngineError("NO_FERRY", `No route for ${key}`);
  if (dest === state.ferryFrom) {
    throw new EngineError("SAME_DOCK", "The channel lever points at the dock Ellis already stands on.");
  }
  return dest;
}

function doUseExit(dungeon, state, id) {
  if (state.transition) throw new EngineError("IN_TRANSITION", "Already crossing. Tick or die.");
  const room = currentRoom(dungeon, state);
  const conn = (room.connections || []).find((c) => c.id === id);
  if (!conn) throw new EngineError("NO_EXIT", `No exit ${id} in ${room.id}`);
  if (state.x !== conn.tile[0] || state.y !== conn.tile[1]) {
    throw new EngineError("NOT_ON_EXIT", `Stand on the ${id} threshold.`);
  }
  if (conn.kind === "graph") {
    throw new EngineError("NOT_A_DOOR", "That mark is a diagram of the route, not a door.");
  }
  if (conn.kind === "board") {
    if (!flagsOk(state, conn.when)) {
      throw new EngineError("EXIT_CLOSED", conn.closedText || "The ferry is shut.");
    }
    const from = state.roomId;
    arrive(dungeon, state, conn.to, conn.arrival, from);
    state.ferryFrom = from;
    state.lastText = "Ellis boards the deck. The channel has not moved yet.";
    return;
  }
  if (conn.kind === "ferry-launch") {
    const dest = ferryDest(dungeon, state, conn.which);
    beginTransition(dungeon, state, {
      id: `ferry-${conn.which}-${dest}`,
      steps: dungeon.ferry.steps,
      dest,
      arrival: dungeon.ferry.arrivals[dest],
      deathLantern: { room: dungeon.ferry.homeDock, tile: dungeon.ferry.arrivals[dungeon.ferry.homeDock] },
      text: conn.which === "home" ? "The deck turns back for Ledger Landing." : `The deck takes the channel toward ${dest}.`,
    });
    return;
  }
  if ((conn.consumes || []).length) {
    throw new EngineError("CONSUMES_FORBIDDEN", "Routes must not consume unique keys.");
  }
  let dest = conn.to;
  let arrival = conn.arrival;
  const open = flagsOk(state, conn.when) && toolsFor(conn, state);
  if (!open) {
    if (conn.elseTo) {
      dest = conn.elseTo;
      arrival = conn.elseArrival || conn.arrival;
    } else if (conn.godTemptation) {
      throw new EngineError("GOD_SEALED", conn.closedText || "Embryonic God does not skip this crossing.");
    } else {
      throw new EngineError("EXIT_CLOSED", conn.closedText || "The exit refuses. Read the milepost.");
    }
  }
  if (conn.transitionSteps > 0) {
    beginTransition(dungeon, state, {
      id: conn.transitionId || `${room.id}:${conn.id}`,
      steps: conn.transitionSteps,
      dest,
      arrival,
      deathLantern: conn.deathLantern || state.lastLantern,
      text: conn.transitionText || "Crossing.",
    });
    return;
  }
  arrive(dungeon, state, dest, arrival, room.id);
}

function toolsFor(conn, state) {
  for (const tool of conn.requiresTools || []) {
    if (state.form !== "mortal" || !hasTool(state, tool)) return false;
  }
  return true;
}

function doTick(dungeon, state) {
  if (!state.transition) throw new EngineError("NO_TRANSITION", "No crossing is underway.");
  state.transition.step += 1;
  if (state.transition.step >= state.transition.max) {
    const t = state.transition;
    if (dungeon.ferry && dungeon.ferry.arrivals[t.dest]) state.ferryFrom = null;
    arrive(dungeon, state, t.dest, t.arrival, t.from);
    if (dungeon.ferry && dungeon.ferry.arrivals[state.roomId]) {
      state.ferryFrom = state.roomId;
    }
  }
}

function fightOf(state, which) {
  if (which === "boss") return state.boss;
  if (which === "miniboss") return state.miniboss;
  throw new EngineError("BAD_OP", which);
}

function specOf(dungeon, which) {
  return which === "boss" ? dungeon.boss : dungeon.miniboss;
}

function grantReward(state, reward) {
  if (!reward) return;
  if ((state.items.get(reward.id) || 0) >= 1) return;
  grantItem(state, reward.id, 1);
  if (reward.flag) state.flags.add(reward.flag);
}

function fightMark(phase, accept, fight) {
  const src = accept && (accept.mark || accept.marks) ? accept : phase;
  if (!src) return null;
  if (src.marks && src.marks.length) {
    const idx = (src.indexMarks || phase.indexMarks) === "resolved"
      ? (fight.mercy?.netted.length || 0) + (fight.mercy?.killed.length || 0)
      : fight.progress;
    return src.marks[Math.min(idx, src.marks.length - 1)];
  }
  return src.mark || null;
}

function assertFightMark(state, phase, accept, fight) {
  const tile = fightMark(phase, accept, fight);
  if (!tile) return;
  if (!adjacent([state.x, state.y], tile)) {
    throw new EngineError("NOT_ADJACENT", `The mark at ${tile[0]},${tile[1]} is out of reach.`, { tile });
  }
}

function finishIfDefeated(dungeon, state, which) {
  const fight = fightOf(state, which);
  const spec = specOf(dungeon, which);
  if (fight.phase !== spec.defeatedPhase) return;
  fight.defeated = true;
  grantReward(state, spec.reward);
  if (spec.mercyReward && mercyEarned(fight, spec)) grantReward(state, spec.mercyReward);
  for (const f of spec.sets || []) state.flags.add(f);
  state.lastText = spec.victoryText || "Defeated.";
}

function mercyEarned(fight, spec) {
  const ids = spec.mercyMoths || [];
  if (!ids.length) return false;
  return ids.every((id) => fight.mercy.netted.includes(id)) && fight.mercy.killed.length === 0;
}

function doFight(dungeon, state, which, op) {
  const spec = specOf(dungeon, which);
  const fight = fightOf(state, which);
  if (state.roomId !== spec.room) throw new EngineError("WRONG_ROOM", `${which} is in ${spec.room}.`);
  if (op.action === "begin") {
    if (fight.defeated) {
      fight.phase = spec.idlePhase || "IDLE";
      state.lastText = spec.idleText || "The fight does not resume. The reward is not offered twice.";
      return;
    }
    fight.phase = spec.initialPhase;
    fight.progress = 0;
    fight.arms = {};
    fight.mercy = { netted: [], killed: [] };
    state.pins = 0;
    state.lastText = spec.beginText || "The fight begins.";
    return;
  }
  if (fight.defeated || fight.phase === (spec.idlePhase || "IDLE")) {
    throw new EngineError("BOSS_ABSENT", "Nothing here accepts another blow. The reward was already taken once.");
  }
  if (!fight.phase) throw new EngineError("BOSS_WRONG_PHASE", "The fight has not begun.");
  const phase = (spec.phases || []).find((p) => p.id === fight.phase);
  if (!phase) throw new EngineError("BOSS_WRONG_PHASE", `No phase ${fight.phase}`);

  if (phase.rejectGodForm && state.form === "god") {
    throw new EngineError("GOD_SEALED", "Embryonic God does not finish this challenge.");
  }
  if (phase.requiresForm && state.form !== phase.requiresForm) {
    throw new EngineError("FORM_REQUIRED", "Mortal hands.");
  }

  if ((phase.type || "counter") === "counter") {
    if (op.action !== phase.act) throw new EngineError("BOSS_WRONG_PHASE", `Phase ${phase.id} wants ${phase.act}.`);
    checkTool(state, phase, op);
    if (phase.lightFrom) checkLight(dungeon, state, phase);
    if (phase.requiresFlags && !phase.requiresFlags.every((f) => state.flags.has(f))) {
      throw new EngineError("FLAG_MISSING", "The proof is not on the ledger.");
    }
    assertFightMark(state, phase, null, fight);
    fight.progress += 1;
    if (fight.progress >= phase.need) {
      fight.phase = phase.next;
      fight.progress = 0;
    }
    finishIfDefeated(dungeon, state, which);
    return;
  }

  const accept = (phase.accepts || []).find((a) => a.action === op.action);
  if (!accept) throw new EngineError("BOSS_WRONG_PHASE", `${op.action} is not part of ${phase.id}.`);
  if (accept.rejectGodForm && state.form === "god") {
    throw new EngineError("GOD_SEALED", "Embryonic God does not finish this challenge.");
  }
  if (accept.requiresForm && state.form !== accept.requiresForm) {
    throw new EngineError("FORM_REQUIRED", "Mortal hands.");
  }
  checkTool(state, accept, op);

  if (accept.action === "set-season") {
    if (!op.season || !op.arm) throw new EngineError("BAD_OP", "set-season needs arm and season");
    seasonIndex(op.season);
    fight.arms[op.arm] = op.season;
    state.lastText = `${op.arm} set to ${op.season}.`;
    return;
  }
  if (accept.action === "lock") {
    const have = fight.arms[op.arm || accept.arm];
    if (have !== accept.requiresSeason) {
      if (op.arm) fight.arms[op.arm] = null;
      throw new EngineError("WRONG_SEASON", `The arm wanted ${accept.requiresSeason}, not ${have}. The arm resets. The fight does not lock you out.`);
    }
    assertFightMark(state, phase, accept, fight);
    fight.phase = phase.next;
    fight.progress = 0;
    finishIfDefeated(dungeon, state, which);
    return;
  }
  if (accept.action === "strike" && accept.requiresSeason) {
    const plotName = accept.seasonPlot;
    const have = plotName ? state.seasons[plotName]?.current : fight.arms[op.arm || accept.arm];
    if (have !== accept.requiresSeason) {
      throw new EngineError("WRONG_SEASON", `Need ${accept.requiresSeason}. The phase does not advance.`);
    }
    assertFightMark(state, phase, accept, fight);
    const need = accept.need || 1;
    fight.progress += 1;
    if (fight.progress >= need) {
      fight.phase = phase.next;
      fight.progress = 0;
    }
    finishIfDefeated(dungeon, state, which);
    return;
  }
  if (accept.action === "pin") {
    const expect = (accept.seq || [1, 2, 3])[state.pins];
    if (op.n !== expect) {
      state.pins = 0;
      fight.progress = 0;
      throw new EngineError("WRONG_ORDER", "The painted order resets. The warden is not unlocked, and nothing is consumed.");
    }
    assertFightMark(state, phase, accept, fight);
    state.pins += 1;
    fight.progress = state.pins;
    if (state.pins >= accept.seq.length) {
      fight.phase = phase.next;
      fight.progress = 0;
    }
    return;
  }
  if (accept.action === "net" || accept.action === "shoot") {
    const id = op.moth;
    const ids = spec.mercyMoths || [];
    if (!ids.includes(id)) throw new EngineError("BAD_OP", `Not a fight moth: ${id}`);
    if (fight.mercy.netted.includes(id) || fight.mercy.killed.includes(id)) {
      throw new EngineError("ALREADY", `${id} is already resolved.`);
    }
    assertFightMark(state, phase, accept, fight);
    if (accept.action === "net") fight.mercy.netted.push(id);
    else fight.mercy.killed.push(id);
    const done = ids.every((m) => fight.mercy.netted.includes(m) || fight.mercy.killed.includes(m));
    if (done) {
      fight.phase = phase.next;
      fight.progress = 0;
    }
    finishIfDefeated(dungeon, state, which);
    return;
  }
  if (accept.action === "snag" || accept.action === "socket" || accept.action === "crank" || accept.action === "stand-ring" || accept.action === "pin-book" || accept.action === "cross") {
    checkTool(state, accept, op);
    assertFightMark(state, phase, accept, fight);
    if (accept.need) {
      fight.progress += 1;
      if (fight.progress < accept.need) return;
    }
    fight.phase = phase.next;
    fight.progress = 0;
    finishIfDefeated(dungeon, state, which);
    return;
  }
  throw new EngineError("BAD_OP", `Unhandled fight action ${accept.action}`);
}

function checkTool(state, spec, op) {
  if (spec.tool && !hasTool(state, spec.tool)) {
    throw new EngineError("TOOL_REQUIRED", `Need ${spec.tool}.`);
  }
  if (spec.toolAny) {
    const choice = op.tool || spec.toolAny.find((t) => hasTool(state, t));
    if (!choice || !spec.toolAny.includes(choice) || !hasTool(state, choice)) {
      throw new EngineError("TOOL_REQUIRED", `Need one of ${spec.toolAny.join(", ")}.`);
    }
  }
}

function checkLight(dungeon, state, phase) {
  if (state.form === "god") throw new EngineError("GOD_SEALED", "God-light does not scatter the ward.");
  const glass = phase.lightFrom.includes("glass") && hasTool(state, "homestead-glass") && lampLit(state);
  const carried = phase.lightFrom.includes("carried-moth") && state.carryKind === "moth";
  if (!glass && !carried) throw new EngineError("TOOL_REQUIRED", "Redirect a living lamp with homestead glass, or present a moth in the net.");
}

function lampLit(state) {
  for (const f of state.flags) if (String(f).startsWith("lamp.")) return true;
  return false;
}

function doAssert(state, op) {
  const fail = (msg) => {
    throw new EngineError("ASSERT", msg, op);
  };
  switch (op.code) {
    case "flag":
      if (state.flags.has(op.flag) !== op.value) fail(`flag ${op.flag} is ${state.flags.has(op.flag)} not ${op.value}`);
      return;
    case "room":
      if (state.roomId !== op.room) fail(`room ${state.roomId} !== ${op.room}`);
      return;
    case "item":
      if ((state.items.get(op.item) || 0) < (op.count ?? 1)) fail(`missing item ${op.item}`);
      return;
    case "not-item":
      if ((state.items.get(op.item) || 0) > 0) fail(`unexpected item ${op.item}`);
      return;
    case "item-count":
      if ((state.items.get(op.item) || 0) !== op.count) fail(`item ${op.item} count ${state.items.get(op.item) || 0} !== ${op.count}`);
      return;
    case "phase": {
      const fight = op.which === "miniboss" ? state.miniboss : state.boss;
      if (fight.phase !== op.phase) fail(`${op.which || "boss"} phase ${fight.phase} !== ${op.phase}`);
      return;
    }
    case "defeated": {
      const fight = op.which === "miniboss" ? state.miniboss : state.boss;
      if (fight.defeated !== op.value) fail(`defeated ${fight.defeated} !== ${op.value}`);
      return;
    }
    case "carrying":
      if (state.carrying !== op.id) fail(`carrying ${state.carrying} !== ${op.id}`);
      return;
    case "not-carrying":
      if (state.carrying) fail(`still carrying ${state.carrying}`);
      return;
    case "object-loc": {
      const o = state.objects[op.id];
      if (!o) fail(`no object ${op.id}`);
      if (o.loc !== op.loc) fail(`${op.id} loc ${o.loc} !== ${op.loc}`);
      if (op.room && o.room !== op.room) fail(`${op.id} room ${o.room} !== ${op.room}`);
      if (o.loc === "lost") fail(`${op.id} lost`);
      return;
    }
    case "moth": {
      const m = state.moths[op.id];
      if (!m) fail(`no moth ${op.id}`);
      if (m.loc !== op.loc) fail(`${op.id} moth loc ${m.loc} !== ${op.loc}`);
      if (op.room && m.room !== op.room) fail(`${op.id} room ${m.room} !== ${op.room}`);
      return;
    }
    case "text-includes":
      if (!state.lastText.includes(op.text)) fail(`text [${state.lastText}] missing [${op.text}]`);
      return;
    case "season": {
      const s = state.seasons[op.id];
      if (!s) fail(`no season ${op.id}`);
      if (op.current && s.current !== op.current) fail(`${op.id} ${s.current} !== ${op.current}`);
      if (op.grafted !== undefined && s.grafted !== op.grafted) fail(`${op.id} grafted ${s.grafted}`);
      return;
    }
    case "lever":
      if (!!state.levers[op.id] !== op.value) fail(`lever ${op.id}`);
      return;
    case "form":
      if (state.form !== op.form) fail(`form ${state.form}`);
      return;
    case "visited":
      if (!state.visited.includes(op.room)) fail(`not visited ${op.room}`);
      return;
    case "not-visited":
      if (state.visited.includes(op.room)) fail(`visited ${op.room}`);
      return;
    case "transition":
      if (!state.transition) fail("expected an active transition");
      return;
    case "no-transition":
      if (state.transition) fail("transition still active");
      return;
    case "miniboss-progress":
      if (state.miniboss.progress !== op.value && state.pins !== op.value) {
        if (state.pins !== op.value) fail(`progress ${state.miniboss.progress}/${state.pins} !== ${op.value}`);
      }
      return;
    case "hp":
      if (state.hp !== op.value) fail(`hp ${state.hp} !== ${op.value}`);
      return;
    default:
      throw new EngineError("BAD_OP", `Unknown assert ${op.code}`);
  }
}

export function applyOp(dungeon, state, op) {
  if (!op || typeof op.op !== "string") throw new EngineError("BAD_OP", "Missing op");
  switch (op.op) {
    case "move":
      doMove(dungeon, state, op.to);
      break;
    case "interact":
      doInteract(dungeon, state, op.id);
      break;
    case "use-exit":
      doUseExit(dungeon, state, op.id);
      break;
    case "tick-transition":
      doTick(dungeon, state);
      break;
    case "die":
      die(dungeon, state, "script");
      break;
    case "set-form":
      if (op.form !== "mortal" && op.form !== "god") throw new EngineError("BAD_OP", "form");
      state.form = op.form;
      break;
    case "grant-tool":
      state.tools.add(op.tool);
      break;
    case "boss":
      doFight(dungeon, state, "boss", op);
      break;
    case "miniboss":
      doFight(dungeon, state, "miniboss", op);
      break;
    case "assert":
      doAssert(state, op);
      break;
    default:
      throw new EngineError("BAD_OP", `Unknown op ${op.op}`);
  }
  state.log.push({ op: op.op, id: op.id || op.action || null, room: state.roomId });
  return state;
}

export function runOps(dungeon, state, ops) {
  for (let i = 0; i < ops.length; i++) {
    try {
      applyOp(dungeon, state, ops[i]);
    } catch (err) {
      if (err instanceof EngineError) {
        err.detail = { ...(err.detail || {}), index: i, op: ops[i], room: state.roomId, text: state.lastText };
      }
      throw err;
    }
  }
  rememberTile(state.roomId, state.x, state.y);
  return state;
}

export function runExpectingError(dungeon, state, steps, code) {
  if (!steps.length) throw new EngineError("BAD_OP", "empty steps");
  runOps(dungeon, state, steps.slice(0, -1));
  try {
    applyOp(dungeon, state, steps[steps.length - 1]);
  } catch (err) {
    if (!(err instanceof EngineError)) throw err;
    if (err.code !== code) {
      throw new EngineError("ASSERT", `Expected ${code} but got ${err.code}: ${err.message}`, { index: steps.length - 1 });
    }
    return state;
  }
  throw new EngineError("EXPECTED_ERROR", `Final step should have failed with ${code}`);
}

export function checkExpect(state, expect) {
  if (!expect) return;
  if (expect.flags) {
    for (const f of expect.flags) {
      if (!state.flags.has(f)) throw new EngineError("ASSERT", `missing flag ${f}`);
    }
  }
  if (expect.notFlags) {
    for (const f of expect.notFlags) {
      if (state.flags.has(f)) throw new EngineError("ASSERT", `flag should be unset: ${f}`);
    }
  }
  if (expect.items) {
    for (const [id, count] of Object.entries(expect.items)) {
      const have = state.items.get(id) || 0;
      if (have !== count) throw new EngineError("ASSERT", `${id} count ${have} !== ${count}`);
    }
  }
  if (expect.notItems) {
    for (const id of expect.notItems) {
      if ((state.items.get(id) || 0) > 0) throw new EngineError("ASSERT", `unexpected ${id}`);
    }
  }
  if (expect.room && state.roomId !== expect.room) {
    throw new EngineError("ASSERT", `room ${state.roomId} !== ${expect.room}`);
  }
  if (expect.textIncludes && !state.lastText.includes(expect.textIncludes)) {
    throw new EngineError("ASSERT", `text missing ${expect.textIncludes} in [${state.lastText}]`);
  }
  if (expect.phase && state.boss.phase !== expect.phase) {
    throw new EngineError("ASSERT", `phase ${state.boss.phase} !== ${expect.phase}`);
  }
  if (expect.objectLoc) {
    for (const [id, loc] of Object.entries(expect.objectLoc)) {
      if (state.objects[id]?.loc !== loc) {
        throw new EngineError("ASSERT", `${id} loc ${state.objects[id]?.loc} !== ${loc}`);
      }
    }
  }
  if (expect.mothLoc) {
    for (const [id, loc] of Object.entries(expect.mothLoc)) {
      if (state.moths[id]?.loc !== loc) throw new EngineError("ASSERT", `${id} ${state.moths[id]?.loc} !== ${loc}`);
    }
  }
}

export function reachableRooms(dungeon, predicate) {
  const start = dungeon.entry.room;
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const id = q.shift();
    if (String(id).startsWith("COUNTY")) continue;
    const room = roomById(dungeon, id);
    for (const conn of room.connections || []) {
      const targets = [];
      if (predicate(conn, true)) targets.push(conn.to);
      if (conn.elseTo && predicate(conn, false)) targets.push(conn.elseTo);
      for (const t of targets) {
        if (!t || seen.has(t)) continue;
        seen.add(t);
        q.push(t);
      }
    }
  }
  return [...seen].sort();
}

export function auditObjects(dungeon, state) {
  const problems = [];
  for (const obj of dungeon.transportables || []) {
    const live = state.objects[obj.id];
    if (!live) problems.push(`${obj.id} missing`);
    else if (live.loc === "lost" || live.loc == null) problems.push(`${obj.id} lost`);
  }
  for (const moth of dungeon.moths || []) {
    const live = state.moths[moth.id];
    if (!live) problems.push(`moth ${moth.id} missing`);
    else if (live.loc === "lost" || live.loc == null) problems.push(`moth ${moth.id} lost`);
  }
  return problems;
}
