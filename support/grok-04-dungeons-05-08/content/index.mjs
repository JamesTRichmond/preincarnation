import { layersFromFloor, objectsLayer, resolveGrid } from "./lib.mjs";
import { dg05 } from "./dg05.mjs";
import { dg06 } from "./dg06.mjs";
import { dg07 } from "./dg07.mjs";
import { dg08 } from "./dg08.mjs";

export const TOOLS = [
  { id: "lamp", use: "Reveals marble-dust ink and can be set on a sconce. Not a weapon required by any boss." },
  { id: "hammer", use: "Optional. Cracks a marked marble wall in the White Library." },
  { id: "sugarLine", use: "Hookshot-like line. Optional fetches. Never the only walk." },
  { id: "blockRod", use: "Pushes or pulls a railed block one post from the tile Ellis can stand on. Required in the Iron Hayloft." },
  { id: "creekFins", use: "Swim permanent deep water. Never required in DG06." },
  { id: "cape", use: "Optional glide onto hay or a beam in the same room." },
  { id: "bow", use: "Optional blunt shot at a candle that can also be walked to." },
  { id: "shovel", use: "Optional dust. No required cache." },
  { id: "boots", use: "Optional brace against the hayloft fan. The lever is the real stop." },
  { id: "net", use: "Optional scoop. The reservoir's readable card reaches a dry notch without it." },
  { id: "glassWarp", use: "Optional step between two panes in the witness benches." },
  { id: "powderKeg", use: "Optional crack in the powder loft. Not a key." },
];

export const MYTHOLOGY = {
  setting: "Addison County, Vermont only. No other county is entered.",
  protagonist: {
    name: "Ellis Perch",
    rule: "The same person continues in the next body. Each death advances fourteen years. Geometry does not.",
  },
  marbleVein: {
    role: "Stores unrealized lives. The White Library is a county filing of that store, not the vein itself.",
  },
  voices: {
    voice: "Treats the vein as a debt of unlived years and a crown as acknowledgment.",
    otherVoice: "Treats the same mythology as an office's excuse for calling a person a measurement error.",
    rule: "They interpret one mythology. They are not two religions and not a party of companions.",
  },
  surveyor: {
    role: "An inherited human office that tries to eliminate uncertainty by perfect measurement, including entering zero where a life resumes without a birth.",
  },
};

export const SECOND_CROWN = {
  id: "integration.secondCrown",
  kind: "proposed-integration-event",
  notAnExistingRuntimeApi: true,
  doNotCallAsExistingApi: true,
  status: "proposed",
  eventName: "preincarnation.crown.resolved",
  summary:
    "When the Witness Without a Face adjourns and the playable record plus the docket contradiction are in hand, crown 2 (the Lantern Crown) is resolved. This is a proposal for a later integration. Nothing in this pack is a function the current runtime already exports.",
  when: {
    flags: ["dg08.boss", "dg08.record", "dg08.crown2.resolved"],
    evidence: ["dg08.ev.playable", "dg08.ev.contradiction"],
  },
  payload: {
    crown: 2,
    name: "The Lantern Crown",
    holder: "Ellis Perch",
    sourceDungeon: "dg08",
    town: "Vergennes",
    contributesTo: "eligibility.embryonicGod",
    grantsEmbryonicGod: false,
    doesNotGrantByItself: true,
  },
  crown1: {
    definedInThisPack: false,
    id: "prior.crown.1",
    note: "Crown 1 is outside DG05–DG08. This pack must not be read as creating it.",
  },
  eligibilityRuleProposed: {
    id: "eligibility.embryonicGod",
    grantsNow: false,
    proposedFormula:
      "A later system may treat Embryonic God as eligible only when resolved crown count is at least 2, the Marble Vein has been acknowledged as holding unrealized lives, and both the Voice and the Other Voice have been recorded contradicting the Surveyor on the same event. This pack supplies crown 2 and the contradiction evidence dg08.ev.contradiction (the docket in Vergennes) plus the library and reservoir and hayloft as earlier contradictions. It does not flip a global eligibility bit and it does not define the function that would.",
    evidenceThisPackContributes: [
      "dg08.ev.contradiction",
      "dg08.ev.playable",
      "dg08.ev.adjourned",
      "dg05.ev.voiceSplit",
      "dg06.ev.sermon",
      "dg07.ev.palm",
    ],
  },
};

function materializeRoom(dungeon, room) {
  const marks = [];
  if (room.spawn) marks.push({ x: room.spawn.x, y: room.spawn.y, glyph: "S" });
  for (const e of room.exits) marks.push({ x: e.x, y: e.y, glyph: "X" });
  for (const i of room.interactions) marks.push({ x: i.x, y: i.y, glyph: "i" });
  for (const enc of room.encounters || []) {
    for (const [x, y] of enc.tiles) marks.push({ x, y, glyph: "e" });
  }
  const base = layersFromFloor(room.floor);
  base.objects = objectsLayer(room.floor, marks);
  room.layers = base;
  if (dungeon.levels) {
    room.layersByLevel = {};
    for (const level of dungeon.levels) {
      const floor = resolveGrid(room.floor, level);
      const layers = layersFromFloor(floor);
      layers.objects = objectsLayer(floor, marks);
      room.layersByLevel[String(level)] = layers;
    }
  }
  room.coord = "x right, y down, origin northwest";
}

export function buildPack() {
  const dungeons = [dg05, dg06, dg07, dg08];
  for (const d of dungeons) for (const room of d.rooms) materializeRoom(d, room);
  return {
    meta: {
      pack: "preincarnation-dg05-dg08",
      session: "grok-04-dungeons-05-08",
      engine: "engine-neutral",
      designValidationIsNotEnginePlaytesting: true,
      copiedContent: false,
      proceduralGeneration: false,
      party: false,
      craftingEconomy: false,
      objectiveMarkers: false,
      combat: "four-direction",
      county: "Addison County, Vermont",
    },
    tools: TOOLS,
    mythology: MYTHOLOGY,
    integrationEvents: [SECOND_CROWN],
    campaign: {
      proposedOrder: ["dg05", "dg06", "dg07", "dg08", "integration.secondCrown"],
      note: "Links are proposals. Standalone entry grants the previous dungeon's goal flag without simulating that dungeon.",
    },
    dungeons,
  };
}
