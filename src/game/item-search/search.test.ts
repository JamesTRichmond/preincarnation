import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyAction, availableActions, moveInstance } from "./actions.ts";
import { adaptSave, adaptWorld } from "./adapter.ts";
import { runBenchmark } from "./benchmark.ts";
import { CATALOG } from "./catalog.ts";
import { lostToWinter, projectReturn } from "./erosion.ts";
import { FIXTURE_MARK, FIXTURE_PROVENANCE, makeFixtures } from "./fixtures.ts";
import { buildIndex } from "./index.ts";
import { browserStore, memoryStore } from "./persistence.ts";
import { search } from "./query.ts";
import { PHRASE_SYNONYMS } from "./synonyms.ts";
import { DEFAULT_FILTERS } from "./types.ts";
import { ledgerNow, lifeBefore, withFixtures } from "./world.ts";

const include = { ...DEFAULT_FILTERS, fixtures: "include" as const };

describe("local lexicon", () => {
  it("documents the light phrase without leaving the module", () => {
    const rule = PHRASE_SYNONYMS.find((entry) => entry.phrase === "things that give light");
    assert.ok(rule);
    assert.deepEqual(rule?.tags, ["light"]);
  });
});

describe("things that give light", () => {
  it("matches effect tags from the local phrase, not recipes or the shovel", () => {
    const world = ledgerNow();
    const index = buildIndex(world);
    const result = search(index, world, "things that give light");
    const ids = result.hits.map((hit) => hit.record.instanceId);
    assert.equal(result.stale, false);
    assert.ok(ids.includes("lantern"));
    assert.ok(ids.includes("saber"));
    assert.equal(ids.includes("shovel"), false);
    assert.equal(ids.includes("ipod"), false);
    assert.equal(ids.includes("net"), false);
    assert.equal(result.hits.every((hit) => hit.record.effects.includes("light")), true);
    assert.equal(result.hits.some((hit) => hit.record.kind === "journal" || hit.record.kind === "recipe"), false);
    assert.ok(result.hits.every((hit) => hit.matched.includes("things that give light")));
  });

  it("does not let ten thousand fixtures satisfy the phrase", () => {
    const world = withFixtures(ledgerNow(), 10_000);
    const index = buildIndex(world);
    const result = search(index, world, "things that give light", { filters: include });
    assert.equal(result.hits.some((hit) => hit.record.synthetic), false);
    assert.equal(index.records.filter((record) => record.synthetic).length, 10_000);
  });
});

describe("renames, locale, and duplicate names", () => {
  it("finds a renamed lamp by the new name and the old one", () => {
    const world = ledgerNow();
    const index = buildIndex(world);
    const byNew = search(index, world, "Maeve's lantern");
    const byOld = search(index, world, "Oil lamp");
    const byFrench = search(index, world, "lampe a huile");
    for (const result of [byNew, byOld, byFrench]) {
      const hit = result.hits.find((entry) => entry.record.instanceId === "lantern");
      assert.ok(hit);
      assert.equal(hit?.record.name, "Maeve's lantern");
      assert.equal(hit?.record.renamedFrom, "Oil lamp");
      assert.equal(hit?.record.localeNames.fr, "Lampe à huile");
    }
  });

  it("keeps two Short irons as separate instances", () => {
    const world = ledgerNow();
    const result = search(buildIndex(world), world, "name:Short iron");
    const irons = result.hits.filter((hit) => hit.record.name === "Short iron");
    assert.equal(irons.length, 2);
    assert.notEqual(irons[0]?.record.instanceId, irons[1]?.record.instanceId);
    assert.notEqual(irons[0]?.record.locationLabel, irons[1]?.record.locationLabel);
    assert.equal(irons[0]?.record.quantity, 1);
  });
});

