import { PRECEDENCE } from "./types.ts";
import type {
  BlockNote,
  CategoryRule,
  Conflict,
  EraEffect,
  Evaluation,
  InstanceDirective,
  PolicyInput,
  Project,
  ProjectAllocation,
  ProjectLineResult,
  Reason,
  RecipeLine,
  Reservation,
  RuleGap,
  Selector,
  Stack,
  StackDisposition,
} from "./types.ts";

class PolicyError extends Error {}

type Working = {
  stack: Stack;
  protected: number;
  reserved: number;
  exempt: boolean;
  reasons: Reason[];
  reservedBy: Reservation[];
};

export function evaluatePolicy(input: PolicyInput): Evaluation {
  validate(input);
  const eraId = input.eraId;
  const conflicts: Conflict[] = [];
  const working = input.stacks.map<Working>((stack) => ({
    stack,
    protected: 0,
    reserved: 0,
    exempt: false,
    reasons: [],
    reservedBy: [],
  }));

  applyMetadata(working);
  applyInstanceDirectives(working, input.instanceDirectives, conflicts);

  const rules = input.categoryRules.filter((rule) => rule.enabled);
  noteSelectorConflicts(rules, conflicts);
  const eraEffects = eraEffectsFor(rules, working, eraId);
  applyCategoryRules(rules, working, eraId);
  const ruleGaps = gapsFor(rules, working, eraId);

  const projects = applyProjects(input.projects, working, conflicts);

  if (input.requestedAutoDispose) {
    conflicts.push({
      kind: "disposal",
      text: "Automatic disposal was requested.",
      resolution: "Refused. Surplus stays in the review list. This module does not destroy stock.",
    });
  }

  const dispositions = working.map((row) => toDisposition(row, rules, eraId, input.offerSurplusForSale));
  assertExplained(dispositions);

  const totals = dispositions.reduce(
    (sum, row) => ({
      quantity: sum.quantity + row.quantity,
      protected: sum.protected + row.protected,
      reserved: sum.reserved + row.reserved,
      available: sum.available + row.available,
    }),
    { quantity: 0, protected: 0, reserved: 0, available: 0 },
  );

  return {
    eraId,
    dispositions,
    projects,
    conflicts,
    eraEffects,
    ruleGaps,
    surplusReview: {
      autoDispose: false,
      lines: dispositions
        .filter((row) => row.surplus > 0)
        .map((row) => ({
          stackId: row.stackId,
          itemId: row.itemId,
          name: row.name,
          quantity: row.surplus,
          suggested: input.offerSurplusForSale ? "sale-offer" : "review",
        })),
    },
    totals,
    precedence: PRECEDENCE,
  };
}

function validate(input: PolicyInput): void {
  const stacks = new Set<string>();
  for (const stack of input.stacks) {
    if (stacks.has(stack.id)) throw new PolicyError(`Duplicate stack id ${stack.id}.`);
    stacks.add(stack.id);
    if (!Number.isInteger(stack.quantity) || stack.quantity < 0) {
      throw new PolicyError(`Stack ${stack.id} quantity must be a non-negative integer.`);
    }
  }
  const projects = new Set<string>();
  for (const project of input.projects) {
    if (projects.has(project.id)) throw new PolicyError(`Duplicate project id ${project.id}.`);
    projects.add(project.id);
    for (const line of project.lines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 0) {
        throw new PolicyError(`Project ${project.id} line ${line.itemId} quantity must be a non-negative integer.`);
      }
    }
  }
  const rules = new Set<string>();
  for (const rule of input.categoryRules) {
    if (rules.has(rule.id)) throw new PolicyError(`Duplicate rule id ${rule.id}.`);
    rules.add(rule.id);
    if (typeof rule.keep === "number" && (!Number.isInteger(rule.keep) || rule.keep < 0)) {
      throw new PolicyError(`Rule ${rule.id} keep must be a non-negative integer or "all".`);
    }
  }
  const directives = new Set<string>();
  for (const directive of input.instanceDirectives) {
    if (directives.has(directive.id)) throw new PolicyError(`Duplicate directive id ${directive.id}.`);
    directives.add(directive.id);
  }
}

function freeOf(row: Working): number {
  return row.stack.quantity - row.protected - row.reserved;
}

function claim(row: Working, qty: number, field: "protected" | "reserved"): number {
  const take = Math.min(Math.max(0, qty), freeOf(row));
  row[field] += take;
  return take;
}

