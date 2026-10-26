import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Star,
  Undo2,
} from "lucide-react";
import { accessBlock } from "../access.ts";
import { ReferenceStorageAdapter } from "../adapter.ts";
import { findContainer, packOf, totalQuantity } from "../audit.ts";
import { MISSING_BINDINGS } from "../missing-bindings.ts";
import { createEllRoom, ELL_CONTAINER_ORDER } from "../room.ts";
import type {
  DepositReceipt,
  ItemLot,
  MoveLine,
  StayLine,
  StayReason,
  StorageContainer,
  StorageWorld,
} from "../types.ts";

const LIVE_KEY = "preincarnation-ell-live";
const SNAP_KEY = "preincarnation-ell-snapshot";

const field =
  "min-h-11 rounded-lg border border-line bg-bg px-3 text-fg placeholder:text-muted";
const quietBtn = "min-h-11 rounded-lg border border-line bg-surface px-3 text-sm text-fg";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-copper px-4 font-medium text-copper-ink disabled:opacity-40";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function roomContainers(world: StorageWorld): StorageContainer[] {
  const order = new Map<string, number>(ELL_CONTAINER_ORDER.map((id, index) => [id, index]));
  return world.containers
    .filter((container) => container.kind !== "pack")
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

function quantityIn(container: StorageContainer): number {
  return container.lots.reduce((sum, lot) => sum + lot.quantity, 0);
}

function statusOf(container: StorageContainer): { label: string; tone: "open" | "warn" | "shut" } {
  const block = accessBlock(container);
  if (block === "destination-deleted") return { label: "Gone", tone: "shut" };
  if (block === "not-owned") return { label: "Not yours", tone: "shut" };
  if (block === "not-visited") return { label: "Unvisited", tone: "shut" };
  if (block === "not-nearby") return { label: "Too far", tone: "shut" };
  if (block === "shared-not-established") return { label: "Not shared", tone: "shut" };
  if (container.kind === "shared-material") return { label: "Shared", tone: "open" };
  if (container.reservedSlots > 0) return { label: "Reserved slots", tone: "warn" };
  return { label: "Open", tone: "open" };
}

function reasonLabel(reason: StayReason): string {
  switch (reason) {
    case "favorite":
      return "Favorite";
    case "equipped":
      return "Wearing";
    case "reserved-supply":
      return "Reserved";
    case "no-matching-rule":
      return "No rule";
    case "destination-full":
      return "Full";
    case "no-automation-slot":
      return "Reserved slots";
    case "destination-excluded":
      return "Excluded";
    case "destination-deleted":
      return "Gone";
    case "destination-missing":
      return "Unvisited";
    case "not-visited":
      return "Unvisited";
    case "not-owned":
      return "Not yours";
    case "not-nearby":
      return "Too far";
    case "shared-not-established":
      return "Not shared";
    case "interrupted":
      return "Stopped";
  }
}

function ownerLabel(ownerId: string): string {
  if (ownerId === "wren") return "Yours";
  if (ownerId === "town") return "Town";
  if (ownerId === "neighbor") return "Neighbor";
  return ownerId;
}

function metaLine(lot: ItemLot): string | null {
  const bits: string[] = [];
  if (typeof lot.meta.edge === "string") bits.push(`${lot.meta.edge} edge`);
  if ("lit" in lot.meta) bits.push(lot.meta.lit ? "lit" : "unlit");
  if (typeof lot.meta.season === "string") bits.push(`${lot.meta.season} season`);
  return bits.length > 0 ? bits.join(" · ") : null;
}

function previewRequestId(world: StorageWorld): string {
  let id = "__preview__";
  while (world.appliedRequestIds.includes(id)) id += "_";
  return id;
}

function isMove(line: MoveLine | StayLine): line is MoveLine {
  return line.type === "moved";
}

function isStay(line: MoveLine | StayLine): line is StayLine {
  return line.type === "stayed";
}

type Fate = { moves: MoveLine[]; stays: StayLine[] };

function fateFor(receipt: DepositReceipt, lotId: string): Fate {
  return {
    moves: receipt.lines.filter(
      (line): line is MoveLine => line.type === "moved" && line.sourceLotId === lotId,
    ),
    stays: receipt.lines.filter(
      (line): line is StayLine => line.type === "stayed" && line.lotId === lotId,
    ),
  };
}

