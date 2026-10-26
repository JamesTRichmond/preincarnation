import { useEffect, useRef, useState } from "react";
import { chooseAction, type Weights } from "@/game/fourteen-winters/ai";
import { PLOTS } from "@/game/fourteen-winters/board";
import { CARDS } from "@/game/fourteen-winters/cards";
import {
  LESSON,
  actionKey,
  applyAction,
  createMatch,
  faceOf,
  legalActions,
  legalPlots,
  mechanicalLine,
  mendTargets,
  pactPairs,
  playCost,
  recallTargets,
  rememberPreview,
  score,
  type Action,
  type Config,
  type GameState,
  type Seat,
} from "@/game/fourteen-winters/engine";
import { coachLine, tutorialOpponentAction } from "@/game/fourteen-winters/tutorial";
import type { ReplayRecord } from "@/components/fourteen/storage";

export interface Setup {
  seed: number;
  decks: [string[], string[]];
  names: [string, string];
  era1First?: Seat;
  humans: Seat[];
  opponentId: string | null;
  weights: Weights;
  practice: boolean;
  tutorial: boolean;
  stacked: boolean;
}

function configOf(setup: Setup): Partial<Config> | undefined {
  return setup.tutorial ? LESSON : undefined;
}

export function Table({
  setup,
  replay,
  onLeave,
  onResult,
}: {
  setup: Setup;
  replay?: ReplayRecord | null;
  onLeave: () => void;
  onResult: (state: GameState) => void;
}) {
  const [match, setMatch] = useState(() =>
    createMatch({
      seed: setup.seed,
      decks: setup.decks,
      names: setup.names,
      era1First: setup.era1First,
      stacked: setup.stacked,
      config: configOf(setup),
    }),
  );
  const [cursor, setCursor] = useState(12);
  const [selected, setSelected] = useState<string | null>(null);
  const [fault, setFault] = useState<string | null>(null);
  const [cover, setCover] = useState(false);
  const [remembering, setRemembering] = useState<{ hand: string[]; drawn: string[] } | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const [step, setStep] = useState(replay ? 0 : -1);
  const recorded = useRef(false);
  const token = useRef(0);
  const freshTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(freshTimer.current), []);

  const viewing = step >= 0 && replay ? stepped(replay, step) : match;
  const actor: Seat | null = viewing.phase === "inherit" ? viewing.chooser : viewing.phase === "play" ? viewing.active : null;
  const humanTurn = actor !== null && setup.humans.includes(actor);
  const commitRef = useRef<(current: GameState, action: Action) => void>(() => undefined);

  useEffect(() => {
    if (replay || cover || viewing.phase === "over" || actor === null || setup.humans.includes(actor)) return;
    const mine = ++token.current;
    const timer = window.setTimeout(() => {
      if (token.current !== mine) return;
      const action = setup.tutorial
        ? tutorialOpponentAction(viewing)
        : chooseAction(viewing, setup.weights, setup.practice);
      commitRef.current(viewing, action);
    }, 420);
    return () => {
      window.clearTimeout(timer);
      token.current += 1;
    };
  }, [viewing, actor, cover, replay, setup]);

  function commit(current: GameState, action: Action) {
    try {
      const next = applyAction(current, action);
      setFault(null);
      setRemembering(null);
      setSelected(null);
      markFresh(action, next);
      if (setup.humans.length > 1 && next.phase === "play" && setup.humans.includes(next.active)) setCover(true);
      setMatch(next);
      if (next.phase === "over" && !recorded.current) {
        recorded.current = true;
        onResult(next);
      }
    } catch (error) {
      setFault(error instanceof Error ? error.message : "That winter is not legal.");
    }
  }

  commitRef.current = commit;

  function markFresh(action: Action, next: GameState) {
    let plot: number | null = null;
    if ((action.type === "establish" || action.type === "share") && action.plot !== undefined) plot = action.plot;
    else if (action.type === "tend") {
      const found = next.plots.indexOf(action.cardUid);
      plot = found >= 0 ? found : null;
    } else if (action.type === "establish" && action.targetUid) {
      const found = next.plots.indexOf(action.targetUid);
      plot = found >= 0 ? found : null;
    }
    setFresh(plot);
    window.clearTimeout(freshTimer.current);
    if (plot !== null) freshTimer.current = window.setTimeout(() => setFresh(null), 1400);
  }

  function isLegal(action: Action) {
    if (viewing.phase !== "play") return false;
    return legalActions(viewing).some((item) => actionKey(item) === actionKey(action));
  }

  const handSeat: Seat = humanTurn && actor !== null ? actor : 0;
  const hand = viewing.players[handSeat].hand;
  const selectedFace = selected ? faceOf(viewing.cards[selected]!) : null;
  const plotsForSelected =
    selected && humanTurn && !cover && viewing.phase === "play"
      ? legalPlots(viewing, viewing.active, selected).filter(
          (plot) => viewing.players[viewing.active].warmth >= playCost(viewing, viewing.active, selected, plot),
        )
      : [];

  function onPlot(index: number) {
    setCursor(index);
    if (!humanTurn || cover || viewing.phase !== "play" || !selected) return;
    if (!plotsForSelected.includes(index)) {
      setFault(whyNot(viewing, viewing.active, selected, index));
      return;
    }
    commit(viewing, { type: "establish", cardUid: selected, plot: index });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (replay) {
        if (event.key === "ArrowRight") setStep((n) => Math.min(replay.actions.length, n + 1));
        if (event.key === "ArrowLeft") setStep((n) => Math.max(0, n - 1));
        return;
      }
      if (cover) {
        if (event.key === "Enter") setCover(false);
        return;
      }
      if (remembering) {
        if (event.key === "Escape") setRemembering(null);
        const digit = Number(event.key);
        if (digit >= 1 && digit <= remembering.hand.length) {
          event.preventDefault();
          commit(viewing, { type: "remember", bottomUid: remembering.hand[digit - 1]! });
        }
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCursor((c) => (c % 4 === 3 ? c - 3 : c + 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCursor((c) => (c % 4 === 0 ? c + 3 : c - 1));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => Math.min(15, c + 4));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => Math.max(0, c - 4));
      } else if (event.key === "Escape") setSelected(null);
      else if (event.key >= "1" && event.key <= "9") {
        const card = hand[Number(event.key) - 1];
        if (card) setSelected(card);
      } else if ((event.key === "e" || event.key === "E") && humanTurn && selected) {
        if (plotsForSelected.includes(cursor)) onPlot(cursor);
        else if (selectedFace?.kind === "event" && isLegal({ type: "establish", cardUid: selected })) {
          commit(viewing, { type: "establish", cardUid: selected });
        } else if (selectedFace?.kind === "event") {
          setFault(`${selectedFace.shownName} cannot be played this winter.`);
        } else setFault(whyNot(viewing, viewing.active, selected, cursor));
      } else if (event.key === "t" || event.key === "T") {
        const uid = viewing.plots[cursor];
        if (uid && humanTurn && isLegal({ type: "tend", cardUid: uid })) commit(viewing, { type: "tend", cardUid: uid });
      } else if (event.key === "s" || event.key === "S") {
        const pairs = pactPairs(viewing, viewing.active);
        const hit = pairs.find((pair) => pair.plot === cursor || pair.neighbor === cursor) ?? pairs[0];
        if (hit && humanTurn && isLegal({ type: "share", plot: hit.plot, neighbor: hit.neighbor })) {
          commit(viewing, { type: "share", plot: hit.plot, neighbor: hit.neighbor });
        }
      } else if ((event.key === "r" || event.key === "R") && humanTurn) {
        const preview = rememberPreview(viewing);
        if (preview) setRemembering(preview);
      } else if ((event.key === "p" || event.key === "P") && humanTurn && isLegal({ type: "pass" })) {
        commit(viewing, { type: "pass" });
      } else if (event.key === "Enter" && selected && plotsForSelected.includes(cursor)) onPlot(cursor);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const breakdown = score(viewing);
  const coach = coachLine(viewing);
  const kept = new Set<string>();
  for (const choice of viewing.choices) for (const uid of choice?.keep ?? []) kept.add(uid);

  return (
    <div className="fw-wrap table-grid">
      <section className="table-main">
        <div className="table-head">
        <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.85rem" }}>
              {viewing.phase === "over"
                ? "The county is settled"
                : viewing.phase === "inherit"
                  ? "Threshold"
                  : `Era ${viewing.era === 1 ? "I" : "II"} · winter ${Math.min(viewing.config.turnsPerEra, viewing.players[viewing.active].turnsTaken + 1)} of ${viewing.config.turnsPerEra}`}
            </p>
            <h1 className="display" style={{ fontSize: "1.8rem", margin: "2px 0 0" }}>
              {viewing.names[0]} and {viewing.names[1]}
            </h1>
          </div>
          <button className="btn" type="button" onClick={onLeave}>
            Leave the table
          </button>
        </header>
        <p style={{ color: "var(--color-faint)", fontVariantNumeric: "tabular-nums", marginBottom: 0 }}>Seed {viewing.seed}</p>
        <Households state={viewing} actor={actor} rows={breakdown} />
        {viewing.log.length > 0 ? (
          <p className="callout" aria-live="polite">
            {viewing.log.slice(-2).join(" ")}
          </p>
        ) : null}
        {coach && !replay ? <p className="note">{coach}</p> : null}
        {fault ? (
          <p className="fault" role="alert">
            {fault}
          </p>
        ) : null}
        </div>
        <div className="board-scroll">
        <div className="board" role="grid" aria-label="County board">
          {PLOTS.map((plot) => {
            const uid = viewing.plots[plot.index];
            const inst = uid ? viewing.cards[uid] : null;
            const face = inst ? faceOf(inst) : null;
            const legalPlot = plotsForSelected.includes(plot.index);
            return (
              <button
                key={plot.index}
                type="button"
                className={`plot${cursor === plot.index ? " is-cursor" : ""}${legalPlot ? " is-legal" : ""}${uid && kept.has(uid) ? " is-kept" : ""}${hasPact(viewing, plot.index) ? " is-pact" : ""}${fresh === plot.index ? " is-fresh" : ""}`}
                data-plot={plot.index}
                data-terrain={plot.terrain}
                aria-label={`${plot.name}, ${plot.terrain}${plot.water ? ", water" : ""}${face ? `, ${face.shownName}` : ""}`}
                onClick={() => onPlot(plot.index)}
              >
                <span className="plot-meta">
                  <span>{plot.short}</span>
                  <span>{plot.water ? "Water" : plot.terrain}</span>
                </span>
                {face && inst ? (
                  <span className={`slip ${inst.owner === 0 ? "south" : "north"}`}>
                    <b>{face.shownName}</b>
                    <span className="marks">
                      {inst.tend ? `${inst.tend} tend` : ""}
                      {inst.inherited ? " inherited" : ""}
                      {hasPact(viewing, plot.index) ? " pact" : ""}
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        </div>
        <div className="play-dock">

        {cover ? (
          <div className="cover" style={{ marginTop: 12 }}>
            <h2 className="display" style={{ margin: "0 0 8px", fontSize: "1.6rem" }}>
              {viewing.names[viewing.active]}'s winter
            </h2>
            <p style={{ color: "var(--color-muted)" }}>
              The county stays in view. Their hand stays covered until the table is passed.
            </p>
            <button className="btn btn-primary" type="button" onClick={() => setCover(false)}>
              Show the hand
            </button>
          </div>
        ) : remembering ? (
          <div style={{ marginTop: 12 }}>
            <h2 style={{ marginBottom: 8 }}>Put one card under the deck</h2>
            <div className="hand">
              {remembering.hand.map((uid) => (
                <button
                  key={uid}
                  type="button"
                  className="hand-card"
                  onClick={() => commit(viewing, { type: "remember", bottomUid: uid })}
                >
                  <span className="kind">{remembering.drawn.includes(uid) ? "Just drawn" : faceOf(viewing.cards[uid]!).kind}</span>
                  <strong>{faceOf(viewing.cards[uid]!).shownName}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : viewing.phase === "over" || viewing.phase === "inherit" ? null : (
          <>
            <div className="hand" style={{ marginTop: 12 }} aria-label="Hand">
              {hand.map((uid, index) => {
                const face = faceOf(viewing.cards[uid]!);
                const status = cardStatus(viewing, handSeat, uid);
                const playable = humanTurn && status.playable;
                return (
                  <button
                    key={uid}
                    type="button"
                    className={`hand-card${selected === uid ? " is-on" : ""}${humanTurn ? (playable ? " is-ready" : " is-cold") : ""}`}
                    onClick={() => humanTurn && setSelected(uid)}
                  >
                    <span className="cost" aria-label={`${face.cost} warmth`}>
                      {face.cost}
                    </span>
                    <span className="kind">
                      {index + 1} · {face.kind}
                    </span>
                    <strong>{face.shownName}</strong>
                    <span className="status">{status.line}</span>
                  </button>
                );
              })}
            </div>
            {selectedFace && selected ? (
              <p className="reading">
                <strong>{selectedFace.shownName}.</strong> {selectedFace.shownFlavor} {mechanicalLine(viewing.cards[selected]!)}.{" "}
                {cardStatus(viewing, handSeat, selected).line}
                {humanTurn && viewing.phase === "play"
                  ? ` Cursor is ${PLOTS[cursor]!.name}, cost ${playCost(viewing, viewing.active, selected, cursor)}.`
                  : ""}
              </p>
            ) : (
              <p className="reading">
                {PLOTS[cursor]!.name}, {PLOTS[cursor]!.terrain}
                {PLOTS[cursor]!.water ? ", water" : ""}. Choose a card, then a marked plot. Arrows move. E plays. T tends. S
                shares. R remembers. P passes.
              </p>
            )}
            <div className="actions">
              <button
                className="btn btn-primary"
                type="button"
                disabled={!humanTurn || !selected || !plotsForSelected.includes(cursor)}
                onClick={() => onPlot(cursor)}
              >
                Establish on {PLOTS[cursor]!.short}
              </button>
              {selectedFace?.kind === "event" && selected && humanTurn ? (
                <EventButtons match={viewing} cardUid={selected} commit={(action) => commit(viewing, action)} />
              ) : null}
              <button
                className="btn"
                type="button"
                disabled={!humanTurn || !viewing.plots[cursor] || !isLegal({ type: "tend", cardUid: viewing.plots[cursor]! })}
                onClick={() => viewing.plots[cursor] && commit(viewing, { type: "tend", cardUid: viewing.plots[cursor]! })}
              >
                Tend
              </button>
              <button
                className="btn"
                type="button"
                disabled={!humanTurn || !rememberPreview(viewing)}
                onClick={() => {
                  const preview = rememberPreview(viewing);
                  if (preview) setRemembering(preview);
                }}
              >
                Remember
              </button>
              <button className="btn" type="button" disabled={!humanTurn || !isLegal({ type: "pass" })} onClick={() => commit(viewing, { type: "pass" })}>
                Pass
              </button>
            </div>
            {humanTurn && viewing.phase === "play" && pactPairs(viewing, viewing.active).length > 0 ? (
              <div className="actions" style={{ marginTop: 8 }}>
                {pactPairs(viewing, viewing.active)
                  .slice(0, 4)
                  .map((pair) => (
                    <button
                      key={`${pair.plot}-${pair.neighbor}`}
                      className="btn"
                      type="button"
                      onClick={() => commit(viewing, { type: "share", plot: pair.plot, neighbor: pair.neighbor })}
                    >
                      Pact {PLOTS[pair.plot]!.short} / {PLOTS[pair.neighbor]!.short}
                    </button>
                  ))}
              </div>
            ) : null}
          </>
        )}

        {viewing.phase === "inherit" && !replay && !humanTurn ? (
          <p className="note">The other household is choosing what carries across.</p>
        ) : null}
        {viewing.phase === "inherit" && humanTurn && viewing.chooser !== null && !replay ? (
          <Inherit match={viewing} seat={viewing.chooser} onChoose={(action) => commit(viewing, action)} />
        ) : null}
        {replay ? (
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn" type="button" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step <= 0}>
              Previous
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setStep((n) => Math.min(replay.actions.length, n + 1))}
              disabled={step >= replay.actions.length}
            >
              Next winter
            </button>
            <span style={{ color: "var(--color-muted)", alignSelf: "center" }}>
              {step} / {replay.actions.length}
            </span>
          </div>
        ) : null}
        {viewing.phase === "over" ? <ResultBanner state={viewing} /> : null}
        </div>
      </section>
      <aside className="panel table-side">
        <Ledger state={viewing} rows={breakdown} />
        <h2 style={{ fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
          Winters
        </h2>
        <ol style={{ margin: 0, paddingLeft: 18, color: "var(--color-muted)" }}>
          {viewing.log.slice(-8).map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function hasPact(state: GameState, plot: number) {
  return state.pacts.some(([a, b]) => a === plot || b === plot);
}

function EventButtons({ match, cardUid, commit }: { match: GameState; cardUid: string; commit: (action: Action) => void }) {
  const face = faceOf(match.cards[cardUid]!);
  if (face.effect === "mend") {
    return (
      <>
        {mendTargets(match, match.active).map((uid) => (
          <button key={uid} className="btn" type="button" onClick={() => commit({ type: "establish", cardUid, targetUid: uid })}>
            Tend {faceOf(match.cards[uid]!).shownName}
          </button>
        ))}
      </>
    );
  }
  if (face.effect === "recall") {
    return (
      <>
        {recallTargets(match, match.active).map((uid) => (
          <button key={uid} className="btn" type="button" onClick={() => commit({ type: "establish", cardUid, targetUid: uid })}>
            Call {faceOf(match.cards[uid]!).shownName}
          </button>
        ))}
      </>
    );
  }
  if (face.effect === "openPact") {
    return (
      <>
        {pactPairs(match, match.active).map((pair) => (
          <button
            key={`${pair.plot}-${pair.neighbor}`}
            className="btn"
            type="button"
            onClick={() => commit({ type: "establish", cardUid, plot: pair.plot, neighbor: pair.neighbor })}
          >
            Open {PLOTS[pair.plot]!.short}
          </button>
        ))}
      </>
    );
  }
  return (
    <button className="btn btn-primary" type="button" onClick={() => commit({ type: "establish", cardUid })}>
      Play {face.shownName}
    </button>
  );
}

function Inherit({ match, seat, onChoose }: { match: GameState; seat: Seat; onChoose: (action: Action) => void }) {
  const owned = match.plots.filter((uid): uid is string => !!uid && match.cards[uid]!.owner === seat);
  const [keep, setKeep] = useState<string[]>([]);
  const [transform, setTransform] = useState<string | undefined>(undefined);
  const cap = match.config.freeKeeps + match.players[seat].memory;
  function toggle(uid: string) {
    setKeep((current) => {
      if (current.includes(uid)) {
        if (transform === uid) setTransform(undefined);
        return current.filter((id) => id !== uid);
      }
      if (current.length >= cap) return current;
      return [...current, uid];
    });
  }
  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <h2 className="display" style={{ marginTop: 0, fontSize: "1.5rem" }}>
        What carries across
      </h2>
      <p style={{ color: "var(--color-muted)" }}>
        Keep up to {cap}. Memory pays for anything past {match.config.freeKeeps}. One kept card may take its later face.
      </p>
      <div className="actions">
        {owned.map((uid) => {
          const face = faceOf(match.cards[uid]!);
          const on = keep.includes(uid);
          return (
            <button key={uid} className={on ? "btn btn-primary" : "btn"} type="button" onClick={() => toggle(uid)}>
              {on ? "Keeping " : "Leave "}
              {face.shownName}
            </button>
          );
        })}
      </div>
      <div className="actions" style={{ marginTop: 8 }}>
        {keep
          .filter((uid) => CARDS[match.cards[uid]!.defId]?.heir && match.cards[uid]!.face === "printed")
          .map((uid) => (
            <button
              key={uid}
              className={transform === uid ? "btn btn-primary" : "btn"}
              type="button"
              onClick={() => setTransform((current) => (current === uid ? undefined : uid))}
            >
              Later face: {CARDS[match.cards[uid]!.defId]!.heir!.name}
            </button>
          ))}
        <button className="btn btn-primary" type="button" onClick={() => onChoose({ type: "inherit", keep, transform })}>
          Carry these
        </button>
      </div>
    </div>
  );
}

function Ledger({ state, rows }: { state: GameState; rows: ReturnType<typeof score> }) {
  const lines: [string, number, number][] = [
    ["Foundations", rows[0].foundations, rows[1].foundations],
    ["Hearths", rows[0].hearths, rows[1].hearths],
    ["Institutions", rows[0].institutions, rows[1].institutions],
    ["Water", rows[0].water, rows[1].water],
    ["Lineages", rows[0].lineages, rows[1].lineages],
    ["Pacts", rows[0].pacts, rows[1].pacts],
    ["Sealed", rows[0].seal, rows[1].seal],
    ["Total", rows[0].total, rows[1].total],
  ];
  return (
    <div>
      <div className="ledger" style={{ marginBottom: 8, color: "var(--color-faint)" }}>
        <span />
        <span>{state.names[0]}</span>
        <span>{state.names[1]}</span>
      </div>
      {lines.map(([label, a, b]) => (
        <div className="ledger" key={label} style={{ fontWeight: label === "Total" ? 600 : 400 }}>
          <span>{label}</span>
          <span>{a}</span>
          <span>{b}</span>
        </div>
      ))}
      <p style={{ color: "var(--color-faint)", fontVariantNumeric: "tabular-nums" }}>
        Warmth {state.players[0].warmth} / {state.players[1].warmth} · Memory {state.players[0].memory} /{" "}
        {state.players[1].memory}
      </p>
    </div>
  );
}

function ResultBanner({ state }: { state: GameState }) {
  const rows = score(state);
  const word =
    state.winner === "draw"
      ? "The households tie."
      : state.winner === null
        ? "The county is still open."
        : `${state.names[state.winner]} takes the county.`;
  return (
    <div className="panel settlement">
      <h2 className="display" style={{ margin: 0 }}>
        {word}
      </h2>
      <p className="settle">
        <span className="south-ink">
          {state.names[0]} {rows[0].total}
        </span>
        <span className="north-ink">
          {state.names[1]} {rows[1].total}
        </span>
      </p>
      <p style={{ margin: 0, color: "var(--color-muted)" }}>{swingLine(state, rows)}</p>
    </div>
  );
}

function swingLine(state: GameState, rows: ReturnType<typeof score>): string {
  const labels = {
    foundations: "what stayed on the ground",
    hearths: "connected homes",
    institutions: "institutions",
    water: "shared water",
    lineages: "remembered lineages",
    pacts: "pacts",
    seal: "what was sealed between the eras",
  } as const;
  const keys = Object.keys(labels) as (keyof typeof labels)[];
  if (state.winner === "draw" || state.winner === null) {
    return "Neither household pulled ahead. Inherited cards, then memory, would have broken the tie.";
  }
  const seat = state.winner;
  const leads = keys
    .map((key) => ({ key, gap: rows[0][key] - rows[1][key] }))
    .filter((item) => (seat === 0 ? item.gap > 0 : item.gap < 0))
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
    .slice(0, 2);
  if (leads.length === 0) return "The margin came from the way the winters were kept.";
  return `${state.names[seat]} led on ${leads.map((item) => labels[item.key]).join(" and ")}.`;
}

function Households({
  state,
  actor,
  rows,
}: {
  state: GameState;
  actor: Seat | null;
  rows: ReturnType<typeof score>;
}) {
  return (
    <div className="houses">
      {([0, 1] as const).map((seat) => (
        <div key={seat} className={`house ${seat === 0 ? "south" : "north"}${actor === seat ? " is-turn" : ""}`}>
          <div className="house-top">
            <strong>{state.names[seat]}</strong>
            <span className="tally">{rows[seat].total}</span>
          </div>
          <span className="pips" aria-label={`${state.players[seat].warmth} of ${state.config.warmthCap} warmth`}>
            {Array.from({ length: state.config.warmthCap }, (_, index) => (
              <i key={index} className={index < state.players[seat].warmth ? "on" : ""} />
            ))}
          </span>
          <span className="house-meta">
            Memory {state.players[seat].memory}
            <span className="winters" aria-label={`${state.players[seat].turnsTaken} winters taken`}>
              {Array.from({ length: state.config.turnsPerEra }, (_, index) => (
                <i key={index} className={index < state.players[seat].turnsTaken ? "spent" : ""} />
              ))}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function whyNot(state: GameState, seat: Seat, uid: string, plot: number): string {
  const face = faceOf(state.cards[uid]!);
  const ground = PLOTS[plot]!;
  const sitting = state.plots[plot];
  if (sitting) return `${ground.short} already holds ${faceOf(state.cards[sitting]!).shownName}.`;
  const open = legalPlots(state, seat, uid);
  const cost = playCost(state, seat, uid, plot);
  if (open.includes(plot) && state.players[seat].warmth < cost) {
    return `${face.shownName} needs ${cost} warmth on ${ground.short}. You have ${state.players[seat].warmth}.`;
  }
  if (face.kind === "place") {
    const want = face.terrain === "any" ? "any open ground" : `${face.terrain} ground`;
    return `${face.shownName} wants ${want}. ${ground.name} is ${ground.terrain}.`;
  }
  if (face.kind === "person") {
    return `${face.shownName} sits beside a place you own, beside kin${face.line ? ` of the ${face.line} line` : ""}, or on an open town or field if you have no place yet.`;
  }
  if (face.kind === "tool") {
    return `${face.shownName} has to sit beside ${(face.fits ?? ["a fitting neighbor"]).join(" or ")}.`;
  }
  if (face.kind === "institution") {
    return `${face.shownName} wants a town, or any plot that already has two neighbors.`;
  }
  return `${face.shownName} is not played onto the ground.`;
}

function cardStatus(state: GameState, seat: Seat, uid: string): { playable: boolean; line: string } {
  const face = faceOf(state.cards[uid]!);
  if (face.kind === "event") {
    const yourTurn = state.phase === "play" && state.active === seat;
    const playable =
      yourTurn && legalActions(state).some((action) => action.type === "establish" && action.cardUid === uid);
    const hint =
      face.effect === "mend"
        ? "Tends one of yours"
        : face.effect === "recall"
          ? "Calls one of yours home"
          : face.effect === "openPact"
            ? "Opens a border for free"
            : "From the hand";
    if (!yourTurn) return { playable: false, line: hint };
    return { playable, line: playable ? hint.replace("Tends", "Choose a card to tend").replace("Calls one of yours home", "Choose a card to call home").replace("Opens a border for free", "Choose a shared border").replace("From the hand", "Play from the hand") : "Not this winter" };
  }
  const open = legalPlots(state, seat, uid);
  const warmth = state.players[seat].warmth;
  const affordable = open.filter((plot) => warmth >= playCost(state, seat, uid, plot));
  if (affordable.length > 0) {
    const names = affordable
      .slice(0, 3)
      .map((plot) => PLOTS[plot]!.short)
      .join(", ");
    const more = affordable.length > 3 ? ` +${affordable.length - 3}` : "";
    return { playable: true, line: `Open: ${names}${more}` };
  }
  if (open.length > 0) {
    const need = Math.min(...open.map((plot) => playCost(state, seat, uid, plot)));
    return { playable: false, line: `Needs ${need} warmth` };
  }
  if (face.kind === "place") return { playable: false, line: face.terrain === "any" ? "No open ground" : `Wants ${face.terrain}` };
  if (face.kind === "person") return { playable: false, line: "Needs a place or kin" };
  if (face.kind === "tool") return { playable: false, line: "Needs a fitting neighbor" };
  if (face.kind === "institution") return { playable: false, line: "Needs a town" };
  return { playable: false, line: "Not this winter" };
}

function stepped(replay: ReplayRecord, count: number): GameState {
  let state = createMatch({
    seed: replay.seed,
    decks: replay.decks,
    names: replay.names,
    era1First: replay.era1First,
    stacked: replay.stacked,
    config: {
      turnsPerEra: replay.turnsPerEra,
      freeKeeps: replay.freeKeeps,
      coach: replay.coach,
    },
  });
  for (let i = 0; i < count; i++) state = applyAction(state, replay.actions[i]!);
  return state;
}
