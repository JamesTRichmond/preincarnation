/**
 * Explicit adapters. Mastery rank/transform APIs are not in the repo
 * (no Quarry/Creek/Sugar/Ash/Lantern/Hollow mastery module at c737e42 or
 * integration/grok-11). They are marked unavailable and are never called.
 * World nouns that do exist are marked available and are the only hooks items use.
 */

export type BindingStatus = "available" | "unavailable";

export type Binding = {
  id: string;
  status: BindingStatus;
  ref: string;
};

export const BINDINGS: Binding[] = [
  { id: "mastery.quarry.rank", status: "unavailable", ref: "No mastery API in src/game" },
  { id: "mastery.creek.rank", status: "unavailable", ref: "No mastery API in src/game" },
  { id: "mastery.sugar.rank", status: "unavailable", ref: "No mastery API in src/game" },
  { id: "mastery.ash.rank", status: "unavailable", ref: "No mastery API in src/game" },
  { id: "mastery.lantern.rank", status: "unavailable", ref: "No mastery API in src/game" },
  { id: "mastery.hollow.rank", status: "unavailable", ref: "No mastery API in src/game" },
  { id: "mastery.quarry.transform", status: "unavailable", ref: "Tool transforms stay on relic verbs" },
  { id: "mastery.creek.transform", status: "unavailable", ref: "Tool transforms stay on relic verbs" },
  { id: "mastery.sugar.transform", status: "unavailable", ref: "Tool transforms stay on relic verbs" },
  { id: "mastery.ash.transform", status: "unavailable", ref: "Tool transforms stay on relic verbs" },
  { id: "mastery.lantern.transform", status: "unavailable", ref: "Tool transforms stay on relic verbs" },
  { id: "mastery.hollow.transform", status: "unavailable", ref: "Tool transforms stay on relic verbs" },
  { id: "mastery.hollow.site", status: "unavailable", ref: "No Hollow map. Affix hollow-point is a different noun" },

  { id: "rules.slashDamage", status: "available", ref: "src/game/rules.ts slashDamage (mirrored)" },
  { id: "weapon.rollWeapon", status: "available", ref: "src/game/weapons.ts archetypes + affixes" },
  { id: "weapon.starter", status: "available", ref: "starter-iron Short iron" },
  { id: "map.quarry", status: "available", ref: "MapId quarry" },
  { id: "map.middlebury", status: "available", ref: "MapId middlebury" },
  { id: "map.int_sugar", status: "available", ref: "MapId int_sugar" },
  { id: "map.int_cave", status: "available", ref: "MapId int_cave" },
  { id: "cache.woods", status: "available", ref: "CACHE_ARCH.woods" },
  { id: "cache.sugarhouse", status: "available", ref: "CACHE_ARCH.sugarhouse" },
  { id: "cache.harbor", status: "available", ref: "CACHE_ARCH.harbor" },
  { id: "cache.college", status: "available", ref: "CACHE_ARCH.college" },
  { id: "cache.barn", status: "available", ref: "CACHE_ARCH.barn" },
  { id: "relic.lantern", status: "available", ref: "RelicId lantern, flags.lanternOn" },
  { id: "relic.boots", status: "available", ref: "RelicId boots dash" },
  { id: "relic.flippers", status: "available", ref: "RelicId flippers" },
  { id: "relic.cane", status: "available", ref: "RelicId cane block" },
  { id: "relic.bow", status: "available", ref: "RelicId bow Ash bow" },
  { id: "relic.hookshot", status: "available", ref: "Sugar-line zip" },
  { id: "relic.shovel", status: "available", ref: "Grave shovel" },
  { id: "relic.hammer", status: "available", ref: "Marble hammer" },
  { id: "relic.cape", status: "available", ref: "Shadow cape phase" },
  { id: "relic.bombs", status: "available", ref: "Powder kegs" },
  { id: "relic.mirror", status: "available", ref: "Homestead glass" },
  { id: "relic.net", status: "available", ref: "Bug net" },
  { id: "relic.ipod", status: "available", ref: "Strange device" },
  { id: "prop.pot", status: "available", ref: "engine pots / paintPot16" },
  { id: "affix.hollow-point", status: "available", ref: "weapons affix hollow — not the Hollow discipline" },
];

export function binding(id: string): Binding {
  const found = BINDINGS.find((b) => b.id === id);
  if (!found) return { id, status: "unavailable", ref: "Unknown binding — not invented" };
  return found;
}

export function assertAvailable(id: string): Binding {
  const b = binding(id);
  if (b.status !== "available") {
    throw new Error(`Refusing to call unavailable binding ${id}`);
  }
  return b;
}
