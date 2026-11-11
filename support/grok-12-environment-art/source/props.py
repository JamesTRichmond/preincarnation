"""Sixty reusable top-down props. Transparent outside the inked silhouette.
No baked ground shadows. Foot rects are the collision in sprite pixels.
"""
from __future__ import annotations

from lib import PAL, blank, ellipse, hh, line, outline, pset, rect, shade

P = PAL


def _canopy(im, blobs, colors, hi):
    for cx, cy, rx, ry in blobs:
        for y in range(cy - ry - 1, cy + ry + 2):
            for x in range(cx - rx - 1, cx + rx + 2):
                if rx < 1 or ry < 1:
                    continue
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0:
                    pset(im, x, y, shade(colors, x, y, cx, cy))
    # top highlight cluster
    hx, hy, hr = hi
    ellipse(im, hx, hy, hr, max(2, hr - 1), colors[-1])


def _trunk(im, x, y0, y1, w=2):
    for y in range(y0, y1):
        for dx in range(w):
            pset(im, x + dx, y, P["wd1"] if (dx + y) % 3 else P["wd0"])
    pset(im, x - 1, y1 - 1, P["wd0"])
    pset(im, x + w, y1 - 1, P["wd0"])


def sugar_maple():
    im = blank(32, 48)
    _trunk(im, 14, 28, 46, 3)
    _canopy(
        im,
        [(16, 18, 10, 8), (8, 16, 6, 5), (24, 16, 6, 5), (16, 9, 7, 5), (11, 23, 5, 4), (21, 23, 5, 4)],
        (P["mp1"], P["mp0"], P["mp2"], P["mp3"], P["leaf"], P["mp2"]),
        (14, 12, 3),
    )
    outline(im)
    return im, _meta(32, 48, [13, 42, 8, 5], 46)


def young_maple():
    im = blank(16, 32)
    _trunk(im, 7, 18, 30, 2)
    _canopy(im, [(8, 12, 5, 5), (5, 14, 3, 3), (11, 13, 3, 3)], (P["mp1"], P["mp2"], P["g3"], P["mp2"]), (7, 9, 2))
    outline(im)
    return im, _meta(16, 32, [6, 26, 4, 4], 30)


def red_spruce():
    im = blank(32, 48)
    _trunk(im, 15, 34, 46, 2)
    cols = (P["sp0"], P["sp1"], P["sp2"], P["sp1"])
    for i, (y, rx) in enumerate(((10, 4), (16, 7), (22, 9), (28, 11), (34, 8))):
        _canopy(im, [(16, y, rx, 4)], cols, (16, y - 2, 2))
    outline(im)
    return im, _meta(32, 48, [14, 42, 5, 5], 46)


def white_pine():
    im = blank(32, 48)
    _trunk(im, 15, 30, 46, 2)
    cols = (P["sp1"], P["sp0"], P["g0"], P["sp2"])
    _canopy(
        im,
        [(16, 14, 4, 8), (10, 22, 6, 5), (22, 22, 6, 5), (16, 28, 8, 5)],
        cols,
        (16, 10, 2),
    )
    outline(im)
    return im, _meta(32, 48, [14, 42, 5, 5], 46)


def paper_birch():
    im = blank(16, 40)
    for y in range(16, 38):
        pset(im, 7, y, P["white"] if y % 5 else P["ink"])
        pset(im, 8, y, P["cream"] if y % 5 else P["s1"])
    pset(im, 6, 37, P["wd0"])
    pset(im, 9, 37, P["wd0"])
    _canopy(im, [(8, 12, 5, 4), (5, 14, 3, 3), (11, 13, 3, 3)], (P["g2"], P["g1"], P["g3"], P["g4"]), (7, 10, 2))
    outline(im)
    return im, _meta(16, 40, [6, 34, 4, 4], 38)


