"""Architecture, district features, interior kits, era overlays."""
from __future__ import annotations

import numpy as np

from lib import PAL, blank, ellipse, hh, line, lock_edge, pset, rect, render_ground, shade, tex

P = PAL


def _restore(im, mat):
    for x in range(16):
        im[0, x] = (*tex(mat, x, 0), 255)
        im[15, x] = (*tex(mat, x, 15), 255)
    for y in range(1, 15):
        im[y, 0] = (*tex(mat, 0, y), 255)
        im[y, 15] = (*tex(mat, 15, y), 255)


def _base(mat) -> np.ndarray:
    return render_ground(mat, mat, mat, mat, 0, 0)


def roof_tex(style, x, y):
    if style == "slate":
        course = y // 4
        off = 4 if course % 2 else 0
        if y % 4 == 0 or (x + off) % 8 == 0:
            return P["r0"]
        return P["r1"] if hh(x, course, "sl") % 3 else P["r2"]
    if style == "shingle":
        course = y // 3
        off = 3 if course % 2 else 0
        if y % 3 == 0 or (x + off) % 6 == 0:
            return P["wd0"]
        return P["b1"] if hh(x, course, "sh") % 2 else P["b2"]
    if style == "metal":
        if x % 4 == 0:
            return P["ir0"]
        return P["ir1"] if y % 2 == 0 else P["s2"]
    if style == "shake":
        course = y // 4
        off = 5 if course % 2 else 0
        if y % 4 == 0 or (x + off) % 8 == 0:
            return P["wd0"]
        return P["wd1"] if hh(x, course, "sk") % 2 else P["wd2"]
    raise KeyError(style)


def make_roof(style, n=False, e=False, s=False, w=False):
    im = blank(16, 16)
    for y in range(16):
        for x in range(16):
            im[y, x] = (*roof_tex(style, x, y), 255)
    edge = P["ir0"] if style == "metal" else P["wd0"]
    if n:
        rect(im, 0, 0, 16, 2, P["r0"] if style == "slate" else edge)
    if s:
        rect(im, 0, 13, 16, 1, P["r0"])
        rect(im, 0, 14, 16, 2, edge)
    if w:
        rect(im, 0, 0, 2, 16, edge)
    if e:
        rect(im, 14, 0, 2, 16, edge)
    return im


