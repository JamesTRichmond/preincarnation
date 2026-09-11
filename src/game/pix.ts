/** Native 16-bit pixel drawing. SNES cells, ALttP language. */

import { T } from "./tile-ids";
import type { RelicId } from "./items";

export const C = {
  grass0: "#1c5820",
  grass1: "#348038",
  grass2: "#4c9c40",
  grass3: "#143c18",
  grassH: "#64b048",
  dirt0: "#8a5a28",
  dirt1: "#c49a50",
  dirt2: "#6a3c18",
  dirt3: "#3c200c",
  dirtH: "#d8b870",
  cob0: "#a09078",
  cob1: "#887860",
  cob2: "#c8b898",
  cob3: "#504838",
  water0: "#184868",
  water1: "#286888",
  water2: "#58a8c0",
  water3: "#0c2840",
  foam: "#d0e8e8",
  cliff0: "#8a5a28",
  cliff1: "#6a3c18",
  cliff2: "#3c200c",
  cliff3: "#c49048",
  lip: "#24140c",
  pine0: "#143c18",
  pine1: "#1c5820",
  pine2: "#0c2810",
  pineT: "#3c2410",
  wall0: "#6a645c",
  wall1: "#4a4440",
  wall2: "#8a8478",
  marb0: "#c8c0b0",
  marb1: "#a8a090",
  marb2: "#e0d8c8",
  marb3: "#706858",
  wood0: "#8a4a20",
  wood1: "#6a3014",
  wood2: "#b86a30",
  gold: "#e8c36a",
  heart: "#d03030",
  heartEmpty: "#481818",
  magic: "#30c030",
  magicEmpty: "#103010",
  hud: "#000000",
  hudEdge: "#f0e0b0",
  ink: "#14100c",
  paper: "#f4efe2",
};

function hash(x: number, y: number, s = 0) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

export function px(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, s = 1) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, s, s);
}

type Plot = (x: number, y: number, c: string) => void;

export function paintTile16(
  ctx: CanvasRenderingContext2D,
  id: number,
  dx: number,
  dy: number,
  tx: number,
  ty: number,
  tiles: number[][],
  frame: number,
) {
  const p: Plot = (x, y, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(dx + x, dy + y, 1, 1);
  };
  const n = (ox: number, oy: number) => tiles[ty + oy]?.[tx + ox] ?? T.wall;

  if (id === T.grass || id === T.flowers) paintGrass(p, tx, ty, id === T.flowers, n);
  else if (id === T.path || id === T.gravel || id === T.sand || id === T.soil || id === T.rail) paintDirt(p, tx, ty, id, n);
  else if (id === T.water) paintWater(p, tx, ty, frame, n);
  else if (id === T.bridge) paintBridge(p);
  else if (id === T.cobble) paintCobble(p, tx, ty);
  else if (id === T.wood) paintWood(p, tx, ty);
  else if (id === T.pine) paintPine(p, tx, ty, n);
  else if (id === T.wall) paintWall(p, tx, ty);
  else if (id === T.marble) paintMarble(p, tx, ty, false);
  else if (id === T.marbleWall) paintMarble(p, tx, ty, true);
  else if (id === T.cracked) paintCracked(p, tx, ty);
  else if (id === T.cliff) paintCliff(p, tx, ty, n);
  else if (id === T.cliffLip) paintLip(p, tx, ty, n);
  else if (id === T.cosmic) paintCosmic(p, tx, ty, frame);
  else if (id === T.void) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, "#08060c");
  } else paintGrass(p, tx, ty, false, n);

  const below = n(0, 1);
  const walkable = id === T.grass || id === T.flowers || id === T.cobble || id === T.path;
  if (walkable && (below === T.cliff || below === T.water)) {
    for (let x = 0; x < 16; x++) {
      p(x, 13, C.lip);
      p(x, 14, C.cliff2);
      p(x, 15, C.cliff1);
      if ((hash(tx, x, 3) & 3) === 0) p(x, 12, C.dirt2);
    }
  }
  if (id === T.grass || id === T.cobble || id === T.path) {
    if (n(1, 0) === T.water) for (let y = 0; y < 16; y += 2) p(15, y, C.dirt1);
    if (n(-1, 0) === T.water) for (let y = 0; y < 16; y += 2) p(0, y, C.dirt1);
    if (n(0, -1) === T.water) for (let x = 0; x < 16; x += 2) p(x, 0, C.dirt1);
  }
}

