import { PANTRY_TOTAL_CAP, PER_STACK_CAP, POT_CAP, STOOP_TOTAL_CAP } from "./constants.ts";
import { INGREDIENTS } from "./ingredients.ts";
import type { KitchenState } from "./types.ts";

export function total(bag: Record<string, number>): number {
  let n = 0;
  for (const count of Object.values(bag)) n += count;
  return n;
}

export function withCount(
  bag: Record<string, number>,
  id: string,
  count: number,
): Record<string, number> {
  const next = { ...bag };
  if (count <= 0) delete next[id];
  else next[id] = count;
  return next;
}

function trimTo(bag: Record<string, number>, cap: number): Record<string, number> {
  const next: Record<string, number> = {};
  let used = 0;
  for (const [id, count] of Object.entries(bag)) {
    if (!INGREDIENTS[id] || count <= 0 || used >= cap) continue;
    const room = Math.min(PER_STACK_CAP, cap - used, count);
    if (room <= 0) continue;
    next[id] = room;
    used += room;
  }
  return next;
}

export function sanitizeBag(
  value: unknown,
  totalCap: number,
): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const raw: Record<string, number> = {};
  for (const [id, count] of Object.entries(value as Record<string, unknown>)) {
    if (!INGREDIENTS[id]) continue;
    const n = Math.floor(Number(count));
    if (!Number.isFinite(n) || n <= 0) continue;
    raw[id] = Math.min(PER_STACK_CAP, n);
  }
  return trimTo(raw, totalCap);
}

export type ReceiveResult = {
  state: KitchenState;
  accepted: number;
  toStoop: number;
  leftOutside: number;
};

/** Add ingredients. Overflow waits on the stoop. Anything past both caps is refused, not destroyed. */
export function receiveIngredients(
  state: KitchenState,
  id: string,
  count: number,
): ReceiveResult {
  if (!INGREDIENTS[id] || count <= 0) {
    return { state, accepted: 0, toStoop: 0, leftOutside: Math.max(0, count) };
  }
  const pantry = { ...state.pantry };
  const stoop = { ...state.stoop };
  let left = Math.floor(count);
  const intoPantry = Math.max(
    0,
    Math.min(left, PER_STACK_CAP - (pantry[id] ?? 0), PANTRY_TOTAL_CAP - total(pantry)),
  );
  if (intoPantry > 0) {
    pantry[id] = (pantry[id] ?? 0) + intoPantry;
    left -= intoPantry;
  }
  const intoStoop = Math.max(
    0,
    Math.min(left, PER_STACK_CAP - (stoop[id] ?? 0), STOOP_TOTAL_CAP - total(stoop)),
  );
  if (intoStoop > 0) {
    stoop[id] = (stoop[id] ?? 0) + intoStoop;
    left -= intoStoop;
  }
  return {
    state: { ...state, pantry, stoop },
    accepted: intoPantry,
    toStoop: intoStoop,
    leftOutside: left,
  };
}

export function returnAll(
  state: KitchenState,
  bag: Record<string, number>,
): { state: KitchenState; leftOutside: number } {
  let next = state;
  let leftOutside = 0;
  for (const [id, count] of Object.entries(bag)) {
    const rec = receiveIngredients(next, id, count);
    next = rec.state;
    leftOutside += rec.leftOutside;
  }
  return { state: next, leftOutside };
}

export function potRoom(state: KitchenState): number {
  return Math.max(0, POT_CAP - total(state.pot));
}
