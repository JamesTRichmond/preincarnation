import { adjacent, neighbors, PLOTS } from "./board.ts";
import { CARDS, type CardDef, type EffectKind } from "./cards.ts";

export type Seat = 0 | 1;

export interface Config {
  turnsPerEra: number;
  freeKeeps: number;
  handMax: number;
  openingHand: number;
  warmthCap: number;
  thaw: number;
  firstWarmth: number;
  secondWarmth: number;
  secondMemory: number;
  coach: boolean;
}

export const STANDARD: Config = {
  turnsPerEra: 7,
  freeKeeps: 2,
  handMax: 7,
  openingHand: 5,
  warmthCap: 8,
  thaw: 2,
  firstWarmth: 4,
  secondWarmth: 5,
  secondMemory: 0,
  coach: false,
};

export const LESSON: Config = { ...STANDARD, turnsPerEra: 4, freeKeeps: 1, coach: true };

export interface CardInst {
  uid: string;
  defId: string;
  owner: Seat;
  face: "printed" | "heir";
  tend: number;
  bonus: number;
  inherited: boolean;
  sealFavor: boolean;
}

export interface PlayerState {
  deck: string[];
  hand: string[];
  discard: string[];
  warmth: number;
  memory: number;
  seal: number;
  turnsTaken: number;
}

export interface InheritChoice {
  keep: string[];
  transform?: string;
}

export type Action =
  | { type: "establish"; cardUid: string; plot?: number; targetUid?: string; neighbor?: number }
  | { type: "tend"; cardUid: string }
  | { type: "remember"; bottomUid: string }
  | { type: "share"; plot: number; neighbor: number }
  | { type: "pass" }
  | { type: "inherit"; keep: string[]; transform?: string };

export interface GameState {
  seed: number;
  rng: number;
  era1First: Seat;
  names: [string, string];
  deckLists: [string[], string[]];
  era: 1 | 2;
  active: Seat;
  phase: "play" | "inherit" | "over";
  chooser: Seat | null;
  choices: [InheritChoice | null, InheritChoice | null];
  plots: (string | null)[];
  pacts: [number, number][];
  cards: Record<string, CardInst>;
  players: [PlayerState, PlayerState];
  log: string[];
  config: Config;
  winner: Seat | "draw" | null;
  actions: Action[];
}

export interface Face extends CardDef {
  shownName: string;
  shownBase: number;
  shownTags: string[];
  shownFlavor: string;
}

export interface Breakdown {
  foundations: number;
  hearths: number;
  institutions: number;
  water: number;
  lineages: number;
  pacts: number;
  structure: number;
  seal: number;
  total: number;
}

export class IllegalAction extends Error {}

