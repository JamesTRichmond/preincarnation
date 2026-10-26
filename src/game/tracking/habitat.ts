/** Representative habitat geometry for one Addison County margin. Not the campaign map. */

import type { Circle, Point } from "./types.ts";

export const WORLD = { w: 3000, h: 2100 };

/** Beside a fox track in the lower hay. The mark is a scuff, not a beacon. */
export const PLAYER_START: Point = { x: 1024, y: 1210 };

export const P = {
  foxM0: { x: 1010, y: 1188 },
  foxM1: { x: 1200, y: 1040 },
  foxM2: { x: 1450, y: 900 },
  foxM3: { x: 1620, y: 820 },
  foxMEscape: { x: 1840, y: 760 },
  foxMEscape2: { x: 2060, y: 740 },

  bed: { x: 2320, y: 1040 },
  deerT2: { x: 2080, y: 900 },
  deerGapE: { x: 2000, y: 740 },
  deerGapW: { x: 1880, y: 740 },
  deerSouth: { x: 1640, y: 700 },
  deerOrchard: { x: 1500, y: 500 },
  apples: { x: 1280, y: 390 },
  deerEscape: { x: 2620, y: 1240 },
  deerEscape2: { x: 2860, y: 1480 },

  oak1: { x: 2460, y: 480 },
  oak2: { x: 2580, y: 390 },
  oakEscape: { x: 2860, y: 300 },

  grouse1: { x: 2240, y: 200 },
  grouse2: { x: 2400, y: 280 },
  grouseEscape: { x: 2720, y: 140 },

  cat1: { x: 2520, y: 1700 },
  cat2: { x: 2680, y: 1840 },
  catEscape: { x: 2880, y: 1580 },

  bun1: { x: 740, y: 310 },
  bun2: { x: 880, y: 270 },
  bun3: { x: 1020, y: 330 },
  bunEscape: { x: 700, y: 176 },

  foxO1: { x: 1600, y: 280 },
  foxO2: { x: 1740, y: 220 },
  foxO3: { x: 1860, y: 300 },
  foxOEscape: { x: 1900, y: 110 },

  year1: { x: 560, y: 540 },
  year2: { x: 700, y: 460 },
  yearEscape: { x: 500, y: 220 },

  musk1: { x: 920, y: 1580 },
  musk2: { x: 1080, y: 1660 },
  muskEscape: { x: 740, y: 1740 },

  duck1: { x: 660, y: 1380 },
  duck2: { x: 520, y: 1280 },
  duckEscape: { x: 110, y: 1240 },

  coonM1: { x: 1300, y: 1740 },
  coonM2: { x: 1440, y: 1840 },
  coonMEscape: { x: 1120, y: 1980 },

  berm1: { x: 1160, y: 1320 },
  berm2: { x: 1320, y: 1260 },
  bermEscape: { x: 1020, y: 1480 },

  yote1: { x: 680, y: 1480 },
  yote2: { x: 980, y: 1560 },
  yote3: { x: 1320, y: 1500 },
  yoteEscape: { x: 1680, y: 1680 },

  turkF1: { x: 1720, y: 1080 },
  turkF2: { x: 1860, y: 980 },
  turkFEscape: { x: 1900, y: 740 },
  turkFEscape2: { x: 2140, y: 740 },

  alf1: { x: 1080, y: 780 },
  alf2: { x: 1240, y: 840 },
  alfEscape: { x: 860, y: 980 },
  alfEscape2: { x: 680, y: 1120 },

  otter1: { x: 340, y: 1100 },
  otter2: { x: 370, y: 960 },
  otterEscape: { x: 80, y: 1020 },

  beav1: { x: 380, y: 480 },
  beav2: { x: 420, y: 360 },
  beavEscape: { x: 90, y: 420 },

  coonF1: { x: 420, y: 1560 },
  coonF2: { x: 500, y: 1660 },
  coonFEscape: { x: 280, y: 1760 },
} as const;

/** Openings where a body can be watched. Trees and reeds are not spawned here. */
export const CLEARINGS: Circle[] = [
  { x: 2320, y: 1040, r: 108 },
  { x: 1280, y: 390, r: 84 },
  { x: 640, y: 500, r: 76 },
  { x: 1720, y: 250, r: 70 },
  { x: 2520, y: 440, r: 120 },
  { x: 2240, y: 200, r: 76 },
  { x: 2580, y: 1760, r: 100 },
  { x: 880, y: 280, r: 64 },
  { x: 980, y: 1600, r: 78 },
  { x: 640, y: 1340, r: 86 },
  { x: 1360, y: 1780, r: 76 },
  { x: 1220, y: 1300, r: 64 },
];

export const WALLS: { x1: number; y1: number; x2: number; y2: number }[] = [
  { x1: 500, y1: 640, x2: 1100, y2: 640 },
  { x1: 1180, y1: 640, x2: 1600, y2: 640 },
  { x1: 1680, y1: 640, x2: 1940, y2: 640 },
  { x1: 1960, y1: 80, x2: 1960, y2: 700 },
  { x1: 1960, y1: 780, x2: 1960, y2: 1400 },
  { x1: 1960, y1: 1480, x2: 1960, y2: 1980 },
];

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function inClearing(x: number, y: number, pad: number) {
  return CLEARINGS.some((c) => {
    const dx = x - c.x;
    const dy = y - c.y;
    return dx * dx + dy * dy < (c.r + pad) * (c.r + pad);
  });
}

