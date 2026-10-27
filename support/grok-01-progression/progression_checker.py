#!/usr/bin/env python3
"""PREINCARNATION progression checker.

Proposed reference model only. Core game files were not in this workspace.
This program does not verify a runtime build.

Commands:
  python3 progression_checker.py prove
  python3 progression_checker.py check [model.json]
  python3 progression_checker.py explore [model.json]
"""

from __future__ import annotations

import copy
import json
import sys
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASELINE_PATH = ROOT / "progression.json"
FIXTURE_DIR = ROOT / "fixtures"

AUTHORED_PRINCIPAL = [0, 14, 28, 42, 56, 70]
ALL_ERAS = [0, 14, 28, 42, 56, 70, "post"]

TEN = [
    "tool_self_lock",
    "key_consumed_before_mandatory_use",
    "essential_npc_no_successor",
    "death_erases_required_flag",
    "form_change_strands_player",
    "ending_mutually_exclusive_states",
    "optional_choice_blocks_main",
    "warp_bypasses_mandatory",
    "boss_reentry_duplicates_rewards",
    "years_beyond_principal_eras",
]

TOOL_IDS = [
    "grave-shovel",
    "sugar-line-hookshot",
    "gap-boots",
    "creek-fins",
    "oil-lamp",
    "marble-hammer",
    "bug-net",
    "homestead-glass",
    "shadow-cape",
    "block-rod",
    "ash-bow",
    "powder-kegs",
]


def V(code: str, subject: str, detail: str) -> dict:
    return {"code": code, "subject": subject, "detail": detail}


