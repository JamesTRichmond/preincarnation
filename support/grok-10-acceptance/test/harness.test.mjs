import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { scenarios } from "../scenarios/catalog.mjs";
import { requirements } from "../requirements/requirements.mjs";
import { classifyScenario } from "../lib/classify.mjs";
import { judge } from "../lib/assertions.mjs";
import { executeAgainstSeam } from "../lib/executor.mjs";
import { contrastRatio } from "../lib/contrast.mjs";
import { needsSeam, releaseSeamBlock } from "../lib/page-assertions.mjs";
import { collectInventory } from "../lib/inventory.mjs";
import { probeHttp } from "../lib/http-probe.mjs";

const AREAS = [
  "fresh-start",
  "movement-collision",
  "attack-spin",
  "contextual-verbs",
  "offhand-tools",
  "pause-menus-volume",
  "touch-simultaneous",
  "viewport-legibility",
  "save-load",
  "death-release",
  "reincarnation",
  "dungeons",
  "suspend-resume",
  "local-audio",
  "endings",
];

const down = {
  playable: false,
  seam: false,
  probeSummary: "connection refused",
  signalHits: {},
  evidence: ["evidence/http-probe.json"],
};

test("catalog has at least forty complete scenarios", () => {
  assert.ok(scenarios.length >= 40);
  const ids = scenarios.map((scenario) => scenario.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const scenario of scenarios) {
    assert.match(scenario.id, /^ACC-\d{3}$/);
    assert.ok(scenario.title);
    assert.ok(AREAS.includes(scenario.area), scenario.area);
    assert.ok(scenario.requirementIds.length > 0);
    assert.ok(scenario.prerequisites.length > 0);
    assert.ok(scenario.steps.length > 0);
    assert.ok(scenario.expected);
    assert.ok(Array.isArray(scenario.script));
    assert.ok(Array.isArray(scenario.assertions));
    assert.equal(scenario.status, undefined);
  }
  for (const area of AREAS) {
    assert.ok(scenarios.some((scenario) => scenario.area === area), area);
  }
});

test("every requirement is linked and every link exists", () => {
  const ids = new Set(requirements.map((requirement) => requirement.id));
  assert.equal(ids.size, requirements.length);
  for (const scenario of scenarios) {
    for (const id of scenario.requirementIds) assert.ok(ids.has(id), id);
  }
  for (const requirement of requirements) {
    assert.ok(requirement.statement);
    assert.ok(
      scenarios.some((scenario) => scenario.requirementIds.includes(requirement.id)),
      requirement.id,
    );
  }
});

test("a missing client fails availability and blocks behavior", () => {
  const availability = scenarios.find((scenario) => scenario.id === "ACC-001");
  const move = scenarios.find((scenario) => scenario.id === "ACC-006");
  const failed = classifyScenario(availability, down, null);
  assert.equal(failed.status, "FAIL");
  assert.equal(failed.implementation, "NOT IMPLEMENTED");
  const blocked = classifyScenario(move, down, {
    error: null,
    before: { x: 0, y: 0 },
    after: { x: 10, y: 0, facing: "e", screen: "field", loginRequired: false },
    samples: [],
    checkpoints: {},
    metrics: {},
  });
  assert.equal(blocked.status, "BLOCKED");
  assert.notEqual(blocked.status, "PASS");
  assert.equal(blocked.implementation, "NOT IMPLEMENTED");
});

test("availability passes only when a playable surface was actually found", () => {
  const availability = scenarios.find((scenario) => scenario.id === "ACC-001");
  const passed = classifyScenario(
    availability,
    { ...down, playable: true, probeSummary: "identified" },
    null,
  );
  assert.equal(passed.status, "PASS");
});

test("east movement passes on a fake seam and fails when position does not change", async () => {
  const scenario = scenarios.find((item) => item.id === "ACC-006");
  const execution = await executeAgainstSeam(movingSeam(), scenario.script, async () => {});
  assert.equal(judge(scenario, execution).status, "PASS");
  const stuck = await executeAgainstSeam(movingSeam({ stuck: true }), scenario.script, async () => {});
  assert.equal(judge(scenario, stuck).status, "FAIL");
  const classified = classifyScenario(scenario, { ...down, playable: true, signalHits: {} }, execution);
  assert.equal(classified.status, "PASS");
});

