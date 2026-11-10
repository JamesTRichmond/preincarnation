import { ARRANGEMENTS } from "./arrangements.ts";
import { interact } from "./behavior.ts";
import { acceptsItem, CATALOG, mustCatalog } from "./catalog.ts";
import {
  applyArrangement,
  assessRoom,
  bindDisplay,
  bindingsOf,
  createInitialSave,
  fixRoom,
  instanceByCatalog,
  isLoose,
  itemOf,
  openAnchorsFor,
  pack,
  place,
  releaseDisplay,
  rotate,
  setBreeze,
  setEra,
  setVisitor,
  visiblePlacements,
  type RoomProblem,
} from "./room.ts";
import { applySharedBindings } from "./room.ts";
import { deserialize, serialize } from "./save.ts";
import {
  catalogId,
  instanceIdFor,
  type CatalogItem,
  type Era,
  type HomesteadHost,
  type RoomSave,
} from "./types.ts";

export interface BehaviorTrace {
  id: string;
  name: string;
  problems: string[];
}

const ERAS: Era[] = ["settlement", "homestead", "memory"];

function loftAll(save: RoomSave): RoomSave {
  let cursor = save;
  for (const inst of [...cursor.instances]) {
    if (!inst.anchorId && !inst.displaySlot && !inst.containerInstanceId) continue;
    const packed = pack(cursor, inst.instanceId);
    if (!packed.ok) throw new Error(packed.message);
    cursor = packed.save;
  }
  return cursor;
}

function ensureOut(save: RoomSave, catalog: string): RoomSave {
  const inst = instanceByCatalog(save, catalog);
  if (!inst) throw new Error(`missing ${catalog}`);
  if (isLoose(inst)) return save;
  const anchors = openAnchorsFor(save, inst.instanceId);
  if (!anchors.length) throw new Error(`no place for ${catalog}`);
  const placed = place(save, inst.instanceId, anchors[0].id);
  if (!placed.ok) throw new Error(placed.message);
  return placed.save;
}

function retires(item: CatalogItem): boolean {
  return (
    item.interaction === "illumination" ||
    item.interaction === "craft" ||
    item.interaction === "serve" ||
    item.interaction === "sound"
  );
}

