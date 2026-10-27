# Integration

Do not mount this on `/`. The county walk is the game: one person, Canvas 2D at 320×240, death as a chapter, the Marble Vein as the only plot. A balance bench on the Green would replace that.

`src/routes/index.tsx`, `src/components/game-app.tsx`, and `src/game/` are not edited. Saves stay in `localStorage`. There is no account and no database.

`patch/tuning.json` has an empty combat block on purpose. The runs did not show a defect that a number change would fix. `patch/recovery-rules.json` records what death already keeps, and what a later pass must not "fix" with a larger health bar.

## What the two models are

`model/sim.mjs` is the first pass: open-field spacing and assisted play. `model/second-pass.ts` is that same loop, plus a planter who does not move and hands that swing 200ms late. `balance.test.ts` checks they still agree on the published spacing rows.

Neither file is imported by the walk.

## Overlap

`support/grok-09-combat` is a different roster: forty authored enemies, rites, and a state machine. This pack replays the seven kinds already in `src/game/engine.ts`. Do not copy that roster in, and do not copy this model into that sim.

## Known drift, left alone

Checked against `src/game` on main `b2d93df`. Enemy HP, the +12% cycle term, tropoverse ×1.35, hurt 0.22, contact hurt 0.4, the 12px bite, the 10px shove, the speeds, and the slash and spin formulas still match the snapshot pinned at `c737e42`.

Two differences are noted, not patched:

- In the county, `wraithBond` multiplies every enemy by 0.65. This model only slows wraiths. That is how the late rows in `output/tables.md` were produced.
- After [#86](https://github.com/JamesTRichmond/preincarnation/pull/86) the live Sentinel holds gold for 0.6s, then lunges. `stepSentinel` is not called from this model. Sentinel times in `output/tables.md` are the older continuous walk.
