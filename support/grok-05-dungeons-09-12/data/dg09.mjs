import { chamber, stamp, objects, link, flagInteract } from "./lib.mjs";
import { applyWalls } from "./ruins.mjs";

const mv = (x, y) => ({ op: "move", to: [x, y] });
const ix = (id) => ({ op: "interact", id });
const ex = (id) => ({ op: "use-exit", id });
const tick = () => ({ op: "tick-transition" });
const ticks = (n) => Array.from({ length: n }, tick);

function book(rows) {
  const out = {};
  for (const [id, hint, fullRule] of rows) {
    out[id] = {
      persistent: true,
      hint,
      doneText: `Already true: ${hint}.`,
      fullRule,
    };
  }
  return out;
}

const flagBook = book([
  ["dg09.L1", "ring the cracked bell with the hammer", "Bell Cut opens east only after the cracked bell is rung with the hammer."],
  ["dg09.L2", "stand on the drowned mile in boots", "Shard Bridge opens only after Ellis stands on the drowned-mile plate in boots, mortal."],
  ["dg09.L3", "read the orchard gate stone", "Crown Cut opens only after the orchard gate stone is read."],
  ["dg09.L4", "light the coach lantern", "The last milepost opens only after the coach lantern is lit with the lamp."],
  ["dg09.A1", "step the three center stones in order", "The east road leaves the fold only after the three center stones are stepped in painted order."],
  ["dg09.A2", "seat the block and hammer the bridge pin", "The void span becomes a bridge only after the block is seated and the pin is hammered."],
  ["dg09.A3", "light the turnout coach lamp and leave it burning", "The culvert opens only after the turnout lamp is lit and left burning. The lamp tool is not consumed."],
  ["dg09.A4", "couple the loose wheel", "The coach yard opens north only after the loose wheel is coupled with the hammer."],
  ["dg09.hounds", "stop both marble hounds", "The lantern room's west road opens after both marble hounds are stopped. The culvert is the other way in."],
  ["dg09.keg", "a powder keg opens the yard wall", "Powder at the yard wall opens a return to the center stones."],
  ["dg09.block_seated", "the counterweight block must sit in the socket", "Hammering the pin before the block is seated does nothing permanent."],
  ["dg09.codex", "the cellar drawer lists every rule", "The toll cellar drawer, pulled with the sugar-line, prints every road rule on the mileposts."],
  ["dg09.cleared", "the coachman must be beaten", "The county road opens only after the Last Coachman is beaten. The token is granted once."],
  ["dg09.glass", "a shard of homestead glass sits in the gallery", "The gallery shard can be taken any time after the gallery is entered."],
  ["dg09.satchel", "a satchel waits in the fold", "The fold's satchel is optional and does not gate the road."],
  ["dg09.spur", "the spur of fourteen years can be dug", "North of the drowned mile, the shovel uncovers a marble year-mark. It is not a key."],
  ["dg09.overlook", "the high bank wants the cape", "High Bank's viewpoint is a cape gust, not a god-flight."],
  ["dg09.chip", "a marble chip remains after the hounds", "The hound chip is optional and stays if you pass by the culvert."],
  ["dg09.reins", "loose reins can be hung in the yard", "Loose reins return to their cradle if a crossing kills Ellis. They are not the boss lock."],
]);

const tools = ["shovel", "sugar-line", "boots", "fins", "lamp", "hammer", "net", "homestead-glass", "cape", "block-rod", "bow", "powder"];

function mile(id, tile, revealsFlags, alwaysText = "") {
  return {
    id,
    kind: "milepost",
    tile,
    glyph: "*",
    revealsFlags,
    codexAware: true,
    alwaysText,
    persistent: true,
  };
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
    layers: {
      terrain: applyWalls(spec.id, spec.terrain),
      objects: objects(spec.paints, spec.id),
    },
    conditionalTerrain: spec.conditionalTerrain || [],
    stepFlags: spec.stepFlags || [],
    connections: spec.connections,
    actors: spec.actors || [],
    interactions: spec.interactions,
    puzzles: spec.puzzles || [],
    persistentState: spec.persistentState || ["flags", "witnessed-landmarks", "collected-rewards"],
    resetState: spec.resetState || ["enemy-positions", "hazards"],
    localProof: spec.localProof,
    failureAndRecovery: spec.failureAndRecovery,
  };
}

const t = chamber();
const road = (extra, label) => stamp(t, extra, label);

const R01 = room({
  id: "DG09-R01",
  name: "Tollhouse Threshold",
  summary: "The cutoff's tollhouse, where mileposts admit the road will not open an unremembered exit.",
  classification: "main",
  map: { c: 0, r: 2 },
  setsLantern: true,
  lanternTile: [3, 6],
  terrain: road([
    [10, 3, "#"], [11, 3, "#"], [12, 3, "#"], [13, 3, "#"],
    [10, 4, "#"], [13, 4, "#"],
    [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","],
  ], "R01"),
  paints: [[4, 3, "*"], [9, 1, "N"], [16, 6, "E"], [15, 9, "^"], [3, 6, "@"]],
  connections: [
    link("east", [16, 6], "DG09-R02", [2, 6]),
    link("north", [9, 1], "DG09-R05", [9, 10]),
    link("down", [15, 9], "DG09-R18", [9, 2]),
  ],
  actors: [{ id: "toll-memory", name: "Unpaid Toll Shadow", tile: [12, 4], kind: "memory", resets: "never" }],
  interactions: [
    mile("mile-r01", [4, 3], ["dg09.L1", "dg09.L2", "dg09.L3", "dg09.L4", "dg09.A1"], "This road refuses tomorrow. Exits open from remembered landmarks and acts, never from a compass."),
  ],
  persistentState: ["flags", "witnessed-landmarks"],
  resetState: ["enemy-positions", "hazards"],
  localProof: {
    place: { room: "DG09-R01", tile: [3, 6] },
    steps: [mv(4, 3), ix("mile-r01"), mv(9, 1), ex("north")],
    expect: { room: "DG09-R05", textIncludes: "ring the cracked bell with the hammer" },
  },
  failureAndRecovery: [{
    name: "leave-without-standing-on-the-door",
    place: { room: "DG09-R01", tile: [3, 6] },
    steps: [ex("north")],
    expectError: "NOT_ON_EXIT",
    recovery: [mv(9, 1), ex("north")],
    expect: { room: "DG09-R05" },
  }],
});

