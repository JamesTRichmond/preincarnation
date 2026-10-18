import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";
import { DIALOGUE, ENDING_LINES, NPC_NODE, OBJECTIVES } from "../../src/game/content.ts";
import { creditsOnClose, selectNpcDialogue } from "../../src/game/dialogue-close.ts";
import { TOWNS } from "../../src/game/geography.ts";
import { INTERIOR_IDS } from "../../src/game/interiors.ts";
import { T } from "../../src/game/tile-ids.ts";
import { buildMap } from "../../src/game/maps.ts";
import { grantBondKeepsake, resolveDeath, wintersPassed } from "../../src/game/rules.ts";
import { clearSave, defaultSave, loadSave, writeSave } from "../../src/game/save.ts";
import { SAVE_KEY, SAVE_VERSION, type Flags } from "../../src/game/types.ts";

const here = dirname(fileURLToPath(import.meta.url));
const reportDir = join(here, "reports");
const engineSrc = readFileSync(join(here, "../../src/game/engine.ts"), "utf8");

const mem = new Map<string, string>();
const storage: Storage = {
  get length() {
    return mem.size;
  },
  clear() {
    mem.clear();
  },
  getItem(key: string) {
    return mem.has(key) ? mem.get(key)! : null;
  },
  key(index: number) {
    return [...mem.keys()][index] ?? null;
  },
  removeItem(key: string) {
    mem.delete(key);
  },
  setItem(key: string, value: string) {
    mem.set(key, value);
  },
};
(globalThis as { localStorage: Storage }).localStorage = storage;

const journeyLog: {
  id: string;
  status: "passed" | "blocked";
  transitions: string[];
  note: string;
}[] = [];

function record(id: string, status: "passed" | "blocked", transitions: string[], note: string) {
  journeyLog.push({ id, status, transitions, note });
}

function flags(): Flags {
  return structuredClone(defaultSave().flags);
}

describe("journey: new game → town → dungeon → reward → save/load", () => {
  it("walks the real Middlebury and Marble Vein contracts", () => {
    mem.clear();
    const fresh = defaultSave();
    assert.equal(fresh.mapId, "middlebury");
    assert.equal(fresh.version, SAVE_VERSION);
    assert.equal(fresh.character.name, "Ellis Perch");
    const town = buildMap(fresh.mapId, fresh.flags, fresh.cycle);
    const quarryWarp = town.props.find((p) => p.id === "to-quarry");
    const shovel = town.props.find((p) => p.relic === "shovel");
    assert.ok(quarryWarp?.warp?.map === "quarry");
    assert.ok(shovel);

    const dungeon = buildMap("quarry", fresh.flags, fresh.cycle);
    assert.ok(dungeon.props.some((p) => p.id === "sentinel" && p.enemy === "sentinel"));
    assert.ok(dungeon.props.some((p) => p.id === "chest-quarry"));
    assert.ok(dungeon.props.some((p) => p.id === "q-key"));

    const rewarded = structuredClone(fresh);
    rewarded.flags.sentinelFate = "release";
    rewarded.flags.townsCleared = ["quarry"];
    rewarded.flags.relics = [...rewarded.flags.relics, "cape"];
    rewarded.character.created = true;
    const after = buildMap("quarry", rewarded.flags, rewarded.cycle);
    assert.equal(after.props.some((p) => p.id === "sentinel"), false);
    assert.match(engineSrc, /relics\.includes\("cape"\)/);
    writeSave(rewarded);
    const loaded = loadSave();
    assert.equal(loaded.flags.townsCleared.includes("quarry"), true);
    assert.equal(loaded.flags.relics.includes("cape"), true);
    assert.equal(loaded.mapId, "middlebury");
    clearSave();
    assert.equal(mem.has(SAVE_KEY), false);
    record(
      "new-game-town-dungeon-reward-save",
      "passed",
      [
        "defaultSave → middlebury",
        "buildMap middlebury → to-quarry + shovel",
        "buildMap quarry → sentinel + chest-quarry + q-key",
        "sentinelFate release removes the sentinel prop",
        "writeSave/loadSave keeps cape and townsCleared",
      ],
      "Reward persistence is the save flag plus the cape relic the engine grants in choose(). The chest's spare-heart roll stays inside the canvas loop and was not simulated as a second reward.",
    );
  });
});

