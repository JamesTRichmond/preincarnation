# Engine inspection

The county walk already has a field audio module, `src/game/audio.ts`. This score does not import it, and it does not edit it. Open pull request #26 replaces that module with effect cues and says the score stays out of that change. This controller stays on `/score` until a later session binds it from the walk.

- Module: `controller/adaptive-music.ts`
- It imports no game code and does not read game state or `localStorage`.
- A later session can call the methods below from its own transitions. Do not do that in the same change as #26's `audio.ts`.

## Call surface

Construct once. Call `unlock()` synchronously inside the first pointer or key gesture.

- `unlock()` — resume `AudioContext`. Required before any sound on mobile browsers.
- `load(cueId?)` — decode cues. Death sting and menu veil are preloaded on unlock.
- `transitionTo(cueId, fadeSec?, intensity?)` — equal-power crossfade. Incoming cue's manifest fade is the default. Omit intensity and the cue opens at its written level.
- `setIntensity(0 | 1 | 2, fadeSec?)` — vertical layers. 0 is the bed alone.
- `setMenu(open)` — duck the current cue. If the cue's menu mode is `veil`, fade in the menu veil. Title and ending are `duck-only`.
- `interruptDeath()` — fast duck of music and veil, then the death sting. `transitionTo` during the sting fades the sting and starts the next cue (so a death may continue into afterlife).
- `mute(on?)` — master gain. Music keeps its place.
- `suspend()` / `resume()` — user pause. `suspend` ramps the master down and suspends the context; `resume` reverses it. Hiding the tab also suspends the context without counting as a user suspend.
- `setSolo(layerIndex | null)` — audition-only. Not required by gameplay.
- `stop()` — silence music, veil, and sting. Returns to idle. The place is not remembered.
- `clock()` — seconds into the audible cue, on the audio clock. Looping cues wrap at the file edge.
- `level()` — a rough 0–1 loudness of the music bus for a meter. Not a measurement.
- `warm(cueId)` — decode a cue ahead of a transition.

Layers of one cue start on the same audio-clock time. Loop points are the file edges. Canonical WAV loops are sample-constructed to be periodic after reverb; the browser plays the 160 kbps MP3 encode of that WAV. Loop-join measurements for both are in `VALIDATION.md`.
