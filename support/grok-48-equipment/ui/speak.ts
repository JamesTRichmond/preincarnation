import type { FactValue, Facts } from "../src/types.ts";
import type { SceneId } from "./paint.ts";

export const COACH: Record<SceneId, string> = {
  counter: "Set the timing, then throw. Inside the window the stone opens. Late is a miss, not a harder hit.",
  coat: "Catch one bolt in the coat, then release it. A second catch can be refused.",
  crate: "Shove the crate. Grain slides it. A knot can stop it. Two slides do not add.",
  charm: "Walk the eight-by-six yard, then mark the tile. A fight and a calm do not write the same mark.",
  net: "Cast. The mouth keeps some shots and lets others through. The fork is stricter than the net.",
  gates: "Equipment never turns the key. A seam, a stake, and the dark answer to tools, not to a bigger number.",
};

function dirName(value: FactValue | undefined): string {
  if (value === "N") return "north";
  if (value === "S") return "south";
  if (value === "E") return "east";
  if (value === "W") return "west";
  return "ahead";
}

function markReason(value: FactValue | undefined): string {
  if (value === "hitstun") return "Hitstun is on. The charm will not write.";
  if (value === "armed-fault") return "This tile is an armed fault.";
  if (value === "need-safe-flag") return "In a fight the charm only accepts a planted safe flag.";
  if (value === "marked") return "The charm accepts this tile.";
  return "The charm refuses.";
}

export function sceneNotes(scene: SceneId, facts: Facts | null): string[] {
  if (!facts) return [];
  const lines: string[] = [];
  if (scene === "counter") {
    if (typeof facts.counterWindowMs === "number") lines.push(`The window is ${facts.counterWindowMs} ms wide.`);
    if (facts.counterConverted === true) {
      const length = typeof facts.faultLength === "number" ? ` ${facts.faultLength}` : "";
      lines.push(`The counter is true. Stone opens${length} to the ${dirName(facts.faultDir)}.`);
    } else if (facts.counterConverted === false || facts.faultLength === 0) {
      lines.push("The counter misses the window. The stone stays shut.");
    }
    if (facts.faultTaped === true) lines.push("Tape holds the fault shorter than the saber asked.");
    if (facts.homingCut === true) lines.push("The spike strips homing from one shot.");
    if (facts.homingCut === false) lines.push("The spike is cold. Homing stays on the shot.");
    if (facts.slung === true) lines.push("The two-handed weapon is slung and does not strike.");
  }
  if (scene === "coat") {
    if (typeof facts.storeRefused === "string") lines.push(`The coat already holds a shot and refuses the ${facts.storeRefused}.`);
    else if (typeof facts.stored === "string") lines.push(`The coat holds one ${facts.stored}.`);
    if (facts.released === true) {
      const vector = facts.releaseVector ? ` along ${facts.releaseVector}` : "";
      const mode = facts.releaseMode ? `, ${facts.releaseMode}` : "";
      lines.push(`The stored shot leaves${vector}${mode}.`);
    }
    if (facts.rewound === true) lines.push("The spool pulls the missed shot back into the coat.");
    if (facts.glazeStick === true) lines.push("Glaze sticks the held shot in place.");
  }
  if (scene === "crate") {
    if (facts.crateResponse === "grain") {
      const units = typeof facts.slideUnits === "number" ? `${facts.slideUnits}` : "a short way";
      const source = typeof facts.grainSource === "string" ? ` from the ${facts.grainSource}` : "";
      lines.push(`The crate slides ${units} on its grain${source}.`);
    } else if (facts.crateResponse === "stop") {
      lines.push("The crate stops. The knot spends itself instead of letting the shove through.");
    } else if (facts.crateResponse === "tumble") {
      lines.push("The crate tumbles. Nothing worn gives it a grain.");
    }
    if (facts.knot === "used" || facts.knot === "spent") lines.push(facts.knot === "spent" ? "The quarry knot is already spent. Rest reties it." : "The quarry knot spends itself and stops the crate.");
  }
  if (scene === "charm") {
    if (facts.markLegal === true) lines.push("The charm marks this tile. It does not teleport.");
    else if (facts.markLegal === false) lines.push(markReason(facts.markReason));
  }
  if (scene === "net") {
    if (facts.netMouth === "inert") lines.push("The mouth waits. There is no creek net in the field.");
    if (typeof facts.caughtTags === "string" && facts.netMouth !== "inert") {
      lines.push(facts.caughtTags ? `The net keeps ${facts.caughtTags.split(",").join(", ")}.` : "The net keeps nothing.");
    }
    if (typeof facts.forkCatches === "string") {
      lines.push(`The fork takes ${facts.forkCatches} and refuses ${facts.forkRefuses ?? "the rest"}.`);
    }
  }
  if (scene === "gates") {
    if (facts.doorOpen === false && facts.doorReason === "missing-key") lines.push("The door stays locked. The key is not on you.");
    else if (facts.doorOpen === false && facts.doorReason != null) lines.push("The door stays locked. Nothing you wear can turn a key.");
    if (facts.keybell === "missing") lines.push("The bell names the missing key. The lock does not care.");
    if (facts.keybell === "silent") lines.push("The key is pocketed, so the bell stays quiet. The door still waits.");
    if (facts.seamOpen === true) {
      lines.push(facts.seamReason === "opened-quietly" ? "The seam opens, quietly." : "The seam opens.");
    } else if (facts.seamOpen === false && facts.seamReason === "cheek-blocks-square") {
      lines.push("The cheek refuses this square seam until it comes off.");
    } else if (facts.seamOpen === false && facts.seamReason === "needs-wedge-tool") {
      lines.push("There is no wedge tool to seat in the seam.");
    }
    if (facts.darknessRevealed === true) {
      const mode = String(facts.revealMode ?? "lit").replaceAll("-", " ");
      lines.push(`The dark gives way: ${mode}.`);
    } else if (facts.darknessRevealed === false && (facts.revealMode === "none" || facts.revealDenied)) {
      lines.push("The dark stays dark. A body of light is not a lantern.");
    }
    if (facts.stake === "planted") lines.push("The lantern is planted. The light stays with the stake.");
    if (facts.stake === "removed") lines.push("The lantern leaves the stake, and the light leaves with it.");
  }
  return lines;
}

