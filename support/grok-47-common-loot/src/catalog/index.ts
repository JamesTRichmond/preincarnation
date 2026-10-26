import { abandonedItems } from "./abandoned.ts";
import { boatItems } from "./boat.ts";
import { farmItems } from "./farm.ts";
import { innItems } from "./inn.ts";
import { kitchenItems } from "./kitchen.ts";
import { orchardItems } from "./orchard.ts";
import { quarryItems } from "./quarry.ts";
import { schoolItems } from "./school.ts";
import { workshopItems } from "./workshop.ts";
import { RECIPES } from "../recipes.ts";
import { bindRecipes } from "../schema.ts";
import type { CatalogItem } from "../types.ts";

const authored: CatalogItem[] = [
  ...workshopItems,
  ...kitchenItems,
  ...farmItems,
  ...schoolItems,
  ...boatItems,
  ...quarryItems,
  ...innItems,
  ...orchardItems,
  ...abandonedItems,
];

export const CATALOG: CatalogItem[] = bindRecipes(
  [...authored].sort((a, b) => a.id.localeCompare(b.id)),
  RECIPES,
);

export const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function getItem(id: string): CatalogItem | undefined {
  return BY_ID.get(id);
}
