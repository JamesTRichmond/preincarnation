import { initialSave, reduce } from "./archive.ts";
import { CARDS, copyLimit, hasEffect, mustCard } from "./cards.ts";
import { DECORATIONS, ROOM_SLOTS, rotationsFor } from "./decorations.ts";
import { DOCUMENTS, INVESTIGATIONS } from "./documents.ts";
import { legalDeckIncluding } from "./deck.ts";
import { HUNTS, huntNode, namesInOrder, pathWalks, reachableFromStart } from "./hunts.ts";
import { chooseSearch, playCard, resolveWinter, startKeeping, stokeOf } from "./keeping.ts";
import { assessDeck, rulesOf } from "./rules.ts";

export interface Census {
  cards: number;
  decorations: number;
  documents: number;
  maps: number;
  letters: number;
  evidence: number;
  hunts: number;
  slots: number;
  histories: number;
}

export function census(): Census {
  const histories =
    CARDS.filter((card) => card.later).length + DECORATIONS.length + DOCUMENTS.length;
  return {
    cards: CARDS.length,
    decorations: DECORATIONS.length,
    documents: DOCUMENTS.length,
    maps: DOCUMENTS.filter((doc) => doc.kind === "map").length,
    letters: DOCUMENTS.filter((doc) => doc.kind === "letter").length,
    evidence: DOCUMENTS.filter((doc) => doc.kind === "evidence").length,
    hunts: HUNTS.length,
    slots: ROOM_SLOTS.length,
    histories,
  };
}

function readEverything(save = initialSave()) {
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    const unread = save.documents.filter((id) => !save.read.includes(id));
    if (unread.length === 0) break;
    for (const id of unread) save = reduce(save, { type: "read", docId: id });
    if (save.read.includes("doc-21") && !save.documents.includes("doc-24")) {
      save = reduce(save, { type: "followUp", docId: "doc-21" });
    }
  }
  return save;
}

/** Walks both maps of every hunt and reads every paper they unlock. */
export function proveReachable(save = initialSave()): { save: ReturnType<typeof initialSave>; errors: string[] } {
  const errors: string[] = [];
  save = readEverything(save);
  if (!save.documents.includes("doc-16")) errors.push("Reading Mae's unsent letter did not produce the boot nail.");
  if (!save.documents.includes("doc-24")) errors.push("The school register never came down from the town shelf.");
  for (const hunt of HUNTS) {
    for (const map of hunt.maps) {
      save = reduce(save, { type: "setOut", mapId: map.docId });
      if (!save.excursion || save.excursion.nodeId !== hunt.start) {
        errors.push(`${map.docId} did not set out at the trailhead.`);
        continue;
      }
      for (const step of map.path.slice(1)) {
        save = reduce(save, { type: "walk", to: step });
      }
      if (save.excursion?.nodeId !== hunt.cache) {
        errors.push(`${map.docId} walked off its landmarks and ended at ${save.excursion?.nodeId ?? "nowhere"}.`);
      }
      const beforeDocs = save.documents.length;
      const beforeDup = save.duplicates["dec-05"] ?? 0;
      save = reduce(save, { type: "searchGround" });
      if (!save.huntsFound.includes(hunt.id)) errors.push(`${hunt.id} cache was not found by ${map.docId}.`);
      if (save.huntsFound.includes(hunt.id) && map !== hunt.maps[0]) {
        if (save.documents.length !== beforeDocs) {
          errors.push(`${map.docId} granted the cache a second time.`);
        }
        if ((save.duplicates["dec-05"] ?? 0) !== beforeDup && hunt.id === "hunt-sugar") {
          errors.push("A second search doubled the clay bird again.");
        }
      }
    }
  }
  save = readEverything(save);
  for (const doc of DOCUMENTS) {
    if (!save.documents.includes(doc.id)) errors.push(`${doc.id} never entered the desk.`);
    if (!save.read.includes(doc.id)) errors.push(`${doc.id} was never read.`);
  }
  for (const investigation of INVESTIGATIONS) {
    if (!save.completed.includes(investigation.id)) errors.push(`${investigation.id} did not reach a verdict.`);
  }
  if ((save.duplicates["dec-05"] ?? 0) < 1) errors.push("The clay bird duplicate was not recorded.");
  if (!save.decorations.includes("dec-11")) errors.push("Eli's watch never came home.");
  if (!save.decorations.includes("dec-34")) errors.push("The sexton's spectacles never came home.");
  if (!save.decorations.includes("dec-36")) errors.push("The mitten never came home.");
  for (const doc of DOCUMENTS) {
    if (!save.understandings.includes(doc.id)) errors.push(`Later reading stayed shut for ${doc.id}.`);
  }
  const speakers = new Set(save.discoveries.map((item) => item.speaker));
  for (const name of ["Mae", "Ruth", "Ada Brown", "Jonah", "Ida", "Cal", "Eli"]) {
    if (!speakers.has(name)) errors.push(`No discovery was spoken by ${name}.`);
  }
  return { save, errors };
}

