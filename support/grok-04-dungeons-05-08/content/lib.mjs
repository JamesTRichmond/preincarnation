/**
 * Authoring helpers for the DG05–DG08 content pack.
 * Source of truth lives in the dungeon modules; emit.mjs writes JSON.
 * Coordinate system: x right, y down, (0,0) is the northwest corner.
 */

export const W = 15;
export const H = 11;

export function grid({ w = W, h = H, paint, doors = [] }) {
  const g = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) =>
      y === 0 || x === 0 || y === h - 1 || x === w - 1 ? "#" : ".",
    ),
  );
  paint?.(g);
  for (const d of doors) {
    if (!g[d.y] || g[d.y][d.x] === undefined) {
      throw new Error(`door out of bounds ${d.x},${d.y}`);
    }
    g[d.y][d.x] = d.ch || (g[d.y][d.x] === "#" ? "." : g[d.y][d.x]);
  }
  return g.map((row) => row.join(""));
}

/** Leave the center column and row open so standard doors connect. */
export function keepHub(g) {
  const h = g.length;
  const w = g[0].length;
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  for (let y = 1; y < h - 1; y++) if (g[y][cx] !== "#") {
    /* keep existing walkable char */
  } else g[y][cx] = ".";
  for (let x = 1; x < w - 1; x++) if (g[cy][x] !== "#") {
    /* keep */
  } else g[cy][x] = ".";
  for (let y = 1; y < h - 1; y++) if (g[y][cx] === "#") g[y][cx] = ".";
  for (let x = 1; x < w - 1; x++) if (g[cy][x] === "#") g[cy][x] = ".";
}

export function standardDoors(dirs, ch = ".") {
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);
  const all = {
    N: { x: cx, y: 0, ch },
    S: { x: cx, y: H - 1, ch },
    E: { x: W - 1, y: cy, ch },
    W: { x: 0, y: cy, ch },
  };
  return dirs.map((d) => all[d]);
}

export function doorTile(dir, ch = ".") {
  return standardDoors([dir], ch)[0];
}

export function exit(partial) {
  return {
    requiresFlags: [],
    requiresKeys: [],
    requiresTools: [],
    needFins: false,
    openAtLevels: null,
    setsFlags: [],
    optional: false,
    shortcut: false,
    external: false,
    oneWay: false,
    arrivalMayBeDeep: false,
    ...partial,
  };
}

export function interact(partial) {
  return {
    verb: partial.verb,
    setsFlags: [],
    givesKeys: [],
    givesEvidence: [],
    givesCollectibles: [],
    setsLevel: null,
    requiresFlags: [],
    requiresKeys: [],
    requiresTools: [],
    optional: false,
    fourDirection: true,
    touchTarget: true,
    ...partial,
  };
}

export function room(partial) {
  return {
    tags: [],
    optional: false,
    requiresOptionalTool: null,
    encounters: [],
    interactions: [],
    exits: [],
    safePath: null,
    hazardNote: null,
    rails: [],
    persistence: {
      onLeaveUnlatched: "reset-local-puzzle-to-initial",
      onDeath: "dungeon-policy",
      latchedByFlags: partial.latchFlags || [],
      neverPersistUnsolvedBlockState: true,
      note: partial.persistenceNote || "Unsolved local state dies with the visit. Latched flags, keys, and evidence remain.",
    },
    reset: partial.reset || {
      control: "none",
      preserves: ["keys", "evidence", "latchedFlags", "bossDefeat", "collectedMarginStones"],
    },
    ...partial,
  };
}

export function resolveChar(ch, level) {
  if (level == null) return ch;
  if (ch === "=") return level === 0 ? "." : level === 1 ? "~" : "W";
  if (ch === "~") return level === 0 ? "." : level === 1 ? "~" : "W";
  return ch;
}

export function resolveGrid(rows, level) {
  if (level == null) return rows;
  return rows.map((row) => row.split("").map((ch) => resolveChar(ch, level)).join(""));
}

export function isWall(ch) {
  return ch === "#";
}

export function isDeep(ch) {
  return ch === "W";
}

export function isWalkable(ch, { fins = false } = {}) {
  if (ch === "#") return false;
  if (ch === "W") return fins;
  return true;
}

