import { useEffect, useMemo, useRef, useState } from "react";
import book from "../www/manifest.json";

type Box = { x: number; y: number; w: number; h: number; source?: string };

type SheetRef = {
  src: string;
  cols: number;
  rows: number;
  cell: number[];
  hurt: (Box | null)[];
  hit?: Box;
  facing?: string;
  order?: string[];
};

type Actor = {
  id: string;
  name: string;
  family: string;
  tier: "ordinary" | "boss";
  phase: string | null;
  scale: number;
  silhouette: string;
  tell: string;
  tellChannels: string[];
  attackFacing: "south" | "east" | "west" | "north";
  notes: string;
  groundTell: string | null;
  anchors: Record<string, number[]>;
  locomotion: SheetRef;
  actions: SheetRef;
  timing: Record<string, { sheet: string; frames: number[]; fps: number; loop: boolean; damage: boolean; holdMs?: number }>;
  directionsMove: string[];
  directionsAttack: string[];
  mirrorAttack: boolean;
  unfinished: string[];
};

type Manifest = {
  sourceGap: string;
  canon: {
    ordinaryDrawn: number;
    bossesDrawn: number;
    claimedComplete: boolean;
    unnamedUnstartedOrdinary: number;
    unnamedUnstartedBosses: number;
    whyUnnamed: string;
    ordinaryTargetIfForty: number;
    bossTargetIfSixteen: number;
  };
  actors: Actor[];
  vfx: Record<string, { src: string; rows: number; cols: number; frames: number }>;
  backgrounds: { id: string; src: string }[];
  vfxPolicy: Record<string, string>;
  projectileRows: { id: string; row: number; family: string }[];
  statusCells: { id: string; index: number; shape: string }[];
  groundTellCells: { id: string; index: number }[];
};

type Phase = "idle" | "move" | "anticipate" | "attack" | "recover" | "hurt" | "defeat";
type Dir = "south" | "west" | "east" | "north";

type Report = {
  phase: string;
  damage: boolean;
  flash: number;
  overlap: string;
  contrast: string;
  cue: string;
  spritePx: number;
};

const PHASES: Phase[] = ["idle", "move", "anticipate", "attack", "recover", "hurt", "defeat"];
const DIRS: Dir[] = ["south", "west", "east", "north"];
type Run = "wander" | "tell" | "plate";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Idle",
  move: "Move",
  anticipate: "Tell",
  attack: "Strike",
  recover: "Recover",
  hurt: "Hurt",
  defeat: "Defeat",
};

const FAMILY_GROUND: Record<string, string> = {
  "Quarry stone": "quarry",
  Water: "shore",
  "Agricultural mechanisms": "barn",
  Insects: "barn",
  Memories: "shore",
  "Surveyor constructs": "survey",
};

const ACTION_PHASES: Phase[] = ["idle", "anticipate", "attack", "recover", "hurt", "defeat"];

const PRESETS: { id: string; label: string; bg: string; a: string; b: string }[] = [
  { id: "quarry", label: "Quarry", bg: "quarry", a: "rubble-mite", b: "kiln-crab" },
  { id: "shore", label: "Shore", bg: "shore", a: "shore-lamprey", b: "puddle-warden" },
  { id: "barn", label: "Barn", bg: "barn", a: "tedder", b: "thresh-regent" },
  { id: "survey", label: "Survey", bg: "survey", a: "rodman", b: "the-sentinel" },
  { id: "memory", label: "Memory", bg: "shore", a: "winter-footstep", b: "lake-memory" },
  { id: "insect", label: "Insect", bg: "barn", a: "marblefly", b: "borer-grub" },
];

const cache = new Map<string, HTMLImageElement>();

function loadImage(src: string, onReady: () => void) {
  const key = src;
  const hit = cache.get(key);
  if (hit?.complete && hit.naturalWidth) return hit;
  if (hit) return hit;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  img.onload = onReady;
  cache.set(key, img);
  return img;
}

function asset(path: string) {
  return `/enemy-presentation/${path}`;
}

