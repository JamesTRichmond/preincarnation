import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ARENA_SPEED, initialArena, stepArena } from "../src/arena.ts";
import { InputEngine } from "../src/engine.ts";
import { readSimulationCommands } from "../integration/consume-intents.ts";
import { defaultBindings } from "../src/defaults.ts";
import { parsePersisted } from "../src/persistence.ts";
import { classifyPad } from "../src/prompts.ts";
import { STORAGE_KEY, TIMING } from "../src/timing.ts";
import { defaultPositions, layoutTouch, rectGap } from "../src/touch-layout.ts";
import type { Binding, FrameInput, Intent, PadSnap, StorageLike } from "../src/types.ts";

function memory(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

function harness(storage = memory()) {
  let now = 0;
  const engine = new InputEngine({ now: () => now, storage, gamepadApi: true });
  return {
    engine,
    storage,
    at: (ms: number) => {
      now = ms;
    },
    advance: (ms: number) => {
      now += ms;
    },
  };
}

function types(frame: FrameInput, type: Intent["type"]): Intent[] {
  return frame.edges.filter((edge) => edge.type === type);
}

function pad(id = "Xbox 360 Controller (XInput)", mapping = "standard"): PadSnap {
  return {
    index: 0,
    id,
    mapping,
    connected: true,
    buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
    axes: [0, 0, 0, 0],
  };
}

function withButton(base: PadSnap, index: number, value = 1): PadSnap {
  return {
    ...base,
    buttons: base.buttons.map((button, buttonIndex) =>
      buttonIndex === index ? { pressed: value >= 0.5, value } : button,
    ),
  };
}

function wake(engine: InputEngine, base: PadSnap): void {
  engine.pollGamepads([
    { ...base, buttons: base.buttons.map(() => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] },
  ]);
  engine.tick();
}

describe("keyboard movement", () => {
  it("maps WASD to screen signs: A left, D right, W up, S down", () => {
    const { engine } = harness();
    engine.keyDown("KeyD");
    assert.equal(engine.tick().moveX, 1);
    engine.keyUp("KeyD");
    engine.keyDown("KeyA");
    assert.equal(engine.tick().moveX, -1);
    engine.keyUp("KeyA");
    engine.keyDown("KeyW");
    const north = engine.tick();
    assert.equal(north.moveY, 1);
    engine.keyUp("KeyW");
    engine.keyDown("KeyS");
    assert.equal(engine.tick().moveY, -1);
  });

  it("maps arrow keys the same way as WASD", () => {
    const { engine } = harness();
    engine.keyDown("ArrowLeft");
    assert.equal(engine.tick().moveX, -1);
    engine.keyUp("ArrowLeft");
    engine.keyDown("ArrowRight");
    assert.equal(engine.tick().moveX, 1);
    engine.keyUp("ArrowRight");
    engine.keyDown("ArrowUp");
    assert.equal(engine.tick().moveY, 1);
    engine.keyUp("ArrowUp");
    engine.keyDown("ArrowDown");
    assert.equal(engine.tick().moveY, -1);
  });

  it("cancels opposite east and west", () => {
    const { engine } = harness();
    engine.keyDown("KeyA");
    engine.keyDown("KeyD");
    const frame = engine.tick();
    assert.equal(frame.moveX, 0);
    assert.equal(frame.held.moveEast, false);
    assert.equal(frame.held.moveWest, false);
  });

  it("cancels opposite north and south", () => {
    const { engine } = harness();
    engine.keyDown("KeyW");
    engine.keyDown("KeyS");
    assert.equal(engine.tick().moveY, 0);
  });

  it("keeps four-direction movement on the newest axis", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyW");
    at(40);
    engine.keyDown("KeyD");
    const frame = engine.tick();
    assert.equal(frame.moveX, 1);
    assert.equal(frame.moveY, 0);
    engine.keyUp("KeyD");
    assert.equal(engine.tick().moveY, 1);
  });

  it("allows diagonals only when the plane is eight-way", () => {
    const { engine, at } = harness();
    engine.setMovementPlane("eight");
    at(0);
    engine.keyDown("KeyW");
    at(10);
    engine.keyDown("KeyD");
    const frame = engine.tick();
    assert.equal(frame.moveX, 1);
    assert.equal(frame.moveY, 1);
  });

  it("reads movement and a blade tap in the same gesture", () => {
    const { engine, at } = harness();
    engine.keyDown("KeyD");
    at(0);
    engine.keyDown("KeyJ");
    at(40);
    engine.keyUp("KeyJ");
    const frame = engine.tick();
    assert.equal(frame.moveX, 1);
    assert.equal(types(frame, "bladeTap").length, 1);
    assert.equal(types(frame, "bladeSpin").length, 0);
  });
});

