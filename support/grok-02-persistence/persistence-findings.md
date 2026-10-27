# Persistence findings

## Result of the run

Command, from the repository root, on main `679de6f` plus this pack:

```text
node --experimental-strip-types support/grok-02-persistence/src/run-tests.js
```

The process exited 0 and printed:

```text
MODE reference-model
GAME_MODULE no-module
LIVE no-save-api
CASES 95 passed 95 failed 0 cross 32
PASS reference-model
```

`out/last-run.json` matches that line: `engine` `reference-model`, `failed` 0, `crossSystem` 32, `coverageProblems` empty, `gameModule.reason` `no-module`, `liveSave.bound` false, `liveSave.reason` `no-save-api`.

`PASS reference-model` means the fixtures and `src/model.js` agree with each other. Both were written for this pack. **It is not evidence that the canvas game's 95 fictional cases pass.**

## What was actually called in the shipped game

`src/adapter.js` imported `src/game/save.ts`, `src/game/types.ts`, and `src/game/rules.ts` under `node --experimental-strip-types`. Those modules do not export `saveApi` or `grok-02-persistence-contract-1`, so the 95 cases were not sent to them.

The same process then called the live functions once each and recorded the return values in `liveSave.observations`:

| Call | Returned |
|---|---|
| `defaultSave()` | Ellis Perch, cycle 0, year 2026, map `middlebury`, incarnation `wanderer`, `SAVE_VERSION` 8, key `preincarnation.save.v1`, no checksum field |
| `writeSave` / `loadSave` of a named cycle-2 life | name Ira Fenn, cycle 2, and a `.bak` key was written on the second write |
| corrupt primary, backup present | Ira Fenn, cycle 2 |
| corrupt primary, no backup | Ellis Perch, cycle 0 |
| `clearSave` then `loadSave` | Ellis Perch, cycle 0; the backup key was still present |
| standing version-7 blob (`mapId`, `x`, `y`, name Ira Fenn, `talked: ["elder"]`) | version 8, name Ira Fenn, talked `elder` |
| `wintersPassed()` | 14 |
| `resolveDeath` once on a new game, at Middlebury | cycle 1, year 2040, `returnedFromDeath` true, host `god`, inventory `["starter-iron"]` |
| `resolveDeath` again on that same object, at Bristol | cycle 2, year 2054. Not idempotent |
| `grantBondKeepsake` after that second death (bond stays Maeve) | `relics` includes `lantern` |

These rows are the only runtime claims this pack makes about `src/game`.

## What the 95 cases cover

81 gameplay cases in `fixtures/cases.json`, 14 migration cases in `migration-cases.json`. They run only on the reference model.

| Category | Cases |
|---|---|
| ordinary save/load | 8 |
| death and shrine Release | 14 |
| forms | 9 |
| quests and NPC succession | 6 |
| bosses, keys and rewards | 8 |
| warps, endings, post-completion | 14 |
| torn writes, missing fields, corrupt values | 22 |
| older versions (pack-defined v1/v2/v3) | 14 |

32 cases cross three or more systems. The long ones are `X-01` through `X-07` and `X-09` through `X-15`.

## Contract choices that are not game observations

The reference model still uses rules the shipped game does not. See [VISION.md](VISION.md). A real disagreement is left as a disagreement:

- The checker treats a repeated death token as idempotent. `resolveDeath` is not. Calling it twice advanced cycle 0 to 2 and year 2026 to 2054.
- The checker has forms `walker`, `otter`, `heron`, `crown`. The live default incarnation is `wanderer`.
- The checker envelope has a checksum. `defaultSave()` has no checksum field.
- v1 and v2 layouts in `migration-cases.json` are invented by this pack. The live migration that was actually run is the version-7 blob above, and only that blob.

## What remains unverified

- Whether a death in play (limbo, the canvas, a boss reward popup) calls `resolveDeath` once. The function itself is not idempotent. The engine was not driven.
- Campaign completion, sixteen cuts, four endings, Mayor heron, socketed keys, shrine Release, and year-70 NPC freeze. Those exist in the checker. They were not found by calling `src/game`.
- Saving during an ending cinematic, a quest transition, or the afterlife screen, beyond the fact that `enterLimbo` in `engine.ts` writes a save with `afterlifeHost` set. That path was read, not played, in this run.
- Any player save already in a browser. No localStorage blob from a session was migrated.

Do not describe the 95 passes as a game result.
