# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:10 UTC, after merge of PR #105. Main tip `d2855e8` (includes merge of #105 at `09c4310`)._

## Health of main (`d2855e8`)

| Gate | Result |
|---|---|
| `npm run test:game` / `npm test` | green on recent heads (267 pass on #105 evidence; later packs higher) |
| `tsc --noEmit` / typecheck | clean |
| `npm run build` | exit 0 |
| SAVE_VERSION | remains 8 |
| Engine / rules / live route touch | none for these packs |
| County save | unchanged; packs do not read/write `preincarnation.save.v1` |

CI verify green on PR heads before merge. Browser smoke (desktop/mobile, dev + preview) confirmed canvas present, no overflow, clean console, walk controls intact on the Green.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #105 | Add the Ashwick register beside the county walk. Isolated `support/grok-15-interface/` + `public/ashwick/` gouache plates. Pages for title/new/continue/save slots/pause/settings/tools/off-hand/bottles/upgrades/evidence journal/survey (places already stood)/background/bond/ideal/flaw/era/return history/credits/four endings. Showcase unmounted. No import into live routes or game-app. Does not touch save. | merged by James; head `ad2c193`; merge commit `09c4310` |

Vision Checklist fully satisfied: Marble Vein sole plot; death advances ~14 winters as chapter (unchanged); one person, no party/romance/crafting; 320×240 Canvas/SNES-coat preserved (plates are studies, not the field); localStorage/SAVE_VERSION=8 respected; pure optional support pack, nothing mounted on live walk or Green. Tests green. No live impact.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Node ≥ 22.12 required. Tests by glob (`support/**/*.test.ts`).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.
- Ashwick register is optional ledger under support/; stays off the walk.
- Multiple recent pure support packs (#96–#108 range) landed; live engine untouched.

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

## Open PR ledger (post-#105, ~04:10 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82 (stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #106, etc. (recent merges: #95–#108 range of pure packs) |
| Live features | #15 weapon compare, #36 item search, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82); this STATUS is current.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review remaining open support packs for vision alignment and any residual conflicts.
5. Full CI smoke on main post-recent merges to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Pure optional support addition; QQ-VGEF pillars (live engine fidelity, vision constraints, optional pack readiness) unchanged or strengthened by isolation. No unblocking of live-engine work; other support packs remain independent. #105 does not unblock others (no shared files).
