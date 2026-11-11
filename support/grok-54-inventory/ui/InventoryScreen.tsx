import {
  Apple,
  Backpack,
  BookOpen,
  Boxes,
  ChevronDown,
  ClipboardCheck,
  Eye,
  Frame,
  Gamepad2,
  Gem,
  Hammer,
  House,
  Keyboard,
  KeyRound,
  Library,
  Package,
  RotateCcw,
  Scale,
  ScrollText,
  Search,
  Shield,
  Shirt,
  Star,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode, type RefObject } from "react";
import "./desk.css";
import { applyEffects, createMemoryPorts, type MemoryPorts } from "../adapters.ts";
import { KEY_BINDINGS, PAD_BINDINGS, isTypingTarget, keyShortcut, padButtonShortcut, viewStep, type Shortcut } from "../bindings.ts";
import { LONG_FIXTURE_ID } from "../fixtures.ts";
import {
  buildSearchIndex,
  carryReport,
  census,
  collections,
  comparison,
  defOf,
  dismantlePlan,
  initialState,
  modifyPreview,
  project,
  recipeViews,
  recipesTouching,
  reduce,
  searchPrepared,
  showsItemList,
  visibleIds,
} from "../logic.ts";
import { runChecks, type CheckResult } from "../measure.ts";
import { clearSave, loadSave, saveSave } from "../persist.ts";
import {
  KIND_LABEL,
  SLOT_LABEL,
  VIEW_LABEL,
  VIEWS,
  type Action,
  type EquipSlot,
  type InventoryNotice,
  type ItemKind,
  type PlayerItem,
  type SortKey,
} from "../types.ts";

const ROW = 76;
const KINDS: Array<ItemKind | "all"> = ["all", "equipment", "food", "crafting", "collectible", "narrative", "quest", "physical"];

const KIND_ICON: Record<ItemKind, typeof Package> = {
  physical: Package,
  equipment: Shirt,
  crafting: Hammer,
  food: Apple,
  collectible: Gem,
  narrative: ScrollText,
  quest: KeyRound,
};

const ERA_SHORT = {
  before: "First winter",
  interval: "The years",
  after: "Fourteen on",
} as const;

type ScreenProps = { ports?: MemoryPorts };

function whereOf(container: string): string {
  if (container === "equipped") return "Worn";
  if (container === "hearth") return "Hearth";
  if (container === "display") return "Shelf";
  return "Pack";
}

function placePhrase(container: string): string {
  if (container === "equipped") return "worn";
  if (container === "hearth") return "at the hearth";
  if (container === "display") return "on the shelf";
  return "in the pack";
}

