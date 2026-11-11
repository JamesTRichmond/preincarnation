/**
 * Demo geography for the Lemon Fair Bend fragment only.
 * County placements do not use this grid. Map sessions must not be overwritten with it.
 */

export const COLS = 48;
export const ROWS = 30;

export const SPAWN = { x: 16.45, y: 17.65 };

const solid = new Set();
const floor = new Set();
const water = new Set();
const trees = new Set();
const gates = new Map();

function k(x, y) {
  return `${x},${y}`;
}

function addBuilding(b) {
  const x2 = b.x + b.w - 1;
  const y2 = b.y + b.h - 1;
  for (let y = b.y; y <= y2; y++) {
    for (let x = b.x; x <= x2; x++) {
      const edge = x === b.x || y === b.y || x === x2 || y === y2;
      if (edge) solid.add(k(x, y));
      else floor.add(k(x, y));
    }
  }
  for (const d of b.doors || []) {
    solid.delete(k(d.x, d.y));
    floor.add(k(d.x, d.y));
  }
  buildings.push({ ...b, x2, y2 });
}

export const buildings = [];

addBuilding({
  id: "hale",
  name: "Hale house",
  x: 18,
  y: 1,
  w: 11,
  h: 8,
  roof: "clapboard",
  doors: [{ x: 23, y: 8 }],
});
addBuilding({
  id: "attic",
  name: "Attic stair",
  x: 29,
  y: 1,
  w: 5,
  h: 6,
  roof: "clapboard",
  doors: [
    { x: 29, y: 4 },
    { x: 33, y: 4 },
  ],
});
addBuilding({
  id: "barn",
  name: "Barn",
  x: 36,
  y: 1,
  w: 9,
  h: 7,
  roof: "barn",
  doors: [{ x: 40, y: 7 }],
});
addBuilding({
  id: "workshop",
  name: "Cooper's shop",
  x: 18,
  y: 12,
  w: 12,
  h: 7,
  roof: "shop",
  doors: [{ x: 23, y: 18 }],
});
addBuilding({
  id: "boathouse",
  name: "Boathouse",
  x: 2,
  y: 20,
  w: 11,
  h: 5,
  roof: "boat",
  doors: [{ x: 12, y: 22 }],
});
addBuilding({
  id: "adit",
  name: "Quarry adit",
  x: 20,
  y: 20,
  w: 11,
  h: 5,
  roof: "stone",
  doors: [],
});
addBuilding({
  id: "sugarhouse",
  name: "Sugarhouse",
  x: 36,
  y: 20,
  w: 10,
  h: 5,
  roof: "sugar",
  doors: [{ x: 40, y: 24 }],
});

// Hale's east wall opens into the attic; the attic's east wall is an outside stair.
solid.delete(k(28, 4));
floor.add(k(28, 4));
solid.delete(k(29, 4));

// Parlor | kitchen split. Gap at the south so both rooms meet the mudroom.
for (let y = 2; y <= 5; y++) {
  solid.add(k(23, y));
  floor.delete(k(23, y));
}

// Adit grate — the only mouth. Stays solid until a key opens quarry-grate.
solid.add(k(25, 24));
gates.set(k(25, 24), "quarry-grate");

// Chapel ruin: a few stones, not a sealed building.
const chapelStones = [
  [33, 14],
  [41, 13],
  [40, 16],
  [33, 17],
  [41, 17],
];
for (const [x, y] of chapelStones) solid.add(k(x, y));

// Orchard trees. Lanes are cleared after, then anchors, then the blazed oak is forced.
for (let y = 1; y <= 12; y++) {
  for (let x = 1; x <= 13; x++) {
    if ((x + y) % 2 === 0 && x % 4 !== 2) trees.add(k(x, y));
  }
}
for (let y = 1; y <= 14; y++) trees.delete(k(6, y));
for (let x = 1; x <= 14; x++) trees.delete(k(x, 8));
for (let y = 8; y <= 12; y++) trees.delete(k(4, y));

for (let x = 0; x < COLS; x++) {
  for (let y = 26; y < ROWS; y++) water.add(k(x, y));
}