export function nextRand(box: { rng: number }): number {
  let a = box.rng | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  box.rng = a >>> 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function faceOf(inst: CardInst): Face {
  const def = CARDS[inst.defId];
  if (!def) throw new Error(`Missing card ${inst.defId}`);
  if (inst.face === "heir" && def.heir) {
    return {
      ...def,
      shownName: def.heir.name,
      shownBase: def.heir.base,
      shownTags: def.heir.tags,
      shownFlavor: def.heir.flavor,
    };
  }
  return {
    ...def,
    shownName: def.name,
    shownBase: def.base,
    shownTags: def.tags,
    shownFlavor: def.flavor,
  };
}

export function validateDeck(ids: string[]): string | null {
  if (ids.length !== 24) return "A deck is 24 cards.";
  const counts = new Map<string, number>();
  const ident = new Map<string, number>();
  for (const id of ids) {
    const def = CARDS[id];
    if (!def) return `Unknown card ${id}.`;
    const n = (counts.get(id) ?? 0) + 1;
    if (n > 2) return `More than two copies of ${def.name}.`;
    counts.set(id, n);
    ident.set(def.identity, (ident.get(def.identity) ?? 0) + 1);
  }
  let primary = 0;
  for (const n of ident.values()) primary = Math.max(primary, n);
  if (primary < 16) return "At least 16 cards must share one household identity.";
  return null;
}

export function keepPriority(state: GameState, uid: string): number {
  const face = faceOf(state.cards[uid]!);
  let score = face.shownBase * 10 - face.cost;
  if (face.kind === "place") score += 5;
  if (face.kind === "event") score -= 3;
  if (face.heir) score += 2;
  return score;
}

function compareUid(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function cloneState(s: GameState): GameState {
  return {
    ...s,
    names: [s.names[0], s.names[1]],
    deckLists: [
      [...s.deckLists[0]],
      [...s.deckLists[1]],
    ],
    choices: [
      s.choices[0] ? { keep: [...s.choices[0].keep], transform: s.choices[0].transform } : null,
      s.choices[1] ? { keep: [...s.choices[1].keep], transform: s.choices[1].transform } : null,
    ],
    plots: [...s.plots],
    pacts: s.pacts.map((p) => [p[0], p[1]]),
    cards: Object.fromEntries(Object.entries(s.cards).map(([k, v]) => [k, { ...v }])),
    players: [
      copyPlayer(s.players[0]),
      copyPlayer(s.players[1]),
    ],
    log: [...s.log],
    config: { ...s.config },
    actions: [...s.actions],
  };
}

function copyPlayer(p: PlayerState): PlayerState {
  return { ...p, deck: [...p.deck], hand: [...p.hand], discard: [...p.discard] };
}

function shuffle(arr: string[], box: { rng: number }) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand(box) * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
}

function log(state: GameState, line: string) {
  state.log.push(line);
  if (state.log.length > 80) state.log.splice(0, state.log.length - 80);
}

export interface MatchOpts {
  seed: number;
  decks: [string[], string[]];
  era1First?: Seat;
  names?: [string, string];
  config?: Partial<Config>;
  stacked?: boolean;
}

export function createMatch(opts: MatchOpts): GameState {
  const config: Config = { ...STANDARD, ...opts.config };
  const seed = opts.seed >>> 0;
  const era1First: Seat = opts.era1First ?? ((seed % 2) as Seat);
  for (const deck of opts.decks) {
    const err = validateDeck(deck);
    if (err) throw new Error(err);
  }
  const cards: Record<string, CardInst> = {};
  function makePlayer(owner: Seat): PlayerState {
    const deck = opts.decks[owner].map((defId, copy) => {
      const uid = `${defId}#${owner}#${copy}`;
      cards[uid] = {
        uid,
        defId,
        owner,
        face: "printed",
        tend: 0,
        bonus: 0,
        inherited: false,
        sealFavor: false,
      };
      return uid;
    });
    return {
      deck,
      hand: [],
      discard: [],
      warmth: owner === era1First ? config.firstWarmth : config.secondWarmth,
      memory: owner === era1First ? 0 : config.secondMemory,
      seal: 0,
      turnsTaken: 0,
    };
  }
  const players: [PlayerState, PlayerState] = [makePlayer(0), makePlayer(1)];

  const state: GameState = {
    seed,
    rng: seed,
    era1First,
    names: opts.names ?? ["South household", "North household"],
    deckLists: [
      [...opts.decks[0]],
      [...opts.decks[1]],
    ],
    era: 1,
    active: era1First,
    phase: "play",
    chooser: null,
    choices: [null, null],
    plots: Array.from({ length: 16 }, () => null),
    pacts: [],
    cards,
    players,
    log: [],
    config,
    winner: null,
    actions: [],
  };

  if (!opts.stacked) {
    shuffle(state.players[0].deck, state);
    shuffle(state.players[1].deck, state);
  }
  for (let i = 0; i < config.openingHand; i++) {
    drawOne(state, 0);
    drawOne(state, 1);
  }
  log(state, `${state.names[era1First]} opens era I.`);
  beginTurn(state);
  return state;
}

function beginTurn(state: GameState) {
  if (state.phase !== "play") return;
  const seat = state.active;
  const player = state.players[seat];
  player.warmth = Math.min(state.config.warmthCap, player.warmth + state.config.thaw);
  if (player.hand.length < 5) {
    const drawn = drawOne(state, seat);
    if (drawn) log(state, `${state.names[seat]}: hand of five.`);
  }
}

function canDraw(state: GameState, seat: Seat): boolean {
  const player = state.players[seat];
  return player.deck.length > 0 || player.discard.length > 0;
}

function drawOne(state: GameState, seat: Seat): string | null {
  const player = state.players[seat];
  if (player.deck.length === 0) {
    if (player.discard.length === 0) return null;
    player.deck = player.discard;
    player.discard = [];
    shuffle(player.deck, state);
    log(state, `${state.names[seat]} shuffles the discard under the deck.`);
  }
  const uid = player.deck.shift();
  if (!uid) return null;
  player.hand.push(uid);
  return uid;
}

function enforceHand(state: GameState, seat: Seat) {
  const player = state.players[seat];
  const max = state.config.handMax;
  if (player.hand.length <= max) return;
  const ranked = [...player.hand].sort((a, b) => {
    const d = keepPriority(state, b) - keepPriority(state, a);
    return d !== 0 ? d : compareUid(a, b);
  });
  const drop = ranked.slice(max);
  const dropSet = new Set(drop);
  player.hand = player.hand.filter((uid) => !dropSet.has(uid));
  player.discard.push(...drop);
  log(
    state,
    `${state.names[seat]} sets aside ${drop.map((uid) => faceOf(state.cards[uid]!).shownName).join(", ")} to keep a hand of ${max}.`,
  );
}

function trimHand(state: GameState, seat: Seat, max: number) {
  const player = state.players[seat];
  if (player.hand.length <= max) return;
  const ranked = [...player.hand].sort((a, b) => {
    const d = keepPriority(state, b) - keepPriority(state, a);
    return d !== 0 ? d : compareUid(a, b);
  });
  const drop = ranked.slice(max);
  const dropSet = new Set(drop);
  player.hand = player.hand.filter((uid) => !dropSet.has(uid));
  player.discard.push(...drop);
  log(
    state,
    `${state.names[seat]} carries five cards forward and sets aside ${drop.map((uid) => faceOf(state.cards[uid]!).shownName).join(", ")}.`,
  );
}

export function plotOf(state: GameState, uid: string): number {
  return state.plots.indexOf(uid);
}

export function ownerBoard(state: GameState, seat: Seat): string[] {
  const out: string[] = [];
  for (const uid of state.plots) {
    if (uid && state.cards[uid]!.owner === seat) out.push(uid);
  }
  return out;
}

function ownsPlace(state: GameState, seat: Seat): boolean {
  return ownerBoard(state, seat).some((uid) => faceOf(state.cards[uid]!).kind === "place");
}

function tagsOf(state: GameState, uid: string): string[] {
  return faceOf(state.cards[uid]!).shownTags;
}

function pactKey(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

function hasPact(state: GameState, a: number, b: number): boolean {
  const [x, y] = pactKey(a, b);
  return state.pacts.some((p) => p[0] === x && p[1] === y);
}

export function institutionDiscount(state: GameState, seat: Seat, plot: number): boolean {
  return neighbors(plot).some((n) => {
    const uid = state.plots[n];
    return !!uid && state.cards[uid]!.owner === seat;
  });
}

export function playCost(state: GameState, seat: Seat, uid: string, plot?: number): number {
  const face = faceOf(state.cards[uid]!);
  if (face.kind === "institution" && plot !== undefined && institutionDiscount(state, seat, plot)) {
    return Math.max(0, face.cost - 1);
  }
  return face.cost;
}

function boardEmpty(state: GameState): boolean {
  return state.plots.every((uid) => uid === null);
}

export function legalPlots(state: GameState, seat: Seat, uid: string): number[] {
  const inst = state.cards[uid];
  if (!inst || inst.owner !== seat) return [];
  if (!state.players[seat].hand.includes(uid)) return [];
  const face = faceOf(inst);
  const plots: number[] = [];
  for (let i = 0; i < 16; i++) {
    if (state.plots[i]) continue;
    if (face.kind === "place") {
      if (face.terrain === "any" || face.terrain === PLOTS[i]!.terrain) plots.push(i);
    } else if (face.kind === "person") {
      const nearOwnPlace = neighbors(i).some((n) => {
        const other = state.plots[n];
        return !!other && state.cards[other]!.owner === seat && faceOf(state.cards[other]!).kind === "place";
      });
      const nearKin = neighbors(i).some((n) => {
        const other = state.plots[n];
        if (!other || state.cards[other]!.owner !== seat) return false;
        const of = faceOf(state.cards[other]!);
        return of.kind === "person" && of.line === face.line && !!face.line;
      });
      const newcomer = !ownsPlace(state, seat) && (PLOTS[i]!.terrain === "town" || PLOTS[i]!.terrain === "field");
      if (nearOwnPlace || nearKin || newcomer) plots.push(i);
    } else if (face.kind === "tool") {
      const fits = face.fits ?? [];
      const anyFit = fits.includes("any");
      if (boardEmpty(state) && anyFit) {
        plots.push(i);
        continue;
      }
      const ok = neighbors(i).some((n) => {
        const other = state.plots[n];
        if (!other) return false;
        if (anyFit) return true;
        const tags = tagsOf(state, other);
        return fits.some((fit) => tags.includes(fit));
      });
      if (ok) plots.push(i);
    } else if (face.kind === "institution") {
      const town = PLOTS[i]!.terrain === "town";
      const crowded = neighbors(i).filter((n) => state.plots[n]).length >= 2;
      if (town || crowded) plots.push(i);
    }
  }
  return plots;
}

function toolLive(state: GameState, uid: string): boolean {
  const plot = plotOf(state, uid);
  if (plot < 0) return false;
  const face = faceOf(state.cards[uid]!);
  if (face.kind !== "tool") return true;
  const fits = face.fits ?? [];
  const anyFit = fits.includes("any");
  return neighbors(plot).some((n) => {
    const other = state.plots[n];
    if (!other) return false;
    if (anyFit) return true;
    const tags = tagsOf(state, other);
    return fits.some((fit) => tags.includes(fit));
  });
}

function effectNeeds(effect: EffectKind | undefined): "none" | "mend" | "recall" | "pact" {
  if (effect === "mend") return "mend";
  if (effect === "recall") return "recall";
  if (effect === "openPact") return "pact";
  return "none";
}

export function mendTargets(state: GameState, seat: Seat): string[] {
  return ownerBoard(state, seat);
}

export function recallTargets(state: GameState, seat: Seat): string[] {
  return ownerBoard(state, seat).filter((uid) => !state.cards[uid]!.inherited);
}

export function pactPairs(state: GameState, seat: Seat): { plot: number; neighbor: number }[] {
  const pairs: { plot: number; neighbor: number }[] = [];
  for (let plot = 0; plot < 16; plot++) {
    const uid = state.plots[plot];
    if (!uid || state.cards[uid]!.owner !== seat) continue;
    for (const neighbor of neighbors(plot)) {
      const other = state.plots[neighbor];
      if (!other || state.cards[other]!.owner === seat) continue;
      if (hasPact(state, plot, neighbor)) continue;
      pairs.push({ plot, neighbor });
    }
  }
  return pairs;
}

function establishError(state: GameState, seat: Seat, action: Extract<Action, { type: "establish" }>): string | null {
  if (state.phase !== "play" || state.active !== seat) return "Not your winter.";
  const inst = state.cards[action.cardUid];
  if (!inst || inst.owner !== seat) return "That card is not yours.";
  if (!state.players[seat].hand.includes(action.cardUid)) return "That card is not in hand.";
  const face = faceOf(inst);
  const need = effectNeeds(face.effect);
  if (face.kind === "event") {
    const cost = face.cost;
    if (state.players[seat].warmth < cost) return "Not enough warmth.";
    if (need === "mend" && mendTargets(state, seat).length === 0) return "Nothing of yours to tend.";
    if (need === "mend" && (!action.targetUid || !mendTargets(state, seat).includes(action.targetUid))) {
      return "Choose one of your cards to tend.";
    }
    if (need === "recall" && recallTargets(state, seat).length === 0) return "Nothing uninherited to call home.";
    if (need === "recall" && (!action.targetUid || !recallTargets(state, seat).includes(action.targetUid))) {
      return "Choose an uninherited card to call home.";
    }
    if (need === "pact") {
      const pairs = pactPairs(state, seat);
      if (pairs.length === 0) return "No open border for a pact.";
      if (action.plot === undefined || action.neighbor === undefined) return "Choose the border.";
      if (!pairs.some((p) => p.plot === action.plot && p.neighbor === action.neighbor)) return "That border cannot take a pact.";
    }
    return null;
  }
  if (action.plot === undefined) return "Choose a plot.";
  if (!legalPlots(state, seat, action.cardUid).includes(action.plot)) return "That plot will not take this card.";
  const cost = playCost(state, seat, action.cardUid, action.plot);
  if (state.players[seat].warmth < cost) return "Not enough warmth.";
  if (need === "mend") return "A placed card cannot ask for a target.";
  return null;
}

export function legalActions(state: GameState): Action[] {
  if (state.phase !== "play") return [];
  const seat = state.active;
  const actions: Action[] = [{ type: "pass" }];
  const player = state.players[seat];
  for (const uid of ownerBoard(state, seat)) {
    if (state.cards[uid]!.tend < 2 && player.warmth >= 1) actions.push({ type: "tend", cardUid: uid });
  }
  for (const pair of pactPairs(state, seat)) {
    if (player.warmth >= 1) actions.push({ type: "share", plot: pair.plot, neighbor: pair.neighbor });
  }
  for (const uid of player.hand) {
    const face = faceOf(state.cards[uid]!);
    if (face.kind === "event") {
      const need = effectNeeds(face.effect);
      if (player.warmth < face.cost) continue;
      if (need === "none") actions.push({ type: "establish", cardUid: uid });
      else if (need === "mend") {
        for (const targetUid of mendTargets(state, seat)) actions.push({ type: "establish", cardUid: uid, targetUid });
      } else if (need === "recall") {
        for (const targetUid of recallTargets(state, seat)) actions.push({ type: "establish", cardUid: uid, targetUid });
      } else {
        for (const pair of pactPairs(state, seat)) {
          actions.push({ type: "establish", cardUid: uid, plot: pair.plot, neighbor: pair.neighbor });
        }
      }
    } else {
      for (const plot of legalPlots(state, seat, uid)) {
        if (player.warmth >= playCost(state, seat, uid, plot)) {
          actions.push({ type: "establish", cardUid: uid, plot });
        }
      }
    }
  }
  const remembered = canonicalRemember(state);
  if (remembered) actions.push(remembered);
  return actions;
}

export function canonicalRemember(state: GameState): Extract<Action, { type: "remember" }> | null {
  if (state.phase !== "play") return null;
  if (!canDraw(state, state.active)) return null;
  const clone = cloneState(state);
  const seat = clone.active;
  for (let i = 0; i < 2; i++) {
    if (!drawOne(clone, seat)) break;
  }
  const hand = clone.players[seat].hand;
  if (hand.length === 0) return null;
  let bottom = hand[0]!;
  for (const uid of hand.slice(1)) {
    const pri = keepPriority(clone, uid);
    const bottomPri = keepPriority(clone, bottom);
    if (pri < bottomPri || (pri === bottomPri && uid > bottom)) bottom = uid;
  }
  return { type: "remember", bottomUid: bottom };
}

export function rememberPreview(state: GameState): { hand: string[]; drawn: string[] } | null {
  if (state.phase !== "play" || !canDraw(state, state.active)) return null;
  const clone = cloneState(state);
  const before = new Set(clone.players[clone.active].hand);
  const drawn: string[] = [];
  for (let i = 0; i < 2; i++) {
    const uid = drawOne(clone, clone.active);
    if (!uid) break;
    if (!before.has(uid)) drawn.push(uid);
  }
  return { hand: clone.players[clone.active].hand, drawn };
}

export function inheritError(state: GameState, action: Extract<Action, { type: "inherit" }>): string | null {
  if (state.phase !== "inherit" || state.chooser === null) return "It is not the threshold.";
  const seat = state.chooser;
  const owned = new Set(ownerBoard(state, seat));
  if (new Set(action.keep).size !== action.keep.length) return "A card can be kept only once.";
  for (const uid of action.keep) {
    if (!owned.has(uid)) return "You can keep only your own cards.";
  }
  const cap = state.config.freeKeeps + state.players[seat].memory;
  if (action.keep.length > cap) return "That is more than memory allows.";
  if (action.transform) {
    if (!action.keep.includes(action.transform)) return "Transform a card you are keeping.";
    const inst = state.cards[action.transform]!;
    if (!CARDS[inst.defId]?.heir || inst.face === "heir") return "That card has no later face.";
  }
  return null;
}

export function actionKey(action: Action): string {
  switch (action.type) {
    case "establish":
      return `e:${action.cardUid}:${action.plot ?? "-"}:${action.targetUid ?? "-"}:${action.neighbor ?? "-"}`;
    case "tend":
      return `t:${action.cardUid}`;
    case "remember":
      return `r:${action.bottomUid}`;
    case "share":
      return `s:${action.plot}:${action.neighbor}`;
    case "pass":
      return "p";
    case "inherit":
      return `i:${[...action.keep].sort().join(",")}:${action.transform ?? "-"}`;
  }
}

export function applyAction(state: GameState, action: Action): GameState {
  const next = cloneState(state);
  applyInPlace(next, action);
  const errors = invariantErrors(next);
  if (errors.length) throw new IllegalAction(errors[0]);
  return next;
}

function applyInPlace(state: GameState, action: Action) {
  if (action.type === "inherit") {
    const err = inheritError(state, action);
    if (err) throw new IllegalAction(err);
    const seat = state.chooser!;
    state.choices[seat] = { keep: [...action.keep], transform: action.transform };
    state.actions.push(action);
    log(state, `${state.names[seat]} chooses ${action.keep.length} card${action.keep.length === 1 ? "" : "s"} to carry.`);
    const other = (1 - seat) as Seat;
    if (!state.choices[other]) {
      state.chooser = other;
      log(state, `${state.names[other]} chooses what to carry.`);
      return;
    }
    resolveThreshold(state);
    return;
  }
  if (state.phase !== "play") throw new IllegalAction("The match is not waiting on a winter.");
  const seat = state.active;
  if (action.type === "pass") {
    state.players[seat].warmth = Math.min(state.config.warmthCap, state.players[seat].warmth + 1);
    state.players[seat].memory += 1;
    log(state, `${state.names[seat]} passes a winter and keeps a memory.`);
  } else if (action.type === "tend") {
    const inst = state.cards[action.cardUid];
    if (!inst || inst.owner !== seat || plotOf(state, action.cardUid) < 0) throw new IllegalAction("Nothing there to tend.");
    if (inst.tend >= 2) throw new IllegalAction("That card already has two tend marks.");
    if (state.players[seat].warmth < 1) throw new IllegalAction("Not enough warmth.");
    state.players[seat].warmth -= 1;
    inst.tend += 1;
    log(state, `${state.names[seat]} tends ${faceOf(inst).shownName}.`);
  } else if (action.type === "share") {
    if (state.players[seat].warmth < 1) throw new IllegalAction("Not enough warmth.");
    const ok = pactPairs(state, seat).some((p) => p.plot === action.plot && p.neighbor === action.neighbor);
    if (!ok) throw new IllegalAction("That border cannot take a pact.");
    state.players[seat].warmth -= 1;
    state.pacts.push(pactKey(action.plot, action.neighbor));
    log(
      state,
      `${state.names[seat]} opens a pact between ${PLOTS[action.plot]!.short} and ${PLOTS[action.neighbor]!.short}.`,
    );
  } else if (action.type === "remember") {
    if (!canDraw(state, seat)) throw new IllegalAction("Nothing left to remember.");
    for (let i = 0; i < 2; i++) {
      if (!drawOne(state, seat)) break;
    }
    const hand = state.players[seat].hand;
    const at = hand.indexOf(action.bottomUid);
    if (at < 0) throw new IllegalAction("That card is not in hand to put under the deck.");
    hand.splice(at, 1);
    state.players[seat].deck.push(action.bottomUid);
    state.players[seat].memory += 1;
    enforceHand(state, seat);
    log(state, `${state.names[seat]} remembers, and puts ${faceOf(state.cards[action.bottomUid]!).shownName} under the deck.`);
  } else if (action.type === "establish") {
    const err = establishError(state, seat, action);
    if (err) throw new IllegalAction(err);
    const inst = state.cards[action.cardUid]!;
    const face = faceOf(inst);
    const cost = face.kind === "event" ? face.cost : playCost(state, seat, action.cardUid, action.plot);
    state.players[seat].warmth -= cost;
    state.players[seat].hand = state.players[seat].hand.filter((uid) => uid !== action.cardUid);
    if (face.kind === "event") {
      resolveEffect(state, seat, face.effect, null, action);
      state.players[seat].discard.push(action.cardUid);
      log(state, `${state.names[seat]} spends the winter on ${face.shownName}.`);
    } else {
      state.plots[action.plot!] = action.cardUid;
      resolveEffect(state, seat, face.effect, action.cardUid, action);
      log(state, `${state.names[seat]} establishes ${face.shownName} on ${PLOTS[action.plot!]!.name}.`);
    }
    enforceHand(state, seat);
    enforceHand(state, (1 - seat) as Seat);
  } else {
    throw new IllegalAction("Unknown action.");
  }
  state.actions.push(action);
  state.players[seat].turnsTaken += 1;
  const done =
    state.players[0].turnsTaken >= state.config.turnsPerEra &&
    state.players[1].turnsTaken >= state.config.turnsPerEra;
  if (done && state.era === 1) {
    enterInherit(state);
    return;
  }
  if (done && state.era === 2) {
    state.phase = "over";
    state.winner = decideWinner(state);
    const word = state.winner === "draw" ? "The households tie." : `${state.names[state.winner]} takes the county.`;
    log(state, word);
    return;
  }
  state.active = (1 - seat) as Seat;
  beginTurn(state);
}

function resolveEffect(
  state: GameState,
  seat: Seat,
  effect: EffectKind | undefined,
  sourceUid: string | null,
  action: Extract<Action, { type: "establish" }>,
) {
  if (!effect) return;
  if (effect === "draw1") drawOne(state, seat);
  else if (effect === "warmth1") addWarmth(state, seat, 1);
  else if (effect === "warmth2") addWarmth(state, seat, 2);
  else if (effect === "memory") state.players[seat].memory += 1;
  else if (effect === "rivalDraw") drawOne(state, (1 - seat) as Seat);
  else if (effect === "winterBite") {
    const other = state.players[(1 - seat) as Seat];
    other.warmth = Math.max(0, other.warmth - 2);
  } else if (effect === "sealFavor") {
    if (sourceUid) state.cards[sourceUid]!.sealFavor = true;
  } else if (effect === "mend") {
    const inst = state.cards[action.targetUid!]!;
    if (inst.tend < 2) inst.tend += 1;
    else inst.bonus += 1;
  } else if (effect === "recall") {
    const uid = action.targetUid!;
    const plot = plotOf(state, uid);
    state.plots[plot] = null;
    state.pacts = state.pacts.filter(([a, b]) => a !== plot && b !== plot);
    const inst = state.cards[uid]!;
    inst.tend = 0;
    inst.bonus = 0;
    state.players[seat].hand.push(uid);
  } else if (effect === "openPact") {
    state.pacts.push(pactKey(action.plot!, action.neighbor!));
  }
}

function addWarmth(state: GameState, seat: Seat, n: number) {
  const player = state.players[seat];
  player.warmth = Math.max(0, Math.min(state.config.warmthCap, player.warmth + n));
}

function enterInherit(state: GameState) {
  const breakdown = score(state, true);
  state.players[0].seal += Math.floor(breakdown[0].structure / 2);
  state.players[1].seal += Math.floor(breakdown[1].structure / 2);
  state.phase = "inherit";
  state.chooser = state.era1First;
  state.choices = [null, null];
  log(
    state,
    `Era I seals. ${state.names[0]} banks ${state.players[0].seal}. ${state.names[1]} banks ${state.players[1].seal}.`,
  );
}

function resolveThreshold(state: GameState) {
  const kept = new Set<string>();
  for (const choice of state.choices) {
    for (const uid of choice?.keep ?? []) kept.add(uid);
  }
  for (let i = 0; i < 16; i++) {
    const uid = state.plots[i];
    if (!uid || kept.has(uid)) continue;
    const owner = state.cards[uid]!.owner;
    state.plots[i] = null;
    const inst = state.cards[uid]!;
    inst.tend = 0;
    inst.bonus = 0;
    inst.sealFavor = false;
    state.players[owner].discard.push(uid);
  }
  state.pacts = state.pacts.filter(([a, b]) => state.plots[a] && state.plots[b]);
  for (const seat of [0, 1] as const) {
    const choice = state.choices[seat]!;
    for (const uid of choice.keep) {
      const inst = state.cards[uid]!;
      if (choice.transform === uid) {
        inst.face = "heir";
        inst.tend = 0;
        inst.bonus = 0;
        inst.inherited = true;
        log(state, `${faceOf(inst).shownName} is what ${CARDS[inst.defId]!.name} became.`);
      } else {
        inst.inherited = true;
      }
    }
    const spent = Math.max(0, choice.keep.length - state.config.freeKeeps);
    state.players[seat].memory -= spent;
    trimHand(state, seat, 5);
    while (state.players[seat].hand.length < 5) {
      if (!drawOne(state, seat)) break;
    }
  }
  const first = (1 - state.era1First) as Seat;
  state.players[first].warmth = state.config.firstWarmth;
  state.players[(1 - first) as Seat].warmth = state.config.secondWarmth;
  state.era = 2;
  state.players[0].turnsTaken = 0;
  state.players[1].turnsTaken = 0;
  state.phase = "play";
  state.chooser = null;
  state.choices = [null, null];
  state.active = first;
  log(state, `Era II. ${state.names[first]} opens.`);
  beginTurn(state);
}

function bodyValue(state: GameState, uid: string, forSeal: boolean): number {
  const inst = state.cards[uid]!;
  const face = faceOf(inst);
  if (face.kind === "tool" && !toolLive(state, uid)) return 0;
  if (face.kind === "institution" || face.kind === "event") return 0;
  let value = face.shownBase + inst.tend + inst.bonus + (inst.inherited ? 1 : 0);
  if (forSeal && inst.sealFavor) value += 2;
  return value;
}

export function score(state: GameState, forSeal = false): [Breakdown, Breakdown] {
  const out: [Breakdown, Breakdown] = [emptyBreak(), emptyBreak()];
  for (const uid of state.plots) {
    if (!uid) continue;
    const owner = state.cards[uid]!.owner;
    out[owner].foundations += bodyValue(state, uid, forSeal);
  }
  for (let plot = 0; plot < 16; plot++) {
    const uid = state.plots[plot];
    if (!uid) continue;
    const face = faceOf(state.cards[uid]!);
    if (face.kind !== "place" || !face.shownTags.includes("home")) continue;
    const owner = state.cards[uid]!.owner;
    out[owner].hearths += 2;
    for (const n of neighbors(plot)) {
      const other = state.plots[n];
      if (other && state.cards[other]!.owner === owner) out[owner].hearths += 1;
    }
  }
  for (let plot = 0; plot < 16; plot++) {
    const uid = state.plots[plot];
    if (!uid) continue;
    const face = faceOf(state.cards[uid]!);
    if (face.kind !== "institution") continue;
    const inst = state.cards[uid]!;
    const owner = inst.owner;
    const adj = neighbors(plot)
      .map((n) => state.plots[n])
      .filter((id): id is string => !!id);
    let value = 3 + inst.tend + inst.bonus + (inst.inherited ? 1 : 0) + adj.length;
    if (forSeal && inst.sealFavor) value += 2;
    out[owner].institutions += value;
    const help = adj.filter((id) => state.cards[id]!.owner !== owner).length;
    out[(1 - owner) as Seat].institutions += help;
  }
  const seen = new Set<number>();
  for (let start = 0; start < 16; start++) {
    if (seen.has(start) || !inWaterGraph(state, start)) continue;
    const component: number[] = [];
    const queue = [start];
    seen.add(start);
    while (queue.length) {
      const plot = queue.pop()!;
      component.push(plot);
      for (const n of neighbors(plot)) {
        if (seen.has(n) || !inWaterGraph(state, n)) continue;
        seen.add(n);
        queue.push(n);
      }
    }
    const touchesWater = component.some((plot) => PLOTS[plot]!.water);
    if (!touchesWater || component.length < 2) continue;
    const counts: [number, number] = [0, 0];
    for (const plot of component) counts[state.cards[state.plots[plot]!]!.owner] += 1;
    for (const seat of [0, 1] as const) {
      if (counts[seat] === 0) continue;
      if (counts[1 - seat] > 0) out[seat].water += counts[seat] * 2 + 1;
    }
  }
  for (const seat of [0, 1] as const) {
    const lines = new Map<string, CardInst[]>();
    for (const uid of ownerBoard(state, seat)) {
      const face = faceOf(state.cards[uid]!);
      if (face.kind !== "person" || !face.line) continue;
      const list = lines.get(face.line) ?? [];
      list.push(state.cards[uid]!);
      lines.set(face.line, list);
    }
    for (const group of lines.values()) {
      if (group.length >= 2) out[seat].lineages += 3 * (group.length - 1);
      if (group.some((inst) => inst.inherited)) out[seat].lineages += 3;
    }
  }
  for (const seat of [0, 1] as const) out[seat].pacts += state.pacts.length * 2;
  for (const seat of [0, 1] as const) {
    const row = out[seat];
    row.structure = row.foundations + row.hearths + row.institutions + row.water + row.lineages;
    row.seal = state.players[seat].seal;
    row.total = row.structure + row.pacts + row.seal;
  }
  return out;
}

function inWaterGraph(state: GameState, plot: number): boolean {
  const uid = state.plots[plot];
  if (!uid) return false;
  if (PLOTS[plot]!.water) return true;
  return tagsOf(state, uid).includes("water");
}

function emptyBreak(): Breakdown {
  return {
    foundations: 0,
    hearths: 0,
    institutions: 0,
    water: 0,
    lineages: 0,
    pacts: 0,
    structure: 0,
    seal: 0,
    total: 0,
  };
}

export function decideWinner(state: GameState): Seat | "draw" {
  const [a, b] = score(state);
  if (a.total !== b.total) return a.total > b.total ? 0 : 1;
  const inherited = [0, 1].map((seat) => ownerBoard(state, seat as Seat).filter((uid) => state.cards[uid]!.inherited).length);
  if (inherited[0] !== inherited[1]) return inherited[0]! > inherited[1]! ? 0 : 1;
  if (state.players[0].memory !== state.players[1].memory) {
    return state.players[0].memory > state.players[1].memory ? 0 : 1;
  }
  return "draw";
}

export function invariantErrors(state: GameState): string[] {
  const errors: string[] = [];
  if (state.plots.length !== 16) errors.push("Board is not 4×4.");
  const onBoard = new Set<string>();
  for (let i = 0; i < 16; i++) {
    const uid = state.plots[i];
    if (!uid) continue;
    if (onBoard.has(uid)) errors.push(`Duplicate plot card ${uid}.`);
    onBoard.add(uid);
    const inst = state.cards[uid];
    if (!inst) {
      errors.push(`Missing instance ${uid}.`);
      continue;
    }
    const face = faceOf(inst);
    if (face.kind === "event") errors.push("An event is on the board.");
    if (face.kind === "place" && face.terrain !== "any" && face.terrain !== PLOTS[i]!.terrain) {
      errors.push(`${face.shownName} is on the wrong ground.`);
    }
    if (inst.tend < 0 || inst.tend > 2) errors.push("Tend marks out of range.");
    if (inst.bonus < 0 || inst.bonus > 8) errors.push("Bonus marks out of range.");
  }
  for (const [a, b] of state.pacts) {
    if (!(a < b) || !adjacent(a, b)) errors.push("Pact is not an ordered border.");
    const left = state.plots[a];
    const right = state.plots[b];
    if (!left || !right) errors.push("Pact touches an empty plot.");
    else if (state.cards[left]!.owner === state.cards[right]!.owner) errors.push("Pact is not shared.");
  }
  const pactKeys = state.pacts.map((p) => p.join("-"));
  if (new Set(pactKeys).size !== pactKeys.length) errors.push("Duplicate pact.");
  for (const seat of [0, 1] as const) {
    const player = state.players[seat];
    if (player.warmth < 0 || player.warmth > state.config.warmthCap) errors.push("Warmth out of range.");
    if (player.memory < 0) errors.push("Memory went negative.");
    if (player.turnsTaken > state.config.turnsPerEra) errors.push("Too many winters.");
    if (player.hand.length > state.config.handMax) errors.push("Hand above seven.");
    const seen = new Set<string>();
    for (const uid of [...player.deck, ...player.hand, ...player.discard]) {
      if (seen.has(uid) || onBoard.has(uid)) errors.push(`Card ${uid} is in two places.`);
      seen.add(uid);
      if (state.cards[uid]?.owner !== seat) errors.push(`Card ${uid} has the wrong household.`);
    }
    for (const uid of onBoard) {
      if (state.cards[uid]!.owner === seat) {
        if (seen.has(uid)) errors.push(`Card ${uid} is in two places.`);
        seen.add(uid);
      }
    }
    if (seen.size !== 24) errors.push(`${state.names[seat]} does not have 24 cards (${seen.size}).`);
  }
  if (state.phase === "over" && state.winner === null) errors.push("Finished match has no result.");
  if (state.phase === "play" && state.winner !== null) errors.push("Result arrived early.");
  return errors;
}

export function replayMatch(opts: MatchOpts & { actions: Action[]; stacked?: boolean }): GameState {
  let state = createMatch(opts);
  for (const action of opts.actions) state = applyAction(state, action);
  return state;
}

export function mechanicalLine(inst: CardInst): string {
  const face = faceOf(inst);
  const bits = [face.kind, `cost ${face.cost}`];
  if (face.kind !== "institution" && face.kind !== "event") bits.push(`base ${face.shownBase}`);
  if (face.kind === "place") bits.push(face.terrain === "any" ? "any ground" : `${face.terrain} ground`);
  if (face.kind === "person" && face.line) bits.push(`line ${face.line}`);
  if (face.kind === "tool") bits.push(`beside ${(face.fits ?? []).join(" or ")}`);
  if (face.kind === "institution") bits.push("institution score");
  if (face.shownTags.length) bits.push(face.shownTags.join(", "));
  return bits.join(" · ");
}
