import type { Course, PilotPoint } from "./types.ts";
import { defineCourse } from "./world.ts";
import { stage } from "./paint.ts";

/** C1 — swim the straight channel, or climb the dry stair and drop. */
export function splitFalls(): Course {
  const L = stage(48, 18);
  L.box(2, 14, 10, 16, "#");
  L.s(4, 13, "@");
  L.s(7, 13, "1");
  for (let i = 0; i < 6; i++) {
    const x = 10 + i * 3;
    const surf = 13 - i;
    L.box(x, surf, x + 2, 16, "#");
  }
  L.box(26, 8, 44, 9, "#");
  L.s(30, 7, "p");
  for (let x = 36; x <= 42; x++) {
    L.s(x, 8, ".");
    L.s(x, 9, ".");
  }
  for (let x = 12; x <= 40; x++) {
    L.s(x, 14, ">");
    L.s(x, 15, ">");
  }
  L.s(20, 14, "q");
  L.box(40, 14, 44, 16, "#");
  L.s(41, 13, "2");
  L.s(43, 13, "F");
  for (let y = 13; y <= 15; y++) L.s(39, y, ">");
  L.s(4, 13, "@");
  L.s(7, 13, "1");
  L.border();
  const climb: PilotPoint[] = [{ tx: 5, ty: 13 }];
  for (let i = 0; i < 6; i++) climb.push({ tx: 11 + i * 3, ty: 12 - i, hint: "jump" });
  climb.push({ tx: 32, ty: 7 });
  climb.push({ tx: 42, ty: 13 });
  return defineCourse({
    id: "c1-falls",
    title: "Split Falls",
    tier: "route",
    problem: "Climb the dry stair beside the channel, then drop in at the bell.",
    blurb: "The water is a current you can hear. The stair is dry, slow, and does not fail if you rest.",
    fieldNote: "The falls argue, and both of them are right.",
    map: L.rows(),
    routes: [{ id: "stair", label: "Dry stair", points: climb }],
  });
}

/** C2 — sugar over a void no jump can cross. The creek under it is the long swim. */
export function overUnder(): Course {
  const L = stage(40, 16);
  L.box(4, 4, 10, 6, "#");
  L.s(6, 3, "@");
  L.s(8, 3, "1");
  for (let x = 11; x <= 19; x++) L.box(x, 4, x, 6, "V");
  L.box(20, 4, 36, 6, "#");
  L.s(20, 2, "A");
  L.s(22, 3, "p");
  L.s(24, 3, "2");
  L.s(32, 3, "F");
  for (let y = 4; y <= 12; y++) {
    L.s(4, y, y >= 10 ? "w" : ".");
    L.s(5, y, y >= 10 ? "w" : ".");
  }
  for (let x = 4; x <= 34; x++) {
    L.s(x, 11, "w");
    L.s(x, 12, "w");
  }
  L.s(16, 11, "q");
  for (let y = 3; y <= 12; y++) L.s(34, y, y >= 11 ? "w" : ".");
  L.box(2, 13, 36, 14, "#");
  L.s(6, 3, "@");
  L.s(8, 3, "1");
  L.s(32, 3, "F");
  L.border();
  const over: PilotPoint[] = [
    { tx: 8, ty: 3, hint: "sugar" },
    { tx: 24, ty: 3, hint: "sugar" },
    { tx: 32, ty: 3 },
  ];
  return defineCourse({
    id: "c2-over-under",
    title: "Over Under",
    tier: "route",
    problem: "Zip the sugar span above the creek. The void is nine tiles and no jump.",
    blurb: "The creek runs under the void. The hole on the left is a fall, not a door.",
    fieldNote: "Above and below are the same water.",
    kit: { sugar: true },
    map: L.rows(),
    routes: [{ id: "over", label: "Sugar span", points: over }],
  });
}

/** C3 — sugar, then the boot, on one tall road. */
export function threeHeights(): Course {
  const L = stage(48, 12);
  L.box(2, 8, 6, 10, "#");
  L.s(4, 7, "@");
  L.s(6, 7, "1");
  for (let x = 7; x <= 15; x++) L.box(x, 8, x, 10, "V");
  L.box(16, 8, 24, 10, "#");
  L.s(16, 6, "A");
  L.s(18, 7, "2");
  for (let x = 25; x <= 30; x++) L.box(x, 8, x, 10, "V");
  L.box(31, 8, 44, 10, "#");
  L.s(34, 7, "q");
  L.s(40, 7, "F");
  L.border();
  const high: PilotPoint[] = [
    { tx: 6, ty: 7, hint: "sugar" },
    { tx: 20, ty: 7, hint: "sugar" },
    { tx: 34, ty: 7, hint: "boots" },
    { tx: 40, ty: 7 },
  ];
  return defineCourse({
    id: "c3-heights",
    title: "Three Heights",
    tier: "route",
    problem: "Sugar a nine-tile void, then boot a six-tile void. Neither tool covers the other gap.",
    blurb: "The first gap is too wide to hop. The second is too wide to jump. The bell is after both.",
    fieldNote: "The tower is a question with one honest order.",
    featured: true,
    kit: { sugar: true, boots: true },
    map: L.rows(),
    routes: [{ id: "high", label: "Sugar then boot", points: high }],
  });
}