test("a feature the build reports as absent is not a pass", () => {
  const scenario = scenarios.find((item) => item.id === "ACC-018");
  const result = judge(scenario, {
    error: null,
    before: {},
    after: { content: { shrines: 0 }, verb: null, reincarnated: false, yearsAdvanced: 0 },
    samples: [],
    checkpoints: {},
    metrics: {},
  });
  assert.equal(result.status, "NOT IMPLEMENTED");
});

test("campaign scope check rejects an over-claim and accepts an honest partial list", () => {
  const scenario = scenarios.find((item) => item.id === "ACC-061");
  const partial = campaignState({ dungeons: 1, claims: false });
  assert.equal(judge(scenario, wrap(partial)).status, "PASS");
  const boast = campaignState({ dungeons: 1, claims: true });
  assert.equal(judge(scenario, wrap(boast)).status, "FAIL");
  const full = campaignState({ dungeons: 16, districts: 12, eras: 6, endings: 4, claims: true });
  assert.equal(judge(scenario, wrap(full)).status, "PASS");
});

test("inventory of an empty tree is not a game", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "preinc-"));
  try {
    await mkdir(path.join(root, "src"));
    await writeFile(path.join(root, "package.json"), JSON.stringify({ dependencies: {} }));
    const inventory = await collectInventory(root);
    assert.equal(inventory.markerTotal, 0);
    assert.equal(inventory.forbiddenHits.spotify, 0);
    assert.equal(inventory.sourceLooksLikeGame, false);
    assert.equal(inventory.routesDir, false);
    assert.deepEqual(inventory.gameTestFiles, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("contrast and page-only checks do not pretend a missing seam passed", () => {
  assert.ok(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }) > 20);
  assert.ok(contrastRatio({ r: 255, g: 255, b: 255 }, { r: 255, g: 255, b: 255 }) < 1.1);
  const touch = scenarios.find((scenario) => scenario.id === "ACC-069");
  const pause = scenarios.find((scenario) => scenario.id === "ACC-027");
  assert.equal(needsSeam(touch), false);
  assert.equal(needsSeam(pause), true);
  const execution = releaseSeamBlock(
    { blockedReason: "seam missing", error: null, metrics: { touchAction: "none" }, before: {}, after: {}, samples: [], checkpoints: {} },
    touch,
  );
  assert.equal(execution.blockedReason, null);
  assert.equal(judge(touch, execution).status, "PASS");
  const poor = { ...execution, metrics: { touchAction: "auto" } };
  assert.equal(judge(touch, poor).status, "FAIL");
  const held = releaseSeamBlock({ blockedReason: "seam missing", error: null, metrics: {}, before: {}, after: {}, samples: [], checkpoints: {} }, pause);
  assert.equal(held.blockedReason, "seam missing");
});

test("closed port probe is not a successful client", async () => {
  const result = await probeHttp("http://127.0.0.1:9/", 800);
  assert.equal(result.ok, false);
  assert.equal(result.status, 0);
});

function wrap(after) {
  return { error: null, before: after, after, samples: [], checkpoints: {}, metrics: {} };
}

function campaignState({ dungeons = 0, districts = 0, eras = 0, endings = 0, claims = false }) {
  return {
    content: {
      dungeons,
      districts,
      eras,
      endings,
      dungeonIds: Array.from({ length: dungeons }, (_, index) => `d${index}`),
      districtIds: Array.from({ length: districts }, (_, index) => `r${index}`),
      eraIds: Array.from({ length: eras }, (_, index) => `e${index}`),
      endingIds: Array.from({ length: endings }, (_, index) => `n${index}`),
    },
    ui: { claimsFullCampaign: claims },
  };
}

function movingSeam({ stuck = false } = {}) {
  let state = { x: 5, y: 9, facing: "s", screen: "title", loginRequired: true };
  return {
    version: 1,
    async getState() {
      return structuredClone(state);
    },
    async dispatch(step) {
      if (step.type === "new-game") {
        state = { x: 0, y: 0, facing: "s", screen: "field", loginRequired: false };
      }
      if (!stuck && step.type === "key" && step.phase === "down" && step.code === "KeyD") {
        state = { ...state, x: state.x + 8, facing: "e" };
      }
    },
  };
}
