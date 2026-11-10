# PREINCARNATION progression findings

**Status: proposed reference model. This does not verify the game runtime.**

No PREINCARNATION design document or playable runtime was mounted in this workspace. `progression.json` is an authored reference, checked by `progression_checker.py`. A clean run means the reference is internally consistent under the rules below. It does not mean a shipped build matches it.

## Execution

Command, from `support/grok-01-progression`:

```text
python3 progression_checker.py prove
```

Result: exit 0. Baseline violations: none. Fifteen broken models rejected. All ten required detectors fired at least once. Full log: [proof-output.txt](proof-output.txt). Machine report: [last-proof.json](last-proof.json).

The corrected baseline acquires all 12 tools, both crowns, and the flags `mayor-spoken`, `archive-read`, `crypt-cleared`, `catacomb-cleared`, `void-crossed`.

## What was actually searched

Two different procedures. Do not collapse them.

| Procedure | What it covers | Exhaustive? |
|---|---|---|
| Acquisition fixpoint | Full reference: 12 districts, 16 dungeons, 12 tools, 2 crowns, 4 forms, 4 endings | No. It is an existence argument. Phase 1 may delay the ridge crown. Phase 2 walks only as Embryonic God from the shrine. |
| Core BFS | The projection declared in `core` | Yes, over that projection only |

### Core bounds

The enumerator’s state is:

`(location, grave-shovel, sugar-line-hookshot, creek-fins, mayor-spoken, crypt-warden cleared, year, form)`

Authoritative domain, enforced by the model rather than discovered:

- 10 locations, all present on the reference map: `middlebury-green`, `grave-crypt`, `grave-crypt-heart`, `vergennes-falls`, `cornwall-flats`, `hook-span`, `otter-creek-narrows`, `creek-channel`, `ferrisburgh-shore`, `lake-cut`
- 5 boolean bits
- 5 year/form pairs: Wanderer at 0; Smuggler or Officer at 14; Smuggler or Officer at 28

`10 × 2^5 × 5 = 1600` admissible states.

Edges used by the BFS are the reference edges whose both ends sit inside those 10 locations. Pickups, the mayor/clerk window, and the crypt warden are the reference records, not a second map. Death at year 28 is not expanded. Fins are in the projection so the creek-versus-lake split is searched.

| Measure | Count |
|---|---|
| Admissible states | 1600 |
| Reachable states | 676 |
| Admissible but unreachable | 924 |
| Reachable at year 0 / 14 / 28 | 164 / 256 / 256 |
| Goal states (hook span, shovel, hookshot, mayor flag, crypt cleared, year 28, Smuggler or Officer) | 4 |
| Shortest witness | 11 actions |
| Boss re-entries observed | 32, all idempotent |
| Duplicate reward transitions | 0 |
| Death transitions that cleared `mayor-spoken` | 0 |
| Year-28 states whose next death would leave the core | 256 |

Witness (one shortest path, not the only path):

`move:grave-crypt → pickup:grave-shovel → move:grave-crypt-heart → boss:first-clear → die:smuggler → move:vergennes-falls → talk:mayor-spoken → die:officer → move:cornwall-flats → pickup:sugar-line-hookshot → move:hook-span`

Invariants that held on every reachable state:

- Admissible year/form pair. No Officer without `mayor-spoken`. No crypt heart without the shovel.
- A year-28 talk at Vergennes can still grant `mayor-spoken`. The flag also survives into year 28 if taken earlier.
- No Wanderer and no Officer in the creek channel without fins. An Officer with fins does reach the channel.
- A Smuggler reaches the creek channel with no fins.
- Nobody reaches the lake cut without fins. A Wanderer with fins does. A Smuggler reaches the lake cut only once fins are held, so water movement is not a lake crossing.
- Some Wanderer state stands on the hook span with the hookshot.

### Outside the core, not enumerated

Embryonic God, both crowns, the void terminus, the other 9 tools, years 42, 56, 70, and every later death, and the other 7 districts. The full campaign’s state space was not counted and must not be quoted as 676 or 1600.

All four endings have an acquisition witness on the baseline: Long Homestead, Smuggler's Litany, Officer's Quiet, and Embryonic Crossing.

## Detectors

A model fails `check` when any code below is reported. `prove` requires the baseline to report nothing, and each fixture to report its expected code.

