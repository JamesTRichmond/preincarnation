import { useEffect, useRef, useState } from "react";
import { convo } from "../dialogue.ts";
import { continuityLine } from "../effects.ts";
import { step } from "../engine.ts";
import { lessonsOf } from "../lessons.ts";
import { hydrate, serialize } from "../save.ts";
import { bodyLine, initialState } from "../state.ts";
import type { Command, Dir, Result, State } from "../types.ts";
import { listVerbs, primaryVerb } from "../verbs.ts";
import { placeTitle } from "../world.ts";
import { drawWorld, tickCamera, type Camera, type Pose } from "./draw.ts";

const SAVE_KEY = "preincarnation-opening-v1";
const MOVE: Record<string, Dir> = {
  KeyW: "n",
  ArrowUp: "n",
  KeyS: "s",
  ArrowDown: "s",
  KeyA: "w",
  ArrowLeft: "w",
  KeyD: "e",
  ArrowRight: "e",
};

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getPosition: () => { x: number; y: number };
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
    __opening?: {
      getState: () => State;
      lessons: () => ReturnType<typeof lessonsOf>;
      verbs: () => ReturnType<typeof listVerbs>;
      dispatch: (cmd: Command) => Result;
      place: () => string;
    };
  }
}

function dirHeld(held: Set<string>): Dir | null {
  if (held.has("KeyA") || held.has("ArrowLeft")) return "w";
  if (held.has("KeyD") || held.has("ArrowRight")) return "e";
  if (held.has("KeyW") || held.has("ArrowUp")) return "n";
  if (held.has("KeyS") || held.has("ArrowDown")) return "s";
  return null;
}

function loadNotch(): State | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = hydrate(raw);
    if (s.tick <= 0 && !s.flags.released && s.steps === 0) return null;
    return s;
  } catch {
    return null;
  }
}

