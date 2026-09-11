import type { EnemyKind, Flags, MapId } from "./types";
import { TOWN_BY_ID } from "./geography";
import { T } from "./tile-ids";
import { buildInterior, isInterior } from "./interiors";
import { rasterCounty, projectCountyCell } from "./raster";
import { ageTiles, generations, TOWN_SPAWN } from "./era";
import { buildSoloverse, fractureTiles } from "./soloverse";

export { TILE } from "./snes";
export { T };

const CH: Record<string, number> = {
  ".": T.grass,
  ",": T.flowers,
  p: T.path,
  g: T.gravel,
  "~": T.water,
  b: T.bridge,
  f: T.wood,
  T: T.pine,
  "#": T.wall,
  m: T.marble,
  M: T.marbleWall,
  c: T.cosmic,
  v: T.void,
  o: T.cobble,
  s: T.soil,
  x: T.cracked,
  a: T.sand,
  r: T.rail,
  "=": T.wood,
  h: T.cliff,
  u: T.cliffLip,
};

export const SOLID: Set<number> = new Set([T.pine, T.wall, T.marbleWall, T.void, T.water, T.cracked, T.cliff]);

export type PropKind =
  | "bush"
  | "chest"
  | "pot"
  | "shrine"
  | "well"
  | "barn"
  | "inn"
  | "hall"
  | "college"
  | "capitol"
  | "sugar"
  | "disp"
  | "npc"
  | "sheep"
  | "spawn"
  | "warp"
  | "enemy"
  | "cache"
  | "home"
  | "rock"
  | "cracked"
  | "door"
  | "rifle"
  | "syrup"
  | "creemee"
  | "grave"
  | "key"
  | "lock"
  | "relic"
  | "plot"
  | "cave";

export type PropSpec = {
  kind: PropKind;
  x: number;
  y: number;
  id: string;
  npc?: string;
  enemy?: EnemyKind;
  warp?: { map: MapId; x: number; y: number };
  cache?: string;
  relic?: string;
};

export type MapExtras = {
  homeX?: number;
  homeY?: number;
  geoTown?: MapId | null;
  returnMap?: MapId | null;
  returnX?: number;
  returnY?: number;
};

const ADDISON_SRC = [
  "########################################",
  "#~~~~aaa..............TTTTTTTTTTTTTTTTT#",
  "#~~~~aaa...............TTTT.........TTT#",
  "#~~~aaaa...............TT..........TTTT#",
  "#~~aaaa....ppppppppppppppppppppp....TTT#",
  "#~~aaa.....p...............p.....TTTTTT#",
  "#~~aa......p...............p.......TTTT#",
  "#~aaa~~~~~~b~~~~~~.........p........TTT#",
  "#~aa~~~~~~~b~~~~~~....pppppppppp.....TT#",
  "#~a........p..........p................#",
  "#~~........p..........p....TTTTTTTTTTTT#",
  "#~~pppppppppppppppppppp....TTTTTTTTTTTT#",
  "#~~p..................p......TTTTTTTTTT#",
  "#~~p..................p.........TTTTTTT#",
  "#~~p..................p................#",
  "#~~pppppppppppppppppppp................#",
  "#~~p..................p....s.s.s.......#",
  "#~~p..................p................#",
  "#~~p........~~~~......ppppppppppp......#",
  "#~~p.......~~~~~~................p.....#",
  "#~~p......~~~~~~~~..............p......#",
  "#~~p.......~~~~~~....~~~~~~~~~~b~~~~...#",
  "#~~p........~~~~.....~~~~~~~~~~b~~~~...#",
  "#~~pppppppppppppppppppppppppppppppppppp#",
  "#~~....................................#",
  "#TTTT.............................TTTTT#",
  "#TTTTTT.........................TTTTTTT#",
  "########################################",
];

const MIDDLEBURY_SRC = [
  "########################################",
  "#TTTTTTTT,,..............TTTTTTTTTTTTTT#",
  "#TTTTT......................TTTTTTTTTTT#",
  "#TTTT...mmmmm........&.........TTTTTTTT#",
  "#TTT...mmPmmmm....ppppppp........TTTTTT#",
  "#TT....mmmmmmm...ppoooooopp.........TTT#",
  "#T......pppppppppppo.H.W.opp..........T#",
  "#.......pp........poooooopp............#",
  "#.......pp........uuuuppuuu............#",
  "#~~~bb~~pp~~~~~~~~rrrrpprrrrrrrrrrrrrrr#",
  "#~~~bb~~pp~~~~~~~~rrrrpprrrrrrrrrrrrrrr#",
  "#~~~~~~~pp~~~~~~~~ssssppssssssssssssssQ#",
  "#.......pp........s...I..B...s.........#",
  "#.......ppppppppppss..fffff..s.........#",
  "#.FFFF..pp.....~~~~b~~~~...............#",
  "#.FFFF..pp....~~~~~~b~~~~~.............#",
  "#.F.....pp...~~~~~~~~~~~~..............#",
  "#.......pp....~~~~U~~~~~~..............#",
  "#.......ppppppppppppp..................#",
  "#.........................gggggggggTTTT#",
  "#TTTT.....................gggggggggTTTT#",
  "#TTTTTT.....................ggg.....TTT#",
  "########################################",
];

const VERGENNES_SRC = [
  "##########################",
  "#TTTT....aaaa~~~~aaaa.TTT#",
  "#TT......aaaa~~~~aaaa..TT#",
  "#T....pppppppbbpppppp...T#",
  "#....pp..oooooooo..pp....#",
  "#....pp..o.I.B.o...pp....#",
  "#~~~~bb~~oooooooo~~bb~~~~#",
  "#~~~~bb~~~~~~~~~~~~bb~~~~#",
  "#....pp....oWo.....pp....#",
  "#....pp............pp....#",
  "#....pppppppppppppppp....#",
  "#.H..........N...........#",
  "#TTTT....ssssss.....TTTTT#",
  "#TTTTTT..........TTTTTTTT#",
  "##########################",
];

