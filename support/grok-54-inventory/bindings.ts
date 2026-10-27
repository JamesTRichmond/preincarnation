import { VIEWS, type ViewId } from "./types.ts";

export type Binding = { keys: string; label: string; detail: string };

export const KEY_BINDINGS: Binding[] = [
  { keys: "/", label: "Search", detail: "Focus the search field" },
  { keys: "Arrows", label: "Move", detail: "Move through the visible list" },
  { keys: "Enter", label: "Inspect", detail: "Read the focused item" },
  { keys: "E", label: "Wear", detail: "Wear gear, or put it back" },
  { keys: "U", label: "Use", detail: "Eat, drink, plant, or light" },
  { keys: "I", label: "Inspect", detail: "Confirm a practical use" },
  { keys: "M", label: "Modify", detail: "Hone with the whetstone" },
  { keys: "S", label: "Shelf", detail: "Put on the display shelf" },
  { keys: "H", label: "Hearth", detail: "File at the hearth, or take it back" },
  { keys: "F", label: "Favorite", detail: "Mark or clear a favorite" },
  { keys: "B", label: "Batch", detail: "Select several, then act" },
  { keys: "G", label: "Pick up", detail: "Take the nearest thing on the ground" },
  { keys: "Esc", label: "Cancel", detail: "Drop a pending action without changing items" },
  { keys: "[ ]", label: "Place", detail: "Switch pack, hearth, shelf, and the other views" },
];

export const PAD_BINDINGS: Binding[] = [
  { keys: "D-pad / stick", label: "Move", detail: "Move through the list" },
  { keys: "A", label: "Inspect", detail: "Read the focused item" },
  { keys: "B", label: "Cancel", detail: "Close a pending action" },
  { keys: "X", label: "Use", detail: "Eat, drink, plant, or light" },
  { keys: "Y", label: "Favorite", detail: "Mark or clear a favorite" },
  { keys: "LB / RB", label: "Place", detail: "Previous or next view" },
  { keys: "RT", label: "Pick up", detail: "Take the nearest ground item" },
  { keys: "Start", label: "Batch", detail: "Toggle batch select" },
];

export type MoveDir = -1 | 1 | "pageup" | "pagedown" | "home" | "end";

export type Shortcut =
  | { type: "search" }
  | { type: "clear-query" }
  | { type: "move"; dir: MoveDir }
  | { type: "inspect" }
  | { type: "equip" }
  | { type: "use" }
  | { type: "modify" }
  | { type: "display" }
  | { type: "hearth" }
  | { type: "favorite" }
  | { type: "batch" }
  | { type: "pickup" }
  | { type: "escape" }
  | { type: "view-step"; dir: -1 | 1 }
  | { type: "confirm" }
  | { type: "cancel" };

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function viewStep(current: ViewId, dir: -1 | 1): ViewId {
  const index = VIEWS.indexOf(current);
  return VIEWS[(index + dir + VIEWS.length) % VIEWS.length] ?? current;
}

export function keyShortcut(key: string, typing: boolean, pending: boolean): Shortcut | null {
  if (pending && key === "Escape") return { type: "cancel" };
  if (pending && key === "Enter") return { type: "confirm" };
  if (pending) return null;
  if (key === "/" && !typing) return { type: "search" };
  if (typing) {
    if (key === "Escape") return { type: "clear-query" };
    if (key === "ArrowDown") return { type: "move", dir: 1 };
    return null;
  }
  switch (key) {
    case "ArrowDown":
      return { type: "move", dir: 1 };
    case "ArrowUp":
      return { type: "move", dir: -1 };
    case "Home":
      return { type: "move", dir: "home" };
    case "End":
      return { type: "move", dir: "end" };
    case "PageDown":
      return { type: "move", dir: "pagedown" };
    case "PageUp":
      return { type: "move", dir: "pageup" };
    case "Enter":
    case "i":
    case "I":
      return { type: "inspect" };
    case "e":
    case "E":
      return { type: "equip" };
    case "u":
    case "U":
      return { type: "use" };
    case "m":
    case "M":
      return { type: "modify" };
    case "s":
    case "S":
      return { type: "display" };
    case "h":
    case "H":
      return { type: "hearth" };
    case "f":
    case "F":
      return { type: "favorite" };
    case "b":
    case "B":
      return { type: "batch" };
    case "g":
    case "G":
      return { type: "pickup" };
    case "Escape":
      return { type: "escape" };
    case "[":
      return { type: "view-step", dir: -1 };
    case "]":
      return { type: "view-step", dir: 1 };
    default:
      return null;
  }
}

/** Standard gamepad button edges. Axes are handled by the caller. */
export function padButtonShortcut(index: number): Shortcut | null {
  switch (index) {
    case 0:
      return { type: "inspect" };
    case 1:
      return { type: "cancel" };
    case 2:
      return { type: "use" };
    case 3:
      return { type: "favorite" };
    case 4:
      return { type: "view-step", dir: -1 };
    case 5:
      return { type: "view-step", dir: 1 };
    case 7:
      return { type: "pickup" };
    case 9:
      return { type: "batch" };
    case 12:
      return { type: "move", dir: -1 };
    case 13:
      return { type: "move", dir: 1 };
    case 14:
      return { type: "view-step", dir: -1 };
    case 15:
      return { type: "view-step", dir: 1 };
    default:
      return null;
  }
}
