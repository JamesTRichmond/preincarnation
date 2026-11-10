import { useEffect, useMemo, useRef, useState } from "react";
import { createFixtureBindings } from "../logic/bindings.ts";
import { journeyBeatsMet, journeyById, journeys, type Journey } from "../logic/journeys.ts";
import type { Action } from "../logic/session.ts";
import { useInterface } from "../ui/useInterface.ts";
import { InterfaceView } from "../ui/InterfaceView.tsx";
import "../ui/interface.css";

export function Showcase() {
  const bindings = useMemo(() => createFixtureBindings({ delayMs: 520 }), []);
  const opening = journeys()[0]!;
  const { state, dispatch } = useInterface(bindings, opening.start);
  const [journeyId, setJourneyId] = useState<Journey["id"]>(opening.id);
  const [latched, setLatched] = useState<string[]>([]);
  const [walking, setWalking] = useState(false);
  const [walkToken, setWalkToken] = useState(0);
  const step = useRef(0);
  const actions = useRef<Action[]>(opening.actions);
  const journey = journeyById(journeyId);

  useEffect(() => {
    setLatched((current) => {
      const next = new Set(current);
      for (const beat of journey.beats) {
        if (beat.done(state)) next.add(beat.id);
      }
      if (next.size === current.length) return current;
      return [...next];
    });
  }, [journey, state]);

  useEffect(() => {
    if (!walking) return;
    if (state.pending || state.pendingCreate) return;
    const action = actions.current[step.current];
    if (!action) {
      setWalking(false);
      return;
    }
    const timer = setTimeout(() => {
      step.current += 1;
      dispatch(action);
      setWalkToken((value) => value + 1);
    }, state.settings.reduceMotion ? 40 : 380);
    return () => clearTimeout(timer);
  }, [dispatch, state.pending, state.pendingCreate, state.settings.reduceMotion, walkToken, walking]);

  const choose = (id: Journey["id"]) => {
    const next = journeyById(id);
    bindings.replaceSlots(next.start.slots);
    dispatch({ type: "hydrate", state: next.start });
    actions.current = next.actions;
    step.current = 0;
    setJourneyId(id);
    setLatched([]);
    setWalking(false);
  };

  const walk = () => {
    const next = journeyById(journeyId);
    bindings.replaceSlots(next.start.slots);
    dispatch({ type: "hydrate", state: next.start });
    actions.current = next.actions;
    step.current = 0;
    setLatched([]);
    setWalking(true);
    setWalkToken((value) => value + 1);
  };

  const proved = useMemo(() => journeyBeatsMet(journey).ok, [journey]);
  const nextBeat = journey.beats.find((beat) => !latched.includes(beat.id));

  return (
    <div className="pi-showcase" data-motion={state.settings.reduceMotion ? "reduce" : "full"}>
      <header className="pi-rail">
        <div className="pi-brand">
          Preincarnation
          <span>Ashwick County</span>
        </div>
        {journeys().map((item) => (
          <button
            key={item.id}
            type="button"
            className="pi-journey"
            data-on={item.id === journeyId ? "true" : "false"}
            onClick={() => choose(item.id)}
          >
            {item.title}
          </button>
        ))}
        <button type="button" className="pi-walk" onClick={walk} disabled={walking}>
          {walking ? "Walking…" : "Walk this journey"}
        </button>
      </header>
      <div className="pi-body">
        <aside className="pi-beats">
          <h2>{journey.title}</h2>
          <p>{journey.summary}</p>
          <ol>
            {journey.beats.map((beat) => (
              <li key={beat.id} data-done={latched.includes(beat.id) ? "true" : "false"}>
                {beat.prompt}
              </li>
            ))}
          </ol>
          <p>{nextBeat ? nextBeat.prompt : proved ? "Journey complete." : "Journey complete on this page."}</p>
        </aside>
        <div className="pi-stage">
          <InterfaceView state={state} dispatch={dispatch} renderField={bindings.renderField} />
        </div>
      </div>
    </div>
  );
}
