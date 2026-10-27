/** Boss and climax state machines. Guards are data. No hidden checks. */

const always = { op: "always" };
const flag = (f, eq) =>
  eq === undefined ? { op: "flag", flag: f } : { op: "flag", flag: f, eq };
const absent = (f) => ({ op: "absent", flag: f });
const and = (...conds) => ({ op: "and", conds });
const not = (cond) => ({ op: "not", cond });
const tool = (t) => ({ op: "tool", tool: t });
const arg = (name, eq) => ({ op: "eventArg", arg: name, eq });
const eligible = (ending) => ({ op: "endingEligible", ending });

const set = (f, value = true) => ({ flag: f, value });
const add = (f, amount = 1) => ({ flag: f, op: "add", amount });

export const eligibility = {
  id: "eligibility.final-quarter",
  mappingStatus: "PENDING",
  mappingNote:
    "Flags below are semantic ids owned by this packet. Earlier chapters must map their runtime flags onto these names. Do not invent DG01–DG12 flag ids here.",
  reachedFlags: [
    "dg13.emptyMayorAdjourned",
    "dg14.otherShoreNamed",
    "dg15.surveyorUnfinished",
    "dg16.fiction.complete",
    "dg16.fact.complete",
    "dg16.history.complete",
    "dg16.imagination.complete",
    "dg16.heart.entered",
  ],
  witnessFlags: [
    "disc.erased.overseerBench",
    "disc.erased.otterNightShift",
    "disc.erased.foundryClock",
    "disc.erased.grandListHole",
    "disc.quiet.windowUnderIce",
    "disc.quiet.rejectedPattern",
    "disc.quiet.heartUnmapped",
    "disc.quiet.nailPlaced",
  ],
  witnessNote:
    "Refuse checks this fixed witness set. Each flag is produced by the critical-path action of one named room, and that room's forward door requires the flag. It is not an N-of-M collectible, and extra pickups do not count.",
  institutions: {
    farm: ["prepared"],
    mill: ["prepared"],
    crossing: ["prepared"],
    family: ["reunited"],
  },
  institutionNote:
    "Distribute requires all four domains in the prepared set. 'unknown' is the engine value when a runtime mapping is still pending, and it does not count as prepared. Partial preparation does not unlock Distribute.",
  endings: {
    keep: { requiresReached: true, requiresWitnesses: false, requiresInstitutions: false },
    close: { requiresReached: true, requiresWitnesses: false, requiresInstitutions: false },
    distribute: { requiresReached: true, requiresWitnesses: false, requiresInstitutions: true },
    refuse: { requiresReached: true, requiresWitnesses: true, requiresInstitutions: false },
  },
};

export const WITNESS_ROOMS = [
  { flag: "disc.erased.overseerBench", room: "DG13.R09", exit: "north" },
  { flag: "disc.erased.otterNightShift", room: "DG14.R09", exit: "north" },
  { flag: "disc.erased.foundryClock", room: "DG15.R06", exit: "north" },
  { flag: "disc.quiet.rejectedPattern", room: "DG15.R07", exit: "north" },
  { flag: "disc.erased.grandListHole", room: "DG16.FA6", exit: "north" },
  { flag: "disc.quiet.windowUnderIce", room: "DG14.R08", exit: "north" },
  { flag: "disc.quiet.heartUnmapped", room: "DG16.H2", exit: "north" },
  { flag: "disc.quiet.nailPlaced", room: "DG16.H8", exit: "north" },
];

function rollTransitions(prefix) {
  const idx = `${prefix}.progress.rollIndex`;
  const strike = `strike.${prefix}`;
  return [
    {
      event: "ring",
      guard: and(flag(idx, 0), arg("door", 1)),
      set: [set(idx, 1)],
    },
    {
      event: "ring",
      guard: and(flag(idx, 1), arg("door", 2)),
      set: [set(idx, 2)],
    },
    {
      event: "ring",
      guard: and(flag(idx, 2), arg("door", 3)),
      set: [set(`${prefix}.rollcallDone`), set(idx, 3)],
      to: "PHASE_ORDINANCE",
    },
    {
      event: "ring",
      guard: flag(strike, 2),
      set: [set(strike, 3)],
      to: "STATE_DEATH",
    },
    { event: "ring", guard: flag(strike, 1), set: [set(strike, 2)] },
    { event: "ring", guard: always, set: [set(strike, 1)] },
  ];
}

