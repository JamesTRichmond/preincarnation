import { clearSlot, commitRebind, keyboardBindings } from "./bindings.ts";
import { digitalStick, mergeAxis } from "./deadzone.ts";
import { defaultPersisted, emptyActions, loadPersisted, savePersisted } from "./persistence.ts";
import { classifyPad, promptFor } from "./prompts.ts";
import { RECOVERY_CODE, TIMING } from "./timing.ts";
import {
  defaultPositions,
  hitControl,
  layoutTouch,
  normalizedCenter,
  pointToNormal,
} from "./touch-layout.ts";
import type {
  ActionId,
  Binding,
  BindingTable,
  ConflictPolicy,
  DiscreteIntent,
  FrameInput,
  Intent,
  MovementPlane,
  OffhandMode,
  PadSnap,
  PlacedControl,
  PromptDevice,
  RebindResult,
  ShrinePhase,
  StorageLike,
  TouchControlId,
  TouchSettings,
  Viewport,
} from "./types.ts";
import { ACTIONS } from "./types.ts";

type Clock = () => number;

type PointerState = {
  id: number;
  x: number;
  y: number;
  type: string;
  control: TouchControlId | null;
  cancelled: boolean;
};

type BladeState = { t0: number; spinning: boolean; cancelled: boolean };
type ShrineState = { t0: number; completed: boolean; cancelled: boolean };

type DirVote = { v: -1 | 0 | 1; at: number };

type DirAction = "moveNorth" | "moveSouth" | "moveEast" | "moveWest";

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

/**
 * Action-level input for a four-direction action-adventure.
 * Devices write bindings; gameplay reads FrameInput. This class does not
 * define damage, spin radius, shrine rewards, or progression.
 */
export class InputEngine {
  private readonly now: Clock;
  private readonly storage: StorageLike;
  private readonly gamepadApi: boolean;

  private bindings: BindingTable;
  private offhandMode: OffhandMode;
  private movementPlane: MovementPlane;
  private deadzone: number;
  private touch: TouchSettings;
  private viewport: Viewport = {
    width: 1280,
    height: 720,
    safe: { top: 0, right: 0, bottom: 0, left: 0 },
  };

  private keys = new Set<string>();
  private keyAt = new Map<string, number>();
  private pointers = new Map<number, PointerState>();
  private drag: { pointerId: number; control: TouchControlId } | null = null;
  private layoutEditing = false;

  private pads = new Map<number, PadSnap>();
  private prevPadDown = new Map<number, Set<number>>();
  private latchedButtons = new Map<number, Set<number>>();
  private axisLatched = new Set<number>();
  private padDirAt = new Map<string, number>();
  private touchDirAt = new Map<string, number>();

  private blade: BladeState | null = null;
  private shrine: ShrineState | null = null;
  private offhandLatched = false;
  private prev = {
    blade: false,
    offhand: false,
    interact: false,
    pause: false,
    shrine: false,
  };

  private menuOpen = false;
  private capture: { action: ActionId; slot: number; chord: boolean } | null = null;
  private pendingBinding: Binding | null = null;
  private pendingConflict: ActionId | null = null;

  private activeDevice: PromptDevice = "keyboard";
  private padMeta: FrameInput["gamepad"] = {
    support: "api-present",
    connection: "none",
    mapping: null,
    nonstandard: false,
    index: null,
    id: null,
  };

  private f8Down = false;
  private f8At = 0;
  private f8DidReset = false;
  private f8Released = false;
  private pumping = false;
  private offhandSuspended = false;
  private view = {
    moveX: 0 as -1 | 0 | 1,
    moveY: 0 as -1 | 0 | 1,
    bladeDown: false,
    offhandDown: false,
    interactDown: false,
    pauseDown: false,
    shrineDown: false,
  };

  private queued: Intent[] = [];
  private buffer: { type: DiscreteIntent; at: number }[] = [];
  private interrupted = false;