export function buildCover(): Circle[] {
  const out: Circle[] = [];
  const rand = mulberry32(36);
  for (let i = 0; i < 96; i++) {
    const x = 2010 + rand() * 930;
    const y = 60 + rand() * 1980;
    const r = 32 + rand() * 28;
    if (inClearing(x, y, 6)) continue;
    out.push({ x, y, r });
  }
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 16; col++) {
      const x = 540 + col * 88;
      const y = 108 + row * 74;
      if (x > 1920) continue;
      if (inClearing(x, y, 4)) continue;
      out.push({ x, y, r: 24 });
    }
  }
  const reeds = mulberry32(11);
  for (let i = 0; i < 58; i++) {
    const x = 500 + reeds() * 960;
    const y = 1240 + reeds() * 800;
    const r = 26 + reeds() * 20;
    if (inClearing(x, y, 8)) continue;
    out.push({ x, y, r });
  }
  for (let i = 0; i < 9; i++) out.push({ x: 680 + i * 26, y: 176, r: 20 });
  return out;
}

export const COVER: Circle[] = buildCover();

export type Ground = "water" | "gravel" | "mud" | "turf" | "orchard" | "leaves";

export function groundAt(x: number, y: number): Ground {
  if (x < 170) return "water";
  if (x < 460) return "gravel";
  if (x >= 1960) return "leaves";
  if (y < 640) return "orchard";
  if (y >= 1240 && x < 1500) return "mud";
  return "turf";
}

export const GROUND_NOISE: Record<Ground, number> = {
  water: 1.7,
  gravel: 1.2,
  mud: 0.48,
  turf: 0.82,
  orchard: 0.78,
  leaves: 1.48,
};

export const GROUND_LABEL: Record<Ground, string> = {
  water: "the shallows",
  gravel: "bank gravel",
  mud: "soft mud",
  turf: "the hay",
  orchard: "orchard grass",
  leaves: "dry leaves",
};

export function movementBlocked(x: number, y: number): boolean {
  if (x < 168 || x > WORLD.w - 16 || y < 16 || y > WORLD.h - 16) return true;
  for (const w of WALLS) {
    if (distToSegment({ x, y }, w) < 11) return true;
  }
  return false;
}

export function distToSegment(
  p: Point,
  w: { x1: number; y1: number; x2: number; y2: number },
): number {
  const abx = w.x2 - w.x1;
  const aby = w.y2 - w.y1;
  const ab2 = abx * abx + aby * aby;
  const t =
    ab2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - w.x1) * abx + (p.y - w.y1) * aby) / ab2));
  const px = w.x1 + abx * t;
  const py = w.y1 + aby * t;
  return Math.hypot(p.x - px, p.y - py);
}

export function segmentHitsCircle(a: Point, b: Point, c: Circle): boolean {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const acx = c.x - a.x;
  const acy = c.y - a.y;
  const ab2 = abx * abx + aby * aby;
  const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (acx * abx + acy * aby) / ab2));
  const px = a.x + abx * t;
  const py = a.y + aby * t;
  const dx = px - c.x;
  const dy = py - c.y;
  return dx * dx + dy * dy < c.r * c.r;
}

export function segmentHitsWall(a: Point, b: Point): boolean {
  for (const w of WALLS) {
    if (segmentsCross(a, b, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })) return true;
  }
  return false;
}

function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = cross(b.x - a.x, b.y - a.y, c.x - a.x, c.y - a.y);
  const d2 = cross(b.x - a.x, b.y - a.y, d.x - a.x, d.y - a.y);
  const d3 = cross(d.x - c.x, d.y - c.y, a.x - c.x, a.y - c.y);
  const d4 = cross(d.x - c.x, d.y - c.y, b.x - c.x, b.y - c.y);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(ax: number, ay: number, bx: number, by: number) {
  return ax * by - ay * bx;
}

/** Line of sight. Cover the viewer is standing inside does not blind them. */
export function losBlocked(from: Point, to: Point, cover: Circle[] = COVER): boolean {
  if (segmentHitsWall(from, to)) return true;
  for (const c of cover) {
    const dx = from.x - c.x;
    const dy = from.y - c.y;
    if (dx * dx + dy * dy < c.r * c.r) continue;
    const ax = to.x - c.x;
    const ay = to.y - c.y;
    if (ax * ax + ay * ay < c.r * c.r * 0.72) return true;
    if (segmentHitsCircle(from, to, c)) return true;
  }
  return false;
}

export function concealedAt(p: Point, cover: Circle[] = COVER): boolean {
  return cover.some((c) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    return dx * dx + dy * dy < c.r * c.r * 0.8;
  });
}

export function habitatLabel(x: number, y: number): string {
  const g = groundAt(x, y);
  if (g === "water") return "Otter Creek";
  if (g === "gravel") return "creek bank";
  if (g === "mud") return "marsh";
  if (g === "leaves") return "hemlock woods";
  if (g === "orchard") return "orchard";
  return "hay";
}
