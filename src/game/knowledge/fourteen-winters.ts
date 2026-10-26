import { CAPS, START, frostPressure } from "./rules.ts";
import type { Card, MatchState, Phase } from "./types.ts";

export type PlayResult =
  | { ok: true; state: MatchState }
  | { ok: false; error: string; state: MatchState };

const NEXT: Record<Phase, Phase | "night"> = {
  dawn: "day",
  day: "dusk",
  dusk: "night",
};

export function createMatch(opts: {
  cardIds: string[];
  winters?: number;
  seed?: number;
  shuffle?: boolean;
  bonuses?: {
    frostWard?: number;
    shelterToken?: number;
    bankedHeat?: number;
    mend?: number;
    ration?: number;
    hintCharges?: number;
  };
}): MatchState {
  const bonuses = opts.bonuses ?? {};
  let deck = [...opts.cardIds];
  if (opts.shuffle !== false) deck = fisherYates(deck, opts.seed ?? 1);
  const hand: string[] = [];
  while (hand.length < 4 && deck.length) hand.push(deck.shift() as string);
  const winters = opts.winters ?? 3;
  return {
    winters,
    winter: 1,
    phase: "dawn",
    outcome: "playing",
    hearth: START.hearth,
    heat: clamp(START.heat + (bonuses.bankedHeat ?? 0), CAPS.heat),
    ration: clamp(START.ration + (bonuses.ration ?? 0), CAPS.ration),
    ink: START.ink,
    cellar: 0,
    mend: clamp(START.mend + (bonuses.mend ?? 0), CAPS.mend),
    shelter: 0,
    hintCharges: bonuses.hintCharges ?? 0,
    frostWard: bonuses.frostWard ?? 0,
    frostPeek: null,
    shelterToken: bonuses.shelterToken ?? 0,
    hand,
    deck,
    discard: [],
    unlocked: [],
    log: [
      `Winter 1, dawn. The night will press at ${frostPressure(1) - ((bonuses.frostWard ?? 0) > 0 ? 1 : 0)}.`,
    ],
  };
}

export function legalReason(state: MatchState, card: Card): string | null {
  if (state.outcome !== "playing") return "the match is over";
  if (!state.hand.includes(card.id)) return "not in hand";
  if (!timingFits(card.timing, state.phase)) return `plays at ${card.timing}, not ${state.phase}`;
  if (state.heat < card.cost.heat) return "not enough heat";
  if (state.ration < card.cost.ration) return "not enough ration";
  if (state.ink < card.cost.ink) return "not enough ink";
  if (card.effects.some((e) => e.op === "kindle") && state.ration < card.cost.ration + 1) {
    return "kindle needs one more ration";
  }
  return null;
}

export function playCard(state: MatchState, card: Card): PlayResult {
  const reason = legalReason(state, card);
  if (reason) return { ok: false, error: reason, state };
  const next = clone(state);
  next.heat -= card.cost.heat;
  next.ration -= card.cost.ration;
  next.ink -= card.cost.ink;
  next.hand = next.hand.filter((id) => id !== card.id);
  next.discard = [...next.discard, card.id];
  next.log = [...next.log, `Played ${card.name}.`];
  for (const effect of card.effects) applyEffect(next, effect);
  return { ok: true, state: afterAction(next) };
}

export function passPhase(state: MatchState): MatchState {
  if (state.outcome !== "playing") return state;
  const next = clone(state);
  next.log = [...next.log, `Passed the ${next.phase}.`];
  return afterAction(next);
}

export function findSurvival(
  byId: Map<string, Card>,
  cardIds: string[],
  winters = 3,
  seed = 1,
): string[] | null {
  const start = createMatch({ cardIds, winters, seed, shuffle: true });
  let nodes = 0;
  function rec(state: MatchState, line: string[]): string[] | null {
    if (state.outcome === "survived") return line;
    if (state.outcome === "lost") return null;
    if (++nodes > 250000) return null;
    const plays = state.hand
      .map((id) => byId.get(id))
      .filter((card): card is Card => !!card && legalReason(state, card) === null)
      .sort((a, b) => scorePlay(b, state) - scorePlay(a, state));
    for (const card of plays) {
      const played = playCard(state, card);
      if (!played.ok) continue;
      const found = rec(played.state, [...line, `W${state.winter} ${state.phase}: ${card.name}`]);
      if (found) return found;
    }
    const passed = passPhase(state);
    return rec(passed, [...line, `W${state.winter} ${state.phase}: pass`]);
  }
  return rec(start, []);
}

function scorePlay(card: Card, state: MatchState): number {
  let score = 0;
  for (const e of card.effects) {
    if (e.op === "shelter") score += 8 * e.n;
    if (e.op === "kindle") score += 10;
    if (e.op === "gain") score += (e.heat ?? 0) * 5 + (e.ration ?? 0) * 2;
    if (e.op === "mend") score += 2 * e.n;
    if (e.op === "store") score += e.n;
  }
  if (state.phase === "dusk" && state.heat + state.shelter < frostPressure(state.winter)) score += 1;
  return score;
}

