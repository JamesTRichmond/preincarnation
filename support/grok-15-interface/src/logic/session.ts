import { findById, pageCount } from "../catalog.ts";
import { DAMAGE_MESSAGE, freshLife } from "../fixtures.ts";
import type {
  Dir,
  FocusItem,
  GameCatalog,
  GameplaySnapshot,
  InputDevice,
  Intent,
  JournalFilter,
  ModalState,
  PersistRequest,
  RetentionReport,
  SaveSlot,
  ScreenId,
  Settings,
  SlotIntent,
} from "../types.ts";
import { firstEnabled, moveFocus } from "./focus.ts";
import { clone, retentionReport } from "./retention.ts";

export interface LoadRequest {
  slotId: string;
  repair: boolean;
  nonce: number;
}

export interface CreateRequest {
  slotId: string;
  nonce: number;
}

export interface SessionState {
  stack: ScreenId[];
  focusId: string;
  focusMemory: Record<string, string>;
  scrolls: Record<string, number>;
  modal: ModalState;
  focusBeforeModal: string;
  slotIntent: SlotIntent;
  draftSlotId: string | null;
  characterMode: "create" | "review";
  journalFilter: JournalFilter;
  selectedEntryId: string | null;
  selectedPlaceId: string | null;
  selectedEndingId: string | null;
  quickIndex: number;
  gameplay: GameplaySnapshot | null;
  frozen: GameplaySnapshot | null;
  activeSlotId: string | null;
  slots: SaveSlot[];
  settings: Settings;
  catalog: GameCatalog;
  pending: LoadRequest | null;
  pendingCreate: CreateRequest | null;
  failedSlotId: string | null;
  failedKind: "load" | "create" | null;
  loadError: string | null;
  notice: string | null;
  simulateField: boolean;
  device: InputDevice;
  lastResume: RetentionReport | null;
  persist: PersistRequest | null;
  persistNonce: number;
  settingsNonce: number;
  nonce: number;
  source: "engine" | "dev-fixture";
  sourceLabel: string;
}

export type Action =
  | { type: "intent"; intent: Intent }
  | { type: "pointer"; id: string; kind: "focus" | "activate" }
  | { type: "finish-load"; snapshot: GameplaySnapshot }
  | { type: "fail-load"; message: string }
  | { type: "finish-create"; snapshot: GameplaySnapshot }
  | { type: "fail-create"; message: string }
  | { type: "tick"; seconds: number }
  | { type: "set-device"; device: InputDevice }
  | { type: "hydrate"; state: SessionState };

const PACES = ["slow", "steady", "fast"] as const;
const TOUCHES = ["auto", "always", "never"] as const;
const HINTS = ["auto", "keys", "buttons"] as const;

export function topScreen(state: SessionState): ScreenId {
  return state.stack[state.stack.length - 1] ?? "title";
}

export function createSession(input: {
  slots: SaveSlot[];
  settings: Settings;
  catalog: GameCatalog;
  simulateField: boolean;
  source: "engine" | "dev-fixture";
  sourceLabel: string;
}): SessionState {
  const state: SessionState = {
    stack: ["title"],
    focusId: "new-game",
    focusMemory: {},
    scrolls: {},
    modal: null,
    focusBeforeModal: "new-game",
    slotIntent: "new",
    draftSlotId: null,
    characterMode: "create",
    journalFilter: "all",
    selectedEntryId: null,
    selectedPlaceId: null,
    selectedEndingId: null,
    quickIndex: 0,
    gameplay: null,
    frozen: null,
    activeSlotId: null,
    slots: clone(input.slots),
    settings: clone(input.settings),
    catalog: input.catalog,
    pending: null,
    pendingCreate: null,
    failedSlotId: null,
    failedKind: null,
    loadError: null,
    notice: null,
    simulateField: input.simulateField,
    device: "keyboard",
    lastResume: null,
    persist: null,
    persistNonce: 0,
    settingsNonce: 0,
    nonce: 1,
    source: input.source,
    sourceLabel: input.sourceLabel,
  };
  return { ...state, focusId: firstEnabled(focusItems(state)) };
}

export function passage(state: SessionState, key: string): string {
  const character = state.catalog.character;
  if (key === "background") return character.background;
  if (key === "bond") return `${character.bondName}, ${character.bondTitle}. ${character.bond}`;
  if (key === "ideal") return character.ideal;
  if (key === "flaw") return character.flaw;
  if (key === "entry") {
    const def = state.selectedEntryId
      ? findById(state.catalog.evidence, state.selectedEntryId)
      : undefined;
    if (!def) return "This note is not in the register.";
    return def.body;
  }
  if (key === "place") {
    const def = state.selectedPlaceId ? findById(state.catalog.places, state.selectedPlaceId) : undefined;
    if (!def) return "This place is not in the register.";
    return def.memory;
  }
  if (key === "epitaph") {
    const ending = findById(state.catalog.endings, state.selectedEndingId ?? "");
    return ending?.epitaph ?? "Those pages stay shut.";
  }
  if (key === "credits") return creditsText(state.catalog);
  return "";
}

