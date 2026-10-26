import assert from "node:assert/strict";
import test from "node:test";
import {
  equalPower,
  equalPowerCurve,
  layerGain,
  masterTarget,
  menuDuck,
  veilAmount,
} from "./music-logic.ts";

test("equal-power endpoints and energy", () => {
  const a = equalPower(0);
  const b = equalPower(1);
  const m = equalPower(0.5);
  assert.ok(Math.abs(a.out - 1) < 1e-9);
  assert.ok(Math.abs(a.inn) < 1e-9);
  assert.ok(Math.abs(b.inn - 1) < 1e-9);
  assert.ok(Math.abs(b.out) < 1e-9);
  assert.ok(Math.abs(m.out * m.out + m.inn * m.inn - 1) < 1e-9);
});

test("curves stay positive and move the right way", () => {
  const inn = equalPowerCurve(true, 16);
  const out = equalPowerCurve(false, 16);
  assert.ok(inn[0] < inn[inn.length - 1]);
  assert.ok(out[0] > out[out.length - 1]);
  for (const curve of [inn, out]) {
    for (const v of curve) assert.ok(v > 0);
  }
});

test("intensity layers stack upward and solo replaces them", () => {
  assert.equal(layerGain(0, 0, null, 0), 1);
  assert.equal(layerGain(1, 0, null, 1), 0);
  assert.equal(layerGain(1, 1, null, 1), 1);
  assert.equal(layerGain(2, 1, null, 2), 0);
  assert.equal(layerGain(2, 2, null, 2), 1);
  assert.equal(layerGain(0, 2, 1, 0), 0);
  assert.equal(layerGain(2, 0, 1, 1), 1);
});

test("menu duck, veil exceptions, mute and suspend", () => {
  assert.equal(menuDuck(false), 1);
  assert.ok(menuDuck(true) < 0.4);
  assert.equal(veilAmount(false, "veil", true), 0);
  assert.ok(veilAmount(true, "veil", true) > 0.5);
  assert.equal(veilAmount(true, "duck-only", true), 0);
  assert.ok(veilAmount(true, "duck-only", false) > 0.5);
  assert.equal(masterTarget(false, false), 1);
  assert.equal(masterTarget(true, false), 0);
  assert.equal(masterTarget(false, true), 0);
});
