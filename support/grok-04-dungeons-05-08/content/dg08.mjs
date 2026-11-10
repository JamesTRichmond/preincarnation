import {
  H,
  W,
  exit,
  expandPuzzle,
  grid,
  hitChain,
  interact,
  keepHub,
  room,
  standardDoors,
} from "./lib.mjs";

const CX = Math.floor(W / 2);
const CY = Math.floor(H / 2);

function hubGrid(dirs, paint) {
  return grid({
    doors: standardDoors(dirs),
    paint(g) {
      paint?.(g);
      keepHub(g);
    },
  });
}

function withReset(states, edges, back) {
  for (const id of Object.keys(states)) {
    if (id !== back && !states[id].terminal) {
      edges.push({ from: id, on: "death-resets-fight", to: back, reset: true });
    }
  }
}

const bHits = hitChain("b", 3, "defeated", "The bailiff copied WAIT and stalled.");
const p1 = hitChain("p1", 3, "phase2_copy", "The witness's shadow is solid where the lanterns agree with the docket.");
const p2 = hitChain("p2", 3, "phase3_mask", "The lunge missed. The chalked copy is still on the floor.");
const p3 = hitChain("p3", 4, "adjourned", "The mask burns on the center stand. The face does not arrive.");

const bailiffStates = {
  mirror: {
    terminal: false,
    safe: true,
    note: "A banner over the aisle shows the direction the bailiff will copy next: Ellis's previous step. WAIT is a legal step.",
  },
  stalled: {
    terminal: false,
    safe: true,
    tell: "The banner reads WAIT. The bailiff copies it and does not move.",
  },
  defeated: {
    terminal: true,
    safe: true,
    setsFlags: ["dg08.bailiff"],
    givesKeys: ["dg08.sk.cage"],
  },
  ...bHits.states,
};
const bailiffEdges = [
  { from: "mirror", on: "feed-wait", to: "stalled" },
  { from: "mirror", on: "bell", to: "mirror", reset: true, preservesKeys: true, preservesLatched: true },
  { from: "stalled", on: "bailiff-copies-wait", to: bHits.first },
  { from: "stalled", on: "bell", to: "mirror", reset: true, preservesKeys: true, preservesLatched: true },
  { from: "b_h0", on: "bell", to: "b_h0", clearsBuffer: true, preservesHits: true, preservesKeys: true },
  { from: "b_h1", on: "bell", to: "b_h1", clearsBuffer: true, preservesHits: true, preservesKeys: true },
  { from: "b_h2", on: "bell", to: "b_h2", clearsBuffer: true, preservesHits: true, preservesKeys: true },
  ...bHits.edges,
];
withReset(bailiffStates, bailiffEdges, "mirror");

const witnessStates = {
  call_to_order: {
    terminal: false,
    safe: true,
    note: "The docket board lights with the phase order and stays lit. South door stays open.",
  },
  phase1_place: {
    terminal: false,
    safe: true,
    tell: "An exemplar shadow places lanterns left, right, then bench, once, in view.",
  },
  phase2_copy: {
    terminal: false,
    safe: true,
    tell: "The witness stores three steps. Before any lunge, chalk draws those steps on the floor.",
    preview: "chalk",
  },
  phase2_lunge: {
    terminal: false,
    safe: true,
    tell: "The lunge follows the chalk and not a hidden buffer.",
  },
  phase3_mask: {
    terminal: false,
    safe: true,
    tell: "A mask walks. The docket line reads: the face is the light you put down.",
  },
  adjourned: {
    terminal: true,
    safe: true,
    setsFlags: ["dg08.boss", "dg08.crown2.resolved"],
    givesEvidence: ["dg08.ev.adjourned"],
    note: "The witness bows to an empty bench. This is the proposed Second Crown resolution, not a costume and not Embryonic God by itself.",
  },
  ...p1.states,
  ...p2.states,
  ...p3.states,
};
const witnessEdges = [
  { from: "call_to_order", on: "approach", to: "phase1_place" },
  { from: "phase1_place", on: "place-three-lanterns", to: p1.first },
  { from: "phase1_place", on: "wrong-pedestal", to: "phase1_place" },
  { from: "phase1_place", on: "bell", to: "phase1_place", reset: true, preservesKeys: true, preservesLatched: true },
  { from: "phase2_copy", on: "chalk-shows-copy", to: "phase2_lunge", preview: "chalk" },
  { from: "phase2_lunge", on: "lunge-recovers", to: p2.first },
  { from: "phase2_copy", on: "bell", to: "phase2_copy", clearsBuffer: true, preservesKeys: true },
  { from: "phase2_lunge", on: "bell", to: "phase2_copy", clearsBuffer: true, preservesKeys: true },
  { from: "p2_h0", on: "bell", to: "p2_h0", clearsBuffer: true, preservesHits: true, preservesKeys: true },
  { from: "p2_h1", on: "bell", to: "p2_h1", clearsBuffer: true, preservesHits: true, preservesKeys: true },
  { from: "p2_h2", on: "bell", to: "p2_h2", clearsBuffer: true, preservesHits: true, preservesKeys: true },
  { from: "phase3_mask", on: "place-lamp-on-center-stand", to: p3.first },
  ...p1.edges,
  ...p2.edges,
  ...p3.edges,
];
withReset(witnessStates, witnessEdges, "call_to_order");

function testimony(id, room, exemplar, latchFlag, major, decoys) {
  return expandPuzzle({
    id,
    room,
    type: "testimony",
    major,
    solutionDisplayed: true,
    noFreeText: true,
    exemplar,
    carvedDuplicate: exemplar.slice(),
    decoys,
    latchFlag,
    readableRail: true,
    mismatchShown: true,
    bellPreservesKeys: true,
    bellPreservesLatched: true,
    reset: "The clerk's bell clears the testimony rail to empty and returns spare lanterns to their pedestals. Keys, evidence, and latched doors stay.",
  });
}

