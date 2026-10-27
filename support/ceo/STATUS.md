# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:10 UTC, after merge of PR #102 (and noting subsequent #105/#108). Main tip `d7c61a8` (merge of PR #108). #102 merge commit `c05c523`._

## Health of main (`d7c61a8`)

| Gate | Result |
|---|---|
| `npm run test:game` / `npm test` | green on recent heads (per PR #102: 254 pass on its head; later packs add more; inherited) |
| `tsc --noEmit` / typecheck | clean (per PR #102 and recent) |
| `npm run build` | exit 0 |
| SAVE_VERSION | remains 8 |
| Engine / rules / live route touch | none for #102 pack |
| County save | unchanged; pack does not read/write `preincarnation.save` |

CI verify and browser smoke (desktop/mobile) green on PR #102 head before merge. Walk controls and canvas intact; pack unmounted.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #102 | Add the White Library, Reservoir, Hayloft, and Lantern Court beside the county. Isolated `support/grok-04-dungeons-05-08/`: 65 hand-authored rooms (DG05–DG08), graph proofs, validators, second-crown event proposal only. Not mounted on Green; does not write the life. | merged by James; head `b71acb6`; merge commit `c05c523`; subsequent main advanced to `d7c61a8` |

Vision Checklist fully satisfied: Marble Vein sole plot; death advances ~14 winters as chapter (written as return to dungeon entrance); one person, no party/romance/crafting; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION=8 respected; pure optional support pack, nothing imported into live walk or engine. Tests green on head. No live impact.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Node ≥ 22.12 required. Tests by glob (`support/**/*.test.mjs`).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.
- DG05–DG08 dungeon pack is optional archive under support/; rooms stay off the 320×240 Green. Same isolation as DG09–DG12 and DG13–DG16.

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

## Open PR ledger (post-#102/#105/#108, ~04:10 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82 (stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #106, etc. (recent merges include #102, #105, #108, #101 and earlier packs) |
| Live features | #15 weapon compare, #36 item search, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82); this STATUS is current.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review remaining open support packs for vision alignment and any residual conflicts.
5. Full CI smoke on main post-recent merges to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Pure optional support addition; QQ-VGEF pillars (live engine fidelity, vision constraints, optional pack readiness) unchanged or strengthened by isolation. No unblocking of live-engine work; other support packs remain independent. Does not unblock #15, #36, or engine-touch candidates.
