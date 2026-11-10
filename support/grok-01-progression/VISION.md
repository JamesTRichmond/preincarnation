# Not the runtime plot

This folder is a design-time checker. Nothing here is imported by `src/game`.

The shipped game stays what [README.md](../../README.md) says: one person, death as a chapter, the Marble Vein as the only plot, Canvas 2D at 320×240, saves in localStorage.

This model disagrees with that vision if anyone treats it as canon. Those disagreements are left in the model on purpose, and they are not patched into the engine:

- Four endings, a mayor and a clerk, and a twelve-place tool graph. The game's job is Maeve, the shovel by the stone, and the Vein.
- Forms are separate bodies in the checker. In the game you remain one person; a skin is not a second character.
- The checker does not know localStorage, the 320×240 canvas, or WASD.

Run `python3 support/grok-01-progression/progression_checker.py prove` from the repo root. Do not wire `progression.json` into the save or the map.
