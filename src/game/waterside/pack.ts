/**
 * Waterside recovery finds for Otter Creek and the landings.
 * Five written objects and ten situations. Not placed on a map.
 * The Marble Vein stays the only plot. These finds only quiet an
 * echo or help tools the county already has.
 *
 * Shovel is the grave shovel. Creek fins are the flippers.
 * The sugar-line is the hookshot. "fishing" is the creek life
 * (LifePath "fisher"), not a relic and not a new minigame.
 * Nothing here is written into the save.
 */
import type { RelicId } from "../items.ts";

export const WATERSIDE_TOOLS = ["fishing", "creek-fins", "sugar-line", "shovel"] as const;

export type WatersideTool = (typeof WATERSIDE_TOOLS)[number];

/** County relic for a catalog label. Null is the creek life, not a new relic. */
export const WATERSIDE_TOOL_RELIC: Record<WatersideTool, RelicId | null> = {
  fishing: null,
  "creek-fins": "flippers",
  "sugar-line": "hookshot",
  shovel: "shovel",
};

export type WatersideUse = { id: string; text: string };

export type WatersideObject = {
  id: string;
  name: string;
  category: string;
  source: string;
  retrieval: {
    interaction: string;
    tools: WatersideTool[];
    puzzle?: string;
    breath: number;
  };
  uses: WatersideUse[];
  provenance: string;
  restoration: string;
  era: { original: string; reincarnation: string };
  uniqueKey: string;
};

export type WatersideSituation = {
  id: string;
  name: string;
  waterClass: string;
  breathUnits: number;
  dryExit: boolean;
  puzzle: { id: string; solution: string };
  toolsRequired: WatersideTool[];
  prose: { original: string; reincarnation: string };
};

export const WATERSIDE_OBJECTS: WatersideObject[] = [
  {
    id: "loot.expansion.water.012",
    name: "Sugarhouse Cleat",
    category: "boat-fitting",
    source: "Bolted to the half-submerged beam at the Weybridge landing.",
    retrieval: {
      interaction: "Dig silt from the bolt with the shovel, then free it with the creek fins. Align the three remaining sugar-line pegs.",
      tools: ["shovel", "creek-fins"],
      puzzle: "align-sugar-pegs",
      breath: 4,
    },
    uses: [
      { id: "moor", text: "Tie off a line you already carry. It does not put a boat in the water." },
      { id: "quiet", text: "Set on the bank, it quiets a Vein-echo that was snagging the fishing puzzle." },
    ],
    provenance: "Ainsworth sugarhouse. A burned maple leaf is on the bolt.",
    restoration: "Clean the silt, oil the bolt, seat it again. After fourteen winters the metal remembers the last sugar-run.",
    era: {
      original: "Sound hardware for buckets and the occasional skiff.",
      reincarnation: "The metal holds the last sugar-run. Listening to it shows where the old line entered the creek.",
    },
    uniqueKey: "ainsworth-cleat-weybridge",
  },
  {
    id: "loot.expansion.water.027",
    name: "Sealed Mason Jar",
    category: "sealed-container",
    source: "Still sealed in the deep hole below the abandoned landing.",
    retrieval: {
      interaction: "Set the net, then the fins. Surface between tries. Land it on the bank, not in the current.",
      tools: ["fishing", "creek-fins"],
      breath: 5,
    },
    uses: [
      { id: "bait", text: "The syrup film on the glass sweetens bait for the tackle you already use." },
      { id: "filter", text: "After fourteen winters the chill in the jar shows a second silted path through a water puzzle." },
    ],
    provenance: "Pencil on the glass: Ainsworth, batch for the landing crew.",
    restoration: "Wipe the silt. Warm the seal before you open it, or the glass goes.",
    era: {
      original: "Syrup. Food for the crew.",
      reincarnation: "The cold in the jar can quiet a net that keeps snagging the wrong memory.",
    },
    uniqueKey: "ainsworth-jar-12",
  },
  {
    id: "loot.expansion.water.041",
    name: "Vein-touched Net Weight",
    category: "fishing-equipment",
    source: "The flooded boat shed at the sugarhouse landing.",
    retrieval: {
      interaction: "Shovel the doorway silt. Fins for the shallow flood. Clear three boards in order.",
      tools: ["shovel", "creek-fins"],
      puzzle: "clear-boards",
      breath: 6,
    },
    uses: [
      { id: "bind-net", text: "Bind it to the net you have so willow roots snag less. Same fishing, fewer hangs." },
      { id: "listen", text: "After fourteen winters it hums with a sealed container nearby, so you can lift that one without tearing the seal." },
    ],
    provenance: "Same burned maple as the cleat. Ainsworth landing kit, used the morning the water rose.",
    restoration: "Dry it. A light polish. Too much and the sheen goes dull.",
    era: {
      original: "A weight.",
      reincarnation: "The sheen drifts true for one landing, then it is only lead again.",
    },
    uniqueKey: "ainsworth-weight-vein",
  },
  {
    id: "loot.expansion.water.055",
    name: "Sugar-Maker's Knife",
    category: "lost-personal",
    source: "Caught on the sugar-line near the weir, still sheathed.",
    retrieval: {
      interaction: "Free it with the sugar-line. Do not cut the line to get it.",
      tools: ["sugar-line"],
      breath: 3,
    },
    uses: [
      { id: "cut-net", text: "Cuts a tangle out of a net you already set." },
      { id: "align", text: "Wet, the etch lines up with the other maple marks and shows a dry step through a flooded room." },
    ],
    provenance: "Initials A.R. burned into the handle. The Ainsworth sugar-maker.",
    restoration: "Clean, oil the blade, seat the sheath rivet.",
    era: {
      original: "Opens buckets and cuts line.",
      reincarnation: "The wet etch can quiet a Vein-touched puzzle for one breath.",
    },
    uniqueKey: "ainsworth-knife",
  },
  {
    id: "loot.expansion.water.068",
    name: "Beeswax Tin of Twine",
    category: "sealed-container",
    source: "Under a beam in the flooded barn. The wax is still on it.",
    retrieval: {
      interaction: "Shovel and a beam order. Leave the seal whole until you are on dry boards.",
      tools: ["shovel"],
      puzzle: "beam-order",
      breath: 4,
    },
    uses: [
      { id: "repair", text: "The twine repairs a net or a line you already own." },
      { id: "lure", text: "Maple smoke in the wax is a lure for the fishing you already do." },
    ],
    provenance: "Ainsworth landing kit, sealed the morning of the high water.",
    restoration: "Warm the wax. Open the tin without cracking it. Dry the twine.",
    era: {
      original: "Repair twine.",
      reincarnation: "Set on warm stone, the wax chill quiets a nearby sheen.",
    },
    uniqueKey: "ainsworth-twine-tin",
  },
];