function paintGrass(p: Plot, tx: number, ty: number, flowers: boolean, n: (ox: number, oy: number) => number) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(tx * 16 + x, ty * 16 + y, 7) & 31;
      p(x, y, v === 0 ? C.grass0 : v === 1 ? C.grass2 : C.grass1);
    }
  }
  const t = hash(tx, ty, 3) % 5;
  if (t < 4) {
    const ux = 1 + (hash(tx, ty, 4) % 12);
    const uy = 2 + (hash(tx, ty, 5) % 11);
    p(ux, uy, C.grassH);
    p(ux, uy + 1, C.grass3);
    p(ux + 1, uy, C.grass0);
  }
  if ((hash(tx, ty, 21) & 3) === 0) {
    const ux = 3 + (hash(tx, ty, 22) % 10);
    const uy = 6 + (hash(tx, ty, 23) % 8);
    p(ux, uy, C.grassH);
    p(ux, uy + 1, C.grass0);
  }
  if (flowers || (hash(tx, ty, 19) & 15) === 0) {
    const fx = 4 + (hash(tx, ty, 9) % 8);
    const fy = 4 + (hash(tx, ty, 11) % 8);
    p(fx, fy, "#f0e8d0");
    p(fx + 1, fy, "#e8c36a");
    p(fx, fy + 1, C.grass3);
    p(fx - 1, fy, "#f0e8d0");
    p(fx, fy - 1, "#f0e8d0");
  }
  const fringe = (id: number) => id === T.path || id === T.soil || id === T.gravel || id === T.sand;
  if (fringe(n(1, 0))) for (let y = 0; y < 16; y++) if ((hash(tx, y, 1) & 3) === 0) p(15, y, C.dirt0);
  if (fringe(n(-1, 0))) for (let y = 0; y < 16; y++) if ((hash(tx, y, 2) & 3) === 0) p(0, y, C.dirt0);
  if (fringe(n(0, 1))) for (let x = 0; x < 16; x++) if ((hash(x, ty, 3) & 3) === 0) p(x, 15, C.dirt0);
  if (fringe(n(0, -1))) for (let x = 0; x < 16; x++) if ((hash(x, ty, 4) & 3) === 0) p(x, 0, C.dirt0);
}

function paintDirt(p: Plot, tx: number, ty: number, id: number, n: (ox: number, oy: number) => number) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(tx * 16 + x, ty * 16 + y, 13) & 15;
      const c =
        id === T.gravel
          ? v < 2
            ? C.cob1
            : v < 8
              ? C.dirt0
              : C.dirt2
          : v === 0
            ? C.dirt2
            : v === 1
              ? C.dirtH
              : v < 6
                ? C.dirt1
                : C.dirt0;
      p(x, y, c);
    }
  }
  const px0 = 3 + (hash(tx, ty, 8) % 10);
  const py0 = 4 + (hash(tx, ty, 9) % 8);
  p(px0, py0, C.cob2);
  p(px0 + 1, py0, C.cob0);
  const grass = (id0: number) => id0 === T.grass || id0 === T.flowers || id0 === T.cliffLip;
  if (grass(n(1, 0))) for (let y = 0; y < 16; y++) if ((hash(tx, y, 5) & 3) === 0) p(15, y, C.grass1);
  if (grass(n(-1, 0))) for (let y = 0; y < 16; y++) if ((hash(tx, y, 6) & 3) === 0) p(0, y, C.grass1);
  if (grass(n(0, 1))) for (let x = 0; x < 16; x++) if ((hash(x, ty, 7) & 3) === 0) p(x, 15, C.grass1);
  if (grass(n(0, -1))) for (let x = 0; x < 16; x++) if ((hash(x, ty, 8) & 3) === 0) p(x, 0, C.grass1);
}

function paintWater(p: Plot, tx: number, ty: number, frame: number, n: (ox: number, oy: number) => number) {
  const f = frame & 3;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const wave = (x + (y >> 1) + f * 2 + (hash(tx, ty, 1) & 3)) & 7;
      p(x, y, wave === 0 ? C.water2 : wave < 3 ? C.water1 : wave === 7 ? C.water3 : C.water0);
    }
  }
  const land = (id: number) => id !== T.water && id !== T.void && id !== T.cliff;
  if (land(n(0, -1))) for (let x = 0; x < 16; x++) p(x, 0, (x + f) & 1 ? C.foam : C.dirt1);
  if (land(n(1, 0))) for (let y = 0; y < 16; y++) p(15, y, (y + f) & 1 ? C.foam : C.dirt1);
  if (land(n(0, 1))) for (let x = 0; x < 16; x++) p(x, 15, (x + f) & 1 ? C.foam : C.dirt1);
  if (land(n(-1, 0))) for (let y = 0; y < 16; y++) p(0, y, (y + f) & 1 ? C.foam : C.dirt1);
}

