# Results

Command:

```
node --experimental-strip-types --test support/grok-19-input/test/input.test.ts
```

Run on 2026-10-18, Node's built-in test runner, no browser and no physical device:

```
# tests 54
# suites 9
# pass 54
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 224.962233


```

Suites: keyboard movement (7), blade tap versus spin (7), shrine release protection (5), focus / cancel / off-hand (7), touch and gamepad (10), prompts / menu / device changes (4), rebinding / recovery / persistence (8), touch layout (4), arena signs and simulation bridge (2).

Gamepad cases use synthetic `PadSnap` objects. Touch cases use synthetic pointer ids. See `DEVICE_MATRIX.md` for what that does not prove.
