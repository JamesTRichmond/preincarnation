# Mastery integration

This is a **reference module**. `src/game` is not in this workspace. The contracts below were read from `JamesTRichmond/preincarnation` at `c737e42` (save version 8) and are not imported. Do not treat the sample sentences as the finished ability library.

## What the runtime already owns

Leave these alone. This module does not write them.

| Runtime | Where | Mastery does |
| --- | --- | --- |
| Skill points, Spare Heart, Keen Edge, Long Stride, Open Sight, Shadow Step, Wraith Bond | `character.skillPoints`, `upgrades`, `spendSkillPoint` | Nothing. The desk shows the number and will not spend it. |
| Karma, crowns, afterlife host | `karma`, `crowns`, `flags.afterlifeHost` | Reads them for the Voice / the Other Voice. Does not pay Witness for karma. |
| Death | `resolveDeath` | Does not replace it. Call `deathFromGame` with the save **after** `resolveDeath` has incremented `cycle`. |
| Verbs | Space slash, hold spin, Shift dash, swim, Y-slot tools | Inscriptions only attach to those verbs. No new combat buttons. |

`deathFromGame` / `returnFromGame` return a new mastery state. They do not mutate the game save object.

## Save binding

Mastery persists separately so a runtime save from version 8 still loads.

- Key: `preincarnation.mastery.v1`
- Schema: `MasteryStateSchema` in `src/save.ts`, also `schema/mastery.schema.json`
- `validateSave` replays the journal. A bank, an owned id, or a payout that the journal cannot produce is refused. Do not coerce a bad save into a richer one.
- Equip limits (tuning, not new buttons): 6 sockets, 2 tool transformations, 3 expressed forms, 1 vow, 1 capstone. Sockets hold standard inscriptions and standard cross techniques.

Suggested call, after the existing death resolution:

```ts
import { deathFromGame, returnFromGame, validateSave, MASTERY_SAVE_KEY } from "./save.ts";

const mastery = validateSave(stored, catalog);
const closed = deathFromGame(mastery.value, gameSaveView, {
  cause: "combat", // or "hazard" | "scripted" | "release"
  deathSiteKey: `${mapId}:${tileX},${tileY}`,
});
```

`cause: "release"` is the shrine. With fewer than 2 campaign discoveries or choices in that life, the death is hollow: escrow is void, the streak increments, and nothing is paid. A later combat, hazard, or scripted death clears the streak only if that life also banked a campaign source, or the cause is `scripted`.

## Authoring records

Other sessions fill reserved ids. They do not append a 73rd inscription.

| Kind | Ids | Count |
| --- | --- | --- |
| Inscription | `quarry.ins.01` … `hollow.ins.12` | 12 × 6 = 72 |
| Tool | `tool.01` … `tool.36` | 36, three per carried tool |
| Form | `form.01` … `form.32` | 32 |
| Cross | `cross.01` … `cross.24` | 24 |

Pass overlays through `catalogFromSlots`. An unknown id is rejected. Until a slot is overlaid, it is `reserved`: visible as an id, not purchasable, not an ability. `coverage(catalog).complete` stays false until every slot is authored. The reference build must keep that false.

Witness sources are `src.discovery.*`, `src.encounter.*`, or `src.choice.*`. Ids that look like death, suicide, release, or farm are rejected. Amounts come from the source, never from the caller.

## Economy

- Campaign sources bank immediately, once per campaign.
- Life sources escrow. They pay on a qualified death, then at half, then never. All of them together stop at 6 Witness.
- Purchases happen only in `afterlife`, and several are allowed before return.
- Respec at the desk refunds what was paid, except a bound gift and anything a bound gift still requires.
- Reconfiguration (equip / set down) is free in the afterlife and locks on return.
- Effects that share a verb and a channel, or that list each other in `excludes`, cannot be equipped together. Owning both is allowed so the desk can switch.

## Projection

`projectRuntime(state, catalog)` is what combat may read later: modifiers grouped by existing verb, plus forms, vow, and capstone. `libraryComplete` is hardcoded false on that projection so a caller cannot mistake the sample for the full book.