const DEEP_POLICY = "W";

export function connectedComponent(rows, start, { fins = false } = {}) {
  const h = rows.length;
  const w = rows[0].length;
  const key = (x, y) => `${x},${y}`;
  const seen = new Set();
  const q = [[start.x, start.y]];
  const startCh = rows[start.y]?.[start.x];
  if (startCh === undefined || !isWalkable(startCh, { fins })) return seen;
  seen.add(key(start.x, start.y));
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || ny >= h || nx >= w) continue;
      const ch = rows[ny][nx];
      if (!isWalkable(ch, { fins })) continue;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

/** Expand compact puzzles into explicit finite graphs with a solution trace. */
export function expandPuzzle(puzzle) {
  if (puzzle.type === "explicit") {
    const fsm = materializeExplicit(puzzle);
    return { ...puzzle, fsm };
  }
  if (puzzle.type === "choiceWheel") return { ...puzzle, fsm: expandChoiceWheel(puzzle) };
  if (puzzle.type === "adjacentSwap") return { ...puzzle, fsm: expandAdjacentSwap(puzzle) };
  if (puzzle.type === "toggles") return { ...puzzle, fsm: expandToggles(puzzle) };
  if (puzzle.type === "dials") return { ...puzzle, fsm: expandDials(puzzle) };
  if (puzzle.type === "testimony") return { ...puzzle, fsm: expandTestimony(puzzle) };
  if (puzzle.type === "railBlock") return { ...puzzle, fsm: expandRailBlock(puzzle) };
  throw new Error(`unknown puzzle type ${puzzle.type} (${puzzle.id})`);
}

function materializeExplicit(puzzle) {
  const states = {};
  for (const [id, s] of Object.entries(puzzle.states)) {
    states[id] = { terminal: !!s.terminal, safe: s.safe !== false, ...s };
  }
  const edges = puzzle.edges.map((e) => ({ ...e }));
  const solution = puzzle.solution || puzzle.solutionTrace || [];
  assertSolvable(puzzle.id, states, edges, puzzle.initial, puzzle.terminal, solution);
  return {
    initial: puzzle.initial,
    terminal: puzzle.terminal,
    resetFromAny: !!puzzle.resetFromAny,
    states,
    edges,
    solution,
  };
}

function assertSolvable(id, states, edges, initial, terminal, solution) {
  if (!states[initial]) throw new Error(`${id} missing initial ${initial}`);
  if (!states[terminal]) throw new Error(`${id} missing terminal ${terminal}`);
  const adj = new Map();
  for (const e of edges) {
    if (!states[e.from] || !states[e.to]) throw new Error(`${id} edge ${e.from}->${e.to} (${e.on}) dangling`);
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push(e);
  }
  // walk solution
  let cur = initial;
  for (const step of solution) {
    const nxt = (adj.get(cur) || []).find((e) => e.on === step);
    if (!nxt) throw new Error(`${id} solution step '${step}' illegal from ${cur}`);
    cur = nxt.to;
  }
  if (cur !== terminal) throw new Error(`${id} solution ends at ${cur} not ${terminal}`);
  // every state reaches terminal
  for (const s of Object.keys(states)) {
    if (!canReach(s, terminal, adj)) {
      throw new Error(`${id} state ${s} cannot reach terminal ${terminal}`);
    }
    if (!canReachSome(s, adj, (n) => states[n].safe)) {
      throw new Error(`${id} state ${s} cannot reach a safe state`);
    }
  }
}

function canReach(start, goal, adj) {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const c = q.shift();
    if (c === goal) return true;
    for (const e of adj.get(c) || []) {
      if (!seen.has(e.to)) {
        seen.add(e.to);
        q.push(e.to);
      }
    }
  }
  return false;
}

function canReachSome(start, adj, pred) {
  const seen = new Set([start]);
  const q = [start];
  while (q.length) {
    const c = q.shift();
    if (pred(c)) return true;
    for (const e of adj.get(c) || []) {
      if (!seen.has(e.to)) {
        seen.add(e.to);
        q.push(e.to);
      }
    }
  }
  return false;
}