export const dg08 = {
  id: "dg08",
  name: "The Lantern Court",
  sequence: 8,
  county: "Addison County, Vermont",
  town: "Vergennes",
  site: "A court annex off the falls that is only in session where lanterns have been set down. It is not City Hall. It convenes in the gap the city did not measure.",
  premise:
    "Shadows copy what Ellis just did. The copy is written on a testimony rail as verb and direction, eight beats visible, newest last. An exemplar performs the legal sequence in the room, and the same sequence is cut into stone or wood there. A clerk's bell rewinds the copy without taking keys. The Second Crown is resolved here as a proposed integration event. It does not grant Embryonic God.",
  bossId: "dg08.boss.witness",
  minibossId: "dg08.miniboss.bailiff",
  entranceRoom: "dg08.r01",
  goalFlag: "dg08.boss",
  initialLevel: null,
  requiredTools: ["lamp"],
  optionalTools: ["bow", "glassWarp", "cape", "sugarLine"],
  designAssertions: ["testimonyRecoverable", "fairClues", "shownSolutions", "noFreeText"],
  testimonyPolicy: {
    railVisible: true,
    railFields: ["index", "verb", "dir", "actor"],
    capacity: 8,
    mismatchMarked: true,
    bellClearsRail: true,
    bellPreservesKeys: true,
    bellPreservesEvidence: true,
    bellPreservesLatchedFlags: true,
    bellDoesNotPreserveUncommittedPlacement: true,
    exemplarLoopsInRoom: true,
    carvedDuplicateInRoom: true,
    noHiddenBuffer: true,
  },
  input: {
    combat: "four-direction",
    keyboard: "cardinal movement and a single action",
    touch: "cardinal pad and tap on the interaction tile",
    parity: "WAIT, PLACE, and RING are tiles, not keyboard-only chords.",
  },
  entry: {
    campaignPrerequisites: [
      {
        id: "tool.lamp",
        external: true,
        kind: "tool",
        note: "Placed light uses the lamp plus spare court lanterns that never leave the room.",
      },
      { id: "dg07.boss", external: false, kind: "flag" },
    ],
    standalonePrerequisites: [{ tool: "lamp" }],
    assumedGrantedFlags: ["dg07.boss"],
    proposedUnlocks: [
      {
        id: "integration.secondCrown",
        whenFlags: ["dg08.boss", "dg08.record"],
        requiresEvidence: ["dg08.ev.playable", "dg08.ev.contradiction"],
        kind: "proposed-integration-event",
        notRuntimeApi: true,
        grantsEmbryonicGod: false,
        note: "Resolves crown 2, the Lantern Crown. Eligibility for Embryonic God is a contribution recorded in integration/second-crown.event.json. This pack does not set that eligibility.",
      },
    ],
  },
  death: {
    checkpointRoom: "dg08.r01",
    ageAdvanceYears: 14,
    keysPersist: true,
    evidencePersists: true,
    latchedFlagsPersist: true,
    testimonyClears: true,
    bossResetsUnlessDefeated: true,
    unsolvedPuzzlesReset: true,
    spareLanternsReturnToPedestals: true,
    playerLampReturnsToHand: true,
    epitaph:
      "In {roomName}, the body stopped. Ellis Perch drew the next breath fourteen years on. The rail of that attempt is blank. The docket is not.",
    voiceOnReentry: "The court finally kept a face for the unmeasured life. You did not lend it yours.",
    otherVoiceOnReentry: "The court kept a record of a refusal. Do not let the office call the refusal a birth.",
  },
  routes: {
    main: [
      { do: "interact", id: "solve-night" },
      { do: "exit", id: "to-docket" },
      { do: "interact", id: "read-docket" },
      { do: "exit", id: "to-sconces" },
      { do: "interact", id: "solve-sconces" },
      { do: "exit", id: "to-shadow" },
      { do: "interact", id: "solve-shadow" },
      { do: "exit", id: "to-benches" },
      { do: "interact", id: "read-bench" },
      { do: "exit", id: "to-well" },
      { do: "interact", id: "solve-well" },
      { do: "exit", id: "to-bailiff" },
      { do: "interact", id: "defeat-bailiff" },
      { do: "exit", id: "to-cage" },
      { do: "interact", id: "solve-exhibit" },
      { do: "exit", id: "to-lanterns" },
      { do: "interact", id: "solve-lanterns" },
      { do: "exit", id: "to-cross" },
      { do: "interact", id: "solve-cross" },
      { do: "exit", id: "to-record" },
      { do: "interact", id: "solve-record" },
      { do: "exit", id: "to-threshold" },
      { do: "interact", id: "take-big-key" },
      { do: "exit", id: "to-session" },
      { do: "exit", id: "to-witness" },
      { do: "interact", id: "defeat-witness" },
    ],
    optionalBranches: [
      {
        id: "dg08.branch.jury",
        rooms: ["dg08.r11"],
        assumeFlags: [
          "dg08.night",
          "dg08.sconces",
          "dg08.shadow",
          "dg08.well",
          "dg08.bailiff",
          "dg08.exhibit",
          "dg08.lanterns",
          "dg08.cross",
        ],
        assumeKeys: ["dg08.sk.cage"],
        startRoom: "dg08.r10",
        script: [
          { do: "exit", id: "to-jury" },
          { do: "interact", id: "light-candle" },
          { do: "exit", id: "back-cross" },
        ],
      },
      {
        id: "dg08.branch.faces",
        rooms: ["dg08.r13"],
        assumeFlags: [
          "dg08.night",
          "dg08.sconces",
          "dg08.shadow",
          "dg08.well",
          "dg08.bailiff",
          "dg08.exhibit",
          "dg08.lanterns",
          "dg08.cross",
          "dg08.record",
        ],
        assumeKeys: ["dg08.sk.cage"],
        startRoom: "dg08.r14",
        script: [
          { do: "exit", id: "to-faces" },
          { do: "interact", id: "read-portraits" },
          { do: "exit", id: "back-threshold" },
        ],
      },
    ],
    shortcut: {
      id: "dg08.short.docket-threshold",
      description:
        "After the playable record is latched, a service corridor joins the docket hall to the crown threshold. A later body skips the middle court.",
      from: "dg08.r02",
      to: "dg08.r14",
      skipsRooms: [
        "dg08.r03",
        "dg08.r04",
        "dg08.r05",
        "dg08.r06",
        "dg08.r07",
        "dg08.r08",
        "dg08.r09",
        "dg08.r10",
        "dg08.r12",
      ],
      assumeFlags: [
        "dg08.night",
        "dg08.sconces",
        "dg08.shadow",
        "dg08.well",
        "dg08.bailiff",
        "dg08.exhibit",
        "dg08.lanterns",
        "dg08.cross",
        "dg08.record",
      ],
      assumeKeys: ["dg08.sk.cage"],
      startRoom: "dg08.r01",
      script: [
        { do: "exit", id: "to-docket" },
        { do: "exit", id: "shortcut-to-threshold" },
        { do: "interact", id: "take-big-key" },
        { do: "exit", id: "to-session" },
        { do: "exit", id: "to-witness" },
        { do: "interact", id: "defeat-witness" },
      ],
    },
  },
  keys: [
    {
      id: "dg08.sk.cage",
      kind: "small",
      name: "Cage key",
      source: { room: "dg08.r07", interaction: "defeat-bailiff" },
      opens: ["dg08.lock.cage"],
    },
    {
      id: "dg08.bk.lantern",
      kind: "big",
      name: "Lantern key",
      source: { room: "dg08.r14", interaction: "take-big-key" },
      opens: ["dg08.lock.boss"],
    },
  ],
  locks: [
    { id: "dg08.lock.cage", keyId: "dg08.sk.cage", optional: false, exit: "to-cage", room: "dg08.r07" },
    { id: "dg08.lock.boss", keyId: "dg08.bk.lantern", optional: false, exit: "to-witness", room: "dg08.r15" },
  ],
  clues: [
    {
      id: "dg08.clue.shadow.exemplar",
      puzzle: "dg08.puz.shadow",
      room: "dg08.r04",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "An exemplar shadow loops north, north, east, ring. It repeats until Ellis matches it or rings the bell.",
    },
    {
      id: "dg08.clue.shadow.floor",
      puzzle: "dg08.puz.shadow",
      room: "dg08.r04",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The same four beats are inlaid in the floor in slate: N, N, E, a bell-cut.",
    },
    {
      id: "dg08.clue.record.exemplar",
      puzzle: "dg08.puz.record",
      room: "dg08.r12",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The exemplar plays north, east, east, north, ring, and then plays it again.",
    },
    {
      id: "dg08.clue.record.wall",
      puzzle: "dg08.puz.record",
      room: "dg08.r12",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The wall carving is the same five beats. The testimony rail shows Ellis's beats beside it, mismatch in red wax.",
    },
    {
      id: "dg08.clue.cross.arrows",
      puzzle: "dg08.puz.cross",
      room: "dg08.r10",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "Arrows cut in Ellis's rail read north, north, south. The shadow's next tile is chalked before it moves.",
    },
    {
      id: "dg08.clue.cross.exemplar",
      puzzle: "dg08.puz.cross",
      room: "dg08.r10",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The exemplar walks that arrow order on the far rail, forever, including the plates lighting as it goes.",
    },
  ],
  evidence: [
    {
      id: "dg08.ev.docket",
      name: "The Town vs. The Unmeasured Life",
      required: false,
      room: "dg08.r02",
      text: "Docket heading cut into the bench. The charge is that a life resumed in Addison County without a new birth, and that the office would like this called a zero.",
    },
    {
      id: "dg08.ev.contradiction",
      name: "The two voices on one event",
      required: true,
      room: "dg08.r02",
      text: "Voice, left bench: The vein kept Ellis because a crown must be worn by a continued life. Other Voice, right bench: A continued life is a person. A crown is the court admitting it failed to file the person. They are answering the same docket line and do not agree.",
    },
    {
      id: "dg08.ev.bench",
      name: "Scrap under the bench",
      required: false,
      room: "dg08.r05",
      text: "A juror's scrap: we copied the steps we were shown. When the copy went wrong the bell put us back at the start of the steps, not at the start of our lives.",
    },
    {
      id: "dg08.ev.exhibit",
      name: "Exhibit card",
      required: false,
      room: "dg08.r08",
      text: "The card inside the cage, repeating the docket so it does not have to be remembered: nail, page, lantern. The bases of the three objects are stamped with those words.",
    },
    {
      id: "dg08.ev.playable",
      name: "The playable record",
      required: true,
      room: "dg08.r12",
      text: "The floor keeps Ellis's successful five beats as a record that can be walked again. It is evidence because it was done, not because it was written about. The Second Crown proposal requires this record alongside the adjournment.",
    },
    {
      id: "dg08.ev.portraits",
      name: "Scraped years",
      required: false,
      room: "dg08.r13",
      text: "Portraits with the faces planed off. The lamp finds years, not mouths: 1849, 1863, 1877, and onward by fourteens. Optional. The court does not require Ellis to count them.",
    },
    {
      id: "dg08.ev.adjourned",
      name: "Adjournment",
      required: false,
      room: "dg08.r16",
      text: "The witness without a face bows. The record states that Ellis stood where a face was asked for and set down a light instead. Crown two is marked resolved. No god is declared.",
    },
  ],
  collectibles: [
    { id: "dg08.stone.warp", name: "Warp-bench stone", optional: true, from: "glass-warp" },
    { id: "dg08.stone.jury", name: "Jury stone", optional: true, from: "light-candle" },
  ],
  enemies: [
    {
      id: "dg08.enemy.shadeClerk",
      name: "Shade clerk",
      hp: 3,
      damage: 1,
      movement: "cardinal",
      telegraph: "An afterimage flickers on the tile the clerk will step to, one beat later, copying Ellis's last cardinal step.",
    },
  ],
  puzzles: [],
  rooms: [],
  miniboss: {},
  boss: {},
};

