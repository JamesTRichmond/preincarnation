# PREINCARNATION: CEO Status

_Updated 2026-11-27. Main tip `2f478965b8cd771dee6a15ebd30477bc8d1f1e2a` (STATUS rewrite after #145)._

## Health of main (`2f47896`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| CI / tests | Stable since 2026-11-11 post-#59. No open player-facing PRs. #142 package.json duplicates remain (last `test` wins → quarry .js tests dead). |
| Open PRs | Draft #146 only (STATUS expand). |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Sole-plot enforcement strong (#127, theme.ts, Heart choices removed).

## QQ-VGEF Progress Audit (2026-11-27)

Estimated band: **86–90%** (unchanged; stable main, no new live features since #137).

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core (gameplay feel, narrative pacing, core loop) | 50% | ~90% | Hitstop, knockback, step audio, marble tell, 14-winter exact, skill cap, kitchen-from-pause all live. Missing formal latency/feel probe harness for measurement. Pacing of first-life Maeve/shovel/east solid. |
| Secondary (UI/accessibility, audio, comfort) | 20% | ~75% | Comfort settings (#111/#130), distinct strike voices, ground steps, beds present. No formal a11y checklist or audio coherence ledger. |
| Structural Integrity (tech debt, tests, stability) | 20% | ~90% | Tests green on main, no Sev1/2. #142 duplicate `test` keys in package.json (quarry tests dead). Outdated #71. Auto STATUS rewrite works but resets expansions. |
| Innovation (reincarnation + Marble Vein) | 10% | ~88% | Strong sole-plot constraint, one person, death as chapter, selective bonds. No second plots. Density call still James-human. |

**Overall:** 86–90%. Vision intact. No drift.

## Prioritized next actions to reach 95%+

1. Resolve #142 (collapse duplicate test scripts; preserve all coverage; quarry tests run). Bot-ready.
2. Land formal feel/latency probe harness (new bot-ready issue). Primary Core measurement.
3. Formal a11y checklist + comfort audit (new bot-ready issue). Secondary.
4. Audio coherence ledger (new bot-ready issue). Secondary.
5. Close or update outdated #71 (many listed PRs already merged).
6. James-human decisions: density (ops/DENSITY.md), #138/#133 kitchen/engine residual, #70 winter variance, #62–#69 design calls. These unlock further scoring but are not bot-autonomous.

## Open risks

- #142 leaves some tests undiscovered.
- #71 stale.
- James density / kitchen / residual engine decisions pending.
- Auto STATUS rewrite will reset this expansion until a durable STATUS process is locked.

## Durable facts

- Main tip `2f478965b8cd771dee6a15ebd30477bc8d1f1e2a` since 2026-11-24. No commits since.
- SAVE_VERSION 9. Density unmounted. Support packs isolated.
- CEO automations active. Bifrost pointer (#144) landed; this repo's rules win.
- No vision drift.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge to main. Expansions like this one are temporary until the rewrite is adjusted or a separate durable matrix is kept.
