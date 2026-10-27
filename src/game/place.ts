import { T } from "./tile-ids.ts";

/** How long a county creature holds still and shows the ring before it closes. */
export const TELL_S = 0.4;
/** Inside this, a warned creature can bite. */
export const BITE = 12;
/** Entering this starts the tell. The Sentinel is not on this clock. */
export const TELL_RANGE = 22;
/** Past this, the warning is forgotten and the next approach tells again. */
export const TELL_LEAVE = 40;

export type TellStep = "walk" | "tell" | "close" | "bite";

/** Ground underfoot. The town name stays in the save; this is the tile you are standing on. */
export function placeUnderfoot(tile: number, mapId: string): string {
  if (mapId === "quarry" && (tile === T.marble || tile === T.cracked || tile === T.marbleWall)) return "The Vein";
  if (tile === T.water) return "In the creek";
  if (tile === T.bridge) return "On the bridge";
  if (tile === T.marble || tile === T.cracked || tile === T.marbleWall) return "Cut stone";
  if (tile === T.pine) return "In the pines";
  if (tile === T.cliff || tile === T.cliffLip) return "On the lip";
  if (tile === T.wood) return "On the boards";
  if (tile === T.cobble) return "On the green";
  if (tile === T.path || tile === T.gravel || tile === T.rail) return "On the path";
  if (tile === T.soil || tile === T.sand) return "On the soil";
  if (tile === T.flowers) return "In the flowers";
  return "In the meadow";
}

export function tellHold(kind: string): number {
  if (kind === "bear" || kind === "resident") return 0.7;
  if (kind === "crow") return 0.22;
  if (kind === "bobcat") return 0.28;
  return TELL_S;
}

/**
 * County creatures show a ring before they bite. The Sentinel is not on this
 * clock: the Vein already teaches that tell.
 */
export function countyTell(
  kind: string,
  dist: number,
  tell: number,
  warned: boolean,
  dt: number,
): { tell: number; warned: boolean; step: TellStep } {
  if (kind === "sentinel") return { tell: 0, warned, step: "walk" };
  if (dist >= TELL_LEAVE) return { tell: 0, warned: false, step: "walk" };
  if (tell > 0) {
    const next = tell - dt;
    if (next > 0) return { tell: next, warned: true, step: "tell" };
    return { tell: 0, warned: true, step: dist < BITE ? "bite" : "close" };
  }
  if (!warned && dist < TELL_RANGE) return { tell: tellHold(kind), warned: true, step: "tell" };
  if (dist < BITE) return { tell: 0, warned: true, step: "bite" };
  if (warned) return { tell: 0, warned: true, step: "close" };
  return { tell: 0, warned: false, step: "walk" };
}

/** Pixel marks for the tell: a ring, then a broken line toward you. */
export function tellPixels(
  ex: number,
  ey: number,
  px: number,
  py: number,
  told: number,
  total = TELL_S,
): Array<[number, number]> {
  const grow = 5 + (1 - Math.max(0, Math.min(1, told / total))) * 6;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pts.push([Math.round(ex + Math.cos(a) * grow), Math.round(ey + Math.sin(a) * grow)]);
  }
  for (let i = 1; i <= 5; i += 2) {
    const t = i / 6;
    pts.push([Math.round(ex + (px - ex) * t), Math.round(ey + (py - ey) * t)]);
  }
  return pts;
}