const R02 = room({
  id: "DG09-R02",
  name: "Three Center Stones",
  summary: "A straight cutoff whose east exit is the fold until three stones are stepped in order.",
  classification: "main",
  map: { c: 1, r: 2 },
  terrain: road([
    [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","],
    [6, 4, ","], [8, 4, ","], [10, 4, ","],
  ], "R02"),
  paints: [[6, 4, "1"], [8, 4, "2"], [10, 4, "3"], [4, 8, "*"], [1, 6, "W"], [16, 6, "E"], [9, 10, "S"], [14, 1, "K"]],
  connections: [
    link("west", [1, 6], "DG09-R01", [15, 6]),
    link("east", [16, 6], "DG09-R04", [2, 6], {
      when: { all: ["dg09.A1"] },
      elseTo: "DG09-R03",
      elseArrival: [2, 6],
      closedText: "The stones have not been read, so the road folds into yesterday.",
    }),
    link("south", [9, 10], "DG09-R03", [9, 2]),
    link("gap", [14, 1], "DG09-R14", [14, 9], { when: { all: ["dg09.keg"] }, closedText: "The wall remembers powder that has not burned." }),
  ],
  interactions: [
    mile("mile-r02", [4, 8], ["dg09.A1", "dg09.keg"]),
    flagInteract({ id: "stone-1", kind: "sequence", sequence: "stones", tile: [6, 4], glyph: "1", successText: "The first stone accepts today.", failText: { already: "The stones already agreed.", form: "A god that has not walked does not move this road." } }),
    flagInteract({ id: "stone-2", kind: "sequence", sequence: "stones", tile: [8, 4], glyph: "2", successText: "The second stone accepts today.", failText: { form: "A god that has not walked does not move this road." } }),
    flagInteract({ id: "stone-3", kind: "sequence", sequence: "stones", tile: [10, 4], glyph: "3", successText: "The third stone opens tomorrow's east.", failText: { form: "A god that has not walked does not move this road." } }),
  ],
  puzzles: [{
    id: "stones",
    kind: "sequence",
    steps: ["stone-1", "stone-2", "stone-3"],
    sets: ["dg09.A1"],
    persistent: true,
    resetsOnWrong: true,
    failText: "The road refuses a future step.",
  }],
  persistentState: ["flags", "witnessed-landmarks"],
  resetState: ["sequence-if-incomplete", "hazards"],
  localProof: {
    place: { room: "DG09-R02", tile: [2, 6] },
    steps: [mv(4, 8), ix("mile-r02"), mv(6, 4), ix("stone-1"), mv(8, 4), ix("stone-2"), mv(10, 4), ix("stone-3"), mv(16, 6), ex("east")],
    expect: { flags: ["dg09.A1"], room: "DG09-R04" },
  },
  failureAndRecovery: [{
    name: "stones-out-of-order",
    place: { room: "DG09-R02", tile: [10, 4] },
    steps: [ix("stone-3"), { op: "assert", code: "flag", flag: "dg09.A1", value: false }, { op: "assert", code: "text-includes", text: "The road refuses a future step." }],
    recovery: [mv(6, 4), ix("stone-1"), mv(8, 4), ix("stone-2"), mv(10, 4), ix("stone-3")],
    expect: { flags: ["dg09.A1"] },
  }],
});

