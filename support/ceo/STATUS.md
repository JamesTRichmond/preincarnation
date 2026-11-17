# PREINCARNATION: CEO Status

_Updated 2026-11-16T21:21:00Z. Main at `b8d621e`._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Open PRs | None. |
| Open issues | #142 (bot-ready: package.json test key collapse), #71 (outdated support PR list), #138/#133/#70 etc. (james-human decisions). |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- No vision drift. Sole plot held. One person. No romance/party/core crafting.

## QQ-VGEF estimate (toward 95%+)

Estimated band 86-90% (Primary Core ~90%, Secondary ~75%, Structural ~90%, Innovation ~88%).

Gaps: #142 (test script hygiene so quarry tests run), formal latency/feel harness, a11y checklist, James decisions on density and live touches (#138/#133).

## Open work / prioritized backlog

1. Bot: collapse duplicate `test` keys in package.json (#142) — mechanical, preserves coverage.
2. Bot: latency/feel probe harness (no engine.ts touch).
3. Bot: a11y checklist against existing comfort settings.
4. James: density call, confirm/keep/gate/revert live engine touches from #134–#137, kitchen, etc.

Player-facing pulls that still conflict with main are not in this tip. Status-only pulls do not change the walk.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.
