# PREINCARNATION: CEO Status

_Updated 2026-11-08T02:16:22Z. Main at `2b87ee6` (auto-rewrite after the 2026-11-06 QQ-VGEF audit at `ef7eadb`)._

## Health of main (`2b87ee6`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Intact: Marble Vein is the sole plot. One person. Death is exactly 14 winters. 320×240. No accounts, live geo, or weather. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.

## Open PRs

- **#38:** Superseded by #83; recommend close. Its stale branch still carries obsolete engine/save changes and has no unique delta to rebase.
- **#42:** Stale base (`449c5df`); old `package.json` test configuration conflicts with main's test setup, and its tests need to be discovered by the current glob. Rebase, resolve, and re-verify; keep the support pack unmounted.
- **#49:** Stale base (`449c5df`); preserve main's test configuration and keep the Otter Creek finds as unplaced records. Rebase and re-verify with no live route, engine, or save touch.
- **#59:** Stale base (`f95d345`); preserve main's test configuration and keep the field desk unmounted. Rebase and re-verify before review.
- **#139:** Stale base (`06a4bb1`), dirty/conflicted against this tip. Rebase and re-verify; the status writer replaces this file with a minimal health summary, so the expanded notes need to be reapplied after a rewrite.

All four are stale against `2b87ee6` and remain dirty/conflicted until rebased and re-verified. Precise blockers and required verification are recorded in comments on each PR.

## James-human decisions

- **#138:** Ratify, modify, or revert the live engine changes in #134–#137. No further engine or save changes without approval.
- **#133:** Decide whether to keep, gate, or remove the live county kitchen.
- **Density mounting:** Decide whether any support archive may be mounted; density remains unmounted until then (ops/DENSITY.md).
- **Latency evidence:** Hardware input-to-pixel measurement is unavailable in this runtime; the hardware test remains open.

## QQ-VGEF (2026-11-06 audit)

Estimated band: **~83–88%**, provisional and not a formal re-score. Primary Core is strong on feel/audio; Secondary accessibility is lagging; Structural is high; Innovation is solid.

Open gaps: latency harness, formal re-score, completion of the accessibility checklist, and an audio-coherence audit.

## Prioritized backlog

1. Resolve James-human decisions first: #138, #133, density mounting, and the outstanding latency evidence.
2. Rebase and re-verify stale support PRs #42, #49, #59, and #139; close #38 as superseded by #83.
3. Then address bot-ready feel, latency, accessibility, and audio work. Do not touch `engine.ts` or the save without approval.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.
