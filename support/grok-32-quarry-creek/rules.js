/**
 * PREINCARNATION — Quarry & Creek shared combat rules.
 *
 * Ellis, one protagonist, no party. Quarry commits mass and geometry.
 * Creek commits path, timing, and redirect. Neither discipline is a
 * percentage kit: every entry changes a decision, a route, or what an
 * attack is allowed to mean.
 *
 * implemented: true  — the arena simulates this ability.
 * implemented: false — authored only. Data is normative; do not pretend
 *                      the arena resolves it.
 *
 * Safety contract (every ability, simulated or not):
 *   combat never opens a door, never satisfies a dungeon tool,
 *   never crosses protected geometry, never refreshes i-frames.
 */
export const TOOL_ID = "seam_chisel";

const SAFE = Object.freeze({
  crossesProtectedGeometry: false,
  opensDoors: false,
  satisfiesToolRequirement: false,
  grantsRefreshableIFrames: false,
  ignoresMultiTargetCap: false,
});

function A(partial) {
  return Object.freeze({
    implemented: false,
    tier: "core",
    safety: SAFE,
    ...partial,
    cost: Object.freeze({ ...partial.cost }),
    activation: Object.freeze({ ...partial.activation }),
    timings: Object.freeze({ ...partial.timings }),
    tells: Object.freeze({ ...partial.tells }),
    accessibility: Object.freeze({ ...partial.accessibility }),
    boss: Object.freeze({
      ...partial.boss,
      immune: Object.freeze([...(partial.boss.immune || [])]),
    }),
    limits: Object.freeze([...partial.limits]),
    numbers: Object.freeze({ ...(partial.numbers || {}) }),
  });
}

