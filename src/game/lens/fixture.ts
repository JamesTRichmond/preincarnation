import type {
  CollectionStatus,
  FilterContext,
  GroundItem,
  KnownUse,
  MasteryCompatibility,
  Ownership,
} from "./types.ts";

/**
 * Reference fixture for the crowded clearing.
 * Not the live adventure. Positions are list order because map spawn is unbound.
 */
export const FIXTURE_CONTEXT: FilterContext = {
  currentProject: "lantern-rite",
  currentProjectLabel: "Lantern Rite",
};

export const FIXTURE_MASTERY_LABEL = "Glasswright";

type Seed = {
  id: string;
  name: string;
  category: string;
  stackKey?: string;
  knownUse?: KnownUse;
  projectTags?: readonly string[];
  collectionStatus?: CollectionStatus;
  mastery?: MasteryCompatibility;
  quantity?: number;
  ownership?: Ownership;
  essentialQuest?: boolean;
  firstDiscovery?: boolean;
  protected?: boolean;
  detail: string;
};

function ground(seed: Seed): GroundItem {
  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    knownUse: seed.knownUse ?? "known",
    projectTags: seed.projectTags ?? [],
    collectionStatus: seed.collectionStatus ?? "seen",
    mastery: seed.mastery ?? "unrelated",
    quantity: seed.quantity ?? 1,
    ownership: seed.ownership ?? "unowned",
    essentialQuest: seed.essentialQuest ?? false,
    firstDiscovery: seed.firstDiscovery ?? false,
    protected: seed.protected ?? false,
    stackKey: seed.stackKey ?? seed.id,
    source: "reference-fixture",
    detail: seed.detail,
  };
}

function piles(
  stackKey: string,
  name: string,
  category: string,
  count: number,
  detail: string,
): GroundItem[] {
  return Array.from({ length: count }, (_, index) =>
    ground({
      id: `${stackKey}-${index + 1}`,
      name,
      category,
      stackKey,
      quantity: (index % 3) + 1,
      detail,
    }),
  );
}

