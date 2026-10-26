import type { CatalogEntry, ItemKind, Recipe, StatId } from "./types.ts";
import { STAT_BETTER, STAT_IDS, statIsBetter, statIsWorse } from "./types.ts";

export function isProtected(kind: ItemKind, quest?: boolean, critical?: boolean): boolean {
  return quest === true || critical === true || kind === "quest" || kind === "heirloom";
}

export type ViolationCode =
  | "negative-qty"
  | "nonpositive-mass"
  | "mass-creation"
  | "duplication"
  | "profitable-loop"
  | "quest-destroy"
  | "critical-consume"
  | "heirloom-destroy"
  | "dominating-mod"
  | "no-tradeoff"
  | "incompatible-mod"
  | "softlock"
  | "missing-catalog"
  | "substitution"
  | "duplicate-id";

export interface Violation {
  code: ViolationCode;
  recipeId?: string;
  detail: string;
}

export interface ConservationReport {
  ok: boolean;
  violations: Violation[];
  checks: string[];
  recipeCount: number;
  fixtureCount: number;
}

const CHECKS = [
  "Quantities and substitution multipliers are positive integers.",
  "Every fixture has positive mass. Appraisal is mass, so price cannot outrun matter.",
  "No operation creates mass, including each written substitute.",
  "A kept object is not also minted again. Heirlooms and quest pieces are not newly minted.",
  "Dismantle yields cannot be rebuilt into the same object with leftovers or extras.",
  "Quest pieces are never consumed.",
  "Critical bench tools are never consumed.",
  "Heirlooms are never dismantled or spent as material.",
  "Each modification is a tradeoff: an upside, a downside, and no choice dominates another.",
  "Choices on one operation share an axis, so they cannot be stacked into a free upgrade.",
  "Each critical tool has a recovery that spends no materials and no other tool.",
];

