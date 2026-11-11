import { anchorById, ANCHORS } from "./anchors.ts";
import { arrangementById, ARRANGEMENTS, type Arrangement } from "./arrangements.ts";
import { mustCatalog } from "./catalog.ts";
import {
  DISPLAY_SLOTS,
  emptyState,
  instanceIdFor,
  ROOM_ID,
  SAVE_VERSION,
  VISITOR_NAME,
  type ActionResult,
  type Anchor,
  type CatalogItem,
  type DisplaySlot,
  type Era,
  type FoodPortion,
  type HomesteadHost,
  type HostCall,
  type PlacedObject,
  type RoomSave,
  type Rotation,
  type SharedBinding,
} from "./types.ts";
import { CATALOG } from "./catalog.ts";

export const PANTRY: FoodPortion[] = [
  { id: "food.tea", name: "Black tea", portions: 4 },
  { id: "food.maple-cookies", name: "Maple cookies", portions: 6 },
  { id: "food.bread", name: "Brown bread", portions: 4 },
  { id: "food.apple-butter", name: "Apple butter", portions: 3 },
  { id: "food.pie", name: "Windfall pie", portions: 2 },
  { id: "food.biscuits", name: "Buttermilk biscuits", portions: 4 },
  { id: "food.milk", name: "Morning milk", portions: 3 },
  { id: "food.sugar-cakes", name: "Sugar-on-snow cakes", portions: 4 },
  { id: "food.jam", name: "Wild raspberry jam", portions: 3 },
];

export function foodName(id: string): string {
  return PANTRY.find((food) => food.id === id)?.name ?? id;
}

export function blankResult(
  save: RoomSave,
  ok: boolean,
  message: string,
  effect = "none",
): ActionResult {
  return { ok, message, save, hostCalls: [], effect };
}

export function isLoose(inst: PlacedObject): boolean {
  return Boolean(inst.anchorId) && !inst.packed && !inst.containerInstanceId && !inst.displaySlot;
}

export function findInstance(save: RoomSave, instanceId: string): PlacedObject | undefined {
  return save.instances.find((inst) => inst.instanceId === instanceId);
}

export function instanceByCatalog(save: RoomSave, catalogId: string): PlacedObject | undefined {
  return save.instances.find((inst) => inst.catalogId === catalogId);
}

export function itemOf(inst: PlacedObject): CatalogItem {
  return mustCatalog(inst.catalogId);
}

function fits(item: CatalogItem, anchor: Anchor): boolean {
  return item.anchorTags.some((tag) => anchor.tags.includes(tag));
}

export function occupants(save: RoomSave, anchorId: string): PlacedObject[] {
  return save.instances.filter((inst) => isLoose(inst) && inst.anchorId === anchorId);
}

export function visiblePlacements(save: RoomSave): PlacedObject[] {
  const seen = new Set<string>();
  const out: PlacedObject[] = [];
  for (const inst of save.instances) {
    if (!isLoose(inst)) continue;
    if (seen.has(inst.instanceId)) continue;
    seen.add(inst.instanceId);
    out.push(inst);
  }
  return out;
}

export function openAnchorsFor(
  save: RoomSave,
  instanceId: string,
  opts?: { allowOverflow?: boolean },
): Anchor[] {
  const inst = findInstance(save, instanceId);
  if (!inst) return [];
  const item = itemOf(inst);
  return ANCHORS.filter((anchor) => {
    if (anchor.exit) return false;
    if (!opts?.allowOverflow && anchor.overflow) return false;
    if (!fits(item, anchor)) return false;
    const occ = occupants(save, anchor.id).filter((other) => other.instanceId !== instanceId);
    if (occ.length >= anchor.capacity) return false;
    if (item.requiresSupport && !anchor.builtInSupport) {
      const supported = occ.some((other) => itemOf(other).providesSupport);
      if (!supported) return false;
    }
    return true;
  });
}

