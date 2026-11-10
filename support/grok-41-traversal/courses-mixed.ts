import type { Course, PilotPoint } from "./types.ts";
import { defineCourse } from "./world.ts";
import { stage } from "./paint.ts";

/** B1 — a void wider than any jump. The sugar anchor hangs over the far lip. */
export function sugarZip(): Course {
  const L = stage(34, 12);
  L.box(2, 8, 6, 10, "#");
  L.s(4, 7, "@");
  L.s(6, 7, "1");
  for (let x = 7; x <= 15; x++) L.box(x, 8, x, 10, "V");
  L.box(16, 8, 30, 10, "#");
  L.s(16, 6, "A");
  L.s(18, 7, "2");
  L.s(26, 7, "F");
  L.border();
  const points: PilotPoint[] = [
    { tx: 6, ty: 7, hint: "sugar" },
    { tx: 20, ty: 7, hint: "sugar" },
    { tx: 26, ty: 7 },
  ];
  return defineCourse({
    id: "b1-sugar",
    title: "Sugar Zip",
    tier: "mixed",
    problem: "Latch a sugar-line and reel across a void no jump can cover.",
    blurb: "Aim at the amber anchor. Release when the far stone is under you. The line is not a swing.",
    fieldNote: "Sugar holds if you do not argue with it.",
    featured: true,
    kit: { sugar: true },
    map: L.rows(),
    routes: [{ id: "zip", label: "Zip", points }],
  });
}

/** B2 — a polite gap, then a six-tile void that needs the hop. */
export function gapBoots(): Course {
  const L = stage(40, 12);
  L.box(2, 8, 8, 10, "#");
  L.s(4, 7, "@");
  L.s(6, 7, "1");
  L.s(9, 9, "*");
  L.s(10, 9, "*");
  L.box(11, 8, 16, 10, "#");
  L.s(13, 7, "2");
  for (let x = 17; x <= 22; x++) L.box(x, 8, x, 10, "V");
  L.box(23, 8, 36, 10, "#");
  L.s(25, 7, "3");
  L.s(32, 7, "F");
  L.border();
  const points: PilotPoint[] = [
    { tx: 5, ty: 7 },
    { tx: 13, ty: 7, hint: "jump" },
    { tx: 26, ty: 7, hint: "boots" },
    { tx: 32, ty: 7 },
  ];
  return defineCourse({
    id: "b2-boots",
    title: "Gap Boots",
    tier: "mixed",
    problem: "Clear a six-tile void with the gap-boot hop after proving a normal jump.",
    blurb: "The first pit is a reminder. The second is the boot. Jump, then jump again in the air.",
    fieldNote: "The second step is the one that was missing.",
    kit: { boots: true },
    map: L.rows(),
    routes: [{ id: "hop", label: "Hop", points }],
  });
}

/** B3 — stones over the creek, or the swim tunnel under a ceiling. */
export function creek(): Course {
  const L = stage(42, 16);
  L.box(2, 12, 8, 14, "#");
  L.s(4, 11, "@");
  L.s(6, 11, "1");
  for (const x of [10, 16, 22, 28]) {
    L.hline(x, 8, 3, "#");
    L.hline(x, 9, 3, "#");
  }
  L.s(11, 7, "p");
  for (let y = 11; y <= 13; y++) L.s(8, y, "w");
  for (let x = 9; x <= 34; x++) {
    L.s(x, 12, "w");
    L.s(x, 13, "w");
  }
  L.box(9, 10, 34, 11, "#");
  L.s(14, 12, "q");
  L.box(34, 8, 39, 14, "#");
  L.s(35, 7, "2");
  L.s(37, 7, "F");
  L.box(31, 8, 34, 9, "#");
  // Shaft on the near lip so the swim exits left of both bells.
  for (let y = 7; y <= 13; y++) L.s(32, y, "w");
  L.border();
  const stones: PilotPoint[] = [
    { tx: 4, ty: 11 },
    { tx: 11, ty: 7, hint: "jump" },
    { tx: 17, ty: 7, hint: "jump" },
    { tx: 23, ty: 7, hint: "jump" },
    { tx: 29, ty: 7, hint: "jump" },
    { tx: 36, ty: 7 },
  ];
  const swim: PilotPoint[] = [
    { tx: 4, ty: 11 },
    { tx: 10, ty: 12, hint: "swim" },
    { tx: 22, ty: 12, hint: "swim" },
    { tx: 32, ty: 9, hint: "swim" },
    { tx: 36, ty: 7 },
  ];
  return defineCourse({
    id: "b3-creek",
    title: "Creek Stones",
    tier: "mixed",
    problem: "Cross on the stones, or swim the tunnel that the stones roof over.",
    blurb: "Fins make the creek a road. The stones are still there if you would rather jump.",
    fieldNote: "The creek keeps both answers.",
    kit: { fins: true },
    map: L.rows(),
    routes: [
      { id: "stones", label: "Stones", points: stones },
      { id: "swim", label: "Tunnel", points: swim },
    ],
  });
}

