# PROJECT_CONFIG
Cycle opened: L-0001
Tag legend: VERIFIED / REPORTED / UNKNOWN

Game title:                    Preincarnation  [VERIFIED: repo JamesTRichmond/preincarnation]
Version target:                1.0  [REPORTED: manifest]
Genre / core fantasy:          One person. The Marble Vein is the only plot. You wake on the Middlebury Green. Death advances exactly 14 winters and you return as yourself. SNES-coat, Addison County only. No romance, no party, no crafting economy.  [REPORTED: standing law already in the repo and the prior CEO rulings. Not a guess.]
Target platforms:              Web browser, canvas 320×240. Additional platforms are not declared.  [VERIFIED: src/game/snes.ts constants and the live route. B-001 asks James to confirm this is the whole list.]
Engine / toolchain:            React 19 + TanStack Start, Canvas 2D, Vite, Node >= 22.12, localStorage saves.  [VERIFIED: package.json and src/game]
Multiplayer / live-service:    None in the live game. No accounts, no database. P2B-2 is not N/A until James confirms.  [VERIFIED absence. B-001]
Repo:                          https://github.com/JamesTRichmond/preincarnation  [VERIFIED]
Integration branch:            integrate/preincarnation  [decision D-003. main is not pushed by this loop.]
Art style:                     16px SNES coat. Photographs do not ship.  [REPORTED: ruling #65]
Budget / spend authority:      $0. Any spend is a blocker.  [manifest default]
Hardware for measurement:      None in this runtime. Input-to-pixel hardware latency is UNKNOWN.  [UNKNOWN]
Notification channel:          GitHub issue labeled human-blocker. Native push is not wired. Gmail was not used this cycle.  [REPORTED]
Hard deadlines:                None declared.  [UNKNOWN]

# GATE PARAMETERS
Release Gate:     98.0
Vanguard floor:   95.0
Item floor:       95
Open Sev 1 / 2:   0 / 0 required at release
Benchmark set:    5 shipped contemporaries (not yet cited)
Full re-measure:  every 5 cycles
Blocker re-notify: 12 hours
Stall threshold:  3 cycles
