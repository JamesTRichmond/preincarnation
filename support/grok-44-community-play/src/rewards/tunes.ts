/** Original pieces written for this valley. Not traditional tunes and not borrowed songs. */

export type Tune = {
  id: string;
  title: string;
  attribution: string;
  bpm: number;
  notes: string[];
};

const SEMIS: Record<string, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

export function noteToFreq(note: string): number | null {
  if (note === "rest") return null;
  const match = /^([A-G]#?)(\d)$/.exec(note);
  if (!match) return null;
  const semi = SEMIS[match[1]];
  if (semi === undefined) return null;
  const midi = 12 * (Number(match[2]) + 1) + semi;
  return 440 * 2 ** ((midi - 69) / 12);
}

export const TUNES: Tune[] = [
  {
    id: "tune-sap-watch",
    title: "Night Watch at the Bush",
    attribution: "Sable Okoye, for the boil. Not a traditional. Her name stays on it.",
    bpm: 72,
    notes: ["D4", "F4", "G4", "A4", "G4", "F4", "D4", "rest", "A4", "G4", "F4", "E4", "D4", "C4", "D4"],
  },
  {
    id: "tune-last-set",
    title: "Last Set, Not Theirs",
    attribution: "Sable Okoye. The grange asked for a different tune. She did not play it.",
    bpm: 96,
    notes: ["G4", "A4", "C5", "A4", "G4", "E4", "G4", "rest", "E4", "G4", "A4", "G4", "E4", "D4", "E4"],
  },
  {
    id: "tune-halt",
    title: "Halt on the Ridge",
    attribution: "Sable Okoye, after a call Agnes would not sing in 1959 and requires in 1973.",
    bpm: 60,
    notes: ["A3", "rest", "C4", "D4", "rest", "E4", "D4", "C4", "A3", "rest", "G3", "A3"],
  },
  {
    id: "tune-orchard",
    title: "Orchard Grace",
    attribution: "Sable Okoye, for June's table. It is not a hymn and not a prelude to one.",
    bpm: 80,
    notes: ["E4", "G4", "A4", "G4", "E4", "D4", "E4", "rest", "G4", "A4", "B4", "A4", "G4", "E4"],
  },
  {
    id: "tune-midnight",
    title: "Midnight Bread",
    attribution: "Sable Okoye, written to be played once, in the parlor, with the oven on.",
    bpm: 66,
    notes: ["D4", "C4", "A3", "rest", "C4", "D4", "F4", "E4", "D4", "rest", "A3", "D4"],
  },
];

export function tuneById(id: string): Tune | undefined {
  return TUNES.find((tune) => tune.id === id);
}
