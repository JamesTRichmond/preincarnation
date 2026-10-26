import { assess, RATIO_MAX, RATIO_MIN, TIMING_ALLOWED, VALUE_MAX, VALUE_MIN } from "./balance.ts";
import { CARDS, CARDS_BY_ID } from "./cards.ts";
import { FEATURED, nameOf, registerKnowledgePack } from "./collection.ts";
import { createMatch, findSurvival, legalReason, passPhase, playCard } from "./fourteen-winters.ts";
import { bandOf, lootId, lootNumber } from "./ids.ts";
import { INSTRUMENTS } from "./instruments.ts";
import { manualSteps, MANUALS, MANUALS_BY_ID } from "./manuals.ts";
import { PIECES } from "./music.ts";
import { PUZZLE_BUILD_NOTES, PUZZLES } from "./puzzles.ts";
import { ACTIONS, ACTIONS_BY_ID, canRun, freshCamp, ITEM_LABELS } from "./recipes.ts";
import { BANNED_PITCH_PREFIXES, normName, RESERVED_CARDS, RESERVED_PUZZLES, RESERVED_RECIPES, RESERVED_SONGS } from "./reserved.ts";
import { frostPressure } from "./rules.ts";
import { pitchFingerprint, schedule } from "./scheduler.ts";
import { describeEffects } from "./speak.ts";
import { canonicalGrid, gridProblems, missesSugar, solve, validatePath } from "./sugar-line.ts";
import { renderPcm, rms } from "./synth.ts";
import type { Card, Effect } from "./types.ts";

export type CheckReport = {
  ok: boolean;
  counts: { cards: number; music: number; puzzles: number; manuals: number; actions: number };
  failures: string[];
  notes: string[];
  cards: Array<{ id: string; name: string; value: number; cost: number; ratio: number }>;
  survival: { seed: number | null; line: string[] };
  passOnlyLoses: boolean;
  blockers: string[];
};

export const HOST_BLOCKERS = [
  "These practices ride in the satchel. They are not the Marble Vein, and they do not walk you across the county.",
];

