# Timing mismatch (not applied)

Blade damage is applied inside `fireSlash` at the start of the swing. `attackT` only freezes the walk sheet on column 2 and slows movement. This pack does not change those numbers.

Proposed attack hit frame is index 1 (the second drawing).

| Body | Attack fps | Hit starts | Inside the 0.10s slash lock? |
| --- | --- | --- | --- |
| Mortal Wanderer | 10 | 0.100s | No. The lock ends as the pose would start. |
| Otter Creek Smuggler | 14 | 0.071s | The drawing starts during the lock. Damage has already landed at 0.000s. |
| Rutland Officer | 8 | 0.125s | No. |
| Embryonic God | 9 | 0.111s | No. |

Spin sheets are 4 frames at 10 fps (0.40s). `fireSpin` deals one hit immediately and holds `attackT` for 0.18s. The other three drawings are not extra hits.

Do not shorten the locks or delay `fireSlash` to match this table unless that change is its own decision.
