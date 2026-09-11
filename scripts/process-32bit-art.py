#!/usr/bin/env python3
"""Slice 32-bit tiles and chroma-key props into public/game."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ART = Path("/workspace/artifacts/imagine_images")
TILE_OUT = Path("/workspace/public/game/tiles32")
PROP_OUT = Path("/workspace/public/game/props")
TILE_OUT.mkdir(parents=True, exist_ok=True)
PROP_OUT.mkdir(parents=True, exist_ok=True)
ASSETS = Path("/workspace/assets/tiles")
ASSETS.mkdir(parents=True, exist_ok=True)

TILES = {
    "grass": "9d2c603d-98ac-4010-ac11-cc9ddccceaa7.jpg",
    "path": "76553e67-aacf-4beb-9646-67765df07f57.jpg",
    "water": "f95398cf-ecee-45e4-ab82-47bdf5c8a7c2.jpg",
    "cobble": "8d32a81a-3ed8-41f8-b877-df8dbd0157ca.jpg",
    "wood": "268c26a7-6520-4207-977c-d7907609cc52.jpg",
    "wallpaper": "1031ba3d-5cb1-4b14-8947-20d2ebc4170f.jpg",
    "pine": "8bb4ba81-ace3-42b4-b25c-15052e545157.jpg",
    "cosmic": "5db0e526-a453-4f4a-be3b-34521415519e.jpg",
}

PROPS = {
    "farmhouse": "044d531f-ffec-4ad8-97ca-d9f8322ad526.jpg",
    "cape": "dae21172-73dd-4b05-96b0-966c02969ee5.jpg",
    "inn": "41b51335-2dd0-4d83-8b35-37028da508fd.jpg",
    "rifle": "490d7e2b-4fd0-4c24-b72e-15184f5a536f.jpg",
    "syrup": "10fb9b11-813d-4dda-90fe-3a0feafcc4cc.jpg",
    "creemee": "e34c41ee-fd97-47d8-879a-65d3dce9a220.jpg",
    "door": "b21824ff-72ea-4f6b-a8f1-f1bafab8fb03.jpg",
}


def chroma(arr: np.ndarray) -> np.ndarray:
    rgb = arr[..., :3].astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dist = np.sqrt((r - 255.0) ** 2 + g**2 + (b - 255.0) ** 2)
    mag = (dist < 150) | ((r > 165) & (b > 165) & (g < 125))
    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    out[..., :3] = arr[..., :3]
    out[..., 3] = np.where(mag, 0, 255).astype(np.uint8)
    fringe = (out[..., 3] > 0) & (r > 130) & (b > 130) & (g < 170)
    out[..., 0] = np.where(fringe, np.minimum(out[..., 0], (g + 24).clip(0, 255)), out[..., 0])
    out[..., 2] = np.where(fringe, np.minimum(out[..., 2], (g + 24).clip(0, 255)), out[..., 2])
    return out


def bbox(alpha: np.ndarray, pad: int = 4) -> tuple[int, int, int, int] | None:
    ys, xs = np.where(alpha > 12)
    if len(xs) == 0:
        return None
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    h, w = alpha.shape
    return max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad + 1), min(h, y1 + pad + 1)


def process_tile(name: str, src: str) -> None:
    im = Image.open(ART / src).convert("RGB")
    side = min(im.size)
    left = (im.size[0] - side) // 2
    top = (im.size[1] - side) // 2
    im = im.crop((left, top, left + side, top + side))
    big = im.resize((64, 64), Image.Resampling.LANCZOS)
    small = im.resize((16, 16), Image.Resampling.LANCZOS)
    big.save(TILE_OUT / f"{name}-64.png")
    small.save(TILE_OUT / f"{name}.png")
    big.save(ASSETS / f"{name}-64.png")
    # 2x2 seam check
    chk = Image.new("RGB", (128, 128))
    for y in range(2):
        for x in range(2):
            chk.paste(big, (x * 64, y * 64))
    chk.save(TILE_OUT / f"{name}-2x2.png")
    print(f"tile {name}: 16 and 64")


def process_prop(name: str, src: str) -> None:
    im = Image.open(ART / src).convert("RGB")
    arr = chroma(np.array(im))
    box = bbox(arr[..., 3])
    if box:
        x0, y0, x1, y1 = box
        arr = arr[y0:y1, x0:x1]
    out = Image.fromarray(arr, "RGBA")
    # keep a reasonable game size
    h = 48 if name in ("farmhouse", "cape", "inn") else 32
    w = int(out.width * (h / max(1, out.height)))
    out = out.resize((max(16, w), h), Image.Resampling.LANCZOS)
    out.save(PROP_OUT / f"{name}.png")
    print(f"prop {name}: {out.size}")


def main() -> None:
    for k, v in TILES.items():
        process_tile(k, v)
    for k, v in PROPS.items():
        process_prop(k, v)


if __name__ == "__main__":
    main()
