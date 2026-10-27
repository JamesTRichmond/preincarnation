import type { Dir, State } from "../types.ts";
import { ENTITIES, MAPS, tileAt } from "../world.ts";

export interface Camera {
  x: number;
  y: number;
  ready: boolean;
}

export interface Pose {
  x: number;
  y: number;
}

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function shade(hex: string, n: number): string {
  const v = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((v >> 16) & 255) + n));
  const g = Math.max(0, Math.min(255, ((v >> 8) & 255) + n));
  const b = Math.max(0, Math.min(255, (v & 255) + n));
  return `rgb(${r} ${g} ${b})`;
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function viewScale(state: State, w: number, h: number): number {
  const rows = MAPS[state.map].rows;
  const cols = rows[0].length;
  const rowsN = rows.length;
  const phone = w < 700;
  const close = state.map === "house" || state.map === "inn" || state.map === "yard" || state.map === "shore";
  if (close) {
    const across = phone ? 6.4 : Math.min(cols, 10);
    const down = phone ? 8 : Math.min(rowsN, 8.2);
    const s = Math.min(w / across, (h - 96) / down);
    return Math.max(phone ? 46 : 64, Math.min(phone ? 64 : 86, Math.floor(s)));
  }
  const fit = Math.min(w / cols, Math.max(200, h - 100) / rowsN);
  return Math.max(phone ? 30 : 36, Math.min(phone ? 44 : 50, Math.floor(fit)));
}

function axisX(focus: number, view: number, map: number): number {
  if (map <= view) return (map - view) / 2;
  return clamp(focus - view / 2, 0, map - view);
}

function axisY(focus: number, view: number, map: number, bias: number): number {
  if (map <= view) {
    const spare = view - map;
    const reserve = Math.min(spare, bias > 0 ? Math.min(170, spare * 0.55) : Math.min(28, spare * 0.2));
    return map - view + reserve;
  }
  return clamp(focus - view / 2 + bias, 0, map - view);
}

export function tickCamera(
  cam: Camera,
  state: State,
  w: number,
  h: number,
  dt: number,
  reduce: boolean,
  biasY = 0,
  focus?: Pose,
): void {
  const rows = MAPS[state.map].rows;
  const s = viewScale(state, w, h);
  const mapW = rows[0].length * s;
  const mapH = rows.length * s;
  const fx = focus?.x ?? state.x;
  const fy = focus?.y ?? state.y;
  const wantX = axisX(fx * s + s / 2, w, mapW);
  const wantY = axisY(fy * s + s / 2, h, mapH, biasY);
  const jump = Math.abs(wantX - cam.x) > w || Math.abs(wantY - cam.y) > h;
  if (!cam.ready || reduce || jump) {
    cam.x = wantX;
    cam.y = wantY;
    cam.ready = true;
    return;
  }
  const k = 1 - Math.exp(-8 * dt);
  cam.x += (wantX - cam.x) * k;
  cam.y += (wantY - cam.y) * k;
}

function edge(x: number, y: number, w: number, h: number): boolean {
  return x === 0 || y === 0 || x === w - 1 || y === h - 1;
}

function groundOf(state: State): string {
  if (state.map === "shore") return "#d5d0c6";
  if (state.map === "house" || state.map === "inn") return "#140f0c";
  if (state.map === "yard") return "#121612";
  if (state.map === "vein") return "#0e0d0c";
  return state.era === "altered" ? "#141816" : "#10140f";
}

