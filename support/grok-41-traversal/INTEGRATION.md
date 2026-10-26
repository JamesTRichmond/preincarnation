# Traversal challenges — not part of the campaign

This folder is a side-view time-trial study. It is **not mounted**.
`src/routes/index.tsx` still renders `GameApp`. Nothing here is imported by
`src/game`.

## Vision conflict — do not solve it by changing the game

PREINCARNATION is a SNES-style Vermont reincarnation RPG. Canvas 2D at
320×240. One person. Death is a chapter. The Marble Vein is the only plot.
Saves stay in `localStorage` under `preincarnation.save.v1`. There are no
accounts and no database rows for the player.

This study is a different machine: side-view courses (sugar-line, gap boots,
creek fins, shadow cape, block rod, veil step), a course list, and medal
clocks. Mounting `Playground` on `/`, or turning the courses into chapters,
would replace that vision with a second game. This pull request does not do
that. Medals and field notes cannot gate the Marble Vein —
`rewardsGateCampaign()` is `false`. Boards use a different key,
`preincarnation.traversal.v1`, and never write the campaign save.

The notes below describe the study if it is run on its own. They are not
instructions to wire it into Middlebury.

## Own-module behavior

The yard is single-player. It does not import auth, the database, or
multiplayer. Assist and standard boards are separate. A field note is a
sentence, not a story flag.

## Replay v1

`replay.ts` records one live frame at a time: position, velocity, the held input, and flags (grounded, sugar, water, veil, respawn). Countdown, pause, focus-loss, and device-switch gaps are not frames. Time is `liveFrames * (1/60)`.

`validateReplay` resimulates those inputs on the course revision. It rejects a course or revision mismatch, a teleport, a position error over 0.8px, a finish that skipped a bell, and an unfinished recording. The stored positions are checked. They are not a shortcut.

## Ghosts

A ghost is `sampleGhost(replay, frame)` or the `{x,y}` list hung on `run.ghost` for the canvas. `tick` does not read it. A ghost cannot open a checkpoint, plant the rod, or change collision. The optional `fakeRod` field exists so tests can prove that.

The yard draws that list as a creek line and a hollow runner. While you wait, the line walks the measured gold. After Start, it is locked to your live frame so a faster run pulls ahead of it. Featured courses use the full gold replay. The other eighteen use the gold trace, sampled every live frame. A personal best can be shown instead. Toggle Ghost off and the drawing stops. The sim is unchanged either way.

## Medals

Gold, silver, and bronze are frame counts from executed zero-death runs (`measured-runs.ts`). Faster than or equal to the count earns that medal. Slower than bronze is a clear with a field note and no medal. Assist never medals.

Veil Steps cannot hesitate on a plate (the meter kills a held-still release), so its silver and bronze are the same route with 90 and 240 idle frames at the stone start. Every other band is the same route with real waypoint hesitations. Traces sample the body about every 10 live frames.

| Course | Line | Gold | Silver | Bronze |
| --- | --- | ---: | ---: | ---: |
| Ribbon Steps | main | 269 | 511 | 931 |
| Switchback Rise | main | 403 | 762 | 1392 |
| Low Cornice | cornice | 260 | 624 | 1254 |
| Fork Drop | gap | 249 | 449 | 799 |
| Pace Gate | gates | 260 | 483 | 913 |
| False Lip | tunnel | 307 | 630 | 1190 |
| Sugar Zip | zip | 154 | 274 | 484 |
| Gap Boots | hop | 238 | 400 | 680 |
| Creek Stones | stones | 319 | 599 | 1089 |
| Cape Fall | glide | 307 | 467 | 747 |
| Rod Shelf | rod | 266 | 386 | 596 |
| Tool Braid | braid | 521 | 755 | 1171 |
| Split Falls | stair | 643 | 1039 | 1739 |
| Over Under | over | 189 | 310 | 520 |
| Three Heights | high | 278 | 438 | 718 |
| Tide Shelf | down | 366 | 501 | 752 |
| Void Lip | glide | 396 | 557 | 837 |
| Confluence | zip | 206 | 327 | 537 |
| Veil Steps | veil | 276 | 365 | 515 |
| Deep Vein | fight | 480 | 727 | 1158 |
| Cape Thread | thread | 246 | 408 | 688 |
| Rod Cascade | rod | 301 | 463 | 743 |
| Full Kit Spiral | stair | 533 | 776 | 1193 |
| Hollow Ribbon | line | 414 | 616 | 966 |

Creek Stones also clears by swimming the tunnel. Full Kit Spiral clears on two lines. The medal clock uses the faster measured line.

## Clock

The run is idle, countdown (3s), live, paused, or finished. Any input during the countdown is a false start: the count returns to 3 and waits for 0.2s of neutral input. The timer stays 0 until GO.

Pause, a hidden window, and a keyboard/touch change freeze the phase. Focus coming back does not resume. Death respawns at the last legal bell, does not finish, and does not write a best. A later bell touched early does not count. The finish counts only after every bell, in order. A teleport invalidates the attempt even if the body later overlaps the bell.

## Tools

A moves left, D moves right. Space or W jumps (and swims up). S drops. E holds the sugar-line, Shift or C opens the cape, R plants the rod, V holds void-step. Assist lengthens coyote time, softens the fall, and stretches the veil meter. It is unranked.
