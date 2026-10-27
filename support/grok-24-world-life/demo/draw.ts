import { samplePose } from "../src/activities.ts";
import { roleTitle } from "../src/talk.ts";
import type { ActivityDef, Cell, Dir, Structure, World } from "../src/types.ts";
import { plate } from "./palette.ts";

export interface Layout {
  cell: number;
  ox: number;
  oy: number;
  width: number;
  height: number;
}

/** Presentation only. Never fed back into the simulation. */
export interface PlateMotion {
  spin: number;
  wear: number;
  reduced: boolean;
  eraLabel: string;
  selectedId: string | null;
  player: { x: number; y: number; path: Cell[]; facing: Dir; moving: boolean };
  places: Readonly<Record<string, { x: number; y: number }>>;
  speech: { actorId: string; text: string } | null;
  hover: Cell | null;
  motes: { x: number; y: number; life: number }[];
}

export function layoutFor(cssW: number, cssH: number, world: World): Layout {
  const margin = 18;
  const cell = Math.max(8, Math.floor(Math.min((cssW - margin * 2) / world.w, (cssH - margin * 2) / world.h)));
  const mapW = cell * world.w;
  const mapH = cell * world.h;
  return {
    cell,
    ox: Math.floor((cssW - mapW) / 2),
    oy: Math.floor((cssH - mapH) / 2),
    width: cssW,
    height: cssH,
  };
}

export function cellAt(layout: Layout, world: World, localX: number, localY: number): Cell | null {
  const x = Math.floor((localX - layout.ox) / layout.cell);
  const y = Math.floor((localY - layout.oy) / layout.cell);
  if (x < 0 || y < 0 || x >= world.w || y >= world.h) return null;
  return { x, y };
}

