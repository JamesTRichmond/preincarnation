import type { CatalogItem, ExistingRecipe } from "./types.ts";

/**
 * REFERENCE FIXTURES.
 *
 * This workspace did not contain live PREINCARNATION recipe ids. Every id
 * below is a stand-in for the existing cooking, restoration, salvage, and
 * modification economy. The storage adapter consumes this catalog; it does
 * not invent a second recipe list or a second set of outputs.
 */
export const FIXTURE_CATALOG_NOTICE =
  "Reference fixtures — not live PREINCARNATION recipe ids. No shipped recipe catalog was present in this workspace.";

export const FIXTURE_LABEL =
  "Reference fixture — not a live PREINCARNATION recipe id";

export const FIXTURE_ITEMS: CatalogItem[] = [
  { id: "component.water", name: "Clean water", stackLimit: 20 },
  { id: "component.onion", name: "Onion", stackLimit: 20 },
  { id: "component.salt.sea", name: "Sea salt", stackLimit: 20 },
  { id: "component.salt.rock", name: "Rock salt", stackLimit: 20 },
  { id: "component.root", name: "Field root", stackLimit: 20 },
  { id: "component.bone", name: "Clean bone", stackLimit: 20 },
  { id: "component.oil", name: "Press oil", stackLimit: 10 },
  { id: "component.whetstone.grit", name: "Whetstone grit", stackLimit: 10 },
  { id: "component.leather.strip", name: "Leather strip", stackLimit: 20 },
  { id: "component.buckle", name: "Buckle", stackLimit: 20 },
  { id: "component.copper.scrap", name: "Copper scrap", stackLimit: 20 },
  { id: "component.rivet", name: "Copper rivet", stackLimit: 20 },
  { id: "component.fiber", name: "Fiber wad", stackLimit: 20 },
  { id: "component.cycle.a", name: "Cycle broth", stackLimit: 20 },
  { id: "component.cycle.b", name: "Cycle stock", stackLimit: 20 },
  { id: "component.cycle.self", name: "Self-broth", stackLimit: 20 },
  { id: "meal.broth.onion", name: "Onion broth", stackLimit: 10 },
  { id: "meal.stew.field", name: "Field stew", stackLimit: 10 },
  { id: "meal.salt.crust", name: "Salt crust", stackLimit: 10 },
  { id: "item.lantern.field", name: "Field lantern", stackLimit: 1 },
  { id: "item.lantern.field.strapped", name: "Strapped lantern", stackLimit: 1 },
  { id: "salvage.coil.burnt", name: "Burnt coil", stackLimit: 10 },
  { id: "unique.knife.family", name: "Family knife", stackLimit: 1 },
  { id: "unique.ladle.grandmother", name: "Grandmother's ladle", stackLimit: 1 },
  { id: "unique.ring.wedding", name: "Wedding ring", stackLimit: 1 },
  { id: "tool.pot", name: "Camp pot", stackLimit: 1 },
  { id: "tool.kit.restore", name: "Restoration kit", stackLimit: 1 },
];

const label = FIXTURE_LABEL;

