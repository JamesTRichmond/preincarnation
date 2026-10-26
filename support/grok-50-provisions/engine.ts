/**
 * Field-kitchen engine. Provisions are loot.provision.*.
 * Dishes stay on the cooking-session port (cook.dish.*). This file spends
 * ingredients and applies the plate's published effects. It does not invent
 * a second heat, timing, or hunger model.
 */
import { DISHES, NODES, PROVISION_BY_ID, PROVISIONS, WATERS } from "./catalog.ts";
import type {
  ActiveEffect,
  Bin,
  Dish,
  EffectSpec,
  FailReason,
  FieldIntent,
  GraveCache,
  KitFlags,
  KitState,
  Provision,
  Season,
  SourceNode,
  Stack,
  StepResult,
  Water,
} from "./types.ts";
import { BINS } from "./types.ts";

export type CookingPort = {
  owner: string;
  /** Published by the cooking session. Snapshot used when none is mounted. */
  dishes: readonly Dish[];
};

export const SESSION_PORT: CookingPort = {
  owner: "cooking-session-snapshot",
  dishes: DISHES,
};

export const POUCH_SLOTS = 12;
export const CELLAR_SLOTS = 24;
export const BASE_CREEL = 8;
export const BASE_TIN = 4;

const DRAW_ORDER: Bin[] = ["pouch", "creel", "tin", "cellar"];

export function pid(n: number) {
  return `loot.provision.${String(n).padStart(3, "0")}`;
}

export function slotCap(state: KitState, bin: Bin) {
  if (bin === "pouch") return POUCH_SLOTS;
  if (bin === "creel") return state.creelSlots;
  if (bin === "cellar") return CELLAR_SLOTS;
  return state.tinSlots;
}

export function cloneState(state: KitState): KitState {
  return structuredClone(state);
}

function emptyFlags(): KitFlags {
  return {
    palate: false,
    veinEar: false,
    cacheGlow: false,
    oldOrchard: false,
    soloverse: false,
    studiedJack: false,
    lineDressed: false,
    lashedBobber: false,
    mended: false,
    creelWidened: false,
  };
}

function note(state: KitState, line: string) {
  state.log = [line, ...state.log].slice(0, 36);
}

function fail(state: KitState, reason: FailReason, noteText: string): StepResult {
  return { ok: false, state, reason, note: noteText };
}

function done(
  state: KitState,
  noteText: string,
  consumed?: StepResult["consumed"],
  produced?: StepResult["produced"],
): StepResult {
  return { ok: true, state, note: noteText, consumed, produced };
}

export function qtyOf(state: KitState, id: string, cured?: boolean) {
  let n = 0;
  for (const bin of BINS) {
    for (const st of state.bins[bin]) {
      if (st.provisionId !== id) continue;
      if (cured === true && !st.cured) continue;
      if (cured === false && st.cured) continue;
      n += st.qty;
    }
  }
  return n;
}

export function totals(state: KitState) {
  const map: Record<string, number> = {};
  const add = (st: Stack) => {
    map[st.provisionId] = (map[st.provisionId] ?? 0) + st.qty;
  };
  for (const bin of BINS) for (const st of state.bins[bin]) add(st);
  for (const g of state.graves) {
    for (const st of g.pouch) add(st);
    for (const st of g.creel) add(st);
  }
  return map;
}

/** Identity. There is no spoilage clock. */
export function ageStores(state: KitState, _years = 14): KitState {
  return state;
}

function roomIn(state: KitState, bin: Bin, id: string, cured: boolean) {
  const max = PROVISION_BY_ID[id]?.storage.stackMax ?? 1;
  let room = 0;
  for (const st of state.bins[bin]) {
    if (st.provisionId === id && !!st.cured === cured) room += Math.max(0, max - st.qty);
  }
  room += Math.max(0, slotCap(state, bin) - state.bins[bin].length) * max;
  return room;
}

function commitAdd(state: KitState, bin: Bin, id: string, qty: number, cured: boolean) {
  const max = PROVISION_BY_ID[id]?.storage.stackMax ?? 1;
  let left = qty;
  for (const st of state.bins[bin]) {
    if (left <= 0) break;
    if (st.provisionId === id && !!st.cured === cured && st.qty < max) {
      const put = Math.min(max - st.qty, left);
      st.qty += put;
      left -= put;
    }
  }
  while (left > 0) {
    const put = Math.min(max, left);
    const stack: Stack = { provisionId: id, qty: put, ...(cured ? { cured: true } : {}) };
    state.bins[bin].push(stack);
    left -= put;
  }
}

