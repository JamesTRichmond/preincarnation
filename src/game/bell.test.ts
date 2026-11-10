import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BELL_ENTRY, BELL_ROOMS, BELL_SLUICE, BELL_SRC, BELL_WHEEL } from "./bell.ts";

const SOLID = new Set(["M", "v", "~", "#"]);

function tileReach() {
  const seen = new Set<string>();
  const q: [number, number][] = [[BELL_ENTRY.x, BELL_ENTRY.y]];
  const h = BELL_SRC.length;
  const w = BELL_SRC[0].length;
  while (q.length) {
    const [x, y] = q.pop()!;
    const key = x + "," + y;
    if (seen.has(key) || x < 0 || y < 0 || x >= w || y >= h) continue;
    if (SOLID.has(BELL_SRC[y][x])) continue;
    seen.add(key);
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

function bodyReach(opened: boolean) {
  const solid = (tx: number, ty: number) => {
    if (opened && BELL_SLUICE.some((c) => c.x === tx && c.y === ty)) return false;
    return SOLID.has(BELL_SRC[ty]?.[tx] ?? "M");
  };
  const fits = (tx: number, ty: number) => {
    const px = tx * 16 + 8;
    const py = ty * 16 + 12;
    const pts: [number, number][] = [
      [px - 5, py],
      [px + 5, py],
      [px, py - 3],
      [px, py + 5],
    ];
    return pts.every(([x, y]) => !solid(Math.floor(x / 16), Math.floor(y / 16)));
  };
  const seen = new Set<string>();
  const q: [number, number][] = [[BELL_ENTRY.x, BELL_ENTRY.y]];
  while (q.length) {
    const [x, y] = q.pop()!;
    const key = x + "," + y;
    if (seen.has(key) || !fits(x, y)) continue;
    seen.add(key);
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

describe("Bell Without a Clapper", () => {
  it("has twelve chambers and the clapper is behind the sluice", () => {
    assert.equal(BELL_ROOMS.length, 12);
    assert.equal(new Set(BELL_ROOMS.map((r) => r.id)).size, 12);
    assert.equal(BELL_SRC[BELL_ENTRY.y][BELL_ENTRY.x], "n");
    const open = tileReach();
    const gears = BELL_ROOMS.find((r) => r.id === "bell-gears")!;
    const court = BELL_ROOMS.find((r) => r.id === "bell-court")!;
    assert.equal(open.has(gears.x + "," + gears.y), true);
    assert.equal(BELL_SRC[court.y][court.x], "C");
    assert.equal(open.has(court.x + "," + court.y), false);
  });

  it("lets a body into the wheel chamber after the race turns, and not to the clapper", () => {
    for (const cell of BELL_SLUICE) assert.equal(BELL_SRC[cell.y][cell.x], "M");
    const shut = bodyReach(false);
    const open = bodyReach(true);
    const wheel = BELL_ROOMS.find((r) => r.id === "bell-wheel")!;
    const span = BELL_ROOMS.find((r) => r.id === "bell-span")!;
    const court = BELL_ROOMS.find((r) => r.id === "bell-court")!;
    assert.equal(shut.has(BELL_WHEEL.x + "," + BELL_WHEEL.y), true);
    assert.equal(shut.has(wheel.x + "," + wheel.y), false);
    assert.equal(open.has(wheel.x + "," + wheel.y), true);
    assert.equal(open.has(span.x + "," + span.y), false);
    assert.equal(open.has(court.x + "," + court.y), false);
  });
});
