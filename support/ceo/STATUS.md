# PREINCARNATION: CEO Status

_Updated 2026-10-31. Main at `e8b7d68` (STATUS rewrite) / prior `e53ade5`._

## Health of main (`e8b7d68`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240 SNES-coat. No accounts. No live geo or weather. No romance/party/core crafting. |
| Density path | Not mounted. See ops/DENSITY.md. James-human decision. |
| Live feel | Coat/glass/stone (#137), ground-step (#136), strike voices (#135), county second lines (#134) landed. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- No vision drift detected. One person. Sole plot. Job continues.

## Open work (2026-10-31 nightly)

Open PRs (all dirty/stale vs current main):
- #38 (capped-purse): superseded by merged #83. Recommend close.
- #42 (quarry-creek-rules): rebase required; confirm isolation.
- #49 (waterside-demo-finds): rebase required; confirm unmounted.
- #59 (buried-history): rebase required; pure support pack intent OK if isolated.

Player-facing pulls that still conflict with main are not in this tip. Status-only pulls do not change the walk.

## QQ-VGEF gap notes (toward 95%+)

Estimated band ~78-82% (prior audits). Primary Core ~80% (feel/progression/tell strong post-#134–#137). Secondary (a11y comfort) ~68%. Structural ~90%. Innovation ~80% (sole-plot strong).

Remaining mechanical gaps (bot-ready, no engine/save without approval):
- Latency/feel probe harness (frame timing, hitstop consistency).
- A11y audit pass on comfort settings (pictureScale etc. from #111/#130).
- Audio coherence polish (beds, steps, strikes already improved; further mixer/volume balance).
- Onboarding/first-life clarity (Maeve/shovel/east already present).

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.
