import { catalog, catalogById } from "./book.ts";
import type { BenchState, HistoryEvent, ItemInstance, Provenance } from "./types.ts";
import { isStackableKind } from "./types.ts";

let seq = 1;

function nextId(): string {
  seq += 1;
  return `inst-${seq}`;
}

function pile(catalogId: string, qty: number, condition = 80): ItemInstance {
  const entry = catalogById.get(catalogId);
  if (!entry) throw new Error(`seed missing ${catalogId}`);
  const id = nextId();
  return {
    instanceId: id,
    catalogId,
    qty,
    condition,
    provenance: {
      origin: "found",
      cycle: 14,
      notes: ["In the fourteenth-year kit."],
      parentInstanceIds: [],
      identityKey: `id.pile.${catalogId}.${id}`,
    },
    mods: [],
    history: [{ cycle: 14, text: "Counted into the kit." }],
    favorite: false,
    locked: false,
  };
}

function piece(
  catalogId: string,
  condition: number,
  provenance: Provenance,
  history: HistoryEvent[],
  favorite = false,
): ItemInstance {
  const entry = catalogById.get(catalogId);
  if (!entry) throw new Error(`seed missing ${catalogId}`);
  return {
    instanceId: nextId(),
    catalogId,
    qty: 1,
    condition,
    provenance,
    mods: [],
    history,
    favorite,
    locked: false,
  };
}

function life(
  key: string,
  bearer: string,
  origin: Provenance["origin"],
  notes: string[],
): Provenance {
  return { origin, bearer, cycle: 14, notes, parentInstanceIds: [], identityKey: key };
}

