# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~03:15 UTC, after merge of PR #104. Main at `7e2b19d` (squash merge of PR #104)._

## Health of main (`7e2b19d`)

| Gate | Result |
|---|---|
| `npm test` | **257 pass, 0 fail** (per PR #104 evidence; includes place underfoot / county tell + stepSentinel) |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| browser smoke (dev + prod preview, desktop + mobile) | exit 0; title, canvas, no errors, no overflow |
| SAVE_VERSION | remains 8 |
| Engine touch | intentional, isolated: new `place.ts` + targeted AI/draw in `engine.ts` (non-sentinel only) |
| Sentinel path | from #86 preserved (countyTell early-returns, no ring) |

Prior health inherited from post-#90/#94. CI verify green on PR head `9c01da5` before squash. Lint failures pre-existing (untouched files).

## What changed in this run

| PR | What | Result |
|---|---|---|
| #104 | Place-underfoot plate under hearts (path/green/meadow/bridge/pines/lip/**The Vein** on quarry marble). County tell for non-sentinel creatures: hold + pale ring/broken line (0.4s) before close/bite; warning clears past leave range. Sentinel keeps #86 gold telegraph. Save untouched; warned runtime-only. | squash-merged by James; main at `7e2b19d` |

Vision Checklist satisfied: Marble Vein remains the sole plot (Vein name only on quarry marble; no second map). Death advances ~14 winters as a chapter (untouched). One person; no party. No romance/party/crafting systems. 320×240 Canvas and SNES-coat preserved (short ink plate + pixel ring). localStorage and SAVE_VERSION=8 respected. Intentional live engine touch is isolated and preserves Sentinel path. Tests green (257).

## Durable facts

- Ground plate and county bite tell are now on the live walk. Sentinel gold tell from #86 unchanged.
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Node ≥ 22.12 required. Tests by glob (`src/**/*.test.ts`).
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push. Squash preferred for history.

## Issue Factory

**james-human rulings (still in force):**
- #62 support only. No craft/loot/bench/storage on live surface.
- #63 food named; no hunger.
- #64 no second game.
- #65 coat is the medium.
- #66 keep self, lantern, shovel, waking iron.
- #67 no new gate.
- #68 real Addison County or labeled fiction.
- #69 English only for v1.
- #70 exactly 14 winters. No geo/forecast/weather tax.

**bot-ready:**
- #71/#72/#73 still open for rebase of remaining conflicted PRs.

## Open PR ledger (post-#104, ~03:15 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #91, #92 (stale relative to current main) |
| Superseded | #38 (skill cap predecessor; close in favor of #83) |
| Support / unmounted | #59 buried-history, #49 waterside, #42 quarry rules, #87 witness-mastery, #88 county-book, #89 community-gatherings, #95 env-art, #96 lemon-fair, #97 item-inheritance, #98 household, #99 overworld, #100 persistence, #101 gadgets, #102 dungeons-05-08, #105 ashwick, #106 satchel, #108 last-four-dungeons, #109 county-kitchen |
| Live features (engine touch likely) | #15 kit-compare, #36 item search, #93 bag-and-grave, #107 no-cycle-hp |
| Other | remaining pending rebase |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82, #91, #92); this update is current.
3. Rebase PRs that touch `src/game/engine.ts` (#36, #38, #93, #107 and any others) onto current main; verify no conflict with place.ts / countyTell path.
4. Continue bot-ready rebase of remaining support packs; verify vision + tests before merge. Isolated packs (own keys, unmounted) preferred.
5. Full CI smoke on main post-#104 to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. County tell is a feel improvement on the walk; does not affect QQ-VGEF pillars beyond live engine fidelity. Sentinel path intact.