const BRISTOL_SRC = [
  "################################",
  "#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT#",
  "#TTTTTT.........TTTTTTTTTTTTTTT#",
  "#TTTT....R......TTTT....TTTTTTT#",
  "#TTT.............pp.......TTTTT#",
  "#TT.....~~~~....pppp....,.TTTT#",
  "#T.....~~~~~~..pp..pp...P..TTT#",
  "#......~~bb~~~pp.I.Bpp......TT#",
  "#......~~bb~~~pp.ooo.pp......T#",
  "#.......~~~~..pp.oWo.pp.......#",
  "#........~~...ppppppppp.......#",
  "#.............ppp.............#",
  "#.H.N.........ppp.....ssss....#",
  "#.............ppp.....ssss....#",
  "#....pppppppppppppp...........#",
  "#TTTT...................TTTTTT#",
  "#TTTTTT....&.........TTTTTTTTT#",
  "################################",
];

const FERRISBURGH_SRC = [
  "##############################",
  "#~~~~~~~~~~~~~~~~~~~~~~~~~~~~#",
  "#~~~~~~~~~~~~~~~~~~~~~~~~~~~~#",
  "#aaaaaa~~~~aaaa~~~~aaaaaaaaaa#",
  "#aaaaaa....aaaa....aa....Haaa#",
  "#aaa........pppppppp........a#",
  "#aa.....N...p.I.B..p.....ss.a#",
  "#a..........p.oooo.p.....ss..#",
  "#...........p.oWo..p.........#",
  "#.FFFF......pppppppp.........#",
  "#.FFFF.................TTTTTT#",
  "#....................TTTTTTTT#",
  "#TTTT....&.........TTTTTTTTTT#",
  "#TTTTTTTT.............TTTTTTT#",
  "##############################",
];

const SALISBURY_SRC = [
  "##############################",
  "#TTTTTTTT~~~~~~~TTTTTTTTTTTTT#",
  "#TTTTT~~~~~~~~~~~TTTTTTTTTTTT#",
  "#TTTT~~~~bbbb~~~~~.....TTTTTT#",
  "#TTT~~~~~bbbb~~~~~.N......TTT#",
  "#TT~~~~~~~~~~~~~~~..........T#",
  "#T~~~~~~aaaaa~~~~~~....ssss.T#",
  "#......aaaaaaaa......H.ssss.T#",
  "#......aa.pppppppp..........T#",
  "#.........p.I.oWo.p.........T#",
  "#.........ppppppppp.....&...T#",
  "#TTTT.................TTTTTTT#",
  "#TTTTTT....FFFF.....TTTTTTTTT#",
  "#TTTTTTTT..FFFF...TTTTTTTTTTT#",
  "##############################",
];

const RUTLAND_SRC = [
  "################################",
  "#TTTTTT,,....TTTTTTTTTTTTTTTTTT#",
  "#TTT........ssss......TTTTTTTTT#",
  "#TT..............&.....TTTTTTTT#",
  "#T.....ppppppppppp........TTTTT#",
  "#....ppp.........ppp.....TTTTTT#",
  "#...pp.....H.I.B..pp......TTTTT#",
  "#...pp.....oooo....pp..ssss.TTT#",
  "#...pp.....oWo.....pp..ssss..TT#",
  "#...pp.....oooo....pp.........T#",
  "#...pp..............pp........T#",
  "#...pppppppppppppppppp....NN..T#",
  "#........pppp..............TT#",
  "#.FFFF...ppp......~~~~b~~~~..T#",
  "#.FFFF...ppp.....~~~~~b~~~~~.T#",
  "#........ppp....~~~~~~~~~~~~.T#",
  "#........ppp.....~~~~Q~~~~~~.T#",
  "#........ppppppppppppp.......T#",
  "#...................gggggggggT#",
  "#TTTT...............gggggggggT#",
  "#TTTTTT..............ggg.....T#",
  "################################",
];

const QUARRY_SRC = [
  "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
  "MvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvM",
  "MvmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmM",
  "Mvmm............S.....C........mmM",
  "Mvmm...........................mmM",
  "MvmmmmmmmmmmmmxxxxxxxxmmmmmmmmmmmM",
  "Mvmm..............H............mmM",
  "Mvmm...........................mmM",
  "MvmmmmmmmmmmmmmmLmmmmmmmmmmmmmmmmM",
  "Mvmm.....ooooooooooo...........mmM",
  "Mvmm.....o.........o...........mmM",
  "Mvmm..k..o.........o...........mmM",
  "Mvmm.....ooooooooooo...........mmM",
  "Mvmm...........................mmM",
  "Mvmm...........n...............mmM",
  "Mvmm...........................mmM",
  "Mvmmmmmmmmmmmmmm.mmmmmmmmmmmmmmmmM",
  "MMMMMMMMMMMMMMMM.MMMMMMMMMMMMMMMMM",
];

const MONTPELIER_SRC = [
  "##############################",
  "#TTTT~~..............TTTTTTTT#",
  "#TTT~~~.....mmmm......TTTTTTT#",
  "#TT~~~~....mmBmm........TTTTT#",
  "#T~~~~~....mmmmm...pppppp.TTT#",
  "#~~~~~~.........pppp.I.pp..TT#",
  "#~~bb~~.........p..oooo.p...T#",
  "#~~bb~~.........p..oWo..p....#",
  "#~~~~~~.........ppppppppp....#",
  "#.H.P...........ppp..........#",
  "#...............ppp.....ssss.#",
  "#....pppppppppppppp.....ssss.#",
  "#TTTT.................TTTTTTT#",
  "#TTTTTT....&........TTTTTTTTT#",
  "##############################",
];

const WRJ_SRC = [
  "##############################",
  "#TTTT~~~~............TTTTTTTT#",
  "#TTT~~~~~..rrrrrr......TTTTTT#",
  "#TT~~~~~~..r.I.r.........TTTT#",
  "#T~~~bb~~~rrrrrrr..pppppp.TTT#",
  "#~~~~bb~~~~.........p.B.p..TT#",
  "#~~~~~~~~~~~........p.ooo.p.T#",
  "#.H..................poWop...#",
  "#....N...............ppppp...#",
  "#....ppppppppppppppppp.......#",
  "#ssss...................ssss.#",
  "#ssss....FFFF...........ssss.#",
  "#TTTT....FFFF.........TTTTTTT#",
  "#TTTTTT.............TTTTTTTTT#",
  "##############################",
];

