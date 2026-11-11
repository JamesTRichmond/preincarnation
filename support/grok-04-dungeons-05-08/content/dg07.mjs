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

const bHits = hitChain("b", 3, "defeated", "The gear is bare after the weight drops.");
const p1 = hitChain("p1", 3, "phase2_winnow", "The flail has snagged. Strike the gear.");
const p2 = hitChain("p2", 3, "phase3_drum", "The bell dropped the weight. The saint is in the chaff and countable.");
const p3 = hitChain("p3", 4, "unbound", "The drum is jammed. The four corners stay open.");

const bailerStates = {
  arm: {
    terminal: false,
    safe: true,
    note: "The bailer arm rides a fixed track. One counterweight sits on a two-post rail that cannot reach either door.",
  },
  gear: { terminal: false, safe: true, tell: "The arm shortens. The gear shows for a beat before the next pass." },
  defeated: { terminal: true, safe: true, setsFlags: ["dg07.bailer"] },
  ...bHits.states,
};
const bailerEdges = [
  { from: "arm", on: "set-weight-low", to: "gear" },
  { from: "gear", on: "arm-passes", to: bHits.first },
  ...bHits.edges,
];
withReset(bailerStates, bailerEdges, "arm");

const saintStates = {
  idle_count: {
    terminal: false,
    safe: true,
    note: "The saint counts. Painted rows on the floor tell the flail's next line. South door stays open. Corners are never blocks.",
  },
  phase1_sweep: {
    terminal: false,
    safe: true,
    tell: "The flail lifts over one painted row. The safe aisle is the row that is not painted this beat.",
  },
  phase2_winnow: {
    terminal: false,
    safe: true,
    tell: "Chaff thickens. Floor arrows are carved, not painted, so they stay readable.",
  },
  phase3_drum: {
    terminal: false,
    safe: true,
    tell: "The drum starts. Four corner pockets are cut deeper than the floor and are not on the pin rail.",
  },
  unbound: {
    terminal: true,
    safe: true,
    setsFlags: ["dg07.boss"],
    givesEvidence: ["dg07.ev.eaten"],
  },
  ...p1.states,
  ...p2.states,
  ...p3.states,
};
const saintEdges = [
  { from: "idle_count", on: "approach", to: "phase1_sweep" },
  { from: "phase1_sweep", on: "set-weight-low", to: p1.first },
  { from: "phase2_winnow", on: "ring-bell", to: p2.first },
  { from: "phase3_drum", on: "pull-pin", to: p3.first },
  ...p1.edges,
  ...p2.edges,
  ...p3.edges,
];
withReset(saintStates, saintEdges, "idle_count");

const line = (names, tiles) => ({
  positions: Object.fromEntries(names.map((n, i) => [n, tiles[i]])),
  adjacency: names.slice(0, -1).flatMap((n, i) => [
    [n, names[i + 1]],
    [names[i + 1], n],
  ]),
});

