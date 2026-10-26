import { acceptConfirm, CONTROLS } from "./actions.ts";
import { defOf } from "./catalog.ts";
import { exclusionFor } from "./protections.ts";
import type {
  ActionKind,
  ActionRequest,
  BuybackRequest,
  ContainerId,
  EquipSlot,
  Execution,
  ExtendedAction,
  Fingerprint,
  Instance,
  JournalEntry,
  JournalLine,
  OutputGrant,
  Preview,
  PreviewOutput,
  Provenance,
  Receipt,
  RejectReason,
  Restoration,
  UndoReason,
  UndoVerdict,
  World,
} from "./types.ts";
import { cloneWorld, occupancy } from "./world.ts";

/**
 * Transaction wrapper around the existing batch primitives (split, relocate,
 * archive). Preview, commit, buyback, and undo all enter through here.
 * Undo never mints a second copy of an item, a mark, or a salvage lot.
 */

interface SplitStep {
  parentId: string;
  quantity: number;
  to: ContainerId;
  event: string;
}

interface RelocateStep {
  id: string;
  to: ContainerId;
  equip: EquipSlot | null;
  event: string;
}

interface ArchiveStep {
  id: string;
  event: string;
}

interface DropStep {
  id: string;
  quantity: number;
  event: string;
}

interface OutputStep {
  defId: string;
  quantity: number;
  containerId: ContainerId;
  sourceId: string;
}

interface Plan {
  preview: Preview;
  splits: SplitStep[];
  relocations: RelocateStep[];
  archives: ArchiveStep[];
  drops: DropStep[];
  outputSteps: OutputStep[];
  seal: boolean;
}

function emptyPreview(action: ActionKind, revision: number, destinationId: ContainerId | null): Preview {
  return {
    ok: false,
    action,
    lines: [],
    exclusions: [],
    outputs: [],
    currencyDelta: { gold: 0, reputation: 0 },
    undoPolicy: CONTROLS[action].undoPolicy,
    outlookKey: `outlook.${action}`,
    summaryKey: `summary.${action}`,
    summaryParams: {},
    errors: [],
    revision,
    destinationId,
  };
}

function stamp(inst: Instance, tick: number, kind: string, detailKey: string, params: Record<string, string | number>): Instance {
  const event = { at: tick, kind, detailKey, params };
  return {
    ...inst,
    provenance: {
      ...inst.provenance,
      chain: [...inst.provenance.chain, event],
    },
  };
}

function fingerprintOf(inst: Instance, role: Fingerprint["role"]): Fingerprint {
  return {
    role,
    instanceId: inst.id,
    containerId: inst.containerId,
    quantity: inst.quantity,
    archived: inst.archived,
    equipSlot: inst.equipSlot,
    serial: inst.provenance.serial,
    provenanceLength: inst.provenance.chain.length,
  };
}

function requestedDestination(action: ActionKind, requested: ContainerId | undefined): ContainerId | null {
  if (action === "sell") return "vendor";
  if (action === "discard") return "void";
  if (action === "move" || action === "restore") return requested ?? null;
  return null;
}

function destinationDisguised(action: ActionKind, requested: ContainerId | undefined): boolean {
  if (action === "move") return requested === "vendor" || requested === "void";
  if (action === "sell") return requested !== undefined && requested !== "vendor";
  if (action === "discard") return requested !== undefined && requested !== "void";
  if (action === "donate" || action === "dismantle") return requested !== undefined;
  return false;
}

export function preview(world: World, req: ActionRequest): Preview {
  return buildPlan(world, req).preview;
}

