import { T } from "./tile-ids";
import type { EnemyKind, Flags, MapId } from "./types";

export type SoloProp = {
  kind: string;
  x: number;
  y: number;
  id: string;
  npc?: string;
  enemy?: EnemyKind;
  warp?: { map: MapId; x: number; y: number };
  relic?: string;
};

const W = 48;
const H = 48;
const CX = 23.5;
const CY = 23.5;
const R = 20.4;

function hash(n: number) {
  return (n * 1103515245 + 12345) & 0x7fffffff;
}

function inIsland(x: number, y: number) {
  return Math.hypot(x - CX, y - CY) <= R;
}

function rim(x: number, y: number) {
  const d = Math.hypot(x - CX, y - CY);
  return d <= R && d > R - 1.6;
}

function quad(x: number, y: number): "fact" | "fiction" | "history" | "imagination" | "heart" {
  if (Math.hypot(x - CX, y - CY) < 4.2) return "heart";
  if (x < 24 && y < 24) return "fact";
  if (x >= 24 && y < 24) return "fiction";
  if (x < 24) return "history";
  return "imagination";
}

/** Sprinkle cosmic seams through a mortal map once the spectrum is open. */
export function fractureTiles(tiles: number[][], cycle: number) {
  const h = tiles.length;
  const w = tiles[0]?.length ?? 0;
  let s = cycle * 9973 + 41;
  const n = 16 + cycle * 5;
  for (let i = 0; i < n; i++) {
    s = hash(s);
    const x = 2 + (s % Math.max(1, w - 4));
    s = hash(s);
    const y = 2 + (s % Math.max(1, h - 4));
    const t = tiles[y]?.[x];
    if (t === T.grass || t === T.flowers || t === T.path) tiles[y][x] = i % 5 === 0 ? T.void : T.cosmic;
    else if (t === T.pine && i % 3 === 0) tiles[y][x] = T.soil;
    else if (t === T.cobble && i % 4 === 0) tiles[y][x] = T.marble;
  }
}

