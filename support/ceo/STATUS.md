# PREINCARNATION: CEO Status

_Updated 2026-11-11. Main tip `b8d621e` (post-#59/#49/#42/#38 merges + STATUS rewrite)._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted (james-human). |
| Tests | `npm run test:game` covers src + support; prior claims 500+ pass. Known pre-existing: 8 grok-pwa-plugin template-drift fails. package.json duplicate `test` keys (last wins to test:game). |
| Open PRs | #139 (docs STATUS, clean but content stale vs current tip; recommend close or rebase). |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate. Sentinel gold telegraph live.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives (including recent #38/#42/#49/#59) stay beside the walk until the density call.
- Comfort/a11y, audio beds, ground steps, per-body hit notes, kitchen-from-pause, export/import, magnify, satchel desk, bag names, grave steel all live and vision-aligned.

## QQ-VGEF Progress Audit (2026-11-11)

Estimated band: **85–90%**. Prior audits 83–88%; recent support merges and stable main advance it modestly. Formal re-score still open.

| Pillar | Weight | Score | Weighted | Notes / Gaps |
|---|---|---|---|---|
| Primary Core (gameplay feel, narrative pacing, core loop) | 50% | 88 | 44.0 | Strong: hitstop/buffer, ground step audio, per-enemy strike voices, coat/glass/stone, skill cap, exact 14 winters, second NPC lines, optional kitchen. Gaps: no latency/feel harness yet; density path unmounted (live thinner than support archives); formal pacing audit. |
| Secondary (UI / accessibility / comfort) | 20% | 78 | 15.6 | Comfort settings (scale, contrast, reduced motion/flash, stick side), magnify stage, PWA shell. Gaps: formal a11y checklist and verification (keyboard, focus, screen-reader notes); no dedicated audit issue closed. |
| Structural Integrity (tests, CI, tech debt) | 20% | 92 | 18.4 | CI verify green on merges; test:game broad; STATUS auto-rewrite. Gaps: duplicate test scripts in package.json; 8 known PWA template fails; #139 stale docs. |
| Innovation (reincarnation + sole Marble Vein) | 10% | 90 | 9.0 | Sole plot enforced (theme map, Heart second-plot offers removed, sphere named as folded county). Selective bonds, chapter death. Strong unique. Gaps: density decision pending (james-human). |
| **Total** | **100%** | | **~87** | Band 85–90%. |

### Prioritized next actions to reach 95%+

1. **Bot-ready**: Latency / feel probe harness (measure hitstop, step audio, camera, reduced-motion freeze; no engine rewrite).
2. **Bot-ready**: Formal a11y checklist + smoke (keyboard nav, focus rings, high-contrast, reduced flashing verification).
3. **James-human**: Density path call (mount selected reviewed packs or keep unmounted).
4. Close or rebase #139 (stale STATUS).
5. Audio coherence pass (beds + hits + steps no clashing).
6. Known test cleanup (package.json scripts, document PWA fails).

## Open work

- #139: docs-only STATUS; content outdated after Nov 11 merges. Clean mergeable; recommend close.
- Density path: ops/DENSITY.md records james-human. Not mounted.
- Prior james-human: #138 engine ratify (if still open), kitchen confirmation, density.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merges. Manual audit matrix above is additive until next auto-rewrite.
