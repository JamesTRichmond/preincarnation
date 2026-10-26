/** Portable Fourteen Winters contract.
 * Heat carries between nights and is spent only to cover frost the shelter did not.
 * Frost is 2 for winters 1–3, then rises by 1 every three winters.
 * A pass-only opening (hearth 5, heat 0, no mend) loses a 3-winter match.
 */

export const START = {
  hearth: 5,
  heat: 0,
  ration: 7,
  ink: 3,
  cellar: 0,
  mend: 0,
} as const;

export const CAPS = {
  hearth: 10,
  heat: 6,
  ration: 9,
  ink: 6,
  cellar: 4,
  mend: 4,
  shelter: 6,
} as const;

export function frostPressure(winter: number): number {
  return 2 + Math.floor((Math.max(1, winter) - 1) / 3);
}
