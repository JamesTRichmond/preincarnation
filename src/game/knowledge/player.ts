import { INSTRUMENTS, midiToHz } from "./instruments.ts";
import { schedule } from "./scheduler.ts";
import type { Piece } from "./types.ts";

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let live: AudioScheduledSourceNode[] = [];

export function unlockAudio(): AudioContext {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!ctx) ctx = new Ctx({ latencyHint: "interactive" });
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function stopMusic(): void {
  for (const node of live) {
    try {
      node.stop();
    } catch {
      /* already ended */
    }
  }
  live = [];
}

export function playScheduled(piece: Piece, opts: { cents: number; damp: boolean; onEnded?: () => void }): number {
  const audio = unlockAudio();
  stopMusic();
  const scheduled = schedule(piece);
  if (!scheduled.ok) return 0;
  const inst = INSTRUMENTS[piece.instrument];
  const master = audio.createGain();
  master.gain.value = 0.4;
  master.connect(audio.destination);
  const t0 = audio.currentTime + 0.06;
  let latest = t0;
  for (const note of scheduled.notes) {
    const start = t0 + note.startSec;
    const end = t0 + note.endSec;
    const release = inst.drum && opts.damp ? inst.release * 0.4 : inst.release;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, note.vel * (inst.drum ? 0.55 : 0.2)), start + Math.max(0.005, inst.attack));
    gain.gain.exponentialRampToValueAtTime(0.0001, end + release);
    gain.connect(master);
    if (inst.drum) {
      const src = audio.createBufferSource();
      src.buffer = drumNoise(audio);
      const filter = audio.createBiquadFilter();
      if (note.midi <= 38) {
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(180, start);
      } else if (note.midi < 45) {
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(900, start);
      } else {
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1400, start);
      }
      src.connect(filter);
      filter.connect(gain);
      src.start(start);
      src.stop(end + release + 0.02);
      live.push(src);
    } else {
      const osc = audio.createOscillator();
      osc.type = inst.id === "bowed-box" ? "sawtooth" : inst.id === "bone-flute" ? "sine" : "triangle";
      osc.frequency.setValueAtTime(midiToHz(note.midi), start);
      osc.detune.setValueAtTime(opts.cents, start);
      osc.connect(gain);
      osc.start(start);
      osc.stop(end + release + 0.02);
      live.push(osc);
    }
    latest = Math.max(latest, end + release);
  }
  const tail = live[live.length - 1];
  if (tail && opts.onEnded) tail.onended = () => opts.onEnded?.();
  return latest - t0;
}

function drumNoise(audio: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === audio.sampleRate) return noise;
  const length = Math.floor(audio.sampleRate * 0.35);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let x = 0x7461;
  for (let i = 0; i < length; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    data[i] = ((x >>> 0) / 4294967295) * 2 - 1;
  }
  noise = buffer;
  return buffer;
}
