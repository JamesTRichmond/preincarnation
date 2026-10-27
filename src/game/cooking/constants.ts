import type { CareAction, Station } from "./types.ts";

export const SAVE_VERSION = 1;
export const SAVE_KEY = "preincarnation.cooking.v1";
export const SAVE_BACKUP_KEY = "preincarnation.cooking.v1.backup";

export const PER_STACK_CAP = 8;
export const PANTRY_TOTAL_CAP = 120;
export const STOOP_TOTAL_CAP = 24;
export const POT_CAP = 12;
export const SATCHEL_CAP = 4;
export const EFFECT_DURATION_HARD_CAP = 40;
export const SALVAGE_DURATION = 4;
export const LOG_CAP = 40;

export const EFFECTS_ARE_FICTION =
  "These plates leave a fictional impression on the road — a mood, a memory, a trick of the light. They are not nutrition, medicine, or dietary advice, and they do not change a fight, a wound, or a hunger clock. This game has no hunger clock.";

export const STACKING_TABLE =
  "One ordinary plate may be with you. Another ordinary plate waits in the satchel until the first leaves. Strength never stacks. Time never adds. Eating again early does nothing.";

export const STACKING_VEIN =
  "One Vein plate may ride beside at most one ordinary plate. A second Vein plate does not combine, lengthen, or deepen the first. Nothing in this seat becomes permanent, and it never crosses a death.";

export const STATIONS: { id: Station; label: string; detail: string }[] = [
  { id: "board", label: "Board", detail: "Cold work, a knife, no kettle." },
  { id: "hearth", label: "Hearth", detail: "A pan over the fire." },
  { id: "kettle", label: "Kettle", detail: "Something that wants to be wet and patient." },
  { id: "oven", label: "Oven", detail: "The grange oven, or the bread oven if the hall is shut." },
  { id: "cold", label: "Cold slab", detail: "Snow, shade, or the dairy stone." },
];

export const CARE_OPTIONS: { id: CareAction; label: string; detail: string }[] = [
  { id: "fold", label: "Fold", detail: "Turn it gently. Don't beat it." },
  { id: "rest", label: "Let it rest", detail: "Time does more than stirring." },
  { id: "salt-late", label: "Salt at the end", detail: "Season when the heat is leaving." },
  { id: "high-heat-short", label: "Hot and brief", detail: "A hard heat, then off." },
  { id: "barely-warm", label: "Barely warm", detail: "If it simmers in anger, you've lost it." },
  { id: "smoke-light", label: "A thread of smoke", detail: "Smoke it. Don't char it." },
];

export const CATEGORY_LABEL: Record<string, string> = {
  simple: "Simple meals",
  travel: "Travel food",
  festival: "Festival dishes",
  restorative: "Restorative plates",
  vein: "Vein-touched",
};
