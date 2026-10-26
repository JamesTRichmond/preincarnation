import { ACTION_CUES, RESTRICTIVE_ACTIONS, actionVerb } from "./cues.ts";
import {
  causePhrase,
  hideIneligibleWhy,
  inspectDocument,
  preservationCauses,
  ruleMatches,
  summarizeRule,
} from "./inspect.ts";
import type {
  FilterContext,
  FilterDecision,
  FilterDocument,
  FilterResult,
  FilterRule,
  GroundItem,
  PresentedEntry,
  ShadowedRule,
} from "./types.ts";

const LIMIT =
  "Filtering does not pick up, sell, salvage, or destroy the object.";

interface RankedRule {
  rule: FilterRule;
  priority: number;
}

function shadowOf(ranked: RankedRule): ShadowedRule {
  return {
    id: ranked.rule.id,
    name: ranked.rule.name,
    action: ranked.rule.action,
    priority: ranked.priority,
  };
}

function decide(
  item: GroundItem,
  fields: Omit<FilterDecision, "itemId" | "effect" | "authorizes" | "cue" | "howToChange"> & {
    howToChange: string;
  },
): FilterDecision {
  return {
    itemId: item.id,
    effect: "presentation",
    authorizes: { pickup: false, sale: false, salvage: false, destroy: false },
    cue: ACTION_CUES[fields.action],
    ...fields,
    howToChange: `${fields.howToChange} ${LIMIT}`,
  };
}

function changeRule(rule: FilterRule, priority: number): string {
  const note = rule.note ? ` Note on the rule: ${rule.note}` : "";
  return `Edit “${rule.name}” (priority ${priority}) in Advanced, move it, or turn it off. Another preset replaces the whole list. Show everything pauses the list without deleting it.${note}`;
}

function changePreserved(rule: FilterRule | null, priority: number | null): string {
  const who = rule
    ? `“${rule.name}” (priority ${priority}) asked for a quieter label and was refused.`
    : "No rule asked to change this label.";
  return `${who} Essential quest items, first-time discoveries, and explicitly protected items cannot be hidden, quieted, or stacked. Show everything only returns a normal label.`;
}

