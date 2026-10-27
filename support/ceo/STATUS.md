# PREINCARNATION: CEO Status

_Updated 2026-10-27T05:50:00Z. Main at `d3cdc51` (merge of #131). Status rewrite tip `fda865d`._

## Health of main (`d3cdc51`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Tests (author claim on #131) | tsc clean; npm run test:game 521 pass / 0 fail. CI verify in_progress at merge. Browser smoke not run. |

## What landed in #131 (https://github.com/JamesTRichmond/preincarnation/pull/131)

Port of approved behaviors onto post-#130 main (`ee21bde` base):

- Pause names what you carry (#36): "Carrying ·" line lists weapons, non-sword relics, bottles, arrows, bombs, keys.
- Grave keeps the weapon's numbers. Full belt leaves the tin. Hurt hand drinks syrup preferentially. `0` / pad Select cycles the weapon in the bag. Previous life can be put back via undoLastSave (#93). Fourteen winters stays exactly fourteen; old 14–18 variance not restored.
- Magnified 320×240 frame sits in a stage div that scrolls when it no longer fits. Does not mark a door. Comfort settings from #130 preserved (#111).
- `/satchel` is an isolated desk with own localStorage key `preincarnation.inventory.v1`. Does not read or write the county save (`preincarnation.save.v1`). Leaving returns to the county (#106).
- #129 (SAVE_VERSION 9 pin) already on main; not repeated.

Live engine and save touches were explicitly approved by James. 320×240 internal buffer unchanged. Satchel is not a gate and not the live save.

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Graves now remember full weapon snapshots (optional fields; older graves still load and reroll).

## Open work / risks

- Source PRs #36, #93, #111, #106 remain open on stale bases. Their approved behaviors are now on main via #131; close them as superseded.
- Many docs-only STATUS PRs (#112–#128 range) are on older bases and conflicted; they do not change the walk.
- Density path still unmounted (james-human).
- CI verify for #131 was in_progress at merge time; confirm green post-merge.
- No browser smoke run on this cycle.

This file is rewritten by `node scripts/write-ceo-status.mjs`. A merge to main runs the same script. If this SHA is not the tip, the script has not run since the last merge.

## QQ-VGEF impact

No negative impact. Reinforces vision fidelity (sole plot, exact 14 winters, isolated desk). Live quality gates (bag naming, grave persistence, preferential sip, magnification without door-mark) advanced under explicit approval. Open risks are process (stale source PRs) not product.
