import type { DialogueNode } from "./types.ts";

/** Optional county visits. They are not the Marble Vein and never close it. */

export type HeirloomPhase = "start" | "looked" | "spoken" | "closed" | "left";

export type HeirloomVisit = {
  id: string;
  npc: string;
  speaker: string;
  place: string;
  opening: string;
  look: string;
  ask: string;
  takeLabel: string;
  take: string;
  leave: string;
  later: string;
  done: string;
};

export const HEIRLOOM_VISITS: HeirloomVisit[] = [
  {
    id: "pell",
    npc: "june",
    speaker: "June Pell",
    place: "Pell dock, Ferrisburgh",
    opening:
      "You can stand on the dock. Don't tell me the lake missed you. Pell is a proposed name. The tide card, the split oarlock, the slip under glass, and the shim are one week. They are not the Vein.",
    look: "Grease pencil in the margin, carpenter's pencil over it, flood year in red. The slip stays under glass. The oarlock stays scarred. The shim only keeps the door.",
    ask: "I know that hand. The tide card is yours to use. I will not slide the slip out of the case.",
    takeLabel: "Take the tide card",
    take: "Tide card. Same card. The reading room keeps the slip. The road does not wait on it.",
    leave: "Leave it. A smaller outcome will still be here. The Vein does not close because you walked off a dock.",
    later: "The card, then. Nothing else. One week, not a trophy.",
    done: "You already have the card. The slip is still under glass.",
  },
  {
    id: "keeler",
    npc: "keeler",
    speaker: "Cal Keeler",
    place: "Keeler sugarhouse, Bristol",
    opening:
      "Ruth's gone. The arch is mine. Keeler is a proposed sugar family. The barked-in spile, the burned boil log, the sled-stave dipper, and the horse's bell are the fire. Not the Vein.",
    look: "Bark grew over your seating. I cut the tree after the ice. The dipper is mine. The bell stayed with the horse.",
    ask: "You seated a spile like someone who meant to come back. That's enough. I'm not Ruth.",
    takeLabel: "Take the spile",
    take: "The iron. Don't shine it. The dipper stays on the arch.",
    leave: "Walk on. The smaller thing will keep. A sugarhouse does not shut the county.",
    later: "The spile, and nothing polished. The horse's bell stays in the drawer.",
    done: "You have the spile. I still boil.",
  },
  {
    id: "ames",
    npc: "helen",
    speaker: "Helen Ames",
    place: "Ames print shop, Middlebury",
    opening:
      "I kept the slug because melting it felt like a job I didn't want. Ames is a proposed shop. If you reach for the slug, we are done. The stick is the tool. The slug is the death the town believed. Neither is the Vein.",
    look: "The stick is still at the broadside's measure. The knife bent locking that form. The slug stays unmelted on the stone.",
    ask: "You're Ellis. The stick was your hook. I set on a newer one. The slug is not a souvenir.",
    takeLabel: "Take the composing stick",
    take: "The stick. Don't make the shop a shrine. The slug stays.",
    leave: "Then leave the hook. You can still take the stick later. The press does not gate the pines.",
    later: "The stick, late. Same measure. The slug is still lead.",
    done: "You have the stick. I will not melt the slug for you.",
  },
  {
    id: "noyes",
    npc: "noyes",
    speaker: "Owen Noyes",
    place: "Noyes stone yard, Salisbury",
    opening:
      "I recut the date because the first one was wrong in the stone. Noyes is a proposed yard. The lath, the rubbing, the chisel, and the donated map are one mistake. They do not open the quarry.",
    look: "The lath is the temporary. The rubbing still shows the scar. The chisel is on the roll. The plot map stays in the clerk's drawer.",
    ask: "Take the lath if you die again. I will not cut you another. The map is already given.",
    takeLabel: "Take the grave lath",
    take: "One lath. The chisel comes back to the roll if you only came to feel it. The map stays donated.",
    leave: "The stone will be here. So will a smaller outcome. Salisbury is not the Vein.",
    later: "The original lath. I still will not cut a second.",
    done: "You have the lath. I don't cut temporaries twice.",
  },
  {
    id: "whitcomb",
    npc: "whitcomb",
    speaker: "Ada Whitcomb",
    place: "Whiting bell, spoken from Salisbury",
    opening:
      "The chip in the bell is still in Whiting. There is no road on this map for that loft, so I came down. Whitcomb is a proposed name. The rope stays hung. The glove is mine. The toll card is under glass.",
    look: "The splice runs. The dried wedge is the cause of the chip. The glove burned on my hand, not yours. The card has one name.",
    ask: "You were the name they tolled, not the hand on the rope. The dried wedge can leave. The rope cannot.",
    takeLabel: "Take the dried wedge",
    take: "The wedge. The rope stays in the loft. A bell does not finish the Vein.",
    leave: "Leave the wedge. You can still take it later. Whiting does not close the road.",
    later: "The dried wedge, and no second printing of the card.",
    done: "You have the wedge. I won't unhang the rope.",
  },
];

