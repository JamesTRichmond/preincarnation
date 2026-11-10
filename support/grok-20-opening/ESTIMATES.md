# Time

These figures are **estimates**, except the observed row, which is filled after a real play and says how it was played.

The model times a shortest walk between authored stops: 0.85s a step, 5.2s a spoken line, 3.6s a look or a reading, 7s a rest, 6s a release, plus 45s the first time the thread is struck. It does not include standing still, dying, or getting lost.

A wander factor of 2 is an **assumption** for a first player who is not pathfinding. A rush factor of 0.55 is an **assumption** for someone who already knows the verbs and does not linger. Neither factor was measured on a person.

| Walk | Model | Curious assumption | Rush assumption |
|---|---:|---:|---:|
| Attentive script (listens, wrong tool once, river, returns after the shift) | 11.5 min | 23 min | 6.3 min |
| Direct script (no speech, no wrong tool) | 4.6 min | 9.2 min | 2.5 min |

The opening is the first session of a sixteen-dungeon county, not a claim that every player's clock hits sixty minutes. A curious scripted walk models under half an hour. Someone who dies, re-reads, and refuses the vein will take longer. Someone who already knows the verbs can be done much sooner, and the county does not slow them down to teach.

## Observed

Played once, on the live client, after the scene pack was running at `http://127.0.0.1:8080`.

Method: Playwright drove Chromium. It clicked Walk, then held direction keys and let the client's own step (0.18s) move Ellis. Verbs and Continue were clicks on the on-screen buttons, not a reducer-only shortcut. The route was the attentive script: listen, strike the marble face once with the hammer before the thread, rest by the river, die at the pinch, release, and walk the altered county out to the east end of the lane. It paused 420ms after each verb, 680ms on each spoken line, and 1.2s while remaining on the shore. Those pauses are the play, not the model in the table above.

Wall clock from Walk to the east end of Middlebury lane: **1.9 minutes** (112 seconds). At the end every lesson in this opening was understood, including the hammer rule at the vein and recognition of the altered county. A separate check in the same client, before that walk, confirmed KeyA decreased x, KeyD increased x, and KeyW decreased y.

This is one brisk scripted pass through the running game. It is not a measurement of a person reading slowly, dying more than once, or refusing the vein. The table above stays an estimate.
