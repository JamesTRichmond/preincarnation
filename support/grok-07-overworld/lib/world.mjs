import { CARTOGRAM, PLACES, SEALED_BORDERS } from "../data/cartogram.mjs";
import { HUBS, HUB_W, HUB_H } from "../data/hubs.mjs";
import { INTERIORS } from "../data/interiors.mjs";
import {
  DUNGEONS,
  EDGE_OPS,
  ERA_CHANGES,
  EXTRA_OPS,
  HUB_AT,
  PICKUPS,
  SPANS,
  WARPS,
} from "../data/travel.mjs";
import {
  DIRS,
  DISTRICT_META,
  ERAS,
  MOUTHS,
  SCREEN_H,
  SCREEN_W,
  START_SCREEN,
  CODE_TO_DISTRICT,
  TOOLS,
} from "./constants.mjs";

const SEALED = new Set(SEALED_BORDERS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));

export function edgeKey(a, b) {
  return [a, b].sort().join("|");
}

export function cellKey(x, y) {
  return `${x},${y}`;
}

function blank(w, h, fill) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => fill));
}

function inGrid(x, y) {
  return y >= 0 && y < CARTOGRAM.length && x >= 0 && x < CARTOGRAM[y].length;
}

export function buildIndex() {
  const cells = new Map();
  for (let y = 0; y < CARTOGRAM.length; y++) {
    const row = CARTOGRAM[y];
    if (row.length !== 18) throw new Error(`Cartogram row ${y} width ${row.length}`);
    for (let x = 0; x < row.length; x++) {
      const code = row[x];
      if (code === ".") continue;
      const district = CODE_TO_DISTRICT[code];
      if (!district) throw new Error(`Unknown code ${code} at ${x},${y}`);
      const key = cellKey(x, y);
      const place = PLACES[key];
      if (!place) throw new Error(`No place authored at ${key}`);
      cells.set(key, { key, x, y, district, ...place });
    }
  }
  for (const key of Object.keys(PLACES)) {
    if (!cells.has(key)) throw new Error(`Place ${key} is not on the cartogram`);
  }
  const byDistrict = {};
  for (const meta of Object.keys(DISTRICT_META)) byDistrict[meta] = [];
  for (const cell of cells.values()) byDistrict[cell.district].push(cell);
  for (const list of Object.values(byDistrict)) {
    list.sort((a, b) => a.y - b.y || a.x - b.x);
    list.forEach((cell, i) => {
      cell.id = `${DISTRICT_META[cell.district].prefix}-${String(i + 1).padStart(2, "0")}`;
    });
  }
  const byId = new Map();
  for (const cell of cells.values()) byId.set(cell.id, cell);
  return { cells, byId, byDistrict };
}

function neighborsOf(cell) {
  const out = [];
  for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
    const x = cell.x + dx;
    const y = cell.y + dy;
    const key = cellKey(x, y);
    out.push({ dir, x, y, key, onMap: inGrid(x, y) && CARTOGRAM[y][x] !== "." });
  }
  return out;
}

export function baseExits(cell, cells) {
  const exits = {};
  for (const n of neighborsOf(cell)) {
    if (!n.onMap) {
      exits[n.dir] = null;
      continue;
    }
    const other = cells.get(n.key);
    if (SEALED.has(`${cell.district}|${other.district}`)) {
      exits[n.dir] = null;
      continue;
    }
    exits[n.dir] = { to: n.key, dir: n.dir };
  }
  return exits;
}

function opsForEdge(key) {
  return EDGE_OPS.filter((op) => edgeKey(op.edge[0], op.edge[1]) === key);
}

export function opActive(op, era) {
  if (era < (op.from ?? 0)) return false;
  if (op.until != null && era >= op.until) return false;
  return true;
}

