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

export type StrikeVoice = {
  freq: number;
  dur: number;
  type: "square" | "sawtooth" | "sine" | "triangle";
  slide: number;
};

/** Same mixer. The body you hit picks the note. Unknown kinds keep the old thud. */
const STRIKE: Record<string, StrikeVoice> = {
  crow: { freq: 880, dur: 0.06, type: "square", slide: -420 },
  wraith: { freq: 170, dur: 0.16, type: "sine", slide: -50 },
  sentinel: { freq: 68, dur: 0.2, type: "square", slide: -18 },
  bear: { freq: 86, dur: 0.18, type: "sawtooth", slide: -36 },
  bobcat: { freq: 340, dur: 0.07, type: "triangle", slide: 160 },
  fisher: { freq: 1380, dur: 0.05, type: "square", slide: -860 },
  resident: { freq: 220, dur: 0.11, type: "triangle", slide: -70 },
};

const THUD: StrikeVoice = { freq: 160, dur: 0.14, type: "sawtooth", slide: -90 };

export function strikeVoice(kind: string): StrikeVoice {
  return STRIKE[kind] ?? THUD;
}