describe("blade tap versus spin", () => {
  it("emits a tap and not a spin when released before the threshold", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyJ");
    at(TIMING.bladeSpinMs - 1);
    engine.keyUp("KeyJ");
    const frame = engine.tick();
    assert.equal(types(frame, "bladeTap").length, 1);
    assert.equal(types(frame, "bladeSpin").length, 0);
  });

  it("emits a spin and not a tap once the hold crosses the threshold", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyJ");
    at(TIMING.bladeSpinMs);
    const frame = engine.tick();
    assert.deepEqual(types(frame, "bladeSpin"), [{ type: "bladeSpin", phase: "start" }]);
    assert.equal(frame.bladePhase, "spinning");
    assert.equal(types(frame, "bladeTap").length, 0);
  });

  it("ends a spin on release without adding a tap", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyJ");
    at(TIMING.bladeSpinMs);
    engine.tick();
    at(TIMING.bladeSpinMs + 30);
    engine.keyUp("KeyJ");
    const frame = engine.tick();
    assert.deepEqual(types(frame, "bladeSpin"), [{ type: "bladeSpin", phase: "end" }]);
    assert.equal(types(frame, "bladeTap").length, 0);
    assert.equal(frame.bladePhase, "idle");
  });

  it("treats a release exactly at the threshold as a spin, not a tap", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyJ");
    at(TIMING.bladeSpinMs);
    engine.keyUp("KeyJ");
    const frame = engine.tick();
    assert.equal(types(frame, "bladeTap").length, 0);
    assert.equal(types(frame, "bladeSpin").length, 2);
  });

  it("ignores key repeat so one press is one tap", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyJ", false);
    engine.keyDown("KeyJ", true);
    engine.keyDown("KeyJ", true);
    at(30);
    engine.keyUp("KeyJ");
    assert.equal(types(engine.tick(), "bladeTap").length, 1);
  });

  it("counts repeated taps separately", () => {
    const { engine, at } = harness();
    let taps = 0;
    for (let index = 0; index < 5; index += 1) {
      at(index * 80);
      engine.keyDown("KeyJ");
      at(index * 80 + 30);
      engine.keyUp("KeyJ");
      taps += types(engine.tick(), "bladeTap").length;
    }
    assert.equal(taps, 5);
  });

  it("holds a spin across a long press and does not complete a shrine rite", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyJ");
    at(TIMING.bladeSpinMs);
    assert.equal(engine.tick().bladePhase, "spinning");
    at(2000);
    const held = engine.tick();
    assert.equal(held.bladePhase, "spinning");
    assert.equal(types(held, "bladeSpin").length, 0);
    assert.equal(types(held, "shrineRelease").length, 0);
    engine.keyUp("KeyJ");
    assert.equal(engine.tick().bladePhase, "idle");
  });
});

