import type { FestivalId } from "../types.ts";

/** Gatherings open on an authored week. Nothing here waits on a real clock. */
export const REAL_TIME_WAIT_MS = 0;
export const LAST_WEEK = 23;

export const POSTINGS: Array<{ id: FestivalId; openWeek: number; label: string }> = [
  { id: "sap-night", openWeek: 0, label: "Late March" },
  { id: "river-sunday", openWeek: 4, label: "June" },
  { id: "grange-fair", openWeek: 8, label: "August" },
  { id: "harvest-supper", openWeek: 12, label: "October" },
  { id: "solstice-hearth", openWeek: 16, label: "December" },
  { id: "frost-walk", openWeek: 20, label: "January" },
];

export function postingFor(id: FestivalId) {
  const posting = POSTINGS.find((item) => item.id === id);
  if (!posting) throw new Error(`Unknown gathering: ${id}`);
  return posting;
}

export function isSeasonOpen(townWeek: number, id: FestivalId): boolean {
  return townWeek >= postingFor(id).openWeek;
}

export function weekLabel(townWeek: number): string {
  const current = [...POSTINGS].reverse().find((item) => item.openWeek <= townWeek) ?? POSTINGS[0];
  const into = townWeek - current.openWeek;
  if (into <= 0) return current.label;
  if (into === 1) return `${current.label}, the week after`;
  return `${current.label}, ${into} weeks on`;
}

export function turnTheWeek(townWeek: number): number {
  return Math.min(LAST_WEEK, townWeek + 1);
}

/** Jump to the next authored posting. Synchronous. No delay. */
export function nextPosting(townWeek: number) {
  return POSTINGS.find((item) => item.openWeek > townWeek) ?? null;
}

export function currentPostingId(townWeek: number): FestivalId {
  const current = [...POSTINGS].reverse().find((item) => item.openWeek <= townWeek);
  return current?.id ?? "sap-night";
}