function pushNote(save: RoomSave, text: string) {
  save.notes = [...save.notes, text].slice(-20);
}

function detachHeld(save: RoomSave, instanceId: string) {
  for (const inst of save.instances) {
    if (!inst.state.heldInstanceIds.includes(instanceId)) continue;
    inst.state.heldInstanceIds = inst.state.heldInstanceIds.filter((id) => id !== instanceId);
  }
  const inst = findInstance(save, instanceId);
  if (inst) inst.containerInstanceId = null;
}

function rehomeDependents(save: RoomSave, supporterId: string) {
  const dependents = save.instances.filter((inst) => inst.supportInstanceId === supporterId);
  for (const dep of dependents) {
    dep.supportInstanceId = null;
    const anchor = dep.anchorId ? anchorById(dep.anchorId) : undefined;
    if (anchor?.builtInSupport && isLoose(dep)) continue;
    const caught = anchorById("caught");
    const used = occupants(save, "caught").length;
    if (caught && used < caught.capacity) {
      dep.anchorId = "caught";
      dep.packed = false;
      dep.containerInstanceId = null;
      dep.displaySlot = null;
      dep.supportInstanceId = null;
      pushNote(save, `${itemOf(dep).name} was set aside when its surface left.`);
    } else {
      dep.anchorId = null;
      dep.packed = true;
      dep.displaySlot = null;
      dep.supportInstanceId = null;
      pushNote(save, `${itemOf(dep).name} went to the loft when its surface left.`);
    }
  }
}

function supporterOn(save: RoomSave, anchorId: string, selfId: string): string | null {
  const found = occupants(save, anchorId).find(
    (inst) => inst.instanceId !== selfId && itemOf(inst).providesSupport,
  );
  return found?.instanceId ?? null;
}

/** Mutates save. Returns an error string, or null. */
export function tryPlace(
  save: RoomSave,
  instanceId: string,
  anchorId: string,
  rotation?: Rotation,
): string | null {
  const inst = findInstance(save, instanceId);
  if (!inst) return "That object is not in this room's keeping.";
  if (inst.roomId !== save.roomId) return "That object is bound to another room.";
  const item = itemOf(inst);
  const anchor = anchorById(anchorId);
  if (!anchor) return "That place is not in the room.";
  if (anchor.exit || (item.blocksExit && anchor.covers.includes("door-latch"))) {
    return `${item.name} would block the door. The latch has to stay reachable.`;
  }
  if (!fits(item, anchor)) {
    return `${item.name} does not belong on the ${anchor.label.toLowerCase()}.`;
  }
  const occ = occupants(save, anchor.id).filter((other) => other.instanceId !== instanceId);
  if (occ.length >= anchor.capacity) {
    const names = occ.map((other) => itemOf(other).name).join(" and ");
    return `${anchor.label} already holds ${names}.`;
  }
  let supportId: string | null = null;
  if (item.requiresSupport && !anchor.builtInSupport) {
    supportId = supporterOn(save, anchor.id, instanceId);
    if (!supportId) return `${item.name} needs a surface already there.`;
  }
  if (item.providesSupport) rehomeDependents(save, instanceId);
  detachHeld(save, instanceId);
  inst.displaySlot = null;
  inst.packed = false;
  inst.containerInstanceId = null;
  inst.anchorId = anchor.id;
  inst.supportInstanceId = supportId;
  if (rotation !== undefined) inst.rotation = rotation;
  return null;
}

export function place(
  save: RoomSave,
  instanceId: string,
  anchorId: string,
  rotation?: Rotation,
): ActionResult {
  const draft = structuredClone(save);
  const error = tryPlace(draft, instanceId, anchorId, rotation);
  if (error) return blankResult(save, false, error);
  const inst = findInstance(draft, instanceId)!;
  const item = itemOf(inst);
  const anchor = anchorById(anchorId)!;
  return blankResult(
    draft,
    true,
    `${item.name} is on the ${anchor.label.toLowerCase()}.`,
    "placed",
  );
}

