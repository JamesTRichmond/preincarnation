# PREINCARNATION: CEO Status

_Updated 2026-10-29T21:14:00Z. Main at `e8b7d68`._

## Health of main (`e8b7d68`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Support packs unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Tests | Live suite green on prior merges; pre-existing script failures documented and not introduced by recent tips. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place (#107).
- Skill on death stops at the ranks that are left (#83). SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax (#78).
- The marble tell keeps the lantern gate (#86).
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save (#116).
- Theme map ties every live verb to the sole plot (#117).
- Comfort/a11y, audio beds, first-life line, particle caps, kitchen-from-pause, export/import landed in #130.
- Bag names, grave weapon numbers, magnify (no door mark), satchel desk in #131.
- County second lines, strike voices, ground steps, coat/glass/stone polish in #134–#137.
- Support archives stay beside the walk until the density call.

## Open work (2026-10-29 nightly)

Open PRs (all dirty / stale bases):
- #59 buried-history pack — isolated, vision-aligned; needs rebase.
- #49 waterside finds — isolated; needs rebase.
- #42 quarry-creek rules — large pack; needs rebase + vision reconfirm.
- #38 capped-purse — superseded by #83; close.

James-human issues remain: #138 (engine changes in #134–#137), #133 (kitchen), #65 (art/audio), #64 (second modes), density call, etc.

## QQ-VGEF gap notes (toward 95%+)

Estimated band ~78-82% (Primary Core ~80%, Secondary a11y ~68%, Structural ~90%, Innovation ~80%).

Gaps:
- Formal latency/feel harness and a11y audit (bot-ready candidates).
- Density path decision (james-human).
- Stale support-pack PRs blocking optional archives.
- No new vision drift. Live loop stable; intentional touches approved by James merges.

## Prioritized backlog

1. Close or rebase stale PRs (#38 close; #59/#49/#42 rebase).
2. Bot-ready mechanical polish: feel latency probe, a11y settings audit, audio coherence checks (no engine.ts/save touch without approval).
3. James decisions on open james-human issues.
4. Optional pack integrations only after density call or explicit approval.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.
