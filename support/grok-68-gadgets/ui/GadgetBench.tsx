import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Bookmark,
  Compass,
  Lamp,
  RotateCcw,
  Scale,
  Search,
  TreePine,
  Volume2,
  VolumeX,
  Warehouse,
  Wind,
  Bird,
} from "lucide-react";
import { GADGETS, getGadget } from "../src/catalog.ts";
import { HOST_GAPS, PACK_LINKS } from "../src/gaps.ts";
import {
  displayItem,
  perform,
  restoreItem,
  salvageItem,
  stowItem,
  tradeItem,
} from "../src/handlers.ts";
import { ID, IRON_IDS } from "../src/ids.ts";
import { previewSvg } from "../src/preview.ts";
import {
  SCENES,
  absorb,
  assemble,
  freshSession,
  piecesHere,
  primaryScene,
  sceneMeta,
  type JournalLine,
  type SceneId,
  type Session,
} from "../src/scenes.ts";
import type { Args, Family, Gadget, Store, UseDef } from "../src/types.ts";
import { buildFixture } from "../src/world.ts";
import { validatePack } from "../src/validate.ts";
import { Stage } from "./Stage";
import { playOp, setMuted } from "./tone";

const KEY = "preincarnation-gadget-bench-v1";

const SCENE_ICON = {
  porch: Bird,
  vigil: Lamp,
  loft: Warehouse,
  counter: Scale,
  creek: Wind,
  orchard: TreePine,
  study: BookOpen,
} as const;

type View = "county" | "cabinet" | "gaps";

