import { useEffect, useRef, useState } from "react";
import type { Chart, Gesture, InstrumentId, Piece, PlayMode, Variant } from "../types.ts";
import { expireCues, finishIfComplete, press, pullAutos, release, settleHold, createPerf } from "../performance.ts";
import type { Perf } from "../performance.ts";
import { closeness, summaryCopy, variantWindowMs } from "../scoring.ts";
import { acceptGesture, createInputGate, gestureFromKey, shouldTakeKey } from "../input.ts";
import type { InputSource } from "../input.ts";
import { stepSeconds } from "../chart.ts";
import { gestureLabel, GESTURES } from "../voices.ts";
import type { TavernEngine } from "../engine.ts";
import { ArrowLeft, RotateCcw } from "lucide-react";

type Snap = {
  words: string;
  kicker: string;
  feedback: string;
  status: Perf["status"];
  grades: Perf["grades"];
  soon: Gesture | null;
  now: boolean;
};

const PORTRAITS: Record<string, string> = {
  "Mira Pell": "/hearth/mira.jpg",
  "Cal Varrow": "/hearth/cal.jpg",
  "June Otis": "/hearth/june.jpg",
};

const EMPTY: Snap = {
  words: "Listen.",
  kicker: "The room",
  feedback: "When the bead meets the line.",
  status: "playing",
  grades: [],
  soon: null,
  now: false,
};

