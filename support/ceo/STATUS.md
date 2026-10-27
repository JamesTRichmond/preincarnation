# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:15 UTC, after merge of PR #127. Main at `db99b65` (merge of PR #127)._

## Health of main (`db99b65`)

| Gate | Result |
|---|---|
| `npm run test:game` | **497 pass, 0 fail** (per PR #127 evidence: ops/EVIDENCE/L-0007-test-game.txt) |
| `tsc --noEmit` / typecheck | clean |
| SAVE_VERSION | 9 (live; persistence pack observation pin updated from 8 to 9; format unchanged) |
| Engine / rules / live route touch | none |
| County save | unchanged |

CI verify green claimed on head. No live engine impact.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #127 | Name the sphere as the folded county, not a second plot. Adds `fold` theme verb + line in theme.ts / ops/THEME.md; names dissonance (Release-the-universe / Bind-it-as-a-Crown as second plot, not the job). Test enforces Marble Vein remains sole plot and note is present. Updates persistence pack observed saveVersion pin 8→9. No rooms, no dialogue cuts, no score. | merged by James; head `db99b65`; main tip `db99b65` |

Vision Checklist fully satisfied: Marble Vein remains the sole plot (explicitly reinforced; second-plot offer named and rejected); death advances ~14 winters as chapter; one person, no party/romance/crafting; 320×240 Canvas/SNES-coat preserved; localStorage respected (SAVE_VERSION 9 pin only); pure docs + test enforcement, no live touch. Tests green. Strengthens vision fidelity.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (from #83).
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Theme map (from #117) + fold/dissonance (from #127) enforce sole-plot constraint.
- SAVE_VERSION is 9 (post-#109 kitchen). Persistence pack pin matches.
- Node ≥ 22.12 required. Tests by glob (`support/**/*.test.ts` + `.mjs`).
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

## Open PR ledger (post-#127, ~04:15 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #85, #91, #92, #112, #118, #119, #120, #121, #122, #124, #125, #126 (many stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | numerous recent pure additions (#95–#108 range and later); continue isolation checks |
| Live features | remaining engine-touch candidates (require explicit review) |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs; this STATUS is current post-#127.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review remaining open support packs for vision alignment and any residual conflicts.
5. Full CI smoke on main post-recent merges to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Vision fidelity strengthened by explicit fold/dissonance ledger and test. QQ-VGEF pillars (live engine fidelity, vision constraints, optional pack readiness) unchanged or improved. Persistence pin alignment is hygiene only. No unblocking of live-engine work; other support packs remain independent. Theme enforcement from #117/#127 reduces risk of second-plot drift.
