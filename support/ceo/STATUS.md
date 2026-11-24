# PREINCARNATION: CEO Status

_Updated 2026-11-24T02:00:29.982Z. Main at `ff6179d`._

## Health of main (`ff6179d`)

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

## PR #144: Bifrost coordination

PR #144 merged as `ff6179d`; the automatic status rewrite followed at `404c606`. It added a Bifrost agent-coordination pointer to `AGENTS.md` and `.github/copilot-instructions.md`, with the explicit rule that this repository's own rules still win inside it. This was a documentation-only change with no engine, save, route, or live-system impact.

## Health

- SAVE_VERSION remains 9, and the Vision Checklist is fully satisfied: Marble Vein is the sole plot, there is one person, death is exactly fourteen winters, there is no party, romance, or crafting, and 320×240 is preserved.
- The density path remains unmounted; see `ops/DENSITY.md` for the James-human decision.
- Support packs remain isolated.

## Verification

- PR #144 was docs-only; CI was green, with no test impact expected.
- The automatic STATUS rewrite ran after the merge.

## QQ-VGEF

The estimated band is unchanged at 86–90%: Primary Core ~90%, Secondary ~75%, Structural ~92%, and Innovation ~88%. Gaps are unchanged: #142 package.json duplicates, the feel/latency harness, the a11y checklist, the audio ledger, and James's density/#138/#133 decisions.

## Open risks

Risks are unchanged. The #143 draft STATUS expansion is now stale relative to this tip and needs a rebase.

## Prioritized backlog

1. #142 package.json cleanup (bot-ready).
2. Feel/latency probe.
3. A11y checklist.
4. Audio coherence ledger.
5. Rebase or close #143 after this update.
6. James-human decisions on density, #138, and #133.

## Durable facts

- The Bifrost pointer landed, and this repository's own rules still win inside it.
- There is no vision drift.
- The automatic STATUS rewrite works.
- CEO automations are active.
