import { DRUM_MIDI, INSTRUMENTS } from "./instruments.ts";
import type { Piece, ScheduledNote } from "./types.ts";

export type ScheduleResult =
  | { ok: true; notes: ScheduledNote[]; beats: number; seconds: number }
  | { ok: false; errors: string[] };

type Raw = { degrees: number[]; dur: number; vel: number; rest: boolean };

const TOKEN =
  /^((?:\d+\+)*\d+|\.):(\d+(?:\.\d+)?)(?::(\d+(?:\.\d+)?))?$/;

export function parseSpec(spec: string): { events: Raw[]; errors: string[] } {
  const errors: string[] = [];
  const events: Raw[] = [];
  const tokens = spec.trim().split(/\s+/).filter((t) => t && t !== "|");
  if (tokens.length === 0) errors.push("empty spec");
  for (const token of tokens) {
    const m = TOKEN.exec(token);
    if (!m) {
      errors.push(`bad token ${token}`);
      continue;
    }
    const dur = Number(m[2]);
    const vel = m[3] === undefined ? 0.72 : Number(m[3]);
    if (!(dur > 0) || dur > 4) errors.push(`duration out of range in ${token}`);
    if (!(vel >= 0.15 && vel <= 1)) errors.push(`velocity out of range in ${token}`);
    if (m[1] === ".") {
      events.push({ degrees: [], dur, vel, rest: true });
      continue;
    }
    const degrees = m[1].split("+").map((d) => Number(d));
    if (degrees.some((d) => !Number.isInteger(d) || d < 0 || d > 8)) {
      errors.push(`degree out of range in ${token}`);
    }
    events.push({ degrees, dur, vel, rest: false });
  }
  return { events, errors };
}

export function schedule(piece: Piece): ScheduleResult {
  const inst = INSTRUMENTS[piece.instrument];
  const errors: string[] = [];
  if (!inst) errors.push("unknown instrument");
  if (piece.tempoBpm < 56 || piece.tempoBpm > 132) errors.push("tempo outside 56–132");
  if (piece.beatsPerBar !== 3 && piece.beatsPerBar !== 4) errors.push("meter must be 3 or 4");
  const { events, errors: parseErrors } = parseSpec(piece.spec);
  errors.push(...parseErrors);
  if (!inst || errors.length) return { ok: false, errors };

  let beat = 0;
  const notes: ScheduledNote[] = [];
  const secPerBeat = 60 / piece.tempoBpm;

  for (const ev of events) {
    if (!ev.rest) {
      if (ev.degrees.length > inst.polyphony) {
        errors.push(`chord of ${ev.degrees.length} exceeds ${inst.name} polyphony`);
      }
      if (inst.polyphony === 1 && ev.degrees.length > 1) {
        errors.push(`${inst.name} is monophonic`);
      }
      for (const degree of ev.degrees) {
        let midi: number;
        if (inst.drum) {
          if (degree >= DRUM_MIDI.length) {
            errors.push(`drum degree ${degree} missing`);
            continue;
          }
          midi = DRUM_MIDI[degree];
        } else {
          if (degree >= piece.scale.length) {
            errors.push(`degree ${degree} outside ${piece.scaleName}`);
            continue;
          }
          midi = piece.rootMidi + piece.scale[degree];
        }
        if (midi < inst.minMidi || midi > inst.maxMidi) {
          errors.push(`midi ${midi} outside ${inst.name} ${inst.minMidi}–${inst.maxMidi}`);
        }
        notes.push({
          midi,
          startSec: round4(beat * secPerBeat),
          endSec: round4((beat + ev.dur) * secPerBeat),
          vel: ev.vel,
          instrument: piece.instrument,
        });
      }
    }
    beat += ev.dur;
  }

  const beats = round4(beat);
  if (beats < 8 || beats > 32) errors.push(`length ${beats} beats outside 8–32`);
  if (Math.abs(beats / piece.beatsPerBar - Math.round(beats / piece.beatsPerBar)) > 1e-6) {
    errors.push("length is not a whole number of bars");
  }
  const seconds = beats * secPerBeat;
  if (seconds < 8 || seconds > 36) errors.push(`duration ${seconds.toFixed(1)}s outside 8–36`);
  if (notes.length < 8 || notes.length > 64) errors.push(`note count ${notes.length} outside 8–64`);
  if (notes.length && notes[0].startSec > secPerBeat + 1e-6) errors.push("leading silence longer than one beat");

  const polyError = polyphonyOverflow(notes, inst.polyphony);
  if (polyError) errors.push(polyError);
  const same = samePitchOverlap(notes);
  if (same) errors.push(same);

  const covered = coverage(notes, seconds);
  if (covered < 0.55) errors.push(`sounding coverage ${(covered * 100).toFixed(0)}% under 55%`);

  if (errors.length) return { ok: false, errors };
  return { ok: true, notes, beats, seconds: round4(seconds) };
}

function polyphonyOverflow(notes: ScheduledNote[], max: number): string | null {
  const points: Array<[number, number]> = [];
  for (const n of notes) {
    points.push([n.startSec, 1]);
    points.push([n.endSec, -1]);
  }
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let active = 0;
  for (const [, d] of points) {
    active += d;
    if (active > max) return `polyphony ${active} exceeds ${max}`;
  }
  return null;
}

function samePitchOverlap(notes: ScheduledNote[]): string | null {
  const by = new Map<number, ScheduledNote[]>();
  for (const n of notes) {
    const list = by.get(n.midi) ?? [];
    list.push(n);
    by.set(n.midi, list);
  }
  for (const [midi, list] of by) {
    const sorted = [...list].sort((a, b) => a.startSec - b.startSec);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startSec < sorted[i - 1].endSec - 1e-6) {
        return `midi ${midi} overlaps itself`;
      }
    }
  }
  return null;
}

function coverage(notes: ScheduledNote[], seconds: number): number {
  if (seconds <= 0) return 0;
  const points: Array<[number, number]> = [];
  for (const n of notes) {
    points.push([n.startSec, 1]);
    points.push([n.endSec, -1]);
  }
  points.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  let active = 0;
  let last = 0;
  let covered = 0;
  for (const [t, d] of points) {
    if (active > 0) covered += t - last;
    active += d;
    last = t;
  }
  return covered / seconds;
}

export function pitchFingerprint(notes: ScheduledNote[]): number[] {
  const ordered = [...notes].sort((a, b) => a.startSec - b.startSec || a.midi - b.midi);
  if (!ordered.length) return [];
  const base = ordered[0].midi;
  return ordered.map((n) => n.midi - base);
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
