# DG13–DG16 — House of Names, Snow Under the Lake, Unborn Foundry, Heart of the Marble Vein

Engine-neutral content for the last four dungeons of PREINCARNATION and the four seam endings. No runtime files are modified. Nothing here invents a second mythology, a party, procedural rooms, a crafting economy, or quest markers.

The JSON under `content/` and `systems/` is the packet. `author/` is the source those files are generated from. Regenerate, then check:

```text
node author/emit.mjs
node validate.mjs
node validate.mjs --check
```

`--check` is what `endgame.test.mjs` runs. It does not rewrite `content/graph.json` or `VALIDATION_RESULTS.json`.

## Not the walk

This packet is not imported by `src/routes`, `src/components/game-app.tsx`, or the county canvas. A session prototype drew these rooms as a DOM grid with its own lectern. Mounting that on `/` would cover the Green and make a second screen the game. That conflicts with the vision, so it is not in this branch.

The game stays one person, Canvas 2D at 320×240, death as a chapter, and the Marble Vein as the only plot. Saves stay in `localStorage` under `preincarnation.save.v1`. This folder does not read or write that key, does not bump `SAVE_VERSION`, and does not add an account or a database. Tool ids and earlier-campaign flags stay `PENDING` until a later canvas pass maps them. Death inside this packet is fourteen years in the content rules, not a second death system on the Green.

`VALIDATION_RESULTS.json` is the last run: 30 checks, 0 failures, 85 dungeon rooms.

## Counts

| Dungeon | Rooms |
|---|---|
| DG13 The House Built Out of Names | 16 |
| DG14 Snow Under the Lake | 17 |
| DG15 The Unborn Foundry | 17 |
| DG16 The Heart of the Marble Vein | 35 (8 fiction, 8 fact, 8 history, 8 imagination, plus well, gate, seam) |
| Total | 85 |

`EPILOGUE.PORCH` is a terminal spawn, not one of the 85.

## What every room contains

Layout rows, door tiles, exit landings, actors, objects, transitions, a persistence block, and a solution trace. The main solution's `when` is always true, so farm / mill / crossing / family values change text and optional alternates. They do not lock a door. `unknown` is the value to pass when an earlier chapter has not been mapped yet.

Hazards name the object that tells the player, in the room, before the fall.

## Pending runtime mappings

This packet does **not** reuse unseen quest flags. Semantic ids below are the contract. `runtimeToolId` and earlier-campaign flag ids stay null / `PENDING`.

| Semantic id | Meaning |
|---|---|
| `meta.enteredFinalQuarter` | Player has reached DG13 from DG12. How DG12 sets this is pending. |
| `tool.<role>` | Twelve field-kit roles in `content/tools.json`. Map each to the real tool id. |
| `decision.farm` | `prepared`, `neglected`, `opposed`, or `unknown`. |
| `decision.mill` | same set. |
| `decision.crossing` | same set. |
| `decision.family` | `reunited`, `scattered`, `estranged`, or `unknown`. |

Prepared institutions, all four required for Distribute:

- farm = `prepared`
- mill = `prepared`
- crossing = `prepared`
- family = `reunited`

`reunited` is the only family value that can hold a share.

## Tools

Roles, not a new kit: field chain, range rod, transit glass, plumb bob, office lamp, field knife, field book, county bell, office seal, marble needle, sounding lead, borrowed coat. Every role is used by a solution, a boss script, or an ending selection. The seal is never required to finish the dungeons. Using it is remembered.

The marble needle points only inside this quarter and on water or void. It is not an overworld marker.

## Embryonic traversal

`systems/embryonic.json`. An established late-game body state for water and void, not a cult and not a companion. Hang the coat as an anchor, then cross with needle and lead. The form cannot stamp, ring, chain, plant, lamp, or cut. Death in the form returns to the anchor if one was set, else to the region checkpoint, leaves the coat as a previous body, and advances fourteen years.

## Deaths

`systems/death.json`. Every death before the terminal save adds 14 years and replaces `body.id` with `ellis-body-{deathCount}`.

Respawn is the latest **checkpoint already visited in the current region**, not the latest checkpoint in the whole dungeon. Boss rooms are not checkpoints; their antechambers are. DG16 environments checkpoint at their first room. The seam checkpoints itself.

