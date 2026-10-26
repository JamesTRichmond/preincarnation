import type { BiteBeat, BiteRuntime, FishProfile, Glyph } from "./types.ts";

export function createBite(species: FishProfile, wide: boolean): BiteRuntime {
  const beats: BiteBeat[] = species.bite.map((beat) => ({
    glyph: beat.glyph,
    ms: beat.commit && wide ? Math.round(beat.ms * 2.15) : beat.ms,
    commit: beat.commit,
  }));
  return {
    speciesId: species.id,
    beats,
    index: 0,
    intoMs: 0,
    outcome: "pending",
    earlySpook: species.earlySpook,
  };
}

export function currentBeat(bite: BiteRuntime): BiteBeat | null {
  return bite.beats[bite.index] ?? null;
}

export function stepBite(bite: BiteRuntime, dt: number, hookHeld: boolean): BiteRuntime {
  if (bite.outcome !== "pending") return bite;
  const beat = bite.beats[bite.index];
  if (!beat) return { ...bite, outcome: "miss" };
  if (hookHeld && !beat.commit && bite.earlySpook) {
    return { ...bite, outcome: "early" };
  }
  if (hookHeld && beat.commit) {
    return { ...bite, outcome: "hooked", intoMs: bite.intoMs + dt * 1000 };
  }
  const intoMs = bite.intoMs + Math.max(0, dt) * 1000;
  if (intoMs < beat.ms) return { ...bite, intoMs };
  const index = bite.index + 1;
  if (index >= bite.beats.length) return { ...bite, index, intoMs: 0, outcome: "miss" };
  return { ...bite, index, intoMs: 0 };
}

export function tellSentence(beats: BiteBeat[]): string {
  const words: Record<Glyph, string> = {
    tick: "tick",
    dip: "dip",
    walk: "walk",
    surge: "surge",
    still: "pause",
  };
  const parts = beats.map((beat) => (beat.commit ? `${words[beat.glyph]} — set` : words[beat.glyph]));
  return parts.join(", ");
}
