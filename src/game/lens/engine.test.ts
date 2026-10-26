import assert from "node:assert/strict";
import test from "node:test";

import { ACTION_CUES } from "./cues.ts";
import {
  SAMPLE_HOSTILE_IMPORT,
  copyDocument,
  exportFilterDocument,
  importFilterDocument,
  loadFilterDocument,
  saveFilterDocument,
} from "./document.ts";
import { accountedIds, evaluateLoot } from "./engine.ts";
import { FIXTURE_CONTEXT, FIXTURE_ITEMS, fixtureItem } from "./fixture.ts";
import { UNIMPLEMENTED_RUNTIME_BINDINGS } from "./bindings.ts";
import { EVERYTHING_PRESET, PROJECT_PRESET, QUIET_PRESET, TRAIL_PRESET } from "./presets.ts";
import type { FilterDocument, FilterRule, GroundItem, KeyValueStore } from "./types.ts";
import { FILTER_FORMAT, FILTER_STORAGE_KEY, FILTER_VERSION } from "./types.ts";

function memoryStore(initial?: string): KeyValueStore & { dump: Map<string, string> } {
  const dump = new Map<string, string>();
  if (initial != null) dump.set(FILTER_STORAGE_KEY, initial);
  return {
    dump,
    getItem(key) {
      return dump.has(key) ? (dump.get(key) ?? null) : null;
    },
    setItem(key, value) {
      dump.set(key, value);
    },
    removeItem(key) {
      dump.delete(key);
    },
  };
}

function decisionFor(document: FilterDocument, id: string) {
  const result = evaluateLoot(FIXTURE_ITEMS, document, FIXTURE_CONTEXT);
  const decision = result.decisions.find((entry) => entry.itemId === id);
  assert.ok(decision, `missing decision for ${id}`);
  return { result, decision };
}

function rule(partial: Pick<FilterRule, "id" | "name" | "action"> & Partial<FilterRule>): FilterRule {
  return {
    enabled: true,
    ...partial,
  };
}

function document(rules: FilterRule[], showEverything = false): FilterDocument {
  return {
    format: FILTER_FORMAT,
    version: FILTER_VERSION,
    id: "test",
    name: "Test",
    showEverything,
    rules,
  };
}

function cloneItem(id: string, patch: Partial<GroundItem>): GroundItem {
  const item = fixtureItem(id);
  return {
    ...item,
    ...patch,
    projectTags: patch.projectTags ?? [...item.projectTags],
  };
}

test("fixture is labeled and runtime bindings stay explicit", () => {
  assert.ok(FIXTURE_ITEMS.length >= 30);
  assert.ok(FIXTURE_ITEMS.every((item) => item.source === "reference-fixture"));
  const storage = UNIMPLEMENTED_RUNTIME_BINDINGS.find((binding) => binding.id === "storage-routing");
  const economy = UNIMPLEMENTED_RUNTIME_BINDINGS.find((binding) => binding.id === "pickup-sale-salvage");
  assert.equal(storage?.status, "unbound");
  assert.equal(economy?.status, "refused");
  assert.match(economy?.detail ?? "", /salvage/i);
});