export function createInitialBench(): BenchState {
  seq = 1;
  const items: ItemInstance[] = [];

  for (const entry of catalog) {
    if (!isStackableKind(entry.kind)) continue;
    if (entry.tags.includes("salvage-pile")) continue;
    if (entry.kind === "part") continue;
    const qty = entry.kind === "material" ? 24 : entry.tags.includes("gear") ? 1 : 2;
    if (entry.kind === "gear") continue;
    items.push(pile(entry.id, entry.kind === "supply" ? 2 : 24, entry.kind === "supply" ? 70 : 90));
    void qty;
  }

  items.push(pile("fix.salvage.bottle", 40, 30));
  items.push(pile("fix.salvage.tin-can", 36, 35));
  items.push(pile("fix.sup.feather-bundle", 12, 60));
  items.push(pile("fix.sup.fiber-hank", 10, 60));
  items.push(pile("fix.sup.reed-bundle", 8, 60));
  items.push(pile("fix.sup.rag-bundle", 12, 60));
  items.push(pile("fix.sup.bone-bundle", 8, 60));

  const gear: [string, number][] = [
    ["fix.gear.net", 44],
    ["fix.gear.rod", 51],
    ["fix.gear.lantern", 46],
    ["fix.gear.boots", 40],
    ["fix.gear.cloak", 48],
    ["fix.gear.bow", 42],
    ["fix.gear.spear", 55],
    ["fix.gear.creel", 38],
    ["fix.gear.belt-knife", 36],
    ["fix.gear.gaff", 50],
    ["fix.gear.pack", 47],
  ];
  for (const [id, condition] of gear) {
    items.push(
      piece(id, condition, life(`id.gear.${id}`, undefined as unknown as string, "found", ["Ordinary kit. Not an heirloom."]), [
        { cycle: 14, text: "Taken up as working gear, not as a named object." },
      ]),
    );
  }

  items.push(
    piece("fix.tool.bench-knife", 72, life("id.tool.bench-knife", "the bench", "found", ["Stays on the bench."]), [
      { cycle: 14, text: "The knife that does not leave with you." },
    ]),
  );
  items.push(
    piece("fix.tool.needle", 80, life("id.tool.needle", "the bench", "found", ["Sail needle."]), [
      { cycle: 14, text: "Threaded once this year and put back." },
    ]),
  );
  items.push(
    piece("fix.tool.awl", 76, life("id.tool.awl", "the bench", "found", ["Awl."]), [
      { cycle: 14, text: "Point still true." },
    ]),
  );
  items.push(
    piece("fix.tool.whetstone", 68, life("id.tool.whetstone", "the bench", "found", ["Rinses clean."]), [
      { cycle: 14, text: "Glazed at the middle. Still cuts." },
    ]),
  );

  items.push(
    piece(
      "fix.heir.oil-lamp",
      46,
      life("id.heir.oil-lamp.mara.v1", "Mara Venn", "heirloom", ["Known by the dent in the collar."]),
      [
        { cycle: 2, text: "First lit in Mara Venn's kitchen. The collar was already dented when she received it." },
        { cycle: 9, text: "Carried across the ferry in a wet sack. Burned fish-oil for a week and kept the smell." },
        { cycle: 14, text: "Set on the bench. Wick crusted. The dent is how it is recognized." },
      ],
      true,
    ),
  );
  items.push(
    piece(
      "fix.heir.needle",
      62,
      life("id.heir.needle.father", "the father", "heirloom", ["Not the bench needle."]),
      [
        { cycle: 6, text: "Mended the black net after the snag at the piling." },
        { cycle: 14, text: "Laid beside the bench needle so they would not be mistaken." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.river-knife",
      41,
      life("id.heir.river-knife.three-nicks", "the river", "heirloom", ["Three nicks, three years."]),
      [
        { cycle: 8, text: "First nick, opening a tin that should have been left shut." },
        { cycle: 11, text: "Second nick, on a bone that was not a fish." },
        { cycle: 13, text: "Third nick, dropped on the ferry rail." },
        { cycle: 14, text: "Edge tired. The count is still in the steel." },
      ],
      true,
    ),
  );
  items.push(
    piece(
      "fix.heir.cedar-creel",
      52,
      life("id.heir.cedar-creel.initials", "A.V.", "heirloom", ["Initials burned, not painted."]),
      [
        { cycle: 4, text: "Initials burned into the lid with a nail, not a brand." },
        { cycle: 14, text: "Hinge tired. The letters still read." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.compass",
      70,
      life("id.heir.compass.filed", "unknown", "heirloom", ["Error kept on purpose."]),
      [
        { cycle: 7, text: "Someone filed the case so the needle would sit a thumb east of north." },
        { cycle: 12, text: "Used as a landmark, not as truth, on the east marsh path." },
        { cycle: 14, text: "Glass filmed. The error is still the point." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.wool-cloak",
      44,
      life("id.heir.wool-cloak.crossing", "the crossing", "heirloom", ["Elbow patch from the winter."]),
      [
        { cycle: 10, text: "Elbow torn on the winter crossing and patched the same night." },
        { cycle: 14, text: "The patch is thin. It is still that patch." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.cane-rod",
      49,
      life("id.heir.cane-rod.silk", "the cane", "heirloom", ["Faded silk under any new thread."]),
      [
        { cycle: 5, text: "Silk wraps laid in a color that has since gone." },
        { cycle: 14, text: "One guide loose. The cane is not a blank." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.locket",
      80,
      life("id.heir.locket.sealed", "ninth year", "heirloom", ["Resin seal. Do not call it damage."]),
      [
        { cycle: 9, text: "Hinge sealed with resin so the portrait would survive the river." },
        { cycle: 14, text: "Outside dull. Still sealed. The face is not a bench fact." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.horn",
      43,
      life("id.heir.horn.lip", "the hunt", "heirloom", ["Crack at the lip."]),
      [
        { cycle: 11, text: "Lip cracked in the cold. It still spoke, thinner." },
        { cycle: 14, text: "The crack has not been cut back." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.tackle-roll",
      58,
      life("id.heir.tackle-roll.hand", "another hand", "heirloom", ["Pockets labeled by someone else."]),
      [
        { cycle: 3, text: "Pockets labeled in a hand that is not yours." },
        { cycle: 14, text: "Canvas dry. The labels were not corrected." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.shears",
      50,
      life("id.heir.shears.mother", "mother", "heirloom", ["Pivot dry."]),
      [
        { cycle: 1, text: "Used on the kitchen cloth, then on net twine, which they did not like." },
        { cycle: 14, text: "Pivot dry. They still know cloth." },
      ],
    ),
  );
  items.push(
    piece(
      "fix.heir.glass-float",
      88,
      life("id.heir.glass-float.first-year", "first drowning year", "heirloom", ["Not a commodity cork."]),
      [
        { cycle: 1, text: "Came in with the first drowning year. Kept when the nets were not." },
        { cycle: 14, text: "Whole. Not hitched. Not for sale as cork." },
      ],
    ),
  );

  items.push(
    piece("fix.quest.ferry-token", 100, life("id.quest.ferry-token", "the ferry", "quest", ["The ferry still takes this and not a copy."]), [
      { cycle: 14, text: "Carved chit. Not a material." },
    ]),
  );
  items.push(
    piece(
      "fix.quest.unopened-letter",
      100,
      life("id.quest.unopened-letter", "unread", "quest", ["Seal is not a bench defect."]),
      [{ cycle: 14, text: "Unopened. The bench is not the reader." }],
    ),
  );
  items.push(
    piece("fix.quest.red-strand", 100, life("id.quest.red-strand", "a promise", "quest", ["Cutting it strands a return."]), [
      { cycle: 14, text: "Tied and left tied." },
    ]),
  );

  return {
    items,
    focus: 80,
    focusMax: 80,
    cycle: 14,
    journal: [],
    undo: [],
    favoriteRecipes: ["op.restore.heir.oil-lamp", "op.dismantle.bottle", "op.modify.heir-locket"],
    seq,
  };
}
