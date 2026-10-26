import { LootError } from "./errors.ts";
import {
  carryWeight,
  clamp,
  countOwned,
  protectionOf,
  round1,
  unitValue,
} from "./state.ts";
import { carryLimit } from "./state.ts";
import {
  EQUIP_SLOTS,
  type BagKind,
  type CharacterBeat,
  type Effect,
  type EquipSlot,
  type HandoffSpec,
  type ItemDefinition,
  type ItemFlags,
  type ItemInstance,
  type JournalEntry,
  type LootAction,
  type LootState,
  type Owner,
  type Protection,
  type ResolvedContent,
  type SourceKind,
  type SourceRecord,
  type StepResult,
} from "./types.ts";

const HAND: Owner["kind"][] = ["carry", "bench"];

export interface Grant {
  definitionId: string;
  quantity: number;
  condition?: number | null;
  owner: Owner;
  source: { kind: SourceKind; note: string; fromIds: string[] };
  mods?: string[];
  modEdge?: number;
  flags?: ItemFlags;
  protection?: Protection | null;
}

export function step(input: LootState, content: ResolvedContent, action: LootAction): StepResult {
  const state = structuredClone(input);
  state.clock += 1;
  try {
    const message = reduce(state, content, action);
    const flat = message.replace(/\s+/g, " ").trim();
    state.log.unshift({
      clock: state.clock,
      message: flat.length > 220 ? `${flat.slice(0, 217)}...` : flat,
    });
    if (state.log.length > 40) state.log.length = 40;
    return { ok: true, state, message };
  } catch (error) {
    if (error instanceof LootError) {
      return { ok: false, state: input, error: { code: error.code, message: error.message } };
    }
    throw error;
  }
}

/** Death is a chapter. Weapons may fall on the mound; this collection does not. */
export function surviveDeath(input: LootState, cause: string): LootState {
  const state = structuredClone(input);
  state.clock += 1;
  const message = noteDeath(state, cause);
  const flat = message.replace(/\s+/g, " ").trim();
  state.log.unshift({
    clock: state.clock,
    message: flat.length > 220 ? `${flat.slice(0, 217)}...` : flat,
  });
  if (state.log.length > 40) state.log.length = 40;
  return state;
}

export function grantItem(state: LootState, content: ResolvedContent, grant: Grant): string {
  const def = definition(content, grant.definitionId);
  if (grant.quantity < 1) throw new LootError("quantity", "Quantity has to be at least 1.");
  if (grant.quantity > def.stackLimit) {
    throw new LootError("stack", `${def.name} stacks to ${def.stackLimit}.`);
  }
  const condition = resolveCondition(def, grant.condition);
  assertFits(state, content, grant.owner, def.weight * grant.quantity);
  const draft: ItemInstance = {
    id: "draft",
    definitionId: def.id,
    quantity: grant.quantity,
    condition,
    mods: [...(grant.mods ?? [])],
    protection: grant.protection ?? null,
    modEdge: grant.modEdge ?? 0,
    flags: { ...(grant.flags ?? {}) },
    source: {
      kind: grant.source.kind,
      clock: state.clock,
      note: grant.source.note,
      fromIds: [...grant.source.fromIds],
    },
  };
  if (grant.owner.kind !== "equipped" && grant.owner.kind !== "display") {
    for (const other of Object.values(state.instances)) {
      const owner = state.owners[other.id];
      if (!owner || !samePlace(owner, grant.owner)) continue;
      if (!compatible(other, draft)) continue;
      if (other.quantity + grant.quantity > def.stackLimit) continue;
      other.quantity += grant.quantity;
      return other.id;
    }
  }
  const id = takeId(state);
  draft.id = id;
  state.instances[id] = draft;
  state.owners[id] = grant.owner;
  if (grant.owner.kind === "equipped") state.equipment[grant.owner.slot] = id;
  if (grant.owner.kind === "display") state.placements[grant.owner.slotId] = id;
  return id;
}

function reduce(state: LootState, content: ResolvedContent, action: LootAction): string {
  switch (action.type) {
    case "acquire":
      return acquire(state, content, action);
    case "transfer":
      return transfer(state, content, action.instanceId, action.to, action.quantity);
    case "split":
      return split(state, action.instanceId, action.quantity);
    case "equip":
      return equip(state, content, action.instanceId);
    case "unequip":
      return unequip(state, content, action.slot);
    case "consume":
      return consume(state, content, action.instanceId);
    case "read":
      return read(state, content, action.instanceId);
    case "present":
      return speak(state, content, action.instanceId, action.characterId, "present");
    case "gift":
      return speak(state, content, action.instanceId, action.characterId, "gift");
    case "place":
      return place(state, content, action.instanceId, action.slotId);
    case "retrieve":
      return retrieve(state, content, action.slotId);
    case "restore":
      return restore(state, content, action.restorationId, action.targetInstanceId);
    case "modify":
      return modify(state, content, action.modificationId, action.targetInstanceId);
    case "dismantle":
    case "salvage":
      return dismantle(state, content, action.instanceId);
    case "craft":
      return craft(state, content, action.recipeId);
    case "rig":
      return rig(state, content, action.instanceId);
    case "consult":
      return consult(state, content, action.instanceId);
    case "unlock":
      return unlock(state, content, action.instanceId);
    case "catalog-note":
      return catalogNote(state, content, action.instanceId);
    case "ford":
      return ford(state, content, action.instanceId);
    case "trade":
      return trade(state, content, action);
    case "discard":
      return discard(state, content, action.instanceId, action.quantity);
    case "releaseQuest":
      return releaseQuest(state, content, action.instanceId);
    case "noteDeath":
      return noteDeath(state, action.cause);
    case "passEvening":
      return passEvening(state, content);
    default:
      return assertNever(action);
  }
}

