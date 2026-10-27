import { applyMark, convo, nextConvo, residue } from "./dialogue.ts";
import { doRest, hurt, isWounded, release, writeExplicit, type Act } from "./effects.ts";
import type { Convo, ItemId, State, Verb } from "./types.ts";
import { AT, near, tileAt } from "./world.ts";

interface Spec {
  id: string;
  group: "place" | "hand";
  label: string | ((s: State) => string);
  when: (s: State) => boolean;
  run: (s: State, act: Act) => void;
}

function has(state: State, item: ItemId): boolean {
  return state.inventory.includes(item);
}

function count(state: State, item: ItemId): number {
  return state.inventory.filter((i) => i === item).length;
}

function add(state: State, item: ItemId): void {
  state.inventory.push(item);
}

function consume(state: State, item: ItemId): void {
  const i = state.inventory.indexOf(item);
  if (i >= 0) state.inventory.splice(i, 1);
}

function once(state: State, key: string): boolean {
  if (state.seen.includes(key)) return false;
  state.seen.push(key);
  return true;
}

function begin(state: State, c: Convo, act: Act): void {
  const idx = state.talkProgress[c.id] ?? 0;
  show(state, c, idx, act);
}

function show(state: State, c: Convo, idx: number, act: Act): void {
  const line = c.lines[idx];
  applyMark(line, state);
  state.talk = { id: c.id, index: idx };
  state.talkProgress[c.id] = idx + 1;
  act.speech = { convo: c.id, index: idx, speaker: line.speaker, text: line.text };
}

function seamOpen(state: State, which: "vein" | "yard"): boolean {
  return which === "vein" ? state.seam.veinOpen : state.seam.yardOpen;
}

function strikeThread(state: State, which: "vein" | "yard", act: Act): void {
  if (seamOpen(state, which)) {
    act.captions.push("The thread is already open.");
    return;
  }
  if (which === "vein") {
    state.seam.veinOpen = true;
    if (state.hammerSite === "none") state.hammerSite = "vein";
  } else {
    state.seam.yardOpen = true;
    if (state.hammerSite === "none") state.hammerSite = "yard";
  }
  state.flags.usedHammer = true;
  act.captions.push("The thread answers. The stone parts along the blow.");
  act.events.push("hammer:" + which);
}

function strikeFace(state: State, which: "vein" | "yard", act: Act): void {
  state.flags.usedHammer = true;
  state.dust = true;
  if (which === "vein") state.seam.veinDent = true;
  else state.seam.yardDent = true;
  const first = !state.hints.includes("wrong-tool");
  if (first) state.hints.push("wrong-tool");
  act.captions.push(first ? "The face dulls. It keeps the blow and does not open." : "Dust. The thread is still bright.");
  hurt(state, 1, false, "dust", act);
}

function cutFace(state: State, which: "vein" | "yard", act: Act): void {
  state.flags.cutSomething = true;
  const already = which === "vein" ? state.seam.veinScar : state.seam.yardScar;
  if (which === "vein") state.seam.veinScar = true;
  else state.seam.yardScar = true;
  if (!state.hints.includes("wrong-tool")) state.hints.push("wrong-tool");
  act.captions.push(already ? "The scar is already there." : "The face keeps the cut. It does not open.");
}

function lookSeam(state: State, which: "vein" | "yard", act: Act): void {
  const open = seamOpen(state, which);
  const scar = which === "vein" ? state.seam.veinScar : state.seam.yardScar;
  const dent = which === "vein" ? state.seam.veinDent : state.seam.yardDent;
  const bits: string[] = [];
  if (scar) bits.push("A blade-cut is in the face.");
  if (dent) bits.push("A dull dent where a hammer missed the thread.");
  if (open) bits.push("The stone is parted on the thread.");
  if (!bits.length) bits.push("Marble, and a thread paler than the face.");
  if (state.era === "altered" && scar) state.flags.observedScar = true;
  if (state.era === "altered" && open && which === "vein") state.flags.observedOpenVein = true;
  act.captions.push(bits.join(" "));
}

function edgeLine(state: State): string {
  return state.era === "altered"
    ? "The first mouth was the vein. Past this, the county is not this hour."
    : "Past this, the county continues. This hour does not.";
}

