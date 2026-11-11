import { laterOpen, type Action } from "../archive.ts";
import { CARDS, copyLimit, getCard } from "../cards.ts";
import { KEEPING_LAW, assessDeck, typeLabel } from "../rules.ts";
import { surplus } from "../deck.ts";
import type { Affinity, Bond, CardType, Save } from "../types.ts";
import { CardFace } from "./CardFace.tsx";

const AFFINITIES: Affinity[] = ["hearth", "trail", "chapel", "river", "night", "generation"];
const BONDS: Bond[] = ["hearth", "trail", "chapel", "river", "night"];
const TYPES: CardType[] = ["kin", "place", "memory", "heirloom", "weather"];

export function LedgerView({
  save,
  dispatch,
  cardId,
  setCardId,
  when,
  setWhen,
  onPractice,
}: {
  save: Save;
  dispatch: (action: Action) => void;
  cardId: string;
  setCardId: (id: string) => void;
  when: "then" | "later";
  setWhen: (when: "then" | "later") => void;
  onPractice: () => void;
}) {
  const deck = save.decks.find((item) => item.id === save.activeDeckId) ?? save.decks[0];
  const card = getCard(cardId);
  const report = deck ? assessDeck(deck.cards, deck.bond) : null;
  const inDeck = deck ? deck.cards.filter((id) => id === cardId).length : 0;
  const mix = countTypes(deck?.cards ?? []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold" htmlFor="deck-select">
            Ledger
          </label>
          <select
            id="deck-select"
            className="h-11 rounded-full border border-ink/20 bg-paper px-3"
            value={save.activeDeckId}
            onChange={(event) => dispatch({ type: "setActiveDeck", deckId: event.target.value })}
          >
            {save.decks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {deck && (
            <select
              aria-label="Declared bond"
              className="h-11 rounded-full border border-ink/20 bg-paper px-3 capitalize"
              value={deck.bond}
              onChange={(event) =>
                dispatch({ type: "setBond", deckId: deck.id, bond: event.target.value as Bond })
              }
            >
              {BONDS.map((bond) => (
                <option key={bond} value={bond}>
                  Bond: {bond}
                </option>
              ))}
            </select>
          )}
          <button
            className="press h-11 rounded-full bg-ink/5 px-4 text-sm font-semibold"
            onClick={() => dispatch({ type: "newDeck" })}
          >
            New ledger
          </button>
        </div>
        {report && (
          <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <Check ok={report.size === 40} label={`${report.size} / 40 cards`} />
            <Check ok={report.bondCount >= 12} label={`${report.bondCount} / 12 of the bond`} />
            <Check ok={report.kinCount >= 8} label={`${report.kinCount} / 8 kin`} />
            <Check ok={report.weatherCount <= 6} label={`${report.weatherCount} / 6 weather`} />
          </ul>
        )}
        {deck && (
          <p className="mt-2 text-sm text-ink/70">
            {TYPES.map((type) => `${mix[type]} ${typeLabel(type).toLowerCase()}`).join(" · ")}
          </p>
        )}
        {report && !report.ok && <p className="mt-2 text-sm text-ember">{report.errors[0]}</p>}
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {AFFINITIES.map((affinity) => (
            <button
              key={affinity}
              className={`press h-11 shrink-0 rounded-full px-4 text-sm font-semibold capitalize ${
                card?.affinity === affinity ? "bg-pine text-paper" : "bg-ink/5"
              }`}
              onClick={() => {
                const first = CARDS.find((item) => item.affinity === affinity);
                if (first) {
                  setCardId(first.id);
                  setWhen("then");
                }
              }}
            >
              {affinity}
            </button>
          ))}
        </div>
        <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
          {CARDS.filter((item) => !card || item.affinity === card.affinity).map((item) => {
            const owned = save.cards[item.id] ?? 0;
            const used = deck?.cards.filter((id) => id === item.id).length ?? 0;
            const extra = surplus(owned, item);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-2 py-2">
                <button
                  className={`min-h-11 flex-1 px-1 text-left ${cardId === item.id ? "font-semibold" : ""}`}
                  onClick={() => {
                    setCardId(item.id);
                    setWhen("then");
                  }}
                >
                  <span className="block">{item.name}</span>
                  <span className="text-xs text-ink/60">
                    {typeLabel(item.type)} · {item.rarity} · cost {item.cost} · stoke {item.kindling} · in deck {used}/
                    {copyLimit(item)}
                    {extra > 0 ? ` · surplus ${extra}` : ""}
                  </span>
                </button>
                {deck && (
                  <span className="flex gap-1">
                    <button
                      className="press h-11 w-11 rounded-full bg-ink/5 text-lg"
                      aria-label={`Remove one ${item.name}`}
                      onClick={() => {
                        const index = deck.cards.indexOf(item.id);
                        if (index >= 0) dispatch({ type: "removeFromDeck", deckId: deck.id, index });
                      }}
                    >
                      –
                    </button>
                    <button
                      className="press h-11 w-11 rounded-full bg-pine text-lg text-paper"
                      aria-label={`Add one ${item.name}`}
                      onClick={() => dispatch({ type: "addToDeck", deckId: deck.id, cardId: item.id })}
                    >
                      +
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {card && deck && (
        <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
          <CardFace card={card} />
          <article className="rounded-card border border-ink/15 p-4">
            <p className="text-xs font-semibold tracking-widest text-ink/60 uppercase">Margin</p>
            <p className="mt-2 text-pretty text-sm">
              {when === "later" && card.later && laterOpen(save, card.id)
                ? card.later.text
                : when === "later"
                  ? "Play the card in a keeping. The later note is written after it has been through a winter."
                  : card.then}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="press h-11 rounded-full bg-ink/10 px-4 text-sm font-semibold" onClick={() => setWhen("then")}>
                {card.year}
              </button>
              {card.later && (
                <button
                  className="press h-11 rounded-full bg-ink/10 px-4 text-sm font-semibold"
                  onClick={() => setWhen("later")}
                >
                  {card.later.year}
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="press h-11 rounded-full bg-pine px-4 text-sm font-semibold text-paper"
                onClick={() => {
                  dispatch({ type: "seat", cardId: card.id });
                  onPractice();
                  dispatch({ type: "startKeeping", openWith: card.id });
                }}
              >
                Seat a legal deck and practice this card
              </button>
              <p className="text-xs text-ink/70">
                In this ledger: {inDeck}. Owned: {save.cards[card.id] ?? 0}.
              </p>
            </div>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-semibold">Keeping law</summary>
              <p className="mt-2 text-pretty">{KEEPING_LAW}</p>
            </details>
          </article>
        </div>
      )}
    </div>
  );
}

function countTypes(ids: readonly string[]): Record<CardType, number> {
  const counts: Record<CardType, number> = { kin: 0, place: 0, memory: 0, heirloom: 0, weather: 0 };
  for (const id of ids) {
    const card = getCard(id);
    if (card) counts[card.type] += 1;
  }
  return counts;
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`rounded-full px-3 py-2 ${ok ? "bg-pine/10 text-pine" : "bg-ember/10 text-ember"}`}>
      {ok ? "Holds" : "Short"} · {label}
    </li>
  );
}
