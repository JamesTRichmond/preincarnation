# PREINCARNATION: CEO Status

_Updated 2026-11-06 ~21:15 ET. Main at `2b87ee6` (auto-rewrite after `ef7eadb` QQ-VGEF audit on post-#140 `006f700`)._

## Health of main (`2b87ee6`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Tests / CI | Prior cycles green (game tests pass; platform known pre-existing). Verify on tip as needed. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left (#83). SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax (#78).
- The marble tell keeps the lantern gate (#86).
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save (#116).
- Support archives stay beside the walk until the density call.
- Auth preview secret removed from source (#140).

## Open work / PR triage (2026-11-06)

All open PRs held. None mergeable without rebase and re-verification.

| PR | Title | Status | Blockers |
|---|---|---|---|
| #139 | Update CEO status... | Open (Copilot) | Base `06a4bb1` stale (tip `2b87ee6`). Auto-writer overwrites expanded notes. Prefer CEO branch. |
| #59 | buried-history loot pack | Open | Base `f95d345` stale. Conflicts expected. Rebase, take main package.json, re-verify. Unmounted. |
| #49 | Otter Creek finds | Open | Base `449c5df` stale. Same. Isolated. |
| #42 | quarry creek rules | Open | Base `449c5df` stale. Tests discovery + body. Isolated. |
| #38 | Stop death minting skill | Open | **Superseded by merged #83**. Close. |

Comments posted with precise blockers. No merges this cycle.

## James-human decisions still open

- #138: Ratify or revert live engine changes in #134–#137 (audio, dialogue, lunge/sip/grave/spawn).
- #133: Keep/gate/remove county kitchen (live in engine + SAVE_VERSION 9).
- Density path: mount reviewed support pieces or keep beside the walk (ops/DENSITY.md).
- #70: 14–18 winter variance + real geo/weather fetch (intentional?).
- Others: localization (#69), Vermont authenticity (#68), core loop/seam (#67), what carries across death (#66), art/audio direction (#65), second modes (#64).

## QQ-VGEF progress notes (provisional, ~83-88%)

From prior audits (2026-11-06 tip 006f700, estimated band 83-88%):
- Primary Core ~86% (feel, audio, tell, progression strong post-#130–#137).
- Secondary ~72% (a11y comfort, latency harness missing).
- Structural ~91% (tests green, no Sev1/2).
- Innovation ~88% (sole-plot strong).

Gaps: latency harness, formal re-score, a11y checklist, James decisions on #138/#133/density, stale PR triage.

No vision drift. Density unmounted. SAVE_VERSION 9. Live engine touches from approved or prior merges intact.

## Prioritized backlog

1. James decisions (#138, #133, density) — blocks further live polish.
2. Rebase and close/supersede stale PRs (#38 close; #42/#49/#59 rebase per #71).
3. Bot-ready mechanical: latency probe harness (no engine touch), a11y checklist audit, audio coherence review.
4. Formal QQ-VGEF re-score once harness and decisions land.

This file may be rewritten by `node scripts/write-ceo-status.mjs` on next main merge. Expanded notes here are for the durable record; prefer ops/ notes for permanence.
