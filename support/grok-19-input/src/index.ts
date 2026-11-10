export { InputEngine } from "./engine.ts";
export { readSimulationCommands } from "../integration/consume-intents.ts";
export { attachDomInput, gamepadApiPresent, readGamepads, readSafeInsets } from "./dom-adapter.ts";
export { initialArena, stepArena, ARENA_SPEED } from "./arena.ts";
export { defaultBindings } from "./defaults.ts";
export { layoutTouch, rectGap, defaultPositions, hitControl } from "./touch-layout.ts";
export { STORAGE_KEY, TIMING, RECOVERY_CODE, MIN_TOUCH_PX, SHRINE_GAP_PX } from "./timing.ts";
export { classifyPad, promptFor, labelForCode } from "./prompts.ts";
export { loadPersisted, parsePersisted } from "./persistence.ts";
export type {
  ActionId,
  Binding,
  BindingTable,
  FrameInput,
  Intent,
  PadSnap,
  PromptDevice,
  TouchControlId,
  Viewport,
} from "./types.ts";