function buildPlan(world: World, req: ActionRequest): Plan {
  const destinationId = requestedDestination(req.action, req.destinationId);
  const previewResult = emptyPreview(req.action, world.revision, destinationId);
  const plan: Plan = {
    preview: previewResult,
    splits: [],
    relocations: [],
    archives: [],
    drops: [],
    outputSteps: [],
    seal: req.action === "donate",
  };

  if (req.lines.length === 0) previewResult.errors.push("empty-selection");
  const seen = new Set<string>();
  for (const line of req.lines) {
    if (seen.has(line.instanceId)) {
      previewResult.errors.push("duplicate-line");
      continue;
    }
    seen.add(line.instanceId);
  }
  if (destinationDisguised(req.action, req.destinationId) || ((req.action === "move" || req.action === "restore") && !destinationId)) {
    previewResult.errors.push("wrong-destination");
  }

  const occ = occupancy(world);
  const slots: Record<EquipSlot, string | null> = { body: null, tool: null };
  for (const inst of Object.values(world.instances)) {
    if (!inst.archived && inst.equipSlot) slots[inst.equipSlot] = inst.id;
  }

  let count = 0;
  let gold = 0;
  let rep = 0;
  const outputMap = new Map<string, PreviewOutput>();

  for (const line of req.lines) {
    const inst = world.instances[line.instanceId];
    if (!inst) {
      previewResult.errors.push("unknown-instance");
      continue;
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      previewResult.errors.push("quantity-invalid");
      continue;
    }
    if (line.quantity > inst.quantity) {
      previewResult.errors.push("insufficient-quantity");
      continue;
    }
    const def = defOf(inst.defId);
    if (line.quantity < inst.quantity && !def.partial) {
      previewResult.errors.push("quantity-not-partial");
      continue;
    }
    const code = destinationId
      ? exclusionFor(inst, req.action, destinationId)
      : exclusionFor(inst, req.action, undefined);
    if (code && !(req.action === "move" && !destinationId && code === "wrong-container")) {
      previewResult.exclusions.push({ instanceId: inst.id, code, defId: inst.defId });
      continue;
    }
    if (previewResult.errors.includes("wrong-destination")) continue;

    const from = inst.containerId;
    const whole = line.quantity === inst.quantity;
    count += line.quantity;

    if (req.action === "sell") {
      gold += def.sellEach * line.quantity;
      if (whole) plan.relocations.push({ id: inst.id, to: "vendor", equip: null, event: "sold" });
      else plan.splits.push({ parentId: inst.id, quantity: line.quantity, to: "vendor", event: "sold" });
    } else if (req.action === "move" && destinationId) {
      const equip = destinationId === "equipped" ? def.equipSlot : null;
      if (whole) plan.relocations.push({ id: inst.id, to: destinationId, equip, event: equip ? "equipped" : from === "equipped" ? "unequipped" : "moved" });
      else plan.splits.push({ parentId: inst.id, quantity: line.quantity, to: destinationId, event: "moved" });
    } else if (req.action === "discard") {
      if (whole) plan.relocations.push({ id: inst.id, to: "void", equip: null, event: "discarded" });
      else plan.splits.push({ parentId: inst.id, quantity: line.quantity, to: "void", event: "discarded" });
    } else if (req.action === "restore" && destinationId) {
      if (whole) plan.relocations.push({ id: inst.id, to: destinationId, equip: null, event: "restored" });
      else plan.splits.push({ parentId: inst.id, quantity: line.quantity, to: destinationId, event: "restored" });
    } else if (req.action === "donate") {
      rep += def.donateEach * line.quantity;
      if (whole) plan.archives.push({ id: inst.id, event: "donated" });
      else plan.drops.push({ id: inst.id, quantity: line.quantity, event: "donated" });
    } else if (req.action === "dismantle") {
      if (whole) plan.archives.push({ id: inst.id, event: "dismantled" });
      else plan.drops.push({ id: inst.id, quantity: line.quantity, event: "dismantled" });
      const outContainer = from;
      if (outContainer && outContainer !== "vendor" && outContainer !== "void" && outContainer !== "equipped") {
        for (const part of def.salvage) {
          plan.outputSteps.push({
            defId: part.defId,
            quantity: part.quantity * line.quantity,
            containerId: outContainer,
            sourceId: inst.id,
          });
        }
      }
    }

    previewResult.lines.push({
      instanceId: inst.id,
      defId: inst.defId,
      serial: inst.provenance.serial,
      quantity: line.quantity,
      from,
      to: req.action === "donate" || req.action === "dismantle" ? null : destinationId,
      originKey: inst.provenance.originKey,
    });
  }

  if (previewResult.exclusions.length > 0) previewResult.errors.push("excluded");

  const leaving = new Set<string>([
    ...plan.relocations.map((step) => step.id),
    ...plan.archives.map((step) => step.id),
  ]);

  for (const rel of plan.relocations) {
    const inst = world.instances[rel.id];
    if (!inst?.containerId) continue;
    if (inst.containerId !== rel.to) {
      occ[inst.containerId] -= 1;
      occ[rel.to] += 1;
    }
    if (inst.equipSlot && slots[inst.equipSlot] === inst.id) slots[inst.equipSlot] = null;
    if (rel.equip) {
      const holder = slots[rel.equip];
      if (holder && holder !== inst.id && !leaving.has(holder)) previewResult.errors.push("slot-taken");
      else slots[rel.equip] = inst.id;
    }
  }
  for (const split of plan.splits) occ[split.to] += 1;
  for (const archived of plan.archives) {
    const inst = world.instances[archived.id];
    if (inst?.containerId) occ[inst.containerId] -= 1;
    if (inst?.equipSlot && slots[inst.equipSlot] === inst.id) slots[inst.equipSlot] = null;
  }
  for (const output of plan.outputSteps) {
    const key = `${output.containerId}:${output.defId}`;
    const existing = outputMap.get(key);
    if (existing) existing.quantity += output.quantity;
    else outputMap.set(key, { defId: output.defId, quantity: output.quantity });
    if (!plan.outputSteps.some((other) => other !== output && other.containerId === output.containerId && other.defId === output.defId && plan.outputSteps.indexOf(other) < plan.outputSteps.indexOf(output))) {
      occ[output.containerId] += 1;
    }
  }

  for (const container of Object.keys(occ) as ContainerId[]) {
    if (occ[container] > world.capacity[container]) previewResult.errors.push("destination-full");
  }

  previewResult.outputs = [...outputMap.values()];
  previewResult.currencyDelta = { gold, reputation: rep };
  const summaryParams: Record<string, string | number> = { count };
  if (destinationId) summaryParams.dest = destinationId;
  if (gold) summaryParams.gold = gold;
  if (rep) summaryParams.rep = rep;
  previewResult.summaryParams = summaryParams;
  previewResult.ok = previewResult.errors.length === 0 && previewResult.lines.length > 0;
  return plan;
}