export const dg07 = {
  id: "dg07",
  name: "The Iron Hayloft",
  sequence: 7,
  county: "Addison County, Vermont",
  town: "Cornwall",
  site: "A barn raised on iron posts above the intervale hay meadows, west of the Lemon Fair's low fog. The parish called the machinery a saint.",
  premise:
    "H. Pell's loft counts every stalk and forgets the eater. Counterweights, a block rod, and threshing iron do the counting. Blocks ride rails with end stops. Each block room has a crank the blocks cannot reach. Leaving a room unsolved restores the rails. No block can cover a door.",
  bossId: "dg07.boss.thresherSaint",
  minibossId: "dg07.miniboss.bailer",
  entranceRoom: "dg07.r01",
  goalFlag: "dg07.boss",
  initialLevel: null,
  requiredTools: ["blockRod"],
  optionalTools: ["cape", "powderKeg", "sugarLine", "boots", "hammer"],
  designAssertions: ["blockSoftlock", "fairClues", "shownSolutions"],
  blockPolicy: {
    onLeaveUnsolved: "restore-rails-to-initial",
    onDeath: "restore-unsolved-rails",
    solvedLatch: "flag-holds-the-open-door-even-if-the-block-is-later-reset",
    cannotEnterPits: true,
    cannotCoverExits: true,
    crankReachableInEveryState: true,
  },
  input: {
    combat: "four-direction",
    keyboard: "cardinal movement and a single action",
    touch: "cardinal pad and tap on the interaction tile",
    parity: "Rod, crank, and push are tile actions.",
  },
  entry: {
    campaignPrerequisites: [
      {
        id: "tool.blockRod",
        external: true,
        kind: "tool",
        note: "The block rod is already Ellis's. This pack does not invent its first finding.",
      },
      { id: "dg06.boss", external: false, kind: "flag" },
    ],
    standalonePrerequisites: [{ tool: "blockRod" }],
    assumedGrantedFlags: ["dg06.boss"],
    proposedUnlocks: [
      {
        id: "dg08.entry.unbarred",
        whenFlag: "dg07.boss",
        kind: "proposed-campaign-link",
        notRuntimeApi: true,
        note: "The Vergennes lantern annex is the proposed next door after the saint is unbound.",
      },
    ],
  },
  death: {
    checkpointRoom: "dg07.r01",
    ageAdvanceYears: 14,
    keysPersist: true,
    evidencePersists: true,
    latchedFlagsPersist: true,
    bossResetsUnlessDefeated: true,
    unsolvedPuzzlesReset: true,
    blocksResetUnlessLatched: true,
    enemiesRespawn: true,
    cannotSpawnOnBlock: true,
    epitaph:
      "In {roomName}, the body stopped. Ellis Perch drew the next breath fourteen years on. Unlatched weights went back to their first posts.",
    voiceOnReentry: "The saint counted the stalk and not the mouth. You are the mouth.",
    otherVoiceOnReentry: "It is a barn. The iron is heavy because iron is heavy.",
  },
  routes: {
    main: [
      { do: "exit", id: "to-nave" },
      { do: "exit", id: "to-mow" },
      { do: "interact", id: "solve-mow" },
      { do: "exit", id: "to-rope" },
      { do: "interact", id: "take-mow-key" },
      { do: "exit", id: "to-choir" },
      { do: "interact", id: "solve-choir" },
      { do: "exit", id: "to-bridge" },
      { do: "interact", id: "solve-bridge" },
      { do: "exit", id: "to-bailer" },
      { do: "interact", id: "defeat-bailer" },
      { do: "exit", id: "to-east" },
      { do: "interact", id: "solve-east" },
      { do: "exit", id: "to-ante" },
      { do: "exit", id: "to-elevator" },
      { do: "exit", id: "to-ledger" },
      { do: "interact", id: "solve-shapes" },
      { do: "exit", id: "to-weather" },
      { do: "interact", id: "cut-fan" },
      { do: "exit", id: "to-rod" },
      { do: "interact", id: "solve-rod" },
      { do: "exit", id: "to-door" },
      { do: "interact", id: "take-big-key" },
      { do: "exit", id: "to-saint" },
      { do: "interact", id: "defeat-saint" },
    ],
    optionalBranches: [
      {
        id: "dg07.branch.powder",
        rooms: ["dg07.r13"],
        script: [
          { do: "exit", id: "to-nave" },
          { do: "exit", id: "to-mow" },
          { do: "interact", id: "solve-mow" },
          { do: "exit", id: "to-rope" },
          { do: "interact", id: "take-mow-key" },
          { do: "exit", id: "to-choir" },
          { do: "interact", id: "solve-choir" },
          { do: "exit", id: "to-bridge" },
          { do: "interact", id: "solve-bridge" },
          { do: "exit", id: "to-bailer" },
          { do: "interact", id: "defeat-bailer" },
          { do: "exit", id: "to-east" },
          { do: "interact", id: "solve-east" },
          { do: "exit", id: "to-ante" },
          { do: "exit", id: "to-elevator" },
          { do: "exit", id: "to-ledger" },
          { do: "interact", id: "solve-shapes" },
          { do: "exit", id: "to-weather" },
          { do: "exit", id: "to-powder" },
          { do: "interact", id: "read-keg-note" },
          { do: "exit", id: "back-weather" },
        ],
      },
    ],
    shortcut: {
      id: "dg07.short.nave-ante",
      description:
        "After the east mow is latched, a roof door in the nave opens onto the antechamber, skipping the mow, rope walk, choir, bridge, bailer, and east mow on a later body.",
      from: "dg07.r02",
      to: "dg07.r09",
      skipsRooms: ["dg07.r03", "dg07.r04", "dg07.r05", "dg07.r06", "dg07.r07", "dg07.r08"],
      assumeFlags: ["dg07.mow", "dg07.choir", "dg07.bridge", "dg07.bailer", "dg07.east"],
      assumeKeys: ["dg07.sk.mow"],
      startRoom: "dg07.r01",
      script: [
        { do: "exit", id: "to-nave" },
        { do: "exit", id: "shortcut-to-ante" },
        { do: "exit", id: "to-elevator" },
        { do: "exit", id: "to-ledger" },
        { do: "interact", id: "solve-shapes" },
        { do: "exit", id: "to-weather" },
        { do: "interact", id: "cut-fan" },
        { do: "exit", id: "to-rod" },
        { do: "interact", id: "solve-rod" },
        { do: "exit", id: "to-door" },
        { do: "interact", id: "take-big-key" },
        { do: "exit", id: "to-saint" },
        { do: "interact", id: "defeat-saint" },
      ],
    },
  },
  keys: [
    {
      id: "dg07.sk.mow",
      kind: "small",
      name: "Mow key",
      source: { room: "dg07.r04", interaction: "take-mow-key" },
      opens: ["dg07.lock.east"],
    },
    {
      id: "dg07.bk.saint",
      kind: "big",
      name: "Saint key",
      source: { room: "dg07.r15", interaction: "take-big-key" },
      opens: ["dg07.lock.boss"],
    },
  ],
  locks: [
    { id: "dg07.lock.east", keyId: "dg07.sk.mow", optional: false, exit: "to-east", room: "dg07.r07" },
    { id: "dg07.lock.boss", keyId: "dg07.bk.saint", optional: false, exit: "to-saint", room: "dg07.r15" },
  ],
  clues: [
    {
      id: "dg07.clue.choir.shadow",
      puzzle: "dg07.puz.choir",
      room: "dg07.r05",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "A soot shadow on the north wall is the solved silhouette: left weight low, middle weight high, right weight in the middle hole.",
    },
    {
      id: "dg07.clue.choir.palm",
      puzzle: "dg07.puz.choir",
      room: "dg07.r05",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The iron palm in the corner is a relief in that same pose. Three fingers: down, up, half. They are the weights.",
    },
    {
      id: "dg07.clue.rod.arrow",
      puzzle: "dg07.puz.rod",
      room: "dg07.r14",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The floor is painted with a pull arrow toward the west plate. The arrow starts at the block's far post.",
    },
    {
      id: "dg07.clue.rod.post",
      puzzle: "dg07.puz.rod",
      room: "dg07.r14",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "An iron post fills the tile east of the far post. Ellis cannot stand behind the block. The rod is the pull. The crank west of the rail restores the far post.",
    },
    {
      id: "dg07.clue.shapes.lid",
      puzzle: "dg07.puz.shapes",
      room: "dg07.r11",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The box lid is cut triangle, square, round. The stones are those shapes and will not sit in a foreign hole.",
    },
    {
      id: "dg07.clue.shapes.rim",
      puzzle: "dg07.puz.shapes",
      room: "dg07.r11",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The rim repeats the cutouts left to right and adds the words AS THE LID, not as the tally.",
    },
    {
      id: "dg07.clue.mow.sheaf",
      puzzle: "dg07.puz.mow",
      room: "dg07.r03",
      fair: true,
      environmental: true,
      major: false,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The main plate is painted with a hay sheaf. A second plate further along is painted with a spare knot and opens only a niche.",
    },
  ],
  evidence: [
    {
      id: "dg07.ev.diagram",
      name: "Rod diagram",
      required: false,
      room: "dg07.r01",
      text: "Burned into the lintel: a block, a hand, a hooked rod. Push is the hand. Pull is the rod. The practice rail under the lintel cannot reach the doors.",
    },
    {
      id: "dg07.ev.palm",
      name: "The palm's other reading",
      required: false,
      room: "dg07.r05",
      text: "Under the relief, the Voice: The saint keeps the parish by measure. The Other Voice, scratched in the iron: The parish kept itself. Pell kept the count.",
    },
    {
      id: "dg07.ev.farmhand",
      name: "Farmhand slip",
      required: false,
      room: "dg07.r09",
      text: "A slip nailed under the stair: Pell counts the grain and forgets the eater. If the loft locks you in, the crank is on the catwalk the weights are not allowed to use. Signed with a thumb, no surname.",
    },
    {
      id: "dg07.ev.tally",
      name: "Tally that will not close",
      required: false,
      room: "dg07.r11",
      text: "Beside the shape box, a column of stalks ends in a blank. The blank is labeled EATER. Nothing in the loft is shaped to fill it.",
    },
    {
      id: "dg07.ev.eaten",
      name: "The eaten, released",
      required: false,
      room: "dg07.r16",
      text: "When the saint unbinds, the blank on the tally is no longer a problem to solve. The slip simply reads: the eaters were always in the intervale, uncounted, which is not the same as unreal.",
    },
  ],
  collectibles: [
    { id: "dg07.stone.practice", name: "Practice stone", optional: true, from: "solve-practice" },
    { id: "dg07.stone.powder", name: "Powder-loft stone", optional: true, from: "blow-niche" },
    { id: "dg07.stone.line", name: "Rope-walk stone", optional: true, from: "sugar-ring" },
    { id: "dg07.stone.elevator", name: "Beam stone", optional: true, from: "cape-beam" },
  ],
  enemies: [
    {
      id: "dg07.enemy.hingeBeetle",
      name: "Hinge beetle",
      hp: 3,
      damage: 1,
      movement: "cardinal",
      telegraph: "The hinge saws once, then the beetle charges one tile along the row or column.",
    },
  ],
  puzzles: [],
  rooms: [],
  miniboss: {},
  boss: {},
};

