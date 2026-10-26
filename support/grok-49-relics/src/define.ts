import { relicId } from "./ids.ts";
import type { Coverage, OnDeath, PersistScope, RelicRecord } from "./types.ts";

export interface Spec {
  n: number;
  name: string;
  coverage?: Coverage;
  summary: string;
  place: string;
  staging: string;
  trigger: string;
  veinLife: string;
  chain: string[];
  stamp: string;
  appearance: string;
  power: string;
  tradeoff: string;
  restore: string[] | null;
  lineageRequired?: boolean;
  lineage: [string, string][];
  ellis: string;
  scope: PersistScope;
  onDeath: OnDeath;
  source: string;
  quests: string[];
  group: string | null;
  handler: string;
  params?: Record<string, unknown>;
  systems: string[];
  slots: string[];
  mustNot: string[];
}

export function defineRelic(spec: Spec): RelicRecord {
  const id = relicId(spec.n);
  return {
    id,
    name: spec.name,
    coverage: spec.coverage ?? "executable",
    summary: spec.summary,
    discovery: {
      sceneId: `scene.discover.${id}`,
      place: spec.place,
      staging: spec.staging,
      trigger: spec.trigger,
    },
    provenance: { veinLife: spec.veinLife, chain: spec.chain, stamp: spec.stamp },
    appearance: spec.appearance,
    power: spec.power,
    tradeoff: spec.tradeoff,
    restoration: {
      needed: spec.restore !== null,
      steps: spec.restore ?? [],
      lineageRequired: spec.lineageRequired ?? false,
    },
    lineage: spec.lineage.map(([person, response]) => ({ person, response })),
    ellis: spec.ellis,
    persistence: { scope: spec.scope, onDeath: spec.onDeath, saveKey: `vein.${id}` },
    uniqueness: { sourceId: spec.source, onDuplicate: "vein-refuses" },
    protectedQuestIds: spec.quests,
    exclusiveGroup: spec.group,
    handler: spec.handler,
    params: spec.params ?? {},
    integration: { systems: spec.systems, slots: spec.slots, mustNot: spec.mustNot },
  };
}
