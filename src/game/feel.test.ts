import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ATTACK_BUFFER_S,
  lipStep,
  noteAttackDuringHitstop,
  releaseAttackBuffer,
  resolveFacing,
  scaleHitstop,
  stepCamera,
} from "./feel.ts";

describe("resolveFacing", () => {
  it("keeps the previous axis inside the diagonal band", () => {
    const first = resolveFacing(0.8, 0.7, 2, null);
    assert.equal(first.dir, 2);
    const wobble = resolveFacing(0.72, 0.7, first.dir, first.mem);
    assert.equal(wobble.dir, 2);
    const back = resolveFacing(0.7, 0.72, wobble.dir, wobble.mem);
    assert.equal(back.dir, 2);
  });

  it("leaves the band when one axis dominates", () => {
    const held = resolveFacing(0.2, 0.9, 2, "x");
    assert.equal(held.dir, 0);
    assert.equal(held.mem, "y");
  });

  it("ties an equal stick to vertical when nothing is remembered", () => {
    const tie = resolveFacing(1, 1, 2, null);
    assert.equal(tie.dir, 0);
  });
});

describe("lipStep", () => {
  it("walks through open ground", () => {
    const step = lipStep(0, 0, 3, 0, () => false);
    assert.deepEqual(step, { x: 3, y: 0, slipped: false });
  });

  it("slides a 4px lip and stops on a solid wall", () => {
    const blocked = (x: number, y: number) => x >= 10 && y < 4;
    const cleared = lipStep(8, 0, 3, 0, blocked, 4);
    assert.equal(cleared.slipped, true);
    assert.ok(cleared.x >= 10);
    assert.ok(cleared.y >= 4);

    const wall = lipStep(8, 0, 3, 0, () => true, 4);
    assert.equal(wall.slipped, false);
    assert.equal(wall.x, 8);
  });

  it("does not treat an 8px overlap as a lip", () => {
    const blocked = (x: number, y: number) => x >= 10 && Math.abs(y) < 8;
    const step = lipStep(8, 0, 3, 0, blocked, 4);
    assert.equal(step.slipped, false);
    assert.ok(step.x < 10);
  });

  it("still takes a half step when the full step is blocked and the lip is not", () => {
    const blocked = (x: number) => x >= 12;
    const step = lipStep(9, 0, 4, 0, blocked, 4);
    assert.equal(step.slipped, false);
    assert.equal(step.x, 11);
  });
});

describe("stepCamera", () => {
  it("does not move while the focus stays inside the deadzone", () => {
    const next = stepCamera(100, 80, 103, 82, 1 / 60, { deadX: 8, deadY: 6, stiffness: 10 });
    assert.equal(next.x, 100);
    assert.equal(next.y, 80);
  });

  it("eases toward a focus that has left the deadzone", () => {
    const next = stepCamera(0, 0, 40, 0, 1 / 60, { deadX: 8, deadY: 6, stiffness: 10 });
    assert.ok(next.x > 0);
    assert.ok(next.x < 32);
  });
});

describe("hitstop buffer", () => {
  it("keeps a press that arrives during the freeze and spends it after", () => {
    let queued = noteAttackDuringHitstop(false, true, 0.07);
    assert.equal(queued, true);
    queued = noteAttackDuringHitstop(queued, false, 0.04);
    assert.equal(queued, true);
    const released = releaseAttackBuffer(queued, 0, 0);
    assert.equal(released.queued, false);
    assert.equal(released.buffer, ATTACK_BUFFER_S);
  });

  it("does not invent a swing when nothing was pressed", () => {
    const released = releaseAttackBuffer(false, 0, 0.02);
    assert.equal(released.buffer, 0.02);
  });

  it("shortens the freeze under reduced motion and caps it", () => {
    assert.equal(scaleHitstop(0.07, false), 0.07);
    assert.ok(Math.abs(scaleHitstop(0.07, true) - 0.028) < 1e-9);
    assert.equal(scaleHitstop(0.4, false), 0.12);
  });
});
