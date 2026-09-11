import { T } from "./tile-ids";
import type { Flags, MapId } from "./types";
import {
  CHAMPLAIN_SHORE,
  COUNTY_BOX,
  COUNTY_SIZE,
  LAKES,
  ROADS,
  RIVERS,
  lngWestOfShore,
  type BBox,
} from "./geo-features";
import { TOWNS, type CountyId } from "./geography";
import { ageTiles, generations, TOWN_SPAWN } from "./era";

export type RasterProp = {
  kind: string;
  x: number;
  y: number;
  id: string;
  npc?: string;
  enemy?: string;
  warp?: { map: MapId; x: number; y: number };
  cache?: string;
  relic?: string;
};

function project(lat: number, lng: number, box: BBox, w: number, h: number) {
  const x = ((lng - box.west) / (box.east - box.west)) * (w - 1);
  const y = ((box.north - lat) / (box.north - box.south)) * (h - 1);
  return { x, y };
}

function plot(tiles: number[][], x: number, y: number, id: number, thick = 0) {
  const h = tiles.length;
  const w = tiles[0].length;
  for (let dy = -thick; dy <= thick; dy++) {
    for (let dx = -thick; dx <= thick; dx++) {
      const tx = Math.round(x + dx);
      const ty = Math.round(y + dy);
      if (tx <= 0 || ty <= 0 || tx >= w - 1 || ty >= h - 1) continue;
      const cur = tiles[ty][tx];
      if (id === T.water || cur === T.grass || cur === T.flowers || cur === T.soil) {
        tiles[ty][tx] = id;
      } else if (id === T.path && cur !== T.water && cur !== T.pine && cur !== T.wall) {
        tiles[ty][tx] = T.path;
      }
    }
  }
}

function stroke(tiles: number[][], pts: [number, number][], box: BBox, id: number, thick: number) {
  const h = tiles.length;
  const w = tiles[0].length;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = project(pts[i][0], pts[i][1], box, w, h);
    const b = project(pts[i + 1][0], pts[i + 1][1], box, w, h);
    const steps = Math.max(2, Math.hypot(b.x - a.x, b.y - a.y) * 2);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      plot(tiles, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, id, thick);
    }
  }
}

export function projectCountyCell(county: CountyId, lat: number, lng: number): { x: number; y: number } | null {
  const box = COUNTY_BOX[county as keyof typeof COUNTY_BOX];
  if (!box) return null;
  const { w, h } = COUNTY_SIZE;
  const p = project(lat, lng, box, w, h);
  return {
    x: Math.max(2, Math.min(w - 3, Math.round(p.x))),
    y: Math.max(2, Math.min(h - 3, Math.round(p.y))),
  };
}