export function creditsText(catalog: GameCatalog): string {
  const toolLine = catalog.tools.map((tool) => tool.name).join(", ");
  return [
    `${catalog.title}. One soul, carried back into ${catalog.county} without a guide and without a tally.`,
    `${catalog.character.name}. ${catalog.character.epithet}.`,
    `${catalog.character.bondName}, ${catalog.character.bondTitle}, who waited on the near bank.`,
    `Tools that came back in the hands: ${toolLine}.`,
    "Hearts are the body. Bottles are glass. Keys answer locks they were cut for. None of these are spent as coin.",
    "The eras keep their own weather. First Frost, Rail Summer, Flood Year, the Quiet Present.",
    "Four ways a life can be set down: The Kept Name, The Open Gate, The Shared Hearth, The Unlit Road.",
    "Places appear in the county book only after you have stood there. Nothing is drawn ahead of your feet.",
    "The river is not owed the rest of a sentence. A door left better than it was found is enough.",
  ].join("\n\n");
}

function scrollMax(state: SessionState, key: string): number {
  return Math.max(0, pageCount(passage(state, key)) - 1);
}

function scrollItem(
  id: string,
  row: number,
  state: SessionState,
  key: string,
  col = 0,
): FocusItem {
  return {
    id,
    row,
    col,
    scrollable: scrollMax(state, key) > 0,
    scrollKey: key,
    scrollMax: scrollMax(state, key),
  };
}

