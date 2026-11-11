import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Ban, Eye, Lock, ScrollText, Search, Shovel, Wrench } from "lucide-react";
import { CATALOG, CATALOG_BY_ID } from "../catalog/index.ts";
import { applyAction, createInitialState } from "../engine.ts";
import { EXTERNAL_CORPUS } from "../overlap.ts";
import { renderObjectPreview } from "../preview.ts";
import { runAllRecords } from "../records.ts";
import { SCENES } from "../scenes.ts";
import {
  ERAS,
  FICTION_NOTE,
  type ActionResult,
  type EraId,
  type HistoryObject,
  type ObjRuntime,
  type PackAction,
  type PackState,
  type SiteKind,
} from "../types.ts";
import { validatePack } from "../validate.ts";

const STORAGE_KEY = "preincarnation-buried-history-v1";

type View =
  | { name: "scenes" }
  | { name: "catalog" }
  | { name: "register" }
  | { name: "checks" }
  | { name: "scene"; id: string }
  | { name: "object"; id: string; back: "catalog" | "scene"; sceneId?: string };

const ERA_LABEL: Record<EraId, string> = {
  "pre-absence": "Pre-absence",
  "the-fourteen": "The fourteen",
  return: "Return",
};

const KIND_LABEL: Record<SiteKind, string> = {
  workshop: "Workshop",
  household: "Household",
  "vanished-crossing": "Vanished crossing",
  "former-orchard": "Former orchard",
  quarry: "Quarry",
};

function usable(value: unknown): value is PackState {
  if (!value || typeof value !== "object") return false;
  const pack = value as PackState;
  return Boolean(pack.objects) && Object.keys(pack.objects).length === 80 && Array.isArray(pack.evidence);
}

function useDesk() {
  const [pack, setPack] = useState<PackState>(() => createInitialState());
  const packRef = useRef(pack);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (usable(parsed)) {
        packRef.current = parsed;
        setPack(parsed);
      }
    } catch {
      /* keep the fresh desk */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(pack));
  }, [pack, ready]);
  return {
    pack,
    ready,
    act(action: PackAction): ActionResult {
      const applied = applyAction(packRef.current, action);
      packRef.current = applied.state;
      setPack(applied.state);
      return applied.result;
    },
    reset() {
      const fresh = createInitialState();
      packRef.current = fresh;
      setPack(fresh);
    },
  };
}

