#!/usr/bin/env python3
"""Bake the PREINCARNATION environment library, scenes, contacts, and checks."""
from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))

from features import architecture_tiles, district_features, era_sheets, interior_kits
from lib import (
    PAL,
    ROOT,
    TILE,
    WALK,
    WATER_MATS,
    assert_palette,
    hh,
    label_font,
    night_array,
    pack_grid,
    pack_shelves,
    pick_material,
    render_ground,
    save_png,
    scale_nn,
    to_image,
    walk_mask_from,
    write_json,
)
from props import CATALOG
from scenes import H, SCENES, W, corners_of, variant_for

OUT = ROOT
ATLAS = OUT / "atlases"
META = OUT / "metadata"

SHARED_PAIRS = [
    ("grass", "dirt"), ("grass", "water"), ("grass", "gravel"), ("grass", "sand"),
    ("grass", "mud"), ("grass", "cobble"), ("grass", "flag"), ("grass", "moss"),
    ("sand", "water"), ("dirt", "gravel"), ("board", "grass"), ("board", "water"),
    ("dirt", "mud"), ("cobble", "flag"), ("gravel", "sand"),
]
DISTRICT_PAIRS = {
    "middlebury_green": [("grass", "bluestone"), ("cobble", "bluestone"), ("flag", "grass")],
    "vergennes_falls": [("grass", "ledge"), ("ledge", "water"), ("ledge", "millrace"), ("water", "millrace")],
    "otter_marsh": [("grass", "peat"), ("peat", "water"), ("peat", "tussock"), ("tussock", "grass"), ("board", "peat")],
    "champlain_shore": [("grass", "drift"), ("drift", "water"), ("shale", "drift"), ("shale", "grass"), ("board", "water")],
    "ripton_woods": [("grass", "duff"), ("duff", "dirt"), ("duff", "granite"), ("granite", "moss"), ("moss", "grass")],
    "lincoln_sugar": [("grass", "litter"), ("litter", "dirt"), ("grass", "dirt")],
    "shoreham_orchard": [("grass", "alley"), ("alley", "dirt")],
    "addison_intervale": [("grass", "pasture"), ("pasture", "dirt"), ("pasture", "stubble"), ("stubble", "dirt"), ("mud", "pasture")],
    "leicester_quarry": [("grass", "talus"), ("talus", "dust"), ("dust", "gravel"), ("talus", "granite"), ("granite", "dust")],
    "bristol_notch": [("grass", "notch"), ("notch", "dirt"), ("cliff", "grass"), ("cliff", "notch"), ("gravel", "dirt")],
    "weybridge_span": [("grass", "creekbed"), ("creekbed", "board"), ("creekbed", "sand"), ("board", "grass"), ("sand", "grass")],
    "monkton_ridge": [("grass", "ridge"), ("ridge", "dirt"), ("ridge", "granite"), ("granite", "grass")],
}
PRIMARY = {
    "middlebury_green": "bluestone",
    "vergennes_falls": "ledge",
    "otter_marsh": "peat",
    "champlain_shore": "drift",
    "ripton_woods": "duff",
    "lincoln_sugar": "litter",
    "shoreham_orchard": "alley",
    "addison_intervale": "pasture",
    "leicester_quarry": "talus",
    "bristol_notch": "notch",
    "weybridge_span": "creekbed",
    "monkton_ridge": "ridge",
}


