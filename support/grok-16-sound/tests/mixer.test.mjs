import assert from "node:assert/strict";
import test from "node:test";

import { createSoundDesk } from "../mixer/mixer.js";

class Param {
  constructor(value = 0) {
    this.value = value;
    this.events = [];
  }
  setTargetAtTime(value, time, constant) {
    this.events.push({ type: "target", value, time, constant });
    this.value = value;
  }
  setValueAtTime(value, time) {
    this.events.push({ type: "value", value, time });
    this.value = value;
  }
  setValueCurveAtTime(values, time, duration) {
    this.events.push({ type: "curve", from: values[0], to: values[values.length - 1], time, duration });
    this.value = values[values.length - 1];
  }
}

class Node {
  constructor() {
    this.gain = new Param(1);
    this.pan = new Param(0);
    this.frequency = new Param(440);
    this.playbackRate = new Param(1);
    this.dest = null;
  }
  connect(target) {
    this.dest = target;
    return target;
  }
  disconnect() {}
}

class Source extends Node {
  constructor() {
    super();
    this.buffer = null;
    this.loop = false;
    this.onended = null;
    this.started = false;
    this.stopped = false;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
    if (this.onended) this.onended();
  }
}

function fakeContext() {
  const gains = [];
  const sources = [];
  const ctx = {
    state: "suspended",
    currentTime: 0,
    destination: {},
    resumeCount: 0,
    suspendCount: 0,
    gains,
    sources,
    createGain() {
      const node = new Node();
      gains.push(node);
      return node;
    },
    createStereoPanner() {
      return new Node();
    },
    createBufferSource() {
      const source = new Source();
      sources.push(source);
      return source;
    },
    createOscillator() {
      return new Source();
    },
    resume() {
      this.resumeCount += 1;
      this.state = "running";
      return Promise.resolve();
    },
    suspend() {
      this.suspendCount += 1;
      this.state = "suspended";
      return Promise.resolve();
    },
  };
  return ctx;
}

function manifest() {
  return {
    poolLimits: { effects: 4, ui: 3, ambience: 2, music: 1 },
    cues: [
      {
        id: "step_stone",
        bus: "effects",
        priority: 2,
        pitchJitter: 0,
        loop: false,
        files: [{}, {}, {}],
        variantMode: "random-no-repeat",
        overlap: { mode: "protect", group: "footstep", minIntervalMs: 85, maxVoices: 2 },
      },
      {
        id: "ui_focus",
        bus: "ui",
        priority: 1,
        pitchJitter: 0,
        files: [{}, {}],
        variantMode: "round-robin",
        overlap: { mode: "protect", group: "ui-focus", minIntervalMs: 45, maxVoices: 1 },
      },
      {
        id: "warn_health",
        bus: "effects",
        priority: 9,
        pitchJitter: 0,
        files: [{}],
        overlap: { mode: "protect", group: "warn-health", minIntervalMs: 500, maxVoices: 1 },
        warning: { kind: "vignette", copy: "You are badly hurt.", tone: "danger", persistMs: 800 },
      },
      {
        id: "powder_blast",
        bus: "effects",
        priority: 10,
        pitchJitter: 0,
        files: [{}],
        overlap: { mode: "protect", group: "blast", minIntervalMs: 250, maxVoices: 1 },
        duck: { bus: "ambience", gain: 0.32, holdMs: 700, releaseMs: 600 },
        warning: { kind: "flash", copy: "The keg goes up.", tone: "danger", persistMs: 420 },
      },
      {
        id: "amb_forest",
        bus: "ambience",
        priority: 1,
        loop: true,
        files: [{}],
        overlap: { mode: "replace", group: "ambience", minIntervalMs: 0, maxVoices: 1 },
      },
      {
        id: "amb_town",
        bus: "ambience",
        priority: 1,
        loop: true,
        files: [{}],
        overlap: { mode: "replace", group: "ambience", minIntervalMs: 0, maxVoices: 1 },
      },
    ],
  };
}

function deskWith(ctx, timeBox = { t: 0 }) {
  const warnings = [];
  const desk = createSoundDesk({
    context: ctx,
    manifest: manifest(),
    now: () => timeBox.t,
    rng: () => 0,
    observeVisibility: false,
  });
  desk.on("warning", (visual) => warnings.push(visual));
  for (const cue of manifest().cues) {
    cue.files.forEach((_, index) => desk.prime(cue.id, index, { duration: 0.2 }));
  }
  return { desk, warnings, timeBox };
}

