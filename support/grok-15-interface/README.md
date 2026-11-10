# Ashwick register

Isolated pages for a life in Ashwick: title, save pages, pause, tools, bottles, evidence, the survey of places already stood, the life, the returns, and the four endings.

The gouache plates (Lark Ferry, the millrace, the rail cut, the chapel, the glassworks, the orchard wall, the archive, the blank survey, and Ivo) are in `public/ashwick/`. This register is the only thing that reads them.

## Not on the walk

`src/routes/index.tsx` and `src/components/game-app.tsx` do not import this module. Putting the ledger on `/` would cover the 320×240 canvas. That conflicts with the game: one person, Canvas 2D, death as a chapter, the Marble Vein as the only plot. These plates are studies. They are not the SNES field, and they do not replace the Green.

This module does not read or write `preincarnation.save.v1`. The save format is unchanged.

`npm run test:game` already globs `support/**/*.test.ts`, so `test/interface.test.ts` runs without a `package.json` edit.
