import { TILE } from "./snes.ts";

export const PARTICLE_CAP = 96;
export const SLASH_CAP = 12;
export const FLOAT_CAP = 16;

export function trimCapped<T>(list: T[], cap: number): void {
  if (list.length > cap) list.splice(0, list.length - cap);
}

const PREFER: Array<[number, number]> = [
  [0, 1],
  [1, 1],
  [-1, 1],
  [1, 0],
  [-1, 0],
  [2, 1],
  [-2, 1],
  [0, 2],
  [1, 2],
  [-1, 2],
  [0, -1],
  [1, -1],
  [-1, -1],
];

/** Step a body out of a solid cell. South first, so a quarry wall and a door stoop share one rule. */
export function unstickSpot(px: number, py: number, blocked: (x: number, y: number) => boolean): { x: number; y: number } {
  if (!blocked(px, py)) return { x: px, y: py };
  const tx0 = Math.floor(px / TILE);
  const ty0 = Math.floor(py / TILE);
  const tryAt = (dx: number, dy: number) => {
    const x = (tx0 + dx) * TILE + 8;
    const y = (ty0 + dy) * TILE + 8;
    return blocked(x, y) ? null : { x, y };
  };
  for (const [dx, dy] of PREFER) {
    const spot = tryAt(dx, dy);
    if (spot) return spot;
  }
  for (let r = 1; r <= 16; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const spot = tryAt(dx, dy);
        if (spot) return spot;
      }
    }
  }
  return { x: px, y: py };
}
