import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attackEdge,
  boneFlashAlpha,
  defaultA11y,
  focusOrder,
  normalizeA11y,
  picturePixels,
  readerHint,
  writeA11y,
} from "./a11y.ts";

describe("comfort", () => {
  it("magnifies the 320×240 frame in quarter steps and does not invent a new buffer", () => {
    const fit = picturePixels(1280, 720, 1);
    assert.equal(fit.w % 320, 0);
    assert.equal(fit.h % 240, 0);
    const bigger = picturePixels(1280, 720, 1.5);
    assert.ok(bigger.w > fit.w);
    assert.equal(bigger.w / 320, fit.w / 320 * 1.5);
  });

  it("refuses a flash when the player asked, and keeps one otherwise", () => {
    assert.equal(boneFlashAlpha(1, true), 0);
    assert.equal(boneFlashAlpha(1, false), 0.25);
    assert.equal(boneFlashAlpha(0, false), 0);
  });

  it("orders pause and dialogue as buttons, and names the job for a reader", () => {
    assert.deepEqual(focusOrder("dialogue"), ["choice"]);
    assert.ok(focusOrder("pause").includes("kitchen"));
    assert.equal(readerHint("  WAKE the Marble Vein east of the Green.  "), "WAKE the Marble Vein east of the Green.");
    assert.match(readerHint(""), /Marble Vein/);
  });

  it("puts the attack on the opposite edge and keeps comfort off the county save", () => {
    assert.equal(attackEdge("left"), "right");
    assert.equal(attackEdge("right"), "left");
    const mem = new Map<string, string>();
    const store = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
    };
    const next = writeA11y({ highContrast: true, pictureScale: 9 as unknown as 1 }, store);
    assert.equal(next.highContrast, true);
    assert.equal(next.pictureScale, 2);
    assert.equal(defaultA11y().highContrast, false);
    assert.equal(normalizeA11y(null).stickSide, "left");
  });
});