function detailKeyFor(event: string): string {
  if (event === "sold") return "event.sold";
  if (event === "moved") return "event.moved";
  if (event === "unequipped") return "event.unequipped";
  if (event === "equipped") return "event.equipped";
  if (event === "discarded") return "event.discarded";
  if (event === "restored") return "event.restored";
  if (event === "donated") return "event.donated";
  if (event === "dismantled") return "event.dismantled";
  return "event.moved";
}

function applyPlan(world: World, req: ActionRequest, plan: Plan): { world: World; entry: JournalEntry } {
  const next = cloneWorld(world);
  next.tick += 1;
  next.revision += 1;
  const journalId = `jnl-${next.nextId}`;
  next.nextId += 1;
  const lines: JournalLine[] = [];
  const outputs: OutputGrant[] = [];
  const fingerprints: Fingerprint[] = [];
  const restorations: Restoration[] = [];

  for (const split of plan.splits) {
    const parent = next.instances[split.parentId];
    if (!parent) throw new Error("split parent missing");
    parent.quantity -= split.quantity;
    const childId = `inst-${next.nextId}`;
    next.nextId += 1;
    const provenance: Provenance = {
      originKey: parent.provenance.originKey,
      originParams: { ...parent.provenance.originParams },
      serial: null,
      chain: [
        ...parent.provenance.chain,
        {
          at: next.tick,
          kind: "split-from",
          detailKey: "event.split-from",
          params: { parentId: parent.id, quantity: split.quantity },
        },
        {
          at: next.tick,
          kind: split.event,
          detailKey: detailKeyFor(split.event),
          params: { quantity: split.quantity },
        },
      ],
    };
    const child: Instance = {
      id: childId,
      defId: parent.defId,
      quantity: split.quantity,
      containerId: split.to,
      equipSlot: null,
      provenance,
      reservationId: parent.reservationId,
      questId: parent.questId,
      parentId: parent.id,
      lotJournalId: journalId,
      archived: false,
    };
    next.instances[childId] = child;
    lines.push({
      instanceId: childId,
      defId: child.defId,
      serial: null,
      quantity: split.quantity,
      from: parent.containerId,
      to: split.to,
      equipSlotBefore: null,
      equipSlotAfter: null,
      created: true,
      parentId: parent.id,
    });
    fingerprints.push(fingerprintOf(child, "output"));
    restorations.push({
      instanceId: parent.id,
      addQuantity: split.quantity,
      unarchive: false,
      containerId: null,
      equipSlot: null,
    });
  }

  for (const rel of plan.relocations) {
    const current = next.instances[rel.id];
    if (!current) throw new Error("relocate missing");
    const from = current.containerId;
    const equipBefore = current.equipSlot;
    let moved: Instance = {
      ...current,
      containerId: rel.to,
      equipSlot: rel.equip,
    };
    moved = stamp(moved, next.tick, rel.event, detailKeyFor(rel.event), { quantity: moved.quantity });
    next.instances[rel.id] = moved;
    lines.push({
      instanceId: rel.id,
      defId: moved.defId,
      serial: moved.provenance.serial,
      quantity: moved.quantity,
      from,
      to: rel.to,
      equipSlotBefore: equipBefore,
      equipSlotAfter: rel.equip,
      created: false,
      parentId: moved.parentId,
    });
    fingerprints.push(fingerprintOf(moved, "placed"));
    restorations.push({
      instanceId: rel.id,
      addQuantity: 0,
      unarchive: false,
      containerId: from,
      equipSlot: equipBefore,
    });
  }

  for (const drop of plan.drops) {
    const current = next.instances[drop.id];
    if (!current) throw new Error("drop missing");
    const kept: Instance = { ...current, quantity: current.quantity - drop.quantity };
    next.instances[drop.id] = kept;
    if (req.action === "donate") {
      const childId = `inst-${next.nextId}`;
      next.nextId += 1;
      let donated: Instance = {
        ...current,
        id: childId,
        quantity: drop.quantity,
        containerId: null,
        equipSlot: null,
        parentId: current.id,
        lotJournalId: journalId,
        archived: true,
        provenance: {
          ...current.provenance,
          chain: [...current.provenance.chain],
        },
      };
      donated = stamp(donated, next.tick, "donated", "event.donated", { quantity: drop.quantity });
      next.instances[childId] = donated;
      lines.push({
        instanceId: childId,
        defId: donated.defId,
        serial: donated.provenance.serial,
        quantity: drop.quantity,
        from: current.containerId,
        to: null,
        equipSlotBefore: null,
        equipSlotAfter: null,
        created: true,
        parentId: current.id,
      });
    } else {
      lines.push({
        instanceId: drop.id,
        defId: current.defId,
        serial: current.provenance.serial,
        quantity: drop.quantity,
        from: current.containerId,
        to: null,
        equipSlotBefore: current.equipSlot,
        equipSlotAfter: current.equipSlot,
        created: false,
        parentId: current.parentId,
      });
      restorations.push({
        instanceId: drop.id,
        addQuantity: drop.quantity,
        unarchive: false,
        containerId: null,
        equipSlot: null,
      });
    }
  }

  for (const archived of plan.archives) {
    const current = next.instances[archived.id];
    if (!current) throw new Error("archive missing");
    const from = current.containerId;
    const equipBefore = current.equipSlot;
    let gone: Instance = {
      ...current,
      archived: true,
      containerId: null,
      equipSlot: null,
    };
    gone = stamp(gone, next.tick, archived.event, detailKeyFor(archived.event), { quantity: gone.quantity });
    next.instances[archived.id] = gone;
    lines.push({
      instanceId: archived.id,
      defId: gone.defId,
      serial: gone.provenance.serial,
      quantity: gone.quantity,
      from,
      to: null,
      equipSlotBefore: equipBefore,
      equipSlotAfter: null,
      created: false,
      parentId: gone.parentId,
    });
    if (req.action === "dismantle") {
      fingerprints.push(fingerprintOf(gone, "archived-source"));
      restorations.push({
        instanceId: archived.id,
        addQuantity: gone.quantity,
        unarchive: true,
        containerId: from,
        equipSlot: equipBefore,
      });
    }
  }

  const grouped = new Map<string, OutputStep & { quantity: number; sources: string[] }>();
  for (const output of plan.outputSteps) {
    const key = `${output.containerId}:${output.defId}`;
    const found = grouped.get(key);
    if (found) {
      found.quantity += output.quantity;
      found.sources.push(output.sourceId);
    } else grouped.set(key, { ...output, sources: [output.sourceId] });
  }
  for (const output of grouped.values()) {
    const source = next.instances[output.sourceId];
    const id = `inst-${next.nextId}`;
    next.nextId += 1;
    const nameKey = source ? defOf(source.defId).nameKey : output.defId;
    let lot: Instance = {
      id,
      defId: output.defId,
      quantity: output.quantity,
      containerId: output.containerId,
      equipSlot: null,
      provenance: {
        originKey: "origin.salvage",
        originParams: { name: nameKey, serial: source?.provenance.serial ?? "" },
        serial: null,
        chain: [],
      },
      reservationId: null,
      questId: null,
      parentId: output.sourceId,
      lotJournalId: journalId,
      archived: false,
    };
    lot = stamp(lot, next.tick, "salvaged-from", "event.salvaged-from", {
      sourceId: output.sourceId,
      quantity: output.quantity,
    });
    next.instances[id] = lot;
    outputs.push({ instanceId: id, defId: output.defId, quantity: output.quantity, containerId: output.containerId });
    fingerprints.push(fingerprintOf(lot, "output"));
  }

  next.currency = {
    gold: next.currency.gold + plan.preview.currencyDelta.gold,
    reputation: next.currency.reputation + plan.preview.currencyDelta.reputation,
  };

  let sealId: string | null = null;
  if (plan.seal) {
    sealId = `seal-${journalId}`;
    next.seals.push({
      id: sealId,
      journalId,
      chapterKey: "chapter.road",
      instanceIds: lines.map((line) => line.instanceId),
      reputation: plan.preview.currencyDelta.reputation,
    });
  }

  const entry: JournalEntry = {
    id: journalId,
    tick: next.tick,
    action: req.action,
    token: req.token,
    reversalOf: null,
    buybackOf: null,
    revisionBefore: world.revision,
    revisionAfter: next.revision,
    lines,
    outputs,
    currencyDelta: plan.preview.currencyDelta,
    sealId,
    summaryKey: plan.preview.summaryKey,
    summaryParams: plan.preview.summaryParams,
    undoPolicy: CONTROLS[req.action].undoPolicy,
    fingerprints,
    restorations: req.action === "donate" ? [] : restorations,
    reversedBy: null,
  };
  next.journal.push(entry);
  return { world: next, entry };
}