export function runChecks(opts?: { audio?: boolean }): CheckReport {
  const failures: string[] = [];
  const notes: string[] = [...PUZZLE_BUILD_NOTES];
  const seenIds = new Set<string>();
  for (let n = 1; n <= 80; n++) {
    const id = lootId(n);
    if (seenIds.has(id)) failures.push(`duplicate id ${id}`);
    seenIds.add(id);
    if (bandOf(n) === null) failures.push(`bad band ${n}`);
  }
  if (CARDS.length !== 20) failures.push(`card count ${CARDS.length}`);
  if (PIECES.length !== 20) failures.push(`music count ${PIECES.length}`);
  if (PUZZLES.length !== 20) failures.push(`puzzle count ${PUZZLES.length}`);
  if (MANUALS.length !== 20) failures.push(`manual count ${MANUALS.length}`);
  if (ACTIONS.length !== 20) failures.push(`action count ${ACTIONS.length}`);

  const cardNames = new Set<string>();
  const cardTokens = new Set<string>();
  const effectKeys = new Set<string>();
  const cardRows: CheckReport["cards"] = [];
  const winters = new Set<number>();
  const suits = new Map<string, number>();
  const types = new Map<string, number>();

  for (const card of CARDS) {
    const n = lootNumber(card.id);
    if (n === null || bandOf(n) !== "card") failures.push(`${card.name} id not in card band`);
    const key = normName(card.name);
    if (cardNames.has(key)) failures.push(`duplicate card name ${card.name}`);
    cardNames.add(key);
    const tokens = key.split(" ").sort().join(" ");
    if (cardTokens.has(tokens)) failures.push(`token-duplicate card ${card.name}`);
    cardTokens.add(tokens);
    if (RESERVED_CARDS.some((name) => normName(name) === key)) failures.push(`card collides with reserved ${card.name}`);
    if (card.flavor.length < 20) failures.push(`${card.name} flavor too thin`);
    if (!TIMING_ALLOWED[card.type].includes(card.timing)) {
      failures.push(`${card.name} timing ${card.timing} illegal for ${card.type}`);
    }
    if (card.winterLearned < 1 || card.winterLearned > 14) failures.push(`${card.name} winter out of range`);
    winters.add(card.winterLearned);
    suits.set(card.suit, (suits.get(card.suit) ?? 0) + 1);
    types.set(card.type, (types.get(card.type) ?? 0) + 1);
    for (const resource of ["heat", "ration", "ink"] as const) {
      const value = card.cost[resource];
      if (!Number.isInteger(value) || value < 0 || value > 4) failures.push(`${card.name} bad ${resource} cost`);
    }
    if (card.cost.heat + card.cost.ration + card.cost.ink < 1) failures.push(`${card.name} is free`);
    if (card.effects.length < 1 || card.effects.length > 3) failures.push(`${card.name} effect count`);
    const knowledge = card.effects.filter((e) => ["inscribe", "playMusic", "revealRecipe", "scout"].includes(e.op));
    if (knowledge.length < 1 || knowledge.length > 2) failures.push(`${card.name} knowledge bindings ${knowledge.length}`);
    for (const effect of card.effects) {
      const ref = effectRef(effect);
      if (ref && !resolves(ref, effect.op)) failures.push(`${card.name} dangling ${effect.op} ${ref}`);
    }
    const canon = JSON.stringify({ t: card.type, when: card.timing, c: card.cost, e: card.effects });
    if (effectKeys.has(canon)) failures.push(`duplicate mechanical card ${card.name}`);
    effectKeys.add(canon);
    const score = assess(card);
    cardRows.push({ id: card.id, name: card.name, ...score });
    if (score.value < VALUE_MIN || score.value > VALUE_MAX) {
      failures.push(`${card.name} value ${score.value} outside ${VALUE_MIN}–${VALUE_MAX}`);
    }
    if (score.ratio < RATIO_MIN || score.ratio > RATIO_MAX) {
      failures.push(`${card.name} ratio ${score.ratio} outside ${RATIO_MIN}–${RATIO_MAX}`);
    }
    const text = describeEffects(card.effects, nameOf);
    if (text.length < 8 || text.includes("loot.expansion")) failures.push(`${card.name} rules text failed`);
    const played = exerciseCard(card);
    if (played) failures.push(played);
  }
  for (const winter of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]) {
    if (!winters.has(winter)) failures.push(`no card learned in winter ${winter}`);
  }
  for (const [suit, count] of suits) {
    if (count < 3 || count > 6) failures.push(`suit ${suit} count ${count}`);
  }
  for (const type of ["provision", "craft", "omen", "lesson", "tool"]) {
    if ((types.get(type) ?? 0) < 3) failures.push(`type ${type} underused`);
  }

  const songNames = new Set<string>();
  const prints = new Set<string>();
  for (const piece of PIECES) {
    const n = lootNumber(piece.id);
    if (n === null || bandOf(n) !== "music") failures.push(`${piece.title} id band`);
    const key = normName(piece.title);
    if (songNames.has(key)) failures.push(`duplicate piece ${piece.title}`);
    songNames.add(key);
    if (RESERVED_SONGS.some((name) => normName(name) === key)) failures.push(`song reserved ${piece.title}`);
    if (!INSTRUMENTS[piece.instrument]) failures.push(`${piece.title} bad instrument`);
    const scheduled = schedule(piece);
    if (!scheduled.ok) {
      failures.push(`${piece.title}: ${scheduled.errors.join("; ")}`);
      continue;
    }
    const print = pitchFingerprint(scheduled.notes).join(",");
    if (prints.has(print)) failures.push(`duplicate melody ${piece.title}`);
    prints.add(print);
    const prefix = pitchFingerprint(scheduled.notes);
    for (const banned of BANNED_PITCH_PREFIXES) {
      if (prefix.length >= banned.length && banned.every((step, i) => step === prefix[i])) {
        failures.push(`${piece.title} matches a banned tune prefix`);
      }
    }
    if (opts?.audio) {
      const pcm = renderPcm(scheduled.notes, 8000, scheduled.seconds);
      const level = rms(pcm);
      if (level < 0.01) failures.push(`${piece.title} rendered silent (rms ${level.toFixed(4)})`);
    }
  }

  const puzzleNames = new Set<string>();
  const grids = new Set<string>();
  for (const board of PUZZLES) {
    const n = lootNumber(board.id);
    if (n === null || bandOf(n) !== "puzzle") failures.push(`${board.title} id band`);
    const key = normName(board.title);
    if (puzzleNames.has(key)) failures.push(`duplicate puzzle ${board.title}`);
    puzzleNames.add(key);
    if (RESERVED_PUZZLES.some((name) => normName(name) === key)) failures.push(`puzzle reserved ${board.title}`);
    const gridKey = canonicalGrid(board.rows);
    if (grids.has(gridKey)) failures.push(`duplicate board ${board.title}`);
    grids.add(gridKey);
    if (!PIECES.some((piece) => piece.id === board.bindsMusicId)) {
      failures.push(`${board.title} music binding missing`);
    }
    const shape = gridProblems(board.rows);
    if (shape.length) failures.push(`${board.title}: ${shape.join("; ")}`);
    const solvedByAuthor = validatePath(board.rows, board.solution, true);
    if (solvedByAuthor.length) failures.push(`${board.title} solution: ${solvedByAuthor.join("; ")}`);
    const trap = validatePath(board.rows, board.trap, false);
    if (trap.length) failures.push(`${board.title} trap: ${trap.join("; ")}`);
    if (!missesSugar(board.rows, board.trap)) failures.push(`${board.title} trap does not miss a sugar`);
    if (!shape.length) {
      const found = solve(board.rows);
      if (!found) failures.push(`${board.title} solver found nothing`);
    }
    const walkable = board.rows.reduce((sum, row) => sum + [...row].filter((cell) => cell !== "#").length, 0);
    if (walkable <= board.solution.length) failures.push(`${board.title} has no false step`);
  }

  const manualNames = new Set<string>();
  const taught = new Set<string>();
  for (const manual of MANUALS) {
    const n = lootNumber(manual.id);
    if (n === null || bandOf(n) !== "manual") failures.push(`${manual.title} id band`);
    const key = normName(manual.title);
    if (manualNames.has(key)) failures.push(`duplicate manual ${manual.title}`);
    manualNames.add(key);
    if (manual.procedure.length < 80) failures.push(`${manual.title} procedure too thin`);
    const action = ACTIONS_BY_ID.get(manual.actionId);
    if (!action) {
      failures.push(`${manual.title} missing action ${manual.actionId}`);
      continue;
    }
    if (taught.has(action.id)) failures.push(`action taught twice ${action.id}`);
    taught.add(action.id);
    if (RESERVED_RECIPES.some((name) => normName(name) === normName(action.name))) {
      failures.push(`recipe reserved ${action.name}`);
    }
    const steps = manualSteps(manual, action);
    const text = steps.map((step) => step.body).join(" ").toLowerCase();
    if (!text.includes(action.station.toLowerCase())) failures.push(`${manual.title} omits station`);
    if (!text.includes(action.resultPhrase.toLowerCase())) failures.push(`${manual.title} omits result`);
    for (const input of action.inputs) {
      const label = ITEM_LABELS[input.id];
      if (!label || !text.includes(label)) failures.push(`${manual.title} omits ${label ?? input.id}`);
    }
    for (const tool of action.tools) {
      const label = ITEM_LABELS[tool];
      if (!label || !text.includes(label)) failures.push(`${manual.title} omits tool ${label ?? tool}`);
    }
    const before = freshCamp();
    if (!canRun(action, before)) failures.push(`${action.name} cannot run from the stocked camp`);
    const after = action.perform(before);
    if (JSON.stringify(after) === JSON.stringify(before)) failures.push(`${action.name} perform is a no-op`);
  }
  for (const action of ACTIONS) {
    if (!taught.has(action.id)) failures.push(`action ${action.id} has no manual`);
  }

  let state = createMatch({ cardIds: FEATURED.cards, winters: 3, shuffle: false });
  let guard = 0;
  while (state.outcome === "playing" && guard < 20) {
    state = passPhase(state);
    guard += 1;
  }
  const passOnlyLoses = state.outcome === "lost";
  if (!passOnlyLoses) failures.push("passing every phase survives; cards are not required");

  let survivalSeed: number | null = null;
  let survivalLine: string[] = [];
  for (let seed = 1; seed <= 8; seed++) {
    const line = findSurvival(CARDS_BY_ID, FEATURED.cards, 3, seed);
    if (line) {
      survivalSeed = seed;
      survivalLine = line;
      break;
    }
  }
  if (!survivalLine.length) failures.push("no surviving line found for the five featured cards");

  const registration = registerKnowledgePack();
  if (registration.cards + registration.pieces + registration.boards + registration.manuals !== 80) {
    failures.push("registration did not cover 80 records");
  }
  if (registration.bound) failures.push("unhosted registration reported itself bound");

  notes.push(`Frost on winter 1 is ${frostPressure(1)}; on winter 14 it is ${frostPressure(14)}.`);
  notes.push(`Featured manuals resolve to ${FEATURED.manuals.map((id) => MANUALS_BY_ID.get(id)?.title).join(", ")}.`);

  return {
    ok: failures.length === 0,
    counts: {
      cards: CARDS.length,
      music: PIECES.length,
      puzzles: PUZZLES.length,
      manuals: MANUALS.length,
      actions: ACTIONS.length,
    },
    failures,
    notes,
    cards: cardRows,
    survival: { seed: survivalSeed, line: survivalLine },
    passOnlyLoses,
    blockers: HOST_BLOCKERS,
  };
}

