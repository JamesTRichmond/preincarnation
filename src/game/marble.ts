/** Marble Vein combat rules. One quarry, one plot.
 * The orchard blade sparks on cracked marble. The hammer opens a true plug.
 * Two faces in the quarry row are decoys and stay shut.
 * The Sentinel holds gold for 0.6s (36 frames at 60fps) before each lunge.
 */

export const BLADE_ON_MARBLE = "The blade sparks. Marble wants the hammer.";
export const HAMMER_ON_MARBLE = "The plug gives. North is open.";
export const DECOY_ON_MARBLE = "The face is whole. The crack was a decoy.";
export const BOMB_ON_MARBLE = "The vein gives. The quarry opens.";

export const SENTINEL_GOLD_SEC = 0.6;
export const SENTINEL_LUNGE_SEC = 0.45;
export const SENTINEL_FPS = 60;

export type MarbleTool = "blade" | "hammer" | "bomb";
export type CrackRole = "true" | "decoy";
export type SentinelBeat = "still" | "gold" | "lunge";

/** Quarry plug is y=5, x=14..21. The lock-line (16) and the hammer's face (18) are false. */
const QUARRY_DECOY: ReadonlyArray<readonly [number, number]> = [
  [16, 5],
  [18, 5],
];

export function crackRole(mapId: string, x: number, y: number): CrackRole {
  if (mapId === "quarry" && QUARRY_DECOY.some(([dx, dy]) => dx === x && dy === y)) return "decoy";
  return "true";
}

export function strikeMarble(tool: MarbleTool, role: CrackRole): { open: boolean; line: string } {
  if (tool === "blade") return { open: false, line: BLADE_ON_MARBLE };
  if (role === "decoy") return { open: false, line: DECOY_ON_MARBLE };
  if (tool === "hammer") return { open: true, line: HAMMER_ON_MARBLE };
  return { open: true, line: BOMB_ON_MARBLE };
}

export function stepSentinel(opts: {
  hp: number;
  maxHp: number;
  inRange: boolean;
  beat: SentinelBeat;
  tell: number;
  dt: number;
}): { beat: SentinelBeat; tell: number; moves: boolean; gold: boolean } {
  if (!opts.inRange || opts.hp >= opts.maxHp || opts.hp <= 0) {
    return { beat: "still", tell: 0, moves: false, gold: false };
  }
  if (opts.beat === "still") {
    return { beat: "gold", tell: SENTINEL_GOLD_SEC, moves: false, gold: true };
  }
  if (opts.beat === "gold") {
    const tell = opts.tell - opts.dt;
    if (tell > 1e-4) return { beat: "gold", tell, moves: false, gold: true };
    return { beat: "lunge", tell: SENTINEL_LUNGE_SEC, moves: true, gold: false };
  }
  const tell = opts.tell - opts.dt;
  if (tell > 1e-4) return { beat: "lunge", tell, moves: true, gold: false };
  return { beat: "gold", tell: SENTINEL_GOLD_SEC, moves: false, gold: true };
}
