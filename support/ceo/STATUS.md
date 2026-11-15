# PREINCARNATION: CEO Status

_Updated 2026-11-15. Main tip at `b8d621e` (STATUS rewrite after #59). No open PRs._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted (james-human). |
| Tests | `npm test` = `npm run test:game` (last "test" key wins; #142 open). Known template drift in platform tests. No Sev1/2. |
| CI / Structure | Healthy. Support packs isolated. Live engine touches intentional and previously approved. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate. Sole plot reinforced (#127).
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Feel/audio polish landed (hitstop, ground step, strike voices, coat/glass/stone).
- Comfort/a11y settings present (magnify, high contrast, reduced motion, etc.).

## QQ-VGEF Gap Matrix (2026-11-15)

Estimated band: **86-90%** (Primary Core ~90%, Secondary ~75%, Structural ~90%, Innovation ~88%).

| Pillar | Weight | Score | Notes / Gaps |
|---|---|---|---|
| Primary Core | 50% | ~90% | Live loop strong: sole Marble Vein, 14 winters exact, skill cap, first-life Maeve/shovel/east, tells, feel/audio. Gaps: formal latency/feel harness; live narrative pacing thinner than support archives. |
| Secondary | 20% | ~75% | Comfort/a11y landed (#130/#111). Gaps: formal a11y checklist / audit; additional polish on UI chrome without new systems. |
| Structural Integrity | 20% | ~90% | SAVE_VERSION 9, tests green on game path, no open PRs, vision intact. Gaps: #142 package.json duplicate "test" keys (quarry .js tests dead); known platform template drift. |
| Innovation | 10% | ~88% | Reincarnation as chapter + selective bonds + sole plot strong. Gaps: density mount decision (james-human); further optional agency within constraints. |

Weighted: 0.5×90 + 0.2×75 + 0.2×90 + 0.1×88 ≈ 86.8%.

## Prioritized next actions

1. **Bot-ready**: Collapse duplicate "test" scripts in package.json so all intended coverage runs (close #142). Preserve test:game and platform separation.
2. **Bot-ready**: Formal feel/latency probe harness (desktop + mobile, no horizontal overflow, clean console).
3. **Bot-ready**: Formal a11y checklist against existing comfort settings (pictureScale, highContrast, reducedFlashing, etc.).
4. **James-human**: Density path call (keep unmounted or selective reviewed mount that keeps sole plot / no new core systems / no save change).
5. **James-human**: Remaining decisions (#138, #133, #65, etc.) on prior live touches and optional features.

No vision drift. Density remains unmounted. Support packs isolated.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script.
