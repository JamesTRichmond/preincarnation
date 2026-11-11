"""Authored district maps. Materials are cell ids; the autotiler turns them into corner tiles."""
from __future__ import annotations

from lib import hh

W, H = 32, 20

PRIORITY = {
    "grass": 1, "pasture": 2, "alley": 2, "ridge": 2, "tussock": 3, "moss": 3,
    "litter": 4, "duff": 4, "stubble": 4, "dirt": 5, "notch": 5, "mud": 6,
    "gravel": 7, "creekbed": 7, "sand": 8, "drift": 8, "peat": 8, "dust": 6,
    "cobble": 9, "flag": 9, "bluestone": 9, "shale": 9, "ledge": 9, "granite": 9,
    "talus": 9, "board": 10, "cliff": 12, "cutface": 12, "water": 14, "millrace": 15,
}


def _g(fill="grass"):
    return [[fill for _ in range(W)] for _ in range(H)]


def _disc(g, cx, cy, r, mat):
    for y in range(H):
        for x in range(W):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                g[y][x] = mat


def _stroke(g, x0, y0, x1, y1, mat, rad=0):
    steps = max(abs(x1 - x0), abs(y1 - y0), 1)
    for i in range(steps + 1):
        t = i / steps
        x = int(round(x0 + (x1 - x0) * t))
        y = int(round(y0 + (y1 - y0) * t))
        for dy in range(-rad, rad + 1):
            for dx in range(-rad, rad + 1):
                if dx * dx + dy * dy <= rad * rad + 0.01:
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < W and 0 <= yy < H:
                        g[yy][xx] = mat


def _rect(g, x, y, w, h, mat):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if 0 <= xx < W and 0 <= yy < H:
                g[yy][xx] = mat


def _prop(pid, tx, ty):
    return {"id": pid, "tx": tx, "ty": ty}


def _b(wall, roof, x, y, w, h, door=True):
    return {"wall": wall, "roof": roof, "x": x, "y": y, "w": w, "h": h, "door": door}


def middlebury():
    g = _g("grass")
    _rect(g, 0, 0, W, 2, "cobble")
    _stroke(g, 2, 10, 29, 10, "bluestone", 1)
    _stroke(g, 16, 2, 16, 17, "bluestone", 0)
    _disc(g, 8, 6, 2, "flag")
    _rect(g, 22, 13, 6, 3, "cobble")
    return {
        "id": "middlebury_green",
        "title": "Middlebury Green",
        "blurb": "College-town green, bluestone walks, clapboard and brick.",
        "ground": g,
        "buildings": [
            _b("brick", "slate", 1, 1, 6, 4),
            _b("clap", "slate", 22, 1, 7, 4),
            _b("clap", "shingle", 1, 13, 6, 4),
            _b("brick", "slate", 24, 13, 6, 4, door=True),
        ],
        "props": [
            _prop("elm", 6, 4), _prop("elm", 18, 4), _prop("paper_birch", 10, 6),
            _prop("bench", 12, 8), _prop("lamp_post", 20, 7), _prop("gravestone", 26, 8),
            _prop("iron_gate", 8, 12), _prop("aster_clump", 14, 13), _prop("well", 5, 8),
        ],
        "features": [(10, 10, "middlebury_green.crosswalk"), (16, 6, "middlebury_green.pier"),
                     (24, 15, "middlebury_green.stoop")],
    }


def vergennes():
    g = _g("grass")
    _rect(g, 12, 0, 8, H, "ledge")
    _rect(g, 14, 0, 4, 8, "water")
    _rect(g, 14, 8, 4, 4, "millrace")
    _rect(g, 13, 12, 6, 8, "water")
    _stroke(g, 0, 15, 12, 15, "gravel", 0)
    _stroke(g, 20, 15, 31, 15, "gravel", 0)
    return {
        "id": "vergennes_falls",
        "title": "Vergennes Falls",
        "blurb": "Mill ledge, race, and a three-tile fall into the basin.",
        "ground": g,
        "buildings": [
            _b("mill", "slate", 2, 2, 7, 5),
            _b("brick", "shingle", 22, 2, 7, 4),
            _b("stone", "slate", 2, 12, 5, 4, door=True),
        ],
        "props": [
            _prop("millstone", 9, 6), _prop("crate", 8, 8), _prop("chimney_stack", 4, 1),
            _prop("split_rail_h", 22, 10), _prop("boulder", 11, 14), _prop("reed", 20, 16) if False else _prop("reeds", 20, 16),
        ],
        "features": [
            (15, 7, "vergennes_falls.falls_crest"),
            (16, 7, "vergennes_falls.falls_crest"),
            (15, 8, "vergennes_falls.falls_mid"),
            (16, 8, "vergennes_falls.falls_mid"),
            (15, 9, "vergennes_falls.falls_base"),
            (16, 9, "vergennes_falls.falls_base"),
            (18, 6, "vergennes_falls.sluice"),
            (10, 5, "vergennes_falls.wheel_pad"),
        ],
    }


