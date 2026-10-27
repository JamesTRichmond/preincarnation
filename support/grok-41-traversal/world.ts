import {
  TILE,
  type Cell,
  type Course,
  type Current,
  type Kit,
  type PilotRoute,
  type RouteStamp,
  type Tier,
  kitNone,
} from "./types.ts";

const LEGEND: Record<string, Cell> = {
  ".": "air",
  "#": "solid",
  "=": "oneway",
  "*": "spike",
  w: "water",
  ">": "water",
  "<": "water",
  "^": "water",
  d: "water",
  V: "void",
  o: "veil",
  A: "anchor",
  M: "membrane",
  R: "socket",
  "@": "start",
  F: "finish",
  G: "gate",
  "1": "check",
  "2": "check",
  "3": "check",
  "4": "check",
  "5": "check",
  "6": "check",
  p: "stamp",
  q: "stamp",
  t: "stamp",
};

const CURRENTS: Record<string, Current> = {
  ">": { x: 1, y: 0 },
  "<": { x: -1, y: 0 },
  "^": { x: 0, y: -1 },
  d: { x: 0, y: 1 },
};

export type CourseDraft = {
  id: string;
  title: string;
  tier: Tier;
  problem: string;
  blurb: string;
  fieldNote: string;
  kit?: Partial<Kit>;
  featured?: boolean;
  revision?: number;
  map: string[];
  routes: PilotRoute[];
};

export function defineCourse(draft: CourseDraft): Course {
  const rows = draft.map.map((row) => row.replace(/\s+$/g, ""));
  if (rows.length < 4) throw new Error(`${draft.id}: map too short`);
  const width = rows[0]?.length ?? 0;
  if (rows.some((r) => r.length !== width)) {
    throw new Error(
      `${draft.id}: ragged rows ${rows.map((r) => r.length).join(",")}`,
    );
  }
  const height = rows.length;
  const cells: Cell[] = new Array(width * height);
  const current: Array<Current | null> = new Array(width * height).fill(null);
  const checkAt: Array<string | null> = new Array(width * height).fill(null);
  const stampAt: Array<RouteStamp | null> = new Array(width * height).fill(null);
  let starts = 0;
  let finishes = 0;
  const checkIds: string[] = [];

  for (let ty = 0; ty < height; ty++) {
    const row = rows[ty] ?? "";
    for (let tx = 0; tx < width; tx++) {
      const ch = row[tx] ?? ".";
      const cell = LEGEND[ch];
      if (!cell) throw new Error(`${draft.id}: bad tile '${ch}' at ${tx},${ty}`);
      const i = ty * width + tx;
      cells[i] = cell;
      if (ch in CURRENTS) current[i] = CURRENTS[ch] ?? null;
      if (ch >= "1" && ch <= "6") {
        checkAt[i] = ch;
        if (!checkIds.includes(ch)) checkIds.push(ch);
      }
      if (ch === "p" || ch === "q" || ch === "t") stampAt[i] = ch;
      if (ch === "@") starts++;
      if (ch === "F") finishes++;
    }
  }
  if (starts !== 1) throw new Error(`${draft.id}: expected 1 start, got ${starts}`);
  if (finishes !== 1) throw new Error(`${draft.id}: expected 1 finish, got ${finishes}`);
  checkIds.sort();

  const kit = { ...kitNone(), ...draft.kit };
  return {
    id: draft.id,
    title: draft.title,
    tier: draft.tier,
    problem: draft.problem,
    blurb: draft.blurb,
    fieldNote: draft.fieldNote,
    kit,
    revision: draft.revision ?? 1,
    featured: draft.featured ?? false,
    width,
    height,
    cells,
    current,
    checks: checkIds,
    checkAt,
    stampAt,
    routes: draft.routes,
  };
}

export function idx(course: Course, tx: number, ty: number): number {
  return ty * course.width + tx;
}

export function inBounds(course: Course, tx: number, ty: number): boolean {
  return tx >= 0 && ty >= 0 && tx < course.width && ty < course.height;
}

export function cellAt(course: Course, tx: number, ty: number): Cell {
  if (!inBounds(course, tx, ty)) return "air";
  return course.cells[idx(course, tx, ty)] ?? "air";
}

export function currentAt(course: Course, tx: number, ty: number): Current | null {
  if (!inBounds(course, tx, ty)) return null;
  return course.current[idx(course, tx, ty)] ?? null;
}

export function findCell(course: Course, cell: Cell): { tx: number; ty: number } | null {
  for (let ty = 0; ty < course.height; ty++) {
    for (let tx = 0; tx < course.width; tx++) {
      if (cellAt(course, tx, ty) === cell) return { tx, ty };
    }
  }
  return null;
}

export function anchorsOf(course: Course): { tx: number; ty: number; x: number; y: number }[] {
  const out: { tx: number; ty: number; x: number; y: number }[] = [];
  for (let ty = 0; ty < course.height; ty++) {
    for (let tx = 0; tx < course.width; tx++) {
      if (cellAt(course, tx, ty) === "anchor") {
        out.push({
          tx,
          ty,
          x: tx * TILE + TILE / 2,
          y: ty * TILE + TILE / 2,
        });
      }
    }
  }
  return out;
}

export function tileCenter(tx: number, ty: number): { x: number; y: number } {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

/** Gate is solid for the first 0.8s of every 1.8s. Deterministic from sim time. */
export function gateClosed(time: number): boolean {
  const t = ((time % 1.8) + 1.8) % 1.8;
  return t < 0.8;
}

export function solidCount(course: Course): number {
  let n = 0;
  for (const c of course.cells) if (c === "solid" || c === "oneway" || c === "membrane") n++;
  return n;
}
