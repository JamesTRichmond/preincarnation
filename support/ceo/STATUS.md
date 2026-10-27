# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~03:40 UTC, after merge of PR #116. Main at `f35bf48` (merge of PR #116)._

## Health of main (`f35bf48`)

| Gate | Result |
|---|---|
| `npm run test:game` | **291 pass, 0 fail** (per PR #116 evidence log `ops/EVIDENCE/L-0005-test-game.txt`) |
| `tsc --noEmit` | clean (per PR #116) |
| SAVE_VERSION | remains 8 |
| Engine / rules touch | no |
| County save / live route | unchanged; PWA shell is public assets only |

Prior typecheck/build/smoke inherited from recent merges. CI verify was in progress on PR head at merge time; author verification green. Full re-smoke recommended on next CI cycle.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #116 | Add the install shell for the one web app. `public/manifest.webmanifest` (standalone, `#070b18`, 192/512 icons). `public/sw.js` caches `/`, manifest, icons, and already-fetched `/assets` or `/game` files; skips `/api`, `/auth`, and the save. Document registers only `/sw.js`. Release pack allows this one worker. Decision D-013 recorded. | merged by James; head `6f807f5`; main tip `f35bf48` |

Vision Checklist satisfied: Marble Vein remains the sole plot. Death advances exactly 14 winters as a chapter. One person; no romance, party, or crafting systems. 320×240 Canvas and SNES-coat feel preserved. localStorage save and SAVE_VERSION=8 respected (service worker does not touch the save). Support packs and live engine untouched. Tests green. Enables offline shell open for the single progressive web app.

## Durable facts

- Install shell: one progressive web app. Manifest at `/`, service worker caches the document and fetched assets only. Does not cache accounts, API, or the save.
- Enemy max HP does not grow with deaths/cycles (from #107). Tropoverse is a place (×1.35 once).
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main (decoy faces, Sentinel telegraph).
- Node ≥ 22.12 required. Tests by glob.
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push.

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

## Open PR ledger (post-#116, ~03:40 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82, #91, #92, #112, #113, #114 (stale relative to current main) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59, #49, #42, #87, #88, #89, #95, #98, #100, #101, #102, #105, #106, #108, #110, #115, etc. |
| Live features | #15 weapon compare, #36 item search, #111 picture-and-pad, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs (#81, #82, #91, #92 and later); this STATUS is current.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review open support packs for vision alignment and conflicts with recent main. PWA shell is pure public addition; no interaction with support packs.
5. Full CI smoke on main post-#116 to confirm no regression from install shell.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks. Adds optional offline shell for the single web app. QQ-VGEF pillars (live engine fidelity, vision constraints) unaffected; improves deploy readiness for the one progressive web app.
