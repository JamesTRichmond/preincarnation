import type { CatalogEntry, ItemKind } from "./types.ts";

function raw(
  id: string,
  name: string,
  mass: number,
  intendedCatalog: string,
  blurb: string,
  tags: string[] = [],
  kind: ItemKind = "material",
): CatalogEntry {
  return { id, fixture: true, intendedCatalog, name, kind, mass, tags, blurb };
}

/** Ordinary matter. Mass is the conservation unit. */
export const RAW: CatalogEntry[] = [
  raw("fix.mat.twine", "Twine", 2, "objects.ordinary", "Coarse laid cord. The bench's common knot.", ["cord", "fiber"]),
  raw("fix.mat.net-twine", "Net twine", 2, "supplies.fishing", "Tar-touched twine sized for mesh.", ["cord", "fishing", "fiber"]),
  raw("fix.mat.linen-thread", "Linen thread", 1, "objects.ordinary", "Fine thread for whippings and seams.", ["fiber"]),
  raw("fix.mat.fiber", "Loose fiber", 1, "objects.ordinary", "Unspun plant fiber. Doubles where thread is short.", ["fiber"]),
  raw("fix.mat.scrap-wood", "Scrap wood", 4, "objects.ordinary", "Split offcuts, still sound along the grain.", ["wood"]),
  raw("fix.mat.nails", "Nails", 1, "objects.ordinary", "Cut iron nails, mixed lengths.", ["fastener"]),
  raw("fix.mat.iron-rivet", "Iron rivet", 1, "objects.ordinary", "Short rivet. Stands in for a nail.", ["fastener"]),
  raw("fix.mat.brass-screw", "Brass screw", 1, "objects.ordinary", "A small brass screw. Holds without splitting dry wood.", ["fastener"]),
  raw("fix.mat.cloth", "Cloth", 3, "objects.ordinary", "Woven cotton, stained, still whole.", ["cloth"]),
  raw("fix.mat.burlap", "Burlap", 3, "objects.ordinary", "Open weave. Rough against skin.", ["cloth"]),
  raw("fix.mat.rag", "Rag", 2, "objects.ordinary", "A washed rag. Takes oil and soot.", ["cloth"]),
  raw("fix.mat.oil", "Lamp oil", 2, "supplies.lamp", "A small pour of fish-oil. Smells like the river kitchen.", ["lamp", "finish"]),
  raw("fix.mat.beeswax", "Beeswax", 2, "objects.ordinary", "A cake of wax for thread, leather, and wicks.", ["finish"]),
  raw("fix.mat.pitch", "Pitch", 2, "objects.ordinary", "Dark pitch. Seals, and dirties a flame.", ["finish"]),
  raw("fix.mat.cork", "Cork", 2, "supplies.fishing", "A buoyant offcut.", ["fishing", "float"]),
  raw("fix.mat.tin", "Tin sheet", 3, "supplies.lamp", "Thin tin. Cuts, folds, reflects.", ["lamp", "metal"]),
  raw("fix.mat.glass-shard", "Glass shard", 2, "supplies.lamp", "A clean shard, edges knocked down.", ["lamp", "glass"]),
  raw("fix.mat.lead", "Lead", 3, "supplies.fishing", "A soft lump for sinkers. Does not return from the river easily.", ["fishing", "metal"]),
  raw("fix.mat.fishhook", "Fishhook", 1, "supplies.fishing", "A barbless hook blank.", ["fishing"]),
  raw("fix.mat.line", "Fishing line", 1, "supplies.fishing", "Laid line, finer than twine.", ["fishing", "cord"]),
  raw("fix.mat.feather", "Feather", 1, "supplies.hunting", "A stiff vane feather.", ["hunting"]),
  raw("fix.mat.sinew", "Sinew", 2, "supplies.hunting", "Dried sinew. Stronger than twine, less kind to knots.", ["hunting", "fiber"]),
  raw("fix.mat.snare-wire", "Snare wire", 2, "supplies.hunting", "Soft wire that holds a bend.", ["hunting", "metal"]),
  raw("fix.mat.arrow-shaft", "Arrow shaft", 3, "supplies.hunting", "A straight shaft, unfletched.", ["hunting", "wood"]),
  raw("fix.mat.charcoal", "Charcoal", 2, "objects.ordinary", "Dry charcoal. Marks, and starts a careful fire.", ["fire"]),
  raw("fix.mat.resin", "Resin", 2, "objects.ordinary", "Hard resin. Melts into a grip or a seal.", ["finish"]),
  raw("fix.mat.leather", "Leather", 4, "objects.ordinary", "A palm of vegetable-tanned leather.", ["hide"]),
  raw("fix.mat.hide", "Hide scrap", 5, "supplies.hunting", "Stiffer than leather. Works, and looks like it.", ["hide", "hunting"]),
  raw("fix.mat.wick", "Lamp wick", 1, "supplies.lamp", "A cotton wick, untrimmed.", ["lamp"]),
  raw("fix.mat.sand", "Sand", 2, "objects.ordinary", "Fine sand for clay and for knocking edges.", ["grit"]),
  raw("fix.mat.salt", "Salt", 1, "supplies.fishing", "A pinch, for bait and for hide.", ["fishing"]),
  raw("fix.mat.flint", "Flint", 2, "supplies.hunting", "A flake with a cutting edge.", ["hunting", "stone"]),
  raw("fix.mat.tinder", "Tinder", 1, "objects.ordinary", "Shredded bark, dry.", ["fire"]),
  raw("fix.mat.copper-wire", "Copper wire", 2, "supplies.lamp", "Soft copper. Bends into a bail or a coil.", ["lamp", "metal"]),
  raw("fix.mat.bone", "Bone", 2, "supplies.hunting", "A dense splinter of bone.", ["hunting"]),
  raw("fix.mat.antler", "Antler", 3, "supplies.hunting", "A toggle's worth of antler.", ["hunting"]),
  raw("fix.mat.gut", "Gut", 1, "supplies.fishing", "Dried gut for a short leader.", ["fishing"]),
  raw("fix.mat.driftwood", "Driftwood", 5, "objects.ordinary", "River wood, light, already seasoned.", ["wood", "fishing"]),
  raw("fix.mat.reed", "Reed", 2, "supplies.fishing", "A dry reed for creels and poor floats.", ["fishing", "wood"]),
  raw("fix.mat.clay", "Clay", 3, "supplies.lamp", "River clay. Cups a flame if it is fired in the mind only — here it is just worked and dried.", ["lamp"]),
  raw("fix.mat.shell", "Shell", 1, "objects.ordinary", "A thick shell. Poor glass, poorer flint.", ["grit"]),
  raw("fix.mat.ash", "Wood ash", 1, "supplies.hunting", "Cold ash. Kills a little scent.", ["hunting"]),
];

