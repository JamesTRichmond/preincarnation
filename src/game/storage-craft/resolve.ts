import { containerAccess, orderedContainers, resolveCandidateIds, stalenessToken } from "./access.ts";
import {
  getItem,
  getRecipe,
  itemName,
  producersOf,
  stackLimit,
} from "./fixture-catalog.ts";
import type {
  BlockedLine,
  BlockReason,
  BulkDeposit,
  CraftIssue,
  CraftPreview,
  CraftRequest,
  Deposit,
  Draw,
  ExistingRecipe,
  ExistingRecipeInput,
  ItemStack,
  PreviewSlot,
  RestoreDeposit,
  SourceLine,
  World,
} from "./types.ts";

interface Side {
  draws: Draw[];
  deposits: Deposit[];
  slots: PreviewSlot[];
  issues: CraftIssue[];
  nestedRecipeIds: string[];
}

interface Ctx {
  world: World;
  request: CraftRequest;
  candidateIds: string[];
  reserved: Map<string, number>;
  destinationId: string | null;
}

function issue(code: CraftIssue["code"], message: string, extra?: Partial<CraftIssue>): CraftIssue {
  return { code, message, ...extra };
}

function emptyPreview(request: CraftRequest, token: string, errors: CraftIssue[]): CraftPreview {
  return {
    ok: false,
    recipeId: request.recipeId,
    recipeName: request.recipeId,
    station: null,
    quantity: request.quantity,
    fixture: false,
    fixtureLabel: null,
    slots: [],
    draws: [],
    deposits: [],
    output: { itemId: null, qty: 0, containerId: null, containerName: null },
    errors,
    stalenessToken: token,
    nestedRecipeIds: [],
  };
}

function choiceFor(request: CraftRequest, recipeId: string, slotIndex: number) {
  return request.choices?.find((choice) => choice.recipeId === recipeId && choice.slotIndex === slotIndex);
}

function allowedItem(input: ExistingRecipeInput, itemId: string): boolean {
  return itemId === input.itemId || (input.substitutes ?? []).includes(itemId);
}

/** Nested-prep edges only. A revisit is a cyclic recipe. */
export function recipeCycle(recipeId: string, trail: string[] = []): boolean {
  if (trail.includes(recipeId)) return true;
  const recipe = getRecipe(recipeId);
  if (!recipe) return false;
  const next = [...trail, recipeId];
  for (const input of recipe.inputs) {
    if (!input.allowNestedPrep) continue;
    const itemIds = [input.itemId, ...(input.substitutes ?? [])];
    for (const itemId of itemIds) {
      for (const producer of producersOf(itemId)) {
        if (recipeCycle(producer.id, next)) return true;
      }
    }
  }
  return false;
}

function stackUsableBy(stack: ItemStack, crafterId: string): BlockReason | null {
  if (stack.ownerId !== crafterId && stack.ownerId !== "shared") return "ownership";
  if (stack.protection.kind === "favorite") return "favorite";
  if (stack.protection.kind === "reserved") return "reserved";
  if (stack.protection.kind === "quest") return "quest";
  return null;
}

function heirloomHolds(stack: ItemStack, itemId: string): number {
  if (stack.provenance.kind !== "unique") return 0;
  if (stack.itemId === itemId) return stack.qty;
  const contained = stack.provenance.containedComponents?.find((entry) => entry.itemId === itemId);
  return contained?.qty ?? 0;
}