function applyMetadata(rows: Working[]): void {
  for (const row of rows) {
    const meta = row.stack.protectedMeta;
    if (!meta?.locked) continue;
    const take = claim(row, row.stack.quantity, "protected");
    row.reasons.push({
      layer: "metadata",
      code: "locked",
      qty: take,
      text: `Locked by explicit metadata from ${meta.author}: “${meta.reason}”. This is not an inferred story.`,
    });
  }
}

function applyInstanceDirectives(rows: Working[], directives: InstanceDirective[], conflicts: Conflict[]): void {
  const known = new Set(rows.map((row) => row.stack.id));
  const byStack = new Map<string, InstanceDirective[]>();
  for (const directive of directives) {
    if (!directive.enabled) continue;
    if (!known.has(directive.stackId)) {
      conflicts.push({
        kind: "rules",
        text: `Instance directive ${directive.id} names stack ${directive.stackId}, which is not in this snapshot.`,
        ruleIds: [directive.id],
        resolution: "The directive was not applied to any other stack. Split children are not implied.",
      });
      continue;
    }
    const list = byStack.get(directive.stackId) ?? [];
    list.push(directive);
    byStack.set(directive.stackId, list);
  }
  for (const row of rows) {
    const list = byStack.get(row.stack.id) ?? [];
    const protects = list.filter((directive) => directive.mode === "protect");
    const exempts = list.filter((directive) => directive.mode === "exempt");
    const locked = Boolean(row.stack.protectedMeta?.locked);

    if (protects.length > 0 && exempts.length > 0) {
      conflicts.push({
        kind: "rules",
        text: `Stack ${row.stack.name} has both a protect and an exempt directive.`,
        ruleIds: [...protects, ...exempts].map((directive) => directive.id),
        resolution: "Protect wins. The stack is not exempt from category floors, and the clash is on the record.",
      });
    }

    if (exempts.length > 0 && locked) {
      conflicts.push({
        kind: "metadata-vs-exempt",
        text: `${row.stack.name} is exempted by directive, and it also carries lock metadata.`,
        ruleIds: exempts.map((directive) => directive.id),
        resolution: "Lock metadata wins. The exempt directive does not erase it, and the stack stays protected.",
      });
    }

    const treatExempt = exempts.length > 0 && protects.length === 0 && !locked;
    if (treatExempt) {
      row.exempt = true;
      row.reasons.push({
        layer: "instance",
        code: "exempt",
        qty: 0,
        ruleId: exempts[0]?.id,
        text: `Instance exemption on this stack only: ${exempts[0]?.reason ?? "exempt"}. Category floors skip it. It is not deleted.`,
      });
    }

    if (protects.length === 0) continue;
    const wantsAll = protects.some((directive) => directive.quantity === undefined);
    const cap = wantsAll
      ? row.stack.quantity
      : Math.max(...protects.map((directive) => directive.quantity ?? 0));
    const differing = new Set(protects.map((directive) => directive.quantity ?? "all"));
    if (differing.size > 1) {
      conflicts.push({
        kind: "rules",
        text: `Stack ${row.stack.name} has instance protects that name different quantities.`,
        ruleIds: protects.map((directive) => directive.id),
        resolution: "The larger protect is applied. The smaller one is not a release.",
      });
    }
    const take = claim(row, cap, "protected");
    if (take > 0) {
      const reason = protects.map((directive) => directive.reason).join(" ");
      row.reasons.push({
        layer: "instance",
        code: "protect",
        qty: take,
        ruleId: protects[0]?.id,
        text: `Instance protect on stack ${row.stack.id} only: ${reason}`,
      });
    }
  }
}

function selectorKey(selector: Selector, grouping: CategoryRule["grouping"]): string {
  const normalized: Selector = { ...selector, era: selector.era ?? "any" };
  const entries = Object.entries(normalized)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `${grouping}:${JSON.stringify(entries)}`;
}

function noteSelectorConflicts(rules: CategoryRule[], conflicts: Conflict[]): void {
  const groups = new Map<string, CategoryRule[]>();
  for (const rule of rules) {
    const key = selectorKey(rule.selector, rule.grouping);
    const list = groups.get(key) ?? [];
    list.push(rule);
    groups.set(key, list);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const keeps = new Set(group.map((rule) => rule.keep));
    if (keeps.size < 2) continue;
    conflicts.push({
      kind: "rules",
      text: `${group.map((rule) => `${rule.name} (keep ${rule.keep})`).join(" contradicts ")}.`,
      ruleIds: group.map((rule) => rule.id),
      resolution:
        "Both rules stay on the books. The stricter floor is what the stock satisfies, and a lower keep is not a release.",
    });
  }
}

