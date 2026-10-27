# Vein Score — PREINCARNATION

Synthesis mixes for an original pixel-art adventure in Addison County. Ellis returns fourteen years after death. The Marble Vein stores unrealized lives. The Voice and the Other Voice are two readings of one mythology.

This folder is the score session. It does not contain sound effects.

## What is playable

Twelve cues, plus two utility cues the controller needs:

`title`, `middlebury`, `open-county`, `high-woods`, `water`, `quarry`, `ordinary-dungeon`, `danger`, `boss`, `afterlife`, `reincarnation`, `ending`, and `menu-veil`, `death-sting`.

The audition desk is a separate page at `/score`. The 320×240 walk stays at `/`. This desk does not write the save, and it does not replace the field sound.

- `public/score/` — 160 kbps MP3 encodes the desk plays, plus `manifest.json` and `validation.json`. Same render as the measured mixes, lossy, not a second arrangement.
- `midi/` — SMF type 1, one track per layer. General MIDI program numbers are labels only.
- `sources/compose.py` — the instrument and the score. Edit and rerun to regenerate.

The canonical 44.1 kHz WAVs are not in this repository. They are about 659 MB of the same renders. The measurements in `VALIDATION.md` were taken from those WAVs before this commit.

## What these mixes are not

They are not professionally mastered. They are not a human listening test. Gain was set in the renderer to about −18 dBFS RMS with a −1.5 dBFS peak ceiling, plus a short synthetic room. `VALIDATION.md` is measurement (peak, RMS, DC, loop join, crossfade joins, motif-frequency checks), plus waveform inspection. If a person has not listened, this file will not pretend otherwise.

## Motifs

See `MOTIF-MAP.md`. Three families: Ellis, Vein, Voice/Other.

## Controller

`controller/adaptive-music.ts` is isolated. Read `ENGINE.md` for why it does not import a game engine (there isn't one in this workspace) and for the call surface: transitions, intensity, menu, death, mute, suspend, resume.

## Audition

Open `/score`. The county walk is still the canvas at `/`. Pick a place, move intensity, walk the twelve cues, open the menu, fire the death sting, mute, suspend. Layer solos are for checking stems. Nothing on this page is stored in `localStorage`.
