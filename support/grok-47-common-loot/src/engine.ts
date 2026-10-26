import { getItem } from "./catalog/index.ts";
import { knownHandler, portsFor, runUse } from "./handlers.ts";
import { getPort } from "./reference/game-ports.ts";
import { RECIPES } from "./recipes.ts";
import { bandOf } from "./types.ts";
import type {
  CatalogItem,
  HandlerResult,
  Instance,
  Recipe,
  Weather,
  WorkshopState,
} from "./types.ts";
import { DISPLAY_FIXTURES, freshShed, PERSIST_KEY } from "./workshop-loadout.ts";

export { DISPLAY_FIXTURES, freshShed, PERSIST_KEY };

export type Step = {
  state: WorkshopState;
  ok: boolean;
  messages: string[];
  missingPorts: string[];
};

const TRADE_BLOCK = new Set(["no-trade", "relic-consent", "estate-papers", "inn-property"]);
const GIVE_BLOCK = new Set([...TRADE_BLOCK, "borrowed-return"]);
const DISMANTLE_BLOCK = new Set([
  "no-dismantle",
  "relic-consent",
  "only-float",
  "estate-papers",
  "inn-property",
]);

function clone(state: WorkshopState): WorkshopState {
  return {
    ...state,
    fixtures: [...state.fixtures],
    flags: [...state.flags],
    provisions: [...state.provisions],
    log: state.log.map((entry) => ({ ...entry })),
    instances: state.instances.map((inst) => ({ ...inst, tags: [...inst.tags] })),
  };
}

function stamp(state: WorkshopState): string {
  return `hour ${state.hour}`;
}

function pushLog(state: WorkshopState, text: string) {
  state.log = [...state.log, { t: stamp(state), text }].slice(-40);
}

function knownPorts(handler: string): string[] {
  const ids = knownHandler(handler) ? portsFor(handler) : ["port.world"];
  return ids.filter((id) => getPort(id)?.status === "missing");
}

function step(state: WorkshopState, ok: boolean, messages: string[], handler = "handler.hold"): Step {
  const next = clone(state);
  for (const message of messages) pushLog(next, message);
  return { state: next, ok, messages, missingPorts: knownPorts(handler) };
}

function fail(state: WorkshopState, message: string, handler?: string): Step {
  return step(state, false, [message], handler);
}

export function hourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const part = h < 12 ? "in the morning" : h < 17 ? "in the afternoon" : "after dark";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve} o'clock ${part}`;
}

export function ruleIds(item: CatalogItem): Set<string> {
  return new Set(item.protection.rules.map((rule) => rule.id));
}

export function dismantleBlock(item: CatalogItem, condition: number): string | null {
  const rules = item.protection.rules;
  for (const rule of rules) {
    if (DISMANTLE_BLOCK.has(rule.id)) return rule.id;
  }
  const keep = rules.find((rule) => rule.id === "sound-enough-to-keep");
  if (keep && condition >= (keep.threshold ?? 40)) {
    return `sound-enough-to-keep (${condition} is still at least ${keep.threshold ?? 40})`;
  }
  return null;
}

function clampCondition(item: CatalogItem, era: WorkshopState["era"], value: number): number {
  let next = Math.max(0, Math.min(100, Math.round(value)));
  if (era === "return" && item.era.returnCap != null) next = Math.min(next, item.era.returnCap);
  return next;
}

function reserveBlocked(item: CatalogItem, qty: number, delta: number): string | null {
  if (!delta || delta >= 0) return null;
  if (!ruleIds(item).has("leave-a-reserve")) return null;
  if (qty + delta < 1) {
    return `Leave a reserve of ${item.name}. The last of it stays.`;
  }
  return null;
}

function applyQty(inst: Instance, item: CatalogItem, delta: number | undefined): string | null {
  if (!delta) return null;
  const blocked = reserveBlocked(item, inst.qty, delta);
  if (blocked) return blocked;
  const next = inst.qty + delta;
  if (next <= 0) {
    inst.qty = 0;
    inst.location = "consumed";
    inst.fixture = undefined;
  } else {
    inst.qty = next;
  }
  return null;
}

