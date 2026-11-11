import { chamber, stamp, objects, link, flagInteract } from "./lib.mjs";
import { applyWalls } from "./ruins.mjs";

const mv = (x, y) => ({ op: "move", to: [x, y] });
const ix = (id) => ({ op: "interact", id });
const ex = (id) => ({ op: "use-exit", id });
const ticks = (n) => Array.from({ length: n }, () => ({ op: "tick-transition" }));
const tools = ["shovel", "sugar-line", "boots", "fins", "lamp", "hammer", "net", "homestead-glass", "cape", "block-rod", "bow", "powder"];
const GUST = [
  ...[1, 2, 3, 4, 5, 7, 8, 9, 10].flatMap((y) => [[7, y, "#"], [12, y, "#"]]),
  [8, 6, "G"], [9, 6, "G"], [10, 6, "G"], [11, 6, "G"],
];

function book(rows) {
  const out = {};
  for (const [id, hint, fullRule] of rows) out[id] = { persistent: true, hint, doneText: `Already true: ${hint}.`, fullRule };
  return out;
}

const LEGEND = "Turn order is SPRING, SUMMER, AUTUMN, WINTER, BLACK_SNOW. North must be WINTER. East must be BLACK_SNOW. West must be AUTUMN. South must be SPRING. Ungrafted dials return to SPRING when you leave. Wrong grafts prune at the bench. This is not a sky.";

const flagBook = book([
  ["dg11.wedges", "four wedges sit in the bench drawer", "The bench holds four wedges. They are found, not made."],
  ["season.north.WINTER", "graft the north plot as WINTER", "The root stair freezes solid only when north is grafted WINTER."],
  ["season.east.BLACK_SNOW", "graft the east plot as BLACK_SNOW", "The marble gate opens only when east is grafted BLACK_SNOW."],
  ["season.west.AUTUMN", "graft the west plot as AUTUMN", "The leaf bridge opens only when west is grafted AUTUMN."],
  ["season.south.SPRING", "graft the south plot as SPRING", "The root heart wants south grafted SPRING, the dial's first face."],
  ["dg11.barrel-read", "read the cellar barrel with the lamp", "The barrel names the east plot's fifth face. The lamp tool is required. God-light does not read it."],
  ["dg11.row-cleared", "bring the unpicked row through spring, winter, and black snow", "The row is a fight dial. It is not grafted and it resets if you die."],
  ["dg11.cleared", "correct the Winter Graft", "The orchard road opens after the Winter Graft is corrected. The heart is given once."],
  ["dg11.mirror", "the mirror repeats the four grafts", "Optional confirmation. The packing-shed legend already states them."],
  ["dg11.lens", "fire the black-snow clod", "The kiln fires the clod into a lens. If you die on the bridge the clod is back on the mound."],
  ["dg11.seed", "loose a marble seed with the bow", "Discarded June holds an optional seed. It gates nothing."],
  ["season.north.SUMMER", "a wrong north graft", "Prune it. The bench returns the wedge."],
]);

function mile(id, tile, revealsFlags, alwaysText = "") {
  return { id, kind: "milepost", tile, glyph: "*", revealsFlags, codexAware: false, alwaysText, persistent: true };
}
function room(spec) {
  return {
    id: spec.id, name: spec.name, summary: spec.summary,
    classification: spec.classification, onMainRoute: spec.classification === "main",
    width: 18, height: 12, map: spec.map,
    setsLantern: !!spec.setsLantern, lanternTile: spec.lanternTile || null,
    layers: { terrain: applyWalls(spec.id, spec.terrain), objects: objects(spec.paints, spec.id) },
    conditionalTerrain: spec.conditionalTerrain || [], stepFlags: [],
    connections: spec.connections, actors: spec.actors || [],
    interactions: spec.interactions, puzzles: spec.puzzles || [],
    persistentState: spec.persistentState || ["flags", "grafted-seasons", "collected-rewards"],
    resetState: spec.resetState || ["ungrafted-dials", "enemy-positions", "boss-phase-if-not-defeated"],
    localProof: spec.localProof, failureAndRecovery: spec.failureAndRecovery,
  };
}
const terrain = (edits, id) => stamp(chamber(), edits, id);
const dials = (plot) => [
  flagInteract({ id: `dial-${plot}`, kind: "dial", plot, tile: [8, 5], glyph: "D", once: false, successText: "The plot turns." }),
  flagInteract({ id: `graft-${plot}`, kind: "graft", plot, tile: [9, 5], glyph: "H", requiresTools: ["hammer"], once: false, successText: "The graft holds." }),
];

const R01 = room({
  id: "DG11-R01", name: "Packing Shed", classification: "main", map: { c: 1, r: 1 },
  setsLantern: true, lanternTile: [3, 6],
  summary: "Hogback Orchard's shed. The wall states every graft the root heart will ask for.",
  terrain: terrain([[3, 6, ","], [9, 6, ","], [14, 1, "^"]], "R01"),
  paints: [[4, 3, "*"], [9, 1, "N"], [16, 6, "E"], [1, 6, "W"], [14, 1, "U"], [3, 6, "@"]],
  connections: [
    link("north", [9, 1], "DG11-R02", [9, 10]),
    link("east", [16, 6], "DG11-R05", [2, 6]),
    link("west", [1, 6], "DG11-R06", [15, 6]),
    link("roof", [14, 1], "DG11-R15", [2, 6]),
  ],
  interactions: [mile("mile-r01", [4, 3], ["season.north.WINTER", "season.east.BLACK_SNOW", "season.west.AUTUMN", "season.south.SPRING"], LEGEND)],
  localProof: {
    place: { room: "DG11-R01", tile: [3, 6] },
    steps: [mv(4, 3), ix("mile-r01"), mv(1, 6), ex("west")],
    expect: { room: "DG11-R06", textIncludes: "North must be WINTER" },
  },
  failureAndRecovery: [{
    name: "roof-from-the-wrong-tile",
    place: { room: "DG11-R01", tile: [3, 6] },
    steps: [ex("roof")],
    expectError: "NOT_ON_EXIT",
    recovery: [mv(14, 1), ex("roof")],
    expect: { room: "DG11-R15" },
  }],
});

