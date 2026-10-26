import { useEffect, useState } from "react";
import {
  BEAT_LABEL,
  CREATURES,
  ERA_LABEL,
  ERA_NOTE,
  HABITAT_INFO,
  LIGHT_LABEL,
  PACE_LABEL,
  PREP_LABEL,
  STATION_INFO,
  TRAIL,
  WEATHER_LABEL,
  addPrep,
  advanceBeat,
  applyDisposition,
  applyEncounterAction,
  beginEncounter,
  completion,
  creaturesAtStation,
  evaluatePresence,
  getCreature,
  leaveEncounter,
  newOuting,
  recordOf,
  requestHint,
  setEra,
  setLight,
  setStation,
  walkTheRidge,
  type ActionResult,
  type OutingSave,
  type StationId,
} from "@/game/field/index.ts";
import { ERAS, LIGHTS } from "@/game/field/types.ts";
import { useOuting } from "./field-outing";

const TIER_LABEL = { ordinary: "Ordinary", unusual: "Unusual", vein: "Vein-touched" } as const;

const CHANNEL_LABEL = {
  field: "Field",
  notebook: "Notebook",
  cooking: "Kitchen",
  infirmary: "Infirmary",
  character: "People",
  specimen: "Kept",
} as const;

type BookFilter = "meadow" | "county" | "inked";

export function FieldBook({ onClose }: { onClose: () => void }) {
  const { save, setSave, ready } = useOuting();
  const [tab, setTab] = useState<"walk" | "book" | "journal">("walk");
  const [banner, setBanner] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string>("monarch");
  const [filter, setFilter] = useState<BookFilter>("meadow");

  function commit(result: ActionResult) {
    setSave(result.save);
    const noted = result.granted?.length ? ` The book keeps: ${result.granted.join("; ")}.` : "";
    setBanner(`${result.message}${noted}`);
    if (result.kind === "done" || result.kind === "miss") {
      setTab("walk");
      requestAnimationFrame(() => {
        document.querySelector("[aria-label='Field book']")?.scrollTo({ top: 0 });
      });
    }
  }

  const book = completion(save);
  const here = save.world.station;

  return (
    <section className="absolute inset-0 z-30 overflow-y-auto bg-bg px-4 py-6 sm:px-6" aria-label="Field book">
      <div className="mx-auto max-w-3xl">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
        <p className="text-sm font-medium tracking-widest text-primary uppercase">Optional outing</p>
        <h1 className="mt-1 text-4xl text-fg sm:text-5xl">Lantern Meadow</h1>
        <p className="mt-2 max-w-xl text-fg-subtle">
          Otter Creek below the Moth Infirmary. The net is a real net. The book does not have to be finished. The Vein is still the job.
        </p>
        </div>
        <button type="button" className="min-h-11 shrink-0 rounded-full border border-border bg-bg-elevated px-3 py-2 text-sm font-medium text-fg" onClick={onClose}>
          Close the book
        </button>
      </header>

      {save.active ? (
        <>
          {banner ? <Banner text={banner} /> : null}
          <Encounter save={save} commit={commit} />
        </>
      ) : (
        <>
          <div className="mb-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle" aria-hidden="true">
              <div className="h-full bg-primary" style={{ width: `${book.meadowTotal ? (100 * book.meadowObserved) / book.meadowTotal : 0}%` }} />
            </div>
            <p className="mt-2 text-sm text-fg-subtle">
              Meadow {book.meadowObserved} of {book.meadowTotal}. County book {book.observed} of {book.total}. Ordinary{" "}
              {book.byTier.ordinary.observed}, unusual {book.byTier.unusual.observed}, Vein-touched{" "}
              {book.byTier.vein.observed}.
            </p>
          </div>

          {tab === "walk" ? null : (
            <p className="text-sm text-fg-subtle">
              {ERA_LABEL[save.world.era]} · {BEAT_LABEL[save.world.beat]} · {WEATHER_LABEL[save.world.weather]} ·{" "}
              {LIGHT_LABEL[save.world.light]}
              {here ? ` · ${STATION_INFO[here].name}` : " · At the gate"}
            </p>
          )}

          {banner ? <Banner text={banner} /> : null}
          <Tabs tab={tab} setTab={setTab} journalCount={save.journal.length} inked={book.observed} />

          <div className="mt-4">
            {tab === "walk" ? (
              <>
                <Trail
                  save={save}
                  onStation={(station) => {
                    const next = setStation(save, station);
                    setSave(next);
                    setBanner(`${STATION_INFO[station].name}. ${STATION_INFO[station].line}`);
                  }}
                  onPrep={(prep) => {
                    if (save.world.preps.includes(prep)) return;
                    setSave(addPrep(save, prep));
                    setBanner(`${PREP_LABEL[prep]}.`);
                  }}
                  onAttend={(id) => commit(beginEncounter(save, id))}
                />
                <figure className="mt-6 overflow-hidden rounded-lg border border-border bg-bg-elevated">
                  <img
                    src="/art/meadow.jpg"
                    alt="A floodplain meadow, stone walls, a slow creek, and a lantern burning at a pale house."
                    className="h-40 w-full object-cover sm:h-48"
                  />
                  <figcaption className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm text-fg-subtle">
                    <span>{HABITAT_INFO["lantern-meadow"].place}</span>
                    <span>
                      {ERA_LABEL[save.world.era]} · {BEAT_LABEL[save.world.beat]} · {WEATHER_LABEL[save.world.weather]}
                    </span>
                  </figcaption>
                </figure>
                <Season save={save} setSave={setSave} setBanner={setBanner} ready={ready} />
              </>
            ) : tab === "book" ? (
              <Notebook
                save={save}
                openId={openId}
                setOpenId={setOpenId}
                filter={filter}
                setFilter={setFilter}
                commit={commit}
              />
            ) : (
              <Journal save={save} onOpen={(id) => { setOpenId(id); setTab("book"); }} />
            )}
          </div>
        </>
      )}
    </div>
    </section>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <p className="mt-4 border-l-2 border-primary pl-3 text-fg" aria-live="polite">
      {text}
    </p>
  );
}