export const ABILITIES = Object.freeze([
  A({
    id: "split_the_fault",
    name: "Split the Fault",
    discipline: "quarry",
    implemented: true,
    summary:
      "Score a fissure across open combat ground, then drive a hammer impact along it. The crack links enemies; it does not link rooms.",
    decision:
      "You choose which line of bodies becomes one impact, and you give up a direct strike to do it. The chain dies on an anchor, a wall, or a shut door.",
    cost: { stamina: 22, mass: 18 },
    cooldownMs: 5500,
    activation: {
      hook: "mark.fissure",
      followUp: "strike.hammer",
      input: "Q marks the line in front of Ellis. J propagates it.",
      requires: ["open combat tiles", "mass to swing"],
    },
    timings: {
      windupMs: 220,
      activeMs: 120,
      recoveryMs: 400,
      markLifetimeMs: 3200,
      chainTiles: 4,
    },
    numbers: { baseDamage: 28, falloff: 0.7, maxTargets: 3, totalCap: 62, chainTiles: 4 },
    tells: {
      telegraph: "A hairline crack draws itself over 220ms before the hammer falls.",
      audio: "Dry tick, then a single low split. No rolling rumble.",
      visual: "Amber-bone seam on the tiles, brightest at the impact and dull at the tail.",
      reducedMotion: "Tile borders flash once. The camera does not shake.",
    },
    limits: [
      "One live fissure. A new mark replaces the old one.",
      "At most 3 targets. Damage 28, then ×0.7, total packet capped at 62.",
      "The trace stops at the first protected tile, shut door, or tool gate. It never jumps them.",
      "An anchored boss is a terminus: they can be hit once, and nothing behind them is reached.",
    ],
    accessibility: {
      timingAssist: "Mark lifetime extends from 3.2s to 4.4s. The seam stays high-contrast the whole time.",
      holdAlternative: "Hold Q to keep the mark preview; release to commit the mark. J still propagates.",
      reducedMotion: "No screen shake. Crack is a static 2px stroke.",
      motor: "Propagation is a separate button from the mark, never a double-tap.",
    },
    boss: {
      interaction:
        "The Seam Warden is anchored. A fissure that reaches the Warden stops there. Adds beyond the Warden are not hit.",
      immune: ["anchor-chain-through", "door-seals", "superarmor-break"],
      partial:
        "The Warden still takes the capped packet but does not stagger and does not drop phase. Unanchored adds chain normally.",
    },
  }),
  A({
    id: "walking_quarry",
    name: "Walking Quarry",
    discipline: "quarry",
    implemented: true,
    summary:
      "Commit to a heavy gait. Momentum can shoulder a loose combat sled one tile. Protected stone, doors, and tools do not move.",
    decision:
      "You spend a run-up and a lane. A sled changes who stands where; it never becomes a key, a bridge over a sealed gap, or a ram for a door.",
    cost: { stamina: 8, mass: 0, massThreshold: 10, shoveMass: 14, staminaPerSecond: 6 },
    cooldownMs: 450,
    activation: {
      hook: "move.committed",
      input: "V toggles the committed gait. Walk into a loose sled after momentum builds.",
      requires: ["mass ≥ 10 to enter", "momentum built by actual movement", "movable combat obstacle"],
    },
    timings: { momentumToShoveMs: 300, shoveLockoutMs: 450, recoveryMs: 200 },
    numbers: { momentumNeeded: 3, shoveMass: 14, entryStamina: 8, staminaPerSecond: 6 },
    tells: {
      telegraph: "Footfalls widen. The sled shows a one-tile slide ghost 150ms before it actually moves.",
      audio: "Grit underfoot, then a short grind if the sled takes the shoulder.",
      visual: "Dust skirt at Ellis's hem. Slide arrow on the sled, bone-colored, not gold.",
      reducedMotion: "Arrow and dust appear without shake.",
    },
    limits: [
      "One sled, one tile, one attempt. A blocked destination interrupts the gait and zeroes momentum.",
      "Destination cannot be a wall, shut or open door, tool gate, cairn, body, or hazard.",
      "Bosses and anchored foes are not movables. Dungeon geometry is not a sled.",
      "No invulnerability while committed. Hits still land.",
    ],
    accessibility: {
      timingAssist: "Momentum threshold is unchanged, but the meter is numeric (0–6) instead of feel.",
      holdAlternative: "V is a toggle, not a hold. The run-up is the timing.",
      reducedMotion: "Slide ghost is a static outline.",
      motor: "Shove direction is Ellis's movement, not a second stick.",
    },
    boss: {
      interaction:
        "The Warden cannot be shoved. A sled can be walked into the Warden's slam lane, which changes where the slam is safe — it does not stagger the Warden.",
      immune: ["boss-displacement", "phase-door", "tool-pedestal"],
      partial: "Movable adds, if a room ever marks them movable, shove one tile like sleds. The Warden stops a sled the way a wall does.",
    },
  }),
  A({
    id: "verdict_of_stone",
    name: "Verdict of Stone",
    discipline: "quarry",
    tier: "capstone",
    implemented: true,
    summary:
      "A timed guard stores one bounded impact, up to two. Releasing spends them as a single aimed packet. Miss the time and the stone forgets.",
    decision:
      "You stand in the hit to own it, then you must cash it out before the next blow or the memory spills. Storage is a stance, not a shield buff.",
    cost: { stamina: 15, mass: 0 },
    cooldownMs: 2000,
    activation: {
      hook: "defend.window",
      followUp: "defend.release",
      input: "Hold K as the strike arrives. Release K to spend stored impact. With motor assist, K toggles and the next K releases.",
      requires: ["a yellow strike inside the tap window", "stored impact to release"],
    },
    timings: {
      perfectWindowMs: 160,
      perfectWindowAssistMs: 260,
      guardMaxMs: 900,
      storeLifetimeMs: 1800,
      iframeMs: 80,
      lockoutMs: 450,
      releaseMs: 280,
    },
    numbers: {
      perfectWindow: 0.16,
      perfectWindowAssist: 0.26,
      guardMax: 0.9,
      storeLifetime: 1.8,
      maxStored: 2,
      packetBase: 18,
      packetPerStore: 22,
      packetCap: 62,
      iframe: 0.08,
      lockout: 0.45,
      redChip: 0.4,
      bossPacketCap: 40,
    },
    tells: {
      telegraph: "A pale stone iris opens on the guard side the moment K is tapped.",
      audio: "One soft ring on a clean catch. A dull knock when the guard is late or the attack is red.",
      visual: "Stored impact sits as one or two chips beside the health ribbon.",
      reducedMotion: "Iris is a static arc. No flash fill.",
    },
    limits: [
      "At most 2 stored impacts. A third catch does not raise the packet.",
      "The perfect hit negates that one yellow strike and spends the i-frame immediately. The next hit in the same guard lands.",
      "I-frames cannot refresh while active or during the 450ms lockout.",
      "Red / unstoppable strikes break the guard, spill every stored chip, and deal 40% chip damage.",
      "Holding guard past 900ms spills the store. Release packet is 18 + 22 per chip, total never above 62, first body in the cone only.",
      "The cone stops at protected geometry. It does not open doors.",
    ],
    accessibility: {
      timingAssist: "Perfect window widens from 160ms to 260ms and a sector shrinks across that window.",
      holdAlternative: "Motor assist: tap K to raise, tap K again to release. No double-tap chord.",
      reducedMotion: "Window is a bar, not a flash.",
      motor: "Guard and release share one button with a down/up or toggle pattern.",
    },
    boss: {
      interaction:
        "The Warden's yellow slam can be caught. The red ring cannot — it breaks Verdict and spills the store.",
      immune: ["red-catch", "superarmor-break", "phase-skip"],
      partial:
        "A caught slam stores a chip. The release packet versus the Warden is capped at 40 and does not cancel the next slam.",
    },
  }),
  A({
    id: "cairnfall",
    name: "Cairnfall",
    discipline: "quarry",
    tier: "capstone",
    implemented: true,
    summary:
      "A rooted swing raises a temporary cairn on one combat tile. It blocks bodies and ordinary shots until it breaks. It is not masonry of the dungeon.",
    decision:
      "You spend a long windup rooted in place to change the lane. Place it wrong and you have built your own wall — or the swing is interrupted and you get nothing.",
    cost: { stamina: 30, mass: 28 },
    cooldownMs: 8000,
    activation: {
      hook: "strike.committed",
      input: "C aims the tile directly ahead. Ellis is rooted for the windup.",
      requires: ["empty legal combat tile", "route to the door must survive the stone"],
    },
    timings: { windupMs: 450, activeMs: 80, recoveryMs: 350, lifetimeMs: 6000 },
    numbers: { windup: 0.45, lifetime: 6, cairnHp: 40, refundFraction: 0.5 },
    tells: {
      telegraph: "Three stone courses ghost on the tile for the whole 450ms windup.",
      audio: "A rising grit, cut short if the swing is broken.",
      visual: "A stacked cairn, clearly temporary: cracked courses, no door hardware.",
      reducedMotion: "The cairn appears at the end of the bar. No camera drop.",
    },
    limits: [
      "One cairn. A new one crumbles the old.",
      "Rejected on walls, doors, tool gates, hazards, bodies, sleds, the alcove, or any tile whose loss would disconnect Ellis from the chisel approach.",
      "A hit, a cancel, or death during the windup raises nothing. Half the stamina returns; the mass stays spent.",
      "The cairn is not a dungeon tool and cannot be shoved by Walking Quarry.",
    ],
    accessibility: {
      timingAssist: "Windup bar is always visible. Assist does not skip the root — the root is the cost.",
      holdAlternative: "Motor assist: C previews, a second C confirms, X cancels before the windup pays.",
      reducedMotion: "No slam shake when the courses lock.",
      motor: "Placement is the facing tile, not a free cursor.",
    },
    boss: {
      interaction:
        "The Warden's labeled sweep destroys a cairn in one hit. Until that sweep, the Warden and adds must path around it. Projectiles from the archer stop on it.",
      immune: ["phase-door-block", "exit-seal", "tool-bypass"],
      partial:
        "Arena-wide red rings ignore the cairn and still hit Ellis if Ellis is in the ring. The cairn remains after the ring.",
    },
  }),
  A({
    id: "brace_the_seam",
    name: "Brace the Seam",
    discipline: "quarry",
    summary:
      "Weld your stance to a live fissure or your own cairn. Knockback fails. Damage does not. You cannot strike while welded.",
    decision:
      "You trade the next attack for the right to keep a tile. If the cairn breaks, so does the brace.",
    cost: { stamina: 12, mass: 8 },
    cooldownMs: 4000,
    activation: {
      hook: "defend.brace",
      input: "Authored: hold beside a fissure tile or your cairn.",
      requires: ["adjacent fissure or own cairn"],
    },
    timings: { windupMs: 80, activeMs: 700, recoveryMs: 240 },
    numbers: { duration: 0.7 },
    tells: {
      telegraph: "Ellis's feet sink a finger's width. The seam brightens toward the boots.",
      audio: "A short set, like stone taking weight.",
      visual: "Boots outlined, seam lit only between Ellis and the anchor.",
      reducedMotion: "Outline without the sink.",
    },
    limits: [
      "Negates knockback only. Full damage still applies. No i-frames.",
      "Cannot brace on a door, a tool gate, or protected masonry.",
      "Destroyed anchor interrupts the brace.",
      "No attack, no shove, no cairn swing while braced.",
    ],
    accessibility: {
      timingAssist: "Not a parry. A bar shows the 700ms.",
      holdAlternative: "Toggle brace. The same button releases early.",
      reducedMotion: "Static boot outline.",
      motor: "Legal targets highlight when adjacent. No flick.",
    },
    boss: {
      interaction: "The Warden's unbraceable grab still pulls Ellis. Ordinary slam knockback is ignored; slam damage is not.",
      immune: ["grab-immunity", "damage-immunity"],
      partial: "Yellow knockback from adds is ignored for the brace duration.",
    },
  }),
  A({
    id: "hammer_toll",
    name: "Hammer Toll",
    discipline: "quarry",
    summary:
      "Ring a cairn or a sled. The sound lays a lane. The next Fault mark is forced to follow that lane instead of Ellis's free aim.",
    decision:
      "You strike stone instead of a body so the next fissure stops being a free draw. A silent room gives you nothing.",
    cost: { stamina: 18, mass: 0 },
    cooldownMs: 3500,
    activation: {
      hook: "strike.heavy",
      input: "Authored: heavy strike aimed at a cairn or sled.",
      requires: ["cairn or movable"],
    },
    timings: { windupMs: 380, activeMs: 200, recoveryMs: 300, laneMs: 4000 },
    numbers: { directDamage: 16, laneTiles: 4 },
    tells: {
      telegraph: "The struck stone tilts and a ring expands along the coming lane.",
      audio: "A single bell-dry tone. Silence phase: a muffled thud and no lane.",
      visual: "Four chevrons, high contrast, stopping at the first protected tile.",
      reducedMotion: "Chevrons appear at once, no expanding ring.",
    },
    limits: [
      "Lane length 4 and never crosses protected geometry, doors, or tool gates.",
      "A direct hit on a body is 16 and does not also lay a lane.",
      "One lane. It constrains the next Fault mark's direction; it does not increase Fault's cap.",
    ],
    accessibility: {
      timingAssist: "Windup bar. The lane, once laid, does not require a follow-up timing.",
      holdAlternative: "Direction is the last move input, confirmed with the strike.",
      reducedMotion: "Static chevrons.",
      motor: "No rhythm mini-game. One windup.",
    },
    boss: {
      interaction: "The Warden is not stunned by the toll. In a silence phase the lane fizzles and the stamina is still spent.",
      immune: ["stun", "silence-phase"],
      partial: "Outside silence, a lane can still be drawn across open ground the Warden occupies, and Fault still stops on the anchor.",
    },
  }),
  A({
    id: "scree_step",
    name: "Scree Step",
    discipline: "quarry",
    summary:
      "Within a short memory of a shove or a raised cairn, step one tile onto rubble-legal ground — a combat pit marked traversable, never a protected gap.",
    decision:
      "The sled or the cairn becomes a stepping stone you either use immediately or lose. It is a route change with an expiry, not a jump upgrade.",
    cost: { stamina: 10, mass: 0 },
    cooldownMs: 2500,
    activation: {
      hook: "move.rubble",
      input: "Authored: a prompt appears for 1.2s after a qualifying shove or cairn.",
      requires: ["qualifying event within 1.2s", "destination flagged traversable_by_rubble"],
    },
    timings: { offerMs: 1200, activeMs: 160, recoveryMs: 200 },
    numbers: { offer: 1.2, distance: 1 },
    tells: {
      telegraph: "The legal tile lifts a rubble glint and a 'Step' prompt.",
      audio: "A skitter of small stone, only if the step commits.",
      visual: "One tile outlined. Protected gaps stay unmarked.",
      reducedMotion: "Outline without glint animation.",
    },
    limits: [
      "One tile. Destination must be flagged traversable_by_rubble.",
      "Protected gaps, walls, shut doors, and tool gates are illegal. The step does not open them.",
      "A hit during the step returns Ellis to the origin tile.",
      "If the rubble source is gone, the offer dies.",
    ],
    accessibility: {
      timingAssist: "Offer lasts 1.8s instead of 1.2s.",
      holdAlternative: "The prompt is a button, not a gesture.",
      reducedMotion: "Static outline.",
      motor: "One confirm. No analogue aim.",
    },
    boss: {
      interaction: "Warden pits flagged protected_gap never take a Scree Step, even if a sled sits beside them.",
      immune: ["protected_gap", "phase-floor"],
      partial: "Combat pits explicitly flagged traversable_by_rubble can be crossed once.",
    },
  }),
  A({
    id: "weight_of_names",
    name: "Weight of Names",
    discipline: "quarry",
    summary:
      "Name an enemy and share your mass with them. Their reposition tools shorten. Yours do too, for as long as you keep the name.",
    decision:
      "You hobble a mobile foe by hobbling yourself. Dropping the name is the only way to move freely again.",
    cost: { stamina: 16, mass: 12 },
    cooldownMs: 7000,
    activation: {
      hook: "mark.weight",
      input: "Authored: dwell or confirm on one enemy.",
      requires: ["one living enemy in line of sight, not through protected stone"],
    },
    timings: { windupMs: 200, activeMs: 3000, recoveryMs: 200 },
    numbers: { duration: 3, enemyDashScale: 0.5, selfSpeedScale: 0.72 },
    tells: {
      telegraph: "A name-rune sinks into the target over 200ms. Ellis's hem drags.",
      audio: "A low syllable, cut off if line of sight breaks.",
      visual: "Rune on the foe, drag marks under Ellis. Not a stun icon.",
      reducedMotion: "Rune pops in without the sink.",
    },
    limits: [
      "One name. It does not root, stun, or deal damage.",
      "Named foe's dash distance is halved. Ellis's move speed is ×0.72 until the name ends or is dropped.",
      "Line of sight cannot be drawn through walls or shut doors.",
      "Phase transitions cleanse the name.",
    ],
    accessibility: {
      timingAssist: "Dwell-to-mark 400ms. No twitch confirm required.",
      holdAlternative: "Toggle the name off early with the same button.",
      reducedMotion: "Static rune.",
      motor: "Nearest foe in a wide arc, or a cycle target. No flick.",
    },
    boss: {
      interaction: "The Warden can be named. Their reposition during a phase is shortened, not locked. The next phase cleanses it.",
      immune: ["root", "phase-lock"],
      partial: "Adds fully obey the shortened dash. The Warden's scripted phase steps still happen, at half distance when the step is a dash rather than a teleport.",
    },
  }),
  A({
    id: "quarry_breadth",
    name: "Quarry Breadth",
    discipline: "quarry",
    summary:
      "Take the width of a doorway yourself. You intercept shots aimed at one neighboring tile, and you no longer fit through a one-tile corridor or a tool gate.",
    decision:
      "You become terrain. Useful beside a switch you must not let a shot touch. Useless, and illegal, in a narrow cut — and you are the thing that eats the shot.",
    cost: { stamina: 8, mass: 20 },
    cooldownMs: 6000,
    activation: {
      hook: "stance.breadth",
      input: "Authored: hold the stance. It will not start in a 1-wide corridor.",
      requires: ["a tile wide enough to expand", "mass"],
    },
    timings: { windupMs: 120, activeMs: 2200, recoveryMs: 300 },
    numbers: { duration: 2.2, interceptChip: 0.5 },
    tells: {
      telegraph: "Ellis's silhouette squares outward to the neighboring tile.",
      audio: "Cloth and stone, a short set.",
      visual: "A second body-block ghost on the chosen side.",
      reducedMotion: "Ghost is immediate and still.",
    },
    limits: [
      "Cannot start if either side is a wall, door, or corridor of width 1.",
      "Intercepted deflectable shots deal 50% to Ellis. They do not pass.",
      "Unstoppable shots ignore the stance and deal full damage.",
      "Duration capped. Dungeon doors do not use Ellis's body as their lock state.",
      "No i-frames.",
    ],
    accessibility: {
      timingAssist: "Not a parry. Duration bar only.",
      holdAlternative: "Hold to maintain, release to drop early. Motor assist: toggle.",
      reducedMotion: "No pulse on the ghost tile.",
      motor: "Side is chosen from the last strafe, shown before commit.",
    },
    boss: {
      interaction: "The Warden's unstoppable red ring ignores Breadth. Yellow shots from adds can be body-blocked at the 50% chip.",
      immune: ["unstoppable-block"],
      partial: "Blocking a yellow add shot still hurts. It can keep a shot off a fragile switch tile beside Ellis.",
    },
  }),
  A({
    id: "loose_keystone",
    name: "Loose Keystone",
    discipline: "quarry",
    summary:
      "Kick your own cairn into a roll. You lose the cover. The stone travels one cardinal until it meets a body or protected ground.",
    decision:
      "Cover or projectile — the cairn cannot be both. The roll is the moment you decide the lane you built was a weapon.",
    cost: { stamina: 14, mass: 0 },
    cooldownMs: 4000,
    activation: {
      hook: "strike.keystone",
      input: "Authored: strike your cairn and choose a cardinal.",
      requires: ["your live cairn"],
    },
    timings: { windupMs: 160, activeMs: 400, recoveryMs: 240 },
    numbers: { damage: 24, maxTargets: 1, bossChip: 12 },
    tells: {
      telegraph: "The cairn tilts toward the chosen cardinal.",
      audio: "A clack, then a short grind that ends in a stop.",
      visual: "Tilt ghost, then the courses tumble along the lane and shatter at the stop.",
      reducedMotion: "The stone disappears from the origin and appears at the stop. No tumble frames.",
    },
    limits: [
      "Requires your cairn and destroys it even if the roll immediately stops.",
      "First enemy only, 24 damage. Total cap 24, max 1 target.",
      "Stops before walls, doors, and tool gates. Never travels through them.",
      "If the next tile is already protected, the cairn shatters in place.",
    ],
    accessibility: {
      timingAssist: "No timing window. Confirm direction, then it rolls.",
      holdAlternative: "Direction from the last movement input, with a confirm.",
      reducedMotion: "No tumbling frames.",
      motor: "Cardinals only.",
    },
    boss: {
      interaction: "The Warden stops the stone and destroys it, taking 12 chip. The Warden does not stagger.",
      immune: ["stagger", "displacement"],
      partial: "Adds take the full 24 if they are first in the lane.",
    },
  }),
  A({
    id: "bedrock_vow",
    name: "Bedrock Vow",
    discipline: "quarry",
    summary:
      "Plant and do not move. If the second passes clean, your next Quarry ability spends no mass. A hit breaks the vow and staggers you.",
    decision:
      "You bet a full second of stillness against the room's next tell. The reward is not damage — it is the right to afford a mass ability you otherwise could not.",
    cost: { stamina: 0, mass: 0 },
    cooldownMs: 8000,
    activation: {
      hook: "stance.vow",
      input: "Authored: plant. Cancel with the same button before it completes.",
      requires: ["a non-hazard tile", "no hit until the vow completes"],
    },
    timings: { windupMs: 0, activeMs: 1000, recoveryMs: 200, staggerMs: 300 },
    numbers: { plant: 1, stagger: 0.3 },
    tells: {
      telegraph: "A ring draws closed around Ellis's feet for one second.",
      audio: "Almost nothing, then a single set if the vow completes. A crack if it breaks.",
      visual: "Ring. On completion, the next Quarry ability's mass cost reads zero until it is spent.",
      reducedMotion: "The ring is a bar.",
    },
    limits: [
      "Not invulnerable. Any hit breaks the vow, spills the promise, and staggers 300ms.",
      "Cannot plant on a hazard, a door, or inside a windup.",
      "The mass waiver applies to exactly one following Quarry ability, then clears.",
      "Death clears the waiver.",
    ],
    accessibility: {
      timingAssist: "The bar is textual ('still') as well as drawn. Assist does not shorten the plant.",
      holdAlternative: "Toggle to plant, same button cancels.",
      reducedMotion: "Bar instead of a closing ring.",
      motor: "No rhythm. Survival is the input.",
    },
    boss: {
      interaction: "The Warden's ring and slam break the vow if they reach Ellis's tile. Plant outside the tell or do not plant.",
      immune: ["invulnerability"],
      partial: "A completed vow still only waives mass. It does not change the Warden's caps.",
    },
  }),
  A({
    id: "ashlar_interval",
    name: "Ashlar Interval",
    discipline: "quarry",
    summary:
      "Raise two temporary posts with a gap between them. Non-boss foes prefer to approach through that gap. The posts are not a door.",
    decision:
      "You rewrite approach lanes for a short time, and the placement is illegal if it would be the thing that seals the chisel route.",
    cost: { stamina: 24, mass: 16 },
    cooldownMs: 9000,
    activation: {
      hook: "place.interval",
      input: "Authored: confirm two adjacent empty tiles.",
      requires: ["two adjacent legal tiles", "route to the tool remains"],
    },
    timings: { windupMs: 300, activeMs: 2400, recoveryMs: 280 },
    numbers: { duration: 2.4 },
    tells: {
      telegraph: "Both posts ghost before they exist.",
      audio: "Two sets, a third of a second apart.",
      visual: "A gap marked with a quiet threshold line. No lock, no hinge.",
      reducedMotion: "Ghosts pop to solid with no shake.",
    },
    limits: [
      "Cannot place on doors, tools, hazards, or protected tiles.",
      "Rejected if the posts would disconnect Ellis from a required tool approach or an open exit.",
      "Posts are temporary combat obstacles. They do not change door state.",
      "One interval at a time.",
    ],
    accessibility: {
      timingAssist: "Preview persists until confirm or cancel. No expire-to-commit.",
      holdAlternative: "Confirm / cancel buttons. Not a hold-to-grow.",
      reducedMotion: "No camera shake on the set.",
      motor: "The pair is axis-aligned to facing. No free rotate.",
    },
    boss: {
      interaction: "The Warden ignores the lane preference. A Warden charge breaks both posts like a cairn. Adds prefer the gap while the posts stand.",
      immune: ["boss-path-lock", "exit-seal"],
      partial: "Adds can be funneled. The Warden cannot.",
    },
  }),
  A({
    id: "borrowed_current",
    name: "Borrowed Current",
    discipline: "creek",
    implemented: true,
    summary:
      "A successful evade against a yellow attack stores its vector. Your next strike within the memory sends that current back along a direction you choose.",
    decision:
      "You spend the evade on a catch instead of pure distance. Red attacks refuse to be borrowed. The counter is one target, and a wall eats it.",
    cost: { stamina: 10, flow: 0 },
    cooldownMs: 1800,
    activation: {
      hook: "evade.success",
      followUp: "attack.counter",
      input: "Space arms a short dash. If a yellow attack would land during the arm, the vector is kept. J spends it.",
      requires: ["armed evade", "yellow deflectable attack"],
    },
    timings: {
      armMs: 800,
      armAssistMs: 1150,
      iframeMs: 120,
      lockoutMs: 350,
      counterMemoryMs: 1400,
      dashMs: 120,
    },
    numbers: {
      arm: 0.8,
      armAssist: 1.15,
      iframe: 0.12,
      lockout: 0.35,
      counterMemory: 1.4,
      counterDamage: 20,
      bossCap: 14,
      maxTargets: 1,
    },
    tells: {
      telegraph: "A water thread lies along the stolen vector. The counter draws a pale arrow in the direction J will use.",
      audio: "A sip of water on the catch. A thin pour on the counter.",
      visual: "Thread and arrow. The dash itself is a short smear, suppressed if motion is reduced.",
      reducedMotion: "Thread and arrow only. Dash is a blink of position, no smear.",
    },
    limits: [
      "One stored current. It expires after 1.4s.",
      "Red and unstoppable attacks do not store a current and do not grant the evade's i-frame.",
      "The i-frame covers that one caught hit, then lockout blocks another evade i-frame for 350ms. It cannot be refreshed.",
      "Counter damage is 20 to the first body along the aim, range 2. Bosses take 14. A protected tile in the way stops it.",
      "Returned shots do not bounce.",
    ],
    accessibility: {
      timingAssist: "Arm window widens from 800ms to 1150ms.",
      holdAlternative: "Counter direction locks to 'back along the stolen vector' unless Ellis is actively moving. No flick required.",
      reducedMotion: "No dash smear. Arrow remains.",
      motor: "Space then J. The return direction can be automatic.",
    },
    boss: {
      interaction: "The Warden's yellow slam can be borrowed. The red ring cannot. A returned counter does not cancel the Warden's next action.",
      immune: ["red-borrow", "cast-cancel"],
      partial: "Yellow slams store a vector. The counter caps at 14 versus the Warden and will not pass a wall to reach them.",
    },
  }),
  A({
    id: "return_flood",
    name: "Return Flood",
    discipline: "creek",
    implemented: true,
    summary:
      "Retrace up to four tiles you actually stood on, re-checking each one. The flood stops at the first tile that is no longer legal.",
    decision:
      "Your recent path is a resource you can spend, but only if the room still agrees with it. A shut door, a new cairn, or a body in the way ends the return early.",
    cost: { stamina: 18, flow: 12 },
    cooldownMs: 5000,
    activation: {
      hook: "move.retrace",
      input: "R spends the path tape.",
      requires: ["at least one recorded step behind Ellis"],
    },
    timings: { playbackMs: 450, tapeTiles: 4, recoveryMs: 160 },
    numbers: { playback: 0.45, tape: 4, flowOnClean: 8 },
    tells: {
      telegraph: "Ghost footprints light in reverse order before Ellis moves.",
      audio: "Water running backward, cut off if a step is refused.",
      visual: "Numbered dots on the tape. The next step pulses.",
      reducedMotion: "Dots are static. Ellis changes tiles without a blur.",
    },
    limits: [
      "Tape records only tiles that were legal at the time, max 4, and never records during the retrace itself.",
      "Each step is validated again. Walls, shut doors, tool gates, cairns, and bodies abort the rest.",
      "An empty tape fizzles and refunds the cost. No movement.",
      "A hit interrupts the flood. Ellis stays on the last valid tile. No i-frames.",
      "Death and loadout reset clear the tape.",
    ],
    accessibility: {
      timingAssist: "The tape is always drawn. Playback is the same length; nothing is a surprise.",
      holdAlternative: "R is a confirm, not a hold. The path is previewed whenever it exists.",
      reducedMotion: "No motion blur along the retrace.",
      motor: "One button. No analogue path edit.",
    },
    boss: {
      interaction: "If the Warden occupies a tape tile, that step is illegal and the flood stops on the previous tile. Ellis is not placed inside the Warden.",
      immune: ["teleport-through-boss", "phase-rewind"],
      partial: "A grab can interrupt the flood like any other hit.",
    },
  }),
  A({
    id: "river_between_heartbeats",
    name: "River Between Heartbeats",
    discipline: "creek",
    tier: "capstone",
    implemented: true,
    summary:
      "For a brief window, the first three deflectable shots that touch Ellis become motes on Ellis's heel instead of wounds. A fourth shot, a blade, or an unstoppable ring still wounds.",
    decision:
      "You choose a lane that contains some shots, not all of them. The window rewrites projectiles you can afford to touch. It is not invulnerability, and it ends your next evade.",
    cost: { stamina: 26, flow: 20 },
    cooldownMs: 9000,
    activation: {
      hook: "stance.heartbeat",
      input: "H opens the window. Movement is slowed while it is open. It ends early if you strike.",
      requires: ["flow", "deflectable projectiles if you want motes"],
    },
    timings: {
      windowMs: 850,
      windowAssistMs: 1150,
      recoveryMs: 400,
      moveScale: 0.8,
    },
    numbers: {
      window: 0.85,
      windowAssist: 1.15,
      moteCap: 3,
      moteDamage: 12,
      bossMoteCap: 12,
      moveScale: 0.8,
      recovery: 0.4,
    },
    tells: {
      telegraph: "A heartbeat ring closes once. Deflectable shots gain a hard outline.",
      audio: "One low heartbeat. Each caught shot is a drip.",
      visual: "Up to three motes trail Ellis. The ring is the timer.",
      reducedMotion: "No desaturation. A border pulse and a numeric mote count.",
    },
    limits: [
      "Only the first 3 deflectable projectiles are negated and stored. The 4th deflectable projectile hits.",
      "Unstoppable and red projectiles always hit. Melee always hits. No i-frames are granted.",
      "Ellis does not pass through bodies, walls, doors, hazards, or tool gates.",
      "Move speed is ×0.8 for the window. Afterward, evade is locked for 400ms.",
      "Released motes stop at the first protected tile or shut door. They do not open it.",
      "The window cannot be refreshed.",
    ],
    accessibility: {
      timingAssist: "Window extends from 850ms to 1150ms. A bar plus mote count is always shown.",
      holdAlternative: "H is a single press, not a hold. Striking ends it early if you want the motes now.",
      reducedMotion: "No world desaturation. Outlines stay.",
      motor: "No aim required to catch. Release direction is facing.",
    },
    boss: {
      interaction: "The Warden's red ring is unstoppable and ignores the rewrite. Yellow archer shots can be caught, up to the cap of three.",
      immune: ["unstoppable-rewrite", "iframe", "cast-interrupt"],
      partial: "Motes that hit the Warden deal 12 each and do not stagger or cancel a slam.",
    },
  }),
  A({
    id: "undertow",
    name: "Undertow",
    discipline: "creek",
    implemented: true,
    summary:
      "Mark a foe. Your next strike lane pulls them along open ground into that lane, at most two tiles. The pull does no damage. The strike might.",
    decision:
      "You choose who is dragged into a swing you were already going to make. A wall, a door, or an anchor refuses. Marking the Warden spends the attempt and moves nobody.",
    cost: { stamina: 16, flow: 14 },
    cooldownMs: 4500,
    activation: {
      hook: "mark.undertow",
      followUp: "attack.lane",
      input: "U marks the nearest foe in front. J defines the lane and pulls, then strikes.",
      requires: ["a non-anchored foe", "a clear path of at most 2 tiles into the lane"],
    },
    timings: { markMs: 2000, pullMs: 160, shortenedCooldownMs: 2000 },
    numbers: { mark: 2, maxPull: 2, pullDamage: 0, anchorCooldown: 2 },
    tells: {
      telegraph: "A swirl at the foe's feet points along the would-be pull.",
      audio: "A drain, only if the pull actually moves them. A dry gulp if they are anchored.",
      visual: "Dashed path, two tiles at most, stopping where the ground refuses.",
      reducedMotion: "Dashed path is static.",
    },
    limits: [
      "Pull damage is 0. Displacement max 2 tiles along validated floor.",
      "The path cannot cross walls, shut doors, tool gates, cairns, or sleds.",
      "If the path is blocked, the foe does not move and the mark is spent.",
      "Anchored or heavy foes are not pulled. Flow is refunded and the cooldown shortens to 2s.",
      "A hit on Ellis before the strike drops the mark.",
      "One mark.",
    ],
    accessibility: {
      timingAssist: "Mark lasts 2.6s. The path is drawn the whole time.",
      holdAlternative: "The strike is the explicit confirm. Nothing pulls on a timer.",
      reducedMotion: "Static swirl and dashes.",
      motor: "U cycles the nearest legal foe in the facing cone. No flick.",
    },
    boss: {
      interaction: "The Seam Warden is anchored and heavy. Undertow does not pull the Warden and does not pull Ellis toward them.",
      immune: ["boss-displacement", "self-pull"],
      partial: "Adds in front of the Warden can still be pulled into a lane if the tiles between are open. The Warden's body counts as blocked ground.",
    },
  }),
  A({
    id: "eddy",
    name: "Eddy",
    discipline: "creek",
    summary:
      "Leave a swirl on one tile. The next deflectable shot that enters it turns 90° along your last facing. A foe who steps in is turned to face the exit — they are not slowed.",
    decision:
      "You edit one projectile's corner, or one add's facing, by giving up the tile and your last direction. Unstoppable shots ignore it.",
    cost: { stamina: 8, flow: 12 },
    cooldownMs: 5000,
    activation: {
      hook: "place.eddy",
      input: "Authored: place on an empty combat tile. Exit follows the last move facing.",
      requires: ["empty non-protected tile"],
    },
    timings: { windupMs: 100, activeMs: 4000, recoveryMs: 120 },
    numbers: { duration: 4, turnDeg: 90 },
    tells: {
      telegraph: "A swirl ghost and an exit arrow before the place commits.",
      audio: "A small suck of water.",
      visual: "Swirl plus a hard arrow. The turned shot keeps its speed.",
      reducedMotion: "No animated swirl. Arrow remains.",
    },
    limits: [
      "One eddy. Cannot place on doors, tools, hazards, or protected tiles.",
      "If the new direction's first tile is protected, the shot stops instead of phasing through.",
      "Foes are reoriented, not slowed and not damaged.",
      "Bosses are not reoriented. Unstoppable shots ignore the eddy.",
    ],
    accessibility: {
      timingAssist: "No timing. The arrow shows the exit before confirm.",
      holdAlternative: "Confirm / cancel. Exit is last facing, not a drag.",
      reducedMotion: "Static arrow.",
      motor: "Placement is the tile ahead.",
    },
    boss: {
      interaction: "The Warden is not turned. Red rings ignore the eddy. Yellow add shots can be cornered once.",
      immune: ["boss-reorient", "unstoppable"],
      partial: "A yellow shot turned into a wall dies on the wall. It does not open a door if the turn points at one.",
    },
  }),
  A({
    id: "shallow_cut",
    name: "Shallow Cut",
    discipline: "creek",
    summary:
      "Dash two tiles, but only if the landing tile is wet — crossed already, a creek hazard, or a place a mote burst. Otherwise you pay a fizzle and stay.",
    decision:
      "Distance is conditional on the path you already paid for. A dry dash does not happen. There are no i-frames either way.",
    cost: { stamina: 14, flow: 0, fizzleStamina: 6 },
    cooldownMs: 2200,
    activation: {
      hook: "move.shallow",
      input: "Authored: dash toward facing. Wet tiles are marked.",
      requires: ["wet landing tile"],
    },
    timings: { activeMs: 140, recoveryMs: 160 },
    numbers: { distance: 2, successStamina: 14, fizzleStamina: 6 },
    tells: {
      telegraph: "Wet tiles carry a persistent hatch, not only a glint.",
      audio: "A cut of water on success. A missed step on fizzle.",
      visual: "Hatch on wet ground. The dash has no afterimage if motion is reduced.",
      reducedMotion: "Position changes without afterimage.",
    },
    limits: [
      "Landing must be wet. Dry landing fizzles: no movement, 6 stamina, cooldown still applies.",
      "No i-frames. Intermediate tile if the landing is illegal: stop on the last legal tile, or stay if even the first is illegal.",
      "Cannot pass through bodies, walls, shut doors, or phase floors.",
    ],
    accessibility: {
      timingAssist: "Wet tiles use a hatch pattern, not color alone.",
      holdAlternative: "One press. No charge.",
      reducedMotion: "No afterimage.",
      motor: "Facing or held move direction. No flick.",
    },
    boss: {
      interaction: "You may dash on wet tiles beside the Warden. You may not dash through the Warden or across a phase wall.",
      immune: ["phase-floor", "through-boss"],
      partial: "Wet combat ground remains usable during the fight if Ellis earned it.",
    },
  }),
  A({
    id: "two_rivers",
    name: "Two Rivers",
    discipline: "creek",
    summary:
      "The next strike splits into two angled lanes. Each can wound one body. You cannot also spend Borrowed Current on that same strike.",
    decision:
      "Width instead of the stolen vector. You pick the split when two foes are offset, and you permanently decline the counter for that swing.",
    cost: { stamina: 18, flow: 10 },
    cooldownMs: 4000,
    activation: {
      hook: "attack.split",
      input: "Authored: arm the split, then strike. Cancels a stored borrow on that swing without firing it.",
      requires: ["the strike that follows"],
    },
    timings: { armMs: 2000, activeMs: 120, recoveryMs: 220 },
    numbers: { perLane: 15, totalCap: 30, bossCap: 20, maxTargets: 2 },
    tells: {
      telegraph: "Two arrows leave Ellis at a fixed offset.",
      audio: "A divided pour.",
      visual: "Both lanes drawn to their first stop.",
      reducedMotion: "Static arrows.",
    },
    limits: [
      "Each lane hits at most one body for 15. Total cap 30.",
      "Mutually exclusive with Borrowed Current on the same attack. Arming the split clears the stored vector without firing it.",
      "Both lanes stop at protected geometry and shut doors.",
      "Versus a boss the whole attack caps at 20 even if both lanes somehow meet them.",
    ],
    accessibility: {
      timingAssist: "Offsets are fixed and drawn. No timing.",
      holdAlternative: "One stick aims the pair symmetrically. No independent micro-aim required.",
      reducedMotion: "Static arrows.",
      motor: "Symmetric offsets only.",
    },
    boss: {
      interaction: "Both lanes may reach the Warden; together they still stop at 20 and do not stagger.",
      immune: ["cap-bypass", "stagger"],
      partial: "Adds off-angle can each take a lane. That is the reason to split.",
    },
  }),
  A({
    id: "still_pool",
    name: "Still Pool",
    discipline: "creek",
    summary:
      "Stand still long enough to leave a pool in a lane you are not standing in. The next attack vector that crosses it is recorded as if you had evaded it. You are not protected.",
    decision:
      "Flow without a dodge, bought with stillness and with placement. Stand in the pool and you record the vector while still taking the hit.",
    cost: { stamina: 0, flow: 0 },
    cooldownMs: 6000,
    activation: {
      hook: "stance.pool",
      input: "Authored: plant 0.8s. Moving early cancels.",
      requires: ["stillness", "a legal tile that is not a door or tool"],
    },
    timings: { plantMs: 800, poolMs: 3000 },
    numbers: { plant: 0.8, pool: 3, flowGrant: 14 },
    tells: {
      telegraph: "A ring closes while Ellis is still. The pool is a flat disc.",
      audio: "Quiet. A single drip when a vector is recorded.",
      visual: "Disc on the tile. Recorded vector shown as a thread, same as Borrowed Current.",
      reducedMotion: "Bar for the plant. Disc appears without a ripple.",
    },
    limits: [
      "The pool does not block movement, shots, or melee, and does not grant i-frames.",
      "A red vector can be recorded but is marked unusable for Borrowed Current.",
      "Cannot place on a door, tool gate, or protected tile.",
      "One pool. Moving during the plant cancels at no cooldown.",
    ],
    accessibility: {
      timingAssist: "Plant bar plus the word Still. Assist does not skip stillness.",
      holdAlternative: "Toggle to plant. Same button cancels.",
      reducedMotion: "No ripple.",
      motor: "The pool drops on Ellis's tile at the end of the plant. Place yourself first.",
    },
    boss: {
      interaction: "A yellow slam vector crossing the pool can feed Borrowed Current. The red ring records as unusable.",
      immune: ["red-to-borrow", "protection"],
      partial: "You can farm a yellow vector without dodging the Warden, if the pool is in the lane and you are not.",
    },
  }),
  A({
    id: "confluence",
    name: "Confluence",
    discipline: "creek",
    summary:
      "If a Return Flood path crosses your eddy, you may leave the retrace along the eddy's arrow instead of the old path.",
    decision:
      "The tape and the eddy are two commitments that only pay off together. The alternate exit still has to be a legal tile.",
    cost: { stamina: 12, flow: 15 },
    cooldownMs: 7000,
    activation: {
      hook: "move.confluence",
      input: "Authored: when the flood preview crosses an eddy, a second confirm offers the exit.",
      requires: ["an active or previewed flood", "an eddy on that tape"],
    },
    timings: { decideMs: 400 },
    numbers: { decide: 0.4 },
    tells: {
      telegraph: "The eddy's arrow brightens and a ghost Ellis stands on the exit tile.",
      audio: "Two currents joining, brief.",
      visual: "Ghost on the alternate tile. Illegal exits are marked refused, not hidden.",
      reducedMotion: "Ghost without a sweep.",
    },
    limits: [
      "If the exit tile is illegal — wall, shut door, body, boss, hazard you did not mean — the flood finishes on its original path.",
      "Cannot exit through a door or onto a tool gate.",
      "Does not extend the tape. It only chooses where a legal flood lets go.",
    ],
    accessibility: {
      timingAssist: "The offer stays up for the whole flood preview, not 400ms, when assist is on.",
      holdAlternative: "A second button confirms the exit. The flood button alone keeps the original path.",
      reducedMotion: "Static ghost.",
      motor: "No aim. The eddy already has an arrow.",
    },
    boss: {
      interaction: "An exit tile inside the Warden is illegal. The original flood runs instead.",
      immune: ["place-inside-boss"],
      partial: "A legal exit beside the Warden is allowed and still provokes them.",
    },
  }),
  A({
    id: "keel",
    name: "Keel",
    discipline: "creek",
    summary:
      "Ride one tile on a mote or on a foe Undertow is already pulling. You take their next open tile. If they die on a wall, you stay behind.",
    decision:
      "You hitch to something already in motion. It is how you cross one rideable combat gap — and how you are left in a hazard if the ride stops there.",
    cost: { stamina: 0, flow: 10 },
    cooldownMs: 3000,
    activation: {
      hook: "move.keel",
      input: "Authored: a Ride prompt when a mote or a pulled foe passes adjacent.",
      requires: ["an adjacent mote or undertow victim", "a legal next tile"],
    },
    timings: { offerMs: 500, activeMs: 160 },
    numbers: { distance: 1 },
    tells: {
      telegraph: "A 'Ride' prompt and a one-tile ghost.",
      audio: "A short plane of water.",
      visual: "Ghost tile. Protected gaps show no prompt.",
      reducedMotion: "Prompt without a moving cue line.",
    },
    limits: [
      "One tile. No i-frames.",
      "Cannot ride unstoppable projectiles, cannot ride into a boss, cannot cross a protected gap.",
      "If the carrier stops on protected ground, Ellis remains on the previous tile.",
      "Stopping on a hazard means the hazard applies.",
    ],
    accessibility: {
      timingAssist: "Prompt lasts 800ms.",
      holdAlternative: "The prompt is a button that appears only when legal.",
      reducedMotion: "No cue-line motion.",
      motor: "One confirm.",
    },
    boss: {
      interaction: "The Warden's unstoppable ring cannot be keeled. Ellis cannot ride into the Warden's tile.",
      immune: ["unstoppable-ride", "into-boss", "protected_gap"],
      partial: "A mote Ellis already caught can carry them one rideable combat tile.",
    },
  }),
  A({
    id: "glass_current",
    name: "Glass Current",
    discipline: "creek",
    summary:
      "For a short breath, new steps are not written to the path tape, and ranged adds lead the velocity you had — not the one you have now. Striking ends it.",
    decision:
      "You become hard to lead by giving up Return Flood's memory of this moment. Melee foes and true-aim bosses are unimpressed.",
    cost: { stamina: 0, flow: 18 },
    cooldownMs: 8000,
    activation: {
      hook: "stance.glass",
      input: "Authored: one press. Any attack cancels it.",
      requires: ["flow"],
    },
    timings: { activeMs: 1200, recoveryMs: 200 },
    numbers: { duration: 1.2 },
    tells: {
      telegraph: "A ghost marker continues on the old velocity. Ellis's real body is drawn sharper, not hidden.",
      audio: "A thin glass note.",
      visual: "Ghost marker where shots will be aimed. Ellis remains fully visible.",
      reducedMotion: "Ghost marker without a trail.",
    },
    limits: [
      "Not invisibility and not i-frames. Melee targeting is unchanged.",
      "Path tape does not gain entries while glass is up, so a later flood cannot use these steps.",
      "Any attack Ellis makes ends the stance.",
      "Bosses flagged true_aim ignore it. The tell on them is an eye that does not glaze.",
    ],
    accessibility: {
      timingAssist: "Duration bar. The ghost marker is the information, and it is always drawn.",
      holdAlternative: "One press. No charge.",
      reducedMotion: "No trail, marker only.",
      motor: "No aim.",
    },
    boss: {
      interaction: "The Seam Warden has true aim. Glass Current does not change the Warden's ring or slam. It still fools ordinary archers.",
      immune: ["true_aim"],
      partial: "Adds without true aim lead the ghost. That can open a real lane beside the Warden.",
    },
  }),
  A({
    id: "spring_thaw",
    name: "Spring Thaw",
    discipline: "creek",
    tier: "capstone",
    implemented: false,
    summary:
      "Spend all remaining flow to restore creek temporaries — motes, eddies, pools, the path tape, and Undertow displacements — to a snapshot a few seconds old. Health, bosses, doors, and tools do not thaw.",
    decision:
      "You erase the current creek setup to recover a previous one, including pulling an add back out of a pit you worked to create. It is a commitment backward, not a heal.",
    cost: { stamina: 0, flow: 0, minFlow: 40, spendAllFlow: true },
    cooldownMs: 20000,
    activation: {
      hook: "world.thaw",
      input: "Authored: hold the preview, release to commit, or cancel inside the preview.",
      requires: ["at least 40 flow", "a snapshot no older than 3s", "Ellis alive"],
    },
    timings: { previewMs: 350, previewAssistMs: 700, snapshotMs: 3000 },
    numbers: { minFlow: 40, preview: 0.35, previewAssist: 0.7, snapshot: 3 },
    tells: {
      telegraph: "Pale lines show the restored positions for the whole cancel window before anything moves.",
      audio: "A heartbeat in reverse, then a wash if you commit.",
      visual: "Ghost positions. Invalid ones are crossed out and will not be used.",
      reducedMotion: "Static overlay of the snapshot. No rewind smear.",
    },
    limits: [
      "Does not restore health, death, boss position, boss phase, boss hit points, door state, tool state, or protected geometry.",
      "An add is restored only if the old tile is still legal. Otherwise that add stays.",
      "Does not revive Ellis. If Ellis is dead, thaw cannot be cast.",
      "Once per room, then a 20s cooldown if the room allows a second. Spends all flow, minimum 40.",
      "Quarry cairns and fissures are not creek state and do not move.",
    ],
    accessibility: {
      timingAssist: "Cancel window widens from 350ms to 700ms. The preview is readable text ('restore' / 'skip') per body.",
      holdAlternative: "Preview, then Confirm or Cancel. Never a single tap that rewinds immediately.",
      reducedMotion: "Static overlay.",
      motor: "Two-step confirm.",
    },
    boss: {
      interaction: "The Warden's position, phase, and health never thaw. Unstoppable shots already resolved are not put back into the air.",
      immune: ["boss-rewind", "phase-rewind", "door-rewind", "revive"],
      partial: "Adds displaced by Undertow can return to prior legal tiles, which may pull them out of a hazard. That consequence is the point.",
    },
  }),
]);

