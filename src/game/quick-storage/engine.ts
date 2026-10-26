import { accessBlock } from "./access.ts";
import {
  assertConserved,
  assertShape,
  findContainer,
  packOf,
  totalQuantity,
  validateWorld,
} from "./audit.ts";
import { cloneWorld } from "./clone.ts";
import { blockPhrase, describeMove, stayHeadline } from "./reasons.ts";
import type {
  DepositReceipt,
  DepositRequest,
  ItemLot,
  ManualPlaceRequest,
  ManualResult,
  MoveLine,
  RoutingRule,
  SaveEnvelope,
  StayLine,
  StayReason,
  StorageCategory,
  StorageContainer,
  StorageWorld,
} from "./types.ts";

interface Attempt {
  destId: string;
  reason: StayReason;
  detail: string;
}

interface Protection {
  lotId: string;
  stayQuantity: number;
  stayReason: StayReason | null;
  movable: number;
}

function sameMeta(left: ItemLot, right: ItemLot): boolean {
  const leftKeys = Object.keys(left.meta);
  const rightKeys = Object.keys(right.meta);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (left.meta[key] !== right.meta[key]) return false;
  }
  return true;
}

function canMerge(host: ItemLot, incoming: ItemLot): boolean {
  return (
    host.kind === "stack" &&
    incoming.kind === "stack" &&
    host.definitionId === incoming.definitionId &&
    host.ownerId === incoming.ownerId &&
    host.maxStack === incoming.maxStack &&
    !host.favorite &&
    !host.equipped &&
    sameMeta(host, incoming)
  );
}

function openSlots(container: StorageContainer, reserved: boolean): number {
  const capacity = reserved
    ? Math.max(0, container.slotCapacity - Math.max(0, container.reservedSlots))
    : container.slotCapacity;
  return Math.max(0, capacity - container.lots.length);
}

function mergeRoom(container: StorageContainer, lot: ItemLot): number {
  let room = 0;
  for (const host of container.lots) {
    if (canMerge(host, lot)) room += host.maxStack - host.quantity;
  }
  return room;
}

function placementRoom(container: StorageContainer, lot: ItemLot, manual: boolean): number {
  const slots = openSlots(container, !manual);
  if (lot.kind === "unique") return slots > 0 ? 1 : 0;
  return mergeRoom(container, lot) + slots * lot.maxStack;
}

interface Placement {
  hostId: string | null;
  quantity: number;
}

function peekPlacement(
  container: StorageContainer,
  lot: ItemLot,
  want: number,
  manual: boolean,
): Placement | null {
  if (want <= 0) return null;
  if (lot.kind === "unique") {
    if (want !== 1 || lot.quantity !== 1) return null;
    if (openSlots(container, !manual) <= 0) return null;
    return { hostId: null, quantity: 1 };
  }
  const host = container.lots.find((item) => canMerge(item, lot) && item.quantity < item.maxStack);
  if (host) {
    return { hostId: host.id, quantity: Math.min(want, host.maxStack - host.quantity) };
  }
  if (openSlots(container, !manual) <= 0) return null;
  return { hostId: null, quantity: Math.min(want, lot.maxStack) };
}

function roomBlock(container: StorageContainer, lot: ItemLot, manual: boolean): StayReason {
  if (!manual && placementRoom(container, lot, false) <= 0 && placementRoom(container, lot, true) > 0) {
    return "no-automation-slot";
  }
  return "destination-full";
}

function categoryById(world: StorageWorld, id: string | null): StorageCategory | undefined {
  if (!id) return undefined;
  return world.profile.categories.find((category) => category.id === id);
}

function categoryMatches(category: StorageCategory, lot: ItemLot): boolean {
  if (category.definitionIds.includes(lot.definitionId)) return true;
  return category.tags.some((tag) => lot.tags.includes(tag));
}

function ruleMatches(world: StorageWorld, rule: RoutingRule, lot: ItemLot): boolean {
  if (!rule.enabled) return false;
  if (rule.matchAny) return true;
  const category = categoryById(world, rule.categoryId);
  if (!category) return false;
  return categoryMatches(category, lot);
}

