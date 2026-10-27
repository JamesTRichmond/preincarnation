/**
 * Unity Input System, ported to the browser.
 *
 * Control schemes (PlayerInput): keyboard | pointer | gamepad | touch
 * Last-actuated device wins; switching a scheme cancels the previous analog
 * (OnScreenStick SendValueToControl(Vector2.zero) + action.canceled).
 * Pointer uses Unity phases: started → performed → canceled.
 * Tap vs Hold match Unity defaults (tap ≤ 0.2s / 12px, hold ≥ 0.4s).
 * Gamepad is polled fresh every frame — never written into sticky virtual flags.
 */

export type ControlScheme = "keyboard" | "pointer" | "gamepad" | "touch";

export type PointerPhase = "idle" | "started" | "performed" | "canceled";

export type Actions = {
  scheme: ControlScheme;
  moveX: number;
  moveY: number;
  fromKeys: boolean;
  attack: boolean;
  attackPressed: boolean;
  interact: boolean;
  interactPressed: boolean;
  release: boolean;
  pausePressed: boolean;
  bombPressed: boolean;
  dashPressed: boolean;
  cyclePressed: boolean;
  usePressed: boolean;
  item: boolean;
  itemPressed: boolean;
  pointerHeld: boolean;
  pointerTap: boolean;
  pointerHoldEnd: boolean;
  pointerCanceled: boolean;
  pointerBtn: number;
  pointerClientX: number;
  pointerClientY: number;
};

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "KeyE",
  "KeyR",
  "KeyF",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyQ",
  "KeyV",
  "KeyY",
  "Tab",
  "Escape",
  "KeyP",
  "Enter",
  "ShiftLeft",
  "ShiftRight",
  "Minus",
  "Equal",
  "BracketLeft",
  "BracketRight",
  "Digit0",
]);