export function InventoryScreen({ ports: given }: ScreenProps = {}) {
  const ports = useMemo(() => given ?? createMemoryPorts(), [given]);
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<InventoryNotice[]>([]);
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [help, setHelp] = useState(false);
  const [padOn, setPadOn] = useState(false);
  const [logTick, setLogTick] = useState(0);
  const [readOpen, setReadOpen] = useState(false);
  const stateRef = useRef(state);
  const searchRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const followFocus = useRef(false);
  const helpRef = useRef(false);
  stateRef.current = state;
  helpRef.current = help;

  const dispatch = useCallback(
    (action: Action) => {
      const result = reduce(stateRef.current, action);
      stateRef.current = result.state;
      applyEffects(ports, result.effects);
      const notices = result.effects.flatMap((effect) => (effect.type === "notice" ? [effect.notice] : []));
      if (notices.length) setToasts((current) => [...notices, ...current].slice(0, 3));
      if (result.effects.some((effect) => effect.type === "homestead")) setLogTick((n) => n + 1);
      setState(result.state);
    },
    [ports],
  );
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  const applyShortcut = useCallback((shortcut: Shortcut) => {
    const current = stateRef.current;
    const id = current.focusedId;
    const inst = id ? current.instances.find((row) => row.instanceId === id) : null;
    if (shortcut.type === "move") followFocus.current = true;
    switch (shortcut.type) {
      case "search":
        searchRef.current?.focus();
        searchRef.current?.select();
        break;
      case "clear-query":
        dispatchRef.current({ type: "search", query: "" });
        searchRef.current?.blur();
        break;
      case "move":
        dispatchRef.current({ type: "move", dir: shortcut.dir });
        break;
      case "inspect":
        if (id) dispatchRef.current({ type: "inspect", id });
        break;
      case "equip":
        if (!id) break;
        dispatchRef.current(inst?.container === "equipped" ? { type: "unequip", id } : { type: "equip", id });
        break;
      case "use":
        if (id) dispatchRef.current({ type: "use", id });
        break;
      case "modify":
        if (id) dispatchRef.current({ type: "begin-modify", id });
        break;
      case "display":
        if (id) dispatchRef.current({ type: "display", id });
        break;
      case "hearth":
        if (!id || !inst) break;
        dispatchRef.current(inst.container === "hearth" ? { type: "withdraw", id } : { type: "stash", id });
        break;
      case "favorite":
        if (id) dispatchRef.current({ type: "favorite", id });
        break;
      case "batch":
        dispatchRef.current({ type: "toggle-batch" });
        break;
      case "pickup":
        if (current.ground[0]) dispatchRef.current({ type: "pickup", groundId: current.ground[0].groundId });
        break;
      case "escape":
        if (current.batch) dispatchRef.current({ type: "clear-selection" });
        else if (current.query) dispatchRef.current({ type: "search", query: "" });
        break;
      case "view-step":
        dispatchRef.current({ type: "view", view: viewStep(current.view, shortcut.dir) });
        break;
      case "confirm":
        dispatchRef.current({ type: "confirm-pending" });
        break;
      case "cancel":
        dispatchRef.current({ type: "cancel-pending" });
        break;
      default:
        break;
    }
  }, []);
  const applyRef = useRef(applyShortcut);
  applyRef.current = applyShortcut;

  useEffect(() => {
    const loaded = loadSave();
    if (loaded) {
      stateRef.current = loaded;
      setState(loaded);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveSave(state);
  }, [ready, state]);

  useEffect(() => {
    ports.interfacePort.syncCarry(carryReport(state));
  }, [ports, state]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(0, -1)), 4200);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    const timer = window.setTimeout(() => setChecks(runChecks()), 60);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (helpRef.current) {
        if (event.key === "Escape") {
          event.preventDefault();
          setHelp(false);
        }
        return;
      }
      const shortcut = keyShortcut(event.key, isTypingTarget(event.target), Boolean(stateRef.current.pending));
      if (!shortcut) return;
      event.preventDefault();
      applyRef.current(shortcut);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let frame = 0;
    const held = new Set<number>();
    let lastStick = 0;
    const tick = () => {
      const pads = navigator.getGamepads?.();
      let connected = false;
      if (pads) {
        for (const pad of pads) {
          if (!pad?.connected) continue;
          connected = true;
          pad.buttons.forEach((button, index) => {
            if (button.pressed && !held.has(index)) {
              held.add(index);
              const shortcut = padButtonShortcut(index);
              if (shortcut) {
                if (stateRef.current.pending && shortcut.type !== "confirm" && shortcut.type !== "cancel") return;
                if (shortcut.type === "cancel" && !stateRef.current.pending) {
                  applyRef.current({ type: "escape" });
                  return;
                }
                applyRef.current(shortcut);
              }
            }
            if (!button.pressed) held.delete(index);
          });
          const axis = pad.axes[1] ?? 0;
          const now = performance.now();
          if (Math.abs(axis) > 0.55 && !stateRef.current.pending) {
            if (now - lastStick > 220) {
              lastStick = now;
              applyRef.current({ type: "move", dir: axis > 0 ? 1 : -1 });
            }
          } else if (Math.abs(axis) <= 0.55) lastStick = 0;
        }
      }
      setPadOn((current) => (current === connected ? current : connected));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const api = {
      getState: () => stateRef.current,
      dispatch: (action: Action) => dispatchRef.current(action),
      runChecks,
    };
    (window as unknown as { __inv?: typeof api }).__inv = api;
  }, []);

  useEffect(() => {
    if (state.pending) confirmRef.current?.focus();
  }, [state.pending]);

  const ids = visibleIds(state);
  const hiddenBySet = (() => {
    const query = state.query.trim();
    if (!query || state.content === "all") return 0;
    const hits = searchPrepared(buildSearchIndex(state), query);
    let extra = 0;
    for (const id of hits) {
      const inst = state.instances.find((row) => row.instanceId === id);
      if (!inst) continue;
      const klass = defOf(inst.defId).contentClass;
      if (state.content === "authored" && klass === "fixture") extra += 1;
      if (state.content === "fixture" && klass === "authored") extra += 1;
    }
    return extra;
  })();
  const focused = state.focusedId ? project(state, state.focusedId) : null;
  const hidden = Boolean(focused && !ids.includes(focused.instanceId) && showsItemList(state));
  const counts = census(state);
  const carry = carryReport(state);
  const searchCheck = checks?.find((check) => check.id === "search");
  const failed = checks?.filter((check) => !check.pass).length ?? 0;

  return (
    <div data-inv-root data-module="grok-54-inventory" className="flex h-full min-h-0 flex-col overflow-hidden bg-bg text-fg">
      <a href="#inv-list" className="sr-only focus:not-sr-only focus:absolute focus:z-40 focus:m-3 focus:bg-bg-elevated focus:px-3 focus:py-2">
        Skip to items
      </a>
      <header className="shrink-0 border-b border-border bg-bg px-4 pt-3 lg:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs tracking-wide text-fg-subtle uppercase">
              Ellis · {state.atHearth ? "at the hearth" : "away"}
              {padOn ? " · controller" : ""}
            </p>
            <h1 className="font-display text-xl leading-none tracking-tight lg:text-2xl">PREINCARNATION</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-sm ${state.atHearth ? "border-primary bg-primary text-primary-fg" : "border-border bg-bg-elevated"}`}
              aria-pressed={state.atHearth}
              onClick={() => dispatch({ type: "toggle-hearth" })}
            >
              <House className="size-4" aria-hidden="true" />
              {state.atHearth ? "Hearth" : "Away"}
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 text-sm"
              onClick={() => setHelp(true)}
              aria-label="Bindings"
            >
              <Keyboard className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Bindings</span>
            </button>
          </div>
        </div>
        <p className="mt-2 hidden text-sm text-fg-muted lg:block">Heft is noted and never slows you. A full pack files itself at the hearth.</p>
        <div className="mt-3 flex gap-4" aria-label="Capacity">
          <Meter label="Pack" used={carry.packSlots} cap={carry.packCap} />
          <Meter label="Hearth" used={carry.hearthSlots} cap={carry.hearthCap} />
          <Meter label="Shelf" used={carry.displaySlots} cap={carry.displayCap} />
        </div>
        {carry.heavyInPack > 0 ? (
          <p className="mt-1 text-xs text-fg-muted">Heft noted · {carry.heavyInPack} heavy in the pack. It does not slow you.</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 basis-52">
            <span className="sr-only">Search items</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
            <input
              id="inv-search"
              ref={searchRef}
              value={state.query}
              onChange={(event) => dispatch({ type: "search", query: event.target.value })}
              placeholder="Search names, notes, fixtures"
              className="h-11 w-full rounded-lg border border-border bg-bg-elevated pr-10 pl-10 text-sm outline-none"
            />
            {state.query ? (
              <button
                type="button"
                className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md"
                onClick={() => dispatch({ type: "search", query: "" })}
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <select
            aria-label="Sort"
            value={state.sort}
            onChange={(event) => dispatch({ type: "sort", sort: event.target.value as SortKey })}
            className="h-11 rounded-lg border border-border bg-bg-elevated px-3 text-sm"
          >
            <option value="name">Name</option>
            <option value="kind">Kind</option>
            <option value="qty">Quantity</option>
            <option value="recent">Recent</option>
            <option value="heft">Heft</option>
            <option value="favorite">Favorites first</option>
          </select>
        </div>
        <div className="mt-1 flex gap-1 overflow-x-auto" role="tablist" aria-label="Places">
          {VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              role="tab"
              aria-selected={state.view === view}
              className={`h-11 shrink-0 border-b-2 px-3 text-sm ${state.view === view ? "border-primary font-medium text-fg" : "border-transparent text-fg-muted"}`}
              onClick={() => dispatch({ type: "view", view })}
            >
              {VIEW_LABEL[view]}
              {view === "checks" && checks ? ` ${checks.length - failed}/${checks.length}` : ""}
            </button>
          ))}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex gap-2 overflow-x-auto px-4 py-2 lg:px-6">
            <FilterChip on={state.content === "authored"} label={`Authored ${counts.authored}`} onClick={() => dispatch({ type: "content", content: "authored" })} />
            <FilterChip on={state.content === "fixture"} label={`Fixtures ${counts.fixture}`} onClick={() => dispatch({ type: "content", content: "fixture" })} />
            <FilterChip on={state.content === "all"} label="All" onClick={() => dispatch({ type: "content", content: "all" })} />
            <select
              aria-label="Kind"
              value={state.kind}
              onChange={(event) => dispatch({ type: "kind", kind: event.target.value as ItemKind | "all" })}
              className="h-11 shrink-0 rounded-full border border-border bg-bg-elevated px-3 text-sm"
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind === "all" ? "Any kind" : KIND_LABEL[kind]}
                </option>
              ))}
            </select>
            <FilterChip on={state.favoritesOnly} label="Favorites" onClick={() => dispatch({ type: "favoritesOnly", on: !state.favoritesOnly })} />
            <FilterChip on={state.protectedOnly} label="Protected" onClick={() => dispatch({ type: "protectedOnly", on: !state.protectedOnly })} />
          </div>
          {state.content === "authored" && !state.query ? (
            <p className="px-4 pb-1 text-xs text-fg-muted lg:px-6">
              {counts.fixtureDefs} fixture records stay indexed until you ask. They are not story.
            </p>
          ) : null}
          <EquipStrip
            state={state}
            onFocus={(id) => {
              dispatch({ type: "focus", id });
              setReadOpen(true);
            }}
          />
          {showsItemList(state) ? (
            <ItemList
              ids={ids}
              state={state}
              hiddenBySet={hiddenBySet}
              followFocus={followFocus}
              onFocus={(id) => dispatch({ type: "focus", id })}
              onToggle={(id) => dispatch({ type: "toggle-select", id })}
              onFavorite={(id) => dispatch({ type: "favorite", id })}
              onOpen={() => setReadOpen(true)}
              onWiden={() => {
                dispatch({ type: "content", content: "all" });
                const hit = searchPrepared(buildSearchIndex(state), state.query).find((id) => {
                  const inst = state.instances.find((row) => row.instanceId === id);
                  return inst ? defOf(inst.defId).contentClass === "fixture" : false;
                });
                if (hit) {
                  followFocus.current = true;
                  dispatch({ type: "focus", id: hit });
                }
              }}
            />
          ) : state.view === "collection" ? (
            <CollectionPane
              state={state}
              onFocus={(id) => {
                dispatch({ type: "focus", id });
                setReadOpen(true);
              }}
              onDisplaySet={(setId) => dispatch({ type: "display-set", setId })}
            />
          ) : state.view === "recipes" ? (
            <RecipePane state={state} onCraft={(recipeId) => dispatch({ type: "craft", recipeId })} />
          ) : (
            <ChecksPane
              checks={checks}
              ports={ports}
              logTick={logTick}
              padOn={padOn}
              onRecheck={() => setChecks(runChecks())}
              searchMs={searchCheck?.ms ?? null}
              onReincarnate={() => dispatch({ type: "reincarnate" })}
              onReset={() => {
                clearSave();
                dispatch({ type: "reset" });
              }}
              onLong={() => {
                dispatch({ type: "content", content: "all" });
                dispatch({ type: "view", view: "hearth" });
                dispatch({ type: "search", query: "unreasonable label" });
                dispatch({ type: "focus", id: LONG_FIXTURE_ID });
                followFocus.current = true;
              }}
              onFixtures={() => {
                dispatch({ type: "search", query: "" });
                dispatch({ type: "content", content: "fixture" });
                dispatch({ type: "view", view: "hearth" });
              }}
            />
          )}
        </section>
        <aside
          className={`flex min-h-0 flex-col overflow-hidden border-t border-border bg-bg-elevated lg:w-96 lg:flex-none lg:overflow-y-auto lg:border-t-0 lg:border-l ${
            readOpen ? "flex-1" : "h-16 shrink-0"
          } lg:h-auto lg:shrink-0`}
          aria-label="Reading"
        >
          <button
            type="button"
            className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center gap-3 border-b border-border bg-bg-elevated px-4 text-left lg:hidden"
            aria-expanded={readOpen}
            onClick={() => setReadOpen((open) => !open)}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{focused ? focused.name : "Nothing selected"}</span>
              <span className="block truncate text-xs text-fg-muted">
                {focused ? `${whereOf(focused.container)} · ${focused.contentClass === "fixture" ? "Fixture" : KIND_LABEL[focused.kind]}` : "Choose something from the pack."}
              </span>
            </span>
            <span className="shrink-0 text-xs text-fg-subtle">{readOpen ? "Close" : "Read"}</span>
            <ChevronDown className={`size-4 shrink-0 text-fg-subtle transition-transform ${readOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          <div className={readOpen ? "min-h-0 flex-1 overflow-y-auto" : "hidden lg:block lg:min-h-0 lg:flex-1 lg:overflow-y-auto"}>
            <Detail item={focused} hidden={hidden} state={state} onAction={dispatch} />
          </div>
        </aside>
      </div>

      <footer className="shrink-0 border-t border-border bg-bg-elevated px-4 py-2 lg:px-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {state.batch ? (
            <>
              <p className="text-sm tabular-nums">{state.selected.length} selected</p>
              <button type="button" className="h-11 rounded-lg bg-primary px-3 text-sm text-primary-fg" onClick={() => dispatch({ type: "batch-stash" })}>
                File at hearth
              </button>
              <button type="button" className="h-11 rounded-lg border border-border px-3 text-sm" onClick={() => dispatch({ type: "batch-favorite" })}>
                Favorite
              </button>
              <button
                type="button"
                className="h-11 rounded-lg border border-danger px-3 text-sm text-danger"
                onClick={() => dispatch({ type: "begin-dismantle", ids: state.selected })}
              >
                Dismantle eligible
              </button>
              <button type="button" className="h-11 rounded-lg px-3 text-sm text-fg-muted" onClick={() => dispatch({ type: "clear-selection" })}>
                Cancel batch
              </button>
              <span className="text-xs text-fg-muted">Protected, favorite, worn, and authored items stay.</span>
            </>
          ) : (
            <button type="button" className="h-11 rounded-lg border border-border px-3 text-sm" onClick={() => dispatch({ type: "toggle-batch" })}>
              Select several
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto" aria-label="On the ground">
          <span className="shrink-0 text-xs tracking-wide text-fg-subtle uppercase">On the ground</span>
          {state.ground.length === 0 ? <span className="text-sm text-fg-muted">Nothing nearby.</span> : null}
          {state.ground.map((stack, index) => (
            <button
              key={stack.groundId}
              type="button"
              data-ground-id={stack.groundId}
              className={`h-11 shrink-0 rounded-lg border bg-bg px-3 text-left text-sm ${index === 0 ? "border-primary" : "border-border"}`}
              onClick={() => dispatch({ type: "pickup", groundId: stack.groundId })}
            >
              {index === 0 ? "Nearest · " : ""}
              {defOf(stack.defId).name}
              {stack.qty > 1 ? ` ×${stack.qty}` : ""}
            </button>
          ))}
        </div>
      </footer>

      <div className="pointer-events-none fixed top-16 right-4 z-20 flex w-full max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className={`toast-in raise pointer-events-auto w-full rounded-lg border bg-bg-elevated px-3 py-2 text-sm ${
              toast.tone === "warn" ? "border-danger text-danger" : toast.tone === "discover" ? "border-primary" : toast.tone === "ok" ? "border-ok" : "border-border"
            }`}
          >
            {toast.text}
          </p>
        ))}
      </div>

      {state.pending ? (
        <PendingDialog
          state={state}
          confirmRef={confirmRef}
          onConfirm={() => dispatch({ type: "confirm-pending" })}
          onCancel={() => dispatch({ type: "cancel-pending" })}
        />
      ) : null}
      {help ? <HelpDialog onClose={() => setHelp(false)} padOn={padOn} /> : null}
    </div>
  );
}

function Meter({ label, used, cap }: { label: string; used: number; cap: number }) {
  const pct = cap === 0 ? 0 : Math.min(100, Math.round((used / cap) * 100));
  const tight = pct >= 90;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2 font-mono text-xs tabular-nums">
        <span className="text-fg-muted">{label}</span>
        <span className={tight ? "text-primary" : "text-fg"}>
          {used}/{cap}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-subtle" aria-hidden="true">
        <div className={`h-1 rounded-full ${tight ? "bg-primary" : "bg-primary"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KindMark({ kind, fixture }: { kind: ItemKind; fixture: boolean }) {
  const Icon = fixture ? Boxes : KIND_ICON[kind];
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-bg-subtle text-fg" aria-hidden="true">
      <Icon className="size-4" />
    </span>
  );
}

function FilterChip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`h-11 shrink-0 rounded-full border px-3 text-sm ${on ? "border-primary bg-primary text-primary-fg" : "border-border bg-bg-elevated text-fg"}`}
    >
      {label}
    </button>
  );
}

