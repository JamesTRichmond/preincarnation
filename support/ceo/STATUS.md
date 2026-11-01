# PREINCARNATION: CEO Status

_Updated 2026-11-01. Main tip `e8b7d68` (STATUS rewrite of prior tip `e53ade5`)._

## Health of main (`e8b7d68`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Tests / CI | Green on recent merges. No Sev1/2. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Recent feel/audio polishes (#134–#137) landed: county second lines (no grants), strike voices, ground steps, coat/glass/stone.

## Open work

Stale open PRs (#38 superseded by #83, #42, #49, #59) remain dirty/conflicting with main. Status-only or support packs do not change the live walk. Human decision issues (#62–#70, #133, #138) block density and some live touches.

## QQ-VGEF Gap Matrix (2026-11-01 audit)

Weighted estimate: **81–84%** (band). Primary Core drives the score.

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core (gameplay feel, narrative pacing, core loop) | 50% | 82% | Audio/feel strong post-#135–137. Missing: formal latency harness for consistent 320×240 feel; winter-by-winter narrative pacing beats (still one person, sole plot); onboarding polish for first-life Maeve/shovel/east. |
| Secondary (UI/accessibility, comfort) | 20% | 70% | #130/#131 comfort/magnify landed. Gaps: formal a11y audit (contrast, reduced-motion, text scale, focus), mobile overflow edge cases. |
| Structural Integrity (tech debt, tests, CI, save) | 20% | 92% | High. SAVE_VERSION 9 stable, tests green, no engine regressions in open set. Stale PR backlog is process debt, not code debt. |
| Innovation (reincarnation + Marble Vein) | 10% | 82% | Sole-plot enforcement strong (#127). Density unmounted limits expression of the unique reincarnation loop. No second plots. |

**Overall:** 0.5×82 + 0.2×70 + 0.2×92 + 0.1×82 ≈ 81.6%. Band 80–84%.

### Prioritized next actions

1. **Bot-ready:** Latency/feel probe harness (measure frame time, hitstop, step audio under load). Files: new scripts/ or support/grok-*/feel-probe; no live engine touch without approval.
2. **Bot-ready:** Incremental a11y pass (audit contrast, high-contrast mode, text scale consistency; document in ops/A11Y.md). Prefer public/ and game-app.tsx; preserve 320×240.
3. **Bot-ready:** Narrative pacing ledger for the fourteen winters (optional chapter beats in support/ or theme.ts lines only; no new rooms, no second plot, no grants).
4. **James-human:** Density call (ops/DENSITY.md) — which reviewed support pieces, if any, may mount without changing save or adding systems.
5. Close or rebase stale PRs #38/#42/#49/#59; #38 is superseded.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merges. Manual audit matrix lives here until the next rewrite.
