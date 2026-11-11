import type { Course, PilotPoint } from "./types.ts";
import { defineCourse } from "./world.ts";
import { stage } from "./paint.ts";

/** D1 — veil plates over a true void. The meter is the puzzle. */
export function veilSteps(): Course {
  const L = stage(46, 10);
  L.box(2, 6, 6, 8, "#");
  L.s(4, 5, "@");
  L.s(5, 5, "1");
  const paintVeil = (x0: number, n: number) => {
    for (let x = x0; x < x0 + n; x++) {
      L.s(x, 6, "o");
      L.s(x, 7, "V");
      L.s(x, 8, "V");
    }
  };
  paintVeil(7, 5);
  L.box(12, 6, 18, 8, "#");
  L.s(15, 5, "2");
  paintVeil(19, 5);
  L.box(24, 6, 42, 8, "#");
  L.s(28, 5, "3");
  L.s(36, 5, "F");
  L.border();
  const points: PilotPoint[] = [
    { tx: 5, ty: 5 },
    { tx: 9, ty: 5, hint: "void" },
    { tx: 15, ty: 5 },
    { tx: 21, ty: 5, hint: "void" },
    { tx: 34, ty: 5 },
  ];
  return defineCourse({
    id: "d1-veil",
    title: "Veil Steps",
    tier: "mastery",
    problem: "Hold void-step across veil plates and refill on the stone islands.",
    blurb: "Release the step and the plate is a hole. The islands give the meter back.",
    fieldNote: "Nothing under the veil except the habit of holding on.",
    kit: { voidStep: true },
    map: L.rows(),
    routes: [{ id: "veil", label: "Veil", points }],
  });
}

/** D2 — the vein runs against you the whole way. */
export function deepVein(): Course {
  const L = stage(40, 12);
  L.box(2, 6, 8, 8, "#");
  L.s(4, 5, "@");
  L.s(6, 5, "1");
  for (let x = 8; x <= 30; x++) {
    L.s(x, 7, "<");
    L.s(x, 8, "<");
  }
  L.s(18, 7, "p");
  L.box(30, 6, 36, 8, "#");
  L.s(32, 5, "2");
  L.s(34, 5, "F");
  for (let y = 5; y <= 8; y++) L.s(29, y, "<");
  L.border();
  const fight: PilotPoint[] = [
    { tx: 5, ty: 5 },
    { tx: 18, ty: 7, hint: "swim" },
    { tx: 29, ty: 6, hint: "swim" },
    { tx: 33, ty: 5 },
  ];
  return defineCourse({
    id: "d2-vein",
    title: "Deep Vein",
    tier: "mastery",
    problem: "Swim the vein against the current. It pushes back the whole width of the canal.",
    blurb: "Fins outrun the current, barely. Stopping is how you lose the ground you just took.",
    fieldNote: "The vein forks, and this fork does not help.",
    kit: { fins: true },
    map: L.rows(),
    routes: [{ id: "fight", label: "Upstream", points: fight }],
  });
}

/** D3 — the membrane is a wall until the cape is open. */
export function capeThread(): Course {
  const L = stage(40, 16);
  L.box(2, 4, 8, 6, "#");
  L.s(4, 3, "@");
  L.s(6, 3, "1");
  for (let y = 4; y <= 9; y++) {
    L.s(12, y, "M");
    L.s(13, y, "M");
  }
  for (let x = 9; x <= 18; x++) {
    for (let y = 10; y <= 13; y++) L.s(x, y, "V");
  }
  L.box(19, 10, 36, 14, "#");
  L.s(24, 9, "2");
  L.s(32, 9, "F");
  L.border();
  const points: PilotPoint[] = [
    { tx: 5, ty: 3 },
    { tx: 7, ty: 3 },
    { tx: 26, ty: 9, hint: "glide" },
    { tx: 32, ty: 9 },
  ];
  return defineCourse({
    id: "d3-thread",
    title: "Cape Thread",
    tier: "mastery",
    problem: "Open the membrane with the cape and glide the gap it was guarding.",
    blurb: "A closed membrane is a wall. Hold the hem as you leave the lip, or the fall has no door.",
    fieldNote: "The thread is the part of the fall you steered.",
    kit: { cape: true },
    map: L.rows(),
    routes: [{ id: "thread", label: "Thread", points }],
  });
}

/** D4 — a small jump, then the rod lip a full jump cannot clear. */
export function rodCascade(): Course {
  const L = stage(46, 16);
  L.box(2, 12, 10, 14, "#");
  L.s(4, 11, "@");
  L.s(7, 11, "1");
  L.s(11, 13, "*");
  L.s(12, 13, "*");
  L.box(13, 12, 42, 14, "#");
  L.s(16, 11, "p");
  L.s(20, 11, "R");
  L.hline(21, 7, 20, "#");
  L.s(26, 6, "2");
  L.s(38, 6, "F");
  L.border();
  const rod: PilotPoint[] = [
    { tx: 5, ty: 11 },
    { tx: 14, ty: 11, hint: "jump" },
    { tx: 28, ty: 6, hint: "rod" },
    { tx: 38, ty: 6 },
  ];
  return defineCourse({
    id: "d4-cascade",
    title: "Rod Cascade",
    tier: "mastery",
    problem: "Clear a spike gap, then plant a block under the lip a full jump cannot reach.",
    blurb: "The jump is the reminder. The socket is the real step. Nothing else on this floor will lift you.",
    fieldNote: "One placed stone is the last riser.",
    kit: { rod: true },
    map: L.rows(),
    routes: [{ id: "rod", label: "Gap then rod", points: rod }],
  });
}

