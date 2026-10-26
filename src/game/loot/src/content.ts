import { LootError } from "./errors.ts";
import { budgetOf, validateContent } from "./validate.ts";
import type { ContentPack, ResolvedContent } from "./types.ts";

export function resolveContent(pack: ContentPack): ResolvedContent {
  const errors = validateContent(pack);
  if (errors.length > 0) {
    throw new LootError("invalid-content", errors.join("\n"));
  }
  return {
    packId: pack.id,
    mode: pack.mode,
    label: pack.label,
    definitions: new Map(pack.definitions.map((def) => [def.id, def])),
    recipes: new Map(pack.recipes.map((recipe) => [recipe.id, recipe])),
    restorations: new Map(pack.restorations.map((restoration) => [restoration.id, restoration])),
    modifications: new Map(pack.modifications.map((mod) => [mod.id, mod])),
    characters: new Map(pack.characters.map((character) => [character.id, character])),
    slots: new Map(pack.slots.map((slot) => [slot.id, slot])),
    trader: pack.trader,
    budget: budgetOf(pack.definitions),
    list: pack.definitions,
  };
}
