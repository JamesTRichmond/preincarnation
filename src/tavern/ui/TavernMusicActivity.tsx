import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import "./tavern.css";
import { compileChart } from "../chart.ts";
import { TavernEngine } from "../engine.ts";
import { PIECES, TAVERN_SET_PLAN, pieceById } from "../pieces.ts";
import { INSTRUMENTS } from "../voices.ts";
import {
  DEFAULT_SETTINGS,
  SAVE_VERSION,
  browserKv,
  loadSave,
  writeSave,
} from "../storage.ts";
import type { Composition, Settings } from "../storage.ts";
import type { HostAudioBridge, PlayMode, Variant } from "../types.ts";
import { ArrangeView } from "./ArrangeView.tsx";
import { LineupView } from "./LineupView.tsx";
import { PlayView } from "./PlayView.tsx";

type Screen = "gate" | "room" | "play" | "arrange" | "lineup";

type Sitting = { id: string; mode: PlayMode };

const COMPANY = [
  { name: "Cal Varrow", line: "Fiddle, the chair by the fire", src: "/hearth/cal.jpg" },
  { name: "Mira Pell", line: "Guitar, the middle chair", src: "/hearth/mira.jpg" },
  { name: "June Otis", line: "Spoons, by the window", src: "/hearth/june.jpg" },
] as const;