Survives: discoveries, room clears, finished boss phases, environment completion, institution decisions, and physical seam prep (seal, chain, sockets, bell, nail jam, pages read). A coat on the seam peg changes from `current` to `previous`.

Resets: strikes, hazard tallies, the embryonic form, the unconfirmed lectern line, and `*.progress.*` indices. Actor positions return to their starts.

Death does not grant a discovery, complete an environment, or change `campaign.ending`.

After credits, `meta.terminal` is set and death does not run. The save loads the porch. Bosses do not respawn. Dungeons reopen as museums. The lectern does not offer the four choices again. A new game is another slot.

## Bosses

| Machine | Terminal success | Failure |
|---|---|---|
| `boss.empty-mayor` | Write or stamp the ordinance **vacant** after the posted roll. Do not fill the chair. | Three wrong rings crush. |
| `boss.other-shore` | Glass, lamp, bell, then an embryonic crossing that writes the word the lead already said: other. | Three steps onto the false shore. |
| `boss.surveyor-of-ellis` | Pull the ladle, record the overflow, stand outside the seal, leave the pour unfinished. Stamping "as drawn" is a mistake the plumb can crack. | Three touches of a poured copy. |

Re-entry starts at the first phase that was not finished. Finished phases persist across death.

## Endings

Eligibility is `systems/eligibility.json`. Overlap is legal. `campaign.ending` is one field. The first successful confirm locks it.

Reached (all four endings): the three bosses finished, all four vein environments complete, seam entered.

| Ending | Extra eligibility | How you commit |
|---|---|---|
| Keep | none | Write the lectern's keep line, hang the **current** coat on the seam peg, lay the needle on the crack, confirm. |
| Close | none | Write the close line, stamp the crack, latch the chain across it, confirm. The coat stays worn. |
| Distribute | all four institutions prepared | Fill farm, mill, crossing, and family sockets (each refuses aloud if that domain is unprepared), ring the bell, write the distribute line, lay the needle, confirm. |
| Refuse | the witness set below | Jam the lectern hinge with the unmapped nail, read the erased pages already in the field book, enter the embryonic form, cross the crack. No lectern line, no seal, no chain, no bell. |

Refuse witnesses, each produced by the critical-path action of one room, and each required by that room's forward door. Not an N-of-M count. Extra flags do not help. Missing any one blocks only Refuse.

| Flag | Room |
|---|---|
| `disc.erased.overseerBench` | DG13.R09 |
| `disc.quiet.windowUnderIce` | DG14.R08 |
| `disc.erased.otterNightShift` | DG14.R09 |
| `disc.erased.foundryClock` | DG15.R06 |
| `disc.quiet.rejectedPattern` | DG15.R07 |
| `disc.erased.grandListHole` | DG16.FA6 |
| `disc.quiet.heartUnmapped` | DG16.H2 |
| `disc.quiet.nailPlaced` | DG16.H8 |

`disc.erased.winterBoard` and `disc.quiet.unappointedPlaque` are corroboration. They are not in the set.

World rules written at commit:

| Ending | Seam | Fourteen-year death | Holder |
|---|---|---|---|
| Keep | open | continues | Ellis |
| Close | shut | stops; the next death is final | none |
| Distribute | open | continues; a new life is assigned by the prepared institutions | those four |
| Refuse | open, unadministered | stops, but the death is not "final" in the Close sense; nobody holds the seam | none |

Each ending then plays eight scenes (farm, mill, crossing, family, office, shore, erased names, quiet household). The four decision scenes have distinct copy for every legal value, including the socket-refusal lines Distribute speaks when a domain cannot hold a share. One action advances each scene. Credits follow. The last card differs per ending. `finish-credits` writes the terminal save.

## Files

- `content/dg13.json` … `dg16.json` — rooms
- `content/endings.json` — selection events, vignettes, credits, save
- `content/epilogue.json` — porch
- `content/tools.json`, `content/decisions.json`
- `content/graph.json` — edges from the prepared-profile walk
- `systems/eligibility.json`, `witnesses.json`, `bosses.json`, `climax.json`, `death.json`, `embryonic.json`
- `schema/room.schema.json` — shape notes; `validate.mjs` is the enforcing check
- `validate.mjs` — graph, alternates, boss failures, contradictory endings, death recovery
