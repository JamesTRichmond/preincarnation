import { SNES_H, SNES_W } from "./snes.ts";

/** Comfort settings. Not the county save. Forget all lives does not remove this key. */
export const A11Y_KEY = "preincarnation.a11y.v1";

export const SCALE_STEPS = [1, 1.25, 1.5, 1.75, 2] as const;
export type PictureScale = (typeof SCALE_STEPS)[number];

export const SHAKE_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

export type StickSide = "left" | "right";

export type A11ySettings = {
  version: 1;
  pictureScale: PictureScale;
  textScale: PictureScale;
  stickSide: StickSide;
  highContrast: boolean;
  reducedFlashing: boolean;
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
    pictureScale: snapStep(typeof raw.pictureScale === "number" ? raw.pictureScale : base.pictureScale, SCALE_STEPS, base.pictureScale) as PictureScale,
    textScale: snapStep(typeof raw.textScale === "number" ? raw.textScale : base.textScale, SCALE_STEPS, base.textScale) as PictureScale,
    stickSide: raw.stickSide === "right" ? "right" : "left",
    highContrast: flag(raw.highContrast, base.highContrast),
    reducedFlashing: flag(raw.reducedFlashing, base.reducedFlashing),
    shakeStrength: snapStep(typeof raw.shakeStrength === "number" ? raw.shakeStrength : base.shakeStrength, SHAKE_STEPS, base.shakeStrength),
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

export function writeA11y(patch: Partial<A11ySettings>, store: Store = browserStore()): A11ySettings {
  const next = normalizeA11y({ ...readA11y(store), ...patch, version: 1 });
  try {
    store?.setItem(A11Y_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  for (const listener of listeners) listener(next);
  return next;
}

/** Integer fit of the stage, then the picture step. The frame stays 320×240 in tiles. */
export function picturePixels(stageW: number, stageH: number, pictureScale: number): { w: number; h: number } {
  const scale = snapStep(pictureScale, SCALE_STEPS, 1);
  const w = Number.isFinite(stageW) && stageW > 0 ? stageW : SNES_W;
  const h = Number.isFinite(stageH) && stageH > 0 ? stageH : SNES_H;
  const base = Math.max(1, Math.floor(Math.min(w / SNES_W, h / SNES_H)));
  const mul = base * scale;
  return { w: Math.round(SNES_W * mul), h: Math.round(SNES_H * mul) };
}

export function boneFlashAlpha(flash: number, reducedFlashing: boolean): number {
  if (reducedFlashing || !(flash > 0)) return 0;
  return 0.25;
}

/** Pause and dialogue are buttons. The county itself stays on the canvas. */
export function focusOrder(mode: string): string[] {
  if (mode === "dialogue") return ["choice"];
  if (mode === "pause") return ["resume", "kitchen", "picture", "contrast", "flash", "stick", "export", "import"];
  if (mode === "kitchen") return ["close"];
  return [];
}

export function readerHint(job: string): string {
  return job.trim() || "The Marble Vein is east of the Green.";
}

/** Slash sits on the edge opposite the walk stick. */
export function attackEdge(stickSide: StickSide): StickSide {
  return stickSide === "left" ? "right" : "left";
}
