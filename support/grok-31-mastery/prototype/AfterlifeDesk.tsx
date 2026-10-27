import { useEffect, useState } from "react";
import { CircleDashed, Crosshair, Lamp, Link2, Mountain, Waves } from "lucide-react";
import {
  DISCIPLINES,
  DISCIPLINE_COPY,
  MASTERY_SAVE_KEY,
  MODULE_NOTE,
  TUNING,
  commit,
  coverage,
  effectsConflict,
  freshState,
  projectRuntime,
  purchaseBlock,
  referenceCatalog,
  setGameMirror,
  toggleEquip,
  validateSave,
  type Discipline,
  type HostVerb,
  type JournalEvent,
  type MasteryRecord,
  type MasteryState,
  type Result,
  type WitnessSource,
} from "../src/index.ts";

const catalog = referenceCatalog();
const report = coverage(catalog);

const ICONS = {
  quarry: Mountain,
  creek: Waves,
  sugar: Link2,
  ash: Crosshair,
  lantern: Lamp,
  hollow: CircleDashed,
} as const;

type Kind = "inscription" | "tool" | "form" | "cross";

const LIFE_SOURCES = [
  "src.discovery.green-shovel",
  "src.discovery.sheep-pines",
  "src.discovery.marble-vein",
  "src.discovery.lantern-bond",
  "src.choice.mill",
  "src.choice.elder",
  "src.choice.resident",
  "src.encounter.sentinel",
  "src.encounter.road-wraith",
] as const;

const SOURCE_GROUPS = [
  { id: "discovery", label: "Discoveries" },
  { id: "choice", label: "Choices" },
  { id: "encounter", label: "Encounters" },
] as const;

const BODY_VERBS: HostVerb[] = ["slash", "spin", "dash", "walk"];

function hostLine(state: MasteryState) {
  if (state.game.host === "devil") {
    return `I like the mess, ${state.game.name}. Spend what you witnessed. Then finish the job.`;
  }
  return `I did not take you, ${state.game.name}. Spend what you witnessed. Then go back.`;
}

function verbLabel(verb: string) {
  if (verb.startsWith("tool:")) return verb.slice(5);
  return verb;
}

function sourceOf(id: string) {
  return catalog.sourceById.get(id);
}

function named(id: string) {
  return catalog.byId.get(id)?.name ?? sourceOf(id)?.label ?? id;
}

function escrowPending(state: MasteryState) {
  return state.escrow.reduce((sum, row) => sum + row.amount, 0);
}

function journalLine(event: JournalEvent) {
  switch (event.t) {
    case "grant":
      return event.via === "escrow"
        ? `${named(event.sourceId)} is held. A death in the county pays ${event.amount}. A hollow Release voids it.`
        : `${named(event.sourceId)} banks ${event.amount}. It will not pay again.`;
    case "death":
      if (event.hollow) return "The shrine Release was hollow. Escrow was voided, and the streak is open.";
      return event.paid > 0
        ? `Closed at ${event.deathSiteKey}. Escrow paid ${event.paid}.`
        : `Closed at ${event.deathSiteKey}. Nothing was waiting in escrow.`;
    case "purchase":
      return `${named(event.id)} is yours for ${event.cost}. It still has to be set on an action you already have.`;
    case "return":
      return "Back in the county. The desk locks until the next death.";
    case "respec": {
      const total = event.refunded.reduce((sum, row) => sum + row.amount, 0);
      return event.refunded.length ? `Returned ${total}. Bound gifts, and anything they still require, stay.` : "Nothing on the desk could be returned.";
    }
    case "refund":
      return `${named(event.id)} returned ${event.amount}.`;
    case "open-era":
      return `${event.era} is open.`;
    case "open-dungeon":
      return `${event.dungeon} is open.`;
    case "grant-bound":
      return `${named(event.id)} was given. It cannot be sold back.`;
    default:
      return "";
  }
}

