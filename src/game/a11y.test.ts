import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  A11Y_KEY,
  boneFlashAlpha,
  defaultA11y,
  normalizeA11y,
  picturePixels,
  presentationScale,
  readA11y,
  shakePixels,
  writeA11y,
} from "./a11y.ts";
import { clearSave, writeSave, defaultSave } from "./save.ts";
import { SAVE_KEY, SAVE_VERSION } from "./types.ts";

const mem = new Map<string, string>();

const storage: Storage = {
  get length() {
    return mem.size;
  },
  clear() {
    mem.clear();
  },
  getItem(key: string) {
    return mem.has(key) ? mem.get(key)! : null;
  },
  key(index: number) {
    return [...mem.keys()][index] ?? null;
  },
  removeItem(key: string) {
    mem.delete(key);
  },
  setItem(key: string, value: string) {
    mem.set(key, value);
  },
};

(globalThis as { localStorage: Storage }).localStorage = storage;

afterEach(() => {
  mem.clear();
});

describe("comfort settings", () => {
  it("starts at a full picture, the left stick, and the county shake", () => {
    const settings = defaultA11y();
    assert.equal(settings.pictureScale, 1);
    assert.equal(settings.textScale, 1);
    assert.equal(settings.stickSide, "left");
    assert.equal(settings.highContrast, false);
    assert.equal(settings.reducedFlashing, false);
    assert.equal(settings.shakeStrength, 1);
  });

  it("snaps junk and keeps a right stick only when asked", () => {
    const settings = normalizeA11y({
      pictureScale: 1.4,
      textScale: 9,
      stickSide: "right",
      highContrast: "yes",
      reducedFlashing: 1,
      shakeStrength: 0.1,
    });
    assert.equal(settings.pictureScale, 1.5);
    assert.equal(settings.textScale, 2);
    assert.equal(settings.stickSide, "right");
    assert.equal(settings.highContrast, false);
    assert.equal(settings.reducedFlashing, false);
    assert.equal(settings.shakeStrength, 0);
    assert.deepEqual(normalizeA11y(null), defaultA11y());
  });

  it("restores from its own key", () => {
    writeA11y({ pictureScale: 2, stickSide: "right", textScale: 1.25 }, storage);
    const again = readA11y(storage);
    assert.equal(again.pictureScale, 2);
    assert.equal(again.stickSide, "right");
    assert.equal(again.textScale, 1.25);
    assert.equal(again.shakeStrength, 1);
  });

  it("survives Forget all lives and does not bump the county save", () => {
    writeSave(defaultSave());
    writeA11y({ pictureScale: 1.75, reducedFlashing: true, highContrast: true }, storage);
    assert.equal(SAVE_VERSION, 8);
    clearSave();
    assert.equal(storage.getItem(SAVE_KEY), null);
    const kept = readA11y(storage);
    assert.equal(kept.pictureScale, 1.75);
    assert.equal(kept.reducedFlashing, true);
    assert.equal(kept.highContrast, true);
    assert.equal(JSON.parse(storage.getItem(A11Y_KEY)!).version, 1);
  });
});

describe("picture frame", () => {
  it("uses the integer fit at 100 percent", () => {
    const px = picturePixels(800, 600, 1);
    assert.deepEqual(px, { w: 640, h: 480 });
    assert.equal(presentationScale(px.w, px.h), 2);
  });

  it("magnifies inside a larger frame without changing a non-quarter viewport", () => {
    const px = picturePixels(800, 600, 1.25);
    assert.deepEqual(px, { w: 800, h: 600 });
    assert.equal(presentationScale(px.w, px.h), 2.5);
    assert.equal(presentationScale(390, 700), 1);
  });

  it("doubles a phone frame and lets it scroll", () => {
    const px = picturePixels(390, 844, 2);
    assert.deepEqual(px, { w: 640, h: 480 });
    assert.ok(px.w > 390);
  });
});

describe("shake and flash", () => {
  it("matches the county kick at full strength and is still at zero", () => {
    const full = shakePixels(1, true, 1, () => 1);
    assert.equal(full.ox, 4);
    assert.equal(full.oy, 4);
    assert.deepEqual(
      shakePixels(1, false, 1, () => 1),
      { ox: 0, oy: 0 },
    );
    assert.deepEqual(
      shakePixels(1, true, 0, () => 1),
      { ox: 0, oy: 0 },
    );
    assert.deepEqual(
      shakePixels(0, true, 1, () => 1),
      { ox: 0, oy: 0 },
    );
    const half = shakePixels(1, true, 0.5, () => 0);
    assert.equal(half.ox, -2);
  });

  it("drops the bone wash when flashes are refused", () => {
    assert.equal(boneFlashAlpha(0.4, false), 0.25);
    assert.equal(boneFlashAlpha(0.4, true), 0);
    assert.equal(boneFlashAlpha(0, false), 0);
  });
});
