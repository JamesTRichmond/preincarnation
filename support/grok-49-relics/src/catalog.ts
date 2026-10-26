import { catalogA } from "./catalog-a.ts";
import { catalogB } from "./catalog-b.ts";
import { catalogC } from "./catalog-c.ts";
import { catalogD } from "./catalog-d.ts";
import { defineRelic } from "./define.ts";
import { handlers } from "./handlers.ts";
import { relicId, relicNumber } from "./ids.ts";
import type { RelicId } from "./ids.ts";
import type { RelicRecord } from "./types.ts";

export const RELICS: RelicRecord[] = [...catalogA, ...catalogB, ...catalogC, ...catalogD].map(defineRelic);

export function relicById(id: RelicId): RelicRecord {
  const relic = RELICS.find((entry) => entry.id === id);
  if (!relic) throw new Error(`Unknown relic ${id}`);
  return relic;
}

export function validateCatalog(relics: RelicRecord[] = RELICS): string[] {
  const errors: string[] = [];
  if (relics.length !== 96) errors.push(`expected 96 relics, found ${relics.length}`);
  const names = new Set<string>();
  const sources = new Set<string>();
  const stamps = new Set<string>();
  const scenes = new Set<string>();
  const seen = new Set<string>();
  for (let n = 1; n <= 96; n += 1) {
    const id = relicId(n);
    if (!relics.some((entry) => entry.id === id)) errors.push(`missing ${id}`);
  }
  for (const relic of relics) {
    if (seen.has(relic.id)) errors.push(`duplicate id ${relic.id}`);
    seen.add(relic.id);
    if (relicNumber(relic.id) < 1 || relicNumber(relic.id) > 96) errors.push(`out of band ${relic.id}`);
    if (names.has(relic.name)) errors.push(`duplicate name ${relic.name}`);
    names.add(relic.name);
    if (sources.has(relic.uniqueness.sourceId)) errors.push(`duplicate source ${relic.uniqueness.sourceId}`);
    sources.add(relic.uniqueness.sourceId);
    if (stamps.has(relic.provenance.stamp)) errors.push(`duplicate stamp on ${relic.name}`);
    stamps.add(relic.provenance.stamp);
    if (scenes.has(relic.discovery.sceneId)) errors.push(`duplicate discovery ${relic.discovery.sceneId}`);
    scenes.add(relic.discovery.sceneId);
    if (relic.provenance.chain.length < 2) errors.push(`short chain ${relic.id}`);
    if (relic.provenance.chain.some((link) => link.trim().length === 0)) errors.push(`empty chain link ${relic.id}`);
    if (relic.provenance.veinLife.trim().length < 8) errors.push(`vein life ${relic.id}`);
    if (!relic.discovery.place || !relic.discovery.staging || !relic.discovery.trigger) errors.push(`discovery ${relic.id}`);
    if (!relic.power || !relic.tradeoff || !relic.appearance || !relic.summary) errors.push(`text ${relic.id}`);
    if (!handlers[relic.handler]) errors.push(`no handler ${relic.id} ${relic.handler}`);
    if (relic.uniqueness.onDuplicate !== "vein-refuses") errors.push(`duplicate policy ${relic.id}`);
    if (relic.protectedQuestIds.length === 0) errors.push(`no protected quests listed ${relic.id}`);
    if (relic.integration.mustNot.length === 0) errors.push(`no mustNot ${relic.id}`);
  }
  const vignettes = relics.filter((entry) => entry.coverage === "vignette");
  if (vignettes.length < 12) errors.push(`expected at least 12 vignettes, found ${vignettes.length}`);
  return errors;
}

export function coverageReport(relics: RelicRecord[] = RELICS) {
  const vignette = relics.filter((entry) => entry.coverage === "vignette").length;
  return {
    total: relics.length,
    vignette,
    executable: relics.length,
    loreOnly: 0,
    generatedAffixes: 0,
  };
}
