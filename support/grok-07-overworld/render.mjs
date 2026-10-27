import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DISTRICT_META, TILE_PX, SCREEN_W, SCREEN_H } from "./lib/constants.mjs";
import { ERA_CHANGES } from "./data/travel.mjs";
import { assemble } from "./lib/world.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "output");
fs.mkdirSync(outDir, { recursive: true });

const TILE_COLOR = {
  ".": "#d5d0b8",
  ",": "#b7b07a",
  t: "#6d8f55",
  T: "#2d4a28",
  p: "#c4a574",
  "-": "#a88860",
  f: "#e4dcc8",
  D: "#f2e2a0",
  H: "#e2b84a",
  W: "#9fd7e8",
  S: "#f7f3e8",
  d: "#5c2e4a",
  b: "#8d6a45",
  "@": "#fff4c2",
  y: "#8a8172",
  m: "#6a8f78",
  "~": "#7eb0c4",
  c: "#9ec4c8",
  "=": "#24556f",
  v: "#3c315c",
  "^": "#6b5344",
  l: "#6f8f3a",
  n: "#d5dde8",
  "#": "#2a2724",
  B: "#4a4038",
  "+": "#6d6248",
  r: "#55514c",
  x: "#3e3a36",
  o: "#3f6a32",
  u: "#a85a32",
  G: "#c4554a",
};

function esc(s) {
  return String(s)
    .replaceAll("&", "\u0026amp;")
    .replaceAll("<", "\u0026lt;")
    .replaceAll(">", "\u0026gt;")
    .replaceAll('"', "\u0026quot;");
}

function screenSvg(screen, ox, oy, scale) {
  const parts = [];
  for (let y = 0; y < screen.layout.length; y++) {
    const row = screen.layout[y];
    let x = 0;
    while (x < row.length) {
      const tile = row[x];
      let x2 = x + 1;
      while (x2 < row.length && row[x2] === tile) x2++;
      const color = TILE_COLOR[tile] ?? "#ff00ff";
      parts.push(`<rect x="${ox + x * scale}" y="${oy + y * scale}" width="${(x2 - x) * scale}" height="${scale}" fill="${color}"/>`);
      x = x2;
    }
  }
  parts.push(`<rect x="${ox}" y="${oy}" width="${SCREEN_W * scale}" height="${SCREEN_H * scale}" fill="none" stroke="#1b1a17" stroke-width="1"/>`);
  return parts.join("");
}

