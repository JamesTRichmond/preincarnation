# PREINCARNATION: CEO Status

_Updated 2026-10-29. Main at `e53ade5` (post-feel/audio polish)._

## Health of main (`e53ade5`)

| Gate | Result |
|---|---|
| SAVE_VERSION | 9 |
| Vision | Marble Vein is the only plot. One person. Death is fourteen winters. 320×240. No accounts. No live geo or weather. |
| Density path | Not mounted. See ops/DENSITY.md. That call is James's. |
| Tests / CI | Recent merges green; known pre-existing persistence pin issues documented. No Sev1/2. |

## Still true

- Enemy max HP does not grow with the cycle. Tropoverse is one place.
- Skill on death stops at the ranks that are left. SAVE_VERSION is 9.
- Death is exactly fourteen winters. No live location and no weather tax.
- The marble tell keeps the lantern gate.
- The install shell is /manifest.webmanifest and /sw.js. It does not cache the save.
- Support archives stay beside the walk until the density call.
- Feel polish landed: hitstop, ground steps, per-creature strike voices, coat lunges, first-stone lines.

## QQ-VGEF Gap Matrix (2026-10-29 audit)

Estimated band: **78–82%**.

| Pillar | Weight | Estimate | Gaps / notes |
|---|---|---|---|
| Primary Core | 50% | 80% | Feel/progression/tell strong after #80/#135–#137. Live narrative pacing still thin (density unmounted). Latency harness missing. |
| Secondary | 20% | 68% | A11y scales, contrast, reduced motion, magnify, PWA, kitchen, satchel present. Full audit and onboarding polish remaining. |
| Structural Integrity | 20% | 90% | Tests extensive, sole-plot enforcement, CEO rewriter, save integrity. Stale conflicting PRs (#38 superseded, #42/#49/#59 dirty). |
| Innovation | 10% | 80% | Reincarnation-as-chapter + sole Marble Vein strongly enforced. Selective bonds and SNES coat hold. Deeper optional agency awaits density call. |

Weighted: 0.5×80 + 0.2×68 + 0.2×90 + 0.1×80 ≈ 79.6%.

## Prioritized next actions

1. Bot-ready: feel-latency probe (frame budget, attack buffer, hitstop, step timing) — isolated, no engine/save touch.
2. Bot-ready: a11y comfort audit on live shell (scales, contrast, reduced motion, title gate, mobile overflow).
3. Bot-ready: rebase or close stale support PRs (#38/#42/#49/#59) against current main.
4. James-human: density path decision (ops/DENSITY.md) — required before any selective mount.
5. James-human: remaining decisions on kitchen (#133), recent engine touches (#138), art/audio direction (#65).

## Open work

Player-facing pulls that still conflict with main are not in this tip. Status-only pulls do not change the walk.

This file is rewritten by `node scripts/write-ceo-status.mjs` on merge. The QQ-VGEF section is the audit record; re-apply if the script overwrites.
