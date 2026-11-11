import type { Convo, Line, State } from "./types.ts";

/**
 * Spoken lines only. Ellis does not talk. Nothing here names a control
 * or scolds anyone for leaving.
 */
export const CONVOS: Record<string, Convo> = {
  "ione-threat": {
    id: "ione-threat",
    lines: [
      {
        speaker: "Ione Pell",
        text: "Put that away. I will not talk to a knife.",
      },
    ],
  },
  "ione-arrival": {
    id: "ione-arrival",
    lines: [
      {
        speaker: "Ione Pell",
        text: "You're wet from the road. If that parcel is mine, the table will take it.",
      },
      {
        speaker: "Ione Pell",
        text: "I already have one.",
      },
      {
        speaker: "Ione Pell",
        text: "It came fourteen years ago. Same hand. Same twine.",
        mark: "claim",
      },
      {
        speaker: "Ione Pell",
        text: "The paper said a second would come in a living hand, and that I would think it was the first.",
      },
      {
        speaker: "Ione Pell",
        text: "I didn't open mine. You can leave yours, or keep walking. I am not a gate.",
      },
    ],
  },
  "ione-pattern": {
    id: "ione-pattern",
    lines: [
      {
        speaker: "Ione Pell",
        text: "You opened yours. The paper was already telling the truth about a second one.",
      },
      {
        speaker: "Ione Pell",
        text: "I still have not opened mine. The table will take it if you want it out of your hand.",
      },
    ],
  },
  "ione-altered-threatened": {
    id: "ione-altered-threatened",
    lines: [
      {
        speaker: "Ione Pell",
        text: "The knife was yesterday, for me. The calendar says fourteen years.",
        mark: "altered-year",
      },
      {
        speaker: "Ione Pell",
        text: "Don't show it to me. The table is still what it was.",
      },
    ],
  },
  "ione-altered-delivered": {
    id: "ione-altered-delivered",
    lines: [
      {
        speaker: "Ione Pell",
        text: "You left the parcel. Then you left the year.",
      },
      {
        speaker: "Ione Pell",
        text: "That was fourteen years ago. You are wearing a coat I have only seen drawn.",
        mark: "altered-year",
      },
    ],
  },
  "ione-altered-carrying": {
    id: "ione-altered-carrying",
    lines: [
      {
        speaker: "Ione Pell",
        text: "You still have it in your hand. I kept the first.",
      },
      {
        speaker: "Ione Pell",
        text: "I thought the second had missed the year. It has been fourteen.",
        mark: "altered-year",
      },
    ],
  },
  "ione-altered-stranger": {
    id: "ione-altered-stranger",
    lines: [
      {
        speaker: "Ione Pell",
        text: "I don't know your face.",
      },
      {
        speaker: "Ione Pell",
        text: "The coat, I know. It was drawn in a parcel I never opened. Fourteen years back.",
        mark: "altered-year",
      },
    ],
  },
  "hart-arrival": {
    id: "hart-arrival",
    lines: [
      {
        speaker: "Hart Soll",
        text: "Hammer's on the nail, if the vein is where you're pointed.",
      },
      {
        speaker: "Hart Soll",
        text: "An edge is for cord and root. Hit the thread, if you hit anything. The face remembers the wrong tool.",
      },
    ],
  },
  "hart-holding": {
    id: "hart-holding",
    lines: [
      {
        speaker: "Hart Soll",
        text: "Then you already have the weight. I won't add a speech to it.",
      },
    ],
  },
  "hart-altered": {
    id: "hart-altered",
    lines: [
      {
        speaker: "Hart Soll",
        text: "Fourteen years. Whatever you did to the block, it kept.",
        mark: "altered-year",
      },
    ],
  },
};

export function convo(id: string): Convo {
  const c = CONVOS[id];
  if (!c) throw new Error("missing convo " + id);
  return c;
}

export function ioneOrder(state: State): string[] {
  if (state.era === "altered") {
    if (state.flags.threatened) return ["ione-altered-threatened"];
    if (state.flags.delivered) return ["ione-altered-delivered"];
    if (state.inventory.includes("parcel")) return ["ione-altered-carrying"];
    return ["ione-altered-stranger"];
  }
  if (state.equipped === "blade") {
    const heard = state.talkProgress["ione-threat"] ?? 0;
    if (heard < convo("ione-threat").lines.length) return ["ione-threat"];
    return [];
  }
  const order = ["ione-arrival"];
  if (state.flags.patternRead) order.push("ione-pattern");
  return order;
}

export function hartOrder(state: State): string[] {
  if (state.era === "altered") return ["hart-altered"];
  const arrivalHeard = state.talkProgress["hart-arrival"] ?? 0;
  if (state.flags.hammerTaken && arrivalHeard === 0) return ["hart-holding"];
  return ["hart-arrival"];
}

export function nextConvo(state: State, who: "ione" | "hart"): Convo | null {
  const ids = who === "ione" ? ioneOrder(state) : hartOrder(state);
  for (const id of ids) {
    const c = convo(id);
    const p = state.talkProgress[id] ?? 0;
    if (p < c.lines.length) return c;
  }
  return null;
}

export function residue(state: State, who: "ione" | "hart"): string {
  if (who === "hart") return "Hart nods at the nail and goes back to the dust.";
  if (state.era === "arrival" && state.equipped === "blade") {
    return "Ione will not speak to the knife.";
  }
  if (state.era === "altered") return "Ione has said what she will.";
  return "Ione lets the quiet stand.";
}

export function applyMark(line: Line, state: State): void {
  if (line.mark === "claim") state.flags.heardClaim = true;
  if (line.mark === "altered-year") state.flags.heardAlteredYear = true;
}

export function allSpokenLines(): { convo: string; index: number; speaker: string; text: string }[] {
  const out: { convo: string; index: number; speaker: string; text: string }[] = [];
  for (const c of Object.values(CONVOS)) {
    c.lines.forEach((line, index) => {
      out.push({ convo: c.id, index, speaker: line.speaker, text: line.text });
    });
  }
  return out;
}
