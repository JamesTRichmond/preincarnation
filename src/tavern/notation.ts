import type { MotifNote } from "./types.ts";

const PITCH: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export type ParsedLine = {
  notes: MotifNote[];
  length: number;
};

/**
 * Original shorthand, not a MusicXML dialect.
 * `D4` quarter, `F#4/2` eighth, `A4*2` two steps, `D4*3` three, `D4.` dotted.
 * `R` rest, `X` unpitched knock (midi -1). Chords: `D3+A3`.
 * `|` is a barline and is ignored.
 */
export function parseLine(source: string): ParsedLine {
  const tokens = source
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t !== "|");
  const notes: MotifNote[] = [];
  let cursor = 0;
  for (const token of tokens) {
    const chord = token.split("+");
    let dur = 1;
    const voiced: MotifNote[] = [];
    for (const part of chord) {
      const parsed = parseToken(part);
      if (!parsed) {
        throw new Error(`Bad note "${part}" in "${source}"`);
      }
      if (parsed.dur !== 1 || part.includes("*") || part.includes("/") || part.endsWith(".")) {
        dur = parsed.dur;
      }
      if (!parsed.rest) {
        voiced.push({
          step: cursor,
          midi: parsed.midi,
          dur: parsed.dur,
          velocity: chord.length > 1 ? 0.66 : parsed.midi < 0 ? 0.8 : 0.84,
        });
      }
    }
    for (const note of voiced) note.dur = dur;
    notes.push(...voiced);
    cursor += dur;
  }
  return { notes, length: cursor };
}

function parseToken(raw: string): { midi: number; dur: number; rest: boolean } | null {
  let i = 0;
  const head = raw[i];
  if (!head) return null;
  i += 1;
  if (head === "R" || head === "X") {
    const dur = readDur(raw.slice(i));
    if (dur == null) return null;
    return { midi: head === "X" ? -1 : 0, dur, rest: head === "R" };
  }
  if (!PITCH[head] && !(head >= "A" && head <= "G")) return null;
  let accidental = 0;
  if (raw[i] === "#") {
    accidental = 1;
    i += 1;
  } else if (raw[i] === "b") {
    accidental = -1;
    i += 1;
  }
  let octave = 4;
  if (raw[i] !== undefined && raw[i] >= "0" && raw[i] <= "9") {
    octave = Number(raw[i]);
    i += 1;
  }
  const dur = readDur(raw.slice(i));
  if (dur == null) return null;
  const midi = (octave + 1) * 12 + (PITCH[head] ?? 0) + accidental;
  return { midi, dur, rest: false };
}

function readDur(suffix: string): number | null {
  if (suffix === "") return 1;
  if (suffix === ".") return 1.5;
  if (suffix === "/2") return 0.5;
  if (suffix === "/2.") return 0.75;
  if (suffix === "*2") return 2;
  if (suffix === "*3") return 3;
  if (suffix === "*4") return 4;
  if (suffix === "*2.") return 3;
  return null;
}

export function lineSteps(source: string): number {
  return parseLine(source).length;
}
