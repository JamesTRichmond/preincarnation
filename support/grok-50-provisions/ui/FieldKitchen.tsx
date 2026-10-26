import { useEffect, useMemo, useRef, useState } from "react";
import { Backpack, BookOpen, CookingPot, Fish, Leaf, ScrollText } from "lucide-react";
import { DISHES, NODES, PROVISION_BY_ID, PROVISIONS, WATERS } from "../catalog.ts";
import {
  available,
  castLine,
  cook,
  destinationsOf,
  die,
  digGrave,
  gather,
  hydrate,
  initialState,
  inSeason,
  pid,
  previewCook,
  selectBait,
  serialize,
  setFocus,
  setSeason,
  setWater,
  slotCap,
  tradeStack,
  useField as fieldUse,
  qtyOf,
} from "../engine.ts";
import { runValidation } from "../validate.ts";
import type { Bin, Dish, KitFlags, KitState, Provision, Rig, Season, SourceNode, Stack, StepResult } from "../types.ts";
import { SEASONS } from "../types.ts";

const SAVE_KEY = "preincarnation.provisions.v1";

const TABS = [
  { id: "gather", label: "Gather", icon: Leaf },
  { id: "kit", label: "Kit", icon: Backpack },
  { id: "stove", label: "Stove", icon: CookingPot },
  { id: "rod", label: "Rod", icon: Fish },
  { id: "codex", label: "Codex", icon: BookOpen },
  { id: "ledger", label: "Ledger", icon: ScrollText },
] as const;

type Tab = (typeof TABS)[number]["id"];
type Scope = "all" | "demo" | "rare";

const SEASON_LINE: Record<Season, string> = {
  sugaring: "Sap, snow, and the sugarhouse.",
  spring: "Fiddleheads, ramps, and wet worms.",
  summer: "Berries, the creek, and long grass.",
  autumn: "Fungi, orchards, and the first snares.",
  deer: "The hunt is open. The pot still waits.",
  ice: "The cellar earns its keep.",
};

const RIG_LINE: Record<Rig, string> = {
  current: "Current water wants a hook, line, and split shot.",
  still: "Still water wants a hook, line, and a bobber.",
  champlain: "Big water wants a hook and a line.",
};

const BIN_META: Record<Bin, { title: string; note: string }> = {
  pouch: { title: "Pouch", note: "On you. A fall leaves it in the grave." },
  creel: { title: "Creel", note: "The catch. A fall leaves it in the grave." },
  cellar: { title: "Cellar", note: "Stays when the year jumps." },
  tin: { title: "Tin", note: "Stays. It is the small one." },
};

const MARKS: { key: keyof KitFlags; label: string }[] = [
  { key: "palate", label: "Palate" },
  { key: "veinEar", label: "Vein ear" },
  { key: "cacheGlow", label: "Cache glow" },
  { key: "oldOrchard", label: "Old orchard" },
  { key: "soloverse", label: "Soloverse" },
  { key: "studiedJack", label: "Jack studied" },
];

type Act = {
  key: string;
  title: string;
  detail: string;
  label: string;
  tone: "maple" | "creek" | "paper";
  kind: "cook" | "walk" | "cast" | "bait" | "stove" | "kit";
  dishId?: string;
  place?: string;
  baitId?: string;
};

function dishGaps(kit: KitState, dish: Dish) {
  return dish.needs.flatMap((need) => {
    const have = qtyOf(kit, need.provisionId, need.cured ? true : undefined);
    if (have >= need.qty) return [];
    return [{ provisionId: need.provisionId, missing: need.qty - have, cured: Boolean(need.cured) }];
  });
}

function nodeFor(kit: KitState, provisionId: string): SourceNode | undefined {
  let best: SourceNode | undefined;
  let bestLeft = 0;
  for (const node of NODES) {
    if (node.provisionId !== provisionId) continue;
    if (node.hiddenUntil === "cacheGlow" && !kit.flags.cacheGlow) continue;
    if (!inSeason(node, kit.season)) continue;
    const left = available(node, kit);
    if (left > bestLeft) {
      best = node;
      bestLeft = left;
    }
  }
  return best;
}

function rigReady(kit: KitState) {
  const water = WATERS.find((w) => w.id === kit.waterId);
  if (!water) return false;
  if (qtyOf(kit, pid(109)) < 1 || qtyOf(kit, pid(111)) < 1) return false;
  if (water.rig === "current" && qtyOf(kit, pid(110)) < 1) return false;
  if (water.rig === "still" && qtyOf(kit, pid(112)) < 1 && !kit.flags.lashedBobber) return false;
  return true;
}

