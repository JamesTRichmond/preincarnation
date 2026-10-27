import type { ActionId, Binding, PromptDevice } from "./types.ts";

const XBOX_BUTTON = [
  "A",
  "B",
  "X",
  "Y",
  "LB",
  "RB",
  "LT",
  "RT",
  "View",
  "Menu",
  "LS",
  "RS",
  "D↑",
  "D↓",
  "D←",
  "D→",
];

const PS_BUTTON = [
  "Cross",
  "Circle",
  "Square",
  "Triangle",
  "L1",
  "R1",
  "L2",
  "R2",
  "Create",
  "Options",
  "L3",
  "R3",
  "D↑",
  "D↓",
  "D←",
  "D→",
];

const GENERIC_BUTTON = [
  "South",
  "East",
  "West",
  "North",
  "L1",
  "R1",
  "L2",
  "R2",
  "Select",
  "Start",
  "L3",
  "R3",
  "D↑",
  "D↓",
  "D←",
  "D→",
];

const KEY_LABEL: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Escape: "Esc",
  Space: "Space",
  ShiftLeft: "Shift",
  ShiftRight: "RShift",
  ControlLeft: "Ctrl",
  ControlRight: "RCtrl",
  Enter: "Enter",
  Backspace: "Bksp",
  Tab: "Tab",
};

export function labelForCode(code: string): string {
  if (KEY_LABEL[code]) return KEY_LABEL[code];
  if (code.startsWith("Key") && code.length === 4) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}

export function classifyPad(id: string | null | undefined): Exclude<
  PromptDevice,
  "keyboard" | "touch"
> {
  const text = (id ?? "").toLowerCase();
  if (
    text.includes("xbox") ||
    text.includes("xinput") ||
    text.includes("microsoft") ||
    text.includes("045e")
  ) {
    return "xbox";
  }
  if (
    text.includes("playstation") ||
    text.includes("dualshock") ||
    text.includes("dualsense") ||
    text.includes("sony") ||
    text.includes("054c") ||
    text.includes("vendor: 054c")
  ) {
    return "playstation";
  }
  return "genericPad";
}

function buttonLabel(index: number, device: PromptDevice): string {
  const table =
    device === "xbox" ? XBOX_BUTTON : device === "playstation" ? PS_BUTTON : GENERIC_BUTTON;
  return table[index] ?? `B${index}`;
}

export function bindingLabel(binding: Binding, device: PromptDevice): string {
  switch (binding.kind) {
    case "key":
      return labelForCode(binding.code);
    case "padButton":
      return buttonLabel(binding.button, device);
    case "padAxis": {
      const stick = binding.axis <= 1 ? "LS" : "RS";
      const dir =
        binding.axis % 2 === 0
          ? binding.sign > 0
            ? "→"
            : "←"
          : binding.sign > 0
            ? "↓"
            : "↑";
      return `${stick}${dir}`;
    }
    case "padChord":
      return binding.buttons.map((button) => buttonLabel(button, device)).join("+");
    case "touch":
      return touchName(binding.control);
  }
}

export function touchName(control: string): string {
  switch (control) {
    case "stick":
      return "Stick";
    case "blade":
      return "Blade";
    case "offhand":
      return "Tool";
    case "interact":
      return "Offer";
    case "pause":
      return "Pause";
    case "shrine":
      return "Shrine";
    default:
      return control;
  }
}

export function deviceMatches(binding: Binding, device: PromptDevice): boolean {
  if (device === "keyboard") return binding.kind === "key";
  if (device === "touch") return binding.kind === "touch";
  return binding.kind === "padButton" || binding.kind === "padAxis" || binding.kind === "padChord";
}

const HOLD_ACTIONS = new Set<ActionId>(["blade", "shrineRelease"]);

export function promptFor(
  action: ActionId,
  device: PromptDevice,
  bindings: Binding[],
): string {
  const match = bindings.find((binding) => deviceMatches(binding, device));
  if (!match) return "—";
  const label = bindingLabel(match, device);
  if (action === "shrineRelease") return `${label} hold`;
  if (action === "blade") return `${label} tap/hold`;
  if (HOLD_ACTIONS.has(action)) return `${label} hold`;
  return label;
}
