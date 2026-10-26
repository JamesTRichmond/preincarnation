import { CATALOG, catalogBySku } from "./catalog.ts";
import { evaluatePolicy } from "./evaluator.ts";
import { isKnownPreset, rulesFromPreset, type PresetParam } from "./presets.ts";
import { CATEGORIES } from "./types.ts";
import type {
  CatalogItem,
  Category,
  CategoryRule,
  Evaluation,
  InstanceDirective,
  PolicyInput,
  Project,
  ReferenceRule,
  ReferenceSnapshot,
  Stack,
  StorageDirectives,
} from "./types.ts";

export type Adapted = {
  input: PolicyInput;
  warnings: string[];
  evaluation: Evaluation;
  directives: StorageDirectives;
};

/** Storage snapshot in, policy directives out. Stock is not modified. */
export function evaluateReference(snapshot: ReferenceSnapshot, catalog: readonly CatalogItem[] = CATALOG): Adapted {
  const { input, warnings } = fromReference(snapshot, catalog);
  const evaluation = evaluatePolicy(input);
  return { input, warnings, evaluation, directives: toDirectives(evaluation, warnings) };
}

export function fromReference(
  snapshot: ReferenceSnapshot,
  catalog: readonly CatalogItem[] = CATALOG,
): { input: PolicyInput; warnings: string[] } {
  const warnings: string[] = [];
  const known = catalogBySku(catalog);
  const stacks: Stack[] = [];

  snapshot.stacks.forEach((raw, index) => {
    if (!Number.isInteger(raw.qty) || raw.qty < 0) {
      warnings.push(`Stack ${raw.stackId} has quantity ${raw.qty}. It was left out of the evaluation rather than rewritten.`);
      return;
    }
    if (raw.qty === 0) return;
    const item = known.get(raw.sku);
    const attrs = raw.attrs ?? {};
    if (!item && !attrs.name) {
      warnings.push(`Sku ${raw.sku} is not in the catalog. It is still evaluated under the name on the stack, or the sku itself.`);
    }
    let category: Category = item?.category ?? "material";
    if (attrs.category) {
      if (isCategory(attrs.category)) category = attrs.category;
      else {
        warnings.push(`Stack ${raw.stackId} category “${attrs.category}” is not a known category. Catalog category ${category} was used.`);
      }
    } else if (!item) {
      warnings.push(`Stack ${raw.stackId} has no category. It was treated as material so it is not silently dropped.`);
    }
    const gift =
      attrs.giftName && attrs.giftName.trim()
        ? { from: attrs.giftFrom?.trim() || "unnamed giver", name: attrs.giftName.trim() }
        : null;
    if (attrs.lock && !attrs.lockReason) {
      warnings.push(`Stack ${raw.stackId} is marked lock without a reason. The lock is kept and the missing reason is stated, not invented.`);
    }
    stacks.push({
      id: raw.stackId,
      itemId: raw.sku,
      name: attrs.name?.trim() || item?.name || raw.sku,
      category,
      tags: attrs.tags ? [...attrs.tags] : [...(item?.tags ?? [])],
      quantity: raw.qty,
      eraId: raw.eraId || snapshot.eraId,
      acquiredAt: raw.acquiredAt ?? index + 1,
      lineageId: attrs.lineageId,
      unique: Boolean(attrs.unique),
      discovered: Boolean(attrs.discovered),
      gift,
      protectedMeta: attrs.lock
        ? {
            locked: true,
            reason: attrs.lockReason?.trim() || "Locked, with no reason written on the stack.",
            author: attrs.lockAuthor ?? "player",
          }
        : null,
    });
  });

  for (const stack of stacks) {
    if (!stack.lineageId) continue;
    const parent = snapshot.stacks.find((raw) => raw.stackId === stack.lineageId);
    const parentLocked = Boolean(parent?.attrs?.lock);
    const childLocked = Boolean(stack.protectedMeta?.locked);
    const directedAt = (stackId: string) =>
      snapshot.rules.some((rule) => "stackId" in rule && rule.stackId === stackId && rule.enabled !== false);
    const kinDirected = snapshot.stacks.some(
      (raw) =>
        raw.stackId !== stack.id &&
        (raw.stackId === stack.lineageId || raw.attrs?.lineageId === stack.lineageId) &&
        directedAt(raw.stackId),
    );
    const selfDirected = directedAt(stack.id);
    if ((parentLocked && !childLocked) || (kinDirected && !selfDirected) || (directedAt(stack.lineageId) && !selfDirected)) {
      warnings.push(
        `Stack ${stack.id} split from ${stack.lineageId}. Instance rules and lock metadata were not copied. Category rules still see both when they match.`,
      );
    }
  }

  const categoryRules: CategoryRule[] = [];
  const instanceDirectives: InstanceDirective[] = [];
  let offerSurplus = Boolean(snapshot.offerSurplusForSale);

  for (const rule of snapshot.rules) {
    if ("preset" in rule) {
      if (!isKnownPreset(rule.preset)) {
        warnings.push(`Preset ${rule.preset} is not one of the twelve. It was skipped.`);
        continue;
      }
      if (rule.enabled === false) continue;
      if (rule.preset === "surplus-sale") {
        offerSurplus = true;
        continue;
      }
      if (rule.preset === "restoration-hold") continue;
      const params: PresetParam = rule.params ?? {};
      categoryRules.push(...rulesFromPreset(rule.preset, params));
      continue;
    }
    if ("stackId" in rule) {
      instanceDirectives.push({
        id: rule.id,
        stackId: rule.stackId,
        mode: rule.mode,
        quantity: rule.quantity,
        reason: rule.reason,
        enabled: rule.enabled !== false,
      });
      continue;
    }
    categoryRules.push({
      id: rule.id,
      name: rule.name?.trim() || rule.id,
      enabled: rule.enabled !== false,
      rank: rule.rank ?? 500,
      selector: rule.selector,
      keep: rule.keep,
      grouping: rule.grouping,
    });
  }

  const projects: Project[] = snapshot.projects.map((project) => ({
    id: project.projectId,
    name: project.name,
    status: project.status,
    priority: project.priority,
    recipeRevision: project.recipeRevision,
    previousRevision: project.previousRevision,
    previousLines: project.previousLines?.map((line) => ({
      itemId: line.itemId,
      quantity: line.quantity,
      substitutes: line.substitutes.map((substitute) => ({ ...substitute })),
    })),
    lines: project.lines.map((line) => ({
      itemId: line.itemId,
      quantity: line.quantity,
      substitutes: line.substitutes.map((substitute) => ({ ...substitute })),
    })),
    presetId: project.presetId,
  }));

  return {
    warnings,
    input: {
      eraId: snapshot.eraId,
      eraIndex: snapshot.eraIndex,
      stacks,
      instanceDirectives,
      categoryRules,
      projects,
      offerSurplusForSale: offerSurplus,
      requestedAutoDispose: snapshot.requestedAutoDispose,
    },
  };
}

