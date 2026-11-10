import {
  H,
  W,
  doorTile,
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

function withReset(states, edges, back = "dormant") {
  for (const id of Object.keys(states)) {
    if (id !== back && !states[id].terminal) {
      edges.push({
        from: id,
        on: "death-or-leave-resets-fight",
        to: back,
        reset: true,
        note: "Losing the body returns the fight to its first beat. It does not return keys.",
      });
    }
  }
  return { states, edges };
}

const handHits = hitChain(
  "hand",
  4,
  "defeated",
  "All four notched presses are lit. The Marginal Hand crosses the aisle in the open.",
);
const p1 = hitChain(
  "p1",
  3,
  "phase2_deletion",
  "The four shelves sit in their carved sockets. The Erratum is correctable.",
);
const p2 = hitChain(
  "p2",
  3,
  "phase3_lines",
  "Two sconces pin the erasure. Strike while the quadrants stay lit.",
);
const p3 = hitChain(
  "p3",
  4,
  "bound",
  "The false line is the one with the cracked marble end. Break that one only.",
);

const erratumStates = {
  dormant: {
    terminal: false,
    safe: true,
    note: "The arena is a cross of four shelf-lanes. Sockets are carved in the floor and visible without the lamp. The Erratum is a standing deletion-mark of torn pages and marble dust.",
  },
  phase1_edit: {
    terminal: false,
    safe: true,
    tell: "It lifts two shelves. A marble comma rises from the floor a beat before the swap.",
    note: "Push shelves back onto the sockets labeled with the same end-carving. Any swap can be undone. The comma is the telegraph.",
  },
  phase2_deletion: {
    terminal: false,
    safe: true,
    tell: "Ink drains off two quadrants. The sconces there go dark; their brass collars are still visible.",
    note: "Set the carried lamp and the room's spare lantern on the two dark sconces. Walking the dark quadrant hurts; it does not close exits.",
  },
  phase3_lines: {
    terminal: false,
    safe: true,
    tell: "Three errata lines drop as bars. One end-cap is cracked. The crack is visible with the lamp lowered.",
    note: "Break only the cracked line (hammer if owned, otherwise four strikes on that bar). Whole lines damage and do not advance.",
  },
  bound: {
    terminal: true,
    safe: true,
    setsFlags: ["dg05.boss"],
    givesEvidence: ["dg05.ev.restoredPage"],
    note: "The Erratum collapses into one page that will hold a true line. The north stair back is the south door already open.",
  },
  ...handHits.states,
  ...p1.states,
  ...p2.states,
  ...p3.states,
};
// hand hits were mixed in by mistake; remove them from the boss
for (const k of Object.keys(handHits.states)) delete erratumStates[k];

const erratumEdges = [
  { from: "dormant", on: "approach", to: "phase1_edit" },
  { from: "phase1_edit", on: "shelves-match-sockets", to: p1.first },
  { from: "p1_h0", on: "window-timeout", to: "phase1_edit" },
  { from: "p1_h1", on: "window-timeout", to: "phase1_edit" },
  { from: "p1_h2", on: "window-timeout", to: "phase1_edit" },
  { from: "phase2_deletion", on: "relight-two-sconces", to: p2.first },
  { from: "phase3_lines", on: "break-false-line", to: p3.first },
  ...p1.edges,
  ...p2.edges,
  ...p3.edges,
];
withReset(erratumStates, erratumEdges, "dormant");

const handStates = {
  crawl: {
    terminal: false,
    safe: true,
    note: "The hand patrols the aisle. Shelf-presses are dark. Exits south and, after the fight, north stay open tiles; the north door's latch is the defeat flag, not a closing wall.",
  },
  exposed: {
    terminal: false,
    safe: true,
    tell: "The hand rears when every notched press is lit, then commits to the aisle.",
  },
  defeated: {
    terminal: true,
    safe: true,
    setsFlags: ["dg05.miniboss"],
    givesKeys: ["dg05.sk.margin"],
  },
  ...handHits.states,
};
const handEdges = [
  { from: "crawl", on: "light-all-notched-presses", to: "exposed" },
  { from: "exposed", on: "a-press-goes-dark", to: "crawl" },
  { from: "exposed", on: "hand-enters-aisle", to: handHits.first },
  ...handHits.edges,
];
withReset(handStates, handEdges, "crawl");

function aisleGrid() {
  const path = new Set(
    [
      [7, 10],
      [7, 9],
      [7, 8],
      [6, 8],
      [5, 8],
      [5, 7],
      [5, 6],
      [6, 6],
      [7, 6],
      [7, 5],
      [7, 4],
      [8, 4],
      [9, 4],
      [9, 3],
      [9, 2],
      [8, 2],
      [7, 2],
      [7, 1],
      [7, 0],
    ].map(([x, y]) => `${x},${y}`),
  );
  return grid({
    doors: [
      { x: 7, y: 0, ch: "." },
      { x: 7, y: 10, ch: "." },
      { x: 0, y: 5, ch: "." },
    ],
    paint(g) {
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) g[y][x] = "!";
      }
      for (const key of path) {
        const [x, y] = key.split(",").map(Number);
        if (g[y][x] !== "#") g[y][x] = ".";
      }
      // west hammer-door must sit on a safe tile and touch the path
      g[5][1] = ".";
      g[5][2] = ".";
      g[5][3] = ".";
      g[5][4] = ".";
      g[5][5] = ".";
    },
  });
}

const AISLE_SAFE = [
  [7, 10],
  [7, 9],
  [7, 8],
  [6, 8],
  [5, 8],
  [5, 7],
  [5, 6],
  [6, 6],
  [7, 6],
  [7, 5],
  [7, 4],
  [8, 4],
  [9, 4],
  [9, 3],
  [9, 2],
  [8, 2],
  [7, 2],
  [7, 1],
  [7, 0],
];

