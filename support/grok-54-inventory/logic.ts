import { AUTHORED_BY_ID, RECIPES, STORY_WITHHELD_COUNT } from "./catalog.ts";
import { FIXTURE_TOTAL, FIXTURES_BY_ID } from "./fixtures.ts";
import { seed } from "./seed.ts";
import {
  CARRY_PURPOSE,
  STAT_LABEL,
  type Action,
  type CarryReport,
  type ContainerId,
  type DismantlePlan,
  type Effect,
  type InventoryState,
  type ItemDef,
  type ItemInstance,
  type PlayerItem,
  type PlayerUse,
  type RecipeView,
  type SkipReason,
  type SortKey,
} from "./types.ts";

const DEFS: Record<string, ItemDef> = { ...AUTHORED_BY_ID, ...FIXTURES_BY_ID };
const HEFT = { light: 0, moderate: 1, heavy: 2 };
const QUIET = new Set<Action["type"]>([
  "search",
  "sort",
  "kind",
  "content",
  "favoritesOnly",
  "protectedOnly",
  "focus",
  "move",
  "favorite",
  "toggle-select",
  "clear-selection",
  "cancel-pending",
  "confirm-pending",
  "begin-modify",
  "begin-dismantle",
]);

export function defOf(id: string): ItemDef {
  const def = DEFS[id];
  if (!def) throw new Error(`Unknown item ${id}`);
  return def;
}

export function allDefs(): ItemDef[] {
  return Object.values(DEFS);
}

function findInst(state: InventoryState, id: string): ItemInstance | null {
  return state.instances.find((inst) => inst.instanceId === id) ?? null;
}

function hay(def: ItemDef, inst: ItemInstance): string {
  return [
    def.name,
    def.kind,
    def.contentClass,
    def.summary,
    def.tags.join(" "),
    def.setName ?? "",
    inst.provenance.place,
    inst.provenance.note,
    inst.provenance.yearLabel,
    inst.container,
    inst.favorite ? "favorite" : "",
  ]
    .join("\n")
    .toLowerCase();
}

function compareRows(a: ItemInstance, b: ItemInstance, sort: SortKey): number {
  const da = defOf(a.defId);
  const db = defOf(b.defId);
  if (sort === "favorite" && a.favorite !== b.favorite) return a.favorite ? -1 : 1;
  let diff = 0;
  if (sort === "qty") diff = b.qty - a.qty;
  else if (sort === "recent") diff = b.acquiredAt - a.acquiredAt;
  else if (sort === "heft") diff = HEFT[da.heft] - HEFT[db.heft];
  else if (sort === "kind") diff = da.kind.localeCompare(db.kind);
  else diff = da.name.localeCompare(db.name);
  if (diff === 0) diff = da.name.localeCompare(db.name);
  if (diff === 0) diff = a.instanceId.localeCompare(b.instanceId);
  return diff;
}

export function visibleIds(state: InventoryState): string[] {
  const terms = state.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const itemView = state.view === "pack" || state.view === "hearth" || state.view === "display";
  if (!terms.length && !itemView) return [];
  const rows: ItemInstance[] = [];
  for (const inst of state.instances) {
    const def = defOf(inst.defId);
    if (state.favoritesOnly && !inst.favorite) continue;
    if (state.protectedOnly && def.protection === "none") continue;
    if (state.kind !== "all" && def.kind !== state.kind) continue;
    if (state.content === "authored" && def.contentClass !== "authored") continue;
    if (state.content === "fixture" && def.contentClass !== "fixture") continue;
    if (!terms.length) {
      if (state.view === "pack" && inst.container !== "pack") continue;
      if (state.view === "hearth" && inst.container !== "hearth") continue;
      if (state.view === "display" && inst.container !== "display") continue;
    } else if (!terms.every((term) => hay(def, inst).includes(term))) continue;
    rows.push(inst);
  }
  rows.sort((a, b) => compareRows(a, b, state.sort));
  return rows.map((row) => row.instanceId);
}

function syncCursor(state: InventoryState): InventoryState {
  const ids = visibleIds(state);
  if (state.focusedId && ids.includes(state.focusedId)) {
    const cursor = ids.indexOf(state.focusedId);
    return cursor === state.cursor ? state : { ...state, cursor };
  }
  const cursor = ids.length ? Math.min(Math.max(0, state.cursor), ids.length - 1) : 0;
  return cursor === state.cursor ? state : { ...state, cursor };
}

function withNotice(
  state: InventoryState,
  effects: Effect[],
  tone: Effect extends never ? never : "info" | "discover" | "warn" | "ok",
  text: string,
): InventoryState {
  const noticeSeq = state.noticeSeq + 1;
  effects.push({ type: "notice", notice: { id: noticeSeq, tone, text } });
  return { ...state, noticeSeq };
}

function interrupt(state: InventoryState, effects: Effect[]): InventoryState {
  if (!state.pending) return state;
  const text =
    state.pending.kind === "modify"
      ? "Modify interrupted. The item was not changed."
      : "Dismantle interrupted. Nothing was removed.";
  return withNotice({ ...state, pending: null }, effects, "warn", text);
}

function countOf(state: InventoryState, container: ContainerId): number {
  let count = 0;
  for (const inst of state.instances) if (inst.container === container) count += 1;
  return count;
}

