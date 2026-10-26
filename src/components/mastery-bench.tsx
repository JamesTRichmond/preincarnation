import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  DEMONSTRATIONS,
  DISCIPLINES,
  EFFECT_SOURCE,
  EFFECT_IDS,
  INTENTIONALLY_UNBOUND,
  MASTERY_OBJECTS,
  PACK_SHA,
  UNRESOLVED_DISCIPLINE_ABILITIES,
  beginAction,
  closedWorld,
  matrixCodes,
  objectById,
  readyWorld,
  resolveAction,
  runAudit,
  shapeView,
  stripAndFinish,
  worldFor,
  type Demonstration,
} from "@/game/mastery/index.ts";
import type { ActionProfile, Discipline, EffectId, MasteryObject, RelicId } from "@/game/mastery/types.ts";

type Tab = "bench" | "catalog" | "arena" | "matrix" | "results";

const TABS: { id: Tab; label: string }[] = [
  { id: "bench", label: "Bench" },
  { id: "catalog", label: "Catalog" },
  { id: "arena", label: "Arena" },
  { id: "matrix", label: "Matrix" },
  { id: "results", label: "Results" },
];

const GATE_RELIC: Partial<Record<EffectId, RelicId>> = {
  "action.dig": "shovel",
  "action.hook": "hookshot",
  "action.smash": "hammer",
  "action.bow": "bow",
  "action.lantern": "lantern",
  "action.cape": "cape",
  "action.net": "net",
  "action.mirror": "mirror",
  "action.cane": "cane",
};

const TOOLS = EFFECT_IDS.filter((id) => MASTERY_OBJECTS.some((item) => item.compatibleEffects.includes(id)));

const SAMPLES: { effect: EffectId; a: string; b: string; label: string }[] = [
  { effect: "action.smash", a: "loot.expansion.mastery.001", b: "loot.expansion.mastery.014", label: "Refused pair" },
  { effect: "action.slash", a: "loot.expansion.mastery.047", b: "loot.expansion.mastery.052", label: "Two burns" },
  { effect: "action.lantern", a: "loot.expansion.mastery.055", b: "loot.expansion.mastery.058", label: "Two lamp shapes" },
  { effect: "action.bow", a: "loot.expansion.mastery.042", b: "loot.expansion.mastery.045", label: "Two nocks" },
  { effect: "action.cape", a: "loot.expansion.mastery.072", b: "loot.expansion.mastery.076", label: "Two phases" },
  { effect: "action.bomb", a: "loot.expansion.mastery.002", b: "loot.expansion.mastery.012", label: "Spoon and nail" },
];

const FIELD_LABEL: Record<string, string> = {
  blocked: "Gate",
  blockReason: "Why",
  fizzle: "Fizzle",
  radius: "Radius",
  reach: "Reach",
  windup: "Windup",
  cooldown: "Wait",
  duration: "Duration",
  distance: "Distance",
  damage: "Damage",
  speed: "Speed",
  chargeThreshold: "Release",
  chargeRate: "Draw",
  pattern: "Shape",
  lightShape: "Light",
  targetFilter: "Target",
  targetCount: "Targets",
  statusBurn: "Burn",
  statusSlow: "Slow",
  selfSlow: "Self slow",
  knockback: "Knockback",
  iFrames: "Invulnerable",
  heal: "Heal",
  lightOuter: "Outer light",
  lightInner: "Inner light",
  lightRear: "Rear light",
  surveyRadius: "Survey",
  coverage: "Tiles",
  lanternOn: "Lamp on",
  quarryOpen: "Vein open",
  excavated: "Dug",
  eroded: "Eroded",
  tileOpened: "Tile opened",
};

