# Integrating the Addison combat pack

This folder is the ordinary-enemy and miniboss pack for PREINCARNATION. It does not contain the sixteen major dungeon bosses. Do not invent them here and do not replace a dungeon session's boss with one of these rites.

The live game already plays at 320×240. `src/game/engine.ts` walks Ellis, slashes, spins, and spawns `crow`, `wraith`, `sentinel`, `bear`, `bobcat`, `fisher`, and `resident`. This pack does not replace that tick, those kinds, the Marble Vein, or the localStorage save. It was written against the reference contract in [reference/units.js](reference/units.js), not against the live numbers in `src/game/rules.ts`. `UNIT_SOURCE` is `reference_contract_not_engine`. Simulator output is labeled `MODEL_RESULTS_NOT_ENGINE_PLAYTESTS`. It is not a playtest. Mount it later, after converting units, and not on a branch that is already editing `engine.ts`.

## Units

| Contract      | Value                             |
| ------------- | --------------------------------- |
| Tick          | 60 Hz                             |
| Tile          | 16 px                             |
| Origin        | top-left, y down                  |
| Facing        | N E S W, no diagonals             |
| Heart         | 4 notches. Data damage is notches |
| Ellis hurtbox | 10×10, collision 12×12            |
| Fairness body | Rutland Officer, 0.85 px/frame    |

Convert with `CONVERSION.time`, `CONVERSION.distance`, and `CONVERSION.hearts` if the engine tile or tick differs. Do not retune tells until the converted officer can still leave a 48-frame telegraph of a 16 px band.

Forms and notch values live on `REFERENCE_UNITS.ellis`. God damage against `memory` and `unrealized` is `floor(base * 0.5)`, minimum 1 if the base is positive. That multiplier is not a skip.

## What to mount

1. Build the forty enemies with `enemies` from [data/enemies.js](data/enemies.js). Each object is already compiled: silhouette, states, attacks, tools, forms, terrain, mercy, lifecycle, trials.
2. Build the twenty-four minibosses with `minibosses` from [data/minibosses.js](data/minibosses.js). The phase graph is `states`. The executable rite is `gate`, `dangers`, `checkpoints`, `earliest`, and `arena`.
3. Build rooms from `encounters` in [data/encounters.js](data/encounters.js). Rules are `COMPOSITION_RULES`.
4. Drive characters with [sim/fsm.js](sim/fsm.js): `createMachine`, `beginTick`, `endTick`. Telegraph `frames` grow by the profile `tell_bonus`. Predicates are `predicates` in [sim/simulate.js](sim/simulate.js).
5. Resolve hits only through [sim/combat.js](sim/combat.js) `applyHit`.

## Global laws the engine must keep

- After two connecting hitstun blows, an enemy enters `hyperarmor` for 24 frames. Further blows glance (half, round down, chip becomes 0) and do not extend hitstun. Enemies have no i-frames.
- Knockback stops at walls and at water or pit edges. Ordinary attacks do not plunge Ellis.
- Projectile cap is 3, or 2 on the assisted profile. The oldest shot fizzles.
- Two different enemies may not start tells within 10 frames unless the room is `harmonized` and a shared safe tile sits outside both hitboxes. The default conductor is `stagger` (see `simulateEncounter`).
- Contact damage is 0 unless a definition sets it. None of the ordinary set does.
- A visible body already overlapping Ellis does not get a reaction delay. A new telegraph does. Standard reaction is 8 frames. Assisted is 4, plus 8 extra frames of tell.

## Tools and forms

Every definition has all twelve tools and all four forms. `effect: "none"` is a real answer, not a missing field. A tool with `goto`, `flag`, or `effect: "rite"` is the intended interaction. The blade is not a tool.

Mercy `ready` may require `tool`, `lamp`, `no_lamp`, `no_blade`, `face`, `front`, `idle`, `form`, or `flag`. The officer halt on the Ferrisburgh ice cutter is `form: officer` and a sheathed blade. Other forms keep the recovery punish. Do not delete that fight on assisted.

## Miniboss gates

God spin damage is banked until `earliest` and, except for `endure` rites, until the mechanic is true.

| Gate      | Resolves when                                                                    |
| --------- | -------------------------------------------------------------------------------- |
| `tool`    | Ellis uses the named tool on the socket during the window at or after `earliest` |
| `tiles`   | The named tiles have been visited, and the clock has reached `earliest`          |
| `sheathe` | Blade stays down and idle has lasted `sheatheFrames`, at or after `earliest`     |
| `endure`  | Clock reaches `earliest` and Ellis has taken no damage                           |

A spinning god who never does the mechanic does not resolve a tool, tile, or sheathe rite, even after the clock. Banking more damage than the rite's HP is the trivialization check. Do not let Embryonic God delete these phases.

Killing a memory or unrealized record sets `lifecycle.on_death.forfeit` when that field is present. The spare drop is the reward.

## Persistence

[sim/persistence.js](sim/persistence.js) is the model:

- Room reset restores HP and the initial state only if the enemy is alive and not spared.
- `this_life` remnants vanish when Ellis dies.
- `fourteen_years` spares remain for the next incarnation (one `onEllisDeath`, which adds 14 years and increments `life`).
- Ellis's death is progression. It is not a game-over that reloads the pack.

## Encounters

Kinds: `teaching`, `mixed`, `terrain`, `protection`, `mastery`. All of them are ordinary rooms. Protection intercepts are tiles Ellis can stand before the strike. Mastery rooms are won by mercy. A grave is not completion.

## Assisted profile

`getProfile("assisted")` in [reference/profiles.js](reference/profiles.js):

- reaction 4, tell bonus +8, incoming damage ×0.5, +10 i-frames, +4 HP, projectile cap 2
- shorter direction commit, a small input buffer, an assisted recovery flag for the engine to hook

It does not remove enemies, minibosses, mercies, phase lines, deaths, or forfeits. Authored notch values stay in the data. Scale damage at the moment a blow lands.

## Running the model

```bash
node support/grok-09-combat/sim/index.js
```

Writes [results/model-results.md](results/model-results.md) and `results/model-results.json`. Re-run after any timing change. A failure is a model failure. It is still not a playtest.

Movement policy inside the simulator, used for the unavoidable-damage check: four directions, officer speed, no precognition, no tap started during a reacted telegraph, approach only when no telegraph is active, retreat for the active window. A greedy spin may be hit. That hit is not counted as unavoidable. The god miniboss cases use the greedy spin on purpose and assert that it does not resolve the rite early.

## Dungeon boundary

If a dungeon session names a boss, leave it alone. This pack's `not_a_dungeon_boss` flag is true on every miniboss. Rooms only reference ordinary enemy ids.
