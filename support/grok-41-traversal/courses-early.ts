import type { Course, PilotPoint } from "./types.ts";
import { defineCourse } from "./world.ts";
import { stage } from "./paint.ts";

const main = (id: string, label: string, points: PilotPoint[]) => [{ id, label, points }];

/** A1 — running jumps over spike pits. Rhythm, one route. */
export function ribbon(): Course {
  const L = stage(40, 10);
  const plats = [2, 8, 14, 20, 26, 32];
  for (const x of plats) {
    L.hline(x, 7, 4, "#");
    L.hline(x, 8, 4, "#");
  }
  for (const x of [6, 12, 18, 24, 30]) {
    L.s(x, 8, "*");
    L.s(x + 1, 8, "*");
  }
  L.s(3, 6, "@");
  L.s(9, 6, "1");
  L.s(15, 6, "2");
  L.s(27, 6, "3");
  L.s(33, 6, "F");
  L.border();
  return defineCourse({
    id: "a1-ribbon",
    title: "Ribbon Steps",
    tier: "early",
    problem: "Chain full jumps across even spike pits without shorting the takeoff.",
    blurb: "Five pits, one rhythm. Coyote time will forgive a late takeoff; a hesitant hop will not.",
    fieldNote: "The ribbon remembers the feet that kept time.",
    featured: true,
    map: L.rows(),
    routes: main(
      "main",
      "Ribbon",
      plats.map((x) => ({ tx: x + 1, ty: 6, hint: "jump" as const })),
    ),
  });
}

/** A2 — stairs up, then a committed drop onto a lower ledge. */
export function switchback(): Course {
  const L = stage(36, 16);
  L.box(1, 13, 8, 14, "#");
  L.s(3, 12, "@");
  L.s(6, 12, "1");
  for (let i = 0; i < 5; i++) {
    const x = 8 + i * 3;
    const surf = 12 - i;
    L.box(x, surf, x + 2, 14, "#");
  }
  L.box(23, 8, 26, 14, "#");
  L.box(27, 13, 33, 14, "#");
  L.s(29, 12, "2");
  L.s(32, 12, "F");
  L.border();
  const points: PilotPoint[] = [
    { tx: 4, ty: 12 },
    { tx: 9, ty: 11, hint: "jump" },
    { tx: 12, ty: 10, hint: "jump" },
    { tx: 15, ty: 9, hint: "jump" },
    { tx: 18, ty: 8, hint: "jump" },
    { tx: 21, ty: 7, hint: "jump" },
    { tx: 24, ty: 7 },
    { tx: 30, ty: 12 },
  ];
  return defineCourse({
    id: "a2-switchback",
    title: "Switchback Rise",
    tier: "early",
    problem: "Climb a one-tile stair, then drop off the lip onto the lower ledge.",
    blurb: "The stair is patient. The drop is not a jump — walk off, don't fling yourself into the wall.",
    fieldNote: "Height you climbed is not height you can throw away.",
    map: L.rows(),
    routes: main("main", "Rise", points),
  });
}

/** A3 — low ceiling forces tap-jumps. A full jump bonks and dumps you in the pit. */
export function cornice(): Course {
  const L = stage(38, 12);
  L.box(1, 1, 36, 4, "#");
  const marks: { x: number; ch: string }[] = [
    { x: 3, ch: "@" },
    { x: 7, ch: "1" },
    { x: 15, ch: "2" },
    { x: 23, ch: "3" },
    { x: 33, ch: "F" },
  ];
  for (let i = 0; i < 8; i++) {
    const x = 2 + i * 4;
    L.hline(x, 8, 3, "#");
    L.hline(x, 9, 3, "#");
    if (i < 7) L.s(x + 3, 9, "*");
  }
  for (const m of marks) L.s(m.x, 7, m.ch);
  L.border();
  const points: PilotPoint[] = [];
  for (let i = 0; i < 8; i++) points.push({ tx: 3 + i * 4, ty: 7, hint: "short" });
  return defineCourse({
    id: "a3-cornice",
    title: "Low Cornice",
    tier: "early",
    problem: "Cross under a cornice with tap-jumps; a full jump bonks and drops you.",
    blurb: "The ceiling is two tiles up. Hold the jump and you meet it. Tap, and the pit stays below.",
    fieldNote: "The cornice punishes the ambitious hop.",
    map: L.rows(),
    routes: main("cornice", "Short hops", points),
  });
}

