import {
  DT,
  PH,
  PW,
  TILE,
  type AccessProfile,
  type Body,
  type Course,
  type DeathReason,
  type HeldInput,
  type Kit,
  type RodBlock,
} from "./types.ts";
import { cellAt, currentAt, gateClosed, inBounds } from "./world.ts";

/** Tuned with probeJumps(); courses are authored against those measured reaches. */
export const RUN = 108;
export const ACCEL_G = 2400;
export const ACCEL_A = 1500;
export const FRICTION = 2600;
export const GRAV_UP = 860;
export const GRAV_DOWN = 1580;
export const GRAV_APEX = 430;
export const MAX_FALL = 290;
export const JUMP_V = -300;
export const JUMP_CUT = 0.48;
export const BOOTS_V = -270;
export const BOOTS_PUSH = 78;
export const SUGAR_RANGE = 176;
export const SUGAR_SPEED = 168;
export const SWIM = 82;
export const CURRENT = 48;
export const VOID_MAX = 2.15;
export const VOID_DRAIN = 1;
export const VOID_REFILL = 1.7;
export const ROD_LIFE = 6;
export const DROWN_TIME = 0.7;

export type AnchorPt = { x: number; y: number; tx: number; ty: number };

export type Sim = {
  course: Course;
  access: AccessProfile;
  body: Body;
  grounded: boolean;
  coyote: number;
  buffer: number;
  hopUsed: boolean;
  facing: -1 | 1;
  sugar: AnchorPt | null;
  sugarLock: number;
  rod: RodBlock | null;
  voidMeter: number;
  /** Held void-step with meter remaining. Veil tiles are floors only while this is set. */
  veilActive: boolean;
  /** True when the shadow cape is held open. Membranes are passable only then. */
  capeOpen: boolean;
  drown: number;
  dropGrace: number;
  inWater: boolean;
  wasJump: boolean;
  wasSugar: boolean;
  wasRod: boolean;
  invuln: number;
  deaths: number;
  lastDeath: DeathReason | null;
  respawned: boolean;
  time: number;
};

export type StepEvents = {
  died: DeathReason | null;
  respawned: boolean;
  checks: string[];
  stamps: string[];
  finished: boolean;
};

export function makeBody(x: number, y: number): Body {
  return { x, y, w: PW, h: PH, vx: 0, vy: 0 };
}

export function spawnBody(course: Course): Body {
  for (let ty = 0; ty < course.height; ty++) {
    for (let tx = 0; tx < course.width; tx++) {
      if (cellAt(course, tx, ty) === "start") {
        const x = tx * TILE + (TILE - PW) / 2;
        const y = (ty + 1) * TILE - PH;
        return makeBody(x, y);
      }
    }
  }
  throw new Error(`${course.id}: no start`);
}

export function createSim(course: Course, access: AccessProfile): Sim {
  return {
    course,
    access,
    body: spawnBody(course),
    grounded: false,
    coyote: 0,
    buffer: 0,
    hopUsed: false,
    facing: 1,
    sugar: null,
    sugarLock: 0,
    rod: null,
    voidMeter: VOID_MAX * access.voidMeterScale,
    veilActive: false,
    capeOpen: false,
    drown: 0,
    dropGrace: 0,
    inWater: false,
    wasJump: false,
    wasSugar: false,
    wasRod: false,
    invuln: 0,
    deaths: 0,
    lastDeath: null,
    respawned: false,
    time: 0,
  };
}

export function cloneSim(sim: Sim): Sim {
  return {
    ...sim,
    body: { ...sim.body },
    sugar: sim.sugar ? { ...sim.sugar } : null,
    rod: sim.rod ? { ...sim.rod } : null,
  };
}

function cellOf(course: Course, px: number, py: number) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  return { tx, ty, cell: cellAt(course, tx, ty) };
}

export function rectOverlapsCell(
  body: Body,
  tx: number,
  ty: number,
  pad: number,
): boolean {
  const l = tx * TILE - pad;
  const t = ty * TILE - pad;
  const r = l + TILE + pad * 2;
  const b = t + TILE + pad * 2;
  return body.x < r && body.x + body.w > l && body.y < b && body.y + body.h > t;
}

