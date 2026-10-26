import type {
  Catalog,
  ComponentDef,
  HiddenCache,
  ObjectDef,
  ProjectDef,
  RelicSnapshot,
  SourceDef,
} from "./types.ts";

/**
 * Relic rows are the live catalog from src/game/items.ts RELICS
 * (preincarnation main @ c737e42). They are copied because that module is not
 * in this workspace. Do not invent extra relics.
 */
export const RELIC_SNAPSHOT: RelicSnapshot[] = [
  { id: "sword", name: "Short iron", desc: "The blade you wake with. Hold to spin." },
  { id: "shovel", name: "Grave shovel", desc: "Excavate a death site. Till a plot." },
  { id: "hookshot", name: "Sugar-line", desc: "A grappling chain. Latch a post, a pot, a beast." },
  { id: "boots", name: "Gap boots", desc: "Hold Shift. Vermont miles shorten." },
  { id: "flippers", name: "Creek fins", desc: "Otter Creek will take you." },
  { id: "lantern", name: "Oil lamp", desc: "The quarry is dark without it." },
  { id: "hammer", name: "Marble hammer", desc: "Cracked marble yields. The temple's gift." },
  { id: "net", name: "Bug net", desc: "Crows, moths, the odd wandering light." },
  { id: "mirror", name: "Homestead glass", desc: "Walk home. The shrine remembers you." },
  { id: "cape", name: "Shadow cape", desc: "A few steps through what would stop you." },
  { id: "cane", name: "Somaria rod", desc: "Raise a block. Spend mana." },
  { id: "bow", name: "Ash bow", desc: "Hold to draw, release to fire." },
  { id: "ipod", name: "Strange device", desc: "A pocket of other people's music. Yours, if you feed it." },
  { id: "bombs", name: "Powder kegs", desc: "Crack a vein. Open a wall." },
];

export const INTEGRATION_NOTE =
  "Runtime integration pending. Relic names are the live catalog snapshot (src/game/items.ts RELICS). The .30-06 name is the rifle archetype in src/game/weapons.ts. Loose materials, recipes, and this bag are labeled fixtures until the inventory session attaches a host port. This ledger does not keep a competing inventory.";

const COMPONENTS: ComponentDef[] = [
  { id: "copper-fitting", name: "Copper fittings", singular: "copper fitting", plural: "copper fittings", provenance: "fixture", persistsOnDeath: false },
  { id: "twine", name: "Waxed twine", singular: "waxed twine coil", plural: "waxed twine coils", provenance: "fixture", persistsOnDeath: false },
  { id: "flax-twine", name: "Flax twine", singular: "flax twine coil", plural: "flax twine coils", provenance: "fixture", persistsOnDeath: false },
  { id: "iron-rivet", name: "Iron rivets", singular: "iron rivet", plural: "iron rivets", provenance: "fixture", persistsOnDeath: false },
  { id: "leather-lace", name: "Leather lace", singular: "leather lace", plural: "leather laces", provenance: "fixture", persistsOnDeath: false },
  { id: "lamp-oil", name: "Lamp oil", singular: "flask of lamp oil", plural: "flasks of lamp oil", provenance: "fixture", persistsOnDeath: false },
  { id: "beeswax", name: "Beeswax", singular: "cake of beeswax", plural: "cakes of beeswax", provenance: "fixture", persistsOnDeath: false },
  { id: "linen-scrap", name: "Linen", singular: "linen scrap", plural: "linen scraps", provenance: "fixture", persistsOnDeath: false },
  { id: "oak-dowel", name: "Oak dowel", singular: "oak dowel", plural: "oak dowels", provenance: "fixture", persistsOnDeath: false },
  { id: "marble-chip", name: "Marble chip", singular: "marble chip", plural: "marble chips", provenance: "fixture", persistsOnDeath: true },
  { id: "ash-shaft", name: "Ash shaft", singular: "ash shaft", plural: "ash shafts", provenance: "fixture", persistsOnDeath: false },
  { id: "fish-hook", name: "Hand-forged hook", singular: "hand-forged hook", plural: "hand-forged hooks", provenance: "fixture", persistsOnDeath: false },
  { id: "cream", name: "County cream", singular: "cup of county cream", plural: "cups of county cream", provenance: "fixture", persistsOnDeath: false },
  { id: "maple-sugar", name: "Maple sugar", singular: "cone of maple sugar", plural: "cones of maple sugar", provenance: "fixture", persistsOnDeath: false },
  { id: "maple-sap", name: "Maple sap", singular: "pail of maple sap", plural: "pails of maple sap", provenance: "fixture", persistsOnDeath: false },
  { id: "apple", name: "Windfall apple", singular: "windfall apple", plural: "windfall apples", provenance: "fixture", persistsOnDeath: false },
  { id: "salt", name: "Coarse salt", singular: "pinch of coarse salt", plural: "pinches of coarse salt", provenance: "fixture", persistsOnDeath: false },
  { id: "trout", name: "Otter trout", singular: "otter trout", plural: "otter trout", provenance: "fixture", persistsOnDeath: false },
  { id: "glass-shard", name: "Homestead glass shard", singular: "homestead glass shard", plural: "homestead glass shards", provenance: "fixture", persistsOnDeath: false },
  { id: "wool-batting", name: "Wool batting", singular: "bat of wool", plural: "bats of wool", provenance: "fixture", persistsOnDeath: false },
  { id: "bog-iron", name: "Bog iron", singular: "lump of bog iron", plural: "lumps of bog iron", provenance: "fixture", persistsOnDeath: false },
];