dg07.puzzles = [
  expandPuzzle({
    id: "dg07.puz.practice",
    room: "dg07.r01",
    type: "railBlock",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: null,
    blocks: [
      {
        id: "practice",
        ...line(["A", "B"], [[3, 3], [4, 3]]),
      },
    ],
    initial: { practice: "A" },
    goal: { practice: "B" },
    crankTile: "2,8",
    forbiddenTiles: ["7,0", "7,10", "2,8"],
    reset: "Crank returns the practice block to A. It is not on a door.",
  }),
  expandPuzzle({
    id: "dg07.puz.mow",
    room: "dg07.r03",
    type: "railBlock",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg07.mow",
    blocks: [
      {
        id: "haystone",
        ...line(["A", "B", "C", "D"], [[3, 3], [4, 3], [5, 3], [6, 3]]),
      },
    ],
    initial: { haystone: "A" },
    goal: { haystone: "C" },
    crankTile: "2,8",
    forbiddenTiles: ["7,0", "7,10", "2,8"],
    reset: "Crank returns the haystone to A. The north latch stays open once C has been visited.",
  }),
  expandPuzzle({
    id: "dg07.puz.choir",
    room: "dg07.r05",
    type: "dials",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    ranges: { L: [0, 2], M: [0, 2], R: [0, 2] },
    initial: { L: 0, M: 0, R: 0 },
    goal: { L: 0, M: 2, R: 1 },
    latchFlag: "dg07.choir",
    meaning: "0 low, 1 mid, 2 high. Goal low, high, mid.",
    reset: "Gallery crank returns all three to low. Weights are on vertical rails and cannot enter the gallery.",
  }),
  expandPuzzle({
    id: "dg07.puz.bridge",
    room: "dg07.r06",
    type: "explicit",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg07.bridge",
    initial: "southSpan",
    terminal: "northSpan",
    states: {
      southSpan: { safe: true, note: "Bridge meets the south walk. North gap is open, south door is on the south walk and does not need the bridge." },
      northSpan: { safe: true, terminal: true, note: "Bridge meets the north walk. South walk still holds the south door." },
    },
    edges: [
      { from: "southSpan", on: "rotate", to: "northSpan" },
      { from: "northSpan", on: "rotate", to: "southSpan" },
      { from: "northSpan", on: "reset", to: "southSpan", reset: true },
    ],
    solution: ["rotate"],
    reset: "The lever toggles. Both poses leave the south door on solid floor.",
  }),
  expandPuzzle({
    id: "dg07.puz.bailerWeight",
    room: "dg07.r07",
    type: "railBlock",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: null,
    blocks: [
      {
        id: "weight",
        ...line(["High", "Low"], [[4, 3], [5, 3]]),
      },
    ],
    initial: { weight: "High" },
    goal: { weight: "Low" },
    crankTile: "2,8",
    forbiddenTiles: ["7,0", "7,10", "2,8"],
    reset: "Crank returns the weight to High. Neither post is a door.",
  }),
  expandPuzzle({
    id: "dg07.puz.east",
    room: "dg07.r08",
    type: "railBlock",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg07.east",
    blocks: [
      { id: "westRail", ...line(["A", "B", "C"], [[3, 3], [4, 3], [5, 3]]) },
      { id: "eastRail", ...line(["A", "B", "C"], [[3, 7], [4, 7], [5, 7]]) },
    ],
    initial: { westRail: "A", eastRail: "A" },
    goal: { westRail: "C", eastRail: "C" },
    crankTile: "12,2",
    forbiddenTiles: ["7,0", "7,10", "12,2"],
    reset: "One crank restores both rails. The rails do not share tiles and do not meet the doors.",
  }),
  expandPuzzle({
    id: "dg07.puz.shapes",
    room: "dg07.r11",
    type: "adjacentSwap",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    initial: ["SQUARE", "ROUND", "TRIANGLE"],
    goal: ["TRIANGLE", "SQUARE", "ROUND"],
    latchFlag: "dg07.shapes",
    reset: "Tipping the box returns square, round, triangle. Stones cannot fall into the intervale.",
  }),
  expandPuzzle({
    id: "dg07.puz.fan",
    room: "dg07.r12",
    type: "explicit",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg07.fan",
    initial: "blowing",
    terminal: "stopped",
    states: {
      blowing: { safe: true, note: "Fan runs. The lever is on the near side, south of the wind." },
      stopped: { safe: true, terminal: true, note: "Fan stopped. North latch opens. Wind tiles were never the only floor." },
    },
    edges: [
      { from: "blowing", on: "lever", to: "stopped" },
      { from: "blowing", on: "boots-cross", to: "stopped" },
      { from: "stopped", on: "reset", to: "blowing", reset: true },
    ],
    solution: ["lever"],
    reset: "The lever is a toggle in the world; the latch stays open after the first stop, so resetting the fan does not close the north door.",
  }),
  expandPuzzle({
    id: "dg07.puz.rod",
    room: "dg07.r14",
    type: "railBlock",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg07.rod",
    blocks: [
      {
        id: "pin",
        ...line(["Near", "Mid", "Far"], [[8, 3], [9, 3], [10, 3]]),
      },
    ],
    initial: { pin: "Far" },
    goal: { pin: "Near" },
    crankTile: "2,2",
    forbiddenTiles: ["7,0", "7,10", "2,2"],
    reset: "Crank returns the pin to Far. The post east of Far is wall, not a pit.",
  }),
  expandPuzzle({
    id: "dg07.puz.pin",
    room: "dg07.r16",
    type: "railBlock",
    major: false,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: null,
    blocks: [
      {
        id: "drumPin",
        ...line(["In", "Out"], [[8, 3], [9, 3]]),
      },
    ],
    initial: { drumPin: "Out" },
    goal: { drumPin: "In" },
    crankTile: "3,9",
    forbiddenTiles: ["7,10", "2,2", "12,2", "2,8", "12,8", "3,9"],
    reset: "Crank returns the pin to Out. Corners 2,2 12,2 2,8 12,8 are not on the rail.",
  }),
];

