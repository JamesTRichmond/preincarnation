# Integration

This folder does not modify `src/game`. The adapter looks for a module that speaks this pack's contract, and separately reads the shipped save.

## Command

From the repository root:

```text
node --experimental-strip-types support/grok-02-persistence/src/run-tests.js
```

`npm test` runs `support/grok-02-persistence/persistence.test.mjs`, which spawns that command and checks both the reference-model line and the live observations.

Exit 0 on this run. Printed:

```text
MODE reference-model
GAME_MODULE no-module
LIVE no-save-api
CASES 95 passed 95 failed 0 cross 32
PASS reference-model
```

## Two probes

`probeGameSave` looks for a JS module that exports `saveApi` (or a default) with `contract === "grok-02-persistence-contract-1"` and `loadBlob`, `applyAction`, `serialize`. Paths tried, none present:

```text
src/game/save.js
src/game/persistence.js
src/game/save/index.js
src/preincarnation/save.js
src/preincarnation/persistence.js
src/save/index.js
src/save.js
game/save.js
```

`PREINCARNATION_SAVE_MODULE` was unset. Result: `found: false`, `reason: no-module`. The 95 cases therefore run on `src/model.js`.

`inspectLiveSave` then imports `src/game/save.ts`. The import succeeded. The module exports `defaultSave`, `migrate`, `loadSave`, `writeSave`, `clearSave`. It does not export `saveApi`. Result: `bound: false`, `reason: no-save-api`. The cases are not rewritten to fit `SaveData`, and `SaveData` is not rewritten to fit the cases.

The live numbers that were returned are listed in [persistence-findings.md](persistence-findings.md). They are not the 95 cases.

## How a future module would bind

Point the probe at a file that actually exports the contract:

```text
PREINCARNATION_SAVE_MODULE=/absolute/path/to/save.js node --experimental-strip-types support/grok-02-persistence/src/run-tests.js
```

If the marker or a function is missing, the probe stops. It does not guess method names on `src/game/save.ts`.

## What the reference runner checks

For each case it loads a base from `fixtures/bases/`, applies the JSON merge patch, runs the action list, and compares the hand-written `expect` block. Successful states must pass `validateV3`. Rejected actions must leave live state untouched.

Migration cases feed a raw v1/v2 object, or `fixtures/raw/v3-new-game.json`, through the checker. That v3 file was produced by this pack's `serialize(makeNewGame())`. It is not a captured player save.

## Left unverified on purpose

The checker still does not play the canvas. It does not press WASD. It does not claim the Marble Vein, a boss-reward popup, or an ending cinematic. See [VISION.md](VISION.md).
