# Ordinary objects, loot.common.001–240

Ellis comes back to Addison County fourteen years later. This package is the
catalog of ordinary things he can use, restore, modify, take apart, trade, and
put on a shelf. Crafting is one person at one bench. There is no factory, no
crew, and no daily output.

## What is real here

Records, handlers, recipes, a validator, and a shed stand-in. The shed keeps
its own list of objects, a local hour, and the weather outside the door.

## What is not connected

`src/reference/game-ports.ts` lists every game interface this package does not
own. Each one is `status: "missing"`. The shed does not pretend otherwise.
Results are marked `via: "workshop-stand-in"`. A stand-in is not integration.

Nothing here writes the county, the game clock, a neighbor's consent, spatial
sound, quest memory, or the game's save. The browser may keep the shed on
this device under `return-shed-loot-v1`. That key is not the game record.

## Identity

Two objects are the same purpose when their uses call the same handlers with
the same mechanical parameters. Names do not make them different. The
validator rejects that collision, a missing reference, a currency price, a
miscellaneous sell-pile, and any job that asks for a crew or a batch.

Salvage is still listed when a rule forbids taking the object apart.