function acquire(state: LootState, content: ResolvedContent, action: Extract<LootAction, { type: "acquire" }>): string {
  const owner: Owner = action.owner === "trader" ? { kind: "trader" } : { kind: action.owner };
  const id = grantItem(state, content, {
    definitionId: action.definitionId,
    quantity: action.quantity,
    condition: action.condition,
    owner,
    source: {
      kind: action.sourceKind,
      note: action.sourceNote,
      fromIds: action.fromIds ?? [],
    },
  });
  const inst = state.instances[id];
  const def = definition(content, action.definitionId);
  return inst
    ? `${def.name} is in the ledger (${inst.quantity}).`
    : `${def.name} is in the ledger.`;
}

function transfer(
  state: LootState,
  content: ResolvedContent,
  instanceId: string,
  to: BagKind,
  quantity: number | undefined,
): string {
  const inst = instance(state, instanceId);
  const owner = ownerOf(state, instanceId);
  if (owner.kind === "equipped" || owner.kind === "display" || owner.kind === "trader") {
    throw new LootError("placed", "Take it off the slot or the stall before moving the stack.");
  }
  const qty = quantity ?? inst.quantity;
  const peeled = peel(state, instanceId, qty);
  const moved = instance(state, peeled);
  const def = definition(content, moved.definitionId);
  relocate(state, content, peeled, { kind: to });
  const where = to === "carry" ? "the pack" : to === "stash" ? "the stash" : "the bench";
  return `${qty} ${def.name} moved to ${where}.`;
}

function split(state: LootState, instanceId: string, quantity: number): string {
  const inst = instance(state, instanceId);
  const owner = ownerOf(state, instanceId);
  if (owner.kind === "equipped" || owner.kind === "display") {
    throw new LootError("placed", "That piece is seated. Take it off before splitting the stack.");
  }
  if (quantity >= inst.quantity) throw new LootError("quantity", "Split off less than the whole stack.");
  const id = peel(state, instanceId, quantity);
  return `Split ${quantity} off. The new piece is ${id}.`;
}

function equip(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  if (!def.equipSlot) throw new LootError("no-slot", `${def.name} is not worn.`);
  const owner = ownerOf(state, instanceId);
  if (owner.kind === "equipped" && owner.slot === def.equipSlot) {
    return `${def.name} is already worn.`;
  }
  if (owner.kind !== "carry") {
    throw new LootError("not-in-hand", "Equip it from the pack.");
  }
  if (inst.quantity !== 1) throw new LootError("stack", "Split the stack down to one before wearing it.");
  const slot = def.equipSlot;
  const current = state.equipment[slot];
  if (current && current !== instanceId) {
    state.owners[current] = { kind: "carry" };
    delete state.equipment[slot];
  }
  clearPins(state, instanceId);
  state.owners[instanceId] = { kind: "equipped", slot };
  state.equipment[slot] = instanceId;
  if (def.tags.includes("bladed") || inst.mods.length > 0) {
    emitHandoff(state, inst, def, {
      system: "mastery",
      key: "equipped",
      value: def.id,
      note: "Blade or modified gear is worn. Mastery can read condition, mods, and the preview edge. This core does not resolve a hit.",
    });
  }
  return `${def.name} is worn in the ${slot} slot.`;
}

function unequip(state: LootState, content: ResolvedContent, slot: EquipSlot): string {
  const id = state.equipment[slot];
  if (!id) throw new LootError("empty-slot", `Nothing is in the ${slot} slot.`);
  const def = definition(content, instance(state, id).definitionId);
  state.owners[id] = { kind: "carry" };
  delete state.equipment[slot];
  return `${def.name} comes off the ${slot} slot and returns to the pack.`;
}

function consume(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertInBag(state, instanceId, ["carry"]);
  assertNotEquipped(state, instanceId, "use it up");
  assertLoose(def, inst, "used up");
  if (!def.consumeEffect || !hasEffect(def.consumeEffect)) {
    throw new LootError("no-consume", `${def.name} is not consumed.`);
  }
  const stale = def.condition === "perishable" && (inst.condition ?? 0) <= 0;
  const scale = stale ? 0.5 : 1;
  applyEffect(state, def.consumeEffect, scale);
  if (def.externalRef?.system === "cooking") {
    emitHandoff(state, inst, def, {
      system: "cooking",
      key: "consumed",
      value: def.externalRef.id,
      note: "A dish was eaten from the pack. Cooking owns recipes; this is only the consumed portion.",
    });
  }
  destroyOne(state, instanceId);
  const staleNote = stale ? " It had gone stale, so the effect is halved." : "";
  return `${def.name} is used.${staleNote}`;
}