const BY_ID = new Map(ABILITIES.map((a) => [a.id, a]));

export function abilityById(id) {
  return BY_ID.get(id) || null;
}

export const IMPLEMENTED_IDS = Object.freeze(
  ABILITIES.filter((a) => a.implemented).map((a) => a.id),
);
export const AUTHORED_IDS = Object.freeze(
  ABILITIES.filter((a) => !a.implemented).map((a) => a.id),
);

const DIRS = Object.freeze([
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]);

export function tileKey(x, y) {
  return `${x},${y}`;
}

export function defaultPlayer(extra = {}) {
  return {
    id: "ellis",
    x: 2,
    y: 2,
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    mass: 100,
    maxMass: 100,
    flow: 100,
    maxFlow: 100,
    facing: { x: 1, y: 0 },
    iFrames: 0,
    iFrameHitsRemaining: 0,
    iFrameLockout: 0,
    iFrameLockoutPending: 0,
    spawnGrace: 0,
    pathTape: [],
    recordingTape: true,
    verdictStored: 0,
    verdictExpire: 0,
    guarding: false,
    guardTime: 0,
    lastGuardTap: -10,
    borrow: null,
    evadeArmed: false,
    evadeUntil: 0,
    heartbeat: 0,
    heartbeatRecovery: 0,
    motes: [],
    undertow: null,
    momentum: 0,
    committed: false,
    windup: null,
    flood: null,
    cooldowns: {},
    alive: true,
    speedScale: 1,
    massDiscount: 0,
    a11y: { timingAssist: false, reducedMotion: false, holdAlternative: false, highContrast: false },
    ...extra,
  };
}

