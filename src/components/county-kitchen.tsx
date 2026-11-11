import { useEffect, useReducer, useRef, useState } from "react";
import {
  CARE_OPTIONS,
  CATEGORY_LABEL,
  EFFECTS_ARE_FICTION,
  INGREDIENTS,
  RECIPES,
  SATCHEL_CAP,
  STATIONS,
  currentOffering,
  describePot,
  getRecipe,
  ingredientName,
  isPerishable,
  offeringReady,
  pantryCovers,
  reduceKitchen,
  total,
} from "@/game/cooking";
import type { CareAction, KitchenState, Quality, Recipe, Theme } from "@/game/cooking";

type View = "pot" | "pantry" | "book" | "road";
type BookFilter = "known" | "rumor" | "vein";

const THEME_ORDER: Theme[] = ["maple", "orchard", "dairy", "field", "waterside", "pantry", "vein"];
const THEME_LABEL: Record<Theme, string> = {
  maple: "Maple",
  orchard: "Orchard",
  dairy: "Dairy",
  field: "Field",
  waterside: "Waterside",
  pantry: "Pantry",
  vein: "Vein",
};

const VIEWS: { id: View; label: string }[] = [
  { id: "pot", label: "Pot" },
  { id: "pantry", label: "Pantry" },
  { id: "book", label: "Book" },
  { id: "road", label: "Road" },
];

function living(state: KitchenState) {
  return state.effects.filter((effect) => effect.expiresAt > state.minute);
}

function stocked(pantry: Record<string, number>) {
  return THEME_ORDER.map((theme) => ({
    theme,
    items: Object.entries(pantry)
      .filter(([id, count]) => count > 0 && INGREDIENTS[id]?.theme === theme)
      .sort((a, b) => ingredientName(a[0]).localeCompare(ingredientName(b[0]))),
  })).filter((group) => group.items.length > 0);
}

function qualityLabel(quality: Quality) {
  if (quality === "proper") return "Proper";
  if (quality === "rustic") return "Rustic";
  return "Scrap";
}

function giftWait(state: KitchenState) {
  if (offeringReady(state)) return 0;
  return Math.max(0, 20 - (state.minute - state.offeringTakenAt));
}

