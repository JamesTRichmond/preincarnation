import { CARDS, copyLimit, mustCard } from "./cards.ts";
import { DECK_SIZE, MAX_WEATHER, MIN_KIN, assessDeck } from "./rules.ts";
import type { Bond, CardDef } from "./types.ts";

/**
 * Builds one legal 40-card ledger that contains `cardId`.
 * Every printed card has at least one such deck. This is not a second ruleset;
 * it only fills under assessDeck.
 */
export function legalDeckIncluding(cardId: string): { bond: Bond; cards: string[] } {
  const seed = mustCard(cardId);
  const bond: Bond = seed.affinity === "generation" ? "hearth" : seed.affinity;
  const cards: string[] = [];
  const counts = new Map<string, number>();

  const weatherCount = () => cards.reduce((n, id) => n + (mustCard(id).type === "weather" ? 1 : 0), 0);
  const kinCount = () => cards.reduce((n, id) => n + (mustCard(id).type === "kin" ? 1 : 0), 0);

  const push = (id: string): boolean => {
    const card = mustCard(id);
    if ((counts.get(id) ?? 0) >= copyLimit(card)) return false;
    if (card.type === "weather" && weatherCount() >= MAX_WEATHER) return false;
    cards.push(id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
    return true;
  };

  if (!push(seed.id)) throw new Error(`Could not seat ${cardId}`);

  const pool = CARDS.filter((card) => card.affinity === bond || card.affinity === "generation");
  const kin = pool
    .filter((card) => card.type === "kin")
    .sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));

  for (const card of kin) {
    while (kinCount() < MIN_KIN && push(card.id)) {
      /* fill kin to the printed minimum */
    }
    if (kinCount() >= MIN_KIN) break;
  }
  if (kinCount() < MIN_KIN) throw new Error(`Not enough kin to seat ${cardId}`);

  const filler = pool
    .filter((card) => card.type !== "weather")
    .sort((a, b) => rank(a) - rank(b) || a.cost - b.cost || a.id.localeCompare(b.id));

  let guard = 0;
  while (cards.length < DECK_SIZE && guard < 800) {
    guard += 1;
    let added = false;
    for (const card of filler) {
      if (cards.length >= DECK_SIZE) break;
      if (push(card.id)) added = true;
    }
    if (!added) break;
  }
  if (cards.length !== DECK_SIZE) {
    throw new Error(`Legal deck for ${cardId} stopped at ${cards.length}`);
  }
  const report = assessDeck(cards, bond);
  if (!report.ok) throw new Error(`Legal deck for ${cardId} failed: ${report.errors.join(" ")}`);
  return { bond, cards };
}

function rank(card: CardDef): number {
  if (card.rarity === "common") return 0;
  if (card.rarity === "uncommon") return 1;
  return 2;
}

export function surplus(owned: number, card: CardDef): number {
  return Math.max(0, owned - copyLimit(card));
}