function exerciseCard(cardId: string): string | null {
  const kinId = cardId === "fw-001" ? "fw-013" : "fw-001";
  const filler = ["fw-061", "fw-062", "fw-065", "fw-068", "fw-061", "fw-062", "fw-065", "fw-068"];
  const keeping = startKeeping({ deck: [...filler, cardId], seed: 3 });
  keeping.stores = 10;
  keeping.burden = 6;
  keeping.hand = [cardId];
  keeping.deck = filler.slice();
  keeping.kin = [{ instance: "host", cardId: kinId }];
  keeping.phase = "play";
  keeping.pending = null;
  const before = JSON.stringify({ ...keeping, log: [] });
  const played = playCard(keeping, cardId, { searchPick: 0, attachTo: "host" });
  if (played.error) return `${cardId}: ${played.error}`;
  const after = JSON.stringify({ ...played.keeping, log: [] });
  if (before === after) return `${cardId} did not change the keeping`;
  let next = played.keeping;
  if (next.phase === "search") {
    const chosen = chooseSearch(next, 0);
    if (chosen.error) return `${cardId} search: ${chosen.error}`;
    next = chosen.keeping;
  }
  const resolved = resolveWinter(next);
  if (resolved.error) return `${cardId} resolve: ${resolved.error}`;
  const card = mustCard(cardId);
  const rules = rulesOf(card);
  if (!rules.includes(`Cost ${card.cost}.`)) return `${cardId} rules omit its cost`;
  for (const effect of card.effects) {
    if (effect.op === "draw" && !rules.includes(`Draw ${effect.n}.`)) return `${cardId} rules omit draw`;
    if (effect.op === "bond" && !rules.includes(`${effect.n} extra`)) return `${cardId} rules omit bond`;
    if (effect.op === "tax" && !rules.includes(`${effect.n}`)) return `${cardId} rules omit tax`;
    if (effect.op === "search" && !rules.includes(`top ${effect.n}`)) return `${cardId} rules omit search`;
  }
  if (card.type === "heirloom" && !next.heirlooms.some((item) => item.cardId === cardId && item.attachedTo === "host")) {
    return `${cardId} did not attach`;
  }
  return null;
}

