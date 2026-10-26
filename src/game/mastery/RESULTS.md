# Results

Passed: true
SHA: c737e42eb188148291438dfb8a5993d6ce2b77fa
Demonstrated objects: 20

- ok ids: 80 objects
- ok no integrated claim: tooltip text must not say integrated
- ok no upkeep meter: no consumable maintenance
- ok discipline ids null: every disciplineAbilityId is null
- ok six disciplines: quarry,creek,sugar,ash,lantern,hollow
- ok interrupt covers disciplines: quarry,creek,sugar,ash,lantern,hollow
- ok twenty demonstrated: 20
- ok demos span disciplines: discipline coverage
- ok incompatible pairs exist: 16
- ok duplicate pairs exist: 89
- ok unbound tools stay listed: action.spin, action.net, action.mirror, action.cane
- ok unresolved disciplines: c737e42eb188148291438dfb8a5993d6ce2b77fa

No failures. Every object changed a cited action, carried a tradeoff, preserved a closed tool gate, and refused resource refunds.

## Effect sources

- `action.slash`: engine.ts fireSlash / startCombo; hit radius weapon.reach + 6; knockback 10 in hitEnemy
- `action.spin`: engine.ts fireSpin; radius 28; charge >= 0.45; spinDamage in rules.ts
- `action.dig`: engine.ts dig; grave within 20; erodeGrave before recovery; shovel must be ySlot
- `action.hook`: engine.ts fireHook; speed 220; life 0.45; relic hookshot (verb Zip, name Sugar-line)
- `action.dash`: engine.ts dashPressed; distance 26; boots cooldown 0.28 else 0.55; gate is boots OR shadowStep OR incarnation smuggler
- `action.swim`: engine.ts moveActor isSolid(..., relics includes flippers); relic flippers verb Swim
- `action.lantern`: engine.ts ySlot lantern toggles lanternOn; quarry light uses relic owned AND lanternOn (inner 28 / outer 96)
- `action.smash`: engine.ts smash; plus of cracked tiles becomes marble; also calls fireSlash; hammer ySlot
- `action.net`: engine.ts swingNet; crows within 22 only
- `action.mirror`: engine.ts warpHome; mirror ySlot
- `action.cape`: engine.ts cape; move 28; invuln 0.45; mp - 1
- `action.cane`: engine.ts cane; mp >= 1 then mp - 1; places a pot block
- `action.bow`: engine.ts fireBow; arrow spent on release; charge rate 1.6; release if charge > 0.12; dmg 1.3 * (0.7 + power)
- `action.bomb`: engine.ts bombPressed; spends 1 bomb; radius 22; damage 2; cracked tile sets quarryOpen. Shop can grant bombs without a new relic check at fire time.
- `action.cut`: engine.ts cutGrass; bush or pot within 22; called from the slash
- `action.sip`: engine.ts sip; empties one bottle; syrup or deluxe heals 4 hp; creemee or deluxe fills mp