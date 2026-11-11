"""Export a walkable county from the authored scenes. Does not rebake atlases."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import PAL, NIGHT, blank, ellipse, line, outline, pset, rect, save_png  # noqa: E402
from scenes import SCENES, W, H, corners_of, variant_for  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = Path("/workspace/public/world")
TILE = 16

WATER = {"water", "millrace"}
HARD = WATER | {"cliff", "cutface"}

ERA_ORDER = ["tended", "weathered", "ruined", "rebuilding", "stewardship", "memorial"]

SPAWNS = {
    "middlebury_green": (16, 12),
    "vergennes_falls": (10, 15),
    "otter_marsh": (4, 4),
    "champlain_shore": (10, 4),
    "ripton_woods": (14, 11),
    "lincoln_sugar": (12, 10),
    "shoreham_orchard": (24, 6),
    "addison_intervale": (12, 7),
    "leicester_quarry": (15, 11),
    "bristol_notch": (20, 11),
    "weybridge_span": (16, 4),
    "monkton_ridge": (16, 9),
}

# Building index -> interior kit. Missing indexes stay latched.
DOORS = {
    "middlebury_green": {0: "meetinghouse", 2: "general_store"},
    "vergennes_falls": {0: "mill_floor", 2: "quarry_shed"},
    "otter_marsh": {0: "lake_camp"},
    "champlain_shore": {0: "lake_camp", 1: "farmhouse_kitchen"},
    "ripton_woods": {0: "lake_camp"},
    "lincoln_sugar": {0: "sugarhouse", 1: "dairy_barn"},
    "shoreham_orchard": {0: "general_store", 1: "dairy_barn"},
    "addison_intervale": {0: "farmhouse_kitchen", 1: "dairy_barn"},
    "leicester_quarry": {0: "quarry_shed"},
    "bristol_notch": {0: "farmhouse_kitchen", 1: "meetinghouse"},
    "weybridge_span": {0: "farmhouse_kitchen", 1: "general_store"},
    "monkton_ridge": {0: "farmhouse_kitchen", 1: "dairy_barn"},
}

LINES = {
    "middlebury_green": {
        "tended": "The green is mown to the bluestone. The meetinghouse door is off the latch.",
        "weathered": "Fourteen years. The elms held. The paint on the clapboard did not.",
        "ruined": "A sash is gone on the south row. Pigeons have the college brick.",
        "rebuilding": "New clapboard on the old sill. The walk was not moved.",
        "stewardship": "Someone shifted the iron gate and kept the birch.",
        "memorial": "A stone on the green. A ribbon on the iron. No name you can read.",
    },
    "vergennes_falls": {
        "tended": "The race is cleared. The wheel pad is swept.",
        "weathered": "The falls have not noticed the fourteen years. The mill has.",
        "ruined": "The sluice is open to the weather. The basin still takes the river.",
        "rebuilding": "Fresh boards on the mill door. The ledge was never replaced.",
        "stewardship": "A different hand closed one race and left the falls alone.",
        "memorial": "A ribbon on the millstone. The river does not wear one.",
    },
    "otter_marsh": {
        "tended": "The corduroy is solid. Someone replaced the broken board.",
        "weathered": "Black water, same posts. The walk gives a little underfoot.",
        "ruined": "A length of boardwalk is gone. The peat kept the shape of it.",
        "rebuilding": "New planks, paler than the old, across the break.",
        "stewardship": "The path was closed where it sank, and opened two boards east.",
        "memorial": "A pine start on the hummock. A wreath that the wet will take.",
    },
    "champlain_shore": {
        "tended": "The dock ladder is down. The shale is raked of last night's weed.",
        "weathered": "Drift has climbed the shelf. The camp still faces the lake.",
        "ruined": "The dock is two planks and a wish. The lake did not consult anyone.",
        "rebuilding": "A new ladder. The old pilings. That is the whole repair.",
        "stewardship": "The canoe was pulled up and turned. Someone means to come back.",
        "memorial": "A stone cairn above the drift line. The lake keeps its own dead.",
    },
    "ripton_woods": {
        "tended": "The trail is brushed. Duff, not mud, on the granite.",
        "weathered": "Needles fourteen years deep. The spruce do not count them.",
        "ruined": "A spruce came down across the path and nobody bucked it.",
        "rebuilding": "A fresh cut on the blowdown. Sawdust still pale on the duff.",
        "stewardship": "Blaze on a birch. The old trail is closed with brush.",
        "memorial": "A planted pine among the spruce, and a ribbon that does not belong to the woods.",
    },
    "lincoln_sugar": {
        "tended": "Buckets are hung. The sugarhouse door is propped with a stick.",
        "weathered": "Tubing is grey. October litter is doing what it always did.",
        "ruined": "The arch is cold and the stack leans. The maples are fine.",
        "rebuilding": "New stack, old arch. Cordwood ranked like a promise.",
        "stewardship": "A row of staked saplings where a maple came out.",
        "memorial": "A wreath on the sugarhouse. The season will go on without the name.",
    },
    "shoreham_orchard": {
        "tended": "Alleys are mown. The hives are weighted. Someone expects a crop.",
        "weathered": "The apples still set. The press yard is soft at the edges.",
        "ruined": "A row has died back to stumps. The alleys remember the spacing.",
        "rebuilding": "New whips in the gap. Crates stacked before there is fruit.",
        "stewardship": "One alley is closed. The bees were moved to the south row.",
        "memorial": "A stone at the end of the row. The trees were not told.",
    },
    "addison_intervale": {
        "tended": "Pasture is clipped. The milk stand faces the lane.",
        "weathered": "Stubble and mud. The barn roof is a brighter rust than the silo.",
        "ruined": "The intervale is still an intervale. The stanchions are not.",
        "rebuilding": "New metal on the barn. The house still wears the old shingle.",
        "stewardship": "The fence moved ten paces south. The cows will learn it.",
        "memorial": "A ribbon on the gate. The pasture does not keep names.",
    },
    "leicester_quarry": {
        "tended": "The rail is clear. Blocks are stacked, not spilled.",
        "weathered": "Dust on the cut face. The cart has not moved in a long time.",
        "ruined": "A length of rail is gone into the spoil. The face is still a face.",
        "rebuilding": "Chalk line on a new block. The derrick pad is swept.",
        "stewardship": "The spur was closed. A sapling row starts on the talus.",
        "memorial": "A plaque-sized stone against the face. No letters cut yet.",
    },
    "bristol_notch": {
        "tended": "The notch road is graded. Ferns are kept off the porch step.",
        "weathered": "Ruts hold yesterday's rain. The cliff has no opinion.",
        "ruined": "A porch board is through. The road still finds the gap.",
        "rebuilding": "Fresh porch board, unpainted. The ruts were left.",
        "stewardship": "A sign was turned. The old pull-off is brushed in.",
        "memorial": "A cairn at the cliff foot. Travelers add a stone or they don't.",
    },
    "weybridge_span": {
        "tended": "The deck is tight. Birch shade on the north approach.",
        "weathered": "The creek is in the same bed. The plank is silvered.",
        "ruined": "A truss bay is open sky. People still cross on the remaining deck.",
        "rebuilding": "New plank in one bay. The abutments were never in doubt.",
        "stewardship": "The downstream path is closed. The span is the way across.",
        "memorial": "A ribbon on the upstream birch. The creek takes ribbons.",
    },
    "monkton_ridge": {
        "tended": "Ridge grass is short. The windbreak was trimmed this year.",
        "weathered": "Thin soil, same wind. Paint lifts on the metal roof.",
        "ruined": "A spruce in the windbreak is a snag. The ridge is unchanged.",
        "rebuilding": "A new post in the rail. The hamlet stoop has fresh tread.",
        "stewardship": "Saplings staked where the windbreak failed.",
        "memorial": "A stone and a small pine on the ridge. The wind will have both.",
    },
}

INTERIORS = {
    "farmhouse_kitchen": (
        "Farmhouse kitchen",
        "The kettle is cold. The table is worn where forearms rested.",
    ),
    "sugarhouse": (
        "Sugarhouse",
        "Sweet steam is only a memory. The pan is scoured bright.",
    ),
    "general_store": (
        "General store",
        "The counter is clear. Tins are faced, as if someone still expects trade.",
    ),
    "mill_floor": (
        "Mill floor",
        "Grist dust in the cracks. The gear is still. The race is not.",
    ),
    "quarry_shed": (
        "Quarry shed",
        "A locker, a chalk line, a coat that is not yours.",
    ),
    "meetinghouse": (
        "Meetinghouse",
        "Pews face a wall with no text. The floorboards know the aisle.",
    ),
    "lake_camp": (
        "Camp",
        "A bunk, a dry sink, a window on whatever weather you left outside.",
    ),
    "dairy_barn": (
        "Dairy barn",
        "Stanchions stand empty. The aisle is swept down the middle.",
    ),
}

PROP_LINES = {
    "elm": "Elm. It was here before the walk was bluestone.",
    "paper_birch": "Paper birch. The bark peels whether anyone reads it or not.",
    "sugar_maple": "Sugar maple. The tap scar is older than the tubing.",
    "young_maple": "A young maple, staked, not yet asked for sap.",
    "red_spruce": "Red spruce. The dark under it is part of the tree.",
    "white_pine": "White pine. Soft needles, hard claim on the light.",
    "apple_tree": "Apple. The alley was mown for this row.",
    "cedar": "Cedar, planted as a windbreak and then left to mean it.",
    "bench": "The bench faces the open ground, not the road.",
    "lamp_post": "The lamp is dark. It was dark fourteen years ago, too.",
    "gravestone": "A stone. The name has gone soft.",
    "iron_gate": "Iron gate. It swings. It does not explain who it keeps.",
    "well": "The cover is on. Someone still cares who falls in.",
    "aster_clump": "Asters, late, as if the year had not been told.",
    "goldenrod": "Goldenrod along the unmown edge.",
    "millstone": "The stone is retired. It still weighs what it weighed.",
    "crate": "A crate, empty, left where a hand could find it.",
    "chimney_stack": "The stack draws. Or it would, if anyone lit the arch.",
    "split_rail_h": "Split rail. The line of it is the argument.",
    "boulder": "Granite, dropped here and then called a place.",
    "reeds": "Reeds. The wet ground announcing itself.",
    "cattails": "Cattails in the black edge of the water.",
    "lilypads": "Pads on water that does not reflect you.",
    "buoy": "A buoy, inland of where a buoy belongs.",
    "driftwood": "Drift, parked above the line of the last water.",
    "rowboat": "The boat is pulled up. Oars are not in it.",
    "canoe": "Canoe, turned. Someone means to come back, or meant to.",
    "dock_piling": "Piling. The dock is a rumor held up by this.",
    "fern": "Ferns in the shade the spruce made.",
    "mushrooms": "Mushrooms on the year the log came down.",
    "stump": "A stump, flat, still useful as a table.",
    "birch_log": "Birch down across the duff. A seat, if you want it.",
    "sap_bucket": "A bucket on a nail. The tree has not agreed to anything.",
    "sap_tank": "The gathering tank. Empty, and square in the leaves.",
    "cordwood": "Cordwood ranked and covered. A plan that survived.",
    "stone_wall_run": "Fieldstone, laid without mortar and without hurry.",
    "bushel": "A bushel basket, waiting on a crop.",
    "beehive": "The hive is weighted against weather.",
    "cider_barrel": "Cider barrel. The hoop is tight. The year is not in it.",
    "apple_crate": "Crates before there is fruit. Optimism, in pine.",
    "round_bale": "A round bale. The pasture's way of keeping summer.",
    "hay_bale": "Hay, squared. Easier to count than cattle.",
    "milk_can": "A milk can at the stand. No truck is coming.",
    "corn_shock": "Corn shock. October, tied up to look like work.",
    "pumpkins": "Pumpkins on the stubble. Unsold, or unsold on purpose.",
    "quarry_cart": "The cart sits on the rail as if the shift might resume.",
    "quarry_block": "A cut block. The face it came from is still in the hill.",
    "ladder": "A ladder against nothing in particular.",
    "signpost": "The sign is blank. The post still points at the road.",
    "fieldstone": "A stone lifted out of the field and then set down again.",
    "cairn": "A cairn. Add a stone or leave it. Both are allowed.",
    "wreath": "A wreath. The season will have it.",
    "ribbon_post": "A ribbon on a post. The name is not on the ribbon.",
    "staked_sapling": "A sapling, staked. Different hands than the ones that cut.",
    "scaffold": "Scaffold. The building is being asked to continue.",
    "tarp_bundle": "A tarp over something that can wait.",
    "wheelbarrow": "A barrow, nosed into the grass.",
    "outcrop": "Ledge showing through. The soil was always thin here.",
}


def roof_key(n, e, s, w):
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


def building_cells(b):
    cells = []
    x, y, w, h = b["x"], b["y"], b["w"], b["h"]
    door_at = None
    for ly in range(h):
        for lx in range(w):
            tx, ty = x + lx, y + ly
            if ly == h - 1:
                feat = "plain"
                if b.get("door", True) and lx == w // 2:
                    feat = "door"
                    door_at = (tx, ty)
                elif lx % 2 == 0:
                    feat = "win"
                tid = f"wall.{b['wall']}.{feat}"
            else:
                n = ly == 0
                s = ly == h - 2
                e = lx == w - 1
                ww = lx == 0
                tid = f"roof.{b['roof']}.{roof_key(n, e, s, ww)}"
            cells.append((tx, ty, tid))
    return cells, door_at


def interior_grid(kit):
    rw, rh = 12, 9
    cells = []
    for y in range(rh):
        for x in range(rw):
            if y == 0 and x == 0:
                key = "corner_nw"
            elif y == 0 and x == rw - 1:
                key = "corner_ne"
            elif y == rh - 1 and x == 0:
                key = "corner_sw"
            elif y == rh - 1 and x == rw - 1:
                key = "corner_se"
            elif y == 0:
                key = "wall_n"
            elif y == rh - 1:
                key = "wall_s_door" if x == rw // 2 else ("wall_s_win" if x % 3 == 0 else "wall_s")
            elif x == 0:
                key = "wall_w"
            elif x == rw - 1:
                key = "wall_e"
            elif x == rw // 2 and y == rh // 2:
                key = "feature_a"
            elif x == 3 and y == 4:
                key = "feature_b"
            elif x == 8 and y == 3:
                key = "rug"
            elif (x + y) % 5 == 0:
                key = "floor_worn"
            else:
                key = "floor"
            cells.append(f"interior.{kit}.{key}")
    return rw, rh, cells, (rw // 2, rh - 2), (rw // 2, rh - 1)


def covered(buildings):
    occ = set()
    for b in buildings:
        for ly in range(b["h"]):
            for lx in range(b["w"]):
                occ.add((b["x"] + lx, b["y"] + ly))
    return occ


def blocked_center(col, ox, oy):
    cx, cy = ox + 8, oy + 8
    for x, y, w, h in col:
        if x <= cx < x + w and y <= cy < y + h:
            return True
    return False


def walker_sheet():
    """16×24 figure, 8 frames: down, left, right, up × two steps. Palette only."""

    def frame(direction, step):
        im = blank(16, 24)
        bob = 1 if step else 0

        def coat(x0, x1, y0, y1):
            rect(im, x0, y0, x1 - x0 + 1, y1 - y0 + 1, PAL["shut"])
            rect(im, (x0 + x1) // 2, y0, 1, y1 - y0 + 1, PAL["trim"])

        def legs(pairs):
            for x, y0, y1 in pairs:
                rect(im, x, y0, 2, y1 - y0 + 1, PAL["d0"])
                rect(im, x, y1, 2, 2, PAL["ink"])

        if direction == "down":
            rect(im, 5, 5 + bob, 6, 3, PAL["sp0"])
            rect(im, 6, 8 + bob, 4, 3, PAL["cream"])
            pset(im, 6, 9 + bob, PAL["ink"])
            pset(im, 9, 9 + bob, PAL["ink"])
            coat(4, 11, 11 + bob, 17)
            rect(im, 3, 12 + bob, 2, 5, PAL["shut"])
            rect(im, 11, 12 + bob, 2, 5, PAL["shut"])
            pset(im, 3, 16 + bob, PAL["cream"])
            pset(im, 12, 16 + bob, PAL["cream"])
            if step:
                legs([(5, 18, 20), (9, 17, 21)])
            else:
                legs([(5, 18, 21), (9, 18, 20)])
        elif direction == "up":
            rect(im, 5, 5 + bob, 6, 3, PAL["sp0"])
            rect(im, 6, 8 + bob, 4, 2, PAL["cream"])
            coat(4, 11, 10 + bob, 17)
            rect(im, 3, 12 + bob, 2, 4, PAL["shut"])
            rect(im, 11, 12 + bob, 2, 4, PAL["shut"])
            if step:
                legs([(5, 18, 20), (9, 17, 21)])
            else:
                legs([(5, 18, 21), (9, 18, 20)])
        elif direction == "left":
            rect(im, 5, 5 + bob, 5, 3, PAL["sp0"])
            rect(im, 6, 8 + bob, 3, 3, PAL["cream"])
            pset(im, 6, 9 + bob, PAL["ink"])
            coat(5, 10, 11 + bob, 17)
            rect(im, 4, 12 + bob, 2, 5, PAL["shut"])
            pset(im, 4, 16 + bob, PAL["cream"])
            if step:
                legs([(6, 18, 20), (8, 17, 21)])
            else:
                legs([(6, 18, 21), (8, 18, 20)])
        else:
            rect(im, 6, 5 + bob, 5, 3, PAL["sp0"])
            rect(im, 7, 8 + bob, 3, 3, PAL["cream"])
            pset(im, 9, 9 + bob, PAL["ink"])
            coat(5, 10, 11 + bob, 17)
            rect(im, 10, 12 + bob, 2, 5, PAL["shut"])
            pset(im, 11, 16 + bob, PAL["cream"])
            if step:
                legs([(6, 17, 21), (8, 18, 20)])
            else:
                legs([(6, 18, 20), (8, 18, 21)])
        outline(im)
        return im

    order = ["down", "left", "right", "up"]
    sheet = blank(16 * 8, 24)
    for i, d in enumerate(order):
        for s in (0, 1):
            fr = frame(d, s)
            x0 = (i * 2 + s) * 16
            sheet[:, x0:x0 + 16] = fr
    return sheet


def main():
    tiles = json.loads((ROOT / "metadata" / "tiles.json").read_text())
    by_id = {t["id"]: t for t in tiles}
    used = []
    index = {}

    def use(tid):
        if tid not in by_id:
            raise SystemExit(f"missing tile {tid}")
        if tid not in index:
            index[tid] = len(used)
            used.append(tid)
        return index[tid]

    # Keep every era tile addressable.
    eras = {k: [] for k in ERA_ORDER}
    for t in tiles:
        if t.get("layer") == "era":
            eras[t["era"]].append(use(t["id"]))

    atlas_names = []
    atlas_index = {}

    def atlas_of(rec):
        name = Path(rec["atlas"]["atlas"]).name
        if name not in atlas_index:
            atlas_index[name] = len(atlas_names)
            atlas_names.append(name)
        return atlas_index[name]

    maps = []
    for fn in SCENES:
        scene = fn()
        ground = scene["ground"]
        occ = covered(scene["buildings"])
        gids = []
        water = []
        for y in range(H):
            for x in range(W):
                nw, ne, se, sw = corners_of(ground, x, y)
                v = variant_for((nw, ne, se, sw), x, y)
                tid = f"ground.{nw}.{ne}.{se}.{sw}.v{v}.f0"
                i = y * W + x
                gids.append(use(tid))
                if len({nw, ne, se, sw}) == 1 and nw == "water":
                    for f in range(4):
                        use(f"ground.water.water.water.water.v0.f{f}")
                    water.append(i)
        # Features replace the cell.
        for tx, ty, fid in scene.get("features", []):
            if 0 <= tx < W and 0 <= ty < H:
                gids[ty * W + tx] = use(fid)
                if ty * W + tx in water:
                    water.remove(ty * W + tx)

        structs = []
        doors = []
        door_map = DOORS.get(scene["id"], {})
        for bi, b in enumerate(scene["buildings"]):
            cells, door_at = building_cells(b)
            for tx, ty, tid in cells:
                structs.append([tx, ty, use(tid)])
            if door_at:
                doors.append({"x": door_at[0], "y": door_at[1], "kit": door_map.get(bi)})

        props = []
        prop_cells = set()
        for p in scene["props"]:
            tid = "prop." + p["id"]
            props.append([p["tx"], p["ty"], use(tid)])
            prop_cells.add((p["tx"], p["ty"]))

        era_at = []
        slot = 0
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                if ground[y][x] in HARD:
                    continue
                if (x, y) in occ:
                    continue
                if any(abs(x - px) + abs(y - py) <= 1 for px, py in prop_cells):
                    continue
                if (x * 3 + y * 5) % 9 != 0:
                    continue
                era_at.append([x, y, slot])
                slot += 1
                if slot >= 9:
                    break
            if slot >= 9:
                break
        # A decal on each open south wall, beside the door, so eras read on buildings.
        for b in scene["buildings"]:
            sy = b["y"] + b["h"] - 1
            for lx in (0, b["w"] - 1):
                tx = b["x"] + lx
                if 0 <= tx < W and 0 <= sy < H:
                    era_at.append([tx, sy, slot])
                    slot += 1

        sx, sy = SPAWNS[scene["id"]]
        maps.append({
            "id": scene["id"],
            "title": scene["title"],
            "blurb": scene["blurb"],
            "lines": LINES[scene["id"]],
            "w": W,
            "h": H,
            "spawn": [sx * TILE + 8, sy * TILE + 10],
            "groundMat": ground,  # stripped later after validation
            "ground": gids,
            "water": water,
            "structs": structs,
            "props": props,
            "doors": doors,
            "eraAt": era_at,
        })

    interiors = []
    for kit, (title, line) in INTERIORS.items():
        rw, rh, cells, spawn, exit_at = interior_grid(kit)
        interiors.append({
            "id": kit,
            "title": title,
            "line": line,
            "w": rw,
            "h": rh,
            "spawn": [spawn[0] * TILE + 8, spawn[1] * TILE + 8],
            "ground": [use(c) for c in cells],
            "exit": list(exit_at),
        })

    # Tile records in use-order. Atlas coords filled after we know atlas index,
    # so touch every used tile's atlas now.
    tile_recs = []
    for tid in used:
        rec = by_id[tid]
        a = rec.get("atlas")
        if not a:
            raise SystemExit(f"no atlas for {tid}")
        ai = atlas_of(rec)
        foot = rec.get("foot")
        sort = rec.get("sort_y")
        if sort is None:
            sort = (foot[1] + foot[3]) if foot else rec["h"]
        tile_recs.append({
            "id": tid,
            "a": ai,
            "x": a["x"],
            "y": a["y"],
            "w": rec["w"],
            "h": rec["h"],
            "col": rec.get("collision") or [],
            "sort": sort,
        })

    # Validate spawns against collision.
    def rects_for(tile_i, ox, oy):
        out = []
        for x, y, w, h in tile_recs[tile_i]["col"]:
            out.append((ox + x, oy + y, w, h))
        return out

    for m in maps:
        world_rects = []
        gw, gh = m["w"], m["h"]
        for i, tid in enumerate(m["ground"]):
            tx, ty = i % gw, i // gw
            world_rects.extend(rects_for(tid, tx * TILE, ty * TILE))
        for tx, ty, tid in m["structs"]:
            world_rects.extend(rects_for(tid, tx * TILE, ty * TILE))
        for tx, ty, tid in m["props"]:
            world_rects.extend(rects_for(tid, tx * TILE, ty * TILE))
        px, py = m["spawn"]
        hit = False
        for x, y, w, h in world_rects:
            if x <= px < x + w and y - 3 <= py < y + h:
                hit = True
                break
        mat = m["groundMat"][py // TILE][px // TILE]
        if hit:
            raise SystemExit(f"spawn blocked in {m['id']} at {px,py} mat {mat}")
        print(f"{m['id']:22} spawn {px:4},{py:4}  {mat:10} doors {len(m['doors']):2} era {len(m['eraAt']):2}")
        del m["groundMat"]

    palette = []
    for name, rgb in PAL.items():
        nr, ng, nb = NIGHT[name]
        palette.append([rgb[0], rgb[1], rgb[2], nr, ng, nb])

    # prop whisper keys by full tile id
    whispers = {f"prop.{k}": v for k, v in PROP_LINES.items() if f"prop.{k}" in index}

    world = {
        "atlases": atlas_names,
        "palette": palette,
        "tiles": tile_recs,
        "eras": eras,
        "eraOrder": ERA_ORDER,
        "maps": maps,
        "interiors": interiors,
        "whispers": whispers,
    }

    PUBLIC.mkdir(parents=True, exist_ok=True)
    atlas_dir = PUBLIC / "atlases"
    if atlas_dir.exists():
        shutil.rmtree(atlas_dir)
    atlas_dir.mkdir()
    for name in atlas_names:
        shutil.copy(ROOT / "atlases" / name, atlas_dir / name)

    sheet = walker_sheet()
    # palette check
    from lib import assert_palette
    assert_palette(sheet, "walker")
    save_png(__import__("lib").to_image(sheet), PUBLIC / "walker.png")

    (PUBLIC / "world.json").write_text(json.dumps(world, separators=(",", ":")))
    print(f"tiles {len(tile_recs)} atlases {len(atlas_names)} bytes {(PUBLIC/'world.json').stat().st_size}")


if __name__ == "__main__":
    main()
