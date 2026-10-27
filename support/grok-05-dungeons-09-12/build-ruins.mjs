/**
 * Cut unused floor into ruins, leaving a skirt around every walked path,
 * door, mark, and interaction. Arenas keep a wider skirt.
 *
 *   node build-ruins.mjs
 */
import fs from "node:fs";
import { dungeon as dg09 } from "./data/dg09.mjs";
import { dungeon as dg10 } from "./data/dg10.mjs";
import { dungeon as dg11 } from "./data/dg11.mjs";
import { dungeon as dg12 } from "./data/dg12.mjs";
import {
  createState,
  enableTrace,
  placeState,
  runExpectingError,
  runOps,
  tracedTiles,
} from "./engine.mjs";

const DUNGEONS = [dg09, dg10, dg11, dg12];

function safely(fn) {
  try {
    fn();
  } catch {
    /* expected failures still leave the path that led to them */
  }
}

function playAll(d) {
  for (const room of d.rooms) {
    safely(() => {
      const s = placeState(d, room.localProof.place);
      runOps(d, s, room.localProof.steps);
    });
    for (const fail of room.failureAndRecovery) {
      safely(() => {
        const s = placeState(d, fail.place);
        if (fail.expectError) runExpectingError(d, s, fail.steps, fail.expectError);
        else runOps(d, s, fail.steps);
        if (fail.recovery?.length) runOps(d, s, fail.recovery);
      });
    }
  }
  for (const ops of Object.values(d.routes)) {
    safely(() => runOps(d, createState(d), ops));
  }
  if (d.hooks.foldLoop?.length) safely(() => runOps(d, createState(d), d.hooks.foldLoop));
  safely(() => {
    const done = runOps(d, createState(d), d.routes.main);
    for (const ops of Object.values(d.hooks.collect || {})) {
      safely(() => runOps(d, structuredClone(done), ops));
    }
    safely(() => runOps(d, structuredClone(done), d.hooks.reenter));
    safely(() => runOps(d, structuredClone(done), d.hooks.exitOps));
  });
  safely(() => {
    const spec = d.hooks.transitionDeath;
    const s = createState(d);
    runOps(d, s, spec.setup);
    runOps(d, s, [{ op: "die" }]);
    if (spec.reclaim) runOps(d, s, spec.reclaim);
    else if (spec.resumeMain !== false) runOps(d, s, d.routes.main);
  });
  safely(() => {
    const spec = d.hooks.inRoomCarryDeath;
    const s = createState(d);
    runOps(d, s, spec.setup);
    runOps(d, s, [{ op: "die" }]);
  });
  safely(() => runOps(d, createState(d), d.hooks.godAtBoss));
  safely(() => {
    const s = createState(d);
    s.form = "god";
    runOps(d, s, d.routes.main);
  });
}

function add(keep, id, x, y) {
  if (x == null || y == null || String(id).startsWith("COUNTY")) return;
  if (!keep.has(id)) keep.set(id, new Set());
  keep.get(id).add(`${x},${y}`);
}

function marksOf(spec) {
  const tiles = [];
  for (const phase of spec.phases || []) {
    if (phase.mark) tiles.push(phase.mark);
    for (const tile of phase.marks || []) tiles.push(tile);
    for (const accept of phase.accepts || []) {
      if (accept.mark) tiles.push(accept.mark);
      for (const tile of accept.marks || []) tiles.push(tile);
    }
  }
  return tiles;
}

enableTrace(true);
for (const d of DUNGEONS) playAll(d);

const keep = new Map();
for (const [id, set] of tracedTiles) {
  for (const key of set) {
    const [x, y] = key.split(",").map(Number);
    add(keep, id, x, y);
  }
}
for (const d of DUNGEONS) {
  add(keep, d.entry.room, d.entry.tile[0], d.entry.tile[1]);
  for (const tile of marksOf(d.boss)) add(keep, d.boss.room, tile[0], tile[1]);
  for (const tile of marksOf(d.miniboss)) add(keep, d.miniboss.room, tile[0], tile[1]);
  for (const room of d.rooms) {
    for (const conn of room.connections || []) {
      add(keep, room.id, conn.tile[0], conn.tile[1]);
      if (conn.arrival && !String(conn.to).startsWith("COUNTY")) add(keep, conn.to, conn.arrival[0], conn.arrival[1]);
      if (conn.elseArrival && conn.elseTo) add(keep, conn.elseTo, conn.elseArrival[0], conn.elseArrival[1]);
    }
    for (const inter of room.interactions || []) add(keep, room.id, inter.tile[0], inter.tile[1]);
    for (const actor of room.actors || []) add(keep, room.id, actor.tile[0], actor.tile[1]);
    for (const rule of room.conditionalTerrain || []) {
      for (const tile of rule.tiles || []) add(keep, room.id, tile[0], tile[1]);
    }
    for (const step of room.stepFlags || []) add(keep, room.id, step.tile[0], step.tile[1]);
    if (room.lanternTile) add(keep, room.id, room.lanternTile[0], room.lanternTile[1]);
  }
}

const arenas = new Set(DUNGEONS.flatMap((d) => [d.boss.room, d.miniboss.room]));
const ruins = {};
let count = 0;
for (const d of DUNGEONS) {
  for (const room of d.rooms) {
    const held = keep.get(room.id) || new Set();
    const skirt = arenas.has(room.id) ? 3 : 2;
    const walls = [];
    for (let y = 1; y < room.height - 1; y += 1) {
      for (let x = 1; x < room.width - 1; x += 1) {
        if (room.layers.terrain[y][x] !== ".") continue;
        let best = 99;
        for (const key of held) {
          const [kx, ky] = key.split(",").map(Number);
          best = Math.min(best, Math.max(Math.abs(x - kx), Math.abs(y - ky)));
          if (best < skirt) break;
        }
        if (best >= skirt) walls.push([x, y]);
      }
    }
    if (walls.length) {
      ruins[room.id] = walls;
      count += walls.length;
    }
  }
}

const body = Object.entries(ruins)
  .map(([id, walls]) => `  "${id}": ${JSON.stringify(walls)},`)
  .join("\n");
const file = `import { stamp } from "./lib.mjs";

/** Ruins cut from unused floor. Regenerated by ../build-ruins.mjs — do not hand-edit. */
export const RUINS = {
${body}
};

export function applyWalls(id, grid) {
  const extra = RUINS[id];
  if (!extra || !extra.length) return grid;
  return stamp(grid, extra.map(([x, y]) => [x, y, "#"]), id + " ruins");
}
`;
fs.writeFileSync(new URL("./data/ruins.mjs", import.meta.url), file);
console.log(`ruins ${count} tiles across ${Object.keys(ruins).length} rooms`);
