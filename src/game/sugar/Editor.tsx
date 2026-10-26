import { useMemo, useState } from "react";
import type { Cell, Kind } from "./model.ts";
import {
  emptyCell,
  parseBoard,
  describeCell,
  serializeBoard,
} from "./model.ts";
import { simulate } from "./sim.ts";
import { solve, traceLabels } from "./solver.ts";
import type { Sketch } from "./save.ts";
import { Yard } from "./Yard.tsx";

type Tool =
  | "empty"
  | "block"
  | "pipe"
  | "elbow"
  | "main"
  | "check"
  | "valve"
  | "tee"
  | "cross"
  | "tap"
  | "bucket";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "empty", label: "Ground" },
  { id: "block", label: "Stone" },
  { id: "pipe", label: "Line" },
  { id: "elbow", label: "Elbow" },
  { id: "main", label: "Main" },
  { id: "check", label: "Check" },
  { id: "valve", label: "Gate" },
  { id: "tee", label: "Tee" },
  { id: "cross", label: "Cross" },
  { id: "tap", label: "Tap" },
  { id: "bucket", label: "Pail" },
];

function stamp(tool: Tool): Cell {
  const cell = emptyCell();
  if (tool === "empty") return cell;
  if (tool === "block") return { ...cell, kind: "block" };
  if (tool === "elbow") return { ...cell, kind: "pipe", shape: "elbow", rotLocked: false };
  if (tool === "pipe") return { ...cell, kind: "pipe", shape: "straight", rotLocked: false };
  if (tool === "main") return { ...cell, kind: "main", shape: "straight", rotLocked: false };
  if (tool === "check") return { ...cell, kind: "check", shape: "straight", rotLocked: false };
  if (tool === "valve") {
    return { ...cell, kind: "valve", shape: "straight", rotLocked: true, toggleLocked: false, open: false };
  }
  if (tool === "tee") return { ...cell, kind: "tee", rotLocked: false };
  if (tool === "cross") return { ...cell, kind: "cross" };
  if (tool === "tap") return { ...cell, kind: "tap", stock: 1, rotLocked: true };
  return { ...cell, kind: "bucket", need: 1, rotLocked: true };
}

function sameTool(cell: Cell, tool: Tool): boolean {
  if (tool === "elbow") return cell.kind === "pipe" && cell.shape === "elbow";
  if (tool === "pipe") return cell.kind === "pipe" && cell.shape === "straight";
  if (tool === "empty") return cell.kind === "empty";
  return cell.kind === (tool as Kind);
}

function blank(size: number): Cell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => emptyCell()));
}

