import assert from "node:assert/strict";
import test from "node:test";
import { applyPreset, runBeat } from "../src/index.ts";
import { sceneNotes } from "../ui/speak.ts";

test("a true counter is said in words", () => {
  const session = applyPreset([1]);
  const beat = runBeat(session, { kind: "counter", counterMs: 40, facing: "N", useCharge: true });
  const notes = sceneNotes("counter", beat.facts);
  assert.ok(notes.some((line) => line.includes("Stone opens")));
});

test("a late counter does not open stone", () => {
  const session = applyPreset([1]);
  const beat = runBeat(session, { kind: "counter", counterMs: 180, facing: "N", useCharge: true });
  const notes = sceneNotes("counter", beat.facts);
  assert.ok(notes.some((line) => line.includes("stays shut")));
});
