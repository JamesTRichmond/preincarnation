# Opening hour

A self-contained first session: Ellis arrives with a parcel, Ione says she had it fourteen years ago, the Marble Vein keeps an impression in other clothes, and dying is a shore you can leave. Lessons are derived from what you did. None of them is a gate.

## Not the walk

This pack is not imported by `src/routes` or the county canvas. Mounting it on `/` would cover the Green. It is a full-viewport scene, not Canvas 2D at 320×240, and its first hour is the parcel rather than Maeve's step. The game stays one person, death as a chapter, and the Marble Vein as the only plot.

The pack's save key, `preincarnation-opening-v1`, is unused until something imports `src/ui/OpeningPlay.tsx`. It does not read or write the county save.

## Run the checks

```sh
node --experimental-strip-types --test support/grok-20-opening/test/paths.test.ts
```

## Shape

- `src/engine.ts` — `step(state, command)`
- `src/verbs.ts` — contextual verbs, including the hammer rule (thread opens, face scars)
- `src/world.ts` — Middlebury through the east end of the lane
- `src/ui/` — canvas client for this pack only
- `DIALOGUE.md`, `DEPENDENCY-GRAPH.md`, `ESTIMATES.md`
