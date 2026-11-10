import { useEffect, useMemo, useState } from "react";
import roomArt from "../assets/room.jpg";
import { anchorById } from "../src/anchors.ts";
import { ARRANGEMENTS } from "../src/arrangements.ts";
import { CATALOG, acceptsItem } from "../src/catalog.ts";
import {
  applyArrangement,
  assessRoom,
  bindDisplay,
  createInitialSave,
  DISPLAY_SLOTS,
  facingLabel,
  fixRoom,
  foodName,
  functional,
  interact,
  isLoose,
  itemOf,
  loadSave,
  openAnchorsFor,
  pack,
  persistSave,
  place,
  releaseDisplay,
  roomAtmosphere,
  rotate,
  setBreeze,
  setEra,
  setVisitor,
  visiblePlacements,
  type ActionResult,
  type CatalogItem,
  type Era,
  type HomesteadHost,
  type PlacedObject,
  type RoomSave,
  type Verb,
} from "../src/index.ts";
import { sealMarkup } from "../src/seal.ts";
import { playMotif, unlockAudio } from "./sound.ts";

const CATEGORIES: { id: CatalogItem["category"]; label: string }[] = [
  { id: "lamp", label: "Lamps" },
  { id: "instrument", label: "Instruments" },
  { id: "chime", label: "Chimes" },
  { id: "tray", label: "Trays" },
  { id: "container", label: "Containers" },
  { id: "clock", label: "Clocks" },
  { id: "worksurface", label: "Work" },
  { id: "memento", label: "Mementos" },
];

const FAN = 46;

const ERAS: { id: Era; label: string }[] = [
  { id: "settlement", label: "Settlement" },
  { id: "homestead", label: "Homestead" },
  { id: "memory", label: "Memory" },
];

