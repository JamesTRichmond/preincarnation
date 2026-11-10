import {
  DT,
  type AccessProfile,
  type Course,
  type HeldInput,
  type InvalidReason,
  emptyInput,
} from "./types.ts";
import { cellAt } from "./world.ts";
import {
  bodyCenter,
  createSim,
  spawnBody,
  stepSim,
  type Sim,
} from "./physics.ts";
import { TILE, PW, PH } from "./types.ts";
import type { Replay, ReplayFrame } from "./replay.ts";
import { captureFrame } from "./replay.ts";

export type Phase = "idle" | "countdown" | "live" | "paused" | "finished";
export type PauseReason = "manual" | "focus" | "device";

/**
 * A ghost is a visual recording. It is stored here so the playground can draw
 * it, and so tests can prove `tick` never feeds it into collision, checkpoints,
 * or the rod block.
 */
export type GhostView = {
  frames: { x: number; y: number }[];
  /** Decorative only. Must not spawn a solid. */
  fakeRod?: { tx: number; ty: number };
};

export type Run = {
  course: Course;
  access: AccessProfile;
  sim: Sim;
  phase: Phase;
  countdown: number;
  falseStart: boolean;
  /** Input must stay neutral this long before a false start rearms. */
  neutralHold: number;
  liveFrames: number;
  pauseReason: PauseReason | null;
  device: string;
  nextCheck: number;
  stamps: string[];
  invalid: InvalidReason | null;
  respawn: { x: number; y: number };
  input: HeldInput;
  replay: ReplayFrame[];
  finished: boolean;
  qaUnranked: boolean;
  /** Ignored by the simulator. */
  ghost: GhostView | null;
  lastX: number;
  lastY: number;
};

export type TickInfo = {
  phase: Phase;
  liveFrames: number;
  falseStart: boolean;
  died: boolean;
  finished: boolean;
};

const COUNTDOWN = 3;
const REARM = 0.2;

export function markerSpawn(course: Course, tx: number, ty: number): { x: number; y: number } {
  return {
    x: tx * TILE + (TILE - PW) / 2,
    y: (ty + 1) * TILE - PH,
  };
}

export function startSpawn(course: Course): { x: number; y: number } {
  const body = spawnBody(course);
  return { x: body.x, y: body.y };
}

function findMarker(course: Course, id: string): { tx: number; ty: number } | null {
  for (let ty = 0; ty < course.height; ty++) {
    for (let tx = 0; tx < course.width; tx++) {
      const i = ty * course.width + tx;
      if (course.checkAt[i] === id) return { tx, ty };
    }
  }
  return null;
}

export function createRun(course: Course, access: AccessProfile, qaUnranked = false): Run {
  const sim = createSim(course, access);
  const spawn = { x: sim.body.x, y: sim.body.y };
  return {
    course,
    access,
    sim,
    phase: "idle",
    countdown: COUNTDOWN,
    falseStart: false,
    neutralHold: 0,
    liveFrames: 0,
    pauseReason: null,
    device: "keyboard",
    nextCheck: 0,
    stamps: [],
    invalid: qaUnranked ? "qa-unranked" : null,
    respawn: spawn,
    input: emptyInput(),
    replay: [],
    finished: false,
    qaUnranked,
    ghost: null,
    lastX: spawn.x,
    lastY: spawn.y,
  };
}

export function resetRun(run: Run) {
  const qa = run.qaUnranked;
  const device = run.device;
  const ghost = run.ghost;
  const fresh = createRun(run.course, run.access, qa);
  fresh.device = device;
  fresh.ghost = ghost;
  Object.assign(run, fresh);
}

export function requestStart(run: Run) {
  if (run.phase === "live" || run.phase === "countdown") return;
  if (run.phase === "finished" || run.phase === "paused") resetRun(run);
  run.phase = "countdown";
  run.countdown = COUNTDOWN;
  run.falseStart = false;
  run.neutralHold = 0;
  run.liveFrames = 0;
  run.replay = [];
  run.finished = false;
  run.nextCheck = 0;
  run.stamps = [];
  run.invalid = run.qaUnranked ? "qa-unranked" : null;
}

/** Measurement / QA only. Skips the countdown and is unranked unless `ranked` is set. */
export function armLive(run: Run, ranked = false) {
  run.phase = "live";
  run.countdown = 0;
  run.falseStart = false;
  run.liveFrames = 0;
  run.replay = [];
  run.finished = false;
  run.nextCheck = 0;
  run.stamps = [];
  if (!ranked) run.invalid = "qa-unranked";
  else if (run.invalid === "qa-unranked") run.invalid = null;
  run.qaUnranked = !ranked;
}

export function pauseRun(run: Run, reason: PauseReason = "manual") {
  if (run.phase !== "live" && run.phase !== "countdown") return;
  run.phase = "paused";
  run.pauseReason = reason;
}

