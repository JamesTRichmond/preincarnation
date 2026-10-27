# PREINCARNATION: CEO Status

_Updated Tue 2026-10-27, ~06:15 UTC, after merge of PR #135.
Main tip at `043d4fb` (STATUS rewrite after merge of #135 at `5f974c9`)._

## Health of main (`5f974c9` / tip `043d4fb`)

| Gate | Result |
|---|---|
| CI verify | green on PR #135 head (success) |
| `tsc --noEmit` | clean (author evidence) |
| Audio-bed tests | pass, including distinct frequency per live kind (crow/wraith/sentinel/bear/bobcat/fisher/resident) |
| SAVE_VERSION | remains 9 |
| Engine / live touch | yes, minimal: `audio.hit(e.kind)` in engine.ts; same oscillator mixer |
| County save | unchanged |

Prior typecheck/build/smoke inherited from recent main. Full re-smoke recommended on next cycle.

## What changed in this run

| PR | What | Result |
|---|---|---|
| #135 | Let each body answer a hit in its own note. Crow, wraith, sentinel, bear, bobcat, fisher, resident use distinct StrikeVoice (freq/dur/type/slide). Bomb and unknown stay the old thud. Same procedural mixer. No new creature/system. | merged by James at `5f974c9` (head `ae589f9`); tip advanced via STATUS rewrite to `043d4fb` |

Vision Checklist fully satisfied: Marble Vein sole plot (no new plot); death advances exactly 14 winters as chapter (unchanged); one person, no party/romance/crafting; 320×240 Canvas/SNES-coat preserved; localStorage/SAVE_VERSION=9 respected; live audio polish intentional and approved by merge; support packs unaffected.

## Durable facts

- Enemy max HP does not grow with the cycle (from #107). Tropoverse is one place.
- Skill on death remains capped (from #83). SAVE_VERSION is 9.
- Death math: exactly 14 winters. No live geo/forecast/weather tax (Ruling #70).
- Marble Vein tell from #86 remains (lantern gate kept).
- Install shell (/manifest.webmanifest + /sw.js) does not cache the save.
- Density path unmounted (ops/DENSITY.md); James-human call.
- Strike voices now distinguish live bodies without changing combat math or save.
- Node ≥ 22.12 required. Tests by glob.
- Process: PRs authored as JamesTRichmond; merges after verify; no force-push. Auto STATUS rewrite on main merges.

## Open risks / backlog

- Many historical STATUS-update PRs remain open and stale relative to current tip; rebase or close as superseded.
- Support packs (e.g. #59 buried-history, #49 waterside, #42 quarry rules) still open; none blocked by this audio change.
- Live engine stability high; next priorities: clear remaining open PRs that are vision-aligned and green, then intentional density/a11y/audio polish as approved.
- QQ-VGEF: no impact; pure feel/audio addition within existing mixer.

This file supplements the auto-rewrite. If SHA drifts, the script has not run since last merge.
