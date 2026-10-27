import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOST_VERBS,
  SAMPLE_OVERLAYS,
  SAMPLE_SOURCES,
  TUNING,
  assertReferenceReady,
  catalogFromSlots,
  commit,
  coverage,
  createCatalog,
  deathFromGame,
  freshState,
  projectRuntime,
  referenceCatalog,
  returnFromGame,
  toggleEquip,
  validateSave,
  wealth,
  type DeathCause,
  type MasteryRecord,
  type MasteryState,
  type Result,
  type WitnessSource,
} from "./src/index.ts";

const catalog = referenceCatalog();

function take<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`${result.code}: ${result.error}`);
  return result.value;
}

function die(state: MasteryState, cause: DeathCause = "combat", site = "quarry:12,8") {
  return take(commit(state, { t: "death", cause, deathSiteKey: site, cycle: state.cycle + 1 }, catalog));
}

function grant(state: MasteryState, sourceId: string) {
  return commit(state, { t: "grant", sourceId }, catalog);
}

function buy(state: MasteryState, id: string) {
  return commit(state, { t: "purchase", id }, catalog);
}

function baseRecord(overrides: Partial<MasteryRecord> & Pick<MasteryRecord, "id">): MasteryRecord {
  return {
    kind: "inscription",
    status: "authored",
    name: overrides.id,
    summary: "A test cut that rides the slash.",
    disciplines: ["quarry"],
    tier: 1,
    role: "standard",
    hosts: ["slash"],
    toolId: null,
    cost: 2,
    requires: [],
    requiresSources: [],
    requiresEras: [],
    requiresDungeons: [],
    excludes: [],
    tags: [],
    channel: "reaction",
    bound: false,
    modifiers: [],
    ...overrides,
  };
}

function source(id: string, amount = 2, repeat: WitnessSource["repeat"] = "campaign"): WitnessSource {
  const kind = id.split(".")[1] as WitnessSource["kind"];
  return { id, kind, repeat, amount, label: id, note: "Registered for the test, not a death payout." };
}

describe("reference library", () => {
  it("reserves the full id plan and does not claim the library is written", () => {
    const report = coverage(catalog);
    assert.deepEqual(assertReferenceReady(catalog), []);
    assert.equal(report.complete, false);
    assert.equal(report.authored.inscription + report.reserved.inscription, 72);
    assert.equal(report.authored.tool + report.reserved.tool, 36);
    assert.equal(report.authored.form + report.reserved.form, 32);
    assert.equal(report.authored.cross + report.reserved.cross, 24);
    assert.ok(report.authored.inscription < 72);
    assert.ok(report.authored.inscription > 0);
    assert.equal(projectRuntime(freshState(), catalog).libraryComplete, false);
  });

  it("rejects a cycled graph, a one-discipline cross, a zero cost, and a duplicate id", () => {
    const cycle = createCatalog({
      records: [
        baseRecord({ id: "quarry.ins.01", requires: ["quarry.ins.02"] }),
        baseRecord({ id: "quarry.ins.02", requires: ["quarry.ins.01"], channel: "weight" }),
      ],
      sources: [],
    });
    assert.equal(cycle.ok, false);
    if (!cycle.ok) assert.equal(cycle.code, "cycle");

    const thin = createCatalog({
      records: [baseRecord({ id: "cross.01", kind: "cross", disciplines: ["quarry"], cost: 6, tier: 2 })],
      sources: [],
    });
    assert.equal(thin.ok, false);

    const free = createCatalog({
      records: [baseRecord({ id: "quarry.ins.01", cost: 0 })],
      sources: [],
    });
    assert.equal(free.ok, false);

    const dup = createCatalog({
      records: [baseRecord({ id: "quarry.ins.01" }), baseRecord({ id: "quarry.ins.01", channel: "weight" })],
      sources: [],
    });
    assert.equal(dup.ok, false);
    if (!dup.ok) assert.equal(dup.code, "duplicate-record");
  });

  it("rejects an unknown slot and a death-shaped source", () => {
    const extra = catalogFromSlots(
      [...SAMPLE_OVERLAYS, { id: "quarry.ins.99", name: "No", summary: "No.", cost: 2, channel: "reaction" }],
      SAMPLE_SOURCES,
    );
    assert.equal(extra.ok, false);

    const farm = createCatalog({
      records: [],
      sources: [source("src.discovery.suicide-loop")],
    });
    assert.equal(farm.ok, false);
  });
});