function place(
  state: InventoryState,
  incoming: ItemInstance,
  order: ContainerId[],
  overflowProtected: boolean,
): { state: InventoryState; container: ContainerId | null; id: string | null } {
  const def = defOf(incoming.defId);
  for (const container of order) {
    if (container === "equipped") continue;
    if (!def.unique && def.stackLimit > 1) {
      const host = state.instances.find(
        (inst) =>
          inst.container === container &&
          inst.defId === incoming.defId &&
          inst.qty + incoming.qty <= def.stackLimit &&
          inst.provenance.era === incoming.provenance.era &&
          inst.provenance.place === incoming.provenance.place,
      );
      if (host) {
        const instances = state.instances.map((inst) =>
          inst.instanceId === host.instanceId
            ? { ...inst, qty: inst.qty + incoming.qty, favorite: inst.favorite || incoming.favorite }
            : inst,
        );
        return { state: { ...state, instances }, container, id: host.instanceId };
      }
    }
    const cap =
      container === "pack" ? state.caps.pack : container === "hearth" ? state.caps.hearth : state.caps.display;
    const count = countOf(state, container);
    const overflow = overflowProtected && def.protection !== "none" && container === "hearth" && count >= cap;
    if (count >= cap && !overflow) continue;
    const inst: ItemInstance = { ...incoming, container, slot: undefined };
    return { state: { ...state, instances: [...state.instances, inst] }, container, id: inst.instanceId };
  }
  return { state, container: null, id: null };
}

function moveTo(
  state: InventoryState,
  id: string,
  order: ContainerId[],
  overflowProtected: boolean,
): { state: InventoryState; container: ContainerId | null; id: string | null } {
  const inst = findInst(state, id);
  if (!inst) return { state, container: null, id: null };
  const without: InventoryState = {
    ...state,
    instances: state.instances.filter((row) => row.instanceId !== id),
  };
  const placed = place(without, { ...inst }, order, overflowProtected);
  if (!placed.id) return { state, container: null, id: null };
  let next = placed.state;
  if (state.focusedId === id && placed.id !== id) next = { ...next, focusedId: placed.id };
  if (placed.id !== id && next.selected.includes(id)) {
    next = { ...next, selected: next.selected.map((sid) => (sid === id ? placed.id! : sid)) };
  }
  return { state: next, container: placed.container, id: placed.id };
}

export function heldQty(state: InventoryState, defId: string, consume: boolean): number {
  let total = 0;
  for (const inst of state.instances) {
    if (inst.defId !== defId) continue;
    if (inst.container === "display") continue;
    if (consume && inst.container === "equipped") continue;
    total += inst.qty;
  }
  return total;
}

function ownsTool(state: InventoryState, defId: string): boolean {
  return heldQty(state, defId, false) > 0;
}

function consume(state: InventoryState, defId: string, qty: number): InventoryState | null {
  if (heldQty(state, defId, true) < qty) return null;
  let need = qty;
  const instances = state.instances.map((inst) => ({ ...inst }));
  for (const container of ["pack", "hearth"] as const) {
    for (const inst of instances) {
      if (need <= 0) break;
      if (inst.defId !== defId || inst.container !== container || inst.qty <= 0) continue;
      const take = Math.min(inst.qty, need);
      inst.qty -= take;
      need -= take;
    }
  }
  if (need > 0) return null;
  return { ...state, instances: instances.filter((inst) => inst.qty > 0) };
}

function consumeOne(state: InventoryState, id: string): InventoryState | null {
  const inst = findInst(state, id);
  if (!inst || inst.qty < 1) return null;
  return {
    ...state,
    instances: state.instances
      .map((row) => (row.instanceId === id ? { ...row, qty: row.qty - 1 } : row))
      .filter((row) => row.qty > 0),
  };
}

export function project(state: InventoryState, id: string): PlayerItem | null {
  const inst = findInst(state, id);
  if (!inst) return null;
  const def = defOf(inst.defId);
  const uses: PlayerUse[] = [];
  let unconfirmed = 0;
  for (const use of def.uses) {
    const learned = inst.learnedUseIds.includes(use.id);
    if (use.visibility === "learnable" && !learned) {
      unconfirmed += 1;
      uses.push({
        id: use.id,
        verb: "inspect",
        label: "A practical use not yet confirmed",
        where: "Inspect to confirm",
        confirmed: false,
      });
    } else {
      uses.push({
        id: use.id,
        verb: use.verb,
        label: use.label,
        where: use.where,
        confirmed: true,
      });
    }
  }
  return {
    instanceId: inst.instanceId,
    defId: def.id,
    name: def.name,
    kind: def.kind,
    contentClass: def.contentClass,
    heft: def.heft,
    qty: inst.qty,
    container: inst.container,
    slot: def.slot,
    favorite: inst.favorite,
    condition: inst.condition,
    protection: def.protection,
    dismantlable: def.dismantlable,
    modifiable: def.modifiable,
    summary: def.summary,
    uses,
    unconfirmed,
    storyWithheld: STORY_WITHHELD_COUNT[def.id] ?? 0,
    provenance: inst.provenance,
    keptThroughInterval: inst.keptThroughInterval,
    setId: def.setId,
    setName: def.setName,
    tags: def.tags,
    stats: def.stats,
  };
}