const OBJECTS: ObjectDef[] = [
  {
    id: "fishing-net-spare",
    name: "June's spare fishing net",
    contains: [
      { componentId: "copper-fitting", quantity: 2 },
      { componentId: "twine", quantity: 1 },
    ],
    unique: true,
    protected: false,
    provenance: "fixture",
  },
  {
    id: "maeve-lantern-glass",
    name: "Maeve Holloway's lantern glass",
    contains: [{ componentId: "glass-shard", quantity: 2 }],
    unique: true,
    protected: true,
    provenance: "fixture",
  },
  {
    id: "homestead-mirror",
    name: "Homestead glass",
    relicId: "mirror",
    contains: [{ componentId: "glass-shard", quantity: 1 }],
    unique: true,
    protected: true,
    provenance: "catalog",
  },
  {
    id: "grandfather-3006",
    name: ".30-06 hunting rifle",
    catalogNote: "Archetype name from src/game/weapons.ts (rifle).",
    contains: [{ componentId: "iron-rivet", quantity: 2 }],
    unique: true,
    protected: true,
    provenance: "catalog",
  },
  {
    id: "rokeby-quilt",
    name: "Rokeby freedom quilt",
    contains: [
      { componentId: "linen-scrap", quantity: 4 },
      { componentId: "wool-batting", quantity: 2 },
    ],
    unique: true,
    protected: true,
    provenance: "fixture",
  },
  {
    id: "sugar-line-spool",
    name: "Cracked sugar-line spool",
    relicId: "hookshot",
    contains: [{ componentId: "copper-fitting", quantity: 1 }],
    unique: true,
    protected: false,
    provenance: "catalog",
  },
  {
    id: "cal-sap-bucket",
    name: "Cal's cracked sap bucket",
    contains: [{ componentId: "maple-sap", quantity: 2 }],
    unique: true,
    protected: false,
    provenance: "fixture",
  },
];

