/**
 * Live PREINCARNATION catalogs were not mounted.
 * Every id in this module is a reference fixture (`fix.*`, `op.*`).
 * Rebind 1:1 when a catalog is actually present. Do not treat fixture mass as a live economy.
 */
export const BINDING_REPORT = {
  status: "unbound" as const,
  fixturePrefix: "fix.",
  operationPrefix: "op.",
  searched: [
    "workspace artifacts",
    "support item catalogs",
    "in-repo item databases",
  ],
  catalogsFound: [] as string[],
  note: "Item catalogs are not mounted. Operations cite labeled reference fixtures, not live catalog rows. Missing bindings: objects, gear, heirlooms, and quest items.",
};
