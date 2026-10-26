# Validation

Measured from the exported files on disk. This is not a listening test and not a mastering report.

Gain in the renderer aimed at −18 dBFS RMS with a −1.5 dBFS peak ceiling, then a short synthetic room. If the ceiling won, the cue is quieter than the RMS target on purpose.

Failures: **0**.

## Cues

| Cue | Loop | Duration | WAV peak | WAV RMS | Loop join L/R | Motif checks | MP3 join L/R |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Title | yes | 64.00s | -1.69 dB | -18.0 dB | 0.493 / 0.351 | 6/6 | 0.359 / 0.224 |
| Middlebury | yes | 83.48s | -1.5 dB | -19.05 dB | 0.233 / 0.216 | 6/6 | 0.305 / 0.263 |
| Open county | yes | 96.00s | -2.48 dB | -18.0 dB | 0.345 / 0.288 | 6/6 | 0.226 / 0.161 |
| High woods | yes | 77.84s | -1.5 dB | -18.3 dB | 0.669 / 0.572 | 4/4 | 0.626 / 0.536 |
| Water | yes | 70.59s | -1.82 dB | -18.0 dB | 0.397 / 0.275 | 6/6 | 0.046 / 0.567 |
| Quarry | yes | 71.11s | -1.5 dB | -19.46 dB | 0.255 / 0.23 | 6/6 | 0.288 / 0.26 |
| Ordinary dungeon | yes | 90.00s | -1.5 dB | -19.0 dB | 0.53 / 0.517 | 6/6 | 0.078 / 1.133 |
| Danger | yes | 64.00s | -1.5 dB | -19.38 dB | 0.146 / 0.142 | 6/6 | 0.165 / 0.164 |
| Boss | yes | 67.37s | -2.11 dB | -18.0 dB | 0.181 / 0.14 | 6/6 | 0.215 / 0.164 |
| Afterlife | yes | 87.27s | -1.5 dB | -18.16 dB | 0.255 / 0.174 | 6/6 | 0.26 / 0.159 |
| Reincarnation | yes | 80.00s | -1.87 dB | -18.0 dB | 0.279 / 0.245 | 6/6 | 0.316 / 0.257 |
| Ending | no | 102.78s | -1.5 dB | -20.09 dB | — | 6/6 | — |
| Menu veil | yes | 34.29s | -5.97 dB | -18.0 dB | 0.828 / 0.802 | 0/0 | 0.618 / 0.524 |
| Death sting | no | 13.00s | -1.5 dB | -18.93 dB | — | 6/6 | — |

Loop join is `abs(first − last) / 95th percentile step` per channel. A tone's own sample-to-sample motion sits near 1–3. Ratios above 6 with a boundary step over 0.02 were flagged as clicks.

Loop point for every looping cue is the file edge: start sample 0, end at the duration above. One-shots (ending, death sting) do not loop; their files include the release tail.

## Transitions

Equal-power crossfades were rendered offline from the WAV mixes, using each incoming cue's fade time (capped at 2.5 s). A clip, or a derivative spike more than 12× the sources' own 95th percentile step, is a discontinuity.

| From | To | Peak | Spike × source |
| --- | --- | --- | --- |
| title | middlebury | -5.43 dB | 1.886 |
| middlebury | open-county | -7.21 dB | 5.783 |
| open-county | high-woods | -4.38 dB | 1.926 |
| high-woods | water | -7.34 dB | 2.334 |
| water | quarry | -3.23 dB | 2.13 |
| quarry | ordinary-dungeon | -8.24 dB | 2.749 |
| ordinary-dungeon | danger | -3.28 dB | 2.531 |
| danger | boss | -12.76 dB | 0.836 |
| boss | afterlife | -9.42 dB | 2.089 |
| afterlife | reincarnation | -3.98 dB | 1.903 |
| reincarnation | ending | -5.01 dB | 3.026 |
| ending | title | -9.2 dB | 1.85 |
| open-county | danger | -7.88 dB | 2.333 |
| danger | afterlife | -9.25 dB | 3.584 |
| middlebury | boss | -13.01 dB | 4.331 |
| quarry | water | -9.14 dB | 2.722 |

## Stems

Each layer WAV matches its mix length. Peaks are under −1 dBFS. Layers are the intensity stack: index 0 plays at intensity 0, and higher layers add. They are not alternate mixes.

