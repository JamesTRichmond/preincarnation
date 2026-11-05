# PREINCARNATION: CEO Status

_Updated 2026-11-04T21:15:00Z. Main at `06a4bb1` (STATUS rewrite of prior tip 6b91db3)._

## Health of main (`06a4bb1`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Sole plot enforced. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Tests | Prior claims 497+ pass on recent merges; no Sev1/2. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place (#107).
- Skill on death stops at the ranks that are left (#83). SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax (#78).
- The marble tell keeps the lantern gate (#86).
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save (#116).
- Theme map ties every live verb to the Marble Vein (#117).
- Comfort/a11y, audio beds, ground-step, strike voices, coat/glass/stone landed (#130–#137).
- Support archives stay beside the walk until the density call.
- No vision drift. No second plot.

## Open work / Risks

- Open PRs all stale/dirty: #38 (superseded by #83, recommend close), #42/#49/#59 (rebase + re-verify required; isolated packs), #139 (draft STATUS refresh, base current, checks pending).
- James-human decisions pending: #138 (ratify engine touches #134–#137), #133 (kitchen), density mounting, others (#65 art, #62 crafting line, etc.).
- QQ-VGEF estimated band ~84-87% (Primary Core feel/audio strong ~88%, Secondary a11y ~72%, Structural ~92%, Innovation sole-plot ~88%). Gaps: latency harness, formal re-score, a11y checklist depth.
- No live engine/save touches without explicit approval.

## Prioritized backlog

1. Human decisions (#138, #133, density) to unlock or confirm live state.
2. Rebase and close/supersede stale support PRs (#38 close; #42/#49/#59 rebase).
3. Bot-ready mechanical: latency probe harness (no engine change), a11y comfort audit checklist, audio coherence notes (beds already live).
4. Optional support pack integrations only after density call or explicit approval.
5. Formal QQ-VGEF re-score once harness and decisions land.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merges. Manual update for nightly currency.