export function createState(w = 10, h = 8) {
  return {
    w,
    h,
    time: 0,
    walls: new Set(),
    door: null,
    goal: null,
    routeCritical: [],
    hazards: new Set(),
    movables: [],
    enemies: [],
    cairns: [],
    fissure: null,
    projectiles: [],
    player: defaultPlayer(),
    tools: { [TOOL_ID]: true },
    toolUsed: false,
    log: [],
  };
}

/** Small sealed room used by the proofs. Door requires the seam chisel. */
export function createRoom() {
  const state = createState(10, 8);
  for (let x = 0; x < state.w; x++) {
    for (let y = 0; y < state.h; y++) {
      if (x === 0 || y === 0 || x === state.w - 1 || y === state.h - 1) {
        state.walls.add(tileKey(x, y));
      }
    }
  }
  state.walls.add(tileKey(5, 3));
  state.walls.add(tileKey(5, 4));
  state.walls.add(tileKey(8, 2));
  state.walls.add(tileKey(8, 4));
  state.walls.add(tileKey(7, 2));
  state.walls.add(tileKey(7, 4));
  state.door = { id: "seam_door", x: 7, y: 3, open: false, requiresTool: TOOL_ID };
  state.goal = { x: 8, y: 3 };
  state.routeCritical = [{ x: 6, y: 3 }];
  state.hazards.add(tileKey(3, 5));
  state.player.x = 2;
  state.player.y = 2;
  state.player.facing = { x: 1, y: 0 };
  return state;
}

