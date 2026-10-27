# Harrowford community play

Owned surface: `support/grok-44-community-play/`.

This is the relationship and tradition layer for Preincarnation. It does not rebuild cards, cooking, fishing, tracking, music, or traversal. Those sessions register a live module if they are present. In this build they are not mounted, so every heat is an authored fixture and the screen says so.

## Register a live minigame

```ts
import { registerLiveModule } from "./src/adapters/registry.ts";

registerLiveModule({
  moduleId: "cooking",
  ownerHint: "the cooking session's package id",
  play(input) {
    return {
      outcome: "managed",
      narrative: "What the real stove decided.",
      rivalLines: [],
    };
  },
});
```

If `play` throws, the heat is marked a live failure. It is not quietly replaced with a fixture.

## What the parlor is not

No planting, stores, tithes, or campaign locks. Prizes are tins, letters, sketches, tunes Sable wrote, and places at a table. Skipping a gathering files an absence. The life continues.

## Not the walk

This pack is not imported by the county. `src/routes/index.tsx` still mounts the 320×240 canvas. Putting the parlor on `/` would cover the Green and make a second screen the game. That conflicts with the vision: one person, death as a chapter, the Marble Vein as the only plot.

The gatherings are optional fiction beside that walk. Skipping one does not fail a life, and this module does not read or write `preincarnation.save.v1`. Its own key is `preincarnation-community-play-v1`. Nothing here opens the quarry.

Live cards, cooking, fishing, tracking, music, and traversal are not rebuilt. Until those sessions register a module, every heat is an authored fixture and says so.

