#!/usr/bin/env python3
"""Native 16×16 Addison farmhand. 4 dirs × 4 frames. Not Link."""
from pathlib import Path
from PIL import Image

INK = (20, 14, 10, 255)
HAIR = (92, 48, 24, 255)
HAIRL = (140, 80, 40, 255)
SKIN = (232, 188, 148, 255)
FLAN = (176, 36, 36, 255)
FLAND = (112, 20, 20, 255)
CHECK = (32, 18, 16, 255)
BELT = (120, 76, 40, 255)
PANT = (92, 64, 40, 255)
BOOT = (72, 44, 24, 255)
KNIFE = (196, 204, 212, 255)
HILT = (140, 96, 48, 255)
TRANS = (0, 0, 0, 0)

W, H = 16, 16


def blank():
    return Image.new("RGBA", (W, H), TRANS)


def put(im, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        im.putpixel((x, y), c)


def rect(im, x, y, w, h, c):
    for py in range(y, y + h):
        for px in range(x, x + w):
            put(im, px, py, c)


def outline(im):
    pix = im.load()
    out = im.copy()
    op = out.load()
    for y in range(H):
        for x in range(W):
            if pix[x, y][3] >= 200:
                continue
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and pix[nx, ny][3] >= 200:
                    op[x, y] = INK
                    break
    return out


def body_down(im, ox, oy, step):
    rect(im, ox + 5, oy + 0, 6, 2, HAIR)
    put(im, ox + 4, oy + 1, HAIR)
    put(im, ox + 11, oy + 1, HAIR)
    put(im, ox + 7, oy + 0, HAIRL)
    rect(im, ox + 5, oy + 2, 6, 3, SKIN)
    put(im, ox + 6, oy + 3, INK)
    put(im, ox + 9, oy + 3, INK)
    rect(im, ox + 4, oy + 5, 8, 5, FLAN)
    for px in range(4, 12, 2):
        put(im, ox + px, oy + 6, CHECK)
        put(im, ox + px + 1, oy + 8, CHECK)
    put(im, ox + 4, oy + 6, FLAND)
    put(im, ox + 11, oy + 6, FLAND)
    rect(im, ox + 4, oy + 10, 8, 1, BELT)
    put(im, ox + 11, oy + 8, HILT)
    put(im, ox + 12, oy + 7, KNIFE)
    put(im, ox + 12, oy + 8, KNIFE)
    ly = 1 if step == 1 else (-1 if step == 3 else 0)
    ry = -ly
    rect(im, ox + 5, oy + 11, 2, 3 + max(ly, 0), PANT)
    rect(im, ox + 9, oy + 11, 2, 3 + max(ry, 0), PANT)
    rect(im, ox + 4, oy + 14 + max(ly, 0), 3, 2, BOOT)
    rect(im, ox + 9, oy + 14 + max(ry, 0), 3, 2, BOOT)


def body_up(im, ox, oy, step):
    rect(im, ox + 5, oy + 0, 6, 4, HAIR)
    put(im, ox + 4, oy + 1, HAIR)
    put(im, ox + 11, oy + 1, HAIR)
    rect(im, ox + 4, oy + 5, 8, 5, FLAN)
    for px in range(4, 12, 2):
        put(im, ox + px, oy + 6, CHECK)
        put(im, ox + px + 1, oy + 8, CHECK)
    rect(im, ox + 4, oy + 10, 8, 1, BELT)
    ly = 1 if step == 1 else (-1 if step == 3 else 0)
    ry = -ly
    rect(im, ox + 5, oy + 11, 2, 3 + max(ly, 0), PANT)
    rect(im, ox + 9, oy + 11, 2, 3 + max(ry, 0), PANT)
    rect(im, ox + 4, oy + 14 + max(ly, 0), 3, 2, BOOT)
    rect(im, ox + 9, oy + 14 + max(ry, 0), 3, 2, BOOT)


def body_side(im, ox, oy, step, left):
    rect(im, ox + 5, oy + 0, 6, 2, HAIR)
    if left:
        rect(im, ox + 9, oy + 1, 3, 3, HAIR)
    else:
        rect(im, ox + 4, oy + 1, 3, 3, HAIR)
    rect(im, ox + 5, oy + 2, 6, 3, SKIN)
    put(im, ox + (6 if left else 9), oy + 3, INK)
    rect(im, ox + 4, oy + 5, 8, 5, FLAN)
    put(im, ox + 5, oy + 6, CHECK)
    put(im, ox + 8, oy + 8, CHECK)
    rect(im, ox + 4, oy + 10, 8, 1, BELT)
    if left:
        put(im, ox + 3, oy + 7, HILT)
        put(im, ox + 2, oy + 6, KNIFE)
        put(im, ox + 2, oy + 7, KNIFE)
    else:
        put(im, ox + 12, oy + 7, HILT)
        put(im, ox + 13, oy + 6, KNIFE)
        put(im, ox + 13, oy + 7, KNIFE)
    if step in (0, 2):
        rect(im, ox + 6, oy + 11, 3, 3, PANT)
        rect(im, ox + 6, oy + 14, 4, 2, BOOT)
    else:
        rect(im, ox + 4, oy + 11, 3, 3, PANT)
        rect(im, ox + 8, oy + 11, 3, 2, PANT)
        rect(im, ox + 3, oy + 14, 4, 2, BOOT)
        rect(im, ox + 8, oy + 13, 4, 2, BOOT)


def frame(dir_, step):
    im = blank()
    if dir_ == 0:
        body_down(im, 0, 0, step)
    elif dir_ == 3:
        body_up(im, 0, 0, step)
    elif dir_ == 1:
        body_side(im, 0, 0, step, True)
    else:
        body_side(im, 0, 0, step, False)
    return outline(im)


def sheet():
    out = Image.new("RGBA", (4 * W, 4 * H), TRANS)
    for r, d in enumerate((0, 1, 2, 3)):
        for c in range(4):
            out.paste(frame(d, c), (c * W, r * H))
    return out


def main():
    root = Path("/workspace/public/game")
    walk = sheet()
    walk.save(root / "wanderer-walk/snes.png")
    print("walk", walk.size)


if __name__ == "__main__":
    main()