export function destinationStatus(state, x, y, intent) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return "invalid_destination";
  if (x < 0 || y < 0 || x >= state.w || y >= state.h) return "out_of_bounds";
  const key = tileKey(x, y);
  if (state.walls.has(key)) return "protected_geometry";
  const door = state.door;
  if (door && door.x === x && door.y === y) {
    if (intent === "cairn" || intent === "fissure" || intent === "shove" || intent === "eddy") {
      return door.requiresTool && !door.open ? "tool_required" : "door_sealed";
    }
    if (!door.open) return door.requiresTool ? "tool_required" : "door_sealed";
  }
  if (intent === "cairn" || intent === "fissure" || intent === "eddy") {
    if (state.goal && state.goal.x === x && state.goal.y === y) return "protected_geometry";
  }
  if (intent === "cairn") {
    if (state.hazards.has(key)) return "hazard";
    if (occupied(state, x, y)) return "occupied";
  }
  if (intent === "shove") {
    if (state.hazards.has(key)) return "hazard";
    if (state.cairns.some((c) => c.x === x && c.y === y)) return "occupied";
    if (state.movables.some((m) => m.x === x && m.y === y)) return "occupied";
    if (state.enemies.some((e) => e.hp > 0 && e.x === x && e.y === y)) return "occupied";
  }
  if (intent === "walk" || intent === "return_flood" || intent === "undertow") {
    if (state.cairns.some((c) => c.x === x && c.y === y && c.hp > 0)) return "occupied";
    if (state.movables.some((m) => m.x === x && m.y === y)) return "occupied";
    if (intent !== "undertow" && state.enemies.some((e) => e.hp > 0 && e.x === x && e.y === y)) {
      return "occupied";
    }
  }
  return "ok";
}

function occupied(state, x, y) {
  if (state.player.x === x && state.player.y === y) return true;
  if (state.movables.some((m) => m.x === x && m.y === y)) return true;
  if (state.enemies.some((e) => e.hp > 0 && e.x === x && e.y === y)) return true;
  if (state.cairns.some((c) => c.x === x && c.y === y && c.hp > 0)) return true;
  return false;
}

export function criticalTiles(state) {
  const tiles = [...(state.routeCritical || [])];
  if (state.door?.open && state.goal) tiles.push(state.goal);
  return tiles;
}

export function routeReachable(state, extraBlock) {
  const targets = criticalTiles(state);
  if (!targets.length) return true;
  const blocked = (x, y) => {
    if (extraBlock && extraBlock.x === x && extraBlock.y === y) return true;
    if (state.walls.has(tileKey(x, y))) return true;
    if (state.cairns.some((c) => c.hp > 0 && c.x === x && c.y === y)) return true;
    if (state.door && !state.door.open && state.door.x === x && state.door.y === y) return true;
    return false;
  };
  const startX = state.player.x;
  const startY = state.player.y;
  const q = [[startX, startY]];
  const seen = new Set([tileKey(startX, startY)]);
  while (q.length) {
    const [x, y] = q.shift();
    for (const t of targets) if (t.x === x && t.y === y) return true;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const key = tileKey(nx, ny);
      if (seen.has(key)) continue;
      if (nx < 0 || ny < 0 || nx >= state.w || ny >= state.h) continue;
      if (blocked(nx, ny)) continue;
      seen.add(key);
      q.push([nx, ny]);
    }
  }
  return false;
}

function refundCost(state, id) {
  const ability = abilityById(id);
  const p = state.player;
  p.stamina = Math.min(p.maxStamina, p.stamina + (ability.cost.stamina || 0));
  p.mass = Math.min(p.maxMass, p.mass + (ability.cost.mass || 0));
  p.flow = Math.min(p.maxFlow, p.flow + (ability.cost.flow || 0));
  delete p.cooldowns[id];
}

export function payCost(state, id) {
  const ability = abilityById(id);
  if (!ability) return { ok: false, reason: "unknown_ability" };
  const p = state.player;
  const now = state.time;
  if ((p.cooldowns[id] || 0) > now) return { ok: false, reason: "cooldown" };
  const massCost = Math.max(0, (ability.cost.mass || 0) - (p.massDiscount || 0));
  if (p.stamina < (ability.cost.stamina || 0)) return { ok: false, reason: "stamina" };
  if (p.mass < massCost && (ability.cost.mass || 0) > 0) return { ok: false, reason: "mass" };
  if ((ability.cost.minFlow || 0) > 0 && p.flow < ability.cost.minFlow) return { ok: false, reason: "flow" };
  if (p.flow < (ability.cost.flow || 0)) return { ok: false, reason: "flow" };
  p.stamina -= ability.cost.stamina || 0;
  if ((ability.cost.mass || 0) > 0) p.mass -= massCost;
  if (ability.cost.spendAllFlow) p.flow = 0;
  else p.flow -= ability.cost.flow || 0;
  p.cooldowns[id] = now + ability.cooldownMs / 1000;
  if (p.massDiscount && (ability.cost.mass || 0) > 0) p.massDiscount = 0;
  return { ok: true };
}

export function grantIFrames(actor, duration, lockout) {
  if (actor.iFrames > 0) return { ok: false, reason: "iframe_active" };
  if (actor.iFrameLockout > 0) return { ok: false, reason: "iframe_lockout" };
  actor.iFrames = duration;
  actor.iFrameHitsRemaining = 1;
  actor.iFrameLockoutPending = lockout;
  return { ok: true, duration, lockout };
}

export function tickDefense(actor, dt) {
  if (actor.spawnGrace > 0) actor.spawnGrace = Math.max(0, actor.spawnGrace - dt);
  if (actor.iFrames > 0) {
    actor.iFrames = Math.max(0, actor.iFrames - dt);
    if (actor.iFrames <= 1e-6) {
      actor.iFrames = 0;
      actor.iFrameHitsRemaining = 0;
      actor.iFrameLockout = actor.iFrameLockoutPending || 0;
      actor.iFrameLockoutPending = 0;
    }
  } else if (actor.iFrameLockout > 0) {
    actor.iFrameLockout = Math.max(0, actor.iFrameLockout - dt);
    if (actor.iFrameLockout <= 1e-6) actor.iFrameLockout = 0;
  }
}

export function consumeIFrame(actor, attack) {
  if (!attack || attack.tier === "red" || attack.unstoppable) return false;
  if (actor.spawnGrace > 0) return false;
  if (actor.iFrameHitsRemaining > 0 && actor.iFrames > 0) {
    actor.iFrameHitsRemaining = 0;
    actor.iFrames = 0;
    actor.iFrameLockout = actor.iFrameLockoutPending || 0;
    actor.iFrameLockoutPending = 0;
    return true;
  }
  return false;
}

export function applyChainDamage(enemies, spec) {
  let remaining = spec.totalCap;
  const hits = [];
  for (const enemy of enemies) {
    if (hits.length >= spec.maxTargets) break;
    const raw = spec.baseDamage * spec.falloff ** hits.length;
    const damage = Math.min(remaining, Math.round(raw));
    if (damage <= 0) break;
    enemy.hp -= damage;
    hits.push({ id: enemy.id, damage, anchor: !!enemy.anchor });
    remaining -= damage;
    if (enemy.anchor) break;
  }
  return { hits, total: spec.totalCap - remaining };
}

function enemiesOnFissure(state, tiles) {
  const found = [];
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    let best = Infinity;
    tiles.forEach((tile, index) => {
      const dist = Math.abs(tile.x - enemy.x) + Math.abs(tile.y - enemy.y);
      if (dist <= 1 && index < best) best = index;
    });
    if (best < Infinity) found.push({ enemy, index: best });
  }
  found.sort((a, b) => a.index - b.index || String(a.enemy.id).localeCompare(String(b.enemy.id)));
  return found.map((row) => row.enemy);
}

export function markFissure(state, dir) {
  const facing = dir || state.player.facing;
  const stepX = Math.abs(facing.x) > Math.abs(facing.y) ? Math.sign(facing.x) : 0;
  const stepY = stepX === 0 ? Math.sign(facing.y) || -1 : 0;
  const numbers = abilityById("split_the_fault").numbers;
  const tiles = [];
  let x = state.player.x;
  let y = state.player.y;
  for (let i = 0; i < numbers.chainTiles; i++) {
    x += stepX;
    y += stepY;
    const status = destinationStatus(state, x, y, "fissure");
    if (status !== "ok") break;
    tiles.push({ x, y });
  }
  if (!tiles.length) return { ok: false, reason: "no_fissure", tiles, doorOpen: !!state.door?.open };
  const life = abilityById("split_the_fault").timings.markLifetimeMs / 1000;
  const bonus = state.player.a11y.timingAssist ? 1.2 : 0;
  state.fissure = { tiles, until: state.time + life + bonus, owner: "ellis" };
  return { ok: true, tiles, doorOpen: !!state.door?.open };
}

export function releaseFault(state) {
  if (!state.fissure) return { ok: false, reason: "no_fissure" };
  const paid = payCost(state, "split_the_fault");
  if (!paid.ok) return paid;
  const spec = abilityById("split_the_fault").numbers;
  const ordered = enemiesOnFissure(state, state.fissure.tiles);
  const result = applyChainDamage(ordered, spec);
  state.fissure = null;
  return { ok: true, ...result, doorOpen: !!state.door?.open };
}