def build_baseline() -> dict:
    """Author the proposed reference model. Pure data: no solver fields."""
    locations = [
        {"id": "middlebury-green", "kind": "district", "name": "Middlebury Green",
         "blurb": "County seat. Graves, green, and mill bank. Ellis's respawn."},
        {"id": "otter-creek-narrows", "kind": "district", "name": "Otter Creek Narrows",
         "blurb": "Creek bank north of Middlebury. Ground; the channel is separate."},
        {"id": "vergennes-falls", "kind": "district", "name": "Vergennes Falls",
         "blurb": "The only city in Addison County. City hall and the falls."},
        {"id": "cornwall-flats", "kind": "district", "name": "Cornwall Flats",
         "blurb": "Farmsteads and sugarhouses between Middlebury and Shoreham."},
        {"id": "bristol-notch", "kind": "district", "name": "Bristol Notch",
         "blurb": "Bristol village and the notch road toward Lincoln."},
        {"id": "ferrisburgh-shore", "kind": "district", "name": "Ferrisburgh Shore",
         "blurb": "Champlain shore in Ferrisburgh. Fins are cached on dry ground."},
        {"id": "shoreham-slate", "kind": "district", "name": "Shoreham Slate",
         "blurb": "Southern slate cuts and the powder magazine seal."},
        {"id": "orwell-marshes", "kind": "district", "name": "Orwell Marshes",
         "blurb": "Orwell wetlands. Stays inside Vermont; Crown Point is not entered."},
        {"id": "ripton-heights", "kind": "district", "name": "Ripton Heights",
         "blurb": "High roads above Ripton. Fictional homesteads only."},
        {"id": "lincoln-gap", "kind": "district", "name": "Lincoln Gap",
         "blurb": "Lincoln and the gap. Ash bow and the ridge shrine approach."},
        {"id": "monkton-ridge", "kind": "district", "name": "Monkton Ridge",
         "blurb": "Monkton ridge. Lamp is in the lit mouth; the catacomb is dark."},
        {"id": "weybridge-marble", "kind": "district", "name": "Weybridge Marble",
         "blurb": "Weybridge creek cuts. Marble works are a geographic compression."},
        {"id": "grave-crypt", "kind": "room", "name": "Grave Crypt Mouth", "dungeon": "grave-crypt"},
        {"id": "grave-crypt-heart", "kind": "room", "name": "Grave Crypt Heart", "dungeon": "grave-crypt"},
        {"id": "creek-channel", "kind": "crossing", "name": "Creek Channel"},
        {"id": "creek-depths", "kind": "room", "name": "Creek Crown Depths", "dungeon": "creek-crown-depths"},
        {"id": "lake-cut", "kind": "crossing", "name": "Lake Cut"},
        {"id": "hook-span", "kind": "crossing", "name": "Sugar-Line Span"},
        {"id": "glass-loft", "kind": "room", "name": "Homestead Glass Loft", "dungeon": "glasshouse"},
        {"id": "notch-span", "kind": "room", "name": "Notch Gallery", "dungeon": "notch-gallery"},
        {"id": "ridge-shrine", "kind": "room", "name": "Ridge Shrine", "dungeon": "ridge-shrine"},
        {"id": "void-margin", "kind": "crossing", "name": "Void Margin"},
        {"id": "void-terminal", "kind": "room", "name": "Void Crossing", "dungeon": "void-terminal"},
        {"id": "cave-dark", "kind": "room", "name": "Monkton Catacomb", "dungeon": "lamp-catacombs"},
        {"id": "mayoral-archive", "kind": "room", "name": "Mayoral Archive", "dungeon": "mayoral-archive"},
    ]

    def link(i, a, b, terrain, tools=None, flags=None, crowns=None):
        return {
            "id": i, "a": a, "b": b, "terrain": terrain, "directed": False, "is_warp": False,
            "requires_tools": tools or [], "requires_flags": flags or [], "requires_crowns": crowns or [],
            "requires_forms": [],
        }

    edges = [
        link("mg-gc", "middlebury-green", "grave-crypt", "ground"),
        link("gc-heart", "grave-crypt", "grave-crypt-heart", "ground", ["grave-shovel"]),
        link("mg-oc", "middlebury-green", "otter-creek-narrows", "ground"),
        link("mg-vf", "middlebury-green", "vergennes-falls", "ground"),
        link("mg-cf", "middlebury-green", "cornwall-flats", "ground"),
        link("mg-bn", "middlebury-green", "bristol-notch", "ground"),
        link("cf-wm", "cornwall-flats", "weybridge-marble", "ground"),
        link("cf-ss", "cornwall-flats", "shoreham-slate", "ground"),
        link("ss-om", "shoreham-slate", "orwell-marshes", "ground"),
        link("vf-fs", "vergennes-falls", "ferrisburgh-shore", "ground"),
        link("vf-mr", "vergennes-falls", "monkton-ridge", "ground"),
        link("oc-cc", "otter-creek-narrows", "creek-channel", "creek"),
        link("cc-cd", "creek-channel", "creek-depths", "creek", ["oil-lamp"]),
        link("fs-lc", "ferrisburgh-shore", "lake-cut", "lake"),
        link("cf-hs", "cornwall-flats", "hook-span", "hook"),
        link("hs-gl", "hook-span", "glass-loft", "ground"),
        link("bn-ns", "bristol-notch", "notch-span", "hook"),
        link("ns-lg", "notch-span", "lincoln-gap", "gap"),
        link("lg-rh", "lincoln-gap", "ripton-heights", "ground"),
        link("lg-rs", "lincoln-gap", "ridge-shrine", "ground", ["ash-bow"]),
        link("lg-vm", "lincoln-gap", "void-margin", "void"),
        link("vm-vt", "void-margin", "void-terminal", "void", list(TOOL_IDS),
             ["mayor-spoken", "archive-read", "crypt-cleared", "catacomb-cleared"],
             ["crown-of-the-creek", "crown-of-the-ridge"]),
        link("mr-dark", "monkton-ridge", "cave-dark", "dark"),
        link("vf-arc", "vergennes-falls", "mayoral-archive", "ground", ["block-rod"], ["mayor-spoken"]),
        {
            "id": "glass-recall", "a": "*", "b": "middlebury-green", "terrain": "ground",
            "directed": True, "is_warp": True, "requires_tools": ["homestead-glass"],
            "requires_flags": [], "requires_crowns": [], "requires_forms": [],
            "grants_completion": False,
            "notes": "Return home after the glass is earned. Destination is the start hub.",
        },
    ]

    tools = [
        {"id": "grave-shovel", "name": "grave shovel", "found_at": "grave-crypt",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "sugar-line-hookshot", "name": "sugar-line hookshot", "found_at": "cornwall-flats",
         "requires_tools": ["grave-shovel"], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "gap-boots", "name": "gap boots", "found_at": "notch-span",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "creek-fins", "name": "creek fins", "found_at": "ferrisburgh-shore",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "oil-lamp", "name": "oil lamp", "found_at": "monkton-ridge",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "marble-hammer", "name": "marble hammer", "found_at": "weybridge-marble",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "bug-net", "name": "bug net", "found_at": "orwell-marshes",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "homestead-glass", "name": "homestead glass", "found_at": "glass-loft",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "shadow-cape", "name": "shadow cape", "found_at": "ripton-heights",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "block-rod", "name": "block rod", "found_at": "vergennes-falls",
         "requires_tools": [], "requires_flags": ["mayor-spoken"], "requires_crowns": [], "required_for_main": True},
        {"id": "ash-bow", "name": "ash bow", "found_at": "lincoln-gap",
         "requires_tools": [], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
        {"id": "powder-kegs", "name": "powder kegs", "found_at": "shoreham-slate",
         "requires_tools": ["marble-hammer"], "requires_flags": [], "requires_crowns": [], "required_for_main": True},
    ]

    crowns = [
        {"id": "crown-of-the-creek", "name": "Crown of the Creek", "found_at": "creek-depths",
         "requires_tools": ["oil-lamp"], "requires_flags": [], "boss": "creek-warden"},
        {"id": "crown-of-the-ridge", "name": "Crown of the Ridge", "found_at": "ridge-shrine",
         "requires_tools": ["ash-bow"], "requires_flags": [], "boss": "ridge-warden",
         "transforms_into": "embryonic-god",
         "notes": "Claiming this crown transforms Ellis in place. It is not behind void."},
    ]

    forms = [
        {"id": "mortal-wanderer", "name": "Mortal Wanderer", "movement": ["ground"],
         "irreversible": False, "entry_locations": ["middlebury-green"],
         "respawn": "middlebury-green", "obligations": ["vergennes-falls"],
         "unlock": {"deaths_min": 0, "crowns_min": 0, "flags": []},
         "notes": "Initial body. Exists only in year 0. The first death replaces it."},
        {"id": "otter-creek-smuggler", "name": "Otter Creek Smuggler", "movement": ["ground", "water"],
         "irreversible": False, "entry_locations": ["middlebury-green"],
         "respawn": "middlebury-green", "obligations": ["vergennes-falls", "creek-channel"],
         "unlock": {"deaths_min": 1, "flags": []},
         "notes": "Default body after a death while fewer than two crowns are held."},
        {"id": "rutland-officer", "name": "Rutland Officer", "movement": ["ground"],
         "irreversible": False, "entry_locations": ["middlebury-green"],
         "respawn": "middlebury-green", "obligations": ["vergennes-falls"],
         "unlock": {"deaths_min": 1, "flags": ["mayor-spoken"]},
         "notes": "Alternative body after one death if mayor-spoken persists. Same life cannot also be the smuggler."},
        {"id": "embryonic-god", "name": "Embryonic God", "movement": ["ground", "water", "void"],
         "irreversible": True, "entry_locations": ["ridge-shrine", "middlebury-green"],
         "respawn": "middlebury-green", "obligations": ["middlebury-green", "void-terminal"],
         "unlock": {"crowns": ["crown-of-the-creek", "crown-of-the-ridge"], "deaths_min": 0},
         "notes": "Immediate transform at the ridge shrine once both crowns are held. Keeps ground so the shrine exit works. Water and void are added. deaths_min 0 is an explicit reading of Crowns/cycles; see contradictions."},
    ]

    npcs = [
        {"id": "mayor-hester-lane", "name": "Mayor Hester Lane", "role": "Mayor of Vergennes",
         "location": "vergennes-falls", "essential": True, "grants_flags": ["mayor-spoken"],
         "alive_eras": [0, 14], "dies_when": ["enter-year-28"], "successors": ["clerk-ida-ross"]},
        {"id": "clerk-ida-ross", "name": "Clerk Ida Ross", "role": "City clerk, successor speaker",
         "location": "vergennes-falls", "essential": True, "grants_flags": ["mayor-spoken"],
         "alive_eras": [28, 42, 56, 70, "post"], "dies_when": [], "successors": []},
        {"id": "heron-keeper-moss", "name": "Moss Ell", "role": "Marsh watcher",
         "location": "orwell-marshes", "essential": False, "grants_flags": ["heron-spared"],
         "alive_eras": [0, 14, 28], "dies_when": ["enter-year-42"], "successors": []},
    ]

    quest_flags = [
        {"id": "mayor-spoken", "required_for_main": True, "persists_on_death": True},
        {"id": "archive-read", "required_for_main": True, "persists_on_death": True},
        {"id": "void-crossed", "required_for_main": True, "persists_on_death": True},
        {"id": "crypt-cleared", "required_for_main": True, "persists_on_death": True},
        {"id": "catacomb-cleared", "required_for_main": True, "persists_on_death": True},
        {"id": "heron-spared", "required_for_main": False, "persists_on_death": True},
        {"id": "scent-of-smoke", "required_for_main": False, "persists_on_death": False},
        {"id": "refused-ridge-crown", "required_for_main": False, "persists_on_death": True},
    ]

    flag_sources = [
        {"flag": "crypt-cleared", "at": "grave-crypt-heart", "requires_tools": ["grave-shovel"],
         "requires_flags": [], "requires_crowns": []},
        {"flag": "catacomb-cleared", "at": "cave-dark", "requires_tools": ["oil-lamp"],
         "requires_flags": [], "requires_crowns": []},
        {"flag": "archive-read", "at": "mayoral-archive", "requires_tools": ["block-rod"],
         "requires_flags": ["mayor-spoken"], "requires_crowns": []},
        {"flag": "void-crossed", "at": "void-terminal", "requires_tools": [],
         "requires_flags": [], "requires_crowns": [], "requires_form": "embryonic-god"},
    ]

    keys = [
        {"id": "crypt-iron-key", "copies": 1, "consumed_when_used": True,
         "uses": [{"id": "warden-door", "mandatory": True, "order": 1, "can_precede_mandatory": False}]},
        {"id": "glass-latch", "copies": 1, "consumed_when_used": False,
         "uses": [
             {"id": "loft-door", "mandatory": True, "order": 1, "can_precede_mandatory": False},
             {"id": "cellar-door", "mandatory": True, "order": 2, "can_precede_mandatory": False},
         ]},
        {"id": "marsh-reed-key", "copies": 1, "consumed_when_used": True,
         "uses": [{"id": "marsh-queen-door", "mandatory": True, "order": 1, "can_precede_mandatory": False}]},
    ]

    def boss(i, dungeon, location, reward):
        return {
            "id": i, "dungeon": dungeon, "location": location, "reward": reward,
            "reward_unique": True, "reentry_allowed": True, "reentry_grants_reward": False,
        }

    bosses = [
        boss("crypt-warden", "grave-crypt", "grave-crypt-heart", "crypt-cleared"),
        boss("sugar-warden", "sugarhouse", "cornwall-flats", "sugar-line-hookshot"),
        boss("notch-warden", "notch-gallery", "notch-span", "gap-boots"),
        boss("fin-warden", "fin-shack", "ferrisburgh-shore", "creek-fins"),
        boss("catacomb-warden", "lamp-catacombs", "cave-dark", "catacomb-cleared"),
        boss("hammer-warden", "hammer-cut", "weybridge-marble", "marble-hammer"),
        boss("marsh-queen", "marsh-vault", "orwell-marshes", "bug-net"),
        boss("glass-warden", "glasshouse", "glass-loft", "homestead-glass"),
        boss("cape-warden", "cape-loft", "ripton-heights", "shadow-cape"),
        boss("foundry-warden", "foundry", "vergennes-falls", "block-rod"),
        boss("ash-warden", "ash-range", "lincoln-gap", "ash-bow"),
        boss("powder-warden", "powder-magazine", "shoreham-slate", "powder-kegs"),
        boss("creek-warden", "creek-crown-depths", "creek-depths", "crown-of-the-creek"),
        boss("ridge-warden", "ridge-shrine", "ridge-shrine", "crown-of-the-ridge"),
        boss("archive-keeper", "mayoral-archive", "mayoral-archive", "archive-read"),
        boss("void-pilot", "void-terminal", "void-terminal", "void-crossed"),
    ]

    dungeons = [
        {"id": "grave-crypt", "name": "Middlebury Grave Crypt", "district": "middlebury-green",
         "solver_node": "grave-crypt", "required_for_main": True,
         "internal_unlocks": [
             {"id": "shovel-cairn", "kind": "pickup", "grants": "grave-shovel", "requires_tools": [], "requires_keys": []},
             {"id": "iron-cache", "kind": "pickup", "grants": "crypt-iron-key", "requires_tools": ["grave-shovel"], "requires_keys": []},
             {"id": "warden-door", "kind": "door", "requires_keys": ["crypt-iron-key"], "consumes_key": True, "mandatory": True, "requires_tools": ["grave-shovel"]},
             {"id": "crypt-warden", "kind": "boss", "boss_id": "crypt-warden"},
         ]},
        {"id": "sugarhouse", "name": "Cornwall Sugarhouse", "district": "cornwall-flats",
         "solver_node": "cornwall-flats", "required_for_main": True,
         "internal_unlocks": [
             {"id": "dig-cache", "kind": "pickup", "grants": "sugar-line-hookshot", "requires_tools": ["grave-shovel"], "requires_keys": []},
         ]},
        {"id": "notch-gallery", "name": "Notch Gap Gallery", "district": "bristol-notch",
         "solver_node": "notch-span", "required_for_main": True,
         "internal_unlocks": [
             {"id": "boot-peg", "kind": "pickup", "grants": "gap-boots", "requires_tools": [], "requires_keys": []},
         ]},
        {"id": "fin-shack", "name": "Ferrisburgh Fin Shack", "district": "ferrisburgh-shore",
         "solver_node": "ferrisburgh-shore", "required_for_main": True,
         "internal_unlocks": [
             {"id": "fin-rack", "kind": "pickup", "grants": "creek-fins", "requires_tools": [], "requires_keys": []},
         ]},
        {"id": "lamp-catacombs", "name": "Monkton Lamp Catacombs", "district": "monkton-ridge",
         "solver_node": "monkton-ridge", "required_for_main": True,
         "internal_unlocks": [
             {"id": "lamp-alcove", "kind": "pickup", "grants": "oil-lamp", "requires_tools": [], "requires_keys": []},
             {"id": "catacomb-warden", "kind": "boss", "boss_id": "catacomb-warden", "requires_tools": ["oil-lamp"]},
         ]},
        {"id": "hammer-cut", "name": "Weybridge Hammer Cut", "district": "weybridge-marble",
         "solver_node": "weybridge-marble", "required_for_main": True,
         "internal_unlocks": [
             {"id": "hammer-floor", "kind": "pickup", "grants": "marble-hammer", "requires_tools": [], "requires_keys": []},
         ]},
        {"id": "marsh-vault", "name": "Orwell Marsh Vault", "district": "orwell-marshes",
         "solver_node": "orwell-marshes", "required_for_main": True,
         "internal_unlocks": [
             {"id": "net-hook", "kind": "pickup", "grants": "bug-net", "requires_tools": [], "requires_keys": []},
             {"id": "marsh-queen-door", "kind": "door", "requires_keys": ["marsh-reed-key"], "consumes_key": True, "mandatory": True, "requires_tools": ["bug-net"]},
         ]},
        {"id": "glasshouse", "name": "Cornwall Glasshouse", "district": "cornwall-flats",
         "solver_node": "glass-loft", "required_for_main": True,
         "internal_unlocks": [
             {"id": "glass-case", "kind": "pickup", "grants": "homestead-glass", "requires_tools": [], "requires_keys": []},
             {"id": "loft-door", "kind": "door", "requires_keys": ["glass-latch"], "consumes_key": False, "mandatory": True},
             {"id": "cellar-door", "kind": "door", "requires_keys": ["glass-latch"], "consumes_key": False, "mandatory": True},
         ]},
        {"id": "cape-loft", "name": "Ripton Cape Loft", "district": "ripton-heights",
         "solver_node": "ripton-heights", "required_for_main": True,
         "internal_unlocks": [
             {"id": "cape-rail", "kind": "pickup", "grants": "shadow-cape", "requires_tools": [], "requires_keys": []},
         ]},
        {"id": "foundry", "name": "Vergennes Foundry", "district": "vergennes-falls",
         "solver_node": "vergennes-falls", "required_for_main": True,
         "internal_unlocks": [
             {"id": "rod-rack", "kind": "pickup", "grants": "block-rod", "requires_tools": [], "requires_flags": ["mayor-spoken"], "requires_keys": []},
         ]},
        {"id": "ash-range", "name": "Lincoln Ash Range", "district": "lincoln-gap",
         "solver_node": "lincoln-gap", "required_for_main": True,
         "internal_unlocks": [
             {"id": "bow-stand", "kind": "pickup", "grants": "ash-bow", "requires_tools": [], "requires_keys": []},
         ]},
        {"id": "powder-magazine", "name": "Shoreham Powder Magazine", "district": "shoreham-slate",
         "solver_node": "shoreham-slate", "required_for_main": True,
         "internal_unlocks": [
             {"id": "magazine-seal", "kind": "door", "requires_tools": ["marble-hammer"], "requires_keys": [], "mandatory": True},
             {"id": "keg-crib", "kind": "pickup", "grants": "powder-kegs", "requires_tools": ["marble-hammer"], "requires_keys": []},
         ]},
        {"id": "creek-crown-depths", "name": "Otter Crown Depths", "district": "otter-creek-narrows",
         "solver_node": "creek-depths", "required_for_main": True,
         "internal_unlocks": [
             {"id": "creek-warden", "kind": "boss", "boss_id": "creek-warden", "requires_tools": ["oil-lamp"]},
         ]},
        {"id": "ridge-shrine", "name": "Lincoln Ridge Shrine", "district": "lincoln-gap",
         "solver_node": "ridge-shrine", "required_for_main": True,
         "internal_unlocks": [
             {"id": "ridge-warden", "kind": "boss", "boss_id": "ridge-warden", "requires_tools": ["ash-bow"]},
         ]},
        {"id": "mayoral-archive", "name": "Mayor's Archive", "district": "vergennes-falls",
         "solver_node": "mayoral-archive", "required_for_main": True,
         "internal_unlocks": [
             {"id": "archive-stack", "kind": "door", "requires_tools": ["block-rod"], "requires_flags": ["mayor-spoken"], "mandatory": True},
         ]},
        {"id": "void-terminal", "name": "Void Crossing Terminal", "district": "lincoln-gap",
         "solver_node": "void-terminal", "required_for_main": True,
         "internal_unlocks": [
             {"id": "void-seal", "kind": "door", "requires_tools": list(TOOL_IDS),
              "requires_crowns": ["crown-of-the-creek", "crown-of-the-ridge"], "mandatory": True},
         ]},
    ]

    endings = [
        {"id": "long-homestead", "name": "The Long Homestead",
         "summary": "Refuse the ridge crown, keep a mortal body, and reach the sixth era.",
         "requirements": [
             {"kind": "year_min", "value": 70},
             {"kind": "form_in", "values": ["otter-creek-smuggler", "rutland-officer"]},
             {"kind": "flag", "id": "mayor-spoken", "equals": True},
             {"kind": "flag", "id": "refused-ridge-crown", "equals": True},
             {"kind": "crown", "id": "crown-of-the-creek"},
             {"kind": "crown_absent", "id": "crown-of-the-ridge"},
             {"kind": "tool", "id": "homestead-glass"},
         ]},
        {"id": "smugglers-litany", "name": "Smuggler's Litany",
         "summary": "Remain the Otter Creek Smuggler into the fifth era with the creek crown and fins.",
         "requirements": [
             {"kind": "year_min", "value": 56},
             {"kind": "form", "id": "otter-creek-smuggler"},
             {"kind": "crown", "id": "crown-of-the-creek"},
             {"kind": "crown_absent", "id": "crown-of-the-ridge"},
             {"kind": "flag", "id": "mayor-spoken", "equals": True},
             {"kind": "tool", "id": "creek-fins"},
         ]},
        {"id": "officers-quiet", "name": "Officer's Quiet",
         "summary": "Take the Rutland Officer body, read the archive, stop before the ridge crown.",
         "requirements": [
             {"kind": "year_min", "value": 42},
             {"kind": "form", "id": "rutland-officer"},
             {"kind": "flag", "id": "mayor-spoken", "equals": True},
             {"kind": "flag", "id": "archive-read", "equals": True},
             {"kind": "crown_absent", "id": "crown-of-the-ridge"},
             {"kind": "tool", "id": "block-rod"},
         ]},
        {"id": "embryonic-crossing", "name": "Embryonic Crossing",
         "summary": "Both crowns, Embryonic God, cross the void terminal.",
         "requirements": [
             {"kind": "form", "id": "embryonic-god"},
             {"kind": "crown", "id": "crown-of-the-creek"},
             {"kind": "crown", "id": "crown-of-the-ridge"},
             {"kind": "flag", "id": "void-crossed", "equals": True},
             {"kind": "flag", "id": "mayor-spoken", "equals": True},
             {"kind": "flag", "id": "archive-read", "equals": True},
         ]},
    ]

    optional_choices = [
        {"id": "spare-the-heron", "optional": True, "recovery_id": None,
         "effects": [{"op": "set_flag", "id": "heron-spared"}],
         "notes": "Side kindness. Does not touch tools, keys, or required flags."},
        {"id": "empty-a-practice-keg", "optional": True, "recovery_id": None,
         "effects": [{"op": "set_flag", "id": "scent-of-smoke"}],
         "notes": "Scents a keg that is not the unique powder reward."},
    ]

    recovery_paths = [
        {"id": "soulbound-tools", "restores": "acquired tools",
         "when": "Death keeps every tool Ellis already acquired. Unacquired tools stay in their dungeons, which are not era-sealed."},
        {"id": "required-flag-persistence", "restores": "required quest flags",
         "when": "Death does not clear required flags. scent-of-smoke is atmospheric and may drop."},
        {"id": "clerk-succeeds-mayor", "restores": "mayor-spoken",
         "when": "From year 28 onward, including post-principal deaths, Clerk Ida Ross grants mayor-spoken."},
        {"id": "missed-dungeon-reentry", "restores": "dungeon access",
         "when": "No main dungeon is sealed by era. A tool missed at year 0 can be taken later."},
        {"id": "form-rechoice", "restores": "smuggler or officer",
         "when": "Each death before godhood chooses Otter Creek Smuggler, or Rutland Officer if mayor-spoken persists. Embryonic God is irreversible but retains ground, water, and void."},
        {"id": "post-principal-grave", "restores": "respawn after year 70",
         "when": "Death at year 70 or later respawns at Middlebury Green on the year-70 profile plus the potter's field stone. No mandatory objective requires a year past 70."},
        {"id": "boss-chest-once", "restores": "unique boss rewards",
         "when": "Re-entry is allowed and does not grant the unique reward again."},
        {"id": "glass-recall", "restores": "return to hub",
         "when": "Homestead glass warps to Middlebury Green and does not grant completion or skip a necessary prerequisite."},
    ]

    districts = [loc for loc in locations if loc["kind"] == "district"]
    for d in districts:
        d["open_eras"] = list(ALL_ERAS)
        d["sealed_eras"] = []

    model = {
        "meta": {
            "id": "preincarnation-reference-v1",
            "status": "proposed-reference-model",
            "core_files": "unavailable",
            "verifies_runtime": False,
            "setting": "Addison County, Vermont only",
            "protagonist": "Ellis Perch",
            "death_advances_years": 14,
            "targets": {
                "major_dungeons": 16,
                "districts": 12,
                "endings": 4,
                "hours_first_play_min": 120,
                "hours_first_play_max": 160,
                "hours_verified": False,
            },
            "exclusions": [
                "party", "procedural_generation", "crafting_economy", "quest_compass",
                "replacement_skill_tree", "accounts", "monetization",
            ],
            "contradictions": [
                "Rutland Officer is a body name whose commission is extra-county, but playable space stays inside Addison County.",
                "Crowns/cycles is implemented as two crown artifacts, not as two mandatory deaths. Godhood can occur at year 0.",
                "Marble hammer dungeon is sited at Weybridge by compression; historic marble volume is outside the county.",
                "Creek fins and the smuggler both relate to water. Creek terrain accepts either; the lake cut accepts fins or Embryonic God only.",
                "Embryonic God keeps ground movement. The phrase 'crosses water and void' is read as added terrains, because the shrine exit is ground.",
                "Tools persist once acquired (soulbound). A grave-stash reading is unresolved.",
                "120-160 hours is an unverified target.",
            ],
        },
        "start_location": "middlebury-green",
        "recovery_hub": "middlebury-green",
        "terrain_rules": {
            "ground": {"needs_movement": "ground"},
            "creek": {"any": [{"needs_movement": "water"}, {"all": [{"needs_tool": "creek-fins"}, {"needs_movement": "ground"}]}]},
            "lake": {"any": [{"needs_form": "embryonic-god"}, {"all": [{"needs_tool": "creek-fins"}, {"needs_movement": "ground"}]}]},
            "void": {"needs_movement": "void"},
            "gap": {"all": [{"needs_tool": "gap-boots"}, {"needs_movement": "ground"}]},
            "hook": {"all": [{"needs_tool": "sugar-line-hookshot"}, {"needs_movement": "ground"}]},
            "dark": {"all": [{"needs_tool": "oil-lamp"}, {"needs_movement": "ground"}]},
        },
        "era_rules": {
            "principal_eras": [0, 14, 28, 42, 56, 70],
            "advance_years": 14,
            "hard_year_cap": None,
            "era_profiles": {
                "year-0": {"label": "First body"},
                "year-14": {"label": "Second body"},
                "year-28": {"label": "Third body, mayor gone"},
                "year-42": {"label": "Fourth body"},
                "year-56": {"label": "Fifth body"},
                "year-70": {"label": "Sixth principal era"},
            },
            "post_principal_policy": {
                "supported": True,
                "respawn": "middlebury-green",
                "uses_era_profile": "year-70",
                "representative_year": 84,
                "formula": "70 + 14*n for integer n >= 1",
                "mandatory_content_after_year_70": False,
                "notes": "Later deaths stay playable. Geography remains the year-70 profile plus the potter's field stone at Middlebury Green.",
            },
        },
        "death": {
            "advance_years": 14,
            "respawn": "middlebury-green",
            "always_available": True,
            "flags_cleared": ["scent-of-smoke"],
            "tools_cleared": [],
            "form_rule": "If both crowns are held, the body is Embryonic God. Else if this death is at least the first and mayor-spoken persists, the player may choose Rutland Officer or Otter Creek Smuggler. Else the body is Otter Creek Smuggler. Mortal Wanderer is only year 0.",
        },
        "locations": locations,
        "edges": edges,
        "tools": tools,
        "crowns": crowns,
        "forms": forms,
        "npcs": npcs,
        "quest_flags": quest_flags,
        "flag_sources": flag_sources,
        "keys": keys,
        "bosses": bosses,
        "dungeons": dungeons,
        "endings": endings,
        "optional_choices": optional_choices,
        "recovery_paths": recovery_paths,
        "objectives": [
            {"id": "shared-trunk", "required_for_main": True, "year_min": 0,
             "notes": "The trunk is tool, crown, and void completion. It is not gated past year 70."},
        ],
        "main_campaign": {
            "definition": "All twelve tools, both crowns, mayor-spoken, archive-read, crypt-cleared, catacomb-cleared, and void-crossed. The three mortal endings are alternate termini that refuse the ridge crown; refusing it is an ending branch, not an optional choice.",
            "tools": list(TOOL_IDS),
            "crowns": ["crown-of-the-creek", "crown-of-the-ridge"],
            "flags": ["mayor-spoken", "archive-read", "void-crossed", "crypt-cleared", "catacomb-cleared"],
            "terminus": "void-terminal",
        },
        "core": {
            "description": "Bounded projection for exhaustive enumeration. Same map, fewer variables. Not the full game. Fins are included so creek and lake rules are searched, not assumed.",
            "locations": [
                "middlebury-green", "grave-crypt", "grave-crypt-heart", "vergennes-falls",
                "cornwall-flats", "hook-span", "otter-creek-narrows", "creek-channel",
                "ferrisburgh-shore", "lake-cut",
            ],
            "tools": ["grave-shovel", "sugar-line-hookshot", "creek-fins"],
            "flags": ["mayor-spoken"],
            "bosses": ["crypt-warden"],
            "years": [0, 14, 28],
            "max_year_inclusive": 28,
            "forms": ["mortal-wanderer", "otter-creek-smuggler", "rutland-officer"],
            "excluded": [
                "embryonic-god",
                "years 42, 56, 70 and every post-principal year",
                "the nine tools other than grave shovel, sugar-line hookshot, and creek fins",
                "both crowns and the void terminus",
                "the seven districts with no core location",
            ],
            "year_form_pairs": [
                [0, "mortal-wanderer"],
                [14, "otter-creek-smuggler"],
                [14, "rutland-officer"],
                [28, "otter-creek-smuggler"],
                [28, "rutland-officer"],
            ],
            "tracked_bits": [
                "grave-shovel", "sugar-line-hookshot", "creek-fins",
                "mayor-spoken", "crypt-warden-cleared",
            ],
            "goal": {
                "location": "hook-span",
                "tools": ["grave-shovel", "sugar-line-hookshot"],
                "flags": ["mayor-spoken"],
                "boss_cleared": "crypt-warden",
                "year": 28,
            },
        },
    }
    return model


def index_model(model: dict) -> dict:
    model = copy.deepcopy(model)
    loc_ids = [loc["id"] for loc in model["locations"]]
    model["_loc_ids"] = set(loc_ids)
    adj = {i: [] for i in loc_ids}
    for e in model["edges"]:
        if e.get("is_warp"):
            continue
        base = {
            "id": e["id"],
            "terrain": e["terrain"],
            "requires_tools": list(e.get("requires_tools") or []),
            "requires_flags": list(e.get("requires_flags") or []),
            "requires_crowns": list(e.get("requires_crowns") or []),
            "requires_forms": list(e.get("requires_forms") or []),
            "is_warp": False,
        }
        a, b = e["a"], e["b"]
        if a not in adj or b not in adj:
            continue
        adj[a].append({**base, "from": a, "to": b})
        if not e.get("directed"):
            adj[b].append({**base, "id": e["id"] + "-rev", "from": b, "to": a})
    model["_adj"] = adj
    model["_tool"] = {t["id"]: t for t in model["tools"]}
    model["_form"] = {f["id"]: f for f in model["forms"]}
    model["_crown"] = {c["id"]: c for c in model["crowns"]}
    model["_flag"] = {f["id"]: f for f in model["quest_flags"]}
    model["_npc"] = {n["id"]: n for n in model["npcs"]}
    model["_boss"] = {b["id"]: b for b in model["bosses"]}
    return model


def eval_clause(rule: dict, movement: set, tools: set, body: str) -> bool:
    if "any" in rule:
        return any(eval_clause(c, movement, tools, body) for c in rule["any"])
    if "all" in rule:
        return all(eval_clause(c, movement, tools, body) for c in rule["all"])
    if "needs_movement" in rule and rule["needs_movement"] not in movement:
        return False
    if "needs_tool" in rule and rule["needs_tool"] not in tools:
        return False
    if "needs_form" in rule and rule["needs_form"] != body:
        return False
    return True


def edge_passable(model, edge, tools, body, flags, crowns) -> bool:
    if edge.get("is_warp"):
        return False
    form = model["_form"][body]
    movement = set(form["movement"])
    if edge.get("requires_forms") and body not in edge["requires_forms"]:
        return False
    if not set(edge.get("requires_tools") or []) <= tools:
        return False
    if not set(edge.get("requires_flags") or []) <= flags:
        return False
    if not set(edge.get("requires_crowns") or []) <= crowns:
        return False
    rule = model["terrain_rules"][edge["terrain"]]
    return eval_clause(rule, movement, tools, body)


def flood(model, seeds, tools, bodies, flags, crowns) -> set:
    locs = set(seeds)
    q = deque(seeds)
    tools, flags, crowns = set(tools), set(flags), set(crowns)
    bodies = list(bodies)
    while q:
        loc = q.popleft()
        for edge in model["_adj"].get(loc, []):
            if any(edge_passable(model, edge, tools, b, flags, crowns) for b in bodies):
                if edge["to"] not in locs:
                    locs.add(edge["to"])
                    q.append(edge["to"])
    return locs


class Acq:
    def __init__(self):
        self.tools = set()
        self.flags = set()
        self.crowns = set()
        self.locs = set()
        self.phase1_locs = set()
        self.phase2_locs = set()
        self.bodies = set()
        self.phase2 = False


def _grant_world(model, locs, tools, flags, crowns, bodies, banned_tools, banned_crowns, banned_flags, unobtainable):
    changed = False
    for npc in model["npcs"]:
        if npc["location"] not in locs or not npc.get("alive_eras"):
            continue
        for fl in npc["grants_flags"]:
            if fl in banned_flags or fl in flags:
                continue
            flags.add(fl)
            changed = True
    if "mayor-spoken" in flags and "rutland-officer" not in bodies and "embryonic-god" not in bodies:
        bodies.add("rutland-officer")
        changed = True
    for t in model["tools"]:
        tid = t["id"]
        if tid in tools or tid in banned_tools or tid in unobtainable or t.get("unobtainable"):
            continue
        if t["found_at"] not in locs:
            continue
        if not set(t.get("requires_tools") or []) <= tools:
            continue
        if not set(t.get("requires_flags") or []) <= flags:
            continue
        if not set(t.get("requires_crowns") or []) <= crowns:
            continue
        tools.add(tid)
        changed = True
    for c in model["crowns"]:
        cid = c["id"]
        if cid in crowns or cid in banned_crowns:
            continue
        if c["found_at"] not in locs:
            continue
        if not set(c.get("requires_tools") or []) <= tools:
            continue
        if not set(c.get("requires_flags") or []) <= flags:
            continue
        crowns.add(cid)
        changed = True
    for src in model["flag_sources"]:
        fl = src["flag"]
        if fl in flags or fl in banned_flags:
            continue
        if src.get("choice"):
            continue
        if src["at"] not in locs:
            continue
        if src.get("requires_form") and src["requires_form"] not in bodies:
            continue
        if not set(src.get("requires_tools") or []) <= tools:
            continue
        if not set(src.get("requires_flags") or []) <= flags:
            continue
        if not set(src.get("requires_crowns") or []) <= crowns:
            continue
        flags.add(fl)
        changed = True
    return changed


def acquire(model, seed_tools=None, banned_tools=None, banned_crowns=None, banned_flags=None,
            unobtainable=None, refuse_ridge=False, forbid_god=False) -> Acq:
    banned_tools = set(banned_tools or [])
    banned_crowns = set(banned_crowns or [])
    banned_flags = set(banned_flags or [])
    unobtainable = set(unobtainable or [])
    for t in model["tools"]:
        if t.get("unobtainable"):
            unobtainable.add(t["id"])
    if refuse_ridge or forbid_god:
        banned_crowns.add("crown-of-the-ridge")
    # Phase 1 always delays the ridge crown so a successful order may collect everything else first.
    phase1_crown_ban = set(banned_crowns) | {"crown-of-the-ridge"}
    tools = set(seed_tools or []) - banned_tools - unobtainable
    flags = set()
    crowns = set()
    bodies = {"mortal-wanderer", "otter-creek-smuggler"}
    locs = set()
    for _ in range(10000):
        changed = False
        new_locs = flood(model, [model["start_location"]], tools, bodies, flags, crowns)
        if new_locs != locs:
            locs = new_locs
            changed = True
        if _grant_world(model, locs, tools, flags, crowns, bodies, banned_tools, phase1_crown_ban,
                        banned_flags, unobtainable):
            changed = True
        if not changed:
            break
    else:
        raise RuntimeError("phase 1 did not converge")
    out = Acq()
    out.phase1_locs = set(locs)
    out.bodies = set(bodies)
    if refuse_ridge:
        flags.add("refused-ridge-crown")
    # Phase 2 claims the ridge crown and keeps only Embryonic God.
    # Refusing the crown, forbidding god, or never reaching the shrine skips it.
    # A banned ridge crown is not added even if phase 2 runs.
    if (not refuse_ridge) and (not forbid_god) and ("ridge-shrine" in locs):
        tools2, flags2, crowns2 = set(tools), set(flags), set(crowns)
        if "crown-of-the-ridge" not in banned_crowns:
            crowns2.add("crown-of-the-ridge")
        bodies2 = {"embryonic-god"}
        locs2 = set()
        for _ in range(10000):
            changed = False
            new_locs = flood(model, ["ridge-shrine"], tools2, bodies2, flags2, crowns2)
            if new_locs != locs2:
                locs2 = new_locs
                changed = True
            if _grant_world(model, locs2, tools2, flags2, crowns2, bodies2, banned_tools, banned_crowns,
                            banned_flags, unobtainable):
                changed = True
            if not changed:
                break
        else:
            raise RuntimeError("phase 2 did not converge")
        out.phase2 = True
        out.phase2_locs = locs2
        out.bodies |= bodies2
        tools, flags, crowns, locs = tools2, flags2, crowns2, set(locs) | locs2
    out.tools, out.flags, out.crowns, out.locs = tools, flags, crowns, locs
    return out


def campaign_missing(model, unobtainable=None, refuse_ridge=False, forbid_god=False, banned_flags=None):
    r = acquire(model, unobtainable=unobtainable, refuse_ridge=refuse_ridge, forbid_god=forbid_god,
                banned_flags=banned_flags)
    main = model["main_campaign"]
    missing = []
    if refuse_ridge or forbid_god:
        return missing, r
    for t in main["tools"]:
        if t not in r.tools:
            missing.append("tool:" + t)
    for c in main["crowns"]:
        if c not in r.crowns:
            missing.append("crown:" + c)
    for f in main["flags"]:
        if f not in r.flags:
            missing.append("flag:" + f)
    if main["terminus"] not in r.locs:
        missing.append("terminus")
    return missing, r


def maximal_flood(model, tools, bodies=None):
    if bodies is None:
        bodies = [f["id"] for f in model["forms"]]
    flags = {f["id"] for f in model["quest_flags"]}
    crowns = {c["id"] for c in model["crowns"]}
    return flood(model, [model["start_location"]], set(tools), bodies, flags, crowns)


def classify_tools(model):
    """Self-lock is 'blocked by itself'. A cycle is a mutual pair, not a downstream casualty."""
    scratch = acquire(model)
    all_ids = [t["id"] for t in model["tools"]]
    self_locks = []
    missing = []
    for t in model["tools"]:
        tid = t["id"]
        if tid in scratch.tools:
            continue
        missing.append(tid)
        others = [i for i in all_ids if i != tid]
        without = maximal_flood(model, others)
        with_tool = maximal_flood(model, all_ids)
        req = set(t.get("requires_tools") or [])
        site_open = t["found_at"] in without and tid not in req and req <= set(others)
        if not site_open and (tid in req or t["found_at"] in with_tool):
            self_locks.append(tid)
    self_set = set(self_locks)
    others_missing = [tid for tid in missing if tid not in self_set]

    def can_get(tid, seed):
        return tid in acquire(model, seed_tools=set(seed)).tools

    cycle_nodes = []
    seen_pairs = set()
    for i, a in enumerate(others_missing):
        for b in others_missing[i + 1:]:
            if can_get(a, {b}) and can_get(b, {a}):
                seen_pairs.add((a, b))
                if a not in cycle_nodes:
                    cycle_nodes.append(a)
                if b not in cycle_nodes:
                    cycle_nodes.append(b)
    return self_locks, cycle_nodes, scratch


def check_tool_locks(model):
    vs = []
    self_locks, cycles, _scratch = classify_tools(model)
    for tid in self_locks:
        t = model["_tool"][tid]
        why = "requires itself" if tid in set(t.get("requires_tools") or []) else (
            f"found at {t['found_at']}, unreachable when every other tool, flag, crown, and form is granted"
        )
        vs.append(V("tool_self_lock", tid, why))
    if cycles:
        vs.append(V(
            "tool_cycle_lock", ",".join(cycles),
            "Neither tool is obtainable from a fresh game, but each becomes obtainable if the other is seeded.",
        ))
    return vs


def check_keys(model):
    vs = []
    for key in model["keys"]:
        uses = list(key["uses"])
        mandatory = [u for u in uses if u.get("mandatory")]
        copies = int(key["copies"])
        consumed = bool(key["consumed_when_used"])
        if not mandatory:
            continue
        if not consumed:
            if copies < 1:
                vs.append(V("key_consumed_before_mandatory_use", key["id"],
                            "Permanent key has zero copies but mandatory doors remain."))
            continue
        last_m = max(u["order"] for u in mandatory)
        premature = [u for u in uses if (not u.get("mandatory")) and u["order"] <= last_m
                     and u.get("can_precede_mandatory", True)]
        if copies < len(mandatory) or copies - len(premature) < len(mandatory):
            vs.append(V(
                "key_consumed_before_mandatory_use", key["id"],
                f"copies={copies}, mandatory uses={len(mandatory)}, earlier optional consumes={len(premature)}.",
            ))
    return vs


def check_npcs(model):
    vs = []
    # Only flags an NPC actually grants are life-gated. Dungeon flags come from rooms
    # that stay open in every era, so they are not "an essential NPC".
    required = {f["id"] for f in model["quest_flags"] if f["required_for_main"]}
    npc_flags = []
    for npc in model["npcs"]:
        for fid in npc.get("grants_flags") or []:
            if fid in required and fid not in npc_flags:
                npc_flags.append(fid)
    for fid in npc_flags:
        grantors = [n for n in model["npcs"] if fid in n.get("grants_flags", [])]
        missing_eras = []
        for era in ALL_ERAS:
            if not any(era in n.get("alive_eras", []) for n in grantors):
                missing_eras.append(str(era))
        if missing_eras:
            vs.append(V(
                "essential_npc_no_successor", fid,
                "No living grantor of required flag in eras " + ", ".join(missing_eras) + ".",
            ))
    for npc in model["npcs"]:
        if not npc.get("essential"):
            continue
        for sid in npc.get("successors") or []:
            succ = model["_npc"].get(sid)
            if succ is None:
                vs.append(V("essential_npc_no_successor", npc["id"], f"Successor {sid} does not exist."))
                continue
            missing = [f for f in npc["grants_flags"] if f not in succ.get("grants_flags", []) and f in required]
            if missing:
                vs.append(V("essential_npc_no_successor", npc["id"],
                            f"Successor {sid} does not grant {missing}."))
    return vs


def check_death_flags(model):
    vs = []
    cleared = set(model["death"].get("flags_cleared") or [])
    for fl in model["quest_flags"]:
        if not fl["required_for_main"]:
            continue
        if (not fl["persists_on_death"]) or fl["id"] in cleared:
            vs.append(V("death_erases_required_flag", fl["id"],
                        "Required flag does not persist across the fourteen-year death."))
    return vs


def check_form_strands(model):
    vs = []
    tools = {t["id"] for t in model["tools"] if not t.get("unobtainable")}
    flags = {f["id"] for f in model["quest_flags"]}
    crowns = {c["id"] for c in model["crowns"]}
    for form in model["forms"]:
        failed = []
        for entry in form["entry_locations"]:
            if entry not in model["_loc_ids"]:
                failed.append(f"{entry} missing")
                continue
            locs = flood(model, [entry], tools, [form["id"]], flags, crowns)
            for need in form.get("obligations") or []:
                if need not in locs:
                    failed.append(f"from {entry} cannot reach {need}")
        if failed:
            vs.append(V("form_change_strands_player", form["id"], "; ".join(failed)))
    return vs


def _max_supported_year(model) -> int:
    policy = model["era_rules"].get("post_principal_policy") or {}
    if policy.get("supported"):
        return int(policy.get("representative_year", 84))
    return 70


def satisfiable(model, ending):
    form_must = []
    form_not = set()
    form_in = None
    year_min = 0
    year_max = 10 ** 9
    flags = {}
    tools_must, tools_forbid = set(), set()
    crowns_must, crowns_forbid = set(), set()
    for r in ending["requirements"]:
        k = r["kind"]
        if k == "form":
            form_must.append(r["id"])
        elif k == "form_not":
            form_not.add(r["id"])
        elif k == "form_in":
            opts = set(r["values"])
            form_in = opts if form_in is None else (form_in & opts)
        elif k == "year_min":
            year_min = max(year_min, int(r["value"]))
        elif k == "year_max":
            year_max = min(year_max, int(r["value"]))
        elif k == "flag":
            if r["id"] in flags and flags[r["id"]] != r["equals"]:
                return False, f"flag {r['id']} required both true and false"
            flags[r["id"]] = r["equals"]
        elif k == "tool":
            tools_must.add(r["id"])
        elif k == "tool_absent":
            tools_forbid.add(r["id"])
        elif k == "crown":
            crowns_must.add(r["id"])
        elif k == "crown_absent":
            crowns_forbid.add(r["id"])
        else:
            return False, f"unknown requirement kind {k}"
    if len(set(form_must)) > 1:
        return False, "requires mutually exclusive forms: " + ", ".join(form_must)
    form = form_must[0] if form_must else None
    if form and form_in is not None and form not in form_in:
        return False, "required form is outside form_in"
    if form_in is not None:
        form_in = set(form_in) - form_not
        if form:
            form_in &= {form}
        if not form_in:
            return False, "no form satisfies the conjunction"
        candidates = list(form_in)
    elif form:
        candidates = [] if form in form_not else [form]
    else:
        candidates = [f["id"] for f in model["forms"] if f["id"] not in form_not]
    if not candidates:
        return False, "no legal form"
    if year_min > year_max:
        return False, f"year window {year_min}..{year_max} is empty"
    if tools_must & tools_forbid:
        return False, "tool both required and forbidden: " + ",".join(sorted(tools_must & tools_forbid))
    if crowns_must & crowns_forbid:
        return False, "crown both required and forbidden: " + ",".join(sorted(crowns_must & crowns_forbid))
    if year_min > _max_supported_year(model):
        return False, f"year_min {year_min} exceeds the supported calendar"
    chosen = None
    for cand in candidates:
        if cand == "mortal-wanderer" and year_min >= 14:
            continue
        if cand == "otter-creek-smuggler" and year_max < 14:
            continue
        if cand == "rutland-officer":
            if year_max < 14:
                continue
            if flags.get("mayor-spoken") is False:
                continue
        if cand == "embryonic-god":
            if {"crown-of-the-creek", "crown-of-the-ridge"} & crowns_forbid:
                continue
            if flags.get("mayor-spoken") is False and False:
                continue
        chosen = cand
        break
    if chosen is None:
        return False, "forms contradict year, mayor flag, or crown requirements"
    return True, {"form": chosen, "year_min": year_min, "flags": flags, "tools": tools_must, "crowns": crowns_must,
                  "crowns_forbid": crowns_forbid}


def death_strips(model, fid: str) -> bool:
    fl = model["_flag"].get(fid)
    if fl is None:
        return False
    if not fl["persists_on_death"]:
        return True
    return fid in set(model["death"].get("flags_cleared") or [])


def witness_ending(model, ending):
    ok, info = satisfiable(model, ending)
    if not ok:
        return False, info
    refuse = ("crown-of-the-ridge" in info["crowns_forbid"]) or (info["flags"].get("refused-ridge-crown") is True)
    needs_god = info["form"] == "embryonic-god"
    if needs_god:
        refuse = False
    r = acquire(model, refuse_ridge=refuse and not needs_god)
    missing = []
    for t in info["tools"]:
        if t not in r.tools:
            missing.append("tool:" + t)
    for c in info["crowns"]:
        if c not in r.crowns:
            missing.append("crown:" + c)
    for fid, val in info["flags"].items():
        if fid == "refused-ridge-crown" and val is True and refuse:
            continue
        if val is True and fid not in r.flags:
            missing.append("flag:" + fid)
        if val is False and fid in r.flags and fid != "refused-ridge-crown":
            missing.append("flag-unexpected:" + fid)
    if needs_god and "embryonic-god" not in r.bodies:
        missing.append("form:embryonic-god")
    if info["form"] == "rutland-officer" and "rutland-officer" not in r.bodies:
        missing.append("form:rutland-officer")
    if info["year_min"] > 0:
        for fid, val in info["flags"].items():
            if val is True and death_strips(model, fid):
                missing.append("death-strips:" + fid)
        if info["year_min"] not in model["era_rules"]["principal_eras"] and info["year_min"] > 70:
            policy = model["era_rules"].get("post_principal_policy") or {}
            if not policy.get("supported"):
                missing.append("year")
    if missing:
        return False, "unreachable: " + ", ".join(missing)
    return True, "ok"


def check_endings(model):
    vs = []
    for ending in model["endings"]:
        ok, info = satisfiable(model, ending)
        if not ok:
            vs.append(V("ending_mutually_exclusive_states", ending["id"], str(info)))
            continue
        reached, why = witness_ending(model, ending)
        if not reached:
            vs.append(V("ending_unreachable", ending["id"], str(why)))
    return vs


def apply_choice(model, choice):
    m = copy.deepcopy(model)
    # Drop solver indexes if a caller passed an indexed model; check() indexes after apply via the copy of raw data.
    for key in list(m.keys()):
        if key.startswith("_"):
            del m[key]
    for effect in choice.get("effects") or []:
        op = effect["op"]
        if op == "set_flag":
            continue
        if op == "destroy_tool":
            for t in m["tools"]:
                if t["id"] == effect["id"]:
                    t["unobtainable"] = True
                    t["found_at"] = None
        elif op == "kill_npc":
            m["npcs"] = [n for n in m["npcs"] if n["id"] not in effect["ids"]]
            for n in m["npcs"]:
                n["successors"] = [s for s in n.get("successors", []) if s not in effect["ids"]]
        else:
            raise RuntimeError(f"unknown effect {op}")
    return m


def recovery_covers(model, choice) -> bool:
    rid = choice.get("recovery_id")
    if not rid:
        return False
    rec = next((r for r in model["recovery_paths"] if r["id"] == rid), None)
    if rec is None:
        return False
    restored = set(rec.get("restores_tools") or [])
    killed = set(rec.get("restores_npcs") or [])
    for effect in choice.get("effects") or []:
        if effect["op"] == "destroy_tool" and effect["id"] not in restored:
            return False
        if effect["op"] == "kill_npc" and not set(effect["ids"]) <= killed:
            return False
    harmful = [e for e in choice.get("effects") or [] if e["op"] in ("destroy_tool", "kill_npc")]
    return bool(harmful) and rec.get("covers_choice") == choice["id"]


def check_optional(model):
    vs = []
    raw = copy.deepcopy(model)
    for key in list(raw.keys()):
        if key.startswith("_"):
            del raw[key]
    for choice in raw["optional_choices"]:
        if not choice.get("optional", False):
            continue
        if recovery_covers(raw, choice):
            continue
        mutated = index_model(apply_choice(raw, choice))
        # Reaching the trunk after the choice is what "main campaign" means here.
        missing, _ = campaign_missing(mutated)
        harmful = [e for e in choice.get("effects") or [] if e["op"] in ("destroy_tool", "kill_npc")]
        if harmful and missing:
            vs.append(V("optional_choice_blocks_main", choice["id"],
                        "Irreversible optional choice removes the trunk: " + ", ".join(missing)))
        elif missing and harmful:
            vs.append(V("optional_choice_blocks_main", choice["id"], ", ".join(missing)))
    return vs


def check_warps(model):
    vs = []
    warps = [e for e in model["edges"] if e.get("is_warp")]
    cache = {}

    def dest_reachable(dest, **kw):
        key = (dest, json.dumps(kw, sort_keys=True, default=list))
        if key not in cache:
            if dest == model["start_location"] and not kw:
                cache[key] = True
            else:
                r = acquire(model, **kw)
                cache[key] = dest in r.locs
        return cache[key]

    for warp in warps:
        dest = warp["b"]
        missing_tools, missing_flags, missing_crowns = [], [], []
        god_needed = False
        if dest != model["start_location"]:
            for t in model["tools"]:
                if not dest_reachable(dest, banned_tools={t["id"]}):
                    missing_tools.append(t["id"])
            for f in model["quest_flags"]:
                if not dest_reachable(dest, banned_flags={f["id"]}):
                    missing_flags.append(f["id"])
            for c in model["crowns"]:
                if not dest_reachable(dest, banned_crowns={c["id"]}):
                    missing_crowns.append(c["id"])
            if not dest_reachable(dest, forbid_god=True):
                god_needed = True
        req_tools = set(warp.get("requires_tools") or [])
        req_flags = set(warp.get("requires_flags") or [])
        req_crowns = set(warp.get("requires_crowns") or [])
        req_forms = set(warp.get("requires_forms") or [])
        gap = []
        for t in missing_tools:
            if t not in req_tools:
                gap.append("tool:" + t)
        for f in missing_flags:
            if f not in req_flags:
                gap.append("flag:" + f)
        for c in missing_crowns:
            if c not in req_crowns:
                gap.append("crown:" + c)
        if god_needed and "embryonic-god" not in req_forms:
            gap.append("form:embryonic-god")
        if warp.get("grants_completion"):
            for t in model["main_campaign"]["tools"]:
                if t not in req_tools:
                    gap.append("completion-tool:" + t)
            for c in model["main_campaign"]["crowns"]:
                if c not in req_crowns:
                    gap.append("completion-crown:" + c)
        # Unique while preserving order.
        seen = set()
        gap_u = []
        for g in gap:
            if g not in seen:
                seen.add(g)
                gap_u.append(g)
        if gap_u:
            vs.append(V("warp_bypasses_mandatory", warp["id"],
                        f"{warp.get('a')} -> {dest} omits " + ", ".join(gap_u)))
    return vs


def check_bosses(model):
    vs = []
    for b in model["bosses"]:
        if b.get("reward_unique") and b.get("reentry_allowed") and b.get("reentry_grants_reward"):
            vs.append(V("boss_reentry_duplicates_rewards", b["id"],
                        f"Re-entry grants unique reward {b['reward']} again."))
    return vs


def check_years(model):
    vs = []
    rules = model["era_rules"]
    if list(rules.get("principal_eras") or []) != AUTHORED_PRINCIPAL:
        vs.append(V("era_table_mismatch", "principal_eras",
                    f"Authored principal eras are {AUTHORED_PRINCIPAL}, model has {rules.get('principal_eras')}."))
    policy = rules.get("post_principal_policy") or {}
    if not policy.get("supported"):
        vs.append(V("years_beyond_principal_eras", "post_principal_policy",
                    "Death at year 70 advances fourteen years to 84, and no post-principal support is defined."))
    else:
        if policy.get("respawn") not in {loc["id"] for loc in model["locations"]}:
            vs.append(V("years_beyond_principal_eras", "post-respawn", "Post-principal respawn is not a location."))
        profiles = rules.get("era_profiles") or {}
        if policy.get("uses_era_profile") not in profiles:
            vs.append(V("years_beyond_principal_eras", "post-profile",
                        "Post-principal policy names a profile that does not exist."))
        respawn = policy.get("respawn")
        if respawn in model.get("_loc_ids", set()):
            tools = {t["id"] for t in model["tools"] if not t.get("unobtainable")}
            flags = {f["id"] for f in model["quest_flags"]}
            crowns = {c["id"] for c in model["crowns"]}
            hub = model["recovery_hub"]
            for fid in ("otter-creek-smuggler", "rutland-officer"):
                locs = flood(model, [respawn], tools, [fid], flags, crowns)
                if hub not in locs or len(locs) < 2:
                    vs.append(V(
                        "years_beyond_principal_eras", "post-respawn-strand",
                        f"A death past year 70 drops {fid} at {respawn}, which that body cannot leave for {hub}.",
                    ))
    if rules.get("hard_year_cap") is not None and int(rules["hard_year_cap"]) <= 70:
        vs.append(V("years_beyond_principal_eras", "hard_year_cap",
                    "Calendar hard-caps at or before year 70 while death remains possible."))
    for obj in model.get("objectives") or []:
        if obj.get("required_for_main") and int(obj.get("year_min") or 0) > 70:
            vs.append(V("years_beyond_principal_eras", obj["id"],
                        f"Required objective demands year {obj['year_min']}, past the six principal eras."))
    return vs


def check_internal(model):
    """Dungeon internal_unlocks must name the same sites, costs, keys, and bosses as the solver records."""
    vs = []
    tools = model["_tool"]
    crowns = model["_crown"]
    bosses = model["_boss"]
    keys = {k["id"]: k for k in model["keys"]}
    door_ids = set()
    for dungeon in model["dungeons"]:
        if dungeon["solver_node"] not in model["_loc_ids"]:
            vs.append(V("internal_unlock_mismatch", dungeon["id"],
                        f"solver node {dungeon['solver_node']} is not a location."))
        for unlock in dungeon["internal_unlocks"]:
            grants = unlock.get("grants")
            if grants in tools:
                tool = tools[grants]
                if tool.get("found_at") != dungeon["solver_node"]:
                    vs.append(V("internal_unlock_mismatch", unlock["id"],
                                f"grants {grants} but that tool is found at {tool.get('found_at')}, not {dungeon['solver_node']}."))
                if set(unlock.get("requires_tools") or []) != set(tool.get("requires_tools") or []):
                    vs.append(V("internal_unlock_mismatch", unlock["id"],
                                f"internal tools {unlock.get('requires_tools') or []} != tool record {tool.get('requires_tools') or []}."))
                if set(unlock.get("requires_flags") or []) != set(tool.get("requires_flags") or []):
                    vs.append(V("internal_unlock_mismatch", unlock["id"],
                                f"internal flags {unlock.get('requires_flags') or []} != tool record {tool.get('requires_flags') or []}."))
            elif grants in crowns:
                crown = crowns[grants]
                if crown.get("found_at") != dungeon["solver_node"]:
                    vs.append(V("internal_unlock_mismatch", unlock["id"],
                                f"crown {grants} is found at {crown.get('found_at')}, not {dungeon['solver_node']}."))
            elif grants is not None and grants not in keys:
                vs.append(V("internal_unlock_mismatch", unlock["id"], f"grants unknown id {grants}."))
            if unlock.get("requires_keys"):
                door_ids.add(unlock["id"])
            for kid in unlock.get("requires_keys") or []:
                key = keys.get(kid)
                if key is None:
                    vs.append(V("internal_unlock_mismatch", unlock["id"], f"unknown key {kid}."))
                    continue
                use_ids = {use["id"] for use in key["uses"]}
                if unlock["id"] not in use_ids:
                    vs.append(V("internal_unlock_mismatch", unlock["id"],
                                f"door is not a use of key {kid}."))
                consumes = bool(unlock.get("consumes_key"))
                if consumes != bool(key.get("consumed_when_used")):
                    vs.append(V("internal_unlock_mismatch", unlock["id"],
                                f"door consume={consumes} but key {kid} consumed_when_used={key.get('consumed_when_used')}."))
            if unlock.get("kind") == "boss":
                boss = bosses.get(unlock.get("boss_id"))
                if boss is None or boss.get("dungeon") != dungeon["id"]:
                    vs.append(V("internal_unlock_mismatch", unlock["id"],
                                "boss id missing or pointed at another dungeon."))
                elif unlock.get("requires_tools"):
                    reward = boss.get("reward")
                    record = tools.get(reward) or crowns.get(reward)
                    if record and set(unlock.get("requires_tools") or []) != set(record.get("requires_tools") or []):
                        vs.append(V("internal_unlock_mismatch", unlock["id"],
                                    f"boss cost {unlock.get('requires_tools')} != reward record {record.get('requires_tools')}."))
    for key in model["keys"]:
        for use in key["uses"]:
            if use["id"] not in door_ids:
                vs.append(V("internal_unlock_mismatch", key["id"],
                            f"use {use['id']} has no matching dungeon door."))
    return vs


def check_campaign_and_census(model):
    vs = []
    districts = [loc for loc in model["locations"] if loc["kind"] == "district"]
    if len(districts) != 12:
        vs.append(V("census_mismatch", "districts", f"expected 12, found {len(districts)}"))
    if len(model["dungeons"]) != 16:
        vs.append(V("census_mismatch", "dungeons", f"expected 16, found {len(model['dungeons'])}"))
    if len(model["endings"]) != 4:
        vs.append(V("census_mismatch", "endings", f"expected 4, found {len(model['endings'])}"))
    if len(model["tools"]) != 12:
        vs.append(V("census_mismatch", "tools", f"expected 12, found {len(model['tools'])}"))
    if len(model["forms"]) != 4:
        vs.append(V("census_mismatch", "forms", f"expected 4, found {len(model['forms'])}"))
    if [f["id"] for f in model["forms"]] != [
        "mortal-wanderer", "otter-creek-smuggler", "rutland-officer", "embryonic-god"
    ]:
        vs.append(V("census_mismatch", "form-ids", "form id set drifted from the brief"))
    missing, _ = campaign_missing(model)
    if missing:
        vs.append(V("campaign_unreachable", "trunk", ", ".join(missing)))
    # Dangling references.
    locs = model["_loc_ids"]
    tools = set(model["_tool"])
    flags = set(model["_flag"])
    crowns = set(model["_crown"])
    npcs = set(model["_npc"])
    for e in model["edges"]:
        for end in (e["a"], e["b"]):
            if end != "*" and end not in locs:
                vs.append(V("dangling_reference", e["id"], f"unknown location {end}"))
        for t in e.get("requires_tools") or []:
            if t not in tools:
                vs.append(V("dangling_reference", e["id"], f"unknown tool {t}"))
    for t in model["tools"]:
        if t.get("found_at") and t["found_at"] not in locs:
            vs.append(V("dangling_reference", t["id"], f"found_at {t['found_at']} missing"))
        for req in t.get("requires_tools") or []:
            if req not in tools:
                vs.append(V("dangling_reference", t["id"], f"requires unknown tool {req}"))
    for n in model["npcs"]:
        if n["location"] not in locs:
            vs.append(V("dangling_reference", n["id"], "location missing"))
        for s in n.get("successors") or []:
            if s not in npcs:
                vs.append(V("dangling_reference", n["id"], f"successor {s} missing"))
        for f in n.get("grants_flags") or []:
            if f not in flags:
                vs.append(V("dangling_reference", n["id"], f"flag {f} missing"))
    for c in model["crowns"]:
        if c["found_at"] not in locs:
            vs.append(V("dangling_reference", c["id"], "found_at missing"))
    for src in model["flag_sources"]:
        if src["at"] not in locs:
            vs.append(V("dangling_reference", src["flag"], "source location missing"))
        if src["flag"] not in flags:
            vs.append(V("dangling_reference", src["flag"], "unknown flag"))
    _ = crowns
    return vs


def check(model: dict) -> list:
    model = index_model(model)
    vs = []
    vs += check_campaign_and_census(model)
    vs += check_tool_locks(model)
    vs += check_keys(model)
    vs += check_npcs(model)
    vs += check_death_flags(model)
    vs += check_form_strands(model)
    vs += check_endings(model)
    vs += check_optional(model)
    vs += check_warps(model)
    vs += check_bosses(model)
    vs += check_years(model)
    vs += check_internal(model)
    return vs


def explore_core(model: dict) -> dict:
    """Exhaustive BFS of the bounded core projection. Deterministic."""
    model = index_model(model)
    core = model["core"]
    core_locs = list(core["locations"])
    core_set = set(core_locs)
    for loc in core_locs:
        if loc not in model["_loc_ids"]:
            raise RuntimeError(f"core location {loc} is not on the reference map")
    tool_ids = list(core["tools"])
    if tool_ids != ["grave-shovel", "sugar-line-hookshot", "creek-fins"]:
        raise RuntimeError("core tool list drifted; bounds would change")
    pairs = [tuple(p) for p in core["year_form_pairs"]]
    if pairs != [
        (0, "mortal-wanderer"),
        (14, "otter-creek-smuggler"),
        (14, "rutland-officer"),
        (28, "otter-creek-smuggler"),
        (28, "rutland-officer"),
    ]:
        raise RuntimeError("core year/form bounds drifted")
    n_bits = len(core["tracked_bits"])
    if n_bits != 5 or len(core_locs) != 10:
        raise RuntimeError("core bound shape drifted")
    domain = len(core_locs) * (2 ** n_bits) * len(pairs)
    # State: (loc, shovel, hook, fins, mayor, crypt, year, form)
    start = ("middlebury-green", 0, 0, 0, 0, 0, 0, "mortal-wanderer")
    parent = {start: None}
    action_of = {start: "start"}
    q = deque([start])
    death_flag_drops = 0
    death_transitions = 0
    latent_exit_deaths = 0
    duplicate_reward_transitions = 0
    idempotent_reentries = 0
    boss = model["_boss"]["crypt-warden"]
    if boss["location"] != "grave-crypt-heart":
        raise RuntimeError("crypt warden is not at grave-crypt-heart")
    shovel = model["_tool"]["grave-shovel"]
    hook = model["_tool"]["sugar-line-hookshot"]
    fins_tool = model["_tool"]["creek-fins"]
    if shovel["found_at"] != "grave-crypt" or hook["found_at"] != "cornwall-flats":
        raise RuntimeError("core pickups no longer match the reference tool sites")
    if fins_tool["found_at"] != "ferrisburgh-shore" or fins_tool.get("requires_tools"):
        raise RuntimeError("fins are no longer a free shore pickup")
    if "grave-shovel" not in set(hook.get("requires_tools") or []):
        raise RuntimeError("hookshot no longer requires the shovel; core rules changed")
    cleared = set(model["death"].get("flags_cleared") or [])
    mayor_npcs = [n for n in model["npcs"] if "mayor-spoken" in n.get("grants_flags", [])]

    def talk_possible(loc, year, mayor):
        if mayor or loc != "vergennes-falls":
            return False
        return any(year in n.get("alive_eras", []) and n["location"] == loc for n in mayor_npcs)

    while q:
        state = q.popleft()
        loc, sh, hk, fins, mayor, crypt, year, form = state
        tools = set()
        if sh:
            tools.add("grave-shovel")
        if hk:
            tools.add("sugar-line-hookshot")
        if fins:
            tools.add("creek-fins")
        flags = {"mayor-spoken"} if mayor else set()
        moves = []
        for edge in model["_adj"].get(loc, []):
            if edge["to"] not in core_set:
                continue
            if edge_passable(model, edge, tools, form, flags, set()):
                moves.append(edge["to"])
        moves = sorted(set(moves))
        children = []
        for dest in moves:
            children.append((f"move:{dest}", (dest, sh, hk, fins, mayor, crypt, year, form)))
        if loc == shovel["found_at"] and not sh:
            if set(shovel.get("requires_tools") or []) <= tools:
                children.append(("pickup:grave-shovel", (loc, 1, hk, fins, mayor, crypt, year, form)))
        if loc == hook["found_at"] and not hk:
            if set(hook.get("requires_tools") or []) <= tools:
                children.append(("pickup:sugar-line-hookshot", (loc, sh, 1, fins, mayor, crypt, year, form)))
        if loc == fins_tool["found_at"] and not fins:
            if set(fins_tool.get("requires_tools") or []) <= tools:
                children.append(("pickup:creek-fins", (loc, sh, hk, 1, mayor, crypt, year, form)))
        if talk_possible(loc, year, mayor):
            children.append(("talk:mayor-spoken", (loc, sh, hk, fins, 1, crypt, year, form)))
        if loc == boss["location"] and sh and not crypt:
            children.append(("boss:first-clear", (loc, sh, hk, fins, mayor, 1, year, form)))
        if loc == boss["location"] and sh and crypt:
            if boss.get("reentry_grants_reward"):
                duplicate_reward_transitions += 1
            else:
                idempotent_reentries += 1
        if year < int(core["max_year_inclusive"]):
            new_year = year + int(model["death"]["advance_years"])
            if new_year > int(core["max_year_inclusive"]):
                latent_exit_deaths += 1
            else:
                new_mayor = 0 if (mayor and "mayor-spoken" in cleared) else mayor
                if mayor and not new_mayor:
                    death_flag_drops += 1
                death_transitions += 1
                children.append((
                    "die:smuggler",
                    (model["death"]["respawn"], sh, hk, fins, new_mayor, crypt, new_year, "otter-creek-smuggler"),
                ))
                if new_mayor:
                    death_transitions += 1
                    children.append((
                        "die:officer",
                        (model["death"]["respawn"], sh, hk, fins, new_mayor, crypt, new_year, "rutland-officer"),
                    ))
        else:
            latent_exit_deaths += 1
        for act, child in children:
            if child[6] == 0 and child[7] != "mortal-wanderer":
                raise RuntimeError("illegal child")
            if child[6] != 0 and child[7] == "mortal-wanderer":
                raise RuntimeError("wanderer survived death")
            if child not in parent:
                parent[child] = state
                action_of[child] = act
                q.append(child)

    reachable = list(parent.keys())

    def is_goal(s):
        loc, sh, hk, _fins, mayor, crypt, year, form = s
        g = core["goal"]
        return (loc == g["location"] and sh and hk and mayor and crypt and year == g["year"]
                and form in ("otter-creek-smuggler", "rutland-officer"))

    goals = [s for s in reachable if is_goal(s)]
    witness = None
    if goals:
        best = None
        best_actions = None
        for gstate in goals:
            actions = []
            cur = gstate
            while parent[cur] is not None:
                actions.append(action_of[cur])
                cur = parent[cur]
            actions.reverse()
            if best is None or (len(actions), actions) < (len(best_actions), best_actions):
                best = gstate
                best_actions = actions
        witness = best_actions

    def count_if(pred):
        return sum(1 for s in reachable if pred(s))

    late_grant = False
    early_persist = False
    for s in reachable:
        loc, _sh, _hk, _fins, mayor, _crypt, year, _form = s
        if year == 28 and loc == "vergennes-falls" and mayor == 0 and talk_possible(loc, year, 0):
            late_grant = True
        if year == 28 and mayor == 1:
            early_persist = True
    pair_set = set(pairs)
    invariants = {
        "all_states_admissible": all((s[6], s[7]) in pair_set and s[0] in core_set for s in reachable),
        "no_officer_without_flag": count_if(lambda s: s[7] == "rutland-officer" and s[4] == 0) == 0,
        "no_wanderer_in_creek_without_fins": count_if(
            lambda s: s[7] == "mortal-wanderer" and s[0] == "creek-channel" and s[3] == 0
        ) == 0,
        "no_officer_in_creek_without_fins": count_if(
            lambda s: s[7] == "rutland-officer" and s[0] == "creek-channel" and s[3] == 0
        ) == 0,
        "officer_reaches_creek_with_fins": count_if(
            lambda s: s[7] == "rutland-officer" and s[0] == "creek-channel" and s[3] == 1
        ) > 0,
        "smuggler_reaches_creek_without_fins": count_if(
            lambda s: s[7] == "otter-creek-smuggler" and s[0] == "creek-channel" and s[3] == 0
        ) > 0,
        "no_lake_without_fins": count_if(lambda s: s[0] == "lake-cut" and s[3] == 0) == 0,
        "wanderer_reaches_lake_with_fins": count_if(
            lambda s: s[7] == "mortal-wanderer" and s[0] == "lake-cut" and s[3] == 1
        ) > 0,
        "smuggler_reaches_lake_only_with_fins": count_if(
            lambda s: s[7] == "otter-creek-smuggler" and s[0] == "lake-cut" and s[3] == 1
        ) > 0,
        "wanderer_reaches_hook_span_with_hookshot": count_if(
            lambda s: s[7] == "mortal-wanderer" and s[0] == "hook-span" and s[2] == 1
        ) > 0,
        "no_heart_without_shovel": count_if(lambda s: s[0] == "grave-crypt-heart" and s[1] == 0) == 0,
        "late_successor_window": late_grant,
        "flag_survives_into_year_28": early_persist,
        "death_flag_drops": death_flag_drops,
        "duplicate_reward_transitions": duplicate_reward_transitions,
    }
    by_year = {0: 0, 14: 0, 28: 0}
    for s in reachable:
        by_year[s[6]] += 1
    formula = f"{len(core_locs)} locations * 2^{n_bits} bits * {len(pairs)} year-form pairs = {domain}"
    return {
        "projection": "core",
        "exhaustive": True,
        "full_game_exhaustive": False,
        "locations": core_locs,
        "tracked_bits": list(core["tracked_bits"]),
        "year_form_pairs": pairs,
        "representation_domain": domain,
        "domain_formula": formula,
        "reachable_states": len(reachable),
        "unreachable_admissible_states": domain - len(reachable),
        "by_year": by_year,
        "goal_reached": bool(goals),
        "goal_state_count": len(goals),
        "witness_actions": witness,
        "witness_length": None if witness is None else len(witness),
        "death_transitions_inside_core": death_transitions,
        "latent_deaths_exiting_core": latent_exit_deaths,
        "idempotent_boss_reentries_observed": idempotent_reentries,
        "duplicate_reward_transitions": duplicate_reward_transitions,
        "death_flag_drops": death_flag_drops,
        "invariants": invariants,
        "excluded": list(core["excluded"]),
    }


def _edge(model, eid):
    for e in model["edges"]:
        if e["id"] == eid:
            return e
    raise KeyError(eid)


def _tool(model, tid):
    for t in model["tools"]:
        if t["id"] == tid:
            return t
    raise KeyError(tid)


def _npc(model, nid):
    for n in model["npcs"]:
        if n["id"] == nid:
            return n
    raise KeyError(nid)


def _form(model, fid):
    for f in model["forms"]:
        if f["id"] == fid:
            return f
    raise KeyError(fid)


def _ending(model, eid):
    for e in model["endings"]:
        if e["id"] == eid:
            return e
    raise KeyError(eid)


def _boss(model, bid):
    for b in model["bosses"]:
        if b["id"] == bid:
            return b
    raise KeyError(bid)


def _key(model, kid):
    for k in model["keys"]:
        if k["id"] == kid:
            return k
    raise KeyError(kid)


def make_fixtures(base: dict) -> list:
    specs = []

    m = copy.deepcopy(base)
    _edge(m, "bn-ns")["requires_tools"] = ["gap-boots"]
    m["meta"] = {**m["meta"], "id": "broken-01-tool-self-lock",
                 "expect_violations": ["tool_self_lock"],
                 "forbid_violations": ["tool_cycle_lock"],
                 "injected": "The only edge into notch-span, where gap boots are found, requires gap boots."}
    specs.append(("01_tool_self_lock.json", m))

    m = copy.deepcopy(base)
    _key(m, "crypt-iron-key")["uses"] = [
        {"id": "optional-ossuary", "mandatory": False, "order": 1, "can_precede_mandatory": True},
        {"id": "warden-door", "mandatory": True, "order": 2, "can_precede_mandatory": False},
    ]
    m["meta"] = {**m["meta"], "id": "broken-02-key-consumed-early",
                 "expect_violations": ["key_consumed_before_mandatory_use"],
                 "forbid_violations": [],
                 "injected": "Single consumed crypt key can be spent on an optional ossuary before the mandatory warden door."}
    specs.append(("02_key_consumed_early.json", m))

    m = copy.deepcopy(base)
    m["npcs"] = [n for n in m["npcs"] if n["id"] != "clerk-ida-ross"]
    _npc(m, "mayor-hester-lane")["successors"] = []
    m["meta"] = {**m["meta"], "id": "broken-03-npc-no-successor",
                 "expect_violations": ["essential_npc_no_successor"],
                 "forbid_violations": ["campaign_unreachable"],
                 "injected": "Mayor Lane dies entering year 28 and Clerk Ross is gone, so mayor-spoken has no grantor from era 28 on."}
    specs.append(("03_npc_no_successor.json", m))

    m = copy.deepcopy(base)
    m["death"]["flags_cleared"] = ["scent-of-smoke", "mayor-spoken"]
    for fl in m["quest_flags"]:
        if fl["id"] == "mayor-spoken":
            fl["persists_on_death"] = False
    m["meta"] = {**m["meta"], "id": "broken-04-death-erases-flag",
                 "expect_violations": ["death_erases_required_flag"],
                 "forbid_violations": [],
                 "injected": "Death clears mayor-spoken, which the trunk and the mortal endings require."}
    specs.append(("04_death_erases_flag.json", m))

    m = copy.deepcopy(base)
    _form(m, "embryonic-god")["movement"] = ["void"]
    m["meta"] = {**m["meta"], "id": "broken-05-form-strands",
                 "expect_violations": ["form_change_strands_player"],
                 "forbid_violations": [],
                 "injected": "Embryonic God loses ground and water. The ridge shrine exit is a ground edge, and Middlebury has no void edge."}
    specs.append(("05_form_strands.json", m))

    m = copy.deepcopy(base)
    _ending(m, "long-homestead")["requirements"] = [
        {"kind": "form", "id": "otter-creek-smuggler"},
        {"kind": "form", "id": "rutland-officer"},
        {"kind": "year_min", "value": 70},
    ]
    m["meta"] = {**m["meta"], "id": "broken-06-ending-two-forms",
                 "expect_violations": ["ending_mutually_exclusive_states"],
                 "forbid_violations": ["campaign_unreachable"],
                 "injected": "The Long Homestead ending requires the smuggler body and the officer body at once."}
    specs.append(("06_ending_exclusive_forms.json", m))

    m = copy.deepcopy(base)
    m["optional_choices"].append({
        "id": "pawn-grave-shovel", "optional": True, "recovery_id": None,
        "effects": [{"op": "destroy_tool", "id": "grave-shovel"}],
        "notes": "Optional pawn. The shovel is not repeatable.",
    })
    m["meta"] = {**m["meta"], "id": "broken-07-optional-blocks",
                 "expect_violations": ["optional_choice_blocks_main"],
                 "forbid_violations": ["tool_self_lock"],
                 "injected": "Optional, irreversible pawn destroys the grave shovel and blocks the trunk."}
    specs.append(("07_optional_blocks_main.json", m))

    m = copy.deepcopy(base)
    m["edges"].append({
        "id": "illegal-void-skip", "a": "middlebury-green", "b": "void-terminal", "terrain": "void",
        "directed": True, "is_warp": True, "requires_tools": [], "requires_flags": [],
        "requires_crowns": [], "requires_forms": [], "grants_completion": True,
        "notes": "Debug warp from the green onto the ending.",
    })
    m["meta"] = {**m["meta"], "id": "broken-08-warp-bypass",
                 "expect_violations": ["warp_bypasses_mandatory"],
                 "forbid_violations": ["campaign_unreachable"],
                 "injected": "A warp from Middlebury Green to the void terminal grants completion with no prerequisites."}
    specs.append(("08_warp_bypass.json", m))

    m = copy.deepcopy(base)
    _boss(m, "creek-warden")["reentry_grants_reward"] = True
    m["meta"] = {**m["meta"], "id": "broken-09-boss-reentry",
                 "expect_violations": ["boss_reentry_duplicates_rewards"],
                 "forbid_violations": ["campaign_unreachable"],
                 "injected": "Creek warden may be fought again and pays the unique crown twice."}
    specs.append(("09_boss_reentry_dup.json", m))

    m = copy.deepcopy(base)
    m["era_rules"]["post_principal_policy"]["supported"] = False
    m["objectives"].append({
        "id": "unauthored-epilogue", "required_for_main": True, "year_min": 84,
        "notes": "Mandatory content placed past the six principal eras.",
    })
    m["meta"] = {**m["meta"], "id": "broken-10-years-beyond",
                 "expect_violations": ["years_beyond_principal_eras"],
                 "forbid_violations": ["era_table_mismatch"],
                 "injected": "Year 70 death has no support, and a required objective demands year 84."}
    specs.append(("10_years_beyond.json", m))

    m = copy.deepcopy(base)
    _key(m, "crypt-iron-key")["uses"] = [
        {"id": "warden-door", "mandatory": True, "order": 1, "can_precede_mandatory": False},
        {"id": "relic-door", "mandatory": True, "order": 2, "can_precede_mandatory": False},
    ]
    m["meta"] = {**m["meta"], "id": "broken-11-key-two-mandatory",
                 "expect_violations": ["key_consumed_before_mandatory_use"],
                 "forbid_violations": [],
                 "injected": "One consumed key is the only copy for two mandatory doors."}
    specs.append(("11_key_two_mandatory.json", m))

    m = copy.deepcopy(base)
    _ending(m, "officers-quiet")["requirements"] = [
        {"kind": "year_min", "value": 42},
        {"kind": "form", "id": "rutland-officer"},
        {"kind": "flag", "id": "mayor-spoken", "equals": True},
        {"kind": "flag", "id": "mayor-spoken", "equals": False},
    ]
    m["meta"] = {**m["meta"], "id": "broken-12-ending-exclusive-flags",
                 "expect_violations": ["ending_mutually_exclusive_states"],
                 "forbid_violations": ["campaign_unreachable"],
                 "injected": "Officer's Quiet requires mayor-spoken to be both true and false."}
    specs.append(("12_ending_exclusive_flags.json", m))

    m = copy.deepcopy(base)
    _npc(m, "clerk-ida-ross")["alive_eras"] = [28]
    _npc(m, "clerk-ida-ross")["dies_when"] = ["enter-year-42"]
    _npc(m, "clerk-ida-ross")["successors"] = []
    m["meta"] = {**m["meta"], "id": "broken-13-successor-dies",
                 "expect_violations": ["essential_npc_no_successor"],
                 "forbid_violations": ["campaign_unreachable"],
                 "injected": "Clerk Ross dies entering year 42 and names no further successor, so eras 42, 56, 70, and post have no grantor."}
    specs.append(("13_successor_dies.json", m))

    m = copy.deepcopy(base)
    m["optional_choices"].append({
        "id": "silence-both-speakers", "optional": True, "recovery_id": None,
        "effects": [{"op": "kill_npc", "ids": ["mayor-hester-lane", "clerk-ida-ross"]}],
        "notes": "Optional feud. Removes both grantors of mayor-spoken.",
    })
    m["meta"] = {**m["meta"], "id": "broken-14-optional-kills-speakers",
                 "expect_violations": ["optional_choice_blocks_main"],
                 "forbid_violations": ["essential_npc_no_successor"],
                 "injected": "The NPC table still covers every era until the player takes this optional feud, which kills both speakers."}
    specs.append(("14_optional_kills_speakers.json", m))

    m = copy.deepcopy(base)
    _tool(m, "sugar-line-hookshot")["requires_tools"] = ["grave-shovel", "oil-lamp"]
    _tool(m, "oil-lamp")["requires_tools"] = ["sugar-line-hookshot"]
    for dungeon in m["dungeons"]:
        for unlock in dungeon["internal_unlocks"]:
            if unlock.get("grants") == "sugar-line-hookshot":
                unlock["requires_tools"] = ["grave-shovel", "oil-lamp"]
            if unlock.get("grants") == "oil-lamp":
                unlock["requires_tools"] = ["sugar-line-hookshot"]
    m["meta"] = {**m["meta"], "id": "broken-15-tool-cycle",
                 "expect_violations": ["tool_cycle_lock"],
                 "forbid_violations": ["tool_self_lock", "internal_unlock_mismatch"],
                 "injected": "Hookshot requires the lamp and the lamp requires the hookshot. The dungeon text matches the tool records, so this is a cycle rather than a bookkeeping drift."}
    specs.append(("15_tool_cycle.json", m))

    m = copy.deepcopy(base)
    for dungeon in m["dungeons"]:
        if dungeon["id"] != "grave-crypt":
            continue
        for unlock in dungeon["internal_unlocks"]:
            if unlock.get("grants") == "grave-shovel":
                unlock["requires_tools"] = ["grave-shovel"]
    m["meta"] = {**m["meta"], "id": "broken-16-internal-drift",
                 "expect_violations": ["internal_unlock_mismatch"],
                 "forbid_violations": ["tool_self_lock", "campaign_unreachable"],
                 "injected": "The crypt's internal cairn says the shovel requires itself. The solver tool record does not, so the two layers disagree."}
    specs.append(("16_internal_unlock_drift.json", m))

    m = copy.deepcopy(base)
    m["era_rules"]["post_principal_policy"]["respawn"] = "void-terminal"
    m["meta"] = {**m["meta"], "id": "broken-17-post-era-strand",
                 "expect_violations": ["years_beyond_principal_eras"],
                 "forbid_violations": ["campaign_unreachable", "form_change_strands_player"],
                 "injected": "Death past year 70 is marked supported, but it respawns a mortal body inside the void terminal."}
    specs.append(("17_post_era_strand.json", m))
    return specs


def codes(vs) -> set:
    return {v["code"] for v in vs}


def prove() -> int:
    FIXTURE_DIR.mkdir(parents=True, exist_ok=True)
    base = build_baseline()
    BASELINE_PATH.write_text(json.dumps(base, indent=2) + "\n", encoding="utf-8")
    specs = make_fixtures(base)
    for name, model in specs:
        (FIXTURE_DIR / name).write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")

    loaded = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    base_vs = check(loaded)
    exploration = explore_core(loaded)
    inv = exploration["invariants"]
    problems = []
    if base_vs:
        problems.append("baseline has violations: " + json.dumps(base_vs, indent=2))
    if exploration["representation_domain"] != 1600:
        problems.append(f"domain {exploration['representation_domain']} != 1600")
    if not exploration["goal_reached"]:
        problems.append("core goal not reached")
    if exploration["reachable_states"] <= 268 or exploration["reachable_states"] > 1600:
        problems.append("reachable count out of bounds")
    indexed = index_model(loaded)
    ending_lines = []
    for ending in indexed["endings"]:
        ok, why = witness_ending(indexed, ending)
        ending_lines.append(f"{ending['id']}: {'ok' if ok else why}")
        if not ok:
            problems.append(f"ending witness failed: {ending['id']} {why}")
    for key, val in inv.items():
        if key in ("death_flag_drops", "duplicate_reward_transitions"):
            if val != 0:
                problems.append(f"invariant {key}={val}")
        elif val is not True:
            problems.append(f"invariant {key} failed: {val}")
    # Ending witnesses on the clean model are part of check(); base_vs empty covers them.
    missing, acq = campaign_missing(index_model(loaded))
    if missing:
        problems.append("campaign missing " + ",".join(missing))

    fixture_rows = []
    coverage = set()
    for name, _model in specs:
        path = FIXTURE_DIR / name
        fx = json.loads(path.read_text(encoding="utf-8"))
        vs = check(fx)
        got = codes(vs)
        expect = set(fx["meta"]["expect_violations"])
        forbid = set(fx["meta"].get("forbid_violations") or [])
        rejected = bool(got) and expect <= got and not (forbid & got)
        if not rejected:
            problems.append(f"{name}: expect {sorted(expect)} forbid {sorted(forbid)} got {sorted(got)}")
        coverage |= got
        fixture_rows.append({
            "file": name,
            "id": fx["meta"]["id"],
            "injected": fx["meta"]["injected"],
            "expect": sorted(expect),
            "got": sorted(got),
            "rejected": rejected,
            "details": vs,
        })
    for code in TEN:
        if code not in coverage:
            problems.append(f"no fixture produced {code}")

    report = {
        "status": "proposed-reference-model",
        "verifies_runtime": False,
        "baseline_violations": base_vs,
        "baseline_clean": not base_vs,
        "campaign_tools": sorted(acq.tools),
        "campaign_flags": sorted(acq.flags),
        "campaign_crowns": sorted(acq.crowns),
        "phase2_ran": acq.phase2,
        "exploration": {k: v for k, v in exploration.items() if k != "witness_actions"},
        "witness_actions": exploration["witness_actions"],
        "ending_witnesses": ending_lines,
        "fixtures": [
            {k: row[k] for k in ("file", "id", "injected", "expect", "got", "rejected")}
            for row in fixture_rows
        ],
        "fixture_count": len(fixture_rows),
        "ten_codes_covered": sorted(coverage & set(TEN)),
        "problems": problems,
    }
    (ROOT / "last-proof.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    lines = []
    lines.append("PREINCARNATION progression proof")
    lines.append("status: proposed reference model; verifies_runtime: false")
    lines.append(f"baseline_clean: {not base_vs}")
    if base_vs:
        lines.append("BASELINE VIOLATIONS:")
        lines.append(json.dumps(base_vs, indent=2))
    lines.append(
        f"campaign tools ({len(acq.tools)}): {', '.join(sorted(acq.tools))}"
    )
    lines.append(f"campaign flags: {', '.join(sorted(acq.flags))}")
    lines.append(f"campaign crowns: {', '.join(sorted(acq.crowns))}")
    lines.append(
        f"core domain: {exploration['domain_formula']} = {exploration['representation_domain']}"
    )
    lines.append(
        f"core reachable: {exploration['reachable_states']}  "
        f"unreachable admissible: {exploration['unreachable_admissible_states']}  "
        f"by year: {exploration['by_year']}"
    )
    lines.append(f"core goal_reached: {exploration['goal_reached']}  goal_states: {exploration['goal_state_count']}  witness_length: {exploration['witness_length']}")
    lines.append("witness: " + " | ".join(exploration["witness_actions"] or []))
    lines.append("ending witnesses: " + "; ".join(ending_lines))
    lines.append(
        f"idempotent reentries observed: {exploration['idempotent_boss_reentries_observed']}  "
        f"duplicate rewards: {exploration['duplicate_reward_transitions']}  "
        f"death flag drops: {exploration['death_flag_drops']}  "
        f"latent deaths leaving core: {exploration['latent_deaths_exiting_core']}"
    )
    lines.append("invariants: " + json.dumps(inv, sort_keys=True))
    lines.append("")
    lines.append(f"fixtures: {len(fixture_rows)}")
    for row in fixture_rows:
        mark = "REJECT" if row["rejected"] else "FAIL"
        lines.append(f"  {mark}  {row['file']}  expect={row['expect']}  got={row['got']}")
    lines.append("")
    if problems:
        lines.append("PROBLEMS:")
        for p in problems:
            lines.append("  - " + p)
    else:
        lines.append("PROBLEMS: none")
        lines.append("All ten required detectors fired on at least one broken model.")
        lines.append("The corrected baseline produced zero violations.")
    text = "\n".join(lines) + "\n"
    (ROOT / "proof-output.txt").write_text(text, encoding="utf-8")
    sys.stdout.write(text)
    return 1 if problems else 0


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else "prove"
    if cmd == "prove":
        return prove()
    if cmd == "check":
        path = Path(argv[2]) if len(argv) > 2 else BASELINE_PATH
        vs = check(json.loads(path.read_text(encoding="utf-8")))
        json.dump(vs, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 1 if vs else 0
    if cmd == "explore":
        path = Path(argv[2]) if len(argv) > 2 else BASELINE_PATH
        report = explore_core(json.loads(path.read_text(encoding="utf-8")))
        json.dump(report, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0 if report["goal_reached"] else 1
    sys.stderr.write("usage: progression_checker.py [prove|check|explore] [model.json]\n")
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