export function visitByNpc(npc: string): HeirloomVisit | undefined {
  return HEIRLOOM_VISITS.find((visit) => visit.npc === npc);
}

export function heirloomBlocksVein(): false {
  return false;
}

function phaseOf(phase: Record<string, HeirloomPhase>, id: string): HeirloomPhase {
  return phase[id] ?? "start";
}

function node(visit: HeirloomVisit, text: string, choices: DialogueNode["choices"]): DialogueNode {
  return { id: "heirloom-" + visit.id, speaker: visit.speaker, text, choices };
}

export function heirloomDialogue(
  phase: Record<string, HeirloomPhase>,
  held: string[],
  npc: string,
): DialogueNode | null {
  const visit = visitByNpc(npc);
  if (!visit) return null;
  const state = phaseOf(phase, visit.id);
  if (state === "closed" || held.includes(visit.id)) {
    return node(visit, visit.done, [{ label: "That's enough.", next: "end" }]);
  }
  if (state === "left") {
    return node(visit, visit.leave, [
      { label: "Take the smaller outcome", next: "heir:" + visit.id + ":later" },
      { label: "Not yet.", next: "end" },
    ]);
  }
  if (state === "spoken") {
    return node(visit, visit.ask, [
      { label: visit.takeLabel, next: "heir:" + visit.id + ":take" },
      { label: "Leave this for later", next: "heir:" + visit.id + ":leave" },
    ]);
  }
  if (state === "looked") {
    return node(visit, visit.look, [
      { label: "Ask " + visit.speaker.split(" ")[0], next: "heir:" + visit.id + ":ask" },
      { label: "Leave this for later", next: "heir:" + visit.id + ":leave" },
    ]);
  }
  return node(visit, visit.opening, [
    { label: "Look at what they kept", next: "heir:" + visit.id + ":look" },
    { label: "Leave this for later", next: "heir:" + visit.id + ":leave" },
  ]);
}

export function stepHeirloom(
  phase: Record<string, HeirloomPhase>,
  held: string[],
  token: string,
): { phase: Record<string, HeirloomPhase>; held: string[]; node: DialogueNode | null; deed: string } {
  const [id, action] = token.split(":");
  const visit = HEIRLOOM_VISITS.find((entry) => entry.id === id);
  const nextPhase = { ...phase };
  const nextHeld = held.filter((entry, index) => held.indexOf(entry) === index);
  if (!visit || (action !== "look" && action !== "ask" && action !== "take" && action !== "leave" && action !== "later")) {
    return { phase: nextPhase, held: nextHeld, node: null, deed: "" };
  }
  const state = phaseOf(nextPhase, visit.id);
  if (state === "closed" || nextHeld.includes(visit.id)) {
    return {
      phase: { ...nextPhase, [visit.id]: "closed" },
      held: nextHeld,
      node: node(visit, visit.done, [{ label: "That's enough.", next: "end" }]),
      deed: "",
    };
  }
  if (action === "look" && state === "start") {
    nextPhase[visit.id] = "looked";
    return {
      phase: nextPhase,
      held: nextHeld,
      node: heirloomDialogue(nextPhase, nextHeld, visit.npc),
      deed: "",
    };
  }
  if (action === "ask" && state === "looked") {
    nextPhase[visit.id] = "spoken";
    return {
      phase: nextPhase,
      held: nextHeld,
      node: heirloomDialogue(nextPhase, nextHeld, visit.npc),
      deed: "",
    };
  }
  if (action === "take" && state === "spoken") {
    nextPhase[visit.id] = "closed";
    nextHeld.push(visit.id);
    return {
      phase: nextPhase,
      held: nextHeld,
      node: node(visit, visit.take, [{ label: "That's enough.", next: "end" }]),
      deed: "You kept an ordinary thing from " + visit.place,
    };
  }
  if (action === "leave") {
    nextPhase[visit.id] = "left";
    return {
      phase: nextPhase,
      held: nextHeld,
      node: node(visit, visit.leave, [{ label: "Walk on.", next: "end" }]),
      deed: "",
    };
  }
  if (action === "later" && state === "left") {
    nextPhase[visit.id] = "closed";
    if (!nextHeld.includes(visit.id)) nextHeld.push(visit.id);
    return {
      phase: nextPhase,
      held: nextHeld,
      node: node(visit, visit.later, [{ label: "That's enough.", next: "end" }]),
      deed: "You came back for the smaller thing at " + visit.place,
    };
  }
  return { phase: nextPhase, held: nextHeld, node: heirloomDialogue(nextPhase, nextHeld, visit.npc), deed: "" };
}