function allocate(input: ExistingRecipeInput, chosenItemId: string, need: number, slotKey: string, ctx: Ctx): {
  sources: SourceLine[];
  blocked: BlockedLine[];
  taken: number;
} {
  const provenance = input.provenance ?? "bulk";
  const sources: SourceLine[] = [];
  const blocked: BlockedLine[] = [];
  let taken = 0;
  const containers = orderedContainers(ctx.world, ctx.candidateIds, ctx.request.crafterId);
  const prefer =
    choiceFor(ctx.request, slotKey.split("#")[0] ?? "", Number(slotKey.split("#")[1]))?.preferInstanceIds ??
    [];

  type Candidate = { containerId: string; containerName: string; stack: ItemStack; access: "ok" | "no-access" | "unavailable" };
  const ranked: Candidate[] = [];
  for (const container of containers) {
    const access = containerAccess(container, ctx.request.crafterId, "draw");
    for (const stack of container.stacks) {
      const holds = stack.itemId === chosenItemId || heirloomHolds(stack, chosenItemId) > 0;
      if (!holds) continue;
      ranked.push({ containerId: container.id, containerName: container.name, stack, access });
    }
  }
  ranked.sort((a, b) => {
    const ap = prefer.indexOf(a.stack.instanceId);
    const bp = prefer.indexOf(b.stack.instanceId);
    const as = ap === -1 ? 999 : ap;
    const bs = bp === -1 ? 999 : bp;
    return as - bs;
  });

  for (const candidate of ranked) {
    const { stack, access } = candidate;
    const pushBlocked = (reason: BlockReason, qty: number) => {
      blocked.push({
        containerId: candidate.containerId,
        containerName: candidate.containerName,
        instanceId: stack.instanceId,
        itemId: stack.itemId,
        qty,
        displayName: stack.provenance.displayName,
        reason,
      });
    };

    if (access === "unavailable") {
      pushBlocked("unavailable", stack.itemId === chosenItemId ? stack.qty : heirloomHolds(stack, chosenItemId));
      continue;
    }
    if (access === "no-access") {
      pushBlocked("no-access", stack.itemId === chosenItemId ? stack.qty : heirloomHolds(stack, chosenItemId));
      continue;
    }

    const held = heirloomHolds(stack, chosenItemId);
    const isDirect = stack.itemId === chosenItemId;
    if (stack.provenance.kind === "unique" && (provenance === "bulk" || !isDirect)) {
      pushBlocked("heirloom", held || stack.qty);
      continue;
    }
    if (provenance === "unique" && stack.provenance.kind !== "unique") {
      pushBlocked("wrong-provenance", stack.qty);
      continue;
    }
    if (!isDirect) continue;

    const ownership = stackUsableBy(stack, ctx.request.crafterId);
    if (ownership) {
      pushBlocked(ownership, stack.qty);
      continue;
    }

    const already = ctx.reserved.get(stack.instanceId) ?? 0;
    const room = stack.qty - already;
    if (room <= 0 || taken >= need) {
      if (room > 0 && taken >= need) {
        /* leftover eligible pile stays unlisted; it is not blocked */
      }
      continue;
    }
    const qty = Math.min(room, need - taken);
    ctx.reserved.set(stack.instanceId, already + qty);
    taken += qty;
    sources.push({
      containerId: candidate.containerId,
      containerName: candidate.containerName,
      instanceId: stack.instanceId,
      itemId: stack.itemId,
      qty,
      provenance: stack.provenance.kind,
      displayName: stack.provenance.displayName,
    });
    ctx.draws.push({
      slotKey,
      containerId: candidate.containerId,
      instanceId: stack.instanceId,
      itemId: stack.itemId,
      qty,
      ownerId: stack.ownerId,
      provenance: stack.provenance.kind,
    });
  }

  return { sources, blocked, taken };
}

function coverQty(blocked: BlockedLine[], reasons: BlockReason[]): number {
  return blocked.filter((line) => reasons.includes(line.reason)).reduce((sum, line) => sum + line.qty, 0);
}