function Tabs({
  tab,
  setTab,
  journalCount,
  inked,
}: {
  tab: "walk" | "book" | "journal";
  setTab: (tab: "walk" | "book" | "journal") => void;
  journalCount: number;
  inked: number;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 mt-6 flex gap-2 border-b border-border bg-bg px-4 py-2 sm:-mx-6 sm:px-6" role="tablist" aria-label="Field book">
      <button type="button" role="tab" aria-selected={tab === "walk"} className={chip(tab === "walk")} onClick={() => setTab("walk")}>
        The walk
      </button>
      <button type="button" role="tab" aria-selected={tab === "book"} className={chip(tab === "book")} onClick={() => setTab("book")}>
        Notebook{inked > 0 ? ` · ${inked}` : ""}
      </button>
      <button type="button" role="tab" aria-selected={tab === "journal"} className={chip(tab === "journal")} onClick={() => setTab("journal")}>
        Journal{journalCount > 0 ? ` · ${journalCount}` : ""}
      </button>
    </div>
  );
}

function Season({
  save,
  setSave,
  setBanner,
  ready,
}: {
  save: OutingSave;
  setSave: (save: OutingSave) => void;
  setBanner: (text: string) => void;
  ready: boolean;
}) {
  const night =
    save.world.beat === "dusk" || save.world.beat === "true-dark" || save.world.era === "vein-night";

  return (
    <section className="mt-4 rounded-lg border border-border bg-bg-elevated p-4" aria-label="Season and light">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">{ERA_LABEL[save.world.era]}</h2>
          <p className="text-sm text-fg-subtle">{ERA_NOTE[save.world.era]}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Fact label="Hour" value={BEAT_LABEL[save.world.beat]} />
        <Fact label="Weather" value={WEATHER_LABEL[save.world.weather]} />
        <Fact label="Pace" value={PACE_LABEL[save.world.pace]} />
        <Fact label="Lantern" value={LIGHT_LABEL[save.world.light]} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {ERAS.map((era) => (
          <button
            key={era}
            type="button"
            disabled={!ready}
            aria-pressed={save.world.era === era}
            className={chip(save.world.era === era)}
            onClick={() => {
              setSave(setEra(save, era));
              setBanner(ERA_NOTE[era]);
            }}
          >
            {ERA_LABEL[era]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={chip(false)}
          onClick={() => {
            const next = advanceBeat(save);
            setSave(next);
            setBanner(`A quarter-hour passes. It is ${BEAT_LABEL[next.world.beat]}.`);
          }}
        >
          Let a quarter-hour pass
        </button>
        <button
          type="button"
          className={chip(false)}
          onClick={() => {
            const next = walkTheRidge(save);
            setSave(next);
            setBanner(`You walk the ridge and back. ${WEATHER_LABEL[next.world.weather]}. ${BEAT_LABEL[next.world.beat]}.`);
          }}
        >
          Walk the ridge
        </button>
        <button
          type="button"
          className={chip(false)}
          onClick={() => {
            setSave(newOuting(save));
            setBanner("The walk starts over. The notebook stays.");
          }}
        >
          Start this walk over
        </button>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-fg-subtle">Lantern</h3>
        {night ? <p className="mt-1 text-sm text-fg-subtle">Night work cares which lantern you carry.</p> : null}
        <div className="mt-2 flex flex-wrap gap-2" aria-label="Lantern">
          {LIGHTS.map((light) => (
            <button
              key={light}
              type="button"
              aria-pressed={save.world.light === light}
              className={chip(save.world.light === light)}
              onClick={() => {
                setSave(setLight(save, light));
                setBanner(LIGHT_LABEL[light]);
              }}
            >
              {LIGHT_LABEL[light]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="font-medium text-fg">{value}</dd>
    </div>
  );
}

function chip(on: boolean): string {
  return [
    "min-h-11 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
    on ? "border-primary bg-primary text-primary-fg" : "border-border bg-bg-elevated text-fg hover:border-primary",
  ].join(" ");
}

/** Walking to a station clears preps and sound. Preview who would be there under that rule. */
function presenceAt(save: OutingSave, station: StationId) {
  const there =
    save.world.station === station
      ? save
      : { ...save, world: { ...save.world, station, preps: [], sound: "quiet" as const } };
  return creaturesAtStation(station).map((creature) => ({
    creature,
    presence: evaluatePresence(there, creature.id),
  }));
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function Trail({
  save,
  onStation,
  onPrep,
  onAttend,
}: {
  save: OutingSave;
  onStation: (station: StationId) => void;
  onPrep: (prep: (typeof save.world.preps)[number]) => void;
  onAttend: (id: string) => void;
}) {
  const here = save.world.station;
  const index = here ? TRAIL.indexOf(here) : -1;
  const prev = index > 0 ? TRAIL[index - 1] : null;
  const next = index >= 0 && index < TRAIL.length - 1 ? TRAIL[index + 1] : null;
  const census = TRAIL.map((station) => ({
    station,
    waiting: presenceAt(save, station).filter((item) => item.presence.status === "present").length,
  }));
  const hereWaiting = here ? (census.find((item) => item.station === here)?.waiting ?? 0) : 0;
  const elsewhere = census.filter((item) => item.waiting > 0 && item.station !== here);

  let advice: string;
  if (!here) {
    advice =
      elsewhere.length > 0
        ? `From the gate: something is keeping still at ${joinNames(elsewhere.map((item) => STATION_INFO[item.station].name))}.`
        : "From the gate the meadow looks quiet. Another hour, or a walk along the ridge, changes who keeps still.";
  } else if (hereWaiting > 0) {
    advice = `You are at the ${STATION_INFO[here].name.toLowerCase()}.`;
  } else if (STATION_INFO[here].preps.some((prep) => !save.world.preps.includes(prep))) {
    advice =
      elsewhere.length > 0
        ? `Look under this stop before you leave it. Something is also out at ${joinNames(elsewhere.map((item) => STATION_INFO[item.station].name))}.`
        : "Look under this stop. Turning a stone or a log is part of the search, not a wait.";
  } else if (elsewhere.length > 0) {
    advice = `Nothing here will hold. Something is out at ${joinNames(elsewhere.map((item) => STATION_INFO[item.station].name))}.`;
  } else {
    advice = "This quarter-hour is quiet. Let an hour pass, or walk the ridge and turn the weather.";
  }

  return (
    <section aria-label="Stations">
      <p className="mb-3 text-sm text-fg-subtle">{advice} A quarter-hour is a turn of the page, not a wait in the real day.</p>
      <div className="flex gap-2 overflow-x-auto pb-1" role="list">
        {TRAIL.map((station, order) => {
          const current = here === station;
          const waiting = census.find((item) => item.station === station)?.waiting ?? 0;
          return (
            <button
              key={station}
              type="button"
              role="listitem"
              aria-current={current ? "step" : undefined}
              aria-label={`${order + 1}. ${STATION_INFO[station].name}${waiting ? `, ${waiting} present` : ""}`}
              className={`${chip(current)} shrink-0`}
              onClick={() => onStation(station)}
            >
              {order + 1}. {STATION_INFO[station].name}
              {waiting > 0 ? ` · ${waiting}` : ""}
            </button>
          );
        })}
      </div>

      {!here ? (
        <div className="mt-4 rounded-lg border border-border bg-bg-elevated p-4">
          <h2 className="text-2xl">At the gate</h2>
          <p className="mt-1 text-sm text-fg-subtle">The milkweed verge is the first stop. You do not have to walk them in order.</p>
          <button type="button" className={`${chip(true)} mt-3`} onClick={() => onStation("milkweed")}>
            Start at the milkweed verge
          </button>
        </div>
      ) : (
        <StationPanel save={save} station={here} prev={prev} next={next} onStation={onStation} onPrep={onPrep} onAttend={onAttend} />
      )}
    </section>
  );
}

function StationPanel({
  save,
  station,
  prev,
  next,
  onStation,
  onPrep,
  onAttend,
}: {
  save: OutingSave;
  station: StationId;
  prev: StationId | null;
  next: StationId | null;
  onStation: (station: StationId) => void;
  onPrep: (prep: (typeof save.world.preps)[number]) => void;
  onAttend: (id: string) => void;
}) {
  const info = STATION_INFO[station];
  const rows = presenceAt(save, station);
  const present = rows.filter((row) => row.presence.status === "present");
  const away = rows.filter((row) => row.presence.status !== "present");

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">{info.name}</h2>
          <p className="text-sm text-fg-subtle">{info.line}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {prev ? (
            <button type="button" className={chip(false)} onClick={() => onStation(prev)}>
              Back · {STATION_INFO[prev].name}
            </button>
          ) : null}
          {next ? (
            <button type="button" className={chip(true)} onClick={() => onStation(next)}>
              Walk on · {STATION_INFO[next].name}
            </button>
          ) : (
            <p className="max-w-xs text-sm text-fg-subtle">The lantern is the last rise. The ridge changes the weather.</p>
          )}
        </div>
      </div>

      {info.preps.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {info.preps.map((prep) => (
            <button
              key={prep}
              type="button"
              aria-pressed={save.world.preps.includes(prep)}
              className={chip(save.world.preps.includes(prep))}
              onClick={() => onPrep(prep)}
            >
              {PREP_LABEL[prep]}
            </button>
          ))}
        </div>
      ) : null}

      {present.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {present.map(({ creature }) => {
            const seen = recordOf(save, creature.id).timesSeen > 0;
            return (
              <li key={creature.id} className="rounded-lg border border-border bg-bg-elevated px-3 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <strong className="font-display text-lg font-medium">{creature.commonName}</strong>
                  <span className="text-xs tracking-wide text-fg-subtle uppercase">
                    {TIER_LABEL[creature.tier]}
                    {seen ? " · inked" : ""}
                  </span>
                </div>
                <p className="mt-1 text-sm text-fg">{creature.discoveryClue}</p>
                <button type="button" className={`${chip(true)} mt-3`} onClick={() => onAttend(creature.id)}>
                  Attend
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-fg-subtle">Nothing at this stop will hold for the hour you have.</p>
      )}

      {away.length > 0 ? (
        <details className="mt-4">
          <summary className="min-h-11 cursor-pointer py-2 text-sm text-fg-subtle">Not this hour ({away.length})</summary>
          <ul className="space-y-2">
            {away.map(({ creature, presence }) => (
              <li key={creature.id} className="border-t border-border py-2">
                <p className="font-medium">{creature.commonName}</p>
                <p className="text-sm text-fg-subtle">{presence.status === "present" ? "" : presence.reason}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function Encounter({ save, commit }: { save: OutingSave; commit: (result: ActionResult) => void }) {
  const active = save.active;
  const [picked, setPicked] = useState<string[]>([]);
  const creatureId = active?.creatureId ?? "";
  const stepIndex = active?.stepIndex ?? -1;

  useEffect(() => {
    setPicked([]);
  }, [creatureId, stepIndex]);

  if (!active) return null;
  const creature = getCreature(active.creatureId);
  const step = creature.steps[active.stepIndex];
  const decided = !step;
  const stepLabel = decided ? "Decide" : `Approach ${active.stepIndex + 1} of ${creature.steps.length}`;

  return (
    <section className="rounded-lg border border-border bg-bg-elevated p-4 sm:p-5" aria-label={`Encounter with ${creature.commonName}`}>
      <p className="text-xs tracking-widest text-primary uppercase">
        {stepLabel}
        {" · "}
        {TIER_LABEL[creature.tier]}
        {creature.fictional ? " · fictional" : ""}
      </p>
      <h2 className="mt-1 text-3xl">{creature.commonName}</h2>
      <p className="text-sm text-fg-subtle">
        <em>{creature.scientificName}</em>
        {creature.nameRank !== "species" ? ` · ${creature.nameRank}` : ""}
        {" · "}
        {creature.siteLabel}
      </p>
      {creature.plate ? (
        <img
          src={creature.plate}
          alt=""
          className="mt-4 max-h-72 w-full rounded-md border border-border bg-bg object-contain"
        />
      ) : null}
      <ol className="mt-4 space-y-2 border-l border-primary/40 pl-3 text-sm">
        {active.log.map((line, index) => (
          <li key={`${index}-${line}`}>{line}</li>
        ))}
      </ol>
      {step ? <p className="mt-4 font-medium">{step.instruction}</p> : null}
      {step?.kind === "choice" ? (
        <div className="mt-3 flex flex-col gap-2">
          {step.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className="min-h-11 rounded-md border border-border bg-bg px-3 py-3 text-left hover:border-primary"
              onClick={() => commit(applyEncounterAction(save, choice.action))}
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : null}
      {step?.kind === "sketch" ? (
        <fieldset className="mt-3 space-y-2">
          <legend className="sr-only">Field marks</legend>
          {creature.sketchMarks.map((mark) => {
            const on = picked.includes(mark.id);
            return (
              <label
                key={mark.id}
                className={`flex min-h-11 items-start gap-3 rounded-md border px-3 py-3 ${on ? "border-primary bg-bg" : "border-border bg-bg"}`}
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-primary"
                  checked={on}
                  onChange={() =>
                    setPicked((current) =>
                      current.includes(mark.id) ? current.filter((id) => id !== mark.id) : [...current, mark.id],
                    )
                  }
                />
                <span>{mark.label}</span>
              </label>
            );
          })}
          <button
            type="button"
            className={`${chip(true)} mt-2`}
            onClick={() => commit(applyEncounterAction(save, { type: "marks", markIds: picked }))}
          >
            Ink the plate
          </button>
        </fieldset>
      ) : null}
      {decided ? (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-sm text-fg-subtle">{creature.approachSummary}</p>
          <button type="button" className={chip(true)} onClick={() => commit(applyDisposition(save, "release"))}>
            {creature.releaseLabel}
          </button>
          {creature.canKeep ? (
            <button type="button" className={chip(false)} onClick={() => commit(applyDisposition(save, "keep"))}>
              {creature.keepLabel}
            </button>
          ) : (
            <p className="text-sm text-fg-subtle">{creature.keepRefusal}</p>
          )}
        </div>
      ) : null}
      <button type="button" className={`${chip(false)} mt-4`} onClick={() => commit(leaveEncounter(save))}>
        Step back
      </button>
    </section>
  );
}

function creaturesFor(filter: BookFilter, save: OutingSave) {
  return CREATURES.filter((creature) => {
    if (filter === "meadow") return creature.habitatId === "lantern-meadow";
    if (filter === "inked") return recordOf(save, creature.id).timesSeen > 0;
    return true;
  });
}

function Notebook({
  save,
  openId,
  setOpenId,
  filter,
  setFilter,
  commit,
}: {
  save: OutingSave;
  openId: string;
  setOpenId: (id: string) => void;
  filter: BookFilter;
  setFilter: (filter: BookFilter) => void;
  commit: (result: ActionResult) => void;
}) {
  const creature = getCreature(openId);
  const record = recordOf(save, openId);
  const tier = Math.min(record.hintTier, 2) as 0 | 1 | 2;
  const written = record.hintTier >= 3 || record.timesSeen > 0;
  const visible = creaturesFor(filter, save);
  const habitats = Object.entries(HABITAT_INFO).filter(([id]) => visible.some((item) => item.habitatId === id));

  function chooseFilter(next: BookFilter) {
    setFilter(next);
    const list = creaturesFor(next, save);
    if (!list.some((item) => item.id === openId) && list[0]) setOpenId(list[0].id);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[16rem_1fr]" aria-label="Notebook">
      <div>
        <img
          src="/art/sill.jpg"
          alt="An open blank notebook, a wooden-handled bug net, and a paper lantern on a worn sill."
          className="mb-3 hidden rounded-lg border border-border object-cover lg:block"
        />
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" className={chip(filter === "meadow")} aria-pressed={filter === "meadow"} onClick={() => chooseFilter("meadow")}>
            This walk
          </button>
          <button type="button" className={chip(filter === "county")} aria-pressed={filter === "county"} onClick={() => chooseFilter("county")}>
            County
          </button>
          <button type="button" className={chip(filter === "inked")} aria-pressed={filter === "inked"} onClick={() => chooseFilter("inked")}>
            Inked
          </button>
        </div>
        {filter === "meadow" ? (
          <p className="mb-3 text-sm text-fg-subtle">Fourteen on the floodplain. The rest of the county is not today's walk.</p>
        ) : null}
        <div className="max-h-96 space-y-4 overflow-auto pr-1">
          {habitats.length === 0 ? (
            <p className="text-sm text-fg-subtle">Nothing is inked yet. Meet something, then decide.</p>
          ) : (
            habitats.map(([id, info]) => {
              const animals = visible.filter((item) => item.habitatId === id);
              return (
                <div key={id}>
                  <h2 className="text-sm tracking-widest text-fg-subtle uppercase">{info.name}</h2>
                  <ul className="mt-1">
                    {animals.map((item) => {
                      const seen = recordOf(save, item.id).timesSeen > 0;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="min-h-11 w-full rounded-md px-2 text-left hover:bg-bg-elevated"
                            aria-current={item.id === openId ? "true" : undefined}
                            onClick={() => setOpenId(item.id)}
                          >
                            <span className={seen ? "text-primary" : "text-fg"}>{item.commonName}</span>
                            {seen ? <span className="text-fg-subtle"> · inked</span> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
      <article className="rounded-lg border border-border bg-bg-elevated p-4 sm:p-5">
        <p className="text-xs tracking-widest text-primary uppercase">
          {TIER_LABEL[creature.tier]}
          {creature.fictional ? " · not a real species" : " · field check"}
          {creature.habitatId !== "lantern-meadow" ? " · not on today's walk" : ""}
        </p>
        <h2 className="mt-1 text-3xl">{creature.commonName}</h2>
        <p className="text-sm text-fg-subtle">
          <em>{creature.scientificName}</em>
          {creature.nameRank !== "species" ? ` · ${creature.nameRank}` : ""} · {creature.siteLabel}
        </p>
        {creature.plate ? (
          <img src={creature.plate} alt="" className="mt-4 max-h-72 w-full rounded-md bg-bg object-contain" />
        ) : null}
        {written ? (
          <>
            <p className="mt-4">{creature.notebookEntry}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {creature.sketchMarks
                .filter((mark) => mark.correct)
                .map((mark) => (
                  <li key={mark.id}>Ink: {mark.label}</li>
                ))}
            </ul>
            <p className="mt-3 text-sm text-fg-subtle">
              Seen {record.timesSeen}, missed {record.timesMissed}, released {record.timesReleased}, kept {record.timesKept}.
            </p>
            {record.lastNote ? <p className="mt-2">{record.lastNote}</p> : null}
          </>
        ) : (
          <p className="mt-4">{creature.hints[tier]}</p>
        )}
        <h3 className="mt-5 text-lg">What the book will claim</h3>
        <p className="mt-1 text-sm">{creature.naturalHistory}</p>
        {creature.links.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm">
            {creature.links.map((link) => (
              <li key={link.text}>
                <span className="font-medium text-primary">
                  {link.channel}
                  {link.who ? ` · ${link.who}` : ""}
                </span>
                . {link.text}
              </li>
            ))}
          </ul>
        ) : null}
        {!written ? (
          <button type="button" className={`${chip(false)} mt-4`} onClick={() => commit(requestHint(save, creature.id))}>
            Ask the notebook again
          </button>
        ) : null}
        {creature.habitatId !== save.world.habitatId ? (
          <p className="mt-4 text-sm text-fg-subtle">{HABITAT_INFO[creature.habitatId].blurb}</p>
        ) : null}
      </article>
    </section>
  );
}

function Journal({ save, onOpen }: { save: OutingSave; onOpen: (id: string) => void }) {
  const lines = [...save.journal].reverse();
  if (lines.length === 0) {
    return (
      <section aria-label="Journal" className="rounded-lg border border-border bg-bg-elevated p-4">
        <h2 className="text-2xl">Journal</h2>
        <p className="mt-2 text-fg-subtle">The pages are still the color of the paper. Meet something, then decide what the book is allowed to keep.</p>
      </section>
    );
  }

  return (
    <section aria-label="Journal">
      <h2 className="text-2xl">Journal</h2>
      <p className="mt-1 text-sm text-fg-subtle">Newest first. Rewards land once. The field note is the decision you made.</p>
      <ol className="mt-4 space-y-3">
        {lines.map((line) => {
          const creature = getCreature(line.creatureId);
          return (
            <li key={line.id} className="rounded-lg border border-border bg-bg-elevated px-4 py-3">
              <p className="text-xs tracking-widest text-primary uppercase">{CHANNEL_LABEL[line.channel]}</p>
              <button type="button" className="mt-1 text-left font-display text-lg text-fg hover:text-primary" onClick={() => onOpen(line.creatureId)}>
                {creature.commonName}
              </button>
              <p className="mt-1">{line.text}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
