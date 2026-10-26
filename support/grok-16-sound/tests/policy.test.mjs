import assert from "node:assert/strict";
import test from "node:test";

import {
  chooseVariant,
  createPolicyState,
  gainFromSlider,
  planPlay,
  requestVoice,
} from "../mixer/policy.js";

function cue(partial) {
  return {
    id: "step",
    bus: "effects",
    priority: 3,
    files: [{}, {}, {}],
    variantMode: "round-robin",
    overlap: { mode: "protect", group: "footstep", minIntervalMs: 85, maxVoices: 2 },
    warning: null,
    duck: null,
    ...partial,
  };
}

test("slider gain is squared, zero at the bottom, monotonic", () => {
  assert.equal(gainFromSlider(0), 0);
  assert.equal(gainFromSlider(1), 1);
  assert.equal(gainFromSlider(0.5), 0.25);
  let prev = -1;
  for (let i = 0; i <= 10; i += 1) {
    const value = gainFromSlider(i / 10);
    assert.ok(value >= prev);
    prev = value;
  }
});

test("overlap guard rejects a retrigger inside the window and does not take a voice", () => {
  const state = createPolicyState();
  const first = planPlay(state, cue(), 1000);
  const second = planPlay(state, cue(), 1040);
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
  assert.equal(second.reason, "overlap");
  assert.equal(state.voices.length, 1);
  assert.equal(second.variant, null);
  assert.equal(state.rr.get("step"), 1);
});

test("round robin advances only when the voice is accepted", () => {
  const state = createPolicyState();
  const focus = cue({
    id: "ui_focus",
    bus: "ui",
    files: [{}, {}],
    variantMode: "round-robin",
    overlap: { mode: "protect", group: "ui-focus", minIntervalMs: 45, maxVoices: 1 },
  });
  const a = planPlay(state, focus, 0);
  const blocked = planPlay(state, focus, 20);
  const b = planPlay(state, focus, 50);
  assert.equal(a.variant, 0);
  assert.equal(blocked.accepted, false);
  assert.equal(b.variant, 1);
});

test("random no-repeat does not hand back the same variant twice", () => {
  const state = createPolicyState();
  const step = cue({ variantMode: "random-no-repeat", overlap: { mode: "poly", maxVoices: 0 } });
  const rng = () => 0;
  const first = planPlay(state, step, 0, { rng });
  const second = planPlay(state, step, 10, { rng });
  assert.equal(first.variant, 0);
  assert.notEqual(second.variant, first.variant);
});

test("a full pool steals the oldest lowest-priority voice", () => {
  const state = createPolicyState();
  const limits = { effects: 2 };
  const low = cue({ id: "low", priority: 1, overlap: { mode: "poly" }, files: [{}] });
  const high = cue({ id: "high", priority: 8, overlap: { mode: "poly" }, files: [{}] });
  const a = planPlay(state, { ...low, id: "a" }, 1, { poolLimits: limits });
  const b = planPlay(state, { ...low, id: "b" }, 2, { poolLimits: limits });
  const c = planPlay(state, high, 3, { poolLimits: limits });
  assert.equal(c.accepted, true);
  assert.deepEqual(c.stolen.map((voice) => voice.id), [a.voice.id]);
  assert.deepEqual(
    state.voices.map((voice) => voice.cueId),
    ["b", "high"],
  );
  assert.ok(b.voice.id);
});

test("a lower priority request cannot steal a higher one", () => {
  const state = createPolicyState();
  const limits = { effects: 1 };
  const high = cue({ id: "boss", priority: 10, overlap: { mode: "poly" }, files: [{}] });
  const low = cue({ id: "hover", priority: 1, overlap: { mode: "poly" }, files: [{}] });
  planPlay(state, high, 1, { poolLimits: limits });
  const denied = planPlay(state, low, 2, { poolLimits: limits });
  assert.equal(denied.accepted, false);
  assert.equal(denied.reason, "priority");
  assert.equal(state.voices[0].cueId, "boss");
});

test("replace restarts the same cue and restores nothing when it fits", () => {
  const state = createPolicyState();
  const item = cue({
    id: "lamp_hum",
    overlap: { mode: "replace", group: "lamp-hum", minIntervalMs: 0, maxVoices: 1 },
    files: [{}],
  });
  const first = planPlay(state, item, 1);
  const second = planPlay(state, item, 2);
  assert.equal(second.accepted, true);
  assert.equal(second.stolen[0].id, first.voice.id);
  assert.equal(state.voices.length, 1);
  assert.equal(state.voices[0].id, second.voice.id);
});

test("group cap steals the oldest voice in the group", () => {
  const state = createPolicyState();
  const swing = cue({
    id: "blade_swing",
    overlap: { mode: "poly", group: "blade-swing", minIntervalMs: 0, maxVoices: 2 },
  });
  planPlay(state, swing, 1);
  planPlay(state, swing, 2);
  const third = planPlay(state, swing, 3);
  assert.equal(third.accepted, true);
  assert.equal(third.stolen.length, 1);
  assert.equal(state.voices.length, 2);
});

test("warning payload is attached and gameplay is never marked changed", () => {
  const state = createPolicyState();
  const warn = cue({
    id: "warn_health",
    files: [{}],
    overlap: { mode: "poly" },
    warning: { kind: "vignette", copy: "You are badly hurt.", tone: "danger", persistMs: 800 },
  });
  const decision = planPlay(state, warn, 5);
  assert.equal(decision.visual.copy, "You are badly hurt.");
  assert.equal(decision.gameplay, "unchanged");
  assert.equal(decision.duck, null);
});

test("requestVoice min interval uses the group key", () => {
  const state = createPolicyState();
  const spec = {
    cueId: "step_snow",
    group: "footstep",
    priority: 2,
    minIntervalMs: 85,
    maxVoices: 2,
    mode: "protect",
    pool: "effects",
    poolLimit: 10,
  };
  assert.equal(requestVoice(state, { ...spec, now: 0 }).accepted, true);
  assert.equal(requestVoice(state, { ...spec, cueId: "step_stone", now: 50 }).reason, "overlap");
});

test("chooseVariant without commit does not move the wheel", () => {
  const state = createPolicyState();
  const item = cue({ files: [{}, {}, {}] });
  assert.equal(chooseVariant(state, item, null, Math.random, false), 0);
  assert.equal(chooseVariant(state, item, null, Math.random, false), 0);
  assert.equal(chooseVariant(state, item, null, Math.random, true), 0);
  assert.equal(chooseVariant(state, item, null, Math.random, true), 1);
});
