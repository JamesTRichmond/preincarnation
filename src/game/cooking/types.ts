/** Cooking types for PREINCARNATION. Effects are fictional game states, not nutrition. */

export type Theme =
  | "maple"
  | "orchard"
  | "dairy"
  | "field"
  | "waterside"
  | "vein"
  | "pantry";

export type Category = "simple" | "travel" | "festival" | "restorative" | "vein";

export type EffectSlot = "table" | "vein";

export type Station = "board" | "hearth" | "kettle" | "oven" | "cold";

export type CareAction =
  | "fold"
  | "rest"
  | "salt-late"
  | "high-heat-short"
  | "barely-warm"
  | "smoke-light";

export type Quality = "proper" | "rustic" | "salvage";

export type Ingredient = {
  id: string;
  name: string;
  theme: Theme;
  perishable: boolean;
  found: string;
};

export type Stack = { id: string; count: number };

export type Substitution = {
  replaces: string;
  with: string;
  /** At most 1. A substitute must never lengthen an effect. */
  durationScale: number;
  note: string;
};

export type EffectSpec = {
  id: string;
  slot: EffectSlot;
  name: string;
  fiction: string;
  /** Always 1. Application must not raise this. */
  magnitude: 1;
  durationMinutes: number;
  notFor: string;
  stacking: string;
};

export type Recipe = {
  id: string;
  name: string;
  category: Category;
  themes: Theme[];
  plate: string;
  ingredients: Stack[];
  substitutions: Substitution[];
  discovery: {
    kind: "starter" | "person" | "place" | "experiment" | "festival" | "memory";
    where: string;
    clue: string;
  };
  preparation: {
    station: Station;
    verb: string;
    steps: [string, string, string];
    care: CareAction;
    minutes: number;
  };
  feedback: {
    working: string;
    success: string;
    rustic: string;
    salvage: string;
  };
  outcome: {
    portions: number;
    keeps: string;
  };
  effect: EffectSpec;
  failure: {
    short: string;
    salvageName: string;
    salvageFiction: string;
  };
  voices: { who: string; line: string }[];
};

export type ActiveEffect = {
  effectId: string;
  slot: EffectSlot;
  name: string;
  fiction: string;
  magnitude: 1;
  startedAt: number;
  expiresAt: number;
  sourceDish: string;
  notFor: string;
};

export type PreparedDish = {
  uid: string;
  recipeId: string | null;
  name: string;
  quality: Quality;
  effect: EffectSpec;
  voice: string | null;
  note: string;
};

export type LogLine = { minute: number; text: string };

export type KitchenState = {
  version: number;
  life: number;
  minute: number;
  pantry: Record<string, number>;
  stoop: Record<string, number>;
  pot: Record<string, number>;
  satchel: PreparedDish[];
  known: string[];
  hints: Record<string, string>;
  reveals: Record<string, string[]>;
  effects: ActiveEffect[];
  station: Station;
  care: CareAction | null;
  intendedRecipeId: string | null;
  log: LogLine[];
  offeringTakenAt: number;
  deaths: number;
  seq: number;
  banner: string;
};

export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};
