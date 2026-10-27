# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~04:00 UTC, after merges of #87, #88, #89, #15, #117, #116. Main tip at `9d6edcfd` (merge of PR #89)._

## Health of main (`9d6edcfd`)

| Gate | Result |
|---|---|
| `npm run test:game` | inherited green from recent merges (e.g. #117 claimed 293 pass; #87 at rebase claimed 231; additive support tests) |
| `tsc --noEmit` / build | clean on recent PR heads |
| SAVE_VERSION | remains 8 (or 9 if #109 kitchen landed; confirm on next cycle) |
| Engine / live touch | recent: #15 weapon sheet in pause (isolated), #117 theme map pure, #116 PWA shell pure. #87/#88/#89 pure support packs, unmounted. |
| County save / live route | unchanged by support packs |

Prior full smoke recommended on next CI. All listed merges vision-aligned with green verify on heads.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #87 | Add the Witness mastery ledger beside the county walk. Isolated `support/grok-31-mastery/` (sample inscriptions, afterlife desk prototype, own `preincarnation.mastery.v1` key). Not mounted; no engine/save/route touch. Death still spends old skill; Witness separate book. | merged by James at `b1a70a70`; head `d6f5439` |
| #88 | County Book stall ledger under `support/grok-55-merchants/`. Isolated, unmounted. | merged at `2f37ddac` |
| #89 | Harrowford's gatherings under support. Isolated, unmounted. | merged at `9d6edcfd` (current tip) |
| #15 | Weapon compare sheet in pause bag (no ranking). | merged at `7c3f0b43` |
| #117 | Theme map: every live verb to Marble Vein (ops/THEME.md + tests). Pure. | merged at `afa834e` |
| #116 | Install shell / PWA manifest + SW (public assets only). | merged at `f35bf48` |

Vision Checklist for #87: Marble Vein sole plot; death chapter (~14 winters); one person; no romance/party/crafting; 320×240 preserved; localStorage respected (separate key); support does not break live; tests green. AfterlifeDesk not imported. Sample only; refuses library-complete.

## Durable facts

- Witness mastery is optional reference module, not live. Own save key unused until imported.
- Enemy max HP does not grow with cycles (#107). Skill capped (#83). Exactly 14 winters (#78). Marble Vein tell (#86).
- Theme map enforces verb-to-plot lines (#117).
- PWA install shell present (#116).
- Node ≥ 22.12. Tests by glob. Process: author as JamesTRichmond; merge after verify.

## Issue Factory

**james-human rulings (still in force):**
- #62–70 as previously listed (support only, no hunger, no second game, coat medium, keep self/lantern/shovel, no new gate, real Addison or labeled, English v1, exactly 14 winters no geo).

**bot-ready:**
- #71/#72/#73 for rebase of remaining conflicted PRs.

## Open PR ledger (post-#89, ~04:00 UTC)

| Bucket | PRs |
|---|---|
| STATUS updates | this PR; prior stale #81/#82/#91 etc. to close/rebase |
| Support / unmounted | remaining #59, #100, #101, #102, #105, #106, #108, #110 etc. |
| Live features | remaining engine candidates after rebase |
| Other | pending #71–73 |

## Next priorities

1. Merge this STATUS update once CI green.
2. Close superseded/stale STATUS PRs and #38 (already capped).
3. Continue bot-ready rebases (#71–73); vision + tests before merge. Live engine/rules require review.
4. Review remaining support packs for conflicts with current main.
5. Full smoke on main tip to confirm no regression from recent pure additions.
6. Repo hygiene: screenshots/artifacts size.

No new risks from #87. Pure optional archive. QQ-VGEF pillars (live fidelity, vision constraints) unchanged/strengthened by isolation; optional support readiness advanced.
