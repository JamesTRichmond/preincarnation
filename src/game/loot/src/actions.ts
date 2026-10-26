import { countOwned, protectionOf } from "./state.ts";
import type {
  EquipSlot,
  ItemDefinition,
  LootAction,
  LootState,
  ResolvedContent,
} from "./types.ts";

export interface AvailableAction {
  id: string;
  label: string;
  detail: string;
  enabled: boolean;
  reason?: string;
  action?: LootAction;
}

export function listActions(state: LootState, content: ResolvedContent, instanceId: string): AvailableAction[] {
  const inst = state.instances[instanceId];
  if (!inst) return [];
  const def = content.definitions.get(inst.definitionId);
  const owner = state.owners[instanceId];
  if (!def || !owner || owner.kind === "trader") return [];
  const actions: AvailableAction[] = [];

  const push = (action: AvailableAction) => actions.push(action);

  if (owner.kind === "equipped") {
    push(act(`unequip-${owner.slot}`, "Take off", "Returns it to the pack.", true, undefined, {
      type: "unequip",
      slot: owner.slot,
    }));
  }

  if (def.equipSlot && owner.kind === "carry") {
    const stackBlocked = inst.quantity !== 1;
    push(
      act(
        "equip",
        `Wear (${def.equipSlot})`,
        "Puts it in that slot. Replaces anything already there.",
        !stackBlocked,
        stackBlocked ? "Split the stack down to one first." : undefined,
        { type: "equip", instanceId },
      ),
    );
  }

  if (owner.kind === "carry") {
    push(move("stash", "Stash", instanceId));
    push(move("bench", "Put on the bench", instanceId));
  } else if (owner.kind === "stash" || owner.kind === "bench") {
    push(move("carry", "Back to the pack", instanceId));
  }

  if (inst.quantity > 1 && owner.kind !== "equipped" && owner.kind !== "display") {
    push(act("split", "Split one off", "Makes a separate piece with the same source lineage.", true, undefined, {
      type: "split",
      instanceId,
      quantity: 1,
    }));
  }

  for (const use of def.uses) {
    if (use.handler === "consume") {
      const inPack = owner.kind === "carry";
      push(act("consume", use.label, use.detail, inPack, inPack ? undefined : "It has to be in the pack.", {
        type: "consume",
        instanceId,
      }));
    }
    if (use.handler === "read") {
      push(act("read", use.label, use.detail, true, undefined, { type: "read", instanceId }));
    }
    if (use.handler === "consult") {
      const placedOk = !def.consult?.requiresPlaced || owner.kind === "display";
      push(
        act("consult", use.label, use.detail, placedOk, placedOk ? undefined : "Set it in its place first.", {
          type: "consult",
          instanceId,
        }),
      );
    }
    if (use.handler === "unlock") {
      push(act("unlock", use.label, use.detail, true, undefined, { type: "unlock", instanceId }));
    }
    if (use.handler === "catalog-note") {
      push(act("catalog", use.label, use.detail, true, undefined, { type: "catalog-note", instanceId }));
    }
    if (use.handler === "ford") {
      const worn = owner.kind === "equipped";
      push(act("ford", use.label, use.detail, worn, worn ? undefined : "Put them on first.", {
        type: "ford",
        instanceId,
      }));
    }
    if (use.handler === "rig") {
      push(act("rig", use.label, use.detail, true, undefined, { type: "rig", instanceId }));
    }
    if (use.handler === "dismantle") {
      const loose = owner.kind === "carry" || owner.kind === "bench" || owner.kind === "stash";
      const protection = protectionOf(def, inst);
      const enabled = loose && protection === "none";
      push(
        act(
          "dismantle",
          "Salvage",
          use.detail,
          enabled,
          !loose ? "Put it in a bag first." : protection !== "none" ? protectionReason(def, protection) : undefined,
          { type: "dismantle", instanceId },
        ),
      );
    }
    if (use.handler === "place" && owner.kind === "carry" && inst.quantity === 1) {
      for (const slot of content.slots.values()) {
        const fits = slot.accepts.some((tag) => def.placeTags?.includes(tag));
        if (!fits) continue;
        const free = !state.placements[slot.id];
        push(
          act(
            `place-${slot.id}`,
            `Place on ${slot.name}`,
            use.detail,
            free,
            free ? undefined : `${slot.name} is taken.`,
            { type: "place", instanceId, slotId: slot.id },
          ),
        );
      }
    }
    if (use.handler === "present" || use.handler === "gift") {
      const via = use.handler === "gift" ? "gift" : "present";
      for (const character of content.characters.values()) {
        const beats = character.beats.filter((beat) => beat.definitionId === def.id && beat.via === via);
        if (beats.length === 0) continue;
        const inReach = via === "gift" ? owner.kind === "carry" : owner.kind === "carry" || owner.kind === "equipped";
        push(
          act(
            `${via}-${character.id}`,
            `${via === "gift" ? "Give to" : "Show"} ${character.name}`,
            use.detail,
            inReach,
            inReach ? undefined : "Have it in hand.",
            via === "gift"
              ? { type: "gift", instanceId, characterId: character.id }
              : { type: "present", instanceId, characterId: character.id },
          ),
        );
      }
    }
  }

  if (owner.kind === "display") {
    const slotId = owner.slotId;
    const slot = content.slots.get(slotId);
    push(
      act("retrieve", `Take down from ${slot?.name ?? "display"}`, "Returns it to the pack.", true, undefined, {
        type: "retrieve",
        slotId,
      }),
    );
  }

  for (const restoration of content.restorations.values()) {
    if (restoration.targetDefinitionId !== def.id) continue;
    const workable = owner.kind === "carry" || owner.kind === "bench" || owner.kind === "equipped";
    const pristine = inst.condition == null || inst.condition >= 100;
    const missing = missingMaterial(state, content, restoration.inputs);
    const tool = restoration.toolDefinitionId
      ? toolReady(state, restoration.toolDefinitionId)
      : true;
    const enabled = workable && !pristine && !missing && tool;
    const reason = !workable
      ? "Bring it to the bench."
      : pristine
        ? "It does not need work."
        : missing
          ? missing
          : !tool
            ? "The tool is not at hand."
            : undefined;
    push(
      act(`restore-${restoration.id}`, restoration.name, restoration.note, enabled, reason, {
        type: "restore",
        restorationId: restoration.id,
        targetInstanceId: instanceId,
      }),
    );
  }

  for (const mod of content.modifications.values()) {
    if (!mod.targetTags.some((tag) => def.tags.includes(tag))) continue;
    const already = inst.mods.includes(mod.id);
    const workable = owner.kind === "carry" || owner.kind === "bench" || owner.kind === "equipped";
    const missing = missingMaterial(state, content, [mod.kit]);
    const enabled = workable && !already && !missing;
    push(
      act(
        `mod-${mod.id}`,
        mod.name,
        mod.note,
        enabled,
        already ? "Already applied." : !workable ? "Bring it to the bench." : missing || undefined,
        { type: "modify", modificationId: mod.id, targetInstanceId: instanceId },
      ),
    );
  }

  for (const mod of content.modifications.values()) {
    if (mod.kit.definitionId !== def.id) continue;
    const targets = Object.values(state.instances).filter((candidate) => {
      if (candidate.id === instanceId) return false;
      const candidateDef = content.definitions.get(candidate.definitionId);
      const candidateOwner = state.owners[candidate.id];
      if (!candidateDef || !candidateOwner) return false;
      if (!mod.targetTags.some((tag) => candidateDef.tags.includes(tag))) return false;
      if (candidate.mods.includes(mod.id)) return false;
      return candidateOwner.kind === "carry" || candidateOwner.kind === "bench" || candidateOwner.kind === "equipped";
    });
    if (targets.length === 0) {
      push(act(`kit-${mod.id}`, mod.name, mod.note, false, "No fitting piece is at the bench.", undefined));
      continue;
    }
    for (const target of targets) {
      const targetDef = content.definitions.get(target.definitionId);
      const have = countOwned(state, def.id, ["carry", "bench"]);
      const enabled = have >= mod.kit.quantity;
      push(
        act(
          `kit-${mod.id}-${target.id}`,
          `${mod.name} on ${targetDef?.name ?? "piece"}`,
          mod.note,
          enabled,
          enabled ? undefined : "Not enough of the kit at hand.",
          { type: "modify", modificationId: mod.id, targetInstanceId: target.id },
        ),
      );
    }
  }

  const protection = protectionOf(def, inst);
  if (protection === "quest") {
    const ready = !!def.releaseWhenFlag && state.flags[def.releaseWhenFlag] === true;
    push(
      act(
        "release",
        "Release from the quest",
        "Only after its work is done. Essential pieces never release.",
        ready,
        ready ? undefined : "It is still bound.",
        { type: "releaseQuest", instanceId },
      ),
    );
  }

  const loose = owner.kind === "carry" || owner.kind === "stash" || owner.kind === "bench";
  push(
    act(
      "discard",
      "Destroy",
      "Deliberate. Death will not do this.",
      loose && protection === "none",
      !loose ? "It is seated or worn." : protection !== "none" ? protectionReason(def, protection) : undefined,
      { type: "discard", instanceId, quantity: 1 },
    ),
  );

  return dedupe(actions);
}