describe("witness, duplicates, and the suicide purse", () => {
  it("banks campaign discoveries once and never pays for death itself", () => {
    let state = freshState();
    state = take(grant(state, "src.discovery.green-shovel"));
    assert.equal(state.witnessBank, 2);
    const again = grant(state, "src.discovery.green-shovel");
    assert.equal(again.ok, false);
    if (!again.ok) assert.equal(again.code, "duplicate");
    assert.equal(state.witnessBank, 2);

    const unknown = grant(state, "src.death.falling");
    assert.equal(unknown.ok, false);
    if (!unknown.ok) assert.equal(unknown.code, "unknown-source");

    const dead = die(state);
    assert.equal(dead.witnessBank, 2);
    assert.equal(dead.phase, "afterlife");
    const atDesk = grant(dead, "src.discovery.sheep-pines");
    assert.equal(atDesk.ok, false);
    if (!atDesk.ok) assert.equal(atDesk.code, "bad-phase");
  });

  it("voids a hollow release and will not farm the road wraith", () => {
    let state = freshState();
    state = take(grant(state, "src.encounter.road-wraith"));
    assert.equal(state.witnessBank, 0);
    assert.equal(state.escrow.length, 1);
    const dup = grant(state, "src.encounter.road-wraith");
    assert.equal(dup.ok, false);

    state = die(state, "release", "shrine:middlebury");
    assert.equal(state.witnessBank, 0);
    assert.equal(state.suicideStreak, 1);
    assert.equal(state.escrow.length, 0);
    const death = state.journal.at(-1);
    assert.equal(death?.t, "death");
    if (death?.t === "death") assert.equal(death.paid, 0);

    state = take(commit(state, { t: "return" }, catalog));
    const farm = grant(state, "src.encounter.road-wraith");
    assert.equal(farm.ok, false);
    if (!farm.ok) assert.equal(farm.code, "farm-streak");

    state = take(grant(state, "src.discovery.green-shovel"));
    assert.equal(state.witnessBank, 2);
    state = die(state, "release", "shrine:middlebury");
    assert.equal(state.suicideStreak, 2);
    assert.equal(state.witnessBank, 2);

    state = take(commit(state, { t: "return" }, catalog));
    state = take(grant(state, "src.discovery.sheep-pines"));
    state = take(grant(state, "src.discovery.lantern-bond"));
    state = die(state, "release", "shrine:middlebury");
    const qualified = state.journal.at(-1);
    assert.equal(qualified?.t, "death");
    if (qualified?.t === "death") assert.equal(qualified.hollow, false);
    assert.equal(state.suicideStreak, 2, "a shrine death does not wash a hollow streak");

    state = take(commit(state, { t: "return" }, catalog));
    state = die(state, "combat", "creek:3,3");
    assert.equal(state.suicideStreak, 2, "a bare death does not wash a hollow streak");

    state = take(commit(state, { t: "return" }, catalog));
    state = take(grant(state, "src.discovery.marble-vein"));
    state = die(state, "combat", "quarry:1,1");
    assert.equal(state.suicideStreak, 0);
    assert.equal(state.witnessBank, 9);

    state = take(commit(state, { t: "return" }, catalog));
    state = take(grant(state, "src.encounter.road-wraith"));
    state = die(state, "hazard", "creek:ice");
    assert.equal(state.witnessBank, 11);

    state = take(commit(state, { t: "return" }, catalog));
    state = take(grant(state, "src.encounter.road-wraith"));
    state = die(state, "combat", "addison:road");
    assert.equal(state.witnessBank, 12);

    state = take(commit(state, { t: "return" }, catalog));
    const spent = grant(state, "src.encounter.road-wraith");
    assert.equal(spent.ok, false);
    if (!spent.ok) assert.equal(spent.code, "repeat-exhausted");
  });

  it("caps the whole repeatable purse", () => {
    const sources = [1, 2, 3, 4].map((n) => source(`src.encounter.pack-${n}`, 2, "life"));
    const built = take(createCatalog({ records: [], sources }));
    let state = freshState();
    for (let n = 1; n <= 3; n++) state = take(commit(state, { t: "grant", sourceId: `src.encounter.pack-${n}` }, built));
    const blocked = commit(state, { t: "grant", sourceId: "src.encounter.pack-4" }, built);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.code, "repeat-cap");
    state = take(commit(state, { t: "death", cause: "combat", deathSiteKey: "road:1", cycle: 1 }, built));
    assert.equal(state.witnessBank, TUNING.repeatCampaignCap);
  });
});

