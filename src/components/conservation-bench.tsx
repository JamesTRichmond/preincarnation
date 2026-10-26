import { useEffect, useMemo, type ButtonHTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Archive,
  Box,
  Cog,
  Eye,
  Flag,
  Layers,
  Lock,
  LockOpen,
  RotateCcw,
  ScrollText,
  Search,
  ShieldCheck,
  Star,
  Undo2,
  Wrench,
} from "lucide-react";
import {
  useBench,
  type BatchMode,
  type OpFilter,
  type Pane,
  type PieceFilter,
} from "@/game/bench/store";
import {
  BENCH_FACTS,
  BINDING_REPORT,
  CONSERVATION,
  catalogById,
  everyRequests,
  isStackableKind,
  maxCount,
  performMany,
  preview,
  recipes,
  runnableRecipes,
  salvageRequests,
  STAT_LABEL,
  statIsWorse,
  type ItemInstance,
  type Recipe,
  type StatId,
  type WorkPreview,
  type WorkRequest,
} from "@/game/bench/index.ts";
import type { ItemKind, JournalEntry } from "@/game/bench/types.ts";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Button({
  children,
  className,
  variant = "quiet",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet" | "ghost" | "danger" }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm disabled:opacity-40",
        variant === "primary" && "bg-primary text-primary-fg",
        variant === "quiet" && "bg-bg-subtle text-fg ring-1 ring-border",
        variant === "ghost" && "bg-transparent text-fg",
        variant === "danger" && "text-danger ring-1 ring-border",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const PIECE_FILTERS: { id: PieceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "material", label: "Matter" },
  { id: "gear", label: "Gear" },
  { id: "heirloom", label: "Heirlooms" },
  { id: "quest", label: "Quest" },
  { id: "favorite", label: "Kept" },
];

const OP_FILTERS: { id: OpFilter; label: string }[] = [
  { id: "ready", label: "Can run" },
  { id: "fits", label: "This piece" },
  { id: "all", label: "Book" },
  { id: "fishing", label: "Fishing" },
  { id: "hunting", label: "Hunting" },
  { id: "lamp", label: "Lamps" },
  { id: "heirloom", label: "Heirlooms" },
  { id: "favorite", label: "Kept" },
];

const PANES: { id: Pane; label: string }[] = [
  { id: "bench", label: "Bench" },
  { id: "ledger", label: "Book" },
  { id: "work", label: "Order" },
  { id: "integrity", label: "Check" },
];

const SUGGESTED = [
  "op.restore.heir.oil-lamp",
  "op.modify.heir-locket",
  "op.dismantle.tin-can",
  "op.combine.float",
  "op.modify.lantern-optics",
  "op.restore.net",
];

const TAG_FILTERS = ["fishing", "hunting", "lamp", "heirloom"] as const;

function kindRank(kind: string): number {
  if (kind === "heirloom" || kind === "quest") return 0;
  if (kind === "gear" || kind === "tool") return 1;
  return 2;
}

function namesAsPrimary(recipe: Recipe, catalogId?: string): boolean {
  if (!catalogId) return false;
  return recipe.inputs.some((input) => input.role === "primary" && input.catalogId === catalogId);
}

function heldMass(items: ItemInstance[]): number {
  let mass = 0;
  for (const item of items) {
    const entry = catalogById.get(item.catalogId);
    if (entry) mass += entry.mass * item.qty;
  }
  return mass;
}

function consumeWord(mode: string): string {
  if (mode === "all") return "spent";
  if (mode === "wear") return "worn";
  if (mode === "tool") return "stays";
  return "untouched";
}

function commitLabel(order: WorkPreview | null, mode: BatchMode, recipe?: Recipe): string {
  if (!order?.ok) return "Cannot do this yet";
  if (mode === "salvage") return "Sweep the salvage";
  if (mode === "every") return "Do every eligible";
  if (recipe?.kind === "inspect") return "Read it";
  return "Do the work";
}

export function BenchScreen({ onClose }: { onClose: () => void }) {
  const ui = useBench();
  useEffect(() => {
    ui.hydrate();
  }, [ui.hydrate]);

  const ready = useMemo(() => new Set(runnableRecipes(ui.state).map((recipe) => recipe.id)), [ui.state]);
  const selected = ui.state.items.find((item) => item.instanceId === ui.selectedId);
  const selectedEntry = selected ? catalogById.get(selected.catalogId) : undefined;
  const recipe = recipes.find((item) => item.id === ui.recipeId);
  const undoLabel = ui.state.undo.at(-1)?.label;

  const request = useMemo<WorkRequest | null>(() => {
    if (!recipe) return null;
    return {
      recipeId: recipe.id,
      primaryInstanceId: ui.selectedId,
      choiceId: ui.choiceId,
      substitutes: ui.subs,
      count: ui.count,
    };
  }, [recipe, ui.selectedId, ui.choiceId, ui.subs, ui.count]);

  const order = useMemo(() => buildOrder(ui.state, ui.batchMode, request), [ui.state, ui.batchMode, request]);
  const pendingFocus = order?.ok ? order.cost.focus : 0;
  const mass = heldMass(ui.state.items);

  const pieceCounts = useMemo(() => {
    const counts: Record<PieceFilter, number> = {
      all: 0,
      material: 0,
      gear: 0,
      heirloom: 0,
      quest: 0,
      favorite: 0,
    };
    for (const item of ui.state.items) {
      const entry = catalogById.get(item.catalogId);
      if (!entry) continue;
      counts.all += 1;
      if (item.favorite) counts.favorite += 1;
      if (isStackableKind(entry.kind)) counts.material += 1;
      if (entry.kind === "gear" || entry.kind === "tool") counts.gear += 1;
      if (entry.kind === "heirloom") counts.heirloom += 1;
      if (entry.kind === "quest") counts.quest += 1;
    }
    return counts;
  }, [ui.state.items]);

  const opCounts = useMemo(() => {
    const counts: Record<OpFilter, number> = {
      ready: ready.size,
      fits: 0,
      all: recipes.length,
      fishing: 0,
      hunting: 0,
      lamp: 0,
      heirloom: 0,
      favorite: ui.state.favoriteRecipes.length,
    };
    for (const item of recipes) {
      if (namesAsPrimary(item, selected?.catalogId)) counts.fits += 1;
      for (const tag of TAG_FILTERS) {
        if (item.tags.includes(tag)) counts[tag] += 1;
      }
    }
    return counts;
  }, [ready, selected?.catalogId, ui.state.favoriteRecipes.length]);

  const pieces = useMemo(() => {
    const q = ui.pieceQuery.trim().toLowerCase();
    return ui.state.items
      .filter((item) => {
        const entry = catalogById.get(item.catalogId);
        if (!entry) return false;
        if (ui.pieceFilter === "favorite" && !item.favorite) return false;
        if (ui.pieceFilter === "material" && !isStackableKind(entry.kind)) return false;
        if (ui.pieceFilter === "gear" && entry.kind !== "gear" && entry.kind !== "tool") return false;
        if (ui.pieceFilter === "heirloom" && entry.kind !== "heirloom") return false;
        if (ui.pieceFilter === "quest" && entry.kind !== "quest") return false;
        if (!q) return true;
        return `${entry.name} ${entry.id} ${entry.blurb}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const ea = catalogById.get(a.catalogId);
        const eb = catalogById.get(b.catalogId);
        return kindRank(ea?.kind ?? "") - kindRank(eb?.kind ?? "") || (ea?.name ?? "").localeCompare(eb?.name ?? "");
      });
  }, [ui.state.items, ui.pieceFilter, ui.pieceQuery]);

  const book = useMemo(() => {
    const q = ui.opQuery.trim().toLowerCase();
    return recipes
      .filter((item) => {
        if (ui.opFilter === "ready" && !ready.has(item.id)) return false;
        if (ui.opFilter === "favorite" && !ui.state.favoriteRecipes.includes(item.id)) return false;
        if (ui.opFilter === "fits" && !namesAsPrimary(item, selected?.catalogId)) return false;
        if (
          ui.opFilter !== "ready" &&
          ui.opFilter !== "all" &&
          ui.opFilter !== "favorite" &&
          ui.opFilter !== "fits" &&
          !item.tags.includes(ui.opFilter)
        ) {
          return false;
        }
        if (!q) return true;
        return `${item.name} ${item.summary} ${item.id}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const catalogId = selected?.catalogId;
        if (catalogId && ui.opFilter !== "fits") {
          const fit = Number(namesAsPrimary(b, catalogId)) - Number(namesAsPrimary(a, catalogId));
          if (fit !== 0) return fit;
        }
        if (ui.opFilter !== "ready") {
          const runnable = Number(ready.has(b.id)) - Number(ready.has(a.id));
          if (runnable !== 0) return runnable;
        }
        return a.name.localeCompare(b.name);
      });
  }, [ui.opFilter, ui.opQuery, ui.state.favoriteRecipes, ready, selected?.catalogId]);

  const named = useMemo(() => {
    if (!selected) return [];
    return recipes.filter((item) => namesAsPrimary(item, selected.catalogId)).slice(0, 4);
  }, [selected]);

  const salvageN = useMemo(() => salvageRequests(ui.state).length, [ui.state]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-bg text-fg">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3 lg:px-6">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-fg-muted uppercase">Preincarnation · fourteenth year</p>
          <h1 className="font-display text-3xl leading-none text-fg">Conservation bench</h1>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <FocusMeter focus={ui.state.focus} max={ui.state.focusMax} pending={pendingFocus} />
          <p className="pb-1 text-sm text-fg-muted tabular-nums">Mass {mass}</p>
          <Button variant="ghost" onClick={ui.restBench} disabled={ui.state.focus >= ui.state.focusMax}>
            Rest
          </Button>
          <Button variant="quiet" onClick={ui.undoWork} disabled={ui.state.undo.length === 0}>
            <Undo2 aria-hidden />
            <span className="max-w-36 truncate">{undoLabel ? `Undo · ${undoLabel}` : "Undo"}</span>
          </Button>
          <Button variant="primary" onClick={onClose}>
            Walk
          </Button>
        </div>
      </header>

      <p className="border-b border-border px-4 py-2 text-sm text-fg-muted lg:px-6">
        {ready.size} of {BENCH_FACTS.operations} operations can run
        {selectedEntry ? ` · ${opCounts.fits} name ${selectedEntry.name}` : ""}
      </p>

      {ui.notice && (
        <p
          key={ui.notice.nonce}
          className="border-b border-border px-4 py-3 text-sm lg:px-6"
          aria-live="polite"
        >
          <span className="font-medium">{ui.notice.title}. </span>
          <span className="text-fg-muted">{ui.notice.detail}</span>
        </p>
      )}

      <nav className="flex gap-2 overflow-x-auto border-b border-border px-3 py-2 lg:hidden" aria-label="Sections">
        {PANES.map((pane) => (
          <Button
            key={pane.id}
            variant={ui.pane === pane.id ? "primary" : "ghost"}
            onClick={() => ui.setPane(pane.id)}
          >
            {pane.label}
          </Button>
        ))}
      </nav>

      <main className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)_minmax(18rem,26rem)]">
        <section
          className={cn(
            "min-h-0 flex-1 flex-col border-border lg:flex lg:border-r",
            ui.pane === "bench" ? "flex" : "hidden",
          )}
        >
          <div className="flex items-baseline justify-between px-3 pt-3">
            <h2 className="text-sm font-medium">Pieces</h2>
            <p className="text-xs text-fg-muted tabular-nums">{pieces.length}</p>
          </div>
          <div className="flex items-center gap-2 px-3 pt-2">
            <Search className="size-4 text-fg-muted" aria-hidden />
            <input
              value={ui.pieceQuery}
              onChange={(event) => ui.setPieceQuery(event.target.value)}
              placeholder="Find a piece"
              className="min-h-11 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
              aria-label="Search pieces"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 py-2" role="tablist" aria-label="Piece filters">
            {PIECE_FILTERS.map((filter) => (
              <FilterChip
                key={filter.id}
                active={ui.pieceFilter === filter.id}
                onClick={() => ui.setPieceFilter(filter.id)}
                label={`${filter.label} ${pieceCounts[filter.id]}`}
              />
            ))}
          </div>
          <ul className=" min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {pieces.map((item) => (
              <PieceRow
                key={item.instanceId}
                item={item}
                active={item.instanceId === ui.selectedId}
                onSelect={() => ui.selectPiece(item.instanceId)}
                onStar={() => ui.starPiece(item.instanceId)}
                onLock={() => ui.lockPiece(item.instanceId)}
              />
            ))}
            {pieces.length === 0 && <li className="px-2 py-6 text-sm text-fg-muted">Nothing in this drawer.</li>}
          </ul>
          <div className="border-t border-border p-3">
            <Button variant="quiet" className="w-full" onClick={() => ui.setBatchMode("salvage")}>
              Review salvage sweep{salvageN > 0 ? ` · ${salvageN}` : ""}
            </Button>
            <p className="mt-2 text-xs text-fg-muted">Favorites, locks, heirlooms, quest pieces, and bench tools stay put.</p>
          </div>
        </section>

        <section
          className={cn(
            "min-h-0 flex-1 flex-col border-border lg:flex lg:border-r",
            ui.pane === "ledger" ? "flex" : "hidden",
          )}
        >
          <div className="flex items-baseline justify-between px-3 pt-3">
            <h2 className="text-sm font-medium">Operations</h2>
            <p className="text-xs text-fg-muted tabular-nums">{book.length}</p>
          </div>
          <div className="flex items-center gap-2 px-3 pt-2">
            <Search className="size-4 text-fg-muted" aria-hidden />
            <input
              value={ui.opQuery}
              onChange={(event) => ui.setOpQuery(event.target.value)}
              placeholder="Find an operation"
              className="min-h-11 w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
              aria-label="Search operations"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 py-2" role="tablist" aria-label="Operation filters">
            {OP_FILTERS.map((filter) => (
              <FilterChip
                key={filter.id}
                active={ui.opFilter === filter.id}
                onClick={() => ui.setOpFilter(filter.id)}
                label={`${filter.label} ${opCounts[filter.id]}`}
              />
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 pb-2">
            {SUGGESTED.map((id) => {
              const item = recipes.find((entry) => entry.id === id);
              if (!item) return null;
              const can = ready.has(item.id);
              return (
                <Button key={id} variant={can ? "quiet" : "ghost"} onClick={() => arm(ui, item, selected)}>
                  <span className={cn("size-1.5 rounded-full", can ? "bg-ok" : "bg-subtle")} aria-hidden />
                  {item.name}
                </Button>
              );
            })}
          </div>
          <ul className=" min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {book.map((item) => (
              <li key={item.id} className="border-b border-border">
                <div className="flex items-start gap-2 py-3">
                  <button type="button" className="min-h-11 flex-1 text-left" onClick={() => arm(ui, item, selected)}>
                    <span className="block text-sm font-medium text-fg">{item.name}</span>
                    <span className="mt-1 block text-sm text-fg-muted">{item.summary}</span>
                    <span className="mt-1 block text-xs text-fg-subtle">
                      {item.kind}
                      {ready.has(item.id) ? " · ready" : ""}
                      {selected && namesAsPrimary(item, selected.catalogId) ? " · this piece" : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-md text-fg-muted"
                    aria-label={ui.state.favoriteRecipes.includes(item.id) ? "Unkeep operation" : "Keep operation"}
                    onClick={() => ui.starRecipe(item.id)}
                  >
                    <Star className={cn("size-4", ui.state.favoriteRecipes.includes(item.id) && "fill-primary text-primary")} />
                  </button>
                </div>
              </li>
            ))}
            {book.length === 0 && (
              <li className="py-6 text-sm text-fg-muted">
                {ui.opFilter === "fits" && !selected
                  ? "Select a piece. This list is operations that take that object as the work."
                  : ui.opFilter === "fits"
                    ? "Nothing in the book takes this object as the work."
                    : "No operation matches."}
              </li>
            )}
          </ul>
        </section>

        <section
          className={cn(
            "min-h-0 flex-1 flex-col lg:flex",
            ui.pane === "work" || ui.pane === "integrity" ? "flex" : "hidden",
          )}
        >
          {ui.pane === "integrity" ? (
            <Integrity />
          ) : (
            <WorkOrder
              selected={selected}
              recipe={recipe}
              order={order}
              named={named}
              ready={ready}
              onArm={(item) => arm(ui, item, selected)}
            />
          )}
          <div className="hidden border-t border-border p-3 lg:block">
            <Button variant="ghost" onClick={() => ui.setPane(ui.pane === "integrity" ? "work" : "integrity")}>
              <ShieldCheck className="size-4" aria-hidden />
              {ui.pane === "integrity" ? "Back to the order" : "Conservation check"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function arm(
  ui: {
    selectRecipe: (id: string) => void;
    selectPiece: (id: string) => void;
    state: { items: ItemInstance[] };
  },
  recipe: Recipe,
  selected?: ItemInstance,
) {
  const primary = recipe.inputs.find((input) => input.role === "primary");
  ui.selectRecipe(recipe.id);
  if (!primary) return;
  if (primary.catalogId === "*") {
    if (selected) ui.selectPiece(selected.instanceId);
    return;
  }
  if (selected?.catalogId === primary.catalogId) {
    ui.selectPiece(selected.instanceId);
    return;
  }
  const match = ui.state.items.find((item) => item.catalogId === primary.catalogId);
  if (match) ui.selectPiece(match.instanceId);
}

function buildOrder(
  state: ReturnType<typeof useBench.getState>["state"],
  mode: BatchMode,
  request: WorkRequest | null,
): WorkPreview | null {
  if (mode === "salvage") return performMany(state, salvageRequests(state)).preview;
  if (!request) return null;
  if (mode === "every") return performMany(state, everyRequests(state, request)).preview;
  return preview(state, request);
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 shrink-0 rounded-full px-3 text-sm whitespace-nowrap tabular-nums",
        active ? "bg-primary text-primary-fg" : "text-fg-muted",
      )}
    >
      {label}
    </button>
  );
}

