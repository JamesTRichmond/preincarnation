import { T } from "./tile-ids";
import type { Flags, MapId } from "./types";

export const INTERIOR_IDS: MapId[] = [
  "int_farm",
  "int_inn",
  "int_cape",
  "int_sugar",
  "int_college",
  "int_capitol",
  "int_home",
  "int_barn",
  "int_shop",
  "int_creemee",
  "int_cave",
];

export function isInterior(id: MapId) {
  return (id as string).startsWith("int_");
}

export type InteriorProp = {
  kind: string;
  x: number;
  y: number;
  id: string;
  npc?: string;
  warp?: { map: MapId; x: number; y: number };
  relic?: string;
};

const ROOM: Record<string, string[]> = {
  int_home: [
    "##############",
    "#============#",
    "#=R........C=#",
    "#=...........#",
    "#=...oooo....#",
    "#=...o..o....#",
    "#=...........#",
    "#=....I......#",
    "#=...........#",
    "#=====DD=====#",
    "##############",
  ],
  int_farm: [
    "##############",
    "#============#",
    "#=R..........#",
    "#=....F......#",
    "#=...........#",
    "#=...oooo....#",
    "#=...........#",
    "#=====DD=====#",
    "##############",
  ],
  int_inn: [
    "################",
    "#==============#",
    "#=R....oooo..C=#",
    "#=.....o..o....#",
    "#=.............#",
    "#=...I.........#",
    "#=.............#",
    "#======DD======#",
    "################",
  ],
  int_cape: [
    "##############",
    "#============#",
    "#=R......ooo=#",
    "#=........o..#",
    "#=...........#",
    "#=====DD=====#",
    "##############",
  ],
  int_sugar: [
    "############",
    "#==========#",
    "#=U......C=#",
    "#=.........#",
    "#=...oooo..#",
    "#====DD====#",
    "############",
  ],
  int_college: [
    "################",
    "#==============#",
    "#=P........ooo=#",
    "#=.............#",
    "#=...oooo......#",
    "#=.............#",
    "#======DD======#",
    "################",
  ],
  int_capitol: [
    "################",
    "#mmmmmmmmmmmmmm#",
    "#mR..........Cm#",
    "#m.....oooo...m#",
    "#m............m#",
    "#mmmmmmDDmmmmmm#",
    "################",
  ],
  int_barn: [
    "############",
    "#ssssssssss#",
    "#sR.......s#",
    "#s........s#",
    "#s..oooo..s#",
    "#ssssDDssss#",
    "############",
  ],
  int_shop: [
    "############",
    "#==========#",
    "#=...ooo.C=#",
    "#=...oIo...#",
    "#=.........#",
    "#====DD====#",
    "############",
  ],
  int_creemee: [
    "############",
    "#==========#",
    "#=...K...C=#",
    "#=...ooo...#",
    "#=.........#",
    "#====DD====#",
    "############",
  ],
  int_cave: [
    "##############",
    "#vvvvvvvvvvvv#",
    "#vmm......Cmv#",
    "#vm........mv#",
    "#vm...oooo.mv#",
    "#vmm......mmv#",
    "#vvvvDDvvvvvv#",
    "##############",
  ],
};

const CH: Record<string, number> = {
  "#": T.wall,
  "=": T.wall,
  ".": T.wood,
  o: T.cobble,
  m: T.marble,
  s: T.soil,
  D: T.wood,
  R: T.wood,
  C: T.wood,
  I: T.wood,
  F: T.wood,
  U: T.wood,
  P: T.wood,
  K: T.wood,
  v: T.void,
};

