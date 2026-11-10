# PREINCARNATION: CEO Status

_Updated 2026-11-10. Main tip at `0309ae5` (STATUS rewrite after #141)._

## Health of main (`0309ae5`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is exactly fourteen winters. 320×240 SNES-coat. No accounts, no live geo/weather, no hunger/party/romance/crafting core. |
| Density path | Unmounted. See ops/DENSITY.md. James-human decision. Support packs stay beside the walk. |
| Tests | Game tests green on recent merges (hundreds pass). No Sev1/2. |

## Still true (vision intact)

- Enemy max HP does not grow with cycle (#107). Tropoverse is one place.
- Skill on death caps to remaining ranks (#83). SAVE_VERSION 9.
- Death is exactly fourteen winters (#78). No weather tax or live location.
- Marble Vein tell keeps lantern gate (#86). Place underfoot and county tell live (#104).
- Install shell /manifest.webmanifest + /sw.js caches shell/art only, skips save (#116).
- Theme map ties every live verb to the sole plot (#117). Spectrum named as folded county, not second plot (#127).
- Comfort/a11y, audio beds, particle caps, kitchen-from-pause, local export/import, first-life line landed (#130).
- Approved bag names, grave numbers, magnify (no door mark), isolated /satchel (#131).
- County second lines grant nothing (#134). Distinct hit voices (#135). Ground-step audio (#136). Coat/glass/stone polish (#137).
- Preview client secret removed from source (#140).

## QQ-VGEF Gap Matrix (estimated 2026-11-10)

| Pillar | Weight | Score | Notes / Gaps |
|---|---|---|---|
| Primary Core (feel, progression, narrative pacing around reincarnation + Marble Vein) | 50% | 88-90% | Strong after feel, tell, audio, kitchen, skill cap, first-life, coat. Gaps: formal latency harness / probe, subtle onboarding/pacing polish. |
| Secondary (UI / accessibility / comfort) | 20% | 74-76% | Magnify, reduced-motion, high-contrast, pause kitchen, controls toggle present. Gaps: formal a11y checklist / audit, more focus/screen-reader coverage. |
| Structural Integrity (tech debt, tests, stability) | 20% | 91-93% | SAVE migrations solid, tests green, no vision breaks, auth hygiene. Gaps: stale open PRs (#38 superseded, #42/#49/#59/#139 dirty bases), template drift in platform tests. |
| Innovation (reincarnation + sole Marble Vein) | 10% | 87-89% | Sole-plot enforcement strong (theme, spectrum, no second-plot choices). Density remains the human gate. |
| **Overall band** | **100%** | **85-89%** | Healthy, vision-aligned. Path to 95%+ is polish + human calls, not new systems. |

## Open work / prioritized next actions

1. **Bot-ready**: Latency / feel probe harness (measure hitstop, step, audio sync; no engine rewrite).
2. **Bot-ready**: Formal a11y checklist against live 320×240 + magnify (document pass/fail, no new systems).
3. **James-human**: Density path call (mount reviewed support piece or leave unmounted). See ops/DENSITY.md.
4. Close or rebase stale PRs: #38 (superseded by #83 — recommend close), #42/#49/#59 (support packs, dirty), #139 (docs, stale tip).
5. Audio coherence pass (beds + hits + steps already strong; optional consistency notes).

Support archives remain isolated until density call. No second plot. The job continues.

This file may be rewritten by `node scripts/write-ceo-status.mjs` on merge; the matrix above is the audit record.