describe("shrine release protection", () => {
  it("does not release on a tap", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyR");
    at(120);
    engine.keyUp("KeyR");
    const frame = engine.tick();
    assert.equal(types(frame, "shrineRelease").length, 0);
    assert.equal(frame.shrine.phase, "idle");
  });

  it("releases once, only after the full hold, and not again while still held", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyR");
    at(TIMING.shrineHoldMs - 1);
    const early = engine.tick();
    assert.equal(types(early, "shrineRelease").length, 0);
    assert.equal(early.shrine.phase, "charging");
    assert.ok(early.shrine.progress < 1);
    at(TIMING.shrineHoldMs);
    const done = engine.tick();
    assert.equal(types(done, "shrineRelease").length, 1);
    at(TIMING.shrineHoldMs + 400);
    assert.equal(types(engine.tick(), "shrineRelease").length, 0);
  });

  it("cancels the rite when the player moves, with no release", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyR");
    at(400);
    assert.equal(engine.tick().shrine.phase, "charging");
    engine.keyDown("KeyD");
    at(TIMING.shrineHoldMs + 500);
    const frame = engine.tick();
    assert.equal(types(frame, "shrineRelease").length, 0);
    assert.notEqual(frame.shrine.phase, "completed");
  });

  it("cancels the rite when the blade is pressed", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyR");
    at(400);
    engine.tick();
    engine.keyDown("KeyJ");
    at(TIMING.shrineHoldMs + 200);
    const frame = engine.tick();
    assert.equal(types(frame, "shrineRelease").length, 0);
    assert.equal(frame.shrine.phase === "completed", false);
  });

  it("cancels a charging rite on blur and does not release", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyR");
    at(500);
    engine.tick();
    engine.blur();
    const frame = engine.tick();
    assert.equal(types(frame, "shrineRelease").length, 0);
    assert.equal(frame.moveX, 0);
    assert.equal(frame.shrine.phase === "completed", false);
  });
});

describe("focus, cancel, and off-hand", () => {
  it("ends a spin on blur and does not keep movement held", () => {
    const { engine, at } = harness();
    engine.keyDown("KeyD");
    at(0);
    engine.keyDown("KeyJ");
    at(TIMING.bladeSpinMs);
    assert.equal(engine.tick().bladePhase, "spinning");
    engine.blur();
    const frame = engine.tick();
    assert.deepEqual(types(frame, "bladeSpin"), [{ type: "bladeSpin", phase: "end" }]);
    assert.equal(frame.moveX, 0);
    assert.equal(frame.bladePhase, "idle");
  });

  it("does not synthesize held movement when focus returns", () => {
    const { engine } = harness();
    engine.keyDown("KeyA");
    assert.equal(engine.tick().moveX, -1);
    engine.blur();
    engine.focus();
    assert.equal(engine.tick().moveX, 0);
  });

  it("cancels a touch shrine when the page hides", () => {
    const { engine, at } = harness();
    const shrine = engine.touchRects().find((rect) => rect.id === "shrine");
    assert.ok(shrine);
    engine.pointerDown({
      id: 1,
      x: shrine.x + shrine.w / 2,
      y: shrine.y + shrine.h / 2,
      type: "touch",
    });
    at(300);
    assert.equal(engine.tick().shrine.phase, "charging");
    engine.visibility(true);
    const frame = engine.tick();
    assert.equal(types(frame, "shrineRelease").length, 0);
    assert.notEqual(frame.shrine.phase, "completed");
  });

  it("drops a blade when the touch is cancelled before the spin", () => {
    const { engine, at } = harness();
    const blade = engine.touchRects().find((rect) => rect.id === "blade");
    assert.ok(blade);
    const point = { id: 4, x: blade.x + 8, y: blade.y + 8, type: "touch" };
    at(0);
    engine.pointerDown(point);
    at(40);
    engine.pointerCancel({ id: 4 });
    const frame = engine.tick();
    assert.equal(types(frame, "bladeTap").length, 0);
    assert.equal(types(frame, "bladeSpin").length, 0);
  });

  it("emits a tap when the touch ends inside the blade", () => {
    const { engine, at } = harness();
    const blade = engine.touchRects().find((rect) => rect.id === "blade");
    assert.ok(blade);
    at(0);
    engine.pointerDown({ id: 3, x: blade.x + 10, y: blade.y + 10, type: "touch" });
    at(50);
    engine.pointerUp({ id: 3 });
    assert.equal(types(engine.tick(), "bladeTap").length, 1);
  });

  it("slides off the blade without producing a tap", () => {
    const { engine, at } = harness();
    const blade = engine.touchRects().find((rect) => rect.id === "blade");
    assert.ok(blade);
    at(0);
    engine.pointerDown({ id: 8, x: blade.x + 4, y: blade.y + 4, type: "touch" });
    at(40);
    engine.pointerMove({ id: 8, x: blade.x - 30, y: blade.y - 30 });
    engine.pointerUp({ id: 8 });
    const frame = engine.tick();
    assert.equal(types(frame, "bladeTap").length, 0);
    assert.equal(types(frame, "bladeSpin").length, 0);
  });

  it("uses hold or toggle for the off-hand and refuses to toggle the shrine", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyK");
    assert.equal(engine.tick().edges.some((edge) => edge.type === "offhand" && edge.phase === "start"), true);
    at(20);
    engine.keyUp("KeyK");
    assert.equal(engine.tick().edges.some((edge) => edge.type === "offhand" && edge.phase === "end"), true);
    engine.setOffhandMode("toggle");
    at(40);
    engine.keyDown("KeyK");
    assert.equal(engine.tick().offhandLatched, true);
    at(80);
    engine.keyUp("KeyK");
    engine.tick();
    at(100);
    engine.keyDown("KeyK");
    const off = engine.tick();
    assert.equal(off.offhandLatched, false);
    assert.equal(off.edges.some((edge) => edge.type === "offhand" && edge.phase === "toggleOff"), true);
  });
});

