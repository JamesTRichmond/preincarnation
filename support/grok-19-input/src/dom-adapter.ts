import type { InputEngine } from "./engine.ts";
import type { PadSnap, SafeInsets } from "./types.ts";

export type DomInputOptions = {
  /** Element that owns touch/mouse pointers. Keyboard stays on window. */
  surface: HTMLElement;
  onViewport?: (width: number, height: number, safe: SafeInsets) => void;
};

function typingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function readSafeInsets(): SafeInsets {
  if (typeof document === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 };
  const probe = document.createElement("div");
  probe.style.cssText = [
    "position:fixed",
    "visibility:hidden",
    "pointer-events:none",
    "top:env(safe-area-inset-top)",
    "right:env(safe-area-inset-right)",
    "bottom:env(safe-area-inset-bottom)",
    "left:env(safe-area-inset-left)",
  ].join(";");
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  return {
    top: Math.max(0, rect.top),
    right: Math.max(0, window.innerWidth - rect.right),
    bottom: Math.max(0, window.innerHeight - rect.bottom),
    left: Math.max(0, rect.left),
  };
}

export function readGamepads(): PadSnap[] {
  const nav = navigator as Navigator & { getGamepads?: () => Array<Gamepad | null> };
  if (typeof nav.getGamepads !== "function") return [];
  let raw: Array<Gamepad | null> = [];
  try {
    raw = nav.getGamepads() ?? [];
  } catch {
    return [];
  }
  const pads: PadSnap[] = [];
  for (const pad of raw) {
    if (!pad) continue;
    pads.push({
      index: pad.index,
      id: pad.id,
      mapping: pad.mapping,
      connected: pad.connected,
      buttons: pad.buttons.map((button) => ({ pressed: button.pressed, value: button.value })),
      axes: [...pad.axes],
    });
  }
  return pads;
}

export function gamepadApiPresent(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.getGamepads === "function";
}

/** Subscribes a surface to keyboard, pointer, gamepad hot-plug, and focus loss. */
export function attachDomInput(engine: InputEngine, options: DomInputOptions): () => void {
  const { surface } = options;

  const syncViewport = () => {
    const rect = surface.getBoundingClientRect();
    const safe = readSafeInsets();
    engine.setViewport({
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
      safe,
    });
    options.onViewport?.(rect.width, rect.height, safe);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (typingTarget(event.target)) return;
    if (engine.ownsCode(event.code) || event.code.startsWith("Arrow")) event.preventDefault();
    engine.keyDown(event.code, event.repeat);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (typingTarget(event.target)) return;
    engine.keyUp(event.code);
  };
  const local = (event: PointerEvent) => {
    const rect = surface.getBoundingClientRect();
    return { id: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const onPointerDown = (event: PointerEvent) => {
    surface.setPointerCapture?.(event.pointerId);
    const point = local(event);
    engine.pointerDown({ ...point, type: event.pointerType });
    event.preventDefault();
  };
  const onPointerMove = (event: PointerEvent) => {
    engine.pointerMove(local(event));
  };
  const onPointerUp = (event: PointerEvent) => {
    engine.pointerUp({ id: event.pointerId });
  };
  const onPointerCancel = (event: PointerEvent) => {
    engine.pointerCancel({ id: event.pointerId });
  };
  const onBlur = () => engine.blur();
  const onFocus = () => engine.focus();
  const onVisibility = () => engine.visibility(document.hidden);
  const onPageHide = () => engine.blur();
  const onConnect = () => engine.pollGamepads(readGamepads());
  const onDisconnect = () => engine.pollGamepads(readGamepads());

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  surface.addEventListener("pointerdown", onPointerDown);
  surface.addEventListener("pointermove", onPointerMove);
  surface.addEventListener("pointerup", onPointerUp);
  surface.addEventListener("pointercancel", onPointerCancel);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("gamepadconnected", onConnect);
  window.addEventListener("gamepaddisconnected", onDisconnect);
  window.addEventListener("resize", syncViewport);
  window.visualViewport?.addEventListener("resize", syncViewport);
  syncViewport();

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    surface.removeEventListener("pointerdown", onPointerDown);
    surface.removeEventListener("pointermove", onPointerMove);
    surface.removeEventListener("pointerup", onPointerUp);
    surface.removeEventListener("pointercancel", onPointerCancel);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("gamepadconnected", onConnect);
    window.removeEventListener("gamepaddisconnected", onDisconnect);
    window.removeEventListener("resize", syncViewport);
    window.visualViewport?.removeEventListener("resize", syncViewport);
  };
}
