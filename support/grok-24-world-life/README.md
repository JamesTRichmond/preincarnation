# Plate 24 — world life

Deterministic posts for Preincarnation. Routines, idle work, talk, quest overrides, era substitution, fallbacks, and save/load. Not a life sim.

## Run the checks

```sh
node --experimental-strip-types --test support/grok-24-world-life/test/world-life.test.ts
```

## Shape

- `src/world.ts` — step, save, load, recovery, conflicts
- `src/activities.ts` — eighteen role activities with pose drivers and events, plus the recovery idle
- `src/hubs.ts` — Middlebury, the intervale, Otter landing
- `src/cast.ts` — six provisional returns
- `demo/` — the plate

Import from `src/index.ts`. Pass pack holders and quest overrides into `createWorld` when they exist; `createHubWorld` uses the fixtures until then.

## Not the walk

This plate is not imported by `src/routes` or the county canvas. Mounting it on `/` would cover the Green: the game is still one person, Canvas 2D at 320×240, death as a chapter, and the Marble Vein as the only plot. The plate's save key, `preincarnation-world-life-v1`, is unused until something imports the demo. It does not read or write the county save.
