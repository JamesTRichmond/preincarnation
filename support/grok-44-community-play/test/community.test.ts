import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { playActivity } from "../src/adapters/play.ts";
import { clearLiveModules, registerLiveModule } from "../src/adapters/registry.ts";
import { fixtureLabel, integrationReport } from "../src/adapters/modules.ts";
import { FESTIVALS, festivalById } from "../src/festivals/index.ts";
import {
  abandonGathering,
  acknowledgeIntro,
  advanceWeek,
  amendCaption,
  beginFestival,
  captionFor,
  chooseHeat,
  declineFestival,
  fileGathering,
  heatsCount,
  isEligible,
  passFourteenYears,
  placeInRoom,
  prizesFor,
  toneOf,
  townIsReady,
  tuneAllowed,
  untoldNotes,
  withdrawHeat,
  REAL_TIME_WAIT_MS,
} from "../src/hub/engine.ts";
import { canPlayTune, letterIsOpen, spokenInterpretation } from "../src/memory/room.ts";
import { REWARDS, rewardById } from "../src/rewards/catalog.ts";
import { noteToFreq, TUNES } from "../src/rewards/tunes.ts";
import { behaviorFor, stanceFor } from "../src/rivals/progress.ts";
import { RIVALS } from "../src/rivals/roster.ts";
import { POSTINGS, isSeasonOpen, nextPosting } from "../src/schedule/calendar.ts";
import { createInitialSave, deserialize, persistSave, recordKey, serialize, type StorageLike } from "../src/save/save.ts";
import { ERA_IDS, FESTIVAL_IDS, MODULE_IDS, RIVAL_IDS } from "../src/types.ts";

afterEach(() => clearLiveModules());

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

describe("festivals", () => {
  it("ships six programs with four heats, hosts, access, and both eras", () => {
    assert.equal(FESTIVALS.length, 6);
    assert.deepEqual(
      FESTIVALS.map((festival) => festival.id).sort(),
      [...FESTIVAL_IDS].sort(),
    );
    for (const festival of FESTIVALS) {
      assert.equal(festival.activities.length, 4);
      assert.ok(RIVAL_IDS.includes(festival.hostRivalId));
      assert.ok(festival.rivals.length >= 4);
      assert.equal(new Set(festival.rivals).size, festival.rivals.length);
      assert.notEqual(festival.eraChanges["first-turning"], festival.eraChanges["the-return"]);
      assert.ok(festival.prizes.length >= 3);
      assert.ok(festival.untold.length > 40);
      assert.ok(festival.onDecline.length >= 1);
      for (const era of ERA_IDS) {
        assert.ok(festival.intro[era].length >= 4);
        for (const tone of ["warm", "mixed", "sour"] as const) {
          assert.ok(festival.closing[era][tone].length >= 3);
        }
      }
      for (const [index, activity] of festival.activities.entries()) {
        assert.ok(MODULE_IDS.includes(activity.moduleId));
        assert.ok(activity.accessible.label.length > 8);
        assert.ok(activity.accessible.why.length > 8);
        assert.ok(activity.decisions.length >= 3);
        assert.equal(activity.decisions.length, new Set(activity.decisions.map((d) => d.id)).size);
        assert.ok(activity.scene.length > 20);
        void index;
      }
      assert.equal(festival.openWeek, POSTINGS.find((posting) => posting.id === festival.id)?.openWeek);
    }
    const modules = new Set(FESTIVALS.flatMap((festival) => festival.activities.map((activity) => activity.moduleId)));
    for (const moduleId of MODULE_IDS) assert.ok(modules.has(moduleId));
    for (const rule of FESTIVALS.flatMap((festival) => festival.prizes)) {
      assert.ok(rewardById(rule.rewardId), rule.rewardId);
    }
  });
});

