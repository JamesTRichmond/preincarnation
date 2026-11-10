import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Anchor,
  Bell,
  Hammer,
  HeartPulse,
  Landmark,
  Milk,
  Printer,
  Scale,
  ShoppingBasket,
  Store,
  UtensilsCrossed,
  Wheat,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { isEssential, item, knownValue } from "../catalog.ts";
import {
  autoPicks,
  commit,
  compareOffers,
  createInitialState,
  faceFor,
  fairnessOfAsk,
  fairnessOfSale,
  isOpen,
  matchInterest,
  postedAsk,
  quote,
  unitSale,
} from "../engine.ts";
import { flipSeries, runSimulations, type SimCheck } from "../simulate.ts";
import { STALLS, stallDef } from "../stalls.ts";
import {
  CURRENCY,
  ERAS,
  type Fairness,
  type Intent,
  type ItemInstance,
  type Lot,
  type MarketState,
  type StallDef,
} from "../types.ts";

const KEY = "preincarnation-county-book-v1";

const ICONS: Record<string, LucideIcon> = {
  quill: Anchor,
  wicker: Hammer,
  button: Wheat,
  masta: ShoppingBasket,
  hale: UtensilsCrossed,
  fenn: Bell,
  phelps: Store,
  peck: HeartPulse,
  march: Landmark,
  otis: Milk,
  calder: Wrench,
  boudreau: Printer,
};

interface Lead {
  id: string;
  kicker: string;
  title: string;
  detail: string;
  fairness: Fairness | null;
  action: string;
  stallId: string;
  tab: "buy" | "sell" | "work";
  intent: Intent | null;
  select?: string;
  notice?: string;
}

interface WorkRow {
  id: string;
  name: string;
  detail: string;
  kind: "barter" | "service";
  missing: string[];
  fee: number;
  needsLine: boolean;
  done: boolean;
  picks: { instanceId: string; qty: number }[];
  lines?: string[];
}

function marks(n: number): string {
  const amount = Math.abs(n);
  return `${amount} ${amount === 1 ? CURRENCY.singular : CURRENCY.plural}`;
}

function chipClass(fairness: Fairness): string {
  if (fairness === "generous") return "bg-lake text-on-lake";
  if (fairness === "steep") return "bg-copper text-on-copper";
  if (fairness === "protected") return "bg-ink text-paper";
  return "border border-line bg-sheet text-ink";
}