export function focusItems(state: SessionState): FocusItem[] {
  if (state.modal) {
    return [
      { id: "modal-yes", row: 0, col: 0 },
      { id: "modal-no", row: 1, col: 0 },
    ];
  }
  const screen = topScreen(state);
  if (screen === "title") {
    const items: FocusItem[] = [
      { id: "new-game", row: 0, col: 0 },
      {
        id: "continue",
        row: 1,
        col: 0,
        disabled: !state.slots.some((slot) => slot.occupied),
      },
    ];
    let row = 2;
    if (state.slots.some((slot) => slot.snapshot?.completion)) {
      items.push({ id: "afterward", row, col: 0 });
      row += 1;
    }
    items.push({ id: "credits", row, col: 0 });
    items.push({ id: "settings", row: row + 1, col: 0 });
    return items;
  }
  if (screen === "slots") {
    return [
      ...state.slots.map((slot, index) => ({
        id: slot.id,
        row: index,
        col: 0,
        disabled: state.slotIntent === "continue" ? !slot.occupied : false,
      })),
      { id: "back", row: state.slots.length, col: 0 },
    ];
  }
  if (screen === "loading") return [{ id: "cancel-load", row: 0, col: 0 }];
  if (screen === "error") {
    return [
      { id: "retry", row: 0, col: 0 },
      { id: "back", row: 1, col: 0 },
    ];
  }
  if (screen === "character") {
    const items: FocusItem[] = [
      scrollItem("background", 0, state, "background"),
      scrollItem("bond", 1, state, "bond"),
      scrollItem("ideal", 2, state, "ideal"),
      scrollItem("flaw", 3, state, "flaw"),
    ];
    if (state.characterMode === "create") items.push({ id: "begin", row: 4, col: 0 });
    items.push({ id: "back", row: state.characterMode === "create" ? 5 : 4, col: 0 });
    return items;
  }
  if (screen === "pause") {
    const ids = [
      "resume",
      "tools",
      "quick",
      "bottles",
      "kept",
      "evidence",
      "county",
      "life",
      "returns",
      "settings",
      "quit",
    ];
    return ids.map((id, row) => ({ id, row, col: 0 }));
  }
  if (screen === "settings") {
    return [
      { id: "music", row: 0, col: 0, kind: "slider" },
      { id: "sfx", row: 1, col: 0, kind: "slider" },
      { id: "shake", row: 2, col: 0, kind: "toggle" },
      { id: "pace", row: 3, col: 0, kind: "choice" },
      { id: "motion", row: 4, col: 0, kind: "toggle" },
      { id: "touch", row: 5, col: 0, kind: "choice" },
      { id: "hints", row: 6, col: 0, kind: "choice" },
      { id: "back", row: 7, col: 0 },
    ];
  }
  if (screen === "inventory") {
    const ids = inventoryToolIds(state);
    const items: FocusItem[] = ids.map((id, index) => ({
      id,
      row: Math.floor(index / 4),
      col: index % 4,
      disabled: toolDisabled(state, id),
    }));
    items.push({ id: "back", row: Math.floor(ids.length / 4) + 1, col: 0 });
    return items;
  }
  if (screen === "quick") {
    const items: FocusItem[] = [0, 1, 2, 3].map((index) => ({
      id: `qslot-${index}`,
      row: 0,
      col: index,
    }));
    const owned = state.gameplay?.ownedToolIds ?? [];
    owned.forEach((id, index) => {
      items.push({ id: `qtool-${id}`, row: 1 + Math.floor(index / 4), col: index % 4 });
    });
    items.push({ id: "back", row: 8, col: 0 });
    return items;
  }
  if (screen === "bottles") {
    const bottles = state.gameplay?.bottles ?? [];
    return [
      ...bottles.map((bottle, index) => ({ id: `bottle-${bottle.id}`, row: index, col: 0 })),
      { id: "back", row: bottles.length, col: 0 },
    ];
  }
  if (screen === "upgrades") {
    return [
      ...state.catalog.upgrades.map((upgrade, index) => ({ id: `upgrade-${upgrade.id}`, row: index, col: 0 })),
      { id: "back", row: state.catalog.upgrades.length, col: 0 },
    ];
  }
  if (screen === "journal") {
    const entries = visibleEvidence(state);
    return [
      { id: "filter-all", row: 0, col: 0 },
      { id: "filter-inked", row: 0, col: 1 },
      { id: "filter-loose", row: 0, col: 2 },
      ...entries.map((entry, index) => ({ id: `entry-${entry.id}`, row: 1 + index, col: 0 })),
      { id: "back", row: 1 + entries.length, col: 0 },
    ];
  }
  if (screen === "entry") return [scrollItem("entry-body", 0, state, "entry"), { id: "back", row: 1, col: 0 }];
  if (screen === "map") {
    const places = discoveredPlaces(state);
    return [
      ...places.map((place, index) => ({ id: `place-${place.id}`, row: index, col: 0 })),
      { id: "back", row: places.length, col: 0 },
    ];
  }
  if (screen === "place") return [scrollItem("place-body", 0, state, "place"), { id: "back", row: 1, col: 0 }];
  if (screen === "history") {
    const chapters = state.gameplay?.history ?? [];
    return [
      ...chapters.map((chapter, index) => ({ id: `chapter-${chapter.returnIndex}`, row: index, col: 0 })),
      { id: "back", row: chapters.length, col: 0 },
    ];
  }
  if (screen === "credits") return [scrollItem("credits-body", 0, state, "credits"), { id: "back", row: 1, col: 0 }];
  if (screen === "ending") {
    return [
      ...state.catalog.endings.map((ending, index) => ({ id: `ending-${ending.id}`, row: index, col: 0 })),
      { id: "to-credits", row: state.catalog.endings.length, col: 0 },
      { id: "to-county", row: state.catalog.endings.length + 1, col: 0 },
      { id: "to-field", row: state.catalog.endings.length + 2, col: 0, disabled: !state.gameplay },
      { id: "to-title", row: state.catalog.endings.length + 3, col: 0 },
    ];
  }
  if (screen === "epitaph") return [scrollItem("epitaph-body", 0, state, "epitaph"), { id: "back", row: 1, col: 0 }];
  return [];
}

function inventoryToolIds(state: SessionState): string[] {
  const known = state.catalog.tools.map((tool) => `tool-${tool.id}`);
  const extra = (state.gameplay?.ownedToolIds ?? [])
    .filter((id) => !state.catalog.tools.some((tool) => tool.id === id))
    .map((id) => `tool-${id}`);
  return [...known, ...extra];
}

function toolDisabled(state: SessionState, itemId: string): boolean {
  const toolId = itemId.slice("tool-".length);
  return !state.gameplay?.ownedToolIds.includes(toolId);
}

export function visibleEvidence(state: SessionState): Array<{ id: string; inked: boolean }> {
  const rows = state.gameplay?.evidence ?? [];
  if (state.journalFilter === "inked") return rows.filter((row) => row.inked);
  if (state.journalFilter === "loose") return rows.filter((row) => !row.inked);
  return rows;
}

export function discoveredPlaces(state: SessionState): Array<{ id: string }> {
  const ids = state.gameplay?.discoveredPlaceIds ?? [];
  const known = state.catalog.places.filter((place) => ids.includes(place.id));
  const extra = ids.filter((id) => !state.catalog.places.some((place) => place.id === id)).map((id) => ({ id }));
  return [...known, ...extra];
}

export function reduce(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "set-device":
      return state.device === action.device ? state : { ...state, device: action.device };
    case "tick":
      return applyTick(state, action.seconds);
    case "finish-load":
      return finishLoad(state, action.snapshot);
    case "fail-load":
      return failLoad(state, action.message);
    case "finish-create":
      return finishCreate(state, action.snapshot);
    case "fail-create":
      return failCreate(state, action.message);
    case "pointer":
      return applyPointer(state, action.id, action.kind);
    case "intent":
      return applyIntent(state, action.intent);
    default:
      return state;
  }
}