export function OpeningPlay() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(initialState());
  const viewRef = useRef<Result | null>(null);
  const heldRef = useRef(new Set<string>());
  const camRef = useRef<Camera>({ x: 0, y: 0, ready: false });
  const poseRef = useRef<Pose>({ x: 6, y: 8 });
  const mapRef = useRef(initialState().map);
  const phaseRef = useRef<"title" | "play">("title");
  const flashRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const [phase, setPhase] = useState<"title" | "play">("title");
  const [tick, setTick] = useState(0);
  const [hasNotch, setHasNotch] = useState(false);
  const reduceRef = useRef(false);

  function unlock() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      void audioRef.current.resume();
    } catch {
      /* silence is allowed */
    }
  }

  function tone(freq: number, dur: number, gain: number) {
    const ctx = audioRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  function act(cmd: Command): Result {
    let s = stateRef.current;
    if (s.continuity && cmd.type !== "ack-continuity" && cmd.type !== "resume-break" && cmd.type !== "hide") {
      s = step(s, { type: "ack-continuity" }).state;
    }
    const r = step(s, cmd);
    stateRef.current = r.state;
    viewRef.current = r;
    if (r.events.some((e) => e.startsWith("hammer"))) {
      flashRef.current = reduceRef.current ? 0 : 0.35;
      tone(180, 0.08, 0.03);
    } else if (r.events.some((e) => e.startsWith("verb:"))) {
      tone(210, 0.045, 0.012);
    } else if (r.events.some((e) => e.startsWith("died"))) {
      tone(140, 0.4, 0.02);
    }
    if (phaseRef.current === "play" && r.state.tick > 0) {
      try {
        localStorage.setItem(SAVE_KEY, serialize(r.state));
      } catch {
        /* private mode */
      }
    }
    setTick((n) => n + 1);
    return r;
  }

  const actRef = useRef(act);
  actRef.current = act;

  function beginFresh() {
    unlock();
    stateRef.current = initialState();
    poseRef.current = { x: initialState().x, y: initialState().y };
    mapRef.current = "road";
    viewRef.current = null;
    camRef.current.ready = false;
    phaseRef.current = "play";
    setPhase("play");
  }

  function beginNotch() {
    unlock();
    const s = loadNotch();
    if (!s) {
      beginFresh();
      return;
    }
    if (s.sessionNotch) s.continuity = continuityLine(s.sessionNotch);
    stateRef.current = s;
    poseRef.current = { x: s.x, y: s.y };
    mapRef.current = s.map;
    viewRef.current = null;
    camRef.current.ready = false;
    phaseRef.current = "play";
    setPhase("play");
    setTick((n) => n + 1);
  }

  useEffect(() => {
    setHasNotch(Boolean(loadNotch()));
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceRef.current = mq.matches;
    const onMq = () => {
      reduceRef.current = mq.matches;
    };
    mq.addEventListener("change", onMq);

    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      heldRef.current.add(e.code);
      if (MOVE[e.code] || e.code === "Space" || e.code === "KeyE" || e.code === "Enter") e.preventDefault();
      if (phaseRef.current === "title" && MOVE[e.code]) {
        beginFresh();
        return;
      }
      if (phaseRef.current !== "play") return;
      if (e.repeat) return;
      const s = stateRef.current;
      if (e.code === "Escape" && s.talk) actRef.current({ type: "leave-talk" });
      if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") {
        if (s.talk) actRef.current({ type: "advance" });
        else {
          const verb = primaryVerb(s);
          if (verb && verb.id !== "advance") actRef.current({ type: "verb", id: verb.id });
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      heldRef.current.delete(e.code);
    };
    const blur = () => heldRef.current.clear();
    const hide = () => {
      if (phaseRef.current !== "play") return;
      const r = step(stateRef.current, { type: "hide" });
      stateRef.current = r.state;
      try {
        localStorage.setItem(SAVE_KEY, serialize(r.state));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hide();
    });
    window.addEventListener("pagehide", hide);

    let frame = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap) {
        const rect = wrap.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const bw = Math.max(1, Math.floor(rect.width * dpr));
        const bh = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = bw;
          canvas.height = bh;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const movingNow = dirHeld(heldRef.current);
          const st = stateRef.current;
          const pose = poseRef.current;
          const gap = Math.hypot(st.x - pose.x, st.y - pose.y);
          if (mapRef.current !== st.map || gap > 1.4 || reduceRef.current) {
            pose.x = st.x;
            pose.y = st.y;
            mapRef.current = st.map;
          } else {
            const k = 1 - Math.exp(-12 * dt);
            pose.x += (st.x - pose.x) * k;
            pose.y += (st.y - pose.y) * k;
          }
          tickCamera(
            camRef.current,
            st,
            rect.width,
            rect.height,
            dt,
            reduceRef.current,
            phaseRef.current === "play" ? 64 : 16,
            pose,
          );
          if (phaseRef.current === "play") {
            acc += dt;
            if (movingNow && acc >= 0.18) {
              acc = 0;
              actRef.current({ type: "move", dir: movingNow });
            }
          }
          flashRef.current = Math.max(0, flashRef.current - dt * 1.4);
          drawWorld(
            ctx,
            stateRef.current,
            camRef.current,
            rect.width,
            rect.height,
            now / 1000,
            reduceRef.current,
            flashRef.current,
            pose,
          );
        }
      }
      const yawOf: Record<Dir, number> = { n: 0, w: Math.PI / 2, s: Math.PI, e: -Math.PI / 2 };
      window.__controlsTest = {
        getYaw: () => yawOf[stateRef.current.facing],
        getSpeed: () => (phaseRef.current === "play" && dirHeld(heldRef.current) ? 1 : 0),
        getPosition: () => ({ x: stateRef.current.x, y: stateRef.current.y }),
        setKeys: (codes) => {
          heldRef.current = new Set(codes);
        },
        setSteer: () => {},
      };
      window.__opening = {
        getState: () => stateRef.current,
        lessons: () => lessonsOf(stateRef.current),
        verbs: () => listVerbs(stateRef.current),
        dispatch: (cmd) => actRef.current(cmd),
        place: () => placeTitle(stateRef.current),
      };
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("pagehide", hide);
      mq.removeEventListener("change", onMq);
    };
    // The loop closes over refs on purpose. It is mounted once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state = stateRef.current;
  const speech = state.talk ? convo(state.talk.id).lines[state.talk.index] : null;
  const verbs = phase === "play" ? listVerbs(state) : [];
  const primary = phase === "play" && !speech ? primaryVerb(state) : null;
  const placeVerbs = verbs.filter((v) => v.group === "place" && v.id !== primary?.id);
  const handVerbs = verbs.filter((v) => v.group === "hand" && v.id !== primary?.id);
  const caption = state.continuity ?? viewRef.current?.captions.at(-1) ?? null;
  void tick;

  const hold = (code: string, on: boolean) => {
    if (on) heldRef.current.add(code);
    else heldRef.current.delete(code);
  };

  const ink = { textShadow: "0 1px 2px #161713, 0 0 10px #161713" };

  return (
    <div className="relative h-dvh overflow-hidden bg-bg text-fg">
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />
      </div>

      {phase === "title" ? (
        <div className="absolute inset-0 flex items-end justify-start p-4 pb-6 sm:p-8">
          <div className="w-full max-w-sm border border-line bg-panel/95 px-6 py-6">
            <p className="font-ui text-xs tracking-[0.22em] text-candle uppercase">Middlebury</p>
            <h1 className="mt-2 font-display text-4xl leading-none">PREINCARNATION</h1>
            <p className="mt-4 font-display text-lg leading-snug">Ellis Perch comes into Middlebury with a parcel.</p>
            <p className="mt-3 font-ui text-sm leading-relaxed text-muted">
              Arrow keys, or the left side of the keyboard. On a small screen, the pad. What you can do is written where you are standing.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="min-h-11 border border-candle bg-candle px-4 text-bg" onClick={beginFresh}>
                Walk
              </button>
              {hasNotch ? (
                <button type="button" className="min-h-11 border border-line px-4" onClick={beginNotch}>
                  Return to the notch
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute top-0 left-0 z-10 max-w-[68%] p-3 sm:max-w-sm sm:p-4">
            <p className="font-display text-2xl leading-none" style={ink}>
              {placeTitle(state)}
            </p>
            <p className="mt-1 font-ui text-sm text-fg/90" style={ink}>
              {bodyLine(state)}
            </p>
          </div>
          <div className="play-dock pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-3 md:p-4">
            {speech ? (
              <div className="pointer-events-auto max-w-xl border border-line bg-panel/95 px-4 py-3">
                <p className="font-ui text-xs tracking-[0.16em] text-candle uppercase">{speech.speaker}</p>
                <p className="mt-1 font-display text-lg leading-snug">{speech.text}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="min-h-11 border border-candle bg-candle px-3 text-bg" onClick={() => act({ type: "advance" })}>
                    Continue
                  </button>
                  <button type="button" className="min-h-11 border border-line px-3" onClick={() => act({ type: "leave-talk" })}>
                    Turn away
                  </button>
                </div>
              </div>
            ) : (
              <>
                {caption ? (
                  <p className="max-w-xl font-display text-lg leading-snug" style={ink}>
                    {caption}
                  </p>
                ) : null}
                <div className="verb-row pointer-events-auto flex gap-2 overflow-x-auto pb-1">
                  {primary && primary.id !== "advance" ? (
                    <button
                      type="button"
                      className="min-h-11 shrink-0 border border-candle bg-candle px-3 py-2 text-left font-ui text-sm text-bg"
                      onClick={() => act({ type: "verb", id: primary.id })}
                    >
                      {primary.label}
                    </button>
                  ) : null}
                  {placeVerbs.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="min-h-11 shrink-0 border border-line bg-panel/90 px-3 py-2 text-left font-ui text-sm"
                      onClick={() => act({ type: "verb", id: v.id })}
                    >
                      {v.label}
                    </button>
                  ))}
                  {handVerbs.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="min-h-11 shrink-0 border border-line/80 bg-bg/75 px-3 py-2 text-left font-ui text-sm text-fg/80"
                      onClick={() => act({ type: "verb", id: v.id })}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="pointer-events-auto absolute right-3 bottom-3 z-20 grid w-fit grid-cols-3 gap-1 md:hidden">
            <span />
            <Pad label="North" code="KeyW" onHold={hold} />
            <span />
            <Pad label="West" code="KeyA" onHold={hold} />
            <span />
            <Pad label="East" code="KeyD" onHold={hold} />
            <span />
            <Pad label="South" code="KeyS" onHold={hold} />
            <span />
          </div>
        </>
      )}
    </div>
  );
}

function Pad({ label, code, onHold }: { label: string; code: string; onHold: (code: string, on: boolean) => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="min-h-11 min-w-11 border border-line bg-panel font-ui text-xs"
      onPointerDown={(e) => {
        e.preventDefault();
        onHold(code, true);
      }}
      onPointerUp={() => onHold(code, false)}
      onPointerLeave={() => onHold(code, false)}
      onPointerCancel={() => onHold(code, false)}
    >
      {label.slice(0, 1)}
    </button>
  );
}