export function edgeState(a, b, era) {
  const key = edgeKey(a, b);
  const active = opsForEdge(key).filter((op) => opActive(op, era));
  const gates = active.filter((op) => op.op === "close" || op.op === "need" || op.op === "needAny");
  const kinds = new Set(gates.map((op) => op.op));
  if (kinds.size > 1) {
    return { error: `conflicting gates on ${key} at era ${era}: ${[...kinds].join(",")}` };
  }
  const state = { key, closed: false, needAll: [], needAny: null, oneway: null };
  for (const op of active) {
    if (op.op === "close") state.closed = true;
    if (op.op === "need") state.needAll = op.tools;
    if (op.op === "needAny") state.needAny = op.groups;
    if (op.op === "oneway") state.oneway = [op.fromCell, op.toCell];
  }
  return state;
}

export function toolOk(state, tools) {
  if (state.closed) return false;
  if (state.needAll?.length && !state.needAll.every((t) => tools.has(t))) return false;
  if (state.needAny && !state.needAny.some((group) => group.every((t) => tools.has(t)))) return false;
  return true;
}

export function spansActive(era) {
  return SPANS.filter((span) => opActive(span, era));
}

export function warpsActive(era) {
  return WARPS.filter((warp) => opActive(warp, era));
}

export function dungeonState(d, era) {
  if (d.windows) {
    const open = d.windows.some(([a, b]) => era >= a && era < b);
    return { open, need: d.need ?? [] };
  }
  const open = era >= (d.from ?? 0);
  if (d.needUntil && era < d.needUntil.era) return { open, need: d.needUntil.tools };
  if (d.needUntil && era >= d.needUntil.era) return { open, need: d.needAfter ?? [] };
  return { open, need: d.need ?? [] };
}

export function talksAt(at, era) {
  const talks = [];
  for (const change of ERA_CHANGES) {
    if (!change.interaction) continue;
    if (change.interaction.at !== at) continue;
    if (era >= change.era) talks.push(change.interaction);
  }
  return talks;
}

export function screenGraph(cells, era, tools) {
  const adj = new Map();
  for (const cell of cells.values()) adj.set(cell.key, []);
  for (const cell of cells.values()) {
    for (const [dir, dest] of Object.entries(baseExits(cell, cells))) {
      if (!dest) continue;
      const state = edgeState(cell.key, dest.to, era);
      if (state.error) continue;
      if (!toolOk(state, tools)) continue;
      if (state.oneway && !(state.oneway[0] === cell.key && state.oneway[1] === dest.to)) continue;
      adj.get(cell.key).push({ to: dest.to, via: dir, kind: "walk" });
    }
  }
  for (const span of spansActive(era)) {
    const state = {
      closed: false,
      needAll: span.need ?? [],
      needAny: span.needAny ?? null,
    };
    if (!toolOk(state, tools)) continue;
    adj.get(span.a).push({ to: span.b, via: span.id, kind: "span" });
    adj.get(span.b).push({ to: span.a, via: span.id, kind: "span" });
  }
  return adj;
}

export function withWarps(adj, era) {
  const next = new Map();
  for (const [k, v] of adj) next.set(k, v.slice());
  const pads = warpsActive(era).map((w) => w.at);
  for (const a of pads) {
    for (const b of pads) {
      if (a !== b) next.get(a).push({ to: b, via: "warp", kind: "warp" });
    }
  }
  return next;
}

export function bfs(start, adj) {
  const dist = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const cur = q.shift();
    for (const edge of adj.get(cur) ?? []) {
      if (!dist.has(edge.to)) {
        dist.set(edge.to, dist.get(cur) + 1);
        q.push(edge.to);
      }
    }
  }
  return dist;
}

export function canCross(state, tools) {
  return toolOk(state, tools);
}

function fillRect(g, x, y, w, h, tile) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (yy >= 0 && xx >= 0 && yy < g.length && xx < g[0].length) g[yy][xx] = tile;
    }
  }
}