function applyTick(state: SessionState, seconds: number): SessionState {
  if (!state.gameplay || topScreen(state) !== "field" || state.modal || state.frozen) return state;
  if (!Number.isFinite(seconds) || seconds <= 0) return state;
  const capped = Math.min(seconds, 0.25);
  return {
    ...state,
    gameplay: { ...state.gameplay, playSeconds: state.gameplay.playSeconds + capped },
  };
}

function applyPointer(state: SessionState, id: string, kind: "focus" | "activate"): SessionState {
  if (id === "focus-up" || id === "focus-down" || id === "focus-left" || id === "focus-right") {
    const dir = id.slice("focus-".length) as Dir;
    return applyIntent(state, { type: "move", dir });
  }
  if (id === "touch-back") return applyIntent(state, { type: "cancel" });
  if (id === "touch-confirm") return applyIntent(state, { type: "confirm" });
  if (id === "hud-pause") return applyIntent(state, { type: "pause" });
  if (topScreen(state) === "field" && !state.modal) {
    if (id === "hud-tools") return applyIntent(state, { type: "shortcut", id: "inventory" });
    if (id === "hud-map") return applyIntent(state, { type: "shortcut", id: "map" });
    if (id === "hud-journal") return applyIntent(state, { type: "shortcut", id: "journal" });
    if (id.startsWith("hud-quick-")) {
      const index = Number(id.slice("hud-quick-".length));
      return applyIntent(state, { type: "quick-slot", index });
    }
    if (id.startsWith("nudge-")) {
      const dir = id.slice("nudge-".length);
      if (dir === "up" || dir === "down" || dir === "left" || dir === "right") {
        return applyIntent(state, { type: "move", dir });
      }
    }
  }
  const items = focusItems(state);
  const item = items.find((entry) => entry.id === id);
  if (!item || item.disabled) return state;
  const focused = rememberScroll({ ...state, focusId: id });
  if (kind === "focus") return focused;
  return activate(focused, id);
}

function applyIntent(state: SessionState, intent: Intent): SessionState {
  if (intent.type === "pause") {
    if (state.modal) return closeModal(state);
    if (topScreen(state) === "field") return push(freeze(state), "pause");
    if (state.stack.includes("field")) return resume(state);
    return pop(state);
  }
  if (intent.type === "cancel") {
    if (topScreen(state) === "loading") return cancelPending(state);
    return pop(state);
  }
  if (intent.type === "shortcut") {
    if (topScreen(state) !== "field" || state.modal) return state;
    const screen = intent.id === "inventory" ? "inventory" : intent.id === "map" ? "map" : "journal";
    return push(freeze(state), screen);
  }
  if (intent.type === "quick-cycle") return cycleQuick(state, intent.delta);
  if (intent.type === "quick-slot") return chooseQuick(state, intent.index);
  if (intent.type === "confirm") return activate(state, state.focusId);
  if (intent.type === "move") return move(state, intent.dir);
  return state;
}

function move(state: SessionState, dir: Dir): SessionState {
  if (topScreen(state) === "field" && !state.modal) return nudgeField(state, dir);
  const items = focusItems(state);
  const current = items.find((item) => item.id === state.focusId);
  if (current && (dir === "left" || dir === "right")) {
    if (current.kind === "slider") return adjustSlider(state, current.id, dir);
    if (current.kind === "toggle") return adjustToggle(state, current.id);
    if (current.kind === "choice") return adjustChoice(state, current.id, dir);
  }
  const scrollKey = current?.scrollKey;
  const scroll = scrollKey ? (state.scrolls[scrollKey] ?? 0) : 0;
  const moved = moveFocus(items, state.focusId, dir, scroll);
  if (current?.scrollKey && moved.id === current.id) {
    return {
      ...state,
      scrolls: { ...state.scrolls, [current.scrollKey]: moved.scroll },
      notice: null,
    };
  }
  const nextItem = items.find((item) => item.id === moved.id);
  const scrolls = { ...state.scrolls };
  if (nextItem?.scrollKey) scrolls[nextItem.scrollKey] = moved.scroll;
  return { ...state, focusId: moved.id, scrolls, notice: null };
}

function nudgeField(state: SessionState, dir: Dir): SessionState {
  if (!state.simulateField || !state.gameplay) return state;
  const delta = dir === "left" ? [-1, 0] : dir === "right" ? [1, 0] : dir === "up" ? [0, -1] : [0, 1];
  const facing = dir === "left" ? "w" : dir === "right" ? "e" : dir === "up" ? "n" : "s";
  return {
    ...state,
    gameplay: {
      ...state.gameplay,
      facing,
      position: {
        x: clamp((state.gameplay.position.x + delta[0]) as number, 0, 64),
        y: clamp((state.gameplay.position.y + delta[1]) as number, 0, 64),
      },
    },
  };
}