function placeAll(): string[] {
  const errors: string[] = [];
  for (const item of DECORATIONS) {
    let save = initialSave();
    if (!save.decorations.includes(item.id)) save.decorations.push(item.id);
    for (const entry of ROOM_SLOTS) {
      if (save.placed[entry.id]?.decorationId === item.id) {
        save = reduce(save, { type: "clear", slotId: entry.id });
      }
    }
    const slot = ROOM_SLOTS.find((entry) => item.fits.includes(entry.kind));
    if (!slot) {
      errors.push(`${item.id} fits no room slot`);
      continue;
    }
    if (save.placed[slot.id]) save = reduce(save, { type: "clear", slotId: slot.id });
    save = reduce(save, { type: "place", decorationId: item.id, slotId: slot.id });
    if (save.placed[slot.id]?.decorationId !== item.id) {
      errors.push(`${item.id} did not place on ${slot.id}: ${save.lastNotice}`);
      continue;
    }
    const turns = rotationsFor(slot.kind);
    const seen = new Set<number>([0]);
    for (let i = 1; i < turns.length; i += 1) {
      save = reduce(save, { type: "rotate", slotId: slot.id });
      seen.add(save.placed[slot.id]?.rotation ?? -1);
    }
    for (const turn of turns) {
      if (!seen.has(turn)) errors.push(`${item.id} missed rotation ${turn}`);
    }
    if (!turns.includes(90) && seen.has(90)) errors.push(`${item.id} rotated to 90 on a wall`);
    if (turns.includes(180)) {
      let guard = 0;
      while (save.placed[slot.id]?.rotation !== 180 && guard < 6) {
        save = reduce(save, { type: "rotate", slotId: slot.id });
        guard += 1;
      }
      if (save.placed[slot.id]?.rotation !== 180) errors.push(`${item.id} could not be turned to its verso`);
      if (!item.verso.trim()) errors.push(`${item.id} has no verso`);
    }
  }
  return errors;
}

