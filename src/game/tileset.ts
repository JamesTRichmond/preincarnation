/** Procedural fallbacks when a texture is missing. 16×16 SNES cells. */

export function paintTile(ctx: CanvasRenderingContext2D, id: number, x: number, y: number, frame: number) {
  const pal = [
    "#3d6b3a",
    "#4a7a42",
    "#8a7048",
    "#6b5a3a",
    "#2a5a72",
    "#4a3a28",
    "#6a4a28",
    "#1e3a22",
    "#2a2838",
    "#d8d0c0",
    "#9a8a78",
    "#3a2458",
    "#0a0c14",
    "#6a6460",
    "#5a4a32",
    "#7a6a58",
    "#c2b48a",
    "#4a4a52",
  ];
  ctx.fillStyle = pal[id] ?? "#3d6b3a";
  ctx.fillRect(x, y, 16, 16);
  if (id === 4) {
    ctx.fillStyle = "rgba(180,220,230,0.25)";
    ctx.fillRect(x + (frame % 4) * 2, y + 6, 6, 2);
  }
  if (id === 7) {
    ctx.fillStyle = "#16301a";
    ctx.fillRect(x + 4, y + 2, 8, 12);
  }
}

export function paintBush(ctx: CanvasRenderingContext2D, x: number, y: number, glow: boolean) {
  ctx.fillStyle = glow ? "#7ec8a3" : "#245830";
  ctx.fillRect(x + 2, y + 4, 12, 10);
  ctx.fillStyle = "#3d7a40";
  ctx.fillRect(x + 4, y + 2, 8, 6);
}

export function paintChest(ctx: CanvasRenderingContext2D, x: number, y: number, glow: boolean) {
  ctx.fillStyle = glow ? "#e8c36a" : "#6a4220";
  ctx.fillRect(x + 2, y + 6, 12, 8);
  ctx.fillStyle = "#e8c36a";
  ctx.fillRect(x + 7, y + 8, 2, 3);
}

export function paintCache(ctx: CanvasRenderingContext2D, x: number, y: number, glow: boolean) {
  ctx.fillStyle = glow ? "#c4bba8" : "#3a3228";
  ctx.fillRect(x + 3, y + 8, 10, 6);
  ctx.fillStyle = "#8a7048";
  ctx.fillRect(x + 5, y + 6, 6, 4);
}

export function paintShrine(ctx: CanvasRenderingContext2D, x: number, y: number, ritual: number) {
  ctx.fillStyle = "#c4bba8";
  ctx.fillRect(x + 2, y + 8, 12, 6);
  ctx.fillStyle = ritual > 0 ? "#e8c36a" : "#8e8676";
  ctx.fillRect(x + 6, y + 2, 4, 8);
}

export function paintWell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#4a4a52";
  ctx.fillRect(x + 3, y + 4, 10, 10);
  ctx.fillStyle = "#1a3048";
  ctx.fillRect(x + 5, y + 6, 6, 6);
}

export function paintHome(ctx: CanvasRenderingContext2D, x: number, y: number, pulse: number) {
  ctx.fillStyle = "#6a3a28";
  ctx.fillRect(x, y + 4, 16, 12);
  ctx.fillStyle = `rgba(232,195,106,${0.35 + pulse * 0.4})`;
  ctx.fillRect(x + 6, y + 8, 4, 8);
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(x + 2, y + 2, 12, 4);
}

export function paintRock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#6a6460";
  ctx.fillRect(x + 2, y + 6, 12, 8);
  ctx.fillStyle = "#c4bba8";
  ctx.fillRect(x + 4, y + 8, 3, 2);
}

export function paintPot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#8a4a28";
  ctx.fillRect(x + 4, y + 6, 8, 8);
  ctx.fillStyle = "#c47a48";
  ctx.fillRect(x + 6, y + 4, 4, 4);
}

export function paintSheep(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(x + 3, y + 6, 10, 8);
  ctx.fillStyle = "#2a2838";
  ctx.fillRect(x + 10, y + 7, 3, 3);
}

export function paintNpc(ctx: CanvasRenderingContext2D, x: number, y: number, npc: string) {
  const colors: Record<string, string> = {
    elder: "#c4bba8",
    farmer: "#8a7048",
    mayor: "#6a7aa0",
    shop: "#e8c36a",
    hunter: "#5a4a32",
    ranger: "#3d6b3a",
    resident: "#f4efe2",
    sentinel: "#9a8a78",
    cartog: "#7ec8a3",
  };
  ctx.fillStyle = colors[npc] ?? "#c4bba8";
  ctx.fillRect(x + 5, y + 4, 6, 10);
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(x + 6, y + 2, 4, 3);
}

export function paintBuilding(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number) {
  const roof: Record<string, string> = {
    barn: "#8a3a28",
    inn: "#6a3a28",
    hall: "#4a3a28",
    college: "#5a4a3a",
    capitol: "#c4bba8",
    sugar: "#8a5a28",
    disp: "#3a4a38",
  };
  ctx.fillStyle = roof[kind] ?? "#5a3a28";
  ctx.fillRect(x - 2, y, 20, 8);
  ctx.fillStyle = "#c4bba8";
  ctx.fillRect(x, y + 6, 16, 12);
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(x + 6, y + 10, 4, 8);
}

export function paintBearFallback(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#4a3220";
  ctx.fillRect(x + 2, y + 4, 16, 12);
}

export function paintBobcatFallback(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#c47a38";
  ctx.fillRect(x + 3, y + 6, 12, 8);
}

export function paintFisherFallback(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#2a2838";
  ctx.fillRect(x + 4, y + 6, 10, 8);
}

export function paintGrave(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#6a6460";
  ctx.fillRect(x + 5, y + 2, 6, 12);
  ctx.fillStyle = "#c4bba8";
  ctx.fillRect(x + 6, y + 4, 4, 3);
}

export function paintKey(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#e8c36a";
  ctx.fillRect(x + 6, y + 4, 4, 8);
  ctx.fillRect(x + 4, y + 10, 8, 2);
}

export function paintLock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#3a2010";
  ctx.fillRect(x + 2, y, 12, 16);
  ctx.fillStyle = "#e8c36a";
  ctx.fillRect(x + 7, y + 6, 2, 4);
}
