import { CARDS, IDENTITIES, type Identity } from "@/game/fourteen-winters/cards";
import { pureDeck } from "@/game/fourteen-winters/decks";
import type { Action, Seat } from "@/game/fourteen-winters/engine";

export interface SavedDeck {
  id: string;
  name: string;
  cards: string[];
}

export interface ReplayRecord {
  seed: number;
  era1First: Seat;
  decks: [string[], string[]];
  names: [string, string];
  stacked: boolean;
  turnsPerEra: number;
  freeKeeps: number;
  coach: boolean;
  actions: Action[];
  opponentId: string | null;
  humans: Seat[];
}

export interface Profile {
  version: 1;
  decks: SavedDeck[];
  activeDeckId: string;
  ribbons: string[];
  remembered: Identity[];
  stats: { played: number; wins: number; losses: number; draws: number };
  lastReplay: ReplayRecord | null;
}

const KEY = "fourteen-winters-v1";

export function freshProfile(): Profile {
  const decks = (Object.keys(IDENTITIES) as Identity[]).map((id) => ({
    id,
    name: IDENTITIES[id].name,
    cards: pureDeck(id),
  }));
  return {
    version: 1,
    decks,
    activeDeckId: "orchard",
    ribbons: [],
    remembered: [],
    stats: { played: 0, wins: 0, losses: 0, draws: 0 },
    lastReplay: null,
  };
}

export function loadProfile(): Profile {
  if (typeof localStorage === "undefined") return freshProfile();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshProfile();
    const parsed = JSON.parse(raw) as Profile;
    if (parsed.version !== 1 || !Array.isArray(parsed.decks) || parsed.decks.length === 0) return freshProfile();
    return parsed;
  } catch {
    return freshProfile();
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function primaryIdentity(cards: string[]): Identity | null {
  const counts = new Map<Identity, number>();
  for (const id of cards) {
    const card = CARDS[id];
    if (!card) continue;
    counts.set(card.identity, (counts.get(card.identity) ?? 0) + 1);
  }
  let best: Identity | null = null;
  let n = 0;
  for (const [identity, count] of counts) {
    if (count > n) {
      best = identity;
      n = count;
    }
  }
  return best;
}
