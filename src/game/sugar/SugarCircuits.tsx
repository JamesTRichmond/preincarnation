import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Lightbulb, RotateCcw, RotateCw, Undo2, Volume2, VolumeX } from "lucide-react";
import { CHAPTERS, type Action, type Puzzle, applyActions, canRotate, canToggle, describeCell, parseBoard } from "./model.ts";
import { PUZZLES } from "./puzzles.ts";
import { simulate, type Frame, type SimResult } from "./sim.ts";
import { solve, traceLabels } from "./solver.ts";
import { auditPuzzle, type Audit } from "./audit.ts";
import { EMPTY_SAVE, loadSave, loadSketches, writeSave, writeSketches, type ClearRecord, type SaveData, type Sketch } from "./save.ts";
import { Yard } from "./Yard.tsx";
import { Editor } from "./Editor.tsx";
import { bindSound, hydrateSound, playFault, playGate, playPour, playTurn, playWin, setSoundMuted, unlockSound } from "./sound.ts";

type Screen = "ledger" | "play" | "rules" | "proof" | "editor";

const RULES = [
  "A draw moves every loose sap one fitting forward. You do not steer sap during the draw.",
  "A thin line, a check, and an open gate hold one sap. A main holds two and lets one leave on each pull.",
  "A full fitting cannot take more sap on the pull it is leaving. There is no same-pull handoff.",
  "A check takes sap only from behind the arrow and lets it out only through the point.",
  "A tee sends sap straight if that mouth can take it. Otherwise left-hand, then right-hand.",
  "A cross keeps its two streams apart. They never mix.",
  "Two saps landing in one thin fitting on the same pull blow the grade. A pail can take every sap it still has room for.",
  "Turning a loose fitting, or opening or shutting a gate, costs one turn. The draw is free.",
];

function sketchPuzzle(sketch: Sketch): Puzzle {
  return {
    id: sketch.id,
    chapter: 0,
    title: sketch.title,
    difficulty: 1,
    concepts: [],
    why: "A yard sketch saved on this device. It is not one of the sixty and it grants nothing.",
    rows: sketch.rows,
    moveLimit: sketch.moveLimit,
    par: 0,
    hints: [
      "Sketches do not come with a sugarmaker's hints.",
      "Search a line from the editor if you want a shortest trace.",
      "Reset returns this sketch to the fittings you saved.",
    ],
  };
}

function nextYard(save: SaveData): Puzzle | null {
  const last = save.lastId ? PUZZLES.findIndex((puzzle) => puzzle.id === save.lastId) : -1;
  if (last >= 0 && !save.cleared[PUZZLES[last].id]) return PUZZLES[last];
  const after = last >= 0 ? PUZZLES.slice(last + 1) : PUZZLES;
  return after.find((puzzle) => !save.cleared[puzzle.id]) ?? PUZZLES.find((puzzle) => !save.cleared[puzzle.id]) ?? null;
}

const press = "transition-transform duration-150 ease-out active:scale-[0.96]";

