# PREINCARNATION: CEO Status

_Updated 2026-10-27T13:20:00Z. Main tip ~`dbe4797` (post-#136 ground-step). Auto-rewrite script still authoritative for SHA; this audit overlays QQ-VGEF._

## Health of main

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. Theme map enforced. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Tests | ~522+ game tests claimed green on recent merges; platform template drift known and isolated. |
| Open PRs | Stale support packs (#38, #42, #49, #59) likely superseded; close or rebase after review. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Recent live polish: ground step audio, hit voices, county second lines, bag/grave/magnify/satchel, kitchen (optional), PWA shell, theme fold, no Heart second-plot choices.

## QQ-VGEF Gap Matrix (2026-10-27 audit)

**Primary Core (50%) — estimated 88%**
- Strengths: Sole Marble Vein plot locked (theme.ts + test). Exact 14-winter death. One person enforced. SNES 320×240 preserved. First-life Maeve/shovel/east. Marble tell + lantern gate. Skill cap. No second plots.
- Gaps: Live narrative pacing still thin relative to optional bible (Ellis/eras not mounted). Combat feel improved (hitstop, voices, steps) but enemy AI/behavior and variety remain basic. Onboarding beyond first life light. Death chapter reading/feel could be richer without new systems.

**Secondary Systems (20%) — estimated 78%**
- Strengths: Bag names, grave numbers + preferential sip + undo, magnify a11y (no door mark), satchel desk (isolated), kitchen pause overlay (mood not heal, no hunger), audio beds + step/hit voices, PWA install shell.
- Gaps: Full a11y pass (contrast, reduced motion depth, text scale). UI chrome polish and mobile feel. Inventory/satchel not fully live-integrated. Localization undecided (james-human). Optional packs not density-mounted.

**Structural Integrity (20%) — estimated 86%**
- Strengths: Strong test suite (500+), typecheck/build gates, SAVE_VERSION migration discipline, support packs isolated, STATUS auto-rewrite, no hunger/factory/random essentials, CI verify on merges.
- Gaps: Stale open PRs and james-human decision backlog. Known platform test drift (share card). Performance/particle caps present but broader robustness (save export already added). Density path unmounted by design.

**Innovation (10%) — estimated 72%**
- Strengths: Reincarnation as chapter (not trophy soul). Selective bond persistence (Maeve lantern). Marble Vein as sole mechanical/narrative spine. Folded county sphere named and constrained. Theme lines map every verb.
- Gaps: Live expression of successive lives still sparse (second lines on NPCs is a start). Unrealized-lives chalk/vein mechanic underused in play. Era/body displacement from bible not in live canvas without second-plot risk.

**Weighted estimate: ~84% (Primary 44/50, Secondary 15.6/20, Structural 17.2/20, Innovation 7.2/10).** Band: solid mid-80s, vision-locked, polish-ready.

## Prioritized next actions (vision-compliant)

1. Close or archive superseded open PRs (#38 skill already merged via #83, others support-only).
2. Bot-ready: deepen combat feel (enemy telegraph variety, hit reaction consistency) without new systems or HP scaling.
3. Bot-ready: onboarding polish for lives 2+ (subtle bond recall, chapter-end clarity) — no party, no romance.
4. James-human: density mount decision (ops/DENSITY.md); kitchen keep/gate (#133); art/audio SNES coat final call.
5. Optional: live-narrative seams from bible that reinforce sole plot only (no new rooms/quests).

This file may be overwritten by `node scripts/write-ceo-status.mjs` on next merge. Audit section is intentional overlay.