function unique(
  id: string,
  name: string,
  mass: number,
  kind: ItemKind,
  intendedCatalog: string,
  blurb: string,
  tags: string[],
  extra: Partial<CatalogEntry> = {},
): CatalogEntry {
  return { id, fixture: true, intendedCatalog, name, kind, mass, tags, blurb, ...extra };
}

export const TOOLS: CatalogEntry[] = [
  unique(
    "fix.tool.bench-knife",
    "Bench knife",
    6,
    "tool",
    "tools.bench",
    "The knife that stays on the bench. It is not a trophy and it is not for sale.",
    ["tool", "critical", "edge"],
    { critical: true },
  ),
  unique(
    "fix.tool.needle",
    "Bench needle",
    1,
    "tool",
    "tools.bench",
    "A sail needle. Net work waits on it.",
    ["tool", "critical", "fishing"],
    { critical: true },
  ),
  unique(
    "fix.tool.awl",
    "Awl",
    2,
    "tool",
    "tools.bench",
    "For leather and for starting a screw.",
    ["tool", "critical"],
    { critical: true },
  ),
  unique(
    "fix.tool.whetstone",
    "Whetstone",
    5,
    "tool",
    "tools.bench",
    "A small stone. Rinses clean. Does not need another tool to be useful again.",
    ["tool", "critical", "edge"],
    { critical: true },
  ),
];