describe("touch and gamepad", () => {
  it("moves and attacks with two pointers at once", () => {
    const { engine, at } = harness();
    const stick = engine.touchRects().find((rect) => rect.id === "stick");
    const blade = engine.touchRects().find((rect) => rect.id === "blade");
    assert.ok(stick && blade);
    engine.pointerDown({
      id: 1,
      x: stick.x + stick.w / 2,
      y: stick.y + stick.h / 2,
      type: "touch",
    });
    engine.pointerMove({ id: 1, x: stick.x + stick.w / 2 + stick.w * 0.46, y: stick.y + stick.h / 2 });
    at(0);
    engine.pointerDown({ id: 2, x: blade.x + 12, y: blade.y + 12, type: "touch" });
    const frame = engine.tick();
    assert.equal(frame.moveX, 1);
    assert.equal(frame.bladePhase, "pending");
  });

  it("releases a cancelled stick so movement does not stick", () => {
    const { engine } = harness();
    const stick = engine.touchRects().find((rect) => rect.id === "stick");
    assert.ok(stick);
    engine.pointerDown({ id: 9, x: stick.x + stick.w / 2, y: stick.y + stick.h / 2, type: "touch" });
    engine.pointerMove({ id: 9, x: stick.x + stick.w * 0.95, y: stick.y + stick.h / 2 });
    assert.equal(engine.tick().moveX, 1);
    engine.pointerCancel({ id: 9 });
    assert.equal(engine.tick().moveX, 0);
  });

  it("ignores stick drift inside the radial deadzone and reads a real tilt", () => {
    const { engine } = harness();
    const base = pad();
    wake(engine, base);
    engine.pollGamepads([{ ...base, axes: [0.1, 0.05, 0, 0] }]);
    assert.equal(engine.tick().moveX, 0);
    engine.pollGamepads([{ ...base, axes: [0.95, 0.05, 0, 0] }]);
    assert.equal(engine.tick().moveX, 1);
    assert.equal(engine.tick().moveY, 0);
  });

  it("cancels opposite d-pad directions", () => {
    const { engine } = harness();
    const base = pad();
    wake(engine, base);
    const both = withButton(withButton(base, 14), 15);
    engine.pollGamepads([both]);
    assert.equal(engine.tick().moveX, 0);
  });

  it("points north when the left stick is pushed up", () => {
    const { engine } = harness();
    const base = pad();
    wake(engine, base);
    engine.pollGamepads([{ ...base, axes: [0, -0.9, 0, 0] }]);
    const frame = engine.tick();
    assert.equal(frame.moveY, 1);
    assert.equal(frame.moveX, 0);
  });

  it("ends a spin and does not release the shrine when the pad drops mid-combat", () => {
    const { engine, at } = harness();
    const base = pad();
    wake(engine, base);
    at(0);
    engine.pollGamepads([withButton(base, 2)]);
    at(TIMING.bladeSpinMs);
    assert.equal(engine.tick().bladePhase, "spinning");
    engine.pollGamepads([]);
    const frame = engine.tick();
    assert.equal(frame.edges.some((edge) => edge.type === "deviceLost"), true);
    assert.equal(frame.edges.some((edge) => edge.type === "bladeSpin" && edge.phase === "end"), true);
    assert.equal(frame.edges.some((edge) => edge.type === "shrineRelease"), false);
    assert.equal(frame.bladePhase, "idle");
  });

  it("does not fire shrine release if the pad drops during the hold", () => {
    const { engine, at } = harness();
    const base = pad();
    wake(engine, base);
    at(0);
    const charging = withButton(withButton(base, 6, 1), 7, 1);
    engine.pollGamepads([charging]);
    at(400);
    assert.equal(engine.tick().shrine.phase, "charging");
    engine.pollGamepads([]);
    at(TIMING.shrineHoldMs + 100);
    const frame = engine.tick();
    assert.equal(frame.edges.some((edge) => edge.type === "shrineRelease"), false);
  });

  it("requires both triggers for the gamepad shrine chord", () => {
    const { engine, at } = harness();
    const base = pad();
    wake(engine, base);
    at(0);
    engine.pollGamepads([withButton(base, 6, 1)]);
    at(TIMING.shrineHoldMs + 50);
    assert.equal(types(engine.tick(), "shrineRelease").length, 0);
    engine.pollGamepads([withButton(withButton(base, 6, 1), 7, 1)]);
    at(TIMING.shrineHoldMs + 60);
    engine.tick();
    at(TIMING.shrineHoldMs * 2 + 80);
    assert.equal(types(engine.tick(), "shrineRelease").length, 1);
  });

  it("does not restart a spin if the pad reconnects while the button is still down", () => {
    const { engine, at } = harness();
    const base = pad();
    wake(engine, base);
    at(0);
    engine.pollGamepads([withButton(base, 2)]);
    at(TIMING.bladeSpinMs);
    engine.tick();
    engine.pollGamepads([]);
    engine.tick();
    at(TIMING.bladeSpinMs + 50);
    engine.pollGamepads([withButton(base, 2)]);
    const frame = engine.tick();
    assert.notEqual(frame.bladePhase, "spinning");
    assert.equal(types(frame, "bladeSpin").some((edge) => edge.type === "bladeSpin" && edge.phase === "start"), false);
  });

  it("ignores injected pads when the Gamepad API is missing", () => {
    let now = 0;
    const engine = new InputEngine({ now: () => now, storage: memory(), gamepadApi: false });
    const base = pad();
    engine.pollGamepads([{ ...base, axes: [1, 0, 0, 0] }]);
    now = 10;
    const frame = engine.tick();
    assert.equal(frame.gamepad.support, "api-missing");
    assert.equal(frame.moveX, 0);
  });
});