export function tryShove(state, movableId, dx, dy) {
  const movable = state.movables.find((item) => item.id === movableId);
  if (!movable) return { ok: false, reason: "no_movable" };
  const numbers = abilityById("walking_quarry").numbers;
  if (state.player.momentum < numbers.momentumNeeded) return { ok: false, reason: "no_momentum" };
  if (state.player.mass < numbers.shoveMass) return { ok: false, reason: "mass" };
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (Math.abs(sx) + Math.abs(sy) !== 1) return { ok: false, reason: "bad_direction" };
  const tx = movable.x + sx;
  const ty = movable.y + sy;
  const status = destinationStatus(state, tx, ty, "shove");
  if (status !== "ok") {
    state.player.momentum = 0;
    state.player.committed = false;
    return { ok: false, reason: status, interrupted: true, doorOpen: !!state.door?.open };
  }
  movable.x = tx;
  movable.y = ty;
  state.player.mass -= numbers.shoveMass;
  state.player.momentum = 0.4;
  return { ok: true, x: tx, y: ty, doorOpen: !!state.door?.open };
}

export function tapGuard(state) {
  const player = state.player;
  player.guarding = true;
  if (player.guardTime == null) player.guardTime = 0;
  player.lastGuardTap = state.time;
  return { ok: true };
}

export function tickGuard(state, dt) {
  const player = state.player;
  const numbers = abilityById("verdict_of_stone").numbers;
  if (!player.guarding) {
    if (player.verdictStored > 0 && state.time > player.verdictExpire) {
      player.verdictStored = 0;
      return { spilled: true, reason: "expired" };
    }
    return null;
  }
  player.guardTime += dt;
  if (player.guardTime > numbers.guardMax) {
    player.guarding = false;
    player.verdictStored = 0;
    player.guardTime = 0;
    return { spilled: true, reason: "held_too_long" };
  }
  return null;
}

export function resolveGuardHit(state, attack) {
  const player = state.player;
  const numbers = abilityById("verdict_of_stone").numbers;
  if (!player.guarding) return { ok: false, reason: "not_guarding", negated: false };
  if (attack.tier === "red" || attack.unstoppable) {
    player.guarding = false;
    player.verdictStored = 0;
    player.guardTime = 0;
    const chip = Math.round((attack.damage || 0) * numbers.redChip);
    player.hp -= chip;
    return { ok: false, reason: "unstoppable", negated: false, spilled: true, chip, doorOpen: !!state.door?.open };
  }
  const window = player.a11y.timingAssist ? numbers.perfectWindowAssist : numbers.perfectWindow;
  const timed = state.time - player.lastGuardTap <= window;
  if (!timed) {
    player.guarding = false;
    player.verdictStored = 0;
    player.guardTime = 0;
    player.hp -= attack.damage || 0;
    return { ok: false, reason: "mistimed", negated: false, spilled: true, damage: attack.damage || 0 };
  }
  const granted = grantIFrames(player, numbers.iframe, numbers.lockout);
  if (!granted.ok) {
    player.hp -= attack.damage || 0;
    return { ok: false, reason: granted.reason, negated: false, damage: attack.damage || 0 };
  }
  consumeIFrame(player, { tier: "yellow" });
  if (player.verdictStored < numbers.maxStored) player.verdictStored += 1;
  player.mass = Math.min(player.maxMass, player.mass + 12);
  player.verdictExpire = state.time + numbers.storeLifetime;
  return {
    ok: true,
    negated: true,
    stored: player.verdictStored,
    iframeOpen: player.iFrames > 0,
    doorOpen: !!state.door?.open,
  };
}

export function releaseVerdict(state, dir) {
  const player = state.player;
  const numbers = abilityById("verdict_of_stone").numbers;
  if (player.verdictStored <= 0) {
    player.guarding = false;
    return { ok: false, reason: "empty" };
  }
  const paid = payCost(state, "verdict_of_stone");
  if (!paid.ok) return paid;
  const packet = Math.min(numbers.packetCap, numbers.packetBase + numbers.packetPerStore * player.verdictStored);
  player.verdictStored = 0;
  player.guarding = false;
  player.guardTime = 0;
  const facing = dir || player.facing;
  const hit = firstAlong(state, facing, 3);
  let damage = 0;
  if (hit && hit.kind === "enemy") {
    damage = hit.enemy.anchor || hit.enemy.boss ? Math.min(packet, numbers.bossPacketCap) : packet;
    hit.enemy.hp -= damage;
  }
  return { ok: true, damage, packet, stopped: hit?.kind || "none", doorOpen: !!state.door?.open };
}

export function beginCairn(state, x, y) {
  const status = destinationStatus(state, x, y, "cairn");
  if (status !== "ok") return { ok: false, reason: status, doorOpen: !!state.door?.open };
  if (!routeReachable(state, { x, y })) {
    return { ok: false, reason: "would_seal_route", doorOpen: !!state.door?.open };
  }
  const paid = payCost(state, "cairnfall");
  if (!paid.ok) return paid;
  const windup = abilityById("cairnfall").numbers.windup;
  state.player.windup = { kind: "cairn", x, y, t: windup };
  return { ok: true, windup };
}

export function commitCairn(state) {
  const windup = state.player.windup;
  if (!windup || windup.kind !== "cairn") return { ok: false, reason: "no_windup" };
  const status = destinationStatus(state, windup.x, windup.y, "cairn");
  state.player.windup = null;
  if (status !== "ok" || !routeReachable(state, { x: windup.x, y: windup.y })) {
    const refund = abilityById("cairnfall").cost.stamina * abilityById("cairnfall").numbers.refundFraction;
    state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + refund);
    return { ok: false, reason: status === "ok" ? "would_seal_route" : status, interrupted: true };
  }
  state.cairns = state.cairns.filter((cairn) => cairn.owner !== "ellis");
  state.cairns.push({
    id: "cairn",
    owner: "ellis",
    x: windup.x,
    y: windup.y,
    hp: abilityById("cairnfall").numbers.cairnHp,
    temporary: true,
    combat: true,
    notDungeon: true,
    until: state.time + abilityById("cairnfall").numbers.lifetime,
  });
  return { ok: true, doorOpen: !!state.door?.open };
}

export function tickWindup(state, dt) {
  const windup = state.player.windup;
  if (!windup) return null;
  windup.t -= dt;
  if (windup.t > 0) return { pending: true, t: windup.t };
  return commitCairn(state);
}

export function interruptMovement(state, cause) {
  const player = state.player;
  const notes = { cause, cancelledFlood: false, cancelledCairn: false };
  if (player.flood) {
    player.flood = null;
    player.recordingTape = true;
    notes.cancelledFlood = true;
  }
  if (player.windup?.kind === "cairn") {
    const refund = abilityById("cairnfall").cost.stamina * abilityById("cairnfall").numbers.refundFraction;
    player.stamina = Math.min(player.maxStamina, player.stamina + refund);
    player.windup = null;
    delete player.cooldowns.cairnfall;
    notes.cancelledCairn = true;
  }
  player.momentum = 0;
  player.committed = false;
  player.undertow = null;
  return notes;
}

export function tryStep(state, dx, dy) {
  const player = state.player;
  const nx = player.x + dx;
  const ny = player.y + dy;
  const status = destinationStatus(state, nx, ny, "walk");
  if (status !== "ok") return { ok: false, reason: status, doorOpen: !!state.door?.open };
  player.x = nx;
  player.y = ny;
  noteTape(state);
  return { ok: true, doorOpen: !!state.door?.open };
}

export function noteTape(state) {
  const player = state.player;
  if (!player.recordingTape || player.flood) return;
  const last = player.pathTape[player.pathTape.length - 1];
  if (last && last.x === player.x && last.y === player.y) return;
  const status = destinationStatus(state, player.x, player.y, "walk");
  if (status !== "ok") return;
  player.pathTape.push({ x: player.x, y: player.y });
  const max = abilityById("return_flood").numbers.tape;
  while (player.pathTape.length > max) player.pathTape.shift();
}

export function startReturnFlood(state) {
  const player = state.player;
  const paid = payCost(state, "return_flood");
  if (!paid.ok) return paid;
  const prior = player.pathTape.filter((step) => !(step.x === player.x && step.y === player.y));
  if (!prior.length) {
    refundCost(state, "return_flood");
    return { ok: false, reason: "empty_path", refunded: true };
  }
  player.flood = { steps: [...prior].reverse(), index: 0 };
  player.recordingTape = false;
  return { ok: true, steps: player.flood.steps.length };
}

export function advanceFlood(state) {
  const player = state.player;
  const flood = player.flood;
  if (!flood) return { ok: false, reason: "no_flood" };
  const step = flood.steps[flood.index];
  const status = destinationStatus(state, step.x, step.y, "return_flood");
  if (status !== "ok") {
    player.flood = null;
    player.recordingTape = true;
    return { ok: false, reason: status, stopped: true, x: player.x, y: player.y, doorOpen: !!state.door?.open };
  }
  player.x = step.x;
  player.y = step.y;
  flood.index += 1;
  if (flood.index >= flood.steps.length) {
    player.flood = null;
    player.recordingTape = true;
    player.pathTape = [{ x: player.x, y: player.y }];
    player.flow = Math.min(player.maxFlow, player.flow + abilityById("return_flood").numbers.flowOnClean);
    return { ok: true, done: true, x: player.x, y: player.y, doorOpen: !!state.door?.open };
  }
  return { ok: true, x: player.x, y: player.y, doorOpen: !!state.door?.open };
}

export function armEvade(state) {
  if (state.player.heartbeatRecovery > 0) return { ok: false, reason: "heartbeat_recovery" };
  const paid = payCost(state, "borrowed_current");
  if (!paid.ok) return paid;
  const numbers = abilityById("borrowed_current").numbers;
  const window = state.player.a11y.timingAssist ? numbers.armAssist : numbers.arm;
  state.player.evadeArmed = true;
  state.player.evadeUntil = state.time + window;
  return { ok: true, window };
}

export function resolveEvade(state, attack) {
  const player = state.player;
  if (!player.evadeArmed || state.time > player.evadeUntil) {
    return { ok: false, reason: "not_armed", negated: false };
  }
  if (attack.tier === "red" || attack.unstoppable) {
    return { ok: false, reason: "unstoppable", negated: false, iframe: false };
  }
  const numbers = abilityById("borrowed_current").numbers;
  const granted = grantIFrames(player, numbers.iframe, numbers.lockout);
  if (!granted.ok) return { ok: false, reason: granted.reason, negated: false };
  consumeIFrame(player, { tier: "yellow" });
  const dx = -(attack.dx || 0);
  const dy = -(attack.dy || 0);
  player.borrow = {
    dx,
    dy,
    until: state.time + numbers.counterMemory,
  };
  player.flow = Math.min(player.maxFlow, player.flow + 14);
  player.evadeArmed = false;
  return { ok: true, negated: true, iframeOpen: player.iFrames > 0, lockout: player.iFrameLockout };
}

export function releaseBorrow(state, dir) {
  const player = state.player;
  const borrow = player.borrow;
  if (!borrow || state.time > borrow.until) {
    player.borrow = null;
    return { ok: false, reason: "expired" };
  }
  player.borrow = null;
  const facing = dir || player.facing;
  const hit = firstAlong(state, facing, 2);
  if (!hit || hit.kind !== "enemy") {
    return { ok: true, damage: 0, stopped: hit?.kind || "none", doorOpen: !!state.door?.open };
  }
  const numbers = abilityById("borrowed_current").numbers;
  const damage = hit.enemy.boss || hit.enemy.anchor ? numbers.bossCap : numbers.counterDamage;
  hit.enemy.hp -= damage;
  return { ok: true, damage, target: hit.enemy.id, doorOpen: !!state.door?.open };
}

export function beginHeartbeat(state) {
  const paid = payCost(state, "river_between_heartbeats");
  if (!paid.ok) return paid;
  const numbers = abilityById("river_between_heartbeats").numbers;
  const window = state.player.a11y.timingAssist ? numbers.windowAssist : numbers.window;
  state.player.heartbeat = window;
  state.player.motes = [];
  state.player.speedScale = numbers.moveScale;
  return { ok: true, iframeOpen: state.player.iFrames > 0 };
}

export function touchProjectile(state, projectile) {
  const player = state.player;
  const numbers = abilityById("river_between_heartbeats").numbers;
  if (player.heartbeat <= 0) return { absorbed: false, hit: true, reason: "no_window" };
  if (projectile.unstoppable || projectile.tier === "red") {
    return { absorbed: false, hit: true, reason: "unstoppable" };
  }
  if (!projectile.deflectable) return { absorbed: false, hit: true, reason: "not_deflectable" };
  if (player.motes.length >= numbers.moteCap) return { absorbed: false, hit: true, reason: "mote_cap" };
  player.motes.push({ id: projectile.id, deflectable: true });
  player.flow = Math.min(player.maxFlow, player.flow + 6);
  return { absorbed: true, hit: false, motes: player.motes.length, iframeOpen: player.iFrames > 0 };
}

