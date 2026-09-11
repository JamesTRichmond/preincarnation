import type { MapId } from "./types";

export type CountyId = "addison" | "chittenden" | "windsor" | "rutland" | "washington";

export type TownDef = {
  id: MapId;
  name: string;
  county: CountyId;
  lat: number;
  lng: number;
  blurb: string;
};

/** Real WGS84 pins. Town maps are Zelda-compressed versions of these places. */
export const TOWNS: TownDef[] = [
  { id: "middlebury", name: "Middlebury", county: "addison", lat: 44.0153, lng: -73.1673, blurb: "College on the Green. Otter Creek splits the village." },
  { id: "vergennes", name: "Vergennes", county: "addison", lat: 44.167, lng: -73.254, blurb: "Smallest city. Falls on the creek, basin toward the lake." },
  { id: "bristol", name: "Bristol", county: "addison", lat: 44.1334, lng: -73.079, blurb: "Gap town. Lord's Prayer Rock on the way in." },
  { id: "ferrisburgh", name: "Ferrisburgh", county: "addison", lat: 44.2056, lng: -73.2462, blurb: "US-7 farms and the Rokeby road to the lake." },
  { id: "salisbury", name: "Salisbury", county: "addison", lat: 43.8967, lng: -73.0998, blurb: "Lake Dunmore under the mountain." },
  { id: "addison", name: "Addison County", county: "addison", lat: 44.05, lng: -73.17, blurb: "The county overworld." },
  { id: "rutland", name: "Rutland", county: "rutland", lat: 43.6106, lng: -72.9726, blurb: "Marble city south of the county line." },
  { id: "quarry", name: "Marble Vein", county: "addison", lat: 44.02, lng: -73.02, blurb: "The county temple. Hammer, keys, dark." },
  { id: "montpelier", name: "Montpelier", county: "washington", lat: 44.2601, lng: -72.5754, blurb: "The capital." },
  { id: "whiteriver", name: "White River Junction", county: "windsor", lat: 43.6487, lng: -72.3195, blurb: "Rail town on the Connecticut." },
  { id: "burlington", name: "Burlington", county: "chittenden", lat: 44.4759, lng: -73.2121, blurb: "The lake city." },
  { id: "shelburne", name: "Shelburne", county: "chittenden", lat: 44.3806, lng: -73.2276, blurb: "Museum road and the pond." },
  { id: "essex", name: "Essex", county: "chittenden", lat: 44.4906, lng: -73.1112, blurb: "Junction north of the Winooski." },
  { id: "winooski", name: "Winooski", county: "chittenden", lat: 44.4914, lng: -73.1857, blurb: "Mills on the river." },
  { id: "woodstock", name: "Woodstock", county: "windsor", lat: 43.6242, lng: -72.5187, blurb: "Green and the Ottauquechee." },
  { id: "springfieldvt", name: "Springfield", county: "windsor", lat: 43.2987, lng: -72.4823, blurb: "Precision valley." },
  { id: "norwich", name: "Norwich", county: "windsor", lat: 43.7153, lng: -72.3081, blurb: "Across the river from Hanover." },
  { id: "chittenden", name: "Chittenden County", county: "chittenden", lat: 44.45, lng: -73.08, blurb: "The northern county." },
  { id: "windsor", name: "Windsor County", county: "windsor", lat: 43.6, lng: -72.5, blurb: "The eastern county." },
  { id: "soloverse", name: "Soloverse", county: "addison", lat: 44.05, lng: -73.17, blurb: "Four rooms of one sphere. Fact, fiction, history, imagination." },
];

export const TOWN_BY_ID = Object.fromEntries(TOWNS.map((t) => [t.id, t])) as Partial<Record<MapId, TownDef>>;

export function weatherLabel(code: number): { id: string; name: string } {
  if (code === 0) return { id: "clear", name: "Clear" };
  if (code <= 3) return { id: "cloud", name: "Cloudy" };
  if (code <= 48) return { id: "fog", name: "Fog" };
  if (code <= 57) return { id: "rain", name: "Drizzle" };
  if (code <= 67) return { id: "rain", name: "Rain" };
  if (code <= 77) return { id: "snow", name: "Snow" };
  if (code <= 82) return { id: "rain", name: "Showers" };
  if (code <= 86) return { id: "snow", name: "Snow" };
  return { id: "storm", name: "Storm" };
}

function hav(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function nearestTown(lat: number, lng: number, playable = true): { town: TownDef; km: number } {
  const pool = playable
    ? TOWNS.filter((t) => t.id !== "addison" && t.id !== "chittenden" && t.id !== "windsor" && t.id !== "quarry" && t.id !== "soloverse")
    : TOWNS;
  let best = pool[0];
  let bestKm = Infinity;
  for (const t of pool) {
    const km = hav(lat, lng, t.lat, t.lng);
    if (km < bestKm) {
      bestKm = km;
      best = t;
    }
  }
  return { town: best, km: bestKm };
}

export function locatePlayer(lat: number, lng: number) {
  const hit = nearestTown(lat, lng, true);
  const inVermont = lat > 42.7 && lat < 45.1 && lng > -73.5 && lng < -71.4;
  const localX = 0.45 + ((lng - hit.town.lng) * 8);
  const localY = 0.45 - ((lat - hit.town.lat) * 10);
  return {
    town: hit.town,
    km: hit.km,
    inVermont,
    onOverworld: hit.km > 4,
    localX: Math.max(0.18, Math.min(0.82, localX)),
    localY: Math.max(0.18, Math.min(0.82, localY)),
  };
}