function mergeStacks(state: WorkshopState): WorkshopState {
  const kept: Instance[] = [];
  for (const inst of state.instances) {
    const item = getItem(inst.itemId);
    if (!item || item.stack === "unique" || inst.location === "consumed") {
      kept.push(inst);
      continue;
    }
    const band = bandOf(inst.condition);
    const match = kept.find(
      (other) =>
        other.itemId === inst.itemId &&
        other.location === inst.location &&
        other.fixture === inst.fixture &&
        other.contents === inst.contents &&
        bandOf(other.condition) === band &&
        other.location !== "consumed",
    );
    if (!match) {
      kept.push(inst);
      continue;
    }
    match.qty += inst.qty;
    match.condition = Math.min(match.condition, inst.condition);
    for (const tag of inst.tags) {
      if (!match.tags.includes(tag)) match.tags.push(tag);
    }
  }
  state.instances = kept;
  return state;
}

function applyResult(state: WorkshopState, inst: Instance, result: HandlerResult): Step {
  const next = clone(state);
  const actor = next.instances.find((row) => row.instanceId === inst.instanceId);
  if (!actor) return fail(state, "That object is no longer on the bench.");
  const item = getItem(actor.itemId);
  if (!item) return fail(state, "That object is not in the catalog.");
  if (!result.ok) {
    for (const message of result.messages) pushLog(next, message);
    return { state: next, ok: false, messages: result.messages, missingPorts: result.missingPorts };
  }

  const target = result.targetId
    ? next.instances.find((row) => row.instanceId === result.targetId)
    : undefined;
  const targetItem = target ? getItem(target.itemId) : undefined;

  const reserve =
    reserveBlocked(item, actor.qty, result.qtyDelta ?? 0) ??
    (target && targetItem ? reserveBlocked(targetItem, target.qty, result.targetQtyDelta ?? 0) : null);
  if (reserve) return fail(state, reserve, result.via ? undefined : undefined);

  if (result.conditionDelta) {
    actor.condition = clampCondition(item, next.era, actor.condition + result.conditionDelta);
  }
  if (result.contents !== undefined) actor.contents = result.contents;
  for (const tag of result.addTags ?? []) {
    if (!actor.tags.includes(tag)) actor.tags.push(tag);
  }
  if (result.removeTags?.length) {
    actor.tags = actor.tags.filter((tag) => !result.removeTags?.includes(tag));
  }
  const qtyError = applyQty(actor, item, result.qtyDelta);
  if (qtyError) return fail(state, qtyError);
  if (result.consumeInstance) {
    actor.location = "consumed";
    actor.qty = 0;
    actor.fixture = undefined;
  }

  if (target && targetItem) {
    if (result.targetConditionDelta) {
      target.condition = clampCondition(targetItem, next.era, target.condition + result.targetConditionDelta);
    }
    if (result.targetContents !== undefined) target.contents = result.targetContents;
    for (const tag of result.targetAddTags ?? []) {
      if (!target.tags.includes(tag)) target.tags.push(tag);
    }
    const targetQtyError = applyQty(target, targetItem, result.targetQtyDelta);
    if (targetQtyError) return fail(state, targetQtyError);
  }

  for (const born of result.spawn ?? []) {
    const spawned = getItem(born.itemId);
    if (!spawned) {
      pushLog(next, `${born.itemId} is not in the catalog, so nothing was made up to fill it.`);
      continue;
    }
    next.instances.push({
      instanceId: `inst-${next.seq++}`,
      itemId: spawned.id,
      condition: born.condition,
      qty: spawned.stack === "unique" ? 1 : born.qty,
      contents: null,
      tags: [...spawned.tags, ...(born.tags ?? [])],
      location: "bench",
    });
  }

  for (const flag of result.flags ?? []) {
    if (!next.flags.includes(flag)) next.flags.push(flag);
  }
  for (const message of result.messages) pushLog(next, message);
  mergeStacks(next);
  return { state: next, ok: true, messages: result.messages, missingPorts: result.missingPorts };
}

export function findInstance(state: WorkshopState, instanceId: string): Instance | undefined {
  return state.instances.find((inst) => inst.instanceId === instanceId);
}

