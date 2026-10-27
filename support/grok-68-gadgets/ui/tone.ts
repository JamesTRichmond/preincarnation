/** Stand-in tones. Unlocked on the gesture that plays them. Not a field recording. */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(next: boolean): void {
  muted = next;
}

function ac(): AudioContext | null {
  if (muted) return null;
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number): void {
  const audio = ac();
  if (!audio) return;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime + at);
  amp.gain.setValueAtTime(0.0001, audio.currentTime + at);
  amp.gain.exponentialRampToValueAtTime(gain, audio.currentTime + at + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + at + dur);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(audio.currentTime + at);
  osc.stop(audio.currentTime + at + dur + 0.02);
}

function noise(at: number, dur: number, gain: number): void {
  const audio = ac();
  if (!audio) return;
  const len = Math.floor(audio.sampleRate * dur);
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audio.createBufferSource();
  src.buffer = buf;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const amp = audio.createGain();
  amp.gain.value = gain;
  src.connect(filter);
  filter.connect(amp);
  amp.connect(audio.destination);
  src.start(audio.currentTime + at);
}

export function playOp(op: string, ok: boolean): void {
  if (!ok) {
    tone(196, 0, 0.12, "square", 0.03);
    return;
  }
  switch (op) {
    case "distractNarrow":
    case "cadenceLock":
      for (let i = 0; i < 5; i += 1) tone(1400 + (i % 2) * 400, i * 0.09, 0.07, "triangle", 0.05);
      break;
    case "loanExtraWind":
      tone(520, 0, 0.08, "square", 0.03);
      tone(780, 0.1, 0.12, "triangle", 0.04);
      break;
    case "retuneLamp":
      tone(660, 0, 0.2, "sine", 0.04);
      tone(880, 0.05, 0.22, "sine", 0.03);
      tone(990, 0.1, 0.24, "sine", 0.025);
      break;
    case "diffusePrism":
      tone(740, 0, 0.28, "sine", 0.03);
      break;
    case "revealCompartment":
    case "calibrateResonator":
    case "crackTest":
      tone(440, 0, 0.45, "sine", 0.05);
      break;
    case "recordSound":
      noise(0, 0.35, 0.08);
      break;
    case "playRecording":
      noise(0, 0.7, 0.1);
      break;
    case "gooseCadence":
    case "drawFlock":
      tone(330, 0, 0.12, "sawtooth", 0.03);
      tone(494, 0.16, 0.12, "sawtooth", 0.03);
      tone(330, 0.32, 0.16, "sawtooth", 0.03);
      break;
    case "hailFerry":
    case "startleFlock":
      tone(146, 0, 0.4, "triangle", 0.06);
      break;
    case "shiftBalance":
    case "attachHanger":
      tone(180, 0, 0.08, "square", 0.04);
      break;
    case "bearing":
      tone(988, 0, 0.05, "square", 0.03);
      tone(1318, 0.08, 0.08, "square", 0.025);
      break;
    case "confirmPressure":
    case "rainTell":
      tone(220, 0, 0.2, "sine", 0.04);
      tone(233, 0.18, 0.25, "sine", 0.03);
      break;
    case "signalFriend":
      tone(523, 0, 0.14, "triangle", 0.04);
      tone(659, 0.16, 0.2, "triangle", 0.04);
      break;
    default:
      tone(392, 0, 0.08, "triangle", 0.03);
  }
}