function adjustSlider(state: SessionState, id: string, dir: Dir): SessionState {
  const key = id === "music" ? "music" : "sfx";
  const delta = dir === "left" ? -1 : 1;
  const settings = {
    ...state.settings,
    [key]: clamp(state.settings[key] + delta, 0, 10),
  };
  return commitSettings(state, settings);
}

function adjustToggle(state: SessionState, id: string): SessionState {
  if (id === "shake") return commitSettings(state, { ...state.settings, screenShake: !state.settings.screenShake });
  if (id === "motion") return commitSettings(state, { ...state.settings, reduceMotion: !state.settings.reduceMotion });
  return state;
}

function adjustChoice(state: SessionState, id: string, dir: Dir): SessionState {
  const step = dir === "left" ? -1 : 1;
  if (id === "pace") {
    return commitSettings(state, { ...state.settings, textPace: cycle(PACES, state.settings.textPace, step) });
  }
  if (id === "touch") {
    return commitSettings(state, { ...state.settings, touch: cycle(TOUCHES, state.settings.touch, step) });
  }
  if (id === "hints") {
    return commitSettings(state, { ...state.settings, hints: cycle(HINTS, state.settings.hints, step) });
  }
  return state;
}

function commitSettings(state: SessionState, settings: Settings): SessionState {
  return { ...state, settings, settingsNonce: state.settingsNonce + 1, notice: null };
}

function cycle<T extends string>(values: readonly T[], current: T, step: number): T {
  const index = values.indexOf(current);
  const next = (index + step + values.length) % values.length;
  return values[next] ?? current;
}

function activate(state: SessionState, id: string): SessionState {
  const item = focusItems(state).find((entry) => entry.id === id);
  if (!item || item.disabled) return state;
  if (state.modal) {
    if (id === "modal-no") return closeModal(state);
    if (id === "modal-yes") return confirmModal(state);
  }
  if (id === "back" || id === "cancel-load") {
    if (topScreen(state) === "loading") return cancelPending(state);
    return pop(state);
  }
  const screen = topScreen(state);
  if (screen === "title") {
    if (id === "new-game") return push({ ...state, slotIntent: "new" }, "slots");
    if (id === "continue") return push({ ...state, slotIntent: "continue" }, "slots");
    if (id === "credits") return push(state, "credits");
    if (id === "settings") return push(state, "settings");
    if (id === "afterward") return openAfterward(state);
  }
  if (screen === "slots") return activateSlot(state, id);
  if (screen === "error" && id === "retry") return retryLoad(state);
  if (screen === "character" && id === "begin") return beginCreate(state);
  if (screen === "pause") return activatePause(state, id);
  if (screen === "inventory" && id.startsWith("tool-")) return equipTool(state, id.slice("tool-".length));
  if (screen === "quick" && id.startsWith("qslot-")) {
    return { ...state, quickIndex: Number(id.slice("qslot-".length)), notice: null };
  }
  if (screen === "quick" && id.startsWith("qtool-")) return assignQuick(state, id.slice("qtool-".length));
  if (screen === "bottles" && id.startsWith("bottle-")) {
    return openModal(state, { kind: "use-bottle", bottleId: id.slice("bottle-".length) });
  }
  if (screen === "journal" && id.startsWith("filter-")) {
    const journalFilter = id.slice("filter-".length) as JournalFilter;
    return { ...state, journalFilter, notice: null };
  }
  if (screen === "journal" && id.startsWith("entry-")) {
    return push({ ...state, selectedEntryId: id.slice("entry-".length) }, "entry");
  }
  if (screen === "map" && id.startsWith("place-")) {
    return push({ ...state, selectedPlaceId: id.slice("place-".length) }, "place");
  }
  if (screen === "ending" && id.startsWith("ending-")) return openEnding(state, id.slice("ending-".length));
  if (screen === "ending" && id === "to-credits") return push(state, "credits");
  if (screen === "ending" && id === "to-county") return push(state, "map");
  if (screen === "ending" && id === "to-field") return { ...resume(state), notice: null };
  if (screen === "ending" && id === "to-title") return quitToTitle(state);
  return state;
}

function activateSlot(state: SessionState, id: string): SessionState {
  const slot = state.slots.find((entry) => entry.id === id);
  if (!slot) return state;
  if (state.slotIntent === "continue") {
    if (!slot.occupied) return state;
    return startLoad(state, slot.id, false);
  }
  if (slot.occupied || slot.damaged) return openModal(state, { kind: "overwrite", slotId: slot.id });
  return push({ ...state, draftSlotId: slot.id, characterMode: "create" }, "character");
}

