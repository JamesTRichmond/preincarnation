import { acceptsFood, acceptsItem, acceptsTokenTags, mustCatalog } from "./catalog.ts";
import { foodName, isLoose, itemOf, occupants, openAnchorsFor, tryPlace } from "./room.ts";
import type {
  ActionResult,
  CatalogItem,
  HomesteadHost,
  HostCall,
  PlacedObject,
  RoomSave,
} from "./types.ts";

export type Verb = "use" | "wind" | "stow" | "lay" | "serve" | "clear-food" | "inspect";

export interface Payload {
  targetInstanceId?: string;
  tokenId?: string;
  foodId?: string;
}

function result(
  save: RoomSave,
  ok: boolean,
  message: string,
  effect: string,
  extra?: { motif?: string; muted?: boolean; hostCalls?: HostCall[] },
): ActionResult {
  return {
    ok,
    message,
    save,
    effect,
    motif: extra?.motif,
    muted: extra?.muted,
    hostCalls: extra?.hostCalls ?? [],
  };
}

function retires(item: CatalogItem): boolean {
  return (
    item.interaction === "illumination" ||
    item.interaction === "craft" ||
    item.interaction === "serve" ||
    item.interaction === "sound"
  );
}

function remembered(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  inst.state.lit = false;
  inst.state.inspected = true;
  return result(
    save,
    true,
    `${item.history[save.era]} It is still in the room. This year it will not do that work.`,
    "retired",
  );
}

export function interact(
  save: RoomSave,
  instanceId: string,
  verb: Verb,
  payload: Payload = {},
  host?: HomesteadHost,
): ActionResult {
  const draft = structuredClone(save);
  const outcome = run(draft, instanceId, verb, payload);
  if (!outcome.ok) return { ...outcome, save };
  for (const call of outcome.hostCalls) deliver(host, call);
  return { ...outcome, save: draft };
}

function deliver(host: HomesteadHost | undefined, call: HostCall) {
  if (!host) return;
  if (call.system === "letters") host.letters?.open(call.ref, call.sourceInstanceId);
  if (call.system === "music") host.music?.cue(call.ref, call.sourceInstanceId);
  if (call.system === "display") host.display?.focus(call.ref, call.sourceInstanceId);
}

function run(save: RoomSave, instanceId: string, verb: Verb, payload: Payload): ActionResult {
  const inst = save.instances.find((item) => item.instanceId === instanceId);
  if (!inst) return result(save, false, "That object is not in this room's keeping.", "none");
  const item = itemOf(inst);
  if (verb === "inspect") return inspect(save, inst, item);
  if (!item.eras.includes(save.era) && retires(item) && verb !== "lay" && verb !== "stow") {
    return remembered(save, inst, item);
  }
  if (verb === "wind") return wind(save, inst, item);
  if (verb === "stow") return stow(save, inst, item, payload);
  if (verb === "lay") return lay(save, inst, item, payload);
  if (verb === "serve") return serve(save, inst, item, payload.foodId);
  if (verb === "clear-food") return clearServed(save, inst, item);
  switch (item.interaction) {
    case "illumination":
      return toggleLamp(save, inst, item);
    case "sound":
      return play(save, inst, item);
    case "organization":
      return describeHold(save, inst, item);
    case "serve":
      return describeServe(save, item);
    case "history":
      return inspect(save, inst, item);
    case "craft":
      return demonstrate(save, inst, item);
    case "visitor":
      return greet(save, inst, item);
    default:
      return result(save, false, `${item.name} has nothing to do.`, "none");
  }
}

function inspect(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  inst.state.inspected = true;
  return result(save, true, item.history[save.era], "history");
}

function wind(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  if (item.frozenHour != null) {
    inst.state.hour = item.frozenHour;
    return result(
      save,
      true,
      `The ${item.name.toLowerCase()} will not take a wind. It is four, and it is staying.`,
      "refused-wind",
    );
  }
  if (!item.windable) return result(save, false, `${item.name} does not wind.`, "none");
  inst.state.wind = 3;
  return result(save, true, `${item.name} is wound. Three strikes sit in the spring.`, "wound");
}

function toggleLamp(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  if (!isLoose(inst) && !inst.displaySlot) {
    return result(save, false, "Set the lamp out before lighting it.", "none");
  }
  const turningOn = !inst.state.lit;
  inst.state.lit = turningOn;
  if (!turningOn) return result(save, true, `${item.name} is out.`, "dark");
  let message = `${item.name} is lit.`;
  if (item.workLight) message += " The work hook shows a thread of flax.";
  if (item.namesCompanions && inst.anchorId) {
    const names = occupants(save, inst.anchorId)
      .filter((other) => other.instanceId !== inst.instanceId)
      .map((other) => itemOf(other).name);
    message += names.length
      ? ` Beside it: ${names.join(", ")}.`
      : " Nothing else is sharing the surface.";
  }
  if (save.visitorPresent && item.lightVisitorLine) message += ` ${item.lightVisitorLine}`;
  const hostCalls: HostCall[] = [];
  if (item.lettersOffer) {
    hostCalls.push({
      system: "letters",
      action: "open",
      ref: item.lettersOffer,
      sourceInstanceId: inst.instanceId,
    });
    message += " The margin note is offered to the letters.";
  }
  return result(save, true, message, "light", { hostCalls });
}

