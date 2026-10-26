import type { CatalogItem, HandlerId, ItemInput, Params, UseDef } from "./types.ts";

export function defineUse(
  handler: HandlerId,
  label: string,
  line: string,
  params: Params,
  extra?: { min?: number; targetTag?: string; targetItemId?: string; needsConfirm?: boolean },
): Omit<UseDef, "id"> {
  return {
    handler,
    label,
    line,
    params,
    minCondition: extra?.min,
    targetTag: extra?.targetTag,
    targetItemId: extra?.targetItemId,
    needsConfirm: extra?.needsConfirm,
  };
}

export function lootId(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 240) {
    throw new Error(`loot id ${n} is outside the reserved range 001–240`);
  }
  return `loot.common.${String(n).padStart(3, "0")}`;
}

const BASE_ACTIONS = ["action.use", "action.dismantle", "action.trade", "action.display"];

export function item(input: ItemInput): CatalogItem {
  const id = lootId(input.n);
  const uses: UseDef[] = input.uses.map((use, index) => ({
    ...use,
    id: `${id}.use.${index + 1}`,
  }));
  if (uses.length < 2) {
    throw new Error(`${id} needs two uses`);
  }
  const actionRefs = [...BASE_ACTIONS];
  if (input.restore.possible) actionRefs.push("action.service");
  return {
    id,
    name: input.name,
    appearance: input.appearance,
    source: { place: input.place, site: input.site, found: input.found },
    stack: input.stack,
    stackQty: input.stack === "unique" ? 1 : input.stackQty,
    condition: { default: input.condition, wearsFrom: input.wears },
    value: { barterInKind: input.barter, worthRank: input.rank, currency: null },
    uses,
    recipeRefs: [],
    actionRefs,
    salvage: input.salvage,
    ownership: input.ownership,
    era: input.era,
    protection: input.protection,
    restore: input.restore,
    tags: input.tags,
  };
}

export function bindRecipes<T extends CatalogItem>(
  items: T[],
  recipes: { id: string; inputs: { itemId: string }[]; tools: string[] }[],
): T[] {
  const byItem = new Map<string, string[]>();
  for (const recipe of recipes) {
    const ids = new Set<string>([
      ...recipe.inputs.map((i) => i.itemId),
      ...recipe.tools,
    ]);
    for (const id of ids) {
      const list = byItem.get(id) ?? [];
      list.push(recipe.id);
      byItem.set(id, list);
    }
  }
  return items.map((entry) => {
    const recipeRefs = byItem.get(entry.id) ?? [];
    const actionRefs = [...entry.actionRefs];
    if (recipeRefs.length > 0 && !actionRefs.includes("action.craft")) {
      actionRefs.push("action.craft");
    }
    return { ...entry, recipeRefs, actionRefs };
  });
}
