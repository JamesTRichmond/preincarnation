export type Path = Array<[number, number]>;

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function gridProblems(rows: string[]): string[] {
  const problems: string[] = [];
  if (rows.length < 3 || rows.length > 6) problems.push("board height out of 3\u20136");
  const w = rows[0]?.length ?? 0;
  if (w < 3 || w > 6) problems.push("board width out of 3\u20136");
  if (rows.some((r) => r.length !== w)) problems.push("ragged rows");
  let a = 0;
  let h = 0;
  let sugars = 0;
  let walk = 0;
  for (const row of rows) {
    for (const ch of row) {
      if (!"#.SAH".includes(ch)) problems.push(`bad cell ${ch}`);
      if (ch === "A") a += 1;
      if (ch === "H") h += 1;
      if (ch === "S") sugars += 1;
      if (ch !== "#") walk += 1;
    }
  }
  if (a !== 1) problems.push(`expected one tap, found ${a}`);
  if (h !== 1) problems.push(`expected one hearth, found ${h}`);
  if (sugars < 2 || sugars > 8) problems.push(`sugar count ${sugars} outside 2\u20138`);
  if (walk > 18) problems.push(`walkable ${walk} exceeds 18`);
  return problems;
}

export function findCell(rows: string[], ch: string): [number, number] | null {
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) if (rows[r][c] === ch) return [r, c];
  }
  return null;
}

export function sugarCells(rows: string[]): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) if (rows[r][c] === "S") out.push([r, c]);
  }
  return out;
}

export function validatePath(
  rows: string[],
  path: Path,
  requireAllSugars: boolean,
): string[] {
  const reasons: string[] = [];
  if (path.length < 2) return ["path too short"];
  const start = findCell(rows, "A");
  const goal = findCell(rows, "H");
  if (!start || !goal) return ["missing tap or hearth"];
  const [sr, sc] = path[0];
  const [er, ec] = path[path.length - 1];
  if (sr !== start[0] || sc !== start[1]) reasons.push("path does not start on the tap");
  if (er !== goal[0] || ec !== goal[1]) reasons.push("path does not end on the hearth");
  const seen = new Set<string>();
  const sugars = new Set(sugarCells(rows).map(key));
  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    if (r < 0 || c < 0 || r >= rows.length || c >= rows[0].length) {
      reasons.push("path leaves the board");
      break;
    }
    const ch = rows[r][c];
    if (ch === "#") reasons.push(`path enters a wall at ${r},${c}`);
    const k = key([r, c]);
    if (seen.has(k)) reasons.push(`revisits ${r},${c}`);
    seen.add(k);
    if (ch === "S") sugars.delete(k);
    if (ch === "H" && i !== path.length - 1) reasons.push("enters the hearth early");
    if (i > 0) {
      const [pr, pc] = path[i - 1];
      const dist = Math.abs(pr - r) + Math.abs(pc - c);
      if (dist !== 1) reasons.push(`diagonal or jump at ${r},${c}`);
    }
  }
  if (requireAllSugars && sugars.size) reasons.push(`misses sugar ${[...sugars].join(" ")}`);
  return reasons;
}

export function missesSugar(rows: string[], path: Path): boolean {
  const hit = new Set(path.map(key));
  return sugarCells(rows).some((s) => !hit.has(key(s)));
}

export function solve(rows: string[], limit = 80000): Path | null {
  const problems = gridProblems(rows);
  if (problems.length) return null;
  const h = rows.length;
  const w = rows[0].length;
  const index = new Map<string, number>();
  const coords: Array<[number, number]> = [];
  let start = -1;
  let goal = -1;
  let sugarMask = 0;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = rows[r][c];
      if (ch === "#") continue;
      const i = coords.length;
      index.set(key([r, c]), i);
      coords.push([r, c]);
      if (ch === "A") start = i;
      if (ch === "H") goal = i;
      if (ch === "S") sugarMask |= 1 << i;
    }
  }
  if (start < 0 || goal < 0 || coords.length > 18) return null;
  const neigh: number[][] = coords.map(([r, c]) => {
    const out: number[] = [];
    for (const [dr, dc] of DIRS) {
      const j = index.get(key([r + dr, c + dc]));
      if (j !== undefined) out.push(j);
    }
    return out;
  });
  let nodes = 0;
  function dfs(i: number, mask: number): number[] | null {
    if (++nodes > limit) return null;
    const next = mask | (1 << i);
    if (i === goal) return (next & sugarMask) === sugarMask ? [i] : null;
    for (const n of neigh[i]) {
      if (next & (1 << n)) continue;
      const sub = dfs(n, next);
      if (sub) return [i, ...sub];
    }
    return null;
  }
  const found = dfs(start, 0);
  if (!found) return null;
  return found.map((i) => coords[i]);
}

export function canonicalGrid(rows: string[]): string {
  return rows.join("/");
}

function key(p: [number, number]): string {
  return `${p[0]},${p[1]}`;
}

export type CarveSpec = {
  w: number;
  h: number;
  solution: Path;
  trap: Path;
  sugars: Path;
  decoys?: Path;
};

export function carve(spec: CarveSpec): { rows: string[]; error?: string } {
  const { w, h, solution, trap, sugars, decoys = [] } = spec;
  if (w < 3 || h < 3 || w > 6 || h > 6) return { rows: [], error: "carve size" };
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => "#"));
  const open = (path: Path, label: string): string | null => {
    for (const [r, c] of path) {
      if (r < 0 || c < 0 || r >= h || c >= w) return `${label} out of bounds ${r},${c}`;
      grid[r][c] = ".";
    }
    return null;
  };
  const err = open(solution, "solution") || open(trap, "trap") || open(decoys, "decoy");
  if (err) return { rows: [], error: err };
  for (const [r, c] of sugars) {
    if (grid[r][c] !== ".") return { rows: [], error: `sugar not on an open cell ${r},${c}` };
    grid[r][c] = "S";
  }
  const [sr, sc] = solution[0];
  const [er, ec] = solution[solution.length - 1];
  grid[sr][sc] = "A";
  grid[er][ec] = "H";
  if (trap[0][0] !== sr || trap[0][1] !== sc) return { rows: [], error: "trap does not share the tap" };
  const [tr, tc] = trap[trap.length - 1];
  if (tr !== er || tc !== ec) return { rows: [], error: "trap does not share the hearth" };
  return { rows: grid.map((row) => row.join("")) };
}
