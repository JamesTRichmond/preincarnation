# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~01:55 UTC, after merge of PR #41. Main at `f204e97` (merge of PR #41)._

## Health of main (`f204e97`)

| Gate | Result |
|---|---|
| CI / verify on PR #41 head `5a28858` | **success** (run 40434764270, completed 01:50 UTC) |
| Prior main health (post-#61 `b3b635d` and earlier) | typecheck 0 errors, build OK, tests 145/145, browser-smoke clean desktop + mobile (documented in prior STATUS) |
| Live walk, save, engine | Unchanged by #41 |

The P0 crash (`paintSheep16 is not defined`) remains fixed.

## What changed recently

| PR | What | Result | SHA |
|---|---|---|---|
| #61 | Vein Score desk: optional `/score` audition (`support/grok-17-score` + `public/score`). Does not replace the walk, does not write a save, does not import field audio. | merged | `b3b635d` |
| #41 | Action-input bench: meadow at `/input` (`support/grok-19-input`). Separate binding lab. Live Green still uses WASD, Space, E, Q. Save format unchanged. Own localStorage key `preincarnation.input.v1`. | merged | `f204e97` |

**Vision Checklist for #41 (confirmed):**
1. Marble Vein remains the sole plot.
2. Death advances ~14 winters as a chapter; return as self.
3. One person; no party.
4. No romance / party / crafting systems.
5. 320×240 Canvas and SNES-coat feel preserved.
6. localStorage save and migration behavior respected (game save untouched; input bindings isolated).
7. Support pack does not unintentionally break the live game (route + CSS source only; live `src/game/input.ts` and engine untouched).
8. Tests / CI verify green (success on head).

**Held:** #45 (death as a chapter). Needs J R sign-off; see #66.

**Blocked (comment, not closed):**
- #18, #28, #37 (and related crafting/loot) → #62.

## Durable facts

- **Node ≥ 22.12 is required.** On 22.11, `npm ci` silently skips rolldown's native binding and Vite 8 fails to build. Use `nvm use` (`.nvmrc` = 22).
- **Tests are discovered by glob.** PRs must **not** edit `package.json` to add tests. Name files `*.test.ts` under `src/` or `support/`, or `*.test.mjs` under `support/`.
- **Save:** `preincarnation.save.v1`, `SAVE_VERSION = 8`; `writeSave` keeps `<key>.bak`. Unreadable/newer save refused (#46).
- **Death math:** `wintersPassed()` = 14 + floor(rand*5), i.e. 14–18 (`rules.ts`). README says 14. Question for J R: #70.
- **CI:** concurrency cancels superseded main runs. Actions v4 emit Node 20 deprecation; bump later.
- **Process:** PRs authored as `JamesTRichmond`. Merges PR → verify → merge commit. No force-push, no direct pushes to main.
- **QQ-VGEF:** #41 is an optional isolated input desk. No impact on core vision pillars, live walk, or open risks. Advances optional binding lab coverage without touching the Marble Vein plot or engine.

## Issue Factory

**james-human (decisions for J R):**
- #62 crafting/loot/bench line
- #63 food vs hunger
- #64 second games/modes
- #65 photo art, audio, animation vs SNES coat
- #66 what carries across a death
- #67 core loop and seam gating
- #68 Vermont authenticity (#21)
- #69 localization (#25)
- #70 the 14–18 winter variance and the real location/weather fetch

**bot-ready (mechanical, verify then merge):**
- #71 support/unmounted PRs, `package.json`-only conflicts: #27, #39, #42, #48, #49, #55. Merging #27/#39/#55 waits on #62. #42's tests need renaming to `.test.mjs`.
- #72 live-feature PRs, `package.json`-only conflicts: #15, #29, #30, #36. (#41 merged; #30 waits on #66.)
- #73 `engine.ts` conflicts: #38, #52, #54. Resolve only; merging needs a CEO review and J R sign-off.

## Open PR ledger (post-#41, ~01:55 UTC)

Note: #61 and #41 are merged. #75 (STATUS update after #61) remains open against prior base.

| Bucket | PRs |
|---|---|
| bot-ready rebase (#71/#72/#73) | 15, 27, 29, 30, 36, 38, 39, 42, 48, 49, 52, 54, 55 |
| Held for J R (core/engine/save) | 45 (#66), 47 (#66), 13 (#66), 14 (#66), 50 (#67), 22 (#67), 24 (#63/#67), 21 (#68) |
| Held for J R (scope/aesthetic) | 16, 23, 34 (#64); 20, 26, 44 (#65); 25 (#69); 43 (#63) |
| Held on crafting/loot line (#62) | 18, 19, 28, 31, 32, 33, 37, 40, 56 |
| Other open | 59 buried-history loot pack (loot → #62), 75 STATUS after #61 |

## Next priorities

1. Merge or close #75 (STATUS after #61) once rebased or superseded by this update; prefer one STATUS PR.
2. Watch #71–#73 for bot pushes, then verify and merge per acceptance criteria. #41 is done.
3. Review remaining open PRs against Vision Checklist, starting with conflict-free support packs that do not touch live engine/save.
4. Once J R answers #62–#70, unblock or close the matching PRs.
5. Repo hygiene: committed `artifacts/`, `screenshots/`, `attachments/` inflate `.git`. Propose moving them out and adding a PR body template.
6. Bump CI actions to v5.
