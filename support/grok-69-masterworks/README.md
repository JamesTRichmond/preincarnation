# PREINCARNATION masterworks

Eighty pieces, `loot.expansion.masterwork.001` through `080`. Twenty weapons, twenty wearables, twenty trinkets, twenty utilities. The pack lives only in this folder and does not import `src/game`.

## What is hooked

`bindings.ts` lists every adapter.

Unavailable, and never called: `mastery.*.rank`, `mastery.*.transform`, `mastery.hollow.site`. Those APIs are not in the game at c737e42.

Available, and the only hooks the pieces use: the mirrored `rules.slashDamage`, the short iron and the rifle, relics (lamp, gap boots, cane, shovel, and the rest), pots, graves, and the quarry corridor.

## What a piece is

Each entry in `items.ts` has a behavior, a tradeoff, and a discovery. `sim.ts` implements them. There is no durability field and no repair operation. A shrine cup resets oil, ribbon, seal, phase, mask, and charge. It does not clear a stored impact, a modification, or the identity string `mw.NNN.serial`.

Old equipment stays in the yard. The Winchester still out-damages an open Margin Blade while it has rounds. The short iron wins a clinch the blade is bad at. Gap boots beat the Narrowcoat on a panic dodge. Bare hands shove farther than the Quarry Wedge on open ground. The four seed pieces worn together are not the winner of every row (`matrix.ts`).

## Proofs

`proofs.ts` runs one specific effect for each of the eighty, plus `legacyStillThere`. `effects.test.ts` also checks the catalog, the unavailable mastery bindings, swap-interrupts, form changes, resource resets, identity, and slash multiplication.

```
node --experimental-strip-types --test support/grok-69-masterworks/effects.test.ts
```

## Showcase

`ui/Yard.tsx` is the bench used to try sixteen of the pieces. The field is 12×9 at 36px, so 432×324, with page chrome around it. That is not the SNES canvas. This pull request does not mount it. `/` stays the 320×240 walk. Do not route the yard over the Green.

