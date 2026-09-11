# Roguelike meta-progression — studio study for PREINCARNATION

Status: **study only. Not built.** Filed 11 September 2026 next to the NYU dissertation.
Thesis this study is measured against: *you are one person; death is a chapter; the Marble Vein is the only plot.*

---

## Verdict in one paragraph

PREINCARNATION is already a hybrid roguelite. Death banks skill points, ages the county fourteen winters, leaves a grave, and quotes the last deed to God or the Devil. That is closer to *Hades* (story on death + persistent power) than to *Spelunky* (knowledge only) or *Isaac* (unlock the pool). The loop is thematically right and mechanically half-visible. The player cannot see a ledger of what this life earned, kept, or lost. Upgrades are +stat, not new verbs. A silent HP bonus per cycle will eventually trivialize the Vein. The leftover karma/crown shop still exists in code, with two crown upgrades the Afterlife screen cannot buy. Do not add a Heat system, a second shop, or random skins. If anything ships later, ship **visibility of the chapter** — not more power.

---

## 1. Definition

GameBrief (2026): meta-progression is *a layer of persistent progression that exists above the run-level systems in a roguelite: upgrades, unlocks, and permanent bonuses that carry over between attempts and accumulate over a player's entire history with the game, rather than resetting on death.*

The genre split is old and still useful:

- **Roguelike (Berlin / Spelunky / traditional Isaac):** a run is a life. Death resets the board. What you keep is *knowledge*.
- **Roguelite (Hades / Dead Cells / Rogue Legacy):** a run is a chapter. Death banks something. No afternoon is fully wasted.

PREINCARNATION declared itself the second kind in the dissertation, then named the thing that is banked: **the same person, a grave, and the job.**

The design challenge, also GameBrief, is calibration: *too weak and it feels meaningless; too strong and it trivialises the run-level challenge.* That is the only hard problem. Everything else is taxonomy.

---

## 2. Five kinds of meta-progression

These stack. Almost every good modern game uses two or more.

| Kind | What persists | Canon | What the player feels |
| --- | --- | --- | --- |
| **Knowledge** | Facts, routes, tells, recipes | Spelunky, Outer Wilds, Tunic (the good half) | "I got better." |
| **Unlock-pool** | New cards, items, weapons enter the *random* pool | Binding of Isaac, Slay the Spire, Dead Cells blueprints | "The game got richer, not easier." |
| **Persistent-power** | Stats, starting HP, always-on passives | Hades Mirror of Night, Rogue Legacy manor, Dead Cells flasks | "I am stronger than last Tuesday." |
| **Hub / story** | NPC memory, rooms that open, plot that refuses to wipe | Hades House of Hades, PREINCARNATION afterlife + Maeve return | "The world remembered me." |
| **Difficulty ratchet** | Player *opts in* to a harder board so power does not win | Hades Pact of Punishment (Heat), Dead Cells Boss Cells, StS Ascension | "I am not done." |

Hades is the gold standard because it runs **all five** and keeps them named:

- Darkness → Mirror (persistent-power, freely respec)
- Keys / Titan Blood → weapons and Aspects (unlock-pool that changes *how* you play, not just damage)
- Nectar → Keepsakes (pre-run loadout)
- House conversations advance whether you won or lost (hub/story)
- Pact of Punishment is the ratchet so a fully-upgraded Mirror does not end the game

The board-game analysis of Hades (Neutronium, 2026) is the sentence to steal: *unlocking a new weapon or boon does not make you stronger in a linear way. It changes how you play.* Stygius Aspect of Zagreus is not "sword, but more." It is a different decision tree on every encounter. Early rooms stay interesting because the verb changed, not because Tartarus got extra HP.

Slay the Spire uses unlock-pool as a **gradual tutorial** (Hamatti, 2026): each character has five unlock levels; new cards appear because you are ready for the synergy, not because you bought a shop item. Ascension is the ratchet *after* the first win — the game starts easier than it will ever be again. Purists dislike this. Non-purists finish the game.

---

## 3. Three kinds of currency

| Kind | Rule | Canon | Feeling |
| --- | --- | --- | --- |
| **Run-only** | Dies with the body | Isaac money, StS gold, Dead Cells gold (mostly) | Tension inside the hour |
| **Banked** | Survives death, spend whenever | Hades Darkness, gemstones; PREINCARNATION skill points, karma, crowns | "This death paid rent." |
| **Spend-or-lose** | You *can* bank it, but only if you reach a desk before you drop | Dead Cells **Cells** (lost on death unless spent at the Collector); Rogue Legacy **Charon's tax** (unspent gold is confiscated at the castle door) | The run had a last decision |

