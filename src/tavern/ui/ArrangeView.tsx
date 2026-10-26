import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  HOMES,
  SLOT_COUNT,
  compositionChart,
  emptySlots,
  freeNotes,
  newComposition,
  paintSlot,
  quantizeSlot,
} from "../arrangement.ts";
import type { TavernEngine } from "../engine.ts";
import { createPerf, pullAutos } from "../performance.ts";
import type { VoiceNote } from "../performance.ts";
import { stepSeconds } from "../chart.ts";
import type { Composition, Slot } from "../storage.ts";
import type { Gesture, InstrumentId } from "../types.ts";
import { GESTURES } from "../voices.ts";

export function ArrangeView({
  engine,
  instrument,
  tunes,
  onSave,
  onDelete,
  onBack,
}: {
  engine: TavernEngine;
  instrument: InstrumentId;
  tunes: Composition[];
  onSave: (tune: Composition) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [slots, setSlots] = useState<Slot[]>(emptySlots());
  const [home, setHome] = useState(62);
  const [bpm, setBpm] = useState(96);
  const [title, setTitle] = useState("A tune for the room");
  const [selected, setSelected] = useState(0);
  const [looping, setLooping] = useState(false);
  const [armed, setArmed] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const originRef = useRef(0);
  const loopRef = useRef({ slots, home, bpm, instrument, looping });
  loopRef.current = { slots, home, bpm, instrument, looping };

  useEffect(() => {
    if (!looping) return;
    let stop = false;
    let raf = 0;
    const begin = () => {
      const draft = compositionChart(
        newComposition({
          id: "live-loop",
          title: "loop",
          instrument: loopRef.current.instrument,
          home: loopRef.current.home,
          bpm: loopRef.current.bpm,
          slots: loopRef.current.slots,
        }),
      );
      const origin = engine.now() + 0.08;
      originRef.current = origin;
      return { draft, perf: createPerf(draft, origin, 0.2, 0), origin };
    };
    let state = begin();
    const tick = () => {
      if (stop) return;
      if (!loopRef.current.looping || engine.holding) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const clock = engine.now();
      const pulled = pullAutos(state.perf, state.draft, clock, 0.35);
      state = { ...state, perf: pulled.perf };
      for (const note of pulled.notes) {
        engine.play(note, loopRef.current.instrument, state.draft.tonic);
      }
      const step = stepSeconds(state.draft.bpm);
      if (clock > state.origin + state.draft.totalSteps * step) state = begin();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
    };
  }, [engine, looping]);

  function playGesture(gesture: Gesture) {
    const motif = freeNotes(gesture, home, instrument).motif;
    const step = 60 / bpm;
    const now = engine.now();
    motif.forEach((note) => {
      const voice: VoiceNote = {
        at: now + note.step * step,
        midi: note.midi,
        durSec: Math.max(0.05, note.dur * step),
        velocity: note.velocity,
        instrument: "player",
        detuneCents: 0,
      };
      engine.play(voice, instrument, home);
    });
    if (armed && looping) {
      const slot = quantizeSlot(now, originRef.current || now, step);
      setSlots((current) => paintSlot(current, slot, gesture));
      setSelected(slot);
      return;
    }
    setSlots((current) => paintSlot(current, selected, gesture));
    setSelected((index) => (index + 1) % SLOT_COUNT);
  }

  return (
    <div className="ferry-wrap">
      <div className="topbar">
        <button type="button" className="icon-btn" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Room
        </button>
        <button type="button" className="ferry-btn primary" data-testid="save-tune" onClick={() => onSave(newComposition({ title, instrument, home, bpm, slots }))}>
          Keep this tune
        </button>
      </div>
      <p className="ferry-kicker">Lay a tune</p>
      <h1>The table</h1>
      <p className="ferry-lede">
        Eight places. Paint a gesture into each, or just play. Nothing here is graded.
      </p>
      <div className="ferry-block">
        <p className="ferry-label">Home</p>
        <div className="homes">
          {HOMES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={home === item.tonic ? "home-btn is-on" : "home-btn"}
              onClick={() => setHome(item.tonic)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
      <div className="slots" data-testid="slots">
        {slots.map((slot, index) => (
          <button
            key={index}
            type="button"
            className={selected === index ? "slot is-on" : "slot"}
            onClick={() => setSelected(index)}
          >
            {slot ? GESTURES.find((g) => g.id === slot.gesture)?.label : "Open"}
          </button>
        ))}
      </div>
      <label className="ferry-label" htmlFor="tune-name">Name</label>
      <input id="tune-name" className="field" value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} />
      <div className="row-actions">
        <button type="button" className="ferry-btn" onClick={() => setLooping((v) => !v)} data-testid="loop-toggle">
          {looping ? "Stop the loop" : "Hear the loop"}
        </button>
        <button type="button" className="ferry-btn quiet" onClick={() => setArmed((v) => !v)}>
          {armed ? "Recording into the loop" : "Record into the loop"}
        </button>
        <button type="button" className="ferry-btn quiet" onClick={() => setSlots(emptySlots())}>
          Clear
        </button>
      </div>
      <div className="pads">
        {GESTURES.map((gesture) => (
          <button key={gesture.id} type="button" className="pad" onPointerDown={(event) => { event.preventDefault(); playGesture(gesture.id); }}>
            <b>{gesture.label}</b>
            <small>Free</small>
          </button>
        ))}
      </div>
      <div className="ferry-block">
        <p className="ferry-label">Kept at the hearth</p>
        {tunes.length === 0 ? <p className="ferry-lede">Nothing kept yet.</p> : null}
        {tunes.map((tune) => (
          <div key={tune.id} className="keep">
            <button
              type="button"
              className="ferry-btn quiet"
              onClick={() => {
                setSlots(tune.slots);
                setHome(tune.home);
                setBpm(tune.bpm);
                setTitle(tune.title);
                setLooping(true);
              }}
            >
              {tune.title}
            </button>
            {pendingDelete === tune.id ? (
              <button type="button" className="ferry-btn" onClick={() => { onDelete(tune.id); setPendingDelete(null); }}>
                Yes, remove
              </button>
            ) : (
              <button type="button" className="ferry-btn quiet" onClick={() => setPendingDelete(tune.id)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
