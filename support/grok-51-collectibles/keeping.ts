import { effectN, hasEffect, mustCard } from "./cards.ts";
import {
  HAND_SIZE,
  HEARTH_CAP,
  KIN_CAP,
  LAST_WINTER,
  PLACE_CAP,
  START_HEARTHS,
} from "./rules.ts";
import type { CardDef, Keeping, ZoneCard } from "./types.ts";

/** Unbiased Fisher–Yates driven by mulberry32 so a keeping can be replayed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: readonly T[], seed: number): T[] {
  const next = list.slice();
  const rand = mulberry32(seed);
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const swap = next[i] as T;
    next[i] = next[j] as T;
    next[j] = swap;
  }
  return next;
}

export function storesAtWinterStart(places: readonly CardDef[]): number {
  let stores = 1;
  for (const place of places) {
    stores += 1 + effectN(place, "well");
  }
  return stores;
}

export function weatherTax(keeping: Keeping): number {
  if (!keeping.weather) return 0;
  return effectN(mustCard(keeping.weather.cardId), "tax");
}

export function effectiveBurden(keeping: Keeping): number {
  return Math.max(0, keeping.burden + weatherTax(keeping));
}

export function stokeOf(keeping: Keeping): number {
  let stoke = keeping.bonusStoke;
  for (const kin of keeping.kin) {
    stoke += mustCard(kin.cardId).kindling;
    for (const heirloom of keeping.heirlooms) {
      if (heirloom.attachedTo === kin.instance) {
        stoke += effectN(mustCard(heirloom.cardId), "bond");
      }
    }
  }
  for (const place of keeping.places) stoke += mustCard(place.cardId).kindling;
  if (keeping.weather) stoke += mustCard(keeping.weather.cardId).kindling;
  for (const id of keeping.playedMemories) stoke += mustCard(id).kindling;
  return stoke;
}

export interface OpenKeeping {
  deck: string[];
  seed?: number;
  /** If this id is in the deck, the practice hand opens with it. */
  openWith?: string;
}

export function startKeeping(options: OpenKeeping): Keeping {
  const seed = options.seed ?? 1;
  const deck = shuffle(options.deck, seed);
  const hand: string[] = [];
  if (options.openWith) {
    const at = deck.indexOf(options.openWith);
    if (at >= 0) {
      deck.splice(at, 1);
      hand.push(options.openWith);
    }
  }
  while (hand.length < HAND_SIZE && deck.length > 0) {
    const drawn = deck.shift();
    if (drawn) hand.push(drawn);
  }
  return {
    seed,
    winter: 1,
    hearths: START_HEARTHS,
    shield: false,
    stores: storesAtWinterStart([]),
    burden: 1,
    bonusStoke: 0,
    phase: "play",
    deck,
    hand,
    kin: [],
    places: [],
    heirlooms: [],
    weather: null,
    kept: [],
    playedMemories: [],
    pending: null,
    log: ["Winter 1. Burden 1. Stores 1. The keeping room is cold and empty."],
    seq: 1,
  };
}

function drawCards(keeping: Keeping, n: number): string {
  const drawn: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const next = keeping.deck.shift();
    if (!next) break;
    keeping.hand.push(next);
    drawn.push(mustCard(next).name);
  }
  if (drawn.length === 0) return "The deck is empty.";
  return `Drew ${drawn.join(", ")}.`;
}

export function playBlock(keeping: Keeping, cardId: string, attachTo?: string): string | null {
  if (keeping.phase === "won" || keeping.phase === "lost") return "The keeping is already over.";
  if (keeping.phase === "search" || keeping.pending) return "Finish the search before you play anything else.";
  if (!keeping.hand.includes(cardId)) return "That card is not in your hand.";
  const card = mustCard(cardId);
  if (card.cost > keeping.stores) return `You need ${card.cost} stores and have ${keeping.stores}.`;
  if (card.type === "heirloom" && keeping.kin.length === 0) return "An heirloom needs a kin in play to attach to.";
  if (card.type === "heirloom" && attachTo && !keeping.kin.some((kin) => kin.instance === attachTo)) {
    return "That kin is not in play.";
  }
  if (card.type === "kin" && keeping.kin.length >= KIN_CAP) return "Four kin are already in play. The chair is full.";
  if (card.type === "place" && keeping.places.length >= PLACE_CAP) return "Three places are already in play.";
  if (hasEffect(card, "search") && keeping.deck.length === 0) return "There is nothing left to search.";
  return null;
}

