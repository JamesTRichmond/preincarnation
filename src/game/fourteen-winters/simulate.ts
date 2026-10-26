import { chooseAction, type Weights } from "./ai.ts";
import { pureDeck, type Opponent } from "./decks.ts";
import {
  applyAction,
  createMatch,
  invariantErrors,
  legalActions,
  nextRand,
  ownerBoard,
  replayMatch,
  score,
  type Action,
  type GameState,
  type Seat,
} from "./engine.ts";
import { CARDS } from "./cards.ts";

export interface MatchResult {
  seed: number;
  era1First: Seat;
  south: string;
  north: string;
  winner: Seat | "draw";
  southTotal: number;
  northTotal: number;
  turns: number;
  invalid: number;
}

function randomInherit(state: GameState, box: { rng: number }): Action {
  const seat = state.chooser!;
  const owned = ownerBoard(state, seat);
  const order = [...owned];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand(box) * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  const cap = Math.min(owned.length, state.config.freeKeeps + state.players[seat].memory);
  const count = Math.floor(nextRand(box) * (cap + 1));
  const keep = order.slice(0, count);
  const heirs = keep.filter((uid) => {
    const inst = state.cards[uid]!;
    return !!CARDS[inst.defId]?.heir && inst.face === "printed";
  });
  const transform = heirs.length && nextRand(box) < 0.5 ? heirs[Math.floor(nextRand(box) * heirs.length)] : undefined;
  return { type: "inherit", keep, transform };
}

export function playAgents(
  seed: number,
  southDeck: string[],
  northDeck: string[],
  southWeights: Weights,
  northWeights: Weights,
  era1First: Seat,
  practice: [boolean, boolean] = [false, false],
  turnsPerEra = 7,
): MatchResult {
  let state = createMatch({
    seed,
    decks: [southDeck, northDeck],
    era1First,
    names: ["South", "North"],
    config: { turnsPerEra },
  });
  let invalid = 0;
  let guard = 0;
  while (state.phase !== "over") {
    if (++guard > 80) throw new Error(`Match ${seed} did not finish`);
    const seat = (state.phase === "inherit" ? state.chooser : state.active)!;
    const action =
      state.phase === "inherit"
        ? chooseAction(state, seat === 0 ? southWeights : northWeights, false)
        : chooseAction(state, seat === 0 ? southWeights : northWeights, practice[seat]);
    const before = invariantErrors(state);
    if (before.length) invalid += before.length;
    state = applyAction(state, action);
  }
  const after = invariantErrors(state);
  if (after.length) invalid += after.length;
  const [south, north] = score(state);
  return {
    seed,
    era1First,
    south: "South",
    north: "North",
    winner: state.winner ?? "draw",
    southTotal: south.total,
    northTotal: north.total,
    turns: state.actions.length,
    invalid,
  };
}

export function fuzzMatch(seed: number, turnsPerEra = 3): GameState {
  const box = { rng: (seed ^ 0x9e3779b9) >>> 0 };
  let state = createMatch({
    seed,
    decks: [pureDeck("orchard"), pureDeck("river")],
    era1First: (seed % 2) as Seat,
    config: { turnsPerEra },
  });
  let guard = 0;
  while (state.phase !== "over") {
    if (++guard > 70) throw new Error(`Fuzz ${seed} stuck in ${state.phase}`);
    const action =
      state.phase === "inherit"
        ? randomInherit(state, box)
        : legalActions(state)[Math.floor(nextRand(box) * legalActions(state).length)]!;
    if (state.phase === "play" && !legalActions(state).some((item) => item.type === "pass")) {
      throw new Error("Pass was not legal");
    }
    state = applyAction(state, action);
  }
  return state;
}

