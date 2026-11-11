# PREINCARNATION environment art

Original 16px top-down tiles for Addison County. This folder is an art pack.
It does not modify the live walk.

The game on `main` is still one person, Canvas 2D at 320×240, death as a chapter,
and the Marble Vein as the only plot. `src/game/tileset.ts` still paints the
county. This pack is not imported there. A sandbox county explorer (district
travel, era sheets, no shovel, no Maeve, no Vein) was used to proof these
tiles. That explorer conflicts with the vision, so it is not in this tree.
Saves stay `preincarnation.save.v1` in localStorage. This pack does not read
or write them.

## Counts

Baked by `python3 source/build.py`. See `metadata/validation.json` for the
exact run.

| Set | Minimum | Result |
|---|---|---|
| Shared ground + architecture | 64 | 297 |
| Twelve districts | 24 each | all above 24 |
| Props | 60 | 60 |
| Interior kits | 8 coherent kits | 8 × 16 |
| Era overlay sheets | 6 | 6 × 16 |
| Sample scenes | 12 | 12 day + 12 night |

Autotile seam checks in that run: 0 failures. Every opaque texel is in the
closed palette. Every atlas dimension is a multiple of 16.

## How to integrate later

Do not swap these sheets in until a pass retargets collision to the existing
map. When that happens:

1. Load `metadata/tiles.json` and the atlas PNGs under `atlases/`.
2. Stamp ground with the corner autotile described in `docs/atlas-format.md`.
3. Draw layers in the order in `docs/layering.md`.
4. Scale with nearest neighbor only. The scenes were checked at 1x and 2x;
   the seam proof and day/night study are at 4x and 3x.

Single-tile PNGs, if you would rather not slice atlases, are under `tiles/`.

## District scenes

Each proof is 32×20 cells (512×320). Day and night:

- `scenes/middlebury_green` — town green, bluestone, brick and clapboard
- `scenes/vergennes_falls` — mill, ledge, falls, basin
- `scenes/otter_marsh` — peat, boardwalk, black water
- `scenes/champlain_shore` — shale, drift, dock, lake
- `scenes/ripton_woods` — duff, granite, spruce
- `scenes/lincoln_sugar` — litter, maples, sugarhouse
- `scenes/shoreham_orchard` — alley rows, apples
- `scenes/addison_intervale` — pasture, stubble, barn
- `scenes/leicester_quarry` — talus, cut face, cart
- `scenes/bristol_notch` — cliff, notch road
- `scenes/weybridge_span` — creek, plank deck
- `scenes/monkton_ridge` — ridge grass, windbreak

Interior proofs: `scenes/interiors/<kit>-2x.png`.
Era proofs on the green: `studies/era-<era>-middlebury-2x.png` and
`studies/era-overlay-study.png`.

## Inspected by eye

These renders were opened and checked for joins, scale, and night contrast:

- `studies/seam-proof-4x.png` — grass field, dirt/gravel path, pond shore
- `studies/day-night-readability.png` — Middlebury, Otter marsh, Ripton, Champlain
- `studies/era-overlay-study.png`
- `scenes/middlebury_green-day-2x.png`
- `scenes/vergennes_falls-day-2x.png`
- `scenes/ripton_woods-day-2x.png`
- `scenes/shoreham_orchard-day-2x.png`
- `scenes/interiors/farmhouse_kitchen-2x.png`
- `contact/04-props.png`
- individual tiles `tiles/prop/sugar_maple.png`, `tiles/roof/slate/fill.png`, `tiles/wall/clap/win.png`

## Engine notes (not unfinished tiles)

- Pure water has four frames (`f0`–`f3`). Shores and races stay on frame 0 so
  the join does not crawl.
- Props are single poses. No walk cycles in this pack.
- Night is a palette LUT, not a clock or a weather system.
- Do not rotate ground or wall tiles.
- Sample scenes are composition proofs. They are not a map format for the
  game to load as levels, and no runtime map was edited.

## Rebuild

```text
python3 source/build.py
```

Source of the pixels is `source/lib.py` (palette, textures, autotile),
`source/props.py`, `source/features.py` (architecture, districts, interiors,
eras), `source/scenes.py`, `source/build.py`. Provenance: `LICENSE.md`.