function verdict(reason: UndoReason, params: Record<string, string | number> = {}): UndoVerdict {
  return { available: reason === "available" || reason === "buyback-available", reason, detailKey: `reason.${reason}`, params };
}

function activeBuyback(world: World, saleId: string): JournalEntry | undefined {
  return world.journal.find((entry) => entry.action === "buyback" && entry.buybackOf === saleId && !entry.reversedBy);
}

function slotsNow(world: World): Record<EquipSlot, string | null> {
  const slots: Record<EquipSlot, string | null> = { body: null, tool: null };
  for (const inst of Object.values(world.instances)) {
    if (!inst.archived && inst.equipSlot) slots[inst.equipSlot] = inst.id;
  }
  return slots;
}

function roomProblem(world: World, entry: JournalEntry): UndoReason | null {
  const occ = occupancy(world);
  const slots = slotsNow(world);
  const doomed = entry.fingerprints.filter((fp) => fp.role === "output").map((fp) => fp.instanceId);
  for (const id of doomed) {
    const inst = world.instances[id];
    if (inst && !inst.archived && inst.containerId) occ[inst.containerId] -= 1;
    if (inst?.equipSlot && slots[inst.equipSlot] === inst.id) slots[inst.equipSlot] = null;
  }
  for (const restoration of entry.restorations) {
    const inst = world.instances[restoration.instanceId];
    if (!inst) return "dependency-changed";
    if (restoration.unarchive) {
      if (!restoration.containerId) return "dependency-changed";
      if (restoration.equipSlot) {
        const holder = slots[restoration.equipSlot];
        if (holder && holder !== inst.id) return "slot-taken";
        slots[restoration.equipSlot] = inst.id;
      }
      if (occ[restoration.containerId] + 1 > world.capacity[restoration.containerId]) return "origin-full";
      occ[restoration.containerId] += 1;
      continue;
    }
    if (restoration.addQuantity > 0 && restoration.containerId === null) {
      if (inst.archived) return "dependency-changed";
      continue;
    }
    if (inst.containerId && !inst.archived) occ[inst.containerId] -= 1;
    if (inst.equipSlot && slots[inst.equipSlot] === inst.id) slots[inst.equipSlot] = null;
    if (!restoration.containerId) return "dependency-changed";
    if (restoration.equipSlot) {
      const holder = slots[restoration.equipSlot];
      if (holder && holder !== inst.id) return "slot-taken";
      slots[restoration.equipSlot] = inst.id;
    }
    if (occ[restoration.containerId] + 1 > world.capacity[restoration.containerId]) return "origin-full";
    occ[restoration.containerId] += 1;
  }
  return null;
}

