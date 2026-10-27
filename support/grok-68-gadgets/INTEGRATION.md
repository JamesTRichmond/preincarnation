# Addison gadget pack

Eighty practical curios, `loot.expansion.gadget.001`–`080`. Clockwork, optical, sonic, fittings, and field instruments from a second life in Addison County, fourteen years on.

This pack does not replace the county walk. The Marble Vein stays the only plot. Death stays a chapter. The canvas stays 320×240 and one person. Saves stay in `localStorage` under `preincarnation.save.v1`. This module does not read or write that key.

`ui/GadgetBench.tsx` is the instrument for the twenty pieces that have a place (porch, vigil, loft, counter, creek, orchard, study). Mounting it on `/` would cover the Green. That conflicts with the vision, so nothing in `src/routes` or `src/components/game-app.tsx` imports it.

The bench's own afternoon, if something later imports it, would use `preincarnation-gadget-bench-v1`. That key is unused until then. `SAVE_VERSION` is unchanged.
