# Situation schema

Every record in `situations` has the nine placement aspects below. The survey archive in the walk prints them. `validate.mjs` rejects a record that is missing one, that repeats a unique item, or that points a concealed clue at itself.

## Location

`districtId` must be one of the twelve districts. `siteId` is the place inside it. `dungeonId` is null or one of the sixteen underplaces. `mapRef` names the owning map session, an anchor id (`anchor.<situation id>`), and, on the bend, a local tile. `mapRef.note` tells the map session not to overwrite its own ground. `playableInFragment` is true only for the bend demo.

## Container

`presentation.kind` is one of `container`, `world-pickup`, `on-character`, `hidden-compartment`, `buried-cache`. `presentation.prop` is the physical thing a person would see: a crock, a chewed strap, a drill steel, a coat on a nail. Not a chest number.

## Ownership

`ownership.ownerName`, `claim`, `posture` (`none`, `refuses`, `borrow`, `offering`), and `presentIn` (eras when a living owner can stop you). `refuses` requires both refusal copies. A borrowed tool's consequence is chalk and a journal line.

## Contents

Each content has `itemId`, `name`, `kind` (`ordinary`, `equipment`, `relic`, `provision`, `collectible`), `blurb`, `obtainable`, `eraAvailable`, and, when it cannot be taken, `unavailableReason`. Unique ids occur once. `tool` sets `tool:<id>`. `opens` sets a gate. `spoilsOnReturn` rewrites the satchel entry when the years move forward. `onEnterReturnGrant` is how a carried page can close a quest without being re-read.

## Discovery clue

`clue.text` is a sentence a person could have learned. `clue.sourceId` is a real situation. `clue.honest` is true: decoys are labeled as decoys in the prose (the numbered mother tree, the red bollard, the will that is not the ring), not as lying markers that hide a reward.

## Prerequisites

`prerequisites[]` with `type` (`clue-read`, `tool`, `item`, `flag`, `gate`, `era`, `quest-stage`) and `failCopy`. The first miss is the only line, and it is journaled once.

## Interaction

`interaction.verb`, `successCopy`, `blockedCopy`, `examinedCopy`. Refusals add `ownedRefusalCopy` and `refusalRepeatCopy` (the repeat does not journal again). Quest locks add `heldCopy`. Fixtures add `rereadCopy`. The chapel is the only `special`: `chapel-offering`, with `takeBefore`, `leaveBefore`, `returnAfterLeft`, `returnAfterTook`, and `returnFresh`.

## Persistence

`persistence.key`, `respawn` (`never`), `fixture`, `questLock`, and a `note` that says what does not come back. `quest.id` plus `quest.release` (`era` and/or `flag`) is required when the lock is on. The release flag has to be granted by some record's `grants` or by `onEnterReturnGrant`.

## Era

`era.before` and `era.return` each have `available` and `state`. The return also has `change`: what the fourteen years did to this particular thing. Both eras stay available as interactions; the yield inside them is what changes. A situation the first life cannot complete still has a true sentence for that year.
