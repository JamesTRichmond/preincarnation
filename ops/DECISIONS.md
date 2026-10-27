# DECISIONS

D-001 | L-0001 | Genre is the standing law already in the repo: one person, Marble Vein only, exactly 14 winters, Addison County, no romance, no party, no crafting core. Not re-opened.

D-002 | L-0001 | Engine stays the one in the repo. No new toolchain.

D-003 | L-0001 | Integration branch is `integrate/preincarnation`. This loop does not merge to main and does not push main. James merges.

D-004 | L-0001 | SAVE_VERSION stays 8. `support/grok-29-release/lib/engine.mjs` throws if it is not 8. A missing `lastSkillAward` is filled on load. The save contract emitter copies save.ts alone, so the historical award formula is duplicated there as `awardAlreadyPaid` and must stay equal to `skillAwardForDeath`.

D-005 | L-0001 | Death pays skill only while a non-crown rank is still unbought. Points already in hand count as room used. Twenty deaths cannot mint past 12 ranks. Bottles are not part of this change.

D-006 | L-0001 | The same agent built the skill cap and would have scored it. P1A-3 stays 0 this cycle. Evidence is filed. A later cycle's QA pass may raise it.

D-007 | L-0001 | P2B-2 is not marked N/A. That mark needs James (B-001).
