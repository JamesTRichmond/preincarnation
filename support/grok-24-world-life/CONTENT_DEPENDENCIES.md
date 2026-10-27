# Content dependencies — world life

The narrative pack was not in this workspace. `/workspace/artifacts` holds an unrelated “Stay” ledger (film, relight, wet city). Nothing there names Ellis, the six eras, lineages, or quests.

This module therefore does **not** invent surnames or family trees. Other sessions can replace seats without rewriting routines.

## Unbound, and what the pack should supply

| Need | What the module does instead | Pack should provide |
|---|---|---|
| Six era names | `return.1` … `return.6`, plate titles “First return” through “Seventy”, years 0, 14, 28, 42, 56, 70 | Canonical era ids and titles. Keep the 14-year step or say otherwise. |
| Who holds each post | Occupational seats only: Miller, Cooper, Printer, Smith, Clerk, Dairy hand, Orchardist, Hay hand, Fence mender, Well keeper, Ferry hand, Net mender, Caulker, Fish seller, Sailmaker. Actor id `role.*#n` | Real people, the lineage that inherits the post, and the memory of Ellis |
| Memory lines | Six authored tags cycled by return index, same for every role | Per person, per return, how they remember Ellis |
| Quest graph | Three fixtures on Middlebury seats: `fixture.delivery`, `fixture.freshet` (priority 30), `fixture.ledger` (priority 10, loses a conflict, would block polite talk) | Real quest ids, stages, priorities, and whether they block polite talk |
| Which intervale | Plate called “The intervale”. Cornwall and New Haven are both plausible; neither is claimed | The farm community’s true name and households |
| Which landing | Plate called “Otter landing”. Not assigned to a historic yard or family | The waterside settlement and its boats |
| Middlebury shops | Mill, print, smithy, scales, cooperage as **places of work**, not owned businesses | Who kept those shops in each return |
| Sail loft, return 6 | Successor left null on purpose so a missing heir becomes a shuttered post | Whether that loft is actually empty, and who if anyone nails the note |

## Stable contracts the pack can fill

- `EraHolder` in `src/types.ts` — one row per role per return. `actorId: null` means vacant post.
- `QuestOverride` — `source: "pack"` when the quest file arrives. Same conflict rule: higher priority wins, then lower quest id.
- Routines stay on **roles**, not on biography. Swapping the miller’s name does not move the stone or the race.
- Essential talk never waits on a beat. Polite talk at a private post (the cheese loft stair) reports at most the remainder of a beat, and no beat is longer than 24 sim ticks.

## Explicitly not simulated

Hunger, wages, weather, shop inventory, aging clocks, and “alive because they wander.” Aging is substitution at a return boundary. If the way is blocked, the person goes to that hub’s open ground and resumes the same post when the way clears.