function read(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertHeld(state, instanceId);
  if (!def.reading) throw new LootError("no-read", `${def.name} has nothing written on it.`);
  inst.flags.read = true;
  const body = def.reading.body.join("\n\n");
  addJournal(state, {
    id: `read:${def.id}`,
    kind: "read",
    title: def.reading.title,
    body,
  });
  if (def.mapMarkers) {
    for (const marker of def.mapMarkers) {
      if (!state.markers.some((have) => have.id === marker.id)) state.markers.push({ ...marker });
    }
  }
  return body;
}

function speak(
  state: LootState,
  content: ResolvedContent,
  instanceId: string,
  characterId: string,
  via: "present" | "gift",
): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  const showFrom: Owner["kind"][] = via === "gift" ? ["carry"] : ["carry", "equipped"];
  assertInBag(state, instanceId, showFrom);
  const beat = chooseBeat(content, characterId, def.id, via, inst, state);
  const character = content.characters.get(characterId);
  if (!character) throw new LootError("no-character", "That person is not in this ledger.");
  if (beat.consumes) {
    assertLoose(def, inst, "given away");
    assertNotEquipped(state, instanceId, "give it");
  }
  const onceKey = `beat:${beat.id}`;
  const repeat = state.flags[onceKey] === true;
  if (beat.consumes) {
    destroyOne(state, instanceId);
  }
  if (beat.consumes || !repeat) {
    if (beat.disposition) {
      state.actor.disposition[characterId] = (state.actor.disposition[characterId] ?? 0) + beat.disposition;
    }
    for (const flag of beat.setFlags ?? []) state.flags[flag] = true;
    if (beat.evidence && def.evidenceId) {
      const evidenceId = `evidence:${def.evidenceId}:${characterId}`;
      if (!state.evidence.some((entry) => entry.id === evidenceId)) {
        const summary = beat.lines[0] ?? def.name;
        state.evidence.unshift({
          id: evidenceId,
          clock: state.clock,
          evidenceId: def.evidenceId,
          definitionId: def.id,
          instanceId,
          characterId,
          summary,
        });
        addJournal(state, {
          id: evidenceId,
          kind: "evidence",
          title: beat.journalTitle,
          body: beat.lines.join("\n\n"),
        });
      }
    } else if (!repeat) {
      addJournal(state, {
        id: beat.consumes ? `gift:${beat.id}:${state.clock}` : `beat:${beat.id}`,
        kind: "note",
        title: beat.journalTitle,
        body: beat.lines.join("\n\n"),
      });
    }
    if (beat.handoff && (beat.consumes || !repeat)) {
      emitHandoff(state, inst, def, beat.handoff);
    }
    state.flags[onceKey] = true;
  }
  return beat.lines.join(" ");
}

function place(state: LootState, content: ResolvedContent, instanceId: string, slotId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertInBag(state, instanceId, ["carry"]);
  if (inst.quantity !== 1) throw new LootError("stack", "Place one. Split the stack first.");
  const slot = content.slots.get(slotId);
  if (!slot) throw new LootError("no-slot", "That display is not in this ledger.");
  if (state.placements[slotId]) throw new LootError("occupied", `${slot.name} already holds something.`);
  const tags = def.placeTags ?? [];
  if (!slot.accepts.some((tag) => tags.includes(tag))) {
    throw new LootError("unfit", `${def.name} does not belong on ${slot.name}.`);
  }
  clearPins(state, instanceId);
  state.owners[instanceId] = { kind: "display", slotId };
  state.placements[slotId] = instanceId;
  if (def.externalRef?.system === "cards") {
    emitHandoff(state, inst, def, {
      system: "cards",
      key: "displayed",
      value: def.externalRef.id,
      note: "A card is on a rail. Card play is another session. This only records the display.",
    });
  }
  return `${def.name} is set on ${slot.name} (${slot.place}).`;
}

function retrieve(state: LootState, content: ResolvedContent, slotId: string): string {
  const id = state.placements[slotId];
  if (!id) throw new LootError("empty-slot", "Nothing is displayed there.");
  const def = definition(content, instance(state, id).definitionId);
  relocate(state, content, id, { kind: "carry" });
  return `${def.name} comes back to the pack.`;
}

function restore(
  state: LootState,
  content: ResolvedContent,
  restorationId: string,
  targetInstanceId: string,
): string {
  const spec = content.restorations.get(restorationId);
  if (!spec) throw new LootError("no-recipe", "That restoration is not in this ledger.");
  const inst = instance(state, targetInstanceId);
  const def = definition(content, inst.definitionId);
  if (inst.definitionId !== spec.targetDefinitionId) {
    throw new LootError("wrong-target", `${spec.name} does not work on ${def.name}.`);
  }
  if (inst.condition == null) throw new LootError("no-condition", `${def.name} has no condition to restore.`);
  if (inst.condition >= 100) throw new LootError("pristine", `${def.name} does not need work.`);
  assertWorkable(state, targetInstanceId);
  requireMaterials(state, content, spec.inputs);
  if (spec.toolDefinitionId) requireTool(state, content, spec.toolDefinitionId);
  consumeMaterials(state, spec.inputs);
  if (spec.toolDefinitionId) wearTool(state, content, spec.toolDefinitionId, spec.toolWear ?? 0);
  const before = inst.condition;
  inst.condition = clamp(inst.condition + spec.restoreAmount);
  return `${def.name} is worked at the bench (${before} to ${inst.condition}). ${spec.note}`;
}

