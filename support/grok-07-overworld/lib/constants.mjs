/** Reference grid for the PREINCARNATION overworld pack.
 * Conversion: one screen is SCREEN_W by SCREEN_H tiles.
 * Tile pixel size is TILE_PX. Row 0 is north, column 0 is west.
 * Exit mouths are the tiles listed in MOUTHS. A neighboring screen,
 * if linked, sits on the shared cartogram edge unless the link is a span.
 */

export const SCREEN_W = 20;
export const SCREEN_H = 14;
export const TILE_PX = 16;

export const ERAS = [0, 14, 28, 42, 56, 70];

export const TOOLS = [
  "ledger_key",
  "creek_boots",
  "ledge_iron",
  "falls_line",
  "sugar_tap",
  "orchard_ladder",
  "quarry_lamp",
  "frost_notch",
  "glass_shard",
  "void_oar",
];

export const TOOL_LABEL = {
  ledger_key: "Ledger Key",
  creek_boots: "Creek Boots",
  ledge_iron: "Ledge Iron",
  falls_line: "Falls Line",
  sugar_tap: "Sugar Tap",
  orchard_ladder: "Orchard Ladder",
  quarry_lamp: "Quarry Lamp",
  frost_notch: "Frost Notch",
  glass_shard: "Glass Shard",
  void_oar: "Void Oar",
};

/** Walkable with no tool. */
export const OPEN_TILES = new Set(list(".,tp-fDHWSdb@y"));

export const SOLID_TILES = new Set(list("#TB+rxo"));

export const TILE_NEED = {
  m: ["creek_boots"],
  "~": ["creek_boots"],
  c: ["creek_boots"],
  "=": ["void_oar"],
  v: ["void_oar"],
  "^": ["ledge_iron"],
  l: ["orchard_ladder"],
  n: ["frost_notch"],
};

export const TILE_NAME = {
  ".": "meadow",
  ",": "brush",
  t: "open woods",
  p: "road",
  "-": "track",
  f: "village floor",
  D: "interior door",
  H: "hub threshold",
  W: "glass-warp pad",
  S: "sign",
  d: "dungeon mouth",
  b: "bridge",
  "@": "landmark",
  y: "quarry floor",
  m: "marsh (Creek Boots)",
  "~": "shallow creek (Creek Boots)",
  c: "ford (Creek Boots)",
  "=": "deep water (Void Oar)",
  v: "void seam (Void Oar)",
  "^": "climb (Ledge Iron)",
  l: "trellis (Orchard Ladder)",
  n: "windwall (Frost Notch)",
  "#": "wall",
  T: "dense tree",
  B: "structure",
  "+": "fence",
  r: "boulder",
  x: "rubble",
  o: "orchard trunk",
  u: "one-way chute",
  G: "tool gate",
};

export const MOUTHS = {
  N: [8, 9, 10, 11].map((x) => [x, 0]),
  S: [8, 9, 10, 11].map((x) => [x, SCREEN_H - 1]),
  W: [5, 6, 7, 8].map((y) => [0, y]),
  E: [5, 6, 7, 8].map((y) => [SCREEN_W - 1, y]),
};

export const DIRS = {
  N: [0, -1],
  S: [0, 1],
  W: [-1, 0],
  E: [1, 0],
};

export const OPP = { N: "S", S: "N", E: "W", W: "E" };

export const DISTRICT_META = {
  ferrisburgh: { code: "F", prefix: "FER", label: "Ferrisburgh marsh crossings", color: "#2f6f62" },
  new_haven: { code: "N", prefix: "NHV", label: "New Haven fields", color: "#c4a15a" },
  bristol: { code: "B", prefix: "BRI", label: "Bristol ledges", color: "#7a6552" },
  lincoln: { code: "L", prefix: "LIN", label: "Lincoln sugar slopes", color: "#3f6b38" },
  west_lakeshore: { code: "W", prefix: "WLS", label: "Western lakeshore", color: "#3d7598" },
  vergennes: { code: "V", prefix: "VER", label: "Vergennes falls", color: "#8d4b3c" },
  quarry: { code: "Q", prefix: "QRY", label: "Central quarry country", color: "#6e675c" },
  middlebury: { code: "M", prefix: "MID", label: "Middlebury college terraces", color: "#2c4f7a" },
  ripton: { code: "R", prefix: "RIP", label: "Ripton high woods", color: "#1d4a34" },
  shoreham: { code: "H", prefix: "SHO", label: "Shoreham orchards", color: "#7c8f3c" },
  salisbury: { code: "S", prefix: "SAL", label: "Salisbury lakes", color: "#3c7ea3" },
  orwell: { code: "O", prefix: "ORW", label: "Orwell southern farms", color: "#8d7344" },
};

export const CODE_TO_DISTRICT = Object.fromEntries(
  Object.entries(DISTRICT_META).map(([id, meta]) => [meta.code, id]),
);

export const START_SCREEN = "MID-13";

function list(chars) {
  return chars.split("");
}