def apple_tree():
    im = blank(32, 40)
    _trunk(im, 14, 24, 38, 3)
    line(im, 15, 26, 8, 18, P["wd1"])
    line(im, 16, 26, 23, 18, P["wd1"])
    _canopy(
        im,
        [(8, 14, 6, 5), (23, 14, 6, 5), (16, 12, 6, 5), (16, 18, 5, 3)],
        (P["g1"], P["g2"], P["g0"], P["g3"]),
        (16, 10, 2),
    )
    for x, y in ((7, 13), (10, 16), (22, 12), (25, 16), (15, 15), (18, 18)):
        pset(im, x, y, P["redb"])
        pset(im, x + 1, y, P["redb2"])
    outline(im)
    return im, _meta(32, 40, [13, 34, 7, 5], 38)


def elm():
    im = blank(32, 48)
    _trunk(im, 15, 30, 46, 3)
    line(im, 16, 32, 6, 18, P["wd1"])
    line(im, 17, 32, 26, 18, P["wd1"])
    _canopy(
        im,
        [(6, 14, 5, 4), (26, 14, 5, 4), (16, 12, 8, 4), (10, 18, 4, 3), (22, 18, 4, 3)],
        (P["g2"], P["g1"], P["g3"], P["g4"], P["g2"]),
        (16, 10, 2),
    )
    outline(im)
    return im, _meta(32, 48, [14, 42, 6, 5], 46)


def cedar():
    im = blank(16, 32)
    _trunk(im, 7, 22, 30, 2)
    cols = (P["sp0"], P["sp1"], P["sp2"])
    for y, rx in ((8, 3), (14, 5), (20, 6)):
        _canopy(im, [(8, y, rx, 4)], cols, (8, y - 1, 1))
    outline(im)
    return im, _meta(16, 32, [6, 26, 4, 4], 30)


def fern():
    im = blank(16, 16)
    for ang in range(5):
        x1 = 3 + ang * 2
        line(im, 8, 12, x1, 4 + (ang % 2), P["g2"])
        pset(im, x1, 4 + (ang % 2), P["g3"])
        pset(im, x1 + 1, 5, P["g1"])
    outline(im)
    return im, _meta(16, 16, [6, 12, 4, 3], 14, blocks=False)


def cattails():
    im = blank(16, 32)
    for x, h in ((5, 22), (8, 26), (11, 20)):
        line(im, x, 30, x, 30 - h, P["g4"])
        rect(im, x - 1, 30 - h - 4, 3, 5, P["d0"])
        pset(im, x, 30 - h - 3, P["d2"])
    outline(im)
    return im, _meta(16, 32, [4, 28, 8, 3], 30, blocks=False)


def reeds():
    im = blank(16, 16)
    for x in range(2, 14, 2):
        h = 6 + (x % 5)
        line(im, x, 14, x + (1 if x % 4 == 0 else 0), 14 - h, P["g3"] if x % 4 else P["g4"])
    outline(im)
    return im, _meta(16, 16, [2, 12, 12, 3], 15, blocks=False)


def aster_clump():
    im = blank(16, 16)
    ellipse(im, 8, 10, 5, 3, P["g1"])
    for x, y, c in ((5, 7, P["aster"]), (8, 5, P["cream"]), (11, 7, P["aster"]), (7, 9, P["gold"]), (10, 8, P["cream"])):
        pset(im, x, y, c)
        pset(im, x, y + 1, P["g0"])
    outline(im)
    return im, _meta(16, 16, [4, 11, 8, 3], 14, blocks=False)


def goldenrod():
    im = blank(16, 16)
    for x in (5, 8, 11):
        line(im, x, 14, x, 6, P["g2"])
        rect(im, x - 1, 3, 3, 4, P["gold"])
    outline(im)
    return im, _meta(16, 16, [4, 12, 8, 3], 14, blocks=False)


def boulder():
    im = blank(16, 16)
    ellipse(im, 8, 9, 6, 4, P["s1"])
    ellipse(im, 7, 8, 4, 3, P["s2"])
    pset(im, 5, 7, P["s3"])
    pset(im, 6, 7, P["s3"])
    pset(im, 11, 11, P["s0"])
    outline(im)
    return im, _meta(16, 16, [3, 8, 10, 6], 14)


def outcrop():
    im = blank(32, 16)
    ellipse(im, 10, 9, 8, 5, P["s1"])
    ellipse(im, 20, 10, 7, 4, P["s2"])
    line(im, 6, 8, 16, 6, P["s0"])
    line(im, 18, 7, 26, 9, P["s0"])
    pset(im, 8, 7, P["s3"])
    outline(im)
    return im, _meta(32, 16, [4, 8, 24, 6], 14)