function Btn({
  tone = "ink",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ink" | "copper" | "ghost" | "line" }) {
  const toneClass = {
    ink: "bg-bg text-fg",
    copper: "bg-primary text-bg",
    ghost: "bg-transparent text-fg border border-fg/25",
    line: "bg-transparent text-bg border border-bg/20",
  }[tone];
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-left text-sm font-medium transition-opacity duration-150 hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

function MoveIcon({ icon }: { icon: "dig" | "eye" | "lock" | "mend" | "use" }) {
  if (icon === "dig") return <Shovel size={16} aria-hidden />;
  if (icon === "eye") return <Eye size={16} aria-hidden />;
  if (icon === "lock") return <Lock size={16} aria-hidden />;
  if (icon === "mend") return <Wrench size={16} aria-hidden />;
  return <ScrollText size={16} aria-hidden />;
}

function stepOf(obj: HistoryObject, runtime: ObjRuntime): { n: number; total: number; name: string } {
  const restore = obj.interaction.needsRestore;
  const total = restore ? 5 : 4;
  if (runtime.phase !== "in-hand") return { n: 1, total, name: obj.binding === "excavate" ? "Excavate" : "Recover" };
  if (!runtime.inspected) return { n: 2, total, name: "Inspect" };
  if (!runtime.registered) return { n: 3, total, name: "Register" };
  if (restore && !runtime.restored) return { n: 4, total, name: "Restore" };
  if (runtime.usedCount === 0) return { n: total, total, name: obj.interaction.verb };
  return { n: total, total, name: "Used" };
}

function nextMove(obj: HistoryObject, runtime: ObjRuntime): { label: string; action: PackAction; icon: "dig" | "eye" | "lock" | "mend" | "use" } | null {
  if (runtime.phase !== "in-hand") {
    return { label: obj.binding === "excavate" ? "Excavate" : "Recover", action: { action: obj.binding, id: obj.id }, icon: "dig" };
  }
  if (!runtime.inspected) return { label: "Inspect", action: { action: "inspect", id: obj.id }, icon: "eye" };
  if (!runtime.registered) return { label: "Register evidence", action: { action: "register", id: obj.id }, icon: "lock" };
  if (obj.interaction.needsRestore && !runtime.restored) {
    return { label: "Restore", action: { action: "restore", id: obj.id }, icon: "mend" };
  }
  if (runtime.usedCount === 0) return { label: obj.interaction.verb, action: { action: "use", id: obj.id }, icon: "use" };
  return null;
}

export function Desk() {
  const { pack, act, reset } = useDesk();
  const [view, setView] = useState<View>({ name: "scenes" });
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<SiteKind | "all">("all");
  const [armedClear, setArmedClear] = useState(false);
  const [recordSummary, setRecordSummary] = useState<string | null>(null);

  const locked = pack.evidence.length;
  const held = CATALOG.filter((obj) => pack.objects[obj.id]?.phase === "in-hand");

  function openObject(id: string, back: "catalog" | "scene", sceneId?: string) {
    setView({ name: "object", id, back, sceneId });
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="desk-bar">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
          <h1 className="mr-auto text-xl text-fg">
            <span className="mr-2 font-sans text-[0.65rem] font-semibold uppercase tracking-widest text-accent">Preincarnation</span>
            Buried History
          </h1>
          <p className="font-sans text-xs tabular-nums text-fg/70">
            {held.length} in hand · {locked} locked
          </p>
          <div className="flex gap-1" role="group" aria-label="Era">
            {ERAS.map((era) => (
              <button
                key={era}
                type="button"
                aria-pressed={pack.era === era}
                className={`min-h-11 rounded-lg px-3 text-sm ${pack.era === era ? "bg-primary text-bg" : "text-fg/75"}`}
                onClick={() => act({ action: "setEra", era })}
              >
                {ERA_LABEL[era]}
              </button>
            ))}
          </div>
          <nav className="flex gap-1" aria-label="Desk">
            <button type="button" aria-current={view.name === "scenes" || view.name === "scene" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-sm ${view.name === "scenes" || view.name === "scene" ? "bg-fg text-bg" : "text-fg/75"}`} onClick={() => setView({ name: "scenes" })}>
              Scenes
            </button>
            <button type="button" aria-current={view.name === "catalog" || (view.name === "object" && view.back === "catalog") ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-sm ${view.name === "catalog" || (view.name === "object" && view.back === "catalog") ? "bg-fg text-bg" : "text-fg/75"}`} onClick={() => setView({ name: "catalog" })}>
              Catalog
            </button>
            <button type="button" aria-current={view.name === "register" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-sm ${view.name === "register" ? "bg-fg text-bg" : "text-fg/75"}`} onClick={() => setView({ name: "register" })}>
              Register
            </button>
            <button type="button" aria-current={view.name === "checks" ? "page" : undefined} className={`min-h-11 rounded-lg px-3 text-sm ${view.name === "checks" ? "bg-fg text-bg" : "text-fg/75"}`} onClick={() => setView({ name: "checks" })}>
              Checks
            </button>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        {view.name === "scenes" ? (
          <>
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-fg/75">{FICTION_NOTE}</p>
            <Continue pack={pack} onOpen={(id) => openObject(id, "scene", SCENES.find((scene) => scene.objectIds.includes(id))?.id)} />
            <SceneList pack={pack} onOpen={(id) => setView({ name: "scene", id })} />
          </>
        ) : null}
        {view.name === "scene" ? (
          <SceneView
            id={view.id}
            pack={pack}
            era={pack.era}
            onBack={() => setView({ name: "scenes" })}
            onOpen={(id) => openObject(id, "scene", view.id)}
            act={act}
          />
        ) : null}
        {view.name === "catalog" ? (
          <Catalog
            query={query}
            kind={kind}
            pack={pack}
            onQuery={setQuery}
            onKind={setKind}
            onOpen={(id) => openObject(id, "catalog")}
            act={act}
          />
        ) : null}
        {view.name === "object" ? (
          <Dossier
            id={view.id}
            pack={pack}
            act={act}
            onBack={() =>
              view.back === "scene" && view.sceneId ? setView({ name: "scene", id: view.sceneId }) : setView({ name: "catalog" })
            }
            onOpen={(id) => openObject(id, view.back, view.sceneId)}
          />
        ) : null}
        {view.name === "register" ? <Register pack={pack} act={act} onOpen={(id) => openObject(id, "catalog")} /> : null}
        {view.name === "checks" ? (
          <Checks
            summary={recordSummary}
            onRun={() => {
              const summary = runAllRecords();
              setRecordSummary(
                summary.failed === 0
                  ? `${summary.passed} of 80 action records passed. Evidence stayed locked.`
                  : `${summary.failed} records failed. ${summary.failures[0]?.detail ?? ""}`,
              );
            }}
          />
        ) : null}

        <footer className="mt-10 flex flex-wrap items-center gap-3 border-t border-fg/15 pt-4">
          <Btn
            tone="ghost"
            onClick={() => {
              if (!armedClear) {
                setArmedClear(true);
                return;
              }
              reset();
              setArmedClear(false);
              setView({ name: "scenes" });
            }}
          >
            {armedClear ? "Confirm clear of this desk copy" : "Clear working copy"}
          </Btn>
          {armedClear ? (
            <button type="button" className="min-h-11 px-2 text-sm text-fg/70" onClick={() => setArmedClear(false)}>
              Cancel
            </button>
          ) : null}
          <p className="text-sm text-fg/70">Clearing drops this desk’s copy. The catalog text is not destroyed.</p>
        </footer>
      </main>
    </div>
  );
}

function Continue({ pack, onOpen }: { pack: PackState; onOpen: (id: string) => void }) {
  const next = CATALOG.find((obj) => {
    const runtime = pack.objects[obj.id];
    return runtime && runtime.phase === "in-hand" && runtime.usedCount === 0;
  });
  if (!next) return null;
  return (
    <button type="button" onClick={() => onOpen(next.id)} className="mb-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg bg-primary px-4 py-2 text-left text-bg">
      <span>
        <span className="block font-sans text-xs font-semibold uppercase tracking-widest">Continue</span>
        <span className="font-display text-xl">{next.name}</span>
      </span>
      <span className="text-sm">Open the find</span>
    </button>
  );
}

function SceneList({ pack, onOpen }: { pack: PackState; onOpen: (id: string) => void }) {
  return (
    <ol className="sheet overflow-hidden">
      {SCENES.map((scene) => {
        const found = scene.objectIds.filter((id) => pack.objects[id]?.phase === "in-hand").length;
        const done = scene.objectIds.every((id) => (pack.objects[id]?.usedCount ?? 0) > 0);
        return (
          <li key={scene.id} className="border-b border-bg/10 last:border-b-0">
            <button type="button" onClick={() => onOpen(scene.id)} className="flex min-h-14 w-full items-baseline gap-4 px-4 py-3 text-left">
              <span className="w-7 shrink-0 font-sans text-xs tabular-nums text-bg/45">{String(scene.index).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl leading-tight">{scene.title}</span>
                <span className="mt-0.5 block text-sm text-bg/60">
                  {scene.place} · {KIND_LABEL[scene.siteKind]}
                </span>
              </span>
              <span className="shrink-0 font-sans text-xs tabular-nums text-bg/55">
                {done ? "Used" : `${found}/${scene.objectIds.length}`}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function SceneView({
  id,
  pack,
  era,
  onBack,
  onOpen,
  act,
}: {
  id: string;
  pack: PackState;
  era: EraId;
  onBack: () => void;
  onOpen: (id: string) => void;
  act: (action: PackAction) => ActionResult;
}) {
  const scene = SCENES.find((row) => row.id === id);
  if (!scene) return <p>That scene is not in this pack.</p>;
  const found = scene.objectIds.filter((objectId) => pack.objects[objectId]?.phase === "in-hand").length;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <button type="button" className="min-h-11 text-sm text-fg/60 underline-offset-2 hover:underline" onClick={onBack}>
            All scenes
          </button>
          <h2 className="text-3xl text-fg">{scene.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-fg/70">
            {scene.place}. {scene.prose}
          </p>
          <p className="mt-1 text-xs tabular-nums text-fg/50">
            {String(scene.index).padStart(2, "0")} · {found}/{scene.objectIds.length} in hand · {ERA_LABEL[era]}
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        {scene.objectIds.map((objectId) => {
          const obj = CATALOG_BY_ID.get(objectId);
          if (!obj) return null;
          return <ObjectCard key={objectId} obj={obj} pack={pack} act={act} onOpen={() => onOpen(objectId)} />;
        })}
      </div>
    </div>
  );
}

function Catalog({
  query,
  kind,
  pack,
  onQuery,
  onKind,
  onOpen,
  act,
}: {
  query: string;
  kind: SiteKind | "all";
  pack: PackState;
  onQuery: (value: string) => void;
  onKind: (value: SiteKind | "all") => void;
  onOpen: (id: string) => void;
  act: (action: PackAction) => ActionResult;
}) {
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CATALOG.filter((obj) => {
      if (kind !== "all" && obj.siteKind !== kind) return false;
      if (!needle) return true;
      return [obj.id, obj.name, obj.site, obj.evidence.readable, obj.interaction.verb].join(" ").toLowerCase().includes(needle);
    });
  }, [query, kind]);
  return (
    <div>
      <label className="relative mb-3 block">
        <span className="sr-only">Search the catalog</span>
        <Search className="pointer-events-none absolute left-3 top-3 text-fg/50" size={18} aria-hidden />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search name, id, or inscription"
          className="min-h-11 w-full rounded-lg border border-fg/20 bg-bg pl-10 pr-3 text-fg placeholder:text-fg/40"
        />
      </label>
      <div className="mb-4 flex flex-wrap gap-2">
        <Btn tone={kind === "all" ? "copper" : "ghost"} onClick={() => onKind("all")}>
          All
        </Btn>
        {(Object.keys(KIND_LABEL) as SiteKind[]).map((siteKind) => (
          <Btn key={siteKind} tone={kind === siteKind ? "copper" : "ghost"} onClick={() => onKind(siteKind)}>
            {KIND_LABEL[siteKind]}
          </Btn>
        ))}
      </div>
      <p className="mb-3 text-sm tabular-nums text-fg/70">{rows.length} objects · survey intake, not side quests</p>
      <div className="grid gap-6">
        {(Object.keys(KIND_LABEL) as SiteKind[])
          .map((siteKind) => ({ siteKind, items: rows.filter((obj) => obj.siteKind === siteKind) }))
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.siteKind}>
              <h2 className="mb-2 text-lg text-fg">{KIND_LABEL[group.siteKind]}</h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {group.items.map((obj) => {
                  const runtime = pack.objects[obj.id];
                  const move = runtime ? nextMove(obj, runtime) : null;
                  return (
                    <li key={obj.id} className="sheet flex items-stretch">
                      <button type="button" onClick={() => onOpen(obj.id)} className="min-h-11 min-w-0 flex-1 px-4 py-3 text-left">
                        <span className="block font-sans text-xs tabular-nums text-bg/50">{obj.id}</span>
                        <span className="mt-0.5 block font-display text-lg leading-tight">{obj.name}</span>
                      </button>
                      {move ? (
                        <button
                          type="button"
                          className="min-h-11 shrink-0 border-l border-bg/10 px-4 text-sm font-medium text-primary"
                          onClick={() => act(move.action)}
                        >
                          {move.label}
                        </button>
                      ) : (
                        <span className="self-center pr-4 text-xs uppercase tracking-wide text-bg/45">Used</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
      </div>
    </div>
  );
}

function ObjectCard({
  obj,
  pack,
  act,
  onOpen,
}: {
  obj: HistoryObject;
  pack: PackState;
  act: (action: PackAction) => ActionResult;
  onOpen: () => void;
}) {
  const runtime = pack.objects[obj.id];
  if (!runtime) return null;
  const move = nextMove(obj, runtime);
  const step = stepOf(obj, runtime);
  const last = [...pack.log].reverse().find((entry) => entry.objectId === obj.id);
  const done = runtime.usedCount > 0;
  return (
    <article className="sheet p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-2xl leading-tight">{obj.name}</h3>
        <span className="shrink-0 font-sans text-xs tabular-nums text-bg/50">
          {step.n}/{step.total}
        </span>
      </div>
      <p className="mt-1 text-sm text-bg/60">{obj.physical.condition}</p>
      {runtime.inspected ? <p className="quote mt-3 font-display text-lg leading-snug">{obj.evidence.readable}</p> : null}
      {runtime.phase === "in-hand" ? (
        <p className="mt-3 text-sm leading-relaxed">
          <span className="font-sans text-xs uppercase tracking-wide text-bg/45">{ERA_LABEL[pack.era]} · </span>
          {obj.persistence.presentation[pack.era]}
        </p>
      ) : null}
      {done ? <p className="mt-2 text-sm leading-relaxed">{runtime.lastDetail}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {move ? (
          <Btn tone="copper" onClick={() => act(move.action)}>
            <MoveIcon icon={move.icon} />
            {move.label}
          </Btn>
        ) : (
          <span className="text-sm text-bg/60">Used. The line stays locked.</span>
        )}
        <button type="button" className="min-h-11 px-2 text-sm text-bg/60 underline-offset-2 hover:underline" onClick={onOpen}>
          Full record
        </button>
      </div>
      {last && !last.ok ? (
        <p className="mt-2 text-sm text-primary" role="status">
          Refused. {last.detail}
        </p>
      ) : null}
    </article>
  );
}

function Dossier({
  id,
  pack,
  act,
  onBack,
  onOpen,
}: {
  id: string;
  pack: PackState;
  act: (action: PackAction) => ActionResult;
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const obj = CATALOG_BY_ID.get(id);
  const runtime = pack.objects[id];
  if (!obj || !runtime) return <p>That object is not in this pack.</p>;
  const last = [...pack.log].reverse().find((entry) => entry.objectId === id);
  const inscription = pack.evidence.find((row) => row.objectId === id && row.snapshotOf === "inscription");
  const preview = renderObjectPreview(obj);
  const move = nextMove(obj, runtime);
  const step = stepOf(obj, runtime);
  const scene = SCENES.find((row) => row.objectIds.includes(id));
  const nextId = scene?.objectIds.find((objectId) => objectId !== id && pack.objects[objectId]?.usedCount === 0);
  const next = nextId ? CATALOG_BY_ID.get(nextId) : undefined;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
      <article className="sheet p-5">
        <p className="font-sans text-xs tabular-nums text-bg/50">
          {obj.id} · {step.n}/{step.total}
        </p>
        <h2 className="mt-1 text-3xl">{obj.name}</h2>
        <p className="mt-1 text-sm text-bg/60">
          {obj.site} · {obj.physical.condition}
        </p>

        {runtime.inspected ? (
          <blockquote className="quote mt-4">
            <p className="font-sans text-xs text-bg/50">
              {obj.evidence.evidenceId} · {obj.evidence.howRead}
            </p>
            <p className="mt-2 font-display text-2xl leading-snug">{obj.evidence.readable}</p>
            {inscription ? <p className="mt-2 text-sm text-bg/70">Locked. Discard cannot remove this line.</p> : null}
          </blockquote>
        ) : (
          <p className="mt-4 text-sm text-bg/60">The line is unread until you inspect it.</p>
        )}

        <p className="era-now mt-4 p-3 text-sm leading-relaxed">
          <span className="font-sans text-xs uppercase tracking-wide text-fg/55">{ERA_LABEL[pack.era]}</span>
          <span className="mt-1 block">{obj.persistence.presentation[pack.era]}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {move ? (
            <Btn tone="copper" onClick={() => act(move.action)}>
              <MoveIcon icon={move.icon} />
              {move.label}
            </Btn>
          ) : (
            <span className="self-center text-sm text-bg/60">Used. The line stays locked.</span>
          )}
          {next ? (
            <Btn tone="line" onClick={() => onOpen(next.id)}>
              Next · {next.name}
            </Btn>
          ) : null}
        </div>
        {last && !last.ok ? (
          <p className="mt-3 text-sm text-primary" role="status">
            Refused · {last.detail}
          </p>
        ) : null}

        {runtime.usedCount > 0 ? <p className="mt-4 text-sm leading-relaxed">{runtime.lastDetail}</p> : null}
        {runtime.inspected ? (
          <p className="mt-4 text-sm leading-relaxed">
            <span className="font-medium">{obj.response.who}.</span> {obj.response.text}
          </p>
        ) : null}
        <button type="button" className="mt-5 min-h-11 text-sm text-bg/55 underline-offset-2 hover:underline" onClick={onBack}>
          {scene ? `Back to ${scene.title}` : "Back"}
        </button>
      </article>

      <aside className="grid content-start gap-3">
        <details className="sheet p-4">
          <summary className="min-h-11 cursor-pointer text-sm font-medium">What it is</summary>
          <dl className="mt-2 grid gap-2 text-sm">
            {(
              [
                ["Material", obj.physical.material],
                ["Dimensions", obj.physical.dimensions],
                ["Mass", obj.physical.mass],
                ["Marks", obj.physical.marks],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="font-sans text-xs uppercase tracking-wide text-bg/50">{label}</dt>
                <dd className="mt-1">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-bg/70">Holds: {obj.persistence.holds}</p>
          {obj.restoration ? (
            <p className="mt-2 text-sm text-bg/70">
              Restoration {runtime.restored ? "applied" : obj.restoration.applies ? "available" : "refused"}: {obj.restoration.method}
            </p>
          ) : (
            <p className="mt-2 text-sm text-bg/70">No restoration. The object is not broken.</p>
          )}
        </details>
        <details className="sheet p-4">
          <summary className="min-h-11 cursor-pointer text-sm font-medium">Discovery note</summary>
          <p className="mt-2 text-sm leading-relaxed">
            Authored by {obj.discovery.author}. Found by {obj.discovery.finder}. {obj.discovery.circumstance}
          </p>
          <blockquote className="mt-3 text-sm leading-relaxed">{obj.discovery.authored}</blockquote>
        </details>
        <details className="sheet p-4">
          <summary className="min-h-11 cursor-pointer text-sm font-medium">Other actions</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn tone="line" disabled={runtime.phase !== "in-hand"} onClick={() => act({ action: "inspect", id: obj.id })}>
              Inspect
            </Btn>
            <Btn tone="line" disabled={!runtime.inspected} onClick={() => act({ action: "register", id: obj.id })}>
              Register
            </Btn>
            <Btn tone="line" disabled={runtime.phase !== "in-hand"} onClick={() => act({ action: "restore", id: obj.id })}>
              Restore
            </Btn>
            <Btn
              tone="line"
              disabled={runtime.phase !== "in-hand" || !runtime.inspected || (obj.interaction.needsRestore && !runtime.restored)}
              onClick={() => act({ action: "use", id: obj.id })}
            >
              Use
            </Btn>
            <Btn tone="line" disabled={runtime.phase !== "in-hand"} onClick={() => act({ action: "destroy", id: obj.id })}>
              <Ban size={16} aria-hidden /> Attempt to discard
            </Btn>
            {runtime.ephemeralMark ? (
              <Btn tone="line" onClick={() => act({ action: "eraseWorkingMark", id: obj.id })}>
                Erase working mark
              </Btn>
            ) : null}
          </div>
        </details>
        <details className="sheet p-4">
          <summary className="min-h-11 cursor-pointer text-sm font-medium">Preview sheet</summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed">{preview.body}</pre>
        </details>
      </aside>
    </div>
  );
}

function Register({
  pack,
  act,
  onOpen,
}: {
  pack: PackState;
  act: (action: PackAction) => ActionResult;
  onOpen: (id: string) => void;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <article className="sheet p-5">
        <h2 className="text-2xl">Evidence register</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Lines here are campaign evidence. Discard, burn, and wipe are refused. A working pencil mark can be erased; an inscription cannot.
        </p>
        <p className="mt-2 text-sm tabular-nums">{pack.evidence.length} locked lines</p>
      </article>
      {pack.evidence.length === 0 ? <p className="text-sm text-fg/70">Nothing registered yet. Inspect an object and lock the line.</p> : null}
      <ul className="grid gap-2">
        {pack.evidence.map((row) => (
          <li key={`${row.evidenceId}-${row.snapshotOf}`} className="sheet p-4">
            <p className="font-sans text-xs tabular-nums text-bg/50">
              {row.evidenceId} · {row.snapshotOf} · {ERA_LABEL[row.registeredOnEra]}
            </p>
            <p className="mt-2 font-display text-lg leading-snug">{row.readable}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn onClick={() => onOpen(row.objectId)}>Open object</Btn>
              <Btn
                tone="line"
                onClick={() => {
                  const result = act({ action: "wipe", id: row.objectId });
                  setNotice(result.detail);
                }}
              >
                Try to wipe
              </Btn>
            </div>
          </li>
        ))}
      </ul>
      {notice ? (
        <p className="text-sm text-fg/85" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function Checks({ summary, onRun }: { summary: string | null; onRun: () => void }) {
  const checks = useMemo(() => validatePack(), []);
  const failed = checks.filter((check) => !check.ok);
  return (
    <div className="grid gap-3">
      <article className="sheet p-5">
        <h2 className="text-2xl">Validation</h2>
        <p className="mt-2 text-sm leading-relaxed">{EXTERNAL_CORPUS.note}</p>
        <p className="mt-2 text-sm tabular-nums">
          {checks.length - failed.length} of {checks.length} structural checks passed. External relics compared: {EXTERNAL_CORPUS.relicCount}. Unresolved overlaps:{" "}
          {failed.length === 0 ? "none" : "see failures"}.
        </p>
        <Btn className="mt-4" tone="copper" onClick={onRun}>
          Run all eighty action records
        </Btn>
        {summary ? (
          <p className="mt-3 text-sm" role="status">
            {summary}
          </p>
        ) : null}
      </article>
      <details className="sheet p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-medium">Show structural checks</summary>
        <ul className="mt-3 grid gap-2">
          {checks.map((check) => (
            <li key={check.id} className="inset p-3">
              <p className="font-sans text-xs uppercase tracking-wide text-bg/50">
                {check.ok ? "Pass" : "Fail"} · {check.id}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{check.detail}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