/** Unity InputSystem.settings.defaultDeadzoneMin ~ 0.125; we use a slightly larger radial. */
export function radialDeadzone(x: number, y: number, dz = 0.22) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export function createInput(target: HTMLElement) {
  const keys = new Set<string>();
  const injected = new Set<string>();
  let prevAttack = false;
  let prevInteract = false;
  let prevPause = false;
  let prevBomb = false;
  let prevDash = false;
  let prevCycle = false;
  let prevUse = false;
  let prevItem = false;
  const stick = { x: 0, y: 0 };
  const pointers = new Map<number, { x: number; y: number; role: "move" | "ui" }>();
  const virtual = {
    attack: false,
    interact: false,
    release: false,
    bomb: false,
    dash: false,
    use: false,
    item: false,
  };

  let scheme: ControlScheme = "keyboard";
  let pointerHeld = false;
  let pointerBtn = 0;
  let pointerClientX = 0;
  let pointerClientY = 0;
  let pointerDownAt = 0;
  let pointerDownX = 0;
  let pointerDownY = 0;
  let pointerTap = false;
  let pointerHoldEnd = false;
  let pointerCanceled = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (GAME_CODES.has(e.code)) e.preventDefault();
    keys.add(e.code);
    if (
      e.code.startsWith("Key") ||
      e.code.startsWith("Arrow") ||
      e.code === "Space"
    ) {
      scheme = "keyboard";
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);

  const zeroAnalog = () => {
    stick.x = 0;
    stick.y = 0;
    pointerHeld = false;
    pointerCanceled = true;
  };

  const clear = () => {
    keys.clear();
    injected.clear();
    virtual.attack = virtual.interact = virtual.release = virtual.bomb = virtual.dash = virtual.use = virtual.item = false;
    zeroAnalog();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });

  const setVirtual = (partial: {
    stick?: { x: number; y: number };
    attack?: boolean;
    interact?: boolean;
    release?: boolean;
    bomb?: boolean;
    dash?: boolean;
    use?: boolean;
    item?: boolean;
  }) => {
    if (partial.stick) {
      const r = radialDeadzone(partial.stick.x, partial.stick.y, 0.28);
      stick.x = r.x;
      stick.y = r.y;
      if (Math.hypot(r.x, r.y) > 0.02) scheme = "touch";
    }
    if (partial.attack !== undefined) virtual.attack = partial.attack;
    if (partial.interact !== undefined) virtual.interact = partial.interact;
    if (partial.release !== undefined) virtual.release = partial.release;
    if (partial.bomb !== undefined) virtual.bomb = partial.bomb;
    if (partial.dash !== undefined) virtual.dash = partial.dash;
    if (partial.use !== undefined) virtual.use = partial.use;
    if (partial.item !== undefined) virtual.item = partial.item;
  };

  const setKeys = (codes: string[]) => {
    injected.clear();
    for (const c of codes) injected.add(c);
    if (codes.length) scheme = "keyboard";
  };

  const notePointer = (e: PointerEvent, phase: PointerPhase) => {
    pointerClientX = e.clientX;
    pointerClientY = e.clientY;
    pointerBtn = e.button >= 0 ? e.button : pointerBtn;
    if (phase === "started") {
      pointerHeld = true;
      pointerCanceled = false;
      pointerTap = false;
      pointerHoldEnd = false;
      pointerDownAt = performance.now();
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
      scheme = "pointer";
    } else if (phase === "canceled") {
      const heldFor = performance.now() - pointerDownAt;
      const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      pointerTap = pointerHeld && heldFor < 200 && moved < 12;
      pointerHoldEnd = pointerHeld && heldFor >= 400;
      pointerHeld = false;
      pointerCanceled = true;
    }
  };

  const pollGamepad = () => {
    const pads = navigator.getGamepads?.() ?? [];
    let gx = 0;
    let gy = 0;
    let attack = false;
    let interact = false;
    let release = false;
    let bomb = false;
    let dash = false;
    let use = false;
    let item = false;
    let pause = false;
    let padLeft = false;
    let padRight = false;
    let padUp = false;
    let padDown = false;
    for (const pad of pads) {
      if (!pad) continue;
      const ax = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      if (Math.abs(ax.x) > Math.abs(gx)) gx = ax.x;
      if (Math.abs(ax.y) > Math.abs(gy)) gy = ax.y;
      if (pad.buttons[0]?.pressed) attack = true;
      if (pad.buttons[2]?.pressed) interact = true;
      if (pad.buttons[1]?.pressed) release = true;
      if (pad.buttons[3]?.pressed) item = true;
      if (pad.buttons[5]?.pressed) dash = true;
      if (pad.buttons[4]?.pressed) use = true;
      if (pad.buttons[9]?.pressed) pause = true;
      if (pad.buttons[12]?.pressed) padUp = true;
      if (pad.buttons[13]?.pressed) padDown = true;
      if (pad.buttons[14]?.pressed) padLeft = true;
      if (pad.buttons[15]?.pressed) padRight = true;
    }
    return { x: gx, y: gy, attack, interact, release, bomb, dash, use, item, pause, padLeft, padRight, padUp, padDown };
  };

  const sample = (): Actions => {
    pointerTap = false;
    pointerHoldEnd = false;
    const canceledThisFrame = pointerCanceled;
    pointerCanceled = false;

    const pad = pollGamepad();
    const has = (c: string) => keys.has(c) || injected.has(c);
    const fromKeys =
      has("KeyA") ||
      has("ArrowLeft") ||
      has("KeyD") ||
      has("ArrowRight") ||
      has("KeyW") ||
      has("ArrowUp") ||
      has("KeyS") ||
      has("ArrowDown");
    const padMag = Math.hypot(pad.x, pad.y);
    const stickMag = Math.hypot(stick.x, stick.y);

    if (fromKeys) scheme = "keyboard";
    else if (padMag > 0.02 || pad.padLeft || pad.padRight || pad.padUp || pad.padDown) scheme = "gamepad";
    else if (stickMag > 0.02) scheme = "touch";
    else if (pointerHeld) scheme = "pointer";

    let mx = 0;
    let my = 0;
    if (scheme === "keyboard") {
      if (has("KeyA") || has("ArrowLeft")) mx -= 1;
      if (has("KeyD") || has("ArrowRight")) mx += 1;
      if (has("KeyW") || has("ArrowUp")) my -= 1;
      if (has("KeyS") || has("ArrowDown")) my += 1;
    } else if (scheme === "gamepad") {
      mx = pad.x;
      my = pad.y;
      if (pad.padLeft) mx -= 1;
      if (pad.padRight) mx += 1;
      if (pad.padUp) my -= 1;
      if (pad.padDown) my += 1;
    } else if (scheme === "touch") {
      mx = stick.x;
      my = stick.y;
    }

    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }

    const attack = has("Space") || has("KeyZ") || virtual.attack || pad.attack;
    const interact = has("KeyE") || has("Enter") || virtual.interact || pad.interact;
    const pause = has("Escape") || has("KeyP") || pad.pause;
    const bomb = has("KeyF") || has("KeyX") || virtual.bomb || pad.bomb;
    const dash = has("ShiftLeft") || has("ShiftRight") || has("KeyC") || virtual.dash || pad.dash;
    const cycle = has("KeyQ") || has("Tab");
    const use = has("KeyV") || virtual.use || pad.use;
    const item = has("KeyY") || virtual.item || pad.item;

    const actions: Actions = {
      scheme,
      moveX: mx,
      moveY: my,
      fromKeys: scheme === "keyboard",
      attack,
      attackPressed: attack && !prevAttack,
      interact,
      interactPressed: interact && !prevInteract,
      release: has("KeyR") || virtual.release || pad.release,
      pausePressed: pause && !prevPause,
      bombPressed: bomb && !prevBomb,
      dashPressed: dash && !prevDash,
      cyclePressed: cycle && !prevCycle,
      usePressed: use && !prevUse,
      item: item,
      itemPressed: item && !prevItem,
      pointerHeld,
      pointerTap,
      pointerHoldEnd,
      pointerCanceled: canceledThisFrame,
      pointerBtn,
      pointerClientX,
      pointerClientY,
    };
    prevAttack = attack;
    prevInteract = interact;
    prevPause = pause;
    prevBomb = bomb;
    prevDash = dash;
    prevCycle = cycle;
    prevUse = use;
    prevItem = item;
    return actions;
  };

  const dispose = () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", clear);
  };

  return {
    sample,
    setVirtual,
    setKeys,
    notePointer,
    cancelAnalog: zeroAnalog,
    keys,
    injected,
    dispose,
    target,
    pointers,
  };
}
