# Atlas format

Base grid is **16 pixels**. Every tile width and height is a multiple of 16.
Origin is the top-left of the cell. Do not rotate tiles: grass blades, water
bands, roofs, and walls are directional. All four edges are already baked.

## Files

| Atlas | Contents |
|---|---|
| `atlases/shared-ground.png` | Shared ground, shores, paths, water frames |
| `atlases/shared-architecture.png` | Roofs, walls, the stone step |
| `atlases/district-<id>.png` | That district's ground transitions and feature tiles |
| `atlases/props.png` | All 60 props, shelf-packed |
| `atlases/interior-<kit>.png` | One interior kit, 16 tiles |
| `atlases/era-<era>.png` | One era overlay sheet |

`metadata/tiles.json` is the index. Each record:

```json
{
  "id": "ground.grass.dirt.dirt.grass.v0.f0",
  "w": 16,
  "h": 16,
  "atlas": {"atlas": "atlases/shared-ground.png", "x": 0, "y": 0, "w": 16, "h": 16},
  "file": "tiles/ground/grass/dirt/dirt/grass/v0/f0.png",
  "layer": "ground",
  "walk": "partial",
  "walk_mask": "1111000011110000",
  "collision": [[0, 0, 16, 4]],
  "autotile": {"nw": "grass", "ne": "dirt", "se": "dirt", "sw": "grass", "variant": 0, "frame": 0},
  "status": "finished"
}
```

`walk_mask` is 16 characters, row-major 4×4 blocks of 4px. `1` is walkable.
`collision` rectangles are `[x, y, w, h]` in tile pixels, origin top-left.
Props also carry `foot` (the blocking rect) and `sort_y` (the y used for
depth sorting, in sprite pixels from the sprite top).

## Autotile id

`ground.<nw>.<ne>.<se>.<sw>.v<variant>.f<frame>`

Corners are the materials at the four vertices of the cell, not the cell
center. Pick them from the vertex grid (each vertex is the highest-priority
material among the up-to-four cells that touch it). Priorities are in
`source/scenes.py` (`PRIORITY`). A cell whose four corners match is a fill.
Grass fills cycle `v0`–`v3` by hashing the cell coordinate so a meadow does
not beat at exactly 16px. Pure water cycles `f0`–`f3`. Shores stay on `f0`;
their water perimeter is the stable frame so foam does not slide along the
join while the open water shimmers.

## Drawing

```text
sx, sy = atlas.x, atlas.y
dest = (cell_x * 16, cell_y * 16)
blit atlas rectangle (sx, sy, 16, 16) onto dest
nearest-neighbor only when scaling
```

Props: blit the frame at a pixel position. The sprite's foot should sit on the
ground cell. `sort_y` plus the blit origin is the depth key. Draw props after
ground and after walls/roofs only if you want them in front; the sample
renderer in `source/build.py` draws ground, features, buildings, then props
sorted by foot.

## Joins

Two autotiles that share an edge in a vertex grid name the same material on
every pixel of that edge. Colors on either side of the edge are the next
sample of that material's period-16 texture (`tex` in `source/lib.py`), not a
copied column. Feature tiles that must meet a ground lock one side with
`lock_edge`, which writes the same pixels a pure tile of that material would
have on that side.