dg08.puzzles = [
  testimony("dg08.puz.night", "dg08.r01", ["PLACE", "N"], "dg08.night", false, ["E", "W", "S"]),
  expandPuzzle({
    id: "dg08.puz.sconces",
    room: "dg08.r03",
    type: "toggles",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    count: 3,
    initial: 0,
    goal: 7,
    latchFlag: "dg08.sconces",
    meaning: "Three sconces with carved sun-marks. All three lit. Marks are readable in the dark by touch.",
    reset: "Bell returns spare lanterns to pedestals and the player's lamp to the hand.",
  }),
  testimony("dg08.puz.shadow", "dg08.r04", ["N", "N", "E", "RING"], "dg08.shadow", true, ["S", "W", "WAIT"]),
  expandPuzzle({
    id: "dg08.puz.well",
    room: "dg08.r06",
    type: "explicit",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg08.well",
    initial: "near",
    terminal: "crossed",
    states: {
      near: { safe: true, note: "Near bell is in reach. A hasty step is shoved back to this tile, not sealed in." },
      crossed: { safe: true, terminal: true, note: "Far side. Far bell is on this side. South door remains." },
    },
    edges: [
      { from: "near", on: "wait", to: "near" },
      { from: "near", on: "north", to: "crossed" },
      { from: "near", on: "hasty-step", to: "near", note: "Gate shoves Ellis back to the near bell." },
      { from: "crossed", on: "south", to: "near" },
      { from: "crossed", on: "bell", to: "near", reset: true, preservesKeys: true, preservesLatched: true },
      { from: "near", on: "bell", to: "near", reset: true, preservesKeys: true, preservesLatched: true },
    ],
    solution: ["wait", "north"],
    reset: "Either bell returns Ellis to the near side and clears the local rail. The shove-back means a mistake never closes the only bell away.",
  }),
  expandPuzzle({
    id: "dg08.puz.exhibit",
    room: "dg08.r08",
    type: "adjacentSwap",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    initial: ["PAGE", "LANTERN", "NAIL"],
    goal: ["NAIL", "PAGE", "LANTERN"],
    latchFlag: "dg08.exhibit",
    reset: "Bell returns the three objects to page, lantern, nail.",
  }),
  expandPuzzle({
    id: "dg08.puz.lanterns",
    room: "dg08.r09",
    type: "toggles",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    count: 4,
    initial: 0,
    goal: 5,
    latchFlag: "dg08.lanterns",
    meaning: "Binary 0101 is pedestals one and three, the ones with scorch marks. Pedestals toggle. Dark tiles sting and do not block the center aisle.",
    reset: "Bell returns every spare lantern to its pedestal.",
  }),
  testimony("dg08.puz.cross", "dg08.r10", ["N", "N", "S"], "dg08.cross", true, ["E", "W", "WAIT"]),
  testimony("dg08.puz.record", "dg08.r12", ["N", "E", "E", "N", "RING"], "dg08.record", true, ["S", "W", "WAIT"]),
];