const VILLAGE_SRC = [
  "##############################",
  "#TTTT..............TTTTTTTTTT#",
  "#TTT.....pppppppp......TTTTTT#",
  "#TT.....pp.I.B.pp........TTTT#",
  "#T......pp.oooo.pp.........TT#",
  "#.......pp.oWo..pp..........T#",
  "#.H.N...pppppppppp....ssss...#",
  "#.......ppp...............TT#",
  "#.FFFF..ppp......~~~~b~~~~.T#",
  "#.FFFF..pppppppppppppppppp.T#",
  "#..............&........TTTT#",
  "#TTTT................TTTTTTT#",
  "##############################",
];

const BURLINGTON_SRC = [
  "################################",
  "#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#",
  "#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#",
  "#aaaaaa~~~~aaaa~~~~aaaaaaaaaaaa#",
  "#aaaa......oooooo......aaaaaaa#",
  "#aa.....N..o.I.B.o..H......aaa#",
  "#a.........oooooooo..........a#",
  "#....pppppppppppppppppppp.....#",
  "#....pp.....oWo......K.pp.....#",
  "#....pp..............pp.......#",
  "#.FFFF..ppppppppppppppp..ssss.#",
  "#.FFFF....................TTTT#",
  "#TTTT........&.........TTTTTTT#",
  "#TTTTTT................TTTTTTT#",
  "################################",
];

const SRC: Partial<Record<MapId, string[]>> = {
  addison: ADDISON_SRC,
  middlebury: MIDDLEBURY_SRC,
  vergennes: VERGENNES_SRC,
  bristol: BRISTOL_SRC,
  ferrisburgh: FERRISBURGH_SRC,
  salisbury: SALISBURY_SRC,
  rutland: RUTLAND_SRC,
  quarry: QUARRY_SRC,
  montpelier: MONTPELIER_SRC,
  whiteriver: WRJ_SRC,
  burlington: BURLINGTON_SRC,
  shelburne: VILLAGE_SRC,
  essex: VILLAGE_SRC,
  winooski: VILLAGE_SRC,
  woodstock: VILLAGE_SRC,
  springfieldvt: VILLAGE_SRC,
  norwich: VILLAGE_SRC,
  farmstead: SALISBURY_SRC,
};

function parse(src: string[]): {
  tiles: number[][];
  w: number;
  h: number;
  marks: Record<string, { x: number; y: number }[]>;
} {
  const h = src.length;
  const w = Math.max(...src.map((r) => r.length));
  const tiles: number[][] = [];
  const marks: Record<string, { x: number; y: number }[]> = {};
  const markChars = new Set(["H", "I", "B", "W", "N", "F", "Q", "&", "S", "C", "P", "D", "U", "R", "K", "k", "L", "n"]);
  for (let y = 0; y < h; y++) {
    const line = src[y].padEnd(w, src[y][0] === "M" ? "M" : "#");
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const ch = line[x] ?? "#";
      if (markChars.has(ch)) {
        (marks[ch] ??= []).push({ x, y });
        if (ch === "C") row.push(T.marble);
        else if (ch === "S") row.push(T.marble);
        else if (ch === "Q") row.push(T.gravel);
        else if (ch === "U") row.push(T.wood);
        else if (ch === "R") row.push(T.gravel);
        else if (ch === "K") row.push(T.cobble);
        else if (ch === "k") row.push(T.marble);
        else if (ch === "L") row.push(T.marbleWall);
        else if (ch === "n") row.push(T.marble);
        else row.push(T.cobble);
      } else {
        row.push(CH[ch] ?? T.grass);
      }
    }
    tiles.push(row);
  }
  return { tiles, w, h, marks };
}

function countyDoor(townId: MapId): { map: MapId; x: number; y: number } {
  const t = TOWN_BY_ID[townId];
  const county = (t?.county ?? "addison") as MapId;
  if (!t) return { map: "addison", x: 36, y: 28 };
  const cell = projectCountyCell(t.county, t.lat, t.lng);
  if (!cell) return { map: county, x: 36, y: 28 };
  return { map: county, x: cell.x, y: Math.min(cell.y + 2, 48) };
}

function first(marks: Record<string, { x: number; y: number }[]>, ch: string, fb: { x: number; y: number }) {
  return marks[ch]?.[0] ?? fb;
}

function walkableAt(tiles: number[][], x: number, y: number) {
  const t = tiles[y]?.[x];
  return t !== undefined && !SOLID.has(t);
}

export function placeHome(tiles: number[][], w: number, h: number, fx: number, fy: number) {
  let x = Math.floor(2 + fx * (w - 4));
  let y = Math.floor(2 + fy * (h - 4));
  for (let r = 0; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (walkableAt(tiles, nx, ny) && walkableAt(tiles, nx, ny + 1) && walkableAt(tiles, nx, ny + 2)) return { x: nx, y: ny };
      }
    }
  }
  return { x, y };
}

function addBushes(props: PropSpec[], spots: number[][], flags: Flags, prefix: string) {
  spots.forEach(([x, y], i) => {
    const id = prefix + i;
    if (!flags.bushes.includes(id)) props.push({ kind: "bush", x, y, id });
  });
}

function addCache(props: PropSpec[], flags: Flags, x: number, y: number, id: string, kind: string) {
  if (!flags.caches.includes(id)) props.push({ kind: "cache", x, y, id, cache: kind });
}

function addChest(props: PropSpec[], flags: Flags, x: number, y: number, id: string) {
  if (!flags.chests.includes(id)) props.push({ kind: "chest", x, y, id });
}

function asProp(p: {
  kind: string;
  x: number;
  y: number;
  id: string;
  npc?: string;
  enemy?: string;
  warp?: { map: MapId; x: number; y: number };
  cache?: string;
  relic?: string;
}): PropSpec {
  return p as PropSpec;
}

function attachDoors(id: MapId, props: PropSpec[]) {
  const interiorOf: Partial<Record<PropKind, MapId>> = {
    inn: "int_inn",
    barn: "int_barn",
    hall: "int_cape",
    college: "int_college",
    capitol: "int_capitol",
    sugar: "int_sugar",
    disp: "int_shop",
    home: "int_home",
  };
  const extra: PropSpec[] = [];
  for (const p of props) {
    const dest = interiorOf[p.kind];
    if (!dest) continue;
    extra.push({
      kind: "door",
      x: p.x,
      y: p.y + 1,
      id: "door-" + id + "-" + p.id,
      warp: { map: dest, x: 7, y: 6 },
    });
  }
  props.push(...extra);
}

