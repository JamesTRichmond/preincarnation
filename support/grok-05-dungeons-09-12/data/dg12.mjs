import { chamber, stamp, objects, link, flagInteract } from "./lib.mjs";
import { applyWalls } from "./ruins.mjs";

const mv = (x, y) => ({ op: "move", to: [x, y] });
const ix = (id) => ({ op: "interact", id });
const ex = (id) => ({ op: "use-exit", id });
const ticks = (n) => Array.from({ length: n }, () => ({ op: "tick-transition" }));
const tools = ["shovel", "sugar-line", "boots", "fins", "lamp", "hammer", "net", "homestead-glass", "cape", "block-rod", "bow", "powder"];

const CHART = "Ward moths are not yours to release. Ash to the blue lamp. Birch to the green lamp. Cedar to the gold lamp. Injured moths Pip, Rue, Sol, and Wren may be released at the sky grate. The grate will not take the ward. Ward lamps will not take the injured. Releasing the injured is mercy. It does not open the Keeper. Three living lamps and a walked void do.";
const GRATE = "Injured only. The ward is not healed here.";
const ARENA = "Net returns them. Arrows end them. The door opens either way.";
const MERCY = ["mercy.pip", "mercy.rue", "mercy.sol", "mercy.wren"];
const LAMPS = ["lamp.ash", "lamp.birch", "lamp.cedar"];

function book(rows) {
  const out = {};
  for (const [id, hint, fullRule] of rows) out[id] = { persistent: true, hint, doneText: `Already true: ${hint}.`, fullRule };
  return out;
}
const flagBook = book([
  ["dg12.chart", "read the admittance chart", CHART],
  ["lamp.ash", "Ash to the blue lamp", "The blue lamp stays lit only when Ash is installed in it."],
  ["lamp.birch", "Birch to the green lamp", "The green lamp stays lit only when Birch is installed in it."],
  ["lamp.cedar", "Cedar to the gold lamp", "The gold lamp stays lit only when Cedar is installed in it. Its light, plus the cape, crosses the void."],
  ["dg12.void_walked", "walk the void on the cape after Cedar is lit", "God-flight does not write the void as walked. The cape does, once the gold lamp is lit."],
  ["dg12.swarm", "scatter the fever swarm with living light", "Homestead glass on a ward lamp, or a moth held in the net, scatters the swarm. God-light does not."],
  ["dg12.cleared", "end the Keeper's round", "The ward door opens after the Keeper's round, whether the attack moths were netted or ended."],
  ["dg12.mercy-kept", "net the three attack moths", "Netting all three returns them. Arrows end them. Only the net grants the kept years."],
  ["dg12.dose", "set the three bottles in painted order", "The apothecary is optional. Living light shows the order. Nothing is mixed."],
  ["dg12.dust", "the fever dust stays after the swarm", "Optional. The swarm can be skipped and fought later."],
  ["dg12.cots", "the recovery cots list who was released", "Optional record. It does not open the Keeper."],
  ["dg12.thread", "release all four injured moths", "The grateful thread needs all four releases. One release only opens the corridor."],
  ["mercy.pip", "release Pip", "Pip is injured, not ward."],
  ["mercy.rue", "release Rue", "Rue is injured, not ward."],
  ["mercy.sol", "release Sol", "Sol is injured, not ward."],
  ["mercy.wren", "release Wren", "Wren is injured, not ward."],
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
    conditionalTerrain: spec.conditionalTerrain || [],
    stepFlags: spec.stepFlags || [],
    connections: spec.connections, actors: spec.actors || [],
    interactions: spec.interactions, puzzles: spec.puzzles || [],
    persistentState: spec.persistentState || ["flags", "installed-lamps", "released-moths", "collected-rewards"],
    resetState: spec.resetState || ["enemy-positions", "boss-phase-if-not-defeated", "carried-object-on-transition-death"],
    localProof: spec.localProof, failureAndRecovery: spec.failureAndRecovery,
  };
}
const terrain = (edits, id) => stamp(chamber(), edits, id);
const bridgeWall = [
  ...[1, 2, 3, 4, 5, 7, 8, 9, 10].flatMap((y) => [[4, y, "#"], [12, y, "#"]]),
  [5, 6, "+"], [6, 6, "+"], [7, 6, "+"],
  [8, 6, "G"], [9, 6, "G"], [10, 6, "G"], [11, 6, "G"],
];

const R01 = room({
  id: "DG12-R01", name: "Admittance", classification: "main", map: { c: 0, r: 2 },
  setsLantern: true, lanternTile: [3, 6],
  summary: "The Vein Ward's desk. The chart names every ward moth and says mercy will not open the Keeper.",
  terrain: terrain([[6, 4, ","]], "R01"),
  paints: [[6, 4, "*"], [6, 5, "C"], [16, 6, "E"], [9, 1, "N"], [9, 10, "S"], [1, 6, "W"], [14, 1, "A"], [3, 6, "@"]],
  connections: [
    link("east", [16, 6], "DG12-R02", [2, 6]),
    link("north", [9, 1], "DG12-R04", [9, 10]),
    link("south", [9, 10], "DG12-R06", [9, 2]),
    link("west", [1, 6], "DG12-R08", [15, 6]),
    link("up", [14, 1], "DG12-R10", [9, 10]),
  ],
  interactions: [
    mile("mile-r01", [6, 4], LAMPS, CHART),
    flagInteract({ id: "read-chart", tile: [6, 5], glyph: "C", sets: ["dg12.chart"], successText: CHART }),
  ],
  localProof: {
    place: { room: "DG12-R01", tile: [3, 6] },
    steps: [mv(6, 4), ix("mile-r01"), mv(6, 5), ix("read-chart")],
    expect: { flags: ["dg12.chart"], textIncludes: "It does not open the Keeper" },
  },
  failureAndRecovery: [{
    name: "leave-before-standing-on-the-ash-door",
    place: { room: "DG12-R01", tile: [3, 6] },
    steps: [ex("east")], expectError: "NOT_ON_EXIT",
    recovery: [mv(16, 6), ex("east")], expect: { room: "DG12-R02" },
  }],
});

