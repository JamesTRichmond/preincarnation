import type { BindingTable } from "./types.ts";

function key(code: string) {
  return { kind: "key" as const, code };
}
function pad(button: number) {
  return { kind: "padButton" as const, button };
}
function axis(axisIndex: number, sign: -1 | 1) {
  return { kind: "padAxis" as const, axis: axisIndex, sign };
}
function touch(control: "stick" | "blade" | "offhand" | "interact" | "pause" | "shrine") {
  return { kind: "touch" as const, control };
}

/** Keyboard, standard-gamepad, and touch all cover the full action set. */
export function defaultBindings(): BindingTable {
  return {
    moveNorth: [key("KeyW"), key("ArrowUp"), pad(12), axis(1, -1), touch("stick")],
    moveSouth: [key("KeyS"), key("ArrowDown"), pad(13), axis(1, 1), touch("stick")],
    moveEast: [key("KeyD"), key("ArrowRight"), pad(15), axis(0, 1), touch("stick")],
    moveWest: [key("KeyA"), key("ArrowLeft"), pad(14), axis(0, -1), touch("stick")],
    blade: [key("KeyJ"), key("KeyZ"), pad(2), touch("blade")],
    offhand: [key("KeyK"), pad(5), touch("offhand")],
    interact: [key("KeyE"), pad(0), touch("interact")],
    pause: [key("Escape"), key("KeyP"), pad(9), touch("pause")],
    shrineRelease: [key("KeyR"), { kind: "padChord", buttons: [6, 7] }, touch("shrine")],
  };
}