function extraDoor(props: PropSpec[], x: number, y: number, id: string, dest: MapId) {
  props.push({ kind: "door", x, y, id, warp: { map: dest, x: 6, y: 5 } });
}

function decorateVillage(id: MapId, props: PropSpec[], marks: Record<string, { x: number; y: number }[]>, flags: Flags) {
  const inn = first(marks, "I", { x: 10, y: 4 });
  const hall = first(marks, "B", { x: 12, y: 4 });
  props.push({ kind: "spawn", x: 12, y: 8, id: "spawn" });
  props.push({ kind: "inn", x: inn.x, y: inn.y - 1, id: "inn" });
  props.push({ kind: "hall", x: hall.x, y: hall.y - 1, id: "hall" });
  props.push({ kind: "well", x: first(marks, "W", { x: 12, y: 5 }).x, y: first(marks, "W", { x: 12, y: 5 }).y, id: "well" });
  props.push({ kind: "shrine", x: first(marks, "&", { x: 14, y: 10 }).x, y: first(marks, "&", { x: 14, y: 10 }).y, id: "shrine" });
  props.push({ kind: "barn", x: first(marks, "F", { x: 3, y: 8 }).x, y: first(marks, "F", { x: 3, y: 8 }).y, id: "barn" });
  const countyWarp: MapId =
    id === "burlington" || id === "shelburne" || id === "essex" || id === "winooski"
      ? "chittenden"
      : id === "woodstock" || id === "springfieldvt" || id === "norwich" || id === "whiteriver"
        ? "windsor"
        : "addison";
  props.push({ kind: "warp", x: 2, y: 8, id: "to-overworld", warp: { map: countyWarp, x: 36, y: 26 } });
  addCache(props, flags, 4, 8, "cache-" + id, "farmhouse");
  addChest(props, flags, 20, 3, "chest-" + id);
  props.push({ kind: "enemy", x: 22, y: 2, id: id + "-crow", enemy: "crow" });
  props.push({ kind: "enemy", x: 6, y: 10, id: id + "-bob", enemy: "bobcat" });
  addBushes(props, [[8, 7], [16, 7], [10, 9]], flags, id + "-bush-");
  if (id === "burlington") {
    props.push({ kind: "npc", x: first(marks, "H", { x: 20, y: 5 }).x, y: first(marks, "H", { x: 20, y: 5 }).y, id: "burl-host", npc: "ferry" });
    const k = first(marks, "K", { x: 20, y: 8 });
    props.push({ kind: "npc", x: k.x, y: k.y, id: "creemee-burl", npc: "creemee" });
    extraDoor(props, k.x, k.y, "door-creemee-burl", "int_creemee");
  } else if (id === "woodstock") {
    props.push({ kind: "npc", x: inn.x, y: inn.y, id: "ws-shop", npc: "shop" });
  } else if (id === "norwich") {
    props.push({ kind: "npc", x: hall.x, y: hall.y, id: "nor-hunt", npc: "hunter" });
  }
}