export function validateConservation(recipes: Recipe[], catalog: CatalogEntry[]): ConservationReport {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const violations: Violation[] = [];
  const seen = new Set<string>();
  const choiceIds = new Set<string>();

  const massOf = (id: string) => byId.get(id)?.mass ?? 0;

  for (const item of catalog) {
    if (!Number.isInteger(item.mass) || item.mass <= 0) {
      violations.push({ code: "nonpositive-mass", detail: `${item.id} has mass ${item.mass}.` });
    }
    if (!item.fixture) {
      violations.push({ code: "missing-catalog", detail: `${item.id} is not marked as a reference fixture.` });
    }
  }

  for (const recipe of recipes) {
    if (seen.has(recipe.id)) {
      violations.push({ code: "duplicate-id", recipeId: recipe.id, detail: "Duplicate operation id." });
    }
    seen.add(recipe.id);

    const primary = recipe.inputs.find((input) => input.role === "primary");
    const specs = [
      ...recipe.inputs,
      ...(recipe.choices?.flatMap((choice) => choice.extraInputs ?? []) ?? []),
    ];

    for (const input of specs) {
      if (input.catalogId === "*") continue;
      if (!Number.isInteger(input.qty) || input.qty < 1) {
        violations.push({
          code: "negative-qty",
          recipeId: recipe.id,
          detail: `Input ${input.catalogId} has qty ${input.qty}.`,
        });
      }
      if (!byId.has(input.catalogId)) {
        violations.push({
          code: "missing-catalog",
          recipeId: recipe.id,
          detail: `Missing fixture ${input.catalogId}.`,
        });
      }
    }

    for (const output of recipe.outputs) {
      if (!Number.isInteger(output.qty) || output.qty < 1) {
        violations.push({
          code: "negative-qty",
          recipeId: recipe.id,
          detail: `Output ${output.catalogId} has qty ${output.qty}.`,
        });
      }
      const cat = byId.get(output.catalogId);
      if (!cat) {
        violations.push({
          code: "missing-catalog",
          recipeId: recipe.id,
          detail: `Output fixture missing: ${output.catalogId}.`,
        });
        continue;
      }
      if (output.identity === "new" && (cat.kind === "heirloom" || cat.kind === "quest" || cat.quest)) {
        violations.push({
          code: "duplication",
          recipeId: recipe.id,
          detail: `Mints a new ${cat.kind} (${cat.id}). Story pieces are not copied.`,
        });
      }
    }

    if (
      primary &&
      recipe.outputs.some((output) => output.identity === "retain-primary") &&
      recipe.outputs.some((output) => output.identity === "new" && output.catalogId === primary.catalogId)
    ) {
      violations.push({
        code: "duplication",
        recipeId: recipe.id,
        detail: "Keeps the piece and also creates another of the same fixture.",
      });
    }

    const consumedMass = (extraIds: { catalogId: string; qty: number; consume: string }[]) => {
      let total = 0;
      for (const input of extraIds) {
        if (input.consume !== "all" || input.catalogId === "*") continue;
        total += massOf(input.catalogId) * input.qty;
      }
      return total;
    };
    const producedMass = recipe.outputs
      .filter((output) => output.identity === "new")
      .reduce((sum, output) => sum + massOf(output.catalogId) * output.qty, 0);

    const baseMass = consumedMass(recipe.inputs);
    if (producedMass > baseMass) {
      violations.push({
        code: "mass-creation",
        recipeId: recipe.id,
        detail: `Produces mass ${producedMass} from consumed mass ${baseMass}.`,
      });
    }
    for (const choice of recipe.choices ?? []) {
      const withChoice = consumedMass([...recipe.inputs, ...(choice.extraInputs ?? [])]);
      if (producedMass > withChoice) {
        violations.push({
          code: "mass-creation",
          recipeId: recipe.id,
          detail: `Choice ${choice.id} produces mass ${producedMass} from ${withChoice}.`,
        });
      }
    }

    for (const sub of recipe.substitutions) {
      if (!Number.isInteger(sub.qtyMultiplier) || sub.qtyMultiplier < 1) {
        violations.push({
          code: "substitution",
          recipeId: recipe.id,
          detail: `Substitution ${sub.forCatalogId} → ${sub.withCatalogId} has multiplier ${sub.qtyMultiplier}.`,
        });
      }
      const from = byId.get(sub.forCatalogId);
      const to = byId.get(sub.withCatalogId);
      if (!from || !to) {
        violations.push({
          code: "missing-catalog",
          recipeId: recipe.id,
          detail: `Substitution references a missing fixture (${sub.forCatalogId} → ${sub.withCatalogId}).`,
        });
        continue;
      }
      if (to.mass * sub.qtyMultiplier < from.mass) {
        violations.push({
          code: "mass-creation",
          recipeId: recipe.id,
          detail: `Substitute ${to.id} × ${sub.qtyMultiplier} is lighter than ${from.id}.`,
        });
      }
      if (!recipe.inputs.some((input) => input.catalogId === sub.forCatalogId && input.role === "material") &&
        !(recipe.choices ?? []).some((choice) => choice.extraInputs?.some((input) => input.catalogId === sub.forCatalogId))
      ) {
        violations.push({
          code: "substitution",
          recipeId: recipe.id,
          detail: `Substitution for ${sub.forCatalogId} is not an input.`,
        });
      }
    }

    for (const input of recipe.inputs) {
      if (input.consume !== "all" || input.catalogId === "*") continue;
      const cat = byId.get(input.catalogId);
      if (!cat) continue;
      if (cat.quest || cat.kind === "quest") {
        violations.push({
          code: "quest-destroy",
          recipeId: recipe.id,
          detail: `Consumes quest fixture ${cat.id}.`,
        });
      }
      if (cat.critical || cat.kind === "tool" && cat.critical) {
        violations.push({
          code: "critical-consume",
          recipeId: recipe.id,
          detail: `Consumes critical tool ${cat.id}.`,
        });
      }
      if (cat.kind === "heirloom") {
        violations.push({
          code: "heirloom-destroy",
          recipeId: recipe.id,
          detail: `Spends heirloom ${cat.id}.`,
        });
      }
    }
    if (recipe.kind === "dismantle" && primary) {
      const cat = byId.get(primary.catalogId);
      if (cat?.kind === "heirloom" || cat?.quest || cat?.critical) {
        violations.push({
          code: cat?.quest || cat?.kind === "quest" ? "quest-destroy" : cat?.kind === "heirloom" ? "heirloom-destroy" : "critical-consume",
          recipeId: recipe.id,
          detail: `Dismantles protected fixture ${primary.catalogId}.`,
        });
      }
    }

    if (recipe.kind === "modify") {
      const choices = recipe.choices ?? [];
      if (choices.length < 2) {
        violations.push({
          code: "no-tradeoff",
          recipeId: recipe.id,
          detail: "A modification needs at least two directions.",
        });
      }
      const axes = new Set(choices.map((choice) => choice.axis));
      if (axes.size !== 1) {
        violations.push({
          code: "incompatible-mod",
          recipeId: recipe.id,
          detail: "Directions do not share one axis, so they could stack instead of being a choice.",
        });
      }
      for (const choice of choices) {
        if (choiceIds.has(choice.id)) {
          violations.push({
            code: "duplicate-id",
            recipeId: recipe.id,
            detail: `Duplicate choice id ${choice.id}.`,
          });
        }
        choiceIds.add(choice.id);
        const entries = Object.entries(choice.stats) as [StatId, number][];
        if (entries.length === 0 || entries.every(([, value]) => value === 0)) {
          violations.push({ code: "no-tradeoff", recipeId: recipe.id, detail: `${choice.id} changes nothing.` });
        }
        const upside = entries.some(([stat, value]) => statIsBetter(stat, value));
        const downside = entries.some(([stat, value]) => statIsWorse(stat, value));
        if (!upside || !downside) {
          violations.push({
            code: "no-tradeoff",
            recipeId: recipe.id,
            detail: `${choice.name} is not a tradeoff (upside ${upside}, downside ${downside}).`,
          });
        }
        for (const [stat, value] of entries) {
          if (!STAT_IDS.includes(stat) || !Number.isInteger(value) || value === 0) {
            violations.push({
              code: "incompatible-mod",
              recipeId: recipe.id,
              detail: `${choice.id} has a bad stat ${stat} ${value}.`,
            });
          }
        }
      }
      for (let i = 0; i < choices.length; i++) {
        for (let j = i + 1; j < choices.length; j++) {
          if (dominates(choices[i].stats, choices[j].stats) || dominates(choices[j].stats, choices[i].stats)) {
            violations.push({
              code: "dominating-mod",
              recipeId: recipe.id,
              detail: `${choices[i].name} dominates ${choices[j].name}, or the reverse. One is strictly better.`,
            });
          }
        }
      }
    }
  }

  for (const tool of catalog.filter((item) => item.critical)) {
    const recovery = recipes.find((recipe) => {
      if (recipe.kind !== "maintain" && recipe.kind !== "restore") return false;
      const primary = recipe.inputs.find((input) => input.role === "primary" && input.catalogId === tool.id);
      if (!primary || primary.consume === "all") return false;
      if (recipe.inputs.some((input) => input.role === "tool")) return false;
      if (recipe.inputs.some((input) => input.consume === "all")) return false;
      const delta = recipe.outputs.find((output) => output.identity === "retain-primary")?.conditionDelta ?? 0;
      return delta > 0;
    });
    if (!recovery) {
      violations.push({
        code: "softlock",
        detail: `${tool.name} has no material-free recovery. A bare bench could not bring it back.`,
      });
    }
  }

  findLoops(recipes, massOf, violations);

  return {
    ok: violations.length === 0,
    violations,
    checks: CHECKS,
    recipeCount: recipes.length,
    fixtureCount: catalog.length,
  };
}