export function HouseholdRoom() {
  const [save, setSave] = useState<RoomSave>(() => createInitialSave());
  const [selectedId, setSelectedId] = useState<string | null>(
    () => visiblePlacements(createInitialSave())[0]?.instanceId ?? null,
  );
  const [log, setLog] = useState<string[]>([
    "The room is furnished for evening. Nothing here is a chore.",
  ]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [layout, setLayout] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSave(window.localStorage);
    setSave(loaded);
    const first = visiblePlacements(loaded)[0];
    setSelectedId(first?.instanceId ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const stored = persistSave(window.localStorage, save);
    setSaveNote(stored.ok ? null : (stored.message ?? "Not saved."));
    const onHide = () => {
      if (document.visibilityState === "hidden") persistSave(window.localStorage, save);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [save, hydrated]);

  const selected = save.instances.find((inst) => inst.instanceId === selectedId) ?? null;
  const air = roomAtmosphere(save);
  const problems = assessRoom(save).filter(
    (problem) =>
      problem.kind === "blocked-exit" ||
      problem.kind === "inaccessible-control" ||
      problem.kind === "dangling-support",
  );
  const placed = visiblePlacements(save).filter((inst) => {
    const anchor = inst.anchorId ? anchorById(inst.anchorId) : undefined;
    return anchor && !anchor.overflow;
  });
  const aside = visiblePlacements(save).filter((inst) => anchorById(inst.anchorId ?? "")?.overflow);
  const loft = save.instances.filter(
    (inst) => inst.packed && !inst.containerInstanceId && !inst.displaySlot,
  );
  const displayed = save.instances.filter((inst) => inst.displaySlot);

  const host = useMemo<HomesteadHost>(
    () => ({
      letters: {
        open: (ref) => setLog((prev) => [`Offered to the letters — ${ref}.`, ...prev].slice(0, 6)),
      },
      music: {
        cue: (ref) => setLog((prev) => [`Offered to the music — ${ref}.`, ...prev].slice(0, 6)),
      },
      display: {
        focus: (ref) => setLog((prev) => [`The house display took ${ref}.`, ...prev].slice(0, 6)),
      },
    }),
    [],
  );

  function speak(result: ActionResult): ActionResult {
    unlockAudio();
    setSave(result.save);
    setLog((prev) => [result.message, ...prev].slice(0, 5));
    if (soundOn && result.motif && !result.muted) playMotif(result.motif);
    return result;
  }

  function act(
    instanceId: string,
    verb: Verb,
    payload?: { targetInstanceId?: string; tokenId?: string; foodId?: string },
  ) {
    speak(interact(save, instanceId, verb, payload ?? {}, host));
  }

  const activeLayout = ARRANGEMENTS.find((arrangement) => arrangement.id === layout) ?? null;

  return (
    <main className="ash min-h-screen overflow-x-clip bg-ash-pine text-ash-cream">
      <div className="mx-auto flex max-w-6xl min-w-0 flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
        <header className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-ash-ember uppercase">
              Preincarnation
            </p>
            <h1 className="font-display text-4xl font-medium text-ash-cream md:text-5xl">
              Ash Bend
            </h1>
          </div>
          <p className="max-w-sm text-sm text-pretty text-ash-plaster/80">
            {air.label}. {save.breeze ? "The window is open." : "The window is shut."}{" "}
            {save.visitorPresent ? `${save.visitorName} is in the doorway.` : "No one has come up."}
            {saveNote ? <span className="mt-1 block text-ash-warn">{saveNote}</span> : null}
          </p>
        </header>

        <section
          className={`relative overflow-hidden rounded-2xl border border-ash-line/30 shadow-xl ${save.era === "settlement" ? "ash-era-settlement" : ""} ${save.era === "memory" ? "ash-era-memory" : ""}`}
        >
          <img
            src={roomArt}
            alt="The parlor at Ash Bend: plaster, a black hearth, a window onto pines at dusk, and an open door."
            className="block aspect-video w-full object-cover"
          />
          <div className="ash-vignette pointer-events-none absolute inset-0" />
          {air.level <= 0 ? (
            <div className="ash-dusk pointer-events-none absolute inset-0" />
          ) : null}
          {placed
            .filter((inst) => inst.state.lit)
            .map((inst) => {
              const anchor = anchorById(inst.anchorId ?? "");
              if (!anchor) return null;
              return (
                <span
                  key={`${inst.instanceId}-glow`}
                  className="ash-lamp pointer-events-none absolute size-36 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
                />
              );
            })}
          {placed.map((inst) => {
            const anchor = anchorById(inst.anchorId ?? "");
            if (!anchor) return null;
            const siblings = placed.filter((other) => other.anchorId === inst.anchorId);
            const index = siblings.findIndex((other) => other.instanceId === inst.instanceId);
            const shift = (index - (siblings.length - 1) / 2) * FAN;
            const item = itemOf(inst);
            const on = selectedId === inst.instanceId;
            const kept = !functional(save, item) && retires(item);
            return (
              <button
                key={inst.instanceId}
                type="button"
                aria-pressed={on}
                aria-label={`${item.name}, ${anchor.label}`}
                onClick={() => setSelectedId(inst.instanceId)}
                className={`absolute z-10 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full border-2 shadow-md ${on ? "z-30 border-ash-ember bg-ash-cream" : "border-ash-ink/25 bg-ash-cream/95"} ${kept ? "opacity-80" : ""}`}
                style={{ left: `calc(${anchor.x}% + ${shift}px)`, top: `${anchor.y}%` }}
              >
                <Seal n={item.n} category={item.category} />
                {inst.state.lit ? (
                  <span className="absolute top-0 right-0 size-2.5 rounded-full border border-ash-cream bg-ash-ember" />
                ) : null}
              </button>
            );
          })}
          {selected && selected.anchorId && !anchorById(selected.anchorId)?.overflow ? (
            <PlaceCaption inst={selected} siblings={placed} />
          ) : null}
          {save.visitorPresent ? (
            <p className="absolute bottom-[18%] left-[82%] z-20 -translate-x-1/2 rounded-full bg-ash-moss-deep/90 px-3 py-1 text-xs text-ash-cream">
              {save.visitorName}
            </p>
          ) : null}
        </section>

        {air.reveals.length ? (
          <blockquote className="font-display text-lg text-pretty text-ash-plaster italic">
            {air.reveals.map((reveal) => reveal.text).join(" ")}
          </blockquote>
        ) : null}

        {problems.length ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ash-warn/50 bg-ash-warn/15 px-3 py-2 text-sm">
            <p>{problems[0].message}</p>
            <button type="button" className={pill(true)} onClick={() => speak(fixRoom(save))}>
              Shift it aside
            </button>
          </div>
        ) : null}

        {aside.length ? (
          <p className="text-sm text-ash-plaster/80">
            Set aside: {aside.map((inst) => itemOf(inst).name).join(", ")}.
          </p>
        ) : null}

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div
            role="group"
            aria-label="Year"
            className="flex rounded-full border border-ash-line/40 p-1"
          >
            {ERAS.map((era) => (
              <button
                key={era.id}
                type="button"
                aria-pressed={save.era === era.id}
                className={segment(save.era === era.id)}
                onClick={() => speak(setEra(save, era.id))}
              >
                {era.label}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label="Arrangement"
            className="flex rounded-full border border-ash-line/40 p-1"
          >
            {ARRANGEMENTS.map((arrangement) => (
              <button
                key={arrangement.id}
                type="button"
                title={arrangement.blurb}
                aria-pressed={layout === arrangement.id}
                className={segment(layout === arrangement.id)}
                onClick={() => {
                  const result = speak(applyArrangement(save, arrangement.id));
                  if (result.ok) setLayout(arrangement.id);
                }}
              >
                {arrangement.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-pretty text-ash-plaster/70">
          {activeLayout
            ? activeLayout.blurb
            : "The same twenty things, set three ways. Nothing here is a chore."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={pill(save.breeze)}
            aria-pressed={save.breeze}
            onClick={() => speak(setBreeze(save, !save.breeze))}
          >
            {save.breeze ? "Window open" : "Open the window"}
          </button>
          <button
            type="button"
            className={pill(save.visitorPresent)}
            aria-pressed={save.visitorPresent}
            onClick={() => speak(setVisitor(save, !save.visitorPresent))}
          >
            {save.visitorPresent ? "Mara is here" : "Ask Mara in"}
          </button>
          <button
            type="button"
            className={pill(soundOn)}
            aria-pressed={soundOn}
            onClick={() => {
              unlockAudio();
              setSoundOn((on) => !on);
            }}
          >
            {soundOn ? "Sound on" : "Sound off"}
          </button>
          <button type="button" className={pill(false)} onClick={() => setCatalogOpen(true)}>
            The loft ({loft.length})
          </button>
        </div>

        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
            <div className="min-w-0">
              <h2 className="font-display text-xl text-ash-cream">Set out</h2>
              <ul className="mt-2 flex max-w-full snap-x gap-2 overflow-x-auto pb-1 lg:max-h-[32rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
                {placed.map((inst) => {
                  const item = itemOf(inst);
                  const anchor = anchorById(inst.anchorId ?? "");
                  const on = selectedId === inst.instanceId;
                  return (
                    <li key={inst.instanceId} className="shrink-0 snap-start lg:shrink">
                      <button
                        type="button"
                        aria-pressed={on}
                        className={`flex min-h-11 items-center gap-3 rounded-full border px-3 text-left lg:w-full lg:rounded-lg ${on ? "border-ash-ember bg-ash-ember text-ash-cream" : "border-ash-line/30 bg-ash-moss-deep/25 text-ash-cream"}`}
                        onClick={() => setSelectedId(inst.instanceId)}
                      >
                        <Seal n={item.n} category={item.category} compact />
                        <span className="min-w-0">
                          <span className="block truncate">{item.name}</span>
                          <span
                            className={`block truncate text-xs ${on ? "text-ash-cream/80" : "text-ash-plaster/60"}`}
                          >
                            {anchor?.label}
                            {statusLine(inst, item) !== item.category
                              ? ` · ${statusLine(inst, item)}`
                              : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <aside
            id="ash-card"
            className="order-1 flex flex-col gap-3 rounded-xl border border-ash-line/30 bg-ash-ink/80 p-4 lg:sticky lg:top-4 lg:order-2"
          >
            {selected ? (
              <Inspector
                save={save}
                inst={selected}
                onAct={act}
                onPlace={(anchorId) => {
                  speak(place(save, selected.instanceId, anchorId));
                  setLayout(null);
                }}
                onRotate={() => speak(rotate(save, selected.instanceId))}
                onPack={() => {
                  speak(pack(save, selected.instanceId));
                  setLayout(null);
                }}
                onDisplay={() => {
                  const free = DISPLAY_SLOTS.find(
                    (slot) => !save.instances.some((inst) => inst.displaySlot === slot),
                  );
                  if (!free) {
                    setLog((prev) => ["The house display is full.", ...prev].slice(0, 5));
                    return;
                  }
                  speak(bindDisplay(save, selected.instanceId, free, host));
                  setLayout(null);
                }}
                onRecall={() => {
                  speak(releaseDisplay(save, selected.instanceId));
                  setLayout(null);
                }}
              />
            ) : (
              <p className="text-ash-plaster/80">Choose something the room remembers.</p>
            )}
            <div className="border-t border-ash-line/30 pt-3">
              <h2 className="font-display text-sm text-ash-plaster/70">The room says</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {log.map((line, index) => (
                  <li
                    key={`${index}-${line.slice(0, 16)}`}
                    className={`text-sm text-pretty ${index === 0 ? "font-display text-base text-ash-cream" : "text-ash-cream/75"}`}
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            {displayed.length ? (
              <p className="text-xs text-ash-plaster/70">
                On the house display, not on the floor:{" "}
                {displayed.map((inst) => itemOf(inst).name).join(", ")}.
              </p>
            ) : null}
          </aside>
        </div>

        {catalogOpen ? (
          <div
            className="fixed inset-0 z-20 flex items-end justify-center bg-ash-pine/70 p-3 md:items-center"
            role="dialog"
            aria-modal="true"
            aria-label="Household loft"
          >
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col gap-3 overflow-hidden rounded-xl border border-ash-line/40 bg-ash-cream text-ash-ink shadow-2xl">
              <div className="flex items-center justify-between gap-3 px-4 pt-4">
                <h2 className="font-display text-2xl">The loft</h2>
                <button
                  type="button"
                  className="min-h-11 rounded-full px-3 text-sm"
                  onClick={() => setCatalogOpen(false)}
                >
                  Close
                </button>
              </div>
              <label className="px-4 text-sm">
                <span className="sr-only">Search the household</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search lamps, trays, mementos"
                  className="min-h-11 w-full rounded-lg border border-ash-line bg-white/60 px-3"
                />
              </label>
              <div className="overflow-y-auto px-4 pb-4">
                {CATEGORIES.map((category) => {
                  const items = CATALOG.filter(
                    (item) =>
                      item.category === category.id &&
                      item.name.toLowerCase().includes(query.trim().toLowerCase()),
                  );
                  if (!items.length) return null;
                  return (
                    <section key={category.id} className="mt-4">
                      <h3 className="font-display text-lg">{category.label}</h3>
                      <ul className="mt-2 flex flex-col gap-2">
                        {items.map((item) => {
                          const inst = save.instances.find((entry) => entry.catalogId === item.id);
                          if (!inst) return null;
                          return (
                            <li
                              key={item.id}
                              className="flex min-h-11 items-center gap-3 rounded-lg border border-ash-line/70 bg-white/40 p-2"
                            >
                              <Seal n={item.n} category={item.category} />
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left"
                                onClick={() => {
                                  setSelectedId(inst.instanceId);
                                  setCatalogOpen(false);
                                }}
                              >
                                <span className="block font-medium">{item.name}</span>
                                <span className="block text-sm text-pretty text-ash-muted">
                                  {item.summary}
                                </span>
                              </button>
                              <span className="hidden text-xs text-ash-muted sm:block">
                                {where(save, inst)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Inspector({
  save,
  inst,
  onAct,
  onPlace,
  onRotate,
  onPack,
  onDisplay,
  onRecall,
}: {
  save: RoomSave;
  inst: PlacedObject;
  onAct: (
    id: string,
    verb: Verb,
    payload?: { targetInstanceId?: string; tokenId?: string; foodId?: string },
  ) => void;
  onPlace: (anchorId: string) => void;
  onRotate: () => void;
  onPack: () => void;
  onDisplay: () => void;
  onRecall: () => void;
}) {
  const item = itemOf(inst);
  const kept = !functional(save, item) && retires(item);
  const places = openAnchorsFor(save, inst.instanceId);
  const tuckable = save.instances.filter(
    (other) => isLoose(other) && acceptsItem(item, itemOf(other)),
  );
  const foods = item.foods ?? item.accept?.foods ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Seal n={item.n} category={item.category} large />
        <div>
          <p className="text-xs tracking-[0.16em] text-ash-ember uppercase">{item.category}</p>
          <h2 className="font-display text-3xl leading-none text-ash-cream">{item.name}</h2>
          <p className="mt-1 text-xs tracking-[0.14em] text-ash-plaster/70 uppercase">
            {where(save, inst)}
          </p>
          <p className="mt-1 text-sm text-pretty text-ash-plaster/80">{item.summary}</p>
        </div>
      </div>
      <p className="font-display text-sm text-pretty text-ash-cream/90 italic">
        {item.history[save.era]}
      </p>
      {kept ? (
        <p className="text-sm text-ash-ember">
          Kept from another year. It stays. It will not do that work.
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {primaryActions(save, inst, item)
          .filter((action) => action.emphasis)
          .map((action) => (
            <button
              key={action.label}
              type="button"
              className="min-h-12 w-full rounded-full bg-ash-ember text-sm font-medium text-ash-cream"
              onClick={() => onAct(inst.instanceId, action.verb, action.payload)}
            >
              {action.label}
            </button>
          ))}
        <div className="flex flex-wrap gap-2">
          {primaryActions(save, inst, item)
            .filter((action) => !action.emphasis)
            .map((action) => (
              <button
                key={action.label}
                type="button"
                className={pill(false)}
                onClick={() => onAct(inst.instanceId, action.verb, action.payload)}
              >
                {action.label}
              </button>
            ))}
          {item.rotatable && isLoose(inst) ? (
            <button type="button" className={pill(false)} onClick={onRotate}>
              {facingLabel(inst.rotation)}
            </button>
          ) : null}
          {inst.displaySlot ? (
            <button type="button" className={pill(false)} onClick={onRecall}>
              Recall from the display
            </button>
          ) : (
            <button type="button" className={pill(false)} onClick={onDisplay}>
              Offer to the house display
            </button>
          )}
          {!inst.packed ? (
            <button type="button" className={pill(false)} onClick={onPack}>
              Put in the loft
            </button>
          ) : null}
        </div>
      </div>
      {item.interaction === "organization" && isLoose(inst) ? (
        <div className="flex flex-col gap-2">
          {tuckable.length ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.14em] text-ash-plaster/60 uppercase">
                Tuck something in
              </span>
              <select
                className="ash-select"
                value=""
                onChange={(event) => {
                  if (event.target.value)
                    onAct(inst.instanceId, "stow", { targetInstanceId: event.target.value });
                }}
              >
                <option value="">Choose</option>
                {tuckable.map((other) => (
                  <option key={other.instanceId} value={other.instanceId}>
                    {itemOf(other).name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {foods.map((foodId) => {
            const portions = save.pantry.find((food) => food.id === foodId)?.portions ?? 0;
            if (!portions) return null;
            return (
              <button
                key={foodId}
                type="button"
                className={pill(false)}
                onClick={() => onAct(inst.instanceId, "stow", { foodId })}
              >
                Tuck {foodName(foodId)} ({portions})
              </button>
            );
          })}
          {save.tokens
            .filter(
              (token) =>
                (item.accept?.tokenTags ?? []).some((tag) => token.tags.includes(tag)) &&
                !inst.state.heldTokenIds.includes(token.id),
            )
            .map((token) => (
              <button
                key={token.id}
                type="button"
                className={pill(false)}
                onClick={() => onAct(inst.instanceId, "stow", { tokenId: token.id })}
              >
                Tuck {token.name}
              </button>
            ))}
          {inst.state.heldInstanceIds.map((id) => {
            const held = save.instances.find((entry) => entry.instanceId === id);
            if (!held) return null;
            return (
              <button
                key={id}
                type="button"
                className={pill(true)}
                onClick={() => onAct(inst.instanceId, "lay", { targetInstanceId: id })}
              >
                Lay out {itemOf(held).name}
              </button>
            );
          })}
        </div>
      ) : null}
      {item.interaction === "serve" && isLoose(inst) && !kept ? (
        <div className="flex flex-wrap gap-2">
          {(item.foods ?? []).map((foodId) => {
            const portions = save.pantry.find((food) => food.id === foodId)?.portions ?? 0;
            return (
              <button
                key={foodId}
                type="button"
                className={pill(portions > 0)}
                disabled={portions < 1}
                onClick={() => onAct(inst.instanceId, "serve", { foodId })}
              >
                Serve {foodName(foodId)} ({portions})
              </button>
            );
          })}
        </div>
      ) : null}
      <label className="flex flex-col gap-1">
        <span className="text-xs tracking-[0.14em] text-ash-plaster/60 uppercase">Move it</span>
        {places.length ? (
          <select
            className="ash-select"
            value={
              inst.anchorId && places.some((anchor) => anchor.id === inst.anchorId)
                ? inst.anchorId
                : ""
            }
            onChange={(event) => {
              if (event.target.value) onPlace(event.target.value);
            }}
          >
            {inst.anchorId ? null : <option value="">Choose a place</option>}
            {places.map((anchor) => (
              <option key={anchor.id} value={anchor.id}>
                {anchor.label}
                {anchor.covers.length ? " — covers a latch" : ""}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-ash-plaster/70">No open place can hold it.</p>
        )}
      </label>
    </div>
  );
}

function primaryActions(
  save: RoomSave,
  inst: PlacedObject,
  item: CatalogItem,
): { label: string; verb: Verb; payload?: { foodId?: string }; emphasis: boolean }[] {
  const kept = !functional(save, item) && retires(item);
  if (kept) return [{ label: "Remember", verb: "use", emphasis: true }];
  if (item.interaction === "illumination") {
    return [{ label: inst.state.lit ? "Put it out" : "Light it", verb: "use", emphasis: true }];
  }
  if (item.interaction === "sound") {
    const actions: { label: string; verb: Verb; emphasis: boolean }[] = [
      {
        label: item.needsBreeze
          ? "Listen"
          : item.windable
            ? "Strike"
            : item.aligns
              ? "Align the mark"
              : "Play",
        verb: "use",
        emphasis: true,
      },
    ];
    if (item.windable) actions.push({ label: "Wind", verb: "wind", emphasis: false });
    if (item.frozenHour != null)
      actions.push({ label: "Try the key", verb: "wind", emphasis: false });
    return actions;
  }
  if (item.interaction === "organization")
    return [{ label: "Look inside", verb: "use", emphasis: true }];
  if (item.interaction === "serve") {
    const actions: { label: string; verb: Verb; emphasis: boolean }[] = [
      { label: "What it can carry", verb: "use", emphasis: false },
    ];
    if (inst.state.served.length)
      actions.push({ label: "Clear the dishes", verb: "clear-food", emphasis: true });
    return actions;
  }
  if (item.interaction === "craft")
    return [
      {
        label: inst.state.craftDone ? "See it again" : "Show the craft",
        verb: "use",
        emphasis: true,
      },
    ];
  if (item.interaction === "visitor")
    return [
      {
        label: item.arms ? (inst.state.armed ? "Ring or unarm" : "Arm for company") : "Greet",
        verb: "use",
        emphasis: true,
      },
    ];
  return [{ label: "Read", verb: "use", emphasis: true }];
}

function retires(item: CatalogItem): boolean {
  return (
    item.interaction === "illumination" ||
    item.interaction === "craft" ||
    item.interaction === "serve" ||
    item.interaction === "sound"
  );
}

function statusLine(inst: PlacedObject, item: CatalogItem): string {
  if (inst.state.lit) return "Lit";
  if (inst.state.served.length)
    return inst.state.served.map((food) => foodName(food.foodId)).join(", ");
  if (inst.state.heldInstanceIds.length) return `${inst.state.heldInstanceIds.length} tucked`;
  if (item.frozenHour != null) return "Four";
  return item.category;
}

function where(save: RoomSave, inst: PlacedObject): string {
  if (inst.displaySlot) return "House display";
  if (inst.containerInstanceId) {
    const holder = save.instances.find((entry) => entry.instanceId === inst.containerInstanceId);
    return holder ? `Inside ${itemOf(holder).name}` : "Held";
  }
  if (inst.anchorId) return anchorById(inst.anchorId)?.label ?? "Out";
  return "In the loft";
}

function Seal({
  n,
  category,
  large = false,
  compact = false,
}: {
  n: number;
  category: CatalogItem["category"];
  large?: boolean;
  compact?: boolean;
}) {
  const size = large ? "size-16 shrink-0" : compact ? "size-8 shrink-0" : "size-10 shrink-0";
  return (
    <svg
      viewBox="0 0 64 64"
      className={size}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: sealMarkup(n, category) }}
    />
  );
}

function PlaceCaption({ inst, siblings }: { inst: PlacedObject; siblings: PlacedObject[] }) {
  const anchor = anchorById(inst.anchorId ?? "");
  if (!anchor) return null;
  const group = siblings.filter((other) => other.anchorId === inst.anchorId);
  const index = Math.max(
    0,
    group.findIndex((other) => other.instanceId === inst.instanceId),
  );
  const shift = (index - (group.length - 1) / 2) * FAN;
  const item = itemOf(inst);
  const floor = anchor.y > 68;
  const parkLeft = anchor.x > 62;
  return (
    <div
      className={`pointer-events-none absolute z-40 w-36 rounded-md bg-ash-cream px-2 py-1 text-center shadow-md ${floor ? "" : "-translate-x-1/2"}`}
      style={
        floor
          ? {
              left: parkLeft
                ? `calc(${anchor.x}% + ${shift}px - 9.6rem)`
                : `calc(${anchor.x}% + ${shift}px + 1.7rem)`,
              top: `calc(${anchor.y}% - 1.35rem)`,
            }
          : {
              left: `calc(${anchor.x}% + ${shift}px)`,
              top: `calc(${anchor.y}% + 1.7rem)`,
            }
      }
    >
      <p className="font-display text-sm leading-tight text-ash-ink">{item.name}</p>
      <p className="text-xs text-ash-muted">{anchor.label}</p>
    </div>
  );
}

function segment(on: boolean): string {
  return `min-h-11 min-w-0 flex-1 truncate rounded-full px-1 text-xs sm:px-2 sm:text-sm ${on ? "bg-ash-ember text-ash-cream" : "text-ash-cream/80"}`;
}

function pill(on: boolean): string {
  return `min-h-11 rounded-full border px-3 text-sm ${on ? "border-ash-ember bg-ash-ember text-ash-cream" : "border-ash-line/40 text-ash-cream"}`;
}
