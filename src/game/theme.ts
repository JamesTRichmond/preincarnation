import { RELICS, type RelicId } from "./items.ts";

/** Acts that are not a relic but still move the one plot. */
export const LIFE_VERBS = ["walk", "speak", "die", "drink", "fold"] as const;

export type ThemeVerb = (typeof LIFE_VERBS)[number] | RelicId;

/** One person. The Marble Vein is the only plot. A line says what the act does to that plot. */
export const THEME_LINES: Record<ThemeVerb, string> = {
  walk: "You cross Addison County on your own feet. The Marble Vein does not come to you.",
  speak: "One voice answers. There is no party and no one to send.",
  die: "Death is a chapter of fourteen winters. You come back as yourself.",
  drink: "A county bite restores the body you already have. It is not a hunger economy.",
  fold: "The four rooms are Addison after the Vein goes quiet. They are not a second world, and they do not get new rooms.",
  sword: "The short iron sparks on cracked marble. It does not open the Vein.",
  shovel: "A grave is a year you already lived. Digging reads it. It does not mint a new plot.",
  hookshot: "The sugar-line crosses a gap. It is not a second road to the Vein.",
  boots: "The miles shorten. The county is still the only ground.",
  flippers: "Otter Creek takes you. The water is not a way around the marble.",
  lantern: "The quarry stays dark until the lamp is open. The hammer waits on that light.",
  hammer: "The hammer opens a true plug. A decoy face stays whole.",
  net: "The net catches what moves in the air. It does not catch the Vein.",
  mirror: "The glass walks you home. The shrine remembers the same person.",
  cape: "A few steps through what would stop you. The wall is still there when you finish.",
  cane: "A block spends your mana. It does not stand in for another pair of hands.",
  bow: "The ash bow reaches. It is still one shot from one person.",
  ipod: "The device plays other people's music. It is not a voice in the party.",
  bombs: "Powder opens a true vein. A decoy face stays shut.",
};

export function themeVerbs(): ThemeVerb[] {
  return [...LIFE_VERBS, ...RELICS.map((relic) => relic.id)];
}

export function missingThemeLines(verbs: readonly string[] = themeVerbs()): string[] {
  return verbs.filter((verb) => {
    const line = THEME_LINES[verb as ThemeVerb];
    return typeof line !== "string" || line.trim().length < 20;
  });
}

/** Named second plots. Recording them is not permission to build them. */
export const THEME_DISSONANCE = [
  {
    id: "heart-fate",
    line: "Release the universe and Bind it as a Crown are gone from the Heart. The test fails if either choice returns. The old sentences stay in the file so a life that already chose can still be read. Do not add rooms.",
  },
] as const;