def _brick_at(x, y, alt=False):
    course = (y // 4)
    off = 4 if course % 2 else 0
    if y % 4 == 0 or (x + off) % 8 == 0:
        return P["mort"]
    return P["b2"] if hh(x, course, alt) % 2 else P["b1"]


def make_wall(style, feature="plain"):
    im = blank(16, 16)
    rect(im, 0, 0, 16, 3, P["s0"])
    rect(im, 0, 3, 16, 1, P["trim"])
    if style == "clap":
        for y in range(4, 16):
            rect(im, 0, y, 16, 1, P["c2"] if y % 2 == 0 else P["c1"])
    elif style == "barn":
        for y in range(4, 16):
            rect(im, 0, y, 16, 1, P["redb2"] if y % 2 == 0 else P["redb"])
        rect(im, 0, 14, 16, 2, P["wd0"])
    elif style in ("brick", "mill"):
        col = (P["b0"], P["b1"]) if style == "mill" else None
        for y in range(4, 16):
            for x in range(16):
                c = _brick_at(x, y, style == "mill")
                if style == "mill" and c != P["mort"]:
                    c = P["b0"] if hh(x, y, "mi") % 2 else P["b1"]
                im[y, x] = (*c, 255)
    elif style == "stone":
        for y in range(4, 16):
            for x in range(16):
                if (x + (y // 4) * 3) % 6 == 0 or y % 4 == 0:
                    im[y, x] = (*P["s0"], 255)
                else:
                    im[y, x] = (*shade((P["s1"], P["s2"], P["s3"]), x, y // 4, "stn"), 255)
    elif style in ("log", "camp"):
        for y in range(4, 16):
            if y % 3 == 0:
                rect(im, 0, y, 16, 1, P["wd0"])
            else:
                rect(im, 0, y, 16, 1, P["wd2"] if style == "camp" else P["wd1"])
    else:
        raise KeyError(style)
    if feature == "win":
        rect(im, 4, 6, 8, 7, P["trim"])
        rect(im, 5, 7, 6, 5, P["glass"])
        rect(im, 5, 7, 6, 1, P["glasshi"])
        rect(im, 7, 7, 1, 5, P["trim"])
        rect(im, 5, 9, 6, 1, P["trim"])
    elif feature == "door":
        rect(im, 3, 5, 10, 11, P["wd0"])
        rect(im, 4, 6, 8, 9, P["wd1"] if style != "barn" else P["wd2"])
        rect(im, 4, 6, 8, 1, P["wd3"])
        pset(im, 10, 11, P["cop"])
        pset(im, 10, 12, P["cop2"])
    return im


ROOF_STYLES = ("slate", "shingle", "metal", "shake")
WALL_STYLES = ("clap", "brick", "stone", "barn", "log", "mill", "camp")
ROOF_FLAGS = {
    "fill": (False, False, False, False),
    "n": (True, False, False, False),
    "e": (False, True, False, False),
    "s": (False, False, True, False),
    "w": (False, False, False, True),
    "ne": (True, True, False, False),
    "nw": (True, False, False, True),
    "se": (False, True, True, False),
    "sw": (False, False, True, True),
}


def architecture_tiles():
    out = []
    for style in ROOF_STYLES:
        for name, flags in ROOF_FLAGS.items():
            im = make_roof(style, *flags)
            out.append((f"roof.{style}.{name}", im, {
                "layer": "roof",
                "walk": "none",
                "collision": [[0, 0, 16, 16]],
                "blocks": True,
                "tags": ["architecture", "roof", style],
            }))
    for style in WALL_STYLES:
        for feature in ("plain", "win", "door"):
            im = make_wall(style, feature)
            if feature == "door":
                walk = "partial"
                collision = [[0, 0, 3, 16], [13, 0, 3, 16], [0, 0, 16, 5]]
                blocks = True
            else:
                walk = "none"
                collision = [[0, 0, 16, 16]]
                blocks = True
            out.append((f"wall.{style}.{feature}", im, {
                "layer": "wall",
                "walk": walk,
                "collision": collision,
                "blocks": blocks,
                "tags": ["architecture", "wall", style, feature],
            }))
    # steps join grass below and stone above
    steps = _base("grass")
    rect(steps, 2, 4, 12, 3, P["s1"])
    rect(steps, 2, 8, 12, 3, P["s2"])
    rect(steps, 2, 12, 12, 2, P["s0"])
    _restore(steps, "grass")
    out.append(("step.stone", steps, {
        "layer": "ground", "walk": "all", "collision": [], "blocks": False,
        "tags": ["architecture", "steps"],
    }))
    return out


def _decal(mat, painter, locks=None):
    im = _base(mat)
    painter(im)
    if locks:
        for side, m in locks:
            lock_edge(im, side, m)
    else:
        _restore(im, mat)
    return im


def _falls_crest():
    im = blank(16, 16)
    for y in range(16):
        for x in range(16):
            if y < 4:
                im[y, x] = (*tex("water", x, y), 255)
            else:
                col = P["foam"] if (x + y) % 2 == 0 else P["w3"]
                if x % 4 == 0:
                    col = P["w4"]
                im[y, x] = (*col, 255)
    lock_edge(im, "n", "water")
    lock_edge(im, "w", "ledge")
    lock_edge(im, "e", "ledge")
    return im


def _falls_mid():
    im = blank(16, 16)
    for y in range(16):
        for x in range(16):
            col = P["w4"] if (x + y * 2) % 3 == 0 else (P["foam"] if x % 2 == 0 else P["w2"])
            im[y, x] = (*col, 255)
    lock_edge(im, "w", "ledge")
    lock_edge(im, "e", "ledge")
    return im


def _falls_base():
    im = _base("water")
    for y in range(0, 8):
        for x in range(2, 14):
            im[y, x] = (*(P["foam"] if (x + y) % 2 == 0 else P["w4"]), 255)
    lock_edge(im, "s", "water")
    lock_edge(im, "w", "ledge")
    lock_edge(im, "e", "ledge")
    return im


def district_features():
    """Eight distinctive tiles per district, edges locked to a ground."""
    specs = []

    def add(did, name, im, **meta):
        base = {
            "layer": meta.get("layer", "ground"),
            "walk": meta.get("walk", "all"),
            "collision": meta.get("collision", []),
            "blocks": meta.get("blocks", False),
            "tags": ["district", did, "feature"],
            "district": did,
        }
        specs.append((f"{did}.{name}", im, base))

    # middlebury green — town stone, brick, iron
    d = "middlebury_green"
    im = _decal("bluestone", lambda im: rect(im, 2, 7, 12, 2, P["cream"]))
    add(d, "crosswalk", im, walk="all")
    im = _decal("cobble", lambda im: [ellipse(im, 8, 8, 3, 3, P["s0"]), pset(im, 8, 8, P["g1"])])
    add(d, "elm_pit", im)
    im = _decal("grass", lambda im: rect(im, 4, 6, 8, 5, P["ir0"]))
    add(d, "grate", im)
    im = _decal("bluestone", lambda im: [rect(im, 3, 4, 10, 8, P["b1"]), rect(im, 3, 4, 10, 1, P["mort"])])
    add(d, "brick_pad", im)
    im = _decal("grass", lambda im: rect(im, 2, 7, 12, 2, P["ir0"]))
    add(d, "rail", im, walk="partial", collision=[[0, 6, 16, 4]], blocks=True)
    im = _decal("flag", lambda im: rect(im, 6, 2, 4, 12, P["trim"]))
    add(d, "pier", im)
    im = _decal("cobble", lambda im: [rect(im, 5, 5, 6, 6, P["c2"]), rect(im, 7, 7, 2, 2, P["trim"])])
    add(d, "stoop", im)
    im = _decal("grass", lambda im: [ellipse(im, 8, 8, 4, 3, P["g0"]), pset(im, 6, 8, P["gold"]), pset(im, 10, 7, P["aster"])])
    add(d, "garden_bed", im)

    # vergennes falls
    d = "vergennes_falls"
    add(d, "falls_crest", _falls_crest(), walk="none", collision=[[0, 0, 16, 16]], blocks=True, layer="ground")
    add(d, "falls_mid", _falls_mid(), walk="none", collision=[[0, 0, 16, 16]], blocks=True)
    add(d, "falls_base", _falls_base(), walk="none", collision=[[0, 0, 16, 16]], blocks=True)
    im = _decal("ledge", lambda im: [rect(im, 2, 6, 12, 4, P["w1"]), rect(im, 2, 6, 12, 1, P["foam"])])
    add(d, "sluice", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True)
    im = _decal("ledge", lambda im: [ellipse(im, 8, 8, 5, 5, P["wd1"]), ellipse(im, 8, 8, 2, 2, P["s0"])])
    add(d, "wheel_pad", im, walk="none", blocks=True, collision=[[2, 2, 12, 12]])
    im = _decal("grass", lambda im: rect(im, 0, 7, 16, 2, P["ir0"]))
    add(d, "race_rail", im, walk="partial", collision=[[0, 6, 16, 4]], blocks=True)
    im = _decal("ledge", lambda im: rect(im, 3, 3, 10, 10, P["b0"]))
    add(d, "mill_foundation", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True)
    im = _decal("water", lambda im: None)
    for y in range(4, 12):
        for x in range(4, 12):
            if (x + y) % 2 == 0:
                im[y, x] = (*P["foam"], 255)
    _restore(im, "water")
    add(d, "foam_pool", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True)

    # otter marsh
    d = "otter_marsh"
    im = _decal("peat", lambda im: [line(im, 2, 4, 2, 12, P["wd1"]), line(im, 13, 4, 13, 12, P["wd1"]), rect(im, 2, 7, 12, 2, P["wd2"])])
    add(d, "board_break", im)
    im = _decal("peat", lambda im: ellipse(im, 8, 8, 4, 3, P["g0"]))
    add(d, "tussock_pad", im)
    im = _decal("water", lambda im: [ellipse(im, 5, 8, 2, 1, P["g1"]), ellipse(im, 11, 9, 2, 1, P["g2"])])
    add(d, "duckweed", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True)
    im = _decal("peat", lambda im: rect(im, 7, 2, 2, 12, P["wd1"]))
    add(d, "post", im, walk="partial", collision=[[6, 2, 4, 12]], blocks=True)
    im = _decal("tussock", lambda im: [line(im, 4, 12, 4, 4, P["g4"]), line(im, 8, 12, 8, 3, P["d0"]), line(im, 12, 12, 12, 5, P["g4"])])
    add(d, "reed_tile", im)
    im = _decal("board", lambda im: rect(im, 4, 4, 8, 8, P["wd0"]))
    add(d, "hatch", im)
    im = _decal("peat", lambda im: rect(im, 2, 10, 12, 2, P["m0"]))
    add(d, "seep", im, walk="partial", collision=[[2, 9, 12, 4]])
    im = _decal("grass", lambda im: rect(im, 0, 6, 16, 4, P["wd2"]))
    add(d, "corduroy", im)

    # champlain shore
    d = "champlain_shore"
    im = _decal("drift", lambda im: line(im, 2, 11, 13, 6, P["wd3"]))
    add(d, "drift_log", im, walk="partial", collision=[[2, 6, 12, 6]])
    im = _decal("shale", lambda im: rect(im, 2, 6, 12, 4, P["wd2"]))
    add(d, "dock_plank", im)
    im = _decal("water", lambda im: ellipse(im, 8, 8, 2, 2, P["rib"]))
    add(d, "buoy_ring", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True)
    im = _decal("drift", lambda im: [pset(im, 4, 8, P["s2"]), pset(im, 8, 10, P["s1"]), pset(im, 12, 7, P["s3"]), pset(im, 6, 12, P["a0"])])
    add(d, "shells", im)
    im = _decal("shale", lambda im: rect(im, 6, 2, 4, 12, P["ir0"]))
    add(d, "ladder_tile", im)
    im = _decal("grass", lambda im: [line(im, 3, 12, 5, 4, P["g4"]), line(im, 8, 12, 8, 3, P["g3"]), line(im, 12, 12, 11, 5, P["g4"])])
    add(d, "dune_grass", im)
    im = _decal("drift", lambda im: rect(im, 3, 7, 10, 3, P["wd1"]))
    add(d, "keel_scar", im)
    im = _decal("water", lambda im: rect(im, 4, 7, 8, 2, P["w4"]))
    add(d, "glint", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True)

    # ripton high woods
    d = "ripton_woods"
    im = _decal("duff", lambda im: [ellipse(im, 8, 8, 4, 3, P["sp1"]), pset(im, 6, 7, P["g3"])])
    add(d, "fern_bed", im)
    im = _decal("granite", lambda im: ellipse(im, 8, 8, 3, 2, P["g0"]))
    add(d, "moss_cap", im)
    im = _decal("duff", lambda im: ellipse(im, 8, 9, 4, 3, P["wd1"]))
    add(d, "root", im, walk="partial", collision=[[4, 6, 8, 6]])
    im = _decal("duff", lambda im: [ellipse(im, 6, 9, 2, 2, P["redb"]), ellipse(im, 11, 8, 2, 1, P["s3"])])
    add(d, "mushrooms", im)
    im = _decal("granite", lambda im: line(im, 2, 4, 13, 12, P["s0"]))
    add(d, "crack", im)
    im = _decal("grass", lambda im: rect(im, 7, 2, 2, 12, P["sp0"]))
    add(d, "trunk_base", im, walk="none", collision=[[6, 2, 4, 12]], blocks=True)
    im = _decal("duff", lambda im: rect(im, 2, 7, 12, 2, P["wd2"]))
    add(d, "trail_log", im, walk="partial", collision=[[1, 6, 14, 4]])
    im = _decal("moss", lambda im: pset(im, 8, 8, P["gold"]))
    add(d, "lichen", im)

    # lincoln sugar slope
    d = "lincoln_sugar"
    im = _decal("litter", lambda im: [line(im, 2, 8, 14, 8, P["ir1"]), pset(im, 4, 8, P["cop"]), pset(im, 10, 8, P["cop"])])
    add(d, "tubing", im)
    im = _decal("litter", lambda im: rect(im, 6, 4, 4, 8, P["ir1"]))
    add(d, "bucket_mark", im)
    im = _decal("grass", lambda im: [rect(im, 2, 6, 12, 4, P["s1"]), pset(im, 4, 6, P["s3"]), pset(im, 10, 8, P["s0"])])
    add(d, "wall_course", im, walk="partial", collision=[[2, 5, 12, 6]], blocks=True)
    im = _decal("litter", lambda im: rect(im, 4, 4, 8, 8, P["wd1"]))
    add(d, "sugarhouse_pad", im)
    im = _decal("grass", lambda im: [pset(im, 4, 6, P["leaf"]), pset(im, 8, 9, P["mp2"]), pset(im, 12, 5, P["leaf2"]), pset(im, 7, 12, P["mp0"])])
    add(d, "leaf_fall", im)
    im = _decal("dirt", lambda im: rect(im, 0, 7, 16, 2, P["d0"]))
    add(d, "sled_rut", im)
    im = _decal("litter", lambda im: ellipse(im, 8, 8, 3, 3, P["wd0"]))
    add(d, "fire_ring", im)
    im = _decal("grass", lambda im: rect(im, 7, 2, 2, 12, P["wd2"]))
    add(d, "stake", im, walk="partial", collision=[[6, 2, 4, 12]], blocks=True)

    # shoreham orchard
    d = "shoreham_orchard"
    im = _decal("alley", lambda im: rect(im, 6, 2, 4, 12, P["d2"]))
    add(d, "tree_row", im)
    im = _decal("grass", lambda im: [rect(im, 4, 6, 8, 5, P["wd2"]), pset(im, 6, 8, P["redb"]), pset(im, 9, 7, P["redb2"])])
    add(d, "drop_crate", im, walk="partial", collision=[[4, 6, 8, 6]])
    im = _decal("dirt", lambda im: rect(im, 5, 5, 6, 6, P["cream"]))
    add(d, "hive_pad", im, walk="none", collision=[[5, 5, 6, 6]], blocks=True)
    im = _decal("alley", lambda im: rect(im, 2, 7, 12, 2, P["gold"]))
    add(d, "mow_line", im)
    im = _decal("grass", lambda im: ellipse(im, 8, 8, 3, 2, P["redb"]))
    add(d, "windfall", im, walk="partial", collision=[[5, 6, 6, 4]])
    im = _decal("dirt", lambda im: rect(im, 3, 3, 10, 10, P["wd1"]))
    add(d, "press_pad", im, walk="none", collision=[[3, 3, 10, 10]], blocks=True)
    im = _decal("grass", lambda im: [pset(im, 4, 8, P["cream"]), pset(im, 8, 6, P["gold"]), pset(im, 12, 9, P["aster"])])
    add(d, "bees_path", im)
    im = _decal("alley", lambda im: rect(im, 7, 2, 2, 12, P["wd0"]))
    add(d, "prop_stake", im, walk="partial", collision=[[6, 2, 4, 12]], blocks=True)

    # addison intervale farms
    d = "addison_intervale"
    im = _decal("pasture", lambda im: rect(im, 0, 7, 16, 2, P["wd2"]))
    add(d, "fence_line", im, walk="partial", collision=[[0, 6, 16, 4]], blocks=True)
    im = _decal("stubble", lambda im: rect(im, 4, 4, 8, 8, P["gold"]))
    add(d, "bale_pad", im, walk="partial", collision=[[4, 4, 8, 8]])
    im = _decal("dirt", lambda im: ellipse(im, 8, 8, 4, 3, P["m0"]))
    add(d, "wallow", im, walk="partial", collision=[[4, 5, 8, 6]])
    im = _decal("pasture", lambda im: rect(im, 6, 2, 4, 12, P["d2"]))
    add(d, "cowpath", im)
    im = _decal("grass", lambda im: rect(im, 3, 6, 10, 5, P["c2"]))
    add(d, "milk_stand", im)
    im = _decal("stubble", lambda im: [pset(im, 5, 5, P["corn"]), pset(im, 8, 8, P["corn2"]), pset(im, 11, 6, P["d0"]), pset(im, 7, 12, P["corn"])])
    add(d, "stooks", im)
    im = _decal("dirt", lambda im: rect(im, 2, 2, 12, 12, P["s1"]))
    add(d, "silo_base", im, walk="none", collision=[[2, 2, 12, 12]], blocks=True)
    im = _decal("pasture", lambda im: rect(im, 7, 4, 2, 8, P["ir0"]))
    add(d, "gate_gap", im)

    # leicester quarry
    d = "leicester_quarry"
    im = _decal("talus", lambda im: rect(im, 3, 4, 10, 8, P["s3"]))
    add(d, "cut_block", im, walk="partial", collision=[[3, 4, 10, 8]], blocks=True)
    im = _decal("dust", lambda im: [line(im, 0, 8, 15, 8, P["ir0"]), line(im, 0, 10, 15, 10, P["ir0"])])
    add(d, "rail", im, walk="partial", collision=[[0, 7, 16, 4]], blocks=True)
    im = _decal("talus", lambda im: rect(im, 2, 6, 12, 4, P["wd1"]))
    add(d, "sleeper", im)
    im = blank(16, 16)
    for y in range(16):
        for x in range(16):
            im[y, x] = (*tex("cutface", x, y), 255)
    rect(im, 0, 0, 3, 16, P["s0"])
    add(d, "face", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True, layer="wall")
    im = _decal("dust", lambda im: ellipse(im, 8, 8, 4, 3, P["s1"]))
    add(d, "spoil", im)
    im = _decal("granite", lambda im: rect(im, 4, 4, 8, 8, P["ir0"]))
    add(d, "derrick_pad", im, walk="none", collision=[[4, 4, 8, 8]], blocks=True)
    im = _decal("dust", lambda im: rect(im, 2, 7, 12, 2, P["rust"]))
    add(d, "cable", im)
    im = _decal("talus", lambda im: [pset(im, 4, 6, P["s3"]), pset(im, 9, 10, P["s2"]), pset(im, 12, 5, P["dust"])])
    add(d, "chips", im)

    # bristol notch
    d = "bristol_notch"
    im = _decal("notch", lambda im: rect(im, 0, 6, 16, 4, P["d0"]))
    add(d, "rut", im)
    im = blank(16, 16)
    for y in range(16):
        for x in range(16):
            im[y, x] = (*tex("cliff", x, y), 255)
    rect(im, 0, 12, 16, 4, P["g0"])
    for x in range(16):
        im[15, x] = (*tex("grass", x, 15), 255)
    add(d, "cliff_foot", im, walk="partial", collision=[[0, 0, 16, 12]], blocks=True, layer="wall")
    im = blank(16, 16)
    for y in range(16):
        for x in range(16):
            im[y, x] = (*tex("cliff", x, y), 255)
    add(d, "cliff", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True, layer="wall")
    im = _decal("notch", lambda im: rect(im, 6, 2, 4, 12, P["s1"]))
    add(d, "mile_stone", im, walk="partial", collision=[[6, 2, 4, 12]], blocks=True)
    im = _decal("grass", lambda im: ellipse(im, 8, 8, 4, 3, P["sp1"]))
    add(d, "notch_fern", im)
    im = _decal("dirt", lambda im: rect(im, 3, 6, 10, 4, P["c1"]))
    add(d, "porch_board", im)
    im = _decal("notch", lambda im: line(im, 2, 13, 13, 3, P["s2"]))
    add(d, "scree", im)
    im = _decal("grass", lambda im: rect(im, 7, 3, 2, 10, P["wd1"]))
    add(d, "sign_post", im, walk="partial", collision=[[6, 3, 4, 10]], blocks=True)

    # weybridge span
    d = "weybridge_span"
    im = _decal("board", lambda im: [rect(im, 0, 0, 2, 16, P["wd0"]), rect(im, 14, 0, 2, 16, P["wd0"])])
    add(d, "deck_edge", im)
    im = _decal("board", lambda im: rect(im, 2, 2, 12, 12, P["ir0"]))
    add(d, "truss_bay", im, walk="none", collision=[[0, 0, 16, 16]], blocks=True, layer="wall")
    im = _decal("creekbed", lambda im: ellipse(im, 8, 8, 3, 2, P["w2"]))
    add(d, "pool", im, walk="partial", collision=[[5, 6, 6, 5]])
    im = _decal("grass", lambda im: rect(im, 2, 6, 12, 4, P["s1"]))
    add(d, "abutment", im, walk="none", collision=[[2, 5, 12, 6]], blocks=True)
    im = _decal("dirt", lambda im: rect(im, 0, 7, 16, 2, P["d3"]))
    add(d, "approach", im)
    im = _decal("creekbed", lambda im: line(im, 1, 12, 14, 4, P["wd3"]))
    add(d, "snag", im, walk="partial", collision=[[2, 4, 12, 8]])
    im = _decal("grass", lambda im: [pset(im, 5, 6, P["gold"]), pset(im, 9, 9, P["aster"]), pset(im, 12, 5, P["cream"])])
    add(d, "meadow_flower", im)
    im = _decal("board", lambda im: rect(im, 6, 4, 4, 8, P["ir1"]))
    add(d, "runner", im)

    # monkton ridge
    d = "monkton_ridge"
    im = _decal("ridge", lambda im: ellipse(im, 8, 8, 3, 2, P["shut"]))
    add(d, "blueberry", im)
    im = _decal("ridge", lambda im: rect(im, 2, 7, 12, 2, P["wd1"]))
    add(d, "windbreak_base", im, walk="partial", collision=[[2, 6, 12, 4]], blocks=True)
    im = _decal("grass", lambda im: rect(im, 0, 6, 16, 3, P["s1"]))
    add(d, "ridge_wall", im, walk="partial", collision=[[0, 5, 16, 5]], blocks=True)
    im = _decal("granite", lambda im: pset(im, 8, 8, P["gold"]))
    add(d, "cairn_mark", im)
    im = _decal("ridge", lambda im: line(im, 0, 8, 15, 8, P["d2"]))
    add(d, "track", im)
    im = _decal("grass", lambda im: rect(im, 6, 2, 4, 12, P["sp0"]))
    add(d, "spruce_base", im, walk="none", collision=[[6, 2, 4, 12]], blocks=True)
    im = _decal("dirt", lambda im: rect(im, 4, 4, 8, 8, P["c1"]))
    add(d, "hamlet_stoop", im)
    im = _decal("ridge", lambda im: [pset(im, 4, 5, P["aster"]), pset(im, 11, 9, P["gold"])])
    add(d, "ridge_bloom", im)

    return specs


# --- interiors ---------------------------------------------------------------

KITS = {
    "farmhouse_kitchen": {"floor": "pine", "wall": "plaster", "accent": "hearth"},
    "sugarhouse": {"floor": "stain", "wall": "board", "accent": "evap"},
    "general_store": {"floor": "oiled", "wall": "plaster", "accent": "counter"},
    "mill_floor": {"floor": "wide", "wall": "stone", "accent": "gear"},
    "quarry_shed": {"floor": "concrete", "wall": "corrug", "accent": "locker"},
    "meetinghouse": {"floor": "paint", "wall": "white", "accent": "pew"},
    "lake_camp": {"floor": "soft", "wall": "knot", "accent": "bunk"},
    "dairy_barn": {"floor": "stall", "wall": "whitewash", "accent": "stanch"},
}


def _floor_color(kind, x, y):
    if kind == "pine":
        if y % 4 == 3:
            return P["wd0"]
        return P["wd2"] if hh(y // 4, x, "pn") % 2 else P["wd3"]
    if kind == "stain":
        if y % 5 == 0:
            return P["wd0"]
        return P["d0"] if hh(x, y, "stn") % 3 else P["wd1"]
    if kind == "oiled":
        if x % 5 == 0:
            return P["wd0"]
        return P["wd1"] if (y // 3) % 2 == 0 else P["wd2"]
    if kind == "wide":
        if y % 6 == 0:
            return P["wd0"]
        return shade((P["wd2"], P["wd3"], P["a1"]), x, y // 6, "wd")
    if kind == "concrete":
        return P["s1"] if hh(x, y, "cc") % 7 else P["s2"]
    if kind == "paint":
        return P["c1"] if (x + y) % 8 else P["c0"]
    if kind == "soft":
        if y % 3 == 0:
            return P["wd0"]
        return P["wd3"] if hh(x, y // 3, "sf") % 2 else P["a2"]
    if kind == "stall":
        if x % 4 == 0:
            return P["d0"]
        return P["d2"] if y % 2 == 0 else P["d1"]
    raise KeyError(kind)


def _paint_floor(kind):
    im = blank(16, 16)
    for y in range(16):
        for x in range(16):
            im[y, x] = (*_floor_color(kind, x, y), 255)
    return im


def _wall_interior(kind, side, feature="plain"):
    im = blank(16, 16)
    if kind == "plaster":
        body, trim, shade_c = P["c2"], P["trim"], P["c0"]
    elif kind == "board":
        body, trim, shade_c = P["wd2"], P["wd0"], P["wd1"]
    elif kind == "stone":
        body, trim, shade_c = P["s1"], P["s0"], P["s2"]
    elif kind == "corrug":
        body, trim, shade_c = P["ir1"], P["ir0"], P["s2"]
    elif kind == "white":
        body, trim, shade_c = P["white"], P["trim"], P["c0"]
    elif kind == "knot":
        body, trim, shade_c = P["wd3"], P["wd0"], P["wd2"]
    elif kind == "whitewash":
        body, trim, shade_c = P["c1"], P["s1"], P["c0"]
    else:
        raise KeyError(kind)
    rect(im, 0, 0, 16, 16, body)
    if kind == "board" or kind == "knot":
        for y in range(0, 16, 3):
            rect(im, 0, y, 16, 1, trim)
    elif kind == "corrug":
        for x in range(0, 16, 3):
            rect(im, x, 0, 1, 16, trim)
    elif kind == "stone":
        for y in range(0, 16, 4):
            rect(im, 0, y, 16, 1, trim)
    else:
        rect(im, 0, 14, 16, 2, trim)
        rect(im, 0, 0, 16, 2, shade_c)
    if side == "n":
        rect(im, 0, 0, 16, 16, shade_c if kind != "stone" else P["s0"])
        rect(im, 0, 12, 16, 4, trim)
    if feature == "win":
        rect(im, 4, 4, 8, 7, trim)
        rect(im, 5, 5, 6, 5, P["glass"])
        rect(im, 5, 5, 6, 1, P["glasshi"])
    elif feature == "door":
        rect(im, 3, 2, 10, 14, trim)
        rect(im, 4, 3, 8, 12, P["wd1"])
        pset(im, 10, 10, P["cop"])
    return im


def _feature(accent, slot, floor_kind):
    im = _paint_floor(floor_kind)
    if accent == "hearth" and slot == 0:
        rect(im, 2, 2, 12, 10, P["b1"])
        rect(im, 4, 4, 8, 6, P["s0"])
        pset(im, 7, 8, P["mp1"])
    elif accent == "hearth" and slot == 1:
        rect(im, 0, 6, 16, 4, P["wd0"])  # beam shadow
    elif accent == "hearth":
        ellipse(im, 8, 8, 4, 3, P["rib"])
    elif accent == "evap" and slot == 0:
        rect(im, 2, 4, 12, 8, P["cop"])
        rect(im, 3, 5, 10, 4, P["cop2"])
    elif accent == "evap" and slot == 1:
        rect(im, 4, 3, 8, 10, P["wd1"])
    elif accent == "evap":
        rect(im, 2, 6, 12, 4, P["b0"])
    elif accent == "counter" and slot == 0:
        rect(im, 0, 4, 16, 6, P["wd2"])
        rect(im, 0, 4, 16, 1, P["wd3"])
    elif accent == "counter" and slot == 1:
        rect(im, 3, 3, 10, 10, P["wd1"])
    elif accent == "counter":
        rect(im, 5, 5, 6, 6, P["b1"])
    elif accent == "gear" and slot == 0:
        ellipse(im, 8, 8, 5, 5, P["ir0"])
        ellipse(im, 8, 8, 2, 2, P["ir1"])
    elif accent == "gear" and slot == 1:
        rect(im, 2, 6, 12, 4, P["wd3"])
    elif accent == "gear":
        rect(im, 6, 2, 4, 12, P["s2"])
    elif accent == "locker" and slot == 0:
        rect(im, 3, 2, 10, 12, P["ir0"])
        rect(im, 5, 4, 6, 8, P["ir1"])
    elif accent == "locker" and slot == 1:
        rect(im, 2, 6, 12, 6, P["wd2"])
    elif accent == "locker":
        rect(im, 4, 4, 8, 8, P["dust"])
    elif accent == "pew" and slot == 0:
        rect(im, 1, 6, 14, 4, P["wd1"])
        rect(im, 1, 5, 14, 1, P["wd2"])
    elif accent == "pew" and slot == 1:
        rect(im, 4, 3, 8, 10, P["trim"])
    elif accent == "pew":
        rect(im, 6, 2, 4, 12, P["c0"])
    elif accent == "bunk" and slot == 0:
        rect(im, 2, 3, 12, 10, P["wd2"])
        rect(im, 3, 5, 10, 3, P["shut"])
    elif accent == "bunk" and slot == 1:
        ellipse(im, 8, 8, 3, 3, P["rib"])
    elif accent == "bunk":
        rect(im, 4, 6, 8, 4, P["a2"])
    elif accent == "stanch" and slot == 0:
        rect(im, 3, 2, 2, 12, P["ir0"])
        rect(im, 11, 2, 2, 12, P["ir0"])
        rect(im, 3, 6, 10, 2, P["ir1"])
    elif accent == "stanch" and slot == 1:
        rect(im, 2, 4, 12, 8, P["gold"])
    elif accent == "stanch":
        rect(im, 5, 5, 6, 6, P["c2"])
    # keep floor perimeter so the feature joins the floor
    for x in range(16):
        im[0, x] = (*_floor_color(floor_kind, x, 0), 255)
        im[15, x] = (*_floor_color(floor_kind, x, 15), 255)
    for y in range(16):
        im[y, 0] = (*_floor_color(floor_kind, 0, y), 255)
        im[y, 15] = (*_floor_color(floor_kind, 15, y), 255)
    return im


def interior_kits():
    kits = {}
    for name, cfg in KITS.items():
        tiles = []
        floor = _paint_floor(cfg["floor"])
        alt = floor.copy()
        for y in range(2, 14):
            for x in range(2, 14):
                if hh(x, y, name, "worn") % 6 == 0:
                    alt[y, x] = (*P["d2"], 255)
        rug = floor.copy()
        rect(rug, 3, 3, 10, 10, P["rib"] if name != "meetinghouse" else P["shut"])
        rect(rug, 5, 5, 6, 6, P["cream"])
        for x in range(16):
            rug[0, x] = floor[0, x]
            rug[15, x] = floor[15, x]
        for y in range(16):
            rug[y, 0] = floor[y, 0]
            rug[y, 15] = floor[y, 15]
        parts = {
            "floor": floor,
            "floor_worn": alt,
            "rug": rug,
            "wall_n": _wall_interior(cfg["wall"], "n"),
            "wall_s": _wall_interior(cfg["wall"], "s"),
            "wall_s_win": _wall_interior(cfg["wall"], "s", "win"),
            "wall_s_door": _wall_interior(cfg["wall"], "s", "door"),
            "wall_w": _wall_interior(cfg["wall"], "w"),
            "wall_e": _wall_interior(cfg["wall"], "e"),
            "corner_nw": _wall_interior(cfg["wall"], "n"),
            "corner_ne": _wall_interior(cfg["wall"], "n"),
            "corner_sw": _wall_interior(cfg["wall"], "s"),
            "corner_se": _wall_interior(cfg["wall"], "s"),
            "feature_a": _feature(cfg["accent"], 0, cfg["floor"]),
            "feature_b": _feature(cfg["accent"], 1, cfg["floor"]),
            "feature_c": _feature(cfg["accent"], 2, cfg["floor"]),
        }
        # Bind vertical edges of south/north runs, and corner caps.
        for key in ("wall_s", "wall_s_win", "wall_s_door", "corner_sw", "corner_se"):
            pass
        we = parts["wall_e"]
        ww = parts["wall_w"]
        # East wall's west edge (inner) stays wall; outer east edge gets a trim post
        rect(parts["wall_e"], 12, 0, 4, 16, P["trim"])
        rect(parts["wall_w"], 0, 0, 4, 16, P["trim"])
        # corners take the post from the side wall and the face from n/s
        parts["corner_ne"] = parts["wall_n"].copy()
        parts["corner_ne"][:, 12:] = parts["wall_e"][:, 12:]
        parts["corner_nw"] = parts["wall_n"].copy()
        parts["corner_nw"][:, :4] = parts["wall_w"][:, :4]
        parts["corner_se"] = parts["wall_s"].copy()
        parts["corner_se"][:, 12:] = parts["wall_e"][:, 12:]
        parts["corner_sw"] = parts["wall_s"].copy()
        parts["corner_sw"][:, :4] = parts["wall_w"][:, :4]
        for tid, im in parts.items():
            walk = "none" if tid.startswith("wall") or tid.startswith("corner") else "all"
            if tid == "wall_s_door":
                walk = "partial"
                collision = [[0, 0, 3, 16], [13, 0, 3, 16]]
            elif walk == "none":
                collision = [[0, 0, 16, 16]]
            else:
                collision = []
            tiles.append((tid, im, {
                "layer": "wall" if walk != "all" else "floor",
                "walk": walk,
                "collision": collision,
                "blocks": walk != "all",
                "tags": ["interior", name, tid],
                "kit": name,
            }))
        kits[name] = tiles
    return kits


def _overlay(painter, w=16, h=16):
    im = blank(w, h)
    painter(im)
    return im


def era_sheets():
    """Six overlay sheets. Pixels are either opaque palette or fully transparent."""
    sheets = {k: [] for k in ("tended", "weathered", "ruined", "rebuilding", "stewardship", "memorial")}

    def add(sheet, name, im, repeat=False, blocks=False, foot=None):
        sheets[sheet].append((name, im, {
            "layer": "era",
            "walk": "all" if not blocks else "partial",
            "collision": [] if not blocks else [foot or [4, 4, 8, 8]],
            "blocks": blocks,
            "repeat": repeat,
            "tags": ["era", sheet],
            "era": sheet,
        }))

    # tended — cared-for stewardship
    add("tended", "flower_box", _overlay(lambda im: [rect(im, 2, 8, 12, 4, P["wd1"]), pset(im, 4, 7, P["aster"]), pset(im, 8, 6, P["gold"]), pset(im, 11, 7, P["cream"])]))
    add("tended", "swept_stoop", _overlay(lambda im: rect(im, 3, 10, 10, 2, P["c2"])))
    add("tended", "trimmed_hedge", _overlay(lambda im: rect(im, 1, 6, 14, 5, P["g1"])))
    add("tended", "fresh_trim", _overlay(lambda im: rect(im, 0, 12, 16, 2, P["trim"])))
    add("tended", "wood_stack_neat", _overlay(lambda im: [ellipse(im, 5, 9, 2, 2, P["wd2"]), ellipse(im, 9, 9, 2, 2, P["wd1"]), ellipse(im, 13, 9, 2, 2, P["wd3"])]))
    add("tended", "mown_edge", _overlay(lambda im: rect(im, 0, 0, 16, 3, P["g3"]), ), repeat=True)
    add("tended", "painted_shutter", _overlay(lambda im: rect(im, 4, 3, 3, 10, P["shut"])))
    add("tended", "lantern", _overlay(lambda im: [rect(im, 7, 4, 2, 8, P["ir0"]), rect(im, 6, 2, 4, 3, P["gold"])]))
    add("tended", "rake_mark", _overlay(lambda im: [line(im, 2, 12, 14, 4, P["d2"]), line(im, 2, 14, 14, 6, P["d3"])]), repeat=True)
    add("tended", "herb_row", _overlay(lambda im: [pset(im, 3, 8, P["g2"]), pset(im, 7, 7, P["g3"]), pset(im, 11, 8, P["gold"])]))
    add("tended", "door_mat", _overlay(lambda im: rect(im, 4, 8, 8, 4, P["b1"])))
    add("tended", "white_fence", _overlay(lambda im: rect(im, 0, 6, 16, 2, P["c2"])))
    add("tended", "curtain", _overlay(lambda im: rect(im, 5, 4, 6, 2, P["cream"])))
    add("tended", "boot_scrape", _overlay(lambda im: rect(im, 5, 10, 6, 2, P["ir0"])))
    add("tended", "water_butt", _overlay(lambda im: ellipse(im, 8, 9, 4, 4, P["wd1"])))
    add("tended", "path_sand", _overlay(lambda im: rect(im, 4, 0, 8, 16, P["a1"])), repeat=True)

    # weathered — fourteen years of weather
    add("weathered", "moss_crust", _overlay(lambda im: [pset(im, x, y, P["g0"]) for y in range(16) for x in range(16) if hh(x, y, "moss") % 11 == 0]), repeat=True)
    add("weathered", "peel", _overlay(lambda im: [pset(im, x, 4 + (x % 3), P["c0"]) for x in range(2, 14)]))
    add("weathered", "sag_shutter", _overlay(lambda im: line(im, 4, 3, 8, 12, P["shut"])))
    add("weathered", "leaf_litter", _overlay(lambda im: [pset(im, x, y, shade((P["leaf"], P["leaf2"], P["mp2"]), x, y)) for y in range(16) for x in range(16) if hh(x, y, "ll") % 7 == 0]), repeat=True)
    add("weathered", "cracked_pane", _overlay(lambda im: line(im, 5, 4, 11, 10, P["glass"])))
    add("weathered", "rust_streak", _overlay(lambda im: line(im, 8, 2, 9, 14, P["rust"])))
    add("weathered", "vine", _overlay(lambda im: line(im, 2, 14, 8, 4, P["g1"])))
    add("weathered", "cup_stain", _overlay(lambda im: ellipse(im, 8, 8, 3, 2, P["d2"])))
    add("weathered", "frost_heave", _overlay(lambda im: rect(im, 2, 8, 12, 2, P["s1"])), repeat=True)
    add("weathered", "lichen_spot", _overlay(lambda im: ellipse(im, 8, 8, 3, 2, P["g4"])))
    add("weathered", "loose_board", _overlay(lambda im: rect(im, 3, 6, 10, 2, P["wd3"])))
    add("weathered", "puddle_stain", _overlay(lambda im: ellipse(im, 8, 9, 4, 2, P["m0"])))
    add("weathered", "nail_pop", _overlay(lambda im: pset(im, 8, 8, P["ir1"])))
    add("weathered", "faded_trim", _overlay(lambda im: rect(im, 0, 13, 16, 2, P["c0"])))
    add("weathered", "seed_head", _overlay(lambda im: line(im, 8, 14, 8, 4, P["g4"])))
    add("weathered", "soot", _overlay(lambda im: ellipse(im, 8, 6, 3, 2, P["s0"])))

    # ruined
    add("ruined", "collapse", _overlay(lambda im: [line(im, 2, 4, 14, 12, P["wd1"]), line(im, 4, 3, 12, 13, P["wd0"]), rect(im, 6, 8, 4, 3, P["s1"])]), blocks=True, foot=[2, 4, 12, 10])
    add("ruined", "hole", _overlay(lambda im: ellipse(im, 8, 8, 3, 3, P["s0"])))
    add("ruined", "sapling_crack", _overlay(lambda im: [line(im, 8, 14, 8, 6, P["wd1"]), ellipse(im, 8, 5, 3, 2, P["g2"])]))
    add("ruined", "rubble", _overlay(lambda im: [ellipse(im, 5, 10, 2, 2, P["s1"]), ellipse(im, 10, 8, 3, 2, P["s2"]), pset(im, 8, 6, P["b1"])]), blocks=True, foot=[3, 5, 10, 8])
    add("ruined", "missing_shingle", _overlay(lambda im: rect(im, 5, 5, 6, 4, P["wd0"])))
    add("ruined", "bramble", _overlay(lambda im: [line(im, 2, 12, 12, 4, P["g0"]), line(im, 4, 13, 14, 6, P["leaf2"]), pset(im, 8, 8, P["rib"])]))
    add("ruined", "fallen_beam", _overlay(lambda im: line(im, 1, 12, 14, 5, P["wd1"])), blocks=True, foot=[1, 5, 14, 8])
    add("ruined", "ash", _overlay(lambda im: ellipse(im, 8, 9, 4, 2, P["s0"])))
    add("ruined", "broken_pane", _overlay(lambda im: [pset(im, 6, 6, P["glass"]), pset(im, 9, 8, P["glasshi"]), pset(im, 7, 10, P["glass"])]))
    add("ruined", "invasive", _overlay(lambda im: ellipse(im, 8, 8, 5, 4, P["g1"])), repeat=True)
    add("ruined", "void_board", _overlay(lambda im: rect(im, 4, 4, 8, 2, P["ink"])))
    add("ruined", "nest", _overlay(lambda im: ellipse(im, 8, 8, 3, 2, P["d2"])))
    add("ruined", "char", _overlay(lambda im: line(im, 3, 3, 12, 13, P["s0"])))
    add("ruined", "open_cellar", _overlay(lambda im: rect(im, 4, 4, 8, 8, P["s0"])), blocks=True, foot=[4, 4, 8, 8])
    add("ruined", "briar_fruit", _overlay(lambda im: pset(im, 8, 6, P["rib"])))
    add("ruined", "sill_rot", _overlay(lambda im: rect(im, 2, 12, 12, 2, P["d0"])))

    # rebuilding
    add("rebuilding", "scaffold_bay", _overlay(lambda im: [rect(im, 2, 2, 2, 12, P["wd2"]), rect(im, 12, 2, 2, 12, P["wd2"]), rect(im, 2, 6, 12, 2, P["wd3"])]), blocks=True, foot=[2, 2, 12, 12])
    add("rebuilding", "lumber", _overlay(lambda im: rect(im, 3, 6, 10, 5, P["wd3"])))
    add("rebuilding", "chalk_line", _overlay(lambda im: line(im, 1, 8, 14, 8, P["cream"])))
    add("rebuilding", "new_clap", _overlay(lambda im: [rect(im, 2, 4, 12, 2, P["c2"]), rect(im, 2, 7, 12, 2, P["c1"]), rect(im, 2, 10, 12, 2, P["c2"])]))
    add("rebuilding", "sawhorse", _overlay(lambda im: [line(im, 3, 12, 8, 4, P["wd2"]), line(im, 13, 12, 8, 4, P["wd2"]), line(im, 4, 8, 12, 8, P["wd3"])]))
    add("rebuilding", "tarp", _overlay(lambda im: ellipse(im, 8, 8, 5, 3, P["shut"])))
    add("rebuilding", "fresh_mortar", _overlay(lambda im: rect(im, 2, 7, 12, 2, P["mort"])))
    add("rebuilding", "nail_keg", _overlay(lambda im: ellipse(im, 8, 9, 3, 3, P["ir0"])))
    add("rebuilding", "level_board", _overlay(lambda im: rect(im, 2, 8, 12, 2, P["wd3"])))
    add("rebuilding", "string_line", _overlay(lambda im: line(im, 0, 4, 15, 4, P["rib"])), repeat=True)
    add("rebuilding", "shingle_bundle", _overlay(lambda im: rect(im, 4, 6, 8, 5, P["b1"])))
    add("rebuilding", "tool_rest", _overlay(lambda im: line(im, 4, 12, 12, 4, P["ir1"])))
    add("rebuilding", "new_sill", _overlay(lambda im: rect(im, 0, 12, 16, 3, P["wd2"])))
    add("rebuilding", "brace", _overlay(lambda im: line(im, 3, 13, 12, 3, P["wd1"])))
    add("rebuilding", "blue_stake", _overlay(lambda im: rect(im, 7, 2, 2, 12, P["shut"])))
    add("rebuilding", "sawdust", _overlay(lambda im: [pset(im, x, y, P["a2"]) for y in range(16) for x in range(16) if hh(x, y, "sd") % 9 == 0]), repeat=True)

    # changed stewardship
    add("stewardship", "new_fence", _overlay(lambda im: rect(im, 0, 6, 16, 2, P["wd2"])), repeat=True, blocks=True, foot=[0, 5, 16, 4])
    add("stewardship", "sapling_row", _overlay(lambda im: [line(im, 4, 14, 4, 6, P["wd1"]), line(im, 12, 14, 12, 6, P["wd1"]), ellipse(im, 4, 5, 2, 2, P["g2"]), ellipse(im, 12, 5, 2, 2, P["g3"])]))
    add("stewardship", "blaze", _overlay(lambda im: rect(im, 6, 6, 4, 4, P["mp1"])))
    add("stewardship", "gate_turn", _overlay(lambda im: [rect(im, 2, 6, 6, 2, P["wd2"]), rect(im, 8, 4, 2, 8, P["wd1"])]))
    add("stewardship", "mow_trail", _overlay(lambda im: rect(im, 4, 0, 8, 16, P["g3"])), repeat=True)
    add("stewardship", "cairn_turn", _overlay(lambda im: [ellipse(im, 8, 11, 3, 2, P["s1"]), ellipse(im, 8, 8, 2, 2, P["s3"])]))
    add("stewardship", "orchard_stake", _overlay(lambda im: [rect(im, 7, 4, 2, 10, P["wd2"]), pset(im, 6, 6, P["rib"])]))
    add("stewardship", "pasture_to_trees", _overlay(lambda im: ellipse(im, 8, 8, 4, 3, P["sp1"])))
    add("stewardship", "closed_path", _overlay(lambda im: ellipse(im, 8, 8, 5, 3, P["g0"])), repeat=True)
    add("stewardship", "stone_repair", _overlay(lambda im: rect(im, 3, 6, 10, 4, P["s2"])))
    add("stewardship", "survey_pin", _overlay(lambda im: [rect(im, 7, 6, 2, 6, P["ir1"]), pset(im, 8, 5, P["rib"])]))
    add("stewardship", "young_hedge", _overlay(lambda im: rect(im, 0, 7, 16, 3, P["g2"])), repeat=True)
    add("stewardship", "water_bar", _overlay(lambda im: rect(im, 0, 7, 16, 2, P["wd1"])), repeat=True)
    add("stewardship", "sign_back", _overlay(lambda im: rect(im, 4, 4, 8, 6, P["wd3"])))
    add("stewardship", "seed_drill", _overlay(lambda im: [line(im, 2, y, 14, y, P["d2"]) for y in (4, 8, 12)]), repeat=True)
    add("stewardship", "conservation_mow", _overlay(lambda im: rect(im, 0, 10, 16, 4, P["g4"])), repeat=True)

    # memorial
    add("memorial", "fieldstone", _overlay(lambda im: [rect(im, 5, 4, 6, 8, P["s2"]), ellipse(im, 8, 4, 3, 2, P["s3"])]), blocks=True, foot=[5, 4, 6, 8])
    add("memorial", "ribbon", _overlay(lambda im: [rect(im, 7, 2, 2, 12, P["wd1"]), line(im, 8, 5, 3, 9, P["rib"]), line(im, 8, 5, 13, 9, P["rib"])]))
    add("memorial", "planted_pine", _overlay(lambda im: [rect(im, 7, 8, 2, 6, P["wd1"]), ellipse(im, 8, 6, 4, 3, P["sp1"])]))
    add("memorial", "wreath", _overlay(lambda im: [ellipse(im, 8, 8, 4, 4, P["g1"]), pset(im, 8, 4, P["rib"]), pset(im, 8, 5, P["cream"])]))
    add("memorial", "plaque_stone", _overlay(lambda im: [rect(im, 4, 6, 8, 6, P["s1"]), rect(im, 6, 8, 4, 2, P["s3"])]), blocks=True, foot=[4, 6, 8, 6])
    add("memorial", "candle_nook", _overlay(lambda im: [rect(im, 6, 8, 4, 3, P["wd2"]), pset(im, 8, 6, P["gold"])]))
    add("memorial", "bench_flowers", _overlay(lambda im: [rect(im, 2, 8, 12, 2, P["wd2"]), pset(im, 4, 7, P["aster"]), pset(im, 8, 6, P["cream"]), pset(im, 12, 7, P["gold"])]))
    add("memorial", "name_ribbon", _overlay(lambda im: rect(im, 3, 7, 10, 2, P["rib"])))
    add("memorial", "white_pine_row", _overlay(lambda im: [ellipse(im, 4, 8, 2, 3, P["sp1"]), ellipse(im, 12, 8, 2, 3, P["sp0"])]))
    add("memorial", "pebble_offering", _overlay(lambda im: [pset(im, 6, 9, P["s3"]), pset(im, 8, 8, P["s2"]), pset(im, 10, 10, P["s1"])]))
    add("memorial", "quiet_post", _overlay(lambda im: rect(im, 7, 3, 2, 10, P["s0"])))
    add("memorial", "fern_ring", _overlay(lambda im: ellipse(im, 8, 8, 5, 3, P["g2"])))
    add("memorial", "low_wall_notch", _overlay(lambda im: rect(im, 2, 8, 12, 3, P["s1"])))
    add("memorial", "cloth_tie", _overlay(lambda im: line(im, 4, 6, 12, 10, P["cream"])))
    add("memorial", "sapling_guard", _overlay(lambda im: [rect(im, 4, 4, 8, 8, P["wd2"]), ellipse(im, 8, 6, 2, 2, P["g3"])]))
    add("memorial", "evening_lamp", _overlay(lambda im: [rect(im, 7, 4, 2, 8, P["ir0"]), pset(im, 8, 3, P["gold"])]))
    return sheets
