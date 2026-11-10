import { defaultBindings } from "./defaults.ts";
import { pauseHasKeyboard } from "./bindings.ts";
import { RECOVERY_CODE, STORAGE_KEY } from "./timing.ts";
import { defaultPositions } from "./touch-layout.ts";
import type {
  ActionId,
  Binding,
  BindingTable,
  MovementPlane,
  OffhandMode,
  StorageLike,
  TouchControlId,
  TouchSettings,
} from "./types.ts";
import { ACTIONS, TOUCH_CONTROLS } from "./types.ts";

export type PersistedInput = {
  version: 1;
  bindings: BindingTable;
  offhandMode: OffhandMode;
  movementPlane: MovementPlane;
  deadzone: number;
  touch: TouchSettings;
};

const KEY_CODE = /^[A-Za-z0-9]{1,32}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBinding(value: unknown): Binding | null {
  if (!isRecord(value) || typeof value.kind !== "string") return null;
  if (value.kind === "key" && typeof value.code === "string" && KEY_CODE.test(value.code)) {
    if (value.code === RECOVERY_CODE) return null;
    return { kind: "key", code: value.code };
  }
  if (
    value.kind === "padButton" &&
    typeof value.button === "number" &&
    Number.isInteger(value.button) &&
    value.button >= 0 &&
    value.button <= 31
  ) {
    return { kind: "padButton", button: value.button };
  }
  if (
    value.kind === "padAxis" &&
    typeof value.axis === "number" &&
    Number.isInteger(value.axis) &&
    value.axis >= 0 &&
    value.axis <= 7 &&
    (value.sign === -1 || value.sign === 1)
  ) {
    return { kind: "padAxis", axis: value.axis, sign: value.sign };
  }
  if (value.kind === "padChord" && Array.isArray(value.buttons)) {
    const buttons = value.buttons.filter(
      (button): button is number =>
        typeof button === "number" && Number.isInteger(button) && button >= 0 && button <= 31,
    );
    const unique = [...new Set(buttons)];
    if (unique.length < 2 || unique.length > 4) return null;
    return { kind: "padChord", buttons: unique };
  }
  if (
    value.kind === "touch" &&
    typeof value.control === "string" &&
    (TOUCH_CONTROLS as readonly string[]).includes(value.control)
  ) {
    return { kind: "touch", control: value.control as TouchControlId };
  }
  return null;
}

function finiteUnit(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function defaultPersisted(): PersistedInput {
  return {
    version: 1,
    bindings: defaultBindings(),
    offhandMode: "hold",
    movementPlane: "cardinal",
    deadzone: 0.18,
    touch: {
      handedness: "right",
      scale: 1,
      opacity: 0.92,
      positions: null,
    },
  };
}

export function parsePersisted(raw: string | null): PersistedInput | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== 1) return null;
  const defaults = defaultPersisted();
  const bindings = defaultBindings();
  if (!isRecord(data.bindings)) return null;
  for (const action of ACTIONS) {
    const list = data.bindings[action];
    if (!Array.isArray(list)) return null;
    const parsed = list
      .map(parseBinding)
      .filter((binding): binding is Binding => binding !== null);
    bindings[action] = parsed.length > 0 ? parsed : defaultBindings()[action];
  }
  if (!pauseHasKeyboard(bindings)) return null;
  const offhandMode: OffhandMode = data.offhandMode === "toggle" ? "toggle" : "hold";
  const movementPlane: MovementPlane = data.movementPlane === "eight" ? "eight" : "cardinal";
  const deadzone =
    typeof data.deadzone === "number" && Number.isFinite(data.deadzone)
      ? Math.min(0.5, Math.max(0.05, data.deadzone))
      : defaults.deadzone;
  let touch = defaults.touch;
  if (isRecord(data.touch)) {
    const handedness = data.touch.handedness === "left" ? "left" : "right";
    const scale =
      typeof data.touch.scale === "number" && Number.isFinite(data.touch.scale)
        ? Math.min(1.45, Math.max(0.75, data.touch.scale))
        : 1;
    const opacity =
      typeof data.touch.opacity === "number" && Number.isFinite(data.touch.opacity)
        ? Math.min(1, Math.max(0.4, data.touch.opacity))
        : 0.92;
    let positions: TouchSettings["positions"] = null;
    if (isRecord(data.touch.positions)) {
      const next = defaultPositions(handedness);
      let ok = true;
      for (const id of TOUCH_CONTROLS) {
        const point = data.touch.positions[id];
        if (!isRecord(point)) {
          ok = false;
          break;
        }
        next[id] = { x: finiteUnit(point.x, next[id].x), y: finiteUnit(point.y, next[id].y) };
      }
      positions = ok ? next : null;
    }
    touch = { handedness, scale, opacity, positions };
  }
  return { version: 1, bindings, offhandMode, movementPlane, deadzone, touch };
}

export function loadPersisted(storage: StorageLike): PersistedInput {
  const parsed = parsePersisted(storage.getItem(STORAGE_KEY));
  if (parsed) return parsed;
  const fresh = defaultPersisted();
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    /* private mode or a full quota — in-memory defaults still run */
  }
  return fresh;
}

export function savePersisted(storage: StorageLike, state: PersistedInput): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* persistence is best-effort; reset still works in memory */
  }
}

export function emptyActions(): Record<ActionId, boolean> {
  return {
    moveNorth: false,
    moveSouth: false,
    moveEast: false,
    moveWest: false,
    blade: false,
    offhand: false,
    interact: false,
    pause: false,
    shrineRelease: false,
  };
}