function expandChoiceWheel(p) {
  const names = Object.keys(p.wheels);
  const options = names.map((n) => p.wheels[n]);
  const initial = names.map((n) => p.wheels[n].indexOf(p.initial[n]));
  const goal = names.map((n) => p.wheels[n].indexOf(p.goal[n]));
  if (initial.some((n) => n < 0) || goal.some((n) => n < 0)) {
    throw new Error(`${p.id} wheel initial/goal not in options`);
  }
  const idOf = (idx) => idx.join(",");
  const states = {};
  const edges = [];
  const ranges = options.map((o) => o.length);
  // enumerate by cycling — full cartesian
  const cart = [[]];
  for (const len of ranges) {
    const next = [];
    for (const base of cart) {
      for (let i = 0; i < len; i++) next.push([...base, i]);
    }
    cart.length = 0;
    cart.push(...next);
  }
  for (const idx of cart) {
    const id = idOf(idx);
    const label = Object.fromEntries(names.map((n, i) => [n, options[i][idx[i]]]));
    states[id] = {
      terminal: id === idOf(goal),
      safe: true,
      label,
    };
    names.forEach((n, wi) => {
      const nxt = idx.slice();
      nxt[wi] = (nxt[wi] + 1) % ranges[wi];
      edges.push({ from: id, on: `cycle:${n}`, to: idOf(nxt) });
    });
    if (id !== idOf(initial)) {
      edges.push({ from: id, on: "reset", to: idOf(initial), reset: true });
    }
  }
  // solution: cycle each wheel the required times
  const solution = [];
  names.forEach((n, wi) => {
    let cur = initial[wi];
    let guard = 0;
    while (cur !== goal[wi]) {
      solution.push(`cycle:${n}`);
      cur = (cur + 1) % ranges[wi];
      if (++guard > 12) throw new Error(`${p.id} wheel cycle failed`);
    }
  });
  const fsm = {
    initial: idOf(initial),
    terminal: idOf(goal),
    resetFromAny: true,
    states,
    edges,
    solution,
  };
  assertSolvable(p.id, states, edges, fsm.initial, fsm.terminal, solution);
  return fsm;
}

function expandAdjacentSwap(p) {
  const ser = (a) => a.join("|");
  const goal = ser(p.goal);
  const start = ser(p.initial);
  // generate permutations via swaps from start; if goal not same set, throw
  if (ser([...p.initial].sort()) !== ser([...p.goal].sort())) {
    throw new Error(`${p.id} swap set mismatch`);
  }
  const states = {};
  const edges = [];
  const q = [p.initial.slice()];
  const seen = new Set([start]);
  while (q.length) {
    const cur = q.shift();
    const id = ser(cur);
    states[id] = { terminal: id === goal, safe: true, label: cur.slice() };
    for (let i = 0; i < cur.length - 1; i++) {
      const nxt = cur.slice();
      [nxt[i], nxt[i + 1]] = [nxt[i + 1], nxt[i]];
      const nid = ser(nxt);
      edges.push({ from: id, on: `swap:${i}`, to: nid });
      if (!seen.has(nid)) {
        seen.add(nid);
        q.push(nxt);
      }
    }
    if (id !== start) edges.push({ from: id, on: "reset", to: start, reset: true });
  }
  const solution = bfsSolution(start, goal, edges);
  if (!solution) throw new Error(`${p.id} adjacent swap unsolvable`);
  const fsm = { initial: start, terminal: goal, resetFromAny: true, states, edges, solution };
  assertSolvable(p.id, states, edges, start, goal, solution);
  return fsm;
}

function expandToggles(p) {
  const n = p.count;
  const init = p.initial;
  const goal = p.goal;
  const states = {};
  const edges = [];
  const total = 1 << n;
  const ser = (m) => m.toString(2).padStart(n, "0");
  for (let m = 0; m < total; m++) {
    const id = ser(m);
    states[id] = { terminal: m === goal, safe: true };
    for (let b = 0; b < n; b++) {
      const nxt = m ^ (1 << b);
      edges.push({ from: id, on: `flip:${b}`, to: ser(nxt) });
    }
    if (m !== init) edges.push({ from: id, on: "reset", to: ser(init), reset: true });
  }
  const solution = [];
  let cur = init;
  for (let b = 0; b < n; b++) {
    const bit = 1 << b;
    if ((cur & bit) !== (goal & bit)) {
      solution.push(`flip:${b}`);
      cur ^= bit;
    }
  }
  const fsm = {
    initial: ser(init),
    terminal: ser(goal),
    resetFromAny: true,
    states,
    edges,
    solution,
  };
  assertSolvable(p.id, states, edges, fsm.initial, fsm.terminal, solution);
  return fsm;
}

