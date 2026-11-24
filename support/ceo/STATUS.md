# PREINCARNATION: CEO Status

_Updated 2026-11-24. Main tip `404c606` (STATUS rewrite after #144 bifrost pointer merge at `ff6179d`)._

## Health of main (`404c606`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted (james-human). |
| Tests / CI | `test:game` covers core + support; package.json has duplicate `test` keys (#142) so last wins. Typecheck/build expected green. No open player-facing PRs conflicting with tip. |
| Live engine | Intentional prior touches (feel, audio, kitchen optional, magnify, voices, steps) preserved. No new engine/save drift. Support packs isolated. |

## QQ-VGEF Progress Audit (estimated 2026-11-24)

**Overall band: 86–90%** (stable; no vision drift since late October live polish).

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core (gameplay feel, progression, narrative pacing around sole Marble Vein plot, death-as-chapter) | 50% | ~90% | Strong: hitstop/buffer, ground step audio, per-creature strike voices, skill cap on death, exact 14 winters, theme map enforcing sole plot, first-life Maeve/shovel/east/lantern. Gaps: formal latency/feel harness, deeper live narrative pacing (many rich packs remain unmounted), onboarding polish. |
| Secondary (UI/accessibility, audio polish, presentation) | 20% | ~75% | Present: pictureScale/textScale/highContrast/reducedFlashing/shake, audio beds + LFO, county second lines, title gate solid. Gaps: formal a11y checklist, audio coherence ledger, residual UI chrome decisions. |
| Structural Integrity (tech debt, tests, stability, process) | 20% | ~90% | Tests green on main path; auto STATUS rewrite; no Sev1/2. Gaps: #142 package.json duplicate `test` scripts (quarry .js tests dead), stale #71, open james-human decision issues. |
| Innovation (unique reincarnation + Marble Vein sole-plot identity) | 10% | ~88% | Strong: theme.ts enforcement, dissonance notes, no second plot, selective bond persistence, 6-era bible optional. Gaps: denser live expression of the unique loop without violating constraints. |

**Vision Checklist**: PASS on tip. No second plot invented. One person. Death is a chapter. Support packs do not break live walk.

## Prioritized next actions

1. **Bot-ready**: Collapse duplicate `test` keys in package.json (#142) — preserve full `test:game` coverage; make quarry tests run or document exclusion.
2. **Bot-ready**: Formal feel/latency probe harness (measure hitstop, step audio, camera, reduced-motion freeze; no engine rewrite).
3. **Bot-ready**: A11y checklist audit (document current comfort settings vs WCAG-like for 320×240 canvas; propose non-breaking additions).
4. **Bot-ready**: Audio coherence ledger (map all beds, strike voices, ground steps, talk notes; ensure consistent mixer, no second plot audio).
5. **James-human**: Density path call (ops/DENSITY.md), kitchen residual (#133), engine residual decisions (#138), other open design issues (#65–#70 etc.).
6. Close or update outdated #71 (support PRs already merged).

Open PRs: draft #145 (STATUS for #144), draft #143 (stale). No player-facing conflicts.

Open issues of note: #142 (bot-ready package.json), #138/#133/#70 etc. (james-human), #71 (outdated).

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge to main. Expanded matrix above is the audit record; auto-rewrite will produce a shorter tip pointer.