export function resumeRun(run: Run) {
  if (run.phase !== "paused") return;
  run.phase = run.liveFrames > 0 || run.countdown <= 0 ? "live" : "countdown";
  if (run.countdown <= 0 && run.liveFrames === 0 && run.phase === "live") {
    /* resumed into live before GO only if countdown already elapsed */
  }
  if (run.pauseReason && run.liveFrames === 0 && run.countdown > 0) run.phase = "countdown";
  run.pauseReason = null;
}

export function noteFocus(run: Run, visible: boolean) {
  if (!visible) {
    if (run.phase === "live" || run.phase === "countdown") pauseRun(run, "focus");
    return;
  }
  // Regaining focus does not silently consume time; the player resumes.
}

export function noteDevice(run: Run, device: string) {
  if (device === run.device) return;
  const prev = run.device;
  run.device = device;
  if (prev && (run.phase === "live" || run.phase === "countdown")) pauseRun(run, "device");
}

export function setInput(run: Run, input: HeldInput) {
  run.input = input;
}

/** Illegal reposition. Invalidates the attempt even if a finish tile is reached later. */
export function forceTeleport(run: Run, x: number, y: number) {
  run.sim.body.x = x;
  run.sim.body.y = y;
  run.sim.body.vx = 0;
  run.sim.body.vy = 0;
  run.invalid = "teleport";
  run.lastX = x;
  run.lastY = y;
}

function inputNeutral(input: HeldInput): boolean {
  return (
    input.x === 0 &&
    input.y === 0 &&
    !input.jump &&
    !input.sugar &&
    !input.glide &&
    !input.rod &&
    !input.voidStep &&
    !input.drop
  );
}

export function tick(run: Run): TickInfo {
  // Ghost payload is intentionally unread. Touching it here would be a bug.
  const info: TickInfo = {
    phase: run.phase,
    liveFrames: run.liveFrames,
    falseStart: run.falseStart,
    died: false,
    finished: run.finished,
  };
  if (run.phase === "idle" || run.phase === "finished" || run.phase === "paused") return info;

  if (run.phase === "countdown") {
    if (!inputNeutral(run.input)) {
      run.falseStart = true;
      run.countdown = COUNTDOWN;
      run.neutralHold = 0;
      info.falseStart = true;
      return info;
    }
    if (run.falseStart && run.neutralHold < REARM) {
      run.neutralHold += DT;
      return info;
    }
    run.countdown -= DT;
    if (run.countdown <= 0) {
      run.countdown = 0;
      run.phase = "live";
      run.falseStart = false;
    }
    info.phase = run.phase;
    return info;
  }

  // live
  const beforeX = run.sim.body.x;
  const beforeY = run.sim.body.y;
  const events = stepSim(run.sim, run.input, run.respawn);
  const stepped = Math.hypot(run.sim.body.x - beforeX, run.sim.body.y - beforeY);
  if (!events.respawned && !run.sim.respawned && stepped > 36) {
    run.invalid = "teleport";
  }
  run.lastX = run.sim.body.x;
  run.lastY = run.sim.body.y;
  run.liveFrames += 1;
  run.replay.push(captureFrame(run.sim, run.input, events.respawned));

  if (events.died) info.died = true;

  for (const id of events.checks) {
    const expect = run.course.checks[run.nextCheck];
    if (id === expect) {
      run.nextCheck += 1;
      const marker = findMarker(run.course, id);
      if (marker) run.respawn = markerSpawn(run.course, marker.tx, marker.ty);
    }
    // A later checkpoint touched early does not advance and does not reorder.
  }
  for (const st of events.stamps) {
    if (!run.stamps.includes(st)) run.stamps.push(st);
  }

  const checksDone = run.nextCheck >= run.course.checks.length;
  if (events.finished && checksDone && !run.finished) {
    if (run.invalid === "teleport") {
      info.finished = false;
    } else {
      run.finished = true;
      run.phase = "finished";
      info.finished = true;
    }
  } else if (events.finished && !checksDone) {
    info.finished = false;
  }

  info.phase = run.phase;
  info.liveFrames = run.liveFrames;
  return info;
}

export function timeSeconds(run: Run): number {
  return run.liveFrames * DT;
}

export function buildReplay(run: Run): Replay {
  return {
    version: 1,
    courseId: run.course.id,
    revision: run.course.revision,
    access: run.access.id,
    dt: DT,
    frames: run.replay,
    liveFrames: run.liveFrames,
    deaths: run.sim.deaths,
    checks: run.course.checks.slice(0, run.nextCheck),
    stamps: [...run.stamps],
    finished: run.finished,
    invalid: run.invalid,
  };
}

export function neutral(run: Run) {
  run.input = emptyInput();
}

/** Where a finish marker sits, for tests that must not walk there. */
export function finishPoint(course: Course): { x: number; y: number } {
  for (let ty = 0; ty < course.height; ty++) {
    for (let tx = 0; tx < course.width; tx++) {
      if (cellAt(course, tx, ty) === "finish") return bodyCenter({ x: tx * TILE, y: ty * TILE, w: TILE, h: TILE, vx: 0, vy: 0 });
    }
  }
  return { x: 0, y: 0 };
}