/** A4 — spike gap on the floor, or a stair that climbs over it and drops later. */
export function fork(): Course {
  const L = stage(56, 18);
  L.box(18, 14, 28, 16, "#");
  L.s(22, 13, "@");
  L.s(25, 13, "1");
  L.s(29, 15, "*");
  L.s(30, 15, "*");
  L.s(31, 15, "*");
  L.box(32, 14, 52, 16, "#");
  L.s(34, 13, "q");
  L.s(42, 13, "2");
  L.s(48, 13, "F");
  for (let i = 0; i < 8; i++) {
    const x = 16 - i * 2;
    const surf = 13 - i;
    L.box(x, surf, x + 1, 16, "#");
  }
  L.box(2, 5, 46, 6, "#");
  L.s(8, 4, "p");
  for (let x = 44; x <= 50; x++) {
    L.s(x, 5, ".");
    L.s(x, 6, ".");
  }
  L.border();
  const gap: PilotPoint[] = [
    { tx: 22, ty: 13 },
    { tx: 26, ty: 13 },
    { tx: 34, ty: 13, hint: "jump" },
    { tx: 42, ty: 13 },
    { tx: 48, ty: 13 },
  ];
  return defineCourse({
    id: "a4-fork",
    title: "Fork Drop",
    tier: "early",
    problem: "Clear the three-tile spike gap, then keep the short hops that follow.",
    blurb: "The gap is a full jump. The bells sit on the same floor after it.",
    fieldNote: "Two ways around one doubt.",
    featured: true,
    map: L.rows(),
    routes: [{ id: "gap", label: "Spike gap", points: gap }],
  });
}

/** A5 — cycling gates in a low hall, or the open ledge above them. */
export function pace(): Course {
  const L = stage(48, 14);
  L.box(2, 10, 44, 12, "#");
  L.s(14, 9, "@");
  L.s(16, 9, "1");
  for (const x of [22, 23, 30, 31]) L.s(x, 9, "G");
  L.s(26, 9, "q");
  L.s(36, 9, "2");
  L.s(42, 9, "F");
  L.box(20, 7, 34, 8, "#");
  for (let i = 0; i < 5; i++) {
    const surf = 9 - i;
    const x = 2 + i * 2;
    L.box(x, surf, x + 1, surf + 1, "#");
  }
  L.box(10, 4, 44, 5, "#");
  L.s(14, 3, "p");
  for (let x = 40; x <= 44; x++) {
    L.s(x, 4, ".");
    L.s(x, 5, ".");
  }
  L.border();
  const gates: PilotPoint[] = [
    { tx: 14, ty: 9 },
    { tx: 17, ty: 9 },
    { tx: 25, ty: 9, hint: "wait" },
    { tx: 33, ty: 9, hint: "wait" },
    { tx: 40, ty: 9 },
  ];
  return defineCourse({
    id: "a5-pace",
    title: "Pace Gate",
    tier: "early",
    problem: "Wait out cycling gates that are solid for most of every 1.8 seconds.",
    blurb: "Each gate is solid for 0.8s of every 1.8s. Standing in it does not speed it up.",
    fieldNote: "Time opens what force only bruises.",
    map: L.rows(),
    routes: [{ id: "gates", label: "Wait the gates", points: gates }],
  });
}

/** A6 — the bell is in sight across a void. The floor hole is the road. */
export function falseLip(): Course {
  const L = stage(44, 16);
  L.box(2, 4, 12, 6, "#");
  L.s(4, 3, "@");
  L.s(6, 3, "1");
  for (let x = 13; x <= 30; x++) L.s(x, 5, "V");
  L.box(31, 4, 40, 6, "#");
  L.s(35, 3, "p");
  L.s(9, 4, ".");
  L.s(10, 4, ".");
  L.s(9, 5, ".");
  L.s(10, 5, ".");
  L.s(9, 6, ".");
  L.s(10, 6, ".");
  L.box(2, 12, 16, 14, "#");
  L.s(12, 11, "2");
  L.s(17, 13, "*");
  L.s(18, 13, "*");
  L.box(19, 12, 30, 14, "#");
  L.s(26, 11, "3");
  L.s(31, 13, "*");
  L.s(32, 13, "*");
  L.box(33, 12, 40, 14, "#");
  L.s(37, 11, "F");
  L.border();
  const points: PilotPoint[] = [
    { tx: 4, ty: 3 },
    { tx: 8, ty: 3 },
    { tx: 10, ty: 11 },
    { tx: 14, ty: 11 },
    { tx: 20, ty: 11, hint: "jump" },
    { tx: 26, ty: 11 },
    { tx: 34, ty: 11, hint: "jump" },
    { tx: 37, ty: 11 },
  ];
  return defineCourse({
    id: "a6-false-lip",
    title: "False Lip",
    tier: "early",
    problem: "Ignore the void shortcut toward the bell and take the hole under the lip.",
    blurb: "The far stone is in sight and out of reach. The void is not a jump. The floor is.",
    fieldNote: "The straight line was a mouth.",
    map: L.rows(),
    routes: main("tunnel", "Under the lip", points),
  });
}
export const EARLY: Course[] = [ribbon(), switchback(), cornice(), fork(), pace(), falseLip()];
