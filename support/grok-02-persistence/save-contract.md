# PREINCARNATION save contract (pack oracle)

Contract id: `grok-02-persistence-contract-1`

This document is the oracle for `fixtures/cases.json` and `migration-cases.json`. It is **not** a description of a save module read from the game. When this pack was written, no PREINCARNATION save implementation existed in the workspace. Form ids, NPC ages, dungeon ids, and the v1/v2 shapes below are **pack-defined** so every case has one expected state. They are not claimed to match a shipping schema.

The executable model is `src/model.js`. A pass of that model is not a game pass. See `persistence-findings.md`.

## Layers

Every canonical save has four gameplay layers plus `meta`.

| Layer | Survives death and shrine Release? | What it holds |
|---|---|---|
| Person | Yes | Ellis Perch only. Year, deaths, releases, forms, Heart/Stride/Edge, crowns, Mayor flag, endings, applied death tokens. |
| Body | No. Replaced on rebirth. | Form, hp, map, facing, combat flag, temp buffs. Null form and map `afterlife` between death and form choice. |
| Life | No. Cleared on the return. `lifeId` increments only when a form is chosen. | Dialogue this life, carried keys, uncommitted quest transition, pending boss reward, pending ending. |
| World | Yes, and it ages. | Year (same number as the person), NPC snapshot, 16 dungeons, quests, keys, claimed rewards, warps, last ending, post-completion. |

There is no party, no account, no skill tree, and no procedural seed. Keys `skillNodes`, `skillTree`, `party`, `accountId`, `account`, and `seed` are stripped on load and never grant stats.

`person.year`, `world.year`, and `(person.deaths + person.releases) * 14` are the same number. Year 0 is real. A missing year is not year 0.

## Time and the county

Combat death and deliberate shrine Release each add 14 years and open the afterlife. Later returns keep adding 14, including after year 70.

Principal content rows are years 0, 14, 28, 42, 56, and 70 (`fixtures/tables/world.json`).

- Year 14, first return: Maeve is 48, archive-keeper at the Ilsley archive (was 34, sister, Weybridge bend). Cal is 33, harbormaster (was 19, dock-hand). Bram is archived; Willa, 31, is millwright.
- Year 28: Maeve is dead; Ione keeps the archive. Willa is 45. Cal is 47. Mayor Quill has succeeded Adel.
- Year 42: Tad succeeds Cal. Soren succeeds Willa.
- Year 56: Nell succeeds Ione. Tad is harbormaster. Soren is 42. Mayor Pye.
- Year 70 and every later clock year: Nell stays 38, Rhee is dock-clerk (Cal and Tad archived), the mill office is **closed** (Bram, Willa, Soren archived, no living millwright). No seventh generation is generated.
- Year 84 and later: those three lines stay on the year-70 row, but the Mayor is Pye's **seal**. The seal can still set `mayorSpoken` once. It does not cost another return.

`mill-gear` steps `asked` and `gear-cut` become `archived-incomplete` when a return lands on year >= 70. `installed` and `unstarted` stay. The closed office cannot start the quest.

## Forms

Closed set, in this order: `walker`, `otter`, `heron`, `crown`. Not a skill tree.

| Form | Unlocks when |
|---|---|
| walker | Always. |
| otter | `deaths + releases >= 1` (combat death or Release). |
| heron | `mayorSpoken`, from any living mayor or, at year >= 84, the seal. Idempotent. |
| crown | Two distinct rites, `crown-east` and `crown-west`. The second also unlocks warp `crown-shrine`. A rite cannot be repeated. |

`formsUnlocked` must equal that derived set. A body form outside it, or heron without the Mayor flag, is `form-illegal`. Choosing a locked form during the afterlife does not leave the afterlife.

Rebirth always spawns at Middlebury green `(12, 8)` facing south, at full hp. hpMax is `10 + 2 * heart`. Temp buffs and `inCombat` die with the body.

## Permanent stats

Heart, Stride, and Edge are integers `0..3`. They are person-state. On a new life, hp fills to the new maximum. Wounds do not carry.

