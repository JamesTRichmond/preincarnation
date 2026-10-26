/** Festival model of a sugar line. Whole buckets of sap. Not a vacuum plant. */

export const DIRS = [0, 1, 2, 3] as const;
export type Dir = 0 | 1 | 2 | 3;
export const DIR_NAME = ["N", "E", "S", "W"] as const;
export const DR = [-1, 0, 1, 0] as const;
export const DC = [0, 1, 0, -1] as const;
export const OPP: readonly Dir[] = [2, 3, 0, 1];

export type Kind =
  | "empty"
  | "block"
  | "pipe"
  | "main"
  | "check"
  | "valve"
  | "tee"
  | "cross"
  | "tap"
  | "bucket";

export type Shape = "straight" | "elbow" | "none";

export interface Token {
  enter: Dir;
  origin: number;
}

export interface Cell {
  kind: Kind;
  rot: number;
  open: boolean;
  stock: number;
  need: number;
  got: number;
  rotLocked: boolean;
  toggleLocked: boolean;
  shape: Shape;
  tokens: Token[];
}

export type Concept =
  | "route"
  | "queue"
  | "oneway"
  | "wall"
  | "pressure"
  | "valve"
  | "budget"
  | "tee"
  | "cross"
  | "split"
  | "buffer"
  | "mouth"
  | "fork"
  | "decoy";

export interface Challenge {
  maxTicks?: number;
  maxMoves?: number;
  note: string;
}

export interface Puzzle {
  id: string;
  chapter: number;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  concepts: Concept[];
  why: string;
  rows: string[];
  moveLimit: number;
  par: number;
  hints: [string, string, string];
  challenge?: Challenge;
}

export interface Action {
  type: "cw" | "ccw" | "toggle";
  r: number;
  c: number;
}

export function emptyCell(): Cell {
  return {
    kind: "empty",
    rot: 0,
    open: true,
    stock: 0,
    need: 0,
    got: 0,
    rotLocked: true,
    toggleLocked: true,
    shape: "none",
    tokens: [],
  };
}

export function turn(dir: Dir, rot: number): Dir {
  return ((dir + (rot & 3)) & 3) as Dir;
}

export function capOf(cell: Cell): number {
  if (cell.kind === "main") return 2;
  if (cell.kind === "pipe" || cell.kind === "check" || cell.kind === "valve") return 1;
  return 0;
}

export function maskOf(cell: Cell): number {
  const rot = cell.rot & 3;
  const bits = (dirs: Dir[]) =>
    dirs.reduce<number>((mask, dir) => mask | (1 << turn(dir, rot)), 0);
  switch (cell.kind) {
    case "pipe":
    case "main":
    case "valve":
      return cell.shape === "elbow" ? bits([0, 1]) : bits([0, 2]);
    case "check":
    case "tee":
      return cell.kind === "tee" ? bits([0, 1, 2]) : bits([0, 2]);
    case "cross":
      return 15;
    case "tap":
      return 1 << turn(2, rot);
    case "bucket":
      return 1 << turn(0, rot);
    default:
      return 0;
  }
}

export function inletOf(cell: Cell): Dir {
  return turn(0, cell.rot);
}

export function outletOf(cell: Cell): Dir {
  return turn(2, cell.rot);
}

export function hasPort(cell: Cell, dir: Dir): boolean {
  return (maskOf(cell) & (1 << dir)) !== 0;
}

export function otherPort(cell: Cell, enter: Dir): Dir | null {
  if (cell.kind === "check") {
    if (enter !== inletOf(cell)) return null;
    return outletOf(cell);
  }
  if (!hasPort(cell, enter)) return null;
  const mask = maskOf(cell);
  for (let dir = 0; dir < 4; dir += 1) {
    if (dir !== enter && (mask & (1 << dir)) !== 0) return dir as Dir;
  }
  return null;
}

export function acceptsStorage(cell: Cell, enter: Dir): boolean {
  if (cell.kind === "valve" && !cell.open) return false;
  if (cell.kind === "check") return enter === inletOf(cell);
  if (cell.kind === "pipe" || cell.kind === "main" || cell.kind === "valve") {
    return hasPort(cell, enter);
  }
  return false;
}

export function isStorage(cell: Cell): boolean {
  return (
    cell.kind === "pipe" || cell.kind === "main" || cell.kind === "check" || cell.kind === "valve"
  );
}

export function canRotate(cell: Cell): boolean {
  if (cell.rotLocked) return false;
  return (
    cell.kind === "pipe" ||
    cell.kind === "main" ||
    cell.kind === "check" ||
    cell.kind === "tee" ||
    cell.kind === "tap" ||
    cell.kind === "bucket"
  );
}

export function canToggle(cell: Cell): boolean {
  return cell.kind === "valve" && !cell.toggleLocked;
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      tokens: cell.tokens.map((token) => ({ ...token })),
    })),
  );
}

export function freshRun(board: Cell[][]): Cell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      got: 0,
      tokens: [],
    })),
  );
}