describe("prompts, menu, and device changes", () => {
  it("follows the device that was used most recently", () => {
    const { engine } = harness();
    assert.equal(engine.tick().prompts.blade, "J tap/hold");
    assert.equal(engine.tick().prompts.shrineRelease, "R hold");
    const xbox = pad("Xbox One Controller (XInput)");
    wake(engine, xbox);
    engine.pollGamepads([withButton(xbox, 0)]);
    const padFrame = engine.tick();
    assert.equal(padFrame.activeDevice, "xbox");
    assert.equal(padFrame.prompts.interact, "A");
    assert.equal(padFrame.prompts.shrineRelease, "LT+RT hold");
    const dual = pad("DualSense Wireless Controller", "standard");
    wake(engine, dual);
    engine.pollGamepads([withButton(dual, 2)]);
    const ps = engine.tick();
    assert.equal(ps.activeDevice, "playstation");
    assert.equal(ps.prompts.blade, "Square tap/hold");
    engine.keyDown("KeyE");
    assert.equal(engine.tick().prompts.interact, "E");
    const offer = engine.touchRects().find((rect) => rect.id === "interact");
    assert.ok(offer);
    engine.pointerDown({ id: 2, x: offer.x + 8, y: offer.y + 8, type: "touch" });
    assert.equal(engine.tick().prompts.interact, "Offer");
  });

  it("labels a non-standard pad with generic faces, not Xbox print", () => {
    const { engine } = harness();
    const odd = pad("Weird Fightpad", "");
    wake(engine, odd);
    engine.pollGamepads([withButton(odd, 2)]);
    const frame = engine.tick();
    assert.equal(frame.activeDevice, "genericPad");
    assert.equal(frame.prompts.blade, "West tap/hold");
    assert.equal(frame.warnings.includes("gamepad-nonstandard"), true);
    assert.equal(classifyPad("054c DualShock"), "playstation");
  });

  it("keeps a menu open when the device changes and swallows combat edges", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyJ");
    at(TIMING.bladeSpinMs);
    engine.tick();
    engine.keyDown("Escape");
    const paused = engine.tick();
    assert.equal(paused.menuOpen, true);
    assert.equal(paused.edges.some((edge) => edge.type === "pause"), true);
    assert.equal(paused.edges.some((edge) => edge.type === "bladeSpin" && edge.phase === "end"), true);
    engine.keyUp("Escape");
    engine.tick();
    const base = pad();
    wake(engine, base);
    engine.pollGamepads([withButton(base, 0)]);
    const switched = engine.tick();
    assert.equal(switched.menuOpen, true);
    assert.equal(switched.activeDevice, "xbox");
    assert.equal(switched.edges.some((edge) => edge.type === "interact"), false);
    assert.equal(switched.edges.some((edge) => edge.type === "bladeTap"), false);
    engine.keyDown("KeyJ");
    at(TIMING.bladeSpinMs + 400);
    engine.keyUp("KeyJ");
    assert.equal(types(engine.tick(), "bladeTap").length, 0);
  });

  it("buffers an interact press briefly, then drops it", () => {
    const { engine, at } = harness();
    at(0);
    engine.keyDown("KeyE");
    at(20);
    engine.keyUp("KeyE");
    engine.tick();
    assert.equal(engine.consumeBuffered("interact"), true);
    at(40);
    engine.keyDown("KeyE");
    at(60);
    engine.keyUp("KeyE");
    engine.tick();
    at(60 + TIMING.bufferMs + 1);
    assert.equal(engine.consumeBuffered("interact"), false);
  });
});

