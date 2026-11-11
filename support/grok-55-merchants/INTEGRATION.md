# Integration

The County Book is a posted-price stall ledger for twelve Addison tables across six generations. It stays beside the canvas.

## Vision

PREINCARNATION is one person, Canvas 2D at 320×240, death as a chapter, and the Marble Vein as the only plot. Saves stay in `localStorage` under `preincarnation.save.v1`. There are no accounts and no database.

A full market screen on `/` would replace the Green. That conflicts with the vision, so `ui/market-app.tsx` is not imported. `src/routes/index.tsx`, `src/components/game-app.tsx`, `src/game/engine.ts`, and `src/game/save.ts` are unchanged.

## What already exists

`src/game/loot` already has merchant custody and merchant scrip. That system is the grounds record, and it is not this book. This pack does not import it, does not edit it, and does not move scrip. The mark is a separate unit used only inside this folder. Do not rename scrip to marks, and do not write marks into the life save.

## If someone mounts it later

- Keep the walk. A stall talk on the canvas is the fit. A second route that hides the 320×240 frame is not.
- Do not bump `SAVE_VERSION` unless the life itself stores a stall purse. This book uses `preincarnation-county-book-v1` and only when the UI is actually opened.
- The paper, lake, and copper classes in the UI are not in the game stylesheet. They would need tokens before the desk is visible.
- Quote, then commit. Cancel is not calling `commit`.
