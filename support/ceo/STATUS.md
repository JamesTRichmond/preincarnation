# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:10 UTC, after merge of PR #100 (and subsequent support packs). Main tip at `c05c523` (merge of PR #102)._

## Health of main (`c05c523`)

| Gate | Result |
|---|---|
| `npm run test:game` / `npm test` | green on recent heads (333+ claimed on #101; inherited) |
| `tsc --noEmit` / typecheck | clean on #100 and #101 heads |
| `npm run build` | exit 0 |
| SAVE_VERSION | remains 8 |
| Engine / rules / live route touch | none for the recent support packs |
| County save | unchanged; packs do not replace `preincarnation.save.v1` |

CI verify green on heads before merges. Browser smoke confirmed on #100 branch: canvas present, no overflow, clean console, walk intact.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #100 | Add a persistence pack that does not replace the canvas save. Isolated `support/grok-02-persistence/`: reference model + 95 fixtures (own checker), live read of shipped save/rules (observes v8, key `preincarnation.save.v1`, wintersPassed=14, resolveDeath advances cycle/year by 14, Maeve lantern persists, no checksum). Does not bind fixtures to live SaveData. | merged by James; head `29b4d7f`; merge `d75f484`; pure addition |
| #101 | Addison gadget pack (80 curios, unmounted bench). | merged; tip advanced to `de85584` |
| #102 | DG05–DG08 dungeon pack (White Library, Reservoir, Hayloft, Lantern Court; unmounted). | merged; tip `c05c523` |

(Also recent: #95 environment art, #96 Lemon Fair loot, #97 item inheritance, #98 Ash Bend household, #99 overworld cartogram, #87 Witness mastery, #89 gatherings — all isolated support.)

Vision Checklist satisfied for #100: Marble Vein sole plot; death advances ~14 winters as chapter (observed, unchanged); one person, no party/romance/crafting; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION=8 respected; pure optional support pack, nothing mounted on live walk or Green. Tests green. No live impact. Model disagreements (multiple bodies, checksum) explicitly left out of engine.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Persistence pack records live save behavior without replacing it.
- Node ≥ 22.12 required. Tests by glob.
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.
- Multiple optional support packs now on main; none alter live engine or county save.

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

## Open PR ledger (post-#102, ~04:10 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #112–#120 (stale relative to current main; close or rebase) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | remaining open: #59, #49, #42, #105, #106, #108, #110, #111, #115, etc. |
| Live features | #15 weapon compare (merged earlier), #36 item search, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Close or rebase stale STATUS PRs (#81, #82, #112–#120); this STATUS is current.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review remaining open support packs for vision alignment and any residual conflicts with recent main.
5. Full CI smoke on main post-support-pack wave to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Pure optional support additions; QQ-VGEF pillars (live engine fidelity, vision constraints, optional pack readiness) strengthened by isolation and observation of save without mutation. #100 does not unblock live-engine work; other packs remain independent.
