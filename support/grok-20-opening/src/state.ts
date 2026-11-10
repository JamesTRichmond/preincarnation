import { SAVE_VERSION, type State } from "./types.ts";
import { AT, defaultFlags } from "./world.ts";

export function initialState(): State {
  return {
    version: SAVE_VERSION,
    map: "road",
    x: AT.start.x,
    y: AT.start.y,
    facing: "e",
    era: "arrival",
    vitality: 5,
    bleed: false,
    dust: false,
    clothes: "travel",
    scarWrist: false,
    inventory: ["blade", "parcel"],
    equipped: null,
    flags: defaultFlags(),
    talk: null,
    talkProgress: {},
    steps: 0,
    dirsUsed: [],
    verbLog: [],
    hints: [],
    seen: [],
    clearedBriar: [],
    seam: {
      veinOpen: false,
      veinScar: false,
      yardOpen: false,
      yardScar: false,
      veinDent: false,
      yardDent: false,
    },
    dead: false,
    deaths: 0,
    lastCause: null,
    lastPlace: null,
    tick: 0,
    idle: 0,
    hammerSite: "none",
    visited: ["road"],
    explicitNotch: null,
    sessionNotch: null,
    agedNotch: null,
    continuity: null,
  };
}

export function bodyLine(state: State): string {
  if (state.dead) return "You do not seem to be bleeding here.";
  const parts: string[] = [];
  if (state.bleed && state.dust) parts.push("Dust, and a scratch that will not close.");
  else if (state.bleed) parts.push("A scratch along the wrist, still open.");
  else if (state.dust) parts.push("Marble dust in the teeth.");
  else parts.push("Your breath is even.");
  if (state.vitality <= 2) parts.push("You are not steady.");
  return parts.join(" ");
}
