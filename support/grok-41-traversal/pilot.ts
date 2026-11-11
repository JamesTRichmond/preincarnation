import { TILE, emptyInput, type Course, type HeldInput, type PilotRoute } from "./types.ts";
import { SUGAR_RANGE, bodyCenter, listAnchors, type Sim } from "./physics.ts";
import { cellAt, gateClosed, tileCenter } from "./world.ts";
import { armLive, buildReplay, createRun, setInput, tick, type Run } from "./session.ts";
import type { Replay } from "./replay.ts";
import { STANDARD_ACCESS } from "./types.ts";

export type Attempt = {
  ok: boolean;
  frames: number;
  deaths: number;
  stamps: string[];
  checks: number;
  need: number;
  replay: Replay;
  reason: string;
  x: number;
  y: number;
  waypoint: number;
};

type Gap = {
  airStart: number;
  width: number;
  dropTiles: number;
  riseTiles: number;
  lethal: boolean;
};

type Brain = {
  index: number;
  holdJump: number;
  wantBoots: boolean;
  bootsPhase: 0 | 1 | 2;
  glide: boolean;
  stuck: number;
  still: number;
  prevX: number;
  prevY: number;
  hesitateLeft: number;
  hesitateEach: number;
  rodArmed: boolean;
  sugarRelease: boolean;
};

function wall(sim: Sim, tx: number, ty: number): boolean {
  if (tx < 0 || tx >= sim.course.width) return true;
  if (ty < 0 || ty >= sim.course.height) return false;
  if (sim.rod && sim.rod.life > 0 && sim.rod.tx === tx && sim.rod.ty === ty) return true;
  const c = cellAt(sim.course, tx, ty);
  if (c === "solid") return true;
  if (c === "membrane") return !(sim.course.kit.cape && sim.capeOpen);
  if (c === "gate") return gateClosed(sim.time);
  return false;
}

function floorAt(sim: Sim, tx: number, ty: number): boolean {
  if (wall(sim, tx, ty)) return true;
  if (sim.rod && sim.rod.life > 0 && sim.rod.tx === tx && sim.rod.ty === ty) return true;
  const c = cellAt(sim.course, tx, ty);
  if (c === "oneway") return true;
  if (c === "veil" && sim.veilActive) return true;
  return false;
}

function probe(sim: Sim, dir: -1 | 1): Gap {
  const feetY = sim.body.y + sim.body.h;
  const front = dir > 0 ? sim.body.x + sim.body.w + 1 : sim.body.x - 1;
  let airStart = -1;
  let lethal = false;
  for (let i = 0; i < 220; i++) {
    const x = front + dir * i;
    const tx = Math.floor(x / TILE);
    const footTy = Math.floor((feetY + 1) / TILE);
    if (floorAt(sim, tx, footTy)) {
      if (airStart < 0) continue;
      return { airStart, width: i - airStart, dropTiles: 0, riseTiles: 0, lethal };
    }
    if (airStart < 0) airStart = i;
    const bodyTy = Math.floor((sim.body.y + sim.body.h / 2) / TILE);
    if (wall(sim, tx, bodyTy)) {
      let rise = 0;
      while (rise < 6 && wall(sim, tx, footTy - 1 - rise)) rise++;
      return { airStart, width: 0, dropTiles: 0, riseTiles: Math.max(1, rise), lethal };
    }
    let drop = 0;
    for (let d = 1; d <= 12; d++) {
      const c = cellAt(sim.course, tx, footTy + d);
      if (c === "void" || c === "spike" || c === "veil") lethal = true;
      if (floorAt(sim, tx, footTy + d) || c === "water") {
        drop = d;
        break;
      }
    }
    if (drop > 0) {
      return { airStart, width: Math.max(1, i - airStart), dropTiles: drop, riseTiles: 0, lethal };
    }
  }
  return { airStart: airStart < 0 ? 0 : airStart, width: 999, dropTiles: 99, riseTiles: 0, lethal: true };
}

function ceiling(sim: Sim): number {
  const x = sim.body.x + sim.body.w / 2;
  for (let i = 2; i < 96; i++) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor((sim.body.y - i) / TILE);
    if (wall(sim, tx, ty)) return i;
  }
  return 96;
}