function forecast(state: MasteryState) {
  if (state.phase !== "living") {
    const where = state.lastDeathSite ?? "the desk";
    return `This life is closed at ${where}. Buy more than one thing if you can, then go back.`;
  }
  const pending = escrowPending(state);
  const releaseHolds = state.meaningfulActs >= TUNING.minMeaningfulForRelease;
  if (state.suicideStreak > 0 && pending === 0) {
    return "A hollow streak is open. The road wraith pays nothing until you die in the county for real.";
  }
  if (pending === 0) {
    return releaseHolds
      ? "Nothing is waiting on death. Discoveries and choices already went to the bank."
      : `Nothing is waiting on death. A shrine Release still counts as hollow until ${TUNING.minMeaningfulForRelease} discoveries or choices are banked (${state.meaningfulActs} so far).`;
  }
  return releaseHolds
    ? `Die in the county and ${pending} comes off escrow. A shrine Release would pay it too.`
    : `Die in the county and ${pending} comes off escrow. Release at the shrine now and it is voided — ${state.meaningfulActs} of ${TUNING.minMeaningfulForRelease} meaningful acts.`;
}

function sourceMark(state: MasteryState, source: WitnessSource) {
  if (state.claimedCampaign.includes(source.id)) return "Banked";
  const held = state.escrow.find((row) => row.sourceId === source.id);
  if (held) return `Held ${held.amount}`;
  const pays = state.repeatPaid[source.id]?.pays ?? 0;
  if (source.repeat === "life" && pays >= TUNING.maxRepeatPaysPerSource) return "Spent";
  if (source.repeat === "life" && state.suicideStreak > 0) return "Muted";
  if (source.repeat === "life") return pays === 0 ? "Pays on death" : "Half, on death";
  return `+${source.amount}`;
}

function writtenChains(discipline: Discipline) {
  const authored = catalog.records.filter((record) => record.status === "authored" && record.disciplines.includes(discipline));
  const ids = new Set(authored.map((record) => record.id));
  const byId = new Map(authored.map((record) => [record.id, record]));
  const next = new Map<string, string[]>();
  for (const record of authored) {
    for (const req of record.requires) {
      if (!ids.has(req)) continue;
      const list = next.get(req) ?? [];
      list.push(record.id);
      next.set(req, list);
    }
  }
  const lines: string[] = [];
  function walk(id: string, path: string[]) {
    const kids = next.get(id) ?? [];
    if (!kids.length) {
      if (path.length > 1) lines.push(path.join(" → "));
      return;
    }
    for (const kid of kids) walk(kid, [...path, byId.get(kid)?.name ?? kid]);
  }
  for (const root of authored) {
    if (root.requires.some((id) => ids.has(id))) continue;
    walk(root.id, [root.name ?? root.id]);
  }
  return lines;
}

function equippedIds(state: MasteryState) {
  return [
    ...state.loadout.sockets,
    ...state.loadout.tools,
    ...state.loadout.forms,
    ...(state.loadout.vow ? [state.loadout.vow] : []),
    ...(state.loadout.capstone ? [state.loadout.capstone] : []),
  ];
}

function isEquipped(state: MasteryState, id: string) {
  return equippedIds(state).includes(id);
}

function human(error: string) {
  let text = error;
  const namedRecords = catalog.records.filter((record) => record.name).sort((a, b) => b.id.length - a.id.length);
  for (const record of namedRecords) text = text.replaceAll(record.id, record.name!);
  return text;
}

function conflictWithLoadout(state: MasteryState, record: MasteryRecord) {
  for (const id of equippedIds(state)) {
    if (id === record.id) continue;
    const other = catalog.byId.get(id);
    if (!other) continue;
    const hit = effectsConflict(record, other);
    if (hit) return hit.replaceAll(record.id, record.name ?? record.id).replaceAll(other.id, other.name ?? other.id);
  }
  return null;
}