| Code | Rule that fires |
|---|---|
| `tool_self_lock` | A tool is unobtainable from a fresh game, and its site stays shut even if every other tool, flag, crown, and form is granted. Naming itself in `requires_tools` counts. |
| `tool_cycle_lock` | Extra. Two tools are each unobtainable alone, neither is a self-lock, and seeding either one makes the other obtainable. Downstream casualties of a self-lock are not cycles. |
| `key_consumed_before_mandatory_use` | A consumed key has fewer copies than mandatory uses, or an earlier optional use can spend the last copy first. A permanent key may open more than one mandatory door. |
| `essential_npc_no_successor` | A required flag that an NPC grants has some principal era, or the post-principal era, with no living grantor. Dungeon flags are not NPC lives. A named successor who does not exist or does not grant the flag also fails. |
| `death_erases_required_flag` | A `required_for_main` flag has `persists_on_death: false` or is listed in `death.flags_cleared`. Atmospheric flags may drop. |
| `form_change_strands_player` | From a form’s entry, with that form’s movement only and a full pack, a declared obligation is unreachable. Warps are ignored. God must reach both Middlebury Green and the void terminal from the shrine and from the green. |
| `ending_mutually_exclusive_states` | One ending’s requirements contradict: two forms, a flag both ways, an empty year window, a tool or crown both required and forbidden, Wanderer after year 0, Officer without the mayor flag or before any death, God while a crown is forbidden. |
| `ending_unreachable` | Extra. The conjunction is satisfiable on paper, but the acquisition witness cannot realize it. |
| `optional_choice_blocks_main` | An `optional: true` choice destroys a tool or kills NPCs, has no recovery that restores them, and the trunk then cannot be acquired. |
| `warp_bypasses_mandatory` | A warp’s destination (unless it is the start) still needs a tool, flag, crown, or God when that prerequisite is removed from the non-warp graph, and the warp does not require it. `grants_completion` also demands the whole trunk. |
| `boss_reentry_duplicates_rewards` | `reward_unique`, `reentry_allowed`, and `reentry_grants_reward` are all true. |
| `years_beyond_principal_eras` | Death at year 70 has no supported post-principal respawn and profile, the calendar hard-caps at or before 70, a required objective has `year_min` above 70, or the post-70 respawn cannot be walked out of by a Smuggler or an Officer. |
| `internal_unlock_mismatch` | Extra. A dungeon chest, door, key use, or boss cost does not match the solver’s tool, key, crown, or boss record. |
| `era_table_mismatch` | Extra. `principal_eras` is not exactly `[0, 14, 28, 42, 56, 70]`. |
| `campaign_unreachable` | Extra. The authored model cannot assemble the trunk. |
| `census_mismatch` / `dangling_reference` | Extra. Counts drift from 12 / 16 / 4 / 12 / 4, or an id does not resolve. |

The trunk is all 12 tools, both crowns, `mayor-spoken`, `archive-read`, `crypt-cleared`, `catacomb-cleared`, and `void-crossed` at `void-terminal`. The three mortal endings are alternate termini that refuse the ridge crown. That refusal is an ending branch. It is not an optional choice, and it is not required to keep the trunk open.

## Fixture proof

Each file is the baseline plus one injection. `REJECT` means the checker’s report contains the expected code and none of the forbidden codes.

| File | Injection | Expected | Also reported | Verdict |
|---|---|---|---|---|
| `01_tool_self_lock.json` | Only entrance to the gap-boots site requires gap boots | `tool_self_lock` | trunk and God ending unreachable | REJECT |
| `02_key_consumed_early.json` | Optional ossuary spends the only crypt key before the warden door | `key_consumed_before_mandatory_use` | the new use has no dungeon door | REJECT |
| `03_npc_no_successor.json` | Clerk Ross removed; mayor’s successor list empty | `essential_npc_no_successor` | — | REJECT |
| `04_death_erases_flag.json` | Death clears `mayor-spoken` | `death_erases_required_flag` | mortal endings unreachable | REJECT |
| `05_form_strands.json` | Embryonic God movement is void only | `form_change_strands_player` | trunk and God ending unreachable | REJECT |
| `06_ending_exclusive_forms.json` | Homestead ending requires Smuggler and Officer | `ending_mutually_exclusive_states` | — | REJECT |
| `07_optional_blocks_main.json` | Optional pawn destroys the shovel, no recovery | `optional_choice_blocks_main` | — | REJECT |
| `08_warp_bypass.json` | Green warps to the void terminal and grants completion | `warp_bypasses_mandatory` | — | REJECT |
| `09_boss_reentry_dup.json` | Creek warden pays the unique crown on re-entry | `boss_reentry_duplicates_rewards` | — | REJECT |
| `10_years_beyond.json` | Post-principal support off, and a required objective at year 84 | `years_beyond_principal_eras` | — | REJECT |
| `11_key_two_mandatory.json` | One consumed key, two mandatory doors | `key_consumed_before_mandatory_use` | the second use has no dungeon door | REJECT |
| `12_ending_exclusive_flags.json` | Officer ending needs `mayor-spoken` true and false | `ending_mutually_exclusive_states` | — | REJECT |
| `13_successor_dies.json` | Clerk covers only year 28 and names nobody after | `essential_npc_no_successor` | — | REJECT |
| `14_optional_kills_speakers.json` | Optional feud kills mayor and clerk; the NPC table itself stays valid | `optional_choice_blocks_main` | — | REJECT |
| `15_tool_cycle.json` | Hookshot requires the lamp and the lamp requires the hookshot, and the dungeon text matches | `tool_cycle_lock` | trunk unreachable | REJECT |
| `16_internal_unlock_drift.json` | Crypt cairn text says the shovel requires itself; the solver record does not | `internal_unlock_mismatch` | — | REJECT |
| `17_post_era_strand.json` | Year 84 respawn is the void terminal, which a mortal body cannot leave | `years_beyond_principal_eras` | — | REJECT |

