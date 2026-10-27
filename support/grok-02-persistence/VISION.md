# Not the runtime plot

This folder is a save-state test pack. Nothing here is imported by `src/game`.

The shipped game stays what [README.md](../../README.md) says: one person, death as a chapter, the Marble Vein as the only plot, Canvas 2D at 320×240, saves in localStorage. No accounts. No database.

This model disagrees with that vision if anyone treats it as canon. Those disagreements are left in the model on purpose, and they are not patched into the engine:

- Walker, otter, heron, and crown are separate bodies in the checker. In the game you remain one person.
- The checker has a mayor, a mill, sixteen cuts, and four endings. The game's job is Maeve, the shovel by the stone, and the Vein.
- The checker's envelope (checksum, person/body/life/world) is not `SaveData`. The live blob is versioned localStorage, read by `src/game/save.ts`.
- A pass of `src/run-tests.js` means the checker agrees with its own fixtures. It is not a pass of the game.

`src/adapter.js` may import `src/game/save.ts` and `src/game/rules.ts` to write down what those functions actually returned. It does not replace them and it does not feed `fixtures/cases.json` into the canvas.