function parseToken(token: string): Cell {
  if (token === "..") return emptyCell();
  if (token === "##") {
    return { ...emptyCell(), kind: "block" };
  }
  const cross = /^x([!?])$/.exec(token);
  if (cross) {
    return { ...emptyCell(), kind: "cross", rotLocked: cross[1] !== "?" };
  }
  const match = /^([abpecmtv])(\d)(?:\.(\d+))?(_)?([!?])$/.exec(token);
  if (!match) throw new Error(`Bad fitting "${token}"`);
  const letter = match[1] ?? "";
  const rot = Number(match[2]);
  const amount = match[3] === undefined ? null : Number(match[3]);
  const closed = match[4] === "_";
  const unlocked = match[5] === "?";
  if (!Number.isInteger(rot) || rot < 0 || rot > 3) throw new Error(`Bad rotation "${token}"`);

  const cell = emptyCell();
  cell.rot = rot;
  cell.open = !closed;
  cell.rotLocked = !unlocked;
  cell.toggleLocked = true;

  switch (letter) {
    case "p":
      cell.kind = "pipe";
      cell.shape = "straight";
      break;
    case "e":
      cell.kind = "pipe";
      cell.shape = "elbow";
      break;
    case "m":
      cell.kind = "main";
      cell.shape = "straight";
      break;
    case "c":
      cell.kind = "check";
      cell.shape = "straight";
      break;
    case "v":
      cell.kind = "valve";
      cell.shape = "straight";
      cell.rotLocked = true;
      cell.toggleLocked = !unlocked;
      break;
    case "t":
      cell.kind = "tee";
      break;
    case "a":
      if (amount === null || amount < 1) throw new Error(`Tap needs sap "${token}"`);
      cell.kind = "tap";
      cell.stock = amount;
      break;
    case "b":
      if (amount === null || amount < 1) throw new Error(`Pail needs a mark "${token}"`);
      cell.kind = "bucket";
      cell.need = amount;
      break;
    default:
      throw new Error(`Bad fitting "${token}"`);
  }
  return cell;
}

export function parseBoard(rows: readonly string[]): Cell[][] {
  const trimmed = rows.map((row) => row.trim()).filter((row) => row.length > 0);
  if (trimmed.length === 0) throw new Error("Empty yard");
  const grid = trimmed.map((row) => row.split(/\s+/).filter(Boolean).map(parseToken));
  const width = grid[0]?.length ?? 0;
  if (width === 0 || width > 8 || grid.length > 8) throw new Error("Yard must be 1–8 by 1–8");
  if (grid.some((row) => row.length !== width)) throw new Error("Ragged yard");
  return grid;
}

export function boardSize(board: Cell[][]): { rows: number; cols: number } {
  return { rows: board.length, cols: board[0]?.length ?? 0 };
}

export function tapOrigins(board: Cell[][]): Map<string, number> {
  const origins = new Map<string, number>();
  let next = 0;
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell.kind === "tap") origins.set(`${r},${c}`, next++);
    });
  });
  return origins;
}

export function totalSap(board: Cell[][]): number {
  let sum = 0;
  for (const row of board) {
    for (const cell of row) sum += cell.stock + cell.tokens.length + cell.got;
  }
  return sum;
}

export function applyAction(board: Cell[][], action: Action): Cell[][] {
  const next = cloneBoard(board);
  const cell = next[action.r]?.[action.c];
  if (!cell) throw new Error("Turn is off the yard");
  if (action.type === "toggle") {
    if (!canToggle(cell)) throw new Error("That gate does not move");
    cell.open = !cell.open;
    return next;
  }
  if (!canRotate(cell)) throw new Error("That fitting is fixed");
  cell.rot = (cell.rot + (action.type === "cw" ? 1 : 3)) & 3;
  return next;
}

export function applyActions(board: Cell[][], actions: readonly Action[]): Cell[][] {
  return actions.reduce(applyAction, board);
}

export function pieceLabel(cell: Cell): string {
  switch (cell.kind) {
    case "empty":
      return "Open ground";
    case "block":
      return "Stone";
    case "pipe":
      return cell.shape === "elbow" ? "Elbow" : "Thin line";
    case "main":
      return "Main";
    case "check":
      return "Check";
    case "valve":
      return cell.open ? "Open gate" : "Shut gate";
    case "tee":
      return "Tee";
    case "cross":
      return "Cross";
    case "tap":
      return "Tap";
    case "bucket":
      return "Pail";
    default:
      return "Fitting";
  }
}

const SPOKEN = ["north", "east", "south", "west"] as const;

