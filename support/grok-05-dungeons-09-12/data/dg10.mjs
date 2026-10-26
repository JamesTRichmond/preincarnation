import { chamber, stamp, objects, link, flagInteract } from "./lib.mjs";
import { applyWalls } from "./ruins.mjs";

const mv = (x, y) => ({ op: "move", to: [x, y] });
const ix = (id) => ({ op: "interact", id });
const ex = (id) => ({ op: "use-exit", id });
const ticks = (n) => Array.from({ length: n }, () => ({ op: "tick-transition" }));
const tools = ["shovel", "sugar-line", "boots", "fins", "lamp", "hammer", "net", "homestead-glass", "cape", "block-rod", "bow", "powder"];

function book(rows) {
  const out = {};
  for (const [id, hint, fullRule] of rows) {
    out[id] = { persistent: true, hint, doneText: `Already true: ${hint}.`, fullRule };
  }
  return out;
}

const flagBook = book([
  ["dg10.ledger-read", "read the four lines on the landing board", "The landing board names four objects and four hooks. Reading it changes nothing but your certainty."],
  ["dg10.D1", "hang the marble ticket on the first hook", "The first line clears only when the marble ticket hangs on the first hook."],
  ["dg10.D2", "hang the ferry bell on the second hook", "The second line clears only when the ferry bell hangs on the second hook."],
  ["dg10.D3", "hang the red lantern on the third hook", "The third line clears only when the red lantern hangs on the third hook."],
  ["dg10.D4", "hang the oarlock on the fourth hook", "The fourth line clears only when the oarlock hangs on the fourth hook."],
  ["dg10.chain", "pull the west sluice chain with the sugar-line", "The cabin past the west sluice opens after the chain is pulled."],
  ["dg10.warden", "pin the chain warden in painted order then hammer the lock", "The oarlock can be lifted only after the Chain Warden is down."],
  ["dg10.crane", "hammer the high crane pin", "The crane rope returns to Ledger Landing. It does not clear a line."],
  ["dg10.cleared", "strike the Collector's book", "The shore road opens after the Collector's book is shut. The struck ledger is given once."],
  ["dg10.keel", "the keel scratch is not a fifth debt", "Under the landing, a scratched line names Ellis. It has no hook."],
  ["dg10.passengers", "homestead glass shows unlived passengers", "The night crib shows passengers who never boarded. Optional."],
  ["dg10.shell", "a blue shell sits in the east pool", "The east pool's shell is not a debt and will not hang on a hook."],
]);

const debts = [
  { id: "D1", flag: "dg10.D1", object: "marble-ticket", hook: "H1", label: "Hang the marble ticket on the first hook." },
  { id: "D2", flag: "dg10.D2", object: "ferry-bell", hook: "H2", label: "Hang the ferry bell on the second hook." },
  { id: "D3", flag: "dg10.D3", object: "red-lantern", hook: "H3", label: "Hang the red lantern on the third hook." },
  { id: "D4", flag: "dg10.D4", object: "oarlock", hook: "H4", label: "Hang the oarlock on the fourth hook." },
];

const LEDGER = debts.map((d) => d.label).join(" ") + " Four lines. No balance. A scratched fifth line under the keel is not a debt.";

function mile(id, tile, revealsFlags, alwaysText = "") {
  return { id, kind: "milepost", tile, glyph: "*", revealsFlags, codexAware: false, alwaysText, persistent: true };
}
function room(spec) {
  return {
    id: spec.id,
    name: spec.name,
    summary: spec.summary,
    classification: spec.classification,
    onMainRoute: spec.classification === "main",
    width: 18,
    height: 12,
    map: spec.map,
    setsLantern: !!spec.setsLantern,
    lanternTile: spec.lanternTile || null,
    layers: { terrain: applyWalls(spec.id, spec.terrain), objects: objects(spec.paints, spec.id) },
    conditionalTerrain: spec.conditionalTerrain || [],
    stepFlags: [],
    connections: spec.connections,
    actors: spec.actors || [],
    interactions: spec.interactions,
    puzzles: spec.puzzles || [],
    persistentState: spec.persistentState || ["flags", "hooked-debts", "collected-rewards"],
    resetState: spec.resetState || ["enemy-positions", "ferry-position-on-transition-death", "carried-object-on-transition-death"],
    localProof: spec.localProof,
    failureAndRecovery: spec.failureAndRecovery,
  };
}
const terrain = (edits, id) => stamp(chamber(), edits, id);