function explainShortfall(
  input: ExistingRecipeInput,
  chosenItemId: string,
  shortfall: number,
  blocked: BlockedLine[],
): CraftIssue {
  const heirloom = coverQty(blocked, ["heirloom"]);
  const protectedQty = coverQty(blocked, ["favorite", "reserved", "quest"]);
  const unavailable = coverQty(blocked, ["unavailable"]);
  const denied = coverQty(blocked, ["no-access", "ownership"]);
  const name = itemName(chosenItemId);
  if (heirloom >= shortfall) {
    return issue(
      "PROTECTED_PROVENANCE",
      `Short ${shortfall} ${name}. A named piece holds that component and will not be broken down.`,
      { itemId: chosenItemId },
    );
  }
  if (protectedQty >= shortfall) {
    const reason = blocked.find((line) =>
      line.reason === "favorite" || line.reason === "reserved" || line.reason === "quest",
    )?.reason;
    const why =
      reason === "favorite" ? "favorited" : reason === "reserved" ? "reserved" : "quest-protected";
    return issue("PROTECTED", `Short ${shortfall} ${name}. The remaining pile is ${why}.`, {
      itemId: chosenItemId,
    });
  }
  if (unavailable >= shortfall) {
    return issue(
      "UNAVAILABLE_CONTAINER",
      `Short ${shortfall} ${name}. The rest sits in a container that is not in reach.`,
      { itemId: chosenItemId },
    );
  }
  if (denied >= shortfall) {
    return issue("NO_ACCESS", `Short ${shortfall} ${name}. Those piles belong to someone else.`, {
      itemId: chosenItemId,
    });
  }
  const substituteHint =
    input.substitutes && input.substitutes.length > 0 && chosenItemId === input.itemId
      ? ` Substitutes on this recipe: ${input.substitutes.map(itemName).join(", ")}.`
      : "";
  return issue("INSUFFICIENT", `Short ${shortfall} ${name}.${substituteHint}`, { itemId: chosenItemId });
}

function toolInReach(recipe: ExistingRecipe, ctx: Ctx): boolean {
  if (!recipe.toolItemId) return true;
  const containers = orderedContainers(ctx.world, ctx.candidateIds, ctx.request.crafterId);
  for (const container of containers) {
    if (containerAccess(container, ctx.request.crafterId, "draw") !== "ok") continue;
    for (const stack of container.stacks) {
      if (stack.itemId !== recipe.toolItemId) continue;
      if (stack.ownerId !== ctx.request.crafterId && stack.ownerId !== "shared") continue;
      return true;
    }
  }
  return false;
}

