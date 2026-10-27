export type AudioBed = "county" | "combat" | "death" | "limbo" | "kitchen" | "quarry";

export function bedFor(state: { mode: string; mapId: string; fighting: boolean }): AudioBed {
  if (state.mode === "limbo" || state.mode === "ending") return "limbo";
  if (state.mode === "kitchen") return "kitchen";
  if (state.fighting && state.mode === "play") return "combat";
  if (state.mapId === "quarry" && state.mode === "play") return "quarry";
  return "county";
}

export function bedSpec(bed: AudioBed): { limbo: boolean; root: number; fifth: number | null; wobble: number } {
  if (bed === "limbo" || bed === "death") return { limbo: true, root: 55, fifth: null, wobble: 0.35 };
  if (bed === "combat") return { limbo: false, root: 73, fifth: 110, wobble: 0.12 };
  if (bed === "kitchen") return { limbo: false, root: 196, fifth: 247, wobble: 0.55 };
  if (bed === "quarry") return { limbo: false, root: 82, fifth: 123, wobble: 0.22 };
  return { limbo: false, root: 98, fifth: 147, wobble: 1.1 };
}

export function clampVolume(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