function modify(
  state: LootState,
  content: ResolvedContent,
  modificationId: string,
  targetInstanceId: string,
): string {
  const spec = content.modifications.get(modificationId);
  if (!spec) throw new LootError("no-mod", "That modification is not in this ledger.");
  const inst = instance(state, targetInstanceId);
  const def = definition(content, inst.definitionId);
  assertWorkable(state, targetInstanceId);
  if (!spec.targetTags.some((tag) => def.tags.includes(tag))) {
    throw new LootError("unfit", `${def.name} does not take ${spec.name}.`);
  }
  if (inst.mods.includes(spec.id)) {
    throw new LootError("already-modified", `${def.name} already has ${spec.name}.`);
  }
  requireMaterials(state, content, [spec.kit]);
  consumeMaterials(state, [spec.kit]);
  inst.mods.push(spec.id);
  inst.modEdge += spec.edgeDelta ?? 0;
  if (inst.condition != null) inst.condition = clamp(inst.condition + spec.conditionDelta);
  emitHandoff(state, inst, def, {
    system: "mastery",
    key: spec.masteryTag,
    value: spec.id,
    note: spec.note,
  });
  return `${spec.name} is on ${def.name}. ${spec.note}`;
}

function dismantle(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertLoose(def, inst, "broken down");
  const owner = ownerOf(state, instanceId);
  if (owner.kind !== "carry" && owner.kind !== "bench" && owner.kind !== "stash") {
    throw new LootError("placed", "Put it in the pack, the stash, or on the bench before salvaging it.");
  }
  assertNotEquipped(state, instanceId, "salvage it");
  if (!def.dismantle || def.dismantle.length === 0) {
    throw new LootError("no-yield", `${def.name} does not come apart into anything useful.`);
  }
  const bag = owner.kind;
  const one = peel(state, instanceId, 1);
  const sourceFrom = instance(state, one).definitionId;
  deleteInstance(state, one);
  const names: string[] = [];
  for (const yieldItem of def.dismantle) {
    const yielded = definition(content, yieldItem.definitionId);
    grantItem(state, content, {
      definitionId: yieldItem.definitionId,
      quantity: yieldItem.quantity,
      owner: { kind: bag },
      source: {
        kind: "dismantle",
        note: `Salvaged from ${def.name}.`,
        fromIds: [sourceFrom],
      },
    });
    names.push(`${yieldItem.quantity} ${yielded.name}`);
  }
  return `Salvaged ${def.name} into ${names.join(", ")}.`;
}

function craft(state: LootState, content: ResolvedContent, recipeId: string): string {
  const recipe = content.recipes.get(recipeId);
  if (!recipe) throw new LootError("no-recipe", "That recipe is not in this ledger.");
  if (recipe.station !== "bench") throw new LootError("station", "Only the bench is available.");
  requireMaterials(state, content, recipe.inputs);
  if (recipe.toolDefinitionId) requireTool(state, content, recipe.toolDefinitionId);
  const fromIds = recipe.inputs.map((input) => input.definitionId);
  consumeMaterials(state, recipe.inputs);
  if (recipe.toolDefinitionId) wearTool(state, content, recipe.toolDefinitionId, recipe.toolWear ?? 0);
  const output = definition(content, recipe.output.definitionId);
  grantItem(state, content, {
    definitionId: output.id,
    quantity: recipe.output.quantity,
    condition: recipe.output.condition,
    owner: { kind: "bench" },
    source: {
      kind: "craft",
      note: recipe.note,
      fromIds,
    },
  });
  return `${output.name} is on the bench. ${recipe.note}`;
}

function rig(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertHeld(state, instanceId);
  if (!def.rig) throw new LootError("no-rig", `${def.name} is not field tackle.`);
  if (inst.flags.fieldReady && inst.quantity === 1) {
    throw new LootError("already-rigged", `${def.name} is already field-ready.`);
  }
  const oneId = inst.quantity > 1 ? peel(state, instanceId, 1) : instanceId;
  const one = instance(state, oneId);
  if (one.flags.fieldReady) throw new LootError("already-rigged", `${def.name} is already field-ready.`);
  one.flags.fieldReady = true;
  emitHandoff(state, one, def, def.rig);
  return `${def.name} is field-ready. ${def.rig.note}`;
}

function consult(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertHeld(state, instanceId);
  if (!def.consult) throw new LootError("no-consult", `${def.name} has nothing to consult.`);
  if (def.consult.requiresPlaced && ownerOf(state, instanceId).kind !== "display") {
    throw new LootError("not-placed", `Set ${def.name} in its place first.`);
  }
  const flag = def.consult.flag ?? `consult:${def.id}`;
  if (!def.consult.repeat && state.flags[flag] === true) {
    return `${def.consult.title} is already in the journal.`;
  }
  const hour = (state.clock % 12) + 1;
  const body = def.consult.body.replaceAll("{hour}", String(hour));
  addJournal(state, {
    id: def.consult.repeat ? `consult:${def.id}:${state.clock}` : `consult:${def.id}`,
    kind: "consult",
    title: def.consult.title,
    body,
  });
  state.flags[flag] = true;
  return body;
}

