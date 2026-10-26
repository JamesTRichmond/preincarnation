export type Terrain = "mountain" | "forest" | "river" | "town" | "field" | "marsh";

export interface PlotDef {
  index: number;
  name: string;
  short: string;
  terrain: Terrain;
  water: boolean;
  note: string;
}

/** North is row 0. Orthogonal neighbors only — diagonals are not borders. */
export const PLOTS: PlotDef[] = [
  { index: 0, name: "Bristol Notch", short: "Bristol", terrain: "mountain", water: false, note: "Ridge" },
  { index: 1, name: "Hogback", short: "Hogback", terrain: "mountain", water: false, note: "Ridge" },
  { index: 2, name: "Lincoln Gap", short: "Lincoln", terrain: "mountain", water: true, note: "Spring" },
  { index: 3, name: "Ripton Woods", short: "Ripton", terrain: "forest", water: false, note: "Woods" },
  { index: 4, name: "New Haven River", short: "New Haven", terrain: "river", water: true, note: "River" },
  { index: 5, name: "Bartlett Falls", short: "Bartlett", terrain: "river", water: true, note: "Falls" },
  { index: 6, name: "Middlebury Falls", short: "Falls", terrain: "river", water: true, note: "Falls" },
  { index: 7, name: "Otter Creek", short: "Otter", terrain: "river", water: true, note: "River" },
  { index: 8, name: "Vergennes Wharf", short: "Wharf", terrain: "town", water: true, note: "Wharf" },
  { index: 9, name: "Ferrisburgh", short: "Ferrisburgh", terrain: "town", water: false, note: "Town" },
  { index: 10, name: "Middlebury Green", short: "Green", terrain: "town", water: false, note: "Town" },
  { index: 11, name: "East Middlebury", short: "East Mid.", terrain: "town", water: true, note: "Ford" },
  { index: 12, name: "Shoreham Orchard", short: "Shoreham", terrain: "field", water: false, note: "Field" },
  { index: 13, name: "Addison Flats", short: "Addison", terrain: "field", water: false, note: "Field" },
  { index: 14, name: "Cornwall Meadow", short: "Cornwall", terrain: "field", water: false, note: "Field" },
  { index: 15, name: "Salisbury Marsh", short: "Marsh", terrain: "marsh", water: true, note: "Marsh" },
];

export function plotIndex(row: number, col: number): number {
  return row * 4 + col;
}

export function plotRow(index: number): number {
  return Math.floor(index / 4);
}

export function plotCol(index: number): number {
  return index % 4;
}

export function neighbors(index: number): number[] {
  const row = plotRow(index);
  const col = plotCol(index);
  const out: number[] = [];
  if (row > 0) out.push(index - 4);
  if (row < 3) out.push(index + 4);
  if (col > 0) out.push(index - 1);
  if (col < 3) out.push(index + 1);
  return out;
}

export function adjacent(a: number, b: number): boolean {
  return neighbors(a).includes(b);
}