function mismatch(world: World, entry: JournalEntry): UndoVerdict | null {
  for (const fp of entry.fingerprints) {
    const inst = world.instances[fp.instanceId];
    if (!inst) {
      return verdict(entry.action === "discard" ? "void-released" : "dependency-changed");
    }
    if (inst.provenance.serial !== fp.serial) return verdict("identity-mismatch");
    const same =
      inst.containerId === fp.containerId &&
      inst.quantity === fp.quantity &&
      inst.archived === fp.archived &&
      inst.equipSlot === fp.equipSlot &&
      inst.provenance.chain.length === fp.provenanceLength;
    if (same) continue;
    if (fp.role === "output") {
      if (entry.action === "dismantle") {
        if (!inst.archived && inst.containerId && inst.containerId !== fp.containerId) return verdict("outputs-moved");
        return verdict("outputs-consumed");
      }
      if (entry.action === "discard") return verdict("void-released");
      return verdict("dependency-changed");
    }
    if (entry.action === "discard" && (inst.archived || inst.containerId !== "void")) return verdict("void-released");
    if (inst.containerId !== fp.containerId || inst.archived !== fp.archived) return verdict("destination-diverged");
    return verdict("dependency-changed");
  }
  return null;
}

export function evaluateBuyback(world: World, entry: JournalEntry): UndoVerdict {
  const gold = entry.currencyDelta.gold;
  if (entry.action !== "sell" || entry.reversalOf) return verdict("no-such-entry");
  if (entry.reversedBy || activeBuyback(world, entry.id)) return verdict("already-reversed", { gold });
  for (const fp of entry.fingerprints) {
    const inst = world.instances[fp.instanceId];
    if (!inst || inst.archived || inst.containerId !== "vendor") return verdict("buyback-vendor-released", { gold });
    if (inst.provenance.serial !== fp.serial) return verdict("identity-mismatch", { gold });
    if (inst.quantity !== fp.quantity || inst.provenance.chain.length !== fp.provenanceLength || inst.equipSlot !== fp.equipSlot) {
      return verdict("dependency-changed", { gold });
    }
  }
  if (world.currency.gold < gold) return verdict("buyback-currency-short", { gold });
  const occ = occupancy(world);
  for (const line of entry.lines) {
    const inst = world.instances[line.instanceId];
    if (!inst) return verdict("buyback-vendor-released", { gold });
    const dest = line.from;
    if (!dest) return verdict("origin-full", { gold });
    if (inst.containerId) occ[inst.containerId] -= 1;
    if (occ[dest] + 1 > world.capacity[dest]) return verdict("origin-full", { gold });
    occ[dest] += 1;
  }
  return verdict("buyback-available", { gold });
}

