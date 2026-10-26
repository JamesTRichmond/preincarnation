export function lootId(index: number): string {
  return `loot.equipment.${String(index).padStart(3, "0")}`;
}

export function swatch(index: number): string {
  const h = Math.round((index * 137.508) % 360);
  return hsl(h, 46, 34);
}

function hsl(h: number, s: number, l: number): string {
  const a = s / 100;
  const b = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const c = a * Math.min(b, 1 - b);
  const f = (n: number) => b - c * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}
