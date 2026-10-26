# Ferry Hearth — integration guide

This folder is a musical sitting for the Addison County adventure. It does **not** replace the main score, the Marble Vein, or the canvas. It opens its own `AudioContext`, and it only writes local storage keys that start with `preincarnation.tavern-music.v1`. The county save stays `preincarnation.save.v1`.

## Mount

The inn interior (`int_inn`) has one hearth prop. Standing on it and pressing E (or the on-screen talk control) sets the game mode to `hearth`, ducks the drone, and mounts `TavernMusicActivity`. Escape, P, or **Stand up** returns to the room. WASD is ignored while you are sitting because the world simulation is paused.

```tsx
<TavernMusicActivity
  onFocus={() => game.duckScore(true)}
  onRelease={() => game.duckScore(false)}
  onStand={() => game.closeHearth()}
/>
```

Do not route tavern notes through the score's bus.

## What the player can do

- Three identities: **The Bow** (fiddle), **The Chair** (guitar), **The Pocket** (spoons). Keys `F J K L` and `1 2 3 4`. Space is Hold. Touch uses the same four pads.
- Twelve original pieces in `pieces.ts`. The live sound is the synth in `engine.ts`. `pieceToMidi` and `renderNotes` can write MIDI and a reference WAV; those files are not checked in.
- **Tonight's sitting** plays three pieces in order: Otter Creek Welcome (practice), The Hearth Answers (duet with Mira), Three Chairs (duet with June). The book holds all twelve, each playable as practice or as an answer to that tune's NPC.
- **Lay a tune** is free play plus an eight-slot loop. Kept tunes are in the save file and can be replayed.
- Relaxed and tighter-ear variants. A custom breath width (60–360 ms) overrides both. Missing a breath records "passed" and the tune continues. There is no fail state and no flashing punishment.
- **Line up the beat** measures the player's own taps against scheduled knocks and shifts judgment and the on-screen line together. The "Now" word on the line is the visual timing cue for muted play. The browser's `outputLatency` is labeled as an estimate that was not auditioned.

## Save

| Key | Role |
| --- | --- |
| `preincarnation.tavern-music.v1` | Current book and settings |
| `preincarnation.tavern-music.v1.backup` | Previous good write |

Corrupt JSON falls back to the backup, then to an empty book. Version field is `1`. Writes are one blob. A quota error is reported and does not throw into the room.

## Audio behavior worth knowing

- Unlock happens inside the sit-down gesture. `resume()` is called before that function returns.
- Hiding the page suspends the context and pauses miss detection. Coming back resumes it.
- Mute sets the music bus to silence. The clock, the lane, and grading keep running.
- A second hit on the same gesture within 90 ms is ignored (key repeat, or touch plus key). The engine also drops a second voice of the same pitch within 20 ms.
- `devicechange` marks the lineup stale and says so. It does not stop the tune.

## Checks

```sh
node --experimental-strip-types --test src/tavern/tavern.test.ts src/game/hearth.test.ts
```

Do not treat a reference render's peak or RMS as a listening test of the browser synth or as a latency measurement.