export function useOnBench(
  state: WorkshopState,
  instanceId: string,
  useId: string,
  targetId?: string,
  confirmed = false,
): Step {
  const inst = findInstance(state, instanceId);
  const item = inst ? getItem(inst.itemId) : undefined;
  if (!inst || !item) return fail(state, "That object is not here.");
  if (inst.location === "consumed" || inst.location === "traded") {
    return fail(state, `${item.name} is no longer in hand.`);
  }
  const use = item.uses.find((entry) => entry.id === useId);
  if (!use) return fail(state, "That is not something this object does.", "handler.hold");
  const target = targetId ? findInstance(state, targetId) : null;
  if (target && (target.location === "consumed" || target.location === "neighbor")) {
    return fail(state, "Choose something that is actually on the bench.");
  }
  const targetItem = target ? (getItem(target.itemId) ?? null) : null;
  const result = runUse({
    state,
    item,
    instance: inst,
    targetItem,
    target: target ?? null,
    use,
    confirmed,
  });
  return applyResult(state, inst, result);
}

export function serviceItem(state: WorkshopState, instanceId: string): Step {
  const inst = findInstance(state, instanceId);
  const item = inst ? getItem(inst.itemId) : undefined;
  if (!inst || !item) return fail(state, "That object is not here.");
  const restore = item.restore;
  if (!restore.possible) return fail(state, restore.why);
  if (restore.needsFixture && !state.fixtures.includes(restore.needsFixture)) {
    return fail(state, `${item.name} needs ${restore.needsFixture.replaceAll("-", " ")}, and this shed does not have it.`);
  }
  let helper: Instance | undefined;
  if (restore.needsItem) {
    helper = state.instances.find(
      (row) => row.itemId === restore.needsItem && row.location === "bench" && row.instanceId !== inst.instanceId,
    );
    const helperItem = helper ? getItem(helper.itemId) : undefined;
    if (!helper || !helperItem) {
      const name = getItem(restore.needsItem)?.name ?? "the other piece";
      return fail(state, `${item.name} needs ${name} on the bench.`);
    }
    const spend = helperItem.stack === "unique" ? 0 : -1;
    const blocked = reserveBlocked(helperItem, helper.qty, spend);
    if (blocked) return fail(state, blocked);
  }
  const cap =
    state.era === "return" && item.era.returnCap != null
      ? Math.min(restore.cap, item.era.returnCap)
      : restore.cap;
  const next = clone(state);
  const actor = next.instances.find((row) => row.instanceId === inst.instanceId)!;
  if (actor.condition >= cap) {
    return fail(state, `${item.name} is already as sound as this return allows.`);
  }
  actor.condition = cap;
  if (restore.addsTag && !actor.tags.includes(restore.addsTag)) actor.tags.push(restore.addsTag);
  if (restore.needsItem) {
    const helperNext = next.instances.find((row) => row.itemId === restore.needsItem && row.location === "bench");
    const helperItem = helperNext ? getItem(helperNext.itemId) : undefined;
    if (helperNext && helperItem && helperItem.stack !== "unique") applyQty(helperNext, helperItem, -1);
  }
  const message = restore.line;
  pushLog(next, message);
  mergeStacks(next);
  return { state: next, ok: true, messages: [message], missingPorts: knownPorts("handler.clean") };
}

export function dismantleItem(state: WorkshopState, instanceId: string): Step {
  const inst = findInstance(state, instanceId);
  const item = inst ? getItem(inst.itemId) : undefined;
  if (!inst || !item) return fail(state, "That object is not here.");
  if (inst.location !== "bench" && inst.location !== "display") {
    return fail(state, `${item.name} is not where you can take it apart.`);
  }
  const block = dismantleBlock(item, inst.condition);
  const salvage = item.salvage.map((row) => `${row.qty} ${row.yield} (${row.note})`).join("; ");
  if (block) {
    return fail(
      state,
      `${item.name} stays whole (${block}). ${item.protection.plain} If the rule were lifted, the pieces would be: ${salvage}`,
    );
  }
  const next = clone(state);
  const actor = next.instances.find((row) => row.instanceId === inst.instanceId)!;
  actor.location = "consumed";
  actor.qty = 0;
  actor.fixture = undefined;
  for (const row of item.salvage) {
    next.provisions.push(`${item.name}: ${row.qty} × ${row.yield} — ${row.note}`);
  }
  const message = `${item.name} comes apart. Set aside: ${salvage}. Nothing new was invented from it.`;
  pushLog(next, message);
  return { state: next, ok: true, messages: [message], missingPorts: knownPorts("handler.cut") };
}