export interface PlayOptions {
  attachTo?: string;
  /** Index into the searched cards. Omit to leave the search pending. */
  searchPick?: number;
}

/**
 * Plays one card from hand if the printed law allows it.
 * Returns the same log line the table shows. Illegal plays leave the keeping unchanged
 * except the caller may record a notice.
 */
export function playCard(keeping: Keeping, cardId: string, options: PlayOptions = {}): { keeping: Keeping; error: string | null } {
  const error = playBlock(keeping, cardId, options.attachTo);
  if (error) return { keeping, error };
  const next = structuredClone(keeping) as Keeping;
  const card = mustCard(cardId);
  const handAt = next.hand.indexOf(cardId);
  next.hand.splice(handAt, 1);
  next.stores -= card.cost;
  const notes: string[] = [`Played ${card.name}.`];

  if (card.type === "kin") {
    next.seq += 1;
    next.kin.push({ instance: `z${next.seq}`, cardId });
  } else if (card.type === "place") {
    next.seq += 1;
    next.places.push({ instance: `z${next.seq}`, cardId });
  } else if (card.type === "heirloom") {
    const host =
      options.attachTo && next.kin.some((kin) => kin.instance === options.attachTo)
        ? options.attachTo
        : next.kin[0]?.instance;
    next.seq += 1;
    next.heirlooms.push({ instance: `z${next.seq}`, cardId, attachedTo: host });
    const hostName = next.kin.find((kin) => kin.instance === host);
    notes.push(`Attached to ${hostName ? mustCard(hostName.cardId).name : "a kin"}.`);
  } else if (card.type === "weather") {
    if (next.weather) {
      next.kept.push(next.weather.cardId);
      notes.push(`${mustCard(next.weather.cardId).name} leaves the sky.`);
    }
    next.seq += 1;
    next.weather = { instance: `z${next.seq}`, cardId };
  } else {
    next.playedMemories.push(cardId);
    next.kept.push(cardId);
  }

  for (const effect of card.effects) {
    if (effect.op === "draw") notes.push(drawCards(next, effect.n));
    if (effect.op === "mend") {
      const before = next.hearths;
      next.hearths = Math.min(HEARTH_CAP, next.hearths + effect.n);
      notes.push(next.hearths > before ? `Mended ${next.hearths - before} hearth.` : "Hearths are already full.");
    }
    if (effect.op === "ease") {
      const before = next.burden;
      next.burden = Math.max(0, next.burden - effect.n);
      notes.push(`Burden eased from ${before} to ${next.burden}.`);
    }
    if (effect.op === "stores") {
      next.stores += effect.n;
      notes.push(`Gained ${effect.n} stores.`);
    }
    if (effect.op === "shield") {
      next.shield = true;
      notes.push("A shield is up.");
    }
    if (effect.op === "recall") {
      const memory = [...next.kept].reverse().find((id) => mustCard(id).type === "memory" && id !== cardId);
      if (memory) {
        const at = next.kept.lastIndexOf(memory);
        next.kept.splice(at, 1);
        next.hand.push(memory);
        notes.push(`${mustCard(memory).name} returns to your hand.`);
      } else {
        notes.push(drawCards(next, 1));
      }
    }
    if (effect.op === "search") {
      const n = Math.min(effect.n, next.deck.length);
      const optionsIds = next.deck.slice(0, n);
      if (options.searchPick === undefined) {
        next.pending = { options: optionsIds };
        next.phase = "search";
        notes.push(`Search ${n}: choose one to keep.`);
      } else {
        notes.push(chooseFrom(next, optionsIds, options.searchPick));
      }
    }
  }

  next.log = [...next.log, notes.join(" ")].slice(-40);
  return { keeping: next, error: null };
}

