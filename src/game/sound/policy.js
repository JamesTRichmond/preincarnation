// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- generated policy; audio.test.ts locks the behavior
// @ts-nocheck
/** Voice limits, priority, overlap, and variant choice. No audio device, no gameplay state. */

export const BUSES = ["music", "ambience", "effects", "ui"];

export const DEFAULT_LIMITS = {
  music: 2,
  ambience: 2,
  effects: 10,
  ui: 4,
};

export const GAMEPLAY_COUPLING = false;

export function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

/** Slider 0..1 to linear gain. Squared so the middle of the slider is a quiet half, not a loud one. */
export function gainFromSlider(slider) {
  const s = clamp(Number(slider) || 0, 0, 1);
  return s * s;
}

export function createPolicyState() {
  return {
    voices: [],
    seq: 1,
    lastStart: new Map(),
    rr: new Map(),
    lastVariant: new Map(),
  };
}

export function releaseVoice(state, id) {
  const index = state.voices.findIndex((voice) => voice.id === id);
  if (index >= 0) state.voices.splice(index, 1);
}

function pickSteal(voices, priority) {
  let best = null;
  for (const voice of voices) {
    if (voice.priority > priority) continue;
    if (
      !best ||
      voice.priority < best.priority ||
      (voice.priority === best.priority && voice.now < best.now)
    ) {
      best = voice;
    }
  }
  return best;
}

/**
 * @returns {{accepted: boolean, reason: string, voice: object|null, stolen: object[]}}
 */
export function requestVoice(state, spec) {
  const mode = spec.mode || "poly";
  const key = spec.group || spec.cueId;
  const stolen = [];

  if (mode === "protect" && spec.minIntervalMs > 0) {
    const prev = state.lastStart.get(key) ?? -1e15;
    if (spec.now - prev < spec.minIntervalMs) {
      return { accepted: false, reason: "overlap", voice: null, stolen };
    }
  }

  const removedForReplace = [];
  if (mode === "replace") {
    for (const voice of [...state.voices]) {
      if (voice.cueId === spec.cueId) {
        removedForReplace.push(voice);
        stolen.push(voice);
        releaseVoice(state, voice.id);
      }
    }
  }

  const poolVoices = () => state.voices.filter((voice) => voice.pool === spec.pool);

  if (mode !== "replace" && spec.maxVoices > 0 && spec.group) {
    const groupVoices = poolVoices().filter((voice) => voice.group === spec.group);
    if (groupVoices.length >= spec.maxVoices) {
      const oldest = groupVoices.reduce((a, b) => (a.now <= b.now ? a : b));
      if (spec.priority < oldest.priority) {
        return { accepted: false, reason: "group-cap", voice: null, stolen };
      }
      stolen.push(oldest);
      releaseVoice(state, oldest.id);
    }
  }

  if (poolVoices().length >= spec.poolLimit) {
    const candidate = pickSteal(poolVoices(), spec.priority);
    if (!candidate) {
      for (const voice of removedForReplace) state.voices.push(voice);
      return { accepted: false, reason: "priority", voice: null, stolen: [] };
    }
    stolen.push(candidate);
    releaseVoice(state, candidate.id);
  }

  const voice = {
    id: state.seq++,
    cueId: spec.cueId,
    group: spec.group || null,
    priority: spec.priority,
    pool: spec.pool,
    now: spec.now,
  };
  state.voices.push(voice);
  state.lastStart.set(key, spec.now);
  return { accepted: true, reason: "play", voice, stolen };
}

export function chooseVariant(state, cue, explicit, rng, commit) {
  const count = cue.files?.length || cue.variants || 1;
  if (Number.isInteger(explicit) && explicit >= 0) return explicit % count;
  if (count <= 1) return 0;
  const mode = cue.variantMode || "round-robin";
  if (mode === "random-no-repeat") {
    let index = Math.floor(rng() * count);
    const prev = state.lastVariant.get(cue.id);
    if (index === prev) index = (index + 1) % count;
    if (commit) state.lastVariant.set(cue.id, index);
    return index;
  }
  const index = state.rr.get(cue.id) ?? 0;
  if (commit) state.rr.set(cue.id, (index + 1) % count);
  return index;
}

export function planPlay(state, cue, now, options = {}) {
  const visual = cue.warning
    ? { cueId: cue.id, kind: cue.warning.kind, copy: cue.warning.copy, tone: cue.warning.tone, persistMs: cue.warning.persistMs }
    : null;
  const limits = { ...DEFAULT_LIMITS, ...(options.poolLimits || {}) };
  const overlap = cue.overlap || {};
  const decision = requestVoice(state, {
    cueId: cue.id,
    group: overlap.group || null,
    priority: cue.priority ?? 0,
    minIntervalMs: overlap.minIntervalMs || 0,
    maxVoices: overlap.maxVoices || 0,
    mode: overlap.mode || "poly",
    now,
    pool: cue.bus,
    poolLimit: limits[cue.bus] ?? DEFAULT_LIMITS.effects,
  });
  const variant = decision.accepted
    ? chooseVariant(state, cue, options.variant, options.rng || Math.random, true)
    : null;
  return {
    ...decision,
    variant,
    visual,
    cueId: cue.id,
    gameplay: "unchanged",
    duck: decision.accepted ? cue.duck || null : null,
  };
}