function activatePause(state: SessionState, id: string): SessionState {
  if (id === "resume") return resume(state);
  if (id === "tools") return push(state, "inventory");
  if (id === "quick") return push(state, "quick");
  if (id === "bottles") return push(state, "bottles");
  if (id === "kept") return push(state, "upgrades");
  if (id === "evidence") return push(state, "journal");
  if (id === "county") return push(state, "map");
  if (id === "life") return push({ ...state, characterMode: "review" }, "character");
  if (id === "returns") return push(state, "history");
  if (id === "settings") return push(state, "settings");
  if (id === "quit") return openModal(state, { kind: "quit" });
  return state;
}

function confirmModal(state: SessionState): SessionState {
  const modal = state.modal;
  if (!modal) return state;
  if (modal.kind === "overwrite") {
    return push(
      { ...closeModal(state), draftSlotId: modal.slotId, characterMode: "create" },
      "character",
    );
  }
  if (modal.kind === "quit") return quitToTitle(state);
  if (modal.kind === "use-bottle") return applyBottle(state, modal.bottleId);
  return state;
}

function applyBottle(state: SessionState, bottleId: string): SessionState {
  if (!state.gameplay) return closeModal(state);
  const game = clone(state.gameplay);
  const bottle = game.bottles.find((entry) => entry.id === bottleId);
  if (!bottle) return { ...closeModal(state), notice: "That bottle is not in the brace." };
  const def = findById(state.catalog.bottles, bottle.kindId);
  if (!def) {
    return { ...closeModal(state), notice: `This bottle is not in the register (${bottle.kindId}).` };
  }
  if (def.id === "empty" || bottle.sips <= 0) {
    return { ...closeModal(state), notice: "The bottle is empty." };
  }
  let notice = "Used.";
  if (def.id === "ink") {
    const loose = game.evidence.find((entry) => !entry.inked);
    if (!loose) return { ...closeModal(state), notice: "There is no loose note to set in ink." };
    loose.inked = true;
    notice = "The loose note is in the journal now.";
  } else if (def.id === "oil") {
    game.flags = { ...game.flags, lanternFed: true };
    notice = "The wick takes the oil.";
  } else if (def.id === "smoke") {
    game.flags = { ...game.flags, smokeCloud: true };
    notice = "Smoke pools at your feet.";
  } else if (def.heal > 0) {
    if (game.hearts.current >= game.hearts.max) {
      return { ...closeModal(state), notice: "The heart is already full. The sip stays in the bottle." };
    }
    game.hearts.current = Math.min(game.hearts.max, game.hearts.current + def.heal);
    notice = "A heart steadies.";
  }
  bottle.sips -= 1;
  if (bottle.sips <= 0) game.bottles = game.bottles.filter((entry) => entry.id !== bottle.id);
  const closed = closeModal(state);
  return { ...persistGame(closed, game), notice };
}

function equipTool(state: SessionState, toolId: string): SessionState {
  if (!state.gameplay?.ownedToolIds.includes(toolId)) return state;
  if (!findById(state.catalog.tools, toolId) && !state.gameplay.ownedToolIds.includes(toolId)) {
    return { ...state, notice: `This tool is not in the register (${toolId}).` };
  }
  const game = { ...state.gameplay, activeToolId: toolId };
  const name = findById(state.catalog.tools, toolId)?.name ?? toolId;
  return { ...persistGame(state, game), notice: `${name} is in hand.` };
}

function assignQuick(state: SessionState, toolId: string): SessionState {
  if (!state.gameplay?.ownedToolIds.includes(toolId)) return state;
  const quickSlots = state.gameplay.quickSlots.slice(0, 4);
  while (quickSlots.length < 4) quickSlots.push(null);
  quickSlots[state.quickIndex] = toolId;
  const game = { ...state.gameplay, quickSlots, activeToolId: toolId };
  const name = findById(state.catalog.tools, toolId)?.name ?? toolId;
  return { ...persistGame(state, game), notice: `${name} sits in belt ${state.quickIndex + 1}.` };
}

function cycleQuick(state: SessionState, delta: number): SessionState {
  if (topScreen(state) === "quick") {
    return { ...state, quickIndex: (state.quickIndex + delta + 4) % 4, notice: null };
  }
  if (topScreen(state) !== "field" || !state.gameplay) return state;
  const filled = state.gameplay.quickSlots
    .map((id, index) => ({ id, index }))
    .filter((slot): slot is { id: string; index: number } => Boolean(slot.id));
  if (!filled.length) return state;
  const current = filled.findIndex((slot) => slot.id === state.gameplay?.activeToolId);
  const next = filled[(current + delta + filled.length) % filled.length];
  if (!next) return state;
  return persistGame(state, { ...state.gameplay, activeToolId: next.id });
}

