# grok-09-combat

Ordinary enemies, minibosses, rooms, and the state-machine model for PREINCARNATION's Addison County combat. Not the sixteen dungeon bosses. Not a replacement for the 320×240 walk in `src/game`.

Read [INTEGRATION.md](INTEGRATION.md) before mounting this into the engine. Units are a reference contract (`reference/units.js`). The live engine keeps its own slash, spin, and seven enemy kinds. Results from the simulator are model results, not playtests.

```bash
node support/grok-09-combat/sim/index.js
```

| Path                    | What                                   |
| ----------------------- | -------------------------------------- |
| `data/records.js`       | Forty authored ordinary enemies        |
| `data/enemies.js`       | Compiled definitions                   |
| `data/minibosses.js`    | Twenty-four rites, arenas, and gates   |
| `data/encounters.js`    | Composition rules and thirty-six rooms |
| `sim/fsm.js`            | Reusable state machine                 |
| `sim/combat.js`         | Hits, hyperarmor, god scaling          |
| `sim/simulate.js`       | Trials, rooms, miniboss rites          |
| `sim/validate.js`       | The model checks                       |
| `reference/profiles.js` | Standard and assisted execution        |

Assisted play changes timing and how hard a hit is. It does not delete a mercy, a death, or a room.
