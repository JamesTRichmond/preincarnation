import { countsAsBond, effectN, hasEffect, mustCard } from "./cards.ts";
import type { Bond, CardDef, CardType } from "./types.ts";

/** Printed law. The play engine and the card face both read this text. */
export function rulesOf(card: CardDef): string {
  const bits: string[] = [`Cost ${card.cost}.`];
  if (card.type === "kin") {
    bits.push(`Kin. While in play, stokes ${card.kindling} each winter. At most 4 kin.`);
  } else if (card.type === "place") {
    bits.push(
      `Place. While in play, stokes ${card.kindling}. Each place gives 1 stores at the start of a winter. At most 3 places.`,
    );
  } else if (card.type === "memory") {
    bits.push(`Memory. Stokes ${card.kindling} the winter you play it, then it is kept.`);
  } else if (card.type === "heirloom") {
    bits.push("Heirloom. Attach it to a kin you have in play.");
  } else {
    bits.push("Weather. Only one weather is in play. A new one replaces the old.");
  }
  for (const effect of card.effects) {
    switch (effect.op) {
      case "draw":
        bits.push(`Draw ${effect.n}.`);
        break;
      case "mend":
        bits.push(`Mend ${effect.n} hearth, to a maximum of 5.`);
        break;
      case "ease":
        bits.push(`Ease this winter's burden by ${effect.n}.`);
        break;
      case "stores":
        bits.push(`Gain ${effect.n} stores.`);
        break;
      case "well":
        bits.push(`While in play, gain ${effect.n} extra stores at the start of each winter.`);
        break;
      case "search":
        bits.push(`Look at the top ${effect.n}. Keep 1. Put the rest on the bottom.`);
        break;
      case "shield":
        bits.push("Gain a shield. The next winter you would lose a hearth, you do not.");
        break;
      case "tax":
        bits.push(`While this weather is in play, add ${effect.n} to each winter's burden.`);
        break;
      case "bond":
        bits.push(`The kin this is attached to stokes ${effect.n} extra each winter.`);
        break;
      case "recall":
        bits.push("Return the last kept memory to your hand. If none are kept, draw 1.");
        break;
      default:
        break;
    }
  }
  if (card.affinity === "generation") {
    bits.push("Generation: counts toward whichever bond the deck declared.");
  }
  return bits.join(" ");
}

export const KEEPING_LAW = [
  "A ledger deck is exactly 40 cards.",
  "Commons may appear 3 times, uncommons 2, rares 1.",
  "Declare one bond: Hearth, Trail, Chapel, River, or Night.",
  "At least 12 cards must bear that bond. Generation cards count for any bond.",
  "At least 8 cards must be kin. At most 6 cards may be weather.",
  "You begin a keeping with 3 hearths, a hand of 5, and no shield.",
  "Each winter's burden starts equal to its number, from 1 through 14.",
  "Stores at the start of a winter are 1, plus 1 for each place, plus each place's well.",
  "Pay a card's cost in stores to play it. Resolve what is printed, then stoke.",
  "Stoke is the kindling of your kin, places, and weather, heirloom bonds, memories played this winter, and nothing else.",
  "Weather tax is added to the burden when you compare stoke. Ease lowers the base burden.",
  "If stoke meets the burden, the winter holds. If it does not, lose 1 hearth unless a shield spends itself.",
  "After winter 14, if a hearth remains, the line holds. At 0 hearths, the keeping fails.",
].join(" ");

export const DECK_SIZE = 40;
export const MIN_BOND = 12;
export const MIN_KIN = 8;
export const MAX_WEATHER = 6;
export const KIN_CAP = 4;
export const PLACE_CAP = 3;
export const HEARTH_CAP = 5;
export const START_HEARTHS = 3;
export const HAND_SIZE = 5;
export const LAST_WINTER = 14;

export interface DeckReport {
  ok: boolean;
  errors: string[];
  size: number;
  bondCount: number;
  kinCount: number;
  weatherCount: number;
}

export function assessDeck(cardIds: readonly string[], bond: Bond): DeckReport {
  const errors: string[] = [];
  const counts = new Map<string, number>();
  let kinCount = 0;
  let weatherCount = 0;
  let bondCount = 0;
  for (const id of cardIds) {
    let card: CardDef;
    try {
      card = mustCard(id);
    } catch {
      errors.push(`Unknown card ${id}.`);
      continue;
    }
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (card.type === "kin") kinCount += 1;
    if (card.type === "weather") weatherCount += 1;
    if (countsAsBond(card, bond)) bondCount += 1;
  }
  if (cardIds.length !== DECK_SIZE) {
    errors.push(`A ledger deck is ${DECK_SIZE} cards, not ${cardIds.length}.`);
  }
  for (const [id, count] of counts) {
    const card = mustCard(id);
    const limit = card.rarity === "common" ? 3 : card.rarity === "uncommon" ? 2 : 1;
    if (count > limit) errors.push(`${card.name} is in the deck ${count} times; the limit is ${limit}.`);
  }
  if (bondCount < MIN_BOND) {
    errors.push(`Bond ${bond} has ${bondCount} cards; it needs ${MIN_BOND}.`);
  }
  if (kinCount < MIN_KIN) errors.push(`The deck has ${kinCount} kin; it needs ${MIN_KIN}.`);
  if (weatherCount > MAX_WEATHER) {
    errors.push(`The deck has ${weatherCount} weather; the limit is ${MAX_WEATHER}.`);
  }
  return {
    ok: errors.length === 0,
    errors,
    size: cardIds.length,
    bondCount,
    kinCount,
    weatherCount,
  };
}

export function typeLabel(type: CardType): string {
  if (type === "kin") return "Kin";
  if (type === "place") return "Place";
  if (type === "memory") return "Memory";
  if (type === "weather") return "Weather";
  return "Heirloom";
}

export { effectN, hasEffect };
