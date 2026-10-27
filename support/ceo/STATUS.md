# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:10 UTC, after merge of PR #110. Main at `d2855e8` (merge of PR #110)._

## Health of main (`d2855e8`)

| Gate | Result |
|---|---|
| `npm test` | **314 pass, 0 fail** (per PR #110 evidence on head 68125c2; includes 30 tests in opening pack) |
| `npm run typecheck` | clean (per PR #110) |
| `npm run build` | exit 0 |
| `npx eslint support/grok-20-opening` | clean |
| SAVE_VERSION | unchanged (pack does not touch county save) |
| Engine / rules / live route touch | none |
| County save | unchanged; pack uses own unused key `preincarnation-opening-v1` |

CI and author verification green. Browser smoke (desktop/mobile, dev + production preview) confirmed title, canvas, no errors, no overflow, walk controls intact. Pre-existing lint issues outside the pack left unfixed.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #110 | Add the opening-hour pack beside the county walk. Isolated `support/grok-20-opening/`: Ellis arrives with parcel, Ione Pell (same parcel 14 years prior), Marble Vein impression, death as shore/release, soft lessons (none gates), 26 out-of-order paths + world/dialogue/graph tests. Unmounted; full-viewport scene not imported by routes or canvas. | merged by James; head `68125c2`; main tip `d2855e8` |

Vision Checklist fully satisfied: Marble Vein sole plot; death advances ~14 winters as chapter; one person, no party/romance/crafting; 320×240 Canvas/SNES-coat preserved on live Green (pack deliberately unmounted to avoid covering it); localStorage respected; pure optional support pack. Explicit vision conflict (full-viewport + parcel-first vs Maeve's step) left as conflict by not mounting. Tests green. No live impact. Same isolation pattern as #90, #103, and recent support packs.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Node ≥ 22.12 required. Tests by glob (`support/**/*.test.ts`).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.
- Opening-hour pack is optional archive under support/; not wired into live walk or Green.

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

## Open PR ledger (post-#110, ~04:10 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | prior STATUS notes may be stale; this update supersedes post-#101 |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | remaining open support packs independent of #110 (no shared files) |
| Live features | any remaining engine-touch candidates require explicit review |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
3. Review remaining open support packs for vision alignment and any residual conflicts.
4. Full CI smoke on main post-recent merges to confirm no regression.
5. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Pure optional support addition; QQ-VGEF pillars (live engine fidelity, vision constraints, optional pack readiness) unchanged or strengthened by isolation. Does not unblock live-engine work or conflicted PRs; other support packs remain independent. Mounting the pack remains a deliberate non-goal.