def otter():
    g = _g("peat")
    _disc(g, 10, 8, 5, "water")
    _disc(g, 22, 12, 4, "water")
    _stroke(g, 0, 4, 31, 6, "board", 0)
    _rect(g, 4, 14, 10, 3, "tussock")
    _disc(g, 27, 4, 3, "grass")
    return {
        "id": "otter_marsh",
        "title": "Otter Marsh",
        "blurb": "Peat, tussock, a corduroy boardwalk and black water.",
        "ground": g,
        "buildings": [_b("camp", "shake", 24, 1, 5, 3, door=True)],
        "props": [
            _prop("cattails", 8, 5), _prop("cattails", 18, 10), _prop("reeds", 14, 12),
            _prop("lilypads", 9, 7), _prop("duck" if False else "buoy", 21, 11),
            _prop("cedar", 28, 1), _prop("driftwood", 3, 10),
        ],
        "features": [(6, 5, "otter_marsh.board_break"), (12, 14, "otter_marsh.reed_tile"),
                     (16, 4, "otter_marsh.post")],
    }


def champlain():
    g = _g("grass")
    for x in range(W):
        shore = 8 + int(2 * ((x % 7) - 3) / 7)
        for y in range(shore, H):
            g[y][x] = "water"
        if shore - 1 >= 0:
            g[shore - 1][x] = "drift"
        if shore - 2 >= 0 and x % 2 == 0:
            g[shore - 2][x] = "shale"
    _stroke(g, 2, 3, 20, 5, "dirt", 0)
    _rect(g, 4, 6, 8, 1, "board")
    return {
        "id": "champlain_shore",
        "title": "Champlain Shore",
        "blurb": "Shale shelf, drift sand, and a short dock into the lake.",
        "ground": g,
        "buildings": [_b("camp", "shake", 22, 1, 6, 3), _b("clap", "shingle", 2, 1, 5, 3)],
        "props": [
            _prop("rowboat", 12, 10), _prop("canoe", 18, 12), _prop("buoy", 8, 14),
            _prop("dock_piling", 6, 7), _prop("driftwood", 16, 6), _prop("reeds", 26, 7),
            _prop("paper_birch", 18, 1),
        ],
        "features": [(10, 6, "champlain_shore.dock_plank"), (14, 5, "champlain_shore.drift_log")],
    }


def ripton():
    g = _g("duff")
    _stroke(g, 0, 10, 31, 12, "dirt", 0)
    _disc(g, 8, 5, 3, "granite")
    _disc(g, 24, 6, 2, "moss")
    _disc(g, 16, 15, 2, "granite")
    for i in range(8):
        g[3 + (i % 3)][3 + i * 3] = "moss"
    return {
        "id": "ripton_woods",
        "title": "Ripton High Woods",
        "blurb": "Needle duff, granite, and a dark spruce interior.",
        "ground": g,
        "buildings": [_b("log", "shake", 26, 13, 5, 4)],
        "props": [
            _prop("red_spruce", 2, 1), _prop("white_pine", 12, 1), _prop("red_spruce", 20, 2),
            _prop("paper_birch", 8, 8), _prop("fern", 14, 8), _prop("mushrooms", 18, 14),
            _prop("boulder", 6, 4), _prop("stump", 22, 10), _prop("birch_log", 10, 14),
        ],
        "features": [(8, 5, "ripton_woods.moss_cap"), (15, 10, "ripton_woods.fern_bed"),
                     (4, 11, "ripton_woods.trail_log")],
    }


