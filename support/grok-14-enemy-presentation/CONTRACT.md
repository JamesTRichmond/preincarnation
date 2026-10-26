# Presentation contract (grok-14)

No renderer contract was mounted with the project. This file is the contract the
field book actually implements. It is not a combat specification.

## Sheets

- Locomotion atlas `{id}-loco.png` is 4×4. Rows are south, west, east, north.
  Columns are a four-frame walk. Idle is not this sheet.
- Action atlas `{id}-act.png` is 2×3, one facing only.
  Order: idle, anticipate, attack, recover, hurt, defeat.
- The Sentinel's action sheet faces east. West is a horizontal mirror.
  North and south dashes are not on the sheet.
- Every other strike in this batch faces south only.

## Timing

Damage is false except `timing.attack`. Anticipation holds, it does not tick
damage, and it does not spawn impact, splash, or stone-break.

The Sentinel's anticipation hold is 980 ms so the slit, the wedge, and the
gravel arrow can be read with the sound off. The gold collar is a luminance
extra. Grayscale must still show the other three.

## Anchors

Normalized to the action cell: `feet`, `origin`, `muzzle`, `status`, `shadow`.
Hurt boxes are the opaque silhouette inset slightly. The hit box is the pixels
the attack adds beyond idle, or a front estimate tagged `estimated-front`.
Neither box is approved combat data.

## Effects

Impact, dust, splash, stone-break, shadow, four projectile rows, six status
shapes, and four ground marks live in `www/vfx`. Projectiles are not played on
these sixteen attacks. No definition said they shoot. Ground marks are tells.
Status marks are samples, not wired statuses.

## Reduced motion

Hold the anticipation pose. Do not loop dust, sparks, or break effects.

## Honesty

Twelve ordinary creatures and four bosses are drawn. If the canon is forty and
sixteen, twenty-eight ordinary enemies and twelve bosses are unstarted and
unnamed. A shared effect sheet does not complete them.
