# PREINCARNATION

A SNES-coat Vermont reincarnation RPG. You are one person. Death is a chapter. The Marble Vein is the only plot.

You wake on the Middlebury Green. Maeve has the first step. The shovel is by the stone. East is the rest. Fourteen winters pass each time you fall. God, or the Other Voice, sends you back as yourself.

## Play

```bash
npm install
npm run dev
```

WASD or arrows to walk. Space slashes. E talks. Q cycles the off-hand. Die, read the chapter, spend the points, finish the job.

Bond **Maeve's lantern** and the lamp is in your hand when you return — not in the grass.

## Stack

React 19, TanStack Start, Canvas 2D at 320×240, localStorage save.

## Test

Node 22.12 or newer (`.nvmrc` pins 22). `node --test` globs and Vite 8's rolldown both need it; on 22.11 or older, `npm ci` silently skips the rolldown native binding and the build fails.

```bash
npm ci
npm run typecheck   # tsc --noEmit
npm run build
npm test            # = npm run test:game
```

- `npm run test:game` runs every `src/**/*.test.ts` and every `support/**/*.test.{ts,mjs}`. Tests are found by pattern, so a new test file is picked up without editing `package.json`.
- `npm run test:platform` runs the app-builder template tests (`scripts/**/*.test.mjs`). It is kept separate from `npm test` on purpose:
  - Tests that read `.grok/` skip with a reason when that directory is absent. `.grok/` is gitignored and only exists inside the Grok app-builder workspace.
  - 8 `grok-pwa-plugin` tests currently fail. They expect the template's default share card, while this game ships its own `src/lib/og/site.json` (title PREINCARNATION, `og:type` `x:game`). They are known template drift and are left in place, not deleted.
- `npm run test:all` runs both.
