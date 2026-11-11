# Buried History — grok-70

Campaign fiction for PREINCARNATION. Addison County is the setting only. The Marble Vein, Glass Ferry, Wick Quarry, Marrow Notch, Seminary Cut, and these finds are not county history.

Eighty objects, `loot.expansion.history.001`–`080`. Twelve discovery scenes hold twenty of them. The other sixty are survey intake: same handlers, no side quests.

## Actions

Each object is bound to either `excavate` or `recover`. Then: inspect, register, restore (or an explicit “not needed” / “the damage is the record”), use, and a refused destroy.

Registered inscriptions are append-only. `destroy`, `discard`, `burn`, and `wipe` return `campaign-evidence-locked` and leave the line in place. Uses that change a body (the dented bottle, the chain’s zero) copy the prior state into the register first.

Era changes (`pre-absence`, `the-fourteen`, `return`) do not clear evidence, initials, or use outcomes.

## Check

```sh
node --experimental-strip-types --test support/grok-70-buried-history/test/pack.test.ts
```

The desk’s Validation view runs the same records.

## Overlaps

Exact names and ids were compared with the fourteen county relics in `src/game/items.ts` (Grave shovel, Oil lamp, and the rest). None match. `loot.expansion.history` is not used elsewhere on main. Internal names, inscriptions, verbs, and outcomes are unique. Unresolved overlaps: none.

## Not the walk

See [INTEGRATION.md](INTEGRATION.md). The desk is not mounted on the 320×240 county. The Marble Vein stays the only plot. The save is not this pack's storage.
