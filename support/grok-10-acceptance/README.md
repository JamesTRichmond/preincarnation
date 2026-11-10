# PREINCARNATION acceptance

Executable checks for the build that is actually in this workspace. A missing client is a failure of availability and a block of every play scenario. It is not a pass.

```sh
node --test support/grok-10-acceptance/test/harness.test.mjs
node support/grok-10-acceptance/run-acceptance.mjs
sh support/grok-10-acceptance/launch-probe.sh
```

`run-acceptance.mjs` probes `http://127.0.0.1:8080/` unless `--base-url` is set. It does not start the shared dev server and does not modify the game.

Exit `0` only when every scenario passes. Exit `1` when any scenario fails. Exit `2` when nothing failed but at least one scenario is blocked or not implemented.

Reports land in `reports/`. Start with `reports/verdict.md`. Probe artifacts land in `evidence/`. Chromium viewports, when a client exists, are emulation only and are labeled as such. They are not physical-phone results.

See [INTEGRATION.md](INTEGRATION.md) for the test seam.
