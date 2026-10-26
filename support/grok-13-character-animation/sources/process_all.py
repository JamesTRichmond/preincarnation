#!/usr/bin/env python3
"""Chroma-key and slice generated sheets into engine cells. Art is not drawn here."""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path("/workspace/support/grok-13-character-animation")
ART = Path("/workspace/artifacts/imagine_images")
SCRIPT = Path("/workspace/.grok/skills/generate2dsprite/scripts/generate2dsprite.py")

# JPEG magenta sits off pure #FF00FF. Hero sheets ~distance 80; NPC sheets ~150.
HERO = {"threshold": 120, "edge_threshold": 155}
NPC = {"threshold": 175, "edge_threshold": 200}
PORT = {"threshold": 150, "edge_threshold": 185}

FORMS = {
    "mortal-wanderer": {
        "base": "0ee7b2df-c161-477d-8633-d186dd9d8a8d.jpg",
        "actions": {
            "idle": "408e253d-4bc1-4477-acce-2bbaadb0798a.jpg",
            "walk": "4e29be84-a50e-4c27-8ce1-c48f953b6f81.jpg",
            "attack": "7ca000a1-ac2d-4402-abce-51cab395a587.jpg",
            "charge": "b3b2da22-9083-436a-81e4-6bda52d18f6d.jpg",
            "hurt": "33c6f35f-f5ab-4af1-b2b2-dcd3e63c1fc0.jpg",
            "interact": "42767ffd-c793-402c-8890-c4cb2963f3df.jpg",
            "death": "891849e3-8cb1-44b7-960b-7c8db03cd802.jpg",
            "reincarnate": "70e4cb53-d2bf-4b27-ae36-3448353e8f43.jpg",
            "tool": "74affd5c-5758-4b7a-b5c2-4b26b2965e19.jpg",
        },
    },
    "otter-creek-smuggler": {
        "base": "21fddc43-bc84-4d09-bcc2-8eabd97780b2.jpg",
        "actions": {
            "idle": "3dc2f71e-22fd-4c91-acf1-1771f32decd2.jpg",
            "walk": "e09421c4-8f43-4c50-91a7-79ab6b082eb9.jpg",
            "attack": "8e1524d9-6b5c-4d87-8dcd-af2f113b24e9.jpg",
            "charge": "af8e014e-797a-4999-ac17-f64d24a36a35.jpg",
            "hurt": "619d6bf4-5e06-4d24-90d2-e4ca1da3435c.jpg",
            "interact": "59817a40-4195-482f-9518-0c34995ba419.jpg",
            "death": "f286cc99-2f67-4a48-a16f-76a7867cfe3f.jpg",
            "reincarnate": "5b6b3f13-8397-41b1-9017-614b7217f6a7.jpg",
            "tool": "e60527e3-de8a-44ea-af38-78a491fbe42c.jpg",
        },
    },
    "rutland-officer": {
        "base": "9fac5d5e-0fb1-488c-9d25-90d5e66602e4.jpg",
        "actions": {
            "idle": "51adf0b2-e759-47ac-82d9-4107436afd59.jpg",
            "walk": "66dfc8c3-1a4f-4ec4-87e9-364048bd60ae.jpg",
            "attack": "3f0d5b80-e104-4d20-9f9f-1bb47ffd41e6.jpg",
            "charge": "ec1674fa-6717-44c2-abbb-b576e6f6ddea.jpg",
            "hurt": "04bccd02-da70-49ef-ac87-73b3c8a193d3.jpg",
            "interact": "82d8f501-5769-4440-819f-21eb633c5670.jpg",
            "death": "bcd504eb-29b1-4a24-b39d-77efa949ccf0.jpg",
            "reincarnate": "9f24cd33-122e-484b-abd8-a0a9ab68d742.jpg",
            "tool": "02fdc3ec-d591-40b2-b210-e243224f47fe.jpg",
        },
    },
    "embryonic-god": {
        "base": "4d95c552-0883-45cf-8683-cedc8cd7cb74.jpg",
        "actions": {
            "idle": "d6a704c4-3288-47ac-89dc-2fdeb367a118.jpg",
            "walk": "87c07a10-f3d8-4eee-aa1e-6af430b94d49.jpg",
            "attack": "53ec2b15-da53-4d43-b29e-616430652649.jpg",
            "charge": "4d11eafb-1878-44b0-866d-00d27e521469.jpg",
            "hurt": "201e82e3-61dd-479c-a01e-cc55741e55bd.jpg",
            "interact": "fee2f0d0-2287-4fbe-b299-b4b20540cbc4.jpg",
            "death": "e2cf153a-8d85-477b-ab5d-b44a30d545e5.jpg",
            "reincarnate": "d4de07ce-6e97-4761-adf9-bb0a96f3c24e.jpg",
            "tool": "e78d5f17-8bfe-4848-803a-cd6413b2d722.jpg",
        },
    },
}