export function rotate(save: RoomSave, instanceId: string): ActionResult {
  const inst = findInstance(save, instanceId);
  if (!inst) return blankResult(save, false, "That object is not in this room's keeping.");
  const item = itemOf(inst);
  if (!item.rotatable) return blankResult(save, false, `${item.name} does not turn.`);
  if (!isLoose(inst)) return blankResult(save, false, "Set it out before turning it.");
  const order: Rotation[] = [0, 90, 180, 270];
  const next = order[(order.indexOf(inst.rotation) + 1) % 4];
  const draft = structuredClone(save);
  findInstance(draft, instanceId)!.rotation = next;
  return blankResult(draft, true, facingLabel(next) + ".", "rotated");
}

export function facingLabel(rotation: Rotation): string {
  if (rotation === 90) return "Turned left";
  if (rotation === 180) return "Facing the door";
  if (rotation === 270) return "Turned right";
  return "Facing in";
}

export function pack(save: RoomSave, instanceId: string): ActionResult {
  const inst = findInstance(save, instanceId);
  if (!inst) return blankResult(save, false, "That object is not in this room's keeping.");
  const item = itemOf(inst);
  if (inst.packed && !inst.anchorId && !inst.containerInstanceId && !inst.displaySlot) {
    return blankResult(save, true, `${item.name} is already in the loft.`, "packed");
  }
  const draft = structuredClone(save);
  const target = findInstance(draft, instanceId)!;
  if (itemOf(target).providesSupport) rehomeDependents(draft, instanceId);
  detachHeld(draft, instanceId);
  target.anchorId = null;
  target.supportInstanceId = null;
  target.displaySlot = null;
  target.containerInstanceId = null;
  target.packed = true;
  if (item.interaction === "illumination") target.state.lit = false;
  pushNote(draft, `${item.name} was put in the loft.`);
  return blankResult(draft, true, `${item.name} is in the loft. It is still itself.`, "packed");
}

export function setEra(save: RoomSave, era: Era): ActionResult {
  const draft = structuredClone(save);
  draft.era = era;
  for (const inst of draft.instances) {
    const item = itemOf(inst);
    if (!item.eras.includes(era) && inst.state.lit) inst.state.lit = false;
  }
  const label = era === S ? "Settlement" : era === H ? "Homestead" : "Memory";
  pushNote(draft, `The year is ${label}. Every object is still here.`);
  return blankResult(
    draft,
    true,
    `The year is ${label.toLowerCase()}. The room kept every object. What the year can still do has changed.`,
    "era",
  );
}

const S = "settlement" as const;
const H = "homestead" as const;

export function setBreeze(save: RoomSave, on: boolean): ActionResult {
  const draft = structuredClone(save);
  draft.breeze = on;
  if (on) {
    const guttered: string[] = [];
    for (const inst of draft.instances) {
      if (!isLoose(inst) || !inst.state.lit) continue;
      const item = itemOf(inst);
      if (item.interaction !== "illumination" || item.stableInBreeze) continue;
      inst.state.lit = false;
      guttered.push(item.name);
    }
    const extra = guttered.length
      ? ` ${guttered.join(", ")} guttered.`
      : " The sheltered flames stayed.";
    return blankResult(draft, true, `The window is open.${extra}`, "breeze");
  }
  return blankResult(draft, true, "The window is shut. The air in the room goes still.", "breeze");
}

export function setVisitor(save: RoomSave, present: boolean): ActionResult {
  const draft = structuredClone(save);
  draft.visitorPresent = present;
  if (!present) {
    return blankResult(draft, true, "The doorway is just a doorway.", "visitor");
  }
  const harp = draft.instances.find((inst) => inst.catalogId.endsWith(".024") && isLoose(inst));
  const tail = harp ? " The door harp can answer." : "";
  return blankResult(draft, true, `${draft.visitorName} is at the door.${tail}`, "visitor");
}