function eraMatches(scope: Selector["era"], stackEra: string, currentEra: string): boolean {
  if (!scope || scope === "any") return true;
  if (scope === "current") return stackEra === currentEra;
  return stackEra !== currentEra;
}

function matches(stack: Stack, selector: Selector, eraId: string, ignoreEra = false): boolean {
  if (selector.category && stack.category !== selector.category) return false;
  if (selector.tag && !stack.tags.includes(selector.tag)) return false;
  if (selector.itemId && stack.itemId !== selector.itemId) return false;
  if (selector.discovered === true && !stack.discovered) return false;
  if (selector.unique === true && !stack.unique) return false;
  if (selector.namedGift === true && !stack.gift?.name) return false;
  if (!ignoreEra && !eraMatches(selector.era, stack.eraId, eraId)) return false;
  return true;
}

function specimenOrder(a: Working, b: Working): number {
  return specimenScore(a) - specimenScore(b) || a.stack.acquiredAt - b.stack.acquiredAt || a.stack.id.localeCompare(b.stack.id);
}

function specimenScore(row: Working): number {
  return (row.stack.unique ? 0 : 4) + (row.stack.discovered ? 0 : 2) + (row.stack.gift?.name ? 0 : 1);
}

function bulkOrder(a: Working, b: Working): number {
  return specimenScore(b) - specimenScore(a) || b.stack.acquiredAt - a.stack.acquiredAt || b.stack.id.localeCompare(a.stack.id);
}

function eligibleRows(rule: CategoryRule, rows: Working[], eraId: string): Working[] {
  return rows.filter((row) => !row.exempt && matches(row.stack, rule.selector, eraId));
}

function applyCategoryRules(rules: CategoryRule[], rows: Working[], eraId: string): void {
  const ordered = [...rules].sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
  for (const rule of ordered) {
    const pools = new Map<string, Working[]>();
    for (const row of eligibleRows(rule, rows, eraId)) {
      const key = rule.grouping === "each-item" ? row.stack.itemId : "*";
      const list = pools.get(key) ?? [];
      list.push(row);
      pools.set(key, list);
    }
    for (const pool of pools.values()) {
      pool.sort(specimenOrder);
      const have = pool.reduce((sum, row) => sum + row.stack.quantity, 0);
      const already = pool.reduce((sum, row) => sum + row.protected, 0);
      const wanted = rule.keep === "all" ? have : rule.keep;
      let need = Math.max(0, wanted - already);
      for (const row of pool) {
        if (need <= 0) break;
        const take = claim(row, need, "protected");
        if (take <= 0) continue;
        need -= take;
        row.reasons.push({
          layer: "category",
          code: "floor",
          qty: take,
          ruleId: rule.id,
          text: `${rule.name} protects ${take} on this stack toward a floor of ${rule.keep === "all" ? "all matching units" : rule.keep}.`,
        });
      }
    }
  }
}

function gapsFor(rules: CategoryRule[], rows: Working[], eraId: string): RuleGap[] {
  const gaps: RuleGap[] = [];
  for (const rule of rules) {
    const pool = eligibleRows(rule, rows, eraId);
    if (rule.grouping === "pool") {
      const gap = describeGap(rule, pool, rows, eraId);
      if (gap) gaps.push(gap);
    } else {
      const ids = new Set(pool.map((row) => row.stack.itemId));
      for (const itemId of ids) {
        const gap = describeGap(
          rule,
          pool.filter((row) => row.stack.itemId === itemId),
          rows,
          eraId,
          itemId,
        );
        if (gap) gaps.push(gap);
      }
      if (pool.length === 0) {
        const gap = describeGap(rule, [], rows, eraId);
        if (gap) gaps.push(gap);
      }
    }
  }
  return gaps;
}

