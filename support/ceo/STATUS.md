# PREINCARNATION: CEO Status

_Updated 2026-11-28. Main tip at `2f478965b8cd771dee6a15ebd30477bc8d1f1e2a` (STATUS rewrite post-#145)._

## Health of main (`2f478965`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Open PRs | #146 (draft, pure docs STATUS expansion; base matches tip). |
| Tests | test:game green (~542+). package.json has six duplicate "test" keys (#142); last wins so quarry-creek .js tests not auto-run. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Bifrost pointer landed (#144). This repo's rules win.
- Auto STATUS rewrite runs on merge and resets expansions to minimal header.

## Open work

Player-facing pulls that still conflict with main are not in this tip. Status-only pulls do not change the walk.

## QQ-VGEF Progress Audit (2026-11-28)

Estimated band: **86-90%** (weighted). No vision drift. Density unmounted. Support packs isolated.

| Pillar | Weight | Score | Notes / Gaps |
|---|---|---|---|
| Primary Core | 50% | ~90% | Sole plot (Marble Vein), one person, exact 14 winters, skill cap, non-scaling HP, tell + lantern gate, feel polish (steps, hits, hitstop, magnify, kitchen-from-pause), first-life line. Gaps: formal feel/latency probe harness, narrative pacing audit. |
| Secondary | 20% | ~75% | Comfort/a11y settings (scale, contrast, reduced motion, stick side), audio beds, second NPC lines (no grants). Gaps: formal a11y checklist, full audio coherence ledger. |
| Structural Integrity | 20% | ~90% | CI verify green on merges, tests pass, SAVE_VERSION 9 stable, no Sev1/2. Gaps: #142 package.json duplicate test keys (quarry .js not discovered), #71 outdated. |
| Innovation | 10% | ~88% | Reincarnation as chapter (return as self, selective bonds), folded county (not second plot), optional era bible, sole-plot enforcement in theme.ts. Gaps: deeper unique Marble Vein interactions beyond current tell. |

**Weighted estimate**: 0.5×90 + 0.2×75 + 0.2×90 + 0.1×88 = **86.8%**.

## Prioritized next actions (to 95%+)

1. **#142** (bot-ready, highest): Collapse six duplicate "test" scripts in package.json; ensure quarry-creek .js tests run under npm test / test:game. Pure tooling. No live touch.
2. Feel/latency probe harness (bot-ready): Instrument frame times, input lag, hitstop consistency on 320×240 canvas. Document baselines. Vision-compliant polish.
3. Formal a11y checklist (bot-ready): Audit pictureScale, highContrast, reducedFlashing, stickSide, keyboard/gamepad, screen-reader notes. Land remaining gaps without door-mark or second plot.
4. Audio coherence ledger (bot-ready): Catalog step/hit/bed/talk voices; ensure L/R offset, freeze on hitstop, no accidental second-plot cues.
5. Close or update #71 (outdated; referenced PRs merged). James-human decisions (#138, #133, density, #70, #65 etc.) remain open for human call.
6. Mark #146 ready or supersede with this expansion; auto-rewrite will reset on merge.

## Open risks

- package.json test key duplication hides coverage and creates merge conflicts.
- Lack of formal feel/latency and a11y probes leaves Secondary and Primary polish unmeasured.
- Density path remains unmounted pending James.
- Auto STATUS rewrite resets detailed expansions; durable facts live in issues and this audit.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.