const SPECS: Spec[] = [
  {
    id: "talk-ione",
    group: "place",
    label: "Speak to Ione",
    when: (s) => near(s, "ione"),
    run: (s, act) => {
      const c = nextConvo(s, "ione");
      if (!c) {
        act.captions.push(residue(s, "ione"));
        return;
      }
      if (c.id === "ione-threat") s.flags.threatened = true;
      begin(s, c, act);
    },
  },
  {
    id: "leave-parcel",
    group: "place",
    label: "Leave the parcel",
    when: (s) => has(s, "parcel") && (near(s, "ione") || near(s, "table")),
    run: (s, act) => {
      consume(s, "parcel");
      s.flags.delivered = true;
      act.captions.push(s.flags.waxOpen ? "You set the opened parcel on the table." : "You set the parcel on the table.");
    },
  },
  {
    id: "show-pattern",
    group: "place",
    label: "Show the pattern",
    when: (s) => near(s, "ione") && s.flags.patternRead,
    run: (s, act) => {
      s.flags.showedPattern = true;
      act.captions.push("Ione looks at the measurements, not at your face.");
    },
  },
  {
    id: "level-blade",
    group: "place",
    label: "Level the blade",
    when: (s) => near(s, "ione") && s.equipped === "blade",
    run: (s, act) => {
      s.flags.threatened = true;
      s.flags.drewBlade = true;
      act.captions.push("Ione steps back until the table is between you.");
    },
  },
  {
    id: "look-table",
    group: "place",
    label: "Look at the table",
    when: (s) => near(s, "table"),
    run: (s, act) => {
      if (s.era === "altered") {
        s.flags.sawTableAltered = true;
        act.captions.push(
          s.flags.delivered
            ? "Both papers. The date is the same date. The dust is older."
            : "The old parcel only. The paper still expects a second.",
        );
        return;
      }
      s.flags.readProphecy = true;
      act.captions.push(
        "The twin of yours. Dust on the twine. Facing up: A second will come in your hand. You will think it is the first. The corner date is fourteen years back.",
      );
    },
  },
  {
    id: "look-peg",
    group: "place",
    label: "Look at the peg",
    when: (s) => near(s, "peg"),
    run: (s, act) => {
      if (s.era === "altered") {
        s.flags.observedCoat = true;
        act.captions.push("The peg is empty. The coat is on you.");
        return;
      }
      act.captions.push("An empty peg.");
    },
  },
  {
    id: "take-salve-house",
    group: "place",
    label: "Take the salve",
    when: (s) => near(s, "cupboard") && !s.seen.includes("took:cupboard"),
    run: (s, act) => {
      s.seen.push("took:cupboard");
      add(s, "salve");
      act.captions.push("A tin of salve. It smells of resin.");
    },
  },
  {
    id: "talk-hart",
    group: "place",
    label: "Speak to Hart",
    when: (s) => near(s, "hart"),
    run: (s, act) => {
      const c = nextConvo(s, "hart");
      if (!c) {
        act.captions.push(residue(s, "hart"));
        return;
      }
      begin(s, c, act);
    },
  },
  {
    id: "take-hammer",
    group: "place",
    label: "Take the hammer",
    when: (s) => !s.flags.hammerTaken && (near(s, "nail") || near(s, "vein-hammer")),
    run: (s, act) => {
      add(s, "hammer");
      s.equipped = "hammer";
      s.flags.hammerTaken = true;
      act.captions.push("The hammer is heavier than the blade, and duller.");
    },
  },
  {
    id: "look-nail",
    group: "place",
    label: "Look at the nail",
    when: (s) => s.flags.hammerTaken && near(s, "nail"),
    run: (_s, act) => act.captions.push("The nail is empty. You have the weight."),
  },
  {
    id: "look-vein-hammer",
    group: "place",
    label: "Look at the spare hammer",
    when: (s) => s.flags.hammerTaken && near(s, "vein-hammer"),
    run: (_s, act) => act.captions.push("Another hammer. Yours is enough."),
  },
  {
    id: "read-scrap",
    group: "place",
    label: "Read the card",
    when: (s) => near(s, "scrap"),
    run: (s, act) => {
      s.flags.scrapRead = true;
      act.captions.push("Pencil on a split card. Hit the thread, not the face. The face remembers the wrong tool.");
    },
  },
  {
    id: "look-block",
    group: "place",
    label: "Look at the block",
    when: (s) => near(s, "block"),
    run: (s, act) => lookSeam(s, "yard", act),
  },
  {
    id: "feel-yard",
    group: "place",
    label: "Feel the thread",
    when: (s) => near(s, "block"),
    run: (s, act) => {
      s.flags.feltYard = true;
      act.captions.push("A pale thread in the marble. The rest is only face.");
    },
  },
  {
    id: "strike-thread-yard",
    group: "place",
    label: "Strike the thread",
    when: (s) => near(s, "block") && s.equipped === "hammer",
    run: (s, act) => strikeThread(s, "yard", act),
  },
  {
    id: "strike-face-yard",
    group: "place",
    label: "Strike the face",
    when: (s) => near(s, "block") && s.equipped === "hammer",
    run: (s, act) => strikeFace(s, "yard", act),
  },
  {
    id: "cut-face-yard",
    group: "place",
    label: "Cut the face",
    when: (s) => near(s, "block") && s.equipped === "blade",
    run: (s, act) => cutFace(s, "yard", act),
  },
  {
    id: "look-seam",
    group: "place",
    label: "Look at the face",
    when: (s) => near(s, "seam"),
    run: (s, act) => lookSeam(s, "vein", act),
  },
  {
    id: "feel-vein",
    group: "place",
    label: "Feel the thread",
    when: (s) => near(s, "seam"),
    run: (s, act) => {
      s.flags.feltVein = true;
      act.captions.push("A pale thread in the marble. The rest is only face.");
    },
  },
  {
    id: "strike-thread-vein",
    group: "place",
    label: "Strike the thread",
    when: (s) => near(s, "seam") && s.equipped === "hammer",
    run: (s, act) => strikeThread(s, "vein", act),
  },
  {
    id: "strike-face-vein",
    group: "place",
    label: "Strike the face",
    when: (s) => near(s, "seam") && s.equipped === "hammer",
    run: (s, act) => strikeFace(s, "vein", act),
  },
  {
    id: "cut-face-vein",
    group: "place",
    label: "Cut the face",
    when: (s) => near(s, "seam") && s.equipped === "blade",
    run: (s, act) => cutFace(s, "vein", act),
  },
  {
    id: "look-impression",
    group: "place",
    label: "Look at the impression",
    when: (s) => near(s, "impression"),
    run: (s, act) => {
      s.flags.sawImpression = true;
      if (s.era === "altered") {
        s.flags.fitAltered = true;
        act.captions.push("A relief as shallow as breath. The coat in the stone is the one on you.");
        return;
      }
      act.captions.push("A relief as shallow as breath. A coat you have not worn. The hand turned out. No name.");
    },
  },
  {
    id: "stand-impression",
    group: "place",
    label: "Stand in the hollow",
    when: (s) => near(s, "impression"),
    run: (s, act) => {
      s.flags.stoodImpression = true;
      s.flags.sawImpression = true;
      if (s.era === "altered") {
        s.flags.fitAltered = true;
        act.captions.push("The hollow takes your shoulders. The coat matches, including the turn of the wrist.");
        return;
      }
      act.captions.push("The hollow takes your shoulders. The stone's coat does not match yours.");
    },
  },
  {
    id: "look-slab",
    group: "place",
    label: "Look at the slab",
    when: (s) => near(s, "slab"),
    run: (s, act) => {
      act.captions.push(s.flags.slabSafe ? "The wedge is holding. The slab has settled." : "A slab, not yet fallen. There is a gap at its heel.");
    },
  },
  {
    id: "wedge-slab",
    group: "place",
    label: "Wedge the slab",
    when: (s) => near(s, "slab") && !s.flags.slabSafe,
    run: (s, act) => {
      if (s.equipped !== "blade") {
        act.captions.push("Your hands find the gap and cannot fill it.");
        return;
      }
      s.flags.slabSafe = true;
      s.flags.cutSomething = true;
      act.captions.push("You wedge a splinter. The slab settles.");
    },
  },
  {
    id: "step-under",
    group: "place",
    label: "Step under the slab",
    when: (s) => near(s, "slab"),
    run: (s, act) => {
      if (s.flags.slabSafe) {
        act.captions.push("The slab does not come down.");
        return;
      }
      const died = hurt(s, 3, true, "slab", act);
      if (!died) act.captions.push("The slab kisses your shoulder and stops.");
    },
  },
  {
    id: "look-mallet",
    group: "place",
    label: "Look at the mallet",
    when: (s) => near(s, "mallet"),
    run: (s, act) => {
      s.flags.nicheSeen = true;
      act.captions.push("A mallet split through the head. It has been here longer than the dust on it.");
    },
  },
  {
    id: "look-pinch",
    group: "place",
    label: "Look into the cut",
    when: (s) => near(s, "pinch-lip"),
    run: (_s, act) => act.captions.push("The cut ahead does not hold air."),
  },
  {
    id: "look-drop",
    group: "place",
    label: "Look over the lip",
    when: (s) => near(s, "drop-lip"),
    run: (_s, act) => act.captions.push("Past the lip, the floor is gone."),
  },
  {
    id: "rest-ledge",
    group: "place",
    label: "Rest on the ledge",
    when: (s) => near(s, "ledge"),
    run: (s, act) => doRest(s, "ledge", "The stone is cold and it will do.", act),
  },
  {
    id: "read-milepost",
    group: "place",
    label: "Read the milepost",
    when: (s) => near(s, "milepost"),
    run: (s, act) => {
      if (s.era === "altered") {
        s.flags.readMilepostAltered = true;
        act.captions.push("MIDDLEBURY 1. A new year is cut into the soft side. It is fourteen past the one you walked in with.");
        return;
      }
      s.flags.readMilepost = true;
      act.captions.push("MIDDLEBURY 1. The cut of the year is worn off the post.");
    },
  },
  {
    id: "read-stone",
    group: "place",
    label: "Read the wayside stone",
    when: (s) => near(s, "wayside"),
    run: (s, act) => {
      if (s.era === "altered" && s.agedNotch) {
        s.flags.readOldNotch = true;
        act.captions.push("The old notch is still in the stone. It does not take you backward.");
        return;
      }
      if (s.explicitNotch?.reason === "stone") {
        act.captions.push("Your notch is a cut in the stone, not a sentence.");
        return;
      }
      act.captions.push("A stone for people who mean to come back to a place. It does not say how.");
    },
  },
  {
    id: "notch-stone",
    group: "place",
    label: "Notch the stone",
    when: (s) => near(s, "wayside"),
    run: (s, act) => writeExplicit(s, "stone", "You cut a notch in the wayside stone.", act),
  },
  {
    id: "look-ruts",
    group: "place",
    label: "Look at the ruts",
    when: (s) => near(s, "ruts"),
    run: (s, act) => {
      if (s.era === "altered") {
        s.flags.readRutsAltered = true;
        act.captions.push("The ruts have shifted. Same road. Not the same week.");
        return;
      }
      s.flags.readRuts = true;
      act.captions.push("Cart ruts, this week's rain.");
    },
  },
  {
    id: "look-gate",
    group: "place",
    label: "Look at the root",
    when: (s) => near(s, "gate"),
    run: (s, act) => {
      if (s.flags.rootCut) {
        if (s.era === "altered") s.flags.observedRoot = true;
        act.captions.push("The cut in the root has darkened. It did not grow back.");
        return;
      }
      act.captions.push("A root has taken the trail. Thicker than a hand.");
    },
  },
  {
    id: "cut-root",
    group: "place",
    label: "Cut the root",
    when: (s) => near(s, "gate") && !s.flags.rootCut && s.equipped === "blade",
    run: (s, act) => {
      s.flags.rootCut = true;
      s.flags.cutSomething = true;
      act.captions.push("The root gives. The trail is a trail again.");
    },
  },
  {
    id: "strike-root",
    group: "place",
    label: "Strike the root",
    when: (s) => near(s, "gate") && !s.flags.rootCut && s.equipped === "hammer",
    run: (s, act) => {
      s.flags.usedHammer = true;
      act.captions.push("The root bruises and holds.");
    },
  },
  {
    id: "climb-past",
    group: "place",
    label: "Climb past",
    when: (s) => near(s, "gate") && !s.flags.rootCut,
    run: (s, act) => {
      const gy = AT.gate.y;
      const landY = s.y < gy ? gy + 1 : gy - 1;
      s.x = AT.gate.x;
      s.y = landY;
      s.flags.everBled = true;
      const died = hurt(s, 1, true, "root", act);
      if (!died) act.captions.push("You go over. The root takes a little skin.");
    },
  },
  {
    id: "rest-bank",
    group: "place",
    label: "Rest on the bank",
    when: (s) => near(s, "bank"),
    run: (s, act) => doRest(s, "bank", "The grass is wet. It still holds you.", act),
  },
  {
    id: "look-window",
    group: "place",
    label: "Look in the glass",
    when: (s) => near(s, "window"),
    run: (s, act) => {
      if (s.era === "altered") {
        s.flags.sawWindowAltered = true;
        act.captions.push("The glass gives you a coat you did not walk in wearing.");
        return;
      }
      act.captions.push("Glass, and your own road-colored coat.");
    },
  },
  {
    id: "draw-water",
    group: "place",
    label: "Draw water",
    when: (s) => near(s, "well"),
    run: (s, act) => {
      if (!isWounded(s)) {
        act.captions.push("The water is cold. Nothing on you is asking for it.");
        return;
      }
      s.vitality = Math.min(5, s.vitality + 1);
      s.bleed = false;
      s.dust = false;
      s.flags.drank = true;
      act.captions.push("You drink. The dust and the scratch, if they were there, go quiet.");
    },
  },
  {
    id: "read-epitaph-a",
    group: "place",
    label: "Read the stone",
    when: (s) => near(s, "epitaph-a"),
    run: (_s, act) => act.captions.push("A. Pell. She measured thread."),
  },
  {
    id: "read-epitaph-b",
    group: "place",
    label: "Read the second stone",
    when: (s) => near(s, "epitaph-b"),
    run: (_s, act) => act.captions.push("No year on the second stone."),
  },
  {
    id: "look-edge",
    group: "place",
    label: "Look down the lane",
    when: (s) => near(s, "edge"),
    run: (s, act) => {
      const key = "edge:" + s.era;
      s.flags.leftEdge = true;
      if (once(s, key)) act.captions.push(edgeLine(s));
    },
  },
  {
    id: "rest-hearth",
    group: "place",
    label: "Rest at the hearth",
    when: (s) => near(s, "hearth"),
    run: (s, act) => doRest(s, "hearth", "The hearth does the work.", act),
  },
  {
    id: "read-ledger",
    group: "place",
    label: "Read the ledger",
    when: (s) => near(s, "ledger"),
    run: (s, act) => {
      s.flags.readLedger = true;
      if (s.era === "altered" && s.agedNotch) {
        s.flags.readOldNotch = true;
        s.flags.readStranger = true;
        act.captions.push("The notch you cut has browned. Under it, a hand that is not yours: the traveler with the parcel came back wrong.");
        return;
      }
      if (s.era === "altered") {
        s.flags.readStranger = true;
        act.captions.push("A line in a hand you do not know: a traveler with a parcel, fourteen years late, wearing a coat from a drawing.");
        return;
      }
      if (s.flags.explicitSave) {
        act.captions.push("Names and nights. Your notch is a cut in the margin, not a sentence.");
        return;
      }
      act.captions.push("Names, nights, what was owed. Nothing of yours yet.");
    },
  },
  {
    id: "notch-ledger",
    group: "place",
    label: "Notch the ledger",
    when: (s) => near(s, "ledger"),
    run: (s, act) => writeExplicit(s, "ledger", "You notch the margin. The book does not congratulate you.", act),
  },
  {
    id: "look-bench",
    group: "place",
    label: "Look at the bench",
    when: (s) => near(s, "bench"),
    run: (_s, act) => act.captions.push("Someone is asleep on the bench. They do not wake."),
  },
  {
    id: "take-salve-inn",
    group: "place",
    label: "Take the salve",
    when: (s) => near(s, "sill") && !s.seen.includes("took:sill"),
    run: (s, act) => {
      s.seen.push("took:sill");
      add(s, "salve");
      act.captions.push("A tin left on the sill. Resin, again.");
    },
  },
  {
    id: "rest-river",
    group: "place",
    label: "Rest on the bank",
    when: (s) => near(s, "river-bank"),
    run: (s, act) => doRest(s, "river", "You can stop here. The county will not chase you.", act),
  },
  {
    id: "look-ring",
    group: "place",
    label: "Look at the ring of stones",
    when: (s) => near(s, "ring"),
    run: (_s, act) => act.captions.push("Stones in a ring, for sitting. The river does not come up to them."),
  },
  {
    id: "release",
    group: "place",
    label: "Step into the water",
    when: (s) => s.dead && s.map === "shore" && (near(s, "pale-water") || tileAt(s, "shore", s.x, s.y) === ":"),
    run: (s, act) => release(s, act),
  },
  {
    id: "look-water",
    group: "place",
    label: "Look at the water",
    when: (s) => s.map === "shore" && (near(s, "pale-water") || tileAt(s, "shore", s.x, s.y) === ":"),
    run: (_s, act) => act.captions.push("Pale, and without a current you can see."),
  },
  {
    id: "look-shore-stone",
    group: "place",
    label: "Look at the stone",
    when: (s) => near(s, "shore-stone"),
    run: (_s, act) => act.captions.push("A stone with no inscription. Footprints hold in the grit, then go."),
  },
  {
    id: "remain",
    group: "place",
    label: "Remain",
    when: (s) => s.dead && s.map === "shore",
    run: (s, act) => {
      if (once(s, "remain")) act.captions.push("You stay. The water does not argue.");
      act.events.push("remain");
    },
  },
  {
    id: "look-hands",
    group: "hand",
    label: "Look at your hands",
    when: () => true,
    run: (s, act) => {
      s.flags.lookedHands = true;
      let text = "Dirt in the lines. The pack is stitched E. PERCH.";
      if (s.bleed) text += " The scratch is still open.";
      if (s.scarWrist) {
        text += " A pale line across the wrist that was not there when the pack was stitched.";
        if (s.era === "altered") s.flags.observedWrist = true;
      }
      act.captions.push(text);
    },
  },
  {
    id: "look-coat",
    group: "hand",
    label: "Look at your coat",
    when: () => true,
    run: (s, act) => {
      s.flags.lookedCoat = true;
      if (s.era === "altered") {
        s.flags.observedCoat = true;
        act.captions.push(
          s.flags.sawImpression
            ? "The collar is the one the marble was wearing. It fits the turn of your wrist."
            : "This coat was not on you on the road. The seams agree with you anyway.",
        );
        return;
      }
      act.captions.push("Road-colored, mended at the cuff. It is the one you walked in.");
    },
  },
  {
    id: "look-parcel",
    group: "hand",
    label: "Look at the parcel",
    when: (s) => has(s, "parcel"),
    run: (s, act) => {
      if (!s.flags.twineCut) {
        act.captions.push("Ione Pell, Middlebury. No sender. Twine, and a wax thumbprint. Your hands will not part it.");
        return;
      }
      if (!s.flags.waxOpen) {
        act.captions.push("The twine is cut. The wax is still a thumbprint.");
        return;
      }
      act.captions.push("The wax is broken. Inside, a coat measured on paper.");
    },
  },
  {
    id: "cut-twine",
    group: "hand",
    label: "Cut the twine",
    when: (s) => has(s, "parcel") && !s.flags.twineCut && s.equipped === "blade",
    run: (s, act) => {
      s.flags.twineCut = true;
      s.flags.cutSomething = true;
      act.captions.push("The twine gives.");
    },
  },
  {
    id: "open-wax",
    group: "hand",
    label: "Break the wax",
    when: (s) => has(s, "parcel") && s.flags.twineCut && !s.flags.waxOpen && s.equipped === "blade",
    run: (s, act) => {
      s.flags.waxOpen = true;
      s.flags.cutSomething = true;
      act.captions.push("The wax breaks clean.");
    },
  },
  {
    id: "read-pattern",
    group: "hand",
    label: "Read the pattern",
    when: (s) => has(s, "parcel") && s.flags.waxOpen,
    run: (s, act) => {
      s.flags.patternRead = true;
      act.captions.push("A coat, measured. Under it: For the return. Do not cut the thread.");
    },
  },
  {
    id: "use-salve",
    group: "hand",
    label: "Use the salve",
    when: (s) => count(s, "salve") > 0,
    run: (s, act) => {
      if (!isWounded(s)) {
        act.captions.push("Nothing is open. You keep the salve.");
        return;
      }
      consume(s, "salve");
      s.vitality = Math.min(5, s.vitality + 2);
      s.bleed = false;
      s.dust = false;
      s.flags.salveUsed = true;
      act.captions.push("The salve takes the hurt that was showing.");
    },
  },
  {
    id: "bind",
    group: "hand",
    label: "Bind the scratch",
    when: (s) => s.bleed && !s.flags.shirtTorn,
    run: (s, act) => {
      if (s.equipped !== "blade") {
        act.captions.push("The cuff will not tear in your hands.");
        return;
      }
      s.flags.shirtTorn = true;
      s.flags.bandaged = true;
      s.flags.usedCloth = true;
      s.flags.cutSomething = true;
      s.bleed = false;
      s.vitality = Math.min(5, s.vitality + 1);
      act.captions.push("You cut a strip from the cuff and bind the scratch.");
    },
  },
  {
    id: "draw-blade",
    group: "hand",
    label: "Draw the blade",
    when: (s) => has(s, "blade") && s.equipped !== "blade",
    run: (s, act) => {
      s.equipped = "blade";
      s.flags.drewBlade = true;
      act.events.push("drew");
    },
  },
  {
    id: "equip-hammer",
    group: "hand",
    label: "Take up the hammer",
    when: (s) => has(s, "hammer") && s.equipped !== "hammer",
    run: (s, _act) => {
      s.equipped = "hammer";
    },
  },
  {
    id: "lower",
    group: "hand",
    label: (s) => (s.equipped === "hammer" ? "Lower the hammer" : "Sheathe the blade"),
    when: (s) => s.equipped === "blade" || s.equipped === "hammer",
    run: (s, act) => {
      s.equipped = null;
      act.events.push("lower");
    },
  },
];