describe("journey: death → fourteen-year return → changed NPC", () => {
  it("ages the year and switches Maeve off the first-life line", () => {
    const s = defaultSave();
    s.character.bondId = "maeve";
    s.flags.lastDeed = "You spoke with Maeve on the Green";
    assert.equal(selectNpcDialogue("elder", s), "elder_bond");
    const winters = wintersPassed(() => 0);
    assert.equal(winters, 14);
    const dead = resolveDeath(s, { mapId: "middlebury", x: 160, y: 96 }, winters);
    grantBondKeepsake(dead);
    assert.equal(dead.cycle, 1);
    assert.equal(dead.flags.year, 2026 + 14);
    assert.equal(dead.flags.returnedFromDeath, true);
    assert.equal(dead.flags.ySlot, "lantern");
    const line = selectNpcDialogue("elder", dead);
    assert.equal(line, "elder_return");
    assert.notEqual(DIALOGUE.elder_return.text, DIALOGUE.elder_1.text);
    assert.notEqual(DIALOGUE.elder_return.text, DIALOGUE.elder_bond.text);
    assert.match(DIALOGUE[line!].text, /Fourteen winters/);
    assert.equal(NPC_NODE.elder, "elder_1");
    record(
      "death-fourteen-year-return-changed-npc",
      "passed",
      [
        "resolveDeath +14 winters",
        "grantBondKeepsake lantern",
        "selectNpcDialogue elder → elder_return",
      ],
      "NPC_NODE.elder is still the static id elder_1. The live contract is selectNpcDialogue, which the engine calls first. The static table was not rewritten.",
    );
  });
});

describe("journey: tool acquisition → newly reachable route", () => {
  it("opens the Marble Vein lock with the quarry key and does not pretend boots are a warp", () => {
    const base = flags();
    const before = buildMap("quarry", base, 0);
    const lock = before.props.find((p) => p.id === "q-lock-a");
    const key = before.props.find((p) => p.id === "q-key");
    assert.ok(lock);
    assert.ok(key);
    const opened = structuredClone(base);
    opened.chests = ["q-key", "q-lock-a"];
    const after = buildMap("quarry", opened, 0);
    assert.equal(after.props.some((p) => p.id === "q-key"), false);
    assert.equal(after.props.some((p) => p.id === "q-lock-a"), false);
    assert.equal(after.tiles[lock.y][lock.x], T.marble);

    const town = buildMap("middlebury", base, 0);
    const booted = structuredClone(base);
    booted.relics = [...booted.relics, "boots"];
    const townBoots = buildMap("middlebury", booted, 0);
    const warps = (props: { kind: string }[]) => props.filter((p) => p.kind === "warp").length;
    assert.equal(warps(town.props), warps(townBoots.props));
    assert.equal(townBoots.props.some((p) => p.relic === "boots"), false);
    assert.match(engineSrc, /relics\.includes\("boots"\)/);
    record(
      "tool-acquisition-newly-reachable-route",
      "passed",
      ["q-key + q-lock-a → lock prop removed, tile becomes marble"],
      "Gap boots remove their pickup and shorten the dash timer. They do not add a warp. That mismatch is logged; the key/lock route is the one this journey executed.",
    );
  });
});

describe("journey: boss completion → persistent reward", () => {
  it("keeps the quarry clear and the cape across a save", () => {
    mem.clear();
    const s = defaultSave();
    s.character.created = true;
    s.flags.sentinelFate = "crown";
    s.flags.townsCleared = ["quarry"];
    s.flags.relics = [...s.flags.relics, "cape"];
    s.flags.ySlot = "cape";
    const map = buildMap("quarry", s.flags, s.cycle);
    assert.equal(map.props.some((p) => p.enemy === "sentinel"), false);
    assert.equal(selectNpcDialogue("sentinel", s), "sentinel_crown");
    writeSave(s);
    const loaded = loadSave();
    assert.equal(loaded.flags.sentinelFate, "crown");
    assert.deepEqual(loaded.flags.townsCleared, ["quarry"]);
    assert.equal(loaded.flags.ySlot, "cape");
    assert.match(engineSrc, /The marble yields a cape/);
    record(
      "boss-completion-persistent-reward",
      "passed",
      ["sentinelFate crown → no sentinel prop", "writeSave/loadSave cape + townsCleared"],
      "The cape grant itself runs in engine choose() when the fate flag is applied. This journey checked that consequence against the map and the save, not a second combat simulator.",
    );
  });
});

