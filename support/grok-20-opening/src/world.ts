import { FLAGS, type Dir, type Flags, type MapId, type State } from "./types.ts";

export const DIRS: Record<Dir, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
  e: { x: 1, y: 0 },
};

export const DIR_LIST: Dir[] = ["n", "s", "e", "w"];

/** Coordinates shared by maps, entities, and tests. */
export const AT = {
  start: { x: 6, y: 8 },
  ditch: { x: 6, y: 5 },
  gate: { x: 14, y: 12 },
  trailBriar: { x: 14, y: 10 },
  roadVeinPortal: { x: 14, y: 14 },
  roadVeinReturn: { x: 14, y: 11 },
  roadEastPortal: { x: 26, y: 8 },
  roadFromLane: { x: 25, y: 8 },
  roadRiverPortal: { x: 3, y: 3 },
  roadFromRiver: { x: 4, y: 4 },
  milepost: { x: 9, y: 7 },
  wayside: { x: 12, y: 7 },
  ruts: { x: 7, y: 8 },
  bank: { x: 20, y: 7 },
  laneWest: { x: 1, y: 7 },
  laneFromRoad: { x: 2, y: 7 },
  houseDoor: { x: 5, y: 5 },
  innDoor: { x: 12, y: 5 },
  yardDoor: { x: 19, y: 5 },
  well: { x: 12, y: 10 },
  window: { x: 7, y: 6 },
  epitaphA: { x: 8, y: 11 },
  epitaphB: { x: 10, y: 11 },
  edge: { x: 22, y: 7 },
};

export const VEIN = {
  w: 22,
  h: 16,
  door: { x: 6, y: 7 },
  pinch: { x: 19, y: 11 },
  drop: { x: 4, y: 12 },
  seam: { x: 4, y: 7 },
  impression: { x: 16, y: 5 },
  mallet: { x: 3, y: 8 },
  ledge: { x: 2, y: 3 },
  hammer: { x: 2, y: 6 },
  slab: { x: 3, y: 10 },
  pinchLip: { x: 19, y: 10 },
  dropLip: { x: 4, y: 11 },
  enter: { x: 2, y: 2 },
  leave: { x: 2, y: 1 },
  riverPortal: { x: 2, y: 13 },
  riverLand: { x: 3, y: 12 },
  landSafe: { x: 2, y: 4 },
};

export const HOUSE = {
  ione: { x: 3, y: 3 },
  table: { x: 8, y: 3 },
  cupboard: { x: 3, y: 6 },
  peg: { x: 9, y: 6 },
  door: { x: 6, y: 9 },
  land: { x: 6, y: 8 },
};

export const INN = {
  hearth: { x: 3, y: 3 },
  ledger: { x: 9, y: 3 },
  bench: { x: 6, y: 5 },
  sill: { x: 9, y: 6 },
  door: { x: 6, y: 9 },
  land: { x: 6, y: 8 },
  safe: { x: 4, y: 5 },
};

export const YARD = {
  hart: { x: 3, y: 3 },
  nail: { x: 9, y: 3 },
  block: { x: 9, y: 6 },
  scrap: { x: 4, y: 7 },
  door: { x: 6, y: 9 },
  land: { x: 6, y: 8 },
  safe: { x: 5, y: 5 },
};

export const RIVER = {
  deep: { x: 5, y: 7 },
  rest: { x: 6, y: 11 },
  ring: { x: 12, y: 11 },
  toRoad: { x: 10, y: 14 },
  toVein: { x: 3, y: 14 },
  fromVein: { x: 4, y: 12 },
  fromRoad: { x: 10, y: 12 },
};

export const SHORE = {
  start: { x: 5, y: 8 },
  water: { x: 8, y: 3 },
  stone: { x: 8, y: 8 },
};

export const BRIARS: { x: number; y: number }[] = [
  { x: AT.trailBriar.x, y: AT.trailBriar.y },
  { x: 9, y: 4 },
  { x: 11, y: 4 },
  { x: 16, y: 3 },
  { x: 20, y: 4 },
];

export interface Portal {
  map: MapId;
  x: number;
  y: number;
  to: MapId;
  tx: number;
  ty: number;
}

