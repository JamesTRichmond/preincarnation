import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  HeartCrack,
  Menu,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  AdaptiveMusic,
  type Cue,
  type Intensity,
  type MusicState,
  type PlaybackClock,
  type ScoreManifest,
} from "../controller/adaptive-music.ts";

const ORDER = [
  "title",
  "middlebury",
  "open-county",
  "high-woods",
  "water",
  "quarry",
  "ordinary-dungeon",
  "danger",
  "boss",
  "afterlife",
  "reincarnation",
  "ending",
];

const GROUPS: { label: string; ids: string[] }[] = [
  { label: "Before the county", ids: ["title"] },
  { label: "Familiar county", ids: ["middlebury", "open-county", "high-woods", "water"] },
  { label: "Later county", ids: ["quarry", "ordinary-dungeon", "danger", "boss"] },
  { label: "After the life", ids: ["afterlife", "reincarnation", "ending"] },
];

type Family = "ellis" | "vein" | "voice" | "other";

const CONTOUR: { id: Family; name: string; steps: number[] }[] = [
  { id: "ellis", name: "Ellis", steps: [0, 3, 2, 7, 6] },
  { id: "vein", name: "Vein", steps: [0, -5, -10, -6] },
  { id: "voice", name: "Voice", steps: [0, 2, -3] },
  { id: "other", name: "Other", steps: [0, -2, 3] },
];

const READ: Record<string, { on: Family[]; ellis: string; vein: string; voice: string }> = {
  title: {
    on: ["ellis", "vein", "voice"],
    ellis: "Opened, and left unfinished.",
    vein: "Four stored tones, then it stops.",
    voice: "One reading, far off.",
  },
  middlebury: {
    on: ["ellis", "vein", "voice"],
    ellis: "The limp as a town melody. It leans off the note it was owed.",
    vein: "Slow marble under the street.",
    voice: "Distant. Only the first reading.",
  },
  "open-county": {
    on: ["ellis", "vein", "voice"],
    ellis: "Crosses the fields. Once, the leaning tone is allowed to be home.",
    vein: "Single tones, widely spaced.",
    voice: "Still only the first reading.",
  },
  "high-woods": {
    on: ["ellis", "vein", "voice", "other"],
    ellis: "Only the first three notes. The name never finishes.",
    vein: "Rung twice in the canopy, then gone.",
    voice: "A quiet second reading, before anyone asks for it.",
  },
  water: {
    on: ["ellis", "vein", "voice"],
    ellis: "One note a bar. The next life is already in the current.",
    vein: "The five-beat current itself.",
    voice: "On the surface, not in the deep.",
  },
  quarry: {
    on: ["ellis", "vein"],
    ellis: "A fragment left in the gallery.",
    vein: "In front, doubled low. The tritone is the cut.",
    voice: "Almost nobody speaking.",
  },
  "ordinary-dungeon": {
    on: ["ellis", "other"],
    ellis: "Straight eighths, and only while the pressure is up.",
    vein: "Held back.",
    voice: "The other reading, on a three-beat rock.",
  },
  danger: {
    on: ["ellis", "vein", "other"],
    ellis: "The limp, twice as fast. This is the fight.",
    vein: "The tritone as a stab.",
    voice: "A long warning in the second half. The loop keeps holes in it.",
  },
  boss: {
    on: ["ellis", "vein", "voice", "other"],
    ellis: "Withheld until the loop is already going.",
    vein: "A bass cycle.",
    voice: "Both readings: stated, answered, then together.",
  },
  afterlife: {
    on: ["ellis", "vein", "voice", "other"],
    ellis: "Stretched until he is almost only a tone.",
    vein: "All four lives at once, then peeled apart.",
    voice: "One reading finishes. The other answers.",
  },
  reincarnation: {
    on: ["ellis", "voice", "other"],
    ellis: "The old leaning tone is the new tonic. He rebuilds from the ache.",
    vein: "Under the new life, not in front.",
    voice: "A major second, then a minor second, then unison.",
  },
  ending: {
    on: ["ellis", "vein", "voice", "other"],
    ellis: "The minor second finally steps on, down to G.",
    vein: "Two notes. One life stays unrealized.",
    voice: "Both readings, then they leave him the last step.",
  },
};