export function validateCatalog(): string[] {
  const errors: string[] = [];
  const counts = census();
  if (counts.cards !== 72) errors.push(`Expected 72 cards, found ${counts.cards}.`);
  if (counts.decorations !== 48) errors.push(`Expected 48 decorations, found ${counts.decorations}.`);
  if (counts.documents !== 24) errors.push(`Expected 24 documents, found ${counts.documents}.`);
  if (counts.maps !== 6 || counts.letters !== 8 || counts.evidence !== 10) {
    errors.push(`Document mix is ${counts.maps} maps, ${counts.letters} letters, ${counts.evidence} evidence.`);
  }
  if (counts.hunts !== 3) errors.push(`Expected 3 hunts, found ${counts.hunts}.`);
  if (counts.slots !== 12) errors.push(`Expected 12 room slots, found ${counts.slots}.`);
  if (CARDS.filter((card) => card.later).length < 12) errors.push("Fewer than 12 cards carry a later reading.");

  const ids = new Set<string>();
  for (const card of CARDS) {
    if (ids.has(card.id)) errors.push(`Duplicate card id ${card.id}`);
    ids.add(card.id);
    if (card.kindling === 0 && card.effects.length === 0) errors.push(`${card.id} does nothing`);
    if (card.later && card.later.year - card.year < 14) errors.push(`${card.id} later reading is under 14 years`);
    if (card.later && card.later.text.trim() === card.then.trim()) errors.push(`${card.id} later reading repeats the first`);
    try {
      const seated = legalDeckIncluding(card.id);
      const report = assessDeck(seated.cards, seated.bond);
      if (!report.ok) errors.push(`${card.id} deck illegal: ${report.errors.join(" ")}`);
      if (!seated.cards.includes(card.id)) errors.push(`${card.id} missing from its own deck`);
      const copies = seated.cards.filter((id) => id === card.id).length;
      if (copies > copyLimit(card)) errors.push(`${card.id} seated over its copy limit`);
    } catch (error) {
      errors.push(`${card.id} could not be seated: ${error instanceof Error ? error.message : "error"}`);
    }
    const exercise = exerciseCard(card.id);
    if (exercise) errors.push(exercise);
    if (hasEffect(card, "recall") && !rulesOf(card).includes("kept memory")) {
      errors.push(`${card.id} recall text drifted`);
    }
  }

  for (const item of DECORATIONS) {
    if (item.later.year - item.year < 14) errors.push(`${item.id} history spans under 14 years`);
    if (item.later.text.trim() === item.then.trim()) errors.push(`${item.id} history does not change`);
    if (item.look.length < 40) errors.push(`${item.id} inspect text is too thin to be a look`);
  }
  errors.push(...placeAll());

  for (const doc of DOCUMENTS) {
    if (!doc.protected) errors.push(`${doc.id} is not protected`);
    if (doc.body.trim().length < 80) errors.push(`${doc.id} is not actually readable`);
    if (doc.later.year - doc.year < 14) errors.push(`${doc.id} later reading is under 14 years`);
    if (doc.later.text.trim() === doc.body.trim()) errors.push(`${doc.id} later reading repeats the paper`);
    if (doc.kind === "map") {
      if (!doc.huntId || !doc.response) errors.push(`${doc.id} map is not tied to a hunt and a voice`);
      const hunt = HUNTS.find((item) => item.id === doc.huntId);
      const map = hunt?.maps.find((item) => item.docId === doc.id);
      if (!hunt || !map) errors.push(`${doc.id} hunt link is broken`);
      else {
        if (!pathWalks(hunt, map.path)) errors.push(`${doc.id} path is not a walk to the cache`);
        const names = map.path.slice(1).map((id) => huntNode(hunt, id)?.name ?? "");
        if (names.some((name) => !name) || !namesInOrder(doc.body, names)) {
          errors.push(`${doc.id} does not name its landmarks in walking order`);
        }
      }
    } else if (doc.kind === "letter") {
      if (!doc.investigationId || !doc.response) errors.push(`${doc.id} letter has no investigation or reply`);
    } else if (!doc.investigationId || !doc.finding) {
      errors.push(`${doc.id} evidence has no investigation or finding`);
    }
    if (doc.investigationId && !INVESTIGATIONS.some((item) => item.id === doc.investigationId)) {
      errors.push(`${doc.id} points at a missing investigation`);
    }
    let owned = initialSave();
    if (!owned.documents.includes(doc.id)) owned = { ...owned, documents: [...owned.documents, doc.id] };
    const refused = reduce(owned, { type: "discard", docId: doc.id });
    if (refused.documents.join() !== owned.documents.join()) errors.push(`${doc.id} was discarded`);
    if (!refused.lastNotice.includes("cannot be discarded")) errors.push(`${doc.id} discard did not refuse`);
  }

  for (const hunt of HUNTS) {
    if (hunt.maps.length !== 2) errors.push(`${hunt.id} does not have two maps`);
    const reached = new Set(reachableFromStart(hunt));
    for (const node of hunt.nodes) {
      if (!reached.has(node.id)) errors.push(`${hunt.id} strand: ${node.id}`);
      if (/objective|marker|quest pin/i.test(node.name + node.look)) {
        errors.push(`${hunt.id} uses a marker label at ${node.id}`);
      }
    }
    if (!reached.has(hunt.cache)) errors.push(`${hunt.id} cache is unreachable`);
    const caches = new Set(hunt.maps.map((map) => map.path[map.path.length - 1]));
    if (caches.size !== 1 || !caches.has(hunt.cache)) errors.push(`${hunt.id} maps do not share one cache`);
  }

  for (const investigation of INVESTIGATIONS) {
    if (investigation.evidence.length < 3) errors.push(`${investigation.id} is not a real case`);
    for (const id of investigation.evidence) {
      const doc = DOCUMENTS.find((item) => item.id === id);
      if (!doc || doc.kind !== "evidence") errors.push(`${investigation.id} lists non-evidence ${id}`);
    }
  }

  const reached = proveReachable();
  errors.push(...reached.errors);

  const bond = stokeCheck();
  if (bond) errors.push(bond);
  return errors;
}

function stokeCheck(): string | null {
  const keeping = startKeeping({ deck: ["fw-001", "fw-010", "fw-061", "fw-062", "fw-065"], seed: 1 });
  keeping.stores = 8;
  keeping.hand = ["fw-001", "fw-010"];
  keeping.deck = ["fw-061", "fw-062", "fw-065", "fw-068"];
  const kin = playCard(keeping, "fw-001");
  if (kin.error || !kin.keeping.kin[0]) return "stoke fixture could not play kin";
  const heir = playCard(kin.keeping, "fw-010", { attachTo: kin.keeping.kin[0].instance });
  if (heir.error) return heir.error;
  const stoke = stokeOf(heir.keeping);
  // fw-001 kindling 1 + bond 2
  if (stoke !== 3) return `Heirloom bond stoked ${stoke}, expected 3`;
  return null;
}

export function catalogOk(): boolean {
  return validateCatalog().length === 0;
}
