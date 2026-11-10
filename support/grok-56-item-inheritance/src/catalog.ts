import type { ItemDefinition } from "./types.ts";
import { InheritanceError } from "./errors.ts";

const COMMON_NOTE =
  "Once each calendar era this node mints a new common instance. It does not copy an heirloom, a story, or a historical mark.";

function common(
  defId: string,
  name: string,
  kind: ItemDefinition["kind"],
  extra: Partial<ItemDefinition> = {},
): ItemDefinition {
  return {
    defId,
    name,
    kind,
    stackable: true,
    renewalPolicy: "renewable-common",
    dismantleable: extra.dismantleable,
    dismantleYield: extra.dismantleYield,
    renewal: {
      cadence: "each-era",
      maxPerEra: extra.renewal?.maxPerEra ?? 1,
      family: "common",
      note: extra.renewal?.note ?? COMMON_NOTE,
    },
  };
}

export const DEFINITIONS: Record<string, ItemDefinition> = Object.fromEntries(
  (
    [
      def({
        defId: "def:tool.smoothing-plane",
        name: "Smoothing plane",
        kind: "tool",
        stackable: false,
        renewalPolicy: "heirloom-lineage",
        canonicalSourceKey: "heirloom:tool:smoothing-plane",
      }),
      def({
        defId: "def:tool.billhook",
        name: "Hedge billhook",
        kind: "tool",
        stackable: false,
        renewalPolicy: "heirloom-lineage",
        canonicalSourceKey: "heirloom:tool:billhook",
      }),
      def({
        defId: "def:tool.loom-shuttle",
        name: "Loom shuttle",
        kind: "tool",
        stackable: false,
        renewalPolicy: "heirloom-lineage",
        canonicalSourceKey: "heirloom:tool:loom-shuttle",
      }),
      def({
        defId: "def:tool.kiln-tongs",
        name: "Kiln tongs",
        kind: "tool",
        stackable: false,
        renewalPolicy: "heirloom-lineage",
        canonicalSourceKey: "heirloom:tool:kiln-tongs",
      }),
      def({
        defId: "def:tool.survey-chain",
        name: "Survey chain",
        kind: "tool",
        stackable: false,
        renewalPolicy: "heirloom-lineage",
        canonicalSourceKey: "heirloom:tool:survey-chain",
      }),
      def({
        defId: "def:tool.chapel-key",
        name: "Chapel key",
        kind: "tool",
        stackable: false,
        renewalPolicy: "heirloom-lineage",
        canonicalSourceKey: "heirloom:tool:chapel-key",
      }),
      def({
        defId: "def:tool.press-bar",
        name: "Cider press bar",
        kind: "tool",
        stackable: false,
        renewalPolicy: "heirloom-lineage",
        canonicalSourceKey: "heirloom:tool:press-bar",
      }),
      def({
        defId: "def:tool.sail-needles",
        name: "Sail needles",
        kind: "tool",
        stackable: false,
        renewalPolicy: "heirloom-lineage",
        canonicalSourceKey: "heirloom:tool:sail-needles",
      }),
      def({
        defId: "def:tool.common-chisel",
        name: "Common chisel",
        kind: "tool",
        stackable: false,
        renewalPolicy: "renewable-common",
        dismantleable: true,
        dismantleYield: [{ defId: "def:material.iron-shard", qty: 1 }],
        renewal: {
          cadence: "each-era",
          maxPerEra: 1,
          family: "common",
          note: "The smith's blank is ordinary. Dismantling it yields a shard and does not recreate any heirloom tool.",
        },
      }),
      def({
        defId: "def:tool.common-cup",
        name: "Pewter cup",
        kind: "tool",
        stackable: false,
        renewalPolicy: "renewable-common",
        renewal: {
          cadence: "each-era",
          maxPerEra: 1,
          family: "common",
          note: "A sold cup stays sold. The batch key does not return with the next life.",
        },
      }),
      heirloom("def:instrument.ash-fiddle", "Ash fiddle", "instrument", "heirloom:instrument:ash-fiddle"),
      heirloom("def:instrument.reed-flute", "Reed flute", "instrument", "heirloom:instrument:reed-flute"),
      heirloom("def:instrument.processional-drum", "Processional drum", "instrument", "heirloom:instrument:processional-drum"),
      heirloom("def:instrument.lap-harp", "Lap harp", "instrument", "heirloom:instrument:lap-harp"),
      heirloom("def:instrument.handbell", "Handbell", "instrument", "heirloom:instrument:handbell"),
      heirloom("def:instrument.concertina", "Concertina", "instrument", "heirloom:instrument:concertina"),
      heirloom("def:instrument.psaltery", "Psaltery", "instrument", "heirloom:instrument:psaltery"),
      unique("def:relic.river-bead", "River bead", "relic", "cache:river-bend:bead"),
      unique("def:relic.mason-mark", "Mason's mark stone", "relic", "cache:quarry-slip:mark"),
      unique("def:card.bog-packet", "Bog packet", "card", "cache:peat-cut:packet"),
      unique("def:food.orchard-jar", "Sealed orchard jar", "food", "cache:orchard-root:jar"),
      unique("def:card.votive", "Votive card", "card", "cache:chapel-niche:votive"),
      unique("def:card.survey-notes", "Survey notes", "card", "cache:road-cut:notes"),
      unique("def:relic.ferry-strongbox", "Ferry strongbox token", "relic", "cache:tide-bar:token"),
      unique("def:relic.sun-coin", "Sun coin", "relic", "unique:barrow:sun-coin"),
      heirloom("def:inherited.mother-thimble", "Mother's thimble", "inherited", "heirloom:family:thimble"),
      heirloom("def:inherited.father-compass", "Father's compass", "inherited", "heirloom:family:compass"),
      heirloom("def:inherited.sister-ribbon", "Sister's ribbon", "inherited", "heirloom:family:ribbon"),
      heirloom("def:inherited.uncle-pipe", "Uncle's pipe", "inherited", "heirloom:family:pipe"),
      heirloom("def:inherited.gran-spoon", "Gran's spoon", "inherited", "heirloom:family:spoon"),
      heirloom("def:card.cousin-nick", "Nicked heart", "card", "heirloom:family:cousin-card"),
      heirloom("def:inherited.aunt-shawl", "Aunt's shawl", "inherited", "heirloom:family:shawl"),
      ordinary("def:card.market-token", "Market token", "card", "heirloom:card:famine-token", "node:market:day-token"),
      ordinary("def:card.ferry-ticket", "Ferry ticket", "card", "heirloom:card:last-ferry-stub", "node:ferry:day-ticket"),
      ordinary("def:equipment.school-slate", "School slate", "equipment", "heirloom:equipment:founding-slate", "node:school:blank-slate"),
      ordinary("def:equipment.kitchen-lantern", "Kitchen lantern", "equipment", "heirloom:equipment:flood-lantern", "node:chandler:lantern"),
      ordinary("def:tool.bread-stamp", "Bread stamp", "tool", "heirloom:tool:coop-stamp", "node:bakery:spare-stamp"),
      ordinary("def:material.ink-bottle", "Ink bottle", "material", "heirloom:material:treaty-ink", "node:stationer:ink"),
      ordinary("def:inherited.nail-pouch", "Nail pouch", "inherited", "heirloom:inherited:raising-pouch", "node:smith:spare-pouch"),
      common("def:material.oak-plank", "Oak plank", "material"),
      common("def:material.iron-nail", "Iron nail", "material"),
      common("def:material.iron-shard", "Iron shard", "material", {
        renewal: {
          cadence: "each-era",
          maxPerEra: 1,
          family: "common",
          note: "Shards come from dismantling ordinary tools or from the smith's scrap node. They are not heirloom tools.",
        },
      }),
      common("def:food.travel-bread", "Travel bread", "food", {
        renewal: {
          cadence: "each-era",
          maxPerEra: 1,
          family: "common",
          note: "Bread is not aged out by a return. A new loaf is a new instance from the bakery node, never a copy of a marked object.",
        },
      }),
      def({
        defId: "def:equipment.watch-lantern",
        name: "Watch lantern",
        kind: "equipment",
        stackable: false,
        renewalPolicy: "quest-once",
        canonicalSourceKey: "quest:flood-watch:lantern",
      }),
    ] satisfies ItemDefinition[]
  ).map((entry) => [entry.defId, entry]),
);

