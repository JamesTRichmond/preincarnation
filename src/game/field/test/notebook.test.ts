import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceBeat,
  applyEncounterAction,
  beginEncounter,
  completion,
  evaluatePresence,
  freshSave,
  newOuting,
  recordOf,
  requestHint,
  setEra,
  setStation,
} from "../index.ts";
import { finishEncounter } from "./play.ts";

test("release can be repeated without minting the unique reward again", () => {
  const first = finishEncounter(setStation(freshSave(), "milkweed"), "monarch", "release");
  assert.equal(first.granted?.length, 1);
  assert.equal(first.save.records.monarch?.timesReleased, 1);
  assert.equal(evaluatePresence(first.save, "monarch").status, "fled");

  const noon = advanceBeat(first.save);
  assert.equal(evaluatePresence(noon, "monarch").status, "present");
  const second = finishEncounter(noon, "monarch", "release");
  assert.deepEqual(second.granted, []);
  assert.equal(second.save.records.monarch?.timesReleased, 2);
  assert.equal(second.save.records.monarch?.timesSeen, 2);
  assert.equal(second.save.records.monarch?.rewardsGranted.filter((id) => id === "monarch-flight").length, 1);
  assert.equal(completion(second.save).observed, 1);
  assert.equal(completion(second.save).optional, true);
});

test("a recipe is granted once, and a repeating note may be written again", () => {
  const kept = finishEncounter(setStation(freshSave(), "spring"), "brook-trout", "keep");
  assert.ok(kept.granted?.includes("Creek breakfast"));
  assert.equal(kept.save.records["brook-trout"]?.rewardsGranted.includes("creek-breakfast"), true);

  const again = finishEncounter(setStation(newOuting(kept.save), "spring"), "brook-trout", "keep");
  assert.equal(again.granted?.includes("Creek breakfast"), false);
  assert.equal(again.save.records["brook-trout"]?.timesKept, 2);
  assert.equal(
    again.save.records["brook-trout"]?.rewardsGranted.filter((id) => id === "creek-breakfast").length,
    1,
  );

  const released = finishEncounter(setStation(freshSave(), "spring"), "brook-trout", "release");
  const releasedAgain = finishEncounter(setStation(newOuting(released.save), "spring"), "brook-trout", "release");
  const notes = releasedAgain.save.journal.filter((line) => line.text === "The seep still holds fish");
  assert.equal(notes.length, 2);
  assert.equal(releasedAgain.save.records["brook-trout"]?.rewardsGranted.includes("trout-returned"), false);
});

test("keeping one animal does not remove the next quarter-hour's chance", () => {
  const kept = finishEncounter(setStation(setEra(freshSave(), "amber-gate"), "wall"), "woolly-bear", "keep");
  assert.equal(kept.save.records["woolly-bear"]?.timesKept, 1);
  assert.equal(evaluatePresence(kept.save, "woolly-bear").status, "fled");
  const later = advanceBeat(kept.save);
  assert.equal(evaluatePresence(later, "woolly-bear").status, "present");
  assert.equal(later.records["woolly-bear"]?.rewardsGranted.includes("ellis-lesson"), false);
});

test("era changes hide and restore a creature without erasing the notebook", () => {
  const seen = finishEncounter(setStation(freshSave(), "milkweed"), "monarch", "release");
  const winter = advanceBeat(setEra(seen.save, "locked-snow"));
  assert.equal(evaluatePresence(winter, "monarch").status, "absent");
  assert.equal(winter.records.monarch?.timesSeen, 1);
  assert.ok((winter.records.monarch?.lastNote.length ?? 0) > 0);
  const summer = setEra(winter, "green-crown");
  assert.equal(summer.records.monarch?.hintTier, 3);
  assert.equal(evaluatePresence(summer, "monarch").status, "present");
});

test("hints open in order and do not skip to the method", () => {
  const save = freshSave();
  const early = requestHint(save, "monarch");
  assert.equal(early.kind, "blocked");
  assert.equal(recordOf(early.save, "monarch").hintTier, 0);

  const visited = setStation(save, "milkweed");
  assert.equal(recordOf(visited, "monarch").hintTier, 1);
  const tooSoon = requestHint(visited, "monarch");
  assert.equal(tooSoon.kind, "blocked");
  assert.equal(recordOf(tooSoon.save, "monarch").hintTier, 1);

  const asked = requestHint(
    {
      ...visited,
      records: {
        ...visited.records,
        monarch: { ...recordOf(visited, "monarch"), timesMissed: 1, hintTier: 1 },
      },
    },
    "monarch",
  );
  assert.equal(asked.kind, "advance");
  assert.equal(recordOf(asked.save, "monarch").hintTier, 2);
  assert.match(asked.message, /Creep/);

  const missed = actuallyMiss(visited);
  assert.equal(recordOf(missed, "monarch").hintTier, 2);
  assert.equal(requestHint(missed, "monarch").kind, "ignored");
});

function actuallyMiss(save: ReturnType<typeof freshSave>) {
  const started = beginEncounter(save, "monarch").save;
  return applyEncounterAction(started, { type: "pace", pace: "hurry" }).save;
}
