import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expandRoom, carve } from "./lib.mjs";
import { dg13 } from "./dg13.mjs";
import { dg14 } from "./dg14.mjs";
import { dg15 } from "./dg15.mjs";
import { dg16 } from "./dg16.mjs";
import { endings, porch } from "./endings.mjs";
import {
  bosses,
  climax,
  deathRules,
  decisions,
  eligibility,
  embryonic,
  tools,
  WITNESS_ROOMS,
} from "./machines.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const content = join(root, "content");
const systems = join(root, "systems");
mkdirSync(content, { recursive: true });
mkdirSync(systems, { recursive: true });

function dump(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function pack(id, name, rooms) {
  return {
    id,
    name,
    mappingStatus: "PENDING",
    rooms: rooms.map(expandRoom),
  };
}

dump(join(content, "dg13.json"), pack("DG13", "The House Built Out of Names", dg13));
dump(join(content, "dg14.json"), pack("DG14", "Snow Under the Lake", dg14));
dump(join(content, "dg15.json"), pack("DG15", "The Unborn Foundry", dg15));
dump(join(content, "dg16.json"), pack("DG16", "The Heart of the Marble Vein", dg16));

const porchOut = {
  ...porch,
  bounds: { ...porch.bounds, unit: "tile" },
  legend: {
    "#": "wall",
    ".": "floor",
    D: "door",
    "~": "water",
    V: "void",
    "=": "ice",
    ",": "snow",
    ":": "bridge",
    "+": "marked-station",
  },
  layout: { rows: carve(porch) },
};
dump(join(content, "epilogue.json"), porchOut);
dump(join(content, "endings.json"), {
  mappingStatus: "PENDING",
  note: "Four commits. Eligibility may overlap. campaign.ending is a single field. Sequences are the playable selection plus eight county scenes plus credits.",
  endings,
});
dump(join(content, "tools.json"), tools);
dump(join(content, "decisions.json"), decisions);
dump(join(systems, "eligibility.json"), eligibility);
dump(join(systems, "witnesses.json"), { witnesses: WITNESS_ROOMS });
dump(join(systems, "bosses.json"), bosses);
dump(join(systems, "climax.json"), climax);
dump(join(systems, "death.json"), deathRules);
dump(join(systems, "embryonic.json"), embryonic);

const counts = {
  DG13: dg13.length,
  DG14: dg14.length,
  DG15: dg15.length,
  DG16: dg16.length,
  total: dg13.length + dg14.length + dg15.length + dg16.length,
};
dump(join(content, "counts.json"), counts);
console.log(JSON.stringify(counts));
