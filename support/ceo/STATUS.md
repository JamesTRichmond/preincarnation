# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~03:05 UTC, after merge of PR #86. Main at `773b8e3` (merge of PR #86). Tip advanced further to `b2d93df` (#90) by the time of this write; this entry records #86._

## Health of main (`773b8e3`)

| Gate | Result |
|---|---|
| `npm run test:game` | **237 pass, 0 fail** (per PR #86 evidence log `ops/EVIDENCE/L-0003-test-game.txt`) |
| `tsc --noEmit` | clean (per PR #86) |
| SAVE_VERSION | remains 8 |
| Engine touch | yes — `src/game/engine.ts` + new `src/game/marble.ts` (intentional, reviewed, merged by James) |
| Lantern gate | preserved (hammer still refuses dark quarry) |

Prior health inherited. Full re-smoke recommended on next CI cycle. Subsequent #90 not re-verified here.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #86 | Teach the Marble Vein its tell: decoy cracked faces at quarry (16,5)/(18,5) spark and stop for blade; hammer and bomb refuse them; Sentinel shows gold telegraph (0.6s) before lunge. New `strikeMarble` / `stepSentinel` in `marble.ts`, wired into engine. Weapon sheet from unmerged #83 tail included. Lantern gate kept. B-001 closed (v1 = one PWA, no live service). | merged by James at `773b8e3` |

Vision Checklist satisfied: Marble Vein remains the sole plot (this gives it a concrete tell); death ~14 winters chapter unchanged; one person; no romance/party/crafting core; 320×240 SNES-coat feel preserved (adds telegraph and spark); localStorage / SAVE_VERSION=8 respected; intentional live integration of marble rules (not a support pack rewrite); tests 237 green.

## Durable facts

- **Marble Vein has a tell.** Decoy faces at real quarry cells (16,5) and (18,5) stay shut. Blade sparks and stops. Hammer and bomb do not open them. Sentinel gold telegraph before lunge.
- **Lantern gate remains.** Hammer refuses a dark quarry; open the lamp first.
- **Skill on death is capped.** (from #83) `chapterSkillAward` pays only remaining non-crown ranks minus points in hand, ceiling 12. SAVE_VERSION stays 8.
- **Death math:** exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Node ≥ 22.12 required. Tests by glob. No package.json edits for tests.
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push. Engine touches require explicit James merge (as with #86).

## Issue Factory

**james-human rulings (still in force):**
- #62 support only. No craft/loot/bench/storage on live surface.
- #63 food named; no hunger.
- #64 no second game.
- #65 coat is the medium.
- #66 keep self, lantern, shovel, waking iron.
- #67 no new gate.
- #68 real Addison County or labeled fiction.
- #69 English only for v1.
- #70 exactly 14 winters. No geo/forecast/weather tax.

**bot-ready:**
- #71/#72/#73 still open for rebase of remaining conflicted PRs.

## Open PR ledger (post-#86)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81 (after #80), #82 (after #76), #91 (correcting #85 SHA) |
| Superseded | #38 (skill cap predecessor; close in favor of #83); #52 (marble tell predecessor; close in favor of #86) |
| Support / unmounted | #59 buried-history, #49 waterside finds, #42 quarry rules, #87 witness mastery, #88 county book, #89 gatherings |
| Live features | #15 weapon compare (partially overlapped by #86 weapon sheet), #36 item search |

## Next priorities

1. Close #52 as superseded by #86 (same intent, landed).
2. Close #38 as superseded by #83.
3. Rebase or close stale STATUS PRs #81, #82, #91; prefer this update as the current STATUS (or rebase #91 onto this).
4. Continue bot-ready rebase of remaining PRs (#71-#73); verify vision and tests before merge.
5. Full CI smoke on main post-#86/#90 to confirm no regression.
6. Review open support packs for vision alignment and conflicts.
7. Repo hygiene: large artifacts/screenshots still inflate .git.

