#!/usr/bin/env python3
"""Measure feet, centroids, and contrast. Write manifest.json and QC composites."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace/support/grok-13-character-animation")
CELL = 96
DIRS = ["down", "left", "right", "up"]

TIMING = {
    "mortal-wanderer": {
        "idle": {"fps": 6, "loop": True},
        "walk": {"fps": 8, "loop": True},
        "attack": {"fps": 10, "loop": False, "hitFrames": [1]},
        "charge": {"fps": 12, "loop": True, "hitFrames": [1]},
        "hurt": {"fps": 8, "loop": False},
        "interact": {"fps": 8, "loop": False},
        "death": {"fps": 8, "loop": False},
        "reincarnate": {"fps": 8, "loop": False},
        "tool": {"fps": 1, "loop": False, "poses": True},
    },
    "otter-creek-smuggler": {
        "idle": {"fps": 8, "loop": True},
        "walk": {"fps": 12, "loop": True},
        "attack": {"fps": 14, "loop": False, "hitFrames": [1]},
        "charge": {"fps": 16, "loop": True, "hitFrames": [1]},
        "hurt": {"fps": 12, "loop": False},
        "interact": {"fps": 10, "loop": False},
        "death": {"fps": 10, "loop": False},
        "reincarnate": {"fps": 8, "loop": False},
        "tool": {"fps": 1, "loop": False, "poses": True},
    },
    "rutland-officer": {
        "idle": {"fps": 5, "loop": True},
        "walk": {"fps": 6, "loop": True},
        "attack": {"fps": 8, "loop": False, "hitFrames": [1]},
        "charge": {"fps": 8, "loop": True, "hitFrames": [1]},
        "hurt": {"fps": 6, "loop": False},
        "interact": {"fps": 6, "loop": False},
        "death": {"fps": 6, "loop": False},
        "reincarnate": {"fps": 7, "loop": False},
        "tool": {"fps": 1, "loop": False, "poses": True},
    },
    "embryonic-god": {
        "idle": {"fps": 6, "loop": True},
        "walk": {"fps": 8, "loop": True, "locomotion": "hover"},
        "attack": {"fps": 9, "loop": False, "hitFrames": [1]},
        "charge": {"fps": 10, "loop": True, "hitFrames": [1]},
        "hurt": {"fps": 8, "loop": False},
        "interact": {"fps": 8, "loop": False},
        "death": {"fps": 8, "loop": False},
        "reincarnate": {"fps": 8, "loop": False},
        "tool": {"fps": 1, "loop": False, "poses": True},
    },
}

PHASES = {
    "idle": ["plant", "shift-left", "center", "shift-right"],
    "walk": ["left-plant", "pass", "right-plant", "pass"],
    "attack": ["windup", "strike", "follow", "recover"],
    "charge": ["anticipation", "lunge", "turn", "recover"],
    "hurt": ["impact", "recoil", "stagger", "recover"],
    "interact": ["reach", "grasp", "hold", "return"],
    "death": ["hit", "buckle", "fall", "still"],
    "reincarnate": ["stand", "seam", "lift", "empty", "seed", "flare", "thin", "wisp"],
    "tool": ["lantern", "two-hand", "pole", "pocket"],
}

NPC_NAMES = [
    "child-longcoat", "child-pigeontoe", "teen-slouch", "farmer",
    "dairy", "blacksmith", "fisher", "clerk",
    "parent", "baker", "elder-cane", "elder-shawl",
]
NPC_AGE = [
    "child", "child", "youth", "adult", "adult", "adult",
    "adult", "adult", "adult", "adult", "elder", "elder",
]
PORTRAIT_OLDER = [
    "elder-stern", "elder-smile", "elder-grief", "elder-squint",
    "middle-shout", "middle-tired", "baker-laugh", "fisher-wary",
    "parent-proud", "clerk-angry", "farm-speaking", "elder-aside",
]
PORTRAIT_YOUNG = [
    "farmer-grin", "clerk-nervous", "woman-determined", "teen-bored",
    "adult-crying", "teen-shy", "child-curious", "child-sulk",
    "child-laugh", "child-serious", "teen-shout", "teen-quiet",
]
GEN_OLDER = ["elder", "elder", "elder", "elder", "middle", "middle", "middle", "middle", "middle", "middle", "middle", "elder"]
GEN_YOUNG = ["young", "young", "young", "teen", "young", "teen", "child", "child", "child", "child", "teen", "teen"]


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def alpha_np(im: Image.Image) -> np.ndarray:
    return np.array(im.split()[-1])


def metrics(im: Image.Image) -> dict:
    a = alpha_np(im)
    ys, xs = np.where(a > 32)
    if len(xs) == 0:
        return {"empty": True}
    bottom = int(ys.max())
    top = int(ys.min())
    left = int(xs.min())
    right = int(xs.max())
    w = right - left + 1
    h = bottom - top + 1
    foot_cut = top + int(h * 0.88)
    foot = ys >= foot_cut
    foot_x = float(xs[foot].mean()) if foot.any() else float(xs.mean())
    return {
        "empty": False,
        "bbox": [left, top, right + 1, bottom + 1],
        "bottom": bottom,
        "top": top,
        "height": h,
        "width": w,
        "centroid": [round(float(xs.mean()), 2), round(float(ys.mean()), 2)],
        "footX": round(foot_x, 2),
    }


def list_frames(folder: Path, prefix: str) -> list[Path]:
    return sorted(folder.glob(f"{prefix}-*.png"), key=lambda p: int(p.stem.split("-")[-1]))


def direction_block(frames: list[Path], cols: int) -> dict:
    rows = []
    slide = []
    for r in range(0, len(frames), cols):
        chunk = frames[r : r + cols]
        ms = [metrics(load_rgba(p)) for p in chunk]
        bottoms = [m["bottom"] for m in ms if not m.get("empty")]
        cents = [m["centroid"][0] for m in ms if not m.get("empty")]
        foots = [m["footX"] for m in ms if not m.get("empty")]
        heights = [m["height"] for m in ms if not m.get("empty")]
        row = {
            "bottomPx": bottoms,
            "bottomSpread": (max(bottoms) - min(bottoms)) if bottoms else None,
            "centroidX": cents,
            "centroidXSpread": round(max(cents) - min(cents), 2) if cents else None,
            "footXSpread": round(max(foots) - min(foots), 2) if foots else None,
            "heightPx": heights,
            "heightSpread": (max(heights) - min(heights)) if heights else None,
        }
        rows.append(row)
        if row["centroidXSpread"] is not None:
            slide.append(row["centroidXSpread"])
    return {
        "rows": rows,
        "maxCentroidSlidePx": max(slide) if slide else None,
        "maxBottomSpreadPx": max((r["bottomSpread"] or 0) for r in rows) if rows else None,
    }


def contrast_sample(sprite: Image.Image, bg: Image.Image) -> dict:
    bg = bg.convert("RGB").resize((320, 320), Image.Resampling.BOX)
    sp = sprite.resize((sprite.width * 2, sprite.height * 2), Image.Resampling.NEAREST)
    canvas = bg.copy()
    ox = (canvas.width - sp.width) // 2
    oy = (canvas.height - sp.height) // 2 + 20
    canvas.paste(sp, (ox, oy), sp)
    arr = np.array(canvas).astype(np.int16)
    a = np.array(sp.split()[-1])
    ys, xs = np.where(a > 128)
    if len(xs) < 20:
        return {"error": "empty sprite"}
    edge = []
    h, w = a.shape
    for y, x in zip(ys[::7], xs[::7]):
        if y <= 0 or x <= 0 or y >= h - 1 or x >= w - 1 or a[y - 1, x] < 32 or a[y + 1, x] < 32 or a[y, x - 1] < 32 or a[y, x + 1] < 32:
            edge.append((int(y), int(x)))
    diffs = []
    for y, x in edge[::3]:
        cy, cx = oy + y, ox + x
        if not (1 <= cy < 319 and 1 <= cx < 319):
            continue
        lum_s = int(arr[cy, cx].mean())
        lum_b = int(np.array(bg)[cy, min(319, cx + 4)].mean())
        diffs.append(abs(lum_s - lum_b))
    if not diffs:
        return {"error": "no samples"}
    return {
        "meanEdgeContrast": round(float(np.mean(diffs)), 1),
        "minEdgeContrast": int(np.min(diffs)),
        "readable": bool(np.mean(diffs) >= 28),
    }


def silhouette(im: Image.Image) -> Image.Image:
    black = Image.new("RGBA", im.size, (8, 6, 4, 255))
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(black, mask=im.split()[-1])
    return out


def build_spin(form: str) -> dict | None:
    folder = ROOT / "forms" / form / "charge"
    frames = list_frames(folder, "charge")
    if len(frames) < 14:
        return None
    picks = [frames[1], frames[5], frames[9], frames[13]]
    out = ROOT / "forms" / form / "spin"
    out.mkdir(parents=True, exist_ok=True)
    saved: list[Path] = []
    sheet = Image.new("RGBA", (CELL * 4, CELL), (0, 0, 0, 0))
    for i, src in enumerate(picks):
        im = load_rgba(src)
        dest = out / f"spin-{i + 1}.png"
        im.save(dest)
        sheet.alpha_composite(im, (i * CELL, 0))
        saved.append(dest)
    sheet.save(out / "sheet-transparent.png")
    return {
        "sheet": f"forms/{form}/spin/sheet-transparent.png",
        "frameCount": 4,
        "rows": 1,
        "cols": 4,
        "cell": CELL,
        "directional": False,
        "directions": ["sequence"],
        "phases": ["down-lunge", "left-lunge", "right-lunge", "up-lunge"],
        "fps": 10,
        "frameMs": 100.0,
        "loop": True,
        "hitFrames": [0, 1, 2, 3],
        "hitWindowsMs": [
            {"frame": i, "startMs": i * 100, "endMs": (i + 1) * 100} for i in range(4)
        ],
        "derived": "Assembled from charge column 2 of each facing. The generator returned four-direction lunges, not an 8-frame orbit.",
        "qc": direction_block(saved, 4),
        "frames": [str(p.relative_to(ROOT)) for p in saved],
        "edgeTouchFrames": [],
    }


def action_record(form: str, action: str, spec: dict) -> dict:
    folder = ROOT / "forms" / form / action
    meta_path = folder / "pipeline-meta.json"
    if not meta_path.exists():
        return {"missing": True}
    meta = json.loads(meta_path.read_text())
    rows = int(meta["rows"])
    cols = int(meta["cols"])
    frames = list_frames(folder, action)
    directional = rows == 4 and action != "reincarnate"
    frame_ms = round(1000 / spec["fps"], 1)
    hit = spec.get("hitFrames", [])
    return {
        "sheet": f"forms/{form}/{action}/sheet-transparent.png",
        "gif": f"forms/{form}/{action}/animation.gif",
        "frameCount": len(frames),
        "rows": rows,
        "cols": cols,
        "cell": meta.get("cell_size", CELL),
        "directional": directional,
        "directions": DIRS if directional else ["sequence"],
        "phases": PHASES.get(action, []),
        "fps": spec["fps"],
        "frameMs": frame_ms,
        "loop": spec["loop"],
        "hitFrames": hit,
        "hitWindowsMs": [
            {"frame": h, "startMs": round(h * frame_ms, 1), "endMs": round((h + 1) * frame_ms, 1)}
            for h in hit
        ],
        "locomotion": spec.get("locomotion"),
        "qc": direction_block(frames, cols if rows > 1 else max(1, len(frames))),
        "edgeTouchFrames": meta.get("edge_touch_frames", []),
        "frames": [f"forms/{form}/{action}/{p.name}" for p in frames],
    }


def pack_people(folder: Path, prefix: str, names: list[str]) -> list[dict]:
    frames = list_frames(folder, prefix)
    people = []
    for i, (frame, name) in enumerate(zip(frames, names)):
        m = metrics(load_rgba(frame))
        people.append({
            "id": name,
            "index": i,
            "file": str(frame.relative_to(ROOT)),
            "heightPx": None if m.get("empty") else m["height"],
            "widthPx": None if m.get("empty") else m["width"],
            "bottom": None if m.get("empty") else m["bottom"],
        })
    return people


def main() -> None:
    forms_out = []
    previews = ROOT / "preview" / "renders"
    previews.mkdir(parents=True, exist_ok=True)
    envs = {
        "otter-creek": Image.open(ROOT / "environments/otter-creek.jpg"),
        "rutland-street": Image.open(ROOT / "environments/rutland-street.jpg"),
        "void-water": Image.open(ROOT / "environments/void-water.jpg"),
    }
    sil_row = Image.new("RGBA", (CELL * 4 + 30, CELL + 8), (20, 16, 12, 255))
    contrast_report = {}

    for fi, (form, timing) in enumerate(TIMING.items()):
        actions = {action: action_record(form, action, spec) for action, spec in timing.items()}
        spin = build_spin(form)
        if spin:
            actions["spin"] = spin
        idle0 = ROOT / "forms" / form / "idle" / "idle-1.png"
        idle_im = load_rgba(idle0) if idle0.exists() else None
        anchor = None
        if idle_im:
            sil = silhouette(idle_im)
            sil_row.paste(sil, (8 + fi * CELL, 4), sil)
            contrast_report[form] = {name: contrast_sample(idle_im, bg) for name, bg in envs.items()}
            for name, bg in envs.items():
                plate = bg.convert("RGB").resize((480, 480), Image.Resampling.BOX)
                sp = idle_im.resize((CELL * 3, CELL * 3), Image.Resampling.NEAREST)
                plate.paste(sp, ((480 - sp.width) // 2, 480 - sp.height - 40), sp)
                plate.save(previews / f"{form}-on-{name}.jpg", quality=86)
            m = metrics(idle_im)
            bb = m["bbox"]
            anchor = {
                "cell": [CELL, CELL],
                "feet": [CELL // 2, m["bottom"]],
                "origin": "feet",
                "collision": {
                    "x": bb[0] + int((bb[2] - bb[0]) * 0.22),
                    "y": bb[1] + int((bb[3] - bb[1]) * 0.42),
                    "w": int((bb[2] - bb[0]) * 0.56),
                    "h": int((bb[3] - bb[1]) * 0.48),
                },
                "head": [int(m["centroid"][0]), bb[1] + 8],
                "sockets": {
                    "note": "Nominal sockets. No tool-definition file existed. Tool sheet columns are lantern, two-hand, pole, pocket.",
                    "handMain": {
                        "down": [bb[0] + 6, (bb[1] + bb[3]) // 2],
                        "left": [bb[0] + 4, (bb[1] + bb[3]) // 2],
                        "right": [bb[2] - 6, (bb[1] + bb[3]) // 2],
                        "up": [CELL // 2 + 6, bb[1] + 18],
                    },
                    "handOff": {
                        "down": [bb[2] - 8, (bb[1] + bb[3]) // 2],
                        "left": [bb[2] - 6, (bb[1] + bb[3]) // 2],
                        "right": [bb[0] + 8, (bb[1] + bb[3]) // 2],
                        "up": [CELL // 2 - 6, bb[1] + 18],
                    },
                },
            }
        forms_out.append({"id": form, "display": form.replace("-", " "), "anchor": anchor, "actions": actions})

    sil_row.save(previews / "silhouettes.png")
    atk = Image.new("RGBA", (CELL * 4, CELL * 4), (244, 236, 220, 255))
    for fi, form in enumerate(TIMING):
        frames = list_frames(ROOT / "forms" / form / "attack", "attack")[:4]
        for i, fr in enumerate(frames):
            atk.alpha_composite(load_rgba(fr), (i * CELL, fi * CELL))
    atk.save(previews / "attack-down-rows.png")

    npcs = pack_people(ROOT / "npcs" / "bodies", "npc", NPC_NAMES)
    strides = pack_people(ROOT / "npcs" / "stride", "stride", NPC_NAMES)
    for n, s, age in zip(npcs, strides, NPC_AGE):
        n["age"] = age
        n["strideFile"] = s["file"]
        n["strideHeightPx"] = s["heightPx"]
        if n["heightPx"] and s["heightPx"]:
            n["strideDeltaPx"] = s["heightPx"] - n["heightPx"]

    portraits = pack_people(ROOT / "portraits" / "older", "portrait", PORTRAIT_OLDER) + pack_people(
        ROOT / "portraits" / "younger", "portrait", PORTRAIT_YOUNG
    )
    for p, g in zip(portraits, GEN_OLDER + GEN_YOUNG):
        p["generation"] = g

    walks = {}
    for key, age, fps in (("walk-child", "child", 9), ("walk-farmer", "adult", 8), ("walk-elder", "elder", 5)):
        folder = ROOT / "npcs" / key
        meta = json.loads((folder / "pipeline-meta.json").read_text())
        frames = list_frames(folder, "walk")
        walks[key] = {
            "age": age,
            "sheet": f"npcs/{key}/sheet-transparent.png",
            "frameCount": len(frames),
            "rows": meta["rows"],
            "cols": meta["cols"],
            "fps": fps,
            "qc": direction_block(frames, meta["cols"]),
            "frames": [str(p.relative_to(ROOT)) for p in frames],
        }

    manifest = {
        "title": "PREINCARNATION character animation",
        "inspected": {
            "workspaceGame": False,
            "spriteFilesFound": 0,
            "toolDefinitionsFound": False,
            "damageWindowsFound": False,
            "notes": [
                "Searched /workspace, /workspace/artifacts, and /opt/app-template.",
                "No PREINCARNATION source, sprite sheets, animation JSON, tool definitions, or combat timing files exist.",
                "Artifacts held only an unrelated Stay ledger. Nothing was overwritten.",
                "Cell size 96 was established for this delivery. It is not measured from a runtime.",
                "Hit windows below are a proposal. They are not a silent change to combat.",
            ],
        },
        "cell": {"w": CELL, "h": CELL},
        "directions": DIRS,
        "directionRows": "down, left, right, up",
        "displayScale": 2,
        "forms": forms_out,
        "npcs": npcs,
        "npcWalks": walks,
        "portraits": portraits,
        "contrast": contrast_report,
        "fx": {
            "blade-arc": {
                "status": "rejected-for-runtime",
                "reason": "Generated arc sheets still contained a hand or partial body. Kept under fx/blade-arc as a failed source, not an engine layer.",
                "sheet": "fx/blade-arc/sheet-transparent.png",
            }
        },
        "missing": [
            "Clean body-free blade-arc sheet.",
            "Unique four-direction walk cycles for 9 of 12 NPCs. Delivered: 12 standing bodies, 12 mid-stride poses, and full four-direction walks for child, adult farmer, and cane elder.",
            "A true 8-frame in-place spin. Charge sheets are four-direction lunges. Spin strips are assembled from the lunge column.",
            "Runtime tool definitions to match grip offsets against.",
            "Runtime damage windows to diff these hit timings against.",
        ],
    }
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    total = 0
    for form in forms_out:
        for action, data in form["actions"].items():
            total += data.get("frameCount", 0)
            qc = data.get("qc") or {}
            print(
                f"{form['id']:24} {action:12} frames={data.get('frameCount')} "
                f"slideX={qc.get('maxCentroidSlidePx')} sole={qc.get('maxBottomSpreadPx')} "
                f"hit={data.get('hitWindowsMs')}"
            )
    for key, data in walks.items():
        total += data["frameCount"]
        print(key, data["frameCount"], "slide", data["qc"].get("maxCentroidSlidePx"), "sole", data["qc"].get("maxBottomSpreadPx"))
    print("TOTAL_ANIM_FRAMES", total, "portraits", len(portraits), "npcs", len(npcs))
    print("CONTRAST", json.dumps(contrast_report))


if __name__ == "__main__":
    main()