function wordCount(n: number) {
  return n === 1 ? "one" : String(n);
}

function actsFor(kit: KitState): Act[] {
  const stove = DISHES.filter((d) => d.stove);
  const ready = stove.filter((d) => previewCook(kit, d.id).ok);
  const preferred = ready.find((d) => d.id === "cook.dish.001") ?? ready[0];
  const acts: Act[] = [];
  if (preferred) {
    const gift = preferred.effects.map((e) => e.name).join(" and ");
    acts.push({
      key: `cook-${preferred.id}`,
      title: preferred.name,
      detail: gift ? `${preferred.blurb} It grants ${gift}.` : preferred.blurb,
      label: "Cook",
      tone: "maple",
      kind: "cook",
      dishId: preferred.id,
    });
  }

  const close = stove
    .filter((d) => !ready.includes(d))
    .map((dish) => ({ dish, gaps: dishGaps(kit, dish) }))
    .filter((row) => row.gaps.length === 1)
    .sort((a, b) => {
      const cover = (row: (typeof close)[number]) => {
        const gap = row.gaps[0];
        if (gap.cured) return 1;
        const node = nodeFor(kit, gap.provisionId);
        if (!node || available(node, kit) < gap.missing) return 2;
        return 0;
      };
      return cover(a) - cover(b) || a.gaps[0].missing - b.gaps[0].missing || a.dish.n - b.dish.n;
    });

  const best = close[0];
  if (best && acts.length < 2) {
    const gap = best.gaps[0];
    const name = PROVISION_BY_ID[gap.provisionId]?.name ?? "the missing piece";
    if (gap.cured) {
      acts.push({
        key: `cure-${best.dish.id}`,
        title: best.dish.name,
        detail: `Short ${wordCount(gap.missing)} cured ${name}. Curing marks one cut. The rest of the bin stays as it was.`,
        label: "Open the kit",
        tone: "paper",
        kind: "kit",
      });
    } else {
      const node = nodeFor(kit, gap.provisionId);
      if (node && available(node, kit) >= gap.missing) {
        acts.push({
          key: `walk-${best.dish.id}`,
          title: best.dish.name,
          detail: `Short ${wordCount(gap.missing)} ${name}. ${node.place} has ${available(node, kit)} left this life.`,
          label: "Walk there",
          tone: "creek",
          kind: "walk",
          place: node.place,
        });
      }
    }
  }

  const water = WATERS.find((w) => w.id === kit.waterId);
  if (water && rigReady(kit) && acts.length < 2) {
    const bait = kit.baitId ? PROVISION_BY_ID[kit.baitId] : undefined;
    if (bait && qtyOf(kit, bait.id) > 0) {
      acts.push({
        key: "cast",
        title: water.name,
        detail: `${bait.name} is on the hook. A cast spends one, and only if the rig matches this water.`,
        label: "Cast",
        tone: "creek",
        kind: "cast",
      });
    } else {
      const owned = PROVISIONS.find((p) => p.bait && qtyOf(kit, p.id) > 0);
      if (owned) {
        acts.push({
          key: `bait-${owned.id}`,
          title: "Bait the hook",
          detail: `${owned.name} is already in the kit. Choosing it does not spend it.`,
          label: `Use ${owned.name}`,
          tone: "paper",
          kind: "bait",
          baitId: owned.id,
        });
      } else {
        const worms = nodeFor(kit, pid(94));
        if (worms) {
          acts.push({
            key: "worms",
            title: "Nightcrawlers",
            detail: `${worms.place}. The tackle for ${water.name} is already packed.`,
            label: "Walk there",
            tone: "creek",
            kind: "walk",
            place: worms.place,
          });
        }
      }
    }
  }

  if (!acts.length) {
    acts.push({
      key: "rest",
      title: "The pot can wait",
      detail: "Change the season, or open the book. Hunting and the creek stay optional.",
      label: "Open the book",
      tone: "paper",
      kind: "stove",
    });
  }
  return acts;
}

function toneClass(tone: Act["tone"]) {
  if (tone === "maple") return "bg-maple text-maple-ink";
  if (tone === "creek") return "bg-creek text-creek-ink";
  return "bg-paper text-ink";
}