function expandDials(p) {
  // independent variables, each an inclusive integer range, actions ±1 clamped or wrapping
  const names = Object.keys(p.ranges);
  const ranges = names.map((n) => p.ranges[n]); // [min,max]
  const init = names.map((n) => p.initial[n]);
  const goal = names.map((n) => p.goal[n]);
  const ser = (a) => a.join(",");
  const states = {};
  const edges = [];
  const space = [[]];
  for (const [min, max] of ranges) {
    const next = [];
    for (const base of space) {
      for (let v = min; v <= max; v++) next.push([...base, v]);
    }
    space.length = 0;
    space.push(...next);
  }
  for (const vals of space) {
    const id = ser(vals);
    states[id] = {
      terminal: id === ser(goal),
      safe: true,
      label: Object.fromEntries(names.map((n, i) => [n, vals[i]])),
    };
    names.forEach((n, i) => {
      for (const d of [1, -1]) {
        const nxt = vals.slice();
        const [min, max] = ranges[i];
        nxt[i] = Math.min(max, Math.max(min, nxt[i] + d));
        if (nxt[i] !== vals[i]) {
          edges.push({ from: id, on: `${n}${d > 0 ? "+" : "-"}`, to: ser(nxt) });
        }
      }
    });
    if (id !== ser(init)) edges.push({ from: id, on: "reset", to: ser(init), reset: true });
  }
  const solution = bfsSolution(ser(init), ser(goal), edges);
  if (!solution) throw new Error(`${p.id} dials unsolvable`);
  const fsm = {
    initial: ser(init),
    terminal: ser(goal),
    resetFromAny: true,
    states,
    edges,
    solution,
  };
  assertSolvable(p.id, states, edges, fsm.initial, fsm.terminal, solution);
  return fsm;
}

function expandTestimony(p) {
  if (!p.exemplar?.length) throw new Error(`${p.id} testimony empty`);
  if (JSON.stringify(p.exemplar) !== JSON.stringify(p.carvedDuplicate)) {
    throw new Error(`${p.id} carved duplicate does not match exemplar`);
  }
  const n = p.exemplar.length;
  const states = {};
  const edges = [];
  const alphabet = [...new Set([...p.exemplar, ...(p.decoys || [])])];
  for (let i = 0; i <= n; i++) {
    states[`p${i}`] = { terminal: i === n, safe: true, prefix: p.exemplar.slice(0, i) };
    if (i === n) continue;
    for (const symbol of alphabet) {
      if (symbol === p.exemplar[i]) edges.push({ from: `p${i}`, on: symbol, to: `p${i + 1}` });
      else edges.push({ from: `p${i}`, on: symbol, to: "p0", mismatch: true });
    }
    edges.push({ from: `p${i}`, on: "bell", to: "p0", reset: true, preservesKeys: true, preservesLatched: true });
  }
  const solution = p.exemplar.slice();
  const fsm = {
    initial: "p0",
    terminal: `p${n}`,
    resetFromAny: true,
    states,
    edges,
    solution,
    readableRail: true,
    mismatchShown: true,
  };
  assertSolvable(p.id, states, edges, "p0", `p${n}`, solution);
  return fsm;
}

