# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:00 UTC, after merge of PR #117. Main at `afa834e` (merge of PR #117). Prior tip `f35bf48` (#116)._

## Health of main (`afa834e`)

| Gate | Result |
|---|---|
| `npm run test:game` | **293 pass, 0 fail** (per PR #117 evidence log `ops/EVIDENCE/L-0006-test-game.txt`) |
| `tsc --noEmit` | clean (per PR #117) |
| SAVE_VERSION | 9 (from #109 county kitchen; unchanged by #117) |
| Engine / rules touch | none in #117 (pure addition: theme.ts + test + ops/THEME.md) |
| County save / live route | unchanged by #117 |

CI verify green on PR head before merge. Pure addition; no live engine impact.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #117 | Map every live verb to the Marble Vein. Eighteen lines (walk, speak, die, drink + every live relic) in `src/game/theme.ts` and `ops/THEME.md`. `theme.test.ts` fails if a verb has no line or if THEME.md drops one. P4-3 not scored; creek bench excluded. | merged by James; head `4456b09`; main tip `afa834e` |

Vision Checklist fully satisfied: Marble Vein remains sole plot (lines enforce it); death advances ~14 winters as chapter; one person (no party); no romance/party/crafting; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION respected; support packs / live game untouched. Tests green (293). Strengthens theme fidelity without scoring.

## Durable facts

- Theme map on main: every live relic + core verbs has a line tying the act to one person / Marble Vein. Missing line fails test.
- Enemy max HP does not grow with deaths/cycles (#107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (#83). SAVE_VERSION is 9 (#109 kitchen).
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains (decoy faces, Sentinel telegraph). Place-underfoot + county bite from #104.
- Install shell (PWA) from #116 on main.
- Node ≥ 22.12 required. Tests by glob.
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.

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

## Open PR ledger (post-#117, ~04:00 UTC)

Many STATUS update PRs (#91, #92, #112–114, etc.) are now stale relative to current main (`afa834e`). Support packs remain open and unmounted. Live-touch candidates still require rebase + explicit review.

| Bucket | PRs (sample; full list dynamic) |
|---|---|
| STATUS updates (rebase/close) | #91, #92, #112, #113, #114 and earlier (#81, #82) — all predate current tip |
| Superseded | #38 (skill cap already on main via #83) |
| Support / unmounted | #98–#102, #105, #106, #108, #110, #115, etc. |
| Live features | #15, #111 (picture-and-pad, conflicts), remaining engine-touch |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close or rebase stale STATUS PRs so the ledger does not accumulate conflicts; this STATUS is current for #117.
2. Close #38 as superseded by #83.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review open support packs for vision alignment and conflicts with recent main (theme map is additive and non-conflicting).
5. Full CI smoke on main post-#117 / recent merges to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Theme map strengthens vision constraints and QQ-VGEF pillars (theme fidelity, one-plot enforcement) with zero live impact. Does not unblock specific open PRs (additive, no conflict surface), but reduces theme-drift risk for future relic work.
