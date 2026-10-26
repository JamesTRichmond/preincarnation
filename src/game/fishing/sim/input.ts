import type { Actions } from "./types.ts";

export const EMPTY_ACTIONS: Actions = {
  ax: 0,
  ay: 0,
  castHeld: false,
  hookHeld: false,
  pressureHeld: false,
  giveToggle: false,
  cancel: false,
  confirm: false,
};

/**
 * Bank positioning, not a vehicle. A and ArrowLeft decrease screen X.
 * W and ArrowUp move the aim farther up the water (smaller Y).
 */
export function axisFromCodes(codes: readonly string[]): { ax: number; ay: number } {
  let ax = 0;
  let ay = 0;
  if (codes.includes("KeyA") || codes.includes("ArrowLeft")) ax -= 1;
  if (codes.includes("KeyD") || codes.includes("ArrowRight")) ax += 1;
  if (codes.includes("KeyW") || codes.includes("ArrowUp")) ay -= 1;
  if (codes.includes("KeyS") || codes.includes("ArrowDown")) ay += 1;
  return { ax: Math.max(-1, Math.min(1, ax)), ay: Math.max(-1, Math.min(1, ay)) };
}

export const GAME_CODES = new Set([
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "KeyG",
  "KeyJ",
  "KeyK",
  "KeyH",
  "KeyR",
  "KeyF",
  "Escape",
]);
