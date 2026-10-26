import { lootId } from "../src/ids.ts";
import type { Facts, Session } from "../src/types.ts";

export type SceneId = "counter" | "coat" | "crate" | "charm" | "net" | "gates";

export interface PaintInput {
  scene: SceneId;
  facts: Facts | null;
  session: Session;
  t: number;
  counterMs: number;
  windowMs: number | null;
  seam: "square" | "slanted";
}

const W = 640;
const H = 320;

export function paint(canvas: HTMLCanvasElement, input: PaintInput): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const cssW = rect.width || W;
  const cssH = rect.height || H;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.scale(cssW / W, cssH / H);
  ctx.clearRect(0, 0, W, H);
  if (input.scene === "charm") board(ctx, input);
  else {
    meadow(ctx);
    if (input.scene === "counter") counter(ctx, input);
    if (input.scene === "coat") coat(ctx, input);
    if (input.scene === "crate") crate(ctx, input);
    if (input.scene === "net") net(ctx, input);
    if (input.scene === "gates") gates(ctx, input);
  }
}

function meadow(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#f7f3ea");
  sky.addColorStop(0.48, "#e7e1d4");
  sky.addColorStop(1, "#cfc6b6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#1e5f5a";
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.moveTo(0, 132);
  for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 108 + ((x * 13) % 22));
  ctx.lineTo(W, 168);
  ctx.lineTo(0, 168);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#d9d0c0";
  ctx.fillRect(0, 176, W, 78);
  ctx.strokeStyle = "#c4b8a6";
  ctx.lineWidth = 1;
  for (let x = 18; x < W; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 176);
    ctx.lineTo(x + 8, 254);
    ctx.stroke();
  }

  ctx.fillStyle = "#1e5f5a";
  ctx.fillRect(0, 252, W, 68);
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = "#f4f0e6";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 268 + i * 9);
    ctx.bezierCurveTo(180, 260 + i * 8, 400, 276 + i * 6, W, 266 + i * 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function ellis(ctx: CanvasRenderingContext2D, x: number, y: number, session: Session, lean = 0): void {
  ctx.save();
  ctx.translate(x + lean, y);
  ctx.fillStyle = "rgba(28,25,21,0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 18, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!session.alive) ctx.globalAlpha = 0.4;
  const cloak = session.slots.cloak;
  if (cloak && !session.suppressed.includes(cloak)) {
    ctx.fillStyle = "#9c341f";
    ctx.beginPath();
    ctx.moveTo(-16, -30);
    ctx.quadraticCurveTo(-22, 0, -12, 10);
    ctx.lineTo(12, 10);
    ctx.quadraticCurveTo(20, -6, 14, -30);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "#1c1915";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(-7, 10);
  ctx.moveTo(4, -4);
  ctx.lineTo(7, 10);
  ctx.stroke();
  ctx.fillStyle = "#1c1915";
  ctx.beginPath();
  ctx.roundRect(-8, -30, 16, 24, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -38, 7.5, 0, Math.PI * 2);
  ctx.fill();
  const main = session.slots.mainHand;
  const slung = session.slots.utility === lootId(111) && !!main;
  if (main && !session.suppressed.includes(main) && !slung) {
    ctx.strokeStyle = "#9c341f";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(9, -22);
    ctx.lineTo(28, -40);
    ctx.moveTo(16, -28);
    ctx.lineTo(22, -24);
    ctx.stroke();
  }
  ctx.restore();
}

function caption(ctx: CanvasRenderingContext2D, text: string): void {
  ctx.fillStyle = "#1c1915";
  ctx.font = "600 13px Outfit, sans-serif";
  ctx.fillText(text, 20, 28);
}

function counter(ctx: CanvasRenderingContext2D, input: PaintInput): void {
  const converted = input.facts?.counterConverted === true;
  const length = typeof input.facts?.faultLength === "number" ? input.facts.faultLength : 0;
  const windowMs = input.windowMs ?? 80;
  caption(ctx, converted ? "Stone answers" : input.facts ? "The window closed" : "Hold the timing");

  const trackY = 58;
  ctx.strokeStyle = "#c4b8a6";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(24, trackY);
  ctx.lineTo(360, trackY);
  ctx.stroke();
  ctx.strokeStyle = "#1e5f5a";
  ctx.beginPath();
  ctx.moveTo(24, trackY);
  ctx.lineTo(24 + Math.min(336, (windowMs / 180) * 336), trackY);
  ctx.stroke();
  const mark = 24 + Math.min(336, (input.counterMs / 180) * 336);
  ctx.fillStyle = input.counterMs <= windowMs ? "#1e5f5a" : "#9c341f";
  ctx.beginPath();
  ctx.arc(mark, trackY, 7, 0, Math.PI * 2);
  ctx.fill();

  ellis(ctx, 170, 210, input.session, input.facts ? -4 * input.t : 0);
  foe(ctx, 480, 210);

  if (converted && length > 0) {
    const reach = 36 + length * 42 * input.t;
    ctx.strokeStyle = "#9c341f";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(250, 228);
    ctx.lineTo(250 + reach, 222);
    ctx.lineTo(250 + reach + 14, 236);
    ctx.stroke();
  } else if (input.facts) {
    ctx.globalAlpha = 1 - input.t * 0.85;
    ctx.fillStyle = "#9c341f";
    ctx.fillRect(260, 224, 22, 3);
    ctx.globalAlpha = 1;
  }
}

function foe(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(28,25,21,0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6b645a";
  ctx.fillRect(-7, -28, 14, 22);
  ctx.beginPath();
  ctx.arc(0, -36, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function coat(ctx: CanvasRenderingContext2D, input: PaintInput): void {
  const stored = input.session.storedProjectile?.tag;
  caption(ctx, stored ? `Holding ${stored}` : "The coat is empty");
  ctx.strokeStyle = "#1c1915";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(250, 70);
  ctx.lineTo(390, 70);
  ctx.stroke();
  ctx.fillStyle = "#9c341f";
  ctx.beginPath();
  ctx.moveTo(300, 70);
  ctx.lineTo(268, 150);
  ctx.quadraticCurveTo(320, 176, 372, 150);
  ctx.lineTo(340, 70);
  ctx.fill();
  ctx.fillStyle = "#1c1915";
  const released = input.facts?.released === true;
  if (stored && !released) {
    ctx.beginPath();
    ctx.arc(320, 124, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (released) {
    ctx.beginPath();
    ctx.arc(320 + 140 * input.t, 124 - 20 * input.t, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(520 - 180 * (1 - input.t), 96, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ellis(ctx, 210, 214, input.session);
}

function crate(ctx: CanvasRenderingContext2D, input: PaintInput): void {
  const response = String(input.facts?.crateResponse ?? "rest");
  const slide = typeof input.facts?.slideUnits === "number" ? input.facts.slideUnits : 0;
  caption(ctx, response === "rest" ? "A crate on the path" : response === "grain" ? "It takes the grain" : response === "stop" ? "The knot holds" : "It tumbles");
  ellis(ctx, 150, 214, input.session, input.facts ? 6 * input.t : 0);
  ctx.save();
  if (response === "tumble") {
    ctx.translate(300 + 36 * input.t, 196);
    ctx.rotate(input.t * 0.9);
  } else if (response === "grain") {
    ctx.translate(280 + slide * 36 * input.t, 196);
  } else {
    ctx.translate(280, 196);
  }
  ctx.fillStyle = "#c4b59a";
  ctx.strokeStyle = "#1c1915";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-26, -26, 52, 52, 3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-26, -8);
  ctx.lineTo(26, -8);
  ctx.moveTo(-26, 10);
  ctx.lineTo(26, 10);
  ctx.stroke();
  ctx.restore();
}

function board(ctx: CanvasRenderingContext2D, input: PaintInput): void {
  ctx.fillStyle = "#e7e1d4";
  ctx.fillRect(0, 0, W, H);
  caption(ctx, input.session.safeMark ? `Mark ${input.session.safeMark.x}, ${input.session.safeMark.y}` : "No mark yet");
  const originX = 24;
  const originY = 44;
  const cellW = 74;
  const cellH = 42;
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 8; x++) {
      const px = originX + x * cellW;
      const py = originY + y * cellH;
      const here = input.session.x === x && input.session.y === y;
      const flagged = input.session.flagX === x && input.session.flagY === y;
      const marked = input.session.safeMark?.x === x && input.session.safeMark?.y === y;
      ctx.fillStyle = (x + y) % 2 === 0 ? "#f4f0e6" : "#ddd4c4";
      ctx.fillRect(px, py, cellW - 6, cellH - 6);
      if (flagged) {
        ctx.fillStyle = "#1e5f5a";
        ctx.fillRect(px + 6, py + 8, 5, 16);
      }
      if (marked) {
        ctx.strokeStyle = input.session.safeMark?.frozen ? "#9c341f" : "#1c1915";
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 8, py + 6, cellW - 22, cellH - 18);
      }
      if (here) pawn(ctx, px + 34, py + 18);
    }
  }
}

function pawn(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#1c1915";
  ctx.beginPath();
  ctx.arc(x, y - 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 3, y - 4, 6, 10);
}

function net(ctx: CanvasRenderingContext2D, input: PaintInput): void {
  const caught = String(input.facts?.caughtTags ?? "")
    .split(",")
    .filter(Boolean);
  const cast = input.facts != null;
  caption(ctx, cast ? (caught.length ? `Kept ${caught.join(", ")}` : "Nothing held") : "The creek is open");
  ctx.strokeStyle = "#f4f0e6";
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(250, 150, 78, Math.PI * 1.05, Math.PI * 1.95);
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(180 + i * 18, 168);
    ctx.quadraticCurveTo(230, 120 + i * 6, 340, 168 - i);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  const tags = ["bolt", "barbed", "glass", "debris", "mote", "spark"];
  tags.forEach((tag, i) => {
    const held = caught.includes(tag);
    const x = 390;
    const y = 78 + i * 28;
    const drop = held ? 0 : cast ? 18 * input.t : 0;
    ctx.fillStyle = held ? "#1e5f5a" : "#9c341f";
    ctx.beginPath();
    ctx.arc(x, y + drop, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1915";
    ctx.font = "13px Outfit, sans-serif";
    ctx.fillText(held ? `${tag} kept` : `${tag} through`, x + 16, y + 4);
  });
  ellis(ctx, 150, 214, input.session);
}

function gates(ctx: CanvasRenderingContext2D, input: PaintInput): void {
  const lit = input.facts?.darknessRevealed === true || (input.facts == null && input.session.tools["tool.lantern.body"] && input.session.lanternLocation !== "absent");
  const seam = input.facts?.seamOpen === true;
  const chosenSlant = input.seam === "slanted";
  caption(ctx, input.facts?.doorReason ? "The lock does not care" : "Door, dark, seam");

  ctx.fillStyle = "#1c1915";
  ctx.fillRect(36, 58, 168, 176);
  ctx.fillStyle = "#9c341f";
  ctx.fillRect(78, 108, 78, 126);
  ctx.fillStyle = "#f4f0e6";
  ctx.beginPath();
  ctx.arc(138, 176, 4, 0, Math.PI * 2);
  ctx.fill();
  if (input.facts?.keybell === "missing") {
    ctx.strokeStyle = "#f4f0e6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(58, 86 + Math.sin(input.t * 6) * 3, 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = lit ? "#f4f0e6" : "#2a2622";
  ctx.fillRect(230, 58, 176, 176);
  if (lit) {
    ctx.fillStyle = "rgba(156,52,31,0.18)";
    ctx.beginPath();
    ctx.arc(318, 150, 48 + 10 * input.t, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = lit ? "#1c1915" : "#f4f0e6";
  ctx.font = "13px Outfit, sans-serif";
  ctx.fillText(lit ? String(input.facts?.revealMode ?? input.session.lanternLocation) : "unlit", 286, 154);
  if (input.session.lanternLocation === "staked" || input.facts?.stake === "planted") {
    ctx.strokeStyle = lit ? "#9c341f" : "#6b645a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(318, 168);
    ctx.lineTo(318, 214);
    ctx.stroke();
  }

  ctx.strokeStyle = "#1c1915";
  ctx.lineWidth = 10;
  ctx.lineCap = "butt";
  ctx.beginPath();
  if (chosenSlant) {
    ctx.moveTo(470, 80);
    ctx.lineTo(560, 220);
  } else {
    ctx.moveTo(500, 70);
    ctx.lineTo(500, 230);
  }
  ctx.stroke();
  if (seam) {
    ctx.strokeStyle = "#1e5f5a";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}