type Measure = {
  id: string;
  mix: { seconds: number; peakDbfs: number; rmsDbfs: number; loopJoin?: { ratio: number }[] };
  motifs: { passed: number; checked: number };
  loop: boolean;
};

function stamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function placeNo(id: string): string {
  const n = ORDER.indexOf(id) + 1;
  return n > 0 ? String(n).padStart(2, "0") : "";
}

const WALK_EVERY = 20;

export function ScoreDesk() {
  const engine = useMemo(() => new AdaptiveMusic("/score/"), []);
  const [manifest, setManifest] = useState<ScoreManifest | null>(null);
  const [state, setState] = useState<MusicState>(() => engine.getState());
  const [selected, setSelected] = useState("title");
  const [clock, setClock] = useState<PlaybackClock>({ cueId: null, position: 0, duration: 0, running: false });
  const [level, setLevel] = useState(0);
  const [pinned, setPinned] = useState<Intensity | null>(null);
  const [walking, setWalking] = useState(false);
  const pinRef = useRef<Intensity | null>(null);
  pinRef.current = pinned;
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [failures, setFailures] = useState<number | null>(null);
  const walkRef = useRef(false);
  const musicRef = useRef<Cue[]>([]);
  const clockRef = useRef(clock);
  walkRef.current = walking;

  const music = useMemo(() => {
    const cues = (manifest?.cues || []).filter((cue) => cue.role === "music");
    return [...cues].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  }, [manifest]);
  musicRef.current = music;

  useEffect(() => {
    const off = engine.onChange(setState);
    let gone = false;
    engine
      .ensureManifest()
      .then((data) => {
        if (!gone) setManifest(data);
      })
      .catch(() => undefined);
    fetch("/score/validation.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || gone) return;
        setFailures(data.failureCount ?? 0);
        setMeasures(data.cues || []);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
      off();
      engine.dispose();
    };
  }, [engine]);

  useEffect(() => {
    let frame = 0;
    let anchorCue = "";
    let anchorPos = 0;
    let hold = false;
    let lastPos = -1;
    let lastLevel = -1;
    const tick = () => {
      const next = engine.clock();
      const loud = engine.level();
      const prev = clockRef.current;
      if (
        next.cueId !== prev.cueId ||
        next.running !== prev.running ||
        Math.abs(next.position - lastPos) >= 0.05 ||
        Math.abs((next.duration || 0) - (prev.duration || 0)) > 0.01
      ) {
        lastPos = next.position;
        clockRef.current = next;
        setClock(next);
      }
      if (Math.abs(loud - lastLevel) >= 0.035) {
        lastLevel = loud;
        setLevel(loud);
      }
      if (walkRef.current && next.running && next.cueId) {
        if (next.cueId !== anchorCue) {
          anchorCue = next.cueId;
          anchorPos = next.position;
          hold = false;
        } else if (!hold && (next.position - anchorPos >= WALK_EVERY || next.position + 0.35 < anchorPos)) {
          hold = true;
          const list = musicRef.current;
          const index = list.findIndex((item) => item.id === next.cueId);
          const onward = list[(index + 1) % list.length];
          const after = list[(index + 2) % list.length];
          if (onward) {
            engine.unlock();
            void engine.transitionTo(onward.id, undefined, pinRef.current ?? undefined);
            if (after) void engine.warm(after.id);
          }
        }
      } else if (!walkRef.current) {
        anchorCue = "";
        hold = false;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [engine]);

  const currentId = state.incoming || state.current;
  const playing = music.find((cue) => cue.id === currentId) || music.find((cue) => cue.id === selected) || null;
  const written = (playing?.defaultIntensity ?? 1) as Intensity;
  const shown: Intensity = pinned ?? (state.mode === "idle" && !state.current ? written : state.intensity);
  const engaged = state.mode === "playing" || state.mode === "transition";
  const progress =
    playing && clock.running && clock.cueId === playing.id && clock.duration > 0 ? clock.position / clock.duration : 0;
  const reading = playing ? READ[playing.id] : undefined;
  const measure = measures.find((item) => item.id === playing?.id);
  const byId = useMemo(() => new Map(music.map((cue) => [cue.id, cue])), [music]);

  function gesturePlay(cue: Cue) {
    engine.unlock();
    void engine.preloadUtilities();
    setSelected(cue.id);
    const index = music.findIndex((item) => item.id === cue.id);
    const after = music[(index + 1) % music.length];
    if (after) void engine.warm(after.id);
    void engine.transitionTo(cue.id, undefined, pinRef.current ?? undefined);
  }

  function step(dir: number) {
    const id = engine.clock().cueId || selected;
    const index = Math.max(0, music.findIndex((cue) => cue.id === id));
    const next = music[(index + dir + music.length) % music.length];
    if (next) gesturePlay(next);
  }

  const keys = useRef({
    replay: () => {},
    step: (_dir: number) => {},
    pin: (_level: Intensity) => {},
  });
  keys.current.replay = () => {
    if (playing) gesturePlay(playing);
  };
  keys.current.step = step;
  keys.current.pin = (level) => {
    setPinned(level);
    engine.setIntensity(level);
  };

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (event.key === " ") {
        event.preventDefault();
        keys.current.replay();
      } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        keys.current.step(1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        keys.current.step(-1);
      } else if (key === "m") {
        engine.unlock();
        engine.mute();
      } else if (key === "s") {
        if (engine.getState().userSuspended) void engine.resume();
        else engine.suspend();
      } else if (key === "d") {
        engine.unlock();
        void engine.preloadUtilities().then(() => engine.interruptDeath());
      } else if (event.key === "Escape") {
        if (engine.getState().menu) engine.setMenu(false);
        else engine.stop();
      } else if (key === "w") {
        setWalking((on) => !on);
      } else if (key === "1" || key === "2" || key === "3") {
        keys.current.pin((Number(key) - 1) as Intensity);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine]);

  const beat = playing ? clock.position / (60 / playing.bpm) : 0;
  const bar = playing ? Math.floor(beat / playing.meter[0]) + 1 : 0;
  const beatIn = playing ? Math.floor(beat % playing.meter[0]) + 1 : 0;
  const audible =
    state.solo != null && playing
      ? `Only ${playing.layers[state.solo]?.label ?? "that layer"}.`
      : playing
        ? playing.layers
            .filter((layer) => shown >= layer.intensity)
            .map((layer) => layer.label)
            .join(" · ")
        : "";

  let status = "Silent. Choose a place — the first press unlocks sound.";
  if (state.loading) status = "Opening the place.";
  else if (state.mode === "death") status = "Death. The county drops out. Ellis’s second is struck, then unwound.";
  else if (state.mode === "transition") status = `Crossing into ${playing?.title ?? "the next place"}.`;
  else if (state.mode === "playing" && state.menu) status = "Menu. The county is ducked.";
  else if (engaged) status = walking ? "Walking the county. A new place every twenty seconds." : `In ${playing?.title ?? "the county"}.`;
  if (state.error) status = state.error;

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[17rem_1fr] md:gap-6 md:px-6 md:py-8">
        <header className="md:col-span-2">
          <p className="text-sm text-accent">PREINCARNATION</p>
          <h1 className="mt-1 font-display text-4xl font-medium text-fg md:text-5xl">Vein Score</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Twelve places in Addison County. The same three motifs, heard while the county is still familiar, again after it changes, and once more after the life.
          </p>
        </header>

        <nav
          aria-label="Places"
          className="relative order-2 flex flex-col gap-4 md:sticky md:top-6 md:col-start-1 md:row-span-2 md:row-start-2 md:self-start"
        >
          <span className="absolute top-2 bottom-2 left-2 w-px bg-line" aria-hidden />
          {GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="pl-6 text-sm text-muted">{group.label}</p>
              {group.ids.map((id) => {
                const cue = byId.get(id);
                if (!cue) return null;
                const on = cue.id === (currentId || selected);
                return (
                  <button
                    key={cue.id}
                    type="button"
                    onClick={() => gesturePlay(cue)}
                    aria-pressed={on}
                    className={`relative min-h-11 rounded-control py-2 pr-2 pl-6 text-left transition-colors ${on ? "bg-surface text-fg" : "text-fg"}`}
                  >
                    {on && (
                      <span className="absolute top-1/2 left-2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
                    )}
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-base">{cue.title}</span>
                      <span className="text-sm text-muted tabular-nums">{placeNo(cue.id)}</span>
                    </span>
                    <span className="block text-sm text-muted tabular-nums">
                      {stamp(cue.duration)}
                      {cue.loop ? " loop" : " once"}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <article className="order-1 rounded-desk border border-line bg-surface p-4 md:col-start-2 md:row-start-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">
                  {playing ? `${placeNo(playing.id)} · ${GROUPS.find((group) => group.ids.includes(playing.id))?.label}` : "Score"}
                </p>
                <h2 className="mt-1 font-display text-3xl text-fg">{playing?.title ?? "Score"}</h2>
                <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">{playing?.blurb}</p>
              </div>
              <AudioLines aria-hidden className="mt-1 size-6 shrink-0 text-accent" />
            </div>

            <div className="mt-4 h-0.5 overflow-hidden bg-line" aria-hidden>
              <div className="vein-level h-full origin-left bg-accent" style={{ transform: `scaleX(${level})` }} />
            </div>

            {playing && <Wave peaks={playing.peaks} progress={progress} />}

            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted tabular-nums">
              <span>
                {clock.running && clock.cueId === playing?.id ? stamp(clock.position) : "0:00"}
                {" / "}
                {stamp(playing?.duration ?? 0)}
              </span>
              {playing && (
                <span>
                  {playing.bpm} · {playing.meter[0]}/{playing.meter[1]}
                  {clock.running && clock.cueId === playing.id ? ` · bar ${bar} of ${playing.bars}, beat ${beatIn}` : ""}
                </span>
              )}
              <span>{playing?.loop ? "Loops at the file edge" : "Plays once"}</span>
            </p>

            <p className="mt-3 text-sm leading-relaxed text-fg" aria-live="polite">
              {status}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <DeskButton
                label={engaged && currentId === playing?.id ? "Replay" : "Play"}
                icon={Play}
                primary
                onClick={() => playing && gesturePlay(playing)}
              />
              <DeskButton label="Stop" icon={Square} onClick={() => engine.stop()} />
              <DeskButton label="Previous" icon={SkipBack} onClick={() => step(-1)} />
              <DeskButton label="Next" icon={SkipForward} onClick={() => step(1)} />
              <DeskButton
                label={walking ? "Walking" : "Walk"}
                icon={AudioLines}
                primary={walking}
                onClick={() => {
                  engine.unlock();
                  setWalking((on) => !on);
                  if (!engaged && playing) gesturePlay(playing);
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <DeskButton
                label={state.muted ? "Unmute" : "Mute"}
                icon={state.muted ? VolumeX : Volume2}
                onClick={() => {
                  engine.unlock();
                  engine.mute();
                }}
              />
              <DeskButton
                label={state.userSuspended ? "Resume" : "Suspend"}
                icon={state.userSuspended ? Play : Pause}
                onClick={() => {
                  if (state.userSuspended) void engine.resume();
                  else engine.suspend();
                }}
              />
              <DeskButton
                label={state.menu ? "Close menu" : "Menu"}
                icon={Menu}
                primary={state.menu}
                onClick={() => {
                  engine.unlock();
                  void engine.preloadUtilities().then(() => engine.setMenu(!state.menu));
                }}
              />
              <DeskButton
                label="Death"
                icon={HeartCrack}
                onClick={() => {
                  engine.unlock();
                  void engine.preloadUtilities().then(() => engine.interruptDeath());
                }}
              />
            </div>
            <p className="mt-3 text-sm text-muted">Space replays. Arrows move. 1–3 set the layers. M mutes. W walks.</p>
          </article>

          <div className="order-3 flex flex-col gap-4 md:col-start-2 md:row-start-3">
          <article className="rounded-desk border border-line bg-surface p-4">
            <h3 className="text-sm text-muted">Layers</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Same loop, more of the place. Higher layers add. They do not replace the bed. A new place opens at the level it was written, unless you pin one.
            </p>
            <p className="mt-2 text-base text-fg">{audible}</p>
            <div className="mt-3 flex flex-col gap-2">
              {(playing?.layers || []).map((layer, index) => {
                const stacked = shown >= layer.intensity;
                return (
                  <div key={layer.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`min-h-11 flex-1 rounded-control px-3 text-left text-sm transition-colors ${stacked ? "bg-accent text-accent-ink" : "bg-raised text-fg"}`}
                      onClick={() => {
                        setPinned(layer.intensity as Intensity);
                        engine.setIntensity(layer.intensity as Intensity);
                      }}
                    >
                      <span className="tabular-nums">{layer.intensity}</span> {layer.label}
                    </button>
                    <button
                      type="button"
                      className={`min-h-11 rounded-control px-3 text-sm transition-colors ${state.solo === index ? "bg-accent text-accent-ink" : "bg-raised text-fg"}`}
                      onClick={() => engine.setSolo(state.solo === index ? null : index)}
                      aria-pressed={state.solo === index}
                    >
                      Solo
                    </button>
                  </div>
                );
              })}
            </div>
            {pinned !== null && (
              <button
                type="button"
                className="mt-3 min-h-11 text-left text-sm text-muted"
                onClick={() => {
                  setPinned(null);
                  if (playing) engine.setIntensity(playing.defaultIntensity);
                }}
              >
                Back to the written level
              </button>
            )}
          </article>

          <article className="rounded-desk border border-line bg-surface p-4">
            <h3 className="text-sm text-muted">How this place uses the motifs</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {CONTOUR.map((motif) => {
                const active = Boolean(reading?.on.includes(motif.id));
                return (
                  <div key={motif.id} className={active ? "text-fg" : "text-muted"}>
                    <Contour steps={motif.steps} active={active} />
                    <p className="mt-1 text-sm">{motif.name}</p>
                  </div>
                );
              })}
            </div>
            {reading && (
              <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-3 text-sm leading-relaxed">
                <li>
                  <span className="text-fg">Ellis. </span>
                  <span className="text-muted">{reading.ellis}</span>
                </li>
                <li>
                  <span className="text-fg">Vein. </span>
                  <span className="text-muted">{reading.vein}</span>
                </li>
                <li>
                  <span className="text-fg">Voice. </span>
                  <span className="text-muted">{reading.voice}</span>
                </li>
              </ul>
            )}
          </article>

          <article className="rounded-desk border border-line bg-surface p-4">
            <h3 className="text-sm text-muted">Measured, not mastered</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {failures === null
                ? "The file check has not loaded."
                : failures === 0
                  ? "File checks passed. Peaks stay under full scale, and the loop joins are inside the step of the music itself. This is not a listening panel and not a mastering report."
                  : `${failures} file check${failures === 1 ? "" : "s"} failed.`}
            </p>
            {measure && (
              <p className="mt-3 text-sm text-fg tabular-nums">
                {playing?.title} · {measure.mix.seconds.toFixed(1)}s · peak {measure.mix.peakDbfs} dB · RMS {measure.mix.rmsDbfs} dB
                {measure.motifs && measure.motifs.checked > 0 ? ` · motif tones ${measure.motifs.passed}/${measure.motifs.checked}` : ""}
                {measure.loop && measure.mix.loopJoin
                  ? ` · loop join ${measure.mix.loopJoin.map((side) => side.ratio.toFixed(2)).join(" / ")}`
                  : ""}
              </p>
            )}
          </article>
          </div>
      </div>
    </main>
  );
}

function DeskButton({
  label,
  icon: Icon,
  onClick,
  primary = false,
}: {
  label: string;
  icon: typeof Play;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm transition-colors ${primary ? "bg-accent text-accent-ink" : "bg-raised text-fg"}`}
    >
      <Icon aria-hidden className="size-4" />
      {label}
    </button>
  );
}

function Wave({ peaks, progress }: { peaks: number[]; progress: number }) {
  const max = Math.max(0.001, ...peaks);
  const head = Math.min(1, Math.max(0, progress));
  return (
    <div className="mt-4 flex h-16 items-end gap-px" role="img" aria-label="Waveform with playhead">
      {peaks.map((peak, i) => {
        const played = (i + 0.5) / peaks.length <= head;
        return (
          <span
            key={i}
            className={`flex-1 ${played ? "bg-accent" : "bg-muted/40"}`}
            style={{ height: `${Math.max(8, (peak / max) * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

function Contour({ steps, active }: { steps: number[]; active: boolean }) {
  const width = 120;
  const height = 44;
  const min = Math.min(0, ...steps);
  const max = Math.max(0, ...steps);
  const span = Math.max(1, max - min);
  const points = steps
    .map((step, i) => {
      const x = 4 + (i / (steps.length - 1)) * (width - 8);
      const y = 4 + ((max - step) / span) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`h-12 w-full ${active ? "text-accent" : "text-line"}`} aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}
