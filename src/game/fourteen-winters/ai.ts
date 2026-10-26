import { CARDS } from "./cards.ts";
import {
  actionKey,
  applyAction,
  canonicalRemember,
  faceOf,
  inheritError,
  legalActions,
  ownerBoard,
  score,
  type Action,
  type GameState,
  type Seat,
} from "./engine.ts";

export interface Weights {
  foundations: number;
  hearths: number;
  institutions: number;
  water: number;
  lineages: number;
  pacts: number;
  deny: number;
  tend: number;
  memory: number;
  warmth: number;
}

export const PRACTICE_WEIGHTS: Weights = {
  foundations: 3,
  hearths: 2,
  institutions: 0,
  water: 0,
  lineages: 0,
  pacts: 0,
  deny: 0,
  tend: 1,
  memory: 0,
  warmth: 1,
};

function evaluate(state: GameState, seat: Seat, weights: Weights): number {
  const [a, b] = score(state);
  const me = seat === 0 ? a : b;
  const them = seat === 0 ? b : a;
  let value =
    weights.foundations * me.foundations +
    weights.hearths * me.hearths +
    weights.institutions * me.institutions +
    weights.water * me.water +
    weights.lineages * me.lineages +
    weights.pacts * me.pacts +
    weights.memory * state.players[seat].memory * 2 +
    weights.warmth * state.players[seat].warmth +
    me.seal * 2 -
    weights.deny * (them.foundations + them.hearths + them.institutions + them.water + them.lineages + them.pacts);
  let tends = 0;
  for (const uid of ownerBoard(state, seat)) tends += state.cards[uid]!.tend;
  value += tends * weights.tend;
  if (state.era === 1 && state.players[seat].turnsTaken >= 4) {
    const ranked = ownerBoard(state, seat)
      .map((uid) => keeperValue(state, uid))
      .sort((x, y) => y - x);
    value += (ranked[0] ?? 0) + Math.floor((ranked[1] ?? 0) / 2);
  }
  return value;
}

function keeperValue(state: GameState, uid: string): number {
  const inst = state.cards[uid]!;
  const face = faceOf(inst);
  let value = (face.shownBase + inst.tend + inst.bonus) * 3;
  if (face.shownTags.includes("home")) value += 4;
  if (face.shownTags.includes("water")) value += 3;
  if (face.kind === "person") value += 3;
  if (face.kind === "institution") value += 6;
  if (face.heir && inst.face === "printed") value += 2;
  return value;
}

export function chooseInherit(state: GameState, weights: Weights): Extract<Action, { type: "inherit" }> {
  const seat = state.chooser;
  if (seat === null) throw new Error("No inheritance to choose.");
  const ranked = ownerBoard(state, seat)
    .map((uid) => ({ uid, value: keeperValue(state, uid) + weights.lineages }))
    .sort((a, b) => b.value - a.value || (a.uid < b.uid ? -1 : 1));
  const keep: string[] = [];
  let memory = state.players[seat].memory;
  for (const row of ranked) {
    if (keep.length >= state.config.freeKeeps + state.players[seat].memory) break;
    const spends = keep.length >= state.config.freeKeeps;
    if (spends && (memory <= 0 || row.value < 8)) break;
    if (row.value <= 0 && keep.length > 0) break;
    keep.push(row.uid);
    if (spends) memory -= 1;
  }
  let transform: string | undefined;
  let bestGain = 0;
  for (const uid of keep) {
    const inst = state.cards[uid]!;
    const def = CARDS[inst.defId]!;
    if (!def.heir || inst.face === "heir") continue;
    const face = faceOf(inst);
    let gain = def.heir.base - (face.shownBase + inst.tend + inst.bonus);
    if (def.heir.tags.includes("home") && !face.shownTags.includes("home")) gain += 2;
    if (gain > bestGain) {
      bestGain = gain;
      transform = uid;
    }
  }
  const action: Extract<Action, { type: "inherit" }> = { type: "inherit", keep, transform };
  const err = inheritError(state, action);
  if (err) throw new Error(err);
  return action;
}

export function chooseAction(state: GameState, weights: Weights, practice = false): Action {
  if (state.phase === "inherit") return chooseInherit(state, weights);
  if (state.phase !== "play") throw new Error("The match is over.");
  let actions = legalActions(state);
  if (practice) {
    const narrow = actions.filter((action) => action.type === "establish" || action.type === "tend" || action.type === "pass");
    if (narrow.length) actions = narrow;
  }
  const remembered = canonicalRemember(state);
  if (practice && remembered) actions = actions.filter((action) => action.type !== "remember");
  let best = actions[0]!;
  let bestValue = -Infinity;
  let bestKey = actionKey(best);
  const seat = state.active;
  for (const action of actions) {
    const next = applyAction(state, action);
    const value = evaluate(next, seat, weights);
    const key = actionKey(action);
    if (value > bestValue || (value === bestValue && key < bestKey)) {
      best = action;
      bestValue = value;
      bestKey = key;
    }
  }
  return best;
}
