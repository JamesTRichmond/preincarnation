# PREINCARNATION: CEO Status

_Updated 2026-10-27T21:20:00Z (nightly). Main tip `70b2c2f` (STATUS rewrite after #137 merge at `bb63c3c`)._

## Health of main (`70b2c2f`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. localStorage only. No accounts, no live geo/weather tax. |
| Density path | Unmounted. See ops/DENSITY.md. James-human call. |
| Recent live polish | #137 coat/glass/stone (diagonal lunge 9px, full-glass clink, first-stone lines, high-tier spawn cut until steel); #136 ground-step audio; #135 strike voices; #134 second NPC lines (grants nothing). All vision-aligned. |

## Still true

- Enemy max HP does not grow with cycle (#107). Tropoverse ×1.35 once.
- Skill on death caps to remaining non-crown ranks (#83). SAVE_VERSION 9.
- Death locked at exactly 14 winters (#78). No live location or weather fetch.
- Marble Vein tell keeps lantern gate (#86).
- Install shell: /manifest.webmanifest + /sw.js caches shell/art only; skips /api /auth/save (#116).
- Theme map ties every live verb + relic to the sole plot (#117, #127 fold line).
- Support packs remain isolated archives until explicit density/integration approval.

## Open work

Open PRs (all stale, conflicted with current main):
- #38 (capped-purse): **superseded by #83**. Close recommended.
- #42 (quarry-creek rules): isolated support; needs rebase + .mjs rename (see #71).
- #49 (waterside demo finds): isolated catalog; needs rebase.
- #59 (buried-history loot): isolated support/grok-70; needs rebase, keep unmounted.

Open issues: mostly james-human design calls (#62–#70, #133 kitchen). Bot-ready #71 for bringing old support PRs current.

## QQ-VGEF gap notes (toward 95%+)

Pillars: live loop feel, pacing, a11y, audio coherence, onboarding, performance, robustness, optional agency.
Recent merges advanced audio (#135/#136), feel (#80/#137), a11y foundations, theme fidelity. Remaining: density decision (James), more mechanical feel/pacing passes without engine/save touch, support-pack hygiene, and continued test/smoke green.

## Durable facts

- Main tip `70b2c2f`. #137 merged `bb63c3c` / head `bc263a1`.
- SAVE_VERSION 9. No vision drift detected.
- Auto STATUS rewriter runs on merge; this nightly pass records the post-#137 state and open blockers.