const LABELS: Record<string, string> = {
  counterConverted: "Counter",
  counterWindowMs: "Window",
  faultLength: "Fault length",
  faultDir: "Fault direction",
  faultTaped: "Taped",
  homingCut: "Homing stripped",
  slung: "Slung",
  stored: "Stored",
  storeRefused: "Refused",
  released: "Released",
  releaseVector: "Release",
  releaseMode: "Release manner",
  rewound: "Rewound",
  glazeStick: "Glaze",
  crateResponse: "Crate",
  slideUnits: "Slide",
  grainSource: "Grain from",
  knot: "Knot",
  markLegal: "Mark",
  markReason: "Mark reason",
  caughtTags: "Caught",
  forkCatches: "Fork takes",
  forkRefuses: "Fork refuses",
  netMouth: "Net mouth",
  doorOpen: "Door",
  doorReason: "Door reason",
  keybell: "Keybell",
  seamOpen: "Seam",
  seamReason: "Seam reason",
  darknessRevealed: "Dark",
  revealMode: "Light",
  stake: "Stake",
};

export function factLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function factValue(key: string, value: FactValue): string {
  if (key === "counterConverted") return value === true ? "opens stone" : "misses";
  if (key === "doorOpen") return value === true ? "open" : "stays shut";
  if (key === "seamOpen") return value === true ? "opens" : "shut";
  if (key === "darknessRevealed") return value === true ? "gives way" : "stays dark";
  if (key === "markLegal") return value === true ? "accepted" : "refused";
  if (key === "doorReason") return value === "missing-key" ? "key missing" : "equipment cannot turn it";
  if (key === "seamReason") {
    if (value === "cheek-blocks-square") return "cheek blocks the square";
    if (value === "needs-wedge-tool") return "needs the wedge tool";
    if (value === "opened-quietly") return "opened quietly";
    return String(value);
  }
  if (value === true) return "yes";
  if (value === false) return "no";
  return String(value);
}