function isExcluded(world: StorageWorld, rule: RoutingRule, lot: ItemLot, destId: string): boolean {
  if (rule.excludeDestinationIds.includes(destId)) return true;
  return world.profile.exclusions.some((exclusion) => {
    if (exclusion.destinationId !== destId) return false;
    if (exclusion.definitionId && exclusion.definitionId !== lot.definitionId) return false;
    if (exclusion.tag && !lot.tags.includes(exclusion.tag)) return false;
    return true;
  });
}

function holdsDefinition(container: StorageContainer, definitionId: string): boolean {
  return container.lots.some((lot) => lot.definitionId === definitionId && lot.quantity > 0);
}

function containerName(world: StorageWorld, id: string): string {
  return findContainer(world, id)?.name ?? id;
}

/** How much of each pack lot may leave, after favorites, equipment, and reserves. */
function protections(world: StorageWorld): Protection[] {
  const pack = packOf(world);
  const lots = [...pack.lots].sort((a, b) => a.id.localeCompare(b.id));
  const byDefinition = new Map<string, ItemLot[]>();
  for (const lot of lots) {
    const group = byDefinition.get(lot.definitionId) ?? [];
    group.push(lot);
    byDefinition.set(lot.definitionId, group);
  }

  const movableById = new Map<string, number>();
  for (const [definitionId, group] of byDefinition) {
    const reserve =
      world.profile.reserves.find((item) => item.definitionId === definitionId)?.keepInPack ?? 0;
    const total = group.reduce((sum, lot) => sum + lot.quantity, 0);
    const protectedQty = group.reduce(
      (sum, lot) => (lot.equipped || lot.favorite ? sum + lot.quantity : sum),
      0,
    );
    let canLeave = Math.max(0, total - Math.max(reserve, protectedQty));
    for (const lot of group) {
      if (lot.equipped || lot.favorite) {
        movableById.set(lot.id, 0);
        continue;
      }
      const movable = Math.min(lot.quantity, canLeave);
      movableById.set(lot.id, movable);
      canLeave -= movable;
    }
  }

  return lots.map((lot) => {
    if (lot.equipped) {
      return { lotId: lot.id, stayQuantity: lot.quantity, stayReason: "equipped", movable: 0 };
    }
    if (lot.favorite) {
      return { lotId: lot.id, stayQuantity: lot.quantity, stayReason: "favorite", movable: 0 };
    }
    const movable = movableById.get(lot.id) ?? 0;
    const stayQuantity = lot.quantity - movable;
    return {
      lotId: lot.id,
      stayQuantity,
      stayReason: stayQuantity > 0 ? "reserved-supply" : null,
      movable,
    };
  });
}

function applyPlacement(
  world: StorageWorld,
  fromId: string,
  lotId: string,
  toId: string,
  placement: Placement,
): { destLotId: string; split: boolean } {
  const from = findContainer(world, fromId);
  const to = findContainer(world, toId);
  if (!from || !to) throw new Error("Container disappeared during placement.");
  const index = from.lots.findIndex((lot) => lot.id === lotId);
  const source = from.lots[index];
  if (!source || source.quantity < placement.quantity) {
    throw new Error("Placement lost its source lot.");
  }

  if (source.kind === "unique") {
    from.lots.splice(index, 1);
    to.lots.push(source);
    return { destLotId: source.id, split: false };
  }

  if (placement.hostId) {
    const host = to.lots.find((lot) => lot.id === placement.hostId);
    if (!host || host.quantity + placement.quantity > host.maxStack) {
      throw new Error("Merge target cannot take that quantity.");
    }
    host.quantity += placement.quantity;
    source.quantity -= placement.quantity;
    if (source.quantity === 0) from.lots.splice(index, 1);
    return { destLotId: host.id, split: source.quantity > 0 || from.id === to.id };
  }

  if (source.quantity === placement.quantity) {
    from.lots.splice(index, 1);
    to.lots.push(source);
    return { destLotId: source.id, split: false };
  }

  source.quantity -= placement.quantity;
  const spawned: ItemLot = {
    id: `lot-${world.nextLotSeq++}`,
    definitionId: source.definitionId,
    name: source.name,
    kind: "stack",
    quantity: placement.quantity,
    maxStack: source.maxStack,
    ownerId: source.ownerId,
    favorite: false,
    equipped: false,
    tags: [...source.tags],
    meta: { ...source.meta },
  };
  to.lots.push(spawned);
  return { destLotId: spawned.id, split: true };
}