function expandRailBlock(p) {
  // blocks: [{id, positions:{name:[x,y]}, adjacency:[a,b]}]
  // simultaneous states are the cartesian product; tiles may not overlap
  const blocks = p.blocks;
  const posNames = blocks.map((b) => Object.keys(b.positions));
  const space = [[]];
  for (const names of posNames) {
    const next = [];
    for (const base of space) for (const n of names) next.push([...base, n]);
    space.length = 0;
    space.push(...next);
  }
  const ser = (a) => a.join("|");
  const init = blocks.map((b) => p.initial[b.id]);
  const goal = blocks.map((b) => p.goal[b.id]);
  const tileOf = (assignment) =>
    assignment.map((name, i) => {
      const t = blocks[i].positions[name];
      return `${t[0]},${t[1]}`;
    });
  for (const assignment of space) {
    const tiles = tileOf(assignment);
    if (new Set(tiles).size !== tiles.length) {
      throw new Error(`${p.id} overlapping block tiles at ${ser(assignment)}`);
    }
    for (const t of tiles) {
      if (p.forbiddenTiles?.includes(t)) {
        throw new Error(`${p.id} block occupies forbidden tile ${t} in ${ser(assignment)}`);
      }
    }
  }
  const states = {};
  const edges = [];
  const adjPairs = blocks.map((b) => new Set(b.adjacency.map(([a, c]) => `${a}>${c}`)));
  for (const assignment of space) {
    const id = ser(assignment);
    states[id] = { terminal: id === ser(goal), safe: true, blocks: assignment.slice() };
    blocks.forEach((b, i) => {
      const here = assignment[i];
      for (const [a, c] of b.adjacency) {
        if (a !== here) continue;
        const nxt = assignment.slice();
        nxt[i] = c;
        // occupied?
        const tiles = tileOf(nxt);
        if (new Set(tiles).size !== tiles.length) continue;
        edges.push({ from: id, on: `move:${b.id}:${a}>${c}`, to: ser(nxt) });
      }
    });
    if (id !== ser(init)) edges.push({ from: id, on: "reset", to: ser(init), reset: true });
    void adjPairs;
  }
  const solution = bfsSolution(ser(init), ser(goal), edges);
  if (!solution) throw new Error(`${p.id} rail block unsolvable`);
  const fsm = {
    initial: ser(init),
    terminal: ser(goal),
    resetFromAny: true,
    states,
    edges,
    solution,
    crankTile: p.crankTile,
    forbiddenTiles: p.forbiddenTiles,
  };
  assertSolvable(p.id, states, edges, fsm.initial, fsm.terminal, solution);
  return fsm;
}

function bfsSolution(start, goal, edges) {
  const adj = new Map();
  for (const e of edges) {
    if (e.reset) continue; // prefer a real solution
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push(e);
  }
  const q = [[start, []]];
  const seen = new Set([start]);
  while (q.length) {
    const [c, path] = q.shift();
    if (c === goal) return path;
    for (const e of adj.get(c) || []) {
      if (seen.has(e.to)) continue;
      seen.add(e.to);
      q.push([e.to, [...path, e.on]]);
    }
  }
  return null;
}

export function hitChain(prefix, hits, next, note) {
  const states = {};
  const edges = [];
  for (let i = 0; i < hits; i++) {
    const id = `${prefix}_h${i}`;
    states[id] = { terminal: false, safe: true, note: i === 0 ? note : `Strike ${i + 1} of ${hits}.` };
    const to = i + 1 < hits ? `${prefix}_h${i + 1}` : next;
    edges.push({ from: id, on: "strike", to });
  }
  return { states, edges, first: `${prefix}_h0` };
}

export function linkStates(parts, extraEdges = [], terminalId) {
  const states = {};
  const edges = [...extraEdges];
  for (const p of parts) {
    Object.assign(states, p.states || {});
    edges.push(...(p.edges || []));
  }
  return { states, edges, terminal: terminalId };
}

export { DEEP_POLICY, clone };

export function layersFromFloor(floorRows) {
  const solid = floorRows.map((row) => row.replace(/[^#]/g, "."));
  const water = floorRows.map((row) =>
    row
      .split("")
      .map((ch) => (ch === "W" || ch === "~" || ch === "=" ? ch : "."))
      .join(""),
  );
  const hazard = floorRows.map((row) =>
    row
      .split("")
      .map((ch) => (ch === "!" ? "!" : "."))
      .join(""),
  );
  return { floor: floorRows, solid, water, hazard };
}

export function objectsLayer(floorRows, marks) {
  const g = floorRows.map((row) => row.split("").map((ch) => (ch === "#" ? "#" : ".")));
  for (const m of marks) {
    if (!g[m.y] || g[m.y][m.x] === undefined) continue;
    const prev = g[m.y][m.x];
    g[m.y][m.x] = prev !== "." && prev !== "#" ? "*" : m.glyph;
  }
  return g.map((r) => r.join(""));
}