const R02 = room({
  id: "DG11-R02", name: "North Plot", classification: "main", map: { c: 1, r: 0 },
  summary: "North plot dial. Grafting WINTER freezes the broken root stair.",
  terrain: terrain([[4, 1, "+"], [4, 2, "+"], [4, 3, "+"]], "R02"),
  conditionalTerrain: [{ tiles: [[4, 1], [4, 2], [4, 3]], requiresAll: ["season.north.WINTER"] }],
  paints: [[4, 8, "*"], [8, 5, "D"], [9, 5, "H"], [9, 10, "S"], [4, 1, "v"]],
  connections: [
    link("south", [9, 10], "DG11-R01", [9, 2]),
    link("down", [4, 1], "DG11-R03", [9, 2], { when: { all: ["season.north.WINTER"] }, closedText: "The stair is still broken. North must be grafted WINTER." }),
  ],
  interactions: [mile("mile-r02", [4, 8], ["season.north.WINTER"]), ...dials("north")],
  puzzles: [{ id: "north-graft", kind: "dial-graft", sets: ["season.north.WINTER"], persistent: true }],
  localProof: {
    place: { room: "DG11-R02", tile: [9, 10], items: { wedge: 4 } },
    steps: [mv(8, 5), ix("dial-north"), ix("dial-north"), ix("dial-north"), mv(9, 5), ix("graft-north"), mv(4, 1), ex("down")],
    expect: { flags: ["season.north.WINTER"], room: "DG11-R03", items: { wedge: 3 } },
  },
  failureAndRecovery: [
    {
      name: "ungrafted-dial-resets-on-leave",
      place: { room: "DG11-R02", tile: [8, 5] },
      steps: [ix("dial-north"), ix("dial-north"), ix("dial-north"), { op: "assert", code: "season", id: "north", current: "WINTER", grafted: false }, mv(9, 10), ex("south")],
      recovery: [mv(9, 1), ex("north"), { op: "assert", code: "season", id: "north", current: "SPRING", grafted: false }],
      expect: { notFlags: ["season.north.WINTER"], room: "DG11-R02" },
    },
    {
      name: "wrong-graft-prunes",
      place: { room: "DG11-R02", tile: [8, 5], items: { wedge: 4 } },
      steps: [ix("dial-north"), mv(9, 5), ix("graft-north"), { op: "assert", code: "flag", flag: "season.north.SUMMER", value: true }],
      recovery: [
        mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(4, 8), ix("prune-north"),
        mv(16, 6), ex("east"), mv(9, 1), ex("north"),
        mv(8, 5), ix("dial-north"), ix("dial-north"), ix("dial-north"), mv(9, 5), ix("graft-north"),
      ],
      expect: { flags: ["season.north.WINTER"], notFlags: ["season.north.SUMMER"], items: { wedge: 3 } },
    },
  ],
});

const R03 = room({
  id: "DG11-R03", name: "Root Ladder", classification: "main", map: { c: 1, r: 2 },
  summary: "The frozen stair between the north plot and the ice cellar.",
  terrain: terrain([[9, 6, "^"]], "R03"),
  paints: [[9, 1, "U"], [9, 10, "D"], [4, 4, "*"]],
  connections: [
    link("up", [9, 1], "DG11-R02", [4, 4]),
    link("down", [9, 10], "DG11-R04", [9, 2]),
  ],
  interactions: [mile("mile-r03", [4, 4], [], "Down is the cellar. The stair stays because the graft stays.")],
  localProof: { place: { room: "DG11-R03", tile: [9, 2] }, steps: [mv(9, 10), ex("down")], expect: { room: "DG11-R04" } },
  failureAndRecovery: [{
    name: "ladder-wall", place: { room: "DG11-R03", tile: [9, 6] },
    steps: [mv(0, 6)], expectError: "NO_PATH", recovery: [mv(9, 10), ex("down")], expect: { room: "DG11-R04" },
  }],
});

const R04 = room({
  id: "DG11-R04", name: "Ice Cellar", classification: "main", map: { c: 2, r: 2 },
  summary: "Stored winters in barrels. The lamp reads them. A clod on the mound is optional.",
  terrain: terrain([[6, 6, "S"], [8, 4, ","]], "R04"),
  paints: [[4, 3, "*"], [8, 4, "B"], [6, 6, "C"], [9, 1, "U"], [16, 6, "E"], [9, 10, "K"]],
  connections: [
    link("up", [9, 1], "DG11-R03", [9, 9]),
    link("east", [16, 6], "DG11-R09", [2, 6]),
    link("south", [9, 10], "DG11-R08", [9, 2], { transitionSteps: 3, transitionId: "kiln-bridge", transitionText: "The kiln bridge is a stored cold, not a season.", deathLantern: { room: "DG11-R01", tile: [3, 6] } }),
  ],
  interactions: [
    mile("mile-r04", [4, 3], ["dg11.barrel-read"], "God-light does not read the barrel. The clod is optional and returns if the kiln bridge kills you."),
    flagInteract({ id: "read-barrel", tile: [8, 4], glyph: "B", requiresTools: ["lamp"], sets: ["dg11.barrel-read"], successText: "The barrel says the east plot wants BLACK_SNOW.", failText: { tool: "The barrel stays illegible without the lamp." } }),
    flagInteract({ id: "pick-clod", kind: "pickup", object: "black-clod", tile: [6, 6], glyph: "C", once: false, successText: "A clod of black snow." }),
  ],
  localProof: {
    place: { room: "DG11-R04", tile: [9, 2] },
    steps: [mv(8, 4), ix("read-barrel"), mv(16, 6), ex("east")],
    expect: { flags: ["dg11.barrel-read"], room: "DG11-R09" },
  },
  failureAndRecovery: [{
    name: "barrel-without-lamp",
    place: { room: "DG11-R04", tile: [8, 4], tools: tools.filter((t) => t !== "lamp"), form: "god" },
    steps: [ix("read-barrel")],
    expectError: "FORM_REQUIRED",
    recovery: [{ op: "set-form", form: "mortal" }, { op: "grant-tool", tool: "lamp" }, ix("read-barrel")],
    expect: { flags: ["dg11.barrel-read"] },
  }],
});

