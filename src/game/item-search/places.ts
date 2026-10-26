import type { Custody, Exposure, Place } from "./types.ts";

export type KnownPlace = Place & {
  exposure: Exposure;
  custody: Custody | null;
  /** After fourteen years this door is barred, but Ellis still remembers it. */
  barsAfterReturn?: boolean;
};

/**
 * Places the ledger is allowed to name. There is no entry for an unfound chest.
 * Fixture bins are performance shelves, not Addison County sites.
 */
export const KNOWN_PLACES: KnownPlace[] = [
  {
    placeId: "in-hand",
    label: "In hand",
    container: "grip",
    accessible: true,
    exposure: "indoor",
    custody: "equipped",
  },
  {
    placeId: "pack",
    label: "Pack, main compartment",
    container: "pack",
    accessible: true,
    exposure: "indoor",
    custody: "carried",
  },
  {
    placeId: "quiver",
    label: "Quiver on the pack",
    container: "quiver",
    accessible: true,
    exposure: "indoor",
    custody: "carried",
  },
  {
    placeId: "cellar",
    label: "Farmstead root cellar, north crock",
    container: "cellar",
    accessible: true,
    exposure: "indoor",
    custody: "stored",
  },
  {
    placeId: "mantel",
    label: "Homestead mantel",
    container: "display",
    accessible: true,
    exposure: "indoor",
    custody: "displayed",
  },
  {
    placeId: "barn",
    label: "Barn, main floor",
    container: "barn",
    accessible: true,
    exposure: "indoor",
    custody: "stored",
  },
  {
    placeId: "barn-loft",
    label: "Barn loft, under the eaves",
    container: "loft",
    accessible: true,
    exposure: "indoor",
    custody: "stored",
    barsAfterReturn: true,
  },
  {
    placeId: "green-grave",
    label: "Middlebury Green, the stone where you fell",
    container: "open ground",
    accessible: true,
    exposure: "open",
    custody: "stored",
  },
  {
    placeId: "knowledge",
    label: "Known to you — not a place you can walk",
    container: "memory",
    accessible: true,
    exposure: "indoor",
    custody: null,
  },
];

export const PLACE_BY_ID: Record<string, KnownPlace> = Object.fromEntries(
  KNOWN_PLACES.map((place) => [place.placeId, place]),
);

export function placeById(placeId: string): KnownPlace {
  const place = PLACE_BY_ID[placeId];
  if (!place) {
    throw new Error(`Unknown place "${placeId}". The ledger cannot invent a location.`);
  }
  return place;
}