export const anchors = {
  "lfb-milepost-nail": { x: 16, y: 17, room: "lane" },
  "lfb-mudroom-boots": { x: 20, y: 7, room: "hale-mudroom" },
  "lfb-parlor-clover": { x: 20, y: 3, room: "hale-parlor" },
  "lfb-kitchen-crock": { x: 26, y: 5, room: "hale-kitchen" },
  "lfb-sideboard-locket": { x: 25, y: 4, room: "hale-kitchen" },
  "lfb-attic-letter": { x: 31, y: 3, room: "hale-attic" },
  "lfb-attic-marble": { x: 32, y: 3, room: "hale-attic" },
  "lfb-barn-halter": { x: 38, y: 3, room: "barn" },
  "lfb-barn-lantern": { x: 40, y: 4, room: "barn" },
  "lfb-barn-trowel": { x: 42, y: 5, room: "barn" },
  "lfb-orchard-notebook": { x: 8, y: 8, room: "orchard" },
  "lfb-orchard-tag": { x: 10, y: 4, room: "orchard" },
  "lfb-orchard-windfalls": { x: 6, y: 6, room: "orchard" },
  "lfb-orchard-wax": { x: 4, y: 8, room: "orchard" },
  "lfb-blaze-cache": { x: 4, y: 11, room: "orchard" },
  "lfb-cooper-bung": { x: 20, y: 14, room: "workshop" },
  "lfb-cooper-drawknife": { x: 22, y: 14, room: "workshop" },
  "lfb-cooper-invoice": { x: 24, y: 15, room: "workshop" },
  "lfb-cooper-brand": { x: 26, y: 16, room: "workshop" },
  "lfb-skiff-satchel": { x: 5, y: 22, room: "boathouse" },
  "lfb-net-locker": { x: 7, y: 22, room: "boathouse" },
  "lfb-plank-key": { x: 9, y: 22, room: "boathouse" },
  "lfb-scoop": { x: 38, y: 22, room: "sugarhouse" },
  "lfb-tin-ledger": { x: 42, y: 22, room: "sugarhouse" },
  "lfb-sap-spile": { x: 39, y: 23, room: "sugarhouse" },
  "lfb-chapel-niche": { x: 38, y: 14, room: "chapel" },
  "lfb-chapel-lintel": { x: 36, y: 13, room: "chapel" },
  "lfb-chapel-nail": { x: 34, y: 16, room: "chapel" },
  "lfb-powder-niche": { x: 27, y: 22, room: "quarry-adit" },
  "lfb-pay-stake": { x: 22, y: 25, room: "quarry-yard" },
  "lfb-snag-boot": { x: 1, y: 25, room: "riverbank" },
};

for (const a of Object.values(anchors)) {
  trees.delete(k(a.x, a.y));
  if (!gates.has(k(a.x, a.y))) {
    solid.delete(k(a.x, a.y));
    water.delete(k(a.x, a.y));
  }
}

// The blazed oak is a real trunk. The dig is the open ground south of it.
trees.add(k(4, 10));
solid.add(k(4, 10));

export const roomRects = [
  { id: "hale-parlor", x: 19, y: 2, w: 4, h: 5 },
  { id: "hale-kitchen", x: 24, y: 2, w: 4, h: 5 },
  { id: "hale-mudroom", x: 19, y: 7, w: 9, h: 1 },
  { id: "hale-attic", x: 30, y: 2, w: 3, h: 4 },
  { id: "barn", x: 37, y: 2, w: 7, h: 5 },
  { id: "workshop", x: 19, y: 13, w: 10, h: 5 },
  { id: "sugarhouse", x: 37, y: 21, w: 8, h: 3 },
  { id: "boathouse", x: 3, y: 21, w: 9, h: 3 },
  { id: "quarry-adit", x: 21, y: 21, w: 9, h: 3 },
  { id: "chapel", x: 33, y: 13, w: 9, h: 5 },
  { id: "orchard", x: 1, y: 1, w: 13, h: 13 },
];

export const people = [
  { id: "ruth-hale", name: "Ruth Hale", x: 25.4, y: 5.5, room: "hale-kitchen", presentIn: ["before"], color: "apron" },
  { id: "eli-hale", name: "Eli Hale", x: 6.4, y: 22.4, room: "boathouse", presentIn: ["before"], color: "cap" },
];

export const landmarks = [{ id: "milepost-year", x: 16, y: 17, radius: 1.35 }];

export const labels = [
  { text: "Orchard", x: 7, y: 2.2 },
  { text: "Hale", x: 22, y: 1.45 },
  { text: "Barn", x: 40, y: 1.45 },
  { text: "Cooper", x: 23.5, y: 12.45 },
  { text: "Chapel", x: 37, y: 12.4 },
  { text: "Boathouse", x: 7, y: 20.4 },
  { text: "Adit", x: 25, y: 20.4 },
  { text: "Sugarhouse", x: 40.5, y: 20.4 },
  { text: "Fair", x: 8, y: 27.4 },
];

export function roomAt(x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  for (const r of roomRects) {
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return r.id;
  }
  if (ty >= 26) return "river";
  if (ty === 25) return "riverbank";
  return "lane";
}

export function isWater(x, y) {
  return water.has(k(Math.floor(x), Math.floor(y)));
}

export function isTree(x, y) {
  return trees.has(k(Math.floor(x), Math.floor(y)));
}

export function isFloor(x, y) {
  return floor.has(k(Math.floor(x), Math.floor(y)));
}

export function gateAt(x, y) {
  return gates.get(k(Math.floor(x), Math.floor(y))) || null;
}

/** World collision: integer tile blocked for a body that wants to occupy it. */
export function tileBlocked(tx, ty, openGates) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  const key = k(tx, ty);
  if (water.has(key)) return true;
  if (trees.has(key)) return true;
  const g = gates.get(key);
  if (g) return !(openGates && openGates.has(g));
  if (solid.has(key)) return true;
  return false;
}

export function flood(openGates) {
  const reach = new Set();
  const sx = Math.floor(SPAWN.x);
  const sy = Math.floor(SPAWN.y);
  const q = [[sx, sy]];
  reach.add(k(sx, sy));
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = k(nx, ny);
      if (reach.has(nk)) continue;
      if (tileBlocked(nx, ny, openGates)) continue;
      reach.add(nk);
      q.push([nx, ny]);
    }
  }
  return reach;
}

export function listTrees() {
  return [...trees].map((s) => s.split(",").map(Number));
}

export function listWater() {
  return water;
}

export function listFloor() {
  return floor;
}

export function listSolid() {
  return solid;
}
