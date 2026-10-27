# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~02:25 UTC, after merge of PR #80. Main at `4a9766d` (merge of PR #80)._

## Health of main (`4a9766d`)

| Gate | Result |
|---|---|
| `npm ci` | OK (prior runs) |
| `npx tsc --noEmit` | **0 errors** (PR #80 reported clean) |
| `npm run build` | OK (prior) |
| `npm test` (`test:game`, glob) | feel.test.ts + rules.test.ts 44 pass; full suite not re-run this minute, new file under glob. Prior main ~145 pass. |
| browser-smoke | Prior green; #80 is feel-only, no route/save change. |
| GitHub Actions `CI / verify` on #80 head | **in_progress** at merge (run started 02:19:59Z). Watch for green. |

Live engine feel improved without save, winter, or geo changes.

## What changed recently

| PR | What | Result |
|---|---|---|
| #80 | Keep a swing that lands during hitstop; lip-step mover (4px), knockback via same mover, short hurt freeze (reduced-motion scaled), analog facing axis memory, camera deadzone+ease. Rebased feel pass of old #54 onto post-#78 main. New `src/game/feel.ts` + test. | merged `4a9766d` (head `d81b6d6`) |
| #78 | Lock death at exactly 14 winters; drop live geolocation, open-meteo, weather speed tax, forecast particles. | merged `3e804d0` |
| #76 | docs-only STATUS.md update after #41 | merged `d559133` |
| #61 | Vein Score desk (/score + support/grok-17-score) | merged earlier |
| #41 | action-input bench (/input + support/grok-19-input) | merged `f204e97` |

Vision Checklist satisfied for #80: Marble Vein sole plot; winters stay 14; one person; no romance/party/crafting; 320×240 preserved; localStorage untouched; support not involved; tests reported green on touched files.

## Durable facts

- **Node ≥ 22.12 is required.** On 22.11, `npm ci` silently skips rolldown's native binding and Vite 8 fails. Use `.nvmrc`.
- **Tests are discovered by glob.** Do not edit `package.json` to add tests. Name `*.test.ts` under `src/` or `support/`, or `*.test.mjs` under `support/`.
- **Save:** `preincarnation.save.v1`, `SAVE_VERSION = 8`; backup kept. Unreadable/newer refused since #46. #80 did not touch saves.
- **Death math:** exactly 14 winters. No live geolocation, no forecast, no weather speed tax (Ruling #70 / #78).
- **Feel (post-#80):** attack buffer across hitstop; lip-step collision; consistent knockback; reduced-motion hitstop scale; axis-memory facing; camera deadzone.
- **CI:** concurrency cancels superseded runs. Actions v4 Node 20 deprecation warning remains.
- **Process:** PRs authored as JamesTRichmond. Prefer PR → verify → merge. No force-push.

## Issue Factory

**james-human rulings (still open; comments are law):**
- #62 support only. No craft/loot/bench/storage on live. Closed related.
- #63 food may be named. Hunger does not exist.
- #64 no second game.
- #65 the coat is the medium.
- #66 keep yourself, the lantern, the shovel, and the waking iron.
- #67 no new gate.
- #68 real Addison County, or labeled fiction.
- #69 English only for v1.
- #70 exactly 14 winters. No geo/forecast/weather tax. Done via #78.

**bot-ready:**
- #71 support/unmounted PRs with package.json conflicts: remaining #27, #39, #42, #48, #49, #55 (some may be closed).
- #72 live-feature PRs: #15, #29, #30, #36 ( #41 done).
- #73 engine.ts conflicts: #38, #52 ( #54 closed by #80). Resolve only; CEO + J R review before merge. #80 changes to engine.ts may increase conflict surface.

## Open PR ledger (post-#80, ~02:25 UTC)

| Bucket | PRs |
|---|---|
| bot-ready rebase (#71/#72/#73) | 15, 36, 38, 42, 49, 52, 59 (and any still open from prior lists) |
| Held for J R | 59 (loot → #62), others closed by rulings |
| STATUS | this update |

Many prior PRs closed under #62–#70 rulings. #54 superseded by #80.

## Impact on QQ-VGEF / risks

- QQ-VGEF pillars: feel improvements support the SNES-coat job without adding systems. No new essential gates, no economy.
- Open risks: engine.ts is now more complex (feel extracted). Other engine PRs (#38, #52) will need careful rebase. CI on #80 still running at report time. Full test:game not freshly confirmed post-merge.
- Unblocks: closes the old #54 line. May not directly unblock others; engine changes could block #73 work until rebased.

## Next priorities

1. Confirm CI verify green on main post-#80 (run 40437800495).
2. Merge this STATUS PR once green.
3. Continue #71–#73 bot-ready rebases; prioritize conflict-free support packs.
4. Review remaining open PRs (esp. #38/#52 engine) against Vision Checklist after rebase.
5. Monitor for any feel regressions in play; reduced-motion path is new.
6. Repo hygiene and CI actions bump remain secondary.