const R02 = room({
  id: "DG12-R02", name: "Ash Perch", classification: "main", map: { c: 1, r: 2 },
  summary: "Ash, a ward moth. The corridor east is a real crossing: death puts Ash back on the perch.",
  terrain: terrain([[8, 5, ","]], "R02"),
  paints: [[8, 5, "M"], [4, 3, "*"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG12-R01", [15, 6]),
    link("east", [16, 6], "DG12-R03", [2, 6], { transitionSteps: 3, transitionId: "ash-corridor", transitionText: "Ash rides the net across the ward corridor.", deathLantern: { room: "DG12-R01", tile: [3, 6] } }),
  ],
  actors: [{ id: "ash", name: "Ash", tile: [8, 5], kind: "ward-moth", resets: "to-perch-if-transition-death" }],
  interactions: [
    mile("mile-r02", [4, 3], ["lamp.ash"], "Ash goes to the blue lamp. The grate will refuse Ash."),
    flagInteract({ id: "catch-ash", kind: "catch", moth: "ash", tile: [8, 5], glyph: "M", requiresTools: ["net"], once: false, successText: "Ash rests in the net." }),
  ],
  localProof: {
    place: { room: "DG12-R02", tile: [2, 6] },
    steps: [mv(8, 5), ix("catch-ash"), mv(16, 6), ex("east"), ...ticks(3), mv(8, 5), ix("lamp-blue")],
    expect: { flags: ["lamp.ash"], room: "DG12-R03" },
  },
  failureAndRecovery: [{
    name: "catch-without-the-net",
    place: { room: "DG12-R02", tile: [8, 5], tools: tools.filter((t) => t !== "net") },
    steps: [ix("catch-ash")], expectError: "TOOL_REQUIRED",
    recovery: [{ op: "grant-tool", tool: "net" }, ix("catch-ash")],
    expect: { room: "DG12-R02" },
  }],
});

const R03 = room({
  id: "DG12-R03", name: "Blue Lamp Gallery", classification: "main", map: { c: 2, r: 2 },
  summary: "The blue lamp takes Ash and only Ash. An injured moth is spat back into the net.",
  terrain: terrain([[8, 5, ","]], "R03"),
  paints: [[8, 5, "L"], [4, 3, "*"], [1, 6, "W"]],
  connections: [link("west", [1, 6], "DG12-R02", [15, 6])],
  interactions: [
    mile("mile-r03", [4, 3], ["lamp.ash"]),
    flagInteract({ id: "lamp-blue", kind: "install", expectsMoth: "ash", tile: [8, 5], glyph: "L", sets: ["lamp.ash"], once: false, successText: "Ash is in the blue lamp. It stays lit." }),
  ],
  localProof: {
    place: { room: "DG12-R03", tile: [8, 5], carrying: { id: "ash", kind: "moth" } },
    steps: [ix("lamp-blue")],
    expect: { flags: ["lamp.ash"] },
  },
  failureAndRecovery: [{
    name: "injured-moth-rejected-by-ward-lamp",
    place: { room: "DG12-R03", tile: [8, 5], carrying: { id: "pip", kind: "moth" } },
    steps: [ix("lamp-blue")],
    expectError: "LAMP_REJECTED",
    recovery: [{ op: "assert", code: "moth", id: "pip", loc: "carried" }, { op: "assert", code: "flag", flag: "lamp.ash", value: false }],
    expect: { notFlags: ["lamp.ash"] },
  }],
});

const R04 = room({
  id: "DG12-R04", name: "Birch Ward", classification: "main", map: { c: 1, r: 1 },
  summary: "Birch's perch. Same corridor rule as Ash.",
  terrain: terrain([[8, 5, ","]], "R04"),
  paints: [[8, 5, "M"], [4, 3, "*"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG12-R01", [9, 2]),
    link("east", [16, 6], "DG12-R05", [2, 6], { transitionSteps: 3, transitionId: "birch-corridor", transitionText: "Birch rides the net.", deathLantern: { room: "DG12-R01", tile: [3, 6] } }),
  ],
  interactions: [
    mile("mile-r04", [4, 3], ["lamp.birch"]),
    flagInteract({ id: "catch-birch", kind: "catch", moth: "birch", tile: [8, 5], glyph: "M", requiresTools: ["net"], once: false, successText: "Birch rests in the net." }),
  ],
  localProof: {
    place: { room: "DG12-R04", tile: [9, 10] },
    steps: [mv(8, 5), ix("catch-birch"), mv(16, 6), ex("east"), ...ticks(3)],
    expect: { room: "DG12-R05" },
  },
  failureAndRecovery: [{
    name: "birch-door-from-afar",
    place: { room: "DG12-R04", tile: [8, 5] },
    steps: [ex("east")], expectError: "NOT_ON_EXIT",
    recovery: [mv(9, 10), ex("south")], expect: { room: "DG12-R01" },
  }],
});

const R05 = room({
  id: "DG12-R05", name: "Green Lamp", classification: "main", map: { c: 2, r: 1 },
  summary: "The green lamp takes Birch only.",
  terrain: terrain([[8, 5, ","]], "R05"),
  paints: [[8, 5, "L"], [4, 3, "*"], [1, 6, "W"]],
  connections: [link("west", [1, 6], "DG12-R04", [15, 6])],
  interactions: [
    mile("mile-r05", [4, 3], ["lamp.birch"]),
    flagInteract({ id: "lamp-green", kind: "install", expectsMoth: "birch", tile: [8, 5], glyph: "L", sets: ["lamp.birch"], once: false, successText: "Birch is in the green lamp." }),
  ],
  localProof: {
    place: { room: "DG12-R05", tile: [8, 5], carrying: { id: "birch", kind: "moth" } },
    steps: [ix("lamp-green")],
    expect: { flags: ["lamp.birch"] },
  },
  failureAndRecovery: [{
    name: "ash-in-the-green-lamp",
    place: { room: "DG12-R05", tile: [8, 5], carrying: { id: "ash", kind: "moth" } },
    steps: [ix("lamp-green")], expectError: "LAMP_REJECTED",
    recovery: [{ op: "assert", code: "moth", id: "ash", loc: "carried" }],
    expect: { notFlags: ["lamp.birch"] },
  }],
});

const R06 = room({
  id: "DG12-R06", name: "Cedar Cloister", classification: "main", map: { c: 1, r: 3 },
  summary: "Cedar's perch. The gold lamp is the one the void will accept.",
  terrain: terrain([[8, 5, ","]], "R06"),
  paints: [[8, 5, "M"], [4, 3, "*"], [9, 1, "N"], [16, 6, "E"]],
  connections: [
    link("north", [9, 1], "DG12-R01", [9, 9]),
    link("east", [16, 6], "DG12-R07", [2, 6], { transitionSteps: 3, transitionId: "cedar-corridor", transitionText: "Cedar rides the net.", deathLantern: { room: "DG12-R01", tile: [3, 6] } }),
  ],
  interactions: [
    mile("mile-r06", [4, 3], ["lamp.cedar"]),
    flagInteract({ id: "catch-cedar", kind: "catch", moth: "cedar", tile: [8, 5], glyph: "M", requiresTools: ["net"], once: false, successText: "Cedar rests in the net." }),
  ],
  localProof: {
    place: { room: "DG12-R06", tile: [9, 2] },
    steps: [mv(8, 5), ix("catch-cedar"), mv(16, 6), ex("east"), ...ticks(3)],
    expect: { room: "DG12-R07" },
  },
  failureAndRecovery: [{
    name: "cedar-wall",
    place: { room: "DG12-R06", tile: [9, 2] },
    steps: [mv(0, 2)], expectError: "NO_PATH",
    recovery: [mv(9, 1), ex("north")], expect: { room: "DG12-R01" },
  }],
});

const R07 = room({
  id: "DG12-R07", name: "Gold Lamp Stair", classification: "main", map: { c: 2, r: 3 },
  summary: "Cedar's gold lamp. East is the fever stair. The void will not light itself.",
  terrain: terrain([[8, 5, ","], [12, 6, ","], [15, 6, ","]], "R07"),
  paints: [[8, 5, "L"], [4, 3, "*"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG12-R06", [15, 6]),
    link("east", [16, 6], "DG12-R11", [2, 6]),
  ],
  interactions: [
    mile("mile-r07", [4, 3], ["lamp.cedar"], "Gold light reaches the void bridge. It does not walk the bridge for you."),
    flagInteract({ id: "lamp-gold", kind: "install", expectsMoth: "cedar", tile: [8, 5], glyph: "L", sets: ["lamp.cedar"], once: false, successText: "Cedar is in the gold lamp." }),
  ],
  localProof: {
    place: { room: "DG12-R07", tile: [8, 5], carrying: { id: "cedar", kind: "moth" } },
    steps: [ix("lamp-gold"), mv(16, 6), ex("east")],
    expect: { flags: ["lamp.cedar"], room: "DG12-R11" },
  },
  failureAndRecovery: [{
    name: "birch-rejected-by-gold",
    place: { room: "DG12-R07", tile: [8, 5], carrying: { id: "birch", kind: "moth" } },
    steps: [ix("lamp-gold")], expectError: "LAMP_REJECTED",
    recovery: [{ op: "assert", code: "moth", id: "birch", loc: "carried" }],
    expect: { notFlags: ["lamp.cedar"] },
  }],
});

const R08 = room({
  id: "DG12-R08", name: "Injured Bay", classification: "optional", map: { c: 0, r: 1 },
  summary: "Four injured moths. Releasing them is mercy. It is not the ward.",
  terrain: terrain([[4, 5, ","], [6, 5, ","], [8, 5, ","], [10, 5, ","]], "R08"),
  paints: [[4, 5, "M"], [6, 5, "M"], [8, 5, "M"], [10, 5, "M"], [4, 2, "*"], [1, 6, "W"], [16, 6, "E"], [9, 10, "S"]],
  connections: [
    link("west", [1, 6], "DG12-R01", [2, 6]),
    link("east", [16, 6], "DG12-R09", [2, 6]),
    link("south", [9, 10], "DG12-R15", [9, 2]),
  ],
  interactions: [
    mile("mile-r08", [4, 2], MERCY, "Pip, Rue, Sol, Wren. One net, one moth. The ward perches are elsewhere."),
    flagInteract({ id: "catch-pip", kind: "catch", moth: "pip", tile: [4, 5], glyph: "M", requiresTools: ["net"], once: false, successText: "Pip is in the net." }),
    flagInteract({ id: "catch-rue", kind: "catch", moth: "rue", tile: [6, 5], glyph: "M", requiresTools: ["net"], once: false, successText: "Rue is in the net." }),
    flagInteract({ id: "catch-sol", kind: "catch", moth: "sol", tile: [8, 5], glyph: "M", requiresTools: ["net"], once: false, successText: "Sol is in the net." }),
    flagInteract({ id: "catch-wren", kind: "catch", moth: "wren", tile: [10, 5], glyph: "M", requiresTools: ["net"], once: false, successText: "Wren is in the net." }),
  ],
  localProof: {
    place: { room: "DG12-R08", tile: [15, 6] },
    steps: [mv(4, 5), ix("catch-pip"), mv(16, 6), ex("east"), mv(8, 6), ix("grate")],
    expect: { flags: ["mercy.pip"], room: "DG12-R09" },
  },
  failureAndRecovery: [{
    name: "second-moth-while-the-net-is-full",
    place: { room: "DG12-R08", tile: [6, 5], carrying: { id: "pip", kind: "moth" } },
    steps: [ix("catch-rue")], expectError: "HANDS_FULL",
    recovery: [mv(16, 6), ex("east"), mv(8, 6), ix("grate"), mv(1, 6), ex("west"), mv(6, 5), ix("catch-rue")],
    expect: { flags: ["mercy.pip"] },
  }],
});

const R09 = room({
  id: "DG12-R09", name: "Sky Grate", classification: "optional", map: { c: 0, r: 0 },
  summary: "Releases injured moths only. Ward moths bounce back into the net. Mercy does not light a ward lamp.",
  terrain: terrain([[8, 6, ","]], "R09"),
  paints: [[8, 6, "G"], [4, 3, "*"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG12-R08", [15, 6]),
    link("east", [16, 6], "DG12-R12", [2, 6], { when: { any: MERCY }, closedText: "The grateful corridor waits on one release. The Keeper does not." }),
  ],
  interactions: [
    mile("mile-r09", [4, 3], MERCY, GRATE),
    flagInteract({ id: "grate", kind: "release", tile: [8, 6], glyph: "G", once: false, successText: "Released. The Keeper's door does not move." }),
  ],
  localProof: {
    place: { room: "DG12-R09", tile: [8, 6], carrying: { id: "rue", kind: "moth" } },
    steps: [ix("grate"), mv(16, 6), ex("east")],
    expect: { flags: ["mercy.rue"], room: "DG12-R12", notFlags: LAMPS },
  },
  failureAndRecovery: [{
    name: "ward-moth-rejected-by-the-grate",
    place: { room: "DG12-R09", tile: [8, 6], carrying: { id: "ash", kind: "moth" } },
    steps: [ix("grate")], expectError: "WARD_REJECTED",
    recovery: [{ op: "assert", code: "moth", id: "ash", loc: "carried" }, { op: "assert", code: "flag", flag: "mercy.ash", value: false }],
    expect: { notFlags: ["lamp.ash"] },
  }],
});

const R10 = room({
  id: "DG12-R10", name: "Dark Apothecary", classification: "optional", map: { c: 0, r: 3 },
  summary: "Three labeled bottles on marked pans. Living light shows the order. They are placed, not combined.",
  terrain: terrain([[6, 5, ","], [8, 5, ","], [10, 5, ","]], "R10"),
  paints: [[6, 5, "1"], [8, 5, "2"], [10, 5, "3"], [4, 3, "*"], [9, 10, "D"]],
  connections: [link("down", [9, 10], "DG12-R01", [14, 2])],
  interactions: [
    mile("mile-r10", [4, 3], ["dg12.dose"], "A ward lamp must already be lit. Place bottle 1, then 2, then 3. Nothing is mixed."),
    flagInteract({ id: "bottle-1", kind: "sequence", sequence: "bottles", tile: [6, 5], glyph: "1", requiresFlags: ["lamp.ash"], once: false, successText: "First pan." }),
    flagInteract({ id: "bottle-2", kind: "sequence", sequence: "bottles", tile: [8, 5], glyph: "2", requiresFlags: ["lamp.ash"], once: false, successText: "Second pan." }),
    flagInteract({ id: "bottle-3", kind: "sequence", sequence: "bottles", tile: [10, 5], glyph: "3", requiresFlags: ["lamp.ash"], once: false, successText: "Third pan." }),
  ],
  puzzles: [{ id: "bottles", kind: "sequence", steps: ["bottle-1", "bottle-2", "bottle-3"], sets: ["dg12.dose"], grantItem: "dose-note", persistent: true, resetsOnWrong: true, failText: "The pans refuse that order." }],
  localProof: {
    place: { room: "DG12-R10", tile: [6, 5], flags: ["lamp.ash"] },
    steps: [ix("bottle-1"), mv(8, 5), ix("bottle-2"), mv(10, 5), ix("bottle-3")],
    expect: { flags: ["dg12.dose"], items: { "dose-note": 1 } },
  },
  failureAndRecovery: [{
    name: "bottles-out-of-order",
    place: { room: "DG12-R10", tile: [8, 5], flags: ["lamp.ash"] },
    steps: [ix("bottle-2"), { op: "assert", code: "flag", flag: "dg12.dose", value: false }],
    recovery: [mv(6, 5), ix("bottle-1"), mv(8, 5), ix("bottle-2"), mv(10, 5), ix("bottle-3")],
    expect: { items: { "dose-note": 1 } },
  }],
});

const R11 = room({
  id: "DG12-R11", name: "Swarm Stair", classification: "main", map: { c: 3, r: 2 },
  summary: "Miniboss fever swarm. Three light-marks along the stair. Living lamp-light or a netted moth scatters it. God-light does not. The grateful corridor skips this stair.",
  terrain: terrain([[8, 6, ","]], "R11"),
  paints: [[4, 2, "*"], [8, 8, "d"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG12-R07", [15, 6]),
    link("east", [16, 6], "DG12-R16", [2, 6]),
  ],
  actors: [{ id: "swarm", name: "Fever Swarm", tile: [9, 6], kind: "miniboss", resets: "on-death-if-not-defeated" }],
  interactions: [
    mile("mile-r11", [4, 2], ["dg12.swarm"], "Redirect a lit ward lamp with homestead glass, or present the net. Three pulses. God-light is ignored."),
    flagInteract({ id: "take-dust", tile: [8, 8], glyph: "d", requiresFlags: ["dg12.swarm"], sets: ["dg12.dust"], grantItem: "fever-dust", successText: "Fever dust. Optional." }),
  ],
  persistentState: ["miniboss-defeat", "installed-lamps", "flags"],
  resetState: ["boss-phase-if-not-defeated", "enemy-positions"],
  localProof: {
    place: { room: "DG12-R11", tile: [2, 6], flags: ["lamp.ash"] },
    steps: [
      { op: "miniboss", action: "begin" },
      mv(8, 5),
      { op: "miniboss", action: "light" },
      mv(9, 5),
      { op: "miniboss", action: "light" },
      mv(10, 5),
      { op: "miniboss", action: "light" },
      mv(16, 6), ex("east"),
    ],
    expect: { flags: ["dg12.swarm"], room: "DG12-R16" },
  },
  failureAndRecovery: [{
    name: "god-light-does-not-scatter",
    place: { room: "DG12-R11", tile: [8, 6], form: "god", flags: ["lamp.ash"] },
    steps: [{ op: "miniboss", action: "begin" }, { op: "miniboss", action: "light" }],
    expectError: "GOD_SEALED",
    recovery: [
      { op: "set-form", form: "mortal" },
      mv(8, 5),
      { op: "miniboss", action: "light" },
      mv(9, 5),
      { op: "miniboss", action: "light" },
      mv(10, 5),
      { op: "miniboss", action: "light" },
    ],
    expect: { flags: ["dg12.swarm"] },
  }],
});

const R12 = room({
  id: "DG12-R12", name: "Grateful Corridor", classification: "optional", map: { c: 1, r: 0 },
  summary: "Opens after one release and still does not reach the Keeper without the three lamps and the walked void. All four releases leave a thread.",
  terrain: terrain([[4, 8, "!"]], "R12"),
  hazardSafeWhen: { all: MERCY },
  hazardText: "The corridor's cold alcove bites until all four injured moths are released.",
  paints: [[4, 3, "*"], [8, 8, "t"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG12-R09", [15, 6]),
    link("east", [16, 6], "DG12-R16", [2, 6]),
  ],
  interactions: [
    mile("mile-r12", [4, 3], ["dg12.thread"], "One release opened this hall. The Keeper is still ahead of the void, and only if the ward lamps are lit. All four releases leave a thread in the alcove."),
    flagInteract({ id: "take-thread", tile: [8, 8], glyph: "t", requiresFlags: MERCY, sets: ["dg12.thread"], grantItem: "grateful-thread", successText: "The grateful thread. Mercy, completed. The Keeper was never this door.", failText: { flags: "The alcove wants all four releases." } }),
  ],
  localProof: {
    place: { room: "DG12-R12", tile: [2, 6], flags: ["mercy.pip"] },
    steps: [mv(16, 6), ex("east")],
    expect: { room: "DG12-R16", notFlags: ["dg12.cleared", "lamp.ash"] },
  },
  failureAndRecovery: [{
    name: "thread-before-all-four",
    place: { room: "DG12-R12", tile: [8, 8], flags: ["mercy.pip"] },
    steps: [ix("take-thread")], expectError: "FLAG_MISSING",
    recovery: [mv(16, 6), ex("east")],
    expect: { room: "DG12-R16", notFlags: ["dg12.thread"] },
  }],
});

const R13 = room({
  id: "DG12-R13", name: "Keeper's Door", classification: "main", map: { c: 5, r: 2 },
  setsLantern: true, lanternTile: [9, 3],
  summary: "The door names three lamps and the walked void. Mercy is not on the door.",
  terrain: terrain([[8, 6, ","], [12, 6, ","]], "R13"),
  paints: [[4, 5, "*"], [1, 6, "W"], [16, 6, "E"]],
  connections: [
    link("west", [1, 6], "DG12-R16", [15, 2]),
    link("east", [16, 6], "DG12-R14", [2, 6], { when: { all: [...LAMPS, "dg12.void_walked"] }, closedText: "The door wants Ash, Birch, Cedar, and a walked void. Mercy is not listed." }),
  ],
  interactions: [mile("mile-r13", [4, 5], [...LAMPS, "dg12.void_walked"], CHART)],
  localProof: {
    place: { room: "DG12-R13", tile: [2, 6], flags: [...LAMPS, "dg12.void_walked"] },
    steps: [mv(4, 5), ix("mile-r13"), mv(16, 6), ex("east")],
    expect: { room: "DG12-R14", textIncludes: "Ash to the blue lamp" },
  },
  failureAndRecovery: [{
    name: "door-without-the-void",
    place: { room: "DG12-R13", tile: [16, 6], flags: LAMPS },
    steps: [ex("east")], expectError: "EXIT_CLOSED",
    recovery: [mv(4, 5), ix("mile-r13")],
    expect: { textIncludes: "walk the void", notFlags: ["dg12.cleared"] },
  }],
});

const nets = [
  { op: "boss", action: "begin" },
  mv(6, 6),
  { op: "boss", action: "net", moth: "u1", tag: "boss-mid" },
  mv(9, 6),
  { op: "boss", action: "net", moth: "u2" },
  mv(12, 6),
  { op: "boss", action: "net", moth: "u3" },
  mv(9, 5),
  { op: "boss", action: "pin-book" },
  { op: "boss", action: "strike", tool: "hammer" },
  mv(8, 8),
  { op: "boss", action: "crank" },
  mv(14, 6),
  { op: "boss", action: "cross" },
];

const R14 = room({
  id: "DG12-R14", name: "The Keeper of Unlived Years", classification: "main", map: { c: 6, r: 2 },
  summary: "The Keeper's round. Three year-marks, then the book, the lock, the grief crank, and a cape crossing. Netting is mercy. Arrows also open the door. The sign says which is which.",
  terrain: terrain([[8, 6, ","]], "R14"),
  paints: [[4, 2, "*"], [9, 10, "S"], [16, 6, "E"]],
  connections: [
    link("south", [9, 10], "DG12-R13", [9, 2]),
    link("east", [16, 6], "COUNTY:VEIN-WARD", [0, 0], { when: { all: ["dg12.cleared"] }, closedText: "The vein stays shut." }),
  ],
  actors: [{ id: "keeper", name: "The Keeper of Unlived Years", tile: [9, 5], kind: "boss", resets: "on-death-if-not-defeated" }],
  interactions: [mile("mile-r14", [4, 2], ["dg12.cleared", "dg12.mercy-kept"], ARENA)],
  persistentState: ["collected-rewards", "installed-lamps", "flags"],
  resetState: ["boss-phase-if-not-defeated", "enemy-positions"],
  localProof: {
    place: { room: "DG12-R14", tile: [2, 6], flags: [...LAMPS, "dg12.void_walked"] },
    steps: [mv(4, 2), ix("mile-r14"), ...nets],
    expect: { items: { "keeper-key": 1, "unlived-kept": 1 }, flags: ["dg12.cleared"], phase: "DEFEATED" },
  },
  failureAndRecovery: [{
    name: "arrows-open-the-door-and-miss-the-kept-years",
    place: { room: "DG12-R14", tile: [8, 6], flags: [...LAMPS, "dg12.void_walked"] },
    steps: [
      { op: "boss", action: "begin" },
      mv(6, 6),
      { op: "boss", action: "shoot", moth: "u1", tool: "bow" },
      mv(9, 6),
      { op: "boss", action: "shoot", moth: "u2", tool: "bow" },
      mv(12, 6),
      { op: "boss", action: "shoot", moth: "u3", tool: "bow" },
      mv(9, 5),
      { op: "boss", action: "pin-book" },
      { op: "boss", action: "strike", tool: "hammer" },
      mv(8, 8),
      { op: "boss", action: "crank" },
      mv(14, 6),
      { op: "boss", action: "cross" },
    ],
    expect: { items: { "keeper-key": 1 }, notItems: ["unlived-kept"], flags: ["dg12.cleared"] },
  }],
});

const R15 = room({
  id: "DG12-R15", name: "Recovery Cots", classification: "optional", map: { c: 0, r: 4 },
  summary: "A cot list. Releasing moths is recorded as mercy, not as progress.",
  terrain: terrain([[8, 6, ","]], "R15"),
  paints: [[8, 6, "C"], [4, 3, "*"], [9, 1, "N"]],
  connections: [link("north", [9, 1], "DG12-R08", [9, 9])],
  interactions: [
    mile("mile-r15", [4, 3], ["dg12.cots"], "The cots remember releases. They do not light lamps."),
    flagInteract({ id: "read-cots", tile: [8, 6], glyph: "C", sets: ["dg12.cots"], grantItem: "recovery-roll", successText: "A roll of the bay. Optional." }),
  ],
  localProof: { place: { room: "DG12-R15", tile: [9, 2] }, steps: [mv(8, 6), ix("read-cots")], expect: { items: { "recovery-roll": 1 } } },
  failureAndRecovery: [{
    name: "cot-wall",
    place: { room: "DG12-R15", tile: [9, 2] },
    steps: [mv(0, 2)], expectError: "NO_PATH",
    recovery: [mv(8, 6), ix("read-cots")],
    expect: { items: { "recovery-roll": 1 } },
  }],
});

const R16 = room({
  id: "DG12-R16", name: "Void Crossing", classification: "main", map: { c: 4, r: 2 },
  summary: "Gold light makes the span. The cape walks it. Embryonic God does not get to count that walk.",
  terrain: terrain(bridgeWall, "R16"),
  conditionalTerrain: [
    { tiles: [[5, 6], [6, 6], [7, 6]], requiresAll: ["lamp.cedar"] },
    { tiles: [[8, 6], [9, 6], [10, 6], [11, 6]], requiresAll: ["dg12.void_walked"] },
  ],
  stepFlags: [{ tile: [15, 6], sets: ["dg12.void_walked"], requiresFlags: ["lamp.cedar"], requiresForm: "mortal" }],
  paints: [[2, 3, "*"], [15, 6, "X"], [1, 6, "W"]],
  connections: [
    link("west", [1, 6], "DG12-R11", [15, 6]),
    link("east", [15, 6], "DG12-R13", [2, 6], { when: { all: ["dg12.void_walked"] }, closedText: "The void is not yet walked." }),
  ],
  interactions: [mile("mile-r16", [2, 3], ["dg12.void_walked", "lamp.cedar"], "Cedar's gold light builds the span. The cape walks it. A god who flies it has not walked it.")],
  localProof: {
    place: { room: "DG12-R16", tile: [2, 6], flags: ["lamp.cedar"] },
    steps: [mv(2, 3), ix("mile-r16"), mv(15, 6), ex("east")],
    expect: { flags: ["dg12.void_walked"], room: "DG12-R13" },
  },
  failureAndRecovery: [{
    name: "god-does-not-walk-the-void",
    place: { room: "DG12-R16", tile: [2, 6], form: "god", flags: ["lamp.cedar"] },
    steps: [mv(15, 6)], expectError: "NO_PATH",
    recovery: [{ op: "set-form", form: "mortal" }, mv(15, 6), ex("east")],
    expect: { flags: ["dg12.void_walked"], room: "DG12-R13" },
  }],
});

const rooms = [R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R12, R13, R14, R15, R16];

const ash = [
  mv(16, 6), ex("east"),
  mv(8, 5), ix("catch-ash"),
  mv(16, 6), ex("east"), ...ticks(3),
  mv(8, 5), ix("lamp-blue"),
  mv(1, 6), ex("west"),
  mv(1, 6), ex("west"),
];
const birch = [
  mv(9, 1), ex("north"),
  mv(8, 5), ix("catch-birch"),
  mv(16, 6), ex("east"), ...ticks(3),
  mv(8, 5), ix("lamp-green"),
  mv(1, 6), ex("west"),
  mv(9, 10), ex("south"),
];
const cedarToR07 = [
  mv(9, 10), ex("south"),
  mv(8, 5), ix("catch-cedar"),
  mv(16, 6), ex("east"), ...ticks(3),
  mv(8, 5), ix("lamp-gold"),
];
const swarmAndVoid = [
  mv(16, 6), ex("east"),
  { op: "miniboss", action: "begin" },
  mv(8, 5),
  { op: "miniboss", action: "light" },
  mv(9, 5),
  { op: "miniboss", action: "light" },
  mv(10, 5),
  { op: "miniboss", action: "light" },
  mv(16, 6), ex("east"),
  mv(15, 6), ex("east"),
  mv(16, 6), ex("east"),
];
const prefix = [mv(6, 5), ix("read-chart"), ...ash, ...birch, ...cedarToR07];
const main = [
  ...prefix,
  ...swarmAndVoid,
  ...nets,
  { op: "assert", code: "item-count", item: "keeper-key", count: 1 },
  { op: "assert", code: "item-count", item: "unlived-kept", count: 1 },
  { op: "assert", code: "not-item", item: "fever-dust" },
  { op: "assert", code: "not-item", item: "dose-note" },
  { op: "assert", code: "not-item", item: "grateful-thread" },
  { op: "assert", code: "flag", flag: "dg12.swarm", value: true },
  { op: "assert", code: "room", room: "DG12-R14" },
];
const shortcut = [
  mv(6, 5), ix("read-chart"),
  mv(1, 6), ex("west"),
  mv(4, 5), ix("catch-pip"),
  mv(16, 6), ex("east"),
  mv(8, 6), ix("grate"),
  mv(1, 6), ex("west"),
  mv(1, 6), ex("west"),
  ...ash, ...birch, ...cedarToR07,
  mv(1, 6), ex("west"),
  mv(9, 1), ex("north"),
  mv(1, 6), ex("west"),
  mv(16, 6), ex("east"),
  mv(16, 6), ex("east"),
  mv(16, 6), ex("east"),
  mv(15, 6), ex("east"),
  mv(16, 6), ex("east"),
  ...nets,
  { op: "assert", code: "flag", flag: "dg12.swarm", value: false },
  { op: "assert", code: "not-visited", room: "DG12-R11" },
  { op: "assert", code: "item", item: "keeper-key" },
  { op: "assert", code: "item", item: "unlived-kept" },
  { op: "assert", code: "flag", flag: "mercy.pip", value: true },
];
const harshFight = [
  { op: "boss", action: "begin" },
  mv(6, 6),
  { op: "boss", action: "shoot", moth: "u1", tool: "bow" },
  mv(9, 6),
  { op: "boss", action: "shoot", moth: "u2", tool: "bow" },
  mv(12, 6),
  { op: "boss", action: "shoot", moth: "u3", tool: "bow" },
  mv(9, 5),
  { op: "boss", action: "pin-book" },
  { op: "boss", action: "strike", tool: "hammer" },
  mv(8, 8),
  { op: "boss", action: "crank" },
  mv(14, 6),
  { op: "boss", action: "cross" },
];
const harsh = [
  ...prefix,
  ...swarmAndVoid,
  ...harshFight,
  { op: "assert", code: "item", item: "keeper-key" },
  { op: "assert", code: "not-item", item: "unlived-kept" },
  { op: "assert", code: "flag", flag: "dg12.cleared", value: true },
];

const releaseAll = ["pip", "rue", "sol", "wren"].flatMap((id, i) => [
  mv(i === 0 ? 4 : i === 1 ? 6 : i === 2 ? 8 : 10, 5), ix(`catch-${id}`),
  mv(16, 6), ex("east"),
  mv(8, 6), ix("grate"),
  mv(1, 6), ex("west"),
]);
const toBay = [
  mv(9, 10), ex("south"),
  mv(1, 6), ex("west"),
  mv(1, 6), ex("west"),
  mv(1, 6), ex("west"),
  mv(1, 6), ex("west"),
  mv(9, 1), ex("north"),
  mv(1, 6), ex("west"),
];
const collect = {
  "fever-dust": [mv(9, 10), ex("south"), mv(1, 6), ex("west"), mv(1, 6), ex("west"), mv(8, 8), ix("take-dust"), { op: "assert", code: "item", item: "fever-dust" }],
  "dose-note": [...toBay, mv(1, 6), ex("west"), mv(14, 1), ex("up"), mv(6, 5), ix("bottle-1"), mv(8, 5), ix("bottle-2"), mv(10, 5), ix("bottle-3"), { op: "assert", code: "item", item: "dose-note" }],
  "recovery-roll": [...toBay, mv(9, 10), ex("south"), mv(8, 6), ix("read-cots"), { op: "assert", code: "item", item: "recovery-roll" }],
  "grateful-thread": [...toBay, ...releaseAll, mv(16, 6), ex("east"), mv(16, 6), ex("east"), mv(8, 8), ix("take-thread"), { op: "assert", code: "item", item: "grateful-thread" }, { op: "assert", code: "flag", flag: "dg12.cleared", value: true }],
};

export const dungeon = {
  id: "DG12",
  name: "The Moth Infirmary",
  bossName: "The Keeper of Unlived Years",
  county: "Addison County, Vermont",
  site: "The Vein Ward under East Middlebury",
  protagonist: "Ellis Perch",
  tileSize: 16,
  widthTiles: 18,
  heightTiles: 12,
  maxHp: 6,
  startingTools: tools,
  codexFlag: null,
  entry: { room: "DG12-R01", tile: [3, 6] },
  flagBook,
  rooms,
  debts: [],
  transportables: [],
  moths: [
    { id: "ash", kind: "ward", home: { room: "DG12-R02", tile: [8, 5] }, returnHomeOnTransitionDeath: true },
    { id: "birch", kind: "ward", home: { room: "DG12-R04", tile: [8, 5] }, returnHomeOnTransitionDeath: true },
    { id: "cedar", kind: "ward", home: { room: "DG12-R06", tile: [8, 5] }, returnHomeOnTransitionDeath: true },
    { id: "pip", kind: "injured", home: { room: "DG12-R08", tile: [4, 5] }, returnHomeOnTransitionDeath: true },
    { id: "rue", kind: "injured", home: { room: "DG12-R08", tile: [6, 5] }, returnHomeOnTransitionDeath: true },
    { id: "sol", kind: "injured", home: { room: "DG12-R08", tile: [8, 5] }, returnHomeOnTransitionDeath: true },
    { id: "wren", kind: "injured", home: { room: "DG12-R08", tile: [10, 5] }, returnHomeOnTransitionDeath: true },
  ],
  plots: [],
  ferry: null,
  seasons: [],
  bannedWords: ["price", "coins", "shop", "interest", "vendor"],
  lightNote: "Cedar's lamp is described as gold light. That is living light, not a currency.",
  godForm: {
    water: "sealed", void: "sealed", gust: "sealed",
    note: "God-light does not fill a ward lamp, scatter the swarm, or mark the void as walked. After a mortal walk, the span may be recrossed; the Keeper still rejects god-form.",
  },
  dependencyGraph: {
    nodes: ["ENTER", "dg12.chart", "lamp.ash", "lamp.birch", "lamp.cedar", "dg12.swarm", "dg12.void_walked", "dg12.cleared"],
    edges: [
      { from: "ENTER", to: "dg12.chart" },
      { from: "dg12.chart", to: "lamp.ash" },
      { from: "lamp.ash", to: "lamp.birch" },
      { from: "lamp.birch", to: "lamp.cedar" },
      { from: "lamp.cedar", to: "dg12.swarm" },
      { from: "dg12.swarm", to: "dg12.void_walked" },
      { from: "dg12.void_walked", to: "dg12.cleared" },
    ],
  },
  shortcuts: [{
    id: "grateful-corridor",
    description: "One injured release opens a corridor around the Fever Swarm. The three ward lamps and the walked void stay mandatory. Mercy never opens the Keeper by itself.",
    skips: ["dg12.swarm"],
    stillRequires: [...LAMPS, "dg12.void_walked"],
    route: "shortcut",
  }],
  discoveries: [
    { id: "dose-note", room: "DG12-R10", item: "dose-note", interact: "bottle-3", optional: true, missable: false },
    { id: "fever-dust", room: "DG12-R11", item: "fever-dust", interact: "take-dust", optional: true, missable: false },
    { id: "recovery-roll", room: "DG12-R15", item: "recovery-roll", interact: "read-cots", optional: true, missable: false },
    { id: "grateful-thread", room: "DG12-R12", item: "grateful-thread", interact: "take-thread", optional: true, missable: false },
    { id: "unlived-kept", room: "DG12-R14", item: "unlived-kept", interact: null, optional: true, missable: true },
  ],
  intentionalCycles: [
    { id: "ward-return", rooms: ["DG12-R01", "DG12-R02", "DG12-R03"], benign: true },
  ],
  miniboss: {
    id: "fever-swarm",
    name: "The Fever Swarm",
    room: "DG12-R11",
    initialPhase: "PULSE",
    defeatedPhase: "DEFEATED",
    idlePhase: "IDLE",
    reward: null,
    sets: ["dg12.swarm"],
    beginText: "The swarm rises.",
    victoryText: "The swarm is dispersed.",
    idleText: "The stair is quiet.",
    phases: [
      { id: "PULSE", type: "counter", act: "light", need: 3, marks: [[8, 4], [9, 4], [10, 4]], lightFrom: ["glass", "carried-moth"], rejectGodForm: true, next: "DEFEATED" },
    ],
  },
  boss: {
    id: "keeper-of-unlived-years",
    name: "The Keeper of Unlived Years",
    room: "DG12-R14",
    initialPhase: "MOTHS",
    defeatedPhase: "DEFEATED",
    idlePhase: "IDLE",
    reward: { id: "keeper-key", flag: "dg12.cleared", missable: false },
    mercyReward: { id: "unlived-kept", flag: "dg12.mercy-kept", missable: true },
    mercyMoths: ["u1", "u2", "u3"],
    sets: ["dg12.cleared"],
    beginText: "Three unlived years orbit the Keeper. They are not the ward moths.",
    victoryText: "The round ends. The key is given once.",
    idleText: "The Keeper sits. The round does not restart.",
    phases: [
      { id: "MOTHS", type: "script", next: "BOOK", indexMarks: "resolved", marks: [[6, 5], [9, 5], [12, 5]], accepts: [
        { action: "net", tool: "net", requiresForm: "mortal", rejectGodForm: true },
        { action: "shoot", tool: "bow", requiresForm: "mortal", rejectGodForm: true },
      ] },
      { id: "BOOK", type: "script", next: "LOCK", mark: [9, 4], accepts: [{ action: "pin-book", mark: [9, 4], tool: "block-rod", requiresForm: "mortal", rejectGodForm: true }] },
      { id: "LOCK", type: "counter", act: "strike", need: 1, mark: [9, 5], tool: "hammer", rejectGodForm: true, next: "GRIEF" },
      { id: "GRIEF", type: "script", next: "CROSS", mark: [8, 8], accepts: [{ action: "crank", mark: [8, 8], requiresForm: "mortal", rejectGodForm: true }] },
      { id: "CROSS", type: "script", next: "DEFEATED", mark: [14, 6], accepts: [{ action: "cross", mark: [14, 6], tool: "cape", requiresForm: "mortal", rejectGodForm: true }] },
    ],
  },
  routes: { main, shortcut, harsh },
  hooks: {
    foldLoop: [],
    transitionDeath: {
      setup: [mv(6, 5), ix("read-chart"), mv(16, 6), ex("east"), mv(8, 5), ix("catch-ash"), mv(16, 6), ex("east"), { op: "tick-transition" }],
      carriedKind: "moth",
      carriedId: "ash",
      homeLoc: "perch",
      homeRoom: "DG12-R02",
      persistFlag: "dg12.chart",
      lanternRoom: "DG12-R01",
    },
    inRoomCarryDeath: {
      setup: [mv(6, 5), ix("read-chart"), mv(16, 6), ex("east"), mv(8, 5), ix("catch-ash")],
      carriedKind: "moth",
      carriedId: "ash",
      lanternRoom: "DG12-R01",
    },
    collect,
    winFromLantern: [mv(16, 6), ex("east"), ...nets],
    reenter: [mv(9, 10), ex("south"), mv(16, 6), ex("east"), { op: "boss", action: "begin" }],
    godAtBoss: [
      mv(9, 10), ex("south"),
      mv(16, 6), ex("east"), ...ticks(3),
      mv(16, 6), ex("east"),
      mv(16, 6), ex("east"),
      mv(15, 6), ex("east"),
      mv(16, 6), ex("east"),
      { op: "boss", action: "begin" },
      { op: "boss", action: "net", moth: "u1" },
    ],
    exitOps: [mv(16, 6), ex("east"), { op: "assert", code: "room", room: "COUNTY:VEIN-WARD" }],
    reachableClosed: ["DG12-R01", "DG12-R02", "DG12-R03", "DG12-R04", "DG12-R05", "DG12-R06", "DG12-R07", "DG12-R08", "DG12-R09", "DG12-R10", "DG12-R11", "DG12-R15", "DG12-R16"],
    reachableOpen: rooms.map((r) => r.id).concat(["COUNTY:VEIN-WARD"]),
    reward: "keeper-key",
    mercyReward: "unlived-kept",
  },
};
