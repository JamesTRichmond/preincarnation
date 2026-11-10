import { RIVAL_IDS, type EraId, type RivalDef, type RivalEffect, type RivalId, type RivalState, type Stance } from "../types.ts";

export const BOND_MIN = -4;
export const BOND_MAX = 8;

/** Notes added when a flag is present. They are how a relationship stops being a static bio. */
export const FLAG_NOTES: Record<string, Partial<Record<EraId, string>>> = {
  "called-theo": {
    "first-turning": "He knows you saw the extra card. He has not decided if that was loyalty.",
    "the-return": "Because you caught the card in the first life, he introduces himself before the story can.",
  },
  "defended-sable": {
    "first-turning": "Sable heard you give the set back. She is waiting to see if you keep her name on it.",
    "the-return": "Sable remembers that you said her name in the room. She will still test whether you say it now.",
  },
  "accepted-sable-credit": {
    "first-turning": "Sable left her name on your chair. She has not taken the tune back. She has taken the warmth.",
    "the-return": "The miscredit started with a moment you allowed. Sable will mention it if you do not.",
  },
  "took-petes-wall": {
    "first-turning": "Pete has gone quiet in the specific way that means a wall will not be shown twice.",
    "the-return": "Pete's map has a gap where he used to trust you. He will walk with you. He will not confide a route.",
  },
  "honest-boil": {
    "first-turning": "Marigold has not praised you. She has set a second tin out, which is her praise.",
    "the-return": "Marigold tells the returned Ellis that the first tin was honest, and she does not let the cousins enlarge it.",
  },
  "darkened-syrup": {
    "first-turning": "Marigold will not put her name near that color.",
    "the-return": "The dark tin is the story Marigold corrects when descendants call it a winning boil.",
  },
  "agnes-saw-you-sit": {
    "first-turning": "Agnes has marked you as someone who would not do the thing.",
    "the-return": "Agnes remembers telling you to stay home. She is the one who brings it up, not you.",
  },
  "agnes-saw-the-lower-way": {
    "the-return": "Agnes counts you among the people who kept the bench in the gathering.",
  },
  "agnes-saw-you-perform": {
    "the-return": "Agnes thinks the hard way was for the story. She has little patience left for stories.",
  },
  "left-the-lynx": {
    "first-turning": "Inez shut the book on a good noun. That is as close as she comes to thanks.",
    "the-return": "Inez will ask you to repeat that you did not follow the lynx, because the parlor prefers a capture.",
  },
  "june-fire-named": {
    "the-return": "June heard you call it her fire. She fed you first after that, which is how she apologizes for needing the truth.",
  },
  "june-fire-prettied": {
    "the-return": "June heard the fire turned into weather. The orchard table has been cooler since.",
  },
  "supper-fish": {
    "first-turning": "Lenny is keeping a smaller version of the story in case you want supper again.",
    "the-return": "Lenny trusts you with the short story. He still flinches when someone asks him to stretch it.",
  },
  "glory-fish": {
    "first-turning": "Lenny gave you the wrong water and has not decided to be sorry.",
    "the-return": "Lenny assumes you still want a fish big enough to brag about, until you prove otherwise.",
  },
};

export function clampBond(n: number): number {
  return Math.max(BOND_MIN, Math.min(BOND_MAX, n));
}

export function stanceFor(bond: number): Stance {
  if (bond <= -3) return "rupture";
  if (bond <= -1) return "grievance";
  if (bond === 0) return "untested";
  if (bond <= 2) return "competing";
  if (bond <= 4) return "respect";
  return "tenderness";
}

export function initialRivalState(): RivalState {
  return { bond: 0, flags: [], lastLine: "" };
}

export function initialRivalMap(): Record<RivalId, RivalState> {
  const map = {} as Record<RivalId, RivalState>;
  for (const id of RIVAL_IDS) map[id] = initialRivalState();
  return map;
}

export function behaviorFor(rival: RivalDef, state: RivalState, era: EraId): string {
  const notes = state.flags
    .map((flag) => FLAG_NOTES[flag]?.[era])
    .filter((note): note is string => Boolean(note));
  return [rival.eras[era].behavior, ...notes].join(" ");
}

export function greetingFor(rival: RivalDef, state: RivalState, era: EraId): string {
  const base = rival.eras[era].greeting;
  if (rival.id === "theo-march" && era === "the-return" && state.flags.includes("called-theo")) {
    return `${base} He looks at you like a person who already knows, which is a mercy.`;
  }
  return base;
}

/** Agnes's stance on access is era law, not a reskin of the same taunt. */
export function agnesAccessEffect(era: EraId, useAccessible: boolean): RivalEffect | null {
  if (era === "first-turning" && useAccessible) {
    return {
      rivalId: "agnes-crowell",
      delta: -1,
      flag: "agnes-saw-you-sit",
      line: "Agnes says the easier way is a refusal dressed as manners.",
    };
  }
  if (era === "the-return" && useAccessible) {
    return {
      rivalId: "agnes-crowell",
      delta: 1,
      flag: "agnes-saw-the-lower-way",
      line: "Agnes taps the bench. She is glad the route includes a body that needs it.",
    };
  }
  if (era === "the-return" && !useAccessible) {
    return {
      rivalId: "agnes-crowell",
      delta: -1,
      flag: "agnes-saw-you-perform",
      line: "Agnes asks who the hard way was for. She does not accept 'for the story.'",
    };
  }
  return null;
}

export function applyEffectToState(state: RivalState, effect: RivalEffect): RivalState {
  const flags = new Set(state.flags);
  if (effect.flag) flags.add(effect.flag);
  return {
    bond: clampBond(state.bond + effect.delta),
    flags: [...flags],
    lastLine: effect.line || state.lastLine,
  };
}
