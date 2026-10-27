/** Compile the six eras into the runtime atlas the walker imports. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CARTOGRAM } from "./data/cartogram.mjs";
import { DUNGEONS, ERA_CHANGES, PICKUPS, SPANS } from "./data/travel.mjs";
import { DISTRICT_META, ERAS, START_SCREEN, TOOL_LABEL } from "./lib/constants.mjs";
import { assemble, dungeonState } from "./lib/world.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(here, "../../src/game/world.json");

const MOUTHS = {
  "DUN-BUTTON-CISTERN": ["Button Bay cistern", "A stone throat under the bay. The water in it is older than the dock.", "Past the stair the cistern keeps its own dark. This county's surface ends at the landing."],
  "DUN-FALLS-RACE": ["Falls race underworks", "The mill-race keeps a room under the street. Some years the town boards it shut.", "The wheel-pit goes on without you. The street is still the way back."],
  "DUN-DEADCREEK-BELL": ["Dead Creek bell", "Something rings under the creek when the water is deep enough to row.", "The bell is further down than an oar reaches. You have heard enough."],
  "DUN-SNAKE-VEIN": ["Snake Mountain vein", "A crack in the mountain, not a trail. Iron is how the rock agrees.", "The vein narrows to a breath. The mountain keeps the rest."],
  "DUN-PULP-UNDERCROFT": ["Pulp Mill undercroft", "Under the covered bridge, the creek has a second, drier room.", "The undercroft stops at a timber bulkhead. The bridge is still overhead."],
  "DUN-LEMON-KILN": ["Lemon Fair kiln", "The kiln is a throat of lime and dark. A lamp is the whole of the welcome.", "Heat stains the brick and then there is only brick. Leave it."],
  "DUN-WHITING-CUT": ["Whiting cut", "A quarry cut that does not show on the daylight road.", "The cut ends in a wall of chips. Daylight is the other way."],
  "DUN-COLLEGE-STACKS": ["College stacks", "The hill keeps a stair the ledger will open and the college will not explain.", "The stacks continue in a hand that is not yours. The quad is enough."],
  "DUN-GORGE-LANA": ["Falls of Lana", "The gorge drops away from the rim. The line is how you trust the drop.", "Spray closes the next hold. The rim still has a road."],
  "DUN-DUNMORE-GLASS": ["Dunmore glass", "The shore remembers a chapel that was never consecrated.", "The glass goes under the lake. You are still on the Vermont side of it."],
  "DUN-FROST-CELLAR": ["Frost cellar", "Not a house. A cellar in the wind, east of the ordinary roads.", "The cellar floor is frost and then stone. Hancock is not through here."],
  "DUN-TEXAS-SPIRAL": ["Texas Falls spiral", "Behind the falls, a stair that only exists late.", "The spiral turns once and loses its steps. The falls are the exit."],
  "DUN-BARTLETT-THROAT": ["Bartlett throat", "The river's noise has a door in it.", "The throat drops where the line will not. Climb back to the bank."],
  "DUN-LEDGE-HIVE": ["Ledge hive", "The leap is full of a low sound. Iron is how you answer it.", "The sound stays in the rock. You do not have to."],
  "DUN-LINCOLN-FLUME": ["Lincoln flume", "Under the sugar run, a wooden dark.", "The flume's underside ends in wet boards. The slope is still above you."],
  "DUN-INDEPENDENCE-MINES": ["Independence tunnels", "The historic ground stays above. These rooms are the fiction under it.", "The tunnel is a claim, not a passage to New York. Turn around."],
};

const TOOL_DISTRICT = {
  ledger_key: "middlebury",
  creek_boots: "ferrisburgh",
  ledge_iron: "bristol",
  falls_line: "middlebury",
  sugar_tap: "lincoln",
  orchard_ladder: "shoreham",
  quarry_lamp: "quarry",
  frost_notch: "ripton",
  glass_shard: "salisbury",
  void_oar: "west_lakeshore",
};

function idAt(screens) {
  return new Map(screens.map((s) => [`${s.x},${s.y}`, s.id]));
}

function exitOf(raw, ids) {
  if (!raw) return null;
  const oneWay = raw.oneway
    ? { from: ids.get(raw.oneway[0]) ?? raw.oneway[0], to: ids.get(raw.oneway[1]) ?? raw.oneway[1] }
    : null;
  return {
    to: raw.to,
    shut: Boolean(raw.closed),
    need: raw.needAll ?? [],
    any: raw.needAny,
    oneWay,
  };
}

function findFloor(layout) {
  const prefer = [
    [10, 4],
    [9, 4],
    [8, 3],
    [5, 4],
    [4, 3],
    [10, 2],
    [3, 2],
    [6, 3],
  ];
  for (const [x, y] of prefer) {
    if (layout[y]?.[x] === "f") return [x, y];
  }
  for (let y = 0; y < layout.length; y++) {
    for (let x = 0; x < layout[y].length; x++) if (layout[y][x] === "f") return [x, y];
  }
  return null;
}

function stamp(layout, x, y, ch) {
  const rows = layout.map((row) => row.split(""));
  rows[y][x] = ch;
  return rows.map((row) => row.join(""));
}

const assembled = ERAS.map((era) => assemble(era));
const base = assembled[0];
const ids = idAt(base.screens);
const spanById = new Map(SPANS.map((span) => [span.id, span]));
const hubById = new Map(base.hubs.map((hub) => [hub.id, hub]));
const interiorById = new Map(base.interiors.map((room) => [room.id, room]));
const names = new Map(base.screens.map((s) => [s.id, s.name]));

const interiorDoor = new Map();
for (const screen of base.screens) {
  for (const link of screen.links) {
    if (link.kind === "interior") interiorDoor.set(link.id, { id: screen.id, x: link.x, y: link.y });
  }
}

function linkLabel(link) {
  if (link.kind === "interior") return interiorById.get(link.id)?.name ?? link.id;
  if (link.kind === "hub") return hubById.get(link.id)?.name ?? link.id;
  if (link.kind === "dungeon") return MOUTHS[link.id]?.[0] ?? link.id;
  if (link.kind === "warp") return "Glass warp";
  if (link.kind === "pickup") return TOOL_LABEL[link.id] ?? link.id;
  if (link.kind === "span") return spanById.get(link.id)?.summary ?? link.id;
  return link.id;
}

function normalizeLink(link, screen) {
  let to = null;
  if (link.kind === "span") {
    const span = spanById.get(link.id);
    if (!span) throw new Error(`missing span ${link.id}`);
    const key = `${screen.x},${screen.y}`;
    const other = span.a === key ? span.b : span.a;
    to = ids.get(other);
    if (!to) throw new Error(`span ${link.id} leaves the map at ${other}`);
  }
  return { kind: link.kind, id: link.id, x: link.x, y: link.y, to, label: linkLabel(link) };
}

function normalizeNeeds(needs) {
  const out = {};
  for (const [key, value] of Object.entries(needs)) {
    out[key] = { need: value.needAll ?? [], any: value.needAny ?? null };
  }
  return out;
}

const screens = base.screens.map((screen) => ({
  id: screen.id,
  district: screen.district,
  name: screen.name,
  x: screen.x,
  y: screen.y,
  landmark: screen.landmark,
  eras: assembled.map((world) => {
    const eraScreen = world.screens.find((s) => s.id === screen.id);
    if (!eraScreen) throw new Error(`missing ${screen.id}`);
    const lines = [];
    for (const talk of eraScreen.interactions) {
      if (talk.text && !lines.includes(talk.text)) lines.push(talk.text);
    }
    return {
      lines,
      layout: eraScreen.layout,
      exits: {
        N: exitOf(eraScreen.exits.N, ids),
        S: exitOf(eraScreen.exits.S, ids),
        W: exitOf(eraScreen.exits.W, ids),
        E: exitOf(eraScreen.exits.E, ids),
      },
      links: eraScreen.links.map((link) => normalizeLink(link, screen)),
      needs: normalizeNeeds(eraScreen.needs),
    };
  }),
}));

const screenById = new Map(screens.map((s) => [s.id, s]));

const hubs = base.hubs.map((hub) => ({
  id: hub.id,
  name: hub.name,
  blurb: hub.blurb,
  from: hub.entrance.from,
  layout: hub.layout,
  links: hub.doors.map(([id, x, y]) => ({
    kind: "interior",
    id,
    x,
    y,
    to: null,
    label: interiorById.get(id)?.name ?? id,
  })),
}));

const interiors = base.interiors.map((room) => {
  let layout = room.layout;
  const links = [];
  const pickup = PICKUPS.find((p) => p.interior === room.id);
  if (pickup) {
    const spot = findFloor(layout);
    if (!spot) throw new Error(`no floor in ${room.id} for ${pickup.tool}`);
    layout = stamp(layout, spot[0], spot[1], "S");
    links.push({
      kind: "pickup",
      id: pickup.tool,
      x: spot[0],
      y: spot[1],
      to: null,
      label: TOOL_LABEL[pickup.tool],
    });
  }
  let parent;
  if (room.parent.kind === "hub") parent = { kind: "hub", id: room.parent.id };
  else {
    const door = interiorDoor.get(room.id);
    if (!door) throw new Error(`no overworld door for ${room.id}`);
    parent = { kind: "screen", id: door.id, x: door.x, y: door.y };
  }
  return {
    id: room.id,
    name: room.name,
    purpose: room.purpose,
    layout,
    parent,
    links,
  };
});

const mouths = DUNGEONS.map((dungeon) => {
  const copy = MOUTHS[dungeon.id];
  if (!copy) throw new Error(`no copy for ${dungeon.id}`);
  return {
    id: dungeon.id,
    name: copy[0],
    blurb: copy[1],
    deeper: copy[2],
    era: ERAS.map((era) => {
      const state = dungeonState(dungeon, era);
      return { open: state.open, need: state.need ?? [] };
    }),
  };
});

const tools = Object.keys(TOOL_LABEL).map((id) => {
  const pickup = PICKUPS.find((p) => p.tool === id);
  let hint = "Somewhere in the county.";
  if (pickup?.at) {
    const screenId = ids.get(pickup.at);
    hint = screenId ? names.get(screenId) ?? hint : hint;
  } else if (pickup?.interior) {
    hint = interiorById.get(pickup.interior)?.name ?? hint;
  }
  return { id, label: TOOL_LABEL[id], hint, district: TOOL_DISTRICT[id] };
});

for (const screen of screens) {
  for (const era of screen.eras) {
    for (const dir of ["N", "S", "W", "E"]) {
      const exit = era.exits[dir];
      if (exit && !screenById.has(exit.to)) throw new Error(`${screen.id} ${dir} -> ${exit.to}`);
    }
    for (const link of era.links) {
      if (link.kind === "interior" && !interiors.some((room) => room.id === link.id)) {
        throw new Error(`bad interior link ${link.id}`);
      }
      if (link.kind === "hub" && !hubs.some((hub) => hub.id === link.id)) throw new Error(`bad hub ${link.id}`);
      if (link.kind === "dungeon" && !mouths.some((mouth) => mouth.id === link.id)) {
        throw new Error(`bad mouth ${link.id}`);
      }
      if (link.kind === "span" && !screenById.has(link.to)) throw new Error(`bad span ${link.id}`);
    }
  }
}

const world = {
  v: 1,
  start: START_SCREEN,
  eras: ERAS,
  grid: CARTOGRAM,
  districts: Object.fromEntries(
    Object.entries(DISTRICT_META).map(([id, meta]) => [id, { label: meta.label, color: meta.color, code: meta.code }]),
  ),
  tools,
  changes: ERA_CHANGES.map((change) => ({
    id: change.id,
    era: change.era,
    districts: change.districts,
    summary: change.summary,
  })),
  screens,
  hubs,
  interiors,
  mouths,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(world));
const start = screens.find((s) => s.id === START_SCREEN);
console.log(
  `wrote ${outPath} screens=${screens.length} hubs=${hubs.length} interiors=${interiors.length} mouths=${mouths.length} bytes=${fs.statSync(outPath).size}`,
);
console.log("start tile", start.eras[0].layout[7][10], "row", start.eras[0].layout[7]);
