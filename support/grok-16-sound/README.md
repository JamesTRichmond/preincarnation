# Preincarnation sound

The cues the game plays are published at `public/sound/`. The mixer the field imports is `src/game/sound/`, kept identical to `public/sound-desk/mixer/`. This folder is the synthesis source. Rendered wavs are not copied here again.

Isolated cue library and mixer for the Addison County game. The score is not included.

## What is here

- `audio/` — rendered cues and six seamless place loops
- `synth/generate.py` — the editable source. Change a recipe and rerender.
- `manifest/cues.json` — cue-to-event map, overlap, priority, measured loudness, timing, and the visual that must accompany a warning
- `mixer/mixer.js` — music, ambience, effects, and interface buses
- `index.html` — the audition desk
- `REPORT.md` — measured results, written by the audit

## Mixer

```javascript
import { createSoundDesk } from "./mixer/mixer.js";

const desk = createSoundDesk({ baseUrl: new URL("./", import.meta.url) });
// Call unlock() synchronously inside the first pointer or key handler.
desk.unlock();
await desk.load();
desk.play("step_stone", { pan: -0.2 });
desk.setAmbience("amb_forest");
desk.setBusVolume("effects", 0.8);
desk.setMuted(true);
```

Mute and suspend change gain or the audio clock only. They do not write health, position, inventory, or quests. Warning cues still emit `{ kind, copy }` when the desk is muted, suspended, or not yet unlocked, so the picture can carry the message.

Buses are separate. Overlap groups stop footsteps, UI ticks, and similar repeats from stacking. A full effects pool steals the oldest lower-priority voice and will not steal a warning or a death cue to make room for a footstep.

`setAmbience` crossfades. Asking for the place that is already playing does not start a second copy.

## Audition desk

`index.html` plays the library through the mixer. Scenes run a short, timed set of the real cues in the place they belong. Pace retriggers the selected cue on a walk interval, alternating left and right, so the overlap rule is audible. Take buttons force a variant. Play as the game lets the mixer choose. Warning cues still paint their picture when the desk is muted.


## Places

`amb_town`, `amb_forest`, `amb_water`, `amb_quarry`, `amb_interior`, `amb_afterlife`.

## Warnings that also have a picture

| Cue | Picture |
| --- | --- |
| ui_error | Banner: "That won't take." |
| warn_health | Vignette: "You are badly hurt." |
| warn_drown | Breath mark: "You need air." |
| warn_cold | Frost edge: "The cold is in you." |
| boss_telegraph | Ground ring: "It is about to strike." Play about 450 ms before the hit. |
| boss_roar | Shake: "The ground answers." |
| powder_blast | Flash: "The keg goes up." |
| death_sting | Iris: "The light leaves." |
| death_cross | Iris: "Fourteen years will pass." |
| return_years | Line: "Fourteen years later." The file contains fourteen pulses. Land the world on the last one. |
