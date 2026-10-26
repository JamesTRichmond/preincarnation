import { lootId } from "./ids.ts";
import { carve, type Path } from "./sugar-line.ts";
import type { Board } from "./types.ts";

type Spec = {
  title: string;
  blurb: string;
  w: number;
  h: number;
  start: [number, number];
  solution: string;
  trap: string;
  sugarAt: number[];
  decoys: Path;
};

const DIRS: Record<string, [number, number]> = {
  R: [0, 1],
  L: [0, -1],
  D: [1, 0],
  U: [-1, 0],
};

function walk(start: [number, number], deltas: string, w: number, h: number): Path | string {
  const path: Path = [[start[0], start[1]]];
  const seen = new Set([`${start[0]},${start[1]}`]);
  let r = start[0];
  let c = start[1];
  for (const ch of deltas) {
    const dir = DIRS[ch];
    if (!dir) return `bad step ${ch}`;
    r += dir[0];
    c += dir[1];
    if (r < 0 || c < 0 || r >= h || c >= w) return `out of bounds ${r},${c}`;
    const k = `${r},${c}`;
    if (seen.has(k)) return `revisits ${k}`;
    seen.add(k);
    path.push([r, c]);
  }
  return path;
}

const SPECS: Spec[] = [
  { title: "First Ladder Line", blurb: "The true line climbs the rungs. The wall gutter is a lie.", w: 4, h: 4, start: [0, 0], solution: "RDRDRD", trap: "DDDRRR", sugarAt: [1, 3, 5], decoys: [[2, 1]] },
  { title: "Iron Run", blurb: "From the right-hand tap the sugars sit off the left drain.", w: 4, h: 4, start: [0, 3], solution: "LDLDLD", trap: "DDDLLL", sugarAt: [1, 3, 5], decoys: [[1, 1]] },
  { title: "Rim Cut", blurb: "Take the top and the right-hand post, never the foundation.", w: 4, h: 4, start: [0, 0], solution: "RRRDDD", trap: "DDDRRR", sugarAt: [1, 3, 5], decoys: [[1, 1], [2, 2]] },
  { title: "Left Rim", blurb: "The left post holds the sugar. The bottom sill does not.", w: 4, h: 4, start: [0, 3], solution: "LLLDDD", trap: "DDDLLL", sugarAt: [1, 3, 5], decoys: [[1, 2], [2, 1]] },
  { title: "Cup Fold", blurb: "Fold into the cup, then out to the hearth.", w: 4, h: 4, start: [0, 0], solution: "RRDLLDRRRD", trap: "DDDRRR", sugarAt: [1, 4, 9], decoys: [[0, 3]] },
  { title: "Thaw Gutter", blurb: "Short rungs beside a long melt gutter.", w: 4, h: 5, start: [0, 0], solution: "RDRDRDD", trap: "DDDDRRR", sugarAt: [1, 4, 6], decoys: [[2, 1], [3, 2]] },
  { title: "Notch Stairs", blurb: "Stairs of single notches. The chute is smooth and wrong.", w: 4, h: 5, start: [0, 0], solution: "DRDRDRD", trap: "DDDDRRR", sugarAt: [2, 4, 6], decoys: [[0, 2], [2, 2]] },
  { title: "Wide Stair", blurb: "Five rungs above a foundation drain.", w: 5, h: 5, start: [0, 0], solution: "RDRDRDRD", trap: "DDDDRRRR", sugarAt: [1, 4, 7], decoys: [[2, 1]] },
  { title: "Left Stair", blurb: "The climb counted from the far post.", w: 5, h: 5, start: [0, 4], solution: "LDLDLDLD", trap: "DDDDLLLL", sugarAt: [1, 4, 7], decoys: [[2, 3]] },
  { title: "Handle Jog", blurb: "Jog around the handle. The straight crack is empty.", w: 4, h: 4, start: [0, 0], solution: "DRRDDR", trap: "DDDRRR", sugarAt: [2, 3, 4], decoys: [[0, 2], [2, 0]] },
  { title: "Shelf Return", blurb: "Out along the shelf, back, then down to the hearth.", w: 4, h: 4, start: [0, 0], solution: "RRDLDDRR", trap: "DDDRRR", sugarAt: [1, 3, 5], decoys: [[0, 3], [2, 0]] },
  { title: "Ash Cross", blurb: "Cross before you drop. The near edge never sweetens.", w: 4, h: 4, start: [0, 0], solution: "RDDRRD", trap: "DDDRRR", sugarAt: [1, 3, 5], decoys: [[0, 2], [3, 1]] },
  { title: "Right Lip", blurb: "The lip of the pan, not the trench under it.", w: 5, h: 4, start: [0, 0], solution: "RRRRDDD", trap: "DDDRRRR", sugarAt: [1, 4, 6], decoys: [[1, 1], [2, 2]] },
  { title: "Left Lip", blurb: "Same lip, taken from the other corner of the bench.", w: 5, h: 4, start: [0, 4], solution: "LLLLDDD", trap: "DDDLLLL", sugarAt: [1, 4, 6], decoys: [[1, 3], [2, 2]] },
  { title: "Long Melt", blurb: "A long melt under a short sweet rim.", w: 4, h: 5, start: [0, 0], solution: "RRRDDDD", trap: "DDDDRRR", sugarAt: [1, 4, 6], decoys: [[1, 2], [3, 1]] },
  { title: "Far Post", blurb: "The far post is sugared. The near sill is only melt.", w: 4, h: 5, start: [0, 3], solution: "LLLDDDD", trap: "DDDDLLL", sugarAt: [1, 4, 6], decoys: [[1, 1], [2, 2]] },
  { title: "Far Lip", blurb: "Five wide, and the sugar stays on the far lip.", w: 5, h: 5, start: [0, 4], solution: "LLLLDDDD", trap: "DDDDLLLL", sugarAt: [1, 4, 7], decoys: [[1, 2], [2, 2]] },
  { title: "Lattice Joint", blurb: "Three joints off the frame, then the hearth.", w: 4, h: 4, start: [0, 0], solution: "RRDDLDRR", trap: "DDDRRR", sugarAt: [1, 3, 5], decoys: [[1, 0], [2, 3]] },
  { title: "Notch Wide", blurb: "Wide notches. The foundation gutter skips every one.", w: 5, h: 5, start: [0, 0], solution: "DRDRDRDR", trap: "DDDDRRRR", sugarAt: [2, 4, 6], decoys: [[0, 2], [2, 4]] },
  { title: "Hide Rack", blurb: "Under the rack, not down the smoke trench.", w: 4, h: 5, start: [0, 3], solution: "LDLDLDD", trap: "DDDDLLL", sugarAt: [1, 4, 6], decoys: [[1, 2], [3, 0]] },
];

