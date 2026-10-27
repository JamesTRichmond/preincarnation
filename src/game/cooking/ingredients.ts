import type { Ingredient } from "./types.ts";

export const INGREDIENTS: Record<string, Ingredient> = {
  oats: { id: "oats", name: "oats", theme: "field", perishable: false, found: "A sack from the Weybridge loft." },
  "wheat-flour": { id: "wheat-flour", name: "wheat flour", theme: "field", perishable: false, found: "The mill on the creek." },
  "rye-loaf": { id: "rye-loaf", name: "rye loaf", theme: "field", perishable: true, found: "Baked before dawn at the grange." },
  cornmeal: { id: "cornmeal", name: "cornmeal", theme: "field", perishable: false, found: "Flint corn, ground coarse." },
  "flint-corn": { id: "flint-corn", name: "flint corn", theme: "field", perishable: true, found: "The last ears from a field above Shoreham." },
  "dry-beans": { id: "dry-beans", name: "dry beans", theme: "field", perishable: false, found: "A crock that outlasts the cook." },
  potato: { id: "potato", name: "potato", theme: "field", perishable: false, found: "The cellar, cool and dark." },
  onion: { id: "onion", name: "onion", theme: "field", perishable: false, found: "Braided on a nail by the door." },
  cabbage: { id: "cabbage", name: "cabbage", theme: "field", perishable: true, found: "A head from the fall row." },
  carrot: { id: "carrot", name: "carrot", theme: "field", perishable: false, found: "Sand-packed in the cellar bin." },
  squash: { id: "squash", name: "squash", theme: "field", perishable: false, found: "Curing on the porch boards." },
  beet: { id: "beet", name: "beet", theme: "field", perishable: false, found: "Dark and heavy from the garden." },
  apple: { id: "apple", name: "apple", theme: "orchard", perishable: true, found: "Ada Crowe's south row." },
  pear: { id: "pear", name: "pear", theme: "orchard", perishable: true, found: "The crooked pear by the stone wall." },
  crabapple: { id: "crabapple", name: "crabapple", theme: "orchard", perishable: true, found: "Wild trees along the Lemon Fair." },
  "dried-apple": { id: "dried-apple", name: "dried apple", theme: "orchard", perishable: false, found: "Strung over the stove last October." },
  blueberry: { id: "blueberry", name: "blueberry", theme: "field", perishable: true, found: "The high pasture, late July." },
  cranberry: { id: "cranberry", name: "cranberry", theme: "waterside", perishable: true, found: "A bog pocket off the shore road." },
  "orchard-honey": { id: "orchard-honey", name: "orchard honey", theme: "orchard", perishable: false, found: "Hives at the edge of the rows." },
  cider: { id: "cider", name: "cider", theme: "orchard", perishable: true, found: "Pressed at the orchard, still cloudy." },
  egg: { id: "egg", name: "egg", theme: "dairy", perishable: true, found: "The hens behind the kitchen." },
  butter: { id: "butter", name: "butter", theme: "dairy", perishable: true, found: "The dairy step, wrapped in paper." },
  milk: { id: "milk", name: "milk", theme: "dairy", perishable: true, found: "This morning's pail." },
  cream: { id: "cream", name: "cream", theme: "dairy", perishable: true, found: "Skimmed and set aside." },
  buttermilk: { id: "buttermilk", name: "buttermilk", theme: "dairy", perishable: true, found: "What the butter left behind." },
  whey: { id: "whey", name: "whey", theme: "dairy", perishable: true, found: "Luce Fenn's creamery step." },
  cheddar: { id: "cheddar", name: "cheddar", theme: "dairy", perishable: false, found: "A wheel that has already kept." },
  "farmer-cheese": { id: "farmer-cheese", name: "farmer cheese", theme: "dairy", perishable: true, found: "Soft, unsalted, made this week." },
  "maple-sap": { id: "maple-sap", name: "maple sap", theme: "maple", perishable: true, found: "Fresh from the bucket, barely sweet." },
  "maple-syrup": { id: "maple-syrup", name: "maple syrup", theme: "maple", perishable: false, found: "Harlan Peck's sugarbush." },
  "maple-sugar": { id: "maple-sugar", name: "maple sugar", theme: "maple", perishable: false, found: "Syrup stirred until it grains." },
  "maple-cream": { id: "maple-cream", name: "maple cream", theme: "maple", perishable: false, found: "A jar from the boil, spreadable." },
  "sugar-snow": { id: "sugar-snow", name: "clean snow", theme: "maple", perishable: true, found: "Packed clean, away from the road." },
  salt: { id: "salt", name: "salt", theme: "pantry", perishable: false, found: "The crock by the hearth." },
  "salt-pork": { id: "salt-pork", name: "salt pork", theme: "pantry", perishable: false, found: "Cured and hanging out of the sun." },
  "sour-pickle": { id: "sour-pickle", name: "sour pickle", theme: "pantry", perishable: false, found: "A barrel at the grange." },
  sage: { id: "sage", name: "sage", theme: "field", perishable: false, found: "Dried from the doorstep bed." },
  thyme: { id: "thyme", name: "thyme", theme: "field", perishable: false, found: "A jar of last summer." },
  dandelion: { id: "dandelion", name: "dandelion greens", theme: "field", perishable: true, found: "Young leaves, before the flowers shout." },
  fiddlehead: { id: "fiddlehead", name: "fiddlehead", theme: "waterside", perishable: true, found: "Coiled ferns along the creek, briefly." },
  morel: { id: "morel", name: "morel", theme: "field", perishable: true, found: "After rain, under the old apple." },
  ramps: { id: "ramps", name: "ramps", theme: "field", perishable: true, found: "The damp woods, a short season." },
  "lake-perch": { id: "lake-perch", name: "lake perch", theme: "waterside", perishable: true, found: "Champlain, in Maris Ell's paper." },
  "brook-trout": { id: "brook-trout", name: "brook trout", theme: "waterside", perishable: true, found: "A shaded bend of the creek." },
  smelt: { id: "smelt", name: "smelt", theme: "waterside", perishable: true, found: "The night run, when the ice lets go." },
  "vein-salt": { id: "vein-salt", name: "vein salt", theme: "vein", perishable: false, found: "A crust where the ground tastes of copper." },
  "copper-pollen": { id: "copper-pollen", name: "copper pollen", theme: "vein", perishable: false, found: "A field that flowers the wrong color." },
  "hollow-water": { id: "hollow-water", name: "hollow water", theme: "vein", perishable: true, found: "A spring that doesn't ripple." },
  "night-apple": { id: "night-apple", name: "night apple", theme: "vein", perishable: true, found: "An apple with no shadow at noon." },
  "echo-cream": { id: "echo-cream", name: "echo cream", theme: "vein", perishable: true, found: "Cream that keeps a sound in it." },
  "reed-ash": { id: "reed-ash", name: "reed ash", theme: "vein", perishable: false, found: "Ash from the reeds at Button Bay." },
  "still-sap": { id: "still-sap", name: "still sap", theme: "vein", perishable: true, found: "Sap that will not drip, and is not spoiled." },
};

export function ingredientName(id: string): string {
  return INGREDIENTS[id]?.name ?? id;
}

export function isPerishable(id: string): boolean {
  return INGREDIENTS[id]?.perishable ?? false;
}
