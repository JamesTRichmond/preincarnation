import type { Gear } from "../sim/types.ts";

/**
 * Five fixed outfits. They change what you can reach and what you can horse.
 * Nothing here is random loot, and nothing upgrades into a sixth rod.
 */
export const GEAR: Gear[] = [
  {
    id: "willow-worm",
    name: "Willow pole and worm",
    summary: "Short, scented, kind to panfish. A hard run will break it if you tow.",
    castRange: 0.34,
    stealth: 0.55,
    flash: 0.05,
    scent: 0.92,
    motion: "either",
    ceiling: 0.4,
    landSpeed: 0.84,
    accuracy: 0.7,
  },
  {
    id: "brook-wet",
    name: "Brook rod and wet fly",
    summary: "Pocket water and trout. It will not reach the bay.",
    castRange: 0.58,
    stealth: 0.82,
    flash: 0.14,
    scent: 0.04,
    motion: "drift",
    ceiling: 0.5,
    landSpeed: 0.9,
    accuracy: 0.78,
  },
  {
    id: "spinning-spoon",
    name: "Spinning rod and spoon",
    summary: "Long and bright. Pike, bass, walleye. Trout leave the seam.",
    castRange: 0.96,
    stealth: 0.22,
    flash: 0.92,
    scent: 0,
    motion: "retrieve",
    ceiling: 0.95,
    landSpeed: 1.18,
    accuracy: 0.66,
  },
  {
    id: "cane-dry",
    name: "Cane rod and dry fly",
    summary: "Quiet, exact, and a light tippet. Flat-water trout. Do not tow a bass.",
    castRange: 0.62,
    stealth: 0.96,
    flash: 0.08,
    scent: 0,
    motion: "drift",
    ceiling: 0.34,
    landSpeed: 0.76,
    accuracy: 0.9,
  },
  {
    id: "handline-dough",
    name: "Handline and dough",
    summary: "Almost no cast. The mud trusts it. Bullheads especially.",
    castRange: 0.24,
    stealth: 0.48,
    flash: 0.02,
    scent: 1,
    motion: "dead",
    ceiling: 0.88,
    landSpeed: 1.02,
    accuracy: 0.5,
  },
];

export const GEAR_BY_ID: Record<string, Gear> = Object.fromEntries(GEAR.map((g) => [g.id, g]));

export const CREEL_LIMIT = 4;