def lincoln():
    g = _g("litter")
    _stroke(g, 0, 8, 31, 14, "dirt", 0)
    _disc(g, 6, 4, 2, "grass")
    _rect(g, 18, 3, 6, 2, "grass")
    return {
        "id": "lincoln_sugar",
        "title": "Lincoln Sugar Slope",
        "blurb": "October litter, tubing line, and a sugarhouse.",
        "ground": g,
        "buildings": [_b("camp", "shake", 20, 1, 6, 4), _b("barn", "metal", 2, 12, 6, 4)],
        "props": [
            _prop("sugar_maple", 4, 1), _prop("sugar_maple", 12, 2), _prop("young_maple", 28, 4),
            _prop("sap_bucket", 8, 6), _prop("sap_tank", 16, 6), _prop("cordwood", 24, 10),
            _prop("stone_wall_run", 4, 10), _prop("stump", 30, 12),
        ],
        "features": [(10, 7, "lincoln_sugar.tubing"), (22, 8, "lincoln_sugar.sled_rut")],
    }


def shoreham():
    g = _g("grass")
    for y in range(2, 16, 3):
        _rect(g, 2, y, 20, 1, "alley")
    _stroke(g, 24, 0, 24, 19, "dirt", 0)
    _rect(g, 26, 8, 4, 3, "dirt")
    return {
        "id": "shoreham_orchard",
        "title": "Shoreham Orchard",
        "blurb": "Mown alleys, apple rows, hive and press yard.",
        "ground": g,
        "buildings": [_b("clap", "shingle", 26, 1, 5, 4), _b("barn", "metal", 26, 12, 5, 4)],
        "props": [
            _prop("apple_tree", 3, 2), _prop("apple_tree", 10, 2), _prop("apple_tree", 16, 5),
            _prop("apple_tree", 4, 8), _prop("apple_tree", 12, 8), _prop("apple_tree", 6, 12),
            _prop("bushel", 18, 10), _prop("beehive", 20, 14), _prop("cider_barrel", 18, 16),
            _prop("apple_crate", 8, 16),
        ],
        "features": [(8, 4, "shoreham_orchard.tree_row"), (27, 10, "shoreham_orchard.press_pad")],
    }


def addison():
    g = _g("pasture")
    _stroke(g, 0, 6, 31, 6, "dirt", 0)
    _rect(g, 4, 10, 14, 6, "stubble")
    _disc(g, 24, 14, 2, "mud")
    return {
        "id": "addison_intervale",
        "title": "Addison Intervale",
        "blurb": "Dairy pasture, stubble, and a barn against the lane.",
        "ground": g,
        "buildings": [
            _b("clap", "shingle", 2, 1, 6, 4),
            _b("barn", "metal", 20, 1, 8, 4),
        ],
        "props": [
            _prop("round_bale", 8, 8), _prop("hay_bale", 12, 8), _prop("round_bale", 16, 12),
            _prop("milk_can", 10, 3), _prop("corn_shock", 6, 12), _prop("split_rail_h", 4, 16),
            _prop("pumpkins", 14, 15), _prop("elm", 28, 8),
        ],
        "features": [(22, 7, "addison_intervale.silo_base"), (8, 6, "addison_intervale.fence_line")],
    }


def leicester():
    g = _g("dust")
    _rect(g, 0, 0, 8, H, "talus")
    _rect(g, 2, 2, 3, 12, "granite")
    _stroke(g, 10, 10, 30, 10, "gravel", 0)
    _rect(g, 18, 12, 8, 4, "talus")
    return {
        "id": "leicester_quarry",
        "title": "Leicester Quarry",
        "blurb": "Cut face, talus, and a rail running into the spoil.",
        "ground": g,
        "buildings": [_b("stone", "metal", 22, 1, 7, 4)],
        "props": [
            _prop("quarry_cart", 12, 8), _prop("quarry_block", 16, 12), _prop("quarry_block", 20, 14),
            _prop("boulder", 4, 14), _prop("ladder", 8, 4), _prop("cordwood", 26, 12),
        ],
        "features": [
            (2, 4, "leicester_quarry.face"), (2, 6, "leicester_quarry.face"),
            (2, 8, "leicester_quarry.face"), (3, 4, "leicester_quarry.face"),
            (14, 10, "leicester_quarry.rail"), (20, 10, "leicester_quarry.rail"),
            (24, 6, "leicester_quarry.derrick_pad"),
        ],
    }