function stayLine(lot: ItemLot, quantity: number, reason: StayReason, detail: string): StayLine {
  return {
    type: "stayed",
    text: `${stayHeadline(reason)} ${detail}`.trim(),
    lotId: lot.id,
    definitionId: lot.definitionId,
    name: lot.name,
    quantity,
    reason,
  };
}

function chooseStay(attempts: Attempt[], matched: boolean): { reason: StayReason; detail: string } {
  if (attempts.length === 0) {
    return {
      reason: "no-matching-rule",
      detail: matched
        ? "A rule matches, but it names no destination that can take this."
        : "No routing rule matches this, and no open container already holds it.",
    };
  }
  const rank: StayReason[] = [
    "not-owned",
    "not-visited",
    "not-nearby",
    "shared-not-established",
    "destination-deleted",
    "destination-missing",
    "destination-excluded",
    "no-automation-slot",
    "destination-full",
  ];
  let chosen = attempts[0];
  if (!chosen) return { reason: "no-matching-rule", detail: "Nothing could take it." };
  for (const reason of rank) {
    const hit = attempts.find((attempt) => attempt.reason === reason);
    if (hit) {
      chosen = hit;
      break;
    }
  }
  const detail = attempts.map((attempt) => attempt.detail).join(" ");
  return { reason: chosen.reason, detail };
}

function freshLot(pack: StorageContainer, lotId: string): ItemLot | undefined {
  return pack.lots.find((lot) => lot.id === lotId);
}

/**
 * Deposit matching materials from the pack.
 * Does not dismantle, sell, consume, donate, or change ownership.
 * Does not pull goods back out of containers, so a manual placement stays put.
 */