export function runBehaviorRecord(id: string): BehaviorTrace {
  const item = mustCatalog(id);
  const problems: string[] = [];
  const instId = instanceIdFor(id);
  try {
    let save = setEra(loftAll(createInitialSave()), item.eras[0]).save;
    save = ensureOut(save, id);
    const hostLog: string[] = [];
    const host: HomesteadHost = {
      letters: { open: (ref) => hostLog.push(`letters:${ref}`) },
      music: { cue: (ref) => hostLog.push(`music:${ref}`) },
      display: { focus: (ref) => hostLog.push(`display:${ref}`) },
    };
    prove(item, save, instId, host, hostLog, problems);
    const excluded = ERAS.find((era) => !item.eras.includes(era));
    if (excluded && retires(item)) {
      const retired = setEra(save, excluded).save;
      const lit = retired.instances.find((inst) => inst.instanceId === instId)?.state.lit;
      if (lit) problems.push("stayed lit after the year changed");
      const used = interact(retired, instId, "use");
      if (used.effect !== "retired") problems.push(`expected retired, got ${used.effect}`);
      if (used.save.instances.find((inst) => inst.instanceId === instId)?.state.lit) {
        problems.push("lit while retired");
      }
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
  return { id, name: item.name, problems };
}

function prove(
  item: CatalogItem,
  save: RoomSave,
  instId: string,
  host: HomesteadHost,
  hostLog: string[],
  problems: string[],
) {
  if (item.interaction === "illumination") proveLamp(item, save, instId, host, hostLog, problems);
  else if (item.interaction === "sound") proveSound(item, save, instId, host, hostLog, problems);
  else if (item.interaction === "organization") proveStow(item, save, instId, problems);
  else if (item.interaction === "serve") proveServe(item, save, instId, problems);
  else if (item.interaction === "craft") proveCraft(item, save, instId, problems);
  else if (item.interaction === "history") proveHistory(item, save, instId, problems);
  else if (item.interaction === "visitor") proveVisitor(item, save, instId, problems);
  else problems.push("no interaction");
}

function proveLamp(
  item: CatalogItem,
  save: RoomSave,
  instId: string,
  host: HomesteadHost,
  hostLog: string[],
  problems: string[],
) {
  const on = interact(save, instId, "use", {}, host);
  if (on.effect !== "light") problems.push(`light effect ${on.effect}: ${on.message}`);
  if (!on.save.instances.find((inst) => inst.instanceId === instId)?.state.lit)
    problems.push("not lit");
  if (item.lettersOffer && !hostLog.some((line) => line === `letters:${item.lettersOffer}`)) {
    problems.push("letters were not offered");
  }
  if (item.workLight && !on.message.includes("flax")) problems.push("work light was silent");
  if (
    item.namesCompanions &&
    !on.message.includes("Nothing else") &&
    !on.message.includes("Beside")
  ) {
    problems.push("companions unnamed");
  }
  const off = interact(on.save, instId, "use");
  if (off.effect !== "dark") problems.push("did not go out");
  let lit = interact(off.save, instId, "use").save;
  lit = setBreeze(lit, true).save;
  const still = lit.instances.find((inst) => inst.instanceId === instId)?.state.lit;
  if (item.stableInBreeze && !still) problems.push("stable lamp guttered");
  if (!item.stableInBreeze && still) problems.push("lamp ignored the breeze");
  if (item.lightVisitorLine) {
    const visiting = setVisitor(setBreeze(off.save, false).save, true).save;
    const greeted = interact(visiting, instId, "use");
    if (!greeted.message.includes("Mara")) problems.push("visitor did not notice the lamp");
  }
}

function proveSound(
  item: CatalogItem,
  save: RoomSave,
  instId: string,
  host: HomesteadHost,
  hostLog: string[],
  problems: string[],
) {
  if (item.frozenHour != null) {
    const refused = interact(save, instId, "wind");
    if (refused.effect !== "refused-wind") problems.push("frozen clock took a wind");
    const hour = refused.save.instances.find((inst) => inst.instanceId === instId)?.state.hour;
    if (hour !== 4) problems.push("hour moved");
    const struck = interact(refused.save, instId, "use", {}, host);
    if (struck.motif !== item.motif) problems.push("frozen strike missing");
    if (!struck.message.includes("Four")) problems.push("did not say four");
    return;
  }
  if (item.aligns) {
    const aligned = interact(save, instId, "use");
    if (!aligned.save.instances.find((inst) => inst.instanceId === instId)?.state.aligned) {
      problems.push("sun-mark did not align");
    }
    if (aligned.motif !== item.motif) problems.push("sun-mark silent");
    return;
  }
  if (item.dripMax) {
    let cursor = save;
    for (let i = 0; i < item.dripMax; i += 1) cursor = interact(cursor, instId, "use").save;
    const drips = cursor.instances.find((inst) => inst.instanceId === instId)?.state.drips;
    if (drips !== item.dripMax) problems.push(`drips ${drips}`);
    const done = interact(cursor, instId, "use");
    if (done.effect !== "full") problems.push("bowl did not finish");
    return;
  }
  if (item.needsBreeze) {
    const still = interact(save, instId, "use");
    if (!still.muted) problems.push("chime spoke in still air");
    const windy = setBreeze(save, true).save;
    const heard = interact(windy, instId, "use", {}, host);
    if (heard.motif !== item.motif) problems.push("chime motif missing");
    if (item.strikeVisitorLine) {
      const company = setVisitor(windy, true).save;
      const laugh = interact(company, instId, "use");
      if (!laugh.message.includes("Mara")) problems.push("visitor missed the chime");
    }
    return;
  }
  if (item.windable) {
    const slack = interact(save, instId, "use");
    if (slack.effect !== "slack") problems.push("unwound clock struck");
    const wound = interact(save, instId, "wind").save;
    const struck = interact(wound, instId, "use", {}, host);
    const wind = struck.save.instances.find((inst) => inst.instanceId === instId)?.state.wind;
    if (wind !== 2) problems.push(`wind left ${wind}`);
    if (struck.motif !== item.motif) problems.push("strike motif missing");
    if (item.strikeVisitorLine) {
      const company = setVisitor(wound, true).save;
      const line = interact(company, instId, "use");
      if (!line.message.includes("Mara")) problems.push("visitor missed the strike");
    }
    return;
  }
  const played = interact(save, instId, "use", {}, host);
  if (played.motif !== item.motif) problems.push(`motif ${played.motif}`);
  if (item.category === "instrument" && !hostLog.some((line) => line.startsWith("music:"))) {
    problems.push("music host was not cued");
  }
}

function proveStow(item: CatalogItem, save: RoomSave, instId: string, problems: string[]) {
  let cursor = ensureOut(save, catalogId(11));
  const fiddle = instanceIdFor(catalogId(11));
  const rejected = interact(cursor, instId, "stow", { targetInstanceId: fiddle });
  if (rejected.ok) problems.push("accepted the fiddle");
  if (
    rejected.ok === false &&
    isLoose(instanceByCatalog(rejected.save, catalogId(11))!) === false
  ) {
    problems.push("fiddle moved on a refusal");
  }
  cursor = rejected.ok ? cursor : rejected.save;
  if (item.accept?.foods?.length) {
    const foodId = item.accept.foods[0];
    const before = cursor.pantry.find((food) => food.id === foodId)?.portions ?? 0;
    const tucked = interact(cursor, instId, "stow", { foodId });
    if (!tucked.ok) problems.push(tucked.message);
    const held = tucked.save.instances.find((inst) => inst.instanceId === instId)?.state.heldFood;
    if (!held?.some((food) => food.foodId === foodId)) problems.push("food was not held");
    const after = tucked.save.pantry.find((food) => food.id === foodId)?.portions ?? 0;
    if (after !== before - 1) problems.push("pantry did not shrink");
    const back = interact(tucked.save, instId, "lay", { foodId });
    const restored = back.save.pantry.find((food) => food.id === foodId)?.portions ?? 0;
    if (restored !== before) problems.push("food did not return");
    return;
  }
  const targetItem = CATALOG.find((candidate) => acceptsItem(item, candidate));
  if (!targetItem) {
    problems.push("no matching object to tuck");
    return;
  }
  cursor = ensureOut(cursor, targetItem.id);
  const tucked = interact(cursor, instId, "stow", {
    targetInstanceId: instanceIdFor(targetItem.id),
  });
  if (!tucked.ok) problems.push(tucked.message);
  const holder = tucked.save.instances.find((inst) => inst.instanceId === instId);
  const held = tucked.save.instances.find((inst) => inst.catalogId === targetItem.id);
  if (!holder?.state.heldInstanceIds.includes(instanceIdFor(targetItem.id)))
    problems.push("not in the container");
  if (held && isLoose(held)) problems.push("still showing in the room");
  const laid = interact(tucked.save, instId, "lay", {
    targetInstanceId: instanceIdFor(targetItem.id),
  });
  const out = laid.save.instances.find((inst) => inst.catalogId === targetItem.id);
  if (!out || !isLoose(out)) problems.push("did not come back out");
}

function proveServe(item: CatalogItem, save: RoomSave, instId: string, problems: string[]) {
  const foodId = item.foods?.[0];
  if (!foodId) {
    problems.push("tray has no food");
    return;
  }
  let cursor = save;
  if (item.serveVisitorLine) cursor = setVisitor(cursor, true).save;
  const before = cursor.pantry.find((food) => food.id === foodId)?.portions ?? 0;
  const served = interact(cursor, instId, "serve", { foodId });
  if (!served.ok) problems.push(served.message);
  const dish = served.save.instances.find((inst) => inst.instanceId === instId)?.state.served;
  if (!dish?.some((food) => food.foodId === foodId)) problems.push("nothing on the tray");
  const after = served.save.pantry.find((food) => food.id === foodId)?.portions ?? 0;
  if (after !== before - 1) problems.push("pantry untouched");
  if (item.serveVisitorLine && !served.message.includes("Mara"))
    problems.push("company was ignored");
  const cleared = interact(served.save, instId, "clear-food");
  const back = cleared.save.pantry.find((food) => food.id === foodId)?.portions ?? 0;
  if (back !== before) problems.push("clear did not restore");
  const empty = interact(cleared.save, instId, "serve", { foodId: "food.not-real" });
  if (empty.ok) problems.push("served an unknown dish");
}

function proveCraft(item: CatalogItem, save: RoomSave, instId: string, problems: string[]) {
  let cursor = save;
  if (item.namesTextile) {
    const ribbon = place(cursor, instanceIdFor(catalogId(67)), "table-top");
    if (!ribbon.ok) problems.push(ribbon.message);
    else cursor = ribbon.save;
    const hoop = place(cursor, instId, "table-top");
    if (!hoop.ok) problems.push(hoop.message);
    else cursor = hoop.save;
  }
  if (item.consumesFood) {
    const drained = structuredClone(cursor);
    const food = drained.pantry.find((entry) => entry.id === item.consumesFood);
    if (food) food.portions = 0;
    const empty = interact(drained, instId, "use");
    if (empty.effect !== "demonstrated-empty") problems.push(empty.effect);
    if (empty.save.tokens.length) problems.push("made butter from nothing");
    const stocked = structuredClone(cursor);
    const milk = stocked.pantry.find((entry) => entry.id === item.consumesFood);
    if (milk) milk.portions = 2;
    const made = interact(stocked, instId, "use");
    if (made.save.tokens.length !== 1) problems.push("yield missing");
    const again = interact(made.save, instId, "use");
    if (again.save.tokens.length !== 1) problems.push("craft farmed a second yield");
    const left = again.save.pantry.find((entry) => entry.id === item.consumesFood)?.portions;
    if (left !== 1) problems.push(`milk left ${left}`);
    return;
  }
  const made = interact(cursor, instId, "use");
  if (!made.save.tokens.some((token) => token.name === item.yieldName))
    problems.push("yield missing");
  if (item.namesTextile && !made.message.toLowerCase().includes("wedding ribbon")) {
    problems.push("did not notice the ribbon");
  }
  const again = interact(made.save, instId, "use");
  if (again.effect !== "replay") problems.push("craft repeated");
  if (again.save.tokens.length !== 1) problems.push("extra token");
}

function proveHistory(item: CatalogItem, save: RoomSave, instId: string, problems: string[]) {
  const read = interact(save, instId, "use");
  if (!read.message.includes(item.history[save.era].slice(0, 24))) problems.push("history missing");
  if (!read.save.instances.find((inst) => inst.instanceId === instId)?.state.inspected) {
    problems.push("not marked read");
  }
  const other = ERAS.find((era) => item.history[era] !== item.history[save.era]);
  if (!other) {
    problems.push("era lines are identical");
    return;
  }
  const shifted = interact(setEra(save, other).save, instId, "inspect");
  if (shifted.message === read.message) problems.push("era did not change the story");
}

function proveVisitor(item: CatalogItem, save: RoomSave, instId: string, problems: string[]) {
  if (item.arms) {
    const armed = interact(save, instId, "use");
    if (armed.effect !== "armed") problems.push(armed.effect);
    const company = setVisitor(armed.save, true).save;
    const rung = interact(company, instId, "use");
    if (rung.effect !== "greeted" || !rung.message.includes("Mara"))
      problems.push("alarm ignored Mara");
    return;
  }
  const quiet = interact(save, instId, "use");
  if (quiet.save.instances.find((inst) => inst.instanceId === instId)?.state.visitorAck) {
    problems.push("greeted an empty door");
  }
  const company = setVisitor(save, true).save;
  const greeted = interact(company, instId, "use");
  if (!greeted.message.includes("Mara")) problems.push("Mara went unmentioned");
  const state = greeted.save.instances.find((inst) => inst.instanceId === instId)?.state;
  if (!state?.visitorAck) problems.push("visit not acknowledged");
  if (item.greetWrites === "chalk" && !state?.chalk?.includes("Mara"))
    problems.push("slate stayed blank");
  if (item.greetWrites === "signature") {
    const twice = interact(greeted.save, instId, "use");
    const names =
      twice.save.instances.find((inst) => inst.instanceId === instId)?.state.signatures ?? [];
    if (names.length !== 1) problems.push("name written more than once");
  }
}

export function runAllBehaviorRecords(): BehaviorTrace[] {
  return CATALOG.map((item) => runBehaviorRecord(item.id));
}

export function runIntegrity(): string[] {
  const problems: string[] = [];
  const initial = createInitialSave();
  if (initial.instances.length !== 80) problems.push(`roster ${initial.instances.length}`);
  const ids = new Set(initial.instances.map((inst) => inst.instanceId));
  if (ids.size !== 80) problems.push("duplicate identities in the fresh room");
  if (visiblePlacements(initial).length !== 20) problems.push("evening did not furnish twenty");
  for (const arrangement of ARRANGEMENTS) {
    const applied = applyArrangement(createInitialSave(), arrangement.id);
    if (!applied.ok) problems.push(`${arrangement.id}: ${applied.message}`);
    else {
      const found = assessRoom(applied.save).filter((problem) => problem.kind !== "retired-lit");
      if (found.length)
        problems.push(`${arrangement.id} ${found.map((problem) => problem.message).join("; ")}`);
      if (visiblePlacements(applied.save).length !== 20) problems.push(`${arrangement.id} count`);
    }
  }
  const blocked = place(initial, instanceIdFor(catalogId(34)), "door-floor");
  if (blocked.ok) problems.push("chest was allowed in the doorway");
  const sill = place(loftAll(createInitialSave()), instanceIdFor(catalogId(26)), "window-sill");
  if (!sill.ok) problems.push(`sill ${sill.message}`);
  else if (!assessRoom(sill.save).some((problem) => problem.kind === "inaccessible-control")) {
    problems.push("covered latch was not reported");
  } else if (
    assessRoom(fixRoom(sill.save).save).some((problem) => problem.controlId === "window-latch")
  ) {
    problems.push("latch stayed covered");
  }
  let support = loftAll(createInitialSave());
  support = place(support, instanceIdFor(catalogId(54)), "craft-bench").save;
  const dish = place(support, instanceIdFor(catalogId(63)), "craft-bench");
  if (!dish.ok) problems.push(`dish ${dish.message}`);
  else {
    const packed = pack(dish.save, instanceIdFor(catalogId(54)));
    const marble = instanceByCatalog(packed.save, catalogId(63));
    if (marble?.supportInstanceId) problems.push("dish kept a missing support");
    if (assessRoom(packed.save).some((problem) => problem.kind === "dangling-support")) {
      problems.push("dangling support remained");
    }
  }
  const kerosene = interact(setEra(initial, "settlement").save, instanceIdFor(catalogId(5)), "use");
  if (kerosene.effect !== "retired") problems.push("kerosene worked in the settlement");
  const idsAfter = setEra(initial, "settlement")
    .save.instances.map((inst) => inst.instanceId)
    .join();
  const idsBack = setEra(setEra(initial, "settlement").save, "memory")
    .save.instances.map((inst) => inst.instanceId)
    .join();
  if (
    idsAfter !== initial.instances.map((inst) => inst.instanceId).join() ||
    idsBack !== idsAfter
  ) {
    problems.push("era transition changed identities");
  }
  let fernInChest = place(loftAll(initial), instanceIdFor(catalogId(34)), "corner").save;
  fernInChest = place(fernInChest, instanceIdFor(catalogId(61)), "letter-stand").save;
  fernInChest = interact(fernInChest, instanceIdFor(catalogId(34)), "stow", {
    targetInstanceId: instanceIdFor(catalogId(61)),
  }).save;
  const restored = applyArrangement(fernInChest, "evening");
  const fern = instanceByCatalog(restored.save, catalogId(61));
  if (fern?.containerInstanceId || fern?.anchorId !== "letter-stand") {
    problems.push("arrangement left the fern in the chest");
  }
  const shown = bindDisplay(initial, instanceIdFor(catalogId(77)), "display.mantel-memory");
  if (visiblePlacements(shown.save).some((inst) => inst.catalogId.endsWith(".077"))) {
    problems.push("locket showed twice");
  }
  const again = bindDisplay(shown.save, instanceIdFor(catalogId(61)), "display.mantel-memory");
  if (again.ok) problems.push("display slot taken twice");
  const recalled = releaseDisplay(shown.save, instanceIdFor(catalogId(77)));
  if (visiblePlacements(recalled.save).some((inst) => inst.catalogId.endsWith(".077"))) {
    problems.push("recalled locket stayed on the floor");
  }
  const rotated = rotate(initial, instanceIdFor(catalogId(11)));
  if (
    !rotated.ok ||
    rotated.save.instances.find((inst) => inst.catalogId.endsWith(".011"))?.rotation !== 90
  ) {
    problems.push("fiddle did not turn");
  }
  const stuck = rotate(initial, instanceIdFor(catalogId(78)));
  if (stuck.ok) problems.push("slate rotated");
  const round = deserialize(serialize(rotated.save));
  const fiddle = round.instances.find((inst) => inst.catalogId.endsWith(".011"));
  if (fiddle?.rotation !== 90) problems.push("rotation did not survive save");
  if (round.instances.length !== 80) problems.push("save lost the roster");
  const shared = applySharedBindings(createBlankLike(initial), bindingsOf(rotated.save));
  const sharedFiddle = shared.save.instances.find((inst) => inst.catalogId.endsWith(".011"));
  if (sharedFiddle?.anchorId !== fiddle?.anchorId || shared.save.instances.length !== 80) {
    problems.push("shared bindings did not match");
  }
  return problems;
}

function createBlankLike(save: RoomSave): RoomSave {
  const blank = structuredClone(save);
  for (const inst of blank.instances) {
    inst.anchorId = null;
    inst.packed = true;
    inst.displaySlot = null;
    inst.containerInstanceId = null;
    inst.supportInstanceId = null;
  }
  return blank;
}

export function integrityProblems(): RoomProblem[] {
  return assessRoom(createInitialSave());
}

export function itemOfInstance(save: RoomSave, instanceId: string) {
  const inst = save.instances.find((item) => item.instanceId === instanceId);
  return inst ? itemOf(inst) : undefined;
}