function forEachOverlap(
  body: Body,
  insetX: number,
  insetY: number,
  fn: (tx: number, ty: number) => void,
) {
  const l = body.x + insetX;
  const t = body.y + insetY;
  const r = body.x + body.w - insetX - 0.001;
  const b = body.y + body.h - insetY - 0.001;
  const x0 = Math.floor(l / TILE);
  const x1 = Math.floor(r / TILE);
  const y0 = Math.floor(t / TILE);
  const y1 = Math.floor(b / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) fn(tx, ty);
  }
}

function blocked(
  sim: Sim,
  tx: number,
  ty: number,
): boolean {
  const { course } = sim;
  if (tx < 0 || tx >= course.width) return true;
  if (ty < 0 || ty >= course.height) return false;
  if (sim.rod && sim.rod.life > 0 && sim.rod.tx === tx && sim.rod.ty === ty) return true;
  const c = cellAt(course, tx, ty);
  if (c === "solid") return true;
  if (c === "membrane") return !(sim.course.kit.cape && sim.capeOpen);
  if (c === "gate") return gateClosed(sim.time);
  return false;
}

function onewayTile(sim: Sim, tx: number, ty: number): boolean {
  if (!inBounds(sim.course, tx, ty)) return false;
  const c = cellAt(sim.course, tx, ty);
  if (c === "oneway") return true;
  if (c === "veil" && sim.veilActive) return true;
  return false;
}

function resolveX(sim: Sim) {
  const body = sim.body;
  const prevRight = body.x + body.w - body.vx * DT;
  const prevLeft = body.x - body.vx * DT;
  forEachOverlap(body, 0, 2, (tx, ty) => {
    if (!blocked(sim, tx, ty)) return;
    const left = tx * TILE;
    const right = left + TILE;
    if (body.vx > 0 && body.x + body.w > left && body.x < left && prevRight <= left + 0.75) {
      body.x = left - body.w;
      body.vx = 0;
    } else if (body.vx < 0 && body.x < right && body.x + body.w > right && prevLeft >= right - 0.75) {
      body.x = right;
      body.vx = 0;
    } else if (body.vx === 0 && body.x < right && body.x + body.w > left) {
      const pushL = body.x + body.w - left;
      const pushR = right - body.x;
      if (pushL < pushR) body.x -= pushL;
      else body.x += pushR;
    }
  });
}

function resolveY(sim: Sim, prevBottom: number) {
  const body = sim.body;
  let landed = false;
  forEachOverlap(body, 2, 0, (tx, ty) => {
    const left = tx * TILE;
    const right = left + TILE;
    const top = ty * TILE;
    const bottom = top + TILE;
    const overlapX = body.x + body.w - 2 > left && body.x + 2 < right;
    if (!overlapX) return;

    if (blocked(sim, tx, ty)) {
      if (body.vy > 0 && body.y + body.h > top && body.y < top && prevBottom <= top + 0.8) {
        body.y = top - body.h;
        body.vy = 0;
        landed = true;
      } else if (body.vy < 0 && body.y < bottom && body.y + body.h > bottom) {
        body.y = bottom;
        body.vy = 0;
      } else if (body.vy === 0 && body.y < bottom && body.y + body.h > top) {
        const penTop = body.y + body.h - top;
        const penBot = bottom - body.y;
        if (penTop < penBot && penTop < 6) {
          body.y -= penTop;
          landed = true;
        }
      }
      return;
    }

    if (sim.dropGrace > 0) return;
    if (!onewayTile(sim, tx, ty)) return;
    if (body.vy < 0) return;
    if (prevBottom > top + 1) return;
    if (body.y + body.h > top && body.y < top) {
      body.y = top - body.h;
      body.vy = 0;
      landed = true;
    }
  });
  sim.grounded = landed;
}

function losClear(sim: Sim, ax: number, ay: number): boolean {
  const body = sim.body;
  const x0 = body.x + body.w / 2;
  const y0 = body.y + body.h / 2;
  const steps = Math.ceil(Math.hypot(ax - x0, ay - y0) / 6);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + (ax - x0) * t;
    const y = y0 + (ay - y0) * t;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (cellAt(sim.course, tx, ty) === "anchor") continue;
    if (blocked(sim, tx, ty)) return false;
  }
  return true;
}

