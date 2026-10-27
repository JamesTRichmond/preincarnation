import { definitionName } from "./catalog.ts";
import { eraIndexForYear, isPrincipalEraIndex } from "./eras.ts";
import type { ItemInstance, PrimaryDisposition, WorldState } from "./types.ts";
import { ERA_SPAN_YEARS, PLAYER_ID, PRINCIPAL_ERA_STARTS } from "./types.ts";

export function primaryDisposition(inst: ItemInstance): PrimaryDisposition {
  if (inst.status === "consumed" || inst.condition === "consumed") return "dismantled";
  if (inst.status === "closed") return "closed";
  if (inst.questBinding?.state === "bound") return "quest-bound";
  if (inst.ownership.title === "sold") return "sold";
  if (inst.ownership.title === "donated") return "donated";
  if (inst.ownership.ownerId === PLAYER_ID) {
    if (inst.storage.location === "carried") return "carried";
    if (inst.storage.location === "stored") return "stored";
    if (inst.storage.location === "displayed") return "displayed";
  }
  return "in-world";
}

export function countDispositions(world: WorldState): Record<PrimaryDisposition, number> {
  const counts: Record<PrimaryDisposition, number> = {
    carried: 0,
    stored: 0,
    displayed: 0,
    donated: 0,
    sold: 0,
    dismantled: 0,
    "quest-bound": 0,
    "in-world": 0,
    closed: 0,
  };
  for (const inst of Object.values(world.instances)) counts[primaryDisposition(inst)] += 1;
  return counts;
}

export function labelOf(inst: ItemInstance): string {
  return definitionName(inst.defId);
}

export function eraLabel(year: number): string {
  const index = eraIndexForYear(year);
  const start = index * ERA_SPAN_YEARS;
  const kind = isPrincipalEraIndex(index) ? "principal" : "later return";
  return `Era ${index} · year ${start} · ${kind}`;
}

export function principalEraStarts(): readonly number[] {
  return PRINCIPAL_ERA_STARTS;
}

export interface Audit {
  ok: boolean;
  errors: string[];
}

export function audit(world: WorldState): Audit {
  const errors: string[] = [];
  if (world.life.deathYear !== null) errors.push("The open life is already marked dead.");
  if (world.calendarYear < world.life.bornYear) errors.push("Calendar precedes this life's birth.");
  for (const life of world.lives) {
    if (life.deathYear === null || life.returnYear !== life.deathYear + ERA_SPAN_YEARS) {
      errors.push(`Completed life ${life.lifeIndex} does not return fourteen years later.`);
    }
  }
  const consumedKeys = new Set<string>();
  for (const source of world.consumedSources) {
    if (consumedKeys.has(source.sourceKey)) errors.push(`Source ${source.sourceKey} was consumed twice.`);
    consumedKeys.add(source.sourceKey);
    if (!world.instances[source.instanceId]) {
      errors.push(`Consumed source ${source.sourceKey} points at missing ${source.instanceId}.`);
    }
  }
  const bySource = new Map<string, ItemInstance[]>();
  for (const [id, inst] of Object.entries(world.instances)) {
    if (inst.instanceId !== id) errors.push(`Instance key ${id} does not match ${inst.instanceId}.`);
    if (inst.restoration.length === 0) errors.push(`${id} has no restoration history.`);
    if (inst.status === "active" && inst.qty < 1) errors.push(`${id} is active with empty quantity.`);
    if (inst.status !== "active" && inst.storage.location !== "none") {
      errors.push(`${id} is closed but still in player storage.`);
    }
    const player = inst.ownership.ownerId === PLAYER_ID && inst.status === "active";
    if (player && inst.ownership.title !== "sold" && inst.storage.location === "none") {
      errors.push(`${id} is Ellis's and active, but custody is empty.`);
    }
    if (!player && inst.status === "active" && inst.storage.location !== "none") {
      errors.push(`${id} occupies player storage without belonging to Ellis.`);
    }
    if (inst.storage.location === "displayed" && (inst.placement.kind !== "displayed" || !inst.placement.siteId)) {
      errors.push(`${id} is displayed without a site.`);
    }
    if (inst.placement.siteId) {
      const site = world.sites[inst.placement.siteId];
      if (site?.status === "vanished") errors.push(`${id} is still placed in vanished ${site.siteId}.`);
    }
    if (inst.condition === "historical" && !inst.era.historical) errors.push(`${id} condition is historical but the era flag is not.`);
    if (inst.era.historical && !inst.restoration.some((event) => event.action === "historical-mark")) {
      errors.push(`${id} is historical without an authored mark.`);
    }
    if (inst.condition === "restored" && !inst.restoration.some((event) => event.action === "restore")) {
      errors.push(`${id} is restored without a restoration entry.`);
    }
    if (inst.condition === "consumed" && inst.status !== "consumed") errors.push(`${id} is consumed in condition only.`);
    if (inst.questBinding?.state === "bound" && (inst.ownership.ownerId !== PLAYER_ID || inst.ownership.title !== "quest-bound")) {
      errors.push(`${id} is quest-bound but not held by Ellis.`);
    }
    if (inst.pendingTxn) {
      const snap = inst.pendingTxn.snapshot;
      if (snap.ownership.ownerId !== inst.ownership.ownerId || snap.status !== inst.status) {
        errors.push(`${id} pending ${inst.pendingTxn.kind} already changed ownership or status.`);
      }
    }
    const list = bySource.get(inst.worldSource.sourceKey) ?? [];
    list.push(inst);
    bySource.set(inst.worldSource.sourceKey, list);
  }
  for (const [sourceKey, rows] of bySource) {
    const policy = rows[0]?.worldSource.renewalPolicy;
    if (policy === "unique-once" || policy === "heirloom-lineage" || policy === "quest-once") {
      if (rows.length !== 1) errors.push(`Source ${sourceKey} has ${rows.length} instances; a lineage may have one.`);
    }
  }
  for (const entry of world.renewalLedger) {
    const inst = world.instances[entry.instanceId];
    if (!inst) {
      errors.push(`Renewal ledger names missing ${entry.instanceId}.`);
      continue;
    }
    if (inst.worldSource.renewalPolicy !== "renewable-common" || inst.era.historical || inst.storyId) {
      errors.push(`Node yield ${entry.instanceId} carries heirloom state.`);
    }
  }
  return { ok: errors.length === 0, errors };
}