function describeGap(
  rule: CategoryRule,
  pool: Working[],
  rows: Working[],
  eraId: string,
  itemId?: string,
): RuleGap | null {
  const eligible = pool.reduce((sum, row) => sum + row.stack.quantity, 0);
  const protectedQty = pool.reduce((sum, row) => sum + row.protected, 0);
  const wanted = rule.keep === "all" ? eligible : rule.keep;
  if (protectedQty >= wanted) return null;
  const eraMiss = rows
    .filter((row) => !row.exempt && matches(row.stack, rule.selector, eraId, true) && !matches(row.stack, rule.selector, eraId))
    .filter((row) => !itemId || row.stack.itemId === itemId)
    .reduce((sum, row) => sum + row.stack.quantity, 0);
  const exempted = rows
    .filter((row) => row.exempt && matches(row.stack, rule.selector, eraId, true))
    .filter((row) => !itemId || row.stack.itemId === itemId)
    .reduce((sum, row) => sum + row.stack.quantity, 0);
  const where = itemId ? ` for ${itemId}` : "";
  const parts = [`${rule.name}${where} wants ${wanted}.`, `${eligible} eligible.`, `${protectedQty} protected.`];
  if (exempted > 0) parts.push(`${exempted} sit on an instance exemption and are not part of the floor.`);
  if (eraMiss > 0) parts.push(`${eraMiss} match the other conditions but not the era scope, so they were left alone.`);
  parts.push("The floor was not secretly lowered, and nothing was deleted.");
  return {
    ruleId: rule.id,
    name: rule.name,
    wanted,
    eligible,
    protected: protectedQty,
    text: parts.join(" "),
  };
}

function eraEffectsFor(rules: CategoryRule[], rows: Working[], eraId: string): EraEffect[] {
  const effects: EraEffect[] = [];
  for (const rule of rules) {
    if (!rule.selector.era || rule.selector.era === "any") continue;
    const released = rows
      .filter((row) => matches(row.stack, rule.selector, eraId, true) && !matches(row.stack, rule.selector, eraId))
      .reduce((sum, row) => sum + row.stack.quantity, 0);
    if (released <= 0) continue;
    const scope = rule.selector.era === "current" ? "the current era" : "earlier eras";
    effects.push({
      ruleId: rule.id,
      name: rule.name,
      releasedQuantity: released,
      text: `${rule.name} is scoped to ${scope}. ${released} units match its other conditions but not that era, so this rule does not hold them. They remain in stock.`,
    });
  }
  return effects;
}

function applyProjects(projects: Project[], rows: Working[], conflicts: Conflict[]): ProjectAllocation[] {
  const claiming = projects
    .filter((project) => project.status === "active")
    .slice()
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  const order = new Map(claiming.map((project, index) => [project.id, index + 1]));
  const tied = new Map<string, string[]>();
  for (let i = 0; i < claiming.length; i += 1) {
    const project = claiming[i];
    if (!project) continue;
    const peers = claiming.filter((other) => other.priority === project.priority).map((other) => other.id);
    if (peers.length > 1) tied.set(project.id, peers);
  }
  if (tied.size > 0) {
    const seen = new Set<string>();
    for (const peers of tied.values()) {
      const key = peers.join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      conflicts.push({
        kind: "projects",
        text: `Projects ${peers.join(" and ")} share a priority.`,
        projectIds: peers,
        resolution: "The lower project id claims first. The order is recorded, not hidden.",
      });
    }
  }

  const ran: Project[] = [];
  const allocations: ProjectAllocation[] = [];
  for (const project of projects) {
    const recipeNote = recipeNoteFor(project);
    if (project.status !== "active") {
      allocations.push({
        projectId: project.id,
        name: project.name,
        status: project.status,
        priority: project.priority,
        claimOrder: null,
        recipeRevision: project.recipeRevision,
        recipeNote,
        lines: project.lines.map((line) => ({
          itemId: line.itemId,
          needed: line.quantity,
          fromPrimary: 0,
          fromSubstitute: [],
          shortfall: 0,
          notes: [
            project.status === "cancelled"
              ? "Cancelled. The claim is released and is not holding stock."
              : "Paused. The claim is released until the project is active again.",
          ],
          blockedBy: [],
        })),
      });
      continue;
    }

    const lines: ProjectLineResult[] = [];
    for (const line of project.lines) {
      lines.push(allocateLine(project, line, rows, ran));
    }
    ran.push(project);
    allocations.push({
      projectId: project.id,
      name: project.name,
      status: project.status,
      priority: project.priority,
      claimOrder: order.get(project.id) ?? null,
      recipeRevision: project.recipeRevision,
      recipeNote,
      lines,
    });
  }
  return allocations;
}

