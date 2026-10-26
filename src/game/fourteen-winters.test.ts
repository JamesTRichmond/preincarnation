import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chooseAction } from "./fourteen-winters/ai.ts";
import { PLOTS, plotIndex } from "./fourteen-winters/board.ts";
import { CARD_LIST, CARDS } from "./fourteen-winters/cards.ts";
import { OPPONENTS, PERSONALITIES, pureDeck } from "./fourteen-winters/decks.ts";
import {
  IllegalAction,
  applyAction,
  createMatch,
  faceOf,
  invariantErrors,
  legalActions,
  legalPlots,
  playCost,
  replayMatch,
  score,
  validateDeck,
  type GameState,
} from "./fourteen-winters/engine.ts";
import { assertReplay, fuzzMatch } from "./fourteen-winters/simulate.ts";
import { lessonDecks, tutorialOpponentAction } from "./fourteen-winters/tutorial.ts";

function move(state: GameState, owner: 0 | 1, defId: string, plot: number) {
  const player = state.players[owner];
  const uid = [...player.deck, ...player.hand, ...player.discard].find((id) => state.cards[id]!.defId === defId);
  assert.ok(uid, defId);
  player.deck = player.deck.filter((id) => id !== uid);
  player.hand = player.hand.filter((id) => id !== uid);
  player.discard = player.discard.filter((id) => id !== uid);
  state.plots[plot] = uid;
  return uid;
}

describe("catalog", () => {
  it("has 72 cards, twelve in each household", () => {
    assert.equal(CARD_LIST.length, 72);
    assert.equal(new Set(CARD_LIST.map((card) => card.id)).size, 72);
    for (const identity of ["river", "orchard", "parish", "timber", "threshold", "commons"]) {
      assert.equal(CARD_LIST.filter((card) => card.identity === identity).length, 12);
    }
    assert.equal(PERSONALITIES.length, 12);
    assert.ok(OPPONENTS.some((opponent) => opponent.kind === "tutorial"));
    assert.ok(OPPONENTS.some((opponent) => opponent.kind === "practice"));
    for (const opponent of OPPONENTS) assert.equal(validateDeck(opponent.deck), null);
    for (const card of CARD_LIST) {
      assert.match(card.acquisition, /Not sold, not packed, not gated/);
      if (card.heir) assert.ok(card.heir.name !== card.name);
    }
  });
});

describe("scoring worked example", () => {
  it("matches the published county fragment", () => {
    const south = [
      ...["oh-cider-house", "oh-ada", "oh-lewis", "oh-dwarf-rows", "oh-farmhouse", "oh-stone-wall", "oh-may", "oh-ellis"],
      ...["rk-rope-ferry", "rk-ice-house", "rk-reed-bed", "rk-cistern"],
    ];
    const north = [
      ...["rk-mill", "rk-rope-ferry", "rk-ice-house", "rk-landing", "rk-ruth", "rk-bram", "rk-quinn", "rk-pike"],
      ...["cm-porch", "cm-neighbor", "cm-green", "cm-well"],
    ];
    const state = createMatch({
      seed: 3,
      decks: [[...south, ...south], [...north, ...north]],
      era1First: 0,
      stacked: true,
    });
    const cider = move(state, 0, "oh-cider-house", plotIndex(3, 0));
    const ada = move(state, 0, "oh-ada", plotIndex(3, 1));
    const lewis = move(state, 0, "oh-lewis", plotIndex(3, 2));
    move(state, 0, "rk-rope-ferry", plotIndex(1, 0));
    move(state, 1, "rk-mill", plotIndex(1, 1));
    move(state, 1, "cm-porch", plotIndex(2, 1));
    state.cards[cider]!.tend = 1;
    state.cards[lewis]!.inherited = true;
    state.pacts.push([plotIndex(1, 0), plotIndex(1, 1)]);
    assert.deepEqual(invariantErrors(state), []);
    const [s, n] = score(state);
    assert.equal(s.foundations, 9);
    assert.equal(s.hearths, 3);
    assert.equal(s.institutions, 1);
    assert.equal(s.water, 3);
    assert.equal(s.lineages, 6);
    assert.equal(s.pacts, 2);
    assert.equal(s.structure, 22);
    assert.equal(s.total, 24);
    assert.equal(n.foundations, 2);
    assert.equal(n.hearths, 3);
    assert.equal(n.institutions, 5);
    assert.equal(n.water, 3);
    assert.equal(n.lineages, 0);
    assert.equal(n.pacts, 2);
    assert.equal(n.structure, 13);
    assert.equal(n.total, 15);
    assert.equal(ada.length > 0, true);
    const mirror = move(state, 0, "oh-stone-wall", plotIndex(0, 0));
    state.cards[mirror]!.sealFavor = true;
    const sealed = score(state, true)[0];
    const ordinary = score(state, false)[0];
    assert.equal(sealed.foundations, ordinary.foundations + 2);
  });
});

