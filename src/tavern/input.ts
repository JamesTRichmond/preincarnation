import type { Gesture } from "./types.ts";

export type InputSource = "key" | "touch";

export type InputGate = {
  gapMs: number;
  last: Partial<Record<Gesture, { timeMs: number; source: InputSource }>>;
};

export function createInputGate(gapMs = 90): InputGate {
  return { gapMs, last: {} };
}

/**
 * Drops a repeated key, a double touch, or a key+touch pair for the same
 * gesture inside the gap. A different gesture still goes through.
 */
export function acceptGesture(
  gate: InputGate,
  gesture: Gesture,
  timeMs: number,
  source: InputSource,
): { gate: InputGate; accepted: boolean } {
  const prev = gate.last[gesture];
  if (prev && timeMs - prev.timeMs >= 0 && timeMs - prev.timeMs < gate.gapMs) {
    return { gate, accepted: false };
  }
  return {
    gate: {
      gapMs: gate.gapMs,
      last: { ...gate.last, [gesture]: { timeMs, source } },
    },
    accepted: true,
  };
}

export function gestureFromKey(key: string): Gesture | null {
  switch (key) {
    case "f":
    case "F":
    case "1":
      return "lift";
    case "j":
    case "J":
    case "2":
      return "settle";
    case "k":
    case "K":
    case "3":
      return "stamp";
    case "l":
    case "L":
    case "4":
    case " ":
      return "hold";
    default:
      return null;
  }
}

/** Key-repeat events are not new notes. */
export function shouldTakeKey(repeat: boolean): boolean {
  return !repeat;
}
