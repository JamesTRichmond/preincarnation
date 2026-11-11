import type { Cell, HubDef } from "./types.ts";

export function cellKey(c: Cell): string {
  return `${c.x},${c.y}`;
}

export function inBounds(w: number, h: number, c: Cell): boolean {
  return c.x >= 0 && c.y >= 0 && c.x < w && c.y < h;
}

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export function neighbors(c: Cell): Cell[] {
  return NEIGHBORS.map(([dx, dy]) => ({ x: c.x + dx, y: c.y + dy }));
}

export function compileWalk(hub: HubDef): boolean[][] {
  const walk = Array.from({ length: hub.h }, () => Array<boolean>(hub.w).fill(true));
  const paint = (rect: { x: number; y: number; w: number; h: number }, value: boolean) => {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        if (y >= 0 && x >= 0 && y < hub.h && x < hub.w) walk[y]![x] = value;
      }
    }
  };
  for (const s of hub.structures) paint(s, false);
  for (const water of hub.waters) paint(water, false);
  for (const pier of hub.piers) paint(pier, true);
  for (const cell of hub.blocked) {
    if (inBounds(hub.w, hub.h, cell)) walk[cell.y]![cell.x] = false;
  }
  return walk;
}

/**
 * Breadth-first path. Neighbor order is N, E, S, W so equal-length paths
 * are stable. Returns the cells to enter, excluding the start. Empty array
 * means already there. Null means no route.
 */
export function pathfind(
  walk: boolean[][],
  w: number,
  h: number,
  start: Cell,
  goal: Cell,
  blocked: ReadonlySet<string>,
): Cell[] | null {
  if (!inBounds(w, h, start) || !inBounds(w, h, goal)) return null;
  if (!walk[goal.y]?.[goal.x]) return null;
  if (blocked.has(cellKey(goal))) return null;
  if (start.x === goal.x && start.y === goal.y) return [];

  const prev = new Map<string, string | null>();
  const q: Cell[] = [start];
  prev.set(cellKey(start), null);

  while (q.length) {
    const cur = q.shift()!;
    for (const n of neighbors(cur)) {
      if (!inBounds(w, h, n)) continue;
      const k = cellKey(n);
      if (prev.has(k)) continue;
      if (!walk[n.y]?.[n.x]) continue;
      if (blocked.has(k)) continue;
      prev.set(k, cellKey(cur));
      if (n.x === goal.x && n.y === goal.y) {
        const path: Cell[] = [];
        let cursor: string | null = k;
        while (cursor && cursor !== cellKey(start)) {
          const [xs, ys] = cursor.split(",");
          path.push({ x: Number(xs), y: Number(ys) });
          cursor = prev.get(cursor) ?? null;
        }
        path.reverse();
        return path;
      }
      q.push(n);
    }
  }
  return null;
}

export function facingBetween(from: Cell, to: Cell): "n" | "e" | "s" | "w" {
  if (to.y < from.y) return "n";
  if (to.x > from.x) return "e";
  if (to.y > from.y) return "s";
  return "w";
}

/** Spiral-free BFS for the nearest walkable cell that is not in `taken`. */
export function nearestOpen(
  walk: boolean[][],
  w: number,
  h: number,
  origin: Cell,
  blocked: ReadonlySet<string>,
  taken: ReadonlySet<string>,
): Cell | null {
  const q: Cell[] = [origin];
  const seen = new Set<string>([cellKey(origin)]);
  while (q.length) {
    const c = q.shift()!;
    const k = cellKey(c);
    if (
      inBounds(w, h, c) &&
      walk[c.y]?.[c.x] &&
      !blocked.has(k) &&
      !taken.has(k)
    ) {
      return c;
    }
    for (const n of neighbors(c)) {
      if (!inBounds(w, h, n)) continue;
      const nk = cellKey(n);
      if (seen.has(nk)) continue;
      seen.add(nk);
      q.push(n);
    }
  }
  return null;
}
