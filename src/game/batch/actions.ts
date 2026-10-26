import type { ActionKind, ConfirmInput, ExtendedAction, Locale, UndoPolicy } from "./types.ts";

/**
 * Each action owns one chord, one controller button, one touch gesture,
 * and one pointer control. Dangerous actions never share Enter, Space,
 * or a generic "confirm" id. Controller B / Escape / swipe-cancel never confirm.
 * Cross confirms only Move — the routine action — and is rejected everywhere else
 * as a shared confirm, not reinterpreted as a move.
 */
export interface ActionControl {
  kind: ExtendedAction;
  /** Routine actions apply immediately. Everything else needs the review tray. */
  immediate: boolean;
  review: boolean;
  undoPolicy: UndoPolicy;
  chord: string;
  controller: string;
  touch: string;
  pointerId: string;
  holdMs: number;
  phrase: boolean;
  /** When the tray is closed, the chord only arms the review. It does not commit. */
  armsReview: boolean;
}

export const CONTROLS: Record<ExtendedAction, ActionControl> = {
  move: {
    kind: "move",
    immediate: true,
    review: false,
    undoPolicy: "reversible-if-clean",
    chord: "m",
    controller: "cross",
    touch: "tap",
    pointerId: "commit-move",
    holdMs: 0,
    phrase: false,
    armsReview: false,
  },
  sell: {
    kind: "sell",
    immediate: false,
    review: true,
    undoPolicy: "buyback-only",
    chord: "shift+s",
    controller: "square",
    touch: "slide-right",
    pointerId: "commit-sell",
    holdMs: 0,
    phrase: false,
    armsReview: true,
  },
  dismantle: {
    kind: "dismantle",
    immediate: false,
    review: true,
    undoPolicy: "reversible-if-clean",
    chord: "shift+d",
    controller: "triangle",
    touch: "slide-up",
    pointerId: "commit-dismantle",
    holdMs: 0,
    phrase: false,
    armsReview: true,
  },
  donate: {
    kind: "donate",
    immediate: false,
    review: true,
    undoPolicy: "never",
    chord: "shift+g",
    controller: "l1",
    touch: "long-press",
    pointerId: "commit-donate",
    holdMs: 700,
    phrase: true,
    armsReview: true,
  },
  discard: {
    kind: "discard",
    immediate: false,
    review: true,
    undoPolicy: "reversible-if-clean",
    chord: "shift+x",
    controller: "r1",
    touch: "two-finger-hold",
    pointerId: "commit-discard",
    holdMs: 900,
    phrase: true,
    armsReview: true,
  },
  restore: {
    kind: "restore",
    immediate: false,
    review: true,
    undoPolicy: "reversible-if-clean",
    chord: "shift+r",
    controller: "share",
    touch: "slide-down",
    pointerId: "commit-restore",
    holdMs: 0,
    phrase: false,
    armsReview: true,
  },
  buyback: {
    kind: "buyback",
    immediate: false,
    review: true,
    undoPolicy: "reversible-if-clean",
    chord: "shift+y",
    controller: "dpad-left",
    touch: "slide-left",
    pointerId: "commit-buyback",
    holdMs: 0,
    phrase: false,
    armsReview: true,
  },
};

export const CANCEL_CHORDS = new Set(["escape", "esc"]);
export const CANCEL_BUTTONS = new Set(["b", "circle"]);
export const CANCEL_GESTURES = new Set(["swipe-cancel"]);
export const SHARED_CHORDS = new Set(["enter", " ", "space", "numpadenter"]);
export const SHARED_BUTTONS = new Set(["start", "options"]);
export const SHARED_POINTER = new Set(["confirm", "commit-confirm", "ok"]);

const MODS = ["ctrl", "alt", "shift", "meta"] as const;

export function normalizeChord(chord: string): string {
  const parts = chord
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const mods = MODS.filter((mod) => parts.includes(mod));
  const key = parts.find((part) => !(MODS as readonly string[]).includes(part));
  return [...mods, key].filter(Boolean).join("+");
}

export function expectedPhrase(locale: Locale, action: ExtendedAction): string | null {
  const control = CONTROLS[action];
  if (!control.phrase) return null;
  if (action === "donate") return locale === "fr" ? "DON" : "GIFT";
  if (action === "discard") return locale === "fr" ? "JETER" : "DISCARD";
  return null;
}

export interface ConfirmVerdict {
  ok: boolean;
  reason:
    | "ok"
    | "missing-confirm"
    | "wrong-action"
    | "shared-confirm-rejected"
    | "cancel-is-never-confirm"
    | "hold-too-short"
    | "phrase-mismatch";
}

function holdOf(input: ConfirmInput): number {
  return input.holdMs ?? 0;
}

/** Pure gate. A matching control for action A never counts as action B. */
export function acceptConfirm(
  action: ExtendedAction,
  input: ConfirmInput | undefined,
  locale: Locale,
  phrase: string | undefined,
): ConfirmVerdict {
  if (!input) return { ok: false, reason: "missing-confirm" };
  const control = CONTROLS[action];

  if (input.channel === "key" && CANCEL_CHORDS.has(normalizeChord(input.chord))) {
    return { ok: false, reason: "cancel-is-never-confirm" };
  }
  if (input.channel === "controller" && CANCEL_BUTTONS.has(input.button)) {
    return { ok: false, reason: "cancel-is-never-confirm" };
  }
  if (input.channel === "touch" && CANCEL_GESTURES.has(input.gesture)) {
    return { ok: false, reason: "cancel-is-never-confirm" };
  }

  const shared =
    (input.channel === "key" && SHARED_CHORDS.has(normalizeChord(input.chord))) ||
    (input.channel === "controller" &&
      (SHARED_BUTTONS.has(input.button) || (input.button === "cross" && action !== "move"))) ||
    (input.channel === "pointer" && SHARED_POINTER.has(input.controlId));
  if (shared) return { ok: false, reason: "shared-confirm-rejected" };

  const matches =
    (input.channel === "key" && normalizeChord(input.chord) === control.chord) ||
    (input.channel === "controller" && input.button === control.controller) ||
    (input.channel === "touch" && input.gesture === control.touch) ||
    (input.channel === "pointer" && input.controlId === control.pointerId);
  if (!matches) return { ok: false, reason: "wrong-action" };

  const needsHold = control.holdMs > 0 && input.channel !== "key";
  if (needsHold && holdOf(input) < control.holdMs) {
    return { ok: false, reason: "hold-too-short" };
  }

  const required = expectedPhrase(locale, action);
  if (required) {
    const given = (phrase ?? "").trim().toLocaleUpperCase(locale === "fr" ? "fr" : "en");
    if (given !== required) return { ok: false, reason: "phrase-mismatch" };
  }

  return { ok: true, reason: "ok" };
}

export function controlFor(action: ActionKind): ActionControl {
  return CONTROLS[action];
}
