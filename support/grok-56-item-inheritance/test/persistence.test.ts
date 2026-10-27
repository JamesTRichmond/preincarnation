import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { simulateStory } from "../src/apply.ts";
import { InheritanceError } from "../src/errors.ts";
import { eraIndexForYear, isPrincipalEraIndex, returnYearAfter } from "../src/eras.ts";
import {
  beginTransaction,
  claim,
  createWorld,
  donate,
  ensureNpc,
  getInstance,
  killNpc,
  reincarnate,
  resolveSuccessions,
  stackCommons,
} from "../src/engine.ts";
import { MIGRATION_CASES } from "../src/migration-cases.ts";
import { exportSave, loadSave } from "../src/migrate.ts";
import { audit } from "../src/read.ts";
import {
  buildInterruptedSave,
  buildVanishedSave,
  playThrough,
  runRepeatedDeaths,
} from "../src/simulator.ts";
import { STORIES, STORY_ARCHETYPES } from "../src/stories.ts";
import { PLAYER_ID, RENEWAL_RULES, SAVE_CONTRACT } from "../src/types.ts";

test("principal eras are the six openings, and later years continue", () => {
  for (const year of [0, 14, 28, 42, 56, 70]) {
    assert.equal(isPrincipalEraIndex(eraIndexForYear(year)), true);
  }
  assert.equal(isPrincipalEraIndex(eraIndexForYear(84)), false);
  assert.equal(isPrincipalEraIndex(eraIndexForYear(98)), false);
  assert.equal(eraIndexForYear(71), 5);
  assert.equal(returnYearAfter(71), 85);
});

test("renewal rules are explicit and do not tax age", () => {
  assert.match(RENEWAL_RULES.noDeterioration, /do not change condition/i);
  assert.match(RENEWAL_RULES.noCorpse, /corpse/i);
  assert.match(RENEWAL_RULES.uniqueOnce, /permanently/i);
  assert.match(RENEWAL_RULES.renewableNode, /new instance id/i);
});

test("the demonstration keeps every disposition across deaths past year 70", () => {
  const played = playThrough();
  const { world, reports } = played;
  assert.equal(world.calendarYear, 104);
  assert.ok(world.calendarYear > 70);
  assert.equal(reports.every((report) => report.erasedInstanceIds.length === 0), true);
  assert.equal(reports.every((report) => report.corpseRecoveryRequired === false), true);
  assert.equal(reports[0]?.aborted.length, 1);
  assert.equal(reports[0]?.aborted[0]?.kind, "sell");
  assert.equal(reports[0]?.returnYear, 23);

  const compass = getInstance(world, "inst:demo:compass");
  assert.equal(compass.ownership.ownerId, PLAYER_ID);
  assert.equal(compass.storage.location, "carried");
  assert.equal(compass.condition, "sound");
  assert.equal(compass.defId, "def:inherited.father-compass");
  assert.notEqual(compass.instanceId, compass.defId);
  assert.equal(compass.worldSource.sourceKey, "heirloom:family:compass");
  assert.ok(compass.restoration.length >= 1);
  assert.equal(typeof compass.era.boundEra, "number");

  assert.equal(getInstance(world, "inst:demo:bread").qty, 3);
  assert.equal(getInstance(world, "inst:demo:bread").condition, "sound");
  assert.equal(getInstance(world, "inst:demo:lantern").questBinding?.state, "bound");
  assert.equal(getInstance(world, "inst:demo:lantern").ownership.title, "quest-bound");
  assert.equal(getInstance(world, "inst:demo:ribbon").storage.location, "displayed");
  assert.equal(getInstance(world, "inst:demo:ribbon").placement.siteId, "site:hall");

  const shawl = getInstance(world, "inst:demo:shawl");
  assert.equal(shawl.storage.location, "stored");
  assert.equal(shawl.storage.containerId, "recovery:site:cottage");
  assert.equal(shawl.ownership.ownerId, PLAYER_ID);

  const pouch = getInstance(world, "inst:demo:pouch");
  assert.equal(pouch.status, "active");
  assert.equal(pouch.ownership.ownerKind, "unowned");
  assert.equal(pouch.placement.siteId, "cache:site:mill");

  const plane = getInstance(world, "inst:demo:plane");
  assert.equal(plane.ownership.ownerId, "npc:lina");
  assert.equal(plane.ownership.title, "donated");
  assert.equal(Object.values(world.instances).filter((inst) => inst.defId === plane.defId).length, 1);

  assert.equal(getInstance(world, "inst:demo:cup").ownership.title, "sold");
  assert.equal(getInstance(world, "inst:demo:cup").ownership.ownerId, "npc:pawn");
  assert.equal(getInstance(world, "inst:demo:chisel").status, "consumed");
  assert.equal(Object.values(world.instances).some((inst) => inst.defId === "def:material.iron-shard"), true);

  const fiddle = getInstance(world, "inst:demo:fiddle");
  assert.equal(fiddle.condition, "restored");
  assert.equal(fiddle.ownership.ownerId, "npc:sela");
  assert.equal(fiddle.restoration.some((event) => event.action === "restore"), true);

  const token = getInstance(world, "inst:demo:token");
  const day = getInstance(world, "inst:demo:day-token");
  assert.equal(token.era.historical, true);
  assert.equal(token.qty, 1);
  assert.equal(day.era.historical, false);
  assert.notEqual(day.instanceId, token.instanceId);
  assert.equal(day.storyId, null);

  assert.equal(getInstance(world, "inst:demo:thimble").era.recognizedInEras.includes(3), true);
  assert.deepEqual(
    ["inst:demo:oak", "inst:demo:oak-era1", "inst:demo:oak-late"].map((id) => getInstance(world, id).instanceId),
    ["inst:demo:oak", "inst:demo:oak-era1", "inst:demo:oak-late"],
  );
  assert.equal(Object.values(world.instances).filter((inst) => inst.defId === "def:relic.sun-coin").length, 1);
  assert.equal(world.consumedSources.some((source) => source.sourceKey === "unique:barrow:sun-coin"), true);
  assert.equal(
    played.log.find((entry) => entry.id === "meaning")?.lines.some((line) => line.includes("Expected a refusal")),
    false,
  );
});