function play(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  if (item.frozenHour != null) {
    inst.state.hour = item.frozenHour;
    return result(save, true, "Four. The glass will not be another hour.", "sound", {
      motif: item.motif,
      hostCalls: musicCall(inst, item.motif),
    });
  }
  if (item.aligns) {
    inst.state.aligned = true;
    return result(save, true, "The mark meets the window light. That is noon enough.", "aligned", {
      motif: item.motif,
    });
  }
  if (item.dripMax) {
    if (inst.state.drips >= item.dripMax) {
      return result(save, true, "The bowl has said what it can.", "full");
    }
    inst.state.drips += 1;
    const word = ["One drip.", "Two.", "Three, and no more."][inst.state.drips - 1] ?? "A drip.";
    return result(save, true, word, "sound", { motif: item.motif });
  }
  if (item.needsBreeze && !save.breeze) {
    return result(save, true, "Still air. Open the window if you want them to speak.", "still", {
      muted: true,
    });
  }
  if (item.windable) {
    if (inst.state.wind <= 0) return result(save, true, "The spring is slack.", "slack");
    inst.state.wind -= 1;
    let message = `${item.name} strikes. ${inst.state.wind} left in the spring.`;
    if (save.visitorPresent && item.strikeVisitorLine) message += ` ${item.strikeVisitorLine}`;
    return result(save, true, message, "sound", {
      motif: item.motif,
      hostCalls: musicCall(inst, item.motif),
    });
  }
  let message = item.category === "clock" ? item.history[save.era] : `${item.name} plays.`;
  if (save.visitorPresent && item.strikeVisitorLine) message += ` ${item.strikeVisitorLine}`;
  return result(save, true, message, "sound", {
    motif: item.motif,
    hostCalls: musicCall(inst, item.motif),
  });
}

function musicCall(inst: PlacedObject, motif?: string): HostCall[] {
  if (!motif) return [];
  if (
    mustCatalog(inst.catalogId).category !== "instrument" &&
    mustCatalog(inst.catalogId).category !== "chime"
  ) {
    if (mustCatalog(inst.catalogId).category !== "clock") return [];
  }
  return [
    {
      system: "music",
      action: "cue",
      ref: motif,
      sourceInstanceId: inst.instanceId,
    },
  ];
}

function greet(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  if (item.arms) return arm(save, inst, item);
  if (!save.visitorPresent) {
    return result(save, true, `${item.name} is quiet. Nobody is at the door.`, "waiting", {
      motif: item.motif,
      hostCalls: item.motif ? musicCall(inst, item.motif) : [],
    });
  }
  inst.state.visitorAck = true;
  if (item.greetWrites === "chalk") inst.state.chalk = `${save.visitorName} — still the notch road`;
  if (item.greetWrites === "signature" && !inst.state.signatures.includes(save.visitorName)) {
    inst.state.signatures = [...inst.state.signatures, save.visitorName];
  }
  return result(
    save,
    true,
    item.visitorLine ?? `${save.visitorName} notices ${item.name}.`,
    "greeted",
    {
      motif: item.motif,
      hostCalls: item.motif ? musicCall(inst, item.motif) : [],
    },
  );
}

function arm(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  if (!inst.state.armed) {
    inst.state.armed = true;
    if (save.visitorPresent) {
      inst.state.visitorAck = true;
      return result(save, true, item.visitorLine ?? "It rings.", "greeted", { motif: item.motif });
    }
    return result(save, true, "Armed for company, and quiet until then.", "armed");
  }
  if (save.visitorPresent) {
    inst.state.visitorAck = true;
    return result(save, true, item.visitorLine ?? "It rings.", "greeted", { motif: item.motif });
  }
  inst.state.armed = false;
  return result(save, true, "You unarm the tin.", "disarmed");
}

