import {
  type Action,
  type Cell,
  canRotate,
  canToggle,
  cloneBoard,
  pieceLabel,
} from "./model.ts";
import { simulate } from "./sim.ts";

interface Piece {
  r: number;
  c: number;
  mode: "rot" | "toggle";
}

export interface SolveResult {
  actions: Action[];
  moves: number;
  ticks: number;
}

function piecesOf(board: Cell[][]): Piece[] {
  const pieces: Piece[] = [];
  board.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (canRotate(cell)) pieces.push({ r, c, mode: "rot" });
      else if (canToggle(cell)) pieces.push({ r, c, mode: "toggle" });
    });
  });
  return pieces;
}

function keyOf(board: Cell[][], pieces: Piece[]): string {
  return pieces
    .map((piece) => {
      const cell = board[piece.r]?.[piece.c];
      if (!cell) return "0";
      return piece.mode === "rot" ? String(cell.rot) : cell.open ? "1" : "0";
    })
    .join(".");
}

function boardFromKey(base: Cell[][], pieces: Piece[], key: string): Cell[][] {
  const next = cloneBoard(base);
  const parts = key.length === 0 ? [] : key.split(".");
  pieces.forEach((piece, index) => {
    const cell = next[piece.r]?.[piece.c];
    if (!cell) return;
    const value = Number(parts[index] ?? 0);
    if (piece.mode === "rot") cell.rot = value & 3;
    else cell.open = value === 1;
  });
  return next;
}

function actionBetween(piece: Piece, from: string, to: string, index: number): Action {
  const a = Number(from.split(".")[index] ?? 0);
  const b = Number(to.split(".")[index] ?? 0);
  if (piece.mode === "toggle") return { type: "toggle", r: piece.r, c: piece.c };
  const delta = (b - a + 4) & 3;
  return { type: delta === 1 ? "cw" : "ccw", r: piece.r, c: piece.c };
}

export function solve(board: Cell[][], moveLimit: number, stateCap = 80_000): SolveResult | null {
  const base = cloneBoard(board);
  const pieces = piecesOf(base);
  const start = keyOf(base, pieces);
  const startSim = simulate(boardFromKey(base, pieces, start));
  if (startSim.status === "win") {
    return { actions: [], moves: 0, ticks: startSim.ticks };
  }

  const parent = new Map<string, { prev: string; index: number } | null>();
  parent.set(start, null);
  const queue: { key: string; dist: number }[] = [{ key: start, dist: 0 }];
  let head = 0;

  while (head < queue.length) {
    if (parent.size > stateCap) return null;
    const current = queue[head];
    head += 1;
    if (!current || current.dist >= moveLimit) continue;
    const parts = current.key.length === 0 ? [] : current.key.split(".");
    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (!piece) continue;
      const value = Number(parts[index] ?? 0);
      const options = piece.mode === "toggle" ? [1 - value] : [(value + 1) & 3, (value + 3) & 3];
      for (const option of options) {
        const nextParts = parts.slice();
        nextParts[index] = String(option);
        const nextKey = nextParts.join(".");
        if (parent.has(nextKey)) continue;
        parent.set(nextKey, { prev: current.key, index });
        const dist = current.dist + 1;
        const sim = simulate(boardFromKey(base, pieces, nextKey));
        if (sim.status === "win") {
          const keys: string[] = [nextKey];
          let cursor = nextKey;
          while (true) {
            const link = parent.get(cursor);
            if (!link) break;
            keys.push(link.prev);
            cursor = link.prev;
          }
          keys.reverse();
          const actions: Action[] = [];
          for (let step = 1; step < keys.length; step += 1) {
            const prev = keys[step - 1] ?? "";
            const curr = keys[step] ?? "";
            const link = parent.get(curr);
            if (!link) continue;
            const moved = pieces[link.index];
            if (!moved) continue;
            actions.push(actionBetween(moved, prev, curr, link.index));
          }
          return { actions, moves: dist, ticks: sim.ticks };
        }
        queue.push({ key: nextKey, dist });
      }
    }
  }
  return null;
}

export function traceLabels(actions: readonly Action[], board: Cell[][]): string[] {
  return actions.map((action) => {
    const cell = board[action.r]?.[action.c];
    const name = !cell ? "fitting" : cell.kind === "valve" ? "gate" : pieceLabel(cell).toLowerCase();
    const where = `row ${action.r + 1}, column ${action.c + 1}`;
    if (action.type === "toggle") return `Toggle the ${name} at ${where}.`;
    if (action.type === "cw") return `Turn the ${name} clockwise at ${where}.`;
    return `Turn the ${name} counter-clockwise at ${where}.`;
  });
}
