import { RESTRICTIVE_ACTIONS, ACTION_CUES } from "./cues.ts";
import type {
  CollectionStatus,
  FilterContext,
  FilterDocument,
  FilterRule,
  GroundItem,
  KnownUse,
  MasteryCompatibility,
  Ownership,
  PreservationCause,
  RuleProblem,
} from "./types.ts";
import { KNOWN_CATEGORIES } from "./types.ts";

const KNOWN = new Set<string>(KNOWN_CATEGORIES);

export function isKnownCategory(category: string): boolean {
  return KNOWN.has(category);
}

export function preservationCauses(item: GroundItem): PreservationCause[] {
  const causes: PreservationCause[] = [];
  if (item.essentialQuest) causes.push("essential quest item");
  if (item.protected) causes.push("explicitly protected item");
  if (item.firstDiscovery || item.collectionStatus === "undiscovered") {
    causes.push("first-time discovery");
  }
  return causes;
}

export function causePhrase(causes: readonly PreservationCause[]): string {
  const phrases = causes.map((cause) => {
    if (cause === "essential quest item") return "an essential quest item";
    if (cause === "explicitly protected item") return "an explicitly protected item";
    return "a first-time discovery";
  });
  if (phrases.length === 0) return "an ordinary object";
  if (phrases.length === 1) return phrases[0] ?? "an ordinary object";
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
}

/** Why hide cannot apply, or null when the object is eligible. */
export function hideIneligibleWhy(item: GroundItem): string | null {
  const causes = preservationCauses(item);
  if (causes.length > 0) {
    return `it is ${causePhrase(causes)}`;
  }
  if (!isKnownCategory(item.category)) {
    return `the category “${item.category}” is not recognized`;
  }
  if (item.knownUse === "unidentified") {
    return "its use is still unidentified";
  }
  return null;
}

function emptyListProblem(rule: FilterRule): string | null {
  if (rule.knownUse && rule.knownUse.length === 0) {
    return "The known-use list is empty, so this rule can never match.";
  }
  if (rule.collectionStatus && rule.collectionStatus.length === 0) {
    return "The collection list is empty, so this rule can never match.";
  }
  if (rule.mastery && rule.mastery.length === 0) {
    return "The mastery list is empty, so this rule can never match.";
  }
  if (rule.ownership && rule.ownership.length === 0) {
    return "The ownership list is empty, so this rule can never match.";
  }
  if (rule.category?.kind === "in" && rule.category.values.length === 0) {
    return "The category list is empty, so this rule can never match.";
  }
  if (rule.category?.kind === "notIn" && rule.category.values.length === 0) {
    return "The excluded category list is empty, so this rule can never match.";
  }
  return null;
}

/**
 * Static contradictions. A conflicting rule is kept in the document so it can
 * be fixed, but the engine will not let it match.
 */
export function ruleProblem(rule: FilterRule): string | null {
  if (!rule.name.trim()) return "This rule needs a name.";
  const quantity = rule.quantity;
  if (quantity) {
    const { min, max } = quantity;
    if (min != null && max != null && min > max) {
      return "Quantity minimum is higher than the maximum, so this rule can never match.";
    }
    if ((min != null && min < 0) || (max != null && max < 0)) {
      return "Quantity cannot be negative.";
    }
  }
  const empty = emptyListProblem(rule);
  if (empty) return empty;
  if (rule.action === "hide" && rule.category?.kind === "unknown") {
    return "Hide cannot target unknown categories. Unrecognized objects stay visible until they are known.";
  }
  if (
    rule.action === "hide" &&
    rule.knownUse &&
    rule.knownUse.every((use) => use === "unidentified")
  ) {
    return "Hide cannot target unidentified items. A use has to be known before a label can leave the ground.";
  }
  if (
    RESTRICTIVE_ACTIONS.has(rule.action) &&
    rule.collectionStatus &&
    rule.collectionStatus.every((status) => status === "undiscovered")
  ) {
    return "This rule only names undiscovered items. First-time discoveries are always kept, so it can never apply.";
  }
  return null;
}

export function inspectDocument(document: FilterDocument): RuleProblem[] {
  const problems: RuleProblem[] = [];
  const seen = new Set<string>();
  for (const rule of document.rules) {
    if (seen.has(rule.id)) {
      problems.push({ id: rule.id, name: rule.name, problem: "Duplicate rule id." });
    }
    seen.add(rule.id);
    const problem = ruleProblem(rule);
    if (problem) problems.push({ id: rule.id, name: rule.name, problem });
  }
  return problems;
}

