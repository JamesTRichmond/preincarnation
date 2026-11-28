# PREINCARNATION: CEO Status

_Updated 2026-11-27T21:16:00Z. Main at `2f478965b8cd771dee6a15ebd30477bc8d1f1e2a`._

## Health of main (`2f478965`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |

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

- PR #146 (draft, pure docs STATUS expansion on copilot/update-status-md-content): vision-aligned. Blockers: draft + CI unstable/pending. Tip references stale 8122a6f; current tip is 2f478965.
- Issue #142 (bot-ready): Collapse six duplicate "test" scripts in package.json. Last wins (test:game); quarry-creek .js tests never run.
- Issue #71 (bot-ready, outdated): Support-pack PRs long merged. Recommend close.
- James-human decisions open: density call, #138 (engine changes #134–#137), #133 (kitchen), #70 (winters/geo), #65 (art/audio), #64 (second modes), #63 (food), #62 (crafting line), #69 (l10n), #68 (authenticity), #67 (core loop), #66 (what carries).

## QQ-VGEF gap notes (estimated 86-90%)

- Primary Core ~90%: feel, progression, tell, skill cap, kitchen optional, sole plot strong.
- Secondary ~75%: a11y comfort present but formal checklist missing; latency harness absent.
- Structural ~92%: tests green when last-wins script runs; #142 blocks full coverage; CI on STATUS PRs often pending.
- Innovation ~88%: sole Marble Vein enforced; no second plot.

Gaps: #142 package duplicates, formal feel/latency probe harness, a11y checklist, audio coherence ledger, James density/#138/#133 decisions.

## Prioritized backlog

1. #142 package.json cleanup (bot-ready, mechanical).
2. Feel/latency probe harness (bot-ready, no engine touch).
3. a11y checklist (bot-ready).
4. Audio coherence ledger (bot-ready).
5. James-human decisions.

## Durable facts

- Main tip 2f478965 (STATUS rewrite after #145). Prior #144 at ff6179d, #145 at 8122a6f.
- No open player-facing PRs. Only draft STATUS #146.
- No vision drift. Density unmounted. SAVE_VERSION 9. Support packs isolated.
- CEO automations active (nightly-ceo, qq-vgef-progress, PR event triggers).

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.
