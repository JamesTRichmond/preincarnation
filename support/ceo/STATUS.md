# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~02:15 UTC, after merge of PR #78. Main at `3e804d0` (or merge commit thereof)._

## Health of main

PR #78 merged by jamestrichmond. Changes locked `wintersPassed()` to exactly 14 and removed live geolocation / weather fetch / speed tax.

Verification from PR:
- `npm run test:game`: 203 pass, 0 fail.
- `tsc --noEmit`: clean.
- `eslint` on touched files: clean.
- Browser smoke not run; change does not touch layout, routes, or canvas size.

Prior health (typecheck, build, smoke) remains green on previous base. CI on the merge commit pending or expected success.

## What changed

| PR | What | Result |
|---|---|---|
| #78 | Lock death at fourteen winters and drop live location (Ruling #70) | merged `3e804d0` |

- `wintersPassed` returns 14 unconditionally. Rebirth line and year agree.
- `requestGeo` and `fetchWeather` are no-ops (no navigator.geolocation, no network).
- `weatherSpeed` always 1.
- New/continue no longer write geoLat/geoLng or warp from GPS. Fields remain in save shape (v8) but unused.
- Rain/snow particles from forecast removed.

Support packs untouched. Live 320×240 engine stable. Save version unchanged.

## Durable facts

- **Death math:** `wintersPassed()` returns 14. No variance. Ruling #70 applied on main.
- **Location:** County is authored. No device geo, no open-meteo, no forecast-driven particles or speed.
- **Save:** `preincarnation.save.v1`, `SAVE_VERSION = 8`. Geo fields legacy only.
- **Node ≥ 22.12 required.** Tests by glob. No package.json edits for tests.
- **Vision:** Marble Vein sole plot. Death is a chapter (~14 winters). One person. No romance/party/crafting core. Support packs optional.

## Issue Factory / Open risks

Ruling #70 closed. No blockers remaining on the 14-winter / geo question.

Open STATUS update PRs (#75, #76, #77) should be rebased or closed in favor of this or a consolidated one.

Other open PRs (bot-ready, held for JR on #62/#66 etc.) unchanged by this merge. No unblock of engine.ts conflicts or package.json test-script conflicts.

QQ-VGEF pillars: no impact. Optional packs and live walk unaffected.

## Next priorities

1. Confirm CI green on the #78 merge commit.
2. Rebase or close the pending STATUS PRs (#75–#77) against current main.
3. Continue processing bot-ready PRs (#71–#73) per acceptance criteria; verify before merge.
4. Review remaining support packs (e.g. #59) against Vision Checklist; keep unmounted.
5. Repo hygiene: consider extracting large artifact dirs from git.

Vision Checklist for #78: all 8 items satisfied. No drift.