export function tradeWithNeighbor(state: WorkshopState, giveId: string, takeId: string): Step {
  const give = findInstance(state, giveId);
  const take = findInstance(state, takeId);
  const giveItem = give ? getItem(give.itemId) : undefined;
  const takeItem = take ? getItem(take.itemId) : undefined;
  if (!give || !giveItem || !take || !takeItem) return fail(state, "Both sides of a trade have to be real objects.");
  if (give.location !== "bench") return fail(state, "You can only offer what is on the bench.");
  if (take.location !== "neighbor") return fail(state, "The blanket by the door is the only trade.");
  const giveRules = ruleIds(giveItem);
  for (const rule of giveRules) {
    if (GIVE_BLOCK.has(rule)) {
      return fail(state, `${giveItem.name} will not be traded. ${giveItem.protection.plain}`);
    }
  }
  const takeRules = ruleIds(takeItem);
  for (const rule of takeRules) {
    if (TRADE_BLOCK.has(rule)) {
      return fail(state, `${takeItem.name} is not theirs to give. ${takeItem.protection.plain}`);
    }
  }
  if (takeItem.value.worthRank > giveItem.value.worthRank) {
    return fail(
      state,
      `They will not trade up. ${takeItem.name} is the dearer object, and this is not a shop.`,
    );
  }
  const next = clone(state);
  const offered = next.instances.find((row) => row.instanceId === give.instanceId)!;
  const received = next.instances.find((row) => row.instanceId === take.instanceId)!;
  offered.location = "neighbor";
  offered.fixture = undefined;
  received.location = "bench";
  received.fixture = undefined;
  const message = `In kind, no coin: ${giveItem.name} goes to the blanket. ${takeItem.name} comes onto the bench. ${giveItem.value.barterInKind}`;
  pushLog(next, message);
  return {
    state: next,
    ok: true,
    messages: [message],
    missingPorts: knownPorts("handler.carry").concat(
      ["port.social.barter"].filter((id) => getPort(id)?.status === "missing" && !knownPorts("handler.carry").includes(id)),
    ),
  };
}

export function displayItem(state: WorkshopState, instanceId: string, fixture: string): Step {
  const inst = findInstance(state, instanceId);
  const item = inst ? getItem(inst.itemId) : undefined;
  if (!inst || !item) return fail(state, "That object is not here.");
  if (!DISPLAY_FIXTURES.includes(fixture as (typeof DISPLAY_FIXTURES)[number])) {
    return fail(state, "That is not a place to put something in this shed.");
  }
  if (!state.fixtures.includes(fixture)) return fail(state, "That fixture is not in the shed.");
  if (inst.location === "consumed" || inst.location === "neighbor") {
    return fail(state, `${item.name} is not yours to hang up.`);
  }
  const next = clone(state);
  const actor = next.instances.find((row) => row.instanceId === inst.instanceId)!;
  actor.location = "display";
  actor.fixture = fixture;
  const message = `${item.name} sits on the ${fixture.replaceAll("-", " ")}.`;
  pushLog(next, message);
  return {
    state: next,
    ok: true,
    messages: [message],
    missingPorts: ["port.display.fixture"].filter((id) => getPort(id)?.status === "missing"),
  };
}

export function clearDisplay(state: WorkshopState, instanceId: string): Step {
  const inst = findInstance(state, instanceId);
  const item = inst ? getItem(inst.itemId) : undefined;
  if (!inst || !item) return fail(state, "That object is not here.");
  if (inst.location !== "display") return fail(state, `${item.name} is not on display.`);
  const next = clone(state);
  const actor = next.instances.find((row) => row.instanceId === inst.instanceId)!;
  actor.location = "bench";
  actor.fixture = undefined;
  const message = `${item.name} comes back to the bench.`;
  pushLog(next, message);
  return { state: next, ok: true, messages: [message], missingPorts: [] };
}

function spendInput(state: WorkshopState, itemId: string, qty: number, consume: boolean): string | null {
  const item = getItem(itemId);
  if (!item) return `${itemId} is not a catalog object.`;
  const inst = state.instances.find((row) => row.itemId === itemId && row.location === "bench");
  if (!inst) return `${item.name} is not on the bench.`;
  if (inst.qty < qty && item.stack !== "unique") return `Not enough ${item.name}. Need ${qty}.`;
  if (!consume) return null;
  const delta = item.stack === "unique" ? 0 : -qty;
  const blocked = reserveBlocked(item, inst.qty, item.stack === "unique" ? -1 : delta);
  if (item.stack === "unique") {
    if (ruleIds(item).has("leave-a-reserve")) return `Leave ${item.name}. It is not a supply to use up.`;
    inst.location = "consumed";
    inst.qty = 0;
    return null;
  }
  if (blocked) return blocked;
  return applyQty(inst, item, delta);
}

