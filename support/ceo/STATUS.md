# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:00 UTC, after merge of PR #88. Main at `2f37dda` (squash merge of PR #88)._

## Health of main (`2f37dda`)

| Gate | Result |
|---|---|
| `npm run test:game` | Inherited from recent merges; #88 added county-book suite (author reported 223 on its base; later merges higher). Full re-run recommended. |
| `tsc --noEmit` | clean on recent pure-addition and live PRs |
| SAVE_VERSION | remains 8 (or 9 if kitchen #109 landed; confirm on next cycle) |
| Engine / rules / live touch | None from #88. Prior: #107 rules.ts HP non-scaling; #15 weapon compare (pause bag only); #86 Marble Vein tell; #104 place/tell; #109 kitchen if merged. |
| County save / live route | unchanged by #88. Marks live only in isolated `preincarnation-county-book-v1` key if desk ever opened. |

#88 is pure addition under `support/grok-55-merchants/`. Desk UI unmounted. No import into live walk, engine, save, or routes. CI/verify green on head before merge per author evidence.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #88 | County Book stall ledger: twelve Addison merchants across six generations, single mark currency, quote-never-mutates / commit-atomic trades, fairness labels, essentials protected, unmounted desk UI. Isolated `support/grok-55-merchants/`. Does not touch loot scrip or life save. | squash-merged by James; head `fb5b758`; main tip `2f37dda` |

Vision Checklist satisfied: Marble Vein remains sole plot; death is a chapter (unchanged); one person; no romance/party/crafting core; 320×240 Canvas/SNES-coat preserved; localStorage respected (separate key only); support pack does not break live game. Optional archive only.

## Durable facts

- County Book (marks, stalls, quote/commit) lives only in support pack; not mounted, not in life save, does not replace merchant scrip in `src/game/loot`.
- Enemy max HP does not grow with deaths/cycles (#107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (#83). Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Theme map (#117) and PWA install shell (#116) on main.
- Weapon compare sheet (#15) in pause bag; no damage ranking.
- Node ≥ 22.12 required. Tests by glob (`support/**/*.test.ts`).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push. CEO does not merge without explicit confirmation on live touches.

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

## Open PR ledger (post-#88, ~04:00 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates | this branch (improve/ceo-status-88); prior #81/#82/#85/#91/#92/#112/#118/#119 may be stale — rebase or close |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted (vision-aligned pure additions) | #59, #49, #42, #87, #89, #95, #98, #100, #101, #102, #105, #106, #108, etc. |
| Live features (require explicit review) | remaining engine-touch candidates after #15/#86/#104/#107 |
| Other | pending rebase from #71–73 |

## Next priorities

1. Merge this STATUS update once CI green (docs-only, no live impact).
2. Close #38 as superseded by #83.
3. Rebase or close stale STATUS PRs relative to current main `2f37dda`.
4. Continue review of open support packs for vision alignment and conflicts. #88 unblocks nothing live; similar unmounted ledgers (#87 mastery, #89 gatherings, #106 satchel, etc.) can land independently.
5. Full CI smoke on main post-recent merges (#15, #88, #116, #117) to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks from #88. QQ-VGEF pillars (live engine fidelity, vision constraints, optional support readiness) unchanged or strengthened by clean isolation. Optional pack adds merchant design reference without covering the Green.
