import type { Command } from "./types.ts";

/**
 * ESTIMATE, not an observation.
 * The scripted walk is a shortest path between authored stops. A first player
 * does not pathfind, re-reads, and stands still. The wander factor is an
 * assumption, labeled as such, not a measurement.
 */
export const WANDER_FACTOR = 2;
export const RUSH_FACTOR = 0.55;

export function modelSeconds(cmds: Command[]): number {
  let seconds = 0;
  for (const cmd of cmds) {
    if (cmd.type === "move") seconds += 0.85;
    else if (cmd.type === "advance") seconds += 5.2;
    else if (cmd.type === "wait") seconds += cmd.seconds;
    else if (cmd.type === "verb" && cmd.id.startsWith("talk")) seconds += 5.2;
    else if (cmd.type === "verb" && (cmd.id.startsWith("look") || cmd.id.startsWith("read"))) seconds += 3.6;
    else if (cmd.type === "verb" && cmd.id.startsWith("rest")) seconds += 7;
    else if (cmd.type === "verb" && cmd.id === "release") seconds += 6;
    else if (cmd.type === "verb") seconds += 2.4;
    else seconds += 0.4;
  }
  if (cmds.some((c) => c.type === "verb" && (c.id === "strike-thread-vein" || c.id === "strike-thread-yard"))) {
    seconds += 45;
  }
  return seconds;
}

export function estimateMinutes(cmds: Command[]): {
  estimate: true;
  modelMinutes: number;
  attentiveMinutes: number;
  rushMinutes: number;
  wanderFactor: number;
  rushFactor: number;
} {
  const model = modelSeconds(cmds) / 60;
  return {
    estimate: true,
    modelMinutes: round1(model),
    attentiveMinutes: round1(model * WANDER_FACTOR),
    rushMinutes: round1(model * RUSH_FACTOR),
    wanderFactor: WANDER_FACTOR,
    rushFactor: RUSH_FACTOR,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