export function rasterCounty(
  county: CountyId,
  flags: Flags,
  cycle: number,
): { tiles: number[][]; w: number; h: number; props: RasterProp[] } {
  const box = COUNTY_BOX[county as keyof typeof COUNTY_BOX];
  const { w, h } = COUNTY_SIZE;
  const tiles: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      row.push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? T.wall : T.grass);
    }
    tiles.push(row);
  }

  if (box) {
    const shore = CHAMPLAIN_SHORE.find((s) => s.county === county);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const lat = box.north - (y / (h - 1)) * (box.north - box.south);
        const lng = box.west + (x / (w - 1)) * (box.east - box.west);
        if (shore && lngWestOfShore(lat, lng, shore.pts)) {
          tiles[y][x] = T.water;
          continue;
        }
        if (county === "windsor" && lng > -72.32) tiles[y][x] = T.water;
        if (county === "addison" && lng > -72.98) tiles[y][x] = T.pine;
        if (county === "chittenden" && lng > -72.95 && y > 8) tiles[y][x] = T.pine;
        if (county === "addison" && lng < -73.25 && tiles[y][x] === T.grass && (x + y) % 7 === 0) {
          tiles[y][x] = T.soil;
        }
      }
    }

    for (const lake of LAKES.filter((l) => l.county === county)) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const lat = box.north - (y / (h - 1)) * (box.north - box.south);
          const lng = box.west + (x / (w - 1)) * (box.east - box.west);
          const nd = ((lat - lake.lat) / lake.rLat) ** 2 + ((lng - lake.lng) / lake.rLng) ** 2;
          if (nd < 1) tiles[y][x] = T.water;
        }
      }
    }

    for (const r of RIVERS.filter((x) => x.county === county)) stroke(tiles, r.pts, box, T.water, 1);
    for (const r of ROADS.filter((x) => x.county === county)) stroke(tiles, r.pts, box, T.path, 0);
  }

  if (county === "addison") ageTiles(tiles, flags.year, flags.year + cycle);

  const props: RasterProp[] = [];
  props.push({ kind: "spawn", x: Math.floor(w / 2), y: Math.floor(h / 2), id: "spawn" });

  const towns = TOWNS.filter((t) => t.county === county && t.id !== county && t.id !== "quarry" && t.id !== "addison");
  for (const t of towns) {
    const cell = projectCountyCell(county, t.lat, t.lng);
    if (!cell) continue;
    const { x: tx, y: ty } = cell;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (tiles[ty + dy]?.[tx + dx] !== undefined && tiles[ty + dy][tx + dx] !== T.water) {
          tiles[ty + dy][tx + dx] = T.cobble;
        }
      }
    }
    const spawn = TOWN_SPAWN[t.id] ?? { x: 12, y: 10 };
    props.push({ kind: "warp", x: tx, y: ty, id: "to-" + t.id, warp: { map: t.id, x: spawn.x, y: spawn.y } });
  }

  if (county === "addison") {
    props.push({ kind: "npc", x: 36, y: 26, id: "cartog", npc: "cartog" });
    props.push({ kind: "enemy", x: 18, y: 20, id: "ow-fisher", enemy: "fisher" });
    props.push({ kind: "enemy", x: 50, y: 16, id: "ow-bear", enemy: "bear" });
    props.push({ kind: "enemy", x: 44, y: 32, id: "ow-bob", enemy: "bobcat" });
    if (!flags.caches.includes("cache-deadcreek")) {
      props.push({ kind: "cache", x: 10, y: 28, id: "cache-deadcreek", cache: "woods" });
    }
    props.push({ kind: "warp", x: 58, y: 22, id: "to-quarry", warp: { map: "quarry", x: 16, y: 13 } });
    if (!flags.relics?.includes("hookshot")) {
      props.push({ kind: "relic", x: 48, y: 18, id: "relic-hook", relic: "hookshot" });
    }
    if (generations(flags.year) >= 1) {
      props.push({ kind: "enemy", x: 30, y: 24, id: "ow-wraith", enemy: "wraith" });
    }
    props.push({ kind: "warp", x: 36, y: h - 2, id: "to-rutland-gate", warp: { map: "rutland", x: 12, y: 12 } });
    props.push({ kind: "warp", x: 36, y: 2, id: "to-chittenden", warp: { map: "chittenden", x: 28, y: 44 } });
  }
  if (county === "chittenden") {
    props.push({ kind: "npc", x: 28, y: 22, id: "ferry-c", npc: "ferry" });
    props.push({ kind: "enemy", x: 40, y: 18, id: "c-bear", enemy: "bear" });
    props.push({ kind: "enemy", x: 22, y: 30, id: "c-fisher", enemy: "fisher" });
    props.push({ kind: "enemy", x: 50, y: 12, id: "c-bob", enemy: "bobcat" });
    if (cycle >= 1) props.push({ kind: "enemy", x: 30, y: 14, id: "c-wraith", enemy: "wraith" });
    props.push({ kind: "warp", x: 28, y: h - 2, id: "to-addison-n", warp: { map: "addison", x: 36, y: 4 } });
  }
  if (county === "windsor") {
    props.push({ kind: "npc", x: 48, y: 22, id: "conductor-ow", npc: "conductor" });
    props.push({ kind: "enemy", x: 20, y: 16, id: "w-bear", enemy: "bear" });
    props.push({ kind: "enemy", x: 36, y: 30, id: "w-fisher", enemy: "fisher" });
    props.push({ kind: "warp", x: 8, y: 24, id: "to-rutland-e", warp: { map: "rutland", x: 26, y: 12 } });
  }

  return { tiles, w, h, props };
}

export function gpsOnCounty(county: CountyId, lat: number, lng: number): { map: MapId; x: number; y: number } {
  const cell = projectCountyCell(county, lat, lng) ?? { x: 36, y: 26 };
  const map: MapId =
    county === "rutland" ? "addison" : county === "washington" ? "montpelier" : (county as MapId);
  return { map, x: cell.x, y: cell.y };
}