export function toDirectives(evaluation: Evaluation, warnings: string[] = []): StorageDirectives {
  return {
    eraId: evaluation.eraId,
    autoDispose: false,
    stacks: evaluation.dispositions.map((row) => ({
      stackId: row.stackId,
      sku: row.itemId,
      quantity: row.quantity,
      protected: row.protected,
      reserved: row.reserved,
      available: row.available,
      surplus: row.surplus,
      saleOffer: row.saleOffer,
      reasons: row.reasons.map((reason) => reason.text),
    })),
    reservations: evaluation.dispositions.flatMap((row) =>
      row.reservedBy.map((entry) => ({
        projectId: entry.projectId,
        sku: row.itemId,
        quantity: entry.quantity,
        via: entry.via,
        coversSku: entry.forItemId,
      })),
    ),
    shortfalls: evaluation.projects.flatMap((project) =>
      project.lines
        .filter((line) => line.shortfall > 0)
        .map((line) => ({
          projectId: project.projectId,
          sku: line.itemId,
          shortfall: line.shortfall,
          notes: [...line.notes, ...line.blockedBy.map((note) => note.text)],
        })),
    ),
    saleOffers: evaluation.dispositions
      .filter((row) => row.saleOffer > 0)
      .map((row) => ({ stackId: row.stackId, sku: row.itemId, quantity: row.saleOffer })),
    conflicts: evaluation.conflicts.map((conflict) => `${conflict.text} ${conflict.resolution}`),
    eraEffects: evaluation.eraEffects.map((effect) => effect.text),
    warnings: [...warnings],
  };
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

/** The reference rule list, for callers that only know preset ids. */
export function findRule(snapshot: ReferenceSnapshot, id: string): ReferenceRule | undefined {
  return snapshot.rules.find((rule) => rule.id === id);
}
