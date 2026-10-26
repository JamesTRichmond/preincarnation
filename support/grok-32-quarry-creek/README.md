# Quarry & Creek

Shared combat rules for PREINCARNATION. Ellis is one body. There is no party.

This folder is a rules proof. It is not the game. The playable game stays the 320×240 Vermont chapter: one person, death as a chapter, the Marble Vein as the only plot, saves in localStorage. These resolvers do not open that vein, move the wanderer, or write a save.

`rules.js` is the module. It holds all twenty-four abilities and the resolvers the cut is allowed to call.

| | Quarry | Creek |
| --- | --- | --- |
| Capstones | Verdict of Stone, Cairnfall | River Between Heartbeats, Spring Thaw |
| Live in the arena | Split the Fault, Walking Quarry, Verdict of Stone, Cairnfall | Borrowed Current, Return Flood, River Between Heartbeats, Undertow |
| Authored only | the other eight | the other eight |

`implemented: true` means `session.js` simulates it. Authored entries are complete — costs, hooks, timings, tells, limits, access, bosses — and `session.js` does not call them.

`mount.js` draws that simulation on its own canvas. Nothing in `src/routes` mounts it, because a second full-screen arena would replace the SNES coat.

No combat ability opens the seam door or satisfies `seam_chisel`. Protected stone stops fissures, floods, shoves, motes, and cairns. I-frames do not refresh. Fault damage stops at three targets and 62 total. Death and loadout reset clear verdict, tape, cairn, fissure, borrow, and flow. The door state is left alone.

Proofs: `node --test support/grok-32-quarry-creek/*.test.js`