function paintSky(ctx: CanvasRenderingContext2D, state: State, w: number, h: number): void {
  const altered = state.era === "altered";
  const g = ctx.createLinearGradient(0, 0, 0, h);
  if (state.map === "shore") {
    g.addColorStop(0, "#efeae0");
    g.addColorStop(1, "#c9c2b4");
  } else if (state.map === "vein") {
    g.addColorStop(0, "#161412");
    g.addColorStop(1, "#0c0b0a");
  } else if (state.map === "house" || state.map === "inn") {
    g.addColorStop(0, "#1a1410");
    g.addColorStop(1, "#100c0a");
  } else {
    g.addColorStop(0, altered ? "#24302c" : "#1c2a22");
    g.addColorStop(0.35, altered ? "#1a221e" : "#152018");
    g.addColorStop(1, groundOf(state));
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function paintTile(
  ctx: CanvasRenderingContext2D,
  state: State,
  t: string,
  x: number,
  y: number,
  sx: number,
  sy: number,
  S: number,
  time: number,
  reduce: boolean,
  mw: number,
  mh: number,
): void {
  const altered = state.era === "altered";
  const n = Math.floor((hash(x, y) - 0.5) * 18);
  const outdoor = state.map === "road" || state.map === "lane" || state.map === "river";

  if (t === "#" && edge(x, y, mw, mh) && state.map !== "vein") {
    ctx.fillStyle = shade(altered ? "#2a3330" : "#1a2820", n);
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    ctx.fillStyle = shade(altered ? "#3e4a44" : "#24382c", n);
    ctx.beginPath();
    ctx.arc(sx + S * 0.5, sy + S * 0.7, S * 0.46, Math.PI, 0);
    ctx.fill();
    return;
  }

  if (t === "#") {
    if (state.map === "vein") {
      ctx.fillStyle = shade(altered ? "#ddd4c6" : "#e6ddd0", n);
      ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
      ctx.strokeStyle = "rgba(80,70,60,0.18)";
      ctx.beginPath();
      ctx.moveTo(sx + 2, sy + S * hash(x, y));
      ctx.lineTo(sx + S - 2, sy + S * hash(y, x));
      ctx.stroke();
      return;
    }
    if (state.map === "lane") {
      ctx.fillStyle = shade(altered ? "#6e675c" : "#6a5344", n);
      ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
      ctx.strokeStyle = "rgba(30,18,10,0.28)";
      ctx.beginPath();
      ctx.moveTo(sx, sy + S * 0.33);
      ctx.lineTo(sx + S, sy + S * 0.33);
      ctx.moveTo(sx, sy + S * 0.66);
      ctx.lineTo(sx + S, sy + S * 0.66);
      ctx.stroke();
      if (hash(x, y) > 0.62 && y > 2 && y < 5) {
        ctx.fillStyle = altered ? "rgba(210,200,180,0.35)" : "rgba(226,164,92,0.75)";
        ctx.fillRect(sx + S * 0.32, sy + S * 0.38, S * 0.28, S * 0.24);
      }
      return;
    }
    ctx.fillStyle = shade(state.map === "yard" ? "#3a463c" : "#2a1e18", n);
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    if (state.map === "house" || state.map === "inn") {
      ctx.fillStyle = shade("#5c4334", n);
      if (x === 0) ctx.fillRect(sx + S - 8, sy, 8, S);
      else if (x === mw - 1) ctx.fillRect(sx, sy, 8, S);
      if (y === 0) ctx.fillRect(sx, sy + S - 8, S, 8);
      else if (y === mh - 1) ctx.fillRect(sx, sy, S, 8);
    }
    return;
  }

  if (t === "," || (t === "." && outdoor)) {
    const base = t === "." ? (altered ? "#6a6256" : "#5c4a38") : altered ? "#4a564e" : "#3a5244";
    ctx.fillStyle = shade(base, n);
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    ctx.fillStyle = altered ? "rgba(180,176,160,0.28)" : "rgba(127,154,132,0.45)";
    for (let i = 0; i < 3; i++) {
      const tx = sx + hash(x + i, y) * (S - 4);
      const ty = sy + hash(y, x + i) * (S - 8);
      ctx.fillRect(tx, ty, 2, 6);
    }
    return;
  }

  if (t === "+") {
    ctx.fillStyle = shade(altered ? "#9a9082" : "#7a6248", n);
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    ctx.fillStyle = "rgba(40,28,16,0.28)";
    ctx.fillRect(sx, sy + S * 0.22, S, S * 0.08);
    ctx.fillRect(sx, sy + S * 0.66, S, S * 0.07);
    ctx.fillStyle = altered ? "rgba(230,220,200,0.18)" : "rgba(90,60,30,0.18)";
    ctx.fillRect(sx, sy, S, 3);
    ctx.fillRect(sx, sy + S - 3, S, 3);
    return;
  }

  if (t === "t") {
    ctx.fillStyle = shade(altered ? "#3e4a42" : "#2a4034", n);
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    return;
  }

  if (t === "b") {
    ctx.fillStyle = shade(altered ? "#4a4038" : "#3a5244", n);
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    ctx.strokeStyle = "#8a4030";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx + 6, sy + S - 8);
    ctx.lineTo(sx + S * 0.45, sy + 8);
    ctx.moveTo(sx + S - 8, sy + S - 6);
    ctx.lineTo(sx + S * 0.4, sy + 12);
    ctx.moveTo(sx + 10, sy + 10);
    ctx.lineTo(sx + S - 8, sy + S * 0.55);
    ctx.stroke();
    ctx.lineWidth = 1;
    return;
  }

  if (t === "~" || t === ":") {
    const pale = state.map === "shore";
    ctx.fillStyle = shade(pale ? (t === "~" ? "#f4f0e8" : "#e4ddd0") : t === "~" ? "#16343a" : "#6e8c86", n);
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    const wave = reduce ? 0 : Math.sin(time * 1.6 + x * 0.7 + y) * 2;
    ctx.strokeStyle = pale ? "rgba(255,255,255,0.55)" : "rgba(190,220,214,0.28)";
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy + S * 0.42 + wave);
    ctx.quadraticCurveTo(sx + S * 0.5, sy + S * 0.32 + wave, sx + S - 4, sy + S * 0.46 + wave);
    ctx.stroke();
    return;
  }

  if (t === "x") {
    ctx.fillStyle = "#0c0e10";
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    ctx.strokeStyle = "rgba(226,164,92,0.25)";
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + 8);
    ctx.lineTo(sx + S - 8, sy + S - 8);
    ctx.moveTo(sx + S - 8, sy + 8);
    ctx.lineTo(sx + 8, sy + S - 8);
    ctx.stroke();
    return;
  }

  if (t === ".") {
    if (state.map === "vein") {
      ctx.fillStyle = shade("#d4cbbd", n);
      ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
      ctx.strokeStyle = "rgba(120,100,80,0.12)";
      ctx.beginPath();
      ctx.moveTo(sx, sy + S * 0.7);
      ctx.lineTo(sx + S, sy + S * 0.4);
      ctx.stroke();
      return;
    }
    const floor = state.map === "yard" ? "#4a4638" : state.map === "inn" ? "#5c4636" : "#6a5040";
    ctx.fillStyle = shade(floor, n);
    ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
    if (state.map === "house" || state.map === "inn") {
      ctx.strokeStyle = "rgba(30,18,10,0.22)";
      ctx.beginPath();
      ctx.moveTo(sx, sy + S * 0.5);
      ctx.lineTo(sx + S, sy + S * 0.5);
      ctx.stroke();
    }
    return;
  }

  ctx.fillStyle = shade(altered ? "#4a564e" : "#3a5244", n);
  ctx.fillRect(sx, sy, S + 0.5, S + 0.5);
}

