# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:05 UTC, after merge of PR #95. Main at `1f8eb3b` (merge of PR #95)._

## Health of main (`1f8eb3b`)

| Gate | Result |
|---|---|
| `npm run test:game` | **255 pass, 0 fail** (per PR #95 body; includes 3 new pack tests) |
| `tsc --noEmit` / typecheck | clean (per PR #95) |
| `npm run build` | exit 0 (per PR #95) |
| browser smoke | clean on desktop + mobile, dev and production (per PR #95) |
| SAVE_VERSION | remains 8 |
| Engine / tileset / maps / live route | unchanged |
| Support pack impact | pure addition under `support/grok-12-environment-art/` |

Prior health from #107 inherited. CI verify green on head before James merge. No live regression.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #95 | Addison County environment art pack: original 16px tiles (297 shared ground/architecture, 12 district sets ≥24 each, 60 props, 8 interiors, 6 era sheets, 12 day/night scenes). Metadata for collision, walk masks, atlas coords. Source Python baker + pack.test.ts. Isolated; sandbox explorer not imported. Live Green still uses existing tileset. | merged by James; head `6e9cd2f`; main tip `1f8eb3b` |

Vision Checklist satisfied: Marble Vein sole plot (art only; no second plot or imported sandbox); death ~14 winters chapter unchanged; one person; no romance/party/crafting; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION=8 respected; support pack does not break live game (no shared files touched). Tests green. Optional archive ready for future intentional integration.

## Durable facts

- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main (decoy faces, Sentinel telegraph).
- Environment art library now on main under support/grok-12-environment-art/ (not loaded by live walk).
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

## Open PR ledger (post-#95, ~04:05 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #91, #92, #112–#114, #118–#120 (stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #87, #88, #89, #96–#102, #105, #106, #108, #110, etc. |
| Live features | #15 weapon compare (merged? check), #36 item search, #111 picture-and-pad (engine touch), remaining |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs; this STATUS is current for #95.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review open support packs for vision alignment. #95 art pack is now available as optional reference; no automatic integration.
5. Full CI smoke on main post-#95 to confirm no regression (expected clean).
6. Repo hygiene: large artifacts/screenshots still inflate .git; art pack adds many PNGs under support/.

No new risks. Pure optional support addition. QQ-VGEF pillars (live engine fidelity, vision constraints, optional pack isolation) preserved; strengthens environment-art readiness without live impact.