test("repeated deaths do not fork the compass or clear unique consumption", () => {
  const { world, reports } = runRepeatedDeaths();
  const compass = getInstance(world, "inst:repeat:compass");
  assert.equal(world.calendarYear, 104);
  assert.equal(reports.at(-1)?.principalEra, false);
  assert.equal(reports.every((report) => report.erasedInstanceIds.length === 0 && report.returnYear === report.deathYear + 14), true);
  assert.equal(compass.qty, 1);
  assert.equal(compass.condition, "sound");
  assert.equal(compass.restoration.length, 1);
  assert.equal(compass.ownership.ownerId, PLAYER_ID);
  assert.throws(
    () =>
      claim(world, {
        defId: compass.defId,
        sourceKey: compass.worldSource.sourceKey,
        sourceKind: "inheritance",
        year: world.calendarYear,
      }),
    (error: unknown) => error instanceof InheritanceError && error.code === "source-consumed",
  );
});

test("thirty-six stories cover the five consequences without forking instances", () => {
  assert.equal(STORIES.length, 36);
  assert.equal(new Set(STORIES.map((story) => story.instanceId)).size, 36);
  assert.equal(new Set(STORIES.map((story) => story.sourceKey)).size, 36);
  for (const archetype of STORY_ARCHETYPES) {
    assert.ok(STORIES.some((story) => story.archetype === archetype));
  }
  assert.ok(STORIES.some((story) => story.beats.some((beat) => beat.atYear > 70)));

  for (const story of STORIES) {
    const sim = simulateStory(story);
    assert.ok(sim.final, story.storyId);
    assert.equal(sim.final.instanceId, story.instanceId);
    assert.ok(sim.denied.length >= 1, story.storyId);
    assert.equal(sim.final.ownership.ownerId, story.finalOwnerId, story.storyId);
    const sameSource = Object.values(sim.world.instances).filter(
      (inst) => inst.worldSource.sourceKey === story.sourceKey,
    );
    assert.equal(sameSource.length, 1, story.storyId);

    if (story.archetype === "donated-tool-successor") {
      assert.equal(sim.final.ownership.title, "donated");
      assert.equal(sim.final.status, "active");
      assert.notEqual(sim.final.ownership.ownerId, PLAYER_ID);
    }
    if (story.archetype === "restored-instrument-inherited") {
      assert.equal(sim.final.condition, "restored");
      assert.equal(sim.final.restoration.some((event) => event.action === "restore"), true);
      assert.notEqual(sim.final.ownership.ownerId, PLAYER_ID);
    }
    if (story.archetype === "cache-exposed-by-land") {
      assert.equal(sim.final.ownership.ownerId, PLAYER_ID);
      assert.equal(sim.denied.some((denial) => denial.code === "source-consumed"), true);
    }
    if (story.archetype === "family-object-recognized") {
      assert.equal(sim.final.ownership.ownerId, PLAYER_ID);
      assert.ok(sim.final.era.recognizedInEras.length >= 1);
    }
    if (story.archetype === "ordinary-becomes-historical") {
      assert.equal(sim.final.era.historical, true);
      assert.equal(sim.final.condition, "historical");
      const others = Object.values(sim.world.instances).filter(
        (inst) => inst.defId === story.defId && inst.instanceId !== story.instanceId,
      );
      assert.equal(others.length, 1);
      assert.equal(others[0]?.era.historical, false);
      assert.equal(others[0]?.storyId, null);
    }
    assert.equal(audit(sim.world).ok, true, audit(sim.world).errors.join("; "));
  }
});