function stripForArrangement(save: RoomSave, arranged: Set<string>) {
  for (const inst of save.instances) {
    const chosen = arranged.has(inst.catalogId);
    if (chosen) {
      inst.anchorId = null;
      inst.supportInstanceId = null;
      inst.containerInstanceId = null;
      inst.displaySlot = null;
      inst.packed = true;
    } else if (!inst.containerInstanceId && !inst.displaySlot) {
      inst.anchorId = null;
      inst.supportInstanceId = null;
      inst.packed = true;
    }
  }
  for (const inst of save.instances) {
    inst.state.heldInstanceIds = inst.state.heldInstanceIds.filter((id) => {
      const other = findInstance(save, id);
      return other ? !arranged.has(other.catalogId) : false;
    });
  }
}

export function applyArrangement(save: RoomSave, arrangement: Arrangement | string): ActionResult {
  const plan = typeof arrangement === "string" ? arrangementById(arrangement) : arrangement;
  if (!plan) return blankResult(save, false, "That arrangement is not one of the room's.");
  const draft = structuredClone(save);
  const arranged = new Set(plan.placements.map((p) => mustCatalog(instanceCatalog(p.n)).id));
  stripForArrangement(draft, arranged);
  for (const placement of plan.placements) {
    const catalog = mustCatalog(instanceCatalog(placement.n));
    const inst = instanceByCatalog(draft, catalog.id);
    if (!inst) return blankResult(save, false, `${catalog.name} has no saved identity.`);
    const error = tryPlace(draft, inst.instanceId, placement.anchorId, placement.rotation ?? 0);
    if (error) return blankResult(save, false, `${plan.label}: ${error}`);
  }
  pushNote(draft, plan.blurb);
  return blankResult(draft, true, plan.blurb, "arranged");
}

function instanceCatalog(n: number): string {
  return `loot.expansion.home.${String(n).padStart(3, "0")}`;
}

export function createBlankSave(): RoomSave {
  return {
    version: SAVE_VERSION,
    roomId: ROOM_ID,
    era: "memory",
    breeze: false,
    visitorPresent: false,
    visitorName: VISITOR_NAME,
    pantry: structuredClone(PANTRY),
    tokens: [],
    notes: [],
    instances: CATALOG.map((item) => ({
      instanceId: instanceIdFor(item.id),
      catalogId: item.id,
      roomId: ROOM_ID,
      anchorId: null,
      rotation: 0 as Rotation,
      supportInstanceId: null,
      containerInstanceId: null,
      packed: true,
      displaySlot: null,
      state: emptyState(item.frozenHour ?? null),
    })),
  };
}

export function createInitialSave(): RoomSave {
  const applied = applyArrangement(createBlankSave(), ARRANGEMENTS[0]);
  if (!applied.ok) throw new Error(applied.message);
  const save = applied.save;
  for (const n of [4, 7, 10]) {
    const inst = instanceByCatalog(save, instanceCatalog(n));
    if (inst) inst.state.lit = true;
  }
  return save;
}

export function bindDisplay(
  save: RoomSave,
  instanceId: string,
  slotId: string,
  host?: HomesteadHost,
): ActionResult {
  if (!DISPLAY_SLOTS.includes(slotId as DisplaySlot)) {
    return blankResult(save, false, "The house display does not have that slot.");
  }
  const inst = findInstance(save, instanceId);
  if (!inst) return blankResult(save, false, "That object is not in this room's keeping.");
  const taken = save.instances.find(
    (other) => other.displaySlot === slotId && other.instanceId !== instanceId,
  );
  if (taken) {
    return blankResult(save, false, `${itemOf(taken).name} is already in that display.`);
  }
  const draft = structuredClone(save);
  const target = findInstance(draft, instanceId)!;
  if (itemOf(target).providesSupport) rehomeDependents(draft, instanceId);
  detachHeld(draft, instanceId);
  target.anchorId = null;
  target.supportInstanceId = null;
  target.packed = false;
  target.containerInstanceId = null;
  target.displaySlot = slotId;
  const call: HostCall = {
    system: "display",
    action: "focus",
    ref: slotId,
    sourceInstanceId: instanceId,
  };
  host?.display?.focus(slotId, instanceId);
  pushNote(draft, `${itemOf(target).name} is on the house display, not also on the floor.`);
  return {
    ok: true,
    message: `${itemOf(target).name} is only on the house display.`,
    save: draft,
    hostCalls: [call],
    effect: "displayed",
  };
}