function r(partial) {
  return room(partial);
}

dg07.rooms = [
  r({
    id: "dg07.r01",
    name: "Intervale Door",
    summary:
      "The Cornwall door, above the hay fog. A lintel diagram shows push and pull. A practice block rides a two-post rail that cannot touch the doors. The dungeon does not admit a body without the block rod; the practice rail is how the rod is remembered, not how it is earned.",
    floor: hubGrid(["N", "S"], (g) => {
      g[3][3] = ",";
      g[3][4] = ",";
      g[8][2] = ",";
    }),
    spawn: { x: CX, y: 8 },
    exits: [
      exit({ id: "to-nave", x: CX, y: 0, to: "dg07.r02", dir: "N" }),
      exit({
        id: "to-town",
        x: CX,
        y: H - 1,
        to: "overworld.cornwall.intervale",
        dir: "S",
        external: true,
      }),
    ],
    interactions: [
      interact({
        id: "read-diagram",
        x: 4,
        y: 8,
        verb: "Read the lintel diagram",
        givesEvidence: ["dg07.ev.diagram"],
      }),
      interact({
        id: "solve-practice",
        x: 3,
        y: 3,
        verb: "Rod the practice block onto the far post",
        puzzle: "dg07.puz.practice",
        requiresTools: ["blockRod"],
        optional: true,
        setsFlags: ["dg07.practice"],
        givesCollectibles: ["dg07.stone.practice"],
      }),
    ],
    solutionTrace: [
      "Read the lintel.",
      "Ignore or solve the practice rail. The north door is already a door.",
    ],
  }),
  r({
    id: "dg07.r02",
    name: "Nave of Beams",
    summary:
      "The barn's nave. A stair is the way north into the west mow. A lift exists and is not the way: its counterweight can be played with and the stair remains. After the east mow is latched, a roof door on the east opens the shortcut to the antechamber.",
    floor: hubGrid(["N", "S", "E"], (g) => {
      for (let y = 2; y <= 4; y++) g[y][4] = "#";
      g[6][10] = ",";
    }),
    exits: [
      exit({ id: "to-door", x: CX, y: H - 1, to: "dg07.r01", dir: "S" }),
      exit({ id: "to-mow", x: CX, y: 0, to: "dg07.r03", dir: "N" }),
      exit({
        id: "shortcut-to-ante",
        x: W - 1,
        y: CY,
        to: "dg07.r09",
        dir: "E",
        requiresFlags: ["dg07.mow", "dg07.choir", "dg07.bridge", "dg07.bailer", "dg07.east"],
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "ride-lift",
        x: 10,
        y: 6,
        verb: "Inspect the lift",
        note: "The lift runs only while its weight sits on the painted post. Moving that weight is local and the stair does not care. The weight's post is not a door tile.",
      }),
    ],
    solutionTrace: ["Take the stair north.", "Leave the lift. The east roof door is for a later body."],
  }),
  r({
    id: "dg07.r03",
    name: "West Mow",
    summary:
      "One haystone on a four-post rail along the north of the aisle, off the doors. The sheaf-painted post latches the north door. A further post opens a niche and nothing else. The crank is on the south catwalk.",
    latchFlags: ["dg07.mow"],
    reset: {
      control: "catwalk-crank",
      tile: [2, 8],
      resets: ["dg07.puz.mow"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    rails: [{ id: "haystone", tiles: [[3, 3], [4, 3], [5, 3], [6, 3]] }],
    floor: hubGrid(["N", "S"], (g) => {
      g[3][3] = ",";
      g[3][4] = ",";
      g[3][5] = ",";
      g[3][6] = ",";
      g[8][2] = ",";
    }),
    exits: [
      exit({ id: "to-nave", x: CX, y: H - 1, to: "dg07.r02", dir: "S" }),
      exit({
        id: "to-rope",
        x: CX,
        y: 0,
        to: "dg07.r04",
        dir: "N",
        requiresFlags: ["dg07.mow"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-mow",
        x: 5,
        y: 3,
        verb: "Set the haystone on the sheaf plate",
        puzzle: "dg07.puz.mow",
        requiresTools: ["blockRod"],
        setsFlags: ["dg07.mow"],
      }),
    ],
    solutionTrace: [
      "Push or rod the haystone to the sheaf post.",
      "The niche post is optional and not past a pit.",
      "Go north. Reset from the south catwalk if the stone is sulking.",
    ],
  }),
  r({
    id: "dg07.r04",
    name: "Rope Walk",
    summary:
      "A rope-walk between mow and choir. The mow key hangs on a peg at eye height. A sugar-line ring high on the beam is only a stone. Hinge beetles charge on a telegraph.",
    floor: hubGrid(["N", "S"], (g) => {
      g[4][3] = "#";
      g[6][3] = "#";
      g[4][11] = "#";
      g[6][11] = "#";
    }),
    exits: [
      exit({ id: "to-mow", x: CX, y: H - 1, to: "dg07.r03", dir: "S" }),
      exit({ id: "to-choir", x: CX, y: 0, to: "dg07.r05", dir: "N" }),
    ],
    interactions: [
      interact({
        id: "take-mow-key",
        x: 9,
        y: 3,
        verb: "Take the mow key",
        givesKeys: ["dg07.sk.mow"],
      }),
      interact({
        id: "sugar-ring",
        x: 3,
        y: 2,
        verb: "Hook the high ring with the sugar-line",
        requiresTools: ["sugarLine"],
        optional: true,
        givesCollectibles: ["dg07.stone.line"],
      }),
    ],
    encounters: [{ enemy: "dg07.enemy.hingeBeetle", count: 2, tiles: [[4, 8], [10, 8]] }],
    solutionTrace: ["Take the mow key from the peg.", "Continue north. The key is not used until after the bailer."],
  }),
  r({
    id: "dg07.r05",
    name: "Counterweight Choir",
    summary:
      "Three weights on vertical rails, low mid high. The soot shadow and the iron palm both show low, high, mid. The crank is on a side gallery the weights cannot enter. Solving latches the north door.",
    latchFlags: ["dg07.choir"],
    reset: {
      control: "gallery-crank",
      tile: [2, 2],
      resets: ["dg07.puz.choir"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      g[2][4] = ",";
      g[2][7] = ",";
      g[2][10] = ",";
      g[8][12] = ",";
    }),
    exits: [
      exit({ id: "to-rope", x: CX, y: H - 1, to: "dg07.r04", dir: "S" }),
      exit({
        id: "to-bridge",
        x: CX,
        y: 0,
        to: "dg07.r06",
        dir: "N",
        requiresFlags: ["dg07.choir"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-choir",
        x: 4,
        y: 2,
        verb: "Set the weights to the palm's pose",
        puzzle: "dg07.puz.choir",
        setsFlags: ["dg07.choir"],
        givesEvidence: ["dg07.ev.palm"],
      }),
    ],
    solutionTrace: [
      "Read the shadow and the palm: left low, middle high, right mid.",
      "Move the weights. The left one is already low.",
      "Go north.",
    ],
  }),
  r({
    id: "dg07.r06",
    name: "Grain Pit Bridge",
    summary:
      "The pit is a hay drop onto a lower catwalk with a ladder back up, in this same room, not a second dungeon and not a place a block can fall. A bridge rotates between south span and north span. The south door is on the south walk in both poses.",
    latchFlags: ["dg07.bridge"],
    reset: {
      control: "bridge-lever",
      tile: [2, 8],
      resets: ["dg07.puz.bridge"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      g[4][3] = ",";
      g[4][11] = ",";
      g[8][2] = ",";
    }),
    exits: [
      exit({ id: "to-choir", x: CX, y: H - 1, to: "dg07.r05", dir: "S" }),
      exit({
        id: "to-bailer",
        x: CX,
        y: 0,
        to: "dg07.r07",
        dir: "N",
        requiresFlags: ["dg07.bridge"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-bridge",
        x: 3,
        y: 4,
        verb: "Rotate the bridge to the north span",
        puzzle: "dg07.puz.bridge",
        setsFlags: ["dg07.bridge"],
      }),
    ],
    solutionTrace: [
      "Rotate the bridge once so it meets the north walk.",
      "The south door remains on the south boards.",
      "Go north toward the bailer.",
    ],
  }),
  r({
    id: "dg07.r07",
    name: "The Bailer's Run",
    summary:
      "Miniboss. The bailer arm slides a fixed track. A two-post counterweight, off the doors, shortens the arm and bares the gear. Three strikes. The mow key and the defeat both gate the north door. The south door stays.",
    latchFlags: ["dg07.bailer"],
    reset: {
      control: "weight-crank",
      tile: [2, 8],
      resets: ["dg07.puz.bailerWeight", "miniboss-phase"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    rails: [{ id: "weight", tiles: [[4, 3], [5, 3]] }],
    floor: hubGrid(["N", "S"], (g) => {
      g[3][4] = ",";
      g[3][5] = ",";
      g[8][2] = ",";
    }),
    exits: [
      exit({ id: "to-bridge", x: CX, y: H - 1, to: "dg07.r06", dir: "S" }),
      exit({
        id: "to-east",
        x: CX,
        y: 0,
        to: "dg07.r08",
        dir: "N",
        requiresFlags: ["dg07.bailer"],
        requiresKeys: ["dg07.sk.mow"],
        setsFlags: ["dg07.lock.east.open"],
      }),
    ],
    interactions: [
      interact({
        id: "defeat-bailer",
        x: CX,
        y: 6,
        verb: "Drop the weight and strike the gear",
        puzzle: "dg07.puz.bailerWeight",
        requiresTools: ["blockRod"],
        setsFlags: ["dg07.bailer"],
      }),
    ],
    solutionTrace: [
      "Rod or push the weight from High to Low.",
      "Strike the gear three times when the arm shortens.",
      "Open the north door with the mow key.",
    ],
  }),
  r({
    id: "dg07.r08",
    name: "East Mow",
    summary:
      "Two rails, three posts each, no shared tiles. Both stones on their far posts latch the north door. One crank restores both. Neither rail can be walked into a door.",
    latchFlags: ["dg07.east"],
    reset: {
      control: "shared-crank",
      tile: [12, 2],
      resets: ["dg07.puz.east"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    rails: [
      { id: "westRail", tiles: [[3, 3], [4, 3], [5, 3]] },
      { id: "eastRail", tiles: [[3, 7], [4, 7], [5, 7]] },
    ],
    floor: hubGrid(["N", "S"], (g) => {
      for (const y of [3, 7]) {
        g[y][3] = ",";
        g[y][4] = ",";
        g[y][5] = ",";
      }
      g[2][12] = ",";
    }),
    exits: [
      exit({ id: "to-bailer", x: CX, y: H - 1, to: "dg07.r07", dir: "S" }),
      exit({
        id: "to-ante",
        x: CX,
        y: 0,
        to: "dg07.r09",
        dir: "N",
        requiresFlags: ["dg07.east"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-east",
        x: 5,
        y: 3,
        verb: "Set both stones on their far posts",
        puzzle: "dg07.puz.east",
        requiresTools: ["blockRod"],
        setsFlags: ["dg07.east"],
      }),
    ],
    solutionTrace: [
      "Move each stone along its own rail to the northmost of its three posts.",
      "Order does not matter.",
      "Go north.",
    ],
  }),
  r({
    id: "dg07.r09",
    name: "Threshing Antechamber",
    summary:
      "A landing before the elevator. The farmhand's slip is nailed here, including the warning about cranks and catwalks. The west door is the roof shortcut back to the nave, open only after this room has already been earned.",
    floor: hubGrid(["N", "S", "W"], (g) => {
      g[3][4] = ",";
    }),
    exits: [
      exit({ id: "to-east", x: CX, y: H - 1, to: "dg07.r08", dir: "S" }),
      exit({ id: "to-elevator", x: CX, y: 0, to: "dg07.r10", dir: "N" }),
      exit({
        id: "shortcut-to-nave",
        x: 0,
        y: CY,
        to: "dg07.r02",
        dir: "W",
        requiresFlags: ["dg07.mow", "dg07.choir", "dg07.bridge", "dg07.bailer", "dg07.east"],
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "read-farmhand",
        x: 4,
        y: 3,
        verb: "Read the farmhand slip",
        givesEvidence: ["dg07.ev.farmhand"],
      }),
    ],
    encounters: [{ enemy: "dg07.enemy.hingeBeetle", count: 2, tiles: [[10, 3], [10, 8]] }],
    solutionTrace: ["Read the slip.", "Go north to the elevator. West is the way back, not the way on."],
  }),
  r({
    id: "dg07.r10",
    name: "Hay Elevator",
    summary:
      "A ladder is the path. The elevator weight is bolted and cosmetic. A cape can glide to a beam stone after the top has been seen; the glide lands in hay in this room, with the ladder still there. Nothing drops Ellis into another room.",
    floor: hubGrid(["N", "S"], (g) => {
      g[4][10] = ",";
      g[6][10] = "h";
    }),
    exits: [
      exit({ id: "to-ante", x: CX, y: H - 1, to: "dg07.r09", dir: "S" }),
      exit({ id: "to-ledger", x: CX, y: 0, to: "dg07.r11", dir: "N" }),
    ],
    interactions: [
      interact({
        id: "cape-beam",
        x: 10,
        y: 4,
        verb: "Glide from the beam into the hay",
        requiresTools: ["cape"],
        optional: true,
        givesCollectibles: ["dg07.stone.elevator"],
      }),
    ],
    solutionTrace: ["Climb the ladder north.", "The cape is a stone, not a door."],
  }),
  r({
    id: "dg07.r11",
    name: "Saint's Ledger",
    summary:
      "A box whose lid is cut triangle, square, round. The stones match and start in the wrong order. The tally beside the box ends in a blank labeled EATER. Shapes open the north door. They are not a word.",
    latchFlags: ["dg07.shapes"],
    reset: {
      control: "tip-box",
      tile: [12, 8],
      resets: ["dg07.puz.shapes"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S"], (g) => {
      g[6][4] = ",";
      g[6][7] = ",";
      g[6][10] = ",";
    }),
    exits: [
      exit({ id: "to-elevator", x: CX, y: H - 1, to: "dg07.r10", dir: "S" }),
      exit({
        id: "to-weather",
        x: CX,
        y: 0,
        to: "dg07.r12",
        dir: "N",
        requiresFlags: ["dg07.shapes"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-shapes",
        x: 4,
        y: 6,
        verb: "Seat triangle, square, round",
        puzzle: "dg07.puz.shapes",
        setsFlags: ["dg07.shapes"],
        givesEvidence: ["dg07.ev.tally"],
      }),
    ],
    solutionTrace: [
      "Read the lid and the rim.",
      "Swap stones until triangle, square, round.",
      "Go north.",
    ],
  }),
  r({
    id: "dg07.r12",
    name: "Iron Weather",
    summary:
      "A fan mill blows across a side aisle. The main floor to the lever is quiet. Stopping the fan latches the north door. Boots can cross the blow and also latch it; they are not required. East is the powder loft, which the saint does not require.",
    latchFlags: ["dg07.fan"],
    reset: {
      control: "fan-lever",
      tile: [3, 8],
      resets: ["dg07.puz.fan"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["N", "S", "E"], (g) => {
      g[3][10] = "!";
      g[3][11] = "!";
      g[4][10] = "!";
      g[8][3] = ",";
    }),
    exits: [
      exit({ id: "to-ledger", x: CX, y: H - 1, to: "dg07.r11", dir: "S" }),
      exit({
        id: "to-rod",
        x: CX,
        y: 0,
        to: "dg07.r14",
        dir: "N",
        requiresFlags: ["dg07.fan"],
      }),
      exit({ id: "to-powder", x: W - 1, y: CY, to: "dg07.r13", dir: "E" }),
    ],
    interactions: [
      interact({
        id: "cut-fan",
        x: 3,
        y: 8,
        verb: "Throw the lever and stop the fan",
        puzzle: "dg07.puz.fan",
        setsFlags: ["dg07.fan"],
      }),
      interact({
        id: "boots-cross",
        x: 11,
        y: 4,
        verb: "Cross the blow in boots",
        requiresTools: ["boots"],
        optional: true,
        setsFlags: ["dg07.fan"],
        note: "Same latch as the lever. The lever is on the quiet floor.",
      }),
    ],
    solutionTrace: [
      "Throw the near lever. Do not walk the blown tiles.",
      "Go north.",
      "The powder loft is east and optional.",
    ],
  }),
  r({
    id: "dg07.r13",
    name: "Powder Loft",
    summary:
      "An optional bin. A keg cracks a niche if Ellis is carrying powder. Without a keg the room is still a room: a note, a door back, no latch on the way to the saint. The niche is not a required key.",
    optional: true,
    floor: hubGrid(["W"], (g) => {
      g[4][4] = ",";
      g[6][8] = "#";
    }),
    exits: [exit({ id: "back-weather", x: 0, y: CY, to: "dg07.r12", dir: "W" })],
    interactions: [
      interact({
        id: "read-keg-note",
        x: 4,
        y: 4,
        verb: "Read the bin note",
        note: "Pell stored powder for stumps, not for the saint. The note says the north way is the fan, not the keg.",
      }),
      interact({
        id: "blow-niche",
        x: 8,
        y: 4,
        verb: "Crack the niche with a powder keg",
        requiresTools: ["powderKeg"],
        optional: true,
        givesCollectibles: ["dg07.stone.powder"],
      }),
    ],
    solutionTrace: ["Read the note.", "Return west. A keg is a stone, not progress."],
  }),
  r({
    id: "dg07.r14",
    name: "Rod Gallery",
    summary:
      "The pin that matters. It starts on the far post. An iron post fills the tile beyond it, so Ellis cannot walk behind it to push. The rod pulls it west to the near plate. The crank is west of the rail. This is why the loft asks for the rod at the door of the dungeon rather than here, where a missing rod would waste the walk.",
    latchFlags: ["dg07.rod"],
    reset: {
      control: "west-crank",
      tile: [2, 2],
      resets: ["dg07.puz.rod"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    rails: [{ id: "pin", tiles: [[8, 3], [9, 3], [10, 3]] }],
    floor: hubGrid(["N", "S"], (g) => {
      g[3][8] = ",";
      g[3][9] = ",";
      g[3][10] = ",";
      g[3][11] = "#";
      g[4][11] = "#";
      g[2][2] = ",";
    }),
    exits: [
      exit({ id: "to-weather", x: CX, y: H - 1, to: "dg07.r12", dir: "S" }),
      exit({
        id: "to-door",
        x: CX,
        y: 0,
        to: "dg07.r15",
        dir: "N",
        requiresFlags: ["dg07.rod"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-rod",
        x: 8,
        y: 4,
        verb: "Pull the pin onto the near plate",
        puzzle: "dg07.puz.rod",
        requiresTools: ["blockRod"],
        setsFlags: ["dg07.rod"],
      }),
    ],
    solutionTrace: [
      "Stand west of the pin.",
      "Pull twice, far to mid to near.",
      "Go north. The crank undoes it without sealing the south door.",
    ],
  }),
  r({
    id: "dg07.r15",
    name: "Saint's Door",
    summary:
      "The tally's blank is repeated on the door as an empty plate. The saint key is in a drawer that opens when the shapes and the rod pin are both latched, which they are if Ellis is here by the main walk. The key is still a key, not a flag pretending.",
    floor: hubGrid(["N", "S"]),
    exits: [
      exit({ id: "to-rod", x: CX, y: H - 1, to: "dg07.r14", dir: "S" }),
      exit({
        id: "to-saint",
        x: CX,
        y: 0,
        to: "dg07.r16",
        dir: "N",
        requiresKeys: ["dg07.bk.saint"],
        setsFlags: ["dg07.lock.boss.open"],
      }),
    ],
    interactions: [
      interact({
        id: "take-big-key",
        x: 4,
        y: 6,
        verb: "Take the saint key",
        requiresFlags: ["dg07.shapes", "dg07.rod"],
        givesKeys: ["dg07.bk.saint"],
      }),
    ],
    solutionTrace: ["Take the saint key.", "Open the north door."],
  }),
  r({
    id: "dg07.r16",
    name: "The Thresher Saint",
    summary:
      "Boss. H. Pell in sackcloth and iron teeth. The flail follows painted rows. A corner-safe drum waits behind a pin on a two-post rail that does not touch the corners or the south door. The bell and the weight crank are on the ring, always reachable.",
    latchFlags: ["dg07.boss"],
    reset: {
      control: "pin-crank",
      tile: [3, 9],
      resets: ["dg07.puz.pin", "boss-phase"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    rails: [{ id: "drumPin", tiles: [[8, 3], [9, 3]] }],
    floor: hubGrid(["S"], (g) => {
      g[3][8] = ",";
      g[3][9] = ",";
      g[2][2] = "+";
      g[2][12] = "+";
      g[8][2] = "+";
      g[8][12] = "+";
      g[9][3] = ",";
    }),
    exits: [exit({ id: "to-door", x: CX, y: H - 1, to: "dg07.r15", dir: "S" })],
    interactions: [
      interact({
        id: "defeat-saint",
        x: CX,
        y: 5,
        verb: "Unbind the Thresher Saint",
        puzzle: "dg07.puz.pin",
        requiresTools: ["blockRod"],
        setsFlags: ["dg07.boss"],
        givesEvidence: ["dg07.ev.eaten"],
      }),
    ],
    solutionTrace: [
      "Step off the painted row each sweep. Set the arena weight low and strike the gear three times.",
      "Ring the bell in the chaff. Strike three times.",
      "Pull the drum pin. The corners stay empty. Strike four times.",
    ],
  }),
];

dg07.miniboss = {
  id: "dg07.miniboss.bailer",
  name: "The Bailer",
  room: "dg07.r07",
  distinctFromBoss: true,
  fsm: {
    initial: "arm",
    terminal: "defeated",
    resetFromAny: true,
    states: bailerStates,
    edges: bailerEdges,
    solution: ["set-weight-low", "arm-passes", "strike", "strike", "strike"],
  },
};

dg07.boss = {
  id: "dg07.boss.thresherSaint",
  name: "The Thresher Saint",
  room: "dg07.r16",
  arenaLeavesExits: true,
  cornersAlwaysOpen: ["2,2", "12,2", "2,8", "12,8"],
  fsm: {
    initial: "idle_count",
    terminal: "unbound",
    resetFromAny: true,
    states: saintStates,
    edges: saintEdges,
    solution: [
      "approach",
      "set-weight-low",
      "strike",
      "strike",
      "strike",
      "ring-bell",
      "strike",
      "strike",
      "strike",
      "pull-pin",
      "strike",
      "strike",
      "strike",
      "strike",
    ],
  },
};