function paintBridge(p: Plot) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) p(x, y, y < 2 || y > 13 ? C.dirt3 : y & 1 ? C.wood0 : C.wood2);
  }
  for (let y = 2; y < 14; y++) {
    p(0, y, C.wood1);
    p(15, y, C.wood1);
  }
}

function paintCobble(p: Plot, tx: number, ty: number) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, C.cob3);
  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 2; gx++) {
      const ox = gx * 8;
      const oy = gy * 8;
      const v = hash(tx * 2 + gx, ty * 2 + gy, 2) & 3;
      const fill = v === 0 ? C.cob2 : v === 1 ? C.cob0 : C.cob1;
      for (let y = 1; y < 7; y++) for (let x = 1; x < 7; x++) p(ox + x, oy + y, fill);
    }
  }
}

function paintWood(p: Plot, tx: number, ty: number) {
  for (let y = 0; y < 16; y++) {
    const row = hash(tx, ty * 16 + y, 5) & 1 ? C.wood0 : C.wood2;
    for (let x = 0; x < 16; x++) p(x, y, x === 0 || x === 15 ? C.wood1 : row);
  }
}

function paintPine(p: Plot, tx: number, ty: number, n: (ox: number, oy: number) => number) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(tx * 16 + x, ty * 16 + y, 6) & 7;
      p(x, y, v === 0 ? C.pine0 : v < 3 ? C.pine2 : C.pine1);
    }
  }
  if (n(0, 1) !== T.pine) {
    for (let y = 10; y < 16; y++) {
      p(7, y, C.pineT);
      p(8, y, C.pineT);
    }
    for (let x = 0; x < 16; x++) p(x, 10, C.pine0);
  }
  if (n(0, -1) !== T.pine) {
    for (let x = 0; x < 16; x++) if ((hash(x, ty, 2) & 3) === 0) p(x, 0, C.grass3);
  }
}

function paintWall(p: Plot, tx: number, ty: number) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const mortar = y % 4 === 3 || x % 8 === ((y >> 2) & 1) * 4;
      p(x, y, mortar ? C.wall1 : ((y >> 2) + (x >> 3)) & 1 ? C.wall0 : C.wall2);
    }
  }
  void tx;
  void ty;
}

function paintMarble(p: Plot, tx: number, ty: number, wall: boolean) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(tx * 16 + x, ty * 16 + y, 17) & 7;
      p(x, y, wall ? (v < 2 ? C.marb3 : v < 5 ? C.marb1 : C.marb0) : v === 0 ? C.marb2 : v < 3 ? C.marb0 : C.marb1);
    }
  }
  if (wall) {
    for (let x = 0; x < 16; x++) p(x, 0, C.lip);
    for (let y = 0; y < 16; y++) p(0, y, C.marb3);
  }
}

function paintCracked(p: Plot, tx: number, ty: number) {
  paintMarble(p, tx, ty, false);
  for (let i = 0; i < 16; i++) {
    p(i, 7 + ((i >> 2) & 1), C.marb3);
    p(8, i, C.lip);
  }
}

function paintCliff(p: Plot, tx: number, ty: number, n: (ox: number, oy: number) => number) {
  const top = n(0, -1) !== T.cliff;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const wave = ((x * 3 + hash(tx, ty, 21)) % 16) > 12 ? 1 : 0;
      const band = ((y + wave) >> 2) & 1;
      const v = hash(tx * 16 + x, ty * 16 + y, 21) & 15;
      let c = band ? C.cliff0 : C.cliff1;
      if (v === 0) c = C.dirt0;
      p(x, y, c);
    }
  }
  if (top) {
    for (let x = 0; x < 16; x++) {
      p(x, 0, C.lip);
      p(x, 1, C.lip);
      p(x, 2, C.cliff3);
      p(x, 3, C.dirtH);
      p(x, 4, C.dirt1);
    }
  }
}

