import { defOf } from "./logic.ts";
import { initialState } from "./logic.ts";
import type { ContainerId, ContentFilter, InventoryState, ItemInstance, SortKey, ViewId } from "./types.ts";

const KEY = "preincarnation.inventory.v1";

const CONTAINERS = new Set<ContainerId>(["pack", "hearth", "display", "equipped"]);
const VIEWS = new Set<ViewId>(["pack", "hearth", "display", "collection", "recipes", "checks"]);
const SORTS = new Set<SortKey>(["name", "kind", "qty", "recent", "heft", "favorite"]);
const CONTENT = new Set<ContentFilter>(["authored", "fixture", "all"]);

function validInstance(value: unknown): value is ItemInstance {
  if (!value || typeof value !== "object") return false;
  const row = value as ItemInstance;
  if (typeof row.instanceId !== "string" || typeof row.defId !== "string") return false;
  if (!CONTAINERS.has(row.container) || typeof row.qty !== "number" || row.qty < 1) return false;
  try {
    defOf(row.defId);
  } catch {
    return false;
  }
  return true;
}

export function loadSave(): InventoryState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<InventoryState> & { v?: number };
    if (data.v !== 1 || !Array.isArray(data.instances)) return null;
    const instances = data.instances.filter(validInstance);
    if (!instances.length) return null;
    const base = initialState();
    const next: InventoryState = {
      ...base,
      instances,
      ground: Array.isArray(data.ground) ? data.ground : base.ground,
      discovered: Array.isArray(data.discovered) ? data.discovered.filter((id) => typeof id === "string") : base.discovered,
      focusedId: typeof data.focusedId === "string" ? data.focusedId : base.focusedId,
      view: data.view && VIEWS.has(data.view) ? data.view : base.view,
      content: data.content && CONTENT.has(data.content) ? data.content : base.content,
      sort: data.sort && SORTS.has(data.sort) ? data.sort : base.sort,
      kind: data.kind ?? base.kind,
      favoritesOnly: Boolean(data.favoritesOnly),
      protectedOnly: Boolean(data.protectedOnly),
      atHearth: data.atHearth !== false,
      nextSerial: typeof data.nextSerial === "number" ? data.nextSerial : base.nextSerial,
      noticeSeq: typeof data.noticeSeq === "number" ? data.noticeSeq : base.noticeSeq,
      caps: data.caps ?? base.caps,
      pending: null,
      selected: [],
      batch: false,
      query: "",
    };
    if (next.focusedId && !next.instances.some((inst) => inst.instanceId === next.focusedId)) {
      next.focusedId = next.instances[0]?.instanceId ?? null;
    }
    return next;
  } catch {
    return null;
  }
}

export function saveSave(state: InventoryState) {
  if (typeof localStorage === "undefined") return;
  const payload = {
    v: 1,
    instances: state.instances,
    ground: state.ground,
    discovered: state.discovered,
    focusedId: state.focusedId,
    view: state.view,
    content: state.content,
    sort: state.sort,
    kind: state.kind,
    favoritesOnly: state.favoritesOnly,
    protectedOnly: state.protectedOnly,
    atHearth: state.atHearth,
    nextSerial: state.nextSerial,
    noticeSeq: state.noticeSeq,
    caps: state.caps,
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function clearSave() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}
