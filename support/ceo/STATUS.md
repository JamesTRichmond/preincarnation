# PREINCARNATION: CEO Status

_Updated 2026-11-05T21:14Z (nightly). Main tip `aa4d3cc` (auto-rewrite after #140 at `006f700`)._

## Health of main (`aa4d3cc`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. James call only. |
| QQ-VGEF (provisional) | ~84-87% band (Primary Core ~88%, Secondary ~72%, Structural ~92%, Innovation ~88%). Gaps: latency harness, formal re-score, a11y checklist. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- #140 (auth: remove shared preview client secret) merged; no engine/save/plot touch. Residual edge case noted for James if VITE_AUTH_ENABLED=true without secret.

## Open work / Risks

### James-human decisions (priority)
- **#138**: Ratify, gate, or revert live engine/audio/dialogue changes from #134–#137. No further unapproved engine/save touches.
- **#133**: Keep, gate, or remove county kitchen (live in engine + SAVE_VERSION 9). Removal must preserve v9 compatibility.
- Density mounting: remains James call. Do not mount support packs as core.

### Open PRs (all stale — comments posted 2026-11-05)
- **#38** (capped-purse): Superseded by #83. Base 449c5df. Recommend close. Residual engine/save delta requires approval.
- **#42** (quarry-creek): Support pack. Base 449c5df. Dirty. package.json conflict. Unmounted. Rebase + CI.
- **#49** (waterside finds): Records only. Base 449c5df. Dirty. package.json. Unmounted. Rebase + CI.
- **#59** (buried-history): Isolated pack + unmounted desk. Base f95d345. Dirty. package.json. Rebase + CI.
- **#139** (STATUS refresh): Docs-only. Base 06a4bb1. CI green on head. Tip claim stale; rebase onto aa4d3cc.

No vision drift. Stale PRs risk test-script overwrite if force-merged; do not merge without current-main verification.

## Prioritized backlog (toward QQ-VGEF 95%+)

1. James rulings on #138 / #133 / density (human gates).
2. Close or rebase #38; rebase+verify #42/#49/#59 one-by-one (bot-ready #71 pattern).
3. Latency harness (input-to-pixel probe, no engine rewrite without approval) + formal QQ-VGEF re-score.
4. A11y checklist / comfort audit (magnify, reduced motion already partial from prior). 
5. Audio coherence pass (beds, strikes, steps — already strong; measure consistency).
6. Bot-ready mechanical polish: feel probes, pacing notes, accessibility gaps — without touching engine.ts or save without explicit approval.

## Durable facts
- Main healthy post-#140. Vision intact. SAVE_VERSION 9. Density unmounted.
- Auto STATUS writer (scripts/write-ceo-status.mjs) produces minimal health table; expanded notes live in nightly PRs.
- Support packs remain optional archives until density call.
- No second plot. One person. Death is a chapter. The Marble Vein is the job.

This file is also rewritten by `node scripts/write-ceo-status.mjs` on merge to main. Expanded sections are maintained by CEO nightly passes.