export function buildSoloverse(flags: Flags, cycle: number): {
  tiles: number[][];
  w: number;
  h: number;
  props: SoloProp[];
} {
  const tiles: number[][] = [];
  let s = 9001 + cycle * 17;
  for (let y = 0; y < H; y++) {
    const row: number[] = [];
    for (let x = 0; x < W; x++) {
      s = hash(s);
      if (!inIsland(x, y)) {
        row.push(T.void);
        continue;
      }
      if (rim(x, y)) {
        const q = quad(x, y);
        row.push(q === "fiction" || q === "fact" ? T.sand : T.cosmic);
        continue;
      }
      const q = quad(x, y);
      if (q === "heart") {
        row.push(s % 5 === 0 ? T.cosmic : T.marble);
        continue;
      }
      if (q === "fact") {
        if (x > 8 && x < 18 && y > 10 && y < 18) row.push(T.cobble);
        else if (Math.abs(x - 12) < 1 || Math.abs(y - 14) < 1) row.push(T.path);
        else if (s % 17 === 0) row.push(T.pine);
        else if (s % 11 === 0) row.push(T.flowers);
        else row.push(T.grass);
      } else if (q === "fiction") {
        const dEdge = Math.hypot(x - 36, y - 8);
        if (x > 38 && y < 14) row.push(T.water);
        else if (y === 14 && x > 32) row.push(T.cliffLip);
        else if (y > 14 && y < 17 && x > 32) row.push(T.cliff);
        else if (dEdge < 4.2) row.push(T.cliff);
        else if (s % 6 === 0 || (x > 28 && x < 34 && y > 4 && y < 10 && s % 2 === 0)) row.push(T.pine);
        else if (s % 13 === 0) row.push(T.flowers);
        else row.push(T.grass);
      } else if (q === "history") {
        if (s % 7 === 0) row.push(T.pine);
        else if (s % 4 === 0) row.push(T.gravel);
        else if (s % 5 === 0) row.push(T.soil);
        else if (s % 9 === 0) row.push(T.cobble);
        else row.push(T.grass);
      } else {
        if (s % 8 === 0) row.push(T.marble);
        else if (s % 11 === 0) row.push(T.cracked);
        else if (s % 5 === 0) row.push(T.void);
        else row.push(T.cosmic);
      }
    }
    tiles.push(row);
  }

  for (let y = 21; y <= 26; y++) {
    for (let x = 21; x <= 26; x++) {
      if (tiles[y]?.[x] === T.void) tiles[y][x] = T.marble;
    }
  }
  tiles[23][23] = T.marble;
  tiles[24][23] = T.marble;
  tiles[23][24] = T.marble;

  for (let y = 9; y <= 12; y++) {
    for (let x = 32; x <= 36; x++) {
      if (tiles[y]?.[x] === T.cliff || tiles[y]?.[x] === T.pine) tiles[y][x] = T.grass;
    }
  }
  tiles[9][34] = T.cliff;
  tiles[9][33] = T.cliff;
  tiles[9][35] = T.cliff;
  tiles[10][34] = T.grass;

  for (let y = 12; y <= 16; y++) {
    for (let x = 10; x <= 16; x++) tiles[y][x] = T.cobble;
  }
  tiles[14][13] = T.path;

  const props: SoloProp[] = [];
  props.push({ kind: "spawn", x: 23, y: 25, id: "solo-spawn" });
  props.push({ kind: "shrine", x: 23, y: 23, id: "heart" });
  props.push({ kind: "npc", x: 23, y: 24, id: "heart-talk", npc: "heart" });

  props.push({
    kind: "warp",
    x: 10,
    y: 14,
    id: "to-middlebury-seam",
    warp: { map: "middlebury", x: 18, y: 7 },
  });
  props.push({ kind: "npc", x: 12, y: 13, id: "solo-cartog", npc: "cartog" });
  props.push({ kind: "well", x: 16, y: 12, id: "solo-well" });
  props.push({ kind: "inn", x: 15, y: 15, id: "solo-inn" });
  props.push({
    kind: "door",
    x: 15,
    y: 16,
    id: "door-solo-inn",
    warp: { map: "int_inn", x: 7, y: 6 },
  });

  props.push({
    kind: "cave",
    x: 34,
    y: 10,
    id: "cave-hyrule",
    warp: { map: "int_cave", x: 5, y: 4 },
  });
  props.push({ kind: "npc", x: 31, y: 12, id: "solo-fiction", npc: "spectrum" });

  if (flags.elderFate) {
    props.push({ kind: "npc", x: 12, y: 32, id: "echo-elder", npc: "echo_elder" });
  }
  if (flags.sentinelFate) {
    props.push({ kind: "npc", x: 34, y: 34, id: "echo-sentinel", npc: "echo_sentinel" });
  }
  if (flags.residentFate) {
    props.push({ kind: "npc", x: 14, y: 16, id: "echo-resident", npc: "echo_resident" });
  }
  if (flags.millFate) {
    props.push({ kind: "npc", x: 11, y: 11, id: "echo-mayor", npc: "echo_mayor" });
  }

  const graves = flags.graves ?? [];
  graves.slice(-4).forEach((g, i) => {
    if (g.excavated) return;
    props.push({ kind: "grave", x: 8 + (i % 3) * 3, y: 30 + Math.floor(i / 3) * 3, id: g.id });
  });

  if (!flags.relics.includes("boots")) {
    props.push({ kind: "relic", x: 16, y: 36, id: "relic-boots", relic: "boots" });
  }
  if (!flags.relics.includes("cane")) {
    props.push({ kind: "relic", x: 36, y: 36, id: "relic-cane-solo", relic: "cane" });
  }

  if (!flags.chests.includes("solo-fact")) props.push({ kind: "chest", x: 8, y: 12, id: "solo-fact" });
  if (!flags.chests.includes("solo-hist")) props.push({ kind: "chest", x: 18, y: 38, id: "solo-hist" });
  if (!flags.chests.includes("solo-imag")) props.push({ kind: "chest", x: 38, y: 32, id: "solo-imag" });

  props.push({ kind: "enemy", x: 9, y: 8, id: "solo-bob", enemy: "bobcat" });
  props.push({ kind: "enemy", x: 18, y: 9, id: "solo-crow-a", enemy: "crow" });
  props.push({ kind: "enemy", x: 36, y: 16, id: "solo-crow-b", enemy: "crow" });
  props.push({ kind: "enemy", x: 30, y: 6, id: "solo-crow-c", enemy: "crow" });
  props.push({ kind: "enemy", x: 9, y: 36, id: "solo-bear", enemy: "bear" });
  props.push({ kind: "enemy", x: 18, y: 34, id: "solo-fisher", enemy: "fisher" });
  props.push({ kind: "enemy", x: 32, y: 30, id: "solo-wraith-a", enemy: "wraith" });
  props.push({ kind: "enemy", x: 38, y: 38, id: "solo-wraith-b", enemy: "wraith" });
  props.push({ kind: "enemy", x: 28, y: 36, id: "solo-wraith-c", enemy: "wraith" });
  if (flags.sentinelFate !== "release") {
    props.push({ kind: "enemy", x: 36, y: 28, id: "solo-sentinel", enemy: "sentinel" });
  }

  props.push({ kind: "pot", x: 22, y: 26, id: "solo-pot-a" });
  props.push({ kind: "pot", x: 25, y: 26, id: "solo-pot-b" });
  props.push({ kind: "bush", x: 30, y: 14, id: "solo-bush-a" });
  props.push({ kind: "bush", x: 29, y: 15, id: "solo-bush-b" });
  props.push({ kind: "bush", x: 8, y: 18, id: "solo-bush-c" });

  return { tiles, w: W, h: H, props };
}
