# PREINCARNATION: CEO Status

_Updated 2026-11-12. Main tip `b8d621e` (post-#59 buried-history + auto-rewrite)._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Open PRs | None. |
| Tests | `npm run test` resolves to `test:game` (last duplicate key wins). Game tests cover live + support. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Recent live feel: hitstop, ground steps, strike voices, county second lines, kitchen-from-pause only, magnify without door mark.

## QQ-VGEF Gap Matrix (2026-11-12 estimate)

| Pillar | Weight | Score | Notes / Gaps |
|---|---|---|---|
| Primary Core | 50% | 90% | Core loop, sole plot, 14 winters, skill cap, non-scaling HP, optional kitchen solid. Gaps: formal latency/feel harness; deeper narrative pacing without new systems. |
| Secondary | 20% | 75% | Audio beds, distinct hits, ground steps, a11y magnify settings present. Gaps: formal a11y checklist; latency probe; residual polish. |
| Structural Integrity | 20% | 88% | Tests green on last-wins script, vision intact, no open PRs, SAVE_VERSION 9. Gaps: #142 package.json duplicate "test" keys (quarry .js never run); stale james-human issues. |
| Innovation | 10% | 85% | Reincarnation-as-chapter + Marble Vein sole plot strongly enforced (theme map, dissonance). Density unmounted by design. |

**Weighted band: 85-89%.** (0.5*90 + 0.2*75 + 0.2*88 + 0.1*85 ≈ 86)

## Prioritized next actions

1. Close #142: collapse duplicate `test` scripts so all coverage (including quarry-creek) runs; last-wins currently hides earlier keys.
2. Bot-ready: formal feel/latency probe harness (desktop + mobile, no engine rewrite).
3. Bot-ready: a11y checklist audit against live comfort settings.
4. James-human: density mount call (ops/DENSITY.md); residual decisions on #138/#133/#70 etc.
5. After 1-3: re-score; target 95%+ once harnesses land and human calls clear residual risk.

## Open work

- #142 (bot-ready): package.json test key collapse.
- #138, #133, #70, #69–#62 (james-human): design/authenticity/carry/kitchen/density-adjacent calls.
- #71 (bot-ready): older support-pack rebase note; many of those PRs have since merged.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge to main. Expanded audit content lives on the improve/ceo-qqvgef-audit-2026-11-12 branch until merged.