export function listAnchors(sim: Sim): AnchorPt[] {
  const out: AnchorPt[] = [];
  const { course } = sim;
  for (let ty = 0; ty < course.height; ty++) {
    for (let tx = 0; tx < course.width; tx++) {
      if (cellAt(course, tx, ty) === "anchor") {
        out.push({ tx, ty, x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
      }
    }
  }
  return out;
}

function pickAnchor(sim: Sim, input: HeldInput): AnchorPt | null {
  const body = sim.body;
  const cx = body.x + body.w / 2;
  const cy = body.y + body.h / 2;
  let aimx = input.x;
  let aimy = input.y;
  if (aimx === 0 && aimy === 0) {
    aimx = sim.facing;
    aimy = -1;
  }
  const al = Math.hypot(aimx, aimy) || 1;
  aimx /= al;
  aimy /= al;
  let best: AnchorPt | null = null;
  let bestScore = 0.34;
  for (const a of listAnchors(sim)) {
    const dx = a.x - cx;
    const dy = a.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > SUGAR_RANGE || dist < 4) continue;
    const dot = (dx / dist) * aimx + (dy / dist) * aimy;
    if (dot < bestScore) continue;
    if (!losClear(sim, a.x, a.y)) continue;
    bestScore = dot;
    best = a;
  }
  return best;
}

function waterProbe(sim: Sim): { inWater: boolean; cx: number; cy: number } {
  const body = sim.body;
  const cx = body.x + body.w / 2;
  const cy = body.y + body.h * 0.65;
  const { cell } = cellOf(sim.course, cx, cy);
  return { inWater: cell === "water", cx, cy };
}

function hazards(sim: Sim): DeathReason | null {
  const body = sim.body;
  const cy = body.y + body.h / 2;
  const feet = body.y + body.h - 1;
  if (feet > sim.course.height * TILE) return "pit";
  let spike = false;
  let voidHit = false;
  let veilHit = false;
  forEachOverlap(body, 1, 1, (tx, ty) => {
    const c = cellAt(sim.course, tx, ty);
    if (c === "spike") spike = true;
    if (c === "void") voidHit = true;
    if (c === "veil" && !sim.veilActive) veilHit = true;
  });
  if (spike) return "spike";
  if (voidHit) return "void";
  if (veilHit) return "veil";
  if (cy > sim.course.height * TILE + 8) return "pit";
  return null;
}

function collect(sim: Sim, pad: number): { checks: string[]; stamps: string[] } {
  const checks: string[] = [];
  const stamps: string[] = [];
  const seenC = new Set<string>();
  const seenS = new Set<string>();
  forEachOverlap(sim.body, -pad, -pad, (tx, ty) => {
    if (!inBounds(sim.course, tx, ty)) return;
    const i = ty * sim.course.width + tx;
    const id = sim.course.checkAt[i];
    if (id && !seenC.has(id)) {
      seenC.add(id);
      checks.push(id);
    }
    const st = sim.course.stampAt[i];
    if (st && !seenS.has(st)) {
      seenS.add(st);
      stamps.push(st);
    }
  });
  return { checks, stamps };
}

function finishedOverlap(sim: Sim, pad: number): boolean {
  for (let ty = 0; ty < sim.course.height; ty++) {
    for (let tx = 0; tx < sim.course.width; tx++) {
      if (cellAt(sim.course, tx, ty) !== "finish") continue;
      if (rectOverlapsCell(sim.body, tx, ty, pad)) return true;
    }
  }
  return false;
}

/**
 * One fixed step. `respawn` is injected so checkpoint respawns stay pure
 * (the module-level override exists only as a fallback for early tests).
 */
export function stepSim(
  sim: Sim,
  input: HeldInput,
  respawn: { x: number; y: number } | null,
): StepEvents {
  const events: StepEvents = {
    died: null,
    respawned: false,
    checks: [],
    stamps: [],
    finished: false,
  };
  sim.respawned = false;
  sim.time += DT;
  const body = sim.body;
  const kit: Kit = sim.course.kit;
  const jumpEdge = input.jump && !sim.wasJump;
  const sugarEdge = input.sugar && !sim.wasSugar;
  const rodEdge = input.rod && !sim.wasRod;
  sim.wasJump = input.jump;
  sim.wasSugar = input.sugar;
  sim.wasRod = input.rod;

  if (sim.invuln > 0) sim.invuln = Math.max(0, sim.invuln - DT);
  if (sim.sugarLock > 0) sim.sugarLock = Math.max(0, sim.sugarLock - DT);
  if (sim.dropGrace > 0) sim.dropGrace = Math.max(0, sim.dropGrace - DT);
  if (sim.rod && sim.rod.life > 0) {
    sim.rod.life -= DT;
    if (sim.rod.life <= 0) sim.rod = null;
  }

  sim.veilActive = Boolean(kit.voidStep && input.voidStep && sim.voidMeter > 0);
  sim.capeOpen = Boolean(kit.cape && input.glide);

  if (input.x !== 0) sim.facing = input.x;

  const water = waterProbe(sim);
  sim.inWater = water.inWater;

  if (sim.inWater && kit.fins) {
    const { tx, ty } = cellOf(sim.course, water.cx, water.cy);
    const cur = currentAt(sim.course, tx, ty);
    const txv = (input.x * SWIM) + (cur ? cur.x * CURRENT : 0);
    const tyv = (input.y * SWIM) + (cur ? cur.y * CURRENT : 0) + (input.y === 0 ? -10 : 0);
    body.vx += (txv - body.vx) * Math.min(1, DT * 8);
    body.vy += (tyv - body.vy) * Math.min(1, DT * 8);
    sim.sugar = null;
    sim.grounded = false;
    sim.hopUsed = false;
    sim.drown = 0;
    if (!sim.veilActive && sim.grounded === false && kit.voidStep) {
      /* meter refills slowly even in calm water */
    }
  } else if (sim.sugar && input.sugar && kit.sugar) {
    const cx = body.x + body.w / 2;
    const cy = body.y + body.h / 2;
    const dx = sim.sugar.x - cx;
    const dy = sim.sugar.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 8) {
      body.vx = 0;
      body.vy = 0;
    } else {
      body.vx = (dx / dist) * SUGAR_SPEED;
      body.vy = (dy / dist) * SUGAR_SPEED;
    }
    sim.grounded = false;
    sim.drown = 0;
  } else {
    if (sim.sugar && !input.sugar) {
      sim.sugar = null;
      sim.sugarLock = 0.12;
    }
    const rising = body.vy < -20;
    const apex = Math.abs(body.vy) <= 40 && !sim.grounded;
    let grav = rising ? GRAV_UP : GRAV_DOWN * sim.access.fallScale;
    if (apex) grav = GRAV_APEX;
    const gliding = Boolean(kit.cape && input.glide && !sim.grounded && body.vy > -10);
    if (gliding) {
      grav = sim.access.glideGravity;
    }
    if (sim.inWater && !kit.fins) {
      grav *= 0.45;
      sim.drown += DT;
    } else {
      sim.drown = 0;
    }
    body.vy += grav * DT;
    const maxFall = gliding ? sim.access.glideMaxFall : MAX_FALL;
    if (body.vy > maxFall) body.vy = maxFall;

    const accel = sim.grounded ? ACCEL_G : gliding ? ACCEL_G : ACCEL_A;
    if (input.x !== 0) {
      const cap = gliding ? RUN * 0.95 : RUN;
      body.vx += input.x * accel * DT;
      if (body.vx > cap) body.vx = cap;
      if (body.vx < -cap) body.vx = -cap;
    } else if (sim.grounded) {
      const f = FRICTION * DT;
      if (Math.abs(body.vx) <= f) body.vx = 0;
      else body.vx -= Math.sign(body.vx) * f;
    } else {
      body.vx *= Math.max(0, 1 - DT * 0.7);
    }

    if (jumpEdge) sim.buffer = sim.access.jumpBuffer;
    else sim.buffer = Math.max(0, sim.buffer - DT);

    const canGroundJump = sim.grounded || sim.coyote > 0;
    if (sim.buffer > 0 && canGroundJump) {
      body.vy = JUMP_V;
      sim.grounded = false;
      sim.coyote = 0;
      sim.buffer = 0;
      sim.hopUsed = false;
    } else if (jumpEdge && !sim.grounded && kit.boots && !sim.hopUsed && sim.coyote <= 0) {
      body.vy = BOOTS_V;
      body.vx += sim.facing * BOOTS_PUSH;
      const cap = RUN + BOOTS_PUSH;
      if (body.vx > cap) body.vx = cap;
      if (body.vx < -cap) body.vx = -cap;
      sim.hopUsed = true;
      sim.buffer = 0;
    }

    if (!input.jump && body.vy < 0 && sim.buffer <= 0) {
      /* release cut is applyReleaseCut(), once per rise — not a per-frame damp */
    }
  }

  // Variable-height cut on the release frame only (outside swim / sugar).
  if (!(sim.inWater && kit.fins) && !sim.sugar) {
    if (!input.jump && sim.wasJump === false) {
      /* already stored */
    }
  }

  // Re-apply release cut exactly once: detect release via previous wasJump which
  // we already overwrote. Use a side channel on the sim by checking vy and a flag.
  applyReleaseCut(sim, input);

  if (sugarEdge && kit.sugar && !sim.sugar && sim.sugarLock <= 0 && !(sim.inWater && kit.fins)) {
    const a = pickAnchor(sim, input);
    if (a) sim.sugar = a;
  }

  if (rodEdge && kit.rod) {
    tryRod(sim, input);
  }

  if (input.drop) sim.dropGrace = 0.18;

  const prevBottom = body.y + body.h;
  body.x += body.vx * DT;
  resolveX(sim);
  body.y += body.vy * DT;
  resolveY(sim, prevBottom);

  if (sim.grounded) {
    sim.coyote = sim.access.coyote;
    sim.hopUsed = false;
    if (!standingOn(sim, "veil")) {
      sim.voidMeter = Math.min(VOID_MAX * sim.access.voidMeterScale, sim.voidMeter + DT * VOID_REFILL);
    }
  } else {
    sim.coyote = Math.max(0, sim.coyote - DT);
  }

  // The veil spends the meter. Holding the step on stone does not.
  if (sim.grounded && standingOn(sim, "veil")) {
    sim.voidMeter = Math.max(0, sim.voidMeter - DT * VOID_DRAIN);
  }

  if (sim.invuln <= 0) {
    const hz = hazards(sim);
    if (!hz && sim.drown >= DROWN_TIME) {
      killAt(sim, "drown", respawn);
      events.died = "drown";
      events.respawned = true;
    } else if (hz) {
      killAt(sim, hz, respawn);
      events.died = hz;
      events.respawned = true;
    }
  }

  if (!events.died) {
    const pad = sim.access.checkpointPad + 10;
    const got = collect(sim, pad);
    events.checks = got.checks;
    events.stamps = got.stamps;
    events.finished = finishedOverlap(sim, pad);
  }

  return events;
}