export const dg05 = {
  id: "dg05",
  name: "The White Library",
  sequence: 5,
  county: "Addison County, Vermont",
  town: "Middlebury",
  site: "The closed ledger annex under Merchant's Row, cut into the same white marble the county used for steps. Otter Creek falls are audible through the north wall and never shown.",
  premise:
    "Public shelves keep the births Middlebury was willing to claim. A second stack keeps the dates the clerks scratched out. Ink mixed with marble dust shows only under a lamp. Nothing in the stack asks Ellis to type, speak, or remember a word that is not physically present while it is being used.",
  bossId: "dg05.boss.erratum",
  minibossId: "dg05.miniboss.marginalHand",
  entranceRoom: "dg05.r01",
  goalFlag: "dg05.boss",
  initialLevel: null,
  requiredTools: ["lamp"],
  optionalTools: ["hammer", "sugarLine", "shovel"],
  designAssertions: ["noFreeText", "shownSolutions", "fairClues"],
  input: {
    combat: "four-direction",
    keyboard: "cardinal movement and a single action",
    touch: "cardinal pad and tap on the interaction tile",
    parity: "Every exit and interaction has a tile. No chord is keyboard-only.",
  },
  entry: {
    campaignPrerequisites: [
      {
        id: "tool.lamp",
        external: true,
        kind: "tool",
        note: "The lamp is already Ellis's. This pack does not invent the dungeon that first hands it over.",
      },
      {
        id: "story.vein.heardVoice",
        external: true,
        kind: "flag",
        note: "Ellis has heard the Voice once at the Marble Vein. The Other Voice is not required yet.",
      },
    ],
    standalonePrerequisites: [{ tool: "lamp" }],
    assumedGrantedFlags: ["story.vein.heardVoice"],
    proposedUnlocks: [
      {
        id: "dg06.entry.unbarred",
        whenFlag: "dg05.boss",
        kind: "proposed-campaign-link",
        notRuntimeApi: true,
        note: "When the Erratum is bound, the Weybridge mill-race door (DG06) is the next proposed threshold. A standalone visit to DG06 may still assume this flag already granted.",
      },
    ],
  },
  death: {
    checkpointRoom: "dg05.r01",
    ageAdvanceYears: 14,
    keysPersist: true,
    evidencePersists: true,
    latchedFlagsPersist: true,
    bossResetsUnlessDefeated: true,
    unsolvedPuzzlesReset: true,
    enemiesRespawn: true,
    cannotSpawnInDeepWater: true,
    cannotSpawnOnBlock: true,
    epitaph:
      "In {roomName}, the body stopped. Ellis Perch drew the next breath fourteen years on. The shelves did not add a year; the county will, if it notices.",
    voiceOnReentry:
      "The vein kept the years you did not get to live. The library only files them.",
    otherVoiceOnReentry:
      "Fourteen years is a clerk's habit, not a sacrament. The door is where you left it.",
    onReentrySolvedRooms:
      "If a latch flag is set, the room is rebuilt in its solved pose. Half-moved shelves are not waiting to cage the next body.",
  },
  routes: {
    main: [
      { do: "exit", id: "to-catalog" },
      { do: "exit", id: "to-dates" },
      { do: "interact", id: "solve-wheels" },
      { do: "exit", id: "to-index" },
      { do: "interact", id: "solve-shelves" },
      { do: "exit", id: "to-stacks" },
      { do: "exit", id: "to-stair" },
      { do: "interact", id: "take-shelf-key" },
      { do: "exit", id: "to-carrel" },
      { do: "interact", id: "solve-baffles" },
      { do: "exit", id: "to-mezzanine" },
      { do: "interact", id: "solve-truck" },
      { do: "exit", id: "to-hand" },
      { do: "interact", id: "defeat-hand" },
      { do: "exit", id: "to-aisle" },
      { do: "interact", id: "solve-aisle" },
      { do: "exit", id: "to-sealed" },
      { do: "interact", id: "solve-books" },
      { do: "exit", id: "to-well" },
      { do: "interact", id: "solve-well" },
      { do: "exit", id: "to-bindery" },
      { do: "interact", id: "solve-bindery" },
      { do: "interact", id: "take-big-key" },
      { do: "exit", id: "to-door" },
      { do: "exit", id: "to-erratum" },
      { do: "interact", id: "defeat-erratum" },
    ],
    optionalBranches: [
      {
        id: "dg05.branch.gallery",
        rooms: ["dg05.r09"],
        script: [
          { do: "exit", id: "to-catalog" },
          { do: "exit", id: "to-dates" },
          { do: "interact", id: "solve-wheels" },
          { do: "exit", id: "to-index" },
          { do: "interact", id: "solve-shelves" },
          { do: "exit", id: "to-stacks" },
          { do: "exit", id: "to-gallery" },
          { do: "interact", id: "read-names" },
          { do: "interact", id: "take-dust-key" },
          { do: "exit", id: "back-stacks" },
          { do: "interact", id: "open-dust-cache" },
        ],
      },
    ],
    shortcut: {
      id: "dg05.short.carrel-index",
      description:
        "Once the sealed carrel has been solved, a return stair joins Index Hall directly to that carrel. A later body can skip the stacks, the stair, the mezzanine, the hand, and the ink aisle.",
      from: "dg05.r04",
      to: "dg05.r12",
      skipsRooms: ["dg05.r05", "dg05.r06", "dg05.r07", "dg05.r08", "dg05.r10", "dg05.r11"],
      assumeFlags: [
        "dg05.wheels",
        "dg05.shelves",
        "dg05.baffles",
        "dg05.truck",
        "dg05.miniboss",
        "dg05.aisle",
        "dg05.books",
      ],
      assumeKeys: ["dg05.sk.shelf", "dg05.sk.margin"],
      startRoom: "dg05.r01",
      script: [
        { do: "exit", id: "to-catalog" },
        { do: "exit", id: "to-dates" },
        { do: "exit", id: "to-index" },
        { do: "exit", id: "shortcut-to-carrel" },
        { do: "exit", id: "to-well" },
        { do: "interact", id: "solve-well" },
        { do: "exit", id: "to-bindery" },
        { do: "interact", id: "solve-bindery" },
        { do: "interact", id: "take-big-key" },
        { do: "exit", id: "to-door" },
        { do: "exit", id: "to-erratum" },
        { do: "interact", id: "defeat-erratum" },
      ],
    },
  },
  keys: [
    {
      id: "dg05.sk.shelf",
      kind: "small",
      name: "Shelf key",
      source: { room: "dg05.r06", interaction: "take-shelf-key" },
      opens: ["dg05.lock.carrel"],
    },
    {
      id: "dg05.sk.margin",
      kind: "small",
      name: "Margin key",
      source: { room: "dg05.r10", interaction: "defeat-hand" },
      opens: ["dg05.lock.sealed"],
    },
    {
      id: "dg05.sk.dust",
      kind: "optional",
      name: "Dust key",
      source: { room: "dg05.r09", interaction: "take-dust-key" },
      opens: ["dg05.lock.cache"],
    },
    {
      id: "dg05.bk.erratum",
      kind: "big",
      name: "Erratum key",
      source: { room: "dg05.r14", interaction: "take-big-key" },
      opens: ["dg05.lock.boss"],
    },
  ],
  locks: [
    {
      id: "dg05.lock.carrel",
      keyId: "dg05.sk.shelf",
      optional: false,
      exit: "to-carrel",
      room: "dg05.r06",
    },
    {
      id: "dg05.lock.sealed",
      keyId: "dg05.sk.margin",
      optional: false,
      exit: "to-sealed",
      room: "dg05.r11",
    },
    {
      id: "dg05.lock.cache",
      keyId: "dg05.sk.dust",
      optional: true,
      exit: null,
      interaction: "open-dust-cache",
      room: "dg05.r05",
    },
    {
      id: "dg05.lock.boss",
      keyId: "dg05.bk.erratum",
      optional: false,
      exit: "to-erratum",
      room: "dg05.r15",
    },
  ],
  clues: [
    {
      id: "dg05.clue.wheels.wall",
      puzzle: "dg05.puz.wheels",
      room: "dg05.r03",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "With the lamp up, the north plaster gives three scratched dates in order, each with an arrow into a wheel: 1863, 1919, 1961. They stay on the wall while the wheels are turned.",
    },
    {
      id: "dg05.clue.wheels.posted",
      puzzle: "dg05.puz.wheels",
      room: "dg05.r03",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "Each wheel's frame is carved POSTED and currently shows 1849, 1905, or 1947. A footer cut into the sill reads SCRATCHED, NOT POSTED. The other face of each wheel is the scratched date already written on the plaster.",
    },
    {
      id: "dg05.clue.shelves.floor",
      puzzle: "dg05.puz.shelves",
      room: "dg05.r04",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "Lamp on the floor ink: UNLIVED BEFORE MEASURE, DEATH OPPOSITE BIRTH. The ink is under the lamp in this room and does not have to be memorized.",
    },
    {
      id: "dg05.clue.shelves.beam",
      puzzle: "dg05.puz.shelves",
      room: "dg05.r04",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The ceiling beam is etched with the solved cross: west Birth, north Unlived, east Death, south Measure. End-carvings on the shelves match sockets of the same shape.",
    },
    {
      id: "dg05.clue.aisle.notches",
      puzzle: "dg05.puz.aisle",
      room: "dg05.r11",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      matchesRoomSafePath: true,
      notArbitrary: true,
      text: "The doorframe is notched with the same walk as the uninked stones. Ellis can read the frame with a hand, without stepping on ink.",
    },
    {
      id: "dg05.clue.aisle.lamp",
      puzzle: "dg05.puz.aisle",
      room: "dg05.r11",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "Under the lamp, uninked stones read KEEP and inked stones read STRIKE. The words sit on the stones themselves.",
    },
    {
      id: "dg05.clue.baffles.ticks",
      puzzle: "dg05.puz.baffles",
      room: "dg05.r07",
      fair: true,
      environmental: true,
      major: false,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "Three carved ticks on the desk show the beam: left, gap, right. The beam itself is visible when the lamp is on the sconce.",
    },
    {
      id: "dg05.clue.books.blotter",
      puzzle: "dg05.puz.books",
      room: "dg05.r12",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The desk blotter, under the lamp, shows circle then bar then wedge.",
    },
    {
      id: "dg05.clue.books.edge",
      puzzle: "dg05.puz.books",
      room: "dg05.r12",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The blotter's wooden edge is notched with the same three signs, circle then bar then wedge, so the order is still in the room when the lamp is lowered. The covers themselves are carved with those signs.",
    },
  ],
  evidence: [
    {
      id: "dg05.ev.catalogCard",
      name: "Uncirculated card",
      required: false,
      room: "dg05.r02",
      text: "A marble-backed card, letters cut, not inked: ERRATA — DO NOT CIRCULATE. Under it, smaller: births that resume are to be treated as corrections.",
    },
    {
      id: "dg05.ev.voiceSplit",
      name: "Two readings of one scratch",
      required: false,
      room: "dg05.r04",
      text: "West bench, the Voice: What the county scratched out, the vein kept. Ellis is not a newcomer. Ellis is the remainder. East bench, the Other Voice: Or Ellis is a person the office cannot file, and the vein is a story told so the filing looks holy.",
    },
    {
      id: "dg05.ev.marginEllis",
      name: "Margin of an unlived account",
      required: false,
      room: "dg05.r07",
      text: "Account of Ellis Perch, unlived interval, filed beside the Bridport birth of 1849. Margin, lamp only: not an error. The public line still says the child of 1849 did not return.",
    },
    {
      id: "dg05.ev.suppressedNames",
      name: "Names the town reused",
      required: false,
      room: "dg05.r09",
      text: "A shelf of name-slips with the second use scratched thin: same letters, a later body, a clerk's note that the first holder 'had already been counted.'",
    },
    {
      id: "dg05.ev.surveyRule",
      name: "Survey rule four",
      required: false,
      room: "dg05.r14",
      text: "Brass plate on the press: Rule 4. Where a life resumes without a birth, enter zero. A zero can be measured. A return cannot.",
    },
    {
      id: "dg05.ev.restoredPage",
      name: "The bound erratum",
      required: false,
      room: "dg05.r16",
      text: "The deleted line, restored in ordinary ink: Ellis Perch continues. The Surveyor's zero is crossed out. Neither voice signs it.",
    },
  ],
  collectibles: [
    {
      id: "dg05.stone.gallery",
      name: "Margin stone of suppressed names",
      optional: true,
      from: "take-dust-key",
    },
    {
      id: "dg05.stone.stair",
      name: "High-ledge stone",
      optional: true,
      from: "sugar-ledge",
    },
  ],
  enemies: [
    {
      id: "dg05.enemy.paperMoth",
      name: "Paper moth",
      hp: 2,
      damage: 1,
      movement: "cardinal",
      telegraph: "Wings fold for one beat, then it steps one tile along the shared row or column.",
      lampNote: "A raised lamp holds it one beat longer. The lamp is not required to kill it.",
    },
    {
      id: "dg05.enemy.inkBlot",
      name: "Ink blot",
      hp: 3,
      damage: 1,
      movement: "cardinal",
      telegraph: "The blot gathers, then slides one tile. It never crosses an uninked KEEP stone.",
    },
  ],
  puzzles: [],
  rooms: [],
  miniboss: {},
  boss: {},
};