Each reward id grants its stat once, then clamps. A fourth Heart source stays in `rewardsClaimed` and leaves Heart at 3. It does not wrap. On any accepted save:

```text
stat == min(3, count of claimed rewards for that stat)
```

Mismatch is `stat-divergence`. v3 does not default a missing Heart, Stride, or Edge. v2 may omit a stat only when the claimed count for it is 0; the default is 0. Omitting Heart while `reward-snake-heart` is claimed is rejected, not inferred.

Boss defeat sets `bossDefeated` and `cleared` immediately. `begin-reward` only stores `life.pendingReward` and phase `boss-reward`. Death or Release in that phase drops the pending reward and does **not** add it to `rewardsClaimed`. The boss stays dead. `claim-reward` is what increments the stat. Chest rewards (`requires: "clear"`) grant immediately and do not enter `boss-reward`.

## Keys, quests, warps

Five keys. Each is exactly one of `home`, `carried`, or `socketed`. Carried keys are life-local: a return sends them home and clears `life.carriedKeys`. Socketed keys stay socketed. A carried key survives ordinary save/load.

Quest steps commit only on `commit-quest`. Save/load during phase `quest-transition` restores the transition and the **previous** step. Death drops the transition without committing. Warp is legal only in phase `play`. It is rejected in the afterlife, during a quest transition, during a pending boss reward, and during an ending cinematic.

A warp that is present must still meet its prereq (dungeon clear, boss, or two crowns). `green-shrine` is always unlocked. `crown-shrine` is present if and only if `crowns >= 2`.

## Endings

Exactly four: `ledger`, `crown`, `archive`, `remain`.

| Ending | Commit prereq |
|---|---|
| ledger | All 16 dungeons cleared. |
| crown | `crowns === 2` and the body is on `crown-shrine`. |
| archive | Year >= 70, Maeve and Cal are archived, mill office closed. |
| remain | Year >= 70. |

`begin-ending` opens phase `ending-cinematic` and does **not** set completion. Save/load in that phase keeps it uncommitted. Death in that phase advances time, drops `pendingEnding`, and does not record the ending. Dungeon clears stay.

`commit-ending` appends to `person.endingsSeen` if new, sets `person.campaignComplete`, `world.postCompletion`, and `world.ending`. A later ending does not delete an earlier one. Death after a committed ending does not clear completion, clears, forms, stats, or warps.

`campaignComplete` is true exactly when `endingsSeen` is non-empty. `postCompletion` matches it. `world.ending` is null only when nothing has been committed; otherwise it is a member of `endingsSeen`. Completion with an empty list is `campaign-integrity` and does not load.

## Phases

`play`, `afterlife`, `quest-transition`, `boss-reward`, `ending-cinematic`.

The afterlife opens only after the year has already advanced. Saving there is allowed. A second **new** death token in the afterlife is `already-afterlife` and is not recorded. Replaying a token already in `appliedDeathTokens` (cap 32) is a successful no-op, including after rebirth. Release requires phase `play` and `atShrine !== false`; otherwise `release-not-deliberate` or `not-at-shrine`, and the year does not move.

During the afterlife: form is null, hp is 0, map is `afterlife`, no carried keys, no pending reward, transition, ending, or buffs. `lifeId` still names the life that just ended (`deaths + releases`). Choosing a form increments `lifeId` and sets `startedYear` to the new year.

## Envelope and torn writes

One slot is one JSON envelope, not a pile of keys:

```json
{ "schemaVersion": 3, "generation": 1, "checksum": "<sha256 hex>", "state": {} }
```

`checksum` is SHA-256 over canonical JSON of `state` (object keys sorted recursively). `generation` must equal `state.meta.writeGeneration`.

Each save increments `writeGeneration`, writes the new primary, and keeps the previous primary as backup. The first save copies primary into backup so one save still has a recovery copy.

Load order:

1. Decode primary. A checksum failure, a generation mismatch, or any validate error rejects that copy.
2. If the backup decodes, return it with `recoveredFrom: "backup"` and `primaryError` set. A checksum-valid but illegal primary does not load. Heart 99 is not clamped.
3. If both fail, `state` is null. Two unreadable blobs return `corrupt`. The loader must not synthesize a completed campaign.

