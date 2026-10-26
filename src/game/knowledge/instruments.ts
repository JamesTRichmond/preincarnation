import type { InstrumentId } from "./types.ts";

export type InstrumentDef = {
  id: InstrumentId;
  name: string;
  polyphony: number;
  minMidi: number;
  maxMidi: number;
  /** Drum voices ignore scale and map degree → midi. */
  drum: boolean;
  attack: number;
  release: number;
};

export const INSTRUMENTS: Record<InstrumentId, InstrumentDef> = {
  "bone-flute": {
    id: "bone-flute",
    name: "Bone flute",
    polyphony: 1,
    minMidi: 62,
    maxMidi: 86,
    drum: false,
    attack: 0.03,
    release: 0.08,
  },
  lyre: {
    id: "lyre",
    name: "Lyre",
    polyphony: 3,
    minMidi: 48,
    maxMidi: 79,
    drum: false,
    attack: 0.005,
    release: 0.45,
  },
  "frame-drum": {
    id: "frame-drum",
    name: "Frame drum",
    polyphony: 2,
    minMidi: 36,
    maxMidi: 50,
    drum: true,
    attack: 0.002,
    release: 0.12,
  },
  "bowed-box": {
    id: "bowed-box",
    name: "Bowed box",
    polyphony: 1,
    minMidi: 46,
    maxMidi: 70,
    drum: false,
    attack: 0.08,
    release: 0.12,
  },
  "bell-branch": {
    id: "bell-branch",
    name: "Bell branch",
    polyphony: 3,
    minMidi: 72,
    maxMidi: 98,
    drum: false,
    attack: 0.004,
    release: 0.7,
  },
};

export const DRUM_MIDI = [36, 42, 46] as const;

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
