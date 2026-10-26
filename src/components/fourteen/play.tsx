import "./fourteen.css";
import { useEffect, useState } from "react";
import { PRACTICE_WEIGHTS } from "@/game/fourteen-winters/ai";
import { PLOTS } from "@/game/fourteen-winters/board";
import { CARD_LIST, CARDS, IDENTITIES, type Identity } from "@/game/fourteen-winters/cards";
import { OPPONENTS, pureDeck } from "@/game/fourteen-winters/decks";
import { mechanicalLine, validateDeck, type CardInst, type GameState, type Seat } from "@/game/fourteen-winters/engine";
import { lessonDecks } from "@/game/fourteen-winters/tutorial";
import { freshProfile, loadProfile, primaryIdentity, saveProfile, type Profile, type ReplayRecord, type SavedDeck } from "@/components/fourteen/storage";
import { Rules } from "@/components/fourteen/rules";
import { Table, type Setup } from "@/components/fourteen/table";

type Screen = "home" | "sit" | "rules" | "collection" | "builder" | "table" | "replay";

export function FourteenWinters() {
  const [profile, setProfile] = useState<Profile>(freshProfile);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [setup, setSetup] = useState<Setup | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) saveProfile(profile);
  }, [profile, ready]);

  function finish(state: GameState) {
    if (!setup || setup.humans.length !== 1) return;
    const human: Seat = 0;
    const won = state.winner === human;
    const identity = primaryIdentity(setup.decks[0]);
    setProfile((current) => ({
      ...current,
      stats: {
        played: current.stats.played + 1,
        wins: current.stats.wins + (won ? 1 : 0),
        losses: current.stats.losses + (state.winner === 1 ? 1 : 0),
        draws: current.stats.draws + (state.winner === "draw" ? 1 : 0),
      },
      ribbons:
        won && setup.opponentId && !current.ribbons.includes(setup.opponentId)
          ? [...current.ribbons, setup.opponentId]
          : current.ribbons,
      remembered: won && identity && !current.remembered.includes(identity) ? [...current.remembered, identity] : current.remembered,
      lastReplay: toReplay(state, setup),
    }));
  }

  return (
    <main className="fw" data-screen={screen}>
      {screen === "home" ? (
        <Home
          profile={profile}
          onGo={setScreen}
          onLesson={() => {
            setSetup({
              seed: 14,
              decks: lessonDecks(),
              names: ["You", "Neighbor"],
              era1First: 0,
              humans: [0],
              opponentId: "tutorial",
              weights: PRACTICE_WEIGHTS,
              practice: true,
              tutorial: true,
              stacked: true,
            });
            setScreen("table");
          }}
          onReplay={() => profile.lastReplay && setScreen("replay")}
        />
      ) : null}
      {screen === "rules" ? <Rules onBack={() => setScreen("home")} /> : null}
      {screen === "sit" ? (
        <Sit
          profile={profile}
          onBack={() => setScreen("home")}
          onStart={(next) => {
            setSetup(next);
            setScreen("table");
          }}
        />
      ) : null}
      {screen === "collection" ? <Collection profile={profile} onBack={() => setScreen("home")} /> : null}
      {screen === "builder" ? (
        <Builder profile={profile} onChange={setProfile} onBack={() => setScreen("home")} />
      ) : null}
      {screen === "table" && setup ? (
        <Table setup={setup} onLeave={() => setScreen("home")} onResult={finish} />
      ) : null}
      {screen === "replay" && profile.lastReplay ? (
        <Table
          setup={setupFromReplay(profile.lastReplay)}
          replay={profile.lastReplay}
          onLeave={() => setScreen("home")}
          onResult={() => undefined}
        />
      ) : null}
    </main>
  );
}

const WAYS: Record<Identity, string> = {
  river: "A water route scores only when both households are on it.",
  orchard: "Plant a home, then sit kin beside it.",
  parish: "A chapel scores for the household, and a little for whoever stands next to it.",
  timber: "A tool scores only while a fitting neighbor is still there.",
  threshold: "Events change the winter. They do not stay on the map.",
  commons: "A pact pays both sides. The border is the point.",
};

