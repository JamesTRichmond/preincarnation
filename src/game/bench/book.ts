import { BASE_CATALOG, indexCatalog } from "./catalog.ts";
import { expandPairs, PAIRS } from "./pairs.ts";
import { specialRecipes } from "./specials.ts";
import type { CatalogEntry, Recipe } from "./types.ts";

const masses = new Map<string, number>();
for (const item of BASE_CATALOG) masses.set(item.id, item.mass);
for (const pair of PAIRS) {
  if (masses.has(pair.id)) throw new Error(`pair id collides with catalog: ${pair.id}`);
  masses.set(pair.id, pair.mass);
}

const expanded = expandPairs((id) => {
  const mass = masses.get(id);
  if (mass === undefined) throw new Error(`no mass for ${id}`);
  return mass;
});

export const catalog: CatalogEntry[] = [...BASE_CATALOG, ...expanded.items];
export const catalogById: Map<string, CatalogEntry> = indexCatalog(catalog);
export const recipes: Recipe[] = [...expanded.recipes, ...specialRecipes()];

const ids = new Set<string>();
for (const recipe of recipes) {
  if (ids.has(recipe.id)) throw new Error(`duplicate recipe ${recipe.id}`);
  ids.add(recipe.id);
}