export interface BenchOffer {
  id: string;
  label: string;
  detail: string;
  enabled: boolean;
  reason?: string;
  action: LootAction;
}

export function listBench(state: LootState, content: ResolvedContent): BenchOffer[] {
  const offers: BenchOffer[] = [];
  for (const recipe of content.recipes.values()) {
    const missing = missingMaterial(state, content, recipe.inputs);
    const tool = recipe.toolDefinitionId ? toolReady(state, recipe.toolDefinitionId) : true;
    const enabled = !missing && tool;
    offers.push({
      id: recipe.id,
      label: recipe.name,
      detail: recipe.note,
      enabled,
      reason: missing || (!tool ? "The tool is not at hand." : undefined),
      action: { type: "craft", recipeId: recipe.id },
    });
  }
  return offers;
}

export function listSell(
  state: LootState,
  content: ResolvedContent,
  instanceId: string,
): AvailableAction | null {
  const inst = state.instances[instanceId];
  const def = inst ? content.definitions.get(inst.definitionId) : undefined;
  const owner = state.owners[instanceId];
  if (!inst || !def || owner?.kind !== "carry") return null;
  const protection = protectionOf(def, inst);
  const bought = content.trader.buys.includes(def.category);
  const enabled = protection === "none" && bought;
  const reason =
    protection !== "none" ? protectionReason(def, protection) : !bought ? content.trader.refusesNote : undefined;
  return act("sell", `Sell one to ${content.trader.name}`, "Coppers move. The piece changes owner.", enabled, reason, {
    type: "trade",
    give: [{ instanceId, quantity: 1 }],
    take: [],
    purse: 0,
  });
}