function unlock(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertHeld(state, instanceId);
  if (!def.unlockFlag || !def.unlockNote) throw new LootError("no-unlock", `${def.name} unlocks nothing.`);
  const already = state.flags[def.unlockFlag] === true;
  state.flags[def.unlockFlag] = true;
  if (!already) {
    addJournal(state, {
      id: `unlock:${def.unlockFlag}`,
      kind: "note",
      title: def.name,
      body: def.unlockNote,
    });
  }
  return already ? `${def.name} has already done that. The flag still stands, and the key is still here.` : def.unlockNote;
}

function catalogNote(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertHeld(state, instanceId);
  if (!def.catalogNote) throw new LootError("no-note", `${def.name} has no catalog entry.`);
  const id = `catalog:${def.id}`;
  if (state.flags[id] === true) return `${def.catalogNote.title} is already catalogued.`;
  state.flags[id] = true;
  addJournal(state, {
    id,
    kind: "note",
    title: def.catalogNote.title,
    body: def.catalogNote.body,
  });
  return def.catalogNote.body;
}

function ford(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  if (!def.ford) throw new LootError("no-ford", `${def.name} does not ford water.`);
  const owner = ownerOf(state, instanceId);
  if (owner.kind !== "equipped") throw new LootError("not-worn", "Put them on before stepping into the creek.");
  const already = state.flags[def.ford.flag] === true;
  state.flags[def.ford.flag] = true;
  if (!already) {
    addJournal(state, {
      id: `ford:${def.ford.flag}`,
      kind: "note",
      title: def.name,
      body: def.ford.note,
    });
  }
  return already ? "The ford is already in the ledger. The boots are still on Ellis's feet." : def.ford.note;
}

function trade(state: LootState, content: ResolvedContent, action: Extract<LootAction, { type: "trade" }>): string {
  if (action.give.length === 0 && action.take.length === 0) {
    throw new LootError("empty-trade", "Offer something or take something.");
  }
  if (action.purse < 0) throw new LootError("purse", "Coins offered cannot be negative.");
  if (action.purse > state.purse) throw new LootError("purse", "Ellis does not have those coppers.");

  let giveValue = 0;
  for (const row of action.give) {
    const inst = instance(state, row.instanceId);
    const def = definition(content, inst.definitionId);
    assertLoose(def, inst, "sold");
    if (ownerOf(state, inst.id).kind !== "carry") {
      throw new LootError("not-in-hand", `${def.name} has to be in the pack to sell.`);
    }
    assertNotEquipped(state, inst.id, "sell it");
    if (!content.trader.buys.includes(def.category)) {
      throw new LootError("refused", content.trader.refusesNote);
    }
    if (row.quantity < 1 || row.quantity > inst.quantity) {
      throw new LootError("quantity", `Cannot sell that many ${def.name}.`);
    }
    giveValue += unitValue(def, inst.condition) * row.quantity;
  }

  let takeValue = 0;
  let takeWeight = 0;
  for (const row of action.take) {
    const inst = instance(state, row.instanceId);
    const def = definition(content, inst.definitionId);
    if (ownerOf(state, inst.id).kind !== "trader") {
      throw new LootError("not-stock", `${def.name} is not on the stall.`);
    }
    if (row.quantity < 1 || row.quantity > inst.quantity) {
      throw new LootError("quantity", `The stall does not have that many ${def.name}.`);
    }
    takeValue += unitValue(def, inst.condition) * row.quantity;
    takeWeight += def.weight * row.quantity;
  }

  const delta = giveValue + action.purse - takeValue;
  if (delta < 0) {
    throw new LootError("short", `Short ${-delta} coppers. ${content.trader.name} does not run a tab.`);
  }
  if (delta > state.traderPurse) {
    throw new LootError("no-change", `${content.trader.name} cannot pay ${delta} coppers.`);
  }

  const soldIds: string[] = [];
  for (const row of action.give) {
    soldIds.push(peel(state, row.instanceId, row.quantity));
  }
  for (const id of soldIds) {
    const inst = instance(state, id);
    inst.source = {
      kind: "trade",
      clock: state.clock,
      note: `Sold to ${content.trader.name}.`,
      fromIds: [inst.definitionId],
    };
    relocate(state, content, id, { kind: "trader" });
  }

  const freed = carryWeight(state, content);
  if (freed + takeWeight > carryLimit(state, content) + 0.05) {
    throw new LootError(
      "overweight",
      `Buying that would load ${round1(freed + takeWeight)} lb. The limit is ${carryLimit(state, content)} lb.`,
    );
  }

  for (const row of action.take) {
    const bought = peel(state, row.instanceId, row.quantity);
    const inst = instance(state, bought);
    inst.source = {
      kind: "trade",
      clock: state.clock,
      note: `Bought from ${content.trader.name}.`,
      fromIds: [inst.definitionId],
    };
    relocate(state, content, bought, { kind: "carry" });
  }

  state.purse = state.purse - action.purse + delta;
  state.traderPurse = state.traderPurse + action.purse - delta;
  return `Trade with ${content.trader.name} settles. Ellis has ${state.purse} coppers.`;
}

