import { act as makeAct, continuityLine, release, writeSession, type Act } from "./effects.ts";
import { kill, rememberVisit } from "./effects.ts";
import { initialState } from "./state.ts";
import type { Command, Result, State } from "./types.ts";
import { advanceTalk, listVerbs, runVerb, warnCaption } from "./verbs.ts";
import { DIRS, briarAt, blocked, lethal, portalAt, tileAt } from "./world.ts";

function finish(state: State, bucket: Act, touched: boolean): Result {
  if (touched) {
    state.tick += 1;
    if (!bucket.events.some((e) => e.startsWith("wait"))) state.idle = 0;
  }
  return {
    state,
    captions: bucket.captions,
    speech: bucket.speech,
    events: bucket.events,
    verbs: listVerbs(state),
  };
}

function bumpEdge(state: State, bucket: Act): void {
  const key = "edge:" + state.era;
  state.flags.leftEdge = true;
  if (!state.seen.includes(key)) {
    state.seen.push(key);
    bucket.captions.push(
      state.era === "altered"
        ? "The first mouth was the vein. Past this, the county is not this hour."
        : "Past this, the county continues. This hour does not.",
    );
  }
  bucket.events.push("edge");
}

function move(state: State, dir: Command & { type: "move" }, bucket: Act): boolean {
  if (state.talk) state.talk = null;
  const d = DIRS[dir.dir];
  const nx = state.x + d.x;
  const ny = state.y + d.y;
  state.facing = dir.dir;
  if (blocked(state, state.map, nx, ny)) {
    if (state.map === "lane" && dir.dir === "e" && state.x >= 21) {
      bumpEdge(state, bucket);
      return true;
    }
    bucket.events.push("bump");
    return false;
  }
  state.x = nx;
  state.y = ny;
  state.steps += 1;
  if (!state.dirsUsed.includes(dir.dir)) state.dirsUsed.push(dir.dir);
  bucket.events.push("moved");

  if (lethal(state, state.map, nx, ny)) {
    const t = tileAt(state, state.map, nx, ny);
    const cause = state.map === "vein" && t === "x" ? "pinch" : state.map === "vein" ? "drop" : "water";
    kill(state, cause, bucket);
    return true;
  }

  if (briarAt(state, state.map, nx, ny)) {
    const id = state.map + ":" + nx + ":" + ny;
    if (!state.clearedBriar.includes(id)) {
      state.clearedBriar.push(id);
      const died = state.vitality - 1 <= 0;
      state.bleed = true;
      state.flags.everBled = true;
      state.vitality -= 1;
      if (died || state.vitality <= 0) {
        state.vitality = 0;
        kill(state, "bleed", bucket);
        return true;
      }
      bucket.captions.push("A scratch along the wrist.");
    }
  }

  for (const step of Object.values(DIRS)) {
    const tx = state.x + step.x;
    const ty = state.y + step.y;
    const warn = warnCaption(state, tx, ty);
    if (!warn) continue;
    const key = "warn:" + state.map + ":" + tx + ":" + ty;
    if (state.seen.includes(key)) continue;
    state.seen.push(key);
    bucket.captions.push(warn);
    break;
  }

  const portal = portalAt(state.map, state.x, state.y);
  if (portal) {
    state.map = portal.to;
    state.x = portal.tx;
    state.y = portal.ty;
    rememberVisit(state, portal.to);
    bucket.events.push("enter:" + portal.to);
  }
  return true;
}

export function step(prev: State, cmd: Command): Result {
  const state = structuredClone(prev);
  const bucket = makeAct();

  if (cmd.type === "move") {
    const touched = move(state, cmd, bucket);
    return finish(state, bucket, touched);
  }

  if (cmd.type === "verb") {
    runVerb(state, cmd.id, bucket);
    const rejected = bucket.events.some((e) => e.startsWith("rejected"));
    return finish(state, bucket, !rejected);
  }

  if (cmd.type === "advance") {
    advanceTalk(state, bucket);
    const rejected = bucket.events.some((e) => e.startsWith("rejected"));
    return finish(state, bucket, !rejected);
  }

  if (cmd.type === "leave-talk") {
    if (state.talk) state.talk = null;
    bucket.events.push("leave-talk");
    return finish(state, bucket, true);
  }

  if (cmd.type === "wait") {
    const seconds = Number.isFinite(cmd.seconds) ? Math.max(0, cmd.seconds) : 0;
    state.idle += seconds;
    bucket.events.push("wait");
    if (state.map === "road" && state.era === "arrival" && state.steps === 0 && state.idle >= 8 && !state.hints.includes("idle-road")) {
      state.hints.push("idle-road");
      bucket.captions.push("The road continues.");
      bucket.events.push("hint:idle-road");
    }
    return finish(state, bucket, true);
  }

  if (cmd.type === "hide") {
    writeSession(state, "hide");
    bucket.events.push("hide");
    return finish(state, bucket, true);
  }

  if (cmd.type === "resume-break") {
    const notch = state.sessionNotch ?? state.explicitNotch;
    if (!notch) {
      state.continuity = null;
      bucket.events.push("resume:empty");
      return finish(state, bucket, false);
    }
    const snap = structuredClone(notch.snapshot);
    const aged = state.agedNotch;
    const explicit = state.explicitNotch;
    const session = state.sessionNotch;
    Object.assign(state, snap);
    state.agedNotch = aged;
    state.explicitNotch = explicit;
    state.sessionNotch = session;
    state.continuity = continuityLine(notch);
    bucket.events.push("resume");
    return finish(state, bucket, true);
  }

  if (cmd.type === "ack-continuity") {
    state.continuity = null;
    bucket.events.push("ack");
    return finish(state, bucket, false);
  }

  return finish(state, bucket, false);
}

export { initialState, release };