describe("inaccessible storage and undiscovered loot", () => {
  it("lists the barred loft and never the sunstone", () => {
    const world = ledgerNow();
    const index = buildIndex(world);
    const blob = JSON.stringify(index.records);
    assert.equal(blob.includes("Sunstone"), false);
    assert.equal(blob.includes("sunstone"), false);
    assert.equal(blob.includes("tile 40"), false);
    assert.equal(blob.includes("quarry vein"), false);
    const loft = search(index, world, "Short iron", { filters: { ...DEFAULT_FILTERS, access: "barred" } });
    assert.equal(loft.hits.length, 1);
    assert.equal(loft.hits[0]?.record.instanceId, "iron-loft");
    assert.equal(loft.hits[0]?.record.accessible, false);
    const actions = availableActions(loft.hits[0]!.record);
    assert.equal(actions.find((action) => action.id === "equip")?.enabled, false);
    assert.match(actions.find((action) => action.id === "equip")?.reason ?? "", /barred/);
    assert.equal(search(index, world, "sunstone").total, 0);
    assert.equal(search(index, world, "tile 40").total, 0);
  });

  it("drops unexcavated grave coordinates from a save slice", () => {
    const world = adaptSave({
      cycle: 2,
      equippedId: "starter-iron",
      inventory: [
        { id: "starter-iron", name: "Short iron", kind: "blade", flavor: "The blade you wake with." },
      ],
      character: { name: "Ellis Perch", bondId: "maeve" },
      flags: {
        relics: ["sword", "lantern"],
        ySlot: "lantern",
        arrows: 6,
        bombs: 0,
        bottles: ["empty", "syrup"],
        keys: 1,
        caches: ["opened-barn"],
        year: 2040,
        graves: [
          {
            id: "secret-grave",
            excavated: false,
            x: 99,
            y: 77,
            weapons: [{ id: "pike", name: "Hidden Pike", magic: true, kind: "pole" }],
            relics: ["lantern"],
          },
          {
            id: "known-grave",
            excavated: true,
            x: 3,
            y: 4,
            weapons: [{ id: "mill", name: "Mill blade", magic: false, kind: "blade" }],
            relics: [],
          },
        ],
      },
    });
    const records = adaptWorld(world);
    const blob = JSON.stringify(records);
    assert.equal(blob.includes("Hidden Pike"), false);
    assert.equal(blob.includes("99"), false);
    assert.equal(blob.includes("77"), false);
    assert.equal(blob.includes("opened-barn"), false);
    assert.ok(records.some((record) => record.name === "Mill blade"));
    assert.ok(records.some((record) => record.instanceId === "relic:lantern" && record.equipped));
    const mill = records.find((record) => record.name === "Mill blade");
    assert.equal(mill?.locationLabel.includes("3"), false);
    assert.match(mill?.locationLabel ?? "", /Excavated grave known-grave/);
  });
});

describe("moved instances and stale indexes", () => {
  it("refuses a stale index after the shovel moves, then tells the truth once rebuilt", () => {
    const before = lifeBefore();
    const staleIndex = buildIndex(before);
    const moved = moveInstance(before, "shovel", "pack");
    const stale = search(staleIndex, moved, "shovel");
    assert.equal(stale.stale, true);
    assert.equal(stale.hits.length, 0);
    assert.ok(stale.staleClaims.some((claim) => claim.instanceId === "shovel" && /Barn, main floor/.test(claim.claimedLocation)));
    const fresh = search(buildIndex(moved), moved, "Grave shovel");
    assert.equal(fresh.stale, false);
    const shovel = fresh.hits.find((hit) => hit.record.instanceId === "shovel");
    assert.equal(shovel?.locationIsCurrent, true);
    assert.match(shovel?.record.locationLabel ?? "", /Pack/);
  });

  it("notices a location edit that forgot to bump the revision", () => {
    const before = lifeBefore();
    const index = buildIndex(before);
    const tampered = {
      ...before,
      instances: before.instances.map((instance) =>
        instance.instanceId === "shovel"
          ? { ...instance, location: { ...instance.location, placeId: "pack", label: "Pack, main compartment" } }
          : instance,
      ),
    };
    const result = search(index, tampered, "shovel");
    assert.equal(result.stale, true);
    assert.equal(result.hits.length, 0);
  });
});

describe("fourteen-year return", () => {
  it("drops open mundane gear, bars the loft, and puts the bonded lamp in the hand", () => {
    const before = lifeBefore();
    const after = projectReturn(before);
    const ids = new Set(after.instances.map((instance) => instance.instanceId));
    assert.equal(ids.has("farm-knife"), false);
    assert.equal(ids.has("arrows-grave"), false);
    assert.equal(ids.has("bombs-ground"), false);
    assert.equal(lostToWinter(before.instances.find((instance) => instance.instanceId === "farm-knife")!, 14), true);
    assert.equal(ids.has("hammer"), true);
    assert.equal(ids.has("iron-hand"), true);
    const lamp = after.instances.find((instance) => instance.instanceId === "lantern");
    assert.equal(lamp?.equipped, true);
    assert.equal(lamp?.location.placeId, "in-hand");
    assert.equal(/grass/.test(lamp?.location.label ?? ""), false);
    const loft = after.instances.find((instance) => instance.instanceId === "iron-loft");
    assert.equal(loft?.location.accessible, false);
    const quiver = after.instances.find((instance) => instance.instanceId === "arrows-quiver");
    assert.equal(quiver?.quantity, 18);
    const kegs = after.instances.find((instance) => instance.instanceId === "bombs-cellar");
    assert.equal(kegs?.quantity, 4);
    assert.equal(kegs?.reservedFor, "marble-vein");
    const named = ledgerNow();
    const searchNow = search(buildIndex(named), named, "things that give light");
    assert.equal(searchNow.hits.find((hit) => hit.record.instanceId === "lantern")?.record.equipped, true);
    assert.equal(JSON.stringify(buildIndex(after).records).includes("tile 40"), false);
  });
});

