import type { AccessId } from "./types.ts";
import type { Replay } from "./replay.ts";
import type { Medal } from "./medals.ts";
import { medalFor } from "./medals.ts";
import { buildReplay, type Run } from "./session.ts";

export const STORAGE_KEY = "preincarnation.traversal.v1";

export type Best = {
  frames: number;
  medal: Medal | null;
  at: number;
  replay: Replay;
};

export type Board = {
  version: 1;
  standard: Record<string, Best>;
  assist: Record<string, Best>;
  /** Course ids whose field note was earned. Cosmetic only. */
  notes: string[];
};

export type Kv = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type ClearResult = {
  saved: boolean;
  medal: Medal | null;
  note: string | null;
  pb: boolean;
  frames: number;
};

export function emptyBoard(): Board {
  return { version: 1, standard: {}, assist: {}, notes: [] };
}

export function browserKv(): Kv | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function loadBoard(kv: Kv | null): Board {
  if (!kv) return emptyBoard();
  try {
    const raw = kv.getItem(STORAGE_KEY);
    if (!raw) return emptyBoard();
    const parsed = JSON.parse(raw) as Partial<Board>;
    if (parsed.version !== 1) return emptyBoard();
    return {
      version: 1,
      standard: parsed.standard ?? {},
      assist: parsed.assist ?? {},
      notes: Array.isArray(parsed.notes) ? parsed.notes.filter((n) => typeof n === "string") : [],
    };
  } catch {
    return emptyBoard();
  }
}

function writeBoard(kv: Kv | null, board: Board) {
  if (!kv) return;
  try {
    kv.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {
    /* quota or private mode — the run still happened */
  }
}

/**
 * Persists a legal finish. A death, a teleport, or a missing checkpoint
 * writes nothing. Assist times stay off the ranked board.
 */
export function recordClear(kv: Kv | null, run: Run): ClearResult {
  const frames = run.liveFrames;
  const blank: ClearResult = { saved: false, medal: null, note: null, pb: false, frames };
  if (!run.finished) return blank;
  if (run.invalid === "teleport") return blank;
  if (run.nextCheck < run.course.checks.length) return blank;

  const assist = run.access.id === "assist" || run.qaUnranked || run.invalid === "qa-unranked";
  const access: AccessId = assist ? "assist" : "standard";
  const medal = medalFor(run.course.id, frames, access);
  const board = loadBoard(kv);
  const bucket = assist ? board.assist : board.standard;
  const prev = bucket[run.course.id];
  const pb = !prev || frames < prev.frames;
  if (pb) {
    bucket[run.course.id] = {
      frames,
      medal,
      at: Date.now(),
      replay: buildReplay(run),
    };
  }
  if (!board.notes.includes(run.course.id)) board.notes.push(run.course.id);
  writeBoard(kv, board);
  return { saved: true, medal, note: run.course.fieldNote, pb, frames };
}