function paintMotif(g, motif) {
  const H = g.length;
  const W = g[0].length;
  const fill = (t) => fillRect(g, 0, 0, W, H, t);
  if (motif === "lake-bluff") {
    fill(".");
    fillRect(g, 0, 0, 6, H, "=");
    fillRect(g, 6, 0, 1, H, "#");
  } else if (motif === "quiet-woods") {
    fill("t");
    fillRect(g, 2, 2, 4, 3, "T");
    fillRect(g, 14, 9, 4, 3, "T");
  } else if (motif === "field-rows") {
    fill(".");
    for (let y = 1; y < H; y += 3) fillRect(g, 1, y, W - 2, 1, ",");
  } else if (motif === "village-block" || motif === "campus-quad") {
    fill(motif === "village-block" ? "f" : ".");
    fillRect(g, 1, 1, 5, 3, "B");
    fillRect(g, 14, 1, 5, 3, "B");
    fillRect(g, 1, 10, 4, 3, "B");
  } else if (motif === "harbor-green") {
    fill(".");
    fillRect(g, 0, 10, W, 4, "~");
    fillRect(g, 8, 9, 4, 2, "b");
  } else if (motif === "marsh-board") {
    fill("m");
    fillRect(g, 7, 0, 6, H, ".");
  } else if (motif === "creek-bridge") {
    fill(".");
    fillRect(g, 0, 4, W, 3, "~");
  } else if (motif === "farm-lane") {
    fill(".");
    fillRect(g, 1, 1, W - 2, 1, "+");
    fillRect(g, 1, 12, W - 2, 1, "+");
    fillRect(g, 1, 2, 4, 3, "B");
  } else if (motif === "dike") {
    fill("m");
    fillRect(g, 4, 0, 6, H, ".");
  } else if (motif === "rail-bed") {
    fill(",");
    fillRect(g, 0, 6, W, 2, "-");
  } else if (motif === "falls-gorge") {
    fill("#");
    fillRect(g, 2, 2, W - 4, H - 4, ".");
    fillRect(g, 0, 6, W, 2, "=");
  } else if (motif === "high-gap") {
    fill("t");
    fillRect(g, 16, 0, 4, H, "n");
    fillRect(g, 2, 2, 3, 3, "T");
  } else if (motif === "sugar-woods") {
    fill("t");
    for (let y = 1; y < H; y += 3) {
      for (let x = 1; x < W; x += 4) g[y][x] = "T";
    }
    fillRect(g, 2, 10, 4, 2, "B");
  } else if (motif === "quarry-pit") {
    fill("y");
    fillRect(g, 4, 3, 8, 6, "#");
    fillRect(g, 6, 5, 4, 3, "=");
  } else if (motif === "covered-bridge") {
    fill("~");
    fillRect(g, 0, 5, W, 4, "b");
    fillRect(g, 0, 5, W, 1, "B");
    fillRect(g, 0, 8, W, 1, "B");
  } else if (motif === "swamp-islands") {
    fill("m");
    fillRect(g, 2, 2, 4, 3, ".");
    fillRect(g, 13, 8, 5, 3, ".");
  } else if (motif === "landing") {
    fill(".");
    fillRect(g, 0, 0, W, 4, "=");
    fillRect(g, 8, 3, 4, 2, "b");
  } else if (motif === "orchard-rows") {
    fill(".");
    for (let x = 2; x < W - 1; x += 3) fillRect(g, x, 1, 1, 4, "o");
    for (let x = 2; x < W - 1; x += 3) fillRect(g, x, 10, 1, 3, "o");
  } else if (motif === "void-seam") {
    fill(".");
    fillRect(g, 0, 5, W, 3, "v");
  } else if (motif === "county-seal") {
    fill(".");
    fillRect(g, 0, 0, W, 2, "#");
    fillRect(g, 0, H - 2, W, 2, "#");
    fillRect(g, 0, 0, 2, H, "#");
    fillRect(g, W - 2, 0, 2, H, "#");
  } else if (motif === "ledge-climb") {
    fill(".");
    fillRect(g, 2, 1, 3, H - 2, "#");
    fillRect(g, 5, 2, 1, 8, "^");
  } else {
    throw new Error(`Unknown motif ${motif}`);
  }
}

function carveCell(g, x, y) {
  const was = g[y][x];
  g[y][x] = "=~".includes(was) ? "b" : "p";
}

