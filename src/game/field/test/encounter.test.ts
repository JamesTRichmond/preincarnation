import assert from "node:assert/strict";
import test from "node:test";
import {
  addPrep,
  advanceBeat,
  applyDisposition,
  applyEncounterAction,
  beginEncounter,
  evaluatePresence,
  freshSave,
  leaveEncounter,
  setEra,
  setHabitat,
  setLight,
  setStation,
  setWeather,
} from "../index.ts";
import { finishEncounter } from "./play.ts";

function atMilkweed() {
  return setStation(freshSave(), "milkweed");
}

test("a monarch is present on a fair morning and absent for stated reasons", () => {
  const there = evaluatePresence(atMilkweed(), "monarch");
  assert.equal(there.status, "present");

  const wrongBank = evaluatePresence(freshSave(), "monarch");
  assert.equal(wrongBank.status, "absent");
  assert.match(wrongBank.status === "absent" ? wrongBank.reason : "", /Not on this bank/);

  const winter = evaluatePresence(setEra(atMilkweed(), "locked-snow"), "monarch");
  assert.equal(winter.status, "absent");
  assert.match(winter.status === "absent" ? winter.reason : "", /Wrong season/);

  let dark = atMilkweed();
  dark = advanceBeat(advanceBeat(advanceBeat(dark)));
  assert.equal(dark.world.beat, "true-dark");
  const night = evaluatePresence(dark, "monarch");
  assert.equal(night.status, "absent");
  assert.match(night.status === "absent" ? night.reason : "", /quarter-hour/);
});

test("a missed sweep flees only this quarter-hour", () => {
  let save = atMilkweed();
  save = beginEncounter(save, "monarch").save;
  save = applyEncounterAction(save, { type: "pace", pace: "creep" }).save;
  save = applyEncounterAction(save, { type: "marks", markIds: ["veins", "border"] }).save;
  const missed = applyEncounterAction(save, { type: "tool", tool: "net", timing: "early" });
  assert.equal(missed.kind, "miss");
  assert.equal(missed.save.active, null);
  assert.equal(missed.save.records.monarch?.timesMissed, 1);
  assert.equal(missed.save.records.monarch?.timesSeen, 0);
  assert.equal(evaluatePresence(missed.save, "monarch").status, "fled");

  const later = advanceBeat(missed.save);
  assert.equal(later.world.beat, "noon");
  assert.equal(evaluatePresence(later, "monarch").status, "present");
  const again = finishEncounter(later, "monarch", "release");
  assert.equal(again.save.records.monarch?.timesSeen, 1);
  assert.equal(again.save.records.monarch?.rewardsGranted.includes("monarch-flight"), true);
});

test("a wrong sketch can be corrected once, and a second lie ends the look", () => {
  let save = beginEncounter(atMilkweed(), "monarch").save;
  save = applyEncounterAction(save, { type: "pace", pace: "creep" }).save;
  const retry = applyEncounterAction(save, { type: "marks", markIds: ["tails"] });
  assert.equal(retry.kind, "sketch-retry");
  assert.ok(retry.save.active);
  const gone = applyEncounterAction(retry.save, { type: "marks", markIds: ["eyespots"] });
  assert.equal(gone.kind, "miss");
  assert.equal(evaluatePresence(gone.save, "monarch").status, "fled");
  assert.equal(evaluatePresence(advanceBeat(gone.save), "monarch").status, "present");
});

test("an irrelevant gesture does not spook, and leaving before you start does not either", () => {
  const save = beginEncounter(atMilkweed(), "monarch").save;
  const ignored = applyEncounterAction(save, { type: "sound", sound: "whistle" });
  assert.equal(ignored.kind, "ignored");
  assert.equal(ignored.save.records.monarch?.timesMissed ?? 0, 0);
  assert.ok(ignored.save.active);
  const left = leaveEncounter(ignored.save);
  assert.equal(left.kind, "ignored");
  assert.equal(evaluatePresence(left.save, "monarch").status, "present");
});

