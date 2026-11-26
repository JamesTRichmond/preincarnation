# PREINCARNATION: CEO Status

_Updated 2026-11-26T14:30:00Z. Main at `2f478965b8cd771dee6a15ebd30477bc8d1f1e2a`._

## Health of main (`2f478965`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. Density unmounted. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Tests | test:game green (last reported ~542+). #142 open: duplicate test keys in package.json (last wins). |
| Open PRs | Draft #146 only (STATUS expansion). No live-engine conflicts. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- No vision drift. Sole plot held. One person. No party/romance/crafting core.

## QQ-VGEF Gap Matrix (2026-11-26 audit)

Estimated band: **86-90%** overall.

| Pillar | Weight | Estimate | Gaps / Notes |
|---|---|---|---|
| Primary Core (gameplay feel, narrative pacing, core loop, Marble Vein) | 50% | ~90% | Feel solid post #80/#86/#104/#107/#109/#130-#137. Latency/feel probe harness missing for formal scoring. Narrative pacing strong (sole plot, 14 winters). |
| Secondary (UI/accessibility, audio, polish) | 20% | ~75% | A11y comfort present (#111/#130) but no formal checklist. Audio beds/steps/hits landed; coherence ledger open. UI chrome clean. |
| Structural Integrity (tech debt, tests, stability) | 20% | ~92% | Main green. #142 package.json duplicate "test" keys (quarry .js not discovered). No Sev1/2. Auto STATUS rewrite works. |
| Innovation (reincarnation + Marble Vein) | 10% | ~88% | Strong unique identity. Density path and James decisions (#138/#133/#70 etc.) gate further agency/optional systems. No second plot risk. |

## Open work / Risks

- #142 (bot-ready, priority 1): Collapse duplicate test scripts; preserve all coverage including quarry-creek .js.
- #71 (bot-ready): Outdated (most listed PRs merged); recommend close after confirmation.
- James-human: density mount call, #138 (engine touches), #133 (kitchen), #70 (winters/geo), art/audio direction, localization, etc.
- Draft #146: STATUS expansion; hold until CI green, then mergeable as pure docs.
- No live engine or save format changes pending.

## Prioritized next actions

1. Bot: Close #142 (package.json test cleanup) — structural win, reduces future conflicts.
2. Bot: Feel/latency probe harness (isolated, no live touch) for formal Primary Core scoring.
3. Bot: A11y checklist + audit pass (comfort settings already present; document and extend).
4. Bot: Audio coherence ledger (beds, steps, hits, talk) — polish Secondary.
5. James: Density decision and other human gates to unlock optional depth without vision break.
6. Merge #146 once green (docs only).

## Durable facts

- Bifrost pointer (#144) landed; this repo's rules win.
- Auto CEO STATUS rewrite active and resets expansions on merge.
- CEO automations (nightly, QQ-VGEF) running.
- Support packs isolated; no unintentional live impact.
- Vision Checklist holds on every merge.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge to main. Expansions like this one live on feature branches until merged.