  constructor(options?: {
    now?: Clock;
    storage?: StorageLike;
    gamepadApi?: boolean;
    initialDevice?: PromptDevice;
  }) {
    this.now = options?.now ?? (() => Date.now());
    this.storage = options?.storage ?? memoryStorage();
    this.gamepadApi = options?.gamepadApi ?? true;
    this.padMeta.support = this.gamepadApi ? "api-present" : "api-missing";
    const loaded = loadPersisted(this.storage);
    this.bindings = loaded.bindings;
    this.offhandMode = loaded.offhandMode;
    this.movementPlane = loaded.movementPlane;
    this.deadzone = loaded.deadzone;
    this.touch = loaded.touch;
    if (options?.initialDevice) this.activeDevice = options.initialDevice;
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  setLayoutEditing(editing: boolean): void {
    this.layoutEditing = editing;
    if (!editing) this.drag = null;
  }

  setMovementPlane(plane: MovementPlane): void {
    this.movementPlane = plane;
    this.persist();
  }

  setDeadzone(deadzone: number): void {
    this.deadzone = Math.min(0.5, Math.max(0.05, deadzone));
    this.persist();
  }

  setOffhandMode(mode: OffhandMode): void {
    if (mode === this.offhandMode) return;
    if (this.offhandLatched) {
      this.queued.push({ type: "offhand", phase: "toggleOff" });
      this.offhandLatched = false;
    }
    this.offhandMode = mode;
    this.persist();
  }

  setMenuOpen(open: boolean): void {
    this.menuOpen = open;
    if (!open) this.offhandSuspended = false;
    this.pump();
  }

  touchRects(): PlacedControl[] {
    return layoutTouch(this.viewport, this.touch);
  }

  getTouchSettings(): TouchSettings {
    return structuredClone(this.touch);
  }

  getSettings(): {
    deadzone: number;
    movementPlane: MovementPlane;
    offhandMode: OffhandMode;
    touch: TouchSettings;
  } {
    return {
      deadzone: this.deadzone,
      movementPlane: this.movementPlane,
      offhandMode: this.offhandMode,
      touch: structuredClone(this.touch),
    };
  }

  setHandedness(handedness: "right" | "left"): void {
    this.touch = {
      ...this.touch,
      handedness,
      positions: null,
    };
    this.persist();
  }

  setTouchScale(scale: number): void {
    this.touch = { ...this.touch, scale: Math.min(1.45, Math.max(0.75, scale)) };
    this.persist();
  }

  setTouchOpacity(opacity: number): void {
    this.touch = { ...this.touch, opacity: Math.min(1, Math.max(0.4, opacity)) };
    this.persist();
  }

  getBindings(): BindingTable {
    return structuredClone(this.bindings);
  }

  beginCapture(action: ActionId, slot: number, chord = false): void {
    this.capture = { action, slot, chord };
    this.pendingBinding = null;
    this.pendingConflict = null;
  }

  cancelCapture(): void {
    this.capture = null;
    this.pendingBinding = null;
    this.pendingConflict = null;
  }

  rebind(action: ActionId, slot: number, binding: Binding, policy: ConflictPolicy): RebindResult {
    const outcome = commitRebind(this.bindings, action, slot, binding, policy);
    if (outcome.result.ok) {
      this.bindings = outcome.table;
      this.persist();
      this.capture = null;
      this.pendingBinding = null;
      this.pendingConflict = null;
    }
    return outcome.result;
  }

  clearBinding(action: ActionId, slot: number): RebindResult {
    const outcome = clearSlot(this.bindings, action, slot);
    if (outcome.result.ok) {
      this.bindings = outcome.table;
      this.persist();
    }
    return outcome.result;
  }

  /** Restores bindings and modes. Touch layout is kept unless `layout` is set. */
  resetBindings(layout = false): void {
    const fresh = defaultPersisted();
    this.bindings = fresh.bindings;
    this.offhandMode = fresh.offhandMode;
    this.movementPlane = fresh.movementPlane;
    this.deadzone = fresh.deadzone;
    if (layout) this.touch = fresh.touch;
    if (this.offhandLatched) {
      this.queued.push({ type: "offhand", phase: "toggleOff" });
      this.offhandLatched = false;
    }
    this.cancelCapture();
    this.persist();
  }

  consumeBuffered(type: DiscreteIntent): boolean {
    const now = this.now();
    this.buffer = this.buffer.filter((item) => now - item.at <= TIMING.bufferMs);
    const index = this.buffer.findIndex((item) => item.type === type);
    if (index < 0) return false;
    this.buffer.splice(index, 1);
    return true;
  }

  keyDown(code: string, repeat = false): void {
    if (repeat) return;
    if (code === RECOVERY_CODE) {
      if (!this.f8Down) {
        this.f8Down = true;
        this.f8At = this.now();
        this.f8DidReset = false;
      }
      return;
    }
    if (this.capture) {
      if (code === "Escape") {
        this.cancelCapture();
        return;
      }
      this.resolveCapture({ kind: "key", code });
      return;
    }
    if (this.keys.has(code)) return;
    this.keys.add(code);
    this.keyAt.set(code, this.now());
    this.noteDevice("keyboard");
    this.pump();
  }

  keyUp(code: string): void {
    if (code === RECOVERY_CODE) {
      this.f8Released = true;
      return;
    }
    this.keys.delete(code);
    this.keyAt.delete(code);
    this.pump();
  }

  /** Test / QA probe: the listed codes are held, everything else is released. */
  setHeldKeys(codes: string[]): void {
    const next = new Set(codes.filter((code) => code !== RECOVERY_CODE));
    for (const code of [...this.keys]) {
      if (!next.has(code)) this.keyUp(code);
    }
    for (const code of next) {
      if (!this.keys.has(code)) this.keyDown(code, false);
    }
  }

  pointerDown(event: { id: number; x: number; y: number; type: string }): void {
    const rects = this.touchRects();
    const control = hitControl(rects, event.x, event.y);
    this.pointers.set(event.id, {
      id: event.id,
      x: event.x,
      y: event.y,
      type: event.type,
      control,
      cancelled: false,
    });
    if (control) this.noteDevice("touch");
    if (this.layoutEditing && control) {
      this.drag = { pointerId: event.id, control };
      return;
    }
    this.pump();
  }

  pointerMove(event: { id: number; x: number; y: number }): void {
    const pointer = this.pointers.get(event.id);
    if (!pointer) return;
    pointer.x = event.x;
    pointer.y = event.y;
    if (this.drag && this.drag.pointerId === event.id) {
      this.moveControl(this.drag.control, event.x, event.y);
      return;
    }
    if (!pointer.control || pointer.control === "stick" || pointer.cancelled) return;
    const still = hitControl(this.touchRects(), event.x, event.y);
    if (still !== pointer.control) {
      pointer.cancelled = true;
      if (pointer.control === "blade" && this.blade && !this.blade.spinning) {
        this.blade.cancelled = true;
      }
      if (pointer.control === "shrine" && this.shrine && !this.shrine.completed) {
        this.shrine.cancelled = true;
      }
      this.pump();
    }
  }

  pointerUp(event: { id: number }): void {
    const pointer = this.pointers.get(event.id);
    if (this.drag?.pointerId === event.id) {
      this.drag = null;
      this.persist();
    }
    if (pointer) this.pointers.delete(event.id);
    if (!this.layoutEditing) this.pump();
  }

  pointerCancel(event: { id: number }): void {
    const pointer = this.pointers.get(event.id);
    if (!pointer) return;
    pointer.cancelled = true;
    if (this.drag?.pointerId === event.id) this.drag = null;
    this.pointers.delete(event.id);
    if (pointer.control === "shrine" && this.shrine && !this.shrine.completed) {
      this.shrine.cancelled = true;
    }
    if (pointer.control === "blade" && this.blade && !this.blade.spinning) {
      this.blade.cancelled = true;
    }
    this.pump();
  }

  pollGamepads(list: Array<PadSnap | null>): void {
    if (!this.gamepadApi) {
      this.padMeta.support = "api-missing";
      return;
    }
    const connected = list.filter((pad): pad is PadSnap => !!pad && pad.connected);
    const live = new Set(connected.map((pad) => pad.index));
    for (const index of [...this.pads.keys()]) {
      if (!live.has(index)) {
        this.pads.delete(index);
        this.prevPadDown.delete(index);
        this.latchedButtons.delete(index);
        this.axisLatched.delete(index);
        this.queued.push({ type: "deviceLost", index });
        this.padMeta.connection = "lost";
      }
    }
    for (const pad of connected) {
      const isNew = !this.pads.has(pad.index);
      if (isNew) {
        const held = new Set<number>();
        pad.buttons.forEach((button, index) => {
          if (this.buttonPhysicallyDown(button, index)) held.add(index);
        });
        if (held.size > 0) this.latchedButtons.set(pad.index, held);
        if (Math.hypot(pad.axes[0] ?? 0, pad.axes[1] ?? 0) >= this.deadzone) {
          this.axisLatched.add(pad.index);
        }
      }
      this.pads.set(pad.index, pad);
      this.padMeta = {
        support: "api-present",
        connection: "connected",
        mapping: pad.mapping,
        nonstandard: pad.mapping !== "standard",
        index: pad.index,
        id: pad.id,
      };
      this.notePadEdges(pad);
    }
    if (connected.length === 0 && this.padMeta.connection === "connected") {
      this.padMeta.connection = "lost";
    }
    this.pump();
  }

  blur(): void {
    this.interrupted = true;
    this.releaseMomentary();
    this.pump();
  }

  focus(): void {
    this.interrupted = false;
    this.gatePads();
  }

  visibility(hidden: boolean): void {
    if (hidden) this.blur();
    else this.focus();
  }

  tick(): FrameInput {
    const now = this.now();
    const warnings: string[] = [];
    const edges: Intent[] = [];

    if (this.f8Down && !this.f8DidReset && now - this.f8At >= TIMING.recoveryHoldMs) {
      this.resetBindings(false);
      this.f8DidReset = true;
      edges.push({ type: "bindingsReset" });
    }
    if (this.f8Released) {
      if (!this.f8DidReset) edges.push({ type: "openSettings" });
      this.f8Down = false;
      this.f8Released = false;
      this.f8DidReset = false;
    }

    this.pump();
    edges.push(...this.queued);
    this.queued = [];

    const { moveX, moveY, offhandDown, interactDown, pauseDown, shrineDown } = this.view;
    this.buffer = this.buffer.filter((item) => now - item.at <= TIMING.bufferMs);
    if (this.padMeta.nonstandard) warnings.push("gamepad-nonstandard");
    if (edges.some((edge) => edge.type === "deviceLost")) warnings.push("gamepad-disconnected");

    const held = emptyActions();
    held.moveEast = moveX === 1;
    held.moveWest = moveX === -1;
    held.moveNorth = moveY === 1;
    held.moveSouth = moveY === -1;
    held.blade = this.blade !== null && !this.blade.cancelled;
    held.offhand = this.offhandMode === "toggle" ? this.offhandLatched : offhandDown;
    held.interact = interactDown;
    held.pause = pauseDown;
    held.shrineRelease = shrineDown && this.shrine?.cancelled !== true;

    const prompts = {} as Record<ActionId, string>;
    for (const action of ACTIONS) {
      prompts[action] = promptFor(action, this.activeDevice, this.bindings[action]);
    }

    return {
      moveX,
      moveY,
      held,
      edges,
      bladePhase: this.blade?.cancelled
        ? "idle"
        : this.blade?.spinning
          ? "spinning"
          : this.blade
            ? "pending"
            : "idle",
      shrine: {
        phase: this.shrinePhase(),
        progress: this.shrineProgress(now),
      },
      offhandLatched: this.offhandLatched,
      offhandMode: this.offhandMode,
      activeDevice: this.activeDevice,
      menuOpen: this.menuOpen,
      gameplaySuppressed: this.menuOpen || this.capture !== null,
      gamepad: { ...this.padMeta },
      capture: this.capture ? { ...this.capture } : null,
      pendingBinding: this.pendingBinding,
      pendingConflict: this.pendingConflict,
      warnings,
      prompts,
    };
  }

  private pump(): void {
    if (this.pumping) return;
    this.pumping = true;
    const edges: Intent[] = [];
    this.sampleGestures(this.now(), edges);
    this.queued.push(...edges);
    this.pumping = false;
  }

  private sampleGestures(now: number, edges: Intent[]): void {
    const capturing = this.capture !== null;
    const move = capturing ? { x: 0 as const, y: 0 as const } : this.resolveMove(now);
    const bladeDown = !capturing && this.actionDown("blade");
    const offhandDown = !capturing && this.actionDown("offhand");
    const interactDown = !capturing && this.actionDown("interact");
    const pauseDown = !capturing && this.actionDown("pause");
    const shrineDown = !capturing && this.actionDown("shrineRelease");
    this.view = { moveX: move.x, moveY: move.y, bladeDown, offhandDown, interactDown, pauseDown, shrineDown };

    if (pauseDown && !this.prev.pause) {
      this.menuOpen = !this.menuOpen;
      edges.push({ type: "pause" });
      this.pushBuffer("pause", now);
    }

    if (this.menuOpen || capturing) {
      if (this.blade?.spinning) edges.push({ type: "bladeSpin", phase: "end" });
      this.blade = this.blade?.spinning ? null : this.blade;
      if (this.blade && !this.blade.spinning) this.blade.cancelled = true;
      if (!bladeDown) this.blade = null;
      if (this.shrine && !this.shrine.completed) this.shrine.cancelled = true;
      if (!shrineDown) this.shrine = null;
      if (this.offhandMode === "hold" && this.prev.offhand && !this.offhandSuspended) {
        edges.push({ type: "offhand", phase: "end" });
        this.offhandSuspended = true;
      }
    } else {
      this.offhandSuspended = false;
      this.stepBlade(bladeDown, now, edges);
      this.stepOffhand(offhandDown, edges);
      if (interactDown && !this.prev.interact) {
        edges.push({ type: "interact" });
        this.pushBuffer("interact", now);
      }
      this.stepShrine(shrineDown, move.x !== 0 || move.y !== 0 || bladeDown, now, edges);
    }

    this.prev = { blade: bladeDown, offhand: offhandDown, interact: interactDown, pause: pauseDown, shrine: shrineDown };
  }

  private moveControl(control: TouchControlId, x: number, y: number): void {
    const positions = {
      ...(this.touch.positions ?? defaultPositions(this.touch.handedness)),
    };
    positions[control] = pointToNormal(this.viewport, x, y);
    this.touch = { ...this.touch, positions };
    const shrine = this.touchRects().find((rect) => rect.id === "shrine");
    if (shrine) {
      positions.shrine = normalizedCenter(shrine, this.viewport);
      this.touch = { ...this.touch, positions: { ...positions } };
    }
  }

  private shrinePhase(): ShrinePhase {
    if (!this.shrine) return "idle";
    if (this.shrine.cancelled) return "cancelled";
    if (this.shrine.completed) return "completed";
    return "charging";
  }

  private shrineProgress(now: number): number {
    if (!this.shrine || this.shrine.cancelled) return 0;
    if (this.shrine.completed) return 1;
    return Math.max(0, Math.min(1, (now - this.shrine.t0) / TIMING.shrineHoldMs));
  }

  private pushBuffer(type: DiscreteIntent, at: number): void {
    this.buffer.push({ type, at });
  }

  private noteDevice(device: PromptDevice): void {
    this.activeDevice = device;
  }

  private persist(): void {
    savePersisted(this.storage, {
      version: 1,
      bindings: this.bindings,
      offhandMode: this.offhandMode,
      movementPlane: this.movementPlane,
      deadzone: this.deadzone,
      touch: this.touch,
    });
  }

  private resolveCapture(binding: Binding): void {
    if (!this.capture) return;
    const outcome = commitRebind(
      this.bindings,
      this.capture.action,
      this.capture.slot,
      binding,
      "reject",
    );
    if (outcome.result.ok) {
      this.bindings = outcome.table;
      this.persist();
      this.cancelCapture();
      return;
    }
    if (outcome.result.reason === "conflict") {
      this.pendingBinding = binding;
      this.pendingConflict = outcome.result.conflictWith ?? null;
      return;
    }
    this.pendingBinding = binding;
    this.pendingConflict = null;
    if (outcome.result.reason === "reserved" || outcome.result.reason === "pause-required") {
      this.queued.push({ type: "openSettings" });
    }
  }

  private acceptPending(policy: ConflictPolicy): RebindResult {
    if (!this.capture || !this.pendingBinding) return { ok: false, reason: "invalid" };
    return this.rebind(this.capture.action, this.capture.slot, this.pendingBinding, policy);
  }

  /** Used by the settings UI after the player picks swap or reject. */
  resolvePending(policy: ConflictPolicy): RebindResult {
    return this.acceptPending(policy);
  }

  private buttonPhysicallyDown(
    button: { pressed: boolean; value: number } | undefined,
    index: number,
  ): boolean {
    if (!button) return false;
    if (index === 6 || index === 7) return button.value >= TIMING.triggerThreshold;
    return button.pressed || button.value >= 0.5;
  }

  private notePadEdges(pad: PadSnap): void {
    const previous = this.prevPadDown.get(pad.index) ?? new Set<number>();
    const down = new Set<number>();
    const latch = this.latchedButtons.get(pad.index);
    pad.buttons.forEach((button, index) => {
      const physical = this.buttonPhysicallyDown(button, index);
      if (latch?.has(index)) {
        if (!physical) latch.delete(index);
        return;
      }
      if (physical) down.add(index);
    });
    if (latch && latch.size === 0) this.latchedButtons.delete(pad.index);
    const rising = [...down].filter((index) => !previous.has(index));
    this.prevPadDown.set(pad.index, down);
    if (rising.length > 0) {
      const family = classifyPad(pad.id);
      this.noteDevice(pad.mapping === "standard" ? family : "genericPad");
    }
    if (this.capture && rising.length > 0) {
      const latch = this.latchedButtons.get(pad.index) ?? new Set<number>();
      const chordButtons = [...down].sort((a, b) => a - b);
      if (this.capture.chord && chordButtons.length >= 2) {
        for (const button of chordButtons.slice(0, 2)) latch.add(button);
        this.latchedButtons.set(pad.index, latch);
        this.resolveCapture({ kind: "padChord", buttons: chordButtons.slice(0, 2) });
      } else if (!this.capture.chord) {
        const button = rising[0];
        if (button !== undefined) {
          latch.add(button);
          this.latchedButtons.set(pad.index, latch);
          this.resolveCapture({ kind: "padButton", button });
        }
      }
    }
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    if (this.axisLatched.has(pad.index)) {
      if (Math.hypot(ax, ay) < this.deadzone) this.axisLatched.delete(pad.index);
    } else if (Math.hypot(ax, ay) >= this.deadzone) {
      this.noteDevice(pad.mapping === "standard" ? classifyPad(pad.id) : "genericPad");
    }
  }

  private padButtonDown(button: number): boolean {
    if (this.capture) return false;
    for (const [index, pad] of this.pads) {
      const latch = this.latchedButtons.get(index);
      if (latch?.has(button)) continue;
      if (this.buttonPhysicallyDown(pad.buttons[button], button)) return true;
    }
    return false;
  }

  private gatePads(): void {
    for (const [index, pad] of this.pads) {
      const held = new Set<number>();
      pad.buttons.forEach((button, buttonIndex) => {
        if (this.buttonPhysicallyDown(button, buttonIndex)) held.add(buttonIndex);
      });
      if (held.size > 0) this.latchedButtons.set(index, held);
      this.axisLatched.add(index);
    }
  }

  private releaseMomentary(): void {
    this.keys.clear();
    this.keyAt.clear();
    this.pointers.clear();
    this.drag = null;
    if (this.shrine && !this.shrine.completed) this.shrine.cancelled = true;
    if (this.blade && !this.blade.spinning) this.blade.cancelled = true;
    this.gatePads();
    this.interrupted = false;
  }

  private actionDown(action: ActionId): boolean {
    if (action === "shrineRelease" || action === "blade" || action === "offhand" || action === "interact" || action === "pause") {
      for (const binding of this.bindings[action]) {
        if (binding.kind === "key" && this.keys.has(binding.code)) return true;
        if (binding.kind === "padButton" && this.padButtonDown(binding.button)) return true;
        if (binding.kind === "padChord" && binding.buttons.every((button) => this.padButtonDown(button))) {
          return true;
        }
        if (binding.kind === "touch" && this.touchControlDown(binding.control)) return true;
      }
      return false;
    }
    return false;
  }

  private touchControlDown(control: TouchControlId): boolean {
    if (this.layoutEditing) return false;
    for (const pointer of this.pointers.values()) {
      if (pointer.cancelled || pointer.control !== control) continue;
      if (control === "stick") return true;
      const still = hitControl(this.touchRects(), pointer.x, pointer.y);
      if (still === control) return true;
    }
    return false;
  }

  private dirFromKeys(action: DirAction): DirVote {
    let at = 0;
    let down = false;
    for (const code of keyboardBindings(this.bindings, action)) {
      if (!this.keys.has(code)) continue;
      down = true;
      at = Math.max(at, this.keyAt.get(code) ?? 0);
    }
    const sign = action === "moveEast" || action === "moveNorth" ? 1 : -1;
    return down ? { v: sign, at } : { v: 0, at: 0 };
  }

  private stickVector(): { x: number; y: number } | null {
    if (this.layoutEditing) return null;
    const rect = this.touchRects().find((item) => item.id === "stick");
    if (!rect) return null;
    for (const pointer of this.pointers.values()) {
      if (pointer.cancelled || pointer.control !== "stick") continue;
      const radius = rect.w / 2;
      const nx = radius === 0 ? 0 : (pointer.x - (rect.x + radius)) / radius;
      const ny = radius === 0 ? 0 : (pointer.y - (rect.y + radius)) / radius;
      return { x: Math.max(-1, Math.min(1, nx)), y: Math.max(-1, Math.min(1, ny)) };
    }
    return null;
  }

  private digitalVotes(now: number): { x: DirVote; y: DirVote } {
    const east = this.dirFromKeys("moveEast");
    const west = this.dirFromKeys("moveWest");
    const north = this.dirFromKeys("moveNorth");
    const south = this.dirFromKeys("moveSouth");
    const keyX = mergeSigned([east, west]);
    const keyY = mergeSigned([north, south]);

    const stick = this.stickVector();
    let touchX: DirVote = { v: 0, at: 0 };
    let touchY: DirVote = { v: 0, at: 0 };
    if (stick) {
      const digital = digitalStick(stick.x, stick.y, this.deadzone, this.movementPlane);
      const northSign = (digital.y === 0 ? 0 : digital.y > 0 ? -1 : 1) as -1 | 0 | 1;
      touchX = this.latchDir("touch-x", digital.x, now);
      touchY = this.latchDir("touch-y", northSign, now);
    } else {
      touchX = this.latchDir("touch-x", 0, now);
      touchY = this.latchDir("touch-y", 0, now);
    }

    let padX: DirVote = { v: 0, at: 0 };
    let padY: DirVote = { v: 0, at: 0 };
    const padVotesX: DirVote[] = [];
    const padVotesY: DirVote[] = [];
    for (const [index, pad] of this.pads) {
      const dpad = (button: number, sign: -1 | 1): DirVote =>
        this.latchDir(`pad-${index}-b${button}`, this.padButtonDown(button) ? sign : 0, now);
      padVotesX.push(dpad(15, 1), dpad(14, -1));
      padVotesY.push(dpad(12, 1), dpad(13, -1));
      if (this.axisLatched.has(index)) {
        this.latchDir(`pad-${index}-ax`, 0, now);
        this.latchDir(`pad-${index}-ay`, 0, now);
      } else {
        const analog = digitalStick(
          pad.axes[0] ?? 0,
          pad.axes[1] ?? 0,
          this.deadzone,
          this.movementPlane,
        );
        const north = (analog.y === 0 ? 0 : analog.y > 0 ? -1 : 1) as -1 | 0 | 1;
        padVotesX.push(this.latchDir(`pad-${index}-ax`, analog.x, now));
        padVotesY.push(this.latchDir(`pad-${index}-ay`, north, now));
      }
    }
    padX = mergeSigned(padVotesX);
    padY = mergeSigned(padVotesY);

    return {
      x: mergeSigned([keyX, touchX, padX]),
      y: mergeSigned([keyY, touchY, padY]),
    };
  }

  private latchDir(id: string, sign: -1 | 0 | 1, now: number): DirVote {
    const map = id.startsWith("touch") ? this.touchDirAt : this.padDirAt;
    if (sign === 0) {
      map.delete(`${id}:1`);
      map.delete(`${id}:-1`);
      return { v: 0, at: 0 };
    }
    const key = `${id}:${sign}`;
    if (!map.has(key)) map.set(key, now);
    for (const other of [-1, 1] as const) {
      if (other !== sign) map.delete(`${id}:${other}`);
    }
    return { v: sign, at: map.get(key) ?? now };
  }

  private resolveMove(now: number): { x: -1 | 0 | 1; y: -1 | 0 | 1 } {
    const vote = this.digitalVotes(now);
    if (this.movementPlane === "eight" || vote.x.v === 0 || vote.y.v === 0) {
      return { x: vote.x.v, y: vote.y.v };
    }
    if (vote.y.at > vote.x.at) return { x: 0, y: vote.y.v };
    return { x: vote.x.v, y: 0 };
  }

  private stepBlade(down: boolean, now: number, edges: Intent[]): void {
    if (down && !this.blade && !this.prev.blade) {
      this.blade = { t0: now, spinning: false, cancelled: false };
    }
    if (!this.blade) return;
    if (this.blade.cancelled) {
      if (!down) this.blade = null;
      return;
    }
    if (down && !this.blade.spinning && now - this.blade.t0 >= TIMING.bladeSpinMs) {
      this.blade.spinning = true;
      edges.push({ type: "bladeSpin", phase: "start" });
    }
    if (!down) {
      if (this.blade.spinning) edges.push({ type: "bladeSpin", phase: "end" });
      else if (now - this.blade.t0 >= TIMING.bladeSpinMs) {
        edges.push({ type: "bladeSpin", phase: "start" });
        edges.push({ type: "bladeSpin", phase: "end" });
      } else {
        edges.push({ type: "bladeTap" });
        this.pushBuffer("bladeTap", now);
      }
      this.blade = null;
    }
  }

  private stepOffhand(down: boolean, edges: Intent[]): void {
    if (this.offhandMode === "toggle") {
      if (down && !this.prev.offhand) {
        this.offhandLatched = !this.offhandLatched;
        edges.push({
          type: "offhand",
          phase: this.offhandLatched ? "toggleOn" : "toggleOff",
        });
      }
      return;
    }
    if (down && !this.prev.offhand) edges.push({ type: "offhand", phase: "start" });
    if (!down && this.prev.offhand) edges.push({ type: "offhand", phase: "end" });
  }

  private stepShrine(
    down: boolean,
    blocked: boolean,
    now: number,
    edges: Intent[],
  ): void {
    if (down && !this.shrine && !this.prev.shrine) {
      this.shrine = { t0: now, completed: false, cancelled: false };
    }
    if (!this.shrine) return;
    if (this.shrine.cancelled) {
      if (!down) this.shrine = null;
      return;
    }
    if (blocked && !this.shrine.completed) {
      this.shrine.cancelled = true;
      return;
    }
    if (down && !this.shrine.completed && now - this.shrine.t0 >= TIMING.shrineHoldMs) {
      this.shrine.completed = true;
      edges.push({ type: "shrineRelease" });
      this.pushBuffer("shrineRelease", now);
    }
    if (!down) this.shrine = null;
  }

  ownsCode(code: string): boolean {
    if (code === RECOVERY_CODE) return true;
    return ACTIONS.some((action) => keyboardBindings(this.bindings, action).includes(code));
  }
}

function mergeSigned(votes: DirVote[]): DirVote {
  let posAt = 0;
  let negAt = 0;
  let pos = false;
  let neg = false;
  for (const vote of votes) {
    if (vote.v > 0) {
      pos = true;
      posAt = Math.max(posAt, vote.at);
    } else if (vote.v < 0) {
      neg = true;
      negAt = Math.max(negAt, vote.at);
    }
  }
  const axis = mergeAxis([pos ? 1 : 0, neg ? -1 : 0]);
  if (axis > 0) return { v: 1, at: posAt };
  if (axis < 0) return { v: -1, at: negAt };
  return { v: 0, at: 0 };
}