export function endHeartbeat(state) {
  const player = state.player;
  const motes = player.motes.splice(0, player.motes.length);
  player.heartbeat = 0;
  player.speedScale = 1;
  player.heartbeatRecovery = abilityById("river_between_heartbeats").numbers.recovery;
  const released = motes.map(() => launchAlong(state, player.facing, 4, abilityById("river_between_heartbeats").numbers));
  return { released, doorOpen: !!state.door?.open };
}

export function tickHeartbeat(state, dt) {
  const player = state.player;
  if (player.heartbeatRecovery > 0) {
    player.heartbeatRecovery = Math.max(0, player.heartbeatRecovery - dt);
  }
  if (player.heartbeat <= 0) return null;
  player.heartbeat = Math.max(0, player.heartbeat - dt);
  if (player.heartbeat <= 1e-6) {
    player.heartbeat = 0;
    return endHeartbeat(state);
  }
  return { pending: true };
}

function launchAlong(state, facing, range, numbers) {
  const hit = firstAlong(state, facing, range);
  if (hit?.kind === "enemy") {
    const damage = hit.enemy.boss || hit.enemy.anchor ? numbers.bossMoteCap : numbers.moteDamage;
    hit.enemy.hp -= damage;
    return { kind: "enemy", id: hit.enemy.id, damage, doorOpen: !!state.door?.open };
  }
  return { kind: hit?.kind || "none", damage: 0, doorOpen: !!state.door?.open };
}

export function markUndertow(state, enemyId) {
  const paid = payCost(state, "undertow");
  if (!paid.ok) return paid;
  const enemy = state.enemies.find((item) => item.id === enemyId && item.hp > 0);
  if (!enemy) {
    refundCost(state, "undertow");
    return { ok: false, reason: "no_target" };
  }
  if (enemy.anchor || enemy.heavy) {
    state.player.flow = Math.min(state.player.maxFlow, state.player.flow + (abilityById("undertow").cost.flow || 0));
    state.player.cooldowns.undertow = state.time + abilityById("undertow").numbers.anchorCooldown;
    return { ok: false, reason: "anchored", moved: false, doorOpen: !!state.door?.open };
  }
  state.player.undertow = { id: enemyId, until: state.time + abilityById("undertow").numbers.mark };
  return { ok: true };
}

export function resolveUndertow(state, lane) {
  const mark = state.player.undertow;
  if (!mark || state.time > mark.until) {
    state.player.undertow = null;
    return { ok: false, reason: "no_mark" };
  }
  const enemy = state.enemies.find((item) => item.id === mark.id && item.hp > 0);
  state.player.undertow = null;
  if (!enemy) return { ok: false, reason: "gone" };
  if (lane.some((tile) => tile.x === enemy.x && tile.y === enemy.y)) {
    return { ok: true, moved: false, x: enemy.x, y: enemy.y };
  }
  const path = pullPath(state, enemy, lane, abilityById("undertow").numbers.maxPull);
  if (!path) return { ok: false, reason: "blocked", moved: false, x: enemy.x, y: enemy.y, doorOpen: !!state.door?.open };
  const dest = path[path.length - 1];
  enemy.x = dest.x;
  enemy.y = dest.y;
  return { ok: true, moved: true, x: dest.x, y: dest.y, doorOpen: !!state.door?.open };
}

function pullPath(state, enemy, lane, maxSteps) {
  const goals = new Set(lane.map((tile) => tileKey(tile.x, tile.y)));
  let best = null;
  const q = [{ x: enemy.x, y: enemy.y, path: [] }];
  const seen = new Set([tileKey(enemy.x, enemy.y)]);
  while (q.length) {
    const node = q.shift();
    if (node.path.length && goals.has(tileKey(node.x, node.y))) {
      if (!best || node.path.length < best.length) best = node.path;
      continue;
    }
    if (node.path.length >= maxSteps) continue;
    for (const [dx, dy] of DIRS) {
      const nx = node.x + dx;
      const ny = node.y + dy;
      const key = tileKey(nx, ny);
      if (seen.has(key)) continue;
      const status = destinationStatus(state, nx, ny, "undertow");
      if (status !== "ok") continue;
      if (state.enemies.some((other) => other !== enemy && other.hp > 0 && other.x === nx && other.y === ny)) {
        continue;
      }
      seen.add(key);
      q.push({ x: nx, y: ny, path: [...node.path, { x: nx, y: ny }] });
    }
  }
  return best;
}

function firstAlong(state, facing, range) {
  let sx = Math.abs(facing.x) >= Math.abs(facing.y) ? Math.sign(facing.x) : 0;
  let sy = sx === 0 ? Math.sign(facing.y) || -1 : 0;
  if (sx === 0 && sy === 0) sx = 1;
  let x = state.player.x;
  let y = state.player.y;
  for (let i = 0; i < range; i++) {
    x += sx;
    y += sy;
    if (state.walls.has(tileKey(x, y))) return { kind: "protected_geometry" };
    if (state.door && state.door.x === x && state.door.y === y && !state.door.open) return { kind: "door_sealed" };
    if (state.cairns.some((cairn) => cairn.hp > 0 && cairn.x === x && cairn.y === y)) return { kind: "cairn" };
    const enemy = state.enemies.find((item) => item.hp > 0 && item.x === x && item.y === y);
    if (enemy) return { kind: "enemy", enemy };
  }
  return { kind: "none" };
}

export function useDungeonTool(state) {
  const door = state.door;
  if (!door) return { ok: false, reason: "no_door" };
  if (!state.tools?.[door.requiresTool || TOOL_ID]) return { ok: false, reason: "tool_required" };
  const dist = Math.abs(state.player.x - door.x) + Math.abs(state.player.y - door.y);
  if (dist !== 1) return { ok: false, reason: "too_far" };
  if (!door.open) {
    door.open = true;
    state.toolUsed = true;
  }
  return { ok: true, open: door.open, via: "dungeon_tool" };
}

export function resetCombatState(state, cause) {
  const player = state.player;
  const doorOpen = !!state.door?.open;
  const walls = state.walls.size;
  player.mass = 0;
  player.flow = 0;
  player.verdictStored = 0;
  player.verdictExpire = 0;
  player.guarding = false;
  player.guardTime = 0;
  player.borrow = null;
  player.evadeArmed = false;
  player.pathTape = [];
  player.iFrames = 0;
  player.iFrameHitsRemaining = 0;
  player.iFrameLockout = 0;
  player.iFrameLockoutPending = 0;
  player.heartbeat = 0;
  player.heartbeatRecovery = 0;
  player.motes = [];
  player.undertow = null;
  player.momentum = 0;
  player.committed = false;
  player.windup = null;
  player.flood = null;
  player.cooldowns = {};
  player.recordingTape = true;
  player.speedScale = 1;
  player.massDiscount = 0;
  state.fissure = null;
  state.cairns = [];
  state.projectiles = [];
  if (cause === "death") {
    player.hp = player.maxHp;
    player.stamina = player.maxStamina;
    player.alive = true;
    player.x = 2;
    player.y = 2;
    player.spawnGrace = 0.6;
  }
  return { cause, doorOpen: !!state.door?.open, doorUnchanged: doorOpen === !!state.door?.open, walls };
}