export interface Ent {
  id: string;
  map: MapId;
  x: number;
  y: number;
  solid: boolean;
  name: string;
}

export interface MapDef {
  id: MapId;
  rows: string[];
}

function blank(w: number, h: number, fill: string): string[][] {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function wallBorder(g: string[][]): void {
  const h = g.length;
  const w = g[0].length;
  for (let x = 0; x < w; x++) {
    g[0][x] = "#";
    g[h - 1][x] = "#";
  }
  for (let y = 0; y < h; y++) {
    g[y][0] = "#";
    g[y][w - 1] = "#";
  }
}

function buildRoad(): string[][] {
  const g = blank(28, 16, ",");
  wallBorder(g);
  for (const [x, y] of [
    [2, 1],
    [3, 1],
    [4, 1],
    [2, 2],
    [3, 2],
  ]) {
    g[y][x] = "~";
  }
  g[AT.ditch.y][AT.ditch.x] = "~";
  g[3][8] = "t";
  g[4][22] = "t";
  g[6][18] = "t";
  for (let x = 1; x <= 26; x++) g[8][x] = "+";
  for (let y = 10; y <= 14; y++) {
    for (let x = 1; x <= 26; x++) g[y][x] = x === 14 ? "." : "t";
  }
  g[9][14] = ".";
  g[AT.trailBriar.y][AT.trailBriar.x] = "b";
  for (const b of BRIARS) {
    if (b.x === AT.trailBriar.x && b.y === AT.trailBriar.y) continue;
    g[b.y][b.x] = "b";
  }
  return g;
}

function buildLane(): string[][] {
  const g = blank(24, 14, ",");
  wallBorder(g);
  for (let x = 1; x <= 22; x++) g[7][x] = "+";
  const block = (x0: number, x1: number, doorX: number) => {
    for (let y = 2; y <= 5; y++) {
      for (let x = x0; x <= x1; x++) g[y][x] = "#";
    }
    g[5][doorX] = ".";
  };
  block(3, 7, AT.houseDoor.x);
  block(10, 14, AT.innDoor.x);
  block(17, 21, AT.yardDoor.x);
  for (let x = 7; x <= 11; x++) g[12][x] = "#";
  return g;
}

function buildRoom(w: number, h: number): string[][] {
  const g = blank(w, h, ".");
  wallBorder(g);
  return g;
}

function buildVein(): string[][] {
  const g = blank(VEIN.w, VEIN.h, "#");
  for (let y = 1; y <= 13; y++) {
    for (let x = 1; x <= 5; x++) g[y][x] = ".";
  }
  for (let y = 6; y <= 9; y++) {
    for (let x = 7; x <= 12; x++) g[y][x] = ".";
  }
  for (let y = 3; y <= 13; y++) {
    for (let x = 13; x <= 20; x++) g[y][x] = ".";
  }
  g[VEIN.door.y][VEIN.door.x] = "#";
  g[VEIN.drop.y][VEIN.drop.x] = "~";
  g[VEIN.pinch.y][VEIN.pinch.x] = "x";
  return g;
}

function buildRiver(): string[][] {
  const g = blank(18, 16, ",");
  wallBorder(g);
  for (let y = 3; y <= 7; y++) {
    for (let x = 2; x <= 15; x++) g[y][x] = "~";
  }
  for (let x = 2; x <= 15; x++) g[8][x] = ":";
  return g;
}

function buildShore(): string[][] {
  const g = blank(16, 12, ",");
  wallBorder(g);
  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 13; x++) g[y][x] = ":";
  }
  return g;
}

function seal(g: string[][]): string[] {
  const w = g[0].length;
  return g.map((row) => {
    const s = row.join("");
    if (s.length !== w) throw new Error("row width " + s.length);
    return s;
  });
}