test("keeping is refused for a monarch and does not consume the meeting", () => {
  let save = beginEncounter(atMilkweed(), "monarch").save;
  save = applyEncounterAction(save, { type: "pace", pace: "creep" }).save;
  save = applyEncounterAction(save, {
    type: "marks",
    markIds: ["veins", "border"],
  }).save;
  save = applyEncounterAction(save, { type: "tool", tool: "net", timing: "on-tell" }).save;
  const kept = applyDisposition(save, "keep");
  assert.equal(kept.kind, "blocked");
  assert.ok(kept.save.active);
  assert.equal(kept.save.records.monarch?.timesSeen ?? 0, 0);
});

test("both crayfish can be under the same turned stone, and one catch does not erase the other", () => {
  let save = setStation(freshSave(), "creek");
  save = addPrep(save, "turn-stone");
  assert.equal(evaluatePresence(save, "clearwater-crayfish").status, "present");
  assert.equal(evaluatePresence(save, "rusty-crayfish").status, "present");
  const caught = finishEncounter(save, "clearwater-crayfish", "release");
  assert.equal(evaluatePresence(caught.save, "clearwater-crayfish").status, "fled");
  assert.equal(evaluatePresence(caught.save, "rusty-crayfish").status, "present");
  const blocked = beginEncounter(caught.save, "clearwater-crayfish");
  assert.equal(blocked.kind, "blocked");
});

test("the year-moth has two windows, and a salamander has two ways under the log", () => {
  const vein = setStation(setEra(freshSave(), "vein-night"), "lantern");
  assert.equal(evaluatePresence(vein, "year-moth").status, "present");

  let amber = setStation(setEra(freshSave(), "amber-gate"), "lantern");
  amber = advanceBeat(advanceBeat(amber));
  assert.equal(amber.world.beat, "dusk");
  assert.equal(evaluatePresence(amber, "year-moth").status, "absent");
  amber = setLight(amber, "dim");
  assert.equal(evaluatePresence(amber, "year-moth").status, "present");

  let dry = setStation(freshSave(), "log");
  dry = addPrep(dry, "turn-log");
  assert.equal(evaluatePresence(dry, "red-backed-salamander").status, "absent");
  dry = addPrep(dry, "palm-water");
  assert.equal(evaluatePresence(dry, "red-backed-salamander").status, "present");

  let wet = setWeather(setStation(freshSave(), "log"), "after-rain");
  wet = addPrep(wet, "turn-log");
  assert.equal(evaluatePresence(wet, "red-backed-salamander").status, "present");
});

test("a habitat that is not today's walk cannot be caught", () => {
  const elsewhere = setHabitat(freshSave(), "dead-creek");
  const presence = evaluatePresence(elsewhere, "monarch");
  assert.equal(presence.status, "unavailable-habitat");
  if (presence.status === "unavailable-habitat") assert.equal(presence.habitatId, "lantern-meadow");
  const started = beginEncounter(elsewhere, "monarch");
  assert.equal(started.kind, "blocked");

  let gap = setHabitat(freshSave(), "lincoln-gap");
  gap = setEra(gap, "mudlight");
  assert.equal(evaluatePresence(gap, "wood-frog").status, "present");
  assert.equal(evaluatePresence(gap, "monarch").status, "unavailable-habitat");
  const noted = finishEncounter(gap, "wood-frog", "release");
  assert.equal(noted.save.records["wood-frog"]?.timesSeen, 1);
});

test("a hurry or a net on the wrong animal is a real miss", () => {
  const hurried = applyEncounterAction(beginEncounter(atMilkweed(), "monarch").save, {
    type: "pace",
    pace: "hurry",
  });
  assert.equal(hurried.kind, "miss");

  let bees = setStation(freshSave(), "goldenrod");
  bees = beginEncounter(bees, "bumblebee").save;
  bees = applyEncounterAction(bees, { type: "sound", sound: "quiet" }).save;
  bees = applyEncounterAction(bees, {
    type: "marks",
    markIds: ["basket", "pile"],
  }).save;
  const netted = applyEncounterAction(bees, { type: "tool", tool: "net", timing: "on-tell" });
  assert.equal(netted.kind, "miss");
  assert.equal(netted.save.records.bumblebee?.timesSeen, 0);
});

