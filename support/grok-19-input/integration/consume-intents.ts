import type { FrameInput, Intent } from "../src/types.ts";

const SIMULATION_INTENTS = new Set<Intent["type"]>([
  "bladeTap",
  "bladeSpin",
  "offhand",
  "interact",
  "pause",
  "shrineRelease",
]);

/**
 * The only bridge a simulation should need.
 * Device loss, binding reset, and the settings chord stay in the input layer.
 * This function does not assign damage, poise, i-frames, loot, or story flags.
 */
export function readSimulationCommands(frame: FrameInput): {
  move: { east: -1 | 0 | 1; north: -1 | 0 | 1 };
  intents: Intent[];
} {
  return {
    move: { east: frame.moveX, north: frame.moveY },
    intents: frame.edges.filter((edge) => SIMULATION_INTENTS.has(edge.type)),
  };
}