test("migration cases are the ones the loader actually runs", () => {
  assert.equal(MIGRATION_CASES.length, 14);

  const v0 = loadSave({
    version: 0,
    year: 11,
    gold: 40,
    chapter: "first-market",
    inventory: [
      { id: "smoothing-plane", name: "Smoothing plane", qty: 1, nickname: "the shop plane" },
      { id: "oak-plank", name: "Oak plank", qty: 6 },
      { id: "sun-coin", name: "Sun coin", qty: 1 },
      { id: "bread", name: "Travel bread", qty: 2 },
      { id: "odd-whistle", name: "Odd whistle", qty: 1 },
    ],
  });
  assert.equal(v0.report.instanceIds.length, 5);
  assert.equal(v0.save.preserved?.gold, 40);
  assert.equal(v0.save.preserved?.chapter, "first-market");
  assert.equal(v0.save.world.life.bornYear, 0);
  assert.equal(v0.save.world.life.deathYear, null);
  const oak = Object.values(v0.save.world.instances).find((inst) => inst.defId === "def:material.oak-plank");
  const coin = Object.values(v0.save.world.instances).find((inst) => inst.defId === "def:relic.sun-coin");
  assert.equal(coin?.worldSource.sourceKey, "unique:barrow:sun-coin");
  assert.equal(oak?.qty, 6);
  assert.equal(oak?.worldSource.renewalPolicy, "renewable-common");
  const plane = Object.values(v0.save.world.instances).find((inst) => inst.defId === "def:tool.smoothing-plane");
  assert.equal(plane?.extensions?.nickname, "the shop plane");
  assert.ok(Object.values(v0.save.world.instances).some((inst) => inst.defId === "def:legacy.odd-whistle"));
  assert.throws(
    () =>
      claim(v0.save.world, {
        defId: "def:relic.sun-coin",
        sourceKey: "unique:barrow:sun-coin",
        sourceKind: "cache",
        year: v0.save.world.calendarYear,
      }),
    (error: unknown) => error instanceof InheritanceError && error.code === "source-consumed",
  );
  const again = loadSave({
    version: 0,
    year: 11,
    gold: 40,
    inventory: [
      { id: "smoothing-plane", name: "Smoothing plane", qty: 1 },
      { id: "oak-plank", name: "Oak plank", qty: 6 },
      { id: "sun-coin", name: "Sun coin", qty: 1 },
      { id: "bread", name: "Travel bread", qty: 2 },
      { id: "odd-whistle", name: "Odd whistle", qty: 1 },
    ],
  });
  assert.deepEqual(again.report.instanceIds, v0.report.instanceIds);

  assert.throws(
    () => loadSave({ version: 0, year: 11, inventory: [{ id: "sun-coin", qty: 1 }, { id: "sun-coin", qty: 1 }] }),
    (error: unknown) => error instanceof InheritanceError && error.code === "invalid-save",
  );
  assert.throws(
    () => loadSave({ version: 0, year: 3, gold: 1 }),
    (error: unknown) => error instanceof InheritanceError && error.code === "invalid-save",
  );

  const v1 = loadSave({
    version: 1,
    year: 44,
    reputation: 3,
    items: [
      { instanceId: "inst:v1:kept-compass", defId: "def:inherited.father-compass", qty: 1, slot: "carried", owner: "player", inscription: "E.H." },
      { instanceId: "inst:v1:bread", defId: "def:food.travel-bread", qty: 2, slot: "stored", owner: "player" },
      { instanceId: "inst:v1:sun-coin", defId: "def:relic.sun-coin", qty: 1, slot: "displayed", owner: "player", siteId: "site:hall" },
      { instanceId: "inst:v1:plane", defId: "def:tool.smoothing-plane", qty: 1, owner: "npc:mara" },
    ],
  });
  assert.equal(v1.save.world.instances["inst:v1:kept-compass"]?.extensions?.inscription, "E.H.");
  assert.equal(v1.save.world.instances["inst:v1:plane"]?.ownership.ownerId, "npc:mara");
  assert.equal(v1.save.world.instances["inst:v1:sun-coin"]?.storage.location, "displayed");
  assert.equal(v1.save.world.instances["inst:v1:bread"]?.qty, 2);
  assert.equal(v1.save.preserved?.reputation, 3);
  assert.equal(v1.save.world.lives.length, 0);
  assert.throws(
    () =>
      loadSave({
        version: 1,
        year: 1,
        items: [
          { instanceId: "inst:dup", defId: "def:food.travel-bread", qty: 1 },
          { instanceId: "inst:dup", defId: "def:food.travel-bread", qty: 1 },
        ],
      }),
    (error: unknown) => error instanceof InheritanceError && error.code === "invalid-save",
  );

  const live = playThrough().world;
  const round = loadSave(exportSave(live, { gold: 7 }));
  assert.equal(round.report.fromVersion, 2);
  assert.deepEqual(round.save.world, live);
  assert.equal(round.save.preserved?.gold, 7);

  const tagged = exportSave(createWorld(0));
  const raw = tagged as unknown as { world: { instances: Record<string, unknown> } };
  raw.world.instances["inst:extra"] = {
    ...(claim(createWorld(0), {
      defId: "def:food.travel-bread",
      sourceKey: "common:extra:bread",
      sourceKind: "purchase",
      year: 0,
      instanceId: "inst:extra",
    }).instances["inst:extra"] as object),
    nickname: "kept",
  };
  const loadedExtra = loadSave(raw);
  assert.equal(loadedExtra.save.world.instances["inst:extra"]?.extensions?.nickname, "kept");

  const interrupted = loadSave(buildInterruptedSave());
  assert.equal(interrupted.save.preserved?.gold, 12);
  assert.ok(interrupted.save.world.instances["inst:fixture:chisel"]?.pendingTxn);
  const ended = reincarnate(interrupted.save.world, interrupted.save.world.calendarYear);
  assert.equal(ended.report.aborted.length, 1);
  assert.equal(ended.world.instances["inst:fixture:chisel"]?.pendingTxn, null);
  assert.equal(ended.world.instances["inst:fixture:chisel"]?.ownership.ownerId, PLAYER_ID);
  assert.equal(ended.report.erasedInstanceIds.length, 0);

  const vanished = loadSave(buildVanishedSave());
  const shawl = vanished.save.world.instances["inst:fixture:shawl"];
  assert.equal(shawl?.storage.containerId, "recovery:site:cottage");
  assert.equal(vanished.save.world.instances["inst:fixture:bread"]?.qty, 2);
  assert.equal(vanished.save.world.sites["site:cottage"]?.status, "vanished");
  const after = reincarnate(vanished.save.world, vanished.save.world.calendarYear);
  assert.equal(after.world.instances["inst:fixture:shawl"]?.storage.location, "stored");
  assert.equal(after.world.instances["inst:fixture:bread"]?.qty, 2);
  assert.equal(after.report.erasedInstanceIds.length, 0);

  assert.throws(
    () => loadSave({ version: 2, contract: "other-game", world: { instances: {}, consumedSources: [], calendarYear: 0, life: {} } }),
    (error: unknown) => error instanceof InheritanceError && error.code === "unsupported-save",
  );
  assert.throws(
    () => loadSave({ version: 9 }),
    (error: unknown) => error instanceof InheritanceError && error.code === "unsupported-save",
  );
  assert.equal(SAVE_CONTRACT, "preincarnation.item-inheritance");
});