describe("rivals", () => {
  it("keeps twelve distinct people whose generations do not share a script", () => {
    assert.equal(RIVALS.length, 12);
    assert.equal(new Set(RIVALS.map((rival) => rival.wants)).size, 12);
    assert.equal(new Set(RIVALS.map((rival) => rival.voice)).size, 12);
    assert.equal(new Set(RIVALS.map((rival) => rival.competesOver)).size, 12);
    for (const rival of RIVALS) {
      assert.notEqual(rival.eras["first-turning"].behavior, rival.eras["the-return"].behavior);
      assert.notEqual(rival.eras["first-turning"].greeting, rival.eras["the-return"].greeting);
      const bare = { bond: 0, flags: [] as string[], lastLine: "" };
      const marked = behaviorFor(rival, { ...bare, flags: ["called-theo"] }, "the-return");
      if (rival.id === "theo-march") {
        assert.notEqual(marked, behaviorFor(rival, bare, "the-return"));
      }
    }
    const first = RIVALS.map((rival) => rival.eras["first-turning"].behavior);
    assert.equal(new Set(first).size, 12);
    assert.match(RIVALS.find((r) => r.id === "calder-brunt")!.eras["the-return"].behavior, /hand/i);
    assert.match(RIVALS.find((r) => r.id === "agnes-crowell")!.eras["the-return"].behavior, /seated|lower/i);
    assert.match(RIVALS.find((r) => r.id === "sable-okoye")!.eras["the-return"].behavior, /name|credit/i);
    assert.match(RIVALS.find((r) => r.id === "pete-lang")!.eras["the-return"].behavior, /knee|map/i);
  });

  it("moves stance when a heat changes the bond", () => {
    assert.equal(stanceFor(0), "untested");
    assert.equal(stanceFor(2), "competing");
    assert.equal(stanceFor(5), "tenderness");
    assert.equal(stanceFor(-3), "rupture");
  });
});

describe("adapters", () => {
  it("labels a missing module as a fixture and never as live play", () => {
    const save = acknowledgeIntro(beginFestival(createInitialSave(), "sap-night"));
    const festival = festivalById("sap-night");
    const result = playActivity({
      festival,
      activity: festival.activities[0],
      era: "first-turning",
      choice: { decisionId: "wait-for-sheet", useAccessible: false },
    });
    assert.equal(result.source, "authored-fixture");
    assert.equal(result.integration, "fixture-pending");
    assert.equal(result.fixtureLabel, fixtureLabel("cooking"));
    assert.match(result.fixtureLabel, /FIXTURE/);
    assert.match(result.fixtureLabel, /pending/);
    assert.match(result.fixtureLabel, /not loaded/);
    assert.equal(result.outcome, "excelled");
    assert.ok(save.inProgress);
    for (const row of integrationReport()) assert.equal(row.status, "fixture-pending");
  });

  it("uses a registered module without substituting a fixture", () => {
    registerLiveModule({
      moduleId: "cooking",
      ownerHint: "test-kitchen",
      play: () => ({
        outcome: "managed",
        narrative: "Played on the real stove.",
        rivalLines: [],
      }),
    });
    const festival = festivalById("sap-night");
    const result = playActivity({
      festival,
      activity: festival.activities[0],
      era: "first-turning",
      choice: { decisionId: "wait-for-sheet", useAccessible: false },
    });
    assert.equal(result.source, "live-module");
    assert.equal(result.integration, "live");
    assert.equal(result.fixtureLabel, null);
    assert.equal(result.narrative, "Played on the real stove.");
    assert.doesNotMatch(result.narrative, /FIXTURE/);
  });

  it("does not let a seated choice launder a bad boil, and Agnes changes with the era", () => {
    const festival = festivalById("sap-night");
    const activity = festival.activities[0];
    const bad = playActivity({
      festival,
      activity,
      era: "first-turning",
      choice: { decisionId: "darken-it", useAccessible: true },
    });
    assert.equal(bad.outcome, "faltered");
    assert.ok(bad.rivalLines.some((line) => line.rivalId === "agnes-crowell" && line.delta === -1));
    const good = playActivity({
      festival,
      activity,
      era: "the-return",
      choice: { decisionId: "wait-for-sheet", useAccessible: true },
    });
    assert.equal(good.outcome, "accessible-complete");
    assert.ok(good.rivalLines.some((line) => line.rivalId === "agnes-crowell" && line.delta === 1));
    const river = festivalById("river-sunday");
    const away = playActivity({
      festival: river,
      activity: river.activities[0],
      era: "first-turning",
      choice: { decisionId: "supper-cast", useAccessible: true },
    });
    assert.equal(away.rivalLines.some((line) => line.rivalId === "agnes-crowell"), false);
  });
});