export const PUZZLE_BUILD_NOTES: string[] = [];

export const PUZZLES: Board[] = SPECS.map((spec, i) => {
  const solution = walk(spec.start, spec.solution, spec.w, spec.h);
  const trap = walk(spec.start, spec.trap, spec.w, spec.h);
  const id = lootId(41 + i);
  if (typeof solution === "string" || typeof trap === "string") {
    PUZZLE_BUILD_NOTES.push(`${spec.title}: ${solution} / ${trap}`);
    return {
      id,
      title: spec.title,
      blurb: spec.blurb,
      rows: ["A#H", "###", "###"],
      solution: [[0, 0], [0, 2]],
      trap: [[0, 0], [0, 2]],
      bindsMusicId: lootId(21 + i),
    };
  }
  const sugars = spec.sugarAt.map((index) => solution[index]).filter((cell): cell is [number, number] => !!cell);
  if (sugars.length !== spec.sugarAt.length) {
    PUZZLE_BUILD_NOTES.push(`${spec.title}: sugar index missing`);
  }
  const carved = carve({
    w: spec.w,
    h: spec.h,
    solution,
    trap,
    sugars,
    decoys: spec.decoys,
  });
  if (carved.error) PUZZLE_BUILD_NOTES.push(`${spec.title}: ${carved.error}`);
  return {
    id,
    title: spec.title,
    blurb: spec.blurb,
    rows: carved.rows.length ? carved.rows : ["A#H", "###", "###"],
    solution,
    trap,
    bindsMusicId: lootId(21 + i),
  };
});

export const PUZZLES_BY_ID = new Map(PUZZLES.map((board) => [board.id, board]));
