import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INVULN_MAX,
  OPEN_CAP,
  STEP_MAX,
  STEP_MIN,
  STEP_INVULN,
  chapterDeath,
  chapterRest,
  clampInvuln,
  coatTurn,
  consumePunish,
  freshListen,
  pay,
  validateStep,
  witnessBite,
} from "./vein.ts";

const open = { w: 320, h: 240 };
const clear = () => false;

describe("unlived step", () => {
  it("lands inside the reach on open ground", () => {
    const step = validateStep({ x: 80, y: 80 }, { x: 0, y: -1 }, open, clear);
    assert.equal(step.ok, true);
    if (!step.ok) return;
    assert.equal(step.x, 80);
    assert.equal(step.y, 80 - STEP_MAX);
    assert.ok(step.dist >= STEP_MIN && step.dist <= STEP_MAX);
  });

  it("rejects a step through a wall", () => {
    const wall = (x: number) => x > 90 && x < 110;
    const step = validateStep({ x: 80, y: 80 }, { x: 1, y: 0 }, open, wall);
    assert.equal(step.ok, false);
    if (step.ok) return;
    assert.match(step.reason, /wall/);
  });

  it("rejects a blocked destination", () => {
    const dest = (x: number, y: number) => Math.hypot(x - (80 + STEP_MAX), y - 80) < 2;
    const step = validateStep({ x: 80, y: 80 }, { x: 1, y: 0 }, open, dest);
    assert.equal(step.ok, false);
  });

  it("rejects a step off the county", () => {
    const step = validateStep({ x: 12, y: 40 }, { x: -1, y: 0 }, open, clear);
    assert.equal(step.ok, false);
    if (step.ok) return;
    assert.match(step.reason, /county/);
  });
});

describe("witness", () => {
  it("opens on a repeated kind and caps the third", () => {
    const first = witnessBite({ listening: true, stored: null }, "crow", 0);
    assert.equal(first.result, "stored");
    const second = witnessBite(first.listen, "crow", first.opens);
    assert.equal(second.result, "opened");
    assert.equal(second.opens, 1);
    const again = witnessBite({ listening: true, stored: "crow" }, "crow", second.opens);
    assert.equal(again.result, "opened");
    assert.equal(again.opens, 2);
    const third = witnessBite({ listening: true, stored: "crow" }, "crow", again.opens);
    assert.equal(third.result, "capped");
    assert.equal(third.opens, OPEN_CAP);
    assert.deepEqual(third.listen, freshListen());
  });

  it("does not open on a different kind", () => {
    const noted = witnessBite({ listening: true, stored: "crow" }, "bear", 0);
    assert.equal(noted.result, "ignore");
    assert.equal(noted.opens, 0);
    assert.equal(noted.listen.stored, "crow");
  });

  it("adds one sword point once", () => {
    assert.deepEqual(consumePunish(true), { armed: false, bonus: 1 });
    assert.deepEqual(consumePunish(false), { armed: false, bonus: 0 });
  });
});

describe("chapter", () => {
  it("keeps openings through death and clears the recording", () => {
    const dead = chapterDeath(1, { listening: true, stored: "wraith" });
    assert.equal(dead.opens, 1);
    assert.deepEqual(dead.listen, freshListen());
  });

  it("zeros openings when the chapter rests", () => {
    const rest = chapterRest();
    assert.equal(rest.opens, 0);
    assert.equal(rest.listen.listening, false);
  });
});

describe("coat and mercy", () => {
  it("turns one bite and ignores a written death", () => {
    const turned = coatTurn(1.2, false);
    assert.equal(turned.absorbed, true);
    assert.equal(turned.coat, 0);
    const spent = coatTurn(turned.coat, false);
    assert.equal(spent.absorbed, false);
    const written = coatTurn(1.2, true);
    assert.equal(written.absorbed, false);
    assert.equal(written.coat, 1.2);
  });

  it("wipes an impossible mercy instead of clamping it", () => {
    assert.equal(clampInvuln(999), 0);
    assert.equal(clampInvuln(Number.POSITIVE_INFINITY), 0);
    assert.equal(clampInvuln(-1), 0);
    assert.equal(clampInvuln(0), 0);
    assert.equal(clampInvuln(STEP_INVULN), STEP_INVULN);
    assert.equal(clampInvuln(INVULN_MAX), INVULN_MAX);
    assert.ok(STEP_INVULN < INVULN_MAX);
  });
});

describe("lamp cost", () => {
  it("refuses a rite the mana cannot pay", () => {
    assert.deepEqual(pay(2, "listen"), { ok: true, mp: 0 });
    assert.deepEqual(pay(2, "tomorrow"), { ok: false });
    assert.deepEqual(pay(Number.NaN, "step"), { ok: false });
  });
});