function carveExit(g, dir) {
  for (const [x, y] of MOUTHS[dir]) carveCell(g, x, y);
  if (dir === "N") for (let y = 0; y <= 6; y++) for (const x of [9, 10]) carveCell(g, x, y);
  if (dir === "S") for (let y = 7; y <= 13; y++) for (const x of [9, 10]) carveCell(g, x, y);
  if (dir === "W") for (let x = 0; x <= 9; x++) for (const y of [6, 7]) carveCell(g, x, y);
  if (dir === "E") for (let x = 10; x <= 19; x++) for (const y of [6, 7]) carveCell(g, x, y);
  for (let y = 5; y <= 8; y++) for (let x = 8; x <= 11; x++) carveCell(g, x, y);
}

function frame(g, openDirs) {
  const H = g.length;
  const W = g[0].length;
  const mouthSet = new Set();
  for (const dir of openDirs) for (const [x, y] of MOUTHS[dir]) mouthSet.add(`${x},${y}`);
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) if (!mouthSet.has(`${x},${y}`)) g[y][x] = "#";
  }
  for (let y = 0; y < H; y++) {
    for (const x of [0, W - 1]) if (!mouthSet.has(`${x},${y}`)) g[y][x] = "#";
  }
}

function gateTile(state) {
  if (state.needAny) return "G";
  const tools = state.needAll ?? [];
  if (state.oneway && tools.length === 0) return "u";
  if (tools.length === 1 && tools[0] === "void_oar") return "=";
  if (tools.length === 1 && tools[0] === "creek_boots") return "m";
  if (tools.length === 1 && tools[0] === "ledge_iron") return "^";
  if (tools.length === 1 && tools[0] === "orchard_ladder") return "l";
  if (tools.length === 1 && tools[0] === "frost_notch") return "n";
  if (tools.length > 0) return "G";
  if (state.oneway) return "u";
  return null;
}

function stampPath(g, x, y, tile) {
  g[y][x] = tile;
  let cx = x;
  let cy = y;
  const tx = 9;
  const ty = 6;
  while (cx !== tx) {
    cx += cx < tx ? 1 : -1;
    if (g[cy][cx] !== tile) carveCell(g, cx, cy);
  }
  while (cy !== ty) {
    cy += cy < ty ? 1 : -1;
    if (g[cy][cx] !== tile) carveCell(g, cx, cy);
  }
}

export function paintScreen(cell, cells, era) {
  const g = blank(SCREEN_W, SCREEN_H, ".");
  paintMotif(g, cell.motif);
  const exits = baseExits(cell, cells);
  const openDirs = [];
  const needs = {};
  for (const [dir, dest] of Object.entries(exits)) {
    if (!dest) continue;
    const state = edgeState(cell.key, dest.to, era);
    if (state.error) throw new Error(state.error);
    if (state.closed) continue;
    openDirs.push(dir);
    carveExit(g, dir);
    const tile = gateTile(state);
    if (tile) {
      for (const [x, y] of MOUTHS[dir]) {
        g[y][x] = tile;
        needs[`${x},${y}`] = { needAll: state.needAll ?? [], needAny: state.needAny, oneway: Boolean(state.oneway) };
      }
    }
  }
  frame(g, openDirs);
  for (let y = 5; y <= 8; y++) for (let x = 8; x <= 11; x++) if (g[y][x] !== "G") carveCell(g, x, y);
  const links = [];
  const interiors = INTERIORS.filter((r) => r.parent.kind === "screen" && r.parent.at === cell.key);
  interiors.forEach((room, i) => {
    const x = 2 + i;
    const y = 11;
    stampPath(g, x, y, "D");
    links.push({ kind: "interior", id: room.id, x, y });
  });
  if (HUB_AT[cell.key]) {
    stampPath(g, 16, 3, "H");
    links.push({ kind: "hub", id: HUB_AT[cell.key], x: 16, y: 3 });
  }
  const dungeon = DUNGEONS.find((d) => d.at === cell.key);
  if (dungeon) {
    stampPath(g, 3, 3, "d");
    links.push({ kind: "dungeon", id: dungeon.id, x: 3, y: 3 });
  }
  const warps = warpsActive(era).filter((w) => w.at === cell.key);
  warps.forEach((warp, i) => {
    stampPath(g, 16, 10 + i, "W");
    links.push({ kind: "warp", id: warp.id, x: 16, y: 10 + i });
  });
  const pickup = PICKUPS.find((p) => p.at === cell.key);
  if (pickup) {
    stampPath(g, 5, 3, "S");
    links.push({ kind: "pickup", id: pickup.tool, x: 5, y: 3 });
  }
  const spanList = spansActive(era).filter((s) => s.a === cell.key || s.b === cell.key);
  spanList.forEach((span, i) => {
    const tile = (span.need ?? []).length === 1 && span.need[0] === "void_oar"
      ? "v"
      : (span.need ?? []).length === 1 && span.need[0] === "creek_boots"
        ? "m"
        : "G";
    const y = 2 + i;
    stampPath(g, 2, y, tile);
    needs[`2,${y}`] = { needAll: span.need ?? [], needAny: span.needAny ?? null };
    links.push({ kind: "span", id: span.id, x: 2, y });
  });
  g[7][4] = "@";
  return { rows: g.map((row) => row.join("")), links, needs };
}

