import { TILE, type Course } from "./types.ts";
import { cellAt, gateClosed } from "./world.ts";
import type { Sim } from "./physics.ts";
import type { GhostView } from "./session.ts";

export const INK = "#16130f";
export const PAPER = "#f3ecdf";
export const SUGAR = "#e39b3a";
export const CREEK = "#2a6e6a";
export const VEIL = "#3c2c44";

/** Fixed stage so a short course still fills the frame. Tiles stay honest. */
const VIEW_X = 18;
const VIEW_Y = 12;

export type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  /** Bell sparks use creek. Land sparks use sugar. */
  bell: boolean;
};

export function viewPixels(): { w: number; h: number } {
  return { w: VIEW_X * TILE, h: VIEW_Y * TILE };
}

function camera(course: Course, sim: Sim): { x: number; y: number; w: number; h: number } {
  const view = viewPixels();
  const worldW = course.width * TILE;
  const worldH = course.height * TILE;
  const look = sim.facing * TILE * 3;
  const fx = sim.body.x + sim.body.w / 2 + look - view.w / 2;
  const fy = sim.body.y + sim.body.h / 2 - view.h / 2;
  const x = worldW <= view.w ? (worldW - view.w) / 2 : Math.max(0, Math.min(worldW - view.w, fx));
  const y = worldH <= view.h ? (worldH - view.h) / 2 : Math.max(0, Math.min(worldH - view.h, fy));
  return { x: Math.round(x), y: Math.round(y), w: view.w, h: view.h };
}

