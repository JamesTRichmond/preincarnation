# PREINCARNATION: CEO Status

_Updated 2026-11-02T02:14:47.942Z. Main at `06a4bb1` (verified with `git rev-parse`)._

## Health of main (`06a4bb1`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See `ops/DENSITY.md`. Mounting remains James's decision. |
| QQ-VGEF | Estimated band: Strong, based on prior audits of Primary Core feel/audio. This is not a formal re-score; the latency harness and formal re-score remain outstanding. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is `/manifest.webmanifest` and `/sw.js`. It does not cache the save.
- Support archives stay beside the walk; the density path is unmounted pending James's call.
- The Marble Vein remains the only plot; no party, romance, or crafting economy.

## Open work

### James-human decisions

- **#138 — engine ratify:** Decide whether to keep, gate, modify, or revert the engine/audio/dialogue changes merged in #134–#137. No further engine or save behavior changes without an explicit decision.
- **#133 — kitchen:** Decide whether to keep, gate, or remove the live county kitchen. It is mounted in the pause/engine flow and included in v9 saves; removal requires forward-compatible save handling, not a downgrade.
- **Density path:** Decide whether any support archive should be mounted. Until then, it stays unmounted; `ops/DENSITY.md` is not permission to mount.

### Stale/conflicted open PRs

All four PRs are open against old bases and reported dirty/conflicted. Rebase and re-verify before any merge consideration; do not merge stale `package.json` changes over main's test configuration.

- **#38** — Base `449c5df`; its skill-cap intent is already on main via #83. The remaining branch edits `engine.ts`/`save.ts` from a pre-SAVE_VERSION-9 base. Identify a unique needed delta and obtain approval, or close as superseded; do not carry the obsolete version bump forward.
- **#42** — Base `449c5df`; mergeable state is dirty. Quarry-creek support pack is large (+4,105 lines). Its old `package.json` conflicts with main and risks replacing the active test script; preserve main's script, ensure pack tests are discovered, and keep the arena unmounted.
- **#49** — Base `449c5df`; mergeable state is dirty. Old `package.json` test-script hunk conflicts with main; rebase without losing current tests and verify the five Otter Creek finds remain records only, not placed in the county.
- **#59** — Base `f95d345`; mergeable state is dirty. Old `package.json` test-script hunk conflicts with main; rebase with main's script intact, re-verify the pack, and keep its field desk unmounted.

### QQ-VGEF

- Prior audits support a **qualitative Strong band** for Primary Core feel/audio.
- The estimated band is provisional, not a scored release result: input-to-pixel hardware latency is unknown, the latency harness is missing, and a formal re-score is still due.

## Risks

- #138 leaves engine changes in main awaiting James's ratification; do not make further unapproved live engine/save changes.
- The #133 kitchen is already live and persists in SAVE_VERSION 9; any removal must preserve v9 save compatibility.
- Stale PRs can conflict with current code or replace the active `package.json` test command, dropping test coverage. Their prior verification is not current-main verification.
- QQ-VGEF cannot be formally scored until latency measurement and re-score work are complete. Density remains deliberately unmounted.

## Prioritized backlog

1. Get James's ruling on #138 before additional engine/save changes.
2. Get James's decision on the live kitchen in #133, preserving v9 save compatibility.
3. Keep density unmounted until James makes the density call.
4. Rebase and re-verify #38, #42, #49, and #59 one at a time; close #38 if no unique unsuperseded delta remains.
5. Build the latency harness, then perform and record the formal QQ-VGEF re-score.

This file is maintained by `node scripts/write-ceo-status.mjs`; that writer only renders the basic health summary, so this expanded decision and blocker status is recorded manually.