export function evaluateUndo(world: World, journalId: string): UndoVerdict {
  const entry = world.journal.find((item) => item.id === journalId);
  if (!entry) return verdict("no-such-entry");
  if (entry.reversedBy) return verdict("already-reversed");
  if (entry.reversalOf) return verdict("action-not-reversible");
  if (entry.undoPolicy === "never") {
    return verdict("external-seal", { seal: entry.sealId ?? "" });
  }
  if (entry.undoPolicy === "buyback-only") {
    const report = verdict("sell-requires-buyback", { gold: entry.currencyDelta.gold });
    report.available = false;
    report.buyback = evaluateBuyback(world, entry);
    return report;
  }
  const failed = mismatch(world, entry);
  if (failed) return failed;
  const room = roomProblem(world, entry);
  if (room) return verdict(room);
  const nextGold = world.currency.gold - entry.currencyDelta.gold;
  const nextRep = world.currency.reputation - entry.currencyDelta.reputation;
  if (nextGold < 0 || nextRep < 0) return verdict("dependency-changed");
  return verdict("available");
}

function storedDuplicate(world: World, token: string): Execution | null {
  const existing = world.receipts[token];
  if (!existing) return null;
  return { world, receipt: { ...existing, status: "duplicate" } };
}

function reject(
  world: World,
  token: string,
  action: ExtendedAction | null,
  reason: RejectReason | UndoReason,
  store: boolean,
): Execution {
  const receipt: Receipt = {
    status: "rejected",
    token,
    action,
    journalId: null,
    reason,
    summaryKey: "summary.rejected",
    summaryParams: {},
  };
  if (!store) return { world, receipt };
  const next = cloneWorld(world);
  next.receipts[token] = receipt;
  return { world: next, receipt };
}

function confirmProblem(req: ActionRequest): RejectReason | null {
  const result = acceptConfirm(req.action, req.confirm, req.locale, req.phrase);
  if (result.ok || result.reason === "ok") return null;
  return result.reason;
}

function legalityProblem(world: World, req: ActionRequest): RejectReason | null {
  if (req.expectedRevision !== world.revision) return "inventory-changed";
  const plan = buildPlan(world, req);
  if (!plan.preview.ok) return (plan.preview.errors[0] as RejectReason) ?? "excluded";
  return null;
}

export function begin(world: World, req: ActionRequest): Execution {
  if (!req.token) return reject(world, "", req.action, "token-required", false);
  const duplicate = storedDuplicate(world, req.token);
  if (duplicate) return duplicate;
  if (world.inflight[req.token]) return reject(world, req.token, req.action, "already-in-flight", false);
  const confirm = confirmProblem(req);
  if (confirm) return reject(world, req.token, req.action, confirm, true);
  const legal = legalityProblem(world, req);
  if (legal) return reject(world, req.token, req.action, legal, true);
  const next = cloneWorld(world);
  next.inflight[req.token] = { request: req, kind: "action" };
  return {
    world: next,
    receipt: {
      status: "pending",
      token: req.token,
      action: req.action,
      journalId: null,
      reason: null,
      summaryKey: "summary.rejected",
      summaryParams: {},
    },
  };
}

export function settle(world: World, token: string): Execution {
  if (!token) return reject(world, "", null, "token-required", false);
  const duplicate = storedDuplicate(world, token);
  if (duplicate) return duplicate;
  const flight = world.inflight[token];
  if (!flight || flight.kind !== "action") return reject(world, token, null, "no-such-entry", false);
  const req = flight.request as ActionRequest;
  const legal = legalityProblem(world, req);
  if (legal) {
    const next = cloneWorld(world);
    delete next.inflight[token];
    return reject(next, token, req.action, legal, true);
  }
  const plan = buildPlan(world, req);
  const applied = applyPlan(world, req, plan);
  delete applied.world.inflight[token];
  const receipt: Receipt = {
    status: "applied",
    token,
    action: req.action,
    journalId: applied.entry.id,
    reason: null,
    summaryKey: applied.entry.summaryKey,
    summaryParams: applied.entry.summaryParams,
  };
  applied.world.receipts[token] = receipt;
  return { world: applied.world, receipt };
}

export function abort(world: World, token: string): Execution {
  if (!token) return reject(world, "", null, "token-required", false);
  const duplicate = storedDuplicate(world, token);
  if (duplicate) return duplicate;
  if (!world.inflight[token]) return reject(world, token, null, "no-such-entry", false);
  const next = cloneWorld(world);
  const flight = next.inflight[token];
  delete next.inflight[token];
  next.notes.push({ tick: next.tick, key: "note.abort", params: {} });
  const receipt: Receipt = {
    status: "aborted",
    token,
    action: flight?.kind === "action" ? (flight.request as ActionRequest).action : "buyback",
    journalId: null,
    reason: null,
    summaryKey: "note.abort",
    summaryParams: {},
  };
  next.receipts[token] = receipt;
  return { world: next, receipt };
}

/** Atomic commit. A repeated token returns the original receipt and does not apply again. */
export function commit(world: World, req: ActionRequest): Execution {
  if (!req.token) return reject(world, "", req.action, "token-required", false);
  if (world.receipts[req.token]) return storedDuplicate(world, req.token)!;
  if (world.inflight[req.token]) return reject(world, req.token, req.action, "already-in-flight", false);
  const pending = begin(world, req);
  if (pending.receipt.status !== "pending") return pending;
  return settle(pending.world, req.token);
}

