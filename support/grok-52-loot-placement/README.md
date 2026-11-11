# Loot placement (grok-52)

Authored situations for Preincarnation. This folder does not own district geometry.

Map sessions keep `map/<district>`. Do not replace those maps with the Lemon Fair Bend demo grid. Copy anchors from `patches/shoreham-orchards.anchors.json` onto `map/shoreham-orchards` if that session wants the bend's thirty-one finds. Other districts already carry their own `mapRef.session` and `mapRef.anchor`. Drop the anchor id on their map; do not import this demo's tiles.

## What is here

| File | Role |
| --- | --- |
| `districts.mjs` | Twelve districts and the map session that owns each |
| `dungeons.mjs` | Sixteen underplaces |
| `fragment.mjs` | Thirty-one playable situations at Lemon Fair Bend |
| `fragment-map.mjs` | Demo grid only. Not a county map |
| `county.mjs`, `county-b.mjs`, `county-c.mjs`, `county-d.mjs` | The rest of the county, logically placed |
| `situations.mjs` | One list |
| `logic.mjs` | The only resolver. The walk and `validate.mjs` both call it |
| `validate.mjs` | Reachability, unique items, quest release, refusal, spoil, chapel |
| `patches/` | Integration anchors. Apply beside a map, never instead of one |

## Rules the walk is not allowed to reinvent

- `resolveAction`, `shiftEra`, `noteRoomEntry` are the interaction.
- Owners who refuse do so only in `presentIn`. The consequence is a line and, where set, a flag. There is no pursuit.
- A concealed find's clue comes from another situation.
- Quest locks name a release flag or era that some other record actually grants.
- `respawn: "never"` closes a take for both years. Fixtures can be read again each year.
- Empty yields do not mark a situation taken.
- Powder is not loot.

## Demo

The session that authored this pack also walked Lemon Fair Bend as a full-screen paper map. That walk is **not** in this branch. Mounting it on `/` would cover the Middlebury Green, leave the 320×240 canvas, and use a save key other than the county game. The vision wins: wake on the Green, the Marble Vein is the only plot.

What lands here is the placement record: situations, the shared resolver, the Lemon Fair Bend fragment grid as a **patch** (`fragment-map.mjs` and `patches/shoreham-orchards.anchors.json`), and the seal in `validate.mjs`. Copy anchors onto `map/shoreham-orchards` when that map session wants the thirty-one finds. Do not replace the county map, and do not write `preincarnation.save.v1`.
