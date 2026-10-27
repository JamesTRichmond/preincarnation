/**
 * PREINCARNATION interface module.
 *
 * Integration: construct `InterfaceBindings` from the engine and render
 * `<InterfaceView>` with `useInterface(bindings)`. Leave `source` as `"engine"`
 * and `sourceLabel` empty so the fixture ribbon stays hidden.
 * `simulateField: false` forwards field steps through `onFieldIntent` and does
 * not move the snapshot. Pass `renderField` to replace the stand-in.
 * Development data is `createFixtureBindings()` — labeled, not a live save.
 */

export { DEV_CATALOG, DEV_SOURCE_LABEL } from "./catalog.ts";
export { createFixtureBindings } from "./logic/bindings.ts";
export { createSession, reduce, topScreen } from "./logic/session.ts";
export type { Action, SessionState } from "./logic/session.ts";
export { journeys } from "./logic/journeys.ts";
export { Showcase } from "./showcase/Showcase.tsx";
export { InterfaceView } from "./ui/InterfaceView.tsx";
export { useInterface } from "./ui/useInterface.ts";
export type {
  GameCatalog,
  GameplaySnapshot,
  InterfaceBindings,
  SaveSlot,
  Settings,
} from "./types.ts";
