import { useState } from "react";
import { effectiveBurden, playBlock, stokeOf, strongestLegal } from "../keeping.ts";
import { mustCard } from "../cards.ts";
import { assessDeck, typeLabel } from "../rules.ts";
import type { Action } from "../archive.ts";
import type { Save, ZoneCard } from "../types.ts";
import { CardFace } from "./CardFace.tsx";

export function TableView({
  save,
  dispatch,
  cardId,
}: {
  save: Save;
  dispatch: (action: Action) => void;
  cardId: string;
}) {
  const deck = save.decks.find((item) => item.id === save.activeDeckId);
  const report = deck ? assessDeck(deck.cards, deck.bond) : null;
  const keeping = save.keeping;
  const [attach, setAttach] = useState<string | null>(null);

  if (!keeping || !deck) {
    return (
      <section className="max-w-xl">
        <h2 className="text-3xl">Practice keeping</h2>
        <p className="mt-2 text-pretty">
          A solitaire of fourteen winters. The active ledger must be legal. You may open with the card you were just
          reading, if it sits in that ledger.
        </p>
        {report && !report.ok && <p className="mt-3 text-ember">{report.errors[0]}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="press h-11 rounded-full bg-pine px-4 font-semibold text-paper disabled:opacity-40"
            disabled={!report?.ok}
            onClick={() => dispatch({ type: "startKeeping" })}
          >
            Begin
          </button>
          <button
            className="press h-11 rounded-full bg-ink/5 px-4 font-semibold disabled:opacity-40"
            disabled={!report?.ok || !deck?.cards.includes(cardId)}
            onClick={() => dispatch({ type: "startKeeping", openWith: cardId })}
          >
            Open with {mustCard(cardId).name}
          </button>
        </div>
      </section>
    );
  }

  const burden = effectiveBurden(keeping);
  const stoke = stokeOf(keeping);
  const best = strongestLegal(keeping);
  const short = burden - stoke;
  const over = keeping.phase === "won" || keeping.phase === "lost";
  const verdict =
    keeping.phase === "search"
      ? "Finish the search before the winter can close."
      : keeping.phase === "won"
        ? "Fourteen winters. The line holds."
        : keeping.phase === "lost"
          ? "The hearths are out. The line fails."
          : short <= 0
            ? `Close now and winter ${keeping.winter} holds.`
            : keeping.shield
              ? `Short by ${short}. Closing spends the shield. The hearth stays.`
              : `Short by ${short}. Closing puts out a hearth.`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-ink/60 uppercase">Winter</p>
            <h2 className="text-5xl tabular-nums">{keeping.winter}</h2>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-ink/60 uppercase">Hearths</p>
            <div className="mt-1 flex gap-1" aria-label={`${keeping.hearths} hearths`}>
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  key={index}
                  className={`h-3 w-8 rounded-full ${index < keeping.hearths ? "bg-ember" : "bg-ink/10"}`}
                />
              ))}
            </div>
          </div>
        </div>
        <ol className="mt-3 flex min-w-0 gap-1" aria-label="Fourteen winters">
          {Array.from({ length: 14 }, (_, index) => {
            const n = index + 1;
            const state = n < keeping.winter ? "bg-pine text-paper" : n === keeping.winter ? "bg-ember text-paper" : "bg-ink/10 text-ink/50";
            return (
              <li
                key={n}
                className={`flex h-2 min-w-0 flex-1 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:h-7 ${state}`}
              >
                <span className="hidden sm:inline">{n}</span>
              </li>
            );
          })}
        </ol>
        <p
          className={`mt-4 rounded-card px-4 py-3 font-display text-2xl leading-snug ${
            over || short <= 0 ? "bg-pine/10 text-pine" : "bg-ember/10 text-ember"
          }`}
        >
          {verdict}
        </p>
        <p className="mt-2 text-sm tabular-nums text-ink/70">
          Stoke {stoke} · Burden {burden} · Stores {keeping.stores}
          {keeping.shield ? " · Shield up" : ""} · {keeping.deck.length} left in the deck
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Zone title="Kin" cards={keeping.kin} note="At most four." />
          <Zone title="Places" cards={keeping.places} note="Each one feeds stores." />
          <Zone title="Heirlooms" cards={keeping.heirlooms} kin={keeping.kin} note="Attached to kin." />
          <article className="rounded-card border border-ink/15 p-3">
            <h3 className="text-lg">Weather</h3>
            <p className="mt-1">{keeping.weather ? mustCard(keeping.weather.cardId).name : "Clear sky"}</p>
            {keeping.weather ? (
              <p className="text-xs text-ink/60">{typeLabel("weather")}</p>
            ) : (
              <p className="text-sm text-ink/60">One weather at a time. A new one replaces the old.</p>
            )}
          </article>
        </div>
        <h3 className="mt-5 text-2xl">Hand</h3>
        {keeping.pending && (
          <div className="mt-2">
            <p className="text-sm font-semibold">Keep one. The rest go under the deck.</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {keeping.pending.options.map((id, index) => (
                <li key={`${id}-${index}`}>
                  <button
                    className="press w-full text-left"
                    onClick={() => dispatch({ type: "chooseSearch", pick: index })}
                  >
                    <CardFace card={mustCard(id)} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {keeping.hand.length === 0 ? (
          <p className="mt-2 text-sm text-ink/70">The hand is empty. Close the winter, or the deck is done.</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {keeping.hand.map((id, index) => {
              const card = mustCard(id);
              const reason = playBlock(keeping, id, keeping.kin[0]?.instance);
              const picking = attach === `${id}-${index}` && card.type === "heirloom" && keeping.kin.length > 1 && !reason;
              return (
                <li key={`${id}-${index}`} className={reason ? "opacity-60" : ""}>
                  <button
                    className="press w-full text-left disabled:cursor-not-allowed"
                    disabled={keeping.phase !== "play" || Boolean(reason)}
                    onClick={() => {
                      if (keeping.phase !== "play" || reason) return;
                      if (card.type === "heirloom" && keeping.kin.length > 1) {
                        setAttach(`${id}-${index}`);
                        return;
                      }
                      dispatch({
                        type: "playCard",
                        cardId: id,
                        attachTo: keeping.kin[0]?.instance,
                      });
                    }}
                  >
                    <CardFace card={card} />
                  </button>
                  {reason ? <p className="mt-1 text-xs text-ember">{reason}</p> : null}
                  {picking &&
                    keeping.kin.map((kin) => (
                      <button
                        key={kin.instance}
                        className="press mt-1 h-11 w-full rounded-full bg-pine px-3 text-sm font-semibold text-paper"
                        onClick={() => {
                          dispatch({ type: "playCard", cardId: id, attachTo: kin.instance });
                          setAttach(null);
                        }}
                      >
                        Attach to {mustCard(kin.cardId).name}
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="press h-11 rounded-full bg-ember px-4 font-semibold text-paper disabled:opacity-40"
            disabled={keeping.phase !== "play"}
            onClick={() => dispatch({ type: "resolveWinter" })}
          >
            Close the winter
          </button>
          <button
            className="press h-11 rounded-full bg-ink/5 px-4 font-semibold disabled:opacity-40"
            disabled={!best || keeping.phase !== "play"}
            onClick={() => best && dispatch({ type: "playCard", cardId: best, attachTo: keeping.kin[0]?.instance })}
          >
            Lay the strongest legal card
          </button>
          <button className="press h-11 rounded-full bg-ink/5 px-4 font-semibold" onClick={() => dispatch({ type: "endKeeping" })}>
            Leave the table
          </button>
        </div>
      </div>
      <aside className="rounded-card bg-ink/5 p-4">
        <h3 className="text-xl">What the winter did</h3>
        <ol className="mt-2 flex flex-col gap-2 text-sm">
          {keeping.log.slice(-8).map((line, index) => (
            <li key={`${line}-${index}`} className="text-pretty">
              {line}
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function Zone({
  title,
  cards,
  note,
  kin,
}: {
  title: string;
  cards: ZoneCard[];
  note: string;
  kin?: ZoneCard[];
}) {
  return (
    <article className="rounded-card border border-ink/15 p-3">
      <h3 className="text-lg">{title}</h3>
      {cards.length === 0 ? (
        <p className="text-sm text-ink/60">{note}</p>
      ) : (
        <ul className="mt-1">
          {cards.map((card) => {
            const def = mustCard(card.cardId);
            const host = kin?.find((item) => item.instance === card.attachedTo);
            return (
              <li key={card.instance} className="text-sm">
                <span className="font-semibold">{def.name}</span>
                <span className="text-ink/60">
                  {" "}
                  · cost {def.cost}
                  {def.kindling > 0 ? ` · stoke ${def.kindling}` : ""}
                  {host ? ` · on ${mustCard(host.cardId).name}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
