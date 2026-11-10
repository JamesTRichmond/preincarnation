/**
 * Isolated adaptive-music controller for PREINCARNATION.
 * No imports from a game engine. See ../ENGINE.md.
 *
 * Call unlock() synchronously inside a user gesture.
 */

import {
  equalPowerCurve,
  layerGain,
  masterTarget,
  menuDuck,
  veilAmount,
  type Intensity,
  type MenuMode,
} from "./music-logic.ts";

export type { Intensity, MenuMode };

export interface CueLayer {
  id: string;
  intensity: Intensity;
  label: string;
  file: string;
  peaks: number[];
}

export interface Cue {
  id: string;
  title: string;
  era: string;
  group: string;
  blurb: string;
  role: "music" | "sting" | "veil";
  bpm: number;
  bars: number;
  meter: [number, number];
  loop: boolean;
  fadeSec: number;
  menu: MenuMode;
  defaultIntensity: Intensity;
  duration: number;
  loopStart: number;
  loopEnd: number | null;
  mix: string;
  peaks: number[];
  layers: CueLayer[];
}

export interface ScoreManifest {
  title: string;
  kind: string;
  not: string;
  cues: Cue[];
}

export interface MusicState {
  context: AudioContextState | "uninitialized";
  muted: boolean;
  userSuspended: boolean;
  menu: boolean;
  intensity: Intensity;
  solo: number | null;
  current: string | null;
  incoming: string | null;
  mode: "idle" | "playing" | "transition" | "death";
  sting: boolean;
  loading: string | null;
  error: string | null;
}

export interface PlaybackClock {
  cueId: string | null;
  position: number;
  duration: number;
  running: boolean;
}

type Slot = {
  cue: Cue | null;
  cueGain: GainNode;
  duck: GainNode;
  layers: GainNode[];
  sources: AudioBufferSourceNode[];
  startedAt: number | null;
  gen: number;
};

const VEIL_ID = "menu-veil";
const STING_ID = "death-sting";

