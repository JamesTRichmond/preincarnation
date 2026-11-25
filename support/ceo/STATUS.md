# PREINCARNATION: CEO Status

_Updated 2026-11-25. Main tip ~2f47896 (post-#145 STATUS rewrite)._

## Health of main

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted (james-human). |
| Tests | test:game covers src/**/*.test.ts + support packs. package.json has duplicate "test" keys (last wins = test:game); quarry-creek .js tests not in the live path (#142). |
| Open PRs | #146 (draft, pure docs STATUS expansion). No player-facing conflicts. |
| Open issues | #142 bot-ready (package.json). Many #62–#71, #133, #138 james-human decision calls (several resolved by later merges). |

## QQ-VGEF Progress Audit (2026-11-25)

Estimated band: **86–90%**.

| Pillar | Weight | Estimate | Notes / Gaps |
|---|---|---|---|
| Primary Core | 50% | 90–92% | Core loop solid: wake on Green, Maeve first step, shovel by stone, east, die → 14 winters exact, return as self, Marble Vein sole plot, lantern bond, feel (hitstop, ground step, strike voices, coat/glass/stone). Narrative pacing via county voices + optional kitchen. Gaps: formal latency/feel harness, density call. |
| Secondary | 20% | 75–80% | A11y comfort (pictureScale, reduced motion, high contrast, magnify stage), install shell. Gaps: formal a11y checklist, audio coherence ledger, UI polish. |
| Structural Integrity | 20% | 88–90% | Vision checklist enforced, CI verify, SAVE_VERSION 9, support packs isolated. Gaps: #142 package.json duplicates (quarry tests dead), stale issues, STATUS auto-rewrite is minimal. |
| Innovation | 10% | 88–90% | Reincarnation as chapter + selective bonds + sole Marble Vein strongly enforced (theme.ts, #127). No second plot. Gaps: none critical; density remains optional. |

**Overall:** Primary Core and Innovation are strong. Secondary and Structural hold the band below 95%.

## Prioritized next actions

1. Close or update stale james-human issues (#70 winter variance already fixed by #78; #133 kitchen live and optional; etc.).
2. #142: collapse duplicate test scripts in package.json so all coverage runs (preserve test:game + platform + quarry).
3. Bot-ready: formal feel/latency probe harness (no engine change).
4. Bot-ready: a11y checklist + audio coherence ledger.
5. James: density mount decision (ops/DENSITY.md).
6. Merge #146 or this STATUS expansion once CI green.

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- No romance, no party, no core crafting.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge. Expansions live until the next rewrite.
