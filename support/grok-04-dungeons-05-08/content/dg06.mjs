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

const gHits = hitChain("g", 3, "defeated", "The gauge dips after the lash. The joint is on the dry side.");
const p1 = hitChain("p1", 3, "phase2_sink", "The false surface flickers at chest height and does not cover the ring.");
const p2 = hitChain("p2", 3, "phase3_mark", "The crank has washed the false measure off the ring.");
const p3 = hitChain("p3", 4, "released", "Bubbles mark the dock. The same number is cut into that dock's stone.");

const gaugeStates = {
  pace: {
    terminal: false,
    safe: true,
    note: "The staff walks the shallows. The room's travel floor stays dry stone; the fight overlay forces shallow and never deep. South door stays open.",
  },
  dip: { terminal: false, safe: true, tell: "The staff pauses, then the joint dips toward a cardinal side." },
  defeated: {
    terminal: true,
    safe: true,
    setsFlags: ["dg06.gauge"],
    givesKeys: ["dg06.sk.penstock"],
  },
  ...gHits.states,
};
const gaugeEdges = [
  { from: "pace", on: "wait-out-the-lash", to: "dip" },
  { from: "dip", on: "step-off-the-line", to: gHits.first },
  ...gHits.edges,
];
withReset(gaugeStates, gaugeEdges, "pace");

const drownedStates = {
  surface_denied: {
    terminal: false,
    safe: true,
    note: "A ring of dry stone around a permanent basin. The Surveyor stands in the basin. Ellis is never required to enter it.",
  },
  phase1_lash: {
    terminal: false,
    safe: true,
    tell: "The sounding line goes taut along one cardinal. It slacks a beat later.",
  },
  phase2_sink: {
    terminal: false,
    safe: true,
    tell: "Two ring stones darken to shallow. At least six ring stones stay dry, including the south door and the crank.",
    minDryRingTiles: 6,
  },
  phase3_mark: {
    terminal: false,
    safe: true,
    tell: "Bubbles rise at one dock. That dock's carved number matches the number showing on the staff.",
  },
  released: {
    terminal: true,
    safe: true,
    setsFlags: ["dg06.boss"],
    givesEvidence: ["dg06.ev.officeNail"],
  },
  ...p1.states,
  ...p2.states,
  ...p3.states,
};
const drownedEdges = [
  { from: "surface_denied", on: "approach", to: "phase1_lash" },
  { from: "phase1_lash", on: "lash-recovers", to: p1.first },
  { from: "phase2_sink", on: "crank-arena-sluice", to: p2.first },
  { from: "phase3_mark", on: "stand-on-marked-dock", to: p3.first },
  ...p1.edges,
  ...p2.edges,
  ...p3.edges,
];
withReset(drownedStates, drownedEdges, "surface_denied");

function flumeGrid() {
  return grid({
    doors: [
      { x: 12, y: 10, ch: "+" },
      { x: 0, y: 5, ch: "=" },
    ],
    paint(g) {
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) g[y][x] = "W";
      }
      for (let y = 1; y <= 9; y++) g[y][12] = "+";
      for (let x = 1; x <= 11; x++) g[5][x] = "=";
      g[5][12] = "+";
    },
  });
}

function surfaceGrid() {
  return grid({
    doors: standardDoors(["W", "N"]),
    paint(g) {
      for (let y = 2; y <= 8; y++) {
        for (let x = 2; x <= 12; x++) g[y][x] = "W";
      }
      for (let y = 1; y <= 9; y++) g[y][CX] = "+";
      for (let x = 1; x <= 13; x++) g[CY][x] = "+";
      for (let x = 2; x <= 12; x++) {
        g[2][x] = "+";
        g[8][x] = "+";
      }
      for (let y = 2; y <= 8; y++) {
        g[y][2] = "+";
        g[y][12] = "+";
      }
    },
  });
}

function lockGrid() {
  return grid({
    doors: [...standardDoors(["W", "E"]), { x: 14, y: 9, ch: "W" }],
    paint(g) {
      g[8][13] = "W";
      g[9][12] = "W";
      g[9][13] = "W";
      keepHub(g);
    },
  });
}

function cisternGrid() {
  return grid({
    doors: [{ x: CX, y: 0, ch: "+" }],
    paint(g) {
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) g[y][x] = "W";
      }
      g[1][CX] = "+";
      g[2][CX] = "+";
      g[2][CX - 1] = "+";
      g[2][CX + 1] = "+";
    },
  });
}

function chapelGrid() {
  return grid({
    doors: [
      { x: CX, y: H - 1, ch: "." },
      { x: W - 1, y: CY, ch: "." },
      { x: CX, y: 0, ch: "W" },
    ],
    paint(g) {
      g[1][CX] = ".";
      g[2][3] = "~";
      g[2][4] = "~";
      keepHub(g);
      g[1][CX] = ".";
    },
  });
}

