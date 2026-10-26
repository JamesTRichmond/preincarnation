import { stepSeconds } from "./chart.ts";
import { feedbackCopy, gradeHold, judgeDelta, teachCopy } from "./scoring.ts";
import type { Chart, Cue, Grade, Gesture } from "./types.ts";
import type { InstrumentId } from "./types.ts";

export type VoiceNote = {
  /** Absolute audio-clock seconds. */
  at: number;
  midi: number;
  durSec: number;
  velocity: number;
  instrument: InstrumentId | "player";
  detuneCents: number;
};

export type RuntimeCue = Cue & {
  resolved: boolean;
  grade?: Grade;
  voiced: boolean;
};

export type Perf = {
  origin: number;
  windowSec: number;
  offsetSec: number;
  cues: RuntimeCue[];
  nextAuto: number;
  /** Playing until the last breath is settled. There is no failed state. */
  status: "playing" | "done";
  grades: Grade[];
  feedback: string;
  slipped: boolean;
  hold: null | { cueId: string; pressClock: number; cueAt: number; holdSec: number };
};

export function createPerf(chart: Chart, origin: number, windowSec: number, offsetSec: number): Perf {
  return {
    origin,
    windowSec,
    offsetSec,
    cues: chart.cues.map((cue) => ({
      ...cue,
      motif: cue.motif.map((n) => ({ ...n })),
      resolved: false,
      voiced: false,
    })),
    nextAuto: 0,
    status: "playing",
    grades: [],
    feedback: "When the bead meets the line.",
    slipped: false,
    hold: null,
  };
}

function atStep(perf: Perf, chart: Chart, step: number): number {
  return perf.origin + step * stepSeconds(chart.bpm);
}

export function deadline(perf: Perf, chart: Chart, cue: { step: number }): number {
  return atStep(perf, chart, cue.step) + perf.windowSec + perf.offsetSec;
}

/** Keep the phrase's inner rhythm. A late entry shifts the whole phrase, it does not stack it. */
export function voiceCue(
  cue: RuntimeCue | Cue,
  chart: Chart,
  origin: number,
  clockNow: number,
  velocityScale: number,
): VoiceNote[] {
  const stepSec = stepSeconds(chart.bpm);
  const cueAt = origin + cue.step * stepSec;
  const shift = clockNow > cueAt ? clockNow - cueAt : 0;
  return cue.motif.map((n) => ({
    at: cueAt + n.step * stepSec + shift,
    midi: n.midi,
    durSec: Math.max(0.05, n.dur * stepSec),
    velocity: n.velocity * velocityScale,
    instrument: "player",
    detuneCents: 0,
  }));
}

export function pullAutos(
  perf: Perf,
  chart: Chart,
  clockNow: number,
  horizonSec: number,
): { perf: Perf; notes: VoiceNote[] } {
  const notes: VoiceNote[] = [];
  let next = perf.nextAuto;
  const horizon = clockNow + horizonSec;
  const stepSec = stepSeconds(chart.bpm);
  while (next < chart.auto.length) {
    const sound = chart.auto[next]!;
    const when = perf.origin + sound.step * stepSec;
    if (when >= horizon) break;
    next += 1;
    if (when < clockNow - 0.08) continue;
    notes.push({
      at: Math.max(clockNow, when),
      midi: sound.midi,
      durSec: Math.max(0.04, sound.dur * stepSec),
      velocity: sound.velocity,
      instrument: sound.instrument,
      detuneCents: sound.detuneCents,
    });
  }
  if (next === perf.nextAuto) return { perf, notes };
  return { perf: { ...perf, nextAuto: next }, notes };
}

function withCue(perf: Perf, id: string, patch: Partial<RuntimeCue>): Perf {
  return {
    ...perf,
    cues: perf.cues.map((cue) => (cue.id === id ? { ...cue, ...patch } : cue)),
  };
}

export type PressResult = { perf: Perf; notes: VoiceNote[]; consumed: boolean };

