import type { CategoryRule, EraScope, Project, RecipeLine } from "./types.ts";

export type PresetParam = { keep?: number; sessions?: number; era?: EraScope };

export type Preset = {
  id: string;
  name: string;
  summary: string;
  /** Project template rather than a category floor. */
  kind: "rules" | "project" | "sale";
};

/** One fishing session, stated in units. Sessions multiply this. Not guessed. */
export const FISHING_SESSION: Array<{ itemId: string; perSession: number; label: string }> = [
  { itemId: "nightcrawler", perSession: 4, label: "nightcrawlers" },
  { itemId: "river-fly", perSession: 2, label: "river flies" },
  { itemId: "hook", perSession: 2, label: "hooks" },
  { itemId: "line-spool", perSession: 1, label: "line spools" },
];

export const PRESETS: readonly Preset[] = [
  {
    id: "healing-meals",
    name: "Eight healing meals",
    summary: "Keep eight foods tagged healing. Bandages are gear and are not counted as meals.",
    kind: "rules",
  },
  {
    id: "restoration-hold",
    name: "Reserve this restoration",
    summary: "Hold the chapel project’s current material list. Edit the lines; nothing is reserved in secret.",
    kind: "project",
  },
  {
    id: "one-discovered",
    name: "One of each discovery",
    summary: "Keep one of every discovered item. Further copies are surplus, not a story judgment.",
    kind: "rules",
  },
  {
    id: "named-gifts",
    name: "Protect named gifts",
    summary: "Protect every unit that already carries a gift name. Objects without that metadata are skipped.",
    kind: "rules",
  },
  {
    id: "fishing-sessions",
    name: "Two fishing sessions",
    summary: "Hold this era’s bait and line for two trips. The next era does not inherit the cache.",
    kind: "rules",
  },
  {
    id: "surplus-sale",
    name: "Offer only surplus",
    summary: "A sale batch may offer what remains after locks, floors, and reservations. Nothing is discarded.",
    kind: "sale",
  },
  {
    id: "heirloom-shelf",
    name: "Heirloom shelf",
    summary: "Keep one of each heirloom because the category says so, not because of an untold story.",
    kind: "rules",
  },
  {
    id: "staple-pantry",
    name: "Pantry staples",
    summary: "Keep twelve staple meals, separate from the healing-meal floor.",
    kind: "rules",
  },
  {
    id: "bait-cache",
    name: "Bait of each kind",
    summary: "Keep six of every bait. A stricter fishing rule still holds the higher floor.",
    kind: "rules",
  },
  {
    id: "spare-gear",
    name: "Spare gear",
    summary: "Keep one of each piece of gear. A second rod can be offered.",
    kind: "rules",
  },
  {
    id: "unique-materials",
    name: "Unique materials",
    summary: "Keep one of each material the stack itself marks unique. Unmarked stock is not assumed rare.",
    kind: "rules",
  },
  {
    id: "prior-era-curios",
    name: "Prior-era curios",
    summary: "Once a life turns, keep one of each curiosity from earlier eras. Current-era finds wait.",
    kind: "rules",
  },
] as const;

export const PRESET_IDS = PRESETS.map((preset) => preset.id);

const CHAPEL_LINES: RecipeLine[] = [
  { itemId: "oak-beam", quantity: 8, substitutes: [] },
  { itemId: "lime", quantity: 10, substitutes: [] },
  { itemId: "river-stone", quantity: 8, substitutes: [] },
  { itemId: "copper-nail", quantity: 20, substitutes: [] },
];

export function projectFromPreset(id: string): Project | null {
  if (id !== "restoration-hold") return null;
  return {
    id: "project-chapel",
    name: "River chapel restoration",
    status: "active",
    priority: 1,
    recipeRevision: 1,
    lines: CHAPEL_LINES.map((line) => ({ ...line, substitutes: [...line.substitutes] })),
    presetId: "restoration-hold",
  };
}

export function rulesFromPreset(id: string, params: PresetParam = {}): CategoryRule[] {
  switch (id) {
    case "healing-meals": {
      const keep = params.keep ?? 8;
      return [
        rule(id, `Keep ${keep} healing meals`, 10, {
          category: "food",
          tag: "healing",
          era: params.era ?? "any",
        }, keep, "pool"),
      ];
    }
    case "one-discovered":
      return [
        rule(id, "One of each discovery", 20, { discovered: true, era: params.era ?? "any" }, params.keep ?? 1, "each-item"),
      ];
    case "named-gifts":
      return [rule(id, "Protect named gifts", 30, { namedGift: true, era: params.era ?? "any" }, "all", "each-item")];
    case "fishing-sessions": {
      const sessions = params.sessions ?? 2;
      const era = params.era ?? "current";
      return FISHING_SESSION.map((entry, index) =>
        rule(
          id,
          `${sessions} fishing sessions — ${entry.label}`,
          40 + index,
          { itemId: entry.itemId, era },
          entry.perSession * sessions,
          "pool",
          `${id}:${entry.itemId}`,
        ),
      );
    }
    case "heirloom-shelf":
      return [rule(id, "Heirloom shelf", 50, { category: "heirloom", era: params.era ?? "any" }, params.keep ?? 1, "each-item")];
    case "staple-pantry":
      return [
        rule(id, "Pantry staples", 60, { category: "food", tag: "staple", era: params.era ?? "any" }, params.keep ?? 12, "pool"),
      ];
    case "bait-cache":
      return [rule(id, "Bait of each kind", 70, { category: "bait", era: params.era ?? "any" }, params.keep ?? 6, "each-item")];
    case "spare-gear":
      return [rule(id, "Spare gear", 80, { category: "gear", era: params.era ?? "any" }, params.keep ?? 1, "each-item")];
    case "unique-materials":
      return [
        rule(
          id,
          "Unique materials",
          90,
          { category: "material", unique: true, era: params.era ?? "any" },
          params.keep ?? 1,
          "each-item",
        ),
      ];
    case "prior-era-curios":
      return [
        rule(id, "Prior-era curios", 100, { tag: "curiosity", era: "prior" }, params.keep ?? 1, "each-item"),
      ];
    default:
      return [];
  }
}

function rule(
  presetId: string,
  name: string,
  rank: number,
  selector: CategoryRule["selector"],
  keep: number | "all",
  grouping: CategoryRule["grouping"],
  id = `preset:${presetId}`,
): CategoryRule {
  return { id, name, enabled: true, rank, presetId, selector, keep, grouping };
}

export function isKnownPreset(id: string): boolean {
  return PRESET_IDS.includes(id);
}