function applyUndo(world: World, entry: JournalEntry, token: string): Execution {
  const next = cloneWorld(world);
  next.tick += 1;
  next.revision += 1;
  const journalId = `jnl-${next.nextId}`;
  next.nextId += 1;
  for (const fp of entry.fingerprints) {
    if (fp.role !== "output") continue;
    const current = next.instances[fp.instanceId];
    if (!current) continue;
    let archived = stamp(current, next.tick, "undo", "event.undo", { of: entry.id });
    archived = { ...archived, archived: true, containerId: null, equipSlot: null };
    next.instances[fp.instanceId] = archived;
  }
  for (const restoration of entry.restorations) {
    const current = next.instances[restoration.instanceId];
    if (!current) continue;
    let restored = { ...current };
    if (restoration.unarchive) {
      restored.archived = false;
      restored.quantity = restoration.addQuantity;
      restored.containerId = restoration.containerId;
      restored.equipSlot = restoration.equipSlot;
    } else if (restoration.addQuantity > 0 && restoration.containerId === null) {
      restored.quantity += restoration.addQuantity;
      restored = stamp(restored, next.tick, "rejoined", "event.rejoined", { quantity: restoration.addQuantity });
    } else if (entry.action === "buyback") {
      const chain = restored.provenance.chain;
      const popped = chain.at(-1)?.kind === "bought-back" ? chain.slice(0, -1) : chain;
      restored = {
        ...restored,
        containerId: restoration.containerId,
        equipSlot: null,
        provenance: { ...restored.provenance, chain: popped },
      };
    } else {
      restored.containerId = restoration.containerId;
      restored.equipSlot = restoration.equipSlot;
      restored = stamp(restored, next.tick, "undo", "event.undo", { of: entry.id });
    }
    if (restoration.unarchive) {
      restored = stamp(restored, next.tick, "undo", "event.undo", { of: entry.id });
    }
    next.instances[restoration.instanceId] = restored;
  }
  next.currency = {
    gold: next.currency.gold - entry.currencyDelta.gold,
    reputation: next.currency.reputation - entry.currencyDelta.reputation,
  };
  const undoEntry: JournalEntry = {
    id: journalId,
    tick: next.tick,
    action: entry.action,
    token,
    reversalOf: entry.id,
    buybackOf: null,
    revisionBefore: world.revision,
    revisionAfter: next.revision,
    lines: entry.lines,
    outputs: [],
    currencyDelta: {
      gold: -entry.currencyDelta.gold,
      reputation: -entry.currencyDelta.reputation,
    },
    sealId: null,
    summaryKey: "summary.undo",
    summaryParams: { ...entry.summaryParams, priorKey: entry.summaryKey },
    undoPolicy: "never",
    fingerprints: [],
    restorations: [],
    reversedBy: null,
  };
  const original = next.journal.find((item) => item.id === entry.id);
  if (original) original.reversedBy = journalId;
  next.journal.push(undoEntry);
  const receipt: Receipt = {
    status: "applied",
    token,
    action: entry.action,
    journalId,
    reason: null,
    summaryKey: undoEntry.summaryKey,
    summaryParams: undoEntry.summaryParams,
  };
  next.receipts[token] = receipt;
  return { world: next, receipt, verdict: verdict("available") };
}

export function undo(world: World, journalId: string, token: string): Execution {
  if (!token) return reject(world, "", null, "token-required", false);
  const duplicate = storedDuplicate(world, token);
  if (duplicate) return { ...duplicate, verdict: evaluateUndo(world, journalId) };
  const report = evaluateUndo(world, journalId);
  if (!report.available) {
    const failed = reject(world, token, null, report.reason, true);
    return { ...failed, verdict: report };
  }
  const entry = world.journal.find((item) => item.id === journalId);
  if (!entry) return { ...reject(world, token, null, "no-such-entry", true), verdict: report };
  return applyUndo(world, entry, token);
}