function r(partial) {
  return room(partial);
}

const bell = (x, y, id = "clerk-bell") =>
  interact({
    id,
    x,
    y,
    verb: "Ring the clerk's bell",
    note: "Clears the local testimony rail and returns spare lights. Does not take keys, evidence, or latched doors.",
  });

dg08.rooms = [
  r({
    id: "dg08.r01",
    name: "Night Stair",
    summary:
      "The Vergennes annex stair. An exemplar places a lantern and steps north. The floor repeats it. The rail shows Ellis's beats. The bell is at the landing. The north door waits on that short match so the court is not entered by accident.",
    latchFlags: ["dg08.night"],
    reset: { control: "clerk-bell", tile: [2, 8], resets: ["dg08.puz.night"], preserves: ["keys", "evidence", "latchedFlags"] },
    floor: hubGrid(["N", "S"], (g) => {
      g[6][6] = ",";
      g[8][2] = ",";
    }),
    spawn: { x: CX, y: 8 },
    exits: [
      exit({
        id: "to-docket",
        x: CX,
        y: 0,
        to: "dg08.r02",
        dir: "N",
        requiresFlags: ["dg08.night"],
      }),
      exit({
        id: "to-town",
        x: CX,
        y: H - 1,
        to: "overworld.vergennes.falls-annex",
        dir: "S",
        external: true,
      }),
    ],
    interactions: [
      bell(2, 8),
      interact({
        id: "solve-night",
        x: 6,
        y: 6,
        verb: "Place the lantern, then step north, as the exemplar is doing",
        puzzle: "dg08.puz.night",
        requiresTools: ["lamp"],
        setsFlags: ["dg08.night"],
      }),
    ],
    solutionTrace: [
      "Watch the exemplar: PLACE, then N.",
      "Do that. The rail fills two beats.",
      "If the rail is wrong, ring the bell and watch the exemplar again.",
    ],
  }),
  r({
    id: "dg08.r02",
    name: "Docket Hall",
    summary:
      "The case is cut into the benches: The Town versus The Unmeasured Life. The Voice and the Other Voice answer the same line from opposite benches. This contradiction is required evidence for the crown proposal. After the playable record exists, an east corridor shortcuts to the threshold.",
    floor: hubGrid(["N", "S", "E"], (g) => {
      g[6][3] = ",";
      g[6][11] = ",";
    }),
    exits: [
      exit({ id: "to-stair", x: CX, y: H - 1, to: "dg08.r01", dir: "S" }),
      exit({ id: "to-sconces", x: CX, y: 0, to: "dg08.r03", dir: "N" }),
      exit({
        id: "shortcut-to-threshold",
        x: W - 1,
        y: CY,
        to: "dg08.r14",
        dir: "E",
        requiresFlags: ["dg08.record"],
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "read-docket",
        x: 3,
        y: 6,
        verb: "Read both benches",
        givesEvidence: ["dg08.ev.docket", "dg08.ev.contradiction"],
      }),
    ],
    solutionTrace: [
      "Read both benches. They disagree on purpose and on the record.",
      "Go north. East is closed until the playable record exists.",
    ],
  }),
  r({
    id: "dg08.r03",
    name: "Sconce Gallery",
    summary:
      "Three court sconces with sun-marks carved into the metal, readable by touch. Spare lanterns start on pedestals. Lighting all three opens the north door. The player's lamp can be set down and picked up. The bell restores every spare.",
    latchFlags: ["dg08.sconces"],
    reset: { control: "clerk-bell", tile: [2, 2], resets: ["dg08.puz.sconces"], preserves: ["keys", "evidence", "latchedFlags"] },
    floor: hubGrid(["N", "S"], (g) => {
      g[3][3] = ",";
      g[3][7] = ",";
      g[3][11] = ",";
      g[2][2] = ",";
    }),
    exits: [
      exit({ id: "to-docket", x: CX, y: H - 1, to: "dg08.r02", dir: "S" }),
      exit({
        id: "to-shadow",
        x: CX,
        y: 0,
        to: "dg08.r04",
        dir: "N",
        requiresFlags: ["dg08.sconces"],
      }),
    ],
    interactions: [
      bell(2, 2),
      interact({
        id: "solve-sconces",
        x: 3,
        y: 3,
        verb: "Light the three sun-marked sconces",
        puzzle: "dg08.puz.sconces",
        requiresTools: ["lamp"],
        setsFlags: ["dg08.sconces"],
      }),
    ],
    solutionTrace: ["Light each sun-marked sconce. They toggle.", "Ring the bell if a spare is lost.", "Go north."],
  }),
  r({
    id: "dg08.r04",
    name: "Shadow Bar",
    summary:
      "The first real copy. Exemplar and floor inlay agree: north, north, east, ring. The rail shows mismatches in red wax. The bell clears only the rail. The north door latches on a match.",
    latchFlags: ["dg08.shadow"],
    reset: { control: "clerk-bell", tile: [2, 2], resets: ["dg08.puz.shadow"], preserves: ["keys", "evidence", "latchedFlags"] },
    floor: hubGrid(["N", "S"], (g) => {
      g[4][7] = ",";
      g[6][7] = ",";
      g[6][9] = ",";
      g[2][2] = ",";
    }),
    exits: [
      exit({ id: "to-sconces", x: CX, y: H - 1, to: "dg08.r03", dir: "S" }),
      exit({
        id: "to-benches",
        x: CX,
        y: 0,
        to: "dg08.r05",
        dir: "N",
        requiresFlags: ["dg08.shadow"],
      }),
    ],
    interactions: [
      bell(2, 2),
      interact({
        id: "solve-shadow",
        x: 7,
        y: 4,
        verb: "Match the exemplar on the rail",
        puzzle: "dg08.puz.shadow",
        setsFlags: ["dg08.shadow"],
      }),
    ],
    solutionTrace: [
      "Read the floor inlay or watch the loop.",
      "Step N, N, E, and ring.",
      "A wrong beat returns the rail to empty, which is the same thing the bell does.",
    ],
  }),
  r({
    id: "dg08.r05",
    name: "Witness Benches",
    summary:
      "Shade clerks copy the last cardinal step after a visible afterimage. A scrap under the bench records how the bell is meant to work. Two glass panes at the sides are an optional warp to a stone on the far bench; walking around also reaches it.",
    floor: hubGrid(["N", "S"], (g) => {
      g[3][3] = ",";
      g[3][11] = ",";
      g[7][4] = ",";
    }),
    exits: [
      exit({ id: "to-shadow", x: CX, y: H - 1, to: "dg08.r04", dir: "S" }),
      exit({ id: "to-well", x: CX, y: 0, to: "dg08.r06", dir: "N" }),
    ],
    interactions: [
      interact({
        id: "read-bench",
        x: 4,
        y: 7,
        verb: "Read the scrap under the bench",
        givesEvidence: ["dg08.ev.bench"],
      }),
      interact({
        id: "glass-warp",
        x: 11,
        y: 3,
        verb: "Warp between the bench panes",
        requiresTools: ["glassWarp"],
        optional: true,
        givesCollectibles: ["dg08.stone.warp"],
      }),
    ],
    encounters: [{ enemy: "dg08.enemy.shadeClerk", count: 2, tiles: [[3, 8], [11, 8]] }],
    solutionTrace: ["Read the scrap.", "Walk north. The panes are optional."],
  }),
  r({
    id: "dg08.r06",
    name: "Clerk's Well",
    summary:
      "A stair around a well. The exemplar waits, then steps north. A hasty step is shoved back to the near bell; it does not close a gate between Ellis and every bell. The far side has its own bell. Sugar-line is not the stair.",
    latchFlags: ["dg08.well"],
    reset: { control: "either-bell", tile: [2, 8], resets: ["dg08.puz.well"], preserves: ["keys", "evidence", "latchedFlags"] },
    floor: hubGrid(["N", "S"], (g) => {
      g[4][4] = "#";
      g[4][10] = "#";
      g[6][4] = "#";
      g[6][10] = "#";
      g[8][2] = ",";
      g[2][12] = ",";
    }),
    exits: [
      exit({ id: "to-benches", x: CX, y: H - 1, to: "dg08.r05", dir: "S" }),
      exit({
        id: "to-bailiff",
        x: CX,
        y: 0,
        to: "dg08.r07",
        dir: "N",
        requiresFlags: ["dg08.well"],
      }),
    ],
    interactions: [
      bell(2, 8, "clerk-bell"),
      bell(12, 2, "far-bell"),
      interact({
        id: "solve-well",
        x: CX,
        y: 7,
        verb: "Wait, then step north",
        puzzle: "dg08.puz.well",
        setsFlags: ["dg08.well"],
      }),
      interact({
        id: "sugar-well",
        x: 3,
        y: 5,
        verb: "Hook a coin on the well lip",
        requiresTools: ["sugarLine"],
        optional: true,
        note: "A coin. The stair is the path.",
      }),
    ],
    solutionTrace: [
      "Wait on the near side, then step north.",
      "If shoved back, you are still at the near bell.",
      "Go north once the far landing is open.",
    ],
  }),
  r({
    id: "dg08.r07",
    name: "The Bailiff of Shade",
    summary:
      "Miniboss. The bailiff copies Ellis's previous step. The banner names that step before the copy happens. Feeding it WAIT makes it stall for three strikes. The bell clears the buffer and, once the strikes have started, does not refund them to zero. The cage key drops here.",
    latchFlags: ["dg08.bailiff"],
    reset: { control: "clerk-bell", tile: [2, 2], resets: ["miniboss-buffer"], preserves: ["keys", "evidence", "latchedFlags", "minibossHits"] },
    floor: hubGrid(["N", "S"], (g) => {
      g[2][2] = ",";
      g[4][9] = ",";
    }),
    exits: [
      exit({ id: "to-well", x: CX, y: H - 1, to: "dg08.r06", dir: "S" }),
      exit({
        id: "to-cage",
        x: CX,
        y: 0,
        to: "dg08.r08",
        dir: "N",
        requiresFlags: ["dg08.bailiff"],
        requiresKeys: ["dg08.sk.cage"],
        setsFlags: ["dg08.lock.cage.open"],
      }),
    ],
    interactions: [
      bell(2, 2),
      interact({
        id: "defeat-bailiff",
        x: 9,
        y: 4,
        verb: "Feed the bailiff a WAIT and strike the stall",
        setsFlags: ["dg08.bailiff"],
        givesKeys: ["dg08.sk.cage"],
      }),
    ],
    solutionTrace: [
      "Read the banner.",
      "WAIT. When the banner reads WAIT and the bailiff stalls, strike three times.",
      "Take the cage key north.",
    ],
  }),
  r({
    id: "dg08.r08",
    name: "Evidence Cage",
    summary:
      "Three exhibits: a nail, a page, a lantern miniature. The card in the cage and the stamps on their bases say nail, page, lantern. Swapping neighbors sorts them. The bell spills them back to the starting order. This is the playable exhibit, not a password.",
    latchFlags: ["dg08.exhibit"],
    reset: { control: "clerk-bell", tile: [2, 2], resets: ["dg08.puz.exhibit"], preserves: ["keys", "evidence", "latchedFlags"] },
    floor: hubGrid(["N", "S"], (g) => {
      g[6][4] = ",";
      g[6][7] = ",";
      g[6][10] = ",";
      g[2][2] = ",";
    }),
    exits: [
      exit({ id: "to-bailiff", x: CX, y: H - 1, to: "dg08.r07", dir: "S" }),
      exit({
        id: "to-lanterns",
        x: CX,
        y: 0,
        to: "dg08.r09",
        dir: "N",
        requiresFlags: ["dg08.exhibit"],
      }),
    ],
    interactions: [
      bell(2, 2),
      interact({
        id: "solve-exhibit",
        x: 4,
        y: 6,
        verb: "Order the exhibits nail, page, lantern",
        puzzle: "dg08.puz.exhibit",
        setsFlags: ["dg08.exhibit"],
        givesEvidence: ["dg08.ev.exhibit"],
      }),
    ],
    solutionTrace: ["Read the card on the table.", "Swap until nail, page, lantern.", "Go north."],
  }),
  r({
    id: "dg08.r09",
    name: "Lantern Stairs",
    summary:
      "Four pedestals. Scorch marks the first and the third. Dark tiles off the aisle sting if walked unlit; the center aisle is the door path and is not dark. Spare lanterns toggle the pedestals. The bell puts them back. No placement can wall the aisle, because lanterns are not blocks.",
    latchFlags: ["dg08.lanterns"],
    reset: { control: "clerk-bell", tile: [2, 8], resets: ["dg08.puz.lanterns"], preserves: ["keys", "evidence", "latchedFlags"] },
    floor: hubGrid(["N", "S"], (g) => {
      g[3][3] = "!";
      g[3][4] = "!";
      g[8][10] = "!";
      g[8][11] = "!";
      g[3][2] = ",";
      g[6][11] = ",";
    }),
    exits: [
      exit({ id: "to-cage", x: CX, y: H - 1, to: "dg08.r08", dir: "S" }),
      exit({
        id: "to-cross",
        x: CX,
        y: 0,
        to: "dg08.r10",
        dir: "N",
        requiresFlags: ["dg08.lanterns"],
      }),
    ],
    interactions: [
      bell(2, 8),
      interact({
        id: "solve-lanterns",
        x: 2,
        y: 3,
        verb: "Light the scorched pedestals, first and third",
        puzzle: "dg08.puz.lanterns",
        requiresTools: ["lamp"],
        setsFlags: ["dg08.lanterns"],
      }),
    ],
    hazardNote: "Exclamation tiles are unlit corners. They damage. The aisle x=7 is clear.",
    solutionTrace: ["Light pedestal one and pedestal three. Leave two and four dark.", "Walk the center aisle north."],
  }),
  r({
    id: "dg08.r10",
    name: "Cross-Examination",
    summary:
      "Ellis's rail and a shadow's rail. The shadow copies direction. Arrows on Ellis's rail read north, north, south. The shadow's next tile is chalked first. There is no pit; a wrong copy walks onto a plate that simply does not latch, and the bell returns both bodies to the start marks.",
    latchFlags: ["dg08.cross"],
    reset: { control: "clerk-bell", tile: [2, 2], resets: ["dg08.puz.cross"], preserves: ["keys", "evidence", "latchedFlags"] },
    floor: hubGrid(["N", "S", "E"], (g) => {
      g[3][4] = ",";
      g[3][10] = ",";
      g[2][2] = ",";
    }),
    exits: [
      exit({ id: "to-lanterns", x: CX, y: H - 1, to: "dg08.r09", dir: "S" }),
      exit({
        id: "to-record",
        x: CX,
        y: 0,
        to: "dg08.r12",
        dir: "N",
        requiresFlags: ["dg08.cross"],
      }),
      exit({ id: "to-jury", x: W - 1, y: CY, to: "dg08.r11", dir: "E" }),
    ],
    interactions: [
      bell(2, 2),
      interact({
        id: "solve-cross",
        x: 4,
        y: 3,
        verb: "Lead the copy north, north, south",
        puzzle: "dg08.puz.cross",
        setsFlags: ["dg08.cross"],
      }),
    ],
    solutionTrace: [
      "Read the arrows.",
      "Step N, N, S. Watch the chalk on the far rail before each copy.",
      "North is the record. East is the jury loft, which is not required.",
    ],
  }),
  r({
    id: "dg08.r11",
    name: "Jury Loft",
    summary:
      "Optional loft. A candle on the far ledge opens a niche. Ellis can walk the ledge and light it with the lamp. A bow can snuff-and-relight it from the door as the same latch's optional twin. The niche is a stone. The saint's road does not come through here; the court's road does not either.",
    optional: true,
    floor: hubGrid(["W"], (g) => {
      g[3][10] = ",";
      g[6][4] = ",";
    }),
    exits: [exit({ id: "back-cross", x: 0, y: CY, to: "dg08.r10", dir: "W" })],
    interactions: [
      interact({
        id: "light-candle",
        x: 10,
        y: 3,
        verb: "Walk the ledge and light the candle",
        requiresTools: ["lamp"],
        optional: true,
        givesCollectibles: ["dg08.stone.jury"],
      }),
      interact({
        id: "bow-candle",
        x: 4,
        y: 6,
        verb: "Loose a blunt at the candle from the door",
        requiresTools: ["bow"],
        optional: true,
        givesCollectibles: ["dg08.stone.jury"],
        note: "Same stone as walking the ledge. The bow is not the only hand.",
      }),
    ],
    solutionTrace: ["Light the candle by walking to it.", "Return west."],
  }),
  r({
    id: "dg08.r12",
    name: "The Playable Record",
    summary:
      "The heart of the court. Five beats, looped by an exemplar and cut into the wall: north, east, east, north, ring. The rail compares live. Success writes the playable record, which the Second Crown proposal requires. Failure returns the rail to empty. The bell does the same and keeps every key.",
    latchFlags: ["dg08.record"],
    reset: { control: "clerk-bell", tile: [2, 2], resets: ["dg08.puz.record"], preserves: ["keys", "evidence", "latchedFlags"] },
    floor: hubGrid(["N", "S"], (g) => {
      g[5][4] = ",";
      g[5][10] = ",";
      g[2][2] = ",";
    }),
    exits: [
      exit({ id: "to-cross", x: CX, y: H - 1, to: "dg08.r10", dir: "S" }),
      exit({
        id: "to-threshold",
        x: CX,
        y: 0,
        to: "dg08.r14",
        dir: "N",
        requiresFlags: ["dg08.record"],
      }),
    ],
    interactions: [
      bell(2, 2),
      interact({
        id: "solve-record",
        x: 4,
        y: 5,
        verb: "Walk the carved five beats",
        puzzle: "dg08.puz.record",
        setsFlags: ["dg08.record"],
        givesEvidence: ["dg08.ev.playable"],
      }),
    ],
    solutionTrace: [
      "Watch one loop or read the wall.",
      "N, E, E, N, RING.",
      "The record latches. Go north.",
    ],
  }),
  r({
    id: "dg08.r13",
    name: "Face Gallery",
    summary:
      "Optional portraits, faces planed off. The lamp finds years fourteen apart, starting from the Bridport birth the library already showed. Lighting them all is a stone's worth of looking and is reversible. The crown does not ask for a count.",
    optional: true,
    floor: hubGrid(["E"], (g) => {
      for (let x = 3; x <= 11; x += 2) g[4][x] = ",";
    }),
    exits: [exit({ id: "back-threshold", x: W - 1, y: CY, to: "dg08.r14", dir: "E" })],
    interactions: [
      interact({
        id: "read-portraits",
        x: 3,
        y: 4,
        verb: "Read the years under the lamp",
        requiresTools: ["lamp"],
        givesEvidence: ["dg08.ev.portraits"],
      }),
    ],
    solutionTrace: ["Raise the lamp.", "Read. Leave east. Do not hunt a mouth."],
  }),
  r({
    id: "dg08.r14",
    name: "Crown Threshold",
    summary:
      "A dry landing. The lantern key sits in a drawer that opens because the playable record is latched. West is the face gallery. South returns to the record. East, on a later body, returns to the docket. The key is a key.",
    floor: hubGrid(["N", "S", "W", "E"]),
    exits: [
      exit({ id: "to-record", x: CX, y: H - 1, to: "dg08.r12", dir: "S" }),
      exit({ id: "to-session", x: CX, y: 0, to: "dg08.r15", dir: "N" }),
      exit({ id: "to-faces", x: 0, y: CY, to: "dg08.r13", dir: "W" }),
      exit({
        id: "shortcut-to-docket",
        x: W - 1,
        y: CY,
        to: "dg08.r02",
        dir: "E",
        requiresFlags: ["dg08.record"],
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "take-big-key",
        x: 4,
        y: 6,
        verb: "Take the lantern key",
        requiresFlags: ["dg08.record"],
        givesKeys: ["dg08.bk.lantern"],
      }),
    ],
    solutionTrace: ["Take the lantern key.", "Go north. West is optional."],
  }),
  r({
    id: "dg08.r15",
    name: "Court is in Session",
    summary:
      "The bar before the witness. The fight is cut into the bar in order: lanterns as the exemplar places them, chalk before any lunge, lamp on the empty stand. A bell here clears a bad buffer and does not dump the cage key.",
    floor: hubGrid(["N", "S"], (g) => {
      g[6][4] = ",";
      g[6][2] = ",";
    }),
    exits: [
      exit({ id: "to-threshold", x: CX, y: H - 1, to: "dg08.r14", dir: "S" }),
      exit({
        id: "to-witness",
        x: CX,
        y: 0,
        to: "dg08.r16",
        dir: "N",
        requiresKeys: ["dg08.bk.lantern"],
        setsFlags: ["dg08.lock.boss.open"],
      }),
    ],
    interactions: [
      bell(2, 6),
      interact({
        id: "read-bar",
        x: 4,
        y: 6,
        verb: "Read the bar",
        note: "Left, right, bench. Then the chalk. Then the center stand. The words stay during the fight on the docket board inside.",
      }),
    ],
    solutionTrace: ["Read the bar.", "Open the north door with the lantern key."],
  }),
  r({
    id: "dg08.r16",
    name: "The Witness Without a Face",
    summary:
      "Boss. An empty face asks to be worn. Ellis places lanterns where the exemplar places them, reads the chalk copy before each lunge, and sets the lamp on the center stand instead of offering a face. The bell clears a bad copy and keeps the hit count already landed. Adjournment resolves the Second Crown as a proposal.",
    latchFlags: ["dg08.boss", "dg08.crown2.resolved"],
    reset: {
      control: "clerk-bell",
      tile: [2, 8],
      resets: ["boss-buffer", "uncommitted-lanterns"],
      preserves: ["keys", "evidence", "latchedFlags", "bossHitsThisPhase"],
    },
    floor: hubGrid(["S"], (g) => {
      g[3][3] = ",";
      g[3][11] = ",";
      g[6][7] = ",";
      g[8][2] = ",";
    }),
    exits: [exit({ id: "to-session", x: CX, y: H - 1, to: "dg08.r15", dir: "S" })],
    interactions: [
      bell(2, 8),
      interact({
        id: "defeat-witness",
        x: CX,
        y: 6,
        verb: "Adjourn the witness without lending a face",
        setsFlags: ["dg08.boss", "dg08.crown2.resolved"],
        givesEvidence: ["dg08.ev.adjourned"],
      }),
    ],
    solutionTrace: [
      "Place lanterns left, right, and bench as the exemplar does. Strike the solid shadow three times.",
      "Read the chalk. Step aside. Strike three times on the recovery. Ring the bell if the copy is garbage; the strikes already landed stay.",
      "Set the lamp on the center stand. Strike four times. The crown event is proposed at adjournment, not before.",
    ],
  }),
];

