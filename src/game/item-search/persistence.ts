import type { SavedSearch, ViewState } from "./types.ts";
import { DEFAULT_FILTERS, DEFAULT_VIEW } from "./types.ts";

export const VIEW_STORAGE_KEY = "preincarnation.inventory-search.v1";

export type KeyValueStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
};

export type ViewStore = {
  load: () => ViewState;
  save: (state: ViewState) => void;
};

export const SEEDED_SEARCHES: SavedSearch[] = [
  {
    id: "light",
    name: "Things that give light",
    query: "things that give light",
    filters: { ...DEFAULT_FILTERS },
    sort: "relevance",
  },
  {
    id: "vein",
    name: "Reserved for the Vein",
    query: "",
    filters: { ...DEFAULT_FILTERS, reserved: "yes", project: "marble-vein" },
    sort: "name",
  },
  {
    id: "barred",
    name: "Barred storage",
    query: "",
    filters: { ...DEFAULT_FILTERS, access: "barred" },
    sort: "location",
  },
  {
    id: "recipes",
    name: "Recipes",
    query: "",
    filters: { ...DEFAULT_FILTERS, kind: "recipe" },
    sort: "name",
  },
  {
    id: "journal",
    name: "Journal",
    query: "",
    filters: { ...DEFAULT_FILTERS, kind: "journal" },
    sort: "name",
  },
  {
    id: "fixtures",
    name: "Performance fixtures",
    query: "",
    filters: { ...DEFAULT_FILTERS, fixtures: "only" },
    sort: "name",
  },
];

function sanitize(value: unknown): ViewState {
  const raw = value && typeof value === "object" ? (value as Partial<ViewState>) : {};
  const filters = raw.filters && typeof raw.filters === "object" ? raw.filters : DEFAULT_FILTERS;
  return {
    query: typeof raw.query === "string" ? raw.query : "",
    filters: { ...DEFAULT_FILTERS, ...filters },
    sort: raw.sort === "name" || raw.sort === "location" || raw.sort === "quantity" || raw.sort === "project" || raw.sort === "relevance"
      ? raw.sort
      : "relevance",
    selectedId: typeof raw.selectedId === "string" ? raw.selectedId : null,
    scrollTop: typeof raw.scrollTop === "number" && Number.isFinite(raw.scrollTop) ? raw.scrollTop : 0,
    saved: Array.isArray(raw.saved) ? raw.saved.filter(isSavedSearch) : [],
  };
}

function isSavedSearch(value: unknown): value is SavedSearch {
  if (!value || typeof value !== "object") return false;
  const saved = value as SavedSearch;
  return typeof saved.id === "string" && typeof saved.name === "string" && typeof saved.query === "string";
}

export function memoryStore(initial?: ViewState): ViewStore {
  let state: ViewState = initial ?? { ...DEFAULT_VIEW, saved: SEEDED_SEARCHES.map((search) => ({ ...search })) };
  return {
    load: () => structuredClone(state),
    save: (next) => {
      state = structuredClone(next);
    },
  };
}

export function browserStore(storage?: KeyValueStore): ViewStore {
  const backing =
    storage ??
    (typeof localStorage === "undefined" ? null : localStorage);
  return {
    load: () => {
      if (!backing) return { ...DEFAULT_VIEW, saved: SEEDED_SEARCHES.map((search) => ({ ...search })) };
      try {
        const text = backing.getItem(VIEW_STORAGE_KEY);
        if (!text) return { ...DEFAULT_VIEW, saved: SEEDED_SEARCHES.map((search) => ({ ...search })) };
        return sanitize(JSON.parse(text));
      } catch {
        return { ...DEFAULT_VIEW, saved: SEEDED_SEARCHES.map((search) => ({ ...search })) };
      }
    },
    save: (state) => {
      backing?.setItem(VIEW_STORAGE_KEY, JSON.stringify(state));
    },
  };
}