export function depositMatching(input: StorageWorld, request: DepositRequest): {
  world: StorageWorld;
  receipt: DepositReceipt;
} {
  if (!request.requestId) throw new Error("A deposit needs a request id.");
  assertShape(input);
  if (input.appliedRequestIds.includes(request.requestId)) {
    const quantity = totalQuantity(input);
    return {
      world: input,
      receipt: {
        requestId: request.requestId,
        repeated: true,
        interrupted: false,
        lines: [],
        movedQuantity: 0,
        stayedQuantity: 0,
        quantityBefore: quantity,
        quantityAfter: quantity,
        ownershipUnchanged: true,
      },
    };
  }

  const before = input;
  const world = cloneWorld(input);
  const quantityBefore = totalQuantity(world);
  const lines: Array<MoveLine | StayLine> = [];
  let moveCount = 0;
  let interrupted = false;
  const cap = request.interruptAfterMoves;
  const stopped = () => cap != null && moveCount >= cap;

  const plan = protections(world);
  const pack = () => packOf(world);

  for (const item of plan) {
    const original = freshLot(pack(), item.lotId);
    if (!original) throw new Error(`Pack lost ${item.lotId} before routing.`);

    if (!interrupted && item.movable > 0 && stopped()) interrupted = true;

    if (interrupted) {
      if (item.movable > 0) {
        lines.push(
          stayLine(
            original,
            item.movable,
            "interrupted",
            "The transfer stopped before this left the pack.",
          ),
        );
      }
      if (item.stayQuantity > 0 && item.stayReason) {
        lines.push(stayLine(original, item.stayQuantity, item.stayReason, reserveDetail(world, original)));
      }
      continue;
    }

    let remaining = item.movable;
    const attempts: Attempt[] = [];
    const seen = new Set<string>();
    let matched = false;
    const rules = [...world.profile.rules].sort(
      (a, b) => a.order - b.order || a.id.localeCompare(b.id),
    );

    for (const rule of rules) {
      if (remaining <= 0 || interrupted) break;
      const source = freshLot(pack(), item.lotId);
      if (!source || !ruleMatches(world, rule, source)) continue;
      matched = true;
      for (const destId of rule.destinationIds) {
        if (remaining <= 0 || interrupted) break;
        const sourceNow = freshLot(pack(), item.lotId);
        if (!sourceNow) break;
        const seenKey = `${destId}`;
        const destination = findContainer(world, destId);
        if (rule.onlyWherePresent && (!destination || !holdsDefinition(destination, sourceNow.definitionId))) {
          continue;
        }

        if (isExcluded(world, rule, sourceNow, destId)) {
          remember(attempts, seen, `${seenKey}:excluded`, {
            destId,
            reason: "destination-excluded",
            detail: blockPhrase(containerName(world, destId), "destination-excluded"),
          });
          continue;
        }

        const blocked = accessBlock(destination);
        if (blocked) {
          remember(attempts, seen, `${seenKey}:${blocked}`, {
            destId,
            reason: blocked,
            detail: blockPhrase(containerName(world, destId), blocked),
          });
          continue;
        }
        if (!destination) continue;

        while (remaining > 0 && !interrupted) {
          const placement = peekPlacement(destination, sourceNow, remaining, false);
          if (!placement) {
            const reason = roomBlock(destination, sourceNow, false);
            remember(attempts, seen, `${seenKey}:${reason}`, {
              destId,
              reason,
              detail: blockPhrase(destination.name, reason),
            });
            break;
          }
          if (stopped()) {
            interrupted = true;
            break;
          }
          request.beforeMove?.(world, {
            destinationId: destId,
            definitionId: sourceNow.definitionId,
            moveIndex: moveCount,
          });
          const afterHook = findContainer(world, destId);
          const hookedBlock = accessBlock(afterHook);
          if (hookedBlock || !afterHook) {
            const reason = hookedBlock ?? "destination-missing";
            remember(attempts, seen, `${seenKey}:${reason}:hook`, {
              destId,
              reason,
              detail: blockPhrase(containerName(world, destId), reason),
            });
            break;
          }
          const liveSource = freshLot(pack(), item.lotId);
          if (!liveSource) throw new Error("Source lot vanished.");
          const retry = peekPlacement(afterHook, liveSource, remaining, false);
          if (!retry) {
            const reason = roomBlock(afterHook, liveSource, false);
            remember(attempts, seen, `${seenKey}:${reason}:hook`, {
              destId,
              reason,
              detail: blockPhrase(afterHook.name, reason),
            });
            break;
          }
          const applied = applyPlacement(world, world.packId, liveSource.id, destId, retry);
          moveCount += 1;
          remaining -= retry.quantity;
          const prior = attempts.map((attempt) => attempt.detail);
          attempts.length = 0;
          seen.clear();
          lines.push({
            type: "moved",
            text: describeMove(retry.quantity, liveSource.name, afterHook.name, rule.name, prior),
            sourceLotId: item.lotId,
            destLotId: applied.destLotId,
            definitionId: liveSource.definitionId,
            name: liveSource.name,
            quantity: retry.quantity,
            fromId: world.packId,
            toId: destId,
            toName: afterHook.name,
            ruleId: rule.id,
            ruleName: rule.name,
            split: applied.split,
          });
        }
      }
    }

    const stillHere = freshLot(pack(), item.lotId);
    if (interrupted && remaining > 0 && stillHere) {
      lines.push(
        stayLine(stillHere, remaining, "interrupted", "The transfer stopped before this left the pack."),
      );
    } else if (remaining > 0 && stillHere) {
      const stay = chooseStay(attempts, matched);
      lines.push(stayLine(stillHere, remaining, stay.reason, stay.detail));
    }
    if (item.stayQuantity > 0 && item.stayReason) {
      const anchor = freshLot(pack(), item.lotId) ?? original;
      lines.push(stayLine(anchor, item.stayQuantity, item.stayReason, reserveDetail(world, original)));
    }
  }

  world.appliedRequestIds = [...world.appliedRequestIds, request.requestId];
  assertConserved(before, world);

  const movedQuantity = lines.reduce(
    (sum, line) => (line.type === "moved" ? sum + line.quantity : sum),
    0,
  );
  const stayedQuantity = lines.reduce(
    (sum, line) => (line.type === "stayed" ? sum + line.quantity : sum),
    0,
  );
  return {
    world,
    receipt: {
      requestId: request.requestId,
      repeated: false,
      interrupted,
      lines,
      movedQuantity,
      stayedQuantity,
      quantityBefore,
      quantityAfter: totalQuantity(world),
      ownershipUnchanged: true,
    },
  };
}

