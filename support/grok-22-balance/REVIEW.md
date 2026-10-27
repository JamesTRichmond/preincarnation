# Encounter review

Simulation of the mechanics in `JamesTRichmond/preincarnation` at `c737e42`. Not a playtest. No human session was run. Town walls were not navmeshed; fights are open-field replays of the real coordinates, and the quarry gate is a tile BFS on `QUARRY_SRC`.

The live game is a Vermont county with one quarry, not sixteen sealed dungeons. Enemy kinds were not replaced. There is no miniboss type and no second boss character. Bears are the elite block. The Sentinel is the only placed boss. `resident` has HP and contact damage in `engine.ts` and is never spawned.

## What was run

158 fights. Twelve ordinary placements at early, middle, and late, plus the soloverse wraith trio once the seam exists. Eight bear placements. Five aggro-overlap groups, including crow plus bobcat 36px apart on the Green. Four Sentinel checkpoints. A form sweep on the Middlebury fisher at middle ranks for all four skins, with and without the `cannot_rest` speed flaw. Flee probes from 70, 50, and 30px. One snow-speed case (×0.86).

Standard play holds range and slashes with starter iron. That is the kit `resolveDeath` leaves behind, so it is the harsh case. Assisted play may dash and may drink syrup. Early lives have no syrup and no dash.

Step order matches `engine.ts`: the player swings before the enemy update, a hit sets `hurt` to 0.22s, contact inside 12px sets `hurt` to 0.4s and player invulnerability to 0.85s. One contact can land per frame.

## Result

Every standard fight was a kill with **0 damage**. Assisted matched it and never needed to sip. Nothing timed out.

| set | standard kills | untouched | slowest |
|---|---|---|---|
| 12 ordinary + wraith trio | 38/38 | 38 | wraith trio 4.667s (middle) |
| 5 overlap groups | 14/14 | 14 | Bristol fisher + bear 4.067s (middle) |
| 8 bears | 23/23 | 23 | 2.2s |
| 4 Sentinel checkpoints | 4/4 | 4 | sphere, 3.1s |

Sentinel checkpoints, starter iron, 0 damage: first job 2.817s, return 2.983s, late county 2.867s, late sphere (enemy HP also ×1.35) 3.1s.

Middlebury fisher, middle ranks, 0 damage for every form. Officer with the `pride` flaw (speed 70, no ×1.1) still kills in 0.933s. Embryo kills in 0.617s. That is a stronger skin, not a skipped fight. Snow on the early fisher was also 0 damage in 0.967s.

Leaving aggro immediately, from as close as 30px, produced 0 contacts for fisher, bobcat, bear, and wraith.

## Checks

**Unavoidable damage.** Not demonstrated. Contact damage does not scale with cycle, and every tested speed (crow 40, wraith 32, bear 26, bobcat 58, fisher listed 68, sentinel 22) loses a spacing duel to wanderer 76 × the default flaw. The fisher steer is not renormalized, so instantaneous speed peaked around 110. The burst did not close the 12px contact ring under this policy. Because the kill was clean, the steer was left alone.

**Simultaneous tells.** Several pairs sit inside each other's aggro. At the citation the walk had no windup, so there was nothing to overlap or to misread. The grouped fights still took 0 damage. Ordinary animals still have no tell. Main later gave the Sentinel a gold hold before each lunge (`stepSentinel`). This model does not simulate that hold, and it does not copy it.

**Stun locks.** The player has no stun flag. Movement is never locked. Flee probes did not chain contacts. Enemy `hurt` is a hit gate, not a player lock.

**Projectile saturation.** Enemies fire nothing. Player shots were not part of this matrix. Reported as absent, not patched.

**Healing dependency.** None of the clears required a bottle. The sugarhouse tin is pushed again every time `int_sugar` is built. It has no taken-flag. Death does not clear bottles in hand. A rebirth syrup grant would stack on a heal that already returns. Rejected.

