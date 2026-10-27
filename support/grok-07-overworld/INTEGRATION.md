# Integration

Do not mount this pack on `/`. Do not replace `src/game/maps.ts`, `src/game/geography.ts`, or `src/game/era.ts`.

The vision is one person, Canvas 2D at 320×240, death as a chapter, the Marble Vein as the only plot, saves in localStorage. A screen-by-screen county walker with its own year ledger would be a second game on top of the Green. That walker was built while authoring this cartogram. It conflicts, so it is not in this branch. `src/routes/index.tsx` and `src/components/game-app.tsx` stay as they are.

What a later import may take:

- The adjacency graph and the sealed county border (no Chittenden, no Warren, no New York shore).
- Mouth ids in `data/travel.mjs`. They are thresholds only. `support/grok-05-dungeons-09-12` already owns DG09–DG12 rooms under different names. Do not merge those rooms into these mouths, and do not rename them to match.
- Era ops that close a road or open a span. A tint change is not an era change. The validator rejects a district with fewer than three route or interaction changes.

What it must not take:

- These layouts as a replacement raster. The live map is one scroll. These are 192 rooms.
- These tool ids as new items. The shovel, the lamp, and Maeve's lantern stay the county relics.
- A save key. This pack does not read or write `localStorage`.

`node validate.mjs` is the contract. If it exits non-zero, the graph is not safe to import.
