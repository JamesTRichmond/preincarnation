# PREINCARNATION: CEO Status

_Updated 2026-11-24T17:04:00.670Z. Main at `8122a6f`._

## Health of main (`8122a6f`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.

## Open work

Player-facing pulls that still conflict with main are not in this tip. Status-only pulls do not change the walk.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.

## What changed

PR #145 expanded STATUS with details of the #144 Bifrost pointer. It was pure documentation, with no engine, save, route, or live-system changes.

## Health

- SAVE_VERSION remains 9. The vision is intact: Marble Vein is the sole plot, there is one person, death is exactly fourteen winters, there is no party, romance, or crafting, and 320×240 is preserved.
- Density remains unmounted; see `ops/DENSITY.md` for James's decision. Support packs remain isolated.

## Verification

- PR #145 was docs-only; CI is expected to be green, with no test impact expected.
- The automatic STATUS rewrite ran after the merge, resetting the expansion to the minimal template.

## QQ-VGEF

The estimated band is unchanged at 86–90%: Primary Core ~90%, Secondary ~75%, Structural ~92%, and Innovation ~88%. Gaps are unchanged: #142 package.json duplicates (bot-ready), the feel/latency harness, the a11y checklist, the audio coherence ledger, and James's density/#138/#133 decisions.

## Open risks

Risks are unchanged: #142's duplicate test scripts leave the quarry-creek `.js` tests undiscovered, #71 is stale, and James's density and #138/#133/#62–#70 decisions remain pending. At this snapshot, no other PRs are open; the previous #143 is closed.

## Prioritized backlog

1. #142 package.json cleanup (bot-ready).
2. Feel/latency probe.
3. A11y checklist.
4. Audio coherence ledger.
5. James-human decisions on density, #138, #133, #70, and related work.

## Durable facts

- The Bifrost pointer landed in #144; this repository's own rules still win inside it.
- The automatic STATUS rewrite works and resets expansions to the minimal template.
- There is no vision drift; CEO automations are active.
- The recorded main tip is `8122a6f`; the subsequent STATUS rewrite is commit `2f47896`.
