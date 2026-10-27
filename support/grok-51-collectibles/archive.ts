import { copyLimit, getCard, mustCard } from "./cards.ts";
import { CARDS } from "./cards.ts";
import { legalDeckIncluding } from "./deck.ts";
import {
  DECORATIONS,
  ROOM_SLOTS,
  STARTER_PLACEMENT,
  mustDecoration,
  rotationsFor,
} from "./decorations.ts";
import { DOCUMENTS, INVESTIGATIONS, STARTER_DOCUMENTS, getDocument, mustDocument } from "./documents.ts";
import { getHunt, huntNode, mustHunt } from "./hunts.ts";
import { chooseSearch, playCard, resolveWinter, startKeeping } from "./keeping.ts";
import { MAX_WEATHER, assessDeck } from "./rules.ts";
import type { Bond, Discovery, Save } from "./types.ts";

export type Action =
  | { type: "place"; decorationId: string; slotId: string }
  | { type: "clear"; slotId: string }
  | { type: "rotate"; slotId: string }
  | { type: "addToDeck"; deckId: string; cardId: string }
  | { type: "removeFromDeck"; deckId: string; index: number }
  | { type: "setBond"; deckId: string; bond: Bond }
  | { type: "newDeck" }
  | { type: "setActiveDeck"; deckId: string }
  | { type: "seat"; cardId: string }
  | { type: "read"; docId: string }
  | { type: "followUp"; docId: string }
  | { type: "discard"; docId: string }
  | { type: "setOut"; mapId: string }
  | { type: "walk"; to: string }
  | { type: "searchGround" }
  | { type: "leaveGround" }
  | { type: "startKeeping"; openWith?: string }
  | { type: "playCard"; cardId: string; attachTo?: string; searchPick?: number }
  | { type: "chooseSearch"; pick: number }
  | { type: "resolveWinter" }
  | { type: "endKeeping" };

function unlock(save: Save, id: string) {
  if (!save.understandings.includes(id)) save.understandings.push(id);
}

function addDiscovery(save: Save, discovery: Omit<Discovery, "id">) {
  const id = `${discovery.kind}:${discovery.sourceId}:${discovery.speaker}`;
  if (save.discoveries.some((item) => item.id === id)) return;
  save.discoveries.push({ ...discovery, id });
}

export function registerDecoration(save: Save, id: string): void {
  const item = mustDecoration(id);
  if (save.decorations.includes(id)) {
    save.duplicates[id] = (save.duplicates[id] ?? 0) + 1;
    save.lastNotice = `${item.name} is already in the house. The duplicate is recorded, not doubled on a shelf.`;
    return;
  }
  save.decorations.push(id);
  unlock(save, id);
  save.lastNotice = `${item.name} is in the house now.`;
}

export function registerDocument(save: Save, id: string): void {
  if (!getDocument(id)) return;
  if (!save.documents.includes(id)) save.documents.push(id);
}

function closeInvestigations(save: Save) {
  for (const investigation of INVESTIGATIONS) {
    if (save.completed.includes(investigation.id)) continue;
    const ready = investigation.evidence.every((id) => save.read.includes(id));
    if (!ready) continue;
    save.completed.push(investigation.id);
    addDiscovery(save, {
      sourceId: investigation.id,
      speaker: investigation.verdict.speaker,
      text: investigation.verdict.text,
      kind: "verdict",
    });
    for (const doc of DOCUMENTS) {
      if (doc.investigationId === investigation.id) unlock(save, doc.id);
    }
    save.lastNotice = `${investigation.title}: ${investigation.verdict.speaker} has an answer.`;
  }
}

function deckById(save: Save, deckId: string) {
  return save.decks.find((deck) => deck.id === deckId);
}

export function initialSave(): Save {
  const cards: Record<string, number> = {};
  for (const card of CARDS) cards[card.id] = copyLimit(card);
  const decorations = DECORATIONS.filter((item) => !item.foundIn).map((item) => item.id);
  const placed = Object.fromEntries(
    ROOM_SLOTS.map((slot) => {
      const decorationId = STARTER_PLACEMENT[slot.id];
      return [slot.id, decorationId ? { decorationId, rotation: 0 } : null];
    }),
  );
  const seated = legalDeckIncluding("fw-004");
  return {
    version: 1,
    cards,
    duplicates: {},
    decorations,
    placed,
    documents: [...STARTER_DOCUMENTS],
    read: [],
    understandings: decorations.slice(),
    playedCards: [],
    discoveries: [],
    completed: [],
    decks: [
      {
        id: "deck-hearth",
        name: "Grandmother's ledger",
        bond: seated.bond,
        cards: seated.cards,
      },
    ],
    activeDeckId: "deck-hearth",
    excursion: null,
    huntsFound: [],
    keeping: null,
    rng: 1,
    lastNotice: "The keeping room is as the family left it.",
  };
}