function paintLip(p: Plot, tx: number, ty: number, n: (ox: number, oy: number) => number) {
  paintGrass(p, tx, ty, false, n);
  for (let x = 0; x < 16; x++) {
    p(x, 11, C.dirt0);
    p(x, 12, C.lip);
    p(x, 13, C.lip);
    p(x, 14, C.cliff3);
    p(x, 15, C.dirtH);
  }
}

function paintCosmic(p: Plot, tx: number, ty: number, frame: number) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p(x, y, "#140c28");
  const sx = (hash(tx, ty, 4) + frame) % 14;
  const sy = hash(tx, ty, 5) % 14;
  p(sx + 1, sy + 1, "#d0b0ff");
  p(3 + (ty % 10), 4, "#6040a0");
}

function blob(p: Plot, cx: number, cy: number, r: number, dark: string, mid: string, lite: string, ink: string) {
  for (let oy = -r; oy <= r; oy++) {
    for (let ox = -r; ox <= r; ox++) {
      const d = Math.abs(ox) + Math.abs(oy);
      if (d > r) continue;
      const x = cx + ox;
      const y = cy + oy;
      if (x < 0 || y < 0 || x > 15 || y > 15) continue;
      if (d === r) p(x, y, ink);
      else if (ox < 0 && oy < 0 && d < r - 1) p(x, y, lite);
      else if (d < r - 1) p(x, y, mid);
      else p(x, y, dark);
    }
  }
}

export function paintBush16(ctx: CanvasRenderingContext2D, x: number, y: number, glow: boolean) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  const dark = glow ? "#3c9058" : "#143818";
  const mid = glow ? "#58b070" : "#1c5828";
  const lite = glow ? "#90e090" : "#2c7838";
  blob(p, 5, 6, 4, dark, mid, lite, C.ink);
  blob(p, 11, 5, 4, dark, mid, lite, C.ink);
  blob(p, 6, 11, 4, dark, mid, lite, C.ink);
  blob(p, 12, 11, 4, dark, mid, lite, C.ink);
}

export function paintRock16(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  const ink = "#1c1814";
  const dark = "#3a4a58";
  const mid = "#6a8490";
  const lite = "#b8d0d0";
  for (let py = 4; py < 14; py++) {
    for (let px = 2; px < 14; px++) {
      const dx = px - 7.5;
      const dy = py - 8.5;
      const d = dx * dx + dy * dy * 1.3;
      if (d > 28) continue;
      const edge = d > 20;
      p(px, py, edge ? ink : dx < -1 && dy < 0 ? lite : d > 12 ? dark : mid);
    }
  }
  p(6, 7, lite);
  p(7, 7, lite);
  p(6, 8, "#98b8c0");
}

export function paintBuilding16(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  const roof: Record<string, [string, string]> = {
    inn: ["#a03028", "#701810"],
    hall: ["#703018", "#401008"],
    barn: ["#8a4020", "#5a2010"],
    college: ["#5a4030", "#3a2818"],
    capitol: ["#c8b898", "#706050"],
    sugar: ["#a06028", "#703810"],
    disp: ["#385040", "#203028"],
    home: ["#8a3020", "#5a180c"],
  };
  const [r0, r1] = roof[kind] ?? roof.home;
  const stone = "#c4b898";
  const mortar = "#5a4c3c";
  // 40×36 house, door at south, origin = door-tile top-left so roof hangs north
  for (let py = -16; py < -4; py++) {
    const t = (py + 16) / 12;
    const inset = Math.floor((1 - t) * 8);
    for (let px = -12 + inset; px < 28 - inset; px++) p(px, py, py === -5 ? r1 : r0);
  }
  for (let py = -4; py < 16; py++) {
    for (let px = -10; px < 26; px++) {
      const edge = py === -4 || px === -10 || px === 25;
      p(px, py, edge ? mortar : (px + py) % 7 === 0 ? "#b0a488" : stone);
    }
  }
  for (let py = 4; py < 16; py++) for (let px = 4; px < 12; px++) p(px, py, "#1a100c");
  p(10, 10, C.gold);
  for (let py = 0; py < 6; py++) {
    for (let px = -6; px < 0; px++) p(px, py, py === 3 || px === -3 ? mortar : "#78c0d0");
    for (let px = 16; px < 22; px++) p(px, py, py === 3 || px === 19 ? mortar : "#78c0d0");
  }
  for (let px = -10; px < 26; px++) p(px, -4, r1);
}

