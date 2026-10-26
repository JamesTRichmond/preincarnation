import { catalogById, recipes as liveRecipes } from "./book.ts";
import { isProtected } from "./conservation.ts";
import type {
  BenchSnapshot,
  BenchState,
  CatalogEntry,
  ItemInstance,
  JournalEntry,
  Recipe,
  WorkPreview,
  WorkRequest,
} from "./types.ts";
import { isStackableKind } from "./types.ts";

const COUNT_CAP = 500;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function catalog(id: string): CatalogEntry | undefined {
  return catalogById.get(id);
}

function nameOf(id: string): string {
  return catalog(id)?.name ?? id;
}

export function totalMass(state: BenchState): number {
  let mass = 0;
  for (const item of state.items) {
    const entry = catalog(item.catalogId);
    if (!entry) throw new Error(`unbound instance ${item.catalogId}`);
    mass += entry.mass * item.qty;
  }
  return mass;
}

function emptyPreview(recipeId: string, title: string, failures: string[], recovery?: string): WorkPreview {
  return {
    ok: false,
    recipeId,
    title,
    count: 1,
    inputs: [],
    outputs: [],
    identityNote: "Nothing changes.",
    provenanceNote: "Provenance stays as it is.",
    cost: { minutes: 0, focus: 0, toolWear: 0 },
    feedback: failures[0] ?? "Refused.",
    failures,
    recovery,
    warnings: [],
  };
}

function snapshot(state: BenchState, label: string): BenchSnapshot {
  return {
    items: clone(state.items),
    focus: state.focus,
    seq: state.seq,
    journal: clone(state.journal),
    label,
  };
}

function pushJournal(draft: BenchState, entry: Omit<JournalEntry, "id">): void {
  draft.seq += 1;
  draft.journal = [...draft.journal, { ...entry, id: `j-${draft.seq}` }].slice(-40);
}

function dropEmpty(draft: BenchState): void {
  draft.items = draft.items.filter((item) => item.qty > 0);
}

interface Resolved {
  catalogId: string;
  qty: number;
  consume: "all" | "wear" | "tool" | "none";
  role: "primary" | "material" | "tool";
  minCondition: number;
  substituted: boolean;
  note?: string;
  instanceId?: string;
}

function assertSane(draft: BenchState, beforeMass: number): void {
  if (!Number.isInteger(draft.focus) || draft.focus < 0) throw new Error("negative focus");
  const ids = new Set<string>();
  for (const item of draft.items) {
    if (ids.has(item.instanceId)) throw new Error(`duplicated instance ${item.instanceId}`);
    ids.add(item.instanceId);
    if (!Number.isInteger(item.qty) || item.qty < 1) throw new Error(`bad qty on ${item.instanceId}`);
    if (!Number.isInteger(item.condition) || item.condition < 1 || item.condition > 100) {
      throw new Error(`bad condition on ${item.instanceId}`);
    }
    if (!catalog(item.catalogId)) throw new Error(`missing fixture ${item.catalogId}`);
  }
  if (totalMass(draft) > beforeMass) throw new Error("mass increased");
}

export interface ApplyOptions {
  /** When set, this recipe is used instead of the live book. Tests use it for hostile books. */
  recipe?: Recipe;
}

function resolveRecipe(id: string, options?: ApplyOptions): Recipe | undefined {
  if (options?.recipe && options.recipe.id === id) return options.recipe;
  return liveRecipes.find((recipe) => recipe.id === id);
}

/**
 * Mutates `draft` only when the operation is fully legal.
 * Returns a preview either way. Throws only on an internal invariant break
 * after a mutation — callers discard the draft.
 */
