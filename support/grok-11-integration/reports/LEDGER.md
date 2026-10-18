# PREINCARNATION integration ledger (grok-11)

Base: `c737e42` on `JamesTRichmond/preincarnation`, branch `integration/grok-11`.
The briefed 12-district campaign is **not** runnable. The engine that is actually in the repo is.

## Journeys

- **new-game-town-dungeon-reward-save** — passed
  - defaultSave → middlebury
  - buildMap middlebury → to-quarry + shovel
  - buildMap quarry → sentinel + chest-quarry + q-key
  - sentinelFate release removes the sentinel prop
  - writeSave/loadSave keeps cape and townsCleared
  - Reward persistence is the save flag plus the cape relic the engine grants in choose(). The chest's spare-heart roll stays inside the canvas loop and was not simulated as a second reward.
- **death-fourteen-year-return-changed-npc** — passed
  - resolveDeath +14 winters
  - grantBondKeepsake lantern
  - selectNpcDialogue elder → elder_return
  - NPC_NODE.elder is still the static id elder_1. The live contract is selectNpcDialogue, which the engine calls first. The static table was not rewritten.
- **tool-acquisition-newly-reachable-route** — passed
  - q-key + q-lock-a → lock prop removed, tile becomes marble
  - Gap boots remove their pickup and shorten the dash timer. They do not add a warp. That mismatch is logged; the key/lock route is the one this journey executed.
- **boss-completion-persistent-reward** — passed
  - sentinelFate crown → no sentinel prop
  - writeSave/loadSave cape + townsCleared
  - The cape grant itself runs in engine choose() when the fate flag is applied. This journey checked that consequence against the map and the save, not a second combat simulator.
- **ending-credits-post-completion-load** — passed
  - spectrum fate arms credits
  - heart_release close enters ending mode
  - finishCredits calls birthIntoWorld
  - writeSave/loadSave keeps spectrumFate
  - One credits sequence existed in ENDING_LINES and the ending overlay, but nothing set mode to ending. The adapter arms it from the Heart fate already in dialogue. Four campaign endings were not in the content and were not added. OBJECTIVES.ending remains 'There is no ending. Walk.'
- **expanded-campaign-pack** — blocked
  - (no transition executed)
  - Present Addison-pinned places: middlebury, vergennes, bristol, ferrisburgh, salisbury, addison, quarry, soloverse. Places outside Addison: rutland, montpelier, whiteriver, burlington, shelburne, essex, winooski, woodstock, springfieldvt, norwich, chittenden, windsor. Dungeon-like maps found: quarry, int_cave, soloverse. No 12-district, 16-dungeon, 6-era, or 4-ending pack was in the repo or the workspace. None were synthesized.

## Conflicts

- **county-scope** (world-scope, unresolved-kept): The brief says the campaign takes place only in Addison County. geography.ts also pins Rutland (rutland), Montpelier (washington), White River Junction (windsor), Burlington (chittenden), Shelburne (chittenden), Essex (chittenden), Winooski (chittenden), Woodstock (windsor), Springfield (windsor), Norwich (windsor), Chittenden County (chittenden), Windsor County (windsor). Those maps stay. They were not deleted to satisfy the brief.
- **npc-node-vs-cycle** (event-contract, adapter): NPC_NODE.elder is elder_1. The engine previously special-cased cycle and fate beside that table. selectNpcDialogue is now the function both the engine and the journey test call. NPC_NODE is unchanged and remains the fallback for NPCs without a cycle line.
- **ending-mode-unarmed** (event-contract, adapter): ENDING_LINES and the ending overlay existed, and sim() already advanced ending beats, but nothing assigned mode = 'ending'. creditsOnClose arms that mode from the existing Heart fate (heart_release / heart_bind). No fourth ending was written. OBJECTIVES.ending is still 'There is no ending. Walk.'
- **boots-are-not-a-route** (inventory-name, logged): Gap boots are a dash timer (engine) and a pickup on the Middlebury map. Acquiring them does not add a warp. The quarry key opens q-lock-a; that is the tool→route transition that was executed.
- **tanstack-floor** (dependency, kept-workspace-pin): Upstream package-lock resolved @tanstack/react-start 1.168.50, below the 1.168.60 security floor. This candidate keeps the workspace pin ^1.168.60 and does not restore the older lock.
- **missing-expanded-packs** (missing-dependency, blocked): GitHub JamesTRichmond/preincarnation has one branch (main) and one commit (c737e42). No progression, save-fixture, dungeon, world-map, narrative, combat, or QA pack from another session was found. The brief's 12 districts, 16 dungeons, 6 eras, and 4 endings are not in the tree. They were not invented.
- **project-mount-artifacts** (provenance, refused): The project mount artifacts/ contains Stay clicklist/ledger HTML and three unrelated generated images. They do not match the git artifacts (education notes, strange-device, sprite refs). They were not adapted into game ids and were not staged.
- **grave-coordinates** (coordinates, compatible): Graves store pixel x/y. County map placement divides by 16, which equals TILE in snes.ts. No second unit was found.
- **save-flags** (save-flag, compatible): Save version is 8 under localStorage key preincarnation.save.v1. Journey round-trips used writeSave/loadSave. No second save schema was present to reconcile.

## Not invented

- 12 districts
- 16 dungeons
- 6 principal eras
- 4 endings
- progression pack
- save-fixture pack
- dungeon pack
- world-map pack
- narrative pack
- combat pack
- external QA pack

## Live play (dev server, not a substitute for the missing packs)

- Title screen rendered. New game named Ellis Perch, bond Maeve, woke in Middlebury at tile (18, 10).
- Held A: x 296 → 293 (left). Held D: x 293 → 339 (right).
- Loaded the Marble Vein (`quarry`).
- Debug `kill()` entered limbo: year 2043 (2026 plus a 14–18 winter roll), host god, `returnedFromDeath` true, ledger "Oil lamp stays with you."
- Production build smoke matched the dev title screen (no console errors, no baseline divergence).

This is the engine that exists. It is not a 12-district, 16-dungeon, 4-ending campaign.
