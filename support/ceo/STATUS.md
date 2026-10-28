# PREINCARNATION: CEO Status

_Updated 2026-10-28T13:15:00Z. Main at `70b2c2f` (post-#137). Prior tip `bb63c3c` (#137)._

## Health of main (`70b2c2f`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Tests | ~528 pass (per recent evidence). No open Sev1/2. |
| Open PRs | Stale support packs only (#38 superseded, #42/#49/#59). No live engine conflicts pending. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Theme map enforces sole plot (ops/THEME.md + theme.test.ts). Heart second-plot choices removed.

## QQ-VGEF Gap Matrix (2026-10-28 audit)

Framework: Primary Core (P1, 50%), Secondary (P2, 20%), Structural Integrity (base ~20%, defects 0), Innovation (P4, 10%). Vanguard floor 95.0 / Release 98.0. Scores held at 0 pending formal QA re-measure (builder does not self-score). Estimated current band: **70-78%** (strong structural + landed feel/theme/audio evidence; human gates and unscored items hold the rest).

| Pillar | Weight | Est. Progress | Key Landed | Gaps |
|---|---|---|---|---|
| Primary Core (P1) | 50% | ~75% | Feel (hitstop #80, strike voices #135, ground step #136, lunges/sip/grave #137), progression (skill cap #83, no HP sponge #107), marble tell #86, first-life line | Formal input-to-pixel latency harness (P1A-1, hardware); full synergy/agency scoring; live narrative pacing polish without new systems |
| Secondary (P2) | 20% | ~65% | Comfort/a11y settings #130/#111 (scale, contrast, reduced motion), pause bag, kitchen-from-pause only | Full a11y audit + screen-reader paths; art direction decisions (james-human #65: pixel vs photo, WAV vs synth); menu navigation scoring |
| Structural Integrity | 20% | ~90% | Tests green, no Sev1/2, SAVE_VERSION 9 migrations, vision checklist on all merges, PWA shell #116 | Ratify or gate recent live engine touches (#133 kitchen, #138 #134-137 audio/dialogue/lunge); close/rebase stale open PRs |
| Innovation (P4) | 10% | ~80% | Sole-plot enforcement (theme map #117, dissonance #127, no second Heart choices), reincarnation as chapter (14 winters exact) | Genre benchmarking set (5 contemporaries); formal thematic cohesion score; optional support pack density call |

**Overall estimated: 72-76%.** Points to vanguard (~95%): formal re-score of P1A-2/P1A-5/P4-3 from evidence; resolve 4-5 james-human decisions; 2-3 vision-safe polish passes (feel polish, a11y, latency probe).

## Prioritized next actions

1. **James decisions (blockers):** #138 (ratify/keep/revert #134-137), #133 (kitchen), #65 (art/audio), #66 (what persists), density path.
2. **Bot-ready polish:** Input latency harness (non-hardware probe first); extend feel tests for step/voice consistency; a11y contrast/scale smoke; theme-map regression guard.
3. **Hygiene:** Rebase or close stale #38/#42/#49/#59 (package.json no longer needed); STATUS auto-rewrite preserves this matrix until next cycle.
4. **No second plots.** All work stays one person / Marble Vein / 14 winters / 320×240.

## Open work

Player-facing pulls that still conflict with main are not in this tip. Status-only pulls do not change the walk.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge. The QQ-VGEF matrix above is the audit record; re-apply or extend on next cycle.