Spend-or-lose is the genre's best invention after "death is a chapter." Dead Cells: cells drop from enemies, spend at the Collector between biomes, *lost if you die carrying them*. Blueprints work the same — find them, *hand them to the Collector*, or they fall out of the corpse. Rogue Legacy: gold from the dungeon is for the manor, but Charon takes whatever you did not spend before you walk back in. You cannot save up across generations for the expensive wing. Teddy Lee's design: every run must convert loot into the family, or the ferryman eats it.

PREINCARNATION already has a spend-or-lose object and does not name it: **the grave.** Weapons, relics, arrows go into the dirt. Fourteen winters erode mundane steel. Named relics mostly survive. Bombs never do. The shovel is the Collector. The player is not told this as a ledger.

---

## 4. Calibration — the only hard problem

Too weak: the player dies, gets +1 to a number they cannot feel, and the afternoon was a wipe with extra UI.

Too strong: the player dies five times, the board is trivial, the job is a formality. Bullet Haven (2026) on Hades: *beating a run of Hades without any heat, while having every meta progression upgrade, is a piece of cake for most experienced players.* That is why the Pact exists. Dead Cells answers with Boss Cells. StS answers with Ascension 1–20 after the first win, not before.

Catch-up meta (accelerated upgrades for struggling players) is common in mobile roguelites. It is an accessibility tool. It is also how a game accidentally becomes a slot machine that pays you for failing. PREINCARNATION already has a mild catch-up: dying with the ideal *Finish it* and the quarry not cleared awards **+1 extra** skill point. That is diegetic (the Voice wants the job done) and capped (it stops when the quarry is cleared). Keep that. Do not add a general "you are behind, here is power" curve.

The other silent killer is **stat inflation without a ratchet.** Rogue Legacy's manor HP/damage is the warning. It feels great for ten generations. Then the castle is a farm unless NG+ exists. Hades put the Mirror in the bedroom *and* put Heat on the courtyard statue so the same rooms stay a fight.

A related Hades lesson: the Mirror is **visible, respeccable, and dual-option.** You can see the whole tree. You can pull the points out. Later ranks are a fork (playstyle A or B), not a third pip of the same stat. PREINCARNATION's afterlife grid is six +stat buttons, no refund in the UI (the refund function exists in rules and is unused), no forks.

---

## 5. Canon, mapped onto one screen

| Game | Knowledge | Pool | Power | Story hub | Ratchet | Currency mood |
| --- | --- | --- | --- | --- | --- | --- |
| Spelunky | all of it | none | none | none | none | none |
| Outer Wilds | all of it | none | none | rumors | 22-minute sun | none |
| Binding of Isaac | some | **the point** | almost none | none | greedier / hard | unlocks, not money |
| Slay the Spire | some | cards/relics as tutorial | none | none | Ascension after win | none |
| Dead Cells | routes | blueprints into the pool | flasks, forge | little | Boss Cells | cells = spend-or-lose |
| Rogue Legacy | some | classes | **manor stats** | the manor itself | NG+ / Charon | gold, then tax |
| Hades | rooms, tells | Aspects, boons, keepsakes | Mirror | **the House** | **Heat** | Darkness (banked), keys |
| PREINCARNATION now | county, Vein, shovel | leftover skins (unused) | skill pts + **silent cycle HP** | afterlife + NPC return | **none** | skill pts (banked); graves (unlabeled spend-or-lose); karma/crowns (vestigial) |

---

## 6. Honest inventory of PREINCARNATION

### What already persists (the meta layer)