function def(entry: ItemDefinition): ItemDefinition {
  return entry;
}

function heirloom(
  defId: string,
  name: string,
  kind: ItemDefinition["kind"],
  canonicalSourceKey: string,
): ItemDefinition {
  return {
    defId,
    name,
    kind,
    stackable: false,
    renewalPolicy: "heirloom-lineage",
    canonicalSourceKey,
  };
}

function unique(
  defId: string,
  name: string,
  kind: ItemDefinition["kind"],
  canonicalSourceKey: string,
): ItemDefinition {
  return {
    defId,
    name,
    kind,
    stackable: false,
    renewalPolicy: "unique-once",
    canonicalSourceKey,
  };
}

function ordinary(
  defId: string,
  name: string,
  kind: ItemDefinition["kind"],
  lineageKey: string,
  nodeKey: string,
): ItemDefinition {
  return {
    defId,
    name,
    kind,
    stackable: true,
    renewalPolicy: "renewable-common",
    lineageKeys: [lineageKey],
    canonicalSourceKey: nodeKey,
    renewal: {
      cadence: "each-era",
      maxPerEra: 1,
      family: "common",
      note: `Ordinary yields of ${name.toLowerCase()} use ${nodeKey}. The lineage key ${lineageKey} is one object and is never re-minted by the node.`,
    },
  };
}

const LEGACY_DEF_IDS: Record<string, string> = {
  "smoothing-plane": "def:tool.smoothing-plane",
  "oak-plank": "def:material.oak-plank",
  "sun-coin": "def:relic.sun-coin",
  bread: "def:food.travel-bread",
  "father-compass": "def:inherited.father-compass",
  thimble: "def:inherited.mother-thimble",
};

export function definitionOrThrow(defId: string): ItemDefinition {
  const found = DEFINITIONS[defId];
  if (!found) {
    throw new InheritanceError("unknown-def", `No definition for ${defId}.`);
  }
  return found;
}

export function legacyDefId(rowId: string): string {
  return LEGACY_DEF_IDS[rowId] ?? `def:legacy.${rowId}`;
}

export function definitionName(defId: string): string {
  return DEFINITIONS[defId]?.name ?? defId;
}

export function isKnownDef(defId: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEFINITIONS, defId);
}
