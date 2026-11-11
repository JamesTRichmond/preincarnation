import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type PointerEvent } from "react";
import { Pause, Play, RotateCcw, Star, Timer } from "lucide-react";
import { COURSES, FEATURED_IDS, getCourse } from "./catalog.ts";
import { drawWorld, viewPixels, type Spark } from "./draw.ts";
import { formatTime, versusGold, type Medal } from "./medals.ts";
import { FEATURED_REPLAYS, MEDAL_FRAMES, TRACES, type TracePt } from "./measured-runs.ts";
import { DT, accessById, type AccessId, type Course, type HeldInput, type Tier } from "./types.ts";
import {
  armLive,
  createRun,
  noteDevice,
  noteFocus,
  pauseRun,
  requestStart,
  resetRun,
  resumeRun,
  setInput,
  tick,
  type GhostView,
  type Run,
} from "./session.ts";
import { browserKv, loadBoard, recordClear, type Board, type ClearResult } from "./storage.ts";

type Probe = {
  setKeys: (codes: string[]) => void;
  getSpeed: () => number;
  getX: () => number;
  getYaw: () => number;
};

declare global {
  interface Window {
    __controlsTest?: Probe;
  }
}

type Hud = {
  phase: Run["phase"];
  frames: number;
  checks: number;
  need: number;
  deaths: number;
  falseStart: boolean;
  countdown: number;
  pause: Run["pauseReason"];
};

type GhostMode = "gold" | "best" | "off";
type Tab = "featured" | Tier;

const EMPTY_HUD: Hud = {
  phase: "idle",
  frames: 0,
  checks: 0,
  need: 0,
  deaths: 0,
  falseStart: false,
  countdown: 3,
  pause: null,
};

const TABS: { id: Tab; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "early", label: "Early" },
  { id: "mixed", label: "Tools" },
  { id: "route", label: "Routes" },
  { id: "mastery", label: "Late" },
];

const goldCache = new Map<string, { x: number; y: number }[]>();

function axis(neg: boolean, pos: boolean): -1 | 0 | 1 {
  if (neg === pos) return 0;
  return neg ? -1 : 1;
}

function heldInput(keys: Set<string>): HeldInput {
  const down = (code: string) => keys.has(code);
  const jump = down("Space") || down("KeyW") || down("ArrowUp");
  const drop = down("KeyS") || down("ArrowDown");
  return {
    x: axis(down("KeyA") || down("ArrowLeft"), down("KeyD") || down("ArrowRight")),
    y: axis(jump, drop),
    jump,
    sugar: down("KeyE"),
    glide: down("ShiftLeft") || down("ShiftRight") || down("KeyC"),
    rod: down("KeyR"),
    voidStep: down("KeyV"),
    drop,
  };
}

