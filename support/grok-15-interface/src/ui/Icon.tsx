import type { ReactElement } from "react";
import { PALETTE, PIXELS } from "../pixels.ts";

export function Icon({ id, label }: { id: string; label?: string }) {
  const rows = PIXELS[id];
  if (!rows) {
    return (
      <span className="pi-icon pi-icon-missing" role="img" aria-label={label ?? "Missing icon"}>
        !
      </span>
    );
  }
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x] ?? ".";
      if (ch === "." || !(ch in PALETTE)) continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={PALETTE[ch as keyof typeof PALETTE]} />,
      );
    }
  });
  return (
    <svg
      viewBox="0 0 16 16"
      className="pi-icon"
      shapeRendering="crispEdges"
      role={label ? "img" : "presentation"}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {rects}
    </svg>
  );
}
