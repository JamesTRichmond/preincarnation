# Integration guide

The acceptance runner owns only `support/grok-10-acceptance/`. It does not patch game code. When a playable client exists, expose this seam so the scenarios execute instead of staying blocked.

## Run

From the workspace root:

```sh
node support/grok-10-acceptance/run-acceptance.mjs --base-url http://127.0.0.1:8080/
```

`launch-probe.sh` only checks that a client is present. It will not boot the shared app.

## Seam

Set `window.__PREINCARNATION_TEST__` to version `1` with `getState()` and `dispatch(action)`. `getState` may be sync or async. Return the state object below. `dispatch` returns `{ error }` when the action cannot be performed.

The runner itself handles `wait`, `checkpoint`, and `baseline`. Do not implement those in the game. `baseline` is the zero point for movement deltas, after setup.

Coordinates: `x` increases east, `y` increases south. Facing is `n`, `e`, `s`, or `w`. Keyboard checks use `KeyW`, `KeyA`, `KeyS`, `KeyD` as screen-relative cardinals (A is west, D is east).

Pointer actions use `{ type: "pointer", phase, id, control, dir }`. Controls are `move`, `blade`, `interact`, `offhand`, and `pause`. Two ids must be able to be down together.

Other dispatched actions: `boot`, `new-game`, `save`, `load`, `reload-sim`, `corrupt-save`, `kill`, `release` (`confirm: true`), `place` (`fixture`), `key` (`phase`, `code`), `control` (`control`, `phase`: `down`, `up`, or `tap`), `menu` (`pause`, `unpause`, `dismiss`, `begin-create`, `cancel`, `continue`, `set-volume`), `visibility` (`hidden` or `visible`), `resize`, `audio-file` (`name`, `mime`), `audio-stop`.

`place` fixtures used by the catalog: `solid-on-east`, `map-edge-east`, `sign-ahead`, `shrine-ahead`, `locked-door`, `give-offhand`, `dungeon-entrance`, `locked-dungeon`, `dungeon-reward`, `dungeon-exit`, `ending`.

## State the assertions read

`screen` (`title`, `create`, `field`, `pause`, `dialogue`, `death`, `ending`), `loginRequired`, `protagonistId` (`ellis-perch`), `protagonistCount`, `x`, `y`, `facing`, `areaId`, `area.kind`, `area.entranceId`, `paused`, `suspended`, `simTick`, `swinging`, `spinning`, `moving`, `velocity.x`, `velocity.y`, `controlLocked`, `verb`, `bladeEquipped`, `lastControl`, `lastAttackKind`, `attackCount`, `offhand.available`, `offhand.effectFired`, `keys`, `endingsCleared`, `yearsAdvanced`, `reincarnated`, `fatal`, `hp`, `playfieldReady`, `creation.cancellable`, `collision.eastBlocked`, `collision.edgeBlocked`, `collision.insideBounds`, `flags.doorOpened`, `inventory.rewardCount`, `save.wroteLocal`, `save.requiredAccount`, `save.remote`, `save.present`, `save.erased`, `audio.volume`, `audio.playing`, `audio.deviceOpen`, `audio.uploaded`, `audio.remote`, `audio.uploadCount`, `content.dungeons`, `content.districts`, `content.eras`, `content.endings`, `content.shrines`, `content.lockedDoors`, matching id arrays (`dungeonIds`, `districtIds`, `eraIds`, `endingIds`), `ui.claimsFullCampaign`, `ui.minFontPx`, `world.proceduralCampaign`, `world.consequenceCount`, `compassVisible`, `quest.requiresCompass`, `geolocationRequested`, `touch.boxes` for the five controls (`width` and `height` in CSS pixels).

Touch targets may instead be DOM nodes with `data-touch="move|blade|interact|offhand|pause"`. A 44px minimum and a 4.5:1 contrast check are measured in an emulated Chromium viewport only. That is not a physical phone test. Canvas text the DOM cannot see stays blocked unless `ui.minFontPx` or `ui.minContrast` is set. Page-only checks (overflow, touch-action, contrast) run without the seam. Anything that reads game state does not.

`audio.muted`, `audio.fetchCount`, `notificationRequested`, and `save.profileId` are part of the state. A remote URL passed to `audio-file` must not be fetched.

If `content.dungeons` or `content.shrines` is `0`, the related scenarios are **NOT IMPLEMENTED**. Planned counts (16 dungeons, 12 districts, 6 eras, 4 endings) are not playable content. A partial build must set `ui.claimsFullCampaign` to false.

## Status

| Status | Meaning |
| --- | --- |
| PASS | The live client met the assertions. |
| FAIL | The probe or the live client contradicted the expectation. |
| BLOCKED | The step could not be executed. |
| NOT IMPLEMENTED | The build reports the feature absent, or the source scan found none of its signals. |

BLOCKED and NOT IMPLEMENTED are not passes.