function paintRoof(ctx: CanvasRenderingContext2D, sx: number, sy: number, S: number, altered: boolean): void {
  ctx.fillStyle = altered ? "#3a342e" : "#2c2118";
  ctx.beginPath();
  ctx.moveTo(sx - 2, sy + S * 0.22);
  ctx.lineTo(sx + S / 2, sy - S * 0.42);
  ctx.lineTo(sx + S + 2, sy + S * 0.22);
  ctx.closePath();
  ctx.fill();
}

function paintDoor(ctx: CanvasRenderingContext2D, sx: number, sy: number, S: number): void {
  ctx.fillStyle = "#1a120e";
  ctx.fillRect(sx + S * 0.22, sy + S * 0.12, S * 0.56, S * 0.88);
  ctx.fillStyle = "#e2a45c";
  ctx.fillRect(sx + S * 0.62, sy + S * 0.55, 3, 3);
}

function paintTree(ctx: CanvasRenderingContext2D, state: State, x: number, y: number, sx: number, sy: number, S: number, time: number, reduce: boolean): void {
  const altered = state.era === "altered";
  let neighbors = 0;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    if (tileAt(state, state.map, x + dx, y + dy) === "t") neighbors++;
  }
  const sway = reduce ? 0 : Math.sin(time * 0.8 + x) * 1.5;
  if (neighbors < 2) {
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(sx + S * 0.44, sy + S * 0.48, S * 0.12, S * 0.46);
  }
  ctx.fillStyle = altered ? "#4d5a50" : "#1c3828";
  ctx.beginPath();
  ctx.arc(sx + S * 0.5 + sway, sy + S * 0.36, neighbors >= 2 ? S * 0.48 : S * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = altered ? "#6d7a70" : "#2f5340";
  ctx.beginPath();
  ctx.arc(sx + S * 0.36 + sway, sy + S * 0.28, S * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function paintFigure(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  S: number,
  opts: {
    coat: string;
    hair: string;
    facing: Dir;
    walking: boolean;
    time: number;
    reduce: boolean;
    parcel?: boolean;
    tool?: "blade" | "hammer" | null;
    bleed?: boolean;
  },
): void {
  const step = opts.walking && !opts.reduce ? Math.sin(opts.time * 11) : 0;
  const d: Record<Dir, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  const [fx, fy] = d[opts.facing];
  ctx.save();
  ctx.translate(px + S / 2, py + S * 0.62);
  ctx.scale(1.72, 1.72);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, S * 0.16, S * 0.26, S * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#241c16";
  ctx.fillRect(-S * 0.12, S * 0.02, S * 0.08, S * 0.16 + step * 2);
  ctx.fillRect(S * 0.04, S * 0.02, S * 0.08, S * 0.16 - step * 2);
  ctx.fillStyle = opts.coat;
  ctx.beginPath();
  ctx.roundRect(-S * 0.2, -S * 0.22, S * 0.4, S * 0.32, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.stroke();
  ctx.fillStyle = "#d7b89a";
  ctx.beginPath();
  ctx.arc(fx * S * 0.06, -S * 0.3 + fy * S * 0.04, S * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = opts.hair;
  ctx.beginPath();
  ctx.arc(fx * S * 0.06, -S * 0.34 + fy * S * 0.04, S * 0.13, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.fill();
  if (opts.facing === "s") {
    ctx.fillStyle = "#2a2018";
    ctx.fillRect(-S * 0.03, -S * 0.3, 1.5, 1.5);
    ctx.fillRect(S * 0.04, -S * 0.3, 1.5, 1.5);
  }
  if (opts.parcel) {
    ctx.fillStyle = "#d9cbb0";
    ctx.fillRect(S * 0.12, -S * 0.08, S * 0.16, S * 0.13);
    ctx.strokeStyle = "#5a4634";
    ctx.strokeRect(S * 0.12, -S * 0.08, S * 0.16, S * 0.13);
  }
  if (opts.tool === "blade") {
    ctx.save();
    ctx.translate(fx * S * 0.28, fy * S * 0.2);
    ctx.rotate(opts.facing === "w" || opts.facing === "e" ? 0.4 : -0.5);
    ctx.fillStyle = "#e7e2d8";
    ctx.fillRect(-1, -S * 0.28, 2.5, S * 0.28);
    ctx.fillStyle = "#3a2a18";
    ctx.fillRect(-3, -2, 7, 4);
    ctx.restore();
  } else if (opts.tool === "hammer") {
    ctx.save();
    ctx.translate(fx * S * 0.26, fy * S * 0.12);
    ctx.fillStyle = "#6a5340";
    ctx.fillRect(-1.5, -S * 0.16, 3, S * 0.22);
    ctx.fillStyle = "#8d8880";
    ctx.fillRect(-S * 0.08, -S * 0.2, S * 0.16, S * 0.07);
    ctx.restore();
  }
  if (opts.bleed) {
    ctx.fillStyle = "#9a3030";
    ctx.fillRect(S * 0.08, S * 0.02, S * 0.06, 2);
  }
  ctx.restore();
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  state: State,
  cam: Camera,
  w: number,
  h: number,
  time: number,
  reduce: boolean,
  flash: number,
  pose?: Pose,
): void {
  const altered = state.era === "altered";
  const S = viewScale(state, w, h);
  paintSky(ctx, state, w, h);

  const rows = MAPS[state.map].rows;
  const mapW = rows[0].length;
  const mapH = rows.length;
  const x0 = Math.max(0, Math.floor(cam.x / S) - 1);
  const y0 = Math.max(0, Math.floor(cam.y / S) - 1);
  const x1 = Math.min(mapW - 1, Math.ceil((cam.x + w) / S) + 1);
  const y1 = Math.min(mapH - 1, Math.ceil((cam.y + h) / S) + 1);

  const trees: { x: number; y: number; sx: number; sy: number }[] = [];
  const roofs: { sx: number; sy: number }[] = [];
  const doors: { sx: number; sy: number }[] = [];

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = tileAt(state, state.map, x, y);
      const sx = x * S - cam.x;
      const sy = y * S - cam.y;
      paintTile(ctx, state, t, x, y, sx, sy, S, time, reduce, mapW, mapH);
      if (t === "t") trees.push({ x, y, sx, sy });
      if (state.map === "lane" && t === "#" && !edge(x, y, mapW, mapH)) {
        const above = tileAt(state, state.map, x, y - 1);
        if (above !== "#") roofs.push({ sx, sy });
      }
      if (state.map === "lane" && t === ".") {
        const left = tileAt(state, state.map, x - 1, y);
        const right = tileAt(state, state.map, x + 1, y);
        if (left === "#" && right === "#") doors.push({ sx, sy });
      }
      if (state.map === "vein" && !state.seam.veinOpen && x >= 7) {
        ctx.fillStyle = "rgba(8,8,10,0.55)";
        ctx.fillRect(sx, sy, S, S);
      }
    }
  }

  for (const r of roofs) paintRoof(ctx, r.sx, r.sy, S, altered);
  for (const d of doors) paintDoor(ctx, d.sx, d.sy, S);
  for (const tr of trees) paintTree(ctx, state, tr.x, tr.y, tr.sx, tr.sy, S, time, reduce);

  if (state.map === "house" || state.map === "inn") {
    const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.min(w, h) * 0.45);
    glow.addColorStop(0, "rgba(226,164,92,0.08)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  for (const e of ENTITIES) {
    if (e.map !== state.map) continue;
    const sx = e.x * S - cam.x;
    const sy = e.y * S - cam.y;
    if (sx < -S || sy < -S || sx > w || sy > h) continue;
    if (e.id === "ione") {
      paintFigure(ctx, sx, sy, S, { coat: "#3d4a55", hair: "#c8c2b6", facing: "s", walking: false, time, reduce });
    } else if (e.id === "hart") {
      paintFigure(ctx, sx, sy, S, { coat: "#5a4636", hair: "#6a5a48", facing: "s", walking: false, time, reduce });
    } else if (e.id === "gate" && !state.flags.rootCut) {
      ctx.strokeStyle = "#3a2a18";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx - 4, sy + 10);
      ctx.quadraticCurveTo(sx + S / 2, sy + S + 6, sx + S + 4, sy + 12);
      ctx.moveTo(sx + 6, sy + S * 0.2);
      ctx.quadraticCurveTo(sx + S * 0.6, sy + S * 0.8, sx + S - 2, sy + S * 0.35);
      ctx.stroke();
      ctx.lineWidth = 1;
    } else if (e.id === "seam" || e.id === "block") {
      ctx.fillStyle = "#efe8dc";
      ctx.fillRect(sx + 6, sy + 6, S - 12, S - 12);
      const open = e.id === "seam" ? state.seam.veinOpen : state.seam.yardOpen;
      const scar = e.id === "seam" ? state.seam.veinScar : state.seam.yardScar;
      ctx.strokeStyle = open ? "#e2a45c" : "#b9b1a4";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + 12, sy + 14);
      ctx.lineTo(sx + S - 12, sy + S - 16);
      ctx.stroke();
      if (scar) {
        ctx.strokeStyle = "#8a4030";
        ctx.beginPath();
        ctx.moveTo(sx + 12, sy + S - 14);
        ctx.lineTo(sx + S - 14, sy + 16);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    } else if (e.id === "impression") {
      ctx.save();
      ctx.translate(sx + S / 2, sy + S / 2);
      ctx.strokeStyle = state.clothes === "impression" ? "#6a5344" : "#8a8174";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -S * 0.16, S * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-S * 0.12, -S * 0.04);
      ctx.lineTo(-S * 0.16, S * 0.22);
      ctx.lineTo(S * 0.16, S * 0.22);
      ctx.lineTo(S * 0.12, -S * 0.04);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    } else if (e.id === "milepost" || e.id === "wayside" || e.id === "shore-stone" || e.id.startsWith("epitaph")) {
      ctx.fillStyle = "#d9d2c4";
      ctx.fillRect(sx + S * 0.4, sy + S * 0.18, S * 0.18, S * 0.7);
      if (e.id === "milepost") {
        ctx.fillRect(sx + S * 0.22, sy + S * 0.28, S * 0.5, S * 0.08);
      }
    } else if (e.id === "pale-water") {
      const a = 0.15 + Math.sin(time * 1.2) * 0.05;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(sx, sy, S, S);
    } else if (e.id === "table" || e.id === "bench" || e.id === "ledger") {
      ctx.fillStyle = e.id === "ledger" ? "#e4d4b0" : "#3a2418";
      ctx.fillRect(sx + 8, sy + S * 0.42, S - 16, e.id === "bench" ? 8 : 12);
    } else if (e.id === "cupboard") {
      ctx.fillStyle = "#4a3024";
      ctx.fillRect(sx + 8, sy + 6, S - 16, S - 12);
      if (!state.seen.includes("took:cupboard")) {
        ctx.fillStyle = "#d9cbb0";
        ctx.fillRect(sx + S / 2 - 5, sy + 14, 10, 7);
      }
    } else if (e.id === "hearth") {
      ctx.fillStyle = "#2a2018";
      ctx.fillRect(sx + 6, sy + 8, S - 12, S - 14);
      const flick = reduce ? 0 : Math.sin(time * 8) * 2;
      ctx.fillStyle = "#e2a45c";
      ctx.fillRect(sx + 14, sy + 18 + flick, S - 28, 10);
      ctx.fillStyle = "#b85a38";
      ctx.fillRect(sx + 18, sy + 22, S - 36, 6);
    } else if (e.id === "peg") {
      ctx.strokeStyle = "#c4b49a";
      ctx.beginPath();
      ctx.moveTo(sx + S / 2, sy + 8);
      ctx.lineTo(sx + S / 2, sy + 22);
      ctx.stroke();
    } else if (e.id === "sill") {
      ctx.fillStyle = "#9aa8b0";
      ctx.fillRect(sx + 6, sy + 8, S - 12, 8);
      if (!state.seen.includes("took:sill")) {
        ctx.fillStyle = "#d9cbb0";
        ctx.fillRect(sx + 12, sy + 20, 10, 6);
      }
    } else if ((e.id === "nail" || e.id === "vein-hammer") && !state.flags.hammerTaken) {
      ctx.strokeStyle = "#9a958c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + S * 0.55);
      ctx.lineTo(sx + S - 14, sy + S * 0.55);
      ctx.moveTo(sx + S - 18, sy + S * 0.42);
      ctx.lineTo(sx + S - 18, sy + S * 0.68);
      ctx.stroke();
      ctx.lineWidth = 1;
    } else if (e.id === "well") {
      ctx.strokeStyle = "#c4bba8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx + S / 2, sy + S / 2, S * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = "#16343a";
      ctx.beginPath();
      ctx.arc(sx + S / 2, sy + S / 2, S * 0.16, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.id === "mallet" || e.id === "scrap") {
      ctx.fillStyle = e.id === "scrap" ? "#e4dcc8" : "#6a5340";
      ctx.fillRect(sx + 10, sy + S * 0.4, S - 20, 8);
    } else if (e.id === "slab" || e.id === "ledge") {
      ctx.fillStyle = "#cfc6b8";
      ctx.fillRect(sx + 4, sy + S * 0.48, S - 8, 8);
    } else if (e.id === "ring") {
      ctx.strokeStyle = "#b7b0a2";
      ctx.beginPath();
      ctx.arc(sx + S / 2, sy + S / 2, S * 0.32, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const fx = pose?.x ?? state.x;
  const fy = pose?.y ?? state.y;
  const walking = Math.hypot(fx - state.x, fy - state.y) > 0.03;
  if (!state.dead) {
    const tool = state.equipped === "blade" || state.equipped === "hammer" ? state.equipped : null;
    paintFigure(ctx, fx * S - cam.x, fy * S - cam.y, S, {
      coat: state.clothes === "impression" ? "#e7dcc8" : "#4a3024",
      hair: "#2a2018",
      facing: state.facing,
      walking,
      time,
      reduce,
      parcel: state.inventory.includes("parcel"),
      tool,
      bleed: state.bleed,
    });
  }

  if (state.map === "shore" && !reduce) {
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let i = 0; i < 5; i++) {
      const mx = ((time * 12 + i * 80) % (w + 40)) - 20;
      const my = 40 + hash(i, 4) * h * 0.35;
      ctx.beginPath();
      ctx.ellipse(mx, my, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, state.map === "shore" ? "rgba(90,84,74,0.12)" : "rgba(0,0,0,0.22)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (flash > 0) {
    ctx.fillStyle = `rgba(226,164,92,${flash})`;
    ctx.fillRect(0, 0, w, h);
  }
}
