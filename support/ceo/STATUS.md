# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~03:15 UTC, after merge of PR #109. Main at `e5c5d13` (merge commit of PR #109)._

## Health of main (`e5c5d13035297c58e30e459ed4d41923de2de226`)

| Gate | Result |
|---|---|
| `npm test` | **270 pass, 0 fail** (per PR #109; includes cooking.test.ts and save.test.ts kitchen cases) |
| `npm run typecheck` | Pass |
| `npm run build` | Pass |
| browser smoke (dev + prod preview) | Pass; canvas present, no overflow, no console errors, title PREINCARNATION |
| `npm run lint` | Fail on pre-existing errors in input.ts, maps.ts, client.server.ts (not introduced by #109) |
| SAVE_VERSION | **9** (migrated from 8; older localStorage loads and receives kitchen) |
| Engine / live route / county save touch | Intentional limited: openKitchen/closeKitchen/getKitchen/setKitchen; applyDeath on enterLimbo. Movement/combat/winter chapter unchanged. |
| Kitchen | Nested in preincarnation.save.v1 (not a second key). Pause overlay only. |

CI verify green on PR head before merge. James merged explicitly.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #109 | County kitchen beside the walk: pause overlay (pot/pantry/book/road), 48 Addison recipes (maple/orchard/dairy/field/waterside/vein). Lay out written card or experiment. Plates are mood (not heal, not hunger, no HP/wound change). Satchel cap 4. Death halves fresh food, clears plates/seats, keeps cards/dry goods. Kitchen minutes age plates only (do not move Ellis or touch fight). No “end this life” button. | merged by James; main at `e5c5d13` |

Vision Checklist satisfied:
1. Marble Vein remains the sole plot.
2. Death advances ~14 winters as a chapter; return as self (kitchen applyDeath on enterLimbo; chapter unchanged).
3. One person; no party.
4. No romance / party / essential crafting systems. Kitchen is optional pause desk; no hunger clock; fair-take (no essential gates that replace the job).
5. 320×240 Canvas and SNES-coat feel preserved. Overlay uses existing gold/ink tokens. Movement unchanged (still only in play mode).
6. localStorage save and migration respected (SAVE_VERSION 8→9; old saves migrate in place).
7. Live integration intentional and limited; support packs not broken.
8. Tests green (270); known lint failures pre-existing and not introduced.

## Durable facts

- Kitchen is part of the life save, not a second game. Green stays one person on Canvas 2D.
- Plates do not heal, feed, or change a swing. HP stayed 3 in playtest.
- Skill on death remains capped (from #83).
- Node ≥ 22.12 required. Tests by glob (no package.json edit).
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.
- grok-29 release helper now expects SAVE_VERSION 9; historical fixtures unchanged.

## Issue Factory

**james-human rulings (still in force):**
- #62 support only. No craft/loot/bench/storage on live surface (kitchen is reviewed intentional exception as non-essential pause desk).
- #63 food named; no hunger.
- #64 no second game.
- #65 coat is the medium.
- #66 keep self, lantern, shovel, waking iron.
- #67 no new gate.
- #68 real Addison County or labeled fiction.
- #69 English only for v1.
- #70 exactly 14 winters. No geo/forecast/weather tax.

**bot-ready:**
- Rebase remaining conflicted PRs against main `e5c5d13` (#71/#72/#73 and any touching engine.ts / save.ts / types.ts / game-app.tsx).

## Open PR ledger (post-#109, ~03:15 UTC)

Many open PRs base on older SHAs (156b308, b2d93df, 679de6f, etc.) and will need rebase. Overlaps with #109 (engine.ts, save.ts, types.ts, game-app.tsx) include:
- #36 item search
- #93 bag-and-grave
- #38 capped-purse (superseded by #83; close)
- #15 kit-compare
- #107 no-cycle-hp
- #106 satchel-desk (and others with styles/routeTree if applicable)

Support/unmounted packs (#59, #87, #88, #89, #95, #98, #100, #101, #102, #105, #108, etc.) remain isolated; none specifically unblocked by the kitchen (different domains).

Stale STATUS PRs (#81, #82, #91, #92) should be closed or rebased in favor of this update.

## Next priorities

1. Close superseded #38 (skill cap already on main via #83).
2. Close or rebase stale STATUS PRs; land this update.
3. Rebase open PRs that touch shared live files (engine.ts, save.ts, types.ts, game-app.tsx) onto `e5c5d13`. Keep their walk/death work and the kitchen field. Do not fold unmerged kitchen branches.
4. Continue vision review of open support packs; merge clean isolated ones after CI green.
5. Address pre-existing lint failures if desired (prefer-const in input.ts/maps.ts, empty block in client.server.ts).
6. Full CI smoke on main post-#109 to confirm no regression.
7. Repo hygiene: large artifacts/screenshots still inflate .git.

## Impact on QQ-VGEF pillars / open risks

- Vision: aligned; kitchen does not create a second plot or essential system.
- Engine: limited intentional touch only. No change to movement, combat, or winter chapter.
- Save: version bumped with clean migrate; old lives load.
- Quality: tests 270 pass; smoke green; lint pre-existing.
- No new open risks beyond expected rebase load on overlapping PRs. Kitchen minutes deliberately do not advance the county clock.

The job continues. The Marble Vein is the only plot. Death is a chapter.