const releaseCutDone = new WeakMap<Sim, boolean>();

function applyReleaseCut(sim: Sim, input: HeldInput) {
  if (sim.sugar || (sim.inWater && sim.course.kit.fins)) {
    releaseCutDone.set(sim, false);
    return;
  }
  if (input.jump || sim.body.vy >= 0) {
    if (sim.body.vy >= 0 || sim.grounded) releaseCutDone.set(sim, false);
    return;
  }
  if (!releaseCutDone.get(sim)) {
    sim.body.vy *= JUMP_CUT;
    releaseCutDone.set(sim, true);
  }
}

function killAt(sim: Sim, reason: DeathReason, respawn: { x: number; y: number } | null) {
  sim.deaths += 1;
  sim.lastDeath = reason;
  const body = respawn ? makeBody(respawn.x, respawn.y) : spawnBody(sim.course);
  sim.body = body;
  sim.sugar = null;
  sim.grounded = false;
  sim.hopUsed = false;
  sim.drown = 0;
  sim.invuln = 0.4;
  sim.respawned = true;
  sim.voidMeter = VOID_MAX * sim.access.voidMeterScale;
  sim.coyote = 0;
  sim.buffer = 0;
  releaseCutDone.set(sim, false);
}

function tryRod(sim: Sim, input: HeldInput) {
  const body = sim.body;
  let socket: { tx: number; ty: number } | null = null;
  forEachOverlap(body, -2, -2, (tx, ty) => {
    if (cellAt(sim.course, tx, ty) === "socket") socket = { tx, ty };
  });
  if (!socket) return;
  const s = socket as { tx: number; ty: number };
  const bx = s.tx + (input.x || 0);
  let by = s.ty + (input.y < 0 || input.x === 0 ? -1 : input.y > 0 ? 1 : 0);
  if (input.x === 0 && input.y === 0) by = s.ty - 1;
  if (!inBounds(sim.course, bx, by)) return;
  const c = cellAt(sim.course, bx, by);
  if (c === "solid" || c === "membrane") return;
  sim.rod = { tx: bx, ty: by, life: ROD_LIFE };
  // Stand the body on the new block when it spawns in this column.
  const left = bx * TILE;
  const top = by * TILE;
  const overlapsX = body.x < left + TILE && body.x + body.w > left;
  if (overlapsX && body.y + body.h > top) {
    body.y = top - body.h;
    body.vy = 0;
    sim.grounded = true;
  }
}