- **Person.** Name, background, bond, ideal, flaw. Same body on return. This is the dissertation. Do not reopen skins.
- **Skill points.** Start 3. Death awards +2. Ideal *Finish it* awards +1 extra until the quarry is cleared. Spent in the Afterlife on LIMBO_UPGRADES that are not crown-polarity.
- **Upgrades.** Spare Heart, Keen Edge, Long Stride, Open Sight, Shadow Step, Wraith Bond. Caps 3 / 3 / 3 / 1 / 1 / 1. Twelve pips to max the board. At +2 per death (sometimes +3), the shop is empty after roughly five chapters.
- **Cycle and year.** Cycle += 1. Year += 14–18. Maeve and Cal change line after cycle ≥ 1. Bond gates the first talk.
- **Karma.** Persistent. Chooses God vs Devil (threshold 0, or 3 if flaw is *the other voice*). Echo upgrade (crown) would double positive karma — currently unreachable from the Afterlife UI.
- **Crowns.** Persistent. Old key for Soloverse / embryo. Afterlife no longer sells crown upgrades.
- **World flags.** Talked, townsCleared, relics (except what went into the grave), chests, bushes, lantern, home, year, lastDeed, returnedFromDeath.
- **Graves.** Position of the last body. Weapons and relics buried. `erodeGrave` rolls mundane steel against fourteen Vermont winters. Named relics mostly keep. Bombs never. Arrows thin after eight years.
- **The job.** Objective line does not wipe. THE JOB plaque is still the Vein.

### What resets (the run layer)

- HP / MP (refilled from the new max)
- Non-starter inventory → grave
- Relics other than the starting sword → grave
- Arrows, bombs → grave
- The afterlife host flag (cleared on birth)

### What is vestigial (still in the save, barely in the player's hands)

- `buyUpgrade` still spends karma/crowns on the old LIMBO shop, including **Karmic Echo** and **Soloverse Key**. The Afterlife screen only calls `spendSkill`. Those two crown upgrades have no button.
- `isIncarnationUnlocked` still unlocks smuggler / officer / embryo. Reincarnation always returns the same body. The skins are a dead shop with living sprites.
- `refundSkillPoint` exists. No UI.
- Karma and crowns still tick on Fate choices and still render on the Afterlife strip. They choose the host. They no longer buy the chapter.

### The silent ratchet in the wrong direction

On every birth:

```
maxHp = incarnation.hp + vitality + floor(cycle * 0.75)
maxMp = 8 + cycle + vitality
```

Wanderer starts at 3 HP. After four deaths that is +3 HP before spending a single Spare Heart; after eight, +6. MP climbs one per chapter with no cap in this formula. There is no Pact, no Boss Cell, no Ascension. Combined with twelve cheap skill pips, the Vein becomes a smaller fight every time you fail it. This is the "too strong" failure mode, already shipping, currently unnamed.

---

## 7. Gaps versus canon (ranked by how much they violate the thesis)

1. **No cycle ledger.** Hades tells you what the run paid. Dead Cells shows cells drop out of the corpse. PREINCARNATION quotes `lastDeed` in the Voice's paragraph and then offers a shop. The player does not see: *this life you woke / you kept / you buried / the county aged.* Death is a chapter in the writing and a shop in the UI.

2. **Upgrades change numbers, not verbs.** Spare Heart is +HP. Long Stride is +speed. Keen Edge is +slash. Shadow Step is the one verb (dash). Hades Aspects / StS unlocks / Isaac items change the decision tree. PREINCARNATION's second sentence is reincarnation-as-save, not "get 12% faster." The shovel-and-grave *is* a verb, and it is already the best meta object in the game — it is just not presented as one.

3. **Power climbs; the board does not.** Silent cycle HP + skill pips, no Heat. For a short game whose win condition is *wake the Vein once*, a short power curve is correct — you should not need forty deaths to be ready. The danger is the player who is not ready, dies five times, and then walks through the Sentinel. The catch-up point for *Finish it* accelerates that.

4. **Dual currency with one cashier.** Skill points are the real spend. Karma/crowns are leftover from the Limbo shop. Showing three numbers (Karma, Skill, Cycle) on the Afterlife strip teaches the player that karma is a shop currency. It is not, anymore. It is a moral thermometer that picks a Voice.

5. **No pre-run loadout.** Hades Keepsakes are a small, readable choice before you walk out the courtyard: "this run I am playing with Achilles." PREINCARNATION's bond/ideal/flaw is that choice, made once at create, never again. That is right for "one person." It is wrong if we later add a keepsake shop that reopens character-select.

---

## 8. What would serve THIS game (if ordered later)

Measured against the thesis. Not a feature list. Three moves, in order.

### A. Name the chapter (visibility, no new power)

On the Afterlife screen, a three-line ledger above the spend grid:

