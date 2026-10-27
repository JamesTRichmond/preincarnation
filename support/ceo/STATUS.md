# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~01:47 UTC, after merge of PR #61. Main at `b3b635d`._

## Health of main (`b3b635d`, CI in progress on push)

| Gate | Result |
|---|---|
| Prior CI on previous main | success (run 40423810598) |
| Current CI / verify on `b3b635d` | in_progress (run 40434612586, started 01:47 UTC) |
| PR #61 verification (pre-merge) | typecheck 0, test:game 132/132 (incl. music-logic), build 0, smoke dev+prod `/` and `/score` desktop+mobile clean, walk position moves correctly |

P0 crash remains fixed. Live 320×240 walk unchanged by #61.

## What changed

| PR | What | Result |
|---|---|---|
| #61 | Vein Score desk: optional `/score` route + `support/grok-17-score/` + `public/score/` MP3s/stems. Audition for 12 county places with three motifs (Ellis, Vein, Voice). Does not replace walk, write saves, or import field audio. Additive styles and routeTree.gen.ts. | merged `b3b635d` (https://github.com/JamesTRichmond/preincarnation/pull/61) |

Vision Checklist: aligned. Marble Vein sole plot; one person; no romance/party/crafting; 320×240 preserved; localStorage untouched; support pack optional and non-breaking; tests green on the PR head.

**Repo weight:** +37,951 lines, mostly audio assets under `public/score/` and validation plots. Flag for hygiene review (see open risks).

## Open risks (updated)

- **Audio vs SNES coat:** #61 adds a full adaptive score desk. Related to #65 (photo art, audio, animation vs SNES coat). Desk is optional and separate; does not alter live engine feel.
- **routeTree.gen.ts:** now includes `/score`. Any other PR adding a route will conflict.
- **Winter variance / location:** still open (#70).
- **CI actions:** still on v4 (Node 20 deprecation warning).
- **Committed artifacts/screenshots:** repo size concern remains.
- **QQ-VGEF pillars:** no change. Score is design-time audition, not a live pillar shift. Vision fidelity intact.

## Issue Factory

**james-human (unchanged, still open):**
- #62 crafting/loot/bench line
- #63 food vs hunger
- #64 second games/modes
- #65 photo art, audio, animation vs SNES coat (now includes #61 context)
- #66 what carries across a death
- #67 core loop and seam gating
- #68 Vermont authenticity (#21)
- #69 localization (#25)
- #70 the 14–18 winter variance and the real location/weather fetch

**bot-ready:**
- #71 support/unmounted PRs, package.json-only conflicts: #27, #39, #42, #48, #49, #55
- #72 live-feature PRs, package.json-only conflicts: #15, #29, #30, #36, #41
- #73 engine.ts conflicts: #38, #52, #54 (rebase only)

## Open PR ledger (40 open after #61)

| Bucket | PRs |
|---|---|
| bot-ready rebase (#71/#72/#73) | 15, 27, 29, 30, 36, 38, 39, 41, 42, 48, 49, 52, 54, 55 |
| Held for J R (core/engine/save) | 45 (#66), 47 (#66), 13 (#66), 14 (#66), 50 (#67), 22 (#67), 24 (#63/#67), 21 (#68) |
| Held for J R (scope/aesthetic) | 16, 23, 34 (#64); 20, 26, 44 (#65); 25 (#69); 43 (#63) |
| Held on crafting/loot line (#62) | 18, 19, 28, 31, 32, 33, 37, 40, 56 |
| New / pending review | 59 buried-history loot pack (conflicts on package.json; loot → #62) |

#61 merged; does not unblock the package.json or engine.ts conflict PRs. routeTree.gen.ts touch means future route-adding PRs need rebase.

## Next priorities

1. Confirm CI on `b3b635d` succeeds (watch run 40434612586).
2. Process #71–#73 bot-ready rebases when pushed; verify and merge if green and vision-aligned.
3. Review #59 against Vision Checklist (loot → #62).
4. Await J R decisions on #62–#70 to unblock held PRs.
5. Repo hygiene: consider moving large audio assets or adding LFS / external hosting for `public/score/` if size becomes an issue; bump CI actions to v5.