function Home({
  profile,
  onGo,
  onLesson,
  onReplay,
}: {
  profile: Profile;
  onGo: (screen: Screen) => void;
  onLesson: () => void;
  onReplay: () => void;
}) {
  return (
    <div className="fw-wrap">
      <div className="home-hero">
        <div>
          <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.78rem", color: "var(--color-faint)", marginBottom: 8 }}>
            Addison County
          </p>
          <h1 className="display" style={{ fontSize: "clamp(2.6rem, 7vw, 4.6rem)", margin: 0 }}>
            Fourteen Winters
          </h1>
          <p style={{ maxWidth: 620, fontSize: "1.15rem" }}>
            Two households share one county across two eras. You place homes, people, tools, and institutions on the same
            ground, then decide which of them is still there after the seventh winter.
          </p>
        </div>
        <div>
          <div className="mini-county" aria-hidden="true">
            {PLOTS.map((plot) => (
              <span key={plot.index} data-terrain={plot.terrain} />
            ))}
          </div>
          <p className="mini-caption">The same sixteen plots, every match.</p>
        </div>
      </div>
      <div className="actions">
        <button className="btn btn-primary" type="button" onClick={() => onGo("sit")}>
          Sit down
        </button>
        <button className="btn" type="button" onClick={onLesson}>
          Lesson
        </button>
        <button className="btn" type="button" onClick={() => onGo("collection")}>
          Archive
        </button>
        <button className="btn" type="button" onClick={() => onGo("builder")}>
          Decks
        </button>
        <button className="btn" type="button" onClick={() => onGo("rules")}>
          Rules
        </button>
        {profile.lastReplay ? (
          <button className="btn" type="button" onClick={onReplay}>
            Replay seed {profile.lastReplay.seed}
          </button>
        ) : null}
      </div>
      <p style={{ color: "var(--color-muted)" }}>
        {profile.stats.played} matches sat · {profile.stats.wins} taken · {profile.stats.losses} lost · {profile.stats.draws}{" "}
        drawn. The lesson is four winters. A full match is fourteen. All 72 cards are already in the archive.
      </p>
      <div className="identities" style={{ marginTop: 8 }}>
        {(Object.keys(IDENTITIES) as Identity[]).map((id) => (
          <article key={id} className="id-card" data-id={id}>
            <p className="kind">{profile.remembered.includes(id) ? "Remembered" : "In the archive"}</p>
            <h2>{IDENTITIES[id].name}</h2>
            <p>{IDENTITIES[id].promise}</p>
            <p className="way">{WAYS[id]}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Sit({ profile, onBack, onStart }: { profile: Profile; onBack: () => void; onStart: (setup: Setup) => void }) {
  const [deckId, setDeckId] = useState(profile.activeDeckId);
  const [opponentId, setOpponentId] = useState("mara");
  const [seed, setSeed] = useState(14014);
  const [opener, setOpener] = useState<"you" | "them" | "seed">("seed");
  const [hotseat, setHotseat] = useState(false);
  const deck = profile.decks.find((item) => item.id === deckId) ?? profile.decks[0]!;
  const deckError = validateDeck(deck.cards);

  function begin(kind: "match" | "lesson") {
    if (kind === "lesson") {
      const decks = lessonDecks();
      onStart({
        seed: 14,
        decks,
        names: ["You", "Neighbor"],
        era1First: 0,
        humans: [0],
        opponentId: "tutorial",
        weights: PRACTICE_WEIGHTS,
        practice: true,
        tutorial: true,
        stacked: true,
      });
      return;
    }
    const opponent = OPPONENTS.find((item) => item.id === opponentId) ?? OPPONENTS[1]!;
    const era1First: Seat | undefined = opener === "you" ? 0 : opener === "them" ? 1 : undefined;
    onStart({
      seed: seed >>> 0,
      decks: hotseat ? [deck.cards, deck.cards] : [deck.cards, opponent.deck],
      names: hotseat ? ["South", "North"] : ["You", opponent.name],
      era1First,
      humans: hotseat ? [0, 1] : [0],
      opponentId: hotseat ? null : opponent.id,
      weights: opponent.weights,
      practice: opponent.practice,
      tutorial: false,
      stacked: false,
    });
  }

  return (
    <div className="fw-wrap" style={{ maxWidth: 760 }}>
      <button className="btn" type="button" onClick={onBack}>
        Back
      </button>
      <h1 className="display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginBottom: 8 }}>
        Who sits where
      </h1>
      <div className="panel" style={{ display: "grid", gap: 12 }}>
        <label>
          Your household
          <select className="field" value={deck.id} onChange={(event) => setDeckId(event.target.value)}>
            {profile.decks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {deckError ? <p role="alert">{deckError}</p> : <p style={{ color: "var(--color-muted)", margin: 0 }}>This deck is legal.</p>}
        <label>
          Across the table
          <select className="field" value={opponentId} onChange={(event) => setOpponentId(event.target.value)} disabled={hotseat}>
            {OPPONENTS.filter((item) => item.kind !== "tutorial").map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {profile.ribbons.includes(item.id) ? " · remembered" : ""}
              </option>
            ))}
          </select>
        </label>
        <p style={{ color: "var(--color-muted)", margin: 0 }}>
          {OPPONENTS.find((item) => item.id === opponentId)?.blurb}
        </p>
        <label>
          Seed
          <input className="field" inputMode="numeric" value={seed} onChange={(event) => setSeed(Number(event.target.value) || 0)} />
        </label>
        <div className="actions">
          <button className="btn" type="button" onClick={() => setSeed((Date.now() ^ 0x9e3779b9) >>> 0)}>
            Another seed
          </button>
          <button className={`btn${opener === "you" ? " btn-primary" : ""}`} type="button" onClick={() => setOpener("you")}>
            You open
          </button>
          <button className={`btn${opener === "them" ? " btn-primary" : ""}`} type="button" onClick={() => setOpener("them")}>
            They open
          </button>
          <button className={`btn${opener === "seed" ? " btn-primary" : ""}`} type="button" onClick={() => setOpener("seed")}>
            Seed decides
          </button>
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44 }}>
          <input type="checkbox" checked={hotseat} onChange={(event) => setHotseat(event.target.checked)} />
          Pass the table. Both households are people, using this deck twice.
        </label>
        <div className="actions">
          <button className="btn btn-primary" type="button" disabled={!!deckError} onClick={() => begin("match")}>
            Begin the fourteen
          </button>
          <button className="btn" type="button" onClick={() => begin("lesson")}>
            Start the lesson
          </button>
        </div>
      </div>
    </div>
  );
}

function Collection({ profile: _profile, onBack }: { profile: Profile; onBack: () => void }) {
  const [filter, setFilter] = useState<Identity | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const cards = CARD_LIST.filter((card) => filter === "all" || card.identity === filter);
  const shown = open ? CARDS[open] : null;
  return (
    <div className="fw-wrap">
      <button className="btn" type="button" onClick={onBack}>
        Back
      </button>
      <h1 className="display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
        County archive
      </h1>
      <p style={{ color: "var(--color-muted)" }}>
        72 cards. Each one was given with the household record at the first sitting. Not sold, not packed, not gated.
      </p>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button className={filter === "all" ? "btn btn-primary" : "btn"} type="button" onClick={() => setFilter("all")}>
          All
        </button>
        {(Object.keys(IDENTITIES) as Identity[]).map((id) => (
          <button key={id} className={filter === id ? "btn btn-primary" : "btn"} type="button" onClick={() => setFilter(id)}>
            {IDENTITIES[id].name}
          </button>
        ))}
      </div>
      <div className="catalog">
        {cards.map((card) => (
          <button key={card.id} type="button" className="hand-card" onClick={() => setOpen(card.id)}>
            <span className="kind">{IDENTITIES[card.identity].name}</span>
            <strong>{card.name}</strong>
            <span className="flavor">
              {card.kind} · {card.cost} warmth
            </span>
          </button>
        ))}
      </div>
      {shown ? (
        <div className="panel" style={{ marginTop: 12 }} role="dialog" aria-label={shown.name}>
          <h2 className="display" style={{ marginTop: 0 }}>
            {shown.name}
          </h2>
          <p>{mechanicalLine(fakeInst(shown.id))}</p>
          <p>{shown.flavor}</p>
          {shown.heir ? (
            <p>
              Later face: {shown.heir.name}. Base {shown.heir.base}. {shown.heir.tags.join(", ")}. {shown.heir.flavor}
            </p>
          ) : null}
          <p style={{ color: "var(--color-muted)" }}>{shown.acquisition}</p>
          <button className="btn" type="button" onClick={() => setOpen(null)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Builder({ profile, onChange, onBack }: { profile: Profile; onChange: (profile: Profile) => void; onBack: () => void }) {
  const [deckId, setDeckId] = useState(profile.activeDeckId);
  const [filter, setFilter] = useState<Identity | "all">("all");
  const deck = profile.decks.find((item) => item.id === deckId) ?? profile.decks[0]!;
  const error = validateDeck(deck.cards);
  const catalog = CARD_LIST.filter((card) => filter === "all" || card.identity === filter);

  function write(next: SavedDeck) {
    onChange({
      ...profile,
      activeDeckId: next.id,
      decks: profile.decks.map((item) => (item.id === next.id ? next : item)),
    });
  }

  function add(id: string) {
    if (deck.cards.length >= 24) return;
    if (deck.cards.filter((card) => card === id).length >= 2) return;
    write({ ...deck, cards: [...deck.cards, id] });
  }

  function remove(index: number) {
    const cards = deck.cards.slice();
    cards.splice(index, 1);
    write({ ...deck, cards });
  }

  return (
    <div className="fw-wrap">
      <button className="btn" type="button" onClick={onBack}>
        Back
      </button>
      <h1 className="display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
        Deck
      </h1>
      <div className="actions" style={{ marginBottom: 12 }}>
        <select className="field" style={{ maxWidth: 280 }} value={deck.id} onChange={(event) => setDeckId(event.target.value)}>
          {profile.decks.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          className="btn"
          type="button"
          onClick={() => {
            const id = `house-${Date.now()}`;
            const copy: SavedDeck = { id, name: `${deck.name} copy`, cards: [...deck.cards] };
            onChange({ ...profile, activeDeckId: id, decks: [...profile.decks, copy] });
            setDeckId(id);
          }}
        >
          Duplicate
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => {
            const starters = (Object.keys(IDENTITIES) as Identity[]).map((id) => ({
              id,
              name: IDENTITIES[id].name,
              cards: pureDeck(id),
            }));
            const custom = profile.decks.filter((item) => !IDENTITIES[item.id as Identity]);
            onChange({ ...profile, decks: [...starters, ...custom] });
          }}
        >
          Restore the six
        </button>
      </div>
      <p>{error ?? `${deck.cards.length} cards. Legal.`} Rename below if you want this household kept.</p>
      <input
        className="field"
        style={{ maxWidth: 360, marginBottom: 12 }}
        value={deck.name}
        onChange={(event) => write({ ...deck, name: event.target.value })}
      />
      <div className="table-grid">
        <div>
          <div className="actions" style={{ marginBottom: 8 }}>
            <button className={filter === "all" ? "btn btn-primary" : "btn"} type="button" onClick={() => setFilter("all")}>
              All
            </button>
            {(Object.keys(IDENTITIES) as Identity[]).map((id) => (
              <button key={id} className={filter === id ? "btn btn-primary" : "btn"} type="button" onClick={() => setFilter(id)}>
                {IDENTITIES[id].name}
              </button>
            ))}
          </div>
          <div className="catalog">
            {catalog.map((card) => {
              const copies = deck.cards.filter((id) => id === card.id).length;
              return (
                <button key={card.id} type="button" className="hand-card" onClick={() => add(card.id)} disabled={copies >= 2 || deck.cards.length >= 24}>
                  <span className="kind">
                    {card.kind} · {copies}/2
                  </span>
                  <strong>{card.name}</strong>
                </button>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>In the deck</h2>
          <ol style={{ paddingLeft: 18 }}>
            {deck.cards.map((id, index) => (
              <li key={`${id}-${index}`}>
                <button className="btn" type="button" onClick={() => remove(index)} style={{ margin: "4px 0" }}>
                  Remove {CARDS[id]?.name ?? id}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function fakeInst(defId: string): CardInst {
  return { uid: defId, defId, owner: 0, face: "printed", tend: 0, bonus: 0, inherited: false, sealFavor: false };
}

function toReplay(state: GameState, setup: Setup): ReplayRecord {
  return {
    seed: state.seed,
    era1First: state.era1First,
    decks: state.deckLists,
    names: state.names,
    stacked: setup.stacked,
    turnsPerEra: state.config.turnsPerEra,
    freeKeeps: state.config.freeKeeps,
    coach: state.config.coach,
    actions: state.actions,
    opponentId: setup.opponentId,
    humans: setup.humans,
  };
}

function setupFromReplay(record: ReplayRecord): Setup {
  return {
    seed: record.seed,
    decks: record.decks,
    names: record.names,
    era1First: record.era1First,
    humans: record.humans,
    opponentId: record.opponentId,
    weights: PRACTICE_WEIGHTS,
    practice: true,
    tutorial: record.coach,
    stacked: record.stacked,
  };
}