export function buyback(world: World, req: BuybackRequest): Execution {
  if (!req.token) return reject(world, "", "buyback", "token-required", false);
  const duplicate = storedDuplicate(world, req.token);
  if (duplicate) return duplicate;
  if (world.inflight[req.token]) return reject(world, req.token, "buyback", "already-in-flight", false);
  const confirm = acceptConfirm("buyback", req.confirm, req.locale, undefined);
  if (!confirm.ok && confirm.reason !== "ok") return reject(world, req.token, "buyback", confirm.reason, true);
  if (req.expectedRevision !== world.revision) return reject(world, req.token, "buyback", "inventory-changed", true);
  const sale = world.journal.find((entry) => entry.id === req.journalId);
  if (!sale) return reject(world, req.token, "buyback", "no-such-entry", true);
  if (sale.action !== "sell") return reject(world, req.token, "buyback", "not-buyback", true);
  const report = evaluateBuyback(world, sale);
  if (!report.available) return { ...reject(world, req.token, "buyback", "buyback-unavailable", true), verdict: report };

  const next = cloneWorld(world);
  next.tick += 1;
  next.revision += 1;
  const journalId = `jnl-${next.nextId}`;
  next.nextId += 1;
  const fingerprints: Fingerprint[] = [];
  const restorations: Restoration[] = [];
  const lines: JournalLine[] = [];

  for (const line of sale.lines) {
    const current = next.instances[line.instanceId];
    if (!current) continue;
    let returned: Instance = {
      ...current,
      containerId: line.from,
      equipSlot: null,
    };
    returned = stamp(returned, next.tick, "bought-back", "event.bought-back", { quantity: returned.quantity });
    next.instances[line.instanceId] = returned;
    lines.push({ ...line, from: "vendor", to: line.from, created: false });
    fingerprints.push(fingerprintOf(returned, "placed"));
    restorations.push({
      instanceId: line.instanceId,
      addQuantity: 0,
      unarchive: false,
      containerId: "vendor",
      equipSlot: null,
    });
  }

  const price = sale.currencyDelta.gold;
  next.currency = { ...next.currency, gold: next.currency.gold - price };
  const entry: JournalEntry = {
    id: journalId,
    tick: next.tick,
    action: "buyback",
    token: req.token,
    reversalOf: null,
    buybackOf: sale.id,
    revisionBefore: world.revision,
    revisionAfter: next.revision,
    lines,
    outputs: [],
    currencyDelta: { gold: -price, reputation: 0 },
    sealId: null,
    summaryKey: "summary.buyback",
    summaryParams: { count: sale.summaryParams.count ?? 0, gold: price },
    undoPolicy: "reversible-if-clean",
    fingerprints,
    restorations,
    reversedBy: null,
  };
  next.journal.push(entry);
  const receipt: Receipt = {
    status: "applied",
    token: req.token,
    action: "buyback",
    journalId,
    reason: null,
    summaryKey: entry.summaryKey,
    summaryParams: entry.summaryParams,
  };
  next.receipts[req.token] = receipt;
  return { world: next, receipt, verdict: report };
}

function note(world: World, key: string, params: Record<string, string | number>): World {
  const next = cloneWorld(world);
  next.revision += 1;
  next.tick += 1;
  next.notes.push({ tick: next.tick, key, params });
  return next;
}

export function stealBiscuits(world: World): World {
  const inst = world.instances["inst-biscuit"];
  if (!inst || inst.archived || inst.quantity < 3) return world;
  const next = note(world, "note.steal", { qty: 3 });
  const current = next.instances["inst-biscuit"];
  if (!current) return world;
  next.instances["inst-biscuit"] = stamp({ ...current, quantity: current.quantity - 3 }, next.tick, "field-loss", "note.steal", { qty: 3 });
  return next;
}

export function spendMarks(world: World, amount = 50): World {
  const spent = Math.min(amount, world.currency.gold);
  if (spent <= 0) return world;
  const next = note(world, "note.spend", { gold: spent });
  next.currency = { ...next.currency, gold: next.currency.gold - spent };
  return next;
}

export function consumeOneSalvage(world: World): World {
  const lot = Object.values(world.instances).find((inst) => !inst.archived && inst.lotJournalId && inst.provenance.originKey === "origin.salvage");
  if (!lot) return world;
  const next = note(world, "note.consume", { id: lot.id });
  const current = next.instances[lot.id];
  if (!current) return world;
  if (current.quantity <= 1) {
    next.instances[lot.id] = stamp({ ...current, archived: true, quantity: current.quantity, containerId: null }, next.tick, "field-loss", "note.consume", {});
  } else {
    next.instances[lot.id] = stamp({ ...current, quantity: current.quantity - 1 }, next.tick, "field-loss", "note.consume", { qty: 1 });
  }
  return next;
}

export function scavengeVoid(world: World): World {
  const held = Object.values(world.instances).filter((inst) => !inst.archived && inst.containerId === "void");
  if (held.length === 0) return world;
  const next = note(world, "note.scavenge", { count: held.length });
  for (const inst of held) {
    const current = next.instances[inst.id];
    if (!current) continue;
    next.instances[inst.id] = stamp({ ...current, archived: true, containerId: null }, next.tick, "field-loss", "note.scavenge", {});
  }
  return next;
}

export function releaseVendor(world: World): World {
  const held = Object.values(world.instances).filter((inst) => !inst.archived && inst.containerId === "vendor");
  if (held.length === 0) return world;
  const next = note(world, "note.release", { count: held.length });
  for (const inst of held) {
    const current = next.instances[inst.id];
    if (!current) continue;
    next.instances[inst.id] = stamp({ ...current, archived: true, containerId: null }, next.tick, "field-loss", "note.release", {});
  }
  return next;
}

export function economySnapshot(world: World): string {
  return JSON.stringify({
    instances: world.instances,
    currency: world.currency,
    journal: world.journal,
    seals: world.seals,
    revision: world.revision,
    tick: world.tick,
    nextId: world.nextId,
    notes: world.notes,
    capacity: world.capacity,
  });
}
