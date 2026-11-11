# DEFECTS

No Sev 1–4 opened this cycle.

D-0000 | note | The support save-contract test failed once this cycle because save.ts imported rules.ts, which the emitter does not copy. Fixed before the cycle closed by inlining `awardAlreadyPaid`. Not left open. Evidence: ops/EVIDENCE/L-0001-test-game.txt (219 pass after the fix).