function chooseFrom(keeping: Keeping, options: string[], pick: number): string {
  if (options.length === 0) {
    keeping.pending = null;
    keeping.phase = "play";
    return "The search found nothing.";
  }
  const index = Math.max(0, Math.min(options.length - 1, pick));
  const chosen = options[index] as string;
  // Remove the looked-at cards from the front of the deck if they still sit there.
  const front = keeping.deck.slice(0, options.length);
  const same = front.length === options.length && front.every((id, i) => id === options[i]);
  if (same) keeping.deck.splice(0, options.length);
  keeping.hand.push(chosen);
  const rest = options.filter((_, i) => i !== index);
  keeping.deck.push(...rest);
  keeping.pending = null;
  keeping.phase = "play";
  return `Kept ${mustCard(chosen).name}. Put ${rest.length} on the bottom.`;
}

export function chooseSearch(keeping: Keeping, pick: number): { keeping: Keeping; error: string | null } {
  if (!keeping.pending || keeping.phase !== "search") {
    return { keeping, error: "There is no search waiting." };
  }
  const next = structuredClone(keeping) as Keeping;
  const line = chooseFrom(next, next.pending?.options ?? [], pick);
  next.log = [...next.log, line].slice(-40);
  return { keeping: next, error: null };
}

export function resolveWinter(keeping: Keeping): { keeping: Keeping; error: string | null } {
  if (keeping.phase === "search") return { keeping, error: "Finish the search before the winter closes." };
  if (keeping.phase === "won" || keeping.phase === "lost") return { keeping, error: "The keeping is already over." };
  const next = structuredClone(keeping) as Keeping;
  const stoke = stokeOf(next);
  const burden = effectiveBurden(next);
  let line = `Winter ${next.winter}: stoke ${stoke} against burden ${burden}.`;
  if (stoke >= burden) {
    line += " The winter holds.";
  } else if (next.shield) {
    next.shield = false;
    line += " The shield spends itself. The hearth stays.";
  } else {
    next.hearths -= 1;
    line += " A hearth goes out.";
  }
  if (next.hearths <= 0) {
    next.hearths = 0;
    next.phase = "lost";
    line += " The line fails.";
    next.log = [...next.log, line].slice(-40);
    return { keeping: next, error: null };
  }
  if (next.winter >= LAST_WINTER) {
    next.phase = "won";
    line += " Fourteen winters. The line holds.";
    next.log = [...next.log, line].slice(-40);
    return { keeping: next, error: null };
  }
  next.winter += 1;
  next.burden = next.winter;
  next.bonusStoke = 0;
  next.playedMemories = [];
  const placeCards = next.places.map((place) => mustCard(place.cardId));
  next.stores = storesAtWinterStart(placeCards);
  const before = next.hand.length;
  const drew = drawCards(next, Math.max(0, HAND_SIZE - before));
  line += ` Winter ${next.winter} begins. Stores ${next.stores}. ${drew}`;
  next.phase = "play";
  next.log = [...next.log, line].slice(-40);
  return { keeping: next, error: null };
}

/** Highest-kindling legal card, for the table's "lay one" control. Deterministic. */
export function strongestLegal(keeping: Keeping): string | null {
  const legal = keeping.hand.filter((id) => playBlock(keeping, id) === null);
  legal.sort((a, b) => {
    const ca = mustCard(a);
    const cb = mustCard(b);
    return cb.kindling - ca.kindling || ca.cost - cb.cost || a.localeCompare(b);
  });
  return legal[0] ?? null;
}

export function instanceName(zone: ZoneCard): string {
  return mustCard(zone.cardId).name;
}