const PROJECTS: ProjectDef[] = [
  {
    id: "restore-fishing-net",
    name: "Fishing-net repair",
    kind: "restoration",
    provenance: "fixture",
    note: "Creek net. Not the bug-net relic. Fixture until crafting publishes this recipe.",
    requirements: [
      { componentId: "copper-fitting", quantity: 2 },
      { componentId: "twine", quantity: 3, substitutes: [{ componentId: "flax-twine", quantity: 3 }] },
      { componentId: "fish-hook", quantity: 1 },
    ],
  },
  {
    id: "restore-bug-net",
    name: "Mend the bug net",
    kind: "restoration",
    provenance: "catalog",
    relicId: "net",
    note: "Restores the Bug net relic. The relic record stays in the other session's inventory.",
    requirements: [
      { componentId: "twine", quantity: 2, substitutes: [{ componentId: "flax-twine", quantity: 2 }] },
      { componentId: "linen-scrap", quantity: 1 },
    ],
  },
  {
    id: "restore-gap-boots",
    name: "Re-sole the gap boots",
    kind: "restoration",
    provenance: "catalog",
    relicId: "boots",
    note: "Gap boots from the relic catalog.",
    requirements: [
      { componentId: "leather-lace", quantity: 2 },
      { componentId: "iron-rivet", quantity: 4 },
    ],
  },
  {
    id: "restore-lantern",
    name: "Relight the oil lamp",
    kind: "restoration",
    provenance: "catalog",
    relicId: "lantern",
    note: "Oil lamp from the relic catalog.",
    requirements: [
      { componentId: "lamp-oil", quantity: 1 },
      { componentId: "beeswax", quantity: 1 },
    ],
  },
  {
    id: "restore-hammer",
    name: "Rehaft the marble hammer",
    kind: "restoration",
    provenance: "catalog",
    relicId: "hammer",
    note: "Marble hammer from the relic catalog.",
    requirements: [
      { componentId: "oak-dowel", quantity: 1 },
      { componentId: "iron-rivet", quantity: 2 },
      { componentId: "marble-chip", quantity: 1 },
    ],
  },
  {
    id: "restore-bow",
    name: "Restring the ash bow",
    kind: "restoration",
    provenance: "catalog",
    relicId: "bow",
    note: "Ash bow from the relic catalog. Flax can stand in for waxed twine.",
    requirements: [
      { componentId: "ash-shaft", quantity: 1 },
      { componentId: "twine", quantity: 2, substitutes: [{ componentId: "flax-twine", quantity: 2 }] },
    ],
  },
  {
    id: "restore-hookshot",
    name: "Refit the sugar-line",
    kind: "restoration",
    provenance: "catalog",
    relicId: "hookshot",
    note: "Sugar-line from the relic catalog. Shares copper with the fishing net.",
    requirements: [
      { componentId: "copper-fitting", quantity: 3 },
      { componentId: "iron-rivet", quantity: 1 },
    ],
  },
  {
    id: "restore-sword",
    name: "Oil the short iron",
    kind: "restoration",
    provenance: "catalog",
    relicId: "sword",
    note: "Short iron from the relic catalog.",
    requirements: [
      { componentId: "beeswax", quantity: 1 },
      { componentId: "linen-scrap", quantity: 1 },
    ],
  },
  {
    id: "restore-flippers",
    name: "Patch the creek fins",
    kind: "restoration",
    provenance: "catalog",
    relicId: "flippers",
    note: "Creek fins from the relic catalog.",
    requirements: [
      { componentId: "linen-scrap", quantity: 2 },
      { componentId: "beeswax", quantity: 1 },
    ],
  },
  {
    id: "cook-creemee",
    name: "Maple creemee",
    kind: "cooking",
    provenance: "fixture",
    note: "Named at Al's window in county dialogue. Not a relic record.",
    requirements: [
      { componentId: "cream", quantity: 2 },
      { componentId: "maple-sugar", quantity: 1 },
    ],
  },
  {
    id: "cook-sugar-on-snow",
    name: "Sugar on snow",
    kind: "cooking",
    provenance: "fixture",
    note: "Fixture recipe. Shares sap and cream with the inn stew.",
    requirements: [
      { componentId: "maple-sap", quantity: 3 },
      { componentId: "cream", quantity: 1 },
    ],
  },
  {
    id: "cook-apple-butter",
    name: "Windfall apple butter",
    kind: "cooking",
    provenance: "fixture",
    note: "Fixture recipe.",
    requirements: [
      { componentId: "apple", quantity: 4 },
      { componentId: "maple-sugar", quantity: 1 },
    ],
  },
  {
    id: "cook-salt-trout",
    name: "Salt the creek trout",
    kind: "cooking",
    provenance: "fixture",
    note: "Fixture recipe. Shares trout and salt with the inn stew.",
    requirements: [
      { componentId: "trout", quantity: 1 },
      { componentId: "salt", quantity: 1 },
    ],
  },
  {
    id: "recipe-lamp-oil",
    name: "Render lamp oil",
    kind: "recipe",
    provenance: "fixture",
    note: "Fixture recipe. Output would return to the host inventory when connected.",
    requirements: [
      { componentId: "beeswax", quantity: 2 },
      { componentId: "linen-scrap", quantity: 1 },
    ],
  },
  {
    id: "recipe-rivets",
    name: "Draw iron rivets",
    kind: "recipe",
    provenance: "fixture",
    note: "Fixture recipe.",
    requirements: [{ componentId: "bog-iron", quantity: 2 }],
  },
  {
    id: "recipe-twine",
    name: "Wax a twine coil",
    kind: "recipe",
    provenance: "fixture",
    note: "Fixture recipe. Flax plus wax becomes waxed twine in the host's craft resolver.",
    requirements: [
      { componentId: "flax-twine", quantity: 1 },
      { componentId: "beeswax", quantity: 1 },
    ],
  },
  {
    id: "restore-mirror",
    name: "Reseat the homestead glass",
    kind: "restoration",
    provenance: "catalog",
    relicId: "mirror",
    note: "Homestead glass relic. Shards sit inside protected heirlooms and cannot be taken by a tag.",
    requirements: [{ componentId: "glass-shard", quantity: 2 }],
  },
  {
    id: "restore-shovel",
    name: "Bind the grave shovel",
    kind: "restoration",
    provenance: "catalog",
    relicId: "shovel",
    note: "Grave shovel from the relic catalog.",
    requirements: [
      { componentId: "oak-dowel", quantity: 1 },
      { componentId: "leather-lace", quantity: 1 },
    ],
  },
  {
    id: "restore-cape",
    name: "Restitch the shadow cape",
    kind: "equipment",
    provenance: "catalog",
    relicId: "cape",
    note: "Shadow cape from the relic catalog.",
    requirements: [
      { componentId: "linen-scrap", quantity: 3 },
      { componentId: "wool-batting", quantity: 1 },
    ],
  },
  {
    id: "cook-inn-stew",
    name: "Innkeep's barley stew",
    kind: "cooking",
    provenance: "fixture",
    note: "Fixture recipe. Overlaps apples, salt, trout, and cream.",
    requirements: [
      { componentId: "apple", quantity: 2 },
      { componentId: "salt", quantity: 1 },
      { componentId: "trout", quantity: 1 },
      { componentId: "cream", quantity: 1 },
    ],
  },
];