export function releaseDisplay(save: RoomSave, instanceId: string): ActionResult {
  const inst = findInstance(save, instanceId);
  if (!inst?.displaySlot)
    return blankResult(save, false, "That object is not on the house display.");
  const draft = structuredClone(save);
  const target = findInstance(draft, instanceId)!;
  target.displaySlot = null;
  target.anchorId = null;
  target.packed = true;
  target.supportInstanceId = null;
  return blankResult(
    draft,
    true,
    `${itemOf(target).name} left the display and went to the loft, so it would not show twice.`,
    "recalled",
  );
}

export function bindingsOf(save: RoomSave): SharedBinding[] {
  return save.instances.map((inst) => ({
    instanceId: inst.instanceId,
    roomId: inst.roomId,
    anchorId: inst.anchorId,
    rotation: inst.rotation,
    supportInstanceId: inst.supportInstanceId,
    containerInstanceId: inst.containerInstanceId,
    displaySlot: inst.displaySlot,
    packed: inst.packed,
  }));
}

export function applySharedBindings(save: RoomSave, bindings: SharedBinding[]): ActionResult {
  const draft = structuredClone(save);
  const seen = new Set<string>();
  for (const binding of bindings) {
    if (binding.roomId !== draft.roomId) continue;
    if (seen.has(binding.instanceId)) continue;
    seen.add(binding.instanceId);
    const inst = findInstance(draft, binding.instanceId);
    if (!inst) continue;
    inst.anchorId = binding.anchorId;
    inst.rotation = binding.rotation;
    inst.supportInstanceId = binding.supportInstanceId;
    inst.containerInstanceId = binding.containerInstanceId;
    inst.displaySlot = binding.displaySlot;
    inst.packed = binding.packed;
    inst.roomId = draft.roomId;
  }
  return blankResult(draft, true, "The room took the shared placement.", "bound");
}

export function roomAtmosphere(save: RoomSave): {
  level: number;
  workLit: boolean;
  reveals: { id: string; text: string }[];
  label: string;
} {
  let level = 0;
  let workLit = false;
  const reveals: { id: string; text: string }[] = [];
  for (const inst of visiblePlacements(save)) {
    if (!inst.state.lit) continue;
    const item = itemOf(inst);
    level += item.brightness ?? 1;
    if (item.workLight) workLit = true;
    if (item.reveal) reveals.push(item.reveal);
    const byEra = item.revealByEra?.[save.era];
    if (byEra) reveals.push({ id: `${item.id}:${save.era}`, text: byEra });
  }
  const label = level <= 0 ? "Dim" : level < 4 ? "Lamp-warm" : "Bright enough to read";
  return { level, workLit, reveals, label };
}

export function fixRoom(save: RoomSave): ActionResult {
  let cursor = save;
  const notes: string[] = [];
  for (let guard = 0; guard < 12; guard += 1) {
    const problem = assessImported(cursor).find(
      (item) =>
        item.kind === "blocked-exit" ||
        item.kind === "inaccessible-control" ||
        item.kind === "dangling-support",
    );
    if (!problem?.instanceId) break;
    const options = openAnchorsFor(cursor, problem.instanceId).filter(
      (anchor) => anchor.covers.length === 0,
    );
    if (options.length) {
      const moved = place(cursor, problem.instanceId, options[0].id);
      cursor = moved.save;
      notes.push(moved.message);
    } else {
      const lofted = pack(cursor, problem.instanceId);
      cursor = lofted.save;
      notes.push(lofted.message);
    }
  }
  return blankResult(
    cursor,
    true,
    notes.join(" ") || "The ways through the room are already clear.",
    "fixed",
  );
}

