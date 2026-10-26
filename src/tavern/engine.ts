import { allowVoice } from "./scheduler.ts";
import type { InstrumentId } from "./types.ts";
import { VOICES, midiToHz } from "./voices.ts";
import type { VoiceNote } from "./performance.ts";

type AudioCtor = typeof AudioContext;

function audioCtor(): AudioCtor | null {
  const w = globalThis as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * The room's own audio context. It never looks for a global soundtrack.
 * Unlock from the sit-down gesture: `resume()` runs before this returns.
 */
export class TavernEngine {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private recent = new Map<string, number>();
  private _muted = false;
  private _holding = false;
  private _unlocked = false;

  get unlocked(): boolean {
    return this._unlocked;
  }

  get muted(): boolean {
    return this._muted;
  }

  get holding(): boolean {
    return this._holding;
  }

  unlock(): void {
    const Ctor = audioCtor();
    if (!Ctor) return;
    if (!this.ctx) {
      this.ctx = new Ctor({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.music.gain.value = this._muted ? 0 : 1;
      this.music.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.noise = makeNoise(this.ctx);
    }
    this._unlocked = true;
    this._holding = false;
    if (this.ctx.state !== "running") {
      void this.ctx.resume();
    }
  }

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  reportedLatency(): { base?: number; output?: number } {
    if (!this.ctx) return {};
    return {
      base: this.ctx.baseLatency,
      output: "outputLatency" in this.ctx ? this.ctx.outputLatency : undefined,
    };
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    if (!this.music || !this.ctx) return;
    this.music.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.03);
  }

  onVisibility(hidden: boolean): void {
    if (!this._unlocked || !this.ctx) return;
    if (hidden) {
      this._holding = true;
      if (this.ctx.state === "running") void this.ctx.suspend();
      return;
    }
    this._holding = false;
    if (this.ctx.state !== "running") void this.ctx.resume();
  }

  watchDevices(onChange: () => void): () => void {
    const devices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!devices?.addEventListener) return () => {};
    const fn = () => onChange();
    devices.addEventListener("devicechange", fn);
    return () => devices.removeEventListener("devicechange", fn);
  }

  /** Silence the graph and drop the context when the player leaves the room. */
  release(): void {
    this._holding = true;
    if (this.ctx && this.ctx.state !== "closed") {
      void this.ctx.suspend();
    }
  }

  play(note: VoiceNote, playerInstrument: InstrumentId, tonic: number): void {
    if (!this.ctx || !this.music) return;
    const instrument: InstrumentId = note.instrument === "player" ? playerInstrument : note.instrument;
    const when = Math.max(this.ctx.currentTime, note.at);
    const key = `${instrument}:${note.midi}:${Math.round(when * 50)}`;
    if (!allowVoice(this.recent, key, when, 0.02)) return;
    if (this.recent.size > 80) {
      const cutoff = when - 1;
      for (const [k, t] of this.recent) if (t < cutoff) this.recent.delete(k);
    }
    const midi = instrument !== "spoons" && note.midi < 0 ? tonic : note.midi;
    if (instrument === "spoons") {
      this.playSpoons(when, note.velocity);
      return;
    }
    if (instrument === "guitar") this.playGuitar(when, midi, note.durSec, note.velocity, note.detuneCents);
    else this.playFiddle(when, midi, note.durSec, note.velocity, note.detuneCents);
  }

  private dest(): AudioNode | null {
    return this.music;
  }

  private playFiddle(when: number, midi: number, dur: number, velocity: number, detune: number): void {
    const ctx = this.ctx;
    const dest = this.dest();
    if (!ctx || !dest) return;
    const voice = VOICES.fiddle;
    const freq = midiToHz(midi);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, when);
    filter.frequency.exponentialRampToValueAtTime(1100, when + Math.min(0.4, Math.max(0.08, dur)));
    const g = ctx.createGain();
    applyEnvelope(g.gain, when, dur, voice.peak * velocity, voice);
    filter.connect(g);
    g.connect(dest);
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, when);
    osc.detune.setValueAtTime(detune, when);
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq, when);
    osc2.detune.setValueAtTime(voice.detuneCents + detune, when);
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(5.1, when);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(5, when);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    osc.connect(filter);
    osc2.connect(filter);
    const stop = when + dur + voice.release + 0.05;
    osc.start(when);
    osc2.start(when);
    lfo.start(when);
    osc.stop(stop);
    osc2.stop(stop);
    lfo.stop(stop);
    osc.onended = () => {
      osc.disconnect();
      osc2.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  private playGuitar(when: number, midi: number, dur: number, velocity: number, detune: number): void {
    const ctx = this.ctx;
    const dest = this.dest();
    if (!ctx || !dest || !this.noise) return;
    const voice = VOICES.guitar;
    const freq = midiToHz(midi);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, when);
    filter.frequency.exponentialRampToValueAtTime(500, when + Math.min(0.35, Math.max(0.08, dur)));
    const g = ctx.createGain();
    applyEnvelope(g.gain, when, Math.min(dur, 0.9), voice.peak * velocity, voice);
    filter.connect(g);
    g.connect(dest);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, when);
    osc.detune.setValueAtTime(detune, when);
    osc.connect(filter);
    const burst = ctx.createBufferSource();
    burst.buffer = this.noise;
    const burstGain = ctx.createGain();
    burstGain.gain.setValueAtTime(0.0001, when);
    burstGain.gain.exponentialRampToValueAtTime(voice.peak * velocity * 0.45, when + 0.004);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    burst.connect(burstGain);
    burstGain.connect(filter);
    const stop = when + Math.min(dur, 0.9) + voice.release + 0.05;
    osc.start(when);
    burst.start(when);
    osc.stop(stop);
    burst.stop(when + 0.06);
    osc.onended = () => {
      osc.disconnect();
      burst.disconnect();
      burstGain.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  private playSpoons(when: number, velocity: number): void {
    const ctx = this.ctx;
    const dest = this.dest();
    if (!ctx || !dest || !this.noise) return;
    const voice = VOICES.spoons;
    const hit = (at: number, gainScale: number) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.setValueAtTime(700, at);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(1600, at);
      bp.Q.setValueAtTime(0.8, at);
      const g = ctx.createGain();
      const peak = Math.max(0.001, voice.peak * velocity * gainScale);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, at + voice.decay + voice.release);
      src.connect(hp);
      hp.connect(bp);
      bp.connect(g);
      g.connect(dest);
      src.start(at);
      src.stop(at + 0.08);
      src.onended = () => {
        src.disconnect();
        hp.disconnect();
        bp.disconnect();
        g.disconnect();
      };
    };
    hit(when, 1);
    hit(when + 0.018, 0.62);
  }
}

function applyEnvelope(
  gain: AudioParam,
  when: number,
  dur: number,
  peak: number,
  voice: { attack: number; decay: number; sustain: number; release: number },
): void {
  const p = Math.max(0.001, peak);
  const s = Math.max(0.0008, p * Math.max(0.02, voice.sustain));
  const attackAt = when + Math.max(0.001, voice.attack);
  const decayAt = attackAt + Math.max(0.001, voice.decay);
  const releaseAt = Math.max(decayAt, when + Math.max(0.02, dur));
  gain.setValueAtTime(0.0001, when);
  gain.linearRampToValueAtTime(p, attackAt);
  gain.exponentialRampToValueAtTime(s, decayAt);
  gain.setValueAtTime(s, releaseAt);
  gain.exponentialRampToValueAtTime(0.0001, releaseAt + voice.release);
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let s = 1;
  for (let i = 0; i < length; i += 1) {
    s = (s * 16807) % 2147483647;
    data[i] = s / 2147483647 * 2 - 1;
  }
  return buffer;
}
