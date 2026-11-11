/** Shared grid helpers for hand-authored rooms. Not a generator of layouts. */
export const W = 18;
export const H = 12;

export function chamber() {
  const rows = ["##################"];
  for (let y = 1; y < H - 1; y++) rows.push("#................#");
  rows.push("##################");
  return rows;
}

export function stamp(grid, edits, label = "grid") {
  const g = grid.map((r) => r.split(""));
  for (const [x, y, ch] of edits) {
    if (!g[y] || g[y][x] === undefined) {
      throw new Error(`${label} stamp out of range ${x},${y}`);
    }
    g[y][x] = ch;
  }
  const out = g.map((r) => r.join(""));
  assertGrid(label, out);
  return out;
}

export function assertGrid(label, grid) {
  if (!Array.isArray(grid) || grid.length !== H) {
    throw new Error(`${label} height ${grid?.length} expected ${H}`);
  }
  for (let y = 0; y < grid.length; y++) {
    if (typeof grid[y] !== "string" || grid[y].length !== W) {
      throw new Error(`${label} row ${y} width ${grid[y]?.length} expected ${W} [${grid[y]}]`);
    }
  }
  return grid;
}

export function objects(paints, label = "objects") {
  const g = Array.from({ length: H }, () => Array.from({ length: W }, () => " "));
  for (const [x, y, ch] of paints) {
    if (!g[y] || g[y][x] === undefined) throw new Error(`${label} paint ${x},${y}`);
    g[y][x] = ch;
  }
  return g.map((r) => r.join(""));
}

export function link(id, tile, to, arrival, extra = {}) {
  return {
    id,
    tile,
    to,
    arrival,
    elseTo: null,
    elseArrival: null,
    transitionSteps: 0,
    kind: "walk",
    godBypass: false,
    consumes: [],
    ...extra,
    when: { all: [], ...(extra.when || {}) },
  };
}

export function flagInteract(partial) {
  return {
    kind: "flag",
    requiresForm: "mortal",
    requiresTools: [],
    requiresFlags: [],
    sets: [],
    once: true,
    persistent: true,
    glyph: "*",
    failText: {
      form: "Embryonic God can look. Only a mortal body can do this.",
      tool: "The tool in hand is wrong.",
      flags: "Something this act depends on is unfinished.",
      already: "Already done.",
    },
    successText: "Done.",
    ...partial,
  };
}
