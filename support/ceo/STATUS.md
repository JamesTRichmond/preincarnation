# PREINCARNATION: CEO Status

_Updated 2026-11-14T21:15:00Z. Main at `b8d621e`._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. Density unmounted. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Tests | `test:game` green (542+). package.json has six duplicate `"test"` keys; last wins so `npm test` = `test:game`. Quarry-creek `.js` tests not in glob. Tracked in #142. |
| Open PRs | None. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Recent merges: #38 (skill residual), #42 (quarry-creek rules isolated), #49 (Otter Creek finds isolated), #59 (buried-history pack isolated).

## Open work / risks

- **#142** (bot-ready): Collapse duplicate `test` scripts in package.json so all listed tests (including quarry-creek `.js`) run under `npm test` / `test:game`. Mechanical tooling only. No engine/save touch.
- **#71** (bot-ready, partially stale): Support-pack PRs listed have since merged or are obsolete; remaining work is the package.json cleanup above.
- James-human decisions still open: #138 (ratify or gate #134–#137 engine audio/feel changes), #133 (county kitchen in engine/save), #70 (winter variance / geo), #69 (localization), #68 (named heirlooms), #67 (core loop/seam), #66 (what carries across death), density mount call.
- QQ-VGEF estimated band 85–89% (Primary Core stronger post-merges, Secondary needs formal feel/a11y/audio probes, Structural solid, Innovation high on sole-plot). Gaps: latency harness, a11y checklist, James decisions, #142 cleanup.

No vision drift. Live engine and save untouched by recent support merges. CEO will not touch engine.ts or save without explicit approval.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merges. Manual refresh for nightly currency.
