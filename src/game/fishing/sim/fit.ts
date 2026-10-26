import { SPECIES } from "../data/species.ts";
import type { Gear, HourPeriod, Location, Spot, FishProfile } from "./types.ts";

export function hourPeriod(hour: number): HourPeriod {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 4 && h < 7) return "dawn";
  if (h >= 7 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

export function speciesFit(sp: FishProfile, loc: Location, spot: Spot, gear: Gear, hour: number): number {
  if (!loc.speciesIds.includes(sp.id)) return 0;
  if (spot.barren) return 0.02;
  const period = hourPeriod(hour);
  const tags = new Set<string>([
    ...spot.tags,
    loc.conditions.current,
    loc.conditions.clarity,
    loc.conditions.cover,
    loc.conditions.depth,
    loc.conditions.wind,
  ]);
  let hits = 0;
  for (const tag of sp.habitat) if (tags.has(tag)) hits += 1;
  let score = hits * 0.22;
  score += sp.light.includes(period) ? 0.45 : -0.25;
  if (gear.motion === "either" || gear.motion === sp.motion) score += 0.38;
  else score -= 0.2;
  score += sp.scent * gear.scent * 0.35;
  score += sp.flash * gear.flash * 0.35;
  score -= sp.shy * gear.flash * 0.55;
  score += sp.shy * gear.stealth * 0.12;
  if (spot.sweet) score += 0.15;
  return Math.max(0, score);
}

export interface RankedSpecies {
  id: string;
  score: number;
}

export function rankSpecies(loc: Location, spot: Spot, gear: Gear, hour: number): RankedSpecies[] {
  return SPECIES.map((sp) => ({ id: sp.id, score: speciesFit(sp, loc, spot, gear, hour) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function pickSpecies(ranked: RankedSpecies[], rngValue: number): string | null {
  const top = ranked[0];
  if (!top || top.score < 0.35) return null;
  const pool = ranked.filter((row) => row.score >= top.score * 0.72 && row.score >= 0.35);
  const total = pool.reduce((sum, row) => sum + row.score, 0);
  if (total <= 0) return top.id;
  let cursor = rngValue * total;
  for (const row of pool) {
    cursor -= row.score;
    if (cursor <= 0) return row.id;
  }
  return pool[pool.length - 1]?.id ?? null;
}

export function spotAt(loc: Location, x: number, y: number): Spot | null {
  let best: Spot | null = null;
  let bestD = Infinity;
  for (const spot of loc.spots) {
    const d = Math.hypot(spot.x - x, spot.y - y);
    if (d <= spot.radius && d < bestD) {
      best = spot;
      bestD = d;
    }
  }
  return best;
}