function FocusMeter({ focus, max, pending }: { focus: number; max: number; pending: number }) {
  const spend = Math.min(Math.max(pending, 0), focus);
  const keep = max > 0 ? ((focus - spend) / max) * 100 : 0;
  const spent = max > 0 ? (spend / max) * 100 : 0;
  const after = focus - spend;
  return (
    <div className="w-40">
      <div className="flex items-baseline justify-between gap-2 text-xs text-fg-muted">
        <span>Focus</span>
        <span className="tabular-nums">{spend > 0 ? `${focus} → ${after}` : `${focus}/${max}`}</span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-bg-subtle" aria-hidden>
        <span className="h-full bg-fg" style={{ width: `${keep}%` }} />
        <span className="h-full bg-line" style={{ width: `${spent}%` }} />
      </div>
    </div>
  );
}

function ConditionMeter({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Condition ${value}`}>
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-line">
        <span
          className={cn("absolute inset-y-0 left-0", value < 20 ? "bg-danger" : "bg-fg")}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

function KindMark({ kind }: { kind: ItemKind | string }) {
  const Icon =
    kind === "heirloom" ? Archive : kind === "quest" ? Flag : kind === "tool" ? Wrench : kind === "gear" ? Layers : kind === "part" ? Cog : Box;
  return <Icon className="size-4" aria-hidden />;
}

function PieceRow({
  item,
  active,
  onSelect,
  onStar,
  onLock,
}: {
  item: ItemInstance;
  active: boolean;
  onSelect: () => void;
  onStar: () => void;
  onLock: () => void;
}) {
  const entry = catalogById.get(item.catalogId);
  if (!entry) return null;
  return (
    <li className={cn("mb-2 rounded-lg border", active ? "border-primary bg-bg-subtle" : "border-border bg-bg-elevated")}>
      <div className="flex items-start gap-1 p-2 pl-3">
        <button type="button" onClick={onSelect} className="flex min-h-11 min-w-0 flex-1 items-start gap-3 text-left">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-bg text-fg-muted">
            <KindMark kind={entry.kind} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{entry.name}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
              <ConditionMeter value={item.condition} />
              <span>
                {entry.kind}
                {item.qty > 1 ? ` · ${item.qty}` : ""}
                {entry.quest && entry.kind !== "quest" ? " · quest" : ""}
              </span>
            </span>
          </span>
        </button>
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-md"
          aria-label={item.favorite ? "Unkeep" : "Keep"}
          onClick={onStar}
        >
          <Star className={cn("size-4", item.favorite ? "fill-primary text-primary" : "text-fg-muted")} />
        </button>
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-md"
          aria-label={item.locked ? "Unlock" : "Lock"}
          onClick={onLock}
        >
          {item.locked ? <Lock className="size-4 text-fg" /> : <LockOpen className="size-4 text-fg-muted" />}
        </button>
      </div>
    </li>
  );
}

function WorkOrder({
  selected,
  recipe,
  order,
  named,
  ready,
  onArm,
}: {
  selected?: ItemInstance;
  recipe?: Recipe;
  order: WorkPreview | null;
  named: Recipe[];
  ready: Set<string>;
  onArm: (recipe: Recipe) => void;
}) {
  const ui = useBench();
  const entry = selected ? catalogById.get(selected.catalogId) : undefined;
  const ceiling = useMemo(() => {
    if (!recipe?.batchable) return 1;
    return maxCount(ui.state, {
      recipeId: recipe.id,
      primaryInstanceId: ui.selectedId,
      choiceId: ui.choiceId,
      substitutes: ui.subs,
      count: 1,
    });
  }, [ui.state, ui.selectedId, ui.choiceId, ui.subs, recipe]);
  const showRecipe = Boolean(recipe) && ui.batchMode !== "salvage";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className=" min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {selected && entry && (
          <article className="mb-4 rounded-xl bg-bg-elevated p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-bg text-fg-muted">
                <KindMark kind={entry.kind} />
              </span>
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-fg-muted uppercase">{entry.kind}</p>
                <h2 className="font-display text-2xl leading-tight">{entry.name}</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-fg-muted">{entry.blurb}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-fg-muted">Condition</dt>
                <dd className="mt-1">
                  <ConditionMeter value={selected.condition} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Mass</dt>
                <dd className="mt-1 tabular-nums">{entry.mass * selected.qty}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-fg-muted">Identity</dt>
                <dd className="mt-1 text-xs break-all text-fg-subtle">{selected.provenance.identityKey}</dd>
              </div>
              {selected.provenance.bearer && (
                <div className="col-span-2">
                  <dt className="text-fg-muted">Bearer</dt>
                  <dd>{selected.provenance.bearer}</dd>
                </div>
              )}
            </dl>
            {selected.mods.length > 0 && (
              <ul className="mt-3 text-sm">
                {selected.mods.map((mod) => (
                  <li key={mod.choiceId}>
                    {mod.name}
                    <StatList stats={mod.stats} />
                  </li>
                ))}
              </ul>
            )}
            <ol className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
              {selected.history.map((event, index) => (
                <li key={`${event.cycle}-${index}`}>
                  <span className="text-fg-muted tabular-nums">Year {event.cycle}. </span>
                  {event.text}
                </li>
              ))}
            </ol>
            <Button className="mt-3" variant="ghost" onClick={() => useBench.getState().selectRecipe("op.inspect")}>
              <Eye className="size-4" aria-hidden />
              Inspect
            </Button>
          </article>
        )}

        {!showRecipe && ui.batchMode !== "salvage" && (
          <div className="rounded-xl border border-border bg-bg-elevated p-4">
            <h2 className="font-display text-2xl leading-tight">Nothing armed</h2>
            <p className="mt-2 text-sm text-fg-muted">
              Choose an operation. The order shows what is spent, what stays the same object, and which identity survives — before anything leaves the bench.
            </p>
            {named.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {named.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="min-h-11 w-full rounded-md border border-border px-3 py-2 text-left"
                      onClick={() => onArm(item)}
                    >
                      <span className="block text-sm font-medium">{item.name}</span>
                      <span className="mt-1 block text-sm text-fg-muted">
                        {item.summary}
                        {ready.has(item.id) ? "" : " · not ready"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(showRecipe || ui.batchMode === "salvage") && order && (
          <article className="rounded-xl border border-border bg-bg-elevated p-4">
            <p className="text-xs tracking-wide text-fg-muted uppercase">
              {ui.batchMode === "salvage" ? "Sweep" : ui.batchMode === "every" ? "Every eligible" : recipe?.kind}
            </p>
            <h2 className="font-display text-2xl leading-tight">{order.title}</h2>
            {showRecipe && recipe && <p className="mt-2 text-sm text-fg-muted">{recipe.summary}</p>}

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Scope">
              <Button variant={ui.batchMode === "one" ? "quiet" : "ghost"} onClick={() => ui.setBatchMode("one")}>
                This order
              </Button>
              {recipe?.batchable && (
                <Button variant={ui.batchMode === "every" ? "quiet" : "ghost"} onClick={() => ui.setBatchMode("every")}>
                  Every eligible
                </Button>
              )}
              <Button variant={ui.batchMode === "salvage" ? "quiet" : "ghost"} onClick={() => ui.setBatchMode("salvage")}>
                Salvage sweep
              </Button>
            </div>

            {showRecipe && recipe?.choices && recipe.choices.length > 0 && (
              <fieldset className="mt-4">
                <legend className="text-sm font-medium">Direction</legend>
                <div className="mt-2 grid gap-2">
                  {recipe.choices.map((choice) => (
                    <label
                      key={choice.id}
                      className={cn(
                        "block rounded-md border p-3",
                        ui.choiceId === choice.id ? "border-primary bg-bg-subtle" : "border-border",
                      )}
                    >
                      <span className="flex items-start gap-2">
                        <input
                          type="radio"
                          className="mt-1"
                          name="direction"
                          checked={ui.choiceId === choice.id}
                          onChange={() => ui.setChoice(choice.id)}
                        />
                        <span>
                          <span className="block text-sm font-medium">{choice.name}</span>
                          <span className="mt-1 block text-sm text-fg-muted">{choice.summary}</span>
                          <StatList stats={choice.stats} />
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {showRecipe && recipe && recipe.substitutions.length > 0 && ui.batchMode === "one" && (
              <div className="mt-4 grid gap-3">
                {uniqueSubs(recipe).map((group) => (
                  <label key={group.forId} className="block text-sm">
                    <span className="text-fg-muted">{catalogById.get(group.forId)?.name}</span>
                    <select
                      className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg-subtle px-3 text-fg"
                      value={ui.subs[group.forId] ?? group.forId}
                      onChange={(event) => ui.setSub(group.forId, event.target.value)}
                    >
                      <option value={group.forId}>As written</option>
                      {group.options.map((sub) => (
                        <option key={sub.withCatalogId} value={sub.withCatalogId}>
                          {sub.note}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            )}

            {showRecipe && recipe?.batchable && ui.batchMode === "one" && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <label className="text-sm text-fg-muted" htmlFor="count">
                  Count
                </label>
                <Button variant="ghost" onClick={() => ui.setCount(ui.count - 1)} disabled={ui.count <= 1} aria-label="Fewer">
                  −
                </Button>
                <input
                  id="count"
                  type="number"
                  min={1}
                  max={500}
                  value={ui.count}
                  onChange={(event) => ui.setCount(Number(event.target.value))}
                  className="min-h-11 w-20 rounded-md border border-border bg-bg-subtle px-3 tabular-nums"
                />
                <Button variant="ghost" onClick={() => ui.setCount(ui.count + 1)} aria-label="More">
                  +
                </Button>
                <Button variant="ghost" onClick={() => ui.setCount(Math.max(1, ceiling))} disabled={ceiling < 1}>
                  All ({ceiling})
                </Button>
              </div>
            )}

            <div className="mt-4 grid gap-4 text-sm">
              <div>
                <p className="text-fg-muted">Spent</p>
                {order.inputs.length === 0 ? (
                  <p className="mt-1">Nothing</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {order.inputs.map((input, index) => (
                      <li key={`${input.catalogId}-${input.consume}-${index}`} className="rounded-md bg-bg px-2 py-1">
                        {input.qty} {catalogById.get(input.catalogId)?.name ?? input.catalogId}
                        <span className="text-fg-muted"> · {consumeWord(input.consume)}</span>
                        {input.substituted ? <span className="text-fg-muted"> · substitute</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-fg-muted">Set down</p>
                {order.outputs.length === 0 ? (
                  <p className="mt-1">No new object</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {order.outputs.map((output, index) => (
                      <li key={`${output.catalogId}-${output.identity}-${index}`} className="rounded-md bg-bg px-2 py-1">
                        {output.qty} {output.name}
                        <span className="text-fg-muted"> · {output.identity === "retain-primary" ? "same object" : "new"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
              <p>{order.identityNote}</p>
              <p className="text-fg-muted">{order.provenanceNote}</p>
              <p className="text-fg-muted tabular-nums">
                {order.cost.minutes} min · {order.cost.focus} focus
                {order.cost.toolWear > 0 ? ` · tools wear ${order.cost.toolWear}` : ""}
                {order.ok && order.cost.focus > 0 ? ` · ${ui.state.focus - order.cost.focus} focus left` : ""}
              </p>
            </div>

            {order.warnings.map((warning) => (
              <p key={warning} className="mt-3 border-l-2 border-border pl-3 text-sm text-fg-muted">
                {warning}
              </p>
            ))}
            {order.failures.length > 0 && (
              <div className="mt-3 text-sm text-danger">
                {order.failures.map((failure) => (
                  <p key={failure}>{failure}</p>
                ))}
                {order.recovery && <p className="mt-2 text-fg-muted">{order.recovery}</p>}
              </div>
            )}
            {order.ok && <p className="mt-3 text-sm text-karma-pos">{order.feedback}</p>}

            <SittingLog entries={ui.state.journal} />
          </article>
        )}

        {!(showRecipe || ui.batchMode === "salvage") && <SittingLog entries={ui.state.journal} />}
      </div>

      {(showRecipe || ui.batchMode === "salvage") && order && (
        <div className="border-t border-border bg-bg p-3">
          <Button className="w-full" variant="primary" disabled={!order.ok} onClick={ui.commit}>
            <ScrollText className="size-4" aria-hidden />
            {commitLabel(order, ui.batchMode, recipe)}
          </Button>
        </div>
      )}
    </div>
  );
}

function SittingLog({ entries }: { entries: JournalEntry[] }) {
  const latest = [...entries].reverse();
  const shown = latest.slice(0, 8);
  const hidden = latest.length - shown.length;
  return (
    <section className="mt-6 border-t border-border pt-4" aria-label="Sitting log">
      <h3 className="text-sm font-medium">Sitting log</h3>
      {shown.length === 0 ? (
        <p className="mt-2 text-sm text-fg-muted">Empty. Finished work is written here. Undo takes the line back with the pieces.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {shown.map((entry) => (
            <li key={entry.id}>
              <p className="text-sm font-medium">{entry.title}</p>
              <p className="text-sm text-fg-muted">{entry.detail}</p>
            </li>
          ))}
        </ol>
      )}
      {hidden > 0 && <p className="mt-3 text-xs text-fg-subtle">{hidden} earlier lines stay until undo rolls them back.</p>}
    </section>
  );
}

function uniqueSubs(recipe: Recipe) {
  const map = new Map<string, Recipe["substitutions"]>();
  for (const sub of recipe.substitutions) {
    const list = map.get(sub.forCatalogId) ?? [];
    list.push(sub);
    map.set(sub.forCatalogId, list);
  }
  return [...map.entries()].map(([forId, options]) => ({ forId, options }));
}

function StatList({ stats }: { stats: Partial<Record<StatId, number>> }) {
  const entries = Object.entries(stats) as [StatId, number][];
  if (entries.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {entries.map(([stat, delta]) => (
        <li
          key={stat}
          className={cn("rounded-md bg-bg px-2 py-1 text-xs tabular-nums", statIsWorse(stat, delta) ? "text-danger" : "text-karma-pos")}
        >
          {STAT_LABEL[stat]} {delta > 0 ? `+${delta}` : delta}
        </li>
      ))}
    </ul>
  );
}

function Integrity() {
  const ui = useBench();
  const mass = heldMass(ui.state.items);
  return (
    <div className=" min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <p className="text-xs tracking-wide text-fg-muted uppercase">Book integrity</p>
      <h2 className="font-display text-2xl">{CONSERVATION.ok ? "The book holds" : "The book fails conservation"}</h2>
      <p className="mt-2 text-sm text-fg-muted">
        {CONSERVATION.recipeCount} operations, {CONSERVATION.fixtureCount} fixtures. {CONSERVATION.violations.length} violations.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-bg-elevated p-3">
          <dt className="text-fg-muted">Mass held</dt>
          <dd className="mt-1 tabular-nums">{mass}</dd>
        </div>
        <div className="rounded-lg bg-bg-elevated p-3">
          <dt className="text-fg-muted">Focus</dt>
          <dd className="mt-1 tabular-nums">
            {ui.state.focus}/{ui.state.focusMax}
          </dd>
        </div>
        <div className="rounded-lg bg-bg-elevated p-3">
          <dt className="text-fg-muted">Log lines</dt>
          <dd className="mt-1 tabular-nums">{ui.state.journal.length}</dd>
        </div>
        <div className="rounded-lg bg-bg-elevated p-3">
          <dt className="text-fg-muted">Undo steps</dt>
          <dd className="mt-1 tabular-nums">{ui.state.undo.length}</dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-2 text-sm">
        {CONSERVATION.checks.map((check) => (
          <li key={check} className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-karma-pos" aria-hidden />
            <span>{check}</span>
          </li>
        ))}
      </ul>
      {CONSERVATION.violations.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-danger">
          {CONSERVATION.violations.map((item, index) => (
            <li key={`${item.code}-${index}`}>
              {item.code}: {item.detail}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-fg-muted">{BINDING_REPORT.note}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="danger" onClick={ui.askReset}>
          <RotateCcw className="size-4" aria-hidden />
          {ui.confirmReset ? "Cancel reset" : "Reset the kit"}
        </Button>
        {ui.confirmReset && (
          <Button variant="primary" onClick={ui.resetKit}>
            Put the fourteenth-year kit back
          </Button>
        )}
      </div>
    </div>
  );
}
