# PREINCARNATION — dungeons 5 through 8

Content pack only. It does not change combat code, overworld code, or any other session folder.

Sixty-five rooms, hand-authored, not procedural: the White Library (16), the Reservoir Without a Surface (17), the Iron Hayloft (16), the Lantern Court (16). Each room has a floor, solid, water, hazard, and object layer, exits, interactions, a solution trace, persistence, and reset rules. Puzzle and boss graphs are expanded to explicit states and edges in the JSON.

Setting is Addison County only: Merchant's Row in Middlebury, the lower Weybridge race, a Cornwall intervale barn, a Vergennes annex that is not City Hall. Ellis Perch is one person across bodies. A death in these dungeons advances fourteen years and returns the body to that dungeon's entrance.

## How the four are guarded

The Library never asks for a typed word. Date wheels have two faces, and the scratched face is the date written on the wall in that room. Shelf labels, book signs, and tokens are physical matches to a diagram in the same room.

The Reservoir's main walk, boss, and return do not use creek fins. `W` is permanent deep water and pushes a body without fins to the nearest shore for no damage. Race cranks sit only in rooms that cannot flood. The unsounded cistern is optional and fins-only; its ladder is the exit.

The Hayloft puts every block on a rail that cannot cover a door or a crank. Unsolved rails reset on leaving and on death. Solved latches stay open. The block rod is required at the door, not discovered in a room where its absence would trap the walk. Boots can cross the fan; the lever on the quiet floor is the real stop.

The Court writes copied actions on a visible rail (index, verb, direction, actor). An exemplar loops the sequence and the same sequence is cut into the room. A wrong beat or the clerk's bell returns the rail to empty and does not take keys, evidence, or latched doors. During the Witness fight the bell keeps hits already landed, and the lunge is chalked on the floor before it happens.

DG08 adjournment is the proposed event `preincarnation.crown.resolved` (crown 2, the Lantern Crown). It contributes to Embryonic God eligibility and does not grant it. The event is not an existing runtime API. Crown 1 is not defined here. See `integration/second-crown.event.json`.

## Routes

| Dungeon | Main steps | Shortcut | Shortcut steps | Optional rooms |
|---|---:|---|---:|---|
| DG05 White Library | 26 | Index Hall to the sealed carrel after that carrel is solved | 12 | Gallery of Suppressed Names |
| DG06 Reservoir | 23 | Loft bridge back to the sluice after the ratchet | 14 | Upper Loft; Unsounded Cistern (fins) |
| DG07 Iron Hayloft | 25 | Nave roof door to the antechamber after the east mow | 13 | Powder Loft |
| DG08 Lantern Court | 26 | Docket hall to the crown threshold after the playable record | 6 | Jury Loft; Face Gallery |

Keys are one source, one lock. DG05: shelf, margin, optional dust, erratum. DG06: penstock, sounding. DG07: mow, saint. DG08: cage, lantern.

## Design validation (not a playtest)

Ran `node content/emit.mjs`, then `node validator/validate.mjs`, then `node validator/self-test.mjs`.

Validator result: **ok, 0 errors, 0 warnings**.

| Dungeon | Rooms reached with required tools | Graph states walked |
|---|---:|---:|
| DG05 | 16 / 16 | 340 |
| DG06 | 16 / 17 (the cistern needs fins; the boss does not) | 334 |
| DG07 | 16 / 16 | 322 |
| DG08 | 16 / 16 | 130 |

The search, with required tools only, reached each goal flag, returned to the entrance from every reached state, and still reached the boss when optional rooms were refused. Optional tools were then added and every room, including the cistern, was reachable and still able to return. Each key was reachable with its own lock removed. Major puzzles each have two fair in-world clues, one of them in the puzzle room. Self-test passed on a clean miniature pack and on four broken ones: missing exit target, unreachable room, puzzle state with no way out, key whose lock accounting fails.

That is a static graph check. It does not swing the flail, render a tile, or time a telegraph. Engine playtesting is still separate.

Full machine report: `validation-report.json`. Room graphs: `graphs/`.
