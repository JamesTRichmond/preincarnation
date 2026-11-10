import { useEffect, useRef, useState } from "react";
import "./input-lab.css";
import {
  Compass,
  Gamepad2,
  Keyboard,
  RotateCcw,
  Smartphone,
  Sword,
  Volume2,
  VolumeX,
} from "lucide-react";
import { initialArena, stepArena, type ArenaState } from "../src/arena.ts";
import { attachDomInput, gamepadApiPresent, readGamepads } from "../src/dom-adapter.ts";
import { InputEngine } from "../src/engine.ts";
import { bindingLabel, classifyPad } from "../src/prompts.ts";
import { RECOVERY_CODE } from "../src/timing.ts";
import type {
  ActionId,
  Binding,
  FrameInput,
  Intent,
  MovementPlane,
  PadSnap,
  PlacedControl,
  PromptDevice,
  StorageLike,
} from "../src/types.ts";
import { ACTIONS } from "../src/types.ts";

const ACTION_NAME: Record<ActionId, string> = {
  moveNorth: "North",
  moveSouth: "South",
  moveEast: "East",
  moveWest: "West",
  blade: "Blade",
  offhand: "Off-hand",
  interact: "Interact",
  pause: "Pause",
  shrineRelease: "Shrine release",
};

const TOUCH_MARK: Record<string, string> = {
  stick: "Move",
  blade: "Blade",
  offhand: "Tool",
  interact: "Offer",
  pause: "Pause",
  shrine: "Rite",
};

const CHIPS: Array<{ id: ActionId; name: string }> = [
  { id: "blade", name: "Blade" },
  { id: "offhand", name: "Tool" },
  { id: "interact", name: "Offer" },
  { id: "shrineRelease", name: "Rite" },
  { id: "pause", name: "Pause" },
];

const PHASE_WORD: Record<string, string> = {
  idle: "Idle",
  pending: "Choosing",
  spinning: "Spin",
  charging: "Holding",
  cancelled: "Let go",
  completed: "Released",
};

type Tuning = {
  deadzone: number;
  scale: number;
  opacity: number;
  handedness: "right" | "left";
  plane: MovementPlane;
};

declare global {
  interface Window {
    __inputBench?: {
      setKeys: (codes: string[]) => void;
      getMove: () => { x: number; y: number };
      getPosition: () => { x: number; y: number };
      getBladePhase: () => string;
      getShrineProgress: () => number;
    };
  }
}

type EmuState = { buttons: Set<number>; x: number; y: number };

function safeStorage(): StorageLike {
  try {
    const probe = "preincarnation.input.probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    const map = new Map<string, string>();
    return {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, value) => {
        map.set(key, value);
      },
    };
  }
}

function intentLabel(edge: Intent): string {
  switch (edge.type) {
    case "bladeTap":
      return "Blade tap";
    case "bladeSpin":
      return edge.phase === "start" ? "Spin start" : "Spin end";
    case "offhand":
      return `Off-hand ${edge.phase}`;
    case "interact":
      return "Interact";
    case "pause":
      return "Pause";
    case "shrineRelease":
      return "Shrine release";
    case "deviceLost":
      return `Pad ${edge.index} lost`;
    case "bindingsReset":
      return "Bindings reset";
    case "openSettings":
      return "Settings";
  }
}

function emuSnap(state: EmuState): PadSnap {
  return {
    index: 7,
    id: "Emulated Xbox Pad (XInput)",
    mapping: "standard",
    connected: true,
    buttons: Array.from({ length: 16 }, (_, index) => ({
      pressed: state.buttons.has(index),
      value: state.buttons.has(index) ? 1 : 0,
    })),
    axes: [state.x, state.y, 0, 0],
  };
}

function padFamily(frame: FrameInput): PromptDevice {
  if (frame.gamepad.nonstandard || frame.gamepad.mapping !== "standard") return "genericPad";
  return classifyPad(frame.gamepad.id);
}