function assessImported(save: RoomSave) {
  return assessRoom(save);
}

export interface RoomProblem {
  kind:
    | "blocked-exit"
    | "inaccessible-control"
    | "duplicate-display"
    | "dangling-support"
    | "duplicate-id"
    | "retired-lit"
    | "ghost-anchor";
  message: string;
  instanceId?: string;
  controlId?: string;
}

export function assessRoom(save: RoomSave): RoomProblem[] {
  const problems: RoomProblem[] = [];
  const ids = new Map<string, number>();
  const slots = new Map<string, string[]>();
  for (const inst of save.instances) {
    ids.set(inst.instanceId, (ids.get(inst.instanceId) ?? 0) + 1);
    if (inst.displaySlot) {
      const list = slots.get(inst.displaySlot) ?? [];
      list.push(inst.instanceId);
      slots.set(inst.displaySlot, list);
    }
    if (!isLoose(inst)) {
      if ((inst.packed || inst.containerInstanceId || inst.displaySlot) && inst.anchorId) {
        problems.push({
          kind: "ghost-anchor",
          instanceId: inst.instanceId,
          message: `${itemOf(inst).name} is showing in a place and also somewhere else.`,
        });
      }
      if (inst.displaySlot && inst.containerInstanceId) {
        problems.push({
          kind: "duplicate-display",
          instanceId: inst.instanceId,
          message: `${itemOf(inst).name} is on the display and inside a container.`,
        });
      }
      continue;
    }
    const anchor = inst.anchorId ? anchorById(inst.anchorId) : undefined;
    const item = itemOf(inst);
    if (anchor?.exit) {
      problems.push({
        kind: "blocked-exit",
        instanceId: inst.instanceId,
        controlId: "door-latch",
        message: `${item.name} is in the doorway.`,
      });
    }
    if (anchor && !anchor.exit) {
      for (const controlId of anchor.covers) {
        problems.push({
          kind: "inaccessible-control",
          instanceId: inst.instanceId,
          controlId,
          message: `${item.name} is covering the ${controlName(controlId)}.`,
        });
      }
    }
    if (inst.state.lit && !item.eras.includes(save.era)) {
      problems.push({
        kind: "retired-lit",
        instanceId: inst.instanceId,
        message: `${item.name} is lit in a year that cannot burn it.`,
      });
    }
    if (inst.supportInstanceId) {
      const support = findInstance(save, inst.supportInstanceId);
      const dangling =
        !support ||
        !isLoose(support) ||
        support.anchorId !== inst.anchorId ||
        !itemOf(support).providesSupport;
      if (dangling) {
        problems.push({
          kind: "dangling-support",
          instanceId: inst.instanceId,
          message: `${item.name} is resting on a surface that is gone.`,
        });
      }
    }
  }
  for (const [id, count] of ids) {
    if (count > 1) {
      problems.push({
        kind: "duplicate-id",
        instanceId: id,
        message: `${id} is in the room more than once.`,
      });
    }
  }
  for (const [slot, owners] of slots) {
    if (owners.length > 1) {
      problems.push({
        kind: "duplicate-display",
        instanceId: owners[1],
        message: `${slot} is showing more than one object.`,
      });
    }
  }
  return problems;
}

function controlName(id: string): string {
  if (id === "door-latch") return "door latch";
  if (id === "window-latch") return "window latch";
  return "hearth damper";
}

export function functional(save: RoomSave, item: CatalogItem): boolean {
  return item.eras.includes(save.era);
}
