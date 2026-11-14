# PREINCARNATION: CEO Status

_Updated 2026-11-14. Main tip `b8d621e` (STATUS rewrite after #59 buried-history merge at 5cf21fb)._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 (kitchen present; migration handles prior versions) |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. localStorage only. No accounts, no live geo/weather. Density path unmounted (ops/DENSITY.md — James call). |
| Tests | `test:game` green (~542+). Known 8 PWA-plugin template failures in `test:platform`. |
| Open PRs | None. |
| Open issues | #142 (bot-ready package.json cleanup), #138/#133/#70 etc. (james-human decisions), #71 (stale support-PR bring-up). |

## Still true

- Enemy max HP does not grow with cycle. Tropoverse ×1.35 once.
- Skill on death caps to remaining non-crown ranks (ceiling 12). No mint past ranks.
- Marble Vein tell (decoy faces, lantern gate) live.
- Install shell (manifest + sw.js) caches shell only; skips save.
- Support packs isolated; no live engine rewrite without explicit approval.
- Theme map enforces sole plot; Heart/second-plot choices removed.

## QQ-VGEF Gap Matrix (2026-11-14 estimate)

| Pillar | Weight | Score | Notes / Gaps |
|---|---|---|---|
| Primary Core (feel, pacing, loop) | 50% | 90% | Combat feel, audio beds/steps/hits, 14-winter exact, skill cap, marble tell, first-life Maeve/shovel/east solid. Gaps: formal latency/feel harness, narrative pacing density (unmounted), minor onboarding polish. |
| Secondary (UI / a11y / comfort) | 20% | 75% | Magnify, comfort/a11y settings, high-contrast, reduced motion, picture/text scale landed. Gaps: formal a11y checklist/audit, deeper keyboard/screen-reader coverage. |
| Structural Integrity | 20% | 92% | Typecheck/build/tests green, save migrations robust, no open PRs, vision intact. Gaps: package.json duplicate `test` keys (#142), residual tech debt. |
| Innovation (reincarnation + Marble Vein) | 10% | 88% | Sole-plot enforcement strong (theme.ts, no second plot). Reincarnation chapter mechanic unique and intact. Gaps: none critical; density call optional. |
| **Weighted band** | | **~86-90%** | Prior 2026-11-12/13 ~85-89%. Stable high-80s. |

## Prioritized next actions

1. **Bot-ready**: Collapse duplicate `test` scripts (#142) — tooling only, restores quarry-creek coverage.
2. **Bot-ready**: Formal feel/latency probe harness (no live engine touch).
3. **Bot-ready**: A11y checklist and audit (comfort settings already present).
4. **James-human**: Density path mount decision (ops/DENSITY.md). Kitchen keep/gate (#133). Engine-touch retrospective (#138).
5. Optional polish: first-life onboarding lines, audio coherence pass (vision-safe).

## Backlog notes

- Support packs remain archives until density or explicit integration approval.
- No vision drift. No second plot.
- Nightly CEO continues to triage; no open PRs to process.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge. Manual expansion here for audit detail.
