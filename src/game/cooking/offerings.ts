import type { KitchenState, Stack } from "./types.ts";

export type Offering = {
  id: string;
  place: string;
  line: string;
  items: Stack[];
};

/** Neighbor gifts, not a shop and not a crafting loop. One bundle each stretch of road. */
export const OFFERINGS: Offering[] = [
  {
    id: "shoreham-row",
    place: "Shoreham row",
    line: "Ada left a split basket by the step.",
    items: [
      { id: "apple", count: 2 },
      { id: "pear", count: 1 },
    ],
  },
  {
    id: "sugarbush",
    place: "The sugarbush",
    line: "Harlan sent a small pail and a paper of sugar.",
    items: [
      { id: "maple-syrup", count: 1 },
      { id: "maple-sugar", count: 1 },
    ],
  },
  {
    id: "ferry-paper",
    place: "Larrabee's Point",
    line: "Maris dropped a wet paper of fish.",
    items: [
      { id: "lake-perch", count: 1 },
      { id: "smelt", count: 1 },
    ],
  },
  {
    id: "cellar-stair",
    place: "The cellar stair",
    line: "Someone brought up what the cellar could spare.",
    items: [
      { id: "potato", count: 2 },
      { id: "onion", count: 1 },
      { id: "cabbage", count: 1 },
    ],
  },
  {
    id: "dairy-step",
    place: "The dairy step",
    line: "This morning's pail, and butter in paper.",
    items: [
      { id: "milk", count: 1 },
      { id: "butter", count: 1 },
    ],
  },
  {
    id: "creamery",
    place: "Luce Fenn's creamery",
    line: "Whey, and a soft cheese she will not let you call a product.",
    items: [
      { id: "whey", count: 2 },
      { id: "farmer-cheese", count: 1 },
    ],
  },
  {
    id: "creek",
    place: "Otter Creek",
    line: "A trout from the shaded bend, and thyme from the bank.",
    items: [
      { id: "brook-trout", count: 1 },
      { id: "thyme", count: 1 },
    ],
  },
  {
    id: "press-barn",
    place: "The press barn",
    line: "Cloudy cider and a sour pickle from the grange barrel.",
    items: [
      { id: "cider", count: 1 },
      { id: "sour-pickle", count: 1 },
    ],
  },
  {
    id: "woods",
    place: "The damp woods",
    line: "A short season: ramps, a morel, young greens.",
    items: [
      { id: "ramps", count: 1 },
      { id: "morel", count: 1 },
      { id: "dandelion", count: 1 },
    ],
  },
  {
    id: "bog-road",
    place: "The bog road",
    line: "Cranberries, and squash from a porch that had extra.",
    items: [
      { id: "cranberry", count: 2 },
      { id: "squash", count: 1 },
    ],
  },
  {
    id: "pasture",
    place: "The high pasture",
    line: "Blueberries, flint corn, and a little flour from the mill.",
    items: [
      { id: "blueberry", count: 2 },
      { id: "flint-corn", count: 1 },
      { id: "wheat-flour", count: 1 },
    ],
  },
  {
    id: "sill-jar",
    place: "The kitchen sill",
    line: "A jar with no label. Still sap, and water that doesn't ripple.",
    items: [
      { id: "still-sap", count: 1 },
      { id: "hollow-water", count: 1 },
    ],
  },
  {
    id: "wrong-field",
    place: "The field that flowers wrong",
    line: "Copper pollen on a leaf, reed ash in a twist of paper, a pinch of vein salt.",
    items: [
      { id: "copper-pollen", count: 1 },
      { id: "reed-ash", count: 1 },
      { id: "vein-salt", count: 1 },
    ],
  },
  {
    id: "night-row",
    place: "The orchard after dark",
    line: "A night apple, a crabapple, and a cup of echo cream. Ione left them without a note.",
    items: [
      { id: "night-apple", count: 1 },
      { id: "crabapple", count: 1 },
      { id: "echo-cream", count: 1 },
    ],
  },
];

export function currentOffering(state: KitchenState): Offering {
  const index = Math.floor(state.minute / 20) + (state.life - 1);
  return OFFERINGS[((index % OFFERINGS.length) + OFFERINGS.length) % OFFERINGS.length];
}

export function offeringReady(state: KitchenState): boolean {
  return state.offeringTakenAt < 0 || state.minute - state.offeringTakenAt >= 20;
}
