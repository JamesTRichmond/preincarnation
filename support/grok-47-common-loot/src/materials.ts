/** Bulk yields. These are not loot records and cannot be sold as a category. */

export type Material = {
  id: string;
  name: string;
  note: string;
};

export const MATERIALS: Material[] = [
  { id: "mat.copper-scrap", name: "Copper scrap", note: "Sheet or cast bits, not a fitting." },
  { id: "mat.tin-scrap", name: "Tin scrap", note: "Thin sheet from a vessel or a box." },
  { id: "mat.iron-scrap", name: "Iron scrap", note: "Wrought or cast fragments." },
  { id: "mat.steel-scrap", name: "Steel scrap", note: "Tool steel and mild offcuts." },
  { id: "mat.bronze-scrap", name: "Bronze scrap", note: "Brown alloy from boat hardware." },
  { id: "mat.brass-scrap", name: "Brass scrap", note: "Yellow alloy from lamps and keys." },
  { id: "mat.lead-scrap", name: "Lead scrap", note: "Soft weight. Keep it off the stove and out of food." },
  { id: "mat.glass-cullet", name: "Glass cullet", note: "Broken but still sharp. Wrap it." },
  { id: "mat.linen-fiber", name: "Linen fiber", note: "Short threads, good for packing, poor for a life-line." },
  { id: "mat.cotton-fiber", name: "Cotton fiber", note: "Wick, rag, and tinder stock." },
  { id: "mat.wool-fiber", name: "Wool fiber", note: "Felted scraps. They hold grease and warmth." },
  { id: "mat.leather-offcut", name: "Leather offcut", note: "Strap or sole leather, dry." },
  { id: "mat.hardwood-offcut", name: "Hardwood offcut", note: "Maple, oak, or hickory, short." },
  { id: "mat.softwood-offcut", name: "Softwood offcut", note: "Pine or spruce, short and resinous." },
  { id: "mat.oakum-fiber", name: "Oakum fiber", note: "Tarred hemp already pulled apart." },
  { id: "mat.beeswax", name: "Beeswax bits", note: "Scraps that will melt again." },
  { id: "mat.pine-tar", name: "Pine tar residue", note: "Sticky, still useful on a seam." },
  { id: "mat.linseed", name: "Linseed sludge", note: "The last of a tin. It skins over fast." },
  { id: "mat.paper", name: "Paper scrap", note: "Undated sheets only. Dated pages are not fuel." },
  { id: "mat.card", name: "Card stock", note: "Stiff paper, useful as a shim." },
  { id: "mat.slate-chip", name: "Slate chip", note: "A thin piece that still takes a pencil." },
  { id: "mat.stone-dust", name: "Stone dust", note: "Grit for scouring, not for eating." },
  { id: "mat.ceramic-sherd", name: "Ceramic sherd", note: "Crock or jug, glazed on one face." },
  { id: "mat.rubber", name: "Rubber bit", note: "Eraser or gasket stock." },
  { id: "mat.kapok", name: "Kapok stuffing", note: "Float fill. Removing it ruins the vest." },
  { id: "mat.ash", name: "Wood ash", note: "From a stove, cold." },
  { id: "mat.char", name: "Char", note: "Half-burned fatwood or coal." },
  { id: "mat.nail", name: "Loose nail", note: "One fastening, not a box." },
  { id: "mat.button", name: "Loose button", note: "Horn, bone, or shell." },
  { id: "mat.cork", name: "Cork crumb", note: "Too small to stopper a bottle." },
  { id: "mat.wick", name: "Wick cotton", note: "A short length, still dry." },
  { id: "mat.ink", name: "Ink residue", note: "Dried in the well. A drop might still write." },
  { id: "mat.salt", name: "Salt grains", note: "Coarse. Keep them out of an unwashed pot." },
  { id: "mat.lime", name: "Lime wash", note: "Dried whitewash. It burns wet skin." },
  { id: "mat.wire", name: "Wire scrap", note: "Iron or baling wire, short." },
  { id: "mat.hemp", name: "Hemp yarn", note: "Unlaid from a line." },
  { id: "mat.canvas", name: "Canvas scrap", note: "Sail or bag cloth." },
  { id: "mat.burlap", name: "Burlap scrap", note: "Coarse jute." },
  { id: "mat.kerosene-residue", name: "Kerosene residue", note: "Not drinkable. Stale fuel varnishes." },
  { id: "mat.tallow", name: "Tallow", note: "Animal fat, clean enough for leather, not for a wick you trust." },
  { id: "mat.graphite", name: "Graphite dust", note: "From a pencil or a carbon sheet." },
  { id: "mat.felt", name: "Felt pad", note: "Chalk-loaded or blotter felt." },
  { id: "mat.brick-chip", name: "Brick chip", note: "A fragment of a common brick." },
  { id: "mat.porcelain", name: "Porcelain chip", note: "From a knob or an insulator." },
  { id: "mat.mesh", name: "Wire mesh", note: "A small piece of screen." },
];

export const MATERIAL_IDS = new Set(MATERIALS.map((m) => m.id));

export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}