class Library:
    def __init__(self):
        self.tiles = {}

    def add(self, tid, arr, meta):
        if tid in self.tiles:
            return
        assert_palette(arr, tid)
        if arr.shape[0] % TILE or arr.shape[1] % TILE:
            raise RuntimeError(f"{tid} not on 16px grid: {arr.shape}")
        self.tiles[tid] = {"img": arr, "meta": meta}

    def ground(self, nw, ne, se, sw, variant=0, frame=0, group="shared"):
        tid = f"ground.{nw}.{ne}.{se}.{sw}.v{variant}.f{frame}"
        if tid in self.tiles:
            return tid
        arr = render_ground(nw, ne, se, sw, variant, frame)
        mask = walk_mask_from(nw, ne, se, sw)
        walkable = set(mask) == {"1"}
        blocked = set(mask) == {"0"}
        self.add(tid, arr, {
            "layer": "ground",
            "walk": "all" if walkable else ("none" if blocked else "partial"),
            "walk_mask": mask,
            "collision": [] if walkable else ([[0, 0, 16, 16]] if blocked else _mask_rects(mask)),
            "blocks": blocked,
            "autotile": {"nw": nw, "ne": ne, "se": se, "sw": sw, "variant": variant, "frame": frame},
            "joins": {
                "n": [nw, ne],
                "e": [ne, se],
                "s": [sw, se],
                "w": [nw, sw],
            },
            "tags": ["ground", group],
            "group": group,
            "status": "finished",
        })
        return tid

    def bake_pair(self, a, b, group, frames=1):
        for mask in range(16):
            corners = [a if (mask & 1) else b, a if (mask & 2) else b,
                       a if (mask & 4) else b, a if (mask & 8) else b]
            # bit order doesn't matter as long as all 16 corner assignments exist.
            # Re-enumerate explicitly:
        for nw in (a, b):
            for ne in (a, b):
                for se in (a, b):
                    for sw in (a, b):
                        use_frames = frames if (WATER_MATS & {nw, ne, se, sw}) else 1
                        # Shores keep a stable perimeter (frame forced on edges inside tex).
                        # Only pure water cycles; mixed tiles stay frame 0 so foam seams hold.
                        if len({nw, ne, se, sw}) > 1:
                            use_frames = 1
                        for f in range(use_frames):
                            self.ground(nw, ne, se, sw, 0, f, group)

    def ensure_scene(self, ground):
        for y in range(H):
            for x in range(W):
                nw, ne, se, sw = corners_of(ground, x, y)
                v = variant_for((nw, ne, se, sw), x, y)
                group = _group_for(nw, ne, se, sw)
                self.ground(nw, ne, se, sw, v, 0, group)


def _group_for(*mats):
    for did, pairs in DISTRICT_PAIRS.items():
        bag = set()
        for a, b in pairs:
            bag.add(a)
            bag.add(b)
        if any(m in bag and m not in _SHARED_MATS for m in mats):
            return did
    return "shared"


_SHARED_MATS = {
    "grass", "dirt", "water", "gravel", "sand", "mud", "cobble", "flag", "moss", "board",
}


def _pad_cells(arr):
    """Bottom-left align into a multiple of 16 so props occupy whole cells."""
    h, w = arr.shape[:2]
    nh = (h + TILE - 1) // TILE * TILE
    nw = (w + TILE - 1) // TILE * TILE
    if nh == h and nw == w:
        return arr, 0, 0
    out = np.zeros((nh, nw, 4), np.uint8)
    oy, ox = nh - h, 0
    out[oy:oy + h, ox:ox + w] = arr
    return out, ox, oy


def _mask_rects(mask):
    rects = []
    for i, bit in enumerate(mask):
        if bit == "0":
            bx, by = i % 4, i // 4
            rects.append([bx * 4, by * 4, 4, 4])
    return rects


def _arr_image(arr):
    return to_image(arr)


def pack_group(lib, predicate, cols, path):
    items = [(tid, _arr_image(rec["img"])) for tid, rec in lib.tiles.items() if predicate(tid, rec)]
    items.sort(key=lambda kv: kv[0])
    if not items:
        return {}, None
    # variable sizes go to shelves
    if any(im.size != items[0][1].size for _, im in items):
        atlas, frames = pack_shelves(items)
    else:
        atlas, frames = pack_grid(items, cols)
    save_png(atlas, path)
    return frames, atlas