function atTrace(points: TracePt[], frame: number): { x: number; y: number } {
  const first = points[0];
  if (!first) return { x: 0, y: 0 };
  if (frame <= first.f) return { x: first.x, y: first.y };
  for (let i = 1; i < points.length; i++) {
    const b = points[i];
    const a = points[i - 1];
    if (!b || !a) continue;
    if (frame <= b.f) {
      const t = (frame - a.f) / Math.max(1, b.f - a.f);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  const last = points[points.length - 1] ?? first;
  return { x: last.x, y: last.y };
}

/** Measured gold positions. Featured courses use the full replay; the rest use the gold trace. */
function goldFrames(courseId: string): { x: number; y: number }[] {
  const cached = goldCache.get(courseId);
  if (cached) return cached;
  const replay = FEATURED_REPLAYS[courseId];
  let frames: { x: number; y: number }[];
  if (replay && replay.frames.length > 0) {
    frames = replay.frames.map((frame) => ({ x: frame.x, y: frame.y }));
  } else {
    const gold = TRACES[courseId]?.gold ?? [];
    const last = gold[gold.length - 1]?.f ?? 0;
    frames = [];
    for (let f = 0; f <= last; f++) frames.push(atTrace(gold, f));
  }
  goldCache.set(courseId, frames);
  return frames;
}

function ghostView(courseId: string, access: AccessId, board: Board | null, mode: GhostMode): GhostView | null {
  if (mode === "off") return null;
  if (mode === "best") {
    const bucket = access === "assist" ? board?.assist : board?.standard;
    const saved = bucket?.[courseId]?.replay;
    if (saved && saved.frames.length > 0) {
      return { frames: saved.frames.map((frame) => ({ x: frame.x, y: frame.y })) };
    }
  }
  const frames = goldFrames(courseId);
  if (frames.length === 0) return null;
  return { frames };
}

function medalLabel(medal: Medal | null): string {
  if (medal === "gold") return "Gold";
  if (medal === "silver") return "Silver";
  if (medal === "bronze") return "Bronze";
  return "Clear";
}

function coursesIn(tab: Tab): Course[] {
  if (tab === "featured") return COURSES.filter((item) => item.featured);
  return COURSES.filter((item) => item.tier === tab);
}

function burst(list: Spark[], x: number, y: number, bell: boolean) {
  for (let i = 0; i < 5; i++) {
    list.push({
      x,
      y,
      vx: (i - 2) * 0.85,
      vy: bell ? -1.4 - i * 0.1 : -0.55,
      life: 14,
      bell,
    });
  }
  if (list.length > 48) list.splice(0, list.length - 48);
}

function paintCanvas(canvas: HTMLCanvasElement, run: Run, contrast: boolean, ghostFrame: number, sparks: Spark[]) {
  const view = viewPixels();
  const parent = canvas.parentElement?.clientWidth ?? view.w;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const scale = Math.max(1, Math.floor((parent * dpr) / view.w));
  const bw = view.w * scale;
  const bh = view.h * scale;
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawWorld(ctx, run.course, run.sim, run.ghost, ghostFrame, contrast, run.nextCheck, sparks);
}

function reduceMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Playground() {
  const [courseId, setCourseId] = useState(FEATURED_IDS[0] ?? COURSES[0]!.id);
  const [accessId, setAccessId] = useState<AccessId>("standard");
  const [contrast, setContrast] = useState(false);
  const [ghostMode, setGhostMode] = useState<GhostMode>("gold");
  const [tab, setTab] = useState<Tab>("featured");
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [banner, setBanner] = useState<ClearResult | null>(null);
  const [board, setBoard] = useState<Board | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run | null>(null);
  const keysRef = useRef(new Set<string>());
  const probeRef = useRef(new Set<string>());
  const savedRef = useRef(false);
  const ghostModeRef = useRef(ghostMode);
  const contrastRef = useRef(contrast);
  const boardRef = useRef(board);
  const sparksRef = useRef<Spark[]>([]);
  const studyRef = useRef(0);
  ghostModeRef.current = ghostMode;
  contrastRef.current = contrast;
  boardRef.current = board;

  const course = getCourse(courseId) ?? COURSES[0]!;

  useEffect(() => {
    setBoard(loadBoard(browserKv()));
  }, []);

  useLayoutEffect(() => {
    const next = getCourse(courseId);
    if (!next) return;
    const run = freshRun(next.id, accessId);
    run.ghost = ghostView(next.id, accessId, boardRef.current, ghostModeRef.current);
    runRef.current = run;
    savedRef.current = false;
    studyRef.current = 0;
    sparksRef.current = [];
    setBanner(null);
    setHud(snapshot(run));
    const canvas = canvasRef.current;
    if (canvas) paintCanvas(canvas, run, contrastRef.current, 0, []);
  }, [courseId, accessId]);

  useEffect(() => {
    const run = runRef.current;
    if (!run) return;
    run.ghost = ghostView(run.course.id, run.access.id, board, ghostMode);
  }, [ghostMode, board, courseId, accessId]);

  useEffect(() => {
    const qa = import.meta.env.DEV || new URLSearchParams(window.location.search).get("qa") === "1";
    if (!qa) return;
    window.__controlsTest = {
      setKeys(codes) {
        probeRef.current = new Set(codes);
        const run = runRef.current;
        if (run && (run.phase === "idle" || run.phase === "finished" || run.phase === "paused")) {
          armLive(run, false);
          savedRef.current = true;
        }
      },
      getSpeed: () => Math.abs(runRef.current?.sim.body.vx ?? 0),
      getX: () => runRef.current?.sim.body.x ?? 0,
      getYaw: () => (runRef.current?.sim.facing === -1 ? 1 : -1),
    };
    return () => {
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    const lose = () => {
      const run = runRef.current;
      if (run) noteFocus(run, false);
    };
    const onKey = (event: KeyboardEvent) => {
      const run = runRef.current;
      if (event.type === "keydown" && !event.repeat && run) {
        if (event.code === "Enter") {
          if (run.phase === "paused") resumeRun(run);
          else if (run.phase === "idle" || run.phase === "finished") requestStart(run);
          return;
        }
        if (event.code === "Escape") {
          if (run.phase === "live" || run.phase === "countdown") pauseRun(run, "manual");
          else if (run.phase === "paused") resumeRun(run);
          return;
        }
      }
      if (event.repeat) return;
      if (run) noteDevice(run, "keyboard");
      if (event.type === "keydown") {
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
          event.preventDefault();
        }
        keysRef.current.add(event.code);
      } else {
        keysRef.current.delete(event.code);
      }
    };
    const clear = () => keysRef.current.clear();
    const onHide = () => {
      if (document.hidden) lose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", lose);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", lose);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let hudAt = 0;
    const loop = (now: number) => {
      const frameDt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += frameDt;
      const run = runRef.current;
      const calm = reduceMotion();
      if (run) {
        const keys = new Set([...keysRef.current, ...probeRef.current]);
        setInput(run, heldInput(keys));
        let steps = 0;
        while (acc >= DT && steps < 5) {
          const beforeGround = run.sim.grounded;
          const beforeChecks = run.nextCheck;
          const info = tick(run);
          acc -= DT;
          steps += 1;
          if (!calm && !beforeGround && run.sim.grounded) {
            burst(sparksRef.current, run.sim.body.x + run.sim.body.w / 2, run.sim.body.y + run.sim.body.h, false);
          }
          if (!calm && run.nextCheck > beforeChecks) {
            burst(sparksRef.current, run.sim.body.x + run.sim.body.w / 2, run.sim.body.y + 4, true);
          }
          if (info.finished && !savedRef.current) {
            savedRef.current = true;
            const result = recordClear(browserKv(), run);
            setBanner(result);
            setBoard(loadBoard(browserKv()));
          }
        }
        if (acc > DT) acc = 0;
        if (!calm) {
          for (const spark of sparksRef.current) {
            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.vy += 0.14;
            spark.life -= 1;
          }
          sparksRef.current = sparksRef.current.filter((spark) => spark.life > 0);
        }
      }
      let ghostFrame = run?.liveFrames ?? 0;
      if (run && run.phase === "idle" && ghostModeRef.current !== "off" && !calm) {
        studyRef.current += frameDt * 60;
        const length = run.ghost?.frames.length ?? 1;
        ghostFrame = Math.floor(studyRef.current) % Math.max(1, length);
      }
      if (run && run.phase === "countdown") ghostFrame = 0;
      const canvas = canvasRef.current;
      if (canvas && run) paintCanvas(canvas, run, contrastRef.current, ghostFrame, sparksRef.current);
      hudAt += frameDt;
      if (run && hudAt > 0.1) {
        hudAt = 0;
        setHud(snapshot(run));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const band = MEDAL_FRAMES[course.id];
  const ranked = board?.standard[course.id];
  const assistBest = board?.assist[course.id];
  const shownBest = accessId === "assist" ? assistBest : ranked;
  const kit = course.kit;
  const racing = (hud.phase === "live" || hud.phase === "finished") && hud.frames > 0 && band;
  const split = racing && band ? versusGold(hud.frames, band.gold) : null;
  const list = coursesIn(tab);
  const hasBest = Boolean(shownBest && shownBest.replay.frames.length > 0);

  function hold(code: string) {
    return {
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        keysRef.current.add(code);
        const run = runRef.current;
        if (run) noteDevice(run, "touch");
      },
      onPointerUp: () => keysRef.current.delete(code),
      onPointerCancel: () => keysRef.current.delete(code),
    };
  }

  function chooseTab(next: Tab) {
    setTab(next);
    const rows = coursesIn(next);
    if (!rows.some((item) => item.id === courseId) && rows[0]) setCourseId(rows[0].id);
  }

  function cycleGhost() {
    setGhostMode((mode) => {
      if (mode === "gold") return hasBest ? "best" : "off";
      if (mode === "best") return "off";
      return "gold";
    });
  }

  const tools = [
    kit.sugar ? "Sugar" : null,
    kit.boots ? "Boots" : null,
    kit.fins ? "Fins" : null,
    kit.cape ? "Cape" : null,
    kit.rod ? "Rod" : null,
    kit.voidStep ? "Veil" : null,
  ].filter((name): name is string => Boolean(name));

  return (
    <main data-contrast={contrast ? "high" : "standard"} className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-wide text-creek">Traversal yard</p>
          <h1 className="font-display text-4xl leading-none text-ink">PREINCARNATION</h1>
          <p className="max-w-xl text-base leading-relaxed">
            Race the measured gold line. The ghost is a recording on the page. It cannot move a stone, and nothing here locks the road home.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="order-2 flex flex-col gap-3 lg:order-1">
            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => {
                const on = item.id === tab;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseTab(item.id)}
                    className={
                      "min-h-11 border border-ink px-3 text-sm font-medium " +
                      (on ? "bg-ink text-paper" : "bg-paper text-ink")
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              {list.map((item) => {
                const selected = item.id === course.id;
                const medal = board?.standard[item.id]?.medal ?? null;
                const gold = MEDAL_FRAMES[item.id]?.gold;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCourseId(item.id)}
                    className={
                      "flex min-h-11 items-center justify-between gap-2 border px-3 text-left text-sm " +
                      (selected ? "border-ink bg-ink text-paper" : "border-ink bg-paper text-ink hover:bg-sugar")
                    }
                  >
                    <span className="flex items-center gap-2">
                      {item.featured ? <Star className="size-4 shrink-0 text-sugar" aria-hidden="true" /> : null}
                      {item.title}
                    </span>
                    <span className="flex items-center gap-2">
                      {medal ? <MedalPip medal={medal} /> : null}
                      <span className={selected ? "text-xs text-sugar" : "text-xs text-creek"}>
                        {gold != null ? formatTime(gold) : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl leading-none">{course.title}</h2>
              <p className="text-base leading-relaxed">{course.problem}</p>
              <p className="text-sm leading-relaxed text-veil">{course.blurb}</p>
              {tools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tools.map((name) => (
                    <span key={name} className="border border-ink px-2 py-1 text-xs font-medium text-ink">
                      {name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-medium text-creek">Feet only. No tools on this course.</p>
              )}
            </div>

            <div className="relative border border-ink bg-veil">
              <canvas ref={canvasRef} className="block h-auto w-full touch-none" />
              {hud.phase === "idle" ? (
                <p className="absolute bottom-3 left-3 bg-ink px-3 py-2 text-sm text-paper">
                  {ghostMode === "off" ? "Start when your hands are still." : "The gold line is walking. Start to chase it."}
                </p>
              ) : null}
              {hud.phase === "countdown" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/80 text-paper">
                  <p className="font-display text-6xl leading-none">{Math.ceil(hud.countdown)}</p>
                  <p className="text-sm">{hud.falseStart ? "False start. Hands off." : "Hold still."}</p>
                </div>
              ) : null}
              {hud.phase === "paused" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/80 text-paper">
                  <p className="font-display text-3xl">Paused</p>
                  <p className="text-sm">
                    {hud.pause === "focus" ? "The window looked away. Time did not." : null}
                    {hud.pause === "device" ? "Hands changed. Time did not." : null}
                    {hud.pause === "manual" ? "The clock is waiting." : null}
                  </p>
                </div>
              ) : null}
              {hud.phase === "finished" && banner?.saved ? (
                <div className="absolute top-3 right-3 bg-ink px-3 py-2 text-paper">
                  <p className="font-display text-2xl text-sugar">{medalLabel(banner.medal)}</p>
                  {split ? <p className={"text-sm " + (split.ahead ? "text-creek" : "text-sugar")}>{split.label} gold</p> : null}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Time" value={formatTime(hud.frames)} />
              <Stat label="Bells" value={`${hud.checks}/${hud.need}`} />
              <Stat label="Falls" value={String(hud.deaths)} />
              {split ? (
                <Stat label="Vs gold" value={split.label} tone={split.ahead ? "creek" : "sugar"} />
              ) : (
                <Stat label={shownBest ? "Best" : "Gold"} value={shownBest ? formatTime(shownBest.frames) : band ? formatTime(band.gold) : "—"} />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="inline-flex min-h-11 items-center gap-2 bg-sugar px-4 text-sm font-medium text-ink" onClick={() => runRef.current && requestStart(runRef.current)}>
                <Play className="size-4" aria-hidden="true" />
                Start
              </button>
              {hud.phase === "paused" ? (
                <button type="button" className="inline-flex min-h-11 items-center gap-2 border border-ink bg-paper px-4 text-sm font-medium text-ink" onClick={() => runRef.current && resumeRun(runRef.current)}>
                  <Play className="size-4" aria-hidden="true" />
                  Resume
                </button>
              ) : (
                <button type="button" className="inline-flex min-h-11 items-center gap-2 border border-ink bg-paper px-4 text-sm font-medium text-ink" onClick={() => runRef.current && pauseRun(runRef.current, "manual")}>
                  <Pause className="size-4" aria-hidden="true" />
                  Pause
                </button>
              )}
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 border border-ink bg-paper px-4 text-sm font-medium text-ink"
                onClick={() => {
                  const run = runRef.current;
                  if (!run) return;
                  resetRun(run);
                  run.ghost = ghostView(run.course.id, run.access.id, boardRef.current, ghostModeRef.current);
                  savedRef.current = false;
                  studyRef.current = 0;
                  sparksRef.current = [];
                  setBanner(null);
                  setHud(snapshot(run));
                }}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset
              </button>
              <button
                type="button"
                aria-pressed={ghostMode !== "off"}
                className={
                  "inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-sm font-medium " +
                  (ghostMode === "gold" ? "bg-creek text-paper" : ghostMode === "best" ? "bg-veil text-paper" : "bg-paper text-ink")
                }
                onClick={cycleGhost}
              >
                {ghostMode === "gold" ? "Ghost gold" : ghostMode === "best" ? "Ghost best" : "Ghost off"}
              </button>
              <button
                type="button"
                aria-pressed={accessId === "assist"}
                className={"inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-sm font-medium " + (accessId === "assist" ? "bg-veil text-paper" : "bg-paper text-ink")}
                onClick={() => setAccessId((value) => (value === "assist" ? "standard" : "assist"))}
              >
                {accessId === "assist" ? "Assist, unranked" : "Standard"}
              </button>
              <button
                type="button"
                aria-pressed={contrast}
                className={"inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-sm font-medium " + (contrast ? "bg-ink text-paper" : "bg-paper text-ink")}
                onClick={() => setContrast((value) => !value)}
              >
                {contrast ? "High contrast" : "Contrast"}
              </button>
            </div>

            <p className="flex items-center gap-2 text-sm leading-relaxed">
              <Timer className="size-4 shrink-0 text-creek" aria-hidden="true" />
              {band
                ? `Gold ${formatTime(band.gold)} · Silver ${formatTime(band.silver)} · Bronze ${formatTime(band.bronze)} on ${course.routes.find((route) => route.id === band.routeId)?.label ?? band.routeId}.`
                : "No measured band."}
              {accessId === "assist" ? " Assist times stay off the medal board." : ""}
            </p>

            {banner?.saved ? (
              <div className="border border-ink bg-paper p-4">
                <p className="font-display text-2xl text-sugar">{medalLabel(banner.medal)}</p>
                <p className="mt-1 text-base leading-relaxed">{banner.note}</p>
                <p className="mt-1 text-sm">
                  {split ? `${split.label} against gold. ` : ""}
                  {banner.pb ? "Personal best kept on this device." : "A faster run already sits in the book."}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed">
                {board?.notes.includes(course.id) ? course.fieldNote : "A clear leaves a field note. It does not open a gate in the story."}
              </p>
            )}

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              <Touch label="Left" {...hold("KeyA")} />
              <Touch label="Right" {...hold("KeyD")} />
              <Touch label="Jump" {...hold("Space")} />
              <Touch label="Drop" {...hold("KeyS")} />
              {kit.sugar ? <Touch label="Sugar" {...hold("KeyE")} /> : null}
              {kit.cape ? <Touch label="Cape" {...hold("KeyC")} /> : null}
              {kit.rod ? <Touch label="Rod" {...hold("KeyR")} /> : null}
              {kit.voidStep ? <Touch label="Veil" {...hold("KeyV")} /> : null}
            </div>
            <p className="text-sm leading-relaxed text-veil">
              A left, D right. Space or W jumps. S drops. E sugar, C or Shift cape, R rod, V veil. Enter starts. Esc pauses. The ghost never enters the collision.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "creek" | "sugar" }) {
  const toneClass = tone === "creek" ? "text-creek" : tone === "sugar" ? "text-sugar" : "text-ink";
  return (
    <div className="border border-ink bg-paper px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-creek">{label}</p>
      <p className={"font-display text-xl " + toneClass}>{value}</p>
    </div>
  );
}

function MedalPip({ medal }: { medal: Medal }) {
  const cls = medal === "gold" ? "bg-sugar" : medal === "silver" ? "bg-creek" : "bg-veil";
  return <span className={"inline-block size-3 " + cls} aria-label={medalLabel(medal)} />;
}

function Touch({ label, ...rest }: { label: string } & HTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="min-h-11 border border-ink bg-paper text-sm font-medium text-ink" {...rest}>
      {label}
    </button>
  );
}

function snapshot(run: Run): Hud {
  return {
    phase: run.phase,
    frames: run.liveFrames,
    checks: run.nextCheck,
    need: run.course.checks.length,
    deaths: run.sim.deaths,
    falseStart: run.falseStart,
    countdown: run.countdown,
    pause: run.pauseReason,
  };
}

function freshRun(courseId: string, accessId: AccessId): Run {
  const course = getCourse(courseId) ?? COURSES[0]!;
  return createRun(course, accessById(accessId), accessId === "assist");
}
