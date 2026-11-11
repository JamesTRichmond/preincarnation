# PREINCARNATION overworld pack

Hand-authored county cartogram for the main builder. This directory does not replace runtime maps or dungeon interiors.

Run from this folder:

```text
node validate.mjs
node render.mjs
```

`validate.mjs` exits non-zero on reciprocal-exit errors, trapped screens, missing interiors, inert era changes, or a screen that stays unreachable with every tool at year 70. Both commands write `output/`.

## Reference grid

This pack is not the running county. `src/game/snes.ts` on main draws a 320×240 canvas in 16×16 tiles. `src/game/maps.ts` is one scrolling raster. Death, the Green, and the Marble Vein stay there. These screens are a hand map for a later import, not a second game.

| | Pack | Running game (main) |
|---|---|---|
| Frame | 20 × 14 tiles | 320 × 240 px, tile 16 |
| Pitch | 16 px | 16 px (`TILE`) |
| Shape | 192 discrete screens | one raster, camera scrolls |
| Origin | column 0 west, row 0 north | same compass, different map |
| North / south mouths | columns 8–11 | not used; do not punch them into `maps.ts` |
| West / east mouths | rows 5–8 | not used |

A pack screen is 320×224 px, one tile short of the SNES frame. If a builder ever blits one screen into the frame, letterbox the last row. Do not scale the grid, and do not count a hub or an interior as another overworld screen.

Tool ids in this pack (`creek_boots`, `void_oar`, and the rest) are gate names for the cartogram. They are not the relics in `src/game/items.ts`. Do not alias them.

## What is in the pack

| Kind | Count | Counts as an overworld screen? |
|---|---|---|
| Overworld screens | 192 (16 in each district) | yes |
| Community hubs | 10 | no |
| Interiors | 60 | no |
| Dungeon mouths | 16 | no — entrances only |

Compiled layouts, exits, and links: `output/compiled-world.json`.
Era matrix: `output/era-matrix.md`.
Rendered cartogram (era 0 tiles): `output/world-map.svg`.
Hub plates: `output/hubs.svg`.
Graph check: `output/validation-report.json`.

Ellis starts on `MID-13` Return Bank in year 0 with no tools.

## Districts

The base road graph matches shared cartogram edges. These are compressed borders, not a survey. See `GEOGRAPHY.md`.

- ferrisburgh: new_haven, vergennes
- new_haven: bristol, ferrisburgh, middlebury, quarry
- bristol: lincoln, middlebury, new_haven, ripton
- lincoln: bristol, ripton
- middlebury: bristol, new_haven, quarry, ripton, salisbury
- ripton: bristol, lincoln, middlebury, salisbury
- salisbury: middlebury, quarry, ripton
- quarry: middlebury, new_haven, orwell, salisbury, shoreham, vergennes
- vergennes: ferrisburgh, quarry, shoreham, west_lakeshore
- west_lakeshore: shoreham, vergennes
- shoreham: orwell, quarry, vergennes, west_lakeshore
- orwell: quarry, shoreham

Orwell touches Salisbury on the cartogram and has **no road**. The Lemon Fair flats are a seal.

Conditional spans, not base borders:

- Year 70: Ferrisburgh `5,1` ↔ Bristol `10,2` (Monkton ridge).
- Year 70: New Haven `6,2` ↔ Vergennes `4,6` (Belden weir, Creek Boots).
- Year 70: Bristol `13,1` ↔ Lincoln `17,3` (gap vista, Frost Notch **or** Void Oar). The vista does not enter Warren.

## Tools

One of each. No crafting use. Pickup sites are reachable at year 0 without already holding that tool.

