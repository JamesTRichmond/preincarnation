import { initialState } from "./engine.ts";
import { allUnderstood } from "./lessons.ts";
import { Player } from "./sim.ts";
import type { State } from "./types.ts";
import { AT, BRIARS, RIVER, VEIN } from "./world.ts";

/**
 * A curious first walk. Still optimal between stops — a person who is not
 * searching. The estimate layer widens it; this function does not pretend
 * to be a clock.
 */
export function runAttentive(from = initialState()): Player {
  const p = new Player(from);
  p.walk("ruts");
  p.verb("look-ruts");
  p.walk("milepost");
  p.verb("read-milepost");
  p.verb("look-hands");
  p.verb("look-coat");
  p.verb("look-parcel");
  p.walk("epitaph-a");
  p.verb("read-epitaph-a");
  p.walk("epitaph-b");
  p.verb("read-epitaph-b");
  p.walk("window");
  p.verb("look-window");
  p.walk("ione");
  p.say("talk-ione");
  p.walk("table");
  p.verb("look-table");
  p.verb("leave-parcel");
  p.walk("peg");
  p.verb("look-peg");
  p.walk("cupboard");
  p.verb("take-salve-house");
  p.walk("bench");
  p.verb("look-bench");
  p.walk("hearth");
  p.verb("rest-hearth");
  p.walk("ledger");
  p.verb("read-ledger");
  p.verb("notch-ledger");
  p.walk("hart");
  p.say("talk-hart");
  p.walk("scrap");
  p.verb("read-scrap");
  p.walk("nail");
  p.verb("take-hammer");
  p.walk("block");
  p.verb("feel-yard");
  p.walk("ring");
  p.verb("look-ring");
  p.walk("river-bank");
  p.verb("rest-river");
  p.walk("gate");
  p.verb("use-salve");
  p.verb("draw-blade");
  p.verb("cut-root");
  p.walk("mallet");
  p.verb("look-mallet");
  p.walk("drop-lip");
  p.verb("look-drop");
  p.walk("seam");
  p.verb("feel-vein");
  p.verb("equip-hammer");
  p.verb("strike-face-vein");
  p.walk("sill");
  p.verb("take-salve-inn");
  p.verb("use-salve");
  p.walk("seam");
  p.verb("strike-thread-vein");
  p.walk("impression");
  p.verb("look-impression");
  p.verb("stand-impression");
  p.walk("pinch-lip");
  p.verb("look-pinch");
  p.to("vein", VEIN.pinch.x, VEIN.pinch.y, true);
  p.walk("shore-stone");
  p.verb("look-shore-stone");
  p.verb("remain");
  p.act({ type: "wait", seconds: 6 });
  p.walk("pale-water");
  p.verb("look-water");
  p.verb("release");
  p.walk("ruts");
  p.verb("look-ruts");
  p.walk("milepost");
  p.verb("read-milepost");
  p.verb("look-coat");
  p.verb("look-hands");
  p.walk("window");
  p.verb("look-window");
  p.walk("ione");
  p.say("talk-ione");
  p.walk("table");
  p.verb("look-table");
  p.walk("ledger");
  p.verb("read-ledger");
  p.walk("wayside");
  p.verb("read-stone");
  p.walk("seam");
  p.verb("look-seam");
  p.walk("gate");
  p.verb("look-gate");
  p.walk("edge");
  p.act({ type: "move", dir: "e" }, { allowBump: true });
  if (!allUnderstood(p.state)) {
    throw new Error("attentive unfinished");
  }
  return p;
}

/** Knows the verbs already. No idle, no wrong tool, no second tour. */
export function runDirect(from = initialState()): Player {
  const p = new Player(from);
  p.verb("look-ruts");
  p.verb("look-hands");
  p.verb("look-parcel");
  p.walk("milepost");
  p.verb("read-milepost");
  p.walk("ione");
  p.verb("leave-parcel");
  p.walk("cupboard");
  p.verb("take-salve-house");
  p.walk("hearth");
  p.verb("rest-hearth");
  p.walk("ledger");
  p.verb("notch-ledger");
  p.walk("nail");
  p.verb("take-hammer");
  p.walk("gate");
  p.verb("use-salve");
  p.verb("draw-blade");
  p.verb("cut-root");
  p.walk("seam");
  p.verb("feel-vein");
  p.verb("equip-hammer");
  p.verb("strike-thread-vein");
  p.walk("impression");
  p.verb("look-impression");
  p.to("vein", VEIN.pinch.x, VEIN.pinch.y, true);
  p.walk("pale-water");
  p.verb("release");
  p.verb("look-coat");
  p.walk("ruts");
  p.verb("look-ruts");
  p.walk("seam");
  p.verb("look-seam");
  return p;
}

/** Death on the ditch, then every teacher still available in the later county. */
export function runAfterEarlyDeath(): Player {
  const p = new Player(initialState());
  p.to("road", AT.ditch.x, AT.ditch.y, true);
  p.verb("remain");
  p.walk("pale-water");
  p.verb("release");
  p.verb("look-coat");
  p.walk("ruts");
  p.verb("look-ruts");
  p.walk("milepost");
  p.verb("read-milepost");
  p.walk("ione");
  p.say("talk-ione");
  p.walk("cupboard");
  p.verb("take-salve-house");
  p.walk("wayside");
  p.verb("notch-stone");
  p.walk("hearth");
  p.verb("rest-hearth");
  for (const b of BRIARS) {
    if (p.state.dead) break;
    if (p.state.vitality < 5 || p.state.bleed) break;
    p.to("road", b.x, b.y);
  }
  if (!(p.state.bleed || p.state.vitality < 5)) {
    p.to("road", AT.trailBriar.x, AT.trailBriar.y);
  }
  p.verb("use-salve");
  p.walk("nail");
  p.verb("take-hammer");
  p.walk("gate");
  p.verb("draw-blade");
  p.verb("cut-root");
  p.walk("seam");
  p.verb("feel-vein");
  p.verb("equip-hammer");
  p.verb("strike-thread-vein");
  p.walk("impression");
  p.verb("stand-impression");
  p.walk("ledger");
  p.verb("read-ledger");
  return p;
}

export function drown(state: State): Player {
  const p = new Player(state);
  p.to("river", RIVER.deep.x, RIVER.deep.y, true);
  return p;
}
