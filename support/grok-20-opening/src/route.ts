import type { Dir, MapId, State } from "./types.ts";
import { DIR_LIST, DIRS, blocked, entity, inBounds, lethal, portalAt } from "./world.ts";

export interface Goal {
  map: MapId;
  x: number;
  y: number;
}

function key(map: MapId, x: number, y: number): string {
  return map + ":" + x + ":" + y;
}

interface Node {
  map: MapId;
  x: number;
  y: number;
  dir: Dir | null;
  prev: number;
}

function rebuild(nodes: Node[], idx: number): Dir[] {
  const dirs: Dir[] = [];
  let i = idx;
  while (i > 0) {
    const n = nodes[i];
    if (n.dir) dirs.push(n.dir);
    i = n.prev;
  }
  dirs.reverse();
  return dirs;
}

/** Shortest walk on the current county. Lethal tiles are walls unless they are the goal. */
export function route(state: State, goals: Goal[], opts?: { allowLethal?: boolean }): Dir[] | null {
  if (!goals.length) return null;
  const goalSet = new Set(goals.map((g) => key(g.map, g.x, g.y)));
  const nodes: Node[] = [{ map: state.map, x: state.x, y: state.y, dir: null, prev: -1 }];
  const seen = new Set([key(state.map, state.x, state.y)]);
  if (goalSet.has(key(state.map, state.x, state.y))) return [];
  let qi = 0;
  while (qi < nodes.length) {
    const cur = nodes[qi];
    for (const dir of DIR_LIST) {
      const nx = cur.x + DIRS[dir].x;
      const ny = cur.y + DIRS[dir].y;
      if (!inBounds(cur.map, nx, ny)) continue;
      if (blocked(state, cur.map, nx, ny)) continue;
      if (lethal(state, cur.map, nx, ny)) {
        if (opts?.allowLethal && goalSet.has(key(cur.map, nx, ny))) {
          const idx = nodes.length;
          nodes.push({ map: cur.map, x: nx, y: ny, dir, prev: qi });
          return rebuild(nodes, idx);
        }
        continue;
      }
      let nm: MapId = cur.map;
      let tx = nx;
      let ty = ny;
      const portal = portalAt(cur.map, nx, ny);
      if (portal) {
        nm = portal.to;
        tx = portal.tx;
        ty = portal.ty;
      }
      if (lethal(state, nm, tx, ty) || blocked(state, nm, tx, ty)) continue;
      const k = key(nm, tx, ty);
      if (seen.has(k)) continue;
      seen.add(k);
      const idx = nodes.length;
      nodes.push({ map: nm, x: tx, y: ty, dir, prev: qi });
      if (goalSet.has(k)) return rebuild(nodes, idx);
    }
    qi++;
    if (qi > 8000) return null;
  }
  return null;
}

export function routeToTile(state: State, map: MapId, x: number, y: number, opts?: { allowLethal?: boolean }): Dir[] | null {
  return route(state, [{ map, x, y }], opts);
}

export function routeToEntity(state: State, id: string): Dir[] | null {
  const e = entity(id);
  const solid = e.solid && !(e.id === "gate" && state.flags.rootCut);
  const goals: Goal[] = [];
  if (!solid && !lethal(state, e.map, e.x, e.y) && !portalAt(e.map, e.x, e.y)) {
    goals.push({ map: e.map, x: e.x, y: e.y });
  }
  for (const d of DIR_LIST) {
    const x = e.x + DIRS[d].x;
    const y = e.y + DIRS[d].y;
    if (!inBounds(e.map, x, y)) continue;
    if (blocked(state, e.map, x, y) || lethal(state, e.map, x, y) || portalAt(e.map, x, y)) continue;
    goals.push({ map: e.map, x, y });
  }
  return route(state, goals);
}