export const MAPS: Record<MapId, MapDef> = {
  road: { id: "road", rows: seal(buildRoad()) },
  lane: { id: "lane", rows: seal(buildLane()) },
  house: { id: "house", rows: seal(buildRoom(13, 11)) },
  inn: { id: "inn", rows: seal(buildRoom(13, 11)) },
  yard: { id: "yard", rows: seal(buildRoom(13, 11)) },
  vein: { id: "vein", rows: seal(buildVein()) },
  river: { id: "river", rows: seal(buildRiver()) },
  shore: { id: "shore", rows: seal(buildShore()) },
};

export const PORTALS: Portal[] = [
  { map: "road", x: AT.roadEastPortal.x, y: AT.roadEastPortal.y, to: "lane", tx: AT.laneFromRoad.x, ty: AT.laneFromRoad.y },
  { map: "road", x: AT.roadVeinPortal.x, y: AT.roadVeinPortal.y, to: "vein", tx: VEIN.enter.x, ty: VEIN.enter.y },
  { map: "road", x: AT.roadRiverPortal.x, y: AT.roadRiverPortal.y, to: "river", tx: RIVER.fromRoad.x, ty: RIVER.fromRoad.y },
  { map: "lane", x: AT.laneWest.x, y: AT.laneWest.y, to: "road", tx: AT.roadFromLane.x, ty: AT.roadFromLane.y },
  { map: "lane", x: AT.houseDoor.x, y: AT.houseDoor.y, to: "house", tx: HOUSE.land.x, ty: HOUSE.land.y },
  { map: "lane", x: AT.innDoor.x, y: AT.innDoor.y, to: "inn", tx: INN.land.x, ty: INN.land.y },
  { map: "lane", x: AT.yardDoor.x, y: AT.yardDoor.y, to: "yard", tx: YARD.land.x, ty: YARD.land.y },
  { map: "house", x: HOUSE.door.x, y: HOUSE.door.y, to: "lane", tx: AT.houseDoor.x, ty: AT.houseDoor.y + 2 },
  { map: "inn", x: INN.door.x, y: INN.door.y, to: "lane", tx: AT.innDoor.x, ty: AT.innDoor.y + 2 },
  { map: "yard", x: YARD.door.x, y: YARD.door.y, to: "lane", tx: AT.yardDoor.x, ty: AT.yardDoor.y + 2 },
  { map: "vein", x: VEIN.leave.x, y: VEIN.leave.y, to: "road", tx: AT.roadVeinReturn.x, ty: AT.roadVeinReturn.y },
  { map: "vein", x: VEIN.riverPortal.x, y: VEIN.riverPortal.y, to: "river", tx: RIVER.fromVein.x, ty: RIVER.fromVein.y },
  { map: "river", x: RIVER.toRoad.x, y: RIVER.toRoad.y, to: "road", tx: AT.roadFromRiver.x, ty: AT.roadFromRiver.y },
  { map: "river", x: RIVER.toVein.x, y: RIVER.toVein.y, to: "vein", tx: VEIN.riverLand.x, ty: VEIN.riverLand.y },
];

