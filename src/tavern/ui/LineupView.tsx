import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { TavernEngine } from "../engine.ts";
import { browserLatencyNote, calibrationCopy, measureOffset } from "../latency.ts";
import type { CalibrationSample } from "../latency.ts";

export function LineupView({
  engine,
  offsetMs,
  windowMs,
  stale,
  onOffset,
  onWindow,
  onBack,
}: {
  engine: TavernEngine;
  offsetMs: number;
  windowMs: number | null;
  stale: boolean;
  onOffset: (offsetMs: number) => void;
  onWindow: (windowMs: number | null) => void;
  onBack: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [copy, setCopy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const knocks = useRef<number[]>([]);
  const samples = useRef<CalibrationSample[]>([]);
  const bead = useRef<HTMLDivElement | null>(null);
  const lane = useRef<HTMLDivElement | null>(null);
  const onOffsetRef = useRef(onOffset);
  const offsetRef = useRef(offsetMs);
  onOffsetRef.current = onOffset;
  offsetRef.current = offsetMs;

  useEffect(() => {
    const reported = engine.reportedLatency();
    setNote(browserLatencyNote(reported.base, reported.output));
  }, [engine]);

  useEffect(() => {
    if (!running) return;
    let next = 0;
    let raf = 0;
    let stopped = false;
    const finish = () => {
      if (stopped) return;
      stopped = true;
      const result = measureOffset(samples.current);
      setCopy(calibrationCopy(result));
      if (result.offsetMs != null) onOffsetRef.current(result.offsetMs);
      setRunning(false);
    };
    const tick = () => {
      if (stopped) return;
      const now = engine.now();
      while (next < knocks.current.length && knocks.current[next]! <= now + 0.1) {
        engine.play(
          {
            at: knocks.current[next]!,
            midi: -1,
            durSec: 0.07,
            velocity: 0.75,
            instrument: "spoons",
            detuneCents: 0,
          },
          "spoons",
          62,
        );
        next += 1;
      }
      const upcoming = knocks.current.find((k) => k + offsetRef.current / 1000 >= now - 0.05) ?? knocks.current.at(-1);
      const box = lane.current;
      const mark = bead.current;
      if (box && mark && upcoming != null) {
        const nowX = 54;
        const px = (box.clientWidth - nowX - 12) / 2.4;
        const x = nowX + (upcoming + offsetRef.current / 1000 - now) * px;
        mark.style.transform = `translate3d(${x}px, 0, 0)`;
        box.classList.toggle("is-now", Math.abs(upcoming + offsetRef.current / 1000 - now) < 0.09);
      }
      const last = knocks.current[knocks.current.length - 1] ?? now;
      if (now > last + 1.3) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [engine, running]);

  function start() {
    const origin = engine.now() + 0.7;
    knocks.current = Array.from({ length: 8 }, (_, i) => origin + i * 1.35);
    samples.current = [];
    setCopy(null);
    setRunning(true);
  }

  function tap() {
    if (!running || knocks.current.length === 0) return;
    const now = engine.now();
    let knock = knocks.current[0]!;
    for (const candidate of knocks.current) {
      if (Math.abs(candidate - now) < Math.abs(knock - now)) knock = candidate;
    }
    samples.current.push({ knockMs: knock * 1000, tapMs: now * 1000 });
  }

  const shownWindow = windowMs ?? 260;

  return (
    <div className="ferry-wrap">
      <div className="topbar">
        <button type="button" className="icon-btn" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Room
        </button>
      </div>
      <p className="ferry-kicker">Line up the beat</p>
      <h1>When you hear the knock</h1>
      <p className="ferry-lede">
        Tap the hearth when the knock arrives. If the sound is off, tap when the bead meets the line. That line is the timing cue either way.
      </p>
      {stale ? (
        <div className="banner" data-testid="stale-lineup">
          The sound path changed. The old lineup may be off. You can keep playing, and line up again when you want.
        </div>
      ) : null}
      <div className="lane" ref={lane} aria-hidden="true">
        <div className="now-line" />
        <div className="now-flag">Now</div>
        <div className="bead count" ref={bead}>Knock</div>
      </div>
      <div className="row-actions">
        <button type="button" className="ferry-btn primary" onClick={start} data-testid="start-lineup">
          {running ? "Listen" : "Start the knocks"}
        </button>
        <button type="button" className="ferry-btn" onPointerDown={(event) => { event.preventDefault(); tap(); }} data-testid="lineup-tap">
          Tap the hearth
        </button>
      </div>
      {copy ? <p data-testid="lineup-copy">{copy}</p> : null}
      {note ? <p className="ferry-lede">{note}</p> : null}
      <div className="ferry-block">
        <p className="ferry-label">Nudge, if the sound still feels early or late</p>
        <input
          className="range"
          type="range"
          min={-200}
          max={200}
          step={5}
          value={Math.round(offsetMs)}
          aria-label="Shift the beat"
          onChange={(event) => onOffset(Number(event.target.value))}
        />
        <p className="ferry-lede">Shift: {Math.round(offsetMs)} ms. Negative means your tap was early.</p>
      </div>
      <div className="ferry-block">
        <p className="ferry-label">How wide a breath still counts</p>
        <input
          className="range"
          type="range"
          min={60}
          max={360}
          step={10}
          value={shownWindow}
          aria-label="Timing window"
          data-testid="window-slider"
          onChange={(event) => onWindow(Number(event.target.value))}
        />
        <p className="ferry-lede">{shownWindow} ms either side of the line. A wider breath is easier. It never ends the tune.</p>
        <button type="button" className="ferry-btn quiet" onClick={() => onWindow(null)}>
          Use the room's own breath
        </button>
      </div>
    </div>
  );
}