export function buildInterior(
  id: MapId,
  flags: Flags,
  extras: { returnMap?: MapId | null; returnX?: number; returnY?: number } = {},
) {
  const src = ROOM[id] ?? ROOM.int_cape;
  const h = src.length;
  const w = Math.max(...src.map((r) => r.length));
  const tiles: number[][] = [];
  const marks: Record<string, { x: number; y: number }[]> = {};
  for (let y = 0; y < h; y++) {
    const line = src[y].padEnd(w, "#");
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const ch = line[x] ?? "#";
      if ("DRCIFUPK".includes(ch)) {
        (marks[ch] ??= []).push({ x, y });
        row.push(CH[ch] ?? T.wood);
      } else {
        row.push(CH[ch] ?? T.wall);
      }
    }
    tiles.push(row);
  }

  const props: InteriorProp[] = [];
  const door = marks.D?.[0] ?? { x: Math.floor(w / 2), y: h - 2 };
  const spawn = { x: door.x, y: Math.max(1, door.y - 1) };
  props.push({ kind: "spawn", x: spawn.x, y: spawn.y, id: "ispawn" });
  const back: MapId = extras.returnMap ?? flags.returnMap ?? "middlebury";
  const bx = Math.floor((extras.returnX ?? flags.returnX ?? 200) / 16);
  const by = Math.floor((extras.returnY ?? flags.returnY ?? 200) / 16);
  const exitWarp = { map: back, x: bx, y: by };
  props.push({ kind: "door", x: door.x, y: door.y, id: "exit-" + id, warp: exitWarp });
  if (marks.D?.[1]) {
    props.push({ kind: "door", x: marks.D[1].x, y: marks.D[1].y, id: "exit2-" + id, warp: exitWarp });
  }

  const rifleSpot = marks.R?.[0];
  const rifleId = "rifle-" + id + "-" + (flags.geoTown ?? "x");
  if (rifleSpot && !flags.riflesTaken.includes(rifleId) && !flags.riflesTaken.includes("rifle-" + id)) {
    props.push({ kind: "rifle", x: rifleSpot.x, y: rifleSpot.y, id: rifleId });
  }

  const chestSpot = marks.C?.[0];
  if (chestSpot && !flags.chests.includes("in-" + id)) {
    props.push({ kind: "chest", x: chestSpot.x, y: chestSpot.y, id: "in-" + id });
  }

  if (marks.I?.[0]) {
    const npc = id === "int_home" ? null : id === "int_shop" ? "bud" : "shop";
    if (npc) props.push({ kind: "npc", x: marks.I[0].x, y: marks.I[0].y, id: "in-npc-" + id, npc });
  }
  if (marks.F?.[0]) props.push({ kind: "npc", x: marks.F[0].x, y: marks.F[0].y, id: "in-farmer", npc: "farmer" });
  if (marks.U?.[0]) props.push({ kind: "npc", x: marks.U[0].x, y: marks.U[0].y, id: "in-sugar", npc: "sugar" });
  if (marks.P?.[0]) {
    props.push({ kind: "npc", x: marks.P[0].x, y: marks.P[0].y, id: "in-prof", npc: "prof" });
    if (!flags.relics?.includes("cane")) {
      props.push({ kind: "relic", x: marks.P[0].x + 1, y: marks.P[0].y, id: "relic-cane", relic: "cane" });
    }
  }
  if (marks.K?.[0]) {
    props.push({ kind: "npc", x: marks.K[0].x, y: marks.K[0].y, id: "in-creemee", npc: "creemee" });
    if (!flags.caches.includes("creemee-cup")) {
      props.push({ kind: "creemee", x: marks.K[0].x + 1, y: marks.K[0].y, id: "creemee-cup" });
    }
  }
  if (id === "int_sugar") {
    const u = marks.U?.[0] ?? { x: 3, y: 2 };
    props.push({ kind: "syrup", x: u.x + 1, y: u.y, id: "syrup-tin" });
  }
  if (id === "int_home") {
    if (!flags.relics?.includes("mirror")) {
      props.push({ kind: "relic", x: 8, y: 2, id: "relic-mirror", relic: "mirror" });
    }
    if (!flags.relics?.includes("ipod")) {
      props.push({ kind: "relic", x: 3, y: 5, id: "relic-ipod", relic: "ipod" });
    }
  }
  if (id === "int_cave") {
    if (!flags.relics?.includes("flippers")) {
      props.push({ kind: "relic", x: 4, y: 3, id: "relic-flippers", relic: "flippers" });
    }
  }

  return { tiles, w, h, props };
}