function hasResultRoom(state: InventoryState, resultDefId: string, qty: number): boolean {
  const def = defOf(resultDefId);
  for (const container of ["pack", "hearth"] as const) {
    if (!def.unique && def.stackLimit > 1) {
      const host = state.instances.find(
        (inst) => inst.container === container && inst.defId === resultDefId && inst.qty + qty <= def.stackLimit,
      );
      if (host) return true;
    }
    if (countOf(state, container) < state.caps[container]) return true;
  }
  return false;
}

export function recipeViews(state: InventoryState): RecipeView[] {
  const views: RecipeView[] = [];
  for (const recipe of RECIPES) {
    if (!recipe.known) continue;
    const lines = recipe.ingredients.map((ing) => ({
      defId: ing.defId,
      name: defOf(ing.defId).name,
      need: ing.qty,
      have: heldQty(state, ing.defId, ing.consume),
      consume: ing.consume,
    }));
    const missing = lines.filter((line) => line.have < line.need);
    const stationOk = recipe.station === "pack" || state.atHearth;
    const room = hasResultRoom(state, recipe.resultDefId, recipe.resultQty);
    let reason = recipe.station === "hearth" ? "Ready at the hearth." : "Ready in the pack.";
    if (!stationOk) reason = "This is done at the hearth.";
    else if (missing.length) {
      reason = `Missing ${missing.map((line) => `${line.name} (${line.have}/${line.need})`).join(", ")}.`;
    } else if (!room) reason = "No room in the pack or the hearth for the result.";
    views.push({
      id: recipe.id,
      name: recipe.name,
      station: recipe.station,
      blurb: recipe.blurb,
      lines,
      ready: stationOk && missing.length === 0 && room,
      reason,
      resultName: defOf(recipe.resultDefId).name,
    });
  }
  return views;
}

export function recipesTouching(state: InventoryState, defId: string): RecipeView[] {
  return recipeViews(state).filter((view) => {
    if (view.lines.some((line) => line.defId === defId)) return true;
    const recipe = RECIPES.find((row) => row.id === view.id);
    return recipe?.resultDefId === defId;
  });
}

export function dismantlePlan(state: InventoryState, ids: string[]): DismantlePlan {
  const ok: ItemInstance[] = [];
  const skipped: DismantlePlan["skipped"] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const inst = findInst(state, id);
    if (!inst) continue;
    const def = defOf(inst.defId);
    let reason: SkipReason | null = null;
    if (def.protection !== "none") reason = "Protected";
    else if (def.contentClass !== "fixture") reason = "Authored";
    else if (!def.dismantlable) reason = "Not dismantlable";
    else if (inst.favorite) reason = "Favorite";
    else if (inst.container === "equipped") reason = "Worn";
    if (reason) skipped.push({ inst, reason });
    else ok.push(inst);
  }
  return { ok, skipped };
}

export function modifyPreview(
  state: InventoryState,
  id: string,
): { from: number; to: number; name: string; tool: string } | { error: string } {
  const inst = findInst(state, id);
  if (!inst) return { error: "That item is gone." };
  const def = defOf(inst.defId);
  if (!def.modifiable) return { error: "This does not take an edge." };
  if (!ownsTool(state, "whetstone")) return { error: "The river whetstone is not in the pack or the hearth." };
  if (inst.condition >= 100) return { error: "Already honed." };
  return {
    from: inst.condition,
    to: Math.min(100, inst.condition + 18),
    name: def.name,
    tool: "River whetstone",
  };
}

export type CompareRow = { stat: string; item: number | null; worn: number | null };

export function comparison(state: InventoryState, id: string): null | {
  slot: NonNullable<ItemDef["slot"]>;
  worn: PlayerItem | null;
  rows: CompareRow[];
  same: boolean;
} {
  const item = project(state, id);
  if (!item?.slot) return null;
  const wornInst = state.instances.find((inst) => inst.container === "equipped" && defOf(inst.defId).slot === item.slot);
  const worn = wornInst ? project(state, wornInst.instanceId) : null;
  const keys = ["warmth", "grip", "care", "reach"] as const;
  const rows = keys
    .filter((key) => item.stats?.[key] != null || worn?.stats?.[key] != null)
    .map((key) => ({
      stat: STAT_LABEL[key],
      item: item.stats?.[key] ?? null,
      worn: worn?.stats?.[key] ?? null,
    }));
  return { slot: item.slot, worn, rows, same: worn?.instanceId === item.instanceId };
}

export type SetProgress = {
  setId: string;
  name: string;
  owned: number;
  goal: number | null;
  ids: string[];
};

const SET_GOAL: Record<string, number> = { quilt: 3, flora: 1, keepsakes: 1 };

export function collections(state: InventoryState): SetProgress[] {
  const map = new Map<string, SetProgress>();
  for (const inst of state.instances) {
    const def = defOf(inst.defId);
    if (!def.setId || def.contentClass !== "authored") continue;
    let row = map.get(def.setId);
    if (!row) {
      row = {
        setId: def.setId,
        name: def.setName ?? def.setId,
        owned: 0,
        goal: SET_GOAL[def.setId] ?? null,
        ids: [],
      };
      map.set(def.setId, row);
    }
    row.owned += 1;
    row.ids.push(inst.instanceId);
  }
  return [...map.values()];
}