/** Pause-menu kitchen. Road minutes here do not move the county, and plates do not touch a fight. */
export function CountyKitchen({
  initial,
  onCommit,
  onClose,
}: {
  initial: KitchenState;
  onCommit: (state: KitchenState) => void;
  onClose: () => void;
}) {
  const [state, dispatch] = useReducer(reduceKitchen, initial);
  const [view, setView] = useState<View>("pot");
  const [filter, setFilter] = useState<BookFilter>("known");
  const [selected, setSelected] = useState<string | null>(initial.intendedRecipeId);
  const [glance, setGlance] = useState<string | null>(null);
  const commitRef = useRef(onCommit);
  const skipCommit = useRef(true);
  commitRef.current = onCommit;

  useEffect(() => {
    if (skipCommit.current) {
      skipCommit.current = false;
      return;
    }
    commitRef.current(state);
  }, [state]);

  const recipe = selected ? getRecipe(selected) : undefined;
  const known = recipe ? state.known.includes(recipe.id) : false;
  const readyRecipes = RECIPES.filter((item) => state.known.includes(item.id) && pantryCovers(state, item.id));
  const effects = living(state);
  const gift = currentOffering(state);
  const giftReady = offeringReady(state);
  const wait = giftWait(state);
  const potUnits = total(state.pot);
  const satchelFull = state.satchel.length >= SATCHEL_CAP;
  const cardCare = recipe && known ? CARE_OPTIONS.find((care) => care.id === recipe.preparation.care) : undefined;
  const cardStation = recipe && known ? STATIONS.find((station) => station.id === recipe.preparation.station) : undefined;

  function lay(id: string) {
    setSelected(id);
    dispatch({ type: "lay-out", recipeId: id });
    setView("pot");
  }

  function addToPot(id: string) {
    setGlance(id);
    dispatch({ type: "pot-add", id });
  }

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-bg/95 p-3 text-fg">
      <div className="mx-auto w-full max-w-3xl pb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-primary uppercase">Addison County</p>
            <h2 className="font-display text-3xl">The kitchen</h2>
            <p className="text-sm text-fg-muted">
              Life {state.life} · road {state.minute} · {state.known.length}/{RECIPES.length} cards · {state.satchel.length}/{SATCHEL_CAP} plates
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 shrink-0 rounded-[12px] bg-primary px-4 text-sm font-semibold text-primary-fg"
          >
            Back to the road
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-fg-muted">{EFFECTS_ARE_FICTION}</p>
        {state.banner ? (
          <p role="status" className="mt-3 rounded-[12px] bg-bg-elevated p-3 text-sm leading-relaxed ring-1 ring-border">
            {state.banner}
          </p>
        ) : null}

        <nav className="mt-3 grid grid-cols-4 gap-2" aria-label="Kitchen sections">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
              className={`h-11 rounded-[12px] text-sm ring-1 ring-border ${
                view === item.id ? "bg-primary text-primary-fg" : "bg-bg-elevated text-fg"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {view === "pot" && (
          <section className="mt-4 space-y-3" aria-label="The pot">
            <h3 className="font-display text-xl">Written cards the pantry can cover</h3>
            {readyRecipes.length === 0 ? (
              <p className="text-sm text-fg-muted">
                Nothing written is fully in the pantry. Walk a stretch, take what a neighbor left, or cook short and learn the amounts.
              </p>
            ) : (
              <ul className="flex gap-2 overflow-x-auto pb-1">
                {readyRecipes.map((item) => (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => lay(item.id)}
                      className={`h-11 max-w-56 rounded-[12px] px-3 text-left text-sm ring-1 ring-border ${
                        selected === item.id ? "bg-primary text-primary-fg" : "bg-bg-elevated"
                      }`}
                    >
                      <span className="block truncate">{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="font-display text-2xl">
              {recipe && known ? recipe.name : potUnits > 0 ? "An experiment" : "The pot is clear"}
            </p>
            <p className="text-sm text-fg-muted">
              {recipe && known ? recipe.preparation.verb : "Lay out a written card, or add one piece at a time and experiment."}
            </p>

            <div className="min-h-16 rounded-[12px] bg-bg-elevated p-3 ring-1 ring-border">
              {potUnits === 0 ? (
                <p className="text-sm text-fg-muted">Nothing in the pot.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(state.pot).map(([id, count]) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => {
                          setGlance(id);
                          dispatch({ type: "pot-remove", id });
                        }}
                        className="h-11 rounded-[12px] bg-bg px-3 text-left text-sm ring-1 ring-border"
                      >
                        {ingredientName(id)} <span className="font-mono">{count}</span>
                        <span className="mt-0.5 block text-xs text-fg-subtle">Put one back</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {recipe && known ? (
              <ul className="space-y-1 text-sm">
                {recipe.ingredients.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>{ingredientName(item.id)}</span>
                    <span className="font-mono text-fg-muted">
                      {state.pot[item.id] ?? 0}/{item.count} in the pot · {state.pantry[item.id] ?? 0} waiting
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="text-sm leading-relaxed">{describePot(state, recipe && known ? "card" : "experiment")}</p>

            <p className="text-sm text-fg-subtle">Station</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Station">
              {STATIONS.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  aria-pressed={state.station === station.id}
                  onClick={() => dispatch({ type: "station", station: station.id })}
                  className={`h-11 rounded-[12px] px-3 text-sm ring-1 ring-border ${
                    state.station === station.id ? "bg-primary text-primary-fg" : "bg-bg-elevated"
                  }`}
                >
                  {station.label}
                  {cardStation?.id === station.id ? " · card" : ""}
                </button>
              ))}
            </div>
            <p className="text-sm text-fg-muted">{STATIONS.find((station) => station.id === state.station)?.detail}</p>

            <p className="text-sm text-fg-subtle">Tend</p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="How to tend the pot">
              {CARE_OPTIONS.map((care) => (
                <button
                  key={care.id}
                  type="button"
                  aria-pressed={state.care === care.id}
                  onClick={() => dispatch({ type: "care", care: care.id as CareAction })}
                  className={`h-11 rounded-[12px] px-3 text-left text-sm ring-1 ring-border ${
                    state.care === care.id ? "bg-primary text-primary-fg" : "bg-bg-elevated"
                  }`}
                >
                  {care.label}
                  {cardCare?.id === care.id ? " · card" : ""}
                </button>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-fg-muted">
              {state.care
                ? CARE_OPTIONS.find((care) => care.id === state.care)?.detail
                : "Choose a tend before the card will cook."}
              {cardCare && state.care && state.care !== cardCare.id ? " This is not the tend on the card." : ""}
              {cardStation && state.station !== cardStation.id ? " This is not the station on the card." : ""}
              {known
                ? " A wrong tend or station on a card you already know comes out rustic: shorter on the road, still edible."
                : ""}
            </p>

            {satchelFull ? (
              <p className="text-sm">The satchel holds four plates. Eat one before this pot can become another.</p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "cook" })}
                className="h-11 rounded-[12px] bg-primary text-sm font-semibold text-primary-fg"
              >
                Cook this card
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "experiment" })}
                className="h-11 rounded-[12px] bg-bg-elevated text-sm ring-1 ring-border"
              >
                Experiment
              </button>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "pot-clear" })}
              className="h-11 text-left text-sm text-fg-muted underline"
            >
              Put the pot back
            </button>

            <Satchel state={state} onEat={(uid) => dispatch({ type: "eat", uid })} />
            <FoundLine id={glance} />
          </section>
        )}

        {view === "pantry" && (
          <section className="mt-4 space-y-4" aria-label="Pantry">
            <p className="text-sm text-fg-muted">
              Add one piece at a time. Fresh food is halved when a life ends in the county. Dry goods keep. Overflow waits on the stoop.
            </p>
            {recipe && known ? (
              <div>
                <h3 className="font-display text-xl">For {recipe.name}</h3>
                <ul className="mt-2 space-y-2">
                  {recipe.ingredients.map((item) => {
                    const waiting = state.pantry[item.id] ?? 0;
                    const inPot = state.pot[item.id] ?? 0;
                    const short = waiting + inPot < item.count;
                    const subs = recipe.substitutions.filter(
                      (sub) =>
                        sub.replaces === item.id && sub.durationScale > 0 && (state.pantry[sub.with] ?? 0) > 0 && short,
                    );
                    return (
                      <li key={item.id} className="rounded-[12px] bg-bg-elevated p-3 ring-1 ring-border">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm">{ingredientName(item.id)}</p>
                            <p className="font-mono text-xs text-fg-muted">
                              Card {item.count} · pantry {waiting} · pot {inPot}
                              {isPerishable(item.id) ? " · fresh" : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={waiting < 1}
                            onClick={() => addToPot(item.id)}
                            className="h-11 rounded-[12px] bg-primary px-3 text-sm font-semibold text-primary-fg disabled:opacity-40"
                          >
                            Add
                          </button>
                        </div>
                        {subs.map((sub) => (
                          <button
                            key={sub.with}
                            type="button"
                            onClick={() => addToPot(sub.with)}
                            className="mt-2 h-11 w-full rounded-[12px] bg-bg px-3 text-left text-sm ring-1 ring-border"
                          >
                            Use {ingredientName(sub.with)} instead
                            <span className="mt-0.5 block text-xs text-fg-muted">{sub.note}</span>
                          </button>
                        ))}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-fg-muted">Open a written card and the pantry will mark what it asks for.</p>
            )}

            {stocked(state.pantry).map((group) => (
              <div key={group.theme}>
                <h3 className="text-sm text-fg-subtle">{THEME_LABEL[group.theme]}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {group.items.map(([id, count]) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => addToPot(id)}
                        className="h-11 rounded-[12px] bg-bg-elevated px-3 text-left text-sm ring-1 ring-border"
                      >
                        {ingredientName(id)} <span className="font-mono">{count}</span>
                        <span className="mt-0.5 block text-xs text-fg-subtle">
                          Add one{isPerishable(id) ? " · fresh" : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {Object.keys(state.stoop).length > 0 ? (
              <div>
                <h3 className="text-sm text-fg-subtle">On the stoop</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(state.stoop).map(([id, count]) => (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "stoop-take", id })}
                        className="h-11 rounded-[12px] bg-bg-elevated px-3 text-left text-sm ring-1 ring-border"
                      >
                        {ingredientName(id)} <span className="font-mono">{count}</span>
                        <span className="mt-0.5 block text-xs text-fg-subtle">Bring one in</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-[12px] bg-bg-elevated p-3 ring-1 ring-border">
              <h3 className="font-display text-xl">{gift.place}</h3>
              {giftReady ? (
                <p className="mt-1 text-sm">
                  {gift.line} {gift.items.map((item) => `${item.count} ${ingredientName(item.id)}`).join(", ")}.
                </p>
              ) : (
                <p className="mt-1 text-sm text-fg-muted">
                  Someone already stopped here. Another gift is {wait} minutes of kitchen road away. You do not need it before then.
                </p>
              )}
              <button
                type="button"
                disabled={!giftReady}
                onClick={() => dispatch({ type: "offering" })}
                className="mt-2 h-11 rounded-[12px] bg-primary px-3 text-sm font-semibold text-primary-fg disabled:opacity-40"
              >
                {giftReady ? "Take what they left" : `Another gift is ${wait} minutes away`}
              </button>
            </div>
            <FoundLine id={glance} />
          </section>
        )}

        {view === "book" && (
          <section className="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Recipe book">
            <div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Which cards">
                {(
                  [
                    ["known", "Written"],
                    ["rumor", "Rumors"],
                    ["vein", "Vein"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={filter === id}
                    onClick={() => setFilter(id)}
                    className={`h-11 rounded-[12px] px-3 text-sm ring-1 ring-border ${
                      filter === id ? "bg-primary text-primary-fg" : "bg-bg-elevated"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <BookList
                state={state}
                filter={filter}
                selected={selected}
                onChoose={(id) => setSelected(id)}
              />
            </div>
            <RecipeSheet recipe={recipe} known={known} state={state} onLay={lay} onAsk={(id) => dispatch({ type: "ask", recipeId: id })} />
          </section>
        )}

        {view === "road" && (
          <section className="mt-4 space-y-4" aria-label="The road and the satchel">
            <div className="rounded-[12px] bg-bg-elevated p-3 ring-1 ring-border">
              <p className="text-sm text-fg-subtle">This stretch</p>
              <h3 className="font-display text-2xl">{gift.place}</h3>
              <p className="text-sm">{giftReady ? gift.line : "Someone already stopped here."}</p>
              <p className="mt-1 text-sm text-fg-muted">
                Walking here only ages plates. It does not move you through the county, and nothing must be renewed before trouble.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => dispatch({ type: "pass", minutes: 5 })} className="h-11 rounded-[12px] bg-bg px-3 text-sm ring-1 ring-border">
                  A short walk · 5
                </button>
                <button type="button" onClick={() => dispatch({ type: "pass", minutes: 15 })} className="h-11 rounded-[12px] bg-bg px-3 text-sm ring-1 ring-border">
                  Down the road · 15
                </button>
                <button type="button" onClick={() => dispatch({ type: "pass", minutes: 20 })} className="h-11 rounded-[12px] bg-bg px-3 text-sm ring-1 ring-border">
                  A full stretch · 20
                </button>
              </div>
              {giftReady ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "offering" })}
                  className="mt-2 h-11 rounded-[12px] bg-primary px-3 text-sm font-semibold text-primary-fg"
                >
                  Take what they left
                </button>
              ) : (
                <p className="mt-2 text-sm text-fg-muted">The next gift is {wait} minutes along.</p>
              )}
            </div>
            <SeatList state={state} effects={effects} />
            <Satchel state={state} onEat={(uid) => dispatch({ type: "eat", uid })} />
            <Daybook state={state} />
            <p className="text-sm text-fg-muted">
              A death in the county halves fresh food and clears plates. The cards stay. This screen does not end a life.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function FoundLine({ id }: { id: string | null }) {
  const item = id ? INGREDIENTS[id] : undefined;
  if (!item) return null;
  return (
    <p className="text-sm leading-relaxed">
      <span className="text-primary">{item.name}.</span> {item.found}
    </p>
  );
}