function standingOn(sim: Sim, kind: "veil" | "oneway" | "solid"): boolean {
  const feet = sim.body.y + sim.body.h + 1;
  const x0 = sim.body.x + 2;
  const x1 = sim.body.x + sim.body.w - 2;
  for (const x of [x0, (x0 + x1) / 2, x1]) {
    const { cell } = cellOf(sim.course, x, feet);
    if (kind === "solid" && (cell === "solid" || cell === "gate")) return true;
    if (cell === kind) return true;
  }
  return false;
}

export function bodyCenter(body: Body): { x: number; y: number } {
  return { x: body.x + body.w / 2, y: body.y + body.h / 2 };
}

/** Max legal displacement per tick, used by the teleport guard. Sugar zip is the fastest. */
export function maxStepPx(): number {
  return (SUGAR_SPEED + BOOTS_PUSH) * DT + 2.5;
}

export type JumpProbe = {
  fullReach: number;
  shortReach: number;
  bootsReach: number;
  fullHeight: number;
  shortHeight: number;
};

function arenaCourse(): Course {
  // Imported lazily would cycle; the probe builds a Course literal.
  const width = 80;
  const height = 16;
  const cells: Course["cells"] = new Array(width * height).fill("air");
  const current: Course["current"] = new Array(width * height).fill(null);
  const checkAt: Course["checkAt"] = new Array(width * height).fill(null);
  const stampAt: Course["stampAt"] = new Array(width * height).fill(null);
  for (let x = 0; x < width; x++) {
    cells[(height - 1) * width + x] = "solid";
    cells[(height - 2) * width + x] = "solid";
  }
  // A launch pad, then a pit, then nothing — we measure airborne travel instead.
  cells[12 * width + 4] = "start";
  cells[8 * width + 70] = "finish";
  return {
    id: "probe",
    title: "probe",
    tier: "early",
    problem: "probe",
    blurb: "",
    fieldNote: "",
    kit: { sugar: false, boots: true, fins: false, cape: false, rod: false, voidStep: false },
    revision: 1,
    featured: false,
    width,
    height,
    cells,
    current,
    checks: [],
    checkAt,
    stampAt,
    routes: [],
  };
}

