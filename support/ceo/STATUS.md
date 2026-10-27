# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~03:10 UTC, after merge of PR #90. Main at `b2d93df` (squash merge of PR #90)._

## Health of main (`b2d93df`)

| Gate | Result |
|---|---|
| `npm test` | **234 pass, 0 fail** (per PR #90 evidence; world-life tests 68–82) |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| browser smoke (dev + prod preview) | exit 0; title, canvas, no errors, no overflow |
| SAVE_VERSION | remains 8 |
| Engine / live route / county save touch | none |
| Own save key | `preincarnation-world-life-v1` unused until import |

Prior health inherited. CI verify green on the PR head before merge.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #90 | Isolated world-life plate under `support/grok-24-world-life/`: three Addison hubs (Middlebury mill street, the intervale, Otter landing) with deterministic routines, activities, quest overrides, era/lineage substitution, safe fallbacks. Unmounted demo. Own save key unused. Not a hunger/job/weather/economy sim. | merged by James; main at `b2d93df` |

Vision Checklist satisfied: Marble Vein remains the sole plot; death advances ~14 winters as a chapter; one person (no party); no romance/party/crafting systems; 320×240 Canvas and SNES-coat preserved; localStorage and SAVE_VERSION=8 respected; support pack does not touch live engine, routes, or county save. Tests green. Explicitly not mounted on `/` to avoid replacing the Green.

## Durable facts

- World-life plate is optional support material only. Does not cover the walk. Green stays one person on Canvas 2D.
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
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

## Open PR ledger (post-#90, ~03:10 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81 (after #80), #82 (after #76) |
| Superseded | #38 (skill cap predecessor; close in favor of #83) |
| Support / unmounted | #59 buried-history, #49 waterside finds, #42 quarry rules, #52 marble tell, #87 witness-mastery, #88 county-book, #89 community-gatherings |
| Live features | #15 weapon compare, #36 item search, #86 marble tell (engine touch) |
| Other | remaining from prior ledger pending rebase |

## Next priorities

1. Close #38 as superseded by #83 (same intent, landed).
2. Rebase or close stale STATUS PRs #81 and #82; prefer this update as the current STATUS.
3. Continue bot-ready rebase of remaining PRs (#71-#73); verify vision and tests before merge.
4. Review open support packs (#59, #87, #88, #89, etc.) for vision alignment; none unblocked by #90 specifically (isolated pack, no file overlap).
5. #86 (Marble Vein tell, live engine) remains a candidate once CI green and vision confirmed; do not treat world-life as that tell.
6. Full CI smoke on main post-#90 to confirm no regression.
7. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. World-life does not affect QQ-VGEF pillars beyond optional support readiness.