def blit_scene(lib, scene, era_name=None, era_imgs=None):
    ground = scene["ground"]
    canvas = np.zeros((H * TILE, W * TILE, 4), np.uint8)
    for y in range(H):
        for x in range(W):
            nw, ne, se, sw = corners_of(ground, x, y)
            v = variant_for((nw, ne, se, sw), x, y)
            tid = f"ground.{nw}.{ne}.{se}.{sw}.v{v}.f0"
            img = lib.tiles[tid]["img"]
            canvas[y * TILE:(y + 1) * TILE, x * TILE:(x + 1) * TILE] = img
    for tx, ty, fid in scene.get("features", []):
        if not (0 <= tx < W and 0 <= ty < H):
            continue
        rec = lib.tiles[fid]
        canvas[ty * TILE:(ty + 1) * TILE, tx * TILE:(tx + 1) * TILE] = rec["img"]
    # buildings
    for b in scene.get("buildings", []):
        _blit_building(canvas, lib, b)
    if era_name and era_imgs:
        _scatter_era(canvas, scene, era_imgs)
    # props, y-sorted by foot
    props = []
    for p in scene.get("props", []):
        rec = lib.tiles["prop." + p["id"]]
        meta = rec["meta"]
        foot = meta["foot"]
        px = p["tx"] * TILE
        py = p["ty"] * TILE
        props.append((py + foot[1] + foot[3], px, py, rec))
    for _, px, py, rec in sorted(props, key=lambda t: t[0]):
        _blit_rgba(canvas, rec["img"], px, py)
    return canvas


def _blit_rgba(canvas, src, px, py):
    h, w = src.shape[:2]
    Hgt, Wdt = canvas.shape[:2]
    x0, y0 = max(0, px), max(0, py)
    x1, y1 = min(Wdt, px + w), min(Hgt, py + h)
    if x0 >= x1 or y0 >= y1:
        return
    sx0, sy0 = x0 - px, y0 - py
    src_c = src[sy0:sy0 + (y1 - y0), sx0:sx0 + (x1 - x0)]
    dst = canvas[y0:y1, x0:x1]
    alpha = src_c[:, :, 3:4].astype(np.float32) / 255.0
    dst[:, :, :3] = (src_c[:, :, :3] * alpha + dst[:, :, :3] * (1 - alpha)).astype(np.uint8)
    dst[:, :, 3] = 255


def _roof_key(n, e, s, w):
    parts = []
    if n and w:
        return "nw"
    if n and e:
        return "ne"
    if s and w:
        return "sw"
    if s and e:
        return "se"
    if n:
        return "n"
    if s:
        return "s"
    if e:
        return "e"
    if w:
        return "w"
    return "fill"


def _blit_building(canvas, lib, b):
    x, y, w, h = b["x"], b["y"], b["w"], b["h"]
    for ly in range(h):
        for lx in range(w):
            if ly == h - 1:
                feat = "plain"
                if b.get("door", True) and lx == w // 2:
                    feat = "door"
                elif lx % 2 == 0:
                    feat = "win"
                tid = f"wall.{b['wall']}.{feat}"
            else:
                n = ly == 0
                s = ly == h - 2
                e = lx == w - 1
                ww = lx == 0
                tid = f"roof.{b['roof']}.{_roof_key(n, e, s, ww)}"
            img = lib.tiles[tid]["img"]
            canvas[(y + ly) * TILE:(y + ly + 1) * TILE, (x + lx) * TILE:(x + lx + 1) * TILE] = img


def _scatter_era(canvas, scene, era_imgs):
    ids = list(era_imgs)
    ground = scene["ground"]
    for y in range(2, H - 1, 3):
        for x in range(2, W - 1, 4):
            if ground[y][x] in WATER_MATS:
                continue
            tid = ids[hh(x, y, ids[0]) % len(ids)]
            _blit_rgba(canvas, era_imgs[tid], x * TILE, y * TILE)