const R03 = room({
  id: "DG09-R03",
  name: "Fold of Yesterday",
  summary: "The same cutoff, one refusal old. North always returns to the stones. Nothing here is consumed.",
  classification: "main",
  map: { c: 1, r: 3 },
  terrain: road([[5, 6, ","], [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [9, 5, ","], [9, 4, ","], [9, 3, ","], [9, 2, ","]], "R03"),
  paints: [[12, 3, "*"], [5, 7, "S"], [9, 1, "N"]],
  connections: [link("north", [9, 1], "DG09-R02", [9, 9])],
  interactions: [
    mile("mile-r03", [12, 3], ["dg09.A1"], "You are in yesterday because the center stones were refused. North returns. The satchel is optional."),
    flagInteract({ id: "take-satchel", tile: [5, 7], glyph: "S", sets: ["dg09.satchel"], grantItem: "lost-satchel", successText: "A satchel of route scraps. Not a key." }),
  ],
  persistentState: ["collected-rewards", "flags"],
  resetState: ["hazards"],
  localProof: {
    place: { room: "DG09-R03", tile: [2, 6] },
    steps: [mv(12, 3), ix("mile-r03"), mv(5, 7), ix("take-satchel"), mv(9, 1), ex("north")],
    expect: { room: "DG09-R02", items: { "lost-satchel": 1 } },
  },
  failureAndRecovery: [{
    name: "wall-is-not-a-secret-exit",
    place: { room: "DG09-R03", tile: [2, 6] },
    steps: [mv(0, 6)],
    expectError: "NO_PATH",
    recovery: [mv(9, 1), ex("north")],
    expect: { room: "DG09-R02" },
  }],
});

const R04 = room({
  id: "DG09-R04",
  name: "Drowned Mile",
  summary: "A walked mile in the Otter Slide flood, remembered only if mortal boots stand on the plate.",
  classification: "main",
  map: { c: 2, r: 2 },
  terrain: road([
    [4, 5, "~"], [5, 5, "~"], [6, 5, "~"], [7, 5, "~"], [8, 5, "~"], [9, 5, "~"], [10, 5, "~"], [11, 5, "~"], [12, 5, "~"], [13, 5, "~"], [14, 5, "~"],
    [4, 7, "~"], [5, 7, "~"], [6, 7, "~"], [7, 7, "~"], [8, 7, "~"], [9, 7, "~"], [10, 7, "~"], [11, 7, "~"], [12, 7, "~"], [13, 7, "~"], [14, 7, "~"],
    [4, 6, ","], [5, 6, ","], [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","],
  ], "R04"),
  paints: [[3, 3, "*"], [14, 6, "*"], [1, 6, "W"], [16, 6, "E"], [9, 1, "N"]],
  connections: [
    link("west", [1, 6], "DG09-R02", [15, 6]),
    link("east", [16, 6], "DG09-R06", [2, 6], { when: { all: ["dg09.L2"] }, closedText: "The mile is not remembered yet." }),
    link("north", [9, 1], "DG09-R16", [9, 10]),
  ],
  interactions: [
    mile("mile-r04", [3, 3], ["dg09.L2"], "Water on either side is real. God-light does not count as weight. Fins are not the memory."),
    flagInteract({
      id: "plate-mile",
      tile: [14, 6],
      glyph: "*",
      requiresTools: ["boots"],
      sets: ["dg09.L2"],
      successText: "Fourteen years under the water. The mile is remembered.",
      failText: { form: "Only a walked mile is remembered.", tool: "The mile remembers weight. Ellis needs the boots." },
    }),
  ],
  persistentState: ["flags", "witnessed-landmarks"],
  resetState: ["hazards"],
  localProof: {
    place: { room: "DG09-R04", tile: [2, 6] },
    steps: [mv(3, 3), ix("mile-r04"), mv(14, 6), ix("plate-mile"), mv(16, 6), ex("east")],
    expect: { flags: ["dg09.L2"], room: "DG09-R06" },
  },
  failureAndRecovery: [{
    name: "god-form-does-not-remember-the-mile",
    place: { room: "DG09-R04", tile: [14, 6], form: "god" },
    steps: [ix("plate-mile")],
    expectError: "FORM_REQUIRED",
    recovery: [{ op: "set-form", form: "mortal" }, ix("plate-mile")],
    expect: { flags: ["dg09.L2"], notFlags: ["dg09.cleared"] },
  }],
});

const R05 = room({
  id: "DG09-R05",
  name: "Bell Cut",
  summary: "The cracked toll bell. One hammer-blow on the wedge is the first landmark.",
  classification: "main",
  map: { c: 0, r: 1 },
  setsLantern: true,
  lanternTile: [4, 8],
  terrain: road([[8, 4, ","], [8, 5, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R05"),
  paints: [[8, 4, "H"], [4, 8, "*"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG09-R01", [9, 2]),
    link("east", [16, 6], "DG09-R07", [2, 6], { when: { all: ["dg09.L1"] }, closedText: "The bell has not been rung." }),
  ],
  actors: [{ id: "bell", name: "Cracked Toll Bell", tile: [8, 4], kind: "landmark", resets: "never" }],
  interactions: [
    mile("mile-r05", [4, 8], ["dg09.L1"]),
    flagInteract({ id: "bell", tile: [8, 4], glyph: "H", requiresTools: ["hammer"], sets: ["dg09.L1"], successText: "The bell rings once. The cut remembers it.", failText: { tool: "The wedge needs the hammer." } }),
  ],
  localProof: {
    place: { room: "DG09-R05", tile: [9, 10] },
    steps: [mv(8, 4), ix("bell"), mv(16, 6), ex("east")],
    expect: { flags: ["dg09.L1"], room: "DG09-R07" },
  },
  failureAndRecovery: [{
    name: "bell-without-hammer",
    place: { room: "DG09-R05", tile: [8, 4], tools: tools.filter((t) => t !== "hammer") },
    steps: [ix("bell")],
    expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "hammer" }, ix("bell")],
    expect: { flags: ["dg09.L1"] },
  }],
});

const voidTiles = [5, 6, 7, 8, 9, 10, 11, 12].map((x) => [x, 6, "V"]);
const R06 = room({
  id: "DG09-R06",
  name: "Shard Bridge",
  summary: "A void in the cutoff. Block and hammer make the span; god-flight does not.",
  classification: "main",
  map: { c: 3, r: 2 },
  terrain: road(voidTiles, "R06"),
  conditionalTerrain: [{ tiles: voidTiles.map(([x, y]) => [x, y]), requiresAll: ["dg09.A2"] }],
  paints: [[2, 3, "*"], [3, 8, "B"], [3, 4, "H"], [3, 9, "R"], [1, 6, "W"], [16, 6, "E"], [4, 6, "!"]],
  connections: [
    link("west", [1, 6], "DG09-R04", [15, 6]),
    link("east", [16, 6], "DG09-R08", [2, 6], {
      when: { all: ["dg09.A2"] },
      transitionSteps: 3,
      transitionId: "shard-cross",
      transitionText: "The new span rings under Ellis's boots.",
      closedText: "The span is still a void. Seat the block and hammer the pin.",
    }),
    link("god-skip-void", [4, 6], "DG09-R08", [2, 6], {
      when: { never: true },
      godTemptation: true,
      closedText: "The void does not accept a god that skipped the pin.",
    }),
  ],
  interactions: [
    mile("mile-r06", [2, 3], ["dg09.A2", "dg09.block_seated"], "Embryonic God does not inherit a bridge."),
    flagInteract({ id: "seat-block", tile: [3, 8], glyph: "B", requiresTools: ["block-rod"], sets: ["dg09.block_seated"], successText: "The counterweight sits in the socket." }),
    flagInteract({ id: "hammer-pin", tile: [3, 4], glyph: "H", requiresTools: ["hammer"], requiresFlags: ["dg09.block_seated"], sets: ["dg09.A2"], successText: "The pin bites. The void is a bridge.", failText: { flags: "The pin turns but the span has no counterweight." } }),
    flagInteract({ id: "pick-reins", kind: "pickup", object: "loose-reins", tile: [3, 9], glyph: "R", sets: [], once: false, successText: "Loose reins. Optional. They go home if a crossing kills you." }),
  ],
  puzzles: [{ id: "bridge", kind: "ordered-flags", steps: ["seat-block", "hammer-pin"], sets: ["dg09.A2"], persistent: true }],
  persistentState: ["flags", "blown-shortcuts"],
  resetState: ["hazards", "carried-object-on-transition-death"],
  localProof: {
    place: { room: "DG09-R06", tile: [2, 6] },
    steps: [mv(3, 8), ix("seat-block"), mv(3, 4), ix("hammer-pin"), mv(16, 6), ex("east"), ...ticks(3)],
    expect: { flags: ["dg09.A2", "dg09.block_seated"], room: "DG09-R08" },
  },
  failureAndRecovery: [{
    name: "hammer-before-block",
    place: { room: "DG09-R06", tile: [3, 4] },
    steps: [ix("hammer-pin")],
    expectError: "FLAG_MISSING",
    recovery: [mv(3, 8), ix("seat-block"), mv(3, 4), ix("hammer-pin")],
    expect: { flags: ["dg09.A2"] },
  }],
});

const R07 = room({
  id: "DG09-R07",
  name: "Switchback Gallery",
  summary: "Optional gallery above the cut. A homestead-glass shard, and a door back to the orchard once the bridge exists.",
  classification: "optional",
  map: { c: 1, r: 1 },
  terrain: road([[4, 6, ","], [5, 6, ","], [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","]], "R07"),
  paints: [[4, 3, "*"], [12, 5, "g"], [1, 6, "W"], [9, 1, "N"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG09-R05", [15, 6]),
    link("north", [9, 1], "DG09-R08", [9, 9], { when: { all: ["dg09.A2", "dg09.L1"] }, closedText: "The gallery join waits on the bridge and the bell." }),
    link("east", [16, 6], "DG09-R17", [2, 6]),
  ],
  interactions: [
    mile("mile-r07", [4, 3], ["dg09.A2", "dg09.L1"], "The shard is optional. East is the high bank."),
    flagInteract({ id: "take-glass", tile: [12, 5], glyph: "g", sets: ["dg09.glass"], grantItem: "glass-shard", successText: "Homestead glass, already broken into a shard. Optional." }),
  ],
  localProof: {
    place: { room: "DG09-R07", tile: [2, 6], flags: ["dg09.A2", "dg09.L1"] },
    steps: [mv(12, 5), ix("take-glass"), mv(9, 1), ex("north")],
    expect: { items: { "glass-shard": 1 }, room: "DG09-R08" },
  },
  failureAndRecovery: [{
    name: "gallery-join-shut-without-bridge",
    place: { room: "DG09-R07", tile: [9, 1], flags: ["dg09.L1"] },
    steps: [ex("north")],
    expectError: "EXIT_CLOSED",
    recovery: [mv(4, 3), ix("mile-r07"), mv(1, 6), ex("west")],
    expect: { room: "DG09-R05", textIncludes: "seat the block and hammer the bridge pin" },
  }],
});

const R08 = room({
  id: "DG09-R08",
  name: "Orchard Gate Stone",
  summary: "A stone cut with a road that was never built. Reading it is the third landmark.",
  classification: "main",
  map: { c: 4, r: 2 },
  terrain: road([[8, 5, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R08"),
  paints: [[4, 3, "*"], [8, 5, "*"], [1, 6, "W"], [6, 10, "S"], [9, 1, "N"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG09-R06", [15, 6]),
    link("south", [6, 10], "DG09-R07", [9, 2]),
    link("north", [9, 1], "DG09-R09", [9, 10]),
    link("east", [16, 6], "DG09-R10", [2, 6], { when: { all: ["dg09.L3"] }, closedText: "The orchard stone has not been read." }),
  ],
  interactions: [
    mile("mile-r08", [4, 3], ["dg09.L3", "dg09.A3"], "North is the unbuilt turnout, a combat skip, not a memory skip."),
    flagInteract({ id: "orchard-stone", tile: [8, 5], glyph: "*", sets: ["dg09.L3"], successText: "The stone shows a road that was never built. It is remembered." }),
  ],
  localProof: {
    place: { room: "DG09-R08", tile: [2, 6] },
    steps: [mv(8, 5), ix("orchard-stone"), mv(16, 6), ex("east")],
    expect: { flags: ["dg09.L3"], room: "DG09-R10" },
  },
  failureAndRecovery: [{
    name: "crown-cut-before-the-stone",
    place: { room: "DG09-R08", tile: [16, 6] },
    steps: [ex("east")],
    expectError: "EXIT_CLOSED",
    recovery: [mv(8, 5), ix("orchard-stone"), mv(16, 6), ex("east")],
    expect: { flags: ["dg09.L3"], room: "DG09-R10" },
  }],
});

const R09 = room({
  id: "DG09-R09",
  name: "Unbuilt Turnout",
  summary: "Optional shortcut mouth. Light the turnout lamp and leave it; the tool-lamp stays with Ellis.",
  classification: "optional",
  map: { c: 4, r: 3 },
  terrain: road([[8, 5, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R09"),
  paints: [[4, 3, "*"], [8, 5, "L"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG09-R08", [9, 2]),
    link("east", [16, 6], "DG09-R12", [2, 6], { when: { all: ["dg09.A3"] }, closedText: "The turnout lamp is dark, so the culvert stays shut." }),
  ],
  interactions: [
    mile("mile-r09", [4, 3], ["dg09.A3"]),
    flagInteract({ id: "turnout-lamp", tile: [8, 5], glyph: "L", requiresTools: ["lamp"], sets: ["dg09.A3"], successText: "The turnout lamp burns on its own. Ellis keeps the lamp tool." }),
  ],
  localProof: {
    place: { room: "DG09-R09", tile: [9, 10] },
    steps: [mv(8, 5), ix("turnout-lamp"), mv(16, 6), ex("east")],
    expect: { flags: ["dg09.A3"], room: "DG09-R12" },
  },
  failureAndRecovery: [{
    name: "culvert-before-lamp",
    place: { room: "DG09-R09", tile: [16, 6] },
    steps: [ex("east")],
    expectError: "EXIT_CLOSED",
    recovery: [mv(8, 5), ix("turnout-lamp"), mv(16, 6), ex("east")],
    expect: { flags: ["dg09.A3"], room: "DG09-R12" },
  }],
});

const houndFight = [
  { op: "miniboss", action: "begin" },
  mv(8, 6),
  { op: "miniboss", action: "shoot-chest", tool: "bow" },
  mv(10, 6),
  { op: "miniboss", action: "shoot-chest", tool: "bow" },
];

const R10 = room({
  id: "DG09-R10",
  name: "Crown Cut",
  summary: "Miniboss chamber of two marble hounds. Each chest is a mark on the cut. West always flees. East opens only after both fall.",
  classification: "main",
  map: { c: 5, r: 2 },
  terrain: road([[8, 6, ","], [9, 6, ","], [10, 6, ","]], "R10"),
  paints: [[4, 2, "*"], [8, 8, "c"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG09-R08", [15, 6]),
    link("east", [16, 6], "DG09-R11", [2, 6], { when: { all: ["dg09.hounds"] }, closedText: "Both marble hounds are still on the cut." }),
  ],
  actors: [
    { id: "hound-a", name: "Marble Hound", tile: [8, 5], kind: "miniboss-body", resets: "on-death-if-not-defeated" },
    { id: "hound-b", name: "Marble Hound", tile: [10, 5], kind: "miniboss-body", resets: "on-death-if-not-defeated" },
  ],
  interactions: [
    mile("mile-r10", [4, 2], ["dg09.hounds"], "Shoot each marble chest while it recovers. The culvert around the north turnout skips this fight and not the lantern."),
    flagInteract({ id: "take-chip", tile: [8, 8], glyph: "c", requiresFlags: ["dg09.hounds"], sets: ["dg09.chip"], grantItem: "hound-chip", successText: "A marble chip. Optional." }),
  ],
  persistentState: ["miniboss-defeat", "flags", "collected-rewards"],
  resetState: ["boss-phase-if-not-defeated", "enemy-positions"],
  localProof: {
    place: { room: "DG09-R10", tile: [2, 6] },
    steps: [...houndFight, mv(16, 6), ex("east")],
    expect: { flags: ["dg09.hounds"], room: "DG09-R11" },
  },
  failureAndRecovery: [{
    name: "hounds-without-the-bow",
    place: { room: "DG09-R10", tile: [8, 6], tools: tools.filter((t) => t !== "bow") },
    steps: [{ op: "miniboss", action: "begin" }, { op: "miniboss", action: "shoot-chest" }],
    expectError: "TOOL_REQUIRED",
    recovery: [
      { op: "grant-tool", tool: "bow" },
      mv(8, 6),
      { op: "miniboss", action: "shoot-chest", tool: "bow" },
      mv(10, 6),
      { op: "miniboss", action: "shoot-chest", tool: "bow" },
    ],
    expect: { flags: ["dg09.hounds"] },
  }],
});

const R11 = room({
  id: "DG09-R11",
  name: "Coach Lantern",
  summary: "The last lit coach lamp of the cutoff. Lighting it is the fourth landmark.",
  classification: "main",
  map: { c: 6, r: 2 },
  setsLantern: true,
  lanternTile: [3, 6],
  terrain: road([[8, 4, ","], [8, 5, ","], [8, 6, ","], [9, 5, ","], [9, 4, ","], [9, 3, ","], [9, 2, ","]], "R11"),
  paints: [[8, 4, "L"], [4, 8, "*"], [1, 6, "W"], [9, 10, "S"], [9, 1, "N"]],
  connections: [
    link("west", [1, 6], "DG09-R10", [15, 6], { when: { all: ["dg09.hounds"] }, closedText: "The hounds still hold the west road. Use the culvert to leave south." }),
    link("south", [9, 10], "DG09-R12", [9, 2]),
    link("north", [9, 1], "DG09-R13", [9, 10], { when: { all: ["dg09.L4"] }, closedText: "The coach lantern is dark." }),
  ],
  interactions: [
    mile("mile-r11", [4, 8], ["dg09.L4"]),
    flagInteract({ id: "coach-lantern", tile: [8, 4], glyph: "L", requiresTools: ["lamp"], sets: ["dg09.L4"], successText: "The coach lantern stays lit. The tool remains." }),
  ],
  localProof: {
    place: { room: "DG09-R11", tile: [2, 6], flags: ["dg09.hounds"] },
    steps: [mv(8, 4), ix("coach-lantern"), mv(9, 1), ex("north")],
    expect: { flags: ["dg09.L4"], room: "DG09-R13" },
  },
  failureAndRecovery: [{
    name: "milepost-before-lantern",
    place: { room: "DG09-R11", tile: [9, 1], flags: ["dg09.hounds"] },
    steps: [ex("north")],
    expectError: "EXIT_CLOSED",
    recovery: [mv(8, 4), ix("coach-lantern"), mv(9, 1), ex("north")],
    expect: { flags: ["dg09.L4"], room: "DG09-R13" },
  }],
});

const R12 = room({
  id: "DG09-R12",
  name: "Shortcut Culvert",
  summary: "Marble glow, not the lamp tool, lights this skip around the hounds. The lantern is still ahead.",
  classification: "optional",
  map: { c: 5, r: 3 },
  terrain: road([[4, 6, ","], [5, 6, ","], [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [9, 5, ","], [9, 4, ","], [9, 3, ","], [9, 2, ","]], "R12"),
  paints: [[4, 3, "*"], [1, 6, "W"], [9, 1, "N"]],
  connections: [
    link("west", [1, 6], "DG09-R09", [15, 6], { when: { all: ["dg09.A3"] }, closedText: "The turnout lamp is out." }),
    link("north", [9, 1], "DG09-R11", [9, 9]),
  ],
  interactions: [
    mile("mile-r12", [4, 3], ["dg09.A3"], "Marble glow lights the culvert. The lamp tool stays in hand. North is the coach lantern, which this shortcut does not skip."),
  ],
  localProof: {
    place: { room: "DG09-R12", tile: [2, 6], flags: ["dg09.A3"] },
    steps: [mv(4, 3), ix("mile-r12"), mv(9, 1), ex("north")],
    expect: { room: "DG09-R11", textIncludes: "Marble glow" },
  },
  failureAndRecovery: [{
    name: "culvert-wall",
    place: { room: "DG09-R12", tile: [2, 6], flags: ["dg09.A3"] },
    steps: [mv(0, 1)],
    expectError: "NO_PATH",
    recovery: [mv(9, 1), ex("north")],
    expect: { room: "DG09-R11" },
  }],
});

const R13 = room({
  id: "DG09-R13",
  name: "Last Milepost",
  summary: "The four landmarks are checked in writing on one post. Missing any one, the yard stays shut.",
  classification: "main",
  map: { c: 7, r: 2 },
  terrain: road([[4, 6, ","], [5, 6, ","], [6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [13, 6, ","], [14, 6, ","], [15, 6, ","]], "R13"),
  paints: [[4, 4, "*"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG09-R11", [9, 2]),
    link("east", [16, 6], "DG09-R14", [2, 6], {
      when: { all: ["dg09.L1", "dg09.L2", "dg09.L3", "dg09.L4"] },
      closedText: "A landmark is still missing. The post names it.",
    }),
  ],
  interactions: [mile("mile-r13", [4, 4], ["dg09.L1", "dg09.L2", "dg09.L3", "dg09.L4"])],
  localProof: {
    place: { room: "DG09-R13", tile: [9, 10], flags: ["dg09.L1", "dg09.L2", "dg09.L3", "dg09.L4"] },
    steps: [mv(4, 4), ix("mile-r13"), mv(16, 6), ex("east")],
    expect: { room: "DG09-R14" },
  },
  failureAndRecovery: [{
    name: "yard-missing-the-drowned-mile",
    place: { room: "DG09-R13", tile: [16, 6], flags: ["dg09.L1", "dg09.L3", "dg09.L4"] },
    steps: [ex("east")],
    expectError: "EXIT_CLOSED",
    recovery: [mv(4, 4), ix("mile-r13")],
    expect: { room: "DG09-R13", textIncludes: "stand on the drowned mile in boots", notFlags: ["dg09.cleared"] },
  }],
});

const R14 = room({
  id: "DG09-R14",
  name: "Coach Yard",
  summary: "Couple the loose wheel to face the coachman. Powder here is a return tunnel, not a toll.",
  classification: "main",
  map: { c: 8, r: 2 },
  setsLantern: true,
  lanternTile: [9, 3],
  terrain: road([[7, 6, ","], [8, 6, ","], [9, 6, ","], [10, 6, ","], [11, 6, ","], [12, 6, ","], [12, 7, ","], [12, 8, ","]], "R14"),
  paints: [[3, 3, "*"], [7, 6, "W"], [12, 8, "K"], [5, 8, "k"], [1, 6, "w"], [9, 1, "N"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG09-R13", [15, 6]),
    link("north", [9, 1], "DG09-R15", [9, 10], { when: { all: ["dg09.A4"] }, closedText: "The loose wheel is still on the ground." }),
    link("gap", [16, 6], "DG09-R02", [14, 2], { when: { all: ["dg09.keg"] }, closedText: "The yard wall is cracked, not open." }),
  ],
  interactions: [
    mile("mile-r14", [3, 3], ["dg09.A4", "dg09.keg"]),
    flagInteract({ id: "couple-wheel", tile: [7, 6], glyph: "W", requiresTools: ["hammer"], sets: ["dg09.A4"], successText: "The wheel is coupled." }),
    flagInteract({ id: "ignite-keg", tile: [12, 8], glyph: "K", requiresTools: ["powder"], sets: ["dg09.keg"], grantItem: "cutoff-ash", successText: "The wall opens back to the center stones." }),
    flagInteract({
      id: "hang-reins",
      kind: "hook",
      object: "loose-reins",
      tile: [5, 8],
      glyph: "k",
      sets: ["dg09.reins"],
      grantItem: "rein-ribbon",
      once: false,
      successText: "The reins hang where the coachman can see them. Optional.",
      failText: { wrong: "The hook wants the loose reins, not a fee." },
    }),
  ],
  localProof: {
    place: { room: "DG09-R14", tile: [2, 6], flags: ["dg09.L1", "dg09.L2", "dg09.L3", "dg09.L4"] },
    steps: [mv(7, 6), ix("couple-wheel"), mv(9, 1), ex("north")],
    expect: { flags: ["dg09.A4"], room: "DG09-R15" },
  },
  failureAndRecovery: [{
    name: "boss-door-before-the-wheel",
    place: { room: "DG09-R14", tile: [9, 1], flags: ["dg09.L1", "dg09.L2", "dg09.L3", "dg09.L4"] },
    steps: [ex("north")],
    expectError: "EXIT_CLOSED",
    recovery: [mv(7, 6), ix("couple-wheel"), mv(9, 1), ex("north")],
    expect: { flags: ["dg09.A4"], room: "DG09-R15" },
  }],
});

const bossFight = [
  { op: "boss", action: "begin" },
  mv(6, 6),
  { op: "boss", action: "light-lantern" },
  mv(8, 6),
  { op: "boss", action: "light-lantern" },
  mv(10, 6),
  { op: "boss", action: "light-lantern" },
  mv(12, 6),
  { op: "boss", action: "light-lantern" },
  mv(9, 6),
  { op: "boss", action: "strike", tool: "bow", tag: "boss-mid" },
  { op: "boss", action: "snag" },
  mv(8, 8),
  { op: "boss", action: "socket" },
  mv(10, 8),
  { op: "boss", action: "socket" },
  mv(9, 6),
  { op: "boss", action: "strike", tool: "hammer" },
];

const R15 = room({
  id: "DG09-R15",
  name: "The Last Coachman",
  summary: "Arena of the Last Coachman. Four lantern marks, then the reins, then two socket posts. God-light does not count.",
  classification: "main",
  map: { c: 9, r: 2 },
  terrain: road([[8, 6, ","], [9, 6, ","], [10, 6, ","], [9, 7, ","], [9, 8, ","], [9, 9, ","]], "R15"),
  paints: [[4, 2, "*"], [6, 5, "L"], [8, 5, "L"], [10, 5, "L"], [12, 5, "L"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG09-R14", [9, 2]),
    link("east", [16, 6], "COUNTY:ADDISON-EAST", [0, 0], { when: { all: ["dg09.cleared"] }, closedText: "The county road stays shut until the coachman is beaten." }),
  ],
  actors: [{ id: "coachman", name: "The Last Coachman", tile: [9, 5], kind: "boss", resets: "on-death-if-not-defeated" }],
  interactions: [
    mile("mile-r15", [4, 2], ["dg09.cleared"], "Light all four coach lanterns with the lamp. Snag the reins with the sugar-line. Socket two posts with the block rod. Strike the openings. God-light is refused."),
  ],
  persistentState: ["collected-rewards", "flags", "miniboss-defeat"],
  resetState: ["boss-phase-if-not-defeated", "enemy-positions"],
  localProof: {
    place: { room: "DG09-R15", tile: [9, 10], flags: ["dg09.A4", "dg09.L1", "dg09.L2", "dg09.L3", "dg09.L4"] },
    steps: [...bossFight, { op: "assert", code: "item-count", item: "coach-token", count: 1 }],
    expect: { flags: ["dg09.cleared"], items: { "coach-token": 1 }, phase: "DEFEATED" },
  },
  failureAndRecovery: [{
    name: "god-light-does-not-keep-the-lanterns",
    place: { room: "DG09-R15", tile: [9, 6], form: "god", flags: ["dg09.A4"] },
    steps: [{ op: "boss", action: "begin" }, { op: "boss", action: "light-lantern" }],
    expectError: "GOD_SEALED",
    recovery: [{ op: "set-form", form: "mortal" }, ...bossFight],
    expect: { items: { "coach-token": 1 }, flags: ["dg09.cleared"] },
  }],
});

const R16 = room({
  id: "DG09-R16",
  name: "Spur of Fourteen Years",
  summary: "Optional dig north of the drowned mile. A year-mark, not a key.",
  classification: "optional",
  map: { c: 2, r: 0 },
  terrain: road([[8, 6, "S"], [8, 7, ","], [9, 7, ","], [9, 8, ","], [9, 9, ","]], "R16"),
  paints: [[4, 3, "*"], [8, 6, "S"], [9, 10, "s"]],
  connections: [link("south", [9, 10], "DG09-R04", [9, 2])],
  interactions: [
    mile("mile-r16", [4, 3], ["dg09.spur"], "The shovel takes a marble year-mark. The yard does not check it."),
    flagInteract({ id: "dig-spur", tile: [8, 6], glyph: "S", requiresTools: ["shovel"], sets: ["dg09.spur"], grantItem: "fourteen-marble", successText: "A marble marked with the fourteen years Ellis lost." }),
  ],
  localProof: {
    place: { room: "DG09-R16", tile: [9, 10] },
    steps: [mv(8, 6), ix("dig-spur")],
    expect: { items: { "fourteen-marble": 1 }, flags: ["dg09.spur"] },
  },
  failureAndRecovery: [{
    name: "dig-without-shovel",
    place: { room: "DG09-R16", tile: [8, 6], tools: tools.filter((t) => t !== "shovel") },
    steps: [ix("dig-spur")],
    expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "shovel" }, ix("dig-spur")],
    expect: { items: { "fourteen-marble": 1 } },
  }],
});

const R17 = room({
  id: "DG09-R17",
  name: "High Bank",
  summary: "Optional cape gust over a void bank. God-form cannot take the cape's path.",
  classification: "optional",
  map: { c: 2, r: 1 },
  terrain: road([
    ...[1, 2, 3, 4, 5, 7, 8, 9, 10].flatMap((y) => [[7, y, "#"], [12, y, "#"]]),
    [8, 6, "G"], [9, 6, "G"], [10, 6, "G"], [11, 6, "G"],
  ], "R17"),
  paints: [[3, 3, "*"], [14, 6, "g"], [1, 6, "W"]],
  connections: [link("west", [1, 6], "DG09-R07", [15, 6])],
  interactions: [
    mile("mile-r17", [3, 3], [], "The gust path takes the cape. Embryonic God does not wear it."),
    flagInteract({ id: "overlook", tile: [14, 6], glyph: "g", requiresTools: ["cape"], sets: ["dg09.overlook"], grantItem: "overlook-sketch", successText: "A sketch of the cutoff from the bank. Optional." }),
  ],
  localProof: {
    place: { room: "DG09-R17", tile: [2, 6] },
    steps: [mv(3, 3), ix("mile-r17"), mv(14, 6), ix("overlook")],
    expect: { items: { "overlook-sketch": 1 } },
  },
  failureAndRecovery: [{
    name: "bank-without-cape-or-as-god",
    place: { room: "DG09-R17", tile: [2, 6], tools: tools.filter((t) => t !== "cape"), form: "god" },
    steps: [mv(14, 6)],
    expectError: "NO_PATH",
    recovery: [{ op: "set-form", form: "mortal" }, { op: "grant-tool", tool: "cape" }, mv(14, 6), ix("overlook")],
    expect: { items: { "overlook-sketch": 1 } },
  }],
});

const R18 = room({
  id: "DG09-R18",
  name: "Toll Cellar",
  summary: "Optional codex. The sugar-line pulls a drawer that writes every exit rule onto the mileposts.",
  classification: "optional",
  map: { c: 0, r: 3 },
  terrain: road([[6, 6, ","], [7, 6, ","], [8, 6, ","], [9, 6, ","]], "R18"),
  paints: [[3, 4, "*"], [6, 6, "D"], [9, 1, "^"]],
  connections: [link("up", [9, 1], "DG09-R01", [15, 8])],
  interactions: [
    mile("mile-r18", [3, 4], ["dg09.codex"], "The drawer is jammed with coach tickets from a year that did not happen."),
    flagInteract({
      id: "read-codex",
      tile: [6, 6],
      glyph: "D",
      requiresTools: ["sugar-line"],
      sets: ["dg09.codex"],
      grantItem: "cellar-codex",
      successText: "Every road rule is legible now.",
      failText: { tool: "The drawer is jammed with coach tickets from a year that did not happen." },
    }),
  ],
  localProof: {
    place: { room: "DG09-R18", tile: [9, 2] },
    steps: [mv(6, 6), ix("read-codex")],
    expect: { flags: ["dg09.codex"], items: { "cellar-codex": 1 } },
  },
  failureAndRecovery: [{
    name: "drawer-jammed",
    place: { room: "DG09-R18", tile: [6, 6], tools: tools.filter((t) => t !== "sugar-line") },
    steps: [ix("read-codex")],
    expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "sugar-line" }, ix("read-codex")],
    expect: { flags: ["dg09.codex"] },
  }],
});

const rooms = [R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16, R17, R18];

const toR02 = [mv(16, 6), ex("east")];
const toStones = [mv(6, 4), ix("stone-1"), mv(8, 4), ix("stone-2"), mv(10, 4), ix("stone-3")];
const throughMile = [
  mv(16, 6), ex("east"),
  mv(14, 6), ix("plate-mile"),
  mv(16, 6), ex("east"),
  mv(3, 8), ix("seat-block"),
  mv(3, 4), ix("hammer-pin"),
  mv(16, 6), ex("east"),
  ...ticks(3),
  mv(8, 5), ix("orchard-stone"),
];
const fromLanternToBoss = [
  mv(8, 4), ix("coach-lantern"),
  mv(9, 1), ex("north"),
  mv(16, 6), ex("east"),
  mv(7, 6), ix("couple-wheel"),
  mv(9, 1), ex("north"),
  ...bossFight,
];

const prefix = [
  mv(4, 3), ix("mile-r01"),
  mv(9, 1), ex("north"),
  mv(8, 4), ix("bell"),
  mv(9, 10), ex("south"),
  ...toR02,
  ...toStones,
  ...throughMile,
];

const main = [
  ...prefix,
  mv(16, 6), ex("east"),
  ...houndFight,
  mv(16, 6), ex("east"),
  ...fromLanternToBoss,
  { op: "assert", code: "item-count", item: "coach-token", count: 1 },
  { op: "assert", code: "not-item", item: "glass-shard" },
  { op: "assert", code: "not-item", item: "hound-chip" },
  { op: "assert", code: "not-item", item: "lost-satchel" },
  { op: "assert", code: "flag", flag: "dg09.hounds", value: true },
  { op: "assert", code: "room", room: "DG09-R15" },
];

const shortcut = [
  ...prefix,
  mv(9, 1), ex("north"),
  mv(8, 5), ix("turnout-lamp"),
  mv(16, 6), ex("east"),
  mv(9, 1), ex("north"),
  ...fromLanternToBoss,
  { op: "assert", code: "flag", flag: "dg09.hounds", value: false },
  { op: "assert", code: "item", item: "coach-token" },
  { op: "assert", code: "flag", flag: "dg09.L4", value: true },
];

const foldLoop = [
  ...toR02,
  ...Array.from({ length: 6 }, () => [mv(16, 6), ex("east"), mv(9, 1), ex("north")]).flat(),
  ...toStones,
  mv(16, 6), ex("east"),
  { op: "assert", code: "room", room: "DG09-R04" },
  { op: "assert", code: "flag", flag: "dg09.A1", value: true },
  { op: "assert", code: "not-item", item: "coach-token" },
];

const backTo = {
  r10: [mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(9, 10), ex("south"), mv(1, 6), ex("west")],
  r08: [mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(1, 6), ex("west")],
  r06: [mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(1, 6), ex("west"), mv(1, 6), ex("west")],
  r04: [mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(1, 6), ex("west"), mv(1, 6), ex("west"), mv(1, 6), ex("west")],
};

const collect = {
  "glass-shard": [...backTo.r08, mv(6, 10), ex("south"), mv(12, 5), ix("take-glass"), { op: "assert", code: "item", item: "glass-shard" }],
  "hound-chip": [...backTo.r10, mv(8, 8), ix("take-chip"), { op: "assert", code: "item", item: "hound-chip" }],
  "lost-satchel": [...backTo.r04, mv(1, 6), ex("west"), mv(9, 10), ex("south"), mv(5, 7), ix("take-satchel"), { op: "assert", code: "item", item: "lost-satchel" }],
  "fourteen-marble": [...backTo.r04, mv(9, 1), ex("north"), mv(8, 6), ix("dig-spur"), { op: "assert", code: "item", item: "fourteen-marble" }],
  "overlook-sketch": [...backTo.r08, mv(6, 10), ex("south"), mv(16, 6), ex("east"), mv(14, 6), ix("overlook"), { op: "assert", code: "item", item: "overlook-sketch" }],
  "cellar-codex": [...backTo.r04, mv(1, 6), ex("west"), mv(1, 6), ex("west"), mv(15, 9), ex("down"), mv(6, 6), ix("read-codex"), { op: "assert", code: "item", item: "cellar-codex" }],
  "rein-ribbon": [
    ...backTo.r06,
    mv(3, 9), ix("pick-reins"),
    mv(16, 6), ex("east"), ...ticks(3),
    mv(16, 6), ex("east"),
    mv(16, 6), ex("east"),
    mv(9, 1), ex("north"),
    mv(16, 6), ex("east"),
    mv(5, 8), ix("hang-reins"),
    { op: "assert", code: "item", item: "rein-ribbon" },
    { op: "assert", code: "object-loc", id: "loose-reins", loc: "hooked" },
  ],
  "cutoff-ash": [mv(9, 10), ex("south"), mv(12, 8), ix("ignite-keg"), mv(16, 6), ex("gap"), { op: "assert", code: "room", room: "DG09-R02" }, { op: "assert", code: "item", item: "cutoff-ash" }],
};

const transitionSetup = [
  mv(9, 1), ex("north"),
  mv(8, 4), ix("bell"),
  mv(9, 10), ex("south"),
  ...toR02,
  ...toStones,
  mv(16, 6), ex("east"),
  mv(14, 6), ix("plate-mile"),
  mv(16, 6), ex("east"),
  mv(3, 8), ix("seat-block"),
  mv(3, 4), ix("hammer-pin"),
  mv(3, 9), ix("pick-reins"),
  mv(16, 6), ex("east"),
  tick(),
];

export const dungeon = {
  id: "DG09",
  name: "The Road That Refuses Tomorrow",
  bossName: "The Last Coachman",
  county: "Addison County, Vermont",
  site: "The unfinished Crown Point Cutoff above Otter Slide",
  protagonist: "Ellis Perch",
  tileSize: 16,
  widthTiles: 18,
  heightTiles: 12,
  maxHp: 6,
  startingTools: tools,
  codexFlag: "dg09.codex",
  entry: { room: "DG09-R01", tile: [3, 6] },
  flagBook,
  rooms,
  transportables: [
    { id: "loose-reins", home: { room: "DG09-R06", tile: [3, 9] }, returnHomeOnTransitionDeath: true, optional: true },
  ],
  moths: [],
  plots: [],
  ferry: null,
  debts: [],
  seasons: ["SPRING", "SUMMER", "AUTUMN", "WINTER", "BLACK_SNOW"],
  bannedWords: ["price", "gold", "coins", "shop", "interest", "vendor"],
  godForm: {
    water: "sealed",
    void: "sealed",
    gust: "sealed",
    note: "God-form does not inherit fins, cape, or mortal hands. Built bridges may be walked after a mortal builds them. Boss lanterns reject god-light.",
  },
  dependencyGraph: {
    nodes: ["ENTER", "dg09.L1", "dg09.A1", "dg09.L2", "dg09.A2", "dg09.L3", "dg09.hounds", "dg09.L4", "dg09.A4", "dg09.cleared"],
    edges: [
      { from: "ENTER", to: "dg09.L1" },
      { from: "dg09.L1", to: "dg09.A1" },
      { from: "dg09.A1", to: "dg09.L2" },
      { from: "dg09.L2", to: "dg09.A2" },
      { from: "dg09.A2", to: "dg09.L3" },
      { from: "dg09.L3", to: "dg09.hounds" },
      { from: "dg09.hounds", to: "dg09.L4" },
      { from: "dg09.L4", to: "dg09.A4" },
      { from: "dg09.L1", to: "dg09.A4" },
      { from: "dg09.L2", to: "dg09.A4" },
      { from: "dg09.L3", to: "dg09.A4" },
      { from: "dg09.A4", to: "dg09.cleared" },
    ],
  },
  shortcuts: [
    {
      id: "culvert",
      description: "Turnout lamp and marble culvert skip the Marble Hounds and do not skip the coach lantern.",
      skips: ["dg09.hounds"],
      stillRequires: ["dg09.L1", "dg09.L2", "dg09.L3", "dg09.L4", "dg09.A1", "dg09.A2", "dg09.A4"],
      route: "shortcut",
    },
    {
      id: "keg-return",
      description: "Powder in the coach yard opens a one-room return to the center stones.",
      skips: [],
      backtrack: true,
      route: "keg",
    },
  ],
  discoveries: [
    { id: "glass-shard", room: "DG09-R07", item: "glass-shard", interact: "take-glass", optional: true, missable: false },
    { id: "lost-satchel", room: "DG09-R03", item: "lost-satchel", interact: "take-satchel", optional: true, missable: false },
    { id: "fourteen-marble", room: "DG09-R16", item: "fourteen-marble", interact: "dig-spur", optional: true, missable: false },
    { id: "overlook-sketch", room: "DG09-R17", item: "overlook-sketch", interact: "overlook", optional: true, missable: false },
    { id: "cellar-codex", room: "DG09-R18", item: "cellar-codex", interact: "read-codex", optional: true, missable: false },
    { id: "hound-chip", room: "DG09-R10", item: "hound-chip", interact: "take-chip", optional: true, missable: false },
    { id: "rein-ribbon", room: "DG09-R14", item: "rein-ribbon", interact: "hang-reins", optional: true, missable: false },
    { id: "cutoff-ash", room: "DG09-R14", item: "cutoff-ash", interact: "ignite-keg", optional: true, missable: false },
  ],
  intentionalCycles: [
    { id: "yesterday-fold", rooms: ["DG09-R02", "DG09-R03"], benign: true, note: "Refusing the stones loops yesterday. Stepping them breaks the east remap." },
    { id: "bell-return", rooms: ["DG09-R01", "DG09-R05"], benign: true },
    { id: "yard-stones", rooms: ["DG09-R14", "DG09-R02"], benign: true, note: "Opens only after powder." },
  ],
  miniboss: {
    id: "marble-hounds",
    name: "The Marble Hounds",
    room: "DG09-R10",
    initialPhase: "PAIR",
    defeatedPhase: "DEFEATED",
    idlePhase: "IDLE",
    reward: null,
    sets: ["dg09.hounds"],
    beginText: "Two marble hounds take the cut.",
    victoryText: "Both chests are cracked. The east road opens.",
    idleText: "The hounds stay down.",
    phases: [
      { id: "PAIR", type: "counter", act: "shoot-chest", need: 2, marks: [[8, 5], [10, 5]], tool: "bow", rejectGodForm: true, next: "DEFEATED" },
    ],
  },
  boss: {
    id: "last-coachman",
    name: "The Last Coachman",
    room: "DG09-R15",
    initialPhase: "CIRCUIT",
    defeatedPhase: "DEFEATED",
    idlePhase: "IDLE",
    reward: { id: "coach-token", flag: "dg09.cleared", missable: false },
    sets: ["dg09.cleared"],
    beginText: "The coach enters. Four lanterns are lit. They will die if Ellis does not keep them.",
    victoryText: "The coachman steps down. The token is given once.",
    idleText: "The yard is quiet. The coachman does not offer a second token.",
    phases: [
      { id: "CIRCUIT", type: "counter", act: "light-lantern", need: 4, marks: [[6, 5], [8, 5], [10, 5], [12, 5]], tool: "lamp", rejectGodForm: true, next: "EXPOSED" },
      { id: "EXPOSED", type: "counter", act: "strike", need: 1, mark: [9, 5], toolAny: ["bow", "hammer"], rejectGodForm: true, next: "REINS" },
      { id: "REINS", type: "script", next: "DISMOUNT", mark: [9, 5], accepts: [{ action: "snag", mark: [9, 5], tool: "sugar-line", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "DISMOUNT", type: "script", next: "STRIKE2", marks: [[8, 8], [10, 8]], accepts: [{ action: "socket", tool: "block-rod", need: 2, requiresForm: "mortal", rejectGodForm: true }] },
      { id: "STRIKE2", type: "counter", act: "strike", need: 1, mark: [9, 5], toolAny: ["bow", "hammer"], rejectGodForm: true, next: "DEFEATED" },
    ],
  },
  routes: { main, shortcut },
  hooks: {
    foldLoop,
    transitionDeath: {
      setup: transitionSetup,
      carriedKind: "object",
      carriedId: "loose-reins",
      homeLoc: "home",
      homeRoom: "DG09-R06",
      persistFlag: "dg09.A2",
      lanternRoom: "DG09-R01",
    },
    inRoomCarryDeath: {
      setup: transitionSetup.slice(0, transitionSetup.length - 2),
      carriedKind: "object",
      carriedId: "loose-reins",
      lanternRoom: "DG09-R01",
    },
    collect,
    winFromLantern: [mv(9, 1), ex("north"), ...bossFight],
    reenter: [mv(9, 10), ex("south"), mv(9, 1), ex("north"), { op: "boss", action: "begin" }],
    godAtBoss: [
      mv(16, 6), ex("east"),
      mv(16, 6), ex("east"),
      mv(16, 6), ex("east"),
      mv(16, 6), ex("east"),
      ...ticks(3),
      mv(16, 6), ex("east"),
      mv(16, 6), ex("east"),
      mv(9, 1), ex("north"),
      mv(16, 6), ex("east"),
      mv(9, 1), ex("north"),
      { op: "boss", action: "begin" },
      { op: "boss", action: "light-lantern" },
    ],
    exitOps: [mv(16, 6), ex("east"), { op: "assert", code: "room", room: "COUNTY:ADDISON-EAST" }],
    reachableClosed: ["DG09-R01", "DG09-R02", "DG09-R03", "DG09-R05", "DG09-R18"],
    reachableOpen: rooms.map((r) => r.id).concat(["COUNTY:ADDISON-EAST"]),
    reward: "coach-token",
  },
};