export function applyOnce(draft: BenchState, req: WorkRequest, options?: ApplyOptions): WorkPreview {
  const recipe = resolveRecipe(req.recipeId, options);
  if (!recipe) return emptyPreview(req.recipeId, "Unknown operation", ["That operation is not in the book."]);

  const count = req.count ?? 1;
  const failures: string[] = [];
  const warnings: string[] = [];
  if (!Number.isInteger(count) || count < 1) {
    failures.push("Count must be a whole number, one or more.");
  }
  if (count > COUNT_CAP) failures.push(`Count is capped at ${COUNT_CAP}. Run it again if you still mean to.`);
  if (!recipe.batchable && count > 1) failures.push("This operation is one piece at a time. Use Do every for a set.");

  const choice = recipe.choices?.find((item) => item.id === req.choiceId);
  if (recipe.choices?.length && !choice) {
    failures.push("Choose a direction. Neither one replaces the other, and neither is assumed.");
  }

  let quality = 0;
  const resolved: Resolved[] = [];
  const specs = [...recipe.inputs, ...(choice?.extraInputs ?? [])];
  for (const input of specs) {
    let catalogId = input.catalogId;
    let qty = input.qty * (Number.isInteger(count) && count > 0 ? count : 1);
    let substituted = false;
    let note: string | undefined;
    if (input.role === "material" && catalogId !== "*") {
      const want = req.substitutes?.[input.catalogId];
      if (want && want !== input.catalogId) {
        const sub = recipe.substitutions.find(
          (item) => item.forCatalogId === input.catalogId && item.withCatalogId === want,
        );
        if (!sub) {
          failures.push(`${nameOf(want)} is not a substitute for ${nameOf(input.catalogId)} here.`);
        } else if (choice && sub.incompatibleChoices?.includes(choice.id)) {
          failures.push(`${sub.note} It fights ${choice.name}. Use the written material, or pick the other direction.`);
        } else {
          catalogId = want;
          qty = input.qty * sub.qtyMultiplier * count;
          substituted = true;
          note = sub.note;
          quality += sub.qualityDelta;
        }
      }
    }
    resolved.push({
      catalogId,
      qty,
      consume: input.consume,
      role: input.role,
      minCondition: input.minCondition ?? (input.role === "tool" ? 8 : 1),
      substituted,
      note,
      instanceId: input.role === "primary" ? req.primaryInstanceId : undefined,
    });
  }

  const primarySpec = resolved.find((input) => input.role === "primary");
  let primary: ItemInstance | undefined;
  if (primarySpec) {
    primary = draft.items.find((item) => item.instanceId === primarySpec.instanceId);
    if (!primary) {
      failures.push(
        primarySpec.catalogId === "*"
          ? "Pick a piece to inspect."
          : `Select the ${nameOf(primarySpec.catalogId)} this operation works on.`,
      );
    } else if (primarySpec.catalogId !== "*" && primary.catalogId !== primarySpec.catalogId) {
      failures.push(`That piece is ${nameOf(primary.catalogId)}, not ${nameOf(primarySpec.catalogId)}.`);
      primary = undefined;
    } else if (!isStackableKind(catalog(primary.catalogId)?.kind ?? "gear") && count !== 1) {
      failures.push("This is one object. Set the count to 1, or use Do every for several.");
    } else if (primary.qty < primarySpec.qty && primarySpec.consume === "all") {
      failures.push(`Need ${primarySpec.qty} ${nameOf(primary.catalogId)}, this pile has ${primary.qty}.`);
    } else if (primary.condition < primarySpec.minCondition) {
      failures.push(
        `${nameOf(primary.catalogId)} is at ${primary.condition}. This work wants at least ${primarySpec.minCondition}. Restore or maintain it first.`,
      );
    }
  }

  if (primary) {
    const entry = catalog(primary.catalogId);
    const spendingPrimary = primarySpec?.consume === "all" || recipe.kind === "dismantle";
    if (entry && spendingPrimary && (entry.quest || entry.kind === "quest")) {
      failures.push(`${entry.name} is a quest piece. The bench will not destroy it.`);
    } else if (entry && spendingPrimary && entry.kind === "heirloom") {
      failures.push(`${entry.name} is an heirloom. Its history stays on it. It is not taken apart.`);
    } else if (entry && spendingPrimary && entry.critical) {
      failures.push(`${entry.name} is a bench tool. Wearing it down is allowed. Spending it is not.`);
    }
  }

  for (const input of resolved) {
    if (input.consume !== "all" || input.role === "primary" || input.catalogId === "*") continue;
    const entry = catalog(input.catalogId);
    if (!entry) {
      failures.push(`Missing fixture ${input.catalogId}.`);
      continue;
    }
    if (isProtected(entry.kind, entry.quest, entry.critical) || entry.critical) {
      failures.push(`${entry.name} cannot be spent.`);
    }
    const have = draft.items
      .filter((item) => item.catalogId === input.catalogId && isStackableKind(entry.kind))
      .reduce((sum, item) => sum + item.qty, 0);
    if (have < input.qty) {
      failures.push(`Need ${input.qty} ${entry.name}, have ${have}.`);
    }
  }

  for (const input of resolved.filter((item) => item.role === "tool")) {
    const entry = catalog(input.catalogId);
    const tool = draft.items.find(
      (item) => item.catalogId === input.catalogId && item.condition >= input.minCondition,
    );
    if (!tool) {
      failures.push(
        entry
          ? `${entry.name} is not ready (needs condition ${input.minCondition}). Maintain it, then come back.`
          : `Missing tool ${input.catalogId}.`,
      );
    } else {
      input.instanceId = tool.instanceId;
    }
  }

  if (choice && primary?.mods.some((mod) => mod.axis === choice.axis)) {
    failures.push(`The ${choice.axis.replaceAll("-", " ")} is already decided. Undo that change before choosing again.`);
  }

  const retained = recipe.outputs.find((output) => output.identity === "retain-primary");
  let partial = false;
  if (
    primary &&
    retained &&
    (recipe.kind === "restore" || recipe.kind === "maintain") &&
    recipe.failure.onLowCondition === "partial" &&
    primary.condition < 20 &&
    recipe.kind === "restore"
  ) {
    partial = true;
    warnings.push("Low condition: the mend will only half take. The object is still itself.");
  }
  if (retained && (recipe.kind === "restore" || recipe.kind === "maintain")) {
    const delta = retained.conditionDelta ?? 0;
    const gain = (partial ? Math.floor(delta / 2) : delta) + quality;
    if (delta > 0 && gain <= 0) {
      failures.push("That substitute will not hold. Choose another. Nothing was spent.");
    }
  }

  const focusCost = recipe.cost.focus * (count > 0 ? count : 1);
  if (draft.focus < focusCost) {
    failures.push(`Need ${focusCost} focus, have ${draft.focus}.`);
  }

  const primaryEntry = primary ? catalog(primary.catalogId) : undefined;
  const identityNote = identityCopy(recipe, primary, primaryEntry);
  const provenanceNote = provenanceCopy(recipe, primaryEntry);

  const preview: WorkPreview = {
    ok: failures.length === 0,
    recipeId: recipe.id,
    title: recipe.name,
    count: count > 0 ? count : 1,
    inputs: resolved.map((input) => ({
      catalogId: input.catalogId,
      qty: input.qty,
      consume: input.consume,
      substituted: input.substituted,
      note: input.note,
      instanceId: input.instanceId,
    })),
    outputs: recipe.outputs.map((output) => ({
      catalogId: output.catalogId,
      qty: output.identity === "retain-primary" ? 1 : output.qty * (count > 0 ? count : 1),
      identity: output.identity,
      name: output.identity === "retain-primary" ? (primaryEntry?.name ?? nameOf(output.catalogId)) : nameOf(output.catalogId),
    })),
    identityNote,
    provenanceNote,
    cost: {
      minutes: recipe.cost.minutes * (count > 0 ? count : 1),
      focus: focusCost,
      toolWear: recipe.cost.toolWear * (count > 0 ? count : 1),
    },
    choice: choice ? { id: choice.id, name: choice.name, summary: choice.summary } : undefined,
    feedback: failures.length
      ? recipe.feedback.fail
      : partial && recipe.feedback.partial
        ? recipe.feedback.partial
        : recipe.feedback.success,
    failures,
    recovery: failures.length ? recipe.failure.recovery : undefined,
    warnings,
  };

  if (!preview.ok) return preview;

  const beforeMass = totalMass(draft);
  const beforePrimary = primary ? clone(primary) : undefined;

  for (const input of resolved) {
    if (input.consume !== "all") continue;
    if (input.role === "primary" && primary) {
      const inst = draft.items.find((item) => item.instanceId === primary.instanceId);
      if (!inst || inst.qty < input.qty) throw new Error("primary underflow");
      inst.qty -= input.qty;
      continue;
    }
    let remaining = input.qty;
    for (const item of draft.items) {
      if (remaining <= 0) break;
      if (item.catalogId !== input.catalogId) continue;
      const entry = catalog(item.catalogId);
      if (!entry || !isStackableKind(entry.kind)) continue;
      const use = Math.min(item.qty, remaining);
      item.qty -= use;
      remaining -= use;
    }
    if (remaining > 0) throw new Error("material underflow");
  }
  dropEmpty(draft);

  const wear = recipe.cost.toolWear * count;
  if (wear > 0) {
    for (const input of resolved.filter((item) => item.role === "tool" && item.instanceId)) {
      const tool = draft.items.find((item) => item.instanceId === input.instanceId);
      if (!tool) continue;
      tool.condition = Math.max(1, tool.condition - wear);
    }
  }

  draft.focus -= focusCost;

  if (retained && beforePrimary) {
    const inst = draft.items.find((item) => item.instanceId === beforePrimary.instanceId);
    if (!inst) throw new Error("retained piece vanished");
    if (inst.catalogId !== beforePrimary.catalogId || inst.provenance.identityKey !== beforePrimary.provenance.identityKey) {
      throw new Error("identity drifted");
    }
    const delta = retained.conditionDelta ?? 0;
    const gain = (partial ? Math.floor(delta / 2) : delta) + (recipe.kind === "modify" ? 0 : quality);
    if (recipe.kind === "restore" || recipe.kind === "maintain" || recipe.kind === "modify") {
      inst.condition = clamp(inst.condition + Math.max(recipe.kind === "modify" ? 0 : gain, recipe.kind === "modify" ? 0 : 0), 1, 100);
      if (recipe.kind !== "modify") {
        const applied = Math.max(gain, 0);
        inst.condition = clamp(beforePrimary.condition + applied, 1, 100);
      }
    }
    if (choice) {
      inst.mods = [
        ...inst.mods,
        {
          choiceId: choice.id,
          recipeId: recipe.id,
          axis: choice.axis,
          stats: { ...choice.stats },
          name: choice.name,
        },
      ];
    }
    const line =
      recipe.historyLine && recipe.kind !== "inspect"
        ? choice
          ? `${recipe.historyLine} Direction: ${choice.name}.`
          : recipe.historyLine
        : undefined;
    if (line) {
      inst.history = [...inst.history, { cycle: draft.cycle, text: line, opId: recipe.id }];
      inst.provenance = {
        ...inst.provenance,
        notes: [...inst.provenance.notes, line].slice(-12),
      };
    }
    if (quality !== 0 && recipe.kind !== "modify") {
      inst.provenance = {
        ...inst.provenance,
        notes: [...inst.provenance.notes, `Substitute shift ${quality}.`].slice(-12),
      };
    }
  }

  for (const output of recipe.outputs) {
    if (output.identity !== "new") continue;
    const entry = catalog(output.catalogId);
    if (!entry) throw new Error(`output missing ${output.catalogId}`);
    const qty = output.qty * count;
    const condition = clamp((output.condition ?? 70) + quality, 1, 100);
    const note =
      beforePrimary && !isStackableKind(primaryEntry?.kind ?? "material")
        ? `Salvaged from ${primaryEntry?.name ?? "a piece"} (${beforePrimary.provenance.identityKey}).`
        : recipe.kind === "dismantle"
          ? `Parted on the bench from ${primaryEntry?.name ?? output.catalogId}.`
          : "Made on the bench. New object, no borrowed life.";
    if (isStackableKind(entry.kind)) {
      const pile = draft.items.find((item) => item.catalogId === entry.id && isStackableKind(entry.kind));
      if (pile) {
        pile.qty += qty;
        pile.condition = Math.min(pile.condition, condition);
        if (!pile.provenance.notes.includes(note)) {
          pile.provenance = { ...pile.provenance, notes: [...pile.provenance.notes, note].slice(-12) };
        }
      } else {
        draft.seq += 1;
        draft.items.push(makeItem(draft, entry.id, qty, condition, note, beforePrimary?.instanceId));
      }
    } else {
      for (let n = 0; n < qty; n++) {
        draft.seq += 1;
        draft.items.push(makeItem(draft, entry.id, 1, condition, note, beforePrimary?.instanceId));
      }
    }
  }

  pushJournal(draft, {
    recipeId: recipe.id,
    title: recipe.name,
    detail: preview.feedback,
  });

  assertSane(draft, beforeMass);
  return preview;
}