function includes<T extends string>(list: readonly T[] | undefined, value: T): boolean {
  if (!list) return true;
  return list.includes(value);
}

export function ruleMatches(
  rule: FilterRule,
  item: GroundItem,
  context: FilterContext,
): boolean {
  if (rule.category) {
    const known = isKnownCategory(item.category);
    const category = rule.category;
    if (category.kind === "known" && !known) return false;
    if (category.kind === "unknown" && known) return false;
    if (category.kind === "in" && !category.values.includes(item.category)) return false;
    if (category.kind === "notIn" && category.values.includes(item.category)) return false;
  }
  if (!includes(rule.knownUse, item.knownUse)) return false;
  if (!includes(rule.collectionStatus, item.collectionStatus)) return false;
  if (!includes(rule.mastery, item.mastery)) return false;
  if (!includes(rule.ownership, item.ownership)) return false;
  if (rule.projectRelation) {
    const current = context.currentProject;
    const onProject = current != null && item.projectTags.includes(current);
    if (rule.projectRelation === "current" && !onProject) return false;
    if (rule.projectRelation === "not-current" && !(current != null && !onProject)) return false;
    if (rule.projectRelation === "untagged" && item.projectTags.length !== 0) return false;
  }
  if (rule.quantity && (rule.quantity.min != null || rule.quantity.max != null)) {
    if (!Number.isFinite(item.quantity)) return false;
    if (rule.quantity.min != null && item.quantity < rule.quantity.min) return false;
    if (rule.quantity.max != null && item.quantity > rule.quantity.max) return false;
  }
  return true;
}

export function summarizeRule(rule: FilterRule, context?: FilterContext): string {
  const bits: string[] = [];
  if (!rule.category) bits.push("any category");
  else if (rule.category.kind === "known") bits.push("a known category");
  else if (rule.category.kind === "unknown") bits.push("an unknown category");
  else if (rule.category.kind === "in") {
    bits.push(rule.category.values.map(categoryLabel).join(", ") || "no category");
  } else {
    bits.push(`not ${rule.category.values.map(categoryLabel).join(", ") || "anything"}`);
  }

  if (rule.knownUse) bits.push(`use is ${rule.knownUse.map(useLabel).join(" or ")}`);
  if (rule.projectRelation === "current") {
    bits.push(
      context?.currentProjectLabel ? `on ${context.currentProjectLabel}` : "on the current project",
    );
  }
  if (rule.projectRelation === "not-current") bits.push("not on the current project");
  if (rule.projectRelation === "untagged") bits.push("with no project tag");
  if (rule.collectionStatus) {
    bits.push(`collection ${rule.collectionStatus.map(collectionLabel).join(" or ")}`);
  }
  if (rule.mastery) bits.push(`mastery ${rule.mastery.map(masteryLabel).join(" or ")}`);
  if (rule.ownership) bits.push(`ownership ${rule.ownership.map(ownershipLabel).join(" or ")}`);
  if (rule.quantity?.min != null) bits.push(`at least ${rule.quantity.min}`);
  if (rule.quantity?.max != null) bits.push(`at most ${rule.quantity.max}`);

  const narrowed = bits.filter((bit) => bit !== "any category");
  const when = !rule.category && narrowed.length === 0 ? "every item" : bits.join(", ");
  return `${ACTION_CUES[rule.action].short} when ${when}`;
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    weapon: "weapon",
    ward: "ward",
    provision: "provision",
    material: "material",
    relic: "relic",
    tool: "tool",
    writing: "writing",
    currency: "currency",
    curiosity: "curiosity",
  };
  return labels[category] ?? category;
}

export function useLabel(use: KnownUse): string {
  if (use === "unidentified") return "unidentified";
  if (use === "known") return "known";
  return "no current use";
}

export function collectionLabel(status: CollectionStatus): string {
  if (status === "undiscovered") return "undiscovered";
  if (status === "seen") return "seen";
  if (status === "partial") return "partial";
  return "complete";
}

export function masteryLabel(mastery: MasteryCompatibility): string {
  if (mastery === "fits") return "fits";
  if (mastery === "conflicts") return "conflicts";
  return "unrelated";
}

export function ownershipLabel(ownership: Ownership): string {
  if (ownership === "quest-bound") return "quest-bound";
  return ownership;
}