function resolveRecipe(
  recipe: ExistingRecipe,
  quantity: number,
  ctx: Ctx,
  visiting: string[],
  depth: number,
  depositQty: number,
  side: Side,
): boolean {
  if (visiting.includes(recipe.id)) {
    side.issues.push(issue("CYCLIC_RECIPE", `${recipe.name} loops back into itself.`));
    return false;
  }
  visiting.push(recipe.id);
  let localOk = true;

  if (!toolInReach(recipe, ctx)) {
    side.issues.push(
      issue("MISSING_TOOL", `${recipe.name} needs ${itemName(recipe.toolItemId ?? "")} in reach. It is not consumed.`, {
        itemId: recipe.toolItemId,
      }),
    );
    localOk = false;
  }

  for (let slotIndex = 0; slotIndex < recipe.inputs.length; slotIndex += 1) {
    const input = recipe.inputs[slotIndex];
    if (!input) continue;
    const slotKey = `${recipe.id}#${slotIndex}`;
    const chosen = choiceFor(ctx.request, recipe.id, slotIndex);
    const chosenItemId = chosen?.itemId ?? input.itemId;
    if (!getItem(chosenItemId) || !allowedItem(input, chosenItemId)) {
      side.issues.push(
        issue("INVALID_SUBSTITUTE", `${itemName(chosenItemId)} is not a substitute on ${recipe.name}.`, {
          itemId: chosenItemId,
        }),
      );
      localOk = false;
      continue;
    }
    const need = input.qty * quantity;
    const drawStart = ctx.draws.length;
    const { sources, blocked, taken } = allocate(input, chosenItemId, need, slotKey, ctx);
    let fromNested = 0;
    let nestedRecipeId: string | undefined;
    let shortfall = need - taken;
    let nestedFailed = false;

    if (shortfall > 0 && input.allowNestedPrep && ctx.request.nested) {
      const producer = producersOf(chosenItemId).find((entry) => !visiting.includes(entry.id));
      if (producer) {
        const batches = Math.ceil(shortfall / producer.output.qty);
        const produced = batches * producer.output.qty;
        const surplus = produced - shortfall;
        const reservedSnap = new Map(ctx.reserved);
        const child: Side = { draws: [], deposits: [], slots: [], issues: [], nestedRecipeIds: [] };
        const childCtx: Ctx = { ...ctx, draws: child.draws, reserved: ctx.reserved };
        const childOk = resolveRecipe(producer, batches, childCtx, visiting, depth + 1, surplus, child);
        side.slots.push(...child.slots);
        side.nestedRecipeIds.push(producer.id, ...child.nestedRecipeIds);
        if (childOk && child.issues.length === 0) {
          ctx.draws.push(...child.draws);
          side.deposits.push(...child.deposits);
          fromNested = shortfall;
          shortfall = 0;
          nestedRecipeId = producer.id;
        } else {
          nestedFailed = true;
          ctx.reserved.clear();
          for (const [key, qty] of reservedSnap) ctx.reserved.set(key, qty);
          side.issues.push(...child.issues);
          for (const slot of child.slots) slot.voided = true;
          localOk = false;
        }
      }
    }

    if (shortfall > 0 && !nestedFailed) {
      side.issues.push(explainShortfall(input, chosenItemId, shortfall, blocked));
      localOk = false;
    }

    side.slots.push({
      slotKey,
      recipeId: recipe.id,
      slotIndex,
      depth,
      requiredItemId: input.itemId,
      chosenItemId,
      qtyNeeded: need,
      qtyFromStorage: taken,
      qtyFromNested: fromNested,
      shortfall,
      sources: ctx.draws.slice(drawStart).map((draw) => ({
        containerId: draw.containerId,
        containerName:
          ctx.world.containers.find((container) => container.id === draw.containerId)?.name ?? draw.containerId,
        instanceId: draw.instanceId,
        itemId: draw.itemId,
        qty: draw.qty,
        provenance: draw.provenance,
      })),
      blocked,
      substitutes: input.substitutes ?? [],
      nestedRecipeId,
      voided: false,
    });
    // `sources` from allocate already match draws; prefer those names.
    const slot = side.slots[side.slots.length - 1];
    if (slot) slot.sources = sources;
  }

  if (recipe.restoresUniqueInput && localOk) {
    const uniqueDraws = ctx.draws.filter(
      (draw) => draw.provenance === "unique" && draw.slotKey.startsWith(`${recipe.id}#`),
    );
    if (uniqueDraws.length < quantity) {
      side.issues.push(issue("INSUFFICIENT", `${recipe.name} did not take the piece it restores.`));
      localOk = false;
    } else {
      for (const uniqueDraw of uniqueDraws) {
        const container = ctx.world.containers.find((entry) => entry.id === uniqueDraw.containerId);
        const stack = container?.stacks.find((entry) => entry.instanceId === uniqueDraw.instanceId);
        if (!stack) {
          side.issues.push(issue("STALE_QUANTITY", "The piece to restore disappeared."));
          localOk = false;
          break;
        }
        const restored: ItemStack = structuredClone(stack);
        restored.qty = 1;
        restored.condition = "restored";
        const deposit: RestoreDeposit = { kind: "restore", containerId: "", stack: restored };
        side.deposits.push(deposit);
      }
    }
  } else if (localOk && depositQty > 0 && !recipe.restoresUniqueInput) {
    const deposit: BulkDeposit = {
      kind: "bulk",
      containerId: "",
      itemId: recipe.output.itemId,
      qty: depositQty,
      ownerId: ctx.request.crafterId,
    };
    side.deposits.push(deposit);
  }

  visiting.pop();
  return localOk;
}

export interface Produced {
  ok: true;
  world: World;
}

export interface ProduceFailure {
  ok: false;
  issue: CraftIssue;
}

