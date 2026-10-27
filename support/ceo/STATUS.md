# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:00 UTC, after merge of PR #15. Main at `7c3f0b4` (squash merge of PR #15)._

## Health of main (`7c3f0b4`)

| Gate | Result |
|---|---|
| `npm run test:game` | **255 pass, 0 fail** (inherited from #107 evidence; no test change in final #15 squash) |
| `tsc --noEmit` | clean (inherited) |
| SAVE_VERSION | remains 8 |
| Engine / rules touch | none in this merge (final diff is types.ts import only) |
| County save / live route | unchanged |

Prior typecheck/build/smoke inherited from #107. Full re-smoke recommended on next CI cycle. The kit-compare weapon sheet (pause bag, listed not ranked strikes, wearNextWeapon) was already live; this closes the remaining PR with a duplicate-import cleanup.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #15 | Compare the weapon in hand to the next one, without a damage ranking. Pause reads the bag: strike formula, reach, walk affix listed not ranked. No damage arrow/DPS. Hunger/burn/slow/stone/curse/mana-cost stay clauses. Swap via wearNextWeapon does not clear swing timer, refill life or mana. Final squash only cleaned duplicate KitRead import in types.ts (feature already on main). | squash-merged by James at `7c3f0b4`; head `14d4fc6` |

Vision Checklist satisfied: Marble Vein sole plot; death advances exactly 14 winters as chapter; one person; no romance/party/crafting core; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION=8 respected; support packs optional and untouched; tests green. Honest comparison only; does not pretend a swap is a new life. Closes long-open live-feature PR whose substance was already integrated.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (#107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (#83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main (decoy faces, Sentinel telegraph).
- Weapon sheet in pause bag: strikes listed, not ranked; swap is id-only and preserves life/mana/swing timer.
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

## Open PR ledger (post-#15, ~04:00 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #112, #113, #114, #118, #119 (stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #87, #88, #89, #95, #98, #100, #101, #102, #105, #106, #108, etc. |
| Live features | #36 item search, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs; prefer one current STATUS update.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review open support packs for vision alignment and conflicts with recent main.
5. Full CI smoke on main post-#15 to confirm no regression from the types cleanup.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. QQ-VGEF pillars (live engine fidelity, vision constraints) unchanged; optional support readiness unaffected. #15 closed; weapon comparison is live and honest.
