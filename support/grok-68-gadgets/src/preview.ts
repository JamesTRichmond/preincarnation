import type { Family } from "./types.ts";

const INK = "#1c1612";
const BRASS = "#8a5a2a";
const PAPER = "#f4efe2";
const PINE = "#1e3933";
const OXIDE = "#7d2f28";

function gear(cx: number, cy: number, r: number, teeth: number, color: string): string {
  const pts: string[] = [];
  for (let i = 0; i < teeth; i += 1) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.35) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.65) / teeth) * Math.PI * 2;
    const a3 = ((i + 1) / teeth) * Math.PI * 2;
    const outer = r;
    const inner = r * 0.78;
    pts.push(`${cx + Math.cos(a0) * inner},${cy + Math.sin(a0) * inner}`);
    pts.push(`${cx + Math.cos(a1) * outer},${cy + Math.sin(a1) * outer}`);
    pts.push(`${cx + Math.cos(a2) * outer},${cy + Math.sin(a2) * outer}`);
    pts.push(`${cx + Math.cos(a3) * inner},${cy + Math.sin(a3) * inner}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${color}" stroke="${INK}" stroke-width="1.4"/>`;
}

function plate(n: number, family: Family, name: string, body: string): string {
  const label = name.length > 28 ? `${name.slice(0, 26)}…` : name;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img" aria-label="${name}">
  <rect width="320" height="200" fill="${PAPER}"/>
  <rect x="10" y="10" width="300" height="180" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <circle cx="22" cy="22" r="3" fill="${BRASS}"/>
  <circle cx="298" cy="22" r="3" fill="${BRASS}"/>
  <circle cx="22" cy="178" r="3" fill="${BRASS}"/>
  <circle cx="298" cy="178" r="3" fill="${BRASS}"/>
  <text x="24" y="40" fill="${OXIDE}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11" letter-spacing="1.5">${family.toUpperCase()} · ${String(n).padStart(3, "0")}</text>
  ${body}
  <text x="24" y="186" fill="${INK}" font-family="ui-serif, Georgia, serif" font-size="13">${label}</text>
</svg>`;
}

function bodyFor(n: number, family: Family): string {
  const k = n % 5;
  if (family === "clockwork") {
    const teeth = 6 + (n % 7);
    const bird = n === 1
      ? `<path d="M168 78 l22 -8 l-6 14 z" fill="${OXIDE}"/><circle cx="188" cy="70" r="2" fill="${INK}"/>`
      : "";
    return `${gear(120, 100, 36 + k, teeth, BRASS)}<circle cx="120" cy="100" r="8" fill="${PAPER}" stroke="${INK}"/>${gear(176, 118, 18, 5 + k, PINE)}${bird}`;
  }
  if (family === "optical") {
    const prism = n === 17
      ? `<polygon points="150,58 196,150 104,150" fill="none" stroke="${PINE}" stroke-width="3"/>`
      : `<ellipse cx="150" cy="104" rx="${28 + k * 4}" ry="18" fill="none" stroke="${PINE}" stroke-width="3"/>`;
    return `${prism}<line x1="70" y1="${80 + k * 6}" x2="250" y2="${120 - k * 4}" stroke="${OXIDE}" stroke-width="1.5"/>
      <line x1="70" y1="${100 + k * 3}" x2="250" y2="${90 + k * 5}" stroke="${BRASS}" stroke-width="1.2"/>`;
  }
  if (family === "sonic") {
    return `<path d="M70 120 C110 120, 130 70, 230 78 L236 108 C140 100, 120 146, 70 140 Z" fill="none" stroke="${PINE}" stroke-width="3"/>
      <path d="M48 ${100 + k * 4} q 16 ${8 + k} 0 ${18 + k}" fill="none" stroke="${OXIDE}" stroke-width="1.6"/>
      <path d="M36 ${96 + k * 3} q 18 ${12 + k} 0 ${26}" fill="none" stroke="${BRASS}" stroke-width="1.4"/>`;
  }
  if (family === "fitting") {
    return `<rect x="78" y="${78 + k}" width="150" height="16" rx="2" fill="none" stroke="${INK}" stroke-width="2.4"/>
      <rect x="92" y="70" width="18" height="32" fill="${BRASS}" stroke="${INK}"/>
      <circle cx="${200 - k * 6}" cy="86" r="10" fill="none" stroke="${PINE}" stroke-width="3"/>
      <rect x="120" y="112" width="${70 + k * 8}" height="10" fill="${OXIDE}"/>`;
  }
  return `<rect x="86" y="70" width="148" height="18" fill="none" stroke="${INK}" stroke-width="2"/>
    <polygon points="${100 + k * 8},88 ${100 + k * 8},150 ${116 + k * 8},150" fill="${BRASS}" stroke="${INK}"/>
    <circle cx="${190 + k * 4}" cy="122" r="16" fill="none" stroke="${PINE}" stroke-width="3"/>
    <line x1="70" y1="150" x2="250" y2="150" stroke="${OXIDE}" stroke-width="1.4"/>`;
}

export function previewSvg(n: number, family: Family, name: string): string {
  return plate(n, family, name, bodyFor(n, family));
}