const puzzles = [
  expandPuzzle({
    id: "dg05.puz.wheels",
    room: "dg05.r03",
    type: "choiceWheel",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    wheels: {
      A: ["posted-1849", "scratched-1863"],
      B: ["posted-1905", "scratched-1919"],
      C: ["posted-1947", "scratched-1961"],
    },
    initial: { A: "posted-1849", B: "posted-1905", C: "posted-1947" },
    goal: { A: "scratched-1863", B: "scratched-1919", C: "scratched-1961" },
    latchFlag: "dg05.wheels",
    reset: "Each wheel cycles. A sill crank returns all three to the posted face. No combination damages Ellis or closes the south door.",
    playerTrace: [
      "Raise the lamp. Read 1863, 1919, 1961 on the plaster.",
      "Cycle wheel A off 1849 onto 1863.",
      "Cycle wheel B off 1905 onto 1919.",
      "Cycle wheel C off 1947 onto 1961.",
      "The north latch opens and stays open.",
    ],
  }),
  expandPuzzle({
    id: "dg05.puz.shelves",
    room: "dg05.r04",
    type: "adjacentSwap",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    slots: ["W", "N", "E", "S"],
    initial: ["BIRTH", "DEATH", "MEASURE", "UNLIVED"],
    goal: ["BIRTH", "UNLIVED", "DEATH", "MEASURE"],
    latchFlag: "dg05.shelves",
    meaning:
      "West Birth opposite east Death. Clockwise from Unlived (north) comes Death (east) then Measure (south): Unlived before Measure.",
    reset: "A crank returns the four shelves to Birth, Death, Measure, Unlived. Shelves only swap with a neighbor and cannot leave the cross.",
  }),
  expandPuzzle({
    id: "dg05.puz.baffles",
    room: "dg05.r07",
    type: "toggles",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    count: 3,
    initial: 0,
    goal: 5,
    latchFlag: "dg05.baffles",
    meaning: "Bits are left, center, right. Goal binary 101: left and right baffles open, center shut, matching the carved ticks.",
    reset: "A desk lever closes every baffle.",
  }),
  expandPuzzle({
    id: "dg05.puz.truck",
    room: "dg05.r08",
    type: "explicit",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg05.truck",
    initial: "S5",
    terminal: "N7",
    resetFromAny: false,
    geometry: {
      blockTiles: ["5,5", "7,5", "9,5"],
      exitTiles: ["7,0", "7,10"],
      crankTile: "2,8",
    },
    states: {
      S5: { safe: true, note: "South side. Truck at x=5, not under the north opening." },
      S7: { safe: true, note: "South side. Truck at x=7, bridging the only north opening." },
      S9: { safe: true, note: "South side. Truck at x=9." },
      N7: { safe: true, terminal: true, note: "North side. Truck remains at x=7, so the step back exists." },
    },
    edges: [
      { from: "S5", on: "slide-E", to: "S7" },
      { from: "S7", on: "slide-W", to: "S5" },
      { from: "S7", on: "slide-E", to: "S9" },
      { from: "S9", on: "slide-W", to: "S7" },
      { from: "S7", on: "cross-N", to: "N7" },
      { from: "N7", on: "cross-S", to: "S7" },
      { from: "S7", on: "reset", to: "S5", reset: true },
      { from: "S9", on: "reset", to: "S5", reset: true },
      { from: "S5", on: "reset", to: "S5", reset: true },
    ],
    solution: ["slide-E", "cross-N"],
    reset:
      "The south crank returns the truck to x=5. It cannot be pushed off the rail. From the north opening the truck cannot be shoved aside, so the bridge stays under Ellis's feet.",
  }),
  expandPuzzle({
    id: "dg05.puz.presses",
    room: "dg05.r10",
    type: "toggles",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    count: 4,
    initial: 0,
    goal: 15,
    latchFlag: null,
    meaning: "Four shelf-presses. The hand is only exposed when all four are lit. Each press is marked with a notch.",
    reset: "Presses toggle. Turning them off returns the hand to crawling and does not lock the south door.",
  }),
  expandPuzzle({
    id: "dg05.puz.aisle",
    room: "dg05.r11",
    type: "explicit",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg05.aisle",
    initial: "south",
    terminal: "north",
    states: {
      south: { safe: true, note: "Standing on the south doorframe, notches under the hand." },
      walking: { safe: true, note: "On the uninked stones. Inked stones damage but remain inside the room." },
      north: { safe: true, terminal: true, note: "North latch opens." },
    },
    edges: [
      { from: "south", on: "follow-notches", to: "walking" },
      { from: "walking", on: "reach-north", to: "north" },
      { from: "walking", on: "step-back", to: "south" },
      { from: "south", on: "reset", to: "south", reset: true },
    ],
    solution: ["follow-notches", "reach-north"],
    reset: "Ink damage does not move the doors. Leaving to the south and re-entering clears the sting.",
  }),
  expandPuzzle({
    id: "dg05.puz.books",
    room: "dg05.r12",
    type: "adjacentSwap",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    initial: ["BAR", "WEDGE", "CIRCLE"],
    goal: ["CIRCLE", "BAR", "WEDGE"],
    latchFlag: "dg05.books",
    reset: "A tip-bar spills the three books back to bar, wedge, circle. They cannot leave the desk.",
  }),
  expandPuzzle({
    id: "dg05.puz.well",
    room: "dg05.r13",
    type: "choiceWheel",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    wheels: { chain: ["high", "mid", "low"] },
    initial: { chain: "high" },
    goal: { chain: "mid" },
    latchFlag: "dg05.well",
    meaning:
      "At mid-chain the well wall shows three tokens and a pouch legend SMALLEST FIRST. The tokens are carved 1, 2, 3 and are taken as objects, not as a code to remember later.",
    reset: "The chain crank returns to high. Tokens already pocketed stay pocketed.",
  }),
  expandPuzzle({
    id: "dg05.puz.bindery",
    room: "dg05.r14",
    type: "adjacentSwap",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    initial: ["2", "1", "3"],
    goal: ["1", "2", "3"],
    latchFlag: "dg05.bindery",
    meaning: "Presses are marked 1, 2, 3. Tokens are marked 1, 2, 3. The pouch from the well repeats SMALLEST FIRST.",
    reset: "A treadle returns the tokens to the order they were pocketed.",
  }),
];