function plural(count: number, singular: string, pluralLabel: string): string {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

function present(items: readonly GroundItem[], decisions: readonly FilterDecision[]): {
  ground: PresentedEntry[];
  hidden: PresentedEntry[];
} {
  const byId = new Map(decisions.map((decision) => [decision.itemId, decision]));
  const ground: PresentedEntry[] = [];
  const hidden: PresentedEntry[] = [];
  const stackIndex = new Map<string, number>();

  for (const item of items) {
    const decision = byId.get(item.id);
    if (!decision) {
      throw new Error(`Missing decision for ${item.id}`);
    }
    if (decision.action === "hide") {
      hidden.push({ kind: "single", key: item.id, items: [item], decision });
      continue;
    }
    if (decision.action === "collapse") {
      const stackKey = item.stackKey || item.id;
      const existing = stackIndex.get(stackKey);
      if (existing == null) {
        const entry: PresentedEntry = {
          kind: "collapsed",
          key: `stack:${stackKey}`,
          items: [item],
          decisions: [decision],
          decision: withStackCopy(decision, 1, item.quantity),
          label: item.name,
          pileCount: 1,
          quantityTotal: item.quantity,
        };
        stackIndex.set(stackKey, ground.length);
        ground.push(entry);
      } else {
        const current = ground[existing];
        if (!current || current.kind !== "collapsed") {
          throw new Error("Stack slot was not a collapsed entry.");
        }
        const nextItems = [...current.items, item];
        const nextDecisions = [...current.decisions, decision];
        const quantityTotal = current.quantityTotal + item.quantity;
        const label = nextItems.every((pile) => pile.name === nextItems[0]?.name)
          ? (nextItems[0]?.name ?? item.name)
          : "Mixed labels";
        const base = nextDecisions[0] ?? decision;
        ground[existing] = {
          kind: "collapsed",
          key: current.key,
          items: nextItems,
          decisions: nextDecisions,
          decision: withStackCopy(base, nextItems.length, quantityTotal),
          label,
          pileCount: nextItems.length,
          quantityTotal,
        };
      }
      continue;
    }
    ground.push({ kind: "single", key: item.id, items: [item], decision });
  }

  return { ground, hidden };
}

function withStackCopy(
  base: FilterDecision,
  pileCount: number,
  quantityTotal: number,
): FilterDecision {
  const prefix =
    pileCount === 1
      ? "One pile carries the stack cue, with no duplicate to merge yet."
      : `${plural(pileCount, "pile shares", "piles share")} one label (${quantityTotal} total). Each pile is still its own object.`;
  return {
    ...base,
    reason: `${prefix} ${base.reason}`,
  };
}

function evaluateItem(
  item: GroundItem,
  document: FilterDocument,
  context: FilterContext,
  problemIds: ReadonlySet<string>,
): FilterDecision {
  const causes = preservationCauses(item);
  const applicable: RankedRule[] = [];
  for (let index = 0; index < document.rules.length; index += 1) {
    const rule = document.rules[index];
    if (!rule || !rule.enabled || problemIds.has(rule.id)) continue;
    if (!ruleMatches(rule, item, context)) continue;
    applicable.push({ rule, priority: index + 1 });
  }

  const deferred: { id: string; name: string; why: string }[] = [];
  for (let index = 0; index < applicable.length; index += 1) {
    const ranked = applicable[index];
    if (!ranked) continue;
    const { rule, priority } = ranked;
    const shadowed = applicable.slice(index + 1).map(shadowOf);

    if (RESTRICTIVE_ACTIONS.has(rule.action) && causes.length > 0) {
      return decide(item, {
        action: "emphasize",
        matchedRuleId: rule.id,
        matchedRuleName: rule.name,
        priority,
        shadowed,
        reason: `“${rule.name}” (priority ${priority}) matched and asked to ${actionVerb(rule.action)} this label. It stays marked because this is ${causePhrase(causes)}.`,
        howToChange: changePreserved(rule, priority),
        preserved: true,
        preservationCauses: causes,
        preservationApplied: true,
        showEverything: false,
        deferredHides: deferred,
      });
    }

    if (rule.action === "hide") {
      const why = hideIneligibleWhy(item);
      if (why) {
        deferred.push({ id: rule.id, name: rule.name, why });
        continue;
      }
    }

    const earlier =
      deferred.length > 0
        ? `A hide rule matched first but did not apply (${deferred.map((entry) => `${entry.name}: ${entry.why}`).join("; ")}). `
        : "";
    const safety =
      causes.length > 0 ? ` It is also ${causePhrase(causes)}, which a quieter rule cannot remove.` : "";
    return decide(item, {
      action: rule.action,
      matchedRuleId: rule.id,
      matchedRuleName: rule.name,
      priority,
      shadowed,
      reason: `${earlier}Rule “${rule.name}” is priority ${priority} and matched (${summarizeRule(rule, context)}).${safety}`,
      howToChange: changeRule(rule, priority),
      preserved: causes.length > 0,
      preservationCauses: causes,
      preservationApplied: false,
      showEverything: false,
      deferredHides: deferred,
    });
  }

  if (deferred.length > 0) {
    const first = deferred[0];
    const ranked = applicable.find((entry) => entry.rule.id === first?.id);
    return decide(item, {
      action: "show",
      matchedRuleId: first?.id ?? null,
      matchedRuleName: first?.name ?? null,
      priority: ranked?.priority ?? null,
      shadowed: [],
      reason: `“${first?.name ?? "A hide rule"}” matched but cannot hide this label because ${first?.why ?? "it is not eligible"}. It stays shown.`,
      howToChange: `Hide only applies to recognized categories whose use is already known, and never to quest essentials, first discoveries, or protected objects. Edit “${first?.name ?? "the rule"}”, or leave the label shown. Identifying an object is not connected in this fixture.`,
      preserved: causes.length > 0,
      preservationCauses: causes,
      preservationApplied: false,
      showEverything: false,
      deferredHides: deferred,
    });
  }

  if (causes.length > 0) {
    return decide(item, {
      action: "emphasize",
      matchedRuleId: null,
      matchedRuleName: null,
      priority: null,
      shadowed: [],
      reason: `No rule matched. This stays marked because it is ${causePhrase(causes)}.`,
      howToChange: changePreserved(null, null),
      preserved: true,
      preservationCauses: causes,
      preservationApplied: true,
      showEverything: false,
      deferredHides: [],
    });
  }

  return decide(item, {
    action: "show",
    matchedRuleId: null,
    matchedRuleName: null,
    priority: null,
    shadowed: [],
    reason: "No rule matched. The label stays at normal prominence.",
    howToChange:
      "Add a rule in Advanced, or choose a preset, to mark, stack, quiet, or hide labels like this one.",
    preserved: false,
    preservationCauses: [],
    preservationApplied: false,
    showEverything: false,
    deferredHides: [],
  });
}

function applyShowEverything(result: FilterResult): FilterResult {
  const decisions = result.decisions.map((decision) =>
    decide(
      // decide needs an item id only; reuse the decision's id via a stub through fields.
      { id: decision.itemId } as GroundItem,
      {
        action: "show",
        matchedRuleId: null,
        matchedRuleName: null,
        priority: null,
        shadowed: decision.shadowed,
        reason: `Show everything is on, so this label stays normal. Without it: ${decision.reason}`,
        howToChange: `Turn off Show everything to use the ordered rules again. ${decision.howToChange}`,
        preserved: decision.preserved,
        preservationCauses: decision.preservationCauses,
        preservationApplied: false,
        showEverything: true,
        deferredHides: decision.deferredHides,
      },
    ),
  );
  const laid = present(result.retained, decisions);
  return {
    decisions,
    ground: laid.ground,
    hidden: laid.hidden,
    ruleProblems: result.ruleProblems,
    retained: result.retained,
  };
}

/**
 * Presentation pass. Input objects are returned on `retained` and are not mutated.
 * Hidden entries are still those same objects — they are only withdrawn from the ground list.
 */
export function evaluateLoot(
  items: readonly GroundItem[],
  document: FilterDocument,
  context: FilterContext,
): FilterResult {
  if (document.showEverything) {
    const underlying = evaluateLoot(items, { ...document, showEverything: false }, context);
    return applyShowEverything(underlying);
  }

  const problems = inspectDocument(document);
  const problemIds = new Set(problems.map((problem) => problem.id));
  const decisions = items.map((item) => evaluateItem(item, document, context, problemIds));
  const laid = present(items, decisions);
  return {
    decisions,
    ground: laid.ground,
    hidden: laid.hidden,
    ruleProblems: problems,
    retained: items,
  };
}

export function accountedIds(result: FilterResult): string[] {
  const ids: string[] = [];
  for (const entry of [...result.ground, ...result.hidden]) {
    for (const item of entry.items) ids.push(item.id);
  }
  return ids;
}
