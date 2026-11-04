# PREINCARNATION: CEO Status

_Updated 2026-11-03T21:12:00Z. Main at `06a4bb1` (STATUS rewrite tip)._

## Health of main (`06a4bb1`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Support packs unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Tests | Historical green on prior tips (e.g. 497+ claimed). No new failures introduced on main. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left (#83). SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax (#78).
- The marble tell keeps the lantern gate (#86).
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save (#116).
- Theme map ties every live verb to the sole plot (#117).
- Comfort/a11y, audio beds, ground step, strike voices, coat/glass/stone landed (#130–#137).
- Support archives stay beside the walk until the density call.

## Open work / risks

- Open PRs: #38 (superseded by #83 — recommend close), #42/#49/#59 (stale bases, dirty, need rebase + verify; tracked in #71), #139 (draft status, may conflict).
- James-human decisions still open: #138 (engine changes in #134–#137), #133 (kitchen), density mount, and earlier authenticity/art/loop calls (#62–#70).
- QQ-VGEF estimated band 84-87% (Primary Core ~88%, Secondary ~72%, Structural ~92%, Innovation ~88%). Gaps: formal latency harness, a11y checklist pass, stale PR cleanup, density call.
- No vision drift. Sole plot, one person, 14 winters exact, no romance/party/core crafting, localStorage, 320×240 preserved.

## Prioritized backlog (toward 95%+)

1. Close or rebase stale support PRs (#71).
2. Mechanical bot-ready: feel/latency probe, audio coherence audit, a11y checklist (no engine.ts/save touch).
3. James decisions on live engine approvals and density.
4. Optional pack integrations only after explicit review.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merges. Manual fuller notes live here until the next rewrite.
