# Mastery objects

Source pin: JamesTRichmond/preincarnation `c737e42eb188148291438dfb8a5993d6ce2b77fa`.
These objects modify existing tool actions. Discipline names are labels. They are not ability ids.

- **quarry:** No ability id in src/game at this SHA. Label only. Objects bind to hammer, bombs, shovel, smash, bomb, dig.
- **creek:** No ability id. Objects bind to flippers, hookshot, boots dash.
- **sugar:** No ability id. Objects bind to hookshot (the Sugar-line) and to sip / slash / cut.
- **ash:** No ability id. Objects bind to the ash bow relic and to slash burn, which already exists on hitEnemy.
- **lantern:** No ability id. The oil lamp relic id is lantern. Objects bind to that toggle and its quarry light radii. They do not grant the relic.
- **hollow:** No ability id. Maeve Holloway is an NPC, not an ability. Objects bind to cape and to the existing dash gate. They do not read upgrades.wraithBond.

Intentionally unbound existing effects: action.spin, action.net, action.mirror, action.cane.

## loot.expansion.mastery.001 Plug Wedge

- Discipline: quarry (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.smash
- Changed behavior: Plug Wedge may alter only action.smash (engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot). set pattern "single" on action.smash; add reach 4 on action.smash. The plus of cracked marble becomes the single aimed tile. Neighbors stay plugged.
- Tradeoff: Unmodified action.smash stays available if you leave this off. While worn: a narrower shape or a slower recovery than the bare tool.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other pattern-smash objects.
- Use: Applies only while off-hand is the existing hammer relic, and you already carry hammer. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Under a cracked plug in the quarry, after the hammer is already yours.
- Provenance: Cut by a quarryman who was tired of opening the whole vein at once.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.002 Vein Spoon

- Discipline: quarry (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.bomb
- Changed behavior: Vein Spoon may alter only action.bomb (engine.ts bombPressed; spends 1 bomb; radius 22; damage 2; cracked tile sets quarryOpen. Shop can grant bombs without a new relic check at fire time.). add radius 8 on action.bomb; add cooldown 0.4 on action.bomb. The keg's blast reaches farther and the next keg is slower to set.
- Tradeoff: Unmodified action.bomb stays available if you leave this off. While worn: cooldown +0.4s.
- Equip: Binds as a implement on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the tool action's own gate, unchanged, is open. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Beside the powder cache in the quarry approach, once kegs are in the pack.
- Provenance: A spoon hammered flat by someone who measured blast rings in the gravel.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.003 Grave Bit

- Discipline: quarry (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.dig
- Changed behavior: Grave Bit may alter only action.dig (engine.ts dig; grave within 20; erodeGrave before recovery; shovel must be ySlot). add radius 6 on action.dig; add windup 0.3 on action.dig. The shovel searches a wider circle and bites later. Erosion still runs.
- Tradeoff: Unmodified action.dig stays available if you leave this off. While worn: windup +0.3s.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing shovel relic, and you already carry shovel. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: Stuck in a mound on the edge of Middlebury, fourteen winters on.
- Provenance: Ground from a bit that outlasted the farmhand who dropped it.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.004 Peen Collar

- Discipline: quarry (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.smash
- Changed behavior: Peen Collar may alter only action.smash (engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot). add knockback 8 on action.smash; mul damageMul 0.85 on action.smash. The follow-up slash inside smash shoves harder and cuts softer.
- Tradeoff: Unmodified action.smash stays available if you leave this off. While worn: damageMul × 0.85.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hammer relic, and you already carry hammer. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Scratched into a collar in the Rutland yard, where the civic hammer hangs.
- Provenance: Inscribed by a smith who wanted bodies moved, not opened.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.005 Night Plug

- Discipline: quarry (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.smash
- Changed behavior: Night Plug may alter only action.smash (engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot). add cooldown -0.04 on action.smash; add selfSlow 0.15 on action.smash. The hammer recovers a little sooner and your own step drags after the blow.
- Tradeoff: Unmodified action.smash stays available if you leave this off. While worn: cooldown -0.04; self slow +0.15.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hammer relic, and you already carry hammer. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Nailed into a night wall of the quarry, lamp or no lamp.
- Provenance: A plug turned modifier by someone who worked the vein after dark.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.006 Charge Crimp

- Discipline: quarry (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.bomb
- Changed behavior: Charge Crimp may alter only action.bomb (engine.ts bombPressed; spends 1 bomb; radius 22; damage 2; cracked tile sets quarryOpen. Shop can grant bombs without a new relic check at fire time.). mul damageMul 1.25 on action.bomb. The same keg hits harder because the crimp takes a bite of your own hp on the press.
- Tradeoff: Unmodified action.bomb stays available if you leave this off. While worn: spends 1 hp on the press, with no refund.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the tool action's own gate, unchanged, is open. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Crimped onto a keg strap in the Bristol barn cache.
- Provenance: A powder hand's crimp. It never gives the keg back.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.007 Spall Screen

- Discipline: quarry (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.smash
- Changed behavior: Spall Screen may alter only action.smash (engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot). add radius 4 on action.smash. Chips fly farther. The screen draws 1 mp when the hammer comes down.
- Tradeoff: Unmodified action.smash stays available if you leave this off. While worn: spends 1 mp on the press, with no refund.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hammer relic, and you already carry hammer. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Leaning on the marble stair inside the quarry.
- Provenance: Woven from spall by a cutter who spent mana like water.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.008 Lodestone Chip

- Discipline: quarry (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.dig
- Changed behavior: Lodestone Chip may alter only action.dig (engine.ts dig; grave within 20; erodeGrave before recovery; shovel must be ySlot). add radius 4 on action.dig; add windup 0.15 on action.dig; set targetFilter "fresh-mound" on action.dig. The search prefers a fresh mound and still runs erodeGrave. It does not open marble.
- Tradeoff: Unmodified action.dig stays available if you leave this off. While worn: windup +0.15s.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other dig-mark objects.
- Use: Applies only while off-hand is the existing shovel relic, and you already carry shovel. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: Lodged in the dirt of your own last grave, once the shovel is back.
- Provenance: A chip that remembers the last body and no one else's.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.009 Rim Mallet

- Discipline: quarry (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.smash
- Changed behavior: Rim Mallet may alter only action.smash (engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot). add knockback 6 on action.smash; add cooldown 0.25 on action.smash. The rim adds knockback to the follow-up slash and makes the next smash wait.
- Tradeoff: Unmodified action.smash stays available if you leave this off. While worn: cooldown +0.25s.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hammer relic, and you already carry hammer. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: On the rim of the quarry mouth, not inside the dark.
- Provenance: Turned from a broken mallet head after a shift that ran long.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.010 Dust Veil

- Discipline: quarry (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.bomb
- Changed behavior: Dust Veil may alter only action.bomb (engine.ts bombPressed; spends 1 bomb; radius 22; damage 2; cracked tile sets quarryOpen. Shop can grant bombs without a new relic check at fire time.). add radius -6 on action.bomb; mul damageMul 0.7 on action.bomb; add iFrames 0.2 on action.bomb. The blast is smaller and weaker, and you are briefly harder to hit after it.
- Tradeoff: Unmodified action.bomb stays available if you leave this off. While worn: radius -6; damageMul × 0.7.
- Equip: Binds as a modifier on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the tool action's own gate, unchanged, is open. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Folded into a niche above the vein, dusty, not magical.
- Provenance: A veil worn by a blaster who wanted to stay in the hole.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.011 Seam Chisel

- Discipline: quarry (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.dig
- Changed behavior: Seam Chisel may alter only action.dig (engine.ts dig; grave within 20; erodeGrave before recovery; shovel must be ySlot). add surveyRadius 3 on action.dig; add windup 0.2 on action.dig. Digging also surveys nearby cracked seams. It does not convert them. Smash or a keg still must.
- Tradeoff: Unmodified action.dig stays available if you leave this off. While worn: windup +0.2s.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing shovel relic, and you already carry shovel. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: Left on a seam the hammer had not opened yet.
- Provenance: A chisel that looks and does not strike.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.012 Keyway Nail

- Discipline: quarry (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.bomb
- Changed behavior: Keyway Nail may alter only action.bomb (engine.ts bombPressed; spends 1 bomb; radius 22; damage 2; cracked tile sets quarryOpen. Shop can grant bombs without a new relic check at fire time.). add radius 6 on action.bomb; add windup 0.35 on action.bomb. The keg waits, then blooms wider. If you are still inside, the nail bites you when it resolves.
- Tradeoff: Unmodified action.bomb stays available if you leave this off. While worn: if you are still inside the blast when it resolves, you take 1 hp; windup +0.35s.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the tool action's own gate, unchanged, is open. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: Driven into a keyway stone beside a cracked tile.
- Provenance: A nail from the lock side of the vein. Removal mid-wait drops the extra radius; the keg stays spent.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.013 Marble Thread

- Discipline: quarry (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.smash
- Changed behavior: Marble Thread may alter only action.smash (engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot). add reach 4 on action.smash; add cooldown 0.06 on action.smash. The slash that smash already calls reaches farther and recovers slower.
- Tradeoff: Unmodified action.smash stays available if you leave this off. While worn: cooldown +0.06s.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hammer relic, and you already carry hammer. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Threaded through a hairline in the temple marble.
- Provenance: Spun from marble dust and wire by a cutter on a second life.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.014 Witness Chisel

- Discipline: quarry (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.smash
- Changed behavior: Witness Chisel may alter only action.smash (engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot). set pattern "line3" on action.smash; add knockback 6 on action.smash; mul damageMul 0.8 on action.smash. The plus becomes a line of three. The follow-up slash hits softer and shoves harder.
- Tradeoff: Unmodified action.smash stays available if you leave this off. While worn: damageMul × 0.8.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other pattern-smash objects.
- Use: Applies only while off-hand is the existing hammer relic, and you already carry hammer. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Witness marks on the quarry's north plug.
- Provenance: Inscribed by someone who wanted a corridor, not a room.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.015 Otter Cuff

- Discipline: creek (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.swim
- Changed behavior: Otter Cuff may alter only action.swim (engine.ts moveActor isSolid(..., relics includes flippers); relic flippers verb Swim). add duration 0.4 on action.swim; add selfSlow 0.2 on action.swim. The water step glides longer. Landing drags. Fins are still required.
- Tradeoff: Unmodified action.swim stays available if you leave this off. While worn: self slow +0.2.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry flippers, and Creek fins are already owned and you are in the water. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Snagged on a root in Otter Creek, west of the Green.
- Provenance: An otter-cuff the fishers at the creek already knew by sight.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.016 Current Vane

- Discipline: creek (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.swim
- Changed behavior: Current Vane may alter only action.swim (engine.ts moveActor isSolid(..., relics includes flippers); relic flippers verb Swim). mul speedMul 1.15 on action.swim; add selfSlow 0.12 on action.swim. You swim faster and settle slower when the stroke ends.
- Tradeoff: Unmodified action.swim stays available if you leave this off. While worn: self slow +0.12.
- Equip: Binds as a inscribed on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry flippers, and Creek fins are already owned and you are in the water. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Nailed to a piling at the Vergennes landing.
- Provenance: Inscribed with a current-mark that never learned to walk.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.017 Hook Sleeve

- Discipline: creek (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Hook Sleeve may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). add duration 0.15 on action.hook; add cooldown 0.15 on action.hook. The Sugar-line lives longer in the air and is slower to throw again.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: cooldown +0.15s.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Slid over a mooring hook on the creek wall.
- Provenance: A sleeve stitched for the chain, not a new chain.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.018 Latch Bell

- Discipline: creek (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Latch Bell may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). add radius 4 on action.hook; add windup 0.08 on action.hook. The latch forgives a wider miss and leaves the hand a beat later.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: windup +0.08s.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: Hung on a post the line already loves.
- Provenance: A bell from a ferry latch, retimed, not reborn.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.019 Floe Nail

- Discipline: creek (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.dash
- Changed behavior: Floe Nail may alter only action.dash (engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler). add distance 6 on action.dash; add cooldown 0.12 on action.dash. An open dash covers more ground and waits longer. It does not open the dash gate.
- Tradeoff: Unmodified action.dash stays available if you leave this off. While worn: cooldown +0.12s.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the dash gate is already open (Gap boots, Shadow Step, or the smuggler skin). If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Frozen into creek ice near the Salisbury bank.
- Provenance: A nail pulled from a floe by someone who already owned the boots.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.020 Creek Weight

- Discipline: creek (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Creek Weight may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). mul speedMul 0.85 on action.hook; add knockback 6 on action.hook. The chain flies slower and the latch shoves harder.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: speedMul × 0.85.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Tied to a sinker at the Ferrisburgh landing.
- Provenance: A weight the creek used on trotlines.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.021 Eddy Pin

- Discipline: creek (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.swim
- Changed behavior: Eddy Pin may alter only action.swim (engine.ts moveActor isSolid(..., relics includes flippers); relic flippers verb Swim). add distance 2 on action.swim; add selfSlow 0.18 on action.swim. Each legal water step is longer, and you are slow after it.
- Tradeoff: Unmodified action.swim stays available if you leave this off. While worn: self slow +0.18.
- Equip: Binds as a implement on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry flippers, and Creek fins are already owned and you are in the water. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Pinned in an eddy behind a Middlebury bridge stone.
- Provenance: A pin that only matters once the fins are on.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.022 Reed Wrap

- Discipline: creek (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Reed Wrap may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). add duration 0.12 on action.hook; set targetFilter "posts-only" on action.hook. The line reaches a little longer and will only latch posts, not pots or beasts.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: a narrower shape or a slower recovery than the bare tool.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Wrapped on reeds at the creek mouth.
- Provenance: A wrap that narrowed the Sugar-line's manners.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.023 Ice Buckle

- Discipline: creek (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.dash
- Changed behavior: Ice Buckle may alter only action.dash (engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler). add iFrames 0.1 on action.dash; add distance -4 on action.dash. The dash gains a short untouchable beat and covers less ground. The gate stays as it was.
- Tradeoff: Unmodified action.dash stays available if you leave this off. While worn: distance -4.
- Equip: Binds as a modifier on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the dash gate is already open (Gap boots, Shadow Step, or the smuggler skin). If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Buckled to a boot already allowed to dash, found on the ice.
- Provenance: A buckle from a creek skater who never owned a new verb.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.024 Otter Line

- Discipline: creek (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Otter Line may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). mul speedMul 1.1 on action.hook; add cooldown 0.1 on action.hook. The chain is quicker and the hand is slower to recast.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: cooldown +0.1s.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Coiled where otters slide, north of the landing.
- Provenance: Braided from an otter-line the fishers retired.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.025 Wet Boot Spike

- Discipline: creek (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.dash
- Changed behavior: Wet Boot Spike may alter only action.dash (engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler). add distance 6 on action.dash; add cooldown 0.2 on action.dash; add distance -4 on action.dash; add cooldown 0.2 on action.dash. In the water the open dash is longer. On land it is shorter. The wait grows either way.
- Tradeoff: Unmodified action.dash stays available if you leave this off. While worn: cooldown +0.2s; outside its condition the numbers worsen.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the dash gate is already open (Gap boots, Shadow Step, or the smuggler skin). If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Spiked into a boot-sole at the creek ford.
- Provenance: A spike for someone who already dashed, wet or dry.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.026 Current Hook

- Discipline: creek (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Current Hook may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). mul speedMul 1.2 on action.hook; add duration -0.1 on action.hook. The head flies faster and dies sooner.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: duration -0.1.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Hooked on a current-vane the landing already used.
- Provenance: A head rebent by the creek, not a second relic.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.027 Bank Nail

- Discipline: creek (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.swim
- Changed behavior: Bank Nail may alter only action.swim (engine.ts moveActor isSolid(..., relics includes flippers); relic flippers verb Swim). mul speedMul 1.1 on action.swim; add selfSlow 0.15 on action.swim. Legal swimming is quicker. The bank makes you heavy when the stroke ends.
- Tradeoff: Unmodified action.swim stays available if you leave this off. While worn: self slow +0.15.
- Equip: Binds as a implement on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry flippers, and Creek fins are already owned and you are in the water. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Hammered into the bank path, useless without fins.
- Provenance: A nail the bank gave up after a flood.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.028 Spill Collar

- Discipline: creek (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Spill Collar may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). add radius 6 on action.hook. The latch is wider. The collar takes 1 mp on the throw.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: spends 1 mp on the press, with no refund.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Collar found in the spill below the Vergennes falls.
- Provenance: A collar that spends mana the chain never asked for.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.029 Ladle Ferrule

- Discipline: sugar (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.slash
- Changed behavior: Ladle Ferrule may alter only action.slash (engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy). add statusSlow 0.35 on action.slash; mul damageMul 0.88 on action.slash. The slash leaves slow, the way a sugared affix already can, and the cut is softer.
- Tradeoff: Unmodified action.slash stays available if you leave this off. While worn: damageMul × 0.88.
- Equip: Binds as a fitting on the existing weapon anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry sword. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Ferrule off a ladle in the sugarhouse.
- Provenance: Fitted by a boiler who liked a sticky blade more than a deep one.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.030 Sap Weight

- Discipline: sugar (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Sap Weight may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). add statusSlow 0.4 on action.hook; mul speedMul 0.8 on action.hook. A latched body slows. The Sugar-line itself is heavier in the air.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: speedMul × 0.8.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Hung in the sugarhouse rafters above the pan.
- Provenance: Inscribed on a sap-weight. Magic enough that weather keeps it in the grave.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.031 Tin Spoon

- Discipline: sugar (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.sip
- Changed behavior: Tin Spoon may alter only action.sip (engine.ts sip; empties one bottle; syrup or deluxe heals 4 hp; creemee or deluxe fills mp). add heal 1 on action.sip; add windup 0.25 on action.sip; add selfSlow 0.3 on action.sip. Syrup heals one more heart and you drink slower. The bottle is still emptied on the press.
- Tradeoff: Unmodified action.sip stays available if you leave this off. While worn: windup +0.25s; self slow +0.3.
- Equip: Binds as a implement on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while a filled bottle is already in hand. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: In the tin beside the sugarhouse bottle rack.
- Provenance: A spoon that never refills what sip already spent.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.032 Sugar-line Braid

- Discipline: sugar (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Sugar-line Braid may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). add duration 0.1 on action.hook; add cooldown 0.2 on action.hook. The chain's life grows by a tenth and the recast waits longer.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: cooldown +0.2s.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Braided onto the hookshot's own line, not a replacement line.
- Provenance: A braid from the sugarhouse that the relic was already named for.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.033 Grade Nail

- Discipline: sugar (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.slash
- Changed behavior: Grade Nail may alter only action.slash (engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy). add statusSlow 0.2 on action.slash; add reach -2 on action.slash. The cut slows a body and your reach shortens.
- Tradeoff: Unmodified action.slash stays available if you leave this off. While worn: reach -2.
- Equip: Binds as a modifier on the existing weapon anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry sword. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Nailed into a grade-stake behind the sugarhouse.
- Provenance: A nail from the grading shed, mean and short.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.034 Dark Thread

- Discipline: sugar (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.sip, action.slash
- Changed behavior: Dark Thread may alter only action.sip (engine.ts sip; empties one bottle; syrup or deluxe heals 4 hp; creemee or deluxe fills mp); action.slash (engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy). add heal -1 on action.sip; add statusSlow 0.2 on action.slash. This sip heals less. The next slash carries a little slow. The bottle is not returned.
- Tradeoff: Unmodified action.sip stays available if you leave this off. While worn: heal -1.
- Equip: Binds as a inscribed on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while a filled bottle is already in hand. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Wound on a dark-syrup thread in the sugarhouse loft.
- Provenance: Inscribed by a boiler on a bitter year. Weather keeps the thread.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.035 Crystal Bead

- Discipline: sugar (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Crystal Bead may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). add radius 3 on action.hook; add selfSlow 0.1 on action.hook. The latch is a little wider and you are slow after the throw.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: self slow +0.1.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A bead cooled on the sugarhouse windowsill.
- Provenance: Sugar that set around a bit of twine.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.036 Boil Collar

- Discipline: sugar (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.slash
- Changed behavior: Boil Collar may alter only action.slash (engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy). mul damageMul 1.1 on action.slash. The slash cuts harder. The collar takes half a heart on the press and does not give it back.
- Tradeoff: Unmodified action.slash stays available if you leave this off. While worn: spends 0.5 hp on the press, with no refund.
- Equip: Binds as a modifier on the existing weapon anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry sword. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Buckled near the boil pan.
- Provenance: A collar from a night boil. It spends blood, not a new coin.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.037 Stick Ferrule

- Discipline: sugar (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.cut
- Changed behavior: Stick Ferrule may alter only action.cut (engine.ts cutGrass; bush or pot within 22; called from the slash). add radius 4 on action.cut; add cooldown 0.05 on action.cut. The grass cut that already follows a slash reaches farther and recovers slower.
- Tradeoff: Unmodified action.cut stays available if you leave this off. While worn: cooldown +0.05s.
- Equip: Binds as a implement on the existing weapon anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry sword. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Ferrule off a stir-stick by the evaporator.
- Provenance: A ferrule for the cut you already make, not a new tool.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.038 Pan Nail

- Discipline: sugar (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.sip
- Changed behavior: Pan Nail may alter only action.sip (engine.ts sip; empties one bottle; syrup or deluxe heals 4 hp; creemee or deluxe fills mp). add heal 2 on action.sip. Syrup heals two more. The nail takes 1 karma on the press. The bottle stays empty.
- Tradeoff: Unmodified action.sip stays available if you leave this off. While worn: spends 1 karma on the press, with no refund.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while a filled bottle is already in hand. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Worked loose from the sugarhouse pan rim.
- Provenance: A nail that sweetens the sip and dirties the ledger.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.039 Seed Hook

- Discipline: sugar (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.hook
- Changed behavior: Seed Hook may alter only action.hook (engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)). set targetFilter "post-pot-beast" on action.hook; add duration -0.08 on action.hook; add radius 3 on action.hook. The legal targets stay the ones the line already has. The latch is wider and the flight is shorter.
- Tradeoff: Unmodified action.hook stays available if you leave this off. While worn: duration -0.08.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing hookshot relic, and you already carry hookshot. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Hooked in a seed sack in the sugarhouse shed.
- Provenance: A hook that did not invent a new latch, only a wider one. Duration is the cost.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.040 Comb Ferrule

- Discipline: sugar (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.slash
- Changed behavior: Comb Ferrule may alter only action.slash (engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy). add radius 3 on action.slash; mul damageMul 0.9 on action.slash. The slash's hit circle grows and the damage shrinks.
- Tradeoff: Unmodified action.slash stays available if you leave this off. While worn: damageMul × 0.9.
- Equip: Binds as a modifier on the existing weapon anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry sword. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Ferrule from a honey-comb frame kept in the sugarhouse, not a new weapon.
- Provenance: Fitted by someone who wanted a wide sticky cut.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.041 House Spoon

- Discipline: sugar (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.sip
- Changed behavior: House Spoon may alter only action.sip (engine.ts sip; empties one bottle; syrup or deluxe heals 4 hp; creemee or deluxe fills mp). add heal 2 on action.sip; add windup 0.4 on action.sip. The sip heals more if the spoon stays through the windup. Pull it early and the heal is ordinary. The bottle was already spent.
- Tradeoff: Unmodified action.sip stays available if you leave this off. While worn: windup +0.4s.
- Equip: Binds as a implement on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while a filled bottle is already in hand. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: In the house spoon jar at the sugarhouse door.
- Provenance: A spoon for the pause after the swallow, not a second bottle.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.042 Nock Chip

- Discipline: ash (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Nock Chip may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). set chargeThreshold 0.08 on action.bow; mul damageMul 0.85 on action.bow. The ash bow may release earlier than 0.12 and the shot is weaker. The arrow is still one.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: damageMul × 0.85.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other charge-threshold objects.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Chipped from a nock in the woods cache where ash bows already turn up.
- Provenance: A chip that retimes the draw the engine already charges at 1.6.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.043 Ember Wrap

- Discipline: ash (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Ember Wrap may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). add statusBurn 0.4 on action.bow. The shot's existing burn channel gains heat. The wrap takes hp on the press and never refunds an arrow.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: spends 0.35 hp on the press, with no refund.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Wrapped on a spent shaft behind the ash lot.
- Provenance: A wrap that writes into hitEnemy's burn, the same field as the ember affix.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.044 Quiet String

- Discipline: ash (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Quiet String may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). mul speedMul 0.8 on action.bow; add duration 0.15 on action.bow. The arrow is slower and lives longer in the air.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: speedMul × 0.8.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Strung as a spare beside the bowyer's stump.
- Provenance: A string for the shot you already fire.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.045 Ash Serving

- Discipline: ash (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Ash Serving may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). mul damageMul 1.15 on action.bow; set chargeThreshold 0.2 on action.bow. A full draw hits harder. You may not release at the old 0.12.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: must draw to 0.2 before release.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other charge-threshold objects.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Served into the grip of a woods-cache bow.
- Provenance: Inscribed on ash. Weather keeps it in the grave like other magic.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.046 Spine Pin

- Discipline: ash (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Spine Pin may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). add knockback 4 on action.bow; add cooldown 0.06 on action.bow. The hitEnemy knock the shot already applies is stronger, and the next draw waits.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: cooldown +0.06s.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Pinned through a spine of scrap ash.
- Provenance: A pin for the knockback hitEnemy already does.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.047 Soot Nail

- Discipline: ash (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.slash
- Changed behavior: Soot Nail may alter only action.slash (engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy). add statusBurn 0.3 on action.slash; add reach -2 on action.slash. The slash's burn channel rises and your reach falls. It stacks with ember under the diminishing rule.
- Tradeoff: Unmodified action.slash stays available if you leave this off. While worn: reach -2.
- Equip: Binds as a fitting on the existing weapon anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry sword. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Sooted nail from the camp beside the ash lot.
- Provenance: A nail that shares the burn stack with weapons.ts ember instead of adding a second full burn.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.048 Coal Thumb

- Discipline: ash (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Coal Thumb may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). add radius 8 on action.bow; mul damageMul 0.75 on action.bow; set pattern "splash" on action.bow. The impact grows a splash and each hit is weaker. One arrow, still.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: damageMul × 0.75.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other pattern-bow objects.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A coal-stained thumb stall in the woods cache.
- Provenance: A stall that changes the shot's shape, not its ammunition.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.049 Winter Nock

- Discipline: ash (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Winter Nock may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). mul speedMul 1.25 on action.bow; mul damageMul 0.8 on action.bow. The arrow is faster and hits softer.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: damageMul × 0.8.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Nock cut in winter from a downed ash.
- Provenance: A nock for speed, paid in damage.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.050 Pitch Wrap

- Discipline: ash (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Pitch Wrap may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). add statusSlow 0.25 on action.bow; mul chargeRate 0.8 on action.bow; add windup 0.12 on action.bow. The shot can slow. The draw is lazier, and a short windup sits in front of it. Pull the wrap off during the wait and the slow does not ride.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: chargeRate × 0.8; windup +0.12s.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: Pitch-wrapped where the bowyers warm their hands.
- Provenance: A wrap that delays the draw the engine already charges continuously.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.051 Fletching Bead

- Discipline: ash (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Fletching Bead may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). add duration 0.2 on action.bow; mul damageMul 0.92 on action.bow. The shot lives longer and hits a little softer.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: damageMul × 0.92.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Bead tied into fletching at the woods cache.
- Provenance: A bead for flight time, not a free arrow.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.052 Camp Nail

- Discipline: ash (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.slash
- Changed behavior: Camp Nail may alter only action.slash (engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy). add statusBurn 0.45 on action.slash; add selfSlow 0.12 on action.slash. Slash burn rises, and you are slow after. A second burn fitting does not add its full number on top.
- Tradeoff: Unmodified action.slash stays available if you leave this off. While worn: self slow +0.12.
- Equip: Binds as a modifier on the existing weapon anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while you already carry sword. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: In the ash of a camp fire, not a new currency.
- Provenance: A camp nail that shares the burn stack.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.053 Long Ash

- Discipline: ash (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Long Ash may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). add duration 0.25 on action.bow; mul chargeRate 0.75 on action.bow. The arrow lives longer. The same hold draws less power, so the hit is weaker.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: chargeRate × 0.75.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A long offcut of ash beside the bowyer stump.
- Provenance: An offcut that taxes the charge rate of 1.6.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.054 Split Serving

- Discipline: ash (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.bow
- Changed behavior: Split Serving may alter only action.bow (engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)). set pattern "split2" on action.bow; mul damageMul 0.45 on action.bow. The release becomes two weaker shots. The press still spends one arrow, never zero and never two.
- Tradeoff: Unmodified action.bow stays available if you leave this off. While worn: damageMul × 0.45.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other pattern-bow objects.
- Use: Applies only while off-hand is the existing bow relic, and you already carry bow. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Split mark on a serving in the woods cache.
- Provenance: Inscribed to spread a shot, not to mint arrows.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.055 Quarry Hood

- Discipline: lantern (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Quarry Hood may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). set lightShape "cone" on action.lantern; add lightOuter 14 on action.lantern; add lightInner -16 on action.lantern. The lamp's radial pool becomes a cone: farther forward, darker at your feet. The relic is still required.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: lightInner -16.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other light-shape objects.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Hung on a peg inside the quarry, useless until the lamp is yours and readied.
- Provenance: A hood cut for the vein's dark. It does not turn the lamp on by itself.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.056 Wick Collar

- Discipline: lantern (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Wick Collar may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). add lightOuter 16 on action.lantern. The open lamp throws farther. The collar takes 1 mp when you start the toggle and does not give it back.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: spends 1 mp on the press, with no refund.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Collared around a cold wick in Middlebury, not Maeve's keepsake.
- Provenance: Inscribed by a neighbor of the Green. Weather keeps it. It is not the bond lantern.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.057 Shutter Plate

- Discipline: lantern (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Shutter Plate may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). add windup 0.25 on action.lantern; add lightOuter 24 on action.lantern. The lamp waits, then throws farther. Remove the plate during the wait and the light is the ordinary 28/96.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: windup +0.25s.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: A shutter screwed off a farmhouse lamp, fitted to the relic you already carry.
- Provenance: A plate that delays lanternOn. It never sets that flag without the oil lamp.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.058 Side Glass

- Discipline: lantern (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Side Glass may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). set lightShape "wide" on action.lantern; add lightInner 8 on action.lantern; add lightOuter -10 on action.lantern. A wide pool, clear at the center, short ahead. It will not share the lamp with another shape.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: lightOuter -10.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other light-shape objects.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Side glass from a barn lantern in the Addison lot.
- Provenance: Glass that widens the pool the quarry shader already draws.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.059 Soot Chimney

- Discipline: lantern (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Soot Chimney may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). add lightOuter 20 on action.lantern; add selfSlow 0.08 on action.lantern. The throw is longer and your step is heavier while you work the lamp.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: self slow +0.08.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A chimney cap sooted in the inn's lamp closet.
- Provenance: A cap that lengthens the outer radius and taxes the walk.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.060 Green Glass

- Discipline: lantern (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Green Glass may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). set lightShape "low" on action.lantern; add lightOuter 6 on action.lantern; add lightInner -10 on action.lantern. A low beam: a little farther, less light at the feet. It does not read the Open Sight upgrade.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: lightInner -10.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other light-shape objects.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Green glass in the college stair, a lamp fitting, not a secret sense.
- Provenance: Inscribed glass. It does not claim the sight upgrade. Weather keeps it.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.061 Neighbor Collar

- Discipline: lantern (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Neighbor Collar may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). add lightOuter 12 on action.lantern. A modest longer throw. Toggling spends 1 karma. This is not Maeve's lantern and does not copy the keepsake.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: spends 1 karma on the press, with no refund.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: On a neighbor's step off the Middlebury Green.
- Provenance: A collar from the street, not from Maeve Holloway's bond.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.062 Reservoir Nail

- Discipline: lantern (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Reservoir Nail may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). add lightOuter 8 on action.lantern; add selfSlow 0.05 on action.lantern; add lightOuter -12 on action.lantern; add selfSlow 0.05 on action.lantern. Above two hearts the lamp throws a little farther. At one heart the throw shrinks. Nothing about it asks to be refilled.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: self slow +0.05; outside its condition the numbers worsen.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Nailed into a lamp reservoir that this pack refuses to turn into upkeep.
- Provenance: A nail for a health condition, not a reservoir to refill.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.063 Quarry Nail

- Discipline: lantern (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Quarry Nail may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). add lightOuter 18 on action.lantern; add selfSlow 0.1 on action.lantern; add lightOuter -6 on action.lantern. Inside the quarry the outer light grows and you slow. Anywhere else the throw shrinks. The dark gate stays.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: self slow +0.1; outside its condition the numbers worsen.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Driven into the quarry wall where the radial darkness already lives.
- Provenance: A nail that only helps on mapId quarry, and never without the lamp.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.064 Hood Pin

- Discipline: lantern (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Hood Pin may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). set lightShape "narrow-cone" on action.lantern; add lightOuter 28 on action.lantern; add lightInner -18 on action.lantern. A narrow cone, long ahead and blind beside you.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: lightInner -18.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other light-shape objects.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Pinned through the quarry hood's spare seam.
- Provenance: A pin that narrows the same lamp, exclusive with other shapes.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.065 Flicker Weight

- Discipline: lantern (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Flicker Weight may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). add lightOuter 4 on action.lantern; add lightInner -10 on action.lantern. The average throw is a little farther and the trough at your feet is darker.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: lightInner -10.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A weight in the lamp's bail, found in the inn.
- Provenance: A weight that flickers the existing gradient, not a new light source.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.066 Back Glass

- Discipline: lantern (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Back Glass may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). set lightShape "rear-cone" on action.lantern; add lightOuter -20 on action.lantern; add lightRear 70 on action.lantern. The forward throw shortens. A rear cone appears for a retreat. Not the Homestead glass relic.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: lightOuter -20.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other light-shape objects.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Back glass from a wagon lamp in the Rutland yard.
- Provenance: Inscribed to look behind. It does not call warpHome.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.067 Palm Shutter

- Discipline: lantern (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.lantern
- Changed behavior: Palm Shutter may alter only action.lantern (engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)). add iFrames 0.15 on action.lantern; add lightOuter -14 on action.lantern; add cooldown 0.8 on action.lantern. Working the lamp grants a brief untouchable beat, shortens the throw, and will not strobe.
- Tradeoff: Unmodified action.lantern stays available if you leave this off. While worn: lightOuter -14; cooldown +0.8s.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing lantern relic, and you already carry lantern. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A palm-worn shutter from the farmhouse lamp shelf.
- Provenance: A shutter for timing, paid in radius and a long toggle wait.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.068 Seam Thread

- Discipline: hollow (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Seam Thread may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). add distance 8 on action.cape. The phase step is longer. The thread takes 1 extra mp on the press, on top of the cape's own mp, and does not refund either.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: spends 1 mp on the press, with no refund.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Threaded in a seam of shadow off the quarry, after the cape has already dropped.
- Provenance: Inscribed thread. It lengthens the 28-step the cape already takes. Weather keeps it.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.069 Hollow Nail

- Discipline: hollow (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.dash
- Changed behavior: Hollow Nail may alter only action.dash (engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler). add distance 8 on action.dash; add cooldown 0.18 on action.dash. An already-legal dash goes farther and waits longer. The nail does not open the gate.
- Tradeoff: Unmodified action.dash stays available if you leave this off. While worn: cooldown +0.18s.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the dash gate is already open (Gap boots, Shadow Step, or the smuggler skin). If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: In the hollow below the Green, beside a bootprint.
- Provenance: A nail for the dash engine.ts already gates. Not a new Shadow Step.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.070 Seam Pin

- Discipline: hollow (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Seam Pin may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). add iFrames 0.15 on action.cape; add distance -6 on action.cape. The phase's invuln lasts longer and the step is shorter.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: distance -6.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Pinned in a seam the cape already passes.
- Provenance: A pin that retimes the 0.45 invuln.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.071 Shadow Bead

- Discipline: hollow (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Shadow Bead may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). add windup 0.12 on action.cape; add iFrames 0.2 on action.cape. The phase waits, then the invuln is longer. Remove the bead during the wait and the invuln is 0.45 again. The extra mp stays spent.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: spends 1 mp on the press, with no refund; windup +0.12s.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack. Removed during windup, its ops leave the resolution. Costs already committed on the press stay spent. The base tool still resolves. The object is not destroyed.
- Discovery: A bead in the cape's hem, found after the Sentinel's drop, not instead of it.
- Provenance: A bead that delays phase. The press still spends the cape's mp plus one.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.072 Phase Collar

- Discipline: hollow (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Phase Collar may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). set pattern "sidestep" on action.cape; set distance 20 on action.cape. The phase leaves sideways instead of forward, and the step is shorter than 28.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: a narrower shape or a slower recovery than the bare tool.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other pattern-cape objects.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A collar from the hollow path east of the pines.
- Provenance: A collar that changes the direction of the step the cape already takes.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.073 Quiet Step

- Discipline: hollow (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.dash
- Changed behavior: Quiet Step may alter only action.dash (engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler). add cooldown -0.06 on action.dash; add distance -6 on action.dash. The open dash recovers sooner and covers less ground.
- Tradeoff: Unmodified action.dash stays available if you leave this off. While worn: cooldown -0.06; distance -6.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the dash gate is already open (Gap boots, Shadow Step, or the smuggler skin). If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A quiet plate under a step in the hollow.
- Provenance: A plate for the boots cooldown of 0.28, not a way around it.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.074 Vein Thread

- Discipline: hollow (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Vein Thread may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). add distance 4 on action.cape; add selfSlow 0.2 on action.cape. The step is slightly longer and you are heavy after it.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: self slow +0.2.
- Equip: Binds as a modifier on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Thread caught on the vein side of the quarry dark.
- Provenance: A thread that spends no new resource and still taxes the walk.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.075 Mourning Pin

- Discipline: hollow (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Mourning Pin may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). add iFrames 0.05 on action.cape. A small extra beat of invuln. The pin takes 1 karma on the press.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: spends 1 karma on the press, with no refund.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Pinned in the chapel grass, not a fate dialogue.
- Provenance: A mourning pin. Karma moves. The cape's mp cost remains.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.076 Second Seam

- Discipline: hollow (ability id: none)
- Kind: inscribed
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Second Seam may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). set pattern "blink" on action.cape; add distance 2 on action.cape. The step blinks along its path and is only a little longer. It costs 1 extra mp.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: spends 1 mp on the press, with no refund.
- Equip: Binds as a inscribed on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. Exclusive with other pattern-cape objects.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A second seam opened in a cape you already earned.
- Provenance: Inscribed as a blink shape. It does not refund mp.
- Save: drops-to-grave; magic-kept. Drops on the grave with the rest of the pack, like a magic weapon in erodeGrave: weather does not delete it. The shovel is still required. Not a keepsake, and not written into src/game/save.ts.

## loot.expansion.mastery.077 Low Nail

- Discipline: hollow (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.dash
- Changed behavior: Low Nail may alter only action.dash (engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler). add iFrames 0.1 on action.dash; add cooldown 0.14 on action.dash. The dash, which grants no invuln in the engine, gains a short one and a longer wait.
- Tradeoff: Unmodified action.dash stays available if you leave this off. While worn: cooldown +0.14s.
- Equip: Binds as a fitting on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the dash gate is already open (Gap boots, Shadow Step, or the smuggler skin). If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Low in the hollow, where dashes already scuff the ground.
- Provenance: A nail that adds i-frames the dash does not have, and does not grant the dash.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.078 Hollow Buckle

- Discipline: hollow (ability id: none)
- Kind: modifier
- Binding: existing-effect-only
- Compatible effects: action.dash
- Changed behavior: Hollow Buckle may alter only action.dash (engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler). add distance 10 on action.dash; add selfSlow 0.25 on action.dash. A long dash, then a heavy step. The gate is untouched.
- Tradeoff: Unmodified action.dash stays available if you leave this off. While worn: self slow +0.25.
- Equip: Binds as a modifier on the existing passive anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while the dash gate is already open (Gap boots, Shadow Step, or the smuggler skin). If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: Buckled in the hollow below the pines.
- Provenance: A buckle for distance, paid in self slow.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.079 Seam Weight

- Discipline: hollow (ability id: none)
- Kind: fitting
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Seam Weight may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). add iFrames 0.08 on action.cape. A little more invuln. The weight takes 1 hp on the press.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: spends 1 hp on the press, with no refund.
- Equip: Binds as a fitting on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: A weight sewn into the cape's seam.
- Provenance: A weight that spends hp the phase did not spend.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.

## loot.expansion.mastery.080 Last Stitch

- Discipline: hollow (ability id: none)
- Kind: implement
- Binding: existing-effect-only
- Compatible effects: action.cape
- Changed behavior: Last Stitch may alter only action.cape (engine.ts cape; move 28; invuln 0.45; mp - 1). add iFrames 0.25 on action.cape; set distance 16 on action.cape. The invuln runs long and the step shrinks to 16.
- Tradeoff: Unmodified action.cape stays available if you leave this off. While worn: a narrower shape or a slower recovery than the bare tool.
- Equip: Binds as a implement on the existing y-relic anchor. It does not replace the relic, the weapon, or Q cycling. At most two mastery bindings. No exclusivity group.
- Use: Applies only while off-hand is the existing cape relic, and you already carry cape. If that gate is closed the object does nothing and does not open it. No oil, grit, or other upkeep is consumed between uses.
- Removal: Unbind returns it to the pack before the next press. It is not destroyed and does not wear out. A press that already resolved keeps its result.
- Discovery: The last stitch in a cape already on your shoulder.
- Provenance: A stitch that trades the 28-step for time.
- Save: drops-to-grave; mundane. Drops on the grave. Mundane erosion follows erodeGrave (12 winters keep chance 0.22, 6 winters 0.55, else 0.8). Not written into src/game/save.ts. Skill points, crowns, and Limbo upgrades are untouched.
