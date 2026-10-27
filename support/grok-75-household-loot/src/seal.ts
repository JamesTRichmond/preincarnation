import type { Category } from "./types.ts";

/** Structural seal, not a recolor. Same geometry the preview files use. */
export function sealMarkup(n: number, category: Category): string {
  const ink = "#241c16";
  const paper = "#f3eadf";
  const parts: string[] = [
    `<rect width="64" height="64" rx="6" fill="${paper}"/>`,
    `<rect x="3" y="3" width="58" height="58" rx="4" fill="none" stroke="${ink}" stroke-width="1"/>`,
  ];
  if (category === "lamp") {
    const flames = (n % 3) + 1;
    for (let i = 0; i < flames; i += 1) {
      const x = 22 + i * 10;
      const h = 10 + ((n + i) % 5) * 2;
      parts.push(
        `<path d="M${x} 40 C${x - 4} ${40 - h} ${x + 4} ${40 - h} ${x} 40" fill="${ink}"/>`,
      );
    }
    parts.push(`<rect x="16" y="40" width="${20 + (n % 4) * 4}" height="6" fill="${ink}"/>`);
  } else if (category === "instrument") {
    const body = n % 4;
    if (body === 0)
      parts.push(
        `<ellipse cx="32" cy="36" rx="10" ry="16" fill="none" stroke="${ink}" stroke-width="1.5"/>`,
      );
    if (body === 1)
      parts.push(
        `<path d="M18 44 L32 14 L46 44 Z" fill="none" stroke="${ink}" stroke-width="1.5"/>`,
      );
    if (body === 2)
      parts.push(
        `<rect x="20" y="22" width="24" height="22" rx="8" fill="none" stroke="${ink}" stroke-width="1.5"/>`,
      );
    if (body === 3)
      parts.push(`<circle cx="32" cy="34" r="12" fill="none" stroke="${ink}" stroke-width="1.5"/>`);
    parts.push(`<path d="M32 14 V50" stroke="${ink}" stroke-width="1"/>`);
  } else if (category === "chime") {
    const tubes = 3 + (n % 3);
    for (let i = 0; i < tubes; i += 1) {
      const x = 16 + i * 8;
      const h = 12 + ((n * (i + 2)) % 14);
      parts.push(
        `<line x1="${x}" y1="22" x2="${x}" y2="${22 + h}" stroke="${ink}" stroke-width="2"/>`,
      );
    }
    parts.push(`<line x1="14" y1="20" x2="52" y2="20" stroke="${ink}"/>`);
  } else if (category === "tray") {
    parts.push(
      `<ellipse cx="32" cy="36" rx="${16 + (n % 3)}" ry="8" fill="none" stroke="${ink}" stroke-width="1.5"/>`,
    );
    const dishes = 1 + (n % 3);
    for (let i = 0; i < dishes; i += 1) {
      parts.push(`<circle cx="${24 + i * 8}" cy="34" r="2" fill="${ink}"/>`);
    }
  } else if (category === "container") {
    const lid = 18 + (n % 5);
    parts.push(`<path d="M14 28 H50 V48 H14 Z" fill="none" stroke="${ink}" stroke-width="1.5"/>`);
    parts.push(`<path d="M14 28 Q32 ${lid} 50 28" fill="none" stroke="${ink}"/>`);
    if (n % 2 === 0) parts.push(`<line x1="32" y1="30" x2="32" y2="40" stroke="${ink}"/>`);
  } else if (category === "clock") {
    parts.push(`<circle cx="32" cy="32" r="14" fill="none" stroke="${ink}" stroke-width="1.5"/>`);
    const hour = n % 12;
    const angle = (hour / 12) * Math.PI * 2 - Math.PI / 2;
    const x = 32 + Math.round(Math.cos(angle) * 8);
    const y = 32 + Math.round(Math.sin(angle) * 8);
    parts.push(`<line x1="32" y1="32" x2="${x}" y2="${y}" stroke="${ink}" stroke-width="1.5"/>`);
    if (n % 5 === 0) parts.push(`<rect x="28" y="46" width="8" height="6" fill="${ink}"/>`);
  } else if (category === "worksurface") {
    parts.push(`<path d="M12 40 H52" stroke="${ink}" stroke-width="2"/>`);
    parts.push(`<path d="M18 40 V50 M46 40 V50" stroke="${ink}"/>`);
    const marks = 1 + (n % 4);
    for (let i = 0; i < marks; i += 1)
      parts.push(`<line x1="${20 + i * 6}" y1="34" x2="${24 + i * 6}" y2="28" stroke="${ink}"/>`);
  } else {
    const holes = n % 3;
    parts.push(`<circle cx="32" cy="32" r="10" fill="none" stroke="${ink}" stroke-width="1.5"/>`);
    if (holes === 1) parts.push(`<circle cx="32" cy="32" r="2" fill="${ink}"/>`);
    if (holes === 2) parts.push(`<path d="M26 32 H38 M32 26 V38" stroke="${ink}"/>`);
    parts.push(`<path d="M32 18 V14 M44 32 H48" stroke="${ink}"/>`);
  }
  parts.push(
    `<text x="6" y="58" font-size="6" fill="${ink}" font-family="serif">${String(n).padStart(3, "0")}</text>`,
  );
  return parts.join("");
}

export function sealSvg(n: number, category: Category): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img">${sealMarkup(n, category)}</svg>`;
}
