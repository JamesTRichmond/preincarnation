let ctx: AudioContext | null = null;
let muted = false;
let bound = false;

const MUTE_KEY = "sugar-circuits-mute";

export function soundMuted(): boolean {
  return muted;
}

export function hydrateSound(): boolean {
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    muted = false;
  }
  return muted;
}

export function setSoundMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    /* the yard still plays silent */
  }
}

export function unlockSound(): void {
  if (typeof window === "undefined") return;
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  if (!ctx) ctx = new Ctor({ latencyHint: "interactive" });
  if (ctx.state === "suspended") void ctx.resume();
}

export function bindSound(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener("pointerdown", unlockSound);
  window.addEventListener("keydown", unlockSound);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") unlockSound();
  });
}

function blip(freq: number, at: number, dur: number, type: OscillatorType, gain: number, slideTo?: number): void {
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    amp.disconnect();
  };
}

function now(): number | null {
  if (muted || !ctx) return null;
  return ctx.currentTime;
}

export function playTurn(): void {
  const t = now();
  if (t === null) return;
  blip(280 + Math.random() * 50, t, 0.045, "triangle", 0.04);
}

export function playGate(): void {
  const t = now();
  if (t === null) return;
  blip(520, t, 0.04, "square", 0.02);
}

export function playPour(): void {
  const t = now();
  if (t === null) return;
  blip(220, t, 0.18, "sine", 0.045, 130);
}

export function playFault(): void {
  const t = now();
  if (t === null) return;
  blip(98, t, 0.2, "triangle", 0.06);
}

export function playWin(): void {
  const t = now();
  if (t === null) return;
  blip(523, t, 0.12, "sine", 0.045);
  blip(659, t + 0.11, 0.16, "sine", 0.04);
}