**Downtime.** Longest ordinary fight is under 5s. Idle time is the 0.22s gap between slashes (max idle fraction 0.446). That is the attack rate, not a phase of waiting.

**God form.** Embryo walks water and void, as the blurb says, and also cracked and cliff. On the quarry string a wanderer already reaches the Sentinel (457 walkable cells). Embryo reaches 512. Forcing cracked and cliff solid drops that to 504 and still reaches. The extra cracked tiles are not the gate. `isSolid` was not changed. Incarnation unlocks were not lowered.

**Death spiral.** A death strips the bag to starter iron, zeros arrows and bombs, and ages the year 14 to 18. Mundane grave steel then keeps at 0.22 (400 trials, keep rate 0.228). Relics, upgrade ranks, towns cleared, keys, and the shovel stay. The same starter iron still clears cycle 5, including the sphere. Enemy HP growing 12% a cycle lengthens the Sentinel from 2.8s to 3.1s here. It does not flip a win into a loss. No health was added. The cycle multiplier was not capped.

Arrow erasure is real: `erodeGrave` zeros arrows at 8 years, and a death is never shorter than 14. The bow is not how these fights are won, and rifles are already written as a few rounds that do not come back. Ammo was not refunded.

## Patch

`patch/tuning.json` combat block is empty. Before and after fight tables match. `patch/recovery-rules.json` locks the fields death already keeps, and records the rejected edits so a later pass does not "fix" this with a larger health bar, a free bottle, or a quarry shortcut.

## Not claimed

This does not say the fights feel good, that a corner in Rutland cannot body-block you, or that a player who stands on a bear is safe. Standing in contact spends the mistake budget: a wanderer at 3 HP dies on the second bear hit of 1.5. The spacing policy never had to spend it. That budget is arithmetic from the formulas, not a playtest.

## Second pass

The first pass only asked whether a spacing bot, from 90px on an open field, takes damage. It does not. That result was rechecked and still matches, to the millisecond, on crow, bobcat, fisher, bear, the fisher–bear pair, the wraith trio, and the first-job Sentinel.

Two other policies were added. Neither changes a shipped number.

**Planted.** The body starts 22px out, inside the slash and outside the bite, and does not move. Listed speed times the 0.22s hurt, against the 10px shove, predicts the result. Anything at or under 45.5px/s cannot walk the shove back. Crow 40, wraith 32, bear 26, and the Sentinel at 22 all die without a contact. Bobcat 58 and fisher 68 kill a wanderer at middle ranks. The crow is the short case: two hits, 0.267s, dead before a shorter shove would have time to matter.

**Late.** Same start, hands and the decision to swing delayed 12 frames (200ms). The bear, the Sentinel, the bobcat, and the fisher kill. The crow, already in the band, still does not. So the bear does not catch a planter. It catches a person who steps in late. That is the defect the open-field bot could not see. It is not a health-bar defect.

A shove of 4, tried only as a study, is the first value where a planter loses to the bear, the wraith, and the Sentinel. Spacing at shove 4 still takes no damage, including the sphere. The crow remains a two-hit kill. The study is not in `patch/tuning.json`. A 32px hall was run on single animals; spacing still took nothing, and grouped placements were not crushed into that hall to manufacture a result.

No health was added. No tell was added. The recovery invariants stand.

## Recheck

Read again against main `b2d93df`, after the citation at `c737e42`. The HP table, the +12% cycle term, tropoverse ×1.35, hurt 0.22, contact hurt 0.4, the 12px bite, the 10px shove, the speeds, and the slash and spin formulas are still the ones in `src/game`. No combat number was edited.

Two differences were left alone. The county multiplies every enemy by 0.65 when Wraith Bond is owned; this model only slows wraiths, which is how the late rows above were made. Knockback now steps through `moveActor`, so a wall can swallow the shove. These fights are still open field. After #86 the live Sentinel holds gold for 0.6s before it lunges. These tables still walk it as soon as it is hurt. That tell was not copied into the model, and it was not a reason to edit a number.
