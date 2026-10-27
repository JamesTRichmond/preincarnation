# License and provenance

PREINCARNATION environment art in this directory is original work produced for the
project. It is dedicated to the public domain under the Creative Commons CC0 1.0
Universal dedication: https://creativecommons.org/publicdomain/zero/1.0/

You can copy, modify, and ship it inside PREINCARNATION without attribution.

## What this is

Hand-authored pixel art, written as source in `source/` and baked to PNG with
Pillow and NumPy. Every opaque texel is one of the colors in `metadata/palette.json`.
Edges of autotiles are a period-16 texture plus a corner mask, so neighboring
tiles continue the same material instead of showing a grid crack.

## What this is not

- No downloaded tiles, sprites, photos, or map extracts.
- No third-party game assets, no palette ripped from a commercial game.
- No emoji, no font-as-art, no placeholder rectangles standing in for missing tiles.
- Generative image models were not used as the tile source. A 16px library whose
  edges must match exactly is a structure problem; those models do not hold a
  shared pixel grid. The method is the pixel source in `source/`, disclosed here
  so nobody mistakes the PNGs for traced or scraped art.
- Place names (Middlebury, Vergennes, Otter Creek, Champlain, Ripton, Lincoln,
  Shoreham, Addison, Leicester, Bristol, Weybridge, Monkton) are real Addison
  County geography used as setting. Building plans, props, and maps in
  `scenes/` are fictional compositions, not surveys.

## Status

Required sets are baked and marked `"status": "finished"` on each record in
`metadata/tiles.json`. Nothing in that list is a stand-in. Limits that are
engine notes, not unfinished art, are in `README.md`.