dg05.puzzles = puzzles;

function r(partial) {
  return room(partial);
}

dg05.rooms = [
  r({
    id: "dg05.r01",
    name: "Ledger Stair",
    summary:
      "The town seam behind the Merchant's Row notice board opens onto a white stair. A sconce and a scraped date teach the lamp without hiding the way on. This is the body-candle: death in the library returns Ellis here, fourteen years older, with keys kept.",
    floor: hubGrid(["N", "S"], (g) => {
      for (let x = 3; x <= 5; x++) g[3][x] = "#";
      for (let x = 9; x <= 11; x++) g[3][x] = "#";
      g[6][4] = ",";
      g[6][10] = ",";
    }),
    spawn: { x: CX, y: 8 },
    exits: [
      exit({ id: "to-catalog", x: CX, y: 0, to: "dg05.r02", dir: "N" }),
      exit({
        id: "to-town",
        x: CX,
        y: H - 1,
        to: "overworld.middlebury.merchants-row",
        dir: "S",
        external: true,
      }),
    ],
    interactions: [
      interact({
        id: "read-epitaph",
        x: 4,
        y: 6,
        verb: "Read the body plaque",
        givesEvidence: [],
        note: "The plaque is blank on a first entry and carries the epitaph after a death.",
      }),
      interact({
        id: "lamp-sconce",
        x: 10,
        y: 6,
        verb: "Raise the lamp to the scraped date",
        requiresTools: ["lamp"],
        note: "The carved 14 becomes a sentence while the lamp is up: The hall keeps what the town scratched out. No gate uses this sentence as an answer.",
      }),
    ],
    solutionTrace: [
      "Enter from Merchant's Row onto the south stair.",
      "Raise the lamp at the sconce if desired. The north stair is already open.",
      "Go north into the public catalog.",
    ],
  }),
  r({
    id: "dg05.r02",
    name: "Public Catalog",
    summary:
      "Open marble shelves carry carved call numbers. The east wing is not a guess-locked gate; it is simply the long way around, used later only by the return stair from the index. A clerk bell here is a checkpoint mark inside the entrance room's death rule, not a second spawn.",
    floor: hubGrid(["N", "S"], (g) => {
      for (const y of [2, 4, 8]) {
        for (let x = 2; x <= 5; x++) g[y][x] = "#";
        for (let x = 9; x <= 12; x++) g[y][x] = "#";
      }
    }),
    exits: [
      exit({ id: "to-stair", x: CX, y: H - 1, to: "dg05.r01", dir: "S" }),
      exit({ id: "to-dates", x: CX, y: 0, to: "dg05.r03", dir: "N" }),
    ],
    interactions: [
      interact({
        id: "read-catalog-card",
        x: 3,
        y: 6,
        verb: "Take the uncirculated card",
        givesEvidence: ["dg05.ev.catalogCard"],
      }),
    ],
    encounters: [{ enemy: "dg05.enemy.paperMoth", count: 2, tiles: [[3, 7], [11, 7]] }],
    solutionTrace: [
      "Read the carved ERRATA card on the west shelf.",
      "Continue north. Nothing in this room must be solved.",
    ],
  }),
  r({
    id: "dg05.r03",
    name: "The Scraped Dates",
    summary:
      "Three marble wheels stand under a plaster wall. Each wheel has two faces: the posted county date and the scratched date. The lamp shows the scratched dates on the wall while Ellis turns the wheels. Wrong faces do nothing but click.",
    latchFlags: ["dg05.wheels"],
    reset: {
      control: "sill-crank",
      tile: [2, 2],
      resets: ["dg05.puz.wheels"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      g[2][3] = "#";
      g[2][4] = "#";
      g[2][10] = "#";
      g[2][11] = "#";
      g[3][3] = ",";
      g[3][7] = ",";
      g[3][11] = ",";
    }),
    exits: [
      exit({ id: "to-catalog", x: CX, y: H - 1, to: "dg05.r02", dir: "S" }),
      exit({
        id: "to-index",
        x: CX,
        y: 0,
        to: "dg05.r04",
        dir: "N",
        requiresFlags: ["dg05.wheels"],
        setsFlags: ["dg05.lock.wheelsOpen"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-wheels",
        x: 3,
        y: 3,
        verb: "Set each wheel to the scratched date written on the wall",
        puzzle: "dg05.puz.wheels",
        requiresTools: ["lamp"],
        setsFlags: ["dg05.wheels"],
      }),
    ],
    solutionTrace: [
      "Raise the lamp and read 1863, 1919, and 1961 on the plaster.",
      "Cycle the wheels off the posted dates 1849, 1905, and 1947.",
      "Leave north. The south door never closes.",
    ],
  }),
  r({
    id: "dg05.r04",
    name: "Index Hall",
    summary:
      "Four shelves ride a cross of niches: west, north, east, south. Their labels are carved, BIRTH, DEATH, UNLIVED, MEASURE. The beam shows the solved cross. The floor ink repeats it under the lamp. After the sealed carrel is solved, the east niche opens a return stair that skips the stacks.",
    latchFlags: ["dg05.shelves"],
    reset: {
      control: "niche-crank",
      tile: [2, 2],
      resets: ["dg05.puz.shelves"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S", "E"], (g) => {
      g[2][2] = ",";
      g[2][12] = ",";
      g[8][2] = ",";
      g[8][12] = ",";
    }),
    exits: [
      exit({ id: "to-dates", x: CX, y: H - 1, to: "dg05.r03", dir: "S" }),
      exit({
        id: "to-stacks",
        x: CX,
        y: 0,
        to: "dg05.r05",
        dir: "N",
        requiresFlags: ["dg05.shelves"],
      }),
      exit({
        id: "shortcut-to-carrel",
        x: W - 1,
        y: CY,
        to: "dg05.r12",
        dir: "E",
        requiresFlags: ["dg05.books"],
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "solve-shelves",
        x: 2,
        y: 8,
        verb: "Swap neighboring shelves until they match the beam",
        puzzle: "dg05.puz.shelves",
        requiresTools: ["lamp"],
        setsFlags: ["dg05.shelves"],
      }),
      interact({
        id: "read-voices",
        x: 12,
        y: 8,
        verb: "Read the two benches",
        givesEvidence: ["dg05.ev.voiceSplit"],
      }),
    ],
    solutionTrace: [
      "Read the beam: west Birth, north Unlived, east Death, south Measure.",
      "Swap shelves with their neighbors until that cross is set. The crank undoes the work.",
      "Go north. The east stair appears only on a later visit, after the carrel is solved.",
    ],
  }),
  r({
    id: "dg05.r05",
    name: "Suppression Stacks",
    summary:
      "Narrow stacks of scraped volumes. Paper moths use the aisles. The west end is the gallery of reused names. A south-east wall is cracked marble: a hammer opens a one-time walk to the ink aisle, a shortcut around nothing that still leaves the keys where they are. The dust cache on the west jamb wants the optional dust key.",
    floor: hubGrid(["N", "S", "W", "E"], (g) => {
      for (const y of [2, 3, 7, 8]) {
        g[y][3] = "#";
        g[y][4] = "#";
        g[y][10] = "#";
        g[y][11] = "#";
      }
    }),
    exits: [
      exit({ id: "to-index", x: CX, y: H - 1, to: "dg05.r04", dir: "S" }),
      exit({ id: "to-stair", x: CX, y: 0, to: "dg05.r06", dir: "N" }),
      exit({ id: "to-gallery", x: 0, y: CY, to: "dg05.r09", dir: "W" }),
      exit({
        id: "hammer-to-aisle",
        x: W - 1,
        y: CY,
        to: "dg05.r11",
        dir: "E",
        requiresTools: ["hammer"],
        optional: true,
        shortcut: true,
        setsFlags: ["dg05.hammerWall"],
      }),
    ],
    interactions: [
      interact({
        id: "open-dust-cache",
        x: 2,
        y: 2,
        verb: "Open the dust cache",
        requiresKeys: ["dg05.sk.dust"],
        optional: true,
        givesCollectibles: ["dg05.stone.gallery"],
        note: "The cache does not contain a required key. It holds a duplicate margin stone already counted from the gallery.",
      }),
    ],
    encounters: [
      { enemy: "dg05.enemy.paperMoth", count: 3, tiles: [[2, 6], [12, 6], [9, 8]] },
    ],
    solutionTrace: [
      "Walk north through the center aisle. Moths telegraph a wing-fold.",
      "The gallery to the west is optional. The hammer crack to the east is optional and cannot be taken without the hammer.",
    ],
  }),
  r({
    id: "dg05.r06",
    name: "Ink Stair",
    summary:
      "A switchback stair in one room. Missing treads are bridged by a fixed marble plank; the sugar-line only fetches a high margin stone and is not the path. The shelf key lies on a clerk's desk beside the north door.",
    floor: hubGrid(["N", "S"], (g) => {
      for (let y = 2; y <= 8; y += 2) {
        if (y === 4 || y === 8) {
          for (let x = 2; x <= 6; x++) g[y][x] = "#";
        } else {
          for (let x = 8; x <= 12; x++) g[y][x] = "#";
        }
      }
    }),
    exits: [
      exit({ id: "to-stacks", x: CX, y: H - 1, to: "dg05.r05", dir: "S" }),
      exit({
        id: "to-carrel",
        x: CX,
        y: 0,
        to: "dg05.r07",
        dir: "N",
        requiresKeys: ["dg05.sk.shelf"],
        setsFlags: ["dg05.lock.carrel.open"],
      }),
    ],
    interactions: [
      interact({
        id: "take-shelf-key",
        x: 11,
        y: 3,
        verb: "Take the shelf key from the desk",
        givesKeys: ["dg05.sk.shelf"],
      }),
      interact({
        id: "sugar-ledge",
        x: 3,
        y: 3,
        verb: "Draw the sugar-line to the high ledge",
        requiresTools: ["sugarLine"],
        optional: true,
        givesCollectibles: ["dg05.stone.stair"],
        note: "Optional stone. The plank already crosses the broken tread.",
      }),
    ],
    solutionTrace: [
      "Climb the switchback. Do not wait on a tool.",
      "Take the shelf key on the upper desk.",
      "Open the north door into the quiet carrel.",
    ],
  }),
  r({
    id: "dg05.r07",
    name: "The Quiet Carrel",
    summary:
      "One desk, one sconce, three baffles. The carved ticks show left and right open, center shut. The beam is visible. Matching it opens a drawer with Ellis's unlived margin and the north door.",
    latchFlags: ["dg05.baffles"],
    reset: {
      control: "desk-lever",
      tile: [2, 2],
      resets: ["dg05.puz.baffles"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      for (let x = 4; x <= 10; x++) g[4][x] = "#";
      g[4][7] = ".";
      g[6][5] = ",";
      g[6][9] = ",";
    }),
    exits: [
      exit({ id: "to-stair", x: CX, y: H - 1, to: "dg05.r06", dir: "S" }),
      exit({
        id: "to-mezzanine",
        x: CX,
        y: 0,
        to: "dg05.r08",
        dir: "N",
        requiresFlags: ["dg05.baffles"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-baffles",
        x: 5,
        y: 6,
        verb: "Set the baffles to the carved ticks",
        puzzle: "dg05.puz.baffles",
        requiresTools: ["lamp"],
        setsFlags: ["dg05.baffles"],
        givesEvidence: ["dg05.ev.marginEllis"],
      }),
    ],
    solutionTrace: [
      "Put the lamp on the sconce and watch the beam.",
      "Open the left and right baffles. Leave the center shut.",
      "Read the drawer. Go north.",
    ],
  }),
  r({
    id: "dg05.r08",
    name: "Mezzanine of Book-Trucks",
    summary:
      "A gap crosses the room. A book-truck rides a rail in that gap and is the only bridge to a north opening at the center. The truck always stays on the rail. It cannot be pushed off from the north side, so crossing cannot strand Ellis on the far ledge.",
    latchFlags: ["dg05.truck"],
    reset: {
      control: "south-crank",
      tile: [2, 8],
      resets: ["dg05.puz.truck"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      for (let x = 1; x <= 13; x++) if (x !== 7) g[4][x] = "#";
      g[5][5] = ",";
      g[5][7] = ",";
      g[5][9] = ",";
      g[8][2] = ",";
    }),
    exits: [
      exit({ id: "to-carrel", x: CX, y: H - 1, to: "dg05.r07", dir: "S" }),
      exit({
        id: "to-hand",
        x: CX,
        y: 0,
        to: "dg05.r10",
        dir: "N",
        requiresFlags: ["dg05.truck"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-truck",
        x: 5,
        y: 6,
        verb: "Slide the book-truck under the north opening and cross",
        puzzle: "dg05.puz.truck",
        setsFlags: ["dg05.truck"],
      }),
    ],
    solutionTrace: [
      "From the south, slide the truck east until it sits under the single north opening.",
      "Cross. The truck stays. Step back if the north room is not wanted yet.",
      "The south crank parks the truck at its first post and does not close the south door.",
    ],
  }),
  r({
    id: "dg05.r09",
    name: "Gallery of Suppressed Names",
    summary:
      "An optional west gallery. Name-slips show the town using one name for two bodies. The dust key is here. It opens only a cache back in the stacks. The way east returns to the stacks; there is no drop.",
    optional: true,
    floor: hubGrid(["E"], (g) => {
      for (let y = 2; y <= 8; y += 2) {
        for (let x = 2; x <= 10; x++) g[y][x] = "#";
      }
    }),
    exits: [exit({ id: "back-stacks", x: W - 1, y: CY, to: "dg05.r05", dir: "E" })],
    interactions: [
      interact({
        id: "read-names",
        x: 3,
        y: 3,
        verb: "Read the reused names",
        givesEvidence: ["dg05.ev.suppressedNames"],
      }),
      interact({
        id: "take-dust-key",
        x: 3,
        y: 7,
        verb: "Take the dust key",
        givesKeys: ["dg05.sk.dust"],
        givesCollectibles: ["dg05.stone.gallery"],
      }),
    ],
    solutionTrace: [
      "Enter from the stacks.",
      "Read the slips. Take the dust key if the cache matters.",
      "Return east. The boss does not wait on this room.",
    ],
  }),
  r({
    id: "dg05.r10",
    name: "The Marginal Hand",
    summary:
      "Miniboss room. A scribe's hand crawls the shelves and shuts books. Four notched presses, lit by the lamp or by tap, expose it in the aisle. Four strikes end it. It drops the margin key. The south door stays open throughout.",
    latchFlags: ["dg05.miniboss"],
    reset: {
      control: "press-toggles",
      tile: [2, 2],
      resets: ["dg05.puz.presses", "miniboss-phase"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      g[2][3] = ",";
      g[2][11] = ",";
      g[8][3] = ",";
      g[8][11] = ",";
    }),
    exits: [
      exit({ id: "to-mezzanine", x: CX, y: H - 1, to: "dg05.r08", dir: "S" }),
      exit({
        id: "to-aisle",
        x: CX,
        y: 0,
        to: "dg05.r11",
        dir: "N",
        requiresFlags: ["dg05.miniboss"],
      }),
    ],
    interactions: [
      interact({
        id: "light-presses",
        x: 3,
        y: 2,
        verb: "Light the four notched presses",
        puzzle: "dg05.puz.presses",
        requiresTools: ["lamp"],
      }),
      interact({
        id: "defeat-hand",
        x: CX,
        y: 6,
        verb: "Strike the Marginal Hand while it crosses the lit aisle",
        setsFlags: ["dg05.miniboss"],
        givesKeys: ["dg05.sk.margin"],
      }),
    ],
    solutionTrace: [
      "Light all four notched presses. They toggle if mis-set.",
      "When the hand rears and takes the aisle, strike it four times from a cardinal side.",
      "Pick up the margin key and go north.",
    ],
  }),
  r({
    id: "dg05.r11",
    name: "Aisle of Corrections",
    summary:
      "Inked stones sting. Uninked stones do not. The safe walk is cut into the south doorframe and repeated by lamp-words on the stones. Neither copy has to be memorized from another room. A hammer breach on the west is the optional stacks shortcut, entering on a safe tile.",
    latchFlags: ["dg05.aisle"],
    safePath: AISLE_SAFE,
    hazardNote:
      "Tiles marked ! are STRIKE. They damage and do not move Ellis into another room. The notches are the no-damage walk.",
    floor: aisleGrid(),
    exits: [
      exit({ id: "to-hand", x: CX, y: H - 1, to: "dg05.r10", dir: "S" }),
      exit({
        id: "to-sealed",
        x: CX,
        y: 0,
        to: "dg05.r12",
        dir: "N",
        requiresFlags: ["dg05.aisle"],
        requiresKeys: ["dg05.sk.margin"],
        setsFlags: ["dg05.lock.sealed.open"],
      }),
      exit({
        id: "from-hammer",
        x: 0,
        y: CY,
        to: "dg05.r05",
        dir: "W",
        requiresFlags: ["dg05.hammerWall"],
        optional: true,
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "solve-aisle",
        x: 7,
        y: 9,
        verb: "Walk the notched stones to the north latch",
        puzzle: "dg05.puz.aisle",
        requiresTools: ["lamp"],
        setsFlags: ["dg05.aisle"],
      }),
    ],
    encounters: [{ enemy: "dg05.enemy.inkBlot", count: 2, tiles: [[11, 7], [3, 3]] }],
    solutionTrace: [
      "Read the doorframe notches with a hand before stepping onto ink.",
      "Follow the uninked stones north.",
      "Use the margin key on the north door.",
    ],
  }),
  r({
    id: "dg05.r12",
    name: "Sealed Carrel",
    summary:
      "Three books, carved circle, bar, and wedge, sit out of the order shown on the blotter and on the blotter's wooden edge. Sorting them opens the well stair and, as a latch, the return stair to Index Hall.",
    latchFlags: ["dg05.books"],
    reset: {
      control: "tip-bar",
      tile: [2, 2],
      resets: ["dg05.puz.books"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S", "W"], (g) => {
      for (let x = 4; x <= 10; x++) g[6][x] = "#";
      g[6][7] = ",";
    }),
    exits: [
      exit({ id: "to-aisle", x: CX, y: H - 1, to: "dg05.r11", dir: "S" }),
      exit({
        id: "to-well",
        x: CX,
        y: 0,
        to: "dg05.r13",
        dir: "N",
        requiresFlags: ["dg05.books"],
      }),
      exit({
        id: "shortcut-to-index",
        x: 0,
        y: CY,
        to: "dg05.r04",
        dir: "W",
        requiresFlags: ["dg05.books"],
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "solve-books",
        x: 8,
        y: 8,
        verb: "Shelve circle, then bar, then wedge",
        puzzle: "dg05.puz.books",
        requiresTools: ["lamp"],
        setsFlags: ["dg05.books"],
      }),
    ],
    solutionTrace: [
      "Read the blotter edge: circle, bar, wedge.",
      "Swap neighboring books until that order is set.",
      "Go north, or west if returning to the index after the latch.",
    ],
  }),
  r({
    id: "dg05.r13",
    name: "The White Well",
    summary:
      "A round well of loose pages. The lamp chain has three stops, labeled on the crank housing: high, mid, low. Mid shows the token niche. Tokens are carved 1, 2, and 3, and the pouch is cut SMALLEST FIRST. Ellis carries the tokens; the next room's presses repeat the same marks. A shovel turns a dust corner and finds nothing required.",
    latchFlags: ["dg05.well"],
    reset: {
      control: "chain-crank",
      tile: [2, 5],
      resets: ["dg05.puz.well"],
      preserves: ["keys", "evidence", "latchedFlags", "tokens"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      g[3][4] = "#";
      g[3][5] = "#";
      g[3][9] = "#";
      g[3][10] = "#";
      g[7][4] = "#";
      g[7][5] = "#";
      g[7][9] = "#";
      g[7][10] = "#";
    }),
    exits: [
      exit({ id: "to-sealed", x: CX, y: H - 1, to: "dg05.r12", dir: "S" }),
      exit({
        id: "to-bindery",
        x: CX,
        y: 0,
        to: "dg05.r14",
        dir: "N",
        requiresFlags: ["dg05.well"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-well",
        x: 4,
        y: 5,
        verb: "Lower the lamp chain to the mid stop and take the numbered tokens",
        puzzle: "dg05.puz.well",
        requiresTools: ["lamp"],
        setsFlags: ["dg05.well"],
      }),
      interact({
        id: "shovel-corner",
        x: 12,
        y: 8,
        verb: "Shovel the dust corner",
        requiresTools: ["shovel"],
        optional: true,
        note: "Dust, a button, no key. The well does not depend on it.",
      }),
    ],
    solutionTrace: [
      "Cycle the chain from high to mid. The housing names the stops.",
      "Take tokens 1, 2, and 3.",
      "Go north into the bindery.",
    ],
  }),
  r({
    id: "dg05.r14",
    name: "Bindery",
    summary:
      "Three presses stamped 1, 2, and 3. The tokens from the well match them, smallest first, which is also how they are numbered. The Surveyor's rule four is a plate on the press, readable, not a password. The erratum key is in the drawer that opens when the tokens sit in order.",
    latchFlags: ["dg05.bindery"],
    reset: {
      control: "treadle",
      tile: [12, 8],
      resets: ["dg05.puz.bindery"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      g[6][4] = ",";
      g[6][7] = ",";
      g[6][10] = ",";
    }),
    exits: [
      exit({ id: "to-well", x: CX, y: H - 1, to: "dg05.r13", dir: "S" }),
      exit({ id: "to-door", x: CX, y: 0, to: "dg05.r15", dir: "N" }),
    ],
    interactions: [
      interact({
        id: "solve-bindery",
        x: 4,
        y: 6,
        verb: "Seat the tokens smallest first",
        puzzle: "dg05.puz.bindery",
        setsFlags: ["dg05.bindery"],
        givesEvidence: ["dg05.ev.surveyRule"],
      }),
      interact({
        id: "take-big-key",
        x: 10,
        y: 6,
        verb: "Take the erratum key from the drawer",
        requiresFlags: ["dg05.bindery"],
        givesKeys: ["dg05.bk.erratum"],
      }),
    ],
    solutionTrace: [
      "Put token 1, then 2, then 3 into the presses that wear those numbers.",
      "Read rule four.",
      "Take the erratum key and go north.",
    ],
  }),
  r({
    id: "dg05.r15",
    name: "Erratum Door",
    summary:
      "A checkpoint landing before the correction. Two short carvings tell the fight in physical terms: sockets, sconces, the cracked end. They are instructions, not a quiz. The erratum key opens the north door and does not get consumed; the door stays unlatched.",
    floor: hubGrid(["N", "S"], (g) => {
      g[4][4] = ",";
      g[4][10] = ",";
    }),
    exits: [
      exit({ id: "to-bindery", x: CX, y: H - 1, to: "dg05.r14", dir: "S" }),
      exit({
        id: "to-erratum",
        x: CX,
        y: 0,
        to: "dg05.r16",
        dir: "N",
        requiresKeys: ["dg05.bk.erratum"],
        setsFlags: ["dg05.lock.boss.open"],
      }),
    ],
    interactions: [
      interact({
        id: "read-fight-card",
        x: 4,
        y: 4,
        verb: "Read the landing card",
        note: "Sockets first. Then the two dark sconces. Then the cracked end, not the smooth ones.",
      }),
    ],
    solutionTrace: [
      "Read the card if the tells are wanted in words.",
      "Open the north door with the erratum key.",
    ],
  }),
  r({
    id: "dg05.r16",
    name: "The Erratum",
    summary:
      "Boss room. The Erratum edits the aisle: it swaps shelves, drains light, then drops three lines. Ellis restores the carved sockets, relights two sconces, and breaks only the line with the cracked end. Defeat binds the page and sets the dungeon goal. The south door stays open so an unready body can leave.",
    latchFlags: ["dg05.boss"],
    floor: hubGrid(["S"], (g) => {
      g[2][3] = ",";
      g[2][11] = ",";
      g[8][3] = ",";
      g[8][11] = ",";
    }),
    exits: [exit({ id: "to-door", x: CX, y: H - 1, to: "dg05.r15", dir: "S" })],
    interactions: [
      interact({
        id: "defeat-erratum",
        x: CX,
        y: 5,
        verb: "Bind the Erratum",
        setsFlags: ["dg05.boss"],
        givesEvidence: ["dg05.ev.restoredPage"],
      }),
    ],
    solutionTrace: [
      "When the comma rises, put the four shelves back on their sockets. Strike three times while it holds.",
      "Relight the two darkened sconces. Strike three times.",
      "Break the line with the cracked end. Strike four times. Leave south if the body fails; the door does not lock.",
    ],
  }),
];

dg05.miniboss = {
  id: "dg05.miniboss.marginalHand",
  name: "The Marginal Hand",
  room: "dg05.r10",
  distinctFromBoss: true,
  fsm: {
    initial: "crawl",
    terminal: "defeated",
    resetFromAny: true,
    states: handStates,
    edges: handEdges,
    solution: ["light-all-notched-presses", "hand-enters-aisle", "strike", "strike", "strike", "strike"],
  },
};

dg05.boss = {
  id: "dg05.boss.erratum",
  name: "The Erratum",
  room: "dg05.r16",
  finsRequired: false,
  arenaLeavesExits: true,
  fsm: {
    initial: "dormant",
    terminal: "bound",
    resetFromAny: true,
    states: erratumStates,
    edges: erratumEdges,
    solution: [
      "approach",
      "shelves-match-sockets",
      "strike",
      "strike",
      "strike",
      "relight-two-sconces",
      "strike",
      "strike",
      "strike",
      "break-false-line",
      "strike",
      "strike",
      "strike",
      "strike",
    ],
  },
};

void doorTile;
