# Integrating the progression model

`progression.json` is a proposed reference. No runtime map was available to bind it to. Wire it beside the game, then re-run the checker after every id change. Do not copy its rules into scattered conditionals.

The checker does not ship in the client. Run it on the data:

```text
python3 support/grok-01-progression/progression_checker.py prove
python3 support/grok-01-progression/progression_checker.py check path/to/model.json
python3 support/grok-01-progression/progression_checker.py explore path/to/model.json
```

`prove` rewrites `progression.json`, `fixtures/`, `proof-output.txt`, and `last-proof.json` from the builder inside `progression_checker.py`. If the JSON is edited by hand, use `check` and `explore` so `prove` does not overwrite those edits. Exit 0 means the loaded model reported no violations (`check`) or the core goal was reached (`explore`).

## Save shape

One slot. Ellis Perch is the only persistent person. Suggested fields:

| Field | Type | Notes |
|---|---|---|
| `year` | int | Starts at 0. Legal principal values: 0, 14, 28, 42, 56, 70. Later: `70 + 14n`. |
| `form` | string | `mortal-wanderer`, `otter-creek-smuggler`, `rutland-officer`, `embryonic-god` |
| `location` | string | A `locations[].id` |
| `tools` | set of tool id | Soulbound once acquired. No duplicates. |
| `crowns` | set of crown id | Size 0–2. Never a counter. |
| `flags` | map id → bool | Required flags survive death. |
| `keys` | map key id → copies remaining | Decrement only when `consumed_when_used` is true. |
| `bossesCleared` | set of boss id | Re-entry reads this and pays nothing unique. |
| `ending` | string or null | At most one. |

Do not add a party list, a craft inventory, a compass target, a skill-tree level, an account id, or a price.

## Events

Resolve them in this order so the checker’s assumptions stay true.

**Death**

1. If the player is already Embryonic God, keep that form.
2. Else set the form to `otter-creek-smuggler`, or to `rutland-officer` when `mayor-spoken` is set and the player chooses it. Clear `mortal-wanderer` once `year` leaves 0.
3. Delete only flags that are not `required_for_main` and are listed in `death.flags_cleared`.
4. Keep `tools` and `crowns`.
5. Add 14 to `year`.
6. If `year` is one of the six principal eras, load that era’s profile. If `year > 70`, load `post_principal_policy`: respawn `middlebury-green`, profile `year-70`, and do not gate any required objective on the new year.
7. Set `location` to the respawn. There is no hard cap at 70.

**Talk**

Grant an NPC flag only when `location` matches and `year` (or `"post"` when `year > 70`) is in that NPC’s `alive_eras`. Mayor Lane covers 0 and 14. Clerk Ross covers 28, 42, 56, 70, and post. Do not delete Lane’s successor without adding another grantor for every later era.

**Pickup and boss**

Grant a tool or crown only if `found_at` matches and `requires_tools` / `requires_flags` / `requires_crowns` are already held. On boss clear, if `bossesCleared` already contains the id, do not grant `reward` again. The checker flags the data when `reentry_grants_reward` is true on a unique reward; the runtime must match that by using a set, not by incrementing.

**Ridge crown**

The moment `crown-of-the-ridge` is added and `crown-of-the-creek` is already held, set `form` to `embryonic-god` at the current location (the shrine). Do not wait for another death. God movement is `ground`, `water`, and `void`. Dropping `ground` strands this map; the shrine exit is a ground edge that requires the ash bow.

**Warp**

A warp may move the player only when its `requires_tools`, `requires_flags`, `requires_crowns`, and `requires_forms` are held. `glass-recall` is the only baseline warp: it needs `homestead-glass` and lands on the green. It must not set an ending. Any warp into `void-terminal`, or any warp with `grants_completion`, has to require the same necessities the non-warp graph does. The checker computes those by banning one prerequisite at a time.

**Ending**

Evaluate each ending’s `requirements` as a conjunction. Offer it only when the whole conjunction holds. Do not require two endings at once. Refusing the ridge crown is how Homestead, Litany, and Officer’s Quiet stay open; it is a branch, not an optional `optional_choices` entry.

**Optional choice**

Run `effects` only for a choice the player can skip. `destroy_tool` and `kill_npc` need a `recovery_id` whose recovery lists the restored ids, or they will fail `optional_choice_blocks_main` once the trunk can no longer be acquired.

## Terrain

Use `terrain_rules` in the JSON. Do not invent a second switch. In short: ground movement walks ground; creek is water movement or fins; the lake cut is fins or God; void is void movement; gap is gap boots plus ground; hook is the hookshot plus ground; dark is the lamp plus ground. Smuggler water does not cross the lake cut. Officer and Wanderer do not cross creek without fins.

## Id contract

Keep these ids stable until the real map exists, then rename in the JSON and re-run `check`:

- Districts: the 12 `kind: "district"` locations. Other locations are rooms and crossings, not extra districts.
- Dungeons: the 16 `dungeons[].id` values. `solver_node` must be a real location.
- Tools and crowns: `found_at` must be the room that actually contains them.
- Forms: the four ids in the brief, in the movement sets above.

`internal_unlocks` document doors and chests inside a dungeon. The solver uses `edges`, `tools`, `crowns`, `keys`, and `flag_sources`. If those two layers disagree, fix the data before trusting either one. Keys are checked from `keys[]`, not by a second walk of the prose.

## Core projection

`explore` is the exhaustive search. It is only the `core` block: years `{0, 14, 28}`, three tools (shovel, hookshot, fins), one NPC flag, the crypt warden, ten locations including the Ferrisburgh shore and the lake cut. Hook the same function to a CI job if you want that projection re-counted after an edge edit. Do not point it at the full 12-tool state vector; that space is not bounded tightly enough to enumerate here, and the checker does not pretend otherwise.

Current counted result, from the proof run: **1600** admissible core states, **676** reachable. Re-run `explore` after any core-adjacent edit and replace those numbers in `progression-findings.md` if they move. The fins bit is what proves an Officer crosses the creek only with fins, a Smuggler crosses the creek without them, and nobody — Smuggler included — enters the lake cut without fins.

## Suggested call site

One module, for example a pure `evaluateProgression(save)` next to the simulation, reading the JSON (or a generated constant produced from it):

- `canTraverse(save, edge)` implements `terrain_rules` plus the edge’s requires lists.
- `applyDeath(save, officerChosen)` implements the death order.
- `grantBossReward(save, bossId)` returns the reward or `null` when `bossesCleared` already has it.
- `availableEndings(save)` returns the satisfiable endings and never more than one committed id.
- `livingGrantors(flag, year)` filters NPCs by `alive_eras`.

Keep that module free of rendering and of account or payment code. When a real district graph replaces this reference, delete none of the detectors; point them at the new file and require `prove` or `check` to be clean before the graph is treated as shippable. Until that file is the runtime’s own data, say “reference model,” not “verified progression.”
