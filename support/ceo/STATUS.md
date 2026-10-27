# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:10 UTC, after merge of PR #108. Main tip at `d2855e8` (post-#110); #108 squash-merged at `d7c61a8`._

## Health of main (`d7c61a8` / tip `d2855e8`)

| Gate | Result |
|---|---|
| `npm run test:game` / `npm test` | **253+ pass, 0 fail** (per PR #108 evidence: 253 pass including DG13–DG16 graph/endings/death recovery 30 checks on 85 rooms; prior packs inherited) |
| `tsc --noEmit` / typecheck | clean (per PR #108) |
| `npm run build` | exit 0 |
| SAVE_VERSION | remains 8 |
| Engine / rules / live route touch | none for this pack |
| County save | unchanged; pack does not read/write `preincarnation.save.v1` |

CI verify green on PR head before merge. Browser smoke (desktop/mobile, dev + preview) confirmed canvas present, no overflow, clean console, walk controls intact. Pre-existing lint failures unchanged.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #108 | Add the last four dungeons beside the county walk. Isolated `support/grok-06-dungeons-13-16/`: DG13 The House Built Out of Names, DG14 Snow Under the Lake, DG15 The Unborn Foundry, DG16 The Heart of the Marble Vein; 85 rooms (16/17/17/35); four seam endings (Keep/Close/Distribute/Refuse); layouts, exits, actors, objects, solution traces, boss machines, ending sequences. Farm/mill/crossing/family decisions change copy only. Distribute needs all four institutions; Refuse needs eight named witnesses. Unmounted; no import into live walk/Green. | squash-merged by James at `d7c61a8` (head `abf018d`); tip advanced to `d2855e8` |

Vision Checklist fully satisfied: Marble Vein sole plot; death advances ~14 winters as chapter (simulated only in pack tests; does not call resolveDeath or write life save); one person, no party/romance/crafting; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION=8 respected; pure optional support pack, nothing mounted on live walk or Green. Tests green. No live impact.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Node ≥ 22.12 required. Tests by glob (`support/**/*.test.ts` / `.mjs`).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.
- DG13–DG16 endgame packet is optional archive under support/; rooms not on the walk; meta flags and tool ids remain PENDING.

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

## Open PR ledger (post-#108, ~04:10 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82 (stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #106, etc. (recent merges of similar packs: #95–#110 range; #108 now on main) |
| Live features | #15 weapon compare, #36 item search, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82); this STATUS is current for #108.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review remaining open support packs for vision alignment and any residual conflicts.
5. Full CI smoke on main post-recent merges to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Pure optional support addition; QQ-VGEF pillars (live engine fidelity, vision constraints, optional pack readiness) unchanged or strengthened by isolation. No unblocking of live-engine work; other support packs (including prior dungeon quarters) remain independent. #102 (DG05–DG08) was concurrent and also pure addition.