function makeItem(
  draft: BenchState,
  catalogId: string,
  qty: number,
  condition: number,
  note: string,
  parentId?: string,
): ItemInstance {
  const seq = draft.seq;
  return {
    instanceId: `inst-${seq}`,
    catalogId,
    qty,
    condition,
    provenance: {
      origin: "crafted",
      cycle: draft.cycle,
      notes: [note],
      parentInstanceIds: parentId ? [parentId] : [],
      identityKey: `id.made.${seq}`,
    },
    mods: [],
    history: [{ cycle: draft.cycle, text: note }],
    favorite: false,
    locked: false,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function identityCopy(recipe: Recipe, primary: ItemInstance | undefined, entry: CatalogEntry | undefined): string {
  if (recipe.kind === "inspect") {
    return primary
      ? `Read only. Identity key ${primary.provenance.identityKey} stays. History is not rewritten.`
      : "Read only.";
  }
  if (recipe.kind === "dismantle") {
    return "This object ends. Parts do not keep its identity key. A note records the source when the source was unique.";
  }
  if (recipe.outputs.some((output) => output.identity === "retain-primary")) {
    if (entry?.kind === "heirloom" || entry?.kind === "quest") {
      return `Same object. Identity key ${primary?.provenance.identityKey ?? "—"} stays. Earlier history is kept and a line is appended.`;
    }
    return "Same piece. A modification is a direction, not a new or better object. Identity key stays.";
  }
  return "A new object. It does not inherit a life. Mass spent is at least the mass set down.";
}

function provenanceCopy(recipe: Recipe, entry: CatalogEntry | undefined): string {
  if (recipe.kind === "inspect") return "Bearer, cycle, notes, and history are shown as stored.";
  if (recipe.kind === "dismantle") return "Unique sources leave a salvage note on the pile. The pile's own key is not the old key.";
  if (entry?.kind === "heirloom") return "Bearer and earlier notes stay. The new line does not replace them.";
  if (recipe.outputs.some((output) => output.identity === "retain-primary")) return "Provenance is kept. The work adds a note.";
  return "Origin is the bench. Parent instance is recorded when a unique piece was spent.";
}

export function preview(state: BenchState, req: WorkRequest, options?: ApplyOptions): WorkPreview {
  try {
    return applyOnce(clone(state), req, options);
  } catch (error) {
    return emptyPreview(req.recipeId, "Refused", [
      error instanceof Error ? error.message : "The bench refused the work.",
    ], "Nothing was spent.");
  }
}

export interface PerformResult {
  state: BenchState;
  preview: WorkPreview;
  ok: boolean;
}

export function perform(state: BenchState, req: WorkRequest, options?: ApplyOptions): PerformResult {
  return performMany(state, [req], options);
}

export function performMany(state: BenchState, reqs: WorkRequest[], options?: ApplyOptions): PerformResult {
  if (reqs.length === 0) {
    const refused = emptyPreview("op.batch", "Nothing eligible", [
      "Nothing eligible. Favorites and locked pieces are left alone.",
    ], "Unlock a pile, or pick one operation.");
    return { state, preview: refused, ok: false };
  }
  const draft = clone(state);
  try {
    const previews: WorkPreview[] = [];
    for (const req of reqs) previews.push(applyOnce(draft, req, options));
    const merged = mergePreviews(previews);
    if (!previews.some((item) => item.ok)) return { state, preview: merged, ok: false };
    assertSane(draft, totalMass(state));
    const label = reqs.length === 1 ? merged.title : `Batch · ${previews.filter((item) => item.ok).length}`;
    draft.undo = [...state.undo, snapshot(state, label)].slice(-30);
    return { state: draft, preview: merged, ok: true };
  } catch (error) {
    const refused = emptyPreview(reqs[0]?.recipeId ?? "op.batch", "Refused", [
      error instanceof Error ? error.message : "Refused.",
      "The bench rolled the work back.",
    ], "Nothing was spent.");
    return { state, preview: refused, ok: false };
  }
}

function mergePreviews(previews: WorkPreview[]): WorkPreview {
  if (previews.length === 1) return previews[0];
  const okOnes = previews.filter((item) => item.ok);
  const bad = previews.filter((item) => !item.ok);
  const inputs = new Map<string, { catalogId: string; qty: number; consume: Resolved["consume"]; substituted: boolean }>();
  for (const item of okOnes) {
    for (const input of item.inputs) {
      const key = `${input.catalogId}:${input.consume}`;
      const prev = inputs.get(key);
      if (prev) prev.qty += input.qty;
      else inputs.set(key, { catalogId: input.catalogId, qty: input.qty, consume: input.consume, substituted: input.substituted });
    }
  }
  const outputs = new Map<string, { catalogId: string; qty: number; identity: string; name: string }>();
  for (const item of okOnes) {
    for (const output of item.outputs) {
      const key = `${output.catalogId}:${output.identity}`;
      const prev = outputs.get(key);
      if (prev) prev.qty += output.qty;
      else outputs.set(key, { ...output });
    }
  }
  const focus = okOnes.reduce((sum, item) => sum + item.cost.focus, 0);
  const minutes = okOnes.reduce((sum, item) => sum + item.cost.minutes, 0);
  return {
    ok: okOnes.length > 0,
    recipeId: "op.batch",
    title: okOnes.length ? `Batch · ${okOnes.length} done` : "Batch",
    count: okOnes.length,
    inputs: [...inputs.values()].map((input) => ({ ...input, note: undefined })),
    outputs: [...outputs.values()],
    identityNote: "Each piece follows its own rule. Heirlooms, quest pieces, favorites, and locks are not swept up.",
    provenanceNote: "Notes are appended per object. Batching does not rewrite history.",
    cost: { minutes, focus, toolWear: 0 },
    feedback: okOnes.length
      ? `${okOnes.length} done${bad.length ? `, ${bad.length} skipped` : ""}. One undo puts the whole batch back.`
      : "Nothing in the batch could be done.",
    failures: bad.flatMap((item) => item.failures.map((failure) => `${item.title}: ${failure}`)).slice(0, 8),
    recovery: bad[0]?.recovery,
    warnings: bad.map((item) => item.title),
  };
}

export function undo(state: BenchState): BenchState {
  const prior = state.undo.at(-1);
  if (!prior) return state;
  return {
    ...state,
    items: clone(prior.items),
    focus: prior.focus,
    seq: prior.seq,
    journal: clone(prior.journal),
    undo: state.undo.slice(0, -1),
  };
}

export function rest(state: BenchState): BenchState {
  if (state.focus >= state.focusMax) return state;
  const draft = clone(state);
  draft.focus = state.focusMax;
  pushJournal(draft, {
    recipeId: "op.rest",
    title: "Rested",
    detail: "Focus restored. Nothing on the bench was touched.",
  });
  draft.undo = [...state.undo, snapshot(state, "Rest")].slice(-30);
  return draft;
}

export function maxCount(state: BenchState, req: WorkRequest): number {
  const recipe = liveRecipes.find((item) => item.id === req.recipeId);
  if (!recipe) return 0;
  if (!recipe.batchable) return preview(state, { ...req, count: 1 }).ok ? 1 : 0;
  let best = 0;
  let hi = 1;
  while (hi <= COUNT_CAP && preview(state, { ...req, count: hi }).ok) {
    best = hi;
    hi *= 2;
  }
  let lo = best;
  let right = Math.min(COUNT_CAP, Math.max(hi - 1, best));
  while (lo < right) {
    const mid = Math.ceil((lo + right) / 2);
    if (preview(state, { ...req, count: mid }).ok) lo = mid;
    else right = mid - 1;
  }
  return lo;
}

export function salvageRequests(state: BenchState): WorkRequest[] {
  const reqs: WorkRequest[] = [];
  for (const item of state.items) {
    if (item.favorite || item.locked) continue;
    const entry = catalog(item.catalogId);
    if (!entry?.tags.includes("salvage-pile")) continue;
    if (entry.quest || entry.critical || entry.kind === "heirloom" || entry.kind === "quest" || entry.kind === "tool") {
      continue;
    }
    const recipe = liveRecipes.find(
      (op) => op.kind === "dismantle" && op.inputs.some((input) => input.role === "primary" && input.catalogId === entry.id),
    );
    if (!recipe) continue;
    reqs.push({ recipeId: recipe.id, primaryInstanceId: item.instanceId, count: item.qty });
  }
  return reqs;
}

export function everyRequests(state: BenchState, req: WorkRequest): WorkRequest[] {
  const recipe = liveRecipes.find((item) => item.id === req.recipeId);
  if (!recipe) return [];
  const primary = recipe.inputs.find((input) => input.role === "primary");
  if (!primary || primary.catalogId === "*") {
    const count = maxCount(state, req);
    return count > 0 ? [{ ...req, count }] : [];
  }
  const entry = catalog(primary.catalogId);
  if (!entry) return [];
  if (isStackableKind(entry.kind)) {
    const pile = state.items.find((item) => item.catalogId === entry.id && !item.favorite && !item.locked);
    if (!pile) return [];
    const count = maxCount(state, { ...req, primaryInstanceId: pile.instanceId, count: 1 });
    return count > 0 ? [{ ...req, primaryInstanceId: pile.instanceId, count }] : [];
  }
  return state.items
    .filter((item) => item.catalogId === entry.id && !item.favorite && !item.locked)
    .map((item) => ({ ...req, primaryInstanceId: item.instanceId, count: 1 }));
}

export function isRunnable(state: BenchState, recipe: Recipe): boolean {
  const req: WorkRequest = { recipeId: recipe.id, count: 1 };
  if (recipe.choices?.[0]) req.choiceId = recipe.choices[0].id;
  const primary = recipe.inputs.find((input) => input.role === "primary");
  if (primary) {
    if (primary.catalogId === "*") req.primaryInstanceId = state.items[0]?.instanceId;
    else req.primaryInstanceId = state.items.find((item) => item.catalogId === primary.catalogId)?.instanceId;
    if (!req.primaryInstanceId) return false;
  }
  return preview(state, req).ok;
}

export function runnableRecipes(state: BenchState): Recipe[] {
  return liveRecipes.filter((recipe) => isRunnable(state, recipe));
}

export function toggleFavoriteItem(state: BenchState, instanceId: string): BenchState {
  return {
    ...state,
    items: state.items.map((item) => (item.instanceId === instanceId ? { ...item, favorite: !item.favorite } : item)),
  };
}

export function toggleLock(state: BenchState, instanceId: string): BenchState {
  return {
    ...state,
    items: state.items.map((item) => (item.instanceId === instanceId ? { ...item, locked: !item.locked } : item)),
  };
}

export function toggleFavoriteRecipe(state: BenchState, recipeId: string): BenchState {
  const has = state.favoriteRecipes.includes(recipeId);
  return {
    ...state,
    favoriteRecipes: has ? state.favoriteRecipes.filter((id) => id !== recipeId) : [...state.favoriteRecipes, recipeId],
  };
}