function discard(state: LootState, content: ResolvedContent, instanceId: string, quantity?: number): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  assertLoose(def, inst, "destroyed");
  const owner = ownerOf(state, instanceId);
  if (owner.kind === "equipped" || owner.kind === "display" || owner.kind === "trader") {
    throw new LootError("placed", "It is not loose in a bag.");
  }
  const qty = quantity ?? inst.quantity;
  if (qty < 1 || qty > inst.quantity) throw new LootError("quantity", "That quantity is not there.");
  const one = peel(state, instanceId, qty);
  deleteInstance(state, one);
  return `Destroyed ${qty} ${def.name}. The source was ${inst.source.kind}. This was deliberate, not a death.`;
}

function releaseQuest(state: LootState, content: ResolvedContent, instanceId: string): string {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  const protection = protectionOf(def, inst);
  if (protection === "essential") {
    throw new LootError("protected", `${def.name} is essential. The quest release does not apply.`);
  }
  if (protection !== "quest") throw new LootError("not-bound", `${def.name} is not quest-bound.`);
  if (!def.releaseWhenFlag || state.flags[def.releaseWhenFlag] !== true) {
    throw new LootError("still-bound", `${def.name} is still bound. Finish what it is for, then release it.`);
  }
  inst.protection = "none";
  return `${def.name} is released. It can now be sold or destroyed on purpose. It was not dropped.`;
}

function noteDeath(state: LootState, cause: string): string {
  const before = playerIds(state);
  const beforeQty = quantitySnapshot(state);
  state.actor.warmth = clamp(state.actor.warmth - 15);
  const after = playerIds(state);
  const afterQty = quantitySnapshot(state);
  if (before.join("|") !== after.join("|") || beforeQty !== afterQty) {
    throw new LootError("death-invariant", "Death tried to change the collection and was refused.");
  }
  state.deaths.unshift({
    id: `death-${state.clock}`,
    clock: state.clock,
    cause,
    instanceIds: after,
    pieceCount: after.length,
  });
  const body = `Ellis dies (${cause}). Pieces before ${before.length}, pieces after ${after.length}. Quantities unchanged. The collection stays with Ellis.`;
  addJournal(state, {
    id: `death-${state.clock}`,
    kind: "death",
    title: "Death did not clear the pack",
    body,
  });
  return body;
}

function passEvening(state: LootState, content: ResolvedContent): string {
  let aged = 0;
  for (const inst of Object.values(state.instances)) {
    const owner = state.owners[inst.id];
    if (!owner || owner.kind === "trader") continue;
    const def = content.definitions.get(inst.definitionId);
    if (!def || def.condition !== "perishable" || inst.condition == null) continue;
    inst.condition = clamp(inst.condition - 12);
    aged += 1;
  }
  state.actor.light = clamp(state.actor.light - 20);
  state.actor.satiety = clamp(state.actor.satiety - 8);
  return `An evening passes by choice. ${aged} perishable stack${aged === 1 ? "" : "s"} age. Nothing is discarded.`;
}

function chooseBeat(
  content: ResolvedContent,
  characterId: string,
  definitionId: string,
  via: "present" | "gift",
  inst: ItemInstance,
  state: LootState,
): CharacterBeat {
  const character = content.characters.get(characterId);
  if (!character) throw new LootError("no-character", "That person is not in this ledger.");
  const beats = character.beats.filter((beat) => beat.definitionId === definitionId && beat.via === via);
  if (beats.length === 0) {
    const verb = via === "gift" ? "take this as a gift" : "be shown this";
    throw new LootError("no-beat", `${character.name} will not ${verb}.`);
  }
  const ready = beats.filter((beat) => beatBlock(beat, inst, state) === null);
  if (ready.length === 0) {
    throw new LootError("not-ready", beatBlock(beats[0]!, inst, state) ?? "Not ready.");
  }
  ready.sort((a, b) => beatScore(b) - beatScore(a));
  return ready[0]!;
}

function beatBlock(beat: CharacterBeat, inst: ItemInstance, state: LootState): string | null {
  if (beat.requiresRead && !inst.flags.read) return "Read it before showing it.";
  for (const flag of beat.requiresFlags ?? []) {
    if (state.flags[flag] !== true) return "The ledger is not ready for that conversation.";
  }
  return null;
}

function beatScore(beat: CharacterBeat): number {
  return (beat.requiresRead ? 2 : 0) + (beat.requiresFlags?.length ?? 0);
}

function requireMaterials(
  state: LootState,
  content: ResolvedContent,
  inputs: { definitionId: string; quantity: number }[],
) {
  for (const input of inputs) {
    const have = countOwned(state, input.definitionId, HAND);
    if (have >= input.quantity) continue;
    const def = content.definitions.get(input.definitionId);
    const name = def?.name ?? input.definitionId;
    const stashed = countOwned(state, input.definitionId, ["stash"]);
    if (stashed > 0 && have + stashed >= input.quantity) {
      throw new LootError("materials", `${name} is in the stash. Put it in the pack or on the bench.`);
    }
    throw new LootError("materials", `Need ${input.quantity} ${name}. ${have} at hand.`);
  }
}

function consumeMaterials(state: LootState, inputs: { definitionId: string; quantity: number }[]) {
  for (const input of inputs) consumeKind(state, input.definitionId, input.quantity, HAND);
}