export function Editor({
  onPlay,
  onBack,
}: {
  onPlay: (sketch: Sketch) => void;
  onBack: () => void;
}) {
  const [board, setBoard] = useState<Cell[][]>(() => blank(4));
  const [tool, setTool] = useState<Tool>("pipe");
  const [picked, setPicked] = useState({ r: 0, c: 0 });
  const [limit, setLimit] = useState(4);
  const [note, setNote] = useState<string | null>(null);
  const [trace, setTrace] = useState<string[]>([]);

  const selected = board[picked.r]?.[picked.c] ?? emptyCell();
  const rows = useMemo(() => serializeBoard(board), [board]);

  function paint(r: number, c: number) {
    setPicked({ r, c });
    setBoard((current) =>
      current.map((row, ri) =>
        row.map((cell, ci) => {
          if (ri !== r || ci !== c) return cell;
          if (sameTool(cell, tool) && tool !== "empty" && tool !== "block") {
            return { ...cell, rot: (cell.rot + 1) & 3 };
          }
          return stamp(tool);
        }),
      ),
    );
    setTrace([]);
  }

  function patch(next: Partial<Cell>) {
    setBoard((current) =>
      current.map((row, r) =>
        row.map((cell, c) => (r === picked.r && c === picked.c ? { ...cell, ...next } : cell)),
      ),
    );
  }

  function search() {
    try {
      const parsed = parseBoard(rows);
      const found = solve(parsed, Math.max(1, limit));
      if (!found) {
        setNote("No winning line inside that turn budget.");
        setTrace([]);
        return;
      }
      if (found.moves === 0) {
        setNote("Already a finished line. A published yard cannot start solved.");
        setTrace([]);
        return;
      }
      setNote(`Shortest line is ${found.moves} turn${found.moves === 1 ? "" : "s"}, ${found.ticks} pulls.`);
      setTrace(traceLabels(found.actions, parsed));
    } catch (error) {
      setNote(error instanceof Error ? error.message : "The yard could not be read.");
    }
  }

  function draw() {
    try {
      const sim = simulate(parseBoard(rows));
      setNote(sim.message);
      setTrace([]);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "The yard could not be drawn.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-fg">Yard editor</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Sketches stay on this device. They are not part of the sixty, and they grant nothing.
          </p>
        </div>
        <button type="button" className="min-h-11 rounded-md px-3 text-fg underline" onClick={onBack}>
          Ledger
        </button>
      </header>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tool === item.id}
            onClick={() => setTool(item.id)}
            className={`min-h-11 rounded-md px-3 text-sm ${tool === item.id ? "bg-primary text-primary-fg" : "bg-bg-elevated text-fg"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mx-auto w-full" style={{ maxWidth: `${(board[0]?.length ?? 1) * 156}px` }}>
        <Yard board={board} cursor={picked} onPick={paint} />
      </div>
      <p className="text-sm text-fg-muted">
        Tap a cell to stamp {tool}. Tap the same fitting again to turn it. Selected: {describeCell(selected)}.
      </p>
      <div className="grid gap-3 rounded-xl bg-bg-elevated p-3 text-sm text-fg sm:grid-cols-2">
        <label className="flex min-h-11 items-center justify-between gap-3">
          Loose fitting
          <input
            type="checkbox"
            checked={selected.kind === "valve" ? !selected.toggleLocked : !selected.rotLocked}
            onChange={(event) => {
              if (selected.kind === "valve") patch({ toggleLocked: !event.target.checked, rotLocked: true });
              else patch({ rotLocked: !event.target.checked });
            }}
          />
        </label>
        {selected.kind === "valve" ? (
          <label className="flex min-h-11 items-center justify-between gap-3">
            Gate open
            <input
              type="checkbox"
              checked={selected.open}
              onChange={(event) => patch({ open: event.target.checked })}
            />
          </label>
        ) : null}
        {selected.kind === "tap" || selected.kind === "bucket" ? (
          <label className="flex min-h-11 items-center justify-between gap-3">
            {selected.kind === "tap" ? "Sap" : "Pail mark"}
            <input
              className="w-16 rounded-md bg-fg px-2 py-1 text-bg"
              type="number"
              min={1}
              max={6}
              value={selected.kind === "tap" ? selected.stock : selected.need}
              onChange={(event) => {
                const value = Math.max(1, Math.min(6, Number(event.target.value) || 1));
                patch(selected.kind === "tap" ? { stock: value } : { need: value });
              }}
            />
          </label>
        ) : null}
        <label className="flex min-h-11 items-center justify-between gap-3">
          Turn budget
          <input
            className="w-16 rounded-md bg-fg px-2 py-1 text-bg"
            type="number"
            min={1}
            max={8}
            value={limit}
            onChange={(event) => setLimit(Math.max(1, Math.min(8, Number(event.target.value) || 1)))}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-md bg-primary px-4 text-primary-fg" onClick={draw}>
          Draw sketch
        </button>
        <button type="button" className="min-h-11 rounded-md bg-fg px-4 text-bg" onClick={search}>
          Search a line
        </button>
        <button
          type="button"
          className="min-h-11 rounded-md bg-karma-pos px-4 text-fg"
          onClick={() =>
            onPlay({
              id: `sketch-${Date.now()}`,
              title: "Yard sketch",
              rows,
              moveLimit: limit,
            })
          }
        >
          Play this sketch
        </button>
      </div>
      {note ? (
        <p className="rounded-md bg-fg px-3 py-2 text-sm text-bg" role="status">
          {note}
        </p>
      ) : null}
      {trace.length > 0 ? (
        <ol className="list-decimal pl-5 text-sm text-fg">
          {trace.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      ) : null}
      <pre className="overflow-x-auto rounded-md bg-bg-elevated p-3 text-xs text-fg-muted">{rows.join("\n")}</pre>
    </div>
  );
}