function measureStyle(style: "full" | "short" | "boots"): { reach: number; height: number } {
  const course = arenaCourse();
  const { STANDARD_ACCESS } = requireAccess();
  const sim = createSim(course, STANDARD_ACCESS);
  // Place on the floor away from walls.
  sim.body.x = 40;
  sim.body.y = 12 * TILE - PH;
  sim.grounded = true;
  sim.coyote = STANDARD_ACCESS.coyote;
  const input = {
    x: 1 as const,
    y: 0 as const,
    jump: false,
    sugar: false,
    glide: false,
    rod: false,
    voidStep: false,
    drop: false,
  };
  // Accelerate.
  for (let i = 0; i < 40; i++) stepSim(sim, input, null);
  const x0 = sim.body.x;
  const y0 = sim.body.y;
  input.jump = true;
  stepSim(sim, input, null);
  if (style === "short") input.jump = false;
  let peak = 0;
  let reach = 0;
  let hopped = false;
  for (let i = 0; i < 180; i++) {
    if (style === "boots" && !hopped && sim.body.vy > -30 && !sim.grounded) {
      input.jump = false;
      stepSim(sim, input, null);
      input.jump = true;
      hopped = true;
    }
    stepSim(sim, input, null);
    peak = Math.max(peak, y0 - sim.body.y);
    if (!sim.grounded) reach = Math.max(reach, sim.body.x - x0);
    if (sim.grounded && i > 4) break;
  }
  return { reach, height: peak };
}

function requireAccess(): { STANDARD_ACCESS: AccessProfile } {
  // Local import avoidance: duplicate the standard numbers used by createSim's caller.
  return {
    STANDARD_ACCESS: {
      id: "standard",
      coyote: 0.1,
      jumpBuffer: 0.12,
      fallScale: 1,
      glideGravity: 280,
      glideMaxFall: 40,
      voidMeterScale: 1,
      checkpointPad: 0,
    },
  };
}

/** Executed jump distances (pixels of travel from takeoff until landing). */
export function probeJumps(): JumpProbe {
  const full = measureStyle("full");
  const short = measureStyle("short");
  const boots = measureStyle("boots");
  return {
    fullReach: full.reach,
    shortReach: short.reach,
    bootsReach: boots.reach,
    fullHeight: full.height,
    shortHeight: short.height,
  };
}
