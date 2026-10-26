# Preincarnation sound audit

Numbers below were measured from the written 16-bit files by `tests/audit.py`.
They are not estimates typed in by hand.

- Cues: 74
- Files: 123
- Variation sets: 33
- Return cue pulses: 14
- Result: pass

## Calibration

A 1 kHz sine at -20 dBFS peak has a known mean-square. K-weighting at 1 kHz should be about 0 dB.

- Expected ungated loudness before K-weight: -23.701 LU
- Measured K-weight gain at 1 kHz: 0.653 dB
- Measured integrated loudness: -23.05 LUFS (integrated-bs1770)

## Hierarchy (sample peak, dBFS)

| Cue | Peak |
| --- | --- |
| powder_blast | -4.0 |
| hurt_heavy | -6.0 |
| step_grass | -10.0 |
| ui_focus | -18.0 |

## Failures

None.

## Files

| File | Peak dBFS | True peak dBTP | RMS dBFS | LUFS | Mode | Onset ms | Seam |
| --- | --- | --- | --- | --- | --- | --- | --- |
| step_grass_01.wav | -10.0 | -10.0 | -23.12 | -24.99 | ungated-short | 1.5 | 0.0 |
| step_grass_02.wav | -10.0 | -10.0 | -22.9 | -24.51 | ungated-short | 1.47 | 0.0 |
| step_grass_03.wav | -10.0 | -10.0 | -23.37 | -24.78 | ungated-short | 1.56 | 0.0 |
| step_dirt_01.wav | -10.0 | -9.99 | -23.1 | -24.36 | ungated-short | 0.73 | 0.0 |
| step_dirt_02.wav | -10.0 | -9.99 | -23.5 | -24.68 | ungated-short | 0.79 | 0.0 |
| step_dirt_03.wav | -10.0 | -9.99 | -25.65 | -26.77 | ungated-short | 0.7 | 0.0 |
| step_stone_01.wav | -9.0 | -9.0 | -29.06 | -28.52 | ungated-short | 0.18 | 0.0 |
| step_stone_02.wav | -9.0 | -8.73 | -26.56 | -25.96 | ungated-short | 0.18 | 0.0 |
| step_stone_03.wav | -9.0 | -8.68 | -28.11 | -27.46 | ungated-short | 0.18 | 0.0 |
| step_wood_01.wav | -9.0 | -8.97 | -22.66 | -23.7 | ungated-short | 0.34 | 0.0 |
| step_wood_02.wav | -9.0 | -8.99 | -23.55 | -24.57 | ungated-short | 0.36 | 0.0 |
| step_wood_03.wav | -9.0 | -8.99 | -23.89 | -24.89 | ungated-short | 0.36 | 0.0 |
| step_snow_01.wav | -11.0 | -11.0 | -23.58 | -26.55 | ungated-short | 8.14 | 0.0 |
| step_snow_02.wav | -11.0 | -11.0 | -22.53 | -25.39 | ungated-short | 7.89 | 0.0 |
| step_snow_03.wav | -11.0 | -11.0 | -23.2 | -25.8 | ungated-short | 8.89 | 0.0 |
| step_gravel_01.wav | -9.0 | -8.89 | -26.13 | -23.61 | ungated-short | 10.43 | 0.0 |
| step_gravel_02.wav | -9.0 | -8.77 | -26.47 | -23.83 | ungated-short | 31.77 | 0.0 |
| step_gravel_03.wav | -9.0 | -8.92 | -27.16 | -24.45 | ungated-short | 36.96 | 0.0 |
| step_shallow_01.wav | -9.0 | -8.93 | -26.98 | -26.73 | ungated-short | 1.02 | 0.0 |
| step_shallow_02.wav | -9.0 | -9.0 | -25.63 | -25.4 | ungated-short | 1.7 | 0.0 |
| step_shallow_03.wav | -9.0 | -9.0 | -24.13 | -23.36 | ungated-short | 1.27 | 0.0 |
| step_board_01.wav | -9.0 | -9.0 | -22.53 | -23.53 | ungated-short | 0.36 | 11.167 |
| step_board_02.wav | -9.0 | -8.98 | -23.54 | -24.52 | ungated-short | 0.36 | 20.667 |
| step_board_03.wav | -9.0 | -9.0 | -24.18 | -25.14 | ungated-short | 0.39 | 22.8 |
| swim_stroke_01.wav | -9.0 | -8.98 | -22.02 | -21.27 | ungated-short | 0.48 | 0.0 |
| swim_stroke_02.wav | -9.0 | -8.94 | -22.72 | -21.93 | ungated-short | 34.42 | 0.0 |
| swim_stroke_03.wav | -9.0 | -9.0 | -22.04 | -21.12 | ungated-short | 41.22 | 0.0 |
| swim_surface.wav | -8.0 | -7.99 | -28.53 | -25.59 | ungated-short | 0.68 | 0.0 |
| land_soft.wav | -8.0 | -8.0 | -19.34 | -21.94 | ungated-short | 1.86 | 0.0 |
| land_hard.wav | -7.0 | -7.0 | -20.25 | -22.24 | ungated-short | 0.14 | 0.0 |
| soul_step_01.wav | -12.0 | -12.0 | -24.03 | -24.46 | ungated-short | 1.04 | 0.0 |
| soul_step_02.wav | -12.0 | -11.99 | -24.16 | -24.54 | ungated-short | 0.98 | 0.0 |
| soul_step_03.wav | -12.0 | -11.96 | -24.38 | -24.7 | ungated-short | 0.93 | 0.0 |
| blade_swing_01.wav | -7.0 | -6.77 | -19.91 | -17.28 | ungated-short | 14.33 | 0.0 |
| blade_swing_02.wav | -7.0 | -6.67 | -20.82 | -18.32 | ungated-short | 17.55 | 0.0 |
| blade_swing_03.wav | -7.0 | -6.95 | -20.79 | -18.26 | ungated-short | 19.5 | 0.0 |
| blade_flesh_01.wav | -6.0 | -6.0 | -19.79 | -21.03 | ungated-short | 0.82 | 0.0 |
| blade_flesh_02.wav | -6.0 | -6.0 | -19.36 | -20.54 | ungated-short | 0.75 | 0.0 |
| blade_stone_01.wav | -6.0 | -6.0 | -22.44 | -21.79 | ungated-short | 0.09 | 0.0 |
| blade_stone_02.wav | -6.0 | -5.93 | -22.13 | -21.43 | ungated-short | 0.09 | 0.0 |
| blade_wood_01.wav | -6.0 | -6.0 | -20.61 | -21.45 | ungated-short | 0.32 | 0.0 |
| blade_wood_02.wav | -6.0 | -6.0 | -21.09 | -21.92 | ungated-short | 0.34 | 0.0 |
| bow_draw.wav | -10.0 | -10.0 | -20.71 | -20.44 | ungated-short | 0.0 | 10.465 |
| bow_loose_01.wav | -7.0 | -4.21 | -22.19 | -20.08 | ungated-short | 0.02 | 3.293 |
| bow_loose_02.wav | -7.0 | -4.91 | -22.31 | -20.08 | ungated-short | 0.0 | 46.62 |
| arrow_hit_01.wav | -7.0 | -6.9 | -21.96 | -23.03 | ungated-short | 0.45 | 0.0 |
| arrow_hit_02.wav | -7.0 | -6.65 | -20.58 | -21.56 | ungated-short | 0.39 | 0.0 |
| rod_raise.wav | -9.0 | -9.0 | -21.56 | -20.21 | ungated-short | 0.0 | 3.954 |
| rod_block_01.wav | -6.0 | -6.0 | -22.76 | -23.02 | ungated-short | 0.54 | 0.0 |
| rod_block_02.wav | -6.0 | -6.0 | -22.52 | -22.77 | ungated-short | 0.52 | 0.0 |
| fuse_hiss.wav | -12.0 | -12.0 | -37.73 | -34.6 | ungated-short | 140.32 | 0.0 |
| powder_blast.wav | -4.0 | -4.0 | -21.6 | -24.03 | integrated-bs1770 | 0.75 | 2.855 |
| hurt_light_01.wav | -7.0 | -6.97 | -23.21 | -23.85 | ungated-short | 0.77 | 0.0 |
| hurt_light_02.wav | -7.0 | -7.0 | -21.23 | -21.85 | ungated-short | 0.7 | 0.0 |
| hurt_heavy_01.wav | -6.0 | -6.0 | -17.39 | -20.07 | ungated-short | 0.52 | 0.0 |
| hurt_heavy_02.wav | -6.0 | -6.0 | -18.34 | -20.89 | ungated-short | 0.57 | 0.0 |
| death_sting.wav | -6.0 | -6.0 | -19.63 | -20.7 | ungated-short | 0.16 | 16.5 |
| shovel_dig_01.wav | -8.0 | -7.98 | -21.94 | -23.16 | ungated-short | 5.19 | 0.0 |
| shovel_dig_02.wav | -8.0 | -7.98 | -22.28 | -23.46 | ungated-short | 4.99 | 0.0 |
| shovel_dig_03.wav | -8.0 | -8.0 | -21.7 | -22.83 | ungated-short | 5.44 | 0.0 |
| shovel_lift.wav | -10.0 | -9.89 | -26.08 | -24.02 | ungated-short | 0.84 | 0.0 |
| sugar_tap_01.wav | -8.0 | -8.0 | -21.79 | -23.26 | ungated-short | 0.45 | 0.0 |
| sugar_tap_02.wav | -8.0 | -8.0 | -21.44 | -22.85 | ungated-short | 0.43 | 0.0 |
| sugar_drip_01.wav | -12.0 | -12.0 | -27.53 | -25.88 | ungated-short | 0.63 | 0.0 |
| sugar_drip_02.wav | -12.0 | -11.95 | -27.9 | -26.08 | ungated-short | 0.61 | 0.0 |
| sugar_drip_03.wav | -12.0 | -11.89 | -27.8 | -25.8 | ungated-short | 0.57 | 0.0 |
| hammer_strike_01.wav | -7.0 | -6.99 | -22.32 | -23.17 | ungated-short | 0.07 | 0.0 |
| hammer_strike_02.wav | -7.0 | -7.0 | -21.52 | -22.36 | ungated-short | 0.07 | 0.0 |
| hammer_strike_03.wav | -7.0 | -7.0 | -20.82 | -21.64 | ungated-short | 0.07 | 0.0 |
| hammer_nail_01.wav | -8.0 | -7.97 | -24.28 | -21.68 | ungated-short | 0.32 | 0.0 |
| hammer_nail_02.wav | -8.0 | -7.94 | -24.26 | -21.62 | ungated-short | 0.29 | 0.0 |
| net_cast_01.wav | -8.0 | -8.0 | -23.19 | -21.01 | ungated-short | 41.45 | 0.0 |
| net_cast_02.wav | -8.0 | -8.0 | -22.05 | -19.89 | ungated-short | 40.32 | 0.0 |
| net_catch_01.wav | -8.0 | -7.72 | -22.0 | -21.07 | ungated-short | 0.57 | 0.0 |
| net_catch_02.wav | -8.0 | -7.62 | -20.53 | -19.93 | ungated-short | 1.07 | 0.0 |
| lamp_light.wav | -9.0 | -8.82 | -36.09 | -33.47 | ungated-short | 0.23 | 0.0 |
| lamp_hum.wav | -16.0 | -16.0 | -21.66 | -23.13 | integrated-bs1770 | 0.2 | 3.4 |
| warp_away.wav | -7.0 | -6.82 | -14.84 | -12.78 | ungated-short | 39.21 | 0.0 |
| warp_arrive.wav | -7.0 | -6.97 | -14.0 | -13.44 | ungated-short | 9.16 | 0.0 |
| cape_snap_01.wav | -10.0 | -9.7 | -23.82 | -21.81 | ungated-short | 42.15 | 0.0 |
| cape_snap_02.wav | -10.0 | -9.93 | -24.51 | -22.58 | ungated-short | 36.76 | 0.0 |
| cape_snap_03.wav | -10.0 | -9.97 | -25.42 | -23.42 | ungated-short | 53.67 | 0.0 |
| boots_scuff_01.wav | -11.0 | -10.98 | -29.01 | -27.46 | ungated-short | 1.11 | 0.0 |
| boots_scuff_02.wav | -11.0 | -10.69 | -28.88 | -27.25 | ungated-short | 0.82 | 0.0 |
| fins_kick_01.wav | -9.0 | -8.99 | -23.7 | -23.4 | ungated-short | 2.74 | 0.0 |
| fins_kick_02.wav | -9.0 | -8.99 | -23.99 | -24.19 | ungated-short | 2.68 | 0.0 |
| fins_kick_03.wav | -9.0 | -9.0 | -25.58 | -26.01 | ungated-short | 52.97 | 0.0 |
| stone_slide.wav | -9.0 | -8.3 | -24.24 | -24.78 | ungated-short | 26.3 | 0.0 |
| lock_turn.wav | -8.0 | -8.0 | -26.15 | -25.39 | ungated-short | 20.54 | 0.0 |
| puzzle_solve.wav | -10.0 | -10.0 | -20.07 | -20.78 | ungated-short | 21.81 | 0.0 |
| puzzle_fail.wav | -8.0 | -8.0 | -19.85 | -21.76 | ungated-short | 0.5 | 0.0 |
| glass_hum.wav | -12.0 | -12.0 | -26.06 | -26.87 | integrated-bs1770 | 0.61 | 0.0 |
| lever_pull.wav | -8.0 | -8.0 | -24.37 | -25.63 | ungated-short | 0.36 | 34.073 |
| ui_confirm.wav | -14.0 | -14.0 | -21.35 | -21.51 | ungated-short | 8.28 | 0.0 |
| ui_back.wav | -15.0 | -14.99 | -22.37 | -22.74 | ungated-short | 7.96 | 0.0 |
| ui_focus_01.wav | -18.0 | -17.99 | -25.83 | -23.75 | ungated-short | 3.45 | 0.0 |
| ui_focus_02.wav | -18.0 | -17.92 | -25.75 | -23.42 | ungated-short | 3.33 | 0.0 |
| ui_open.wav | -14.0 | -14.0 | -21.39 | -21.9 | ungated-short | 10.82 | 0.0 |
| ui_close.wav | -15.0 | -14.99 | -22.39 | -22.91 | ungated-short | 9.05 | 0.0 |
| ui_error.wav | -10.0 | -10.0 | -18.36 | -19.63 | ungated-short | 14.54 | 0.0 |
| ui_pause.wav | -14.0 | -14.0 | -21.68 | -22.51 | ungated-short | 10.59 | 0.0 |
| ui_inventory.wav | -16.0 | -15.87 | -34.51 | -31.86 | ungated-short | 0.48 | 0.0 |
| damage_tick.wav | -9.0 | -9.0 | -22.16 | -22.75 | ungated-short | 0.25 | 0.0 |
| warn_health_01.wav | -9.0 | -9.0 | -20.68 | -22.27 | ungated-short | 21.93 | 0.0 |
| warn_health_02.wav | -9.0 | -9.0 | -20.58 | -22.27 | ungated-short | 21.95 | 0.0 |
| warn_drown_01.wav | -10.0 | -10.0 | -26.63 | -27.33 | ungated-short | 120.2 | 0.0 |
| warn_drown_02.wav | -10.0 | -10.0 | -25.46 | -26.13 | ungated-short | 17.28 | 0.0 |
| warn_cold_01.wav | -12.0 | -12.0 | -22.85 | -19.99 | ungated-short | 20.93 | 0.0 |
| warn_cold_02.wav | -12.0 | -12.0 | -22.81 | -19.96 | ungated-short | 20.07 | 0.0 |
| boss_stinger.wav | -6.0 | -6.0 | -18.68 | -22.31 | ungated-short | 0.66 | 0.0 |
| boss_telegraph.wav | -7.0 | -6.74 | -23.03 | -20.67 | ungated-short | 216.26 | 0.0 |
| boss_roar.wav | -5.0 | -5.0 | -14.2 | -15.73 | integrated-bs1770 | 43.36 | 0.0 |
| boss_hit.wav | -5.0 | -5.0 | -20.32 | -23.57 | ungated-short | 0.57 | 0.0 |
| boss_fall.wav | -6.0 | -6.0 | -16.59 | -18.68 | integrated-bs1770 | 0.25 | 6.837 |
| death_cross.wav | -8.0 | -8.0 | -20.8 | -23.05 | integrated-bs1770 | 0.73 | 2.2 |
| afterlife_arrive.wav | -10.0 | -9.98 | -19.81 | -18.8 | integrated-bs1770 | 84.6 | 0.0 |
| return_years.wav | -8.0 | -8.0 | -19.89 | -21.12 | integrated-bs1770 | 41.29 | 0.0 |
| amb_town.wav | -12.71 | -12.71 | -27.66 | -26.0 | integrated-bs1770 | 0.0 | 0.491 |
| amb_forest.wav | -12.84 | -12.77 | -28.29 | -26.0 | integrated-bs1770 | 0.34 | 0.508 |
| amb_water.wav | -11.19 | -11.19 | -27.18 | -26.0 | integrated-bs1770 | 2.06 | 0.448 |
| amb_quarry.wav | -13.02 | -13.01 | -28.04 | -26.0 | integrated-bs1770 | 0.0 | 1.552 |
| amb_interior.wav | -9.18 | -9.18 | -28.33 | -28.0 | integrated-bs1770 | 4.74 | 2.812 |
| amb_afterlife.wav | -15.49 | -15.49 | -29.59 | -28.0 | integrated-bs1770 | 0.0 | 4.733 |

## Method

Peak, RMS, and estimated true peak are measured from the written 16-bit files. LUFS uses ITU-R BS.1770 K-weighting (pre-filter + RLB highpass) with absolute and relative gating when the file is at least one second. Shorter cues are reported as ungated K-weighted loudness because a 400 ms gate does not fit.

Loop seam ratio is the jump from the last sample back to the first, divided by the median absolute sample-to-sample difference. A seamless join sits near 1.