export function MasteryBench({ onClose }: { onClose: () => void }) {
  const report = useMemo(() => runAudit(), []);
  const matrix = useMemo(() => matrixCodes(), []);
  const [tab, setTab] = useState<Tab>("bench");
  const [discipline, setDiscipline] = useState<Discipline | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(MASTERY_OBJECTS[0].id);
  const [benchEffect, setBenchEffect] = useState<EffectId>("action.smash");
  const [benchA, setBenchA] = useState<string | null>(MASTERY_OBJECTS[0].id);
  const [benchB, setBenchB] = useState<string | null>(null);
  const [benchGate, setBenchGate] = useState(false);
  const [demoId, setDemoId] = useState(DEMONSTRATIONS[0].id);
  const [gateClosed, setGateClosed] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [pair, setPair] = useState<[number, number]>([0, 1]);

  const selected = objectById(selectedId) ?? MASTERY_OBJECTS[0];
  const filtered = MASTERY_OBJECTS.filter((item) => {
    if (discipline !== "all" && item.discipline !== discipline) return false;
    if (!query.trim()) return true;
    const hay = `${item.id} ${item.name} ${item.discipline} ${item.compatibleEffects.join(" ")}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  function narrow(nextDiscipline: Discipline | "all", nextQuery: string) {
    setDiscipline(nextDiscipline);
    setQuery(nextQuery);
    const next = MASTERY_OBJECTS.filter((item) => {
      if (nextDiscipline !== "all" && item.discipline !== nextDiscipline) return false;
      if (!nextQuery.trim()) return true;
      const hay = `${item.id} ${item.name} ${item.discipline} ${item.compatibleEffects.join(" ")}`.toLowerCase();
      return hay.includes(nextQuery.trim().toLowerCase());
    });
    if (next.length && !next.some((item) => item.id === selectedId)) setSelectedId(next[0].id);
  }

  function wear(effect: EffectId, first: string | null, second: string | null) {
    setTab("bench");
    setBenchEffect(effect);
    setBenchA(first);
    setBenchB(second);
    setBenchGate(false);
  }

  function pickTool(effect: EffectId) {
    setBenchEffect(effect);
    setBenchGate(false);
    const fits = (id: string | null) => !!id && objectById(id)?.compatibleEffects.includes(effect);
    if (!fits(benchA)) setBenchA(MASTERY_OBJECTS.find((item) => item.compatibleEffects.includes(effect))?.id ?? null);
    if (!fits(benchB)) setBenchB(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex max-w-3xl items-start justify-between gap-4">
        <div>
        <p className="font-mono text-xs tracking-wide text-fg-muted uppercase">PREINCARNATION · loot.expansion.mastery</p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-medium tracking-tight text-fg sm:text-5xl">
          Mastery objects
        </h1>
        <p className="mt-3 max-w-2xl text-base text-fg-muted">
          Bind one or two fittings to a tool you already carry. The bare action stays available. A shut gate ignores both.
        </p>
        </div>
        <button type="button" onClick={onClose} className="min-h-11 shrink-0 rounded-sm bg-fg px-4 text-sm font-medium text-bg">
          Back to the county
        </button>
      </header>

      <div className="mb-6 flex gap-2 overflow-x-auto" role="tablist" aria-label="Pack sections">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={
              "min-h-11 shrink-0 rounded-sm px-4 text-sm font-medium transition-colors " +
              (tab === entry.id ? "bg-primary text-primary-fg" : "bg-bg-elevated text-fg ring-1 ring-border")
            }
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "bench" ? (
        <Bench
          effect={benchEffect}
          first={benchA}
          second={benchB}
          gateClosed={benchGate}
          onEffect={pickTool}
          onFirst={(id) => {
            setBenchA(id);
            if (id && id === benchB) setBenchB(null);
          }}
          onSecond={setBenchB}
          onGate={setBenchGate}
          onSample={(first, second) => {
            setBenchA(first);
            setBenchB(second);
            setBenchGate(false);
          }}
        />
      ) : null}
      {tab === "catalog" ? (
        <Catalog
          items={filtered}
          selected={selected}
          discipline={discipline}
          query={query}
          onQuery={(value) => narrow(discipline, value)}
          onDiscipline={(value) => narrow(value, query)}
          onSelect={setSelectedId}
          onTry={(item) => wear(item.compatibleEffects[0], item.id, null)}
        />
      ) : null}
      {tab === "arena" ? (
        <Arena
          demoId={demoId}
          gateClosed={gateClosed}
          removed={removed}
          onDemo={(id) => {
            setDemoId(id);
            setRemoved(false);
            setGateClosed(false);
          }}
          onGate={setGateClosed}
          onRemove={() => setRemoved(true)}
        />
      ) : null}
      {tab === "matrix" ? <Matrix matrix={matrix} pair={pair} onPair={setPair} /> : null}
      {tab === "results" ? <Results passed={report.passed} checks={report.checks} failures={report.failures} incompatible={report.incompatiblePairs.length} duplicate={report.duplicatePairs.length} /> : null}
    </main>
  );
}

function Bench(props: {
  effect: EffectId;
  first: string | null;
  second: string | null;
  gateClosed: boolean;
  onEffect: (effect: EffectId) => void;
  onFirst: (id: string | null) => void;
  onSecond: (id: string | null) => void;
  onGate: (closed: boolean) => void;
  onSample: (first: string, second: string) => void;
}) {
  const options = MASTERY_OBJECTS.filter((item) => item.compatibleEffects.includes(props.effect));
  const items = [props.first, props.second].map((id) => (id ? objectById(id) : undefined)).filter((item): item is MasteryObject => !!item);
  const world = props.gateClosed ? closedWorld(props.effect) : openWorld(props.effect, items);
  const baseline = resolveAction(props.effect, [], world);
  const modified = resolveAction(props.effect, items, world);
  const baseProfile = baseline.ok ? baseline.profile : null;
  const wornProfile = modified.ok ? modified.profile : null;
  const sample = SAMPLES.find((entry) => entry.effect === props.effect);

  return (
    <section className="rounded-xl bg-bg-elevated p-4 ring-1 ring-border sm:p-6">
      <h2 className="font-display text-3xl font-medium tracking-tight">Try a loadout</h2>
      <p className="mt-2 max-w-2xl text-sm text-fg-muted">Two fittings, one tool. The dashed mark is what you already own.</p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Tools">
        {TOOLS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === props.effect}
            onClick={() => props.onEffect(id)}
            className={
              "min-h-11 shrink-0 rounded-sm px-3 text-sm font-medium " +
              (id === props.effect ? "bg-fg text-primary-fg" : "bg-bg text-fg ring-1 ring-border")
            }
          >
            {toolLabel(id)}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Slot label="First fitting" value={props.first} options={options} onChange={props.onFirst} />
        <Slot label="Second fitting" value={props.second} options={options.filter((item) => item.id !== props.first)} onChange={props.onSecond} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => props.onGate(!props.gateClosed)}
          className="min-h-11 rounded-sm bg-bg px-3 text-sm ring-1 ring-border"
        >
          {props.gateClosed ? "Open the tool gate" : "Close the tool gate"}
        </button>
        {sample ? (
          <button
            type="button"
            onClick={() => props.onSample(sample.a, sample.b)}
            className="min-h-11 rounded-sm bg-bg px-3 text-sm ring-1 ring-border"
          >
            {sample.label}
          </button>
        ) : null}
      </div>
      <p className="mt-5 font-display text-2xl font-medium tracking-tight">{headline(baseProfile, wornProfile, modified.ok ? null : modified.reason)}</p>
      {!modified.ok ? <p className="mt-2 text-sm text-danger">{modified.reason}</p> : null}
      {baseProfile?.blocked ? <p className="mt-2 text-sm text-danger">{baseProfile.blockReason}</p> : null}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <div>
          <ShapeCanvas baseline={baseProfile} modified={wornProfile} />
          <p className="mt-2 text-xs text-fg-muted">Dashed is the bare tool. Solid is the loadout.</p>
        </div>
        <div>
          <Compare base={baseProfile} worn={wornProfile} stripped={null} />
          {items.map((item) => (
            <p key={item.id} className="mt-3 text-sm text-fg-muted">
              <span className="font-medium text-fg">{item.name}. </span>
              {item.tradeoff}
            </p>
          ))}
          <p className="mt-3 text-xs text-fg-subtle">
            {toolLabel(props.effect)} — {EFFECT_SOURCE[props.effect]}
          </p>
        </div>
      </div>
    </section>
  );
}

function Slot(props: {
  label: string;
  value: string | null;
  options: MasteryObject[];
  onChange: (id: string | null) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {props.label}
      <select
        value={props.value ?? ""}
        onChange={(event) => props.onChange(event.target.value || null)}
        className="mt-2 min-h-11 w-full rounded-sm bg-bg px-3 text-sm font-normal ring-1 ring-border outline-none focus:ring-primary"
      >
        <option value="">Empty</option>
        {props.options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.id.slice(-3)} {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function openWorld(effect: EffectId, items: MasteryObject[]) {
  const world = items[0] ? worldFor(items[0]) : readyWorld();
  const relic = GATE_RELIC[effect];
  if (relic) world.ySlot = relic;
  if (effect === "action.swim" || items.some((item) => item.requires.flippers || item.when?.inWater)) world.inWater = true;
  for (const item of items.slice(1)) {
    if (item.when?.mapId) world.mapId = item.when.mapId;
    if (item.when?.minHp != null) world.hp = Math.max(world.hp, item.when.minHp);
  }
  if (effect === "action.bow") world.arrows = Math.max(1, world.arrows);
  if (effect === "action.bomb") world.bombs = Math.max(1, world.bombs);
  if ((effect === "action.cape" || effect === "action.cane") && world.mp < 1) world.mp = 4;
  if (effect === "action.sip" && world.bottles.every((bottle) => bottle === "empty")) world.bottles = ["syrup", "empty"];
  return world;
}

function Catalog(props: {
  items: MasteryObject[];
  selected: MasteryObject;
  discipline: Discipline | "all";
  query: string;
  onQuery: (value: string) => void;
  onDiscipline: (value: Discipline | "all") => void;
  onSelect: (id: string) => void;
  onTry: (item: MasteryObject) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <section className="rounded-xl bg-bg-elevated p-4 ring-1 ring-border">
        <label className="block text-sm font-medium" htmlFor="find">
          Find
        </label>
        <FindField value={props.query} onQuery={props.onQuery} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Filter label="All" active={props.discipline === "all"} onClick={() => props.onDiscipline("all")} />
          {DISCIPLINES.map((name) => (
            <Filter key={name} label={titleCase(name)} active={props.discipline === name} onClick={() => props.onDiscipline(name)} />
          ))}
        </div>
        <ul className="mt-4 max-h-80 space-y-1 overflow-auto lg:max-h-[32rem]">
          {props.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => props.onSelect(item.id)}
                className={
                  "flex min-h-11 w-full items-baseline justify-between gap-3 rounded-sm px-2 text-left text-sm " +
                  (item.id === props.selected.id ? "bg-primary text-primary-fg" : "hover:bg-bg-subtle")
                }
              >
                <span className="font-medium">{item.name}</span>
                <span className="font-mono text-xs opacity-80">{item.id.slice(-3)}</span>
              </button>
            </li>
          ))}
          {!props.items.length ? <li className="px-2 py-6 text-sm text-fg-muted">Nothing matches.</li> : null}
        </ul>
      </section>
      <Detail item={props.selected} onTry={props.onTry} />
    </div>
  );
}

function Detail({ item, onTry }: { item: MasteryObject; onTry: (item: MasteryObject) => void }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [item.id]);
  const effect = item.compatibleEffects[0];
  const world = worldFor(item);
  const baseline = resolveAction(effect, [], world);
  const modified = resolveAction(effect, [item], world);
  const baseProfile = baseline.ok ? baseline.profile : null;
  const wornProfile = modified.ok ? modified.profile : null;
  return (
    <article ref={ref} className="rounded-xl bg-bg-elevated p-4 ring-1 ring-border sm:p-6">
      <p className="font-mono text-xs text-fg-muted">{item.id}</p>
      <h2 className="mt-1 font-display text-3xl font-medium tracking-tight">{item.name}</h2>
      <p className="mt-1 text-sm text-fg-muted">
        {titleCase(item.discipline)} · {item.kind}
        {item.exclusivityGroup ? ` · refuses others marked ${item.exclusivityGroup}` : ""}
      </p>
      <p className="mt-4 text-base leading-relaxed">{item.changedBehavior}</p>
      <p className="mt-2 text-sm text-fg-muted">{item.tradeoff}</p>
      <button
        type="button"
        onClick={() => onTry(item)}
        className="mt-4 min-h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
      >
        Try it on the bench
      </button>
      <p className="mt-5 font-display text-2xl font-medium tracking-tight">
        {headline(baseProfile, wornProfile, modified.ok ? null : modified.reason)}
      </p>
      <p className="mt-1 text-xs text-fg-subtle">
        {toolLabel(effect)} · {EFFECT_SOURCE[effect]}
      </p>
      <Compare base={baseProfile} worn={wornProfile} stripped={null} />
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <Fact label="Found" value={item.discovery} />
        <Fact label="Where it came from" value={item.provenance} />
        <Fact label="Equip" value={item.equipRestrictions} />
        <Fact label="Use" value={item.useRestrictions} />
        <Fact label="Removal" value={item.removal} />
        <Fact label="On death" value={`${item.save.onDeath}. ${item.save.note}`} />
      </dl>
      <p className="mt-4 text-xs text-fg-subtle">Discipline ability unresolved. Not written into the county save.</p>
    </article>
  );
}

function Fact(props: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-fg-subtle uppercase">{props.label}</dt>
      <dd className="mt-1 text-sm leading-relaxed">{props.value}</dd>
    </div>
  );
}

function Arena(props: {
  demoId: string;
  gateClosed: boolean;
  removed: boolean;
  onDemo: (id: string) => void;
  onGate: (value: boolean) => void;
  onRemove: () => void;
}) {
  const demo = DEMONSTRATIONS.find((entry) => entry.id === props.demoId) ?? DEMONSTRATIONS[0];
  const view = useMemo(() => runDemo(demo, props.gateClosed, props.removed), [demo, props.gateClosed, props.removed]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <section className="rounded-xl bg-bg-elevated p-4 ring-1 ring-border">
        <h2 className="font-display text-xl font-medium">Twenty objects</h2>
        <p className="mt-1 text-sm text-fg-muted">All six disciplines. The bare tool is the dashed mark.</p>
        <ul className="mt-3 max-h-[36rem] space-y-1 overflow-auto">
          {DEMONSTRATIONS.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => props.onDemo(entry.id)}
                className={
                  "min-h-11 w-full rounded-sm px-2 text-left text-sm " +
                  (entry.id === demo.id ? "bg-primary text-primary-fg" : "hover:bg-bg-subtle")
                }
              >
                <span className="block font-medium">{entry.title}</span>
                <span className="text-xs opacity-80">{entry.disciplineNote}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl bg-bg-elevated p-4 ring-1 ring-border sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight">{demo.title}</h2>
            <p className="mt-2 max-w-xl text-sm text-fg-muted">{demo.blurb}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => props.onGate(!props.gateClosed)}
              className="min-h-11 rounded-sm bg-bg px-3 text-sm ring-1 ring-border"
            >
              {props.gateClosed ? "Open the tool gate" : "Close the tool gate"}
            </button>
            <button
              type="button"
              disabled={!view.canInterrupt || props.gateClosed}
              onClick={props.onRemove}
              className="min-h-11 rounded-sm bg-primary px-3 text-sm text-primary-fg disabled:opacity-40"
            >
              Remove during windup
            </button>
          </div>
        </div>
        {view.baseProfile?.blocked ? (
          <p className="mt-3 text-sm text-danger">{view.baseProfile.blockReason}</p>
        ) : null}
        <Compare base={view.baseProfile} worn={view.wornProfile} stripped={props.removed ? view.strippedProfile : null} />
        <ShapeCanvas baseline={view.baseProfile} modified={view.showProfile} />
        <p className="mt-2 text-xs text-fg-muted">Dashed is the bare tool. Solid is the object. A shut gate draws neither.</p>
        <p className="mt-1 text-xs text-fg-subtle">
          {demo.effect} — {EFFECT_SOURCE[demo.effect]}
        </p>
        {view.note ? <p className="mt-3 text-sm text-danger">{view.note}</p> : null}
      </section>
    </div>
  );
}

function runDemo(demo: Demonstration, gateClosed: boolean, removed: boolean) {
  const items = demo.objectIds.map((id) => objectById(id)).filter((item): item is MasteryObject => !!item);
  const world = gateClosed ? closedWorld(demo.effect) : items[0] ? worldFor(items[0], demo.world ?? {}) : readyWorld();
  const baseline = resolveAction(demo.effect, [], world);
  const modified = resolveAction(demo.effect, items, world);
  const begun = beginAction(demo.effect, items, world);
  const stripped = begun.phase === "winding" && items[0] ? stripAndFinish(begun.pending, items[0].id) : null;
  const baseProfile = baseline.ok ? baseline.profile : null;
  const wornProfile = modified.ok ? modified.profile : null;
  const strippedProfile = stripped && stripped.result.ok ? stripped.result.profile : null;
  const showProfile = removed && strippedProfile ? strippedProfile : wornProfile;
  return {
    baseProfile,
    wornProfile,
    strippedProfile,
    showProfile,
    canInterrupt: begun.phase === "winding",
    note: !modified.ok ? modified.reason : removed ? "Fitting removed. Press costs stay. The rest of the action is the bare tool." : null,
  };
}

function Compare(props: { base: ActionProfile | null; worn: ActionProfile | null; stripped: ActionProfile | null }) {
  if (!props.base || !props.worn) return null;
  const fields = diffFields(props.base, props.worn, props.stripped).filter((field) => field !== "blockReason" || props.base?.blocked || props.worn?.blocked);
  if (!fields.length) return <p className="mt-4 text-sm text-fg-muted">Same numbers as the bare tool.</p>;
  return (
    <div className="mt-4 overflow-x-auto">
      <div
        className={
          "grid min-w-[18rem] gap-x-3 text-sm " +
          (props.stripped ? "grid-cols-[minmax(5rem,1.2fr)_repeat(3,minmax(4rem,1fr))]" : "grid-cols-[minmax(5rem,1.3fr)_repeat(2,minmax(4rem,1fr))]")
        }
      >
        <span className="py-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">Field</span>
        <span className="py-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">Bare</span>
        <span className="py-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">Worn</span>
        {props.stripped ? <span className="py-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">Pulled off</span> : null}
        {fields.map((field) => (
          <Row key={field} field={field} base={props.base} worn={props.worn} stripped={props.stripped} />
        ))}
      </div>
    </div>
  );
}

function Row(props: { field: string; base: ActionProfile | null; worn: ActionProfile | null; stripped: ActionProfile | null }) {
  const changed = cell(props.base, props.field) !== cell(props.worn, props.field);
  return (
    <>
      <span className="border-t border-border py-2 font-medium">{fieldLabel(props.field)}</span>
      <span className="border-t border-border py-2 font-mono text-xs text-fg-muted">{cell(props.base, props.field)}</span>
      <span className={"border-t border-border py-2 font-mono text-xs " + (changed ? "text-fg" : "text-fg-muted")}>{cell(props.worn, props.field)}</span>
      {props.stripped ? <span className="border-t border-border py-2 font-mono text-xs">{cell(props.stripped, props.field)}</span> : null}
    </>
  );
}

function diffFields(base: ActionProfile, worn: ActionProfile, stripped: ActionProfile | null): string[] {
  const viewA = shapeView(base) as Record<string, string | number | boolean>;
  const viewB = shapeView(worn) as Record<string, string | number | boolean>;
  const viewC = stripped ? (shapeView(stripped) as Record<string, string | number | boolean>) : null;
  const keys = Object.keys(viewA).filter((key) => viewA[key] !== viewB[key] || (viewC && viewC[key] !== viewA[key]));
  return keys.length ? keys : ["blocked", "blockReason"];
}

function cell(profile: ActionProfile | null, field: string): string {
  if (!profile) return "—";
  const view = shapeView(profile) as Record<string, string | number | boolean>;
  if (field in view) return String(view[field]);
  return "—";
}

function ShapeCanvas(props: { baseline: ActionProfile | null; modified: ActionProfile | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = rect.width;
    const height = rect.height;
    ctx.fillStyle = "#10182c";
    ctx.fillRect(0, 0, width, height);
    const open = [props.baseline, props.modified].filter((profile): profile is ActionProfile => !!profile && !profile.blocked);
    const span = Math.max(12, ...open.map(basis));
    const scale = (Math.min(width, height) * 0.4) / span;
    const cx = width * 0.5;
    const cy = height * 0.52;
    if (props.baseline && !props.baseline.blocked) strokeProfile(ctx, props.baseline, cx, cy, scale, "#c4bba8", true);
    if (props.modified && !props.modified.blocked) strokeProfile(ctx, props.modified, cx, cy, scale, "#e8c36a", false);
    if (!open.length) {
      ctx.fillStyle = "#c4bba8";
      ctx.font = "14px 'Source Sans 3', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Gate shut. The object does not open it.", width / 2, height / 2);
      return;
    }
    ctx.fillStyle = "#f4efe2";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [props.baseline, props.modified]);

  return <canvas ref={ref} aria-hidden="true" className="mt-4 h-44 w-full rounded-lg bg-bg ring-1 ring-border" />;
}

function basis(profile: ActionProfile): number {
  return Math.max(profile.radius, profile.reach, profile.distance, profile.lightOuter, 12);
}

function strokeProfile(
  ctx: CanvasRenderingContext2D,
  profile: ActionProfile,
  cx: number,
  cy: number,
  scale: number,
  color: string,
  dashed: boolean,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = dashed ? 2.75 : 3.5;
  ctx.setLineDash(dashed ? [6, 5] : []);
  const shape = profile.lightShape !== "none" ? profile.lightShape : profile.pattern;
  const ring = Math.max(profile.radius, profile.lightOuter) * scale;
  if (ring > 6 && shape !== "line" && shape !== "shot" && shape !== "forward-phase" && shape !== "sidestep" && shape !== "blink") {
    ctx.beginPath();
    ctx.arc(cx, cy, ring, 0, Math.PI * 2);
    if (!dashed) {
      ctx.globalAlpha = 0.16;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.stroke();
  }
  if (profile.lightInner > 0 && profile.lightOuter > profile.lightInner) {
    ctx.beginPath();
    ctx.arc(cx, cy, profile.lightInner * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  if (shape === "plus") {
    const arm = Math.max(28, (profile.radius || 16) * scale);
    ctx.moveTo(cx - arm, cy);
    ctx.lineTo(cx + arm, cy);
    ctx.moveTo(cx, cy - arm);
    ctx.lineTo(cx, cy + arm);
  } else if (shape === "single" || shape === "point") {
    const tile = Math.max(16, (profile.radius || 16) * scale * 0.28);
    ctx.rect(cx + tile * 0.35, cy - tile / 2, tile, tile);
  } else if (shape === "line3") {
    const arm = Math.max(36, (profile.radius || 16) * scale);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + arm, cy - arm * 0.35);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + arm, cy);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + arm, cy + arm * 0.35);
  } else if (shape === "cone" || shape === "narrow-cone") {
    const r = Math.max(ring, 36);
    const spread = shape === "narrow-cone" ? 0.22 : 0.45;
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -spread, spread);
    ctx.closePath();
  } else if (shape === "rear-cone") {
    const r = Math.max(ring, 36);
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, Math.PI - 0.4, Math.PI + 0.4);
    ctx.closePath();
  } else if (shape === "wide" || shape === "low") {
    const r = Math.max(ring, 36);
    ctx.ellipse(cx, cy, r, shape === "low" ? r * 0.38 : r * 0.62, 0, 0, Math.PI * 2);
  } else if (shape === "forward-cut") {
    const r = Math.max((profile.reach || profile.radius) * scale, 28);
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, -0.7, 0.7);
    ctx.closePath();
  } else if (shape === "shot" || shape === "line" || shape === "forward-phase" || shape === "water-step") {
    const len = Math.max(48, (profile.distance || profile.radius || 20) * scale);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + len, cy);
  } else if (shape === "split2") {
    const len = Math.max(48, (profile.distance || profile.radius || 20) * scale);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + len, cy - len * 0.28);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + len, cy + len * 0.28);
  } else if (shape === "splash") {
    const r = Math.max(ring, 24);
    ctx.arc(cx + r * 0.7, cy, r * 0.45, 0, Math.PI * 2);
  } else if (shape === "sidestep") {
    const len = Math.max(36, (profile.distance || 20) * scale);
    ctx.moveTo(cx, cy - len * 0.45);
    ctx.lineTo(cx, cy + len * 0.45);
  } else if (shape === "blink") {
    const len = Math.max(40, (profile.distance || 20) * scale);
    ctx.moveTo(cx - 6, cy);
    ctx.lineTo(cx + 6, cy);
    ctx.moveTo(cx + len, cy);
    ctx.arc(cx + len, cy, 7, 0, Math.PI * 2);
  } else if (shape === "block") {
    ctx.arc(cx, cy, 34, -1.1, 1.1);
  } else if (shape === "radial" || shape === "circle") {
    ctx.arc(cx, cy, Math.max(ring, 20), 0, Math.PI * 2);
  } else {
    const r = Math.max(ring, (profile.distance || 16) * scale, 18);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
  ctx.stroke();
  if (profile.reach > profile.radius + 0.5 && shape !== "forward-cut") {
    ctx.beginPath();
    ctx.arc(cx, cy, profile.reach * scale, -0.55, 0.55);
    ctx.stroke();
  }
  ctx.restore();
}

function Matrix(props: { matrix: string[][]; pair: [number, number]; onPair: (pair: [number, number]) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState("Choose two objects.");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const n = props.matrix.length;
    const cell = 7;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = n * cell * dpr;
    canvas.height = n * cell * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const color: Record<string, string> = { S: "#f4efe2", X: "#c45c4a", D: "#e8c36a", ".": "#162044" };
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = color[props.matrix[y][x]] ?? "#e6e2d8";
        ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
      }
    }
    ctx.strokeStyle = "#f4efe2";
    ctx.strokeRect(props.pair[0] * cell, props.pair[1] * cell, cell - 1, cell - 1);
  }, [props.matrix, props.pair]);

  const left = MASTERY_OBJECTS[props.pair[0]];
  const right = MASTERY_OBJECTS[props.pair[1]];
  const relation = props.matrix[props.pair[1]]?.[props.pair[0]] ?? ".";

  return (
    <section className="rounded-xl bg-bg-elevated p-4 ring-1 ring-border sm:p-6">
      <h2 className="font-display text-3xl font-medium tracking-tight">Compatibility</h2>
      <p className="mt-2 max-w-2xl text-sm text-fg-muted">
        Red refuses the pair. Slate means a shared bonus is diminished, not doubled. Pale cells do not interact.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PairSelect label="First object" index={props.pair[0]} onChange={(index) => props.onPair([index, props.pair[1]])} />
        <PairSelect label="Second object" index={props.pair[1]} onChange={(index) => props.onPair([props.pair[0], index])} />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-fg-muted">
        <Legend swatch="bg-danger" label="Incompatible" />
        <Legend swatch="bg-primary" label="Duplicate, capped" />
        <Legend swatch="bg-bg-subtle" label="Independent" />
      </div>
      <canvas
        ref={ref}
        className="mt-4 w-full max-w-3xl touch-manipulation rounded-lg ring-1 ring-border"
        onClick={(event) => pick(event, props.onPair, setHover)}
      />
      <p className="mt-3 text-sm text-fg-muted">{hover}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PairCard item={left} />
        <PairCard item={right} />
      </div>
      <p className="mt-3 text-sm font-medium">{pairSentence(left, right, relation)}</p>
    </section>
  );
}

function pick(
  event: MouseEvent<HTMLCanvasElement>,
  onPair: (pair: [number, number]) => void,
  setHover: (value: string) => void,
) {
  const canvas = event.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const n = MASTERY_OBJECTS.length;
  const x = Math.min(n - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * n)));
  const y = Math.min(n - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * n)));
  onPair([x, y]);
  setHover(`${MASTERY_OBJECTS[y].name} × ${MASTERY_OBJECTS[x].name}`);
}

function PairCard({ item }: { item: MasteryObject | undefined }) {
  if (!item) return null;
  return (
    <div className="rounded-lg bg-bg p-3 ring-1 ring-border">
      <p className="font-mono text-xs text-fg-subtle">{item.id}</p>
      <p className="font-medium">{item.name}</p>
      <p className="text-sm text-fg-muted">{item.compatibleEffects.join(", ")}</p>
    </div>
  );
}

function PairSelect(props: { label: string; index: number; onChange: (index: number) => void }) {
  return (
    <label className="block text-sm font-medium">
      {props.label}
      <select
        value={props.index}
        onChange={(event) => props.onChange(Number(event.target.value))}
        className="mt-2 min-h-11 w-full rounded-sm bg-bg px-3 text-sm font-normal ring-1 ring-border outline-none focus:ring-primary"
      >
        {MASTERY_OBJECTS.map((item, index) => (
          <option key={item.id} value={index}>
            {item.id.slice(-3)} {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function pairSentence(left: MasteryObject | undefined, right: MasteryObject | undefined, code: string): string {
  if (!left || !right) return "";
  if (code === "S") return "Same object.";
  const shared = left.compatibleEffects.find((effect) => right.compatibleEffects.includes(effect));
  if (!shared) return "They do not touch the same action.";
  const result = resolveAction(shared, [left, right], openWorld(shared, [left, right]));
  if (!result.ok) return result.reason;
  if (code === "D") return `They can both be worn on ${toolLabel(shared)}. The shared bonus counts in full, then half.`;
  return `Both fit on ${toolLabel(shared)}. Their numbers stay independent.`;
}

function headline(base: ActionProfile | null, worn: ActionProfile | null, refused: string | null): string {
  if (refused) return "The pair does not bind.";
  if (!base || !worn) return "Nothing resolved.";
  if (base.blocked) return "The gate is shut.";
  const fields = diffFields(base, worn, null).filter((field) => field !== "blocked" && field !== "blockReason");
  if (!fields.length) return "Same shape as the bare tool.";
  const preferred = ["pattern", "lightShape", "coverage", "radius", "distance", "damage", "heal", "statusBurn", "windup", "iFrames"];
  const first = preferred.find((field) => fields.includes(field)) ?? fields[0];
  return `${fieldLabel(first)} ${cell(base, first)} → ${cell(worn, first)}`;
}

function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field;
}

function toolLabel(effect: EffectId): string {
  const name = effect.replace("action.", "");
  return name.slice(0, 1).toUpperCase() + name.slice(1);
}

function Results(props: {
  passed: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
  failures: string[];
  incompatible: number;
  duplicate: number;
}) {
  return (
    <section className="rounded-xl bg-bg-elevated p-4 ring-1 ring-border sm:p-6">
      <h2 className="font-display text-3xl font-medium tracking-tight">{props.passed ? "All eighty held" : "Checks failed"}</h2>
      <p className="mt-2 max-w-2xl text-sm text-fg-muted">
        Each object changes a real action, loses something for that change, and does nothing when the tool gate is shut.
        Shared bonuses do not double. A fitting pulled off during windup keeps the press cost and drops its own numbers.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Incompatible pairs" value={String(props.incompatible)} />
        <Stat label="Capped duplicates" value={String(props.duplicate)} />
        <Stat label="Source" value={PACK_SHA.slice(0, 7)} />
      </dl>
      <ul className="mt-5 space-y-2">
        {props.checks.map((check) => (
          <li key={check.name} className="flex items-baseline justify-between gap-3 text-sm">
            <span>{check.name}</span>
            <span className={check.ok ? "text-karma-pos" : "text-danger"}>{check.ok ? check.detail : "Failed"}</span>
          </li>
        ))}
      </ul>
      {props.failures.length ? (
        <ul className="mt-4 space-y-1 text-sm text-danger">
          {props.failures.map((failure) => (
            <li key={failure}>{failure}</li>
          ))}
        </ul>
      ) : null}
      <h3 className="mt-8 font-display text-xl font-medium">Unresolved on purpose</h3>
      <ul className="mt-2 space-y-2 text-sm text-fg-muted">
        {Object.entries(UNRESOLVED_DISCIPLINE_ABILITIES).map(([name, note]) => (
          <li key={name}>
            <span className="font-medium text-fg">{titleCase(name)}. </span>
            {note}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-fg-muted">
        Left unmodified: {INTENTIONALLY_UNBOUND.join(", ")}. Wraith Bond, Open Sight, Karmic Echo, and the Soloverse Key
        are not combat verbs in this pack.
      </p>
    </section>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg p-3 ring-1 ring-border">
      <dt className="text-xs tracking-wide text-fg-subtle uppercase">{props.label}</dt>
      <dd className="mt-1 font-mono text-lg">{props.value}</dd>
    </div>
  );
}

function FindField(props: { value: string; onQuery: (value: string) => void }) {
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);
  if (!live) {
    return <div className="mt-2 min-h-11 w-full rounded-sm bg-bg ring-1 ring-border" />;
  }
  return (
    <input
      id="find"
      value={props.value}
      onChange={(event) => props.onQuery(event.target.value)}
      placeholder="Name, id, or action"
      className="mt-2 min-h-11 w-full rounded-sm bg-bg px-3 text-sm ring-1 ring-border outline-none focus:ring-primary"
    />
  );
}

function Filter(props: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        "min-h-11 rounded-sm px-3 text-sm " + (props.active ? "bg-fg text-primary-fg" : "bg-bg text-fg ring-1 ring-border")
      }
    >
      {props.label}
    </button>
  );
}

function Legend(props: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block size-3 rounded-sm ${props.swatch}`} />
      {props.label}
    </span>
  );
}

function titleCase(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
