import { compileChart } from "./chart.ts";
import type { Piece } from "./types.ts";

const PPQ = 480;

function vlq(value: number): number[] {
  let n = Math.max(0, Math.floor(value));
  const bytes = [n & 0x7f];
  n >>= 7;
  while (n > 0) {
    bytes.unshift((n & 0x7f) | 0x80);
    n >>= 7;
  }
  return bytes;
}

function strBytes(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < text.length; i += 1) out.push(text.charCodeAt(i) & 0xff);
  return out;
}

type MidiEvent = { tick: number; bytes: number[] };

function programFor(instrument: string): { channel: number; program: number } {
  if (instrument === "fiddle") return { channel: 0, program: 40 };
  if (instrument === "guitar") return { channel: 1, program: 24 };
  return { channel: 9, program: 0 };
}

/**
 * Format 0 MIDI. One quarter note in the file is one game step.
 * Spoons are channel 10 side-stick (note 37). This is source material,
 * not a claim about how the browser synth sounds.
 */
export function pieceToMidi(piece: Piece): Uint8Array {
  const chart = compileChart(piece, { mode: "practice", variant: "relaxed" });
  const events: MidiEvent[] = [];
  const push = (tick: number, bytes: number[]) => events.push({ tick, bytes });

  push(0, [0xff, 0x03, ...vlq(piece.title.length), ...strBytes(piece.title)]);
  const uspq = Math.round(60_000_000 / piece.bpm);
  push(0, [0xff, 0x51, 0x03, (uspq >> 16) & 0xff, (uspq >> 8) & 0xff, uspq & 0xff]);

  const used = new Set<string>();
  const addNote = (step: number, durSteps: number, midi: number, velocity: number, instrument: string) => {
    const prog = programFor(instrument);
    const key = `${prog.channel}`;
    if (!used.has(key) && prog.channel !== 9) {
      used.add(key);
      push(0, [0xc0 | prog.channel, prog.program]);
    }
    const note = instrument === "spoons" || midi < 0 ? 37 : Math.max(0, Math.min(127, Math.round(midi)));
    const channel = instrument === "spoons" || midi < 0 ? 9 : prog.channel;
    const start = Math.max(0, Math.round(step * PPQ));
    const end = Math.max(start + 1, Math.round((step + Math.max(0.05, durSteps)) * PPQ));
    const vel = Math.max(1, Math.min(127, Math.round(velocity * 100)));
    push(start, [0x90 | channel, note, vel]);
    push(end, [0x80 | channel, note, 0]);
  };

  for (const sound of chart.auto) {
    if (sound.step < 0) continue;
    addNote(sound.step, sound.dur, sound.midi, sound.velocity, sound.instrument);
  }
  for (const cue of chart.cues) {
    for (const note of cue.motif) {
      addNote(cue.step + note.step, note.dur, note.midi, note.velocity, piece.lead);
    }
  }

  events.sort((a, b) => a.tick - b.tick || a.bytes[0]! - b.bytes[0]!);
  const track: number[] = [];
  let last = 0;
  for (const event of events) {
    track.push(...vlq(event.tick - last), ...event.bytes);
    last = event.tick;
  }
  track.push(...vlq(0), 0xff, 0x2f, 0x00);

  const header = [
    0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x01,
    (PPQ >> 8) & 0xff, PPQ & 0xff,
  ];
  const len = track.length;
  const trackHead = [
    0x4d, 0x54, 0x72, 0x6b,
    (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff,
  ];
  return Uint8Array.from([...header, ...trackHead, ...track]);
}

export function midiNoteCount(bytes: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < bytes.length - 2; i += 1) {
    if ((bytes[i]! & 0xf0) === 0x90 && bytes[i + 2]! > 0) count += 1;
  }
  return count;
}
