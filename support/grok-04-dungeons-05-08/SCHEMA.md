# DG05–DG08 content schema

Engine-neutral JSON. The runtime is not this pack. Nothing here is an existing function to call.

Authoring sources are `content/dg05.mjs` through `content/dg08.mjs`, `content/lib.mjs`, and `content/index.mjs`. `node content/emit.mjs` writes:

- `content/pack.json` — full pack, including expanded puzzle graphs
- `content/dg0N.json` — one dungeon each
- `integration/second-crown.event.json`

Coordinates: `x` increases east, `y` increases south, origin at the northwest corner of the room.

## Pack

`meta`, `tools`, `mythology`, `integrationEvents[]`, `campaign`, `dungeons[]`.

## Dungeon

Required: `id`, `name`, `entranceRoom`, `goalFlag`, `requiredTools`, `optionalTools`, `entry`, `death`, `routes`, `keys`, `locks`, `clues`, `evidence`, `puzzles`, `rooms` (at least 15), `miniboss`, `boss`, `designAssertions`.

`entry.assumedGrantedFlags` are true at the door for a standalone visit. `entry.proposedUnlocks` are campaign proposals, not API calls. `external: true` on a prerequisite means it is not produced by this pack.

`initialLevel` is the race height for DG06 (`0` drained, `1` creek, `2` flood). Other dungeons leave it null.

## Room

`layers.floor`, `layers.solid`, `layers.water`, `layers.hazard`, `layers.objects`.

DG06 also has `layersByLevel` for `0`, `1`, and `2`.

Floor characters:

| Char | Meaning |
|---|---|
| `#` | Wall |
| `.` | Dry floor |
| `,` | Dust, hay, or silt, still a floor |
| `+` | Catwalk, dry at every race level |
| `~` | Shallow. Dry at level 0, shallow at 1, deep at 2 |
| `=` | Basin. Dry at 0, shallow at 1, deep at 2 |
| `W` | Permanent deep water. Never drains. Fins or shore-push |
| `!` | Hazard floor. Damage, not a wall and not a lock |
| `h` | Hay landing, walkable |

`exits[]` and `interactions[]` each have integer `x`, `y` so keyboard and touch share a target. Exit fields that matter to the graph: `to`, `dir`, `requiresFlags`, `requiresKeys`, `requiresTools`, `needFins`, `openAtLevels`, `setsFlags`, `optional`, `shortcut`, `external`.

`solutionTrace` is the player-facing order for that room. `persistence` and `reset` say what survives leaving, dying, or ringing a crank or bell.

Latched flags survive death. Unsolved local puzzles, including block positions, reset. Keys and evidence persist. Boss phases reset unless the boss flag is already set. Death returns Ellis to the dungeon entrance, fourteen years on, never onto deep water or a block tile.

## Puzzles

Compact types expand into `fsm` (`states`, `edges`, `initial`, `terminal`, `solution`) at emit time:

- `choiceWheel`, `adjacentSwap`, `toggles`, `dials`, `testimony`, `railBlock`, `explicit`

Every state can reach the terminal and a state marked `safe`. Rails also reset from every state. A testimony exemplar is copied by `carvedDuplicate`. Wrong beats and the bell return to the empty prefix. The bell does not consume keys.

## Keys

Each key has one source interaction and opens exactly one lock. Optional keys match optional locks. A key must be reachable with every exit that requires it removed.

## Bosses

`miniboss` and `boss` carry the same fsm shape as puzzles. Strike chains are explicit states. DG08 phase-two edges include `preview: "chalk"` and `preservesHits` bell edges.

## Second Crown

`integration.secondCrown` uses `notAnExistingRuntimeApi: true` and `payload.grantsEmbryonicGod: false`. Flags and evidence it names are produced by DG08 interactions. Crown 1 is `definedInThisPack: false`.

## Graphs

`graphs/dg0N.graph.json` is the room dependency graph (edges carry flags, keys, fins, levels). `graphs/dg0N.mmd` is the same graph in Mermaid. `graphs/campaign.graph.json` is the proposed DG05 → DG08 → crown link.
