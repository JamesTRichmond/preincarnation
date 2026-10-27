import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bedFor, bedSpec, clampVolume } from "./audio-bed.ts";

describe("audio beds", () => {
  it("changes the drone with the room and the fight, not with a new system", () => {
    assert.equal(bedFor({ mode: "play", mapId: "middlebury", fighting: false }), "county");
    assert.equal(bedFor({ mode: "play", mapId: "quarry", fighting: false }), "quarry");
    assert.equal(bedFor({ mode: "play", mapId: "quarry", fighting: true }), "combat");
    assert.equal(bedFor({ mode: "kitchen", mapId: "middlebury", fighting: true }), "kitchen");
    assert.equal(bedFor({ mode: "limbo", mapId: "middlebury", fighting: false }), "limbo");
    assert.notEqual(bedSpec("kitchen").root, bedSpec("county").root);
    assert.equal(bedSpec("death").limbo, true);
  });

  it("keeps a volume inside the dial", () => {
    assert.equal(clampVolume(2), 1);
    assert.equal(clampVolume(-1), 0);
    assert.equal(clampVolume(0.4), 0.4);
  });
});
