import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COURSES, getCourse } from "./catalog.ts";
import { medalFor } from "./medals.ts";
import { FEATURED_REPLAYS, MEDAL_FRAMES } from "./measured-runs.ts";
import { runRoute } from "./pilot.ts";
import { rewardsGateCampaign } from "./rewards.ts";
import { sampleGhost } from "./replay.ts";
import {
  armLive,
  createRun,
  finishPoint,
  forceTeleport,
  noteDevice,
  noteFocus,
  pauseRun,
  requestStart,
  resetRun,
  resumeRun,
  setInput,
  startSpawn,
  tick,
  timeSeconds,
} from "./session.ts";
import { recordClear, STORAGE_KEY, loadBoard, type Kv } from "./storage.ts";
import { ASSIST_ACCESS, DT, STANDARD_ACCESS, TILE, emptyInput } from "./types.ts";
import { validateReplay } from "./validator.ts";

function mem(): Kv {
  const box = new Map<string, string>();
  return {
    getItem: (key) => box.get(key) ?? null,
    setItem: (key, value) => {
      box.set(key, value);
    },
  };
}

function place(run: ReturnType<typeof createRun>, tx: number, ty: number) {
  run.sim.body.x = tx * TILE + (TILE - run.sim.body.w) / 2;
  run.sim.body.y = (ty + 1) * TILE - run.sim.body.h;
  run.sim.body.vx = 0;
  run.sim.body.vy = 0;
}