export const bosses = {
  "boss.empty-mayor": {
    id: "boss.empty-mayor",
    name: "The Empty Mayor",
    dungeon: "DG13",
    initial: "PHASE_VACANT",
    summary:
      "The mayor is the vacancy. It appoints by pulling a body into the chair. You adjourn it by leaving the peg empty and writing the chair as vacant. Filling the chair is a delay, not a solution.",
    entryOrder: [
      { state: "PHASE_ADJOURN", ifFlag: "dg13.emptyMayorAdjourned" },
      { state: "PHASE_ORDINANCE", ifFlag: "dg13.boss.rollcallDone" },
      { state: "PHASE_ROLLCALL", ifFlag: "dg13.boss.vacantDone" },
      { state: "PHASE_VACANT", always: true },
    ],
    states: {
      PHASE_VACANT: {
        onEnter: [],
        transitions: [
          {
            event: "leave-dais",
            guard: flag("dg13.boss.progress.seated"),
            reject: "The ribbon holds you.",
          },
          {
            event: "sit",
            guard: always,
            set: ["dg13.boss.progress.seated"],
          },
          {
            event: "cut-ribbon",
            guard: flag("dg13.boss.progress.seated"),
            clear: ["dg13.boss.progress.seated"],
          },
          {
            event: "cut-ribbon",
            guard: absent("dg13.boss.progress.seated"),
            reject: "There is no ribbon until you sit.",
          },
          {
            event: "leave-dais",
            guard: absent("dg13.boss.progress.seated"),
            set: ["dg13.boss.vacantDone"],
            to: "PHASE_ROLLCALL",
          },
        ],
      },
      PHASE_ROLLCALL: {
        onEnter: [set("dg13.boss.progress.rollIndex", 0)],
        transitions: rollTransitions("dg13.boss"),
      },
      PHASE_ORDINANCE: {
        transitions: [
          {
            event: "write-vacant",
            guard: tool("field-book"),
            set: ["dg13.mayorWrittenVacant", "dg13.emptyMayorAdjourned"],
            to: "PHASE_ADJOURN",
          },
          {
            event: "stamp-vacant",
            guard: tool("office-seal"),
            set: ["dg13.mayorSealedVacant", "dg13.emptyMayorAdjourned"],
            to: "PHASE_ADJOURN",
          },
        ],
      },
      PHASE_ADJOURN: {
        terminal: true,
        success: true,
        onEnter: ["dg13.emptyMayorAdjourned"],
        transitions: [],
      },
      STATE_DEATH: {
        terminal: true,
        success: false,
        failureReason: "death-crush",
        transitions: [],
      },
    },
  },
  "boss.other-shore": {
    id: "boss.other-shore",
    name: "The Lake's Other Shore",
    dungeon: "DG14",
    initial: "PHASE_MIRROR",
    summary:
      "The far shore claims to be the original. The glass swaps which side holds you, the lamp and bell still the snow, and the embryonic crossing lets you write the name 'other' so the reflection cannot keep it.",
    entryOrder: [
      { state: "PHASE_RECEDED", ifFlag: "dg14.otherShoreNamed" },
      { state: "PHASE_VOID", ifFlag: "dg14.boss.snowDone" },
      { state: "PHASE_SNOW", ifFlag: "dg14.boss.mirrorDone" },
      { state: "PHASE_MIRROR", always: true },
    ],
    states: {
      PHASE_MIRROR: {
        transitions: [
          {
            event: "step-true-shore",
            guard: absent("dg14.boss.progress.glassUp"),
            reject: "The glass is down. Both shores claim you.",
          },
          {
            event: "raise-glass",
            guard: tool("transit-glass"),
            set: ["dg14.boss.progress.glassUp"],
          },
          {
            event: "step-true-shore",
            guard: flag("dg14.boss.progress.glassUp"),
            set: ["dg14.boss.mirrorDone"],
            clear: ["dg14.boss.progress.glassUp"],
            to: "PHASE_SNOW",
          },
          {
            event: "step-false-shore",
            guard: flag("strike.dg14.boss", 2),
            set: [set("strike.dg14.boss", 3)],
            to: "STATE_DEATH",
          },
          {
            event: "step-false-shore",
            guard: flag("strike.dg14.boss", 1),
            set: [set("strike.dg14.boss", 2)],
          },
          { event: "step-false-shore", guard: always, set: [set("strike.dg14.boss", 1)] },
        ],
      },
      PHASE_SNOW: {
        transitions: [
          {
            event: "ring-bell",
            guard: absent("dg14.boss.progress.thawed"),
            reject: "Snow is in the bell.",
          },
          {
            event: "use-lamp",
            guard: tool("office-lamp"),
            set: ["dg14.boss.progress.thawed"],
          },
          {
            event: "ring-bell",
            guard: and(flag("dg14.boss.progress.thawed"), tool("county-bell")),
            set: ["dg14.boss.snowDone"],
            to: "PHASE_VOID",
          },
        ],
      },
      PHASE_VOID: {
        transitions: [
          {
            event: "enter-embryonic",
            guard: absent("dg14.boss.progress.anchor"),
            reject: "Hang the coat on the true-shore peg first.",
          },
          {
            event: "anchor-coat",
            guard: tool("borrowed-coat"),
            set: ["dg14.boss.progress.anchor"],
          },
          {
            event: "enter-embryonic",
            guard: and(
              flag("dg14.boss.progress.anchor"),
              tool("marble-needle"),
              tool("sounding-lead"),
            ),
            set: ["meta.embryonic"],
          },
          {
            event: "sound-lead",
            guard: absent("meta.embryonic"),
            reject: "The lead only speaks while you are embryonic over the void.",
          },
          {
            event: "sound-lead",
            guard: and(flag("meta.embryonic"), tool("sounding-lead")),
            set: ["dg14.boss.progress.sounded"],
          },
          {
            event: "write-other",
            guard: absent("dg14.boss.progress.sounded"),
            reject: "Sound the center before you name the shore.",
          },
          {
            event: "write-other",
            guard: and(flag("meta.embryonic"), flag("dg14.boss.progress.sounded"), tool("field-book")),
            set: ["dg14.otherShoreNamed", "dg14.boss.voidDone"],
            clear: ["meta.embryonic"],
            to: "PHASE_RECEDED",
          },
        ],
      },
      PHASE_RECEDED: {
        terminal: true,
        success: true,
        onEnter: ["dg14.otherShoreNamed"],
        transitions: [],
      },
      STATE_DEATH: {
        terminal: true,
        success: false,
        failureReason: "death-reflection",
        transitions: [],
      },
    },
  },
  "boss.surveyor-of-ellis": {
    id: "boss.surveyor-of-ellis",
    name: "The Surveyor of Ellis",
    dungeon: "DG15",
    initial: "PHASE_INTRODUCTION",
    summary:
      "The office has poured one authorized Ellis. You stop the ladle, record that the measured plot overflows the county, and leave the pouring unfinished. Stamping the plot 'as drawn' is a mistake with a visible recovery: the plumb cracks the false boundary.",
    entryOrder: [
      { state: "PHASE_DRAIN", ifFlag: "dg15.surveyorUnfinished" },
      { state: "PHASE_UNPOURED", ifFlag: "dg15.boss.sealDone" },
      { state: "PHASE_SEAL_HARD", ifFlag: "dg15.boss.stampedAsDrawn" },
      { state: "PHASE_SEAL", ifFlag: "dg15.boss.overflowRecorded" },
      { state: "PHASE_MEASURE", ifFlag: "dg15.boss.castingDone" },
      { state: "PHASE_CASTING", ifFlag: "dg15.boss.introDone" },
      { state: "PHASE_INTRODUCTION", always: true },
    ],
    states: {
      PHASE_INTRODUCTION: {
        transitions: [
          {
            event: "step-off",
            guard: always,
            set: ["dg15.boss.introDone"],
            to: "PHASE_CASTING",
          },
        ],
      },
      PHASE_CASTING: {
        transitions: [
          {
            event: "pull-ladle",
            guard: tool("field-chain"),
            set: ["dg15.boss.castingDone"],
            to: "PHASE_MEASURE",
          },
          {
            event: "touch-copy",
            guard: flag("strike.dg15.boss", 2),
            set: [set("strike.dg15.boss", 3)],
            to: "STATE_DEATH",
          },
          {
            event: "touch-copy",
            guard: flag("strike.dg15.boss", 1),
            set: [set("strike.dg15.boss", 2)],
          },
          { event: "touch-copy", guard: always, set: [set("strike.dg15.boss", 1)] },
        ],
      },
      PHASE_MEASURE: {
        transitions: [
          {
            event: "record-overflow",
            guard: and(tool("transit-glass"), tool("field-book")),
            set: ["dg15.boss.measureDone", "dg15.boss.overflowRecorded"],
            to: "PHASE_SEAL",
          },
          {
            event: "stamp-as-drawn",
            guard: tool("office-seal"),
            set: ["dg15.boss.measureDone", "dg15.boss.stampedAsDrawn"],
            to: "PHASE_SEAL_HARD",
          },
        ],
      },
      PHASE_SEAL: {
        transitions: [
          {
            event: "stand-outside",
            guard: absent("dg15.boss.progress.ticks"),
            reject: "The lamp has not shown the overflow ticks.",
          },
          {
            event: "lamp-ticks",
            guard: tool("office-lamp"),
            set: ["dg15.boss.progress.ticks"],
          },
          {
            event: "stand-outside",
            guard: flag("dg15.boss.progress.ticks"),
            set: ["dg15.boss.sealDone"],
            to: "PHASE_UNPOURED",
          },
        ],
      },
      PHASE_SEAL_HARD: {
        transitions: [
          {
            event: "stand-outside",
            guard: always,
            reject: "The stamped plot has no visible outside until the plumb cracks it.",
          },
          {
            event: "plumb-crack",
            guard: tool("plumb-bob"),
            set: ["dg15.boss.sealDone"],
            to: "PHASE_UNPOURED",
          },
        ],
      },
      PHASE_UNPOURED: {
        transitions: [
          {
            event: "leave-unfinished",
            guard: always,
            set: ["dg15.surveyorUnfinished"],
            to: "PHASE_DRAIN",
          },
        ],
      },
      PHASE_DRAIN: {
        terminal: true,
        success: true,
        onEnter: ["dg15.surveyorUnfinished"],
        transitions: [],
      },
      STATE_DEATH: {
        terminal: true,
        success: false,
        failureReason: "death-cast",
        transitions: [],
      },
    },
  },
};