function remember(attempts: Attempt[], seen: Set<string>, key: string, attempt: Attempt) {
  if (seen.has(key)) return;
  seen.add(key);
  attempts.push(attempt);
}

function reserveDetail(world: StorageWorld, lot: ItemLot): string {
  if (lot.equipped) return "Take it off before a deposit can store it.";
  if (lot.favorite) return "Deposit will not clear a favorite.";
  const reserve = world.profile.reserves.find((item) => item.definitionId === lot.definitionId);
  if (reserve) return `The pack keeps ${reserve.keepInPack} ${lot.name.toLowerCase()}.`;
  return "The pack keeps a reserved amount.";
}

/**
 * Manual placement. Atomic: either the whole quantity moves, or nothing does.
 * Never starts a deposit, so automation cannot immediately undo it.
 */
export function placeManual(input: StorageWorld, request: ManualPlaceRequest): ManualResult {
  assertShape(input);
  if (request.fromId === request.toId) {
    return { ok: true, world: input, detail: "Already in that container." };
  }
  if (!Number.isInteger(request.quantity) || request.quantity < 1) {
    return { ok: false, world: input, detail: "Choose a whole amount to move." };
  }

  const from = findContainer(input, request.fromId);
  const lot = from?.lots.find((item) => item.id === request.lotId);
  if (!from || !lot) {
    return { ok: false, world: input, detail: "That item is not in the container you named." };
  }
  if (lot.quantity < request.quantity) {
    return { ok: false, world: input, detail: "There are not that many to move." };
  }
  if (lot.equipped) {
    return { ok: false, world: input, detail: "Unequip it before moving it." };
  }
  if (lot.kind === "unique" && request.quantity !== 1) {
    return { ok: false, world: input, detail: "A unique item moves whole." };
  }

  if (from.kind !== "pack") {
    const blocked = accessBlock(from);
    if (blocked) {
      return {
        ok: false,
        world: input,
        detail: blockPhrase(from.name, blocked),
      };
    }
  }

  const to = findContainer(input, request.toId);
  if (request.toId !== input.packId) {
    const blocked = accessBlock(to);
    if (blocked || !to) {
      return {
        ok: false,
        world: input,
        detail: blockPhrase(to?.name ?? request.toId, blocked ?? "destination-missing"),
      };
    }
  }
  if (!to) return { ok: false, world: input, detail: "That container is not here." };

  if (placementRoom(to, lot, true) < request.quantity) {
    const reason = roomBlock(to, lot, true);
    return { ok: false, world: input, detail: blockPhrase(to.name, reason) };
  }

  const world = cloneWorld(input);
  let left = request.quantity;
  while (left > 0) {
    const dest = findContainer(world, request.toId);
    const source = findContainer(world, request.fromId)?.lots.find((item) => item.id === request.lotId);
    if (!dest || !source) throw new Error("Manual placement lost a container.");
    const placement = peekPlacement(dest, source, left, true);
    if (!placement) throw new Error("Manual room vanished.");
    applyPlacement(world, request.fromId, request.lotId, request.toId, placement);
    left -= placement.quantity;
  }
  assertConserved(input, world);
  const name = lot.name;
  return {
    ok: true,
    world,
    detail: `Placed ${request.quantity} ${name} in ${to.name}. Deposit will not pull it back.`,
  };
}

export function serializeWorld(world: StorageWorld): string {
  assertShape(world);
  const envelope: SaveEnvelope = { schema: 1, world };
  return JSON.stringify(envelope);
}

export function hydrateWorld(raw: string): StorageWorld {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Save could not be read.");
  }
  if (!parsed || typeof parsed !== "object" || !("schema" in parsed) || !("world" in parsed)) {
    throw new Error("Save is not a storage snapshot.");
  }
  const envelope = parsed as SaveEnvelope;
  if (envelope.schema !== 1) throw new Error("Save is from another storage version.");
  const world = cloneWorld(envelope.world);
  validateWorld(world);
  return world;
}
