# PREINCARNATION Natural Materials Pack

**IDs:** loot.expansion.nature.001–080  
**Ownership:** support/grok-71-natural-materials/ only

Eighty distinct useful materials from reeds, orchard growth, stone, woodland, water edges, and Vein-touched environments. Vermont natural history where verified; fictional only for Vein items.

## Improvements in this version

- Specific identification, leave notes, and notThis guidance on every material
- Concrete dual (or more) destinations: lamp, fiber, restoration, field, display, bait
- Combinable lamp effects with visual feedback in the workshop
- Era slider (thaw/green/mast/iron) that frames availability
- Project meters for bank, orchard, and stone restoration
- Fair-take visit caps enforced in bindings
- Automated validation: 80 unique materials, ≥2 destinations, essential roles covered by common materials, no cycles
- Provenance with verified taxa/geology and clear fictional labels
- No hunger, no factory economy, no random essential gates

## Files

- `materials/` — 80 material definitions split by community
- `define.ts` — types and helpers
- `bindings.ts` — gather / use / lightLamp handlers (immutable)
- `economy.ts` — cycle detection
- `validate.ts` — pack validation
- `FieldWorkshop.tsx` — interactive bench, catalog, and audit
- `provenance.ts` — claims and sites
- `pack.test.ts` — tests

## Essential roles (all have common providers)

- lamp.wick (cattail floss, rush pith)
- field.tinder (hemlock needle, cedar shaving, paper birch bark)
- fiber.net (sedge, bulrush, sweetflag)
- bank.stake (maple deadfall, pine branch, birch)
- mend.lime (Waits River limestone, clay)
- lamp.wind (mica sheet, birch bark, pine pitch)

Validation: PASS on the included pack.test.ts.