export function listBuy(state: LootState, content: ResolvedContent, instanceId: string): AvailableAction | null {
  const inst = state.instances[instanceId];
  const def = inst ? content.definitions.get(inst.definitionId) : undefined;
  if (!inst || !def || state.owners[instanceId]?.kind !== "trader") return null;
  const price = Math.max(0, Math.round(def.value * (inst.condition == null ? 1 : 0.45 + 0.55 * (inst.condition / 100))));
  const enabled = state.purse >= price;
  return act(
    "buy",
    `Buy one (${price} coppers)`,
    "Pays the stall and puts it in the pack.",
    enabled,
    enabled ? undefined : "Not enough coppers.",
    { type: "trade", give: [], take: [{ instanceId, quantity: 1 }], purse: price },
  );
}

function move(to: "carry" | "stash" | "bench", label: string, instanceId: string): AvailableAction {
  const detail =
    to === "stash"
      ? "Stash does not count toward carry weight. Death does not empty it."
      : to === "bench"
        ? "The bench can spend what is sitting on it."
        : "Back into what Ellis is carrying.";
  return act(`to-${to}`, label, detail, true, undefined, { type: "transfer", instanceId, to });
}

function missingMaterial(
  state: LootState,
  content: ResolvedContent,
  inputs: { definitionId: string; quantity: number }[],
): string | undefined {
  for (const input of inputs) {
    const have = countOwned(state, input.definitionId, ["carry", "bench"]);
    if (have >= input.quantity) continue;
    const name = content.definitions.get(input.definitionId)?.name ?? input.definitionId;
    return `Need ${input.quantity} ${name}. ${have} at hand.`;
  }
  return undefined;
}

function toolReady(state: LootState, definitionId: string): boolean {
  return Object.values(state.instances).some((inst) => {
    if (inst.definitionId !== definitionId) return false;
    const kind = state.owners[inst.id]?.kind;
    return kind === "carry" || kind === "bench" || kind === "equipped";
  });
}

function protectionReason(def: ItemDefinition, protection: "quest" | "essential" | "none"): string {
  if (protection === "essential") return `${def.name} is essential.`;
  if (protection === "quest") return `${def.name} is still on a quest.`;
  return "";
}

function act(
  id: string,
  label: string,
  detail: string,
  enabled: boolean,
  reason: string | undefined,
  action: LootAction | undefined,
): AvailableAction {
  return { id, label, detail, enabled, reason, action: enabled ? action : action };
}

function dedupe(actions: AvailableAction[]): AvailableAction[] {
  const seen = new Set<string>();
  const out: AvailableAction[] = [];
  for (const action of actions) {
    if (seen.has(action.id)) continue;
    seen.add(action.id);
    out.push(action);
  }
  return out;
}

export function wornSlot(state: LootState, instanceId: string): EquipSlot | null {
  for (const [slot, id] of Object.entries(state.equipment)) {
    if (id === instanceId) return slot as EquipSlot;
  }
  return null;
}
