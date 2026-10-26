import { parseLine } from "./notation.ts";
import type { AutoSound, Chart, Cue, Gesture, InstrumentId } from "./types.ts";
import type { Composition, Slot } from "./storage.ts";

export const SLOT_COUNT = 8;
export const SLOT_STEPS = 4;

export const HOMES = [
  { id: "d", name: "Warm D", tonic: 62 },
  { id: "g", name: "Open G", tonic: 67 },
  { id: "c", name: "Easy C", tonic: 60 },
] as const;

/** Short original gestures in D, transposed to the chosen home. */
export const SIGNATURES: Record<Gesture, string> = {
  lift: "D4 F#4 A4 C5",
  settle: "A4 F#4 E4 D4",
  stamp: "D4 R D4 D4",
  hold: "D4*4",
};

const HOME_D = 62;

export function emptySlots(): Slot[] {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

export function transposeMidi(midi: number, tonic: number): number {
  if (midi < 0) return midi;
  return midi + (tonic - HOME_D);
}

export function signatureMotif(gesture: Gesture, tonic: number) {
  return parseLine(SIGNATURES[gesture]).notes.map((n) => ({
    ...n,
    midi: transposeMidi(n.midi, tonic),
  }));
}

export function quantizeSlot(clock: number, origin: number, stepSec: number): number {
  const step = Math.round((clock - origin) / stepSec);
  const loop = SLOT_COUNT * SLOT_STEPS;
  const wrapped = ((step % loop) + loop) % loop;
  return Math.floor(wrapped / SLOT_STEPS);
}

export function paintSlot(slots: Slot[], index: number, gesture: Gesture): Slot[] {
  const next = slots.slice();
  next[index] = { gesture, phrase: gesture };
  return next;
}

export function compositionChart(comp: Composition): Chart {
  const cues: Cue[] = [];
  const auto: AutoSound[] = [];
  comp.slots.forEach((slot, index) => {
    const step = index * SLOT_STEPS;
    if (!slot) {
      auto.push({
        id: `rest-${index}`,
        step,
        midi: comp.home - 12,
        dur: 0.5,
        velocity: 0.12,
        instrument: "guitar",
        detuneCents: 0,
      });
      return;
    }
    signatureMotif(slot.gesture, comp.home).forEach((n, noteIndex) => {
      auto.push({
        id: `${comp.id}-${index}-${noteIndex}`,
        step: step + n.step,
        midi: n.midi,
        dur: n.dur,
        velocity: n.velocity,
        instrument: comp.instrument,
        detuneCents: 0,
      });
    });
    auto.push({
      id: `drone-${index}`,
      step,
      midi: comp.home - 12,
      dur: SLOT_STEPS * 0.9,
      velocity: 0.2,
      instrument: comp.instrument === "guitar" ? "fiddle" : "guitar",
      detuneCents: 0,
    });
  });
  return {
    id: `comp:${comp.id}`,
    pieceId: comp.id,
    title: comp.title,
    bpm: comp.bpm,
    stepsPerBar: 4,
    tonic: comp.home,
    countIn: 0,
    totalSteps: SLOT_COUNT * SLOT_STEPS,
    cues,
    companions: [],
    auto,
  };
}

export function freeNotes(gesture: Gesture, tonic: number, instrument: InstrumentId) {
  return {
    motif: signatureMotif(gesture, tonic),
    instrument,
  };
}

export function newComposition(
  partial: Pick<Composition, "title" | "instrument" | "home" | "bpm" | "slots"> & { id?: string },
): Composition {
  return {
    id: partial.id ?? `tune-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
    title: partial.title.trim().slice(0, 80) || "Untitled tune",
    instrument: partial.instrument,
    home: partial.home,
    bpm: partial.bpm,
    slots: partial.slots.slice(0, 8),
    createdAt: new Date().toISOString(),
  };
}
