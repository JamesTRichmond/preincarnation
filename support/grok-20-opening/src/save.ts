import { initialState } from "./state.ts";
import { SAVE_VERSION, type State } from "./types.ts";
import { MAPS } from "./world.ts";

export function serialize(state: State): string {
  return JSON.stringify(state);
}

export function hydrate(raw: string): State {
  try {
    const parsed = JSON.parse(raw) as Partial<State> | null;
    if (!parsed || parsed.version !== SAVE_VERSION) return initialState();
    if (!parsed.map || !(parsed.map in MAPS)) return initialState();
    if (!Array.isArray(parsed.inventory) || !parsed.flags || typeof parsed.x !== "number") return initialState();
    const base = initialState();
    return {
      ...base,
      ...parsed,
      flags: { ...base.flags, ...parsed.flags },
      seam: { ...base.seam, ...(parsed.seam ?? {}) },
      inventory: parsed.inventory,
      visited: Array.isArray(parsed.visited) ? parsed.visited : base.visited,
      explicitNotch: parsed.explicitNotch ?? null,
      sessionNotch: parsed.sessionNotch ?? null,
      agedNotch: parsed.agedNotch ?? null,
      continuity: parsed.continuity ?? null,
    };
  } catch {
    return initialState();
  }
}