/** C4 — a short ride with the current, or a long fight against it. */
export function tideShelf(): Course {
  const L = stage(52, 14);
  L.box(2, 4, 8, 6, "#");
  L.s(4, 3, "@");
  L.s(6, 3, "1");
  for (let x = 8; x <= 22; x++) {
    L.s(x, 5, ">");
    L.s(x, 6, ">");
  }
  L.s(14, 5, "p");
  L.box(22, 4, 48, 6, "#");
  L.s(26, 3, "2");
  L.s(44, 3, "F");
  for (let y = 3; y <= 6; y++) L.s(21, y, ">");
  for (let y = 4; y <= 10; y++) L.s(3, y, "<");
  for (let x = 3; x <= 46; x++) {
    L.s(x, 9, "<");
    L.s(x, 10, "<");
  }
  L.s(30, 9, "q");
  for (let y = 3; y <= 10; y++) L.s(42, y, "<");
  L.box(2, 11, 48, 12, "#");
  L.s(4, 3, "@");
  L.s(6, 3, "1");
  L.s(44, 3, "F");
  L.border();
  const down: PilotPoint[] = [
    { tx: 5, ty: 3 },
    { tx: 14, ty: 5, hint: "swim" },
    { tx: 24, ty: 3 },
    { tx: 44, ty: 3 },
  ];
  return defineCourse({
    id: "c4-tide",
    title: "Tide Shelf",
    tier: "route",
    problem: "Drop into the downstream current and let it carry you onto the shelf.",
    blurb: "The current does not negotiate. Swim with it, then step out before the bell.",
    fieldNote: "The tide does not hate you. It is simply going.",
    kit: { fins: true },
    map: L.rows(),
    routes: [{ id: "down", label: "Downstream", points: down }],
  });
}

/** C5 — glide through the membrane, or raise a rod step onto the lip. */
export function voidLip(): Course {
  const L = stage(48, 18);
  L.box(2, 4, 10, 6, "#");
  L.s(4, 3, "@");
  L.s(6, 3, "1");
  L.s(8, 5, "R");
  for (let y = 4; y <= 10; y++) {
    L.s(14, y, "M");
    L.s(15, y, "M");
  }
  for (let x = 11; x <= 22; x++) {
    for (let y = 12; y <= 15; y++) L.s(x, y, "V");
  }
  L.box(23, 12, 44, 16, "#");
  L.s(28, 11, "p");
  L.s(32, 11, "2");
  L.s(40, 11, "F");
  L.hline(10, 8, 18, "#");
  L.s(16, 7, "q");
  L.s(4, 3, "@");
  L.s(6, 3, "1");
  L.s(8, 5, "R");
  L.s(40, 11, "F");
  L.border();
  const glide: PilotPoint[] = [
    { tx: 5, ty: 3 },
    { tx: 9, ty: 3 },
    { tx: 30, ty: 11, hint: "glide" },
    { tx: 40, ty: 11 },
  ];
  return defineCourse({
    id: "c5-void-lip",
    title: "Void Lip",
    tier: "route",
    problem: "Open the cape and glide through the membrane. The void starts below the landing.",
    blurb: "The membrane is a wall until the cape is open. The fall after it is slow, not optional.",
    fieldNote: "Some voids want a hem. Some want a stone.",
    kit: { cape: true },
    map: L.rows(),
    routes: [{ id: "glide", label: "Glide", points: glide }],
  });
}

/** C6 — sugar off the lip before the drain. */
export function confluence(): Course {
  const L = stage(40, 14);
  L.box(2, 4, 8, 6, "#");
  L.s(4, 3, "@");
  L.s(6, 3, "1");
  for (let x = 9; x <= 17; x++) L.box(x, 4, x, 6, "V");
  L.box(18, 4, 36, 6, "#");
  L.s(18, 2, "A");
  L.s(22, 3, "2");
  L.s(32, 3, "F");
  for (let x = 20; x <= 34; x++) {
    L.s(x, 9, ">");
    L.s(x, 10, ">");
  }
  for (let x = 30; x <= 34; x++) L.s(x, 8, "V");
  L.s(24, 9, "p");
  L.border();
  const zip: PilotPoint[] = [
    { tx: 6, ty: 3, hint: "sugar" },
    { tx: 22, ty: 3, hint: "sugar" },
    { tx: 32, ty: 3 },
  ];
  return defineCourse({
    id: "c6-confluence",
    title: "Confluence",
    tier: "route",
    problem: "Latch the sugar before the lip. The current below feeds a void you never have to enter.",
    blurb: "The drain is under the landing and always open. The line is the way that does not visit it.",
    fieldNote: "The void is downstream of every hesitation.",
    kit: { sugar: true, fins: true },
    map: L.rows(),
    routes: [{ id: "zip", label: "Sugar off", points: zip }],
  });
}

export const ROUTE: Course[] = [
  splitFalls(),
  overUnder(),
  threeHeights(),
  tideShelf(),
  voidLip(),
  confluence(),
];
