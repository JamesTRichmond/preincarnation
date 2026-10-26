import { CATALOG } from "./catalog/index.ts";
import { knownHandler, purposeSignature, SIGNATURE_KEYS } from "./handlers.ts";
import { MATERIAL_IDS } from "./materials.ts";
import { GAME_PORTS } from "./reference/game-ports.ts";
import { RECIPES } from "./recipes.ts";
import { lootId } from "./schema.ts";
import {
  CONSENTS,
  HANDLER_IDS,
  PLACES,
  RULE_IDS,
  STACKS,
  type CatalogItem,
  type RuleId,
  type ValidationReport,
} from "./types.ts";
import { dismantleBlock } from "./engine.ts";

const FACTORY_KEYS = [
  "queue",
  "queues",
  "crew",
  "crews",
  "ratePerDay",
  "perDay",
  "shifts",
  "throughput",
  "batchSize",
  "factory",
];

const RULE_SET = new Set<string>(RULE_IDS);
const PLACE_SET = new Set<string>(PLACES);
const STACK_SET = new Set<string>(STACKS);
const CONSENT_SET = new Set<string>(CONSENTS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateBundle(items: CatalogItem[], recipes: unknown[]): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = items.map((item) => item.id);
  const idSet = new Set(ids);

  if (items.length !== 240) errors.push(`expected 240 objects, found ${items.length}`);
  for (let n = 1; n <= 240; n += 1) {
    const id = lootId(n);
    if (!idSet.has(id)) errors.push(`missing ${id}`);
  }
  if (new Set(ids).size !== ids.length) errors.push("duplicate catalog ids");

  const names = new Map<string, string>();
  const purposes = new Map<string, string[]>();
  let uses = 0;

  for (const item of items) {
    if (!item.name?.trim()) errors.push(`${item.id} has no name`);
    if (/miscellaneous|vendor|assorted junk/i.test(item.name)) {
      errors.push(`${item.id} is vendor-trash or miscellaneous: ${item.name}`);
    }
    if (item.tags.some((tag) => /vendor|misc|sell-only/i.test(tag))) {
      errors.push(`${item.id} is tagged as junk to sell`);
    }
    const prior = names.get(item.name);
    if (prior) errors.push(`${item.id} reuses the name of ${prior}`);
    names.set(item.name, item.id);

    if (!item.appearance?.trim()) errors.push(`${item.id} has no appearance`);
    if (!item.source?.found?.trim() || !item.source.site?.trim()) errors.push(`${item.id} has no source`);
    if (!PLACE_SET.has(item.source.place)) errors.push(`${item.id} has an unknown place`);
    if (!STACK_SET.has(item.stack)) errors.push(`${item.id} has an unknown stack`);
    if (item.stack === "unique" && item.stackQty !== 1) errors.push(`${item.id} unique stack must be quantity 1`);
    if (item.condition.default < 0 || item.condition.default > 100) errors.push(`${item.id} condition out of range`);
    if (!item.condition.wearsFrom?.trim()) errors.push(`${item.id} does not say how it wears`);
    if (item.value.currency !== null) errors.push(`${item.id} has a currency price`);
    if (item.value.worthRank < 1 || item.value.worthRank > 5) errors.push(`${item.id} worth rank is not 1–5`);
    if (!item.value.barterInKind?.trim()) errors.push(`${item.id} has no in-kind value`);
    if (!CONSENT_SET.has(item.ownership.consent)) errors.push(`${item.id} has an unknown ownership consent`);
    if (!item.ownership.holder?.trim() || !item.ownership.claim?.trim()) {
      errors.push(`${item.id} ownership is incomplete`);
    }
    if (!item.era.first?.trim() || !item.era.return?.trim()) errors.push(`${item.id} is missing an era`);
    if (!item.protection.plain?.trim()) errors.push(`${item.id} protection is unspoken`);
    for (const rule of item.protection.rules) {
      if (!RULE_SET.has(rule.id)) errors.push(`${item.id} has unknown rule ${rule.id}`);
      if (rule.id === "sound-enough-to-keep" && rule.threshold == null) {
        errors.push(`${item.id} sound-enough-to-keep needs a threshold`);
      }
    }
    if (!item.restore) errors.push(`${item.id} has no restore record`);
    if (item.uses.length < 2) errors.push(`${item.id} needs two uses`);
    uses += item.uses.length;

    const sellish = item.uses.every((use) => /sell|vend|pawn/i.test(`${use.label} ${use.line}`));
    if (item.uses.length > 0 && sellish) errors.push(`${item.id} can only be sold`);

    for (const use of item.uses) {
      if (!knownHandler(use.handler)) errors.push(`${item.id} use ${use.id} has unknown handler ${use.handler}`);
      else {
        for (const key of SIGNATURE_KEYS[use.handler]) {
          if (!(key in use.params)) errors.push(`${item.id} ${use.handler} is missing signature key ${key}`);
        }
      }
      if (!use.line?.trim() || !use.label?.trim()) errors.push(`${item.id} has an empty use`);
    }

    const signature = purposeSignature(item);
    const who = purposes.get(signature) ?? [];
    who.push(`${item.id} ${item.name}`);
    purposes.set(signature, who);

    if (item.salvage.length < 1) errors.push(`${item.id} has no salvage`);
    for (const salvage of item.salvage) {
      const material = MATERIAL_IDS.has(salvage.yield);
      const loot = salvage.yield.startsWith("loot.common.") && idSet.has(salvage.yield);
      if (!material && !loot) errors.push(`${item.id} salvage ${salvage.yield} is neither a material nor a catalog id`);
      if (!salvage.note?.trim() || salvage.qty < 1) errors.push(`${item.id} salvage ${salvage.yield} is incomplete`);
    }

    for (const action of ["action.use", "action.dismantle", "action.trade", "action.display"]) {
      if (!item.actionRefs.includes(action)) errors.push(`${item.id} is missing ${action}`);
    }
    for (const ref of item.recipeRefs) {
      const recipe = recipes.find((row) => isRecord(row) && row.id === ref);
      if (!recipe) errors.push(`${item.id} references missing recipe ${ref}`);
    }
  }

  const purposeCollisions: string[] = [];
  for (const [signature, who] of purposes) {
    if (who.length > 1) {
      const message = `same purpose: ${who.join(" = ")}; ${signature}`;
      purposeCollisions.push(message);
      errors.push(message);
    }
  }

  for (const recipe of recipes) {
    if (!isRecord(recipe)) {
      errors.push("recipe is not a record");
      continue;
    }
    const id = String(recipe.id ?? "(unnamed recipe)");
    for (const key of FACTORY_KEYS) {
      if (key in recipe) errors.push(`${id} carries factory key ${key}`);
    }
    if (recipe.station !== "single-bench") errors.push(`${id} is not a single bench`);
    if (recipe.workers !== 1 || recipe.batch !== 1) {
      errors.push(`${id} is a factory job (workers ${String(recipe.workers)}, batch ${String(recipe.batch)})`);
    }
    if (typeof recipe.handler !== "string" || !knownHandler(recipe.handler)) {
      errors.push(`${id} handler is not a known interaction`);
    }
    const inputs = Array.isArray(recipe.inputs) ? recipe.inputs : [];
    const tools = Array.isArray(recipe.tools) ? recipe.tools : [];
    for (const input of inputs) {
      if (!isRecord(input) || typeof input.itemId !== "string" || !idSet.has(input.itemId)) {
        errors.push(`${id} input is not a catalog object`);
      }
    }
    for (const tool of tools) {
      if (typeof tool !== "string" || !idSet.has(tool)) errors.push(`${id} tool ${String(tool)} is not a catalog object`);
    }
    if (isRecord(recipe.effect)) {
      const effect = recipe.effect;
      if (typeof effect.subjectId === "string" && !idSet.has(effect.subjectId)) {
        errors.push(`${id} subject is not a catalog object`);
      }
    }
  }

  const blockedSalvage = items.flatMap((item) => {
    const why = dismantleBlock(item, item.condition.default);
    return why ? [{ id: item.id, name: item.name, why }] : [];
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      items: items.length,
      uses,
      recipes: recipes.length,
      handlers: HANDLER_IDS.length,
      materials: MATERIAL_IDS.size,
    },
    missingExternal: GAME_PORTS.map((port) => ({ ...port })),
    blockedSalvage,
    purposeCollisions,
  };
}

export function validateLoot(): ValidationReport {
  return validateBundle(CATALOG, RECIPES);
}

export function ruleKnown(id: string): id is RuleId {
  return RULE_SET.has(id);
}
