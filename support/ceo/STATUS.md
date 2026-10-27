# PREINCARNATION: CEO Status

_Updated Mon 2026-10-26, ~8:10 PM EDT, after J R approved execution run #1. Main at `440a066` (merge of PR #17)._

## Health of main (`440a066`, verified locally on Node 22.23.4)

| Gate | Result |
|---|---|
| `npm ci` | OK |
| `npx tsc --noEmit` | **0 errors** (was 10 before #57) |
| `npm run build` | OK |
| `npm test` (`test:game`, glob) | **145/145 pass** |
| browser-smoke dev :8080, desktop + mobile | 200, canvas, 0 console errors, 0 page errors, no horizontal overflow |
| browser-smoke built :8081, desktop + mobile | same; no divergence from the dev baseline |
| GitHub Actions `CI / verify` on main | **success**, run 40422784882 (finished 8:00 PM EDT) |

The P0 crash (`paintSheep16 is not defined`) is fixed.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #57 | P0 hotfix: restore the `./pix` painter imports in `engine.ts`, and make `waterside/objects-demo.ts` a real module (cherry-pick of `e109654` from #56) | merged `cdf5b21` |
| #58 | One `test` key. `test:game` uses globs (`src/**/*.test.ts`, `support/**/*.test.ts`, `support/**/*.test.mjs`); `test:platform` and `test:all` split out; `engines.node >=22.12` + `.nvmrc`; lockfile resync; README `## Test` | merged `f95d345` |
| #60 | CI: `.github/workflows/ci.yml` on PRs and pushes to main. Node from `.nvmrc`, `npm ci`, tsc, build, `npm test`, Playwright smoke dev + built with a verdict gate, smoke artifacts uploaded | merged `0e675a2` |
| #46 | Refuse a save the game can't read; protect the backup | merged `689c95c` (132/132) |
| #12 | Addison County combat survey (support) | merged `9e36350` (128/128) |
| #53 | DG09–12 dungeon pack (support) | merged `f099e55` (128/128) |
| #17 | Release desk: keep a life across updates (support) | merged `440a066` (141/141) |
| #35 | Duplicate of #56 | closed with comment |
| #51 | Duplicate of #38 (unwired `rewards.ts`, no tests) | closed with comment |

Each merged PR has a verification comment: typecheck, build, game tests, smoke dev + built, desktop + mobile, console, overflow.

**Held:** #45 (death as a chapter). Blocker comment posted:
- `engine.ts` +85/-6 with a new `chapter` mode;
- new persisted `save.flags.pendingChapter` without a `SAVE_VERSION` bump;
- death-cause string matching;
- the 14 vs 14–18 winters question;
- stale base with a `package.json` conflict.

It needs J R sign-off; see #66.

**Blocked (comment, not closed):**
- #18 crafting resolver → #62.
- #28 loot ledger mounted on `/` + `input.ts` keyup swallowing → #62.
- #37 ground lens: `engine.ts`/new localStorage doc, loot framing, stale base → #62.

## Durable facts

- **Node ≥ 22.12 is required.** On 22.11, `npm ci` silently skips rolldown's native binding (`@rolldown/binding-linux-x64-gnu`) and Vite 8 fails to build. Use `nvm use` (`.nvmrc` = 22).
- **Tests are discovered by glob.** PRs must **not** edit `package.json` to add tests. Name files `*.test.ts` under `src/` or `support/`, or `*.test.mjs` under `support/`. `.js` tests are not discovered.
- `npm run test:platform` runs the App Builder template tests in `scripts/`. They need the sandbox `.grok/` dir and skip cleanly without it.
- **Save:** `preincarnation.save.v1`, `SAVE_VERSION = 8`; `writeSave` keeps `<key>.bak`. Since #46, an unreadable/newer save is refused, not overwritten.
- **Death math:** `wintersPassed()` = 14 + floor(rand*5), i.e. 14–18 (`rules.ts`). The README says 14. Question for J R: #70.
- **CI:** `concurrency` cancels superseded main runs, so "cancelled" on an older main SHA is expected. `actions/checkout@v4`/`setup-node@v4` emit a Node 20 deprecation warning; bump them to v5 later.
- **Process:** every PR is authored as `JamesTRichmond` (worker bots on J R's account). Merges go PR → verify → merge commit. No force-push, no direct pushes to main.

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
- #72 live-feature PRs, `package.json`-only conflicts: #15, #29, #30, #36, #41. #30 waits on #66.
- #73 `engine.ts` conflicts: #38, #52, #54. Resolve only; merging needs a CEO review and J R sign-off.

## Open PR ledger (41 open, ~8:10 PM EDT)

| Bucket | PRs |
|---|---|
| bot-ready rebase (#71/#72/#73) | 15, 27, 29, 30, 36, 38, 39, 41, 42, 48, 49, 52, 54, 55 |
| Held for J R (core/engine/save) | 45 (#66), 47 (#66), 13 (#66), 14 (#66), 50 (#67), 22 (#67), 24 (#63/#67), 21 (#68) |
| Held for J R (scope/aesthetic) | 16, 23, 34 (#64); 20, 26, 44 (#65); 25 (#69); 43 (#63) |
| Held on crafting/loot line (#62); block comments posted on 18, 28, 37 only | 18, 19, 28, 31, 32, 33, 37, 40, 56 (mastery bench; its crash fix already landed as #57) |
| New since the survey, not yet reviewed | 59 buried-history loot pack (`support/grok-70-*`, conflicts on `package.json`; loot → #62), 61 Vein Score desk (`/score` route + `support/grok-17-score`, +37,951 lines, mergeable) |

## Next run

1. Watch #71–#73 for bot pushes, then verify and merge per the acceptance criteria.
2. Review #59 and #61 against the Vision Checklist. #61's size, mostly under `public/score`, needs a repo-weight check.
3. Once J R answers #62–#70, unblock or close the matching PRs.
4. Repo hygiene: `artifacts/`, `screenshots/` and `attachments/` are committed (`.git` ≈130 MB). Propose moving them out of git and adding a PR body template.
5. Bump the CI actions to v5.