describe("rebinding, recovery, and persistence", () => {
  it("swaps a conflicting key so both actions keep a binding", () => {
    const { engine } = harness();
    const result = engine.rebind("interact", 0, { kind: "key", code: "KeyJ" }, "swap");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.swappedWith, "blade");
    const table = engine.getBindings();
    assert.equal(table.interact.some((binding) => binding.kind === "key" && binding.code === "KeyJ"), true);
    assert.equal(table.blade.some((binding) => binding.kind === "key" && binding.code === "KeyE"), true);
    engine.keyDown("KeyJ");
    const frame = engine.tick();
    assert.equal(types(frame, "interact").length, 1);
    assert.equal(types(frame, "bladeTap").length, 0);
  });

  it("rejects a conflict without changing the table", () => {
    const { engine } = harness();
    const before = JSON.stringify(engine.getBindings());
    const result = engine.rebind("interact", 0, { kind: "key", code: "KeyJ" }, "reject");
    assert.deepEqual(result, { ok: false, reason: "conflict", conflictWith: "blade" });
    assert.equal(JSON.stringify(engine.getBindings()), before);
  });

  it("refuses to remove the last pause key", () => {
    const { engine } = harness();
    assert.equal(engine.clearBinding("pause", 0).ok, true);
    const stripped = engine.clearBinding("pause", 0);
    assert.equal(stripped.ok, false);
    if (!stripped.ok) assert.equal(stripped.reason, "pause-required");
    const padOnly = engine.rebind("pause", 0, { kind: "padButton", button: 1 }, "reject");
    assert.equal(padOnly.ok, false);
    if (!padOnly.ok) assert.equal(padOnly.reason, "pause-required");
    assert.equal(engine.getBindings().pause.some((binding) => binding.kind === "key"), true);
  });

  it("refuses the reserved recovery key", () => {
    const { engine } = harness();
    const result = engine.rebind("blade", 0, { kind: "key", code: "F8" }, "reject");
    assert.deepEqual(result, { ok: false, reason: "reserved" });
  });

  it("restores defaults from the recovery hold even after a rebind", () => {
    const { engine, at } = harness();
    assert.equal(engine.rebind("blade", 0, { kind: "key", code: "KeyU" }, "reject").ok, true);
    at(0);
    engine.keyDown("F8");
    at(TIMING.recoveryHoldMs);
    const frame = engine.tick();
    assert.equal(frame.edges.some((edge) => edge.type === "bindingsReset"), true);
    assert.equal(
      engine.getBindings().blade.some((binding) => binding.kind === "key" && binding.code === "KeyJ"),
      true,
    );
    engine.keyDown("Escape");
    assert.equal(engine.tick().menuOpen, true);
  });

  it("opens settings on a short recovery press without resetting", () => {
    const { engine, at } = harness();
    engine.rebind("interact", 0, { kind: "key", code: "KeyG" }, "reject");
    at(0);
    engine.keyDown("F8");
    at(80);
    engine.keyUp("F8");
    const frame = engine.tick();
    assert.equal(frame.edges.some((edge) => edge.type === "openSettings"), true);
    assert.equal(frame.edges.some((edge) => edge.type === "bindingsReset"), false);
    assert.equal(
      engine.getBindings().interact.some((binding) => binding.kind === "key" && binding.code === "KeyG"),
      true,
    );
  });

  it("round-trips bindings through storage", () => {
    const storage = memory();
    const first = harness(storage);
    assert.equal(first.engine.rebind("interact", 0, { kind: "key", code: "KeyG" }, "reject").ok, true);
    const second = new InputEngine({ now: () => 0, storage, gamepadApi: true });
    const binding = second.getBindings().interact[0] as Binding;
    assert.deepEqual(binding, { kind: "key", code: "KeyG" });
  });

  it("falls back when saved bindings are corrupt and still has pause", () => {
    const storage = memory();
    storage.setItem(STORAGE_KEY, "{");
    const engine = new InputEngine({ now: () => 0, storage, gamepadApi: true });
    const raw = storage.getItem(STORAGE_KEY);
    assert.ok(raw);
    assert.equal(parsePersisted(raw)?.version, 1);
    assert.equal(engine.getBindings().pause.some((binding) => binding.kind === "key" && binding.code === "Escape"), true);
    engine.keyDown("Escape");
    assert.equal(engine.tick().menuOpen, true);
    assert.deepEqual(engine.getBindings().blade[0], defaultBindings().blade[0]);
  });
});