function gateAhead(sim: Sim, dir: -1 | 1): boolean {
  const front = dir > 0 ? sim.body.x + sim.body.w + 2 : sim.body.x - 2;
  for (const y of [sim.body.y + 3, sim.body.y + sim.body.h / 2, sim.body.y + sim.body.h - 3]) {
    const tx = Math.floor(front / TILE);
    const ty = Math.floor(y / TILE);
    if (cellAt(sim.course, tx, ty) === "gate" && gateClosed(sim.time)) return true;
  }
  return false;
}

function onSocket(sim: Sim): boolean {
  const l = Math.floor(sim.body.x / TILE);
  const r = Math.floor((sim.body.x + sim.body.w - 1) / TILE);
  const t = Math.floor(sim.body.y / TILE);
  const b = Math.floor((sim.body.y + sim.body.h - 1) / TILE);
  for (let ty = t; ty <= b; ty++) {
    for (let tx = l; tx <= r; tx++) {
      if (cellAt(sim.course, tx, ty) === "socket") return true;
    }
  }
  return false;
}

function finishTile(course: { width: number; height: number; cells: string[] }): { tx: number; ty: number } | null {
  for (let ty = 0; ty < course.height; ty++) {
    for (let tx = 0; tx < course.width; tx++) {
      if (course.cells[ty * course.width + tx] === "finish") return { tx, ty };
    }
  }
  return null;
}

function onOneWay(sim: Sim): boolean {
  const feet = sim.body.y + sim.body.h + 1;
  const xs = [sim.body.x + 2, sim.body.x + sim.body.w / 2, sim.body.x + sim.body.w - 2];
  for (const x of xs) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(feet / TILE);
    if (cellAt(sim.course, tx, ty) === "oneway") return true;
  }
  return false;
}

function veilNear(sim: Sim): boolean {
  const xs = [sim.body.x + sim.body.w / 2 - 6, sim.body.x + sim.body.w / 2, sim.body.x + sim.body.w / 2 + 10];
  const ys = [sim.body.y + sim.body.h + 1, sim.body.y + sim.body.h + TILE, sim.body.y + sim.body.h / 2];
  for (const x of xs) {
    for (const y of ys) {
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      if (cellAt(sim.course, tx, ty) === "veil") return true;
    }
  }
  return false;
}

