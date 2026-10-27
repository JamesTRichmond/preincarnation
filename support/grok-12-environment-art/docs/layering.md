# Layering, collision, and walk

Draw bottom to top. This is the order the sample scenes use.

| Order | Layer | Source | Notes |
|---|---|---|---|
| 1 | `ground` | autotile fills, shores, paths, district grounds | Always opaque. Under everything. |
| 2 | feature ground | `district.<name>` tiles with `layer: ground` | Replaces the cell (falls, grates, pads). |
| 3 | `wall` | `wall.*`, cliff faces, truss bays | Blocks. South face is the readable front. |
| 4 | `roof` | `roof.<style>.<edge>` | Blocks. Drawn after walls so eaves cover the wall top. |
| 5 | `floor` | interior floors, rugs, features | Interior kits only. |
| 6 | `era` | `era.<sheet>.*` | Decals. Most are non-blocking. `blocks: true` records carry a foot rect. |
| 7 | `prop` | `prop.*` | Y-sort by blit_y + `sort_y`. No baked ground shadow. |

Night is not a layer and not weather. `studies/day-night-readability.png` is
the day palette run through the night LUT in `metadata/palette.json`. Paths
stay lighter than grass, clapboard stays the light vertical surface, water
stays blue and separated from the bank. Do not multiply the framebuffer by a
second fog pass or the LUT contrast goes away.

## Walk

- `walk: all` — the whole cell is ground.
- `walk: none` — the whole cell blocks (water, cliff, wall, roof).
- `walk: partial` — use `walk_mask` or `collision`.
- Water and millrace are never in the walk set. Boardwalk (`board`), peat,
  ledge, and shores are walkable where the mask says the pixel is land.
- Doors (`wall.*.door`, `wall_s_door`) block the frame and leave the opening.
- Props with `blocks: true` use `foot` in sprite pixels, not the whole bitmap.

## Roof keys

A building footprint `w` by `h` (minimum 3×2) uses wall tiles on the south
row and roof tiles above it. Roof id suffix is the outer edges of that cell:
`fill`, `n`, `e`, `s`, `w`, `ne`, `nw`, `se`, `sw`. South roof tiles include
the eave that sits on the wall.

## Era meaning

Death advances fourteen years. These sheets are the same geography, not new maps.

| Sheet | Read |
|---|---|
| `tended` | Care still shows: trim, swept stone, hedge, stacked wood. |
| `weathered` | One span of weather: moss, peel, litter, rust, heave. |
| `ruined` | Collapse, hole, bramble, open cellar. |
| `rebuilding` | Scaffold, new clapboard, lumber, chalk line, tarp. |
| `stewardship` | Different hands: moved fence, sapling row, closed path, blaze. |
| `memorial` | Stone, ribbon, planted pine, wreath, plaque. No readable text. |

Overlay ids are `era.<sheet>.<name>`. `repeat: true` means the decal is safe
to stamp on a grid. Others are single placements.
