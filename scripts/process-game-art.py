#!/usr/bin/env python3
"""Chroma-key and slice generated sheets into public/game assets."""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path("/workspace")
IMG = ROOT / "artifacts/imagine_images"
SPRITE_SKILL = ROOT / ".grok/skills/generate2dsprite/scripts/generate2dsprite.py"
OUT = ROOT / "public/game"
WORK = ROOT / "assets/sprites"

SHEETS = [
    ("589369ba-f49b-46e5-961c-f7e874b4b7ca.jpg", "wanderer-walk", "player", "player_sheet", 4, 4, "feet", "largest"),
    ("43533bc8-3ba3-4f8e-a14c-84103e9eed12.jpg", "wanderer-attack", "player", "sheet", 4, 4, "feet", "largest"),
    ("9eeb42f3-03c1-4284-b5e3-1c3242e0218e.jpg", "smuggler-walk", "player", "player_sheet", 4, 4, "feet", "largest"),
    ("1e80799d-0649-44c7-aef1-a5acde6756b2.jpg", "officer-walk", "player", "player_sheet", 4, 4, "feet", "largest"),
    ("456dda6c-8d32-40ab-acb2-252f8081843c.jpg", "embryo-walk", "player", "player_sheet", 4, 4, "feet", "largest"),
    ("35f8a36b-9697-41b8-982c-5f0c1ed37a15.jpg", "wraith-walk", "creature", "walk", 4, 4, "feet", "largest"),
    ("7f7c2a06-48c1-4654-9b12-d11a39b1432e.jpg", "crow", "creature", "hover", 2, 2, "center", "all"),
    ("3ed83542-813e-4905-ba70-78dcfa1a32dd.jpg", "sentinel", "creature", "idle", 2, 2, "feet", "largest"),
    ("d3623896-e482-42ad-bb7c-69b07731f051.jpg", "props", "asset", "sheet", 3, 3, "bottom", "largest"),
    ("d8bffba7-d6e9-45f4-b356-203276ec0943.jpg", "icons", "asset", "sheet", 2, 2, "center", "all"),
    ("1e573995-95c6-4827-a1ff-4ad62c48cac6.jpg", "slash", "asset", "fx", 2, 2, "center", "all"),
    ("959431d3-4562-4c82-9a79-acc32724ed21.jpg", "npcs", "npc", "idle", 2, 2, "feet", "largest"),
    ("1bf00908-ffd5-4f97-a548-5cebefb076c3.jpg", "barn", "asset", "single", 1, 1, "bottom", "largest"),
    ("ee982c4b-3e02-467f-a658-441e7f9e86df.jpg", "inn", "asset", "single", 1, 1, "bottom", "largest"),
    ("60acab3c-f51f-4636-a101-26f240cb7c4f.jpg", "hall", "asset", "single", 1, 1, "bottom", "largest"),
]


def prekey(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # Push JPEG-noisy magenta toward exact key
            if r > 180 and b > 180 and g < 90:
                px[x, y] = (255, 0, 255, 255)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest)


def slice_tileset(src: Path) -> None:
    im = Image.open(src).convert("RGB")
    w, h = im.size
    cols, rows = 4, 4
    cw, ch = w // cols, h // rows
    dest_dir = OUT / "tiles"
    dest_dir.mkdir(parents=True, exist_ok=True)
    names = [
        "grass", "flowers", "path", "gravel",
        "water", "bridge", "wood", "leaves",
        "pine", "stonewall", "marble", "marblewall",
        "cosmic", "void", "cobble", "soil",
    ]
    for i, name in enumerate(names):
        r, c = divmod(i, cols)
        # wait, i//cols is row if left-to-right then down
        row, col = i // cols, i % cols
        tile = im.crop((col * cw, row * ch, (col + 1) * cw, (row + 1) * ch))
        tile = tile.resize((64, 64), Image.Resampling.NEAREST)
        tile.save(dest_dir / f"{name}.png")
    # 2x2 seam check for grass
    g = Image.open(dest_dir / "grass.png")
    check = Image.new("RGB", (128, 128))
    check.paste(g, (0, 0))
    check.paste(g, (64, 0))
    check.paste(g, (0, 64))
    check.paste(g, (64, 64))
    check.save(dest_dir / "grass-2x2.png")


def process_sheet(src_name: str, slug: str, target: str, mode: str, rows: int, cols: int, align: str, component: str) -> None:
    src = IMG / src_name
    if not src.exists():
        print(f"MISSING {src}")
        return
    run = WORK / slug
    run.mkdir(parents=True, exist_ok=True)
    raw = run / "raw-sheet.png"
    prekey(src, raw)
    cmd = [
        "python3", str(SPRITE_SKILL), "process",
        "--input", str(raw),
        "--target", target,
        "--mode", mode,
        "--output-dir", str(run),
        "--shared-scale",
        "--align", align,
        "--component-mode", component,
        "--threshold", "120",
        "--edge-threshold", "170",
    ]
    if mode == "sheet":
        cmd += ["--rows", str(rows), "--cols", str(cols)]
    elif rows != cols or (rows, cols) not in ((4, 4), (2, 2), (3, 3), (2, 3)):
        cmd += ["--rows", str(rows), "--cols", str(cols)]
    if rows == 4 and cols == 4 and mode == "walk":
        cmd = [
            "python3", str(SPRITE_SKILL), "process",
            "--input", str(raw),
            "--target", target,
            "--mode", "sheet",
            "--rows", "4",
            "--cols", "4",
            "--output-dir", str(run),
            "--shared-scale",
            "--align", align,
            "--component-mode", component,
            "--threshold", "120",
            "--edge-threshold", "170",
        ]
    print("RUN", " ".join(cmd))
    subprocess.run(cmd, check=False)
    dest = OUT / slug
    dest.mkdir(parents=True, exist_ok=True)
    for name in ("sheet-transparent.png", "raw-sheet-clean.png", "animation.gif"):
        p = run / name
        if p.exists():
            shutil.copy2(p, dest / name)
    frames = sorted(run.glob("*.png"))
    # copy frame pngs that look like extracted frames
    for p in run.iterdir():
        if p.suffix == ".png" and p.name not in {"raw-sheet.png", "raw-sheet-clean.png", "sheet-transparent.png"}:
            shutil.copy2(p, dest / p.name)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    slice_tileset(IMG / "3db271e5-2ff4-4bb7-b28d-ea37b69f4d90.jpg")
    for row in SHEETS:
        try:
            process_sheet(*row)
        except Exception as e:
            print("FAIL", row[1], e)
    manifest = {row[1]: str(OUT / row[1]) for row in SHEETS}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("done")


if __name__ == "__main__":
    main()