export const dg06 = {
  id: "dg06",
  name: "The Reservoir Without a Surface",
  sequence: 6,
  county: "Addison County, Vermont",
  town: "Weybridge",
  site: "The disused lower race of a Weybridge mill on Otter Creek. The reservoir behind the race has a volume and refuses a surface.",
  premise:
    "A previous Surveyor, A. Vesper, tried to name the height of the water and drowned in the naming. The main walk is banks, catwalks, and a grate that opens only when the race is drained. Creek fins are never required to enter, finish, or leave. Deep water pushes a body without fins back to the nearest shore and deals no damage.",
  bossId: "dg06.boss.drownedSurveyor",
  minibossId: "dg06.miniboss.staffGauge",
  entranceRoom: "dg06.r01",
  goalFlag: "dg06.boss",
  initialLevel: 1,
  levels: [0, 1, 2],
  requiredTools: [],
  optionalTools: ["creekFins", "net", "lamp"],
  designAssertions: ["noRequiredFins", "fairClues", "shownSolutions"],
  deepWaterPolicy: {
    withoutFins: "push-to-nearest-non-deep-tile",
    damage: 0,
    cannotStrand: true,
    spawnOnDeep: false,
    permanentDeepChar: "W",
    note: "W never drains. = and ~ follow the race level. Water controls exist only in rooms whose floors are never deep.",
  },
  waterControlRooms: ["dg06.r04", "dg06.r08"],
  input: {
    combat: "four-direction",
    keyboard: "cardinal movement and a single action",
    touch: "cardinal pad and tap on the interaction tile",
    parity: "Every exit and interaction has a tile.",
  },
  entry: {
    campaignPrerequisites: [
      {
        id: "dg05.boss",
        external: false,
        kind: "flag",
        note: "Proposed link from the White Library. Standalone testing grants it at the door.",
      },
    ],
    standalonePrerequisites: [],
    assumedGrantedFlags: ["dg05.boss"],
    proposedUnlocks: [
      {
        id: "dg07.entry.unbarred",
        whenFlag: "dg06.boss",
        kind: "proposed-campaign-link",
        notRuntimeApi: true,
        note: "The Cornwall hayloft door is the proposed next threshold after Vesper is released.",
      },
    ],
  },
  death: {
    checkpointRoom: "dg06.r01",
    ageAdvanceYears: 14,
    keysPersist: true,
    evidencePersists: true,
    latchedFlagsPersist: true,
    waterLevelPersists: true,
    bossResetsUnlessDefeated: true,
    unsolvedPuzzlesReset: true,
    enemiesRespawn: true,
    cannotSpawnInDeepWater: true,
    cannotSpawnOnBlock: true,
    epitaph:
      "In {roomName}, the body stopped. Ellis Perch drew the next breath fourteen years on. The race kept the level Ellis last set. It did not keep Ellis in the basin.",
    voiceOnReentry: "Vesper measured a surface and became part of the volume. Do not finish the measurement.",
    otherVoiceOnReentry: "Vesper slipped. The office prefers a holier verb.",
    onReentrySolvedRooms: "The ratchet, once pulled, stays pulled. An unsolved valve row resets.",
  },
  routes: {
    main: [
      { do: "exit", id: "to-sluice" },
      { do: "exit", id: "to-dock" },
      { do: "interact", id: "read-notebook" },
      { do: "exit", id: "back-sluice" },
      { do: "exit", id: "to-gauge-house" },
      { do: "interact", id: "set-level-0" },
      { do: "exit", id: "to-flume" },
      { do: "exit", id: "to-ratchet" },
      { do: "interact", id: "pull-ratchet" },
      { do: "exit", id: "to-penstock" },
      { do: "exit", id: "to-staff" },
      { do: "interact", id: "defeat-gauge" },
      { do: "exit", id: "to-valves" },
      { do: "interact", id: "solve-valves" },
      { do: "exit", id: "to-sounding" },
      { do: "exit", id: "to-surface" },
      { do: "exit", id: "to-chapel" },
      { do: "exit", id: "to-bank" },
      { do: "exit", id: "to-landing" },
      { do: "interact", id: "solve-landing" },
      { do: "interact", id: "take-big-key" },
      { do: "exit", id: "to-boss" },
      { do: "interact", id: "defeat-surveyor" },
    ],
    optionalBranches: [
      {
        id: "dg06.branch.loft",
        rooms: ["dg06.r08"],
        script: [
          { do: "exit", id: "to-sluice" },
          { do: "exit", id: "to-gauge-house" },
          { do: "interact", id: "set-level-0" },
          { do: "exit", id: "to-flume" },
          { do: "exit", id: "to-ratchet" },
          { do: "interact", id: "pull-ratchet" },
          { do: "exit", id: "to-penstock" },
          { do: "exit", id: "to-loft" },
          { do: "interact", id: "read-loft-plate" },
          { do: "exit", id: "bridge-to-sluice" },
        ],
      },
      {
        id: "dg06.branch.cistern",
        rooms: ["dg06.r17"],
        requiresTools: ["creekFins"],
        script: [
          { do: "exit", id: "to-sluice" },
          { do: "exit", id: "to-gauge-house" },
          { do: "interact", id: "set-level-0" },
          { do: "exit", id: "to-flume" },
          { do: "exit", id: "to-ratchet" },
          { do: "interact", id: "pull-ratchet" },
          { do: "exit", id: "to-penstock" },
          { do: "exit", id: "to-staff" },
          { do: "interact", id: "defeat-gauge" },
          { do: "exit", id: "to-valves" },
          { do: "interact", id: "solve-valves" },
          { do: "exit", id: "to-sounding" },
          { do: "exit", id: "to-cistern" },
          { do: "interact", id: "read-unsounded" },
          { do: "exit", id: "back-sounding" },
        ],
      },
    ],
    shortcut: {
      id: "dg06.short.loft-bridge",
      description:
        "After the ratchet is pulled, the loft bridge joins the sluice hall to the penstock. A later body skips the gauge house, the flume, and the ratchet chamber.",
      from: "dg06.r02",
      to: "dg06.r08",
      skipsRooms: ["dg06.r04", "dg06.r05", "dg06.r06"],
      assumeFlags: ["dg06.ratchet", "dg06.gauge", "dg06.valves"],
      assumeKeys: ["dg06.sk.penstock"],
      startRoom: "dg06.r01",
      script: [
        { do: "exit", id: "to-sluice" },
        { do: "exit", id: "bridge-to-loft" },
        { do: "exit", id: "to-penstock" },
        { do: "exit", id: "to-staff" },
        { do: "exit", id: "to-valves" },
        { do: "exit", id: "to-sounding" },
        { do: "exit", id: "to-surface" },
        { do: "exit", id: "to-chapel" },
        { do: "exit", id: "to-bank" },
        { do: "exit", id: "to-landing" },
        { do: "interact", id: "solve-landing" },
        { do: "interact", id: "take-big-key" },
        { do: "exit", id: "to-boss" },
        { do: "interact", id: "defeat-surveyor" },
      ],
    },
    finsShortcut: {
      id: "dg06.short.chapel-current",
      description: "With fins, a current from the chapel reaches the landing and skips the long bank. The bank remains the walk.",
      requiresTools: ["creekFins"],
      assumeFlags: ["dg06.ratchet", "dg06.gauge", "dg06.valves"],
      assumeKeys: ["dg06.sk.penstock"],
      startRoom: "dg06.r13",
      script: [
        { do: "exit", id: "current-to-landing" },
        { do: "interact", id: "solve-landing" },
        { do: "interact", id: "take-big-key" },
        { do: "exit", id: "to-boss" },
        { do: "interact", id: "defeat-surveyor" },
      ],
    },
  },
  keys: [
    {
      id: "dg06.sk.penstock",
      kind: "small",
      name: "Penstock key",
      source: { room: "dg06.r09", interaction: "defeat-gauge" },
      opens: ["dg06.lock.sounding"],
    },
    {
      id: "dg06.bk.surveyor",
      kind: "big",
      name: "Sounding key",
      source: { room: "dg06.r15", interaction: "take-big-key" },
      opens: ["dg06.lock.boss"],
    },
  ],
  locks: [
    {
      id: "dg06.lock.sounding",
      keyId: "dg06.sk.penstock",
      optional: false,
      exit: "to-sounding",
      room: "dg06.r10",
    },
    {
      id: "dg06.lock.boss",
      keyId: "dg06.bk.surveyor",
      optional: false,
      exit: "to-boss",
      room: "dg06.r15",
    },
  ],
  clues: [
    {
      id: "dg06.clue.water.plaque",
      puzzle: "dg06.puz.water",
      room: "dg06.r02",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "The staff on the wall has heights and no waterline. Cut beneath it: THE GAUGE IS A WISH. THE STONE IS THE FLOOR.",
    },
    {
      id: "dg06.clue.water.model",
      puzzle: "dg06.puz.water",
      room: "dg06.r04",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "A wooden model of the race shows the flume grate open only when the painted water sits at the bottom mark. A plaque beside the cranks reads: LEAVE BY THE HATCH YOU RATCHET, THEN RETURN THE CREEK TO ITS STEP.",
    },
    {
      id: "dg06.clue.valves.model",
      puzzle: "dg06.puz.valves",
      room: "dg06.r04",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "Three chips on the same model are turned open, shut, open. Ellis can walk back to this room from the valves.",
    },
    {
      id: "dg06.clue.valves.enamel",
      puzzle: "dg06.puz.valves",
      room: "dg06.r10",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "A cloth already half off the valve faces shows chipped enamel: open, shut, open. Pulling the cloth the rest of the way does not change the order.",
    },
    {
      id: "dg06.clue.landing.strip",
      puzzle: "dg06.puz.landing",
      room: "dg06.r15",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "A bronze strip on the dry frame is stamped 2, 0, 1 under the words LEFT, MID, RIGHT.",
    },
    {
      id: "dg06.clue.landing.notch",
      puzzle: "dg06.puz.landing",
      room: "dg06.r15",
      fair: true,
      environmental: true,
      major: true,
      visibleWithoutLeavingRoom: true,
      notArbitrary: true,
      text: "Each weight wears the same numbers as the strip. The correct notch on each weight is cut deeper than the other notches.",
    },
  ],
  evidence: [
    {
      id: "dg06.ev.notebook",
      name: "Soaked field book",
      required: false,
      room: "dg06.r03",
      text: "Vesper's crew, in pencil that survived the wet: Fins forbidden on the main sounding. A swimmer invents a surface by wanting one. We will walk the stone.",
    },
    {
      id: "dg06.ev.noSurface",
      name: "Plaque without a waterline",
      required: false,
      room: "dg06.r02",
      text: "The painted gauge stops at numbers and never at a stain. Someone scrubbed the line off and did not paint it back.",
    },
    {
      id: "dg06.ev.vesper",
      name: "Name on the long bank",
      required: false,
      room: "dg06.r14",
      text: "Cut into the coping: A. VESPER, WEYBRIDGE. MEASURED AND WENT UNDER. No year of birth. A zero was started and left unfinished.",
    },
    {
      id: "dg06.ev.sermon",
      name: "Chapel card",
      required: false,
      room: "dg06.r13",
      text: "The creekfin chapel honors swimming and then forbids it for the office. Last line, Other Voice scratched under the Voice's blessing: The office is walked. The rest is weather.",
    },
    {
      id: "dg06.ev.buoy",
      name: "Buoy card",
      required: false,
      room: "dg06.r12",
      text: "A card the race pushes into the dry notch at every level: SURFACE: NONE. VOLUME: AS LAST LIED.",
    },
    {
      id: "dg06.ev.unsounded",
      name: "Unsounded scrap",
      required: false,
      room: "dg06.r17",
      text: "A zinc tag on the ladder: this spring was left out of the model because it would not take a zero. Fins or no fins, it is not the way out of the dungeon.",
    },
    {
      id: "dg06.ev.officeNail",
      name: "Vesper's office nail",
      required: false,
      room: "dg06.r16",
      text: "The nail the Surveyors pass. It is bent. It does not name a height.",
    },
  ],
  collectibles: [
    { id: "dg06.stone.buoy", name: "Buoy stone", optional: true, from: "dive-buoy" },
    { id: "dg06.stone.cistern", name: "Cistern stone", optional: true, from: "dive-cistern" },
  ],
  enemies: [
    {
      id: "dg06.enemy.siltEel",
      name: "Silt eel",
      hp: 3,
      damage: 1,
      movement: "cardinal",
      telegraph: "The silt humps, then the eel lunges one tile. It does not leave shallow or dry stone, and it cannot pull Ellis into deep water.",
    },
  ],
  puzzles: [],
  rooms: [],
  miniboss: {},
  boss: {},
};