function lineRejects() {
  return [
    {
      event: "write-line",
      guard: and(arg("line", "keep"), flag("staged.seal")),
      reject: "conflict.keep-and-seal",
    },
    {
      event: "write-line",
      guard: and(arg("line", "keep"), flag("staged.chain")),
      reject: "conflict.keep-and-chain",
    },
    {
      event: "write-line",
      guard: and(arg("line", "close"), flag("staged.bell")),
      reject: "conflict.close-and-bell",
    },
    {
      event: "write-line",
      guard: and(arg("line", "distribute"), flag("staged.seal")),
      reject: "conflict.distribute-and-seal",
    },
    {
      event: "write-line",
      guard: flag("campaign.ending"),
      reject: "ending-locked",
    },
    {
      event: "write-line",
      guard: arg("line", "keep"),
      set: [set("staged.line", "keep")],
    },
    {
      event: "write-line",
      guard: arg("line", "close"),
      set: [set("staged.line", "close")],
    },
    {
      event: "write-line",
      guard: arg("line", "distribute"),
      set: [set("staged.line", "distribute")],
    },
    { event: "clear-line", guard: always, clear: ["staged.line"] },
  ];
}

const keepGuard = and(
  eligible("keep"),
  flag("staged.line", "keep"),
  flag("staged.coatOnSeamPeg", "current"),
  flag("staged.needleAtCrack"),
  absent("staged.seal"),
  absent("staged.chain"),
  absent("staged.bell"),
  absent("staged.jam"),
  absent("meta.embryonic"),
);

