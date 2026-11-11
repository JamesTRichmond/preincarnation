# PREINCARNATION — DG09 to DG12

Hand-authored dungeon pack for Ellis Perch. No procedural rooms, no party, no economy, no weather clock. Engine-neutral data in `data/`, simulated by `engine.mjs`.

```
node validate.mjs
```

That command rewrites `validation-output.txt`, `maps/DG09.txt`–`maps/DG12.txt`, and `solutions/DG09.txt`–`solutions/DG12.txt`. Exit code is 0 only when every named test passes.

| Dungeon | Rooms | Boss |
|---|---|---|
| DG09 The Road That Refuses Tomorrow | 18 | The Last Coachman |
| DG10 The Ferryman's Ledger | 16 | The Collector |
| DG11 The Orchard of Black Snow | 16 | The Winter Graft |
| DG12 The Moth Infirmary | 16 | The Keeper of Unlived Years |

66 rooms. Each room is an 18×12 terrain layer plus an object layer, with connections, actors, a local solution trace, and a failure/recovery script. Unused floor is cut back to ruins around the paths, doors, and marks (`build-ruins.mjs` regenerates [data/ruins.mjs](data/ruins.mjs) if a route changes).

Bosses and minibosses are fought at floor marks. Standing in the doorway and swinging does not reach the mark. DG09 lights four coach lanterns, then the reins, then two socket posts. DG10 strikes each ledger line where it is painted. DG11 locks each graft arm, then the heart. DG12 nets or shoots three year-marks, then the book, the crank, and a cape crossing.

Routing that folds (DG09's yesterday loop, the ferry, the roof) is deterministic and has an exit. DG10 has four object-hooks and no prices. DG11's five dials are stored faces, not a sky. DG12's mercy reward is optional; the Keeper's door asks for three lamps and a walked void. God-form does not swim, wear the cape, or finish a boss.