export function paintNpc16(ctx: CanvasRenderingContext2D, x: number, y: number, npc: string) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  const body: Record<string, string> = {
    elder: "#c8b898",
    farmer: "#8a6030",
    mayor: "#486090",
    shop: "#c89030",
    hunter: "#4a3820",
    ranger: "#2c5828",
    sentinel: "#908070",
    ferry: "#406080",
    heart: "#e8c36a",
    spectrum: "#b07ad6",
    echo_elder: "#8e8676",
    echo_sentinel: "#706858",
    echo_resident: "#c4bba8",
    echo_mayor: "#3a4868",
  };
  const b = body[npc] ?? "#a09078";
  const echo = npc.startsWith("echo") || npc === "heart" || npc === "spectrum";
  for (let px = 4; px < 12; px++) p(px, 14, "#00000088");
  p(5, 13, C.ink);
  p(9, 13, C.ink);
  for (let py = 7; py < 13; py++) for (let px = 5; px < 11; px++) p(px, py, b);
  for (let py = 3; py < 7; py++) for (let px = 6; px < 10; px++) p(px, py, echo ? "#f4efe2" : "#e0c8a0");
  const hat = npc === "elder" || npc === "echo_elder" ? "#e8e0d0" : npc === "farmer" ? "#6a4020" : npc === "heart" ? C.gold : C.ink;
  for (let px = 6; px < 10; px++) p(px, 2, hat);
  p(5, 3, hat);
  p(10, 3, hat);
  p(5, 7, C.ink);
  p(10, 7, C.ink);
  if (echo) {
    p(4, 8, "#b07ad6");
    p(11, 8, "#b07ad6");
  }
}

export function paintWell16(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 4; py < 14; py++) {
    for (let px = 2; px < 14; px++) {
      const dx = px - 7.5;
      const dy = py - 8.5;
      if (dx * dx + dy * dy * 1.1 > 28) continue;
      p(px, py, dx * dx + dy * dy < 8 ? "#142030" : (px + py) & 1 ? C.cob1 : C.cob0);
    }
  }
  for (let px = 6; px < 10; px++) p(px, 3, C.wood1);
}

export function paintChest16(ctx: CanvasRenderingContext2D, x: number, y: number, glow: boolean) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  const body = glow ? "#c89030" : "#6a3c18";
  for (let py = 6; py < 14; py++) for (let px = 2; px < 14; px++) p(px, py, py === 6 || px === 2 || px === 13 ? C.ink : body);
  for (let px = 2; px < 14; px++) p(px, 9, C.gold);
  p(7, 10, C.gold);
  p(8, 10, C.ink);
}

export function paintGrave16(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 2; py < 14; py++) for (let px = 5; px < 11; px++) p(px, py, py === 2 || px === 5 || px === 10 ? C.ink : C.cob1);
  p(7, 5, C.cob2);
  p(8, 5, C.cob2);
}

export function paintPot16(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 5; py < 14; py++) for (let px = 4; px < 12; px++) p(px, py, px === 4 || px === 11 || py === 13 ? C.ink : "#a05828");
  for (let px = 6; px < 10; px++) p(px, 4, "#c87840");
}

export function paintShrine16(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 10; py < 15; py++) for (let px = 2; px < 14; px++) p(px, py, C.cob1);
  for (let py = 2; py < 12; py++) for (let px = 6; px < 10; px++) p(px, py, on ? C.gold : C.cob2);
}

export function paintSheep16(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 7; py < 14; py++) for (let px = 3; px < 13; px++) p(px, py, C.paper);
  for (let py = 6; py < 11; py++) for (let px = 11; px < 15; px++) p(px, py, "#e0d4c0");
  p(13, 7, C.ink);
  p(3, 13, C.ink);
  p(10, 13, C.ink);
}

export function paintPlot16(ctx: CanvasRenderingContext2D, x: number, y: number, ripe: boolean) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 10; py < 15; py++) for (let px = 2; px < 14; px++) p(px, py, ripe ? "#5a7a32" : "#6a4a28");
  if (ripe) {
    p(5, 6, "#e8c36a");
    p(8, 5, "#7ec8a3");
    p(11, 7, "#e8c36a");
  } else {
    p(4, 11, "#3a2010");
    p(10, 12, "#3a2010");
  }
}

export function paintLock16(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 0; py < 16; py++) for (let px = 2; px < 14; px++) p(px, py, py === 0 || px === 2 || px === 13 ? C.ink : C.wood1);
  p(7, 7, C.gold);
  p(8, 8, C.gold);
}