export function PlayView({
  chart,
  piece,
  engine,
  instrument,
  variant,
  mode,
  windowMs,
  offsetMs,
  showTip,
  onDismissTip,
  onExit,
  onVariant,
  nextLabel,
  onNext,
}: {
  chart: Chart;
  piece: Piece | null;
  engine: TavernEngine;
  instrument: InstrumentId;
  variant: Variant;
  mode: PlayMode;
  windowMs: number | null;
  offsetMs: number;
  showTip: boolean;
  onDismissTip: () => void;
  onExit: () => void;
  onVariant: (variant: Variant) => void;
  nextLabel: string | null;
  onNext: () => void;
}) {
  const [run, setRun] = useState(0);
  const [snap, setSnap] = useState<Snap>(EMPTY);
  const [origin, setOrigin] = useState<number | null>(null);
  const perfRef = useRef<Perf | null>(null);
  const gateRef = useRef(createInputGate(90));
  const heldKeys = useRef(new Set<Gesture>());
  const settings = useRef({ windowSec: 0.26, offsetSec: 0, instrument });
  const laneRef = useRef<HTMLDivElement | null>(null);
  settings.current = {
    windowSec: (windowMs ?? variantWindowMs(variant)) / 1000,
    offsetSec: offsetMs / 1000,
    instrument,
  };

  useEffect(() => {
    const stepSec = stepSeconds(chart.bpm);
    const o = engine.now() + chart.countIn * stepSec + 0.18;
    const perf = createPerf(chart, o, settings.current.windowSec, settings.current.offsetSec);
    perfRef.current = perf;
    gateRef.current = createInputGate(90);
    setOrigin(o);
    setSnap(EMPTY);
    let raf = 0;
    let lastKey = "";

    const describe = (perfNow: Perf, clock: number): Snap => {
      const offset = settings.current.offsetSec;
      const items: { at: number; words: string; kicker: string; gesture: Gesture | null }[] = [];
      for (const cue of perfNow.cues) {
        if (cue.resolved) continue;
        items.push({
          at: o + cue.step * stepSec,
          words: cue.words,
          kicker: gestureLabel(cue.gesture),
          gesture: cue.gesture,
        });
      }
      for (const mark of chart.companions) {
        const at = o + mark.step * stepSec;
        if (at < clock - 0.25) continue;
        items.push({
          at,
          words: mark.words,
          kicker: mark.name ? `Listen — ${mark.name}` : "Count",
          gesture: null,
        });
      }
      items.sort((a, b) => a.at - b.at);
      const focus = items.find((item) => item.at + offset >= clock - 0.08) ?? items[0];
      const soon =
        focus?.gesture && focus.at + offset - clock < 0.4 && focus.at + offset - clock > -0.05
          ? focus.gesture
          : null;
      const now = focus ? Math.abs(focus.at + offset - clock) < 0.09 : false;
      return {
        words: focus?.words ?? "The tune is finishing.",
        kicker: focus?.kicker ?? "The room",
        feedback: perfNow.feedback,
        status: perfNow.status,
        grades: perfNow.grades,
        soon,
        now,
      };
    };

    const layout = (clock: number, perfNow: Perf) => {
      const lane = laneRef.current;
      if (!lane) return;
      const width = lane.clientWidth;
      const nowX = 54;
      const px = (width - nowX - 12) / 3.1;
      const offset = settings.current.offsetSec;
      const resolved = new Set(perfNow.cues.filter((c) => c.resolved).map((c) => c.id));
      let near = false;
      for (const el of lane.querySelectorAll<HTMLElement>("[data-at]")) {
        const at = Number(el.dataset.at);
        const x = nowX + (at + offset - clock) * px;
        el.style.transform = `translate3d(${x}px, 0, 0)`;
        const id = el.dataset.id ?? "";
        el.classList.toggle("is-done", resolved.has(id));
        if (Math.abs(at + offset - clock) < 0.09) near = true;
      }
      lane.classList.toggle("is-now", near);
    };

    const tick = () => {
      const current = perfRef.current;
      if (!current || engine.holding) {
        raf = requestAnimationFrame(tick);
        return;
      }
      let perf = {
        ...current,
        windowSec: settings.current.windowSec,
        offsetSec: settings.current.offsetSec,
      };
      const clock = engine.now();
      const pulled = pullAutos(perf, chart, clock, 0.4);
      perf = settleHold(pulled.perf, chart, clock);
      const expired = expireCues(perf, chart, clock);
      perf = finishIfComplete(expired.perf, chart, clock);
      perfRef.current = perf;
      const inst = settings.current.instrument;
      for (const note of pulled.notes) engine.play(note, inst, chart.tonic);
      for (const note of expired.notes) engine.play(note, inst, chart.tonic);
      layout(clock, perf);
      const view = describe(perf, clock);
      const key = `${view.words}|${view.feedback}|${view.status}|${view.grades.length}|${view.soon}|${view.now}`;
      if (key !== lastKey) {
        lastKey = key;
        setSnap(view);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chart, engine, run]);

  function hit(gesture: Gesture, source: InputSource) {
    const gated = acceptGesture(gateRef.current, gesture, performance.now(), source);
    gateRef.current = gated.gate;
    if (!gated.accepted) return;
    const perf = perfRef.current;
    if (!perf) return;
    const result = press(
      { ...perf, windowSec: settings.current.windowSec, offsetSec: settings.current.offsetSec },
      chart,
      gesture,
      engine.now(),
    );
    perfRef.current = result.perf;
    for (const note of result.notes) engine.play(note, settings.current.instrument, chart.tonic);
    setSnap((prev) => ({
      ...prev,
      feedback: result.perf.feedback,
      grades: result.perf.grades,
      status: result.perf.status,
    }));
  }

  function liftHold() {
    const perf = perfRef.current;
    if (!perf?.hold) return;
    const next = release(perf, chart, engine.now());
    perfRef.current = next;
    setSnap((prev) => ({
      ...prev,
      feedback: next.feedback,
      grades: next.grades,
      status: next.status,
    }));
  }

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (!shouldTakeKey(event.repeat)) return;
      const gesture = gestureFromKey(event.key);
      if (!gesture) return;
      event.preventDefault();
      if (heldKeys.current.has(gesture)) return;
      heldKeys.current.add(gesture);
      hit(gesture, "key");
    };
    const up = (event: KeyboardEvent) => {
      const gesture = gestureFromKey(event.key);
      if (!gesture) return;
      heldKeys.current.delete(gesture);
      if (gesture === "hold") liftHold();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [chart, engine]);

  const stepSec = stepSeconds(chart.bpm);
  const summary = snap.status === "done" ? summaryCopy(snap.grades) : null;
  const withRoom = closeness(snap.grades);
  const portrait = piece ? PORTRAITS[piece.npc.name] : null;

  return (
    <div className="ferry-wrap play-wrap">
      <div className="topbar">
        <button type="button" className="icon-btn" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden="true" />
          Room
        </button>
        <button type="button" className="icon-btn" onClick={() => setRun((n) => n + 1)} data-testid="restart">
          <RotateCcw size={18} aria-hidden="true" />
          Again
        </button>
      </div>
      {piece && portrait ? (
        <div className="with-whom">
          <img src={portrait} alt="" width={720} height={1080} />
          <div>
            <p className="ferry-kicker">{mode === "duet" ? `With ${piece.npc.name}` : piece.npc.name}</p>
            <p>{piece.npc.manner}</p>
          </div>
        </div>
      ) : null}
      <p className="ferry-kicker">{piece?.pulse ?? "Your tune"} · {mode === "duet" ? "a duet" : "practice"} · {variant === "mastery" ? "tighter ear" : "relaxed"}</p>
      <h1>{chart.title}</h1>
      <p className="gesture-name">{snap.kicker}</p>
      <p className="words" data-testid="words">{snap.words}</p>
      <p className="feedback" data-testid="feedback" aria-live="polite">{snap.feedback}</p>
      {showTip ? (
        <div className="tip-line">
          <span>Ember is you. Pale is the room. Tap when a bead meets the line.</span>
          <button type="button" className="ferry-btn quiet" onClick={onDismissTip}>
            All right
          </button>
        </div>
      ) : null}
      <div className="lane" ref={laneRef} data-testid="lane" aria-hidden="true">
        <div className="rail them">Room</div>
        <div className="rail you">You</div>
        <div className="now-line" />
        <div className="now-flag">Now</div>
        {origin == null
          ? null
          : chart.cues.map((cue) => (
              <div
                key={cue.id}
                className="bead you"
                data-at={origin + cue.step * stepSec}
                data-id={cue.id}
              >
                {gestureLabel(cue.gesture)}
              </div>
            ))}
        {origin == null
          ? null
          : chart.companions.map((mark) => (
              <div
                key={mark.id}
                className={mark.name ? "bead them" : "bead count"}
                data-at={origin + mark.step * stepSec}
                data-id={mark.id}
              >
                {mark.name || mark.words}
              </div>
            ))}
      </div>
      <div className="breaths" aria-hidden="true">
        {snap.grades.map((grade, index) => (
          <span key={`${grade}-${index}`} className={`breath is-${grade}`} />
        ))}
      </div>
      <div className="pads">
        {GESTURES.map((gesture) => (
          <button
            key={gesture.id}
            type="button"
            className={snap.soon === gesture.id ? "pad is-soon" : "pad"}
            data-testid={`pad-${gesture.id}`}
            aria-keyshortcuts={gesture.keys}
            onPointerDown={(event) => {
              event.preventDefault();
              (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
              hit(gesture.id, "touch");
            }}
            onPointerUp={() => {
              if (gesture.id === "hold") liftHold();
            }}
            onPointerCancel={() => {
              if (gesture.id === "hold") liftHold();
            }}
          >
            <b>{gesture.label}</b>
            <small>{gesture.keys}</small>
          </button>
        ))}
      </div>
      <p className="ferry-lede">The brass line is the moment, with or without sound. A missed breath does not stop the tune.</p>
      {summary ? (
        <div className="summary" data-testid="summary">
          <h2>{summary.title}</h2>
          <p>{summary.body}</p>
          <p className="tally">With the room: {withRoom}. 100 means every breath landed together. Passed breaths lower it. They do not end the tune.</p>
          <div className="row-actions">
            <button type="button" className="ferry-btn primary" onClick={() => setRun((n) => n + 1)}>
              Play it again
            </button>
            {nextLabel ? (
              <button type="button" className="ferry-btn" onClick={onNext} data-testid="next-tune">
                {nextLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="ferry-btn quiet"
              onClick={() => onVariant(variant === "relaxed" ? "mastery" : "relaxed")}
            >
              {variant === "relaxed" ? "Try a tighter ear" : "Ease the breath"}
            </button>
          </div>
        </div>
      ) : (
        <div className="row-actions">
          <button type="button" className="ferry-btn quiet" onClick={() => onVariant(variant === "relaxed" ? "mastery" : "relaxed")}>
            {variant === "relaxed" ? "Tighter ear" : "Relaxed breath"}
          </button>
        </div>
      )}
    </div>
  );
}
