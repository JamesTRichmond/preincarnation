/**
 * The entire query expansion for inventory search.
 * Phrases and tokens below are local data. Nothing here calls a model or a network.
 */

export type PhraseRule = {
  phrase: string;
  /** Canonical effect tags. Indexed as `effect:<tag>`. */
  tags: string[];
};

/** Longest phrases are tried first by the query planner. */
export const PHRASE_SYNONYMS: PhraseRule[] = [
  { phrase: "things that give light", tags: ["light"] },
  { phrase: "thing that gives light", tags: ["light"] },
  { phrase: "things which give light", tags: ["light"] },
  { phrase: "choses qui eclairent", tags: ["light"] },
  { phrase: "choses qui éclairent", tags: ["light"] },
  { phrase: "sources of light", tags: ["light"] },
  { phrase: "source of light", tags: ["light"] },
  { phrase: "light source", tags: ["light"] },
  { phrase: "gives light", tags: ["light"] },
  { phrase: "give light", tags: ["light"] },
  { phrase: "makes light", tags: ["light"] },
  { phrase: "qui eclaire", tags: ["light"] },
  { phrase: "qui éclaire", tags: ["light"] },
];

/**
 * Free-text token → tokens that satisfy the clause.
 * Effect tags are included only where the phrase or the word really means that effect.
 */
export const TOKEN_SYNONYMS: Record<string, string[]> = {
  light: ["light", "illumination", "glow"],
  illumination: ["light", "illumination", "glow"],
  glow: ["light", "illumination", "glow"],
  lamp: ["lamp", "lantern", "lampe"],
  lantern: ["lamp", "lantern", "lampe"],
  lampe: ["lamp", "lantern", "lampe"],
  huile: ["oil", "huile"],
  oil: ["oil", "huile"],
  torch: ["torch"],
  candle: ["candle"],
  dig: ["dig", "excavate", "till"],
  excavate: ["dig", "excavate"],
  shovel: ["shovel", "pelle", "dig"],
  pelle: ["shovel", "pelle", "dig"],
  smash: ["smash", "hammer", "marteau"],
  hammer: ["hammer", "marteau", "smash"],
  marteau: ["hammer", "marteau", "smash"],
  swim: ["swim", "fins", "flippers"],
  bow: ["bow", "arc", "draw"],
  arc: ["bow", "arc"],
  arrow: ["arrow", "arrows", "fleche", "fleches"],
  arrows: ["arrow", "arrows", "fleche", "fleches"],
  fleches: ["arrow", "arrows", "fleche", "fleches"],
  bomb: ["bomb", "bombs", "powder", "keg"],
  bombs: ["bomb", "bombs", "powder", "keg"],
  powder: ["powder", "poudre", "bomb"],
  poudre: ["powder", "poudre", "bomb"],
  syrup: ["syrup", "sirop", "maple", "erable"],
  sirop: ["syrup", "sirop", "maple"],
  music: ["music", "device", "ipod", "play"],
  return: ["return", "mirror", "glass", "home"],
  phase: ["phase", "cape", "shadow"],
  reserved: ["reserved"],
  equipped: ["equipped"],
};

export const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "that",
  "of",
  "de",
  "du",
  "la",
  "le",
  "les",
  "des",
  "et",
  "and",
  "or",
  "in",
  "on",
  "to",
  "for",
  "with",
  "your",
  "you",
  "qui",
  "une",
  "un",
]);