const R05 = room({
  id: "DG11-R05", name: "East Plot", classification: "main", map: { c: 2, r: 1 },
  summary: "East plot. BLACK_SNOW is the fifth face of the dial, an authored state.",
  terrain: terrain([[8, 5, ","]], "R05"),
  paints: [[4, 3, "*"], [8, 5, "D"], [9, 5, "H"], [1, 6, "W"], [9, 1, "N"]],
  connections: [
    link("west", [1, 6], "DG11-R01", [15, 6]),
    link("north", [9, 1], "DG11-R16", [9, 10]),
  ],
  interactions: [mile("mile-r05", [4, 3], ["season.east.BLACK_SNOW"]), ...dials("east")],
  localProof: {
    place: { room: "DG11-R05", tile: [2, 6], items: { wedge: 4 } },
    steps: [mv(8, 5), ix("dial-east"), ix("dial-east"), ix("dial-east"), ix("dial-east"), mv(9, 5), ix("graft-east")],
    expect: { flags: ["season.east.BLACK_SNOW"], items: { wedge: 3 } },
  },
  failureAndRecovery: [{
    name: "god-cannot-turn-a-plot",
    place: { room: "DG11-R05", tile: [8, 5], form: "god" },
    steps: [ix("dial-east")],
    expectError: "FORM_REQUIRED",
    recovery: [{ op: "set-form", form: "mortal" }, ix("dial-east")],
    expect: { room: "DG11-R05" },
  }],
});

const R06 = room({
  id: "DG11-R06", name: "Grafting Bench", classification: "main", map: { c: 0, r: 1 },
  summary: "Four wedges in a drawer. Pruning a bad graft returns its wedge.",
  terrain: terrain([[8, 6, ","], [4, 8, ","], [6, 8, ","], [8, 8, ","], [10, 8, ","]], "R06"),
  paints: [[4, 3, "*"], [8, 6, "W"], [4, 8, "n"], [6, 8, "e"], [8, 8, "w"], [10, 8, "s"], [16, 6, "E"]],
  connections: [link("east", [16, 6], "DG11-R01", [2, 6])],
  interactions: [
    mile("mile-r06", [4, 3], ["dg11.wedges"], "Prune returns a wedge and sets that plot back to SPRING."),
    flagInteract({ id: "take-wedges", kind: "grant", item: "wedge", count: 4, tile: [8, 6], glyph: "W", sets: ["dg11.wedges"], successText: "Four wedges. They were already made." }),
    flagInteract({ id: "prune-north", kind: "prune", plot: "north", tile: [4, 8], glyph: "n", requiresTools: ["hammer"], once: false }),
    flagInteract({ id: "prune-east", kind: "prune", plot: "east", tile: [6, 8], glyph: "e", requiresTools: ["hammer"], once: false }),
    flagInteract({ id: "prune-west", kind: "prune", plot: "west", tile: [8, 8], glyph: "w", requiresTools: ["hammer"], once: false }),
    flagInteract({ id: "prune-south", kind: "prune", plot: "south", tile: [10, 8], glyph: "s", requiresTools: ["hammer"], once: false }),
  ],
  localProof: { place: { room: "DG11-R06", tile: [15, 6] }, steps: [mv(8, 6), ix("take-wedges")], expect: { items: { wedge: 4 }, flags: ["dg11.wedges"] } },
  failureAndRecovery: [{
    name: "drawer-taken-once",
    place: { room: "DG11-R06", tile: [8, 6] },
    steps: [ix("take-wedges"), ix("take-wedges")],
    recovery: [mv(16, 6), ex("east")],
    expect: { items: { wedge: 4 }, room: "DG11-R01" },
  }],
});

const R07 = room({
  id: "DG11-R07", name: "West Plot", classification: "main", map: { c: 0, r: 3 },
  summary: "West plot. AUTUMN grows the leaf bridge in the cider tunnel.",
  terrain: terrain([[8, 5, ","]], "R07"),
  paints: [[4, 3, "*"], [8, 5, "D"], [9, 5, "H"], [9, 10, "S"]],
  connections: [link("south", [9, 10], "DG11-R09", [9, 2])],
  interactions: [mile("mile-r07", [4, 3], ["season.west.AUTUMN"]), ...dials("west")],
  localProof: {
    place: { room: "DG11-R07", tile: [9, 10], items: { wedge: 2 } },
    steps: [mv(8, 5), ix("dial-west"), ix("dial-west"), mv(9, 5), ix("graft-west")],
    expect: { flags: ["season.west.AUTUMN"], items: { wedge: 1 } },
  },
  failureAndRecovery: [{
    name: "graft-without-a-wedge",
    place: { room: "DG11-R07", tile: [9, 5], items: { wedge: 0 } },
    steps: [ix("graft-west")],
    expectError: "NO_WEDGE",
    recovery: [],
    expect: { notFlags: ["season.west.AUTUMN"] },
  }],
});

