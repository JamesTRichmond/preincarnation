# Ash Bend household loot

Pack id `grok-75-household-loot`. Catalog ids `loot.expansion.home.001`–`loot.expansion.home.080`. This folder is the whole pack. It does not replace the homestead memory room’s display, letters, or music.

## What the homestead keeps

Pass a `HomesteadHost` into `interact` and `bindDisplay`. The pack only notifies:

- `letters.open(letterId, sourceInstanceId)` when the beeswax reading lamp is lit. The letter id is `letter.ash-bend.margin`. Do not mount a second letters UI.
- `music.cue(motifId, sourceInstanceId)` when an instrument, chime, or clock actually sounds. Motifs live in `src/motifs.ts` as original pitch lists. The house music system may ignore, record, or play them.
- `display.focus(slotId, sourceInstanceId)` when an object is bound to a display slot.

Display slots this pack knows: `display.mantel-memory`, `display.letter-stand`, `display.window`. A bound object is removed from the floor. `visiblePlacements` will not return it. `releaseDisplay` sends it to the loft rather than dropping a second copy on the last anchor. Two objects cannot share a slot.

## Identity and shared bindings

Each catalog entry has one saved identity: `inst.` plus the catalog id. Era changes, packing, and the three arrangements move that identity. They never clone it.

`bindingsOf(save)` is the shared-room projection: instance id, room id (`room.ash-bend`), anchor, rotation, support, container, display slot, packed flag. `applySharedBindings` copies those fields onto an existing roster and ignores bindings for any other room. It does not create instances, so a visitor session cannot duplicate a showing.

`RoomSave` is version 1. `serialize` / `deserialize` / `repairSave` keep the roster at eighty, drop duplicate ids, clear an anchor if the same object is also packed, contained, or on display, and put out a lamp the current era cannot burn.

The furnished-room screen stores that save under `preincarnation.loot.household.room.ash-bend`. The screen is a harness. Point it at the real host when the homestead is present; do not let the harness become the letters desk or the display wall.

## Placement

Places are named anchors, not an inventory grid. `openAnchorsFor` lists the ones that fit. `place`, `rotate`, and `pack` are the only moves. The doorway anchor accepts nothing. Anything left there, or anything covering the window latch or the hearth damper, shows up in `assessRoom`. `fixRoom` shifts the offender to an open place or the loft.

A tray or other `requiresSupport` object can sit on a built-in surface (mantel, table, shelf) or on an object with `providesSupport` (the whittling bench, the keepsake chest). Packing that support rehomes whatever was resting on it. Nothing is left hanging on a missing id.

## What objects do

Every entry has a behavior record in `src/records.ts`, executed by `runBehaviorRecord`. The verbs are illumination, sound, organization, serving food that is already in the pantry, reading an era line, showing a craft once, or answering Mara Ell. Craft does not repeat a yield. The churn will not invent milk. Containers refuse what they are not for. Retired objects stay in the room and stop doing the work the year does not have.

Arrangements `evening`, `workshop`, and `company` are three ways of setting the same twenty objects out. The other sixty stay in the loft until someone names a place for them.

## Checks

`npm test` runs `tests/household.test.ts`. It covers the eighty records and the room checks: blocked exits, covered controls, duplicate display, removed supports, era identity, save/load, and shared bindings.
