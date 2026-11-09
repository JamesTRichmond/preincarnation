# PREINCARNATION: CEO Status

_Updated 2026-11-09. Main at `2b87ee6` (auto-rewrite after ef7eadb QQ-VGEF audit)._

## Health of main (`2b87ee6`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. Density unmounted (james-human). |
| Tests / CI | Stable; no new merges since Nov 6. Prior verifies green. |
| Open PRs | #141 (draft status refresh), #139 (status), #59/#49/#42/#38 (stale support packs; #38 superseded by #83). |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Live feel/audio polish from #130–#137 landed and stable. Kitchen optional from pause. Comfort/a11y settings present.

## QQ-VGEF Gap Matrix (2026-11-09)

Estimated band: **84-88%** (unchanged from Nov 6; no new live work).

| Pillar | Weight | Score | Notes / Gaps |
|---|---|---|---|
| Primary Core (gameplay feel, progression, narrative pacing, reincarnation loop) | 50% | 86% | Strong: sole plot, 14 winters exact, skill cap, marble tell, step/hit audio, coat/glass/stone. Gaps: latency harness formal, pacing polish in early lives, density mount decision. |
| Secondary (UI/accessibility, presentation, comfort) | 20% | 72% | Comfort settings (#130/#111), magnify, high-contrast, reduced motion. Gaps: formal a11y checklist, screen-reader notes, mobile overflow audit beyond smoke. |
| Structural Integrity (tech debt, tests, robustness, vision fidelity) | 20% | 92% | Vision checklist enforced. Tests green. Auth secret removed (#140). Stale PRs and open james-human decisions remain process debt. |
| Innovation (Marble Vein uniqueness, reincarnation depth, Vermont specificity) | 10% | 88% | Sole-plot reinforcement strong. Support packs rich but unmounted. Gaps: density call, Vermont authenticity decisions (#68), optional agency without second systems. |

**Overall estimated: 84-88%.** To 95%+: formal latency probe + a11y audit, James density/kitchen/feel decisions, close or rebase stale PRs, one more feel pass if approved.

## Prioritized next actions

1. Bot-ready: latency feel probe (input-to-draw, hitstop, step audio under load).
2. Bot-ready: a11y checklist against live comfort settings.
3. James: density mount decision (ops/DENSITY.md), kitchen keep/gate (#133), live engine polish approval (#138).
4. Triage/close superseded #38; rebase or close stale #42/#49/#59 if no longer desired.
5. After decisions: formal re-score and STATUS rewrite.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge. Manual audits like this record the gap matrix until the next auto-rewrite.