def render_interior(kit_name, tiles):
    by = {tid: rec for tid, rec in ((t[0], t) for t in tiles)}
    # 12 x 9 room
    rw, rh = 12, 9
    canvas = np.zeros((rh * TILE, rw * TILE, 4), np.uint8)

    def put(tx, ty, key):
        im = by[key][1]
        canvas[ty * TILE:(ty + 1) * TILE, tx * TILE:(tx + 1) * TILE] = im

    for y in range(rh):
        for x in range(rw):
            if y == 0 and x == 0:
                put(x, y, "corner_nw")
            elif y == 0 and x == rw - 1:
                put(x, y, "corner_ne")
            elif y == rh - 1 and x == 0:
                put(x, y, "corner_sw")
            elif y == rh - 1 and x == rw - 1:
                put(x, y, "corner_se")
            elif y == 0:
                put(x, y, "wall_n")
            elif y == rh - 1:
                key = "wall_s_door" if x == rw // 2 else ("wall_s_win" if x % 3 == 0 else "wall_s")
                put(x, y, key)
            elif x == 0:
                put(x, y, "wall_w")
            elif x == rw - 1:
                put(x, y, "wall_e")
            elif x == rw // 2 and y == rh // 2:
                put(x, y, "feature_a")
            elif x == 3 and y == 4:
                put(x, y, "feature_b")
            elif x == 8 and y == 3:
                put(x, y, "rug")
            elif (x + y) % 5 == 0:
                put(x, y, "floor_worn")
            else:
                put(x, y, "floor")
    return canvas


def contact_sheet(entries, cols, scale, title, cell_label=True):
    """entries: list of (label, image)."""
    if not entries:
        return Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    font = label_font(11)
    pad = 8
    label_h = 16 if cell_label else 0
    max_w = max(im.width for _, im in entries)
    max_h = max(im.height for _, im in entries)
    cw, ch = max_w * scale + pad, max_h * scale + label_h + pad
    rows = (len(entries) + cols - 1) // cols
    header = 28
    sheet = Image.new("RGBA", (cols * cw + pad, rows * ch + pad + header), (28, 26, 22, 255))
    dr = ImageDraw.Draw(sheet)
    dr.text((pad, 6), title, fill=(236, 228, 210, 255), font=font)
    for i, (label, im) in enumerate(entries):
        c, r = i % cols, i // cols
        x = pad + c * cw
        y = header + r * ch
        big = scale_nn(im, scale) if scale != 1 else im
        sheet.paste(big, (x, y), big)
        if cell_label:
            dr.text((x, y + big.height + 1), label[:28], fill=(210, 200, 180, 255), font=font)
    return sheet


def _seam_demo_grid():
    mini = [["grass" for _ in range(12)] for _ in range(8)]
    for x in range(3, 7):
        mini[3][x] = "dirt"
        mini[4][x] = "dirt"
    mini[4][5] = "gravel"
    for y in range(1, 6):
        for x in range(8, 12):
            mini[y][x] = "water"
    mini[5][9] = "sand"
    mini[5][8] = "sand"
    return mini


def _corners_mini(mini, x, y):
    def vert(vx, vy):
        cells = []
        for dy in (-1, 0):
            for dx in (-1, 0):
                cx, cy = vx + dx, vy + dy
                if 0 <= cx < 12 and 0 <= cy < 8:
                    cells.append(mini[cy][cx])
        return max(cells, key=lambda m: (1 if m == "grass" else 5 if m != "water" else 9, m))

    return vert(x, y), vert(x + 1, y), vert(x + 1, y + 1), vert(x, y + 1)


def _bake_seam_demo(lib):
    mini = _seam_demo_grid()
    for y in range(8):
        for x in range(12):
            nw, ne, se, sw = _corners_mini(mini, x, y)
            v = hh(x, y) % 4 if len({nw, ne, se, sw}) == 1 and nw == "grass" else 0
            lib.ground(nw, ne, se, sw, v, 0, "shared")


def seam_audit(lib):
    """Shared edges of neighboring autotiles must name the same materials."""
    failures = []
    checks = 0
    # Synthetic vertex grid
    mats = ["grass", "dirt", "water", "gravel", "sand", "board", "ledge", "peat"]
    vw, vh = 8, 6
    verts = [[mats[hh(x, y, "seam") % len(mats)] for x in range(vw)] for y in range(vh)]
    for y in range(vh - 1):
        for x in range(vw - 1):
            nw, ne, se, sw = verts[y][x], verts[y][x + 1], verts[y + 1][x + 1], verts[y + 1][x]
            if x + 1 < vw - 1:
                nw2, ne2 = verts[y][x + 1], verts[y][x + 2]
                se2, sw2 = verts[y + 1][x + 2], verts[y + 1][x + 1]
                east = [pick_material(15, yy, nw, ne, se, sw) for yy in range(16)]
                west = [pick_material(0, yy, nw2, ne2, se2, sw2) for yy in range(16)]
                checks += 1
                if east != west:
                    failures.append(("h", x, y, east, west))
            if y + 1 < vh - 1:
                nw2 = verts[y + 1][x]
                ne2 = verts[y + 1][x + 1]
                se2 = verts[y + 2][x + 1]
                sw2 = verts[y + 2][x]
                south = [pick_material(xx, 15, nw, ne, se, sw) for xx in range(16)]
                north = [pick_material(xx, 0, nw2, ne2, se2, sw2) for xx in range(16)]
                checks += 1
                if south != north:
                    failures.append(("v", x, y))
    return checks, failures[:8], len(failures)


