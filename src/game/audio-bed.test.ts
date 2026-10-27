import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { T } from "./tile-ids.ts";
import { bedFor, bedSpec, clampVolume, groundOf, stepDue, stepVoice, strikeVoice } from "./audio-bed.ts";

describe("audio beds", () => {
  it("changes the drone with the room and the fight, not with a new system", () => {
    assert.equal(bedFor({ mode: "play", mapId: "middlebury", fighting: false }), "county");
    assert.equal(bedFor({ mode: "play", mapId: "quarry", fighting: false }), "quarry");
    assert.equal(bedFor({ mode: "play", mapId: "quarry", fighting: true }), "combat");
    assert.equal(bedFor({ mode: "kitchen", mapId: "middlebury", fighting: true }), "kitchen");
    assert.equal(bedFor({ mode: "limbo", mapId: "middlebury", fighting: false }), "limbo");
    assert.notEqual(bedSpec("kitchen").root, bedSpec("county").root);
    assert.equal(bedSpec("death").limbo, true);
    assert.ok(bedSpec("county").wobble > bedSpec("combat").wobble);
    assert.ok(bedSpec("limbo").wobble > 0);
  });

  it("keeps a volume inside the dial", () => {
    assert.equal(clampVolume(2), 1);
    assert.equal(clampVolume(-1), 0);
    assert.equal(clampVolume(0.4), 0.4);
  });

  it("gives each county body its own strike and leaves bombs on the thud", () => {
    const kinds = ["crow", "wraith", "sentinel", "bear", "bobcat", "fisher", "resident"];
    const freqs = new Set(kinds.map((k) => strikeVoice(k).freq));
    assert.equal(freqs.size, kinds.length);
    assert.equal(strikeVoice("bomb").freq, strikeVoice("").freq);
    assert.ok(strikeVoice("bear").freq < strikeVoice("crow").freq);
    assert.ok(strikeVoice("fisher").freq > strikeVoice("bobcat").freq);
  });

  it("changes the step with the ground and waits a stride", () => {
    assert.equal(groundOf(T.grass), "soft");
    assert.equal(groundOf(T.flowers), "soft");
    assert.equal(groundOf(T.path), "grit");
    assert.equal(groundOf(T.wood), "wood");
    assert.equal(groundOf(T.bridge), "wood");
    assert.equal(groundOf(T.marble), "stone");
    assert.equal(groundOf(T.water), "water");
    assert.notEqual(stepVoice(T.grass).freq, stepVoice(T.marble).freq);
    assert.notEqual(stepVoice(T.path).freq, stepVoice(T.wood).freq);
    const early = stepDue(0, 8);
    assert.equal(early.fire, false);
    const next = stepDue(early.carry, 11);
    assert.equal(next.fire, true);
    assert.equal(stepDue(next.carry, 0).carry, 0);
  });
});