export function census(state: InventoryState) {
  const counts = { authored: 0, fixture: 0, pack: 0, hearth: 0, display: 0, equipped: 0 };
  for (const inst of state.instances) {
    const def = defOf(inst.defId);
    if (def.contentClass === "fixture") counts.fixture += 1;
    else counts.authored += 1;
    counts[inst.container] += 1;
  }
  return { ...counts, fixtureDefs: FIXTURE_TOTAL };
}

export function carryReport(state: InventoryState): CarryReport {
  const counts = census(state);
  let heavyInPack = 0;
  for (const inst of state.instances) {
    if (inst.container === "pack" && defOf(inst.defId).heft === "heavy") heavyInPack += 1;
  }
  return {
    packSlots: counts.pack,
    packCap: state.caps.pack,
    hearthSlots: counts.hearth,
    hearthCap: state.caps.hearth,
    displaySlots: counts.display,
    displayCap: state.caps.display,
    heavyInPack,
    purpose: CARRY_PURPOSE,
  };
}

export type PreparedIndex = { ids: string[]; hay: string[] };

export function buildSearchIndex(state: InventoryState): PreparedIndex {
  const ids: string[] = [];
  const stacks: string[] = [];
  for (const inst of state.instances) {
    ids.push(inst.instanceId);
    stacks.push(hay(defOf(inst.defId), inst));
  }
  return { ids, hay: stacks };
}

export function searchPrepared(index: PreparedIndex, query: string): string[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return index.ids.slice();
  const out: string[] = [];
  for (let i = 0; i < index.ids.length; i++) {
    const row = index.hay[i] ?? "";
    if (terms.every((term) => row.includes(term))) out.push(index.ids[i] ?? "");
  }
  return out;
}

export function showsItemList(state: InventoryState): boolean {
  if (state.query.trim()) return true;
  return state.view === "pack" || state.view === "hearth" || state.view === "display";
}

export function playerFacingText(state: InventoryState): string {
  const parts: string[] = [CARRY_PURPOSE];
  for (const inst of state.instances) {
    const view = project(state, inst.instanceId);
    if (!view) continue;
    parts.push(view.name, view.summary, view.provenance.note, view.provenance.place, view.provenance.yearLabel);
    for (const use of view.uses) parts.push(use.label, use.where);
    if (view.storyWithheld > 0) parts.push("Something in this is still unread.");
  }
  for (const recipe of recipeViews(state)) parts.push(recipe.name, recipe.blurb, recipe.reason, recipe.resultName);
  return parts.join("\n");
}

export function initialState(): InventoryState {
  return syncCursor(seed());
}

function finish(prev: InventoryState, state: InventoryState, effects: Effect[]) {
  let next = state;
  if (next.focusedId && !next.instances.some((inst) => inst.instanceId === next.focusedId)) {
    const oldIds = visibleIds(prev);
    const index = Math.max(0, oldIds.indexOf(prev.focusedId ?? ""));
    const now = visibleIds(next);
    next = { ...next, focusedId: now[Math.min(index, Math.max(0, now.length - 1))] ?? null };
  }
  return { state: syncCursor(next), effects };
}

function inspect(state: InventoryState, effects: Effect[], id: string): InventoryState {
  const inst = findInst(state, id);
  if (!inst) return withNotice(state, effects, "warn", "That item is no longer here.");
  const def = defOf(inst.defId);
  const pendingLearn = def.uses.filter(
    (use) => use.visibility === "learnable" && !inst.learnedUseIds.includes(use.id),
  );
  if (pendingLearn.length) {
    const learned = pendingLearn[0];
    if (!learned) return state;
    const instances = state.instances.map((row) =>
      row.instanceId === id ? { ...row, learnedUseIds: [...row.learnedUseIds, learned.id] } : row,
    );
    return withNotice(
      { ...state, instances },
      effects,
      "discover",
      `Confirmed: ${learned.label}. ${learned.where}.`,
    );
  }
  if ((STORY_WITHHELD_COUNT[def.id] ?? 0) > 0) {
    return withNotice(state, effects, "info", `${def.summary} Something in this is still unread.`);
  }
  return withNotice(state, effects, "info", def.summary);
}