describe("journey: ending eligibility → credits → post-completion load", () => {
  it("arms credits only from the existing Heart thread, then the save still loads", () => {
    assert.equal(creditsOnClose("heart_1", true), false);
    assert.equal(creditsOnClose("heart_release", false), false);
    assert.equal(creditsOnClose("heart_release", true), true);
    assert.equal(creditsOnClose("heart_bind", true), true);
    assert.equal(ENDING_LINES.length, 6);
    assert.equal(OBJECTIVES.ending, "There is no ending. Walk.");
    const endingNodes = Object.keys(DIALOGUE).filter((id) => id.startsWith("ending"));
    assert.deepEqual(endingNodes, []);
    assert.match(engineSrc, /creditsOnClose/);
    assert.match(engineSrc, /finishCredits:\s*\(\)\s*=>\s*\{[\s\S]*?birthIntoWorld\(\)/);

    mem.clear();
    const s = defaultSave();
    s.character.created = true;
    s.cycle = 3;
    s.flags.spectrumFate = "release";
    s.flags.townsCleared = ["quarry"];
    s.upgrades.soloverseKey = true;
    writeSave(s);
    const loaded = loadSave();
    assert.equal(loaded.flags.spectrumFate, "release");
    assert.equal(loaded.cycle, 3);
    assert.equal(loaded.upgrades.soloverseKey, true);
    record(
      "ending-credits-post-completion-load",
      "passed",
      [
        "spectrum fate arms credits",
        "heart_release close enters ending mode",
        "finishCredits calls birthIntoWorld",
        "writeSave/loadSave keeps spectrumFate",
      ],
      "One credits sequence existed in ENDING_LINES and the ending overlay, but nothing set mode to ending. The adapter arms it from the Heart fate already in dialogue. Four campaign endings were not in the content and were not added. OBJECTIVES.ending remains 'There is no ending. Walk.'",
    );
  });
});

describe("campaign packs that are not on disk", () => {
  it("does not invent districts, dungeons, eras, or endings to fill the brief", () => {
    const addisonTowns = TOWNS.filter((t) => t.county === "addison").map((t) => t.id);
    const outside = TOWNS.filter((t) => t.county !== "addison").map((t) => t.id);
    const dungeons = ["quarry", "int_cave", "soloverse"].filter((id) => {
      if (id === "int_cave") return INTERIOR_IDS.includes("int_cave");
      return TOWNS.some((t) => t.id === id) || id === "soloverse";
    });
    assert.ok(addisonTowns.length < 12);
    assert.ok(dungeons.length < 16);
    assert.ok(outside.length > 0);
    assert.equal(dungeons.includes("invented-dungeon"), false);
    record(
      "expanded-campaign-pack",
      "blocked",
      [],
      `Present Addison-pinned places: ${addisonTowns.join(", ")}. Places outside Addison: ${outside.join(", ")}. Dungeon-like maps found: ${dungeons.join(", ")}. No 12-district, 16-dungeon, 6-era, or 4-ending pack was in the repo or the workspace. None were synthesized.`,
    );
  });
});

after(() => {
  mkdirSync(reportDir, { recursive: true });
  const addison = TOWNS.filter((t) => t.county === "addison");
  const outside = TOWNS.filter((t) => t.county !== "addison");
  const conflicts = [
    {
      id: "county-scope",
      kind: "world-scope",
      status: "unresolved-kept",
      detail:
        "The brief says the campaign takes place only in Addison County. geography.ts also pins " +
        outside.map((t) => t.name + " (" + t.county + ")").join(", ") +
        ". Those maps stay. They were not deleted to satisfy the brief.",
    },
    {
      id: "npc-node-vs-cycle",
      kind: "event-contract",
      status: "adapter",
      detail:
        "NPC_NODE.elder is elder_1. The engine previously special-cased cycle and fate beside that table. selectNpcDialogue is now the function both the engine and the journey test call. NPC_NODE is unchanged and remains the fallback for NPCs without a cycle line.",
    },
    {
      id: "ending-mode-unarmed",
      kind: "event-contract",
      status: "adapter",
      detail:
        "ENDING_LINES and the ending overlay existed, and sim() already advanced ending beats, but nothing assigned mode = 'ending'. creditsOnClose arms that mode from the existing Heart fate (heart_release / heart_bind). No fourth ending was written. OBJECTIVES.ending is still 'There is no ending. Walk.'",
    },
    {
      id: "boots-are-not-a-route",
      kind: "inventory-name",
      status: "logged",
      detail:
        "Gap boots are a dash timer (engine) and a pickup on the Middlebury map. Acquiring them does not add a warp. The quarry key opens q-lock-a; that is the tool→route transition that was executed.",
    },
    {
      id: "tanstack-floor",
      kind: "dependency",
      status: "kept-workspace-pin",
      detail:
        "Upstream package-lock resolved @tanstack/react-start 1.168.50, below the 1.168.60 security floor. This candidate keeps the workspace pin ^1.168.60 and does not restore the older lock.",
    },
    {
      id: "missing-expanded-packs",
      kind: "missing-dependency",
      status: "blocked",
      detail:
        "GitHub JamesTRichmond/preincarnation has one branch (main) and one commit (c737e42). No progression, save-fixture, dungeon, world-map, narrative, combat, or QA pack from another session was found. The brief's 12 districts, 16 dungeons, 6 eras, and 4 endings are not in the tree. They were not invented.",
    },
    {
      id: "project-mount-artifacts",
      kind: "provenance",
      status: "refused",
      detail:
        "The project mount artifacts/ contains Stay clicklist/ledger HTML and three unrelated generated images. They do not match the git artifacts (education notes, strange-device, sprite refs). They were not adapted into game ids and were not staged.",
    },
    {
      id: "grave-coordinates",
      kind: "coordinates",
      status: "compatible",
      detail:
        "Graves store pixel x/y. County map placement divides by 16, which equals TILE in snes.ts. No second unit was found.",
    },
    {
      id: "save-flags",
      kind: "save-flag",
      status: "compatible",
      detail:
        "Save version is " +
        SAVE_VERSION +
        " under localStorage key " +
        SAVE_KEY +
        ". Journey round-trips used writeSave/loadSave. No second save schema was present to reconcile.",
    },
  ];
  const payload = {
    candidate: "integration/grok-11",
    base: "c737e42eb188148291438dfb8a5993d6ce2b77fa",
    source: "https://github.com/JamesTRichmond/preincarnation",
    campaignRunnableAsBriefed: false,
    engineRunnable: true,
    addisonPlaces: addison.map((t) => t.id),
    outsideAddison: outside.map((t) => ({ id: t.id, county: t.county })),
    interiors: INTERIOR_IDS,
    journeys: journeyLog,
    conflicts,
    notInvented: [
      "12 districts",
      "16 dungeons",
      "6 principal eras",
      "4 endings",
      "progression pack",
      "save-fixture pack",
      "dungeon pack",
      "world-map pack",
      "narrative pack",
      "combat pack",
      "external QA pack",
    ],
  };
  writeFileSync(join(reportDir, "journeys.json"), JSON.stringify(payload, null, 2));
  writeFileSync(join(reportDir, "conflicts.json"), JSON.stringify(conflicts, null, 2));
  const lines = [
    "# PREINCARNATION integration ledger (grok-11)",
    "",
    "Base: `c737e42` on `JamesTRichmond/preincarnation`, branch `integration/grok-11`.",
    "The briefed 12-district campaign is **not** runnable. The engine that is actually in the repo is.",
    "",
    "## Journeys",
    "",
    ...journeyLog.map(
      (j) =>
        `- **${j.id}** — ${j.status}\n  - ${j.transitions.join("\n  - ") || "(no transition executed)"}\n  - ${j.note}`,
    ),
    "",
    "## Conflicts",
    "",
    ...conflicts.map((c) => `- **${c.id}** (${c.kind}, ${c.status}): ${c.detail}`),
    "",
    "## Not invented",
    "",
    payload.notInvented.map((x) => `- ${x}`).join("\n"),
    "",
  ];
  writeFileSync(join(reportDir, "LEDGER.md"), lines.join("\n"));
});
