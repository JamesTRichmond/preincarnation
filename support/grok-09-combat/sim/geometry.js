import { REFERENCE_UNITS as U } from "../reference/units.js";

export const TILE = U.tile_px;

export const DIRS = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

const KIND = {
  "#": "wall",
  ".": "floor",
  "~": "water",
  i: "ice",
  m: "mud",
  "=": "rail",
  p: "pit",
  s: "mercy",
  f: "fins",
  c: "cover",
  L: "lee",
  M: "mouth",
  n: "nest",
  k: "calf",
  r: "rung",
  E: "floor",
  X: "floor",
  P: "pocket",
  "^": "slope",
  g: "verge",
  b: "bank",
};

export function parseArena(ascii) {
  const rows = ascii
    .trim()
    .split("\n")
    .map((row) => row.trimEnd());
  const width = rows[0].length;
  for (const row of rows) {
    if (row.length !== width) {
      throw new Error(`Arena row width ${row.length} != ${width}: ${row}`);
    }
  }
  const tiles = [];
  let start = null;
  const homes = [];
  const points = {};
  rows.forEach((row, ty) => {
    [...row].forEach((ch, tx) => {
      const kind = KIND[ch];
      if (!kind) throw new Error(`Unknown arena glyph '${ch}'`);
      const tile = {
        tx,
        ty,
        x: tx * TILE + TILE / 2,
        y: ty * TILE + TILE / 2,
        ch,
        kind: ch === "E" || ch === "X" ? "floor" : kind,
        glyph: ch,
      };
      tiles.push(tile);
      if (ch === "E") start = { x: tile.x, y: tile.y };
      if (ch === "X") homes.push({ x: tile.x, y: tile.y });
      if (!points[ch]) points[ch] = [];
      points[ch].push({ x: tile.x, y: tile.y, tx, ty });
    });
  });
  return { rows: rows.length, cols: width, tiles, start, homes, points, ascii: rows.join("\n") };
}

export function tileAt(arena, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  return arena.tiles.find((t) => t.tx === tx && t.ty === ty) || null;
}

export function isBlockedTile(tile, { stopAtHazard = false } = {}) {
  if (!tile) return true;
  if (tile.kind === "wall") return true;
  if (stopAtHazard && (tile.kind === "water" || tile.kind === "pit")) return true;
  return false;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function ellisHurt(actor) {
  const w = U.ellis.hurtbox.w;
  const h = U.ellis.hurtbox.h;
  return { x: actor.x - w / 2, y: actor.y - h / 2, w, h };
}

export function bodyRect(actor) {
  const w = actor.footprint?.w ?? 16;
  const h = actor.footprint?.h ?? 16;
  return { x: actor.x - w / 2, y: actor.y - h / 2, w, h };
}

export function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function faceToward(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? "E" : "W";
  return dy >= 0 ? "S" : "N";
}

export function placeBox(origin, facing, shape) {
  if (shape.absolute) {
    return { x: shape.x, y: shape.y, w: shape.w, h: shape.h };
  }
  const dir = DIRS[facing];
  const right = { x: -dir.y, y: dir.x };
  const along = shape.along ?? shape.w ?? 16;
  const across = shape.across ?? shape.h ?? 12;
  const ox = shape.ox ?? along / 2;
  const oy = shape.oy ?? 0;
  const cx = origin.x + dir.x * ox + right.x * oy;
  const cy = origin.y + dir.y * ox + right.y * oy;
  const vertical = facing === "N" || facing === "S";
  const w = vertical ? across : along;
  const h = vertical ? along : across;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/**
 * Move along one cardinal, rejecting the step if the collision box hits a wall.
 * Hazard tiles stop the step when stopAtHazard is set (knockback law).
 */
export function tryMove(
  actor,
  dirName,
  distance,
  arena,
  { stopAtHazard = false, allowHazard = false } = {},
) {
  if (!dirName || dirName === "hold" || distance === 0) return false;
  const dir = DIRS[dirName];
  if (!dir) return false;
  const nx = actor.x + dir.x * distance;
  const ny = actor.y + dir.y * distance;
  const half = 6;
  const samples = [
    [nx - half, ny - half],
    [nx + half, ny - half],
    [nx - half, ny + half],
    [nx + half, ny + half],
    [nx, ny],
  ];
  for (const [sx, sy] of samples) {
    const tile = tileAt(arena, sx, sy);
    if (!tile || tile.kind === "wall") return false;
    if (!allowHazard && stopAtHazard && (tile.kind === "water" || tile.kind === "pit"))
      return false;
  }
  actor.x = nx;
  actor.y = ny;
  return true;
}

export function knockback(actor, facing, px, arena) {
  const dir = DIRS[facing] || DIRS.S;
  const steps = Math.max(0, Math.round(px));
  for (let i = 0; i < steps; i++) {
    const moved = tryMove(actor, facingOf(dir), 1, arena, { stopAtHazard: true });
    if (!moved) break;
  }
}

function facingOf(dir) {
  if (dir.x > 0) return "E";
  if (dir.x < 0) return "W";
  if (dir.y > 0) return "S";
  return "N";
}

export function hasLineOfSight(arena, a, b) {
  let x0 = Math.floor(a.x / TILE);
  let y0 = Math.floor(a.y / TILE);
  const x1 = Math.floor(b.x / TILE);
  const y1 = Math.floor(b.y / TILE);
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (x0 !== x1 || y0 !== y1) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
    if (x0 === x1 && y0 === y1) break;
    const tile = arena.tiles.find((t) => t.tx === x0 && t.ty === y0);
    if (!tile || tile.kind === "wall") return false;
  }
  return true;
}

export const DEFAULT_ARENA = parseArena(`
###############
#.............#
#.............#
#.............#
#.............#
#......X......#
#.............#
#.............#
#.............#
#......E......#
#.............#
#.............#
###############
`);
