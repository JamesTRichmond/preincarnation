import type { Intent } from "../types.ts";

export interface KeyLike {
  key: string;
  code: string;
  shiftKey?: boolean;
  repeat?: boolean;
}

/** Menu and field intents. WASD matches arrows so keyboard and the touch pad share a map. */
export function intentFromKeyboard(event: KeyLike): Intent | null {
  if (event.repeat && event.key !== "ArrowUp" && event.key !== "ArrowDown") {
    const repeatingMoves = new Set(["ArrowLeft", "ArrowRight", "a", "A", "d", "D", "w", "W", "s", "S"]);
    if (!repeatingMoves.has(event.key)) return null;
  }
  switch (event.key) {
    case "ArrowUp":
    case "w":
    case "W":
      return { type: "move", dir: "up" };
    case "ArrowDown":
    case "s":
    case "S":
      return { type: "move", dir: "down" };
    case "ArrowLeft":
    case "a":
    case "A":
      return { type: "move", dir: "left" };
    case "ArrowRight":
    case "d":
    case "D":
      return { type: "move", dir: "right" };
    case "Enter":
    case " ":
      return { type: "confirm" };
    case "Escape":
      return { type: "pause" };
    case "Backspace":
      return { type: "cancel" };
    case "i":
    case "I":
      return { type: "shortcut", id: "inventory" };
    case "m":
    case "M":
      return { type: "shortcut", id: "map" };
    case "j":
    case "J":
      return { type: "shortcut", id: "journal" };
    case "q":
    case "Q":
    case "[":
      return { type: "quick-cycle", delta: -1 };
    case "e":
    case "E":
    case "]":
      return { type: "quick-cycle", delta: 1 };
    case "1":
    case "2":
    case "3":
    case "4":
      return { type: "quick-slot", index: Number(event.key) - 1 };
    case "Tab":
      return { type: "move", dir: event.shiftKey ? "up" : "down" };
    default:
      return null;
  }
}

/** Standard gamepad: edge-triggered so a held button does not repeat. */
export function intentFromGamepad(prev: boolean[], next: boolean[]): Intent | null {
  const pressed = (index: number) => Boolean(next[index]) && !prev[index];
  if (pressed(0)) return { type: "confirm" };
  if (pressed(1)) return { type: "cancel" };
  if (pressed(9)) return { type: "pause" };
  if (pressed(8)) return { type: "shortcut", id: "map" };
  if (pressed(2)) return { type: "shortcut", id: "journal" };
  if (pressed(3)) return { type: "shortcut", id: "inventory" };
  if (pressed(4)) return { type: "quick-cycle", delta: -1 };
  if (pressed(5)) return { type: "quick-cycle", delta: 1 };
  if (pressed(12)) return { type: "move", dir: "up" };
  if (pressed(13)) return { type: "move", dir: "down" };
  if (pressed(14)) return { type: "move", dir: "left" };
  if (pressed(15)) return { type: "move", dir: "right" };
  return null;
}
