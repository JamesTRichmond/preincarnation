/**
 * Isolated Preincarnation mixer.
 * Buses: music, ambience, effects, ui.
 * Mute and suspend never write gameplay state. Warning cues still report a visual.
 */

import {
  BUSES,
  DEFAULT_LIMITS,
  GAMEPLAY_COUPLING,
  clamp,
  createPolicyState,
  gainFromSlider,
  planPlay,
  releaseVoice,
} from "./policy.js";

export { BUSES, GAMEPLAY_COUPLING, gainFromSlider };

function ramp(param, ctx, target, timeConstant = 0.02) {
  if (param && typeof param.setTargetAtTime === "function") {
    param.setTargetAtTime(target, ctx.currentTime, timeConstant);
  } else if (param) {
    param.value = target;
  }
}

function curve(param, ctx, from, to, seconds, direction) {
  const steps = 24;
  const values = new Float32Array(steps);
  for (let i = 0; i < steps; i += 1) {
    const t = steps === 1 ? 1 : i / (steps - 1);
    const w = direction === "in" ? Math.sin((t * Math.PI) / 2) : Math.cos((t * Math.PI) / 2);
    values[i] = direction === "in" ? from + (to - from) * w : to + (from - to) * w;
  }
  if (param && typeof param.setValueCurveAtTime === "function" && seconds > 0) {
    try {
      param.setValueCurveAtTime(values, ctx.currentTime, seconds);
      return;
    } catch {
      /* An overlapping automation event falls back to a short ramp. */
    }
  }
  ramp(param, ctx, to, Math.max(0.01, seconds / 3));
}

