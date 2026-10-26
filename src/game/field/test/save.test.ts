import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceBeat,
  beginEncounter,
  evaluatePresence,
  freshSave,
  hydrate,
  readSave,
  SAVE_VERSION,
  serialize,
  setEra,
  setHabitat,
  setStation,
  writeSave,
} from "../index.ts";
import type { KeyValueStore } from "../save.ts";
import { finishEncounter } from "./play.ts";

function memory(): KeyValueStore & { dump: Map<string, string> } {
  const dump = new Map<string, string>();
  return {
    dump,
    getItem(key) {
      return dump.has(key) ? (dump.get(key) ?? null) : null;
    },
    setItem(key, value) {
      dump.set(key, value);
    },
  };
}

test("save and load round-trip a mid-encounter notebook", () => {
  let save = setStation(setEra(freshSave(), "amber-gate"), "wall");
  save = beginEncounter(save, "woolly-bear").save;
  const raw = serialize(save);
  const loaded = hydrate(raw);
  assert.equal(loaded.version, SAVE_VERSION);
  assert.equal(loaded.world.era, "amber-gate");
  assert.equal(loaded.world.station, "wall");
  assert.equal(loaded.active?.creatureId, "woolly-bear");
  assert.equal(loaded.visited.includes("wall"), true);
  assert.equal(evaluatePresence(loaded, "woolly-bear").status, "present");
});

test("a corrupt save falls back, and a backup is kept", () => {
  const store = memory();
  const first = finishEncounter(setStation(freshSave(), "milkweed"), "monarch", "release");
  writeSave(store, "book", first.save);
  const second = advanceBeat(first.save);
  writeSave(store, "book", second);
  store.setItem("book", "{");
  const restored = readSave(store, "book");
  assert.equal(restored.records.monarch?.timesSeen, 1);
  assert.equal(restored.world.beat, first.save.world.beat);

  store.setItem("book", "{");
  store.setItem("book.bak", "nope");
  assert.equal(readSave(store, "book").records.monarch, undefined);
  assert.equal(hydrate("not json").epoch, 1);
});

test("an older notebook migrates seen names without wiping the new walk", () => {
  const loaded = hydrate(JSON.stringify({ version: 0, seen: ["monarch", "not-a-creature"] }));
  assert.equal(loaded.version, SAVE_VERSION);
  assert.equal(loaded.records.monarch?.timesSeen, 1);
  assert.equal(loaded.records.monarch?.hintTier, 3);
  assert.equal(loaded.records["not-a-creature"], undefined);
  const walked = setStation(loaded, "milkweed");
  assert.equal(evaluatePresence(walked, "monarch").status, "present");
});

test("era, habitat, and rewards survive a reload", () => {
  const kept = finishEncounter(setStation(freshSave(), "spring"), "brook-trout", "keep");
  const shifted = setHabitat(setEra(kept.save, "locked-snow"), "lincoln-gap");
  const store = memory();
  writeSave(store, "book", shifted);
  const loaded = readSave(store, "book");
  assert.equal(loaded.world.era, "locked-snow");
  assert.equal(loaded.world.habitatId, "lincoln-gap");
  assert.equal(loaded.records["brook-trout"]?.rewardsGranted.includes("creek-breakfast"), true);
  assert.equal(evaluatePresence(loaded, "brook-trout").status, "unavailable-habitat");
  const home = setHabitat(setEra(loaded, "green-crown"), "lantern-meadow");
  const back = setStation(home, "spring");
  assert.equal(evaluatePresence(back, "brook-trout").status, "fled");
  assert.equal(evaluatePresence(advanceBeat(advanceBeat(advanceBeat(advanceBeat(back)))), "brook-trout").status, "present");
});