/** D5 — sugar, then boots, then the creek. In that order. */
export function fullSpiral(): Course {
  const L = stage(70, 14);
  L.box(2, 8, 6, 10, "#");
  L.s(4, 7, "@");
  L.s(6, 7, "1");
  for (let x = 7; x <= 15; x++) L.box(x, 8, x, 10, "V");
  L.box(16, 8, 24, 10, "#");
  L.s(16, 6, "A");
  L.s(18, 7, "p");
  for (let x = 25; x <= 30; x++) L.box(x, 8, x, 10, "V");
  L.box(31, 8, 44, 10, "#");
  L.s(33, 7, "q");
  for (let x = 42; x <= 58; x++) {
    L.s(x, 9, "w");
    L.s(x, 10, "w");
  }
  L.s(50, 9, "t");
  L.box(58, 8, 66, 10, "#");
  L.s(60, 7, "2");
  L.s(64, 7, "F");
  for (let y = 8; y <= 10; y++) {
    L.s(42, y, y === 8 ? "." : "w");
    L.s(43, y, y === 8 ? "." : "w");
  }
  for (let y = 7; y <= 10; y++) L.s(57, y, "w");
  L.border();
  const tools: PilotPoint[] = [
    { tx: 6, ty: 7, hint: "sugar" },
    { tx: 20, ty: 7, hint: "sugar" },
    { tx: 36, ty: 7, hint: "boots" },
    { tx: 48, ty: 9, hint: "swim" },
    { tx: 57, ty: 8, hint: "swim" },
    { tx: 63, ty: 7 },
  ];
  const walk: PilotPoint[] = [
    { tx: 6, ty: 7, hint: "sugar" },
    { tx: 20, ty: 7, hint: "sugar" },
    { tx: 36, ty: 7, hint: "boots" },
    { tx: 48, ty: 9, hint: "swim" },
    { tx: 63, ty: 7 },
  ];
  return defineCourse({
    id: "d5-spiral",
    title: "Full Kit Spiral",
    tier: "mastery",
    problem: "Cross with sugar, then the boot, then fins — each gap refuses the previous tool.",
    blurb: "Sugar is late for the hop. The hop is late for the creek. Nothing here is a substitute.",
    fieldNote: "The spiral is a list you walk in order.",
    kit: { sugar: true, boots: true, fins: true },
    map: L.rows(),
    routes: [
      { id: "tools", label: "Each tool", points: tools },
      { id: "stair", label: "Same water, fewer pauses", points: walk },
    ],
  });
}

/** D6 — sugar, the boot, then the cape through a membrane. */
export function hollowRibbon(): Course {
  const L = stage(56, 16);
  L.box(2, 8, 6, 10, "#");
  L.s(4, 7, "@");
  L.s(6, 7, "1");
  for (let x = 7; x <= 15; x++) L.box(x, 8, x, 10, "V");
  L.box(16, 8, 24, 10, "#");
  L.s(16, 6, "A");
  L.s(18, 7, "2");
  for (let x = 25; x <= 30; x++) L.box(x, 8, x, 10, "V");
  L.box(31, 8, 42, 10, "#");
  L.s(34, 7, "3");
  L.s(40, 8, ".");
  L.s(41, 8, ".");
  L.s(40, 9, "M");
  L.s(41, 9, "M");
  L.s(40, 10, "M");
  L.s(41, 10, "M");
  L.box(36, 14, 52, 15, "#");
  L.s(46, 13, "F");
  L.border();
  const line: PilotPoint[] = [
    { tx: 6, ty: 7, hint: "sugar" },
    { tx: 20, ty: 7, hint: "sugar" },
    { tx: 36, ty: 7, hint: "boots" },
    { tx: 39, ty: 7 },
    { tx: 46, ty: 13, hint: "glide" },
  ];
  return defineCourse({
    id: "d6-hollow",
    title: "Hollow Ribbon",
    tier: "mastery",
    problem: "Sugar the wide void, boot the next, then open the membrane with the cape on the way down.",
    blurb: "Three tools, none of them early and none of them late. The membrane stays a wall if the hem is closed.",
    fieldNote: "You do not finish the hollow. You pass through it correctly.",
    featured: true,
    kit: { sugar: true, boots: true, cape: true },
    map: L.rows(),
    routes: [{ id: "line", label: "Full line", points: line }],
  });
}

export const MASTERY: Course[] = [
  veilSteps(),
  deepVein(),
  capeThread(),
  rodCascade(),
  fullSpiral(),
  hollowRibbon(),
];
