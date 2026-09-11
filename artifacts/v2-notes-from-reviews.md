# PREINCARNATION — v2 notes (from sibling-game reviews)

Status: notes only. Not built. The ditch / house-exit trap is a **v1 hotfix**, not a v2 idea.

Source mix: Tunic, Death’s Door, Eastward, Blossom Tales, Oceanhorn, A Link Between Worlds, Hades, Loop Hero, Hyper Light Drifter. Pulled 2024–2026 lists plus older reviews that still name the same failure modes.

---

## Hotfix before v2 — the ditch in the attached shot

You walked out the house whose stoop is the black path north of the body. The warp dropped you onto the brown east–west band (rail / furrow / road). If that strip is solid, or a ledge you cannot step off, the body freezes.

v1 fix when the App Builder session is open:

- Door exit must land on grass one tile south of the stoop, never on the band.
- If the player is already inside a solid tile on load, nudge them to the nearest walkable tile (do not leave them in collision).
- Soft escape: hold a direction 0.4s against a wall → slide to nearest open tile. ALttP does a version of this so a bad spawn is not a softlock.

Until that ships: Homestead glass if you have it, or start that life again.

---

## What reviewers punish in games that look like ours

These are the lines that would get aimed at PREINCARNATION if we shipped a pretty SNES coat and nothing under it.

1. **Clone with no second sentence.** Blossom Tales and Oceanhorn reviews keep saying the same thing: ALttP wallpaper is not an identity. “Perhaps too much.” “The names have been changed.” Vermont + reincarnation + the Strange Device are the second sentence. v2 should make those louder than the HUD hearts.

2. **Death that erases the afternoon.** Hades is the review that matters for a reincarnation game. Praise is not “you die a lot.” Praise is: every death advances a person, a rumor, or a room. Limbo already exists. v2 should make the last town remember the last body — a line, a grave good, a closed shutter — so a cycle is a chapter, not a wipe.

3. **Dungeon quality falls off a cliff after the first one.** Blossom Tales: first dungeon good, the rest “never lives up to that.” One great quarry / cave is not a game. Each later interior needs a new verb (flippers, lamp, hammer), not a longer hallway of the same crow.

4. **Items that only open the next locked door.** Oceanhorn / weak Zelda-likes: tools are keys with extra pixels. ALttP and ALBW get praised when the hookshot is also combat, puzzle, and traversal. Our Y-relics should each have a second use on the county, not just the room they were found for.

5. **Getting lost with no breadcrumb.** Tunic is loved and hated for the same opacity. Digital Trends: two hours of wandering because the next verb was never named. Death’s Door is the counter-example: every detour still loops you back to a door you already own. v2: one persistent objective line that updates when a relic changes what the land allows. Not a quest marker on every sheep.

6. **Combat that is only “stand and slash.”** Tunic reviews call late combat stale if the sword does not change. Death’s Door / Hades: dodge and spacing matter. We already have spin, dash, bow charge. v2: one enemy that punishes button-mash (the resident / sentinel already lean that way) and one that requires the current Y-tool.

7. **A map that is wide and empty.** Hyper Light Drifter and ALBW praise density: a chest you can see and cannot reach yet. Empty green between houses reads as unfinished, not pastoral. v2: every screen-width of county should hide one thing (bush cache, grave, stoop, seam).

8. **Music loops that wear out.** Blossom Tales user notes: good tune, too short, heard too often. The Strange Device is already the answer — let the player’s library replace the county drone on demand. v2: per-town sting, and a quiet bed under dialogue so talk does not fight the track.

---

## What reviewers reward — steal these, do not steal the coat

| From | Keep for v2 |
| --- | --- |
| A Link Between Worlds | Rent / find tools early; dungeons in an order you choose. We already scatter relics. Let the quarry open before the capitol if the player is stubborn. |
| Death’s Door | Shortcuts that fold a region back to a door you lit. One “return stone” or lamp-post per town. |
| Hades | NPC memory across deaths. The farmer, the mill, the Heart of the Spectrum should change line 2 after cycle 2. |
| Tunic (the good half) | A physical artifact that teaches the world (our Strange Device / a found map page), not a pop-up tutorial. |
| Eastward | Towns with a meal, a rumor, and a person who is not a quest kiosk. Creemee stand is the seed. |
| Outer Wilds / Majora (via Polygon) | Knowledge that survives a loop. The Soloverse already does four rooms. v2: a fact you can only learn in Fiction and spend in History. |

---

## Explicitly do not do

- Do not add a 60-second Minit timer unless we want a side mode.
- Do not hide the entire verb list behind an unreadable manual. Tunic’s worst reviews are that.
- Do not grow the map before the house door is safe. Wide-and-stuck is worse than small-and-walkable.
- Do not voice-act a contrived father-quest (Oceanhorn’s own review called the story unconvincing). Keep the county dry.

---

## Suggested v2 slice (when the App Builder session is the one that can ship)

1. House-exit / solid-tile unstick (should have been v1).
2. Cycle memory: three NPCs change after a death.
3. One dungeon that requires two relics in combination (lamp + hammer, or flippers + hookshot).
4. Objective line that names the *next verb*, not the next GPS pin.
5. Strange Device phase 2 (Spotify paste / extra bay) only after 1–4. Music is already the thing they said was cool.

Playthrough of the full campaign was **not** done in this chat. The live preview does not live on this machine. Next play-pass belongs in the App Builder thread that hosts the canvas.