| Tool | Where | What it changes |
|---|---|---|
| Ledger Key | `INT-MID-RECORDS` | Civic doors, including Printer's Alley from year 42 and the college stacks mouth |
| Creek Boots | `INT-FER-BOATSHED` | Marsh, fords, the rotten boardwalk, the goose dike, the Belden weir, the Granville gulf trail |
| Ledge Iron | `BRI-05` Deer Leap | Climbs, the hive, Snake Mountain's vein, the year-70 bay cliff |
| Falls Line | `MID-16` gorge rim | Footbridge (years 28–41), Vergennes catwalk (year 56+), Lana, Bartlett, Texas spiral |
| Sugar Tap | `INT-LIN-SUGARHOUSE` | Flume shortcut; the only way south of Lincoln village in years 42–69 |
| Orchard Ladder | `INT-SHO-BARN` | Trellises and the Orwell hedge |
| Quarry Lamp | `QRY-05` kiln yard | Dark cut and the kiln / Whiting mouths |
| Frost Notch | `INT-RIP-NOTCH-CABIN` | Windwall into Hancock / Texas Falls / Granville, and the Lincoln gap vista |
| Glass Shard | `SAL-03` shard shore | Activates glass-warp pads already visited. Finding it does not reveal unvisited pads |
| Void Oar | `INT-WLS-KEEPER` | Deep water, void seams, and the reachability changes below |

## Glass-warp anchors

One pad in each district from year 0: `WARP-FER`, `WARP-VER`, `WARP-NHV`, `WARP-BRI`, `WARP-LIN`, `WARP-MID`, `WARP-RIP`, `WARP-SAL`, `WARP-QRY`, `WARP-WLS`, `WARP-SHO`, `WARP-ORW`.

Later pads, which must be found again:

- Year 70: `WARP-SAL` dies. `WARP-SAL-COVE` roots at `SAL-15`.
- Year 70: `WARP-MID-KNOLL` on the college hill.
- Year 70: `WARP-SHO-ORCHARD` in the oldest trees.

Warps are optional. The walking graph does not depend on them. At year 70 with every tool, `FER-04` to `ORW-14` is 12 screens on foot and 6 if every known pad is used.

## Dungeon mouths

The dungeon pack owns everything past the mouth. These ids are the contract:

`DUN-BUTTON-CISTERN`, `DUN-FALLS-RACE`, `DUN-DEADCREEK-BELL`, `DUN-SNAKE-VEIN`, `DUN-PULP-UNDERCROFT`, `DUN-LEMON-KILN`, `DUN-WHITING-CUT`, `DUN-COLLEGE-STACKS`, `DUN-GORGE-LANA`, `DUN-DUNMORE-GLASS`, `DUN-FROST-CELLAR`, `DUN-TEXAS-SPIRAL`, `DUN-BARTLETT-THROAT`, `DUN-LEDGE-HIVE`, `DUN-LINCOLN-FLUME`, `DUN-INDEPENDENCE-MINES`.

Tool and year gates are on the records in `data/travel.mjs`. `DUN-FALLS-RACE` is open in years 14–27 and again from year 42. `DUN-INDEPENDENCE-MINES` opens at year 56. `DUN-TEXAS-SPIRAL` opens at year 70.

## Reachability the validator records

Year 0, no tools, from `MID-13`: 186 screens. Not among them:

- `RIP-09`, `RIP-10`, `RIP-13`, `RIP-14` — east of the windwall (Frost Notch, or the Void Oar from year 56).
- `LIN-16` — gap vista (Frost Notch, or an oar span from year 56). Warren is not entered.
- `ORW-12` — void bay. No land exit until year 56 (oar, south seam) or year 70 (Ledge Iron from the west).

Void Oar, against the same other tools:

- Year 56 newly reaches `ORW-12` and `SAL-06` (Dunmore's west shore has been deep water since year 28).
- Year 70 newly reaches `QRY-15` and `SAL-06`. `ORW-12` is no longer oar-only, because the west cliff opens to Ledge Iron.
- Shortcuts that do not add screens: the Dead Creek span (year 56), the Vermont-side shore seam under the Crown Point approach (year 70), and the flooded Lemon Fair crossings (year 42) which force a detour through Salisbury, Shoreham, or Orwell.

One-way descents (Rocky Dale, Bartlett Throat, the Orwell bluff) land on screens that still walk back to the start. They are not traps.

## Files

- `data/cartogram.mjs` — placement and the 192 place records
- `data/travel.mjs` — gates, spans, warps, mouths, era ops
- `data/hubs.mjs`, `data/interiors.mjs`
- `lib/world.mjs` — compile layouts and the travel graph
- `validate.mjs`, `render.mjs`