/** Apply a fully pinned plan. Mutates the clone only. */
export function produceNext(world: World, draws: Draw[], deposits: Deposit[]): Produced | ProduceFailure {
  const next = structuredClone(world);
  for (const draw of draws) {
    const container = next.containers.find((entry) => entry.id === draw.containerId);
    if (!container) {
      return { ok: false, issue: issue("STALE_QUANTITY", "A source container is gone.") };
    }
    if (containerAccess(container, world.crafterId, "draw") !== "ok") {
      return {
        ok: false,
        issue: issue("STALE_QUANTITY", `${container.name} can no longer be drawn from.`, {
          containerId: container.id,
        }),
      };
    }
    const stack = container.stacks.find((entry) => entry.instanceId === draw.instanceId);
    if (!stack || stack.qty < draw.qty || stack.itemId !== draw.itemId) {
      return {
        ok: false,
        issue: issue("STALE_QUANTITY", "A pinned pile no longer holds enough.", {
          instanceId: draw.instanceId,
          itemId: draw.itemId,
        }),
      };
    }
    if (stack.provenance.kind !== draw.provenance || stack.ownerId !== draw.ownerId) {
      return { ok: false, issue: issue("STALE_QUANTITY", "A pinned pile changed hands.", { instanceId: draw.instanceId }) };
    }
    if (stack.protection.kind !== "none") {
      return {
        ok: false,
        issue: issue("STALE_QUANTITY", "A pinned pile is now protected.", { instanceId: draw.instanceId }),
      };
    }
    stack.qty -= draw.qty;
    if (stack.qty <= 0) {
      container.stacks = container.stacks.filter((entry) => entry.instanceId !== draw.instanceId);
    }
  }

  let mint = 0;
  for (const deposit of deposits) {
    const container = next.containers.find((entry) => entry.id === deposit.containerId);
    if (!container) {
      return { ok: false, issue: issue("NO_OUTPUT_DESTINATION", "The output chest is gone.") };
    }
    if (deposit.kind === "restore") {
      if (container.stacks.length >= container.capacitySlots) {
        return {
          ok: false,
          issue: issue("FULL_OUTPUT", `${container.name} has no slot for the restored piece.`, {
            containerId: container.id,
          }),
        };
      }
      container.stacks.push(structuredClone(deposit.stack));
      continue;
    }
    let left = deposit.qty;
    const limit = stackLimit(deposit.itemId);
    for (const stack of container.stacks) {
      if (left <= 0) break;
      if (stack.itemId !== deposit.itemId || stack.provenance.kind !== "bulk") continue;
      if (stack.ownerId !== deposit.ownerId) continue;
      const room = limit - stack.qty;
      if (room <= 0) continue;
      const add = Math.min(room, left);
      stack.qty += add;
      left -= add;
    }
    while (left > 0) {
      if (container.stacks.length >= container.capacitySlots) {
        return {
          ok: false,
          issue: issue("FULL_OUTPUT", `${container.name} cannot hold the output.`, {
            containerId: container.id,
            itemId: deposit.itemId,
          }),
        };
      }
      const add = Math.min(limit, left);
      mint += 1;
      container.stacks.push({
        instanceId: `mint-${container.id}-${deposit.itemId}-${next.revision + 1}-${mint}`,
        itemId: deposit.itemId,
        qty: add,
        ownerId: deposit.ownerId,
        protection: { kind: "none" },
        provenance: { kind: "bulk" },
      });
      left -= add;
    }
  }

  next.revision = world.revision + 1;
  return { ok: true, world: next };
}