describe("owned, recipe, and journal", () => {
  it("does not treat a recipe or a journal page as carried gear", () => {
    const world = ledgerNow();
    const index = buildIndex(world);
    const recipes = search(index, world, "", { filters: { ...DEFAULT_FILTERS, kind: "recipe" } });
    const journal = search(index, world, "", { filters: { ...DEFAULT_FILTERS, kind: "journal" } });
    assert.equal(recipes.total, 2);
    assert.equal(journal.total, 2);
    assert.ok(recipes.hits.every((hit) => hit.record.kind === "recipe"));
    assert.equal(availableActions(recipes.hits[0]!.record).find((action) => action.id === "equip")?.enabled, false);
    assert.equal(availableActions(journal.hits[0]!.record).find((action) => action.id === "read")?.enabled, true);
    const creemee = search(index, world, "creemee");
    const kinds = new Set(creemee.hits.map((hit) => hit.record.kind));
    assert.equal(kinds.has("owned"), true);
    assert.equal(kinds.has("recipe"), true);
  });
});

describe("fixtures", () => {
  it("labels every synthetic instance and keeps duplicate slips distinct", () => {
    const fixtures = makeFixtures(10_000, 2040);
    assert.equal(fixtures.length, 10_000);
    assert.ok(fixtures.every((instance) => instance.synthetic && instance.name.startsWith(FIXTURE_MARK)));
    assert.ok(fixtures.every((instance) => instance.notes === FIXTURE_PROVENANCE));
    assert.ok(fixtures.every((instance) => !instance.effects?.includes("light")));
    const world = withFixtures(ledgerNow(), 10_000);
    const result = search(buildIndex(world), world, "[fixture] Bin slip 05", { filters: include });
    assert.ok(result.total > 1);
    assert.ok(result.total < 10_000);
    assert.ok(result.hits.every((hit) => hit.record.name === "[fixture] Bin slip 05"));
    const ids = new Set(result.hits.map((hit) => hit.record.instanceId));
    assert.equal(ids.size, result.total);
    assert.ok(result.hits.every((hit) => hit.record.synthetic));
    assert.ok(new Set(result.hits.map((hit) => hit.record.locationLabel)).size > 1);
  });
});

describe("saved views", () => {
  it("round-trips query, filters, sort, scroll, and selection", () => {
    const store = memoryStore();
    store.save({
      query: "things that give light",
      filters: { ...DEFAULT_FILTERS, equipped: "yes" },
      sort: "location",
      selectedId: "lantern",
      scrollTop: 640,
      saved: [
        {
          id: "light",
          name: "Things that give light",
          query: "things that give light",
          filters: { ...DEFAULT_FILTERS },
          sort: "relevance",
        },
      ],
    });
    const loaded = store.load();
    assert.equal(loaded.query, "things that give light");
    assert.equal(loaded.filters.equipped, "yes");
    assert.equal(loaded.sort, "location");
    assert.equal(loaded.selectedId, "lantern");
    assert.equal(loaded.scrollTop, 640);
    assert.equal(loaded.saved[0]?.name, "Things that give light");

    const mem = new Map<string, string>();
    const browser = browserStore({
      getItem: (key) => mem.get(key) ?? null,
      setItem: (key, value) => {
        mem.set(key, value);
      },
    });
    browser.save(loaded);
    assert.deepEqual(browser.load().selectedId, "lantern");
    assert.equal(browser.load().scrollTop, 640);
  });
});

describe("actions stay inside known places", () => {
  it("moves the shovel into the pack and will not invent a place", () => {
    const moved = applyAction(lifeBefore(), "shovel", "carry");
    const shovel = moved.instances.find((instance) => instance.instanceId === "shovel");
    assert.match(shovel?.location.label ?? "", /Pack/);
    assert.throws(() => moveInstance(lifeBefore(), "shovel", "quarry-vein-secret"), /Unknown place/);
  });
});

describe("benchmark harness", () => {
  it("measures a 10,000-fixture index instead of promising instant search", () => {
    const result = runBenchmark(8);
    assert.equal(result.fixtureCount, 10_000);
    assert.ok(result.recordCount > 10_000);
    assert.equal(result.indexBuildMs >= 0, true);
    assert.match(result.note, /not a claim of instantaneous/);
    const light = result.queries.find((query) => query.query === "things that give light");
    assert.ok(light);
    assert.equal(light?.syntheticHits, 0);
    assert.ok((light?.hits ?? 0) >= 2);
    assert.equal(typeof light?.p50Ms, "number");
    assert.equal(typeof light?.p95Ms, "number");
    const fixture = result.queries.find((query) => query.query === "fixture");
    assert.equal(fixture?.syntheticHits, 10_000);
  });
});

describe("catalog samples", () => {
  it("keeps authored definitions free of secret coordinates", () => {
    const blob = JSON.stringify(CATALOG);
    assert.equal(blob.includes("tile 40"), false);
    assert.ok(CATALOG.some((entry) => entry.id === "lantern" && entry.authored));
    assert.ok(CATALOG.some((entry) => entry.id === "hunting-rifle" && entry.authored));
    assert.equal(CATALOG.every((entry) => !("x" in entry)), true);
  });
});