const closeGuard = and(
  eligible("close"),
  flag("staged.line", "close"),
  absent("staged.coatOnSeamPeg"),
  flag("body.coatEquipped"),
  flag("staged.seal"),
  flag("staged.chain"),
  absent("staged.bell"),
  absent("staged.jam"),
  absent("meta.embryonic"),
);

const distGuard = and(
  eligible("distribute"),
  flag("staged.line", "distribute"),
  flag("socket.farm"),
  flag("socket.mill"),
  flag("socket.crossing"),
  flag("socket.family"),
  flag("staged.bell"),
  flag("staged.needleAtCrack"),
  absent("staged.coatOnSeamPeg"),
  absent("staged.seal"),
  absent("staged.chain"),
  absent("staged.jam"),
  absent("meta.embryonic"),
);

const refuseGuard = and(
  eligible("refuse"),
  flag("staged.jam"),
  flag("staged.pagesRead"),
  flag("meta.embryonic"),
  flag("body.coatEquipped"),
  absent("staged.seal"),
  absent("staged.chain"),
  absent("staged.bell"),
  absent("staged.line"),
  absent("staged.coatOnSeamPeg"),
);

export const climax = {
  id: "climax.seam",
  name: "The Seam Chamber",
  initial: "CHAMBER",
  vignetteCount: 8,
  summary:
    "One chamber, four commits. Eligibility may overlap. The first successful confirm locks campaign.ending. Physical preparations (seal, chain, sockets, bell, nail, current coat) stay after a death; the unconfirmed lectern line and the embryonic form do not.",
  states: {
    CHAMBER: {
      transitions: [
        ...lineRejects(),
        {
          event: "hang-coat",
          guard: absent("body.coatEquipped"),
          reject: "coat-not-in-hand",
        },
        {
          event: "hang-coat",
          guard: flag("meta.embryonic"),
          reject: "embryonic-cannot-hang",
        },
        {
          event: "hang-coat",
          guard: and(flag("body.coatEquipped"), absent("meta.embryonic")),
          set: [set("staged.coatOnSeamPeg", "current")],
          clear: ["body.coatEquipped"],
        },
        {
          event: "retrieve-coat",
          guard: flag("staged.coatOnSeamPeg"),
          set: ["body.coatEquipped"],
          clear: ["staged.coatOnSeamPeg"],
        },
        {
          event: "stamp-seal",
          guard: flag("staged.line", "keep"),
          reject: "conflict.keep-and-seal",
        },
        {
          event: "stamp-seal",
          guard: flag("staged.line", "distribute"),
          reject: "conflict.distribute-and-seal",
        },
        {
          event: "stamp-seal",
          guard: tool("office-seal"),
          set: ["staged.seal"],
        },
        {
          event: "lift-seal",
          guard: flag("campaign.ending"),
          reject: "ending-locked",
        },
        { event: "lift-seal", guard: flag("staged.seal"), clear: ["staged.seal"] },
        {
          event: "latch-chain",
          guard: flag("staged.line", "keep"),
          reject: "conflict.keep-and-chain",
        },
        {
          event: "latch-chain",
          guard: tool("field-chain"),
          set: ["staged.chain"],
        },
        { event: "unlatch-chain", guard: flag("staged.chain"), clear: ["staged.chain"] },
        {
          event: "fill-socket",
          guard: not({ op: "eventInstitution", arg: "which" }),
          reject: "institution-unprepared",
        },
        {
          event: "fill-socket",
          guard: { op: "eventInstitution", arg: "which" },
          set: [{ flagFromArg: "which", prefix: "socket." }],
        },
        {
          event: "ring-bell",
          guard: not(
            and(flag("socket.farm"), flag("socket.mill"), flag("socket.crossing"), flag("socket.family")),
          ),
          reject: "sockets-incomplete",
        },
        {
          event: "ring-bell",
          guard: and(
            flag("socket.farm"),
            flag("socket.mill"),
            flag("socket.crossing"),
            flag("socket.family"),
            absent("staged.seal"),
            absent("staged.chain"),
            tool("county-bell"),
          ),
          set: ["staged.bell"],
        },
        {
          event: "place-needle",
          guard: tool("marble-needle"),
          set: ["staged.needleAtCrack"],
        },
        { event: "take-needle", guard: flag("staged.needleAtCrack"), clear: ["staged.needleAtCrack"] },
        {
          event: "jam-nail",
          guard: absent("disc.quiet.nailPlaced"),
          reject: "nail-not-placed",
        },
        {
          event: "jam-nail",
          guard: not(eligible("refuse")),
          reject: "refuse-ineligible",
        },
        {
          event: "jam-nail",
          guard: not(
            and(absent("staged.seal"), absent("staged.chain"), absent("staged.bell"), absent("staged.line")),
          ),
          reject: "lectern-not-clear",
        },
        {
          event: "jam-nail",
          guard: and(
            eligible("refuse"),
            flag("disc.quiet.nailPlaced"),
            absent("staged.seal"),
            absent("staged.chain"),
            absent("staged.bell"),
            absent("staged.line"),
          ),
          set: ["staged.jam"],
        },
        {
          event: "read-pages",
          guard: absent("staged.jam"),
          reject: "hinge-not-jammed",
        },
        {
          event: "read-pages",
          guard: not(eligible("refuse")),
          reject: "erased-pages-empty",
        },
        {
          event: "read-pages",
          guard: and(flag("staged.jam"), eligible("refuse")),
          set: ["staged.pagesRead"],
        },
        {
          event: "enter-embryonic",
          guard: absent("body.coatEquipped"),
          reject: "coat-is-hung-or-missing",
        },
        {
          event: "enter-embryonic",
          guard: flag("staged.seal"),
          reject: "seal-blocks-the-crack",
        },
        {
          event: "enter-embryonic",
          guard: and(flag("body.coatEquipped"), absent("staged.seal"), tool("marble-needle"), tool("sounding-lead")),
          set: ["meta.embryonic"],
        },
        { event: "exit-embryonic", guard: flag("meta.embryonic"), clear: ["meta.embryonic"] },
        {
          event: "confirm-keep",
          guard: flag("staged.seal"),
          reject: "conflict.keep-and-seal",
        },
        {
          event: "confirm-keep",
          guard: and(flag("staged.coatOnSeamPeg"), not(flag("staged.coatOnSeamPeg", "current"))),
          reject: "peg-holds-a-previous-body",
        },
        { event: "confirm-keep", guard: not(keepGuard), reject: "keep-unsatisfied" },
        {
          event: "confirm-keep",
          guard: keepGuard,
          set: [
            set("campaign.ending", "keep"),
            set("vignette.index", 0),
            set("world.seamOpen", true),
            set("world.fourteenYear", true),
            set("world.holder", "ellis"),
            set("world.administered", true),
          ],
          to: "PLAYING",
        },
        {
          event: "confirm-close",
          guard: flag("staged.bell"),
          reject: "conflict.close-and-bell",
        },
        { event: "confirm-close", guard: not(closeGuard), reject: "close-unsatisfied" },
        {
          event: "confirm-close",
          guard: closeGuard,
          set: [
            set("campaign.ending", "close"),
            set("vignette.index", 0),
            set("world.seamOpen", false),
            set("world.fourteenYear", false),
            set("world.holder", "none"),
            set("world.administered", true),
            set("world.deathIsFinal", true),
          ],
          to: "PLAYING",
        },
        {
          event: "confirm-distribute",
          guard: not(and(flag("socket.farm"), flag("socket.mill"), flag("socket.crossing"), flag("socket.family"))),
          reject: "sockets-incomplete",
        },
        {
          event: "confirm-distribute",
          guard: not(eligible("distribute")),
          reject: "distribute-ineligible",
        },
        { event: "confirm-distribute", guard: not(distGuard), reject: "distribute-unsatisfied" },
        {
          event: "confirm-distribute",
          guard: distGuard,
          set: [
            set("campaign.ending", "distribute"),
            set("vignette.index", 0),
            set("world.seamOpen", true),
            set("world.fourteenYear", true),
            set("world.holder", "institutions"),
            set("world.administered", true),
            set("world.newLifeAssignedBy", "prepared-institutions"),
          ],
          to: "PLAYING",
        },
        {
          event: "cross-lintel",
          guard: flag("staged.bell"),
          reject: "conflict.refuse-and-bell",
        },
        {
          event: "cross-lintel",
          guard: flag("staged.seal"),
          reject: "conflict.refuse-and-seal",
        },
        {
          event: "cross-lintel",
          guard: not(eligible("refuse")),
          reject: "refuse-ineligible",
        },
        { event: "cross-lintel", guard: absent("staged.jam"), reject: "hinge-not-jammed" },
        { event: "cross-lintel", guard: absent("staged.pagesRead"), reject: "pages-not-read" },
        { event: "cross-lintel", guard: absent("meta.embryonic"), reject: "not-embryonic" },
        { event: "cross-lintel", guard: not(refuseGuard), reject: "refuse-unsatisfied" },
        {
          event: "cross-lintel",
          guard: refuseGuard,
          set: [
            set("campaign.ending", "refuse"),
            set("vignette.index", 0),
            set("world.seamOpen", true),
            set("world.fourteenYear", false),
            set("world.holder", "none"),
            set("world.administered", false),
          ],
          clear: ["meta.embryonic"],
          to: "PLAYING",
        },
      ],
    },
    PLAYING: {
      transitions: [
        { event: "confirm-keep", guard: always, reject: "ending-locked" },
        { event: "confirm-close", guard: always, reject: "ending-locked" },
        { event: "confirm-distribute", guard: always, reject: "ending-locked" },
        { event: "cross-lintel", guard: always, reject: "ending-locked" },
        { event: "write-line", guard: always, reject: "ending-locked" },
        {
          event: "advance-vignette",
          guard: flag("vignette.index", 8),
          reject: "vignettes-finished",
        },
        {
          event: "advance-vignette",
          guard: flag("campaign.ending"),
          set: [add("vignette.index", 1)],
        },
        {
          event: "begin-credits",
          guard: not(flag("vignette.index", 8)),
          reject: "vignettes-unfinished",
        },
        {
          event: "begin-credits",
          guard: flag("vignette.index", 8),
          to: "CREDITS",
        },
      ],
    },
    CREDITS: {
      transitions: [
        {
          event: "finish-credits",
          guard: always,
          set: [
            "meta.terminal",
            "meta.yearFrozen",
            set("meta.deathEnabled", false),
            "meta.lecternLocked",
            set("meta.dungeonReentry", "museum"),
            set("meta.bossesRespawn", false),
            "meta.toolsPreserved",
          ],
          spawn: { room: "EPILOGUE.PORCH", x: 9, y: 7 },
          to: "TERMINAL",
        },
      ],
    },
    TERMINAL: { terminal: true, success: true, transitions: [] },
  },
};