function applyUse(state: InventoryState, effects: Effect[], id: string): InventoryState {
  const inst = findInst(state, id);
  if (!inst) return withNotice(state, effects, "warn", "That item is no longer here.");
  const def = defOf(inst.defId);
  if (def.contentClass === "fixture") {
    return withNotice(state, effects, "info", "Fixture records are an index, not something to spend.");
  }
  if (def.id === "flask") {
    return withNotice(state, effects, "ok", "You drink. Refill the flask at the river when you can.");
  }
  if (def.id === "hearth-key") {
    return withNotice(
      state,
      effects,
      "info",
      "The key opens the shared chest. Hearth storage is already open to you. Keep the key.",
    );
  }
  if (def.id === "unsent-letter") {
    return withNotice(state, effects, "info", "The seal stays unbroken.");
  }
  if (def.id === "rye-seed") {
    if (!state.atHearth) return withNotice(state, effects, "warn", "Planting waits for the homestead plot.");
    const next = consumeOne(state, id);
    if (!next) return withNotice(state, effects, "warn", "No seed left in this packet.");
    effects.push({ type: "homestead", text: "Planted winter rye on the homestead plot." });
    return withNotice(next, effects, "ok", "Planted a row of winter rye.");
  }
  if (def.id === "resin-kindling") {
    if (!state.atHearth) return withNotice(state, effects, "warn", "Kindling lights at the hearth.");
    const next = consumeOne(state, id);
    if (!next) return state;
    return withNotice(next, effects, "ok", "It catches. The bundle is spent.");
  }
  if (def.id === "birch-tinder") {
    return withNotice(
      state,
      effects,
      "info",
      state.atHearth
        ? "The bark can feed the hearth. Bind it with resin if you want a bundle you can spend."
        : "Loose tinder wants a hearth, or resin to bind it in the pack.",
    );
  }
  if (def.kind === "food") {
    const next = consumeOne(state, id);
    if (!next) return withNotice(state, effects, "warn", "Nothing left to eat.");
    return withNotice(next, effects, "ok", `Eaten: ${def.name}.`);
  }
  if (def.kind === "narrative" || def.kind === "quest") return inspect(state, effects, id);
  return withNotice(state, effects, "info", "Nothing is spent. See what it can do, and where.");
}

function equip(state: InventoryState, effects: Effect[], id: string): InventoryState {
  const inst = findInst(state, id);
  if (!inst) return withNotice(state, effects, "warn", "That item is no longer here.");
  const def = defOf(inst.defId);
  if (!def.slot) return withNotice(state, effects, "info", "This is not worn.");
  if (inst.container === "equipped") return withNotice(state, effects, "info", `${def.name} is already worn.`);
  let working = state;
  const prev = state.instances.find(
    (row) => row.container === "equipped" && defOf(row.defId).slot === def.slot && row.instanceId !== id,
  );
  let displaced: string | null = null;
  if (prev) {
    const moved = moveTo(working, prev.instanceId, ["pack", "hearth"], true);
    if (!moved.id) {
      return withNotice(state, effects, "warn", `No room to set aside ${defOf(prev.defId).name}.`);
    }
    working = moved.state;
    displaced = defOf(prev.defId).name;
    if (moved.container === "hearth") {
      effects.push({ type: "homestead", text: `Shared hearth accepted ${displaced}.` });
    }
  }
  const current = findInst(working, id);
  if (!current) return withNotice(state, effects, "warn", "That item is no longer here.");
  if (current.container === "hearth") {
    effects.push({ type: "homestead", text: `Withdrew ${def.name} from shared storage to wear.` });
  }
  let instances = working.instances;
  if (current.qty > 1) {
    const peeled: ItemInstance = {
      ...current,
      instanceId: `gen-${working.nextSerial}`,
      qty: 1,
      container: "equipped",
      slot: def.slot,
    };
    instances = instances
      .map((row) => (row.instanceId === id ? { ...row, qty: row.qty - 1 } : row))
      .concat(peeled);
    working = { ...working, instances, nextSerial: working.nextSerial + 1, focusedId: peeled.instanceId };
  } else {
    working = {
      ...working,
      instances: instances.map((row) =>
        row.instanceId === id ? { ...row, container: "equipped" as const, slot: def.slot } : row,
      ),
    };
  }
  const extra = displaced ? ` ${displaced} is set aside.` : "";
  return withNotice(working, effects, "ok", `Wearing ${def.name}.${extra}`);
}

function unequip(state: InventoryState, effects: Effect[], id: string): InventoryState {
  const inst = findInst(state, id);
  if (!inst || inst.container !== "equipped") {
    return withNotice(state, effects, "info", "It is not worn.");
  }
  const def = defOf(inst.defId);
  const moved = moveTo(state, id, ["pack", "hearth"], true);
  if (!moved.container || !moved.state) return withNotice(state, effects, "warn", "No room to take it off.");
  const where = moved.container === "pack" ? "back in the pack" : "at the hearth, because the pack is full";
  if (moved.container === "hearth") {
    effects.push({ type: "homestead", text: `Shared hearth accepted ${def.name}.` });
  }
  return withNotice(moved.state, effects, "ok", `${def.name} is ${where}.`);
}

function fileTo(
  state: InventoryState,
  effects: Effect[],
  id: string,
  dest: "hearth" | "pack" | "display",
): InventoryState {
  const inst = findInst(state, id);
  if (!inst) return withNotice(state, effects, "warn", "That item is no longer here.");
  const def = defOf(inst.defId);
  if (dest !== "hearth" && inst.container === "equipped") {
    return withNotice(state, effects, "info", "Take it off before moving it.");
  }
  if (dest === "hearth" && inst.container === "equipped") return unequip(state, effects, id);
  if (inst.container === dest) {
    const label = dest === "hearth" ? "the hearth" : dest === "pack" ? "the pack" : "the shelf";
    return withNotice(state, effects, "info", `${def.name} is already in ${label}.`);
  }
  const order: ContainerId[] = dest === "display" ? ["display"] : dest === "pack" ? ["pack"] : ["hearth"];
  const moved = moveTo(state, id, order, dest === "hearth");
  if (!moved.container) {
    if (dest === "pack") return withNotice(state, effects, "warn", "The pack is full. It stays where it is.");
    if (dest === "display") return withNotice(state, effects, "warn", "The shelf is full.");
    return withNotice(state, effects, "warn", "The hearth cannot take it.");
  }
  if (dest === "hearth") effects.push({ type: "homestead", text: `Deposited ${def.name} into shared hearth storage.` });
  if (dest === "display") effects.push({ type: "homestead", text: `Placed ${def.name} on the display shelf.` });
  if (dest === "pack") effects.push({ type: "homestead", text: `Withdrew ${def.name} from shared storage.` });
  const phrase = dest === "hearth" ? "Filed at the hearth." : dest === "pack" ? "Taken into the pack." : "Set on the shelf.";
  return withNotice(moved.state, effects, "ok", `${def.name}. ${phrase}`);
}

