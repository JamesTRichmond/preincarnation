# grok-50 provisions

Loot ids `loot.provision.001`–`120` only. Dishes stay `cook.dish.001`–`048` on the cooking-session port. This folder does not rename those plates and does not file them as provisions.

The cooking session was not mounted in this workspace (`JamesTRichmond/preincarnation` had no dish module). `SESSION_PORT` in `engine.ts` is the adapter snapshot. Pass another `{ owner, dishes }` into `cook()` and the book swaps. Heat, timing, and hunger are not reimplemented.

Storage does not spoil. Death adds fourteen years, drops pouch and creel on a grave, and leaves the cellar and tin. Effects end. Flags such as the palate can remain.

Natural history is `verified` or `fictionalized` on every provision and every plate. Fictionalized loot is quarry marble dust and the ghost morel. Fictionalized plates are marble custard, fourteen-winter hash, and soloverse broth. A few real plates carry a fictionalized gift (cache-glow, old-orchard trade). Those gifts are not damage.

The Green stays the 320×240 canvas. This camp book is the `/kitchen` route. It keeps its own `localStorage` key, `preincarnation.provisions.v1`, and does not migrate or rewrite `preincarnation.save.v1`.

Generate the catalog with `node support/grok-50-provisions/generate.mjs`. Ledger: `node --experimental-strip-types --test support/grok-50-provisions/validate.test.ts`. The game suite runs the same ledger from `src/game/provisions.test.ts`.