function catalogProblems() {
  const quarry = ABILITIES.filter((ability) => ability.discipline === "quarry");
  const creek = ABILITIES.filter((ability) => ability.discipline === "creek");
  if (quarry.length !== 12) throw new Error(`quarry count ${quarry.length}`);
  if (creek.length !== 12) throw new Error(`creek count ${creek.length}`);
  const caps = ABILITIES.filter((ability) => ability.tier === "capstone")
    .map((ability) => ability.id)
    .sort();
  const expectedCaps = ["cairnfall", "river_between_heartbeats", "spring_thaw", "verdict_of_stone"];
  if (JSON.stringify(caps) !== JSON.stringify(expectedCaps)) throw new Error(`caps ${caps.join(",")}`);
  const implemented = [...IMPLEMENTED_IDS].sort();
  const expectedImpl = [
    "borrowed_current",
    "cairnfall",
    "return_flood",
    "river_between_heartbeats",
    "split_the_fault",
    "undertow",
    "verdict_of_stone",
    "walking_quarry",
  ];
  if (JSON.stringify(implemented) !== JSON.stringify(expectedImpl)) {
    throw new Error(`implemented ${implemented.join(",")}`);
  }
  if (quarry.filter((ability) => ability.tier === "capstone").length !== 2) throw new Error("quarry capstones");
  if (creek.filter((ability) => ability.tier === "capstone").length !== 2) throw new Error("creek capstones");
  for (const ability of ABILITIES) {
    if (ability.safety.opensDoors) throw new Error(`${ability.id} opens doors`);
    if (ability.safety.crossesProtectedGeometry) throw new Error(`${ability.id} crosses geometry`);
    if (ability.safety.satisfiesToolRequirement) throw new Error(`${ability.id} satisfies tools`);
    if (ability.safety.grantsRefreshableIFrames) throw new Error(`${ability.id} refreshes iframes`);
    for (const key of ["cost", "activation", "timings", "tells", "limits", "accessibility", "boss", "decision", "summary"]) {
      if (!ability[key]) throw new Error(`${ability.id} missing ${key}`);
    }
    if (!ability.activation.hook) throw new Error(`${ability.id} hook`);
    if (ability.limits.length < 2) throw new Error(`${ability.id} limits`);
    if (!ability.boss.interaction || !ability.boss.partial) throw new Error(`${ability.id} boss`);
    if (!ability.tells.reducedMotion || !ability.accessibility.holdAlternative) {
      throw new Error(`${ability.id} access`);
    }
  }
  return "24 abilities, 4 capstones, 8 simulated";
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function checkFaultCap() {
  const state = createRoom();
  state.player.x = 2;
  state.player.y = 2;
  state.player.facing = { x: 1, y: 0 };
  state.enemies = [0, 1, 2, 3, 4].map((i) => ({ id: `e${i}`, x: 3 + i, y: 2, hp: 100, anchor: false }));
  const marked = markFissure(state);
  assert(marked.ok && marked.tiles.length === 4, "fissure length");
  const released = releaseFault(state);
  assert(released.hits.length === 3, `targets ${released.hits.length}`);
  assert(released.total === 62, `total ${released.total}`);
  assert(state.enemies[3].hp === 100 && state.enemies[4].hp === 100, "tail untouched");
  assert(state.door.open === false, "door");
  return "3 targets, 62 total";
}

function checkFaultAnchor() {
  const state = createRoom();
  state.player.x = 2;
  state.player.y = 2;
  state.player.facing = { x: 1, y: 0 };
  state.enemies = [0, 1, 2].map((i) => ({
    id: `e${i}`,
    x: 3 + i,
    y: 2,
    hp: 80,
    anchor: i === 1,
    boss: i === 1,
  }));
  markFissure(state);
  const released = releaseFault(state);
  assert(released.hits.length === 2, `hits ${released.hits.length}`);
  assert(released.hits[1].anchor === true, "anchor hit");
  assert(state.enemies[2].hp === 80, "behind anchor");
  assert(released.total === 48, `total ${released.total}`);
  return "chain stops on the Warden";
}

function checkFaultWallAndDoor() {
  const state = createRoom();
  state.player.x = 2;
  state.player.y = 3;
  state.player.facing = { x: 1, y: 0 };
  state.enemies = [{ id: "past", x: 6, y: 3, hp: 50, anchor: false }];
  const marked = markFissure(state);
  assert(marked.ok, "mark");
  assert(marked.tiles.every((tile) => tile.x < 5), "stopped before wall");
  releaseFault(state);
  assert(state.enemies[0].hp === 50, "no jump");
  state.player.x = 6;
  state.player.y = 3;
  state.player.facing = { x: 1, y: 0 };
  const atDoor = markFissure(state);
  assert(atDoor.ok === false, "door refuses the fissure");
  assert(!state.door.open, "still shut");
  return "no traversal of wall or door";
}

function checkShove() {
  const state = createRoom();
  state.movables = [{ id: "sled", x: 3, y: 2 }];
  state.player.momentum = 4;
  state.player.mass = 40;
  const moved = tryShove(state, "sled", 1, 0);
  assert(moved.ok && state.movables[0].x === 4, "shove");
  assert(state.player.mass === 26, "mass spent");
  state.movables[0].x = 3;
  state.movables[0].y = 1;
  state.player.momentum = 4;
  state.player.mass = 40;
  const intoWall = tryShove(state, "sled", 0, -1);
  assert(!intoWall.ok && intoWall.interrupted && intoWall.reason === "protected_geometry", "wall");
  assert(state.movables[0].y === 1 && state.player.momentum === 0, "unmoved");
  state.movables[0].x = 6;
  state.movables[0].y = 3;
  state.player.momentum = 4;
  state.player.mass = 40;
  state.player.committed = true;
  const intoDoor = tryShove(state, "sled", 1, 0);
  assert(!intoDoor.ok && (intoDoor.reason === "tool_required" || intoDoor.reason === "door_sealed"), "door");
  assert(state.movables[0].x === 6 && !state.door.open, "door intact");
  return "sled moves, wall and door interrupt";
}

function checkStepWall() {
  const state = createRoom();
  state.player.x = 1;
  state.player.y = 2;
  const into = tryStep(state, -1, 0);
  assert(!into.ok && into.reason === "protected_geometry", into.reason);
  assert(state.player.x === 1, "stayed");
  return "walk stops at protected stone";
}

function checkVerdictLoopAndCap() {
  const state = createRoom();
  const player = state.player;
  const first = grantIFrames(player, 0.08, 0.45);
  assert(first.ok, "grant");
  const second = grantIFrames(player, 5, 0);
  assert(!second.ok && second.reason === "iframe_active", second.reason);
  assert(player.iFrames === 0.08, "duration not extended");
  tickDefense(player, 0.08);
  assert(player.iFrames === 0 && player.iFrameLockout === 0.45, "lockout armed");
  const during = grantIFrames(player, 0.2, 0.2);
  assert(!during.ok && during.reason === "iframe_lockout", during.reason);
  tickDefense(player, 0.45);
  assert(player.iFrameLockout === 0, "lockout over");
  tapGuard(state);
  state.enemies = [{ id: "add", x: 3, y: 2, hp: 100, anchor: false }];
  const caught = resolveGuardHit(state, { tier: "yellow", damage: 30, dx: -1, dy: 0 });
  assert(caught.negated && caught.stored === 1 && player.hp === 100, "catch");
  assert(player.iFrames === 0 && player.iFrameLockout === 0.45, "iframe spent");
  const follow = resolveGuardHit(state, { tier: "yellow", damage: 11, dx: -1, dy: 0 });
  assert(!follow.negated && player.hp === 89, "second hit lands");
  tickDefense(player, 0.45);
  player.hp = 100;
  player.verdictStored = 1;
  tapGuard(state);
  const secondStore = resolveGuardHit(state, { tier: "yellow", damage: 10, dx: -1, dy: 0 });
  assert(secondStore.stored === 2, "two chips");
  tickDefense(player, 0.45);
  tapGuard(state);
  const third = resolveGuardHit(state, { tier: "yellow", damage: 10, dx: -1, dy: 0 });
  assert(third.stored === 2, "bounded");
  const red = createRoom();
  tapGuard(red);
  red.player.verdictStored = 2;
  const broke = resolveGuardHit(red, { tier: "red", unstoppable: true, damage: 20 });
  assert(broke.spilled && red.player.verdictStored === 0 && red.player.hp === 92, "red chip");
  const packet = createRoom();
  packet.player.verdictStored = 2;
  packet.enemies = [{ id: "add", x: 3, y: 2, hp: 100 }];
  const released = releaseVerdict(packet);
  assert(released.damage === 62 && packet.door.open === false, `packet ${released.damage}`);
  return "no iframe loop, store capped at 2";
}

function checkCairn() {
  const state = createRoom();
  const onDoor = beginCairn(state, 7, 3);
  assert(!onDoor.ok && (onDoor.reason === "tool_required" || onDoor.reason === "door_sealed"), onDoor.reason);
  assert(!state.door.open && state.cairns.length === 0, "door");
  const seal = beginCairn(state, 6, 3);
  assert(!seal.ok && seal.reason === "would_seal_route", seal.reason);
  const before = state.player.stamina;
  const started = beginCairn(state, 3, 3);
  assert(started.ok, started.reason || "cairn");
  assert(state.player.stamina === before - 30, "paid");
  const cut = interruptMovement(state, "hit");
  assert(cut.cancelledCairn && state.cairns.length === 0, "interrupted");
  assert(state.player.stamina === before - 15, `refund ${state.player.stamina}`);
  beginCairn(state, 3, 3);
  const done = tickWindup(state, 0.45);
  assert(done.ok && state.cairns.length === 1 && state.cairns[0].temporary, "placed");
  assert(state.cairns[0].notDungeon && !state.door.open, "not a door");
  const stepped = tryStep(state, 1, 1);
  assert(!stepped.ok, "cairn blocks the body");
  return "cairn is temporary and cannot seal the chisel";
}

function checkFlood() {
  const state = createRoom();
  state.player.pathTape = [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
  ];
  state.player.x = 4;
  state.player.y = 2;
  state.walls.add(tileKey(3, 2));
  const started = startReturnFlood(state);
  assert(started.ok, "start");
  const stopped = advanceFlood(state);
  assert(!stopped.ok && stopped.reason === "protected_geometry" && stopped.stopped, stopped.reason);
  assert(state.player.x === 4 && state.player.y === 2, "did not enter the wall");
  const state2 = createRoom();
  state2.player.pathTape = [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
  ];
  state2.player.x = 4;
  state2.player.y = 2;
  startReturnFlood(state2);
  const mid = advanceFlood(state2);
  assert(mid.ok && state2.player.x === 3, "first step");
  interruptMovement(state2, "hit");
  assert(!state2.player.flood && state2.player.x === 3, "interrupted mid-path");
  const state3 = createRoom();
  state3.door.open = true;
  state3.player.pathTape = [
    { x: 6, y: 3 },
    { x: 7, y: 3 },
    { x: 8, y: 3 },
  ];
  state3.player.x = 8;
  state3.player.y = 3;
  state3.door.open = false;
  startReturnFlood(state3);
  const back = advanceFlood(state3);
  assert(!back.ok && (back.reason === "tool_required" || back.reason === "door_sealed"), back.reason);
  assert(state3.player.x === 8 && !state3.door.open, "no ghost through the door");
  const empty = createRoom();
  empty.player.pathTape = [{ x: 2, y: 2 }];
  const flow = empty.player.flow;
  const stam = empty.player.stamina;
  const fizzle = startReturnFlood(empty);
  assert(!fizzle.ok && fizzle.refunded && empty.player.flow === flow && empty.player.stamina === stam, "refund");
  return "invalid, interrupted, and sealed steps stop the flood";
}

function checkHeartbeat() {
  const state = createRoom();
  const before = state.player.iFrames;
  const started = beginHeartbeat(state);
  assert(started.ok && state.player.iFrames === before, "no iframe");
  const shots = [0, 1, 2, 3].map((i) => ({ id: `p${i}`, deflectable: true, tier: "yellow" }));
  const a = touchProjectile(state, shots[0]);
  const b = touchProjectile(state, shots[1]);
  const c = touchProjectile(state, shots[2]);
  const d = touchProjectile(state, shots[3]);
  assert(a.absorbed && b.absorbed && c.absorbed, "three motes");
  assert(!d.absorbed && d.hit && d.reason === "mote_cap", d.reason);
  const red = touchProjectile(state, { id: "red", deflectable: true, tier: "red", unstoppable: true });
  assert(!red.absorbed && red.reason === "unstoppable", "red");
  assert(state.player.iFrames === 0, "still no iframe");
  state.enemies = [{ id: "add", x: 4, y: 2, hp: 40 }];
  state.walls.add(tileKey(3, 2));
  const end = endHeartbeat(state);
  assert(end.released[0].kind === "protected_geometry", "mote stops");
  assert(state.enemies[0].hp === 40 && !state.door.open, "no bypass");
  const evade = armEvade(state);
  assert(!evade.ok && evade.reason === "heartbeat_recovery", "evade locked");
  return "three motes, fourth hits, no iframe";
}

function checkUndertow() {
  const state = createRoom();
  state.enemies = [{ id: "mite", x: 4, y: 2, hp: 30, anchor: false }];
  const marked = markUndertow(state, "mite");
  assert(marked.ok, "mark");
  const pulled = resolveUndertow(state, [
    { x: 4, y: 4 },
    { x: 4, y: 3 },
  ]);
  assert(pulled.moved && state.enemies[0].y === 3, `y ${state.enemies[0].y}`);
  const walled = createRoom();
  walled.enemies = [{ id: "mite", x: 4, y: 2, hp: 30 }];
  walled.walls.add(tileKey(4, 3));
  markUndertow(walled, "mite");
  const blocked = resolveUndertow(walled, [{ x: 4, y: 4 }]);
  assert(!blocked.moved && blocked.reason === "blocked" && walled.enemies[0].y === 2, "wall");
  const boss = createRoom();
  boss.enemies = [{ id: "warden", x: 4, y: 2, hp: 200, anchor: true, heavy: true, boss: true }];
  const flow = boss.player.flow;
  const refused = markUndertow(boss, "warden");
  assert(!refused.ok && refused.reason === "anchored" && boss.enemies[0].x === 4, "anchor");
  assert(boss.player.flow === flow, "flow refunded");
  assert(!boss.door.open, "door");
  return "pulls adds, not anchors, not through walls";
}

function checkReset() {
  const state = createRoom();
  state.player.verdictStored = 2;
  state.player.borrow = { dx: 1, dy: 0, until: 5 };
  state.player.pathTape = [{ x: 2, y: 2 }, { x: 3, y: 2 }];
  state.player.iFrames = 0.08;
  state.player.heartbeat = 0.4;
  state.player.motes = [{ id: "m" }];
  state.player.momentum = 5;
  state.player.mass = 50;
  state.player.flow = 40;
  state.fissure = { tiles: [{ x: 3, y: 2 }], until: 9 };
  state.cairns = [{ id: "cairn", owner: "ellis", x: 3, y: 3, hp: 40, temporary: true }];
  state.player.undertow = { id: "mite", until: 4 };
  const death = resetCombatState(state, "death");
  assert(death.doorUnchanged && !state.door.open, "door");
  assert(state.walls.size > 0, "walls");
  assert(state.player.verdictStored === 0 && !state.player.borrow && state.player.pathTape.length === 0, "charges");
  assert(state.player.iFrames === 0 && state.player.heartbeat === 0 && state.player.motes.length === 0, "defense");
  assert(!state.fissure && state.cairns.length === 0 && state.player.mass === 0 && state.player.flow === 0, "world");
  assert(state.player.hp === 100 && state.player.x === 2, "respawn");
  state.player.verdictStored = 1;
  state.player.mass = 10;
  state.cairns = [{ id: "cairn", owner: "ellis", x: 3, y: 3, hp: 10 }];
  state.player.hp = 40;
  const loadout = resetCombatState(state, "loadout");
  assert(loadout.cause === "loadout" && state.player.verdictStored === 0 && state.cairns.length === 0, "loadout");
  assert(state.player.hp === 40 && state.player.mass === 0, "hp kept, mass cleared");
  assert(!state.door.open, "loadout leaves the door");
  return "death and loadout clear the cut, not the dungeon";
}

function checkToolMonopoly() {
  const state = createRoom();
  // Name is the dungeon verb, not a React hook.
  // eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
  assert(!useDungeonTool(state).ok, "far");
  state.player.x = 6;
  state.player.y = 3;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
  const opened = useDungeonTool(state);
  assert(opened.ok && opened.via === "dungeon_tool" && state.door.open, "chisel");
  state.door.open = false;
  state.toolUsed = false;
  const attempts = [
    markFissure(state),
    beginCairn(state, state.door.x, state.door.y),
    tryStep(state, 1, 0),
  ];
  state.movables = [{ id: "sled", x: 6, y: 3 }];
  state.player.x = 5;
  state.player.y = 3;
  state.player.momentum = 5;
  state.player.mass = 40;
  attempts.push(tryShove(state, "sled", 1, 0));
  state.player.pathTape = [
    { x: 6, y: 4 },
    { x: 7, y: 3 },
  ];
  state.player.x = 6;
  state.player.y = 4;
  startReturnFlood(state);
  attempts.push(advanceFlood(state));
  assert(attempts.every((attempt) => attempt.doorOpen === false || attempt.ok === false), "attempts");
  assert(state.door.open === false, "abilities left it shut");
  assert(state.toolUsed === false, "tool flag");
  return "only the seam chisel opens the door";
}

export function runSelfCheck() {
  const checks = [
    ["catalog", catalogProblems],
    ["fault-damage-cap", checkFaultCap],
    ["fault-anchor-stops-chain", checkFaultAnchor],
    ["fault-wall-and-door", checkFaultWallAndDoor],
    ["walking-quarry-shove-and-interrupt", checkShove],
    ["wall-traversal-step", checkStepWall],
    ["verdict-iframe-loop-and-cap", checkVerdictLoopAndCap],
    ["cairn-seal-interrupt", checkCairn],
    ["return-flood-invalid-interrupt-door", checkFlood],
    ["heartbeat-cap-not-iframe", checkHeartbeat],
    ["undertow-path-and-anchor", checkUndertow],
    ["death-and-loadout-reset", checkReset],
    ["tool-not-bypassed", checkToolMonopoly],
  ];
  return checks.map(([id, fn]) => {
    try {
      return { id, pass: true, detail: fn() };
    } catch (error) {
      return { id, pass: false, detail: error instanceof Error ? error.message : String(error) };
    }
  });
}