function recipeNoteFor(project: Project): string | undefined {
  if (project.previousRevision === undefined && !project.previousLines) return undefined;
  const revisionChanged = project.previousRevision !== undefined && project.previousRevision !== project.recipeRevision;
  const linesChanged =
    project.previousLines !== undefined &&
    JSON.stringify(project.previousLines) !== JSON.stringify(project.lines);
  if (!revisionChanged && !linesChanged) return undefined;
  const from = project.previousRevision ?? "an earlier snapshot";
  return `Recipe moved from revision ${from} to ${project.recipeRevision}. Only the current lines reserve stock. Prior ingredients are not held.`;
}

function allocateLine(project: Project, line: RecipeLine, rows: Working[], earlier: Project[]): ProjectLineResult {
  const notes: string[] = [];
  const fromSubstitute: ProjectLineResult["fromSubstitute"] = [];
  let fromPrimary = 0;
  if (line.quantity === 0) {
    return {
      itemId: line.itemId,
      needed: 0,
      fromPrimary: 0,
      fromSubstitute: [],
      shortfall: 0,
      notes: ["Line quantity is zero. Nothing was reserved."],
      blockedBy: [],
    };
  }

  fromPrimary = takeItem(rows, line.itemId, line.quantity, project, "primary", line.itemId);
  let shortPrimary = line.quantity - fromPrimary;
  if (shortPrimary === 0) {
    notes.push("Substitutes were not used. Primary stock covered the line.");
  } else if (line.substitutes.length === 0) {
    notes.push("No substitute is named on this line, so other items were not used to fill it.");
  } else {
    for (const substitute of line.substitutes) {
      if (shortPrimary <= 0) break;
      if (!Number.isInteger(substitute.ratio) || substitute.ratio < 1) {
        notes.push(`Substitute ${substitute.itemId} was ignored. Ratio must be a positive integer, and it is not guessed.`);
        continue;
      }
      const free = rows.filter((row) => row.stack.itemId === substitute.itemId).reduce((sum, row) => sum + freeOf(row), 0);
      const coverable = Math.floor(free / substitute.ratio);
      const cover = Math.min(shortPrimary, coverable);
      const units = cover * substitute.ratio;
      const taken = takeItem(rows, substitute.itemId, units, project, "substitute", line.itemId);
      const covered = Math.floor(taken / substitute.ratio);
      if (covered > 0) {
        fromSubstitute.push({
          itemId: substitute.itemId,
          quantity: taken,
          coversPrimary: covered,
          ratio: substitute.ratio,
        });
        notes.push(
          `${substitute.itemId} was used as a named substitute for ${line.itemId} at ${substitute.ratio}:1. Substitutes are never guessed.`,
        );
      }
      shortPrimary -= covered;
    }
  }

  const shortfall = line.quantity - fromPrimary - fromSubstitute.reduce((sum, entry) => sum + entry.coversPrimary, 0);
  const blockedBy = shortfall > 0 ? explainShortfall(line, shortfall, rows, earlier, project) : [];
  if (shortfall === 0 && fromPrimary === line.quantity) {
    /* already noted */
  } else if (shortfall === 0) {
    notes.push("The line is covered with the named primary and substitutes.");
  }
  return { itemId: line.itemId, needed: line.quantity, fromPrimary, fromSubstitute, shortfall, notes, blockedBy };
}

function takeItem(
  rows: Working[],
  itemId: string,
  qty: number,
  project: Project,
  via: "primary" | "substitute",
  forItemId: string,
): number {
  let need = qty;
  const targets = rows.filter((row) => row.stack.itemId === itemId).slice().sort(bulkOrder);
  for (const row of targets) {
    if (need <= 0) break;
    const take = claim(row, need, "reserved");
    if (take <= 0) continue;
    need -= take;
    row.reservedBy.push({
      projectId: project.id,
      projectName: project.name,
      quantity: take,
      via,
      forItemId,
    });
    const how = via === "substitute" ? ` as a named substitute for ${forItemId}` : "";
    row.reasons.push({
      layer: "project",
      code: "reserved",
      qty: take,
      projectId: project.id,
      text: `Reserved by ${project.name} (priority ${project.priority})${how}.`,
    });
  }
  return qty - need;
}