function requireTool(state: LootState, content: ResolvedContent, definitionId: string) {
  if (!findTool(state, definitionId)) {
    const def = content.definitions.get(definitionId);
    throw new LootError("tool", `${def?.name ?? definitionId} is not at hand.`);
  }
}

function wearTool(state: LootState, content: ResolvedContent, definitionId: string, wear: number) {
  const tool = findTool(state, definitionId);
  if (!tool) {
    const def = content.definitions.get(definitionId);
    throw new LootError("tool", `${def?.name ?? definitionId} is not at hand.`);
  }
  if (wear > 0 && tool.condition != null) tool.condition = clamp(tool.condition - wear);
}

function findTool(state: LootState, definitionId: string): ItemInstance | null {
  const found = Object.values(state.instances).filter((inst) => {
    if (inst.definitionId !== definitionId) return false;
    const kind = state.owners[inst.id]?.kind;
    return kind === "carry" || kind === "bench" || kind === "equipped";
  });
  found.sort((a, b) => a.id.localeCompare(b.id));
  return found[0] ?? null;
}

function consumeKind(state: LootState, definitionId: string, quantity: number, kinds: Owner["kind"][]) {
  let left = quantity;
  const ids = Object.values(state.instances)
    .filter((inst) => inst.definitionId === definitionId && kinds.includes(state.owners[inst.id]?.kind ?? "carry"))
    .map((inst) => inst.id)
    .sort();
  for (const id of ids) {
    if (left <= 0) break;
    const inst = state.instances[id];
    if (!inst) continue;
    const take = Math.min(inst.quantity, left);
    if (take === inst.quantity) deleteInstance(state, id);
    else inst.quantity -= take;
    left -= take;
  }
  if (left > 0) throw new LootError("materials", "The materials were not there when the bench reached for them.");
}

function destroyOne(state: LootState, instanceId: string) {
  const inst = instance(state, instanceId);
  if (inst.quantity > 1) inst.quantity -= 1;
  else deleteInstance(state, instanceId);
}

function peel(state: LootState, instanceId: string, quantity: number): string {
  const inst = instance(state, instanceId);
  if (quantity < 1 || quantity > inst.quantity) {
    throw new LootError("quantity", "That quantity is not in the stack.");
  }
  if (quantity === inst.quantity) return instanceId;
  inst.quantity -= quantity;
  const id = takeId(state);
  const source: SourceRecord = {
    kind: "split",
    clock: state.clock,
    note: `Split from ${instanceId}.`,
    fromIds: [instanceId],
  };
  state.instances[id] = {
    ...inst,
    id,
    quantity,
    mods: [...inst.mods],
    flags: { ...inst.flags },
    source,
  };
  const owner = state.owners[instanceId];
  if (!owner) throw new LootError("missing", "That piece has no owner.");
  state.owners[id] = owner.kind === "equipped" || owner.kind === "display" ? { ...owner } : { ...owner };
  return id;
}

function relocate(state: LootState, content: ResolvedContent, instanceId: string, owner: Owner) {
  const inst = instance(state, instanceId);
  const def = definition(content, inst.definitionId);
  const current = state.owners[instanceId];
  const alreadyCarried = current?.kind === "carry" || current?.kind === "equipped";
  const willCarry = owner.kind === "carry" || owner.kind === "equipped";
  if (willCarry && !alreadyCarried) {
    assertFits(state, content, owner, def.weight * inst.quantity);
  }
  clearPins(state, instanceId);
  state.owners[instanceId] = owner;
  if (owner.kind === "equipped") state.equipment[owner.slot] = instanceId;
  if (owner.kind === "display") state.placements[owner.slotId] = instanceId;
  if (owner.kind !== "equipped" && owner.kind !== "display") mergeInto(state, content, instanceId);
}

function mergeInto(state: LootState, content: ResolvedContent, instanceId: string) {
  const inst = state.instances[instanceId];
  const owner = state.owners[instanceId];
  if (!inst || !owner) return;
  const def = definition(content, inst.definitionId);
  for (const other of Object.values(state.instances)) {
    if (other.id === instanceId) continue;
    if (!compatible(other, inst)) continue;
    const otherOwner = state.owners[other.id];
    if (!otherOwner || !samePlace(otherOwner, owner)) continue;
    if (other.quantity + inst.quantity > def.stackLimit) continue;
    other.quantity += inst.quantity;
    deleteInstance(state, instanceId);
    return;
  }
}

function deleteInstance(state: LootState, id: string) {
  clearPins(state, id);
  delete state.instances[id];
  delete state.owners[id];
}

function clearPins(state: LootState, id: string) {
  for (const slot of EQUIP_SLOTS) {
    if (state.equipment[slot] === id) delete state.equipment[slot];
  }
  for (const [slotId, instId] of Object.entries(state.placements)) {
    if (instId === id) delete state.placements[slotId];
  }
}

function assertFits(state: LootState, content: ResolvedContent, owner: Owner, extra: number) {
  if (owner.kind !== "carry" && owner.kind !== "equipped") return;
  const next = carryWeight(state, content) + extra;
  const limit = carryLimit(state, content);
  if (next > limit + 0.05) {
    throw new LootError(
      "overweight",
      `That would load ${round1(next)} lb. Ellis can carry ${limit} lb.`,
    );
  }
}

