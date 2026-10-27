import { noteToFreq, type Tune } from "../rewards/tunes.ts";

/** Plays an original tune. Returns a stop function. No borrowed recordings. */
export function playTune(tune: Tune): () => void {
  const Audio = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Audio) return () => undefined;
  const ctx = new Audio();
  const master = ctx.createGain();
  master.gain.value = 0.12;
  master.connect(ctx.destination);
  const beat = 60 / tune.bpm;
  let when = ctx.currentTime + 0.06;
  for (const note of tune.notes) {
    const freq = noteToFreq(note);
    if (freq) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.9, when + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + beat * 0.92);
      osc.connect(gain);
      gain.connect(master);
      osc.start(when);
      osc.stop(when + beat);
    }
    when += beat;
  }
  const timer = window.setTimeout(() => {
    void ctx.close();
  }, Math.max(0, (when - ctx.currentTime) * 1000 + 80));
  return () => {
    window.clearTimeout(timer);
    void ctx.close();
  };
}