function dominates(a: Partial<Record<StatId, number>>, b: Partial<Record<StatId, number>>): boolean {
  let strict = false;
  for (const stat of STAT_IDS) {
    const av = a[stat] ?? 0;
    const bv = b[stat] ?? 0;
    if (av === bv) continue;
    const aBetter = STAT_BETTER[stat] === "high" ? av > bv : av < bv;
    if (!aBetter) return false;
    strict = true;
  }
  return strict;
}

function findLoops(
  recipes: Recipe[],
  massOf: (id: string) => number,
  violations: Violation[],
): void {
  const crafts = recipes.filter(
    (recipe) => recipe.kind === "combine" && recipe.outputs.some((output) => output.identity === "new"),
  );
  const dismantles = recipes.filter((recipe) => recipe.kind === "dismantle");

  const applyCraft = (bag: Map<string, number>, recipe: Recipe): Map<string, number> | null => {
    const next = new Map(bag);
    for (const input of recipe.inputs) {
      if (input.consume !== "all") continue;
      const have = next.get(input.catalogId) ?? 0;
      if (have < input.qty) return null;
      const left = have - input.qty;
      if (left === 0) next.delete(input.catalogId);
      else next.set(input.catalogId, left);
    }
    for (const output of recipe.outputs) {
      if (output.identity !== "new") continue;
      next.set(output.catalogId, (next.get(output.catalogId) ?? 0) + output.qty);
    }
    return next;
  };

  const bagMass = (bag: Map<string, number>) => {
    let total = 0;
    for (const [id, qty] of bag) total += massOf(id) * qty;
    return total;
  };

  for (const dismantle of dismantles) {
    const source = dismantle.inputs.find((input) => input.role === "primary");
    if (!source) continue;
    const sourceMass = massOf(source.catalogId);
    const bag = new Map<string, number>();
    for (const output of dismantle.outputs) {
      if (output.identity !== "new") continue;
      bag.set(output.catalogId, (bag.get(output.catalogId) ?? 0) + output.qty);
    }
    const profitable = (next: Map<string, number>) => {
      const count = next.get(source.catalogId) ?? 0;
      if (count < 1) return false;
      const leftover = bagMass(next) - count * sourceMass;
      return count > 1 || leftover > 0;
    };
    const step = (current: Map<string, number>) => {
      const out: Map<string, number>[] = [];
      for (const craft of crafts) {
        const next = applyCraft(current, craft);
        if (next) out.push(next);
      }
      return out;
    };
    for (const once of step(bag)) {
      if (profitable(once)) {
        violations.push({
          code: "profitable-loop",
          recipeId: dismantle.id,
          detail: `Breaking ${source.catalogId} funds a rebuild with leftovers or extras.`,
        });
        break;
      }
      let flagged = false;
      for (const twice of step(once)) {
        if (profitable(twice)) {
          violations.push({
            code: "profitable-loop",
            recipeId: dismantle.id,
            detail: `Breaking ${source.catalogId} funds a two-step rebuild with leftovers or extras.`,
          });
          flagged = true;
          break;
        }
      }
      if (flagged) break;
    }
  }
}