The same checks accept [progression.json](progression.json). `glass-latch` is permanent and legally opens two doors. `glass-recall` returns to the start and is not a bypass. Moss Ell dies with no successor and does not fail the NPC check, because `heron-spared` is not required. `scent-of-smoke` may be cleared on death for the same reason.

## Baseline rules the checker relied on

- Death advances 14 years, respawns at Middlebury Green, and is always available. Required flags and acquired tools persist. Tools not yet taken stay in open dungeons.
- Year 0 is Mortal Wanderer. After a death, the body is Otter Creek Smuggler, or Rutland Officer if `mayor-spoken` persists. One life is one body.
- Claiming the second crown at the ridge shrine turns Ellis into Embryonic God immediately and irreversibly. God keeps ground and adds water and void.
- Terrain: ground needs ground movement; creek needs water movement or fins on a grounded body; the lake cut needs fins or God; void needs void movement; gap needs gap boots and ground; hook needs the sugar-line hookshot and ground; dark needs the lamp and ground.
- Mayor Hester Lane of Vergennes grants `mayor-spoken` in years 0 and 14. Clerk Ida Ross grants it from year 28 through the post-principal era. The block rod and the archive sit behind that flag.
- The second crown is not behind void. Void is the terminus and requires the full kit, both crowns, the archive, the cleared crypt, and the cleared catacomb.
- Post-principal deaths use the year-70 profile plus the potter’s field stone. No mandatory objective has `year_min` above 70.
- Every boss allows re-entry and does not pay a unique reward twice.
- Exclusions held in the data: no party, procedural generation, crafting economy, quest compass, replacement skill tree, accounts, or monetization.

## Unresolved contradictions

These are design gaps. The reference picks a reading and records it. They are not silent overrides of a runtime, because no runtime was available.

1. **Rutland Officer versus an Addison-only map.** Rutland County is outside Addison County. The reference keeps the body name and does not add a Rutland map. Unresolved whether a later chapter was supposed to leave the county.
2. **Who the mayor is.** Vergennes is the only city in Addison County, so the mayor is Hester Lane of Vergennes. Middlebury is the county seat and has no mayor in this model. Unresolved if “the Mayor” meant Middlebury.
3. **Crowns versus cycles.** “After two Crowns/cycles” is implemented as two crown artifacts, with `deaths_min: 0` on Embryonic God. A player who never dies can still become God in year 0 by taking both crowns. If “cycles” means deaths, this reading is too loose.
4. **Marble.** The hammer dungeon is at Weybridge. Commercial marble country is largely outside Addison County. This is a geographic compression, not a claim about the quarry record.
5. **Water overlap.** Creek fins and the Smuggler both touch water. Creek terrain accepts either. The lake cut accepts fins or God, not the Smuggler alone, so the fins are not redundant. That split is proposed, not specified.
6. **God and ground.** “Crosses water and void” is read as added terrains. God keeps ground because the shrine’s only exit is a ground edge. Fixture 05 is the stranding reading, and the checker rejects it. If the intended God cannot walk, the shrine needs a void exit before that change is legal.
7. **Tools across death.** Acquired tools are soulbound. A grave-stash or era-locked chest reading is unresolved. Soulbinding is what keeps a missed-then-found order from softlocking when combined with open dungeons.
8. **Hookshot versus gap boots.** They do not substitute. Hook terrain is the sugar-line. Gap terrain is the notch. Unresolved if one tool was meant to cover both.
9. **Playtime.** 120–160 hours is a target on the model. `hours_verified` is false. Nothing here measured playtime.
10. **Early mayor versus late lock.** The acquisition fixpoint can talk to the mayor at year 0, so it will not notice a missing clerk. Era coverage is a separate check for that reason. Fixture 03 fails the NPC check and still “solves” the yearless fixpoint. Both results are intentional.

## Do not claim

- Do not say the runtime, a content pass, or a 16-dungeon playthrough was verified.
- Do not quote 676 as the size of the game.
- Do not treat the four endings as simultaneously true in one save. Each conjunction is satisfiable on its own branch. Homestead, Litany, and Officer’s Quiet refuse the ridge crown; Embryonic Crossing takes it.
