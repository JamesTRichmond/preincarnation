# PREINCARNATION: CEO Status

_Updated 2026-11-04. Main tip `06a4bb1` (STATUS rewrite after prior audit commit `6b91db3`). No new code merges since #137 (2026-10-27)._

## Health of main (`06a4bb1`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Tests / CI | Green on recent merges. No Sev1/2. Vision Checklist intact. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Recent feel/audio polishes (#134–#137) landed: county second lines (no grants), strike voices, ground steps, coat/glass/stone.
- Sole-plot enforcement strong (#127).

## Open work

Stale open PRs (#38 superseded by #83 already on main, #42, #49, #59) remain dirty/conflicting with current main. Draft #139 is a status refresh. Status-only or support packs do not change the live walk. Human decision issues (#62–#70, #133 kitchen, #138 engine ratify) block density and some live touches.

## QQ-VGEF Gap Matrix (2026-11-04 audit)

Weighted estimate: **82–85%** (band). Primary Core drives the score. No regressions since prior audit; feel/audio remain strong.

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core (gameplay feel, narrative pacing, core loop) | 50% | 83% | Audio/feel strong post-#135–137 (strike voices, ground steps, coat, glass, stone). Core loop (walk, die 14 winters, return as self, Marble Vein sole plot) solid. Gaps: formal latency harness for consistent 320×240 feel under load; winter-by-winter narrative pacing beats (optional chapter ledger; still one person, sole plot, no grants); first-life onboarding polish (Maeve/shovel/east). |
| Secondary (UI/accessibility, comfort) | 20% | 72% | Comfort/magnify from #130/#131 landed. Gaps: formal a11y audit (contrast, high-contrast, reduced-motion, text scale consistency, focus); mobile overflow edge cases. |
| Structural Integrity (tech debt, tests, CI, save) | 20% | 93% | High. SAVE_VERSION 9 stable, tests green, no engine regressions in open set. Stale PR backlog is process debt, not code debt. No Sev1/2. |
| Innovation (reincarnation + Marble Vein) | 10% | 83% | Sole-plot enforcement strong. Density unmounted limits fuller expression of the unique reincarnation loop (optional, James call). No second plots. |

**Overall:** 0.5×83 + 0.2×72 + 0.2×93 + 0.1×83 ≈ 82.7%. Band 82–85%.

### Prioritized next actions

1. **Bot-ready:** Latency/feel probe harness (measure frame time, hitstop, step audio under load). New scripts/ or support/grok-*/feel-probe; no live engine touch without approval.
2. **Bot-ready:** Incremental a11y pass (audit contrast, high-contrast mode, text scale consistency; document in ops/A11Y.md). Prefer public/ and game-app.tsx; preserve 320×240.
3. **Bot-ready:** Narrative pacing ledger for the fourteen winters (optional chapter beats in support/ or theme.ts lines only; no new rooms, no second plot, no grants).
4. **James-human:** Density call (ops/DENSITY.md) — which reviewed support pieces, if any, may mount without changing save or adding systems. Also #133 kitchen and #138 engine ratify.
5. Close or rebase stale PRs #38/#42/#49/#59; #38 is superseded by #83.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merges. Manual audit matrix lives here until the next rewrite.
