import {
  SAVE_VERSION,
  type Notch,
  type NotchReason,
  type Persist,
  type Speech,
  type State,
} from "./types.ts";
import { SHORE, landingFor, placeTitle } from "./world.ts";

export interface Act {
  captions: string[];
  speech: Speech | null;
  events: string[];
}

export function act(): Act {
  return { captions: [], speech: null, events: [] };
}

export function persist(state: State): Persist {
  const { explicitNotch: _a, sessionNotch: _b, agedNotch: _c, continuity: _d, ...rest } = state;
  return rest;
}

export function continuityLine(notch: Notch): string {
  switch (notch.map) {
    case "inn":
      return "The candle is a stub. The page is where you left it.";
    case "shore":
      return "You are still at the water. It has not grown impatient.";
    case "vein":
      return "The dark is as you left it.";
    case "road":
      return "The road has not recited your errand.";
    default:
      return "Nothing has been repeated for you.";
  }
}

export function writeSession(state: State, reason: NotchReason): void {
  state.sessionNotch = {
    version: SAVE_VERSION,
    reason,
    place: placeTitle(state),
    map: state.map,
    x: state.x,
    y: state.y,
    tick: state.tick,
    snapshot: structuredClone(persist(state)),
  };
}

export function writeExplicit(state: State, reason: "ledger" | "stone", caption: string, bucket: Act): void {
  state.flags.explicitSave = true;
  const notch: Notch = {
    version: SAVE_VERSION,
    reason,
    place: placeTitle(state),
    map: state.map,
    x: state.x,
    y: state.y,
    tick: state.tick,
    snapshot: structuredClone(persist(state)),
  };
  state.explicitNotch = notch;
  state.sessionNotch = structuredClone(notch);
  bucket.captions.push(caption);
  bucket.events.push("saved:" + reason);
}

export function rememberVisit(state: State, map: State["map"]): void {
  if (!state.visited.includes(map)) state.visited.push(map);
}

export function kill(state: State, cause: string, bucket: Act): void {
  state.deaths += 1;
  state.lastCause = cause;
  state.lastPlace = state.map;
  state.dead = true;
  state.map = "shore";
  state.x = SHORE.start.x;
  state.y = SHORE.start.y;
  state.facing = "n";
  state.vitality = 0;
  state.bleed = false;
  state.dust = false;
  state.talk = null;
  rememberVisit(state, "shore");
  bucket.captions.push(state.deaths > 1 ? "You are at the water again." : "You are not on the road.");
  bucket.events.push("died:" + cause);
}

/** Returns true if the hurt ended in release to the shore. */
export function hurt(state: State, n: number, bleed: boolean, cause: string, bucket: Act): boolean {
  if (bleed) {
    state.bleed = true;
    state.flags.everBled = true;
  }
  state.vitality -= n;
  if (state.vitality <= 0) {
    state.vitality = 0;
    kill(state, cause, bucket);
    return true;
  }
  return false;
}

export function doRest(state: State, where: string, flavor: string, bucket: Act): void {
  const wounded = state.vitality < 5 || state.bleed || state.dust;
  state.vitality = 5;
  state.bleed = false;
  state.dust = false;
  state.flags.rested = true;
  if (wounded) state.flags.healedByRest = true;
  writeSession(state, "rest");
  const key = "rest:" + where;
  if (!state.seen.includes(key)) {
    state.seen.push(key);
    bucket.captions.push(flavor);
  }
  bucket.captions.push(wounded ? "You stop. The scratch closes while you are still." : "You stop. The body catches up.");
  bucket.events.push("rest");
}

export function release(state: State, bucket: Act): void {
  if (!state.dead) {
    bucket.events.push("rejected:release");
    return;
  }
  const again = state.flags.released;
  if (!state.agedNotch && state.explicitNotch) state.agedNotch = structuredClone(state.explicitNotch);
  state.explicitNotch = null;
  state.era = "altered";
  state.dead = false;
  state.clothes = "impression";
  state.vitality = 5;
  state.bleed = false;
  state.dust = false;
  state.flags.released = true;
  if (state.flags.everBled) state.scarWrist = true;
  const land = landingFor(state.lastPlace);
  state.map = land.map;
  state.x = land.x;
  state.y = land.y;
  state.facing = "s";
  state.talk = null;
  rememberVisit(state, land.map);
  if (again) bucket.captions.push("You are set down again.");
  else if (land.map === "river") bucket.captions.push("You are on the stones, not under them.");
  else if (land.map === "vein") bucket.captions.push("The antechamber is colder.");
  else if (land.map === "lane") bucket.captions.push("The lane is the same stones, set differently.");
  else if (land.map === "inn") bucket.captions.push("The hearth is lower than you remember, or you are.");
  else if (land.map === "yard") bucket.captions.push("The dust on the nail is older.");
  else bucket.captions.push("The mud has a different grain. The mile is the same mile.");
  writeSession(state, "release");
  bucket.events.push("released");
}

export function isWounded(state: State): boolean {
  return state.vitality < 5 || state.bleed || state.dust;
}