export function FieldKitchen() {
  const [kit, setKit] = useState<KitState>(initialState);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("gather");
  const [notice, setNotice] = useState("The camp is stocked. Hunting, fishing, and the pot are optional.");
  const [armed, setArmed] = useState(false);
  const [seasonOnly, setSeasonOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [picked, setPicked] = useState<string>(PROVISIONS[16].id);
  const [openBook, setOpenBook] = useState(false);
  const [openFar, setOpenFar] = useState(false);
  const [place, setPlace] = useState("New Haven riverbank");
  const touched = useRef(false);

  useEffect(() => {
    if (!touched.current) {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const loaded = hydrate(raw);
        if (loaded.ok) {
          setKit(loaded.state);
          if (loaded.state.log[0]) setNotice(loaded.state.log[0]);
        }
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SAVE_KEY, serialize(kit));
  }, [kit, ready]);

  const checks = useMemo(() => runValidation(), []);
  const item = PROVISION_BY_ID[picked];
  const acts = useMemo(() => actsFor(kit), [kit]);
  const seasonNodes = useMemo(
    () =>
      NODES.filter((node) => {
        if (node.hiddenUntil === "cacheGlow" && !kit.flags.cacheGlow) return false;
        if (seasonOnly && !inSeason(node, kit.season)) return false;
        return true;
      }),
    [kit, seasonOnly],
  );
  const placeNames = useMemo(() => [...new Set(seasonNodes.map((n) => n.place))], [seasonNodes]);

  useEffect(() => {
    if (placeNames.length && !placeNames.includes(place)) setPlace(placeNames[0]);
  }, [placeNames, place]);

  function apply(result: StepResult) {
    touched.current = true;
    setKit(result.state);
    setNotice(result.note);
  }

  function commit(next: KitState, line: string) {
    touched.current = true;
    setKit(next);
    setNotice(line);
  }

  function walk(nextPlace: string) {
    touched.current = true;
    setPlace(nextPlace);
    setSeasonOnly(true);
    setTab("gather");
    setNotice(`Walking ${nextPlace}.`);
  }

  function run(act: Act) {
    if (act.kind === "cook" && act.dishId) apply(cook(kit, act.dishId));
    if (act.kind === "walk" && act.place) walk(act.place);
    if (act.kind === "cast") apply(castLine(kit));
    if (act.kind === "bait" && act.baitId) apply(selectBait(kit, act.baitId));
    if (act.kind === "stove") setTab("stove");
    if (act.kind === "kit") setTab("kit");
  }

  const marks = MARKS.filter((mark) => kit.flags[mark.key]);
  const water = WATERS.find((w) => w.id === kit.waterId);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-brass uppercase">Addison County</p>
          <h1 className="font-display text-3xl leading-tight text-ink">Field kitchen</h1>
        </div>
        <dl className="flex gap-6">
          <Stat k="Year" v={String(kit.year)} />
          <Stat k="Life" v={String(kit.life + 1)} />
          <Stat k="Barter" v={String(kit.barter)} />
        </dl>
      </header>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Season">
        {SEASONS.map((season) => (
          <button
            key={season}
            type="button"
            className={`min-h-11 rounded-full px-3 text-sm capitalize ${kit.season === season ? "bg-creek text-creek-ink" : "bg-paper-2 text-ink"}`}
            onClick={() => commit(setSeason(kit, season), `The dial says ${season}.`)}
          >
            {season}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">{SEASON_LINE[kit.season]}</p>

      {(kit.effects.length > 0 || marks.length > 0) && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {kit.effects.map((effect) => (
            <li key={effect.id} className="rounded-full bg-paper-2 px-3 py-1 text-sm text-ink">
              {effect.name} {effect.magnitude}
              {effect.stacks > 1 ? ` ×${effect.stacks}` : ""}
            </li>
          ))}
          {marks.map((mark) => (
            <li key={mark.key} className="rounded-full bg-paper-2 px-3 py-1 text-sm text-brass">
              {mark.label}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-5 rounded-3xl bg-paper-2 p-4 shadow-card">
        <ul className="grid gap-4">
          {acts.map((act, index) => (
            <li key={act.key} className={index === 0 ? "" : "border-t border-line pt-4"}>
              <p className="text-xs tracking-widest text-brass uppercase">{index === 0 ? "Next" : "Or"}</p>
              <h2 className="font-display text-xl text-ink">{act.title}</h2>
              <p className="mt-1 max-w-prose text-sm text-muted">{act.detail}</p>
              <button type="button" className={`mt-3 min-h-11 rounded-lg px-4 text-sm ${toneClass(act.tone)}`} onClick={() => run(act)}>
                {act.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 min-h-11 text-sm text-ink" aria-live="polite">
        {notice}
      </p>

      <div className="grid grid-cols-3 gap-2 sm:flex" role="tablist">
        {TABS.map((entry) => {
          const Icon = entry.icon;
          const on = tab === entry.id;
          const extra = entry.id === "kit" && kit.graves.length > 0 ? ` ${kit.graves.length}` : "";
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={on}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm ${on ? "bg-maple text-maple-ink" : "bg-paper-2 text-ink"}`}
              onClick={() => setTab(entry.id)}
            >
              <Icon size={16} aria-hidden />
              {entry.label}
              {extra}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tab === "gather" && (
          <Gather
            kit={kit}
            place={place}
            places={placeNames}
            nodes={seasonNodes.filter((node) => node.place === place)}
            seasonOnly={seasonOnly}
            onPlace={setPlace}
            onToggle={() => setSeasonOnly((v) => !v)}
            onPick={(id) => {
              apply(gather(kit, id));
              const node = NODES.find((n) => n.id === id);
              if (node) setPicked(node.provisionId);
            }}
            onFocus={() => commit(setFocus(kit, place), `Snares marked at ${place}.`)}
          />
        )}
        {tab === "kit" && (
          <Kit
            kit={kit}
            onUse={(id, intent) => apply(fieldUse(kit, id, intent, kit.focusPlace))}
            onTrade={(bin, index) => apply(tradeStack(kit, bin, index, 1))}
            onDig={(index) => apply(digGrave(kit, index))}
            onSelect={(id) => {
              setPicked(id);
              setTab("codex");
            }}
          />
        )}
        {tab === "stove" && (
          <Stove
            kit={kit}
            openBook={openBook}
            openFar={openFar}
            onOpenBook={() => setOpenBook((v) => !v)}
            onOpenFar={() => setOpenFar((v) => !v)}
            onCook={(id) => apply(cook(kit, id))}
            onWalk={walk}
          />
        )}
        {tab === "rod" && water && (
          <Rod
            kit={kit}
            onWater={(id) => {
              const next = WATERS.find((w) => w.id === id);
              commit(setWater(kit, id), next ? `${next.name}.` : "Water changed.");
            }}
            onApply={apply}
            onWalk={walk}
          />
        )}
        {tab === "codex" && (
          <Codex
            query={query}
            scope={scope}
            onQuery={setQuery}
            onScope={setScope}
            picked={picked}
            onPick={setPicked}
            item={item}
          />
        )}
        {tab === "ledger" && <Ledger checks={checks} />}
      </div>

      <details className="mt-6">
        <summary className="min-h-11 text-sm text-brass">Camp notes</summary>
        <ul className="mt-2 grid gap-1 text-sm text-muted">
          {kit.log.slice(0, 6).map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      </details>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-muted">
        <p className="max-w-sm">
          Plates stay cook.dish. Loot stays loot.provision. A fall is fourteen years. Pouch and creel go in the ground.
        </p>
        <div className="flex gap-2">
          {armed ? (
            <button
              type="button"
              className="min-h-11 rounded-lg bg-maple px-3 text-maple-ink"
              onClick={() => {
                touched.current = true;
                setKit(die(kit, "Middlebury Green"));
                setArmed(false);
                setNotice("Fourteen years. The cellar and the tin stayed.");
                setTab("kit");
              }}
            >
              Confirm the fall
            </button>
          ) : (
            <button type="button" className="min-h-11 rounded-lg bg-paper-2 px-3 text-ink" onClick={() => setArmed(true)}>
              Fall
            </button>
          )}
          <button
            type="button"
            className="min-h-11 rounded-lg bg-paper-2 px-3 text-ink"
            onClick={() => {
              touched.current = true;
              localStorage.removeItem(SAVE_KEY);
              setKit(initialState());
              setNotice("Camp reset.");
              setArmed(false);
              setTab("gather");
              setPlace("New Haven riverbank");
              setSeasonOnly(true);
            }}
          >
            Reset camp
          </button>
        </div>
      </footer>
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-right">
      <dt className="text-xs tracking-widest text-brass uppercase">{k}</dt>
      <dd className="font-display text-xl tabular-nums text-ink">{v}</dd>
    </div>
  );
}

function Gather({
  kit,
  place,
  places,
  nodes,
  seasonOnly,
  onPlace,
  onToggle,
  onPick,
  onFocus,
}: {
  kit: KitState;
  place: string;
  places: string[];
  nodes: SourceNode[];
  seasonOnly: boolean;
  onPlace: (place: string) => void;
  onToggle: () => void;
  onPick: (id: string) => void;
  onFocus: () => void;
}) {
  const wanted = new Set<string>();
  for (const dish of DISHES) {
    if (!dish.stove || previewCook(kit, dish.id).ok) continue;
    const gaps = dishGaps(kit, dish);
    if (gaps.length !== 1 || gaps[0].cured) continue;
    const node = nodeFor(kit, gaps[0].provisionId);
    if (node && places.includes(node.place)) wanted.add(node.place);
  }
  const worms = nodeFor(kit, pid(94));
  if (worms && places.includes(worms.place)) wanted.add(worms.place);
  const featured = [...wanted].slice(0, 6);

  return (
    <section className="min-w-0 rounded-3xl bg-paper-2 p-4 shadow-card">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl">Ground</h2>
        <button type="button" className="min-h-11 rounded-lg bg-paper px-3 text-sm" onClick={onToggle}>
          {seasonOnly ? "Whole year" : "This season"}
        </button>
      </div>
      <label className="mt-3 block text-sm text-muted">
        Where
        <select
          className="mt-1 min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-ink"
          value={places.includes(place) ? place : ""}
          aria-label="Choose ground"
          onChange={(event) => onPlace(event.target.value)}
        >
          {places.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {featured.length > 0 && (
        <div className="mt-3 flex max-w-full gap-2 overflow-x-auto">
          {featured.map((name) => (
            <button
              key={name}
              type="button"
              className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${name === place ? "bg-creek text-creek-ink" : "bg-paper text-ink"}`}
              onClick={() => onPlace(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-4 grid gap-2">
        {nodes.length === 0 ? <li className="text-sm text-muted">Nothing on this ground for the dial you set.</li> : null}
        {nodes.map((node) => {
          const prov = PROVISION_BY_ID[node.provisionId];
          const left = available(node, kit);
          const open = left > 0 && inSeason(node, kit.season);
          return (
            <li key={node.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-3 py-2">
              <div>
                <p className="text-ink">
                  {prov?.name}
                  {prov?.demo ? <span className="ml-2 text-xs text-brass">Demo</span> : null}
                </p>
                <p className="text-xs text-muted">
                  {prov?.method} · {left} left · {prov?.naturalHistory}
                </p>
              </div>
              <button
                type="button"
                className="min-h-11 shrink-0 rounded-lg bg-creek px-3 text-sm text-creek-ink disabled:opacity-40"
                disabled={!open}
                onClick={() => onPick(node.id)}
              >
                {open ? "Pick" : left <= 0 ? "Gone" : "Out of season"}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {kit.focusPlace === place ? "Snares are watching this ground." : `Snares are still at ${kit.focusPlace}.`} Autumn, deer, and ice.
        </p>
        <button type="button" className="min-h-11 rounded-lg bg-paper px-3 text-sm" onClick={onFocus}>
          {kit.focusPlace === place ? "Snares set" : "Set snares here"}
        </button>
      </div>
    </section>
  );
}

function Kit({
  kit,
  onUse,
  onTrade,
  onDig,
  onSelect,
}: {
  kit: KitState;
  onUse: (id: string, intent: string) => void;
  onTrade: (bin: Bin, index: number) => void;
  onDig: (index: number) => void;
  onSelect: (id: string) => void;
}) {
  const bins: Bin[] = ["pouch", "creel", "cellar", "tin"];
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {bins.map((bin) => (
        <div key={bin} className="rounded-3xl bg-paper-2 p-4 shadow-card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl">{BIN_META[bin].title}</h2>
            <p className="text-sm tabular-nums text-muted">
              {kit.bins[bin].length}/{slotCap(kit, bin)}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted">{BIN_META[bin].note}</p>
          {kit.bins[bin].length === 0 ? <p className="mt-3 text-sm text-ink">Empty.</p> : null}
          <ul className="mt-3 grid gap-2">
            {kit.bins[bin].map((stack, index) => (
              <StackRow
                key={`${bin}-${index}-${stack.provisionId}`}
                stack={stack}
                onOpen={() => onSelect(stack.provisionId)}
                onUse={onUse}
                onTrade={() => onTrade(bin, index)}
              />
            ))}
          </ul>
        </div>
      ))}
      <div className="rounded-3xl bg-paper-2 p-4 shadow-card sm:col-span-2">
        <h2 className="font-display text-xl">Graves</h2>
        {kit.graves.length === 0 ? <p className="mt-1 text-sm text-muted">No body in the ground.</p> : null}
        <ul className="mt-3 grid gap-2">
          {kit.graves.map((grave, index) => (
            <li key={`${grave.year}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-3 py-2">
              <p className="text-sm">
                {grave.year} · {grave.place} · {grave.pouch.length + grave.creel.length} stacks
              </p>
              <button type="button" className="min-h-11 rounded-lg bg-creek px-3 text-sm text-creek-ink" onClick={() => onDig(index)}>
                Dig
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StackRow({
  stack,
  onOpen,
  onUse,
  onTrade,
}: {
  stack: Stack;
  onOpen: () => void;
  onUse: (id: string, intent: string) => void;
  onTrade: () => void;
}) {
  const item = PROVISION_BY_ID[stack.provisionId];
  if (!item) return null;
  const intents = [
    ...(item.safeRaw ? [{ intent: "nibble", label: "Nibble" }] : []),
    ...item.field.map((field) => ({ intent: field.intent, label: field.label })),
  ];
  return (
    <li className="rounded-lg border border-line bg-paper px-3 py-2">
      <button type="button" className="min-h-11 text-left" onClick={onOpen}>
        <span className="text-ink">{item.name}</span>
        <span className="ml-2 text-sm text-muted">
          ×{stack.qty}
          {stack.cured ? " · cured" : ""}
        </span>
      </button>
      <div className="mt-1 flex flex-wrap gap-2">
        {intents.map((intent) => (
          <button key={intent.intent} type="button" className="min-h-11 rounded-lg bg-paper-2 px-3 text-sm" onClick={() => onUse(item.id, intent.intent)}>
            {intent.label}
          </button>
        ))}
        {item.trade > 0 && (
          <button type="button" className="min-h-11 rounded-lg bg-paper-2 px-3 text-sm" onClick={onTrade}>
            Trade
          </button>
        )}
      </div>
    </li>
  );
}

function Stove({
  kit,
  openBook,
  openFar,
  onOpenBook,
  onOpenFar,
  onCook,
  onWalk,
}: {
  kit: KitState;
  openBook: boolean;
  openFar: boolean;
  onOpenBook: () => void;
  onOpenFar: () => void;
  onCook: (id: string) => void;
  onWalk: (place: string) => void;
}) {
  const stove = DISHES.filter((d) => d.stove);
  const rest = DISHES.filter((d) => !d.stove);
  const ready = stove.filter((d) => previewCook(kit, d.id).ok);
  const close = stove.filter((d) => !ready.includes(d) && dishGaps(kit, d).length === 1);
  const far = stove.filter((d) => !ready.includes(d) && !close.includes(d));
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="font-display text-xl">Ready</h2>
        {ready.length === 0 ? <p className="mt-1 text-sm text-muted">Nothing on the stove can be cooked yet.</p> : null}
        <ul className="mt-2 grid gap-2">
          {ready.map((dish) => (
            <DishRow key={dish.id} dish={dish} kit={kit} onCook={onCook} />
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-display text-xl">One thing short</h2>
        {close.length === 0 ? <p className="mt-1 text-sm text-muted">No plate is a single ingredient away.</p> : null}
        <ul className="mt-2 grid gap-2">
          {close.map((dish) => {
            const gap = dishGaps(kit, dish)[0];
            const node = gap && !gap.cured ? nodeFor(kit, gap.provisionId) : undefined;
            return (
              <DishRow
                key={dish.id}
                dish={dish}
                kit={kit}
                onCook={onCook}
                walkLabel={node && gap && available(node, kit) >= gap.missing ? node.place : undefined}
                onWalk={node ? () => onWalk(node.place) : undefined}
              />
            );
          })}
        </ul>
      </div>
      <button type="button" className="min-h-11 text-left text-sm text-brass" onClick={onOpenFar}>
        {openFar ? "Hide the rest of the stove" : `Still out of reach (${far.length})`}
      </button>
      {openFar && (
        <ul className="grid gap-2">
          {far.map((dish) => (
            <DishRow key={dish.id} dish={dish} kit={kit} onCook={onCook} />
          ))}
        </ul>
      )}
      <button type="button" className="min-h-11 text-left text-sm text-brass" onClick={onOpenBook}>
        {openBook ? "Hide the rest of the book" : `Rest of the book (${rest.length})`}
      </button>
      {openBook && (
        <ul className="grid gap-2">
          {rest.map((dish) => (
            <DishRow key={dish.id} dish={dish} kit={kit} onCook={onCook} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DishRow({
  dish,
  kit,
  onCook,
  onWalk,
  walkLabel,
}: {
  dish: Dish;
  kit: KitState;
  onCook: (id: string) => void;
  onWalk?: () => void;
  walkLabel?: string;
}) {
  const preview = previewCook(kit, dish.id);
  const directShort = dishGaps(kit, dish).length > 0;
  return (
    <li className="rounded-3xl bg-paper-2 p-4 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-ink">{dish.name}</p>
          <p className="text-xs text-muted">
            {dish.id} · {dish.naturalHistory}
          </p>
          <p className="mt-1 text-sm text-muted">{dish.blurb}</p>
          <ul className="mt-2 text-xs text-muted">
            {dish.needs.map((need) => (
              <li key={`${dish.id}-${need.provisionId}-${need.cured ? "c" : "a"}`}>
                {need.qty} {PROVISION_BY_ID[need.provisionId]?.name}
                {need.cured ? " cured" : ""} · holding {qtyOf(kit, need.provisionId, need.cured ? true : undefined)}
              </li>
            ))}
          </ul>
          {preview.ok && directShort ? <p className="mt-1 text-xs text-brass">A stand-in covers what you are short.</p> : null}
          {onWalk && walkLabel ? <p className="mt-1 text-xs text-brass">{walkLabel}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          {onWalk ? (
            <button type="button" className="min-h-11 rounded-lg bg-creek px-3 text-sm text-creek-ink" onClick={onWalk}>
              Walk there
            </button>
          ) : null}
          <button
            type="button"
            className="min-h-11 rounded-lg bg-maple px-3 text-sm text-maple-ink disabled:opacity-40"
            disabled={!preview.ok}
            onClick={() => onCook(dish.id)}
          >
            Cook
          </button>
        </div>
      </div>
    </li>
  );
}

function Rod({
  kit,
  onWater,
  onApply,
  onWalk,
}: {
  kit: KitState;
  onWater: (id: string) => void;
  onApply: (result: StepResult) => void;
  onWalk: (place: string) => void;
}) {
  const water = WATERS.find((w) => w.id === kit.waterId) ?? WATERS[0];
  const owned = PROVISIONS.filter((p) => p.bait && qtyOf(kit, p.id) > 0);
  const worms = nodeFor(kit, pid(94));
  const fish = water.species.map((id) => PROVISION_BY_ID[id]?.name).filter(Boolean);
  const tackle = [
    { label: "Hook", ok: qtyOf(kit, pid(109)) > 0 },
    { label: "Line", ok: qtyOf(kit, pid(111)) > 0 },
    { label: "Shot", ok: qtyOf(kit, pid(110)) > 0 },
    { label: "Bobber", ok: qtyOf(kit, pid(112)) > 0 || kit.flags.lashedBobber },
  ];
  return (
    <section className="rounded-3xl bg-paper-2 p-4 shadow-card">
      <h2 className="font-display text-xl">Rod</h2>
      <p className="mt-1 text-sm text-muted">{RIG_LINE[water.rig]}</p>
      <p className="mt-1 text-sm text-muted">{fish.join(", ")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {WATERS.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`min-h-11 rounded-lg px-3 text-sm ${kit.waterId === row.id ? "bg-creek text-creek-ink" : "bg-paper text-ink"}`}
            onClick={() => onWater(row.id)}
          >
            {row.name}
          </button>
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {tackle.map((chip) => (
          <li key={chip.label} className={`rounded-full px-3 py-1 text-sm ${chip.ok ? "bg-creek text-creek-ink" : "bg-paper text-muted"}`}>
            {chip.label}
            {chip.ok ? "" : " missing"}
          </li>
        ))}
        {kit.flags.lineDressed ? <li className="rounded-full bg-paper px-3 py-1 text-sm">Line dressed</li> : null}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {owned.length === 0 ? <p className="text-sm text-muted">No bait in the kit.</p> : null}
        {owned.map((bait) => (
          <button
            key={bait.id}
            type="button"
            className={`min-h-11 rounded-lg px-3 text-sm ${kit.baitId === bait.id ? "bg-maple text-maple-ink" : "bg-paper text-ink"}`}
            onClick={() => onApply(selectBait(kit, bait.id))}
          >
            {bait.name} ×{qtyOf(kit, bait.id)}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-lg bg-creek px-4 text-sm text-creek-ink" onClick={() => onApply(castLine(kit))}>
          Cast
        </button>
        {owned.length === 0 && worms ? (
          <button type="button" className="min-h-11 rounded-lg bg-paper px-4 text-sm" onClick={() => onWalk(worms.place)}>
            Walk to nightcrawlers
          </button>
        ) : null}
      </div>
    </section>
  );
}

function Codex({
  query,
  scope,
  onQuery,
  onScope,
  picked,
  onPick,
  item,
}: {
  query: string;
  scope: Scope;
  onQuery: (q: string) => void;
  onScope: (scope: Scope) => void;
  picked: string;
  onPick: (id: string) => void;
  item: Provision | undefined;
}) {
  const list = PROVISIONS.filter((p) => {
    if (scope === "demo" && !p.demo) return false;
    if (scope === "rare" && p.rarity !== "rare") return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.place.toLowerCase().includes(q) || p.id.includes(q);
  }).sort((a, b) => Number(b.demo) - Number(a.demo) || a.n - b.n);
  return (
    <section className="grid gap-3 md:grid-cols-[14rem_1fr]">
      <div className="rounded-3xl bg-paper-2 p-3 shadow-card">
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Name, place, or id"
          className="mb-2 min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-ink"
          aria-label="Search provisions"
        />
        <div className="mb-2 flex gap-2">
          {(["all", "demo", "rare"] as const).map((entry) => (
            <button
              key={entry}
              type="button"
              className={`min-h-11 flex-1 rounded-lg text-sm capitalize ${scope === entry ? "bg-creek text-creek-ink" : "bg-paper text-ink"}`}
              onClick={() => onScope(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
        <ul className="max-h-96 overflow-auto">
          {list.map((prov) => (
            <li key={prov.id}>
              <button
                type="button"
                className={`min-h-11 w-full rounded-lg px-2 text-left text-sm ${prov.id === picked ? "bg-paper text-ink" : "text-ink"}`}
                onClick={() => onPick(prov.id)}
              >
                {prov.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {item ? <RecordCard item={item} /> : null}
    </section>
  );
}

function RecordCard({ item }: { item: Provision }) {
  const dest = destinationsOf(item);
  return (
    <article className="rounded-3xl bg-paper-2 p-4 shadow-card">
      <p className="text-xs text-brass">{item.id}</p>
      <h2 className="font-display text-xl">{item.name}</h2>
      <p className="text-sm text-muted">
        {item.kind} · {item.rarity} · {item.naturalHistory}
        {item.demo ? " · demo path" : ""}
      </p>
      <dl className="mt-3 grid gap-3 text-sm">
        <Row k="Source" v={`${item.method} · ${item.place} (${item.mapId} ${item.x},${item.y})`} />
        <Row k="Availability" v={`${item.availability} Seasons: ${item.seasons.join(", ")}. Yield ${item.baseYield}.`} />
        <Row k="Look" v={item.look} />
        <Row k="Tell" v={item.tell} />
        <Row k="Misread" v={item.misreadAs ? (PROVISION_BY_ID[item.misreadAs]?.name ?? item.misreadAs) : "None."} />
        <Row k="Storage" v={`${item.storage.bin}, stack ${item.storage.stackMax}. ${item.storage.note}`} />
        <Row k="Trade" v={item.trade > 0 ? `${item.trade} barter` : "Nobody buys it."} />
        <Row k="Era" v={`${item.era}. ${item.eraNote}`} />
        <Row k="Reference" v={item.reference} />
      </dl>
      <h3 className="mt-4 text-xs tracking-widest text-brass uppercase">Uses</h3>
      <ul className="mt-1 text-sm">
        {dest.map((row, index) => (
          <li key={index}>{destLine(row)}</li>
        ))}
      </ul>
    </article>
  );
}

function destLine(row: ReturnType<typeof destinationsOf>[number]) {
  if (row.kind === "dish") return `Plate: ${row.name}`;
  if (row.kind === "bait") return `Bait on a ${row.rig} rig`;
  if (row.kind === "field") return row.label;
  if (row.kind === "trade") return "Trade";
  if (row.kind === "tackle") return `Tackle for ${row.rig}`;
  if (row.kind === "stands-in") return `May stand in for ${row.name} (${Math.round(row.quality * 100)}%)`;
  return "Nibble raw";
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs tracking-widest text-brass uppercase">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Ledger({ checks }: { checks: ReturnType<typeof runValidation> }) {
  const ordered = [...checks].sort((a, b) => Number(a.pass) - Number(b.pass));
  const pass = checks.filter((c) => c.pass).length;
  return (
    <section>
      <h2 className="font-display text-xl">
        Ledger {pass}/{checks.length}
      </h2>
      <p className="mt-1 text-sm text-muted">Ingredient conservation through a missing recipe. Failures sort first.</p>
      <ul className="mt-3 grid gap-2">
        {ordered.map((check) => (
          <li key={check.name} className="rounded-3xl bg-paper-2 px-4 py-3 text-sm shadow-card">
            <p className={check.pass ? "text-creek" : "text-maple"}>
              {check.pass ? "Pass" : "Fail"} · {check.name}
            </p>
            <p className="text-muted">{check.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