export function paintKey16(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 3; py < 8; py++) for (let px = 5; px < 11; px++) p(px, py, C.gold);
  for (let py = 8; py < 14; py++) p(7, py, C.gold);
  p(8, 12, C.gold);
  p(9, 13, C.gold);
}

/** Zelda-1 hill mouth: green mound, black oval, gold lintel. */
export function paintCave16(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const p: Plot = (px, py, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  for (let py = 0; py < 16; py++) {
    for (let px = 0; px < 16; px++) {
      const dx = px - 7.5;
      const dy = py - 9;
      const hill = (dx * dx) / 64 + (dy * dy) / 90;
      if (hill > 1) continue;
      p(px, py, py < 6 ? "#4c9c40" : py < 10 ? "#348038" : "#1c5820");
    }
  }
  for (let py = 6; py < 16; py++) {
    for (let px = 4; px < 12; px++) {
      const dx = (px - 7.5) / 3.4;
      const dy = (py - 11) / 4.6;
      if (dx * dx + dy * dy <= 1) p(px, py, py === 6 ? "#24140c" : "#08060c");
    }
  }
  for (let px = 4; px < 12; px++) p(px, 6, C.gold);
  p(4, 7, C.ink);
  p(11, 7, C.ink);
}

export function paintHeart(ctx: CanvasRenderingContext2D, x: number, y: number, full: boolean) {
  const c = full ? C.heart : C.heartEmpty;
  const hi = full ? "#f07870" : "#301010";
  const shape = [
    "..##.##..",
    ".#######.",
    "#########",
    "#########",
    ".#######.",
    "..#####..",
    "...###...",
    "....#....",
  ];
  for (let py = 0; py < shape.length; py++) {
    for (let px = 0; px < shape[py].length; px++) {
      if (shape[py][px] !== "#") continue;
      for (const [ox, oy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const) {
        const nx = px + ox;
        const ny = py + oy;
        if (!shape[ny] || shape[ny][nx] === "#") continue;
        ctx.fillStyle = C.ink;
        ctx.fillRect(x + nx, y + ny, 1, 1);
      }
    }
  }
  for (let py = 0; py < shape.length; py++) {
    for (let px = 0; px < shape[py].length; px++) {
      if (shape[py][px] !== "#") continue;
      ctx.fillStyle = py === 1 && px < 4 ? hi : c;
      ctx.fillRect(x + px, y + py, 1, 1);
    }
  }
}

export function paintShadow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const row = ["  ######  ", "##########", " ######## ", "  ######  "];
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  for (let py = 0; py < row.length; py++) {
    for (let px = 0; px < row[py].length; px++) {
      if (row[py][px] === "#") ctx.fillRect(x + px + 3, y + 12 + py, 1, 1);
    }
  }
}

export function paintHudFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = C.hud;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.hudEdge;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = "#a07038";
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
}

export function paintMagicMeter(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.fillStyle = "#e8e0d0";
  ctx.fillRect(x, y, 8, 32);
  ctx.fillStyle = C.hud;
  ctx.fillRect(x + 1, y + 1, 6, 30);
  const h = Math.round(28 * Math.max(0, Math.min(1, t)));
  ctx.fillStyle = C.magicEmpty;
  ctx.fillRect(x + 2, y + 2, 4, 28);
  ctx.fillStyle = C.magic;
  ctx.fillRect(x + 2, y + 2 + (28 - h), 4, h);
  ctx.fillStyle = "#90f090";
  if (h > 2) ctx.fillRect(x + 2, y + 2 + (28 - h), 1, h);
}

export function paintItemBox(ctx: CanvasRenderingContext2D, x: number, y: number) {
  paintHudFrame(ctx, x, y, 24, 24);
  ctx.fillStyle = "#080808";
  ctx.fillRect(x + 2, y + 2, 20, 20);
}

export function paintRupee(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#20a038";
  ctx.fillRect(x + 2, y, 3, 8);
  ctx.fillRect(x + 1, y + 1, 5, 6);
  ctx.fillRect(x, y + 2, 7, 4);
  ctx.fillStyle = "#b8f0b0";
  ctx.fillRect(x + 2, y + 2, 2, 2);
}

export function paintBombIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#3868c8";
  ctx.fillRect(x + 1, y + 2, 6, 6);
  ctx.fillRect(x + 2, y + 1, 4, 8);
  ctx.fillStyle = "#d8e8f8";
  ctx.fillRect(x + 2, y + 3, 2, 2);
  ctx.fillStyle = "#c45c20";
  ctx.fillRect(x + 4, y, 2, 2);
}