function assertLoose(def: ItemDefinition, inst: ItemInstance, verb: string) {
  const protection = protectionOf(def, inst);
  if (protection === "essential") {
    throw new LootError("protected", `${def.name} is essential. It cannot be ${verb}.`);
  }
  if (protection === "quest") {
    throw new LootError("protected", `${def.name} is still on a quest. It cannot be ${verb}.`);
  }
}

function assertNotEquipped(state: LootState, id: string, verb: string) {
  if (state.owners[id]?.kind === "equipped") {
    throw new LootError("equipped", `Unequip it before you ${verb}.`);
  }
}

function assertHeld(state: LootState, id: string) {
  const kind = state.owners[id]?.kind;
  if (!kind || kind === "trader") throw new LootError("not-held", "Ellis does not have that.");
}

function assertWorkable(state: LootState, id: string) {
  const kind = state.owners[id]?.kind;
  if (kind === "carry" || kind === "bench" || kind === "equipped") return;
  if (kind === "stash") throw new LootError("stashed", "Bring it out of the stash first.");
  if (kind === "display") throw new LootError("displayed", "Take it down before working it.");
  throw new LootError("not-held", "Ellis does not have that.");
}

function assertInBag(state: LootState, id: string, kinds: Owner["kind"][]) {
  const kind = state.owners[id]?.kind;
  if (!kind || !kinds.includes(kind)) {
    throw new LootError("not-in-hand", "It is not where that action can reach it.");
  }
}

function applyEffect(state: LootState, effect: Effect, scale: number) {
  if (effect.satiety) state.actor.satiety = clamp(state.actor.satiety + effect.satiety * scale);
  if (effect.warmth) state.actor.warmth = clamp(state.actor.warmth + effect.warmth * scale);
  if (effect.light) state.actor.light = clamp(state.actor.light + effect.light * scale);
  if (effect.calm) state.actor.calm = clamp(state.actor.calm + effect.calm * scale);
}

function hasEffect(effect: Effect): boolean {
  return [effect.satiety, effect.warmth, effect.light, effect.calm].some((value) => !!value);
}

function emitHandoff(state: LootState, inst: ItemInstance, def: ItemDefinition, spec: HandoffSpec) {
  state.handoffs.unshift({
    id: `h-${state.clock}-${state.handoffs.length}`,
    clock: state.clock,
    system: spec.system,
    key: spec.key,
    value: spec.value,
    definitionId: def.id,
    instanceId: inst.id,
    note: spec.note,
  });
  if (state.handoffs.length > 80) state.handoffs.length = 80;
}

function addJournal(state: LootState, entry: Omit<JournalEntry, "clock">): boolean {
  if (state.journal.some((have) => have.id === entry.id)) return false;
  state.journal.unshift({ ...entry, clock: state.clock });
  return true;
}

function resolveCondition(def: ItemDefinition, requested: number | null | undefined): number | null {
  if (def.condition === "none") {
    if (requested != null) throw new LootError("condition", `${def.name} has no condition.`);
    return null;
  }
  if (requested == null) return 100;
  if (requested < 0 || requested > 100) throw new LootError("condition", "Condition has to sit between 0 and 100.");
  return Math.round(requested);
}

function compatible(a: ItemInstance, b: ItemInstance): boolean {
  return (
    a.definitionId === b.definitionId &&
    a.condition === b.condition &&
    a.protection === b.protection &&
    a.modEdge === b.modEdge &&
    a.flags.read === b.flags.read &&
    a.flags.fieldReady === b.flags.fieldReady &&
    a.mods.length === b.mods.length &&
    [...a.mods].sort().join("|") === [...b.mods].sort().join("|")
  );
}

function samePlace(a: Owner, b: Owner): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "equipped" && b.kind === "equipped") return a.slot === b.slot;
  if (a.kind === "display" && b.kind === "display") return a.slotId === b.slotId;
  return true;
}

function playerIds(state: LootState): string[] {
  return Object.values(state.instances)
    .filter((inst) => state.owners[inst.id]?.kind !== "trader")
    .map((inst) => inst.id)
    .sort();
}

function quantitySnapshot(state: LootState): string {
  return playerIds(state)
    .map((id) => `${id}:${state.instances[id]?.quantity ?? 0}`)
    .join("|");
}

function instance(state: LootState, id: string): ItemInstance {
  const inst = state.instances[id];
  if (!inst) throw new LootError("missing", "That piece is not in the ledger.");
  return inst;
}

function ownerOf(state: LootState, id: string): Owner {
  const owner = state.owners[id];
  if (!owner) throw new LootError("missing", "That piece has no owner.");
  return owner;
}

function definition(content: ResolvedContent, id: string): ItemDefinition {
  const def = content.definitions.get(id);
  if (!def) throw new LootError("unknown-item", `No definition for ${id}.`);
  return def;
}

function takeId(state: LootState): string {
  const id = `inst-${state.idCounter}`;
  state.idCounter += 1;
  return id;
}

function assertNever(value: never): never {
  throw new LootError("bad-action", `Unknown action ${(value as { type?: string }).type ?? ""}.`);
}
