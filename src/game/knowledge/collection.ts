import { CARDS, CARDS_BY_ID } from "./cards.ts";
import { lootId, lootNumber } from "./ids.ts";
import { MANUALS, MANUALS_BY_ID } from "./manuals.ts";
import { PIECES, PIECES_BY_ID } from "./music.ts";
import { PUZZLES, PUZZLES_BY_ID } from "./puzzles.ts";
import { ACTIONS_BY_ID, freshCamp } from "./recipes.ts";
import type { Discovery } from "./types.ts";
import type { HostHooks } from "./types.ts";

export const FEATURED = {
  cards: [1, 2, 3, 4, 5].map(lootId),
  music: [21, 22, 23, 24, 25].map(lootId),
  puzzles: [41, 42, 43, 44, 45].map(lootId),
  manuals: [61, 62, 63, 64, 65].map(lootId),
};

export function freshDiscovery(): Discovery {
  return {
    version: 1,
    found: [...FEATURED.cards, ...FEATURED.music, ...FEATURED.puzzles, ...FEATURED.manuals],
    read: [],
    solved: [],
    performed: [],
    heard: [],
    unlocked: [],
    camp: freshCamp(),
  };
}

export function coerceKnowledge(raw: unknown): Discovery {
  const fresh = freshDiscovery();
  if (!raw || typeof raw !== "object") return fresh;
  const k = raw as Partial<Discovery>;
  if (k.version !== 1 || !k.camp?.pantry || !Array.isArray(k.found)) return fresh;
  return {
    ...fresh,
    ...k,
    version: 1,
    found: k.found,
    read: Array.isArray(k.read) ? k.read : [],
    solved: Array.isArray(k.solved) ? k.solved : [],
    performed: Array.isArray(k.performed) ? k.performed : [],
    heard: Array.isArray(k.heard) ? k.heard : [],
    unlocked: Array.isArray(k.unlocked) ? k.unlocked : [],
    camp: {
      ...fresh.camp,
      ...k.camp,
      pantry: { ...fresh.camp.pantry, ...k.camp.pantry },
      tuningCents: { ...fresh.camp.tuningCents, ...(k.camp.tuningCents ?? {}) },
      notebook: Array.isArray(k.camp.notebook) ? k.camp.notebook : [],
    },
  };
}

export function nameOf(id: string): string {
  return (
    CARDS_BY_ID.get(id)?.name ??
    PIECES_BY_ID.get(id)?.title ??
    PUZZLES_BY_ID.get(id)?.title ??
    MANUALS_BY_ID.get(id)?.title ??
    ACTIONS_BY_ID.get(id)?.name ??
    id
  );
}

export function absorbUnlocks(state: Discovery, ids: string[]): Discovery {
  const next = cloneDiscovery(state);
  for (const id of ids) {
    const n = lootNumber(id);
    if (n) {
      if (!next.found.includes(id)) next.found.push(id);
    } else if (!next.unlocked.includes(id)) {
      next.unlocked.push(id);
    }
  }
  return next;
}

export function markRead(state: Discovery, id: string): Discovery {
  const next = cloneDiscovery(state);
  if (!next.read.includes(id)) next.read.push(id);
  const manual = MANUALS_BY_ID.get(id);
  if (manual && !next.unlocked.includes(manual.actionId)) next.unlocked.push(manual.actionId);
  const following = nextLoot(id);
  if (following && !next.found.includes(following)) next.found.push(following);
  return next;
}

export function markSolved(state: Discovery, id: string): Discovery {
  const next = cloneDiscovery(state);
  if (!next.solved.includes(id)) next.solved.push(id);
  const board = PUZZLES_BY_ID.get(id);
  if (board && !next.found.includes(board.bindsMusicId)) next.found.push(board.bindsMusicId);
  const following = nextLoot(id);
  if (following && !next.found.includes(following)) next.found.push(following);
  return next;
}

export function markHeard(state: Discovery, id: string): Discovery {
  const next = cloneDiscovery(state);
  if (!next.heard.includes(id)) next.heard.push(id);
  const following = nextLoot(id);
  if (following && !next.found.includes(following)) next.found.push(following);
  return next;
}

export function markPerformed(state: Discovery, id: string): Discovery {
  const next = cloneDiscovery(state);
  if (!next.performed.includes(id)) next.performed.push(id);
  return next;
}

export function registerKnowledgePack(host?: HostHooks): {
  cards: number;
  pieces: number;
  boards: number;
  manuals: number;
  actions: number;
  bound: boolean;
} {
  host?.fourteenWinters?.addCards(CARDS);
  host?.instruments?.addPieces(PIECES);
  host?.sugarLine?.addBoards(PUZZLES);
  host?.recipes?.addActions([...ACTIONS_BY_ID.values()]);
  host?.notebook?.addManuals(MANUALS);
  return {
    cards: CARDS.length,
    pieces: PIECES.length,
    boards: PUZZLES.length,
    manuals: MANUALS.length,
    actions: ACTIONS_BY_ID.size,
    bound: Boolean(host && Object.values(host).some(Boolean)),
  };
}

function nextLoot(id: string): string | null {
  const n = lootNumber(id);
  if (!n) return null;
  const bandEnd = n <= 20 ? 20 : n <= 40 ? 40 : n <= 60 ? 60 : 80;
  if (n >= bandEnd) return null;
  return lootId(n + 1);
}

function cloneDiscovery(state: Discovery): Discovery {
  return {
    ...state,
    found: [...state.found],
    read: [...state.read],
    solved: [...state.solved],
    performed: [...state.performed],
    heard: [...state.heard],
    unlocked: [...state.unlocked],
    camp: {
      ...state.camp,
      pantry: { ...state.camp.pantry },
      tuningCents: { ...state.camp.tuningCents },
      notebook: [...state.camp.notebook],
    },
  };
}