function demonstrate(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  if (inst.state.craftDone) {
    return result(
      save,
      true,
      `You have already seen what the ${item.name.toLowerCase()} can show.`,
      "replay",
    );
  }
  let textile = "";
  if (item.namesTextile && inst.anchorId) {
    const near = occupants(save, inst.anchorId).find(
      (other) => other.instanceId !== inst.instanceId && itemOf(other).tags.includes("textile"),
    );
    if (near)
      textile = ` It takes a stitch toward the ${itemOf(near).name.toLowerCase()} and leaves it where it is.`;
  }
  if (item.consumesFood) {
    const food = save.pantry.find((entry) => entry.id === item.consumesFood);
    if (!food || food.portions < 1) {
      return result(
        save,
        true,
        `The gesture is there, but there is no ${foodName(item.consumesFood)} to take.${textile}`,
        "demonstrated-empty",
      );
    }
    food.portions -= 1;
  }
  if (!item.yieldName) return result(save, false, `${item.name} has no craft to show.`, "none");
  const tokenId = `token.${item.id}`;
  if (!save.tokens.some((token) => token.id === tokenId)) {
    save.tokens.push({
      id: tokenId,
      name: item.yieldName,
      tags: item.yieldTags ?? [],
      originInstanceId: inst.instanceId,
    });
  }
  inst.state.craftDone = true;
  return result(
    save,
    true,
    `${item.name} shows its craft once: ${item.yieldName}.${textile}`,
    "crafted",
  );
}

function describeServe(save: RoomSave, item: CatalogItem): ActionResult {
  const foods = (item.foods ?? [])
    .map((id) => {
      const food = save.pantry.find((entry) => entry.id === id);
      return food && food.portions > 0 ? food.name : null;
    })
    .filter((name): name is string => Boolean(name));
  if (!foods.length) {
    return result(
      save,
      true,
      `${item.name} is clear. The pantry has nothing it can carry.`,
      "listed",
    );
  }
  return result(save, true, `${item.name} can carry ${foods.join(", ")}.`, "listed");
}

function serve(
  save: RoomSave,
  inst: PlacedObject,
  item: CatalogItem,
  foodId?: string,
): ActionResult {
  if (!foodId || !item.foods?.includes(foodId)) {
    return result(save, false, `${item.name} does not serve that.`, "none");
  }
  if (!isLoose(inst)) return result(save, false, "Set it out before serving.", "none");
  const food = save.pantry.find((entry) => entry.id === foodId);
  if (!food || food.portions < 1) {
    return result(save, false, `The pantry is out of ${foodName(foodId)}.`, "none");
  }
  food.portions -= 1;
  const served = inst.state.served.find((entry) => entry.foodId === foodId);
  if (served) served.portions += 1;
  else inst.state.served.push({ foodId, portions: 1 });
  let message = `${food.name} is on the ${item.name.toLowerCase()}.`;
  if (save.visitorPresent && item.serveVisitorLine) message += ` ${item.serveVisitorLine}`;
  return result(save, true, message, "served");
}

function clearServed(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  if (!inst.state.served.length)
    return result(save, true, `${item.name} is already clear.`, "cleared");
  for (const served of inst.state.served) {
    const food = save.pantry.find((entry) => entry.id === served.foodId);
    if (food) food.portions += served.portions;
  }
  inst.state.served = [];
  return result(
    save,
    true,
    `What was on the ${item.name.toLowerCase()} went back to the pantry.`,
    "cleared",
  );
}

function describeHold(save: RoomSave, inst: PlacedObject, item: CatalogItem): ActionResult {
  const names = inst.state.heldInstanceIds.map((id) => {
    const held = save.instances.find((entry) => entry.instanceId === id);
    return held ? itemOf(held).name : id;
  });
  const tokens = inst.state.heldTokenIds.map(
    (id) => save.tokens.find((token) => token.id === id)?.name ?? id,
  );
  const foods = inst.state.heldFood.map((food) => foodName(food.foodId));
  const all = [...names, ...tokens, ...foods];
  if (!all.length) return result(save, true, `${item.name} is empty.`, "listed");
  return result(save, true, `${item.name} holds ${all.join(", ")}.`, "listed");
}