export function buildMap(id: MapId, flags: Flags, cycle: number, extras: MapExtras = {}) {
  if (id === "soloverse") {
    const built = buildSoloverse(flags, cycle);
    return {
      tiles: built.tiles,
      w: built.w,
      h: built.h,
      props: built.props.map(asProp),
    };
  }
  if (isInterior(id)) {
    const built = buildInterior(id, flags, extras);
    return {
      tiles: built.tiles,
      w: built.w,
      h: built.h,
      props: built.props.map(asProp),
    };
  }
  if (id === "chittenden" || id === "windsor" || id === "addison") {
    const built = rasterCounty(id, flags, cycle);
    const props = built.props.map(asProp);
    if (id === "addison") {
      props.push({ kind: "warp", x: 2, y: 24, id: "to-middlebury-legacy", warp: { map: "middlebury", x: 18, y: 6 } });
    }
    for (const g of flags.graves ?? []) {
      if (g.mapId === id && !g.excavated) {
        const gx = Math.max(1, Math.min(built.w - 2, Math.floor(g.x / 16)));
        const gy = Math.max(1, Math.min(built.h - 2, Math.floor(g.y / 16)));
        props.push({ kind: "grave", x: gx, y: gy, id: g.id });
      }
    }
    if (flags.tropoverse) fractureTiles(built.tiles, cycle);
    return { tiles: built.tiles, w: built.w, h: built.h, props };
  }

  const src = SRC[id] ?? MIDDLEBURY_SRC;
  const { tiles, w, h, marks } = parse(src);

  if (id === "rutland" || id === "middlebury" || id === "vergennes" || id === "bristol" || id === "ferrisburgh" || id === "salisbury" || id === "farmstead") {
    ageTiles(tiles, flags.year, (flags.year % 97) + cycle);
    if (flags.farmerHelped) paint(tiles, 2, 13, 6, 16, T.flowers);
    if (id === "rutland" && flags.millFate === "condemn") paint(tiles, 16, 10, 28, 18, T.gravel);
    if (flags.quarryOpen || flags.millFate === "condemn") {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (tiles[y][x] === T.cracked) tiles[y][x] = T.gravel;
        }
      }
    }
  }

  // persist smashed cracked / unlocked lock
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (tiles[y][x] === T.cracked && flags.chests.includes("crack-" + id + "-" + x + "-" + y)) {
        tiles[y][x] = id === "quarry" ? T.marble : T.gravel;
      }
    }
  }

  const props: PropSpec[] = [];
  const m = marks;
  const spawnDefault = { x: Math.floor(w / 2), y: Math.floor(h / 2) };

  if (id === "middlebury") {
    const hall = first(m, "H", { x: 18, y: 6 });
    const inn = first(m, "I", { x: 16, y: 12 });
    const barnB = first(m, "B", { x: 20, y: 12 });
    const well = first(m, "W", { x: 20, y: 6 });
    const shrine = first(m, "&", { x: 21, y: 3 });
    const farm = first(m, "F", { x: 3, y: 15 });
    const college = first(m, "P", { x: 8, y: 4 });
    const east = first(m, "Q", { x: 38, y: 11 });
    if (flags.elderFate !== "release") {
      props.push({ kind: "npc", x: hall.x, y: hall.y, id: "elder", npc: "elder" });
    }
    props.push({ kind: "npc", x: farm.x, y: farm.y, id: "farmer", npc: "farmer" });
    props.push({ kind: "inn", x: inn.x, y: inn.y - 1, id: "inn" });
    props.push({ kind: "hall", x: barnB.x, y: barnB.y - 1, id: "hall" });
    props.push({ kind: "college", x: college.x, y: college.y, id: "college" });
    props.push({ kind: "barn", x: 3, y: 14, id: "barn" });
    props.push({ kind: "well", x: well.x, y: well.y, id: "well" });
    props.push({ kind: "shrine", x: shrine.x, y: shrine.y, id: "shrine" });
    props.push({ kind: "home", x: 28, y: 4, id: "cape-1" });
    props.push({ kind: "home", x: 33, y: 15, id: "cape-2" });
    props.push({ kind: "spawn", x: 18, y: 6, id: "spawn" });
    props.push({ kind: "warp", x: 2, y: 7, id: "to-overworld", warp: countyDoor("middlebury") });
    props.push({ kind: "warp", x: east.x, y: east.y, id: "to-quarry", warp: { map: "quarry", x: 16, y: 13 } });
    if (cycle >= 1) {
      props.push({
        kind: "warp",
        x: 21,
        y: 8,
        id: "to-soloverse-seam",
        warp: { map: "soloverse", x: 23, y: 25 },
      });
    }
    if (!flags.sheepFound) props.push({ kind: "sheep", x: shrine.x, y: 2, id: "sheep" });
    addChest(props, flags, 3, 3, "chest-woods");
    addChest(props, flags, 35, 17, "chest-farm");
    addCache(props, flags, 4, 13, "cache-barn", "barn");
    addCache(props, flags, college.x, college.y + 1, "cache-college", "college");
    addCache(props, flags, 31, 12, "cache-cape", "farmhouse");
    props.push({ kind: "pot", x: 17, y: 7, id: "pot-1" });
    props.push({ kind: "pot", x: 21, y: 7, id: "pot-2" });
    addBushes(
      props,
      [
        [8, 4],
        [9, 4],
        [8, 5],
        [9, 5],
        [24, 5],
        [25, 5],
        [24, 6],
        [25, 6],
        [12, 3],
        [13, 3],
        [12, 4],
        [13, 4],
        [32, 6],
        [33, 6],
        [32, 7],
        [33, 7],
      ],
      flags,
      "mb-bush-",
    );
    props.push({ kind: "rock", x: 18, y: 8, id: "rock-lip-1" });
    props.push({ kind: "rock", x: 19, y: 8, id: "rock-lip-2" });
    props.push({ kind: "rock", x: 25, y: 8, id: "rock-lip-3" });
    props.push({ kind: "rock", x: 26, y: 8, id: "rock-lip-4" });
    if (!flags.relics.includes("shovel")) {
      props.push({ kind: "relic", x: shrine.x + 1, y: shrine.y, id: "relic-shovel", relic: "shovel" });
    }
    if (!flags.relics.includes("boots")) {
      props.push({ kind: "relic", x: 3, y: 3, id: "relic-boots", relic: "boots" });
    }
    props.push({ kind: "enemy", x: 6, y: 2, id: "crow-1", enemy: "crow" });
    props.push({ kind: "enemy", x: 8, y: 3, id: "bob-chipman", enemy: "bobcat" });
    props.push({ kind: "enemy", x: 36, y: 16, id: "fisher-1", enemy: "fisher" });
    if (cycle >= 1) props.push({ kind: "enemy", x: 10, y: 18, id: "wraith-2", enemy: "wraith" });
    if (flags.elderFate === "bind" && cycle >= 1) {
      props.push({ kind: "enemy", x: hall.x, y: hall.y, id: "maeve-wraith", enemy: "wraith" });
    }
  } else if (id === "vergennes") {
    const inn = first(m, "I", { x: 10, y: 5 });
    const hall = first(m, "B", { x: 12, y: 5 });
    const well = first(m, "W", { x: 12, y: 8 });
    props.push({ kind: "spawn", x: 12, y: 10, id: "spawn" });
    props.push({ kind: "npc", x: hall.x, y: hall.y, id: "v-mayor", npc: "vmayor" });
    props.push({ kind: "npc", x: inn.x, y: inn.y, id: "v-mill", npc: "millwright" });
    props.push({ kind: "npc", x: first(m, "H", { x: 2, y: 11 }).x, y: first(m, "H", { x: 2, y: 11 }).y, id: "v-lock", npc: "lockkeep" });
    props.push({ kind: "inn", x: inn.x, y: inn.y - 1, id: "inn" });
    props.push({ kind: "hall", x: hall.x, y: hall.y - 1, id: "hall" });
    props.push({ kind: "well", x: well.x, y: well.y, id: "well" });
    props.push({ kind: "shrine", x: 22, y: 11, id: "shrine" });
    props.push({ kind: "warp", x: 12, y: 13, id: "to-overworld", warp: countyDoor("vergennes") });
    addCache(props, flags, 4, 12, "cache-vfarm", "farmhouse");
    addCache(props, flags, 20, 4, "cache-vharbor", "harbor");
    if (!flags.relics.includes("flippers")) {
      props.push({ kind: "relic", x: 4, y: 6, id: "relic-flip", relic: "flippers" });
    }
    addChest(props, flags, 3, 2, "chest-v1");
    props.push({ kind: "enemy", x: 6, y: 2, id: "v-crow", enemy: "crow" });
    props.push({ kind: "enemy", x: 20, y: 12, id: "v-wraith", enemy: "wraith" });
    props.push({ kind: "enemy", x: 3, y: 8, id: "v-fisher", enemy: "fisher" });
    addBushes(props, [[8, 10], [16, 10], [18, 3]], flags, "v-bush-");
  } else if (id === "bristol") {
    const inn = first(m, "I", { x: 16, y: 7 });
    const hall = first(m, "B", { x: 18, y: 7 });
    const rock = first(m, "R", { x: 10, y: 3 });
    props.push({ kind: "spawn", x: 14, y: 10, id: "spawn" });
    props.push({ kind: "npc", x: inn.x, y: inn.y, id: "b-art", npc: "artist" });
    props.push({ kind: "npc", x: first(m, "H", { x: 2, y: 12 }).x, y: first(m, "H", { x: 2, y: 12 }).y, id: "b-hunt", npc: "hunter" });
    props.push({ kind: "rock", x: rock.x, y: rock.y, id: "prayer-rock" });
    props.push({ kind: "inn", x: inn.x, y: inn.y - 1, id: "inn" });
    props.push({ kind: "hall", x: hall.x, y: hall.y - 1, id: "hall" });
    props.push({ kind: "well", x: first(m, "W", { x: 17, y: 9 }).x, y: first(m, "W", { x: 17, y: 9 }).y, id: "well" });
    props.push({ kind: "shrine", x: first(m, "&", { x: 12, y: 16 }).x, y: first(m, "&", { x: 12, y: 16 }).y, id: "shrine" });
    props.push({ kind: "warp", x: 2, y: 14, id: "to-overworld", warp: countyDoor("bristol") });
    addCache(props, flags, 4, 12, "cache-bwoods", "woods");
    if (!flags.relics.includes("net")) {
      props.push({ kind: "relic", x: 22, y: 6, id: "relic-net", relic: "net" });
    }
    addCache(props, flags, 20, 8, "cache-bdown", "downtown");
    addChest(props, flags, 26, 14, "chest-b1");
    props.push({ kind: "enemy", x: 26, y: 3, id: "b-bear", enemy: "bear" });
    props.push({ kind: "enemy", x: 8, y: 15, id: "b-bob", enemy: "bobcat" });
    props.push({ kind: "enemy", x: 28, y: 10, id: "b-fisher", enemy: "fisher" });
    addBushes(props, [[12, 11], [20, 12], [6, 8]], flags, "b-bush-");
  } else if (id === "ferrisburgh") {
    const inn = first(m, "I", { x: 14, y: 6 });
    props.push({ kind: "spawn", x: 12, y: 8, id: "spawn" });
    props.push({ kind: "npc", x: first(m, "H", { x: 24, y: 4 }).x, y: first(m, "H", { x: 24, y: 4 }).y, id: "ferry", npc: "ferry" });
    props.push({ kind: "npc", x: first(m, "N", { x: 8, y: 6 }).x, y: first(m, "N", { x: 8, y: 6 }).y, id: "rokeby", npc: "rokeby" });
    props.push({ kind: "inn", x: inn.x, y: inn.y - 1, id: "inn" });
    props.push({ kind: "hall", x: first(m, "B", { x: 16, y: 6 }).x, y: first(m, "B", { x: 16, y: 6 }).y - 1, id: "hall" });
    props.push({ kind: "barn", x: 4, y: 9, id: "barn" });
    props.push({ kind: "well", x: first(m, "W", { x: 15, y: 8 }).x, y: first(m, "W", { x: 15, y: 8 }).y, id: "well" });
    props.push({ kind: "shrine", x: first(m, "&", { x: 10, y: 12 }).x, y: first(m, "&", { x: 10, y: 12 }).y, id: "shrine" });
    props.push({ kind: "warp", x: 14, y: 13, id: "to-overworld", warp: countyDoor("ferrisburgh") });
    addCache(props, flags, 5, 9, "cache-ffarm", "farmhouse");
    addCache(props, flags, 22, 5, "cache-fharbor", "harbor");
    addChest(props, flags, 3, 11, "chest-f1");
    props.push({ kind: "enemy", x: 26, y: 10, id: "f-bear", enemy: "bear" });
    props.push({ kind: "enemy", x: 6, y: 3, id: "f-fisher", enemy: "fisher" });
    props.push({ kind: "enemy", x: 20, y: 12, id: "f-bob", enemy: "bobcat" });
    addBushes(props, [[10, 9], [18, 9], [8, 11]], flags, "f-bush-");
  } else if (id === "salisbury" || id === "farmstead") {
    props.push({ kind: "spawn", x: 12, y: 9, id: "spawn" });
    props.push({ kind: "npc", x: first(m, "N", { x: 18, y: 4 }).x, y: first(m, "N", { x: 18, y: 4 }).y, id: "ranger", npc: "ranger" });
    props.push({ kind: "npc", x: first(m, "H", { x: 18, y: 7 }).x, y: first(m, "H", { x: 18, y: 7 }).y, id: "camp", npc: "camper" });
    props.push({ kind: "inn", x: first(m, "I", { x: 12, y: 9 }).x, y: first(m, "I", { x: 12, y: 9 }).y - 1, id: "inn" });
    props.push({ kind: "barn", x: 10, y: 12, id: "barn" });
    props.push({ kind: "well", x: first(m, "W", { x: 14, y: 9 }).x, y: first(m, "W", { x: 14, y: 9 }).y, id: "well" });
    props.push({ kind: "shrine", x: first(m, "&", { x: 22, y: 10 }).x, y: first(m, "&", { x: 22, y: 10 }).y, id: "shrine" });
    props.push({ kind: "warp", x: 2, y: 8, id: "to-overworld", warp: countyDoor("salisbury") });
    addCache(props, flags, 8, 12, "cache-scamp", "woods");
    if (!flags.relics.includes("bow")) {
      props.push({ kind: "relic", x: 20, y: 7, id: "relic-bow", relic: "bow" });
    }
    addCache(props, flags, 20, 7, "cache-sfarm", "farmhouse");
    addChest(props, flags, 4, 10, "chest-s1");
    props.push({ kind: "enemy", x: 6, y: 2, id: "s-bear1", enemy: "bear" });
    props.push({ kind: "enemy", x: 24, y: 4, id: "s-bear2", enemy: "bear" });
    props.push({ kind: "enemy", x: 26, y: 12, id: "s-fisher", enemy: "fisher" });
    addBushes(props, [[10, 10], [16, 11], [22, 8]], flags, "s-bush-");
  } else if (id === "rutland") {
    const hall = first(m, "H", { x: 10, y: 6 });
    const inn = first(m, "I", { x: 12, y: 6 });
    const mayor = first(m, "B", { x: 14, y: 6 });
    const well = first(m, "W", { x: 11, y: 8 });
    const shrine = first(m, "&", { x: 16, y: 3 });
    const farm = first(m, "F", { x: 4, y: 14 });
    props.push({ kind: "npc", x: hall.x, y: hall.y, id: "elder", npc: "elder" });
    props.push({ kind: "npc", x: inn.x, y: inn.y, id: "shop", npc: "shop" });
    props.push({ kind: "npc", x: mayor.x, y: mayor.y, id: "mayor", npc: "mayor" });
    props.push({ kind: "npc", x: farm.x, y: farm.y, id: "farmer", npc: "farmer" });
    props.push({ kind: "inn", x: inn.x, y: inn.y - 1, id: "inn" });
    props.push({ kind: "hall", x: mayor.x, y: mayor.y - 1, id: "hall" });
    props.push({ kind: "barn", x: 5, y: 12, id: "barn" });
    props.push({ kind: "well", x: well.x, y: well.y, id: "well" });
    props.push({ kind: "shrine", x: shrine.x, y: shrine.y, id: "shrine" });
    props.push({ kind: "spawn", x: 12, y: 12, id: "spawn" });
    if (!flags.sheepFound) props.push({ kind: "sheep", x: shrine.x, y: 2, id: "sheep" });
    props.push({
      kind: "warp",
      x: first(m, "Q", { x: 20, y: 16 }).x,
      y: first(m, "Q", { x: 20, y: 16 }).y,
      id: "to-quarry",
      warp: { map: "quarry", x: 16, y: 13 },
    });
    props.push({ kind: "warp", x: 2, y: 11, id: "to-overworld", warp: { map: "addison", x: 20, y: 23 } });
    props.push({ kind: "warp", x: 28, y: 18, id: "to-montpelier", warp: { map: "montpelier", x: 12, y: 8 } });
    props.push({ kind: "warp", x: 28, y: 4, id: "to-wrj", warp: { map: "whiteriver", x: 10, y: 8 } });
    props.push({ kind: "warp", x: 2, y: 4, id: "to-chittenden", warp: { map: "chittenden", x: 30, y: 40 } });
    props.push({ kind: "warp", x: 28, y: 12, id: "to-windsor", warp: { map: "windsor", x: 12, y: 24 } });
    addBushes(props, [[8, 10], [9, 10], [18, 8], [19, 9], [6, 11], [22, 12], [7, 5], [16, 12]], flags, "bush-");
    addChest(props, flags, 3, 3, "chest-woods");
    addChest(props, flags, 27, 8, "chest-farm");
    addChest(props, flags, 18, 17, "chest-river");
    addCache(props, flags, 6, 12, "cache-rbarn", "barn");
    addCache(props, flags, 14, 7, "cache-rdown", "downtown");
    props.push({ kind: "pot", x: 10, y: 9, id: "pot-1" });
    props.push({ kind: "pot", x: 13, y: 9, id: "pot-2" });
    props.push({ kind: "enemy", x: 4, y: 3, id: "crow-1", enemy: "crow" });
    props.push({ kind: "enemy", x: 24, y: 3, id: "crow-2", enemy: "crow" });
    props.push({ kind: "enemy", x: 24, y: 16, id: "wraith-1", enemy: "wraith" });
    props.push({ kind: "enemy", x: 5, y: 18, id: "wraith-2", enemy: "wraith" });
  } else if (id === "quarry") {
    const sen = first(m, "S", { x: 16, y: 3 });
    const spawn = first(m, "n", { x: 16, y: 14 });
    props.push({ kind: "spawn", x: spawn.x, y: spawn.y + 1, id: "qspawn" });
    props.push({ kind: "warp", x: 16, y: 16, id: "to-middlebury-q", warp: { map: "middlebury", x: 36, y: 11 } });
    addChest(props, flags, first(m, "C", { x: 22, y: 3 }).x, first(m, "C", { x: 22, y: 3 }).y, "chest-quarry");
    const keySpot = first(m, "k", { x: 6, y: 11 });
    if (!flags.chests.includes("q-key")) {
      props.push({ kind: "key", x: keySpot.x, y: keySpot.y, id: "q-key" });
    }
    const lockA = first(m, "L", { x: 16, y: 8 });
    if (flags.chests.includes("q-lock-a")) {
      if (tiles[lockA.y]) tiles[lockA.y][lockA.x] = T.marble;
    } else {
      props.push({ kind: "lock", x: lockA.x, y: lockA.y, id: "q-lock-a" });
    }
    const ham = first(m, "H", { x: 18, y: 6 });
    if (!flags.relics.includes("hammer")) {
      props.push({ kind: "relic", x: ham.x, y: ham.y, id: "relic-hammer", relic: "hammer" });
    }
    if (!flags.relics.includes("lantern")) {
      props.push({ kind: "relic", x: spawn.x, y: spawn.y, id: "relic-lantern", relic: "lantern" });
    }
    if (flags.sentinelFate !== "release" && !flags.townsCleared.includes("quarry")) {
      props.push({ kind: "enemy", x: sen.x, y: sen.y, id: "sentinel", enemy: "sentinel" });
      props.push({ kind: "npc", x: sen.x, y: sen.y + 1, id: "sentinel-talk", npc: "sentinel" });
    }
    props.push({ kind: "pot", x: 14, y: 13, id: "qpot1" });
    props.push({ kind: "pot", x: 18, y: 13, id: "qpot2" });
  } else if (id === "montpelier") {
    const cap = first(m, "B", { x: 14, y: 3 });
    props.push({ kind: "spawn", x: 12, y: 8, id: "spawn" });
    props.push({ kind: "capitol", x: cap.x - 1, y: cap.y - 1, id: "capitol" });
    props.push({ kind: "npc", x: cap.x, y: cap.y + 1, id: "legislator", npc: "legislator" });
    props.push({ kind: "npc", x: first(m, "H", { x: 2, y: 9 }).x, y: first(m, "H", { x: 2, y: 9 }).y, id: "intern", npc: "intern" });
    props.push({ kind: "inn", x: first(m, "I", { x: 18, y: 5 }).x, y: first(m, "I", { x: 18, y: 5 }).y - 1, id: "inn" });
    props.push({ kind: "well", x: first(m, "W", { x: 16, y: 7 }).x, y: first(m, "W", { x: 16, y: 7 }).y, id: "well" });
    props.push({ kind: "shrine", x: first(m, "&", { x: 12, y: 13 }).x, y: first(m, "&", { x: 12, y: 13 }).y, id: "shrine" });
    props.push({ kind: "warp", x: 2, y: 11, id: "to-rutland", warp: { map: "rutland", x: 26, y: 18 } });
    addCache(props, flags, cap.x + 2, cap.y, "cache-capitol", "capitol");
    addCache(props, flags, 6, 10, "cache-mdown", "downtown");
    addChest(props, flags, 24, 11, "chest-m1");
    props.push({ kind: "enemy", x: 24, y: 2, id: "m-bob", enemy: "bobcat" });
    props.push({ kind: "enemy", x: 6, y: 12, id: "m-wraith", enemy: "wraith" });
    addBushes(props, [[10, 10], [18, 10], [8, 6]], flags, "m-bush-");
  } else if (id === "whiteriver") {
    props.push({ kind: "spawn", x: 10, y: 8, id: "spawn" });
    props.push({ kind: "npc", x: first(m, "I", { x: 12, y: 3 }).x, y: first(m, "I", { x: 12, y: 3 }).y, id: "conductor", npc: "conductor" });
    props.push({ kind: "npc", x: first(m, "B", { x: 18, y: 5 }).x, y: first(m, "B", { x: 18, y: 5 }).y, id: "coolidge", npc: "coolidge" });
    props.push({ kind: "npc", x: first(m, "H", { x: 2, y: 7 }).x, y: first(m, "H", { x: 2, y: 7 }).y, id: "w-hunt", npc: "hunter" });
    props.push({ kind: "inn", x: first(m, "I", { x: 12, y: 3 }).x, y: first(m, "I", { x: 12, y: 3 }).y - 1, id: "inn" });
    props.push({ kind: "hall", x: first(m, "B", { x: 18, y: 5 }).x, y: first(m, "B", { x: 18, y: 5 }).y - 1, id: "hall" });
    props.push({ kind: "well", x: first(m, "W", { x: 17, y: 7 }).x, y: first(m, "W", { x: 17, y: 7 }).y, id: "well" });
    props.push({ kind: "warp", x: 26, y: 12, id: "to-windsor", warp: { map: "windsor", x: 50, y: 22 } });
    addCache(props, flags, 14, 3, "cache-rail", "rail");
    addCache(props, flags, 6, 11, "cache-wfarm", "farmhouse");
    addChest(props, flags, 24, 8, "chest-w1");
    props.push({ kind: "enemy", x: 22, y: 2, id: "w-crow", enemy: "crow" });
    props.push({ kind: "enemy", x: 8, y: 12, id: "w-fisher", enemy: "fisher" });
    props.push({ kind: "enemy", x: 24, y: 10, id: "w-bob", enemy: "bobcat" });
    addBushes(props, [[12, 9], [16, 10], [4, 9]], flags, "w-bush-");
  } else if (
    id === "burlington" ||
    id === "shelburne" ||
    id === "essex" ||
    id === "winooski" ||
    id === "woodstock" ||
    id === "springfieldvt" ||
    id === "norwich"
  ) {
    decorateVillage(id, props, m, flags);
  } else {
    props.push({ kind: "spawn", x: spawnDefault.x, y: spawnDefault.y, id: "spawn" });
  }

  const town = TOWN_BY_ID[id];
  if (town && id !== "quarry") {
    const hx = extras.homeX ?? flags.homeX ?? 0.55;
    const hy = extras.homeY ?? flags.homeY ?? 0.45;
    let home = placeHome(tiles, w, h, hx, hy);
    const spawn = props.find((p) => p.kind === "spawn");
    if (spawn && Math.abs(home.x - spawn.x) + Math.abs(home.y - spawn.y) < 6) {
      home = placeHome(tiles, w, h, 0.72, 0.28);
    }
    const isHere = !extras.geoTown || extras.geoTown === id;
    props.push({ kind: "home", x: home.x, y: home.y, id: "home-" + id });
    if (isHere) {
      flags.homeMap = id;
      flags.homeTileX = home.x;
      flags.homeTileY = home.y;
    }
  }

  attachDoors(id, props);
  for (const pl of flags.plots ?? []) {
    if ((pl.mapId ?? "middlebury") !== id) continue;
    const grown = Math.min(3, (pl.stage ?? 0) + Math.max(0, generations(flags.year) - generations(pl.year ?? flags.year)));
    if (tiles[pl.y]?.[pl.x] !== undefined) {
      tiles[pl.y][pl.x] = grown >= 2 ? T.flowers : T.soil;
    }
    if (grown >= 1 && !props.some((p) => p.id === pl.id)) {
      props.push({ kind: "plot", x: pl.x, y: pl.y, id: pl.id });
    }
  }
  for (const g of flags.graves ?? []) {
    if (g.mapId === id && !g.excavated) {
      const gx = Math.max(1, Math.min(w - 2, Math.floor(g.x / 16)));
      const gy = Math.max(1, Math.min(h - 2, Math.floor(g.y / 16)));
      props.push({ kind: "grave", x: gx, y: gy, id: g.id });
    }
  }
  if (flags.tropoverse && id !== "quarry") fractureTiles(tiles, cycle);
  return { tiles, w, h, props };
}