export function drawPlate(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  world: World,
  view: PlateMotion,
  activities: Record<string, ActivityDef>,
): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const canvas = ctx.canvas;
  const pw = Math.round(cssW * dpr);
  const ph = Math.round(cssH * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const L = layoutFor(cssW, cssH, world);

  ctx.fillStyle = mix(plate.paperDeep, plate.ink, view.wear * 0.08);
  ctx.fillRect(0, 0, cssW, cssH);
  frame(ctx, cssW, cssH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(L.ox, L.oy, world.w * L.cell, world.h * L.cell);
  ctx.clip();

  drawGround(ctx, world, L, view);
  for (const structure of world.hub.structures) drawStructure(ctx, world, structure, L, view);
  drawFences(ctx, world, L);
  drawEphemeral(ctx, world, L);
  const walker = world.actors.find((a) => a.path.length > 0);
  if (walker) drawPath(ctx, L, walker.path, plate.ink, 0.28);
  if (view.player.path.length) drawPath(ctx, L, view.player.path, plate.brass, 0.9);
  for (const mote of view.motes) drawMote(ctx, L, mote);
  for (const actor of world.actors) {
    const at = view.places[actor.actorId] ?? actor;
    const hot = !!view.hover && view.hover.x === actor.x && view.hover.y === actor.y;
    const chosen = actor.actorId === view.selectedId;
    if (actor.mode === "vacant") drawVacant(ctx, L, at.x, at.y, chosen);
    else drawWorker(ctx, world, L, actor, at, chosen || hot, activities, view, hot || chosen);
  }
  drawEllis(ctx, L, view);
  ctx.restore();

  const titleSize = Math.max(11, L.cell * 0.42);
  ctx.fillStyle = plate.ink;
  ctx.font = `600 ${titleSize}px Fraunces, Palatino, serif`;
  ctx.textAlign = "left";
  ctx.fillText(world.hub.place, L.ox, Math.max(14, L.oy - 6));
  ctx.fillStyle = plate.brass;
  ctx.font = `600 ${Math.max(10, titleSize * 0.82)}px Outfit, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText(view.eraLabel, L.ox + world.w * L.cell, Math.max(14, L.oy - 6));
  ctx.textAlign = "left";

  if (view.speech) {
    const who = world.actors.find((a) => a.actorId === view.speech!.actorId);
    if (who) {
      const at = view.places[who.actorId] ?? who;
      drawSpeech(ctx, L, at.x, at.y, view.speech.text);
    }
  }
  if (view.hover) drawHover(ctx, world, L, view.hover);
}

function frame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeStyle = plate.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(6.5, 6.5, w - 13, h - 13);
  ctx.strokeStyle = plate.brass;
  ctx.strokeRect(10.5, 10.5, w - 21, h - 21);
}

function drawGround(ctx: CanvasRenderingContext2D, world: World, L: Layout, view: PlateMotion): void {
  const base = world.hub.ground === "farm" ? "#6a7846" : world.hub.ground === "water" ? "#e3d3b0" : "#e6d7b6";
  ctx.fillStyle = mix(base, plate.ink, view.wear * 0.12);
  ctx.fillRect(L.ox, L.oy, world.w * L.cell, world.h * L.cell);

  const fillRect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = mix(color, plate.ink, view.wear * 0.1);
    ctx.fillRect(L.ox + x * L.cell, L.oy + y * L.cell, w * L.cell, h * L.cell);
  };
  for (const yard of world.hub.yards) fillRect(yard.x, yard.y, yard.w, yard.h, world.hub.ground === "town" ? "#e7d8b4" : "#e4d2aa");
  for (const field of world.hub.fields) fillRect(field.x, field.y, field.w, field.h, "#c4a15a");
  for (const orchard of world.hub.orchards) fillRect(orchard.x, orchard.y, orchard.w, orchard.h, "#5d6b3c");
  for (const green of world.hub.greens) fillRect(green.x, green.y, green.w, green.h, "#6d7d4a");

  ctx.fillStyle = "rgba(28, 25, 20, 0.08)";
  for (let y = 0; y < world.h; y++) {
    for (let x = 0; x < world.w; x++) {
      if (!world.walk[y]?.[x]) continue;
      if ((x * 13 + y * 7) % 5 !== 0) continue;
      const px = L.ox + x * L.cell + ((x * 3 + y) % 5) * (L.cell / 6);
      const py = L.oy + y * L.cell + ((x + y * 5) % 4) * (L.cell / 5);
      ctx.fillRect(px, py, 1.5, 1.5);
    }
  }

  for (let y = 0; y < world.h; y++) {
    for (let x = 0; x < world.w; x++) {
      if (world.walk[y]?.[x]) continue;
      const water = world.hub.waters.some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
      const pier = world.hub.piers.some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
      if (water && !pier) {
        ctx.fillStyle = (x + y) % 4 === 0 ? plate.lakeDeep : plate.lake;
        ctx.fillRect(L.ox + x * L.cell, L.oy + y * L.cell, L.cell, L.cell);
      }
    }
  }

  const drift = view.reduced ? 0 : view.spin * 18;
  ctx.strokeStyle = "rgba(243, 234, 215, 0.35)";
  ctx.lineWidth = 1;
  for (const water of world.hub.waters) {
    for (let i = 0; i < water.h * 2; i++) {
      const y = L.oy + water.y * L.cell + ((i + 0.5) * L.cell) / 2;
      ctx.beginPath();
      const x0 = L.ox + water.x * L.cell;
      const x1 = L.ox + (water.x + water.w) * L.cell;
      ctx.moveTo(x0, y);
      ctx.bezierCurveTo(
        x0 + (x1 - x0) * 0.3,
        y + Math.sin(drift * 0.05 + i) * 1.4,
        x0 + (x1 - x0) * 0.7,
        y - Math.sin(drift * 0.05 + i * 0.7) * 1.4,
        x1,
        y,
      );
      ctx.stroke();
    }
  }

  for (const pier of world.hub.piers) {
    ctx.fillStyle = "#b08960";
    ctx.fillRect(L.ox + pier.x * L.cell, L.oy + pier.y * L.cell, pier.w * L.cell, pier.h * L.cell);
    ctx.strokeStyle = "rgba(28,25,20,0.28)";
    for (let x = pier.x; x < pier.x + pier.w; x++) {
      ctx.beginPath();
      ctx.moveTo(L.ox + (x + 0.5) * L.cell, L.oy + pier.y * L.cell + 2);
      ctx.lineTo(L.ox + (x + 0.5) * L.cell, L.oy + (pier.y + pier.h) * L.cell - 2);
      ctx.stroke();
    }
  }

  if (world.hub.ground === "farm") {
    ctx.strokeStyle = "rgba(90, 60, 20, 0.28)";
    for (const field of world.hub.fields) {
      for (let y = field.y; y < field.y + field.h; y += 1) {
        ctx.beginPath();
        ctx.moveTo(L.ox + field.x * L.cell, L.oy + y * L.cell + L.cell * 0.72);
        ctx.lineTo(L.ox + (field.x + field.w) * L.cell, L.oy + y * L.cell + L.cell * 0.72);
        ctx.stroke();
      }
    }
  }
}

function drawStructure(ctx: CanvasRenderingContext2D, world: World, s: Structure, L: Layout, view: PlateMotion): void {
  const x = L.ox + s.x * L.cell;
  const y = L.oy + s.y * L.cell;
  const w = s.w * L.cell;
  const h = s.h * L.cell;
  if (s.kind === "tree") {
    ctx.fillStyle = plate.timber;
    ctx.fillRect(x + w * 0.44, y + h * 0.55, w * 0.12, h * 0.4);
    ctx.fillStyle = mix(plate.meadowDeep, plate.ink, view.wear * 0.15);
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.42, L.cell * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = plate.brick;
    for (let i = 0; i < 3; i++) {
      const ax = x + w * (0.35 + (i % 2) * 0.3);
      const ay = y + h * (0.3 + Math.floor(i / 2) * 0.22);
      ctx.beginPath();
      ctx.arc(ax, ay, Math.max(1.5, L.cell * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  if (s.kind === "well") {
    ctx.strokeStyle = plate.stone;
    ctx.lineWidth = Math.max(2, L.cell * 0.16);
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, L.cell * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = plate.lakeDeep;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, L.cell * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = plate.timber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.15);
    ctx.lineTo(x + w * 0.8, y + h * 0.15);
    ctx.moveTo(x + w * 0.5, y + h * 0.15);
    ctx.lineTo(x + w * 0.5, y + h * 0.55);
    ctx.stroke();
    return;
  }
  if (s.kind === "hull") {
    drawHull(ctx, x, y, w, h, view.spin, s.label);
    return;
  }

  const rawWall = s.kind === "mill" ? plate.stone : s.kind === "smith" ? "#3a342e" : s.kind === "barn" ? plate.brick : plate.plaster;
  const wall = view.wear < 0.45 ? mix(rawWall, plate.plaster, (0.45 - view.wear) * 0.2) : mix(rawWall, plate.ink, (view.wear - 0.45) * 0.45);
  const roof = s.kind === "barn" ? plate.roof : s.kind === "smith" ? "#2a241f" : plate.timber;
  const roofH = Math.max(6, h * 0.34);

  ctx.fillStyle = "rgba(28,25,20,0.16)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.52, y + h * 0.92, w * 0.46, Math.max(3, h * 0.08), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = wall;
  ctx.fillRect(x, y + roofH * 0.45, w, h - roofH * 0.45);
  ctx.fillStyle = mix(roof, plate.ink, view.wear * 0.2);
  ctx.beginPath();
  ctx.moveTo(x - 2, y + roofH);
  ctx.lineTo(x + w / 2, y - roofH * 0.15);
  ctx.lineTo(x + w + 2, y + roofH);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(28,25,20,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + roofH * 0.45 + 0.5, w - 1, h - roofH * 0.45 - 1);

  if (h > L.cell * 1.2 && w > L.cell * 1.2) {
    const doorW = Math.min(L.cell * 0.42, w * 0.22);
    const doorH = Math.min(L.cell * 0.7, h * 0.38);
    ctx.fillStyle = plate.timber;
    ctx.fillRect(x + w / 2 - doorW / 2, y + h - doorH, doorW, doorH);
    ctx.fillStyle = plate.brass;
    ctx.fillRect(x + w / 2 + doorW * 0.15, y + h - doorH * 0.55, 2, 2);
    const wins = w > L.cell * 2.4 ? 2 : 1;
    for (let i = 0; i < wins; i++) {
      const wx = x + w * (wins === 1 ? 0.18 : 0.12 + i * 0.62);
      const wy = y + roofH * 0.7;
      const ww = Math.min(L.cell * 0.38, w * 0.16);
      const wh = Math.min(L.cell * 0.32, h * 0.16);
      ctx.fillStyle = view.wear > 0.7 ? "#2a241c" : "#efe2b8";
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = plate.ink;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.beginPath();
      ctx.moveTo(wx + ww / 2, wy);
      ctx.lineTo(wx + ww / 2, wy + wh);
      ctx.moveTo(wx, wy + wh / 2);
      ctx.lineTo(wx + ww, wy + wh / 2);
      ctx.stroke();
    }
  }

  if (s.label && w > L.cell * 1.4) label(ctx, s.label, x + 4, y + roofH + 12);

  if (s.kind === "mill" || s.kind === "smith" || s.kind === "house") {
    const cx = x + w * 0.22;
    const top = y - roofH * 0.05;
    ctx.fillStyle = s.kind === "smith" ? "#2a241f" : plate.stone;
    ctx.fillRect(cx, top - L.cell * 0.35, L.cell * 0.2, L.cell * 0.4);
    if (!view.reduced && (s.kind === "smith" || s.kind === "mill")) chimneySmoke(ctx, cx + L.cell * 0.1, top - L.cell * 0.35, view.spin, s.kind === "smith");
  }

  if (s.kind === "mill") {
    const cx = x + L.cell * 0.15;
    const cy = y + h - L.cell * 0.15;
    const r = L.cell * 0.85;
    const ang = view.reduced ? world.tick * 0.45 : view.spin * 0.85;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = plate.timber;
    ctx.strokeStyle = plate.ink;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(L.cell * 0.08, -L.cell * 0.07, r * 0.9, L.cell * 0.14);
      ctx.strokeRect(L.cell * 0.08, -L.cell * 0.07, r * 0.9, L.cell * 0.14);
    }
    ctx.restore();
    ctx.fillStyle = plate.brass;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2.5, L.cell * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }
  if (s.kind === "smith") {
    const pulse = view.reduced ? 0.7 : 0.4 + Math.abs(Math.sin(view.spin * 3.2)) * 0.6;
    ctx.fillStyle = `rgba(196, 90, 40, ${pulse})`;
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.62, L.cell * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function chimneySmoke(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number, forge: boolean): void {
  ctx.save();
  ctx.fillStyle = forge ? "rgba(196, 90, 40, 0.35)" : "rgba(90, 86, 78, 0.35)";
  for (let i = 0; i < 3; i++) {
    const life = (spin * 0.22 + i * 0.33) % 1;
    ctx.globalAlpha = (1 - life) * (forge ? 0.55 : 0.4);
    ctx.beginPath();
    ctx.arc(x + Math.sin(spin * 1.3 + i) * 3, y - life * 26, 1.6 + life * 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHull(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, spin: number, name: string): void {
  ctx.fillStyle = "rgba(28,25,20,0.12)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.88, w * 0.42, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = plate.timber;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.06, y + h * 0.42);
  ctx.lineTo(x + w * 0.92, y + h * 0.22);
  ctx.lineTo(x + w, y + h * 0.68);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.95, x, y + h * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = plate.ink;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = plate.brass;
  ctx.lineWidth = 2;
  const seam = 0.28 + ((spin * 0.15) % 1) * 0.45;
  ctx.beginPath();
  ctx.moveTo(x + w * seam, y + h * 0.34);
  ctx.lineTo(x + w * seam, y + h * 0.72);
  ctx.stroke();
  if (name) label(ctx, name, x + 6, y + 14);
}

function drawFences(ctx: CanvasRenderingContext2D, world: World, L: Layout): void {
  if (world.hub.blocked.length === 0) return;
  ctx.fillStyle = plate.timber;
  for (const cell of world.hub.blocked) {
    const x = L.ox + (cell.x + 0.42) * L.cell;
    const y = L.oy + cell.y * L.cell;
    ctx.fillRect(x, y + L.cell * 0.15, Math.max(2, L.cell * 0.12), L.cell * 0.75);
  }
  ctx.strokeStyle = plate.timber;
  ctx.lineWidth = 2;
  const rows = new Map<number, number[]>();
  for (const cell of world.hub.blocked) {
    const row = rows.get(cell.y) ?? [];
    row.push(cell.x);
    rows.set(cell.y, row);
  }
  for (const [y, xs] of rows) {
    xs.sort((a, b) => a - b);
    let start = xs[0]!;
    let prev = start;
    const flush = (a: number, b: number) => {
      if (b <= a) return;
      ctx.beginPath();
      ctx.moveTo(L.ox + (a + 0.48) * L.cell, L.oy + (y + 0.38) * L.cell);
      ctx.lineTo(L.ox + (b + 0.48) * L.cell, L.oy + (y + 0.38) * L.cell);
      ctx.stroke();
    };
    for (const x of xs.slice(1)) {
      if (x === prev + 2 || x === prev + 1) prev = x;
      else {
        flush(start, prev);
        start = x;
        prev = x;
      }
    }
    flush(start, prev);
  }
}

function drawEphemeral(ctx: CanvasRenderingContext2D, world: World, L: Layout): void {
  for (const block of world.ephemeral) {
    if (block.cells.length === 0) continue;
    let minX = block.cells[0]!.x;
    let maxX = minX;
    let minY = block.cells[0]!.y;
    let maxY = minY;
    for (const cell of block.cells) {
      minX = Math.min(minX, cell.x);
      maxX = Math.max(maxX, cell.x);
      minY = Math.min(minY, cell.y);
      maxY = Math.max(maxY, cell.y);
    }
    const x = L.ox + minX * L.cell;
    const y = L.oy + minY * L.cell;
    const w = (maxX - minX + 1) * L.cell;
    const h = (maxY - minY + 1) * L.cell;
    if (block.id === "detour" && world.hub.ground === "town") drawWagon(ctx, x, y, w, h);
    else if (block.id === "detour" && world.hub.ground === "farm") drawGate(ctx, x, y, w, h);
    else if (block.id === "detour") drawHull(ctx, x, y, w, Math.max(h, L.cell), 0, "");
    else drawBoards(ctx, x, y, w, h);
  }
}

function drawWagon(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = plate.straw;
  ctx.fillRect(x + w * 0.12, y + h * 0.18, w * 0.76, h * 0.42);
  ctx.fillStyle = plate.timber;
  ctx.fillRect(x + w * 0.08, y + h * 0.48, w * 0.84, h * 0.22);
  ctx.fillStyle = plate.ink;
  ctx.beginPath();
  ctx.arc(x + w * 0.28, y + h * 0.78, Math.min(6, h * 0.18), 0, Math.PI * 2);
  ctx.arc(x + w * 0.72, y + h * 0.78, Math.min(6, h * 0.18), 0, Math.PI * 2);
  ctx.fill();
}

function drawGate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.strokeStyle = plate.timber;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 3, y + 3, Math.max(4, w - 6), Math.max(4, h - 6));
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h * 0.35);
  ctx.lineTo(x + w - 4, y + h * 0.35);
  ctx.moveTo(x + 4, y + h * 0.65);
  ctx.lineTo(x + w - 4, y + h * 0.65);
  ctx.stroke();
}

function drawBoards(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = "rgba(106, 75, 56, 0.2)";
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.strokeStyle = plate.timber;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 6);
  ctx.lineTo(x + w - 6, y + h - 6);
  ctx.moveTo(x + w - 6, y + 6);
  ctx.lineTo(x + 6, y + h - 6);
  ctx.stroke();
}

function drawPath(ctx: CanvasRenderingContext2D, L: Layout, path: Cell[], color: string, alpha: number): void {
  if (path.length === 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, L.cell * 0.08);
  ctx.setLineDash([L.cell * 0.28, L.cell * 0.18]);
  ctx.beginPath();
  ctx.moveTo(L.ox + (path[0]!.x + 0.5) * L.cell, L.oy + (path[0]!.y + 0.5) * L.cell);
  for (const cell of path) ctx.lineTo(L.ox + (cell.x + 0.5) * L.cell, L.oy + (cell.y + 0.5) * L.cell);
  ctx.stroke();
  ctx.restore();
}

const COATS: Record<string, string> = {
  "role.miller": "#4a342c",
  "role.cooper": "#6a4b38",
  "role.printer": "#2c434a",
  "role.smith": "#1c1914",
  "role.clerk": "#5c4630",
  "role.dairy": "#3f4e2e",
  "role.orchard": "#5e7044",
  "role.hay": "#8c3d2f",
  "role.fence": "#6a4b38",
  "role.well": "#3e5c66",
  "role.ferry": "#2c434a",
  "role.net": "#3f4e2e",
  "role.caulker": "#6a4b38",
  "role.fish": "#8c3d2f",
  "role.sailmaker": "#a56b2b",
};

function drawWorker(
  ctx: CanvasRenderingContext2D,
  world: World,
  L: Layout,
  actor: World["actors"][number],
  at: { x: number; y: number },
  selected: boolean,
  activities: Record<string, ActivityDef>,
  view: PlateMotion,
  named: boolean,
): void {
  const def = activities[actor.activityId];
  const pose = def ? samplePose(def, actor.activityTick) : { arm: 0, reach: 0.3, prop: 0, bob: 0, tool: "none" };
  const x = L.ox + (at.x + 0.5) * L.cell;
  const y = L.oy + (at.y + 0.72) * L.cell - pose.bob * L.cell * 0.3;
  const coat = COATS[actor.roleId] ?? (world.hub.ground === "farm" ? plate.meadowDeep : plate.timber);
  if (selected) {
    ctx.save();
    ctx.globalAlpha = view.reduced ? 0.9 : 0.45 + Math.sin(view.spin * 3) * 0.2;
    ctx.strokeStyle = plate.brass;
    ctx.lineWidth = 2;
    ctx.strokeRect(L.ox + at.x * L.cell + 1.5, L.oy + at.y * L.cell + 1.5, L.cell - 3, L.cell - 3);
    ctx.restore();
  }
  ctx.fillStyle = "rgba(28,25,20,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, L.oy + (at.y + 0.86) * L.cell, L.cell * 0.28, L.cell * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  const lean = actor.facing === "e" ? L.cell * 0.06 : actor.facing === "w" ? -L.cell * 0.06 : 0;
  const u = L.cell;
  ctx.fillStyle = coat;
  roundRect(ctx, x - u * 0.22 + lean, y - u * 0.48, u * 0.44, u * 0.5, 3);
  ctx.fillStyle = plate.brass;
  ctx.fillRect(x - u * 0.22 + lean, y - u * 0.48, u * 0.44, 2);
  ctx.fillStyle = plate.paper;
  ctx.beginPath();
  ctx.arc(x + lean, y - u * 0.58, u * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = plate.ink;
  ctx.beginPath();
  ctx.arc(x + lean, y - u * 0.58, u * 0.15, Math.PI * 0.15, Math.PI * 0.85);
  ctx.fill();

  const shoulderX = x + lean + (actor.facing === "w" ? -u * 0.04 : u * 0.04);
  const shoulderY = y - u * 0.28;
  const handX = shoulderX + Math.cos(pose.arm) * u * 0.46 * Math.max(0.25, pose.reach);
  const handY = shoulderY + Math.sin(pose.arm) * u * 0.46 * Math.max(0.25, pose.reach);
  ctx.strokeStyle = plate.paper;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  drawTool(ctx, pose.tool, handX, handY, pose.prop, u * 1.35);

  const speaking = view.speech?.actorId === actor.actorId;
  if (!speaking && (named || u >= 26)) {
    const name = roleTitle(actor.roleId);
    ctx.font = `600 ${Math.max(9, u * 0.28)}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = plate.paper;
    ctx.strokeText(name, x, L.oy + at.y * u + u * 0.18);
    ctx.fillStyle = plate.ink;
    ctx.fillText(name, x, L.oy + at.y * u + u * 0.18);
    ctx.textAlign = "left";
  }
}

