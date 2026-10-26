/**
 * Lookahead pull against an audio clock. The caller asks "what is due before
 * horizon?" and the cursor only moves forward, so a note is offered once.
 */

export type ScheduleCursor = {
  next: number;
};

export function createCursor(): ScheduleCursor {
  return { next: 0 };
}

export function pullDue<T extends { at: number }>(
  events: T[],
  cursor: ScheduleCursor,
  now: number,
  horizonSec: number,
): { cursor: ScheduleCursor; due: T[] } {
  const horizon = now + horizonSec;
  const due: T[] = [];
  let next = cursor.next;
  while (next < events.length && events[next]!.at < horizon) {
    const event = events[next]!;
    if (event.at >= now - 0.05) due.push(event);
    next += 1;
  }
  return { cursor: { next }, due };
}

/**
 * A second trigger for the same pitch within `gapSec` is dropped.
 * Used so a doubled touch/key cannot stack the same note.
 */
export function allowVoice(
  recent: Map<string, number>,
  key: string,
  when: number,
  gapSec = 0.02,
): boolean {
  const prev = recent.get(key);
  if (prev !== undefined && Math.abs(when - prev) < gapSec) return false;
  recent.set(key, when);
  return true;
}