export function TavernMusicActivity({ onFocus, onRelease, onStand }: HostAudioBridge = {}) {
  const [screen, setScreen] = useState<Screen>("gate");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tunes, setTunes] = useState<Composition[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [engine, setEngine] = useState<TavernEngine | null>(null);
  const [variant, setVariant] = useState<Variant>("relaxed");
  const [sitting, setSitting] = useState<Sitting | null>(null);
  const [queue, setQueue] = useState<Sitting[] | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const onFocusRef = useRef(onFocus);
  const onReleaseRef = useRef(onRelease);
  const settingsRef = useRef(settings);
  const tunesRef = useRef(tunes);
  const hydratedRef = useRef(false);
  const engineRef = useRef<TavernEngine | null>(null);
  onFocusRef.current = onFocus;
  onReleaseRef.current = onRelease;
  settingsRef.current = settings;
  tunesRef.current = tunes;
  engineRef.current = engine;

  useEffect(() => {
    const kv = browserKv();
    if (kv) {
      const report = loadSave(kv);
      setSettings(report.save.settings);
      setTunes(report.save.compositions);
      if (report.warning) setWarning(report.warning);
    }
    setHydrated(true);
    hydratedRef.current = true;
    return () => {
      engineRef.current?.release();
      onReleaseRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const kv = browserKv();
    if (!kv) return;
    const report = writeSave(kv, { version: SAVE_VERSION, settings, compositions: tunes });
    if (!report.ok && report.warning) setWarning(report.warning);
  }, [hydrated, settings, tunes]);

  useEffect(() => {
    engine?.setMuted(settings.muted);
  }, [engine, settings.muted]);

  useEffect(() => {
    if (!engine) return;
    return engine.watchDevices(() => {
      setSettings((current) => ({ ...current, calibrationStale: true }));
      setWarning("The sound path changed. The old lineup may be off. You can keep playing.");
    });
  }, [engine]);

  useEffect(() => {
    const onVis = () => {
      const hidden = document.visibilityState === "hidden";
      engineRef.current?.onVisibility(hidden);
      if (!hidden || !hydratedRef.current) return;
      const kv = browserKv();
      if (!kv) return;
      writeSave(kv, {
        version: SAVE_VERSION,
        settings: settingsRef.current,
        compositions: tunesRef.current,
      });
    };
    const onPageHide = () => {
      engineRef.current?.onVisibility(true);
      if (!hydratedRef.current) return;
      const kv = browserKv();
      if (!kv) return;
      writeSave(kv, {
        version: SAVE_VERSION,
        settings: settingsRef.current,
        compositions: tunesRef.current,
      });
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  const active: Sitting | null = queue ? queue[queueIndex] ?? null : sitting;
  const piece = active ? pieceById(active.id) ?? null : null;
  const chart = useMemo(
    () => (piece && active ? compileChart(piece, { mode: active.mode, variant }) : null),
    [piece, active, variant],
  );

  function sit() {
    const next = engine ?? new TavernEngine();
    next.unlock();
    setEngine(next);
    onFocusRef.current?.();
    setScreen("room");
  }

  function openPiece(id: string, mode: PlayMode) {
    setQueue(null);
    setSitting({ id, mode });
    setScreen("play");
  }

  function openSet() {
    const plan = TAVERN_SET_PLAN.map((item) => ({ id: item.id, mode: item.mode }));
    setQueue(plan);
    setQueueIndex(0);
    setSitting(null);
    setScreen("play");
  }

  const identity = INSTRUMENTS.find((item) => item.id === settings.instrument) ?? INSTRUMENTS[0];
  const nextLabel =
    queue && queueIndex < queue.length - 1 ? "The next tune" : null;

  return (
    <div className={screen === "gate" ? "ferry" : "ferry is-in"}>
      {screen !== "gate" ? (
        <div className={screen === "room" ? "ferry-wrap room-wrap" : "ferry-wrap"} style={{ paddingBottom: 0 }}>
          <div className="topbar">
            <p className="ferry-kicker" style={{ margin: 0 }}>Ferry Hearth</p>
            <div className="ferry-actions" style={{ marginTop: 0 }}>
              {onStand ? (
                <button type="button" className="icon-btn" onClick={onStand}>
                  Stand up
                </button>
              ) : null}
              <button
              type="button"
              className="icon-btn"
              data-testid="mute"
              aria-pressed={settings.muted}
              onClick={() => setSettings((current) => ({ ...current, muted: !current.muted }))}
            >
              {settings.muted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
              {settings.muted ? "Sound off" : "Sound on"}
            </button>
            </div>
          </div>
          {warning ? <div className="banner">{warning}</div> : null}
        </div>
      ) : null}

      {screen === "gate" ? (
        <section className="gate">
          <img
            className="gate-paint"
            src="/hearth/room.jpg"
            alt=""
            width={1600}
            height={900}
          />
          <div className="gate-fire" aria-hidden="true" />
          <div className="gate-scrim" />
          <div className="gate-copy">
            <p className="ferry-kicker">Addison County · the landing road</p>
            <h1 className="ferry-title">The Ferry Hearth</h1>
            <p className="ferry-lede">
              Three chairs are already out. The tunes keep going if you miss a step.
              Sound stays quiet until you sit.
            </p>
            <div className="ferry-actions">
              <button type="button" className="ferry-btn primary" data-testid="sit-down" onClick={sit}>
                Sit down by the fire
              </button>
              {onStand ? (
                <button type="button" className="ferry-btn" onClick={onStand}>
                  Stand up
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {screen === "room" ? (
        <div className="ferry-wrap room-wrap">
          <figure className="stage">
            <img
              className="paint"
              src="/hearth/room.jpg"
              alt="Three empty chairs by the fire, snow on the creek outside the window."
              width={1600}
              height={900}
            />
            <div className="stage-fire" aria-hidden="true" />
            <figcaption className="company">
              {COMPANY.map((person) => (
                <div key={person.name} className="person">
                  <img src={person.src} alt="" width={720} height={1080} />
                  <span>
                    <b>{person.name}</b>
                    <em>{person.line}</em>
                  </span>
                </div>
              ))}
            </figcaption>
          </figure>

          <div className="room-split">
            <div>
              <p className="ferry-label">Your hands</p>
              <div className="ferry-choices">
                {INSTRUMENTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={settings.instrument === item.id ? "choice is-on" : "choice"}
                    data-testid={`instrument-${item.id}`}
                    onClick={() => setSettings((current) => ({ ...current, instrument: item.id }))}
                  >
                    <strong>{item.name}</strong>
                    <em>{item.tool}. {item.line}</em>
                  </button>
                ))}
              </div>
              <p className="yield-line">{identity.yield}</p>
            </div>

            <div className="set-card">
              <p className="ferry-label">On the stand tonight</p>
              <p className="ferry-lede">Welcome, then answer Mira, then sit the third chair with June.</p>
              <ol className="set-list">
                {TAVERN_SET_PLAN.map((item, index) => {
                  const tune = pieceById(item.id);
                  if (!tune) return null;
                  return (
                    <li key={item.id}>
                      <button type="button" className="tune" data-testid={`piece-${tune.id}`} onClick={() => openPiece(tune.id, item.mode)}>
                        <span className="num">{index + 1}</span>
                        <strong>{tune.title}</strong>
                        <small>{tune.blurb}</small>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <button type="button" className="ferry-btn primary" data-testid="play-set" onClick={openSet}>
                Play the sitting
              </button>
            </div>
          </div>

          <div className="ferry-block">
            <p className="ferry-label">The book</p>
            <div className="book">
              {PIECES.map((tune) => (
                <div key={tune.id} className="tune-line">
                  <button type="button" className="tune" onClick={() => openPiece(tune.id, "practice")}>
                    <span className="num">{String(PIECES.indexOf(tune) + 1).padStart(2, "0")}</span>
                    <strong>{tune.title}</strong>
                    <small>{tune.featured ? "On the stand · " : ""}{tune.place}</small>
                  </button>
                  <button type="button" className="ferry-btn quiet answer" onClick={() => openPiece(tune.id, "duet")}>
                    Answer {tune.npc.name.split(" ")[0]}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="row-actions">
            <button type="button" className="ferry-btn" data-testid="open-arrange" onClick={() => setScreen("arrange")}>
              Lay a tune
            </button>
            <button type="button" className="ferry-btn" data-testid="open-lineup" onClick={() => setScreen("lineup")}>
              Line up the beat
            </button>
          </div>
        </div>
      ) : null}

      {screen === "play" && chart && engine ? (
        <PlayView
          chart={chart}
          piece={piece}
          engine={engine}
          instrument={settings.instrument}
          variant={variant}
          mode={active?.mode ?? "practice"}
          windowMs={settings.windowMs}
          offsetMs={settings.offsetMs}
          showTip={!settings.seenTip}
          onDismissTip={() => setSettings((current) => ({ ...current, seenTip: true }))}
          onExit={() => setScreen("room")}
          onVariant={setVariant}
          nextLabel={nextLabel}
          onNext={() => setQueueIndex((index) => index + 1)}
        />
      ) : null}

      {screen === "arrange" && engine ? (
        <ArrangeView
          engine={engine}
          instrument={settings.instrument}
          tunes={tunes}
          onBack={() => setScreen("room")}
          onSave={(tune) => setTunes((current) => [tune, ...current].slice(0, 24))}
          onDelete={(id) => setTunes((current) => current.filter((tune) => tune.id !== id))}
        />
      ) : null}

      {screen === "lineup" && engine ? (
        <LineupView
          engine={engine}
          offsetMs={settings.offsetMs}
          windowMs={settings.windowMs}
          stale={settings.calibrationStale}
          onBack={() => setScreen("room")}
          onOffset={(offsetMs) =>
            setSettings((current) => ({ ...current, offsetMs, calibrationStale: false }))
          }
          onWindow={(windowMs) => setSettings((current) => ({ ...current, windowMs }))}
        />
      ) : null}
    </div>
  );
}
