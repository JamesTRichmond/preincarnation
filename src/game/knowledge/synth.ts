import { INSTRUMENTS, midiToHz } from "./instruments.ts";
import type { ScheduledNote } from "./types.ts";

/** Deterministic PCM for a scheduled piece. Used by the plate renderer and the silence check. */
export function renderPcm(notes: ScheduledNote[], sampleRate: number, seconds: number): Float32Array {
  const length = Math.max(1, Math.ceil((seconds + 0.2) * sampleRate));
  const pcm = new Float32Array(length);
  const noise = makeNoise(length, 0x7461);
  for (const note of notes) {
    const inst = INSTRUMENTS[note.instrument];
    const hz = midiToHz(note.midi);
    const start = Math.floor(note.startSec * sampleRate);
    const end = Math.min(length, Math.floor((note.endSec + inst.release) * sampleRate));
    for (let i = start; i < end; i++) {
      const t = (i - start) / sampleRate;
      const dur = note.endSec - note.startSec;
      const env = envelope(t, dur, inst.attack, inst.release);
      if (env <= 0) continue;
      let sample = 0;
      if (inst.drum) {
        const n = noise[i] ?? 0;
        if (note.midi <= 38) {
          const body = Math.sin(2 * Math.PI * (90 + 40 * Math.exp(-t * 30)) * t);
          sample = body * 0.9 + n * 0.15 * Math.exp(-t * 40);
        } else {
          sample = n * Math.exp(-t * (note.midi > 44 ? 28 : 18));
        }
      } else if (inst.id === "bone-flute") {
        sample =
          Math.sin(2 * Math.PI * hz * t) * 0.75 +
          Math.sin(2 * Math.PI * hz * 2 * t) * 0.08 +
          (noise[i] ?? 0) * 0.03;
      } else if (inst.id === "lyre") {
        const decay = Math.exp(-t * 3.2);
        sample =
          (Math.sin(2 * Math.PI * hz * t) * 0.7 +
            Math.sin(2 * Math.PI * hz * 2 * t) * 0.18 +
            Math.sin(2 * Math.PI * hz * 3 * t) * 0.06) *
          decay;
      } else if (inst.id === "bowed-box") {
        sample =
          Math.sin(2 * Math.PI * hz * t) * 0.55 +
          Math.sin(2 * Math.PI * hz * 2 * t) * 0.2 +
          Math.sin(2 * Math.PI * hz * 3 * t) * 0.1 +
          Math.sin(2 * Math.PI * hz * 4 * t) * 0.05;
      } else {
        sample =
          Math.sin(2 * Math.PI * hz * t) * 0.65 +
          Math.sin(2 * Math.PI * hz * 2.0 * t) * 0.12 * Math.exp(-t * 4) +
          Math.sin(2 * Math.PI * hz * 3 * t) * 0.08 * Math.exp(-t * 6);
      }
      pcm[i] += sample * env * note.vel * 0.28;
    }
  }
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  if (peak > 0.98) {
    const g = 0.98 / peak;
    for (let i = 0; i < pcm.length; i++) pcm[i] *= g;
  }
  return pcm;
}

export function rms(pcm: Float32Array): number {
  let s = 0;
  for (let i = 0; i < pcm.length; i++) s += pcm[i] * pcm[i];
  return Math.sqrt(s / pcm.length);
}

function envelope(t: number, dur: number, attack: number, release: number): number {
  if (t < 0) return 0;
  const a = attack <= 0 ? 1 : Math.min(1, t / attack);
  if (t < dur) return a;
  const rel = release <= 0 ? 0 : Math.max(0, 1 - (t - dur) / release);
  return a * rel;
}

function makeNoise(length: number, seed: number): Float32Array {
  let x = seed || 1;
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    out[i] = ((x >>> 0) / 4294967295) * 2 - 1;
  }
  return out;
}

export function encodeWav(pcm: Float32Array, sampleRate: number): Uint8Array {
  const bytes = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + bytes);
  const view = new DataView(buffer);
  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(view, 36, "data");
  view.setUint32(40, bytes, true);
  let o = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return new Uint8Array(buffer);
}

function writeStr(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}