function craft(state: InventoryState, effects: Effect[], recipeId: string): InventoryState {
  const view = recipeViews(state).find((recipe) => recipe.id === recipeId);
  const recipe = RECIPES.find((row) => row.id === recipeId && row.known);
  if (!view || !recipe) return withNotice(state, effects, "warn", "That preparation is not known.");
  if (!view.ready) return withNotice(state, effects, "warn", view.reason);
  let working = state;
  for (const ing of recipe.ingredients) {
    if (!ing.consume) continue;
    const next = consume(working, ing.defId, ing.qty);
    if (!next) return withNotice(state, effects, "warn", view.reason);
    working = next;
  }
  const made: ItemInstance = {
    instanceId: `gen-${working.nextSerial}`,
    defId: recipe.resultDefId,
    qty: recipe.resultQty,
    container: "pack",
    favorite: false,
    condition: 100,
    provenance: {
      era: "after",
      place: recipe.station === "hearth" ? "The hearth" : "The pack",
      note: recipe.station === "hearth" ? "Made at the hearth." : "Made in the pack.",
      yearLabel: "Fourteen years on",
    },
    learnedUseIds: [],
    acquiredAt: working.nextSerial,
    keptThroughInterval: false,
  };
  working = { ...working, nextSerial: working.nextSerial + 1 };
  const prefer: ContainerId[] = recipe.station === "hearth" ? ["hearth", "pack"] : ["pack", "hearth"];
  const placed = place(working, made, prefer, false);
  if (!placed.id) return withNotice(state, effects, "warn", "No room for the result. Nothing was spent.");
  working = { ...placed.state, focusedId: placed.id };
  if (!working.discovered.includes(recipe.resultDefId)) {
    working = { ...working, discovered: [...working.discovered, recipe.resultDefId] };
  }
  if (placed.container === "hearth") {
    effects.push({ type: "homestead", text: `Shared hearth accepted ${view.resultName}.` });
  }
  return withNotice(working, effects, "discover", `Made ${view.resultName}. ${view.blurb}`);
}

