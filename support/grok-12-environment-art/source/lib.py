"""PREINCARNATION environment pixel core.

Original 16px top-down tiles. Every ground color is a period-16 texture so a
tile's right column is the periodic predecessor of the next tile's left column.
Autotile masks agree across a shared edge because they are a function of the
two shared corners only. Variants may recolor interior pixels, never the
perimeter, so any variant can sit beside any other.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TILE = 16

# Closed day palette. Every opaque texel must be one of these.
PAL = {
    "g0": (22, 58, 32),
    "g1": (36, 92, 46),
    "g2": (54, 118, 58),
    "g3": (96, 150, 72),
    "g4": (164, 168, 86),
    "gold": (212, 170, 58),
    "aster": (186, 96, 132),
    "cream": (232, 226, 206),
    "d0": (54, 34, 22),
    "d1": (104, 68, 40),
    "d2": (146, 102, 62),
    "d3": (186, 150, 102),
    "m0": (46, 40, 32),
    "m1": (78, 62, 46),
    "s0": (40, 38, 36),
    "s1": (96, 92, 86),
    "s2": (148, 144, 136),
    "s3": (196, 192, 182),
    "w0": (10, 32, 52),
    "w1": (18, 62, 92),
    "w2": (36, 102, 128),
    "w3": (86, 158, 166),
    "w4": (214, 230, 226),
    "a0": (112, 92, 64),
    "a1": (168, 146, 104),
    "a2": (214, 196, 158),
    "wd0": (40, 24, 16),
    "wd1": (98, 58, 32),
    "wd2": (154, 102, 58),
    "wd3": (198, 158, 108),
    "b0": (62, 28, 26),
    "b1": (132, 58, 46),
    "b2": (172, 96, 74),
    "mort": (176, 164, 146),
    "c0": (168, 164, 152),
    "c1": (214, 210, 198),
    "c2": (236, 232, 220),
    "trim": (26, 48, 40),
    "shut": (32, 48, 74),
    "glass": (150, 186, 196),
    "glasshi": (214, 230, 226),
    "r0": (32, 38, 44),
    "r1": (58, 66, 74),
    "r2": (98, 106, 112),
    "mp0": (92, 28, 22),
    "mp1": (168, 62, 28),
    "mp2": (204, 112, 40),
    "mp3": (132, 78, 36),
    "sp0": (14, 36, 30),
    "sp1": (26, 62, 46),
    "sp2": (48, 92, 64),
    "ir0": (42, 44, 48),
    "ir1": (118, 122, 128),
    "rust": (140, 74, 42),
    "redb": (138, 42, 36),
    "redb2": (168, 64, 52),
    "cop": (176, 104, 58),
    "cop2": (212, 148, 84),
    "ink": (16, 14, 12),
    "foam": (232, 238, 234),
    "leaf": (176, 72, 32),
    "leaf2": (120, 42, 24),
    "needle": (86, 62, 36),
    "peat": (42, 36, 26),
    "peat2": (62, 48, 32),
    "blueg": (74, 92, 108),
    "blueg2": (108, 124, 136),
    "dust": (168, 156, 140),
    "corn": (196, 168, 78),
    "corn2": (148, 122, 52),
    "white": (240, 236, 228),
    "rib": (168, 42, 48),
}

PAL_RGB = set(PAL.values())

# Designed night pairs. Luminance stays ordered: grass < water < path < wall.
NIGHT = {
    "g0": (10, 22, 20),
    "g1": (14, 32, 28),
    "g2": (22, 46, 38),
    "g3": (42, 64, 48),
    "g4": (78, 74, 48),
    "gold": (120, 96, 42),
    "aster": (96, 48, 72),
    "cream": (138, 140, 132),
    "d0": (28, 20, 16),
    "d1": (62, 44, 32),
    "d2": (92, 70, 48),
    "d3": (124, 102, 74),
    "m0": (24, 22, 20),
    "m1": (42, 36, 30),
    "s0": (22, 24, 28),
    "s1": (58, 62, 70),
    "s2": (96, 102, 112),
    "s3": (140, 146, 156),
    "w0": (8, 20, 40),
    "w1": (16, 40, 72),
    "w2": (32, 78, 108),
    "w3": (70, 120, 138),
    "w4": (160, 186, 196),
    "a0": (64, 54, 40),
    "a1": (104, 92, 70),
    "a2": (148, 136, 112),
    "wd0": (22, 16, 12),
    "wd1": (58, 36, 24),
    "wd2": (96, 66, 42),
    "wd3": (132, 108, 78),
    "b0": (36, 18, 18),
    "b1": (78, 36, 32),
    "b2": (110, 64, 52),
    "mort": (112, 108, 100),
    "c0": (96, 100, 108),
    "c1": (132, 138, 146),
    "c2": (168, 174, 184),
    "trim": (16, 28, 26),
    "shut": (20, 28, 48),
    "glass": (70, 110, 130),
    "glasshi": (150, 180, 190),
    "r0": (16, 20, 28),
    "r1": (32, 40, 52),
    "r2": (58, 68, 80),
    "mp0": (52, 18, 16),
    "mp1": (96, 36, 20),
    "mp2": (128, 70, 32),
    "mp3": (78, 48, 26),
    "sp0": (8, 20, 18),
    "sp1": (14, 34, 28),
    "sp2": (28, 52, 40),
    "ir0": (24, 28, 34),
    "ir1": (78, 86, 98),
    "rust": (84, 46, 30),
    "redb": (78, 26, 24),
    "redb2": (104, 40, 36),
    "cop": (108, 66, 40),
    "cop2": (140, 100, 62),
    "ink": (8, 8, 10),
    "foam": (150, 170, 176),
    "leaf": (104, 46, 24),
    "leaf2": (70, 28, 18),
    "needle": (52, 40, 26),
    "peat": (22, 20, 16),
    "peat2": (36, 30, 22),
    "blueg": (42, 56, 72),
    "blueg2": (70, 86, 102),
    "dust": (110, 106, 98),
    "corn": (120, 104, 52),
    "corn2": (90, 76, 38),
    "white": (160, 164, 170),
    "rib": (110, 28, 36),
}

assert set(NIGHT) == set(PAL)
NIGHT_LUT = {PAL[k]: NIGHT[k] for k in PAL}

WALK = {
    "grass", "dirt", "gravel", "sand", "mud", "cobble", "flag", "moss",
    "bluestone", "ledge", "peat", "tussock", "shale", "drift", "duff",
    "granite", "litter", "alley", "pasture", "stubble", "talus", "notch",
    "creekbed", "board", "ridge", "dust",
}
# Not walkable: water, millrace, cliff, cutface, and architecture.

WATER_MATS = {"water", "millrace"}


def hh(*xs) -> int:
    n = 2166136261
    for x in xs:
        if isinstance(x, str):
            for ch in x:
                n ^= ord(ch)
                n = (n * 16777619) & 0xFFFFFFFF
        else:
            n ^= int(x) & 0xFFFFFFFF
            n = (n * 16777619) & 0xFFFFFFFF
    return n


def shade(options, *xs):
    return options[hh(*xs) % len(options)]


def _band_grass(x, y):
    n = hh(x, y, "g")
    col = (PAL["g1"], PAL["g2"], PAL["g2"], PAL["g0"], PAL["g3"], PAL["g1"])[n % 6]
    if y < 15 and hh(x, y, "blade") % 7 == 0:
        return PAL["g0"]
    if y > 0 and hh(x, y - 1, "blade") % 7 == 0:
        return PAL["g3"]
    if hh(x, y, "dry") % 19 == 0:
        return PAL["g4"]
    return col


def _flowers(x, y, variant, base):
    if variant == 0 or x in (0, 15) or y in (0, 15):
        return base
    n = hh(x, y, "fl", variant)
    if n % 23 == 0:
        return PAL["gold"]
    if n % 29 == 0:
        return PAL["aster"]
    if n % 31 == 0:
        return PAL["cream"]
    if n % 5 == 0:
        return PAL["g0"] if n % 2 == 0 else PAL["g3"]
    return base


def tex(mat: str, x: int, y: int, variant: int = 0, frame: int = 0, edge: bool = False):
    x %= 16
    y %= 16
    if mat == "grass":
        return _flowers(x, y, 0 if edge else variant, _band_grass(x, y))
    if mat == "dirt":
        n = hh(x, y, "d")
        col = (PAL["d1"], PAL["d2"], PAL["d0"], PAL["d1"], PAL["d3"])[n % 5]
        if not edge and variant == 1 and n % 6 == 0 and 2 < y < 13 and x % 5 == 2:
            return PAL["d0"]
        if hh(x, y, "peb") % 17 == 0:
            return PAL["d3"]
        return col
    if mat == "mud":
        n = hh(x, y, "m")
        return (PAL["m0"], PAL["m1"], PAL["d0"], PAL["m1"])[n % 4]
    if mat == "gravel":
        n = hh(x, y, "v")
        return (PAL["s1"], PAL["s2"], PAL["d2"], PAL["s0"], PAL["a1"])[n % 5]
    if mat == "sand":
        n = hh(x, y, "a")
        return (PAL["a1"], PAL["a2"], PAL["a0"], PAL["a1"], PAL["a2"])[n % 5]
    if mat == "cobble":
        if x % 8 == 4 or y % 8 == 4:
            return PAL["s0"]
        return shade((PAL["s1"], PAL["s2"], PAL["s3"], PAL["s1"]), x, y, "cb")
    if mat == "flag":
        if x % 8 in (0, 7) or y % 8 in (0, 7):
            return PAL["s0"]
        return shade((PAL["s2"], PAL["s3"], PAL["s1"]), x // 2, y // 2, "fl")
    if mat == "moss":
        n = hh(x, y, "ms")
        col = (PAL["g0"], PAL["g1"], PAL["sp1"], PAL["g2"])[n % 4]
        if n % 11 == 0:
            return PAL["g3"]
        return col
    if mat == "water":
        f = 0 if edge else frame
        yy = (y + f * 2) % 16
        band = (PAL["w1"], PAL["w2"], PAL["w1"], PAL["w0"])[yy % 4]
        if (x * 3 + yy * 5 + f) % 13 == 0:
            return PAL["w2"]
        if (x + f * 3) % 9 == 0 and yy % 4 == 1 and not edge:
            return PAL["w3"]
        return band
    if mat == "millrace":
        f = 0 if edge else frame
        streak = (y * 2 + x + f) % 5 == 0
        return PAL["w4"] if streak else (PAL["w2"] if (y + f) % 2 == 0 else PAL["w1"])
    if mat == "bluestone":
        if x % 8 in (0, 7) or y % 8 in (0, 7):
            return PAL["s0"]
        return shade((PAL["blueg"], PAL["blueg2"], PAL["s2"]), x // 3, y // 3, "bs")
    if mat == "ledge":
        n = hh(x, y, "lg")
        col = (PAL["s0"], PAL["s1"], PAL["w0"], PAL["s1"])[n % 4]
        if y % 5 == 2:
            return PAL["s0"]
        if n % 9 == 0:
            return PAL["g0"]
        return col
    if mat == "peat":
        return shade((PAL["peat"], PAL["peat2"], PAL["d0"], PAL["m0"]), x, y, "pt")
    if mat == "tussock":
        base = _band_grass(x, y)
        if 4 <= ((x * 5 + y * 3) % 16) <= 7:
            return PAL["g4"]
        if hh(x, y, "tu") % 8 == 0:
            return PAL["peat"]
        return base
    if mat == "shale":
        if y % 4 == 0:
            return PAL["s0"]
        return shade((PAL["s1"], PAL["s2"], PAL["blueg"]), x, y // 4, "sh")
    if mat == "drift":
        n = hh(x, y, "dr")
        return (PAL["a2"], PAL["a1"], PAL["cream"], PAL["a2"])[n % 4]
    if mat == "duff":
        n = hh(x, y, "df")
        return (PAL["needle"], PAL["d0"], PAL["d1"], PAL["leaf2"], PAL["g0"])[n % 5]
    if mat == "granite":
        if (x + y) % 7 == 0:
            return PAL["s3"]
        return shade((PAL["s0"], PAL["s1"], PAL["s2"]), x, y, "gr")
    if mat == "litter":
        n = hh(x, y, "lt")
        return (PAL["leaf"], PAL["leaf2"], PAL["mp2"], PAL["d1"], PAL["mp0"])[n % 5]
    if mat == "alley":
        # mown stripe under orchard rows; period continues across tiles
        if y % 8 in (0, 1):
            return PAL["d2"]
        return _band_grass(x, y)
    if mat == "pasture":
        n = hh(x, y, "ps")
        return (PAL["g4"], PAL["g3"], PAL["g2"], PAL["gold"], PAL["g4"])[n % 5]
    if mat == "stubble":
        col = shade((PAL["corn"], PAL["corn2"], PAL["d2"], PAL["a1"]), x, y, "st")
        if x % 3 == 0 and y % 5 == 1:
            return PAL["d0"]
        return col
    if mat == "talus":
        if hh(x, y, "ta") % 4 == 0:
            return PAL["s3"]
        return shade((PAL["s0"], PAL["s1"], PAL["dust"], PAL["s2"]), x, y, "ta2")
    if mat == "notch":
        n = hh(x, y, "no")
        col = (PAL["d1"], PAL["d0"], PAL["s1"], PAL["d2"])[n % 4]
        if y % 6 in (2, 3) and x % 4 != 0:
            return PAL["d0"]
        return col
    if mat == "creekbed":
        n = hh(x // 2, y // 2, "ck")
        if n % 5 == 0:
            return PAL["w2"]
        return shade((PAL["s1"], PAL["s2"], PAL["a1"], PAL["s0"]), x, y, "ck2")
    if mat == "board":
        if y % 4 == 3:
            return PAL["wd0"]
        return shade((PAL["wd1"], PAL["wd2"], PAL["wd3"]), y // 4, x, "bd")
    if mat == "ridge":
        if hh(x, y, "rg") % 5 == 0:
            return PAL["s1"]
        base = _band_grass(x, y)
        if hh(x, y, "rg2") % 7 == 0:
            return PAL["a1"]
        return base
    if mat == "dust":
        return shade((PAL["dust"], PAL["a2"], PAL["s3"], PAL["a1"]), x, y, "du")
    if mat == "cliff":
        if x % 5 == 0:
            return PAL["s0"]
        return shade((PAL["s1"], PAL["s2"], PAL["d0"]), x, y // 3, "cf")
    if mat == "cutface":
        if y % 4 == 0:
            return PAL["s3"]
        if x % 8 == 0:
            return PAL["s0"]
        return shade((PAL["s1"], PAL["s2"], PAL["dust"]), x // 2, y, "cu")
    raise KeyError(mat)


def edge_pick(t, m0, m1):
    if m0 == m1 or t == 0:
        return m0
    if t == 15:
        return m1
    cut = 8 + ((hh(t, m0, m1, "cut") % 5) - 2)
    return m0 if t < cut else m1


def pick_material(x, y, nw, ne, se, sw):
    if y == 0:
        return edge_pick(x, nw, ne)
    if y == 15:
        return edge_pick(x, sw, se)
    if x == 0:
        return edge_pick(y, nw, sw)
    if x == 15:
        return edge_pick(y, ne, se)
    u = x / 15.0
    v = y / 15.0
    weights = {}
    for m, w in (
        (nw, (1 - u) * (1 - v)),
        (ne, u * (1 - v)),
        (sw, (1 - u) * v),
        (se, u * v),
    ):
        weights[m] = weights.get(m, 0.0) + w
    best, best_s = None, -1e9
    for m, w in weights.items():
        j = ((hh(x, y, m, "jag") % 100) / 100.0 - 0.5) * 0.20
        s = w + j
        if s > best_s:
            best, best_s = m, s
    return best


def render_ground(nw, ne, se, sw, variant=0, frame=0) -> np.ndarray:
    mask = np.empty((16, 16), dtype=object)
    img = np.zeros((16, 16, 4), np.uint8)
    for y in range(16):
        for x in range(16):
            m = pick_material(x, y, nw, ne, se, sw)
            mask[y, x] = m
            edge = x in (0, 15) or y in (0, 15)
            c = tex(m, x, y, variant, frame, edge)
            if variant and not edge and m not in ("grass", "dirt"):
                if hh(x, y, variant, m, "var") % 7 == 0:
                    c = tex(m, (x * 3 + variant) % 16, (y * 5 + 2) % 16, 0, frame, False)
            img[y, x] = (*c, 255)
    # Foam sits on interior water touching land so the perimeter contract holds.
    for y in range(1, 15):
        for x in range(1, 15):
            if mask[y, x] not in WATER_MATS:
                continue
            land = False
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    if mask[y + dy, x + dx] not in WATER_MATS:
                        land = True
            if land and hh(x, y, "foam") % 4 != 0:
                img[y, x, :3] = PAL["foam"] if hh(x, y, "foam2") % 2 == 0 else PAL["w3"]
    return img


def walk_mask_from(nw, ne, se, sw) -> str:
    bits = []
    for by in range(4):
        for bx in range(4):
            land = 0
            total = 0
            for y in range(by * 4, by * 4 + 4):
                for x in range(bx * 4, bx * 4 + 4):
                    m = pick_material(x, y, nw, ne, se, sw)
                    total += 1
                    if m in WALK:
                        land += 1
            bits.append("1" if land * 2 >= total else "0")
    return "".join(bits)


def blank(w, h) -> np.ndarray:
    return np.zeros((h, w, 4), np.uint8)


def fill(im, c):
    im[:, :, 0] = c[0]
    im[:, :, 1] = c[1]
    im[:, :, 2] = c[2]
    im[:, :, 3] = 255


def pset(im, x, y, c, a=255):
    h, w = im.shape[:2]
    if 0 <= x < w and 0 <= y < h and a:
        im[y, x] = (*c, a)


def rect(im, x, y, w, h, c, a=255):
    H, W = im.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + w), min(H, y + h)
    if x0 < x1 and y0 < y1:
        im[y0:y1, x0:x1] = (*c, a)


def ellipse(im, cx, cy, rx, ry, c, j=0):
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if rx <= 0 or ry <= 0:
                continue
            extra = 0
            if j:
                extra = ((hh(x, y, int(cx), int(cy)) % (j + 1)) - j // 2)
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + extra * 0.04:
                pset(im, x, y, c)


def line(im, x0, y0, x1, y1, c):
    n = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(n + 1):
        t = i / n
        pset(im, int(round(x0 + (x1 - x0) * t)), int(round(y0 + (y1 - y0) * t)), c)


def outline(im, c=None):
    """1px ink just outside the silhouette. Interior holes stay transparent."""
    c = c or PAL["ink"]
    src = im.copy()
    h, w = src.shape[:2]
    ext = np.zeros((h, w), np.uint8)
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or ext[y, x] or src[y, x, 3] != 0:
            continue
        ext[y, x] = 1
        stack.append((x + 1, y))
        stack.append((x - 1, y))
        stack.append((x, y + 1))
        stack.append((x, y - 1))
    for y in range(h):
        for x in range(w):
            if not ext[y, x]:
                continue
            hit = False
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and src[yy, xx, 3] != 0:
                        hit = True
            if hit:
                im[y, x] = (*c, 255)


def lock_edge(im, side, mat):
    """Make one side identical to a pure `mat` tile's same side.

    A pure tile above has bottom row tex(mat, x, 15); the tile below must keep
    top row tex(mat, x, 0), the next sample in the period-16 texture.
    """
    h, w = im.shape[:2]
    if (h, w) != (16, 16):
        raise ValueError("lock_edge expects 16x16")
    if side == "n":
        for x in range(16):
            im[0, x] = (*tex(mat, x, 0), 255)
    elif side == "s":
        for x in range(16):
            im[15, x] = (*tex(mat, x, 15), 255)
    elif side == "w":
        for y in range(16):
            im[y, 0] = (*tex(mat, 0, y), 255)
    elif side == "e":
        for y in range(16):
            im[y, 15] = (*tex(mat, 15, y), 255)
    else:
        raise ValueError(side)


def to_image(arr) -> Image.Image:
    return Image.fromarray(arr, "RGBA")


def scale_nn(im: Image.Image, n: int) -> Image.Image:
    return im.resize((im.width * n, im.height * n), Image.Resampling.NEAREST)


def night_array(arr: np.ndarray) -> np.ndarray:
    out = arr.copy()
    h, w = arr.shape[:2]
    lut = {k: np.array(v, np.uint8) for k, v in NIGHT_LUT.items()}
    missing = set()
    for y in range(h):
        for x in range(w):
            if arr[y, x, 3] == 0:
                continue
            key = tuple(int(v) for v in arr[y, x, :3])
            if key not in lut:
                missing.add(key)
                continue
            out[y, x, :3] = lut[key]
    if missing:
        raise RuntimeError(f"night LUT missing {len(missing)} colors, e.g. {next(iter(missing))}")
    return out


def assert_palette(arr, label):
    h, w = arr.shape[:2]
    bad = set()
    for y in range(0, h, 1):
        row = arr[y]
        for x in range(w):
            if row[x, 3] == 0:
                continue
            key = (int(row[x, 0]), int(row[x, 1]), int(row[x, 2]))
            if key not in PAL_RGB:
                bad.add(key)
                if len(bad) > 8:
                    break
        if len(bad) > 8:
            break
    if bad:
        raise RuntimeError(f"{label} left palette: {list(bad)[:6]}")


def pack_grid(images, cols, cell=None):
    """Pack equal-size images into an atlas. Returns image, frames."""
    if not images:
        raise ValueError("empty pack")
    w, h = images[0][1].size
    for _, im in images:
        if im.size != (w, h):
            raise ValueError("pack_grid size mismatch")
    rows = (len(images) + cols - 1) // cols
    atlas = Image.new("RGBA", (cols * w, rows * h), (0, 0, 0, 0))
    frames = {}
    for i, (tid, im) in enumerate(images):
        x, y = (i % cols) * w, (i // cols) * h
        atlas.paste(im, (x, y))
        frames[tid] = {"x": x, "y": y, "w": w, "h": h}
    return atlas, frames


def pack_shelves(items):
    """Pack variable sprites. items: (id, image). Shelf by height."""
    if not items:
        return Image.new("RGBA", (16, 16), (0, 0, 0, 0)), {}
    max_w = 512
    # group by height
    heights = sorted({im.height for _, im in items})
    shelves = {h: [] for h in heights}
    for tid, im in items:
        shelves[im.height].append((tid, im))
    y = 0
    frames = {}
    placed = []
    width = 16
    for h in heights:
        x = 0
        row_h = h
        for tid, im in shelves[h]:
            if x + im.width > max_w and x > 0:
                y += row_h
                x = 0
            placed.append((tid, im, x, y))
            frames[tid] = {"x": x, "y": y, "w": im.width, "h": im.height}
            x += im.width
            width = max(width, x)
        y += row_h
    atlas = Image.new("RGBA", (width, max(y, 16)), (0, 0, 0, 0))
    for tid, im, x, yy in placed:
        atlas.paste(im, (x, yy), im)
    return atlas, frames


def label_font(size=10):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()


def save_png(im: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG")


def write_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2), encoding="utf-8")
