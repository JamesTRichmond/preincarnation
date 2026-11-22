# PREINCARNATION: CEO Status

_Updated 2026-11-22. Main tip `b8d621e` (post-#59 buried-history + auto STATUS rewrite). No new commits since 2026-11-11. Vision intact. Density unmounted._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Support packs isolated. |
| Density path | Not mounted. See ops/DENSITY.md. James-human call. |
| Open PRs | #143 draft pure docs STATUS expand only. No player-facing open PRs. |
| Open issues | #142 bot-ready (package.json duplicate test keys). Multiple james-human decision issues (#138, #133, #70, #69–#62). #71 outdated. |

## QQ-VGEF Progress Audit (2026-11-22)

Estimated band: **87–91%** (stable, slight lift from prior 86–90% on confirmed health).

| Pillar | Weight | Estimate | Notes / Gaps |
|---|---|---|---|
| Primary Core (gameplay feel, narrative pacing, core loop, combat, reincarnation chapter) | 50% | 91% | Strong: skill cap live, 14 winters exact, marble tell + lantern gate, hitstop/lip-step/knockback, per-stride ground step audio, distinct hit voices, kitchen-from-pause (mood plates), magnify + comfort, bag names, grave weapon numbers. Gaps: formal latency/feel harness not yet landed; some residual feel polish (hitstop freeze consistency, longer tells) optional. |
| Secondary (UI/accessibility, comfort, a11y, interface) | 20% | 77% | Magnify stage scroll, reduced motion/flashing, high contrast, text/picture scale, stick side in a11y key. Gaps: formal a11y checklist not complete; more comfort surfaces and keyboard/screen-reader verification remaining. |
| Structural Integrity (tests, CI, tech debt, robustness) | 20% | 89% | Tests largely green (game tests pass; known template drift on 8 grok-pwa-plugin). CI verify green on merges. Gaps: #142 package.json has six duplicate "test" script keys (last wins; quarry-creek .js tests never run). Persistence pack pin aligned to SAVE_VERSION 9. No Sev1/2. |
| Innovation (reincarnation + sole Marble Vein, Vermont tone, optional packs, unique systems) | 10% | 90% | Sole plot reinforced (theme.ts map, sphere as folded county, Heart second-plot choices removed). Support packs (overworld, dungeons, loot, merchants, household, gadgets, buried-history, etc.) isolated and vision-aligned. Gaps: density mount decision (james-human); further optional agency without second plot. |

**Weighted estimate**: ~0.50*91 + 0.20*77 + 0.20*89 + 0.10*90 ≈ 87.3% (band 87–91%).

## Prioritized next actions

1. **Bot-ready**: Collapse duplicate "test" keys in package.json (#142). Preserve all previously listed coverage; last-wins currently drops quarry tests.
2. **Bot-ready**: Formal feel/latency probe harness (hitstop, step audio, swing timing) without touching live engine.ts or save.
3. **Bot-ready**: A11y checklist + verification pass (keyboard, contrast, reduced motion, magnify edges) on existing comfort surfaces.
4. **Bot-ready**: Audio coherence ledger (beds, hit voices, step grounds, talk notes) documenting current mixer and suggesting non-breaking polish.
5. **James-human**: Density path call (ops/DENSITY.md). Kitchen keep/gate (#133). Engine touches from #134–#137 confirmation (#138). Remaining decision issues (#70, #65, etc.).
6. Close or update outdated #71 (support PRs already merged).

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Narrative bible remains optional; no second plot imported.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merges. Manual expansion for audits is intentional.