export function createSoundDesk(options = {}) {
  const policy = createPolicyState();
  const poolLimits = { ...DEFAULT_LIMITS, ...(options.poolLimits || {}) };
  let manifest = options.manifest || null;
  let ctx = options.context || null;
  let graph = null;
  let muted = false;
  let unlocked = false;
  const hold = { user: false, hidden: false };
  const volumes = {
    master: options.initialVolumes?.master ?? 1,
    music: options.initialVolumes?.music ?? 0.8,
    ambience: options.initialVolumes?.ambience ?? 0.85,
    effects: options.initialVolumes?.effects ?? 1,
    ui: options.initialVolumes?.ui ?? 0.8,
  };
  const buffers = new Map();
  const active = new Map();
  const warningListeners = new Set();
  const stateListeners = new Set();
  const ambVoices = [];
  let ambienceId = null;
  let busCheck = null;
  const rng = options.rng || Math.random;
  const clock = options.now || (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
  const baseUrl = options.baseUrl || (typeof location !== "undefined" ? location.href : "file:///");

  function emitWarning(visual) {
    for (const fn of warningListeners) fn(visual);
  }

  function emitState() {
    const snapshot = getState();
    for (const fn of stateListeners) fn(snapshot);
  }

  function findCue(cueId) {
    return manifest?.cues?.find((cue) => cue.id === cueId) || null;
  }

  function buildGraph() {
    if (!ctx || graph) return;
    const master = ctx.createGain();
    master.gain.value = 1;
    const volumesOnGraph = { ...volumes };
    const buses = {};
    for (const name of BUSES) {
      const node = ctx.createGain();
      node.gain.value = gainFromSlider(volumesOnGraph[name]);
      node.connect(master);
      buses[name] = node;
    }
    master.connect(ctx.destination);
    graph = { master, buses, volumes: volumesOnGraph };
    applyMaster();
  }

  function applyMaster() {
    if (!graph) return;
    const target = muted ? 0 : gainFromSlider(graph.volumes.master);
    ramp(graph.master.gain, ctx, target, 0.015);
  }

  function applyBus(name) {
    if (!graph || !graph.buses[name]) return;
    ramp(graph.buses[name].gain, ctx, gainFromSlider(graph.volumes[name]), 0.02);
  }

  function canStart() {
    return Boolean(ctx && graph && unlocked && !hold.user && !hold.hidden);
  }

  function unlock() {
    const AudioContextClass = options.AudioContext || globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!ctx) {
      if (!AudioContextClass) return { ok: false, reason: "no-api", gameplay: "unchanged" };
      ctx = new AudioContextClass({ latencyHint: "interactive" });
    }
    const resumePromise = typeof ctx.resume === "function" ? ctx.resume() : Promise.resolve();
    unlocked = true;
    buildGraph();
    if (!hold.user && !hold.hidden && ctx.state === "suspended" && typeof ctx.resume === "function") {
      ctx.resume();
    }
    emitState();
    return { ok: true, reason: "unlocked", resumePromise, gameplay: "unchanged" };
  }

  function syncTransport() {
    if (!ctx || !unlocked) return;
    if (hold.user || hold.hidden) {
      if (ctx.state === "running" && typeof ctx.suspend === "function") ctx.suspend();
    } else if (typeof ctx.resume === "function") {
      ctx.resume();
    }
    emitState();
  }

  function bindVisibility() {
    if (options.observeVisibility === false) return;
    const doc = globalThis.document;
    if (!doc || typeof doc.addEventListener !== "function") return;
    doc.addEventListener("visibilitychange", () => {
      hold.hidden = Boolean(doc.hidden);
      syncTransport();
    });
  }

  function stopNode(entry, fadeSec = 0.02) {
    if (!entry || entry.stopped) return;
    entry.stopped = true;
    if (entry.gain && ctx) ramp(entry.gain.gain, ctx, 0, Math.max(0.005, fadeSec / 2));
    const when = ctx ? ctx.currentTime + fadeSec : 0;
    try {
      entry.source.stop(when);
    } catch {
      /* already stopped */
    }
    if (entry.voiceId != null) releaseVoice(policy, entry.voiceId);
    active.delete(entry.voiceId);
  }

  function startBuffer(cue, buffer, variant, voice, opts) {
    const bus = graph.buses[cue.bus];
    const gain = ctx.createGain();
    gain.gain.value = 0;
    ramp(gain.gain, ctx, 1, 0.008);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = Boolean(cue.loop);
    if (cue.pitchJitter && source.playbackRate) {
      const rate = clamp(1 + (rng() * 2 - 1) * cue.pitchJitter, 0.5, 2);
      if (typeof source.playbackRate.setValueAtTime === "function") {
        source.playbackRate.setValueAtTime(rate, ctx.currentTime);
      } else {
        source.playbackRate.value = rate;
      }
    }
    let tailConnected = source;
    if (typeof ctx.createStereoPanner === "function") {
      const panner = ctx.createStereoPanner();
      const pan = clamp(opts.pan ?? 0, -1, 1);
      if (typeof panner.pan.setValueAtTime === "function") panner.pan.setValueAtTime(pan, ctx.currentTime);
      else panner.pan.value = pan;
      source.connect(panner);
      panner.connect(gain);
      tailConnected = panner;
    } else {
      source.connect(gain);
    }
    void tailConnected;
    gain.connect(bus);
    const entry = { voiceId: voice.id, source, gain, cueId: cue.id, stopped: false };
    source.onended = () => {
      if (entry.voiceId != null) releaseVoice(policy, entry.voiceId);
      active.delete(entry.voiceId);
      emitState();
    };
    source.start();
    active.set(voice.id, entry);
    if (cue.duck && graph.buses[cue.duck.bus]) {
      const duckedBus = cue.duck.bus;
      const base = gainFromSlider(graph.volumes[duckedBus]);
      const node = graph.buses[duckedBus].gain;
      ramp(node, ctx, base * cue.duck.gain, 0.03);
      const hold = (cue.duck.holdMs || 400) / 1000;
      const release = Math.max(0.05, (cue.duck.releaseMs || 400) / 1000);
      if (typeof node.setTargetAtTime === "function") {
        node.setTargetAtTime(base, ctx.currentTime + hold, release / 3);
      }
    }
    return entry;
  }

  function play(cueId, opts = {}) {
    const cue = findCue(cueId);
    if (!cue) return { ok: false, reason: "missing", audible: false, gameplay: "unchanged", visual: null };
    const visual = cue.warning
      ? { cueId: cue.id, kind: cue.warning.kind, copy: cue.warning.copy, tone: cue.warning.tone, persistMs: cue.warning.persistMs }
      : null;
    if (visual) emitWarning(visual);
    if (!canStart()) {
      return {
        ok: true,
        accepted: false,
        audible: false,
        reason: !ctx || !unlocked ? "locked" : "suspended",
        visual,
        gameplay: "unchanged",
      };
    }
    const decision = planPlay(policy, cue, clock(), {
      poolLimits,
      variant: opts.variant,
      rng,
    });
    if (visual) decision.visual = visual;
    if (!decision.accepted) {
      return { ok: true, audible: false, ...decision };
    }
    for (const stolen of decision.stolen) stopNode(active.get(stolen.id), 0.018);
    const buffer = buffers.get(`${cue.id}:${decision.variant}`);
    if (!buffer) {
      releaseVoice(policy, decision.voice.id);
      return { ok: true, accepted: false, audible: false, reason: "unloaded", visual, variant: decision.variant, gameplay: "unchanged" };
    }
    startBuffer(cue, buffer, decision.variant, decision.voice, opts);
    emitState();
    return {
      ok: true,
      accepted: true,
      audible: !muted,
      reason: muted ? "muted" : "play",
      voiceId: decision.voice.id,
      variant: decision.variant,
      visual,
      stolen: decision.stolen.map((voice) => voice.id),
      gameplay: "unchanged",
    };
  }

  function bufferFor(cue) {
    return buffers.get(`${cue.id}:0`) || null;
  }

  function setAmbience(cueId) {
    if (cueId && cueId === ambienceId && ambVoices.some((voice) => voice.live)) {
      return { ok: true, reason: "same", gameplay: "unchanged" };
    }
    const cue = cueId ? findCue(cueId) : null;
    if (cueId && (!cue || cue.bus !== "ambience")) {
      return { ok: false, reason: "not-ambience", gameplay: "unchanged" };
    }
    if (!canStart()) {
      ambienceId = cueId || null;
      return { ok: true, reason: "deferred", gameplay: "unchanged" };
    }
    if (!cueId) {
      for (const voice of ambVoices) fadeAmb(voice, 0.6);
      ambienceId = null;
      emitState();
      return { ok: true, reason: "cleared", gameplay: "unchanged" };
    }
    const buffer = bufferFor(cue);
    if (!buffer) return { ok: true, reason: "unloaded", gameplay: "unchanged" };
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(graph.buses.ambience);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start();
    curve(gain.gain, ctx, 0, 1, 1.05, "in");
    const mine = { cueId, source, gain, live: true };
    for (const other of [...ambVoices]) fadeAmb(other, 1.05);
    ambVoices.push(mine);
    ambienceId = cueId;
    emitState();
    return { ok: true, reason: "crossfade", gameplay: "unchanged" };
  }

  function fadeAmb(voice, seconds) {
    if (!voice.live) return;
    voice.live = false;
    curve(voice.gain.gain, ctx, 1, 0, seconds, "out");
    try {
      voice.source.stop(ctx.currentTime + seconds + 0.02);
    } catch {
      /* already stopped */
    }
  }

  function setMuted(next) {
    muted = Boolean(next);
    applyMaster();
    emitState();
    return { muted, gameplay: "unchanged" };
  }

  function setBusVolume(name, slider) {
    if (!Object.prototype.hasOwnProperty.call(volumes, name)) {
      return { ...volumes, gameplay: "unchanged" };
    }
    volumes[name] = clamp(slider, 0, 1);
    if (graph) {
      graph.volumes[name] = volumes[name];
      if (name === "master") applyMaster();
      else applyBus(name);
    }
    emitState();
    return { ...volumes, gameplay: "unchanged" };
  }

  function suspend(reason = "user") {
    if (reason === "hidden") hold.hidden = true;
    else hold.user = true;
    syncTransport();
    return { suspended: true, gameplay: "unchanged" };
  }

  function resume(reason = "user") {
    if (reason === "hidden") hold.hidden = false;
    else hold.user = false;
    syncTransport();
    if (canStart() && ambienceId && !ambVoices.some((voice) => voice.live)) {
      const desired = ambienceId;
      ambienceId = null;
      setAmbience(desired);
    }
    return { suspended: hold.user || hold.hidden, gameplay: "unchanged" };
  }

  async function loadManifest() {
    if (manifest) return manifest;
    const url = new URL(options.manifestUrl || "manifest/cues.json", baseUrl);
    const fetchImpl = options.fetch || fetch;
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`manifest ${res.status}`);
    manifest = await res.json();
    if (manifest.poolLimits) Object.assign(poolLimits, manifest.poolLimits);
    return manifest;
  }

  async function load(onProgress) {
    await loadManifest();
    if (!ctx || !graph) {
      const opened = unlock();
      if (!opened.ok) throw new Error(opened.reason);
    }
    let done = 0;
    const allow = options.cueIds ? new Set(options.cueIds) : null;
    const files = manifest.cues
      .filter((cue) => !allow || allow.has(cue.id))
      .flatMap((cue) => cue.files.map((file, index) => ({ cue, file, index })));
    for (const item of files) {
      const url = new URL(item.file.path, baseUrl);
      const fetchImpl = options.fetch || fetch;
      const res = await fetchImpl(url);
      if (!res.ok) throw new Error(`load ${item.file.path} ${res.status}`);
      const raw = await res.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(raw.slice(0));
      buffers.set(`${item.cue.id}:${item.index}`, audioBuf);
      done += 1;
      onProgress?.({ done, total: files.length, id: item.cue.id });
    }
    emitState();
    if (ambienceId && !ambVoices.some((voice) => voice.live)) {
      const desired = ambienceId;
      ambienceId = null;
      setAmbience(desired);
    }
    return { loaded: buffers.size };
  }

  function prime(cueId, variant, buffer) {
    buffers.set(`${cueId}:${variant}`, buffer);
  }

  function startBusCheck(bus = "music") {
    if (!canStart() || typeof ctx.createOscillator !== "function") return { ok: false, reason: "unavailable" };
    stopBusCheck();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 196;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(graph.buses[bus] || graph.buses.music);
    osc.start();
    busCheck = { osc, gain, bus };
    return { ok: true, bus, gameplay: "unchanged" };
  }

  function stopBusCheck() {
    if (!busCheck) return;
    try {
      busCheck.osc.stop();
    } catch {
      /* already stopped */
    }
    busCheck = null;
  }

  function getBuffer(cueId, variant = 0) {
    return buffers.get(`${cueId}:${variant}`) || null;
  }

  function getState() {
    return {
      muted,
      unlocked,
      userSuspended: hold.user,
      hidden: hold.hidden,
      contextState: ctx ? ctx.state : "absent",
      voices: policy.voices.map((voice) => ({ ...voice })),
      ambience: ambienceId,
      ambienceVoices: ambVoices.filter((voice) => voice.live).length,
      volumes: { ...volumes },
      loaded: buffers.size,
      gameplayCoupling: GAMEPLAY_COUPLING,
      busCheck: busCheck ? busCheck.bus : null,
    };
  }

  bindVisibility();

  return {
    unlock,
    play,
    setAmbience,
    setMuted,
    setBusVolume,
    suspend,
    resume,
    load,
    loadManifest,
    prime,
    startBusCheck,
    stopBusCheck,
    getBuffer,
    getState,
    on(type, fn) {
      const set = type === "warning" ? warningListeners : stateListeners;
      set.add(fn);
      return () => set.delete(fn);
    },
  };
}
