import { acquire, resolve } from "./kernel.ts";
import { PROBES, type Probe } from "./probes.ts";
import { applyPrep } from "./prep.ts";
import { RELICS, coverageReport, relicById } from "./catalog.ts";
import { advance } from "./settle.ts";
import { benchWorld } from "./world.ts";
import type { RelicId } from "./ids.ts";
export type { RelicId };
import type { EffectResult, Intent, World } from "./types.ts";

export { acquire, resolve } from "./kernel.ts";
export { resolveBlow, applyDeathPersistence } from "./death.ts";
export { capturePersistence, applyPersistence } from "./persist.ts";
export { advance } from "./settle.ts";
export { sealedSignature } from "./seal.ts";
export { RELICS, relicById, validateCatalog, coverageReport } from "./catalog.ts";
export { PROBES } from "./probes.ts";
export { relicId, parseRelicId, relicNumber } from "./ids.ts";
export type { Probe } from "./probes.ts";
export type * from "./types.ts";

export function createBench(): World {
  return benchWorld(RELICS.map((relic) => ({ id: relic.id, sourceId: relic.uniqueness.sourceId })));
}

export function prepareProbe(id: RelicId, base?: World): { world: World; intent: Intent; probe: Probe } {
  const probe = PROBES[id];
  if (!probe) throw new Error(`No probe for ${id}`);
  let world = base ?? createBench();
  const owned =
    world.inventory.some((item) => item.relicId === id) ||
    world.placed.some((place) => place.instance.relicId === id);
  if (!owned) {
    const got = acquire(world, relicById(id));
    if (!got.ok) throw new Error(got.detail);
    world = got.world;
  }
  world = applyPrep(world, probe.prep);
  return {
    world,
    probe,
    intent: { relicId: id, kind: probe.kind, targetId: probe.targetId, extra: probe.extra },
  };
}

export function runProbe(id: RelicId, base?: World): EffectResult {
  const prepared = prepareProbe(id, base);
  return resolve(prepared.world, prepared.intent, RELICS);
}

export function coverageLine(): string {
  const report = coverageReport();
  return `${report.executable} executable relics, ${report.vignette} with playable scenes, ${report.loreOnly} lore-only, ${report.generatedAffixes} generated affixes.`;
}

export function speak(world: World, personId: string): EffectResult {
  if (!world.actor.alive) {
    return { ok: false, code: "dead", detail: "Ellis is dead and cannot speak.", world };
  }
  if (world.actor.outOfYear !== null) {
    return {
      ok: false,
      code: "out-of-year",
      detail: "His mouth is still in the other year. They hear a shape, not a sentence.",
      world,
    };
  }
  const who = world.people.find((entry) => entry.id === personId);
  if (!who?.present) return { ok: false, code: "not-here", detail: "They are not here.", world };
  const draft = structuredClone(world);
  const line = draft.actor.cannotSayOwnName
    ? `${who.name} waits for a name Ellis cannot say. The matter waits with them.`
    : `${who.name} hears him in the present.`;
  draft.log.push(line);
  return { ok: true, code: draft.actor.cannotSayOwnName ? "nameless" : "spoke", detail: line, world: draft };
}

export { advance as stepTime };