export const FIXTURE_RECIPES: ExistingRecipe[] = [
  {
    id: "cook.onion-broth",
    station: "cooking",
    name: "Onion broth",
    fixture: true,
    fixtureLabel: label,
    toolItemId: "tool.pot",
    inputs: [
      { itemId: "component.water", qty: 1 },
      { itemId: "component.onion", qty: 1 },
    ],
    output: { itemId: "meal.broth.onion", qty: 1 },
  },
  {
    id: "cook.field-stew",
    station: "cooking",
    name: "Field stew",
    fixture: true,
    fixtureLabel: label,
    toolItemId: "tool.pot",
    inputs: [
      { itemId: "meal.broth.onion", qty: 1, allowNestedPrep: true },
      { itemId: "component.root", qty: 2 },
      {
        itemId: "component.salt.sea",
        qty: 1,
        substitutes: ["component.salt.rock"],
      },
    ],
    output: { itemId: "meal.stew.field", qty: 1 },
  },
  {
    id: "cook.salt-crust",
    station: "cooking",
    name: "Salt crust",
    fixture: true,
    fixtureLabel: label,
    inputs: [
      {
        itemId: "component.salt.sea",
        qty: 2,
        substitutes: ["component.salt.rock"],
      },
      { itemId: "component.oil", qty: 1 },
    ],
    output: { itemId: "meal.salt.crust", qty: 2 },
  },
  {
    id: "restore.family-knife",
    station: "restoration",
    name: "Restore family knife",
    fixture: true,
    fixtureLabel: label,
    toolItemId: "tool.kit.restore",
    restoresUniqueInput: true,
    inputs: [
      { itemId: "unique.knife.family", qty: 1, provenance: "unique" },
      { itemId: "component.oil", qty: 1 },
      { itemId: "component.whetstone.grit", qty: 1 },
    ],
    output: { itemId: "unique.knife.family", qty: 1 },
  },
  {
    id: "salvage.burnt-coil",
    station: "salvage",
    name: "Salvage burnt coil",
    fixture: true,
    fixtureLabel: label,
    inputs: [{ itemId: "salvage.coil.burnt", qty: 1 }],
    output: { itemId: "component.copper.scrap", qty: 2 },
  },
  {
    id: "modify.strap-lantern",
    station: "modification",
    name: "Strap the field lantern",
    fixture: true,
    fixtureLabel: label,
    inputs: [
      { itemId: "item.lantern.field", qty: 1 },
      { itemId: "component.leather.strip", qty: 2 },
      { itemId: "component.buckle", qty: 1 },
    ],
    output: { itemId: "item.lantern.field.strapped", qty: 1 },
  },
  {
    id: "modify.scrap-rivet",
    station: "modification",
    name: "Turn scrap into rivets",
    fixture: true,
    fixtureLabel: label,
    inputs: [{ itemId: "component.copper.scrap", qty: 2 }],
    output: { itemId: "component.rivet", qty: 1 },
  },
  {
    id: "cook.cycle-broth",
    station: "cooking",
    name: "Cycle broth",
    fixture: true,
    fixtureLabel: label,
    inputs: [{ itemId: "component.cycle.b", qty: 1, allowNestedPrep: true }],
    output: { itemId: "component.cycle.a", qty: 1 },
  },
  {
    id: "cook.cycle-stock",
    station: "cooking",
    name: "Cycle stock",
    fixture: true,
    fixtureLabel: label,
    inputs: [{ itemId: "component.cycle.a", qty: 1, allowNestedPrep: true }],
    output: { itemId: "component.cycle.b", qty: 1 },
  },
  {
    id: "cook.self-cycle",
    station: "cooking",
    name: "Self-broth",
    fixture: true,
    fixtureLabel: label,
    inputs: [{ itemId: "component.cycle.self", qty: 1, allowNestedPrep: true }],
    output: { itemId: "component.cycle.self", qty: 1 },
  },
];

const itemMap = new Map(FIXTURE_ITEMS.map((item) => [item.id, item]));
const recipeMap = new Map(FIXTURE_RECIPES.map((recipe) => [recipe.id, recipe]));

export function getItem(itemId: string): CatalogItem | undefined {
  return itemMap.get(itemId);
}

export function itemName(itemId: string): string {
  return itemMap.get(itemId)?.name ?? itemId;
}

export function stackLimit(itemId: string): number {
  return itemMap.get(itemId)?.stackLimit ?? 1;
}

export function getRecipe(recipeId: string): ExistingRecipe | undefined {
  return recipeMap.get(recipeId);
}

export function recipesForStation(station: ExistingRecipe["station"]): ExistingRecipe[] {
  return FIXTURE_RECIPES.filter((recipe) => recipe.station === station);
}

export function producersOf(itemId: string): ExistingRecipe[] {
  return FIXTURE_RECIPES.filter((recipe) => recipe.output.itemId === itemId).sort((a, b) =>
    a.id.localeCompare(b.id),
  );
}
