import type { MapId } from "./types";
import { T } from "./tile-ids";

/** Fourteen winters is one generation. HUD year is the only clock that matters. */
export function generations(year: number) {
  return Math.max(0, Math.floor((year - 2026) / 14));
}

export const TOWN_SPAWN: Partial<Record<MapId, { x: number; y: number }>> = {
  middlebury: { x: 18, y: 7 },
  vergennes: { x: 12, y: 10 },
  bristol: { x: 14, y: 10 },
  ferrisburgh: { x: 12, y: 8 },
  salisbury: { x: 12, y: 9 },
  farmstead: { x: 12, y: 9 },
  quarry: { x: 16, y: 13 },
  addison: { x: 36, y: 28 },
};

const WARP_NAMES: Record<string, string> = {
  quarry: "Marble Vein",
  addison: "Addison County",
  middlebury: "Middlebury",
  vergennes: "Vergennes",
  bristol: "Bristol",
  ferrisburgh: "Ferrisburgh",
  salisbury: "Salisbury",
  farmstead: "Salisbury",
  rutland: "Rutland",
  chittenden: "Chittenden",
  windsor: "Windsor",
  montpelier: "Montpelier",
  whiteriver: "White River",
  burlington: "Burlington",
  soloverse: "Soloverse",
};

export function warpLabel(id: string, dest?: string | null) {
  if (id.includes("quarry") || dest === "quarry") return "Marble Vein";
  if (id.includes("seam") || dest === "soloverse") return "Soloverse";
  if (id.includes("overworld") || dest === "addison") return "Addison County";
  if (dest && WARP_NAMES[dest]) return WARP_NAMES[dest];
  if (id.startsWith("to-")) {
    const key = id.slice(3).replace(/-q$/, "");
    return WARP_NAMES[key] ?? "Enter";
  }
  return "Enter";
}

/** Pines die, cobble goes to gravel, paths wear. Magic does not live here. */
export function ageTiles(tiles: number[][], year: number, seed = 1) {
  const g = generations(year);
  if (g <= 0) return;
  let s = seed * 9973 + g * 17;
  const h = tiles.length;
  const w = tiles[0]?.length ?? 0;
  const n = 12 + g * 22;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const x = 2 + (s % Math.max(1, w - 4));
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const y = 2 + (s % Math.max(1, h - 4));
    const t = tiles[y]?.[x];
    if (t === T.pine) tiles[y][x] = g >= 2 ? T.soil : T.grass;
    else if (t === T.cobble) tiles[y][x] = T.gravel;
    else if (t === T.flowers) tiles[y][x] = T.grass;
    else if (t === T.path && g >= 2 && i % 3 === 0) tiles[y][x] = T.gravel;
  }
}
