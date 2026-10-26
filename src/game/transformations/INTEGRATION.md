# Creek transformations — integration

This folder is a discrete rules bench for the twelve Marble Vein tools and the four skins. It is not the Middlebury walk.

The live game stays a SNES-style Canvas 2D room at 320×240. One person. Death is a chapter. The Marble Vein is the plot. Saves stay in `localStorage`. There is no account and no new save field. `SAVE_VERSION` is still 8.

## What already exists, and was not replaced

`src/game/engine.ts` already fires the relics on Y: dig, sugar-line zip, hammer smash, bug-net swing, lantern, homestead return, cape phase, Somaria block, powder. Shift still dashes. Those verbs are the overworld. This bench does not call them, and they do not call this bench.

`src/game/content.ts` already sets wanderer / smuggler / officer / embryo hit points and walk speeds. Those numbers are not the creek leap, breath, or cut thresholds. They were left alone.

## Name map

`correspondence.ts` is the only bridge, and it is names:

| Creek tool | Overworld relic |
| --- | --- |
| shovel | shovel |
| sugar | hookshot (Sugar-line) |
| boots | boots |
| fins | flippers |
| lamp | lantern |
| hammer | hammer |
| net | net |
| glass | mirror |
| cape | cape |
| rod | cane |
| bow | bow |
| keg | bombs |

The embryonic god on this bench is the `embryo` incarnation.

## Why the loadout laboratory is not the home screen

A DOM laboratory that replaces `/` would stop being the 320×240 Vermont walk. That conflicts with the vision, so it is not in this pull request. The executable demonstration is `runAllContracts()` and `runTechnique()`, registered in the `test` script.

## Honest limits

- Dig, zip, smash, catch, return, phase, block, and powder in the overworld are unchanged.
- No transformation here retires the others or skips the Marble Vein.
- Stations marked demonstrated are true inside this room's contracts. They are not puzzle completions on the Green.