describe("schedule and optionality", () => {
  it("opens Sap Night immediately and never waits on a clock", () => {
    assert.equal(REAL_TIME_WAIT_MS, 0);
    const save = createInitialSave();
    assert.equal(isEligible(save, "sap-night"), true);
    assert.equal(isEligible(save, "river-sunday"), false);
    assert.equal(isSeasonOpen(0, "sap-night"), true);
    const jumped = townIsReady(save);
    assert.equal(jumped.townWeek, nextPosting(0)?.openWeek);
    assert.equal(isEligible(jumped, "sap-night"), true);
    assert.equal(isEligible(jumped, "river-sunday"), true);
    const stepped = advanceWeek(save);
    assert.equal(stepped.townWeek, 1);
  });

  it("lets a life skip every gathering and still pass fourteen years", () => {
    let save = townIsReady(townIsReady(townIsReady(townIsReady(townIsReady(createInitialSave())))));
    assert.equal(save.townWeek, 20);
    for (const id of FESTIVAL_IDS) save = declineFestival(save, id);
    for (const id of FESTIVAL_IDS) assert.equal(isEligible(save, id), false);
    save = passFourteenYears(save);
    assert.equal(save.eraId, "the-return");
    assert.equal(save.townWeek, 0);
    assert.equal(isEligible(save, "sap-night"), true);
    assert.equal(untoldNotes(save).length, 6);
    assert.equal(save.grants.length, 0);
  });

  it("abandons a partial gathering without filing or keeping the bond swing", () => {
    let save = acknowledgeIntro(beginFestival(createInitialSave(), "sap-night"));
    const before = save.rivals["marigold-vesper"].bond;
    save = chooseHeat(save, { decisionId: "darken-it", useAccessible: false });
    assert.notEqual(save.rivals["marigold-vesper"].bond, before);
    save = abandonGathering(save);
    assert.equal(save.inProgress, null);
    assert.equal(save.rivals["marigold-vesper"].bond, before);
    assert.equal(save.attended[recordKey("first-turning", "sap-night")], undefined);
    assert.equal(isEligible(save, "sap-night"), true);
  });
});

describe("playthrough", () => {
  it("files an honest Sap Night, pays the tin, and carries Marigold into the return", () => {
    let save = acknowledgeIntro(beginFestival(createInitialSave(), "sap-night"));
    const choices = ["wait-for-sheet", "no-double", "keep-her-name", "play-the-hand"];
    for (const decisionId of choices) {
      save = chooseHeat(save, { decisionId, useAccessible: false });
    }
    assert.equal(save.inProgress?.phase, "closing");
    assert.equal(toneOf(save.inProgress!.results), "warm");
    assert.equal(heatsCount(save.inProgress!.results), true);
    save = fileGathering(save);
    const filed = save.attended[recordKey("first-turning", "sap-night")];
    assert.ok(filed);
    assert.ok(filed.prizeIds.includes("maple-tin"));
    assert.ok(filed.prizeIds.includes("tune-sap-watch"));
    assert.ok(save.storyFlags.includes("defended-sable"));
    assert.ok(save.rivals["marigold-vesper"].bond > 0);
    assert.equal(save.rivals["marigold-vesper"].lastLine.length > 0, true);
    const returned = passFourteenYears(save);
    assert.match(behaviorFor(RIVALS.find((r) => r.id === "sable-okoye")!, returned.rivals["sable-okoye"], "the-return"), /name/i);
    assert.equal(untoldNotes(returned).some((note) => note.includes("Sap Night")), false);
    assert.equal(isEligible(returned, "sap-night"), true);
  });

  it("withholds prizes when every heat is declined inside the door", () => {
    let save = townIsReady(createInitialSave());
    save = acknowledgeIntro(beginFestival(save, "river-sunday"));
    for (let i = 0; i < 4; i += 1) save = withdrawHeat(save);
    assert.equal(save.inProgress?.phase, "closing");
    save = fileGathering(save);
    assert.equal(save.attended[recordKey("first-turning", "river-sunday")], undefined);
    assert.equal(save.grants.length, 0);
  });
});