export function SugarCircuits({ onLeave }: { onLeave?: () => void }) {
  const [screen, setScreen] = useState<Screen>("ledger");
  const [save, setSave] = useState<SaveData>(EMPTY_SAVE);
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [liveSketch, setLiveSketch] = useState<Puzzle | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setSave(loadSave());
    setSketches(loadSketches());
    setMuted(hydrateSound());
    bindSound();
  }, []);

  function updateSave(next: SaveData) {
    setSave(next);
    writeSave(next);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    unlockSound();
  }

  function openPuzzle(puzzle: Puzzle) {
    setLiveSketch(puzzle.chapter === 0 ? puzzle : null);
    setPuzzleId(puzzle.id);
    setScreen("play");
    if (puzzle.chapter !== 0) updateSave({ ...save, lastId: puzzle.id });
  }

  const active =
    liveSketch && liveSketch.id === puzzleId
      ? liveSketch
      : (PUZZLES.find((puzzle) => puzzle.id === puzzleId) ?? null);

  return (
    <main className="min-h-screen bg-bg text-fg">
      {screen === "ledger" ? (
        <Ledger
          save={save}
          sketches={sketches}
          onOpen={(id) => {
            const puzzle = PUZZLES.find((item) => item.id === id);
            if (puzzle) openPuzzle(puzzle);
          }}
          onSketch={(sketch) => openPuzzle(sketchPuzzle(sketch))}
          onRules={() => setScreen("rules")}
          onProof={() => setScreen("proof")}
          onEdit={() => setScreen("editor")}
          muted={muted}
          onToggleMute={toggleMute}
          onLeave={onLeave}
          onForgetSketch={(id) => {
            const next = sketches.filter((sketch) => sketch.id !== id);
            setSketches(next);
            writeSketches(next);
          }}
        />
      ) : null}
      {screen === "rules" ? <Rules onBack={() => setScreen("ledger")} /> : null}
      {screen === "proof" ? <Proof onBack={() => setScreen("ledger")} /> : null}
      {screen === "editor" ? (
        <Editor
          onBack={() => setScreen("ledger")}
          onPlay={(sketch) => {
            const next = [sketch, ...sketches].slice(0, 12);
            setSketches(next);
            writeSketches(next);
            openPuzzle(sketchPuzzle(sketch));
          }}
        />
      ) : null}
      {screen === "play" && active ? (
        <Play
          puzzle={active}
          hintStart={save.hints[active.id] ?? 0}
          onHint={(level) => updateSave({ ...save, hints: { ...save.hints, [active.id]: level } })}
          onClear={(record) => {
            if (active.chapter === 0) return;
            const prior = save.cleared[active.id];
            const better =
              !prior || record.moves < prior.moves || (record.ribbon && !prior.ribbon);
            if (!better) return;
            updateSave({ ...save, cleared: { ...save.cleared, [active.id]: record } });
          }}
          onBack={() => setScreen("ledger")}
          muted={muted}
          onToggleMute={toggleMute}
          onNext={() => {
            const index = PUZZLES.findIndex((puzzle) => puzzle.id === active.id);
            const next = PUZZLES[index + 1];
            if (!next) setScreen("ledger");
            else openPuzzle(next);
          }}
        />
      ) : null}
    </main>
  );
}