export function paintInterior(room) {
  const g = blank(14, 9, "#");
  fillRect(g, 1, 1, 12, 6, "f");
  g[8][6] = "D";
  g[8][7] = "D";
  g[7][6] = "f";
  g[7][7] = "f";
  for (const prop of room.props) fillRect(g, prop.x, prop.y, prop.w, prop.h, prop.tile);
  g[8][6] = "D";
  g[8][7] = "D";
  return g.map((row) => row.join(""));
}

export function paintHub(hub) {
  const g = blank(HUB_W, HUB_H, "#");
  fillRect(g, 10, 6, 10, 8, "f");
  for (const [x, y, w, h] of hub.rooms) fillRect(g, x, y, w, h, "f");
  for (let y = 14; y <= 17; y++) {
    g[y][14] = "f";
    g[y][15] = "f";
  }
  g[17][14] = "H";
  g[17][15] = "H";
  for (const [, x, y] of hub.doors) g[y][x] = "D";
  g[8][14] = "@";
  return g.map((row) => row.join(""));
}

export function assemble(era = 0) {
  const { cells, byId, byDistrict } = buildIndex();
  const screens = [];
  for (const cell of cells.values()) {
    const painted = paintScreen(cell, cells, era);
    const exits = {};
    for (const [dir, dest] of Object.entries(baseExits(cell, cells))) {
      if (!dest) {
        exits[dir] = null;
        continue;
      }
      const state = edgeState(cell.key, dest.to, era);
      exits[dir] = {
        toKey: dest.to,
        to: cells.get(dest.to).id,
        closed: Boolean(state.closed),
        needAll: state.needAll ?? [],
        needAny: state.needAny,
        oneway: state.oneway,
        error: state.error ?? null,
      };
    }
    screens.push({
      id: cell.id,
      district: cell.district,
      name: cell.name,
      x: cell.x,
      y: cell.y,
      motif: cell.motif,
      role: cell.role,
      purpose: cell.purpose,
      landmark: cell.landmark,
      note: cell.note,
      quiet: cell.purpose === "quiet" || cell.purpose === "both" ? cell.note : null,
      encounter: cell.purpose === "encounter" ? { id: `${cell.id}-echo`, note: cell.note } : null,
      interactions: [{ id: "notice", text: cell.note }, ...talksAt(cell.key, era).map((t) => ({ id: t.id, text: t.text }))],
      exits,
      links: painted.links,
      needs: painted.needs,
      layout: painted.rows,
      start: cell.id === START_SCREEN,
    });
  }
  screens.sort((a, b) => a.id.localeCompare(b.id));
  const hubs = HUBS.map((hub) => ({
    ...hub,
    layout: paintHub(hub),
    entrance: { from: cells.get(hub.from).id, x: 14, y: 17 },
  }));
  const interiors = INTERIORS.map((room) => ({
    ...room,
    layout: paintInterior(room),
    back: { x: 6, y: 8, to: room.parent },
  }));
  return { cells, byId, byDistrict, screens, hubs, interiors, era };
}

export function toolSet(list) {
  return new Set(list);
}

export function allTools() {
  return toolSet(TOOLS);
}

export { ERAS, START_SCREEN, ERA_CHANGES, EXTRA_OPS, DUNGEONS, PICKUPS, SPANS, WARPS, EDGE_OPS };