function paint(tiles: number[][], x0: number, y0: number, x1: number, y1: number, id: number) {
  for (let y = y0; y < y1 && y < tiles.length; y++) {
    for (let x = x0; x < x1 && x < tiles[0].length; x++) {
      if (tiles[y][x] === T.grass || tiles[y][x] === T.soil || tiles[y][x] === T.cobble) {
        tiles[y][x] = id;
      }
    }
  }
}

function sprinkle(tiles: number[][], id: number, count: number, seed: number) {
  let s = seed * 9973 + 13;
  const h = tiles.length;
  const w = tiles[0].length;
  for (let i = 0; i < count; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const x = 2 + (s % (w - 4));
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const y = 2 + (s % (h - 4));
    const t = tiles[y][x];
    if (t === T.grass || t === T.flowers || t === T.path) tiles[y][x] = id;
  }
}

export function isSolid(id: number, incarnation: string, swim = false) {
  if (id === T.water && (incarnation === "embryo" || swim)) return false;
  if (incarnation === "embryo") {
    return id === T.pine || id === T.wall || id === T.marbleWall;
  }
  return SOLID.has(id);
}

export function mapTitle(id: MapId) {
  if (id === "soloverse") return "Soloverse";
  if (isInterior(id)) return "Inside";
  return TOWN_BY_ID[id]?.name ?? id;
}