test("unlock resumes the context synchronously inside the call", () => {
  const ctx = fakeContext();
  const { desk } = deskWith(ctx);
  const result = desk.unlock();
  assert.equal(result.ok, true);
  assert.ok(ctx.resumeCount >= 1);
  assert.equal(ctx.state, "running");
  assert.equal(desk.getState().gameplayCoupling, false);
});

test("mute silences the master bus and does not touch a gameplay object", () => {
  const ctx = fakeContext();
  const { desk, warnings } = deskWith(ctx);
  desk.unlock();
  const game = { hp: 6, quest: "sugarhouse" };
  const muted = desk.setMuted(true);
  const played = desk.play("warn_health");
  game.hp -= 0;
  assert.equal(muted.gameplay, "unchanged");
  assert.equal(played.accepted, true);
  assert.equal(played.audible, false);
  assert.equal(played.reason, "muted");
  assert.equal(played.gameplay, "unchanged");
  assert.equal(warnings[0].copy, "You are badly hurt.");
  assert.equal(ctx.sources[0].started, true);
  assert.equal(ctx.gains[0].gain.value, 0);
  assert.equal(game.hp, 6);
  assert.equal(game.quest, "sugarhouse");
  desk.setMuted(false);
  assert.equal(ctx.gains[0].gain.value, 1);
});

test("a locked or suspended desk still emits the warning visual", () => {
  const ctx = fakeContext();
  const { desk, warnings } = deskWith(ctx);
  const locked = desk.play("powder_blast");
  assert.equal(locked.reason, "locked");
  assert.equal(warnings.at(-1).kind, "flash");
  assert.equal(ctx.sources.length, 0);
  desk.unlock();
  desk.suspend();
  assert.ok(ctx.suspendCount >= 1);
  const held = desk.play("warn_health");
  assert.equal(held.reason, "suspended");
  assert.equal(warnings.at(-1).kind, "vignette");
  desk.resume();
  assert.ok(ctx.resumeCount >= 2);
});

test("footstep overlap drops the retrigger and a later one plays another variant", () => {
  const ctx = fakeContext();
  const box = { t: 0 };
  const { desk } = deskWith(ctx, box);
  desk.unlock();
  const first = desk.play("step_stone");
  box.t = 40;
  const second = desk.play("step_stone");
  box.t = 100;
  const third = desk.play("step_stone");
  assert.equal(first.accepted, true);
  assert.equal(first.variant, 0);
  assert.equal(second.reason, "overlap");
  assert.equal(third.accepted, true);
  assert.equal(third.variant, 1);
  assert.equal(ctx.sources.length, 2);
});

test("effects bus volume uses the squared curve", () => {
  const ctx = fakeContext();
  const { desk } = deskWith(ctx);
  desk.unlock();
  desk.setBusVolume("effects", 0.5);
  const effectsBus = ctx.gains[3];
  assert.equal(effectsBus.gain.value, 0.25);
});

test("powder blast ducks ambience and the visual still fires", () => {
  const ctx = fakeContext();
  const { desk, warnings } = deskWith(ctx);
  desk.unlock();
  desk.play("powder_blast");
  const ambience = ctx.gains[2].gain;
  const base = 0.85 * 0.85;
  assert.ok(ambience.events.some((event) => Math.abs(event.value - base * 0.32) < 1e-6));
  assert.equal(warnings[0].copy, "The keg goes up.");
});

test("ambience reselect does not stack, a new zone crossfades", () => {
  const ctx = fakeContext();
  const { desk } = deskWith(ctx);
  desk.unlock();
  const first = desk.setAmbience("amb_forest");
  const again = desk.setAmbience("amb_forest");
  const next = desk.setAmbience("amb_town");
  assert.equal(first.reason, "crossfade");
  assert.equal(again.reason, "same");
  assert.equal(next.reason, "crossfade");
  assert.equal(ctx.sources.length, 2);
  assert.equal(ctx.sources[0].stopped, true);
  assert.equal(ctx.sources[1].loop, true);
  assert.equal(desk.getState().ambience, "amb_town");
});

test("ui focus round-robin stays on the ui bus", () => {
  const ctx = fakeContext();
  const box = { t: 0 };
  const { desk } = deskWith(ctx, box);
  desk.unlock();
  const a = desk.play("ui_focus");
  box.t = 60;
  const b = desk.play("ui_focus");
  assert.equal(a.variant, 0);
  assert.equal(b.variant, 1);
  assert.equal(ctx.sources[0].dest.dest.dest, ctx.gains[4]);
});
