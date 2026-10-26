# Character animation pack

Reference sheets for Ellis Perch's four bodies, twelve ordinary villagers, and twenty-four portraits. Cells are 96×96, transparent PNG, feet at (48, 86). Four-row clips run down, left, right, up — the same order as `Dir` in the engine.

This pack does **not** replace `public/game/*-walk/snes.png`. Those sheets are 64×64 (16×16 cells) and are what the 320×240 world draws. A 96px cell blitted at native size would be six tiles tall. Nearest-neighbor crush to 16px was not applied; it would throw away the drawings without matching the SNES sprites already in the game.

`src/game/character-anim.ts` compares the proposed hit frames to the live attack locks. Blade damage stays where it is: `fireSlash` hits immediately, then `startCombo` holds `attackT` for 0.10s on a basic slash. See `TIMING.md`.

Open `preview/index.html` against this folder to play the clips. The preview is not a route in the game.

## What was inspected

When the sheets were drawn, the sandbox had no game sprites, tool file, or damage window. Nothing was overwritten.

On `main` of this repo, before this branch:

- `public/game/wanderer-walk/snes.png`, `smuggler-walk`, `officer-walk`, and `embryo-walk` are 64×64.
- `public/game/wanderer-attack/snes.png` is also 64×64 and is not loaded. `engine.ts` draws column 2 of the walk sheet while `attackT > 0`.
- Villagers are `paintNpc16`, not sheets.
- Attack locks: slash 0.10s, spin 0.18s, bow 0.16s, hook 0.20s, hammer 0.20s, empty dig 0.20s, dig 0.25s, net 0.16s.

## Not finished

- The blade-arc sheet still contains a hand. It is not an engine layer.
- Nine of the twelve villagers have a body and a stride pose, not a four-direction walk. Child, farmer, and elder do.
- `spin` is four lunge frames taken from charge, not an in-place orbit.
- Tool columns are lantern, two-hand, pole, pocket. The game's off-hand relics are a longer list. Only the lantern name overlaps. Grips were not wired.
- Raw generation JPEGs were left out of the branch (about 22MB of intermediates). `sources/*.py` is the processor.