def bristol():
    g = _g("grass")
    _rect(g, 0, 0, 6, 14, "cliff")
    _stroke(g, 6, 16, 31, 8, "notch", 0)
    _stroke(g, 10, 16, 28, 4, "dirt", 0)
    _disc(g, 20, 14, 2, "gravel")
    return {
        "id": "bristol_notch",
        "title": "Bristol Notch",
        "blurb": "Cliff foot, rutted notch road, and a small porch row.",
        "ground": g,
        "buildings": [
            _b("clap", "shingle", 22, 1, 7, 4),
            _b("clap", "slate", 12, 1, 5, 3),
        ],
        "props": [
            _prop("cedar", 8, 2), _prop("fern", 7, 6), _prop("boulder", 4, 12),
            _prop("signpost", 10, 8), _prop("fieldstone", 16, 10), _prop("goldenrod", 28, 12),
        ],
        "features": [
            (5, 4, "bristol_notch.cliff_foot"), (5, 8, "bristol_notch.cliff_foot"),
            (14, 12, "bristol_notch.rut"),
        ],
    }


def weybridge():
    g = _g("grass")
    _rect(g, 0, 8, W, 4, "creekbed")
    _rect(g, 12, 8, 8, 4, "board")
    _stroke(g, 16, 0, 16, 8, "dirt", 0)
    _stroke(g, 16, 12, 16, 19, "dirt", 0)
    _disc(g, 4, 4, 2, "sand")
    _disc(g, 26, 15, 2, "sand")
    return {
        "id": "weybridge_span",
        "title": "Weybridge Span",
        "blurb": "Creek bed, plank deck, and meadow approaches.",
        "ground": g,
        "buildings": [_b("clap", "slate", 2, 1, 5, 4), _b("clap", "shingle", 24, 13, 6, 4)],
        "props": [
            _prop("paper_birch", 8, 1), _prop("goldenrod", 22, 4), _prop("aster_clump", 6, 14),
            _prop("bench", 18, 5), _prop("rowboat", 22, 9), _prop("reeds", 4, 8),
        ],
        "features": [
            (12, 8, "weybridge_span.truss_bay"), (12, 11, "weybridge_span.truss_bay"),
            (19, 8, "weybridge_span.truss_bay"), (19, 11, "weybridge_span.truss_bay"),
            (14, 9, "weybridge_span.deck_edge"), (8, 8, "weybridge_span.abutment"),
        ],
    }


def monkton():
    g = _g("ridge")
    _stroke(g, 0, 10, 31, 8, "dirt", 0)
    _rect(g, 0, 0, W, 3, "granite")
    _disc(g, 8, 14, 2, "grass")
    _disc(g, 20, 15, 2, "grass")
    return {
        "id": "monkton_ridge",
        "title": "Monkton Ridge",
        "blurb": "Thin ridge grass, a windbreak, and a hamlet stoop.",
        "ground": g,
        "buildings": [_b("clap", "metal", 22, 3, 6, 4), _b("barn", "metal", 4, 3, 6, 4)],
        "props": [
            _prop("red_spruce", 14, 1), _prop("cedar", 18, 2), _prop("white_pine", 10, 0),
            _prop("split_rail_h", 12, 12), _prop("boulder", 2, 8), _prop("goldenrod", 28, 12),
            _prop("staked_sapling", 16, 13),
        ],
        "features": [(8, 14, "monkton_ridge.blueberry"), (20, 10, "monkton_ridge.track")],
    }


SCENES = [
    middlebury, vergennes, otter, champlain, ripton, lincoln,
    shoreham, addison, leicester, bristol, weybridge, monkton,
]


def corners_of(ground, x, y):
    def vert(vx, vy):
        cells = []
        for dy in (-1, 0):
            for dx in (-1, 0):
                cx, cy = vx + dx, vy + dy
                if 0 <= cx < W and 0 <= cy < H:
                    cells.append(ground[cy][cx])
        if not cells:
            return "grass"
        return max(cells, key=lambda m: (PRIORITY[m], m))

    return vert(x, y), vert(x + 1, y), vert(x + 1, y + 1), vert(x, y + 1)


def variant_for(corners, x, y):
    if len(set(corners)) == 1 and corners[0] == "grass":
        return hh(x, y, "gv") % 4
    if len(set(corners)) == 1 and corners[0] == "dirt":
        return hh(x, y, "dv") % 2
    return 0