function chooseQuick(state: SessionState, index: number): SessionState {
  if (topScreen(state) === "quick") return { ...state, quickIndex: (index + 4) % 4, notice: null };
  if (topScreen(state) !== "field" || !state.gameplay) return state;
  const toolId = state.gameplay.quickSlots[index];
  if (!toolId) return { ...state, notice: "That belt loop is empty." };
  return persistGame(state, { ...state.gameplay, activeToolId: toolId });
}

function openEnding(state: SessionState, endingId: string): SessionState {
  const reached = state.gameplay?.completion?.endingId;
  if (reached !== endingId) {
    return { ...state, notice: "Those pages stay shut. This was not the life you set down." };
  }
  return push({ ...state, selectedEndingId: endingId, notice: null }, "epitaph");
}

function openAfterward(state: SessionState): SessionState {
  const slot = state.slots.find((entry) => entry.snapshot?.completion);
  if (!slot?.snapshot?.completion) return state;
  const game = clone(slot.snapshot);
  return push(
    {
      ...state,
      gameplay: game,
      activeSlotId: slot.id,
      frozen: null,
      selectedEndingId: game.completion?.endingId ?? null,
    },
    "ending",
  );
}

function beginCreate(state: SessionState): SessionState {
  if (!state.draftSlotId) return { ...state, notice: "No page is waiting for a name." };
  return {
    ...push(state, "loading"),
    pendingCreate: { slotId: state.draftSlotId, nonce: state.nonce + 1 },
    pending: null,
    nonce: state.nonce + 1,
    failedSlotId: state.draftSlotId,
    failedKind: "create",
    loadError: null,
  };
}

function startLoad(state: SessionState, slotId: string, repair: boolean): SessionState {
  return {
    ...push(state, "loading"),
    pending: { slotId, repair, nonce: state.nonce + 1 },
    pendingCreate: null,
    nonce: state.nonce + 1,
    failedSlotId: slotId,
    failedKind: "load",
    loadError: null,
  };
}

function retryLoad(state: SessionState): SessionState {
  if (!state.failedSlotId) return state;
  const stack = [...state.stack.slice(0, -1), "loading" as const];
  if (state.failedKind === "create") {
    return {
      ...state,
      stack,
      pending: null,
      pendingCreate: { slotId: state.failedSlotId, nonce: state.nonce + 1 },
      nonce: state.nonce + 1,
      loadError: null,
      focusId: "cancel-load",
      notice: null,
    };
  }
  return {
    ...state,
    stack,
    pendingCreate: null,
    pending: { slotId: state.failedSlotId, repair: true, nonce: state.nonce + 1 },
    nonce: state.nonce + 1,
    loadError: null,
    focusId: "cancel-load",
    notice: null,
  };
}

function finishLoad(state: SessionState, snapshot: GameplaySnapshot): SessionState {
  if (!state.pending) return state;
  return landLife(state, state.pending.slotId, snapshot);
}

function finishCreate(state: SessionState, snapshot: GameplaySnapshot): SessionState {
  if (!state.pendingCreate) return state;
  return landLife(state, state.pendingCreate.slotId, snapshot);
}

function landLife(state: SessionState, slotId: string, snapshot: GameplaySnapshot): SessionState {
  const game = clone(snapshot);
  const slots = state.slots.map((slot) =>
    slot.id === slotId ? { id: slotId, occupied: true, damaged: false, snapshot: clone(game) } : slot,
  );
  const dest: ScreenId = game.completion ? "ending" : "field";
  const base: SessionState = {
    ...state,
    slots,
    gameplay: game,
    activeSlotId: slotId,
    pending: null,
    pendingCreate: null,
    frozen: null,
    stack: [dest],
    modal: null,
    loadError: null,
    notice: null,
    selectedEndingId: game.completion?.endingId ?? null,
    persist: { slotId, snapshot: clone(game) },
    persistNonce: state.persistNonce + 1,
    focusId: "",
  };
  return { ...base, focusId: dest === "field" ? "" : firstEnabled(focusItems(base)) };
}

function failLoad(state: SessionState, message: string): SessionState {
  if (!state.pending) return state;
  const stack = [...state.stack.slice(0, -1), "error" as const];
  return {
    ...state,
    stack,
    pending: null,
    loadError: message || DAMAGE_MESSAGE,
    failedKind: "load",
    focusId: "retry",
    notice: null,
  };
}

function failCreate(state: SessionState, message: string): SessionState {
  if (!state.pendingCreate) return state;
  const stack = [...state.stack.slice(0, -1), "error" as const];
  return {
    ...state,
    stack,
    pendingCreate: null,
    failedSlotId: state.pendingCreate.slotId,
    failedKind: "create",
    loadError: message || "The life could not be started.",
    focusId: "retry",
    notice: null,
  };
}

function cancelPending(state: SessionState): SessionState {
  return pop({ ...state, pending: null, pendingCreate: null });
}