function groupMoves(receipt: DepositReceipt): Array<{ id: string; name: string; quantity: number }> {
  const map = new Map<string, { id: string; name: string; quantity: number }>();
  for (const line of receipt.lines) {
    if (!isMove(line)) continue;
    const row = map.get(line.toId) ?? { id: line.toId, name: line.toName, quantity: 0 };
    row.quantity += line.quantity;
    map.set(line.toId, row);
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

function groupStays(receipt: DepositReceipt): Array<{ reason: StayReason; quantity: number }> {
  const map = new Map<StayReason, number>();
  for (const line of receipt.lines) {
    if (!isStay(line)) continue;
    map.set(line.reason, (map.get(line.reason) ?? 0) + line.quantity);
  }
  return [...map.entries()]
    .map(([reason, quantity]) => ({ reason, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.reason.localeCompare(b.reason));
}

type PackFilter = "all" | "moving" | "staying";

function scrollToDetail() {
  const node = document.getElementById("container-detail");
  if (!node) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  node.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
}

export function StorageRoomScreen() {
  const [world, setWorld] = useState<StorageWorld>(() => createEllRoom());
  const [past, setPast] = useState<StorageWorld[]>([]);
  const [receipt, setReceipt] = useState<DepositReceipt | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [destId, setDestId] = useState("wool-bin");
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PackFilter>("all");
  const [categoryName, setCategoryName] = useState("");
  const [categoryTag, setCategoryTag] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [ruleCategory, setRuleCategory] = useState("food");
  const [ruleDest, setRuleDest] = useState("pantry");

  useEffect(() => {
    const raw = localStorage.getItem(LIVE_KEY);
    if (raw) {
      try {
        const port = new ReferenceStorageAdapter(createEllRoom());
        port.load(raw);
        setWorld(port.world);
      } catch {
        setNote("The saved ell could not be read. The carried load is back.");
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const port = new ReferenceStorageAdapter(world);
    localStorage.setItem(LIVE_KEY, port.save());
  }, [world, ready]);

  useEffect(() => {
    if (!focusedId) return;
    scrollToDetail();
  }, [focusedId]);

  const pack = packOf(world);
  const containers = roomContainers(world);
  const selected = pack.lots.find((lot) => lot.id === selectedId) ?? null;
  const openDestinations = containers.filter((container) => accessBlock(container) === null);
  const focused = containers.find((container) => container.id === focusedId) ?? null;
  const rules = useMemo(
    () => [...world.profile.rules].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    [world.profile.rules],
  );

  const forecast = useMemo(() => {
    const port = new ReferenceStorageAdapter(world);
    return port.deposit({ requestId: previewRequestId(world) });
  }, [world]);

  const nextMove = forecast.lines.find(isMove) ?? null;
  const destinations = groupMoves(forecast);
  const stayGroups = groupStays(forecast);
  const packQty = quantityIn(pack);
  const storedQty = totalQuantity(world) - packQty;

  const fates = useMemo(() => {
    const map = new Map<string, Fate>();
    for (const lot of pack.lots) map.set(lot.id, fateFor(forecast, lot.id));
    return map;
  }, [forecast, pack.lots]);

  function remember() {
    setPast((stack) => [...stack.slice(-11), world]);
  }

  function apply(run: (port: ReferenceStorageAdapter) => void, nextNote?: string) {
    const port = new ReferenceStorageAdapter(world);
    run(port);
    remember();
    setWorld(port.world);
    setReceipt(null);
    if (nextNote) setNote(nextNote);
  }

  function revealStation(id: string) {
    if (id === focusedId) scrollToDetail();
    else setFocusedId(id);
  }

  function deposit(interruptAfterMoves?: number) {
    const port = new ReferenceStorageAdapter(world);
    const next = port.deposit({
      requestId: crypto.randomUUID(),
      interruptAfterMoves: interruptAfterMoves ?? null,
    });
    remember();
    setWorld(port.world);
    setReceipt(next);
    setNote(
      next.interrupted
        ? "One placement landed. The rest is still in the pack."
        : next.movedQuantity === 0
          ? "Nothing left the pack."
          : "Deposit finished. The plan above is what is left.",
    );
    if (!selected) return;
    const still = packOf(port.world).lots.find((lot) => lot.id === selected.id);
    if (!still) setSelectedId(null);
    else setQty(still.quantity);
  }

  function placeSelected() {
    if (!selected) return;
    const amount = Math.min(selected.quantity, Math.max(1, Math.floor(qty) || 1));
    const port = new ReferenceStorageAdapter(world);
    const result = port.place({
      lotId: selected.id,
      quantity: amount,
      fromId: world.packId,
      toId: destId,
    });
    setNote(result.detail);
    if (!result.ok) return;
    remember();
    setWorld(port.world);
    setReceipt(null);
    const still = packOf(port.world).lots.find((lot) => lot.id === selected.id);
    if (!still) setSelectedId(null);
    else setQty(still.quantity);
  }

  function takeBack(containerId: string, lot: ItemLot) {
    const port = new ReferenceStorageAdapter(world);
    const result = port.place({
      lotId: lot.id,
      quantity: lot.quantity,
      fromId: containerId,
      toId: world.packId,
    });
    setNote(result.detail);
    if (!result.ok) return;
    remember();
    setWorld(port.world);
    setReceipt(null);
  }

  function undo() {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast((stack) => stack.slice(0, -1));
    setWorld(prev);
    setReceipt(null);
    setSelectedId(null);
    setNote("Undid the last change.");
  }

  function chooseLot(lot: ItemLot) {
    setSelectedId(lot.id);
    setQty(lot.quantity);
    const hinted = fates.get(lot.id)?.moves[0]?.toId;
    if (hinted && openDestinations.some((container) => container.id === hinted)) {
      setDestId(hinted);
      return;
    }
    const holding = openDestinations.find((container) =>
      container.lots.some((item) => item.definitionId === lot.definitionId),
    );
    if (holding) setDestId(holding.id);
  }

  const definitions = useMemo(() => {
    const map = new Map<string, string>();
    for (const lot of pack.lots) map.set(lot.definitionId, lot.name);
    for (const reserve of world.profile.reserves) {
      if (!map.has(reserve.definitionId)) map.set(reserve.definitionId, reserve.definitionId);
    }
    for (const container of containers) {
      for (const lot of container.lots) {
        if (!map.has(lot.definitionId)) map.set(lot.definitionId, lot.name);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [pack.lots, world.profile.reserves, containers]);

  const needle = query.trim().toLowerCase();
  const visibleLots = [...pack.lots]
    .sort((a, b) => {
      const rank = (lot: ItemLot) => (lot.equipped ? 0 : lot.favorite ? 1 : 2);
      return rank(a) - rank(b) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    })
    .filter((lot) => {
      const fate = fates.get(lot.id) ?? { moves: [], stays: [] };
      if (filter === "moving" && fate.moves.length === 0) return false;
      if (filter === "staying" && fate.stays.length === 0) return false;
      if (!needle) return true;
      return `${lot.name} ${lot.tags.join(" ")}`.toLowerCase().includes(needle);
    });

  const movingLots = pack.lots.filter((lot) => (fates.get(lot.id)?.moves.length ?? 0) > 0).length;
  const stayingLots = pack.lots.filter((lot) => (fates.get(lot.id)?.stays.length ?? 0) > 0).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-5 border-b border-line pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-widest text-copper uppercase">Preincarnation</p>
            <h1 className="mt-1 text-4xl tracking-tight text-fg sm:text-5xl">The east ell</h1>
            <p className="mt-2 max-w-xl text-pretty text-muted">
              Year fourteen, White River. The plan shows where a deposit would put each matching
              stack before anything moves. Favorites, what you are wearing, and what you reserved
              stay in the pack.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="deposit-matching"
              className={primaryBtn}
              onClick={() => deposit()}
            >
              <ArrowDownToLine className="size-4" aria-hidden="true" />
              {forecast.movedQuantity > 0 ? `Deposit ${forecast.movedQuantity}` : "Deposit matching"}
            </button>
            <button
              type="button"
              data-testid="step-one"
              className={quietBtn}
              disabled={!nextMove}
              onClick={() => deposit(1)}
            >
              Place the next one
            </button>
            <button
              type="button"
              data-testid="undo"
              className={cx(quietBtn, "inline-flex items-center gap-2")}
              disabled={past.length === 0}
              onClick={undo}
            >
              <Undo2 className="size-4" aria-hidden="true" />
              Undo
            </button>
          </div>
        </div>
        <p className="text-sm text-muted tabular-nums" role="status">
          <span className="text-fg">{packQty}</span> in the pack
          <span aria-hidden="true"> · </span>
          <span className="text-fg">{storedQty}</span> stored
          <span aria-hidden="true"> · </span>
          <span className="text-fg">{forecast.movedQuantity}</span> ready to move
          {note ? <span className="text-fg"> · {note}</span> : null}
        </p>
      </header>

      <Forecast
        receipt={forecast}
        nextMove={nextMove}
        destinations={destinations}
        stayGroups={stayGroups}
        onOpen={revealStation}
      />

      {receipt ? <Ledger receipt={receipt} /> : null}

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="rounded-3xl border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl text-fg">Pack</h2>
            <span className="text-sm text-muted tabular-nums">{pack.lots.length} lots</span>
          </div>
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              aria-label="Search the pack"
              suppressHydrationWarning
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or tag"
              className={cx(field, "w-full bg-bg pl-10")}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter the pack">
            {(
              [
                ["all", `All ${pack.lots.length}`],
                ["moving", `Moving ${movingLots}`],
                ["staying", `Staying ${stayingLots}`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                className={cx(
                  "min-h-11 rounded-lg px-3 text-sm",
                  filter === id ? "bg-copper font-medium text-copper-ink" : "border border-line text-fg",
                )}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {pack.lots.length === 0 ? (
              <li className="text-sm text-muted">The pack is empty of carried goods.</li>
            ) : visibleLots.length === 0 ? (
              <li className="text-sm text-muted">Nothing in the pack matches.</li>
            ) : (
              visibleLots.map((lot) => {
                const fate = fates.get(lot.id) ?? { moves: [], stays: [] };
                const meta = metaLine(lot);
                return (
                  <li key={lot.id} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => chooseLot(lot)}
                      className={cx(
                        "flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left",
                        selectedId === lot.id ? "border-copper bg-surface-2" : "border-line bg-bg",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-fg">{lot.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {lot.kind === "unique" ? "Unique" : "Stack"} · {ownerLabel(lot.ownerId)}
                          {meta ? ` · ${meta}` : ""}
                        </span>
                        <FateLine fate={fate} />
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-fg">{lot.quantity}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={lot.favorite ? `Unfavorite ${lot.name}` : `Mark ${lot.name} favorite`}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-bg"
                      onClick={() =>
                        apply((port) => port.setLotMarks(lot.id, { favorite: !lot.favorite }))
                      }
                    >
                      <Star
                        className={cx("size-4", lot.favorite ? "fill-gold text-gold" : "text-muted")}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {selected ? (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="text-lg text-fg">Place by hand</h3>
              <p className="mt-1 text-sm text-muted">
                Hand placement is not a deposit. The next deposit will not pull it back out.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="text-sm text-muted" htmlFor="place-qty">
                  Amount
                </label>
                <input
                  id="place-qty"
                  suppressHydrationWarning
                  type="number"
                  min={1}
                  max={selected.quantity}
                  value={qty}
                  onChange={(event) => setQty(Number(event.target.value))}
                  className={cx(field, "w-20")}
                />
                <label className="sr-only" htmlFor="place-dest">
                  Destination
                </label>
                <select
                  id="place-dest"
                  suppressHydrationWarning
                  value={destId}
                  onChange={(event) => setDestId(event.target.value)}
                  className={cx(field, "min-w-0 flex-1")}
                >
                  {openDestinations.map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  data-testid="place-manual"
                  className={primaryBtn}
                  onClick={placeSelected}
                  disabled={openDestinations.length === 0}
                >
                  Place
                </button>
              </div>
              {selected.kind === "unique" ? (
                <div className="mt-3">
                  <button
                    type="button"
                    className={quietBtn}
                    onClick={() =>
                      apply((port) => port.setLotMarks(selected.id, { equipped: !selected.equipped }))
                    }
                  >
                    {selected.equipped ? "Set down" : "Wear"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              Choose a lot to place it by hand. A star keeps it out of the next deposit.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl text-fg">The ell</h2>
            <p className="text-sm text-muted">
              {destinations.length > 0
                ? `${destinations.length} containers would take goods.`
                : "No container is waiting on the pack."}{" "}
              Copper is filled. Gold is held back.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {containers.map((container) => (
              <StationCard
                key={container.id}
                container={container}
                pressed={focusedId === container.id}
                arriving={destinations.find((row) => row.id === container.id)?.quantity ?? 0}
                onOpen={() => revealStation(container.id)}
              />
            ))}
          </div>
          {focused ? (
            <ContainerDetail
              container={focused}
              rules={rules}
              arriving={forecast.lines.filter(
                (line): line is MoveLine => line.type === "moved" && line.toId === focused.id,
              )}
              onTake={(lot) => takeBack(focused.id, lot)}
              onClose={() => setFocusedId(null)}
            />
          ) : (
            <p className="text-sm text-muted">Open a container to take goods back into the pack.</p>
          )}
        </section>
      </div>

      <Routing
        world={world}
        containers={containers}
        rules={rules}
        definitions={definitions}
        categoryName={categoryName}
        categoryTag={categoryTag}
        ruleName={ruleName}
        ruleCategory={ruleCategory}
        ruleDest={ruleDest}
        onCategoryName={setCategoryName}
        onCategoryTag={setCategoryTag}
        onRuleName={setRuleName}
        onRuleCategory={setRuleCategory}
        onRuleDest={setRuleDest}
        onApply={apply}
        onOpen={revealStation}
      />

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          className={quietBtn}
          onClick={() => {
            const port = new ReferenceStorageAdapter(world);
            localStorage.setItem(SNAP_KEY, port.save());
            setNote("Snapshot saved. Load it to return here.");
          }}
        >
          Save snapshot
        </button>
        <button
          type="button"
          className={quietBtn}
          onClick={() => {
            const raw = localStorage.getItem(SNAP_KEY);
            if (!raw) {
              setNote("No snapshot yet.");
              return;
            }
            try {
              const port = new ReferenceStorageAdapter(world);
              port.load(raw);
              remember();
              setWorld(port.world);
              setReceipt(null);
              setSelectedId(null);
              setNote("Snapshot loaded. Counts and identities are as you saved them.");
            } catch {
              setNote("That snapshot could not be read.");
            }
          }}
        >
          Load snapshot
        </button>
        <button
          type="button"
          className={cx(quietBtn, "inline-flex items-center gap-2")}
          onClick={() => {
            remember();
            localStorage.removeItem(LIVE_KEY);
            setWorld(createEllRoom());
            setReceipt(null);
            setSelectedId(null);
            setFocusedId(null);
            setNote("The ell is reset to the carried load.");
          }}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset ell
        </button>
      </section>

      <details className="rounded-3xl border border-line bg-surface p-4 text-sm text-muted">
        <summary className="cursor-pointer text-fg">Live inventory bindings still open</summary>
        <p className="mt-2 text-pretty">
          This room runs on a reference adapter. Deposit cannot dismantle, sell, consume, donate,
          or change ownership. The campaign inventory is not in this build:
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {MISSING_BINDINGS.map((binding) => (
            <li key={binding.id}>
              <span className="text-fg">{binding.id}.</span> {binding.need}
            </li>
          ))}
        </ul>
      </details>
    </main>
  );
}

function FateLine({ fate }: { fate: Fate }) {
  if (fate.moves.length === 0 && fate.stays.length === 0) return null;
  return (
    <span className="mt-1 block text-xs">
      {fate.moves.map((move, index) => (
        <span key={`${move.destLotId}-${index}`} className="text-moss">
          {index > 0 ? " · " : ""}
          {move.quantity} → {move.toName}
        </span>
      ))}
      {fate.stays.map((stay, index) => (
        <span key={`${stay.reason}-${index}`} className="text-gold">
          {fate.moves.length > 0 || index > 0 ? " · " : ""}
          {stay.quantity} {reasonLabel(stay.reason).toLowerCase()}
        </span>
      ))}
    </span>
  );
}

function Forecast({
  receipt,
  nextMove,
  destinations,
  stayGroups,
  onOpen,
}: {
  receipt: DepositReceipt;
  nextMove: MoveLine | null;
  destinations: Array<{ id: string; name: string; quantity: number }>;
  stayGroups: Array<{ reason: StayReason; quantity: number }>;
  onOpen: (id: string) => void;
}) {
  return (
    <section
      data-testid="forecast"
      aria-live="polite"
      className="rise-in rounded-3xl border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl text-fg">If you deposit now</h2>
        <p className="text-sm text-muted tabular-nums">
          {receipt.movedQuantity} would move · {receipt.stayedQuantity} would stay
        </p>
      </div>
      {nextMove ? (
        <p className="mt-3 border-l-2 border-copper pl-3 text-sm text-fg">{nextMove.text}</p>
      ) : (
        <p className="mt-3 text-sm text-muted">Nothing in the pack has a place to go.</p>
      )}
      {destinations.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {destinations.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-line bg-bg px-3 text-sm text-fg"
                onClick={() => onOpen(row.id)}
              >
                {row.name}
                <span className="ml-2 tabular-nums text-moss">+{row.quantity}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {stayGroups.length > 0 ? (
        <p className="mt-3 text-sm text-muted">
          Stays:{" "}
          {stayGroups.map((group, index) => (
            <span key={group.reason}>
              {index > 0 ? " · " : ""}
              <span className="text-fg tabular-nums">{group.quantity}</span>{" "}
              {reasonLabel(group.reason).toLowerCase()}
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

function Ledger({ receipt }: { receipt: DepositReceipt }) {
  const stays = receipt.lines.filter(isStay);
  const moves = receipt.lines.filter(isMove);
  const interrupted = stays.filter((line) => line.reason === "interrupted");
  const kept = stays.filter((line) => line.reason !== "interrupted");
  const interruptedQty = interrupted.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <section aria-live="polite" data-testid="ledger" className="rounded-3xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl text-fg">Last deposit</h2>
        <p className="text-sm text-muted tabular-nums">
          Moved {receipt.movedQuantity} · Stayed {receipt.stayedQuantity} · Count {receipt.quantityBefore}{" "}
          to {receipt.quantityAfter}
          {receipt.interrupted ? " · Stopped early" : ""}
          {receipt.repeated ? " · Already ran" : ""}
        </p>
      </div>
      {receipt.lines.length === 0 ? (
        <p className="mt-2 text-sm text-muted">That deposit already ran. Nothing moved twice.</p>
      ) : (
        <ul className="mt-3 flex max-h-96 flex-col gap-2 overflow-auto">
          {moves.map((line, index) => (
            <li key={`m-${index}`} className="border-l-2 border-moss py-1 pl-3 text-sm text-fg">
              {line.text}
            </li>
          ))}
          {interruptedQty > 0 ? (
            <li className="border-l-2 border-gold py-1 pl-3 text-sm text-fg">
              <span className="text-gold">Stopped.</span> {interruptedQty} stayed in the pack. The
              transfer stopped before they left.
            </li>
          ) : null}
          {kept.map((line, index) => (
            <li key={`s-${index}`} className="border-l-2 border-gold py-1 pl-3 text-sm text-fg">
              {line.quantity} {line.name}. {line.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SlotMeter({ container }: { container: StorageContainer }) {
  const cap = Math.max(1, container.slotCapacity);
  const filled = Math.min(container.lots.length, cap);
  const reserved = Math.max(0, Math.min(container.reservedSlots, cap - filled));
  const open = Math.max(0, cap - filled - reserved);
  return (
    <div className="mt-3 flex h-2 overflow-hidden rounded-sm bg-line" aria-hidden="true">
      {filled > 0 ? <span className="bg-copper" style={{ width: `${(filled / cap) * 100}%` }} /> : null}
      {reserved > 0 ? <span className="bg-gold" style={{ width: `${(reserved / cap) * 100}%` }} /> : null}
      {open > 0 ? <span className="bg-surface-2" style={{ width: `${(open / cap) * 100}%` }} /> : null}
    </div>
  );
}

function StationCard({
  container,
  pressed,
  arriving,
  onOpen,
}: {
  container: StorageContainer;
  pressed: boolean;
  arriving: number;
  onOpen: () => void;
}) {
  const status = statusOf(container);
  const blocked = accessBlock(container);
  const preview = container.lots.slice(0, 2);
  return (
    <button
      type="button"
      id={`station-${container.id}`}
      data-testid={`station-${container.id}`}
      aria-pressed={pressed}
      onClick={onOpen}
      className={cx(
        "flex min-h-11 w-full flex-col rounded-2xl border p-3 text-left",
        pressed ? "border-copper bg-surface-2" : "border-line bg-surface",
        blocked && "opacity-80",
      )}
    >
      <span className="flex flex-col items-start gap-2">
        <span className="font-display text-base leading-snug text-fg">{container.name}</span>
        <span
          className={cx(
            "inline-flex items-center gap-1 rounded px-2 py-1 text-xs",
            status.tone === "open" && "bg-moss text-moss-ink",
            status.tone === "warn" && "bg-gold text-gold-ink",
            status.tone === "shut" && "bg-bg text-muted",
          )}
        >
          {status.tone === "shut" ? <Lock className="size-3" aria-hidden="true" /> : null}
          {status.label}
        </span>
      </span>
      <SlotMeter container={container} />
      <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-xs text-muted tabular-nums">
        <span>
          {container.lots.length}/{container.slotCapacity} slots · {quantityIn(container)} stored
        </span>
        {arriving > 0 ? <span className="text-moss">+{arriving}</span> : null}
      </span>
      <span className="mt-2 flex flex-col gap-1">
        {preview.length === 0 ? (
          <span className="text-sm text-muted">Empty</span>
        ) : (
          preview.map((lot) => (
            <span key={lot.id} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-fg">{lot.name}</span>
              <span className="shrink-0 tabular-nums text-muted">{lot.quantity}</span>
            </span>
          ))
        )}
        {container.lots.length > preview.length ? (
          <span className="text-xs text-muted">{container.lots.length - preview.length} more</span>
        ) : null}
      </span>
    </button>
  );
}

function ContainerDetail({
  container,
  rules,
  arriving,
  onTake,
  onClose,
}: {
  container: StorageContainer;
  rules: StorageWorld["profile"]["rules"];
  arriving: MoveLine[];
  onTake: (lot: ItemLot) => void;
  onClose: () => void;
}) {
  const blocked = accessBlock(container);
  const routed = rules.filter(
    (rule) => rule.enabled && rule.destinationIds.includes(container.id),
  );
  const excluded = rules.filter((rule) => rule.excludeDestinationIds.includes(container.id));
  return (
    <article id="container-detail" className="scroll-mt-6 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl text-fg">{container.name}</h3>
          <p className="mt-1 text-sm text-pretty text-muted">{container.note}</p>
        </div>
        <button type="button" className={quietBtn} onClick={onClose}>
          Close
        </button>
      </div>
      {routed.length > 0 || excluded.length > 0 ? (
        <p className="mt-3 text-sm text-muted">
          {routed.length > 0 ? `Routed here: ${routed.map((rule) => rule.name).join(", ")}.` : ""}
          {routed.length > 0 && excluded.length > 0 ? " " : ""}
          {excluded.length > 0
            ? `Kept out: ${excluded.map((rule) => rule.name).join(", ")}.`
            : ""}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">No enabled rule names this container.</p>
      )}
      {arriving.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-moss">Would arrive</p>
          <ul className="mt-2 flex flex-col gap-1">
            {arriving.map((line, index) => (
              <li key={`${line.sourceLotId}-${index}`} className="text-sm text-fg">
                +{line.quantity} {line.name}
                {line.ruleName ? <span className="text-muted"> · {line.ruleName}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="mt-4 flex flex-col gap-3">
        {container.lots.length === 0 ? (
          <li className="text-sm text-muted">Nothing stored.</li>
        ) : (
          container.lots.map((lot) => (
            <li key={lot.id} className="border-t border-line pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-fg">{lot.name}</span>
                  <span className="block text-xs text-muted">
                    {ownerLabel(lot.ownerId)}
                    {lot.kind === "unique" ? " · unique" : ""}
                    {metaLine(lot) ? ` · ${metaLine(lot)}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-sm tabular-nums text-muted">
                    {lot.quantity}/{lot.maxStack}
                  </span>
                  {blocked ? null : (
                    <button type="button" className={quietBtn} onClick={() => onTake(lot)}>
                      To pack
                    </button>
                  )}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-line" aria-hidden="true">
                <span
                  className="block h-full bg-copper"
                  style={{ width: `${Math.min(100, (lot.quantity / Math.max(1, lot.maxStack)) * 100)}%` }}
                />
              </div>
            </li>
          ))
        )}
      </ul>
      {blocked ? (
        <p className="mt-3 text-sm text-muted">Closed to you. Nothing here can be taken back.</p>
      ) : null}
    </article>
  );
}

function Routing({
  world,
  containers,
  rules,
  definitions,
  categoryName,
  categoryTag,
  ruleName,
  ruleCategory,
  ruleDest,
  onCategoryName,
  onCategoryTag,
  onRuleName,
  onRuleCategory,
  onRuleDest,
  onApply,
  onOpen,
}: {
  world: StorageWorld;
  containers: StorageContainer[];
  rules: StorageWorld["profile"]["rules"];
  definitions: Array<[string, string]>;
  categoryName: string;
  categoryTag: string;
  ruleName: string;
  ruleCategory: string;
  ruleDest: string;
  onCategoryName: (value: string) => void;
  onCategoryTag: (value: string) => void;
  onRuleName: (value: string) => void;
  onRuleCategory: (value: string) => void;
  onRuleDest: (value: string) => void;
  onApply: (run: (port: ReferenceStorageAdapter) => void, note?: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-4">
      <h2 className="text-2xl text-fg">Routing</h2>
      <p className="mt-1 max-w-3xl text-sm text-pretty text-muted">
        Rules run from the top. A later rule is used only when the earlier one cannot take the
        goods. Exclusions and locked containers are never written. Removing a rule can be undone.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {rules.map((rule, index) => (
          <li key={rule.id} className="rounded-2xl border border-line bg-bg p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted tabular-nums">{index + 1}</span>
              <span className="font-medium text-fg">{rule.name}</span>
              <span className="text-xs text-muted">
                {rule.matchAny
                  ? "Anything already stored"
                  : (world.profile.categories.find((category) => category.id === rule.categoryId)?.name ??
                    "Missing category")}
                {rule.onlyWherePresent ? " · top up only" : ""}
              </span>
              <span className="ml-auto flex flex-wrap gap-1">
                <button
                  type="button"
                  aria-label={`Move ${rule.name} up`}
                  className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-fg"
                  onClick={() => onApply((port) => port.moveRule(rule.id, -1))}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${rule.name} down`}
                  className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-fg"
                  onClick={() => onApply((port) => port.moveRule(rule.id, 1))}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={cx(
                    "min-h-11 rounded-lg px-3 text-sm",
                    rule.enabled ? "bg-moss text-moss-ink" : "border border-line text-muted",
                  )}
                  onClick={() => onApply((port) => port.setRuleEnabled(rule.id, !rule.enabled))}
                >
                  {rule.enabled ? "On" : "Off"}
                </button>
                <button
                  type="button"
                  className={quietBtn}
                  onClick={() => onApply((port) => port.removeRule(rule.id), `Removed ${rule.name}.`)}
                >
                  Remove
                </button>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {rule.destinationIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="min-h-11 rounded-lg border border-line px-3 text-sm text-fg"
                  onClick={() => onOpen(id)}
                >
                  {findContainer(world, id)?.name ?? id}
                </button>
              ))}
              {rule.destinationIds.length === 0 ? (
                <span className="text-sm text-muted">Nowhere yet</span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {rule.excludeDestinationIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="min-h-11 rounded-lg bg-gold px-3 text-sm text-gold-ink"
                  onClick={() => onApply((port) => port.toggleRuleExclusion(rule.id, id))}
                >
                  Exclude {findContainer(world, id)?.name ?? id}
                </button>
              ))}
              <label className="sr-only" htmlFor={`exclude-${rule.id}`}>
                Exclude a destination from {rule.name}
              </label>
              <select
                id={`exclude-${rule.id}`}
                suppressHydrationWarning
                defaultValue=""
                onChange={(event) => {
                  const id = event.target.value;
                  if (!id) return;
                  onApply((port) => port.toggleRuleExclusion(rule.id, id));
                  event.target.value = "";
                }}
                className={cx(field, "bg-surface text-sm")}
              >
                <option value="">Exclude a container</option>
                {containers
                  .filter((container) => !rule.excludeDestinationIds.includes(container.id))
                  .map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.name}
                    </option>
                  ))}
              </select>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form
          className="rounded-2xl border border-line bg-bg p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const name = categoryName.trim();
            const tag = categoryTag.trim();
            if (!name || !tag) return;
            const id = `cat-${crypto.randomUUID()}`;
            onApply(
              (port) => port.addCategory({ id, name, definitionIds: [], tags: [tag] }),
              `${name} is ready for a rule.`,
            );
            onRuleCategory(id);
            onCategoryName("");
            onCategoryTag("");
          }}
        >
          <h3 className="text-lg text-fg">New category</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              aria-label="Category name"
              suppressHydrationWarning
              value={categoryName}
              onChange={(event) => onCategoryName(event.target.value)}
              placeholder="Name"
              className={cx(field, "min-w-0 flex-1 bg-surface")}
            />
            <input
              aria-label="Category tag"
              suppressHydrationWarning
              value={categoryTag}
              onChange={(event) => onCategoryTag(event.target.value)}
              placeholder="Tag"
              className={cx(field, "w-28 bg-surface")}
            />
            <button type="submit" className={cx(primaryBtn, "px-3")}>
              <Plus className="size-4" aria-hidden="true" />
              Add
            </button>
          </div>
        </form>
        <form
          className="rounded-2xl border border-line bg-bg p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const name = ruleName.trim();
            if (!name) return;
            onApply(
              (port) =>
                port.addRule({
                  id: `rule-${crypto.randomUUID()}`,
                  name,
                  order: 5,
                  enabled: true,
                  categoryId: ruleCategory,
                  matchAny: false,
                  destinationIds: [ruleDest],
                  excludeDestinationIds: [],
                  onlyWherePresent: false,
                }),
              `${name} now runs first.`,
            );
            onRuleName("");
          }}
        >
          <h3 className="text-lg text-fg">New rule</h3>
          <div className="mt-3 flex flex-col gap-2">
            <input
              aria-label="Rule name"
              suppressHydrationWarning
              value={ruleName}
              onChange={(event) => onRuleName(event.target.value)}
              placeholder="Name"
              className={cx(field, "bg-surface")}
            />
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Rule category"
                suppressHydrationWarning
                value={ruleCategory}
                onChange={(event) => onRuleCategory(event.target.value)}
                className={cx(field, "min-w-0 flex-1 bg-surface")}
              >
                {world.profile.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Rule destination"
                suppressHydrationWarning
                value={ruleDest}
                onChange={(event) => onRuleDest(event.target.value)}
                className={cx(field, "min-w-0 flex-1 bg-surface")}
              >
                {containers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={primaryBtn}>
                Add
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-6">
        <h3 className="text-lg text-fg">Keep in the pack</h3>
        <p className="mt-1 text-sm text-muted">
          A reserve is left behind even when a rule matches. Zero clears it.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {definitions.map(([definitionId, name]) => {
            const keep =
              world.profile.reserves.find((reserve) => reserve.definitionId === definitionId)
                ?.keepInPack ?? 0;
            return (
              <li key={definitionId} className="flex items-center justify-between gap-3">
                <label className="min-w-0 truncate text-sm text-fg" htmlFor={`reserve-${definitionId}`}>
                  {name}
                </label>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Keep one fewer ${name}`}
                    disabled={keep === 0}
                    className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-fg disabled:opacity-40"
                    onClick={() => onApply((port) => port.setReserve(definitionId, keep - 1))}
                  >
                    −
                  </button>
                  <input
                    id={`reserve-${definitionId}`}
                    suppressHydrationWarning
                    type="number"
                    min={0}
                    value={keep}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (!Number.isFinite(next)) return;
                      onApply((port) => port.setReserve(definitionId, next));
                    }}
                    className={cx(field, "w-16 text-center tabular-nums")}
                  />
                  <button
                    type="button"
                    aria-label={`Keep one more ${name}`}
                    className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-fg"
                    onClick={() => onApply((port) => port.setReserve(definitionId, keep + 1))}
                  >
                    +
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
