# PREINCARNATION: CEO Status

_Updated 2026-11-05. Main at `06a4bb1` (STATUS rewrite)._

## Health of main (`06a4bb1`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Tests | Game tests green on recent merges. Platform template drift known. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Feel, audio beds, step, hit voices, and coat/glass/stone polish landed (#80, #135–#137).

## Open work

- Stale support-pack PRs (#38 superseded by #83, #42, #49, #59) need rebase or close. Draft STATUS #139.
- James-human decisions: #138 (engine ratify for #134–#137), #133 (kitchen), density mount, and earlier rulings (#62–#70).

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.

## QQ-VGEF Gap Matrix (2026-11-05 audit)

Estimated band: **85–88%**. Vision intact. No second plot.

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core | 50% | 88% | Feel/audio/tell strong. Narrative pacing solid (sole Marble Vein, 14 winters). Gaps: formal latency harness, playtest re-score on first-life to seam. |
| Secondary | 20% | 72% | Comfort/a11y settings present (#130). Gaps: full a11y checklist, reduced-motion completeness, keyboard/pad parity audit. |
| Structural Integrity | 20% | 90% | Tests green, CI stable, no Sev1/2. Gaps: stale PR cleanup, known platform test drift, STATUS freshness. |
| Innovation | 10% | 88% | Reincarnation + sole Marble Vein reinforced (#127, #134). Density unmounted by design. No new systems. |

**Prioritized next actions**

1. Close or rebase stale support PRs (#38/#42/#49/#59). Comment blockers already posted.
2. Bot-ready: latency harness (measure frame time under particle/audio load).
3. Bot-ready: a11y checklist pass (keyboard, contrast, reduced motion, scale).
4. James: ratify #138/#133/density or leave parked.
5. Formal QQ-VGEF re-score after latency + a11y issues land.

Next target: 95%+ once latency, a11y, and PR hygiene close. Do not invent second plots or mount density without James.
