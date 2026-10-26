import type { InstrumentId } from "./types.ts";

/**
 * Shared voice design for the browser synth and the offline reference render.
 * They are not sample-identical: the browser uses Web Audio nodes, the file
 * render uses additive sines plus noise. Envelope numbers are the contract.
 */
export type VoiceDesign = {
  peak: number;
  attack: number;
  decay: number;
  /** Level after the decay, as a fraction of peak, held until release. */
  sustain: number;
  release: number;
  /** Harmonic weights for the pitched reference render. Empty → noise. */
  harmonics: number[];
  detuneCents: number;
};

export const VOICES: Record<InstrumentId, VoiceDesign> = {
  fiddle: {
    peak: 0.15,
    attack: 0.03,
    decay: 0.11,
    sustain: 0.72,
    release: 0.07,
    harmonics: [1, 0.42, 0.22, 0.1, 0.05],
    detuneCents: 7,
  },
  guitar: {
    peak: 0.2,
    attack: 0.004,
    decay: 0.32,
    sustain: 0.08,
    release: 0.05,
    harmonics: [1, 0.28, 0.14, 0.06],
    detuneCents: 3,
  },
  spoons: {
    peak: 0.22,
    attack: 0.001,
    decay: 0.05,
    sustain: 0,
    release: 0.02,
    harmonics: [],
    detuneCents: 0,
  },
};

export const INSTRUMENTS = [
  {
    id: "fiddle",
    name: "The Bow",
    tool: "Fiddle",
    line: "You carry the tune.",
    yield: "Cal turns the fiddle, scroll first.",
  },
  {
    id: "guitar",
    name: "The Chair",
    tool: "Guitar",
    line: "You hold the room.",
    yield: "Mira pats the chair beside her.",
  },
  {
    id: "spoons",
    name: "The Pocket",
    tool: "Spoons",
    line: "You mark the steps.",
    yield: "June offers the spoons, still warm.",
  },
] as const;

export const GESTURES = [
  { id: "lift", label: "Lift", hint: "A rising answer", keys: "F or 1" },
  { id: "settle", label: "Settle", hint: "Set it down", keys: "J or 2" },
  { id: "stamp", label: "Stamp", hint: "Mark the step", keys: "K or 3" },
  { id: "hold", label: "Hold", hint: "Let it rest", keys: "L, 4, or Space" },
] as const;

export function gestureLabel(id: string): string {
  return GESTURES.find((g) => g.id === id)?.label ?? id;
}

/** Midi 60 is C4. Unpitched knocks stay unpitched. */
export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
