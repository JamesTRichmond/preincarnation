# PREINCARNATION: CEO Status

_Updated 2026-11-20. Main at `b8d621e` (post-#59 + status rewrite)._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| Tests | `test:game` green on last verified tip; package.json still has duplicate `test` keys (#142). |
| Support packs | Isolated under support/grok-*; none mounted into live engine or save. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call (ops/DENSITY.md).

## Open work

Only open PR is draft #143 (STATUS expansion, pure docs). No player-facing pulls conflict with main. Status-only pulls do not change the walk.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge. The sections below are the expanded QQ-VGEF snapshot; the auto-rewrite header is preserved.

## QQ-VGEF Gap Matrix (2026-11-20 audit)

Estimated band: **86–90%** overall.

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core (gameplay feel, narrative pacing, core loop) | 50% | ~90% | Hitstop, strike voices, ground step, first-life line, marble tell, skill cap, kitchen-from-pause all live. Missing formal latency/feel probe harness. |
| Secondary (UI/accessibility, audio polish) | 20% | ~75% | a11y settings present (#111/#130). No formal checklist or multi-viewport smoke. Audio beds and voices exist but lack a single coherence ledger. |
| Structural Integrity (tests, tech debt, stability) | 20% | ~90–92% | Typecheck/build/test:game green. #142 duplicate package.json test keys (last wins; quarry-creek .js never runs). #71 stale (PRs merged). |
| Innovation (reincarnation + sole Marble Vein) | 10% | ~88% | Strong sole-plot enforcement (theme map, Heart second-plot choices removed, density unmounted). Narrative Bible optional. No second plot risk. |

**Prioritized next actions (vision-compliant):**
1. Close or update #142 (collapse duplicate test scripts) — bot-ready, highest structural impact.
2. Feel/latency probe harness (new bot-ready issue).
3. Formal a11y checklist + smoke (new bot-ready issue).
4. Audio coherence ledger (new bot-ready issue).
5. Close stale #71. Density and other james-human decisions remain with James.

## Durable facts

- No vision drift. Marble Vein remains the only plot. One person. Death is a chapter of fourteen winters.
- SAVE_VERSION 9. Kitchen optional and non-hunger. Density unmounted.
- CEO automations active. Auto STATUS rewrite works.
- Open james-human issues (#138, #133, #70–#62) await James decisions; none block current live stability.

This is a pure docs update. No engine, save, or live touch.
