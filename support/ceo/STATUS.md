# PREINCARNATION: CEO Status

_Updated 2026-11-13. Main tip `b8d621e` (STATUS rewrite after #59). No open PRs._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted (james-human). |
| Tests | `npm run test` resolves to `test:game` (covers `src/**/*.test.ts` + `support/**/*.test.{ts,mjs}`). Duplicate `"test"` keys in package.json remain (#142); last wins. |
| Live feel | Hitstop, ground steps, strike voices, marble tell, coat/glass/stone, kitchen-from-pause (mood, not heal), magnify/a11y, PWA shell, theme map all landed. Engine touches approved via explicit merges. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is `/manifest.webmanifest` and `/sw.js`. It does not cache the save.
- Support archives stay beside the walk until the density call.
- No romance, party, hunger, factory, or essential crafting systems.

## QQ-VGEF Audit 2026-11-13

Estimated band: **85–90%** (weighted). Prior (2026-11-12): 85–89%.

| Pillar | Weight | Estimate | Notes / Gaps |
|---|---|---|---|
| Primary Core | 50% | 90% | Core loop, progression, sole-plot, 14-winter chapters, skill cap, non-scaling HP, marble tell, feel (hitstop/steps/voices) solid. Gaps: formal latency/feel harness; deeper live narrative pacing (rich support packs remain unmounted). |
| Secondary | 20% | 75% | Magnify, reduced-motion, high-contrast, audio beds/steps/hits, PWA shell. Gaps: formal a11y checklist; audio coherence pass; remaining UI polish. |
| Structural Integrity | 20% | 90% | Extensive tests, typecheck/build green historically, no open PRs, vision locks enforced (theme.ts, SAVE_VERSION 9). Gaps: #142 package.json duplicate scripts; some stale james-human issues. |
| Innovation | 10% | 88% | Unique one-person reincarnation + sole Marble Vein job. Folded county / Heart not a second plot. Strong theme enforcement. Gaps: density mount decision to deepen without violating constraints. |

**Weighted estimate**: ~87%. Path to 95%+ is polish and decision closure, not new systems.

## Prioritized next actions

1. **Bot-ready**: Resolve #142 (collapse duplicate `"test"` scripts; ensure quarry-creek coverage if intended). Highest structural impact, zero vision risk.
2. **Bot-ready**: Feel/latency probe harness (measure hitstop, step audio, camera, reduced-motion under load). Serves Primary Core.
3. **Bot-ready**: Formal a11y checklist pass (magnify, contrast, reduced motion/flash, keyboard, screen-reader notes). Serves Secondary.
4. **James-human**: Density path call (ops/DENSITY.md). Optional mount of reviewed support pieces only if they keep sole plot and do not alter save.
5. **James-human**: Close or action remaining decision issues (#138, #133, #70, #65–69, etc.) where the live state is already settled or the decision is no longer blocking.
6. **Bot-ready**: Audio coherence audit (beds, steps, hits, talk notes) for consistency under hitstop and reduced-motion.

## Open work

- #142 (bot-ready): package.json test script cleanup.
- #71 (bot-ready, stale): support-pack PRs (many already merged; triage remaining).
- Multiple james-human decision issues (density, kitchen, geo/weather already locked, art direction, etc.).

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge to main. The matrix above is the durable audit record until the next rewrite.
