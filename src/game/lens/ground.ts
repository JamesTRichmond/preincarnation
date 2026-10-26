import type { RelicId } from "../items.ts";
import type { PropSpec } from "../maps.ts";
import type { Flags } from "../types.ts";
import { evaluateLoot } from "./engine.ts";
import { ACTION_CUES } from "./cues.ts";
import type { FilterAction, FilterDocument, GroundItem } from "./types.ts";

/** The only plot. Project-focus rules treat these finds as the current work. */
export const MARBLE_PROJECT = "marble-vein";
export const MARBLE_LABEL = "Marble Vein";

const LOOT_KINDS = new Set([
  "bush",
  "chest",
  "pot",
  "cache",
  "rifle",
  "syrup",
  "creemee",
  "grave",
  "key",
  "lock",
  "relic",
]);

const VEIN_RELICS = new Set<string>(["shovel", "lantern", "hammer"]);

export function isGroundLoot(kind: string): boolean {
  return LOOT_KINDS.has(kind);
}

function stackKey(prop: PropSpec): string {
  if (prop.kind === "cache") return "cache:" + (prop.cache ?? "wild");
  return prop.kind + ":" + prop.id;
}

function onVein(prop: PropSpec): boolean {
  if (prop.kind === "key" || prop.kind === "lock") return true;
  if (prop.kind === "chest" && prop.id.includes("quarry")) return true;
  if (prop.kind === "relic" && VEIN_RELICS.has(prop.relic ?? "shovel")) return true;
  return false;
}

export function propToGround(prop: PropSpec, flags: Pick<Flags, "relics">): GroundItem {
  const vein = onVein(prop);
  const base = {
    id: prop.id,
    quantity: 1,
    stackKey: stackKey(prop),
    source: "world",
    projectTags: vein ? [MARBLE_PROJECT] : [],
    mastery: "unrelated" as const,
    protected: prop.kind === "grave" || prop.kind === "key" || prop.kind === "lock" || vein,
    essentialQuest: prop.kind === "grave" || prop.kind === "key" || prop.kind === "lock" || vein,
    firstDiscovery: false,
    detail: "Still on the ground.",
  };

  if (prop.kind === "grave") {
    return {
      ...base,
      name: "Grave",
      category: "relic",
      knownUse: "known",
      collectionStatus: "seen",
      ownership: "quest-bound",
      detail: "A body from an earlier chapter.",
    };
  }
  if (prop.kind === "key" || prop.kind === "lock") {
    return {
      ...base,
      name: prop.kind === "key" ? "Key" : "Lock",
      category: "tool",
      knownUse: "known",
      collectionStatus: "seen",
      ownership: "quest-bound",
      detail: "The quarry door.",
    };
  }
  if (prop.kind === "relic") {
    const id = (prop.relic ?? "shovel") as RelicId;
    const owned = flags.relics.includes(id);
    return {
      ...base,
      name: id,
      category: "relic",
      knownUse: owned ? "known" : "unidentified",
      collectionStatus: owned ? "complete" : "undiscovered",
      ownership: vein ? "quest-bound" : "unowned",
      firstDiscovery: !owned,
      essentialQuest: base.essentialQuest || !owned,
      detail: "A relic in the grass.",
    };
  }
  if (prop.kind === "chest") {
    return {
      ...base,
      name: "Chest",
      category: vein ? "relic" : "curiosity",
      knownUse: "known",
      collectionStatus: "seen",
      ownership: vein ? "quest-bound" : "unowned",
      detail: "A chest. The lens does not open it.",
    };
  }
  if (prop.kind === "cache") {
    return {
      ...base,
      name: "Cache",
      category: "material",
      knownUse: "known",
      collectionStatus: "seen",
      ownership: "unowned",
      detail: "Someone else's steel.",
    };
  }
  if (prop.kind === "rifle") {
    return {
      ...base,
      name: "Rifle",
      category: "weapon",
      knownUse: "known",
      collectionStatus: "seen",
      ownership: "unowned",
      mastery: "conflicts",
      detail: "A farmhouse rifle.",
    };
  }
  if (prop.kind === "syrup" || prop.kind === "creemee") {
    return {
      ...base,
      name: prop.kind === "syrup" ? "Maple tin" : "Creemee",
      category: "provision",
      knownUse: "known",
      collectionStatus: "seen",
      ownership: "unowned",
      detail: "Food.",
    };
  }
  if (prop.kind === "pot") {
    return {
      ...base,
      name: "Pot",
      category: "material",
      knownUse: "no-current-use",
      collectionStatus: "seen",
      ownership: "unowned",
      detail: "A pot with no current use.",
    };
  }
  return {
    ...base,
    name: "Bush",
    category: "material",
    knownUse: "known",
    collectionStatus: "seen",
    ownership: "unowned",
    detail: "Brush.",
  };
}

export function lensView(
  props: readonly PropSpec[],
  document: FilterDocument,
  flags: Pick<Flags, "relics">,
): { actions: Map<string, FilterAction>; notes: Map<string, string> } {
  const items = props.filter((prop) => isGroundLoot(prop.kind)).map((prop) => propToGround(prop, flags));
  const result = evaluateLoot(items, document, {
    currentProject: MARBLE_PROJECT,
    currentProjectLabel: MARBLE_LABEL,
  });
  const actions = new Map<string, FilterAction>();
  const notes = new Map<string, string>();
  for (const decision of result.decisions) {
    actions.set(decision.itemId, decision.action);
    const word = ACTION_CUES[decision.action].short;
    const rule = decision.matchedRuleName ? ` · ${decision.matchedRuleName}` : "";
    notes.set(decision.itemId, `${word}${rule}`);
  }
  return { actions, notes };
}

export function lensActions(
  props: readonly PropSpec[],
  document: FilterDocument,
  flags: Pick<Flags, "relics">,
): Map<string, FilterAction> {
  return lensView(props, document, flags).actions;
}

/** Ids to paint. Hidden loot is omitted. A collapsed stack paints its first member only. */
export function paintIds(props: readonly PropSpec[], actions: ReadonlyMap<string, FilterAction>): Set<string> {
  const paint = new Set<string>();
  const stacked = new Set<string>();
  for (const prop of props) {
    if (!isGroundLoot(prop.kind)) {
      paint.add(prop.id);
      continue;
    }
    const action = actions.get(prop.id) ?? "show";
    if (action === "hide") continue;
    if (action === "collapse") {
      const key = stackKey(prop);
      if (stacked.has(key)) continue;
      stacked.add(key);
    }
    paint.add(prop.id);
  }
  return paint;
}
