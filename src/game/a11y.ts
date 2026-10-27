import { SNES_H, SNES_W } from "./snes.ts";

/** Comfort settings. Not the county save. Forget all lives does not remove this key. */
export const A11Y_KEY = "preincarnation.a11y.v1";

export const SCALE_STEPS = [1, 1.25, 1.5, 1.75, 2] as const;
export type PictureScale = (typeof SCALE_STEPS)[number];

export const SHAKE_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

export type StickSide = "left" | "right";

export type A11ySettings = {
  version: 1;
  /** Magnifies the 320×240 frame. Not the camera (Minus / Equal). */
  pictureScale: PictureScale;
  /** Dialogue, hints, and the pause settings. */
  textScale: PictureScale;
  /** Walk stick. The other edge keeps Slash. Default left matches the county. */
  stickSide: StickSide;
  highContrast: boolean;
  reducedFlashing: boolean;
  /** 1 is the kick the county already uses. 0 holds the picture still. */
  shakeStrength: number;
};

type Store = Pick<Storage, "getItem" | "setItem"> | null;

const listeners = new Set<(settings: A11ySettings) => void>();

export function defaultA11y(): A11ySettings {
  return {
    version: 1,
    pictureScale: 1,
    textScale: 1,
    stickSide: "left",
    highContrast: false,
    reducedFlashing: false,
    shakeStrength: 1,
  };
}

export function snapStep(n: number, steps: readonly number[], fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  let best = fallback;
  let dist = Infinity;
  for (const step of steps) {
    const d = Math.abs(step - n);
    if (d < dist) {
      dist = d;
      best = step;
    }
  }
  return best;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeA11y(input: unknown): A11ySettings {
  const base = defaultA11y();
  if (!input || typeof input !== "object") return base;
  const raw = input as Partial<A11ySettings>;
  return {
    version: 1,
    pictureScale: snapStep(
      typeof raw.pictureScale === "number" ? raw.pictureScale : base.pictureScale,
      SCALE_STEPS,
      base.pictureScale,
    ) as PictureScale,
    textScale: snapStep(
      typeof raw.textScale === "number" ? raw.textScale : base.textScale,
      SCALE_STEPS,
      base.textScale,
    ) as PictureScale,
    stickSide: raw.stickSide === "right" ? "right" : "left",
    highContrast: flag(raw.highContrast, base.highContrast),
    reducedFlashing: flag(raw.reducedFlashing, base.reducedFlashing),
    shakeStrength: snapStep(
      typeof raw.shakeStrength === "number" ? raw.shakeStrength : base.shakeStrength,
      SHAKE_STEPS,
      base.shakeStrength,
    ),
  };
}

function browserStore(): Store {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function readA11y(store: Store = browserStore()): A11ySettings {
  if (!store) return defaultA11y();
  try {
    const raw = store.getItem(A11Y_KEY);
    if (!raw) return defaultA11y();
    return normalizeA11y(JSON.parse(raw));
  } catch {
    return defaultA11y();
  }
}

export function writeA11y(
  patch: Partial<A11ySettings>,
  store: Store = browserStore(),
): A11ySettings {
  const next = normalizeA11y({ ...readA11y(store), ...patch, version: 1 });
  try {
    store?.setItem(A11Y_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  for (const listener of listeners) listener(next);
  return next;
}

export function subscribeA11y(listener: (settings: A11ySettings) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Integer fit of the stage, then the picture step. The frame may scroll. */
export function picturePixels(
  stageW: number,
  stageH: number,
  pictureScale: number,
): { w: number; h: number } {
  const scale = snapStep(pictureScale, SCALE_STEPS, 1);
  const w = Number.isFinite(stageW) && stageW > 0 ? stageW : SNES_W;
  const h = Number.isFinite(stageH) && stageH > 0 ? stageH : SNES_H;
  const base = Math.max(1, Math.floor(Math.min(w / SNES_W, h / SNES_H)));
  const mul = base * scale;
  return { w: Math.round(SNES_W * mul), h: Math.round(SNES_H * mul) };
}

/**
 * Nearest-neighbor scale for a canvas already sized in quarter steps.
 * A size that is not a quarter step keeps the old integer fit.
 */
export function presentationScale(cssW: number, cssH: number): number {
  if (!(cssW > 0) || !(cssH > 0)) return 1;
  const fit = Math.min(cssW / SNES_W, cssH / SNES_H);
  const snapped = Math.round(fit * 4) / 4;
  if (snapped >= 1 && Math.abs(fit - snapped) < 0.02) return snapped;
  return Math.max(1, Math.floor(fit));
}

/** Same kick as the county when strength is 1. Exact zero when shake, strength, or trauma is off. */
export function shakePixels(
  trauma: number,
  enabled: boolean,
  strength: number,
  rand: () => number,
): { ox: number; oy: number } {
  if (!enabled || !(strength > 0) || !(trauma > 0)) return { ox: 0, oy: 0 };
  const amp = trauma * trauma * 8 * Math.min(1, strength);
  return { ox: (rand() - 0.5) * amp, oy: (rand() - 0.5) * amp };
}

/** The bone wash. Off when the player refuses flashes, or when nothing raised one. */
export function boneFlashAlpha(flash: number, reducedFlashing: boolean): number {
  if (reducedFlashing || !(flash > 0)) return 0;
  return 0.25;
}
