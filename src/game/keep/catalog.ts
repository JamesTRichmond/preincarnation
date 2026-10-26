import type { CatalogItem } from "./types.ts";

/**
 * Reference names for skus. Tags here fill in only when a stack omits them.
 * Unique, gift, lock, and discovered are never copied from this list.
 */
export const CATALOG: readonly CatalogItem[] = [
  { sku: "meal-broth", name: "Bone broth", category: "food", tags: ["healing", "meal"] },
  { sku: "meal-plum", name: "Plum cordial", category: "food", tags: ["healing", "meal"] },
  { sku: "meal-bread", name: "Barley loaf", category: "food", tags: ["staple", "meal"] },
  { sku: "nightcrawler", name: "Nightcrawlers", category: "bait", tags: ["bait", "fishing"] },
  { sku: "river-fly", name: "River flies", category: "bait", tags: ["bait", "fishing"] },
  { sku: "hook", name: "Barbed hooks", category: "bait", tags: ["bait", "fishing"] },
  { sku: "line-spool", name: "Line spool", category: "gear", tags: ["fishing"] },
  { sku: "oak-beam", name: "Oak beam", category: "material", tags: ["timber", "restoration"] },
  { sku: "ash-beam", name: "Ash beam", category: "material", tags: ["timber", "restoration"] },
  { sku: "lime", name: "Slaked lime", category: "material", tags: ["binder", "restoration"] },
  { sku: "river-stone", name: "River stone", category: "material", tags: ["masonry", "restoration"] },
  { sku: "copper-nail", name: "Copper nail", category: "material", tags: ["fastener", "restoration"] },
  { sku: "salt", name: "Coarse salt", category: "material", tags: ["preserving"] },
  { sku: "linen", name: "Linen wrap", category: "material", tags: ["cloth"] },
  { sku: "kettle", name: "Iron kettle", category: "gear", tags: ["camp"] },
  { sku: "kettle-mara", name: "Mara’s kettle", category: "gift", tags: ["camp", "named-gift"] },
  { sku: "unsigned-note", name: "Unsigned note", category: "heirloom", tags: ["paper"] },
  { sku: "first-bell", name: "First bell", category: "heirloom", tags: ["relic"] },
  { sku: "river-coin", name: "River coin", category: "heirloom", tags: ["relic"] },
  { sku: "cracked-compass", name: "Cracked compass", category: "heirloom", tags: ["relic"] },
  { sku: "pressed-fern", name: "Pressed fern", category: "heirloom", tags: ["curiosity"] },
  { sku: "glass-eye", name: "Glass eye", category: "heirloom", tags: ["curiosity"] },
  { sku: "blue-clay-pipe", name: "Blue clay pipe", category: "material", tags: ["discovered-craft"] },
  { sku: "star-resin", name: "Star resin", category: "material", tags: ["rare"] },
  { sku: "pale-ore", name: "Pale ore", category: "material", tags: ["ore"] },
  { sku: "fishing-rod", name: "Fishing rod", category: "gear", tags: ["fishing"] },
  { sku: "bandage", name: "Linen bandage", category: "gear", tags: ["healing"] },
];

export function catalogBySku(catalog: readonly CatalogItem[] = CATALOG): Map<string, CatalogItem> {
  return new Map(catalog.map((item) => [item.sku, item]));
}
