import type { Cell, Dir } from "./model.ts";
import { canRotate, canToggle, describeCell, maskOf, outletOf } from "./model.ts";
import type { Frame } from "./sim.ts";

const PORT: Record<Dir, [number, number]> = {
  0: [32, 4],
  1: [60, 32],
  2: [32, 60],
  3: [4, 32],
};

function dirsOf(mask: number): Dir[] {
  const dirs: Dir[] = [];
  for (let dir = 0; dir < 4; dir += 1) if (mask & (1 << dir)) dirs.push(dir as Dir);
  return dirs;
}

function Tubes({ d, wide, live }: { d: string; wide: boolean; live: boolean }) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={wide ? 16 : 11}
        className="stroke-bg"
      />
      <path
        d={d}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={wide ? 7 : 4.5}
        className={live ? "stroke-primary" : "stroke-fg-muted"}
      />
    </g>
  );
}

function pathFrom(dirs: Dir[], elbow: boolean): string {
  if (elbow && dirs.length === 2) {
    const [a, b] = dirs;
    const [x1, y1] = PORT[a];
    const [x2, y2] = PORT[b];
    const cx = 32 + ((x1 - 32) + (x2 - 32)) * 0.55;
    const cy = 32 + ((y1 - 32) + (y2 - 32)) * 0.55;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }
  if (dirs.length === 2 && Math.abs(dirs[0] - dirs[1]) === 2) {
    const [x1, y1] = PORT[dirs[0]];
    const [x2, y2] = PORT[dirs[1]];
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  return dirs
    .map((dir) => {
      const [x, y] = PORT[dir];
      return `M 32 32 L ${x} ${y}`;
    })
    .join(" ");
}

function arrowPoints(dir: Dir): string {
  if (dir === 0) return "32,5 22,20 42,20";
  if (dir === 1) return "59,32 44,22 44,42";
  if (dir === 2) return "32,59 22,44 42,44";
  return "5,32 20,22 20,42";
}

function Glyph({
  cell,
  sap,
  got,
  mark,
}: {
  cell: Cell;
  sap: number;
  got: number;
  mark: string;
}) {
  if (cell.kind === "empty") {
    return <span className="block h-full w-full rounded-md bg-fg/40" />;
  }
  if (cell.kind === "block") {
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <rect x="10" y="12" width="44" height="40" rx="5" className="fill-bg" />
        <path d="M16 26h32M18 36h22M16 46h28" className="stroke-fg-muted" strokeWidth="1.5" />
      </svg>
    );
  }

  const shut = cell.kind === "valve" && !cell.open;
  const mask = shut ? 0 : maskOf(cell);
  const ports = dirsOf(mask);
  const elbow = cell.kind === "pipe" && cell.shape === "elbow";
  const wide = cell.kind === "main";
  const live = sap > 0 && !shut;
  const outlet = cell.kind === "check" || cell.kind === "tap" ? outletOf(cell) : null;

  let d = "";
  if (cell.kind === "cross") {
    d = "M 32 4 L 32 22 M 32 42 L 32 60 M 4 32 L 22 32 M 42 32 L 60 32";
  } else if (ports.length > 0) {
    d = pathFrom(ports, elbow);
  }

  const fill = cell.kind === "bucket" ? Math.max(0, Math.min(1, got / Math.max(cell.need, 1))) : 0;

  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      {d ? <Tubes d={d} wide={wide} live={live} /> : null}
      {cell.kind === "tee" ? <circle cx="32" cy="32" r="5" className="fill-bg" /> : null}
      {cell.kind === "tee" ? <circle cx="32" cy="32" r="2.2" className={live ? "fill-primary" : "fill-fg-muted"} /> : null}
      {outlet !== null && cell.kind === "check" ? (
        <polygon points={arrowPoints(outlet)} className={cell.rotLocked ? "fill-bg" : "fill-karma-pos"} />
      ) : null}
      {cell.kind === "valve" ? (
        <g className={cell.open ? "text-karma-pos" : "text-danger"}>
          <circle cx="32" cy="32" r="8" className="fill-fg stroke-current" strokeWidth="3" />
          {!cell.open ? <line x1="24" y1="24" x2="40" y2="40" className="stroke-current" strokeWidth="3" /> : null}
        </g>
      ) : null}
      {cell.kind === "tap" && outlet !== null ? (
        <g>
          <polygon points={arrowPoints(outlet)} className="fill-primary" />
          <circle cx="32" cy="32" r="7" className="fill-primary stroke-bg" strokeWidth="2" />
          <circle cx="50" cy="14" r="8" className="fill-fg stroke-bg" strokeWidth="1.5" />
          <text x="50" y="18" textAnchor="middle" fontSize="11" className="fill-bg">
            {cell.stock}
          </text>
        </g>
      ) : null}
      {cell.kind === "bucket" ? (
        <g>
          <clipPath id={`pail-${mark}`}>
            <path d="M20 20h24l-3.5 30h-17z" />
          </clipPath>
          <path d="M18 18h28l-4 34H22z" className="fill-fg-muted stroke-bg" strokeWidth="2" />
          <rect
            x="20"
            y={50 - fill * 28}
            width="24"
            height={fill * 28}
            clipPath={`url(#pail-${mark})`}
            className="fill-primary"
          />
          <text x="32" y="40" textAnchor="middle" fontSize="11" className="fill-bg">
            {got}/{cell.need}
          </text>
        </g>
      ) : null}
      {sap > 0 && cell.kind !== "bucket" && cell.kind !== "tap" ? (
        <g>
          <circle cx="14" cy="50" r="8" className="fill-primary stroke-bg" strokeWidth="1.5" />
          <text x="14" y="54" textAnchor="middle" fontSize="11" className="fill-bg">
            {sap}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

export function Yard({
  board,
  frame = null,
  cursor = null,
  faults = [],
  pulse = 0,
  onPick,
}: {
  board: Cell[][];
  frame?: Frame | null;
  cursor?: { r: number; c: number } | null;
  faults?: { r: number; c: number }[];
  pulse?: number;
  onPick?: (r: number, c: number) => void;
}) {
  const cols = board[0]?.length ?? 1;
  return (
    <div
      className="grid gap-1.5 rounded-xl bg-bg-elevated p-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const sap = frame?.counts[r]?.[c] ?? 0;
          const got = frame?.got[r]?.[c] ?? cell.got;
          const shown = { ...cell, stock: frame?.stock[r]?.[c] ?? cell.stock };
          const fault = faults.some((item) => item.r === r && item.c === c);
          const selected = cursor?.r === r && cursor?.c === c;
          const loose = canRotate(cell) || canToggle(cell);
          const label = `${describeCell(shown, got)} ${loose ? "Loose." : "Fixed."}`;
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={() => onPick?.(r, c)}
              className={[
                "relative aspect-square min-h-11 overflow-hidden rounded-md bg-fg text-bg",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sap",
                fault ? "fault-shake ring-2 ring-danger" : selected ? "ring-2 ring-primary" : "ring-1 ring-border",
              ].join(" ")}
            >
              <span key={`${pulse}-${sap}-${got}`} className={sap > 0 ? "sap-live block h-full" : "block h-full"}>
                <Glyph cell={shown} sap={sap} got={got} mark={`${r}-${c}`} />
              </span>
              {loose ? (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-karma-pos ring-1 ring-fg" aria-hidden="true" />
              ) : null}
            </button>
          );
        }),
      )}
    </div>
  );
}