export function tryGive(state: KitState, id: string, qty: number, cured = false): KitState | null {
  if (qty <= 0) return state;
  if (!PROVISION_BY_ID[id]) return null;
  const draft = cloneState(state);
  const pref = PROVISION_BY_ID[id].storage.bin;
  const order = [...new Set<Bin>([pref, "pouch", "cellar", "creel", "tin"])];
  let left = qty;
  for (const bin of order) {
    if (left <= 0) break;
    const put = Math.min(left, roomIn(draft, bin, id, cured));
    if (put > 0) {
      commitAdd(draft, bin, id, put, cured);
      left -= put;
    }
  }
  return left === 0 ? draft : null;
}

function giveOrThrow(state: KitState, id: string, qty: number, cured = false) {
  const next = tryGive(state, id, qty, cured);
  if (!next) throw new Error(`starter kit could not hold ${id}`);
  return next;
}

export function initialState(): KitState {
  let state: KitState = {
    version: 1,
    year: 2026,
    season: "spring",
    life: 0,
    bins: { pouch: [], creel: [], cellar: [], tin: [] },
    tinSlots: BASE_TIN,
    creelSlots: BASE_CREEL,
    effects: [],
    flags: emptyFlags(),
    graves: [],
    taken: {},
    baitId: null,
    waterId: "new-haven",
    focusPlace: "Goshen softwood",
    barter: 0,
    lastReading: [],
    log: ["Camp kitchen, Addison County. Nothing here is a hunger bar."],
  };
  const cellar: [number, number][] = [
    [1, 2],
    [2, 2],
    [3, 1],
    [4, 2],
    [5, 3],
    [8, 2],
    [9, 3],
    [10, 4],
    [11, 4],
    [12, 2],
  ];
  for (const [n, q] of cellar) state = giveOrThrow(state, pid(n), q);
  const pouch: [number, number][] = [
    [11, 2],
    [16, 2],
    [109, 1],
    [110, 1],
    [111, 1],
    [112, 1],
    [113, 3],
    [114, 1],
    [119, 2],
  ];
  for (const [n, q] of pouch) state = giveOrThrow(state, pid(n), q);
  return state;
}

export function generations(year: number) {
  return Math.max(0, Math.floor((year - 2026) / 14));
}

export function nodeYield(node: SourceNode, state: KitState) {
  const item = PROVISION_BY_ID[node.provisionId];
  if (!item) return 0;
  if (node.hiddenUntil === "cacheGlow" && !state.flags.cacheGlow) return 0;
  let y = node.baseYield;
  const gens = generations(state.year);
  if (item.era === "spreads") y += gens;
  if (item.era === "scarcens") y = Math.max(0, y - gens);
  if (item.era === "after-death") y = state.life >= 1 ? y : 0;
  return y;
}

export function available(node: SourceNode, state: KitState) {
  return Math.max(0, nodeYield(node, state) - (state.taken[node.id] ?? 0));
}

export function inSeason(node: SourceNode, season: Season) {
  return node.seasons.length === 0 || node.seasons.includes(season);
}

export function gather(state: KitState, nodeId: string): StepResult {
  const node = NODES.find((n) => n.id === nodeId);
  if (!node) return fail(state, "empty", "That patch is not on the county list.");
  const item = PROVISION_BY_ID[node.provisionId];
  if (!item) return fail(state, "empty", "The list names nothing.");
  if (!inSeason(node, state.season)) {
    return fail(state, "season", `${item.name} is not out in ${state.season}.`);
  }
  if (available(node, state) <= 0) {
    return fail(state, "unavailable", eraLine(item, state) || `No ${item.name} left there this life.`);
  }
  const next = tryGive(state, item.id, 1);
  if (!next) return fail(state, "full", "Every bin is full. Nothing was picked.");
  next.taken = { ...next.taken, [node.id]: (next.taken[node.id] ?? 0) + 1 };
  note(next, `Picked up ${item.name} at ${node.place}.`);
  return done(next, `Picked up ${item.name}.`, undefined, [{ provisionId: item.id, qty: 1 }]);
}

function eraLine(item: Provision, state: KitState) {
  if (item.era === "scarcens" && nodeYield({ id: "", provisionId: item.id, mapId: "", place: "", x: 0, y: 0, seasons: [], baseYield: item.baseYield }, state) === 0) {
    return item.eraNote;
  }
  if (item.era === "after-death" && state.life < 1) return "Not in these woods. Not yet.";
  return "";
}

export function setSeason(state: KitState, season: Season): KitState {
  const next = cloneState(state);
  next.season = season;
  note(next, `The dial says ${season}.`);
  return next;
}

export function setWater(state: KitState, waterId: string): KitState {
  const next = cloneState(state);
  next.waterId = waterId;
  return next;
}

export function setFocus(state: KitState, place: string): KitState {
  const next = cloneState(state);
  next.focusPlace = place;
  return next;
}

type Take = { bin: Bin; index: number; qty: number };

