import { AUTHORED_BY_ID } from "./catalog.ts";
import { FIXTURE_TOTAL, FIXTURES } from "./fixtures.ts";
import type {
  Caps,
  GroundStack,
  InventoryState,
  ItemInstance,
  Provenance,
} from "./types.ts";

export const DEFAULT_CAPS: Caps = { pack: 40, hearth: 960, display: 12 };

const BEFORE = "The first winter";
const INTERVAL = "Left through the years";
const AFTER = "Fourteen years on";

function prov(era: Provenance["era"], place: string, note: string, yearLabel: string): Provenance {
  return { era, place, note, yearLabel };
}

function item(
  instanceId: string,
  defId: string,
  container: ItemInstance["container"],
  extra: Partial<ItemInstance> = {},
): ItemInstance {
  return {
    instanceId,
    defId,
    qty: 1,
    container,
    favorite: false,
    condition: 100,
    provenance: prov("before", "The homestead", "Carried from the first winter.", BEFORE),
    learnedUseIds: [],
    acquiredAt: 10,
    keptThroughInterval: container === "hearth" || container === "display",
    ...extra,
  };
}

const DUPLICATE_NS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];

function fixtureInstances(): ItemInstance[] {
  const rows: ItemInstance[] = [];
  for (let n = 1; n <= FIXTURE_TOTAL; n++) {
    const code = String(n).padStart(3, "0");
    const defId = `fx-${code}`;
    let container: ItemInstance["container"] = "hearth";
    if (n === 1 || n === 2) container = "pack";
    rows.push(
      item(`fx-${code}`, defId, container, {
        qty: n % 9 === 0 ? 6 : 1,
        condition: 100,
        favorite: n === 4,
        acquiredAt: 1000 + n,
        keptThroughInterval: container === "hearth",
        provenance: prov(
          "interval",
          "Fixture drawer",
          "Stress-test record, not story content.",
          INTERVAL,
        ),
      }),
    );
  }
  for (const n of DUPLICATE_NS) {
    const code = String(n).padStart(3, "0");
    rows.push(
      item(`fx-${code}-b`, `fx-${code}`, "hearth", {
        qty: 1,
        acquiredAt: 2000 + n,
        provenance: prov(
          "after",
          "Fixture drawer",
          "Second sample of the same fixture. Not the same object.",
          AFTER,
        ),
      }),
    );
  }
  return rows;
}

function ground(): GroundStack[] {
  return [
    {
      groundId: "ground-apples",
      defId: "apple-rings",
      qty: 4,
      condition: 100,
      provenance: prov(
        "after",
        "The orchard grass",
        "Dropped this morning. A separate stack from the older rings.",
        AFTER,
      ),
    },
    {
      groundId: "ground-bead",
      defId: "glass-bead",
      qty: 1,
      condition: 100,
      provenance: prov(
        "after",
        "The shallows",
        "Same bend in the river, fourteen years on.",
        AFTER,
      ),
    },
    {
      groundId: "ground-tinder",
      defId: "birch-tinder",
      qty: 3,
      condition: 100,
      provenance: prov("after", "The woodpile", "Loose bark beside the step.", AFTER),
    },
    {
      groundId: "ground-long",
      defId: "fx-052",
      qty: 1,
      condition: 100,
      provenance: prov(
        "after",
        "The road",
        "A long-named fixture left where it can be picked up.",
        AFTER,
      ),
    },
    {
      groundId: "ground-scrap",
      defId: "fx-010",
      qty: 2,
      condition: 100,
      provenance: prov("after", "The road", "An ordinary fixture scrap.", AFTER),
    },
    {
      groundId: "ground-sealed",
      defId: "fx-040",
      qty: 1,
      condition: 100,
      provenance: prov(
        "after",
        "The road",
        "A protected fixture. Pickup is fine. Batch dismantle is not.",
        AFTER,
      ),
    },
  ];
}