export function listVerbs(state: State): Verb[] {
  const out: Verb[] = [];
  for (const spec of SPECS) {
    if (!spec.when(state)) continue;
    out.push({
      id: spec.id,
      group: spec.group,
      label: typeof spec.label === "function" ? spec.label(state) : spec.label,
    });
  }
  return out;
}

export function runVerb(state: State, id: string, bucket: Act): void {
  const spec = SPECS.find((s) => s.id === id && s.when(state));
  if (!spec) {
    bucket.events.push("rejected:" + id);
    return;
  }
  if (state.talk) state.talk = null;
  spec.run(state, bucket);
  if (!state.verbLog.includes(id)) state.verbLog.push(id);
  bucket.events.push("verb:" + id);
}

export function primaryVerb(state: State): Verb | null {
  if (state.talk) return { id: "advance", label: "Continue", group: "place" };
  const verbs = listVerbs(state);
  return verbs.find((v) => v.group === "place" && !v.id.startsWith("look") && !v.id.startsWith("read")) ?? verbs.find((v) => v.group === "place") ?? verbs[0] ?? null;
}

export function edgeCaption(state: State): string {
  return edgeLine(state);
}

export function warnCaption(state: State, x: number, y: number): string | null {
  const t = tileAt(state, state.map, x, y);
  if (t !== "~" && t !== "x") return null;
  if (state.map === "vein" && t === "x") return "That cut does not hold air.";
  if (state.map === "vein") return "The floor ahead is gone.";
  if (state.map === "river") return "The river is over your head past the stones.";
  return "Dark water. It is over your head.";
}

export function advanceTalk(state: State, bucket: Act): void {
  if (!state.talk) {
    bucket.events.push("rejected:advance");
    return;
  }
  const c = convo(state.talk.id);
  const idx = state.talkProgress[c.id] ?? 0;
  if (idx >= c.lines.length) {
    state.talk = null;
    bucket.events.push("talk-end");
    return;
  }
  show(state, c, idx, bucket);
  bucket.events.push("advance");
}

export const VERB_IDS = SPECS.map((s) => s.id);