function los(sim: Sim, ax: number, ay: number): boolean {
  const x0 = sim.body.x + sim.body.w / 2;
  const y0 = sim.body.y + sim.body.h / 2;
  const steps = Math.max(1, Math.ceil(Math.hypot(ax - x0, ay - y0) / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + (ax - x0) * t;
    const y = y0 + (ay - y0) * t;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (cellAt(sim.course, tx, ty) === "anchor") continue;
    if (wall(sim, tx, ty)) return false;
  }
  return true;
}

function decide(sim: Sim, route: PilotRoute, brain: Brain): HeldInput {
  const input = emptyInput();
  if (brain.hesitateLeft > 0) {
    brain.hesitateLeft -= 1;
    return input;
  }
  const point = route.points[brain.index];
  const fin = finishTile(sim.course);
  const synthetic = !point;
  const goal = point ?? (fin ? { tx: fin.tx, ty: fin.ty, hint: undefined } : undefined);
  if (!goal) {
    input.x = 0;
    return input;
  }
  const target = tileCenter(goal.tx, goal.ty);
  const c = bodyCenter(sim.body);
  const dx = target.x - c.x;
  const dy = target.y - c.y;
  const adx = Math.abs(dx);
  const hint = goal.hint;
  const dir: -1 | 1 = dx === 0 ? sim.facing : dx > 0 ? 1 : -1;

  const kit = sim.course.kit;
  if ((hint === "void" || veilNear(sim)) && kit.voidStep) {
    sim.veilActive = true;
  }
  if (hint === "glide" && kit.cape) sim.capeOpen = true;

  // Plant the rod before a waypoint on the socket can be consumed.
  if (kit.rod && onSocket(sim) && !sim.rod && (hint === "rod" || hint === "jump")) {
    input.rod = true;
    input.y = -1;
    input.x = 0;
    return input;
  }

  if (adx < 14 && Math.abs(dy) < 28 && (sim.grounded || sim.inWater || sim.sugar)) {
    if (!synthetic) {
      brain.index += 1;
      brain.hesitateLeft = brain.hesitateEach;
      brain.wantBoots = false;
      brain.bootsPhase = 0;
      if (hint !== "glide") brain.glide = false;
    } else {
      input.x = 0;
    }
    return input;
  }
  // Passed a floor waypoint and the next one is closer: don't moonwalk.
  const next = route.points[brain.index + 1];
  if (next && sim.grounded && adx < 36) {
    const n = tileCenter(next.tx, next.ty);
    const nd = Math.hypot(n.x - c.x, n.y - c.y);
    if (nd + 4 < Math.hypot(dx, dy)) {
      brain.index += 1;
      brain.hesitateLeft = brain.hesitateEach;
      return input;
    }
  }

  const gap = probe(sim, dir);
  const lowCeil = ceiling(sim) < 42;

  if (hint === "void" || (kit.voidStep && veilNear(sim) && hint !== "swim")) input.voidStep = true;

  if (sim.inWater && kit.fins && hint !== "sugar") {
    input.x = adx < 4 ? 0 : dir;
    let yAim: -1 | 0 | 1 = Math.abs(dy) < 8 ? 0 : dy > 0 ? 1 : -1;
    if (yAim < 0) {
      const tx = Math.floor((sim.body.x + sim.body.w / 2) / TILE);
      const ty = Math.floor((sim.body.y - 2) / TILE);
      if (wall(sim, tx, ty)) yAim = 0;
    }
    input.y = yAim;
    return input;
  }

  if (hint === "swim" && kit.fins) {
    input.x = adx < 5 ? 0 : dir;
    input.y = Math.abs(dy) < 6 ? 0 : dy > 0 ? 1 : -1;
    if (sim.inWater) return input;
  }

  if (gateAhead(sim, dir) || hint === "wait" && gateAhead(sim, dir)) {
    input.x = 0;
    return input;
  }

  // Sugar reel.
  if (sim.sugar && (hint === "sugar" || kit.sugar)) {
    input.sugar = true;
    const d = Math.hypot(sim.sugar.x - c.x, sim.sugar.y - c.y);
    if (d < 12 || (adx < 28 && c.y < target.y + 8)) {
      input.sugar = false;
      input.jump = true;
      brain.sugarRelease = true;
    }
    return input;
  }

  const sugarNow =
    kit.sugar &&
    !sim.sugar &&
    (hint === "sugar" ||
      ((hint === undefined || hint === "jump") && gap.width >= 72 && gap.lethal));
  if (sugarNow) {
    let best: { x: number; y: number; score: number } | null = null;
    const here = Math.hypot(dx, dy);
    for (const a of listAnchors(sim)) {
      const dp = Math.hypot(a.x - c.x, a.y - c.y);
      if (dp > SUGAR_RANGE) continue;
      if (!los(sim, a.x, a.y)) continue;
      const dt = Math.hypot(a.x - target.x, a.y - target.y);
      if (dt > here - 4) continue;
      const score = here - dt;
      if (!best || score > best.score) best = { x: a.x, y: a.y, score };
    }
    if (best) {
      input.x = Math.abs(best.x - c.x) < 6 ? 0 : best.x > c.x ? 1 : -1;
      input.y = best.y < c.y - 8 ? -1 : 0;
      input.sugar = true;
      if (gap.airStart < 8 && gap.width > 8 && sim.grounded) input.jump = true;
      return input;
    }
  }

  if (hint === "drop" || (dy > 28 && onOneWay(sim) && adx < 28)) {
    input.drop = true;
    input.y = 1;
    input.x = adx < 8 ? 0 : dir;
    return input;
  }

  if ((hint === "rod" || (kit.rod && gap.riseTiles >= 4)) && kit.rod && onSocket(sim) && !sim.rod) {
    if (brain.rodArmed) {
      input.rod = true;
      input.y = -1;
      brain.rodArmed = false;
    } else {
      brain.rodArmed = true;
    }
    input.x = 0;
    return input;
  }

  input.x = adx < 4 ? 0 : dir;

  const walkOff =
    gap.dropTiles >= 2 &&
    hint !== "jump" &&
    hint !== "boots" &&
    hint !== "short" &&
    hint !== "sugar";

  const wantJump =
    !walkOff &&
    hint !== "void" &&
    hint !== "swim" &&
    sim.grounded &&
    gap.airStart < 12 &&
    (gap.width >= 12 ||
      gap.riseTiles >= 1 ||
      (dy < -18 && adx < 36) ||
      hint === "jump" ||
      hint === "boots" ||
      hint === "glide" ||
      hint === "short");

  const bootsGap = hint === "boots" || (hint !== "void" && hint !== "sugar" && hint !== "swim" && kit.boots && gap.width >= 84 && gap.width < 200 && gap.dropTiles <= 2);
  const short = hint === "short" || (hint !== "void" && lowCeil && gap.riseTiles === 0 && gap.width > 0 && gap.width < 48);

  if (wantJump && brain.holdJump <= 0 && brain.bootsPhase === 0) {
    const real =
      gap.width >= 12 ||
      gap.riseTiles >= 1 ||
      dy < -18 ||
      hint === "boots" ||
      hint === "glide" ||
      hint === "short" ||
      hint === "jump";
    if (real && gap.airStart < 14) {
      brain.holdJump = short ? 1 : 16;
      brain.wantBoots = Boolean(bootsGap && kit.boots);
      brain.bootsPhase = 0;
      if (hint === "glide" || (kit.cape && gap.dropTiles >= 2 && gap.width >= 48)) brain.glide = true;
    }
  }

  if (brain.holdJump > 0) {
    input.jump = true;
    brain.holdJump -= 1;
  } else if (brain.wantBoots && kit.boots && !sim.grounded && !sim.hopUsed) {
    if (brain.bootsPhase === 0) {
      input.jump = false;
      brain.bootsPhase = 1;
    } else if (brain.bootsPhase === 1) {
      input.jump = true;
      brain.holdJump = 14;
      brain.bootsPhase = 2;
      brain.wantBoots = false;
    }
  }

  if ((brain.glide || hint === "glide") && kit.cape && !sim.grounded) input.glide = true;
  if (hint === "glide") brain.glide = true;
  if (sim.grounded && hint !== "glide") brain.glide = false;

  if (hint === "rod" && sim.rod && sim.grounded && (dy < -12 || gap.riseTiles >= 1)) {
    input.x = adx < 4 ? 0 : dir;
    input.jump = true;
    brain.holdJump = 14;
  }

  // Step-up when a wall is in the face. Never hop off a veil or out of a swim.
  if (
    hint !== "void" &&
    hint !== "swim" &&
    hint !== "glide" &&
    sim.grounded &&
    gap.riseTiles >= 1 &&
    gap.riseTiles <= 3 &&
    brain.holdJump <= 0 &&
    gap.airStart < 6
  ) {
    brain.holdJump = lowCeil ? 1 : 12;
    input.jump = true;
  }

  return input;
}

export function runRoute(
  course: Course,
  route: PilotRoute,
  hesitateEach = 0,
  frameCap = 3600,
  leadIn = 0,
): Attempt {
  const run: Run = createRun(course, STANDARD_ACCESS, false);
  armLive(run, true);
  const brain: Brain = {
    index: 0,
    holdJump: 0,
    wantBoots: false,
    bootsPhase: 0,
    glide: false,
    stuck: 0,
    still: 0,
    prevX: run.sim.body.x,
    prevY: run.sim.body.y,
    hesitateLeft: hesitateEach,
    hesitateEach,
    rodArmed: true,
    sugarRelease: false,
  };

  let reason = "timeout";
  let lead = leadIn;
  for (let f = 0; f < frameCap; f++) {
    const waiting = lead > 0;
    if (waiting) lead -= 1;
    const input = waiting ? emptyInput() : decide(run.sim, route, brain);
    setInput(run, input);
    const info = tick(run);
    if (info.died) {
      /* keep going; medals require zero deaths, checked by the caller */
    }
    if (waiting) {
      brain.prevX = run.sim.body.x;
      brain.prevY = run.sim.body.y;
      continue;
    }
    const moved = Math.hypot(run.sim.body.x - brain.prevX, run.sim.body.y - brain.prevY);
    if (moved < 0.35 && brain.hesitateLeft <= 0 && !run.sim.sugar) brain.still += 1;
    else brain.still = 0;
    brain.prevX = run.sim.body.x;
    brain.prevY = run.sim.body.y;
    if (brain.still === 28 && run.sim.grounded) {
      brain.holdJump = 10;
      brain.still = 0;
      brain.stuck += 1;
    }
    if (run.finished && run.invalid == null) {
      reason = "clear";
      break;
    }
    if (brain.stuck >= 8) {
      reason = "stuck";
      break;
    }
  }

  const c = bodyCenter(run.sim.body);
  return {
    ok: reason === "clear" && run.sim.deaths === 0 && run.finished,
    frames: run.liveFrames,
    deaths: run.sim.deaths,
    stamps: [...run.stamps],
    checks: run.nextCheck,
    need: run.course.checks.length,
    replay: buildReplay(run),
    reason: run.finished && run.sim.deaths > 0 ? "death" : reason,
    x: Math.round(c.x),
    y: Math.round(c.y),
    waypoint: brain.index,
  };
}