export const WATERSIDE_SITUATIONS: WatersideSituation[] = [
  {
    id: "sit.01.weybridge-landing",
    name: "Weybridge Abandoned Landing",
    waterClass: "creek-landing",
    breathUnits: 8,
    dryExit: true,
    puzzle: { id: "align-sugar-pegs", solution: "three-pegs-north" },
    toolsRequired: ["creek-fins", "shovel"],
    prose: {
      original: "A working landing. Cleats are sound. The creek is clear in the shallows, and the sugar-line still holds a few empty buckets.",
      reincarnation: "Willows have the bank. The landing is half under spring silt. A cold shimmer sits where the old sugar-line entered. Breath comes shorter.",
    },
  },
  {
    id: "sit.02.sugarhouse-weir",
    name: "Sugarhouse Weir",
    waterClass: "weir-pool",
    breathUnits: 6,
    dryExit: true,
    puzzle: { id: "valve-sequence", solution: "open-close-open" },
    toolsRequired: ["sugar-line", "shovel"],
    prose: {
      original: "The weir still holds water for the evaporator. The valve is stiff. Fish sit in the quiet pool above the boards.",
      reincarnation: "The boards have rotted. The pool is tea-colored. A sealed jar of maple sits under the collapsed valve, untouched for fourteen winters.",
    },
  },
  {
    id: "sit.03.flooded-barn",
    name: "Flooded Dairy Barn",
    waterClass: "flooded-interior",
    breathUnits: 10,
    dryExit: false,
    puzzle: { id: "stall-latches", solution: "left-right-center" },
    toolsRequired: ["creek-fins", "fishing"],
    prose: {
      original: "Spring flood is in the lower barn. Stalls are knee-deep. The milk cans still float.",
      reincarnation: "The barn has settled. Fourteen years of silt cover the floorboards. A tin cup and a milking stool sit on a high beam.",
    },
  },
  {
    id: "sit.04.net-tangle",
    name: "Net Tangle at the Bend",
    waterClass: "net-set",
    breathUnits: 5,
    dryExit: true,
    puzzle: { id: "untangle-lead", solution: "cut-third-lead" },
    toolsRequired: ["fishing", "sugar-line"],
    prose: {
      original: "A gill net is on a root. The leads are bright. A few fish are still in it.",
      reincarnation: "The mesh is almost gone. Brass rings wind through willow that grew through it. Something heavier is deeper.",
    },
  },
  {
    id: "sit.05.underwater-channel",
    name: "Approved Underwater Channel",
    waterClass: "underwater-approved",
    breathUnits: 12,
    dryExit: true,
    puzzle: { id: "current-markers", solution: "follow-three-stones" },
    toolsRequired: ["creek-fins"],
    prose: {
      original: "A short clear channel under the bridge. Stay low and the current is manageable.",
      reincarnation: "The channel is deeper and darker. A Vein-cold pocket sits by the third stone. Count the breath. There is no dry step once you are under.",
    },
  },
  {
    id: "sit.06.abandoned-boat-slip",
    name: "Abandoned Boat Slip",
    waterClass: "slip",
    breathUnits: 7,
    dryExit: true,
    puzzle: { id: "cleat-order", solution: "starboard-first" },
    toolsRequired: ["shovel", "creek-fins"],
    prose: {
      original: "Wooden cleats and a half-sunk skiff. The fittings come up in your hands. They do not put you on the water.",
      reincarnation: "The skiff is gone. Bronze fittings and a waterlogged logbook are under the silt. The fittings remember the last mooring.",
    },
  },
  {
    id: "sit.07.personal-loss-pool",
    name: "Personal Loss Pool",
    waterClass: "quiet-pool",
    breathUnits: 9,
    dryExit: true,
    puzzle: { id: "memory-stones", solution: "place-three-pebbles" },
    toolsRequired: ["shovel"],
    prose: {
      original: "A quiet eddy where someone lost a thing in the last high water. Soft mud.",
      reincarnation: "The eddy keeps names. Restoration sometimes gives one back.",
    },
  },
  {
    id: "sit.08.sealed-cache",
    name: "Sealed Cache under the Landing",
    waterClass: "under-landing",
    breathUnits: 11,
    dryExit: true,
    puzzle: { id: "jar-seal", solution: "warm-then-twist" },
    toolsRequired: ["creek-fins", "shovel"],
    prose: {
      original: "Sealed tins under the landing boards. The wax is still good.",
      reincarnation: "The boards have shifted. One jar has a hairline crack and a faint Vein-glow on the seal.",
    },
  },
  {
    id: "sit.09.unusual-catch-hole",
    name: "Unusual Catch Hole",
    waterClass: "deep-hole",
    breathUnits: 8,
    dryExit: true,
    puzzle: { id: "weight-balance", solution: "match-lead-to-float" },
    toolsRequired: ["fishing"],
    prose: {
      original: "A deep hole. The line sometimes brings up more than fish. Rocky bottom.",
      reincarnation: "The hole has grown. What comes up has been down long enough to change, and some of it restores into tackle.",
    },
  },
  {
    id: "sit.10.vein-touched-eddy",
    name: "Vein-Touched Eddy",
    waterClass: "vein-eddy",
    breathUnits: 14,
    dryExit: true,
    puzzle: { id: "quiet-the-cold", solution: "place-restored-object" },
    toolsRequired: ["creek-fins", "sugar-line"],
    prose: {
      original: "An eddy colder than it should be. People avoid it after dark.",
      reincarnation: "The Vein has settled here. A restored find from this eddy can quiet another echo. The cold takes breath faster.",
    },
  },
];