function drawVacant(ctx: CanvasRenderingContext2D, L: Layout, cx: number, cy: number, selected: boolean): void {
  const x = L.ox + cx * L.cell;
  const y = L.oy + cy * L.cell;
  if (selected) {
    ctx.strokeStyle = plate.brass;
    ctx.strokeRect(x + 1.5, y + 1.5, L.cell - 3, L.cell - 3);
  }
  ctx.fillStyle = plate.plaster;
  ctx.fillRect(x + L.cell * 0.18, y + L.cell * 0.22, L.cell * 0.64, L.cell * 0.5);
  ctx.strokeStyle = plate.ink;
  ctx.strokeRect(x + L.cell * 0.18, y + L.cell * 0.22, L.cell * 0.64, L.cell * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + L.cell * 0.28, y + L.cell * 0.36);
  ctx.lineTo(x + L.cell * 0.72, y + L.cell * 0.36);
  ctx.moveTo(x + L.cell * 0.28, y + L.cell * 0.5);
  ctx.lineTo(x + L.cell * 0.6, y + L.cell * 0.5);
  ctx.stroke();
  ctx.font = `600 ${Math.max(8, L.cell * 0.22)}px Outfit, sans-serif`;
  ctx.fillStyle = plate.muted;
  ctx.textAlign = "center";
  ctx.fillText("shut", x + L.cell * 0.5, y + L.cell * 0.92);
  ctx.textAlign = "left";
}