const R08 = room({
  id: "DG11-R08", name: "Snow Kiln", classification: "optional", map: { c: 2, r: 3 },
  summary: "Optional kiln. Fires one clod into a lens. Not a season dial.",
  terrain: terrain([[8, 6, ","]], "R08"),
  paints: [[8, 6, "K"], [4, 3, "*"], [9, 1, "N"]],
  connections: [link("north", [9, 1], "DG11-R04", [9, 9])],
  interactions: [
    mile("mile-r08", [4, 3], ["dg11.lens"]),
    flagInteract({ id: "fire-clod", kind: "fire", object: "black-clod", tile: [8, 6], glyph: "K", sets: ["dg11.lens"], grantItem: "kiln-lens", once: false, successText: "The clod is a lens now. It was not lost." }),
  ],
  localProof: {
    place: { room: "DG11-R08", tile: [8, 6], carrying: { id: "black-clod", kind: "object" } },
    steps: [ix("fire-clod")],
    expect: { items: { "kiln-lens": 1 }, flags: ["dg11.lens"] },
  },
  failureAndRecovery: [{
    name: "kiln-empty-hands",
    place: { room: "DG11-R08", tile: [8, 6] },
    steps: [ix("fire-clod")],
    expectError: "WRONG_OBJECT",
    recovery: [mv(9, 1), ex("north")],
    expect: { room: "DG11-R04" },
  }],
});

const leaf = [[9, 8, "+"], [9, 9, "+"], [9, 10, "+"]];
const marble = [[14, 6, "+"], [15, 6, "+"], [16, 6, "+"], [16, 3, "+"], [15, 3, "+"]];
const R09 = room({
  id: "DG11-R09", name: "Cider Tunnel", classification: "main", map: { c: 3, r: 2 },
  summary: "Under the orchard. Leaf bridge and marble gate are graft doors, not climate.",
  terrain: terrain([...leaf, ...marble], "R09"),
  conditionalTerrain: [
    { tiles: leaf.map(([x, y]) => [x, y]), requiresAll: ["season.west.AUTUMN"] },
    { tiles: marble.map(([x, y]) => [x, y]), requiresAll: ["season.east.BLACK_SNOW"] },
  ],
  paints: [[4, 4, "*"], [1, 6, "W"], [9, 1, "N"], [9, 10, "S"], [16, 6, "E"], [16, 3, "H"]],
  connections: [
    link("west", [1, 6], "DG11-R04", [15, 6]),
    link("north", [9, 1], "DG11-R07", [9, 9]),
    link("south", [9, 10], "DG11-R10", [9, 9], { when: { all: ["season.west.AUTUMN"] }, closedText: "The leaf bridge is down until west is AUTUMN." }),
    link("east", [16, 6], "DG11-R12", [2, 6], { when: { all: ["season.east.BLACK_SNOW"] }, closedText: "The marble gate wants east grafted BLACK_SNOW." }),
    link("heart", [16, 3], "DG11-R13", [2, 6], { when: { all: ["season.east.BLACK_SNOW"] }, closedText: "The root heart's passage is the same marble gate." }),
  ],
  interactions: [mile("mile-r09", [4, 4], ["season.west.AUTUMN", "season.east.BLACK_SNOW"])],
  localProof: {
    place: { room: "DG11-R09", tile: [2, 6], flags: ["season.west.AUTUMN"] },
    steps: [mv(9, 10), ex("south")],
    expect: { room: "DG11-R10" },
  },
  failureAndRecovery: [{
    name: "leaf-bridge-shut",
    place: { room: "DG11-R09", tile: [2, 6] },
    steps: [mv(9, 10)],
    expectError: "NO_PATH",
    recovery: [mv(4, 4), ix("mile-r09")],
    expect: { textIncludes: "graft the west plot as AUTUMN", room: "DG11-R09" },
  }],
});

const R10 = room({
  id: "DG11-R10", name: "The Unpicked Row", classification: "main", map: { c: 3, r: 3 },
  summary: "Miniboss. Spring at the door, winter at the dial, black snow at the far trunk. The dial resets on death and is not a graft. North returns to the tunnel only after the row falls, so the roof cannot walk into the cellar.",
  terrain: terrain([[8, 5, ","]], "R10"),
  paints: [[4, 2, "*"], [8, 5, "D"], [9, 1, "N"], [16, 6, "E"]],
  connections: [
    link("north", [9, 1], "DG11-R09", [9, 7], {
      when: { all: ["dg11.row-cleared"] },
      closedText: "The row still stands. It is not a corridor into the tunnel.",
    }),
    link("east", [16, 6], "DG11-R11", [2, 6]),
  ],
  actors: [
    { id: "row-a", name: "Unpicked Trunk", tile: [6, 6], kind: "miniboss-body", resets: "on-death-if-not-defeated" },
    { id: "row-b", name: "Unpicked Trunk", tile: [11, 6], kind: "miniboss-body", resets: "on-death-if-not-defeated" },
  ],
  interactions: [
    mile("mile-r10", [4, 2], ["dg11.row-cleared"], "A note says: spring roots them, winter lets the hammer speak, black snow finishes. Leaving or dying resets this dial."),
    flagInteract({ id: "dial-row", kind: "dial", plot: "row", tile: [8, 5], glyph: "D", once: false, successText: "The row's dial turns." }),
  ],
  puzzles: [{ id: "row-fight", kind: "season-boss", sets: ["dg11.row-cleared"], persistent: false }],
  persistentState: ["miniboss-defeat", "flags"],
  resetState: ["ungrafted-dials", "boss-phase-if-not-defeated", "enemy-positions"],
  localProof: {
    place: { room: "DG11-R10", tile: [9, 9] },
    steps: [
      { op: "miniboss", action: "begin" },
      { op: "miniboss", action: "strike", tool: "shovel" },
      mv(8, 5), ix("dial-row"), ix("dial-row"), ix("dial-row"),
      { op: "miniboss", action: "strike", tool: "hammer" },
      ix("dial-row"),
      mv(11, 6),
      { op: "miniboss", action: "strike", tool: "hammer" },
      mv(16, 6), ex("east"),
    ],
    expect: { flags: ["dg11.row-cleared"], room: "DG11-R11" },
  },
  failureAndRecovery: [{
    name: "strike-in-the-wrong-face",
    place: { room: "DG11-R10", tile: [8, 5] },
    steps: [{ op: "miniboss", action: "begin" }, ix("dial-row"), { op: "miniboss", action: "strike", tool: "shovel" }],
    expectError: "WRONG_SEASON",
    recovery: [
      ix("dial-row"), ix("dial-row"), ix("dial-row"), ix("dial-row"),
      mv(9, 8),
      { op: "miniboss", action: "strike", tool: "shovel" },
      mv(8, 5),
      ix("dial-row"), ix("dial-row"), ix("dial-row"),
      { op: "miniboss", action: "strike", tool: "hammer" },
      ix("dial-row"),
      mv(11, 6),
      { op: "miniboss", action: "strike", tool: "hammer" },
    ],
    expect: { flags: ["dg11.row-cleared"] },
  }],
});

