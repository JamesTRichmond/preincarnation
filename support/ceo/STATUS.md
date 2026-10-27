# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:05 UTC, after merge of PR #99. Main tip `de85584` (includes #99 at `078d55c` and subsequent #100/#101)._

## Health of main (`de85584`)

| Gate | Result |
|---|---|
| `npm run typecheck` | exit 0 on #99 head `a046286` (and prior) |
| `npm test` | exit 0. 253 pass on #99 head (includes cartogram: 192 screens, era gates, Void Oar). Subsequent merges raise the count; no regressions reported. |
| `npm run lint` | pre-existing failures only (prefer-const, unused, empty block); none introduced by #99 |
| `npm run build` | exit 0 |
| Browser smoke | clean desktop + mobile on #99 (title, canvas, no console/page errors, no overflow, no brand/auth warnings) |
| SAVE_VERSION | remains 8 |
| Engine / rules / live route / maps.ts / save.ts | unchanged by #99 |
| Support pack isolation | `support/grok-07-overworld/` pure addition; no shared files |

CI verify green on PR head before merge. Full re-smoke on current tip recommended in next cycle.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #99 | Add the Addison County overworld cartogram beside the walk. Hand-authored cartogram: 12 districts, 192 screens (16 each), 10 hubs, 60 interiors, 16 dungeon mouths, six eras. Validator for reciprocal exits, traps, Void Oar opens. Isolated under `support/grok-07-overworld/`. Explicitly not mounted on `/`; does not replace live 320×240 walk or maps.ts. Own year ledger stays off the Green. | merged by James; merge commit `078d55c`; PR head `a046286`; main tip advanced past it to `de85584` |

Vision Checklist satisfied: Marble Vein remains the sole plot; death advances ~14 winters as a chapter (untouched); one person; no romance/party/crafting systems; 320×240 Canvas/SNES-coat preserved (pack screens are 20×14 tiles, not a replacement raster); localStorage save untouched (nothing reads or writes it); support pack does not break the live game; tests green. See `support/grok-07-overworld/INTEGRATION.md`.

## Durable facts

- Addison County cartogram graph lives beside the walk under `support/grok-07-overworld/`. Mouths are thresholds only. Do not import as second game or replacement raster.
- Enemy max HP does not grow with deaths/cycles (#107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (#83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Recent pure additions on main: #95 environment art, #96 Lemon Fair placement, #97 item inheritance, #98 Ash Bend household, #100 persistence pack, #101 gadgets. All isolated support packs.
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

## Open PR ledger (post-#99 / current tip `de85584`, ~04:05 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close — all stale relative to current tip) | #81, #82, #91, #92, #112–#114, #118–#120, etc. |
| Support / unmounted | #42, #49, #59, #102, #105, #106, #108, #110, #115, etc. |
| Live / engine-adjacent | #36 item search, #93 bag-and-grave, #111 picture-and-pad (needs rebase + review) |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close or rebase the growing set of stale STATUS PRs; this file is now current for #99 and tip `de85584`.
2. Continue vision review of open support packs (#108 endgame, #106 satchel, #105 Ashwick, #102 dungeons 05–08, etc.). Confirm isolation before merge.
3. Engine/rules touches (if any remaining) require explicit review after rebase.
4. Full CI smoke on current main tip to confirm cumulative pure-addition merges introduced no regressions.
5. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks from #99. Pure optional geography graph. QQ-VGEF pillars (live engine fidelity, vision constraints) unaffected; optional support readiness strengthened (cartogram + validator available for future deliberate import only).
