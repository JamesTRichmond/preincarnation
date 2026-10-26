import { chooseAction, PRACTICE_WEIGHTS } from "./ai.ts";
import { plotIndex } from "./board.ts";
import { CARD_LIST } from "./cards.ts";
import { actionKey, applyAction, legalActions, type Action, type GameState } from "./engine.ts";

function stacked(identity: "orchard" | "commons", front: string[]): string[] {
  const ids = CARD_LIST.filter((card) => card.identity === identity).map((card) => card.id);
  const rest = ids.filter((id) => !front.includes(id));
  const once = [...front, ...rest];
  if (once.length !== 12) throw new Error(`Lesson stack for ${identity} is ${once.length}`);
  return [...once, ...once];
}

export function lessonDecks(): [string[], string[]] {
  return [
    stacked("orchard", ["oh-cider-house", "oh-ada", "oh-lewis", "oh-press", "oh-dwarf-rows"]),
    stacked("commons", ["cm-porch", "cm-neighbor", "cm-clerk", "cm-green", "cm-well"]),
  ];
}

interface Scripted {
  defId: string;
  type: "establish" | "tend";
  plot?: number;
}

/** Seat 1 is the lesson neighbor. Specs resolve against the live hand, then fall back. */
const SCRIPT: Scripted[] = [
  { type: "establish", defId: "cm-porch", plot: plotIndex(2, 1) },
  { type: "establish", defId: "cm-neighbor", plot: plotIndex(2, 2) },
  { type: "tend", defId: "cm-porch" },
];

function resolve(state: GameState, spec: Scripted): Action | null {
  if (spec.type === "tend") {
    const uid = state.plots.find((id) => id && state.cards[id]!.defId === spec.defId && state.cards[id]!.owner === 1);
    if (!uid) return null;
    return { type: "tend", cardUid: uid };
  }
  const uid = state.players[1].hand.find((id) => state.cards[id]!.defId === spec.defId);
  if (!uid) return null;
  return { type: "establish", cardUid: uid, plot: spec.plot };
}

export function tutorialOpponentAction(state: GameState): Action {
  const spec = SCRIPT[state.players[1].turnsTaken];
  if (spec && state.phase === "play" && state.active === 1) {
    const action = resolve(state, spec);
    if (action && legalActions(state).some((legal) => actionKey(legal) === actionKey(action))) return action;
  }
  return chooseAction(state, PRACTICE_WEIGHTS, true);
}

export function coachLine(state: GameState): string | null {
  if (!state.config.coach) return null;
  if (state.phase === "inherit") {
    return "The era seals before anything is cleared. Keep one card for free in this lesson. A later face may replace one kept card. The rest of the county weathers.";
  }
  if (state.phase === "over") return "That was the short match. A real winter is seven turns an era, and you may keep two cards before spending memory.";
  if (state.active !== 0) return "The neighbor is taking a winter.";
  const turn = state.players[0].turnsTaken;
  if (state.era === 1 && turn === 0) {
    return "A winter is one action. Establish Cider House on a field. Shoreham Orchard is the near one. Arrow keys move the plot; E plays the selected card.";
  }
  if (state.era === 1 && turn === 1) {
    return "People arrive beside a place you own, or beside kin of the same line. Play Ada Colby next to the house.";
  }
  if (state.era === 1 && turn === 2) {
    return "Tend spends 1 warmth for a mark, up to two. Or play Lewis Colby beside Ada — two Colbys are a lineage.";
  }
  return "Share spends 1 warmth on a border you already touch. Both households score a pact. Pass stores warmth and a memory. Remember looks at two cards and puts one under the deck.";
}

export function lessonIsLegalSuggestion(state: GameState, action: Action): boolean {
  return legalActions(state).some((legal) => actionKey(legal) === actionKey(action));
}

export function applyIfLegal(state: GameState, action: Action): GameState | null {
  if (!legalActions(state).some((legal) => actionKey(legal) === actionKey(action))) return null;
  return applyAction(state, action);
}
