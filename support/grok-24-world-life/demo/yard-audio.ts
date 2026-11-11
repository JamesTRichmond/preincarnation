/** Quiet procedural yard tone. Opt-in, and it never touches the simulation. */

export interface YardEar {
  toggle: (ground: "town" | "farm" | "water") => Promise<boolean>;
  retune: (ground: "town" | "farm" | "water") => void;
  quiet: () => void;
  dispose: () => void;
}

export function createYardEar(): YardEar {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let hearing = false;

  const ensure = (ground: "town" | "farm" | "water") => {
    if (ctx) return;
    const audio = new AudioContext();
    ctx = audio;
    master = audio.createGain();
    master.gain.value = 0;
    master.connect(audio.destination);

    const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      brown = (brown + (Math.random() * 2 - 1) * 0.04) * 0.96;
      data[i] = brown * 2.2;
    }
    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    noise.connect(filter);
    filter.connect(master);
    noise.start();

    const wheel = audio.createOscillator();
    wheel.type = "sine";
    wheel.frequency.value = ground === "farm" ? 196 : 74;
    const wheelGain = audio.createGain();
    wheelGain.gain.value = 0.0001;
    const lfo = audio.createOscillator();
    lfo.frequency.value = ground === "water" ? 0.7 : 0.32;
    const lfoGain = audio.createGain();
    lfoGain.gain.value = ground === "farm" ? 0.008 : 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(wheelGain.gain);
    wheel.connect(wheelGain);
    wheelGain.connect(master);
    wheel.start();
    lfo.start();
    retune(ground);
  };

  const retune = (ground: "town" | "farm" | "water") => {
    if (!filter) return;
    filter.frequency.value = ground === "water" ? 900 : ground === "farm" ? 640 : 480;
  };

  return {
    async toggle(ground) {
      ensure(ground);
      if (!ctx || !master) return false;
      if (hearing) {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        hearing = false;
        return false;
      }
      if (ctx.state === "suspended") await ctx.resume();
      retune(ground);
      master.gain.setTargetAtTime(0.05, ctx.currentTime, 0.08);
      hearing = true;
      return true;
    },
    retune,
    quiet() {
      if (!ctx || !master) return;
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      hearing = false;
    },
    dispose() {
      hearing = false;
      void ctx?.close();
      ctx = null;
      master = null;
      filter = null;
    },
  };
}