export const ENTITIES: Ent[] = [
  { id: "milepost", map: "road", ...AT.milepost, solid: false, name: "Milepost" },
  { id: "wayside", map: "road", ...AT.wayside, solid: false, name: "Wayside stone" },
  { id: "ruts", map: "road", ...AT.ruts, solid: false, name: "The ruts" },
  { id: "gate", map: "road", ...AT.gate, solid: true, name: "A root across the trail" },
  { id: "bank", map: "road", ...AT.bank, solid: false, name: "The grassy bank" },
  { id: "window", map: "lane", ...AT.window, solid: false, name: "A window" },
  { id: "well", map: "lane", ...AT.well, solid: false, name: "The well" },
  { id: "epitaph-a", map: "lane", ...AT.epitaphA, solid: false, name: "A stone" },
  { id: "epitaph-b", map: "lane", ...AT.epitaphB, solid: false, name: "A second stone" },
  { id: "edge", map: "lane", ...AT.edge, solid: false, name: "Where the lane continues" },
  { id: "ione", map: "house", ...HOUSE.ione, solid: true, name: "Ione Pell" },
  { id: "table", map: "house", ...HOUSE.table, solid: true, name: "The table" },
  { id: "cupboard", map: "house", ...HOUSE.cupboard, solid: true, name: "The cupboard" },
  { id: "peg", map: "house", ...HOUSE.peg, solid: false, name: "A peg" },
  { id: "hearth", map: "inn", ...INN.hearth, solid: false, name: "The hearth" },
  { id: "ledger", map: "inn", ...INN.ledger, solid: true, name: "The ledger" },
  { id: "bench", map: "inn", ...INN.bench, solid: false, name: "The bench" },
  { id: "sill", map: "inn", ...INN.sill, solid: false, name: "The sill" },
  { id: "hart", map: "yard", ...YARD.hart, solid: true, name: "Hart Soll" },
  { id: "nail", map: "yard", ...YARD.nail, solid: false, name: "The nail" },
  { id: "block", map: "yard", ...YARD.block, solid: false, name: "The practice block" },
  { id: "scrap", map: "yard", ...YARD.scrap, solid: false, name: "A split card" },
  { id: "vein-hammer", map: "vein", ...VEIN.hammer, solid: false, name: "A hammer" },
  { id: "ledge", map: "vein", ...VEIN.ledge, solid: false, name: "A ledge" },
  { id: "seam", map: "vein", ...VEIN.seam, solid: false, name: "The seam" },
  { id: "impression", map: "vein", ...VEIN.impression, solid: false, name: "The impression" },
  { id: "slab", map: "vein", ...VEIN.slab, solid: false, name: "A slab" },
  { id: "mallet", map: "vein", ...VEIN.mallet, solid: false, name: "A split mallet" },
  { id: "pinch-lip", map: "vein", ...VEIN.pinchLip, solid: false, name: "The lip of a cut" },
  { id: "drop-lip", map: "vein", ...VEIN.dropLip, solid: false, name: "The lip of a drop" },
  { id: "river-bank", map: "river", ...RIVER.rest, solid: false, name: "The bank" },
  { id: "ring", map: "river", ...RIVER.ring, solid: false, name: "A ring of stones" },
  { id: "pale-water", map: "shore", ...SHORE.water, solid: false, name: "The pale water" },
  { id: "shore-stone", map: "shore", ...SHORE.stone, solid: false, name: "A stone" },
];

export function entity(id: string): Ent {
  const e = ENTITIES.find((n) => n.id === id);
  if (!e) throw new Error("missing entity " + id);
  return e;
}

export function tileAt(state: Pick<State, "seam"> | null, map: MapId, x: number, y: number): string {
  const rows = MAPS[map].rows;
  if (y < 0 || x < 0 || y >= rows.length || x >= rows[0].length) return "#";
  const t = rows[y][x];
  if (state && map === "vein" && state.seam.veinOpen && x === VEIN.door.x && y === VEIN.door.y) return ".";
  return t;
}

export function inBounds(map: MapId, x: number, y: number): boolean {
  const rows = MAPS[map].rows;
  return y >= 0 && x >= 0 && y < rows.length && x < rows[0].length;
}

export function portalAt(map: MapId, x: number, y: number): Portal | undefined {
  return PORTALS.find((p) => p.map === map && p.x === x && p.y === y);
}

export function solidEntityAt(state: State, map: MapId, x: number, y: number): Ent | undefined {
  return ENTITIES.find((e) => {
    if (e.map !== map || e.x !== x || e.y !== y || !e.solid) return false;
    if (e.id === "gate" && state.flags.rootCut) return false;
    return true;
  });
}

export function blocked(state: State, map: MapId, x: number, y: number): boolean {
  const t = tileAt(state, map, x, y);
  if (t === "#" || t === "t") return true;
  return Boolean(solidEntityAt(state, map, x, y));
}

export function lethal(state: State, map: MapId, x: number, y: number): boolean {
  const t = tileAt(state, map, x, y);
  return t === "~" || t === "x";
}

export function briarAt(state: State, map: MapId, x: number, y: number): boolean {
  return tileAt(state, map, x, y) === "b";
}

export function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function near(state: State, id: string): boolean {
  const e = entity(id);
  if (e.map !== state.map) return false;
  return manhattan(state.x, state.y, e.x, e.y) <= 1;
}