describe("placement and actions", () => {
  it("rejects illegal ground and accepts kin, tools, and a discount", () => {
    const state = createMatch({
      seed: 8,
      decks: [pureDeck("orchard"), pureDeck("river")],
      era1First: 0,
      stacked: true,
    });
    const cider = state.players[0].hand.find((uid) => state.cards[uid]!.defId === "oh-cider-house")!;
    assert.ok(legalPlots(state, 0, cider).includes(plotIndex(3, 0)));
    assert.equal(legalPlots(state, 0, cider).includes(plotIndex(1, 0)), false);
    assert.throws(() => applyAction(state, { type: "establish", cardUid: cider, plot: plotIndex(1, 0) }), IllegalAction);
    let next = applyAction(state, { type: "establish", cardUid: cider, plot: plotIndex(3, 0) });
    const ada = next.players[0].hand.find((uid) => next.cards[uid]!.defId === "oh-ada")!;
    assert.ok(legalPlots(next, 0, ada).includes(plotIndex(3, 1)));
    assert.equal(legalPlots(next, 0, ada).includes(plotIndex(0, 0)), false);
    next = applyAction(next, { type: "pass" });
    assert.equal(next.active, 0);
    assert.equal(next.players[1].memory, 1);
    next = applyAction(next, { type: "pass" });
    assert.equal(next.players[0].memory, 1);
  });

  it("tools are dead until something they fit stands beside them", () => {
    const state = createMatch({
      seed: 4,
      decks: [pureDeck("river"), pureDeck("commons")],
      era1First: 0,
      stacked: true,
    });
    const pike = state.players[0].deck.find((uid) => state.cards[uid]!.defId === "rk-pike")!;
    state.players[0].deck = state.players[0].deck.filter((uid) => uid !== pike);
    state.players[0].hand.push(pike);
    assert.equal(legalPlots(state, 0, pike).length, 0);
    const ferry = state.players[0].hand.find((uid) => state.cards[uid]!.defId === "rk-rope-ferry")!;
    const withFerry = applyAction(state, { type: "establish", cardUid: ferry, plot: plotIndex(1, 0) });
    const still = withFerry.players[0].hand.find((uid) => withFerry.cards[uid]!.defId === "rk-pike")!;
    assert.ok(legalPlots(withFerry, 0, still).includes(plotIndex(1, 1)));
    const mill = withFerry.players[0].deck.find((uid) => withFerry.cards[uid]!.defId === "rk-mill")!;
    withFerry.players[0].deck = withFerry.players[0].deck.filter((uid) => uid !== mill);
    withFerry.players[0].hand.push(mill);
    assert.equal(playCost(withFerry, 0, mill, plotIndex(2, 0)), CARDS["rk-mill"]!.cost - 1);
    assert.equal(playCost(withFerry, 0, mill, plotIndex(2, 2)), CARDS["rk-mill"]!.cost);
    const parked = move(withFerry, 0, "rk-pike", plotIndex(3, 0));
    assert.equal(score(withFerry)[0].foundations, faceOf(withFerry.cards[ferry]!).shownBase);
    assert.equal(score(withFerry).reduce((sum, row) => sum + row.foundations, 0) >= 0, true);
    withFerry.plots[plotIndex(0, 1)] = null;
    assert.equal(withFerry.cards[parked]!.defId, "rk-pike");
  });

  it("seals, lets the second household inherit first, and replays", () => {
    let state = createMatch({
      seed: 11,
      decks: [pureDeck("orchard"), pureDeck("commons")],
      era1First: 0,
      stacked: true,
      config: { turnsPerEra: 1 },
    });
    state = applyAction(state, { type: "pass" });
    state = applyAction(state, { type: "pass" });
    assert.equal(state.phase, "inherit");
    assert.equal(state.chooser, 0);
    assert.equal(state.players[0].seal, 0);
    state = applyAction(state, { type: "inherit", keep: [] });
    assert.equal(state.phase, "inherit");
    assert.equal(state.chooser, 1);
    state = applyAction(state, { type: "inherit", keep: [] });
    assert.equal(state.era, 2);
    assert.equal(state.active, 1);
    assert.equal(state.phase, "play");
    assert.throws(() => applyAction(state, { type: "inherit", keep: ["nope"] }), IllegalAction);
  });

  it("transforms one kept face and refuses a third free keeper", () => {
    const state = createMatch({
      seed: 15,
      decks: [pureDeck("river"), pureDeck("orchard")],
      era1First: 0,
      stacked: true,
      config: { turnsPerEra: 1 },
    });
    const ferry = move(state, 0, "rk-rope-ferry", plotIndex(1, 0));
    const ice = move(state, 0, "rk-ice-house", plotIndex(1, 1));
    const reed = move(state, 0, "rk-reed-bed", plotIndex(3, 3));
    state.phase = "inherit";
    state.chooser = 0;
    state.players[0].memory = 0;
    assert.throws(
      () => applyAction(state, { type: "inherit", keep: [ferry, ice, reed] }),
      IllegalAction,
    );
    state.players[1].memory = 0;
    let next = applyAction(state, { type: "inherit", keep: [ferry], transform: ferry });
    next = applyAction(next, { type: "inherit", keep: [] });
    assert.equal(next.cards[ferry]!.face, "heir");
    assert.equal(next.cards[ferry]!.inherited, true);
    assert.equal(faceOf(next.cards[ferry]!).shownName, "Late Rope Ferry");
    assert.equal(faceOf(next.cards[ferry]!).shownTags.includes("home"), true);
    assert.equal(next.plots[plotIndex(1, 1)], null);
    const [south] = score(next);
    assert.equal(south.foundations, 3 + 1);
    assert.equal(south.hearths, 2);
  });
});

