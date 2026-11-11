import { RELICS } from "../../src/game/items.ts";
import type { HistoryObject } from "./types.ts";

/**
 * County relics the walk already carries. Compared by exact name and id.
 * The grok-57 candidate catalog and grok-71 nature notes use other id spaces
 * and are not this pack.
 */
export const EXTERNAL_CORPUS = {
  searched: [
    "src/game/items.ts RELICS",
    "src/game/loot grok-57 candidate catalog (separate id space, not imported)",
    "support/grok-71-natural-materials (loot.expansion.nature, README only on main)",
  ],
  relicCount: RELICS.length,
  documentCount: 0,
  note:
    "Compared exact names and ids with the fourteen county relics, including the Grave shovel and the Oil lamp. Those stay the walk's tools. This pack does not rename them, replace them, or enter the save. loot.expansion.history is unused elsewhere on main. Unresolved overlaps are exact name or id collisions only.",
} as const;

export interface OverlapHit {
  left: string;
  right: string;
  field: string;
  resolved: false;
}

function pairs(catalog: readonly HistoryObject[], field: (obj: HistoryObject) => string): OverlapHit[] {
  const seen = new Map<string, string>();
  const hits: OverlapHit[] = [];
  for (const obj of catalog) {
    const value = field(obj).trim().toLowerCase();
    const prior = seen.get(value);
    if (prior) {
      hits.push({ left: prior, right: obj.id, field: value.slice(0, 80), resolved: false });
    } else {
      seen.set(value, obj.id);
    }
  }
  return hits;
}

export function overlapReport(catalog: readonly HistoryObject[]): {
  internal: OverlapHit[];
  external: OverlapHit[];
  unresolved: OverlapHit[];
  note: string;
} {
  const internal = [
    ...pairs(catalog, (obj) => obj.name),
    ...pairs(catalog, (obj) => obj.evidence.readable),
    ...pairs(catalog, (obj) => obj.interaction.outcomeKey),
    ...pairs(catalog, (obj) => obj.interaction.verb),
    ...pairs(catalog, (obj) => obj.interaction.outcome),
  ];
  const external: OverlapHit[] = [];
  const relicNames = new Map(RELICS.map((relic) => [relic.name.trim().toLowerCase(), relic.id]));
  const relicIds = new Map(RELICS.map((relic) => [relic.id.toLowerCase(), relic.id]));
  for (const obj of catalog) {
    const byName = relicNames.get(obj.name.trim().toLowerCase());
    if (byName) {
      external.push({ left: `relic:${byName}`, right: obj.id, field: obj.name, resolved: false });
    }
    const byId = relicIds.get(obj.id.toLowerCase());
    if (byId) {
      external.push({ left: `relic:${byId}`, right: obj.id, field: obj.id, resolved: false });
    }
  }
  return {
    internal,
    external,
    unresolved: [...internal, ...external],
    note: EXTERNAL_CORPUS.note,
  };
}