function stow(
  save: RoomSave,
  inst: PlacedObject,
  item: CatalogItem,
  payload: Payload,
): ActionResult {
  if (!isLoose(inst) && !inst.displaySlot) {
    return result(save, false, "Set the container out before tucking anything into it.", "none");
  }
  if (payload.foodId) {
    if (!acceptsFood(item, payload.foodId)) {
      return result(save, false, `${item.name} will not take that.`, "none");
    }
    const food = save.pantry.find((entry) => entry.id === payload.foodId);
    if (!food || food.portions < 1) {
      return result(
        save,
        false,
        `There is no ${foodName(payload.foodId)} left to tuck away.`,
        "none",
      );
    }
    food.portions -= 1;
    const held = inst.state.heldFood.find((entry) => entry.foodId === payload.foodId);
    if (held) held.portions += 1;
    else inst.state.heldFood.push({ foodId: payload.foodId, portions: 1 });
    return result(
      save,
      true,
      `${food.name} is tucked into the ${item.name.toLowerCase()}.`,
      "stowed",
    );
  }
  if (payload.tokenId) {
    const token = save.tokens.find((entry) => entry.id === payload.tokenId);
    if (!token) return result(save, false, "That made thing is not here.", "none");
    if (!acceptsTokenTags(item, token.tags)) {
      return result(
        save,
        false,
        `${item.name} will not take the ${token.name.toLowerCase()}.`,
        "none",
      );
    }
    if (inst.state.heldTokenIds.includes(token.id)) {
      return result(
        save,
        true,
        `${token.name} is already in the ${item.name.toLowerCase()}.`,
        "stowed",
      );
    }
    inst.state.heldTokenIds = [...inst.state.heldTokenIds, token.id];
    return result(
      save,
      true,
      `${token.name} is tucked into the ${item.name.toLowerCase()}.`,
      "stowed",
    );
  }
  if (!payload.targetInstanceId) return describeHold(save, inst, item);
  if (payload.targetInstanceId === inst.instanceId) {
    return result(save, false, "It cannot hold itself.", "none");
  }
  const target = save.instances.find((entry) => entry.instanceId === payload.targetInstanceId);
  if (!target) return result(save, false, "That is not in the room.", "none");
  const targetItem = itemOf(target);
  if (!isLoose(target))
    return result(save, false, `${targetItem.name} is not out in the room.`, "none");
  if (!acceptsItem(item, targetItem)) {
    return result(
      save,
      false,
      `${item.name} will not take the ${targetItem.name.toLowerCase()}.`,
      "none",
    );
  }
  if (itemOf(target).providesSupport) {
    const dependents = save.instances.filter(
      (entry) => entry.supportInstanceId === target.instanceId,
    );
    if (dependents.length) {
      return result(save, false, `${targetItem.name} is holding something else up.`, "none");
    }
  }
  target.anchorId = null;
  target.supportInstanceId = null;
  target.packed = false;
  target.displaySlot = null;
  target.containerInstanceId = inst.instanceId;
  inst.state.heldInstanceIds = [...inst.state.heldInstanceIds, target.instanceId];
  return result(
    save,
    true,
    `${targetItem.name} is tucked into the ${item.name.toLowerCase()}.`,
    "stowed",
  );
}

function lay(
  save: RoomSave,
  inst: PlacedObject,
  item: CatalogItem,
  payload: Payload,
): ActionResult {
  if (payload.foodId) {
    const held = inst.state.heldFood.find((entry) => entry.foodId === payload.foodId);
    if (!held) return result(save, false, `${item.name} is not holding that.`, "none");
    const food = save.pantry.find((entry) => entry.id === payload.foodId);
    if (food) food.portions += held.portions;
    inst.state.heldFood = inst.state.heldFood.filter((entry) => entry.foodId !== payload.foodId);
    return result(save, true, `${foodName(payload.foodId)} is back in the pantry.`, "laid");
  }
  if (payload.tokenId) {
    if (!inst.state.heldTokenIds.includes(payload.tokenId)) {
      return result(save, false, `${item.name} is not holding that.`, "none");
    }
    const known = item.yieldName
      ? {
          id: payload.tokenId,
          name: payload.tokenId,
          tags: item.accept?.tokenTags ?? [],
          originInstanceId: inst.instanceId,
        }
      : null;
    inst.state.heldTokenIds = inst.state.heldTokenIds.filter((id) => id !== payload.tokenId);
    if (!save.tokens.some((token) => token.id === payload.tokenId)) {
      save.tokens.push(
        known ?? {
          id: payload.tokenId,
          name: payload.tokenId,
          tags: [],
          originInstanceId: inst.instanceId,
        },
      );
    }
    return result(save, true, "Set back out with the made things.", "laid");
  }
  if (!payload.targetInstanceId) return result(save, false, "Say what to lay out.", "none");
  if (!inst.state.heldInstanceIds.includes(payload.targetInstanceId)) {
    return result(save, false, `${item.name} is not holding that.`, "none");
  }
  const target = save.instances.find((entry) => entry.instanceId === payload.targetInstanceId);
  if (!target) return result(save, false, "That object is gone.", "none");
  inst.state.heldInstanceIds = inst.state.heldInstanceIds.filter(
    (id) => id !== payload.targetInstanceId,
  );
  target.containerInstanceId = null;
  const anchors = openAnchorsFor(save, target.instanceId, { allowOverflow: true });
  const anchor = anchors[0];
  if (!anchor) {
    target.packed = true;
    target.anchorId = null;
    return result(
      save,
      true,
      `${itemOf(target).name} came out and went to the loft. No place was open.`,
      "laid",
    );
  }
  const error = tryPlace(save, target.instanceId, anchor.id);
  if (error) {
    target.packed = true;
    return result(save, true, error, "laid");
  }
  return result(
    save,
    true,
    `${itemOf(target).name} is back on the ${anchor.label.toLowerCase()}.`,
    "laid",
  );
}