function renderWorld(world) {
  const scale = 3;
  const pad = 18;
  const label = 16;
  const cellW = SCREEN_W * scale + pad;
  const cellH = SCREEN_H * scale + pad + label;
  const maxX = Math.max(...world.screens.map((s) => s.x));
  const maxY = Math.max(...world.screens.map((s) => s.y));
  const width = (maxX + 3) * cellW + 280;
  const height = (maxY + 2) * cellH + 80;
  const body = [];
  body.push(`<rect width="${width}" height="${height}" fill="#143044"/>`);
  body.push(`<text x="24" y="36" fill="#f4efe2" font-family="Georgia, serif" font-size="28">PREINCARNATION — Addison County overworld</text>`);
  body.push(`<text x="24" y="58" fill="#d5d0c4" font-family="Georgia, serif" font-size="14">Cartogram, not a survey. 20×14 tiles. Lake west, county seals on the empty margin. Era 0 layouts.</text>`);
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= maxX; x++) {
      const hit = world.screens.find((s) => s.x === x && s.y === y);
      const ox = 24 + x * cellW;
      const oy = 80 + y * cellH;
      if (!hit) {
        const lake = x <= 1 && y <= 3;
        body.push(`<rect x="${ox}" y="${oy + label}" width="${SCREEN_W * scale}" height="${SCREEN_H * scale}" fill="${lake ? "#1b4e68" : "#102433"}"/>`);
        continue;
      }
      body.push(`<text x="${ox}" y="${oy + 12}" fill="${DISTRICT_META[hit.district].color}" font-family="ui-sans-serif, sans-serif" font-size="11">${esc(hit.id)} ${esc(hit.name)}</text>`);
      body.push(screenSvg(hit, ox, oy + label, scale));
      if (hit.start) body.push(`<circle cx="${ox + 8}" cy="${oy + label + 8}" r="4" fill="#ffe08a"/>`);
    }
  }
  let ly = 90;
  body.push(`<text x="${width - 250}" y="${ly}" fill="#f4efe2" font-family="Georgia, serif" font-size="16">Districts</text>`);
  for (const meta of Object.values(DISTRICT_META)) {
    ly += 22;
    body.push(`<rect x="${width - 250}" y="${ly - 11}" width="14" height="14" fill="${meta.color}"/>`);
    body.push(`<text x="${width - 230}" y="${ly}" fill="#f4efe2" font-family="ui-sans-serif, sans-serif" font-size="12">${esc(meta.label)}</text>`);
  }
  ly += 36;
  const legend = [
    ["#c4a574", "road"],
    ["#24556f", "deep water / oar"],
    ["#6a8f78", "marsh / boots"],
    ["#d5dde8", "windwall / notch"],
    ["#c4554a", "other tool gate"],
    ["#5c2e4a", "dungeon mouth"],
    ["#9fd7e8", "glass-warp"],
    ["#e2b84a", "hub threshold"],
    ["#f2e2a0", "interior door"],
  ];
  body.push(`<text x="${width - 250}" y="${ly}" fill="#f4efe2" font-family="Georgia, serif" font-size="16">Tiles</text>`);
  for (const [color, name] of legend) {
    ly += 20;
    body.push(`<rect x="${width - 250}" y="${ly - 10}" width="14" height="14" fill="${color}"/>`);
    body.push(`<text x="${width - 230}" y="${ly}" fill="#f4efe2" font-family="ui-sans-serif, sans-serif" font-size="12">${esc(name)}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body.join("")}</svg>`;
}

function renderHubs(world) {
  const scale = 8;
  const cols = 2;
  const cardW = 30 * scale + 40;
  const cardH = 18 * scale + 64;
  const width = cols * cardW + 40;
  const height = Math.ceil(world.hubs.length / cols) * cardH + 70;
  const parts = [`<rect width="${width}" height="${height}" fill="#1c1814"/>`, `<text x="20" y="36" fill="#f4efe2" font-family="Georgia, serif" font-size="24">Community hubs</text>`];
  world.hubs.forEach((hub, i) => {
    const ox = 20 + (i % cols) * cardW;
    const oy = 60 + Math.floor(i / cols) * cardH;
    parts.push(`<text x="${ox}" y="${oy}" fill="#f4efe2" font-family="Georgia, serif" font-size="16">${esc(hub.name)}</text>`);
    parts.push(`<text x="${ox}" y="${oy + 16}" fill="#c8c0b0" font-family="ui-sans-serif, sans-serif" font-size="11">${esc(hub.id)} from ${esc(hub.entrance.from)}</text>`);
    const grid = hub.layout.map((row) => row.split(""));
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        parts.push(`<rect x="${ox + x * scale}" y="${oy + 24 + y * scale}" width="${scale}" height="${scale}" fill="${TILE_COLOR[grid[y][x]] ?? "#f0f"}"/>`);
      }
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;
}

const world = assemble(0);
fs.writeFileSync(path.join(outDir, "world-map.svg"), renderWorld(world));
fs.writeFileSync(path.join(outDir, "hubs.svg"), renderHubs(world));

const compiled = {
  reference: { screen: [SCREEN_W, SCREEN_H], tilePx: TILE_PX, origin: "north-west", row0: "north" },
  start: "MID-13",
  districts: DISTRICT_META,
  screens: world.screens,
  hubs: world.hubs,
  interiors: world.interiors,
  eraChanges: ERA_CHANGES,
};
fs.writeFileSync(path.join(outDir, "compiled-world.json"), JSON.stringify(compiled));

const matrix = ["# Six-era change matrix", "", "Years 0, 14, 28, 42, 56, 70. A change is a route or an interaction, never a recolor.", ""];
for (const district of Object.keys(DISTRICT_META)) {
  matrix.push(`## ${DISTRICT_META[district].label}`);
  matrix.push("");
  for (const change of ERA_CHANGES.filter((c) => c.districts.includes(district))) {
    matrix.push(`- **Year ${change.era}** (${change.kind}) \`${change.id}\`: ${change.summary}`);
  }
  matrix.push("");
}
fs.writeFileSync(path.join(outDir, "era-matrix.md"), matrix.join("\n"));
console.log(`rendered ${world.screens.length} screens -> output/world-map.svg`);
