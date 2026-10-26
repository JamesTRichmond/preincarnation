import { parseLine } from "./notation.ts";
import type {
  AutoSound,
  Chart,
  Companion,
  Cue,
  InstrumentId,
  Line,
  MotifNote,
  Piece,
  PlayMode,
  Variant,
} from "./types.ts";

export type CompileOpts = {
  mode: PlayMode;
  variant: Variant;
};

function whoFor(piece: Piece, line: Line, index: number, mode: PlayMode): "player" | "npc" {
  if (mode === "practice") {
    return line.who === "npc" ? "npc" : "player";
  }
  if (piece.duet === "explicit" && line.who) return line.who;
  return index % 2 === 0 ? "npc" : "player";
}

function supportNotes(piece: Piece, totalSteps: number): MotifNote[] {
  const notes: MotifNote[] = [];
  const low = piece.tonic - 12;
  for (let step = 0; step < totalSteps; step += piece.stepsPerBar) {
    if (piece.support === "spoons") {
      notes.push({ step, midi: -1, dur: 0.5, velocity: 0.28 });
    } else {
      notes.push({ step, midi: low, dur: piece.stepsPerBar * 0.92, velocity: 0.34 });
      notes.push({
        step,
        midi: low + 7,
        dur: Math.min(1, piece.stepsPerBar * 0.5),
        velocity: 0.22,
      });
    }
  }
  return notes;
}

function motifOf(lineNotes: MotifNote[]): MotifNote[] {
  return lineNotes.map((n) => ({ ...n }));
}

export function compileChart(piece: Piece, opts: CompileOpts): Chart {
  const cues: Cue[] = [];
  const auto: AutoSound[] = [];
  const companions: Companion[] = [];
  let step = 0;
  const lineSpans: { start: number; length: number; who: "player" | "npc"; line: Line; notes: MotifNote[] }[] =
    [];

  piece.lines.forEach((line, index) => {
    const parsed = parseLine(line.notes);
    const who = whoFor(piece, line, index, opts.mode);
    lineSpans.push({ start: step, length: parsed.length, who, line, notes: parsed.notes });
    step += parsed.length;
  });
  const totalSteps = step;

  const bedInstrument: InstrumentId = piece.support;
  supportNotes(piece, totalSteps).forEach((n, i) => {
    auto.push({
      id: `bed-${i}`,
      step: n.step,
      midi: n.midi,
      dur: n.dur,
      velocity: n.velocity,
      instrument: bedInstrument,
      detuneCents: 0,
    });
  });

  for (const span of lineSpans) {
    if (span.who === "npc") {
      const inst = piece.npc.instrument;
      companions.push({
        id: `them-${span.start}`,
        step: span.start,
        words: span.line.words,
        name: piece.npc.name.split(" ")[0] ?? piece.npc.name,
      });
      for (const [i, n] of span.notes.entries()) {
        auto.push({
          id: `npc-${span.start}-${i}`,
          step: span.start + n.step,
          midi: n.midi,
          dur: n.dur,
          velocity: Math.min(0.9, n.velocity),
          instrument: inst,
          detuneCents: inst === piece.lead ? 8 : 0,
        });
      }
      continue;
    }
    const motif = motifOf(span.notes);
    cues.push({
      id: `${piece.id}-${span.start}`,
      step: span.start,
      gesture: span.line.gesture,
      words: span.line.words,
      asker: "You",
      motif,
      holdSteps: span.line.gesture === "hold" ? Math.min(2, piece.stepsPerBar) : 0,
    });
    if (
      opts.variant === "mastery" &&
      span.line.gesture !== "hold" &&
      span.length >= 4
    ) {
      const mid = span.start + Math.floor(span.length / 2);
      const active = span.notes.find((n) => n.step <= mid - span.start && n.step + n.dur > mid - span.start);
      cues.push({
        id: `${piece.id}-${span.start}-mid`,
        step: mid,
        gesture: span.line.gesture,
        words: "And the middle.",
        asker: "You",
        motif: [
          {
            step: 0,
            midi: active?.midi ?? piece.tonic,
            dur: 0.5,
            velocity: 0.7,
          },
        ],
        holdSteps: 0,
      });
    }
  }

  cues.sort((a, b) => a.step - b.step || a.id.localeCompare(b.id));

  for (let i = 0; i < 4; i += 1) {
    auto.push({
      id: `count-${i}`,
      step: -4 + i,
      midi: -1,
      dur: 0.25,
      velocity: i === 3 ? 0.55 : 0.32,
      instrument: "spoons",
      detuneCents: 0,
    });
    companions.push({
      id: `count-${i}`,
      step: -4 + i,
      words: i === 3 ? "In" : ["One", "Two", "Three"][i] ?? "In",
      name: "",
    });
  }
  auto.sort((a, b) => a.step - b.step || a.id.localeCompare(b.id));

  return {
    id: `${piece.id}:${opts.mode}:${opts.variant}`,
    pieceId: piece.id,
    title: piece.title,
    bpm: piece.bpm,
    stepsPerBar: piece.stepsPerBar,
    tonic: piece.tonic,
    countIn: 4,
    totalSteps,
    cues,
    companions,
    auto: collapseDoubled(auto),
  };
}

/** Same instant, pitch, and instrument should speak once. */
export function collapseDoubled(sounds: AutoSound[]): AutoSound[] {
  const seen = new Set<string>();
  const out: AutoSound[] = [];
  for (const sound of sounds) {
    const key = [
      sound.step.toFixed(4),
      sound.midi,
      sound.instrument,
      sound.dur.toFixed(4),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(sound);
  }
  return out;
}

export function stepSeconds(bpm: number): number {
  return 60 / bpm;
}