dg06.puzzles = [
  expandPuzzle({
    id: "dg06.puz.water",
    room: "dg06.r04",
    type: "explicit",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    latchFlag: "dg06.ratchet",
    initial: "creek",
    terminal: "hatched",
    states: {
      creek: { safe: true, note: "Level 1. Grate shut. Banks open." },
      drained: { safe: true, note: "Level 0. Grate open. Gauge house still dry." },
      inFlume: { safe: true, note: "Inside the ratchet chamber, which does not flood." },
      hatched: { safe: true, terminal: true, note: "Ratchet pulled. Hatch to the penstock stays open at every level." },
    },
    edges: [
      { from: "creek", on: "set-0", to: "drained" },
      { from: "drained", on: "set-1", to: "creek" },
      { from: "creek", on: "set-2", to: "creek", note: "Flood does not open the grate." },
      { from: "drained", on: "enter-flume", to: "inFlume" },
      { from: "inFlume", on: "back-out", to: "drained" },
      { from: "inFlume", on: "ratchet", to: "hatched" },
      { from: "hatched", on: "set-any", to: "hatched" },
    ],
    solution: ["set-0", "enter-flume", "ratchet"],
    reset: "Before the ratchet, leaving the flume returns Ellis to the catwalk. The grate never closes on a body, because the ratchet room has no water control.",
  }),
  expandPuzzle({
    id: "dg06.puz.valves",
    room: "dg06.r10",
    type: "dials",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    ranges: { L: [0, 1], M: [0, 1], R: [0, 1] },
    initial: { L: 0, M: 0, R: 0 },
    goal: { L: 1, M: 0, R: 1 },
    latchFlag: "dg06.valves",
    meaning: "1 is open, 0 is shut. Goal open, shut, open.",
    reset: "Shutting all three is the crank. The south door does not depend on the valves.",
  }),
  expandPuzzle({
    id: "dg06.puz.landing",
    room: "dg06.r15",
    type: "dials",
    major: true,
    solutionDisplayed: true,
    noFreeText: true,
    ranges: { L: [0, 3], M: [0, 3], R: [0, 3] },
    initial: { L: 0, M: 0, R: 0 },
    goal: { L: 2, M: 0, R: 1 },
    latchFlag: "dg06.landing",
    meaning: "Heights match the bronze strip 2, 0, 1.",
    reset: "A frame crank returns every weight to 0.",
  }),
];