const R01 = room({
  id: "DG10-R01",
  name: "Landing Stair",
  summary: "Ledger Landing. The board shows four object-hooks and nothing that can be spent.",
  classification: "main",
  map: { c: 0, r: 2 },
  setsLantern: true,
  lanternTile: [3, 6],
  terrain: terrain([[4, 6, ","], [5, 6, ","], [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R01"),
  paints: [[6, 3, "*"], [6, 4, "L"], [4, 6, "F"], [16, 6, "E"], [9, 1, "N"], [9, 10, "D"], [2, 2, "V"], [3, 6, "@"]],
  connections: [
    link("east", [16, 6], "DG10-R02", [2, 6]),
    link("north", [9, 1], "DG10-R08", [9, 10]),
    link("down", [9, 10], "DG10-R12", [9, 2]),
    link("board", [4, 6], "DG10-R04", [9, 6], { kind: "board" }),
    link("god-fly-lake", [2, 2], "DG10-R05", [4, 6], {
      when: { never: true },
      godTemptation: true,
      closedText: "The lake does not accept a god that skipped the boat.",
    }),
  ],
  actors: [{ id: "landing-memory", name: "Unboarded Passenger", tile: [12, 4], kind: "memory", resets: "never" }],
  interactions: [
    mile("mile-r01", [6, 3], ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"], LEDGER),
    flagInteract({ id: "read-ledger", tile: [6, 4], glyph: "L", sets: ["dg10.ledger-read"], successText: LEDGER }),
  ],
  localProof: {
    place: { room: "DG10-R01", tile: [3, 6] },
    steps: [mv(6, 3), ix("mile-r01"), mv(6, 4), ix("read-ledger"), mv(16, 6), ex("east")],
    expect: { flags: ["dg10.ledger-read"], room: "DG10-R02", textIncludes: "Hang the marble ticket on the first hook." },
  },
  failureAndRecovery: [{
    name: "god-does-not-skip-the-lake",
    place: { room: "DG10-R01", tile: [2, 2], form: "god" },
    steps: [ex("god-fly-lake")],
    expectError: "GOD_SEALED",
    recovery: [{ op: "set-form", form: "mortal" }, mv(6, 4), ix("read-ledger")],
    expect: { flags: ["dg10.ledger-read"], notFlags: ["dg10.D1"] },
  }],
});

const R02 = room({
  id: "DG10-R02",
  name: "Ticket Cradle",
  summary: "The marble ticket waits on its cradle. It is the first line's object, not a fare.",
  classification: "main",
  map: { c: 1, r: 2 },
  terrain: terrain([[8, 5, ","]], "R02"),
  paints: [[8, 5, "t"], [1, 6, "W"], [4, 3, "*"]],
  connections: [link("west", [1, 6], "DG10-R01", [15, 6])],
  interactions: [
    mile("mile-r02", [4, 3], ["dg10.D1"], "Carry the ticket to the first hook. Losing it on the water puts it back on this cradle."),
    flagInteract({ id: "pick-ticket", kind: "pickup", object: "marble-ticket", tile: [8, 5], glyph: "t", once: false, successText: "The marble ticket is in hand." }),
  ],
  localProof: {
    place: { room: "DG10-R02", tile: [2, 6] },
    steps: [mv(8, 5), ix("pick-ticket")],
    expect: { room: "DG10-R02" },
  },
  failureAndRecovery: [{
    name: "god-cannot-take-the-ticket",
    place: { room: "DG10-R02", tile: [8, 5], form: "god" },
    steps: [ix("pick-ticket")],
    expectError: "FORM_REQUIRED",
    recovery: [{ op: "set-form", form: "mortal" }, ix("pick-ticket")],
    expect: { room: "DG10-R02" },
  }],
});

const R03 = room({
  id: "DG10-R03",
  name: "West Sluice",
  summary: "Ferry dock for the west channel. A chain, not a payment, opens the cabin.",
  classification: "main",
  map: { c: 0, r: 1 },
  terrain: terrain([[8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R03"),
  paints: [[4, 3, "*"], [8, 6, "H"], [4, 6, "F"], [16, 6, "E"]],
  connections: [
    link("board", [4, 6], "DG10-R04", [9, 6], { kind: "board" }),
    link("east", [16, 6], "DG10-R09", [2, 6], { when: { all: ["dg10.chain"] }, closedText: "The sluice chain is still taut." }),
  ],
  interactions: [
    mile("mile-r03", [4, 3], ["dg10.chain"]),
    flagInteract({ id: "pull-chain", tile: [8, 6], glyph: "H", requiresTools: ["sugar-line"], sets: ["dg10.chain"], successText: "The chain gives. The cabin door opens.", failText: { tool: "The chain wants the sugar-line." } }),
  ],
  localProof: {
    place: { room: "DG10-R03", tile: [4, 6] },
    steps: [mv(8, 6), ix("pull-chain"), mv(16, 6), ex("east")],
    expect: { flags: ["dg10.chain"], room: "DG10-R09" },
  },
  failureAndRecovery: [{
    name: "chain-without-sugar-line",
    place: { room: "DG10-R03", tile: [8, 6], tools: tools.filter((t) => t !== "sugar-line") },
    steps: [ix("pull-chain")],
    expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "sugar-line" }, ix("pull-chain")],
    expect: { flags: ["dg10.chain"] },
  }],
});

const R04 = room({
  id: "DG10-R04",
  name: "Ferry Deck",
  summary: "The deck is the only crossing. Home plank returns to the landing. Channel plank obeys one lever.",
  classification: "main",
  map: { c: 2, r: 2 },
  terrain: terrain([[2, 6, ","], [3, 6, ","], [4, 6, ","], [5, 6, ","], [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R04"),
  paints: [[9, 4, "*"], [2, 6, "H"], [15, 6, "C"], [9, 6, "F"]],
  connections: [
    link("launch-home", [2, 6], "DG10-R01", [4, 6], { kind: "ferry-launch", which: "home" }),
    link("launch-channel", [15, 6], "DG10-R05", [4, 6], { kind: "ferry-launch", which: "channel" }),
    link("graph-home", [9, 9], "DG10-R01", [4, 6], { kind: "graph" }),
    link("graph-default", [9, 9], "DG10-R05", [4, 6], { kind: "graph" }),
    link("graph-w", [9, 9], "DG10-R03", [4, 6], { kind: "graph" }),
    link("graph-e", [9, 9], "DG10-R06", [4, 6], { kind: "graph" }),
    link("graph-s", [9, 9], "DG10-R11", [4, 6], { kind: "graph" }),
  ],
  interactions: [mile("mile-r04", [9, 4], [], "One channel. The ledger hates a tangle. Home is always Ledger Landing. Death on the water returns carried debts to their cradles.")],
  resetState: ["ferry-position-on-transition-death", "carried-object-on-transition-death", "hazards"],
  localProof: {
    place: { room: "DG10-R04", tile: [9, 6], ferryFrom: "DG10-R01" },
    steps: [mv(9, 4), ix("mile-r04"), mv(15, 6), ex("launch-channel"), ...ticks(4)],
    expect: { room: "DG10-R05" },
  },
  failureAndRecovery: [{
    name: "two-levers-tangle",
    place: { room: "DG10-R04", tile: [15, 6], ferryFrom: "DG10-R05", levers: { W: true, E: true, S: false } },
    steps: [ex("launch-channel")],
    expectError: "TANGLE",
    recovery: [
      mv(2, 6), ex("launch-home"), ...ticks(4),
      mv(9, 1), ex("north"),
      mv(4, 5), ix("lever-W"),
      mv(8, 5), ix("lever-E"),
      mv(9, 10), ex("south"),
      mv(4, 6), ex("board"),
      mv(15, 6), ex("launch-channel"),
      ...ticks(4),
    ],
    expect: { room: "DG10-R05" },
  }],
});

const R05 = room({
  id: "DG10-R05",
  name: "Hook Hall",
  summary: "Four hooks. Each accepts one object. The north door reads the four lines.",
  classification: "main",
  map: { c: 3, r: 2 },
  terrain: terrain([[6, 4, ","], [8, 4, ","], [10, 4, ","], [12, 4, ","]], "R05"),
  paints: [[4, 8, "*"], [6, 4, "k"], [8, 4, "k"], [10, 4, "k"], [12, 4, "k"], [4, 6, "F"], [9, 1, "N"]],
  connections: [
    link("board", [4, 6], "DG10-R04", [9, 6], { kind: "board" }),
    link("north", [9, 1], "DG10-R13", [9, 10], {
      when: { all: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"] },
      closedText: "A line is still open. The board names the object.",
    }),
  ],
  interactions: [
    mile("mile-r05", [4, 8], ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"], LEDGER),
    flagInteract({ id: "H1", kind: "hook", object: "marble-ticket", tile: [6, 4], glyph: "k", sets: ["dg10.D1"], once: false, successText: "The marble ticket hangs. The first line is struck." }),
    flagInteract({ id: "H2", kind: "hook", object: "ferry-bell", tile: [8, 4], glyph: "k", sets: ["dg10.D2"], once: false, successText: "The ferry bell hangs. The second line is struck." }),
    flagInteract({ id: "H3", kind: "hook", object: "red-lantern", tile: [10, 4], glyph: "k", sets: ["dg10.D3"], once: false, successText: "The red lantern hangs. The third line is struck." }),
    flagInteract({ id: "H4", kind: "hook", object: "oarlock", tile: [12, 4], glyph: "k", sets: ["dg10.D4"], once: false, successText: "The oarlock hangs. The fourth line is struck." }),
  ],
  puzzles: [{ id: "four-hooks", kind: "hooks", steps: ["H1", "H2", "H3", "H4"], sets: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"], persistent: true }],
  localProof: {
    place: { room: "DG10-R05", tile: [6, 5], carrying: { id: "marble-ticket", kind: "object" } },
    steps: [ix("H1")],
    expect: { flags: ["dg10.D1"] },
  },
  failureAndRecovery: [{
    name: "wrong-hook-does-not-spend-the-ticket",
    place: { room: "DG10-R05", tile: [8, 5], carrying: { id: "marble-ticket", kind: "object" } },
    steps: [ix("H2")],
    expectError: "WRONG_OBJECT",
    recovery: [mv(6, 5), ix("H1")],
    expect: { flags: ["dg10.D1"], notFlags: ["dg10.D2"] },
  }],
});

const R06 = room({
  id: "DG10-R06",
  name: "East Channel",
  summary: "East dock. A side pool holds a shell that the ledger will not accept.",
  classification: "main",
  map: { c: 4, r: 1 },
  terrain: terrain([[8, 2, "~"], [9, 2, "~"], [8, 3, "~"]]),
  paints: [[4, 8, "*"], [8, 2, "s"], [4, 6, "F"], [16, 6, "E"]],
  connections: [
    link("board", [4, 6], "DG10-R04", [9, 6], { kind: "board" }),
    link("east", [16, 6], "DG10-R07", [2, 6]),
  ],
  interactions: [
    mile("mile-r06", [4, 8], ["dg10.shell"], "The shell is not a fifth line. God-form cannot swim it."),
    flagInteract({ id: "take-shell", tile: [8, 2], glyph: "s", requiresTools: ["fins"], sets: ["dg10.shell"], grantItem: "blue-shell", successText: "A blue shell. The hooks will not take it." }),
  ],
  localProof: {
    place: { room: "DG10-R06", tile: [4, 6] },
    steps: [mv(16, 6), ex("east")],
    expect: { room: "DG10-R07" },
  },
  failureAndRecovery: [{
    name: "god-cannot-swim-the-pool",
    place: { room: "DG10-R06", tile: [8, 4], form: "god" },
    steps: [mv(8, 2)],
    expectError: "NO_PATH",
    recovery: [{ op: "set-form", form: "mortal" }, mv(8, 2), ix("take-shell")],
    expect: { items: { "blue-shell": 1 }, notFlags: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"] },
  }],
});

const R07 = room({
  id: "DG10-R07",
  name: "Bell Tower",
  summary: "The ferry bell's cradle. Above it, the night crib is optional.",
  classification: "main",
  map: { c: 5, r: 1 },
  terrain: terrain([[8, 5, ","]], "R07"),
  paints: [[8, 5, "b"], [4, 3, "*"], [1, 6, "W"], [9, 1, "U"]],
  connections: [
    link("west", [1, 6], "DG10-R06", [15, 6]),
    link("up", [9, 1], "DG10-R16", [9, 10]),
  ],
  interactions: [
    mile("mile-r07", [4, 3], ["dg10.D2"]),
    flagInteract({ id: "pick-bell", kind: "pickup", object: "ferry-bell", tile: [8, 5], glyph: "b", once: false, successText: "The ferry bell is in hand." }),
  ],
  localProof: {
    place: { room: "DG10-R07", tile: [2, 6] },
    steps: [mv(8, 5), ix("pick-bell")],
    expect: { room: "DG10-R07" },
  },
  failureAndRecovery: [{
    name: "leave-the-tower-from-the-wrong-tile",
    place: { room: "DG10-R07", tile: [8, 5] },
    steps: [ex("up")],
    expectError: "NOT_ON_EXIT",
    recovery: [mv(9, 1), ex("up")],
    expect: { room: "DG10-R16" },
  }],
});

const R08 = room({
  id: "DG10-R08",
  name: "Machinery Loft",
  summary: "Three levers, one channel. The wall diagram is the whole machine.",
  classification: "main",
  map: { c: 0, r: 0 },
  terrain: terrain([[4, 5, ","], [8, 5, ","], [12, 5, ","]], "R08"),
  paints: [[4, 2, "*"], [4, 5, "W"], [8, 5, "E"], [12, 5, "S"], [9, 10, "s"]],
  connections: [link("south", [9, 10], "DG10-R01", [9, 2])],
  interactions: [
    mile("mile-r08", [4, 2], [], "W draws the west sluice. E draws the east channel. S draws the south run. Empty draws Hook Hall. Two levers refuse to move the deck."),
    flagInteract({ id: "lever-W", kind: "lever", lever: "W", tile: [4, 5], glyph: "W", once: false, successText: "West." }),
    flagInteract({ id: "lever-E", kind: "lever", lever: "E", tile: [8, 5], glyph: "E", once: false, successText: "East." }),
    flagInteract({ id: "lever-S", kind: "lever", lever: "S", tile: [12, 5], glyph: "S", once: false, successText: "South." }),
  ],
  puzzles: [{ id: "channels", kind: "exclusive-levers", steps: ["W", "E", "S"], persistent: true }],
  persistentState: ["channel-levers", "flags"],
  localProof: {
    place: { room: "DG10-R08", tile: [9, 10] },
    steps: [mv(8, 5), ix("lever-E"), { op: "assert", code: "lever", id: "E", value: true }, mv(8, 5), ix("lever-E"), { op: "assert", code: "lever", id: "E", value: false }],
    expect: { room: "DG10-R08" },
  },
  failureAndRecovery: [{
    name: "loft-wall",
    place: { room: "DG10-R08", tile: [9, 10] },
    steps: [mv(0, 5)],
    expectError: "NO_PATH",
    recovery: [mv(4, 5), ix("lever-W"), mv(4, 5), ix("lever-W")],
    expect: { room: "DG10-R08" },
  }],
});

const R09 = room({
  id: "DG10-R09",
  name: "Red Lantern Cabin",
  summary: "Cradle of the red lantern, the third line's object.",
  classification: "main",
  map: { c: 1, r: 1 },
  terrain: terrain([[8, 5, ","]], "R09"),
  paints: [[8, 5, "L"], [1, 6, "W"], [4, 3, "*"]],
  connections: [link("west", [1, 6], "DG10-R03", [15, 6])],
  interactions: [
    mile("mile-r09", [4, 3], ["dg10.D3"]),
    flagInteract({ id: "pick-lantern", kind: "pickup", object: "red-lantern", tile: [8, 5], glyph: "L", once: false, successText: "The red lantern is in hand. It is not the lamp tool." }),
  ],
  localProof: {
    place: { room: "DG10-R09", tile: [2, 6] },
    steps: [mv(8, 5), ix("pick-lantern")],
    expect: { room: "DG10-R09" },
  },
  failureAndRecovery: [{
    name: "god-cannot-lift-the-lantern",
    place: { room: "DG10-R09", tile: [8, 5], form: "god" },
    steps: [ix("pick-lantern")],
    expectError: "FORM_REQUIRED",
    recovery: [{ op: "set-form", form: "mortal" }, ix("pick-lantern")],
    expect: { room: "DG10-R09" },
  }],
});

const R10 = room({
  id: "DG10-R10",
  name: "Oarlock Vault",
  summary: "The Chain Warden guards the oarlock. Stand at the painted chest: pins 1-2-3, then the hammer. A miss resets and spends nothing.",
  classification: "main",
  map: { c: 3, r: 3 },
  terrain: terrain([[8, 6, ","]], "R10"),
  paints: [[4, 2, "*"], [8, 8, "o"], [1, 6, "W"]],
  connections: [link("west", [1, 6], "DG10-R11", [15, 6])],
  actors: [{ id: "warden", name: "The Chain Warden", tile: [9, 5], kind: "miniboss", resets: "on-death-if-not-defeated" }],
  interactions: [
    mile("mile-r10", [4, 2], ["dg10.warden"], "Painted order is 1 then 2 then 3. A wrong pin resets the count and consumes nothing."),
    flagInteract({ id: "pick-oarlock", kind: "pickup", object: "oarlock", tile: [8, 8], glyph: "o", requiresFlags: ["dg10.warden"], once: false, successText: "The oarlock is free.", failText: { flags: "The warden still has the oarlock." } }),
  ],
  persistentState: ["miniboss-defeat", "hooked-debts", "flags"],
  resetState: ["boss-phase-if-not-defeated", "enemy-positions"],
  localProof: {
    place: { room: "DG10-R10", tile: [2, 6] },
    steps: [
      mv(9, 6),
      { op: "miniboss", action: "begin" },
      { op: "miniboss", action: "pin", n: 1, tool: "bow" },
      { op: "miniboss", action: "pin", n: 2, tool: "bow" },
      { op: "miniboss", action: "pin", n: 3, tool: "bow" },
      { op: "miniboss", action: "strike", tool: "hammer" },
      mv(8, 8), ix("pick-oarlock"),
    ],
    expect: { flags: ["dg10.warden"] },
  },
  failureAndRecovery: [{
    name: "pins-out-of-order-reset",
    place: { room: "DG10-R10", tile: [8, 6] },
    steps: [{ op: "miniboss", action: "begin" }, { op: "miniboss", action: "pin", n: 2, tool: "bow" }],
    expectError: "WRONG_ORDER",
    recovery: [
      { op: "miniboss", action: "pin", n: 1, tool: "bow" },
      { op: "miniboss", action: "pin", n: 2, tool: "bow" },
      { op: "miniboss", action: "pin", n: 3, tool: "bow" },
      { op: "miniboss", action: "strike", tool: "hammer" },
    ],
    expect: { flags: ["dg10.warden"] },
  }],
});

const R11 = room({
  id: "DG10-R11",
  name: "South Run",
  summary: "South dock. East is the vault. North is the crane.",
  classification: "main",
  map: { c: 3, r: 4 },
  terrain: terrain([[8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R11"),
  paints: [[4, 3, "*"], [4, 6, "F"], [16, 6, "E"], [9, 1, "N"]],
  connections: [
    link("board", [4, 6], "DG10-R04", [9, 6], { kind: "board" }),
    link("east", [16, 6], "DG10-R10", [2, 6]),
    link("north", [9, 1], "DG10-R15", [9, 10]),
  ],
  interactions: [mile("mile-r11", [4, 3], ["dg10.crane"], "The crane is a return rope, not a skipped line.")],
  localProof: {
    place: { room: "DG10-R11", tile: [4, 6] },
    steps: [mv(16, 6), ex("east")],
    expect: { room: "DG10-R10" },
  },
  failureAndRecovery: [{
    name: "south-run-wall",
    place: { room: "DG10-R11", tile: [4, 6] },
    steps: [mv(0, 6)],
    expectError: "NO_PATH",
    recovery: [mv(9, 1), ex("north")],
    expect: { room: "DG10-R15" },
  }],
});

const R12 = room({
  id: "DG10-R12",
  name: "Keel Walk",
  summary: "Under the landing. A scratched line with Ellis's name and no hook.",
  classification: "optional",
  map: { c: 0, r: 3 },
  terrain: terrain([[8, 6, ","]], "R12"),
  paints: [[4, 3, "*"], [8, 6, "D"], [9, 1, "U"]],
  connections: [link("up", [9, 1], "DG10-R01", [9, 9])],
  interactions: [
    mile("mile-r12", [4, 3], ["dg10.keel"], "The scratched line names Ellis. It is not a hook and not a debt."),
    flagInteract({ id: "read-keel", tile: [8, 6], glyph: "D", requiresTools: ["sugar-line"], sets: ["dg10.keel"], grantItem: "scratched-line", successText: "The scratched line names Ellis. It is not a hook and not a debt." }),
  ],
  localProof: {
    place: { room: "DG10-R12", tile: [9, 2] },
    steps: [mv(8, 6), ix("read-keel")],
    expect: { flags: ["dg10.keel"], items: { "scratched-line": 1 }, textIncludes: "not a debt" },
  },
  failureAndRecovery: [{
    name: "keel-jammed",
    place: { room: "DG10-R12", tile: [8, 6], tools: tools.filter((t) => t !== "sugar-line") },
    steps: [ix("read-keel")],
    expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "sugar-line" }, ix("read-keel")],
    expect: { items: { "scratched-line": 1 } },
  }],
});

const R13 = room({
  id: "DG10-R13",
  name: "Antechamber",
  summary: "The four struck lines are copied on the door. The Collector is east.",
  classification: "main",
  map: { c: 4, r: 2 },
  setsLantern: true,
  lanternTile: [9, 3],
  terrain: terrain([[8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R13"),
  paints: [[4, 5, "*"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG10-R05", [9, 2]),
    link("east", [16, 6], "DG10-R14", [2, 6], {
      when: { all: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"] },
      closedText: "The door repeats the open line.",
    }),
  ],
  interactions: [mile("mile-r13", [4, 5], ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"], LEDGER)],
  localProof: {
    place: { room: "DG10-R13", tile: [9, 10], flags: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"] },
    steps: [mv(16, 6), ex("east")],
    expect: { room: "DG10-R14" },
  },
  failureAndRecovery: [{
    name: "collector-door-with-a-line-open",
    place: { room: "DG10-R13", tile: [16, 6], flags: ["dg10.D1", "dg10.D2", "dg10.D3"] },
    steps: [ex("east")],
    expectError: "EXIT_CLOSED",
    recovery: [mv(4, 5), ix("mile-r13")],
    expect: { room: "DG10-R13", textIncludes: "Hang the oarlock on the fourth hook.", notFlags: ["dg10.cleared"] },
  }],
});

const bossFight = [
  { op: "boss", action: "begin" },
  mv(6, 6),
  { op: "boss", action: "glass-strike", tag: "boss-mid" },
  mv(8, 6),
  { op: "boss", action: "glass-strike" },
  mv(9, 4),
  { op: "boss", action: "stand-ring" },
  mv(10, 6),
  { op: "boss", action: "glass-strike" },
  mv(12, 6),
  { op: "boss", action: "glass-strike" },
  mv(9, 6),
  { op: "boss", action: "snag" },
  { op: "boss", action: "strike", tool: "hammer" },
];

const R14 = room({
  id: "DG10-R14",
  name: "The Collector",
  summary: "The Collector tries to add Ellis as a line. Each proof is a mark on the floor. Glass, the bell, the line, the seal. God-light is refused.",
  classification: "main",
  map: { c: 5, r: 2 },
  terrain: terrain([[8, 6, ","], [9, 6, ","]], "R14"),
  paints: [[4, 2, "*"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG10-R13", [9, 2]),
    link("east", [16, 6], "COUNTY:CHAMPLAIN-SHORE", [0, 0], { when: { all: ["dg10.cleared"] }, closedText: "The shore stays shut." }),
  ],
  actors: [{ id: "collector", name: "The Collector", tile: [9, 5], kind: "boss", resets: "on-death-if-not-defeated" }],
  interactions: [mile("mile-r14", [4, 2], ["dg10.cleared"], "Reflect each proof with homestead glass. Ring the deck bell. Tie the book with the sugar-line. Hammer the seal. God-light is refused.")],
  persistentState: ["collected-rewards", "hooked-debts", "flags"],
  resetState: ["boss-phase-if-not-defeated", "enemy-positions"],
  localProof: {
    place: { room: "DG10-R14", tile: [2, 6], flags: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"] },
    steps: [...bossFight],
    expect: { items: { "struck-ledger": 1 }, flags: ["dg10.cleared"], phase: "DEFEATED" },
  },
  failureAndRecovery: [{
    name: "god-cannot-strike-a-line",
    place: { room: "DG10-R14", tile: [8, 6], form: "god", flags: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4"] },
    steps: [{ op: "boss", action: "begin" }, { op: "boss", action: "glass-strike" }],
    expectError: "GOD_SEALED",
    recovery: [{ op: "set-form", form: "mortal" }, ...bossFight],
    expect: { items: { "struck-ledger": 1 } },
  }],
});

const R15 = room({
  id: "DG10-R15",
  name: "High Crane",
  summary: "Optional return rope to the landing once the pin is hammered. It skips a home crossing, not a debt.",
  classification: "optional",
  map: { c: 3, r: 0 },
  terrain: terrain([[8, 5, ","], [9, 5, ","], [10, 5, ","], [11, 5, ","], [12, 5, ","], [13, 5, ","], [14, 5, ","], [15, 5, ","], [16, 6, "."]], "R15"),
  paints: [[4, 3, "*"], [8, 5, "H"], [16, 6, "R"], [9, 10, "S"]],
  connections: [
    link("south", [9, 10], "DG10-R11", [9, 2]),
    link("rope", [16, 6], "DG10-R01", [6, 8], {
      when: { all: ["dg10.crane"] },
      transitionSteps: 3,
      transitionId: "crane-rope",
      transitionText: "The rope runs back to Ledger Landing.",
      closedText: "The crane pin is still seated.",
    }),
  ],
  interactions: [
    mile("mile-r15", [4, 3], ["dg10.crane"]),
    flagInteract({ id: "fix-crane", tile: [8, 5], glyph: "H", requiresTools: ["hammer"], sets: ["dg10.crane"], grantItem: "crane-pin", successText: "The crane answers. The rope is a return, not a cleared line." }),
  ],
  localProof: {
    place: { room: "DG10-R15", tile: [9, 10] },
    steps: [mv(8, 5), ix("fix-crane"), mv(16, 6), ex("rope"), ...ticks(3)],
    expect: { flags: ["dg10.crane"], room: "DG10-R01", items: { "crane-pin": 1 } },
  },
  failureAndRecovery: [{
    name: "rope-before-the-pin",
    place: { room: "DG10-R15", tile: [16, 6] },
    steps: [ex("rope")],
    expectError: "EXIT_CLOSED",
    recovery: [mv(8, 5), ix("fix-crane"), mv(16, 6), ex("rope"), ...ticks(3)],
    expect: { room: "DG10-R01", flags: ["dg10.crane"] },
  }],
});

const R16 = room({
  id: "DG10-R16",
  name: "Night Crib",
  summary: "Optional glass shows passengers the ferry never carried.",
  classification: "optional",
  map: { c: 5, r: 0 },
  terrain: terrain([[8, 6, ","]], "R16"),
  paints: [[8, 6, "g"], [4, 3, "*"], [9, 10, "D"]],
  connections: [link("down", [9, 10], "DG10-R07", [9, 2])],
  interactions: [
    mile("mile-r16", [4, 3], ["dg10.passengers"]),
    flagInteract({ id: "see-passengers", tile: [8, 6], glyph: "g", requiresTools: ["homestead-glass"], sets: ["dg10.passengers"], grantItem: "passenger-glass", successText: "Unlived passengers, seen and not collected as a debt." }),
  ],
  localProof: {
    place: { room: "DG10-R16", tile: [9, 10] },
    steps: [mv(8, 6), ix("see-passengers")],
    expect: { items: { "passenger-glass": 1 } },
  },
  failureAndRecovery: [{
    name: "crib-without-glass",
    place: { room: "DG10-R16", tile: [8, 6], tools: tools.filter((t) => t !== "homestead-glass") },
    steps: [ix("see-passengers")],
    expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "homestead-glass" }, ix("see-passengers")],
    expect: { items: { "passenger-glass": 1 } },
  }],
});

const rooms = [R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16];

const board = [mv(4, 6), ex("board")];
const home = [...board, mv(2, 6), ex("launch-home"), ...ticks(4)];
const channel = [...board, mv(15, 6), ex("launch-channel"), ...ticks(4)];
const flip = (id, tile) => [mv(9, 1), ex("north"), mv(tile[0], tile[1]), ix(`lever-${id}`), mv(9, 10), ex("south")];

const untilOarlock = [
  mv(6, 4), ix("read-ledger"),
  mv(16, 6), ex("east"),
  mv(8, 5), ix("pick-ticket"),
  mv(1, 6), ex("west"),
  ...channel,
  mv(6, 5), ix("H1"),
  ...home,
  ...flip("E", [8, 5]),
  ...channel,
  mv(16, 6), ex("east"),
  mv(8, 5), ix("pick-bell"),
  mv(1, 6), ex("west"),
  ...home,
  ...flip("E", [8, 5]),
  ...channel,
  mv(8, 5), ix("H2"),
  ...home,
  ...flip("W", [4, 5]),
  ...channel,
  mv(8, 6), ix("pull-chain"),
  mv(16, 6), ex("east"),
  mv(8, 5), ix("pick-lantern"),
  mv(1, 6), ex("west"),
  ...home,
  ...flip("W", [4, 5]),
  ...channel,
  mv(10, 5), ix("H3"),
  ...home,
  ...flip("S", [12, 5]),
  ...channel,
  mv(16, 6), ex("east"),
  mv(9, 6),
  { op: "miniboss", action: "begin" },
  { op: "miniboss", action: "pin", n: 1, tool: "bow" },
  { op: "miniboss", action: "pin", n: 2, tool: "bow" },
  { op: "miniboss", action: "pin", n: 3, tool: "bow" },
  { op: "miniboss", action: "strike", tool: "hammer" },
  mv(8, 8), ix("pick-oarlock"),
  mv(1, 6), ex("west"),
];

const finishFromR05 = [
  mv(12, 5), ix("H4"),
  mv(9, 1), ex("north"),
  mv(16, 6), ex("east"),
  ...bossFight,
  { op: "assert", code: "item-count", item: "struck-ledger", count: 1 },
  { op: "assert", code: "not-item", item: "blue-shell" },
  { op: "assert", code: "not-item", item: "crane-pin" },
  { op: "assert", code: "not-item", item: "scratched-line" },
  { op: "assert", code: "room", room: "DG10-R14" },
];

const main = [
  ...untilOarlock,
  ...home,
  ...flip("S", [12, 5]),
  ...channel,
  ...finishFromR05,
];

const shortcut = [
  ...untilOarlock,
  mv(9, 1), ex("north"),
  mv(8, 5), ix("fix-crane"),
  mv(16, 6), ex("rope"),
  ...ticks(3),
  ...flip("S", [12, 5]),
  ...channel,
  ...finishFromR05.filter((op) => !(op.op === "assert" && op.code === "not-item" && op.item === "crane-pin")),
  { op: "assert", code: "item", item: "crane-pin" },
  { op: "assert", code: "flag", flag: "dg10.D4", value: true },
];

const toLanding = [mv(9, 10), ex("south"), mv(9, 10), ex("south"), ...home];
const collect = {
  "blue-shell": [...toLanding, ...flip("E", [8, 5]), ...channel, mv(8, 2), ix("take-shell"), { op: "assert", code: "item", item: "blue-shell" }, { op: "assert", code: "flag", flag: "dg10.D1", value: true }],
  "scratched-line": [...toLanding, mv(9, 10), ex("down"), mv(8, 6), ix("read-keel"), { op: "assert", code: "item", item: "scratched-line" }],
  "passenger-glass": [...toLanding, ...flip("E", [8, 5]), ...channel, mv(16, 6), ex("east"), mv(9, 1), ex("up"), mv(8, 6), ix("see-passengers"), { op: "assert", code: "item", item: "passenger-glass" }],
  "crane-pin": [...toLanding, ...flip("S", [12, 5]), ...channel, mv(9, 1), ex("north"), mv(8, 5), ix("fix-crane"), { op: "assert", code: "item", item: "crane-pin" }],
};

const transitionSetup = [
  mv(6, 4), ix("read-ledger"),
  mv(16, 6), ex("east"),
  mv(8, 5), ix("pick-ticket"),
  mv(1, 6), ex("west"),
  ...board,
  mv(15, 6), ex("launch-channel"),
  { op: "tick-transition" },
];

export const dungeon = {
  id: "DG10",
  name: "The Ferryman's Ledger",
  bossName: "The Collector",
  county: "Addison County, Vermont",
  site: "Ledger Landing on the Champlain shore",
  protagonist: "Ellis Perch",
  tileSize: 16,
  widthTiles: 18,
  heightTiles: 12,
  maxHp: 6,
  startingTools: tools,
  codexFlag: null,
  entry: { room: "DG10-R01", tile: [3, 6] },
  flagBook,
  rooms,
  debts,
  transportables: [
    { id: "marble-ticket", home: { room: "DG10-R02", tile: [8, 5] }, returnHomeOnTransitionDeath: true, optional: false },
    { id: "ferry-bell", home: { room: "DG10-R07", tile: [8, 5] }, returnHomeOnTransitionDeath: true, optional: false },
    { id: "red-lantern", home: { room: "DG10-R09", tile: [8, 5] }, returnHomeOnTransitionDeath: true, optional: false },
    { id: "oarlock", home: { room: "DG10-R10", tile: [8, 8] }, returnHomeOnTransitionDeath: true, optional: false },
  ],
  moths: [],
  plots: [],
  ferry: {
    deckRoom: "DG10-R04",
    homeDock: "DG10-R01",
    levers: ["W", "E", "S"],
    exclusive: true,
    steps: 4,
    table: { "": "DG10-R05", W: "DG10-R03", E: "DG10-R06", S: "DG10-R11" },
    arrivals: {
      "DG10-R01": [4, 6],
      "DG10-R05": [4, 6],
      "DG10-R03": [4, 6],
      "DG10-R06": [4, 6],
      "DG10-R11": [4, 6],
    },
  },
  seasons: [],
  bannedWords: ["price", "gold", "coins", "shop", "interest", "vendor"],
  godForm: {
    water: "sealed",
    void: "sealed",
    gust: "sealed",
    note: "The lake crossing is the ferry. God-flight from the landing is sealed. Levers, chains, hooks and the Collector reject god-form.",
  },
  dependencyGraph: {
    nodes: ["ENTER", "dg10.ledger-read", "dg10.D1", "dg10.D2", "dg10.chain", "dg10.D3", "dg10.warden", "dg10.D4", "dg10.cleared"],
    edges: [
      { from: "ENTER", to: "dg10.ledger-read" },
      { from: "dg10.ledger-read", to: "dg10.D1" },
      { from: "dg10.D1", to: "dg10.D2" },
      { from: "dg10.D2", to: "dg10.chain" },
      { from: "dg10.chain", to: "dg10.D3" },
      { from: "dg10.D3", to: "dg10.warden" },
      { from: "dg10.warden", to: "dg10.D4" },
      { from: "dg10.D4", to: "dg10.cleared" },
    ],
  },
  shortcuts: [{
    id: "crane-return",
    description: "After the oarlock, the high crane rope replaces the homeward ferry. All four lines are still required.",
    skips: [],
    stillRequires: ["dg10.D1", "dg10.D2", "dg10.D3", "dg10.D4", "dg10.warden"],
    fewerExit: "launch-home",
    route: "shortcut",
  }],
  discoveries: [
    { id: "blue-shell", room: "DG10-R06", item: "blue-shell", interact: "take-shell", optional: true, missable: false },
    { id: "scratched-line", room: "DG10-R12", item: "scratched-line", interact: "read-keel", optional: true, missable: false },
    { id: "passenger-glass", room: "DG10-R16", item: "passenger-glass", interact: "see-passengers", optional: true, missable: false },
    { id: "crane-pin", room: "DG10-R15", item: "crane-pin", interact: "fix-crane", optional: true, missable: false },
  ],
  intentionalCycles: [
    { id: "ferry-loop", rooms: ["DG10-R01", "DG10-R04", "DG10-R05"], benign: true, note: "The deck runs until the four objects are on their hooks." },
  ],
  miniboss: {
    id: "chain-warden",
    name: "The Chain Warden",
    room: "DG10-R10",
    initialPhase: "PINS",
    defeatedPhase: "DEFEATED",
    idlePhase: "IDLE",
    reward: null,
    sets: ["dg10.warden"],
    beginText: "The warden lifts the chains.",
    victoryText: "The lock opens. The oarlock can be taken.",
    idleText: "The warden stays down.",
    phases: [
      { id: "PINS", type: "script", next: "LOCK", mark: [9, 5], accepts: [{ action: "pin", mark: [9, 5], seq: [1, 2, 3], toolAny: ["bow"], requiresForm: "mortal", rejectGodForm: true }] },
      { id: "LOCK", type: "counter", act: "strike", need: 1, mark: [9, 5], tool: "hammer", rejectGodForm: true, next: "DEFEATED" },
    ],
  },
  boss: {
    id: "collector",
    name: "The Collector",
    room: "DG10-R14",
    initialPhase: "LINE1",
    defeatedPhase: "DEFEATED",
    idlePhase: "IDLE",
    reward: { id: "struck-ledger", flag: "dg10.cleared", missable: false },
    sets: ["dg10.cleared"],
    beginText: "The Collector opens the book on Ellis's name.",
    victoryText: "The book shuts. The struck ledger is given once.",
    idleText: "The Collector is gone. The book does not open twice.",
    phases: [
      { id: "LINE1", type: "counter", act: "glass-strike", need: 1, mark: [6, 5], tool: "homestead-glass", requiresFlags: ["dg10.D1"], rejectGodForm: true, next: "LINE2" },
      { id: "LINE2", type: "counter", act: "glass-strike", need: 1, mark: [8, 5], tool: "homestead-glass", requiresFlags: ["dg10.D2"], rejectGodForm: true, next: "BELL" },
      { id: "BELL", type: "script", next: "LINE3", mark: [9, 3], accepts: [{ action: "stand-ring", mark: [9, 3], requiresForm: "mortal", rejectGodForm: true }] },
      { id: "LINE3", type: "counter", act: "glass-strike", need: 1, mark: [10, 5], tool: "homestead-glass", requiresFlags: ["dg10.D3"], rejectGodForm: true, next: "LINE4" },
      { id: "LINE4", type: "counter", act: "glass-strike", need: 1, mark: [12, 5], tool: "homestead-glass", requiresFlags: ["dg10.D4"], rejectGodForm: true, next: "BIND" },
      { id: "BIND", type: "script", next: "SEAL", mark: [9, 5], accepts: [{ action: "snag", mark: [9, 5], tool: "sugar-line", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "SEAL", type: "counter", act: "strike", need: 1, mark: [9, 5], tool: "hammer", rejectGodForm: true, next: "DEFEATED" },
    ],
  },
  routes: { main, shortcut },
  hooks: {
    foldLoop: [],
    transitionDeath: {
      setup: transitionSetup,
      carriedKind: "object",
      carriedId: "marble-ticket",
      homeLoc: "home",
      homeRoom: "DG10-R02",
      persistFlag: "dg10.ledger-read",
      lanternRoom: "DG10-R01",
    },
    inRoomCarryDeath: {
      setup: [mv(6, 4), ix("read-ledger"), mv(16, 6), ex("east"), mv(8, 5), ix("pick-ticket")],
      carriedKind: "object",
      carriedId: "marble-ticket",
      lanternRoom: "DG10-R01",
    },
    collect,
    winFromLantern: [mv(16, 6), ex("east"), ...bossFight],
    reenter: [mv(9, 10), ex("south"), mv(16, 6), ex("east"), { op: "boss", action: "begin" }],
    godAtBoss: [
      ...board,
      mv(15, 6), ex("launch-channel"),
      ...ticks(4),
      mv(9, 1), ex("north"),
      mv(16, 6), ex("east"),
      { op: "boss", action: "begin" },
      { op: "boss", action: "glass-strike" },
    ],
    exitOps: [mv(16, 6), ex("east"), { op: "assert", code: "room", room: "COUNTY:CHAMPLAIN-SHORE" }],
    reachableClosed: ["DG10-R01", "DG10-R02", "DG10-R03", "DG10-R04", "DG10-R05", "DG10-R06", "DG10-R07", "DG10-R08", "DG10-R10", "DG10-R11", "DG10-R12", "DG10-R15", "DG10-R16"],
    reachableOpen: rooms.map((r) => r.id).concat(["COUNTY:CHAMPLAIN-SHORE"]),
    reward: "struck-ledger",
  },
};