export function paintArrowIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#c8a050";
  ctx.fillRect(x + 3, y + 1, 2, 8);
  ctx.fillStyle = "#d8d0c0";
  ctx.fillRect(x + 1, y, 6, 2);
  ctx.fillRect(x + 2, y + 8, 4, 1);
}

export function paintKeyIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.gold;
  ctx.fillRect(x + 2, y, 4, 4);
  ctx.fillRect(x + 3, y + 3, 2, 6);
  ctx.fillRect(x + 3, y + 8, 4, 2);
}

const FONT: Record<string, string[]> = {
  "0": ["###", "# #", "# #", "# #", "###"],
  "1": [" # ", "## ", " # ", " # ", "###"],
  "2": ["###", "  #", "###", "#  ", "###"],
  "3": ["###", "  #", "###", "  #", "###"],
  "4": ["# #", "# #", "###", "  #", "  #"],
  "5": ["###", "#  ", "###", "  #", "###"],
  "6": ["###", "#  ", "###", "# #", "###"],
  "7": ["###", "  #", " # ", " # ", " # "],
  "8": ["###", "# #", "###", "# #", "###"],
  "9": ["###", "# #", "###", "  #", "###"],
  "-": ["   ", "   ", "###", "   ", "   "],
  " ": ["   ", "   ", "   ", "   ", "   "],
  ".": ["   ", "   ", "   ", "   ", " # "],
  "'": [" # ", " # ", "   ", "   ", "   "],
  A: [" # ", "# #", "###", "# #", "# #"],
  B: ["## ", "# #", "## ", "# #", "## "],
  C: [" ##", "#  ", "#  ", "#  ", " ##"],
  D: ["## ", "# #", "# #", "# #", "## "],
  E: ["###", "#  ", "## ", "#  ", "###"],
  F: ["###", "#  ", "## ", "#  ", "#  "],
  G: [" ##", "#  ", "# #", "# #", " ##"],
  H: ["# #", "# #", "###", "# #", "# #"],
  I: ["###", " # ", " # ", " # ", "###"],
  J: ["###", "  #", "  #", "# #", " ##"],
  K: ["# #", "# #", "## ", "# #", "# #"],
  L: ["#  ", "#  ", "#  ", "#  ", "###"],
  M: ["# #", "###", "# #", "# #", "# #"],
  N: ["## ", "# #", "# #", "# #", "# #"],
  O: [" # ", "# #", "# #", "# #", " # "],
  P: ["## ", "# #", "## ", "#  ", "#  "],
  Q: [" # ", "# #", "# #", " ##", "  #"],
  R: ["## ", "# #", "## ", "# #", "# #"],
  S: [" ##", "#  ", " # ", "  #", "## "],
  T: ["###", " # ", " # ", " # ", " # "],
  U: ["# #", "# #", "# #", "# #", "###"],
  V: ["# #", "# #", "# #", "# #", " # "],
  W: ["# #", "# #", "# #", "###", "# #"],
  X: ["# #", "# #", " # ", "# #", "# #"],
  Y: ["# #", "# #", " # ", " # ", " # "],
  Z: ["###", "  #", " # ", "#  ", "###"],
};

function paintGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, ch: string, color: string) {
  const g = FONT[ch] ?? FONT[" "];
  for (let py = 0; py < 5; py++) {
    for (let px = 0; px < 3; px++) {
      if (g[py][px] !== "#") continue;
      ctx.fillStyle = C.ink;
      ctx.fillRect(x + px, y + py + 1, 1, 1);
      ctx.fillRect(x + px + 1, y + py, 1, 1);
      ctx.fillRect(x + px - 1, y + py, 1, 1);
    }
  }
  ctx.fillStyle = color;
  for (let py = 0; py < 5; py++) {
    for (let px = 0; px < 3; px++) {
      if (g[py][px] === "#") ctx.fillRect(x + px, y + py, 1, 1);
    }
  }
}

export function paintOutlinedNum(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, color = "#f0e8c8") {
  const s = String(Math.max(0, Math.floor(n)));
  let ox = x;
  for (const ch of s) {
    paintGlyph(ctx, ox, y, ch, color);
    ox += 4;
  }
}