test("every action has a unique non-color cue", () => {
  const cues = Object.values(ACTION_CUES);
  assert.equal(new Set(cues.map((cue) => cue.short)).size, cues.length);
  assert.equal(new Set(cues.map((cue) => cue.shape)).size, cues.length);
  assert.equal(new Set(cues.map((cue) => cue.pattern)).size, cues.length);
  for (const cue of cues) {
    assert.equal(cue.reliesOnColor, false);
    assert.ok(cue.short.length >= 3);
    assert.ok(cue.summary.length > 12);
    assert.equal(/#[0-9a-f]{3,8}/i.test(cue.summary), false);
  }
});

test("trail preset priority, preservation, collapse, and hide", () => {
  const before = JSON.stringify(FIXTURE_ITEMS);
  const result = evaluateLoot(FIXTURE_ITEMS, TRAIL_PRESET.document, FIXTURE_CONTEXT);
  assert.equal(JSON.stringify(FIXTURE_ITEMS), before);
  assert.equal(result.retained, FIXTURE_ITEMS);
  assert.deepEqual([...accountedIds(result)].sort(), FIXTURE_ITEMS.map((item) => item.id).sort());

  const byId = new Map(result.decisions.map((decision) => [decision.itemId, decision]));
  const expectAction = (id: string, action: string) => {
    assert.equal(byId.get(id)?.action, action, id);
  };

  expectAction("rite-glass", "emphasize");
  expectAction("processional-nail", "emphasize");
  expectAction("sealed-key", "emphasize");
  expectAction("witness-slate", "emphasize");
  expectAction("unnamed-shard", "emphasize");
  expectAction("sporeglass-bead", "emphasize");
  expectAction("half-heard", "emphasize");
  expectAction("warm-splinter", "emphasize");
  expectAction("mother-compass", "emphasize");
  expectAction("protected-iron", "emphasize");
  expectAction("surplus-tallow-1", "hide");
  expectAction("surplus-tallow-2", "hide");
  expectAction("small-tallow-1", "collapse");
  expectAction("ash-polearm", "reduce");
  expectAction("heavy-kettle", "reduce");
  expectAction("third-verse", "reduce");
  expectAction("echo-filament", "show");
  expectAction("cloudy-vial", "show");
  expectAction("stranger-coin", "show");
  expectAction("bitter-tea", "show");
  expectAction("errand-token", "emphasize");

  const nail = byId.get("processional-nail");
  assert.equal(nail?.matchedRuleId, "trail-project");
  assert.equal(nail?.priority, 2);
  assert.equal(nail?.shadowed[0]?.id, "trail-quest");
  assert.equal(nail?.preserved, true);
  assert.equal(nail?.preservationApplied, false);

  const compass = byId.get("mother-compass");
  assert.equal(compass?.matchedRuleId, null);
  assert.equal(compass?.preservationApplied, true);
  assert.ok(compass?.preservationCauses.includes("explicitly protected item"));

  const protectedIron = byId.get("protected-iron");
  assert.equal(protectedIron?.preservationApplied, true);
  assert.equal(protectedIron?.matchedRuleId, "trail-stack");

  const iron = result.ground.find(
    (entry) => entry.kind === "collapsed" && entry.items.some((item) => item.stackKey === "river-iron"),
  );
  assert.ok(iron && iron.kind === "collapsed");
  assert.equal(iron.pileCount, 6);
  assert.equal(iron.items.some((item) => item.protected), false);
  assert.equal(iron.quantityTotal > 0, true);

  const hiddenIds = result.hidden.flatMap((entry) => entry.items.map((item) => item.id)).sort();
  assert.deepEqual(hiddenIds, ["surplus-tallow-1", "surplus-tallow-2"]);
  const hiddenRef = result.hidden.flatMap((entry) => [...entry.items]).find((item) => item.id === "surplus-tallow-1");
  assert.equal(hiddenRef, fixtureItem("surplus-tallow-1"));

  for (const decision of result.decisions) {
    assert.equal(decision.effect, "presentation");
    assert.deepEqual(decision.authorizes, {
      pickup: false,
      sale: false,
      salvage: false,
      destroy: false,
    });
    assert.equal(decision.cue.action, decision.action);
    assert.equal(decision.cue.reliesOnColor, false);
    assert.match(decision.reason, /\S/);
    assert.match(decision.howToChange, /does not pick up, sell, salvage, or destroy/);
  }
});

test("first matching rule wins when later rules disagree", () => {
  const doc = document([
    rule({
      id: "show-tools",
      name: "Show tools",
      action: "show",
      category: { kind: "in", values: ["tool"] },
    }),
    rule({
      id: "hide-tools",
      name: "Hide tools",
      action: "hide",
      category: { kind: "in", values: ["tool"] },
    }),
  ]);
  const { decision } = decisionFor(doc, "practice-hook");
  assert.equal(decision.action, "show");
  assert.equal(decision.matchedRuleId, "show-tools");
  assert.equal(decision.priority, 1);
  assert.equal(decision.shadowed[0]?.id, "hide-tools");
  assert.equal(decision.shadowed[0]?.priority, 2);
  assert.equal(decision.authorizes.pickup, false);
});

test("a conflicting rule is skipped and does not hide anything", () => {
  const doc = document([
    rule({
      id: "impossible",
      name: "Impossible quantity",
      action: "hide",
      category: { kind: "in", values: ["material"] },
      knownUse: ["no-current-use"],
      quantity: { min: 9, max: 1 },
    }),
    rule({
      id: "show-hook",
      name: "Show the hook",
      action: "emphasize",
      category: { kind: "in", values: ["tool"] },
    }),
  ]);
  const result = evaluateLoot(FIXTURE_ITEMS, doc, FIXTURE_CONTEXT);
  assert.equal(result.ruleProblems.some((problem) => problem.id === "impossible"), true);
  const scrap = result.decisions.find((entry) => entry.itemId === "surplus-tallow-1");
  assert.equal(scrap?.action, "show");
  assert.equal(scrap?.matchedRuleId, null);
  const hook = result.decisions.find((entry) => entry.itemId === "practice-hook");
  assert.equal(hook?.action, "emphasize");
  assert.equal(hook?.matchedRuleId, "show-hook");
  assert.equal(result.hidden.length, 0);
});

test("hide aimed only at unknown or unidentified items never applies", () => {
  const unknownKind = document([
    rule({
      id: "hide-unknown",
      name: "Hide unknown categories",
      action: "hide",
      category: { kind: "unknown" },
    }),
  ]);
  const unknownResult = evaluateLoot(FIXTURE_ITEMS, unknownKind, FIXTURE_CONTEXT);
  assert.match(unknownResult.ruleProblems[0]?.problem ?? "", /unknown categor/i);
  assert.equal(
    unknownResult.decisions.find((entry) => entry.itemId === "echo-filament")?.action,
    "show",
  );

  const namedUnknown = document([
    rule({
      id: "hide-echo",
      name: "Hide filaments",
      action: "hide",
      category: { kind: "in", values: ["echo-filament"] },
    }),
  ]);
  const echo = decisionFor(namedUnknown, "echo-filament").decision;
  assert.equal(echo.action, "show");
  assert.equal(echo.matchedRuleId, "hide-echo");
  assert.match(echo.reason, /not recognized/);
  assert.equal(echo.authorizes.salvage, false);

  const fresh = decisionFor(namedUnknown, "sporeglass-bead").decision;
  assert.equal(fresh.action, "emphasize");
  assert.equal(fresh.preservationApplied, true);
});

test("newly discovered items stay marked, then a known repeat can be hidden", () => {
  const hideMaterials = document([
    rule({
      id: "hide-mat",
      name: "Hide materials",
      action: "hide",
      category: { kind: "in", values: ["material"] },
      knownUse: ["known", "no-current-use"],
    }),
  ]);
  const fresh = cloneItem("river-iron-1", {
    id: "fresh-iron",
    firstDiscovery: true,
    collectionStatus: "seen",
  });
  const repeat = cloneItem("river-iron-1", {
    id: "repeat-iron",
    firstDiscovery: false,
    collectionStatus: "seen",
  });
  const firstPass = evaluateLoot([fresh], hideMaterials, FIXTURE_CONTEXT);
  assert.equal(firstPass.decisions[0]?.action, "emphasize");
  assert.equal(firstPass.hidden.length, 0);
  assert.equal(firstPass.retained[0], fresh);
  assert.equal(fresh.firstDiscovery, true);

  const secondPass = evaluateLoot([repeat], hideMaterials, FIXTURE_CONTEXT);
  assert.equal(secondPass.decisions[0]?.action, "hide");
  assert.equal(secondPass.hidden[0]?.items[0], repeat);
  assert.equal(secondPass.decisions[0]?.authorizes.destroy, false);
  assert.equal(firstPass.decisions[0]?.action, "emphasize");
});

test("essential quest items survive a hide rule that catches other quest-bound objects", () => {
  const doc = document([
    rule({
      id: "hide-quest",
      name: "Hide quest-bound",
      action: "hide",
      ownership: ["quest-bound"],
      knownUse: ["known"],
    }),
  ]);
  const essential = decisionFor(doc, "sealed-key").decision;
  const optional = decisionFor(doc, "errand-token").decision;
  assert.equal(essential.action, "emphasize");
  assert.equal(essential.preservationApplied, true);
  assert.equal(optional.action, "hide");
  assert.equal(optional.preserved, false);
  assert.equal(optional.authorizes.sale, false);
});

test("show everything overrides presentation and deletes nothing", () => {
  const result = evaluateLoot(FIXTURE_ITEMS, EVERYTHING_PRESET.document, FIXTURE_CONTEXT);
  assert.equal(result.hidden.length, 0);
  assert.ok(result.decisions.every((decision) => decision.action === "show" && decision.showEverything));
  assert.equal(result.ground.length, FIXTURE_ITEMS.length);
  const scrap = result.decisions.find((decision) => decision.itemId === "surplus-tallow-1");
  assert.match(scrap?.reason ?? "", /Show everything is on/);
  assert.match(scrap?.reason ?? "", /Without it:/);
  assert.match(scrap?.howToChange ?? "", /Turn off Show everything/);
  assert.equal(result.retained.length, FIXTURE_ITEMS.length);
});

test("project focus and quiet ground change different labels", () => {
  const project = evaluateLoot(FIXTURE_ITEMS, PROJECT_PRESET.document, FIXTURE_CONTEXT);
  const quiet = evaluateLoot(FIXTURE_ITEMS, QUIET_PRESET.document, FIXTURE_CONTEXT);
  const action = (result: ReturnType<typeof evaluateLoot>, id: string) =>
    result.decisions.find((decision) => decision.itemId === id)?.action;

  assert.equal(action(project, "tin-counts"), "hide");
  assert.equal(action(project, "bitter-tea"), "hide");
  assert.equal(action(project, "stranger-coin"), "show");
  assert.equal(action(project, "rite-glass"), "emphasize");
  assert.equal(action(project, "unnamed-shard"), "emphasize");
  assert.equal(action(quiet, "bitter-tea"), "hide");
  assert.equal(action(quiet, "small-tallow-1"), "hide");
  assert.equal(action(quiet, "unnamed-shard"), "emphasize");
  assert.equal(action(quiet, "echo-filament"), "show");
  assert.equal(action(quiet, "sealed-key"), "emphasize");
});

test("malicious imports are rejected and never executed", () => {
  const before = Object.getOwnPropertyNames(Object.prototype).sort();
  const marker = globalThis as { __lootPwned?: number };
  marker.__lootPwned = 0;

  const hostile = importFilterDocument(SAMPLE_HOSTILE_IMPORT);
  assert.equal(hostile.ok, false);
  if (!hostile.ok) assert.match(hostile.errors.join(" "), /Forbidden field/);

  const proto = importFilterDocument(
    '{"format":"preincarnation.loot-filter","version":1,"id":"p","name":"P","showEverything":false,"rules":[{"id":"a","name":"A","enabled":true,"action":"show","__proto__":{"polluted":true}}]}',
  );
  assert.equal(proto.ok, false);

  const attack = importFilterDocument(
    '{"format":"preincarnation.loot-filter","version":1,"id":"p","name":"P","showEverything":false,"constructor":{"prototype":{"polluted":true}},"rules":[]}',
  );
  assert.equal(attack.ok, false);

  const pickup = importFilterDocument(
    '{"format":"preincarnation.loot-filter","version":1,"id":"p","name":"P","showEverything":false,"rules":[{"id":"a","name":"Take it","enabled":true,"action":"pickup"}]}',
  );
  assert.equal(pickup.ok, false);
  if (!pickup.ok) assert.match(pickup.errors.join(" "), /pick up, sell, salvage, or destroy/i);

  for (const action of ["sell", "salvage", "destroy", "delete"]) {
    const result = importFilterDocument(
      `{"format":"preincarnation.loot-filter","version":1,"id":"p","name":"P","showEverything":false,"rules":[{"id":"a","name":"Nope","enabled":true,"action":"${action}"}]}`,
    );
    assert.equal(result.ok, false, action);
  }

  const code = importFilterDocument("globalThis.__lootPwned = 1; ({})");
  assert.equal(code.ok, false);
  assert.equal(marker.__lootPwned, 0);

  const noted = importFilterDocument(
    '{"format":"preincarnation.loot-filter","version":1,"id":"p","name":"P","showEverything":false,"rules":[{"id":"a","name":"Note","enabled":true,"action":"show","note":"globalThis.__lootPwned = 1"}]}',
  );
  assert.equal(noted.ok, true);
  if (noted.ok) assert.equal(noted.document.rules[0]?.note, "globalThis.__lootPwned = 1");
  assert.equal(marker.__lootPwned, 0);
  assert.deepEqual(Object.getOwnPropertyNames(Object.prototype).sort(), before);

  const extra = importFilterDocument(
    '{"format":"preincarnation.loot-filter","version":1,"id":"p","name":"P","showEverything":false,"eval":"1","rules":[]}',
  );
  assert.equal(extra.ok, false);
});

test("import accepts a clean file, warns on contradictions, and round-trips", () => {
  const raw = exportFilterDocument(TRAIL_PRESET.document);
  const imported = importFilterDocument(raw);
  assert.equal(imported.ok, true);
  if (imported.ok) {
    assert.equal(imported.warnings.length, 0);
    assert.deepEqual(imported.document.rules.map((entry) => entry.id), TRAIL_PRESET.document.rules.map((entry) => entry.id));
  }

  const contradictory = importFilterDocument(
    '{"format":"preincarnation.loot-filter","version":1,"id":"c","name":"Conflict","showEverything":false,"rules":[{"id":"bad","name":"Bad range","enabled":true,"action":"reduce","quantity":{"min":4,"max":1}}]}',
  );
  assert.equal(contradictory.ok, true);
  if (contradictory.ok) {
    assert.match(contradictory.warnings[0]?.problem ?? "", /minimum is higher/);
    const evaluated = evaluateLoot(FIXTURE_ITEMS, contradictory.document, FIXTURE_CONTEXT);
    assert.equal(evaluated.ruleProblems[0]?.id, "bad");
    assert.ok(evaluated.decisions.every((decision) => decision.matchedRuleId !== "bad"));
  }

  assert.equal(importFilterDocument('{"format":"nope"}').ok, false);
  assert.equal(importFilterDocument("").ok, false);
});

test("save and load restore the ordered rules", () => {
  const store = memoryStore();
  assert.equal(loadFilterDocument(store).ok, false);

  const edited = copyDocument(PROJECT_PRESET.document);
  edited.showEverything = true;
  edited.rules[0] = { ...edited.rules[0], name: "Renamed project rule" };
  const saved = saveFilterDocument(edited, store);
  assert.equal(saved.ok, true);

  const loaded = loadFilterDocument(store);
  assert.equal(loaded.ok, true);
  if (loaded.ok) {
    assert.equal(loaded.document.showEverything, true);
    assert.equal(loaded.document.rules[0]?.name, "Renamed project rule");
    assert.deepEqual(
      loaded.document.rules.map((entry) => entry.id),
      PROJECT_PRESET.document.rules.map((entry) => entry.id),
    );
  }

  store.setItem(FILTER_STORAGE_KEY, SAMPLE_HOSTILE_IMPORT);
  const rejected = loadFilterDocument(store);
  assert.equal(rejected.ok, false);
  const still = evaluateLoot(FIXTURE_ITEMS, TRAIL_PRESET.document, FIXTURE_CONTEXT);
  assert.equal(still.retained.length, FIXTURE_ITEMS.length);
});