export function craftRecipe(state: WorkshopState, recipeId: string): Step {
  const recipe = RECIPES.find((row) => row.id === recipeId);
  if (!recipe) return fail(state, "That job is not in the book.");
  if (recipe.workers !== 1 || recipe.batch !== 1 || recipe.station !== "single-bench") {
    return fail(state, "This bench is one person and one job. It is not a factory.");
  }
  if (recipe.fixture && !state.fixtures.includes(recipe.fixture)) {
    return fail(state, `That job needs ${recipe.fixture.replaceAll("-", " ")}.`);
  }
  for (const toolId of recipe.tools) {
    const tool = getItem(toolId);
    const inst = state.instances.find(
      (row) => row.itemId === toolId && (row.location === "bench" || row.location === "display"),
    );
    if (!tool || !inst) return fail(state, `${tool?.name ?? toolId} needs to be here as a tool, and it is not.`);
  }
  for (const input of recipe.inputs) {
    const item = getItem(input.itemId);
    const inst = state.instances.find((row) => row.itemId === input.itemId && row.location === "bench");
    if (!item || !inst) return fail(state, `${item?.name ?? "A piece"} for this job is not on the bench.`);
    if (item.stack !== "unique" && inst.qty < input.qty) {
      return fail(state, `Not enough ${item.name} for ${recipe.title}.`);
    }
    if (input.consume) {
      const delta = item.stack === "unique" ? -1 : -input.qty;
      const blocked = reserveBlocked(item, inst.qty, delta);
      if (blocked) return fail(state, blocked);
    }
  }

  const next = clone(state);
  const subject = resolveSubject(next, recipe);
  if ((recipe.effect.subjectId || recipe.effect.subjectTag) && !subject) {
    return fail(state, `${recipe.title} needs its subject on the bench.`);
  }
  if (subject && recipe.effect.addTags?.some((tag) => tag.startsWith("fitting:"))) {
    const worn = subject.tags.find((tag) => tag.startsWith("fitting:"));
    if (worn) {
      return fail(state, `The lamp already wears ${worn.replace("fitting:", "a ")}. One fitting only.`);
    }
  }

  for (const input of recipe.inputs) {
    const error = spendInput(next, input.itemId, input.qty, input.consume);
    if (error) return fail(state, error);
  }

  const messages = [recipe.summary];
  if (subject) {
    const subjectItem = getItem(subject.itemId);
    if (subjectItem && recipe.effect.setCondition != null) {
      subject.condition = clampCondition(subjectItem, next.era, recipe.effect.setCondition);
    }
    if (subjectItem && recipe.effect.conditionDelta) {
      subject.condition = clampCondition(subjectItem, next.era, subject.condition + recipe.effect.conditionDelta);
    }
    for (const tag of recipe.effect.addTags ?? []) {
      if (!subject.tags.includes(tag)) subject.tags.push(tag);
    }
  }
  if (recipe.effect.worldFlag && !next.flags.includes(recipe.effect.worldFlag)) {
    next.flags.push(recipe.effect.worldFlag);
  }
  if (recipe.effect.staleFuel && next.era === "return") {
    const sputter = next.hour % 2 === 1;
    messages.push(
      sputter
        ? "The kerosene is fourteen years stale. It catches, then crawls."
        : "The kerosene is fourteen years stale. It will burn, poorly.",
    );
    const flag = sputter ? "sputter" : "fueled:stale";
    if (!next.flags.includes(flag)) next.flags.push(flag);
  }
  if (recipe.minutes >= 40) {
    next.hour = (next.hour + 1) % 24;
    messages.push(`That took the better part of an hour. It is ${hourLabel(next.hour)}. The county clock did not move.`);
  } else {
    messages.push(`${recipe.minutes} minutes on this bench. The hour here stays ${hourLabel(next.hour)}.`);
  }
  for (const message of messages) pushLog(next, message);
  mergeStacks(next);
  return { state: next, ok: true, messages, missingPorts: knownPorts(recipe.handler) };
}