export class AdaptiveMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private slots: Slot[] = [];
  private active = 0;
  private veilGain: GainNode | null = null;
  private veilSource: AudioBufferSourceNode | null = null;
  private stingGain: GainNode | null = null;
  private stingSource: AudioBufferSourceNode | null = null;
  private buffers = new Map<string, AudioBuffer[]>();
  private cues = new Map<string, Cue>();
  private manifest: ScoreManifest | null = null;
  private muted = false;
  private userSuspended = false;
  private menu = false;
  private intensity: Intensity = 1;
  private solo: number | null = null;
  private mode: MusicState["mode"] = "idle";
  private stingOn = false;
  private loading: string | null = null;
  private error: string | null = null;
  private currentId: string | null = null;
  private incomingId: string | null = null;
  private listeners = new Set<(s: MusicState) => void>();
  private onVis = () => this.handleVisibility();
  private built = false;
  private generation = 0;
  private analyser: AnalyserNode | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;

  constructor(private readonly assetBase = "/score/") {}

  onChange(fn: (s: MusicState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getManifest(): ScoreManifest | null {
    return this.manifest;
  }

  getState(): MusicState {
    return {
      context: this.ctx?.state ?? "uninitialized",
      muted: this.muted,
      userSuspended: this.userSuspended,
      menu: this.menu,
      intensity: this.intensity,
      solo: this.solo,
      current: this.currentId,
      incoming: this.incomingId,
      mode: this.mode,
      sting: this.stingOn,
      loading: this.loading,
      error: this.error,
    };
  }

  /** Synchronous resume. Call from a click/keydown handler, not after an await. */
  unlock(): void {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.ctx) this.ctx = new Ctx({ latencyHint: "playback" });
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.ensureGraph();
    document.removeEventListener("visibilitychange", this.onVis);
    document.addEventListener("visibilitychange", this.onVis);
    this.emit();
  }

  useManifest(data: ScoreManifest): void {
    this.manifest = data;
    this.cues.clear();
    for (const cue of data.cues) this.cues.set(cue.id, cue);
  }

  async ensureManifest(): Promise<ScoreManifest> {
    if (this.manifest) return this.manifest;
    const res = await fetch(this.url("manifest.json"));
    if (!res.ok) throw new Error(`Score manifest failed (${res.status})`);
    const data = (await res.json()) as ScoreManifest;
    this.manifest = data;
    this.cues.clear();
    for (const cue of data.cues) this.cues.set(cue.id, cue);
    return data;
  }

  async warm(cueId: string): Promise<void> {
    await this.ensureManifest();
    if (!this.cues.has(cueId)) return;
    await this.loadCue(cueId);
  }

  /** Audio-clock position of the cue you can hear. Loops wrap at the file edge. */
  clock(): PlaybackClock {
    const id = this.incomingId || this.currentId;
    const slot = this.slots.find((item) => item.cue?.id === id) ?? null;
    const cue = slot?.cue ?? null;
    const duration = cue ? this.cueDuration(cue) : 0;
    const running =
      Boolean(cue && slot?.startedAt != null && this.ctx && this.ctx.state === "running") &&
      (this.mode === "playing" || this.mode === "transition") &&
      !this.userSuspended;
    if (!cue || !slot || slot.startedAt == null || !this.ctx) {
      return { cueId: id, position: 0, duration, running: false };
    }
    const elapsed = Math.max(0, this.ctx.currentTime - slot.startedAt);
    const position = cue.loop ? elapsed % duration : Math.min(elapsed, duration);
    return { cueId: cue.id, position, duration: duration || cue.duration, running };
  }

  /** Rough loudness of the music bus, 0–1. For the desk meter, not a measurement. */
  level(): number {
    if (!this.analyser || !this.timeData || this.ctx?.state !== "running") return 0;
    this.analyser.getByteTimeDomainData(this.timeData);
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const v = (this.timeData[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.timeData.length) * 5);
  }

  stop(): void {
    this.stopSlot(this.slots[0]);
    this.stopSlot(this.slots[1]);
    this.stopSting(0.05);
    this.menu = false;
    this.currentId = null;
    this.incomingId = null;
    this.mode = "idle";
    this.ramp(this.veilGain, 0.0001, 0.05);
    this.stopVeilSoon(0.08);
    this.emit();
  }

  async preloadUtilities(): Promise<void> {
    await this.ensureManifest();
    await Promise.all([this.loadCue(VEIL_ID), this.loadCue(STING_ID)]);
  }

  async transitionTo(cueId: string, fadeSec?: number, intensity?: Intensity): Promise<void> {
    this.unlock();
    this.error = null;
    await this.ensureManifest();
    const cue = this.cues.get(cueId);
    if (!cue) {
      this.error = `Unknown cue ${cueId}`;
      this.emit();
      return;
    }
    if (cue.role !== "music") {
      this.error = `${cue.title} is a utility cue, not a scene.`;
      this.emit();
      return;
    }
    this.loading = cueId;
    this.emit();
    try {
      await this.loadCue(cueId);
    } catch (err) {
      this.loading = null;
      this.error = err instanceof Error ? err.message : "Could not decode audio";
      this.emit();
      return;
    }
    this.loading = null;
    if (this.stingOn) this.stopSting(0.2);
    const fade = fadeSec ?? cue.fadeSec;
    const from = this.slots[this.active];
    const toIndex = this.active === 0 ? 1 : 0;
    const to = this.slots[toIndex];
    this.stopSlot(to);
    this.intensity = intensity ?? cue.defaultIntensity;
    this.solo = null;
    this.startSlot(to, cue);
    this.applyDuck(to, 0.02);
    const now = this.now();
    this.scheduleEqual(from.cueGain, now, Math.max(0.05, fade), false);
    this.scheduleEqual(to.cueGain, now, Math.max(0.05, fade), true);
    this.incomingId = cueId;
    this.mode = from.cue ? "transition" : "playing";
    this.emit();
    window.setTimeout(() => {
      if (this.slots[toIndex].cue?.id !== cueId) return;
      this.stopSlot(from);
      this.active = toIndex;
      this.currentId = cueId;
      this.incomingId = null;
      if (!this.stingOn) this.mode = "playing";
      this.applyMenu(0.05);
      this.emit();
    }, Math.max(0.05, fade) * 1000 + 40);
  }

  setIntensity(level: Intensity, fadeSec = 0.45): void {
    this.intensity = level;
    if (this.slots[0]) this.applyLayers(this.slots[0], fadeSec);
    if (this.slots[1]) this.applyLayers(this.slots[1], fadeSec);
    this.emit();
  }

  setSolo(index: number | null): void {
    this.solo = index;
    if (this.slots[0]) this.applyLayers(this.slots[0], 0.12);
    if (this.slots[1]) this.applyLayers(this.slots[1], 0.12);
    this.emit();
  }

  setMenu(open: boolean): void {
    if (this.stingOn) return;
    this.menu = open;
    this.applyMenu(open ? 0.45 : 0.35);
    this.emit();
  }

  interruptDeath(): void {
    this.unlock();
    this.menu = false;
    this.mode = "death";
    this.stingOn = true;
    const now = this.now();
    for (const slot of this.slots) this.ramp(slot.duck, 0, 0.12, now);
    this.ramp(this.veilGain, 0, 0.1, now);
    this.stopVeilSoon(0.14);
    void this.playSting();
    window.setTimeout(() => {
      if (!this.stingOn) return;
      this.stopSlot(this.slots[0]);
      this.stopSlot(this.slots[1]);
      this.currentId = null;
      this.incomingId = null;
      this.emit();
    }, 160);
    this.emit();
  }

  mute(on?: boolean): void {
    this.muted = on ?? !this.muted;
    this.ramp(this.master, masterTarget(this.muted, this.userSuspended), 0.03);
    this.emit();
  }

  suspend(): void {
    this.unlock();
    this.userSuspended = true;
    this.ramp(this.master, 0, 0.04);
    const ctx = this.ctx;
    window.setTimeout(() => {
      if (this.userSuspended && ctx && ctx.state === "running") void ctx.suspend();
      this.emit();
    }, 70);
    this.emit();
  }

  async resume(): Promise<void> {
    this.unlock();
    this.userSuspended = false;
    if (this.ctx && this.ctx.state !== "running") await this.ctx.resume();
    this.ramp(this.master, masterTarget(this.muted, false), 0.08);
    this.emit();
  }

  dispose(): void {
    document.removeEventListener("visibilitychange", this.onVis);
    this.stopSlot(this.slots[0]);
    this.stopSlot(this.slots[1]);
    this.stopVeilSoon(0);
    this.stopSting(0);
    void this.ctx?.close();
    this.ctx = null;
    this.built = false;
  }

  private emit(): void {
    const snap = this.getState();
    for (const fn of this.listeners) fn(snap);
  }

  private now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  private cueDuration(cue: Cue): number {
    if (cue.loop) {
      const end = cue.loopEnd && cue.loopEnd > 0 ? cue.loopEnd : cue.duration;
      return Math.max(0.001, end - (cue.loopStart || 0));
    }
    return Math.max(0.001, cue.duration);
  }

  private url(rel: string): string {
    const base = this.assetBase.endsWith("/") ? this.assetBase : `${this.assetBase}/`;
    return new URL(rel, new URL(base, window.location.origin)).href;
  }

  private ensureGraph(): void {
    if (this.built || !this.ctx) return;
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = masterTarget(this.muted, this.userSuspended);
    this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.82;
    this.musicBus.connect(this.analyser);
    this.timeData = new Uint8Array(this.analyser.fftSize);
    this.veilGain = ctx.createGain();
    this.veilGain.gain.value = 0.0001;
    this.veilGain.connect(this.musicBus);
    this.stingGain = ctx.createGain();
    this.stingGain.gain.value = 0.0001;
    this.stingGain.connect(this.master);
    this.slots = [this.makeSlot(), this.makeSlot()];
    this.built = true;
  }

  private makeSlot(): Slot {
    const ctx = this.ctx!;
    const duck = ctx.createGain();
    duck.gain.value = 1;
    duck.connect(this.musicBus!);
    const cueGain = ctx.createGain();
    cueGain.gain.value = 0.0001;
    cueGain.connect(duck);
    return { cue: null, cueGain, duck, layers: [], sources: [], startedAt: null, gen: 0 };
  }

  private async loadCue(id: string): Promise<AudioBuffer[]> {
    const cached = this.buffers.get(id);
    if (cached) return cached;
    const cue = this.cues.get(id);
    if (!cue) throw new Error(`Unknown cue ${id}`);
    this.ensureGraph();
    const ctx = this.ctx!;
    const buffers = await Promise.all(
      cue.layers.map(async (layer) => {
        const res = await fetch(this.url(layer.file));
        if (!res.ok) throw new Error(`Missing ${layer.file}`);
        const raw = await res.arrayBuffer();
        return ctx.decodeAudioData(raw.slice(0));
      }),
    );
    this.buffers.set(id, buffers);
    return buffers;
  }

  private startSlot(slot: Slot, cue: Cue): void {
    const ctx = this.ctx!;
    const buffers = this.buffers.get(cue.id);
    if (!buffers) return;
    slot.cue = cue;
    slot.gen = ++this.generation;
    const gen = slot.gen;
    slot.layers = buffers.map(() => {
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.connect(slot.cueGain);
      return g;
    });
    const when = ctx.currentTime + 0.04;
    slot.startedAt = when;
    slot.sources = buffers.map((buffer, i) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      if (cue.loop) {
        src.loop = true;
        src.loopStart = cue.loopStart || 0;
        const end = cue.loopEnd && cue.loopEnd > 0 ? cue.loopEnd : buffer.duration;
        src.loopEnd = Math.min(end, buffer.duration);
      } else if (i === 0) {
        src.onended = () => {
          if (slot.gen !== gen || this.incomingId || this.stingOn) return;
          if (this.currentId !== cue.id || this.mode !== "playing") return;
          this.mode = "idle";
          this.currentId = null;
          this.emit();
        };
      }
      src.connect(slot.layers[i]);
      src.start(when);
      return src;
    });
    this.applyLayers(slot, 0.012, when);
  }

  private stopSlot(slot: Slot | undefined): void {
    if (!slot) return;
    slot.gen = 0;
    const ctx = this.ctx;
    const when = (ctx?.currentTime ?? 0) + 0.02;
    for (const src of slot.sources) {
      try {
        src.stop(when);
      } catch {
        /* already stopped */
      }
      src.disconnect();
    }
    for (const g of slot.layers) g.disconnect();
    slot.sources = [];
    slot.layers = [];
    slot.cue = null;
    slot.startedAt = null;
    if (ctx) {
      slot.cueGain.gain.cancelScheduledValues(ctx.currentTime);
      slot.cueGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    }
  }

  private applyLayers(slot: Slot, fadeSec: number, when?: number): void {
    if (!slot.cue || !this.ctx) return;
    const t = when ?? this.ctx.currentTime;
    slot.layers.forEach((node, i) => {
      const target = Math.max(
        0.0001,
        layerGain(slot.cue!.layers[i].intensity, this.intensity, this.solo, i),
      );
      this.ramp(node, target, fadeSec, t);
    });
  }

  private applyDuck(slot: Slot, fadeSec: number): void {
    if (!this.ctx) return;
    const has = Boolean(slot.cue);
    const open = this.menu && has && !this.stingOn;
    this.ramp(slot.duck, open ? menuDuck(true) : 1, fadeSec);
  }

  private applyMenu(fadeSec: number): void {
    this.applyDuck(this.slots[0], fadeSec);
    this.applyDuck(this.slots[1], fadeSec);
    const cue = this.slots[this.active]?.cue;
    const amount = this.stingOn
      ? 0
      : veilAmount(this.menu, cue?.menu ?? "veil", Boolean(cue));
    this.ramp(this.veilGain, Math.max(0.0001, amount), fadeSec);
    if (amount > 0.01) void this.ensureVeil();
    else this.stopVeilSoon(fadeSec + 0.05);
  }

  private async ensureVeil(): Promise<void> {
    if (!this.ctx || this.veilSource) return;
    try {
      await this.loadCue(VEIL_ID);
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Menu veil failed";
      this.emit();
      return;
    }
    const cue = this.cues.get(VEIL_ID);
    const buffers = this.buffers.get(VEIL_ID);
    if (!cue || !buffers?.[0] || !this.veilGain) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffers[0];
    src.loop = true;
    src.loopEnd = Math.min(cue.loopEnd || buffers[0].duration, buffers[0].duration);
    src.connect(this.veilGain);
    src.start();
    this.veilSource = src;
  }

  private stopVeilSoon(delay: number): void {
    const src = this.veilSource;
    if (!src) return;
    this.veilSource = null;
    window.setTimeout(() => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      src.disconnect();
    }, Math.max(0, delay) * 1000);
  }

  private async playSting(): Promise<void> {
    if (!this.ctx || !this.stingGain) return;
    try {
      await this.loadCue(STING_ID);
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Death sting failed";
      this.stingOn = false;
      this.mode = "idle";
      this.emit();
      return;
    }
    const buffers = this.buffers.get(STING_ID);
    if (!buffers) return;
    this.stopSting(0.01);
    this.stingOn = true;
    const src = this.ctx.createBufferSource();
    // Sum sting layers if more than one; this cue is a single layer.
    src.buffer = buffers[0];
    src.loop = false;
    src.connect(this.stingGain);
    const now = this.ctx.currentTime;
    this.stingGain.gain.cancelScheduledValues(now);
    this.stingGain.gain.setValueAtTime(0.0001, now);
    this.stingGain.gain.linearRampToValueAtTime(1, now + 0.012);
    src.start(now + 0.01);
    src.onended = () => {
      if (this.stingSource !== src) return;
      this.stingOn = false;
      this.stingSource = null;
      if (this.mode === "death" && !this.currentId) this.mode = "idle";
      this.emit();
    };
    this.stingSource = src;
    this.emit();
  }

  private stopSting(fade: number): void {
    const src = this.stingSource;
    this.stingSource = null;
    this.stingOn = false;
    if (!src || !this.ctx || !this.stingGain) return;
    const now = this.ctx.currentTime;
    this.ramp(this.stingGain, 0.0001, fade, now);
    window.setTimeout(() => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
      src.disconnect();
    }, fade * 1000 + 30);
  }

  private scheduleEqual(node: GainNode | null, now: number, dur: number, fadeIn: boolean): void {
    if (!node || !this.ctx) return;
    const curve = equalPowerCurve(fadeIn, 32, 1);
    const param = node.gain;
    param.cancelScheduledValues(now);
    param.setValueAtTime(curve[0], now);
    param.setValueCurveAtTime(curve, now, Math.max(0.02, dur));
  }

  private ramp(node: GainNode | null, value: number, dur: number, when?: number): void {
    if (!node || !this.ctx) return;
    const t = when ?? this.ctx.currentTime;
    const v = Math.max(0.0001, value);
    node.gain.cancelScheduledValues(t);
    node.gain.setValueAtTime(node.gain.value, t);
    node.gain.linearRampToValueAtTime(v, t + Math.max(0.01, dur));
  }

  private handleVisibility(): void {
    if (!this.ctx) return;
    if (document.hidden) {
      if (this.ctx.state === "running") void this.ctx.suspend();
    } else if (!this.userSuspended && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    this.emit();
  }
}
