import {
  type Cell,
  type Concept,
  type Puzzle,
  applyActions,
  canRotate,
  canToggle,
  parseBoard,
  structureKey,
} from "./model.ts";
import { simulate, type SimResult } from "./sim.ts";
import { solve, type SolveResult } from "./solver.ts";

export interface Audit {
  id: string;
  ok: boolean;
  reasons: string[];
  par: number | null;
  ticks: number | null;
  trace: string[];
  signature: string;
  concepts: Concept[];
}

function adjacentToEntered(board: Cell[][], entered: Set<string>, r: number, c: number): boolean {
  for (const [dr, dc] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const) {
    if (entered.has(`${r + dr},${c + dc}`)) return true;
  }
  return false;
}

function conceptHolds(
  concept: Concept,
  puzzle: Puzzle,
  start: Cell[][],
  finalBoard: Cell[][],
  sim: SimResult,
  moves: number,
): boolean {
  const rotChanged = (kind: Cell["kind"]) =>
    start.some((row, r) =>
      row.some((cell, c) => cell.kind === kind && cell.rot !== finalBoard[r]?.[c]?.rot),
    );
  const taps = start.flat().filter((cell) => cell.kind === "tap").length;
  switch (concept) {
    case "route":
      return start.some((row, r) =>
        row.some((cell, c) => {
          const next = finalBoard[r]?.[c];
          if (!next || cell.rot === next.rot) return false;
          return (
            cell.kind === "pipe" ||
            cell.kind === "main" ||
            cell.kind === "tee" ||
            cell.kind === "tap"
          );
        }),
      );
    case "queue":
      return start.some((row) => row.some((cell) => cell.kind === "tap" && cell.stock >= 2)) && sim.ticks >= 3;
    case "oneway":
      return rotChanged("check");
    case "wall":
      return (
        start.some((row, r) =>
          row.some(
            (cell, c) => cell.kind === "block" && adjacentToEntered(start, sim.entered, r, c),
          ),
        ) && sim.traversed.turned
      );
    case "pressure":
      return taps >= 2 && sim.stagger;
    case "valve":
      return start.some((row, r) =>
        row.some((cell, c) => cell.kind === "valve" && cell.open !== finalBoard[r]?.[c]?.open),
      );
    case "budget":
      return puzzle.moveLimit === moves && moves === puzzle.par;
    case "tee":
      return sim.traversed.tee;
    case "cross":
      return sim.traversed.cross;
    case "split":
      return start.flat().filter((cell) => cell.kind === "bucket").length >= 2 && sim.status === "win";
    case "buffer":
      return sim.buffered;
    case "mouth":
      return rotChanged("bucket");
    case "fork":
      return sim.fork;
    case "decoy":
      return start.some((row, r) =>
        row.some((cell, c) => {
          if (sim.entered.has(`${r},${c}`)) return false;
          if (!adjacentToEntered(start, sim.entered, r, c)) return false;
          if (cell.kind === "check" && cell.rotLocked) return true;
          if (cell.kind === "valve" && cell.toggleLocked && !cell.open) return true;
          return false;
        }),
      );
    default:
      return false;
  }
}

export function auditPuzzle(puzzle: Puzzle, moveSearch = puzzle.moveLimit + 3): Audit {
  const reasons: string[] = [];
  let signature = "";
  try {
    signature = structureKey(puzzle.rows);
  } catch (error) {
    return {
      id: puzzle.id,
      ok: false,
      reasons: [error instanceof Error ? error.message : "parse"],
      par: null,
      ticks: null,
      trace: [],
      signature: "",
      concepts: puzzle.concepts,
    };
  }

  let start: Cell[][];
  try {
    start = parseBoard(puzzle.rows);
  } catch (error) {
    return {
      id: puzzle.id,
      ok: false,
      reasons: [error instanceof Error ? error.message : "parse"],
      par: null,
      ticks: null,
      trace: [],
      signature,
      concepts: puzzle.concepts,
    };
  }

  const free =
    start.flat().filter((cell) => canRotate(cell)).length +
    start.flat().filter((cell) => canToggle(cell)).length;
  if (free < 1) reasons.push("no free fitting");
  if (free > 5) reasons.push(`too many free fittings (${free})`);
  if (puzzle.hints.length !== 3 || puzzle.hints.some((hint) => hint.trim().length < 12)) {
    reasons.push("hints must be three specific lines");
  }
  if (puzzle.why.trim().length < 24) reasons.push("thin difficulty rationale");

  const opening = simulate(start);
  if (opening.status === "win") reasons.push("trivial: already solved");

  const found: SolveResult | null = solve(start, Math.max(moveSearch, puzzle.moveLimit));
  if (!found) {
    reasons.push("unsolvable inside the search");
    return {
      id: puzzle.id,
      ok: false,
      reasons,
      par: null,
      ticks: null,
      trace: [],
      signature,
      concepts: puzzle.concepts,
    };
  }
  if (found.moves < 1) reasons.push("trivial: zero turns");
  if (found.moves !== puzzle.par) reasons.push(`par ${puzzle.par} but shortest is ${found.moves}`);
  if (found.moves > puzzle.moveLimit) reasons.push("shortest line is over the turn budget");

  const within = solve(start, puzzle.moveLimit);
  if (!within) reasons.push("unsolvable inside the published turn budget");

  const finalBoard = applyActions(start, found.actions);
  const sim = simulate(finalBoard);
  if (sim.status !== "win") reasons.push(`trace does not win (${sim.status})`);

  for (const concept of puzzle.concepts) {
    if (!conceptHolds(concept, puzzle, start, finalBoard, sim, found.moves)) {
      reasons.push(`concept not used: ${concept}`);
    }
  }

  if (puzzle.challenge?.maxMoves !== undefined && puzzle.challenge.maxMoves < found.moves) {
    reasons.push("challenge move cap is below the shortest line");
  }

  const trace = found.actions.map((action) => `${action.type}:${action.r},${action.c}`);
  return {
    id: puzzle.id,
    ok: reasons.length === 0,
    reasons,
    par: found.moves,
    ticks: found.ticks,
    trace,
    signature,
    concepts: puzzle.concepts,
  };
}

export function auditAll(puzzles: readonly Puzzle[]): { ok: boolean; audits: Audit[]; duplicates: string[] } {
  const audits = puzzles.map((puzzle) => auditPuzzle(puzzle));
  const seen = new Map<string, string>();
  const duplicates: string[] = [];
  for (const audit of audits) {
    if (!audit.signature) continue;
    const prior = seen.get(audit.signature);
    if (prior) duplicates.push(`${audit.id} repeats the skeleton of ${prior}`);
    else seen.set(audit.signature, audit.id);
  }
  const ids = new Set<string>();
  for (const puzzle of puzzles) {
    if (ids.has(puzzle.id)) duplicates.push(`duplicate id ${puzzle.id}`);
    ids.add(puzzle.id);
  }
  const ok = audits.every((audit) => audit.ok) && duplicates.length === 0 && puzzles.length === 60;
  return { ok, audits, duplicates };
}