export const HEIRLOOMS: CatalogEntry[] = [
  unique("fix.heir.oil-lamp", "Grandmother's oil lamp", 15, "heirloom", "heirlooms.household", "Mara Venn's kitchen lamp. The dent in the collar is how it is known.", ["heirloom", "lamp"], ),
  unique("fix.heir.needle", "Father's mending needle", 1, "heirloom", "heirlooms.household", "The needle that mended nets before this bench had one of its own.", ["heirloom", "fishing"]),
  unique("fix.heir.river-knife", "River knife", 7, "heirloom", "heirlooms.household", "Three nicks, three years. Grinding them out would erase the count.", ["heirloom", "edge"]),
  unique("fix.heir.cedar-creel", "Cedar creel", 11, "heirloom", "heirlooms.household", "Initials burned in the lid. The weave is tired at the hinge.", ["heirloom", "fishing"]),
  unique("fix.heir.compass", "Filed compass", 4, "heirloom", "heirlooms.household", "The needle sits a thumb east of north. The case was filed so the error would stay.", ["heirloom"]),
  unique("fix.heir.wool-cloak", "Patched wool cloak", 13, "heirloom", "heirlooms.household", "The elbow patch is from the winter crossing. It is not decorative.", ["heirloom", "hunting"]),
  unique("fix.heir.cane-rod", "Split-cane rod", 12, "heirloom", "heirlooms.household", "Faded silk wraps. One guide is loose. The cane is still the cane.", ["heirloom", "fishing"]),
  unique("fix.heir.locket", "Sealed locket", 2, "heirloom", "heirlooms.household", "Resin in the hinge from the ninth year, so a portrait could survive the river.", ["heirloom"]),
  unique("fix.heir.horn", "Hunting horn", 5, "heirloom", "heirlooms.household", "A crack at the lip. It still speaks, thinner than it did.", ["heirloom", "hunting"]),
  unique("fix.heir.tackle-roll", "Oiled tackle roll", 6, "heirloom", "heirlooms.household", "Canvas roll, pockets labeled in a hand that is not yours yet.", ["heirloom", "fishing"]),
  unique("fix.heir.shears", "Mother's shears", 5, "heirloom", "heirlooms.household", "The pivot is dry. They still know cloth.", ["heirloom"]),
  unique("fix.heir.glass-float", "First-year glass float", 3, "heirloom", "heirlooms.household", "The float from the first drowning year. Not a commodity cork.", ["heirloom", "fishing", "lamp"]),
];

export const QUESTS: CatalogEntry[] = [
  unique(
    "fix.quest.ferry-token",
    "Ferry token",
    2,
    "quest",
    "quest.story",
    "A carved chit for the ferry. The bench may look at it. The bench may not spend it.",
    ["quest"],
    { quest: true },
  ),
  unique(
    "fix.quest.unopened-letter",
    "Unopened letter",
    1,
    "quest",
    "quest.story",
    "Still sealed. Opening it is not a bench operation.",
    ["quest"],
    { quest: true },
  ),
  unique(
    "fix.quest.red-strand",
    "Red strand",
    1,
    "quest",
    "quest.story",
    "A promise tied in red. Cutting it would strand a return.",
    ["quest"],
    { quest: true },
  ),
];

export const SALVAGE: CatalogEntry[] = [
  raw(
    "fix.salvage.bottle",
    "Cracked bottle",
    5,
    "objects.salvage",
    "A river bottle. Glass is what it still owes you.",
    ["salvage-pile", "glass", "lamp"],
    "part",
  ),
  raw(
    "fix.salvage.tin-can",
    "Tin can",
    4,
    "objects.salvage",
    "A crushed can. One sheet's worth if you are patient, and you will not get the paint.",
    ["salvage-pile", "lamp", "metal"],
    "part",
  ),
];

export const BASE_CATALOG: CatalogEntry[] = [...RAW, ...TOOLS, ...HEIRLOOMS, ...QUESTS, ...SALVAGE];

export function indexCatalog(items: CatalogEntry[]): Map<string, CatalogEntry> {
  const map = new Map<string, CatalogEntry>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`duplicate catalog id ${item.id}`);
    if (item.mass <= 0 || !Number.isInteger(item.mass)) throw new Error(`bad mass ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}