function EquipStrip({
  state,
  onFocus,
}: {
  state: ReturnType<typeof initialState>;
  onFocus: (id: string) => void;
}) {
  const slots: EquipSlot[] = ["body", "hand", "neck", "belt"];
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 lg:px-6" aria-label="Worn">
      {slots.map((slot) => {
        const worn = state.instances.find((inst) => inst.container === "equipped" && defOf(inst.defId).slot === slot);
        const name = worn ? defOf(worn.defId).name : "Empty";
        return (
          <button
            key={slot}
            type="button"
            disabled={!worn}
            onClick={() => worn && onFocus(worn.instanceId)}
            className={`flex h-14 min-w-28 flex-1 items-center gap-2 rounded-lg border px-3 text-left ${
              worn ? "border-border bg-bg-elevated" : "border-dashed border-border bg-bg text-fg-subtle"
            }`}
          >
            <span className="min-w-0">
              <span className="block text-xs text-fg-subtle">{SLOT_LABEL[slot]}</span>
              <span className={`block truncate text-sm ${worn ? "text-fg" : "text-fg-subtle"}`}>{name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ItemList({
  ids,
  state,
  hiddenBySet,
  followFocus,
  onFocus,
  onToggle,
  onFavorite,
  onOpen,
  onWiden,
}: {
  ids: string[];
  state: ReturnType<typeof initialState>;
  hiddenBySet: number;
  followFocus: MutableRefObject<boolean>;
  onFocus: (id: string) => void;
  onToggle: (id: string) => void;
  onFavorite: (id: string) => void;
  onOpen: () => void;
  onWiden: () => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: 0, end: 24 });
  const index = state.focusedId ? ids.indexOf(state.focusedId) : -1;

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const start = Math.max(0, Math.floor(el.scrollTop / ROW) - 6);
    const end = Math.min(ids.length, Math.ceil((el.scrollTop + el.clientHeight) / ROW) + 8);
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [ids.length]);

  useEffect(() => {
    measure();
  }, [measure, ids.length]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || index < 0) return;
    const top = index * ROW;
    if (top < el.scrollTop || top + ROW > el.scrollTop + el.clientHeight) {
      el.scrollTop = Math.max(0, top - ROW * 2);
    }
    setRange((prev) => {
      if (index >= prev.start && index < prev.end) return prev;
      const start = Math.max(0, index - 4);
      return { start, end: Math.min(ids.length, start + 24) };
    });
  }, [index, ids.length]);

  useEffect(() => {
    if (!followFocus.current || !state.focusedId) return;
    const node = document.getElementById(`opt-${state.focusedId}`);
    if (node instanceof HTMLElement) {
      followFocus.current = false;
      node.focus({ preventScroll: true });
    }
  }, [followFocus, range.end, range.start, state.focusedId]);

  return (
    <div
      id="inv-list"
      ref={scroller}
      role="listbox"
      aria-label="Items"
      aria-activedescendant={state.focusedId ? `opt-${state.focusedId}` : undefined}
      onScroll={measure}
      className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-6"
    >
      {ids.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-fg-muted">
          {state.query ? `Nothing matches “${state.query}” in this set.` : "Nothing in this view. Fixtures stay out of the way until you ask for them."}
          {hiddenBySet > 0 ? (
            <button type="button" className="mt-3 block h-11 rounded-lg bg-primary px-3 text-sm text-primary-fg" onClick={onWiden}>
              Show {hiddenBySet} matches in the other set
            </button>
          ) : null}
        </div>
      ) : (
        <div className="relative" style={{ height: ids.length * ROW }}>
          {ids.slice(range.start, range.end).map((id, offset) => {
            const item = project(state, id);
            if (!item) return null;
            const row = range.start + offset;
            const selected = state.focusedId === id;
            const picked = state.selected.includes(id);
            return (
              <div key={id} className="absolute right-0 left-0 px-0.5" style={{ top: row * ROW, height: ROW }}>
                <div className={`flex h-full items-stretch rounded-lg border ${selected ? "border-primary bg-bg-subtle" : "border-transparent"}`}>
                  {state.batch ? (
                    <button
                      type="button"
                      aria-pressed={picked}
                      aria-label={picked ? `Deselect ${item.name}` : `Select ${item.name}`}
                      className="flex w-11 shrink-0 items-center justify-center"
                      onClick={() => onToggle(id)}
                    >
                      <span className={`block size-4 rounded-sm border ${picked ? "border-primary bg-primary" : "border-border bg-bg-elevated"}`} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    id={`opt-${id}`}
                    role="option"
                    aria-selected={selected}
                    data-instance-id={id}
                    data-protected={item.protection !== "none" ? "true" : "false"}
                    className="flex min-w-0 flex-1 items-center gap-3 px-2 text-left"
                    onClick={() => {
                      onFocus(id);
                      onOpen();
                      if (state.batch) onToggle(id);
                    }}
                  >
                    <KindMark kind={item.kind} fixture={item.contentClass === "fixture"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium" title={item.name}>{item.name}</span>
                        {item.qty > 1 ? <span className="font-mono text-xs text-fg-muted tabular-nums">×{item.qty}</span> : null}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 truncate text-xs text-fg-muted">
                        <span>{item.contentClass === "fixture" ? "Fixture" : KIND_LABEL[item.kind]}</span>
                        <span>{whereOf(item.container)}</span>
                        <span className="truncate sm:hidden">{ERA_SHORT[item.provenance.era]}</span>
                        {item.heft === "heavy" ? <span>Heavy</span> : null}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-right sm:block">
                      <span className="block font-mono text-xs text-fg-subtle">{ERA_SHORT[item.provenance.era]}</span>
                    </span>
                    {item.protection !== "none" ? <Shield className="size-3.5 shrink-0 text-fg" aria-label="Protected" /> : null}
                  </button>
                  <button
                    type="button"
                    className="flex w-11 shrink-0 items-center justify-center"
                    aria-label={item.favorite ? `Clear favorite on ${item.name}` : `Favorite ${item.name}`}
                    aria-pressed={item.favorite}
                    onClick={() => onFavorite(id)}
                  >
                    <Star className={`size-4 ${item.favorite ? "fill-primary text-fg" : "text-fg-subtle"}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({
  item,
  hidden,
  state,
  onAction,
}: {
  item: PlayerItem | null;
  hidden: boolean;
  state: ReturnType<typeof initialState>;
  onAction: (action: Action) => void;
}) {
  if (!item) {
    return <div className="p-5 text-sm text-fg-muted">Select an item. Enter reads it. G picks up whatever is nearest.</div>;
  }
  const compare = comparison(state, item.instanceId);
  const recipes = recipesTouching(state, item.defId);
  const worn = item.container === "equipped";
  const usePrimary = !item.slot && (item.kind === "food" || item.kind === "quest");
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-5" data-testid="detail">
      <div className="flex items-start gap-3">
        <KindMark kind={item.kind} fixture={item.contentClass === "fixture"} />
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-wide text-fg-subtle uppercase">
            {item.contentClass === "fixture" ? "Fixture record" : KIND_LABEL[item.kind]}
            {item.protection === "quest" ? " · Quest" : item.protection === "story" ? " · Kept" : ""}
            {" · "}
            {whereOf(item.container)}
            {item.qty > 1 ? ` · ×${item.qty}` : ""}
          </p>
          <h2 className="mt-1 font-display text-2xl leading-snug break-words" data-full-name={item.name}>
            {item.name}
          </h2>
        </div>
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border"
          aria-pressed={item.favorite}
          aria-label={item.favorite ? `Clear favorite on ${item.name}` : `Favorite ${item.name}`}
          onClick={() => onAction({ type: "favorite", id: item.instanceId })}
        >
          <Star className={`size-4 ${item.favorite ? "fill-primary text-fg" : "text-fg-subtle"}`} />
        </button>
      </div>
      <p className="text-sm leading-relaxed">{item.summary}</p>
      {hidden ? (
        <p className="text-sm text-fg-muted">Not in this list. It is {placePhrase(item.container)}. Still selected.</p>
      ) : null}
      {item.storyWithheld > 0 ? (
        <p className="border-l-2 border-primary pl-3 text-sm">Something in this is still unread. Inspect it.</p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {item.slot ? (
          <Action
            wide
            icon={<Backpack className="size-4" />}
            label={worn ? "Take off" : "Wear"}
            primary
            onClick={() => onAction(worn ? { type: "unequip", id: item.instanceId } : { type: "equip", id: item.instanceId })}
          />
        ) : null}
        <Action
          wide={usePrimary}
          icon={<BookOpen className="size-4" />}
          label="Use"
          primary={usePrimary}
          onClick={() => onAction({ type: "use", id: item.instanceId })}
        />
        <Action icon={<Eye className="size-4" />} label="Inspect" onClick={() => onAction({ type: "inspect", id: item.instanceId })} />
        {item.modifiable ? (
          <Action icon={<Wrench className="size-4" />} label="Hone" onClick={() => onAction({ type: "begin-modify", id: item.instanceId })} />
        ) : null}
        <Action
          icon={<Frame className="size-4" />}
          label={item.container === "display" ? "Take down" : "Shelf"}
          onClick={() => onAction(item.container === "display" ? { type: "undisplay", id: item.instanceId } : { type: "display", id: item.instanceId })}
        />
        <Action
          icon={<House className="size-4" />}
          label={item.container === "hearth" ? "To pack" : "To hearth"}
          onClick={() => onAction(item.container === "hearth" ? { type: "withdraw", id: item.instanceId } : { type: "stash", id: item.instanceId })}
        />
      </div>
      <div className="rounded-lg border border-border bg-bg px-3 py-3">
        <p className="text-xs tracking-wide text-fg-subtle uppercase">{item.provenance.yearLabel}</p>
        <p className="mt-1 text-sm break-words">
          {item.provenance.place}. {item.provenance.note}
        </p>
        <p className="mt-2 text-xs text-fg-muted capitalize">Heft {item.heft}</p>
        {item.keptThroughInterval ? <p className="mt-2 text-sm">Kept through the fourteen years.</p> : null}
      </div>
      {item.modifiable || item.kind === "equipment" ? (
        <div>
          <div className="mb-1 flex justify-between text-xs text-fg-subtle">
            <span>Condition</span>
            <span className="tabular-nums">{item.condition}</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-bg-subtle">
            <div className="h-1 rounded-full bg-primary" style={{ width: `${item.condition}%` }} />
          </div>
        </div>
      ) : null}
      <section>
        <h3 className="text-xs tracking-wide text-fg-subtle uppercase">What it can do</h3>
        <ul className="mt-2 flex flex-col">
          {item.uses.map((use) => (
            <li key={use.id} className="border-t border-border py-2 text-sm">
              <span className="block">{use.label}</span>
              <span className="text-fg-muted">{use.where}</span>
            </li>
          ))}
        </ul>
      </section>
      {recipes.length ? (
        <section>
          <h3 className="text-xs tracking-wide text-fg-subtle uppercase">Known preparations</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                <span className="block font-medium">{recipe.name}</span>
                <span className="text-fg-muted">{recipe.station === "hearth" ? "At the hearth" : "In the pack"}. {recipe.reason}</span>
                <button
                  type="button"
                  className="mt-2 h-11 rounded-md bg-primary px-3 text-sm text-primary-fg disabled:opacity-40"
                  disabled={!recipe.ready}
                  onClick={() => onAction({ type: "craft", recipeId: recipe.id })}
                >
                  Make
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {compare ? (
        <section>
          <h3 className="flex items-center gap-2 text-xs tracking-wide text-fg-subtle uppercase">
            <Scale className="size-3.5" aria-hidden="true" />
            Compared with what is worn
          </h3>
          {compare.same ? (
            <p className="mt-2 text-sm">This is what is worn on {SLOT_LABEL[compare.slot].toLowerCase()}.</p>
          ) : compare.worn ? (
            <div className="mt-2 text-sm">
              <p className="text-fg-muted">Worn now: {compare.worn.name}</p>
              <table className="mt-2 w-full text-left">
                <thead className="text-xs text-fg-subtle">
                  <tr>
                    <th className="py-1 font-normal"> </th>
                    <th className="py-1 font-normal">This</th>
                    <th className="py-1 font-normal">Worn</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {compare.rows.map((row) => {
                    const better = row.item != null && row.worn != null && row.item !== row.worn;
                    return (
                      <tr key={row.stat} className="border-t border-border">
                        <th className="py-1 pr-2 font-normal">{row.stat}</th>
                        <td className={better && (row.item ?? 0) > (row.worn ?? 0) ? "text-ok" : undefined}>{row.item ?? "—"}</td>
                        <td className={better && (row.worn ?? 0) > (row.item ?? 0) ? "text-ok" : undefined}>{row.worn ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm">Nothing is worn on {SLOT_LABEL[compare.slot].toLowerCase()}.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Action({
  label,
  onClick,
  icon,
  primary = false,
  wide = false,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  primary?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm ${wide ? "col-span-2" : ""} ${primary ? "bg-primary text-primary-fg" : "border border-border bg-bg"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function CollectionPane({
  state,
  onFocus,
  onDisplaySet,
}: {
  state: ReturnType<typeof initialState>;
  onFocus: (id: string) => void;
  onDisplaySet: (setId: string) => void;
}) {
  const sets = collections(state);
  const groups: Array<["before" | "interval" | "after", string]> = [
    ["before", "The first winter"],
    ["interval", "Left through the years"],
    ["after", "Fourteen years on"],
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6 lg:px-6">
      <section>
        <h2 className="font-display text-lg">Collections</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {sets.map((set) => (
            <article key={set.setId} className="rounded-xl border border-border bg-bg-elevated p-4">
              <h3 className="font-medium">{set.name}</h3>
              <p className="mt-1 text-sm text-fg-muted tabular-nums">
                {set.owned} held{set.goal ? ` · ${set.goal} in the set` : " · each one keeps its year"}
              </p>
              {set.goal ? (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-subtle" aria-hidden="true">
                  <div className="h-1 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((set.owned / set.goal) * 100))}%` }} />
                </div>
              ) : null}
              <ul className="mt-2 flex flex-col">
                {set.ids.map((id) => {
                  const item = project(state, id);
                  if (!item) return null;
                  return (
                    <li key={id}>
                      <button type="button" className="h-11 w-full truncate text-left text-sm" onClick={() => onFocus(id)}>
                        {item.name} · {item.provenance.yearLabel}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {set.goal && set.owned >= set.goal ? (
                <button type="button" className="mt-2 h-11 rounded-lg border border-border px-3 text-sm" onClick={() => onDisplaySet(set.setId)}>
                  Put the set on the shelf
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-lg">Provenance</h2>
        {groups.map(([era, label]) => {
          const rows = state.instances.filter(
            (inst) => defOf(inst.defId).contentClass === "authored" && inst.provenance.era === era,
          );
          return (
            <div key={era} className="mt-3">
              <h3 className="text-xs tracking-wide text-fg-subtle uppercase">{label}</h3>
              <ul className="mt-1">
                {rows.map((inst) => (
                  <li key={inst.instanceId}>
                    <button type="button" className="min-h-11 w-full py-1 text-left text-sm break-words" onClick={() => onFocus(inst.instanceId)}>
                      {defOf(inst.defId).name}
                      <span className="block text-fg-muted">{inst.provenance.place}. {inst.provenance.note}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function RecipePane({
  state,
  onCraft,
}: {
  state: ReturnType<typeof initialState>;
  onCraft: (recipeId: string) => void;
}) {
  const recipes = recipeViews(state);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 lg:px-6">
      <h2 className="font-display text-lg">Known preparations</h2>
      <p className="mt-1 text-sm text-fg-muted">Ingredients may sit in the pack or the hearth. The shelf is not a pantry.</p>
      <div className="mt-3 grid gap-3">
        {recipes.map((recipe) => (
          <article key={recipe.id} className="rounded-xl border border-border bg-bg-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium">{recipe.name}</h3>
              <span className={`text-xs ${recipe.ready ? "text-ok" : "text-fg-muted"}`}>{recipe.ready ? "Ready" : "Short"}</span>
            </div>
            <p className="mt-1 text-sm">{recipe.blurb}</p>
            <ul className="mt-2 text-sm">
              {recipe.lines.map((line) => (
                <li key={line.defId} className="flex justify-between gap-3 border-t border-border py-1 tabular-nums">
                  <span>{line.name}{line.consume ? "" : " (tool)"}</span>
                  <span className={line.have >= line.need ? "text-ok" : "text-danger"}>
                    {line.have}/{line.need}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-fg-muted">{recipe.reason}</p>
            <button
              type="button"
              disabled={!recipe.ready}
              className="mt-3 h-11 rounded-lg bg-primary px-3 text-sm text-primary-fg disabled:opacity-40"
              onClick={() => onCraft(recipe.id)}
            >
              Make {recipe.resultName}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function ChecksPane({
  checks,
  ports,
  logTick,
  padOn,
  onRecheck,
  searchMs,
  onReincarnate,
  onReset,
  onLong,
  onFixtures,
}: {
  checks: CheckResult[] | null;
  ports: MemoryPorts;
  logTick: number;
  padOn: boolean;
  onRecheck: () => void;
  searchMs: number | null;
  onReincarnate: () => void;
  onReset: () => void;
  onLong: () => void;
  onFixtures: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 lg:px-6" data-testid="checks" data-logs={logTick}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg">Measured checks</h2>
          <p className="mt-1 font-mono text-xs text-fg-subtle tabular-nums">Search p95 {searchMs ?? "—"} ms</p>
        </div>
        <button type="button" className="h-11 rounded-lg border border-border px-3 text-sm" onClick={onRecheck}>
          Run again
        </button>
      </div>
      {!checks ? <p className="mt-3 text-sm text-fg-muted">Measuring search and focus…</p> : null}
      <ul className="mt-3 flex flex-col gap-2">
        {checks?.map((check) => (
          <li key={check.id} className="rounded-lg border border-border bg-bg-elevated px-3 py-2" data-check={check.id} data-pass={check.pass ? "true" : "false"}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{check.name}</span>
              <span className={`font-mono text-xs ${check.pass ? "text-ok" : "text-danger"}`}>{check.pass ? "Pass" : "Fail"}</span>
            </div>
            <p className="mt-1 text-sm text-fg-muted">{check.detail}</p>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="h-11 rounded-lg bg-primary px-3 text-sm text-primary-fg" onClick={onFixtures}>
          Open fixture index
        </button>
        <button type="button" className="h-11 rounded-lg border border-border px-3 text-sm" onClick={onLong}>
          Find the long name
        </button>
        <button type="button" className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm" onClick={onReincarnate}>
          <Library className="size-4" aria-hidden="true" />
          Fourteen years later
        </button>
        <button type="button" className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset demonstration
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Interface
          </h3>
          <ul className="mt-2 text-sm text-fg-muted">
            {ports.interfaceLog.length === 0 ? <li>Notices from the inventory appear here.</li> : null}
            {ports.interfaceLog.map((row) => (
              <li key={row.id} className="border-t border-border py-1">{row.text}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <House className="size-4" aria-hidden="true" />
            Homestead
          </h3>
          <ul className="mt-2 text-sm text-fg-muted">
            {ports.homesteadLog.length === 0 ? <li>Shared storage, the shelf, and the plot report here.</li> : null}
            {ports.homesteadLog.map((row) => (
              <li key={row.id} className="border-t border-border py-1">{row.text}</li>
            ))}
          </ul>
        </section>
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-fg-muted">
        <Gamepad2 className="size-4" aria-hidden="true" />
        {padOn ? "Controller connected." : "No controller. Keyboard and touch cover the same actions."}
      </p>
    </div>
  );
}

function PendingDialog({
  state,
  confirmRef,
  onConfirm,
  onCancel,
}: {
  state: ReturnType<typeof initialState>;
  confirmRef: RefObject<HTMLButtonElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const pending = state.pending;
  if (!pending) return null;
  const preview = pending.kind === "modify" ? modifyPreview(state, pending.id) : null;
  const plan = pending.kind === "dismantle" ? dismantlePlan(state, pending.ids) : null;
  const groups = new Map<string, number>();
  for (const row of plan?.skipped ?? []) groups.set(row.reason, (groups.get(row.reason) ?? 0) + 1);
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-primary/40 p-4 sm:items-center" role="presentation">
      <div role="alertdialog" aria-modal="true" aria-labelledby="pending-title" className="rise-in raise w-full max-w-md rounded-3xl border border-border bg-bg-elevated p-4">
        {pending.kind === "modify" && preview && !("error" in preview) ? (
          <>
            <h2 id="pending-title" className="font-display text-lg">Hone {preview.name}</h2>
            <p className="mt-2 text-sm">
              Use the {preview.tool}. Condition {preview.from} becomes {preview.to}. Esc leaves it unchanged.
            </p>
          </>
        ) : (
          <>
            <h2 id="pending-title" className="font-display text-lg">Dismantle eligible fixtures</h2>
            <p className="mt-2 text-sm">
              {plan?.ok.length ?? 0} fixture {(plan?.ok.length ?? 0) === 1 ? "record" : "records"} can be removed.
              Protected, favorite, worn, and authored items stay.
            </p>
            <ul className="mt-2 text-sm text-fg-muted">
              {[...groups.entries()].map(([reason, count]) => (
                <li key={reason}>{reason}: {count} left untouched</li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button ref={confirmRef} type="button" className="h-11 rounded-lg bg-primary px-3 text-sm text-primary-fg" onClick={onConfirm}>
            {pending.kind === "modify" ? "Hone" : plan?.ok.length ? "Dismantle eligible" : "Leave them"}
          </button>
          <button type="button" className="h-11 rounded-lg border border-border px-3 text-sm" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpDialog({ onClose, padOn }: { onClose: () => void; padOn: boolean }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-primary/40 p-4 sm:items-center" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="rise-in raise max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-bg-elevated p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="help-title" className="font-display text-lg">Bindings</h2>
          <button type="button" className="flex size-11 items-center justify-center" onClick={onClose} aria-label="Close bindings">
            <X className="size-4" />
          </button>
        </div>
        <ul className="mt-3">
          {KEY_BINDINGS.map((binding) => (
            <li key={binding.keys} className="flex gap-3 border-t border-border py-2 text-sm">
              <kbd className="w-20 shrink-0 font-mono text-xs">{binding.keys}</kbd>
              <span>
                <span className="font-medium">{binding.label}</span>
                <span className="block text-fg-muted">{binding.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <h3 className="mt-4 flex items-center gap-2 text-sm font-medium">
          <Gamepad2 className="size-4" aria-hidden="true" />
          Controller {padOn ? "connected" : "not connected"}
        </h3>
        <ul className="mt-2">
          {PAD_BINDINGS.map((binding) => (
            <li key={binding.keys} className="flex gap-3 border-t border-border py-2 text-sm">
              <span className="w-28 shrink-0 font-mono text-xs">{binding.keys}</span>
              <span>{binding.label}. {binding.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