describe("purchases, prereqs, incompatibilities, caps", () => {
  it("allows several purchases in one afterlife and blocks them while alive", () => {
    let state = freshState();
    for (const id of [
      "src.discovery.green-shovel",
      "src.discovery.sheep-pines",
      "src.discovery.marble-vein",
      "src.discovery.lantern-bond",
    ]) {
      state = take(grant(state, id));
    }
    assert.equal(state.witnessBank, 9);
    const early = buy(state, "quarry.ins.01");
    assert.equal(early.ok, false);
    if (!early.ok) assert.equal(early.code, "bad-phase");

    state = die(state);
    for (const id of ["quarry.ins.01", "quarry.ins.02", "creek.ins.01", "hollow.ins.01"]) {
      state = take(buy(state, id));
    }
    assert.equal(state.witnessBank, 1);
    assert.equal(Object.keys(state.owned).length, 4);
    const fifth = buy(state, "ash.ins.02");
    assert.equal(fifth.ok, false);
    if (!fifth.ok) assert.equal(fifth.code, "broke");
    const earned = wealth(state);
    state = take(commit(state, { t: "respec" }, catalog));
    assert.equal(wealth(state), earned);
    assert.deepEqual(state.owned, {});
    assert.equal(state.witnessBank, 9);
  });

  it("enforces prereqs, sources, eras, and unwritten slots", () => {
    let state = freshState();
    for (const id of ["src.discovery.green-shovel", "src.discovery.sheep-pines", "src.discovery.marble-vein", "src.discovery.lantern-bond"]) {
      state = take(grant(state, id));
    }
    state = die(state);
    const seam = buy(state, "quarry.ins.05");
    assert.equal(seam.ok, false);
    if (!seam.ok) assert.equal(seam.code, "prereq");
    const seen = buy(state, "lantern.ins.01");
    assert.equal(seen.ok, true);
    const era = buy(state, "sugar.ins.04");
    assert.equal(era.ok, false);
    if (!era.ok) assert.equal(era.code, "prereq");
    const blank = buy(state, "quarry.ins.03");
    assert.equal(blank.ok, false);
    if (!blank.ok) assert.equal(blank.code, "unauthored");

    state = take(buy(state, "quarry.ins.01"));
    state = take(buy(state, "quarry.ins.05"));
    const leaf = commit(state, { t: "refund", id: "quarry.ins.01" }, catalog);
    assert.equal(leaf.ok, false);
    if (!leaf.ok) assert.equal(leaf.code, "orphan");
    state = take(commit(state, { t: "refund", id: "quarry.ins.05" }, catalog));
    state = take(commit(state, { t: "refund", id: "quarry.ins.01" }, catalog));

    state = take(commit(state, { t: "open-era", era: "era-2" }, catalog));
    const twice = commit(state, { t: "open-era", era: "era-2" }, catalog);
    assert.equal(twice.ok, false);
    state = take(buy(state, "sugar.ins.04"));
    assert.ok(state.owned["sugar.ins.04"]);
  });

  it("refuses incompatible effects and the equip caps", () => {
    let rich = freshState();
    for (const sourceId of SAMPLE_SOURCES.filter((s) => s.repeat === "campaign").map((s) => s.id)) {
      rich = take(grant(rich, sourceId));
    }
    rich = die(rich);

    const reaction = toggleEquip(
      take(toggleEquip(take(buy(take(buy(structuredClone(rich), "quarry.ins.01")), "creek.ins.03")), "quarry.ins.01", catalog)),
      "creek.ins.03",
      catalog,
    );
    assert.equal(reaction.ok, false);
    if (!reaction.ok) assert.match(reaction.error, /incompatible/i);

    let timing = structuredClone(rich);
    timing = take(buy(timing, "quarry.ins.01"));
    timing = take(buy(timing, "quarry.ins.05"));
    timing = take(buy(timing, "ash.ins.02"));
    timing = take(toggleEquip(timing, "quarry.ins.05", catalog));
    const timed = toggleEquip(timing, "ash.ins.02", catalog);
    assert.equal(timed.ok, false);
    if (!timed.ok) assert.match(timed.error, /timing/);

    let tools = structuredClone(rich);
    tools = take(buy(tools, "tool.31"));
    tools = take(buy(tools, "tool.32"));
    tools = take(toggleEquip(tools, "tool.31", catalog));
    const marks = toggleEquip(tools, "tool.32", catalog);
    assert.equal(marks.ok, false);

    let bodies = structuredClone(rich);
    bodies = take(buy(bodies, "quarry.ins.01"));
    bodies = take(buy(bodies, "form.01"));
    bodies = take(buy(bodies, "hollow.ins.01"));
    bodies = take(buy(bodies, "form.26"));
    bodies = take(toggleEquip(bodies, "form.01", catalog));
    const outlined = toggleEquip(bodies, "form.26", catalog);
    assert.equal(outlined.ok, false);

    let sockets = structuredClone(rich);
    for (const id of ["quarry.ins.02", "creek.ins.01", "hollow.ins.02", "ash.ins.01", "lantern.ins.04", "sugar.ins.01", "hollow.ins.01"]) {
      sockets = take(buy(sockets, id));
    }
    for (const id of ["quarry.ins.02", "creek.ins.01", "hollow.ins.02", "ash.ins.01", "lantern.ins.04", "sugar.ins.01"]) {
      sockets = take(toggleEquip(sockets, id, catalog));
    }
    assert.equal(sockets.loadout.sockets.length, 6);
    const seventh = toggleEquip(sockets, "hollow.ins.01", catalog);
    assert.equal(seventh.ok, false);
    if (!seventh.ok) assert.equal(seventh.code, "cap");

    const returned = take(commit(sockets, { t: "return" }, catalog));
    const locked = toggleEquip(returned, "quarry.ins.02", catalog);
    assert.equal(locked.ok, false);
    if (!locked.ok) assert.equal(locked.code, "bad-phase");
  });

  it("keeps a bound gift through respec and allows only one vow and one capstone", () => {
    const overlays = SAMPLE_OVERLAYS.map((row) => (row.id === "quarry.ins.02" ? { ...row, bound: true } : row));
    const bound = take(catalogFromSlots(overlays, SAMPLE_SOURCES));
    let state = take(commit(die(take(commit(freshState(), { t: "grant", sourceId: "src.discovery.green-shovel" }, bound))), { t: "grant-bound", id: "quarry.ins.02" }, bound));
    const bought = commit(state, { t: "purchase", id: "quarry.ins.02" }, bound);
    assert.equal(bought.ok, false);
    state = take(commit(state, { t: "purchase", id: "quarry.ins.01" }, bound));
    const before = wealth(state);
    state = take(commit(state, { t: "respec" }, bound));
    assert.equal(wealth(state), before);
    assert.deepEqual(Object.keys(state.owned), ["quarry.ins.02"]);

    const cap = take(createCatalog({
      records: [
        baseRecord({ id: "quarry.ins.12", role: "capstone", tier: 4, cost: 11, channel: "weight" }),
        baseRecord({ id: "creek.ins.12", role: "capstone", tier: 4, cost: 11, channel: "quiet", disciplines: ["creek"] }),
        baseRecord({ id: "cross.18", kind: "cross", role: "vow", tier: 3, cost: 7, channel: "vow-mark", disciplines: ["sugar", "ash"] }),
        baseRecord({ id: "cross.16", kind: "cross", role: "vow", tier: 3, cost: 7, channel: "vow-other", disciplines: ["quarry", "creek"] }),
      ],
      sources: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => source(`src.discovery.pack-${n}`, 4)),
    }));
    let rich = freshState();
    for (let n = 1; n <= 9; n++) rich = take(commit(rich, { t: "grant", sourceId: `src.discovery.pack-${n}` }, cap));
    rich = take(commit(rich, { t: "death", cause: "combat", deathSiteKey: "vein:1", cycle: 1 }, cap));
    for (const id of ["quarry.ins.12", "creek.ins.12", "cross.18", "cross.16"]) rich = take(commit(rich, { t: "purchase", id }, cap));
    rich = take(toggleEquip(rich, "quarry.ins.12", cap));
    const secondCap = toggleEquip(rich, "creek.ins.12", cap);
    assert.equal(secondCap.ok, false);
    if (!secondCap.ok) assert.equal(secondCap.code, "cap");
    rich = take(toggleEquip(rich, "cross.18", cap));
    const secondVow = toggleEquip(rich, "cross.16", cap);
    assert.equal(secondVow.ok, false);
    assert.equal(rich.loadout.capstone, "quarry.ins.12");
    assert.equal(rich.loadout.vow, "cross.18");
    const projected = projectRuntime(rich, cap);
    assert.equal(projected.libraryComplete, false);
    assert.ok(projected.attachments.every((row) => (HOST_VERBS as readonly string[]).includes(row.verb)));
  });
});