export function AfterlifeDesk() {
  const [state, setState] = useState(freshState);
  const [persist, setPersist] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [discipline, setDiscipline] = useState<Discipline>("quarry");
  const [kind, setKind] = useState<Kind>("inscription");
  const [showBlank, setShowBlank] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>("quarry.ins.01");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MASTERY_SAVE_KEY);
      if (!raw) {
        setPersist(true);
        setReady(true);
        return;
      }
      const parsed = validateSave(JSON.parse(raw) as unknown, catalog);
      if (!parsed.ok) {
        setMessage(parsed.error);
        setPersist(false);
        setReady(true);
        return;
      }
      setState(parsed.value);
      setPersist(true);
    } catch {
      setMessage("The ledger on this desk could not be read. It was left untouched.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!persist) return;
    localStorage.setItem(MASTERY_SAVE_KEY, JSON.stringify(state));
  }, [state, persist]);

  const projection = projectRuntime(state, catalog);
  const rows = catalog.records
    .filter((record) => {
      if (kind === "cross") return record.kind === "cross" && record.disciplines.includes(discipline);
      return record.kind === kind && record.disciplines[0] === discipline;
    })
    .sort((a, b) => Number(b.status === "authored") - Number(a.status === "authored") || a.id.localeCompare(b.id));
  const visible = showBlank ? rows : rows.filter((record) => record.status === "authored");
  const hidden = rows.length - visible.length;
  const chains = writtenChains(discipline);
  const pending = escrowPending(state);
  const forSale = catalog.records.filter((record) => record.status === "authored" && purchaseBlock(state, record.id, catalog) === null);
  const byVerb = new Map<string, string[]>();
  for (const row of projection.attachments) {
    const list = byVerb.get(row.verb) ?? [];
    if (row.name && !list.includes(row.name)) list.push(row.name);
    byVerb.set(row.verb, list);
  }
  const verbRows = [...new Set<string>([...BODY_VERBS, ...byVerb.keys()])];

  function act(result: Result<MasteryState>) {
    if (!result.ok) {
      setMessage(human(result.error));
      return;
    }
    const grew = result.value.journal.length > state.journal.length;
    if (grew) {
      const event = result.value.journal.at(-1);
      setState(result.value);
      setMessage(event ? journalLine(event) : "");
      return;
    }
    const before = equippedIds(state);
    const after = equippedIds(result.value);
    setState(result.value);
    const added = after.find((id) => !before.includes(id));
    const removed = before.find((id) => !after.includes(id));
    if (added) setMessage(`${named(added)} now rides ${catalog.byId.get(added)?.hosts.map(verbLabel).join(", ") || "the body"}.`);
    else if (removed) setMessage(`${named(removed)} was set down. The action is bare again.`);
    else setMessage("");
  }

  function forge() {
    const fake = { ...state, witnessBank: 9999, forged: true };
    const refused = validateSave(fake, catalog);
    setMessage(refused.ok ? "The forged ledger was accepted. That is a bug." : refused.error);
  }

  function discard() {
    localStorage.removeItem(MASTERY_SAVE_KEY);
    setState(freshState());
    setPersist(true);
    setSelectedId("quarry.ins.01");
    setMessage("A fresh ledger. Nothing was carried over from the refused save.");
  }

  const selected = selectedId ? catalog.byId.get(selectedId) : undefined;

  return (
    <main data-host={state.game.host ?? "god"} className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-16 sm:px-6">
        <header className="sticky top-0 z-10 -mx-4 border-b border-line bg-bg px-4 py-3 sm:-mx-6 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-sans text-sm tracking-widest text-muted uppercase">Preincarnation · Afterlife desk</p>
              <h1 className="font-display text-3xl leading-none sm:text-5xl">
                {state.phase === "afterlife" ? "Between bodies" : "Still in the county"}
              </h1>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm tracking-widest text-muted uppercase">Witness</p>
              <p className="font-display text-5xl leading-none text-accent tabular-nums">{state.witnessBank}</p>
              {pending > 0 ? <p className="text-sm text-accent tabular-nums">+{pending} held</p> : null}
            </div>
          </div>
        </header>

        <p className="mt-4 max-w-2xl text-base text-muted">
          {state.phase === "afterlife" ? hostLine(state) : "Witness is earned here. The book stays shut until you die."}
        </p>
        <p className="mt-2 text-sm text-muted">
          {state.game.name}, {state.game.incarnation}. {state.game.year}
          <span className="tabular-nums"> · cycle {state.cycle}</span>
          {state.suicideStreak > 0 ? <span className="tabular-nums"> · hollow streak {state.suicideStreak}</span> : null}
          {` · skill from the old shop ${state.game.skillPoints}, which this desk will not spend.`}
          {state.game.lastDeed ? ` Last deed: ${state.game.lastDeed}.` : ""}
        </p>

        {message ? (
          <p role="status" className="mt-4 border border-line bg-surface px-3 py-3 text-sm">
            {message}
          </p>
        ) : null}

        <section className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl">This life</h2>
            <p className="text-sm text-muted">
              {state.phase === "living" ? forecast(state) : "Closed. Discoveries will not pay again until you return."}
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {SOURCE_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="text-sm tracking-widest text-muted uppercase">{group.label}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {LIFE_SOURCES.filter((id) => sourceOf(id)?.kind === group.id).map((id) => {
                    const source = sourceOf(id);
                    if (!source) return null;
                    const mark = sourceMark(state, source);
                    const done = mark === "Banked" || mark === "Spent";
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`min-h-11 border px-3 py-2 text-left text-sm transition-colors duration-150 ${done ? "border-line bg-bg text-muted" : "border-line bg-raised"}`}
                        onClick={() => act(commit(state, { t: "grant", sourceId: id }, catalog))}
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span>{source.label}</span>
                          <span className={`shrink-0 tabular-nums ${done ? "text-muted" : "text-accent"}`}>{mark}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 border border-line px-3 py-2 text-sm"
              onClick={() => act(commit(state, { t: "open-era", era: "era-2" }, catalog))}
            >
              {state.eraOpened.includes("era-2") ? "Era 2 is open" : "Open era 2"}
            </button>
            <button
              type="button"
              className="min-h-11 border border-line px-3 py-2 text-sm"
              onClick={() => {
                const next = setGameMirror(state, {
                  karma: state.game.karma < 0 ? 1 : -4,
                  host: state.game.karma < 0 ? "god" : "devil",
                  lastDeed: state.game.lastDeed,
                });
                setState(next);
                setMessage(next.game.host === "devil" ? "The Other Voice is at the desk. Witness did not move." : "The Voice is at the desk. Witness did not move.");
              }}
            >
              {state.game.host === "devil" ? "The Voice" : "Dirty hands"}
            </button>
            <button
              type="button"
              className="min-h-11 border border-accent px-3 py-2 text-sm text-accent"
              onClick={() =>
                act(
                  commit(
                    setGameMirror(state, { lastDeed: "Fell where the Vein is quiet", year: state.game.year + 14 }),
                    { t: "death", cause: "combat", deathSiteKey: "quarry:north-pit", cycle: state.cycle + 1 },
                    catalog,
                  ),
                )
              }
            >
              Die in the quarry
            </button>
            <button
              type="button"
              className="min-h-11 border border-line px-3 py-2 text-sm"
              onClick={() =>
                act(
                  commit(
                    setGameMirror(state, { lastDeed: "Released at the shrine", year: state.game.year + 14 }),
                    { t: "death", cause: "release", deathSiteKey: "shrine:middlebury", cycle: state.cycle + 1 },
                    catalog,
                  ),
                )
              }
            >
              Release at the shrine
            </button>
          </div>
          {state.phase === "afterlife" ? <p className="mt-3 text-sm text-muted">{forecast(state)}</p> : null}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((id) => {
                const Icon = ICONS[id];
                const on = id === discipline;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDiscipline(id)}
                    className={`inline-flex min-h-11 items-center gap-2 border px-3 py-2 text-sm transition-colors duration-150 ${on ? "border-accent bg-accent text-bg" : "border-line bg-surface text-fg"}`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {DISCIPLINE_COPY[id].name}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-muted">{DISCIPLINE_COPY[discipline].line}</p>
            {chains.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {chains.map((line) => (
                  <li key={line}>Written: {line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No written chain in this discipline yet.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {(["inscription", "tool", "form", "cross"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKind(id)}
                  className={`min-h-11 border px-3 py-2 text-sm ${kind === id ? "border-accent text-accent" : "border-line text-muted"}`}
                >
                  {id === "inscription" ? "Inscriptions" : id === "tool" ? "Tools" : id === "form" ? "Forms" : "Cross"}
                </button>
              ))}
              <button type="button" onClick={() => setShowBlank((value) => !value)} className="min-h-11 border border-line px-3 py-2 text-sm text-muted">
                {showBlank ? "Hide unwritten ids" : `Unwritten ids (${hidden})`}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">
              {state.phase === "afterlife"
                ? forSale.length > 0
                  ? `${forSale.length} written ${forSale.length === 1 ? "record is" : "records are"} affordable right now. Several purchases are allowed before you return.`
                  : "Nothing written is affordable, or a prerequisite is still shut."
                : "Prices are visible. The sale itself waits until after death."}
            </p>

            <ul className="mt-3 divide-y divide-line border-y border-line">
              {visible.length === 0 ? <li className="py-4 text-sm text-muted">Nothing authored on this shelf.</li> : null}
              {visible.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  state={state}
                  open={selected?.id === record.id}
                  onOpen={() => setSelectedId(record.id)}
                  onAct={act}
                />
              ))}
            </ul>
          </div>

          <aside className="min-w-0 border border-line bg-surface p-4">
            <h2 className="font-display text-2xl">What rides the body</h2>
            <p className="mt-1 text-sm text-muted">Inscriptions attach to slash, spin, dash, walk, and the tool already in hand. No new buttons.</p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {verbRows.map((verb) => {
                const names = byVerb.get(verb) ?? [];
                return (
                  <li key={verb} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span className="capitalize">{verbLabel(verb)}</span>
                    <span className={names.length ? "text-right" : "text-right text-muted"}>{names.length ? names.join(", ") : "Bare"}</span>
                  </li>
                );
              })}
            </ul>
            {projection.forms.length > 0 ? (
              <p className="mt-3 text-sm">Forms: {projection.forms.map((row) => row.name).join(", ")}</p>
            ) : null}

            <h2 className="mt-6 font-display text-2xl">Loadout</h2>
            <p className="mt-1 text-sm text-muted">
              {TUNING.maxSockets} inscriptions, {TUNING.maxTools} tools, {TUNING.maxForms} forms, one vow, one capstone. Setting them down is free here, and locks when you return.
            </p>
            <Seat label="Inscriptions" ids={state.loadout.sockets} cap={TUNING.maxSockets} state={state} onAct={act} />
            <Seat label="Tools" ids={state.loadout.tools} cap={TUNING.maxTools} state={state} onAct={act} />
            <Seat label="Forms" ids={state.loadout.forms} cap={TUNING.maxForms} state={state} onAct={act} />
            <Seat label="Vow" ids={state.loadout.vow ? [state.loadout.vow] : []} cap={1} state={state} onAct={act} />
            <Seat label="Capstone" ids={state.loadout.capstone ? [state.loadout.capstone] : []} cap={1} state={state} onAct={act} />

            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className="min-h-11 border border-line px-3 py-2 text-left text-sm" onClick={() => act(commit(state, { t: "respec" }, catalog))}>
                Respec — return Witness that is not bound
              </button>
              <button type="button" className="min-h-11 bg-accent px-3 py-2 text-left text-sm text-bg" onClick={() => act(commit(state, { t: "return" }, catalog))}>
                Go back and finish the job
              </button>
            </div>
          </aside>
        </section>

        <section className="mt-8 border-t border-line pt-5 text-sm text-muted">
          <p>
            Written so far: {report.authored.inscription}/{report.expected.inscription} inscriptions, {report.authored.tool}/{report.expected.tool} tools,{" "}
            {report.authored.form}/{report.expected.form} forms, {report.authored.cross}/{report.expected.cross} cross techniques. The rest of the ids are reserved, not hidden powers. Library complete: no.
          </p>
          <p className="mt-2">{MODULE_NOTE}</p>
          {state.journal.length > 0 ? (
            <details className="mt-4">
              <summary className="min-h-11 cursor-pointer py-2 text-fg">Ledger ({state.journal.length})</summary>
              <ol className="mt-1 space-y-2 border-t border-line pt-3">
                {state.journal.map((event, index) => (
                  <li key={`${event.t}-${index}`}>{journalLine(event)}</li>
                ))}
              </ol>
            </details>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="min-h-11 border border-line px-3 py-2 text-fg" onClick={forge}>
              Try a forged ledger
            </button>
            <button type="button" className="min-h-11 border border-line px-3 py-2 text-fg" onClick={discard}>
              Discard ledger
            </button>
          </div>
          {!ready ? <p className="mt-2">Opening the ledger.</p> : null}
        </section>
      </div>
    </main>
  );
}

function Seat({
  label,
  ids,
  cap,
  state,
  onAct,
}: {
  label: string;
  ids: string[];
  cap: number;
  state: MasteryState;
  onAct: (result: Result<MasteryState>) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-sm tracking-widest text-muted uppercase">
        {label} <span className="tabular-nums">{ids.length}/{cap}</span>
      </p>
      {ids.length === 0 ? <p className="mt-1 text-sm text-muted">Empty</p> : null}
      <ul>
        {ids.map((id) => (
          <li key={id}>
            <button type="button" className="mt-1 min-h-11 w-full border border-line px-2 py-2 text-left text-sm" onClick={() => onAct(toggleEquip(state, id, catalog))}>
              {catalog.byId.get(id)?.name ?? id}
              <span className="block text-muted">Set down</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecordRow({
  record,
  state,
  open,
  onOpen,
  onAct,
}: {
  record: MasteryRecord;
  state: MasteryState;
  open: boolean;
  onOpen: () => void;
  onAct: (result: Result<MasteryState>) => void;
}) {
  const owned = Boolean(state.owned[record.id]);
  const block = record.status === "authored" ? purchaseBlock(state, record.id, catalog) : "Unwritten. This slot has no ability yet.";
  const equipped = isEquipped(state, record.id);
  const canBuy = record.status === "authored" && block === null;
  const conflict = record.status === "authored" ? conflictWithLoadout(state, record) : null;
  const needs = [
    ...record.requires.map((id) => named(id)),
    ...record.requiresSources.map((id) => named(id)),
    ...record.requiresEras,
  ];

  return (
    <li className={open ? "bg-surface" : undefined}>
      <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
        <button type="button" className="min-h-11 min-w-0 flex-1 px-1 py-1 text-left" onClick={onOpen} aria-expanded={open}>
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-display text-xl leading-tight">{record.name ?? "Unwritten"}</span>
            {record.status === "authored" ? <span className="font-display text-xl text-accent tabular-nums">{record.cost}</span> : null}
          </span>
          <span className="mt-1 block text-sm text-muted">
            {record.status === "authored" ? record.hosts.map(verbLabel).join(", ") : record.id}
            {record.channel ? ` · ${record.channel}` : ""}
            {record.role !== "standard" ? ` · ${record.role}` : ""}
            {owned ? " · owned" : ""}
            {equipped ? " · riding" : ""}
          </span>
          <span className="mt-1 block text-sm">{record.summary ?? "Waiting on the session that authors this slot."}</span>
        </button>
        {record.status === "authored" ? (
          <div className="flex shrink-0 gap-2 px-1">
            <button
              type="button"
              className={`min-h-11 border px-3 py-2 text-sm ${canBuy ? "border-accent bg-accent text-bg" : "border-line text-muted"}`}
              onClick={() => onAct(commit(state, { t: "purchase", id: record.id }, catalog))}
            >
              {owned ? "Owned" : "Buy"}
            </button>
            <button
              type="button"
              className={`min-h-11 border px-3 py-2 text-sm ${equipped ? "border-line text-fg" : "border-accent text-accent"}`}
              onClick={() => onAct(toggleEquip(state, record.id, catalog))}
            >
              {equipped ? "Set down" : "Equip"}
            </button>
          </div>
        ) : null}
      </div>
      {open && record.status === "authored" ? (
        <div className="px-1 pb-4 text-sm">
          {needs.length > 0 ? <p className="text-muted">Needs {needs.join(", ")}.</p> : <p className="text-muted">No prerequisite.</p>}
          {!owned && block ? <p className="mt-1">{block}</p> : null}
          {conflict && !equipped ? <p className="mt-1">Will not ride with what is already set: {conflict}</p> : null}
          {record.modifiers.length > 0 ? (
            <p className="mt-1 text-muted">
              {record.modifiers.map((mod) => (mod.op === "flag" ? mod.key : `${mod.key} ${mod.op === "add" ? "+" : "×"}${mod.value}`)).join(" · ")}
            </p>
          ) : null}
          {owned ? (
            <button type="button" className="mt-2 min-h-11 border border-line px-3 py-2" onClick={() => onAct(commit(state, { t: "refund", id: record.id }, catalog))}>
              Return just this
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