const R11 = room({
  id: "DG11-R11", name: "South Plot", classification: "main", map: { c: 4, r: 3 },
  summary: "South plot. The heart wants this one grafted on SPRING, before the dial is turned.",
  terrain: terrain([[8, 5, ","]], "R11"),
  paints: [[4, 3, "*"], [8, 5, "D"], [9, 5, "H"], [1, 6, "W"], [9, 1, "N"]],
  connections: [
    link("west", [1, 6], "DG11-R10", [15, 6]),
    link("north", [9, 1], "DG11-R15", [2, 6]),
  ],
  interactions: [mile("mile-r11", [4, 3], ["season.south.SPRING"], "Do not turn the dial. Graft the first face."), ...dials("south")],
  localProof: {
    place: { room: "DG11-R11", tile: [2, 6], items: { wedge: 1 } },
    steps: [mv(9, 5), ix("graft-south")],
    expect: { flags: ["season.south.SPRING"], items: { wedge: 0 } },
  },
  failureAndRecovery: [{
    name: "turning-south-off-spring",
    place: { room: "DG11-R11", tile: [8, 5], items: { wedge: 1 } },
    steps: [ix("dial-south"), mv(9, 5), ix("graft-south"), { op: "assert", code: "flag", flag: "season.south.SPRING", value: false }],
    recovery: [
      mv(9, 1), ex("north"), mv(1, 6), ex("west"), mv(1, 6), ex("west"),
      mv(10, 8), ix("prune-south"),
      mv(16, 6), ex("east"), mv(14, 1), ex("roof"), mv(16, 6), ex("east"),
      mv(9, 5), ix("graft-south"),
    ],
    expect: { flags: ["season.south.SPRING"] },
  }],
});

const R12 = room({
  id: "DG11-R12", name: "Mirror Orchard", classification: "optional", map: { c: 4, r: 2 },
  summary: "Homestead glass repeats the four required grafts. The shed already said them.",
  terrain: terrain([[8, 6, ","]], "R12"),
  paints: [[8, 6, "g"], [4, 3, "*"], [1, 6, "W"]],
  connections: [link("west", [1, 6], "DG11-R09", [15, 5])],
  interactions: [
    mile("mile-r12", [4, 3], ["dg11.mirror"]),
    flagInteract({ id: "read-mirror", tile: [8, 6], glyph: "g", requiresTools: ["homestead-glass"], sets: ["dg11.mirror"], grantItem: "mirror-note", successText: "North WINTER. East BLACK_SNOW. West AUTUMN. South SPRING." }),
  ],
  localProof: { place: { room: "DG11-R12", tile: [2, 6] }, steps: [mv(8, 6), ix("read-mirror")], expect: { items: { "mirror-note": 1 }, textIncludes: "BLACK_SNOW" } },
  failureAndRecovery: [{
    name: "mirror-without-glass",
    place: { room: "DG11-R12", tile: [8, 6], tools: tools.filter((t) => t !== "homestead-glass") },
    steps: [ix("read-mirror")], expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "homestead-glass" }, ix("read-mirror")],
    expect: { items: { "mirror-note": 1 } },
  }],
});