const heroes: GroundItem[] = [
  ground({
    id: "rite-glass",
    name: "Rite glass",
    category: "material",
    knownUse: "known",
    projectTags: ["lantern-rite"],
    collectionStatus: "partial",
    mastery: "fits",
    detail: "Sheet glass cut for the rite lanterns. The project still needs it.",
  }),
  ground({
    id: "wick-shears",
    name: "Wick shears",
    category: "tool",
    projectTags: ["lantern-rite"],
    mastery: "fits",
    detail: "Trim wicks without cracking the glass collar.",
  }),
  ground({
    id: "spare-lens",
    name: "Spare lens",
    category: "tool",
    projectTags: ["lantern-rite"],
    mastery: "fits",
    ownership: "player",
    detail: "Dropped from your own kit. Still part of the rite.",
  }),
  ground({
    id: "field-biscuit",
    name: "Field biscuit",
    category: "provision",
    projectTags: ["lantern-rite"],
    collectionStatus: "partial",
    mastery: "fits",
    detail: "Dry ration you set aside for the night watch.",
  }),
  ground({
    id: "rite-tallow",
    name: "Rite tallow",
    category: "material",
    projectTags: ["lantern-rite"],
    collectionStatus: "partial",
    mastery: "fits",
    quantity: 9,
    detail: "A large cake of tallow reserved for the lanterns, not scrap.",
  }),
  ground({
    id: "glass-dust",
    name: "Glass dust",
    category: "material",
    projectTags: ["lantern-rite"],
    mastery: "fits",
    quantity: 4,
    detail: "Grindings from the last collar. Still useful on the rite.",
  }),
  ground({
    id: "processional-nail",
    name: "Processional nail",
    category: "relic",
    projectTags: ["lantern-rite"],
    collectionStatus: "partial",
    mastery: "fits",
    ownership: "quest-bound",
    essentialQuest: true,
    detail: "The nail the rite cannot proceed without.",
  }),
  ground({
    id: "sealed-key",
    name: "Sealed meridian key",
    category: "tool",
    ownership: "quest-bound",
    essentialQuest: true,
    detail: "Opens the meridian chest. Not part of the lantern work.",
  }),
  ground({
    id: "witness-slate",
    name: "Witness slate",
    category: "writing",
    collectionStatus: "undiscovered",
    ownership: "quest-bound",
    essentialQuest: true,
    firstDiscovery: true,
    detail: "You have not read it. The quest expects it intact.",
  }),
  ground({
    id: "unnamed-shard",
    name: "Unnamed warm shard",
    category: "curiosity",
    knownUse: "unidentified",
    collectionStatus: "undiscovered",
    firstDiscovery: true,
    detail: "First time this has been on the ground in front of you. Use unknown.",
  }),
  ground({
    id: "sporeglass-bead",
    name: "Sporeglass bead",
    category: "sporeglass",
    knownUse: "unidentified",
    collectionStatus: "undiscovered",
    firstDiscovery: true,
    detail: "The category sporeglass is not in the known catalog. This is a first find.",
  }),
  ground({
    id: "half-heard",
    name: "Half-heard name",
    category: "writing",
    collectionStatus: "undiscovered",
    detail: "A scrap of a name you have not logged. Treated as a first discovery.",
  }),
  ground({
    id: "warm-splinter",
    name: "Warm splinter",
    category: "curiosity",
    collectionStatus: "seen",
    firstDiscovery: true,
    detail: "Flagged as a first discovery even though a sloppy log marked it seen.",
  }),
  ground({
    id: "mother-compass",
    name: "Mother's compass",
    category: "tool",
    collectionStatus: "complete",
    ownership: "player",
    protected: true,
    detail: "Explicitly protected. The filter is not allowed to quiet it.",
  }),
  ground({
    id: "protected-iron",
    name: "River iron",
    category: "material",
    stackKey: "river-iron",
    quantity: 2,
    protected: true,
    detail: "Same label as the spare iron, but you marked this pile protected.",
  }),
  ground({
    id: "small-tallow-1",
    name: "Tallow scrap",
    category: "material",
    stackKey: "tallow-scrap",
    knownUse: "no-current-use",
    quantity: 1,
    detail: "A small useless shaving. Not large enough for the surplus rule.",
  }),
  ground({
    id: "small-tallow-2",
    name: "Tallow scrap",
    category: "material",
    stackKey: "tallow-scrap",
    knownUse: "no-current-use",
    quantity: 2,
    detail: "Another small useless shaving with the same label.",
  }),
  ground({
    id: "surplus-tallow-1",
    name: "Tallow scrap",
    category: "material",
    stackKey: "tallow-scrap",
    knownUse: "no-current-use",
    quantity: 8,
    detail: "A heavy pile of scrap tallow you already know you cannot use.",
  }),
  ground({
    id: "surplus-tallow-2",
    name: "Tallow scrap",
    category: "material",
    stackKey: "tallow-scrap",
    knownUse: "no-current-use",
    quantity: 5,
    detail: "Second heavy pile of the same useless scrap.",
  }),
  ground({
    id: "ash-polearm",
    name: "Ash polearm",
    category: "weapon",
    mastery: "conflicts",
    detail: "Too heavy for a glasswright. Known, and not part of the rite.",
  }),
  ground({
    id: "heavy-kettle",
    name: "Heavy kettle helm",
    category: "ward",
    mastery: "conflicts",
    detail: "A ward that fights the way you work.",
  }),
  ground({
    id: "third-verse",
    name: "Third verse",
    category: "writing",
    collectionStatus: "complete",
    detail: "A poem you have already copied in full.",
  }),
  ground({
    id: "finished-map",
    name: "Finished ward map",
    category: "writing",
    collectionStatus: "complete",
    detail: "The survey is done. The sheet is only a duplicate.",
  }),
  ground({
    id: "echo-filament",
    name: "Echo filament",
    category: "echo-filament",
    knownUse: "unidentified",
    detail: "Unrecognized category, already glanced at, use still unknown.",
  }),
  ground({
    id: "cloudy-vial",
    name: "Cloudy vial",
    category: "provision",
    knownUse: "unidentified",
    detail: "A known kind of container with an unidentified draught.",
  }),
  ground({
    id: "bitter-tea",
    name: "Bitter tea",
    category: "provision",
    knownUse: "no-current-use",
    quantity: 3,
    detail: "You know this brew does nothing for you.",
  }),
  ground({
    id: "tin-counts",
    name: "Tin counts",
    category: "currency",
    quantity: 12,
    detail: "Loose coin. Known, plentiful, and not part of the rite.",
  }),
  ground({
    id: "chipped-saint",
    name: "Chipped saint",
    category: "curiosity",
    collectionStatus: "partial",
    detail: "One figure from a set you have not finished.",
  }),
  ground({
    id: "road-marker",
    name: "Road marker",
    category: "writing",
    ownership: "world",
    detail: "A mile mark that belongs to the road, not to you.",
  }),
  ground({
    id: "practice-hook",
    name: "Practice hook",
    category: "tool",
    detail: "An ordinary hook with a known use and no project.",
  }),
  ground({
    id: "stranger-coin",
    name: "Stranger coin",
    category: "currency",
    knownUse: "unidentified",
    quantity: 4,
    detail: "Coin you do not yet recognize. Hide must not swallow it.",
  }),
  ground({
    id: "errand-token",
    name: "Errand token",
    category: "curiosity",
    ownership: "quest-bound",
    detail: "Quest-bound, but not an essential quest item. A preset may still mark it.",
  }),
];

export const FIXTURE_ITEMS: readonly GroundItem[] = [
  ...heroes,
  ...piles(
    "river-iron",
    "River iron",
    "material",
    6,
    "Spare river iron. Reference pile, same label as the others.",
  ),
  ...piles(
    "reed-cord",
    "Reed cord",
    "material",
    4,
    "Cord off the rite. Reference pile, same label as the others.",
  ),
  ...piles(
    "bent-nail",
    "Bent nail",
    "material",
    4,
    "Common bent nails. Reference pile, same label as the others.",
  ),
  ...piles(
    "ash-twig",
    "Ash twig",
    "material",
    3,
    "Twigs with a known ordinary use. Reference pile.",
  ),
];

export function fixtureItem(id: string): GroundItem {
  const item = FIXTURE_ITEMS.find((entry) => entry.id === id);
  if (!item) throw new Error(`Missing fixture item ${id}`);
  return item;
}