describe("touch layout", () => {
  it("keeps controls inside the safe area at a 44px minimum", () => {
    const rects = layoutTouch(
      { width: 390, height: 844, safe: { top: 47, right: 0, bottom: 34, left: 0 } },
      { handedness: "right", scale: 1, opacity: 1, positions: null },
    );
    assert.equal(rects.length, 6);
    for (const rect of rects) {
      assert.ok(rect.w >= 44 && rect.h >= 44);
      assert.ok(rect.y >= 47);
      assert.ok(rect.y + rect.h <= 844 - 34);
      assert.ok(rect.x >= 0);
      assert.ok(rect.x + rect.w <= 390);
    }
  });

  it("mirrors the stick when handedness changes", () => {
    const viewport = { width: 800, height: 600, safe: { top: 0, right: 0, bottom: 0, left: 0 } };
    const right = layoutTouch(viewport, { handedness: "right", scale: 1, opacity: 1, positions: null });
    const left = layoutTouch(viewport, { handedness: "left", scale: 1, opacity: 1, positions: null });
    const rightStick = right.find((rect) => rect.id === "stick");
    const leftStick = left.find((rect) => rect.id === "stick");
    assert.ok(rightStick && leftStick);
    assert.ok(leftStick.x > rightStick.x);
  });

  it("pushes the shrine off the blade when a layout would overlap them", () => {
    const positions = defaultPositions("right");
    positions.shrine = { ...positions.blade };
    const rects = layoutTouch(
      { width: 900, height: 700, safe: { top: 0, right: 0, bottom: 0, left: 0 } },
      { handedness: "right", scale: 1, opacity: 1, positions },
    );
    const shrine = rects.find((rect) => rect.id === "shrine");
    const blade = rects.find((rect) => rect.id === "blade");
    assert.ok(shrine && blade);
    assert.ok(rectGap(shrine, blade) >= 28);
  });

  it("keeps phone-width controls from sitting on each other", () => {
    const rects = layoutTouch(
      { width: 390, height: 700, safe: { top: 0, right: 0, bottom: 0, left: 0 } },
      { handedness: "right", scale: 1, opacity: 1, positions: null },
    );
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i];
        const b = rects[j];
        if (!a || !b) continue;
        const gap = rectGap(a, b);
        const shrinePair = a.id === "shrine" || b.id === "shrine";
        assert.ok(gap >= (shrinePair ? 28 : 8), `${a.id} vs ${b.id} gap ${gap}`);
      }
    }
  });
});

