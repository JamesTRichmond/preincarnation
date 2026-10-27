# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~03:35 UTC, after merge of PR #107. Main at `3beed56` (merge of PR #107)._

## Health of main (`3beed56`)

| Gate | Result |
|---|---|
| `npm run test:game` | **255 pass, 0 fail** (per PR #107 evidence log `ops/EVIDENCE/L-0004-test-game.txt`) |
| `tsc --noEmit` | clean (per PR #107) |
| SAVE_VERSION | remains 8 |
| Engine / rules touch | yes: `enemyMaxHp` no longer scales with `save.cycle`; Tropoverse ×1.35 once (place, not deaths) |
| County save / live route | unchanged |

Prior typecheck/build/smoke inherited; full re-smoke recommended on next CI cycle. CI verify green on PR head before merge.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #107 | Stop a later life from fattening every enemy. `enemyMaxHp(base, tropoverse)` ignores cycle. Removes `1 + cycle * 0.12` sponge (P1A-5). Test guards against reintroduction. Tropoverse remains a one-time place multiplier. | merged by James; head `eeebd2f`; main tip `3beed56` |

Vision Checklist satisfied: Marble Vein sole plot; death advances exactly 14 winters as chapter (unchanged); one person; no romance/party/crafting; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION=8 respected; no support-pack live impact. Later lives are the same fight. Tests green. Closes HP-only cycle scaling path.

## Durable facts

- Enemy max HP does not grow with deaths/cycles. Tropoverse is a place (×1.35 once). Player ribcage already free of cycle term.
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main (decoy faces, Sentinel telegraph).
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

## Open PR ledger (post-#107, ~03:35 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82 (stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #87, #88, #89, #100, #101, #102, #105, #106, #108, etc. |
| Live features | #15 weapon compare, #36 item search, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82); this STATUS is current.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review open support packs for vision alignment and conflicts with recent main (rules.ts change is narrow).
5. Full CI smoke on main post-#107 to confirm no regression from HP change.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Removes the P1A-5 sponge. QQ-VGEF pillars (live engine fidelity, vision constraints) strengthened; no impact on optional support readiness.
