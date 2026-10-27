import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PARTICLE_CAP, trimCapped, unstickSpot } from "./fx.ts";
import { TILE } from "./snes.ts";

describe("fx", () => {
  it("drops the oldest sparks once the cap is full", () => {
    const list = Array.from({ length: PARTICLE_CAP + 5 }, (_, i) => i);
    trimCapped(list, PARTICLE_CAP);
    assert.equal(list.length, PARTICLE_CAP);
    assert.equal(list[0], 5);
  });

  it("steps south off a quarry wall and out of an interior solid", () => {
    const wall = new Set(["0,0", "1,0", "-1,0"]);
    const blocked = (x: number, y: number) => wall.has(`${Math.floor(x / TILE)},${Math.floor(y / TILE)}`);
    const quarry = unstickSpot(8, 8, blocked);
    assert.equal(quarry.y, TILE + 8);
    assert.equal(unstickSpot(8, TILE + 8, blocked).y, TILE + 8);

    const room = (x: number, y: number) => Math.floor(y / TILE) < 2;
    const interior = unstickSpot(8, 8, room);
    assert.ok(interior.y >= 2 * TILE);
  });
});
