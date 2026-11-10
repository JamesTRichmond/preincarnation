import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { T } from "./tile-ids.ts";
import { BITE, countyTell, placeUnderfoot, tellHold, tellPixels, TELL_S } from "./place.ts";

describe("place underfoot", () => {
  it("names the creek, the bridge, and the Vein", () => {
    assert.equal(placeUnderfoot(T.water, "middlebury"), "In the creek");
    assert.equal(placeUnderfoot(T.bridge, "middlebury"), "On the bridge");
    assert.equal(placeUnderfoot(T.marble, "quarry"), "The Vein");
    assert.equal(placeUnderfoot(T.cracked, "quarry"), "The Vein");
    assert.equal(placeUnderfoot(T.marble, "middlebury"), "Cut stone");
    assert.equal(placeUnderfoot(T.grass, "middlebury"), "In the meadow");
    assert.equal(placeUnderfoot(T.cobble, "middlebury"), "On the green");
  });
});

describe("county tell", () => {
  it("does not touch the Sentinel", () => {
    const step = countyTell("sentinel", 8, 0, false, 0.016);
    assert.equal(step.step, "walk");
    assert.equal(step.tell, 0);
  });

  it("holds still and shows a tell before the bite", () => {
    const start = countyTell("fisher", 18, 0, false, 0.016);
    assert.equal(start.step, "tell");
    assert.equal(start.tell, TELL_S);
    assert.equal(start.warned, true);

    const mid = countyTell("fisher", 18, 0.2, true, 0.016);
    assert.equal(mid.step, "tell");
    assert.ok(mid.tell > 0);

    const after = countyTell("fisher", 18, 0.01, true, 0.016);
    assert.equal(after.step, "close");
    assert.equal(after.tell, 0);

    const bite = countyTell("fisher", BITE - 1, 0, true, 0.016);
    assert.equal(bite.step, "bite");
  });

  it("forgets the warning once you are clear", () => {
    const gone = countyTell("bear", 50, 0.2, true, 0.016);
    assert.equal(gone.warned, false);
    assert.equal(gone.step, "walk");
    assert.equal(gone.tell, 0);
  });

  it("draws a ring and a broken line, not a sentence", () => {
    const pts = tellPixels(0, 0, 30, 0, TELL_S);
    assert.equal(pts.length, 11);
    assert.ok(pts.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])));
  });

  it("holds a bear longer than a crow, and leaves the fisher on the old clock", () => {
    assert.equal(tellHold("fisher"), TELL_S);
    assert.ok(tellHold("bear") > TELL_S);
    assert.ok(tellHold("crow") < TELL_S);
    assert.equal(countyTell("bear", 18, 0, false, 0.016).tell, tellHold("bear"));
    assert.equal(countyTell("sentinel", 8, 0, false, 0.016).step, "walk");
  });
});
