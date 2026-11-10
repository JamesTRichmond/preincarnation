# Input integration

The game loop should read `FrameInput` or `readSimulationCommands`. It must not
inspect keys, touch identifiers, or gamepad indexes, and it must not invent
damage, poise, or shrine rewards inside this module.

```ts
import { readSimulationCommands } from "./consume-intents.ts";

// once per simulation step, after input.tick()
const command = readSimulationCommands(frame);
// command.move.east  -1 | 0 | 1   screen right
// command.move.north -1 | 0 | 1   screen up
// command.intents    blade tap, blade spin start/end, off-hand, interact,
//                    pause, shrine release
```

Apply the host by mounting `InputLab` only for the bench at `/input`. A shipping
scene keeps its own presentation and calls the same engine. Do not patch combat
tables or progression flags to consume these intents.

The canvas on `/` still reads `src/game/input.ts`. That file is the live scheme:
WASD or arrows to walk, Space to slash, E to talk, Q to cycle the off-hand.
This module does not replace it. Its own defaults (J blade, K off-hand, R rite)
exist so the bench can be tested without stealing those keys from a scene that
has not opted in.

Recovery stays outside the binding table: F8 opens settings, a long F8
restores defaults, and Pause cannot be left without a keyboard key.
