# Sugar & Ash — integration notes

Ellis is the only protagonist. Sugar and ash do not add a party, a new verb, or a seeker. They take the four hands that already exist — `strike`, `shot`, `step`, `brace` — and change what that hand does while attuned.

The combat module lives in `support/grok-33-sugar-ash/src/`. It is plain ESM, fixed at 1/60, and has no renderer. The yard in `arena/` and the preview route both call it. Nothing in the renderer decides damage, timing, or projectile direction.

## Call pattern

```js
import { createYard, step, enqueue, attune, chooseWeave, releaseBrace, cutTether } from "./src/index.js";

const world = createYard();
world.input.keys = heldCodes;          // KeyW / KeyA / KeyS / KeyD, screen axes
world.input.move = { x, y };           // optional stick, y-down (screen up is negative)
world.input.aimX = worldX;             // pointer, not a target lock
world.input.aimY = worldY;
world.input.aimActive = true;

attune(world, "sugar", "thread-the-needle");
attune(world, "ash", "orchard-of-embers");
enqueue(world, "shot");                 // facing comes from the aim
enqueue(world, "strike");
enqueue(world, "step", { dirX, dirY }); // omit dir to use the stick or keys
enqueue(world, "brace");                // hold
releaseBrace(world);                   // early release or cancel, per the channel
step(world, 1 / 60);
```

One sugar attunement and one ash attunement. Passives (Wreath of Debts, Common Root) run even when another weave takes the verb. If both attunements `claim` the same verb, `world.pendingChoice` is set and nothing fires until `chooseWeave(world, id)`.

`world.channel` is live process state. Do not serialize it. Persist tethers, marks, blossoms, resources, and attunement ids if you save; rebuild a channel only by starting the verb again.

## What the preview demonstrates

The yard attunes any of the 24. Eight are marked featured in the records: Thread the Needle, Wreath of Debts, Sap Pressure, Common Root, Orchard of Embers, Handful of Cinders, Last Arrow First, Kiln Bloom. The combination row plays four drills through the same verbs:

| Drill | Hands |
| --- | --- |
| Sap-lit Wick | Sap Pressure bolt × Orchard blossom, chain suppressed |
| Debt Kindling | Wreath loop spent by a lantern bloom, not also multiplied |
| Glass Orchard | Sugar Glass shatter snuffs a bud |
| Needle through Coals | Cinder Letter consumed, tether tension 45 |

## Rules that must stay true at the boundary

**No homing.** Every projectile is spawned with `homing: false` and `steering: "straight"`. Velocity is constant until a wall, a seal, a body, or the lifetime. Split the Billet forks at ±35° off the incoming velocity when it meets a wall, not toward a foe. Handful of Cinders uses a fixed fan of angles off facing. If the projectile cap is full (12, or 6 with reduced effects), the extra fizzles. It does not retarget.

**Puzzle seals.** Seals are solid bodies. They block movement, line of sight, tethers, planting, and shots. A tether whose line crosses a seal breaks with reason `seal`. A blossom or letter planted on a seal is refused and the ember comes back. Kiln Bloom's corridor stops at a seal. The east slab in the yard is that boundary. Do not add a path around it in data.

**Offscreen.** `updateAwareness` writes `onScreen` from `world.camera` when `autoAwareness` is set. The yard camera is the visible rect, so walking away is what makes a hand offscreen. Offscreen actors take no damage and accept no new marks or links. A tether with an offscreen end breaks after 1s and does not punish during that grace.

**Bosses.** `boss: true` sets `damageFactor` 0.5 and immunities `displace`, `hardBind`, `stun`. The warden is not shoved, sap-taxed, sweet-rotted, or shut in the sugarhouse. Separation damage is 40% and ignores the usual factor. Wreath stops at 2. Blooms do not stun. They are not immune to ordinary hits.

**Reduced effects.** `world.settings.reducedEffects` is gameplay, not a particle toggle. Multiplier cap 1.5 instead of 2.5. Fewer fan bolts, blossoms, chain links, and Winters pierces. A shorter sugarhouse. Ash Step drops no incidental cinders. The yard button writes that flag.

**Resources.** Sap and ember cap at 100. The yard regens sap while bracing with no channel, and ember cools slowly, because `ambientRegen` is on. Tests turn that off. Whiffs, lost anchors, and interrupted channels refund the amounts named on each record.

**Threads.** Separation damage requires the pair to be moving apart and past 70% of slack. Nothing pulls them together. Ellis cutting a thread (`cutTether`) does not pay Tithe. A break from distance, a seal, or a death can.

## Records

`records/abilities.json` is `recordsDocument()` from the module. Regenerate it after a record edit; the test compares deep equality. Each record carries rules, telegraph, cancellation, tradeoff, resources, boss, and puzzle notes. Capstones are Canopy of Accounts, The Last Sugarhouse, Kiln Bloom, and Fourteen Winters — two per discipline.

## Tests

```
node --test support/grok-33-sugar-ash/tests/abilities.test.mjs support/grok-33-sugar-ash/tests/drills.test.mjs
```

Those cover projectile counts, the damage cap, tether breaks, inaccessible anchors, offscreen foes, boss immunity, reduced effects, and the four combinations.

## County (320×240)

The sim is not a second map and not a second Ellis. After a death, limbo attunes one sugar and one ash onto the save (`mastery`, version 9). In the county:

- Space / Z remains the cut. A strike weave replaces that cut.
- The bow, the rifle, or a short tap of V (Sip) is the shot. F is still the keg, so the marble plug still opens.
- Hold V to brace. A short tap with no shot weave still drinks.
- Shift / C still steps, and only if you already can. A step weave rides that step.
- Shrines are the anchors. Marble walls, cracked vein, and locks are seals. Other solids are walls. Off-screen hands take nothing. The Sentinel and the resident are bosses.
- Damage from the sim lands as hearts at 10 sim damage = 1 heart. Nothing homes.

The sandbox follow-cam yard is not in this build. It would replace the Green.