function quitToTitle(state: SessionState): SessionState {
  const saved =
    state.gameplay && state.activeSlotId ? persistGame({ ...state, modal: null }, state.gameplay) : state;
  const base: SessionState = {
    ...saved,
    stack: ["title"],
    modal: null,
    frozen: null,
    gameplay: null,
    pending: null,
    pendingCreate: null,
    notice: null,
    focusId: "new-game",
  };
  return { ...base, focusId: firstEnabled(focusItems(base)) };
}

function resume(state: SessionState): SessionState {
  if (!state.gameplay) return pop(state);
  const overField = state.stack.includes("field") || topScreen(state) === "ending" || topScreen(state) === "field";
  if (!overField) return pop(state);
  const report =
    state.frozen && state.gameplay ? retentionReport(state.frozen, state.gameplay) : state.lastResume;
  return {
    ...state,
    stack: ["field"],
    modal: null,
    frozen: null,
    focusId: "",
    lastResume: report,
    notice: null,
  };
}

function persistGame(state: SessionState, game: GameplaySnapshot): SessionState {
  const snapshot = clone(game);
  const slots = state.activeSlotId
    ? state.slots.map((slot) =>
        slot.id === state.activeSlotId
          ? { ...slot, occupied: true, damaged: false, snapshot: clone(snapshot) }
          : slot,
      )
    : state.slots;
  return {
    ...state,
    gameplay: snapshot,
    slots,
    persist: state.activeSlotId ? { slotId: state.activeSlotId, snapshot: clone(snapshot) } : null,
    persistNonce: state.persistNonce + 1,
  };
}

function push(state: SessionState, screen: ScreenId): SessionState {
  const focusMemory = { ...state.focusMemory, [topScreen(state)]: state.focusId };
  const drafted: SessionState = { ...state, stack: [...state.stack, screen], focusMemory, notice: null };
  const items = focusItems(drafted);
  const remembered = focusMemory[screen];
  const focusId =
    remembered && items.some((item) => item.id === remembered && !item.disabled)
      ? remembered
      : firstEnabled(items);
  return { ...drafted, focusId };
}

function pop(state: SessionState): SessionState {
  if (state.modal) return closeModal(state);
  if (state.stack.length <= 1) return state;
  const leaving = topScreen(state);
  const stack = state.stack.slice(0, -1);
  const landing = stack[stack.length - 1] ?? "title";
  if (landing === "field") {
    return resume({ ...state, stack: [...stack, "field"] });
  }
  const drafted: SessionState = {
    ...state,
    stack,
    modal: null,
    notice: null,
    pending: leaving === "loading" ? null : state.pending,
    pendingCreate: leaving === "loading" ? null : state.pendingCreate,
  };
  const items = focusItems(drafted);
  const remembered = state.focusMemory[landing];
  const focusId =
    remembered && items.some((item) => item.id === remembered && !item.disabled)
      ? remembered
      : firstEnabled(items);
  return { ...drafted, focusId };
}

function freeze(state: SessionState): SessionState {
  if (!state.gameplay || state.frozen || topScreen(state) !== "field") return state;
  return { ...state, frozen: clone(state.gameplay) };
}

function openModal(state: SessionState, modal: ModalState): SessionState {
  return {
    ...state,
    modal,
    focusBeforeModal: state.focusId,
    focusId: "modal-yes",
    notice: null,
  };
}

function closeModal(state: SessionState): SessionState {
  const items = focusItems({ ...state, modal: null });
  const focusId = items.some((item) => item.id === state.focusBeforeModal && !item.disabled)
    ? state.focusBeforeModal
    : firstEnabled(items);
  return { ...state, modal: null, focusId, notice: null };
}

function rememberScroll(state: SessionState): SessionState {
  return state;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Sync stand-in for tests and the journey walker. The live UI uses bindings. */
export function settle(state: SessionState): SessionState {
  if (state.pending) {
    const slot = state.slots.find((entry) => entry.id === state.pending?.slotId);
    if (!slot) return reduce(state, { type: "fail-load", message: "That page is not in the register." });
    if (slot.damaged && !state.pending.repair) {
      return reduce(state, { type: "fail-load", message: DAMAGE_MESSAGE });
    }
    if (!slot.snapshot) return reduce(state, { type: "fail-load", message: "That page is blank." });
    return reduce(state, { type: "finish-load", snapshot: clone(slot.snapshot) });
  }
  if (state.pendingCreate) {
    if (state.source !== "dev-fixture") {
      return reduce(state, { type: "fail-create", message: "No life could be started." });
    }
    return reduce(state, { type: "finish-create", snapshot: freshLife() });
  }
  return state;
}

export function play(state: SessionState, actions: Action[]): SessionState {
  return actions.reduce((current, action) => settle(reduce(current, action)), state);
}

export { DAMAGE_MESSAGE };
