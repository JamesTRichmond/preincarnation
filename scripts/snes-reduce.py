#!/usr/bin/env python3
"""Crush walk-sheet cells to outlined 16×16 SNES sprites."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace/public/game")
JOBS = [
    ("wanderer-walk/sheet.png", "wanderer-walk/snes.png", 4, 4),
    ("smuggler-walk/sheet.png", "smuggler-walk/snes.png", 4, 4),
    ("officer-walk/sheet.png", "officer-walk/snes.png", 4, 4),
    ("wraith-walk/sheet.png", "wraith-walk/snes.png", 4, 4),
    ("wanderer-attack/sheet.png", "wanderer-attack/snes.png", 4, 4),
    ("embryo-walk/sheet.png", "embryo-walk/snes.png", 4, 4),
    ("bear-walk/sheet.png", "bear-walk/snes.png", 4, 4),
    ("bobcat-walk/sheet.png", "bobcat-walk/snes.png", 4, 4),
    ("fisher-walk/sheet.png", "fisher-walk/snes.png", 4, 4),
    ("relics/sheet.png", "relics/snes.png", 4, 4),
    ("crow/sheet.png", "crow/snes.png", 2, 2),
    ("resident/sheet.png", "resident/snes.png", 4, 4),
    ("sentinel/sheet.png", "sentinel/snes.png", 1, 1),
]


def outline(arr: np.ndarray) -> np.ndarray:
    a = arr[:, :, 3]
    out = arr.copy()
    h, w = a.shape
    for y in range(h):
        for x in range(w):
            if a[y, x] >= 140:
                continue
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and a[ny, nx] >= 140:
                    out[y, x] = (20, 14, 10, 255)
                    break
    return out


def crush_cell(cell: Image.Image, size: int = 16) -> Image.Image:
    rgba = cell.convert("RGBA")
    small = rgba.resize((size, size), Image.Resampling.BOX)
    arr = np.array(small, dtype=np.uint8)
    rgb = arr[:, :, :3].astype(np.int16)
    rgb = (rgb // 36) * 36
    arr[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    alpha = arr[:, :, 3]
    arr[:, :, 3] = np.where(alpha < 48, 0, 255).astype(np.uint8)
    arr = outline(arr)
    return Image.fromarray(arr, "RGBA")


def reduce_sheet(src: Path, dst: Path, rows: int, cols: int) -> None:
    im = Image.open(src).convert("RGBA")
    cw, ch = im.size[0] // cols, im.size[1] // rows
    out = Image.new("RGBA", (cols * 16, rows * 16), (0, 0, 0, 0))
    for r in range(rows):
        for c in range(cols):
            cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            out.paste(crush_cell(cell), (c * 16, r * 16))
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst)
    print(f"wrote {dst} {out.size}")


def main() -> None:
    for src, dst, rows, cols in JOBS:
        reduce_sheet(ROOT / src, ROOT / dst, rows, cols)


if __name__ == "__main__":
    main()