function paintWord(ctx: CanvasRenderingContext2D, x: number, y: number, word: string, color = "#f0e8c8") {
  let ox = x;
  for (const ch of word) {
    paintGlyph(ctx, ox, y, ch, color);
    ox += 4;
  }
}

export function paintRelicIcon(ctx: CanvasRenderingContext2D, x: number, y: number, id: RelicId) {
  const p = (px: number, py: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + px, y + py, 1, 1);
  };
  if (id === "lantern") {
    for (let py = 4; py < 14; py++) for (let px = 5; px < 11; px++) p(px, py, py < 6 ? C.wood1 : "#e8c36a");
    p(7, 2, C.gold);
    p(8, 3, C.gold);
  } else if (id === "hammer") {
    for (let py = 2; py < 7; py++) for (let px = 3; px < 13; px++) p(px, py, C.cob1);
    for (let py = 6; py < 15; py++) p(7, py, C.wood0);
  } else if (id === "shovel") {
    for (let py = 1; py < 11; py++) p(7, py, C.wood0);
    for (let py = 10; py < 15; py++) for (let px = 5; px < 11; px++) p(px, py, C.cob2);
  } else if (id === "bow") {
    for (let i = 0; i < 12; i++) {
      p(4, 2 + i, C.wood0);
      p(11 - Math.abs(i - 6) / 2, 2 + i, C.cob2);
    }
  } else if (id === "cape") {
    for (let py = 3; py < 14; py++) for (let px = 4; px < 12; px++) p(px, py, "#503070");
    p(6, 2, "#e0c8a0");
    p(7, 2, "#e0c8a0");
  } else if (id === "bombs") {
    paintBombIcon(ctx, x + 4, y + 3);
  } else {
    for (let py = 4; py < 14; py++) for (let px = 6; px < 10; px++) p(px, py, C.gold);
    p(5, 5, C.cob2);
  }
}

export type HudInfo = {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  karma: number;
  arrows: number;
  bombs: number;
  keys: number;
  year: number;
  town: string;
  clock: string;
  weather: string;
  ySlot: RelicId | null;
  name?: string;
};

export function paintHudALttP(ctx: CanvasRenderingContext2D, info: HudInfo) {
  paintMagicMeter(ctx, 6, 8, info.mp / Math.max(1, info.maxMp));
  paintItemBox(ctx, 18, 8);
  if (info.ySlot) paintRelicIcon(ctx, 20, 10, info.ySlot);
  paintRupee(ctx, 46, 10);
  paintOutlinedNum(ctx, 56, 12, Math.max(0, info.karma));
  paintBombIcon(ctx, 84, 10);
  paintOutlinedNum(ctx, 94, 12, info.bombs);
  paintArrowIcon(ctx, 118, 10);
  paintOutlinedNum(ctx, 128, 12, info.arrows);
  if (info.keys > 0) {
    paintKeyIcon(ctx, 152, 9);
    paintOutlinedNum(ctx, 162, 12, info.keys);
  }
  paintWord(ctx, 214, 6, (info.name ?? "JOB").slice(0, 8).toUpperCase(), "#f0e8c8");
  const hearts = Math.min(20, info.maxHp);
  for (let i = 0; i < hearts; i++) {
    const hx = 214 + (i % 10) * 10;
    const hy = 14 + Math.floor(i / 10) * 9;
    paintHeart(ctx, hx, hy, i < info.hp);
  }
}

export function makeTileCache() {
  const cache = new Map<string, HTMLCanvasElement>();
  const blit = (
    ctx: CanvasRenderingContext2D,
    id: number,
    dx: number,
    dy: number,
    tx: number,
    ty: number,
    tiles: number[][],
    frame: number,
    size: number,
  ) => {
    const n = (ox: number, oy: number) => tiles[ty + oy]?.[tx + ox] ?? T.wall;
    const anim = id === T.water || id === T.cosmic ? frame & 3 : 0;
    const key = id + ":" + tx + ":" + ty + ":" + anim + ":" + n(1, 0) + ":" + n(-1, 0) + ":" + n(0, 1) + ":" + n(0, -1);
    let c = cache.get(key);
    if (!c) {
      c = document.createElement("canvas");
      c.width = 16;
      c.height = 16;
      paintTile16(c.getContext("2d")!, id, 0, 0, tx, ty, tiles, frame);
      cache.set(key, c);
    }
    ctx.drawImage(c, 0, 0, 16, 16, dx, dy, size, size);
  };
  return {
    blit,
    clear: () => cache.clear(),
  };
}

export { T };
