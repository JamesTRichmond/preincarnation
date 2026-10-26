import { lootId } from "./ids.ts";
import type { InstrumentId, Piece } from "./types.ts";

const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const PENTA = [0, 2, 4, 7, 9];
const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];

function quarters(degrees: number[]): string {
  return degrees.map((d) => `${d}:1`).join(" ");
}

const cycle: InstrumentId[] = ["bone-flute", "lyre", "frame-drum", "bowed-box", "bell-branch"];

type Draft = {
  title: string;
  scaleName: string;
  scale: number[];
  root: number;
  tempo: number;
  meter?: 3 | 4;
  spec: string;
  note: string;
};

const drafts: Draft[] = [
  {
    title: "Ladder Reel",
    scaleName: "dorian",
    scale: DORIAN,
    root: 67,
    tempo: 104,
    spec: quarters([0, 2, 3, 4, 2, 0, 3, 2, 4, 5, 4, 2, 3, 2, 0, 2]),
    note: "A climbing figure for the morning tap-round, never quite a dance.",
  },
  {
    title: "Pitch Cup Air",
    scaleName: "pentatonic",
    scale: PENTA,
    root: 55,
    tempo: 84,
    spec: "0:1 2:1 0+2:2 4:1 3:1 2:2 0:1 2:1 4:1 3:1 0+4:2 2:1 0:1",
    note: "Two strings at once where the cup would catch a second tone.",
  },
  {
    title: "Gall Dust Hymn",
    scaleName: "drum voices",
    scale: [],
    root: 36,
    tempo: 92,
    spec: "0:1 2:1 1:1 2:1 0:1 2:0.5 2:0.5 1:1 0+2:1 1:1 2:1 0:1 2:1 1:1 0:1 2:1 1:1",
    note: "Heel, rim, and a dry slap, as if grinding gall on a board.",
  },
  {
    title: "Cedar Fifths",
    scaleName: "aeolian",
    scale: AEOLIAN,
    root: 50,
    tempo: 76,
    spec: quarters([0, 4, 3, 4, 5, 3, 1, 0, 4, 6, 5, 3, 4, 2, 1, 0]),
    note: "Long bow, low, the way coals sound when the wind finds them.",
  },
  {
    title: "Interval of Thaw",
    scaleName: "pentatonic",
    scale: PENTA,
    root: 79,
    tempo: 96,
    spec: "0:1 2:1 4:2 0+2:2 3:1 2:1 4:1 1:1 0:2 2:1 4:1 3:2",
    note: "Bells left to ring across the gap when ice lets go of the bank.",
  },
  {
    title: "Marrow Count",
    scaleName: "dorian",
    scale: DORIAN,
    root: 64,
    tempo: 88,
    spec: quarters([4, 3, 2, 0, 2, 3, 5, 4, 2, 1, 0, 2, 4, 3, 5, 2]),
    note: "Counted on the fingers while a wick is rolled, one bone at a time.",
  },
  {
    title: "Curl of Bark",
    scaleName: "pentatonic",
    scale: PENTA,
    root: 52,
    tempo: 100,
    spec: "4:1 2:1 0:2 1+3:2 2:1 0:1 4:1 3:1 2:2 0+2:2 1:1 0:1",
    note: "A peel of notes that curls back on the open string.",
  },
  {
    title: "Peg Turn",
    scaleName: "drum voices",
    scale: [],
    root: 36,
    tempo: 108,
    spec: "1:0.5 1:0.5 0:1 2:1 1:1 0:1 2:0.5 2:0.5 1:1 0+1:1 2:1 0:1 1:1 2:1 0:1 2:1 1:1 0:1",
    note: "The click of a peg, then the head answering.",
  },
  {
    title: "Stone in the Pan",
    scaleName: "aeolian",
    scale: AEOLIAN,
    root: 48,
    tempo: 72,
    spec: quarters([0, 1, 3, 4, 3, 1, 0, 3, 5, 4, 3, 6, 4, 3, 1, 0]),
    note: "Slow enough to watch a boil start at the edge of the pan.",
  },
  {
    title: "Two Notes of the Owl",
    scaleName: "pentatonic",
    scale: PENTA,
    root: 81,
    tempo: 80,
    spec: "0:2 4:2 0:1 2:1 4:2 0+4:2 2:1 3:1 4:2 0:2",
    note: "Only the two notes the owl actually uses, plus their echo.",
  },
  {
    title: "Wet Ash",
    scaleName: "dorian",
    scale: DORIAN,
    root: 69,
    tempo: 112,
    spec: quarters([2, 0, 4, 3, 5, 4, 2, 3, 1, 0, 2, 4, 6, 5, 3, 0]),
    note: "A bright flute line for binding a splint before it stiffens.",
  },
  {
    title: "Pressed Gall",
    scaleName: "pentatonic",
    scale: PENTA,
    root: 57,
    tempo: 90,
    spec: "0:2 2:1 4:1 0+4:2 3:1 2:1 1:2 0:1 2:1 4:2 3:1 0:1",
    note: "Pressure, then release, the way a screw press sighs.",
  },
  {
    title: "Glare on the River",
    scaleName: "drum voices",
    scale: [],
    root: 36,
    tempo: 96,
    spec: "0:1 0:1 2:1 1:1 0:1 2:1 1:0.5 2:0.5 0:1 1:1 0+2:1 2:1 1:1 0:1 2:1 0:1 1:1",
    note: "A squint-rhythm: short steps when the snow throws the light back.",
  },
  {
    title: "Filter Cloth",
    scaleName: "aeolian",
    scale: AEOLIAN,
    root: 53,
    tempo: 86,
    spec: quarters([5, 4, 3, 1, 0, 1, 3, 4, 6, 5, 3, 2, 1, 3, 4, 0]),
    note: "The bow thins, as sap thins when it finally runs clear.",
  },
  {
    title: "Quarter Turn",
    scaleName: "pentatonic",
    scale: PENTA,
    root: 76,
    tempo: 108,
    spec: "2:1 0:1 4:1 2:1 0+2:2 4:1 3:1 2:2 1:1 0:1 4:1 2:2 0:1",
    note: "One quarter turn of a peg, heard as a bright correction.",
  },
  {
    title: "Narrow Grammar",
    scaleName: "dorian",
    scale: DORIAN,
    root: 72,
    tempo: 98,
    spec: quarters([0, 1, 2, 4, 5, 4, 2, 1, 0, 3, 4, 6, 4, 2, 1, 0]),
    note: "Small intervals, the width of a deer trail in crust.",
  },
  {
    title: "Door Notches",
    scaleName: "pentatonic",
    scale: PENTA,
    root: 60,
    tempo: 78,
    meter: 3,
    spec: "0:1 2:1 4:1 3:1 2:1 0:1 1:1 2:1 4:1 0+2:2 4:1 3:1 2:1 0:1",
    note: "Three beats to a notch, fourteen would be a longer night than this.",
  },
  {
    title: "Green Lattice",
    scaleName: "drum voices",
    scale: [],
    root: 36,
    tempo: 80,
    spec: "0:2 2:1 1:1 0:1 2:1 1:1 0:1 2:1 0+2:1 1:1 2:1 0:2 1:1 2:1",
    note: "Open strokes under a lattice, so the coals are not smothered.",
  },
  {
    title: "Night Crock",
    scaleName: "aeolian",
    scale: AEOLIAN,
    root: 46,
    tempo: 74,
    spec: quarters([0, 3, 1, 0, 4, 3, 1, 0, 5, 4, 3, 1, 6, 3, 1, 0]),
    note: "A cellar tune, almost under the breath, while salt does the work.",
  },
  {
    title: "Handle Thread",
    scaleName: "pentatonic",
    scale: PENTA,
    root: 74,
    tempo: 92,
    spec: "0:1 4:1 2:2 0+4:2 3:1 1:1 2:1 0:1 4:2 2:1 3:1 0:2",
    note: "Wound tight, then a last bright wrap around the split handle.",
  },
];

export const PIECES: Piece[] = drafts.map((draft, i) => ({
  id: lootId(21 + i),
  title: draft.title,
  instrument: cycle[i % cycle.length],
  tempoBpm: draft.tempo,
  beatsPerBar: draft.meter ?? 4,
  scaleName: draft.scaleName,
  scale: draft.scale,
  rootMidi: draft.root,
  spec: draft.spec,
  note: draft.note,
}));

export const PIECES_BY_ID = new Map(PIECES.map((piece) => [piece.id, piece]));