const HEART = ["season.north.WINTER", "season.east.BLACK_SNOW", "season.west.AUTUMN", "season.south.SPRING"];
const R13 = room({
  id: "DG11-R13", name: "Root Heart", classification: "main", map: { c: 4, r: 1 },
  setsLantern: true, lanternTile: [9, 3],
  summary: "Four lock slots show the required grafts in writing.",
  terrain: terrain([[8, 6, ","], [12, 6, ","], [15, 6, ","]], "R13"),
  paints: [[4, 5, "*"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG11-R09", [15, 4]),
    link("east", [16, 6], "DG11-R14", [2, 6], { when: { all: HEART }, closedText: "A slot is empty. The door names it." }),
  ],
  interactions: [mile("mile-r13", [4, 5], HEART, LEGEND)],
  localProof: {
    place: { room: "DG11-R13", tile: [2, 6], flags: HEART },
    steps: [mv(16, 6), ex("east")],
    expect: { room: "DG11-R14" },
  },
  failureAndRecovery: [{
    name: "heart-missing-south",
    place: { room: "DG11-R13", tile: [16, 6], flags: ["season.north.WINTER", "season.east.BLACK_SNOW", "season.west.AUTUMN"] },
    steps: [ex("east")], expectError: "EXIT_CLOSED",
    recovery: [mv(4, 5), ix("mile-r13")],
    expect: { textIncludes: "South must be SPRING", notFlags: ["dg11.cleared"] },
  }],
});

const bossFight = [
  { op: "boss", action: "begin" },
  mv(4, 6),
  { op: "boss", action: "set-season", arm: "N", season: "WINTER" },
  { op: "boss", action: "lock", arm: "N", tag: "boss-mid" },
  mv(8, 5),
  { op: "boss", action: "set-season", arm: "E", season: "BLACK_SNOW" },
  { op: "boss", action: "lock", arm: "E" },
  mv(6, 8),
  { op: "boss", action: "set-season", arm: "W", season: "AUTUMN" },
  { op: "boss", action: "lock", arm: "W" },
  mv(12, 6),
  { op: "boss", action: "set-season", arm: "S", season: "SPRING" },
  { op: "boss", action: "lock", arm: "S" },
  mv(9, 6),
  { op: "boss", action: "set-season", arm: "C", season: "WINTER" },
  { op: "boss", action: "strike", arm: "C", tool: "bow" },
  { op: "boss", action: "strike", arm: "C", tool: "bow" },
];

const R14 = room({
  id: "DG11-R14", name: "The Winter Graft", classification: "main", map: { c: 5, r: 1 },
  summary: "The Winter Graft tries to lock the wrong faces. Walk to each arm, set it, and lock it. Two arrows into the winter heart. God-form cannot turn the arms.",
  terrain: terrain([[8, 6, ","]], "R14"),
  paints: [[4, 2, "*"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG11-R13", [9, 2]),
    link("east", [16, 6], "COUNTY:HOGBACK", [0, 0], { when: { all: ["dg11.cleared"] }, closedText: "The orchard road stays shut." }),
  ],
  actors: [{ id: "graft", name: "The Winter Graft", tile: [9, 5], kind: "boss", resets: "on-death-if-not-defeated" }],
  interactions: [mile("mile-r14", [4, 2], ["dg11.cleared"], "Set each arm to the grafted face and lock it. Center must be WINTER before the bow. God-form cannot turn the arms.")],
  persistentState: ["collected-rewards", "grafted-seasons", "flags"],
  resetState: ["boss-phase-if-not-defeated"],
  localProof: {
    place: { room: "DG11-R14", tile: [2, 6], flags: HEART },
    steps: [...bossFight],
    expect: { items: { "cambium-heart": 1 }, flags: ["dg11.cleared"], phase: "DEFEATED" },
  },
  failureAndRecovery: [{
    name: "misgraft-resets-the-arm",
    place: { room: "DG11-R14", tile: [8, 6] },
    steps: [{ op: "boss", action: "begin" }, { op: "boss", action: "set-season", arm: "N", season: "SUMMER" }, { op: "boss", action: "lock", arm: "N" }],
    expectError: "WRONG_SEASON",
    recovery: [...bossFight.filter((op) => op.action !== "begin")],
    expect: { items: { "cambium-heart": 1 } },
  }],
});

const R15 = room({
  id: "DG11-R15", name: "Sparrow Roof", classification: "optional", map: { c: 2, r: 0 },
  summary: "Cape gust across the roof drops into the south plot, skipping the unpicked row.",
  terrain: terrain(GUST, "R15"),
  paints: [[3, 3, "*"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG11-R01", [14, 2]),
    link("east", [16, 6], "DG11-R11", [9, 2]),
  ],
  interactions: [mile("mile-r15", [3, 3], [], "The gust path takes the cape. Embryonic God does not wear it. East skips the row.")],
  localProof: { place: { room: "DG11-R15", tile: [2, 6] }, steps: [mv(3, 3), ix("mile-r15"), mv(16, 6), ex("east")], expect: { room: "DG11-R11", textIncludes: "cape" } },
  failureAndRecovery: [{
    name: "god-cannot-cross-the-gust",
    place: { room: "DG11-R15", tile: [2, 6], form: "god" },
    steps: [mv(16, 6)],
    expectError: "NO_PATH",
    recovery: [{ op: "set-form", form: "mortal" }, mv(16, 6), ex("east")],
    expect: { room: "DG11-R11" },
  }],
});

const R16 = room({
  id: "DG11-R16", name: "Discarded June", classification: "optional", map: { c: 2, r: 0 },
  summary: "A discarded summer stored as its own room. A bow target hides a seed. The dials elsewhere do not move.",
  terrain: terrain([[8, 6, ","]], "R16"),
  paints: [[8, 6, "t"], [4, 3, "*"], [9, 10, "S"]],
  connections: [link("south", [9, 10], "DG11-R05", [9, 2])],
  interactions: [
    mile("mile-r16", [4, 3], ["dg11.seed"], "June is a room with a target. It does not change the plots."),
    flagInteract({ id: "loose-seed", tile: [8, 6], glyph: "t", requiresTools: ["bow"], sets: ["dg11.seed"], grantItem: "marble-seed", successText: "A marble seed. Optional." }),
  ],
  localProof: { place: { room: "DG11-R16", tile: [9, 10] }, steps: [mv(8, 6), ix("loose-seed")], expect: { items: { "marble-seed": 1 } } },
  failureAndRecovery: [{
    name: "seed-without-bow",
    place: { room: "DG11-R16", tile: [8, 6], tools: tools.filter((t) => t !== "bow") },
    steps: [ix("loose-seed")], expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "bow" }, ix("loose-seed")],
    expect: { items: { "marble-seed": 1 } },
  }],
});

const rooms = [R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16];

const wedges = [mv(1, 6), ex("west"), mv(8, 6), ix("take-wedges"), mv(16, 6), ex("east")];
const north = [mv(9, 1), ex("north"), mv(8, 5), ix("dial-north"), ix("dial-north"), ix("dial-north"), mv(9, 5), ix("graft-north")];
const descend = [mv(4, 1), ex("down"), mv(9, 10), ex("down"), mv(8, 4), ix("read-barrel"), mv(16, 6), ex("east")];
const west = [mv(9, 1), ex("north"), mv(8, 5), ix("dial-west"), ix("dial-west"), mv(9, 5), ix("graft-west"), mv(9, 10), ex("south")];
const row = [
  mv(9, 10), ex("south"),
  { op: "miniboss", action: "begin" },
  { op: "miniboss", action: "strike", tool: "shovel" },
  mv(8, 5), ix("dial-row"), ix("dial-row"), ix("dial-row"),
  { op: "miniboss", action: "strike", tool: "hammer" },
  ix("dial-row"),
  mv(11, 6),
  { op: "miniboss", action: "strike", tool: "hammer" },
  mv(16, 6), ex("east"),
];
const south = [mv(9, 5), ix("graft-south")];
const upToShed = [
  mv(1, 6), ex("west"),
  mv(9, 1), ex("north"),
  mv(1, 6), ex("west"),
  mv(9, 1), ex("up"),
  mv(9, 1), ex("up"),
  mv(9, 10), ex("south"),
];
const eastPlot = [mv(16, 6), ex("east"), mv(8, 5), ix("dial-east"), ix("dial-east"), ix("dial-east"), ix("dial-east"), mv(9, 5), ix("graft-east")];
const downToHeart = [
  mv(1, 6), ex("west"),
  mv(9, 1), ex("north"),
  mv(4, 1), ex("down"),
  mv(9, 10), ex("down"),
  mv(16, 6), ex("east"),
  mv(16, 3), ex("heart"),
  mv(16, 6), ex("east"),
];

const main = [
  ...wedges,
  ...north,
  ...descend,
  ...west,
  ...row,
  ...south,
  ...upToShed,
  ...eastPlot,
  ...downToHeart,
  ...bossFight,
  { op: "assert", code: "item-count", item: "cambium-heart", count: 1 },
  { op: "assert", code: "item-count", item: "wedge", count: 0 },
  { op: "assert", code: "not-item", item: "mirror-note" },
  { op: "assert", code: "not-item", item: "kiln-lens" },
  { op: "assert", code: "not-item", item: "marble-seed" },
  { op: "assert", code: "flag", flag: "dg11.row-cleared", value: true },
  { op: "assert", code: "room", room: "DG11-R14" },
];

const shortcut = [
  ...wedges,
  ...eastPlot,
  mv(1, 6), ex("west"),
  ...north,
  ...descend,
  ...west,
  mv(1, 6), ex("west"),
  mv(9, 1), ex("up"),
  mv(9, 1), ex("up"),
  mv(9, 10), ex("south"),
  mv(14, 1), ex("roof"),
  mv(16, 6), ex("east"),
  ...south,
  mv(9, 1), ex("north"),
  mv(1, 6), ex("west"),
  ...north.slice(0, 0),
  mv(9, 1), ex("north"),
  mv(4, 1), ex("down"),
  mv(9, 10), ex("down"),
  mv(16, 6), ex("east"),
  mv(16, 3), ex("heart"),
  mv(16, 6), ex("east"),
  ...bossFight,
  { op: "assert", code: "flag", flag: "dg11.row-cleared", value: false },
  { op: "assert", code: "not-visited", room: "DG11-R10" },
  { op: "assert", code: "item", item: "cambium-heart" },
];

const backToR09 = [mv(9, 10), ex("south"), mv(1, 6), ex("west")];
const collect = {
  "mirror-note": [...backToR09, mv(16, 6), ex("east"), mv(8, 6), ix("read-mirror"), { op: "assert", code: "item", item: "mirror-note" }],
  "kiln-lens": [...backToR09, mv(1, 6), ex("west"), mv(6, 6), ix("pick-clod"), mv(9, 10), ex("south"), ...ticks(3), mv(8, 6), ix("fire-clod"), { op: "assert", code: "item", item: "kiln-lens" }, { op: "assert", code: "object-loc", id: "black-clod", loc: "fired" }],
  "marble-seed": [
    mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(1, 6), ex("west"),
    mv(9, 1), ex("up"), mv(9, 1), ex("up"), mv(9, 10), ex("south"),
    mv(16, 6), ex("east"), mv(9, 1), ex("north"), mv(8, 6), ix("loose-seed"),
    { op: "assert", code: "item", item: "marble-seed" },
  ],
};

const transitionSetup = [
  ...wedges,
  ...north,
  mv(4, 1), ex("down"),
  mv(9, 10), ex("down"),
  mv(6, 6), ix("pick-clod"),
  mv(9, 10), ex("south"),
  { op: "tick-transition" },
];

export const dungeon = {
  id: "DG11",
  name: "The Orchard of Black Snow",
  bossName: "The Winter Graft",
  county: "Addison County, Vermont",
  site: "Hogback Orchard above Shoreham",
  protagonist: "Ellis Perch",
  tileSize: 16,
  widthTiles: 18,
  heightTiles: 12,
  maxHp: 6,
  startingTools: tools,
  codexFlag: null,
  entry: { room: "DG11-R01", tile: [3, 6] },
  flagBook,
  rooms,
  debts: [],
  transportables: [{ id: "black-clod", home: { room: "DG11-R04", tile: [6, 6] }, returnHomeOnTransitionDeath: true, optional: true }],
  moths: [],
  plots: [
    { id: "north", room: "DG11-R02", graftable: true, resetOnDeath: false },
    { id: "east", room: "DG11-R05", graftable: true, resetOnDeath: false },
    { id: "west", room: "DG11-R07", graftable: true, resetOnDeath: false },
    { id: "south", room: "DG11-R11", graftable: true, resetOnDeath: false },
    { id: "row", room: "DG11-R10", graftable: false, resetOnDeath: true },
  ],
  ferry: null,
  seasons: ["SPRING", "SUMMER", "AUTUMN", "WINTER", "BLACK_SNOW"],
  bannedWords: ["weather", "temperature", "humidity", "forecast", "price", "gold", "coins", "shop"],
  godForm: {
    water: "sealed", void: "sealed", gust: "sealed",
    note: "Dials require mortal hands. Gust tiles require the cape. God-light does not read the barrel or turn the Graft's arms.",
  },
  dependencyGraph: {
    nodes: ["ENTER", "dg11.wedges", "season.north.WINTER", "dg11.barrel-read", "season.west.AUTUMN", "dg11.row-cleared", "season.south.SPRING", "season.east.BLACK_SNOW", "dg11.cleared"],
    edges: [
      { from: "ENTER", to: "dg11.wedges" },
      { from: "dg11.wedges", to: "season.north.WINTER" },
      { from: "season.north.WINTER", to: "dg11.barrel-read" },
      { from: "dg11.barrel-read", to: "season.west.AUTUMN" },
      { from: "season.west.AUTUMN", to: "dg11.row-cleared" },
      { from: "dg11.row-cleared", to: "season.south.SPRING" },
      { from: "season.south.SPRING", to: "season.east.BLACK_SNOW" },
      { from: "season.east.BLACK_SNOW", to: "dg11.cleared" },
    ],
  },
  shortcuts: [{
    id: "sparrow-roof",
    description: "The cape roof drops into the south plot and skips the Unpicked Row. All four grafts remain mandatory.",
    skips: ["dg11.row-cleared"],
    stillRequires: HEART,
    route: "shortcut",
  }],
  discoveries: [
    { id: "mirror-note", room: "DG11-R12", item: "mirror-note", interact: "read-mirror", optional: true, missable: false },
    { id: "kiln-lens", room: "DG11-R08", item: "kiln-lens", interact: "fire-clod", optional: true, missable: false },
    { id: "marble-seed", room: "DG11-R16", item: "marble-seed", interact: "loose-seed", optional: true, missable: false },
  ],
  intentionalCycles: [
    { id: "shed-plots", rooms: ["DG11-R01", "DG11-R02", "DG11-R05", "DG11-R06"], benign: true },
  ],
  miniboss: {
    id: "unpicked-row",
    name: "The Unpicked Row",
    room: "DG11-R10",
    initialPhase: "ROOT",
    defeatedPhase: "DEFEATED",
    idlePhase: "IDLE",
    reward: null,
    sets: ["dg11.row-cleared"],
    beginText: "Three trunks stand up.",
    victoryText: "The row falls.",
    idleText: "The row stays down.",
    phases: [
      { id: "ROOT", type: "script", next: "FREEZE", mark: [9, 8], accepts: [{ action: "strike", mark: [9, 8], toolAny: ["shovel"], requiresSeason: "SPRING", seasonPlot: "row", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "FREEZE", type: "script", next: "CRACK", mark: [8, 6], accepts: [{ action: "strike", mark: [8, 6], toolAny: ["hammer"], requiresSeason: "WINTER", seasonPlot: "row", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "CRACK", type: "script", next: "DEFEATED", mark: [11, 6], accepts: [{ action: "strike", mark: [11, 6], toolAny: ["hammer"], requiresSeason: "BLACK_SNOW", seasonPlot: "row", requiresForm: "mortal", rejectGodForm: true }] },
    ],
  },
  boss: {
    id: "winter-graft",
    name: "The Winter Graft",
    room: "DG11-R14",
    initialPhase: "ARM_N",
    defeatedPhase: "DEFEATED",
    idlePhase: "IDLE",
    reward: { id: "cambium-heart", flag: "dg11.cleared", missable: false },
    sets: ["dg11.cleared"],
    beginText: "Four arms reach for the wrong faces.",
    victoryText: "The graft accepts the real year. The heart is given once.",
    idleText: "The tree is quiet.",
    phases: [
      { id: "ARM_N", type: "script", next: "ARM_E", mark: [4, 5], accepts: [{ action: "set-season", requiresForm: "mortal", rejectGodForm: true }, { action: "lock", mark: [4, 5], arm: "N", requiresSeason: "WINTER", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "ARM_E", type: "script", next: "ARM_W", mark: [8, 4], accepts: [{ action: "set-season", requiresForm: "mortal", rejectGodForm: true }, { action: "lock", mark: [8, 4], arm: "E", requiresSeason: "BLACK_SNOW", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "ARM_W", type: "script", next: "ARM_S", mark: [6, 8], accepts: [{ action: "set-season", requiresForm: "mortal", rejectGodForm: true }, { action: "lock", mark: [6, 8], arm: "W", requiresSeason: "AUTUMN", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "ARM_S", type: "script", next: "HEART", mark: [12, 5], accepts: [{ action: "set-season", requiresForm: "mortal", rejectGodForm: true }, { action: "lock", mark: [12, 5], arm: "S", requiresSeason: "SPRING", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "HEART", type: "script", next: "DEFEATED", mark: [9, 5], accepts: [{ action: "set-season", requiresForm: "mortal", rejectGodForm: true }, { action: "strike", mark: [9, 5], arm: "C", toolAny: ["bow"], requiresSeason: "WINTER", need: 2, requiresForm: "mortal", rejectGodForm: true }] },
    ],
  },
  routes: { main, shortcut },
  hooks: {
    foldLoop: [],
    transitionDeath: {
      setup: transitionSetup,
      carriedKind: "object",
      carriedId: "black-clod",
      homeLoc: "home",
      homeRoom: "DG11-R04",
      persistFlag: "season.north.WINTER",
      lanternRoom: "DG11-R01",
      resumeMain: false,
      reclaim: [
        mv(9, 1), ex("north"),
        mv(4, 1), ex("down"),
        mv(9, 10), ex("down"),
        mv(6, 6), ix("pick-clod"),
      ],
    },
    inRoomCarryDeath: {
      setup: [...wedges, ...north, mv(4, 1), ex("down"), mv(9, 10), ex("down"), mv(6, 6), ix("pick-clod")],
      carriedKind: "object",
      carriedId: "black-clod",
      lanternRoom: "DG11-R01",
    },
    collect,
    winFromLantern: [mv(16, 6), ex("east"), ...bossFight],
    reenter: [mv(9, 10), ex("south"), mv(16, 6), ex("east"), { op: "boss", action: "begin" }],
    godAtBoss: [
      mv(9, 1), ex("north"),
      mv(4, 1), ex("down"),
      mv(9, 10), ex("down"),
      mv(16, 6), ex("east"),
      mv(16, 3), ex("heart"),
      mv(16, 6), ex("east"),
      { op: "boss", action: "begin" },
      { op: "boss", action: "set-season", arm: "N", season: "WINTER" },
    ],
    exitOps: [mv(16, 6), ex("east"), { op: "assert", code: "room", room: "COUNTY:HOGBACK" }],
    reachableClosed: ["DG11-R01", "DG11-R02", "DG11-R05", "DG11-R06", "DG11-R10", "DG11-R11", "DG11-R15", "DG11-R16"],
    reachableOpen: rooms.map((r) => r.id).concat(["COUNTY:HOGBACK"]),
    reward: "cambium-heart",
  },
};