describe("arena signs and the simulation bridge", () => {
  it("moves the marker right on D, left on A, and up on W", () => {
    let arena = initialArena();
    const base = {
      edges: [],
      shrine: { phase: "idle" as const, progress: 0 },
    };
    arena = stepArena(arena, { ...base, moveX: 1, moveY: 0 }, 500);
    assert.ok(arena.x > 50);
    arena = initialArena();
    arena = stepArena(arena, { ...base, moveX: -1, moveY: 0 }, 500);
    assert.ok(arena.x < 50);
    arena = initialArena();
    const y0 = arena.y;
    arena = stepArena(arena, { ...base, moveX: 0, moveY: 1 }, 500);
    assert.ok(arena.y < y0);
    assert.equal(ARENA_SPEED, 40);
  });

  it("hands the simulation move and intents without device or combat fields", () => {
    const { engine, at } = harness();
    engine.keyDown("KeyD");
    at(0);
    engine.keyDown("KeyJ");
    at(40);
    engine.keyUp("KeyJ");
    const commands = readSimulationCommands(engine.tick());
    assert.equal(commands.move.east, 1);
    assert.equal(commands.intents.some((intent) => intent.type === "bladeTap"), true);
    assert.equal(commands.intents.some((intent) => intent.type === "deviceLost"), false);
    assert.equal("damage" in commands, false);
  });
});