function readTuning(engine: InputEngine): Tuning {
  const settings = engine.getSettings();
  return {
    deadzone: settings.deadzone,
    scale: settings.touch.scale,
    opacity: settings.touch.opacity,
    handedness: settings.touch.handedness,
    plane: settings.movementPlane,
  };
}

let toneCtx: AudioContext | null = null;

function tone(edge: Intent): void {
  const spec = toneSpec(edge);
  if (!spec) return;
  try {
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    toneCtx ??= new Ctx();
    if (toneCtx.state === "suspended") void toneCtx.resume();
    const now = toneCtx.currentTime;
    const osc = toneCtx.createOscillator();
    const gain = toneCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(spec.freq, now);
    if (spec.to) osc.frequency.exponentialRampToValueAtTime(spec.to, now + spec.dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(spec.gain, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.dur);
    osc.connect(gain);
    gain.connect(toneCtx.destination);
    osc.start(now);
    osc.stop(now + spec.dur + 0.02);
  } catch {
    /* Autoplay or a missing context should never block the bench. */
  }
}

function toneSpec(edge: Intent): { freq: number; to?: number; dur: number; gain: number } | null {
  switch (edge.type) {
    case "bladeTap":
      return { freq: 540, to: 320, dur: 0.07, gain: 0.04 };
    case "bladeSpin":
      return edge.phase === "start"
        ? { freq: 180, to: 240, dur: 0.12, gain: 0.035 }
        : { freq: 140, dur: 0.06, gain: 0.02 };
    case "shrineRelease":
      return { freq: 220, to: 440, dur: 0.22, gain: 0.05 };
    case "interact":
      return { freq: 660, dur: 0.05, gain: 0.03 };
    case "offhand":
      return edge.phase === "end" || edge.phase === "toggleOff"
        ? { freq: 240, dur: 0.05, gain: 0.02 }
        : { freq: 390, dur: 0.06, gain: 0.03 };
    default:
      return null;
  }
}

export function InputLab() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<InputEngine | null>(null);
  const arenaRef = useRef<ArenaState>(initialArena());
  const frameRef = useRef<FrameInput | null>(null);
  const emuRef = useRef<EmuState | null>(null);
  const spiritRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const soundRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState<FrameInput | null>(null);
  const [arena, setArena] = useState<ArenaState>(initialArena());
  const [rects, setRects] = useState<PlacedControl[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [emuOn, setEmuOn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sound, setSound] = useState(true);
  const [tuning, setTuning] = useState<Tuning>({
    deadzone: 0.18,
    scale: 1,
    opacity: 0.92,
    handedness: "right",
    plane: "cardinal",
  });

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const engine = new InputEngine({
      storage: safeStorage(),
      gamepadApi: gamepadApiPresent(),
      initialDevice: window.matchMedia("(pointer: coarse)").matches ? "touch" : "keyboard",
    });
    engineRef.current = engine;
    setTuning(readTuning(engine));
    const detach = attachDomInput(engine, { surface });
    let raf = 0;
    let last = performance.now();
    let painted = 0;
    let trauma = 0;
    let face = 0;
    let toastTimer = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pending: string[] = [];
    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const pads = readGamepads();
      if (emuRef.current) pads.push(emuSnap(emuRef.current));
      engine.pollGamepads(pads);
      const next = engine.tick();
      frameRef.current = next;
      if (next.edges.some((edge) => edge.type === "openSettings")) setDrawer(true);
      if (next.edges.some((edge) => edge.type === "bindingsReset")) setTuning(readTuning(engine));
      for (const edge of next.edges) {
        pending.push(intentLabel(edge));
        if (edge.type === "bladeTap") trauma = Math.min(1, trauma + 0.42);
        else if (edge.type === "bladeSpin" && edge.phase === "start") trauma = Math.min(1, trauma + 0.26);
        else if (edge.type === "shrineRelease") trauma = Math.min(1, trauma + 0.7);
        if (soundRef.current) tone(edge);
        if (
          edge.type === "bladeTap" ||
          edge.type === "bladeSpin" ||
          edge.type === "shrineRelease" ||
          edge.type === "interact" ||
          edge.type === "offhand"
        ) {
          window.clearTimeout(toastTimer);
          setToast(intentLabel(edge));
          toastTimer = window.setTimeout(() => setToast(""), 720);
        }
      }
      trauma = Math.max(0, trauma - (dt / 1000) * 2.2);
      const world = worldRef.current;
      if (world) {
        const mag = reduce ? 0 : trauma * trauma;
        if (mag < 0.002) world.style.transform = "";
        else {
          const sx = Math.sin(now * 0.05) * 7 * mag;
          const sy = Math.cos(now * 0.063) * 4.5 * mag;
          world.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px)`;
        }
      }
      if (next.moveX !== 0 || next.moveY !== 0) {
        face = (Math.atan2(next.moveX, next.moveY) * 180) / Math.PI;
      }
      if (figureRef.current) figureRef.current.style.transform = `rotate(${face}deg)`;
      const moved = stepArena(arenaRef.current, next, dt);
      arenaRef.current = moved;
      const spirit = spiritRef.current;
      if (spirit) {
        spirit.style.left = `${moved.x}%`;
        spirit.style.top = `${moved.y}%`;
        spirit.dataset.moving = next.moveX !== 0 || next.moveY !== 0 ? "true" : "false";
      }
      if (ringRef.current) {
        const live = next.shrine.phase === "charging" || next.shrine.phase === "completed";
        ringRef.current.style.strokeDashoffset = `${(264 * (1 - next.shrine.progress)).toFixed(1)}`;
        ringRef.current.parentElement?.toggleAttribute("data-live", live);
      }
      if (now - painted > 32) {
        painted = now;
        setFrame(next);
        setArena({ ...moved });
        setRects(engine.touchRects());
        if (pending.length > 0) {
          const batch = pending.splice(0, pending.length);
          setLog((previous) => [...batch, ...previous].slice(0, 8));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    window.__inputBench = {
      setKeys: (codes) => engine.setHeldKeys(codes),
      getMove: () => ({
        x: frameRef.current?.moveX ?? 0,
        y: frameRef.current?.moveY ?? 0,
      }),
      getPosition: () => ({ x: arenaRef.current.x, y: arenaRef.current.y }),
      getBladePhase: () => frameRef.current?.bladePhase ?? "idle",
      getShrineProgress: () => frameRef.current?.shrine.progress ?? 0,
    };
    raf = requestAnimationFrame(loop);
    setReady(true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(toastTimer);
      detach();
      delete window.__inputBench;
      engineRef.current = null;
    };
  }, []);

  const engine = engineRef.current;
  const device = frame?.activeDevice ?? "keyboard";
  const shrinePct = Math.round((frame?.shrine.progress ?? 0) * 100);
  const charging = frame?.shrine.phase === "charging" || frame?.shrine.phase === "completed";
  const movePrompt = frame
    ? [frame.prompts.moveNorth, frame.prompts.moveWest, frame.prompts.moveSouth, frame.prompts.moveEast].join(" ")
    : "Arrows";

  const bind = (action: ActionId, slot: number) => {
    engineRef.current?.beginCapture(action, slot, false);
  };

  const holdEmu = (button: number, down: boolean) => {
    const current = emuRef.current ?? { buttons: new Set<number>(), x: 0, y: 0 };
    const buttons = new Set(current.buttons);
    if (down) buttons.add(button);
    else buttons.delete(button);
    emuRef.current = { ...current, buttons };
    setEmuOn(true);
  };

  const nudge = (x: number, y: number, down: boolean) => {
    const current = emuRef.current ?? { buttons: new Set<number>(), x: 0, y: 0 };
    emuRef.current = { ...current, x: down ? x : 0, y: down ? y : 0 };
    setEmuOn(true);
  };

  const applyTuning = (patch: Partial<Tuning>) => {
    setTuning((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="input-bench safe-pad flex h-dvh flex-col overflow-hidden bg-bg text-fg">
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <div>
          <p className="font-display text-2xl leading-none tracking-wide">Preincarnation</p>
          <p className="mt-1 text-sm text-muted">Lantern meadow. Four directions. The rite is a hold.</p>
        </div>
        <button
          type="button"
          className="h-11 rounded-md border border-line bg-surface px-4 text-sm lg:hidden"
          onClick={() => setDrawer((open) => !open)}
        >
          {drawer ? "Close" : "Bench"}
        </button>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-3">
        <div className="relative min-h-0 lg:col-span-2">
          <div
            ref={surfaceRef}
            className="field relative h-full touch-none select-none overflow-hidden"
            aria-label="Playfield"
          >
            <div ref={worldRef} className="world">
              <div className="horizon" />
              <div className="terrace" style={{ top: "46%" }} />
              <div className="terrace" style={{ top: "64%" }} />
              <div className={`stone ${arena.pulse > 0 ? "is-lit" : ""}`} style={{ left: "50%", top: "28%" }}>
                <svg className="rite-ring" viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="rite-track" cx="50" cy="50" r="42" />
                  <circle ref={ringRef} className="rite-arc" cx="50" cy="50" r="42" />
                </svg>
                <span className="stone-notch" />
                {arena.offer ? <p className="offer-read is-on">At the stone</p> : null}
                <p className={`rite-read stat ${charging ? "is-on" : ""}`}>{shrinePct}%</p>
              </div>
              <div ref={spiritRef} className="walker" style={{ left: "50%", top: "62%" }}>
                <span className="shadow-blob" />
                <span className={`lantern ${arena.lantern ? "is-on" : ""}`} />
                <span className={`spin-ring ${arena.spinning ? "is-on" : ""}`} />
                <div ref={figureRef} className="figure">
                  <span className={`blade-mark ${arena.slash > 0 ? "is-on" : ""}`} />
                  <span className="beak" />
                  <span className="hood" />
                  <span className="cloak" />
                </div>
                {toast ? (
                  <span key={toast} className="float-note">
                    {toast}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="pointer-events-none absolute left-3 top-3 flex max-w-[16rem] flex-wrap gap-1">
              <span className="hud-chip px-2 py-1 text-xs">Move {movePrompt}</span>
              {CHIPS.map((chip) => (
                <span key={chip.id} className="hud-chip px-2 py-1 text-xs">
                  {chip.name} {frame?.prompts[chip.id] ?? ""}
                </span>
              ))}
            </div>

            {rects.map((rect) => (
              <div
                key={rect.id}
                className={`touch-mark pointer-events-none absolute flex items-center justify-center ${editing ? "is-editing" : ""}`}
                data-id={rect.id}
                style={{
                  left: rect.x,
                  top: rect.y,
                  width: rect.w,
                  height: rect.h,
                  opacity: engine?.getTouchSettings().opacity ?? tuning.opacity,
                }}
              >
                {TOUCH_MARK[rect.id]}
              </div>
            ))}
          </div>

          {frame?.menuOpen ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/80 p-4">
              <div
                role="dialog"
                aria-labelledby="paused-title"
                className="w-full max-w-sm rounded-lg border border-line bg-surface p-5"
              >
                <h2 id="paused-title" className="font-display text-2xl">
                  Paused
                </h2>
                <p className="mt-2 text-sm leading-normal text-muted">
                  Combat intents are held. The next device you touch becomes the prompt.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="h-11 flex-1 rounded-md bg-accent px-4 text-sm text-bg"
                    onClick={() => engineRef.current?.setMenuOpen(false)}
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    className="h-11 flex-1 rounded-md border border-line px-4 text-sm"
                    onClick={() => {
                      setDrawer(true);
                      engineRef.current?.setMenuOpen(false);
                    }}
                  >
                    Bench
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside
          className={`bench overflow-y-auto border-line bg-surface lg:block lg:max-h-dvh lg:border-l ${
            drawer ? "is-open" : "hidden"
          }`}
        >
          <div className="flex flex-col gap-5 p-4">
            <section className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm text-muted">
                  {device === "touch" ? (
                    <Smartphone className="size-4" aria-hidden="true" />
                  ) : device === "keyboard" ? (
                    <Keyboard className="size-4" aria-hidden="true" />
                  ) : (
                    <Gamepad2 className="size-4" aria-hidden="true" />
                  )}
                  {ready ? device : "Binding"}
                </h2>
                <p className="mt-2 text-sm">
                  Pad {frame?.gamepad.support === "api-missing" ? "API missing" : frame?.gamepad.connection ?? "none"}
                  {frame?.gamepad.id ? ` · ${frame.gamepad.id}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-md border border-line"
                aria-pressed={sound}
                aria-label={sound ? "Mute ticks" : "Play ticks"}
                onClick={() => setSound((on) => !on)}
              >
                {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
            </section>

            <section className="flex items-center gap-4">
              <div className="compass" aria-hidden="true">
                <span className="compass-arm" data-dir="n" data-on={frame?.moveY === 1}>
                  N
                </span>
                <span className="compass-arm" data-dir="w" data-on={frame?.moveX === -1}>
                  W
                </span>
                <span className="compass-core">Read</span>
                <span className="compass-arm" data-dir="e" data-on={frame?.moveX === 1}>
                  E
                </span>
                <span className="compass-arm" data-dir="s" data-on={frame?.moveY === -1}>
                  S
                </span>
              </div>
              <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted">Blade</dt>
                  <dd>{PHASE_WORD[frame?.bladePhase ?? "idle"]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Rite</dt>
                  <dd className="stat">
                    {PHASE_WORD[frame?.shrine.phase ?? "idle"]} {shrinePct}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Tool</dt>
                  <dd>{frame?.offhandLatched || arena.lantern ? "Lit" : "Dark"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Place</dt>
                  <dd>{arena.offer ? "At the stone" : "Open meadow"}</dd>
                </div>
              </dl>
            </section>

            <section aria-live="polite">
              <h2 className="mb-2 text-sm text-muted">Intents</h2>
              {log.length === 0 ? (
                <p className="text-sm text-muted">No intents yet. Walk, then tap the blade.</p>
              ) : (
                <ol className="flex flex-col gap-1">
                  {log.map((line, index) => (
                    <li key={`${line}-${index}`} className={index === 0 ? "text-sm" : "text-sm text-muted"}>
                      {line}
                    </li>
                  ))}
                </ol>
              )}
              {frame?.warnings.includes("gamepad-nonstandard") ? (
                <p className="mt-2 text-xs text-muted">This pad is not a standard mapping. Glyphs may be wrong.</p>
              ) : null}
              {frame?.warnings.includes("gamepad-disconnected") ? (
                <p className="mt-2 text-xs text-muted">A pad disconnected. Prompts fell back.</p>
              ) : null}
            </section>

            {frame?.capture ? (
              <section className="rounded-md border border-accent p-3">
                <p className="text-sm">
                  Press a key for {ACTION_NAME[frame.capture.action]}. Esc cancels. {RECOVERY_CODE} stays reserved.
                </p>
                {frame.pendingConflict ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <p className="w-full text-sm text-muted">
                      That input belongs to {ACTION_NAME[frame.pendingConflict]}.
                    </p>
                    <button
                      type="button"
                      className="h-11 rounded-md bg-accent px-3 text-sm text-bg"
                      onClick={() => engineRef.current?.resolvePending("swap")}
                    >
                      Swap
                    </button>
                    <button
                      type="button"
                      className="h-11 rounded-md border border-line px-3 text-sm"
                      onClick={() => engineRef.current?.resolvePending("reject")}
                    >
                      Keep current
                    </button>
                  </div>
                ) : frame.pendingBinding ? (
                  <button
                    type="button"
                    className="mt-3 h-11 rounded-md border border-line px-3 text-sm"
                    onClick={() => engineRef.current?.cancelCapture()}
                  >
                    Cannot use that. Close
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mt-3 h-11 rounded-md border border-line px-3 text-sm"
                    onClick={() => engineRef.current?.cancelCapture()}
                  >
                    Cancel
                  </button>
                )}
              </section>
            ) : null}

            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm text-muted">
                <Sword className="size-4" aria-hidden="true" />
                Bindings
              </h2>
              <ul className="flex flex-col gap-2">
                {ACTIONS.map((action) => {
                  const keys = engine ? engine.getBindings()[action].filter((binding) => binding.kind === "key") : [];
                  return (
                    <li key={action} className="flex items-center justify-between gap-2">
                      <span className="text-sm">{ACTION_NAME[action]}</span>
                      <span className="flex flex-wrap justify-end gap-1">
                        {keys.map((binding, index) => (
                          <button
                            key={`${action}-${slotKey(binding, index)}`}
                            type="button"
                            className="keycap px-2 text-sm"
                            data-held={frame?.held[action] ? "true" : "false"}
                            onClick={() => {
                              const current = engineRef.current;
                              if (!current) return;
                              bind(action, keySlot(current, action, index));
                            }}
                          >
                            {bindingLabel(binding, "keyboard")}
                          </button>
                        ))}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                A lit key is held. Pad marks follow the connected name. Blade tap and spin never share a press.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <div>
                <p className="mb-2 text-sm">Directions</p>
                <div className="seg">
                  <button
                    type="button"
                    className="seg-btn"
                    data-on={tuning.plane === "cardinal"}
                    onClick={() => {
                      engineRef.current?.setMovementPlane("cardinal");
                      applyTuning({ plane: "cardinal" });
                    }}
                  >
                    Four-way
                  </button>
                  <button
                    type="button"
                    className="seg-btn"
                    data-on={tuning.plane === "eight"}
                    onClick={() => {
                      engineRef.current?.setMovementPlane("eight");
                      applyTuning({ plane: "eight" });
                    }}
                  >
                    Eight-way
                  </button>
                </div>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">
                Off-hand
                <select
                  className="h-11 rounded-md border border-line bg-bg px-2"
                  value={frame?.offhandMode ?? "hold"}
                  onChange={(event) => {
                    const mode = event.target.value === "toggle" ? "toggle" : "hold";
                    engineRef.current?.setOffhandMode(mode);
                  }}
                >
                  <option value="hold">Hold</option>
                  <option value="toggle">Toggle</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Deadzone <span className="stat text-muted">{tuning.deadzone.toFixed(2)}</span>
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={tuning.deadzone}
                  aria-label="Stick deadzone"
                  onChange={(event) => {
                    const deadzone = Number(event.target.value);
                    engineRef.current?.setDeadzone(deadzone);
                    applyTuning({ deadzone });
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Touch scale <span className="stat text-muted">{tuning.scale.toFixed(2)}</span>
                </span>
                <input
                  type="range"
                  min={0.75}
                  max={1.45}
                  step={0.05}
                  value={tuning.scale}
                  aria-label="Touch scale"
                  onChange={(event) => {
                    const scale = Number(event.target.value);
                    engineRef.current?.setTouchScale(scale);
                    applyTuning({ scale });
                  }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Touch opacity <span className="stat text-muted">{tuning.opacity.toFixed(2)}</span>
                </span>
                <input
                  type="range"
                  min={0.4}
                  max={1}
                  step={0.05}
                  value={tuning.opacity}
                  aria-label="Touch opacity"
                  onChange={(event) => {
                    const opacity = Number(event.target.value);
                    engineRef.current?.setTouchOpacity(opacity);
                    applyTuning({ opacity });
                  }}
                />
              </label>
              <div className="seg">
                <button
                  type="button"
                  className="seg-btn"
                  data-on={tuning.handedness === "right"}
                  onClick={() => {
                    engineRef.current?.setHandedness("right");
                    applyTuning({ handedness: "right" });
                  }}
                >
                  Right hand
                </button>
                <button
                  type="button"
                  className="seg-btn"
                  data-on={tuning.handedness === "left"}
                  onClick={() => {
                    engineRef.current?.setHandedness("left");
                    applyTuning({ handedness: "left" });
                  }}
                >
                  Left hand
                </button>
              </div>
              <button
                type="button"
                className="h-11 rounded-md border border-line text-sm"
                onClick={() => {
                  const next = !editing;
                  setEditing(next);
                  engineRef.current?.setLayoutEditing(next);
                }}
              >
                {editing ? "Done moving controls" : "Move touch controls"}
              </button>
              {editing ? (
                <p className="text-xs text-muted">Drag a mark on the meadow. Done locks that layout.</p>
              ) : null}
            </section>

            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm text-muted">
                <Gamepad2 className="size-4" aria-hidden="true" />
                Emulated pad
              </h2>
              <p className="mb-2 text-xs leading-relaxed text-muted">
                Software pad only. Glyphs come from the emulated name, not from a detected device.
              </p>
              <button
                type="button"
                className="mb-2 h-11 rounded-md border border-line px-3 text-sm"
                onClick={() => {
                  const next = !emuOn;
                  setEmuOn(next);
                  emuRef.current = next ? { buttons: new Set(), x: 0, y: 0 } : null;
                }}
              >
                {emuOn ? "Disable emulated pad" : "Enable emulated pad"}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <EmuButton label="U" onHold={(down) => nudge(0, -0.9, down)} />
                  <span />
                  <EmuButton label="L" onHold={(down) => nudge(-0.9, 0, down)} />
                  <span />
                  <EmuButton label="R" onHold={(down) => nudge(0.9, 0, down)} />
                  <span />
                  <EmuButton label="D" onHold={(down) => nudge(0, 0.9, down)} />
                  <span />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <EmuButton label="X" onHold={(down) => holdEmu(2, down)} />
                  <span />
                  <EmuButton label="LT" onHold={(down) => holdEmu(6, down)} />
                  <EmuButton label="A" onHold={(down) => holdEmu(0, down)} />
                  <EmuButton label="RB" onHold={(down) => holdEmu(5, down)} />
                  <EmuButton label="RT" onHold={(down) => holdEmu(7, down)} />
                  <EmuButton label="Menu" onHold={(down) => holdEmu(9, down)} />
                  <span />
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-md border border-line text-sm"
                onClick={() => engineRef.current?.resetBindings(false)}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset bindings
              </button>
              <button
                type="button"
                className="h-11 rounded-md border border-line text-sm"
                onClick={() => engineRef.current?.resetBindings(true)}
              >
                Reset bindings and layout
              </button>
              <p className="text-xs leading-relaxed text-muted">
                {RECOVERY_CODE} opens this panel. Hold {RECOVERY_CODE} to restore bindings if a layout ever feels
                stuck. Pause cannot lose its last keyboard key.
              </p>
            </section>

            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm text-muted">
                <Compass className="size-4" aria-hidden="true" />
                Checked here
              </h2>
              <p className="text-xs leading-relaxed text-muted">
                Keyboard and the touch layer are live in this browser. Gamepad support follows the Gamepad API
                when the browser exposes it. The on-screen pad uses a synthetic snapshot, not a physical
                controller.
              </p>
              {frame ? (
                <p className="mt-2 text-xs text-muted">
                  Pad glyphs now: {bindingLabel({ kind: "padButton", button: 0 }, padFamily(frame))} interact,{" "}
                  {frame.prompts.shrineRelease} rite.
                </p>
              ) : null}
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function keySlot(engine: InputEngine, action: ActionId, keyIndex: number): number {
  let seen = 0;
  const list = engine.getBindings()[action];
  for (let index = 0; index < list.length; index += 1) {
    if (list[index]?.kind !== "key") continue;
    if (seen === keyIndex) return index;
    seen += 1;
  }
  return 0;
}

function slotKey(binding: Binding, index: number): string {
  if (binding.kind === "key") return binding.code;
  return `${binding.kind}-${index}`;
}

function EmuButton({ label, onHold }: { label: string; onHold: (down: boolean) => void }) {
  return (
    <button
      type="button"
      className="pad-key"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.dataset.down = "true";
        onHold(true);
      }}
      onPointerUp={(event) => {
        event.currentTarget.dataset.down = "false";
        onHold(false);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.dataset.down = "false";
        onHold(false);
      }}
      onPointerCancel={(event) => {
        event.currentTarget.dataset.down = "false";
        onHold(false);
      }}
    >
      {label}
    </button>
  );
}
