# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:05 UTC, after merge of PR #97 (item inheritance) and concurrent support-pack merges. Main tip at `c05c523` (merge of PR #102)._

## Health of main (`c05c523`)

| Gate | Result |
|---|---|
| `npm run test:game` | Inherited green from recent heads (PR #97 evidence: 262 pass including pack's 10; earlier #107: 255). Full re-run recommended on next CI. |
| `tsc --noEmit` | clean on recent heads |
| SAVE_VERSION | remains 8 |
| Engine / rules touch | none in the recent support batch; #107 rules.ts HP non-scaling remains |
| County save / live route | unchanged; no src/ imports from new packs |

All recent merges are pure additions under `support/grok-*`. CI verify green on heads before merge. Browser smoke patterns from #97 (dev + preview clean) inherited.

## What changed in this run

Recent rapid merges of unmounted support packs (all Vision Checklist satisfied, no live engine/save/route touch, SAVE_VERSION 8):

| PR | What | Result |
|---|---|---|
| #97 | Record item inheritance beside the county walk: `support/grok-56-item-inheritance/` persistence contract for Ellis's objects across the fourteen-year return. Distinct definition/instance/source/ownership/storage/placement/restoration/era. Unique/heirloom/quest sources stay consumed (no re-farm on death). Renewable common yields once per era, never heirloom. Years do not tax bread. Unfinished sale aborts. Vanished building returns property to storage unless authored cache. Own contract only; not wired to `preincarnation.save.v1`. 10 tests + demo to year 104. | merged by James at 5e4c072; main advanced past it |
| #95 | Addison County environment art pack (`support/grok-12-environment-art/`) | merged |
| #96 | Lemon Fair loot placement pack | merged |
| #98 | Ash Bend household desk | merged |
| #99 | Addison County overworld cartogram | merged |
| #100 | Persistence pack (does not replace canvas save) | merged |
| #101 | Addison gadget pack (80 practical curios, unmounted bench) | merged at de85584 |
| #102 | White Library, Reservoir, Hayloft, Lantern Court DG05–DG08 | merged at c05c523 |

Vision Checklist for #97 (and siblings): Marble Vein sole plot; death advances ~14 winters as chapter (not loot wipe or run); one person; no romance/party/crafting as core; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION=8 respected; support packs do not break live game. Tests green. Return Ledger deliberately omitted (would cover the Green).

## Durable facts

- Item inheritance contract exists as optional archive (`support/grok-56-item-inheritance/`). Not imported into live walk. Unique sources do not re-farm on death. Common renewables are era-gated and non-heirloom.
- Enemy max HP does not grow with deaths/cycles (#107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (#83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main.
- Node ≥ 22.12 required. Tests by glob (`support/**/*.test.ts`).
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push. Many concurrent support packs landing cleanly.

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

## Open PR ledger (post-#97 batch, ~04:05 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #91, #92, #112, #113, #114, #118, #119, #120 (all stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #87, #88, #89, #93, #105, #106, #108, #110, #115, etc. |
| Live features | #15 weapon compare, #36 item search, #111 picture-and-pad, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Close or rebase the wave of stale STATUS PRs (#81–#120 range); this STATUS records the #97 batch and current tip.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review remaining open support packs for vision alignment. No new conflicts expected with pure-addition pattern.
5. Full CI smoke on main post-batch to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks from #97. Strengthens optional persistence modeling without live impact. QQ-VGEF pillars (live engine fidelity, vision constraints, support readiness) intact. Item inheritance does not unblock specific open PRs but clears one support slot and demonstrates clean beside-the-walk pattern.