const TOOL_SET = new Set<string>(WATERSIDE_TOOLS);

export function watersideProblems(
  objects: WatersideObject[] = WATERSIDE_OBJECTS,
  situations: WatersideSituation[] = WATERSIDE_SITUATIONS,
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const keys = new Set<string>();
  for (const object of objects) {
    if (ids.has(object.id)) problems.push(`duplicate id ${object.id}`);
    ids.add(object.id);
    if (keys.has(object.uniqueKey)) problems.push(`duplicate key ${object.uniqueKey}`);
    keys.add(object.uniqueKey);
    if (object.uses.length < 2) problems.push(`${object.id} needs two uses`);
    if (object.uses.some((use) => /\b(sell|coin|shop)\b/i.test(use.text))) {
      problems.push(`${object.id} is only a sale`);
    }
    if (!object.era.original.trim() || !object.era.reincarnation.trim()) {
      problems.push(`${object.id} missing an era`);
    }
    if (object.era.original === object.era.reincarnation) {
      problems.push(`${object.id} eras match`);
    }
    if (!object.provenance.trim()) problems.push(`${object.id} has no provenance`);
    for (const tool of object.retrieval.tools) {
      if (!TOOL_SET.has(tool)) problems.push(`${object.id} tool ${tool}`);
    }
  }
  const situationIds = new Set<string>();
  for (const situation of situations) {
    if (situationIds.has(situation.id)) problems.push(`duplicate situation ${situation.id}`);
    situationIds.add(situation.id);
    if (!situation.prose.original.trim() || !situation.prose.reincarnation.trim()) {
      problems.push(`${situation.id} missing prose`);
    }
    if (situation.breathUnits < 1) problems.push(`${situation.id} has no breath`);
    for (const tool of situation.toolsRequired) {
      if (!TOOL_SET.has(tool)) problems.push(`${situation.id} tool ${tool}`);
    }
  }
  return problems;
}
