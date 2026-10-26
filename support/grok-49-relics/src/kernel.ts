import type { HandlerResult } from "./effect-types.ts";
import type { EffectResult, Intent, RelicRecord, World } from "./types.ts";
import { handlers } from "./handlers.ts";
import { sealedSignature } from "./seal.ts";
import { settle } from "./settle.ts";

const BYPASS = new Set(["restore", "rest", "fold", "close", "unwrap", "cover", "doff", "confess", "repair", "return-nail"]);

export function fail(world: World, code: string, detail: string): EffectResult {
  return { ok: false, code, detail, world };
}

export function acquire(world: World, relic: RelicRecord): EffectResult {
  const owned =
    world.inventory.some((item) => item.relicId === relic.id) ||
    world.placed.some((place) => place.instance.relicId === relic.id) ||
    world.veinBank.some((item) => item.relicId === relic.id);
  if (owned) {
    return fail(
      world,
      "duplicate-refused",
      `The Marble Vein refuses a second ${relic.name}. The source was only ever one.`,
    );
  }
  const source = world.sources[relic.uniqueness.sourceId];
  if (!source || !source.available || source.consumed) {
    return fail(world, "source-spent", `${relic.name} has already been taken from its only source.`);
  }
  const draft = structuredClone(world);
  draft.sources[relic.uniqueness.sourceId] = { relicId: relic.id, available: false, consumed: true };
  draft.inventory.push({
    instanceId: `inst.${relic.id}`,
    relicId: relic.id,
    sourceId: relic.uniqueness.sourceId,
    state: "intact",
    bound: {},
  });
  draft.log.push(`Taken: ${relic.name}.`);
  return {
    ok: true,
    code: "acquired",
    detail: `Ellis takes ${relic.name}. There will not be another.`,
    world: draft,
  };
}

export function resolve(world: World, intent: Intent, catalog: RelicRecord[]): EffectResult {
  const relic = catalog.find((entry) => entry.id === intent.relicId);
  if (!relic) return fail(world, "unknown-relic", "That id is not in the reserved relic band.");
  if (intent.kind === "acquire") return acquire(world, relic);

  const carried =
    world.inventory.some((item) => item.relicId === relic.id) ||
    world.placed.some((place) => place.instance.relicId === relic.id);
  if (!carried) return fail(world, "not-carried", `${relic.name} is not in Ellis's keeping.`);

  if (relic.exclusiveGroup && !BYPASS.has(intent.kind)) {
    const clash = world.locks.find(
      (lock) => lock.group === relic.exclusiveGroup && lock.untilTick > world.tick && lock.ownerId !== relic.id,
    );
    if (clash) {
      return fail(
        world,
        "exclusive-conflict",
        `${relic.name} cannot act while ${clash.ownerId} still holds the ${clash.group} relation.`,
      );
    }
  }

  const handler = handlers[relic.handler];
  if (!handler) return fail(world, "no-handler", `${relic.name} has no executable handler.`);

  const draft = structuredClone(world);
  settle(draft);
  const before = sealedSignature(draft);
  const instance =
    draft.inventory.find((item) => item.relicId === relic.id) ??
    draft.placed.find((place) => place.instance.relicId === relic.id)?.instance ??
    null;

  let result: HandlerResult;
  try {
    result = handler({ world: draft, intent, relic, instance, catalog });
  } catch (error) {
    const message = error instanceof Error ? error.message : "handler failed";
    return fail(world, "handler-error", message);
  }
  if (!result.ok) return { ok: false, code: result.code, detail: result.detail, world };

  if (sealedSignature(draft) !== before) {
    return fail(
      world,
      "protected-reference",
      "The effect tried to rewrite a protected quest, document, or campaign boundary. The vein refused the whole change.",
    );
  }

  if (result.lineage) draft.lineage.push(...result.lineage);
  if (result.lock && relic.exclusiveGroup) {
    draft.locks.push({
      group: relic.exclusiveGroup,
      ownerId: relic.id,
      untilTick: draft.tick + (result.lockTicks ?? 1),
    });
  }
  draft.log.push(result.detail);
  return { ok: true, code: result.code, detail: result.detail, world: draft };
}
