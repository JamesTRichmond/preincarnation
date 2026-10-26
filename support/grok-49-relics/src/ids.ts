/** Reserved range: loot.relic.001–096. No other band may mint these ids. */

export type RelicId = `loot.relic.${string}`;

const ID_RE = /^loot\.relic\.(\d{3})$/;

export function relicId(n: number): RelicId {
  if (!Number.isInteger(n) || n < 1 || n > 96) {
    throw new Error(`Relic number ${n} is outside the reserved band 001–096`);
  }
  return `loot.relic.${String(n).padStart(3, "0")}` as RelicId;
}

export function parseRelicId(id: string): RelicId {
  const match = ID_RE.exec(id);
  if (!match) throw new Error(`Not a relic id: ${id}`);
  const n = Number(match[1]);
  if (n < 1 || n > 96) throw new Error(`Relic id ${id} is outside 001–096`);
  return id as RelicId;
}

export function relicNumber(id: RelicId): number {
  return Number(id.slice("loot.relic.".length));
}