export function assertReplay(seed: number, turnsPerEra = 3): void {
  const south = pureDeck("parish");
  const north = pureDeck("timber");
  let state = createMatch({
    seed,
    decks: [south, north],
    era1First: 0,
    config: { turnsPerEra },
  });
  const weights = {
    foundations: 2,
    hearths: 2,
    institutions: 2,
    water: 2,
    lineages: 2,
    pacts: 2,
    deny: 1,
    tend: 1,
    memory: 1,
    warmth: 1,
  };
  while (state.phase !== "over") state = applyAction(state, chooseAction(state, weights, false));
  const again = replayMatch({
    seed,
    decks: [south, north],
    era1First: 0,
    config: { turnsPerEra },
    actions: state.actions,
  });
  if (again.winner !== state.winner) throw new Error("Replay winner drifted");
  const [a, b] = score(state);
  const [c, d] = score(again);
  if (a.total !== c.total || b.total !== d.total) throw new Error("Replay score drifted");
}

export interface SimReport {
  games: number;
  invalid: number;
  draws: number;
  firstWins: number;
  secondWins: number;
  meanFirstMinusSecond: number;
  byDeck: Record<string, { games: number; wins: number; losses: number; draws: number; meanScore: number }>;
}

export function simulateIdentities(seeds: number[]): SimReport {
  const ids = ["river", "orchard", "parish", "timber", "threshold", "commons"] as const;
  const weights: Weights = {
    foundations: 3,
    hearths: 3,
    institutions: 3,
    water: 3,
    lineages: 3,
    pacts: 2,
    deny: 1,
    tend: 1,
    memory: 1,
    warmth: 1,
  };
  const byDeck: SimReport["byDeck"] = {};
  for (const id of ids) byDeck[id] = { games: 0, wins: 0, losses: 0, draws: 0, meanScore: 0 };
  let games = 0;
  let invalid = 0;
  let draws = 0;
  let firstWins = 0;
  let secondWins = 0;
  let margin = 0;
  for (const south of ids) {
    for (const north of ids) {
      for (const seed of seeds) {
        for (const era1First of [0, 1] as const) {
          const result = playAgents(seed, pureDeck(south), pureDeck(north), weights, weights, era1First);
          games += 1;
          invalid += result.invalid;
          const firstScore = era1First === 0 ? result.southTotal : result.northTotal;
          const secondScore = era1First === 0 ? result.northTotal : result.southTotal;
          margin += firstScore - secondScore;
          if (result.winner === "draw") draws += 1;
          else if (result.winner === era1First) firstWins += 1;
          else secondWins += 1;
          const southRow = byDeck[south]!;
          const northRow = byDeck[north]!;
          southRow.games += 1;
          northRow.games += 1;
          southRow.meanScore += result.southTotal;
          northRow.meanScore += result.northTotal;
          if (result.winner === "draw") {
            southRow.draws += 1;
            northRow.draws += 1;
          } else if (result.winner === 0) {
            southRow.wins += 1;
            northRow.losses += 1;
          } else {
            northRow.wins += 1;
            southRow.losses += 1;
          }
        }
      }
    }
  }
  for (const row of Object.values(byDeck)) row.meanScore = Math.round((row.meanScore / row.games) * 10) / 10;
  return {
    games,
    invalid,
    draws,
    firstWins,
    secondWins,
    meanFirstMinusSecond: Math.round((margin / games) * 10) / 10,
    byDeck,
  };
}

export function simulateOpponents(opponents: Opponent[], seeds: number[]): { results: MatchResult[]; invalid: number } {
  const results: MatchResult[] = [];
  let invalid = 0;
  for (const opponent of opponents) {
    for (const seed of seeds) {
      for (const era1First of [0, 1] as const) {
        const result = playAgents(
          seed + opponent.name.length,
          pureDeck("commons"),
          opponent.deck,
          {
            foundations: 3,
            hearths: 3,
            institutions: 3,
            water: 3,
            lineages: 3,
            pacts: 3,
            deny: 1,
            tend: 1,
            memory: 1,
            warmth: 1,
          },
          opponent.weights,
          era1First,
          [false, opponent.practice],
        );
        result.north = opponent.name;
        result.south = "Commons";
        invalid += result.invalid;
        results.push(result);
      }
    }
  }
  return { results, invalid };
}
