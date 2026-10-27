# PREINCARNATION: CEO Status

_Updated Mon 2026-10-26, ~9:50 PM EDT. Main at `b3b635d` (merge of PR #61)._

## Health of main

#61 landed on a green `verify` check (run 40422718652, head `e47344d`). Main before that merge was already green: typecheck 0, `test:game` 145/145, smoke clean, CI run 40422784882. This status update does not re-run those gates.

## What changed this run

| PR | What | Result |
|---|---|---|
| #61 | Vein Score desk at `/score`. Optional audition. Does not write a save, does not import field audio, does not replace the walk. | merged `b3b635d` |
| #41 | `/input` binding lab. CI green on `c04d062`. | **not merged.** GitHub 405: conflicts with #61 on `src/routeTree.gen.ts` and `src/styles.css`. Rebase and keep both `/score` and `/input`. |

Prior merges this day still hold: #57 painter hotfix, #58 test glob, #60 CI, #46 save refusal, #12 combat survey, #53 dungeon pack, #17 release desk.

## Held, unchanged

- #45 death-as-chapter waits on #66 (engine + new save flag, no `SAVE_VERSION` bump).
- #18, #28, #37 and the rest of the crafting/loot line wait on #62.
- #30 keep-rules is clean and CI-green, but the PR says James merges, and #66 is still open. Not merged.
- #15 kit-compare and #36 pause search are CI-green and reported clean before #61, but both edit `src/game/engine.ts`. Not merged. Engine changes still need an explicit sign-off.
- #29 enemy plates is CI-green and does not edit `engine.ts`, but it registers `/plates` in `routeTree.gen.ts`. Expect the same conflict as #41. Rebase, keep `/score` and `/plates`.

## Automations

Active CEO automations on repo `1366679706`:

- `preincarnation-nightly-ceo` — daily 21:00 ET
- `preincarnation-qq-vgef-progress` — daily 09:00 ET
- `preincarnation-pr-opened-review` — `pr_opened`
- `preincarnation-pr-pushed-review` — `pr_pushed`
- `preincarnation-pr-merged-status` — `pr_merged`
- `preincarnation-ci-failure-triage` — check failure

## Durable facts

- **Node ≥ 22.12 is required.**
- **Tests are discovered by glob.** Do not edit `package.json` to register a test.
- **Save:** `preincarnation.save.v1`, `SAVE_VERSION = 8`.
- **Death math:** `wintersPassed()` = 14–18. README says 14. Open question: #70.
- **Vision:** one person, death is a chapter, Marble Vein is the only plot, 320×240, no romance, no party, no crafting economy as a core system. Support packs stay optional.

## Still waiting on James

#62 crafting/loot/bench line. #63 food vs hunger. #64 second modes. #65 art/audio vs the SNES coat. #66 what carries across a death. #67 core loop and seam gating. #68 Vermont authenticity. #69 localization. #70 the 14–18 winter variance.

## Next

1. Rebase #41 and #29 onto `b3b635d`. Keep every route. Re-run `verify`. Merge if still vision-safe and green.
2. Do not merge #15 or #36 until engine.ts edits are signed off.
3. #71 still owns the dirty support-pack rebases (#27, #39, #42, #48, #49, #55). #27/#39/#55 still wait on #62.
4. #73 still owns the engine.ts conflict resolution on #38, #52, #54. Resolve only.