ALL_COMPONENT = {"attack", "tool", "reincarnate", "interact", "charge"}


def grid_for(name: str, path: Path) -> tuple[int, int, str]:
    from PIL import Image

    with Image.open(path) as im:
        w, h = im.size
    if name == "reincarnate" or (w / h) > 1.35:
        return 2, 4, "center"
    return 4, 4, "feet"


def run(src: Path, out: Path, mode: str, rows: int, cols: int, align: str, component: str, key: dict, cell: int, prefix: str) -> None:
    if (out / "sheet-transparent.png").exists() and (out / "pipeline-meta.json").exists():
        print("SKIP", prefix, out, flush=True)
        return
    out.mkdir(parents=True, exist_ok=True)
    cmd = [
        "python3",
        str(SCRIPT),
        "process",
        "--input",
        str(src),
        "--target",
        "player",
        "--mode",
        mode,
        "--rows",
        str(rows),
        "--cols",
        str(cols),
        "--output-dir",
        str(out),
        "--shared-scale",
        "--align",
        align,
        "--component-mode",
        component,
        "--cell-size",
        str(cell),
        "--fit-scale",
        "0.80",
        "--threshold",
        str(key["threshold"]),
        "--edge-threshold",
        str(key["edge_threshold"]),
        "--label-prefix",
        prefix,
    ]
    print("PROCESS", prefix, rows, cols, flush=True)
    subprocess.check_call(cmd)


def main() -> None:
    raw_root = ROOT / "sources" / "raw"
    raw_root.mkdir(parents=True, exist_ok=True)
    for form, spec in FORMS.items():
        base_src = ART / spec["base"]
        shutil.copy(base_src, raw_root / f"{form}-base.jpg")
        run(
            base_src,
            ROOT / "forms" / form / "base",
            "idle",
            1,
            1,
            "feet",
            "largest",
            HERO,
            96,
            "base",
        )
        for action, fname in spec["actions"].items():
            src = ART / fname
            shutil.copy(src, raw_root / f"{form}-{action}.jpg")
            rows, cols, align = grid_for(action, src)
            if action == "reincarnate":
                align = "center"
            component = "all" if action in ALL_COMPONENT else "largest"
            run(
                src,
                ROOT / "forms" / form / action,
                "walk" if action == "walk" else "idle",
                rows,
                cols,
                align,
                component,
                HERO,
                96,
                action,
            )

    extras = [
        ("npcs/bodies", "288ba1b1-86da-490c-9127-c78c4ba3d5ea.jpg", 4, 3, "feet", "largest", NPC, 96, "npc"),
        ("npcs/stride", "e276f676-e3da-4782-9334-a9a413a25868.jpg", 4, 3, "feet", "largest", NPC, 96, "stride"),
        ("npcs/walk-child", "6bf887b7-3aa0-4bcf-b69a-191b77e69ce3.jpg", 4, 4, "feet", "largest", HERO, 96, "walk"),
        ("npcs/walk-farmer", "691585f7-6d80-442d-a49d-488d3c68562b.jpg", 4, 4, "feet", "largest", HERO, 96, "walk"),
        ("npcs/walk-elder", "66bf12d2-04ec-466a-af5a-7e58234956a0.jpg", 4, 4, "feet", "largest", HERO, 96, "walk"),
        ("portraits/older", "5dc75894-40ff-47bb-ab4d-f7e134ef17f4.jpg", 4, 3, "center", "largest", PORT, 128, "portrait"),
        ("portraits/younger", "74db7d4d-2259-447c-8783-68a37836886e.jpg", 4, 3, "center", "largest", PORT, 128, "portrait"),
        ("fx/blade-arc", "f91cd55d-1571-4e54-b10e-63b070763a54.jpg", 4, 4, "center", "all", HERO, 96, "arc"),
    ]
    env = {
        "otter-creek": "0c63e186-6040-4723-9567-b6be00791c3c.jpg",
        "rutland-street": "019275cf-10bc-485e-80da-f21859f41797.jpg",
        "void-water": "2101cf7a-1a09-47e4-b9d0-77594f8f0e9e.jpg",
    }
    env_dir = ROOT / "environments"
    env_dir.mkdir(parents=True, exist_ok=True)
    for name, fname in env.items():
        shutil.copy(ART / fname, env_dir / f"{name}.jpg")
    for rel, fname, rows, cols, align, component, key, cell, prefix in extras:
        src = ART / fname
        shutil.copy(src, raw_root / f"{rel.replace('/', '-')}.jpg")
        run(src, ROOT / rel, "idle", rows, cols, align, component, key, cell, prefix)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
