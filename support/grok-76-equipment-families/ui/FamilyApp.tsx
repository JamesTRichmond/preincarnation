import { useEffect, useMemo, useState } from "react";
import {
  Anchor,
  AudioLines,
  BookOpen,
  Coffee,
  Compass,
  Dog,
  Droplets,
  Eye,
  Flame,
  Flashlight,
  House,
  Mountain,
  Pocket,
  Snowflake,
  Trees,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { SCENARIO_IDS, SCENARIOS, fight } from "../arena.ts";
import type { ScenarioId } from "../arena.ts";
import { FAMILIES, familyById, itemById } from "../catalog.ts";
import { presets } from "../presets.ts";
import {
  changeBody,
  compareResolutions,
  emptyLoadout,
  grantPiece,
  removeInstance,
  resolve,
  tryEquip,
} from "../resolve.ts";
import { FAMILY_SAVE_KEY, hydrateLoadout, serializeLoadout } from "../save.ts";
import {
  BODIES,
  BODY_LABEL,
  DISCIPLINES,
  DISCIPLINE_LABEL,
  EQUIP_SLOTS,
  SLOT_LABEL,
  STAT_KEYS,
  baseStats,
} from "../types.ts";
import type { BodyId, EquipSlot, ItemDef, Loadout, Resolution, Stat } from "../types.ts";

const ICONS: Record<string, LucideIcon> = {
  floodkeepers: Droplets,
  "quarry-night": Flashlight,
  "orchard-guardians": Trees,
  "unnamed-witnesses": Eye,
  "unmeasured-county": Compass,
  "sugarbush-crew": Flame,
  "ferry-bells": Anchor,
  "marble-masons": Mountain,
  "sheep-hill": Dog,
  "night-librarians": BookOpen,
  "ice-cutters": Snowflake,
  "section-gang": Wrench,
  innkeepers: Coffee,
  "storm-roofers": House,
  "border-pockets": Pocket,
  "other-voice": AudioLines,
};

const TABS = [
  { id: "ledger", label: "Ledger" },
  { id: "bench", label: "Bench" },
  { id: "arena", label: "Arena" },
] as const;

type TabId = (typeof TABS)[number]["id"];
type Lens = "all" | "counting" | "open";

const CORE_STATS: Stat[] = ["maxHp", "atk", "haste", "guard", "light", "oilDrain", "warmth", "sustain", "reflect", "dmgCap", "maxMp"];

const STAT_LABEL: Record<Stat, string> = {
  maxHp: "Blood",
  atk: "Swing",
  haste: "Haste",
  guard: "Guard",
  light: "Light",
  oilDrain: "Oil drink",
  oilCap: "Oil held",
  warmth: "Warmth",
  wetOut: "Wet",
  soakVuln: "Soak",
  beastOut: "Beast",
  burst: "Burst",
  opening: "Tell",
  sustain: "Mend",
  maxMp: "Breath",
  mpRegen: "Breath back",
  reflect: "Return",
  dmgCap: "Ceiling",
  namedOnly: "Named only",
  frostOut: "Frost",
  burnVuln: "Burn",
  chipOut: "Chip",
  hearingOut: "Hearing",
};

function formatStat(stat: Stat, value: number): string {
  if (stat === "dmgCap" && value >= 900) return "none";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function nearly(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-6;
}

function equipSlotOf(def: ItemDef): EquipSlot | null {
  if (def.countsWhen !== "equipped") return null;
  if (def.slot === "hand" || def.slot === "y" || def.slot === "worn") return def.slot;
  return null;
}

function familyMatches(id: string, needle: string): boolean {
  if (!needle) return true;
  const family = familyById(id);
  if (family.name.toLowerCase().includes(needle)) return true;
  if (family.identity.toLowerCase().includes(needle)) return true;
  if (family.sidegrade.name.toLowerCase().includes(needle)) return true;
  return family.pieceIds.some((pieceId) => {
    const piece = itemById(pieceId);
    return (
      piece.name.toLowerCase().includes(needle) ||
      piece.discovery.place.toLowerCase().includes(needle) ||
      piece.solo.toLowerCase().includes(needle)
    );
  });
}

export function FamilyApp() {
  const [tab, setTab] = useState<TabId>("ledger");
  const [loadout, setLoadout] = useState<Loadout>(() => emptyLoadout());
  const [ready, setReady] = useState(false);
  const [familyId, setFamilyId] = useState(FAMILIES[0].id);
  const [query, setQuery] = useState("");
  const [lens, setLens] = useState<Lens>("all");
  const [held, setHeld] = useState<Loadout | null>(null);
  const [feedback, setFeedback] = useState<string[]>([
    "Three slots. Hand, Y, Worn. A fifth piece is a bargain, not a free upgrade.",
  ]);
  const [scenario, setScenario] = useState<ScenarioId>("quarry-dark");
  const [confirmDrop, setConfirmDrop] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(FAMILY_SAVE_KEY);
    if (raw) {
      const parsed = hydrateLoadout(raw);
      if (parsed.ok) setLoadout(parsed.loadout);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(FAMILY_SAVE_KEY, serializeLoadout(loadout));
  }, [loadout, ready]);

  const resolution = useMemo(() => resolve(loadout), [loadout]);
  const heldResolution = useMemo(() => (held ? resolve(held) : null), [held]);
  const family = familyById(familyId);
  const comparison = heldResolution ? compareResolutions(heldResolution, resolution) : [];
  const needle = query.trim().toLowerCase();
  const board = useMemo(
    () => SCENARIO_IDS.map((id) => ({ id, result: fight(resolution.stats, id) })),
    [resolution],
  );
  const standing = board.filter((row) => row.result.win).length;
  const minute = board.find((row) => row.id === scenario)?.result ?? board[0].result;

  const visibleFamilies = FAMILIES.filter((entry) => {
    if (!familyMatches(entry.id, needle)) return false;
    const count = resolution.families.find((row) => row.id === entry.id)?.count ?? 0;
    if (lens === "counting") return count > 0;
    if (lens === "open") return count < 5;
    return true;
  });

  function apply(next: { loadout: Loadout; feedback: string[] }) {
    setLoadout(next.loadout);
    setFeedback(next.feedback);
    setConfirmDrop(false);
  }

  function onBody(body: BodyId) {
    apply(changeBody(loadout, body));
  }

  function onGrant(defId: string) {
    apply(grantPiece(loadout, defId));
    setFamilyId(itemById(defId).familyId);
    setTab("bench");
  }

  function onOpen(id: string) {
    setFamilyId(id);
    setTab("bench");
  }

  function onRemove(instanceId: string) {
    apply(removeInstance(loadout, instanceId));
  }

  function onWear(instanceId: string, slot: EquipSlot) {
    const step = tryEquip(loadout, instanceId, slot);
    setFeedback(step.feedback);
    setConfirmDrop(false);
    if (step.ok && step.loadout !== loadout) setLoadout(step.loadout);
  }

  function onDropBody() {
    apply({
      loadout: emptyLoadout(loadout.body),
      feedback: ["The body is empty. Nothing counts."],
    });
  }

  const equipped = (slot: EquipSlot) =>
    loadout.instances.find((instance) => instance.presence === "equipped" && instance.slot === slot);

  const activePreset = presets().find((preset) => serializeLoadout(preset.loadout) === serializeLoadout(loadout));

  return (
    <div className="family-ledger min-h-screen bg-canvas text-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 pb-24">
        <header className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs tracking-widest text-faint">PREINCARNATION</p>
              <h1 className="font-display text-3xl font-medium tracking-tight text-paper">Family ledger</h1>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Body">
              {BODIES.map((body) => (
                <button
                  key={body}
                  type="button"
                  aria-pressed={loadout.body === body}
                  onClick={() => onBody(body)}
                  className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition-colors duration-150 ${
                    loadout.body === body ? "bg-creek text-ink" : "border border-line bg-inset text-paper"
                  }`}
                >
                  {BODY_LABEL[body]}
                </button>
              ))}
            </div>
          </div>
          <p className="max-w-2xl text-base leading-normal text-mist">
            Sixteen families. Five pieces each. The body has Hand, Y, and Worn. A complete set changes the bargain. It does not replace a mixed hand.
          </p>
        </header>

        <CountyStrip
          resolution={resolution}
          equipped={equipped}
          onOpenFamily={(id) => {
            setFamilyId(id);
            setTab("ledger");
          }}
          onBench={() => setTab("bench")}
        />

        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              onClick={() => setTab(entry.id)}
              className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 ${
                tab === entry.id ? "bg-paper text-ink" : "text-mist"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {tab === "ledger" ? (
          <Ledger
            families={visibleFamilies}
            familyId={familyId}
            query={query}
            lens={lens}
            body={loadout.body}
            loadout={loadout}
            resolution={resolution}
            onQuery={setQuery}
            onLens={setLens}
            onPick={setFamilyId}
            onGrant={onGrant}
            onOpen={onOpen}
          />
        ) : null}

        {tab === "bench" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border border-line bg-panel p-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-paper">Slots</h2>
                    <p className="mt-1 text-sm text-mist">Pack and spent pieces count only when that piece says they do.</p>
                  </div>
                  {loadout.instances.length > 0 ? (
                    confirmDrop ? (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={onDropBody} className="min-h-11 rounded-lg bg-paper px-3 text-sm font-semibold text-ink">
                          Drop every piece
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDrop(false)}
                          className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold text-paper"
                        >
                          Keep them
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDrop(true)}
                        className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold text-paper"
                      >
                        Drop the body
                      </button>
                    )
                  ) : null}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {EQUIP_SLOTS.map((slot) => {
                    const worn = equipped(slot);
                    const def = worn ? itemById(worn.defId) : null;
                    return (
                      <div key={slot} className="min-h-24 rounded-lg border border-line bg-inset px-3 py-3">
                        <span className="font-mono text-xs tracking-widest text-faint">{SLOT_LABEL[slot]}</span>
                        <span className="mt-1 block text-base font-semibold text-paper">{def ? def.name : "Empty"}</span>
                        <span className="mt-1 block text-sm text-mist">{def ? def.solo : "Open"}</span>
                        {def && worn ? (
                          <button
                            type="button"
                            onClick={() => onRemove(worn.instanceId)}
                            className="mt-3 min-h-11 rounded-lg border border-line px-3 text-sm font-semibold text-paper"
                          >
                            Drop
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <PackRow title="Carried" presence="carried" loadout={loadout} body={loadout.body} onRemove={onRemove} onWear={onWear} />
                <PackRow title="Used this life" presence="used" loadout={loadout} body={loadout.body} onRemove={onRemove} onWear={onWear} />
              </div>

              <div className="rounded-3xl border border-line bg-panel p-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <h2 className="font-display text-xl">{family.name}</h2>
                  <label className="text-sm text-mist">
                    Find
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Pike, flood, quarry"
                      className="ml-2 min-h-11 rounded-lg border border-line bg-inset px-3 text-paper placeholder:text-faint"
                    />
                  </label>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {visibleFamilies.map((entry) => {
                    const count = resolution.families.find((row) => row.id === entry.id)?.count ?? 0;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setFamilyId(entry.id)}
                        className={`min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold ${
                          entry.id === familyId ? "bg-creek text-ink" : "bg-inset text-paper"
                        }`}
                      >
                        {entry.name}
                        {count > 0 ? ` ${count}/5` : ""}
                      </button>
                    );
                  })}
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {family.pieceIds.map((id) => {
                    const piece = itemById(id);
                    const owned = loadout.instances.some((instance) => instance.defId === id);
                    const counting = resolution.recognizedIds.includes(id);
                    const legal = piece.bodies.includes(loadout.body);
                    return (
                      <li key={id} className="rounded-lg border border-line bg-inset p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-paper">{piece.name}</p>
                            <p className="text-sm text-mist">{piece.solo}</p>
                            <p className="mt-1 font-mono text-xs text-faint">
                              {piece.countsWhen === "equipped" ? SLOT_LABEL[piece.slot as EquipSlot] : piece.countsWhen} · leans{" "}
                              {DISCIPLINE_LABEL[piece.discipline]}
                              {counting ? " · counting" : owned ? " · on the body" : ""}
                              {legal ? "" : ` · ${BODY_LABEL[loadout.body]} cannot`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => (owned ? onOpen(piece.familyId) : onGrant(id))}
                            className="min-h-11 rounded-lg bg-creek px-3 text-sm font-semibold text-ink"
                          >
                            {owned ? "On the bench" : "Add"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <aside className="flex flex-col gap-4">
              <Feedback title="Recognized" lines={resolution.lines} live />
              <ComparePanel
                comparison={comparison}
                held={held !== null}
                onRemember={() => setHeld(loadout)}
                onClear={() => setHeld(null)}
              />
              <Numbers resolution={resolution} held={heldResolution} />
              <Feedback title="Last change" lines={feedback} live />
            </aside>
          </section>
        ) : null}

        {tab === "arena" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border border-line bg-panel p-4">
                <h2 className="font-display text-xl">Where this hand stands</h2>
                <p className="mt-1 text-sm leading-normal text-mist">
                  {standing === 0
                    ? "Down on every ground."
                    : standing === SCENARIO_IDS.length
                      ? "Standing on every ground. That is rare, and it still cost something."
                      : `Standing on ${standing} of ${SCENARIO_IDS.length}. A bargain that wins its ground loses somewhere else.`}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {board.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      aria-pressed={scenario === row.id}
                      onClick={() => setScenario(row.id)}
                      className={`min-h-16 rounded-lg border px-3 py-2 text-left ${
                        scenario === row.id ? "border-creek bg-inset" : "border-line bg-inset"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-paper">{SCENARIOS[row.id].name}</span>
                      <span className={`mt-1 block font-mono text-xs ${row.result.win ? "text-creek" : "text-bad"}`}>
                        {row.result.win ? "Standing" : "Down"} · {row.result.rounds} rounds
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-line bg-panel p-4">
                <h2 className="font-display text-xl">{SCENARIOS[scenario].name}</h2>
                <p className="mt-1 text-sm text-mist">{SCENARIOS[scenario].blurb}</p>
                <p className={`mt-3 text-lg font-semibold ${minute.win ? "text-paper" : "text-bad"}`}>
                  {minute.win ? "Standing" : "Down"} · {minute.reason}
                </p>
                <Meter label="You" value={Math.max(0, minute.hpLeft)} max={Math.max(1, resolution.stats.maxHp)} />
                <Meter label="Them" value={Math.max(0, minute.enemyLeft)} max={SCENARIOS[scenario].hp} />
                <p className="mt-3 font-mono text-xs text-faint tabular-nums">
                  Breath {minute.mpLeft.toFixed(1)} · oil {minute.oilLeft.toFixed(1)} · warmth {minute.warmthLeft.toFixed(1)} · mended{" "}
                  {minute.healed.toFixed(1)}
                </p>
                <ul className="mt-3 flex flex-col gap-1">
                  {minute.log.slice(-8).map((line) => (
                    <li key={line} className="font-mono text-xs text-mist tabular-nums">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-line bg-panel p-4">
                <h2 className="font-display text-xl">Known hands</h2>
                <p className="mt-1 text-sm text-mist">Four complete families and three mixed hands. Same minute, no restock.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {presets().map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={activePreset?.id === preset.id}
                      onClick={() => {
                        setLoadout(preset.loadout);
                        setFeedback([preset.note]);
                        setConfirmDrop(false);
                      }}
                      className={`min-h-11 rounded-lg border px-3 py-2 text-left ${
                        activePreset?.id === preset.id ? "border-creek bg-inset" : "border-line bg-inset"
                      }`}
                    >
                      <span className="block font-semibold text-paper">{preset.name}</span>
                      <span className="block text-sm text-mist">{preset.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <aside className="flex flex-col gap-4">
              <Feedback title="On the body" lines={resolution.lines} />
              <Numbers resolution={resolution} held={heldResolution} />
            </aside>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CountyStrip({
  resolution,
  equipped,
  onOpenFamily,
  onBench,
}: {
  resolution: Resolution;
  equipped: (slot: EquipSlot) => Loadout["instances"][number] | undefined;
  onOpenFamily: (id: string) => void;
  onBench: () => void;
}) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-4">
      <div className="grid grid-cols-3 gap-2">
        {EQUIP_SLOTS.map((slot) => {
          const worn = equipped(slot);
          const def = worn ? itemById(worn.defId) : null;
          return (
            <button key={slot} type="button" onClick={onBench} className="min-h-16 rounded-lg bg-inset px-2 py-2 text-left sm:px-3">
              <span className="font-mono text-xs tracking-widest text-faint">{SLOT_LABEL[slot]}</span>
              <span className="mt-1 block truncate text-sm font-semibold text-paper">{def ? def.name : "Empty"}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {resolution.families.length === 0 ? <p className="text-sm text-mist">Nothing counting yet.</p> : null}
        {resolution.families.map((row) => {
          const bargain = row.count >= 5;
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onOpenFamily(row.id)}
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${bargain ? "bg-creek text-ink" : "bg-inset text-paper"}`}
            >
              {row.name} {row.count}/5
            </button>
          );
        })}
      </div>
      {resolution.sidegrades.length > 0 ? (
        <p className="mt-2 text-sm text-mist">Bargain: {resolution.sidegrades.join(", ")}.</p>
      ) : null}
    </section>
  );
}

function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="mt-3">
      <div className="flex justify-between font-mono text-xs text-faint">
        <span>{label}</span>
        <span className="tabular-nums">
          {Math.max(0, value).toFixed(0)} / {max.toFixed(0)}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-lg bg-canvas">
        <div className="h-full bg-creek" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PackRow({
  title,
  presence,
  loadout,
  body,
  onRemove,
  onWear,
}: {
  title: string;
  presence: "carried" | "used";
  loadout: Loadout;
  body: BodyId;
  onRemove: (id: string) => void;
  onWear: (id: string, slot: EquipSlot) => void;
}) {
  const rows = loadout.instances.filter((instance) => instance.presence === presence);
  return (
    <div className="mt-4">
      <h3 className="font-mono text-xs tracking-widest text-faint">{title}</h3>
      {rows.length === 0 ? <p className="mt-1 text-sm text-mist">None.</p> : null}
      <ul className="mt-2 flex flex-col gap-2">
        {rows.map((instance) => {
          const def = itemById(instance.defId);
          const slot = equipSlotOf(def);
          const canWear = presence === "carried" && slot !== null && def.bodies.includes(body);
          const counts = def.countsWhen === presence;
          return (
            <li key={instance.instanceId} className="flex flex-col gap-2 rounded-lg border border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-paper">{def.name}</p>
                <p className="text-sm text-mist">{counts ? "Counts from here" : "Does not count"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canWear && slot ? (
                  <button
                    type="button"
                    onClick={() => onWear(instance.instanceId, slot)}
                    className="min-h-11 rounded-lg bg-creek px-3 text-sm font-semibold text-ink"
                  >
                    Wear in {SLOT_LABEL[slot]}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onRemove(instance.instanceId)}
                  className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold text-paper"
                >
                  Drop
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Ledger({
  families,
  familyId,
  query,
  lens,
  body,
  loadout,
  resolution,
  onQuery,
  onLens,
  onPick,
  onGrant,
  onOpen,
}: {
  families: typeof FAMILIES;
  familyId: string;
  query: string;
  lens: Lens;
  body: BodyId;
  loadout: Loadout;
  resolution: Resolution;
  onQuery: (value: string) => void;
  onLens: (lens: Lens) => void;
  onPick: (id: string) => void;
  onGrant: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const selected = familyById(familyId);
  const Icon = ICONS[selected.id] ?? Compass;
  const counted = resolution.families.find((row) => row.id === selected.id)?.count ?? 0;
  const lenses: { id: Lens; label: string }[] = [
    { id: "all", label: "All" },
    { id: "counting", label: "Counting" },
    { id: "open", label: "Unfinished" },
  ];
  const steps = [
    {
      at: "Pair",
      name: selected.pair.name,
      note: selected.pair.note,
      on: selected.pair.pieceIds.every((id) => resolution.recognizedIds.includes(id)),
    },
    ...selected.counts.map((bonus) => ({
      at: `At ${bonus.at}`,
      name: bonus.name,
      note: bonus.note,
      on: counted >= bonus.at,
    })),
    {
      at: "All five",
      name: selected.sidegrade.name,
      note: `${selected.sidegrade.gives} ${selected.sidegrade.costs}`,
      on: counted >= 5,
    },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="family-rail rounded-3xl border border-line bg-panel p-4">
        <label className="block text-sm text-mist">
          Find a piece, a place, or a family
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Pike, flood, quarry"
            className="mt-2 min-h-11 w-full rounded-lg border border-line bg-inset px-3 text-paper placeholder:text-faint"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Which families">
          {lenses.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={lens === entry.id}
              onClick={() => onLens(entry.id)}
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${lens === entry.id ? "bg-paper text-ink" : "bg-inset text-mist"}`}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <ul className="family-rail-list mt-3 flex flex-col gap-2">
          {families.map((entry) => {
            const Glyph = ICONS[entry.id] ?? Compass;
            const count = resolution.families.find((row) => row.id === entry.id)?.count ?? 0;
            const active = entry.id === selected.id;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onPick(entry.id)}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                    active ? "bg-creek text-ink" : "bg-inset text-paper"
                  }`}
                >
                  <Glyph size={16} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{entry.name}</span>
                    <span className="mt-1 flex gap-1" aria-hidden="true">
                      {entry.pieceIds.map((id) => {
                        const on = resolution.recognizedIds.includes(id);
                        const owned = loadout.instances.some((instance) => instance.defId === id);
                        return (
                          <span
                            key={id}
                            className={`h-1.5 w-4 rounded-sm ${
                              on ? (active ? "bg-ink" : "bg-creek") : owned ? (active ? "bg-ink/40" : "bg-faint") : active ? "bg-ink/20" : "bg-line"
                            }`}
                          />
                        );
                      })}
                    </span>
                  </span>
                  <span className={`font-mono text-xs tabular-nums ${active ? "text-ink" : "text-faint"}`}>{count}/5</span>
                </button>
              </li>
            );
          })}
          {families.length === 0 ? <li className="text-sm text-mist">Nothing by that name.</li> : null}
        </ul>
      </div>
      <article className="rounded-3xl border border-line bg-panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon size={18} aria-hidden="true" />
            <h2 className="font-display text-2xl font-medium">{selected.name}</h2>
          </div>
          <p className="font-mono text-xs tracking-widest text-faint">{counted} of 5 counting</p>
        </div>
        <p className="mt-2 max-w-2xl text-base leading-normal text-mist">{selected.identity}</p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.at} className={`rounded-lg border p-3 ${step.on ? "border-creek bg-inset" : "border-line bg-inset"}`}>
              <p className="font-mono text-xs tracking-widest text-faint">{step.at}</p>
              <p className="mt-1 text-sm font-semibold text-paper">{step.name}</p>
              <p className="mt-1 text-sm leading-normal text-mist">{step.note}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-4 flex flex-col gap-3">
          {selected.pieceIds.map((id) => {
            const piece = itemById(id);
            const owned = loadout.instances.some((instance) => instance.defId === id);
            const counting = resolution.recognizedIds.includes(id);
            const legal = piece.bodies.includes(body);
            return (
              <li key={id} className="rounded-lg border border-line bg-inset p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-paper">{piece.name}</h3>
                    <p className="text-sm text-mist">{piece.solo}</p>
                    <p className="mt-2 font-mono text-xs tracking-widest text-faint">{piece.discovery.place}</p>
                    <p className="mt-1 text-sm leading-normal text-paper">{piece.discovery.notice}</p>
                    <p className="mt-1 text-sm leading-normal text-mist">{piece.discovery.take}</p>
                    <p className="mt-2 font-mono text-xs text-faint">
                      {piece.countsWhen === "equipped" ? SLOT_LABEL[piece.slot as EquipSlot] : piece.countsWhen} · leans{" "}
                      {DISCIPLINE_LABEL[piece.discipline]}
                      {counting ? " · counting" : ""}
                      {legal ? "" : ` · ${BODY_LABEL[body]} cannot wear this`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (owned ? onOpen(selected.id) : onGrant(id))}
                    className="min-h-11 shrink-0 rounded-lg bg-creek px-3 text-sm font-semibold text-ink"
                  >
                    {owned ? "On the bench" : "Put on the bench"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}

function Numbers({ resolution, held }: { resolution: Resolution; held: Resolution | null }) {
  const bare = baseStats(resolution.body);
  const extra = STAT_KEYS.filter((stat) => {
    if (CORE_STATS.includes(stat)) return false;
    const moved = !nearly(resolution.stats[stat], bare[stat]);
    const versus = held ? !nearly(resolution.stats[stat], held.stats[stat]) : false;
    return moved || versus;
  });
  const stats = [...CORE_STATS, ...extra];
  const leanMax = Math.max(1, ...DISCIPLINES.map((discipline) => resolution.leans[discipline]));

  return (
    <section className="rounded-3xl border border-line bg-panel p-4">
      <h2 className="font-display text-xl">Numbers</h2>
      <p className="mt-1 text-sm text-mist">Against a bare {BODY_LABEL[resolution.body].toLowerCase()}.</p>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((stat) => {
          const value = resolution.stats[stat];
          const delta = value - bare[stat];
          const memory = held && !nearly(held.stats[stat], value) ? held.stats[stat] : null;
          return (
            <div key={stat} className="rounded-lg bg-inset px-2 py-2">
              <dt className="font-mono text-xs text-faint">{STAT_LABEL[stat]}</dt>
              <dd className="font-mono text-sm text-paper tabular-nums">{formatStat(stat, value)}</dd>
              <dd className={`font-mono text-xs tabular-nums ${nearly(delta, 0) ? "text-faint" : "text-creek"}`}>
                {nearly(delta, 0) ? "bare" : `${delta > 0 ? "+" : "−"}${formatStat(stat, Math.abs(delta))}`}
              </dd>
              {memory !== null ? (
                <dd className="font-mono text-xs text-mist tabular-nums">was {formatStat(stat, memory)}</dd>
              ) : null}
            </div>
          );
        })}
      </dl>
      <h3 className="mt-4 font-mono text-xs tracking-widest text-faint">Leans</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {DISCIPLINES.map((discipline) => (
          <li key={discipline} className="grid grid-cols-[5.5rem_minmax(0,1fr)_1.5rem] items-center gap-2">
            <span className="text-sm text-mist">{DISCIPLINE_LABEL[discipline]}</span>
            <span className="h-1.5 overflow-hidden rounded-sm bg-inset">
              <span
                className="block h-full bg-creek"
                style={{ width: `${(resolution.leans[discipline] / leanMax) * 100}%` }}
              />
            </span>
            <span className="font-mono text-xs text-faint tabular-nums">{resolution.leans[discipline]}</span>
          </li>
        ))}
      </ul>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-mist">Modifier order</summary>
        <ol className="mt-2 flex flex-col gap-1">
          {resolution.modifiers.length === 0 ? <li className="text-sm text-mist">No modifiers yet.</li> : null}
          {resolution.modifiers.map((mod, index) => (
            <li key={`${mod.source}-${mod.stat}-${index}`} className="font-mono text-xs text-faint">
              {mod.phase} {mod.mode} {STAT_LABEL[mod.stat]} {mod.value} · {mod.source}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function ComparePanel({
  comparison,
  held,
  onRemember,
  onClear,
}: {
  comparison: string[];
  held: boolean;
  onRemember: () => void;
  onClear: () => void;
}) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-4">
      <h2 className="font-display text-xl">Compare</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onRemember} className="min-h-11 rounded-lg bg-paper px-3 text-sm font-semibold text-ink">
          Remember this
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!held}
          className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold text-paper disabled:opacity-40"
        >
          Clear
        </button>
      </div>
      <Lines lines={comparison.length ? comparison : ["Remember a bench, then change it."]} />
    </section>
  );
}

function Feedback({ title, lines, live = false }: { title: string; lines: string[]; live?: boolean }) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-4" aria-live={live ? "polite" : undefined}>
      <h2 className="font-display text-xl">{title}</h2>
      <Lines lines={lines} />
    </section>
  );
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {lines.map((line, index) => (
        <li key={`${line}-${index}`} className="text-sm leading-normal text-mist">
          {line}
        </li>
      ))}
    </ul>
  );
}