describe("traversal challenges", () => {
  it("keeps 24 courses and strictly measured medals", () => {
    assert.equal(COURSES.length, 24);
    assert.equal(rewardsGateCampaign(), false);
    assert.equal(STORAGE_KEY, "preincarnation.traversal.v1");
    assert.notEqual(STORAGE_KEY, "preincarnation.save.v1");
    for (const course of COURSES) {
      assert.ok(course.routes.length >= 1, course.id);
      assert.ok(course.problem.length > 12, course.id);
      const band = MEDAL_FRAMES[course.id];
      assert.ok(band, course.id);
      assert.ok(band.gold < band.silver && band.silver < band.bronze, course.id);
      assert.equal(medalFor(course.id, band.gold, "standard"), "gold");
      assert.equal(medalFor(course.id, band.silver, "standard"), "silver");
      assert.equal(medalFor(course.id, band.bronze, "standard"), "bronze");
      assert.equal(medalFor(course.id, band.bronze + 1, "standard"), null);
      assert.equal(medalFor(course.id, band.gold, "assist"), null);
    }
  });

  it("rejects a teleport and a forged replay", () => {
    const course = getCourse("a1-ribbon");
    assert.ok(course);
    const run = createRun(course, STANDARD_ACCESS);
    armLive(run, true);
    setInput(run, { ...emptyInput(), x: 1 });
    tick(run);
    const fin = finishPoint(course);
    forceTeleport(run, fin.x, fin.y);
    place(run, 33, 6);
    const info = tick(run);
    assert.equal(info.finished, false);
    assert.equal(run.finished, false);
    assert.equal(run.invalid, "teleport");

    const replay = FEATURED_REPLAYS["a1-ribbon"];
    assert.ok(replay);
    const honest = validateReplay(course, replay);
    assert.equal(honest.ok, true, honest.reasons.join(","));
    const forged = structuredClone(replay);
    const frame = forged.frames[20];
    assert.ok(frame);
    frame.x += 80;
    const bad = validateReplay(course, forged);
    assert.equal(bad.ok, false);
    assert.ok(bad.reasons.includes("position-mismatch") || bad.reasons.includes("teleport"));
  });

  it("ignores checkpoints taken out of order and a finish that skipped them", () => {
    const course = getCourse("a1-ribbon");
    assert.ok(course);
    const run = createRun(course, STANDARD_ACCESS);
    armLive(run, true);
    place(run, 15, 6);
    tick(run);
    assert.equal(run.nextCheck, 0);
    place(run, 9, 6);
    tick(run);
    assert.equal(run.nextCheck, 1);
    place(run, 33, 6);
    const info = tick(run);
    assert.equal(info.finished, false);
    assert.equal(run.finished, false);

    const replay = structuredClone(FEATURED_REPLAYS["a1-ribbon"]!);
    replay.frames = replay.frames.slice(0, 40);
    replay.finished = true;
    const verdict = validateReplay(course, replay);
    assert.equal(verdict.ok, false);
    assert.ok(verdict.reasons.includes("unfinished") || verdict.reasons.includes("checkpoint-order"));
  });

  it("does not count pause, focus loss, or a device change", () => {
    const course = getCourse("a2-switchback");
    assert.ok(course);
    const run = createRun(course, STANDARD_ACCESS);
    armLive(run, true);
    setInput(run, { ...emptyInput(), x: 1 });
    for (let i = 0; i < 12; i++) tick(run);
    const live = run.liveFrames;
    pauseRun(run, "manual");
    for (let i = 0; i < 40; i++) tick(run);
    assert.equal(run.liveFrames, live);
    assert.equal(run.phase, "paused");
    resumeRun(run);
    tick(run);
    assert.equal(run.liveFrames, live + 1);

    noteFocus(run, false);
    assert.equal(run.phase, "paused");
    assert.equal(run.pauseReason, "focus");
    const held = run.liveFrames;
    for (let i = 0; i < 25; i++) tick(run);
    noteFocus(run, true);
    assert.equal(run.phase, "paused");
    assert.equal(run.liveFrames, held);
    resumeRun(run);

    noteDevice(run, "touch");
    assert.equal(run.phase, "paused");
    assert.equal(run.pauseReason, "device");
    const again = run.liveFrames;
    for (let i = 0; i < 15; i++) tick(run);
    assert.equal(run.liveFrames, again);
    assert.equal(timeSeconds(run), again * DT);
  });

  it("resets a false start and keeps the clock at zero until go", () => {
    const course = getCourse("b1-sugar");
    assert.ok(course);
    const run = createRun(course, STANDARD_ACCESS);
    requestStart(run);
    assert.equal(run.phase, "countdown");
    setInput(run, { ...emptyInput(), jump: true });
    tick(run);
    assert.equal(run.falseStart, true);
    assert.equal(run.countdown, 3);
    assert.equal(run.liveFrames, 0);
    for (let i = 0; i < 20; i++) tick(run);
    assert.equal(run.phase, "countdown");
    assert.equal(timeSeconds(run), 0);
    setInput(run, emptyInput());
    let guard = 0;
    let phase: string = run.phase;
    while (phase !== "live" && guard < 400) {
      tick(run);
      guard += 1;
      phase = run.phase;
      assert.equal(run.liveFrames, 0);
    }
    assert.equal(run.phase, "live");
    assert.equal(timeSeconds(run), 0);
    tick(run);
    assert.equal(run.liveFrames, 1);
  });

  it("respawns a death without finishing or writing a best", () => {
    const course = getCourse("a1-ribbon");
    assert.ok(course);
    const run = createRun(course, STANDARD_ACCESS);
    armLive(run, true);
    const spawn = startSpawn(course);
    place(run, 6, 8);
    const checks = run.nextCheck;
    const info = tick(run);
    assert.equal(info.died, true);
    assert.equal(run.sim.lastDeath, "spike");
    assert.equal(run.finished, false);
    assert.equal(run.nextCheck, checks);
    assert.equal(run.sim.deaths, 1);
    assert.ok(Math.abs(run.sim.body.x - spawn.x) < 1);
    const kv = mem();
    const saved = recordClear(kv, run);
    assert.equal(saved.saved, false);
    assert.equal(kv.getItem(STORAGE_KEY), null);
  });

  it("never lets a ghost move the body or plant a rod", () => {
    const course = getCourse("a1-ribbon");
    assert.ok(course);
    const run = createRun(course, STANDARD_ACCESS);
    armLive(run, true);
    let reads = 0;
    const ghost = {
      frames: [{ x: finishPoint(course).x, y: finishPoint(course).y }],
      fakeRod: { tx: 8, ty: 6 },
    };
    run.ghost = new Proxy(ghost, {
      get(target, prop, receiver) {
        reads += 1;
        return Reflect.get(target, prop, receiver);
      },
    });
    setInput(run, emptyInput());
    for (let i = 0; i < 20; i++) tick(run);
    assert.equal(reads, 0);
    assert.equal(run.finished, false);
    assert.equal(run.sim.rod, null);
    assert.ok(sampleGhost(FEATURED_REPLAYS["a1-ribbon"]!, 0));
  });

  it("moves left on A and right on D", () => {
    const course = getCourse("a1-ribbon");
    assert.ok(course);
    const run = createRun(course, STANDARD_ACCESS);
    armLive(run, true);
    const origin = run.sim.body.x;
    setInput(run, { ...emptyInput(), x: -1 });
    for (let i = 0; i < 20; i++) tick(run);
    assert.ok(run.sim.body.x < origin - 8, `A moved to ${run.sim.body.x} from ${origin}`);
    resetRun(run);
    armLive(run, true);
    const again = run.sim.body.x;
    setInput(run, { ...emptyInput(), x: 1 });
    for (let i = 0; i < 20; i++) tick(run);
    assert.ok(run.sim.body.x > again + 8, `D moved to ${run.sim.body.x} from ${again}`);
  });

  it("stores assist apart from ranked medals", () => {
    const course = getCourse("b2-boots");
    assert.ok(course);
    const run = createRun(course, ASSIST_ACCESS, true);
    run.finished = true;
    run.phase = "finished";
    run.nextCheck = course.checks.length;
    run.liveFrames = 400;
    const kv = mem();
    const saved = recordClear(kv, run);
    assert.equal(saved.saved, true);
    assert.equal(saved.medal, null);
    assert.equal(saved.note, course.fieldNote);
    const board = loadBoard(kv);
    assert.equal(board.standard[course.id], undefined);
    assert.equal(board.assist[course.id]?.frames, 400);
    assert.ok(board.notes.includes(course.id));
    assert.equal(rewardsGateCampaign(), false);
  });

  it("reaches the sugar bell on the measured line", () => {
    const course = getCourse("b1-sugar");
    assert.ok(course);
    const route = course.routes[0];
    assert.ok(route);
    const attempt = runRoute(course, route, 0, 2000);
    assert.equal(attempt.ok, true, attempt.reason);
    assert.equal(attempt.frames, MEDAL_FRAMES["b1-sugar"]!.gold);
    assert.equal(validateReplay(course, attempt.replay).ok, true);
  });
});
