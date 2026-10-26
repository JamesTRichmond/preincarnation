import { VOICES, midiToHz } from "./voices.ts";
import type { InstrumentId } from "./types.ts";

export type RenderNote = {
  at: number;
  midi: number;
  durSec: number;
  velocity: number;
  instrument: InstrumentId;
};

export type RenderResult = {
  pcm: Float32Array;
  sampleRate: number;
  /** Peak before any safety scale. */
  peakBefore: number;
  peak: number;
  rms: number;
};

function envelope(t: number, dur: number, attack: number, decay: number, sustain: number, release: number): number {
  if (t < 0) return 0;
  if (t < attack) return t / Math.max(0.0005, attack);
  if (t < attack + decay) {
    const k = (t - attack) / Math.max(0.0005, decay);
    return 1 + (sustain - 1) * k;
  }
  if (t < dur) return sustain;
  const rel = (t - dur) / Math.max(0.0005, release);
  if (rel >= 1) return 0;
  return sustain * (1 - rel);
}

function noise(seedRef: { s: number }): number {
  seedRef.s = (seedRef.s * 16807) % 2147483647;
  return (seedRef.s / 2147483647) * 2 - 1;
}

/**
 * Reference render of the written notes. Additive sines and noise — not the
 * browser's Web Audio graph, and not a studio recording.
 */
export function renderNotes(notes: RenderNote[], sampleRate = 16000): RenderResult {
  const end = notes.reduce((max, note) => Math.max(max, note.at + note.durSec + 0.2), 0.2);
  const length = Math.max(1, Math.ceil(end * sampleRate));
  const pcm = new Float32Array(length);
  const seed = { s: 1 };
  for (const note of notes) {
    const voice = VOICES[note.instrument];
    const start = Math.floor(Math.max(0, note.at) * sampleRate);
    const samples = Math.floor((note.durSec + voice.release + 0.02) * sampleRate);
    const freq = note.midi < 0 ? 740 : midiToHz(note.midi);
    for (let i = 0; i < samples; i += 1) {
      const idx = start + i;
      if (idx >= length) break;
      const t = i / sampleRate;
      const env = envelope(t, note.durSec, voice.attack, voice.decay, voice.sustain, voice.release);
      let sample = 0;
      if (note.instrument === "spoons" || note.midi < 0) {
        const tick = (at: number) => {
          const dt = t - at;
          if (dt < 0 || dt > 0.045) return 0;
          return noise(seed) * Math.exp(-dt * 70);
        };
        sample = tick(0) + tick(0.018) * 0.55;
      } else {
        for (let h = 0; h < voice.harmonics.length; h += 1) {
          const weight = voice.harmonics[h] ?? 0;
          const partial = freq * (h + 1) * (h === 0 ? 1 : 1 + voice.detuneCents / 1200);
          sample += Math.sin(2 * Math.PI * partial * t) * weight;
        }
      }
      pcm[idx] = (pcm[idx] ?? 0) + sample * env * voice.peak * note.velocity;
    }
  }
  let peakBefore = 0;
  let energy = 0;
  for (let i = 0; i < pcm.length; i += 1) {
    const s = pcm[i] ?? 0;
    peakBefore = Math.max(peakBefore, Math.abs(s));
    energy += s * s;
  }
  const scale = peakBefore > 0.9 ? 0.9 / peakBefore : 1;
  if (scale !== 1) {
    for (let i = 0; i < pcm.length; i += 1) pcm[i] = (pcm[i] ?? 0) * scale;
  }
  let peak = 0;
  for (let i = 0; i < pcm.length; i += 1) peak = Math.max(peak, Math.abs(pcm[i] ?? 0));
  return {
    pcm,
    sampleRate,
    peakBefore,
    peak,
    rms: Math.sqrt(energy / pcm.length),
  };
}

export function encodeWav(pcm: Float32Array, sampleRate: number): Uint8Array {
  const bytes = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + bytes);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, bytes, true);
  let o = 44;
  for (let i = 0; i < pcm.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, pcm[i] ?? 0));
    view.setInt16(o, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    o += 2;
  }
  return new Uint8Array(buffer);
}
