# PREINCARNATION: CEO Status

_Updated 2026-11-06T14:17:00Z. Main at `006f700` (post-#140 auth hygiene)._

## Health of main (`006f700`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Recent | #140 (auth: remove shared preview client secret) merged 2026-11-05. Isolated scaffold hygiene. Vision-aligned. No engine/save/plot touch. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Feel polish landed: ground steps, strike voices, coat/glass/stone, second NPC lines, hitstop, magnify comfort.

## Open work

- Player-facing open PRs (#38, #42, #49, #59) are stale/dirty (bases from ~Oct 26). Recommend close or rebase; #38 superseded by #83.
- #139 (STATUS update) open; may need refresh to current tip.
- Status-only pulls do not change the walk.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.

## QQ-VGEF Gap Matrix (2026-11-06 audit)

Estimated band: **83-88%**. Primary Core strong; remaining gaps are measurement, a11y formality, and James decisions (density, stale PR triage). No vision drift.

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core (gameplay feel, narrative pacing, core loop, Marble Vein sole plot) | 50% | 86% | Feel improved (audio beds, steps, voices, coat/glass, second lines, hitstop). Narrative pacing thinner than archives (density unmounted). Latency harness still missing for formal feel score. Sole plot enforced (theme map, dissonance notes). |
| Secondary (UI/accessibility, comfort, onboarding) | 20% | 72% | Magnify, a11y settings (pictureScale etc.), comfort from #130/#131. Formal a11y checklist/audit open. Onboarding solid (first-life Maeve/shovel/east). |
| Structural Integrity (tests, CI, tech debt, stability) | 20% | 91% | Tests green (hundreds pass). CI verify on merges. Known template drift in platform tests. Stale open PRs are process debt. Auth hygiene landed. No Sev1/2. |
| Innovation (reincarnation + Marble Vein unique identity) | 10% | 88% | Strong: sole plot, 14 winters exact, return-as-self, lantern bond, theme lines, no second plots. Optional packs dense but unmounted. |

**Overall:** ~85% (weighted). To 95%+: formal latency/feel harness, a11y audit completion, James density call + selective optional mount if approved, triage/close stale PRs, optional more pacing polish without new systems.

## Prioritized next actions

1. Bot-ready: Latency/feel probe harness (measure hitstop, step audio, input lag on 320×240). Isolated, no live change unless findings require.
2. Bot-ready: A11y checklist completion against live canvas (contrast, scale, reduced motion, keyboard, screen reader notes). Document gaps; no engine touch without approval.
3. James-human: Density mount decision (ops/DENSITY.md). Triage open PRs #38/#42/#49/#59 (close superseded, rebase or abandon).
4. Optional: Narrative pacing review via existing support packs; propose one reviewed integration if density greenlit.

Vision Checklist holds on all current main. No second plots. Death is a chapter. The job continues.
