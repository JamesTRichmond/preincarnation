# PREINCARNATION: CEO Status

_Updated 2026-11-13T21:14:00Z. Main at `b8d621e`._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Open PRs | None. |
| Open issues | 13 (mostly james-human decisions; #142 bot-ready package.json test collapse). |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Recent merges (#38 skill residual, #42 quarry, #49 Otter Creek, #59 buried-history) are isolated or vision-aligned; no engine drift.

## Open risks / backlog

- **#142** (bot-ready): Collapse duplicate `test` scripts in package.json so quarry-creek tests run. Last-wins currently drops them.
- **#138, #133, #70, #69, #68, #67, #66, #65, #64, #63, #62** (james-human): Design/vibe/authenticity decisions on engine touches, kitchen, winters, localization, art, second modes, food, crafting line. Do not touch engine.ts or save without explicit approval.
- **#71** (bot-ready): Bring remaining support-pack PRs up to main if still relevant (many already merged).
- QQ-VGEF estimated 85-89% (Primary Core ~90%, Secondary ~75% a11y/feel probes still needed, Structural ~88%, Innovation ~85%). Gaps: formal latency harness, a11y checklist, James decisions, package.json hygiene.

## Prioritized next

1. Resolve #142 (mechanical, no engine/save).
2. Create bot-ready issues for feel-latency probe, a11y checklist, audio coherence audit (mechanical, no engine touch).
3. Await James on density and james-human issues.
4. Keep support packs isolated.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merges. Manual nightly refresh recorded here.
