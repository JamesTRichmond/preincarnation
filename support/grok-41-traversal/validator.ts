import { accessById, type Course } from "./types.ts";
import type { Replay } from "./replay.ts";
import { armLive, createRun, setInput, tick } from "./session.ts";

export type Validation = {
  ok: boolean;
  reasons: string[];
  frames: number;
  deaths: number;
  stamps: string[];
  /** True only when a resim crossed the finish after every required checkpoint, in order. */
  finished: boolean;
};

/**
 * Re-simulates recorded inputs. Recorded positions are checked, never trusted
 * as a shortcut. Checkpoint order comes from the resim. A ghost is not applied.
 */
export function validateReplay(course: Course, replay: Replay): Validation {
  const reasons: string[] = [];
  if (replay.version !== 1) reasons.push("version");
  if (replay.courseId !== course.id) reasons.push("course");
  if (replay.revision !== course.revision) reasons.push("revision");
  if (replay.access !== "standard" && replay.access !== "assist") reasons.push("access");
  if (replay.invalid === "teleport") reasons.push("teleport");

  const access = accessById(replay.access === "assist" ? "assist" : "standard");
  const run = createRun(course, access, false);
  armLive(run, true);

  let mismatch = false;
  for (let i = 0; i < replay.frames.length; i++) {
    const frame = replay.frames[i];
    if (!frame) break;
    setInput(run, frame.input);
    tick(run);
    if (run.invalid === "teleport") {
      reasons.push("teleport");
      break;
    }
    const dx = Math.abs(run.sim.body.x - frame.x);
    const dy = Math.abs(run.sim.body.y - frame.y);
    if (dx > 0.8 || dy > 0.8) {
      mismatch = true;
      break;
    }
    if (run.finished) break;
  }
  if (mismatch) reasons.push("position-mismatch");
  if (!run.finished) reasons.push("unfinished");
  if (run.nextCheck < course.checks.length) reasons.push("checkpoint-order");

  const unique = [...new Set(reasons)];
  const finished = run.finished && run.nextCheck >= course.checks.length;
  return {
    ok: unique.length === 0 && finished && run.invalid == null,
    reasons: unique,
    frames: run.liveFrames,
    deaths: run.sim.deaths,
    stamps: [...run.stamps],
    finished,
  };
}