function resolveSubject(state: WorkshopState, recipe: Recipe): Instance | undefined {
  const consumed = new Set(recipe.inputs.filter((input) => input.consume).map((input) => input.itemId));
  const onBench = (inst: Instance) => inst.location === "bench" && !consumed.has(inst.itemId);
  if (recipe.effect.subjectId) {
    const found = state.instances.find((inst) => inst.itemId === recipe.effect.subjectId && onBench(inst));
    if (found) return found;
  }
  if (recipe.effect.subjectTag) {
    return state.instances.find(
      (inst) => onBench(inst) && inst.tags.includes(recipe.effect.subjectTag as string),
    );
  }
  return undefined;
}

export function setWeather(state: WorkshopState, weather: Weather): WorkshopState {
  const next = clone(state);
  next.weather = weather;
  pushLog(next, weather === "calm" ? "The air goes still." : `The weather turns: ${weather}.`);
  return next;
}

export function setHour(state: WorkshopState, hour: number): WorkshopState {
  const next = clone(state);
  next.hour = ((hour % 24) + 24) % 24;
  pushLog(next, `You wait. It is ${hourLabel(next.hour)}.`);
  return next;
}

export function putOnBench(state: WorkshopState, itemId: string): Step {
  const item = getItem(itemId);
  if (!item) return fail(state, "That object is not in the catalog.");
  const existing = state.instances.find((inst) => inst.itemId === itemId && inst.location !== "consumed");
  if (existing) {
    if (existing.location === "bench") {
      return fail(state, `${item.name} is already on the bench.`);
    }
    const next = clone(state);
    const actor = next.instances.find((inst) => inst.instanceId === existing.instanceId)!;
    actor.location = "bench";
    actor.fixture = undefined;
    const message = `${item.name} comes onto the bench.`;
    pushLog(next, message);
    mergeStacks(next);
    return { state: next, ok: true, messages: [message], missingPorts: [] };
  }
  const next = clone(state);
  next.instances.push({
    instanceId: `inst-${next.seq++}`,
    itemId: item.id,
    condition: item.condition.default,
    qty: item.stackQty,
    contents: null,
    tags: [...item.tags],
    location: "bench",
  });
  const message = `${item.name} is brought in and set on the bench.`;
  pushLog(next, message);
  mergeStacks(next);
  return { state: next, ok: true, messages: [message], missingPorts: knownPorts("handler.carry") };
}

export function reviveShed(raw: string | null): WorkshopState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WorkshopState;
    if (!parsed || parsed.era !== "return" || !Array.isArray(parsed.instances)) return null;
    const instances = parsed.instances.filter((inst) => inst && getItem(inst.itemId));
    if (instances.length < 30) return null;
    return {
      era: "return",
      weather: parsed.weather ?? "calm",
      hour: typeof parsed.hour === "number" ? parsed.hour : 10,
      seq: typeof parsed.seq === "number" ? parsed.seq : instances.length + 1,
      fixtures: Array.isArray(parsed.fixtures) && parsed.fixtures.length > 0 ? parsed.fixtures : [...freshShed().fixtures],
      instances: instances.map((inst) => ({
        ...inst,
        tags: Array.isArray(inst.tags) ? inst.tags : [],
        contents: inst.contents ?? null,
      })),
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      log: Array.isArray(parsed.log) ? parsed.log.slice(-40) : [],
      provisions: Array.isArray(parsed.provisions) ? parsed.provisions : [],
    };
  } catch {
    return null;
  }
}

export function jobsReady(state: WorkshopState): Recipe[] {
  return RECIPES.filter((recipe) => {
    if (recipe.fixture && !state.fixtures.includes(recipe.fixture)) return false;
    for (const toolId of recipe.tools) {
      const tool = state.instances.find(
        (inst) => inst.itemId === toolId && (inst.location === "bench" || inst.location === "display"),
      );
      if (!tool) return false;
    }
    for (const input of recipe.inputs) {
      const inst = state.instances.find((row) => row.itemId === input.itemId && row.location === "bench");
      const item = getItem(input.itemId);
      if (!inst || !item) return false;
      if (item.stack !== "unique" && inst.qty < input.qty) return false;
    }
    if (recipe.effect.subjectId || recipe.effect.subjectTag) {
      if (!resolveSubject(state, recipe)) return false;
    }
    return true;
  });
}
