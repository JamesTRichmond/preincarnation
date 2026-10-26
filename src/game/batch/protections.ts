import { defOf } from "./catalog.ts";
import type { ActionKind, Category, ContainerId, Exclusion, ExclusionCode, Instance, LineRequest, World } from "./types.ts";

const EVIDENCE_DESTINATIONS = new Set<ContainerId>(["pack", "stash", "quest-satchel"]);

export function categoryOf(inst: Instance): Category {
  if (inst.reservationId) return "reservations";
  if (inst.questId) return "evidence";
  const def = defOf(inst.defId);
  if (def.kind === "gear") return "gear";
  if (def.kind === "named") return "named";
  return def.category;
}

function restoreDestinationOk(inst: Instance, destination: ContainerId): boolean {
  if (destination === "void" || destination === "vendor" || destination === "equipped" || destination === "project-lantern") {
    return false;
  }
  if (inst.questId) return EVIDENCE_DESTINATIONS.has(destination);
  return destination === "pack" || destination === "stash";
}

/**
 * Why a piece is held out of an action. Null means the piece itself may proceed;
 * capacity and confirm are checked later. Protected classes never ride along
 * inside a destructive batch.
 */
export function exclusionFor(
  inst: Instance,
  action: ActionKind,
  destination?: ContainerId,
): ExclusionCode | null {
  if (inst.archived) return "archived";
  if (inst.quantity <= 0) return "zero-quantity";
  const def = defOf(inst.defId);

  if (action === "restore") {
    if (inst.containerId === "vendor") return "vendor-held";
    if (inst.containerId !== "void") return "not-in-hold";
    if (destination && !restoreDestinationOk(inst, destination)) return "wrong-container";
    return null;
  }

  if (inst.containerId === "vendor") return "vendor-held";
  if (inst.containerId === "void") return "not-in-hold";
  if (inst.reservationId || def.kind === "reservation") return "reserved";

  if (action === "move") {
    if (!destination || destination === inst.containerId) return "wrong-container";
    if (destination === "vendor" || destination === "void") return "wrong-container";
    if (inst.questId || def.kind === "evidence") {
      return EVIDENCE_DESTINATIONS.has(destination) ? null : "wrong-container";
    }
    if (destination === "project-lantern" || destination === "quest-satchel") return "wrong-container";
    if (destination === "equipped") {
      return def.kind === "gear" && def.equipSlot ? null : "immovable";
    }
    return null;
  }

  if (inst.questId || def.kind === "evidence") return "evidence";
  if (inst.containerId === "equipped" || inst.equipSlot) return "equipped";
  if (action === "dismantle" && def.salvage.length === 0) return "no-recipe";
  if (action === "sell" || action === "donate" || action === "discard" || action === "dismantle") return null;
  return "immovable";
}

export function selectEligible(
  world: World,
  containerId: ContainerId,
  action: ActionKind,
  category: Category | "all",
  destination?: ContainerId,
): { lines: LineRequest[]; exclusions: Exclusion[] } {
  const lines: LineRequest[] = [];
  const exclusions: Exclusion[] = [];
  for (const inst of Object.values(world.instances)) {
    if (inst.archived || inst.containerId !== containerId) continue;
    if (category !== "all" && categoryOf(inst) !== category) continue;
    const code = exclusionFor(inst, action, destination);
    if (code) exclusions.push({ instanceId: inst.id, code, defId: inst.defId });
    else lines.push({ instanceId: inst.id, quantity: inst.quantity });
  }
  lines.sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  return { lines, exclusions };
}
