import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PALETTE, PIXELS } from "../src/pixels.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "assets", "icons");
mkdirSync(dir, { recursive: true });

function svgFor(rows) {
  const rects = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x] ?? ".";
      if (ch === "." || !(ch in PALETTE)) continue;
      const fill = PALETTE[ch];
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
    }
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects.join("")}</svg>\n`;
}

const symbols = [];
for (const [id, rows] of Object.entries(PIXELS)) {
  writeFileSync(join(dir, `${id}.svg`), svgFor(rows));
  symbols.push(
    `<symbol id="${id}" viewBox="0 0 16 16">${svgFor(rows).replace(/^<\?xml[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}</symbol>`,
  );
}
writeFileSync(
  join(dir, "sprite.svg"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${symbols.join("")}</svg>\n`,
);
console.log(`wrote ${Object.keys(PIXELS).length} icons`);
