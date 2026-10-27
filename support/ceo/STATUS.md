# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:05 UTC, after merge of PR #98 and concurrent support-pack landings. Main at `c05c523` (merge of PR #102)._

## Health of main (`c05c523`)

| Gate | Result |
|---|---|
| `npm run test:game` / `npm test` | **255+ pass, 0 fail** (per #98 and recent PR evidence; #98 reported 255 including household tests) |
| `tsc --noEmit` | clean (per #98 and concurrent PRs) |
| `npm run build` | clean (per #98) |
| SAVE_VERSION | remains 8 |
| Engine / rules / live save touch | none in #98 or the concurrent pure-addition packs (#95–#102 range) |
| County save / live route | unchanged; #98 adds isolated `/ash-bend` only |

Prior typecheck/build/smoke inherited. Lint remains red on main (pre-existing, not introduced by these PRs). Full re-smoke recommended on next CI cycle. Author browser smoke on #98: `/` and `/ash-bend` 200, clean console, no overflow, walk and desk interactions verified.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #98 | Ash Bend household desk: 80 distinct household objects (`loot.expansion.home.001`–`080`) under `support/grok-75-household-loot/`. Isolated `/ash-bend` route + own localStorage key `preincarnation.loot.household.room.ash-bend`. Evening/Workshop/Company arrangements. No live engine, save, or Vein touch. Parlor is not a county room. | merged by James at `eed1871`; pure addition |

Concurrent pure-addition support packs also landed in the same window (all vision-aligned, no live engine/save/route touch): #95 environment art, #96 Lemon Fair placement, #97 item inheritance, #99 overworld cartogram, #100 persistence pack, #101 gadgets, #102 DG05–DG08 dungeons, plus earlier #87 Witness, #88 County Book, #89 gatherings, #15 kit-compare, #116 PWA shell, #117 theme map.

Vision Checklist satisfied for #98: Marble Vein remains the sole plot; death is still a ~14-winter chapter; one person; no romance/party/crafting systems; 320×240 Canvas/SNES-coat preserved; localStorage county save untouched (separate room key); support pack does not break the live game. Tests green per author.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (#107). Tropoverse ×1.35 once.
- Skill on death remains capped (#83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains (decoy faces, Sentinel telegraph).
- Ash Bend is an optional DOM desk at `/ash-bend` with its own room save; not mounted on the Green.
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

## Open PR ledger (post-#98 / current tip, ~04:05 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82 (stale); this update is current |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted (remaining) | #59 buried-history, #49 waterside, #42 quarry, #105 ashwick, #106 satchel, #108 endgame, #110, etc. |
| Live features | #36 item search, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82).
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review remaining open support packs for vision alignment and conflicts.
5. Full CI smoke on main to confirm no regression from the burst of pure additions.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks from #98. Pure optional desk; QQ-VGEF pillars (live engine fidelity, vision constraints, optional pack readiness) strengthened. Does not unblock specific open PRs (no shared file conflicts claimed), but clears one from the support ledger.