export function reduce(save: Save, action: Action): Save {
  const next = structuredClone(save) as Save;
  switch (action.type) {
    case "place": {
      const item = getDecorationOrNotice(next, action.decorationId);
      if (!item) return next;
      if (!next.decorations.includes(item.id)) {
        next.lastNotice = "You do not have that object yet.";
        return next;
      }
      const slot = ROOM_SLOTS.find((entry) => entry.id === action.slotId);
      if (!slot) {
        next.lastNotice = "That place is not in the room.";
        return next;
      }
      if (!item.fits.includes(slot.kind)) {
        next.lastNotice = `${item.name} will not sit on the ${slot.kind}.`;
        return next;
      }
      const already = Object.entries(next.placed).find(([, placed]) => placed?.decorationId === item.id);
      if (already) {
        next.lastNotice = `${item.name} is already on ${already[0]}. Clear it before you move it.`;
        return next;
      }
      if (next.placed[slot.id]) {
        next.lastNotice = `${slot.label} is occupied. Clear it first.`;
        return next;
      }
      next.placed[slot.id] = { decorationId: item.id, rotation: 0 };
      next.lastNotice = `Placed ${item.name} on ${slot.label}.`;
      return next;
    }
    case "clear": {
      const slot = ROOM_SLOTS.find((entry) => entry.id === action.slotId);
      if (!slot || !next.placed[slot.id]) {
        next.lastNotice = "Nothing is there to take down.";
        return next;
      }
      const name = mustDecoration(next.placed[slot.id]!.decorationId).name;
      next.placed[slot.id] = null;
      next.lastNotice = `${name} is back in the closet.`;
      return next;
    }
    case "rotate": {
      const slot = ROOM_SLOTS.find((entry) => entry.id === action.slotId);
      const placed = slot ? next.placed[slot.id] : null;
      if (!slot || !placed) {
        next.lastNotice = "Nothing is there to turn.";
        return next;
      }
      const turns = rotationsFor(slot.kind);
      const index = turns.indexOf(placed.rotation);
      const rotation = turns[(index + 1) % turns.length] ?? 0;
      placed.rotation = rotation;
      const item = mustDecoration(placed.decorationId);
      next.lastNotice =
        rotation === 180 ? `${item.name} shows its back.` : `${item.name} turned to ${rotation}°.`;
      return next;
    }
    case "addToDeck": {
      const deck = deckById(next, action.deckId);
      const card = getCard(action.cardId);
      if (!deck || !card) {
        next.lastNotice = "That card or deck is not in the ledger.";
        return next;
      }
      const owned = next.cards[card.id] ?? 0;
      const used = deck.cards.filter((id) => id === card.id).length;
      if (used >= owned) {
        next.lastNotice = `You do not have another copy of ${card.name}.`;
        return next;
      }
      if (used >= copyLimit(card)) {
        next.lastNotice = `${card.name} is already at its deck limit of ${copyLimit(card)}. The extra copy stays in the binder.`;
        return next;
      }
      if (deck.cards.length >= 40) {
        next.lastNotice = "A ledger deck stops at 40.";
        return next;
      }
      if (card.type === "weather") {
        const weather = deck.cards.filter((id) => getCard(id)?.type === "weather").length;
        if (weather >= MAX_WEATHER) {
          next.lastNotice = "The deck already has 6 weather cards.";
          return next;
        }
      }
      deck.cards.push(card.id);
      next.lastNotice = `${card.name} entered ${deck.name}.`;
      return next;
    }
    case "removeFromDeck": {
      const deck = deckById(next, action.deckId);
      if (!deck || !deck.cards[action.index]) {
        next.lastNotice = "That card is not in the deck.";
        return next;
      }
      const [removed] = deck.cards.splice(action.index, 1);
      next.lastNotice = `${mustCard(removed!).name} left the deck and stays in the binder.`;
      return next;
    }
    case "setBond": {
      const deck = deckById(next, action.deckId);
      if (!deck) return next;
      deck.bond = action.bond;
      next.lastNotice = `${deck.name} declares ${action.bond}.`;
      return next;
    }
    case "newDeck": {
      const id = `deck-${next.decks.length + 1}`;
      next.decks.push({ id, name: "Untitled ledger", bond: "hearth", cards: [] });
      next.activeDeckId = id;
      next.lastNotice = "A new ledger is open. It is not legal until it holds 40 cards under the bond.";
      return next;
    }
    case "setActiveDeck": {
      if (!deckById(next, action.deckId)) return next;
      next.activeDeckId = action.deckId;
      next.lastNotice = "Active ledger changed.";
      return next;
    }
    case "seat": {
      const card = getCard(action.cardId);
      if (!card) return next;
      const built = legalDeckIncluding(card.id);
      const deck = deckById(next, next.activeDeckId) ?? next.decks[0];
      if (!deck) return next;
      deck.bond = built.bond;
      deck.cards = built.cards;
      deck.name = `${card.name} ledger`;
      next.activeDeckId = deck.id;
      next.lastNotice = `${card.name} sits in a legal ${built.bond} ledger.`;
      return next;
    }
    case "read": {
      if (!next.documents.includes(action.docId)) {
        next.lastNotice = "That paper is not in the desk yet.";
        return next;
      }
      const doc = mustDocument(action.docId);
      if (!next.read.includes(doc.id)) next.read.push(doc.id);
      if (doc.response) {
        addDiscovery(next, {
          sourceId: doc.id,
          speaker: doc.response.speaker,
          text: doc.response.text,
          kind: "response",
        });
      }
      if (doc.finding) {
        addDiscovery(next, {
          sourceId: doc.id,
          speaker: doc.from,
          text: doc.finding,
          kind: "finding",
        });
      }
      for (const grant of doc.grants ?? []) registerDocument(next, grant);
      closeInvestigations(next);
      next.lastNotice = `Read ${doc.title}.`;
      return next;
    }
    case "followUp": {
      const doc = getDocument(action.docId);
      if (!doc?.followUp) {
        next.lastNotice = "There is nothing further to take from that paper.";
        return next;
      }
      if (!next.read.includes(doc.id)) {
        next.lastNotice = "Read it before you go looking for what it points at.";
        return next;
      }
      if (next.documents.includes(doc.followUp.id)) {
        next.lastNotice = "You already took that down.";
        return next;
      }
      registerDocument(next, doc.followUp.id);
      const taken = mustDocument(doc.followUp.id);
      addDiscovery(next, {
        sourceId: doc.id,
        speaker: "Nell",
        text: `${doc.followUp.label}. ${taken.title} is on the desk now.`,
        kind: "response",
      });
      next.lastNotice = doc.followUp.label;
      return next;
    }
    case "discard": {
      const doc = getDocument(action.docId);
      if (!doc || !next.documents.includes(doc.id)) {
        next.lastNotice = "That paper is not yours to throw out.";
        return next;
      }
      if (doc.protected) {
        next.lastNotice = "Quest evidence cannot be discarded.";
        return next;
      }
      next.documents = next.documents.filter((id) => id !== doc.id);
      next.lastNotice = `${doc.title} was discarded.`;
      return next;
    }
    case "setOut": {
      const doc = getDocument(action.mapId);
      const hunt = doc?.huntId ? getHunt(doc.huntId) : undefined;
      if (!doc || !hunt || doc.kind !== "map") {
        next.lastNotice = "That is not a map you can walk.";
        return next;
      }
      if (!next.documents.includes(doc.id)) {
        next.lastNotice = "You do not have that map.";
        return next;
      }
      if (!next.read.includes(doc.id)) {
        next.lastNotice = "Read the map before you trust your feet.";
        return next;
      }
      const start = huntNode(hunt, hunt.start);
      next.excursion = {
        huntId: hunt.id,
        mapId: doc.id,
        nodeId: hunt.start,
        visited: [hunt.start],
      };
      next.lastNotice = start ? `You set out. You are at the ${start.name}.` : "You set out.";
      return next;
    }
    case "walk": {
      if (!next.excursion) {
        next.lastNotice = "You are not out on a map.";
        return next;
      }
      const hunt = mustHunt(next.excursion.huntId);
      const here = huntNode(hunt, next.excursion.nodeId);
      if (!here || !here.neighbors.includes(action.to)) {
        next.lastNotice = "There is no path from here to that place.";
        return next;
      }
      const there = huntNode(hunt, action.to);
      next.excursion.nodeId = action.to;
      if (!next.excursion.visited.includes(action.to)) next.excursion.visited.push(action.to);
      next.lastNotice = there ? `You walk to the ${there.name}.` : "You walk.";
      return next;
    }
    case "searchGround": {
      if (!next.excursion) {
        next.lastNotice = "You are not standing on hunted ground.";
        return next;
      }
      const hunt = mustHunt(next.excursion.huntId);
      const node = huntNode(hunt, next.excursion.nodeId);
      if (!node) return next;
      if (!next.read.includes(next.excursion.mapId)) {
        next.lastNotice = "You have no directions you trust yet.";
        return next;
      }
      if (node.id !== hunt.cache) {
        next.lastNotice = node.refusal;
        return next;
      }
      if (next.huntsFound.includes(hunt.id)) {
        next.lastNotice = "The cache is empty. You already lifted what it held.";
        return next;
      }
      next.huntsFound.push(hunt.id);
      for (const id of hunt.grants) {
        if (id.startsWith("dec-")) registerDecoration(next, id);
        else registerDocument(next, id);
      }
      for (const map of hunt.maps) unlock(next, map.docId);
      addDiscovery(next, {
        sourceId: hunt.id,
        speaker: hunt.cacheVoice.speaker,
        text: hunt.cacheVoice.text,
        kind: "cache",
      });
      next.lastNotice = `The cache gives up what it was keeping. ${hunt.cacheVoice.speaker}: “${hunt.cacheVoice.text}”`;
      return next;
    }
    case "leaveGround": {
      next.excursion = null;
      next.lastNotice = "You come back to the keeping room.";
      return next;
    }
    case "startKeeping": {
      const deck = deckById(next, next.activeDeckId);
      if (!deck) return next;
      const report = assessDeck(deck.cards, deck.bond);
      if (!report.ok) {
        next.lastNotice = report.errors[0] ?? "The ledger is not legal.";
        return next;
      }
      if (action.openWith && !deck.cards.includes(action.openWith)) {
        next.lastNotice = "That card is not in the active ledger, so the practice hand cannot open on it.";
        return next;
      }
      const seed = next.rng;
      next.rng += 1;
      next.keeping = startKeeping({ deck: deck.cards, seed, openWith: action.openWith });
      next.lastNotice = action.openWith
        ? `Practice keeping. ${mustCard(action.openWith).name} is in the opening hand.`
        : "A keeping begins. Fourteen winters, if the hearths hold.";
      return next;
    }
    case "playCard": {
      if (!next.keeping) {
        next.lastNotice = "No keeping is in progress.";
        return next;
      }
      const played = playCard(next.keeping, action.cardId, {
        attachTo: action.attachTo,
        searchPick: action.searchPick,
      });
      if (played.error) {
        next.lastNotice = played.error;
        return next;
      }
      next.keeping = played.keeping;
      if (!next.playedCards.includes(action.cardId)) next.playedCards.push(action.cardId);
      const card = mustCard(action.cardId);
      if (card.later) unlock(next, card.id);
      next.lastNotice = next.keeping.log[next.keeping.log.length - 1] ?? "Played.";
      return next;
    }
    case "chooseSearch": {
      if (!next.keeping) return next;
      const chosen = chooseSearch(next.keeping, action.pick);
      if (chosen.error) {
        next.lastNotice = chosen.error;
        return next;
      }
      next.keeping = chosen.keeping;
      next.lastNotice = next.keeping.log[next.keeping.log.length - 1] ?? "Chosen.";
      return next;
    }
    case "resolveWinter": {
      if (!next.keeping) return next;
      const resolved = resolveWinter(next.keeping);
      if (resolved.error) {
        next.lastNotice = resolved.error;
        return next;
      }
      next.keeping = resolved.keeping;
      next.lastNotice = next.keeping.log[next.keeping.log.length - 1] ?? "The winter turns.";
      return next;
    }
    case "endKeeping": {
      next.keeping = null;
      next.lastNotice = "You left the table. The ledger is unchanged.";
      return next;
    }
    default:
      return next;
  }
}

function getDecorationOrNotice(save: Save, id: string) {
  try {
    return mustDecoration(id);
  } catch {
    save.lastNotice = "That object is not in the catalog.";
    return undefined;
  }
}

export function placedIds(save: Save): string[] {
  return Object.values(save.placed)
    .map((slot) => slot?.decorationId)
    .filter((id): id is string => Boolean(id));
}

export function laterOpen(save: Save, id: string): boolean {
  return save.understandings.includes(id);
}