function explainShortfall(line: RecipeLine, shortfall: number, rows: Working[], earlier: Project[], project: Project): BlockNote[] {
  const notes: BlockNote[] = [];
  let left = shortfall;
  const primary = rows.filter((row) => row.stack.itemId === line.itemId);
  for (const earlierProject of earlier) {
    const held = primary.reduce(
      (sum, row) =>
        sum + row.reservedBy.filter((entry) => entry.projectId === earlierProject.id).reduce((inner, entry) => inner + entry.quantity, 0),
      0,
    );
    const use = Math.min(left, held);
    if (use > 0) {
      notes.push({
        layer: "project",
        quantity: use,
        projectId: earlierProject.id,
        text: `${use} ${line.itemId} already reserved by ${earlierProject.name} (priority ${earlierProject.priority}), which claims before ${project.name}.`,
      });
      left -= use;
    }
  }
  const protectedQty = primary.reduce((sum, row) => sum + row.protected, 0);
  const useProtected = Math.min(left, protectedQty);
  if (useProtected > 0) {
    const why = protectionSummary(primary);
    notes.push({
      layer: "category",
      quantity: useProtected,
      text: `${useProtected} ${line.itemId} are protected and were not taken. ${why}`,
    });
    left -= useProtected;
  }
  if (left > 0 && line.substitutes.length > 0) {
    for (const substitute of line.substitutes) {
      const subRows = rows.filter((row) => row.stack.itemId === substitute.itemId);
      const subProtected = subRows.reduce((sum, row) => sum + row.protected, 0);
      if (subProtected > 0) {
        notes.push({
          layer: "category",
          quantity: subProtected,
          text: `Named substitute ${substitute.itemId} still has ${subProtected} protected, which were not taken.`,
        });
      }
    }
  }
  if (left > 0) {
    notes.push({
      layer: "stock",
      quantity: left,
      text: `${left} ${line.itemId} are not in stock. No unlisted item was substituted.`,
    });
  }
  return notes;
}

function protectionSummary(rows: Working[]): string {
  const bits: string[] = [];
  for (const row of rows) {
    if (row.protected <= 0) continue;
    const lead = row.reasons.find((reason) => reason.qty > 0 && (reason.layer === "metadata" || reason.layer === "instance" || reason.layer === "category"));
    bits.push(`${row.protected} on ${row.stack.id}${lead ? ` (${lead.text})` : ""}`);
  }
  return bits.join(" ");
}

function toDisposition(row: Working, rules: CategoryRule[], eraId: string, offer: boolean): StackDisposition {
  const available = freeOf(row);
  if (available > 0) {
    row.reasons.push({
      layer: "surplus",
      code: "available",
      qty: available,
      text: offer
        ? `${available} available. Included in the surplus review as a sale offer. Not discarded.`
        : `${available} available. Above every lock, floor, and reservation. Listed for review, not discarded.`,
    });
  }
  const matchedRules = rules
    .filter((rule) => matches(row.stack, rule.selector, eraId))
    .map((rule) => ({ id: rule.id, name: rule.name }));
  return {
    stackId: row.stack.id,
    itemId: row.stack.itemId,
    name: row.stack.name,
    category: row.stack.category,
    tags: row.stack.tags,
    eraId: row.stack.eraId,
    unique: Boolean(row.stack.unique),
    discovered: Boolean(row.stack.discovered),
    giftName: row.stack.gift?.name,
    locked: Boolean(row.stack.protectedMeta?.locked),
    lineageId: row.stack.lineageId,
    quantity: row.stack.quantity,
    protected: row.protected,
    reserved: row.reserved,
    available,
    surplus: available,
    saleOffer: offer ? available : 0,
    reservedBy: row.reservedBy,
    reasons: row.reasons,
    matchedRules,
    exempt: row.exempt,
  };
}

function assertExplained(rows: StackDisposition[]): void {
  for (const row of rows) {
    if (row.protected + row.reserved + row.available !== row.quantity) {
      throw new PolicyError(`Conservation failed on ${row.stackId}.`);
    }
    const protectedQty = row.reasons.filter((reason) => reason.layer !== "surplus" && reason.layer !== "project" && reason.layer !== "era").reduce((sum, reason) => sum + reason.qty, 0);
    const reservedQty = row.reasons.filter((reason) => reason.layer === "project").reduce((sum, reason) => sum + reason.qty, 0);
    const surplusQty = row.reasons.filter((reason) => reason.layer === "surplus").reduce((sum, reason) => sum + reason.qty, 0);
    if (protectedQty !== row.protected || reservedQty !== row.reserved || surplusQty !== row.available) {
      throw new PolicyError(`Reasons do not add up on ${row.stackId}.`);
    }
  }
}

export { PolicyError };
