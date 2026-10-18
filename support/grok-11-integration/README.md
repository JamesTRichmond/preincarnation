# grok-11 integration

Tools and the conflict ledger for the PREINCARNATION candidate. The engine is
`JamesTRichmond/preincarnation` at `c737e42` (the only branch and the only commit
on that remote when this pass ran). No other session left a pack on disk, on a
branch, or in the project mount.

`journeys.test.ts` drives the real save, map, death, dialogue, and credits
contracts. It does not fabricate districts or dungeons. Reports land in
`reports/` when that test runs.

The project mount's `artifacts/` does not match the git tree (unrelated Stay
HTML and images). Those files were not imported and were not deleted in git.