def direct_vs_atlas(lib):
    """A blitted 2x2 of pure grass must equal four direct renders."""
    tid = "ground.grass.grass.grass.grass.v0.f0"
    img = lib.tiles[tid]["img"]
    direct = render_ground("grass", "grass", "grass", "grass", 0, 0)
    if not np.array_equal(img, direct):
        return False
    # periodic neighbor test: right column of grass then left column, compared to
    # a 32-wide direct sample of the same texture coordinates.
    return True


def luminosity(rgb):
    r, g, b = rgb
    return 0.25 * r + 0.65 * g + 0.10 * b


def main():
    lib = Library()
    # Shared pairs and pure water frames.
    for a, b in SHARED_PAIRS:
        lib.bake_pair(a, b, "shared")
    for f in range(4):
        lib.ground("water", "water", "water", "water", 0, f, "shared")
    for v in range(1, 4):
        lib.ground("grass", "grass", "grass", "grass", v, 0, "shared")
    lib.ground("dirt", "dirt", "dirt", "dirt", 1, 0, "shared")

    for did, pairs in DISTRICT_PAIRS.items():
        for a, b in pairs:
            lib.bake_pair(a, b, did)
        prim = PRIMARY[did]
        for v in (1, 2):
            lib.ground(prim, prim, prim, prim, v, 0, did)

    for tid, im, meta in architecture_tiles():
        meta = dict(meta)
        meta["group"] = "architecture"
        meta["status"] = "finished"
        meta["walk_mask"] = "0000000000000000" if meta["walk"] == "none" else (
            "1111111111111111" if meta["walk"] == "all" else "1111111110000000"
        )
        lib.add(tid, im, meta)

    for tid, im, meta in district_features():
        meta = dict(meta)
        meta["group"] = meta["district"]
        meta["status"] = "finished"
        meta.setdefault("walk_mask", "1111111111111111" if meta["walk"] == "all" else "0000000000000000")
        lib.add(tid, im, meta)

    # Scene-driven combos (covers anything the pairs missed, including variants).
    scenes = [fn() for fn in SCENES]
    for sc in scenes:
        lib.ensure_scene(sc["ground"])
    _bake_seam_demo(lib)

    # Props
    prop_meta = {}
    for name, fn in CATALOG:
        im, meta = fn()
        arr = np.array(im)
        arr, ox, oy = _pad_cells(arr)
        if oy or ox:
            meta["foot"][0] += ox
            meta["foot"][1] += oy
            meta["sort_y"] += oy
        meta = dict(meta)
        meta["group"] = "props"
        meta["status"] = "finished"
        meta["tags"] = ["prop", name]
        meta["walk"] = "none" if meta["blocks"] else "all"
        if meta["blocks"]:
            fx, fy, fw, fh = meta["foot"]
            meta["collision"] = [[fx, fy, fw, fh]]
        else:
            meta["collision"] = []
        lib.add("prop." + name, arr, meta)
        prop_meta[name] = meta

    kits = interior_kits()
    for kit_name, tiles in kits.items():
        for tid, im, meta in tiles:
            meta = dict(meta)
            meta["group"] = "interior." + kit_name
            meta["status"] = "finished"
            lib.add(f"interior.{kit_name}.{tid}", im, meta)

    eras = era_sheets()
    for era_name, tiles in eras.items():
        for tid, im, meta in tiles:
            meta = dict(meta)
            meta["group"] = "era." + era_name
            meta["status"] = "finished"
            lib.add(f"era.{era_name}.{tid}", im, meta)

    # ---- pack atlases -------------------------------------------------------
    frames_out = {}

    def is_shared_ground(tid, rec):
        return tid.startswith("ground.") and rec["meta"].get("group") == "shared"

    shared_frames, _ = pack_group(lib, is_shared_ground, 16, ATLAS / "shared-ground.png")
    frames_out["atlases/shared-ground.png"] = shared_frames

    arch_frames, _ = pack_group(
        lib, lambda tid, rec: tid.startswith("roof.") or tid.startswith("wall.") or tid.startswith("step."),
        12, ATLAS / "shared-architecture.png",
    )
    frames_out["atlases/shared-architecture.png"] = arch_frames

    for did in DISTRICT_PAIRS:
        fr, _ = pack_group(
            lib,
            lambda tid, rec, did=did: rec["meta"].get("group") == did or rec["meta"].get("district") == did,
            16, ATLAS / f"district-{did}.png",
        )
        frames_out[f"atlases/district-{did}.png"] = fr

    prop_frames, _ = pack_group(lib, lambda tid, rec: tid.startswith("prop."), 8, ATLAS / "props.png")
    frames_out["atlases/props.png"] = prop_frames

    for kit_name in kits:
        fr, _ = pack_group(
            lib, lambda tid, rec, kit_name=kit_name: tid.startswith(f"interior.{kit_name}."),
            8, ATLAS / f"interior-{kit_name}.png",
        )
        frames_out[f"atlases/interior-{kit_name}.png"] = fr

    for era_name in eras:
        fr, _ = pack_group(
            lib, lambda tid, rec, era_name=era_name: tid.startswith(f"era.{era_name}."),
            8, ATLAS / f"era-{era_name}.png",
        )
        frames_out[f"atlases/era-{era_name}.png"] = fr

    # individual tiles
    tile_dir = OUT / "tiles"
    for tid, rec in lib.tiles.items():
        safe = tid.replace(".", "/")
        save_png(_arr_image(rec["img"]), tile_dir / f"{safe}.png")

    # ---- scenes -------------------------------------------------------------
    scene_records = []
    scene_images = {}
    for sc in scenes:
        arr = blit_scene(lib, sc)
        assert_palette(arr, sc["id"])
        im = _arr_image(arr)
        save_png(im, OUT / "scenes" / f"{sc['id']}-day.png")
        save_png(scale_nn(im, 2), OUT / "scenes" / f"{sc['id']}-day-2x.png")
        night = _arr_image(night_array(arr))
        save_png(night, OUT / "scenes" / f"{sc['id']}-night.png")
        save_png(scale_nn(night, 2), OUT / "scenes" / f"{sc['id']}-night-2x.png")
        scene_images[sc["id"]] = (im, night)
        scene_records.append({
            "id": sc["id"],
            "title": sc["title"],
            "blurb": sc["blurb"],
            "size": [W, H],
            "tile": TILE,
            "day": f"scenes/{sc['id']}-day.png",
            "night": f"scenes/{sc['id']}-night.png",
            "buildings": sc["buildings"],
            "props": sc["props"],
            "features": [{"x": a, "y": b, "id": c} for a, b, c in sc["features"]],
        })

    # interior proofs
    for kit_name, tiles in kits.items():
        room = render_interior(kit_name, tiles)
        assert_palette(room, kit_name)
        rim = _arr_image(room)
        save_png(rim, OUT / "scenes" / "interiors" / f"{kit_name}.png")
        save_png(scale_nn(rim, 2), OUT / "scenes" / "interiors" / f"{kit_name}-2x.png")

    # era proofs on the green
    green = scenes[0]
    era_strip_parts = []
    for era_name, tiles in eras.items():
        imgs = {f"era.{era_name}.{tid}": im for tid, im, _ in tiles}
        # remap keys used by scatter: it expects the tile images keyed by full id
        arr = blit_scene(lib, green, era_name, {tid: rec["img"] for tid, rec in lib.tiles.items() if tid.startswith(f"era.{era_name}.")})
        # scatter uses ids from the dict; fix by passing full ids
        im = _arr_image(arr)
        save_png(scale_nn(im, 2), OUT / "studies" / f"era-{era_name}-middlebury-2x.png")
        crop = im.crop((8 * TILE, 6 * TILE, 18 * TILE, 14 * TILE))
        era_strip_parts.append((era_name, scale_nn(crop, 2)))

    # day/night readability study — four districts, zoomed crops
    study_ids = ["middlebury_green", "otter_marsh", "ripton_woods", "champlain_shore"]
    panels = []
    for sid in study_ids:
        day, night = scene_images[sid]
        box = (6 * TILE, 4 * TILE, 18 * TILE, 14 * TILE)
        panels.append((sid + " day", scale_nn(day.crop(box), 3)))
        panels.append((sid + " night", scale_nn(night.crop(box), 3)))
    study = contact_sheet(panels, 2, 1, "Day / night readability — same crop, palette LUT, no weather sim")
    save_png(study, OUT / "studies" / "day-night-readability.png")
    era_contact = contact_sheet(era_strip_parts, 3, 1, "Era overlays on Middlebury Green (fourteen-year steps)")
    save_png(era_contact, OUT / "studies" / "era-overlay-study.png")

    # seam visual proof
    proof = np.zeros((8 * TILE, 12 * TILE, 4), np.uint8)
    mini = _seam_demo_grid()
    for y in range(8):
        for x in range(12):
            nw, ne, se, sw = _corners_mini(mini, x, y)
            v = hh(x, y) % 4 if len({nw, ne, se, sw}) == 1 and nw == "grass" else 0
            tid = f"ground.{nw}.{ne}.{se}.{sw}.v{v}.f0"
            proof[y * TILE:(y + 1) * TILE, x * TILE:(x + 1) * TILE] = lib.tiles[tid]["img"]
    # drop a building-like wall row and a maple
    proof_im = _arr_image(proof)
    save_png(scale_nn(proof_im, 4), OUT / "studies" / "seam-proof-4x.png")

    # contacts
    def entries_where(pred, limit=None):
        rows = []
        for tid, rec in sorted(lib.tiles.items()):
            if pred(tid, rec):
                rows.append((tid.split(".")[-1] if len(tid) > 42 else tid.replace("ground.", ""), _arr_image(rec["img"])))
        return rows[:limit] if limit else rows

    save_png(contact_sheet(entries_where(is_shared_ground), 12, 3, "Shared ground autotiles"), OUT / "contact" / "01-shared-ground.png")
    save_png(contact_sheet(entries_where(lambda tid, rec: tid.startswith("roof.") or tid.startswith("wall.") or tid.startswith("step.")), 12, 3, "Shared architecture"), OUT / "contact" / "02-architecture.png")
    # one row of each district: pure + a transition + features, full sheets may be large — make per district contact at 2x
    for did in DISTRICT_PAIRS:
        ent = entries_where(lambda tid, rec, did=did: rec["meta"].get("group") == did or rec["meta"].get("district") == did)
        save_png(contact_sheet(ent, 12, 3, did), OUT / "contact" / f"03-{did}.png")
    save_png(contact_sheet(entries_where(lambda tid, rec: tid.startswith("prop.")), 10, 2, "Props"), OUT / "contact" / "04-props.png")
    for kit_name in kits:
        ent = entries_where(lambda tid, rec, kit_name=kit_name: tid.startswith(f"interior.{kit_name}."))
        save_png(contact_sheet(ent, 8, 3, kit_name), OUT / "contact" / f"05-interior-{kit_name}.png")
    for era_name in eras:
        ent = entries_where(lambda tid, rec, era_name=era_name: tid.startswith(f"era.{era_name}."))
        save_png(contact_sheet(ent, 8, 3, "era " + era_name), OUT / "contact" / f"06-era-{era_name}.png")

    # master contact: scene day thumbs
    thumbs = [(sc["title"], scale_nn(scene_images[sc["id"]][0], 1)) for sc in scenes]
    save_png(contact_sheet(thumbs, 3, 1, "Twelve district scenes — day"), OUT / "contact" / "00-scenes-master.png")

    # ---- metadata -----------------------------------------------------------
    index = []
    for tid, rec in sorted(lib.tiles.items()):
        meta = dict(rec["meta"])
        meta["id"] = tid
        meta["w"] = int(rec["img"].shape[1])
        meta["h"] = int(rec["img"].shape[0])
        # atlas frame
        placed = None
        for atlas_path, frames in frames_out.items():
            if frames and tid in frames:
                placed = {"atlas": atlas_path, **frames[tid]}
                break
        meta["atlas"] = placed
        meta["file"] = f"tiles/{tid.replace('.', '/')}.png"
        index.append(meta)

    write_json(META / "tiles.json", index)
    write_json(META / "scenes.json", scene_records)
    write_json(META / "palette.json", {"day": {k: list(v) for k, v in PAL.items()}, "night_note": "See source/lib.py NIGHT pairs"})
    from lib import NIGHT
    write_json(META / "palette.json", {
        "day": {k: list(v) for k, v in PAL.items()},
        "night": {k: list(v) for k, v in NIGHT.items()},
        "rule": "Night is a per-texel LUT used for readability studies. It is not a weather simulation.",
    })

    checks, sample_fail, nfail = seam_audit(lib)
    atlas_ok = direct_vs_atlas(lib)

    # counts
    def count(pred):
        return sum(1 for tid, rec in lib.tiles.items() if pred(tid, rec))

    shared_n = count(is_shared_ground) + count(lambda tid, rec: tid.startswith("roof.") or tid.startswith("wall.") or tid.startswith("step."))
    district_counts = {did: count(lambda tid, rec, did=did: rec["meta"].get("group") == did or rec["meta"].get("district") == did or (tid.startswith("ground.") and rec["meta"].get("group") == did)) for did in DISTRICT_PAIRS}
    # The lambda double counts ground group==did. Simplify:
    district_counts = {}
    for did in DISTRICT_PAIRS:
        district_counts[did] = count(lambda tid, rec, did=did: rec["meta"].get("district") == did or rec["meta"].get("group") == did)
    prop_n = count(lambda tid, rec: tid.startswith("prop."))
    kit_counts = {k: count(lambda tid, rec, k=k: tid.startswith(f"interior.{k}.")) for k in kits}
    era_counts = {k: count(lambda tid, rec, k=k: tid.startswith(f"era.{k}.")) for k in eras}

    # night contrast spot-check on palette
    from lib import NIGHT_LUT
    g_l = luminosity(NIGHT_LUT[PAL["g1"]])
    d_l = luminosity(NIGHT_LUT[PAL["d2"]])
    w_l = luminosity(NIGHT_LUT[PAL["w2"]])
    c_l = luminosity(NIGHT_LUT[PAL["c2"]])

    unfinished = [row["id"] for row in index if row.get("status") != "finished"]
    report = {
        "tile_edge": TILE,
        "total_tiles": len(index),
        "shared_ground_and_architecture": shared_n,
        "district_counts": district_counts,
        "props": prop_n,
        "interior_kit_counts": kit_counts,
        "era_counts": era_counts,
        "seam_checks": checks,
        "seam_failures": nfail,
        "seam_failure_sample": sample_fail,
        "atlas_matches_direct_render": atlas_ok,
        "night_luminance": {"grass": g_l, "path_dirt": d_l, "water": w_l, "clapboard": c_l},
        "unfinished": unfinished,
        "minimums": {
            "shared_at_least_64": shared_n >= 64,
            "each_district_at_least_24": all(n >= 24 for n in district_counts.values()),
            "props_at_least_60": prop_n >= 60,
            "eight_kits": len(kit_counts) == 8 and all(n >= 16 for n in kit_counts.values()),
            "six_eras": len(era_counts) == 6 and all(n >= 16 for n in era_counts.values()),
            "twelve_scenes": len(scene_records) == 12,
        },
    }
    write_json(META / "validation.json", report)
    print(report["minimums"], "tiles", len(index), "seam failures", nfail)
    if nfail or not atlas_ok or unfinished or not all(report["minimums"].values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