dg08.miniboss = {
  id: "dg08.miniboss.bailiff",
  name: "The Bailiff of Shade",
  room: "dg08.r07",
  distinctFromBoss: true,
  copyReadable: true,
  fsm: {
    initial: "mirror",
    terminal: "defeated",
    resetFromAny: true,
    states: bailiffStates,
    edges: bailiffEdges,
    solution: ["feed-wait", "bailiff-copies-wait", "strike", "strike", "strike"],
  },
};

dg08.boss = {
  id: "dg08.boss.witness",
  name: "The Witness Without a Face",
  room: "dg08.r16",
  arenaLeavesExits: true,
  copyReadable: true,
  copyPreview: "chalk",
  bellPreservesHits: true,
  resolvesCrown: 2,
  grantsEmbryonicGod: false,
  fsm: {
    initial: "call_to_order",
    terminal: "adjourned",
    resetFromAny: true,
    states: witnessStates,
    edges: witnessEdges,
    solution: [
      "approach",
      "place-three-lanterns",
      "strike",
      "strike",
      "strike",
      "chalk-shows-copy",
      "lunge-recovers",
      "strike",
      "strike",
      "strike",
      "place-lamp-on-center-stand",
      "strike",
      "strike",
      "strike",
      "strike",
    ],
  },
};