function portPhrase(mask: number): string {
  const names = SPOKEN.filter((_, dir) => (mask & (1 << dir)) !== 0);
  if (names.length === 0) return "nowhere";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** What the fitting is doing, in bench language. Not a solution. */
export function describeCell(cell: Cell, got = cell.got): string {
  if (cell.kind === "empty") return "Bare bench. Sap cannot stand here.";
  if (cell.kind === "block") return "Stone. The line has to walk around it.";
  if (cell.kind === "cross") return "Cross. North–south stays apart from east–west.";
  if (cell.kind === "tap") {
    const waiting =
      cell.stock === 0 ? "Empty" : cell.stock === 1 ? "One bucket waiting" : `${cell.stock} buckets waiting`;
    return `Tap. ${waiting}, leaving ${SPOKEN[outletOf(cell)]}.`;
  }
  if (cell.kind === "bucket") {
    return `Pail. Mouth open to the ${SPOKEN[turn(0, cell.rot)]}. ${got} of ${cell.need} marked.`;
  }
  if (cell.kind === "check") {
    return `Check. Arrow points ${SPOKEN[outletOf(cell)]}. Sap enters only from the ${SPOKEN[inletOf(cell)]}.`;
  }
  if (cell.kind === "valve" && !cell.open) return "Gate is shut. Sap stops here.";
  const open = `to the ${portPhrase(maskOf(cell))}`;
  if (cell.kind === "valve") return `Gate is open ${open}. It holds one bucket.`;
  if (cell.kind === "tee") {
    return `Tee, open ${open}. Straight if that mouth can take it, otherwise left, then right.`;
  }
  if (cell.kind === "main") return `Main, open ${open}. Holds two buckets and lets one leave each pull.`;
  if (cell.shape === "elbow") return `Elbow, open ${open}.`;
  return `Thin line, open ${open}. Holds one bucket.`;
}

export function serializeCell(cell: Cell): string {
  if (cell.kind === "empty") return "..";
  if (cell.kind === "block") return "##";
  if (cell.kind === "cross") return cell.rotLocked ? "x!" : "x?";
  const letter =
    cell.kind === "pipe"
      ? cell.shape === "elbow"
        ? "e"
        : "p"
      : cell.kind === "main"
        ? "m"
        : cell.kind === "check"
          ? "c"
          : cell.kind === "valve"
            ? "v"
            : cell.kind === "tee"
              ? "t"
              : cell.kind === "tap"
                ? "a"
                : "b";
  const amount = cell.kind === "tap" ? `.${cell.stock}` : cell.kind === "bucket" ? `.${cell.need}` : "";
  const shut = cell.kind === "valve" && !cell.open ? "_" : "";
  const loose = cell.kind === "valve" ? !cell.toggleLocked : !cell.rotLocked;
  return `${letter}${cell.rot & 3}${amount}${shut}${loose ? "?" : "!"}`;
}

export function serializeBoard(board: Cell[][]): string[] {
  return board.map((row) => row.map(serializeCell).join(" "));
}

export function structureKey(rows: readonly string[]): string {
  const board = parseBoard(rows);
  return board
    .map((row) =>
      row
        .map((cell) => {
          const rot = cell.rotLocked ? cell.rot : 0;
          const open = cell.kind === "valve" && !cell.toggleLocked ? 0 : cell.open ? 1 : 0;
          return [
            cell.kind,
            cell.shape,
            rot,
            open,
            cell.stock,
            cell.need,
            cell.rotLocked ? "L" : "U",
            cell.toggleLocked ? "T" : "t",
          ].join("");
        })
        .join("."),
    )
    .join("/");
}

export const CHAPTERS: {
  id: number;
  title: string;
  teaches: string;
  why: string;
}[] = [
  {
    id: 1,
    title: "Yard Line",
    teaches: "Ports, elbows, and the mouth of a pail.",
    why: "Every line is a different bend. The only new idea is that sap only follows open ports, and a pail drinks from one mouth. A second bucket of sap shows that a thin line must clear before the next sap steps on.",
  },
  {
    id: 2,
    title: "With the Arrow",
    teaches: "Checks pass sap one way.",
    why: "A check is a directed thin line. Several yards hide a locked check on a tempting branch so the short way is a blocked branch, not a second solution.",
  },
  {
    id: 3,
    title: "Stone and Ice",
    teaches: "Walls force the bend.",
    why: "Stones are not recoloured pipes. Each yard uses a different blockage — a pillar, a shed wall, a notch — so the walking path has to turn.",
  },
  {
    id: 4,
    title: "Same Beat",
    teaches: "Two saps, one thin line, one pull.",
    why: "Pressure here is a timetable. Equal runs meet and blow a grade-one line. A longer run, or a main that can catch two, keeps the draw.",
  },
  {
    id: 5,
    title: "The Gate",
    teaches: "Shut the steal. Spend turns tight.",
    why: "Gates start open on a steal or shut on the true line. Several budgets equal the shortest line, so a wasted turn cannot be drawn back.",
  },
  {
    id: 6,
    title: "Festival Board",
    teaches: "Tees, crosses, forks, and ribbons.",
    why: "The last ten combine the earlier ideas without repeating a skeleton. Ribbons ask for a shorter line. They are not a campaign power.",
  },
];