function r(partial) {
  return room(partial);
}

dg06.rooms = [
  r({
    id: "dg06.r01",
    name: "Mill Race Door",
    summary:
      "The Weybridge footing. A dry bank enters the race. A side pool of creek water never crosses the walk. Death returns Ellis to this bank, not to a basin.",
    floor: hubGrid(["N", "S"], (g) => {
      g[2][2] = "~";
      g[2][3] = "~";
      g[3][2] = "~";
    }),
    spawn: { x: CX, y: 8 },
    exits: [
      exit({ id: "to-sluice", x: CX, y: 0, to: "dg06.r02", dir: "N" }),
      exit({
        id: "to-town",
        x: CX,
        y: H - 1,
        to: "overworld.weybridge.mill-race",
        dir: "S",
        external: true,
      }),
    ],
    interactions: [
      interact({
        id: "read-epitaph",
        x: 3,
        y: 8,
        verb: "Read the nail plaque",
        note: "Blank until a body ends in the reservoir.",
      }),
    ],
    solutionTrace: ["Step onto the dry bank.", "Go north into the sluice hall."],
  }),
  r({
    id: "dg06.r02",
    name: "Sluice Hall",
    summary:
      "The first long bank. The wall gauge has numbers and no waterline. Doors leave to the dry dock, the gauge house, and, after the ratchet, the loft bridge. None of them sit on deep water.",
    floor: hubGrid(["N", "S", "E", "W"], (g) => {
      g[2][2] = "~";
      g[8][12] = "~";
    }),
    exits: [
      exit({ id: "to-race", x: CX, y: H - 1, to: "dg06.r01", dir: "S" }),
      exit({ id: "to-dock", x: 0, y: CY, to: "dg06.r03", dir: "W" }),
      exit({ id: "to-gauge-house", x: W - 1, y: CY, to: "dg06.r04", dir: "E" }),
      exit({
        id: "bridge-to-loft",
        x: CX,
        y: 0,
        to: "dg06.r08",
        dir: "N",
        requiresFlags: ["dg06.ratchet"],
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "read-plaque",
        x: 3,
        y: 3,
        verb: "Read the gauge that has no waterline",
        givesEvidence: ["dg06.ev.noSurface"],
      }),
    ],
    solutionTrace: [
      "Read the plaque. The walk north is not the way; the gauge house is east.",
      "The dock is west and worth the notebook before the drain.",
    ],
  }),
  r({
    id: "dg06.r03",
    name: "Dry Dock",
    summary:
      "A cradle without a boat. Vesper's field book lies on the dry planks. A permanent spring pool in the corner is optional swimming and is not on the way back.",
    floor: hubGrid(["E"], (g) => {
      g[2][2] = "W";
      g[2][3] = "W";
      g[3][2] = "W";
    }),
    exits: [exit({ id: "back-sluice", x: W - 1, y: CY, to: "dg06.r02", dir: "E" })],
    interactions: [
      interact({
        id: "read-notebook",
        x: 4,
        y: 7,
        verb: "Read the field book",
        givesEvidence: ["dg06.ev.notebook"],
      }),
      interact({
        id: "net-pool",
        x: 3,
        y: 3,
        verb: "Net a sunk bobber",
        requiresTools: ["net", "creekFins"],
        optional: true,
        givesCollectibles: ["dg06.stone.buoy"],
        note: "The bobber is not evidence required later. The bank holds the book.",
      }),
    ],
    solutionTrace: ["Read the book on the dry planks.", "Return east. Do not enter the spring."],
  }),
  r({
    id: "dg06.r04",
    name: "Gauge House",
    summary:
      "Always dry. Three cranks set the race to drained, creek, or flood. The model on the wall shows the grate and the valves. This is the control that cannot flood itself. A second crank in the loft repeats it and is not required.",
    floor: hubGrid(["W", "N"], (g) => {
      g[3][3] = ",";
      g[3][11] = ",";
      g[8][4] = ",";
    }),
    exits: [
      exit({ id: "to-sluice", x: 0, y: CY, to: "dg06.r02", dir: "W" }),
      exit({ id: "to-flume", x: CX, y: 0, to: "dg06.r05", dir: "N" }),
    ],
    interactions: [
      interact({
        id: "set-level-0",
        x: 3,
        y: 3,
        verb: "Set the race to the bottom mark",
        setsLevel: 0,
      }),
      interact({
        id: "set-level-1",
        x: 11,
        y: 3,
        verb: "Set the race to the creek mark",
        setsLevel: 1,
      }),
      interact({
        id: "set-level-2",
        x: 4,
        y: 8,
        verb: "Set the race to the flood mark",
        setsLevel: 2,
      }),
      interact({
        id: "read-model",
        x: 8,
        y: 8,
        verb: "Read the wooden model",
        note: "Grate at the bottom mark. Valves open, shut, open. Both are visible without solving either.",
      }),
    ],
    solutionTrace: [
      "Read the model.",
      "Set the bottom mark.",
      "Go north along the catwalk stair into the flume.",
    ],
  }),
  r({
    id: "dg06.r05",
    name: "Lower Flume",
    summary:
      "A catwalk on the east wall stays dry at every level. The grate on the west opens only when the race is drained. At flood the basin is deep and the catwalk still returns to the gauge house. No water control is in this room.",
    floor: flumeGrid(),
    exits: [
      exit({ id: "to-gauge-house", x: 12, y: 10, to: "dg06.r04", dir: "S" }),
      exit({
        id: "to-ratchet",
        x: 0,
        y: 5,
        to: "dg06.r06",
        dir: "W",
        openAtLevels: [0],
        needFins: false,
      }),
    ],
    interactions: [
      interact({
        id: "read-grate-mark",
        x: 12,
        y: 5,
        verb: "Read the paint above the grate",
        note: "The only gap in the paint is the empty mark. Ellis is standing on the catwalk, not in the basin.",
      }),
    ],
    solutionTrace: [
      "At the bottom mark, cross the dry flume floor to the west grate.",
      "At any other mark, stay on the east catwalk and return south.",
    ],
  }),
  r({
    id: "dg06.r06",
    name: "Ratchet Chamber",
    summary:
      "A dry room above the silt line. The grate behind Ellis only aligns at the bottom mark, and this room cannot change the level. Pulling the ratchet opens a hatch north that stays open at creek and flood. Ellis cannot be closed in.",
    latchFlags: ["dg06.ratchet"],
    floor: hubGrid(["N", "E"]),
    exits: [
      exit({
        id: "to-flume",
        x: W - 1,
        y: CY,
        to: "dg06.r05",
        dir: "E",
        openAtLevels: [0],
      }),
      exit({
        id: "to-penstock",
        x: CX,
        y: 0,
        to: "dg06.r07",
        dir: "N",
        requiresFlags: ["dg06.ratchet"],
      }),
    ],
    interactions: [
      interact({
        id: "pull-ratchet",
        x: 4,
        y: 7,
        verb: "Pull the ratchet",
        setsFlags: ["dg06.ratchet"],
      }),
    ],
    solutionTrace: [
      "Pull the ratchet.",
      "Leave north. The east grate is only for the drained race, and it is still open behind you until you change level from a dry control room.",
    ],
  }),
  r({
    id: "dg06.r07",
    name: "Penstock Walk",
    summary:
      "A dry gallery after the hatch. North is the staff fight. East is the optional loft with the second crank and the bridge back to the sluice.",
    floor: hubGrid(["N", "S", "E"]),
    exits: [
      exit({
        id: "to-ratchet",
        x: CX,
        y: H - 1,
        to: "dg06.r06",
        dir: "S",
        requiresFlags: ["dg06.ratchet"],
      }),
      exit({ id: "to-staff", x: CX, y: 0, to: "dg06.r09", dir: "N" }),
      exit({ id: "to-loft", x: W - 1, y: CY, to: "dg06.r08", dir: "E" }),
    ],
    interactions: [],
    solutionTrace: ["Go north to the staff gallery. The loft is optional and is also the way back if the race is flooded."],
  }),
  r({
    id: "dg06.r08",
    name: "Upper Loft",
    summary:
      "Optional dry loft. The second set of cranks repeats the gauge house. Once the ratchet is pulled, a bridge south meets the sluice hall. Flooding the race from here cannot trap Ellis: the bridge does not care about the level.",
    optional: true,
    floor: hubGrid(["W", "S"], (g) => {
      g[3][4] = ",";
    }),
    exits: [
      exit({ id: "to-penstock", x: 0, y: CY, to: "dg06.r07", dir: "W" }),
      exit({
        id: "bridge-to-sluice",
        x: CX,
        y: H - 1,
        to: "dg06.r02",
        dir: "S",
        requiresFlags: ["dg06.ratchet"],
        shortcut: true,
      }),
    ],
    interactions: [
      interact({ id: "set-level-0", x: 4, y: 3, verb: "Set the race to the bottom mark", setsLevel: 0 }),
      interact({ id: "set-level-1", x: 6, y: 3, verb: "Set the race to the creek mark", setsLevel: 1 }),
      interact({ id: "set-level-2", x: 8, y: 3, verb: "Set the race to the flood mark", setsLevel: 2 }),
      interact({
        id: "read-loft-plate",
        x: 10,
        y: 7,
        verb: "Read the loft plate",
        givesEvidence: [],
        note: "The plate repeats the gauge-house warning and adds: the bridge is tied to the ratchet, not to the water.",
      }),
    ],
    solutionTrace: [
      "Use the cranks or ignore them.",
      "Cross south to the sluice after the ratchet. The boss does not require this room.",
    ],
  }),
  r({
    id: "dg06.r09",
    name: "Staff Gallery",
    summary:
      "Miniboss. The Staff Gauge paces a dry floor. The fight locks a shallow overlay so the global race cannot flood the arena. Three strikes on the dipped joint drop the penstock key. South stays open.",
    latchFlags: ["dg06.gauge"],
    combatLayout: "force-shallow-overlay",
    floor: hubGrid(["N", "S"], (g) => {
      g[3][2] = "~";
      g[3][3] = "~";
    }),
    exits: [
      exit({ id: "to-penstock", x: CX, y: H - 1, to: "dg06.r07", dir: "S" }),
      exit({
        id: "to-valves",
        x: CX,
        y: 0,
        to: "dg06.r10",
        dir: "N",
        requiresFlags: ["dg06.gauge"],
      }),
    ],
    interactions: [
      interact({
        id: "defeat-gauge",
        x: CX,
        y: 6,
        verb: "Strike the staff's joint when it dips",
        setsFlags: ["dg06.gauge"],
        givesKeys: ["dg06.sk.penstock"],
      }),
    ],
    encounters: [{ enemy: "dg06.enemy.siltEel", count: 1, tiles: [[3, 7]] }],
    solutionTrace: [
      "Stay on dry stone. Step off the taut line.",
      "Strike the dipped joint three times.",
      "Take the penstock key north.",
    ],
  }),
  r({
    id: "dg06.r10",
    name: "Valve Choir",
    summary:
      "Three valves, each shut or open. The enamel under the cloth and the model in the gauge house both show open, shut, open. The south door does not use the valves. The east door wants the valves and the penstock key.",
    latchFlags: ["dg06.valves"],
    reset: {
      control: "shut-all",
      tile: [2, 2],
      resets: ["dg06.puz.valves"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: hubGrid(["S", "E"], (g) => {
      g[3][4] = ",";
      g[3][7] = ",";
      g[3][10] = ",";
    }),
    exits: [
      exit({ id: "to-staff", x: CX, y: H - 1, to: "dg06.r09", dir: "S" }),
      exit({
        id: "to-sounding",
        x: W - 1,
        y: CY,
        to: "dg06.r11",
        dir: "E",
        requiresFlags: ["dg06.valves"],
        requiresKeys: ["dg06.sk.penstock"],
        setsFlags: ["dg06.lock.sounding.open"],
      }),
    ],
    interactions: [
      interact({
        id: "solve-valves",
        x: 4,
        y: 3,
        verb: "Set the valves open, shut, open",
        puzzle: "dg06.puz.valves",
        setsFlags: ["dg06.valves"],
      }),
    ],
    solutionTrace: [
      "Pull the cloth. Read open, shut, open.",
      "Set the three valves. The crank shuts them if needed.",
      "Open the east door with the penstock key.",
    ],
  }),
  r({
    id: "dg06.r11",
    name: "Sounding Lock",
    summary:
      "A dry lock between valves and the basin. The southeast corner is a permanent spring mouth. Fins swim that mouth into the unsounded cistern. The east door to the basin does not.",
    floor: lockGrid(),
    exits: [
      exit({ id: "to-valves", x: 0, y: CY, to: "dg06.r10", dir: "W" }),
      exit({ id: "to-surface", x: W - 1, y: CY, to: "dg06.r12", dir: "E" }),
      exit({
        id: "to-cistern",
        x: 14,
        y: 9,
        to: "dg06.r17",
        dir: "S",
        needFins: true,
        optional: true,
        requiresTools: ["creekFins"],
      }),
    ],
    interactions: [],
    solutionTrace: ["Walk east on dry stone.", "Ignore the spring unless fins are in the pack."],
  }),
  r({
    id: "dg06.r12",
    name: "The Surface That Isn't",
    summary:
      "A basin with no stain at a waterline. The walk is a plus of catwalks. The middle stays deep at every level. A card drifts to a dry notch, so the reading does not need fins or a net.",
    floor: surfaceGrid(),
    exits: [
      exit({ id: "to-sounding", x: 0, y: CY, to: "dg06.r11", dir: "W" }),
      exit({ id: "to-chapel", x: CX, y: 0, to: "dg06.r13", dir: "N" }),
    ],
    interactions: [
      interact({
        id: "take-buoy-card",
        x: 2,
        y: 2,
        verb: "Take the card from the dry notch",
        givesEvidence: ["dg06.ev.buoy"],
      }),
      interact({
        id: "dive-buoy",
        x: 4,
        y: 4,
        verb: "Dive the center with fins",
        requiresTools: ["creekFins"],
        optional: true,
        givesCollectibles: ["dg06.stone.buoy"],
      }),
    ],
    solutionTrace: ["Stay on the catwalk.", "Take the card at the notch if wanted.", "Go north."],
  }),
  r({
    id: "dg06.r13",
    name: "Creekfin Chapel",
    summary:
      "A chapel that blesses fins and then tells the office to walk. East stairs lead to the long bank. North is a current that only a swimmer can take, and only when the race is at creek or flood. Both arrive at the landing.",
    floor: chapelGrid(),
    exits: [
      exit({ id: "to-surface", x: CX, y: H - 1, to: "dg06.r12", dir: "S" }),
      exit({ id: "to-bank", x: W - 1, y: CY, to: "dg06.r14", dir: "E" }),
      exit({
        id: "current-to-landing",
        x: CX,
        y: 0,
        to: "dg06.r15",
        dir: "N",
        needFins: true,
        requiresTools: ["creekFins"],
        openAtLevels: [1, 2],
        optional: true,
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "read-sermon",
        x: 3,
        y: 7,
        verb: "Read the chapel card",
        givesEvidence: ["dg06.ev.sermon"],
      }),
    ],
    solutionTrace: [
      "Read the card.",
      "Go east along the stairs. Do not take the north current unless fins are carried.",
    ],
  }),
  r({
    id: "dg06.r14",
    name: "Long Bank",
    summary:
      "The no-fins road to the landing. Silt eels lunge on the stone and stop at the stone. Vesper's name is cut into the coping.",
    floor: hubGrid(["W", "E"], (g) => {
      g[2][3] = "~";
      g[8][3] = "~";
    }),
    exits: [
      exit({ id: "to-chapel", x: 0, y: CY, to: "dg06.r13", dir: "W" }),
      exit({ id: "to-landing", x: W - 1, y: CY, to: "dg06.r15", dir: "E" }),
    ],
    interactions: [
      interact({
        id: "read-vesper",
        x: 4,
        y: 8,
        verb: "Read the coping",
        givesEvidence: ["dg06.ev.vesper"],
      }),
    ],
    encounters: [
      { enemy: "dg06.enemy.siltEel", count: 2, tiles: [[4, 3], [10, 7]] },
    ],
    solutionTrace: ["Walk the dry center.", "Read Vesper's name.", "Go east."],
  }),
  r({
    id: "dg06.r15",
    name: "Surveyor's Landing",
    summary:
      "Dry frame, three weights, bronze strip stamped 2, 0, 1. Deeper notches repeat it on the weights. The sounding key drops when the weights match. North is the boss door. South is the fins current, usable only with fins at creek or flood. West is the bank.",
    latchFlags: ["dg06.landing"],
    reset: {
      control: "frame-crank",
      tile: [2, 2],
      resets: ["dg06.puz.landing"],
      preserves: ["keys", "evidence", "latchedFlags"],
    },
    floor: grid({
      doors: [
        { x: 0, y: CY, ch: "." },
        { x: CX, y: 0, ch: "." },
        { x: CX, y: H - 1, ch: "W" },
      ],
      paint(g) {
        g[3][4] = ",";
        g[3][7] = ",";
        g[3][10] = ",";
        g[8][CX] = ".";
        keepHub(g);
      },
    }),
    exits: [
      exit({ id: "to-bank", x: 0, y: CY, to: "dg06.r14", dir: "W" }),
      exit({
        id: "to-boss",
        x: CX,
        y: 0,
        to: "dg06.r16",
        dir: "N",
        requiresKeys: ["dg06.bk.surveyor"],
        setsFlags: ["dg06.lock.boss.open"],
      }),
      exit({
        id: "current-to-chapel",
        x: CX,
        y: H - 1,
        to: "dg06.r13",
        dir: "S",
        needFins: true,
        requiresTools: ["creekFins"],
        openAtLevels: [1, 2],
        optional: true,
        shortcut: true,
      }),
    ],
    interactions: [
      interact({
        id: "solve-landing",
        x: 4,
        y: 3,
        verb: "Set the weights to 2, 0, 1",
        puzzle: "dg06.puz.landing",
        setsFlags: ["dg06.landing"],
      }),
      interact({
        id: "take-big-key",
        x: 10,
        y: 3,
        verb: "Take the sounding key",
        requiresFlags: ["dg06.landing"],
        givesKeys: ["dg06.bk.surveyor"],
      }),
    ],
    solutionTrace: [
      "Match the weights to the strip: left 2, mid 0, right 1.",
      "Take the sounding key.",
      "Open the north door. The basin is the boss's, not the walk.",
    ],
  }),
  r({
    id: "dg06.r16",
    name: "The Drowned Surveyor",
    summary:
      "Boss. A dry ring around a deep basin. Vesper lashes a line, tries to sink two ring stones into shallows, then surfaces at a numbered dock. The crank on the ring is always on dry stone. Fins can cross the basin and are not the fight.",
    latchFlags: ["dg06.boss"],
    floor: grid({
      doors: [{ x: CX, y: H - 1, ch: "." }],
      paint(g) {
        for (let y = 3; y <= 7; y++) {
          for (let x = 4; x <= 10; x++) g[y][x] = "W";
        }
        for (let y = 1; y <= 9; y++) {
          g[y][2] = "+";
          g[y][12] = "+";
        }
        for (let x = 2; x <= 12; x++) {
          g[2][x] = "+";
          g[8][x] = "+";
        }
        g[9][CX] = "+";
      },
    }),
    exits: [exit({ id: "to-landing", x: CX, y: H - 1, to: "dg06.r15", dir: "S" })],
    interactions: [
      interact({
        id: "defeat-surveyor",
        x: 2,
        y: 5,
        verb: "Release Vesper from the measurement",
        setsFlags: ["dg06.boss"],
        givesEvidence: ["dg06.ev.officeNail"],
      }),
      interact({
        id: "arena-crank",
        x: 12,
        y: 5,
        verb: "Crank the arena sluice during the sink",
        note: "Used inside the fight. It does not change the dungeon's race level.",
      }),
    ],
    solutionTrace: [
      "Stand on the ring. After each lash recovers, strike three times.",
      "When two stones darken, crank the sluice on the ring, then strike three times.",
      "Stand on the dock whose number matches the staff. Strike four times as Vesper surfaces.",
    ],
  }),
  r({
    id: "dg06.r17",
    name: "Unsounded Cistern",
    summary:
      "A spring the model left out. The mouth in the sounding lock is permanent deep water, so a body without fins never arrives. Arrival puts Ellis on the ladder, which is dry. The dive below the ladder is optional even then. The ladder is the only leave, and it does not need a second swim.",
    optional: true,
    requiresOptionalTool: "creekFins",
    floor: cisternGrid(),
    exits: [
      exit({
        id: "back-sounding",
        x: CX,
        y: 0,
        to: "dg06.r11",
        dir: "N",
        needFins: false,
      }),
    ],
    interactions: [
      interact({
        id: "read-unsounded",
        x: CX,
        y: 2,
        verb: "Read the zinc tag on the ladder",
        givesEvidence: ["dg06.ev.unsounded"],
      }),
      interact({
        id: "dive-cistern",
        x: 4,
        y: 6,
        verb: "Dive under the ladder",
        requiresTools: ["creekFins"],
        optional: true,
        givesCollectibles: ["dg06.stone.cistern"],
      }),
    ],
    solutionTrace: [
      "Surface on the ladder.",
      "Read the tag.",
      "Climb north. Do not look for a second exit.",
    ],
  }),
];

dg06.miniboss = {
  id: "dg06.miniboss.staffGauge",
  name: "The Staff Gauge",
  room: "dg06.r09",
  distinctFromBoss: true,
  finsRequired: false,
  fsm: {
    initial: "pace",
    terminal: "defeated",
    resetFromAny: true,
    states: gaugeStates,
    edges: gaugeEdges,
    solution: ["wait-out-the-lash", "step-off-the-line", "strike", "strike", "strike"],
  },
};

dg06.boss = {
  id: "dg06.boss.drownedSurveyor",
  name: "The Drowned Surveyor",
  room: "dg06.r16",
  finsRequired: false,
  arenaLeavesExits: true,
  dryPathPersists: true,
  minDryRingTiles: 6,
  fsm: {
    initial: "surface_denied",
    terminal: "released",
    resetFromAny: true,
    states: drownedStates,
    edges: drownedEdges,
    solution: [
      "approach",
      "lash-recovers",
      "strike",
      "strike",
      "strike",
      "crank-arena-sluice",
      "strike",
      "strike",
      "strike",
      "stand-on-marked-dock",
      "strike",
      "strike",
      "strike",
      "strike",
    ],
  },
};