export const embryonic = {
  id: "traversal.embryonic-god",
  mappingStatus: "PENDING",
  name: "Embryonic God traversal",
  notAMythology: true,
  summary:
    "A late-game body state for crossing water and void, already established before this packet. It is not a cult, a second pantheon, or a companion. The name is the surveyors' name for an unfinished life that can lie on a surface a finished body falls through.",
  enterWhen: {
    op: "and",
    conds: [
      { op: "tool", tool: "marble-needle" },
      { op: "tool", tool: "sounding-lead" },
      { op: "flag", flag: "body.coatEquipped" },
    ],
  },
  anchor: "Hang borrowed-coat on a shore peg in the same room before entering. The peg is the return point.",
  whileActive: {
    canUse: ["transit-glass", "field-book", "marble-needle", "sounding-lead", "plumb-bob"],
    cannotUse: ["office-seal", "county-bell", "field-chain", "range-rod", "office-lamp", "field-knife"],
    reason: "An unfinished life has no civic voice and no office weight.",
  },
  death: "Embryonic death returns you to the coat anchor if one was set, otherwise to the region checkpoint. The coat stays on the peg as a previous body. Year advances 14. The form ends.",
  exit: "Step onto a stand tile and the form ends. The solution traces in DG14, DG15, and DG16 do this before leaving the room.",
};