test("fixture files for older saves and building loss reload the same way", () => {
  const v0File = JSON.parse(readFileSync(new URL("../fixtures/legacy-v0.json", import.meta.url), "utf8")) as unknown;
  const v1File = JSON.parse(readFileSync(new URL("../fixtures/legacy-v1.json", import.meta.url), "utf8")) as unknown;
  const fromV0 = loadSave(v0File);
  const fromV1 = loadSave(v1File);
  assert.equal(Object.keys(fromV0.save.world.instances).length, 5);
  assert.equal(fromV1.save.world.instances["inst:v1:kept-compass"]?.extensions?.inscription, "E.H.");
  assert.equal(fromV0.save.preserved?.gold, 40);
  const interruptedFile = JSON.parse(
    readFileSync(new URL("../fixtures/interrupted-sale.json", import.meta.url), "utf8"),
  ) as unknown;
  const vanishedFile = JSON.parse(
    readFileSync(new URL("../fixtures/vanished-building.json", import.meta.url), "utf8"),
  ) as unknown;
  const interrupted = loadSave(interruptedFile);
  const vanished = loadSave(vanishedFile);
  assert.ok(interrupted.save.world.instances["inst:fixture:chisel"]?.pendingTxn);
  assert.equal(vanished.save.world.instances["inst:fixture:shawl"]?.storage.containerId, "recovery:site:cottage");
  assert.equal(vanished.save.world.sites["site:cottage"]?.status, "vanished");
});