function Ledger({
  save,
  sketches,
  onOpen,
  onSketch,
  onRules,
  onProof,
  onEdit,
  onForgetSketch,
  muted,
  onToggleMute,
  onLeave,
}: {
  save: SaveData;
  sketches: Sketch[];
  onOpen: (id: string) => void;
  onSketch: (sketch: Sketch) => void;
  onRules: () => void;
  onProof: () => void;
  onEdit: () => void;
  onForgetSketch: (id: string) => void;
  muted: boolean;
  onToggleMute: () => void;
  onLeave?: () => void;
}) {
  const cleared = Object.keys(save.cleared).length;
  const ribbons = Object.values(save.cleared).filter((record) => record.ribbon).length;
  const next = nextYard(save);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-primary uppercase">County festival</p>
          <h1 className="font-display text-4xl text-fg">Sugar Circuits</h1>
          <p className="mt-2 max-w-xl text-base text-fg-muted">
            Wooden fittings and whole buckets of sap. A sugarhouse pastime, not a boiler, a releaser, or a vacuum line.
            It is not the Marble Vein. Clearing this ledger changes nothing about the life you are living.
          </p>
        </div>
        <button
          type="button"
          className={`${press} min-h-11 rounded-md px-3 text-fg`}
          onClick={onToggleMute}
          aria-pressed={muted}
          aria-label={muted ? "Sound is off" : "Sound is on"}
        >
          {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
        </button>
      </header>
      {onLeave ? (
        <button type="button" className={`${press} min-h-11 self-start text-fg underline`} onClick={onLeave}>
          Back to the sugarhouse
        </button>
      ) : null}
      {next ? (
        <button type="button" className={`${press} min-h-11 rounded-md bg-primary px-4 text-left text-primary-fg`} onClick={() => onOpen(next.id)}>
          <span className="block text-xs tracking-wide uppercase">
            {cleared === 0 ? "First yard" : "Continue"}
          </span>
          <span className="font-display text-2xl">
            {next.id} {next.title}
          </span>
        </button>
      ) : (
        <p className="rounded-md bg-bg-elevated px-4 py-3 text-fg">
          The ledger is clear. That still grants no campaign power.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${press} min-h-11 rounded-md bg-fg px-4 text-bg`} onClick={onRules}>
          How a line behaves
        </button>
        <button type="button" className={`${press} min-h-11 rounded-md bg-bg-elevated px-4 text-fg`} onClick={onEdit}>
          Editor
        </button>
        <button type="button" className={`${press} min-h-11 rounded-md bg-bg-elevated px-4 text-fg`} onClick={onProof}>
          Proof
        </button>
      </div>
      <p className="text-sm text-fg-muted">
        {cleared} of 60 cleared on this device
        {ribbons > 0 ? ` · ${ribbons} ribbon${ribbons === 1 ? "" : "s"}` : ""}. Finishing the ledger does not grant a
        campaign power.
      </p>
      {CHAPTERS.map((chapter) => {
        const yards = PUZZLES.filter((puzzle) => puzzle.chapter === chapter.id);
        const done = yards.filter((puzzle) => save.cleared[puzzle.id]).length;
        return (
          <section key={chapter.id} className="flex flex-col gap-3">
            <div>
              <h2 className="font-display text-2xl text-fg">
                {chapter.id}. {chapter.title}
                <span className="ml-2 text-base text-fg-muted">
                  {" "}
                  {done}/{yards.length}
                </span>
              </h2>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-subtle/30">
                <div className="h-full bg-karma-pos" style={{ width: `${(done / yards.length) * 100}%` }} />
              </div>
              <p className="mt-2 text-sm text-primary">{chapter.teaches}</p>
              <p className="mt-1 text-sm text-fg-muted">{chapter.why}</p>
            </div>
            <ul className="flex flex-col gap-2">
              {yards.map((puzzle) => {
                const record = save.cleared[puzzle.id];
                return (
                  <li key={puzzle.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(puzzle.id)}
                      className="flex min-h-11 w-full items-center gap-3 rounded-lg bg-bg-elevated px-3 py-2 text-left"
                    >
                      <span className="w-12 shrink-0 font-sans text-sm text-primary">{puzzle.id}</span>
                      <span className="flex-1">
                        <span className="block text-fg">{puzzle.title}</span>
                        <span className="text-xs text-fg-muted">
                          {puzzle.difficulty} of 5 · {puzzle.moveLimit} turns
                          {record ? ` · cleared in ${record.moves}` : ""}
                          {record?.ribbon ? " · ribbon" : ""}
                        </span>
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${record ? "bg-karma-pos" : "bg-bg-subtle"}`}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <section>
        <h2 className="font-display text-2xl text-fg">Yard sketches</h2>
        <p className="mt-1 text-sm text-fg-muted">Not part of the sixty.</p>
        {sketches.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">None saved.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {sketches.map((sketch) => (
              <li key={sketch.id} className="flex gap-2">
                <button
                  type="button"
                  className="min-h-11 flex-1 rounded-lg bg-bg-elevated px-3 text-left"
                  onClick={() => onSketch(sketch)}
                >
                  {sketch.title}
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg px-3 text-fg-muted underline"
                  onClick={() => onForgetSketch(sketch.id)}
                >
                  Forget
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Rules({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
      <button type="button" className="min-h-11 self-start text-fg underline" onClick={onBack}>
        Ledger
      </button>
      <h1 className="font-display text-3xl">How a line behaves</h1>
      <p className="text-fg-muted">
        Festival tokens on a bench. Sap is counted in whole buckets. Nothing here is industrial equipment.
      </p>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-fg">
        {RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
      <p className="text-sm text-fg-muted">
        Undo gives a turn back. Reset returns the published yard. Clear fault keeps your fittings and drops the
        blown draw. Arrows or WASD move the mark. R turns right, Q turns left, F works a gate, Enter draws, U
        undoes.
      </p>
      <p className="text-sm text-fg-muted">
        Ribbons are optional bragging rights. Clearing every yard does not unlock a power anywhere else.
      </p>
    </div>
  );
}

function Proof({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<Audit[]>([]);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setRows([]);
    const found: Audit[] = [];
    for (const puzzle of PUZZLES) {
      found.push(auditPuzzle(puzzle));
      setRows(found.slice());
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    setRunning(false);
  }

  const failed = rows.filter((row) => !row.ok);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <button type="button" className="min-h-11 self-start underline" onClick={onBack}>
        Ledger
      </button>
      <h1 className="font-display text-3xl">Proof</h1>
      <p className="text-sm text-fg-muted">
        The solver searches every yard. A yard fails if it is already open, unsolvable inside its budget, shorter
        than its par, or if the lesson it claims never happens on the shortest line.
      </p>
      <button
        type="button"
        className="min-h-11 self-start rounded-md bg-primary px-4 text-primary-fg disabled:opacity-60"
        onClick={run}
        disabled={running}
      >
        {running ? `Reading ${rows.length} of 60` : "Run the proof"}
      </button>
      {rows.length === 60 && !running ? (
        <p className="rounded-md bg-fg px-3 py-2 text-bg" role="status">
          {failed.length === 0
            ? "All sixty are solvable, none start finished, and each shortest line matches its par."
            : `${failed.length} yards failed.`}
        </p>
      ) : null}
      <ul className="flex flex-col gap-1 text-sm">
        {rows.map((row) => (
          <li key={row.id} className={row.ok ? "text-fg-muted" : "text-danger"}>
            {row.id} {row.ok ? `par ${row.par}, ${row.ticks} pulls` : row.reasons.join("; ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Play({
  puzzle,
  hintStart,
  onHint,
  onClear,
  onBack,
  onNext,
  muted,
  onToggleMute,
}: {
  puzzle: Puzzle;
  hintStart: number;
  onHint: (level: number) => void;
  onClear: (record: ClearRecord) => void;
  onBack: () => void;
  onNext: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const start = useMemo(() => {
    try {
      return parseBoard(puzzle.rows);
    } catch {
      return null;
    }
  }, [puzzle]);
  const [turns, setTurns] = useState<Action[]>([]);
  const [cursor, setCursor] = useState({ r: 0, c: 0 });
  const [note, setNote] = useState<string | null>(null);
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [result, setResult] = useState<SimResult | null>(null);
  const [hints, setHints] = useState(hintStart);
  const [studied, setStudied] = useState(false);
  const [studyLines, setStudyLines] = useState<string[]>([]);
  const cheered = useRef<SimResult | null>(null);

  useEffect(() => {
    setTurns([]);
    setCursor({ r: 0, c: 0 });
    setNote(null);
    setFrames(null);
    setResult(null);
    setHints(hintStart);
    setStudied(false);
    setStudyLines([]);
  }, [puzzle.id, hintStart]);

  const board = useMemo(() => (start ? applyActions(start, turns) : null), [start, turns]);
  const frame = frames?.[frameIndex] ?? null;
  const faults = frame?.faults ?? [];
  const drawing = frames !== null && result !== null && frameIndex < frames.length - 1;

  useEffect(() => {
    if (!frames || !result || frameIndex >= frames.length - 1) return;
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setFrameIndex(frames.length - 1);
      return;
    }
    const timer = window.setTimeout(() => setFrameIndex((index) => index + 1), 420);
    return () => window.clearTimeout(timer);
  }, [frames, frameIndex, result]);

  useEffect(() => {
    if (!result || !frames || frameIndex !== frames.length - 1) return;
    if (result.status === "win" && !studied && puzzle.chapter !== 0) {
      const ribbon = meetsRibbon(puzzle, turns.length, result.ticks);
      onClear({ moves: turns.length, ticks: result.ticks, ribbon });
    }
    if (result.status === "win" && !studied && cheered.current !== result) {
      cheered.current = result;
      playWin();
    }
  }, [frameIndex, frames, result, studied, puzzle, turns.length, onClear]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const move: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        KeyW: [-1, 0],
        KeyS: [1, 0],
        KeyA: [0, -1],
        KeyD: [0, 1],
      };
      if (move[event.code] && board) {
        event.preventDefault();
        const [dr, dc] = move[event.code] ?? [0, 0];
        setCursor((current) => ({
          r: Math.max(0, Math.min(board.length - 1, current.r + dr)),
          c: Math.max(0, Math.min((board[0]?.length ?? 1) - 1, current.c + dc)),
        }));
        return;
      }
      if (event.code === "KeyR" || event.code === "KeyE") {
        event.preventDefault();
        turn("cw");
      } else if (event.code === "KeyQ") {
        event.preventDefault();
        turn("ccw");
      } else if (event.code === "KeyF" || event.code === "KeyV") {
        event.preventDefault();
        toggle();
      } else if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        draw();
      } else if (event.code === "KeyU" || event.code === "KeyZ") {
        event.preventDefault();
        undo();
      } else if (event.code === "KeyC" || event.code === "Escape") {
        event.preventDefault();
        clearFault();
      } else if (event.code === "KeyH") {
        event.preventDefault();
        revealHint();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cell = board?.[cursor.r]?.[cursor.c];
  const won = Boolean(result?.status === "win" && frames && frameIndex === frames.length - 1);
  const ribbon = won && meetsRibbon(puzzle, turns.length, result?.ticks ?? 0);

  if (!start || !board) {
    return (
      <div className="px-4 py-6">
        <p>This yard could not be read.</p>
        <button type="button" className="mt-3 min-h-11 underline" onClick={onBack}>
          Ledger
        </button>
      </div>
    );
  }

  const yard = board;
  const origin = start;

  function spend(action: Action) {
    if (drawing) return;
    if (turns.length >= puzzle.moveLimit) {
      setNote("No turns left. Undo or reset the yard.");
      return;
    }
    unlockSound();
    if (action.type === "toggle") playGate();
    else playTurn();
    setTurns((current) => [...current, action]);
    setNote(traceLabels([action], yard)[0] ?? null);
    setFrames(null);
    setResult(null);
  }

  function turn(dir: "cw" | "ccw") {
    if (!cell || !canRotate(cell)) {
      setNote("That fitting is nailed down.");
      return;
    }
    spend({ type: dir, r: cursor.r, c: cursor.c });
  }

  function toggle() {
    if (!cell || !canToggle(cell)) {
      setNote("There is no loose gate on the mark.");
      return;
    }
    spend({ type: "toggle", r: cursor.r, c: cursor.c });
  }

  function undo() {
    if (drawing) return;
    setTurns((current) => current.slice(0, -1));
    setFrames(null);
    setResult(null);
    setNote(null);
  }

  function reset() {
    setTurns([]);
    setFrames(null);
    setResult(null);
    setStudied(false);
    setStudyLines([]);
    setNote("Yard reset.");
  }

  function clearFault() {
    setFrames(null);
    setResult(null);
    setNote(null);
  }

  function draw() {
    if (drawing) return;
    unlockSound();
    const sim = simulate(yard);
    if (sim.status === "win") playPour();
    else playFault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setResult(sim);
    setFrames(sim.frames);
    setFrameIndex(reduce ? sim.frames.length - 1 : 0);
    setNote(sim.message);
  }

  function revealHint() {
    const next = Math.min(3, hints + 1);
    setHints(next);
    onHint(next);
  }

  function study() {
    const found = solve(origin, Math.max(puzzle.moveLimit, puzzle.par || puzzle.moveLimit));
    if (!found || found.moves < 1) {
      setNote("No studied line inside the budget.");
      return;
    }
    const actions = found.actions;
    setTurns(actions);
    setStudied(true);
    setStudyLines(traceLabels(actions, origin));
    setFrames(null);
    setResult(null);
    setNote("Studied line loaded. It will not clear the ledger. Reset to try the yard yourself.");
  }

  function pick(r: number, c: number) {
    setCursor({ r, c });
    const picked = yard[r]?.[c];
    if (!picked || drawing) return;
    if (canRotate(picked)) spend({ type: "cw", r, c });
    else if (canToggle(picked)) spend({ type: "toggle", r, c });
  }

  const chapter = CHAPTERS.find((item) => item.id === puzzle.chapter);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <button type="button" className="text-sm text-fg-muted underline" onClick={onBack}>
            Ledger
          </button>
          <h1 className="font-display text-3xl text-fg">{puzzle.title}</h1>
          <p className="text-sm text-fg-muted">
            {chapter ? `${chapter.title} · ${chapter.teaches}` : "Sketch"} · {turns.length}/{puzzle.moveLimit} turns
            {puzzle.par > 0 ? ` · par ${puzzle.par}` : ""}
          </p>
        </div>
        <div className="flex">
          <button
            type="button"
            className={`${press} min-h-11 rounded-md px-2 text-fg`}
            onClick={onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Sound is off" : "Sound is on"}
          >
            {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
          </button>
          <button type="button" className={`${press} min-h-11 rounded-md px-2 text-fg`} onClick={revealHint} aria-label="Hint">
            <Lightbulb className="size-6" />
          </button>
        </div>
      </header>
      <div
        className="mx-auto w-full touch-manipulation"
        style={{ maxWidth: `${(board[0]?.length ?? 1) * 156}px` }}
      >
        <Yard board={board} frame={frame} cursor={cursor} faults={faults} pulse={frameIndex} onPick={pick} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-fg" role="status">
          {cell
            ? `${describeCell(
                { ...cell, stock: frame?.stock[cursor.r]?.[cursor.c] ?? cell.stock },
                frame?.got[cursor.r]?.[cursor.c] ?? cell.got,
              )} Row ${cursor.r + 1}, column ${cursor.c + 1}.`
            : "Choose a fitting."}
        </p>
        <p className="min-h-6 text-sm text-fg-muted">{note ?? frame?.note ?? "Tap a loose fitting, then draw."}</p>
      </div>
      {result && result.status !== "win" && frameIndex === (frames?.length ?? 1) - 1 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-danger px-3 py-2 text-fg">
          <p className="flex-1 text-sm">{result.message}</p>
          <button type="button" className="min-h-11 rounded-md bg-fg px-3 text-bg" onClick={clearFault}>
            Clear fault
          </button>
        </div>
      ) : null}
      {won ? (
        <div className="rounded-xl bg-fg p-4 text-bg">
          <h2 className="font-display text-2xl">{studied ? "Studied, not cleared" : "Pails are marked"}</h2>
          <p className="mt-1 text-sm">
            {turns.length} turns, {result?.ticks} pulls.
            {puzzle.par > 0
              ? turns.length === puzzle.par
                ? " On par."
                : ` ${turns.length - puzzle.par} over par.`
              : ""}
            {ribbon ? ` ${puzzle.challenge?.note ?? "Ribbon."}` : ""}
          </p>
          <p className="mt-2 text-sm">{puzzle.why}</p>
          <p className="mt-2 text-sm">Clearing yards does not grant a campaign power.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {puzzle.chapter !== 0 ? (
              <button type="button" className="min-h-11 rounded-md bg-primary px-4" onClick={onNext}>
                Next yard
              </button>
            ) : null}
            <button type="button" className="min-h-11 rounded-md bg-bg px-4 text-fg" onClick={reset}>
              Retry
            </button>
          </div>
        </div>
      ) : null}
      {hints > 0 ? (
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-fg-muted">
          {puzzle.hints.slice(0, hints).map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      ) : null}
      {studyLines.length > 0 ? (
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-fg-muted">
          {studyLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" className={`${press} flex min-h-11 items-center justify-center gap-2 rounded-md bg-fg text-bg`} onClick={() => turn("ccw")}>
          <RotateCcw className="size-5" /> Left
        </button>
        <button type="button" className={`${press} flex min-h-11 items-center justify-center gap-2 rounded-md bg-fg text-bg`} onClick={() => turn("cw")}>
          <RotateCw className="size-5" /> Right
        </button>
        <button type="button" className={`${press} min-h-11 rounded-md bg-bg-elevated text-fg`} onClick={toggle}>
          Gate
        </button>
        <button type="button" className={`${press} flex min-h-11 items-center justify-center gap-2 rounded-md bg-bg-elevated text-fg`} onClick={undo}>
          <Undo2 className="size-5" /> Undo
        </button>
        <button type="button" className={`${press} min-h-11 rounded-md bg-primary text-primary-fg sm:col-span-2`} onClick={draw}>
          Draw
        </button>
        <button type="button" className={`${press} min-h-11 rounded-md bg-bg-elevated text-fg`} onClick={reset}>
          Reset
        </button>
        <button type="button" className={`${press} flex min-h-11 items-center justify-center gap-2 rounded-md bg-bg-elevated text-fg`} onClick={study}>
          <BookOpen className="size-5" /> Study
        </button>
      </div>
    </div>
  );
}

function meetsRibbon(puzzle: Puzzle, moves: number, ticks: number): boolean {
  const challenge = puzzle.challenge;
  if (!challenge) return false;
  if (challenge.maxMoves !== undefined && moves > challenge.maxMoves) return false;
  if (challenge.maxTicks !== undefined && ticks > challenge.maxTicks) return false;
  return true;
}