export const deathRules = {
  id: "death.final-complex",
  yearDelta: 14,
  bodyRule: "body.id becomes ellis-body-{deathCount}. The persistent name remains Ellis Perch.",
  checkpointRule:
    "Respawn at the latest visited checkpoint inside the current region. Boss rooms are not checkpoints; their antechambers are. DG16 environments checkpoint at their first room. The Seam checkpoints itself.",
  persists: [
    "discoveries (disc.*)",
    "room clears",
    "completed boss phases",
    "environment completion",
    "institution decisions",
    "physical seam preparations: seal, chain, sockets, bell, nail jam, pages read",
    "a coat left on a peg, reclassified from current to previous",
  ],
  resets: [
    "strike.*",
    "hazard.*",
    "meta.embryonic",
    "staged.line (unconfirmed lectern choice)",
    "*.progress.* boss indices",
    "actor positions",
  ],
  doesNot: [
    "grant a discovery you did not earn",
    "complete an environment",
    "commit or change campaign.ending",
    "consume or restore institution preparation",
  ],
  afterCommitBeforeCredits:
    "Death still advances the year and returns you to DG16.SEAM. The committed ending and vignette index remain. Replay the current vignette.",
  afterTerminal:
    "meta.terminal is set and meta.deathEnabled is false. Death does not fire. The save loads EPILOGUE.PORCH. Bosses do not respawn. Dungeons reopen as museums. The lectern does not offer the four choices again. A new game is a separate slot.",
};