function fillCell(
  ctx: CanvasRenderingContext2D,
  course: Course,
  tx: number,
  ty: number,
  closed: boolean,
  contrast: boolean,
  nextCheck: number,
) {
  const cell = cellAt(course, tx, ty);
  const x = tx * TILE;
  const y = ty * TILE;
  const s = TILE;
  if (cell === "air" || cell === "start") return;
  if (cell === "solid" || (cell === "gate" && closed) || cell === "socket") {
    ctx.fillStyle = INK;
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 1, y + 1, 3, 2);
    if (cell === "socket") {
      ctx.fillStyle = SUGAR;
      ctx.fillRect(x + 5, y + 5, 6, 6);
    }
    return;
  }
  if (cell === "oneway") {
    ctx.fillStyle = INK;
    ctx.fillRect(x, y, s, 4);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 2, y + 1, s - 4, 1);
    return;
  }
  if (cell === "spike") {
    ctx.fillStyle = contrast ? INK : SUGAR;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + s);
    ctx.lineTo(x + s / 2, y + 2);
    ctx.lineTo(x + s - 1, y + s);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillRect(x + s / 2 - 1, y + 8, 2, 4);
    return;
  }
  if (cell === "water") {
    ctx.fillStyle = CREEK;
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x, y + 3, s, 2);
    const flow = course.current[ty * course.width + tx];
    if (flow && (flow.x !== 0 || flow.y !== 0)) {
      ctx.fillStyle = PAPER;
      const ox = 8 + flow.x * 3;
      const oy = 8 + flow.y * 3;
      ctx.fillRect(x + ox - 2, y + oy - 1, 4, 3);
    }
    return;
  }
  if (cell === "void") {
    ctx.fillStyle = VEIL;
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = INK;
    ctx.fillRect(x + 3, y + 7, 2, 2);
    ctx.fillRect(x + 10, y + 4, 2, 2);
    return;
  }
  if (cell === "veil") {
    ctx.fillStyle = contrast ? INK : VEIL;
    ctx.fillRect(x, y + 9, s, 7);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 2, y + 11, 3, 2);
    ctx.fillRect(x + 8, y + 12, 5, 2);
    return;
  }
  if (cell === "anchor") {
    ctx.fillStyle = SUGAR;
    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillRect(x + 7, y + 7, 2, 2);
    return;
  }
  if (cell === "membrane") {
    ctx.fillStyle = VEIL;
    ctx.fillRect(x + 2, y, 3, s);
    ctx.fillRect(x + 11, y, 3, s);
    return;
  }
  if (cell === "check") {
    const id = course.checkAt[ty * course.width + tx];
    const got = id != null && course.checks.indexOf(id) < nextCheck;
    ctx.fillStyle = INK;
    ctx.fillRect(x + 7, y + 11, 2, 4);
    ctx.fillStyle = got ? PAPER : CREEK;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 2);
    ctx.lineTo(x + 13, y + 8);
    ctx.lineTo(x + 8, y + 12);
    ctx.lineTo(x + 3, y + 8);
    ctx.fill();
    if (got) {
      ctx.strokeStyle = CREEK;
      ctx.stroke();
    }
    return;
  }
  if (cell === "finish") {
    ctx.fillStyle = INK;
    ctx.fillRect(x + 3, y + 2, 2, 13);
    ctx.fillStyle = SUGAR;
    ctx.fillRect(x + 5, y + 2, 8, 6);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 5, y + 5, 4, 3);
    return;
  }
  if (cell === "stamp") {
    ctx.strokeStyle = SUGAR;
    ctx.strokeRect(x + 4, y + 4, 8, 8);
    return;
  }
  if (cell === "gate" && !closed) {
    ctx.strokeStyle = INK;
    ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
  }
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  course: Course,
  sim: Sim,
  ghost: GhostView | null,
  ghostFrame: number,
  contrast: boolean,
  nextCheck: number,
  sparks: Spark[],
) {
  const cam = camera(course, sim);
  const scale = ctx.canvas.width / cam.w;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = VEIL;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.translate(-cam.x, -cam.y);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, course.width * TILE, course.height * TILE);

  const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
  const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
  const x1 = Math.min(course.width - 1, Math.ceil((cam.x + cam.w) / TILE) + 1);
  const y1 = Math.min(course.height - 1, Math.ceil((cam.y + cam.h) / TILE) + 1);
  const closed = gateClosed(sim.time);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      fillCell(ctx, course, tx, ty, closed, contrast, nextCheck);
    }
  }

  if (ghost && ghost.frames.length > 1) {
    ctx.beginPath();
    const step = 3;
    const first = ghost.frames[0];
    if (first) ctx.moveTo(first.x + sim.body.w / 2, first.y + sim.body.h / 2);
    for (let i = step; i < ghost.frames.length; i += step) {
      const p = ghost.frames[i];
      if (p) ctx.lineTo(p.x + sim.body.w / 2, p.y + sim.body.h / 2);
    }
    ctx.strokeStyle = contrast ? INK : CREEK;
    ctx.globalAlpha = contrast ? 0.9 : 0.55;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (sim.rod && sim.rod.life > 0) {
    ctx.fillStyle = INK;
    ctx.fillRect(sim.rod.tx * TILE, sim.rod.ty * TILE, TILE, TILE);
    ctx.fillStyle = SUGAR;
    ctx.fillRect(sim.rod.tx * TILE + 2, sim.rod.ty * TILE + 2, TILE - 4, 3);
  }

  if (ghost && ghost.frames.length > 0) {
    const i = Math.max(0, Math.min(ghost.frames.length - 1, ghostFrame));
    for (const back of [12, 8, 4]) {
      const p = ghost.frames[Math.max(0, i - back)];
      if (!p) continue;
      ctx.globalAlpha = back === 12 ? 0.15 : back === 8 ? 0.25 : 0.4;
      ctx.fillStyle = CREEK;
      ctx.fillRect(p.x, p.y, sim.body.w, sim.body.h);
    }
    const g = ghost.frames[i];
    if (g) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = PAPER;
      ctx.fillRect(g.x, g.y, sim.body.w, sim.body.h);
      ctx.strokeStyle = CREEK;
      ctx.lineWidth = 2;
      ctx.strokeRect(g.x + 0.5, g.y + 0.5, sim.body.w - 1, sim.body.h - 1);
    }
    ctx.globalAlpha = 1;
  }

  if (sim.sugar) {
    const x1s = sim.body.x + sim.body.w / 2;
    const y1s = sim.body.y + 5;
    ctx.strokeStyle = SUGAR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1s, y1s);
    ctx.lineTo(sim.sugar.x, sim.sugar.y);
    ctx.stroke();
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (const spark of sparks) {
    ctx.globalAlpha = Math.max(0.2, spark.life / 14);
    ctx.fillStyle = spark.bell ? CREEK : SUGAR;
    ctx.fillRect(spark.x, spark.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  const body = sim.body;
  if (sim.capeOpen) {
    ctx.fillStyle = VEIL;
    ctx.beginPath();
    ctx.moveTo(body.x + body.w / 2, body.y + 4);
    ctx.lineTo(body.x - 6, body.y + body.h);
    ctx.lineTo(body.x + body.w + 6, body.y + body.h);
    ctx.fill();
  }
  const blink = sim.invuln > 0 && Math.floor(sim.time * 18) % 2 === 0;
  ctx.fillStyle = blink ? PAPER : SUGAR;
  ctx.fillRect(body.x, body.y, body.w, body.h);
  ctx.fillStyle = INK;
  ctx.fillRect(body.x, body.y, body.w, 3);
  ctx.fillRect(body.x, body.y + body.h - 3, body.w, 3);
  const eye = sim.facing < 0 ? body.x + 2 : body.x + body.w - 4;
  ctx.fillRect(eye, body.y + 6, 2, 2);
  if (sim.grounded) {
    ctx.fillRect(body.x + 1, body.y + body.h, body.w - 2, 1);
  }

  if (course.kit.voidStep) {
    const max = 2.15 * sim.access.voidMeterScale;
    const width = 48 * (sim.voidMeter / max);
    ctx.fillStyle = INK;
    ctx.fillRect(cam.x + 8, cam.y + 8, 52, 8);
    ctx.fillStyle = CREEK;
    ctx.fillRect(cam.x + 10, cam.y + 10, Math.max(0, width), 4);
  }
}
