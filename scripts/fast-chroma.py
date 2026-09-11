#!/usr/bin/env python3
"""Fast numpy chroma-key + grid slice from stable raw-sheet.png files."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path("/workspace/assets/sprites")
OUT = Path("/workspace/public/game")

JOBS = [
    ("wanderer-walk", 4, 4, True),
    ("wanderer-attack", 4, 4, True),
    ("smuggler-walk", 4, 4, True),
    ("officer-walk", 4, 4, True),
    ("embryo-walk", 4, 4, True),
    ("wraith-walk", 4, 4, True),
    ("crow", 2, 2, False),
    ("sentinel", 2, 2, True),
]


def chroma(arr: np.ndarray) -> np.ndarray:
    rgb = arr[..., :3].astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dist = np.sqrt((r - 255.0) ** 2 + g**2 + (b - 255.0) ** 2)
    mag = (dist < 155) | ((r > 160) & (b > 160) & (g < 120))
    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    out[..., :3] = arr[..., :3]
    out[..., 3] = np.where(mag, 0, 255).astype(np.uint8)
    # despill
    fringe = (out[..., 3] > 0) & (r > 130) & (b > 130) & (g < 170)
    out[..., 0] = np.where(fringe, np.minimum(out[..., 0], (g + 24).clip(0, 255)), out[..., 0])
    out[..., 2] = np.where(fringe, np.minimum(out[..., 2], (g + 24).clip(0, 255)), out[..., 2])
    return out


def bbox(alpha: np.ndarray, pad: int = 2) -> tuple[int, int, int, int] | None:
    ys, xs = np.where(alpha > 16)
    if len(xs) == 0:
        return None
    return int(xs.min()) - pad, int(ys.min()) - pad, int(xs.max()) + pad, int(ys.max()) + pad


def fit_cell(cell: np.ndarray, size: int, feet: bool) -> Image.Image:
    canvas = np.zeros((size, size, 4), dtype=np.uint8)
    box = bbox(cell[..., 3])
    if box is None:
        return Image.fromarray(canvas, "RGBA")
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(cell.shape[1] - 1, x1), min(cell.shape[0] - 1, y1)
    crop = cell[y0 : y1 + 1, x0 : x1 + 1]
    h, w = crop.shape[:2]
    scale = min((size * 0.88) / max(w, 1), (size * 0.92) / max(h, 1))
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = Image.fromarray(crop, "RGBA").resize((nw, nh), Image.Resampling.NEAREST)
    arr = np.array(im)
    x = (size - nw) // 2
    y = size - nh - 2 if feet else (size - nh) // 2
    y = max(0, min(size - nh, y))
    x = max(0, min(size - nw, x))
    canvas[y : y + nh, x : x + nw] = arr
    return Image.fromarray(canvas, "RGBA")


def process(slug: str, rows: int, cols: int, feet: bool) -> None:
    raw = SRC / slug / "raw-sheet.png"
    if not raw.exists():
        print("missing", raw)
        return
    im = Image.open(raw).convert("RGBA")
    # keep native-ish but cap
    max_side = 1024
    if max(im.size) > max_side:
        im = im.resize((max_side, max_side), Image.Resampling.NEAREST)
    keyed = chroma(np.array(im))
    dest = OUT / slug
    dest.mkdir(parents=True, exist_ok=True)
    Image.fromarray(keyed, "RGBA").save(dest / "sheet-keyed.png")
    h, w = keyed.shape[:2]
    ch, cw = h // rows, w // cols
    cell_size = 96 if rows >= 3 else 128
    frames: list[Image.Image] = []
    for r in range(rows):
        for c in range(cols):
            cell = keyed[r * ch : (r + 1) * ch, c * cw : (c + 1) * cw]
            frame = fit_cell(cell, cell_size, feet)
            frame.save(dest / f"r{r}c{c}.png")
            frames.append(frame)
    sheet = Image.new("RGBA", (cols * cell_size, rows * cell_size), (0, 0, 0, 0))
    i = 0
    for r in range(rows):
        for c in range(cols):
            sheet.paste(frames[i], (c * cell_size, r * cell_size), frames[i])
            i += 1
    sheet.save(dest / "sheet.png")
    print("ok", slug, sheet.size, "opaque-avg", int(np.array(sheet)[..., 3].mean()))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for job in JOBS:
        process(*job)


if __name__ == "__main__":
    main()