function Satchel({ state, onEat }: { state: KitchenState; onEat: (uid: string) => void }) {
  if (state.satchel.length === 0) {
    return <p className="text-sm text-fg-muted">Cooked plates wait here. Eating is separate from cooking, and the satchel stops at four.</p>;
  }
  return (
    <ul className="space-y-2">
      {state.satchel.map((dish) => (
        <li key={dish.uid} className="flex items-center justify-between gap-3 rounded-[12px] bg-bg-elevated p-3 ring-1 ring-border">
          <div>
            <p className="text-sm">{dish.name}</p>
            <p className="text-xs text-fg-muted">
              {qualityLabel(dish.quality)} · {dish.effect.durationMinutes} min · strength {dish.effect.magnitude}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Eat ${dish.name}`}
            onClick={() => onEat(dish.uid)}
            className="h-11 rounded-[12px] bg-primary px-3 text-sm font-semibold text-primary-fg"
          >
            Eat
          </button>
        </li>
      ))}
    </ul>
  );
}

function SeatList({ state, effects }: { state: KitchenState; effects: ReturnType<typeof living> }) {
  return (
    <ul className="space-y-2">
      {(["table", "vein"] as const).map((slot) => {
        const effect = effects.find((item) => item.slot === slot);
        if (!effect) {
          return (
            <li key={slot} className="rounded-[12px] bg-bg-elevated p-3 ring-1 ring-border">
              <p className="text-sm text-fg-subtle">{slot === "vein" ? "Vein seat" : "Table seat"}</p>
              <p className="text-sm text-fg-muted">
                {slot === "vein"
                  ? "Empty. One Vein plate may ride beside one ordinary plate. It never becomes permanent, and it does not cross a death."
                  : "Empty. One ordinary plate may be with you. You do not need one before you leave."}
              </p>
            </li>
          );
        }
        const span = Math.max(1, effect.expiresAt - effect.startedAt);
        const left = effect.expiresAt - state.minute;
        const width = Math.max(0, Math.min(100, Math.round((left / span) * 100)));
        return (
          <li key={slot} className="rounded-[12px] bg-bg-elevated p-3 ring-1 ring-border">
            <p className="text-sm text-fg-subtle">{slot === "vein" ? "Vein seat" : "Table seat"}</p>
            <p className="font-display text-xl">{effect.name}</p>
            <p className="text-sm">{effect.fiction}</p>
            <p className="mt-1 font-mono text-xs text-fg-muted">
              {left} min of kitchen road left. Strength {effect.magnitude}.
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg" aria-hidden="true">
              <div className="h-full bg-primary" style={{ width: `${width}%` }} />
            </div>
            <p className="mt-2 text-xs text-fg-muted">{effect.notFor}</p>
          </li>
        );
      })}
    </ul>
  );
}

function Daybook({ state }: { state: KitchenState }) {
  const lines = state.log.slice(1, 7);
  if (lines.length === 0) return null;
  return (
    <ol className="space-y-2 text-sm">
      {lines.map((line, index) => (
        <li key={`${line.minute}-${index}`}>
          <span className="font-mono text-fg-subtle">Minute {line.minute}. </span>
          {line.text}
        </li>
      ))}
    </ol>
  );
}

function BookList({
  state,
  filter,
  selected,
  onChoose,
}: {
  state: KitchenState;
  filter: BookFilter;
  selected: string | null;
  onChoose: (id: string) => void;
}) {
  const book = RECIPES.filter((item) => {
    if (filter === "vein") return item.category === "vein";
    if (filter === "known") return state.known.includes(item.id);
    return !state.known.includes(item.id);
  }).sort((a, b) => {
    const rank = (item: Recipe) => {
      const isKnown = state.known.includes(item.id);
      if (isKnown && pantryCovers(state, item.id)) return 0;
      if (isKnown) return 1;
      return 2;
    };
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });

  if (book.length === 0) return <p className="mt-3 text-sm text-fg-muted">No card in this set.</p>;

  return (
    <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
      {book.map((item) => {
        const isKnown = state.known.includes(item.id);
        const ready = isKnown && pantryCovers(state, item.id);
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={selected === item.id}
              onClick={() => onChoose(item.id)}
              className={`min-h-11 w-full rounded-[12px] px-3 py-2 text-left ring-1 ring-border ${
                selected === item.id ? "bg-bg-subtle" : "bg-bg-elevated"
              }`}
            >
              <span className="block text-sm">{isKnown ? item.name : item.discovery.clue}</span>
              <span className="text-xs text-fg-muted">
                {CATEGORY_LABEL[item.category]}
                {ready ? " · Ready" : ""}
                {isKnown ? "" : " · Unwritten"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RecipeSheet({
  state,
  recipe,
  known,
  onLay,
  onAsk,
}: {
  state: KitchenState;
  recipe: Recipe | undefined;
  known: boolean;
  onLay: (id: string) => void;
  onAsk: (id: string) => void;
}) {
  if (!recipe) return <p className="text-sm text-fg-muted">Choose a card.</p>;
  const revealed = state.reveals[recipe.id] ?? [];
  const unnamed = recipe.ingredients.length - revealed.length;
  const ready = known && pantryCovers(state, recipe.id);
  return (
    <div className="space-y-2 rounded-[12px] bg-bg-elevated p-3 ring-1 ring-border">
      <h3 className="font-display text-2xl">{known ? recipe.name : "An unwritten card"}</h3>
      <p className="text-sm text-fg-muted">
        {CATEGORY_LABEL[recipe.category]} · {recipe.discovery.where}
      </p>
      <p className="text-sm leading-relaxed">{known ? recipe.plate : recipe.discovery.clue}</p>
      {known ? (
        <>
          <p className="text-sm">
            {recipe.preparation.verb} Station {STATIONS.find((s) => s.id === recipe.preparation.station)?.label}. Tend{" "}
            {CARE_OPTIONS.find((c) => c.id === recipe.preparation.care)?.label}.
          </p>
          <ul className="space-y-1 text-sm">
            {recipe.ingredients.map((item) => (
              <li key={item.id}>
                {item.count} {ingredientName(item.id)}
                <span className="text-fg-muted"> · {(state.pantry[item.id] ?? 0) + (state.pot[item.id] ?? 0)} on hand</span>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed">{recipe.effect.fiction}</p>
          <p className="text-xs text-fg-muted">
            {recipe.effect.durationMinutes} minutes of kitchen road. Strength stays 1. {recipe.effect.notFor}
          </p>
          <button type="button" onClick={() => onLay(recipe.id)} className="h-11 rounded-[12px] bg-primary px-3 text-sm font-semibold text-primary-fg">
            {ready ? "Lay out this plate" : "Lay out what you have"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-fg-muted">
            {revealed.length > 0
              ? `Named so far: ${revealed.map(ingredientName).join(", ")}.${unnamed > 0 ? ` ${unnamed} still unnamed.` : " Amounts are learned by cooking."}`
              : "No ingredient has been named yet."}
          </p>
          <button type="button" onClick={() => onAsk(recipe.id)} className="h-11 rounded-[12px] bg-bg px-3 text-sm ring-1 ring-border">
            {unnamed > 0 ? "Ask for one ingredient" : "Ask again"}
          </button>
        </>
      )}
    </div>
  );
}