describe("memory", () => {
  it("only hangs what was earned, once, in the right kind of place", () => {
    let save = acknowledgeIntro(beginFestival(createInitialSave(), "sap-night"));
    for (const decisionId of ["wait-for-sheet", "no-double", "keep-her-name", "play-the-hand"]) {
      save = chooseHeat(save, { decisionId, useAccessible: false });
    }
    save = fileGathering(save);
    const blocked = placeInRoom(save, "trophies", 0, "sketch-lynx");
    assert.equal(blocked.memory.trophies[0], null);
    const hung = placeInRoom(save, "trophies", 0, "maple-tin");
    assert.equal(hung.memory.trophies[0], "maple-tin");
    const again = placeInRoom(hung, "trophies", 1, "maple-tin");
    assert.equal(again.memory.trophies[1], null);
    assert.equal(tuneAllowed(save, "tune-sap-watch"), true);
    assert.equal(tuneAllowed(save, "tune-midnight"), false);
    assert.equal(canPlayTune("tune-midnight", new Set()), false);
    const june = rewardById("letter-june");
    assert.ok(june);
    assert.equal(letterIsOpen(june, "first-turning"), false);
    assert.equal(letterIsOpen(june, "the-return"), true);
    const miscredit = rewardById("tune-last-set");
    assert.ok(miscredit);
    assert.equal(spokenInterpretation(miscredit, "first-turning", undefined), null);
    assert.equal(spokenInterpretation(miscredit, "the-return", undefined), miscredit.interpretation.wrong);
    assert.equal(spokenInterpretation(miscredit, "the-return", "amend"), miscredit.interpretation.fair);
    assert.equal(spokenInterpretation(miscredit, "the-return", "take-down"), null);
    const back = passFourteenYears(save);
    const amended = amendCaption(back, "tune-sap-watch", "amend");
    assert.match(captionFor(amended, "tune-sap-watch") ?? "", /Sable/);
  });
});

describe("save", () => {
  it("round-trips, rejects corrupt files, and keeps a backup", () => {
    const storage = new MemoryStorage();
    let save = acknowledgeIntro(beginFestival(createInitialSave(), "sap-night"));
    save = chooseHeat(save, { decisionId: "wait-for-sheet", useAccessible: true });
    persistSave(storage, save);
    const raw = storage.getItem("preincarnation-community-play-v1");
    assert.ok(raw);
    const loaded = deserialize(raw);
    assert.equal(loaded.inProgress?.festivalId, "sap-night");
    assert.equal(loaded.rivals["marigold-vesper"].bond, save.rivals["marigold-vesper"].bond);
    persistSave(storage, { ...loaded, townWeek: 3 });
    assert.ok(storage.getItem("preincarnation-community-play-v1-backup"));
    assert.equal(deserialize("not json").eraId, "first-turning");
    assert.equal(deserialize(JSON.stringify({ version: 0 })).townWeek, 0);
    assert.equal(deserialize(JSON.stringify({ version: 1, eraId: "nope" })).eraId, "first-turning");
    const partial = deserialize(JSON.stringify({ ...JSON.parse(serialize(save)), memory: {} }));
    assert.equal(partial.memory.trophies.length, 4);
    assert.equal(noteToFreq("A4"), 440);
    for (const tune of TUNES) {
      for (const note of tune.notes) assert.ok(note === "rest" || noteToFreq(note));
    }
  });
});

describe("prizes stay narrative", () => {
  it("does not invent a currency", () => {
    for (const reward of REWARDS) {
      assert.equal("price" in reward, false);
      assert.ok(reward.interpretation.fair !== reward.interpretation.wrong);
    }
    const ids = prizesFor("solstice-hearth", "the-return", "warm", [], []);
    assert.deepEqual(ids, []);
  });
});

