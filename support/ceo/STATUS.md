# PREINCARNATION: CEO Status

_Updated 2026-11-15 (nightly). Main tip `b8d621e` (post-#59 + auto STATUS rewrite). No new commits since 2026-11-11._

## Health of main (`b8d621e`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. localStorage. No accounts, no live geo/weather tax. |
| Density path | Unmounted. See `ops/DENSITY.md`. James-human decision. |
| Open PRs | None. |
| Tests | `test:game` green on last merge (542+ claimed). `package.json` has duplicate `"test"` keys; last wins = `test:game`. Quarry-creek `.js` tests not in glob. |

## Still true (vision intact)

- Enemy max HP does not scale with cycle (#107). Tropoverse ×1.35 once.
- Skill on death caps to remaining non-crown ranks (#83 / residual #38). Ceiling respected.
- Death advances exactly 14 winters. No location/weather speed tax.
- Marble Vein tell (decoy faces, lantern gate) preserved (#86).
- Install shell (`/manifest.webmanifest` + `/sw.js`) caches shell/assets only, skips save (#116).
- Theme map ties every live verb to the sole plot (#117). Sphere named as folded county, not second plot (#127).
- Comfort/a11y, audio beds, step/hit voices, county second lines, kitchen-from-pause, magnify, satchel desk, bag names, grave numbers all landed via approved merges. No second plot.
- Support packs (dungeons, merchants, gadgets, buried-history, natural materials, etc.) remain isolated / unmounted.

## Open risks & blockers

- **#142** (bot-ready): Collapse six duplicate `"test"` keys in `package.json`. Quarry-creek `.js` tests not discovered by current globs. Mechanical cleanup; no live touch.
- **#71** (bot-ready, outdated): Bring older support PRs up to main. Those PRs (#42, #49, #59) have since merged. Issue can be closed or narrowed.
- James-human decisions still open: density mount (#ops/DENSITY.md), kitchen keep/gate/remove (#133), engine-touch confirmation for #134–#137 (#138), 14-winter exactness confirmation (#70), Vermont authenticity, art direction, crafting line, etc. (#62–#69).
- No formal latency/feel harness or a11y checklist yet. Secondary QQ-VGEF pillar remains the largest gap.
- Auto STATUS rewrite on merge overwrites expanded notes with minimal tip pointer. Manual expanded versions live on branches until next merge.

## QQ-VGEF provisional band (2026-11-15)

Estimated **86-90%** overall toward Industry Vanguard (95%+).

| Pillar | Estimate | Notes |
|---|---|---|
| Primary Core (feel, progression, sole plot, 14 winters) | ~90% | Tell, skill cap, HP non-scale, audio voices, step response, kitchen optional, magnify/satchel landed. Latency harness still missing for formal scoring. |
| Secondary (a11y, comfort, audio coherence) | ~75% | Comfort settings, reduced-motion, magnify exist. No formal a11y checklist or audio coherence audit. |
| Structural (tests, CI, no Sev1/2, save hygiene) | ~92% | Tests green on merges, SAVE_VERSION 9, no open PRs, auth secret removed. Duplicate test keys and missing quarry discovery are tooling debt. |
| Innovation (sole-plot fidelity, Vermont tone, optional packs) | ~88% | Strong sole-plot enforcement, narrative bible isolated, many support packs. Density call and some james-human taste decisions open. |

**Gaps to 95%+**: formal latency/feel probe, a11y checklist, package.json cleanup, James density + remaining taste decisions, optional agency polish that stays vision-aligned.

## Prioritized backlog (CEO view)

1. **Bot-ready mechanical** (no engine/save touch):
   - #142 package.json test-key collapse + quarry `.js` discovery.
   - Latency/feel harness (probe frame times, hitstop, step audio, camera deadzone).
   - A11y checklist (pictureScale, highContrast, reducedFlashing, stick, focus, contrast ratios).
   - Audio coherence audit (beds, step/hit voices, talk notes, mixer levels).
2. **James-human** (blocks or gates deeper work):
   - Density mount decision (`ops/DENSITY.md`).
   - #133 kitchen, #138 recent engine polishes, #70 exact 14 winters confirmation.
   - Art direction, Vermont authenticity, crafting line, localization.
3. **Optional later**: intentional, reviewed pack integrations only after density call and vision checklist pass. Never invent a second plot.

## Durable facts

- Main tip: `b8d621e` (2026-11-11). Last player-facing merge: #59 buried-history (isolated).
- SAVE_VERSION: 9.
- Vision: one person, death is a chapter (exactly 14 winters), Marble Vein sole plot, SNES-coat 320×240, localStorage, no romance/party/core crafting, no live geo/weather.
- Density path unmounted pending James.
- No open PRs. No vision drift observed.
- Auto-rewrite script (`scripts/write-ceo-status.mjs`) produces the minimal tip pointer on every merge.

This file is the expanded nightly record. The auto-rewrite will replace it with the tip pointer on the next merge to main.