function afterAction(state: MatchState): MatchState {
  if (state.phase !== "dusk") {
    state.phase = NEXT[state.phase] as Phase;
    state.log.push(`${cap(state.phase)}.`);
    return state;
  }
  return resolveNight(state);
}

function resolveNight(state: MatchState): MatchState {
  const base = frostPressure(state.winter);
  const pressure = Math.max(0, base - (state.frostWard > 0 ? 1 : 0));
  const fromShelter = state.shelter + state.shelterToken;
  const need = Math.max(0, pressure - fromShelter);
  const spent = Math.min(state.heat, need);
  state.heat -= spent;
  let damage = need - spent;
  let mended = false;
  if (damage > 0 && state.mend > 0) {
    state.mend -= 1;
    damage -= 1;
    mended = true;
  }
  state.hearth -= damage;
  state.log.push(
    `Night ${state.winter}: frost ${pressure}, shelter ${fromShelter}, burned ${spent} heat` +
      `${mended ? ", mend took a point" : ""}, hearth ${Math.max(0, state.hearth)}.`,
  );
  if (state.hearth <= 0) {
    state.outcome = "lost";
    state.lossReason = "the hearth went out";
    state.log.push("The hearth went out.");
    return state;
  }
  if (state.ration > 0) {
    state.ration -= 1;
    state.log.push("Ate one ration.");
  } else if (state.cellar > 0) {
    state.cellar -= 1;
    state.log.push("Ate from the cellar.");
  } else {
    state.hearth -= 2;
    state.log.push("Nothing to eat. The hearth cracks.");
    if (state.hearth <= 0) {
      state.outcome = "lost";
      state.lossReason = "hunger";
      return state;
    }
  }
  if (state.winter >= state.winters) {
    state.outcome = "survived";
    state.log.push(`You kept the hearth through ${state.winters} winter${state.winters === 1 ? "" : "s"}.`);
    return state;
  }
  state.winter += 1;
  state.phase = "dawn";
  state.shelter = 0;
  state.frostPeek = null;
  draw(state, 1, state.winter + 17);
  state.log.push(`Winter ${state.winter}, dawn. Frost will press at ${frostPressure(state.winter) - (state.frostWard > 0 ? 1 : 0)}.`);
  return state;
}

function applyEffect(state: MatchState, effect: Card["effects"][number]): void {
  switch (effect.op) {
    case "gain":
      if (effect.heat) state.heat = clamp(state.heat + effect.heat, CAPS.heat);
      if (effect.ration) state.ration = clamp(state.ration + effect.ration, CAPS.ration);
      if (effect.ink) state.ink = clamp(state.ink + effect.ink, CAPS.ink);
      state.log.push("Stores shifted.");
      break;
    case "draw":
      draw(state, effect.n, 40 + state.winter);
      break;
    case "shelter":
      state.shelter = clamp(state.shelter + effect.n, CAPS.shelter);
      state.log.push(`Shelter is ${state.shelter}.`);
      break;
    case "kindle":
      state.ration -= 1;
      state.heat = clamp(state.heat + 2, CAPS.heat);
      state.log.push("Kindled. One ration became two heat.");
      break;
    case "inscribe":
      remember(state, effect.manualId);
      state.log.push("A manual is marked in the satchel.");
      break;
    case "playMusic":
      remember(state, effect.pieceId);
      state.log.push("A tune is set aside for the instrument.");
      break;
    case "revealRecipe":
      remember(state, effect.recipeId);
      state.log.push("A working method is unlocked.");
      break;
    case "mend":
      state.mend = clamp(state.mend + effect.n, CAPS.mend);
      state.log.push(`Mend is ${state.mend}.`);
      break;
    case "scout":
      state.hintCharges += 1;
      state.frostPeek = frostPressure(Math.min(14, state.winter + 1));
      remember(state, effect.puzzleId);
      state.log.push(`Scouted. Next frost reads ${state.frostPeek}. A sugar-line hint is in hand.`);
      break;
    case "store":
      state.cellar = clamp(state.cellar + effect.n, CAPS.cellar);
      state.log.push(`Cellar holds ${state.cellar}.`);
      break;
    default:
      break;
  }
}

function draw(state: MatchState, n: number, seed: number): void {
  for (let i = 0; i < n; i++) {
    if (!state.deck.length) {
      if (!state.discard.length) {
        state.log.push("The pack is bare.");
        return;
      }
      state.deck = fisherYates(state.discard, seed + i * 13);
      state.discard = [];
      state.log.push("Shuffled the discard under the pack.");
    }
    const id = state.deck.shift();
    if (id) state.hand.push(id);
  }
}

function remember(state: MatchState, id: string): void {
  if (!state.unlocked.includes(id)) state.unlocked.push(id);
}

function timingFits(timing: Card["timing"], phase: Phase): boolean {
  return timing === "any" || timing === phase;
}

function clamp(n: number, max: number): number {
  return Math.max(0, Math.min(max, n));
}

function cap(phase: Phase): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

function clone(state: MatchState): MatchState {
  return {
    ...state,
    hand: [...state.hand],
    deck: [...state.deck],
    discard: [...state.discard],
    unlocked: [...state.unlocked],
    log: [...state.log],
  };
}

export function fisherYates<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
