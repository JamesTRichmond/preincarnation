# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:05 UTC, after merge of PR #96 (and subsequent #97/#99). Main tip at `078d55c` (merge of PR #99)._

## Health of main (`078d55c`)

| Gate | Result |
|---|---|
| Recent support merges | #96 Lemon Fair placement (isolated), #97 item inheritance, #99 overworld cartogram, #95 environment art, #89 gatherings, #87 Witness mastery — all pure additions under support/ |
| Live engine / save | Unchanged by these packs. SAVE_VERSION remains 8. No route or canvas touch from #96. |
| Tests | Prior evidence 255+ pass; #96 claimed 261 including new placement tests. Full re-verify on next CI recommended. |
| County save / live route | unchanged |

Prior typecheck/build/smoke inherited; full re-smoke recommended on next CI cycle. CI verify green on PR heads before merges.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #96 | Add the Lemon Fair loot placement pack beside the county walk. Hand-authored situations under `support/grok-52-loot-placement/` (143 situations, 12 districts, 16 dungeons, resolver + tests). No shared files, no live mount, full-screen bend walk left out on purpose. | merged by James at `b60909b` (head `4578c22`); main advanced past it |

Vision Checklist satisfied for #96: Marble Vein sole plot (no second plot); death as chapter unchanged; one person; no romance/party/crafting; 320×240 Canvas/SNES-coat preserved; localStorage/`preincarnation.save.v1` untouched (no migration); support pack does not break live game. Powder not loot. Tests green on head.

## Durable facts

- Enemy max HP does not grow with deaths/cycles. Tropoverse is a place (×1.35 once). Player ribcage already free of cycle term.
- Skill on death remains capped (from #83). SAVE_VERSION stays 8.
- Death math: exactly 14 winters. No geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains on main (decoy faces, Sentinel telegraph).
- Lemon Fair placement pack (#96) is isolated design-time archive; anchors are a patch for shoreham-orchards, not a replacement map.
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

## Open PR ledger (post-#96/#99, ~04:05 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates (rebase/close) | #81, #82 and prior ceo-status-* (stale; this PR supersedes) |
| Superseded | #38 (close; skill cap already on main via #83) |
| Support / unmounted | #59 buried-history, #49 waterside, #42 quarry, #100 persistence, #101 gadgets, #102 dungeons, #105 ashwick, #106 satchel, #108 endgame, #110 opening-hour, etc. |
| Live features | #15 weapon compare (merged?), #36 item search, remaining engine-touch candidates |
| Other | pending rebase from #71–73 |

## Next priorities

1. Close #38 as superseded by #83.
2. Rebase or close stale STATUS PRs; merge this STATUS once CI green.
3. Continue bot-ready rebase of remaining open PRs (#71–73); verify vision + tests before any merge. Engine/rules touches require explicit review.
4. Review open support packs for vision alignment (all recent ones isolated). Watch for any that attempt live mount of Lemon Fair full-screen walk (explicitly excluded).
5. Full CI smoke on main post-recent merges to confirm no regression.
6. Repo hygiene: large artifacts/screenshots still inflate .git.

No new risks from #96. Isolated optional pack strengthens design-time loot placement readiness without affecting live engine fidelity or QQ-VGEF pillars. Full-screen conflict left unresolved on purpose.
