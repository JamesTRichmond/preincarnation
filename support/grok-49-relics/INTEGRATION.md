# Marble Vein relics — integration contract

Reserved ids: `loot.relic.001`–`loot.relic.096`. Do not mint anything else in this band. Do not generate a second copy, a prefix, or a suffix.

Source of truth: `support/grok-49-relics/src/`. Import `resolve`, `resolveBlow`, `acquire`, `createBench`, `RELICS`, `capturePersistence`, and `applyPersistence` from `src/index.ts`.

## Coverage

| Band | Count | What ships |
| --- | --- | --- |
| Playable scenes | 12 | `loot.relic.001`–`012`, driven by `src/vignettes.ts` |
| Executable records | 96 | Every relic has a handler, a probe, a discovery, a provenance chain, a tradeoff, and a must-not list |
| Lore only | 0 | A record without a handler fails `validateCatalog` |
| Generated affixes | 0 | Forbidden |

`001`–`012` are the mandatory seeds: Maeve's Spare Key, the Unruler, A Jar of Last June, the Coat That Came Home Alone, the Bell Beneath the Bell, A Surveyor's Erased Ring, plus the spoon, ledger, window, ash, map, and veinspring cup.

## Call shape

```ts
resolve(world, { relicId, kind, targetId, extra }, RELICS)
resolveBlow(world, { amount, source, scripted, protected, bounded }, RELICS)
acquire(world, relic)
```

Failure returns the original world. Success returns a clone. If a handler changes a protected quest, protected document, protected grave, protected birthday, protected journal entry, protected sentence, protected exhibit, campaign-gate door, or any boundary that is not `survey-mark`, the kernel discards the clone and returns `protected-reference`.

## What other systems must author

- Remembered homestead doors (`kind: "remembered-homestead"`, `homesteadId` on the key's allowlist). Mundane locks and campaign gates are not doors the spare key understands.
- Approved spatial pairs (`approved: true`, context `puzzle` or `combat`) for the Unruler. Quest distances stay `approved: false`.
- One opportunity tagged `last-june` for the jar. Other weather tags belong to other relics.
- Blows. The coat and the handkerchief only see `bounded && !scripted && !protected` and lethal (Maeve's tape can widen the coat's band to hp ≤ 2). Scripted and protected deaths always land. On death, apply each relic's `persistence.onDeath`.
- Sound nodes with an optional `under`. `underProtected` must stay silent. The bell does not invent a layer.
- Survey marks as `class: "survey-mark"`. Campaign gates, quest locks, and region borders are a different class.
- Protected quests listed on each record. Relics must not complete or fail them. If Ellis cannot say his name, the quest layer waits. It does not fail.

## Duplicate and consumption

Each relic has one `sourceId`. `acquire` consumes it. A second instance in inventory, placed, or the vein bank is `duplicate-refused`. Saves that list the same id twice throw in `applyPersistence`.

## Exclusivity

Groups: `spatial-rewrite` (Unruler, left-handed map, broken inch), `boundary-edit` (erased ring, erasure ink), `maps` (Home margin), `measure` (Calder's level; the Unruler also refuses while it is held), `face` (scraped portrait, marble mirror).

## Restoration

When `restoration.needed` is set, follow `restoration.steps`. `lineageRequired` (the coat) cannot be finished by spare dust: dust only moves `fractured` → `mending`. Vein-debt from the handkerchief blocks restoration until a Silt Lane sleep.

## Demo

The archive UI is a viewer. The rules live in this folder. Probes for all 96 run under `support/grok-49-relics/test/relics.test.ts`.

## Canvas game

PREINCARNATION stays a 320×240 canvas. This folder is not mounted as a page. `src/game/vein.ts` is the only bridge: save version 9 stores `flags.veinHeld` and `flags.veinSources`, death applies `persistence.onDeath` without dropping these objects on the grass, and Maeve's bond grants `loot.relic.001` once on the walk back (cycle ≥ 1), beside the oil lamp, not instead of it. Tool relics in `src/game/items.ts` are a different list. Q still cycles those. The spare key is not a Y-slot.
