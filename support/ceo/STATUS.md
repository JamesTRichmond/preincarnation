# PREINCARNATION: CEO Status

_Updated 2026-11-02T09:24:00-05:00. Main at `06a4bb1` (post-status rewrite after #137)._ 

## Health of main (`06a4bb1`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 (kitchen from pause; export/import local) |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Sole-plot reinforced (#117 theme map, #127/#130 dissonance/Heart removal). |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. Support packs remain beside the walk. |
| Tests | ~500+ game tests green on recent merges (exact count from last CI). No Sev1/2 open. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place (#107).
- Skill on death stops at the ranks that are left (#83). SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax (#78).
- The marble tell keeps the lantern gate. Decoy faces spark/stop; Sentinel gold telegraph 0.6s (#86).
- Feel polish landed: hitstop buffer/lip/knockback (#80), distinct strike voices (#135), ground step audio (#136), coat/glass/stone (#137), second NPC lines that grant nothing (#134).
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save (#116).
- Comfort/a11y settings exist (pictureScale etc. from #130/#111 ports). Kitchen plates are mood, not heal or hunger.
- Support archives stay beside the walk until the density call.

## QQ-VGEF Gap Matrix (estimated 2026-11-02)

Pillars weighted Primary Core 50% / Secondary 20% / Structural Integrity 20% / Innovation 10%.

| Pillar | Est. % | Notes / Gaps |
|---|---|---|
| Primary Core (feel, progression, pacing, agency) | 83 | Strong feel (hitstop, voices, steps, tells, coat). Progression locked (14 winters, skill cap, HP non-scale). Pacing thin until density call. Latency harness still missing. Narrative sole-plot solid. |
| Secondary (UI, a11y, quality-to-length) | 71 | Comfort settings present. Full a11y audit and press-count harness outstanding. Kitchen optional and gated. |
| Structural Integrity (tech debt, tests, stability) | 91 | High test coverage, vision checklist enforced, no open Sev1/2, CI green on merges. Stale open PRs (#38 superseded, #42/#49/#59 conflicted) are process debt only. |
| Innovation (reincarnation + Marble Vein) | 86 | Sole plot enforced by theme.ts + tests. Death-as-chapter unique and locked. No second plot risk remaining. Density unmounted limits expression. |

**Estimated overall band: 81–85%.** Prior audits 72–82%; feel/audio landings moved the needle. Formal re-score still required for 95% claim.

## Open work / Risks

- James-human: #138 (ratify or gate #134–#137 engine touches), #133 (kitchen keep/gate), density mount call, older decisions (#65 art, #62 crafting line, etc.).
- Stale PRs: #38 (close, superseded by #83), #42/#49/#59 (rebase + re-verify or close). #139 draft status update exists.
- Measurement gaps: latency/feel probe harness, formal SCORECARD re-score pass, deep a11y audit.
- No vision drift. Density remains the largest content-expression lever.

## Prioritized next actions

1. Human gates: resolve #138, #133, density (james-human).
2. Close or rebase stale support PRs (#38 close; others after rebase).
3. Bot-ready: latency harness (measure frame-to-input, hitstop feel), formal QQ-VGEF re-score from ops/SCORECARD.md pattern, a11y audit checklist.
4. Optional: selective density mount of reviewed pure-addition packs once James calls.
5. Keep STATUS rewritten on every main tip via write-ceo-status.mjs.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.
