/** Real Vermont geography used to rasterize county overworlds. Lat/lng WGS84. */

export type BBox = { south: number; west: number; north: number; east: number };

export const COUNTY_BOX: Record<"addison" | "chittenden" | "windsor" | "rutland", BBox> = {
  addison: { south: 43.82, west: -73.43, north: 44.27, east: -72.83 },
  chittenden: { south: 44.25, west: -73.35, north: 44.7, east: -72.82 },
  windsor: { south: 43.28, west: -72.86, north: 43.9, east: -72.25 },
  rutland: { south: 43.25, west: -73.25, north: 43.85, east: -72.78 },
};

export const COUNTY_SIZE = { w: 72, h: 52 };

/** [lat, lng] polylines, south→north or west→east. */
export const RIVERS: { name: string; county: keyof typeof COUNTY_BOX; pts: [number, number][] }[] = [
  {
    name: "Otter Creek",
    county: "addison",
    pts: [
      [43.84, -73.09],
      [43.9, -73.1],
      [43.97, -73.13],
      [44.015, -73.167],
      [44.07, -73.21],
      [44.12, -73.24],
      [44.167, -73.254],
      [44.22, -73.28],
      [44.25, -73.31],
    ],
  },
  {
    name: "New Haven River",
    county: "addison",
    pts: [
      [44.11, -72.95],
      [44.133, -73.079],
      [44.12, -73.16],
      [44.08, -73.22],
    ],
  },
  {
    name: "Winooski",
    county: "chittenden",
    pts: [
      [44.35, -72.88],
      [44.39, -73.0],
      [44.45, -73.08],
      [44.49, -73.185],
      [44.53, -73.24],
    ],
  },
  {
    name: "White River",
    county: "windsor",
    pts: [
      [43.88, -72.66],
      [43.8, -72.58],
      [43.72, -72.45],
      [43.65, -72.32],
    ],
  },
  {
    name: "Connecticut",
    county: "windsor",
    pts: [
      [43.3, -72.44],
      [43.4, -72.4],
      [43.55, -72.35],
      [43.65, -72.31],
      [43.72, -72.3],
      [43.88, -72.28],
    ],
  },
];

export const ROADS: { name: string; county: keyof typeof COUNTY_BOX; pts: [number, number][] }[] = [
  {
    name: "US-7",
    county: "addison",
    pts: [
      [44.26, -73.22],
      [44.205, -73.22],
      [44.14, -73.17],
      [44.015, -73.167],
      [43.9, -73.11],
      [43.83, -73.09],
    ],
  },
  {
    name: "VT-125",
    county: "addison",
    pts: [
      [44.012, -73.26],
      [44.015, -73.167],
      [44.02, -73.05],
      [44.025, -72.93],
    ],
  },
  {
    name: "VT-17",
    county: "addison",
    pts: [
      [44.09, -73.38],
      [44.1, -73.22],
      [44.133, -73.079],
      [44.15, -72.95],
    ],
  },
  {
    name: "VT-22A",
    county: "addison",
    pts: [
      [44.2, -73.3],
      [44.08, -73.32],
      [43.95, -73.31],
      [43.84, -73.3],
    ],
  },
  {
    name: "I-89",
    county: "chittenden",
    pts: [
      [44.3, -72.95],
      [44.38, -73.05],
      [44.46, -73.15],
      [44.55, -73.17],
      [44.68, -73.16],
    ],
  },
  {
    name: "US-7-chit",
    county: "chittenden",
    pts: [
      [44.28, -73.23],
      [44.375, -73.216],
      [44.475, -73.212],
      [44.55, -73.2],
      [44.68, -73.18],
    ],
  },
  {
    name: "I-91",
    county: "windsor",
    pts: [
      [43.3, -72.48],
      [43.45, -72.4],
      [43.65, -72.32],
      [43.82, -72.29],
    ],
  },
  {
    name: "US-4",
    county: "windsor",
    pts: [
      [43.62, -72.7],
      [43.624, -72.519],
      [43.648, -72.418],
      [43.649, -72.32],
    ],
  },
];

/** West-of-this-line is Lake Champlain (lat, lng shoreline, north→south). */
export const CHAMPLAIN_SHORE: { county: "addison" | "chittenden"; pts: [number, number][] }[] = [
  {
    county: "addison",
    pts: [
      [44.27, -73.28],
      [44.2, -73.32],
      [44.09, -73.38],
      [44.0, -73.32],
      [43.89, -73.32],
      [43.82, -73.3],
    ],
  },
  {
    county: "chittenden",
    pts: [
      [44.7, -73.22],
      [44.55, -73.28],
      [44.48, -73.23],
      [44.38, -73.24],
      [44.25, -73.28],
    ],
  },
];

export const LAKES: { name: string; county: keyof typeof COUNTY_BOX; lat: number; lng: number; rLat: number; rLng: number }[] = [
  { name: "Dunmore", county: "addison", lat: 43.907, lng: -73.078, rLat: 0.035, rLng: 0.02 },
  { name: "Shearburn", county: "addison", lat: 44.01, lng: -73.12, rLat: 0.012, rLng: 0.01 },
  { name: "Shelburne Pond", county: "chittenden", lat: 44.394, lng: -73.163, rLat: 0.02, rLng: 0.015 },
  { name: "Lake Morey", county: "windsor", lat: 43.92, lng: -72.15, rLat: 0.02, rLng: 0.012 },
];

export function lngWestOfShore(lat: number, lng: number, shore: [number, number][]): boolean {
  if (shore.length < 2) return false;
  if (lat >= shore[0][0]) return lng < shore[0][1];
  if (lat <= shore[shore.length - 1][0]) return lng < shore[shore.length - 1][1];
  for (let i = 0; i < shore.length - 1; i++) {
    const [aLat, aLng] = shore[i];
    const [bLat, bLng] = shore[i + 1];
    if ((lat <= aLat && lat >= bLat) || (lat >= aLat && lat <= bLat)) {
      const t = (lat - aLat) / (bLat - aLat || 1e-6);
      const sLng = aLng + t * (bLng - aLng);
      return lng < sLng;
    }
  }
  return false;
}
