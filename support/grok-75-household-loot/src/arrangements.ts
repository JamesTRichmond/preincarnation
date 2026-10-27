import type { Rotation } from "./types.ts";

export interface Placement {
  n: number;
  anchorId: string;
  rotation?: Rotation;
}

export interface Arrangement {
  id: "evening" | "workshop" | "company";
  label: string;
  blurb: string;
  placements: Placement[];
}

/** Same twenty identities, three ways of sitting. Not an inventory grid. */
export const ARRANGEMENTS: Arrangement[] = [
  {
    id: "evening",
    label: "Evening",
    blurb: "Lamps up. The day is over.",
    placements: [
      { n: 10, anchorId: "porch-hook" },
      { n: 4, anchorId: "reading-nook" },
      { n: 7, anchorId: "table-top" },
      { n: 11, anchorId: "music-corner" },
      { n: 17, anchorId: "music-corner" },
      { n: 19, anchorId: "window-head" },
      { n: 24, anchorId: "door-jamb" },
      { n: 25, anchorId: "table-top" },
      { n: 26, anchorId: "shelf-main" },
      { n: 33, anchorId: "shelf-main" },
      { n: 34, anchorId: "corner" },
      { n: 45, anchorId: "mantel" },
      { n: 48, anchorId: "clock-wall" },
      { n: 53, anchorId: "work-wall" },
      { n: 54, anchorId: "craft-bench" },
      { n: 61, anchorId: "letter-stand" },
      { n: 63, anchorId: "mantel" },
      { n: 78, anchorId: "threshold-wall" },
      { n: 77, anchorId: "shelf-high" },
      { n: 35, anchorId: "craft-side" },
    ],
  },
  {
    id: "workshop",
    label: "Workshop",
    blurb: "The bench is the point of the room.",
    placements: [
      { n: 10, anchorId: "porch-hook" },
      { n: 7, anchorId: "craft-side" },
      { n: 35, anchorId: "shelf-high" },
      { n: 61, anchorId: "mantel" },
      { n: 45, anchorId: "mantel" },
      { n: 63, anchorId: "music-corner" },
      { n: 11, anchorId: "music-corner", rotation: 90 },
      { n: 17, anchorId: "reading-nook" },
      { n: 4, anchorId: "table-top" },
      { n: 25, anchorId: "table-top" },
      { n: 26, anchorId: "shelf-main" },
      { n: 33, anchorId: "shelf-main" },
      { n: 53, anchorId: "rug", rotation: 90 },
      { n: 54, anchorId: "craft-bench" },
      { n: 34, anchorId: "corner" },
      { n: 48, anchorId: "clock-wall" },
      { n: 19, anchorId: "window-head" },
      { n: 24, anchorId: "door-jamb" },
      { n: 78, anchorId: "threshold-wall" },
      { n: 77, anchorId: "letter-stand" },
    ],
  },
  {
    id: "company",
    label: "Company",
    blurb: "The table is turned toward the door.",
    placements: [
      { n: 25, anchorId: "table-top", rotation: 180 },
      { n: 26, anchorId: "table-top", rotation: 180 },
      { n: 7, anchorId: "reading-nook" },
      { n: 4, anchorId: "mantel" },
      { n: 45, anchorId: "mantel" },
      { n: 63, anchorId: "shelf-main" },
      { n: 33, anchorId: "shelf-main" },
      { n: 77, anchorId: "shelf-high" },
      { n: 61, anchorId: "letter-stand" },
      { n: 11, anchorId: "music-corner" },
      { n: 17, anchorId: "music-corner" },
      { n: 35, anchorId: "craft-side" },
      { n: 54, anchorId: "craft-bench" },
      { n: 53, anchorId: "work-wall" },
      { n: 34, anchorId: "corner" },
      { n: 48, anchorId: "clock-wall" },
      { n: 19, anchorId: "window-head" },
      { n: 24, anchorId: "door-jamb" },
      { n: 78, anchorId: "threshold-wall" },
      { n: 10, anchorId: "porch-hook" },
    ],
  },
];

export const FURNISHED_NUMBERS = ARRANGEMENTS[0].placements.map((p) => p.n);

export function arrangementById(id: string): Arrangement | undefined {
  return ARRANGEMENTS.find((a) => a.id === id);
}