function effectRef(effect: Effect): string | null {
  switch (effect.op) {
    case "inscribe":
      return effect.manualId;
    case "playMusic":
      return effect.pieceId;
    case "revealRecipe":
      return effect.recipeId;
    case "scout":
      return effect.puzzleId;
    default:
      return null;
  }
}

function resolves(id: string, op: Effect["op"]): boolean {
  if (op === "inscribe") return MANUALS_BY_ID.has(id);
  if (op === "playMusic") return PIECES.some((piece) => piece.id === id);
  if (op === "revealRecipe") return ACTIONS_BY_ID.has(id);
  if (op === "scout") return PUZZLES.some((board) => board.id === id);
  return false;
}

function exerciseCard(card: Card): string | null {
  const phase = card.timing === "any" ? "day" : card.timing;
  const other = CARDS.find((item) => item.id !== card.id) ?? card;
  const state = createMatch({ cardIds: [card.id, other.id, other.id], winters: 3, shuffle: false });
  state.phase = phase;
  state.hand = [card.id];
  state.deck = [other.id, other.id];
  state.discard = [];
  state.heat = 6;
  state.ration = 8;
  state.ink = 6;
  state.outcome = "playing";
  const reason = legalReason(state, card);
  if (reason) return `${card.name} not playable in a stocked ${phase}: ${reason}`;
  const played = playCard(state, card);
  if (!played.ok) return `${card.name} rejected: ${played.error}`;
  const changed =
    played.state.unlocked.length > 0 ||
    played.state.shelter !== state.shelter ||
    played.state.mend !== state.mend ||
    played.state.cellar !== state.cellar ||
    played.state.hintCharges !== state.hintCharges ||
    played.state.heat !== state.heat - card.cost.heat ||
    played.state.ration !== state.ration - card.cost.ration ||
    played.state.ink !== state.ink - card.cost.ink ||
    played.state.hand.length !== state.hand.length - 1;
  if (!changed) return `${card.name} resolved without a mechanical change`;
  return null;
}