describe("full matches", () => {
  it("finishes legal fuzz matches and replays a short one", () => {
    for (let seed = 1; seed <= 8; seed++) {
      const done = fuzzMatch(seed, 2);
      assert.equal(done.phase, "over");
      assert.deepEqual(invariantErrors(done), []);
      assert.ok(done.winner === 0 || done.winner === 1 || done.winner === "draw");
    }
    assert.doesNotThrow(() => assertReplay(21, 2));
  });

  it("lesson neighbor follows the porch script when it is legal", () => {
    const [south, north] = lessonDecks();
    let state = createMatch({
      seed: 14,
      decks: [south, north],
      era1First: 0,
      stacked: true,
      names: ["You", "Neighbor"],
      config: { turnsPerEra: 4, freeKeeps: 1, coach: true },
    });
    const cider = state.players[0].hand.find((uid) => state.cards[uid]!.defId === "oh-cider-house")!;
    state = applyAction(state, { type: "establish", cardUid: cider, plot: plotIndex(3, 0) });
    const scripted = tutorialOpponentAction(state);
    assert.equal(scripted.type, "establish");
    if (scripted.type === "establish") assert.equal(state.cards[scripted.cardUid]!.defId, "cm-porch");
    state = applyAction(state, scripted);
    assert.equal(PLOTS[plotIndex(2, 1)]!.name, "Ferrisburgh");
    assert.equal(state.plots[plotIndex(2, 1)] !== null, true);
    while (state.phase !== "over") {
      const action = state.active === 0 || state.phase === "inherit" && state.chooser === 0
        ? chooseAction(state, {
            foundations: 2,
            hearths: 2,
            institutions: 1,
            water: 1,
            lineages: 2,
            pacts: 1,
            deny: 0,
            tend: 1,
            memory: 1,
            warmth: 1,
          }, true)
        : tutorialOpponentAction(state);
      state = applyAction(state, action);
    }
    assert.deepEqual(invariantErrors(state), []);
    const again = replayMatch({
      seed: 14,
      decks: [south, north],
      era1First: 0,
      stacked: true,
      names: ["You", "Neighbor"],
      config: { turnsPerEra: 4, freeKeeps: 1, coach: true },
      actions: state.actions,
    });
    assert.equal(again.winner, state.winner);
    assert.equal(legalActions(state).length, 0);
  });
});