function Chip({ fairness }: { fairness: Fairness }) {
  const label =
    fairness === "generous" ? "Generous" : fairness === "steep" ? "Steep" : fairness === "protected" ? "Protected" : "Fair";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${chipClass(fairness)}`}>
      {label}
    </span>
  );
}

function Meter({ offer, known }: { offer: number; known: number }) {
  const pct = known > 0 ? Math.max(8, Math.min(100, Math.round((offer / known) * 100))) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
      <div className="h-full bg-lake" style={{ width: `${pct}%` }} />
    </div>
  );
}

function workRows(state: MarketState, def: StallDef): WorkRow[] {
  const rows: WorkRow[] = [];
  for (const offer of def.barters) {
    const used = state.seasonUses[`${def.id}:${offer.id}`] ?? 0;
    const picked = autoPicks(state, offer.inputs);
    rows.push({
      id: offer.id,
      name: offer.name,
      detail: offer.detail,
      kind: "barter",
      missing: picked.missing,
      fee: 0,
      needsLine: false,
      done: offer.seasonLimit != null && used >= offer.seasonLimit,
      picks: picked.picks,
    });
  }
  for (const offer of def.services) {
    const used = state.seasonUses[`${def.id}:${offer.id}`] ?? 0;
    const picked = autoPicks(state, offer.inputs);
    rows.push({
      id: offer.id,
      name: offer.name,
      detail: offer.detail,
      kind: "service",
      missing: picked.missing,
      fee: offer.marks,
      needsLine: Boolean(offer.lines?.length),
      done: offer.seasonLimit != null && used >= offer.seasonLimit,
      picks: picked.picks,
      lines: offer.lines,
    });
  }
  return rows;
}

function bestSale(state: MarketState): Lead | null {
  let chosen: {
    inst: ItemInstance;
    stallId: string;
    stallName: string;
    offer: number;
    known: number;
    fairness: Fairness;
  } | null = null;
  for (const inst of state.pack) {
    const best = compareOffers(state, inst.instanceId).find((offer) => offer.open && !offer.blocked);
    if (!best) continue;
    const better =
      !chosen ||
      best.offer > chosen.offer ||
      (best.offer === chosen.offer && chosen.known > 0 && best.offer / best.known > chosen.offer / chosen.known);
    if (!better) continue;
    chosen = {
      inst,
      stallId: best.stallId,
      stallName: best.stallName,
      offer: best.offer,
      known: best.known,
      fairness: best.fairness,
    };
  }
  if (!chosen) return null;
  return {
    id: `sale:${chosen.inst.instanceId}`,
    kicker: "Best posted",
    title: item(chosen.inst.itemId).name,
    detail: `${chosen.stallName} pays ${marks(chosen.offer)}. County ${marks(chosen.known)}.`,
    fairness: chosen.fairness,
    action: "Review the offer",
    stallId: chosen.stallId,
    tab: "sell",
    select: chosen.inst.instanceId,
    intent: { kind: "sell", stallId: chosen.stallId, instanceId: chosen.inst.instanceId, qty: 1 },
  };
}

function readyWork(state: MarketState): Lead[] {
  const ranked = STALLS.flatMap((def) =>
    isOpen(def, state.eraIndex) ? workRows(state, def).map((row) => ({ def, row })) : [],
  );
  const ordered = [
    ...ranked.filter((entry) => entry.row.kind === "barter"),
    ...ranked.filter((entry) => entry.row.kind === "service"),
  ];
  const leads: Lead[] = [];
  for (const { def, row } of ordered) {
    if (row.done || row.missing.length > 0 || row.fee > state.purse) continue;
    const face = faceFor(def, state.eraIndex);
    leads.push({
      id: `${def.id}:${row.id}`,
      kicker: "You can finish",
      title: row.name,
      detail: row.needsLine
        ? `${face.name} can do this. Choose one of the posted sentences first.`
        : row.fee > 0
          ? `${face.name}. Fee ${marks(row.fee)}. The pack covers the rest.`
          : `${face.name}. The pack covers it. No marks move.`,
      fairness: null,
      action: row.needsLine ? "Open the card" : row.kind === "barter" ? "Review the barter" : "Review the work",
      stallId: def.id,
      tab: "work",
      notice: row.needsLine ? "Choose one of the posted sentences, then review the work." : undefined,
      intent: row.needsLine
        ? null
        : row.kind === "barter"
          ? { kind: "barter", stallId: def.id, offerId: row.id, picks: row.picks }
          : { kind: "service", stallId: def.id, serviceId: row.id, picks: row.picks },
    });
  }
  return leads;
}

function fairBuy(state: MarketState): Lead | null {
  let chosen: {
    stallId: string;
    lotId: string;
    name: string;
    ask: number;
    known: number;
    ratio: number;
    face: string;
  } | null = null;
  for (const def of STALLS) {
    if (!isOpen(def, state.eraIndex)) continue;
    const stall = state.stalls.find((row) => row.id === def.id);
    if (!stall) continue;
    const face = faceFor(def, state.eraIndex);
    for (const lot of stall.stock) {
      if (lot.acquired || lot.target <= 0 || lot.qty < 1) continue;
      const known = knownValue(lot.itemId, lot.condition);
      const ask = postedAsk(known, lot.markup, lot.floorPrice);
      if (ask > state.purse || ask < 1) continue;
      if (fairnessOfAsk(ask, known) !== "fair") continue;
      const ratio = known > 0 ? ask / known : 99;
      if (!chosen || ratio < chosen.ratio || (ratio === chosen.ratio && ask < chosen.ask)) {
        chosen = { stallId: def.id, lotId: lot.lotId, name: item(lot.itemId).name, ask, known, ratio, face: face.name };
      }
    }
  }
  if (!chosen) return null;
  return {
    id: `buy:${chosen.lotId}`,
    kicker: "Near county value",
    title: chosen.name,
    detail: `${chosen.face} asks ${marks(chosen.ask)}. County ${marks(chosen.known)}.`,
    fairness: "fair",
    action: "Review the ask",
    stallId: chosen.stallId,
    tab: "buy",
    intent: { kind: "buy", stallId: chosen.stallId, lotId: chosen.lotId, qty: 1 },
  };
}

function buildLeads(state: MarketState): Lead[] {
  const sale = bestSale(state);
  const works = readyWork(state);
  const buy = fairBuy(state);
  const leads: Lead[] = [];
  if (sale) leads.push(sale);
  if (works[0]) leads.push(works[0]);
  if (buy) leads.push(buy);
  else if (works[1]) leads.push(works[1]);
  for (const work of works) {
    if (leads.length >= 3) break;
    if (!leads.some((lead) => lead.id === work.id)) leads.push(work);
  }
  return leads.slice(0, 3);
}

function carriedDemand(state: MarketState, def: StallDef): string | null {
  if (!isOpen(def, state.eraIndex)) return null;
  for (const inst of state.pack) {
    if (isEssential(inst.itemId)) continue;
    const interest = matchInterest(def, inst.itemId, inst.condition);
    if (interest.id === "plain") continue;
    const sale = unitSale(state, def.id, inst, 1);
    if (sale.blocked) continue;
    if (sale.keepsake || interest.multiplier > def.defaultBuy.multiplier) return interest.demandLabel;
  }
  return null;
}

function loadState(): MarketState {
  if (typeof localStorage === "undefined") return createInitialState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as MarketState;
    if (parsed.v !== 1 || parsed.stalls?.length !== STALLS.length) return createInitialState();
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function MarketApp() {
  const [state, setState] = useState<MarketState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [stallId, setStallId] = useState("quill");
  const [tab, setTab] = useState<"buy" | "sell" | "work">("sell");
  const [selected, setSelected] = useState("p-spoon");
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState<Intent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [proof, setProof] = useState<SimCheck[] | null>(null);
  const [series, setSeries] = useState<number[] | null>(null);
  const [resetAsk, setResetAsk] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [line, setLine] = useState("The lake kept the name.");

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (selected && !state.pack.some((row) => row.instanceId === selected)) {
      setSelected(state.pack[0]?.instanceId ?? "");
    }
  }, [state.pack, selected]);

  const era = ERAS[state.eraIndex] ?? ERAS[0];
  const def = stallDef(stallId);
  const stall = state.stalls.find((row) => row.id === stallId) ?? state.stalls[0]!;
  const face = faceFor(def, state.eraIndex);
  const open = isOpen(def, state.eraIndex);
  const Icon = ICONS[def.id] ?? Scale;
  const demand = carriedDemand(state, def);
  const leads = buildLeads(state);
  const packCount = state.pack.reduce((sum, row) => sum + row.qty, 0);
  const pendingQuote = pending ? quote(state, pending) : null;
  const journal = journalOpen ? state.journal : state.journal.slice(0, 4);

  function stage(intent: Intent) {
    const seen = quote(state, intent);
    if (!seen.ok) {
      setNotice(seen.reason);
      setPending(null);
      return;
    }
    setNotice(null);
    setPending(intent);
  }

  function confirm() {
    if (!pending) return;
    const result = commit(state, pending);
    if (!result.ok) {
      setNotice(result.reason);
      setPending(null);
      return;
    }
    setState(result.state);
    setNotice(result.receipt);
    setPending(null);
  }

  function openLead(lead: Lead) {
    setStallId(lead.stallId);
    setTab(lead.tab);
    if (lead.select) {
      setSelected(lead.select);
      setQty(1);
    }
    if (lead.intent) stage(lead.intent);
    else setNotice(lead.notice ?? null);
  }

  const life = [
    ["Suppers", String(state.meals)],
    ["Shore craft", state.shoreCraft ? "Kept" : "Not yet"],
    ["Dry feet", state.dryFeet ? "Kept" : "Not yet"],
    ["Bell", state.recitals > 0 ? String(state.recitals) : "Not yet"],
    ["Dressings", state.dressings > 0 ? String(state.dressings) : "Not yet"],
    ["Broadsides", state.broadsides > 0 ? String(state.broadsides) : "Not yet"],
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-lake uppercase">Addison County</p>
            <h1 className="font-display text-2xl text-balance text-ink">County Book</h1>
          </div>
          <div className="rounded-lg border border-line bg-sheet px-3 py-2 text-right">
            <p className="text-xs text-muted">On the book</p>
            <p className="font-display text-2xl tabular-nums text-ink" data-testid="purse">
              {state.purse}
            </p>
            <p className="text-xs text-muted">{state.purse === 1 ? "mark" : "marks"}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-4 px-4 py-4">
        <div className="min-w-0">
          <ol className="flex items-center gap-2 overflow-x-auto" aria-label="Generations">
            {ERAS.map((entry, index) => (
              <li key={entry.id} className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${index === state.eraIndex ? "bg-lake text-on-lake" : index < state.eraIndex ? "text-ink" : "text-muted"}`}
                >
                  {entry.year}
                </span>
                {index < ERAS.length - 1 ? <span className="h-px w-4 bg-line" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-sm text-pretty">
            <span className="font-semibold">{era.year}</span>
            <span className="text-muted">
              {" "}
              · Season {state.season + 1} · {packCount} in the pack · {era.title}. {era.blurb}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg bg-lake px-3 text-sm font-semibold text-on-lake"
            onClick={() => stage({ kind: "season" })}
          >
            A season turns
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-line bg-sheet px-3 text-sm font-semibold"
            onClick={() => stage({ kind: "generation" })}
          >
            {state.eraIndex >= ERAS.length - 1 ? "Living county" : "Next generation"}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-muted"
            onClick={() => {
              setProof(runSimulations());
              setSeries(flipSeries(8));
            }}
          >
            Ledger proof
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-muted"
            onClick={() => setResetAsk(true)}
          >
            Start over
          </button>
        </div>

        <ul className="flex min-w-0 gap-2 overflow-x-auto" aria-label="What the years have kept">
          {life.map(([label, value]) => (
            <li key={label} className="shrink-0 rounded-full border border-line bg-sheet px-3 py-2 text-xs">
              <span className="text-muted">{label}</span> <span className="font-semibold tabular-nums">{value}</span>
            </li>
          ))}
        </ul>

        <section className="min-w-0" aria-label="This morning" data-testid="morning">
          <h2 className="font-display text-xl text-balance">This morning</h2>
          <p className="mt-1 max-w-2xl text-sm text-pretty text-muted">
            The best posted sale, work the pack can already finish, and a buy that sits near county value. Cancel writes
            nothing.
          </p>
          {leads.length === 0 ? (
            <p className="mt-3 text-sm text-pretty">Nothing posted beats keeping what you have. Walk a stall, or turn the season.</p>
          ) : (
            <div className="mt-3 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible">
              {leads.map((lead) => (
                <article
                  key={lead.id}
                  className="flex w-72 shrink-0 snap-start flex-col rounded-3xl border border-line bg-sheet p-4 md:w-auto"
                >
                  <p className="text-xs font-semibold tracking-widest text-lake uppercase">{lead.kicker}</p>
                  <h3 className="mt-1 font-display text-lg text-balance">{lead.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-pretty text-muted">{lead.detail}</p>
                  {lead.fairness ? (
                    <p className="mt-2">
                      <Chip fairness={lead.fairness} />
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="mt-3 min-h-11 rounded-lg bg-lake px-3 text-sm font-semibold text-on-lake"
                    onClick={() => openLead(lead)}
                  >
                    {lead.action}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {notice ? (
          <p className="rounded-lg border border-line bg-sheet px-4 py-3 text-sm text-pretty" role="status">
            {notice}
          </p>
        ) : null}

        <div className="grid min-w-0 items-start gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
          <nav className="flex min-w-0 gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Stalls">
            {STALLS.map((row) => {
              const rowFace = faceFor(row, state.eraIndex);
              const rowOpen = isOpen(row, state.eraIndex);
              const active = row.id === stallId;
              const wants = carriedDemand(state, row);
              const RowIcon = ICONS[row.id] ?? Scale;
              return (
                <button
                  key={row.id}
                  type="button"
                  data-testid={`stall-${row.id}`}
                  aria-pressed={active}
                  onClick={() => {
                    setStallId(row.id);
                    setNotice(null);
                  }}
                  className={`min-h-11 w-56 shrink-0 rounded-2xl border px-3 py-2 text-left md:w-full ${active ? "border-lake bg-lake text-on-lake" : "border-line bg-sheet text-ink"}`}
                >
                  <span className="flex items-center gap-2">
                    <RowIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="font-display text-base text-balance">{rowFace.name}</span>
                  </span>
                  <span className={`mt-0.5 block text-sm ${active ? "text-on-lake" : "text-muted"}`}>
                    {rowOpen ? rowFace.role : `Opens ${row.open.from}`}
                  </span>
                  {wants ? (
                    <span className={`mt-1 block text-xs font-semibold ${active ? "text-on-lake" : "text-lake"}`}>
                      Wants what you carry
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <main className="min-w-0" id="stall-desk">
            <article className="rounded-3xl border border-line bg-sheet p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-lake text-on-lake" aria-hidden="true">
                  <Icon className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl text-balance">{face.name}</h2>
                  <p className="text-sm text-muted">
                    {face.role} · {def.place}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Their book</p>
                  <p className="font-display text-xl tabular-nums">{stall.purse}</p>
                </div>
              </div>
              <p className="mt-3 text-pretty">
                {open
                  ? demand
                    ? face.seeing
                    : face.greet
                  : `${face.name} is not at the table in ${era.year}. The stall opens ${def.open.from}. The book they will keep is already written.`}
              </p>
              {demand && open ? (
                <p className="mt-2 text-sm text-pretty">Specialty on your pack: {demand}.</p>
              ) : null}
              {def.faces.length > 1 ? (
                <p className="mt-2 text-sm text-muted">
                  Succession: {def.faces.map((entry) => `${entry.name} (${entry.fromEra})`).join(" → ")}
                </p>
              ) : null}

              <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden" aria-label="Posted rates">
                {def.interests.map((interest) => (
                  <span key={interest.id} className="shrink-0 rounded-full border border-line px-3 py-2 text-xs font-semibold">
                    {Math.round(interest.multiplier * 100)}% · {interest.demandLabel}
                  </span>
                ))}
                <span className="shrink-0 rounded-full border border-line px-3 py-2 text-xs font-semibold">
                  Else {Math.round(def.defaultBuy.multiplier * 100)}%
                </span>
              </div>

              <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Trade">
                    {(
                      [
                        ["buy", "Buy"],
                        ["sell", "Sell"],
                        ["work", "Barter and work"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={tab === id}
                        className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${tab === id ? "bg-ink text-paper" : "border border-line"}`}
                        onClick={() => setTab(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {tab === "buy" ? (
                    <BuyList stallId={def.id} open={open} stock={stall.stock} purse={state.purse} stage={stage} />
                  ) : null}

                  {tab === "sell" ? (
                    <div className="mt-3" data-testid="pack">
                      <p className="text-sm text-pretty text-muted">
                        Every open stall names a price next to county value. The highest unblocked offer is marked.
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[...state.pack]
                          .map((inst) => {
                            const goods = item(inst.itemId);
                            const here = unitSale(state, def.id, inst, 1);
                            const best = compareOffers(state, inst.instanceId).find((offer) => offer.open && !offer.blocked);
                            return { inst, goods, here, best };
                          })
                          .sort((a, b) => {
                            const av = a.here.blocked ? -1 : a.here.offer;
                            const bv = b.here.blocked ? -1 : b.here.offer;
                            return bv - av;
                          })
                          .map(({ inst, goods, here, best }) => {
                            const active = selected === inst.instanceId;
                            const herePays = open && !here.blocked;
                            const subtitle = isEssential(inst.itemId)
                              ? "Protected"
                              : herePays
                                ? `${marks(here.offer)} here`
                                : best
                                  ? `${marks(best.offer)} at ${best.stallName}`
                                  : "No sale";
                            return (
                              <button
                                key={inst.instanceId}
                                type="button"
                                aria-pressed={active}
                                className={`min-h-11 rounded-lg border px-3 py-2 text-left ${active ? "border-lake bg-lake text-on-lake" : "border-line bg-paper"}`}
                                onClick={() => {
                                  setSelected(inst.instanceId);
                                  setQty(1);
                                }}
                              >
                                <span className="block text-sm font-semibold text-balance">
                                  {goods.name}
                                  {inst.qty > 1 ? ` ×${inst.qty}` : ""}
                                </span>
                                <span className={`mt-0.5 block text-xs tabular-nums ${active ? "text-on-lake" : "text-muted"}`}>
                                  {subtitle}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                      {selected ? (
                        <SellBoard state={state} instanceId={selected} qty={qty} setQty={setQty} stage={stage} />
                      ) : null}
                    </div>
                  ) : null}

                  {tab === "work" ? (
                    <WorkList
                      state={state}
                      def={def}
                      open={open}
                      line={line}
                      setLine={setLine}
                      stage={stage}
                    />
                  ) : null}
                </div>

                <RateCard state={state} def={def} />
              </div>

              {stall.vault.length > 0 ? (
                <p className="mt-4 text-sm text-pretty">
                  In their keeping, not for sale: {stall.vault.map((row) => item(row.itemId).name).join(", ")}.
                </p>
              ) : null}
              {stall.stock.some((lot) => lot.acquired && lot.qty > 0) ? (
                <p className="mt-2 text-sm text-pretty text-muted">
                  Bought from you, not back on the board:{" "}
                  {stall.stock
                    .filter((lot) => lot.acquired && lot.qty > 0)
                    .map((lot) => item(lot.itemId).name)
                    .join(", ")}
                  .
                </p>
              ) : null}
            </article>

            <section className="mt-4 rounded-3xl border border-line bg-sheet p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg">The book</h2>
                {state.journal.length > 4 ? (
                  <button
                    type="button"
                    className="min-h-11 text-sm font-semibold text-lake"
                    onClick={() => setJournalOpen((openJournal) => !openJournal)}
                  >
                    {journalOpen ? "Latest only" : `All ${state.journal.length} lines`}
                  </button>
                ) : null}
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {journal.map((entry) => (
                  <li key={entry.id} className="text-sm text-pretty">
                    <span className="text-muted">{entry.era} · </span>
                    {entry.text}
                  </li>
                ))}
              </ul>
            </section>
          </main>
        </div>
      </div>

      <Dialog.Root open={pending != null} onOpenChange={(next) => !next && setPending(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="book-overlay fixed inset-0 bg-ink/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 max-h-[85vh] w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-line bg-sheet p-4 text-ink">
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="font-display text-xl text-balance">{pendingQuote?.title ?? "Review"}</Dialog.Title>
              <Dialog.Close className="flex size-11 items-center justify-center rounded-lg border border-line" aria-label="Cancel">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-2 text-sm text-pretty text-muted">{pendingQuote?.reason}</Dialog.Description>
            {pendingQuote?.detail && pendingQuote.detail !== pendingQuote.reason ? (
              <p className="mt-2 text-sm text-pretty">{pendingQuote.detail}</p>
            ) : null}
            {pendingQuote ? (
              pendingQuote.playerDelta !== 0 ? (
                <p className="mt-3 font-semibold tabular-nums">
                  {pendingQuote.playerDelta < 0
                    ? `You pay ${marks(pendingQuote.playerDelta)}`
                    : `You receive ${marks(pendingQuote.playerDelta)}`}
                  {pendingQuote.known != null ? ` · County ${marks(pendingQuote.known)}` : ""}
                </p>
              ) : (
                <p className="mt-3 text-sm text-pretty">
                  No marks move.
                  {pendingQuote.known != null
                    ? ` County value of what changes hands: ${marks(pendingQuote.known)}.`
                    : ""}
                </p>
              )
            ) : null}
            {pendingQuote?.fairness ? (
              <p className="mt-2">
                <Chip fairness={pendingQuote.fairness} />
              </p>
            ) : null}
            {pendingQuote?.warnings.length ? (
              <ul className="mt-3 flex flex-col gap-2">
                {pendingQuote.warnings.map((warning) => (
                  <li key={warning} className="text-sm text-pretty">
                    {warning}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="confirm"
                className="min-h-11 rounded-lg bg-lake px-4 text-sm font-semibold text-on-lake"
                onClick={confirm}
              >
                Write it in the book
              </button>
              <button
                type="button"
                data-testid="cancel"
                className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold"
                onClick={() => setPending(null)}
              >
                Leave it
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={resetAsk} onOpenChange={setResetAsk}>
        <Dialog.Portal>
          <Dialog.Overlay className="book-overlay fixed inset-0 bg-ink/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-sheet p-4 text-ink">
            <Dialog.Title className="font-display text-xl">Start the book over?</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-pretty text-muted">
              The pack, the stalls, and the year return to 1774. This does not invent a new currency.
            </Dialog.Description>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-paper"
                onClick={() => {
                  const fresh = createInitialState();
                  setState(fresh);
                  setStallId("quill");
                  setSelected("p-spoon");
                  setTab("sell");
                  setNotice("The book is open again at 1774.");
                  setJournalOpen(false);
                  setResetAsk(false);
                }}
              >
                Start over
              </button>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold"
                onClick={() => setResetAsk(false)}
              >
                Keep this year
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={proof != null} onOpenChange={(next) => !next && setProof(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="book-overlay fixed inset-0 bg-ink/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 max-h-[85vh] w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-line bg-sheet p-4 text-ink">
            <div className="flex items-start justify-between gap-3">
              <Dialog.Title className="font-display text-xl">Ledger proof</Dialog.Title>
              <Dialog.Close className="flex size-11 items-center justify-center rounded-lg border border-line" aria-label="Close">
                <X className="size-5" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-2 text-sm text-pretty text-muted">
              These checks run on a fresh book, not on your trades. A green ledger is not the same thing as a good afternoon
              at the stall.
            </Dialog.Description>
            {series ? (
              <div className="mt-4">
                <p className="text-sm font-semibold">Salt, bought and sold back</p>
                <div className="mt-2 flex items-end gap-1" aria-hidden="true">
                  {series.map((value, index) => (
                    <span
                      key={`${value}-${index}`}
                      className="w-3 rounded-sm bg-lake"
                      style={{ height: `${Math.max(8, value)}px` }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs tabular-nums text-muted">{series.join(" → ")}</p>
              </div>
            ) : null}
            <ul className="mt-4 flex flex-col gap-2">
              {(proof ?? []).map((row) => (
                <li key={row.id} className="rounded-lg border border-line px-3 py-2">
                  <p className="text-sm font-semibold">
                    {row.pass ? "Held" : "Failed"} · {row.name}
                  </p>
                  <p className="text-sm text-pretty text-muted">{row.detail}</p>
                </li>
              ))}
            </ul>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function RateCard({ state, def }: { state: MarketState; def: StallDef }) {
  return (
    <aside className="rounded-2xl border border-line p-3 lg:sticky lg:top-20">
      <h3 className="font-display text-lg">What they pay</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {def.interests.map((interest) => {
          const used = state.seasonUses[`${def.id}:${interest.id}`] ?? 0;
          const left = interest.seasonLimit != null ? Math.max(0, interest.seasonLimit - used) : null;
          return (
            <li key={interest.id} className="rounded-lg border border-line px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{interest.demandLabel}</p>
                <Chip fairness={fairnessOfSale(interest.multiplier, 1)} />
              </div>
              <p className="text-sm text-pretty text-muted">
                {Math.round(interest.multiplier * 100)}% of county value.
                {left != null ? ` ${left} left this season.` : ""}
                {interest.keepsake ? " They keep it. It is not put back on the board." : ""} {interest.reason}
              </p>
            </li>
          );
        })}
        <li className="rounded-lg border border-line px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">Anything else</p>
            <Chip fairness={fairnessOfSale(def.defaultBuy.multiplier, 1)} />
          </div>
          <p className="text-sm text-pretty text-muted">
            {Math.round(def.defaultBuy.multiplier * 100)}% of county value. {def.defaultBuy.reason}
          </p>
        </li>
      </ul>
    </aside>
  );
}

function BuyList({
  stallId,
  open,
  stock,
  purse,
  stage,
}: {
  stallId: string;
  open: boolean;
  stock: Lot[];
  purse: number;
  stage: (intent: Intent) => void;
}) {
  const lots = stock.filter((lot) => !lot.acquired && lot.target > 0);
  if (lots.length === 0) {
    return <p className="mt-3 text-sm text-pretty">Nothing on the board until the season refills it.</p>;
  }
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {lots.map((lot) => (
        <BuyRow key={lot.lotId} stallId={stallId} open={open} lot={lot} purse={purse} stage={stage} />
      ))}
    </ul>
  );
}

function BuyRow({
  stallId,
  open,
  lot,
  purse,
  stage,
}: {
  stallId: string;
  open: boolean;
  lot: Lot;
  purse: number;
  stage: (intent: Intent) => void;
}) {
  const goods = item(lot.itemId);
  const max = goods.stackable ? lot.qty : 1;
  const [qty, setQty] = useState(1);
  const safeQty = Math.max(1, Math.min(max, qty));
  const known = knownValue(lot.itemId, lot.condition);
  const ask = postedAsk(known, lot.markup, lot.floorPrice);
  const total = ask * safeQty;
  const fairness = fairnessOfAsk(ask, known);
  const short = Math.max(0, total - purse);
  return (
    <li className="rounded-lg border border-line px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{goods.name}</p>
        <Chip fairness={fairness} />
      </div>
      <p className="text-sm text-muted">
        Their ask <span className="tabular-nums text-ink">{marks(ask)}</span>
        {" · "}County <span className="tabular-nums text-ink">{marks(known)}</span>
        {" · "}
        {lot.qty} on the board
        {short > 0 ? ` · Short ${marks(short)}` : ""}
      </p>
      <p className="text-sm text-pretty text-muted">{goods.about}</p>
      <Meter offer={ask} known={known} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {max > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold"
              onClick={() => setQty(Math.max(1, safeQty - 1))}
            >
              Less
            </button>
            <span className="min-w-6 text-center text-sm tabular-nums">{safeQty}</span>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold"
              onClick={() => setQty(Math.min(max, safeQty + 1))}
            >
              More
            </button>
          </div>
        ) : null}
        <button
          type="button"
          disabled={!open || lot.qty < 1}
          className="min-h-11 rounded-lg bg-lake px-3 text-sm font-semibold text-on-lake disabled:opacity-40"
          onClick={() => stage({ kind: "buy", stallId, lotId: lot.lotId, qty: safeQty })}
        >
          {lot.qty < 1 ? "Out until next season" : `Review ${marks(total)}`}
        </button>
      </div>
    </li>
  );
}

function WorkList({
  state,
  def,
  open,
  line,
  setLine,
  stage,
}: {
  state: MarketState;
  def: StallDef;
  open: boolean;
  line: string;
  setLine: (line: string) => void;
  stage: (intent: Intent) => void;
}) {
  const rows = workRows(state, def);
  const ready = rows.filter((row) => !row.done && row.missing.length === 0 && row.fee <= state.purse);
  const waiting = rows.filter((row) => !ready.includes(row));
  return (
    <div className="mt-3 flex flex-col gap-3">
      {ready.length > 0 && waiting.length > 0 ? <h3 className="font-display text-lg">Ready now</h3> : null}
      {ready.map((row) => (
        <WorkCard key={row.id} row={row} open={open} line={line} setLine={setLine} stage={stage} stallId={def.id} />
      ))}
      {waiting.length > 0 ? (
        <h3 className="font-display text-lg">{ready.length > 0 ? "Not yet" : "On the card"}</h3>
      ) : null}
      {waiting.map((row) => (
        <WorkCard key={row.id} row={row} open={open} line={line} setLine={setLine} stage={stage} stallId={def.id} />
      ))}
      <details className="rounded-lg border border-line px-3 py-2">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold">How this stall refills</summary>
        <p className="pb-2 text-sm text-pretty text-muted">{def.replenish}</p>
      </details>
    </div>
  );
}

function WorkCard({
  row,
  open,
  line,
  setLine,
  stage,
  stallId,
}: {
  row: WorkRow;
  open: boolean;
  line: string;
  setLine: (line: string) => void;
  stage: (intent: Intent) => void;
  stallId: string;
}) {
  const blocked = !open || row.done || row.missing.length > 0;
  return (
    <section className="rounded-lg border border-line px-3 py-3">
      <h3 className="font-display text-lg">{row.name}</h3>
      <p className="text-sm text-pretty text-muted">{row.detail}</p>
      {row.fee > 0 ? <p className="mt-1 text-sm tabular-nums">Fee {marks(row.fee)}</p> : null}
      {row.done ? <p className="mt-2 text-sm">Already done this season. The price does not change. It waits.</p> : null}
      {row.missing.length > 0 ? <p className="mt-2 text-sm">Still needed: {row.missing.join("; ")}.</p> : null}
      {!row.done && row.missing.length === 0 ? <p className="mt-2 text-sm">The pack can cover this.</p> : null}
      {row.needsLine && row.lines ? (
        <div className="mt-2 flex flex-col gap-2">
          {row.lines.map((entry) => (
            <button
              key={entry}
              type="button"
              aria-pressed={line === entry}
              className={`min-h-11 rounded-lg border px-3 text-left text-sm ${line === entry ? "border-lake" : "border-line"}`}
              onClick={() => setLine(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        disabled={blocked}
        className="mt-2 min-h-11 rounded-lg bg-lake px-3 text-sm font-semibold text-on-lake disabled:opacity-40"
        onClick={() =>
          stage(
            row.kind === "barter"
              ? { kind: "barter", stallId, offerId: row.id, picks: row.picks }
              : { kind: "service", stallId, serviceId: row.id, picks: row.picks, line: row.needsLine ? line : undefined },
          )
        }
      >
        {row.kind === "barter" ? "Review barter" : "Review the work"}
      </button>
    </section>
  );
}

function SellBoard({
  state,
  instanceId,
  qty,
  setQty,
  stage,
}: {
  state: MarketState;
  instanceId: string;
  qty: number;
  setQty: (qty: number) => void;
  stage: (intent: Intent) => void;
}) {
  const inst = state.pack.find((row) => row.instanceId === instanceId);
  if (!inst) return null;
  const goods = item(inst.itemId);
  const compared = compareOffers(state, instanceId);
  const offers = compared.filter((offer) => offer.open);
  const later = compared.filter((offer) => !offer.open);
  const bestId = offers.find((offer) => !offer.blocked)?.stallId;
  const count = goods.stackable ? Math.max(1, Math.min(inst.qty, qty || 1)) : 1;
  return (
    <div className="mt-3 rounded-2xl border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg">Offers for {goods.name}</h3>
        {inst.qty > 1 ? (
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-line px-3 font-semibold"
              onClick={() => setQty(Math.max(1, Math.min(inst.qty, qty - 1)))}
            >
              Less
            </button>
            <span className="min-w-6 text-center tabular-nums">{Math.max(1, Math.min(inst.qty, qty))}</span>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-line px-3 font-semibold"
              onClick={() => setQty(Math.max(1, Math.min(inst.qty, qty + 1)))}
            >
              More
            </button>
          </div>
        ) : null}
      </div>
      <p className="text-sm text-pretty text-muted">
        County {marks(knownValue(inst.itemId, inst.condition))}
        {inst.condition !== "sound" ? ` · ${inst.condition}` : ""}. {goods.about}
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {offers.map((offer) => {
          const book = state.stalls.find((row) => row.id === offer.stallId)?.purse ?? 0;
          const total = offer.offer * count;
          const knownTotal = offer.known * count;
          return (
            <li
              key={offer.stallId}
              className={`rounded-lg border px-3 py-2 ${offer.stallId === bestId ? "border-lake" : "border-line"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{offer.stallName}</p>
                {offer.blocked ? (
                  goods.significance === "essential" ? (
                    <Chip fairness="protected" />
                  ) : null
                ) : (
                  <Chip fairness={offer.fairness} />
                )}
                {offer.stallId === bestId ? <span className="text-xs font-semibold text-lake">Best posted</span> : null}
              </div>
              <p className="text-sm tabular-nums">
                {offer.blocked ? "No sale" : marks(total)}
                {" · "}County {marks(knownTotal)}
                {" · "}Their book {marks(book)}
              </p>
              {!offer.blocked ? <Meter offer={offer.offer} known={offer.known} /> : null}
              <p className="mt-1 text-sm text-pretty text-muted">{offer.blocked ?? offer.reason}</p>
              <button
                type="button"
                disabled={Boolean(offer.blocked)}
                className="mt-2 min-h-11 rounded-lg bg-lake px-3 text-sm font-semibold text-on-lake disabled:opacity-40"
                onClick={() =>
                  stage({
                    kind: "sell",
                    stallId: offer.stallId,
                    instanceId,
                    qty: count,
                  })
                }
              >
                Review this offer
              </button>
            </li>
          );
        })}
      </ul>
      {later.length > 0 ? (
        <p className="mt-2 text-sm text-pretty text-muted">
          Other stalls are shut this year. Their offers show up when the generation turns.
        </p>
      ) : null}
      {goods.tags.includes("food") ? (
        <button
          type="button"
          className="mt-3 min-h-11 rounded-lg border border-line px-3 text-sm font-semibold"
          onClick={() => stage({ kind: "eat", instanceId })}
        >
          Eat one instead
        </button>
      ) : null}
    </div>
  );
}