export function GadgetBench() {
  const [session, setSession] = useState<Session>(() => freshSession());
  const [picked, setPicked] = useState<string>(ID.bird);
  const [view, setView] = useState<View>("county");
  const [args, setArgs] = useState<Args>({});
  const [beat, setBeat] = useState(0);
  const [shake, setShake] = useState(false);
  const [sound, setSound] = useState(true);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<Family | "all">("all");
  const [rigNote, setRigNote] = useState<JournalLine | null>(null);

  const report = useMemo(() => validatePack(), []);
  const meta = sceneMeta(session.scene);
  const world = useMemo(() => assemble(session), [session]);
  const gadget = getGadget(picked);
  const here = piecesHere(session.scene);
  const kitItem = session.kit.find((k) => k.lootId === picked);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { v?: number; session?: Session; picked?: string; sound?: boolean };
        if (saved.v === 1 && saved.session?.slices?.porch && saved.session.kit?.length) {
          setSession(saved.session);
          if (saved.picked) setPicked(saved.picked);
          if (typeof saved.sound === "boolean") setSound(saved.sound);
        }
      }
    } catch {
      /* a bad save should not block the county */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ v: 1, session, picked, sound }));
  }, [ready, session, picked, sound]);

  useEffect(() => {
    setMuted(!sound);
  }, [sound]);

  useEffect(() => {
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      if (document.hidden) {
        last = now;
        raf = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      if (acc >= 1) {
        acc -= 1;
        setSession((s) => {
          const slice = s.slices[s.scene];
          if (!slice.enemies.some((e) => e.timer > 0)) return s;
          return {
            ...s,
            slices: {
              ...s.slices,
              [s.scene]: {
                ...slice,
                enemies: slice.enemies.map((e) => {
                  if (e.timer <= 0) return e;
                  const timer = e.timer - 1;
                  const alert = timer <= 0 ? "idle" : e.alert;
                  return { ...e, timer, alert };
                }),
              },
            },
          };
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function note(line: JournalLine) {
    setSession((s) => ({ ...s, journal: [line, ...s.journal].slice(0, 16) }));
  }

  function commit(result: { ok: boolean; code: string; notes: string[]; world: typeof world }, op: string) {
    setSession((s) => {
      const next = absorb(s, result.world);
      const text = result.notes[0] ?? result.code;
      return { ...next, journal: [{ ok: result.ok, code: result.code, text }, ...s.journal].slice(0, 16) };
    });
    setShake(!result.ok);
    setBeat((n) => n + 1);
    playOp(op, result.ok);
  }

  function act(useId: "a" | "b") {
    if (!gadget) return;
    const use = gadget.uses.find((u) => u.id === useId);
    if (!use) return;
    const merged: Args = { ...(use.demoArgs ?? {}), ...args };
    const result = perform(assemble(session), gadget.id, useId, merged);
    commit(result, use.ops[0]?.op ?? "use");
  }

  function service(kind: "restore" | "salvage" | "trade" | "display") {
    if (!gadget) return;
    const w = assemble(session);
    const result =
      kind === "restore"
        ? restoreItem(w, gadget.id)
        : kind === "salvage"
          ? salvageItem(w, gadget.id)
          : kind === "trade"
            ? tradeItem(w, gadget.id)
            : displayItem(w, gadget.id);
    commit(result, kind);
  }

  function stow(store: Store) {
    if (!gadget) return;
    const result = stowItem(assemble(session), gadget.id, store);
    commit(result, "stow");
  }

  function choose(g: Gadget, jump: boolean) {
    setPicked(g.id);
    setArgs({});
    setRigNote(null);
    if (jump && g.bench) {
      setSession((s) => ({ ...s, scene: primaryScene(g) }));
      setView("county");
    }
  }

  function goScene(id: SceneId) {
    setSession((s) => ({ ...s, scene: id }));
    const first = piecesHere(id)[0];
    if (first) {
      setPicked(first.id);
      setArgs({});
    }
    setView("county");
  }

  function resetPlace() {
    const fresh = freshSession();
    setSession((s) => ({
      ...s,
      flags: { ...s.flags, conchUsed: false },
      slices: { ...s.slices, [s.scene]: structuredClone(fresh.slices[s.scene]) },
      journal: [{ ok: true, code: "RESET", text: `${meta.title} set back. The kit stayed.` }, ...s.journal].slice(0, 16),
    }));
  }

  function resetKit() {
    setSession(freshSession());
    setPicked(ID.bird);
    setArgs({});
    setView("county");
  }

  function pocketIron(store: "pocket" | "belt") {
    let w = assemble(session);
    for (const k of [...w.kit]) {
      if (IRON_IDS.has(k.lootId)) {
        w = stowItem(w, k.lootId, store).world;
      }
    }
    setSession((s) => absorb({ ...s, journal: s.journal }, w));
    note({
      ok: true,
      code: "STOW",
      text: store === "pocket" ? "Iron is in the pocket with the compass." : "Iron is back on the belt.",
    });
  }

  function prove(g: Gadget, useId: "a" | "b") {
    const use = g.uses.find((u) => u.id === useId);
    if (!use) return;
    const { world: rig } = buildFixture(g);
    const result = perform(rig, g.id, useId, use.demoArgs ?? {});
    setRigNote({ ok: result.ok, code: result.code, text: result.notes[0] ?? result.code });
    playOp(use.ops[0]?.op ?? "use", result.ok);
  }

  const cabinet = GADGETS.filter((g) => {
    if (family !== "all" && g.family !== family) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.id.endsWith(q) ||
      g.provenance.place.toLowerCase().includes(q) ||
      g.discovery.site.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper-deep text-ink antialiased">
      <header className="border-b border-ink/15 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-4 py-4">
          <div>
            <p className="font-sans text-xs tracking-widest text-pine uppercase">Addison County · second life</p>
            <h1 className="font-display text-3xl leading-none text-balance text-ink sm:text-4xl">PREINCARNATION</h1>
            <p className="mt-1 max-w-xl text-sm text-pretty text-ink-soft">
              Fourteen years later. Ellis’s kit of practical curios — the same hands, a different Wednesday.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Shelf session={session} />
            <button type="button" className="icon-btn" onClick={() => setSound((v) => !v)} aria-pressed={sound} aria-label={sound ? "Mute tones" : "Play tones"}>
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex w-full min-w-0 max-w-6xl gap-2 overflow-x-auto px-4 pb-3" aria-label="Places">
          {SCENES.map((s) => {
            const Icon = SCENE_ICON[s.id];
            const on = view === "county" && session.scene === s.id;
            return (
              <button key={s.id} type="button" className={on ? "tab tab-on" : "tab"} onClick={() => goScene(s.id)}>
                <Icon className="size-4" aria-hidden />
                {s.title}
              </button>
            );
          })}
          <button type="button" className={view === "cabinet" ? "tab tab-on" : "tab"} onClick={() => setView("cabinet")}>
            <Search className="size-4" aria-hidden />
            Cabinet
          </button>
          <button type="button" className={view === "gaps" ? "tab tab-on" : "tab"} onClick={() => setView("gaps")}>
            <Bookmark className="size-4" aria-hidden />
            Not wired
          </button>
        </nav>
      </header>

      {view === "county" && (
        <main className="mx-auto grid min-w-0 max-w-6xl gap-4 px-4 py-4 lg:grid-cols-12">
          <section className="min-w-0 border border-ink/20 bg-paper lg:col-span-7">
            <div className="flex items-baseline justify-between gap-3 border-b border-ink/15 px-4 py-3">
              <div>
                <p className="font-sans text-xs tracking-widest text-brass uppercase">{meta.figure}</p>
                <h2 className="font-display text-2xl text-balance">{meta.title}</h2>
              </div>
              <p className="text-right font-sans text-sm tabular-nums text-ink-soft">
                {meta.hourLabel}
                <br />
                {meta.where}
              </p>
            </div>
            <Stage scene={session.scene} world={world} session={session} beat={beat} shake={shake} />
            <p className="px-4 pt-3 text-sm text-pretty text-ink-soft">{meta.lead}</p>
            <p className="px-4 pt-2 pb-3 text-sm text-pretty text-ink">{meta.cue}</p>
            <div className="flex flex-wrap gap-2 border-t border-ink/15 px-4 py-3">
              <SceneControls
                scene={session.scene}
                world={world}
                onLamp={() => {
                  setSession((s) => {
                    const slice = s.slices.vigil;
                    return {
                      ...s,
                      slices: {
                        ...s.slices,
                        vigil: {
                          ...slice,
                          lamps: slice.lamps.map((l) =>
                            l.id === "vigil"
                              ? { ...l, kind: l.kind === "church-vigil" ? "electric-porch" : "church-vigil" }
                              : l,
                          ),
                        },
                      },
                    };
                  });
                }}
                onWind={() => {
                  setSession((s) => {
                    const slice = s.slices.loft;
                    const wind = slice.weather.wind === "fresh" ? "calm" : "fresh";
                    return { ...s, slices: { ...s.slices, loft: { ...slice, weather: { ...slice.weather, wind } } } };
                  });
                }}
                onWet={() => {
                  setSession((s) => {
                    const slice = s.slices.creek;
                    return {
                      ...s,
                      slices: { ...s.slices, creek: { ...slice, weather: { ...slice.weather, wet: !slice.weather.wet } } },
                    };
                  });
                }}
                onIron={pocketIron}
                onReset={resetPlace}
              />
            </div>
            <ul className="grid gap-1 border-t border-ink/15 px-4 py-3 text-sm text-ink-soft">
              {facts(world).map((row) => (
                <li key={row} className="font-sans tabular-nums">
                  {row}
                </li>
              ))}
            </ul>
          </section>

          <section className="min-w-0 border border-ink/20 bg-paper lg:col-span-5">
            {gadget && (
              <Dossier
                gadget={gadget}
                kitItem={kitItem}
                args={args}
                setArgs={setArgs}
                session={session}
                onAct={act}
                onService={service}
                onStow={stow}
                onSpent={() => {
                  setSession((s) => ({
                    ...s,
                    kit: s.kit.map((k) => (k.lootId === gadget.id ? { ...k, condition: 12 } : k)),
                    journal: [
                      { ok: true, code: "SPENT", text: `${gadget.name} called spent. Salvage is the honest end.` },
                      ...s.journal,
                    ].slice(0, 16),
                  }));
                }}
              />
            )}
          </section>

          <section className="min-w-0 border border-ink/20 bg-paper lg:col-span-12">
            <div className="flex items-baseline justify-between px-4 pt-3">
              <h2 className="font-display text-xl">In this place</h2>
              <button type="button" className="text-sm text-oxide underline-offset-2 hover:underline" onClick={resetKit}>
                Begin the afternoon again
              </button>
            </div>
            <div className="flex min-w-0 gap-3 overflow-x-auto px-4 py-3">
              {here.map((g) => (
                <Plate key={g.id} gadget={g} active={g.id === picked} onClick={() => choose(g, false)} />
              ))}
            </div>
            <div className="border-t border-ink/15 px-4 py-3">
              <p className="mb-2 font-sans text-xs tracking-widest text-brass uppercase">Rest of the kit</p>
              <div className="flex min-w-0 gap-2 overflow-x-auto">
                {SCENES.flatMap((s) => piecesHere(s.id))
                  .filter((g) => primaryScene(g) !== session.scene)
                  .map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="min-h-11 shrink-0 border border-ink/20 px-3 text-left text-sm hover:border-ink"
                      onClick={() => choose(g, true)}
                    >
                      <span className="block font-sans text-xs text-ink-soft tabular-nums">{String(g.n).padStart(3, "0")}</span>
                      {g.name}
                    </button>
                  ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {view === "cabinet" && (
        <main className="mx-auto max-w-6xl px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 flex-1 items-center gap-2 border border-ink/20 bg-paper px-3">
              <Search className="size-4 text-ink-soft" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, town, or number"
                className="w-full bg-transparent py-2 text-sm outline-none"
                aria-label="Search the cabinet"
              />
            </label>
            {(["all", "clockwork", "optical", "sonic", "fitting", "field"] as const).map((f) => (
              <button key={f} type="button" className={family === f ? "tab tab-on" : "tab"} onClick={() => setFamily(f)}>
                {f}
              </button>
            ))}
          </div>
          <p className="mb-3 text-sm text-ink-soft">
            {cabinet.length} of 80. A proof runs on a fresh rig and does not touch the county.{" "}
            {report.ok ? "The pack checks out." : `${report.issues.length} catalog issues.`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cabinet.map((g) => (
              <article key={g.id} className={g.id === picked ? "border border-oxide bg-paper" : "border border-ink/15 bg-paper"}>
                <button type="button" className="block w-full text-left" onClick={() => choose(g, false)}>
                  <img src={plateSrc(g)} alt="" className="w-full" />
                  <div className="px-3 py-2">
                    <p className="font-sans text-xs text-brass tabular-nums">
                      {String(g.n).padStart(3, "0")} · {g.family}
                    </p>
                    <h3 className="font-display text-lg leading-tight">{g.name}</h3>
                    <p className="text-sm text-ink-soft">{g.provenance.place}, {g.provenance.year}</p>
                  </div>
                </button>
                {g.id === picked && (
                  <div className="space-y-2 border-t border-ink/15 px-3 py-3">
                    <p className="text-sm text-pretty text-ink-soft">{g.provenance.note}</p>
                    <p className="text-sm text-pretty">Found: {g.discovery.site}</p>
                    <div className="flex flex-wrap gap-2">
                      {g.uses.map((u) => (
                        <button key={u.id} type="button" className="btn-ghost" onClick={() => prove(g, u.id)}>
                          Prove: {u.title}
                        </button>
                      ))}
                      {g.bench && (
                        <button type="button" className="btn-solid" onClick={() => choose(g, true)}>
                          Take it into the county
                        </button>
                      )}
                    </div>
                    {rigNote && (
                      <p className={rigNote.ok ? "text-sm text-pine" : "text-sm text-oxide"} role="status">
                        {rigNote.code}: {rigNote.text}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </main>
      )}

      {view === "gaps" && (
        <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-2">
          <section className="border border-ink/20 bg-paper p-4">
            <h2 className="font-display text-2xl">Missing from the county</h2>
            <p className="mt-2 text-sm text-pretty text-ink-soft">
              These are not implied. No earlier loot catalog was in reach, so a new id was not treated as new content by itself.
            </p>
            <ul className="mt-4 space-y-3">
              {HOST_GAPS.map((gap) => (
                <li key={gap.id}>
                  <p className="font-display text-lg">{gap.title}</p>
                  <p className="text-sm text-pretty text-ink-soft">{gap.detail}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="border border-ink/20 bg-paper p-4">
            <h2 className="font-display text-2xl">What the kit does wire</h2>
            <ul className="mt-4 space-y-3">
              {PACK_LINKS.map((line) => (
                <li key={line} className="text-sm text-pretty">
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-soft">
              {report.ok
                ? "Eighty reserved ids, two uses each, handlers on every effect."
                : report.issues.map((i) => `${i.id} ${i.code}`).join("; ")}
            </p>
          </section>
        </main>
      )}
    </div>
  );
}

function Shelf({ session }: { session: Session }) {
  return (
    <div className="flex items-center gap-1" aria-label="Study shelf">
      {[0, 1, 2, 3].map((i) => {
        const id = session.shelf[i];
        const g = id ? getGadget(id) : undefined;
        return (
          <span
            key={i}
            className="flex h-11 w-11 items-center justify-center border border-ink/20 bg-paper font-sans text-xs tabular-nums"
            title={g?.name ?? "Empty peg"}
          >
            {g ? String(g.n).padStart(3, "0") : "·"}
          </span>
        );
      })}
      <span className="ml-2 font-sans text-sm tabular-nums text-ink-soft">{session.merchant.credit} credit</span>
    </div>
  );
}

function SceneControls({
  scene,
  world,
  onLamp,
  onWind,
  onWet,
  onIron,
  onReset,
}: {
  scene: SceneId;
  world: ReturnType<typeof assemble>;
  onLamp: () => void;
  onWind: () => void;
  onWet: () => void;
  onIron: (store: "pocket" | "belt") => void;
  onReset: () => void;
}) {
  const lamp = world.lamps[0];
  return (
    <>
      {scene === "vigil" && (
        <button type="button" className="btn-ghost" onClick={onLamp}>
          <Lamp className="size-4" aria-hidden />
          {lamp?.kind === "electric-porch" ? "Put the vigil back" : "Swap in the porch light"}
        </button>
      )}
      {scene === "loft" && (
        <button type="button" className="btn-ghost" onClick={onWind}>
          <Wind className="size-4" aria-hidden />
          {world.weather.wind === "fresh" ? "The breeze dies" : "A fresh breeze"}
        </button>
      )}
      {scene === "creek" && (
        <button type="button" className="btn-ghost" onClick={onWet}>
          {world.weather.wet ? "The bank dries" : "The bank is wet"}
        </button>
      )}
      {scene === "orchard" && (
        <>
          <button type="button" className="btn-ghost" onClick={() => onIron("pocket")}>
            <Compass className="size-4" aria-hidden />
            Pocket the iron
          </button>
          <button type="button" className="btn-ghost" onClick={() => onIron("belt")}>
            Hang the iron on the belt
          </button>
        </>
      )}
      <button type="button" className="btn-ghost" onClick={onReset}>
        <RotateCcw className="size-4" aria-hidden />
        Set this place back
      </button>
    </>
  );
}

function Dossier({
  gadget,
  kitItem,
  args,
  setArgs,
  session,
  onAct,
  onService,
  onStow,
  onSpent,
}: {
  gadget: Gadget;
  kitItem: Session["kit"][number] | undefined;
  args: Args;
  setArgs: (a: Args) => void;
  session: Session;
  onAct: (id: "a" | "b") => void;
  onService: (kind: "restore" | "salvage" | "trade" | "display") => void;
  onStow: (store: Store) => void;
  onSpent: () => void;
}) {
  const last = session.journal[0];
  return (
    <div>
      <div className="flex gap-3 border-b border-ink/15 p-3">
        <img src={plateSrc(gadget)} alt="" className="w-28 shrink-0 border border-ink/15" />
        <div>
          <p className="font-sans text-xs tracking-widest text-brass uppercase tabular-nums">
            {gadget.id.replace("loot.expansion.gadget.", "gadget ")} · {gadget.family}
          </p>
          <h2 className="font-display text-2xl leading-tight text-balance">{gadget.name}</h2>
          <p className="text-sm text-ink-soft">
            {gadget.provenance.maker}, {gadget.provenance.place}, {gadget.provenance.year}
          </p>
          {kitItem && (
            <p className="mt-1 font-sans text-sm tabular-nums">
              Condition {kitItem.condition}
              {kitItem.winds ? ` · ${kitItem.winds} winds` : ""}
              {kitItem.recorded ? ` · holds ${kitItem.recorded}` : ""}
              {` · ${kitItem.stored}`}
            </p>
          )}
          {kitItem && (
            <div className="mt-2 h-1.5 w-full bg-paper-deep">
              <div className="h-full bg-oxide" style={{ width: `${Math.max(0, Math.min(100, kitItem.condition))}%` }} />
            </div>
          )}
        </div>
      </div>

      {!kitItem && (
        <p className="px-4 py-3 text-sm text-oxide">Not in the kit. Sold, salvaged, or never carried into this afternoon.</p>
      )}

      {kitItem && (
        <div className="space-y-3 p-4">
          <ArgEditor gadget={gadget} args={args} setArgs={setArgs} session={session} />
          <div className="grid gap-2">
            {gadget.uses.map((u) => (
              <button key={u.id} type="button" className="btn-solid justify-start" onClick={() => onAct(u.id)} disabled={kitItem.condition <= 0}>
                <span className="font-sans text-xs tracking-widest uppercase">{u.verb}</span>
                <span className="block font-display text-lg leading-tight">{u.title}</span>
                <span className="block text-sm font-normal text-pretty opacity-90">{u.summary}</span>
              </button>
            ))}
          </div>
          {last && (
            <p className={last.ok ? "text-sm text-pretty text-pine" : "text-sm text-pretty text-oxide"} role="status">
              {last.text}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {(["pocket", "belt", "pack"] as const).map((store) => (
              <button key={store} type="button" className="btn-ghost" onClick={() => onStow(store)}>
                {store}
              </button>
            ))}
            {gadget.storage.canTin && (
              <button type="button" className="btn-ghost" onClick={() => onStow("tin")}>
                tin
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => onService("display")}>
              Shelf it
            </button>
            <button type="button" className="btn-ghost" onClick={() => onService("trade")}>
              {gadget.tradeRefuse ? "Offer for sale" : `Sell · ${gadget.tradeCredit}`}
            </button>
            {gadget.restore && (
              <button type="button" className="btn-ghost" onClick={() => onService("restore")}>
                Restore
              </button>
            )}
            {gadget.salvage && kitItem.condition <= 15 && (
              <button type="button" className="btn-ghost" onClick={() => onService("salvage")}>
                Salvage
              </button>
            )}
            {gadget.salvage && kitItem.condition > 15 && (
              <button type="button" className="btn-ghost" onClick={onSpent}>
                Call it spent
              </button>
            )}
          </div>
          {gadget.restore && (
            <p className="text-sm text-ink-soft">
              Restore: {gadget.restore.note}
              {Object.keys(gadget.restore.need ?? {}).length
                ? ` Needs ${Object.entries(gadget.restore.need ?? {})
                    .map(([k, n]) => `${session.materials[k] ?? 0}/${n} ${k}`)
                    .join(", ")}.`
                : ""}
            </p>
          )}
        </div>
      )}

      <div className="space-y-3 border-t border-ink/15 px-4 py-3 text-sm">
        <p className="text-pretty">{gadget.provenance.note}</p>
        <p className="text-pretty text-ink-soft">
          {gadget.discovery.when}. {gadget.discovery.site}. {gadget.discovery.clue}.
        </p>
        <p className="text-pretty text-ink-soft">{gadget.storage.note}</p>
        <ul className="list-disc space-y-1 pl-4">
          {gadget.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
        {gadget.bindings.length > 0 && (
          <ul className="space-y-1 text-ink-soft">
            {gadget.bindings.map((b) => (
              <li key={b.id + b.kind}>{b.note}</li>
            ))}
          </ul>
        )}
        {session.notes.length > 0 && (
          <div>
            <p className="font-sans text-xs tracking-widest text-brass uppercase">Notes</p>
            <ul>
              {session.notes.slice(-4).map((n, i) => (
                <li key={`${n}-${i}`}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ArgEditor({
  gadget,
  args,
  setArgs,
  session,
}: {
  gadget: Gadget;
  args: Args;
  setArgs: (a: Args) => void;
  session: Session;
}) {
  const fields = gadget.uses.flatMap((u) => Object.keys(u.demoArgs ?? {}).map((key) => ({ use: u, key })));
  if (!fields.length) return null;
  return (
    <div className="space-y-2">
      {fields.map(({ use, key }) => (
        <Field key={use.id + key} use={use} k={key} args={args} setArgs={setArgs} session={session} />
      ))}
    </div>
  );
}

function Field({
  use,
  k,
  args,
  setArgs,
  session,
}: {
  use: UseDef;
  k: string;
  args: Args;
  setArgs: (a: Args) => void;
  session: Session;
}) {
  const chosen = k in args ? args[k] : use.demoArgs?.[k];
  const set = (value: string | number) => setArgs({ ...args, [k]: value });
  const label = <span className="mb-1 block font-sans text-xs tracking-widest text-brass uppercase">{use.title}</span>;
  if (k === "ounces") {
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {[6, 8, 10, 12].map((n) => (
            <button key={n} type="button" className={chosen === n ? "tab tab-on" : "tab"} onClick={() => set(n)}>
              {n} oz
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (k === "hz") {
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {[440, 220].map((n) => (
            <button key={n} type="button" className={chosen === n ? "tab tab-on" : "tab"} onClick={() => set(n)}>
              {n === 440 ? "440, the plate" : "220, the wrong plate"}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (k === "sequence") {
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {["low-high-low", "high-low-high"].map((seq) => (
            <button key={seq} type="button" className={chosen === seq ? "tab tab-on" : "tab"} onClick={() => set(seq)}>
              {seq}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (k === "pattern") {
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {["1-2-4", "1-1-1"].map((p) => (
            <button key={p} type="button" className={chosen === p ? "tab tab-on" : "tab"} onClick={() => set(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (k === "phrase") {
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {["two-note", "one-note"].map((p) => (
            <button key={p} type="button" className={chosen === p ? "tab tab-on" : "tab"} onClick={() => set(p)}>
              {p === "two-note" ? "Both notes" : "One note only"}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (k === "soundId") {
    const slice = session.slices[session.scene];
    const options = [
      ...slice.sounds.map((s) => s.id),
      ...(session.identifiedSound ? [session.identifiedSound] : []),
      "speech:ellis",
    ];
    const value = typeof args.soundId === "string" ? args.soundId : String(use.demoArgs?.soundId ?? options[0] ?? "");
    return (
      <label className="block text-sm">
        <span className="font-sans text-xs tracking-widest text-brass uppercase">What the wax takes</span>
        <select
          className="mt-1 min-h-11 w-full border border-ink/20 bg-paper px-2"
          value={value}
          onChange={(e) => set(e.target.value)}
        >
          {options.map((id) => (
            <option key={id} value={id}>
              {id === "speech:ellis" ? "A person’s speech (refused)" : id === session.identifiedSound ? `${id} (named by the horn)` : id}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return null;
}

function Plate({ gadget, active, onClick }: { gadget: Gadget; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={active ? "w-44 shrink-0 border border-oxide text-left" : "w-44 shrink-0 border border-ink/20 text-left"}>
      <img src={plateSrc(gadget)} alt="" className="w-full" />
      <span className="block px-2 py-2 font-display text-sm leading-tight">{gadget.name}</span>
    </button>
  );
}

function plateSrc(g: Gadget): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewSvg(g.n, g.family, g.name))}`;
}

function facts(world: ReturnType<typeof assemble>): string[] {
  const rows: string[] = [];
  for (const e of world.enemies) rows.push(`${e.id} · ${e.kind} · ${e.alert}${e.timer > 0 ? ` · ${e.timer}s` : ""}`);
  for (const l of world.lamps) rows.push(`lamp ${l.id} · ${l.kind} · ${l.mode}${l.moths ? " · moths" : ""}`);
  for (const c of world.compartments) rows.push(`compartment ${c.id} · ${c.revealed ? "found" : "hidden"}${c.unlatched ? " · open" : ""}`);
  for (const b of world.balances) rows.push(`balance ${b.currentOz}/${b.targetOz} oz${b.hanger ? " · hanger" : ""}${b.held ? " · held" : ""}`);
  for (const p of Object.values(world.puzzles)) rows.push(`puzzle ${p.id} · ${p.solved ? "solved" : "open"}`);
  if (world.identifiedSound) rows.push(`horn named ${world.identifiedSound}`);
  const hymnal = world.documents.hymnal;
  if (hymnal?.revealed) rows.push(hymnal.text);
  return rows;
}