function findCycle(list: readonly Provision[]): string[] | null {
  const adj = new Map<string, string[]>();
  for (const item of list) adj.set(item.id, item.substitutions.map((s) => s.forId));
  const color = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const dfs = (id: string): string[] | null => {
    color.set(id, 1);
    stack.push(id);
    for (const nxt of adj.get(id) ?? []) {
      const c = color.get(nxt) ?? 0;
      if (c === 1) {
        const at = stack.indexOf(nxt);
        return [...stack.slice(at), nxt];
      }
      if (c === 0) {
        const hit = dfs(nxt);
        if (hit) return hit;
      }
    }
    stack.pop();
    color.set(id, 2);
    return null;
  };
  for (const id of adj.keys()) {
    if ((color.get(id) ?? 0) === 0) {
      const hit = dfs(id);
      if (hit) return hit;
    }
  }
  return null;
}

export function substitutionCycle(list: readonly Provision[] = PROVISIONS) {
  return findCycle(list);
}

type Demand = { provisionId: string; qty: number; cured: boolean; allowSubstitution: boolean };

function aggregate(needs: Dish["needs"]): Demand[] {
  const map = new Map<string, Demand>();
  for (const need of needs) {
    const key = `${need.provisionId}|${need.cured ? "c" : "a"}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        provisionId: need.provisionId,
        qty: need.qty,
        cured: !!need.cured,
        allowSubstitution: need.allowSubstitution,
      });
    } else {
      prev.qty += need.qty;
      if (!need.allowSubstitution) prev.allowSubstitution = false;
    }
  }
  return [...map.values()];
}

function planTakes(state: KitState, demands: Demand[], list: readonly Provision[]) {
  const reserved = new Map<string, number>();
  const takes: Take[] = [];
  let quality = 1;
  const byId = new Map(list.map((p) => [p.id, p]));

  const pull = (id: string, qty: number, curedOnly: boolean) => {
    let left = qty;
    const bins = DRAW_ORDER;
    const stacks: { bin: Bin; index: number; stack: Stack }[] = [];
    for (const bin of bins) {
      state.bins[bin].forEach((stack, index) => stacks.push({ bin, index, stack }));
    }
    stacks.sort((a, b) => Number(!!a.stack.cured) - Number(!!b.stack.cured));
    for (const row of stacks) {
      if (left <= 0) break;
      if (row.stack.provisionId !== id) continue;
      if (curedOnly && !row.stack.cured) continue;
      const key = `${row.bin}:${row.index}`;
      const held = reserved.get(key) ?? 0;
      const free = row.stack.qty - held;
      if (free <= 0) continue;
      const qtyTake = Math.min(free, left);
      reserved.set(key, held + qtyTake);
      takes.push({ bin: row.bin, index: row.index, qty: qtyTake });
      left -= qtyTake;
    }
    return qty - left;
  };

  for (const demand of demands) {
    const native = pull(demand.provisionId, demand.qty, demand.cured);
    let left = demand.qty - native;
    if (left > 0 && demand.allowSubstitution && !demand.cured) {
      const subs = list
        .flatMap((item) => item.substitutions.filter((s) => s.forId === demand.provisionId).map((s) => ({ item, quality: s.quality })))
        .filter((s) => s.item.kind !== "hazard")
        .sort((a, b) => b.quality - a.quality || a.item.id.localeCompare(b.item.id));
      for (const sub of subs) {
        if (left <= 0) break;
        const got = pull(sub.item.id, left, false);
        if (got > 0) {
          quality = Math.min(quality, sub.quality);
          left -= got;
        }
      }
    }
    if (left > 0) {
      const name = byId.get(demand.provisionId)?.name ?? demand.provisionId;
      return { ok: false as const, name, cured: demand.cured };
    }
  }
  return { ok: true as const, takes, quality };
}

function applyTakes(state: KitState, takes: Take[]) {
  const merged = new Map<string, Take>();
  for (const take of takes) {
    const key = `${take.bin}:${take.index}`;
    const prev = merged.get(key);
    if (prev) prev.qty += take.qty;
    else merged.set(key, { ...take });
  }
  for (const bin of BINS) {
    const mine = [...merged.values()].filter((t) => t.bin === bin).sort((a, b) => b.index - a.index);
    for (const take of mine) {
      const stack = state.bins[bin][take.index];
      stack.qty -= take.qty;
      if (stack.qty <= 0) state.bins[bin].splice(take.index, 1);
    }
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function canApply(state: KitState, specs: EffectSpec[]): FailReason | null {
  for (const spec of specs) {
    const existing = state.effects.find((e) => e.id === spec.id);
    if (existing && spec.exclusive) return "exclusive";
    if (existing && existing.stacks >= existing.cap) return "at-cap";
  }
  return null;
}

function applyEffects(state: KitState, specs: EffectSpec[]) {
  for (const spec of specs) {
    const existing = state.effects.find((e) => e.id === spec.id);
    if (!existing) {
      const active: ActiveEffect = {
        id: spec.id,
        name: spec.name,
        kind: spec.kind,
        magnitude: round2(spec.magnitude),
        stacks: 1,
        cap: spec.cap,
        exclusive: spec.exclusive,
        fictional: spec.fictional,
        ...(spec.distinctive ? { distinctive: spec.distinctive } : {}),
      };
      state.effects.push(active);
    } else {
      const add = spec.magnitude * spec.falloff ** existing.stacks;
      existing.stacks += 1;
      existing.magnitude = round2(existing.magnitude + add);
    }
    if (spec.distinctive === "cache-glow") state.flags.cacheGlow = true;
    if (spec.distinctive === "vein-ear") state.flags.veinEar = true;
    if (spec.distinctive === "palate") state.flags.palate = true;
    if (spec.distinctive === "old-orchard") state.flags.oldOrchard = true;
    if (spec.distinctive === "soloverse") state.flags.soloverse = true;
  }
}

export type CookCtx = { port?: CookingPort; provisions?: readonly Provision[] };

export function cook(state: KitState, dishId: string, ctx: CookCtx = {}, preview = false): StepResult {
  const list = ctx.provisions ?? PROVISIONS;
  const port = ctx.port ?? SESSION_PORT;
  const cycle = findCycle(list);
  if (cycle) {
    return fail(state, "substitution-cycle", `Substitution loop: ${cycle.join(" → ")}. Nothing was spent.`);
  }
  const dish = port.dishes.find((d) => d.id === dishId);
  if (!dish) return fail(state, "missing-recipe", "That plate is not in the book. The bins were not touched.");
  if (!dish.effects.length) return fail(state, "missing-effect", "The cooking session published no effect. Nothing was spent.");
  for (const need of dish.needs) {
    const item = list.find((p) => p.id === need.provisionId);
    if (item?.kind === "hazard") {
      return fail(state, "not-food", `${item.name} is not food. Nothing was spent.`);
    }
  }
  const demands = aggregate(dish.needs);
  const plan = planTakes(state, demands, list);
  if (!plan.ok) {
    const cured = plan.cured ? "cured " : "";
    return fail(state, "missing-ingredient", `Short of ${cured}${plan.name}. Nothing was spent.`);
  }
  const scaled = dish.effects.map((e) => ({ ...e, magnitude: round2(e.magnitude * plan.quality) }));
  const blocked = canApply(state, scaled);
  if (blocked === "exclusive") return fail(state, "exclusive", `${dish.name} is already with you. Nothing was spent.`);
  if (blocked === "at-cap") return fail(state, "at-cap", "That gift is as strong as it gets. Nothing was spent.");
  if (preview) return done(state, `${dish.name} can be cooked.`);
  const next = cloneState(state);
  applyTakes(next, plan.takes);
  applyEffects(next, scaled);
  const q = plan.quality < 1 ? ` A stand-in, so it lands at ${Math.round(plan.quality * 100)}%.` : "";
  note(next, `Cooked ${dish.name}.${q}`);
  const consumed = collapseTakes(next, plan.takes, state);
  return done(next, `Cooked ${dish.name}.${q}`, consumed);
}

function collapseTakes(after: KitState, takes: Take[], before: KitState) {
  const map = new Map<string, number>();
  for (const take of takes) {
    const id = before.bins[take.bin][take.index]?.provisionId;
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + take.qty);
  }
  void after;
  return [...map.entries()].map(([provisionId, qty]) => ({ provisionId, qty }));
}

export function previewCook(state: KitState, dishId: string, ctx?: CookCtx) {
  return cook(state, dishId, ctx, true);
}

function findIntent(item: Provision, intent: string): FieldIntent | undefined {
  return item.field.find((f) => f.intent === intent || f.op === intent);
}

function consumeOne(state: KitState, id: string): KitState | null {
  const demands: Demand[] = [{ provisionId: id, qty: 1, cured: false, allowSubstitution: false }];
  const plan = planTakes(state, demands, PROVISIONS);
  if (!plan.ok) return null;
  const next = cloneState(state);
  applyTakes(next, plan.takes);
  return next;
}

function markOneCured(state: KitState) {
  for (const bin of DRAW_ORDER) {
    for (let i = 0; i < state.bins[bin].length; i++) {
      const stack = state.bins[bin][i];
      const item = PROVISION_BY_ID[stack.provisionId];
      if (!item || (!item.meat && !item.fish) || stack.cured) continue;
      if (stack.qty === 1) stack.cured = true;
      else {
        stack.qty -= 1;
        commitAdd(state, bin, stack.provisionId, 1, true);
      }
      return stack.provisionId;
    }
  }
  return null;
}

const SMALL_GAME = new Set([pid(87), pid(88), pid(89)]);

export function useField(state: KitState, provisionId: string, intent: string, place?: string): StepResult {
  const item = PROVISION_BY_ID[provisionId];
  if (!item) return fail(state, "empty", "You are not holding that.");
  if (intent === "nibble") {
    if (!item.safeRaw) return fail(state, "unsafe-raw", `${item.name} is not eaten raw. Nothing was spent.`);
    const spec: EffectSpec = {
      id: "warmth",
      name: "Warmth",
      kind: "warmth",
      magnitude: 1,
      cap: 3,
      falloff: 0.5,
      exclusive: false,
      fictional: false,
    };
    const blocked = canApply(state, [spec]);
    if (blocked) return fail(state, blocked, "You are warm enough. Nothing was spent.");
    const next = consumeOne(state, item.id);
    if (!next) return fail(state, "missing-ingredient", "None in the bins.");
    applyEffects(next, [spec]);
    note(next, `Ate ${item.name} raw.`);
    return done(next, `Ate ${item.name}.`, [{ provisionId: item.id, qty: 1 }]);
  }
  const field = findIntent(item, intent);
  if (!field) return fail(state, "refused", `${item.name} does not do that.`);
  if (field.op === "cure" || field.op === "smoke") {
    if (qtyOf(state, item.id) < 1) return fail(state, "missing-ingredient", "None left.");
    const draft = cloneState(state);
    const marked = markOneCured(draft);
    if (!marked) return fail(state, "no-target", "No uncured fish or meat to mark.");
    const spent = consumeOne(draft, item.id);
    if (!spent) return fail(state, "missing-ingredient", "Could not spend it.");
    const name = PROVISION_BY_ID[marked]?.name ?? "the cut";
    note(spent, field.op === "smoke" ? `Smoked ${name}. It keeps the cured tag.` : `Cured ${name}. It keeps the cured tag.`);
    return done(spent, `Marked ${name} cured.`, [{ provisionId: item.id, qty: 1 }]);
  }
  if (field.op === "snare") {
    if (!["autumn", "deer", "ice"].includes(state.season)) {
      return fail(state, "bad-season", "Snares wait for autumn, deer season, or ice. Twine stays.");
    }
    const where = place || state.focusPlace;
    const node = NODES.find((n) => SMALL_GAME.has(n.provisionId) && (n.place === where || n.id === where));
    if (!node) return fail(state, "refused", "Not snare country. Nothing was spent.");
    if (!node.seasons.includes(state.season)) {
      return fail(state, "bad-season", "That animal is not moving in this notch. Nothing was spent.");
    }
    const drafted = consumeOne(state, item.id);
    if (!drafted) return fail(state, "missing-ingredient", "No twine or wire.");
    const given = tryGive(drafted, node.provisionId, 1);
    if (!given) return fail(state, "full", "No room for the catch. The snare was not set.");
    const animal = PROVISION_BY_ID[node.provisionId]?.name ?? "a small animal";
    note(given, `The snare at ${node.place} took one ${animal}.`);
    return done(given, `Snared ${animal}.`, [{ provisionId: item.id, qty: 1 }], [{ provisionId: node.provisionId, qty: 1 }]);
  }
  if (field.op === "pack") {
    const draft = cloneState(state);
    const stay: Stack[] = [];
    let moved = 0;
    for (const stack of draft.bins.pouch) {
      const kind = PROVISION_BY_ID[stack.provisionId]?.kind;
      if ((kind !== "ingredient" && kind !== "bait") || roomIn(draft, "cellar", stack.provisionId, !!stack.cured) < stack.qty) {
        stay.push(stack);
        continue;
      }
      commitAdd(draft, "cellar", stack.provisionId, stack.qty, !!stack.cured);
      moved += stack.qty;
    }
    draft.bins.pouch = stay;
    if (moved === 0) return fail(state, "refused", "Nothing in the pouch wanted the cellar.");
    const spent = consumeOne(draft, item.id);
    if (!spent) return fail(state, "missing-ingredient", "No twine to tie the pack.");
    note(spent, "Packed the pouch into the cellar.");
    return done(spent, "Packed.", [{ provisionId: item.id, qty: 1 }]);
  }
  if (field.op === "lash") {
    if (state.flags.lashedBobber) return fail(state, "refused", "A lash is already on the line.");
    const next = consumeOne(state, item.id);
    if (!next) return fail(state, "missing-ingredient", "No twine.");
    next.flags.lashedBobber = true;
    note(next, "Lashed a one-cast bobber.");
    return done(next, "Lashed a bobber.", [{ provisionId: item.id, qty: 1 }]);
  }
  if (field.op === "study") {
    if (state.flags.studiedJack) return done(state, "You already know: ridges from the soil, gills from the wood.");
    const next = cloneState(state);
    next.flags.studiedJack = true;
    note(next, "Jack-o'-lantern: true gills, on wood. Chanterelle: ridges, from the soil.");
    return done(next, "Studied. Nothing spent.");
  }
  if (field.op === "listen") {
    const spec = field.effect;
    if (!spec) return fail(state, "missing-effect", "Nothing to hear.");
    if (canApply(state, [spec])) return fail(state, "exclusive", "You already listened this life. The morel stays.");
    const ready = DISHES.filter((d) => d.stove && previewCook(state, d.id).ok).map((d) => d.name);
    const next = consumeOne(state, item.id);
    if (!next) return fail(state, "missing-ingredient", "No ghost morel.");
    applyEffects(next, [spec]);
    next.lastReading = ready;
    note(next, ready.length ? `The listen: ${ready.join(", ")}.` : "The listen: the stove cannot finish a plate.");
    return done(next, "Listened.", [{ provisionId: item.id, qty: 1 }]);
  }
  if (field.op === "seal") {
    const idx = state.bins.pouch.findIndex((st) => {
      const k = PROVISION_BY_ID[st.provisionId]?.kind;
      return k === "ingredient" || k === "bait";
    });
    if (idx < 0) return fail(state, "no-target", "Nothing in the pouch to seal.");
    const stack = state.bins.pouch[idx];
    const draft = cloneState(state);
    if (roomIn(draft, "tin", stack.provisionId, !!stack.cured) < stack.qty) {
      return fail(state, "full", "The tin cannot take that whole stack. Wax stays.");
    }
    draft.bins.pouch.splice(idx, 1);
    commitAdd(draft, "tin", stack.provisionId, stack.qty, !!stack.cured);
    const spent = consumeOne(draft, item.id);
    if (!spent) return fail(state, "missing-ingredient", "No wax.");
    note(spent, `Sealed ${PROVISION_BY_ID[stack.provisionId]?.name ?? "a stack"} into the tin.`);
    return done(spent, "Sealed.", [{ provisionId: item.id, qty: 1 }]);
  }
  if (field.op === "tin-slots") {
    if (state.tinSlots >= 8) return fail(state, "refused", "The tin bin is as wide as it gets.");
    const next = consumeOne(state, item.id);
    if (!next) return fail(state, "missing-ingredient", "No tin box.");
    next.tinSlots = Math.min(8, next.tinSlots + 2);
    note(next, "The camp tin is wider. It still survives a fall.");
    return done(next, "Tin widened.", [{ provisionId: item.id, qty: 1 }]);
  }
  if (field.op === "dress") {
    if (state.flags.lineDressed) return fail(state, "refused", "The line is already dressed.");
    const next = consumeOne(state, item.id);
    if (!next) return fail(state, "missing-ingredient", "No wax.");
    next.flags.lineDressed = true;
    note(next, "Dressed the line. It does not make the fish heavier.");
    return done(next, "Dressed the line.", [{ provisionId: item.id, qty: 1 }]);
  }
  if (field.op === "mend") {
    if (state.flags.mended) return fail(state, "exclusive", "You already mended something this life.");
    const spec = field.effect;
    if (!spec) return fail(state, "missing-effect", "No mend.");
    if (canApply(state, [spec])) return fail(state, "at-cap", "Calm is full.");
    const next = cloneState(state);
    next.flags.mended = true;
    applyEffects(next, [spec]);
    note(next, "Mended a tear. The needle stays.");
    return done(next, "Mended.");
  }
  if (field.op === "creel-slot") {
    if (state.flags.creelWidened) return fail(state, "refused", "The creel is already stitched.");
    const next = cloneState(state);
    next.flags.creelWidened = true;
    next.creelSlots += 1;
    note(next, "Stitched one more slot into the creel. The needle stays.");
    return done(next, "Creel stitched.");
  }
  if (field.op === "biscuit") {
    if (qtyOf(state, pid(9)) < 1 || qtyOf(state, pid(2)) < 1 || qtyOf(state, item.id) < 1) {
      return fail(state, "missing-ingredient", "A biscuit wants powder, flour, and butter. Nothing was spent.");
    }
    const spec: EffectSpec = {
      id: "warmth",
      name: "Warmth",
      kind: "warmth",
      magnitude: 1,
      cap: 3,
      falloff: 0.5,
      exclusive: false,
      fictional: false,
    };
    if (canApply(state, [spec])) return fail(state, "at-cap", "Warm enough. Nothing was spent.");
    const next = consumeOne(state, item.id);
    if (!next) return fail(state, "missing-ingredient", "No powder.");
    const flour = consumeOne(next, pid(9));
    const butter = flour && consumeOne(flour, pid(2));
    if (!butter) return fail(state, "missing-ingredient", "Short a biscuit part. Nothing was spent.");
    applyEffects(butter, [spec]);
    note(butter, "Raised a biscuit. Optional, like everything else here.");
    return done(butter, "Biscuit.", [
      { provisionId: item.id, qty: 1 },
      { provisionId: pid(9), qty: 1 },
      { provisionId: pid(2), qty: 1 },
    ]);
  }
  if (field.effect) {
    const blocked = canApply(state, [field.effect]);
    if (blocked) {
      return fail(state, blocked, blocked === "exclusive" ? "Already holding that. Nothing was spent." : "That gift is capped. Nothing was spent.");
    }
    const next = field.consumes ? consumeOne(state, item.id) : cloneState(state);
    if (!next) return fail(state, "missing-ingredient", "None left.");
    applyEffects(next, [field.effect]);
    note(next, field.note);
    return done(next, field.label, field.consumes ? [{ provisionId: item.id, qty: 1 }] : undefined);
  }
  return fail(state, "refused", "That use is not wired.");
}

export function selectBait(state: KitState, provisionId: string | null): StepResult {
  if (provisionId === null) {
    const next = cloneState(state);
    next.baitId = null;
    return done(next, "Bait cleared.");
  }
  const item = PROVISION_BY_ID[provisionId];
  if (!item?.bait) return fail(state, "no-bait", "That is not bait.");
  if (qtyOf(state, provisionId) < 1) return fail(state, "no-bait", "None in the bins.");
  const next = cloneState(state);
  next.baitId = provisionId;
  note(next, `Bait is ${item.name}. It is not spent until the cast.`);
  return done(next, `Selected ${item.name}.`);
}

function have(state: KitState, n: number) {
  return qtyOf(state, pid(n)) > 0;
}

export function castLine(state: KitState): StepResult {
  const water = WATERS.find((w) => w.id === state.waterId);
  if (!water) return fail(state, "empty", "No water selected.");
  if (!state.baitId) return fail(state, "no-bait", "Select bait first. Nothing was spent.");
  const bait = PROVISION_BY_ID[state.baitId];
  if (!bait?.bait) return fail(state, "no-bait", "That bait is gone.");
  if (qtyOf(state, bait.id) < 1) return fail(state, "no-bait", "The bait stack is empty.");
  if (!have(state, 109) || !have(state, 111)) {
    return fail(state, "no-tackle", "Hook and line stay in the kit. Nothing was spent.");
  }
  if (water.rig === "current" && !have(state, 110)) {
    return fail(state, "no-tackle", "Current wants split shot. Nothing was spent.");
  }
  if (water.rig === "still" && !have(state, 112) && !state.flags.lashedBobber) {
    return fail(state, "no-tackle", "Still water wants a bobber, or a twine lash. Nothing was spent.");
  }
  if (!bait.bait.rigs.includes(water.rig)) {
    return fail(state, "refused", `${bait.name} is not for a ${water.rig} rig. Nothing was spent.`);
  }
  const seasonHits = bait.bait.species
    .filter((id) => water.species.includes(id))
    .map((id) => PROVISION_BY_ID[id])
    .filter((fish) => fish && fish.seasons.includes(state.season))
    .sort((a, b) => a.id.localeCompare(b.id));
  const next = consumeOne(state, bait.id);
  if (!next) return fail(state, "no-bait", "Could not spend bait.");
  if (water.rig === "still" && next.flags.lashedBobber && !have(state, 112)) next.flags.lashedBobber = false;
  if (!seasonHits.length) {
    note(next, `${water.name} took the ${bait.name} and gave nothing back.`);
    return done(next, "Nothing took.", [{ provisionId: bait.id, qty: 1 }]);
  }
  const fish = seasonHits[0];
  const given = tryGive(next, fish.id, 1);
  if (!given) return fail(state, "full", "No room for a fish. The cast was not made.");
  const dressed = state.flags.lineDressed ? " The dressed line behaved." : "";
  note(given, `${water.name} gave a ${fish.name}.${dressed}`);
  return done(given, `Caught ${fish.name}.`, [{ provisionId: bait.id, qty: 1 }], [{ provisionId: fish.id, qty: 1 }]);
}

export function tradeStack(state: KitState, bin: Bin, index: number, qty: number): StepResult {
  const stack = state.bins[bin][index];
  if (!stack || qty <= 0 || qty > stack.qty) return fail(state, "empty", "That stack cannot sell that.");
  const item = PROVISION_BY_ID[stack.provisionId];
  if (!item || item.trade <= 0) return fail(state, "refused", "Nobody buys that.");
  const next = cloneState(state);
  const target = next.bins[bin][index];
  target.qty -= qty;
  if (target.qty <= 0) next.bins[bin].splice(index, 1);
  let value = item.trade * qty + (target.cured || stack.cured ? 2 * qty : 0);
  if (next.flags.oldOrchard && item.id === pid(45)) {
    value += 4;
    next.flags.oldOrchard = false;
  }
  next.barter += value;
  note(next, `Traded ${qty} ${item.name} for ${value} barter.`);
  return done(next, `Traded for ${value}.`, [{ provisionId: item.id, qty }]);
}

export function die(state: KitState, place = "Middlebury Green"): KitState {
  const next = cloneState(state);
  const grave: GraveCache = {
    year: state.year,
    place,
    pouch: next.bins.pouch,
    creel: next.bins.creel,
  };
  next.graves.push(grave);
  next.bins.pouch = [];
  next.bins.creel = [];
  next.effects = [];
  next.year += 14;
  next.life += 1;
  next.baitId = null;
  next.flags.lashedBobber = false;
  next.flags.lineDressed = false;
  next.flags.mended = false;
  next.flags.creelWidened = false;
  next.creelSlots = BASE_CREEL;
  note(next, `You fell at ${place}. ${next.year}. The cellar and the tin stayed. The body did not.`);
  return next;
}

export function digGrave(state: KitState, index: number): StepResult {
  const grave = state.graves[index];
  if (!grave) return fail(state, "empty", "No grave there.");
  let draft = cloneState(state);
  const pouch = draft.graves[index].pouch;
  const creel = draft.graves[index].creel;
  draft.graves[index].pouch = [];
  draft.graves[index].creel = [];
  const remainP: Stack[] = [];
  const remainC: Stack[] = [];
  let moved = 0;
  for (const stack of pouch) {
    const next = tryGive(draft, stack.provisionId, stack.qty, !!stack.cured);
    if (!next) remainP.push(stack);
    else {
      draft = next;
      moved += stack.qty;
    }
  }
  for (const stack of creel) {
    const next = tryGive(draft, stack.provisionId, stack.qty, !!stack.cured);
    if (!next) remainC.push(stack);
    else {
      draft = next;
      moved += stack.qty;
    }
  }
  const g = draft.graves[index];
  g.pouch = remainP;
  g.creel = remainC;
  if (remainP.length === 0 && remainC.length === 0) draft.graves.splice(index, 1);
  if (moved === 0) return fail(state, "full", "No room to dig the cache into. The grave stays.");
  note(draft, "Dug the cache. What fit came home. The rest is still in the ground.");
  return done(draft, "Dug the cache.");
}

export function serialize(state: KitState) {
  return JSON.stringify(state);
}

export function hydrate(raw: string): StepResult {
  try {
    const value = JSON.parse(raw) as KitState;
    if (!value || value.version !== 1 || !value.bins || !value.flags || typeof value.year !== "number") {
      return fail(initialState(), "bad-save", "The save is not this kitchen's.");
    }
    return done(value, "Loaded.");
  } catch {
    return fail(initialState(), "bad-save", "The save could not be read.");
  }
}

export type Destination =
  | { kind: "dish"; dishId: string; name: string }
  | { kind: "bait"; rig: string }
  | { kind: "field"; intent: string; label: string }
  | { kind: "trade" }
  | { kind: "tackle"; rig: string }
  | { kind: "stands-in"; forId: string; name: string; quality: number }
  | { kind: "nibble" };

const TACKLE: Record<string, string[]> = {
  [pid(109)]: ["current", "still", "champlain"],
  [pid(111)]: ["current", "still", "champlain"],
  [pid(110)]: ["current"],
  [pid(112)]: ["still"],
};

export function destinationsOf(item: Provision, dishes: readonly Dish[] = DISHES): Destination[] {
  const out: Destination[] = [];
  if (item.safeRaw) out.push({ kind: "nibble" });
  for (const field of item.field) out.push({ kind: "field", intent: field.intent, label: field.label });
  if (item.bait) for (const rig of item.bait.rigs) out.push({ kind: "bait", rig });
  for (const rig of TACKLE[item.id] ?? []) out.push({ kind: "tackle", rig });
  for (const dish of dishes) {
    if (dish.needs.some((n) => n.provisionId === item.id)) out.push({ kind: "dish", dishId: dish.id, name: dish.name });
  }
  for (const sub of item.substitutions) {
    out.push({
      kind: "stands-in",
      forId: sub.forId,
      name: PROVISION_BY_ID[sub.forId]?.name ?? sub.forId,
      quality: sub.quality,
    });
  }
  if (item.trade > 0) out.push({ kind: "trade" });
  return out;
}

export function waters(): readonly Water[] {
  return WATERS;
}

export function provisions(): readonly Provision[] {
  return PROVISIONS;
}

export function nodes(): readonly SourceNode[] {
  return NODES;
}