export function Studio() {
  const [manifest] = useState<Manifest>(book as Manifest);
  const [tab, setTab] = useState<"encounter" | "atlases" | "coverage">("encounter");
  const [actorId, setActorId] = useState("the-sentinel");
  const [neighborId, setNeighborId] = useState("rodman");
  const [bgId, setBgId] = useState("survey");
  const [dir, setDir] = useState<Dir>("east");
  const [pinned, setPinned] = useState<Phase | "play">("play");
  const [connect, setConnect] = useState(true);
  const [guides, setGuides] = useState(true);
  const [gray, setGray] = useState(false);
  const [clutter, setClutter] = useState(false);
  const [statusOn, setStatusOn] = useState(false);
  const [phone, setPhone] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [run, setRun] = useState<Run>("wander");
  const [slow, setSlow] = useState(false);
  const [proofOn, setProofOn] = useState(true);
  const [clock, setClock] = useState<{ phase: Phase; frac: number }>({ phase: "idle", frac: 0 });

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proofRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({
    manifest: null as Manifest | null,
    actorId: "the-sentinel",
    neighborId: "rodman",
    bgId: "survey",
    dir: "east" as Dir,
    pinned: "play" as Phase | "play",
    connect: true,
    guides: true,
    gray: false,
    clutter: false,
    statusOn: false,
    reduced: false,
    run: "wander" as Run,
    slow: false,
    proofOn: true,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    live.current = {
      manifest,
      actorId,
      neighborId,
      bgId,
      dir,
      pinned,
      connect,
      guides,
      gray,
      clutter,
      statusOn,
      reduced,
      run,
      slow,
      proofOn,
    };
  });

  useEffect(() => {
    if (!manifest) return;
    const bump = () => {
      /* cache fills; the canvas loop reads it each frame */
    };
    for (const actor of manifest.actors) {
      loadImage(asset(actor.locomotion.src), bump);
      loadImage(asset(actor.actions.src), bump);
    }
    for (const bg of manifest.backgrounds) loadImage(asset(bg.src), bump);
    for (const v of Object.values(manifest.vfx)) loadImage(asset(v.src), bump);
  }, [manifest]);

  useEffect(() => {
    if (tab !== "encounter") return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || !manifest) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let alive = true;
    let raf = 0;
    let last = performance.now();
    let playT = 0;
    let lastPhase: Phase = "idle";
    let moveFrame = 0;
    let moveAcc = 0;
    let impactT = -1;
    let dustT = -1;
    let breakT = -1;
    let splashT = -1;
    let lastLum = 0;
    let reportAcc = 0;
    let uiAcc = 0;

    const resize = () => {
      const width = stage.clientWidth;
      const height = Math.max(260, Math.round(width * (width < 720 ? 0.92 : 0.62)));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.height = `${height}px`;
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(stage);

    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const L = live.current;
      const book = L.manifest;
      if (!book) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const actor = book.actors.find((a) => a.id === L.actorId) ?? book.actors[0];
      const neighbor = L.neighborId ? book.actors.find((a) => a.id === L.neighborId) ?? null : null;
      if (!actor) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const stepDt = L.slow && !L.reduced ? dt * 0.45 : dt;
      const sequence = buildSequence(actor, L.reduced, L.pinned, L.run);
      if (L.pinned !== "play") {
        playT = 0;
      } else {
        playT += stepDt;
        const total = sequence.reduce((s, step) => s + step.ms, 0);
        if (playT > total) {
          playT = 0;
        }
      }
      let cursor = playT;
      let phase: Phase = sequence[0]?.state ?? "idle";
      for (const step of sequence) {
        if (cursor <= step.ms) {
          phase = step.state;
          break;
        }
        cursor -= step.ms;
      }
      if (phase !== lastPhase) {
        if (phase === "attack") impactT = 0;
        if (phase === "defeat") breakT = 0;
        if (phase === "attack" && isWater(actor)) splashT = 0;
        lastPhase = phase;
      }
      if (phase === "move" && !L.reduced) {
        moveAcc += stepDt;
        if (moveAcc > 125) {
          moveAcc = 0;
          moveFrame = (moveFrame + 1) % 4;
          dustT = 0;
        }
      }
      if (impactT >= 0) impactT += stepDt;
      if (dustT >= 0) dustT += stepDt;
      if (breakT >= 0) breakT += stepDt;
      if (splashT >= 0) splashT += stepDt;

      const facing = combatFacing(actor, phase, L.dir);
      const combat = phase !== "idle" && phase !== "move";
      const unfinishedFacing =
        combat && !actor.directionsAttack.includes(L.dir) && !(actor.mirrorAttack && L.dir === "west");

      const drawOpts: DrawOpts = {
        bgId: L.bgId,
        phase,
        dir: facing,
        requestedDir: L.dir,
        moveFrame,
        guides: L.guides,
        gray: L.gray,
        connect: L.connect,
        clutter: L.clutter,
        statusOn: L.statusOn,
        reduced: L.reduced,
        impactT,
        dustT,
        breakT,
        splashT,
        unfinishedFacing,
      };
      drawEncounter(ctx, canvas, book, actor, neighbor, drawOpts);

      const proof = proofRef.current;
      if (L.proofOn && proof) drawProof(proof, book, actor, drawOpts);

      uiAcc += dt;
      if (uiAcc > 80) {
        uiAcc = 0;
        const total = sequence.reduce((s, step) => s + step.ms, 0) || 1;
        const frac = L.pinned === "play" && !L.reduced ? Math.min(0.999, playT / total) : 0;
        if (alive) {
          setClock((prev) => (prev.phase === phase && Math.abs(prev.frac - frac) < 0.012 ? prev : { phase, frac }));
        }
      }

      reportAcc += dt;
      if (reportAcc > 280 && alive) {
        reportAcc = 0;
        const flash = sampleFlash(ctx, canvas, lastLum);
        lastLum = flash.mean;
        const cssW = canvas.clientWidth || canvas.width;
        const spritePx = Math.round(cssW * actor.scale);
        setReport({
          phase,
          damage: phase === "attack" && L.connect,
          flash: flash.delta,
          overlap: flash.overlap,
          contrast: flash.contrast,
          cue: cueFor(actor, phase, facing, L.connect, unfinishedFacing),
          spritePx,
        });
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [manifest, tab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) return;
      const book = live.current.manifest;
      if (!book) return;
      if (e.key === " ") {
        e.preventDefault();
        setPinned("play");
        setTab("encounter");
      } else if (e.key >= "1" && e.key <= "7") {
        const phase = PHASES[Number(e.key) - 1];
        setPinned(phase);
        setClock({ phase, frac: 0 });
        setTab("encounter");
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const next: Dir =
          e.key === "ArrowLeft" ? "west" : e.key === "ArrowRight" ? "east" : e.key === "ArrowUp" ? "north" : "south";
        setDir(next);
      } else if (e.key === "g" || e.key === "G") {
        setGray((v) => !v);
      } else if (e.key === "h" || e.key === "H") {
        setSlow((v) => !v);
      } else if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const i = book.actors.findIndex((a) => a.id === live.current.actorId);
        const j = e.key === "]" ? (i + 1) % book.actors.length : (i - 1 + book.actors.length) % book.actors.length;
        const next = book.actors[j];
        if (!next) return;
        setActorId(next.id);
        setBgId(FAMILY_GROUND[next.family] ?? live.current.bgId);
        if (next.id === "the-sentinel") setDir("east");
        setNeighborId((curr) =>
          curr === next.id
            ? (book.actors.find((a) => a.id !== next.id && a.family === next.family)?.id ?? curr)
            : curr,
        );
        setTab("encounter");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const actor = manifest?.actors.find((a) => a.id === actorId) ?? null;

  const families = useMemo(() => {
    if (!manifest) return [];
    const order = ["Quarry stone", "Water", "Agricultural mechanisms", "Insects", "Memories", "Surveyor constructs"];
    return order.map((family) => ({
      family,
      actors: manifest.actors.filter((a) => a.family === family),
    }));
  }, [manifest]);

  if (!actor) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-serif text-3xl text-paper">That plate is not in this batch</h1>
      </main>
    );
  }

  const displayPhase: Phase = pinned === "play" ? clock.phase : pinned;
  const facingNow = combatFacing(actor, displayPhase, dir);
  const unfinishedNow =
    displayPhase !== "idle" &&
    displayPhase !== "move" &&
    !actor.directionsAttack.includes(dir) &&
    !(actor.mirrorAttack && dir === "west");
  const liveCue = cueFor(actor, displayPhase, facingNow, connect, unfinishedNow);
  const damageOpen = displayPhase === "attack" && connect;
  const beat = buildSequence(actor, false, "play", run);
  const beatTotal = beat.reduce((sum, step) => sum + step.ms, 0) || 1;
  const drawn = manifest.canon.ordinaryDrawn + manifest.canon.bossesDrawn;
  const aimed = manifest.canon.ordinaryTargetIfForty + manifest.canon.bossTargetIfSixteen;

  function openPlate(id: string, phase: Phase | "play" = "play", nextRun?: Run, facing?: Dir) {
    const next = manifest.actors.find((a) => a.id === id);
    if (!next) return;
    setActorId(next.id);
    const ground = FAMILY_GROUND[next.family];
    if (ground) setBgId(ground);
    if (facing) setDir(facing);
    else if (next.id === "the-sentinel" && phase !== "move" && phase !== "idle") setDir("east");
    setNeighborId((curr) =>
      curr === next.id
        ? (manifest.actors.find((a) => a.id !== next.id && a.family === next.family)?.id ?? curr)
        : curr,
    );
    if (nextRun) setRun(nextRun);
    if (phase === "play") setPinned("play");
    else {
      setPinned(phase);
      setClock({ phase, frac: 0 });
    }
    setTab("encounter");
  }

  let beatCursor = 0;

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-5">
      <header className="border-b border-line pb-4">
        <p className="text-xs tracking-widest text-hay uppercase">Addison County · plate 14</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-serif text-3xl leading-none text-paper sm:text-4xl">Enemy presentation</h1>
          <p className="max-w-sm text-sm text-mist">
            {drawn} plates drawn. {aimed - drawn} still unnamed — no approved list, so they are not invented here.
          </p>
        </div>
      </header>

      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Field book sections">
        {(
          [
            ["encounter", "Encounter"],
            ["atlases", "Atlases"],
            ["coverage", "Coverage"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`min-h-11 px-4 text-sm ${tab === id ? "bg-paper text-ink" : "bg-panel text-paper"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "encounter" && (
        <section className="mt-4">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Roster">
            {families.map((group) => (
              <div key={group.family} className="flex shrink-0 gap-2">
                {group.actors.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => openPlate(a.id)}
                    aria-pressed={a.id === actorId}
                    className={`flex min-h-11 shrink-0 items-center gap-2 border px-2 py-1 text-left ${
                      a.id === actorId ? "border-hay bg-panel text-paper" : "border-line text-mist"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-11 w-11 shrink-0"
                      style={{
                        backgroundImage: `url(${asset(a.actions.src)})`,
                        backgroundSize: "300% 200%",
                        backgroundPosition: "0 0",
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                    <span>
                      <span className="block text-sm leading-tight">{a.name}</span>
                      <span className={`block text-xs ${a.tier === "boss" ? "text-hay" : "text-mist"}`}>
                        {a.tier === "boss" ? a.phase : a.family.split(" ")[0]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <div className={`mx-auto ${phone ? "max-w-sm" : "max-w-none"}`}>
                <div ref={stageRef} className="relative w-full overflow-hidden bg-ink">
                  <canvas ref={canvasRef} className="block w-full" aria-label="Encounter preview" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                    <p className="bg-field/90 px-2 py-1 font-serif text-lg leading-none text-paper">{actor.name}</p>
                    <p className={`bg-field/90 px-2 py-1 text-xs tracking-widest uppercase ${damageOpen ? "text-hay" : "text-mist"}`}>
                      Damage {damageOpen ? "open" : "closed"}
                    </p>
                  </div>
                  {unfinishedNow && (
                    <p className="absolute top-12 left-2 bg-field/90 px-2 py-1 text-sm text-paper">
                      {dir} strike is not on the sheet
                    </p>
                  )}
                </div>
                {phone && <p className="mt-1 text-center text-xs text-mist">Phone column. The plates still use their real scale.</p>}
              </div>

              <p className="mt-3 text-sm text-paper">{actor.tell}</p>
              <p className="mt-1 text-sm">
                <span className="text-hay">{PHASE_LABEL[displayPhase]}</span>
                <span className="text-mist"> · {liveCue}</span>
                {slow && pinned === "play" && <span className="text-mist"> · half speed</span>}
                {reduced && <span className="text-mist"> · held for reduced motion</span>}
              </p>

              {proofOn && (
                <div className="mt-3 flex items-center gap-3">
                  <canvas
                    ref={proofRef}
                    width={320}
                    height={192}
                    className="h-24 w-40 border border-line bg-field"
                    aria-label="Grayscale proof of the same pose, enlarged so the shape can be read"
                  />
                  <p className="max-w-xs text-sm text-mist">
                    Color removed, pose enlarged. The tell has to survive this. Not a scale comparison.
                  </p>
                </div>
              )}

              <div className="relative mt-3" aria-label="Beat">
                <div className="flex h-11 overflow-hidden border border-line">
                  {beat.map((step, index) => {
                    const start = beatCursor / beatTotal;
                    beatCursor += step.ms;
                    const width = (step.ms / beatTotal) * 100;
                    const hot =
                      pinned === "play" && !reduced
                        ? clock.frac >= start && clock.frac < start + width / 100 + 0.0001 && clock.phase === step.state
                        : pinned === step.state || (reduced && step.state === "anticipate");
                    const label = PHASE_LABEL[step.state];
                    return (
                      <button
                        key={`${step.state}-${index}`}
                        type="button"
                        title={
                          step.state === "defeat" && !actor.timing.defeat.holdMs
                            ? "Playback defeat. No approved duration — held so the pose can be read."
                            : `Playback ${label}, ${step.ms} ms`
                        }
                        onClick={() => {
                          setPinned(step.state);
                          setClock({ phase: step.state, frac: 0 });
                        }}
                        style={{ width: `${width}%` }}
                        className={`min-w-0 overflow-hidden border-b-2 px-1 text-xs ${
                          hot
                            ? "border-hay bg-hay text-ink"
                            : step.state === "attack"
                              ? "border-hay bg-panel text-hay"
                              : step.state === "anticipate"
                                ? "border-transparent bg-panel text-lake"
                                : "border-transparent bg-panel text-mist"
                        }`}
                      >
                        {width > 11 ? label : <span className="sr-only">{label}</span>}
                      </button>
                    );
                  })}
                </div>
                {pinned === "play" && !reduced && (
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-paper"
                    style={{ left: `${clock.frac * 100}%` }}
                  />
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["wander", "Wander"],
                    ["tell", "Read the tell"],
                    ["plate", "Full plate"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setRun(id);
                      setPinned("play");
                    }}
                    className={`min-h-11 px-3 text-sm ${
                      run === id && pinned === "play"
                        ? id === "tell"
                          ? "bg-hay text-ink"
                          : "bg-paper text-ink"
                        : "bg-panel text-paper"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <Chip label="Half speed" on={slow} set={setSlow} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2" aria-label="Pin a state">
                {PHASES.map((phase, index) => (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => {
                      setPinned(phase);
                      setClock({ phase, frac: 0 });
                    }}
                    className={`min-h-11 px-3 text-sm ${pinned === phase ? "bg-hay text-ink" : "bg-panel text-paper"}`}
                  >
                    {index + 1} {PHASE_LABEL[phase]}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2" aria-label="Facing">
                {DIRS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDir(d)}
                    aria-pressed={dir === d}
                    className={`min-h-11 px-3 text-sm capitalize ${dir === d ? "bg-lake text-ink" : "bg-panel text-paper"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Chip label="Connects" on={connect} set={setConnect} />
                <Chip label="Guides" on={guides} set={setGuides} />
                <Chip label="Grayscale scene" on={gray} set={setGray} />
                <Chip label="Gray plate" on={proofOn} set={setProofOn} />
                <Chip label="Reduced motion" on={reduced} set={setReduced} />
                <Chip label="Phone column" on={phone} set={setPhone} />
                <Chip label="Status sample" on={statusOn} set={setStatusOn} />
                <Chip label="Clutter test" on={clutter} set={setClutter} />
              </div>
              <p className="mt-2 text-xs text-mist">
                Space plays. 1–7 pin a state. Arrows face. G grays the scene. H is half speed. Brackets change plates.
              </p>
            </div>

            <aside className="bg-panel p-3 text-sm">
              <p className="text-xs tracking-widest text-hay uppercase">
                {actor.tier === "boss" ? `${actor.phase} boss` : "Ordinary"} · {actor.family}
              </p>
              <h2 className="mt-1 font-serif text-2xl text-paper">{actor.name}</h2>
              <p className="mt-2 text-mist">{actor.silhouette}</p>
              <p className="mt-3 text-mist">
                Channels: {actor.tellChannels.join(", ")}. Tell hold {actor.timing.anticipate.holdMs} ms. Strike{" "}
                {actor.timing.attack.holdMs} ms, and only then can damage open.
              </p>
              <p className="mt-3 text-paper">{actor.notes}</p>

              {report && (
                <dl className="mt-4 grid grid-cols-[7rem_1fr] gap-y-1 border-t border-line pt-3 text-sm tabular-nums">
                  <dt className="text-mist">Phase</dt>
                  <dd>{PHASE_LABEL[displayPhase]}</dd>
                  <dt className="text-mist">Cue</dt>
                  <dd>{liveCue}</dd>
                  <dt className="text-mist">Damage</dt>
                  <dd>{damageOpen ? "Window open" : "Closed"}</dd>
                  <dt className="text-mist">Flash</dt>
                  <dd>
                    {report.flash.toFixed(3)} {report.flash > 0.22 ? "— hot" : "— calm"}
                  </dd>
                  <dt className="text-mist">Silhouettes</dt>
                  <dd>{report.overlap}</dd>
                  <dt className="text-mist">Ground</dt>
                  <dd>{report.contrast}</dd>
                  <dt className="text-mist">On-screen</dt>
                  <dd>{report.spritePx}px tall</dd>
                </dl>
              )}

              <h3 className="mt-4 text-xs tracking-widest text-hay uppercase">Still unfinished on this plate</h3>
              <ul className="mt-1 list-disc pl-4 text-mist">
                {actor.unfinished.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>

              <label className="mt-4 block">
                <span className="text-mist">Neighbor, for silhouette</span>
                <select
                  className="mt-1 min-h-11 w-full bg-field px-2 text-paper"
                  value={neighborId}
                  onChange={(e) => setNeighborId(e.target.value)}
                >
                  <option value="">None</option>
                  {manifest.actors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block">
                <span className="text-mist">Ground</span>
                <select
                  className="mt-1 min-h-11 w-full bg-field px-2 text-paper"
                  value={bgId}
                  onChange={(e) => setBgId(e.target.value)}
                >
                  {manifest.backgrounds.map((bg) => (
                    <option key={bg.id} value={bg.id}>
                      {bg.id}
                    </option>
                  ))}
                </select>
              </label>
            </aside>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="min-h-11 bg-panel px-3 text-sm text-paper"
                onClick={() => {
                  setBgId(preset.bg);
                  setActorId(preset.a);
                  setNeighborId(preset.b);
                  setPinned("play");
                  setRun("wander");
                  if (preset.a === "the-sentinel" || preset.b === "the-sentinel") setDir("east");
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === "atlases" && (
        <section className="mt-4 space-y-8">
          <p className="max-w-3xl text-sm text-mist">
            Click a cell to open that pose. Locomotion rows run south, west, east, north. The action sheet is idle,
            tell, strike, recover, hurt, defeat. Effects stay off the body.
          </p>
          {manifest.actors.map((a) => (
            <article key={a.id} className="border-t border-line pt-4">
              <h2 className="font-serif text-2xl">
                {a.name} <span className="text-base text-mist">{a.tier === "boss" ? a.phase : a.family}</span>
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <figure>
                  <div className="checker relative">
                    <img src={asset(a.locomotion.src)} alt="" className="w-full" />
                    <div className="absolute inset-0 grid grid-rows-4">
                      {DIRS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          aria-label={`${a.name} walk ${d}`}
                          className="bg-transparent hover:bg-field/50"
                          onClick={() => openPlate(a.id, "move", undefined, d)}
                        />
                      ))}
                    </div>
                  </div>
                  <figcaption className="mt-1 text-xs text-mist">Movement · south, west, east, north</figcaption>
                </figure>
                <figure>
                  <div className="checker relative">
                    <img src={asset(a.actions.src)} alt="" className="w-full" />
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
                      {ACTION_PHASES.map((phase) => (
                        <button
                          key={phase}
                          type="button"
                          aria-label={`${a.name} ${PHASE_LABEL[phase]}`}
                          className="bg-transparent text-xs text-transparent hover:bg-field/50 hover:text-paper"
                          onClick={() => openPlate(a.id, phase, "tell")}
                        >
                          {PHASE_LABEL[phase]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <figcaption className="mt-1 text-xs text-mist">
                    Actions facing {a.attackFacing}
                    {a.mirrorAttack ? ", west mirrored" : ""}
                  </figcaption>
                </figure>
              </div>
            </article>
          ))}
          <h2 className="font-serif text-2xl">Reusable effects</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(manifest.vfx).map(([name, sheet]) => (
              <figure key={name} className="checker">
                <img src={asset(sheet.src)} alt={`${name} effect sheet`} className="w-full" />
                <figcaption className="mt-1 bg-field text-xs text-mist">{name}</figcaption>
              </figure>
            ))}
          </div>
          <ul className="max-w-3xl space-y-2 text-sm text-mist">
            {Object.entries(manifest.vfxPolicy).map(([name, policy]) => (
              <li key={name}>
                <span className="text-paper">{name}. </span>
                {policy}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "coverage" && (
        <section className="mt-4">
          <p className="max-w-3xl text-sm text-mist">{manifest.canon.whyUnnamed}</p>
          <p className="mt-3 max-w-3xl text-sm text-paper">{manifest.sourceGap}</p>
          <div className="mt-4 h-1 bg-line" aria-hidden>
            <div className="h-1 bg-hay" style={{ width: `${Math.round((drawn / aimed) * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-mist">
            {drawn} of {aimed} drawn. Claimed complete: {manifest.canon.claimedComplete ? "yes" : "no"}.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat k="Ordinary drawn" v={`${manifest.canon.ordinaryDrawn}`} />
            <Stat k="Bosses drawn" v={`${manifest.canon.bossesDrawn}`} />
            <Stat k="Ordinary unstarted" v={`${manifest.canon.unnamedUnstartedOrdinary} unnamed`} />
            <Stat k="Bosses unstarted" v={`${manifest.canon.unnamedUnstartedBosses} unnamed`} />
          </dl>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="text-mist">
                <tr>
                  <th className="border-b border-line py-2 pr-3 font-normal">Name</th>
                  <th className="border-b border-line py-2 pr-3 font-normal">Family</th>
                  <th className="border-b border-line py-2 pr-3 font-normal">Place</th>
                  <th className="border-b border-line py-2 pr-3 font-normal">States</th>
                  <th className="border-b border-line py-2 pr-3 font-normal">Move</th>
                  <th className="border-b border-line py-2 pr-3 font-normal">Strike facing</th>
                  <th className="border-b border-line py-2 font-normal">Tell, not color alone</th>
                </tr>
              </thead>
              <tbody>
                {manifest.actors.map((a) => (
                  <tr
                    key={a.id}
                    className="cursor-pointer align-top hover:bg-panel"
                    onClick={() => openPlate(a.id, "anticipate", "tell")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openPlate(a.id, "anticipate", "tell");
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="border-b border-line py-2 pr-3">{a.name}</td>
                    <td className="border-b border-line py-2 pr-3">{a.family}</td>
                    <td className="border-b border-line py-2 pr-3">{a.tier === "boss" ? a.phase : "ordinary"}</td>
                    <td className="border-b border-line py-2 pr-3">idle through defeat</td>
                    <td className="border-b border-line py-2 pr-3">S W E N</td>
                    <td className="border-b border-line py-2 pr-3">
                      {a.directionsAttack.join(", ")}
                      {a.mirrorAttack ? " (west mirrored)" : ""}
                    </td>
                    <td className="border-b border-line py-2">{a.tellChannels.join(" · ")}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-3 text-mist" colSpan={7}>
                    Unfinished ordinary: {manifest.canon.unnamedUnstartedOrdinary} members with no approved names, no
                    sheets, no tells. Unfinished bosses: {manifest.canon.unnamedUnstartedBosses}, same gap. A shared
                    effect sheet does not complete them.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-panel px-3 py-2">
      <dt className="text-[0.68rem] tracking-[0.14em] text-mist uppercase">{k}</dt>
      <dd className="font-serif text-xl text-paper">{v}</dd>
    </div>
  );
}

function Chip({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => set(!on)}
      className={`min-h-11 px-3 text-sm ${on ? "bg-paper text-ink" : "bg-panel text-mist"}`}
    >
      {label}
    </button>
  );
}

function isWater(actor: Actor) {
  return actor.family === "Water" || actor.id === "lake-memory";
}

function isQuarry(actor: Actor) {
  return actor.family === "Quarry stone";
}

function buildSequence(actor: Actor, reduced: boolean, pinned: Phase | "play", run: Run = "wander") {
  if (pinned !== "play") return [{ state: pinned, ms: 10_000 }];
  if (reduced) return [{ state: "anticipate" as Phase, ms: 10_000 }];
  const tell = actor.timing.anticipate.holdMs ?? 640;
  const strike = actor.timing.attack.holdMs ?? 180;
  const recover = actor.timing.recover.holdMs ?? 380;
  const hurt = actor.timing.hurt.holdMs || 320;
  const defeat = actor.timing.defeat.holdMs || 760;
  if (run === "tell") {
    return [
      { state: "idle" as Phase, ms: 360 },
      { state: "anticipate" as Phase, ms: tell },
      { state: "attack" as Phase, ms: strike },
      { state: "recover" as Phase, ms: recover },
    ];
  }
  const wander = [
    { state: "idle" as Phase, ms: 520 },
    { state: "move" as Phase, ms: 860 },
    { state: "anticipate" as Phase, ms: tell },
    { state: "attack" as Phase, ms: strike },
    { state: "recover" as Phase, ms: recover },
    { state: "idle" as Phase, ms: 640 },
  ];
  if (run === "plate") {
    return [...wander, { state: "hurt" as Phase, ms: hurt }, { state: "defeat" as Phase, ms: defeat }];
  }
  return wander;
}

function cueFor(actor: Actor, phase: Phase, facing: Dir, connect: boolean, unfinished: boolean) {
  if (unfinished) return `${facing} strike is not drawn`;
  if (phase === "anticipate") return actor.groundTell ? "TELL — shape and ground mark, no damage" : "TELL — no damage";
  if (phase === "attack") return connect ? "HIT WINDOW" : "WHIFF — spark withheld";
  if (phase === "hurt") return "hurt pose, damage closed";
  if (phase === "defeat") return "defeat pose, damage closed";
  return "clear";
}

function combatFacing(actor: Actor, phase: Phase, dir: Dir): Dir {
  const combat = phase !== "idle" && phase !== "move";
  if (!combat) return dir;
  if (actor.attackFacing === "east") {
    if (dir === "west") return "west";
    if (dir === "east") return "east";
    return "east";
  }
  return "south";
}

type DrawOpts = {
  bgId: string;
  phase: Phase;
  dir: Dir;
  requestedDir: Dir;
  moveFrame: number;
  guides: boolean;
  gray: boolean;
  connect: boolean;
  clutter: boolean;
  statusOn: boolean;
  reduced: boolean;
  impactT: number;
  dustT: number;
  breakT: number;
  splashT: number;
  unfinishedFacing: boolean;
};

function drawEncounter(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  book: Manifest,
  actor: Actor,
  neighbor: Actor | null,
  opts: DrawOpts,
) {
  const w = canvas.width;
  const h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.filter = "none";
  const bg = book.backgrounds.find((b) => b.id === opts.bgId);
  const bgImg = bg ? cache.get(asset(bg.src)) : undefined;
  ctx.imageSmoothingEnabled = true;
  if (bgImg && bgImg.complete && bgImg.naturalWidth) {
    ctx.drawImage(bgImg, 0, 0, w, h);
  } else {
    ctx.fillStyle = "#1a2422";
    ctx.fillRect(0, 0, w, h);
  }

  const groundSample = sampleRegion(ctx, Math.round(w * 0.28), Math.round(h * 0.58), 24, 16);

  if (opts.gray) ctx.filter = "grayscale(1)";
  ctx.imageSmoothingEnabled = false;

  const primary = placeActor(ctx, book, actor, w * 0.38, h * 0.78, opts, true);
  let overlap = "separated";
  if (neighbor && neighbor.id !== actor.id) {
    const otherPhase: Phase = opts.phase === "move" ? "move" : "idle";
    const other = placeActor(
      ctx,
      book,
      neighbor,
      w * 0.68,
      h * 0.78,
      { ...opts, phase: otherPhase, impactT: -1, splashT: -1, breakT: -1, clutter: false, statusOn: false },
      false,
    );
    if (primary && other && rectsOverlap(primary.opaque, other.opaque)) overlap = "opaque boxes overlap — pull them apart";
    else overlap = "opaque boxes clear";
  }

  ctx.filter = "none";
  ctx.imageSmoothingEnabled = true;

  const contrast = contrastNote(primary?.lum ?? 0, groundSample);
  (canvas as HTMLCanvasElement & { __report?: { overlap: string; contrast: string } }).__report = { overlap, contrast };
}

function placeActor(
  ctx: CanvasRenderingContext2D,
  book: Manifest,
  actor: Actor,
  feetX: number,
  feetY: number,
  opts: DrawOpts,
  primary: boolean,
  sample = true,
) {
  const pose = poseOf(actor, opts.phase, opts.dir, opts.moveFrame);
  const img = cache.get(asset(pose.src));
  if (!img || !img.complete || !img.naturalWidth) return null;
  const cssW = ctx.canvas.clientWidth || ctx.canvas.width;
  const px = ctx.canvas.width / cssW;
  const dw = Math.max(1, Math.round(cssW * actor.scale * px));
  const dh = dw;
  feetX = Math.round(feetX);
  feetY = Math.round(feetY);
  const dx = Math.round(feetX - dw * pose.anchorX);
  const dy = Math.round(feetY - dh * pose.anchorY);
  const mirror = actor.mirrorAttack && opts.dir === "west" && pose.sheet === "actions";

  if (primary && opts.phase === "anticipate" && actor.groundTell) {
    drawCell(ctx, book, "ground-tells", groundIndex(book, actor.groundTell), feetX, feetY, dw * 0.72, false);
  } else if (primary && opts.phase === "move" && opts.dustT >= 0 && opts.dustT < 280 && !opts.reduced) {
    const frame = Math.min(3, Math.floor(opts.dustT / 70));
    drawCell(ctx, book, "dust", frame, feetX, feetY, dw * 0.55, false);
  }

  drawCell(ctx, book, "shadow", opts.reduced ? 0 : Math.floor(opts.moveFrame) % 4, feetX, feetY + dh * 0.02, dw * 0.7, false);

  ctx.save();
  if (mirror) {
    ctx.translate(feetX, 0);
    ctx.scale(-1, 1);
    ctx.translate(-feetX, 0);
  }
  const col = pose.index % pose.cols;
  const row = Math.floor(pose.index / pose.cols);
  const sw = img.width / pose.cols;
  const sh = img.height / pose.rows;
  ctx.drawImage(img, col * sw, row * sh, sw, sh, dx, dy, dw, dh);
  ctx.restore();

  const box = pose.hurt;
  const opaque = box
    ? {
        x: dx + (mirror ? 1 - box.x - box.w : box.x) * dw,
        y: dy + box.y * dh,
        w: box.w * dw,
        h: box.h * dh,
      }
    : { x: dx + dw * 0.25, y: dy + dh * 0.2, w: dw * 0.5, h: dh * 0.6 };

  if (primary && opts.guides && box) {
    strokeBox(ctx, opaque, "#efe4d0", "HURT");
    if (opts.phase === "attack" && actor.actions.hit) {
      const hit = actor.actions.hit;
      const hb = {
        x: dx + (mirror ? 1 - hit.x - hit.w : hit.x) * dw,
        y: dy + hit.y * dh,
        w: hit.w * dw,
        h: hit.h * dh,
      };
      strokeBox(ctx, hb, "#c6a15a", "HIT");
    }
    if (opts.phase === "anticipate") {
      strokeBox(ctx, opaque, "#6ea8ae", "TELL");
    }
    const mark = (name: string, pt: number[]) => {
      const x = dx + (mirror ? 1 - pt[0] : pt[0]) * dw;
      const y = dy + pt[1] * dh;
      ctx.strokeStyle = "#c46a3a";
      ctx.lineWidth = Math.max(1, px);
      ctx.strokeRect(x - px, y - px, px * 2, px * 2);
      ctx.fillStyle = "#efe4d0";
      ctx.font = `${Math.round(11 * px)}px "Liberation Sans", sans-serif`;
      ctx.fillText(name, x + px * 3, y);
    };
    mark("feet", actor.anchors.feet);
    mark("fx", actor.anchors.origin);
  }

  if (primary && opts.phase === "attack" && opts.connect && !opts.reduced && opts.impactT >= 0 && opts.impactT < 320) {
    const frame = Math.min(3, Math.floor(opts.impactT / 80));
    const muzzle = actor.anchors.muzzle;
    const mx = dx + (mirror ? 1 - muzzle[0] : muzzle[0]) * dw;
    const my = dy + muzzle[1] * dh;
    drawCell(ctx, book, "impact", frame, mx, my, dw * 0.45, false);
    if (isWater(actor) && opts.splashT >= 0 && opts.splashT < 320) {
      drawCell(ctx, book, "splash", Math.min(3, Math.floor(opts.splashT / 80)), mx, my, dw * 0.4, false);
    }
  }

  if (primary && opts.clutter && opts.phase === "attack") {
    drawCell(ctx, book, "splash", 2, feetX, feetY - dh * 0.2, dw * 0.9, false);
    drawCell(ctx, book, "stone-break", 1, feetX, feetY - dh * 0.25, dw * 0.9, false);
    drawCell(ctx, book, "impact", 2, feetX, feetY - dh * 0.3, dw * 0.9, false);
  }

  if (primary && opts.phase === "defeat" && isQuarry(actor) && !opts.reduced && opts.breakT >= 0 && opts.breakT < 480) {
    drawCell(ctx, book, "stone-break", Math.min(3, Math.floor(opts.breakT / 120)), feetX, feetY, dw * 0.6, false);
  }

  if (primary && opts.statusOn) {
    drawCell(ctx, book, "status", 4, feetX, dy + dh * 0.08, dw * 0.28, false);
  }

  const lum = sample ? regionLum(ctx, opaque) : 0;
  return { opaque, lum };
}

function drawProof(canvas: HTMLCanvasElement, book: Manifest, actor: Actor, opts: DrawOpts) {
  const cssW = canvas.clientWidth || 160;
  const cssH = canvas.clientHeight || 96;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.filter = "none";
  ctx.fillStyle = "#1a2422";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#24312e";
  ctx.fillRect(0, Math.round(h * 0.78), w, h);
  ctx.filter = "grayscale(1)";
  ctx.imageSmoothingEnabled = false;
  const boosted: Actor = { ...actor, scale: Math.min(0.78, Math.max(0.55, actor.scale * 1.85)) };
  placeActor(
    ctx,
    book,
    boosted,
    w * 0.5,
    h * 0.8,
    { ...opts, guides: false, gray: true, clutter: false, statusOn: false },
    true,
    false,
  );
  ctx.filter = "none";
}

function poseOf(actor: Actor, phase: Phase, dir: Dir, moveFrame: number) {
  if (phase === "move" || (phase === "idle" && false)) {
    const row = { south: 0, west: 1, east: 2, north: 3 }[dir];
    const index = row * 4 + (moveFrame % 4);
    const box = actor.locomotion.hurt[index];
    const anchor = box ? [box.x + box.w / 2, box.y + box.h] : [0.5, 0.86];
    return {
      src: actor.locomotion.src,
      cols: 4,
      rows: 4,
      index,
      sheet: "locomotion" as const,
      hurt: box,
      anchorX: anchor[0],
      anchorY: anchor[1],
    };
  }
  const timing = actor.timing[phase];
  const index = timing.frames[0] ?? 0;
  const box = actor.actions.hurt[index];
  const anchor = box ? [box.x + box.w / 2, box.y + box.h] : [0.5, 0.86];
  return {
    src: actor.actions.src,
    cols: 3,
    rows: 2,
    index,
    sheet: "actions" as const,
    hurt: box,
    anchorX: anchor[0],
    anchorY: Math.min(0.96, anchor[1]),
  };
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  book: Manifest,
  name: string,
  index: number,
  cx: number,
  cy: number,
  size: number,
  _unused: boolean,
) {
  const sheet = book.vfx[name];
  if (!sheet) return;
  const img = cache.get(asset(sheet.src));
  if (!img || !img.complete || !img.naturalWidth) return;
  const col = index % sheet.cols;
  const row = Math.floor(index / sheet.cols);
  const sw = img.width / sheet.cols;
  const sh = img.height / sheet.rows;
  ctx.drawImage(
    img,
    col * sw,
    row * sh,
    sw,
    sh,
    Math.round(cx - size / 2),
    Math.round(cy - size / 2),
    Math.max(1, Math.round(size)),
    Math.max(1, Math.round(size)),
  );
}

function groundIndex(book: Manifest, id: string) {
  return book.groundTellCells.find((cell) => cell.id === id)?.index ?? 0;
}

function strokeBox(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  color: string,
  label: string,
) {
  ctx.save();
  const px = canvasScale(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, 2 * px);
  ctx.setLineDash(label === "HIT" ? [6 * px, 4 * px] : []);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = `${Math.round(12 * px)}px "Liberation Sans", sans-serif`;
  ctx.fillText(label, box.x, Math.max(12 * px, box.y - 4 * px));
  ctx.restore();
}

function canvasScale(ctx: CanvasRenderingContext2D) {
  const css = ctx.canvas.clientWidth || ctx.canvas.width;
  return ctx.canvas.width / css;
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function sampleRegion(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const sx = Math.max(0, Math.min(cw - 2, Math.round(x)));
  const sy = Math.max(0, Math.min(ch - 2, Math.round(y)));
  const sw = Math.max(1, Math.min(w, cw - sx));
  const sh = Math.max(1, Math.min(h, ch - sy));
  const data = ctx.getImageData(sx, sy, sw, sh).data;
  let lum = 0;
  const n = sw * sh;
  for (let i = 0; i < data.length; i += 4) {
    lum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  return lum / n / 255;
}

function regionLum(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }) {
  return sampleRegion(ctx, box.x + box.w * 0.3, box.y + box.h * 0.3, Math.max(2, box.w * 0.3), Math.max(2, box.h * 0.3));
}

function contrastNote(sprite: number, ground: number) {
  if (!sprite) return "waiting for ink";
  const delta = Math.abs(sprite - ground);
  if (delta < 0.12) return "low contrast — silhouette may sink";
  return "readable against this ground";
}

function sampleFlash(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, prev: number) {
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Downsample by stride so a full-frame white flash still registers.
  const stride = Math.max(8, Math.floor(Math.sqrt((canvas.width * canvas.height) / 4000)));
  let lum = 0;
  let n = 0;
  const px = data.data;
  for (let y = 0; y < canvas.height; y += stride) {
    for (let x = 0; x < canvas.width; x += stride) {
      const i = (y * canvas.width + x) * 4;
      lum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      n += 1;
    }
  }
  const mean = lum / n / 255;
  const extra = (canvas as HTMLCanvasElement & { __report?: { overlap: string; contrast: string } }).__report;
  return {
    mean,
    delta: Math.abs(mean - prev),
    overlap: extra?.overlap ?? "—",
    contrast: extra?.contrast ?? "—",
  };
}
