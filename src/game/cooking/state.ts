import { LOG_CAP, SAVE_VERSION } from "./constants.ts";
import { STARTER_RECIPE_IDS } from "./recipes.ts";
import type { KitchenState } from "./types.ts";

export const STARTING_PANTRY: Record<string, number> = {
  oats: 6,
  "maple-syrup": 4,
  milk: 4,
  "rye-loaf": 4,
  butter: 6,
  "orchard-honey": 2,
  potato: 4,
  onion: 4,
  cheddar: 4,
  apple: 4,
  cornmeal: 4,
  salt: 6,
  egg: 4,
  sage: 3,
  "lake-perch": 2,
  "dried-apple": 3,
  "maple-sugar": 3,
  "dry-beans": 4,
  "salt-pork": 2,
  cream: 2,
  buttermilk: 2,
  "wheat-flour": 2,
  cabbage: 2,
  carrot: 2,
  "still-sap": 1,
  "hollow-water": 1,
  "night-apple": 1,
  "echo-cream": 1,
};

export function say(state: KitchenState, text: string): KitchenState {
  return {
    ...state,
    banner: text,
    log: [{ minute: state.minute, text }, ...state.log].slice(0, LOG_CAP),
  };
}

export function createKitchen(): KitchenState {
  return say(
    {
      version: SAVE_VERSION,
      life: 1,
      minute: 0,
      pantry: { ...STARTING_PANTRY },
      stoop: {},
      pot: {},
      satchel: [],
      known: [...STARTER_RECIPE_IDS],
      hints: {},
      reveals: {},
      effects: [],
      station: "hearth",
      care: null,
      intendedRecipeId: STARTER_RECIPE_IDS[0] ?? null,
      log: [],
      offeringTakenAt: -1,
      deaths: 0,
      seq: 1,
      banner: "",
    },
    "The kettle is warm. Twelve cards are already in the book. Meals are for the road, not a rite before trouble.",
  );
}

export function nextDishId(state: KitchenState): { state: KitchenState; uid: string } {
  const uid = `d${state.seq}`;
  return { state: { ...state, seq: state.seq + 1 }, uid };
}
