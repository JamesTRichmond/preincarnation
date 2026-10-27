export type AudioBed = "county" | "combat" | "death" | "limbo" | "kitchen" | "quarry";

export function bedFor(state: { mode: string; mapId: string; fighting: boolean }): AudioBed {
  if (state.mode === "limbo" || state.mode === "ending") return "limbo";
  if (state.mode === "kitchen") return "kitchen";
  if (state.fighting && state.mode === "play") return "combat";
  if (state.mapId === "quarry" && state.mode === "play") return "quarry";
  return "county";
}

export function bedSpec(bed: AudioBed): { limbo: boolean; root: number; fifth: number | null } {
  if (bed === "limbo" || bed === "death") return { limbo: true, root: 55, fifth: null };
  if (bed === "combat") return { limbo: false, root: 73, fifth: 110 };
  if (bed === "kitchen") return { limbo: false, root: 196, fifth: 247 };
  if (bed === "quarry") return { limbo: false, root: 82, fifth: 123 };
  return { limbo: false, root: 98, fifth: 147 };
}

export function clampVolume(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
