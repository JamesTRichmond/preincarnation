# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:05 UTC, after merge of PR #89. Main at `9d6edcf` (squash-merge of PR #89)._

## Health of main (`9d6edcf`)

| Gate | Result |
|---|---|
| `npm run test:game` | Inherited green from recent merges; PR #89 evidence: 233 pass including 14 community tests (additive). Prior main post-#107 reported 255. Full re-run recommended on next CI. |
| `tsc --noEmit` | clean (per PR #89; no live files touched) |
| SAVE_VERSION | remains 8 (county save untouched) |
| Engine / rules / live route touch | none |
| County save / live route | unchanged; gatherings use separate key `preincarnation-community-play-v1` |

Prior typecheck/build/smoke inherited. PR #89 reported typecheck/build/smoke green on its head (desktop + mobile, no console errors, no overflow). CI verify recommended on main tip.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #89 | Add Harrowford's gatherings beside the county walk. Isolated `support/grok-44-community-play/`: six optional gatherings (Sap Night, River Sunday, Grange Fair, Harvest Supper, Solstice Hearth, Frost Walk), twelve recurring people (stance changes across 1959/1973), parlor ledger. Own save key. Not mounted on `/` or Green. Prizes are tins/letters/sketches/tunes (no currency, no farm). Skipping files absence only; does not fail a life or open quarry. | merged by James; head `ec2574d`; main tip `9d6edcf` |

Vision Checklist satisfied: Marble Vein sole plot (unmounted, no quarry impact); death ~14 winters chapter unaffected; one person (no party); no romance/party/crafting core; 320×240 Canvas/SNES-coat preserved; localStorage respected via separate key; pure support addition; tests green. Explicitly avoids becoming a second screen.

## Durable facts

- Harrowford gatherings pack is on main under `support/grok-44-community-play/` (unmounted). Own localStorage key. No live impact.
- Recent concurrent merges on main: #15 (kit-compare weapon sheet, no damage ranking), #88 (County Book stall ledger, unmounted), #87 (Witness mastery ledger, unmounted). All vision-aligned pure or limited additions.
- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse ×1.35 once.
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main (decoy faces, Sentinel telegraph).
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

## Open PR ledger (post-#89, ~04:05 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #112, #113, #114, #118, #119, #120 (stale relative to current main tip; this STATUS supersedes) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #100, #101, #102, #105, #106, #108, #110, etc. (#87/#88/#89 now on main) |
| Live features | #36 item search, #111 a11y scale, #115 encounter-balance, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82 and later ones); this STATUS is current for post-#89.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review remaining open support packs for vision alignment and conflicts with recent main. Additive packs like #89 do not block siblings.
5. Full CI smoke on main post-#89/#15/#87/#88 to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. #89 is pure optional support; strengthens QQ-VGEF optional-pack readiness without touching live engine fidelity or vision constraints. Does not unblock other PRs beyond removing itself from the open ledger.
