# PREINCARNATION: CEO Status

_Updated 2026-10-28 ~21:30 ET. Main tip at `70b2c2f` (STATUS rewrite after #137 merge at `bb63c3c`)._

## Health of main (`70b2c2f`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Support packs unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Tests / CI | Recent merges green. No Sev1/2. |

## Still true (durable)

- Enemy max HP does not grow with the cycle. Tropoverse ×1.35 once.
- Skill on death stops at remaining non-crown ranks (ceiling 12). Award already paid.
- Death is exactly fourteen winters. No live location/weather tax.
- Marble Vein tell keeps lantern gate. Decoy faces, blade spark, Sentinel gold telegraph.
- Install shell: public/manifest.webmanifest + /sw.js (caches shell/art only, skips /api /auth/save).
- Theme map ties every live verb and relic to the sole plot.
- Audio polish landed: strike voices (#135), ground step (#136), coat/glass/stone timing (#137).
- Comfort/a11y settings in preincarnation.a11y.v1 (pictureScale etc.). Magnify does not mark a door.
- Kitchen is optional pause overlay (SAVE_VERSION 9). No hunger.
- Support archives remain beside the walk. No second plot.

## Open risks & blockers

- Open PRs are all stale and dirty: #42 (quarry creek rules), #49 (Otter Creek finds), #59 (buried-history pack). #38 closed as superseded by #83.
- James-human decisions pending: #138 (keep/gate/revert live engine changes from #134–#137), #133 (kitchen), plus older localization/authenticity/crafting-line calls.
- Formal QQ-VGEF re-score and latency harness still needed for 95%+ band.
- Density path remains unmounted (James call).

## Prioritized backlog (toward QQ-VGEF 95%+)

1. **Live stability & vision fidelity** — resolve #138 human gate on recent audio/feel merges. No further engine.ts/save touch without explicit approval.
2. **Support-pack hygiene** — rebase or close dirty open packs (#42/#49/#59). Keep unmounted.
3. **Mechanical feel/a11y advances** (bot-ready) — latency probe for hitstop/step/strike; a11y comfort coverage audit. Isolated, no live touch.
4. **Secondary pillar** — particle caps, reduced-motion, high-contrast already partial; extend documentation and tests.
5. **Innovation / sole-plot reinforcement** — theme map is strong; continue pure ledger additions only.

Estimated band (prior audit): ~72-76%. Primary feel/progression strong post-#135–#137. Gaps: formal re-score, latency numbers, James decisions, density.

## Open PR ledger (post-nightly)

| Bucket | PRs |
|---|---|
| Closed as superseded | #38 (skill cap already on main via #83) |
| Stale / dirty support | #42, #49, #59 |
| Human gates | #138, #133, #65–#70 |

## Next actions

- Comments posted on open PRs with precise rebase blockers.
- New bot-ready issues proposed for feel latency probe and a11y audit.
- STATUS rewritten to current tip.
- No vision drift. Marble Vein remains the only plot. Death is a chapter. The job continues.

This file may be rewritten by `node scripts/write-ceo-status.mjs` on future merges. Manual nightly update applied for currency.
