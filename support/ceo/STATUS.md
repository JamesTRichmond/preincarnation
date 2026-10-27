# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~03:15 UTC, after merge of PR #103. Main at `841ead0` (squash merge of PR #103)._

## Health of main (`841ead0`)

| Gate | Result |
|---|---|
| `npm test` | **261 pass, 0 fail** (per PR #103 evidence; includes Fourteen Winters suites) |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| browser smoke (dev + prod preview) | exit 0; title, canvas, no errors, no overflow, desktop + mobile |
| SAVE_VERSION | remains 8 |
| Engine / live route / county save touch | none |
| Own save key | `fourteen-winters-keeping-room-v1` (unused until later import) |

Prior health inherited from #90/#94 lineage. CI verify green on the PR head before merge. Lint pre-existing failures only (not in this folder).

## What changed in this run

| PR | What | Result |
|---|---|---|
| #103 | Isolated Fourteen Winters keeping-room ledger under `support/grok-51-collectibles/`: 72 cards, objects, papers, deck law, three landmark hunts, own save key, UI components unmounted. No route, no `src/` import. Ruling #64 holds. | merged by James; main at `841ead0` |

Vision Checklist satisfied: Marble Vein remains the sole plot; death advances ~14 winters as a chapter; one person (no party); no romance/party/crafting systems; 320×240 Canvas and SNES-coat preserved; localStorage and SAVE_VERSION=8 respected (separate key); support pack does not touch live engine, routes, or county save. Tests green. Explicitly not mounted to avoid a second game.

## Durable facts

- Fourteen Winters keeping room is optional support material only. Does not cover the walk. Green stays one person on Canvas 2D. Use this folder for any later import; do not invent a second card list.
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- World-life plate (from #90) remains optional and unmounted.
- Node ≥ 22.12 required. Tests by glob.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
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

## Open PR ledger (post-#103, ~03:15 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #91, #92 (stale; prefer this) |
| Superseded | #38 (skill cap predecessor; close in favor of #83) |
| Support / unmounted | #59 buried-history, #49 waterside, #42 quarry, #87 witness, #88 county-book, #89 gatherings, #95 env-art, #96 lemon-fair, #97 inheritance, #98 household, #99 overworld, #100 persistence, #101 gadgets, #102 dungeons-05-08, #104 ground-tell, #105 ashwick, #106 satchel |
| Live features | #15 kit-compare, #36 item search, #93 bag-and-grave, #107 no-cycle-hp |
| Other | remaining from prior ledger pending rebase |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82, #91, #92); this update is current.
3. Continue bot-ready rebase of remaining PRs (#71-#73); verify vision and tests before merge.
4. Review open support packs for vision alignment (all isolated; none unblocked specifically by #103; later imports should reuse `support/grok-51-collectibles/` for cards).
5. Prioritize live-engine candidates (#107, #93, etc.) once CI green and vision confirmed.
6. Full CI smoke on main post-#103 to confirm no regression.
7. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Keeping room does not affect QQ-VGEF pillars beyond optional support readiness for collectibles. Ruling #64 reinforced.
