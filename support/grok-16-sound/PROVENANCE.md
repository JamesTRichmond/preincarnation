# Provenance

Every cue in this folder was synthesized for Preincarnation. Nothing was sampled from a library, a field recording, a game, or a downloaded file.

- Generator: `synth/generate.py`
- Primitives: `synth/dsp.py` (noise, modes, Karplus-Strong, FM, biquads, combs)
- Sample rate: 44100 Hz
- Format: 16-bit PCM WAV, mono for cues, stereo for place loops
- Master seed: 16014
- Third-party audio: none
- Network fetches during render: none
- License: original synthesis, written for this project

The music bus is intentionally empty. Another session owns the score. Do not add music files here.

Loudness figures in `manifest/cues.json` and `REPORT.md` come from measuring the written files (`synth/measure.py`, checked again by `tests/audit.py`). A 1 kHz calibration tone is generated in memory during the audit so the K-weighting implementation can be checked against the known mean-square of that sine.
