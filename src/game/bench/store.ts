import { create } from "zustand";
import {
  createInitialBench,
  everyRequests,
  perform,
  performMany,
  rest,
  salvageRequests,
  toggleFavoriteItem,
  toggleFavoriteRecipe,
  toggleLock,
  undo,
  type BenchState,
  type WorkRequest,
} from "./index.ts";

const KEY = "preincarnation-conservation-bench-v1";

export type Pane = "bench" | "work" | "ledger" | "integrity";
export type PieceFilter = "all" | "material" | "gear" | "heirloom" | "quest" | "favorite";
export type OpFilter = "ready" | "fits" | "all" | "fishing" | "hunting" | "lamp" | "heirloom" | "favorite";
export type BatchMode = "one" | "every" | "salvage";

export interface BenchNotice {
  title: string;
  detail: string;
  nonce: number;
}

interface BenchUi {
  state: BenchState;
  hydrated: boolean;
  pane: Pane;
  pieceFilter: PieceFilter;
  opFilter: OpFilter;
  pieceQuery: string;
  opQuery: string;
  selectedId?: string;
  recipeId?: string;
  choiceId?: string;
  subs: Record<string, string>;
  count: number;
  batchMode: BatchMode;
  confirmReset: boolean;
  notice: BenchNotice | null;
  hydrate: () => void;
  setPane: (pane: Pane) => void;
  setPieceFilter: (filter: PieceFilter) => void;
  setOpFilter: (filter: OpFilter) => void;
  setPieceQuery: (query: string) => void;
  setOpQuery: (query: string) => void;
  selectPiece: (instanceId: string) => void;
  selectRecipe: (recipeId: string) => void;
  setChoice: (choiceId: string) => void;
  setSub: (forId: string, withId: string) => void;
  setCount: (count: number) => void;
  setBatchMode: (mode: BatchMode) => void;
  commit: () => void;
  undoWork: () => void;
  restBench: () => void;
  starPiece: (instanceId: string) => void;
  lockPiece: (instanceId: string) => void;
  starRecipe: (recipeId: string) => void;
  askReset: () => void;
  resetKit: () => void;
}

export function clearBenchStorage() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* a new life still starts */
  }
}

function persist(state: BenchState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* the bench still works for this sitting */
  }
}

function load(): BenchState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BenchState;
    if (!parsed || !Array.isArray(parsed.items) || typeof parsed.focus !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(set: (partial: Partial<BenchUi>) => void, state: BenchState) {
  persist(state);
  set({ state });
}

export const useBench = create<BenchUi>((set, get) => ({
  state: createInitialBench(),
  hydrated: false,
  pane: "bench",
  pieceFilter: "all",
  opFilter: "ready",
  pieceQuery: "",
  opQuery: "",
  subs: {},
  count: 1,
  batchMode: "one",
  confirmReset: false,
  notice: null,
  hydrate: () => {
    const saved = load();
    set({ hydrated: true, ...(saved ? { state: saved } : {}) });
  },
  setPane: (pane) => set({ pane }),
  setPieceFilter: (pieceFilter) => set({ pieceFilter }),
  setOpFilter: (opFilter) => set({ opFilter }),
  setPieceQuery: (pieceQuery) => set({ pieceQuery }),
  setOpQuery: (opQuery) => set({ opQuery }),
  selectPiece: (selectedId) => set({ selectedId, pane: "work", batchMode: "one" }),
  selectRecipe: (recipeId) =>
    set({ recipeId, choiceId: undefined, subs: {}, count: 1, batchMode: "one", pane: "work", notice: null }),
  setChoice: (choiceId) => set({ choiceId }),
  setSub: (forId, withId) => set({ subs: { ...get().subs, [forId]: withId } }),
  setCount: (count) => set({ count: Math.max(1, Math.min(500, Math.floor(count) || 1)) }),
  setBatchMode: (batchMode) => set({ batchMode, pane: "work" }),
  commit: () => {
    const { state, recipeId, selectedId, choiceId, subs, count, batchMode } = get();
    if (batchMode === "salvage") {
      const done = performMany(state, salvageRequests(state));
      if (done.ok) {
        write(set, done.state);
        set({
          notice: { title: done.preview.title, detail: done.preview.feedback, nonce: Date.now() },
        });
      }
      return;
    }
    if (!recipeId) return;
    const req: WorkRequest = {
      recipeId,
      primaryInstanceId: selectedId,
      choiceId,
      substitutes: subs,
      count,
    };
    const done =
      batchMode === "every" ? performMany(state, everyRequests(state, req)) : perform(state, req);
    if (done.ok) {
      write(set, done.state);
      set({
        notice: { title: done.preview.title, detail: done.preview.feedback, nonce: Date.now() },
      });
    }
  },
  undoWork: () => {
    write(set, undo(get().state));
    set({ notice: null });
  },
  restBench: () => {
    const next = rest(get().state);
    if (next === get().state) return;
    write(set, next);
    const latest = next.journal.at(-1);
    set({
      notice: {
        title: latest?.title ?? "Rested",
        detail: latest?.detail ?? "Focus restored. Nothing on the bench was touched.",
        nonce: Date.now(),
      },
    });
  },
  starPiece: (instanceId) => write(set, toggleFavoriteItem(get().state, instanceId)),
  lockPiece: (instanceId) => write(set, toggleLock(get().state, instanceId)),
  starRecipe: (recipeId) => write(set, toggleFavoriteRecipe(get().state, recipeId)),
  askReset: () => set({ confirmReset: !get().confirmReset }),
  resetKit: () => {
    const state = createInitialBench();
    persist(state);
    set({ state, confirmReset: false, selectedId: undefined, recipeId: undefined, notice: null });
  },
}));
