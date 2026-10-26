/** Loot ids owned by this pack: loot.expansion.knowledge.001–080. */

export const PACK_ID = "loot.expansion.knowledge";

export function lootId(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 80) {
    throw new Error(`loot id ${n} is outside 001–080`);
  }
  return `${PACK_ID}.${String(n).padStart(3, "0")}`;
}

export function lootNumber(id: string): number | null {
  const m = /^loot\.expansion\.knowledge\.(\d{3})$/.exec(id);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 80 ? n : null;
}

export const ID_BAND = {
  card: [1, 20],
  music: [21, 40],
  puzzle: [41, 60],
  manual: [61, 80],
} as const;

export function bandOf(n: number): "card" | "music" | "puzzle" | "manual" | null {
  if (n >= 1 && n <= 20) return "card";
  if (n >= 21 && n <= 40) return "music";
  if (n >= 41 && n <= 60) return "puzzle";
  if (n >= 61 && n <= 80) return "manual";
  return null;
}