/** B4 — glide off the tower, or fall into the pool and swim out. */
export function capeFall(): Course {
  const L = stage(44, 18);
  L.box(4, 4, 12, 6, "#");
  L.s(7, 3, "@");
  L.s(9, 3, "1");
  for (let x = 13; x <= 22; x++) {
    for (let y = 13; y <= 15; y++) L.s(x, y, "V");
  }
  L.box(23, 12, 40, 16, "#");
  L.s(26, 11, "p");
  L.s(30, 11, "2");
  L.s(36, 11, "F");
  for (let y = 4; y <= 15; y++) {
    L.s(4, y, ".");
    L.s(5, y, y >= 13 ? "w" : ".");
  }
  for (let x = 5; x <= 26; x++) {
    L.s(x, 14, "w");
    L.s(x, 15, "w");
  }
  L.s(16, 14, "q");
  for (let y = 11; y <= 15; y++) {
    L.s(24, y, "w");
    L.s(25, y, "w");
  }
  L.box(2, 16, 40, 16, "#");
  L.s(7, 3, "@");
  L.s(9, 3, "1");
  L.s(36, 11, "F");
  L.border();
  const glide: PilotPoint[] = [
    { tx: 8, ty: 3 },
    { tx: 11, ty: 3 },
    { tx: 28, ty: 11, hint: "glide" },
    { tx: 36, ty: 11 },
  ];
  return defineCourse({
    id: "b4-cape",
    title: "Cape Fall",
    tier: "mixed",
    problem: "Glide the long fall onto the far ledge. A jump dies in the void.",
    blurb: "The void between is wider than a jump. The cape is a slow fall, not a flight.",
    fieldNote: "Hold the hem and the drop becomes a road.",
    featured: true,
    kit: { cape: true },
    map: L.rows(),
    routes: [{ id: "glide", label: "Glide", points: glide }],
  });
}

/** B5 — one rod block onto a lip a full jump cannot reach, or the stair around it. */
export function rodShelf(): Course {
  const L = stage(42, 16);
  L.box(2, 12, 38, 14, "#");
  L.s(4, 11, "@");
  L.s(6, 11, "1");
  L.s(10, 11, "R");
  L.s(12, 11, "p");
  // Lip surface is ty=7: 80px above the floor, 48px above the rod block. Stand on ty=6.
  L.hline(11, 7, 13, "#");
  L.s(18, 6, "2");
  for (let i = 0; i < 5; i++) {
    const x = 24 + i * 3;
    const surf = 11 - i;
    L.box(x, surf, x + 2, 14, "#");
  }
  L.hline(11, 7, 27, "#");
  L.s(4, 11, "@");
  L.s(6, 11, "1");
  L.s(10, 11, "R");
  L.s(12, 11, "p");
  L.s(16, 6, "2");
  L.s(34, 6, "F");
  L.border();
  const rod: PilotPoint[] = [
    { tx: 5, ty: 11 },
    { tx: 14, ty: 6, hint: "rod" },
    { tx: 34, ty: 6 },
  ];
  return defineCourse({
    id: "b5-rod",
    title: "Rod Shelf",
    tier: "mixed",
    problem: "Plant the block rod under a lip that sits one tile past a full jump.",
    blurb: "The socket grows a single stone. Stand on it, then jump. The shelf will not come down.",
    fieldNote: "One placed stone is a staircase you can carry.",
    kit: { rod: true },
    map: L.rows(),
    routes: [{ id: "rod", label: "Rod", points: rod }],
  });
}

/** B6 — sugar, then boots, then a swim. In that order. */
export function braid(): Course {
  const L = stage(70, 14);
  L.box(2, 8, 6, 10, "#");
  L.s(4, 7, "@");
  L.s(6, 7, "1");
  for (let x = 7; x <= 15; x++) L.box(x, 8, x, 10, "V");
  L.box(16, 8, 24, 10, "#");
  L.s(16, 6, "A");
  L.s(18, 7, "2");
  for (let x = 25; x <= 30; x++) L.box(x, 8, x, 10, "V");
  L.box(31, 8, 44, 10, "#");
  L.s(33, 7, "3");
  for (let x = 42; x <= 58; x++) {
    L.s(x, 9, "w");
    L.s(x, 10, "w");
  }
  L.box(58, 8, 66, 10, "#");
  L.s(62, 7, "F");
  for (let y = 8; y <= 10; y++) {
    L.s(42, y, y === 8 ? "." : "w");
    L.s(43, y, y === 8 ? "." : "w");
  }
  for (let y = 7; y <= 10; y++) L.s(57, y, "w");
  L.border();
  const points: PilotPoint[] = [
    { tx: 6, ty: 7, hint: "sugar" },
    { tx: 20, ty: 7, hint: "sugar" },
    { tx: 36, ty: 7, hint: "boots" },
    { tx: 50, ty: 9, hint: "swim" },
    { tx: 57, ty: 8, hint: "swim" },
    { tx: 62, ty: 7 },
  ];
  return defineCourse({
    id: "b6-braid",
    title: "Tool Braid",
    tier: "mixed",
    problem: "Sugar a nine-tile void, hop a six-tile void, then swim under the wall.",
    blurb: "Each tool is late for the previous gap and early for the next. Don't spend the boot on the sugar.",
    fieldNote: "Three answers, none of them interchangeable.",
    kit: { sugar: true, boots: true, fins: true },
    map: L.rows(),
    routes: [{ id: "braid", label: "Braid", points }],
  });
}

export const MIXED: Course[] = [sugarZip(), gapBoots(), creek(), capeFall(), rodShelf(), braid()];