export function seed(): InventoryState {
  const authored: ItemInstance[] = [
    item("inst-river-stone", "river-stone", "display", {
      favorite: true,
      acquiredAt: 1,
      provenance: prov("before", "The shallows", "Pocketed the first winter and later set on the shelf.", BEFORE),
    }),
    item("inst-locket", "split-locket", "equipped", {
      slot: "neck",
      acquiredAt: 2,
      keptThroughInterval: false,
      provenance: prov("before", "The homestead", "Worn thin at the hinge.", BEFORE),
    }),
    item("inst-key", "hearth-key", "pack", {
      acquiredAt: 3,
      keptThroughInterval: false,
      provenance: prov("before", "The homestead", "Cut for the chest in the hearth room.", BEFORE),
    }),
    item("inst-wool", "wool-coat", "pack", {
      condition: 70,
      acquiredAt: 4,
      keptThroughInterval: false,
      provenance: prov("before", "The loft", "The first coat. Still sound.", BEFORE),
    }),
    item("inst-mended", "mended-coat", "equipped", {
      slot: "body",
      condition: 88,
      acquiredAt: 5,
      keptThroughInterval: false,
      provenance: prov("after", "The loft", "Found mended, fourteen years on.", AFTER),
    }),
    item("inst-stick", "ash-stick", "equipped", {
      slot: "hand",
      condition: 64,
      acquiredAt: 6,
      keptThroughInterval: false,
      provenance: prov("before", "The interval road", "Cut before the winter.", BEFORE),
    }),
    item("inst-knife", "paring-knife", "pack", {
      condition: 55,
      acquiredAt: 7,
      keptThroughInterval: false,
      provenance: prov("before", "The kitchen", "Kept for apples, not for trouble.", BEFORE),
    }),
    item("inst-skillet", "skillet", "hearth", {
      acquiredAt: 8,
      provenance: prov("interval", "The hearth", "Left on the hob. Still here.", INTERVAL),
    }),
    item("inst-rye", "rye-loaf", "pack", {
      qty: 3,
      acquiredAt: 9,
      keptThroughInterval: false,
      provenance: prov("before", "The kitchen", "Baked dense so it would keep.", BEFORE),
    }),
    item("inst-apples", "apple-rings", "pack", {
      qty: 8,
      acquiredAt: 10,
      keptThroughInterval: false,
      provenance: prov("before", "The orchard", "Dried the autumn before the winter.", BEFORE),
    }),
    item("inst-flask", "flask", "equipped", {
      slot: "belt",
      acquiredAt: 11,
      keptThroughInterval: false,
      provenance: prov("before", "The spring", "Filled at the spring.", BEFORE),
    }),
    item("inst-tinder", "birch-tinder", "hearth", {
      qty: 6,
      acquiredAt: 12,
      provenance: prov("interval", "The woodpile", "A bundle left by the hearth.", INTERVAL),
    }),
    item("inst-resin", "pine-resin", "hearth", {
      qty: 4,
      acquiredAt: 13,
      provenance: prov("interval", "The barn", "Potted and left on a beam.", INTERVAL),
    }),
    item("inst-thread", "linen-thread", "hearth", {
      qty: 5,
      acquiredAt: 14,
      provenance: prov("interval", "The loft", "Wound and waiting.", INTERVAL),
    }),
    item("inst-needle", "bone-needle", "pack", {
      condition: 48,
      acquiredAt: 15,
      keptThroughInterval: false,
      provenance: prov("before", "The loft", "Still sharp enough, barely.", BEFORE),
    }),
    item("inst-journal", "field-journal", "pack", {
      favorite: true,
      acquiredAt: 16,
      keptThroughInterval: false,
      provenance: prov("before", "The interval road", "Written on the roads already walked.", BEFORE),
    }),
    item("inst-seed", "rye-seed", "hearth", {
      qty: 4,
      acquiredAt: 17,
      provenance: prov("interval", "The homestead", "Kept for the plot, not the pack.", INTERVAL),
    }),
    item("inst-cup", "clay-cup", "display", {
      acquiredAt: 18,
      provenance: prov("before", "The kitchen", "Set out and never broken.", BEFORE),
    }),
    item("inst-spoon", "tin-spoon", "pack", {
      acquiredAt: 19,
      keptThroughInterval: false,
      provenance: prov("before", "The kitchen", "The only spoon.", BEFORE),
    }),
    item("inst-pot", "copper-pot", "hearth", {
      acquiredAt: 20,
      provenance: prov("interval", "The hearth", "Too heavy for the road. It stayed.", INTERVAL),
    }),
    item("inst-map", "interval-map", "pack", {
      acquiredAt: 21,
      keptThroughInterval: false,
      provenance: prov("before", "The interval road", "Ink for the roads already walked.", BEFORE),
    }),
    item("inst-bead-a", "glass-bead", "pack", {
      acquiredAt: 22,
      keptThroughInterval: false,
      provenance: prov("before", "The shallows", "The first bead, from the first winter.", BEFORE),
    }),
    item("inst-bead-b", "glass-bead", "hearth", {
      acquiredAt: 23,
      provenance: prov("interval", "The shallows", "Left in a cup on the mantel.", INTERVAL),
    }),
    item("inst-quilt-r", "quilt-river", "hearth", {
      acquiredAt: 24,
      provenance: prov("interval", "The loft", "Folded with the other squares.", INTERVAL),
    }),
    item("inst-quilt-h", "quilt-hearth", "hearth", {
      acquiredAt: 25,
      provenance: prov("interval", "The loft", "Folded with the other squares.", INTERVAL),
    }),
    item("inst-quilt-t", "quilt-threshold", "hearth", {
      acquiredAt: 26,
      provenance: prov("interval", "The loft", "Promised to the quilt. It waited.", INTERVAL),
    }),
    item("inst-fern", "pressed-fern", "hearth", {
      acquiredAt: 27,
      provenance: prov("interval", "The loft", "Pressed and labeled, then left.", INTERVAL),
    }),
    item("inst-stone-tool", "whetstone", "pack", {
      acquiredAt: 28,
      keptThroughInterval: false,
      provenance: prov("before", "The shallows", "Picked for edges.", BEFORE),
    }),
    item("inst-salt", "salt-tin", "pack", {
      qty: 4,
      acquiredAt: 29,
      keptThroughInterval: false,
      provenance: prov("before", "The kitchen", "Salt for the road and the pot.", BEFORE),
    }),
    item("inst-honey", "honey-jar", "hearth", {
      qty: 2,
      acquiredAt: 30,
      provenance: prov("interval", "The pantry", "Left where it was cool.", INTERVAL),
    }),
    item("inst-letter", "unsent-letter", "pack", {
      acquiredAt: 31,
      keptThroughInterval: false,
      provenance: prov("before", "The desk", "Sealed, and still sealed.", BEFORE),
    }),
  ];

  for (const row of authored) {
    if (!AUTHORED_BY_ID[row.defId]) throw new Error(`Missing def ${row.defId}`);
  }

  const instances = [...authored, ...fixtureInstances()];
  const discovered = [...new Set(instances.map((row) => row.defId))];

  return {
    instances,
    ground: ground(),
    discovered,
    pending: null,
    focusedId: "inst-wool",
    cursor: 0,
    selected: [],
    batch: false,
    view: "pack",
    content: "authored",
    query: "",
    sort: "name",
    kind: "all",
    favoritesOnly: false,
    protectedOnly: false,
    atHearth: true,
    noticeSeq: 1,
    nextSerial: 3000,
    caps: { ...DEFAULT_CAPS },
  };
}

export const FIXTURE_DEF_COUNT = FIXTURES.length;