export function reduce(state: InventoryState, action: Action): { state: InventoryState; effects: Effect[] } {
  const effects: Effect[] = [];
  let current = state;
  if (current.pending && !QUIET.has(action.type)) current = interrupt(current, effects);

  switch (action.type) {
    case "search":
      return finish(state, { ...current, query: action.query }, effects);
    case "sort":
      return finish(state, { ...current, sort: action.sort }, effects);
    case "kind":
      return finish(state, { ...current, kind: action.kind }, effects);
    case "content":
      return finish(state, { ...current, content: action.content }, effects);
    case "favoritesOnly":
      return finish(state, { ...current, favoritesOnly: action.on }, effects);
    case "protectedOnly":
      return finish(state, { ...current, protectedOnly: action.on }, effects);
    case "view":
      return finish(state, { ...current, view: action.view }, effects);
    case "focus":
      return finish(state, { ...current, focusedId: action.id }, effects);
    case "move": {
      const ids = visibleIds(current);
      if (!ids.length) return finish(state, current, effects);
      let index =
        current.focusedId && ids.includes(current.focusedId) ? ids.indexOf(current.focusedId) : current.cursor;
      if (action.dir === "home") index = 0;
      else if (action.dir === "end") index = ids.length - 1;
      else if (action.dir === 1) index = Math.min(ids.length - 1, index + 1);
      else if (action.dir === -1) index = Math.max(0, index - 1);
      else if (action.dir === "pagedown") index = Math.min(ids.length - 1, index + 8);
      else index = Math.max(0, index - 8);
      return finish(state, { ...current, focusedId: ids[index] ?? null, cursor: index }, effects);
    }
    case "toggle-batch":
      return finish(
        state,
        current.batch ? { ...current, batch: false, selected: [] } : { ...current, batch: true },
        effects,
      );
    case "toggle-select": {
      const selected = current.selected.includes(action.id)
        ? current.selected.filter((id) => id !== action.id)
        : [...current.selected, action.id];
      return finish(state, { ...current, selected, batch: true }, effects);
    }
    case "clear-selection":
      return finish(state, { ...current, selected: [], batch: false }, effects);
    case "favorite": {
      const inst = findInst(current, action.id);
      if (!inst) return finish(state, current, effects);
      const on = !inst.favorite;
      const instances = current.instances.map((row) =>
        row.instanceId === action.id ? { ...row, favorite: on } : row,
      );
      return finish(
        state,
        withNotice(
          { ...current, instances },
          effects,
          "info",
          on ? `Marked ${defOf(inst.defId).name} as a favorite.` : `Cleared the favorite on ${defOf(inst.defId).name}.`,
        ),
        effects,
      );
    }
    case "pickup": {
      const stack = current.ground.find((row) => row.groundId === action.groundId);
      if (!stack) return finish(state, withNotice(current, effects, "warn", "Nothing there to pick up."), effects);
      const def = defOf(stack.defId);
      const incoming: ItemInstance = {
        instanceId: `gen-${current.nextSerial}`,
        defId: stack.defId,
        qty: stack.qty,
        container: "pack",
        favorite: false,
        condition: stack.condition,
        provenance: stack.provenance,
        learnedUseIds: [],
        acquiredAt: current.nextSerial,
        keptThroughInterval: false,
      };
      const draft = { ...current, nextSerial: current.nextSerial + 1 };
      const placed = place(draft, incoming, ["pack", "hearth"], true);
      if (!placed.id || !placed.container) {
        return finish(
          state,
          withNotice(
            current,
            effects,
            "warn",
            `No room in the pack or the hearth. ${def.name} stays on the ground.`,
          ),
          effects,
        );
      }
      let next: InventoryState = {
        ...placed.state,
        ground: placed.state.ground.filter((row) => row.groundId !== stack.groundId),
        focusedId: placed.id,
      };
      const qty = stack.qty > 1 ? ` ×${stack.qty}` : "";
      const first = def.contentClass === "authored" && !current.discovered.includes(def.id);
      let text =
        placed.container === "pack"
          ? `Picked up ${def.name}${qty}.`
          : `Pack is full. ${def.name}${qty} filed at the hearth.`;
      if (def.heft === "heavy" && placed.container === "pack") text += " It is heavy, and it will not slow you.";
      let tone: "ok" | "discover" = "ok";
      if (first) {
        const uses = def.uses
          .filter((use) => use.visibility === "known")
          .slice(0, 2)
          .map((use) => `${use.label} (${use.where})`)
          .join("; ");
        tone = "discover";
        text = `First time in hand: ${def.name}. ${placed.container === "hearth" ? "The pack was full, so it was filed at the hearth. " : ""}${uses ? `Known: ${uses}.` : ""}`;
        next = { ...next, discovered: [...next.discovered, def.id] };
      }
      if (placed.container === "hearth") {
        effects.push({ type: "homestead", text: `Shared hearth accepted ${def.name}.` });
      }
      return finish(state, withNotice(next, effects, tone, text), effects);
    }
    case "stash":
      return finish(state, fileTo(current, effects, action.id, "hearth"), effects);
    case "withdraw":
      return finish(state, fileTo(current, effects, action.id, "pack"), effects);
    case "display":
      return finish(state, fileTo(current, effects, action.id, "display"), effects);
    case "undisplay":
      return finish(state, fileTo(current, effects, action.id, "pack"), effects);
    case "equip":
      return finish(state, equip(current, effects, action.id), effects);
    case "unequip":
      return finish(state, unequip(current, effects, action.id), effects);
    case "use":
      return finish(state, applyUse(current, effects, action.id), effects);
    case "inspect":
      return finish(state, inspect(current, effects, action.id), effects);
    case "begin-modify": {
      const preview = modifyPreview(current, action.id);
      if ("error" in preview) return finish(state, withNotice(current, effects, "warn", preview.error), effects);
      return finish(state, { ...current, pending: { kind: "modify", id: action.id }, focusedId: action.id }, effects);
    }
    case "begin-dismantle":
      return finish(state, { ...current, pending: { kind: "dismantle", ids: action.ids } }, effects);
    case "cancel-pending": {
      if (!current.pending) return finish(state, current, effects);
      const kind = current.pending.kind;
      return finish(
        state,
        withNotice(
          { ...current, pending: null },
          effects,
          "info",
          kind === "modify" ? "Modify cancelled. The item was not changed." : "Dismantle cancelled. Nothing was removed.",
        ),
        effects,
      );
    }
    case "confirm-pending": {
      if (!current.pending) return finish(state, current, effects);
      if (current.pending.kind === "modify") {
        const id = current.pending.id;
        const preview = modifyPreview(current, id);
        if ("error" in preview) {
          return finish(
            state,
            withNotice({ ...current, pending: null }, effects, "warn", preview.error),
            effects,
          );
        }
        const instances = current.instances.map((inst) =>
          inst.instanceId === id ? { ...inst, condition: preview.to } : inst,
        );
        return finish(
          state,
          withNotice(
            { ...current, instances, pending: null },
            effects,
            "ok",
            `Honed ${preview.name}. Condition ${preview.from} to ${preview.to}.`,
          ),
          effects,
        );
      }
      const plan = dismantlePlan(current, current.pending.ids);
      const remove = new Set(plan.ok.map((inst) => inst.instanceId));
      const fromHearth = plan.ok.filter((inst) => inst.container === "hearth").length;
      const next: InventoryState = {
        ...current,
        instances: current.instances.filter((inst) => !remove.has(inst.instanceId)),
        selected: current.selected.filter((id) => !remove.has(id)),
        pending: null,
      };
      const text = plan.ok.length
        ? `Dismantled ${plan.ok.length} fixture ${plan.ok.length === 1 ? "record" : "records"}. Left ${plan.skipped.length} untouched.`
        : "Nothing dismantled. Protected, favorite, worn, and authored items stay.";
      if (fromHearth) {
        effects.push({
          type: "homestead",
          text: `Removed ${fromHearth} fixture records from shared storage. Protected items were not touched.`,
        });
      }
      return finish(state, withNotice(next, effects, plan.ok.length ? "ok" : "warn", text), effects);
    }
    case "batch-stash": {
      let working = current;
      let moved = 0;
      let stayed = 0;
      for (const id of current.selected) {
        const inst = findInst(working, id);
        if (!inst || inst.container !== "pack") {
          stayed += 1;
          continue;
        }
        const result = moveTo(working, id, ["hearth"], true);
        if (!result.container) stayed += 1;
        else {
          working = result.state;
          moved += 1;
        }
      }
      if (moved) effects.push({ type: "homestead", text: `Deposited ${moved} items into shared hearth storage.` });
      const text = stayed
        ? `Filed ${moved} at the hearth. ${stayed} were not in the pack, or the hearth could not take them.`
        : `Filed ${moved} at the hearth.`;
      return finish(state, withNotice({ ...working, selected: [], batch: false }, effects, "ok", text), effects);
    }
    case "batch-favorite": {
      const selected = new Set(current.selected);
      const instances = current.instances.map((inst) =>
        selected.has(inst.instanceId) ? { ...inst, favorite: true } : inst,
      );
      return finish(
        state,
        withNotice(
          { ...current, instances, selected: [], batch: false },
          effects,
          "info",
          `Marked ${selected.size} favorites.`,
        ),
        effects,
      );
    }
    case "craft":
      return finish(state, craft(current, effects, action.recipeId), effects);
    case "toggle-hearth":
      return finish(
        state,
        withNotice(
          { ...current, atHearth: !current.atHearth },
          effects,
          "info",
          current.atHearth
            ? "You stepped away from the hearth. Pack work still stands."
            : "You are at the homestead hearth.",
        ),
        effects,
      );
    case "display-set": {
      const members = current.instances.filter((inst) => defOf(inst.defId).setId === action.setId);
      const waiting = members.filter((inst) => inst.container !== "display" && inst.container !== "equipped");
      const free = current.caps.display - countOf(current, "display");
      if (!waiting.length) {
        return finish(state, withNotice(current, effects, "info", "That set is already on the shelf, or being worn."), effects);
      }
      if (waiting.length > free) {
        return finish(
          state,
          withNotice(
            current,
            effects,
            "warn",
            `The shelf has ${Math.max(0, free)} open ${free === 1 ? "place" : "places"}. This set needs ${waiting.length}. Nothing was moved.`,
          ),
          effects,
        );
      }
      let working = current;
      const names: string[] = [];
      for (const inst of waiting) {
        const moved = moveTo(working, inst.instanceId, ["display"], false);
        if (!moved.container) {
          return finish(state, withNotice(current, effects, "warn", "The shelf could not take the set. Nothing was moved."), effects);
        }
        working = moved.state;
        names.push(defOf(inst.defId).name);
      }
      effects.push({ type: "homestead", text: `Placed the set on the display shelf: ${names.join(", ")}.` });
      return finish(state, withNotice(working, effects, "ok", "The set is on the shelf."), effects);
    }
    case "reincarnate": {
      let working: InventoryState = {
        ...current,
        pending: null,
        instances: current.instances.map((inst) =>
          inst.container === "equipped" ? { ...inst, condition: Math.max(8, inst.condition - 8) } : inst,
        ),
      };
      const packIds = working.instances.filter((inst) => inst.container === "pack").map((inst) => inst.instanceId);
      let moved = 0;
      let stayed = 0;
      const protectedNames: string[] = [];
      for (const id of packIds) {
        const inst = findInst(working, id);
        if (!inst) continue;
        const def = defOf(inst.defId);
        const result = moveTo(working, id, ["hearth"], true);
        if (!result.id || !result.container) {
          stayed += 1;
          continue;
        }
        working = {
          ...result.state,
          instances: result.state.instances.map((row) =>
            row.instanceId === result.id ? { ...row, keptThroughInterval: true } : row,
          ),
        };
        moved += 1;
        if (def.protection !== "none") protectedNames.push(def.name);
      }
      effects.push({
        type: "homestead",
        text: protectedNames.length
          ? `Interval retention kept ${protectedNames.join(", ")}.`
          : "Interval retention: the hearth kept the collection. No protected item was lost.",
      });
      const text = stayed
        ? `Fourteen years on. ${moved} filed at the hearth. ${stayed} stayed in the pack because the hearth was full. Worn gear weathered. Nothing protected was dropped.`
        : "Fourteen years on. The hearth kept what you set down. Worn gear weathered. Nothing protected was lost.";
      return finish(state, withNotice(working, effects, "discover", text), effects);
    }
    case "reset":
      return {
        state: withNotice(initialState(), effects, "info", "Demonstration reset. Authored things and the fixture index are back."),
        effects,
      };
    default:
      return finish(state, current, effects);
  }
}