describe("saves and the game bind", () => {
  it("refuses inflated banks, skipped prereqs, duplicate rewards, and bad shapes", () => {
    const state = die(take(grant(freshState(), "src.discovery.green-shovel")));
    assert.equal(validateSave(state, catalog).ok, true);

    const inflated = { ...state, witnessBank: 9999 };
    const inflatedResult = validateSave(inflated, catalog);
    assert.equal(inflatedResult.ok, false);
    if (!inflatedResult.ok) assert.equal(inflatedResult.code, "invalid-save");

    const owned = { ...state, owned: { ...state.owned, "quarry.ins.12": { costPaid: 12, bound: false } } };
    assert.equal(validateSave(owned, catalog).ok, false);

    const loadout = {
      ...state,
      loadout: { ...state.loadout, sockets: ["quarry.ins.01"] },
    };
    assert.equal(validateSave(loadout, catalog).ok, false);

    const duplicated = structuredClone(state);
    duplicated.journal = [...duplicated.journal, duplicated.journal[0]!];
    assert.equal(validateSave(duplicated, catalog).ok, false);

    const forgedAmount = structuredClone(state);
    const grantEvent = forgedAmount.journal[0];
    assert.equal(grantEvent?.t, "grant");
    if (grantEvent?.t === "grant") grantEvent.amount = 99;
    forgedAmount.witnessBank = 99;
    const forged = validateSave(forgedAmount, catalog);
    assert.equal(forged.ok, false);
    if (!forged.ok) assert.equal(forged.code, "forged-event");

    assert.equal(validateSave({ ...state, witnessBank: -5 }, catalog).ok, false);
    assert.equal(validateSave({ ...state, version: 2 }, catalog).ok, false);
    assert.equal(validateSave({ ...state, extra: true }, catalog).ok, false);

    const bypass = validateSave(
      {
        ...freshState(),
        phase: "afterlife",
        cycle: 1,
        witnessBank: 0,
        lastDeathSite: "shrine:green",
        lastDeathCause: "release",
        suicideStreak: 1,
        owned: { "quarry.ins.12": { costPaid: 12, bound: false } },
        journal: [
          {
            t: "death",
            lifeId: "life-1",
            cycle: 1,
            cause: "release",
            deathSiteKey: "shrine:green",
            hollow: true,
            paid: 0,
            paidSources: [],
          },
          { t: "purchase", id: "quarry.ins.12", cost: 12 },
        ],
      },
      catalog,
    );
    assert.equal(bypass.ok, false);
  });

  it("mirrors a game save without spending skill points or paying for the death", () => {
    const game = {
      version: 8,
      cycle: 1,
      karma: -3,
      incarnation: "wanderer" as const,
      character: { name: "Ellis Perch", skillPoints: 5 },
      flags: {
        returnedFromDeath: true,
        lastDeed: "Fell in the quarry",
        afterlifeHost: "devil" as const,
        year: 2040,
      },
    };
    const snapshot = structuredClone(game);
    const died = take(deathFromGame(freshState(), game, { cause: "combat", deathSiteKey: "quarry:4,4" }, catalog));
    assert.deepEqual(game, snapshot);
    assert.equal(died.game.skillPoints, 5);
    assert.equal(died.game.host, "devil");
    assert.equal(died.witnessBank, 0);
    assert.equal(died.phase, "afterlife");
    assert.equal(died.game.saveVersion, 8);

    const again = deathFromGame(died, { ...game, cycle: 2 }, { cause: "combat", deathSiteKey: "quarry:4,4" }, catalog);
    assert.equal(again.ok, false);

    const stillDead = returnFromGame(died, game, catalog);
    assert.equal(stillDead.ok, false);
    const back = take(returnFromGame(died, { ...game, flags: { ...game.flags, returnedFromDeath: false } }, catalog));
    assert.equal(back.phase, "living");
    assert.equal(back.lifeId, "life-2");
    assert.equal(back.game.skillPoints, 5);
  });
});