function drawEllis(ctx: CanvasRenderingContext2D, L: Layout, view: PlateMotion): void {
  const { x: cx, y: cy, facing, moving } = view.player;
  const bob = !view.reduced && moving ? Math.abs(Math.sin(view.spin * 14)) * L.cell * 0.06 : 0;
  const lean = facing === "e" ? L.cell * 0.05 : facing === "w" ? -L.cell * 0.05 : 0;
  const x = L.ox + (cx + 0.5) * L.cell + lean;
  const y = L.oy + (cy + 0.62) * L.cell - bob;
  ctx.fillStyle = "rgba(28,25,20,0.2)";
  ctx.beginPath();
  ctx.ellipse(x, L.oy + (cy + 0.84) * L.cell, L.cell * 0.22, L.cell * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = plate.ink;
  roundRect(ctx, x - L.cell * 0.16, y - L.cell * 0.36, L.cell * 0.32, L.cell * 0.42, 2);
  ctx.fillStyle = plate.brass;
  ctx.fillRect(x - L.cell * 0.16, y - L.cell * 0.36, L.cell * 0.32, 3);
  ctx.fillStyle = plate.paper;
  ctx.beginPath();
  ctx.arc(x, y - L.cell * 0.44, L.cell * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = plate.ink;
  ctx.beginPath();
  ctx.arc(x, y - L.cell * 0.44, L.cell * 0.11, Math.PI * 0.1, Math.PI * 0.9);
  ctx.fill();
}

function drawMote(ctx: CanvasRenderingContext2D, L: Layout, mote: { x: number; y: number; life: number }): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - mote.life) * 0.45;
  ctx.fillStyle = plate.soil;
  ctx.beginPath();
  ctx.arc(L.ox + mote.x * L.cell, L.oy + mote.y * L.cell, Math.max(1, L.cell * 0.06 * (1 + mote.life)), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpeech(ctx: CanvasRenderingContext2D, L: Layout, cx: number, cy: number, text: string): void {
  const maxW = Math.min(210, L.width * 0.42);
  ctx.font = `500 ${Math.max(12, L.cell * 0.34)}px Fraunces, Palatino, serif`;
  const lines = wrap(ctx, text, maxW - 16).slice(0, 4);
  const lineH = Math.max(14, L.cell * 0.4);
  const boxW = Math.min(maxW, Math.max(...lines.map((line) => ctx.measureText(line).width)) + 16);
  const boxH = lines.length * lineH + 10;
  let x = L.ox + (cx + 0.5) * L.cell - boxW / 2;
  let y = L.oy + cy * L.cell - boxH - 10;
  x = Math.max(8, Math.min(x, L.width - boxW - 8));
  const below = y < L.oy + 4;
  if (below) y = L.oy + (cy + 1) * L.cell + 4;
  ctx.fillStyle = plate.plaster;
  ctx.strokeStyle = plate.brass;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, boxW, boxH, 4);
  ctx.stroke();
  ctx.fillStyle = plate.ink;
  ctx.textAlign = "left";
  lines.forEach((line, i) => ctx.fillText(line, x + 8, y + 8 + (i + 0.8) * lineH));
}

function drawHover(ctx: CanvasRenderingContext2D, world: World, L: Layout, cell: Cell): void {
  const actor = world.actors.find((a) => a.x === cell.x && a.y === cell.y);
  const structure = world.hub.structures.find(
    (s) => cell.x >= s.x && cell.y >= s.y && cell.x < s.x + s.w && cell.y < s.y + s.h && s.label,
  );
  const station = world.hub.stations.find((s) => s.x === cell.x && s.y === cell.y);
  const text = actor ? (actor.mode === "vacant" ? "Shuttered post" : actor.spokenName) : (station?.name ?? structure?.label ?? "");
  if (!text) return;
  ctx.font = "600 11px Outfit, sans-serif";
  const w = ctx.measureText(text).width + 12;
  const x = Math.min(L.ox + (cell.x + 1) * L.cell + 4, L.ox + world.w * L.cell - w - 2);
  const y = L.oy + cell.y * L.cell - 16;
  ctx.fillStyle = plate.ink;
  roundRect(ctx, x, Math.max(L.oy, y), w, 16, 2);
  ctx.fillStyle = plate.paper;
  ctx.fillText(text, x + 6, Math.max(L.oy, y) + 12);
}

function drawTool(ctx: CanvasRenderingContext2D, tool: string, x: number, y: number, prop: number, cell: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = plate.ink;
  ctx.fillStyle = plate.brass;
  ctx.lineWidth = 1.5;
  const s = cell * 0.22;
  switch (tool) {
    case "pick":
    case "maul":
    case "iron":
      ctx.rotate(-0.6 + prop);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s, -s);
      ctx.stroke();
      ctx.fillRect(s - 2, -s - 3, 6, 5);
      break;
    case "staff":
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.4);
      ctx.lineTo(0, s * 0.8);
      ctx.stroke();
      break;
    case "hoop":
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.7 + prop * 0.25), 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "stave":
    case "stick":
      ctx.fillStyle = plate.timber;
      ctx.fillRect(-2, -s, 4, s * 1.6);
      break;
    case "bellows":
      ctx.fillStyle = plate.timber;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s, -s * prop);
      ctx.lineTo(s, s * prop);
      ctx.closePath();
      ctx.fill();
      break;
    case "sack":
    case "cloth":
      ctx.fillStyle = plate.straw;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.55, s * (0.4 + prop * 0.3), 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "dasher":
      ctx.strokeStyle = plate.timber;
      ctx.beginPath();
      ctx.moveTo(0, -s * (0.2 + prop));
      ctx.lineTo(0, s);
      ctx.stroke();
      ctx.strokeRect(-s * 0.45, s * 0.2, s * 0.9, s * 0.7);
      break;
    case "apple":
      ctx.fillStyle = plate.brick;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "fork":
      ctx.rotate(-0.8 + prop * 1.2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s, 0);
      ctx.moveTo(s, -3);
      ctx.lineTo(s, 3);
      ctx.stroke();
      break;
    case "bucket":
    case "ice":
      ctx.strokeStyle = plate.ink;
      ctx.strokeRect(-s * 0.35, -s * (0.2 + prop * 0.4), s * 0.7, s * 0.7);
      break;
    case "needle":
    case "palm":
      ctx.beginPath();
      ctx.arc(prop * s, 0, s * 0.28, 0, Math.PI * 1.6);
      ctx.stroke();
      break;
    case "line":
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.45, prop * Math.PI * 2, prop * Math.PI * 2 + 2.4);
      ctx.stroke();
      break;
    default:
      break;
  }
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.save();
  ctx.font = "600 10px Outfit, sans-serif";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(243, 234, 215, 0.85)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = plate.ink;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(trial).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = trial;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
}

function mix(hex: string, toward: string, t: number): string {
  const a = rgb(hex);
  const b = rgb(toward);
  const u = Math.max(0, Math.min(1, t));
  const ch = (i: number) => Math.round(a[i]! + (b[i]! - a[i]!) * u);
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
}

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