function assignDestination(world: World, request: CraftRequest, candidateIds: string[], deposits: Deposit[], draws: Draw[]): {
  containerId: string | null;
  containerName: string | null;
  issue: CraftIssue | null;
} {
  if (deposits.length === 0) {
    return { containerId: null, containerName: null, issue: null };
  }
  const crafterId = request.crafterId;
  const explicit = request.outputContainerId;
  const options: string[] = [];
  if (explicit) options.push(explicit);
  else {
    for (const container of orderedContainers(world, candidateIds, crafterId)) {
      if (containerAccess(container, crafterId, "deposit") === "ok") options.push(container.id);
    }
  }

  let last: CraftIssue = issue("NO_OUTPUT_DESTINATION", "Nowhere in reach can take the output.");
  for (const id of options) {
    const container = world.containers.find((entry) => entry.id === id);
    if (!container) {
      last = issue("NO_OUTPUT_DESTINATION", "That output chest is not on this bench.");
      if (explicit) break;
      continue;
    }
    const access = containerAccess(container, crafterId, "deposit");
    if (access === "unavailable") {
      last = issue("UNAVAILABLE_CONTAINER", `${container.name} cannot take the output.`, { containerId: id });
      if (explicit) break;
      continue;
    }
    if (access === "no-access") {
      last = issue("NO_ACCESS", `${container.name} is not yours to fill.`, { containerId: id });
      if (explicit) break;
      continue;
    }
    const placed = deposits.map((deposit) => ({ ...deposit, containerId: id }));
    const trial = produceNext(world, draws, placed);
    if (trial.ok) return { containerId: id, containerName: container.name, issue: null };
    last = trial.issue;
    if (explicit) break;
  }
  return { containerId: null, containerName: null, issue: last };
}

export function resolveCraft(world: World, request: CraftRequest): CraftPreview {
  const candidateIds = resolveCandidateIds(world, request.crafterId, request.candidateContainerIds);
  const token = stalenessToken(world, candidateIds);

  if (!Number.isInteger(request.quantity) || request.quantity < 1 || request.quantity > 99) {
    return emptyPreview(request, token, [
      issue("INVALID_QUANTITY", "Quantity must be a whole number from 1 to 99."),
    ]);
  }

  const recipe = getRecipe(request.recipeId);
  if (!recipe) {
    return emptyPreview(request, token, [
      issue("UNKNOWN_RECIPE", `No recipe ${request.recipeId} exists on this bench.`),
    ]);
  }
  if (request.station && request.station !== recipe.station) {
    return emptyPreview(request, token, [
      issue("WRONG_STATION", `${recipe.name} is not made at this station.`, { itemId: recipe.output.itemId }),
    ]);
  }
  if (recipeCycle(recipe.id)) {
    return emptyPreview(request, token, [
      issue("CYCLIC_RECIPE", `${recipe.name} is cyclic. Nested preparation is refused and nothing is taken.`),
    ]);
  }

  const ctx: Ctx = {
    world,
    request,
    candidateIds,
    reserved: new Map(),
    destinationId: null,
    draws: [],
  };
  const side: Side = { draws: [], deposits: [], slots: [], issues: [], nestedRecipeIds: [] };
  const outputQty = recipe.output.qty * request.quantity;
  resolveRecipe(recipe, request.quantity, ctx, [], 0, outputQty, side);

  let outputContainerId: string | null = null;
  let outputContainerName: string | null = null;
  if (side.issues.length === 0) {
    const placed = assignDestination(world, request, candidateIds, side.deposits, ctx.draws);
    if (placed.issue) side.issues.push(placed.issue);
    else {
      outputContainerId = placed.containerId;
      outputContainerName = placed.containerName;
      for (const deposit of side.deposits) deposit.containerId = placed.containerId ?? "";
    }
  }

  const preview: CraftPreview = {
    ok: side.issues.length === 0,
    recipeId: recipe.id,
    recipeName: recipe.name,
    station: recipe.station,
    quantity: request.quantity,
    fixture: true,
    fixtureLabel: recipe.fixtureLabel,
    slots: side.slots,
    draws: side.issues.length === 0 ? ctx.draws : ctx.draws,
    deposits: side.issues.length === 0 ? side.deposits : [],
    output: {
      itemId: recipe.output.itemId,
      qty: outputQty,
      containerId: outputContainerId,
      containerName: outputContainerName,
    },
    errors: side.issues,
    stalenessToken: token,
    nestedRecipeIds: [...new Set(side.nestedRecipeIds)],
  };
  return preview;
}

// Ctx needs draws array — declared via intersection below.
interface Ctx {
  draws: Draw[];
}