def fieldstone():
    im = blank(16, 16)
    ellipse(im, 8, 9, 4, 3, P["s2"])
    pset(im, 6, 8, P["s3"])
    pset(im, 10, 10, P["s0"])
    outline(im)
    return im, _meta(16, 16, [5, 8, 7, 5], 13, blocks=False)


def split_rail_h():
    im = blank(32, 16)
    rect(im, 2, 4, 3, 10, P["wd1"])
    rect(im, 27, 4, 3, 10, P["wd1"])
    rect(im, 4, 6, 24, 2, P["wd2"])
    rect(im, 4, 10, 24, 2, P["wd3"])
    outline(im)
    return im, _meta(32, 16, [2, 4, 28, 10], 14)


def split_rail_v():
    im = blank(16, 32)
    rect(im, 4, 2, 8, 3, P["wd1"])
    rect(im, 4, 27, 8, 3, P["wd1"])
    rect(im, 6, 4, 2, 24, P["wd2"])
    rect(im, 9, 4, 2, 24, P["wd3"])
    outline(im)
    return im, _meta(16, 32, [4, 2, 8, 28], 30)


def stone_wall_run():
    im = blank(32, 16)
    for i, x in enumerate(range(1, 30, 5)):
        h = 7 + (i % 3)
        rect(im, x, 12 - h, 4, h, shade((P["s1"], P["s2"], P["s0"]), i, "sw"))
        pset(im, x, 12 - h, P["s3"])
    outline(im)
    return im, _meta(32, 16, [1, 4, 30, 10], 14)


def stone_wall_end():
    im = blank(16, 16)
    rect(im, 4, 4, 8, 9, P["s1"])
    rect(im, 5, 5, 3, 3, P["s3"])
    rect(im, 9, 8, 2, 3, P["s0"])
    outline(im)
    return im, _meta(16, 16, [4, 4, 8, 9], 13)


def sap_bucket():
    im = blank(16, 16)
    line(im, 8, 2, 8, 6, P["wd1"])
    rect(im, 5, 6, 6, 6, P["ir1"])
    rect(im, 6, 7, 4, 2, P["w2"])
    pset(im, 10, 8, P["ir0"])
    outline(im)
    return im, _meta(16, 16, [5, 6, 6, 7], 13, blocks=False)


def sap_tank():
    im = blank(16, 16)
    ellipse(im, 8, 9, 5, 4, P["ir1"])
    ellipse(im, 8, 8, 4, 2, P["s3"])
    rect(im, 7, 4, 2, 3, P["ir0"])
    outline(im)
    return im, _meta(16, 16, [3, 6, 10, 7], 13)


def hay_bale():
    im = blank(16, 16)
    rect(im, 3, 5, 10, 8, P["gold"])
    for x in range(4, 12, 2):
        pset(im, x, 6, P["corn2"])
        pset(im, x, 10, P["corn2"])
    rect(im, 3, 8, 10, 1, P["d2"])
    outline(im)
    return im, _meta(16, 16, [3, 5, 10, 8], 13)


def round_bale():
    im = blank(16, 16)
    ellipse(im, 8, 9, 5, 5, P["a2"])
    ellipse(im, 8, 9, 3, 3, P["gold"])
    pset(im, 8, 6, P["corn2"])
    pset(im, 6, 9, P["d2"])
    pset(im, 10, 9, P["d2"])
    outline(im)
    return im, _meta(16, 16, [3, 5, 10, 9], 14)


def milk_can():
    im = blank(16, 16)
    rect(im, 6, 3, 4, 2, P["ir1"])
    rect(im, 5, 5, 6, 7, P["s3"])
    rect(im, 6, 6, 4, 4, P["c2"])
    pset(im, 7, 8, P["ir0"])
    outline(im)
    return im, _meta(16, 16, [5, 3, 6, 9], 12)


def cider_barrel():
    im = blank(16, 16)
    ellipse(im, 8, 9, 5, 5, P["wd1"])
    ellipse(im, 8, 9, 4, 4, P["wd2"])
    rect(im, 3, 7, 10, 1, P["ir0"])
    rect(im, 3, 11, 10, 1, P["ir0"])
    pset(im, 8, 5, P["wd0"])
    outline(im)
    return im, _meta(16, 16, [3, 4, 10, 10], 14)


