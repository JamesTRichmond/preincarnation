/** Procedural mixer — unlocked on the first gesture. */
export function createAudio() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let sfx: GainNode | null = null;
  let music: GainNode | null = null;
  let muted = false;
  let drone: OscillatorNode | null = null;

  const ensure = () => {
    if (ctx) {
      if (ctx.state === "suspended") void ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    music = ctx.createGain();
    sfx.gain.value = 0.5;
    music.gain.value = 0.18;
    master.gain.value = 0.7;
    sfx.connect(master);
    music.connect(master);
    master.connect(ctx.destination);
    return ctx;
  };

  const beep = (freq: number, dur: number, type: OscillatorType, gain = 0.12, slide = 0) => {
    const c = ensure();
    if (!sfx || muted) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(sfx);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  };

  const unlock = () => {
    ensure();
  };

  const slash = () => {
    beep(420 + Math.random() * 50, 0.08, "square", 0.07, -180);
    beep(880 + Math.random() * 40, 0.04, "triangle", 0.04, -240);
  };
  const hit = () => {
    beep(160 + Math.random() * 30, 0.14, "sawtooth", 0.16, -90);
    beep(90, 0.1, "square", 0.08, -40);
  };
  const pickup = () => beep(660, 0.14, "triangle", 0.09, 220);
  const hurt = () => beep(140, 0.2, "square", 0.12, -90);
  const die = () => {
    beep(220, 0.4, "sine", 0.12, -160);
    setTimeout(() => beep(110, 0.6, "triangle", 0.1, -40), 120);
  };
  const talk = () => beep(520 + Math.random() * 80, 0.05, "triangle", 0.05);
  const crown = () => {
    beep(523, 0.18, "sine", 0.1, 0);
    setTimeout(() => beep(659, 0.2, "sine", 0.1), 90);
    setTimeout(() => beep(784, 0.28, "sine", 0.1), 180);
  };

  const startDrone = (limbo: boolean) => {
    const c = ensure();
    if (!music) return;
    stopDrone();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = limbo ? "sine" : "triangle";
    o.frequency.value = limbo ? 55 : 98;
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(muted ? 0.0001 : limbo ? 0.08 : 0.04, c.currentTime, 0.4);
    o.connect(g);
    g.connect(music);
    o.start();
    drone = o;
    if (!limbo) {
      const o2 = c.createOscillator();
      const g2 = c.createGain();
      o2.type = "sine";
      o2.frequency.value = 147;
      g2.gain.value = 0.0001;
      g2.gain.setTargetAtTime(muted ? 0.0001 : 0.02, c.currentTime, 0.8);
      o2.connect(g2);
      g2.connect(music);
      o2.start();
    }
  };

  const stopDrone = () => {
    try {
      drone?.stop();
    } catch {
      /* already stopped */
    }
    drone = null;
  };

  const setDuck = (on: boolean) => {
    if (!music || !ctx) return;
    const target = muted ? 0.0001 : on ? 0.03 : 0.18;
    music.gain.setTargetAtTime(target, ctx.currentTime, 0.25);
  };

  const setMuted = (v: boolean) => {
    muted = v;
    if (master && ctx) master.gain.setTargetAtTime(v ? 0.0001 : 0.7, ctx.currentTime, 0.05);
  };

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });

  return { unlock, slash, hit, pickup, hurt, die, talk, crown, startDrone, stopDrone, setMuted, setDuck, get muted() { return muted; } };
}
