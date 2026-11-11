# PREINCARNATION input

Action mapping for a four-direction action-adventure. Gameplay reads intents.
This folder does not define combat numbers or progression.

- `src/engine.ts` — devices, gestures, rebinding, persistence, recovery
- `src/dom-adapter.ts` — keyboard, pointer, gamepad hot-plug, blur
- `ui/InputLab.tsx` — settings and the input-debug scene
- `integration/consume-intents.ts` — the simulation bridge
- `test/input.test.ts` — executable cases

Bindings persist in `localStorage` under `preincarnation.input.v1`. No account
and no network. F8 cannot be rebound. Hold it to reset bindings. Pause always
keeps a keyboard key.