test("quest-bound, heirloom, and unfinished dismantle cannot be destroyed by a transaction or a death", () => {
  let world = claim(createWorld(0), {
    defId: "def:equipment.watch-lantern",
    sourceKey: "quest:flood-watch:lantern",
    sourceKind: "quest-reward",
    year: 0,
    instanceId: "inst:q",
    questBinding: { questId: "quest:flood-watch", state: "bound" },
  });
  assert.throws(
    () => beginTransaction(world, "inst:q", "sell", "npc:pawn", 0),
    (error: unknown) => error instanceof InheritanceError && error.code === "quest-bound",
  );

  world = claim(world, {
    defId: "def:tool.smoothing-plane",
    sourceKey: "heirloom:tool:smoothing-plane",
    sourceKind: "gift",
    year: 0,
    instanceId: "inst:plane",
  });
  assert.throws(
    () => beginTransaction(world, "inst:plane", "dismantle", PLAYER_ID, 0),
    (error: unknown) => error instanceof InheritanceError && error.code === "heirloom-duplication",
  );

  world = claim(world, {
    defId: "def:tool.common-chisel",
    sourceKey: "common:batch:chisel",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:chisel",
  });
  world = beginTransaction(world, "inst:chisel", "dismantle", PLAYER_ID, 0);
  const died = reincarnate(world, 3);
  assert.equal(died.world.instances["inst:chisel"]?.status, "active");
  assert.equal(died.world.instances["inst:chisel"]?.pendingTxn, null);
  assert.equal(Object.values(died.world.instances).some((inst) => inst.defId === "def:material.iron-shard"), false);
  assert.equal(died.world.instances["inst:q"]?.questBinding?.state, "bound");
  assert.equal(died.report.corpseRecoveryRequired, false);
});

test("a line with no successor keeps the object on the historical record", () => {
  let world = ensureNpc(createWorld(0), {
    npcId: "npc:bren",
    name: "Bren",
    lineageId: "line:hedge",
    generation: 1,
    successorId: null,
  });
  world = claim(world, {
    defId: "def:tool.billhook",
    sourceKey: "heirloom:tool:billhook",
    sourceKind: "gift",
    year: 0,
    instanceId: "inst:hook",
  });
  world = donate(world, "inst:hook", "npc:bren", 0, null);
  world = killNpc(world, "npc:bren", 0);
  const resolved = resolveSuccessions(world, 0);
  const hook = resolved.world.instances["inst:hook"];
  assert.equal(hook?.status, "active");
  assert.equal(hook?.ownership.ownerId, "historical:line:hedge");
  assert.equal(hook?.instanceId, "inst:hook");
});

test("food is not spoiled by the return, and commons do not swallow a lineage", () => {
  let world = claim(createWorld(0), {
    defId: "def:food.travel-bread",
    sourceKey: "common:purchase:bread:test",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:bread",
    qty: 2,
  });
  world = claim(world, {
    defId: "def:material.oak-plank",
    sourceKey: "common:oak:a",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:oak-a",
    qty: 2,
  });
  world = claim(world, {
    defId: "def:material.oak-plank",
    sourceKey: "common:oak:b",
    sourceKind: "purchase",
    year: 0,
    instanceId: "inst:oak-b",
    qty: 3,
  });
  world = stackCommons(world, "inst:oak-a", "inst:oak-b", 0);
  assert.equal(world.instances["inst:oak-a"]?.qty, 5);
  assert.equal(world.instances["inst:oak-b"]?.status, "closed");
  let turned = world;
  for (const death of [2, 20, 40]) turned = reincarnate(turned, death).world;
  assert.equal(turned.instances["inst:bread"]?.qty, 2);
  assert.equal(turned.instances["inst:bread"]?.condition, "sound");
  assert.equal(turned.calendarYear, 54);
});