const SOURCES: SourceDef[] = [
  { id: "src-tilda-rivet", componentId: "iron-rivet", label: "Tilda Wren's counter", kind: "vendor", discovered: true },
  { id: "src-tilda-oil", componentId: "lamp-oil", label: "Tilda Wren's counter", kind: "vendor", discovered: true },
  { id: "src-tilda-wax", componentId: "beeswax", label: "Tilda Wren's counter", kind: "vendor", discovered: true },
  { id: "src-june-sap", componentId: "maple-sap", label: "June Cabot's sugarhouse", kind: "gather", discovered: true },
  { id: "src-june-sugar", componentId: "maple-sugar", label: "June Cabot's sugarhouse", kind: "gather", discovered: true },
  { id: "src-creek-twine", componentId: "twine", label: "Snag at the Otter Creek ford", kind: "gather", discovered: true },
  { id: "src-creek-hook", componentId: "fish-hook", label: "Snag at the Otter Creek ford", kind: "gather", discovered: true },
  { id: "src-als-cream", componentId: "cream", label: "Al's creemee window", kind: "vendor", discovered: true },
  { id: "src-green-apple", componentId: "apple", label: "Windfalls on the Green", kind: "gather", discovered: true },
  { id: "src-salt-inn", componentId: "salt", label: "The inn's salt crock", kind: "vendor", discovered: true },
  {
    id: "src-sealed-copper",
    componentId: "copper-fitting",
    label: "UNDISCOVERED_COLLEGE_STACKS_CACHE",
    kind: "gather",
    discovered: false,
  },
];

const HIDDEN_CACHES: HiddenCache[] = [
  {
    id: "cache-college-stacks",
    label: "UNDISCOVERED_COLLEGE_STACKS_CACHE",
    discovered: false,
    contains: [{ componentId: "copper-fitting", quantity: 4 }],
  },
];

export const CATALOG: Catalog = {
  integrationNote: INTEGRATION_NOTE,
  relics: RELIC_SNAPSHOT,
  components: COMPONENTS,
  objects: OBJECTS,
  projects: PROJECTS,
  sources: SOURCES,
  hiddenCaches: HIDDEN_CACHES,
};

export function componentDef(catalog: Catalog, id: string): ComponentDef {
  const found = catalog.components.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown component ${id}`);
  return found;
}

export function projectDef(catalog: Catalog, id: string): ProjectDef | undefined {
  return catalog.projects.find((p) => p.id === id);
}

export function objectDef(catalog: Catalog, id: string): ObjectDef | undefined {
  return catalog.objects.find((o) => o.id === id);
}
