# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~03:00 UTC, after merge of PR #85. Main at `679de6f` (merge of #85). #83 skill-cap landed at `6fce268` (squash of head `a50c270`)._

## Health of main (`679de6f`)

| Gate | Result |
|---|---|
| `npm run test:game` | **219 pass, 0 fail** (per PR #83 evidence; inherited) |
| `tsc --noEmit` | clean (per PR #83) |
| eslint on touched files | clean (per PR #83) |
| SAVE_VERSION | remains 8 |
| Engine touch | none |
| Docs-only STATUS | corrected SHA; prior claim of a50c270 as main was the pre-merge head |

Prior health (typecheck, build, smoke) inherited from previous main. Full re-smoke recommended on next CI cycle. PR #85 CI was green.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #83 | Skill cap on death: `chapterSkillAward` pays only remaining unbought non-crown ranks minus points in hand (ceiling 12). Prevents infinite skill minting. Migration fills missing `lastSkillAward`. Ledger notes full purse. No engine, no bottles, SAVE_VERSION=8. | merged by James; squash `6fce268` (head was `a50c270`) |
| #85 | Docs-only CEO STATUS update recording #83. Contained incorrect main SHA (claimed a50c270). | merged by James at `679de6f`; SHA now corrected in this follow-up |

Vision Checklist satisfied: Marble Vein sole plot; death ~14 winters chapter; one person; no romance/party/crafting core; 320x240 preserved; localStorage/SAVE_VERSION respected; support packs optional; tests green. Closes empty-grinding path (P1A-3). No live engine or save impact.

## Durable facts

- **Skill on death is capped.** `chapterSkillAward` / `spendableRanksLeft` ensure death cannot mint skill past buyable non-crown ranks. Points in hand count against room. Ceiling 12. `awardAlreadyPaid` mirrors historical formula for save-contract emitter.
- **SAVE_VERSION stays 8.** Missing `lastSkillAward` filled on load. `support/grok-29-release` enforces 8.
- Node ≥ 22.12 required. Tests by glob. No package.json edits for tests.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.
- Main SHA tracking must use the merge commit on main, not the pre-merge branch head.

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

## Open PR ledger (post-#85, ~03:00 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81 (after #80), #82 (after #76) |
| Superseded | #38 (skill cap predecessor; close in favor of #83) |
| Support / unmounted | #59 buried-history, #49 waterside finds, #42 quarry rules, #52 marble tell, #86 marble tell (integrate) |
| Live features | #15 weapon compare, #36 item search |
| Other | remaining from prior ledger pending rebase |

## Next priorities

1. Close #38 as superseded by #83 (same intent, landed).
2. Rebase or close stale STATUS PRs #81 and #82; prefer corrected STATUS as current.
3. Continue bot-ready rebase of remaining PRs (#71-#73); verify vision and tests before merge.
4. Full CI smoke on main post-#83/#85 to confirm no regression.
5. Review open support packs and #86 (Marble Vein tell) for vision alignment; engine touch requires explicit approval.
6. Repo hygiene: large artifacts/screenshots still inflate .git.
