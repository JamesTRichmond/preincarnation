# Encounter balance

Open-field model of the seven enemy kinds already in `src/game/engine.ts`. Does not replace the roster, and does not replace the 320×240 walk.

```bash
node support/grok-22-balance/run.mjs
node --experimental-strip-types --test support/grok-22-balance/balance.test.ts
```

`run.mjs` writes `output/execution.json` and `output/tables.md`. Findings are in `REVIEW.md`. Read `INTEGRATION.md` before wiring any of this into the county.

The combat patch is empty on purpose. The first pass did not show a defect a number change would fix. The second pass, in `model/second-pass.ts`, stands still and swings late. A planter is safe from the bear. Late hands are not. That is not a health-bar defect, so `patch/tuning.json` stays empty. Recovery rules are invariants.
