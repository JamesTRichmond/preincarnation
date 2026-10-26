import assert from "node:assert/strict";
import { test } from "node:test";
import type { Actions } from "../input.ts";
import { debugHook, debugLand, keepFish } from "./sim/session.ts";
import { stepTension } from "./sim/tension.ts";
import { arriveAtWater, createCreekPilot, spoilCatch, waterForMap } from "./bridge.ts";

const quiet = (): Actions => ({
  scheme: "keyboard",
  moveX: 0,
  moveY: 0,
  fromKeys: true,
  attack: false,
  attackPressed: false,
  interact: false,
  interactPressed: false,
  release: false,
  pausePressed: false,
  bombPressed: false,
  dashPressed: false,
  cyclePressed: false,
  usePressed: false,
  item: false,
  itemPressed: false,
  pointerHeld: false,
  pointerTap: false,
  pointerHoldEnd: false,
  pointerCanceled: false,
  pointerBtn: 0,
  pointerClientX: 0,
  pointerClientY: 0,
});

const keys = (codes: string[] = []) => ({
  has(code: string) {
    return codes.includes(code);
  },
});

test("A aims left and D aims right on the bank", () => {
  const pilot = createCreekPilot();
  pilot.enter("bristol", 15, true);
  const start = pilot.aimX() ?? 0;
  const left = quiet();
  left.moveX = -1;
  for (let i = 0; i < 40; i++) pilot.step(1 / 60, left, keys(["KeyA"]), 15);
  const afterLeft = pilot.aimX() ?? 0;
  assert.ok(afterLeft < start, `A should decrease aimX (${start} -> ${afterLeft})`);
  const right = quiet();
  right.moveX = 1;
  for (let i = 0; i < 40; i++) pilot.step(1 / 60, right, keys(["KeyD"]), 15);
  assert.ok((pilot.aimX() ?? 0) > afterLeft);
});

test("cancelling a cast returns to the bank and does not recast while held", () => {
  const pilot = createCreekPilot();
  pilot.enter("middlebury", 11, true);
  const hold = quiet();
  hold.attack = true;
  pilot.step(1 / 60, hold, keys(), 11);
  assert.equal(pilot.session()?.phase, "charging");
  const cancel = quiet();
  cancel.interactPressed = true;
  pilot.step(1 / 60, cancel, keys(), 11);
  assert.equal(pilot.session()?.phase, "aiming");
  const still = quiet();
  still.attack = true;
  pilot.step(1 / 60, still, keys(), 11);
  assert.equal(pilot.session()?.phase, "aiming");
});

test("losing focus pauses the fight and a paused step does not move tension", () => {
  const pilot = createCreekPilot();
  pilot.enter("addison", 18, true);
  const session = pilot.session();
  assert.ok(session);
  debugHook(session, "northern-pike");
  const before = session.fight?.tension ?? 0;
  pilot.hide();
  assert.equal(session.paused, true);
  const mash = quiet();
  mash.attack = true;
  pilot.step(1 / 60, mash, keys(), 18);
  assert.equal(session.fight?.tension, before);
  assert.equal(stepTension({
    tension: Number.NaN,
    fishForce: 9,
    pressure: 9,
    giveLine: false,
    ceiling: 0,
    dt: 4,
    overSeconds: 0,
    grace: 0.2,
  }).tension <= 1.25, true);
});

test("a repeated keep is a duplicate and a full creel can swap once", () => {
  const pilot = createCreekPilot();
  pilot.enter("ferrisburgh", 12, true);
  const session = pilot.session();
  assert.ok(session);
  debugLand(session, "yellow-perch");
  const press = () => {
    const actions = quiet();
    actions.attackPressed = true;
    return pilot.step(1 / 60, actions, keys(), 12);
  };
  press();
  assert.equal(session.save.creel.length, 1);
  const dup = keepFish(session);
  assert.equal(dup.ok, false);
  if (!dup.ok) assert.equal(dup.reason, "duplicate");
  assert.equal(session.save.creel.length, 1);
  debugLand(session, "pumpkinseed");
  press();
  debugLand(session, "fallfish");
  press();
  debugLand(session, "brown-bullhead");
  press();
  assert.equal(session.save.creel.length, 4);
  debugLand(session, "walleye");
  const full = press();
  assert.equal(full.regard, 0);
  assert.match(session.line, /Creel is full/);
  const swap = quiet();
  swap.cyclePressed = true;
  pilot.step(1 / 60, swap, keys(), 12);
  assert.equal(session.save.creel.length, 4);
  assert.equal(session.save.creel.some((fish) => fish.speciesId === "walleye"), true);
});

test("eating a kept fish happens once and release pays regard once", () => {
  const pilot = createCreekPilot();
  pilot.enter("vergennes", 16, true);
  const session = pilot.session();
  assert.ok(session);
  debugLand(session, "pumpkinseed");
  const keep = quiet();
  keep.attackPressed = true;
  pilot.step(1 / 60, keep, keys(), 16);
  const eat = quiet();
  eat.usePressed = true;
  assert.equal(typeof pilot.tryEat(eat), "string");
  assert.equal(pilot.tryEat(eat), undefined);
  assert.equal(session.save.creel.length, 0);
  debugLand(session, "yellow-perch");
  const putBack = quiet();
  putBack.interactPressed = true;
  const paid = pilot.step(1 / 60, putBack, keys(), 16);
  const paidAgain = pilot.step(1 / 60, putBack, keys(), 16);
  assert.equal(paid.regard, 1);
  assert.equal(paidAgain.regard, 0);
});

test("death keeps the notes and drops the creel", () => {
  const pilot = createCreekPilot();
  pilot.enter("bristol", 15, true);
  const session = pilot.session();
  assert.ok(session);
  debugLand(session, "brook-trout");
  const keep = quiet();
  keep.attackPressed = true;
  pilot.step(1 / 60, keep, keys(), 15);
  const spoiled = spoilCatch(pilot.blob());
  assert.ok(spoiled);
  assert.equal(spoiled.session.save.creel.length, 0);
  assert.ok(spoiled.session.save.journal["brook-trout"]);
  assert.equal(spoiled.session.phase, "resolved");
});

test("the county map picks a real water and does not wipe the journal", () => {
  assert.equal(waterForMap("middlebury"), "middlebury-evening");
  assert.equal(waterForMap("addison"), "dead-creek-weeds");
  const pilot = createCreekPilot();
  pilot.enter("bristol", 15, true);
  const session = pilot.session();
  assert.ok(session);
  debugLand(session, "fallfish");
  const keep = quiet();
  keep.attackPressed = true;
  pilot.step(1 / 60, keep, keys(), 15);
  session.phase = "resolved";
  arriveAtWater(session, "middlebury", 19);
  assert.equal(session.locationId, "middlebury-evening");
  assert.equal(session.save.creel.length, 1);
  assert.equal(session.hour, 19);
});
