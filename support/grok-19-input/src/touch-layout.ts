import { MIN_TOUCH_PX, SHRINE_GAP_PX } from "./timing.ts";
import type { PlacedControl, TouchControlId, TouchSettings, Viewport } from "./types.ts";
import { TOUCH_CONTROLS } from "./types.ts";

const BASE: Record<TouchControlId, number> = {
  stick: 128,
  blade: 76,
  offhand: 60,
  interact: 60,
  pause: 52,
  shrine: 68,
};

const COMBAT: TouchControlId[] = ["stick", "blade", "offhand", "interact"];

export function defaultPositions(
  handedness: "right" | "left",
): Record<TouchControlId, { x: number; y: number }> {
  const right: Record<TouchControlId, { x: number; y: number }> = {
    stick: { x: 0.18, y: 0.7 },
    blade: { x: 0.84, y: 0.74 },
    offhand: { x: 0.68, y: 0.58 },
    interact: { x: 0.88, y: 0.5 },
    pause: { x: 0.9, y: 0.1 },
    shrine: { x: 0.5, y: 0.14 },
  };
  if (handedness === "right") return right;
  const left = {} as Record<TouchControlId, { x: number; y: number }>;
  for (const id of TOUCH_CONTROLS) {
    left[id] = { x: 1 - right[id].x, y: right[id].y };
  }
  return left;
}

export function rectGap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): number {
  const sepX = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const sepY = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  if (sepX === 0 && sepY === 0) {
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return -Math.min(overlapX, overlapY);
  }
  if (sepX === 0) return sepY;
  if (sepY === 0) return sepX;
  return Math.hypot(sepX, sepY);
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

type Inner = { x: number; y: number; w: number; h: number };

function innerBox(viewport: Viewport): Inner {
  const top = clamp(viewport.safe.top, 0, Math.max(0, viewport.height - MIN_TOUCH_PX));
  const left = clamp(viewport.safe.left, 0, Math.max(0, viewport.width - MIN_TOUCH_PX));
  const right = clamp(viewport.safe.right, 0, Math.max(0, viewport.width - left - MIN_TOUCH_PX));
  const bottom = clamp(
    viewport.safe.bottom,
    0,
    Math.max(0, viewport.height - top - MIN_TOUCH_PX),
  );
  return {
    x: left,
    y: top,
    w: Math.max(MIN_TOUCH_PX, viewport.width - left - right),
    h: Math.max(MIN_TOUCH_PX, viewport.height - top - bottom),
  };
}

function clampRect(rect: PlacedControl, inner: Inner): void {
  const size = Math.max(MIN_TOUCH_PX, Math.min(rect.w, inner.w, inner.h));
  rect.w = size;
  rect.h = size;
  rect.x = clamp(rect.x, inner.x, inner.x + inner.w - size);
  rect.y = clamp(rect.y, inner.y, inner.y + inner.h - size);
}

function separateShrine(rects: PlacedControl[], inner: Inner): void {
  const shrine = rects.find((rect) => rect.id === "shrine");
  if (!shrine) return;
  for (let step = 0; step < 40; step += 1) {
    let moved = false;
    for (const id of COMBAT) {
      const other = rects.find((rect) => rect.id === id);
      if (!other || rectGap(shrine, other) >= SHRINE_GAP_PX) continue;
      const scx = shrine.x + shrine.w / 2;
      const scy = shrine.y + shrine.h / 2;
      const ocx = other.x + other.w / 2;
      const ocy = other.y + other.h / 2;
      let vx = scx - ocx;
      let vy = scy - ocy;
      if (Math.hypot(vx, vy) < 1) {
        vx = 0;
        vy = -1;
      }
      const mag = Math.hypot(vx, vy) || 1;
      shrine.x += (vx / mag) * 18;
      shrine.y += (vy / mag) * 18 - 6;
      clampRect(shrine, inner);
      moved = true;
    }
    if (!moved) break;
  }
}

export function layoutTouch(viewport: Viewport, settings: TouchSettings): PlacedControl[] {
  const inner = innerBox(viewport);
  const margin = 10;
  const box: Inner = {
    x: inner.x + margin,
    y: inner.y + margin,
    w: Math.max(MIN_TOUCH_PX, inner.w - margin * 2),
    h: Math.max(MIN_TOUCH_PX, inner.h - margin * 2),
  };
  const scale = clamp(settings.scale, 0.75, 1.45);
  const narrow = box.w < 520 ? 0.78 : 1;
  const positions = settings.positions ?? defaultPositions(settings.handedness);
  const rects: PlacedControl[] = TOUCH_CONTROLS.map((id) => {
    const pos = positions[id] ?? defaultPositions(settings.handedness)[id];
    const size = Math.max(
      MIN_TOUCH_PX,
      Math.min(BASE[id] * scale * narrow, box.w * 0.3, box.h * 0.22),
    );
    const cx = box.x + clamp(pos.x, 0, 1) * box.w;
    const cy = box.y + clamp(pos.y, 0, 1) * box.h;
    const rect: PlacedControl = {
      id,
      x: cx - size / 2,
      y: cy - size / 2,
      w: size,
      h: size,
    };
    clampRect(rect, box);
    return rect;
  });
  separateShrine(rects, box);
  return rects;
}

export function pointToNormal(
  viewport: Viewport,
  x: number,
  y: number,
): { x: number; y: number } {
  const inner = innerBox(viewport);
  return {
    x: clamp((x - inner.x) / inner.w, 0, 1),
    y: clamp((y - inner.y) / inner.h, 0, 1),
  };
}

export function hitControl(
  rects: PlacedControl[],
  x: number,
  y: number,
): TouchControlId | null {
  const order: TouchControlId[] = ["pause", "shrine", "interact", "offhand", "blade", "stick"];
  for (const id of order) {
    const rect = rects.find((item) => item.id === id);
    if (!rect) continue;
    if (x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h) return id;
  }
  return null;
}

export function normalizedCenter(
  rect: PlacedControl,
  viewport: Viewport,
): { x: number; y: number } {
  const inner = innerBox(viewport);
  return {
    x: clamp((rect.x + rect.w / 2 - inner.x) / inner.w, 0, 1),
    y: clamp((rect.y + rect.h / 2 - inner.y) / inner.h, 0, 1),
  };
}