export function entitiesNear(state: State): Ent[] {
  return ENTITIES.filter((e) => e.map === state.map && manhattan(state.x, state.y, e.x, e.y) <= 1).sort(
    (a, b) => manhattan(state.x, state.y, a.x, a.y) - manhattan(state.x, state.y, b.x, b.y),
  );
}

export function placeTitle(state: Pick<State, "map">): string {
  switch (state.map) {
    case "road":
      return "The county road";
    case "lane":
      return "Middlebury lane";
    case "house":
      return "Pell's";
    case "inn":
      return "The Second Lamp";
    case "yard":
      return "Soll's yard";
    case "vein":
      return "Marble Vein";
    case "river":
      return "The river cut";
    case "shore":
      return "The shore";
  }
}

export function landingFor(place: MapId | null): { map: MapId; x: number; y: number } {
  switch (place) {
    case "vein":
      return { map: "vein", ...VEIN.landSafe };
    case "river":
      return { map: "river", ...RIVER.rest };
    case "house":
    case "lane":
      return { map: "lane", x: 8, y: 7 };
    case "inn":
      return { map: "inn", ...INN.safe };
    case "yard":
      return { map: "yard", ...YARD.safe };
    default:
      return { map: "road", ...AT.start };
  }
}

export function defaultFlags(): Flags {
  return Object.fromEntries(FLAGS.map((f) => [f, false])) as Flags;
}

export function mapPicture(id: MapId): string {
  return MAPS[id].rows.join("\n");
}

export function assertWorld(): string[] {
  const problems: string[] = [];
  for (const map of Object.values(MAPS)) {
    const w = map.rows[0].length;
    map.rows.forEach((row, i) => {
      if (row.length !== w) problems.push(map.id + " row " + i);
    });
  }
  const ids = new Set<string>();
  for (const e of ENTITIES) {
    if (ids.has(e.id)) problems.push("dup " + e.id);
    ids.add(e.id);
    const t = tileAt(null, e.map, e.x, e.y);
    if (t === "#" || t === "t") problems.push(e.id + " on wall " + t);
    if (!inBounds(e.map, e.x, e.y)) problems.push(e.id + " oob");
  }
  const dummy = { seam: { veinOpen: false, veinScar: false, yardOpen: false, yardScar: false, veinDent: false, yardDent: false }, flags: defaultFlags() } as State;
  for (const e of ENTITIES.filter((n) => n.solid && n.id !== "gate")) {
    const ok = DIR_LIST.some((d) => {
      const x = e.x + DIRS[d].x;
      const y = e.y + DIRS[d].y;
      return inBounds(e.map, x, y) && !blocked(dummy, e.map, x, y);
    });
    if (!ok) problems.push("no neighbor " + e.id);
  }
  for (const p of PORTALS) {
    const dest = tileAt(null, p.to, p.tx, p.ty);
    if (dest === "#" || dest === "t" || dest === "~" || dest === "x") problems.push("portal dest " + p.map + p.x + "," + p.y);
    if (portalAt(p.to, p.tx, p.ty)) problems.push("portal lands on portal " + p.to + p.tx + "," + p.ty);
    const src = tileAt(null, p.map, p.x, p.y);
    if (src === "#" || src === "t") problems.push("portal on wall " + p.map);
  }
  const lands = [
    landingFor("road"),
    landingFor("lane"),
    landingFor("inn"),
    landingFor("yard"),
    landingFor("vein"),
    landingFor("river"),
    { map: "shore" as const, ...SHORE.start },
  ];
  for (const L of lands) {
    if (blocked(dummy, L.map, L.x, L.y) || lethal(dummy, L.map, L.x, L.y) || portalAt(L.map, L.x, L.y)) {
      problems.push("bad landing " + L.map + L.x + "," + L.y);
    }
  }
  if (tileAt(null, "road", AT.start.x, AT.start.y) === "#") problems.push("start");
  if (tileAt(null, "road", AT.ditch.x, AT.ditch.y) !== "~") problems.push("ditch");
  return problems;
}

const worldProblems = assertWorld();
if (worldProblems.length) {
  throw new Error("opening world: " + worldProblems.join("; "));
}
