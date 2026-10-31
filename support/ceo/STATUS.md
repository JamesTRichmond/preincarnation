# PREINCARNATION: CEO Status

_Updated 2026-10-31T13:19:00Z. Main at `e8b7d68`._

## Health of main (`e8b7d68`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Tests | Globs under test:game; recent merges claimed green (feel/audio/coat passes). |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Recent feel/audio landings (#130–#137): hit voices, ground steps, coat tighten, glass clink, first-stone lines, bag/grave/magnify/satchel, kitchen optional, comfort/a11y, title gate cover. No second plot.

## QQ-VGEF Progress Audit (2026-10-31)

Estimated band: **82–86%** (up from 78–82% on 2026-10-29).

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core | 50% | 84% | Feel/audio/tell strong post-#135–#137. Narrative pacing around Vein/seams solid. Remaining: formal latency/probe harness, onboarding clarity for first-life Maeve/shovel/east, density unmounted. |
| Secondary | 20% | 72% | Comfort/a11y landed (#130). Magnify, bag, satchel desk, kitchen. Gaps: full a11y audit, reduced-motion completeness, UI chrome polish for 320×240 consistency. |
| Structural Integrity | 20% | 92% | Tests green on recent merges. CI verify pattern holds. Stale open PRs (#38 superseded, #42/#49/#59 dirty). No Sev1/2. Tech debt: persistence pack pin observation only; STATUS rewrite script lag. |
| Innovation | 10% | 85% | Reincarnation + sole Marble Vein strongly enforced (theme.ts, #127 fold, no Heart second-plot). County voices, ground answer, body notes. Remaining: optional agency depth without second plot; James density call. |

**Weighted estimate ≈ 84%.** Path to 95%+ requires closing latency harness, a11y completeness, stale PR hygiene, and James decisions on density/kitchen/engine touches without vision drift.

## Open work

- Stale PRs: #38 (superseded by #83), #42, #49, #59 — rebase or close.
- James-human: #138 (engine #134–#137), #133 (kitchen), density, art/audio direction, carry-across-death, etc.
- Bot-ready: #71 (bring support PRs to main, mechanical).

Player-facing pulls that still conflict with main are not in this tip. Status-only pulls do not change the walk.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.

## Prioritized next actions

1. Latency/feel probe harness (bot-ready) — measure hitstop, step, audio without engine rewrite.
2. A11y completeness pass (bot-ready) — reduced-motion, high-contrast, text scale coverage.
3. Stale PR hygiene (bot-ready or close).
4. James: density mount decision, kitchen keep/gate, #138 engine confirmation.
