import { CATEGORY_PREFIX, type Category } from "./types.ts";

/**
 * Production catalogs use `ord.cut-nail`.
 * This session's playground uses `demo.ord.cut-nail`.
 * The two patterns cannot match the same string.
 */
const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

export const DEMO_ITEM_ID = new RegExp(
  `^demo\\.(ord|eq|rel|ing|card|dish|trp|doc)\\.${SLUG}$`,
);

export const PRODUCTION_ITEM_ID = new RegExp(
  `^(ord|eq|rel|ing|card|dish|trp|doc)\\.${SLUG}$`,
);

export const CATALOG_BUDGET = {
  ordinary: 240,
  equipment: 120,
  relic: 96,
  ingredient: 120,
  card: 72,
  dish: 48,
  trophy: 48,
  document: 24,
} as const;

export const CATALOG_TOTAL = 768;

export type IdClass = "demo" | "production" | "invalid";

export function classifyItemId(id: string): IdClass {
  if (DEMO_ITEM_ID.test(id)) return "demo";
  if (PRODUCTION_ITEM_ID.test(id)) return "production";
  return "invalid";
}

export function prefixFor(category: Category): string {
  return CATEGORY_PREFIX[category];
}

/** The segment that names the category, ignoring a leading `demo`. */
export function categoryPrefixOf(id: string): string | null {
  const cls = classifyItemId(id);
  if (cls === "invalid") return null;
  const parts = id.split(".");
  return cls === "demo" ? (parts[1] ?? null) : (parts[0] ?? null);
}

export function idsCollide(a: string, b: string): boolean {
  return a === b;
}

export function assertNoIdOverlap(demoIds: readonly string[], productionIds: readonly string[]): string[] {
  const prod = new Set(productionIds);
  const errors: string[] = [];
  for (const id of demoIds) {
    if (prod.has(id)) errors.push(`Demo id collides with a production id: ${id}`);
    if (classifyItemId(id) !== "demo") errors.push(`Not a demo id: ${id}`);
  }
  for (const id of productionIds) {
    if (classifyItemId(id) !== "production") errors.push(`Not a production id: ${id}`);
  }
  return errors;
}