export function press(perf: Perf, chart: Chart, gesture: Gesture, clockNow: number): PressResult {
  if (perf.status !== "playing") return { perf, notes: [], consumed: false };
  const intent = clockNow - perf.offsetSec;
  const open = perf.cues.filter((cue) => {
    if (cue.resolved) return false;
    return Math.abs(intent - atStep(perf, chart, cue.step)) <= perf.windowSec;
  });
  if (open.length === 0) return { perf, notes: [], consumed: false };
  const nearest = [...open].sort(
    (a, b) =>
      Math.abs(intent - atStep(perf, chart, a.step)) - Math.abs(intent - atStep(perf, chart, b.step)),
  )[0]!;
  if (perf.hold?.cueId === nearest.id) return { perf, notes: [], consumed: false };
  if (nearest.gesture !== gesture) {
    return {
      perf: { ...perf, feedback: teachCopy(nearest.gesture) },
      notes: [],
      consumed: false,
    };
  }
  const cueAt = atStep(perf, chart, nearest.step);
  const notes = voiceCue(nearest, chart, perf.origin, clockNow, 1);
  if (nearest.holdSteps > 0) {
    const next = withCue(perf, nearest.id, { voiced: true });
    return {
      perf: {
        ...next,
        feedback: "Hold it with the room.",
        hold: {
          cueId: nearest.id,
          pressClock: clockNow,
          cueAt,
          holdSec: nearest.holdSteps * stepSeconds(chart.bpm),
        },
      },
      notes,
      consumed: true,
    };
  }
  const grade = judgeDelta((intent - cueAt) * 1000, perf.windowSec * 1000);
  let next = withCue(perf, nearest.id, { resolved: true, grade, voiced: true });
  next = {
    ...next,
    grades: [...next.grades, grade],
    feedback: feedbackCopy(grade, gesture),
    slipped: next.slipped || grade === "slipped",
  };
  return { perf: next, notes, consumed: true };
}

export function release(perf: Perf, chart: Chart, clockNow: number): Perf {
  if (!perf.hold) return perf;
  const cue = perf.cues.find((c) => c.id === perf.hold?.cueId);
  if (!cue || cue.resolved) return { ...perf, hold: null };
  const grade = gradeHold(
    (perf.hold.pressClock - perf.offsetSec) * 1000,
    (clockNow - perf.offsetSec) * 1000,
    perf.hold.cueAt * 1000,
    perf.hold.holdSec * 1000,
    perf.windowSec * 1000,
  );
  let next = withCue(perf, cue.id, { resolved: true, grade });
  next = {
    ...next,
    hold: null,
    grades: [...next.grades, grade],
    feedback: feedbackCopy(grade, cue.gesture),
    slipped: next.slipped || grade === "slipped",
  };
  return next;
}

/** If the pad is still down when the hold has lasted, count it. The tune does not wait forever. */
export function settleHold(perf: Perf, chart: Chart, clockNow: number): Perf {
  if (!perf.hold) return perf;
  const intent = clockNow - perf.offsetSec;
  if (intent < perf.hold.cueAt + perf.hold.holdSec) return perf;
  return release(perf, chart, perf.hold.cueAt + perf.hold.holdSec + perf.offsetSec);
}

export function expireCues(
  perf: Perf,
  chart: Chart,
  clockNow: number,
): { perf: Perf; notes: VoiceNote[] } {
  if (perf.status !== "playing") return { perf, notes: [] };
  const notes: VoiceNote[] = [];
  let next = perf;
  for (const cue of perf.cues) {
    if (cue.resolved) continue;
    if (next.hold?.cueId === cue.id) continue;
    const current = next.cues.find((c) => c.id === cue.id);
    if (!current || current.resolved) continue;
    if (clockNow <= deadline(next, chart, current)) continue;
    if (!current.voiced) notes.push(...voiceCue(current, chart, next.origin, clockNow, 0.22));
    next = withCue(next, cue.id, { resolved: true, grade: "slipped", voiced: true });
    next = {
      ...next,
      grades: [...next.grades, "slipped"],
      feedback: feedbackCopy("slipped", cue.gesture),
      slipped: true,
    };
  }
  return { perf: next, notes };
}

export function finishIfComplete(perf: Perf, chart: Chart, clockNow: number): Perf {
  if (perf.status === "done") return perf;
  const end = atStep(perf, chart, chart.totalSteps) + 0.45;
  if (clockNow < end) return perf;
  if (perf.hold) return perf;
  if (perf.cues.some((c) => !c.resolved)) return perf;
  if (perf.nextAuto < chart.auto.length) return perf;
  return { ...perf, status: "done" };
}

export function canContinue(perf: Perf): boolean {
  return perf.status === "playing" || perf.status === "done";
}
