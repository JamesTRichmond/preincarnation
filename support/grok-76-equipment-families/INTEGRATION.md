# Family loot — integration notes

This pack lives only in `support/grok-76-equipment-families/`. It does not edit `src/game`. The county keeps its own save (`preincarnation.save.v1`, version 8). This ledger uses `preincarnation.family-loot.v1`.

## What the live game already is

PREINCARNATION, as of `c737e42`, has:

- Four bodies: `wanderer`, `smuggler`, `officer`, `embryo` (`IncarnationId` in `src/game/types.ts`).
- Six disciplines, already named on the limbo sheet: Edge, Stride, Sight, Shadow (`shadowStep`), Bond (`wraithBond`), Vitality. Pieces **lean** toward one. They do not spend skill points and do not require a rank. A discipline is not a seventh slot and not a damage multiplier.
- Three things a body can actually wear at once:
  - **Hand** — `save.equippedId`, one weapon.
  - **Y** — `save.flags.ySlot`, one relic whose `slot` is `"Y"`. Q cycles owned Y relics; it does not equip five of them.
  - **Worn** — one passive. The live flags still let boots, flippers, and the sword sit “on” together. Family pieces refuse that. They compete for a single worn slot. Core relics are not family pieces and are not overwritten here.

A family is five pieces. At most three of them count only while equipped, and those three use Hand, Y, and Worn once each. The other two are **carried** or **used**. They count only because that piece says so. Carrying a hand-weapon does not count. A second copy of a piece never counts.

## Call surface

```ts
import { resolve, grantPiece, removeInstance, changeBody, tryEquip, fight, serializeLoadout, hydrateLoadout } from "./index.ts";
```

- `resolve(loadout)` is pure. It returns recognized families, partial pairs, count notes, sidegrades, rejected reasons, duplicates, the modifier list, and the stats.
- `tryEquip` refuses a wrong slot, a pack piece, a body that cannot wear it, or a filled slot. The loadout is unchanged.
- `changeBody` is the form change. Illegal worn or used pieces drop to carried and stop counting. The feedback says what ended.
- `removeInstance` drops a piece and reports which partials and which bargain ended.
- `compareResolutions(before, after)` is the same report the bench shows.
- Modifier order, always: for each phase `piece`, then `pair`, then `count`, then `sidegrade`: all `add`, then all `mul`, then `capMax`, then `capMin`. Inside a phase, sources sort. Piece sources are `piece/0` Hand, `piece/1` Y, `piece/2` Worn, `piece/3` carried, `piece/4` used. A sidegrade can cap a number an earlier piece raised. That is the tax.
- `fight` is a bounded loop, at most 24 rounds. Oil never goes below 0 or above `oilCap`. Breath (`mp`) never goes below 0 or above `maxMp`. Healing spends breath at 1 breath per 2 points and cannot exceed `sustain`. A dry carbide lamp stops counting as light. Black shift sets `oilDrain` to 0 and pays for it in a flood.

## Authored routes, not a drop table

Every piece has one place, one thing you notice, and one way it leaves that place. Nothing rolls, nothing restocks, nothing paints a pin. `rollWeapon` must not emit these ids. A second visit finds the nail empty. Discovery text does not name the bargain. The bargain is printed here and on the bench, and in the county only once five pieces are actually recognized.

Bodies that cannot wear a piece are on the piece (`bodies`). The embryo cannot complete the unnamed witnesses. The officer cannot wear the boot dirk, the false lantern, or the second skin. Changing form is allowed; the piece stays in the pack and the count falls.

## Why a full set does not eclipse a mixed hand

Each sidegrade has at least one gift and one cost. The arena checks four complete families against mixed hands:

| Bargain | Home, where it is better | Where a mixed hand is better |
| --- | --- | --- |
| Stillwater (flood) | Otter Creek in flood, against its own three pieces | Taproom. The ceiling and the slow arm arrive late. |
| Black shift (quarry) | Quarry after dark. The lamp does not drink. | The flood. The mixed creek lamp still has warmth. |
| Closed orchard | The dusk beast | The long cold. A bucket and a shearling knit; the closed orchard does not. |
| The record | The unscheduled hearing | The taproom. A dirk with no cap ends it first. |

## Wiring later, still without this folder reaching into `src/game`

When the county is ready to wear these, add one field, `flags.familyLoot`, shaped as `Loadout`, and call `resolve` from the damage path **after** the weapon and the Y relic and **before** the hit is applied. Do not raise `SAVE_VERSION` inside this pack. Map Hand onto `equippedId` only for pieces whose slot is `hand`; map Y onto `ySlot` only for pieces whose slot is `y`; map Worn onto one new field. If that field does not exist yet, keep the ledger save separate, which is what the bench does now.

Do not add a fourth slot to make a five-piece set equippable. The second pocket is carried cloth. It is not a slot.
