/** Tiny level painter. Courses are solids, hazards, and tool tiles — not a waypoint list. */

export function stage(w: number, h: number) {
  const g = Array.from({ length: h }, () => Array.from({ length: w }, () => "."));
  const s = (x: number, y: number, ch: string) => {
    if (y < 0 || x < 0 || y >= h || x >= w) {
      throw new Error(`oob ${x},${y} in ${w}x${h} (${ch})`);
    }
    g[y]![x] = ch;
  };
  return {
    w,
    h,
    s,
    box(x0: number, y0: number, x1: number, y1: number, ch = "#") {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) s(x, y, ch);
    },
    hline(x: number, y: number, n: number, ch: string) {
      for (let i = 0; i < n; i++) s(x + i, y, ch);
    },
    border() {
      this.box(0, 0, w - 1, 0, "#");
      this.box(0, h - 1, w - 1, h - 1, "#");
      for (let y = 0; y < h; y++) {
        s(0, y, "#");
        s(w - 1, y, "#");
      }
    },
    rows(): string[] {
      return g.map((r) => r.join(""));
    },
  };
}
