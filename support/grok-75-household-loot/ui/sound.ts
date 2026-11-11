import { MOTIFS } from "../src/motifs.ts";

let ctx: AudioContext | null = null;

export function unlockAudio() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  if (!ctx) ctx = new Ctx({ latencyHint: "interactive" });
  if (ctx.state === "suspended") void ctx.resume();
}

export function playMotif(motif: string) {
  if (!ctx || ctx.state !== "running") return;
  const notes = MOTIFS[motif];
  if (!notes) return;
  const now = ctx.currentTime;
  notes.forEach((freq, index) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = motif.startsWith("chime") || motif.startsWith("tick") ? "sine" : "triangle";
    osc.frequency.value = freq;
    const start = now + index * 0.16;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    osc.connect(gain);
    gain.connect(ctx!.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}