A partial JSON object that is not an envelope is `corrupt` for that copy. It must not apply a quest, a boss, or a Heart by itself.

v3 cosmetic default: missing `body.tempBuffs` becomes `[]` and is listed in `defaultsApplied`. That default does not restore a deleted buff. Missing Heart, year, or `person.id` is `missing-field`.

## v1 and v2

These shapes were defined by this pack so older-version cases have an input. No game file was migrated. A pass is not compatibility with shipping saves.

### v1

```json
{ "v": 1, "year": 14, "form": "otter", "hp": 8, "map": "otter-creek-culvert", "flags": ["cleared:otter-creek-culvert"] }
```

- Year is required, an integer, and a non-negative multiple of 14. Otherwise `missing-field`, `bad-type`, or `bad-year`. It is not rounded.
- Every 14 years counts as one **death**. Releases are set to 0. v1 cannot tell them apart (`v1-all-year-advances-counted-as-deaths`, `v1-releases-unknown-and-set-to-zero`).
- Forms are derived from that year. `form` must already be in the derived set or the blob is `form-illegal`. Heron and crown are not invented, because v1 has no Mayor or crown fields.
- `cleared:<id>` and `boss:<id>` mark known dungeons. A boss flag on a bossless dungeon is `bad-dungeon`. Clearing a boss dungeon also marks the boss defeated.
- Any other flag is ignored and reported (`v1-unknown-flags-ignored`). It grants nothing.
- There is no ending field, so the campaign is incomplete (`v1-no-ending-field-so-campaign-incomplete`).
- NPCs are recomputed from the year. Stats are 0. Phase is `play`.

### v2

Fields: `v`, `year`, optional `deaths` and `releases` (both or neither; if neither, advances are deaths and releases are 0), optional stats, `mayorSpoken`, `crowns`, `crownRites`, `forms`, `form`, `rewardsClaimed`, `dungeonsCleared`, `ending`, `quests`, `npcs`.

- If deaths and releases are present they must already satisfy the year equation. They are not rewritten.
- Heart, Stride, or Edge outside `0..3` is `bad-range`, not clamped.
- If `forms` is present it must equal the derived set. The migrator does not add a form to excuse a mismatch.
- `npcs` is ignored (`v2-npc-field-recomputed-not-trusted`) and replaced from the year table. A stale "Maeve alive" string does not keep her alive at year 28.
- A non-null `ending` must be one of the four. It is stored as committed **without** rechecking prereqs (`v2-ending-prereqs-not-relitigated`). Missing dungeons are not filled in.
- Unknown dungeon ids are `bad-dungeon`.
- After migration, stats must match claimed rewards or the result is `stat-divergence`.

## Invariants

On every successful result, `core` is `validateV3`: Ellis's identity, the year equation, stat bounds and reward equality, the derived form set, the NPC table (including the post-70 freeze and the year-84 seal), the 16-dungeon roster, key partition, the mill-archive rule, warp rules, ending integrity, phase shape, and hp.

Extras used by individual cases:

- `completion-same-as-start` — endings and both completion flags.
- `stats-same-as-start` and `heart-same-as-start`.
- `dungeon-clears-same`.
- `no-synthetic-state` — a rejected action or load returns `state: null`. Failed actions also must not mutate live state.

## Error codes

`corrupt`, `checksum`, `stale-generation`, `missing-field`, `bad-type`, `bad-year`, `bad-range`, `year-equation`, `stat-divergence`, `stale-npc`, `stale-quest`, `stale-warp`, `form-illegal`, `form-locked`, `bad-dungeon`, `bad-ending`, `bad-reward`, `bad-phase`, `bad-step`, `bad-hp`, `bad-map`, `bad-rite`, `bad-token`, `already-afterlife`, `not-afterlife`, `not-at-shrine`, `release-not-deliberate`, `token-required`, `rite-done`, `needs-boss`, `not-a-boss`, `reward-unavailable`, `office-closed`, `warp-locked`, `prereq`, `campaign-integrity`.
