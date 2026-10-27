# DECISIONS

D-001 | L-0001 | Genre is the standing law already in the repo: one person, Marble Vein only, exactly 14 winters, Addison County, no romance, no party, no crafting core. Not re-opened.

D-002 | L-0001 | Engine stays the one in the repo. No new toolchain.

D-003 | L-0001 | Integration branch is `integrate/preincarnation`. This loop does not merge to main and does not push main. James merges.

D-004 | L-0001 | SAVE_VERSION stays 8. `support/grok-29-release/lib/engine.mjs` throws if it is not 8. A missing `lastSkillAward` is filled on load. The save contract emitter copies save.ts alone, so the historical award formula is duplicated there as `awardAlreadyPaid` and must stay equal to `skillAwardForDeath`.

D-005 | L-0001 | Death pays skill only while a non-crown rank is still unbought. Points already in hand count as room used. Twenty deaths cannot mint past 12 ranks. Bottles are not part of this change.

D-006 | L-0001 | The same agent built the skill cap and would have scored it. P1A-3 stays 0 this cycle. Evidence is filed. A later cycle's QA pass may raise it.

D-007 | L-0001 | P2B-2 is not marked N/A. That mark needs James (B-001).

D-008 | L-0002 | Quarry row y=5 in QUARRY_SRC is `xxxxxxxx` at columns 14 through 21. Cells (16,5) and (18,5) are cracked marble. `x` is T.cracked. The decoy coordinates in pull 52 name real tiles.

D-009 | L-0003 | James resolved B-001. v1 platform is one progressive web app. Live-service is none. P2B-2 is N/A and leaves the Pillar 2 mean.

D-010 | L-0003 | #83 landed on main as the skill cap only. The weapon sheet was not in that squash. It is replayed on integrate/marble-tell. This loop still does not merge.

D-011 | L-0003 | The marble tell keeps the lantern gate. A dark quarry still refuses the hammer. Decoy faces at (16,5) and (18,5) stay shut for hammer and bomb. A blade only sparks. The Sentinel holds gold for 0.6s before each lunge, and still does not move at full health.

D-012 | L-0004 | Enemy max HP does not grow with save.cycle. The old term was `1 + cycle * 0.12`. Tropoverse still multiplies once by 1.35 because it is a place, not a stack of deaths. Player ribcage was already free of a cycle term.

D-013 | L-0005 | The install shell is one progressive web app. `public/manifest.webmanifest` is standalone at `/`. `public/sw.js` caches that document, the manifest, the icons, and art it has already fetched. It does not cache `/api`, `/auth`, or the save. The preview host keeps `/__grok/manifest.webmanifest`. The release pack allows this one registration and no other.

D-014 | L-0006 | The theme map lists every live relic plus walk, speak, die, and drink. A missing line fails theme.test.ts. P4-3 is not scored. The creek bench is not in this map.