export const tools = {
  mappingStatus: "PENDING",
  note: "Semantic tool roles used by this packet. runtimeToolId stays null until the earlier field-kit packet is mapped. Puzzles call these roles by name.",
  tools: [
    { id: "field-chain", runtimeToolId: null, use: "Measure a posted length, latch a gap, pull along a straight line, couple wheels, bind the seam shut." },
    { id: "range-rod", runtimeToolId: null, use: "Hold a gate, jam a press, bridge a posted gap, turn a gear, plant a path in imagination." },
    { id: "transit-glass", runtimeToolId: null, use: "See which door the reflection omits, align two marks, show a wish-state floor." },
    { id: "plumb-bob", runtimeToolId: null, use: "Find the true vertical among false landings, falls, wax lives, and a stamped plot." },
    { id: "office-lamp", runtimeToolId: null, use: "Show gouged names, thaw one ice face, light a stove, reveal overflow ticks." },
    { id: "field-knife", runtimeToolId: null, use: "Cut red tape, a ribbon, a page-thick film, or one corner of a controlled page." },
    { id: "field-book", runtimeToolId: null, use: "Copy what is already written in the room. The book is how discoveries persist as text. It is not a riddle journal." },
    { id: "county-bell", runtimeToolId: null, use: "Call a posted civic role, still a shore, speak a fiction aloud, ring a distributed seam." },
    { id: "office-seal", runtimeToolId: null, use: "Stamp a warrant, a false charter, or the seam itself. Using it is remembered. It is never required to finish the dungeons." },
    { id: "marble-needle", runtimeToolId: null, use: "Point across water or void inside the final quarter only. It is not an overworld quest marker." },
    { id: "sounding-lead", runtimeToolId: null, use: "Read depth. Marks safe ice, void, and fords. Required together with the needle for embryonic crossing." },
    { id: "borrowed-coat", runtimeToolId: null, use: "The current body's coat. Hung, it is an anchor or a presence. It is not a second character." },
  ],
};

export const decisions = {
  mappingStatus: "PENDING",
  note: "Semantic outcomes of the major county decisions. The earlier campaign sets these. Until mapped, the runtime must pass 'unknown', which keeps every dungeon solvable and makes Distribute ineligible.",
  domains: {
    farm: {
      values: ["prepared", "neglected", "opposed", "unknown"],
      preparedMeans: "The player helped the farm hold its own seed, fences, and books so the place can bear a share without the office.",
    },
    mill: {
      values: ["prepared", "neglected", "opposed", "unknown"],
      preparedMeans: "The player helped the mill keep its race, wheel, and settlement so the mill can bear a share.",
    },
    crossing: {
      values: ["prepared", "neglected", "opposed", "unknown"],
      preparedMeans: "The player helped the ford or ferry keep a crossing that answers to its tenders, not only to the survey.",
    },
    family: {
      values: ["reunited", "scattered", "estranged", "unknown"],
      preparedMeans: "Reunited is the only family value that can hold a share. Scattered and estranged cannot.",
    },
  },
};