def crate():
    im = blank(16, 16)
    rect(im, 3, 5, 10, 8, P["wd2"])
    rect(im, 4, 6, 8, 6, P["wd3"])
    line(im, 4, 6, 11, 11, P["wd0"])
    line(im, 11, 6, 4, 11, P["wd0"])
    outline(im)
    return im, _meta(16, 16, [3, 5, 10, 8], 13)


def bushel():
    im = blank(16, 16)
    line(im, 4, 6, 3, 12, P["wd1"])
    line(im, 12, 6, 13, 12, P["wd1"])
    line(im, 3, 12, 13, 12, P["wd1"])
    line(im, 4, 6, 12, 6, P["wd2"])
    for x, y in ((6, 8), (9, 7), (8, 10), (11, 9)):
        pset(im, x, y, P["redb"])
    outline(im)
    return im, _meta(16, 16, [3, 6, 11, 7], 13, blocks=False)


def beehive():
    im = blank(16, 16)
    for i, y in enumerate((4, 7, 10)):
        w = 8 - i
        rect(im, 8 - w // 2, y, w, 3, P["cream"] if i % 2 == 0 else P["gold"])
    rect(im, 6, 12, 4, 2, P["wd1"])
    outline(im)
    return im, _meta(16, 16, [4, 4, 8, 10], 14)


def rowboat():
    im = blank(32, 16)
    ellipse(im, 16, 8, 13, 5, P["wd1"])
    ellipse(im, 16, 8, 10, 3, P["wd3"])
    line(im, 6, 8, 26, 8, P["wd0"])
    rect(im, 15, 6, 2, 4, P["s1"])
    pset(im, 22, 7, P["ir1"])
    outline(im)
    return im, _meta(32, 16, [3, 4, 26, 9], 13)


def dock_piling():
    im = blank(16, 16)
    rect(im, 6, 2, 4, 12, P["wd1"])
    rect(im, 7, 3, 2, 8, P["wd2"])
    rect(im, 5, 2, 6, 2, P["wd0"])
    outline(im)
    return im, _meta(16, 16, [6, 2, 4, 12], 14)


def buoy():
    im = blank(16, 16)
    ellipse(im, 8, 9, 3, 4, P["rib"])
    ellipse(im, 8, 8, 2, 2, P["white"])
    line(im, 8, 12, 8, 14, P["ir0"])
    outline(im)
    return im, _meta(16, 16, [5, 5, 6, 9], 14, blocks=False)


def driftwood():
    im = blank(16, 16)
    line(im, 2, 10, 13, 6, P["wd3"])
    line(im, 3, 11, 12, 7, P["wd1"])
    line(im, 8, 8, 10, 4, P["wd2"])
    outline(im)
    return im, _meta(16, 16, [2, 5, 12, 7], 12, blocks=False)


def millstone():
    im = blank(16, 16)
    ellipse(im, 8, 8, 6, 6, P["s1"])
    ellipse(im, 8, 8, 2, 2, P["s0"])
    pset(im, 8, 4, P["s3"])
    pset(im, 11, 8, P["s2"])
    outline(im)
    return im, _meta(16, 16, [2, 2, 12, 12], 14)


def quarry_block():
    im = blank(16, 16)
    rect(im, 3, 5, 10, 8, P["s2"])
    rect(im, 3, 5, 10, 2, P["s3"])
    line(im, 3, 7, 12, 12, P["s0"])
    outline(im)
    return im, _meta(16, 16, [3, 5, 10, 8], 13)


def quarry_cart():
    im = blank(32, 16)
    rect(im, 6, 4, 18, 7, P["ir0"])
    rect(im, 7, 5, 16, 4, P["s1"])
    ellipse(im, 10, 12, 2, 2, P["s0"])
    ellipse(im, 20, 12, 2, 2, P["s0"])
    rect(im, 4, 6, 3, 2, P["wd1"])
    outline(im)
    return im, _meta(32, 16, [6, 4, 18, 10], 14)


def gravestone():
    im = blank(16, 16)
    rect(im, 5, 6, 6, 7, P["s2"])
    ellipse(im, 8, 6, 3, 3, P["s3"])
    pset(im, 8, 8, P["s0"])
    outline(im)
    return im, _meta(16, 16, [5, 4, 6, 9], 13)


def cairn():
    im = blank(16, 16)
    ellipse(im, 8, 12, 5, 2, P["s1"])
    ellipse(im, 8, 9, 3, 2, P["s2"])
    ellipse(im, 8, 6, 2, 2, P["s3"])
    outline(im)
    return im, _meta(16, 16, [3, 5, 10, 9], 14)


def wreath():
    im = blank(16, 16)
    ellipse(im, 8, 8, 5, 5, P["g1"])
    ellipse(im, 8, 8, 3, 3, P["ink"])
    # punch center transparent by redrawing after... ellipse filled center. Clear center.
    for y in range(6, 11):
        for x in range(6, 11):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 4:
                im[y, x] = (0, 0, 0, 0)
    pset(im, 8, 3, P["rib"])
    pset(im, 7, 4, P["rib"])
    outline(im)
    return im, _meta(16, 16, [3, 3, 10, 10], 13, blocks=False)


def bench():
    im = blank(32, 16)
    rect(im, 4, 6, 24, 3, P["wd2"])
    rect(im, 4, 5, 24, 1, P["wd3"])
    rect(im, 5, 9, 2, 4, P["ir0"])
    rect(im, 25, 9, 2, 4, P["ir0"])
    rect(im, 6, 4, 2, 5, P["wd1"])
    rect(im, 24, 4, 2, 5, P["wd1"])
    outline(im)
    return im, _meta(32, 16, [4, 4, 24, 9], 13, blocks=False)


def lamp_post():
    im = blank(16, 32)
    rect(im, 7, 8, 2, 20, P["ir0"])
    rect(im, 5, 4, 6, 5, P["ir1"])
    rect(im, 6, 5, 4, 3, P["gold"])
    rect(im, 4, 27, 8, 2, P["s0"])
    outline(im)
    return im, _meta(16, 32, [4, 26, 8, 4], 30)


def signpost():
    im = blank(16, 32)
    rect(im, 7, 10, 2, 18, P["wd1"])
    rect(im, 3, 8, 10, 6, P["wd3"])
    rect(im, 4, 9, 8, 4, P["cream"])
    # no lettering; a single painted notch so the board reads blank on purpose
    rect(im, 6, 11, 4, 1, P["trim"])
    outline(im)
    return im, _meta(16, 32, [6, 26, 4, 4], 30, blocks=False)


def well():
    im = blank(16, 16)
    ellipse(im, 8, 9, 6, 4, P["s1"])
    ellipse(im, 8, 8, 3, 2, P["w0"])
    rect(im, 7, 2, 2, 6, P["wd1"])
    line(im, 3, 3, 13, 3, P["wd2"])
    outline(im)
    return im, _meta(16, 16, [2, 4, 12, 9], 13)


def stump():
    im = blank(16, 16)
    ellipse(im, 8, 9, 5, 3, P["wd1"])
    ellipse(im, 8, 8, 4, 2, P["wd3"])
    ellipse(im, 8, 8, 1, 1, P["wd0"])
    outline(im)
    return im, _meta(16, 16, [3, 6, 10, 6], 12)


def cordwood():
    im = blank(32, 16)
    for i in range(6):
        ellipse(im, 6 + i * 4, 9, 2, 3, P["wd1"] if i % 2 else P["wd2"])
        pset(im, 6 + i * 4, 9, P["wd3"])
    outline(im)
    return im, _meta(32, 16, [3, 6, 26, 7], 13)


def corn_shock():
    im = blank(16, 32)
    for dx in (-3, -1, 1, 3):
        line(im, 8, 28, 8 + dx, 8, P["corn"])
    rect(im, 6, 16, 4, 2, P["d2"])
    outline(im)
    return im, _meta(16, 32, [5, 24, 6, 6], 30, blocks=False)


def pumpkins():
    im = blank(16, 16)
    ellipse(im, 6, 10, 3, 3, P["mp1"])
    ellipse(im, 11, 10, 3, 2, P["mp2"])
    pset(im, 6, 7, P["g2"])
    pset(im, 11, 8, P["g1"])
    outline(im)
    return im, _meta(16, 16, [3, 7, 11, 6], 13, blocks=False)


def apple_crate():
    im = blank(16, 16)
    rect(im, 3, 6, 10, 7, P["wd2"])
    for x, y in ((5, 8), (8, 8), (11, 8), (6, 10), (10, 10)):
        pset(im, x, y, P["redb2"])
    rect(im, 3, 6, 10, 1, P["wd0"])
    outline(im)
    return im, _meta(16, 16, [3, 6, 10, 7], 13)


def wheelbarrow():
    im = blank(16, 16)
    line(im, 3, 5, 12, 11, P["wd1"])
    line(im, 6, 4, 13, 10, P["wd2"])
    ellipse(im, 12, 12, 2, 2, P["ir0"])
    rect(im, 4, 6, 5, 3, P["rust"])
    outline(im)
    return im, _meta(16, 16, [3, 4, 11, 10], 14)


def ladder():
    im = blank(16, 32)
    line(im, 4, 2, 4, 30, P["wd2"])
    line(im, 11, 2, 11, 30, P["wd1"])
    for y in range(4, 29, 4):
        line(im, 4, y, 11, y, P["wd3"])
    outline(im)
    return im, _meta(16, 32, [4, 2, 8, 28], 30, blocks=False)


def scaffold():
    im = blank(16, 32)
    rect(im, 3, 4, 2, 26, P["wd2"])
    rect(im, 11, 4, 2, 26, P["wd1"])
    rect(im, 3, 8, 10, 2, P["wd3"])
    rect(im, 3, 16, 10, 2, P["wd3"])
    rect(im, 3, 24, 10, 2, P["wd3"])
    outline(im)
    return im, _meta(16, 32, [3, 4, 10, 26], 30)


def tarp_bundle():
    im = blank(16, 16)
    ellipse(im, 8, 9, 5, 3, P["shut"])
    ellipse(im, 7, 8, 3, 2, P["blueg2"])
    line(im, 4, 9, 12, 8, P["ir1"])
    outline(im)
    return im, _meta(16, 16, [3, 6, 10, 6], 12)


def ribbon_post():
    im = blank(16, 32)
    rect(im, 7, 8, 2, 20, P["wd1"])
    line(im, 8, 10, 4, 14, P["rib"])
    line(im, 8, 10, 12, 14, P["rib"])
    pset(im, 4, 14, P["rib"])
    pset(im, 12, 14, P["cream"])
    outline(im)
    return im, _meta(16, 32, [6, 26, 4, 4], 30, blocks=False)


def staked_sapling():
    im = blank(16, 32)
    rect(im, 4, 14, 1, 14, P["wd2"])
    rect(im, 11, 14, 1, 14, P["wd2"])
    line(im, 8, 28, 8, 16, P["wd1"])
    _canopy(im, [(8, 12, 4, 4)], (P["g2"], P["g3"], P["g1"]), (7, 10, 1))
    outline(im)
    return im, _meta(16, 32, [4, 24, 8, 6], 30, blocks=False)


def birch_log():
    im = blank(16, 16)
    ellipse(im, 4, 8, 3, 3, P["white"])
    ellipse(im, 4, 8, 1, 1, P["wd3"])
    rect(im, 6, 7, 8, 3, P["cream"])
    pset(im, 8, 7, P["ink"])
    pset(im, 11, 8, P["ink"])
    outline(im)
    return im, _meta(16, 16, [2, 5, 12, 6], 11, blocks=False)


def lilypads():
    im = blank(16, 16)
    ellipse(im, 5, 8, 3, 2, P["g1"])
    ellipse(im, 11, 9, 3, 2, P["g2"])
    pset(im, 5, 8, P["w2"])
    pset(im, 12, 8, P["cream"])
    outline(im)
    return im, _meta(16, 16, [2, 6, 12, 5], 11, blocks=False)


def mushrooms():
    im = blank(16, 16)
    ellipse(im, 6, 9, 3, 2, P["redb"])
    rect(im, 5, 9, 2, 3, P["cream"])
    ellipse(im, 11, 10, 2, 2, P["s3"])
    rect(im, 10, 10, 2, 3, P["wd3"])
    pset(im, 5, 8, P["cream"])
    outline(im)
    return im, _meta(16, 16, [3, 7, 10, 6], 13, blocks=False)


def iron_gate():
    im = blank(16, 32)
    rect(im, 3, 6, 2, 22, P["ir0"])
    rect(im, 11, 6, 2, 22, P["ir0"])
    for y in (8, 14, 20):
        rect(im, 3, y, 10, 1, P["ir1"])
    pset(im, 8, 16, P["gold"])
    outline(im)
    return im, _meta(16, 32, [3, 6, 10, 22], 28)


def canoe():
    im = blank(32, 16)
    line(im, 3, 8, 8, 4, P["mp0"])
    line(im, 3, 8, 8, 12, P["mp0"])
    line(im, 8, 4, 24, 4, P["mp1"])
    line(im, 8, 12, 24, 12, P["mp1"])
    line(im, 24, 4, 29, 8, P["mp0"])
    line(im, 24, 12, 29, 8, P["mp0"])
    line(im, 10, 8, 22, 8, P["wd2"])
    outline(im)
    return im, _meta(32, 16, [3, 4, 26, 8], 12)


def chimney_stack():
    im = blank(16, 32)
    rect(im, 4, 10, 8, 18, P["b1"])
    for y in range(12, 26, 3):
        rect(im, 4, y, 8, 1, P["mort"])
    rect(im, 3, 8, 10, 3, P["b0"])
    rect(im, 6, 14, 2, 2, P["s0"])
    outline(im)
    return im, _meta(16, 32, [4, 8, 8, 20], 28)


def _meta(w, h, foot, sort_y, blocks=True):
    return {
        "w": w,
        "h": h,
        "foot": foot,
        "sort_y": sort_y,
        "blocks": blocks,
        "layer": "prop",
        "anchor": "feet",
    }


CATALOG = [
    ("sugar_maple", sugar_maple),
    ("young_maple", young_maple),
    ("red_spruce", red_spruce),
    ("white_pine", white_pine),
    ("paper_birch", paper_birch),
    ("apple_tree", apple_tree),
    ("elm", elm),
    ("cedar", cedar),
    ("fern", fern),
    ("cattails", cattails),
    ("reeds", reeds),
    ("aster_clump", aster_clump),
    ("goldenrod", goldenrod),
    ("boulder", boulder),
    ("outcrop", outcrop),
    ("fieldstone", fieldstone),
    ("split_rail_h", split_rail_h),
    ("split_rail_v", split_rail_v),
    ("stone_wall_run", stone_wall_run),
    ("stone_wall_end", stone_wall_end),
    ("sap_bucket", sap_bucket),
    ("sap_tank", sap_tank),
    ("hay_bale", hay_bale),
    ("round_bale", round_bale),
    ("milk_can", milk_can),
    ("cider_barrel", cider_barrel),
    ("crate", crate),
    ("bushel", bushel),
    ("beehive", beehive),
    ("rowboat", rowboat),
    ("dock_piling", dock_piling),
    ("buoy", buoy),
    ("driftwood", driftwood),
    ("millstone", millstone),
    ("quarry_block", quarry_block),
    ("quarry_cart", quarry_cart),
    ("gravestone", gravestone),
    ("cairn", cairn),
    ("wreath", wreath),
    ("bench", bench),
    ("lamp_post", lamp_post),
    ("signpost", signpost),
    ("well", well),
    ("stump", stump),
    ("cordwood", cordwood),
    ("corn_shock", corn_shock),
    ("pumpkins", pumpkins),
    ("apple_crate", apple_crate),
    ("wheelbarrow", wheelbarrow),
    ("ladder", ladder),
    ("scaffold", scaffold),
    ("tarp_bundle", tarp_bundle),
    ("ribbon_post", ribbon_post),
    ("staked_sapling", staked_sapling),
    ("birch_log", birch_log),
    ("lilypads", lilypads),
    ("mushrooms", mushrooms),
    ("iron_gate", iron_gate),
    ("canoe", canoe),
    ("chimney_stack", chimney_stack),
]