- **This life.** The last deed. Karma sign. Where the body fell.
- **You keep.** Skill points awarded. Upgrades already owned. The job (Vein still quiet / Vein woken).
- **You lost / the ground kept.** Grave tile. Weapons buried. Relics that will erode. Year += 14.

This is Hades' "no run is wasted" *as writing*, using systems that already exist (`lastDeed`, graves, skillPoints, year). It is the dissertation made readable. It is not a shop.

### B. Stop the silent HP (calibration)

Cap or kill `floor(cycle * 0.75)` on max HP. Cycle should age the *county*, not the ribcage. Spare Heart is the visible cost for a bigger chest. If the quarry must get easier for a struggling player, keep the existing *Finish it* +1 skill — that is a choice they made at create, not a hidden inflation.

Do **not** add Heat until the Vein has been woken once. Ascension-after-win is StS's lesson: the first job is to finish the job. A Pact during the campaign would turn Vermont into a score-chaser and fight the plaque.

### C. One unlock that changes how you walk, not how hard you hit

If the meta must grow, grow a **verb**, gated by a chapter, not a pip:

- After the first death, the shovel is already in the world; the ledger should *name* it as the way you reclaim the last skin.
- Bond *Maeve's lantern*: the lantern is in your off-hand when you return, not in the grass. That is a keepsake that is still the same person.
- Ideal *Mercy*: the Sentinel can be walked past once. That is a different fight, not 15% damage (*the blade* already does that).

Max the existing twelve pips if you want; do not add a thirteenth Spare Heart. Empty shop after five deaths is correct for a game whose plot is one quarry.

---

## 9. What not to steal

- **Do not** reopen incarnation select. That was the coat's character-select screen. The dissertation closed it.
- **Do not** add a second meta currency. Skill points are the Darkness. Graves are the Cells. Karma is the moral thermometer. Crowns can sleep until a post-Vein Soloverse door needs a named key.
- **Do not** copy the Mirror as a bedroom full of +% talents. We already have a Voice. The Afterlife is the Mirror. Make it a ledger, not a talent tree.
- **Do not** copy Isaac's unlock-pool unless the county starts rolling random relics. It does not. Relics are placed. Vermont is a map, not a seed.
- **Do not** copy Charon's tax onto skill points (spend or they vanish). Skill points are the Voice's gift. The tax already exists: the grave. Name the grave.
- **Do not** add cosmetic-only meta as a substitute for a chapter. Downwell colors are a valid design for a tiny arcade. This game has a job.

---

## 10. If the boss says "ship it"

Ship **A** (Cycle Ledger) first. It is the cheapest expression of the thesis and it makes B and C obvious in play. Do not ship B or C without a play-pass of the quarry at cycle 0 and cycle 5.

Do not ship a Heat system, a keepsake shop, or a karma store revival in the same breath.

---

## Sources

- GameBrief, "What is Meta-Progression?" (glossary, 2026). Calibration sentence.
- Bullet Haven, "Roguelikes With the Best Progression Systems 2026." Hades Mirror, Pact, Dead Cells blueprints.
- Neutronium Games, "Roguelike Board Game Progression: Permanent Unlocks" (May 2026). Hades: unlocks change *how you play*.
- Juhis / Hamatti, "Meta progression with gradual tutorial in roguelike games" (2026). StS unlocks as tutorial; Ascension as post-win ratchet.
- Choost Games, "Best Roguelites Where You Actually Get Stronger Between Runs" (2026). Hades / Hades II as current high-water.
- Play Critically, Rogue Legacy review. Charon's tax; manor as persistent-power.
- Dead Cells Wiki: Cells lost on death; Collector as spend desk; Gold Reserves as a small bank; Residual Cells after a win.
- UPC thesis, "Modern Roguelike Examples" (2024). Internal vs external progression in Hades, StS, FTL, Moonlighter.
- Anchor blot, "Roguelite Design Analysis" (2026). Persistence axes: nothing / unlocks / upgrades / resources / progress / legacy.
- DIVA portal thesis (2026). Hades 2 heavy meta vs Isaac minimal meta; fairness and mastery.
- PREINCARNATION, `src/game/engine.ts` enterLimbo / applyIncarnation / dig; `src/game/rules.ts` spendSkillPoint; `src/game/content.ts` LIMBO_UPGRADES; `src/game/items.ts` erodeGrave; Afterlife in `src/components/game-app.tsx`.
- PREINCARNATION dissertation, "The Second Sentence" (11 September 2026).
